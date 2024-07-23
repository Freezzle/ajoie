package ch.salon.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class PriceStandSalonTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static PriceStandSalon getPriceStandSalonSample1() {
        return new PriceStandSalon().id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa")).price(1L);
    }

    public static PriceStandSalon getPriceStandSalonSample2() {
        return new PriceStandSalon().id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367")).price(2L);
    }

    public static PriceStandSalon getPriceStandSalonRandomSampleGenerator() {
        return new PriceStandSalon().id(UUID.randomUUID()).price(longCount.incrementAndGet());
    }
}
