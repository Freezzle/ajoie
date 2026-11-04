package ch.salon.billing;

import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.BillingEvent;
import ch.salon.billing.domain.ChargeSpec;
import ch.salon.billing.domain.Debtor;
import ch.salon.billing.domain.DocumentKind;
import ch.salon.billing.domain.SourceRef;
import ch.salon.billing.application.IssueRequest;
import ch.salon.billing.support.BillingTestBase;
import ch.salon.billing.support.FakeParticipation;
import ch.salon.billing.support.FakeParticipation.BillingProcess;
import ch.salon.billing.support.FakeParticipation.Status;
import ch.salon.billing.support.FakeParticipationWorkflow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Cycle de vie d'une participation piloté par les événements de la facturation : la facturation ne
 * connaît pas les participations, ce sont les participations qui écoutent et décident.
 */
@DisplayName("Participation ↔ facturation : processus, statuts et événements")
class ParticipationWorkflowTest extends BillingTestBase {

    FakeParticipationWorkflow workflow;

    @BeforeEach
    void wireWorkflow() {
        workflow = new FakeParticipationWorkflow(billing, policy, () -> today);
        listeners.add(workflow::onBillingEvent);
    }

    private FakeParticipation newRegistration(BillingProcess process) {
        FakeParticipation p = FakeParticipation.registration("P-" + process).process(process)
                .stand("S1", "3x3").electricity("S1", true).mealsSaturday(2);
        return workflow.register(p);
    }

    @Nested
    @DisplayName("Processus avec acompte")
    class DepositProcess {

        FakeParticipation p;

        @BeforeEach
        void registration() {
            p = newRegistration(BillingProcess.DEPOSIT);
        }

        @Test
        @DisplayName("en vérification : rien n'est envoyé à la facturation")
        void nothingBeforeAcceptance() {
            assertThrows(IllegalArgumentException.class, () -> billing.caseOf(p.caseRef()));
            assertEquals(Status.IN_VERIFICATION, p.standStatus("S1"));
        }

        @Test
        @DisplayName("acceptation : sous-objets acceptés, prestations « à facturer », facture d'acompte émise")
        void acceptance() {
            workflow.accept(p);
            assertEquals(Status.ACCEPTED, p.status());
            assertEquals(Status.ACCEPTED, p.standStatus("S1"));
            List<BillingDocument> docs = caseOf(p).documents();
            assertEquals(1, docs.size());
            assertEquals("A-2027-0001", docs.get(0).number());
            assertEquals(DocumentKind.DEPOSIT, docs.get(0).kind());
            assertMoney("100.00", docs.get(0).total());
            assertEquals(java.time.LocalDate.of(2027, 1, 30), docs.get(0).dueDate());
            assertEquals(3, billing.preview(p.caseRef()).size(), "stand, électricité, repas restent en brouillon");
        }

        @Test
        @DisplayName("acompte payé → participation ET sous-objets validés")
        void depositPaidValidates() {
            workflow.accept(p);
            on(1, 15);
            bankTransfer(caseOf(p).documents().get(0), "100.00");
            assertEquals(Status.VALIDATED, p.status());
            assertEquals(Status.VALIDATED, p.standStatus("S1"));
            assertTrue(p.log().contains("Validée : acompte A-2027-0001 reçu"));
        }

        @Test
        @DisplayName("acompte payé en partie → reste « acceptée »")
        void partialDepositDoesNotValidate() {
            workflow.accept(p);
            bankTransfer(caseOf(p).documents().get(0), "60.00");
            assertEquals(Status.ACCEPTED, p.status());
        }

        @Test
        @DisplayName("acompte en retard → signalé à la participation, puis validée au paiement tardif")
        void depositOverdue() {
            workflow.accept(p);
            on(2, 1);
            billing.scanOverdue();
            billing.scanOverdue(); // le signal n'est publié qu'une fois
            assertTrue(p.depositOverdue());
            assertEquals(1, count(BillingEvent.DocumentOverdue.class));
            bankTransfer(caseOf(p).documents().get(0), "100.00");
            assertEquals(Status.VALIDATED, p.status());
            assertFalse(p.depositOverdue());
        }

        @Test
        @DisplayName("parcours complet : acompte, changements, facture finale avec déduction, soldé, clôturé")
        void fullDepositLifecycle() {
            workflow.accept(p);
            BillingDocument deposit = caseOf(p).documents().get(0);
            on(1, 20);
            bankTransfer(deposit, "100.00");

            on(3, 1);
            p.tables("S1", 2);
            workflow.changed(p);
            List<BillingDocument> invoices = workflow.issueInvoices(p);
            BillingDocument main = invoices.get(0);
            assertLines(main,
                    "Stand 3x3 m | 1 | 450.00",
                    "Électricité 230 V | 1 | 35.00",
                    "Table supplémentaire | 2 | 30.00",
                    "Déduction acompte A-2027-0001 | 1 | -100.00");
            assertMoney("415.00", main.total());
            assertEquals(List.of("A-2027-0001"), main.corrects());
            assertMoney("45.00", invoices.get(1).total()); // repas, groupe séparé : pas de déduction

            on(3, 20);
            bankTransfer(main, "415.00");
            bankTransfer(invoices.get(1), "45.00");
            assertTrue(p.billingSettled());
            assertFalse(workflow.canClose(p), "le salon n'a pas encore eu lieu");
            on(5, 20);
            workflow.close(p);
            assertEquals(Status.CLOSED, p.status());
            assertEquals(Status.CLOSED, p.standStatus("S1"));
        }

        @Test
        @DisplayName("acompte partiellement payé puis facture finale → solde d'acompte annulé, seul le versé est déduit")
        void partialDepositThenFinalInvoice() {
            workflow.accept(p);
            BillingDocument deposit = caseOf(p).documents().get(0);
            bankTransfer(deposit, "60.00");
            List<BillingDocument> invoices = workflow.issueInvoices(p);
            BillingDocument nc = caseOf(p).documents().get(1);
            assertEquals(DocumentKind.CREDIT_NOTE, nc.kind());
            assertLines(nc, "Annulation du solde d'acompte non réglé (A-2027-0001) | 1 | -40.00");
            assertMoney("0.00", caseOf(p).openAmount(deposit.number()));
            assertMoney("425.00", invoices.get(0).total()); // 485 − 60 versés
            assertEquals(Status.ACCEPTED, p.status(), "acompte soldé par note de crédit ≠ acompte payé");
            bankTransfer(invoices.get(0), "425.00");
            assertEquals(Status.VALIDATED, p.status(), "facture finale payée → validée");
        }

        @Test
        @DisplayName("acompte supérieur à la facture → déduction plafonnée, le reste est déduit plus tard")
        void depositLargerThanInvoice() {
            p.resizeStand("S1", "2x2").electricity("S1", false).mealsSaturday(0);
            workflow.accept(p);
            p.guestOfHonor(true); // 300 − 100 de réduction = 200
            workflow.changed(p);
            BillingDocument deposit = caseOf(p).documents().get(0);
            bankTransfer(deposit, "100.00");
            // Admin : acompte exceptionnel de 250.– au lieu de 100.–
            BillingDocument extra = billing.requestDeposit(p.caseRef(), "Acompte complémentaire", chf("250.00"), "main", null);
            bankTransfer(extra, "250.00");
            BillingDocument f = workflow.issueInvoices(p).get(0);
            assertMoney("0.00", f.total());
            assertMoney("150.00", caseOf(p).undeductedDeposits());
            p.tables("S1", 4); // +60
            workflow.changed(p);
            BillingDocument f2 = workflow.issueInvoices(p).get(0);
            assertMoney("0.00", f2.total()); // 60 − 60 déduits
            assertMoney("90.00", caseOf(p).undeductedDeposits());
        }

        @Test
        @DisplayName("montant d'acompte selon la règle salon : 100.– par stand accepté")
        void depositAmountRule() {
            FakeParticipation two = workflow.register(FakeParticipation.registration("P-2").process(BillingProcess.DEPOSIT)
                    .stand("S1", "3x3").stand("S2", "2x2"));
            workflow.accept(two);
            assertMoney("200.00", caseOf(two).documents().get(0).total());
        }
    }

    @Nested
    @DisplayName("Processus normal (sans acompte)")
    class StandardProcess {

        FakeParticipation p;

        @BeforeEach
        void registration() {
            p = newRegistration(BillingProcess.STANDARD);
        }

        @Test
        @DisplayName("acceptation : brouillon de facturation seulement, aucun document")
        void acceptance() {
            workflow.accept(p);
            assertEquals(Status.ACCEPTED, p.status());
            assertTrue(caseOf(p).documents().isEmpty());
            assertEquals(3, billing.preview(p.caseRef()).size());
        }

        @Test
        @DisplayName("facture principale payée → validée")
        void paidInvoiceValidates() {
            workflow.accept(p);
            List<BillingDocument> invoices = workflow.issueInvoices(p);
            assertEquals(Status.ACCEPTED, p.status());
            bankTransfer(invoices.get(0), "485.00");
            assertEquals(Status.VALIDATED, p.status());
        }

        @Test
        @DisplayName("avec arrangement → validée dès l'émission de la facture")
        void arrangementValidatesOnIssue() {
            p.arrangement(true);
            workflow.accept(p);
            workflow.issueInvoices(p);
            assertEquals(Status.VALIDATED, p.status());
            assertTrue(p.log().stream().anyMatch(l -> l.startsWith("Validée : arrangement")));
        }

        @Test
        @DisplayName("l'admin peut forcer la validation avant paiement")
        void manualValidation() {
            workflow.accept(p);
            workflow.validate(p, "décision du comité");
            assertEquals(Status.VALIDATED, p.status());
            assertEquals(Status.VALIDATED, p.standStatus("S1"));
        }
    }

    @Nested
    @DisplayName("Choix du processus")
    class ProcessChoice {

        @Test
        @DisplayName("avant acceptation : librement modifiable")
        void beforeAcceptance() {
            FakeParticipation p = newRegistration(BillingProcess.STANDARD);
            workflow.switchProcess(p, BillingProcess.DEPOSIT);
            workflow.accept(p);
            assertEquals(DocumentKind.DEPOSIT, caseOf(p).documents().get(0).kind());
        }

        @Test
        @DisplayName("normal → acompte après acceptation : l'acompte est émis tout de suite")
        void standardToDeposit() {
            FakeParticipation p = newRegistration(BillingProcess.STANDARD);
            workflow.accept(p);
            workflow.switchProcess(p, BillingProcess.DEPOSIT);
            assertEquals(1, caseOf(p).documents().size());
        }

        @Test
        @DisplayName("acompte → normal, acompte impayé : il est annulé par note de crédit, rien n'est dû")
        void depositToStandardUnpaid() {
            FakeParticipation p = newRegistration(BillingProcess.DEPOSIT);
            workflow.accept(p);
            workflow.switchProcess(p, BillingProcess.STANDARD);
            assertEquals(List.of(DocumentKind.DEPOSIT, DocumentKind.CREDIT_NOTE),
                    caseOf(p).documents().stream().map(BillingDocument::kind).toList());
            assertMoney("0.00", caseOf(p).balance());
            assertEquals(Status.ACCEPTED, p.status());
        }

        @Test
        @DisplayName("acompte → normal, acompte déjà payé : refusé")
        void depositToStandardPaid() {
            FakeParticipation p = newRegistration(BillingProcess.DEPOSIT);
            workflow.accept(p);
            bankTransfer(caseOf(p).documents().get(0), "100.00");
            assertThrows(IllegalStateException.class, () -> workflow.switchProcess(p, BillingProcess.STANDARD));
        }
    }

    @Nested
    @DisplayName("Sous-objets ajoutés en cours de route")
    class LateItems {

        @Test
        @DisplayName("stand demandé après validation : non facturé tant qu'il est en vérification, puis validé et facturé")
        void standAfterValidation() {
            FakeParticipation p = newRegistration(BillingProcess.STANDARD);
            workflow.accept(p);
            bankTransfer(workflow.issueInvoices(p).get(0), "485.00");
            assertEquals(Status.VALIDATED, p.status());

            p.requestStand("S2", "2x2");
            workflow.changed(p);
            assertTrue(billing.preview(p.caseRef()).isEmpty(), "en vérification = pas facturable");

            workflow.acceptStand(p, "S2");
            assertEquals(Status.VALIDATED, p.standStatus("S2"));
            BillingDocument f = workflow.issueInvoices(p).get(0);
            assertLines(f, "Stand 2x2 m | 1 | 300.00");
        }

        @Test
        @DisplayName("participation refusée : aucun dossier de facturation n'est jamais créé")
        void refused() {
            FakeParticipation p = newRegistration(BillingProcess.DEPOSIT);
            workflow.refuse(p);
            assertEquals(Status.REFUSED, p.standStatus("S1"));
            assertThrows(IllegalArgumentException.class, () -> billing.caseOf(p.caseRef()));
        }
    }

    @Nested
    @DisplayName("Facturation générique (autres sources)")
    class GenericSources {

        @Test
        @DisplayName("une facture de sponsoring passe par le même moteur ; les participations ignorent ses événements")
        void sponsoring() {
            FakeParticipation p = newRegistration(BillingProcess.STANDARD);
            workflow.accept(p);
            BillingDocument fp = workflow.issueInvoices(p).get(0);

            SourceRef sponsor = SourceRef.of("SPONSORING", "SP-2027-01");
            billing.openCase(sponsor, new Debtor("Garage du Jura SA", "Route de Bâle", "5", "2800", "Delémont", "CH", "fr"));
            billing.syncCharges(sponsor, List.of(ChargeSpec.charge("pack:gold", "Pack sponsor Or").price("2000.00")
                                                          .category("sponsoring").build()));
            BillingDocument fs = billing.issue(sponsor, IssueRequest.of("main")).orElseThrow();
            assertEquals("F-2027-0003", fs.number(), "numérotation commune à toutes les sources");
            bankTransfer(fs, "2000.00");

            assertTrue(events.stream().anyMatch(e -> e.source().is("SPONSORING") && e instanceof BillingEvent.CaseSettled));
            assertEquals(Status.ACCEPTED, p.status(), "un paiement de sponsoring ne valide pas une participation");
            assertMoney("485.00", caseOf(p).openAmount(fp.number()));
        }
    }
}
