package ch.salon.billing.support;

import ch.salon.billing.domain.SourceRef;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Participation simplifiée (côté métier salon) : ce que l'exposant a réservé. Volontairement
 * mutable pour simuler les changements dans le temps.
 */
public class FakeParticipation {

    /** Miroir des statuts de l'application (participation ET sous-objets). */
    public enum Status { IN_VERIFICATION, ACCEPTED, VALIDATED, REFUSED, CANCELED, CLOSED }

    /** Choisi par participation : avec acompte, ou facturation normale. */
    public enum BillingProcess { STANDARD, DEPOSIT }

    public static final class FakeStand {
        final String id;
        String dimension;
        boolean electricity;
        int tables;
        Status status;

        FakeStand(String id, String dimension, Status status) {
            this.id = id;
            this.dimension = dimension;
            this.status = status;
        }

        public Status status() {
            return status;
        }

        boolean isBillable() {
            return status == Status.ACCEPTED || status == Status.VALIDATED;
        }
    }

    final String id;
    final List<FakeStand> stands = new ArrayList<>();
    int mealsSaturday;
    int mealsSunday;
    boolean mealsSeparate = true;
    boolean postal;
    boolean arrangement;
    boolean guestOfHonor;
    boolean cancelled;
    String cancellationFee;
    LocalDate salonDate = LocalDate.of(2027, 5, 15);
    Status status = Status.ACCEPTED;
    BillingProcess process = BillingProcess.STANDARD;
    boolean depositOverdue;
    boolean billingSettled;
    final java.util.List<String> log = new ArrayList<>();

    /** Participation déjà acceptée (raccourci pour les tests de facturation pure). */
    public FakeParticipation(String id) {
        this.id = id;
    }

    /** Nouvelle inscription : tout est « en vérification », rien n'est facturable. */
    public static FakeParticipation registration(String id) {
        FakeParticipation p = new FakeParticipation(id);
        p.status = Status.IN_VERIFICATION;
        return p;
    }

    public FakeParticipation process(BillingProcess process) {
        this.process = process;
        return this;
    }

    public Status status() { return status; }
    public BillingProcess process() { return process; }
    public boolean depositOverdue() { return depositOverdue; }
    public boolean billingSettled() { return billingSettled; }
    public java.util.List<String> log() { return log; }
    public LocalDate salonDate() { return salonDate; }

    public Status standStatus(String standId) {
        return find(standId).status;
    }

    boolean isBillable() {
        return status == Status.ACCEPTED || status == Status.VALIDATED;
    }

    public int standCount() {
        return stands.size();
    }

    /** Référence générique côté facturation : la facturation ne connaît que ("PARTICIPATION", id). */
    public SourceRef caseRef() {
        return SourceRef.of("PARTICIPATION", id);
    }

    /** Ajoute un stand ; il hérite du statut de la participation (en vérification pour une inscription). */
    public FakeParticipation stand(String standId, String dimension) {
        stands.add(new FakeStand(standId, dimension, status == Status.IN_VERIFICATION ? Status.IN_VERIFICATION : Status.ACCEPTED));
        return this;
    }

    /** Stand demandé après coup : toujours « en vérification ». */
    public FakeParticipation requestStand(String standId, String dimension) {
        stands.add(new FakeStand(standId, dimension, Status.IN_VERIFICATION));
        return this;
    }

    public FakeParticipation removeStand(String standId) {
        stands.removeIf(s -> s.id.equals(standId));
        return this;
    }

    public FakeParticipation resizeStand(String standId, String dimension) {
        find(standId).dimension = dimension;
        return this;
    }

    public FakeParticipation electricity(String standId, boolean value) {
        find(standId).electricity = value;
        return this;
    }

    public FakeParticipation tables(String standId, int count) {
        find(standId).tables = count;
        return this;
    }

    public FakeParticipation mealsSaturday(int count) {
        this.mealsSaturday = count;
        return this;
    }

    public FakeParticipation mealsSunday(int count) {
        this.mealsSunday = count;
        return this;
    }

    public FakeParticipation mealsSeparate(boolean value) {
        this.mealsSeparate = value;
        return this;
    }

    public FakeParticipation postal(boolean value) {
        this.postal = value;
        return this;
    }

    public FakeParticipation arrangement(boolean value) {
        this.arrangement = value;
        return this;
    }

    public FakeParticipation guestOfHonor(boolean value) {
        this.guestOfHonor = value;
        return this;
    }

    public FakeParticipation cancel() {
        this.cancelled = true;
        return this;
    }

    /** Annulation avec frais retenus (règle du règlement exposants). */
    public FakeParticipation cancelWithFee(String fee) {
        this.cancelled = true;
        this.cancellationFee = fee;
        return this;
    }

    public FakeParticipation reinstate() {
        this.cancelled = false;
        this.cancellationFee = null;
        return this;
    }

    FakeStand find(String standId) {
        return stands.stream().filter(s -> s.id.equals(standId)).findFirst()
                     .orElseThrow(() -> new IllegalArgumentException("Stand inconnu " + standId));
    }
}
