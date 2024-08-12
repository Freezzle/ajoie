package ch.salon.web.rest;

import ch.salon.domain.Conference;
import ch.salon.domain.DimensionStand;
import ch.salon.domain.Exponent;
import ch.salon.domain.Invoice;
import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.DimensionStandRepository;
import ch.salon.repository.ExponentRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.SalonImportDataService;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
