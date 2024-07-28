package ch.salon.web.rest;

import static ch.salon.domain.SalonAsserts.*;
import static ch.salon.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import ch.salon.IntegrationTest;
import ch.salon.domain.Salon;
import ch.salon.repository.SalonRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
 * Integration tests for the {@link SalonResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class SalonResourceIT {

    private static final String DEFAULT_PLACE = "AAAAAAAAAA";
    private static final String UPDATED_PLACE = "BBBBBBBBBB";

    private static final Instant DEFAULT_STARTING_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_STARTING_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_ENDING_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_ENDING_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/salons";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private SalonRepository salonRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restSalonMockMvc;

    private Salon salon;

    private Salon insertedSalon;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Salon createEntity(EntityManager em) {
        Salon salon = new Salon().place(DEFAULT_PLACE).startingDate(DEFAULT_STARTING_DATE).endingDate(DEFAULT_ENDING_DATE);
        return salon;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Salon createUpdatedEntity(EntityManager em) {
        Salon salon = new Salon().place(UPDATED_PLACE).startingDate(UPDATED_STARTING_DATE).endingDate(UPDATED_ENDING_DATE);
        return salon;
    }

    @BeforeEach
    public void initTest() {
        salon = createEntity(em);
    }

    @AfterEach
    public void cleanup() {
        if (insertedSalon != null) {
            salonRepository.delete(insertedSalon);
            insertedSalon = null;
        }
    }

    @Test
    @Transactional
    void createSalon() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Salon
        var returnedSalon = om.readValue(
            restSalonMockMvc
                .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(salon)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            Salon.class
        );

        // Validate the Salon in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertSalonUpdatableFieldsEquals(returnedSalon, getPersistedSalon(returnedSalon));

        insertedSalon = returnedSalon;
    }

    @Test
    @Transactional
    void createSalonWithExistingId() throws Exception {
        // Create the Salon with an existing ID
        insertedSalon = salonRepository.saveAndFlush(salon);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restSalonMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(salon)))
            .andExpect(status().isBadRequest());

        // Validate the Salon in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void getAllSalons() throws Exception {
        // Initialize the database
        insertedSalon = salonRepository.saveAndFlush(salon);

        // Get all the salonList
        restSalonMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(salon.getId().toString())))
            .andExpect(jsonPath("$.[*].place").value(hasItem(DEFAULT_PLACE)))
            .andExpect(jsonPath("$.[*].startingDate").value(hasItem(DEFAULT_STARTING_DATE.toString())))
            .andExpect(jsonPath("$.[*].endingDate").value(hasItem(DEFAULT_ENDING_DATE.toString())));
    }

    @Test
    @Transactional
    void getSalon() throws Exception {
        // Initialize the database
        insertedSalon = salonRepository.saveAndFlush(salon);

        // Get the salon
        restSalonMockMvc
            .perform(get(ENTITY_API_URL_ID, salon.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(salon.getId().toString()))
            .andExpect(jsonPath("$.place").value(DEFAULT_PLACE))
            .andExpect(jsonPath("$.startingDate").value(DEFAULT_STARTING_DATE.toString()))
            .andExpect(jsonPath("$.endingDate").value(DEFAULT_ENDING_DATE.toString()));
    }

    @Test
    @Transactional
    void getNonExistingSalon() throws Exception {
        // Get the salon
        restSalonMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingSalon() throws Exception {
        // Initialize the database
        insertedSalon = salonRepository.saveAndFlush(salon);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the salon
        Salon updatedSalon = salonRepository.findById(salon.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedSalon are not directly saved in db
        em.detach(updatedSalon);
        updatedSalon.place(UPDATED_PLACE).startingDate(UPDATED_STARTING_DATE).endingDate(UPDATED_ENDING_DATE);

        restSalonMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedSalon.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedSalon))
            )
            .andExpect(status().isOk());

        // Validate the Salon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedSalonToMatchAllProperties(updatedSalon);
    }

    @Test
    @Transactional
    void putNonExistingSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        salon.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restSalonMockMvc
            .perform(
                put(ENTITY_API_URL_ID, salon.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(salon))
            )
            .andExpect(status().isBadRequest());

        // Validate the Salon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        salon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restSalonMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(salon))
            )
            .andExpect(status().isBadRequest());

        // Validate the Salon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        salon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restSalonMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(salon)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Salon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void fullUpdateSalonWithPatch() throws Exception {
        // Initialize the database
        insertedSalon = salonRepository.saveAndFlush(salon);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the salon using partial update
        Salon partialUpdatedSalon = new Salon();
        partialUpdatedSalon.setId(salon.getId());

        partialUpdatedSalon.place(UPDATED_PLACE).startingDate(UPDATED_STARTING_DATE).endingDate(UPDATED_ENDING_DATE);

        restSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedSalon.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedSalon))
            )
            .andExpect(status().isOk());

        // Validate the Salon in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertSalonUpdatableFieldsEquals(partialUpdatedSalon, getPersistedSalon(partialUpdatedSalon));
    }

    @Test
    @Transactional
    void patchNonExistingSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        salon.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, salon.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(salon))
            )
            .andExpect(status().isBadRequest());

        // Validate the Salon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        salon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(salon))
            )
            .andExpect(status().isBadRequest());

        // Validate the Salon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        salon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restSalonMockMvc
            .perform(patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(salon)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Salon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteSalon() throws Exception {
        // Initialize the database
        insertedSalon = salonRepository.saveAndFlush(salon);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the salon
        restSalonMockMvc
            .perform(delete(ENTITY_API_URL_ID, salon.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return salonRepository.count();
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

    protected Salon getPersistedSalon(Salon salon) {
        return salonRepository.findById(salon.getId()).orElseThrow();
    }

    protected void assertPersistedSalonToMatchAllProperties(Salon expectedSalon) {
        assertSalonAllPropertiesEquals(expectedSalon, getPersistedSalon(expectedSalon));
    }

    protected void assertPersistedSalonToMatchUpdatableProperties(Salon expectedSalon) {
        assertSalonAllUpdatablePropertiesEquals(expectedSalon, getPersistedSalon(expectedSalon));
    }
}
