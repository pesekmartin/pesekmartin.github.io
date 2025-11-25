#!/usr/bin/env node
// Simple helper to add a YouTube ID to a gallery in videos.json
// Usage: node add-video.js <GALLERY_KEY> <YOUTUBE_ID>

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const [,, gallery, id] = process.argv;
if (!gallery || !id) {
  console.error('Usage: node add-video.js <GALLERY_KEY> <YOUTUBE_ID>');
  process.exit(1);
}

const filePath = path.join(__dirname, 'videos.json');
if (!fs.existsSync(filePath)) {
  console.error('videos.json not found. Create it first with proper structure.');
  process.exit(1);
}

const raw = fs.readFileSync(filePath, 'utf8');
let data;
try { data = JSON.parse(raw); } catch (e) { console.error('Invalid JSON:', e); process.exit(1); }

// Normalize existing legacy formats and ensure object shape: { label, videos }
if (!data[gallery]) {
  data[gallery] = { label: gallery, videos: [id] };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Created gallery ${gallery} and added ${id} to videos.json`);
} else {
  // If gallery is an array (legacy), convert it
  if (Array.isArray(data[gallery])) {
    data[gallery] = { label: gallery, videos: data[gallery] };
  }

  if (!data[gallery].videos) data[gallery].videos = [];

  if (!data[gallery].videos.includes(id)) {
    data[gallery].videos.push(id);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Added ${id} to ${gallery} in videos.json`);
  } else {
    console.log('ID already present in that gallery.');
  }
  // attempt commit & push
  try {
    execSync(`git add videos.json && git commit -m "Add ${id} to ${gallery}" && git push`, { stdio: 'inherit' });
  } catch (e) {
    console.warn('Git commit/push failed — maybe you need to commit manually:', e.message);
  }
}
