package ch.salon.billing.domain;

import java.util.HashMap;
import java.util.Map;

public class InMemoryDocumentNumberSequence implements DocumentNumberSequence {
    private final Map<String, Integer> counters = new HashMap<>();

    @Override
    public synchronized String next(DocumentKind kind, int year) {
        int next = counters.merge(kind.prefix() + "-" + year, 1, Integer::sum);
        return String.format("%s-%d-%04d", kind.prefix(), year, next);
    }
}
