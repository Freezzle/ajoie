package ch.salon.service;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.Type;
import ch.salon.repository.InvoiceRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;

    public InvoiceService(
        InvoiceRepository invoiceRepository,
        SalonRepository salonRepository,
        ParticipationRepository participationRepository
    ) {
        this.participationRepository = participationRepository;
        this.invoiceRepository = invoiceRepository;
        this.salonRepository = salonRepository;
    }

    public void generateInvoices(UUID idParticipation) {
        Participation participation = participationRepository.findById(idParticipation).orElseThrow();

        if (participation.getIsBillingClosed()) {
            return;
        }

        List<Invoice> invoicesNoLocked = participation.getInvoices().stream().filter(invoice -> !invoice.getLock()).toList();
        List<Invoice> invoicesLocked = participation.getInvoices().stream().filter(Invoice::getLock).toList();
        invoicesLocked.forEach(invoice -> {
            invoice.setExtraInformation("(A vérifier !) " + invoice.getExtraInformation());
            invoiceRepository.save(invoice);
        });

        invoiceRepository.deleteAll(invoicesNoLocked);

        Salon salon = salonRepository.findById(participation.getSalon().getId()).orElseThrow();

        participation
            .getStands()
            .forEach(stand -> {
                if (stand.getDimension() != null) {
                    Double priceStandSalon = salon
                        .getPriceStandSalons()
                        .stream()
                        .filter(priceStand -> priceStand.getDimension().getId().equals(stand.getDimension().getId()))
                        .findFirst()
                        .map(PriceStandSalon::getPrice)
                        .orElse((double) 0);
                    createInvoice(participation, Type.STAND, stand.getDimension().getDimension(), 1L, priceStandSalon);
                }

                if (stand.getShared()) {
                    createInvoice(
                        participation,
                        Type.SHARED,
                        stand.getDimension().getDimension(),
                        1L,
                        salon.getPriceSharingStand() != null ? salon.getPriceSharingStand() : 0
                    );
                }
            });

        participation
            .getConferences()
            .forEach(conference -> {
                createInvoice(
                    participation,
                    Type.CONFERENCE,
                    conference.getTitle(),
                    1L,
                    salon.getPriceConference() != null ? salon.getPriceConference() : 0
                );
            });

        Long meal1 = participation.getNbMeal1();
        if (meal1 != null && meal1 > 0) {
            createInvoice(participation, Type.MEAL, "Samedi midi", meal1, salon.getPriceMeal1() != null ? salon.getPriceMeal1() : 0);
        }

        Long meal2 = participation.getNbMeal2();
        if (meal2 != null && meal2 > 0) {
            createInvoice(participation, Type.MEAL, "Samedi soir", meal1, salon.getPriceMeal2() != null ? salon.getPriceMeal2() : 0);
        }

        Long meal3 = participation.getNbMeal3();
        if (meal3 != null && meal3 > 0) {
            createInvoice(participation, Type.MEAL, "Dimanche midi", meal1, salon.getPriceMeal3() != null ? salon.getPriceMeal3() : 0);
        }
    }

    private void createInvoice(Participation participation, Type type, String label, Long quantity, Double defaultAmount) {
        Invoice invoice = new Invoice();
        invoice.setParticipation(participation);
        invoice.setLock(false);
        invoice.setGenerationDate(Instant.now());
        invoice.setType(type);
        invoice.setLabel(sub(label));
        invoice.setQuantity(quantity);
        invoice.setDefaultAmount(defaultAmount);
        invoice.setCustomAmount(defaultAmount);
        invoice.setTotal(defaultAmount * quantity);
        //participation.addInvoice(invoice);
        invoiceRepository.save(invoice);
    }

    private String sub(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(30, chaine.length())) : null;
    }
}
