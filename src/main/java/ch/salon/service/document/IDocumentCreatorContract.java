package ch.salon.service.document;

import org.springframework.core.io.InputStreamSource;
import org.thymeleaf.context.Context;

public interface IDocumentCreatorContract {
    String getTemplateName();

    Context getContext();

    InputStreamSource generate() throws Exception;
}
