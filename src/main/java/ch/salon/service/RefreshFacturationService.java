package ch.salon.service;

import ch.salon.domain.Conference;
import ch.salon.domain.Invoice;
import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Type;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.InvoiceRepository;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
public class RefreshFacturationService {

    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;
    private final InvoicingPlanRepository invoicingPlanRepository;

    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;

    private final InvoiceRepository invoiceRepository;

    private final MessageSource messageSource;

    public RefreshFacturationService(SalonRepository salonRepository, ParticipationRepository participationRepository,
                                     InvoicingPlanRepository invoicingPlanRepository, StandRepository standRepository,
                                     ConferenceRepository conferenceRepository, MessageSource messageSource,
                                     InvoiceRepository invoiceRepository) {
        this.participationRepository = participationRepository;
        this.salonRepository = salonRepository;
        this.invoicingPlanRepository = invoicingPlanRepository;
        this.standRepository = standRepository;
        this.conferenceRepository = conferenceRepository;
        this.messageSource = messageSource;
        this.invoiceRepository = invoiceRepository;
    }

    public void refresh(UUID idParticipation) {
        if (idParticipation == null) {
            throw new IllegalStateException("No idParticipation given");
        }

        Participation participation = participationRepository.findById(idParticipation).orElseThrow();
        Salon salon = salonRepository.findById(participation.getSalon().getId()).orElseThrow();
        List<Stand> stands = standRepository.findByParticipationIdOrderByRegistrationDateDesc(idParticipation);
        List<Conference> conferences =
            conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(idParticipation);

        List<InvoicingPlan> invoicings =
            invoicingPlanRepository.findByParticipationIdOrderByBillingNumberDesc(idParticipation)
                                   .stream()
                                   .filter(invoicingPlan -> invoicingPlan.getState() != State.CANCELLED &&
                                                            invoicingPlan.getState().isNotDraft())
                                   .toList();

        List<Invoice> invoices =
            invoicings.stream().map(InvoicingPlan::getInvoices).flatMap(Collection::stream).toList();

        List<Invoice> newInvoices = getInvoicesGroupedByType(invoices, stands, conferences, participation);

        for (Stand currentStand : stands) {
            Invoice found = newInvoices.stream()
                                       .filter(invoice -> invoice.getReferenceId().equals(currentStand.getId()) &&
                                                          invoice.getType() == Type.STAND)
                                       .findFirst()
                                       .orElse(null);

            if (found != null) {
                Double priceStandSalon = salon.getPriceStand(currentStand.getDimension());
                if (priceStandSalon == null) {
                    throw new IllegalStateException("No dimension found during refreshing facturation");
                }

                double result = found.getTotalAmount() - priceStandSalon;

                Invoice invoice = new Invoice();
                if (result < 0.00) {
                    found.setDefaultAmount(result);
                    found.setCustomAmount(result);
                    found.setQuantity(1L + invoice.getQuantity());
                } else if (result > 0.00) {
                    found.setDefaultAmount(result);
                    found.setCustomAmount(result);
                    found.setQuantity(1L + invoice.getQuantity());
                } else {
                    // Nothing to do
                }
            } else {
                // Add new invoice
            }
        }
    }

    private List<Invoice> getInvoicesGroupedByType(List<Invoice> invoices, List<Stand> stands,
                                                   List<Conference> conferences, Participation participation) {
        List<Invoice> newInvoices = new ArrayList<>();
        for (Stand currentStand : stands) {
            Invoice invoiceStand = sumInvoices(invoices, Type.STAND, currentStand.getId());
            if (invoiceStand != null) {
                newInvoices.add(invoiceStand);
            }
            Invoice invoiceShared = sumInvoices(invoices, Type.SHARED, currentStand.getId());
            if (invoiceShared != null) {
                newInvoices.add(invoiceShared);
            }
        }

        for (Conference currentConference : conferences) {
            Invoice invoiceConference = sumInvoices(invoices, Type.CONFERENCE, currentConference.getId());
            if (invoiceConference != null) {
                newInvoices.add(invoiceConference);
            }
        }

        Invoice invoiceMeal1 = sumInvoices(invoices, Type.MEAL1, participation.getId());
        if (invoiceMeal1 != null) {
            newInvoices.add(invoiceMeal1);
        }

        Invoice invoiceMeal2 = sumInvoices(invoices, Type.MEAL2, participation.getId());
        if (invoiceMeal2 != null) {
            newInvoices.add(invoiceMeal2);
        }

        Invoice invoiceMeal3 = sumInvoices(invoices, Type.MEAL3, participation.getId());
        if (invoiceMeal3 != null) {
            newInvoices.add(invoiceMeal3);
        }

        return newInvoices;
    }

    private Invoice sumInvoices(List<Invoice> invoices, Type type, UUID referenceId) {

        List<Invoice> filteredInvoices = invoices.stream()
                                                 .filter(invoice -> invoice.getType() == type &&
                                                                    invoice.getReferenceId().equals(referenceId))
                                                 .toList();

        Double sumDefault = filteredInvoices.stream().map(Invoice::getDefaultAmount).reduce(0.00, Double::sum);
        Double sumCustom = filteredInvoices.stream().map(Invoice::getCustomAmount).reduce(0.00, Double::sum);
        Long sumQty = filteredInvoices.stream().map(Invoice::getQuantity).reduce(0L, Long::sum);

        if (filteredInvoices.isEmpty()) {
            return null;
        }

        Invoice newInvoice = new Invoice();
        newInvoice.setLabel(filteredInvoices.get(0).getLabel());
        newInvoice.setGenerationDate(Instant.now());
        newInvoice.setType(type);
        newInvoice.setReferenceId(referenceId);
        newInvoice.setDefaultAmount(sumDefault);
        newInvoice.setCustomAmount(sumCustom);
        newInvoice.setQuantity(sumQty);

        return newInvoice;
    }
}
