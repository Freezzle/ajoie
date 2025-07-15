package ch.salon.service;

import java.util.List;

public class InvoiceCoverage {
    private final boolean allElementsPresent;
    private final List<InvoiceDiff> differences;

    public InvoiceCoverage(boolean allElementsPresent, List<InvoiceDiff> differences) {
        this.allElementsPresent = allElementsPresent;
        this.differences = differences;
    }

    public boolean isAllElementsPresent() {
        return allElementsPresent;
    }

    public List<InvoiceDiff> getDifferences() {
        return differences;
    }
}
