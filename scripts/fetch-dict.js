// scripts/fetch-dict.js
import https from 'https';
import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';

// Default URL for the ZIP release (can be overridden with DICT_URL env var)
const DEFAULT_ZIP_URL = 'https://github.com/scriptin/jmdict-simplified/releases/download/3.5.0%2B20241007122710/jmdict-eng-3.5.0+20241007122710.json.zip';
const zipUrl = process.env.DICT_URL || DEFAULT_ZIP_URL;
const outDir = path.resolve(process.cwd(), 'public', 'data');
const outFile = path.join(outDir, 'jmdict-eng-3.5.0.json');

function downloadAndExtract(url) {
  return new Promise((resolve, reject) => {
    console.log('Downloading ZIP from:', url);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        console.log('Redirected to', res.headers.location);
        return downloadAndExtract(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ZIP: ${res.statusCode}`));
      }

      // Ensure output directory exists
      fs.mkdirSync(outDir, { recursive: true });

      const zipStream = res.pipe(unzipper.Parse());
      let extracted = false;

      zipStream.on('entry', (entry) => {
        const fileName = entry.path;
        const type = entry.type; // 'File' or 'Directory'
        console.log('ZIP entry:', fileName);

        if (!extracted && type === 'File' && fileName.toLowerCase().endsWith('.json')) {
          console.log('Extracting (buffer) ->', fileName);
          entry.buffer().then((buf) => {
            fs.writeFileSync(outFile, buf);
            extracted = true;
            resolve(outFile);
          }).catch((err) => reject(err));
        } else {
          entry.autodrain();
        }
      });

      zipStream.on('close', () => {
        if (!extracted) {
          reject(new Error('No JSON file found in ZIP'));
        }
      });

      zipStream.on('error', (err) => reject(err));
    }).on('error', (err) => reject(err));
  });
}

(async () => {
  try {
    const result = await downloadAndExtract(zipUrl);
    console.log('Dictionary ready at', result);
  } catch (err) {
    console.error('Error fetching/extracting dictionary:', err.message);
    process.exit(1);
  }
})();