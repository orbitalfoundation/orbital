#!/usr/bin/env node

/*
smallserver.js: a tiny static file web server without any dependencies
https://github.com/craigbuckler/smallserver/blob/master/smallserver.js

launch with `./smallserver.js [port] [dir]` where:

  `[port]` is an optional HTTP port (8888 by default)
  `[dir]` is an optional absolute or relative root file directory (the current directory by default)
*/
(() => {

  'use strict';

  const
    http        = require('http'),
    url         = require('url'),
    path        = require('path'),
    fs          = require('fs'),
    port        = parseInt(process.argv[2] || 8888, 10),
    folder      = process.argv[3] || './',
    root        = path.isAbsolute(folder) ? path.join(folder) : path.join(process.cwd(), folder),
    mime        = {
      '.html'       : 'text/html',
      '.htm'        : 'text/html',
      '.xhtml'      : 'text/html',
      '.xhtm'       : 'text/html',
      '.css'        : 'text/css',
      '.js'         : 'application/javascript',
      '.mjs'        : 'application/javascript',
      '.cjs'        : 'application/javascript',
      '.json'       : 'application/json',
      '.webmanifest': 'application/manifest+json',
      '.manifest'   : 'application/manifest+json',
      '.jpg'        : 'image/jpeg',
      '.jpeg'       : 'image/jpeg',
      '.png'        : 'image/png',
      '.gif'        : 'image/gif',
      '.svg'        : 'image/svg+xml',
      '.ico'        : 'image/x-icon',
      '.txt'        : 'text/plain',
      'err'         : 'text/plain'
    };

  // unable to read root folder?
  if (!fs.existsSync(root)) {
    console.log(`ERROR: root folder ${root} does not exist`);
    process.exit(1);
  }

  // new server
  http.createServer((req, res) => {

    let
      uri = url.parse(req.url).pathname,
      filename = path.join(root, uri);

    // file available?
    fs.access(filename, fs.constants.R_OK, (err) => {

      // not found
      if (err) {
        serve(404, '404 Not Found\n');
        return;
      }

      // index.html default
      if (fs.statSync(filename).isDirectory()) filename += '/index.html';

      // read file
      fs.readFile(filename, (err, file) => {

        if (err) {
          // error reading
          serve(500, err + '\n');
        }
        else {
          // return file
          serve(200, file, path.extname(filename));
        }

      });
    });

    // serve content
    function serve(code, content, type) {

      res.writeHead(code, {
        'Content-Type': mime[type] || mime['err'],
        'Cache-Control': 'must-revalidate, max-age=0',
        'Content-Length': Buffer.byteLength(content)
      });
      res.write(content);
      res.end();

    }

  }).listen(port);

  console.log(`\nserver address: http://localhost:${port}\nroot folder   : ${root}\n`);

})();
