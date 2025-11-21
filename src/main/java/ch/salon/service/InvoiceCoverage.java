package ch.salon.service;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@AllArgsConstructor
@Getter
public class InvoiceCoverage {
    private final boolean allElementsPresent;
    private final List<InvoiceDiff> differences;
}
