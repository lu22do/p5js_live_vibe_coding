#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    const env = {};

    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                env[key.trim()] = valueParts.join('=').trim();
            }
        });
    }

    return env;
}

const env = loadEnv();
const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    // Prevent directory traversal
    if (!path.resolve(filePath).startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Special handling for index.html to inject environment variables
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(filePath, 'utf-8', (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }

            // Inject environment variables as a script
            const envScript = `<script>window.__ENV__ = ${JSON.stringify(env)};</script>`;
            const modifiedContent = content.replace('</head>', `${envScript}\n</head>`);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(modifiedContent);
        });
        return;
    }

    // Serve other files normally
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        // Determine content type
        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});
