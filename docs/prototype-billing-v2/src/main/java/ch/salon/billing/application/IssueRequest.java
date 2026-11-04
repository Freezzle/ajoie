package ch.salon.billing.application;

import java.time.LocalDate;

/**
 * Demande d'émission, construite par l'appelant selon SES règles (ex. arrangement → échéance à la
 * date du salon).
 *
 * @param group   groupe à émettre (ex. "main", "meals")
 * @param dueDate échéance ; null → délai par défaut du service
 */
public record IssueRequest(String group, LocalDate dueDate) {
    public static IssueRequest of(String group) {
        return new IssueRequest(group, null);
    }
}
