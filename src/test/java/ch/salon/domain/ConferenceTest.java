package ch.salon.domain;

import static ch.salon.domain.ConferenceTestSamples.*;
import static ch.salon.domain.ExponentTestSamples.*;
import static ch.salon.domain.SalonTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ch.salon.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ConferenceTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Conference.class);
        Conference conference1 = getConferenceSample1();
        Conference conference2 = new Conference();
        assertThat(conference1).isNotEqualTo(conference2);

        conference2.setId(conference1.getId());
        assertThat(conference1).isEqualTo(conference2);

        conference2 = getConferenceSample2();
        assertThat(conference1).isNotEqualTo(conference2);
    }

    @Test
    void salonTest() {
        Conference conference = getConferenceRandomSampleGenerator();
        Salon salonBack = getSalonRandomSampleGenerator();

        conference.setSalon(salonBack);
        assertThat(conference.getSalon()).isEqualTo(salonBack);

        conference.salon(null);
        assertThat(conference.getSalon()).isNull();
    }

    @Test
    void exponentTest() {
        Conference conference = getConferenceRandomSampleGenerator();
        Exponent exponentBack = getExponentRandomSampleGenerator();

        conference.setExponent(exponentBack);
        assertThat(conference.getExponent()).isEqualTo(exponentBack);

        conference.exponent(null);
        assertThat(conference.getExponent()).isNull();
    }
}
