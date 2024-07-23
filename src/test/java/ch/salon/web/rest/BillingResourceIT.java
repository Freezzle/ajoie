package ch.salon.web.rest;

import static ch.salon.domain.BillingAsserts.*;
import static ch.salon.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import ch.salon.IntegrationTest;
import ch.salon.domain.Billing;
import ch.salon.repository.BillingRepository;
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
 * Integration tests for the {@link BillingResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class BillingResourceIT {

    private static final Boolean DEFAULT_ACCEPTED_CONTRACT = false;
    private static final Boolean UPDATED_ACCEPTED_CONTRACT = true;

    private static final Boolean DEFAULT_NEED_ARRANGMENT = false;
    private static final Boolean UPDATED_NEED_ARRANGMENT = true;

    private static final Boolean DEFAULT_IS_CLOSED = false;
    private static final Boolean UPDATED_IS_CLOSED = true;

    private static final String ENTITY_API_URL = "/api/billings";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private BillingRepository billingRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restBillingMockMvc;

    private Billing billing;

    private Billing insertedBilling;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Billing createEntity(EntityManager em) {
        Billing billing = new Billing()
            .acceptedContract(DEFAULT_ACCEPTED_CONTRACT)
            .needArrangment(DEFAULT_NEED_ARRANGMENT)
            .isClosed(DEFAULT_IS_CLOSED);
        return billing;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Billing createUpdatedEntity(EntityManager em) {
        Billing billing = new Billing()
            .acceptedContract(UPDATED_ACCEPTED_CONTRACT)
            .needArrangment(UPDATED_NEED_ARRANGMENT)
            .isClosed(UPDATED_IS_CLOSED);
        return billing;
    }

    @BeforeEach
    public void initTest() {
        billing = createEntity(em);
    }

    @AfterEach
    public void cleanup() {
        if (insertedBilling != null) {
            billingRepository.delete(insertedBilling);
            insertedBilling = null;
        }
    }

    @Test
    @Transactional
    void createBilling() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Billing
        var returnedBilling = om.readValue(
            restBillingMockMvc
                .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(billing)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            Billing.class
        );

        // Validate the Billing in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertBillingUpdatableFieldsEquals(returnedBilling, getPersistedBilling(returnedBilling));

        insertedBilling = returnedBilling;
    }

    @Test
    @Transactional
    void createBillingWithExistingId() throws Exception {
        // Create the Billing with an existing ID
        insertedBilling = billingRepository.saveAndFlush(billing);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restBillingMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(billing)))
            .andExpect(status().isBadRequest());

        // Validate the Billing in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void getAllBillings() throws Exception {
        // Initialize the database
        insertedBilling = billingRepository.saveAndFlush(billing);

        // Get all the billingList
        restBillingMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(billing.getId().toString())))
            .andExpect(jsonPath("$.[*].acceptedContract").value(hasItem(DEFAULT_ACCEPTED_CONTRACT.booleanValue())))
            .andExpect(jsonPath("$.[*].needArrangment").value(hasItem(DEFAULT_NEED_ARRANGMENT.booleanValue())))
            .andExpect(jsonPath("$.[*].isClosed").value(hasItem(DEFAULT_IS_CLOSED.booleanValue())));
    }

    @Test
    @Transactional
    void getBilling() throws Exception {
        // Initialize the database
        insertedBilling = billingRepository.saveAndFlush(billing);

        // Get the billing
        restBillingMockMvc
            .perform(get(ENTITY_API_URL_ID, billing.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(billing.getId().toString()))
            .andExpect(jsonPath("$.acceptedContract").value(DEFAULT_ACCEPTED_CONTRACT.booleanValue()))
            .andExpect(jsonPath("$.needArrangment").value(DEFAULT_NEED_ARRANGMENT.booleanValue()))
            .andExpect(jsonPath("$.isClosed").value(DEFAULT_IS_CLOSED.booleanValue()));
    }

    @Test
    @Transactional
    void getNonExistingBilling() throws Exception {
        // Get the billing
        restBillingMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingBilling() throws Exception {
        // Initialize the database
        insertedBilling = billingRepository.saveAndFlush(billing);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the billing
        Billing updatedBilling = billingRepository.findById(billing.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedBilling are not directly saved in db
        em.detach(updatedBilling);
        updatedBilling.acceptedContract(UPDATED_ACCEPTED_CONTRACT).needArrangment(UPDATED_NEED_ARRANGMENT).isClosed(UPDATED_IS_CLOSED);

        restBillingMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedBilling.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedBilling))
            )
            .andExpect(status().isOk());

        // Validate the Billing in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedBillingToMatchAllProperties(updatedBilling);
    }

    @Test
    @Transactional
    void putNonExistingBilling() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        billing.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restBillingMockMvc
            .perform(
                put(ENTITY_API_URL_ID, billing.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(billing))
            )
            .andExpect(status().isBadRequest());

        // Validate the Billing in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchBilling() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        billing.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restBillingMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(billing))
            )
            .andExpect(status().isBadRequest());

        // Validate the Billing in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamBilling() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        billing.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restBillingMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(billing)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Billing in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateBillingWithPatch() throws Exception {
        // Initialize the database
        insertedBilling = billingRepository.saveAndFlush(billing);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the billing using partial update
        Billing partialUpdatedBilling = new Billing();
        partialUpdatedBilling.setId(billing.getId());

        partialUpdatedBilling.needArrangment(UPDATED_NEED_ARRANGMENT).isClosed(UPDATED_IS_CLOSED);

        restBillingMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedBilling.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedBilling))
            )
            .andExpect(status().isOk());

        // Validate the Billing in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertBillingUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedBilling, billing), getPersistedBilling(billing));
    }

    @Test
    @Transactional
    void fullUpdateBillingWithPatch() throws Exception {
        // Initialize the database
        insertedBilling = billingRepository.saveAndFlush(billing);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the billing using partial update
        Billing partialUpdatedBilling = new Billing();
        partialUpdatedBilling.setId(billing.getId());

        partialUpdatedBilling
            .acceptedContract(UPDATED_ACCEPTED_CONTRACT)
            .needArrangment(UPDATED_NEED_ARRANGMENT)
            .isClosed(UPDATED_IS_CLOSED);

        restBillingMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedBilling.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedBilling))
            )
            .andExpect(status().isOk());

        // Validate the Billing in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertBillingUpdatableFieldsEquals(partialUpdatedBilling, getPersistedBilling(partialUpdatedBilling));
    }

    @Test
    @Transactional
    void patchNonExistingBilling() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        billing.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restBillingMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, billing.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(billing))
            )
            .andExpect(status().isBadRequest());

        // Validate the Billing in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchBilling() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        billing.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restBillingMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(billing))
            )
            .andExpect(status().isBadRequest());

        // Validate the Billing in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamBilling() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        billing.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restBillingMockMvc
            .perform(patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(billing)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Billing in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteBilling() throws Exception {
        // Initialize the database
        insertedBilling = billingRepository.saveAndFlush(billing);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the billing
        restBillingMockMvc
            .perform(delete(ENTITY_API_URL_ID, billing.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return billingRepository.count();
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

    protected Billing getPersistedBilling(Billing billing) {
        return billingRepository.findById(billing.getId()).orElseThrow();
    }

    protected void assertPersistedBillingToMatchAllProperties(Billing expectedBilling) {
        assertBillingAllPropertiesEquals(expectedBilling, getPersistedBilling(expectedBilling));
    }

    protected void assertPersistedBillingToMatchUpdatableProperties(Billing expectedBilling) {
        assertBillingAllUpdatablePropertiesEquals(expectedBilling, getPersistedBilling(expectedBilling));
    }
}
