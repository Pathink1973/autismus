// Post-build script to ensure proper handling of auth callback routes
const fs = require('fs');
const path = require('path');

console.log('Running post-build script...');

// Get the dist directory
const distDir = path.resolve(__dirname, '../dist');

// Create auth callback directories
const authDir = path.join(distDir, 'auth');
const authV1Dir = path.join(distDir, 'auth', 'v1');

// Create directories if they don't exist
if (!fs.existsSync(authDir)) {
  console.log('Creating auth directory...');
  fs.mkdirSync(authDir, { recursive: true });
}

if (!fs.existsSync(authV1Dir)) {
  console.log('Creating auth/v1 directory...');
  fs.mkdirSync(authV1Dir, { recursive: true });
}

// Copy index.html to auth callback paths
const indexPath = path.join(distDir, 'index.html');
const authCallbackPath = path.join(authDir, 'callback.html');
const authV1CallbackPath = path.join(authV1Dir, 'callback.html');

try {
  // Read the index.html file
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Write to auth callback paths
  console.log('Copying index.html to auth/callback.html...');
  fs.writeFileSync(authCallbackPath, indexContent);
  
  console.log('Copying index.html to auth/v1/callback.html...');
  fs.writeFileSync(authV1CallbackPath, indexContent);
  
  // Create _redirects file in dist directory
  const redirectsContent = `
# Handle auth callback routes with priority
/auth/v1/callback  /index.html  200!
/auth/callback  /index.html  200!

# Handle all other routes
/*  /index.html  200
`;
  
  console.log('Creating _redirects file in dist directory...');
  fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent);
  
  // Create _headers file in dist directory
  const headersContent = `
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Cache-Control: public, max-age=0, must-revalidate

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/auth/callback
  Content-Type: text/html; charset=utf-8
  Cache-Control: public, max-age=0, must-revalidate

/auth/v1/callback
  Content-Type: text/html; charset=utf-8
  Cache-Control: public, max-age=0, must-revalidate

/*.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Content-Type: text/css; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.svg
  Content-Type: image/svg+xml; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
  
  console.log('Creating _headers file in dist directory...');
  fs.writeFileSync(path.join(distDir, '_headers'), headersContent);
  
  console.log('Post-build script completed successfully!');
} catch (error) {
  console.error('Error in post-build script:', error);
  process.exit(1);
}
