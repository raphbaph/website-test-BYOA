const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Clean up the URL to prevent directory traversal
    const cleanUrl = req.url.split('?')[0].split('#')[0];
    
    // Redirect /blog to /blog/
    if (cleanUrl === '/blog') {
        res.writeHead(301, { 'Location': '/blog/' });
        res.end();
        return;
    }
    
    // Determine the file path
    let filePath;
    if (cleanUrl === '/') {
        filePath = path.join(__dirname, '../dist/index.html');
    } else if (cleanUrl.endsWith('/')) {
        filePath = path.join(__dirname, '../dist', cleanUrl, 'index.html');
    } else if (!path.extname(cleanUrl)) {
        filePath = path.join(__dirname, '../dist', `${cleanUrl}.html`);
    } else {
        filePath = path.join(__dirname, '../dist', cleanUrl);
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }
    
    console.log('Requesting:', cleanUrl);
    console.log('Serving file:', filePath);
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                console.error('File not found:', filePath);
                res.writeHead(404);
                res.end('404 - File Not Found');
            } else {
                console.error('Server error:', error);
                res.writeHead(500);
                res.end('500 - Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 