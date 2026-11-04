package ch.salon.billing.domain;

import java.util.HashSet;
import java.util.List;

/** Résultat d'une synchronisation : les lignes « à facturer » avant et après. */
public record SyncResult(List<PendingLine> before, List<PendingLine> after) {
    public boolean changed() {
        // L'ordre des postes envoyés n'a pas d'importance.
        return !new HashSet<>(before).equals(new HashSet<>(after));
    }
}
