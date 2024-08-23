package ch.salon.service.document;

import ch.salon.domain.InvoicingPlan;
import ch.salon.service.DocumentService;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;

@Component
public class InvoiceDocumentCreator {

    private DocumentService documentService;

    public InvoiceDocumentCreator(DocumentService documentService) {
        this.documentService = documentService;
    }

    public InputStreamSource generate(InvoicingPlan invoicingPlan) throws Exception {
        return documentService.generate(new InvoiceDocumentDataProvider(invoicingPlan));
    }
}
