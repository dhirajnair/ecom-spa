const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

// Add request logging middleware first
app.use((req, res, next) => {
  console.log(`📍 ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Runtime config endpoint for injecting env into SPA
app.get('/runtime-config.js', (_req, res) => {
  const cfg = {
    REACT_APP_USE_COGNITO_AUTH: process.env.REACT_APP_USE_COGNITO_AUTH || 'false',
    REACT_APP_AWS_REGION: process.env.REACT_APP_AWS_REGION || process.env.AWS_REGION || '',
    REACT_APP_USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID || '',
    REACT_APP_USER_POOL_WEB_CLIENT_ID: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID || '',
    REACT_APP_IDENTITY_POOL_ID: process.env.REACT_APP_IDENTITY_POOL_ID || '',
    REACT_APP_USER_POOL_DOMAIN: process.env.REACT_APP_USER_POOL_DOMAIN || '',
    REACT_APP_API_GATEWAY_URL: process.env.REACT_APP_API_GATEWAY_URL || '',
  };
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.__RUNTIME_CONFIG__ = ${JSON.stringify(cfg)};`);
});

// Helper: stage prefix from configured API Gateway URL (e.g. /dev/)
function getStagePrefix() {
  const apiUrl = process.env.REACT_APP_API_GATEWAY_URL || '';
  try {
    if (apiUrl) {
      const u = new URL(apiUrl);
      let p = u.pathname || '/';
      if (!p.endsWith('/')) p += '/';
      return p; // e.g. /dev/
    }
  } catch (_) {}
  return '/';
}

// Pretty redirect routes for Cognito Hosted UI

app.get('/login', (req, res) => {
  const cfg = {
    region: process.env.REACT_APP_AWS_REGION || process.env.AWS_REGION || 'ap-south-1',
    domain: process.env.REACT_APP_USER_POOL_DOMAIN,
    clientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
    baseUrl: process.env.REACT_APP_API_GATEWAY_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}`,
  };
  if (!cfg.domain || !cfg.clientId) return res.status(500).send('Cognito not configured');
  const redirectUri = `${cfg.baseUrl.replace(/\/$/, '')}/auth/callback`;
  const loginUrl = `https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/login?client_id=${encodeURIComponent(cfg.clientId)}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
  return res.redirect(302, loginUrl);
});

// Friendly signup route → Cognito hosted UI signup
app.get('/signup', (req, res) => {
  const cfg = {
    region: process.env.REACT_APP_AWS_REGION || process.env.AWS_REGION || 'ap-south-1',
    domain: process.env.REACT_APP_USER_POOL_DOMAIN,
    clientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
    baseUrl: process.env.REACT_APP_API_GATEWAY_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}`,
  };
  if (!cfg.domain || !cfg.clientId) return res.status(500).send('Cognito not configured');
  const redirectUri = `${cfg.baseUrl.replace(/\/$/, '')}/auth/callback`;
  const url = `https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/signup?client_id=${encodeURIComponent(cfg.clientId)}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
  return res.redirect(302, url);
});

app.get('/logout', (req, res) => {
  const cfg = {
    region: process.env.REACT_APP_AWS_REGION || process.env.AWS_REGION || 'ap-south-1',
    domain: process.env.REACT_APP_USER_POOL_DOMAIN,
    clientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
    baseUrl: process.env.REACT_APP_API_GATEWAY_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}`,
  };
  if (!cfg.domain || !cfg.clientId) return res.status(500).send('Cognito not configured');
  const redirectUri = cfg.baseUrl.replace(/\/$/, '');
  const url = `https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/logout?client_id=${encodeURIComponent(cfg.clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  console.log(`🚪 Logout URL: ${url}`);
  return res.redirect(302, url);
});

// Handle stage-specific static assets first (e.g., /dev/static/...)
app.use('/:stage/static', (req, res, next) => {
  console.log(`📁 Static asset request: ${req.originalUrl} -> stage: ${req.params.stage}`);
  
  // Only handle known stages
  if (/^[a-zA-Z0-9_-]+$/.test(req.params.stage)) {
    // Remove the stage prefix from the URL path for the static middleware
    const originalUrl = req.url;
    req.url = req.url.replace(`/${req.params.stage}`, '');
    console.log(`📁 URL rewrite: ${originalUrl} -> ${req.url}`);
    console.log(`📁 Looking for file in: ${path.join(__dirname, 'build')}${req.url}`);
    
    express.static(path.join(__dirname, 'build'), {
      setHeaders: (res, filePath) => {
        console.log(`📁 Serving static file: ${filePath}`);
        if (/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })(req, res, next);
  } else {
    console.log(`📁 Invalid stage format: ${req.params.stage}`);
    next();
  }
});

// Handle common assets with stage prefix
app.get('/:stage/manifest.json', (req, res) => {
  if (/^[a-zA-Z0-9_-]+$/.test(req.params.stage)) {
    res.sendFile(path.join(__dirname, 'build', 'manifest.json'));
  } else {
    res.status(404).end();
  }
});

app.get('/:stage/favicon.ico', (req, res) => {
  // Return a 204 No Content response for favicon
  res.status(204).end();
});

app.get('/:stage/runtime-config.js', (req, res) => {
  if (/^[a-zA-Z0-9_-]+$/.test(req.params.stage)) {
    const stage = req.params.stage;
    const baseApiUrl = process.env.REACT_APP_API_GATEWAY_URL || '';
    
    // Ensure API Gateway URL includes the stage
    let stageAwareApiUrl = baseApiUrl;
    if (baseApiUrl && !baseApiUrl.endsWith(`/${stage}`)) {
      stageAwareApiUrl = baseApiUrl.replace(/\/$/, '') + `/${stage}`;
    }
    
    const cfg = {
      REACT_APP_USE_COGNITO_AUTH: process.env.REACT_APP_USE_COGNITO_AUTH || 'false',
      REACT_APP_AWS_REGION: process.env.REACT_APP_AWS_REGION || process.env.AWS_REGION || '',
      REACT_APP_USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID || '',
      REACT_APP_USER_POOL_WEB_CLIENT_ID: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID || '',
      REACT_APP_IDENTITY_POOL_ID: process.env.REACT_APP_IDENTITY_POOL_ID || '',
      REACT_APP_USER_POOL_DOMAIN: process.env.REACT_APP_USER_POOL_DOMAIN || '',
      REACT_APP_API_GATEWAY_URL: stageAwareApiUrl,
    };
    
    console.log(`🔧 Runtime config for stage ${stage}:`, {
      originalApiUrl: baseApiUrl,
      stageAwareApiUrl: stageAwareApiUrl,
      stage: stage
    });
    
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`window.__RUNTIME_CONFIG__ = ${JSON.stringify(cfg)};`);
  } else {
    res.status(404).end();
  }
});

// Static files with long cache for assets (root level)
app.use(express.static(path.join(__dirname, 'build'), {
  setHeaders: (res, filePath) => {
    if (/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Handle favicon.ico at root level too
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// Read the index.html file once at startup
const rawIndexHtml = fs.readFileSync(path.join(__dirname, 'build', 'index.html'), 'utf8');

// Public routes that should render SPA without forcing login
// Root and stage-root should serve the SPA so client router can decide
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/:stage', (req, res, next) => {
  console.log(`🎯 Stage route hit: ${req.originalUrl} -> stage: ${req.params.stage}`);
  
  // Skip if it's an API route or special route
  if (['login', 'logout', 'auth', 'runtime-config.js', 'health'].includes(req.params.stage)) {
    console.log(`🎯 Skipping special route: ${req.params.stage}`);
    return next();
  }
  
  // Skip if it's requesting a static asset - let the static middleware handle it
  if (/\.(js|css|png|jpg|jpeg|gif|ico|svg|json|txt|xml|woff|woff2|ttf|eot)$/i.test(req.params.stage)) {
    console.log(`🎯 Skipping static asset: ${req.params.stage}`);
    return next();
  }
  
  // If it looks like a stage name (simple alphanumeric), serve the SPA with stage-aware rewriting
  if (/^[A-Za-z0-9_-]+$/.test(req.params.stage)) {
    const stage = `/${req.params.stage}/`;
    console.log(`🎯 Serving SPA for stage: ${stage}`);
    console.log(`🎯 rawIndexHtml available: ${!!rawIndexHtml}`);
    
    let html = rawIndexHtml;
    
    // Inject <base> for relative links
    if (!/\<base /i.test(html)) {
      html = html.replace(/<head>/i, `<head>\n  <base href="${stage}">`);
      console.log(`🎯 Added base href: ${stage}`);
    } else {
      html = html.replace(/<base [^>]*>/i, `<base href="${stage}">`);
      console.log(`🎯 Updated base href: ${stage}`);
    }
    
    // Rewrite absolute asset URLs to include stage prefix
    const originalLength = html.length;
    html = html.replace(/href=\"\/(static\/[^"]*)\"/g, `href="${stage}$1"`)
               .replace(/src=\"\/(static\/[^"]*)\"/g, `src="${stage}$1"`)
               .replace(/src=\"\/runtime-config\.js\"/g, `src="${stage}runtime-config.js"`)
               .replace(/href=\"\/manifest\.json\"/g, `href="${stage}manifest.json"`)
               .replace(/href=\"\/favicon\.ico\"/g, `href="${stage}favicon.ico"`);
    
    console.log(`🎯 HTML rewriting: ${originalLength} -> ${html.length} chars`);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
  
  console.log(`🎯 Invalid stage format, passing to next: ${req.params.stage}`);
  return next();
});

// SPA fallback with stage-aware base path and asset rewriting
app.get('*', (req, res) => {
  // Prefer configured stage from API Gateway URL; fallback to guessing from request
  let stage = getStagePrefix();
  if (stage === '/') {
    const parts = (req.originalUrl || '/').split('/').filter(Boolean);
    stage = parts.length > 0 ? `/${parts[0]}/` : '/';
  }
  let html = rawIndexHtml;
  // Inject <base> for relative links
  if (!/\<base /i.test(html)) {
    html = html.replace(/<head>/i, `<head>\n  <base href="${stage}">`);
  } else {
    html = html.replace(/<base [^>]*>/i, `<base href="${stage}">`);
  }
  // Rewrite absolute asset URLs produced by CRA to include stage prefix
  html = html.replace(/href=\"\/(static\/[^"]*)\"/g, `href="${stage}$1"`)
             .replace(/src=\"\/(static\/[^"]*)\"/g, `src="${stage}$1"`)
             .replace(/src=\"\/runtime-config\.js\"/g, `src="${stage}runtime-config.js"`)
             .replace(/href=\"\/manifest\.json\"/g, `href="${stage}manifest.json"`)
             .replace(/href=\"\/favicon\.ico\"/g, `href="${stage}favicon.ico"`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.listen(port, () => {
  console.log(`🚀 SPA server listening on port ${port}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Cognito enabled: ${process.env.REACT_APP_USE_COGNITO_AUTH}`);
  console.log(`🚀 API Gateway URL: ${process.env.REACT_APP_API_GATEWAY_URL}`);
});


