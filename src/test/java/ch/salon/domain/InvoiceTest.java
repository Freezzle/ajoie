package ch.salon.domain;

import static ch.salon.domain.BillingTestSamples.*;
import static ch.salon.domain.InvoiceTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ch.salon.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class InvoiceTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Invoice.class);
        Invoice invoice1 = getInvoiceSample1();
        Invoice invoice2 = new Invoice();
        assertThat(invoice1).isNotEqualTo(invoice2);

        invoice2.setId(invoice1.getId());
        assertThat(invoice1).isEqualTo(invoice2);

        invoice2 = getInvoiceSample2();
        assertThat(invoice1).isNotEqualTo(invoice2);
    }

    @Test
    void billingTest() {
        Invoice invoice = getInvoiceRandomSampleGenerator();
        Billing billingBack = getBillingRandomSampleGenerator();

        invoice.setBilling(billingBack);
        assertThat(invoice.getBilling()).isEqualTo(billingBack);

        invoice.billing(null);
        assertThat(invoice.getBilling()).isNull();
    }
}
