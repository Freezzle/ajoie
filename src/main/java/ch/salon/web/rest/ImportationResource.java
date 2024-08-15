package ch.salon.web.rest;

import ch.salon.domain.Invoice;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.SalonImportDataService;
import java.net.URI;
import java.net.URISyntaxException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing {@link Invoice}.
 */
@RestController
@RequestMapping("/api/importation")
@Transactional
public class ImportationResource {

    private final SalonImportDataService salonImportDataService;

    public ImportationResource(SalonImportDataService salonImportDataService) {
        this.salonImportDataService = salonImportDataService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> importation(@RequestParam(name = "idSalon", required = false) String idSalon) throws URISyntaxException {
        salonImportDataService.importData(idSalon);

        return ResponseEntity.created(new URI("/api/importation")).build();
    }
}
