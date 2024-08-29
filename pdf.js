const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3001; 

app.get('/generate-quotation', async (req, res) => {
    const { sr, cid, dn, dcn } = req.query;

    if (!sr || !cid || !dn || !dcn) {
        return res.status(400).send('Missing required parameters');
    }

    const urlToConvert = "https://fervent-pare.103-120-176-21.plesk.page//view-quotation.aspx?sr=${sr}&cid=${cid}&dn=${dn}";

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // add these flags if running in a restricted environment
        });
        const page = await browser.newPage();
        await page.goto(urlToConvert, { waitUntil: 'networkidle2' });

        const pdfBuffer = await page.pdf({
            format: 'A3',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        const sanitizedDcn = dcn.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filePath = path.join(__dirname, "output.pdf");

        fs.writeFileSync(filePath, pdfBuffer);

        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error sending file');
            } else {
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Internal server error');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(port, () => {
    //console.log(Server is running on http://localhost:${port});
});