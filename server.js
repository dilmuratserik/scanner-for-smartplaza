import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import https from 'https';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 7777;

// Parse command-line arguments
const argv = yargs(hideBin(process.argv))
    .option('ssl', {
        type: 'boolean',
        default: false,
        describe: 'Enable SSL',
    })
    .option('ssl-key', {
        type: 'string',
        describe: 'Path to SSL key',
    })
    .option('ssl-cert', {
        type: 'string',
        describe: 'Path to SSL certificate',
    })
    .argv;

let server;

if (argv.ssl) {
    if (!argv['ssl-key'] || !argv['ssl-cert']) {
        console.error('Please provide both SSL key and certificate.');
        process.exit(1);
    }

    server = https.createServer({
        key: fs.readFileSync(argv['ssl-key']),
        cert: fs.readFileSync(argv['ssl-cert'])
    }, app);
} else {
    server = app;
}

// If --host is provided, use that. Otherwise, default to 'localhost'
const HOST = argv.host || 'localhost';

// Serve static files from the 'landing' directory
app.use(express.static(path.join(__dirname, 'landing')));
app.get('/', (req, res) => {
    res.redirect('/index.html');
});
app.get('/config', (req, res) => {
    const config = {
        URL_TO_SEND: process.env.URL_TO_SEND
    };
    res.json(config);
});

server.listen(PORT, HOST, () => {
    console.log(`Server is running on http${argv.ssl ? 's' : ''}://${HOST}:${PORT}`);
});
