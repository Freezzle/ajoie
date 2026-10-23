package ch.salon.web.rest;

import ch.salon.domain.StandPicture;
import ch.salon.domain.enumeration.StandPictureType;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.StandPictureService;
import ch.salon.service.StandService;
import ch.salon.service.dto.StandDTO;
import ch.salon.utils.ResourceUtil;
import ch.salon.utils.ResponseUtil;
import ch.salon.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static ch.salon.service.StandService.ENTITY_NAME;

@RestController
@RequestMapping("/api/admin/stands")
@Transactional
public class AdminStandResource {

    private static final Logger log = LoggerFactory.getLogger(AdminStandResource.class);
    private final StandService standService;
    private final StandPictureService standPictureService;


    public AdminStandResource(StandService standService, StandPictureService standPictureService) {
        this.standService = standService;
        this.standPictureService = standPictureService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<StandDTO> createStand(@Valid @RequestBody StandDTO stand) {
        log.debug("REST request to save Stand : {}", stand);

        UUID id = standService.create(stand);

        // On ne renvoie jamais la charge utile base64 reçue.
        stand.setPictureUpload(null);
        stand.setSharedPictureUpload(null);

        return ResourceUtil.created(ENTITY_NAME, id, "/api/admin/stands").body(stand);
    }

    @PutMapping("/{idStand}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<StandDTO> updateStand(@PathVariable(value = "idStand", required = false) final UUID idStand,
                                                @Valid @RequestBody StandDTO stand) {
        log.debug("REST request to update Stand : {}, {}", idStand, stand);

        stand = standService.update(idStand, stand);

        return ResourceUtil.updated(ENTITY_NAME, stand.getId()).body(stand);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<StandDTO> getAllStands(@RequestParam(name = "idSalon", required = false) UUID idSalon,
                                       @RequestParam(name = "idParticipation", required = false) UUID idParticipation) {
        log.debug("REST request to get all Stands");

        return standService.findAll(idSalon, idParticipation);
    }

    @GetMapping("/{idStand}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<StandDTO> getStand(@PathVariable("idStand") UUID idStand) {
        log.debug("REST request to get Stand : {}", idStand);

        return ResponseUtil.wrapOrNotFound(standService.get(idStand));
    }

    /**
     * Sert les octets de l'image d'un stand ({@code MAIN} ou {@code SHARED}).
     * <p>
     * Le contenu a déjà été re-validé et ré-encodé à l'upload : on peut le servir avec son vrai
     * type MIME, en interdisant tout de même le sniffing du navigateur.
     */
    @GetMapping("/{idStand}/pictures/{type}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<byte[]> getStandPicture(@PathVariable("idStand") UUID idStand,
                                                  @PathVariable("type") String type,
                                                  @RequestParam(name = "download", defaultValue = "false") boolean download,
                                                  @RequestHeader(name = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch) {
        log.debug("REST request to get picture {} of Stand : {}", type, idStand);

        StandPicture picture = standPictureService.getPicture(idStand, parsePictureType(type))
                                                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        String etag = "\"" + picture.getChecksum() + "\"";
        if (etag.equals(StringUtils.trimToNull(ifNoneMatch))) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }

        ContentDisposition disposition = (download ? ContentDisposition.attachment()
                                                   : ContentDisposition.inline())
                .filename(picture.getFilename(), StandardCharsets.UTF_8).build();

        return ResponseEntity.ok()
                             .eTag(etag)
                             .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                             .contentType(MediaType.parseMediaType(picture.getContentType()))
                             .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                             .header("X-Content-Type-Options", "nosniff")
                             .body(picture.getData());
    }

    private StandPictureType parsePictureType(String type) {
        try {
            return StandPictureType.valueOf(StringUtils.upperCase(type, Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestAlertException("Type d'image inconnu", ENTITY_NAME, "image.invalid-type");
        }
    }

    @DeleteMapping("/{idStand}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteStand(@PathVariable("idStand") UUID idStand) {
        log.debug("REST request to delete Stand : {}", idStand);

        standService.delete(idStand);

        return ResourceUtil.deleted(ENTITY_NAME, idStand).build();
    }
}
