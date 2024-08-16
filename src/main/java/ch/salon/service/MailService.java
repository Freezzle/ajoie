package ch.salon.service;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.EmailTemplate;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import tech.jhipster.config.JHipsterProperties;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

import static ch.salon.domain.enumeration.EmailTemplate.*;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private static final String USER = "user";
    private static final String BASE_URL = "baseUrl";

    private final JHipsterProperties jHipsterProperties;
    private final JavaMailSender javaMailSender;
    private final MessageSource messageSource;
    private final SpringTemplateEngine templateEngine;
    private final EventLogService eventLogService;

    public MailService(JHipsterProperties jHipsterProperties, JavaMailSender javaMailSender,
                       MessageSource messageSource, SpringTemplateEngine templateEngine,
                       EventLogService eventLogService) {
        this.jHipsterProperties = jHipsterProperties;
        this.javaMailSender = javaMailSender;
        this.messageSource = messageSource;
        this.templateEngine = templateEngine;
        this.eventLogService = eventLogService;
    }

    @Async
    public void sendCreationEmail(User user) {
        log.debug("Sending creation email to '{}'", user.getEmail());

        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        this.sendEmailFromTemplateSync(context, user.getEmail(), CREATION_ACCOUNT_EMAIL, null);
    }

    @Async
    public void sendActivationEmail(User user) {
        log.debug("Sending activation email to '{}'", user.getEmail());

        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        this.sendEmailFromTemplateSync(context, user.getEmail(), ACTIVATION_EMAIL, null);
    }

    @Async
    public void sendPasswordResetMail(User user) {
        log.debug("Sending password reset email to '{}'", user.getEmail());

        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        this.sendEmailFromTemplateSync(context, user.getEmail(), RESET_PASSWORD_EMAIL, null);
    }

    public void sendInvoiceMail(Salon salon, Exhibitor exhibitor, InvoicingPlan invoicingPlan) {
        log.debug("Sending invoice email to '{}'", exhibitor.getEmail());

        Context context = new Context(Locale.FRENCH);
        context.setVariable("salon", salon.getPlace());
        context.setVariable("billingNumber", invoicingPlan.getBillingNumber());
        context.setVariable("fullName", exhibitor.getFullName());
        context.setVariable("startDate", DateUtils.instantToIso(salon.getStartingDate()));
        context.setVariable("endDate", DateUtils.instantToIso(salon.getEndingDate()));

        Object[] args = {invoicingPlan.getBillingNumber(), salon.getPlace()};

        this.sendEmailFromTemplateSync(context, exhibitor.getEmail(), INVOICE_EMAIL, args);

        eventLogService.eventFromSystem("La facture #" + invoicingPlan.getBillingNumber() + " a été envoyée.", EventType.EMAIL, EntityType.PARTICIPATION,
            invoicingPlan.getParticipation().getId());
    }

    private void sendEmailFromTemplateSync(Context context, String emailto, EmailTemplate template,
                                           Object[] argsSubject) {
        String content = templateEngine.process(template.getTemplateName(), context);
        String subject = messageSource.getMessage(template.getSubjectKey(), argsSubject, context.getLocale());

        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper message = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());
            message.setFrom("dylan.claude.work@gmail.com"); // FIXME CHANGE THAT LATER
            message.setTo(emailto.contains(
                "dylan") ? emailto : "dylan.claude.work@gmail.com"); // FIXME CHANGE THAT LATER, AVOID SENDING PROD
            message.setSubject(subject);
            message.setText(content, true);

            // FIXME : TO REMOVE
            File file = new File("email.eml");
            try (FileOutputStream fos = new FileOutputStream(file)) {
                mimeMessage.writeTo(fos);
            } catch (Exception e) {
            }

            javaMailSender.send(mimeMessage);
            log.debug("Sent email to User '{}'", emailto);
        } catch (MailException | MessagingException e) {
            throw new MailSendException("Failed to send message for " + emailto, e);
        }
    }
}
