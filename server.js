const fs = require('fs');
const https = require('https');
const express = require('express');
const privateKey = fs.readFileSync('/path/to/private-key.pem', 'utf8');
const certificate = fs.readFileSync('/path/to/certificate.pem', 'utf8');
const ca = fs.readFileSync('/path/to/ca.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});
const app = express();