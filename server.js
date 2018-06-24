const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
let cache = {};

function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found!');
    response.end();
}

function sendFile(response, filePath, fileContents) {
    response.writeHead(200, {'Content-Type': mime.getType(path.basename(filePath))});
    response.end(fileContents);
}

function serverStatic(response, cache, absPath) {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);
    } else {
        fs.exists(absPath, function (exists) {
            if (exists) {
                fs.readFile(absPath, function (error, data) {
                    if (error) {
                        send404(response);
                    } else {
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                })
            }
        })
    }
}

const server = http.createServer(function (request, response) {
    let filePath = false;
    if (request.url === '/') {
        filePath = 'public/index.html';
    } else {
        filePath = 'public' + request.url;
    }
    const absPath = './' + filePath;
    serverStatic(response, cache, absPath);
});

server.listen(3000, function () {
    console.log("Ser listening on post 3000.");
});
require('./lib/chat_server').listen(server);






