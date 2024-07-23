package ch.salon.web.rest;

import static ch.salon.domain.ExponentAsserts.*;
import static ch.salon.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import ch.salon.IntegrationTest;
import ch.salon.domain.Exponent;
import ch.salon.repository.ExponentRepository;
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
 * Integration tests for the {@link ExponentResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class ExponentResourceIT {

    private static final String DEFAULT_EMAIL = "AAAAAAAAAA";
    private static final String UPDATED_EMAIL = "BBBBBBBBBB";

    private static final String DEFAULT_FULL_NAME = "AAAAAAAAAA";
    private static final String UPDATED_FULL_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_PHONE_NUMBER = "AAAAAAAAAA";
    private static final String UPDATED_PHONE_NUMBER = "BBBBBBBBBB";

    private static final String DEFAULT_WEBSITE = "AAAAAAAAAA";
    private static final String UPDATED_WEBSITE = "BBBBBBBBBB";

    private static final String DEFAULT_SOCIAL_MEDIA = "AAAAAAAAAA";
    private static final String UPDATED_SOCIAL_MEDIA = "BBBBBBBBBB";

    private static final String DEFAULT_ADDRESS = "AAAAAAAAAA";
    private static final String UPDATED_ADDRESS = "BBBBBBBBBB";

    private static final String DEFAULT_NPA_LOCALITE = "AAAAAAAAAA";
    private static final String UPDATED_NPA_LOCALITE = "BBBBBBBBBB";

    private static final String DEFAULT_URL_PICTURE = "AAAAAAAAAA";
    private static final String UPDATED_URL_PICTURE = "BBBBBBBBBB";

    private static final String DEFAULT_COMMENT = "AAAAAAAAAA";
    private static final String UPDATED_COMMENT = "BBBBBBBBBB";

    private static final Boolean DEFAULT_BLOCKED = false;
    private static final Boolean UPDATED_BLOCKED = true;

    private static final String ENTITY_API_URL = "/api/exponents";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ExponentRepository exponentRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restExponentMockMvc;

    private Exponent exponent;

    private Exponent insertedExponent;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Exponent createEntity(EntityManager em) {
        Exponent exponent = new Exponent()
            .email(DEFAULT_EMAIL)
            .fullName(DEFAULT_FULL_NAME)
            .phoneNumber(DEFAULT_PHONE_NUMBER)
            .website(DEFAULT_WEBSITE)
            .socialMedia(DEFAULT_SOCIAL_MEDIA)
            .address(DEFAULT_ADDRESS)
            .npaLocalite(DEFAULT_NPA_LOCALITE)
            .urlPicture(DEFAULT_URL_PICTURE)
            .comment(DEFAULT_COMMENT)
            .blocked(DEFAULT_BLOCKED);
        return exponent;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Exponent createUpdatedEntity(EntityManager em) {
        Exponent exponent = new Exponent()
            .email(UPDATED_EMAIL)
            .fullName(UPDATED_FULL_NAME)
            .phoneNumber(UPDATED_PHONE_NUMBER)
            .website(UPDATED_WEBSITE)
            .socialMedia(UPDATED_SOCIAL_MEDIA)
            .address(UPDATED_ADDRESS)
            .npaLocalite(UPDATED_NPA_LOCALITE)
            .urlPicture(UPDATED_URL_PICTURE)
            .comment(UPDATED_COMMENT)
            .blocked(UPDATED_BLOCKED);
        return exponent;
    }

    @BeforeEach
    public void initTest() {
        exponent = createEntity(em);
    }

    @AfterEach
    public void cleanup() {
        if (insertedExponent != null) {
            exponentRepository.delete(insertedExponent);
            insertedExponent = null;
        }
    }

    @Test
    @Transactional
    void createExponent() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Exponent
        var returnedExponent = om.readValue(
            restExponentMockMvc
                .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(exponent)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            Exponent.class
        );

        // Validate the Exponent in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertExponentUpdatableFieldsEquals(returnedExponent, getPersistedExponent(returnedExponent));

        insertedExponent = returnedExponent;
    }

    @Test
    @Transactional
    void createExponentWithExistingId() throws Exception {
        // Create the Exponent with an existing ID
        insertedExponent = exponentRepository.saveAndFlush(exponent);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restExponentMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(exponent)))
            .andExpect(status().isBadRequest());

        // Validate the Exponent in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void getAllExponents() throws Exception {
        // Initialize the database
        insertedExponent = exponentRepository.saveAndFlush(exponent);

        // Get all the exponentList
        restExponentMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(exponent.getId().toString())))
            .andExpect(jsonPath("$.[*].email").value(hasItem(DEFAULT_EMAIL)))
            .andExpect(jsonPath("$.[*].fullName").value(hasItem(DEFAULT_FULL_NAME)))
            .andExpect(jsonPath("$.[*].phoneNumber").value(hasItem(DEFAULT_PHONE_NUMBER)))
            .andExpect(jsonPath("$.[*].website").value(hasItem(DEFAULT_WEBSITE)))
            .andExpect(jsonPath("$.[*].socialMedia").value(hasItem(DEFAULT_SOCIAL_MEDIA)))
            .andExpect(jsonPath("$.[*].address").value(hasItem(DEFAULT_ADDRESS)))
            .andExpect(jsonPath("$.[*].npaLocalite").value(hasItem(DEFAULT_NPA_LOCALITE)))
            .andExpect(jsonPath("$.[*].urlPicture").value(hasItem(DEFAULT_URL_PICTURE)))
            .andExpect(jsonPath("$.[*].comment").value(hasItem(DEFAULT_COMMENT)))
            .andExpect(jsonPath("$.[*].blocked").value(hasItem(DEFAULT_BLOCKED.booleanValue())));
    }

    @Test
    @Transactional
    void getExponent() throws Exception {
        // Initialize the database
        insertedExponent = exponentRepository.saveAndFlush(exponent);

        // Get the exponent
        restExponentMockMvc
            .perform(get(ENTITY_API_URL_ID, exponent.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(exponent.getId().toString()))
            .andExpect(jsonPath("$.email").value(DEFAULT_EMAIL))
            .andExpect(jsonPath("$.fullName").value(DEFAULT_FULL_NAME))
            .andExpect(jsonPath("$.phoneNumber").value(DEFAULT_PHONE_NUMBER))
            .andExpect(jsonPath("$.website").value(DEFAULT_WEBSITE))
            .andExpect(jsonPath("$.socialMedia").value(DEFAULT_SOCIAL_MEDIA))
            .andExpect(jsonPath("$.address").value(DEFAULT_ADDRESS))
            .andExpect(jsonPath("$.npaLocalite").value(DEFAULT_NPA_LOCALITE))
            .andExpect(jsonPath("$.urlPicture").value(DEFAULT_URL_PICTURE))
            .andExpect(jsonPath("$.comment").value(DEFAULT_COMMENT))
            .andExpect(jsonPath("$.blocked").value(DEFAULT_BLOCKED.booleanValue()));
    }

    @Test
    @Transactional
    void getNonExistingExponent() throws Exception {
        // Get the exponent
        restExponentMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingExponent() throws Exception {
        // Initialize the database
        insertedExponent = exponentRepository.saveAndFlush(exponent);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the exponent
        Exponent updatedExponent = exponentRepository.findById(exponent.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedExponent are not directly saved in db
        em.detach(updatedExponent);
        updatedExponent
            .email(UPDATED_EMAIL)
            .fullName(UPDATED_FULL_NAME)
            .phoneNumber(UPDATED_PHONE_NUMBER)
            .website(UPDATED_WEBSITE)
            .socialMedia(UPDATED_SOCIAL_MEDIA)
            .address(UPDATED_ADDRESS)
            .npaLocalite(UPDATED_NPA_LOCALITE)
            .urlPicture(UPDATED_URL_PICTURE)
            .comment(UPDATED_COMMENT)
            .blocked(UPDATED_BLOCKED);

        restExponentMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedExponent.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedExponent))
            )
            .andExpect(status().isOk());

        // Validate the Exponent in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedExponentToMatchAllProperties(updatedExponent);
    }

    @Test
    @Transactional
    void putNonExistingExponent() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        exponent.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restExponentMockMvc
            .perform(
                put(ENTITY_API_URL_ID, exponent.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(exponent))
            )
            .andExpect(status().isBadRequest());

        // Validate the Exponent in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchExponent() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        exponent.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExponentMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(exponent))
            )
            .andExpect(status().isBadRequest());

        // Validate the Exponent in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamExponent() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        exponent.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExponentMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(exponent)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Exponent in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateExponentWithPatch() throws Exception {
        // Initialize the database
        insertedExponent = exponentRepository.saveAndFlush(exponent);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the exponent using partial update
        Exponent partialUpdatedExponent = new Exponent();
        partialUpdatedExponent.setId(exponent.getId());

        partialUpdatedExponent
            .email(UPDATED_EMAIL)
            .fullName(UPDATED_FULL_NAME)
            .website(UPDATED_WEBSITE)
            .npaLocalite(UPDATED_NPA_LOCALITE)
            .urlPicture(UPDATED_URL_PICTURE)
            .comment(UPDATED_COMMENT)
            .blocked(UPDATED_BLOCKED);

        restExponentMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedExponent.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedExponent))
            )
            .andExpect(status().isOk());

        // Validate the Exponent in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertExponentUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedExponent, exponent), getPersistedExponent(exponent));
    }

    @Test
    @Transactional
    void fullUpdateExponentWithPatch() throws Exception {
        // Initialize the database
        insertedExponent = exponentRepository.saveAndFlush(exponent);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the exponent using partial update
        Exponent partialUpdatedExponent = new Exponent();
        partialUpdatedExponent.setId(exponent.getId());

        partialUpdatedExponent
            .email(UPDATED_EMAIL)
            .fullName(UPDATED_FULL_NAME)
            .phoneNumber(UPDATED_PHONE_NUMBER)
            .website(UPDATED_WEBSITE)
            .socialMedia(UPDATED_SOCIAL_MEDIA)
            .address(UPDATED_ADDRESS)
            .npaLocalite(UPDATED_NPA_LOCALITE)
            .urlPicture(UPDATED_URL_PICTURE)
            .comment(UPDATED_COMMENT)
            .blocked(UPDATED_BLOCKED);

        restExponentMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedExponent.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedExponent))
            )
            .andExpect(status().isOk());

        // Validate the Exponent in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertExponentUpdatableFieldsEquals(partialUpdatedExponent, getPersistedExponent(partialUpdatedExponent));
    }

    @Test
    @Transactional
    void patchNonExistingExponent() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        exponent.setId(UUID.randomUUID());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restExponentMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, exponent.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(exponent))
            )
            .andExpect(status().isBadRequest());

        // Validate the Exponent in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchExponent() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        exponent.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExponentMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(exponent))
            )
            .andExpect(status().isBadRequest());

        // Validate the Exponent in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamExponent() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        exponent.setId(UUID.randomUUID());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExponentMockMvc
            .perform(patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(exponent)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Exponent in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteExponent() throws Exception {
        // Initialize the database
        insertedExponent = exponentRepository.saveAndFlush(exponent);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the exponent
        restExponentMockMvc
            .perform(delete(ENTITY_API_URL_ID, exponent.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return exponentRepository.count();
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

    protected Exponent getPersistedExponent(Exponent exponent) {
        return exponentRepository.findById(exponent.getId()).orElseThrow();
    }

    protected void assertPersistedExponentToMatchAllProperties(Exponent expectedExponent) {
        assertExponentAllPropertiesEquals(expectedExponent, getPersistedExponent(expectedExponent));
    }

    protected void assertPersistedExponentToMatchUpdatableProperties(Exponent expectedExponent) {
        assertExponentAllUpdatablePropertiesEquals(expectedExponent, getPersistedExponent(expectedExponent));
    }
}
