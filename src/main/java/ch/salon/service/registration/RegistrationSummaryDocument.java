package ch.salon.service.registration;

import ch.salon.domain.Address;
import ch.salon.domain.Conference;
import ch.salon.domain.Exhibitor;
import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.ModePaymentMeals;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.StandRepository;
import ch.salon.repository.WorkshopRepository;
import ch.salon.service.InvoiceEstimate;
import ch.salon.service.RefreshInvoicingPlansService;
import ch.salon.service.document.DocumentCreator;
import ch.salon.service.document.HtmlSanitizer;
import ch.salon.service.document.Recipient;
import ch.salon.service.document.Sender;
import ch.salon.utils.DateUtils;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.MessageSource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Récapitulatif PDF d'une inscription, joint aux emails envoyés à l'exposant.
 * <p>
 * Il fige ce que l'exposant a saisi et accepté au moment de l'envoi : si le salon modifie ensuite ses
 * prix, ses dimensions ou le texte de ses chartes, l'exposant conserve une trace de son engagement.
 */
@Service
@RequiredArgsConstructor
public class RegistrationSummaryDocument {

    private static final String TEMPLATE = "registration-summary";

    private final DocumentCreator documentCreator;
    private final MessageSource messageSource;
    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final RefreshInvoicingPlansService refreshInvoicingPlansService;

    public InputStreamSource build(Participation participation, Locale locale) throws IOException {
        Exhibitor exhibitor = participation.getExhibitor();
        Salon salon = participation.getSalon();

        Context ctx = new Context(locale);
        ctx.setVariable("headerTitle", message("document.registration-summary.header", locale));
        ctx.setVariable("recipient", new Recipient(exhibitor));
        ctx.setVariable("sender", new Sender(salon));

        ctx.setVariable("salonPlace", salon.getPlace());
        ctx.setVariable("startDate", DateUtils.instantToIso(salon.getStartingDate()));
        ctx.setVariable("endDate", DateUtils.instantToIso(salon.getEndingDate()));
        ctx.setVariable("registrationDate", DateUtils.instantToIso(participation.getRegistrationDate()));
        ctx.setVariable("reference", participation.getClientNumber());

        setExhibitorVariables(ctx, exhibitor, participation);
        setServicesVariables(ctx, participation, locale);
        setParticipationVariables(ctx, participation, locale);

        InvoiceEstimate estimate = refreshInvoicingPlansService.estimateCost(participation);
        ctx.setVariable("costLines", estimate.lines());
        ctx.setVariable("costTotal", estimate.total());
        ctx.setVariable("hasCost", !estimate.isEmpty());

        ctx.setVariable("chartText", HtmlSanitizer.sanitize(salon.getRegistrationChartText()));
        ctx.setVariable("salonChartText", HtmlSanitizer.sanitize(salon.getRegistrationSalonChartText()));

        return documentCreator.build(TEMPLATE, ctx);
    }

    /**
     * Nom de fichier sans accent ni espace, pour rester lisible dans tous les clients de messagerie.
     */
    public String getFilename(Participation participation) {
        String reference = StringUtils.defaultIfBlank(participation.getClientNumber(), "");
        String name = participation.getExhibitor() != null ? participation.getExhibitor().getLastName() : null;

        String suffix = java.util.stream.Stream.of(reference, name).map(RegistrationSummaryDocument::toAscii)
                .filter(StringUtils::isNotBlank).reduce((a, b) -> a + "_" + b).orElse("");

        return StringUtils.isBlank(suffix) ? "Inscription.pdf" : "Inscription_" + suffix + ".pdf";
    }

    private void setExhibitorVariables(Context ctx, Exhibitor exhibitor, Participation participation) {
        ctx.setVariable("firstName", exhibitor.getFirstName());
        ctx.setVariable("lastName", exhibitor.getLastName());
        ctx.setVariable("therapistName", participation.getTherapistName());
        ctx.setVariable("email", exhibitor.getEmail());
        ctx.setVariable("phoneNumber", exhibitor.getPhoneNumber());
        ctx.setVariable("newsletter", exhibitor.isNewsletter());

        ctx.setVariable("homeAddress", formatAddress(exhibitor.getHomeAddress()));
        boolean differentBilling = Boolean.TRUE.equals(exhibitor.getDifferentBillingAddress());
        ctx.setVariable("differentBillingAddress", differentBilling);
        ctx.setVariable("billingAddress", differentBilling ? formatAddress(exhibitor.getBillingAddress()) : null);
        ctx.setVariable("billingFullName",
                differentBilling && exhibitor.getBillingAddress() != null ? exhibitor.getBillingAddress().getFullName()
                        : null);
    }

    private void setServicesVariables(Context ctx, Participation participation, Locale locale) {
        List<StandView> stands =
                standRepository.findByParticipationIdOrderByRegistrationDateDesc(participation.getId()).stream()
                               .map(stand -> toStandView(stand, locale)).toList();
        List<Conference> conferences =
                conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(participation.getId());
        List<Workshop> workshops =
                workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(participation.getId());

        ctx.setVariable("stands", stands);
        ctx.setVariable("conferences", conferences);
        ctx.setVariable("workshops", workshops);
        ctx.setVariable("hasServices", !stands.isEmpty() || !conferences.isEmpty() || !workshops.isEmpty());
    }

    private void setParticipationVariables(Context ctx, Participation participation, Locale locale) {
        long nbMeal1 = nullSafe(participation.getNbMeal1());
        long nbMeal2 = nullSafe(participation.getNbMeal2());
        long nbMeal3 = nullSafe(participation.getNbMeal3());

        ctx.setVariable("nbMeal1", nbMeal1);
        ctx.setVariable("nbMeal2", nbMeal2);
        ctx.setVariable("nbMeal3", nbMeal3);
        ctx.setVariable("hasMeals", nbMeal1 + nbMeal2 + nbMeal3 > 0);
        ctx.setVariable("modePaymentMeals", modePaymentMealsLabel(participation.getModePaymentMeals(), locale));
        ctx.setVariable("invoiceSendingMethod",
                invoiceSendingMethodLabel(participation.getInvoiceSendingMethod(), locale));

        ctx.setVariable("hasOffer", Boolean.TRUE.equals(participation.getHasOffer()));
        ctx.setVariable("offer", participation.getOffer());
        ctx.setVariable("additionnalInformation", participation.getAdditionnalInformation());

        ctx.setVariable("acceptedChart", Boolean.TRUE.equals(participation.getAcceptedChart()));
        ctx.setVariable("acceptedContract", Boolean.TRUE.equals(participation.getAcceptedContract()));
    }

    private StandView toStandView(Stand stand, Locale locale) {
        return new StandView(
                stand.getDimension() != null ? stand.getDimension().getDimension() : null,
                stand.getDescription(),
                categoryLabel(stand.getCategory(), locale),
                joinSubCategories(stand.getSubCategories()),
                nullSafe(stand.getNbTable()),
                nullSafe(stand.getNbChair()),
                Boolean.TRUE.equals(stand.getNeedElectricity()),
                stand.getWebsite(), stand.getInstagram(), stand.getFacebook(),
                Boolean.TRUE.equals(stand.getShared()),
                StringUtils.trimToNull(StringUtils.trim(
                        StringUtils.defaultString(stand.getSharedFirstName()) + " " +
                                StringUtils.defaultString(stand.getSharedLastName()))),
                stand.getSharedTherapistName(),
                stand.getSharedEmail(),
                stand.getSharedDescription(),
                categoryLabel(stand.getSharedCategory(), locale),
                joinSubCategories(stand.getSharedSubCategories()),
                stand.getSharedWebsite(), stand.getSharedInstagram(), stand.getSharedFacebook());
    }

    private String formatAddress(Address address) {
        if (address == null) {
            return null;
        }
        String country = StringUtils.defaultIfBlank(address.getIsoCountry(), "CH");
        return address.streetLine() + ", " + address.cityLine() + " (" + country + ")";
    }

    private String joinSubCategories(Set<String> subCategories) {
        return subCategories == null || subCategories.isEmpty() ? null : String.join(", ", subCategories);
    }

    private String categoryLabel(Enum<?> category, Locale locale) {
        return category == null ? null
                : messageSource.getMessage("document.registration-summary.category." + category.name(), null,
                        category.name(), locale);
    }

    private String modePaymentMealsLabel(ModePaymentMeals mode, Locale locale) {
        return mode == null ? null
                : message("document.registration-summary.meals.payment." + mode.name(), locale);
    }

    private String invoiceSendingMethodLabel(InvoiceSendingMethod method, Locale locale) {
        InvoiceSendingMethod effective = method != null ? method : InvoiceSendingMethod.EMAIL;
        return message("document.registration-summary.invoice-sending." + effective.name(), locale);
    }

    private String message(String key, Locale locale) {
        return messageSource.getMessage(key, null, key, locale);
    }

    private static long nullSafe(Long value) {
        return value != null ? value : 0L;
    }

    private static String toAscii(String value) {
        if (StringUtils.isBlank(value)) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                         .replaceAll("[^A-Za-z0-9._-]", "_").replaceAll("_+", "_");
    }

    /** Vue aplatie d'un stand, pour garder le template Thymeleaf lisible. */
    public record StandView(String dimension, String description, String category, String subCategories,
                            long nbTable, long nbChair, boolean needElectricity,
                            String website, String instagram, String facebook,
                            boolean shared, String sharedName, String sharedTherapistName, String sharedEmail,
                            String sharedDescription, String sharedCategory, String sharedSubCategories,
                            String sharedWebsite, String sharedInstagram, String sharedFacebook) {
    }
}
