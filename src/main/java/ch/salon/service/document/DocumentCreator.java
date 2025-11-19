package ch.salon.service.document;

import com.lowagie.text.pdf.BaseFont;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.w3c.tidy.Tidy;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Component
public class DocumentCreator {

    private final SpringTemplateEngine documentTemplateEngine;
    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentCreator.class.getName());

    public DocumentCreator(@Qualifier("documentTemplateEngine") SpringTemplateEngine documentTemplateEngine) {
        this.documentTemplateEngine = documentTemplateEngine;
    }

    public InputStreamSource build(String templateName, Context context) throws IOException {
        // Populate template HTML with data
        String renderedHtmlContent = documentTemplateEngine.process(templateName, context);
        // Convert HTML to XHTML
        String xHtml = convertToXhtml(renderedHtmlContent);

        ITextRenderer renderer = new ITextRenderer();
        URL fontUrl = getClass().getResource("/templates/document/common/Code39.ttf");
        if (fontUrl != null) {
            renderer.getFontResolver()
                    .addFont(fontUrl.toExternalForm(), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        } else {
            // au pire, log un warning
            LOGGER.warn("Code39.ttf not found on classpath");
        }

        // Fill styles & co in the XHTML
        URL baseUrl = getClass().getResource("/templates/document/common/");
        renderer.setDocumentFromString(xHtml, baseUrl != null ? baseUrl.toExternalForm() : null);
        renderer.layout();

        // Convert PDF to ByteArrayOutputStream
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        renderer.createPDF(byteArrayOutputStream);
        byteArrayOutputStream.close();

        // Convert ByteArrayOutputStream to InputStreamSource
        return new ByteArrayResource(byteArrayOutputStream.toByteArray());
    }

    private String convertToXhtml(String html) {
        Tidy tidy = new Tidy();
        tidy.setInputEncoding(StandardCharsets.UTF_8.name());
        tidy.setOutputEncoding(StandardCharsets.UTF_8.name());
        tidy.setXHTML(true);
        tidy.setQuiet(true);
        tidy.setShowWarnings(false);
        tidy.setIndentContent(false);
        tidy.setPrintBodyOnly(false);
        tidy.setDropProprietaryAttributes(true);
        tidy.setNumEntities(true); // pour éviter certaines surprises

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8));
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            tidy.parseDOM(inputStream, outputStream);
            return outputStream.toString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            LOGGER.error("Failed to convert HTML to XHTML, returning raw HTML", e);
            return html;
        }
    }
}
