package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.DimensionStandService;
import ch.salon.service.dto.DimensionStandDTO;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<DimensionStandDTO> getAllDimensionStands() {
        log.debug("REST request to get all DimensionStands");

        return dimensionStandService.findAll();
    }
}
