// loadbearing demo app — a zero-dependency Node server for SAFELY practicing load
// tests on your own machine. It never touches a database or the internet.
//
//   node examples/demo-app/server.js          # starts on http://localhost:3000
//   Routes:  /fast   -> instant JSON
//            /slow   -> artificial delay (e.g. /slow?ms=400) to simulate a heavy endpoint
//
// Then, in another terminal, point the load test at it (localhost only):
//   k6 run -e TARGET_URL=http://localhost:3000/fast skills/run-load-test/scripts/load-test.js
'use strict';
const http = require('http');
const PORT = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const json = (code, body) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  if (u.pathname === '/' || u.pathname === '/fast') {
    json(200, { ok: true, route: 'fast' });
  } else if (u.pathname === '/slow') {
    const ms = Math.min(5000, Number(u.searchParams.get('ms') || 300));
    setTimeout(() => json(200, { ok: true, route: 'slow', ms }), ms);
  } else {
    json(404, { ok: false, error: 'not found' });
  }
});

server.listen(PORT, () => {
  console.log('loadbearing demo app on http://localhost:' + PORT + '  (routes: /fast, /slow?ms=300)');
});
