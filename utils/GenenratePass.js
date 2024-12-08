const QRCode = require('qrcode');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

function generateTicketPDF(details, options = {}) {
    const {
        qrCodePath = 'assets/qr-code.png',
        pdfPath = 'assets/mockup.pdf',
        outputFilePath = 'assets/output.pdf',
        logoPath = 'assets/General.png'
    } = options;

    const jsonString = JSON.stringify(details.data||'https://obus-test.web.app');

    function generateTextLines(details, font, boldFont) {
        return [
            { text: details.departureRegion, font: font, x: 61, y: 67, size: 6 },
            { text: details.arrival, font: boldFont, x: 122, y: 53, size: 13 },
            { text: details.departure, font: boldFont, x: 62, y: 53, size: 13 },
            { text: details.departureTime, font: font, x: 60, y: 29, size: 7 },
            { text: details.arrivalTime, font: font, x: 122, y: 29, size: 7 },
            { text: `Row ${details.seatNo[0]}, #${details.seatNo[1]}`, font: font, x: 197, y: 72, size: 6 },
            { text: `${details.id[0]}-${details.id[1]}`, font: font, x: 182, y: 85, size: 6 },
            { text: `${details.passengerName[0]}. ${details.passengerName[1]}`, font: font, x: 173, y: 109, size: 6 },
            { text: details.ticketNumber, font: boldFont, x: 285, y: 18, size: 10 },
            { text: details.arrivalRegion, font: font, x: 122, y: 67, size: 6 },
            { text: details.date, font: font, x: 80, y: 17, size: 7 },
            { text: details.Agency, font: boldFont, x: 60, y: 98, size: 6 },
            { text: `${details.AgencyAdress[0]}, BP ${details.AgencyAdress[1]} ${details.AgencyAdress[2]}`, font: font, x: 70, y: 88, size: 6 },
            { text: details.phoneNumber, font: font, x: 194, y: 94, size: 6 }
        ];
    }

    async function generateQRCode() {
        return new Promise((resolve, reject) => {
            QRCode.toFile(qrCodePath, jsonString, {
                width: 150,
                margin: 1,
            }, (err) => {
                if (err) {
                    reject('Error generating QR code: ' + err);
                } else {
                    resolve();
                }
            });
        });
    }

    async function addTextAndImageToPDF() {
        try {
            // Load existing PDF
            const existingPdfBytes = fs.readFileSync(pdfPath);
            const qrCodeImageBytes = fs.readFileSync(qrCodePath);
            const agenceBytes = fs.readFileSync(logoPath);

            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);
            const agenceImage = await pdfDoc.embedPng(agenceBytes);

            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Embed fonts
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Text lines with positioning
            const textLines = generateTextLines(details, font, boldFont);

            // Draw text
            textLines.forEach(line => {
                firstPage.drawText(line.text, {
                    x: line.x,
                    y: line.y,
                    size: line.size,
                    font: line.font,
                    color: rgb(0, 0, 0),
                });
            });

            // QR Code positioning
            const qrCodeDimensions = qrCodeImage.scale(0.7); 
            const agenceDimensions = agenceImage.scale(0.5);

            firstPage.drawImage(qrCodeImage, {
                x: firstPage.getWidth() - qrCodeDimensions.width - 10,
                y: firstPage.getHeight() - qrCodeDimensions.height - 10,
                width: qrCodeDimensions.width,
                height: qrCodeDimensions.height,
            });

            // Agency Logo positioning
            firstPage.drawImage(agenceImage, {
                x: firstPage.getWidth() / 5 - agenceDimensions.width / 5 + 1,
                y: firstPage.getHeight() - agenceDimensions.height - 1,
                width: agenceDimensions.width - 20,
                height: agenceDimensions.height - 5,
            });

            // Save the modified PDF
            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(outputFilePath, pdfBytes);
            console.log('PDF modified successfully with QR code and images at', outputFilePath);

            return outputFilePath;

        } catch (error) {
            console.error('Error modifying PDF:', error);
            throw error;
        }
    }

    return new Promise(async (resolve, reject) => {
        try {
            await generateQRCode();
            const outputPath = await addTextAndImageToPDF();
            resolve(outputPath);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = generateTicketPDF;