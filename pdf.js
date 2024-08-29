const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3001; // or your desired port

app.get('/generate-quotation', async (req, res) => {
 
    const { sr, cid, dn, dcn } = req.query;

    if (!sr || !cid || !dn || !dcn) {
      return res.status(400).send('Missing required parameters');
    }
    
    const urlToConvert = `https://app.epackers.in/view-quotation.aspx?sr=${sr}&cid=${cid}&dn=${dn}`;

    const browser = await puppeteer.launch();
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

    await browser.close();

    const sanitizedDcn = dcn.replace(/[^a-z0-9]/gi, '_').toLowerCase(); 
    const filePath = path.join(__dirname, `${sanitizedDcn}.pdf`);

    fs.writeFileSync(filePath, pdfBuffer);

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      } else {
        fs.unlinkSync(filePath);
      }
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
