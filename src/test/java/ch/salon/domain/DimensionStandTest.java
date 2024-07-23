package ch.salon.domain;

import static ch.salon.domain.DimensionStandTestSamples.*;
import static ch.salon.domain.PriceStandSalonTestSamples.*;
import static ch.salon.domain.StandTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ch.salon.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class DimensionStandTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(DimensionStand.class);
        DimensionStand dimensionStand1 = getDimensionStandSample1();
        DimensionStand dimensionStand2 = new DimensionStand();
        assertThat(dimensionStand1).isNotEqualTo(dimensionStand2);

        dimensionStand2.setId(dimensionStand1.getId());
        assertThat(dimensionStand1).isEqualTo(dimensionStand2);

        dimensionStand2 = getDimensionStandSample2();
        assertThat(dimensionStand1).isNotEqualTo(dimensionStand2);
    }

    @Test
    void priceStandSalonTest() {
        DimensionStand dimensionStand = getDimensionStandRandomSampleGenerator();
        PriceStandSalon priceStandSalonBack = getPriceStandSalonRandomSampleGenerator();

        dimensionStand.addPriceStandSalon(priceStandSalonBack);
        assertThat(dimensionStand.getPriceStandSalons()).containsOnly(priceStandSalonBack);
        assertThat(priceStandSalonBack.getDimension()).isEqualTo(dimensionStand);

        dimensionStand.removePriceStandSalon(priceStandSalonBack);
        assertThat(dimensionStand.getPriceStandSalons()).doesNotContain(priceStandSalonBack);
        assertThat(priceStandSalonBack.getDimension()).isNull();

        dimensionStand.priceStandSalons(new HashSet<>(Set.of(priceStandSalonBack)));
        assertThat(dimensionStand.getPriceStandSalons()).containsOnly(priceStandSalonBack);
        assertThat(priceStandSalonBack.getDimension()).isEqualTo(dimensionStand);

        dimensionStand.setPriceStandSalons(new HashSet<>());
        assertThat(dimensionStand.getPriceStandSalons()).doesNotContain(priceStandSalonBack);
        assertThat(priceStandSalonBack.getDimension()).isNull();
    }

    @Test
    void standTest() {
        DimensionStand dimensionStand = getDimensionStandRandomSampleGenerator();
        Stand standBack = getStandRandomSampleGenerator();

        dimensionStand.addStand(standBack);
        assertThat(dimensionStand.getStands()).containsOnly(standBack);
        assertThat(standBack.getDimension()).isEqualTo(dimensionStand);

        dimensionStand.removeStand(standBack);
        assertThat(dimensionStand.getStands()).doesNotContain(standBack);
        assertThat(standBack.getDimension()).isNull();

        dimensionStand.stands(new HashSet<>(Set.of(standBack)));
        assertThat(dimensionStand.getStands()).containsOnly(standBack);
        assertThat(standBack.getDimension()).isEqualTo(dimensionStand);

        dimensionStand.setStands(new HashSet<>());
        assertThat(dimensionStand.getStands()).doesNotContain(standBack);
        assertThat(standBack.getDimension()).isNull();
    }
}
