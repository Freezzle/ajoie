package ch.salon.web.rest;

import static ch.salon.domain.DimensionStandAsserts.*;
import static ch.salon.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import ch.salon.IntegrationTest;
import ch.salon.domain.DimensionStand;
import ch.salon.repository.DimensionStandRepository;
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
 * Integration tests for the {@link DimensionStandResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class DimensionStandResourceIT {

    private static final String DEFAULT_DIMENSION = "AAAAAAAAAA";
    private static final String UPDATED_DIMENSION = "BBBBBBBBBB";

    private static final String ENTITY_API_URL = "/api/dimension-stands";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private DimensionStandRepository dimensionStandRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restDimensionStandMockMvc;

    private DimensionStand dimensionStand;

    private DimensionStand insertedDimensionStand;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static DimensionStand createEntity(EntityManager em) {
        DimensionStand dimensionStand = new DimensionStand().dimension(DEFAULT_DIMENSION);
        return dimensionStand;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static DimensionStand createUpdatedEntity(EntityManager em) {
        DimensionStand dimensionStand = new DimensionStand().dimension(UPDATED_DIMENSION);
        return dimensionStand;
    }

    @BeforeEach
    public void initTest() {
        dimensionStand = createEntity(em);
    }

    @AfterEach
    public void cleanup() {
        if (insertedDimensionStand != null) {
            dimensionStandRepository.delete(insertedDimensionStand);
            insertedDimensionStand = null;
        }
    }

    @Test
    @Transactional
    void createDimensionStand() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the DimensionStand
        var returnedDimensionStand = om.readValue(
            restDimensionStandMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(dimensionStand))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            DimensionStand.class
        );

        // Validate the DimensionStand in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertDimensionStandUpdatableFieldsEquals(returnedDimensionStand, getPersistedDimensionStand(returnedDimensionStand));

        insertedDimensionStand = returnedDimensionStand;
    }

    @Test
    @Transactional
    void createDimensionStandWithExistingId() throws Exception {
        // Create the DimensionStand with an existing ID
        insertedDimensionStand = dimensionStandRepository.saveAndFlush(dimensionStand);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restDimensionStandMockMvc
            .perform(
                post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(dimensionStand))
            )
            .andExpect(status().isBadRequest());

        // Validate the DimensionStand in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void getAllDimensionStands() throws Exception {
        // Initialize the database
        insertedDimensionStand = dimensionStandRepository.saveAndFlush(dimensionStand);

        // Get all the dimensionStandList
        restDimensionStandMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(dimensionStand.getId().toString())))
            .andExpect(jsonPath("$.[*].dimension").value(hasItem(DEFAULT_DIMENSION)));
    }

    @Test
    @Transactional
    void getDimensionStand() throws Exception {
        // Initialize the database
        insertedDimensionStand = dimensionStandRepository.saveAndFlush(dimensionStand);

        // Get the dimensionStand
        restDimensionStandMockMvc
            .perform(get(ENTITY_API_URL_ID, dimensionStand.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(dimensionStand.getId().toString()))
            .andExpect(jsonPath("$.dimension").value(DEFAULT_DIMENSION));
    }

    @Test
    @Transactional
    void getNonExistingDimensionStand() throws Exception {
        // Get the dimensionStand
        restDimensionStandMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingDimensionStand() throws Exception {
        // Initialize the database
        insertedDimensionStand = dimensionStandRepository.saveAndFlush(dimensionStand);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the dimensionStand
        DimensionStand updatedDimensionStand = dimensionStandRepository.findById(dimensionStand.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedDimensionStand are not directly saved in db
        em.detach(updatedDimensionStand);
        updatedDimensionStand.dimension(UPDATED_DIMENSION);

        restDimensionStandMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedDimensionStand.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedDimensionStand))
            )
            .andExpect(status().isOk());

        // Validate the DimensionStand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedDimensionStandToMatchAllProperties(updatedDimensionStand);
    }

    @Test
    @Transactional
    void putNonExistingDimensionStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        dimensionStand.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restDimensionStandMockMvc
            .perform(
                put(ENTITY_API_URL_ID, dimensionStand.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(dimensionStand))
            )
            .andExpect(status().isBadRequest());

        // Validate the DimensionStand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchDimensionStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        dimensionStand.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDimensionStandMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(dimensionStand))
            )
            .andExpect(status().isBadRequest());

        // Validate the DimensionStand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamDimensionStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        dimensionStand.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDimensionStandMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(dimensionStand)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the DimensionStand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateDimensionStandWithPatch() throws Exception {
        // Initialize the database
        insertedDimensionStand = dimensionStandRepository.saveAndFlush(dimensionStand);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the dimensionStand using partial update
        DimensionStand partialUpdatedDimensionStand = new DimensionStand();
        partialUpdatedDimensionStand.setId(dimensionStand.getId());

        partialUpdatedDimensionStand.dimension(UPDATED_DIMENSION);

        restDimensionStandMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedDimensionStand.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedDimensionStand))
            )
            .andExpect(status().isOk());

        // Validate the DimensionStand in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertDimensionStandUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedDimensionStand, dimensionStand),
            getPersistedDimensionStand(dimensionStand)
        );
    }

    @Test
    @Transactional
    void fullUpdateDimensionStandWithPatch() throws Exception {
        // Initialize the database
        insertedDimensionStand = dimensionStandRepository.saveAndFlush(dimensionStand);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the dimensionStand using partial update
        DimensionStand partialUpdatedDimensionStand = new DimensionStand();
        partialUpdatedDimensionStand.setId(dimensionStand.getId());

        partialUpdatedDimensionStand.dimension(UPDATED_DIMENSION);

        restDimensionStandMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedDimensionStand.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedDimensionStand))
            )
            .andExpect(status().isOk());

        // Validate the DimensionStand in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertDimensionStandUpdatableFieldsEquals(partialUpdatedDimensionStand, getPersistedDimensionStand(partialUpdatedDimensionStand));
    }

    @Test
    @Transactional
    void patchNonExistingDimensionStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        dimensionStand.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restDimensionStandMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, dimensionStand.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(dimensionStand))
            )
            .andExpect(status().isBadRequest());

        // Validate the DimensionStand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchDimensionStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        dimensionStand.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDimensionStandMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(dimensionStand))
            )
            .andExpect(status().isBadRequest());

        // Validate the DimensionStand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamDimensionStand() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        dimensionStand.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restDimensionStandMockMvc
            .perform(
                patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(dimensionStand))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the DimensionStand in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteDimensionStand() throws Exception {
        // Initialize the database
        insertedDimensionStand = dimensionStandRepository.saveAndFlush(dimensionStand);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the dimensionStand
        restDimensionStandMockMvc
            .perform(delete(ENTITY_API_URL_ID, dimensionStand.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return dimensionStandRepository.count();
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

    protected DimensionStand getPersistedDimensionStand(DimensionStand dimensionStand) {
        return dimensionStandRepository.findById(dimensionStand.getId()).orElseThrow();
    }

    protected void assertPersistedDimensionStandToMatchAllProperties(DimensionStand expectedDimensionStand) {
        assertDimensionStandAllPropertiesEquals(expectedDimensionStand, getPersistedDimensionStand(expectedDimensionStand));
    }

    protected void assertPersistedDimensionStandToMatchUpdatableProperties(DimensionStand expectedDimensionStand) {
        assertDimensionStandAllUpdatablePropertiesEquals(expectedDimensionStand, getPersistedDimensionStand(expectedDimensionStand));
    }
}
