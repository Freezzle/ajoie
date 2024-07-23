package ch.salon.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class ConfigurationSalonTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static ConfigurationSalon getConfigurationSalonSample1() {
        return new ConfigurationSalon()
            .id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa"))
            .priceMeal1(1L)
            .priceMeal2(1L)
            .priceMeal3(1L)
            .priceConference(1L)
            .priceSharingStand(1L);
    }

    public static ConfigurationSalon getConfigurationSalonSample2() {
        return new ConfigurationSalon()
            .id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367"))
            .priceMeal1(2L)
            .priceMeal2(2L)
            .priceMeal3(2L)
            .priceConference(2L)
            .priceSharingStand(2L);
    }

    public static ConfigurationSalon getConfigurationSalonRandomSampleGenerator() {
        return new ConfigurationSalon()
            .id(UUID.randomUUID())
            .priceMeal1(longCount.incrementAndGet())
            .priceMeal2(longCount.incrementAndGet())
            .priceMeal3(longCount.incrementAndGet())
            .priceConference(longCount.incrementAndGet())
            .priceSharingStand(longCount.incrementAndGet());
    }
}
