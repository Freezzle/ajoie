package ch.salon.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class StandTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Stand getStandSample1() {
        return new Stand()
            .id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa"))
            .description("description1")
            .nbMeal1(1L)
            .nbMeal2(1L)
            .nbMeal3(1L)
            .nbTable(1L)
            .nbChair(1L);
    }

    public static Stand getStandSample2() {
        return new Stand()
            .id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367"))
            .description("description2")
            .nbMeal1(2L)
            .nbMeal2(2L)
            .nbMeal3(2L)
            .nbTable(2L)
            .nbChair(2L);
    }

    public static Stand getStandRandomSampleGenerator() {
        return new Stand()
            .id(UUID.randomUUID())
            .description(UUID.randomUUID().toString())
            .nbMeal1(longCount.incrementAndGet())
            .nbMeal2(longCount.incrementAndGet())
            .nbMeal3(longCount.incrementAndGet())
            .nbTable(longCount.incrementAndGet())
            .nbChair(longCount.incrementAndGet());
    }
}
