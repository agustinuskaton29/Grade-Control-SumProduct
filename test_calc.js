/**
 * Unit Test for GCSP (Grade Control SumProduct) Calculation App
 * Tests for Pure Ni Classification, Safe New Sample, Comma-to-Dot Converter,
 * and Exclusion of Incomplete Rows from Dome Average.
 */
const assert = require('assert');

function classifyOre(gradeNi) {
  if (gradeNi === '' || gradeNi === null || gradeNi === undefined) {
    return {
      code: '-',
      name: 'Belum Ada Data',
      fullName: 'Belum Ada Data',
      ribbon: '-',
      description: 'Belum ada data kadar sampel',
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700 font-semibold'
    };
  }

  const ni = parseFloat(gradeNi);
  if (isNaN(ni)) {
    return {
      code: '-',
      name: 'Belum Ada Data',
      fullName: 'Belum Ada Data',
      ribbon: '-',
      description: 'Belum ada data kadar sampel',
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700 font-semibold'
    };
  }

  if (ni >= 2.00) {
    return {
      code: 'HGS',
      name: 'High Grade Saprolite',
      fullName: 'HGS (High Grade Saprolite)',
      ribbon: 'MERAH',
      description: 'High Grade Saprolite Ore for Smelter',
      badgeClass: 'bg-red-600 text-white font-bold shadow-sm shadow-red-900/40 border border-red-500'
    };
  } else if (ni >= 1.70) {
    return {
      code: 'MGSO',
      name: 'Medium Grade Saprolite Ore',
      fullName: 'MGSO (Medium Grade Saprolite Ore)',
      ribbon: 'HIJAU',
      description: 'Medium Grade Saprolite Ore for Smelter',
      badgeClass: 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-900/40 border border-emerald-500'
    };
  } else if (ni >= 1.50) {
    return {
      code: 'LGSO',
      name: 'Low Grade Saprolite Ore',
      fullName: 'LGSO (Low Grade Saprolite Ore)',
      ribbon: 'KUNING',
      description: 'Low Grade Saprolite Ore for Smelter',
      badgeClass: 'bg-yellow-400 text-slate-900 font-bold shadow-sm shadow-yellow-900/40 border border-yellow-300'
    };
  } else if (ni >= 1.20) {
    return {
      code: 'SSO',
      name: 'Subgrade Saprolite Ore',
      fullName: 'SSO (Subgrade Saprolite Ore)',
      ribbon: 'PINK',
      description: 'Subgrade Saprolite Ore',
      badgeClass: 'bg-pink-400 text-slate-900 font-bold shadow-sm shadow-pink-900/40 border border-pink-300'
    };
  } else if (ni >= 1.00) {
    return {
      code: 'KONSERVASI',
      name: 'Konservasi',
      fullName: 'KONSERVASI (Konservasi Ore)',
      ribbon: 'BIRU - PINK',
      description: 'Bijih Konservasi Tambang',
      badgeClass: 'bg-gradient-to-r from-blue-500 to-pink-500 text-white font-black shadow-sm border border-pink-400/50'
    };
  } else {
    return {
      code: 'WA',
      name: 'Waste Non-Ore',
      fullName: 'WA (Waste Non-Ore)',
      ribbon: 'PUTIH',
      description: 'Waste Non-Ore / Di luar batas',
      badgeClass: 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
    };
  }
}

function createNewSample() {
  return {
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    name: "",
    bucket: "",
    ni: ""
  };
}

function sanitizeDecimalInput(val) {
  if (typeof val !== 'string') val = String(val || '');
  val = val.replace(/,/g, '.');
  val = val.replace(/[^0-9.]/g, '');
  const parts = val.split('.');
  if (parts.length > 2) {
    val = parts[0] + '.' + parts.slice(1).join('');
  }
  return val;
}

console.log('--- TEST 1: Klasifikasi Ore Berbasis Ni % ---');

// HGS (Ni >= 2.00%)
const hgs = classifyOre(2.15);
assert.strictEqual(hgs.code, 'HGS');
assert.strictEqual(hgs.ribbon, 'MERAH');
console.log('✓ HGS (Ni >= 2.00% -> MERAH) passed!');

// MGSO (1.70% <= Ni <= 1.99%)
const mgso = classifyOre(1.85);
assert.strictEqual(mgso.code, 'MGSO');
assert.strictEqual(mgso.ribbon, 'HIJAU');
console.log('✓ MGSO (1.70% - 1.99% -> HIJAU) passed!');

// LGSO (1.50% <= Ni <= 1.69%)
const lgso = classifyOre(1.55);
assert.strictEqual(lgso.code, 'LGSO');
assert.strictEqual(lgso.ribbon, 'KUNING');
console.log('✓ LGSO (1.50% - 1.69% -> KUNING) passed!');

// SSO (1.20% <= Ni <= 1.49%)
const sso = classifyOre(1.35);
assert.strictEqual(sso.code, 'SSO');
assert.strictEqual(sso.ribbon, 'PINK');
console.log('✓ SSO (1.20% - 1.49% -> PINK) passed!');

// KONSERVASI (1.00% <= Ni <= 1.19%)
const kons = classifyOre(1.10);
assert.strictEqual(kons.code, 'KONSERVASI');
assert.strictEqual(kons.ribbon, 'BIRU - PINK');
console.log('✓ KONSERVASI (1.00% - 1.19% -> BIRU - PINK) passed!');

// WA (Ni < 1.00%)
const wa = classifyOre(0.85);
assert.strictEqual(wa.code, 'WA');
assert.strictEqual(wa.ribbon, 'PUTIH');
console.log('✓ WA (Ni < 1.00% -> PUTIH) passed!');

// Empty / Null / Invalid
const emptyTest = classifyOre('');
assert.strictEqual(emptyTest.code, '-');
console.log('✓ Empty value -> "-" passed!');

console.log('\n--- TEST 2: Safe New Sample Creation ---');
const sample = createNewSample();
assert.strictEqual(sample.name, "");
assert.strictEqual(sample.bucket, "");
assert.strictEqual(sample.ni, "");
assert.ok(typeof sample.id === 'string' && sample.id.length > 5);
console.log('✓ createNewSample() returns empty fields with unique ID passed!');

console.log('\n--- TEST 3: Sanitasi Input Desimal Koma ke Titik ---');
assert.strictEqual(sanitizeDecimalInput('1,85'), '1.85');
assert.strictEqual(sanitizeDecimalInput('2.10'), '2.10');
assert.strictEqual(sanitizeDecimalInput('1,2,3'), '1.23');
assert.strictEqual(sanitizeDecimalInput('abc1,5%'), '1.5');
console.log('✓ Decimal comma-to-dot & non-numeric sanitizer passed!');

console.log('\n--- TEST 4: Perhitungan Komposit & Pengabaian Data Belum Lengkap ---');
const tonPerBucket = 2.2 * 1.1 * 1.7; // 4.114 t/bkt

const testSamples = [
  { name: 'S1', bucket: '4', ni: '2.10' }, // Complete
  { name: 'S2', bucket: '3', ni: '1.85' }, // Complete
  { name: 'S3', bucket: '', ni: '' },      // Incomplete - must be ignored
  { name: 'S4', bucket: '5', ni: '' },     // Incomplete - must be ignored
  { name: 'S5', bucket: '', ni: '1.50' }   // Incomplete - must be ignored
];

let totalBuckets = 0;
let totalTonnage = 0;
let totalTonNi = 0;

testSamples.forEach(s => {
  const hasBucket = s.bucket !== '' && !isNaN(parseFloat(s.bucket)) && parseFloat(s.bucket) > 0;
  const hasNi = s.ni !== '' && !isNaN(parseFloat(s.ni));
  if (hasBucket && hasNi) {
    const bkt = parseFloat(s.bucket);
    const ni = parseFloat(s.ni);
    const ton = bkt * tonPerBucket;
    totalBuckets += bkt;
    totalTonnage += ton;
    totalTonNi += ton * ni;
  }
});

assert.strictEqual(totalBuckets, 7); // 4 + 3
const expectedTonnage = 7 * tonPerBucket;
assert.ok(Math.abs(totalTonnage - expectedTonnage) < 0.001);

const weightedAvg = totalTonNi / totalTonnage;
// S1: 4 * tonPerBkt * 2.10 = 8.4 * tonPerBkt
// S2: 3 * tonPerBkt * 1.85 = 5.55 * tonPerBkt
// Sum tonNi = (8.4 + 5.55) * tonPerBkt = 13.95 * tonPerBkt
// Avg = 13.95 / 7 = 1.992857...
const expectedAvg = (4 * 2.10 + 3 * 1.85) / 7;
assert.ok(Math.abs(weightedAvg - expectedAvg) < 0.0001);

const composite = classifyOre(weightedAvg);
assert.strictEqual(composite.code, 'MGSO');
console.log(`✓ Weighted Average: ${weightedAvg.toFixed(3)}% Ni -> ${composite.code} (${composite.ribbon}) passed!`);
console.log('✓ Incomplete rows are strictly ignored from composite calculations passed!');

console.log('\n>>> ALL UNIT TESTS PASSED SUCCESSFULLY! <<<');
