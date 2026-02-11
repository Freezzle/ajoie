package ch.salon.service;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.ModePaymentMeals;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.repository.WorkshopRepository;
import ch.salon.service.dto.ParticipationDTO;
import ch.salon.service.mapper.ParticipationMapper;
import lombok.AllArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class Importation2026Service {

    private static final Logger log = LoggerFactory.getLogger(Importation2026Service.class);
    private static final int PARTICIPATION_REGISTRATION_DATE = 0;
    private static final int EXHIBITOR_EMAIL = 1;
    private static final int EXHIBITOR_FAMILY_NAME = 2;
    private static final int EXHIBITOR_FIRSTNAME = 3;
    private static final int PARTICIPATION_ENTERPRISE_NAME = 4;
    private static final int EXHIBITOR_ADDRESS = 5;
    private static final int EXHIBITOR_NPA_LOCALITE = 6;
    private static final int EXHIBITOR_PHONE_NUMBER = 7;
    private static final int STAND_DESCRIPTION = 8;
    private static final int STAND_WEBSITE = 9;
    private static final int STAND_FACEBOOK = 10;
    private static final int STAND_INSTAGRAM = 11;
    private static final int PARTICIPATION_MEAL_1 = 12;
    private static final int PARTICIPATION_MEAL_2 = 13;
    private static final int PARTICIPATION_MEAL_3 = 14;
    private static final int PARTICIPATION_PREFERENCE_PAYMENT_MEALS = 15;
    private static final int STAND_DIMENSION = 16;
    private static final int CONFERENCE_WANT = 17;
    private static final int CONFERENCE_TITLE = 18;
    private static final int CONFERENCE_DESCRIPTION = 19;
    private static final int WORKSHOP_WANT = 20;
    private static final int WORKSHOP_TITLE = 21;
    private static final int WORKSHOP_DESCRIPTION = 22;
    private static final int STAND_SHARING = 23;
    private static final int STAND_NB_TABLE = 24;
    private static final int STAND_NB_CHAIR = 25;
    private static final int STAND_ELECTRICITY = 26;
    private static final int PARTICIPATION_WANT_OFFER = 27;
    private static final int PARTICIPATION_OFFER_DESCRIPTION = 28;
    private static final int PARTICIPATION_PREFERENCE_INVOICE_SENDING = 29;
    private static final int EXHIBITOR_WANT_NEWSLETTER = 30;
    private static final int PARTICIPATION_COMPLEMENT = 31;
    private static final int PARTICIPATION_REGISTRATION_CHART = 32;
    private static final int PARTICIPATION_EVENT_CHART = 33;
    private static final int STAND_URL_PICTURE = 34;

    private static final String LANG_FR = Locale.FRENCH.getLanguage();
    private static final String YES_FR = "oui";
    private static final String NONE_FR = "Aucune";
    private static final DateTimeFormatter[] REG_DATE_FMTS =
            new DateTimeFormatter[]{DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"), DateTimeFormatter.ofPattern(
                    "MM/dd/yyyy HH:mm:ss"), DateTimeFormatter.ofPattern(
                    "M/d/yyyy H:mm:ss"), DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm"), DateTimeFormatter.ofPattern(
                    "M/d/yyyy H:mm")};

    private final SalonRepository salonRepository;
    private final StandRepository standRepository;
    private final ExhibitorRepository exhibitorRepository;
    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final ParticipationRepository participationRepository;
    private final RefreshInvoicingPlansService refreshInvoicingPlansService;
    private final EventLogService eventLogService;
    private final ParticipationMapper participationMapper;

    @Transactional
    public List<ParticipationDTO> importData(String idSalon, InputStream file) {
        List<Participation> participationsNew = new  ArrayList<>();

        Salon currentSalon = salonRepository.findById(UUID.fromString(idSalon)).orElseThrow(
                () -> new IllegalArgumentException("Salon introuvable: " + idSalon));

        // Cache des dimensions existantes pour éviter des SELECT/INSERT répétitifs
        Map<String, PriceStandSalon> dimensionsCache = currentSalon.getPriceStandSalons().stream().collect(
                Collectors.toMap(d -> d.getDimension().toLowerCase(Locale.ROOT), Function.identity(), (a, b) -> a,
                        LinkedHashMap::new));

        try (Reader reader = new InputStreamReader(file, StandardCharsets.UTF_8);
             CSVParser csv = new CSVParser(reader, CSVFormat.EXCEL.withDelimiter(',').withFirstRecordAsHeader())) {

            for (CSVRecord r : csv) {
                String rawRegDate = safeGet(r, PARTICIPATION_REGISTRATION_DATE);
                if (StringUtils.isBlank(rawRegDate)) {
                    // on considère qu'il n'y a plus d'enregistrements utiles
                    break;
                }

                String email = sanitize(r, EXHIBITOR_EMAIL, true, false, false);
                if (StringUtils.isBlank(email)) {
                    log.warn("Ignored line {} : empty email", r.getRecordNumber());
                    continue;
                }
                if (participationRepository.findByExhibitorEmailAndSalonId(email, currentSalon.getId()) != null) {
                    log.info("Already imported: email={} salonId={}", email, currentSalon.getId());
                    continue;
                }

                Instant registrationDate = parseRegistrationInstant(rawRegDate);

                String firstName = sanitize(r, EXHIBITOR_FIRSTNAME, true, true, true);
                String lastName = sanitize(r, EXHIBITOR_FAMILY_NAME, true, true, true);
                String address = sanitize(r, EXHIBITOR_ADDRESS, true, true, false);
                String npaLoc = sanitize(r, EXHIBITOR_NPA_LOCALITE, true, true, true);
                String rawPhone = sanitize(r, EXHIBITOR_PHONE_NUMBER, false, false, false);
                String phone = sanitizePhoneNumber(rawPhone);
                boolean wantsNews = parseYes(sanitize(r, EXHIBITOR_WANT_NEWSLETTER, true, false, false));

                Exhibitor exhibitor = upsertExhibitor(email, firstName, lastName, address, npaLoc, phone, wantsNews,
                        registrationDate);
                Participation participation = buildParticipation(r, currentSalon, exhibitor, registrationDate);
                participation = participationRepository.save(participation);

                Stand stand = buildStand(r, participation, dimensionsCache, registrationDate);
                standRepository.save(stand);

                // --- CONFERENCE ---
                if (parseYes(sanitize(r, CONFERENCE_WANT, true, false, false))) {
                    Conference conf = new Conference();
                    conf.setRegistrationDate(registrationDate);
                    conf.setParticipation(participation);
                    conf.setTitle(sub500(sanitize(r, CONFERENCE_TITLE, false, true, false)));
                    conf.setDescription(sub500(sanitize(r, CONFERENCE_DESCRIPTION, false, true, false)));
                    conf.setStatus(Status.IN_VERIFICATION);
                    conferenceRepository.save(conf);
                }

                // --- WORKSHOP ---
                if (parseYes(sanitize(r, WORKSHOP_WANT, true, false, false))) {
                    Workshop ws = new Workshop();
                    ws.setRegistrationDate(parseRegistrationInstant(rawRegDate));
                    ws.setParticipation(participation);
                    ws.setTitle(sub500(sanitize(r, WORKSHOP_TITLE, false, true, false)));
                    ws.setDescription(sub500(sanitize(r, WORKSHOP_DESCRIPTION, false, true, false)));
                    ws.setStatus(Status.IN_VERIFICATION);
                    workshopRepository.save(ws);
                }

                // --- EVENTS / INVOICES ---
                eventLogService.eventFromSystem("Participation créée", EventType.EVENT, EntityType.PARTICIPATION,
                        participation.getId(), null);

                refreshInvoicingPlansService.refreshInvoicingPlans(participation.getId().toString());

                participationsNew.add(participation);
            }
        } catch (IOException e) {
            log.error("Erreur d'I/O pendant l'import", e);
            throw new IllegalStateException("Un problème est survenu pendant l'import CSV.", e);
        }

        return participationsNew.stream().map(participationMapper::toDto).toList();
    }

    // -------------------- BUILDERS --------------------

    private Participation buildParticipation(CSVRecord r, Salon salon, Exhibitor exhibitor, Instant rawRegDate) {
        String therapistName = sanitize(r, PARTICIPATION_ENTERPRISE_NAME, false, true, false);

        long meal1 = parseLongOrZero(sanitize(r, PARTICIPATION_MEAL_1, false, false, false));
        long meal2 = parseLongOrZero(sanitize(r, PARTICIPATION_MEAL_2, false, false, false));
        long meal3 = parseLongOrZero(sanitize(r, PARTICIPATION_MEAL_3, false, false, false));

        String payMealsPref = sanitize(r, PARTICIPATION_PREFERENCE_PAYMENT_MEALS, true, false, false);
        String sendInvPref = sanitize(r, PARTICIPATION_PREFERENCE_INVOICE_SENDING, true, false, false);

        String registrationChart = sanitize(r, PARTICIPATION_REGISTRATION_CHART, true, false, false);
        String eventChart = sanitize(r, PARTICIPATION_EVENT_CHART, true, false, false);

        String additionnal = sanitize(r, PARTICIPATION_COMPLEMENT, false, true, false);
        boolean hasOffer = parseYes(sanitize(r, PARTICIPATION_WANT_OFFER, false, false, false));
        String offerDesc = sanitize(r, PARTICIPATION_OFFER_DESCRIPTION, false, false, false);

        Participation p = new Participation();
        p.setClientNumber(
                Participation.incrementClientNumber(participationRepository.findMaxClientNumber(salon.getId()),
                        salon.getReferenceNumber()));

        p.setSalon(salon);
        p.setExhibitor(exhibitor);
        p.setTherapistName(therapistName != null ? sub100(therapistName) :
                sub100(exhibitor.getLastName() + " " + exhibitor.getFirstName()));
        p.setNbMeal1(meal1);
        p.setNbMeal2(meal2);
        p.setNbMeal3(meal3);

        p.setModePaymentMeals(parseModePaymentMeals(payMealsPref));
        p.setInvoiceSendingMethod(parseInvoiceSendingMethod(sendInvPref));
        p.setAcceptedContract(StringUtils.containsIgnoreCase(registrationChart, "accepte"));
        p.setAdditionnalInformation(additionnal);
        p.setHasOffer(hasOffer);
        p.setOffer(sub500(offerDesc));
        p.setCrushOfHeart(false);
        p.setGuestOfHonor(false);
        p.setAcceptedChart(StringUtils.containsIgnoreCase(eventChart, "accepte"));
        p.setRegistrationDate(rawRegDate);
        p.setStatus(Status.IN_VERIFICATION);
        p.setNeedArrangement(false);
        p.setExtraInformation(null);
        return p;
    }

    private Stand buildStand(CSVRecord r, Participation participation, Map<String, PriceStandSalon> dimensionsCache,
            Instant now) {

        String description = sanitize(r, STAND_DESCRIPTION, false, true, false);
        String dimRaw = sanitize(r, STAND_DIMENSION, false, false, false);
        String sharing = sanitize(r, STAND_SHARING, true, false, false);
        String nbTable = sanitize(r, STAND_NB_TABLE, false, false, false);
        String nbChair = sanitize(r, STAND_NB_CHAIR, false, false, false);
        String electricity = sanitize(r, STAND_ELECTRICITY, true, false, false);
        String website = sanitize(r, STAND_WEBSITE, true, false, false);
        String insta = sanitize(r, STAND_INSTAGRAM, true, false, false);
        String fb = sanitize(r, STAND_FACEBOOK, true, false, false);
        String urlPicture = sanitize(r, STAND_URL_PICTURE, false, false, false);

        Stand s = new Stand();
        s.setRegistrationDate(now);
        s.setParticipation(participation);
        s.setDescription(sub500(description));
        s.setWebsite(sanitizeUrl(sub100(website)));
        s.setInstagram(sanitizeUrl(sub100(insta)));
        s.setFacebook(sanitizeUrl(sub100(fb)));
        s.setUrlPicture(sub500(urlPicture));
        s.setDimension(resolveDimension(dimensionsCache, dimRaw));
        s.setShared(parseYes(sharing));
        s.setNbTable(parseFirstDigitOrZero(nbTable, NONE_FR));
        s.setNbChair(parseFirstDigitOrZero(nbChair, NONE_FR));
        s.setNeedElectricity(parseYes(electricity));
        s.setStatus(Status.IN_VERIFICATION);
        s.setExtraInformation(null);
        return s;
    }

    // -------------------- EXHIBITOR UPSERT & DUPLICATES --------------------

    private Exhibitor upsertExhibitor(String email, String firstName, String lastName, String address,
            String npaLocalite, String phone, boolean wantsNewsletter, Instant now) {

        Exhibitor current = exhibitorRepository.findByEmail(email);

        if (current == null) {
            current = new Exhibitor();
            current.setDuplicateDetected(detectAndFlagDuplicates(phone, firstName, lastName));
            current.setEmail(sub100(email));
            current.setLanguage(LANG_FR);
            current.setRegistrationDate(now);
        }

        current.setFirstName(sub100(StringUtils.defaultString(firstName).trim()));
        current.setLastName(sub100(StringUtils.defaultString(lastName).trim()));

        Address homeAddress = new Address();
        homeAddress.setIsoCountry("CH");
        homeAddress.setPostalCode(Address.extractPostalCode(npaLocalite));
        homeAddress.setCity(Address.extractCityName(npaLocalite));
        homeAddress.setStreet(Address.extractStreetName(address));
        homeAddress.setHouseNumber(Address.extractHouseNumber(address));

        current.setHomeAddress(homeAddress);
        current.setPhoneNumber(phone);
        current.setNewsletter(wantsNewsletter);

        return exhibitorRepository.save(current);
    }

    private boolean detectAndFlagDuplicates(String phone, String firstName, String lastName) {
        boolean duplicateDetected = false;

        // 1) Match téléphone (6 derniers chiffres)
        String last6 = Optional.ofNullable(phone).filter(p -> p.length() >= 6).map(p -> p.substring(p.length() - 6))
                               .orElse(null);

        if (last6 != null) {
            List<Exhibitor> phoneMatches =
                    Optional.ofNullable(exhibitorRepository.findAllByPhoneNumberIsEndingWithIgnoreCase(last6))
                            .orElseGet(ArrayList::new);

            if (!phoneMatches.isEmpty()) {
                duplicateDetected = true;
                phoneMatches.forEach(e -> e.setDuplicateDetected(true));
                exhibitorRepository.saveAll(phoneMatches);
            }
        }

        // 2) Match prénom + nom si pas déjà détecté
        if (!duplicateDetected && StringUtils.isNotBlank(firstName) && StringUtils.isNotBlank(lastName)) {
            List<Exhibitor> nameMatches = Optional.ofNullable(
                    exhibitorRepository.findAllByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase(firstName,
                            lastName)).orElseGet(ArrayList::new);

            if (!nameMatches.isEmpty()) {
                duplicateDetected = true;
                nameMatches.forEach(e -> e.setDuplicateDetected(true));
                exhibitorRepository.saveAll(nameMatches);
            }
        }

        return duplicateDetected;
    }

    // -------------------- DIMENSIONS --------------------

    private PriceStandSalon resolveDimension(Map<String, PriceStandSalon> cache, String raw) {
        String key = StringUtils.defaultString(raw).toLowerCase(Locale.ROOT).trim();
        if (StringUtils.isBlank(key)) {
            return null;
        }
        // trouve une dimension existante si le texte la "contient"
        for (Map.Entry<String, PriceStandSalon> e : cache.entrySet()) {
            if (key.contains(e.getKey())) {
                return e.getValue();
            }
        }
        return null;
    }

    // -------------------- PARSERS & SANITIZERS --------------------

    private static String safeGet(CSVRecord r, int idx) {
        try {
            return r.get(idx);
        } catch (Exception e) {
            return null;
        }
    }

    private String sanitize(CSVRecord csvRecord, int position, boolean lowercase, boolean capitalFirstLetter,
            boolean capitalEachFirstLetter) {
        String valueFound = safeGet(csvRecord, position);
        if (StringUtils.isBlank(valueFound)) {
            return null;
        }

        String v = valueFound.replace("\"", "").trim();

        if (lowercase) {
            v = v.toLowerCase(Locale.ROOT);
        }

        if (capitalFirstLetter && !v.isEmpty()) {
            v = v.substring(0, 1).toUpperCase(Locale.ROOT) + v.substring(1);
        }

        if (capitalEachFirstLetter) {
            v = Arrays.stream(v.split("\\s+")).filter(s -> !s.isEmpty())
                      .map(word -> word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1))
                      .collect(Collectors.joining(" "));
        }

        return v;
    }

    private String sanitizePhoneNumber(String phone) {
        if (StringUtils.isBlank(phone)) {
            return null;
        }
        // supprime espaces, points, tirets, parenthèses
        return phone.replaceAll("[\\s.()\\-]", "");
    }

    private String sanitizeUrl(String url) {
        if (StringUtils.isBlank(url)) {
            return null;
        }

        String cleaned = url.trim().replaceAll("\\s+", "");

        cleaned = cleaned.replaceFirst("^https?://", "");

        if (cleaned.endsWith("/")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }

        return cleaned;
    }

    private String sub100(String s) {
        return s != null ? s.substring(0, Math.min(100, s.length())) : null;
    }

    private String sub500(String s) {
        return s != null ? s.substring(0, Math.min(500, s.length())) : null;
    }

    private boolean parseYes(String s) {
        return StringUtils.containsIgnoreCase(s, YES_FR) || StringUtils.equalsAnyIgnoreCase(s, "yes", "true", "y");
    }

    private long parseLongOrZero(String s) {
        if (NumberUtils.isCreatable(StringUtils.trimToEmpty(s))) {
            return NumberUtils.createLong(s.trim());
        }
        return 0L;
    }

    private long parseFirstDigitOrZero(String s, String noneKeyword) {
        if (StringUtils.isBlank(s)) {
            return 0L;
        }
        if (StringUtils.containsIgnoreCase(s, noneKeyword)) {
            return 0L;
        }
        // garde le premier chiffre si présent (ex: `2 tables`, `"3"`, etc.)
        for (char c : s.replace("\"", "").toCharArray()) {
            if (Character.isDigit(c)) {
                return Character.getNumericValue(c);
            }
        }
        return 0L;
    }

    private ModePaymentMeals parseModePaymentMeals(String pref) {
        if (StringUtils.containsIgnoreCase(pref, "facture principale")) {
            return ModePaymentMeals.MIXED;
        }
        return ModePaymentMeals.SEPARATE;
    }

    private InvoiceSendingMethod parseInvoiceSendingMethod(String pref) {
        if (StringUtils.containsIgnoreCase(pref, "postal")) {
            return InvoiceSendingMethod.POSTAL;
        }
        return InvoiceSendingMethod.EMAIL;
    }

    private Instant parseRegistrationInstant(String raw) {
        if (StringUtils.isBlank(raw)) {
            return Instant.now();
        }
        String trimmed = raw.trim();

        for (DateTimeFormatter fmt : REG_DATE_FMTS) {
            try {
                LocalDateTime ldt = LocalDateTime.parse(trimmed, fmt);
                // Si les timestamps du Google Form sont en heure locale suisse :
                return ldt.atZone(ZoneId.of("Europe/Zurich")).toInstant();
            } catch (Exception ignored) { /* essayer le format suivant */ }
        }

        log.warn("Format de date invalide '{}', utilisation de now()", raw);
        return Instant.now();
    }
}
