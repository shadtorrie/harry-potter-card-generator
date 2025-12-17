const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const swPath = path.join(__dirname, '..', 'docs', 'sw.js');
const versionMarker = /const BUILD_VERSION = '([^']*)';/;

const buildVersion = resolveBuildVersion();

if (!buildVersion) {
  throw new Error('Unable to determine a build version. Set SW_VERSION or ensure git is available.');
}

const swContents = fs.readFileSync(swPath, 'utf8');

if (!versionMarker.test(swContents)) {
  throw new Error('Cannot find BUILD_VERSION placeholder in docs/sw.js');
}

const updatedContents = swContents.replace(versionMarker, `const BUILD_VERSION = '${buildVersion}';`);
fs.writeFileSync(swPath, updatedContents);
console.log(`Updated service worker cache version to ${buildVersion}`);

function resolveBuildVersion() {
  if (process.env.SW_VERSION) {
    return process.env.SW_VERSION;
  }

  try {
    const hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (hash) {
      return hash;
    }
  } catch (error) {
    // git may not be available in all environments; fall back to timestamp below
  }

  return `build-${Date.now()}`;
}
