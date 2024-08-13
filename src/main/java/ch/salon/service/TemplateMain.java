package ch.salon.service;

import com.lowagie.text.DocumentException;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import org.xhtmlrenderer.pdf.ITextRenderer;

public class TemplateMain {

    public static void main(String[] args) {
        String inputFile = "E:\\ajoiedumieuxvivre\\src\\main\\resources\\templates\\mail\\invoiceEmail.html";
        String outputFile = "output.pdf";

        try {
            String url = new File(inputFile).toURI().toURL().toString();
            OutputStream os = new FileOutputStream(outputFile);

            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocument(url);
            renderer.layout();
            renderer.createPDF(os);

            os.close();
            System.out.println("PDF created successfully.");
        } catch (DocumentException | IOException e) {
            e.printStackTrace();
        }
    }
}
