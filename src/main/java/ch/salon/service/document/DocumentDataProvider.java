package ch.salon.service.document;

import org.thymeleaf.context.Context;

public interface DocumentDataProvider {
    Context getContext();

    String getTemplateName();
}
