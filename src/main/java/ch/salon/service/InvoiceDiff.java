package ch.salon.service;

public class InvoiceDiff {
    private final InvoiceExpected expected;
    private final double existingTotal;
    private final long existingQuantity;
    private final double delta;          // delta total
    private final long deltaQuantity;    // delta quantité
    private final String existingLabel;  // label d'une facture existante (pour les stands)

    public InvoiceDiff(InvoiceExpected expected, double existingTotal, long existingQuantity, double delta,
            long deltaQuantity, String existingLabel) {
        this.expected = expected;
        this.existingTotal = existingTotal;
        this.existingQuantity = existingQuantity;
        this.delta = delta;
        this.deltaQuantity = deltaQuantity;
        this.existingLabel = existingLabel;
    }

    public InvoiceExpected getExpected() {
        return expected;
    }

    public double getExistingTotal() {
        return existingTotal;
    }

    public long getExistingQuantity() {
        return existingQuantity;
    }

    public double getDelta() {
        return delta;
    }

    public long getDeltaQuantity() {
        return deltaQuantity;
    }

    public String getExistingLabel() {
        return existingLabel;
    }
}
