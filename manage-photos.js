#!/usr/bin/env node
// manage-photos.js
// Usage:
//   node manage-photos.js list
//   node manage-photos.js create <KEY> ["Title"] [--no-git]
//   node manage-photos.js remove <KEY> [--no-git]
//   node manage-photos.js set-title <KEY> "New Title" [--no-git]
//   node manage-photos.js add-photo <KEY> <SRC> ["Caption"] [--no-git]
//   node manage-photos.js remove-photo <KEY> <SRC> [--no-git]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filePath = path.join(__dirname, 'photos.json');

function readJson() {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error('Failed to parse photos.json:', e.message);
    process.exit(1);
  }
}

function writeJson(obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function tryGitCommit(message) {
  try {
    execSync('git add photos.json', { stdio: 'inherit' });
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('Committed and pushed changes.');
  } catch (e) {
    console.warn('Git commit/push failed or not available. Changes saved locally.');
  }
}

function usage() {
  console.log('manage-photos.js - manage photos.json collections');
  console.log('Usage:');
  console.log('  node manage-photos.js list');
  console.log('  node manage-photos.js create <KEY> ["Title"] [--no-git]');
  console.log('  node manage-photos.js remove <KEY> [--no-git]');
  console.log('  node manage-photos.js set-title <KEY> "New Title" [--no-git]');
  console.log('  node manage-photos.js add-photo <KEY> <SRC> ["Caption"] [--no-git]');
  console.log('  node manage-photos.js remove-photo <KEY> <SRC> [--no-git]');
}

const argv = process.argv.slice(2);
if (argv.length === 0) { usage(); process.exit(0); }

const cmd = argv[0];
let args = argv.slice(1);
const noGit = args.includes('--no-git');
if (noGit) args = args.filter(a => a !== '--no-git');

let data = readJson();

switch (cmd) {
  case 'list': {
    const keys = Object.keys(data);
    if (keys.length === 0) return console.log('No photo collections found.');
    for (const k of keys) {
      const title = data[k] && data[k].title ? data[k].title : '';
      const count = data[k] && Array.isArray(data[k].photos) ? data[k].photos.length : 0;
      console.log(`- ${k}: "${title}" (${count} photos)`);
    }
    break;
  }
  case 'create': {
    const key = args[0];
    const title = args[1] || key;
    if (!key) { console.error('Missing KEY'); process.exit(1); }
    if (data[key]) { console.error('Collection already exists:', key); process.exit(1); }
    data[key] = { title, photos: [] };
    writeJson(data);
    console.log('Created collection', key, 'title:', title);
    if (!noGit) tryGitCommit(`Create photo collection ${key}`);
    break;
  }
  case 'remove': {
    const key = args[0];
    if (!key) { console.error('Missing KEY'); process.exit(1); }
    if (!data[key]) { console.error('Collection not found:', key); process.exit(1); }
    delete data[key];
    writeJson(data);
    console.log('Removed collection', key);
    if (!noGit) tryGitCommit(`Remove photo collection ${key}`);
    break;
  }
  case 'set-title': {
    const key = args[0];
    const title = args[1];
    if (!key || !title) { console.error('Usage: set-title <KEY> "New Title"'); process.exit(1); }
    if (!data[key]) { console.error('Collection not found:', key); process.exit(1); }
    data[key].title = title;
    writeJson(data);
    console.log('Updated title for', key, '->', title);
    if (!noGit) tryGitCommit(`Update title for ${key}`);
    break;
  }
  case 'add-photo': {
    const key = args[0];
    const src = args[1];
    const caption = args[2] || '';
    if (!key || !src) { console.error('Usage: add-photo <KEY> <SRC> ["Caption"]'); process.exit(1); }
    if (!data[key]) { console.error('Collection not found:', key); process.exit(1); }
    if (!Array.isArray(data[key].photos)) data[key].photos = [];
    data[key].photos.push({ src, caption });
    writeJson(data);
    console.log(`Added photo ${src} to ${key}`);
    if (!noGit) tryGitCommit(`Add photo ${src} to ${key}`);
    break;
  }
  case 'remove-photo': {
    const key = args[0];
    const src = args[1];
    if (!key || !src) { console.error('Usage: remove-photo <KEY> <SRC>'); process.exit(1); }
    if (!data[key]) { console.error('Collection not found:', key); process.exit(1); }
    if (!Array.isArray(data[key].photos)) data[key].photos = [];
    const idx = data[key].photos.findIndex(p => p && p.src === src);
    if (idx === -1) { console.error('Photo not found in', key); process.exit(1); }
    data[key].photos.splice(idx, 1);
    writeJson(data);
    console.log(`Removed photo ${src} from ${key}`);
    if (!noGit) tryGitCommit(`Remove photo ${src} from ${key}`);
    break;
  }
  default:
    console.error('Unknown command:', cmd);
    usage();
    process.exit(1);
}

process.exit(0);
