package ch.salon.domain;

import static org.assertj.core.api.Assertions.assertThat;

public class DimensionStandAsserts {

    /**
     * Asserts that the entity has all properties (fields/relationships) set.
     *
     * @param expected the expected entity
     * @param actual the actual entity
     */
    public static void assertDimensionStandAllPropertiesEquals(DimensionStand expected, DimensionStand actual) {
        assertDimensionStandAutoGeneratedPropertiesEquals(expected, actual);
        assertDimensionStandAllUpdatablePropertiesEquals(expected, actual);
    }

    /**
     * Asserts that the entity has all updatable properties (fields/relationships) set.
     *
     * @param expected the expected entity
     * @param actual the actual entity
     */
    public static void assertDimensionStandAllUpdatablePropertiesEquals(DimensionStand expected, DimensionStand actual) {
        assertDimensionStandUpdatableFieldsEquals(expected, actual);
        assertDimensionStandUpdatableRelationshipsEquals(expected, actual);
    }

    /**
     * Asserts that the entity has all the auto generated properties (fields/relationships) set.
     *
     * @param expected the expected entity
     * @param actual the actual entity
     */
    public static void assertDimensionStandAutoGeneratedPropertiesEquals(DimensionStand expected, DimensionStand actual) {
        assertThat(expected)
            .as("Verify DimensionStand auto generated properties")
            .satisfies(e -> assertThat(e.getId()).as("check id").isEqualTo(actual.getId()));
    }

    /**
     * Asserts that the entity has all the updatable fields set.
     *
     * @param expected the expected entity
     * @param actual the actual entity
     */
    public static void assertDimensionStandUpdatableFieldsEquals(DimensionStand expected, DimensionStand actual) {
        assertThat(expected)
            .as("Verify DimensionStand relevant properties")
            .satisfies(e -> assertThat(e.getDimension()).as("check dimension").isEqualTo(actual.getDimension()));
    }

    /**
     * Asserts that the entity has all the updatable relationships set.
     *
     * @param expected the expected entity
     * @param actual the actual entity
     */
    public static void assertDimensionStandUpdatableRelationshipsEquals(DimensionStand expected, DimensionStand actual) {}
}
