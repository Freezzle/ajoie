package ch.salon.service.registration;

import ch.salon.domain.Address;
import ch.salon.domain.Conference;
import ch.salon.domain.Exhibitor;
import ch.salon.domain.Participation;
import ch.salon.domain.PriceStandSalon;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.*;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.repository.WorkshopRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.security.tenant.TransactionalTenantOperation;
import ch.salon.service.EventLogService;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.RefreshInvoicingPlansService;
import ch.salon.service.StandPictureService;
import ch.salon.service.dto.ImageUploadDTO;
import ch.salon.service.dto.registration.PublicDimensionDTO;
import ch.salon.service.dto.registration.PublicPricesDTO;
import ch.salon.service.dto.registration.PublicSalonInfoDTO;
import ch.salon.service.dto.registration.RegistrationAddressDTO;
import ch.salon.service.dto.registration.RegistrationExhibitorDTO;
import ch.salon.service.dto.registration.RegistrationParticipationDTO;
import ch.salon.service.dto.registration.RegistrationRequestDTO;
import ch.salon.service.dto.registration.RegistrationResponseDTO;
import ch.salon.service.dto.registration.RegistrationStandDTO;
import ch.salon.service.dto.registration.RegistrationTalkDTO;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Service d'inscription publique des exposants.
 * <p>
 * Les endpoints publics sont anonymes : le contexte multi-tenant doit être résolu à partir de
 * l'identifiant du salon (requête native non filtrée) puis installé via
 * {@link TenantContextHolder#runAsTenant}. La transaction est ouverte <b>après</b> la mise en place
 * du contexte grâce à {@link TransactionalTenantOperation}.
 */
@Service
@RequiredArgsConstructor
public class PublicRegistrationService {

    public static final String ENTITY_NAME = "registration";

    private static final Logger LOGGER = LoggerFactory.getLogger(PublicRegistrationService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;

    private final SalonRepository salonRepository;
    private final StandRepository standRepository;
    private final ExhibitorRepository exhibitorRepository;
    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final ParticipationRepository participationRepository;
    private final RefreshInvoicingPlansService refreshInvoicingPlansService;
    private final EventLogService eventLogService;
    private final RegistrationEmailService registrationEmailService;
    private final StandPictureService standPictureService;
    private final TransactionalTenantOperation transactionalOps;

    // -------------------- API PUBLIQUE --------------------

    public PublicSalonInfoDTO getSalonInfo(UUID salonId) {
        UUID tenantId = resolveTenant(salonId);

        return TenantContextHolder.runAsTenant(tenantId,
                () -> transactionalOps.executeReadOnlyAndReturn(() -> toPublicSalonInfo(loadSalon(salonId))));
    }

    public RegistrationResponseDTO register(UUID salonId, RegistrationRequestDTO request) {
        UUID tenantId = resolveTenant(salonId);

        RegistrationResult result = TenantContextHolder.runAsTenant(tenantId,
                () -> transactionalOps.executeAndReturn(() -> doRegister(salonId, request)));

        registrationEmailService.sendRegistrationReceived(tenantId, result.participationId(), salonId,
                result.registrationToken());

        return new RegistrationResponseDTO(result.participationId(), result.firstName(), result.email());
    }

    public RegistrationRequestDTO getRegistration(UUID salonId, UUID participationId, String token) {
        UUID tenantId = resolveTenant(salonId);

        return TenantContextHolder.runAsTenant(tenantId, () -> transactionalOps.executeReadOnlyAndReturn(() -> {
            Participation participation = loadParticipationByToken(salonId, participationId, token);
            return toRequest(participation);
        }));
    }

    public RegistrationResponseDTO updateRegistration(UUID salonId, UUID participationId, String token,
            RegistrationRequestDTO request) {
        UUID tenantId = resolveTenant(salonId);

        return TenantContextHolder.runAsTenant(tenantId,
                () -> transactionalOps.executeAndReturn(() -> doUpdate(salonId, participationId, token, request)));
    }

    // -------------------- TENANT --------------------

    /**
     * Résout le tenant propriétaire du salon sans filtrage multi-tenant (requête native).
     */
    private UUID resolveTenant(UUID salonId) {
        return salonRepository.findTenantIdBySalonId(salonId).orElseThrow(
                () -> new BadRequestAlertException("Salon introuvable", ENTITY_NAME, "registration.salon-not-found"));
    }

    // -------------------- CREATION --------------------

    private RegistrationResult doRegister(UUID salonId, RegistrationRequestDTO request) {
        Salon salon = loadSalon(salonId);
        assertRegistrationOpen(salon);
        validateBusinessRules(request);

        String email = normalizeEmail(request.getExhibitor().getEmail());
        if (participationRepository.findByExhibitorEmailAndSalonId(email, salonId) != null) {
            throw new BadRequestAlertException("Une inscription existe déjà pour cet e-mail", ENTITY_NAME,
                    "registration.already-registered");
        }

        Instant now = Instant.now();
        Exhibitor exhibitor = upsertExhibitor(request.getExhibitor(), email, now);

        Participation participation = new Participation();
        participation.setClientNumber(
                Participation.incrementClientNumber(participationRepository.findMaxClientNumber(salonId),
                        salon.getReferenceNumber()));
        participation.setSalon(salon);
        participation.setExhibitor(exhibitor);
        participation.setRegistrationDate(now);
        participation.setStatus(Status.IN_VERIFICATION);
        participation.setPublicRegistration(true);
        participation.setRegistrationToken(generateToken());
        participation.setCrushOfHeart(false);
        participation.setGuestOfHonor(false);
        participation.setNeedArrangement(false);
        participation.setExtraInformation(null);
        applyParticipation(participation, request.getParticipation(), exhibitor);
        participation = participationRepository.save(participation);

        createServices(participation, request, now, StandCarryOver.empty());

        eventLogService.eventFromSystem("Inscription en ligne reçue", EventType.EVENT, EntityType.PARTICIPATION,
                participation.getId(), null);

        refreshInvoicingPlansService.refreshInvoicingPlans(participation.getId().toString());

        return new RegistrationResult(participation.getId(), participation.getRegistrationToken(),
                exhibitor.getFirstName(), exhibitor.getEmail());
    }

    // -------------------- MODIFICATION --------------------

    private RegistrationResponseDTO doUpdate(UUID salonId, UUID participationId, String token,
            RegistrationRequestDTO request) {
        Salon salon = loadSalon(salonId);
        Participation participation = loadEditableParticipation(salonId, participationId, token);
        validateBusinessRules(request);

        assertServicesEditable(participationId);

        Exhibitor exhibitor = participation.getExhibitor();
        // L'e-mail est volontairement ignoré : le lien de modification y est rattaché.
        applyExhibitor(exhibitor, request.getExhibitor());
        exhibitorRepository.save(exhibitor);

        applyParticipation(participation, request.getParticipation(), exhibitor);
        participation = participationRepository.save(participation);

        List<Stand> existingStands = standRepository.findByParticipationIdOrderByRegistrationDateDesc(participationId);
        // Les prestations sont supprimées puis recréées : on met de côté ce que le public ne peut pas
        // modifier (lien historique Google Drive) ainsi que les images déjà envoyées.
        StandCarryOver carryOver = captureCarryOver(existingStands);

        standRepository.deleteAll(existingStands);
        conferenceRepository.deleteAll(
                conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(participationId));
        workshopRepository.deleteAll(
                workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(participationId));
        standRepository.flush();
        conferenceRepository.flush();
        workshopRepository.flush();

        createServices(participation, request, Instant.now(), carryOver);

        eventLogService.eventFromSystem("Inscription en ligne modifiée par l'exposant", EventType.EVENT,
                EntityType.PARTICIPATION, participation.getId(), null);

        refreshInvoicingPlansService.refreshInvoicingPlans(participation.getId().toString());

        LOGGER.info("Public registration {} updated on salon {}", participationId, salon.getId());

        return new RegistrationResponseDTO(participation.getId(), exhibitor.getFirstName(), exhibitor.getEmail());
    }

    private void assertServicesEditable(UUID participationId) {
        boolean locked =
                standRepository.findByParticipationIdOrderByRegistrationDateDesc(participationId).stream().anyMatch(
                        s -> s.getStatus() != Status.IN_VERIFICATION) ||
                        conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(participationId).stream()
                                            .anyMatch(c -> c.getStatus() != Status.IN_VERIFICATION) ||
                        workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(participationId).stream()
                                          .anyMatch(w -> w.getStatus() != Status.IN_VERIFICATION);

        if (locked) {
            throw new BadRequestAlertException("Inscription déjà en cours de traitement", ENTITY_NAME,
                    "registration.not-editable");
        }
    }

    private Participation loadParticipationByToken(UUID salonId, UUID participationId, String token) {
        Participation participation = participationRepository.findById(participationId).orElseThrow(
                () -> new BadRequestAlertException("Inscription introuvable", ENTITY_NAME,
                        "registration.link-invalid"));

        boolean validToken = StringUtils.isNotBlank(token) &&
                StringUtils.isNotBlank(participation.getRegistrationToken()) &&
                java.security.MessageDigest.isEqual(participation.getRegistrationToken().getBytes(),
                        token.getBytes());

        if (!validToken || participation.getSalon() == null ||
                !salonId.equals(participation.getSalon().getId())) {
            throw new BadRequestAlertException("Lien de modification invalide", ENTITY_NAME,
                    "registration.link-invalid");
        }

        return participation;
    }

    private Participation loadEditableParticipation(UUID salonId, UUID participationId, String token) {
        Participation participation = loadParticipationByToken(salonId, participationId, token);

        if (participation.getStatus() != Status.IN_VERIFICATION) {
            throw new BadRequestAlertException("Inscription déjà traitée", ENTITY_NAME, "registration.not-editable");
        }

        return participation;
    }

    // -------------------- MAPPINGS --------------------

    private Salon loadSalon(UUID salonId) {
        return salonRepository.findById(salonId).orElseThrow(
                () -> new BadRequestAlertException("Salon introuvable", ENTITY_NAME, "registration.salon-not-found"));
    }

    private PublicSalonInfoDTO toPublicSalonInfo(Salon salon) {
        PublicSalonInfoDTO dto = new PublicSalonInfoDTO();
        dto.setId(salon.getId());
        dto.setPlace(salon.getPlace());
        dto.setStartingDate(salon.getStartingDate());
        dto.setEndingDate(salon.getEndingDate());
        dto.setRegistrationOpeningDate(salon.getRegistrationOpeningDate());
        dto.setRegistrationClosingDate(salon.getRegistrationClosingDate());
        dto.setRegistrationWelcomeTitle(salon.getRegistrationWelcomeTitle());
        dto.setRegistrationWelcomeText(salon.getRegistrationWelcomeText());
        dto.setRegistrationChartText(salon.getRegistrationChartText());
        dto.setRegistrationSalonChartText(salon.getRegistrationSalonChartText());

        String closedReason = computeClosedReason(salon);
        dto.setClosedReason(closedReason);
        dto.setRegistrationOpen(closedReason == null);

        // Les dimensions sont toujours exposées : elles restent nécessaires lorsqu'un exposant
        // modifie son inscription après la fermeture des inscriptions.
        dto.setDimensions(salon.getPriceStandSalons().stream()
                               .sorted(Comparator.comparing(PriceStandSalon::getDimension,
                                       Comparator.nullsLast(String::compareToIgnoreCase)))
                               .map(d -> new PublicDimensionDTO(d.getId(), d.getDimension(), d.getWidthMeter(),
                                       d.getHeightMeter(), d.getPrice()))
                               .toList());

        PublicPricesDTO prices = new PublicPricesDTO();
        prices.setPriceMeal1(salon.getPriceMeal1());
        prices.setPriceMeal2(salon.getPriceMeal2());
        prices.setPriceMeal3(salon.getPriceMeal3());
        prices.setPriceConference(salon.getPriceConference());
        prices.setPriceWorkshop(salon.getPriceWorkshop());
        prices.setPriceSharingStand(salon.getPriceSharingStand());
        prices.setPricePostalFee(InvoicingPlanService.POSTAL_FEE_AMOUNT);
        dto.setPrices(prices);

        return dto;
    }

    private RegistrationRequestDTO toRequest(Participation participation) {
        Exhibitor exhibitor = participation.getExhibitor();

        RegistrationExhibitorDTO exhibitorDTO = new RegistrationExhibitorDTO();
        exhibitorDTO.setFirstName(exhibitor.getFirstName());
        exhibitorDTO.setLastName(exhibitor.getLastName());
        exhibitorDTO.setEmail(exhibitor.getEmail());
        exhibitorDTO.setPhoneNumber(exhibitor.getPhoneNumber());
        exhibitorDTO.setLanguage(exhibitor.getLanguage());
        exhibitorDTO.setHomeAddress(toAddressDTO(exhibitor.getHomeAddress()));
        exhibitorDTO.setDifferentBillingAddress(Boolean.TRUE.equals(exhibitor.getDifferentBillingAddress()));
        exhibitorDTO.setBillingAddress(toAddressDTO(exhibitor.getBillingAddress()));
        exhibitorDTO.setNewsletter(exhibitor.isNewsletter());

        RegistrationParticipationDTO participationDTO = new RegistrationParticipationDTO();
        participationDTO.setTherapistName(participation.getTherapistName());
        participationDTO.setNbMeal1(nullSafe(participation.getNbMeal1()));
        participationDTO.setNbMeal2(nullSafe(participation.getNbMeal2()));
        participationDTO.setNbMeal3(nullSafe(participation.getNbMeal3()));
        participationDTO.setModePaymentMeals(participation.getModePaymentMeals());
        participationDTO.setInvoiceSendingMethod(participation.getInvoiceSendingMethod());
        participationDTO.setHasOffer(Boolean.TRUE.equals(participation.getHasOffer()));
        participationDTO.setOffer(participation.getOffer());
        participationDTO.setAdditionnalInformation(participation.getAdditionnalInformation());
        participationDTO.setAcceptedChart(Boolean.TRUE.equals(participation.getAcceptedChart()));
        participationDTO.setAcceptedContract(Boolean.TRUE.equals(participation.getAcceptedContract()));

        RegistrationRequestDTO request = new RegistrationRequestDTO();
        request.setStatus(participation.getStatus());
        request.setExhibitor(exhibitorDTO);
        request.setParticipation(participationDTO);

        request.setStands(standRepository.findByParticipationIdOrderByRegistrationDateDesc(participation.getId())
                                         .stream().map(this::toStandDTO).toList());
        request.setConferences(
                conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(participation.getId()).stream()
                                    .map(c -> toTalkDTO(c.getTitle(), c.getDescription())).toList());
        request.setWorkshops(
                workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(participation.getId()).stream()
                                  .map(w -> toTalkDTO(w.getTitle(), w.getDescription())).toList());

        return request;
    }

    private void applyCoExhibitor(Stand stand, RegistrationStandDTO standDTO, StandCarryOver carryOver) {
        if (!standDTO.isShared()) {
            stand.setSharedFirstName(null);
            stand.setSharedLastName(null);
            stand.setSharedTherapistName(null);
            stand.setSharedEmail(null);
            stand.setSharedDescription(null);
            stand.setSharedCategory(null);
            stand.setSharedSubCategories(new LinkedHashSet<>());
            stand.setSharedWebsite(null);
            stand.setSharedInstagram(null);
            stand.setSharedFacebook(null);
            stand.setSharedUrlPicture(null);
            return;
        }

        stand.setSharedFirstName(sub(standDTO.getSharedFirstName(), 100));
        stand.setSharedLastName(sub(standDTO.getSharedLastName(), 100));
        stand.setSharedTherapistName(sub(standDTO.getSharedTherapistName(), 100));
        stand.setSharedEmail(sub(standDTO.getSharedEmail(), 100));
        stand.setSharedDescription(sub(standDTO.getSharedDescription(), 500));
        stand.setSharedCategory(standDTO.getSharedCategory());
        stand.setSharedSubCategories(
                standDTO.getSharedSubCategories() != null ? new LinkedHashSet<>(standDTO.getSharedSubCategories()) :
                        new LinkedHashSet<>());
        stand.setSharedWebsite(sub(standDTO.getSharedWebsite(), 100));
        stand.setSharedInstagram(sub(standDTO.getSharedInstagram(), 100));
        stand.setSharedFacebook(sub(standDTO.getSharedFacebook(), 100));
        // Le lien historique n'est plus saisissable publiquement : on conserve la valeur existante.
        stand.setSharedUrlPicture(carryOver.sharedUrlPicture());
    }

    /**
     * Valeurs d'un stand que le formulaire public ne peut pas modifier et qui doivent survivre à la
     * suppression/recréation des prestations lors d'une modification d'inscription.
     */
    private record StandCarryOver(String urlPicture, String sharedUrlPicture,
                                  Map<StandPictureType, StandPictureService.StandPictureSnapshot> pictures) {

        static StandCarryOver empty() {
            return new StandCarryOver(null, null, Map.of());
        }
    }

    private StandCarryOver captureCarryOver(List<Stand> existingStands) {
        if (existingStands.isEmpty()) {
            return StandCarryOver.empty();
        }

        Stand previous = existingStands.get(0);
        Map<StandPictureType, StandPictureService.StandPictureSnapshot> pictures = standPictureService.snapshot(
                previous.getId());

        // Supprimé explicitement pour ne pas laisser d'entités orphelines en session (la FK est en
        // cascade côté base, mais Hibernate ne le sait pas).
        standPictureService.deleteAllForStand(previous.getId());

        return new StandCarryOver(previous.getUrlPicture(), previous.getSharedUrlPicture(), pictures);
    }

    /**
     * Enregistre la nouvelle image si le public en a envoyé une, sinon reporte celle déjà présente.
     * <p>
     * L'image est obligatoire : le formulaire le vérifie déjà, mais un client peut le contourner.
     */
    private void applyStandPicture(Stand stand, StandPictureType type, ImageUploadDTO upload,
            StandCarryOver carryOver, boolean keep, String missingErrorKey) {
        if (!keep) {
            return;
        }

        if (upload != null) {
            standPictureService.save(stand, type, upload);
            return;
        }

        StandPictureService.StandPictureSnapshot previous = carryOver.pictures().get(type);
        if (previous == null) {
            throw new BadRequestAlertException("Une image est requise", ENTITY_NAME, missingErrorKey);
        }

        standPictureService.restore(stand, previous);
    }

    private RegistrationStandDTO toStandDTO(Stand stand) {
        RegistrationStandDTO dto = new RegistrationStandDTO();
        dto.setDescription(stand.getDescription());
        dto.setDimensionId(stand.getDimension() != null ? stand.getDimension().getId() : null);
        dto.setCategory(stand.getCategory());
        dto.setSubCategories(stand.getSubCategories() != null ? new LinkedHashSet<>(stand.getSubCategories()) :
                new LinkedHashSet<>());
        dto.setNbTable(nullSafe(stand.getNbTable()));
        dto.setNbChair(nullSafe(stand.getNbChair()));
        dto.setNeedElectricity(Boolean.TRUE.equals(stand.getNeedElectricity()));
        dto.setShared(Boolean.TRUE.equals(stand.getShared()));
        dto.setWebsite(stand.getWebsite());
        dto.setInstagram(stand.getInstagram());
        dto.setFacebook(stand.getFacebook());
        dto.setSharedFirstName(stand.getSharedFirstName());
        dto.setSharedLastName(stand.getSharedLastName());
        dto.setSharedTherapistName(stand.getSharedTherapistName());
        dto.setSharedEmail(stand.getSharedEmail());
        dto.setSharedDescription(stand.getSharedDescription());
        dto.setSharedCategory(stand.getSharedCategory());
        dto.setSharedSubCategories(
                stand.getSharedSubCategories() != null ? new LinkedHashSet<>(stand.getSharedSubCategories()) :
                        new LinkedHashSet<>());
        dto.setSharedWebsite(stand.getSharedWebsite());
        dto.setSharedInstagram(stand.getSharedInstagram());
        dto.setSharedFacebook(stand.getSharedFacebook());
        dto.setHasPicture(standPictureService.exists(stand.getId(), StandPictureType.MAIN));
        dto.setHasSharedPicture(standPictureService.exists(stand.getId(), StandPictureType.SHARED));
        return dto;
    }

    private RegistrationTalkDTO toTalkDTO(String title, String description) {
        RegistrationTalkDTO dto = new RegistrationTalkDTO();
        dto.setTitle(title);
        dto.setDescription(description);
        return dto;
    }

    private RegistrationAddressDTO toAddressDTO(Address address) {
        if (address == null) {
            return null;
        }
        RegistrationAddressDTO dto = new RegistrationAddressDTO();
        dto.setFormalLine(address.getFormalLine());
        dto.setFullName(address.getFullName());
        dto.setPostalCase(address.getPostalCase());
        dto.setStreet(address.getStreet());
        dto.setHouseNumber(address.getHouseNumber());
        dto.setPostalCode(address.getPostalCode());
        dto.setCity(address.getCity());
        dto.setIsoCountry(address.getIsoCountry());
        dto.setExtraLine(address.getExtraLine());
        return dto;
    }

    // -------------------- ECRITURE --------------------

    private Exhibitor upsertExhibitor(RegistrationExhibitorDTO dto, String email, Instant now) {
        Exhibitor exhibitor = exhibitorRepository.findByEmail(email);

        if (exhibitor != null) {
            // L'exposant existe déjà : on ne réécrit pas ses données depuis un endpoint anonyme.
            // Seule la modification via le lien signé (mode édition) peut les mettre à jour.
            return exhibitor;
        }

        exhibitor = new Exhibitor();
        exhibitor.setEmail(email);
        exhibitor.setRegistrationDate(now);
        exhibitor.setDuplicateDetected(
                hasPotentialDuplicate(sanitizePhoneNumber(dto.getPhoneNumber()), dto.getFirstName(),
                        dto.getLastName()));

        applyExhibitor(exhibitor, dto);

        return exhibitorRepository.save(exhibitor);
    }

    private void applyExhibitor(Exhibitor exhibitor, RegistrationExhibitorDTO dto) {
        exhibitor.setFirstName(StringUtils.trimToNull(dto.getFirstName()));
        exhibitor.setLastName(StringUtils.trimToNull(dto.getLastName()));
        exhibitor.setPhoneNumber(sanitizePhoneNumber(dto.getPhoneNumber()));
        exhibitor.setLanguage(StringUtils.defaultIfBlank(dto.getLanguage(), Locale.FRENCH.getLanguage()));
        exhibitor.setNewsletter(dto.isNewsletter());
        exhibitor.setHomeAddress(applyAddress(exhibitor.getHomeAddress(), dto.getHomeAddress()));
        exhibitor.setDifferentBillingAddress(dto.isDifferentBillingAddress());
        exhibitor.setBillingAddress(dto.isDifferentBillingAddress() ?
                applyAddress(exhibitor.getBillingAddress(), dto.getBillingAddress()) : null);
    }

    private Address applyAddress(Address existing, RegistrationAddressDTO dto) {
        if (dto == null) {
            return null;
        }
        Address address = existing != null ? existing : new Address();
        address.setFormalLine(StringUtils.trimToNull(dto.getFormalLine()));
        address.setFullName(StringUtils.trimToNull(dto.getFullName()));
        address.setPostalCase(StringUtils.trimToNull(dto.getPostalCase()));
        address.setStreet(StringUtils.trimToNull(dto.getStreet()));
        address.setHouseNumber(StringUtils.trimToNull(dto.getHouseNumber()));
        address.setPostalCode(StringUtils.trimToNull(dto.getPostalCode()));
        address.setCity(StringUtils.trimToNull(dto.getCity()));
        address.setIsoCountry(StringUtils.defaultIfBlank(dto.getIsoCountry(), "CH"));
        address.setExtraLine(StringUtils.trimToNull(dto.getExtraLine()));
        return address;
    }

    private void applyParticipation(Participation participation, RegistrationParticipationDTO dto,
            Exhibitor exhibitor) {
        participation.setTherapistName(StringUtils.isNotBlank(dto.getTherapistName()) ?
                sub(dto.getTherapistName(), 100) : sub(exhibitor.getFullname(), 100));
        participation.setNbMeal1(dto.getNbMeal1());
        participation.setNbMeal2(dto.getNbMeal2());
        participation.setNbMeal3(dto.getNbMeal3());
        participation.setModePaymentMeals(dto.totalMeals() > 0 ? dto.getModePaymentMeals() : ModePaymentMeals.SEPARATE);
        participation.setInvoiceSendingMethod(dto.getInvoiceSendingMethod());
        participation.setHasOffer(dto.isHasOffer());
        participation.setOffer(dto.isHasOffer() ? sub(dto.getOffer(), 500) : null);
        participation.setAdditionnalInformation(StringUtils.trimToNull(dto.getAdditionnalInformation()));
        participation.setAcceptedChart(dto.isAcceptedChart());
        participation.setAcceptedContract(dto.isAcceptedContract());
    }

    private void createServices(Participation participation, RegistrationRequestDTO request, Instant now,
            StandCarryOver carryOver) {
        for (RegistrationStandDTO standDTO : request.getStands()) {
            Stand stand = new Stand();
            stand.setRegistrationDate(now);
            stand.setParticipation(participation);
            stand.setDescription(sub(standDTO.getDescription(), 500));
            stand.setDimension(resolveDimension(participation.getSalon(), standDTO.getDimensionId()));
            stand.setCategory(standDTO.getCategory());
            stand.setSubCategories(
                    standDTO.getSubCategories() != null ? new LinkedHashSet<>(standDTO.getSubCategories()) :
                            new LinkedHashSet<>());
            stand.setNbTable(standDTO.getNbTable());
            stand.setNbChair(standDTO.getNbChair());
            stand.setNeedElectricity(standDTO.isNeedElectricity());
            stand.setShared(standDTO.isShared());
            stand.setWebsite(sub(standDTO.getWebsite(), 100));
            stand.setInstagram(sub(standDTO.getInstagram(), 100));
            stand.setFacebook(sub(standDTO.getFacebook(), 100));
            // Le lien historique n'est plus saisissable publiquement : on conserve la valeur existante.
            stand.setUrlPicture(carryOver.urlPicture());
            applyCoExhibitor(stand, standDTO, carryOver);
            stand.setStatus(Status.IN_VERIFICATION);
            stand.setExtraInformation(null);
            stand = standRepository.save(stand);

            applyStandPicture(stand, StandPictureType.MAIN, standDTO.getPictureUpload(), carryOver, true,
                    "registration.stand-picture-required");
            applyStandPicture(stand, StandPictureType.SHARED, standDTO.getSharedPictureUpload(), carryOver,
                    standDTO.isShared(), "registration.co-exhibitor-picture-required");
        }

        for (RegistrationTalkDTO talk : request.getConferences()) {
            Conference conference = new Conference();
            conference.setRegistrationDate(now);
            conference.setParticipation(participation);
            conference.setTitle(sub(talk.getTitle(), 500));
            conference.setDescription(sub(talk.getDescription(), 500));
            conference.setStatus(Status.IN_VERIFICATION);
            conference.setExtraInformation(null);
            conferenceRepository.save(conference);
        }

        for (RegistrationTalkDTO talk : request.getWorkshops()) {
            Workshop workshop = new Workshop();
            workshop.setRegistrationDate(now);
            workshop.setParticipation(participation);
            workshop.setTitle(sub(talk.getTitle(), 500));
            workshop.setDescription(sub(talk.getDescription(), 500));
            workshop.setStatus(Status.IN_VERIFICATION);
            workshop.setExtraInformation(null);
            workshopRepository.save(workshop);
        }
    }

    private PriceStandSalon resolveDimension(Salon salon, UUID dimensionId) {
        return salon.getPriceStandSalons().stream().filter(d -> d.getId().equals(dimensionId)).findFirst().orElseThrow(
                () -> new BadRequestAlertException("Dimension de stand inconnue", ENTITY_NAME,
                        "registration.dimension-invalid"));
    }

    // -------------------- REGLES METIER --------------------

    private String computeClosedReason(Salon salon) {
        if (salon.isArchived() || !salon.isRegistrationEnabled()) {
            return "DISABLED";
        }

        Instant now = Instant.now();
        if (salon.getRegistrationOpeningDate() != null && now.isBefore(salon.getRegistrationOpeningDate())) {
            return "NOT_YET_OPEN";
        }
        if (salon.getRegistrationClosingDate() != null && now.isAfter(salon.getRegistrationClosingDate())) {
            return "CLOSED";
        }
        return null;
    }

    private void assertRegistrationOpen(Salon salon) {
        String closedReason = computeClosedReason(salon);
        if (closedReason != null) {
            throw new BadRequestAlertException("Les inscriptions ne sont pas ouvertes", ENTITY_NAME,
                    "registration.closed");
        }
    }

    private void validateBusinessRules(RegistrationRequestDTO request) {
        RegistrationParticipationDTO participation = request.getParticipation();

        if (request.getStands().isEmpty() && request.getConferences().isEmpty() &&
                request.getWorkshops().isEmpty()) {
            throw new BadRequestAlertException("Au moins une prestation est requise", ENTITY_NAME,
                    "registration.no-service");
        }

        if (request.getStands().size() > 1) {
            throw new BadRequestAlertException("Un seul stand est autorisé", ENTITY_NAME,
                    "registration.too-many-stands");
        }

        if (participation.totalMeals() > 0 && participation.getModePaymentMeals() == null) {
            throw new BadRequestAlertException("Mode de paiement des repas requis", ENTITY_NAME,
                    "registration.meal-payment-required");
        }

        if (participation.isHasOffer() && StringUtils.isBlank(participation.getOffer())) {
            throw new BadRequestAlertException("Description de l'offre requise", ENTITY_NAME,
                    "registration.offer-required");
        }

        RegistrationExhibitorDTO exhibitor = request.getExhibitor();
        if (exhibitor.isDifferentBillingAddress() && exhibitor.getBillingAddress() == null) {
            throw new BadRequestAlertException("Adresse de facturation requise", ENTITY_NAME,
                    "registration.billing-address-required");
        }
    }

    // -------------------- DOUBLONS --------------------

    /**
     * Détecte un doublon potentiel pour le <b>nouvel</b> exposant uniquement.
     * Contrairement à l'import CSV (opération d'administration), l'endpoint public ne marque jamais
     * les exposants existants : une requête anonyme ne doit pas pouvoir modifier des fiches en base.
     */
    private boolean hasPotentialDuplicate(String phone, String firstName, String lastName) {
        String last6 = Optional.ofNullable(phone).filter(p -> p.length() >= 6).map(p -> p.substring(p.length() - 6))
                               .orElse(null);

        if (last6 != null && !Optional.ofNullable(exhibitorRepository.findAllByPhoneNumberIsEndingWithIgnoreCase(last6))
                                      .orElseGet(List::of).isEmpty()) {
            return true;
        }

        if (StringUtils.isNotBlank(firstName) && StringUtils.isNotBlank(lastName)) {
            return !Optional.ofNullable(
                    exhibitorRepository.findAllByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase(firstName,
                            lastName)).orElseGet(List::of).isEmpty();
        }

        return false;
    }

    // -------------------- UTILS --------------------

    private static String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String normalizeEmail(String email) {
        return StringUtils.defaultString(email).trim().toLowerCase(Locale.ROOT);
    }

    private static String sanitizePhoneNumber(String phone) {
        if (StringUtils.isBlank(phone)) {
            return null;
        }
        return phone.replaceAll("[\\s.()\\-]", "");
    }

    private static String sub(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    private static long nullSafe(Long value) {
        return value != null ? value : 0L;
    }

    private record RegistrationResult(UUID participationId, String registrationToken, String firstName, String email) {
    }
}
