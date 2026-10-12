package com.cinebook.cinebook.service;

import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.ShowTime;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.Currency;
import java.util.Locale;
import java.util.Map;

/** Renders a booking as a one-page PDF e-ticket with a QR code. */
@Slf4j
@Service
@RequiredArgsConstructor
public class TicketPdfService {

    private static final Color BRAND = new Color(0xE1, 0x1D, 0x48);
    private static final Color INK = new Color(0x15, 0x15, 0x1F);
    private static final Color MUTED = new Color(0x6B, 0x6B, 0x80);
    private static final Color LINE = new Color(0xE2, 0xE2, 0xEC);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEE, d MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);
    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a", Locale.ENGLISH);
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4)).followRedirects(HttpClient.Redirect.NORMAL).build();

    private final RefundPolicy refundPolicy;

    public byte[] render(Booking b) {
        ShowTime st = b.getShowTime();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // A5 width, a little taller so the whole ticket fits on one page
        Document doc = new Document(new Rectangle(420, 760), 28, 28, 0, 20);
        try {
            PdfWriter.getInstance(doc, out);
            doc.addTitle("CineBook ticket " + b.getReference());
            doc.addAuthor("CineBook");
            doc.open();

            doc.add(header(b));

            // Poster + title
            PdfPTable top = new PdfPTable(new float[]{1f, 3f});
            top.setWidthPercentage(100);
            top.setSpacingBefore(18);
            Image poster = loadImage(st.getPosterUrl());
            PdfPCell posterCell = new PdfPCell();
            posterCell.setBorder(Rectangle.NO_BORDER);
            if (poster != null) {
                poster.scaleToFit(70, 105);
                posterCell.addElement(poster);
            }
            top.addCell(posterCell);

            PdfPCell titleCell = new PdfPCell();
            titleCell.setBorder(Rectangle.NO_BORDER);
            titleCell.setPaddingLeft(8);
            titleCell.addElement(text(st.isEvent() ? safe(st.getEvent().getCategory()).toUpperCase() : "MOVIE", 8, Font.BOLD, BRAND));
            Paragraph title = text(st.getTitle(), 18, Font.BOLD, INK);
            title.setSpacingBefore(2);
            titleCell.addElement(title);
            String sub = st.isEvent() ? safe(st.getEvent().getPerformer())
                    : String.join(" · ", nonBlank(st.getMovie().getCertificate(), st.getMovie().getLanguage(),
                    st.getDurationMinutes() > 0 ? st.getDurationMinutes() + " min" : null));
            if (!sub.isBlank()) titleCell.addElement(text(sub, 9, Font.NORMAL, MUTED));
            top.addCell(titleCell);
            doc.add(top);

            // Details grid
            PdfPTable grid = new PdfPTable(2);
            grid.setWidthPercentage(100);
            grid.setSpacingBefore(16);
            field(grid, "DATE", st.getShowDate().format(DATE));
            field(grid, "TIME", st.getStartTime().format(TIME));
            field(grid, st.isEvent() ? "VENUE" : "CINEMA", st.getScreen().getTheater().getName());
            field(grid, st.isEvent() ? "HALL" : "SCREEN",
                    st.getScreen().getScreenName() + (st.getScreen().getFormat() != null ? " · " + st.getScreen().getFormat() : ""));
            fieldWide(grid, "SEATS (" + b.getSeats().size() + ")", b.getSeatLabels());
            if (b.getContactName() != null) {
                fieldWide(grid, "BOOKED FOR", b.getContactName() + (b.getContactPhone() != null ? " · " + b.getContactPhone() : ""));
            }
            String address = st.getScreen().getTheater().getAddress();
            if (address != null && !address.isBlank()) fieldWide(grid, "ADDRESS", address);
            doc.add(grid);

            doc.add(dashedLine());

            // QR + reference
            Image qr = Image.getInstance(qrImage("CINEBOOK:" + b.getReference()), null);
            qr.scaleAbsolute(130, 130);
            qr.setAlignment(Element.ALIGN_CENTER);
            doc.add(qr);
            Paragraph ref = text(b.getReference(), 15, Font.BOLD, INK);
            ref.setAlignment(Element.ALIGN_CENTER);
            doc.add(ref);
            Paragraph hint = text("Show this QR code at the entrance", 8, Font.NORMAL, MUTED);
            hint.setAlignment(Element.ALIGN_CENTER);
            doc.add(hint);

            // Amount
            PdfPTable paid = new PdfPTable(2);
            paid.setWidthPercentage(100);
            paid.setSpacingBefore(16);
            PdfPCell l = new PdfPCell(text("Amount paid", 10, Font.NORMAL, MUTED));
            PdfPCell r = new PdfPCell(text(money(b), 14, Font.BOLD, INK));
            for (PdfPCell c : new PdfPCell[]{l, r}) {
                c.setBorder(Rectangle.TOP);
                c.setBorderColor(LINE);
                c.setPaddingTop(10);
            }
            r.setHorizontalAlignment(Element.ALIGN_RIGHT);
            paid.addCell(l);
            paid.addCell(r);
            doc.add(paid);

            String footer = "Booked " + (b.getConfirmedAt() != null ? b.getConfirmedAt().format(STAMP) : "") + "."
                    + (refundPolicy.isRefundable(b)
                        ? "  Plans changed? Cancel for a refund until " + refundPolicy.deadline(b).format(STAMP) + " from My Tickets."
                        : "  Enjoy the show!");
            Paragraph foot = text(footer, 7.5f, Font.NORMAL, MUTED);
            foot.setSpacingBefore(14);
            foot.setAlignment(Element.ALIGN_CENTER);
            doc.add(foot);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Could not render ticket PDF for " + b.getReference(), e);
        }
    }

    private PdfPTable header(Booking b) {
        PdfPTable band = new PdfPTable(2);
        band.setWidthPercentage(118); // bleed past the side margins
        PdfPCell brand = new PdfPCell(text("CineBook", 16, Font.BOLD, Color.WHITE));
        PdfPCell kind = new PdfPCell(text("E-TICKET", 9, Font.BOLD, new Color(255, 255, 255, 210)));
        kind.setHorizontalAlignment(Element.ALIGN_RIGHT);
        kind.setVerticalAlignment(Element.ALIGN_MIDDLE);
        for (PdfPCell c : new PdfPCell[]{brand, kind}) {
            c.setBackgroundColor(BRAND);
            c.setBorder(Rectangle.NO_BORDER);
            c.setPaddingTop(16);
            c.setPaddingBottom(16);
        }
        brand.setPaddingLeft(36);
        kind.setPaddingRight(36);
        band.addCell(brand);
        band.addCell(kind);
        return band;
    }

    private static void field(PdfPTable t, String label, String value) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        c.setPaddingBottom(8);
        c.addElement(text(label, 7, Font.BOLD, MUTED));
        c.addElement(text(value, 10.5f, Font.BOLD, INK));
        t.addCell(c);
    }

    private static void fieldWide(PdfPTable t, String label, String value) {
        PdfPCell c = new PdfPCell();
        c.setColspan(2);
        c.setBorder(Rectangle.NO_BORDER);
        c.setPaddingBottom(8);
        c.addElement(text(label, 7, Font.BOLD, MUTED));
        c.addElement(text(value, 10.5f, Font.BOLD, INK));
        t.addCell(c);
    }

    private static Paragraph dashedLine() {
        Paragraph p = new Paragraph();
        p.setSpacingBefore(4);
        p.setSpacingAfter(10);
        p.add(new Chunk(new com.lowagie.text.pdf.draw.DottedLineSeparator()));
        return p;
    }

    private static Paragraph text(String s, float size, int style, Color color) {
        return new Paragraph(s == null ? "" : s, FontFactory.getFont(FontFactory.HELVETICA, size, style, color));
    }

    private static java.awt.image.BufferedImage qrImage(String value) throws Exception {
        BitMatrix m = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 400, 400, Map.of(EncodeHintType.MARGIN, 1));
        return MatrixToImageWriter.toBufferedImage(m);
    }

    /** Best effort: a missing or slow poster never blocks the ticket. */
    private static Image loadImage(String url) {
        if (url == null || !url.startsWith("http")) return null;
        try {
            HttpResponse<InputStream> res = HTTP.send(
                    HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(6)).GET().build(),
                    HttpResponse.BodyHandlers.ofInputStream());
            if (res.statusCode() != 200) return null;
            try (InputStream in = res.body()) {
                return Image.getInstance(in.readAllBytes());
            }
        } catch (Exception e) {
            log.debug("Poster not embedded in PDF ({}): {}", url, e.getMessage());
            return null;
        }
    }

    public static String money(Booking b) {
        try {
            NumberFormat f = NumberFormat.getCurrencyInstance(Locale.US);
            f.setCurrency(Currency.getInstance(b.getCurrency().toUpperCase()));
            return f.format(b.getTotalAmount());
        } catch (Exception e) {
            return b.getCurrency().toUpperCase() + " " + b.getTotalAmount();
        }
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static java.util.List<String> nonBlank(String... parts) {
        return java.util.Arrays.stream(parts).filter(p -> p != null && !p.isBlank()).toList();
    }
}
