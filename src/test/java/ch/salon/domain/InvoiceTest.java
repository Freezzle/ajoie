package ch.salon.domain;

import static ch.salon.domain.InvoiceTestSamples.*;
import static ch.salon.domain.StandTestSamples.*;
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
        Stand standBack = getStandRandomSampleGenerator();

        invoice.setStand(standBack);
        assertThat(invoice.getStand()).isEqualTo(standBack);

        invoice.stand(null);
        assertThat(invoice.getStand()).isNull();
    }
}
