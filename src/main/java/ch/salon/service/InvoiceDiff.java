package ch.salon.service;

public record InvoiceDiff(InvoiceExpected expected, double existingTotal, long existingQuantity, double delta, long deltaQuantity,
                          String existingLabel) {
}
