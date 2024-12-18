const QRCode = require('qrcode');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');



  const companyLogos = {
    "General Express": './assets/company/General.png',
    "Global Express": './assets/company/globalvoyage.png',
    "Buca Voyages": './assets/company/buca.png',
    "Finexs Voyages": './assets/company/finexvoyage.png',
    "Garanti Express": './assets/company/garantiexpress.png',
    "Touristique Express": './assets/company/touristique.png',
    "Musango Voyages": './assets/company/musango.png',
    "Moghamo Express": './assets/company/moghamo.png',
    "Buca Express": './assets/company/buca.png',
    "Garantie Express": './assets/company/garantiexpress.png',
    "Amour Mezam Express": './assets/company/amourmezam.png'
  };
  
  function getCompanyLogoPath(companyName) {
    return companyLogos[companyName] || 'Company logo not found';
  }
  


async function generateTicketPDF(ticketDetailsList, options = {}) {
    const {
        qrCodePath = 'assets/qr-code.png',
        pdfPath = 'assets/mockup.pdf',
        outputFilePath = 'assets/output.pdf',
        logoPath = 'assets/General.png'
    } = options;

    // Ensure ticketDetailsList is an array
    const ticketDetails = Array.isArray(ticketDetailsList) ? ticketDetailsList : [ticketDetailsList];

    function generateTextLines(details, font, boldFont) {
        return [
            { text: details.departureRegion, font: font, x: 61, y: 67, size: 6 },
            { text: details.arrival, font: boldFont, x: 120, y: 53, size: 7 },
            { text: details.departure, font: boldFont, x: 60, y: 53, size: 7 },
            { text: details.departureTime, font: font, x: 62, y: 29, size: 7 },
            { text: details.arrivalTime, font: font, x: 124, y: 29, size: 7 },
            { text: `Row ${details.seatNo[0] || details.seatNo}`, font: font, x: 197, y: 72, size: 6 },
            { text: `${details.id[0]}-${details.id[1]}`, font: font, x: 182, y: 85, size: 6 },
            { text: `${details.passengerName[0]}. ${details.passengerName[1]}`, font: font, x: 173, y: 109, size: 6 },
            { text: details.ticketNumber, font: boldFont, x: 285, y: 18, size: 10 },
            { text: details.arrivalRegion, font: font, x: 122, y: 67, size: 6 },
            { text: details.date, font: font, x: 80, y: 17.5, size: 6 },
            { text: details.Agency, font: boldFont, x: 60, y: 98, size: 6 },
            { text: `${details.AgencyAdress[0]}, BP ${details.AgencyAdress[1]}`, font: font, x: 70, y: 88.5, size: 6 },
            { text: details.phoneNumber, font: font, x: 194, y: 94, size: 6 }
        ];
    }

    async function generateQRCode(details) {
        const jsonString = JSON.stringify(details.data || 'https://obus-test.web.app');
        const tempQRCodePath = qrCodePath.replace('.png', `_${details.ticketNumber}.png`);
        
        return new Promise((resolve, reject) => {
            QRCode.toFile(tempQRCodePath, jsonString, {
                width: 150,
                margin: 1,
            }, (err) => {
                if (err) {
                    reject('Error generating QR code: ' + err);
                } else {
                    resolve(tempQRCodePath);
                }
            });
        });
    }

    async function addTextAndImageToPDF() {
        try {
            // Load existing PDF
            const existingPdfBytes = fs.readFileSync(pdfPath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            // Create a new PDF document with the same template for each ticket
            const newPdfDoc = await PDFDocument.create();

            // Embed fonts
            const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Process each ticket
            for (const details of ticketDetails) {
                // Copy the first page from the template PDF
                const [templatePage] = await newPdfDoc.copyPages(pdfDoc, [0]);
                const currentPage = newPdfDoc.addPage(templatePage);

                // Generate QR code for this ticket
                const currentQRCodePath = await generateQRCode(details);
                const qrCodeImageBytes = fs.readFileSync(currentQRCodePath);
                const qrCodeImage = await newPdfDoc.embedPng(qrCodeImageBytes);

                // Load agency logo
                const agenceBytes = fs.readFileSync(getCompanyLogoPath(details.company) || logoPath);
                const agenceImage = await newPdfDoc.embedPng(agenceBytes);

                // Text lines with positioning
                const textLines = generateTextLines(details, font, boldFont);

                // Draw text
                textLines.forEach(line => {
                    currentPage.drawText(line.text, {
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

                currentPage.drawImage(qrCodeImage, {
                    x: currentPage.getWidth() - qrCodeDimensions.width - 10,
                    y: currentPage.getHeight() - qrCodeDimensions.height - 10,
                    width: qrCodeDimensions.width,
                    height: qrCodeDimensions.height,
                });

                // Agency Logo positioning
                const maxImageWidth = 100; // Largeur maximale de l'image
                const maxImageHeight = 95; // Hauteur maximale de l'image
                
                let { width, height } = agenceDimensions;
                
                // Calculer le ratio pour maintenir les proportions
                const widthRatio = maxImageWidth / width;
                const heightRatio = maxImageHeight / height;
                const minRatio = Math.min(widthRatio, heightRatio);
                
                // Ajuster les dimensions de l'image
                width = width * minRatio;
                height = height * minRatio;
                
                currentPage.drawImage(agenceImage, {
                  x: currentPage.getWidth() / 5 - width / 5 -3,
                  y: currentPage.getHeight() - height - 3,
                  width: width,
                  height: height,
                });
                
            }

            // Save the modified PDF
            const pdfBytes = await newPdfDoc.save();
            fs.writeFileSync(outputFilePath, pdfBytes);
            console.log('PDF generated successfully with multiple tickets at', outputFilePath);

            return outputFilePath;

        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    return new Promise(async (resolve, reject) => {
        try {
            const outputPath = await addTextAndImageToPDF();
            resolve(outputPath);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = generateTicketPDF;