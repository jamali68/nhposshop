import fs from 'fs';
import path from 'path';
import { generatePWAAssets } from './generate-icons.js';

// 1. Ensure all PNG & SVG assets are freshly copied from official NH POS logo
generatePWAAssets();

const MANIFEST_CONTENT = {
  name: "NH POS Shop & Cash Manager",
  short_name: "NH POS Shop",
  start_url: "./",
  scope: "./",
  display: "standalone",
  background_color: "#FAF8EC",
  theme_color: "#1e5631",
  description: "NH POS Shop - Complete POS, Daily Cash Book, Easyload Ledger & Khata Management System",
  orientation: "portrait",
  icons: [
    {
      src: "icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: "icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    }
  ]
};

const targets = ['dist', 'docs'];

targets.forEach((dir) => {
  if (!fs.existsSync(dir)) return;

  const assetsDir = path.join(dir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // 1. Write pristine manifest.json in root and assets
  const manifestJson = JSON.stringify(MANIFEST_CONTENT, null, 2);
  fs.writeFileSync(path.join(dir, 'manifest.json'), manifestJson, 'utf8');
  fs.writeFileSync(path.join(assetsDir, 'manifest.json'), manifestJson, 'utf8');

  // Also check if Vite created any hashed manifest-*.json in assets/ and replace its content with valid manifest
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    files.forEach((f) => {
      if (f.startsWith('manifest') && f.endsWith('.json')) {
        fs.writeFileSync(path.join(assetsDir, f), manifestJson, 'utf8');
      }
    });
  }

  // 2. Ensure icon files are present in both root and assets/
  const iconFiles = ['icon-192.png', 'icon-512.png', 'icon.png', 'icon1.png', 'apple-touch-icon.png', 'icon.svg'];
  iconFiles.forEach((iconName) => {
    const src = path.join('public', iconName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(dir, iconName));
      fs.copyFileSync(src, path.join(assetsDir, iconName));
    }
  });

  // Also ensure sw.js is at root
  if (fs.existsSync('public/sw.js')) {
    fs.copyFileSync('public/sw.js', path.join(dir, 'sw.js'));
  }

  // 3. Fix index.html and 404.html to point to manifest.json and icon-192.png cleanly
  ['index.html', '404.html'].forEach((htmlFile) => {
    const htmlPath = path.join(dir, htmlFile);
    if (fs.existsSync(htmlPath)) {
      let content = fs.readFileSync(htmlPath, 'utf8');

      // Fix manifest link to point directly to manifest.json
      content = content.replace(/<link[^>]+rel="manifest"[^>]*>/i, '<link rel="manifest" href="manifest.json" />');

      // Fix apple-touch-icon
      content = content.replace(/<link[^>]+rel="apple-touch-icon"[^>]*>/i, '<link rel="apple-touch-icon" href="icon-192.png" />');

      fs.writeFileSync(htmlPath, content, 'utf8');
    }
  });

  console.log(`✅ PWA assets verified and pristine in: ${dir}`);
});

console.log('🎉 NH POS Official Logo & PWA setup fully prepared for Android, iOS & Desktop.');
