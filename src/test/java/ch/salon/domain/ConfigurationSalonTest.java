package ch.salon.domain;

import static ch.salon.domain.ConfigurationSalonTestSamples.*;
import static ch.salon.domain.SalonTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ch.salon.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ConfigurationSalonTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(ConfigurationSalon.class);
        ConfigurationSalon configurationSalon1 = getConfigurationSalonSample1();
        ConfigurationSalon configurationSalon2 = new ConfigurationSalon();
        assertThat(configurationSalon1).isNotEqualTo(configurationSalon2);

        configurationSalon2.setId(configurationSalon1.getId());
        assertThat(configurationSalon1).isEqualTo(configurationSalon2);

        configurationSalon2 = getConfigurationSalonSample2();
        assertThat(configurationSalon1).isNotEqualTo(configurationSalon2);
    }

    @Test
    void salonTest() {
        ConfigurationSalon configurationSalon = getConfigurationSalonRandomSampleGenerator();
        Salon salonBack = getSalonRandomSampleGenerator();

        configurationSalon.setSalon(salonBack);
        assertThat(configurationSalon.getSalon()).isEqualTo(salonBack);

        configurationSalon.salon(null);
        assertThat(configurationSalon.getSalon()).isNull();
    }
}
