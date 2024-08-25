package ch.salon.service.mail;

import static java.nio.charset.StandardCharsets.UTF_8;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.Map;
import org.springframework.core.io.InputStreamSource;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

public abstract class AbstractEmailCreator {

    private final JavaMailSender javaMailSender;
    private final SpringTemplateEngine mailTemplateEngine;

    public AbstractEmailCreator(JavaMailSender javaMailSender, SpringTemplateEngine mailTemplateEngine) {
        this.javaMailSender = javaMailSender;
        this.mailTemplateEngine = mailTemplateEngine;
    }

    protected abstract String getTranslatedSubject();

    protected abstract String getTemplateName();

    protected abstract String getSenderEmail();

    protected abstract String getRecipientEmail();

    protected abstract Context getContext();

    public abstract Map<String, InputStreamSource> getAttachments() throws Exception;

    @Async
    public void sendEmailAsync() throws Exception {
        this.sendEmailSync();
    }

    public void sendEmailSync() throws Exception {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            Map<String, InputStreamSource> attachments = getAttachments() != null ? getAttachments() : new HashMap<>();

            MimeMessageHelper message = getMimeMessageHelper(mimeMessage, !attachments.isEmpty(), getHtmlContent());

            for (Map.Entry<String, InputStreamSource> entry : attachments.entrySet()) {
                message.addAttachment(entry.getKey(), entry.getValue());
            }

            javaMailSender.send(mimeMessage);
        } catch (MailException | MessagingException e) {
            throw new MailSendException("Failed to send message for " + getRecipientEmail(), e);
        }
    }

    public String getHtmlContent() {
        return mailTemplateEngine.process(getTemplateName(), getContext());
    }

    private MimeMessageHelper getMimeMessageHelper(MimeMessage mimeMessage, boolean withAttachments, String content)
        throws MessagingException {
        MimeMessageHelper message = new MimeMessageHelper(mimeMessage, withAttachments, UTF_8.name());

        // FIXME CHANGE THAT LATER
        message.setFrom(getSenderEmail());

        // FIXME CHANGE THAT LATER, AVOID SENDING PROD
        message.setTo(getRecipientEmail().contains("dylan") ? getRecipientEmail() : "dylan.claude.work@gmail.com");
        message.setSubject(getTranslatedSubject());
        message.setText(content, true);
        return message;
    }
}
