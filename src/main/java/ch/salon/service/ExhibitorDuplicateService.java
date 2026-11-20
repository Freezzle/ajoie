package ch.salon.service;

import ch.salon.domain.Address;
import ch.salon.domain.Exhibitor;
import ch.salon.domain.Participation;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.EventLogRepository;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.service.dto.DuplicateCandidateDTO;
import ch.salon.service.dto.DuplicateMergeConflictDTO;
import ch.salon.service.dto.DuplicatePreviewDTO;
import ch.salon.service.dto.DuplicatePreviewFieldDTO;
import ch.salon.service.duplicate.DuplicateDecision;
import ch.salon.service.duplicate.DuplicateMatchCriterion;
import ch.salon.service.duplicate.DuplicatePreviewEffect;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExhibitorDuplicateService {

    public static final String ENTITY_NAME = "exhibitorDuplicate";
    private static final int PHONE_LAST_DIGITS = 7;
    private static final int IDENTITY_CHANGE_THRESHOLD = 4;

    private static final List<FieldDefinition> PREVIEW_FIELDS = List.of(
            new FieldDefinition("Informations de base", "firstName", "Prénom"),
            new FieldDefinition("Informations de base", "lastName", "Nom"),
            new FieldDefinition("Informations de base", "email", "E-mail"),
            new FieldDefinition("Informations de base", "phoneNumber", "Téléphone"),
            new FieldDefinition("Informations de base", "language", "Langue"),
            new FieldDefinition("Adresse du domicile", "homeStreet", "Rue"),
            new FieldDefinition("Adresse du domicile", "homeNumber", "Numéro"),
            new FieldDefinition("Adresse du domicile", "homeZip", "NPA"),
            new FieldDefinition("Adresse du domicile", "homeCity", "Localité"),
            new FieldDefinition("Adresse du domicile", "homeCountry", "Pays"),
            new FieldDefinition("Adresse de facturation", "differentBillingAddress", "Facturation différente"),
            new FieldDefinition("Adresse de facturation", "billingCompany", "Entreprise"),
            new FieldDefinition("Adresse de facturation", "billingStreet", "Rue"),
            new FieldDefinition("Adresse de facturation", "billingNumber", "Numéro"),
            new FieldDefinition("Adresse de facturation", "billingPoBox", "Case postale"),
            new FieldDefinition("Adresse de facturation", "billingZip", "NPA"),
            new FieldDefinition("Adresse de facturation", "billingCity", "Localité"),
            new FieldDefinition("Adresse de facturation", "billingCountry", "Pays"),
            new FieldDefinition("Préférences", "newsletter", "Newsletter"),
            new FieldDefinition("Informations internes", "redFlag", "Red flag"),
            new FieldDefinition("Informations internes", "extraInformation", "Infos supplémentaires")
    );

    private final ExhibitorRepository exhibitorRepository;
    private final ParticipationRepository participationRepository;
    private final EventLogRepository eventLogRepository;
    private final EventLogService eventLogService;

    @Transactional(readOnly = true)
    public Optional<Exhibitor> findBestDuplicateCandidate(String phoneNumber, String firstName, String lastName,
            UUID selfId) {
        Set<Exhibitor> candidates = new LinkedHashSet<>();
        String lastDigits = lastDigits(phoneNumber);
        if (lastDigits != null) {
            candidates.addAll(Optional.ofNullable(exhibitorRepository.findAllByPhoneNumberIsEndingWithIgnoreCase(lastDigits))
                                      .orElseGet(List::of));
        }

        if (StringUtils.isNotBlank(firstName) && StringUtils.isNotBlank(lastName)) {
            candidates.addAll(Optional.ofNullable(
                    exhibitorRepository.findAllByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase(firstName,
                            lastName)).orElseGet(List::of));
        }

        return candidates.stream()
                         .filter(candidate -> selfId == null || !Objects.equals(candidate.getId(), selfId))
                         .max(candidateComparator(phoneNumber, firstName, lastName));
    }

    @Transactional(readOnly = true)
    public List<DuplicateCandidateDTO> getDuplicateCandidates(UUID duplicateExhibitorId) {
        Exhibitor duplicate = exhibitorRepository.findById(duplicateExhibitorId).orElseThrow(
                () -> new BadRequestAlertException("Exposant introuvable", ENTITY_NAME, "duplicate.exhibitor-not-found"));

        Set<Exhibitor> found = new LinkedHashSet<>();
        if (duplicate.getDuplicateOfId() != null) {
            exhibitorRepository.findById(duplicate.getDuplicateOfId())
                              .filter(candidate -> !Objects.equals(candidate.getId(), duplicate.getId()))
                              .ifPresent(found::add);
        }
        findBestDuplicateCandidate(duplicate.getPhoneNumber(), duplicate.getFirstName(), duplicate.getLastName(),
                duplicate.getId()).ifPresent(found::add);

        String lastDigits = lastDigits(duplicate.getPhoneNumber());
        if (lastDigits != null) {
            found.addAll(Optional.ofNullable(exhibitorRepository.findAllByPhoneNumberIsEndingWithIgnoreCase(lastDigits))
                                 .orElseGet(List::of));
        }
        if (StringUtils.isNotBlank(duplicate.getFirstName()) && StringUtils.isNotBlank(duplicate.getLastName())) {
            found.addAll(Optional.ofNullable(
                    exhibitorRepository.findAllByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase(
                            duplicate.getFirstName(), duplicate.getLastName())).orElseGet(List::of));
        }

        if (StringUtils.isNotBlank(duplicate.getEmail())) {
            found.addAll(exhibitorRepository.findAllByEmailOrderByDuplicateDetectedAscRegistrationDateAsc(
                    duplicate.getEmail()));
        }

        found.removeIf(candidate -> Objects.equals(candidate.getId(), duplicate.getId()));

        List<Exhibitor> sorted = new ArrayList<>(found);
        sorted.sort(candidateComparator(duplicate.getPhoneNumber(), duplicate.getFirstName(), duplicate.getLastName())
                .reversed());

        UUID suggestedId = duplicate.getDuplicateOfId();
        if (suggestedId != null) {
            sorted.sort((a, b) -> Boolean.compare(!Objects.equals(a.getId(), suggestedId),
                    !Objects.equals(b.getId(), suggestedId)));
        }

        return sorted.stream().map(candidate -> toCandidateDto(duplicate, candidate,
                Objects.equals(candidate.getId(), suggestedId))).toList();
    }

    @Transactional(readOnly = true)
    public List<DuplicateCandidateDTO> searchCandidates(String query, int limit) {
        String normalizedQuery = normalize(query);
        String digits = digitsOnly(query);
        List<String> tokens = splitTokens(normalizedQuery);
        int max = Math.max(1, Math.min(limit, 50));

        return exhibitorRepository.findByOrderByRegistrationDateDesc().stream()
                                 .filter(exhibitor -> matchesSearch(exhibitor, tokens, digits))
                                 .limit(max)
                                 .map(exhibitor -> toCandidateDto(null, exhibitor, false))
                                 .toList();
    }

    @Transactional(readOnly = true)
    public DuplicatePreviewDTO buildPreview(UUID duplicateExhibitorId, UUID targetExhibitorId) {
        Exhibitor duplicate = exhibitorRepository.findById(duplicateExhibitorId).orElseThrow(
                () -> new BadRequestAlertException("Exposant introuvable", ENTITY_NAME, "duplicate.exhibitor-not-found"));
        Exhibitor target = exhibitorRepository.findById(targetExhibitorId).orElseThrow(
                () -> new BadRequestAlertException("Candidat introuvable", ENTITY_NAME, "duplicate.target-not-found"));

        if (Objects.equals(duplicate.getId(), target.getId())) {
            throw new BadRequestAlertException("Le candidat doit être différent", ENTITY_NAME,
                    "duplicate.target-same-as-source");
        }

        DuplicatePreviewDTO dto = new DuplicatePreviewDTO();
        dto.setDuplicateExhibitorId(duplicate.getId());
        dto.setTargetExhibitorId(target.getId());

        List<DuplicatePreviewFieldDTO> fields = PREVIEW_FIELDS.stream()
                                                              .map(field -> buildPreviewField(field, target, duplicate))
                                                              .toList();
        dto.setFields(fields);
        dto.setDifferenceCount((int) fields.stream().filter(field -> field.getEffect() != DuplicatePreviewEffect.SAME)
                                           .count());
        List<DuplicateMergeConflictDTO> conflicts = findMergeConflicts(duplicate.getId(), target.getId());
        dto.setMergeConflicts(conflicts);
        dto.setMergeBlocked(!conflicts.isEmpty());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<DuplicateMergeConflictDTO> findMergeConflicts(UUID duplicateId, UUID targetId) {
        Map<UUID, Participation> targetBySalon = new LinkedHashMap<>();
        participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(targetId).stream()
                               .filter(ExhibitorDuplicateService::isActive)
                               .forEach(p -> targetBySalon.putIfAbsent(p.getSalon().getId(), p));

        List<DuplicateMergeConflictDTO> conflicts = new ArrayList<>();
        for (Participation own : participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(duplicateId)) {
            Participation other = isActive(own) ? targetBySalon.get(own.getSalon().getId()) : null;
            if (other == null) {
                continue;
            }
            DuplicateMergeConflictDTO conflict = new DuplicateMergeConflictDTO();
            conflict.setSalonId(own.getSalon().getId());
            conflict.setSalonPlace(own.getSalon().getPlace());
            conflict.setSalonStartingDate(own.getSalon().getStartingDate());
            conflict.setDuplicateParticipationId(own.getId());
            conflict.setDuplicateClientNumber(own.getClientNumber());
            conflict.setDuplicateStatus(own.getStatus());
            conflict.setTargetParticipationId(other.getId());
            conflict.setTargetClientNumber(other.getClientNumber());
            conflict.setTargetStatus(other.getStatus());
            conflicts.add(conflict);
        }
        return conflicts;
    }

    private static boolean isActive(Participation participation) {
        return participation.getSalon() != null && participation.getStatus() != null
                && participation.getStatus().isActiveStatus();
    }

    @Transactional(readOnly = true)
    public boolean shouldForceManualDuplicate(Exhibitor existing, String firstName, String lastName, String email,
            String phoneNumber, String language) {
        if (existing == null) {
            return false;
        }

        boolean sameEmail = normalize(existing.getEmail()).equals(normalize(email));
        boolean firstNameDiffers = !normalize(existing.getFirstName()).equals(normalize(firstName));
        boolean lastNameDiffers = !normalize(existing.getLastName()).equals(normalize(lastName));
        if (sameEmail && firstNameDiffers && lastNameDiffers) {
            return true;
        }

        int changes = 0;
        if (firstNameDiffers) {
            changes++;
        }
        if (lastNameDiffers) {
            changes++;
        }
        if (!sameEmail) {
            changes++;
        }
        if (!Objects.equals(digitsOnly(existing.getPhoneNumber()), digitsOnly(phoneNumber))) {
            changes++;
        }
        if (!normalize(existing.getLanguage()).equals(normalize(language))) {
            changes++;
        }
        return changes >= IDENTITY_CHANGE_THRESHOLD;
    }

    @Transactional
    public void resolveForParticipation(Participation participation, DuplicateDecision decision, UUID targetExhibitorId) {
        if (participation == null || participation.getExhibitor() == null) {
            throw new BadRequestAlertException("Participation invalide", ENTITY_NAME, "duplicate.participation-invalid");
        }

        Exhibitor duplicate = exhibitorRepository.findById(participation.getExhibitor().getId()).orElseThrow(
                () -> new BadRequestAlertException("Exposant introuvable", ENTITY_NAME, "duplicate.exhibitor-not-found"));

        if (decision == null) {
            throw new BadRequestAlertException("Décision requise", ENTITY_NAME, "duplicate.decision-required");
        }

        switch (decision) {
            case MERGE -> {
                Exhibitor target = validateTargetExhibitor(duplicate, targetExhibitorId);
                merge(duplicate, target);
                eventLogService.eventFromSystem("Exposant fusionné dans #" + target.getId(), EventType.ACTION,
                        EntityType.PARTICIPATION, participation.getId(), Map.of("decision", decision.name(),
                                "targetExhibitorId", target.getId().toString(),
                                "duplicateExhibitorId", duplicate.getId().toString()));
            }
            case NOT_DUPLICATE -> {
                clearDuplicateFlags(duplicate);
                eventLogService.eventFromSystem("Marqué comme pas un doublon", EventType.ACTION, EntityType.EXHIBITOR,
                        duplicate.getId(), targetExhibitorId != null ? Map.of("targetExhibitorId",
                                targetExhibitorId.toString()) : null);
                eventLogService.eventFromSystem("Décision doublon: pas un doublon", EventType.ACTION,
                        EntityType.PARTICIPATION, participation.getId(), Map.of("decision", decision.name(),
                                "duplicateExhibitorId", duplicate.getId().toString()));
            }
            case KEEP_SEPARATE -> {
                Exhibitor target = validateTargetExhibitor(duplicate, targetExhibitorId);
                clearDuplicateFlags(duplicate);
                eventLogService.eventFromSystem("Doublon connu, fiches gardées séparées", EventType.ACTION,
                        EntityType.EXHIBITOR, duplicate.getId(), Map.of("targetExhibitorId", target.getId().toString()));
                eventLogService.eventFromSystem("Décision doublon: garder séparé", EventType.ACTION,
                        EntityType.PARTICIPATION, participation.getId(),
                        Map.of("decision", decision.name(), "targetExhibitorId", target.getId().toString(),
                                "duplicateExhibitorId", duplicate.getId().toString()));
            }
        }
    }

    @Transactional
    public void merge(Exhibitor duplicate, Exhibitor target) {
        if (duplicate == null || target == null) {
            throw new BadRequestAlertException("Fusion invalide", ENTITY_NAME, "duplicate.merge-invalid");
        }
        if (Objects.equals(duplicate.getId(), target.getId())) {
            throw new BadRequestAlertException("Le candidat doit être différent", ENTITY_NAME,
                    "duplicate.target-same-as-source");
        }

        UUID duplicateId = duplicate.getId();
        UUID targetId = target.getId();

        if (!findMergeConflicts(duplicateId, targetId).isEmpty()) {
            throw new BadRequestAlertException("Une participation active existe déjà pour le même salon", ENTITY_NAME,
                    "duplicate.merge-conflict");
        }

        DuplicatePreviewDTO preview = buildPreview(duplicateId, targetId);
        List<String> movedParticipationIds = participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(
                        duplicateId)
                                                                     .stream()
                                                                     .map(Participation::getId)
                                                                     .filter(Objects::nonNull)
                                                                     .map(UUID::toString)
                                                                     .toList();

        // Les mises à jour en masse ci-dessous ne rafraîchissent pas le contexte de persistance :
        // on le vide (clearAutomatically) pour éviter de retravailler ensuite des entités devenues obsolètes.
        participationRepository.reassignExhibitor(duplicate, target);
        eventLogRepository.moveReference(EntityType.EXHIBITOR, duplicateId, targetId);
        exhibitorRepository.redirectDuplicateReferences(duplicateId, targetId);

        // Le contexte de persistance ayant été vidé, on recharge des instances gérées à jour.
        Exhibitor managedDuplicate = exhibitorRepository.findById(duplicateId).orElseThrow(
                () -> new BadRequestAlertException("Exposant introuvable", ENTITY_NAME, "duplicate.exhibitor-not-found"));
        Exhibitor managedTarget = exhibitorRepository.findById(targetId).orElseThrow(
                () -> new BadRequestAlertException("Candidat introuvable", ENTITY_NAME, "duplicate.target-not-found"));

        // Le doublon est supprimé en premier : la cible reprend son e-mail, et la contrainte d'unicité
        // exhibitor_email_key interdit que les deux lignes coexistent. Ses valeurs restent lisibles en mémoire.
        exhibitorRepository.delete(managedDuplicate);
        exhibitorRepository.flush();

        applyMergedData(managedTarget, managedDuplicate);
        managedTarget.setDuplicateDetected(false);
        managedTarget.setDuplicateOfId(null);
        exhibitorRepository.save(managedTarget);
        exhibitorRepository.flush();

        eventLogService.eventFromSystem("Fusion du doublon #" + duplicateId, EventType.ACTION, EntityType.EXHIBITOR,
                targetId, Map.of("duplicateId", duplicateId.toString(),
                        "updatedFields", preview.getFields().stream()
                                                .filter(field -> field.getEffect() != DuplicatePreviewEffect.SAME)
                                                .map(DuplicatePreviewFieldDTO::getKey)
                                                .collect(Collectors.joining(",")),
                        "movedParticipationIds", String.join(",", movedParticipationIds)));
    }

    private Exhibitor validateTargetExhibitor(Exhibitor duplicate, UUID targetExhibitorId) {
        if (targetExhibitorId == null) {
            throw new BadRequestAlertException("Candidat requis", ENTITY_NAME, "duplicate.target-required");
        }

        if (Objects.equals(duplicate.getId(), targetExhibitorId)) {
            throw new BadRequestAlertException("Le candidat doit être différent", ENTITY_NAME,
                    "duplicate.target-same-as-source");
        }

        return exhibitorRepository.findById(targetExhibitorId).orElseThrow(
                () -> new BadRequestAlertException("Candidat introuvable", ENTITY_NAME, "duplicate.target-not-found"));
    }

    private void clearDuplicateFlags(Exhibitor duplicate) {
        duplicate.setDuplicateDetected(false);
        duplicate.setDuplicateOfId(null);
        exhibitorRepository.save(duplicate);
    }

    private void applyMergedData(Exhibitor target, Exhibitor duplicate) {
        target.setFirstName(duplicate.getFirstName());
        target.setLastName(duplicate.getLastName());
        target.setEmail(duplicate.getEmail());
        target.setPhoneNumber(duplicate.getPhoneNumber());
        target.setLanguage(duplicate.getLanguage());
        target.setNewsletter(duplicate.isNewsletter());
        target.setRedFlag(duplicate.isRedFlag());
        target.setDifferentBillingAddress(duplicate.getDifferentBillingAddress());
        target.setExtraInformation(mergeExtraInformation(target.getExtraInformation(), duplicate.getExtraInformation()));

        target.setHomeAddress(copyAddress(duplicate.getHomeAddress(), target.getHomeAddress()));
        if (Boolean.TRUE.equals(duplicate.getDifferentBillingAddress())) {
            target.setBillingAddress(copyAddress(duplicate.getBillingAddress(), target.getBillingAddress()));
        } else {
            target.setBillingAddress(null);
        }

        if (target.getBankAccount() == null && duplicate.getBankAccount() != null) {
            target.setBankAccount(duplicate.getBankAccount());
        }
    }

    private Address copyAddress(Address source, Address currentTargetAddress) {
        if (source == null) {
            return null;
        }
        Address target = currentTargetAddress != null ? currentTargetAddress : new Address();
        target.setFormalLine(source.getFormalLine());
        target.setFullName(source.getFullName());
        target.setPostalCase(source.getPostalCase());
        target.setStreet(source.getStreet());
        target.setHouseNumber(source.getHouseNumber());
        target.setPostalCode(source.getPostalCode());
        target.setCity(source.getCity());
        target.setIsoCountry(source.getIsoCountry());
        target.setExtraLine(source.getExtraLine());
        return target;
    }

    private String mergeExtraInformation(String current, String incoming) {
        String left = StringUtils.trimToNull(current);
        String right = StringUtils.trimToNull(incoming);
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return left + "\n" + right;
    }

    private DuplicatePreviewFieldDTO buildPreviewField(FieldDefinition field, Exhibitor target, Exhibitor duplicate) {
        String currentValue = stringValue(readFieldValue(target, field.key()));
        String newValue = stringValue(readFieldValue(duplicate, field.key()));
        DuplicatePreviewEffect effect = computePreviewEffect(currentValue, newValue);

        DuplicatePreviewFieldDTO dto = new DuplicatePreviewFieldDTO();
        dto.setGroup(field.group());
        dto.setKey(field.key());
        dto.setLabel(field.label());
        dto.setCurrentValue(currentValue);
        dto.setNewValue(newValue);
        dto.setEffect(effect);
        return dto;
    }

    private Object readFieldValue(Exhibitor exhibitor, String key) {
        return switch (key) {
            case "firstName" -> exhibitor.getFirstName();
            case "lastName" -> exhibitor.getLastName();
            case "email" -> exhibitor.getEmail();
            case "phoneNumber" -> exhibitor.getPhoneNumber();
            case "language" -> exhibitor.getLanguage();
            case "homeStreet" -> exhibitor.getHomeAddress() != null ? exhibitor.getHomeAddress().getStreet() : null;
            case "homeNumber" -> exhibitor.getHomeAddress() != null ? exhibitor.getHomeAddress().getHouseNumber() : null;
            case "homeZip" -> exhibitor.getHomeAddress() != null ? exhibitor.getHomeAddress().getPostalCode() : null;
            case "homeCity" -> exhibitor.getHomeAddress() != null ? exhibitor.getHomeAddress().getCity() : null;
            case "homeCountry" -> exhibitor.getHomeAddress() != null ? exhibitor.getHomeAddress().getIsoCountry() : null;
            case "differentBillingAddress" -> exhibitor.getDifferentBillingAddress();
            case "billingCompany" -> exhibitor.getBillingAddress() != null ? exhibitor.getBillingAddress().getFullName() :
                    null;
            case "billingStreet" -> exhibitor.getBillingAddress() != null ? exhibitor.getBillingAddress().getStreet() :
                    null;
            case "billingNumber" -> exhibitor.getBillingAddress() != null ?
                    exhibitor.getBillingAddress().getHouseNumber() : null;
            case "billingPoBox" -> exhibitor.getBillingAddress() != null ? exhibitor.getBillingAddress().getPostalCase() :
                    null;
            case "billingZip" -> exhibitor.getBillingAddress() != null ? exhibitor.getBillingAddress().getPostalCode() :
                    null;
            case "billingCity" -> exhibitor.getBillingAddress() != null ? exhibitor.getBillingAddress().getCity() : null;
            case "billingCountry" -> exhibitor.getBillingAddress() != null ?
                    exhibitor.getBillingAddress().getIsoCountry() : null;
            case "newsletter" -> exhibitor.isNewsletter();
            case "redFlag" -> exhibitor.isRedFlag();
            case "extraInformation" -> exhibitor.getExtraInformation();
            default -> null;
        };
    }

    private DuplicatePreviewEffect computePreviewEffect(String currentValue, String newValue) {
        if (Objects.equals(currentValue, newValue)) {
            return DuplicatePreviewEffect.SAME;
        }
        if (StringUtils.isBlank(newValue) && StringUtils.isNotBlank(currentValue)) {
            return DuplicatePreviewEffect.EMPTIED;
        }
        return DuplicatePreviewEffect.UPDATED;
    }

    private String stringValue(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof Boolean bool) {
            return bool ? "Oui" : "Non";
        }
        return String.valueOf(value);
    }

    private DuplicateCandidateDTO toCandidateDto(Exhibitor source, Exhibitor candidate, boolean suggested) {
        DuplicateCandidateDTO dto = new DuplicateCandidateDTO();
        dto.setId(candidate.getId());
        dto.setFirstName(candidate.getFirstName());
        dto.setLastName(candidate.getLastName());
        dto.setEmail(candidate.getEmail());
        dto.setPhoneNumber(candidate.getPhoneNumber());
        dto.setHomeCity(candidate.getHomeAddress() != null ? candidate.getHomeAddress().getCity() : null);
        dto.setHomePostalCode(candidate.getHomeAddress() != null ? candidate.getHomeAddress().getPostalCode() : null);
        dto.setRegistrationDate(candidate.getRegistrationDate());
        dto.setParticipationsCount(participationRepository.countByExhibitorId(candidate.getId()));
        dto.setSuggested(suggested);
        dto.setCriteria(source != null ? matchingCriteria(source, candidate) : List.of());
        return dto;
    }

    private List<DuplicateMatchCriterion> matchingCriteria(Exhibitor source, Exhibitor candidate) {
        List<DuplicateMatchCriterion> criteria = new ArrayList<>();

        if (normalize(source.getEmail()).equals(normalize(candidate.getEmail()))) {
            criteria.add(DuplicateMatchCriterion.SAME_EMAIL);
        }
        if (Objects.equals(lastDigits(source.getPhoneNumber()), lastDigits(candidate.getPhoneNumber()))
                && lastDigits(source.getPhoneNumber()) != null) {
            criteria.add(DuplicateMatchCriterion.SAME_PHONE);
        }
        if (isSameName(source, candidate)) {
            criteria.add(DuplicateMatchCriterion.SAME_NAME);
        } else if (isSimilarName(source, candidate)) {
            criteria.add(DuplicateMatchCriterion.SIMILAR_NAME);
        }
        if (isSameAddress(source, candidate)) {
            criteria.add(DuplicateMatchCriterion.SAME_ADDRESS);
        } else if (isSameStreet(source, candidate)) {
            criteria.add(DuplicateMatchCriterion.SAME_STREET);
        }
        return criteria;
    }

    private Comparator<Exhibitor> candidateComparator(String phoneNumber, String firstName, String lastName) {
        return Comparator.<Exhibitor>comparingInt(candidate -> scoreCandidate(candidate, phoneNumber, firstName, lastName))
                         .thenComparingLong(candidate -> participationRepository.countByExhibitorId(candidate.getId()))
                         .thenComparing(Exhibitor::getRegistrationDate,
                                 Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private int scoreCandidate(Exhibitor candidate, String phoneNumber, String firstName, String lastName) {
        Exhibitor source = new Exhibitor();
        source.setPhoneNumber(phoneNumber);
        source.setFirstName(firstName);
        source.setLastName(lastName);

        if (Objects.equals(lastDigits(source.getPhoneNumber()), lastDigits(candidate.getPhoneNumber()))
                && lastDigits(source.getPhoneNumber()) != null) {
            return 3;
        }
        if (isSameName(source, candidate)) {
            return 2;
        }
        if (isSimilarName(source, candidate)) {
            return 1;
        }
        return 0;
    }

    private boolean isSameName(Exhibitor left, Exhibitor right) {
        return normalize(left.getFirstName()).equals(normalize(right.getFirstName()))
                && normalize(left.getLastName()).equals(normalize(right.getLastName()));
    }

    private boolean isSimilarName(Exhibitor left, Exhibitor right) {
        String leftFirst = normalize(left.getFirstName());
        String rightFirst = normalize(right.getFirstName());
        String leftLast = normalize(left.getLastName());
        String rightLast = normalize(right.getLastName());
        if (!leftFirst.equals(rightFirst)) {
            return false;
        }
        return leftLast.contains(rightLast) || rightLast.contains(leftLast);
    }

    private boolean isSameAddress(Exhibitor left, Exhibitor right) {
        Address l = left.getHomeAddress();
        Address r = right.getHomeAddress();
        if (l == null || r == null) {
            return false;
        }
        return normalize(l.getStreet()).equals(normalize(r.getStreet()))
                && normalize(l.getHouseNumber()).equals(normalize(r.getHouseNumber()))
                && normalize(l.getPostalCode()).equals(normalize(r.getPostalCode()))
                && normalize(l.getCity()).equals(normalize(r.getCity()));
    }

    private boolean isSameStreet(Exhibitor left, Exhibitor right) {
        Address l = left.getHomeAddress();
        Address r = right.getHomeAddress();
        if (l == null || r == null) {
            return false;
        }
        return normalize(l.getStreet()).equals(normalize(r.getStreet()))
                && normalize(l.getPostalCode()).equals(normalize(r.getPostalCode()));
    }

    private boolean matchesSearch(Exhibitor exhibitor, List<String> tokens, String digitQuery) {
        if (tokens.isEmpty() && StringUtils.isBlank(digitQuery)) {
            return true;
        }

        String haystack = normalize(String.join(" ", List.of(
                StringUtils.defaultString(exhibitor.getFirstName()),
                StringUtils.defaultString(exhibitor.getLastName()),
                StringUtils.defaultString(exhibitor.getEmail()),
                StringUtils.defaultString(exhibitor.getPhoneNumber()),
                exhibitor.getHomeAddress() != null ? StringUtils.defaultString(exhibitor.getHomeAddress().getPostalCode()) :
                        "",
                exhibitor.getHomeAddress() != null ? StringUtils.defaultString(exhibitor.getHomeAddress().getCity()) : "",
                exhibitor.getHomeAddress() != null ? StringUtils.defaultString(exhibitor.getHomeAddress().getStreet()) : ""
        )));

        boolean tokenMatch = tokens.stream().allMatch(haystack::contains);
        if (StringUtils.isBlank(digitQuery)) {
            return tokenMatch;
        }

        String phoneDigits = digitsOnly(exhibitor.getPhoneNumber());
        return tokenMatch || (phoneDigits != null && phoneDigits.contains(digitQuery));
    }

    private List<String> splitTokens(String normalizedQuery) {
        if (StringUtils.isBlank(normalizedQuery)) {
            return List.of();
        }
        return List.of(normalizedQuery.split("\\s+")).stream().filter(StringUtils::isNotBlank).toList();
    }

    private String lastDigits(String phoneNumber) {
        String digits = digitsOnly(phoneNumber);
        if (digits == null || digits.length() < PHONE_LAST_DIGITS) {
            return null;
        }
        return digits.substring(digits.length() - PHONE_LAST_DIGITS);
    }

    private String digitsOnly(String value) {
        if (StringUtils.isBlank(value)) {
            return null;
        }
        String digits = value.replaceAll("\\D", "");
        return StringUtils.isBlank(digits) ? null : digits;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                         .replaceAll("\\p{M}", "")
                         .toLowerCase(Locale.ROOT)
                         .trim();
    }

    private record FieldDefinition(String group, String key, String label) {
    }
}
