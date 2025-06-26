#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Setting up Caddy reverse proxy...');

try {
  // Check if Caddy is available
  execSync('caddy version', { stdio: 'pipe' });

  // Create Caddyfile with correct certificate names
  const caddyfile = `
*.churchfeed.dev {
    tls ./_wildcard.churchfeed.dev+1.pem ./_wildcard.churchfeed.dev+1-key.pem
    reverse_proxy localhost:3000
}

churchfeed.dev {
    tls ./_wildcard.churchfeed.dev+1.pem ./_wildcard.churchfeed.dev+1-key.pem
    reverse_proxy localhost:3000
}
`;

  fs.writeFileSync('Caddyfile', caddyfile.trim());
  console.log('✅ Caddy setup complete');
} catch (error) {
  console.error('❌ Caddy not found. Please install Caddy first.');
  process.exit(1);
}