package ch.salon.domain;

import static ch.salon.domain.ConferenceTestSamples.*;
import static ch.salon.domain.ConfigurationSalonTestSamples.*;
import static ch.salon.domain.PriceStandSalonTestSamples.*;
import static ch.salon.domain.SalonTestSamples.*;
import static ch.salon.domain.StandTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ch.salon.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class SalonTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Salon.class);
        Salon salon1 = getSalonSample1();
        Salon salon2 = new Salon();
        assertThat(salon1).isNotEqualTo(salon2);

        salon2.setId(salon1.getId());
        assertThat(salon1).isEqualTo(salon2);

        salon2 = getSalonSample2();
        assertThat(salon1).isNotEqualTo(salon2);
    }

    @Test
    void standTest() {
        Salon salon = getSalonRandomSampleGenerator();
        Stand standBack = getStandRandomSampleGenerator();

        salon.addStand(standBack);
        assertThat(salon.getStands()).containsOnly(standBack);
        assertThat(standBack.getSalon()).isEqualTo(salon);

        salon.removeStand(standBack);
        assertThat(salon.getStands()).doesNotContain(standBack);
        assertThat(standBack.getSalon()).isNull();

        salon.stands(new HashSet<>(Set.of(standBack)));
        assertThat(salon.getStands()).containsOnly(standBack);
        assertThat(standBack.getSalon()).isEqualTo(salon);

        salon.setStands(new HashSet<>());
        assertThat(salon.getStands()).doesNotContain(standBack);
        assertThat(standBack.getSalon()).isNull();
    }

    @Test
    void conferenceTest() {
        Salon salon = getSalonRandomSampleGenerator();
        Conference conferenceBack = getConferenceRandomSampleGenerator();

        salon.addConference(conferenceBack);
        assertThat(salon.getConferences()).containsOnly(conferenceBack);
        assertThat(conferenceBack.getSalon()).isEqualTo(salon);

        salon.removeConference(conferenceBack);
        assertThat(salon.getConferences()).doesNotContain(conferenceBack);
        assertThat(conferenceBack.getSalon()).isNull();

        salon.conferences(new HashSet<>(Set.of(conferenceBack)));
        assertThat(salon.getConferences()).containsOnly(conferenceBack);
        assertThat(conferenceBack.getSalon()).isEqualTo(salon);

        salon.setConferences(new HashSet<>());
        assertThat(salon.getConferences()).doesNotContain(conferenceBack);
        assertThat(conferenceBack.getSalon()).isNull();
    }

    @Test
    void priceStandSalonTest() {
        Salon salon = getSalonRandomSampleGenerator();
        PriceStandSalon priceStandSalonBack = getPriceStandSalonRandomSampleGenerator();

        salon.addPriceStandSalon(priceStandSalonBack);
        assertThat(salon.getPriceStandSalons()).containsOnly(priceStandSalonBack);
        assertThat(priceStandSalonBack.getSalon()).isEqualTo(salon);

        salon.removePriceStandSalon(priceStandSalonBack);
        assertThat(salon.getPriceStandSalons()).doesNotContain(priceStandSalonBack);
        assertThat(priceStandSalonBack.getSalon()).isNull();

        salon.priceStandSalons(new HashSet<>(Set.of(priceStandSalonBack)));
        assertThat(salon.getPriceStandSalons()).containsOnly(priceStandSalonBack);
        assertThat(priceStandSalonBack.getSalon()).isEqualTo(salon);

        salon.setPriceStandSalons(new HashSet<>());
        assertThat(salon.getPriceStandSalons()).doesNotContain(priceStandSalonBack);
        assertThat(priceStandSalonBack.getSalon()).isNull();
    }

    @Test
    void configurationTest() {
        Salon salon = getSalonRandomSampleGenerator();
        ConfigurationSalon configurationSalonBack = getConfigurationSalonRandomSampleGenerator();

        salon.setConfiguration(configurationSalonBack);
        assertThat(salon.getConfiguration()).isEqualTo(configurationSalonBack);
        assertThat(configurationSalonBack.getSalon()).isEqualTo(salon);

        salon.configuration(null);
        assertThat(salon.getConfiguration()).isNull();
        assertThat(configurationSalonBack.getSalon()).isNull();
    }
}
