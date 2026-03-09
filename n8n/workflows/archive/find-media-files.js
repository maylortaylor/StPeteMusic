const fs = require('fs');
const path = require('path');

const mediaExtensions = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
  '.mp4', '.mov', '.avi', '.mkv', '.m4v', '.heic'
];

function getAllMediaFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllMediaFiles(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (mediaExtensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const inputDir = process.argv[2];
if (!inputDir) {
  console.error('❌ No input directory provided.');
  process.exit(1);
}

const files = getAllMediaFiles(inputDir);
console.log(JSON.stringify({ dirs: inputDir, files }, null, 2));
