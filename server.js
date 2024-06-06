const express = require("express");
const bodyParser = require("body-parser");
const qrcode = require("qrcode");
const nodemailer = require("nodemailer");
const { PDFDocument } = require("pdf-lib");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public")); // to serve the HTML file

app.post("/submit-form", async (req, res) => {
  const { name, email, phone, srnum, asset } = req.body;

  try {
    console.log("Generating QR code for:", {
      name,
      email,
      phone,
      srnum,
      asset,
    });

    // Generate QR code
    const qrCodeData = `Assignee: ${name}\nEmail Address: ${email}\nContact Number: ${phone}\nSr. Number: ${srnum}\nAsset Number: ${asset}`;
    const qrCodeImage = await qrcode.toDataURL(qrCodeData);

    // Create a PDF document and add the QR code image
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 600]); // Example dimensions
    const pngImage = await pdfDoc.embedPng(qrCodeImage);
    const { width, height } = pngImage.scale(1);

    // Calculate coordinates to center the image
    const x = (page.getWidth() - width) / 2;
    const y = (page.getHeight() - height) / 2;

    page.drawImage(pngImage, {
      x: x,
      y: y,
      width: width,
      height: height,
    });

    const pdfBytes = await pdfDoc.save();

    // Send email with PDF attachment
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "pawanbhayde721@gmail.com",
        pass: process.env.EMAIL_PASS || "eatcgzourefdlyof",
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER || "pawanbhayde721@gmail.com",
      to: email,
      subject: "Your QR Code",
      html: "<h1>Here is your QR Code</h1>",
      attachments: [
        {
          filename: "qrcode.pdf",
          content: Buffer.from(pdfBytes),
          contentType: "application/pdf",
        },
      ],
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);

    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("Failed to send email");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
