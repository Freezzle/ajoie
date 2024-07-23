package ch.salon.domain;

import static ch.salon.domain.DimensionStandTestSamples.*;
import static ch.salon.domain.PriceStandSalonTestSamples.*;
import static ch.salon.domain.SalonTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ch.salon.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class PriceStandSalonTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(PriceStandSalon.class);
        PriceStandSalon priceStandSalon1 = getPriceStandSalonSample1();
        PriceStandSalon priceStandSalon2 = new PriceStandSalon();
        assertThat(priceStandSalon1).isNotEqualTo(priceStandSalon2);

        priceStandSalon2.setId(priceStandSalon1.getId());
        assertThat(priceStandSalon1).isEqualTo(priceStandSalon2);

        priceStandSalon2 = getPriceStandSalonSample2();
        assertThat(priceStandSalon1).isNotEqualTo(priceStandSalon2);
    }

    @Test
    void dimensionTest() {
        PriceStandSalon priceStandSalon = getPriceStandSalonRandomSampleGenerator();
        DimensionStand dimensionStandBack = getDimensionStandRandomSampleGenerator();

        priceStandSalon.setDimension(dimensionStandBack);
        assertThat(priceStandSalon.getDimension()).isEqualTo(dimensionStandBack);

        priceStandSalon.dimension(null);
        assertThat(priceStandSalon.getDimension()).isNull();
    }

    @Test
    void salonTest() {
        PriceStandSalon priceStandSalon = getPriceStandSalonRandomSampleGenerator();
        Salon salonBack = getSalonRandomSampleGenerator();

        priceStandSalon.setSalon(salonBack);
        assertThat(priceStandSalon.getSalon()).isEqualTo(salonBack);

        priceStandSalon.salon(null);
        assertThat(priceStandSalon.getSalon()).isNull();
    }
}
