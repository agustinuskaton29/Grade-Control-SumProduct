/**
 * Unit Test for Nickel Dome Calculator (Ore & Waste Classification Matrix with Fe %)
 * Acuan Standar Tambang Nikel Laterit (Fe >= 30% & Fe < 30%)
 */
const assert = require('assert');

function classifyOre(gradeNi, gradeFe) {
  const ni = parseFloat(gradeNi);
  const fe = parseFloat(gradeFe);

  const hasNi = !isNaN(ni) && gradeNi !== '' && gradeNi !== null && gradeNi !== undefined;
  const hasFe = !isNaN(fe) && gradeFe !== '' && gradeFe !== null && gradeFe !== undefined;

  if (!hasNi && !hasFe) {
    return {
      code: '-',
      name: 'Belum Ada Data',
      fullName: 'Belum Ada Data',
      ribbon: '-',
      criteria: '-',
      description: 'Belum ada data kadar sampel',
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700 font-semibold'
    };
  }

  const validNi = hasNi ? Math.max(0, ni) : 0;
  const validFe = hasFe ? Math.max(0, fe) : 0;

  if (validFe >= 30.0) {
    // Kelompok Fe >= 30%
    if (validNi >= 1.00) {
      return {
        code: 'LIMONITE',
        name: 'Limonite',
        fullName: 'LIMONITE (Limonite Ore)',
        ribbon: 'MERAH - KUNING',
        criteria: 'Ni ≥ 1.00% & Fe ≥ 30%',
        description: 'Limonite Ore (High Fe feed)',
        badgeClass: 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm border border-amber-300'
      };
    } else {
      return {
        code: 'OB',
        name: 'Overburden',
        fullName: 'OB (Overburden)',
        ribbon: 'BIRU',
        criteria: 'Ni ≤ 0.99% & Fe ≥ 30%',
        description: 'Overburden / Lapisan Penutup',
        badgeClass: 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-900/40 border border-blue-500'
      };
    }
  } else {
    // Kelompok Fe < 30%
    if (validNi >= 2.00) {
      return {
        code: 'HGS',
        name: 'High Grade Saprolite',
        fullName: 'HGS (High Grade Saprolite)',
        ribbon: 'MERAH',
        criteria: 'Ni ≥ 2.00% & Fe < 30%',
        description: 'High Grade Saprolite Ore for Smelter',
        badgeClass: 'bg-red-600 text-white font-bold shadow-sm shadow-red-900/40 border border-red-500'
      };
    } else if (validNi >= 1.70) {
      return {
        code: 'MGSO',
        name: 'Medium Grade Saprolite Ore',
        fullName: 'MGSO (Medium Grade Saprolite Ore)',
        ribbon: 'HIJAU',
        criteria: '1.70% ≤ Ni ≤ 1.99% & Fe < 30%',
        description: 'Medium Grade Saprolite Ore for Smelter',
        badgeClass: 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-900/40 border border-emerald-500'
      };
    } else if (validNi >= 1.50) {
      return {
        code: 'LGSO',
        name: 'Low Grade Saprolite Ore',
        fullName: 'LGSO (Low Grade Saprolite Ore)',
        ribbon: 'KUNING',
        criteria: '1.50% ≤ Ni ≤ 1.69% & Fe < 30%',
        description: 'Low Grade Saprolite Ore for Smelter',
        badgeClass: 'bg-yellow-400 text-slate-900 font-bold shadow-sm shadow-yellow-900/40 border border-yellow-300'
      };
    } else if (validNi >= 1.20) {
      return {
        code: 'SSO',
        name: 'Subgrade Saprolite Ore',
        fullName: 'SSO (Subgrade Saprolite Ore)',
        ribbon: 'PINK',
        criteria: '1.20% ≤ Ni ≤ 1.49% & Fe < 30%',
        description: 'Subgrade Saprolite Ore',
        badgeClass: 'bg-pink-400 text-slate-900 font-bold shadow-sm shadow-pink-900/40 border border-pink-300'
      };
    } else if (validNi >= 1.00) {
      return {
        code: 'KONSERVASI',
        name: 'Konservasi',
        fullName: 'KONSERVASI (Konservasi Ore)',
        ribbon: 'BIRU - PINK',
        criteria: '1.00% ≤ Ni ≤ 1.19% & Fe < 30%',
        description: 'Bijih Konservasi Tambang',
        badgeClass: 'bg-gradient-to-r from-blue-500 to-pink-500 text-white font-black shadow-sm border border-pink-400/50'
      };
    } else {
      return {
        code: 'WA',
        name: 'Waste Non-Ore',
        fullName: 'WA (Waste Non-Ore)',
        ribbon: 'PUTIH',
        criteria: 'Ni < 1.00% & Fe < 30%',
        description: 'Waste Non-Ore / Di luar batas',
        badgeClass: 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
      };
    }
  }
}

console.log('--- TEST 1: Klasifikasi Kelompok Fe >= 30% ---');

// 1. OB (Ni <= 0.99% & Fe >= 30%) -> Biru
const obTest1 = classifyOre(0.85, 45.0);
const obTest2 = classifyOre(0.99, 30.0);
assert.strictEqual(obTest1.code, 'OB');
assert.strictEqual(obTest1.ribbon, 'BIRU');
assert.strictEqual(obTest2.code, 'OB');
assert.strictEqual(obTest2.ribbon, 'BIRU');
console.log('✓ 1. OB (Ni <= 0.99%, Fe >= 30% -> BIRU) passed!');

// 2. LIMONITE (Ni >= 1.00% & Fe >= 30%) -> Merah - Kuning
const limoTest1 = classifyOre(1.20, 42.0);
const limoTest2 = classifyOre(1.00, 30.0);
assert.strictEqual(limoTest1.code, 'LIMONITE');
assert.strictEqual(limoTest1.ribbon, 'MERAH - KUNING');
assert.strictEqual(limoTest2.code, 'LIMONITE');
assert.strictEqual(limoTest2.ribbon, 'MERAH - KUNING');
console.log('✓ 2. LIMONITE (Ni >= 1.00%, Fe >= 30% -> MERAH - KUNING) passed!');

console.log('\n--- TEST 2: Klasifikasi Kelompok Fe < 30% ---');

// 3. KONSERVASI (1.00% <= Ni <= 1.19% & Fe < 30%) -> Biru - Pink
const konsTest1 = classifyOre(1.00, 22.0);
const konsTest2 = classifyOre(1.19, 15.0);
assert.strictEqual(konsTest1.code, 'KONSERVASI');
assert.strictEqual(konsTest1.ribbon, 'BIRU - PINK');
assert.strictEqual(konsTest2.code, 'KONSERVASI');
assert.strictEqual(konsTest2.ribbon, 'BIRU - PINK');
console.log('✓ 3. KONSERVASI (1.00% - 1.19%, Fe < 30% -> BIRU - PINK) passed!');

// 4. SSO (1.20% <= Ni <= 1.49% & Fe < 30%) -> Pink
const ssoTest1 = classifyOre(1.20, 18.0);
const ssoTest2 = classifyOre(1.49, 25.0);
assert.strictEqual(ssoTest1.code, 'SSO');
assert.strictEqual(ssoTest1.ribbon, 'PINK');
assert.strictEqual(ssoTest2.code, 'SSO');
assert.strictEqual(ssoTest2.ribbon, 'PINK');
console.log('✓ 4. SSO (1.20% - 1.49%, Fe < 30% -> PINK) passed!');

// 5. LGSO (1.50% <= Ni <= 1.69% & Fe < 30%) -> Kuning
const lgsoTest1 = classifyOre(1.50, 16.0);
const lgsoTest2 = classifyOre(1.69, 20.0);
assert.strictEqual(lgsoTest1.code, 'LGSO');
assert.strictEqual(lgsoTest1.ribbon, 'KUNING');
assert.strictEqual(lgsoTest2.code, 'LGSO');
assert.strictEqual(lgsoTest2.ribbon, 'KUNING');
console.log('✓ 5. LGSO (1.50% - 1.69%, Fe < 30% -> KUNING) passed!');

// 6. MGSO (1.70% <= Ni <= 1.99% & Fe < 30%) -> Hijau
const mgsoTest1 = classifyOre(1.70, 14.0);
const mgsoTest2 = classifyOre(1.99, 18.0);
assert.strictEqual(mgsoTest1.code, 'MGSO');
assert.strictEqual(mgsoTest1.ribbon, 'HIJAU');
assert.strictEqual(mgsoTest2.code, 'MGSO');
assert.strictEqual(mgsoTest2.ribbon, 'HIJAU');
console.log('✓ 6. MGSO (1.70% - 1.99%, Fe < 30% -> HIJAU) passed!');

// 7. HGS (Ni >= 2.00% & Fe < 30%) -> Merah
const hgsTest1 = classifyOre(2.00, 12.0);
const hgsTest2 = classifyOre(2.45, 18.5);
assert.strictEqual(hgsTest1.code, 'HGS');
assert.strictEqual(hgsTest1.ribbon, 'MERAH');
assert.strictEqual(hgsTest2.code, 'HGS');
assert.strictEqual(hgsTest2.ribbon, 'MERAH');
console.log('✓ 7. HGS (Ni >= 2.00%, Fe < 30% -> MERAH) passed!');

// 8. WA (Waste Non-Ore: Ni < 1.00% & Fe < 30%) -> Putih
const waTest1 = classifyOre(0.85, 20.0);
const waTest2 = classifyOre(0.20, 15.0);
assert.strictEqual(waTest1.code, 'WA');
assert.strictEqual(waTest1.ribbon, 'PUTIH');
assert.strictEqual(waTest2.code, 'WA');
assert.strictEqual(waTest2.ribbon, 'PUTIH');
console.log('✓ 8. WA (Ni < 1.00%, Fe < 30% -> PUTIH) passed!');

console.log('\n--- TEST 3: Weighted Average Fe & Ni Calculation ---');
const tonPerBucket = 2.2 * 1.10 * 1.70; // 4.114 ton/bkt
const sampleData = [
  { buckets: 4, ni: 2.10, fe: 14.0 }, // HGS: 16.456 ton
  { buckets: 3, ni: 1.85, fe: 18.0 }, // MGSO: 12.342 ton
  { buckets: 2, ni: 1.25, fe: 42.0 }, // LIMONITE: 8.228 ton
  { buckets: 2, ni: 1.10, fe: 20.0 }  // KONSERVASI: 8.228 ton
];

let totalTonnage = 0;
let totalTonNi = 0;
let totalTonFe = 0;

sampleData.forEach(s => {
  const ton = s.buckets * tonPerBucket;
  totalTonnage += ton;
  totalTonNi += ton * s.ni;
  totalTonFe += ton * s.fe;
});

const avgNi = totalTonNi / totalTonnage;
const avgFe = totalTonFe / totalTonnage;
const comp = classifyOre(avgNi, avgFe);

console.log(`Total Tonase: ${totalTonnage.toFixed(3)} ton (Expected: 45.254 ton)`);
console.log(`Weighted Avg Ni: ${avgNi.toFixed(3)}% (Expected: 1.695%)`);
console.log(`Weighted Avg Fe: ${avgFe.toFixed(3)}% (Expected: 21.273%)`);
console.log(`Composite Code: ${comp.code} (Expected: LGSO, since 1.50 <= Ni < 1.70 & Fe < 30%)`);
console.log(`Composite Ribbon: ${comp.ribbon}`);

assert.strictEqual(totalTonnage.toFixed(3), '45.254');
assert.strictEqual(avgNi.toFixed(3), '1.695');
assert.strictEqual(avgFe.toFixed(3), '21.273');
assert.strictEqual(comp.code, 'LGSO');
assert.strictEqual(comp.ribbon, 'KUNING');
console.log('✓ Weighted Average Fe and Ni calculation verified!');

console.log('\n--- TEST 4: Decimal Input Handler for Fe ---');

function processGradeInput(rawInput) {
  let val = rawInput;
  val = val.replace(/,/g, '.');
  val = val.replace(/[^0-9.]/g, '');
  const parts = val.split('.');
  if (parts.length > 2) {
    val = parts[0] + '.' + parts.slice(1).join('');
  }
  const numericGrade = parseFloat(val);
  return {
    formattedVal: val,
    numericGrade: isNaN(numericGrade) ? 0 : numericGrade
  };
}

const t1 = processGradeInput("35.5");
assert.strictEqual(t1.formattedVal, "35.5");
assert.strictEqual(t1.numericGrade, 35.5);

const t2 = processGradeInput("42,8");
assert.strictEqual(t2.formattedVal, "42.8");
assert.strictEqual(t2.numericGrade, 42.8);

const t3 = processGradeInput("12.4.6");
assert.strictEqual(t3.formattedVal, "12.46");
assert.strictEqual(t3.numericGrade, 12.46);

console.log('✓ Fe input handling with dot, comma conversion, and multiple dots sanitized successfully!');

console.log('\n>>> ALL 8 CLASSIFICATIONS, RIBBONS, AND FE ESTIMATION TESTS PASSED! <<<');
