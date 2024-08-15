package ch.salon.web.rest;

import static org.springframework.http.ResponseEntity.created;
import static org.springframework.http.ResponseEntity.noContent;
import static tech.jhipster.web.util.HeaderUtil.createEntityCreationAlert;
import static tech.jhipster.web.util.HeaderUtil.createEntityDeletionAlert;

import ch.salon.domain.Authority;
import ch.salon.repository.AuthorityRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/authorities")
@Transactional
public class AuthorityResource {

    private static final Logger log = LoggerFactory.getLogger(AuthorityResource.class);

    private static final String ENTITY_NAME = "adminAuthority";
    private final AuthorityRepository authorityRepository;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public AuthorityResource(AuthorityRepository authorityRepository) {
        this.authorityRepository = authorityRepository;
    }

    @PostMapping("")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<Authority> createAuthority(@Valid @RequestBody Authority authority) throws URISyntaxException {
        log.debug("REST request to save Authority : {}", authority);

        if (authorityRepository.existsById(authority.getName())) {
            throw new BadRequestAlertException("authority already exists", ENTITY_NAME, "idexists");
        }

        authority = authorityRepository.save(authority);
        return created(new URI("/api/authorities/" + authority.getName()))
            .headers(createEntityCreationAlert(applicationName, true, ENTITY_NAME, authority.getName()))
            .body(authority);
    }

    @GetMapping("")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public List<Authority> getAllAuthorities() {
        log.debug("REST request to get all Authorities");

        return authorityRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<Authority> getAuthority(@PathVariable("id") String id) {
        log.debug("REST request to get Authority : {}", id);

        return ResponseUtil.wrapOrNotFound(authorityRepository.findById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteAuthority(@PathVariable("id") String id) {
        log.debug("REST request to delete Authority : {}", id);

        authorityRepository.deleteById(id);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id)).build();
    }
}
