package ch.salon.domain;

import static ch.salon.domain.BillingTestSamples.*;
import static ch.salon.domain.InvoiceTestSamples.*;
import static ch.salon.domain.StandTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ch.salon.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class BillingTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Billing.class);
        Billing billing1 = getBillingSample1();
        Billing billing2 = new Billing();
        assertThat(billing1).isNotEqualTo(billing2);

        billing2.setId(billing1.getId());
        assertThat(billing1).isEqualTo(billing2);

        billing2 = getBillingSample2();
        assertThat(billing1).isNotEqualTo(billing2);
    }

    @Test
    void standTest() {
        Billing billing = getBillingRandomSampleGenerator();
        Stand standBack = getStandRandomSampleGenerator();

        billing.setStand(standBack);
        assertThat(billing.getStand()).isEqualTo(standBack);

        billing.stand(null);
        assertThat(billing.getStand()).isNull();
    }

    @Test
    void invoiceTest() {
        Billing billing = getBillingRandomSampleGenerator();
        Invoice invoiceBack = getInvoiceRandomSampleGenerator();

        billing.addInvoice(invoiceBack);
        assertThat(billing.getInvoices()).containsOnly(invoiceBack);
        assertThat(invoiceBack.getBilling()).isEqualTo(billing);

        billing.removeInvoice(invoiceBack);
        assertThat(billing.getInvoices()).doesNotContain(invoiceBack);
        assertThat(invoiceBack.getBilling()).isNull();

        billing.invoices(new HashSet<>(Set.of(invoiceBack)));
        assertThat(billing.getInvoices()).containsOnly(invoiceBack);
        assertThat(invoiceBack.getBilling()).isEqualTo(billing);

        billing.setInvoices(new HashSet<>());
        assertThat(billing.getInvoices()).doesNotContain(invoiceBack);
        assertThat(invoiceBack.getBilling()).isNull();
    }
}
