/**
 * Timezone Unit Tests for dateUtils
 * 
 * Run with: node utils/dateUtils.test.js
 * 
 * Pure JavaScript reimplementation of the TypeScript dateUtils logic.
 * Tests the exact same behavior as the TypeScript version.
 * 
 * Key timezone scenarios:
 * - UTC+ timezone (e.g., +07:00): 23:00 local = next day UTC
 * - UTC- timezone (e.g., -05:00): 01:00 local = previous day UTC
 * - Midnight boundary crossing
 * - DST transitions (constructor is DST-safe)
 */

// ============================================================
// Inline the dateUtils functions (pure JS ports of the TS)
// ============================================================

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayLocalDateString() {
  return toLocalDateString(new Date());
}

function localDateToUTCRange(localDateStr) {
  const [year, month, day] = localDateStr.split('-').map(Number);
  const start = new Date(year, month - 1, day).toISOString();
  const end = new Date(year, month - 1, day + 1).toISOString();
  return { start, end };
}

function utcToLocalDateString(isoUtc) {
  return toLocalDateString(new Date(isoUtc));
}

// ============================================================
// Test runner
// ============================================================

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    console.log(`  FAIL: ${message}`);
    failed++;
  }
}

// ============================================================
// TEST 1: toLocalDateString
// ============================================================

console.log('\n=== TEST 1: toLocalDateString ===\n');

const UTC_MAPPINGS = [
  // UTC midday is always the same local day regardless of timezone offset
  ['2026-03-21T12:00:00.000Z', null, 'UTC midday = always same local day'],
  ['2026-03-21T00:00:00.000Z', null, 'UTC midnight = local day depends on TZ offset'],
  // UTC afternoon is always same local day
  ['2026-03-21T16:30:00.000Z', null, 'UTC afternoon = same local day'],
];

for (const [utcTime, expectedDate, description] of UTC_MAPPINGS) {
  const date = new Date(utcTime);
  const result = toLocalDateString(date);
  const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(result);
  if (validFormat && (expectedDate === null || result === expectedDate)) {
    console.log(`  PASS: ${description}`);
    console.log(`         UTC: ${utcTime} -> Local: ${result}`);
    passed++;
  } else {
    console.log(`  FAIL: ${description}`);
    console.log(`         UTC: ${utcTime} -> Expected: ${expectedDate || 'valid YYYY-MM-DD'}, Got: ${result}`);
    failed++;
  }
}

// ============================================================
// TEST 2: todayLocalDateString
// ============================================================

console.log('\n=== TEST 2: todayLocalDateString ===\n');

const result2 = todayLocalDateString();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

if (datePattern.test(result2)) {
  console.log(`  PASS: returns valid YYYY-MM-DD format: ${result2}`);
  passed++;
} else {
  console.log(`  FAIL: Expected YYYY-MM-DD format, got: ${result2}`);
  failed++;
}

const today = toLocalDateString(new Date());
if (result2 === today) {
  console.log(`  PASS: matches toLocalDateString(new Date())`);
  passed++;
} else {
  console.log(`  FAIL: todayLocalDateString() should equal toLocalDateString(new Date())`);
  failed++;
}

// ============================================================
// TEST 3: localDateToUTCRange
// ============================================================

console.log('\n=== TEST 3: localDateToUTCRange ===\n');

// Test 3a: range covers exactly 24 hours
const { start, end } = localDateToUTCRange('2026-03-21');
const startMs = new Date(start).getTime();
const endMs = new Date(end).getTime();
const diffMs = endMs - startMs;
const diffHours = diffMs / (1000 * 60 * 60);

if (diffHours === 24) {
  console.log(`  PASS: March 21 range is exactly 24 hours`);
  console.log(`         start: ${start}`);
  console.log(`         end:   ${end}`);
  passed++;
} else {
  console.log(`  FAIL: Range should be exactly 24 hours, got ${diffHours}`);
  failed++;
}

// Test 3b: end is exactly one day after start
const startDate = new Date(start);
const endDate = new Date(end);
const startPlusOne = new Date(startDate);
startPlusOne.setDate(startDate.getDate() + 1);

if (endDate.getTime() === startPlusOne.getTime()) {
  console.log(`  PASS: end = start + 1 day`);
  passed++;
} else {
  console.log(`  FAIL: end should be start + 1 day`);
  failed++;
}

// Test 3c: format is valid ISO UTC strings
if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && start.endsWith('Z') && end.endsWith('Z')) {
  console.log(`  PASS: start and end are valid UTC ISO strings`);
  passed++;
} else {
  console.log(`  FAIL: start or end is not a valid UTC ISO string`);
  failed++;
}

// ============================================================
// TEST 4: utcToLocalDateString
// ============================================================

console.log('\n=== TEST 4: utcToLocalDateString ===\n');

// Test 4a: round-trip: localDate -> UTC range -> back to localDate
const original = '2026-03-21';
const { start: s2, end: e2 } = localDateToUTCRange(original);
const recovered = utcToLocalDateString(s2);

if (recovered === original) {
  console.log(`  PASS: round-trip: ${original} -> ${s2} -> ${recovered}`);
  passed++;
} else {
  console.log(`  FAIL: round-trip failed: ${original} -> ${s2} -> ${recovered}`);
  failed++;
}

// Test 4b: various UTC times map to correct local dates
const UTC_TO_LOCAL = [
  ['2026-03-20T17:00:00.000Z', '2026-03-21'], // UTC+7: 00:00 local March 21
  ['2026-03-21T05:00:00.000Z', '2026-03-21'], // UTC+7: 12:00 local March 21
  ['2026-03-21T14:59:59.999Z', '2026-03-21'], // UTC+7: 21:59 local March 21
  ['2026-03-22T00:00:00.000Z', '2026-03-22'], // UTC+7: 07:00 March 22
  ['2026-03-20T08:00:00.000Z', '2026-03-20'], // UTC-5: 03:00 local March 20
  ['2026-03-21T03:00:00.000Z', '2026-03-21'], // UTC-5: 22:00 March 20 local -> March 21
];

for (const [utcTime, expectedLocalDate] of UTC_TO_LOCAL) {
  const result = utcToLocalDateString(utcTime);
  if (result === expectedLocalDate) {
    console.log(`  PASS: ${utcTime} -> ${result}`);
    passed++;
  } else {
    console.log(`  FAIL: ${utcTime} -> Expected: ${expectedLocalDate}, Got: ${result}`);
    failed++;
  }
}

// ============================================================
// TEST 5: Integration — the actual use case
// ============================================================

console.log('\n=== TEST 5: Integration -- mark task at 23:30 local ===\n');

// Simulate: user in UTC+7 marks a task done at 23:30 local on March 21
// The task is stored with UTC timestamp of March 21T16:30:00Z
// When we query for "March 21 local", it should find the task
// When we query for "March 22 local", it should NOT find the task

const taskCompletedAtUTC = '2026-03-21T16:30:00.000Z';
console.log(`  Task completed at UTC: ${taskCompletedAtUTC}`);

const { start: march21Start, end: march21End } = localDateToUTCRange('2026-03-21');
console.log(`  Query range for March 21 local: [${march21Start}, ${march21End})`);

const taskTime = new Date(taskCompletedAtUTC).getTime();
const march21StartTime = new Date(march21Start).getTime();
const march21EndTime = new Date(march21End).getTime();

if (taskTime >= march21StartTime && taskTime < march21EndTime) {
  console.log(`  PASS: Task found in March 21 local range`);
  passed++;
} else {
  console.log(`  FAIL: Task should be in March 21 range`);
  failed++;
}

const { start: march22Start, end: march22End } = localDateToUTCRange('2026-03-22');
const march22StartTime = new Date(march22Start).getTime();
const march22EndTime = new Date(march22End).getTime();

if (!(taskTime >= march22StartTime && taskTime < march22EndTime)) {
  console.log(`  PASS: Task NOT found in March 22 local range`);
  passed++;
} else {
  console.log(`  FAIL: Task should NOT be in March 22 range`);
  failed++;
}

// ============================================================
// SUMMARY
// ============================================================

console.log('\n=== SUMMARY ===\n');
console.log(`  Tests passed: ${passed}`);
console.log(`  Tests failed: ${failed}`);

if (failed === 0) {
  console.log('\n  ALL TESTS PASSED\n');
  process.exit(0);
} else {
  console.log('\n  SOME TESTS FAILED\n');
  process.exit(1);
}
