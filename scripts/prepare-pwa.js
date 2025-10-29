import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = new URL('../public', import.meta.url).pathname;
const ASSETS_DIR = new URL('./assets', import.meta.url).pathname;

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Icon mappings
const iconMappings = {
  // Android icons
  'android/android-launchericon-192-192.png': 'pwa-192x192.png',
  'android/android-launchericon-512-512.png': 'pwa-512x512.png',
  // iOS icons
  'ios/180.png': 'apple-touch-icon.png',
  'ios/16.png': 'favicon-16x16.png',
  'ios/32.png': 'favicon-32x32.png',
  'ios/192.png': 'icon-192x192.png',
  'ios/512.png': 'icon-512x512.png'
};

// Copy PWA assets from assets to public
const copyAssets = () => {
  // Copy mapped icons
  Object.entries(iconMappings).forEach(([source, dest]) => {
    const sourcePath = path.join(ASSETS_DIR, source);
    const destPath = path.join(PUBLIC_DIR, dest);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${source} to ${dest}`);
    } else {
      console.warn(`Warning: Source icon ${source} not found`);
    }
  });

  // Create maskable icons directory
  const maskablePath = path.join(PUBLIC_DIR, 'maskable');
  if (!fs.existsSync(maskablePath)) {
    fs.mkdirSync(maskablePath, { recursive: true });
  }

  // Copy additional Android icons to maskable directory
  const androidSizes = ['48', '72', '96', '144'];
  androidSizes.forEach(size => {
    const source = `android/android-launchericon-${size}-${size}.png`;
    const dest = `maskable/icon-${size}x${size}.png`;
    const sourcePath = path.join(ASSETS_DIR, source);
    const destPath = path.join(PUBLIC_DIR, dest);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${source} to ${dest}`);
    }
  });

  // Copy iOS icons to icons directory
  const iconsPath = path.join(PUBLIC_DIR, 'icons');
  if (!fs.existsSync(iconsPath)) {
    fs.mkdirSync(iconsPath, { recursive: true });
  }

  // Copy all iOS icons except those already mapped
  fs.readdirSync(path.join(ASSETS_DIR, 'ios'))
    .filter(file => !Object.keys(iconMappings).includes(`ios/${file}`))
    .forEach(file => {
      const size = path.parse(file).name;
      const dest = `icons/icon-${size}x${size}.png`;
      const sourcePath = path.join(ASSETS_DIR, 'ios', file);
      const destPath = path.join(PUBLIC_DIR, dest);

      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ios/${file} to ${dest}`);
    });
};

copyAssets();