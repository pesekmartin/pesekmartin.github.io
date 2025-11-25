#!/usr/bin/env node
// manage-galleries.js
// Usage:
//   node manage-galleries.js list
//   node manage-galleries.js create <KEY> ["Label"] [--no-git]
//   node manage-galleries.js remove <KEY> [--no-git]
//   node manage-galleries.js rename <OLD_KEY> <NEW_KEY> ["New Label"] [--no-git]
//   node manage-galleries.js set-label <KEY> "New Label" [--no-git]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filePath = path.join(__dirname, 'videos.json');

function readJson() {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error('Failed to parse videos.json:', e.message);
    process.exit(1);
  }
}

function writeJson(obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function normalizeLegacy(obj) {
  // convert any arrays to { label:key, videos: [...] }
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (Array.isArray(v)) out[k] = { label: k, videos: v.slice() };
    else if (v && typeof v === 'object') {
      out[k] = { label: v.label || k, videos: Array.isArray(v.videos) ? v.videos.slice() : [] };
    } else out[k] = { label: k, videos: [] };
  }
  return out;
}

function tryGitCommit(message) {
  try {
    execSync('git add videos.json', { stdio: 'inherit' });
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('Committed and pushed changes.');
  } catch (e) {
    console.warn('Git commit/push failed or not available. Changes saved locally.');
  }
}

function usage() {
  console.log('manage-galleries.js - manage videos.json galleries');
  console.log('Usage:');
  console.log('  node manage-galleries.js list');
  console.log('  node manage-galleries.js create <KEY> ["Label"] [--no-git]');
  console.log('  node manage-galleries.js remove <KEY> [--no-git]');
  console.log('  node manage-galleries.js rename <OLD_KEY> <NEW_KEY> ["New Label"] [--no-git]');
  console.log('  node manage-galleries.js set-label <KEY> "New Label" [--no-git]');
  console.log('  node manage-galleries.js add-video <KEY> <VIDEO_ID_OR_URL> [--no-git]');
  console.log('  node manage-galleries.js remove-video <KEY> <VIDEO_ID_OR_URL> [--no-git]');
}

const argv = process.argv.slice(2);
if (argv.length === 0) { usage(); process.exit(0); }

const cmd = argv[0];
let args = argv.slice(1);
const noGit = args.includes('--no-git');
if (noGit) args = args.filter(a => a !== '--no-git');

let data = readJson();
let collections = normalizeLegacy(data);

function extractYouTubeId(input) {
  if (!input) return null;
  // heuristically pick the first 11-char YouTube id-like token
  const m = String(input).match(/([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

switch (cmd) {
  case 'list': {
    const keys = Object.keys(collections);
    if (keys.length === 0) return console.log('No galleries found.');
    for (const k of keys) {
      console.log(`- ${k}: "${collections[k].label}" (${collections[k].videos.length} videos)`);
    }
    break;
  }
  case 'create': {
    const key = args[0];
    const label = args[1] || key;
    if (!key) { console.error('Missing KEY'); process.exit(1); }
    if (collections[key]) { console.error('Gallery already exists:', key); process.exit(1); }
    collections[key] = { label, videos: [] };
    writeJson(collections);
    console.log('Created gallery', key, 'label:', label);
    if (!noGit) tryGitCommit(`Create gallery ${key}`);
    break;
  }
  case 'remove': {
    const key = args[0];
    if (!key) { console.error('Missing KEY'); process.exit(1); }
    if (!collections[key]) { console.error('Gallery not found:', key); process.exit(1); }
    delete collections[key];
    writeJson(collections);
    console.log('Removed gallery', key);
    if (!noGit) tryGitCommit(`Remove gallery ${key}`);
    break;
  }
  case 'rename': {
    const oldKey = args[0];
    const newKey = args[1];
    const newLabel = args[2];
    if (!oldKey || !newKey) { console.error('Missing keys'); process.exit(1); }
    if (!collections[oldKey]) { console.error('Gallery not found:', oldKey); process.exit(1); }
    if (collections[newKey]) { console.error('Destination key already exists:', newKey); process.exit(1); }
    collections[newKey] = { label: newLabel || collections[oldKey].label || newKey, videos: collections[oldKey].videos.slice() };
    delete collections[oldKey];
    writeJson(collections);
    console.log(`Renamed ${oldKey} -> ${newKey}`);
    if (!noGit) tryGitCommit(`Rename gallery ${oldKey} to ${newKey}`);
    break;
  }
  case 'set-label': {
    const key = args[0];
    const label = args[1];
    if (!key || !label) { console.error('Usage: set-label <KEY> "New Label"'); process.exit(1); }
    if (!collections[key]) { console.error('Gallery not found:', key); process.exit(1); }
    collections[key].label = label;
    writeJson(collections);
    console.log('Updated label for', key, '->', label);
    if (!noGit) tryGitCommit(`Update label for ${key}`);
    break;
  }
  case 'add-video': {
    const key = args[0];
    const idOrUrl = args[1];
    if (!key || !idOrUrl) { console.error('Usage: add-video <KEY> <VIDEO_ID_OR_URL>'); process.exit(1); }
    const id = extractYouTubeId(idOrUrl);
    if (!id) { console.error('Invalid YouTube id or URL:', idOrUrl); process.exit(1); }
    if (!collections[key]) { console.error('Gallery not found:', key); process.exit(1); }
    if (collections[key].videos.includes(id)) { console.log('Video already present in', key); process.exit(1); }
    collections[key].videos.push(id);
    writeJson(collections);
    console.log(`Added video ${id} to ${key}`);
    if (!noGit) tryGitCommit(`Add video ${id} to ${key}`);
    break;
  }
  case 'remove-video': {
    const key = args[0];
    const idOrUrl = args[1];
    if (!key || !idOrUrl) { console.error('Usage: remove-video <KEY> <VIDEO_ID_OR_URL>'); process.exit(1); }
    const id = extractYouTubeId(idOrUrl);
    if (!id) { console.error('Invalid YouTube id or URL:', idOrUrl); process.exit(1); }
    if (!collections[key]) { console.error('Gallery not found:', key); process.exit(1); }
    const idx = collections[key].videos.indexOf(id);
    if (idx === -1) { console.error('Video not found in', key); process.exit(1); }
    collections[key].videos.splice(idx, 1);
    writeJson(collections);
    console.log(`Removed video ${id} from ${key}`);
    if (!noGit) tryGitCommit(`Remove video ${id} from ${key}`);
    break;
  }
  default:
    console.error('Unknown command:', cmd);
    usage();
    process.exit(1);
}

process.exit(0);
