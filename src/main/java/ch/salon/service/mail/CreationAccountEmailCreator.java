package ch.salon.service.mail;

import ch.salon.domain.User;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import tech.jhipster.config.JHipsterProperties;

@Component
public class CreationAccountEmailCreator extends AbstractEmailCreator {

    private final MessageSource messageSource;
    private final JHipsterProperties jHipsterProperties;
    private User user;

    public CreationAccountEmailCreator(
        MessageSource messageSource,
        JavaMailSender javaMailSender,
        @Qualifier("mailTemplateEngine") SpringTemplateEngine mailTemplateEngine,
        JHipsterProperties jHipsterProperties
    ) {
        super(javaMailSender, mailTemplateEngine);
        this.messageSource = messageSource;
        this.jHipsterProperties = jHipsterProperties;
    }

    public void fillUser(User user) {
        this.user = user;
    }

    @Override
    protected String getTranslatedSubject() {
        return this.messageSource.getMessage("email.creation.title", null, getContext().getLocale());
    }

    @Override
    protected String getTemplateName() {
        return "creationEmail";
    }

    @Override
    protected String getSenderEmail() {
        return "dylan.claude.work@gmail.com";
    }

    @Override
    protected String getRecipientEmail() {
        return this.user.getEmail();
    }

    @Override
    protected Context getContext() {
        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable("user", user);
        context.setVariable("baseUrl", jHipsterProperties.getMail().getBaseUrl());

        return context;
    }

    @Override
    public Map<String, InputStreamSource> getAttachments() throws Exception {
        return Map.of();
    }
}
