package ch.salon.web.rest;

import ch.salon.domain.Payment;
import ch.salon.repository.PaymentRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link ch.salon.domain.Payment}.
 */
@RestController
@RequestMapping("/api/payments")
@Transactional
public class PaymentResource {

    private static final Logger log = LoggerFactory.getLogger(PaymentResource.class);

    private static final String ENTITY_NAME = "payment";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final PaymentRepository paymentRepository;

    public PaymentResource(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    /**
     * {@code POST  /payments} : Create a new payment.
     *
     * @param payment the payment to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new payment, or with status {@code 400 (Bad Request)} if the payment has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody Payment payment) throws URISyntaxException {
        log.debug("REST request to save Payment : {}", payment);
        if (payment.getId() != null) {
            throw new BadRequestAlertException("A new payment cannot already have an ID", ENTITY_NAME, "idexists");
        }
        payment = paymentRepository.save(payment);
        return ResponseEntity.created(new URI("/api/payments/" + payment.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, payment.getId().toString()))
            .body(payment);
    }

    /**
     * {@code PUT  /payments/:id} : Updates an existing payment.
     *
     * @param id the id of the payment to save.
     * @param payment the payment to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated payment,
     * or with status {@code 400 (Bad Request)} if the payment is not valid,
     * or with status {@code 500 (Internal Server Error)} if the payment couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Payment> updatePayment(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody Payment payment
    ) throws URISyntaxException {
        log.debug("REST request to update Payment : {}, {}", id, payment);
        if (payment.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, payment.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!paymentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        payment = paymentRepository.save(payment);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, payment.getId().toString()))
            .body(payment);
    }

    /**
     * {@code PATCH  /payments/:id} : Partial updates given fields of an existing payment, field will ignore if it is null
     *
     * @param id the id of the payment to save.
     * @param payment the payment to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated payment,
     * or with status {@code 400 (Bad Request)} if the payment is not valid,
     * or with status {@code 404 (Not Found)} if the payment is not found,
     * or with status {@code 500 (Internal Server Error)} if the payment couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<Payment> partialUpdatePayment(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody Payment payment
    ) throws URISyntaxException {
        log.debug("REST request to partial update Payment partially : {}, {}", id, payment);
        if (payment.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, payment.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!paymentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<Payment> result = paymentRepository
            .findById(payment.getId())
            .map(existingPayment -> {
                if (payment.getAmount() != null) {
                    existingPayment.setAmount(payment.getAmount());
                }
                if (payment.getBillingDate() != null) {
                    existingPayment.setBillingDate(payment.getBillingDate());
                }
                if (payment.getPaymentMode() != null) {
                    existingPayment.setPaymentMode(payment.getPaymentMode());
                }
                if (payment.getExtraInformation() != null) {
                    existingPayment.setExtraInformation(payment.getExtraInformation());
                }

                return existingPayment;
            })
            .map(paymentRepository::save);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, payment.getId().toString())
        );
    }

    /**
     * {@code GET  /payments} : get all the payments.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of payments in body.
     */
    @GetMapping("")
    public List<Payment> getAllPayments() {
        log.debug("REST request to get all Payments");
        return paymentRepository.findAll();
    }

    /**
     * {@code GET  /payments/:id} : get the "id" payment.
     *
     * @param id the id of the payment to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the payment, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPayment(@PathVariable("id") UUID id) {
        log.debug("REST request to get Payment : {}", id);
        Optional<Payment> payment = paymentRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(payment);
    }

    /**
     * {@code DELETE  /payments/:id} : delete the "id" payment.
     *
     * @param id the id of the payment to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Payment : {}", id);
        paymentRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
