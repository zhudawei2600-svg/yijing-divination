// build.js — Combine all source files into a single distributable index.html
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src", "js");
const DIST_DIR = path.join(__dirname, "docs");

// Read the HTML template
let html = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");

// Collect JS source files in order
const jsFiles = [
  "01-hexagram-data.js",
  "02-casting.js",
  "03-interpret.js",
  "04-storage.js",
  "05-renderer.js",
  "06-views.js",
];

// Read and concatenate all JS source
let combinedJS = "";
for (const file of jsFiles) {
  const content = fs.readFileSync(path.join(SRC_DIR, file), "utf-8");
  combinedJS += content + "\n";
}

// Add app initialization code
combinedJS += `
// ============================================================
// SECTION: APP INITIALIZATION
// ============================================================
document.addEventListener("DOMContentLoaded", initApp);

// Register Service Worker for PWA (offline support)
if ("serviceWorker" in navigator) {
  const swCode = "self.addEventListener('install',e=>{self.skipWaiting()});" +
    "self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});" +
    "self.addEventListener('fetch',e=>{" +
      "e.respondWith(" +
        "caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{" +
          "const clone=resp.clone();" +
          "caches.open('iching-v1').then(c=>c.put(e.request,clone));" +
          "return resp;" +
        "}))" +
      ")" +
    "})";
  const blob = new Blob([swCode], {type:"application/javascript"});
  navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(()=>{});
}
`;

// Remove the external script references and insert combined JS
html = html.replace(
  /<!-- JS Source Files \(development\) -->[\s\S]*?<\/script>\s*<\/body>/,
  '<script>\n' + combinedJS + '\n</script>\n\n</body>'
);

// Write the distribution file
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}
fs.writeFileSync(path.join(DIST_DIR, "index.html"), html, "utf-8");

const sizeKB = (Buffer.byteLength(html, "utf-8") / 1024).toFixed(1);
console.log(`Build complete: dist/index.html (${sizeKB} KB)`);
