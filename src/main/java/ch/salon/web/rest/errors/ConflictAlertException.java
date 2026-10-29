package ch.salon.web.rest.errors;

import ch.salon.utils.ProblemDetailWithCause;
import ch.salon.utils.ProblemDetailWithCause.ProblemDetailWithCauseBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

import java.net.URI;

/**
 * Conflit d'édition concurrente (HTTP 409). Utilisé notamment quand un enregistrement du planning
 * bénévoles admin s'appuie sur une version obsolète (une inscription bénévole est arrivée entre-temps).
 */
@SuppressWarnings("java:S110")
public class ConflictAlertException extends ErrorResponseException {

    private static final long serialVersionUID = 1L;

    private final String entityName;
    private final String errorKey;

    public ConflictAlertException(String defaultMessage, String entityName, String errorKey) {
        super(HttpStatus.CONFLICT,
                ProblemDetailWithCauseBuilder.instance().withStatus(HttpStatus.CONFLICT.value())
                                             .withType(ErrorConstants.DEFAULT_TYPE).withTitle(defaultMessage)
                                             .withProperty("message", "error." + errorKey)
                                             .withProperty("params", entityName).build(), null);
        this.entityName = entityName;
        this.errorKey = errorKey;
    }

    public String getEntityName() {
        return entityName;
    }

    public String getErrorKey() {
        return errorKey;
    }

    public ProblemDetailWithCause getProblemDetailWithCause() {
        return (ProblemDetailWithCause) this.getBody();
    }
}
