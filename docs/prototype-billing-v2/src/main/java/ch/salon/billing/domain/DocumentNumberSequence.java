package ch.salon.billing.domain;

/**
 * Numérotation continue, sans trou, par type de document et par année : F-2027-0001, NC-2027-0001.
 * En production : compteur en base verrouillé (SELECT … FOR UPDATE) dans la transaction d'émission.
 */
public interface DocumentNumberSequence {
    String next(DocumentKind kind, int year);
}
