const { execSync } = require('child_process');

console.log('Resetting git index...');
execSync('git reset', { stdio: 'inherit' });

console.log('Adding files...');
execSync('git add -A', { stdio: 'inherit' });

console.log('Committing...');
execSync('git commit -m "feat: complete security audit fixes, unified green admin theme, rbac middleware, real credit card detection map, and animated expense tracker"', { stdio: 'inherit' });

console.log('Git commit complete.');
