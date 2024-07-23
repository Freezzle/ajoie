package ch.salon.web.rest;

import static ch.salon.domain.StandAsserts.*;
import static ch.salon.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import ch.salon.IntegrationTest;
import ch.salon.domain.Stand;
import ch.salon.repository.StandRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link StandResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class StandResourceIT {

    private static final String DEFAULT_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_DESCRIPTION = "BBBBBBBBBB";

    private static final Long DEFAULT_NB_MEAL_1 = 1L;
    private static final Long UPDATED_NB_MEAL_1 = 2L;

    private static final Long DEFAULT_NB_MEAL_2 = 1L;
    private static final Long UPDATED_NB_MEAL_2 = 2L;

    private static final Long DEFAULT_NB_MEAL_3 = 1L;
    private static final Long UPDATED_NB_MEAL_3 = 2L;

    private static final Boolean DEFAULT_SHARED = false;
    private static final Boolean UPDATED_SHARED = true;

    private static final Long DEFAULT_NB_TABLE = 1L;
    private static final Long UPDATED_NB_TABLE = 2L;

    private static final Long DEFAULT_NB_CHAIR = 1L;
    private static final Long UPDATED_NB_CHAIR = 2L;

    private static final Boolean DEFAULT_NEED_ELECTRICITY = false;
    private static final Boolean UPDATED_NEED_ELECTRICITY = true;

    private static final Boolean DEFAULT_ACCEPTED_CHART = false;
    private static final Boolean UPDATED_ACCEPTED_CHART = true;

    private static final String ENTITY_API_URL = "/api/stands";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private StandRepository standRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restStandMockMvc;

    private Stand stand;

    private Stand insertedStand;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Stand createEntity(EntityManager em) {
        Stand stand = new Stand()
            .description(DEFAULT_DESCRIPTION)
            .nbMeal1(DEFAULT_NB_MEAL_1)
            .nbMeal2(DEFAULT_NB_MEAL_2)
            .nbMeal3(DEFAULT_NB_MEAL_3)
            .shared(DEFAULT_SHARED)
            .nbTable(DEFAULT_NB_TABLE)
            .nbChair(DEFAULT_NB_CHAIR)
            .needElectricity(DEFAULT_NEED_ELECTRICITY)
            .acceptedChart(DEFAULT_ACCEPTED_CHART);
        return stand;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Stand createUpdatedEntity(EntityManager em) {
        Stand stand = new Stand()
            .description(UPDATED_DESCRIPTION)
            .nbMeal1(UPDATED_NB_MEAL_1)
            .nbMeal2(UPDATED_NB_MEAL_2)
            .nbMeal3(UPDATED_NB_MEAL_3)
            .shared(UPDATED_SHARED)
            .nbTable(UPDATED_NB_TABLE)
            .nbChair(UPDATED_NB_CHAIR)
            .needElectricity(UPDATED_NEED_ELECTRICITY)
            .acceptedChart(UPDATED_ACCEPTED_CHART);
        return stand;
    }

    @BeforeEach
    public void initTest() {
        stand = createEntity(em);
    }

    @AfterEach
    public void cleanup() {
        if (insertedStand != null) {
            standRepository.delete(insertedStand);
            insertedStand = null;
        }
    }

    @Test
    @Transactional
    void createStand() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Stand
        var returnedStand = om.readValue(
            restStandMockMvc
                .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(stand)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            Stand.class
        );

        // Validate the Stand in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertStandUpdatableFieldsEquals(returnedStand, getPersistedStand(returnedStand));

        insertedStand = returnedStand;
    }

    @Test
    @Transactional
    void createStandWithExistingId() throws Exception {
        // Create the Stand with an existing ID
        insertedStand = standRepository.saveAndFlush(stand);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restStandMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(stand)))
            .andExpect(status().isBadRequest());

        // Validate the Stand in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void getAllStands() throws Exception {
        // Initialize the database
        insertedStand = standRepository.saveAndFlush(stand);

        // Get all the standList
        restStandMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(stand.getId().toString())))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].nbMeal1").value(hasItem(DEFAULT_NB_MEAL_1.intValue())))
            .andExpect(jsonPath("$.[*].nbMeal2").value(hasItem(DEFAULT_NB_MEAL_2.intValue())))
            .andExpect(jsonPath("$.[*].nbMeal3").value(hasItem(DEFAULT_NB_MEAL_3.intValue())))
            .andExpect(jsonPath("$.[*].shared").value(hasItem(DEFAULT_SHARED.booleanValue())))
            .andExpect(jsonPath("$.[*].nbTable").value(hasItem(DEFAULT_NB_TABLE.intValue())))
            .andExpect(jsonPath("$.[*].nbChair").value(hasItem(DEFAULT_NB_CHAIR.intValue())))
            .andExpect(jsonPath("$.[*].needElectricity").value(hasItem(DEFAULT_NEED_ELECTRICITY.booleanValue())))
            .andExpect(jsonPath("$.[*].acceptedChart").value(hasItem(DEFAULT_ACCEPTED_CHART.booleanValue())));
    }

    @Test
    @Transactional
    void getStand() throws Exception {
        // Initialize the database
        insertedStand = standRepository.saveAndFlush(stand);

        // Get the stand
        restStandMockMvc
            .perform(get(ENTITY_API_URL_ID, stand.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(stand.getId().toString()))
            .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
            .andExpect(jsonPath("$.nbMeal1").value(DEFAULT_NB_MEAL_1.intValue()))
            .andExpect(jsonPath("$.nbMeal2").value(DEFAULT_NB_MEAL_2.intValue()))
            .andExpect(jsonPath("$.nbMeal3").value(DEFAULT_NB_MEAL_3.intValue()))
            .andExpect(jsonPath("$.shared").value(DEFAULT_SHARED.booleanValue()))
            .andExpect(jsonPath("$.nbTable").value(DEFAULT_NB_TABLE.intValue()))
            .andExpect(jsonPath("$.nbChair").value(DEFAULT_NB_CHAIR.intValue()))
            .andExpect(jsonPath("$.needElectricity").value(DEFAULT_NEED_ELECTRICITY.booleanValue()))
            .andExpect(jsonPath("$.acceptedChart").value(DEFAULT_ACCEPTED_CHART.booleanValue()));
    }

    @Test
    @Transactional
    void getNonExistingStand() throws Exception {
        // Get the stand
        restStandMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingStand() throws Exception {
        // Initialize the database
        insertedStand = standRepository.saveAndFlush(stand);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the stand
        Stand updatedStand = standRepository.findById(stand.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedStand are not directly saved in db
        em.detach(updatedStand);
        updatedStand
            .description(UPDATED_DESCRIPTION)
            .nbMeal1(UPDATED_NB_MEAL_1)
            .nbMeal2(UPDATED_NB_MEAL_2)
            .nbMeal3(UPDATED_NB_MEAL_3)
            .shared(UPDATED_SHARED)
            .nbTable(UPDATED_NB_TABLE)
            .nbChair(UPDATED_NB_CHAIR)
            .needElectricity(UPDATED_NEED_ELECTRICITY)
            .acceptedChart(UPDATED_ACCEPTED_CHART);

        restStandMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedStand.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedStand))
            )
            .andExpect(status().isOk());

        // Validate the Stand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedStandToMatchAllProperties(updatedStand);
    }

    @Test
    @Transactional
    void putNonExistingStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        stand.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restStandMockMvc
            .perform(
                put(ENTITY_API_URL_ID, stand.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(stand))
            )
            .andExpect(status().isBadRequest());

        // Validate the Stand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        stand.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restStandMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(stand))
            )
            .andExpect(status().isBadRequest());

        // Validate the Stand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        stand.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restStandMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(stand)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Stand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateStandWithPatch() throws Exception {
        // Initialize the database
        insertedStand = standRepository.saveAndFlush(stand);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the stand using partial update
        Stand partialUpdatedStand = new Stand();
        partialUpdatedStand.setId(stand.getId());

        partialUpdatedStand
            .nbMeal3(UPDATED_NB_MEAL_3)
            .shared(UPDATED_SHARED)
            .nbChair(UPDATED_NB_CHAIR)
            .acceptedChart(UPDATED_ACCEPTED_CHART);

        restStandMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedStand.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedStand))
            )
            .andExpect(status().isOk());

        // Validate the Stand in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertStandUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedStand, stand), getPersistedStand(stand));
    }

    @Test
    @Transactional
    void fullUpdateStandWithPatch() throws Exception {
        // Initialize the database
        insertedStand = standRepository.saveAndFlush(stand);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the stand using partial update
        Stand partialUpdatedStand = new Stand();
        partialUpdatedStand.setId(stand.getId());

        partialUpdatedStand
            .description(UPDATED_DESCRIPTION)
            .nbMeal1(UPDATED_NB_MEAL_1)
            .nbMeal2(UPDATED_NB_MEAL_2)
            .nbMeal3(UPDATED_NB_MEAL_3)
            .shared(UPDATED_SHARED)
            .nbTable(UPDATED_NB_TABLE)
            .nbChair(UPDATED_NB_CHAIR)
            .needElectricity(UPDATED_NEED_ELECTRICITY)
            .acceptedChart(UPDATED_ACCEPTED_CHART);

        restStandMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedStand.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedStand))
            )
            .andExpect(status().isOk());

        // Validate the Stand in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertStandUpdatableFieldsEquals(partialUpdatedStand, getPersistedStand(partialUpdatedStand));
    }

    @Test
    @Transactional
    void patchNonExistingStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        stand.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restStandMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, stand.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(stand))
            )
            .andExpect(status().isBadRequest());

        // Validate the Stand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        stand.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restStandMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(stand))
            )
            .andExpect(status().isBadRequest());

        // Validate the Stand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        stand.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restStandMockMvc
            .perform(patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(stand)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Stand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteStand() throws Exception {
        // Initialize the database
        insertedStand = standRepository.saveAndFlush(stand);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the stand
        restStandMockMvc
            .perform(delete(ENTITY_API_URL_ID, stand.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return standRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected Stand getPersistedStand(Stand stand) {
        return standRepository.findById(stand.getId()).orElseThrow();
    }

    protected void assertPersistedStandToMatchAllProperties(Stand expectedStand) {
        assertStandAllPropertiesEquals(expectedStand, getPersistedStand(expectedStand));
    }

    protected void assertPersistedStandToMatchUpdatableProperties(Stand expectedStand) {
        assertStandAllUpdatablePropertiesEquals(expectedStand, getPersistedStand(expectedStand));
    }
}
