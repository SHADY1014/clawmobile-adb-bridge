const net = require('net');
const http = require('http');

const PORT = 3128;

const server = net.createServer((client) => {
  let buf = '';
  let headersDone = false;
  let connectHost = null;
  let connectPort = null;

  client.once('data', (chunk) => {
    const req = chunk.toString();
    const [methodLine, ...rest] = req.split('\r\n');
    const [method, target] = methodLine.split(' ');

    if (method === 'CONNECT') {
      const [host, port] = target.split(':');
      connectHost = host;
      connectPort = parseInt(port || 443);

      const target = net.connect(connectPort, connectHost, () => {
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        target.pipe(client);
        client.pipe(target);
      });
      target.on('error', () => client.end());
    } else {
      const [method, url] = methodLine.split(' ');
      const parsed = new URL(url);
      const opts = {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname + parsed.search,
        method: method,
        headers: {}
      };

      for (const line of rest) {
        if (!line) continue;
        const idx = line.indexOf(':');
        if (idx > 0) opts.headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }

      const proxyReq = http.request(opts, (proxyRes) => {
        const respLine = 'HTTP/1.1 ' + proxyRes.statusCode + ' ' + proxyRes.statusMessage + '\r\n';
        const headers = Object.entries(proxyRes.headers).map(([k, v]) => k + ': ' + (Array.isArray(v) ? v.join(', ') : v)).join('\r\n');
        client.write(respLine + headers + '\r\n\r\n');
        proxyRes.pipe(client);
      });
      proxyReq.on('error', () => {
        client.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
        client.end();
      });
      proxyReq.end(req.slice(req.indexOf('\r\n\r\n') + 4));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Proxy on :' + PORT);
});
