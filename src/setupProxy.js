// setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // 1. Maintain cross-origin popup auth bindings
  app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  // 2. Explicitly catch any accidental port 3000 direct calls and route them back to Netlify's local engine
  app.use(
    '/.netlify/functions',
    createProxyMiddleware({
      target: 'http://127.0.0.1:8888',
      changeOrigin: true,
      secure: false
    })
  );
};