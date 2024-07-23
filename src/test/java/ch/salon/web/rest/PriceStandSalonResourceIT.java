package ch.salon.web.rest;

import static ch.salon.domain.PriceStandSalonAsserts.*;
import static ch.salon.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import ch.salon.IntegrationTest;
import ch.salon.domain.PriceStandSalon;
import ch.salon.repository.PriceStandSalonRepository;
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
 * Integration tests for the {@link PriceStandSalonResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class PriceStandSalonResourceIT {

    private static final Long DEFAULT_PRICE = 1L;
    private static final Long UPDATED_PRICE = 2L;

    private static final String ENTITY_API_URL = "/api/price-stand-salons";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private PriceStandSalonRepository priceStandSalonRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restPriceStandSalonMockMvc;

    private PriceStandSalon priceStandSalon;

    private PriceStandSalon insertedPriceStandSalon;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static PriceStandSalon createEntity(EntityManager em) {
        PriceStandSalon priceStandSalon = new PriceStandSalon().price(DEFAULT_PRICE);
        return priceStandSalon;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static PriceStandSalon createUpdatedEntity(EntityManager em) {
        PriceStandSalon priceStandSalon = new PriceStandSalon().price(UPDATED_PRICE);
        return priceStandSalon;
    }

    @BeforeEach
    public void initTest() {
        priceStandSalon = createEntity(em);
    }

    @AfterEach
    public void cleanup() {
        if (insertedPriceStandSalon != null) {
            priceStandSalonRepository.delete(insertedPriceStandSalon);
            insertedPriceStandSalon = null;
        }
    }

    @Test
    @Transactional
    void createPriceStandSalon() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the PriceStandSalon
        var returnedPriceStandSalon = om.readValue(
            restPriceStandSalonMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(priceStandSalon))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            PriceStandSalon.class
        );

        // Validate the PriceStandSalon in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertPriceStandSalonUpdatableFieldsEquals(returnedPriceStandSalon, getPersistedPriceStandSalon(returnedPriceStandSalon));

        insertedPriceStandSalon = returnedPriceStandSalon;
    }

    @Test
    @Transactional
    void createPriceStandSalonWithExistingId() throws Exception {
        // Create the PriceStandSalon with an existing ID
        insertedPriceStandSalon = priceStandSalonRepository.saveAndFlush(priceStandSalon);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restPriceStandSalonMockMvc
            .perform(
                post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(priceStandSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the PriceStandSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void getAllPriceStandSalons() throws Exception {
        // Initialize the database
        insertedPriceStandSalon = priceStandSalonRepository.saveAndFlush(priceStandSalon);

        // Get all the priceStandSalonList
        restPriceStandSalonMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(priceStandSalon.getId().toString())))
            .andExpect(jsonPath("$.[*].price").value(hasItem(DEFAULT_PRICE.intValue())));
    }

    @Test
    @Transactional
    void getPriceStandSalon() throws Exception {
        // Initialize the database
        insertedPriceStandSalon = priceStandSalonRepository.saveAndFlush(priceStandSalon);

        // Get the priceStandSalon
        restPriceStandSalonMockMvc
            .perform(get(ENTITY_API_URL_ID, priceStandSalon.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(priceStandSalon.getId().toString()))
            .andExpect(jsonPath("$.price").value(DEFAULT_PRICE.intValue()));
    }

    @Test
    @Transactional
    void getNonExistingPriceStandSalon() throws Exception {
        // Get the priceStandSalon
        restPriceStandSalonMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingPriceStandSalon() throws Exception {
        // Initialize the database
        insertedPriceStandSalon = priceStandSalonRepository.saveAndFlush(priceStandSalon);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the priceStandSalon
        PriceStandSalon updatedPriceStandSalon = priceStandSalonRepository.findById(priceStandSalon.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedPriceStandSalon are not directly saved in db
        em.detach(updatedPriceStandSalon);
        updatedPriceStandSalon.price(UPDATED_PRICE);

        restPriceStandSalonMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedPriceStandSalon.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedPriceStandSalon))
            )
            .andExpect(status().isOk());

        // Validate the PriceStandSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedPriceStandSalonToMatchAllProperties(updatedPriceStandSalon);
    }

    @Test
    @Transactional
    void putNonExistingPriceStandSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priceStandSalon.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPriceStandSalonMockMvc
            .perform(
                put(ENTITY_API_URL_ID, priceStandSalon.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(priceStandSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the PriceStandSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchPriceStandSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priceStandSalon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPriceStandSalonMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(priceStandSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the PriceStandSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamPriceStandSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priceStandSalon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPriceStandSalonMockMvc
            .perform(
                put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(priceStandSalon))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the PriceStandSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdatePriceStandSalonWithPatch() throws Exception {
        // Initialize the database
        insertedPriceStandSalon = priceStandSalonRepository.saveAndFlush(priceStandSalon);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the priceStandSalon using partial update
        PriceStandSalon partialUpdatedPriceStandSalon = new PriceStandSalon();
        partialUpdatedPriceStandSalon.setId(priceStandSalon.getId());

        partialUpdatedPriceStandSalon.price(UPDATED_PRICE);

        restPriceStandSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPriceStandSalon.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPriceStandSalon))
            )
            .andExpect(status().isOk());

        // Validate the PriceStandSalon in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPriceStandSalonUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedPriceStandSalon, priceStandSalon),
            getPersistedPriceStandSalon(priceStandSalon)
        );
    }

    @Test
    @Transactional
    void fullUpdatePriceStandSalonWithPatch() throws Exception {
        // Initialize the database
        insertedPriceStandSalon = priceStandSalonRepository.saveAndFlush(priceStandSalon);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the priceStandSalon using partial update
        PriceStandSalon partialUpdatedPriceStandSalon = new PriceStandSalon();
        partialUpdatedPriceStandSalon.setId(priceStandSalon.getId());

        partialUpdatedPriceStandSalon.price(UPDATED_PRICE);

        restPriceStandSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPriceStandSalon.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPriceStandSalon))
            )
            .andExpect(status().isOk());

        // Validate the PriceStandSalon in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPriceStandSalonUpdatableFieldsEquals(
            partialUpdatedPriceStandSalon,
            getPersistedPriceStandSalon(partialUpdatedPriceStandSalon)
        );
    }

    @Test
    @Transactional
    void patchNonExistingPriceStandSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priceStandSalon.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPriceStandSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, priceStandSalon.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(priceStandSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the PriceStandSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchPriceStandSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priceStandSalon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPriceStandSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(priceStandSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the PriceStandSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamPriceStandSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priceStandSalon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPriceStandSalonMockMvc
            .perform(
                patch(ENTITY_API_URL)
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(priceStandSalon))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the PriceStandSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deletePriceStandSalon() throws Exception {
        // Initialize the database
        insertedPriceStandSalon = priceStandSalonRepository.saveAndFlush(priceStandSalon);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the priceStandSalon
        restPriceStandSalonMockMvc
            .perform(delete(ENTITY_API_URL_ID, priceStandSalon.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return priceStandSalonRepository.count();
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

    protected PriceStandSalon getPersistedPriceStandSalon(PriceStandSalon priceStandSalon) {
        return priceStandSalonRepository.findById(priceStandSalon.getId()).orElseThrow();
    }

    protected void assertPersistedPriceStandSalonToMatchAllProperties(PriceStandSalon expectedPriceStandSalon) {
        assertPriceStandSalonAllPropertiesEquals(expectedPriceStandSalon, getPersistedPriceStandSalon(expectedPriceStandSalon));
    }

    protected void assertPersistedPriceStandSalonToMatchUpdatableProperties(PriceStandSalon expectedPriceStandSalon) {
        assertPriceStandSalonAllUpdatablePropertiesEquals(expectedPriceStandSalon, getPersistedPriceStandSalon(expectedPriceStandSalon));
    }
}
