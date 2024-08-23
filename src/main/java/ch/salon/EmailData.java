package ch.salon;

import ch.salon.domain.enumeration.EmailTemplate;
import java.util.HashMap;
import java.util.Map;
import org.springframework.core.io.InputStreamSource;
import org.thymeleaf.context.Context;

public class EmailData {

    private EmailTemplate template;
    private Context context = new Context();
    private Map<String, InputStreamSource> attachments = new HashMap<>();

    public EmailTemplate getTemplate() {
        return template;
    }

    public void setTemplate(EmailTemplate template) {
        this.template = template;
    }

    public Context getContext() {
        return context;
    }

    public void setContext(Context context) {
        this.context = context;
    }

    public Map<String, InputStreamSource> getAttachments() {
        return attachments;
    }

    public void setAttachments(Map<String, InputStreamSource> attachments) {
        this.attachments = attachments;
    }
}
