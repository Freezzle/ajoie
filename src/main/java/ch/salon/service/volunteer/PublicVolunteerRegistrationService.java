package ch.salon.service.volunteer;

import ch.salon.domain.PlanningVolunteerSalon;
import ch.salon.domain.Salon;
import ch.salon.domain.VolunteerAvailabilityDay;
import ch.salon.domain.VolunteerPlanningCategory;
import ch.salon.domain.VolunteerPlanningConfiguration;
import ch.salon.domain.VolunteerPlanningDay;
import ch.salon.domain.VolunteerPlanningNeed;
import ch.salon.domain.VolunteerRegistration;
import ch.salon.domain.VolunteerTimeRange;
import ch.salon.domain.enumeration.VolunteerRegistrationStatus;
import ch.salon.domain.enumeration.ZoneMode;
import ch.salon.repository.PlanningVolunteerSalonRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.VolunteerRegistrationRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.security.tenant.TransactionalTenantOperation;
import ch.salon.service.dto.volunteer.PublicVolunteerSalonInfoDTO;
import ch.salon.service.dto.volunteer.VolunteerRegistrationDTO;
import ch.salon.service.dto.volunteer.VolunteerRegistrationRequestDTO;
import ch.salon.service.dto.volunteer.VolunteerRegistrationResponseDTO;
import ch.salon.service.util.SecureTokens;
import ch.salon.service.util.WallClock;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Logique métier publique de l'inscription bénévole. DTO dédiés, jamais ceux de l'admin ;
 * aucun besoin/affectation/nombre d'inscrits n'est exposé.
 */
@Service
@RequiredArgsConstructor
public class PublicVolunteerRegistrationService {

    public static final String ENTITY_NAME = "volunteer-registration";

    private final SalonRepository salonRepository;
    private final VolunteerRegistrationRepository registrationRepository;
    private final PlanningVolunteerSalonRepository planningRepository;
    private final VolunteerPlanningSyncService syncService;
    private final VolunteerRegistrationEmailService emailService;
    private final TransactionalTenantOperation transactionalOps;

    // -------------------- API PUBLIQUE --------------------

    public PublicVolunteerSalonInfoDTO getSalonInfo(UUID salonId) {
        UUID tenantId = resolveTenant(salonId);
        return TenantContextHolder.runAsTenant(tenantId,
                () -> transactionalOps.executeReadOnlyAndReturn(() -> toPublicSalonInfo(loadSalon(salonId))));
    }

    public VolunteerRegistrationResponseDTO register(UUID salonId, VolunteerRegistrationRequestDTO request) {
        UUID tenantId = resolveTenant(salonId);

        UUID registrationId = TenantContextHolder.runAsTenant(tenantId,
                () -> transactionalOps.executeAndReturn(() -> doRegister(salonId, request)));

        emailService.sendReceived(tenantId, registrationId, salonId);

        VolunteerRegistration saved = registrationRepository.findById(registrationId).orElseThrow();
        return new VolunteerRegistrationResponseDTO(registrationId.toString(), saved.getFirstName(), saved.getEmail());
    }

    public VolunteerRegistrationDTO getRegistration(UUID salonId, UUID registrationId, String token) {
        UUID tenantId = resolveTenant(salonId);
        return TenantContextHolder.runAsTenant(tenantId, () -> transactionalOps.executeReadOnlyAndReturn(() -> {
            VolunteerRegistration registration = loadByToken(salonId, registrationId, token);
            return toDto(loadSalon(salonId), registration);
        }));
    }

    public VolunteerRegistrationResponseDTO updateRegistration(UUID salonId, UUID registrationId, String token,
            VolunteerRegistrationRequestDTO request) {
        UUID tenantId = resolveTenant(salonId);

        TenantContextHolder.runAsTenant(tenantId,
                () -> transactionalOps.execute(() -> doUpdate(salonId, registrationId, token, request)));

        emailService.sendUpdated(tenantId, registrationId, salonId);

        VolunteerRegistration saved = registrationRepository.findById(registrationId).orElseThrow();
        return new VolunteerRegistrationResponseDTO(registrationId.toString(), saved.getFirstName(), saved.getEmail());
    }

    public void cancel(UUID salonId, UUID registrationId, String token) {
        UUID tenantId = resolveTenant(salonId);

        TenantContextHolder.runAsTenant(tenantId, () -> transactionalOps.execute(() -> {
            Salon salon = loadSalon(salonId);
            assertEditable(salon);
            VolunteerRegistration registration = loadByToken(salonId, registrationId, token);
            if (registration.getStatus() == VolunteerRegistrationStatus.REMOVED) {
                throw new BadRequestAlertException("Inscription retirée", ENTITY_NAME, "volunteer-registration.removed");
            }
            VolunteerRegistration old = snapshot(registration);
            registration.setStatus(VolunteerRegistrationStatus.CANCELLED);
            registration.setLastModifiedDate(Instant.now());
            registrationRepository.save(registration);
            syncService.apply(salonId, old, registration);
        }));

        emailService.sendCancelled(tenantId, registrationId, salonId);
    }

    /** Renvoie le lien si une inscription existe. Répond toujours sans révéler l'existence de l'e-mail. */
    public void resendLink(UUID salonId, String email) {
        UUID tenantId = resolveTenant(salonId);
        TenantContextHolder.runAsTenant(tenantId, () -> transactionalOps.execute(() -> {
            registrationRepository.findBySalonIdAndEmail(salonId, normalizeEmail(email))
                    .filter(r -> r.getStatus() != VolunteerRegistrationStatus.REMOVED)
                    .ifPresent(r -> emailService.sendReceived(tenantId, r.getId(), salonId));
        }));
    }

    // -------------------- TENANT --------------------

    private UUID resolveTenant(UUID salonId) {
        return salonRepository.findTenantIdBySalonId(salonId).orElseThrow(
                () -> new BadRequestAlertException("Salon introuvable", ENTITY_NAME, "volunteer-registration.salon-not-found"));
    }

    // -------------------- CREATION --------------------

    private UUID doRegister(UUID salonId, VolunteerRegistrationRequestDTO request) {
        Salon salon = loadSalon(salonId);
        assertOpen(salon);
        VolunteerPlanningConfiguration config = requireConfig(salonId);
        validate(request, config);

        String email = normalizeEmail(request.getContact().getEmail());
        if (registrationRepository.findBySalonIdAndEmail(salonId, email).isPresent()) {
            throw new BadRequestAlertException("Inscription déjà existante", ENTITY_NAME,
                    "volunteer-registration.already-registered");
        }

        Instant now = Instant.now();
        VolunteerRegistration registration = new VolunteerRegistration();
        registration.setSalon(salon);
        applyRequest(registration, request, email);
        registration.setStatus(VolunteerRegistrationStatus.ACTIVE);
        registration.setToken(SecureTokens.generate());
        registration.setPlanningVolunteerId("vr_" + UUID.randomUUID());
        registration.setRegistrationDate(now);
        registration.setLastModifiedDate(now);
        if (request.isAcceptContact()) {
            registration.setAcceptedContactAt(now);
        }

        registration = registrationRepository.save(registration);
        syncService.apply(salonId, null, registration);
        return registration.getId();
    }

    // -------------------- MISE A JOUR --------------------

    private void doUpdate(UUID salonId, UUID registrationId, String token, VolunteerRegistrationRequestDTO request) {
        Salon salon = loadSalon(salonId);
        assertEditable(salon);
        VolunteerPlanningConfiguration config = requireConfig(salonId);
        validate(request, config);

        VolunteerRegistration registration = loadByToken(salonId, registrationId, token);
        if (registration.getStatus() == VolunteerRegistrationStatus.REMOVED) {
            throw new BadRequestAlertException("Inscription retirée", ENTITY_NAME, "volunteer-registration.removed");
        }

        VolunteerRegistration old = snapshot(registration);

        // L'e-mail reste verrouillé : on conserve celui de l'inscription existante.
        applyRequest(registration, request, registration.getEmail());
        registration.setStatus(VolunteerRegistrationStatus.ACTIVE); // réinscription CANCELLED -> ACTIVE
        registration.setLastModifiedDate(Instant.now());
        if (request.isAcceptContact() && registration.getAcceptedContactAt() == null) {
            registration.setAcceptedContactAt(Instant.now());
        }

        registration = registrationRepository.save(registration);
        syncService.apply(salonId, old, registration);
    }

    private void applyRequest(VolunteerRegistration registration, VolunteerRegistrationRequestDTO request,
            String email) {
        VolunteerRegistrationRequestDTO.Contact contact = request.getContact();
        registration.setFirstName(StringUtils.trim(contact.getFirstName()));
        registration.setLastName(StringUtils.trim(contact.getLastName()));
        registration.setEmail(email);
        registration.setPhoneNumber(sanitizePhoneNumber(contact.getPhoneNumber()));

        VolunteerRegistrationRequestDTO.Preferences prefs = request.getPreferences();
        ZoneMode mode = "CHOOSE".equalsIgnoreCase(prefs.getZoneMode()) ? ZoneMode.CHOOSE : ZoneMode.ANY;
        registration.setZoneMode(mode);
        registration.setCategoryIds(mode == ZoneMode.CHOOSE
                ? new ArrayList<>(prefs.getCategoryIds()) : new ArrayList<>());
        registration.setNotes(StringUtils.trimToNull(prefs.getNotes()));

        registration.setAvailability(toAvailability(request.getAvailability()));
    }

    private List<VolunteerAvailabilityDay> toAvailability(List<VolunteerRegistrationRequestDTO.AvailabilityDay> src) {
        List<VolunteerAvailabilityDay> result = new ArrayList<>();
        for (VolunteerRegistrationRequestDTO.AvailabilityDay day : src) {
            VolunteerAvailabilityDay entity = new VolunteerAvailabilityDay();
            entity.setDayId(day.getDayId());
            entity.setAvailable(day.isAvailable());
            if (day.isAvailable()) {
                entity.setRanges(mergeRanges(day.getRanges()));
            }
            result.add(entity);
        }
        return result;
    }

    // -------------------- VALIDATION --------------------

    private void validate(VolunteerRegistrationRequestDTO request, VolunteerPlanningConfiguration config) {
        Set<String> dayIds = config.getDays().stream().map(VolunteerPlanningDay::getId).collect(Collectors.toSet());

        Set<String> seen = new java.util.HashSet<>();
        for (VolunteerRegistrationRequestDTO.AvailabilityDay day : request.getAvailability()) {
            if (!dayIds.contains(day.getDayId())) {
                throw new BadRequestAlertException("Jour inconnu", ENTITY_NAME, "volunteer-registration.day-unknown");
            }
            if (!seen.add(day.getDayId())) {
                throw new BadRequestAlertException("Jour en double", ENTITY_NAME, "volunteer-registration.day-duplicate");
            }
            if (day.isAvailable()) {
                VolunteerPlanningDay planningDay = config.getDays().stream()
                        .filter(d -> d.getId().equals(day.getDayId())).findFirst().orElseThrow();
                validateRanges(day.getRanges(), planningDay);
            }
        }

        // L'inscription sans aucune disponibilité est autorisée (le bénévole peut s'inscrire pour être contacté).

        VolunteerRegistrationRequestDTO.Preferences prefs = request.getPreferences();
        if ("CHOOSE".equalsIgnoreCase(prefs.getZoneMode())) {
            if (prefs.getCategoryIds().isEmpty()) {
                throw new BadRequestAlertException("Au moins une zone est requise", ENTITY_NAME,
                        "volunteer-registration.zone-required");
            }
            Set<String> known = config.getCategories().stream().map(VolunteerPlanningCategory::getId)
                    .collect(Collectors.toSet());
            if (!known.containsAll(prefs.getCategoryIds())) {
                throw new BadRequestAlertException("Zone inconnue", ENTITY_NAME, "volunteer-registration.zone-unknown");
            }
        }

        if (!request.isAcceptContact()) {
            throw new BadRequestAlertException("Consentement requis", ENTITY_NAME,
                    "volunteer-registration.consent-required");
        }
    }

    private void validateRanges(List<VolunteerRegistrationRequestDTO.TimeRange> ranges, VolunteerPlanningDay day) {
        int dayStart = toMinutes(WallClock.hhmm(day.getStartTime()));
        int dayEnd = toMinutes(WallClock.hhmm(day.getEndTime()));
        List<int[]> intervals = new ArrayList<>();
        for (VolunteerRegistrationRequestDTO.TimeRange range : ranges) {
            int start = toMinutes(range.getStart());
            int end = toMinutes(range.getEnd());
            if (start >= end || start < dayStart || end > dayEnd) {
                throw new BadRequestAlertException("Plage horaire invalide", ENTITY_NAME,
                        "volunteer-registration.range-invalid");
            }
            intervals.add(new int[]{start, end});
        }
        intervals.sort(Comparator.comparingInt(iv -> iv[0]));
        for (int i = 1; i < intervals.size(); i++) {
            if (intervals.get(i)[0] < intervals.get(i - 1)[1]) {
                throw new BadRequestAlertException("Plages horaires qui se chevauchent", ENTITY_NAME,
                        "volunteer-registration.range-overlap");
            }
        }
    }

    /** Fusionne les plages contiguës/chevauchantes et les trie. */
    private List<VolunteerTimeRange> mergeRanges(List<VolunteerRegistrationRequestDTO.TimeRange> ranges) {
        List<int[]> intervals = ranges.stream()
                .map(r -> new int[]{toMinutes(r.getStart()), toMinutes(r.getEnd())})
                .filter(iv -> iv[1] > iv[0])
                .sorted(Comparator.comparingInt(iv -> iv[0]))
                .collect(Collectors.toCollection(ArrayList::new));

        List<VolunteerTimeRange> merged = new ArrayList<>();
        int[] current = null;
        for (int[] iv : intervals) {
            if (current != null && iv[0] <= current[1]) {
                current[1] = Math.max(current[1], iv[1]);
            } else {
                current = new int[]{iv[0], iv[1]};
                VolunteerTimeRange range = new VolunteerTimeRange();
                merged.add(range);
            }
            VolunteerTimeRange last = merged.get(merged.size() - 1);
            last.setStart(toHhmm(current[0]));
            last.setEnd(toHhmm(current[1]));
        }
        return merged;
    }

    // -------------------- OUVERTURE / CLOTURE --------------------

    private String computeClosedReason(Salon salon) {
        if (salon.isArchived() || !salon.isVolunteerRegistrationEnabled() || !hasPlanningDays(salon.getId())) {
            return "DISABLED";
        }
        Instant now = Instant.now();
        if (salon.getVolunteerRegistrationOpeningDate() != null
                && now.isBefore(salon.getVolunteerRegistrationOpeningDate())) {
            return "NOT_YET_OPEN";
        }
        if (salon.getVolunteerRegistrationClosingDate() != null
                && now.isAfter(salon.getVolunteerRegistrationClosingDate())) {
            return "CLOSED";
        }
        return null;
    }

    private void assertOpen(Salon salon) {
        if (computeClosedReason(salon) != null) {
            throw new BadRequestAlertException("Inscriptions bénévoles fermées", ENTITY_NAME,
                    "volunteer-registration.closed");
        }
    }

    /** PUT/DELETE refusés si CLOSED ou DISABLED ; NOT_YET_OPEN n'empêche pas la modification. */
    private void assertEditable(Salon salon) {
        String reason = computeClosedReason(salon);
        if ("CLOSED".equals(reason) || "DISABLED".equals(reason)) {
            throw new BadRequestAlertException("Inscriptions bénévoles fermées", ENTITY_NAME,
                    "volunteer-registration.closed");
        }
    }

    private boolean isEditable(Salon salon) {
        String reason = computeClosedReason(salon);
        return !"CLOSED".equals(reason) && !"DISABLED".equals(reason);
    }

    // -------------------- MAPPING --------------------

    private PublicVolunteerSalonInfoDTO toPublicSalonInfo(Salon salon) {
        PublicVolunteerSalonInfoDTO dto = new PublicVolunteerSalonInfoDTO();
        dto.setId(salon.getId().toString());
        dto.setPlace(salon.getPlace());
        dto.setStartingDate(salon.getStartingDate());
        dto.setEndingDate(salon.getEndingDate());
        dto.setWelcomeTitle(salon.getVolunteerRegistrationWelcomeTitle());
        dto.setWelcomeText(salon.getVolunteerRegistrationWelcomeText());
        dto.setRegistrationClosingDate(salon.getVolunteerRegistrationClosingDate());

        String closedReason = computeClosedReason(salon);
        dto.setClosedReason(closedReason);
        dto.setRegistrationOpen(closedReason == null);

        VolunteerPlanningConfiguration config = loadConfig(salon.getId());
        if (config != null) {
            for (VolunteerPlanningDay day : config.getDays()) {
                PublicVolunteerSalonInfoDTO.Day d = new PublicVolunteerSalonInfoDTO.Day();
                d.setId(day.getId());
                d.setLabel(day.getLabel());
                d.setDate(day.getDate());
                d.setDescription(day.getDescription());
                d.setStartTime(WallClock.hhmm(day.getStartTime()));
                d.setEndTime(WallClock.hhmm(day.getEndTime()));
                dto.getDays().add(d);
            }
            for (VolunteerPlanningCategory category : config.getCategories()) {
                PublicVolunteerSalonInfoDTO.Zone zone = new PublicVolunteerSalonInfoDTO.Zone();
                zone.setId(category.getId());
                zone.setLabel(category.getLabel());
                zone.setColor(category.getColor());
                zone.setIcon(category.getIcon());
                zone.setDescription(category.getDescription());
                zone.setDayIds(dayIdsForCategory(config, category.getId()));
                dto.getZones().add(zone);
            }
        }
        return dto;
    }

    /** Jours où la catégorie a au moins un besoin (NeedCell). On n'expose jamais les minimums. */
    private List<String> dayIdsForCategory(VolunteerPlanningConfiguration config, String categoryId) {
        List<String> dayIds = new ArrayList<>();
        for (VolunteerPlanningDay day : config.getDays()) {
            boolean hasNeed = day.getNeeds().stream().map(VolunteerPlanningNeed::getCategoryId)
                    .anyMatch(categoryId::equals);
            if (hasNeed) {
                dayIds.add(day.getId());
            }
        }
        return dayIds;
    }

    private VolunteerRegistrationDTO toDto(Salon salon, VolunteerRegistration registration) {
        VolunteerRegistrationDTO dto = new VolunteerRegistrationDTO();

        VolunteerRegistrationRequestDTO.Contact contact = new VolunteerRegistrationRequestDTO.Contact();
        contact.setFirstName(registration.getFirstName());
        contact.setLastName(registration.getLastName());
        contact.setEmail(registration.getEmail());
        contact.setPhoneNumber(registration.getPhoneNumber());
        dto.setContact(contact);

        List<VolunteerRegistrationRequestDTO.AvailabilityDay> availability = new ArrayList<>();
        for (VolunteerAvailabilityDay day : registration.getAvailability()) {
            VolunteerRegistrationRequestDTO.AvailabilityDay a = new VolunteerRegistrationRequestDTO.AvailabilityDay();
            a.setDayId(day.getDayId());
            a.setAvailable(day.isAvailable());
            a.setRanges(day.getRanges().stream().map(r -> {
                VolunteerRegistrationRequestDTO.TimeRange tr = new VolunteerRegistrationRequestDTO.TimeRange();
                tr.setStart(r.getStart());
                tr.setEnd(r.getEnd());
                return tr;
            }).collect(Collectors.toList()));
            availability.add(a);
        }
        dto.setAvailability(availability);

        VolunteerRegistrationRequestDTO.Preferences prefs = new VolunteerRegistrationRequestDTO.Preferences();
        prefs.setZoneMode(registration.getZoneMode().name());
        prefs.setCategoryIds(new ArrayList<>(registration.getCategoryIds()));
        prefs.setNotes(registration.getNotes());
        dto.setPreferences(prefs);

        dto.setAcceptContact(registration.getAcceptedContactAt() != null);
        dto.setStatus(registration.getStatus().name());
        dto.setEditable(isEditable(salon) && registration.getStatus() != VolunteerRegistrationStatus.REMOVED);
        dto.setRegistrationClosingDate(salon.getVolunteerRegistrationClosingDate());
        return dto;
    }

    // -------------------- CHARGEMENT --------------------

    private Salon loadSalon(UUID salonId) {
        return salonRepository.findById(salonId).orElseThrow(
                () -> new BadRequestAlertException("Salon introuvable", ENTITY_NAME, "volunteer-registration.salon-not-found"));
    }

    private VolunteerRegistration loadByToken(UUID salonId, UUID registrationId, String token) {
        VolunteerRegistration registration = registrationRepository.findById(registrationId).orElseThrow(
                () -> new BadRequestAlertException("Inscription introuvable", ENTITY_NAME,
                        "volunteer-registration.link-invalid"));

        boolean valid = SecureTokens.matches(registration.getToken(), token)
                && registration.getSalon() != null && salonId.equals(registration.getSalon().getId());
        if (!valid) {
            throw new BadRequestAlertException("Lien invalide", ENTITY_NAME, "volunteer-registration.link-invalid");
        }
        return registration;
    }

    private VolunteerPlanningConfiguration loadConfig(UUID salonId) {
        return Optional.ofNullable(planningRepository.findBySalonId(salonId))
                .map(PlanningVolunteerSalon::getConfiguration).orElse(null);
    }

    private VolunteerPlanningConfiguration requireConfig(UUID salonId) {
        VolunteerPlanningConfiguration config = loadConfig(salonId);
        if (config == null || config.getDays().isEmpty()) {
            throw new BadRequestAlertException("Planning bénévole indisponible", ENTITY_NAME,
                    "volunteer-registration.closed");
        }
        return config;
    }

    private boolean hasPlanningDays(UUID salonId) {
        VolunteerPlanningConfiguration config = loadConfig(salonId);
        return config != null && !config.getDays().isEmpty();
    }

    // -------------------- SNAPSHOT (pour la sync par différence) --------------------

    private VolunteerRegistration snapshot(VolunteerRegistration registration) {
        VolunteerRegistration copy = new VolunteerRegistration();
        copy.setId(registration.getId());
        copy.setStatus(registration.getStatus());
        copy.setPlanningVolunteerId(registration.getPlanningVolunteerId());
        copy.setFirstName(registration.getFirstName());
        copy.setLastName(registration.getLastName());

        List<VolunteerAvailabilityDay> availabilityCopy = new ArrayList<>();
        for (VolunteerAvailabilityDay day : registration.getAvailability()) {
            VolunteerAvailabilityDay d = new VolunteerAvailabilityDay();
            d.setDayId(day.getDayId());
            d.setAvailable(day.isAvailable());
            List<VolunteerTimeRange> rangesCopy = new ArrayList<>();
            for (VolunteerTimeRange range : day.getRanges()) {
                VolunteerTimeRange r = new VolunteerTimeRange();
                r.setStart(range.getStart());
                r.setEnd(range.getEnd());
                rangesCopy.add(r);
            }
            d.setRanges(rangesCopy);
            availabilityCopy.add(d);
        }
        copy.setAvailability(availabilityCopy);
        return copy;
    }

    // -------------------- UTILS --------------------

    private static String normalizeEmail(String email) {
        return StringUtils.defaultString(email).trim().toLowerCase(Locale.ROOT);
    }

    private static String sanitizePhoneNumber(String phone) {
        if (StringUtils.isBlank(phone)) {
            return null;
        }
        return phone.replaceAll("[\\s.()\\-]", "");
    }

    private int toMinutes(String hhmm) {
        if (StringUtils.isBlank(hhmm) || !hhmm.contains(":")) {
            return 0;
        }
        String[] parts = hhmm.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }

    private String toHhmm(int minutes) {
        return String.format("%02d:%02d", minutes / 60, minutes % 60);
    }
}
