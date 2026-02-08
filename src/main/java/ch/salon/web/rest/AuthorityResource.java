package ch.salon.web.rest;

import ch.salon.domain.Authority;
import ch.salon.repository.AuthorityRepository;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.utils.ResourceUtil;
import ch.salon.utils.ResponseUtil;
import ch.salon.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/authorities")
@Transactional
public class AuthorityResource {

    private static final Logger log = LoggerFactory.getLogger(AuthorityResource.class);

    private static final String ENTITY_NAME = "authority";
    private final AuthorityRepository authorityRepository;

    public AuthorityResource(AuthorityRepository authorityRepository) {
        this.authorityRepository = authorityRepository;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Authority> createAuthority(@Valid @RequestBody Authority authority) {
        log.debug("REST request to save Authority : {}", authority);

        if (authorityRepository.existsById(authority.getName())) {
            throw new BadRequestAlertException("authority already exists", ENTITY_NAME, "id.exists");
        }

        authority = authorityRepository.save(authority);
        return ResourceUtil.created(ENTITY_NAME, authority.getName(), "/api/authorities").body(authority);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<Authority> getAllAuthorities() {
        log.debug("REST request to get all Authorities");

        return authorityRepository.findAll();
    }

    @GetMapping("/{idAuthority}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Authority> getAuthority(@PathVariable("idAuthority") String idAuthority) {
        log.debug("REST request to get Authority : {}", idAuthority);

        return ResponseUtil.wrapOrNotFound(authorityRepository.findById(idAuthority));
    }

    @DeleteMapping("/{idAuthority}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteAuthority(@PathVariable("idAuthority") String idAuthority) {
        log.debug("REST request to delete Authority : {}", idAuthority);

        authorityRepository.deleteById(idAuthority);

        return ResourceUtil.deleted(ENTITY_NAME, idAuthority).build();
    }
}
