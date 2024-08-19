package ch.salon.web.rest;

import static ch.salon.service.DimensionStandService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.DimensionStandService;
import ch.salon.service.dto.DimensionStandDTO;
import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/dimension-stands")
@Transactional
public class DimensionStandResource {

    private static final Logger log = LoggerFactory.getLogger(DimensionStandResource.class);
    private final DimensionStandService dimensionStandService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public DimensionStandResource(DimensionStandService dimensionStandService) {
        this.dimensionStandService = dimensionStandService;
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<DimensionStandDTO> getAllDimensionStands() {
        log.debug("REST request to get all DimensionStands");

        return dimensionStandService.findAll();
    }
}
