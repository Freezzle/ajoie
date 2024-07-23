package ch.salon.web.rest;

import static ch.salon.domain.ConfigurationSalonAsserts.*;
import static ch.salon.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import ch.salon.IntegrationTest;
import ch.salon.domain.ConfigurationSalon;
import ch.salon.repository.ConfigurationSalonRepository;
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
 * Integration tests for the {@link ConfigurationSalonResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class ConfigurationSalonResourceIT {

    private static final Long DEFAULT_PRICE_MEAL_1 = 1L;
    private static final Long UPDATED_PRICE_MEAL_1 = 2L;

    private static final Long DEFAULT_PRICE_MEAL_2 = 1L;
    private static final Long UPDATED_PRICE_MEAL_2 = 2L;

    private static final Long DEFAULT_PRICE_MEAL_3 = 1L;
    private static final Long UPDATED_PRICE_MEAL_3 = 2L;

    private static final Long DEFAULT_PRICE_CONFERENCE = 1L;
    private static final Long UPDATED_PRICE_CONFERENCE = 2L;

    private static final Long DEFAULT_PRICE_SHARING_STAND = 1L;
    private static final Long UPDATED_PRICE_SHARING_STAND = 2L;

    private static final String ENTITY_API_URL = "/api/configuration-salons";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ConfigurationSalonRepository configurationSalonRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restConfigurationSalonMockMvc;

    private ConfigurationSalon configurationSalon;

    private ConfigurationSalon insertedConfigurationSalon;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static ConfigurationSalon createEntity(EntityManager em) {
        ConfigurationSalon configurationSalon = new ConfigurationSalon()
            .priceMeal1(DEFAULT_PRICE_MEAL_1)
            .priceMeal2(DEFAULT_PRICE_MEAL_2)
            .priceMeal3(DEFAULT_PRICE_MEAL_3)
            .priceConference(DEFAULT_PRICE_CONFERENCE)
            .priceSharingStand(DEFAULT_PRICE_SHARING_STAND);
        return configurationSalon;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static ConfigurationSalon createUpdatedEntity(EntityManager em) {
        ConfigurationSalon configurationSalon = new ConfigurationSalon()
            .priceMeal1(UPDATED_PRICE_MEAL_1)
            .priceMeal2(UPDATED_PRICE_MEAL_2)
            .priceMeal3(UPDATED_PRICE_MEAL_3)
            .priceConference(UPDATED_PRICE_CONFERENCE)
            .priceSharingStand(UPDATED_PRICE_SHARING_STAND);
        return configurationSalon;
    }

    @BeforeEach
    public void initTest() {
        configurationSalon = createEntity(em);
    }

    @AfterEach
    public void cleanup() {
        if (insertedConfigurationSalon != null) {
            configurationSalonRepository.delete(insertedConfigurationSalon);
            insertedConfigurationSalon = null;
        }
    }

    @Test
    @Transactional
    void createConfigurationSalon() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the ConfigurationSalon
        var returnedConfigurationSalon = om.readValue(
            restConfigurationSalonMockMvc
                .perform(
                    post(ENTITY_API_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsBytes(configurationSalon))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ConfigurationSalon.class
        );

        // Validate the ConfigurationSalon in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertConfigurationSalonUpdatableFieldsEquals(
            returnedConfigurationSalon,
            getPersistedConfigurationSalon(returnedConfigurationSalon)
        );

        insertedConfigurationSalon = returnedConfigurationSalon;
    }

    @Test
    @Transactional
    void createConfigurationSalonWithExistingId() throws Exception {
        // Create the ConfigurationSalon with an existing ID
        insertedConfigurationSalon = configurationSalonRepository.saveAndFlush(configurationSalon);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restConfigurationSalonMockMvc
            .perform(
                post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(configurationSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the ConfigurationSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void getAllConfigurationSalons() throws Exception {
        // Initialize the database
        insertedConfigurationSalon = configurationSalonRepository.saveAndFlush(configurationSalon);

        // Get all the configurationSalonList
        restConfigurationSalonMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(configurationSalon.getId().toString())))
            .andExpect(jsonPath("$.[*].priceMeal1").value(hasItem(DEFAULT_PRICE_MEAL_1.intValue())))
            .andExpect(jsonPath("$.[*].priceMeal2").value(hasItem(DEFAULT_PRICE_MEAL_2.intValue())))
            .andExpect(jsonPath("$.[*].priceMeal3").value(hasItem(DEFAULT_PRICE_MEAL_3.intValue())))
            .andExpect(jsonPath("$.[*].priceConference").value(hasItem(DEFAULT_PRICE_CONFERENCE.intValue())))
            .andExpect(jsonPath("$.[*].priceSharingStand").value(hasItem(DEFAULT_PRICE_SHARING_STAND.intValue())));
    }

    @Test
    @Transactional
    void getConfigurationSalon() throws Exception {
        // Initialize the database
        insertedConfigurationSalon = configurationSalonRepository.saveAndFlush(configurationSalon);

        // Get the configurationSalon
        restConfigurationSalonMockMvc
            .perform(get(ENTITY_API_URL_ID, configurationSalon.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(configurationSalon.getId().toString()))
            .andExpect(jsonPath("$.priceMeal1").value(DEFAULT_PRICE_MEAL_1.intValue()))
            .andExpect(jsonPath("$.priceMeal2").value(DEFAULT_PRICE_MEAL_2.intValue()))
            .andExpect(jsonPath("$.priceMeal3").value(DEFAULT_PRICE_MEAL_3.intValue()))
            .andExpect(jsonPath("$.priceConference").value(DEFAULT_PRICE_CONFERENCE.intValue()))
            .andExpect(jsonPath("$.priceSharingStand").value(DEFAULT_PRICE_SHARING_STAND.intValue()));
    }

    @Test
    @Transactional
    void getNonExistingConfigurationSalon() throws Exception {
        // Get the configurationSalon
        restConfigurationSalonMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingConfigurationSalon() throws Exception {
        // Initialize the database
        insertedConfigurationSalon = configurationSalonRepository.saveAndFlush(configurationSalon);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the configurationSalon
        ConfigurationSalon updatedConfigurationSalon = configurationSalonRepository.findById(configurationSalon.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedConfigurationSalon are not directly saved in db
        em.detach(updatedConfigurationSalon);
        updatedConfigurationSalon
            .priceMeal1(UPDATED_PRICE_MEAL_1)
            .priceMeal2(UPDATED_PRICE_MEAL_2)
            .priceMeal3(UPDATED_PRICE_MEAL_3)
            .priceConference(UPDATED_PRICE_CONFERENCE)
            .priceSharingStand(UPDATED_PRICE_SHARING_STAND);

        restConfigurationSalonMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedConfigurationSalon.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedConfigurationSalon))
            )
            .andExpect(status().isOk());

        // Validate the ConfigurationSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedConfigurationSalonToMatchAllProperties(updatedConfigurationSalon);
    }

    @Test
    @Transactional
    void putNonExistingConfigurationSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        configurationSalon.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restConfigurationSalonMockMvc
            .perform(
                put(ENTITY_API_URL_ID, configurationSalon.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(configurationSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the ConfigurationSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchConfigurationSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        configurationSalon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restConfigurationSalonMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(configurationSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the ConfigurationSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamConfigurationSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        configurationSalon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restConfigurationSalonMockMvc
            .perform(
                put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(configurationSalon))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the ConfigurationSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateConfigurationSalonWithPatch() throws Exception {
        // Initialize the database
        insertedConfigurationSalon = configurationSalonRepository.saveAndFlush(configurationSalon);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the configurationSalon using partial update
        ConfigurationSalon partialUpdatedConfigurationSalon = new ConfigurationSalon();
        partialUpdatedConfigurationSalon.setId(configurationSalon.getId());

        partialUpdatedConfigurationSalon
            .priceMeal1(UPDATED_PRICE_MEAL_1)
            .priceMeal2(UPDATED_PRICE_MEAL_2)
            .priceMeal3(UPDATED_PRICE_MEAL_3)
            .priceConference(UPDATED_PRICE_CONFERENCE);

        restConfigurationSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedConfigurationSalon.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedConfigurationSalon))
            )
            .andExpect(status().isOk());

        // Validate the ConfigurationSalon in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertConfigurationSalonUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedConfigurationSalon, configurationSalon),
            getPersistedConfigurationSalon(configurationSalon)
        );
    }

    @Test
    @Transactional
    void fullUpdateConfigurationSalonWithPatch() throws Exception {
        // Initialize the database
        insertedConfigurationSalon = configurationSalonRepository.saveAndFlush(configurationSalon);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the configurationSalon using partial update
        ConfigurationSalon partialUpdatedConfigurationSalon = new ConfigurationSalon();
        partialUpdatedConfigurationSalon.setId(configurationSalon.getId());

        partialUpdatedConfigurationSalon
            .priceMeal1(UPDATED_PRICE_MEAL_1)
            .priceMeal2(UPDATED_PRICE_MEAL_2)
            .priceMeal3(UPDATED_PRICE_MEAL_3)
            .priceConference(UPDATED_PRICE_CONFERENCE)
            .priceSharingStand(UPDATED_PRICE_SHARING_STAND);

        restConfigurationSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedConfigurationSalon.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedConfigurationSalon))
            )
            .andExpect(status().isOk());

        // Validate the ConfigurationSalon in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertConfigurationSalonUpdatableFieldsEquals(
            partialUpdatedConfigurationSalon,
            getPersistedConfigurationSalon(partialUpdatedConfigurationSalon)
        );
    }

    @Test
    @Transactional
    void patchNonExistingConfigurationSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        configurationSalon.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restConfigurationSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, configurationSalon.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(configurationSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the ConfigurationSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchConfigurationSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        configurationSalon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restConfigurationSalonMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(configurationSalon))
            )
            .andExpect(status().isBadRequest());

        // Validate the ConfigurationSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamConfigurationSalon() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        configurationSalon.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restConfigurationSalonMockMvc
            .perform(
                patch(ENTITY_API_URL)
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(configurationSalon))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the ConfigurationSalon in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteConfigurationSalon() throws Exception {
        // Initialize the database
        insertedConfigurationSalon = configurationSalonRepository.saveAndFlush(configurationSalon);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the configurationSalon
        restConfigurationSalonMockMvc
            .perform(delete(ENTITY_API_URL_ID, configurationSalon.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return configurationSalonRepository.count();
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

    protected ConfigurationSalon getPersistedConfigurationSalon(ConfigurationSalon configurationSalon) {
        return configurationSalonRepository.findById(configurationSalon.getId()).orElseThrow();
    }

    protected void assertPersistedConfigurationSalonToMatchAllProperties(ConfigurationSalon expectedConfigurationSalon) {
        assertConfigurationSalonAllPropertiesEquals(expectedConfigurationSalon, getPersistedConfigurationSalon(expectedConfigurationSalon));
    }

    protected void assertPersistedConfigurationSalonToMatchUpdatableProperties(ConfigurationSalon expectedConfigurationSalon) {
        assertConfigurationSalonAllUpdatablePropertiesEquals(
            expectedConfigurationSalon,
            getPersistedConfigurationSalon(expectedConfigurationSalon)
        );
    }
}
