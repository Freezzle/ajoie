package ch.salon.domain;

import static ch.salon.domain.BillingTestSamples.*;
import static ch.salon.domain.DimensionStandTestSamples.*;
import static ch.salon.domain.ExponentTestSamples.*;
import static ch.salon.domain.SalonTestSamples.*;
import static ch.salon.domain.StandTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ch.salon.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class StandTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Stand.class);
        Stand stand1 = getStandSample1();
        Stand stand2 = new Stand();
        assertThat(stand1).isNotEqualTo(stand2);

        stand2.setId(stand1.getId());
        assertThat(stand1).isEqualTo(stand2);

        stand2 = getStandSample2();
        assertThat(stand1).isNotEqualTo(stand2);
    }

    @Test
    void billingTest() {
        Stand stand = getStandRandomSampleGenerator();
        Billing billingBack = getBillingRandomSampleGenerator();

        stand.setBilling(billingBack);
        assertThat(stand.getBilling()).isEqualTo(billingBack);
        assertThat(billingBack.getStand()).isEqualTo(stand);

        stand.billing(null);
        assertThat(stand.getBilling()).isNull();
        assertThat(billingBack.getStand()).isNull();
    }

    @Test
    void exponentTest() {
        Stand stand = getStandRandomSampleGenerator();
        Exponent exponentBack = getExponentRandomSampleGenerator();

        stand.setExponent(exponentBack);
        assertThat(stand.getExponent()).isEqualTo(exponentBack);

        stand.exponent(null);
        assertThat(stand.getExponent()).isNull();
    }

    @Test
    void salonTest() {
        Stand stand = getStandRandomSampleGenerator();
        Salon salonBack = getSalonRandomSampleGenerator();

        stand.setSalon(salonBack);
        assertThat(stand.getSalon()).isEqualTo(salonBack);

        stand.salon(null);
        assertThat(stand.getSalon()).isNull();
    }

    @Test
    void dimensionTest() {
        Stand stand = getStandRandomSampleGenerator();
        DimensionStand dimensionStandBack = getDimensionStandRandomSampleGenerator();

        stand.setDimension(dimensionStandBack);
        assertThat(stand.getDimension()).isEqualTo(dimensionStandBack);

        stand.dimension(null);
        assertThat(stand.getDimension()).isNull();
    }
}
