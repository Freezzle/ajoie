package ch.salon.service.mail;

import ch.salon.domain.DateUtils;
import ch.salon.domain.InvoicingPlan;
import java.util.Locale;
import org.thymeleaf.context.Context;

public class InvoiceEmailDataProvider implements EmailDataProvider {

    private final InvoicingPlan invoicingPlan;

    public InvoiceEmailDataProvider(InvoicingPlan invoicingPlan) {
        this.invoicingPlan = invoicingPlan;
    }

    @Override
    public Context getContext() {
        Context context = new Context(Locale.FRENCH);
        context.setVariable("salon", invoicingPlan.getParticipation().getSalon().getPlace());
        context.setVariable("billingNumber", invoicingPlan.getBillingNumber());
        context.setVariable("fullName", invoicingPlan.getParticipation().getExhibitor().getFullName());
        context.setVariable("startDate", DateUtils.instantToIso(invoicingPlan.getParticipation().getSalon().getStartingDate()));
        context.setVariable("endDate", DateUtils.instantToIso(invoicingPlan.getParticipation().getSalon().getEndingDate()));
        return context;
    }
}
