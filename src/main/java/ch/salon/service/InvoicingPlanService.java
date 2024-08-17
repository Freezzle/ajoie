package ch.salon.service;

import static ch.salon.domain.enumeration.Type.*;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.Type;
import ch.salon.repository.*;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.InvoicingPlanDTO;
import ch.salon.service.mapper.InvoiceMapper;
import ch.salon.service.mapper.InvoicingPlanMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.time.Instant;
import java.util.*;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

@Service
public class InvoicingPlanService {

    public static final String ENTITY_NAME = "invoicingPlan";

    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;
    private final InvoicingPlanRepository invoicingPlanRepository;
    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;
    private final MessageSource messageSource;
    private final MailService mailService;

    public InvoicingPlanService(
        SalonRepository salonRepository,
        ParticipationRepository participationRepository,
        InvoicingPlanRepository invoicingPlanRepository,
        StandRepository standRepository,
        ConferenceRepository conferenceRepository,
        MessageSource messageSource,
        MailService mailService
    ) {
        this.participationRepository = participationRepository;
        this.salonRepository = salonRepository;
        this.invoicingPlanRepository = invoicingPlanRepository;
        this.standRepository = standRepository;
        this.conferenceRepository = conferenceRepository;
        this.messageSource = messageSource;
        this.mailService = mailService;
    }

    public UUID create(InvoicingPlanDTO invoicingPlan) {
        if (invoicingPlan.getId() != null) {
            throw new BadRequestAlertException("A new invoicingPlan cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return invoicingPlanRepository.save(InvoicingPlanMapper.INSTANCE.toEntity(invoicingPlan)).getId();
    }

    public InvoicingPlanDTO update(final UUID id, InvoicingPlanDTO invoicingPlan) {
        if (invoicingPlan.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (!Objects.equals(id, invoicingPlan.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!invoicingPlanRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return InvoicingPlanMapper.INSTANCE.toDto(invoicingPlanRepository.save(InvoicingPlanMapper.INSTANCE.toEntity(invoicingPlan)));
    }

    public void send(UUID idInvoicingPlan) {
        if (idInvoicingPlan == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository
            .findById(idInvoicingPlan)
            .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Salon salon = invoicingPlan.getParticipation().getSalon();
        Exhibitor exhibitor = invoicingPlan.getParticipation().getExhibitor();

        mailService.sendInvoiceMail(salon, exhibitor, invoicingPlan);

        invoicingPlan.setHasBeenSent(true);
        invoicingPlanRepository.save(invoicingPlan);
    }

    public Optional<InvoiceDTO> switchLock(UUID idInvoicingPlan, UUID idInvoice) {
        if (idInvoicingPlan == null || idInvoice == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository
            .findById(idInvoicingPlan)
            .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Invoice invoiceFound = invoicingPlan
            .getInvoices()
            .stream()
            .filter(invoice -> invoice.getId().equals(idInvoice))
            .findFirst()
            .orElseThrow();

        invoiceFound.setLock(!invoiceFound.getLock());
        invoicingPlanRepository.save(invoicingPlan);

        return Optional.of(InvoiceMapper.INSTANCE.toDto(invoiceFound));
    }

    public Optional<InvoiceDTO> updateInvoice(UUID idInvoicingPlan, UUID idInvoice, InvoiceDTO invoiceDTO) {
        if (idInvoicingPlan == null || invoiceDTO == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository
            .findById(idInvoicingPlan)
            .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Invoice invoiceFound = invoicingPlan
            .getInvoices()
            .stream()
            .filter(invoice -> invoice.getId().equals(idInvoice))
            .findFirst()
            .orElseThrow();

        invoiceFound.setLabel(invoiceDTO.getLabel());
        invoiceFound.setDefaultAmount(invoiceDTO.getDefaultAmount());
        invoiceFound.setCustomAmount(invoiceDTO.getCustomAmount());
        invoiceFound.setGenerationDate(Instant.now());
        invoiceFound.setExtraInformation(invoiceDTO.getExtraInformation());

        invoicingPlanRepository.save(invoicingPlan);

        return Optional.of(InvoiceMapper.INSTANCE.toDto(invoiceFound));
    }

    public List<InvoicingPlanDTO> findAll(String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            List<InvoicingPlan> invoicingPlans = invoicingPlanRepository.findByParticipationIdOrderByBillingNumberDesc(
                UUID.fromString(idParticipation)
            );
            return invoicingPlans.stream().map(InvoicingPlanMapper.INSTANCE::toDto).toList();
        }

        throw new IllegalStateException("No filter given");
    }

    public Optional<InvoicingPlanDTO> get(UUID id) {
        return invoicingPlanRepository.findById(id).map(InvoicingPlanMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        invoicingPlanRepository.deleteById(id);
    }

    public void generateInvoicingPlan(String idParticipation) {
        if (StringUtils.isBlank(idParticipation)) {
            throw new IllegalStateException("No idParticipation given");
        }

        Participation participation = participationRepository.findById(UUID.fromString(idParticipation)).orElseThrow();
        if (participation.getIsBillingClosed()) {
            return;
        }

        final InvoicingPlan lastPlan = invoicingPlanRepository
            .findByParticipationIdOrderByBillingNumberDesc(participation.getId())
            .stream()
            .max(Comparator.comparing(InvoicingPlan::getBillingNumber))
            .orElse(null);

        InvoicingPlan currentInvoicingPlan;
        Set<Invoice> lockedInvoices = new HashSet<>();

        if (lastPlan == null) {
            currentInvoicingPlan = new InvoicingPlan();
            currentInvoicingPlan.setParticipation(participation);
            currentInvoicingPlan.setBillingNumber(participation.getClientNumber() + "-" + "001");
        } else if (lastPlan.isHasBeenSent()) {
            currentInvoicingPlan = new InvoicingPlan();
            currentInvoicingPlan.setParticipation(participation);
            currentInvoicingPlan.setBillingNumber(incrementBillingNumber(lastPlan.getBillingNumber()));
            copyLockedInvoices(lastPlan, lockedInvoices);
        } else {
            currentInvoicingPlan = lastPlan;
            copyLockedInvoices(lastPlan, lockedInvoices);
        }

        currentInvoicingPlan.setGenerationDate(Instant.now());

        Salon salon = salonRepository.findById(participation.getSalon().getId()).orElseThrow();

        List<Stand> stands = standRepository.findByParticipationId(participation.getId());
        List<Conference> conferences = conferenceRepository.findByParticipationId(participation.getId());
        removeObsoleteStandInvoices(lockedInvoices, stands);
        removeObsoleteConferenceInvoices(lockedInvoices, conferences);

        Long position = 0L;
        for (Stand stand : stands.stream().filter(stand -> !stand.getStatus().isInvalidStatus()).toList()) {
            position = processStand(stand, salon, lockedInvoices, position);
        }

        for (Conference conference : conferences.stream().filter(conference -> !conference.getStatus().isInvalidStatus()).toList()) {
            position = processConference(conference, salon, lockedInvoices, position);
        }

        position = processMeal(
            MEAL1,
            participation.getNbMeal1(),
            messageSource.getMessage("saturday.midday", null, Locale.FRENCH),
            salon.getPriceMeal1(),
            lockedInvoices,
            position
        );
        position = processMeal(
            MEAL2,
            participation.getNbMeal2(),
            messageSource.getMessage("saturday.evening", null, Locale.FRENCH),
            salon.getPriceMeal2(),
            lockedInvoices,
            position
        );
        processMeal(
            MEAL3,
            participation.getNbMeal3(),
            messageSource.getMessage("sunday.midday", null, Locale.FRENCH),
            salon.getPriceMeal3(),
            lockedInvoices,
            position
        );

        currentInvoicingPlan.getInvoices().clear();
        lockedInvoices.forEach(currentInvoicingPlan::addInvoice);

        invoicingPlanRepository.save(currentInvoicingPlan);
    }

    private void copyLockedInvoices(InvoicingPlan plan, Set<Invoice> lockedInvoices) {
        plan
            .getInvoices()
            .forEach(invoice -> {
                if (invoice.getLock()) {
                    lockedInvoices.add(new Invoice(invoice));
                }
            });
    }

    private void removeObsoleteStandInvoices(Set<Invoice> lockedInvoices, List<Stand> stands) {
        stands.forEach(stand -> {
            if (stand.getStatus().isInvalidStatus()) {
                lockedInvoices.removeIf(invoice -> (invoice.getType().isFromStand()) && stand.getId().equals(invoice.getReferenceId()));
            }
        });

        lockedInvoices.removeIf(
            invoice ->
                (invoice.getType().isFromStand()) && stands.stream().map(Stand::getId).noneMatch(id -> id.equals(invoice.getReferenceId()))
        );
    }

    private Long processStand(Stand stand, Salon salon, Set<Invoice> lockedInvoices, Long position) {
        Double defaultPrice = stand.getDimension() == null
            ? 0
            : salon
                .getPriceStandSalons()
                .stream()
                .filter(priceStand -> priceStand.getDimension().getId().equals(stand.getDimension().getId()))
                .findFirst()
                .map(PriceStandSalon::getPrice)
                .orElse(0.0);

        position += 1;

        updateOrCreateInvoice(
            lockedInvoices,
            stand.getId(),
            STAND,
            stand.getDimension() != null ? stand.getDimension().getDimension() : "unknown dimension",
            1L,
            defaultPrice,
            position
        );

        if (stand.getShared()) {
            position += 1;

            updateOrCreateInvoice(
                lockedInvoices,
                stand.getId(),
                SHARED,
                stand.getDimension() != null ? stand.getDimension().getDimension() : "unknown dimension",
                1L,
                salon.getPriceSharingStand(),
                position
            );
        }

        return position;
    }

    private void removeObsoleteConferenceInvoices(Set<Invoice> lockedInvoices, List<Conference> conferences) {
        conferences.forEach(conference -> {
            if (conference.getStatus().isInvalidStatus()) {
                lockedInvoices.removeIf(
                    invoice -> (invoice.getType().isFromConference()) && conference.getId().equals(invoice.getReferenceId())
                );
            }
        });

        lockedInvoices.removeIf(
            invoice ->
                invoice.getType().isFromConference() &&
                conferences.stream().map(Conference::getId).noneMatch(id -> id.equals(invoice.getReferenceId()))
        );
    }

    private Long processConference(Conference conference, Salon salon, Set<Invoice> lockedInvoices, Long position) {
        Invoice lockedInvoice = lockedInvoices
            .stream()
            .filter(invoice -> invoice.getType() == CONFERENCE && invoice.getReferenceId().equals(conference.getId()))
            .findFirst()
            .orElse(null);

        position += 1;

        if (lockedInvoice != null) {
            lockedInvoice.setPosition(position);
            lockedInvoice.setDefaultAmount(salon.getPriceConference());
        } else {
            lockedInvoices.add(
                createInvoice(conference.getId(), CONFERENCE, conference.getTitle(), 1L, salon.getPriceConference(), position)
            );
        }

        return position;
    }

    private Long processMeal(Type type, Long mealCount, String description, Double price, Set<Invoice> lockedInvoices, Long position) {
        if (mealCount != null && mealCount > 0) {
            position += 1;

            Invoice invoiceMealLocked = lockedInvoices
                .stream()
                .filter(invoice -> invoice.getType() == type && invoice.getLock())
                .findFirst()
                .orElse(null);
            if (invoiceMealLocked != null) {
                invoiceMealLocked.setPosition(position);
                invoiceMealLocked.setDefaultAmount(price);
                invoiceMealLocked.setQuantity(mealCount);
            } else {
                lockedInvoices.add(createInvoice(null, type, description, mealCount, price, position));
            }
        } else {
            lockedInvoices.removeIf(invoice -> invoice.getType() == type);
        }

        return position;
    }

    private void updateOrCreateInvoice(
        Set<Invoice> lockedInvoices,
        UUID referenceId,
        Type type,
        String description,
        Long quantity,
        Double defaultAmount,
        Long position
    ) {
        Invoice lockedInvoice = lockedInvoices
            .stream()
            .filter(invoice -> invoice.getType() == type && invoice.getReferenceId().equals(referenceId))
            .findFirst()
            .orElse(null);

        if (lockedInvoice != null) {
            lockedInvoice.setPosition(position);
            lockedInvoice.setDefaultAmount(defaultAmount);
        } else {
            lockedInvoices.add(createInvoice(referenceId, type, description, quantity, defaultAmount, position));
        }
    }

    private Invoice createInvoice(UUID referenceId, Type type, String label, Long quantity, Double defaultAmount, Long position) {
        defaultAmount = defaultAmount != null ? defaultAmount : 0;

        Invoice invoice = new Invoice();
        invoice.setPosition(position);
        invoice.setReferenceId(referenceId);
        invoice.setLock(false);
        invoice.setGenerationDate(Instant.now());
        invoice.setType(type);
        invoice.setLabel(sub(label));
        invoice.setQuantity(quantity);
        invoice.setDefaultAmount(defaultAmount);
        invoice.setCustomAmount(defaultAmount);

        return invoice;
    }

    private String incrementBillingNumber(String billingNumber) {
        // Séparer les deux parties
        String[] parts = billingNumber.split("-");
        String prefix1 = parts[0];
        String prefix2 = parts[1];
        String numberPart = parts[2];

        // Convertir la partie numérique après le tiret en entier
        int number = Integer.parseInt(numberPart);

        // Incrémenter le nombre
        number++;

        // Reformater le numéro incrémenté avec le même nombre de chiffres
        String newNumberPart = String.format("%03d", number);

        // Assembler le nouveau numéro
        return prefix1 + "-" + prefix2 + "-" + newNumberPart;
    }

    private String sub(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(30, chaine.length())) : null;
    }
}
