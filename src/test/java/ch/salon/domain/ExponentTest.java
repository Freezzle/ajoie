package ch.salon.domain;

import static ch.salon.domain.ConferenceTestSamples.*;
import static ch.salon.domain.ExponentTestSamples.*;
import static ch.salon.domain.StandTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ch.salon.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ExponentTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Exponent.class);
        Exponent exponent1 = getExponentSample1();
        Exponent exponent2 = new Exponent();
        assertThat(exponent1).isNotEqualTo(exponent2);

        exponent2.setId(exponent1.getId());
        assertThat(exponent1).isEqualTo(exponent2);

        exponent2 = getExponentSample2();
        assertThat(exponent1).isNotEqualTo(exponent2);
    }

    @Test
    void standTest() {
        Exponent exponent = getExponentRandomSampleGenerator();
        Stand standBack = getStandRandomSampleGenerator();

        exponent.addStand(standBack);
        assertThat(exponent.getStands()).containsOnly(standBack);
        assertThat(standBack.getExponent()).isEqualTo(exponent);

        exponent.removeStand(standBack);
        assertThat(exponent.getStands()).doesNotContain(standBack);
        assertThat(standBack.getExponent()).isNull();

        exponent.stands(new HashSet<>(Set.of(standBack)));
        assertThat(exponent.getStands()).containsOnly(standBack);
        assertThat(standBack.getExponent()).isEqualTo(exponent);

        exponent.setStands(new HashSet<>());
        assertThat(exponent.getStands()).doesNotContain(standBack);
        assertThat(standBack.getExponent()).isNull();
    }

    @Test
    void conferenceTest() {
        Exponent exponent = getExponentRandomSampleGenerator();
        Conference conferenceBack = getConferenceRandomSampleGenerator();

        exponent.addConference(conferenceBack);
        assertThat(exponent.getConferences()).containsOnly(conferenceBack);
        assertThat(conferenceBack.getExponent()).isEqualTo(exponent);

        exponent.removeConference(conferenceBack);
        assertThat(exponent.getConferences()).doesNotContain(conferenceBack);
        assertThat(conferenceBack.getExponent()).isNull();

        exponent.conferences(new HashSet<>(Set.of(conferenceBack)));
        assertThat(exponent.getConferences()).containsOnly(conferenceBack);
        assertThat(conferenceBack.getExponent()).isEqualTo(exponent);

        exponent.setConferences(new HashSet<>());
        assertThat(exponent.getConferences()).doesNotContain(conferenceBack);
        assertThat(conferenceBack.getExponent()).isNull();
    }
}
