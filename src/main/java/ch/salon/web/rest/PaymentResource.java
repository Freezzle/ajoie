package ch.salon.web.rest;

import static ch.salon.service.PaymentService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.PaymentService;
import ch.salon.service.dto.PaymentDTO;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/payments")
@Transactional
public class PaymentResource {

    private static final Logger log = LoggerFactory.getLogger(PaymentResource.class);
    private final PaymentService paymentService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public PaymentResource(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<PaymentDTO> createPayment(@Valid @RequestBody PaymentDTO payment) throws URISyntaxException {
        log.debug("REST request to save Payment : {}", payment);

        UUID id = paymentService.create(payment);

        return created(new URI("/api/payments/" + id))
            .headers(createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(payment);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<PaymentDTO> updatePayment(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody PaymentDTO payment
    ) {
        log.debug("REST request to update Payment : {}, {}", id, payment);

        payment = paymentService.update(id, payment);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, payment.getId().toString())).body(payment);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<PaymentDTO> getAllPayments(@RequestParam(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all Payments");

        return paymentService.findAll(idParticipation);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<PaymentDTO> getPayment(@PathVariable("id") UUID id) {
        log.debug("REST request to get Payment : {}", id);

        return ResponseUtil.wrapOrNotFound(paymentService.get(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deletePayment(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Payment : {}", id);

        paymentService.delete(id);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString())).build();
    }
}
