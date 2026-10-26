import fs from 'fs';
import path from 'path';

/** Generic, page-independent helper methods reusable across UI and API tests. */

export function randomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function randomNumber(min = 1, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomEmail() {
  return `${randomString()}@test.com`;
}

/** Read a JSON file relative to the project root, e.g. readJson('test-data/users.json'). */
export function readJson(relativePath) {
  const fullPath = path.join(__dirname, '..', relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

export function isSortedAscending(list) {
  return list.every((v, i) => i === 0 || list[i - 1] <= v);
}

export function isSortedDescending(list) {
  return list.every((v, i) => i === 0 || list[i - 1] >= v);
}

export function roundTo(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}
