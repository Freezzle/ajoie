package ch.salon.web.rest;

import static ch.salon.service.PaymentService.ENTITY_NAME;

import ch.salon.domain.Payment;
import ch.salon.service.PaymentService;
import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/payments")
@Transactional
public class PaymentResource {

    private static final Logger log = LoggerFactory.getLogger(PaymentResource.class);

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final PaymentService paymentService;

    public PaymentResource(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("")
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody Payment payment) throws URISyntaxException {
        log.debug("REST request to save Payment : {}", payment);

        UUID id = paymentService.create(payment);

        return ResponseEntity.created(new URI("/api/payments/" + id))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(payment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Payment> updatePayment(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody Payment payment
    ) throws URISyntaxException {
        log.debug("REST request to update Payment : {}, {}", id, payment);

        payment = paymentService.update(id, payment);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, payment.getId().toString()))
            .body(payment);
    }

    @GetMapping("")
    public List<Payment> getAllPayments(@RequestParam(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all Payments");

        return paymentService.findAll(idParticipation);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPayment(@PathVariable("id") UUID id) {
        log.debug("REST request to get Payment : {}", id);

        return ResponseUtil.wrapOrNotFound(paymentService.get(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Payment : {}", id);

        paymentService.delete(id);

        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
