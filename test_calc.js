/**
 * Unit Test for Nickel Dome Calculator (Saprolite Ore Classification Matrix)
 * Acuan Kadar Ni & Fe < 30%
 */
const assert = require('assert');

function classifyOre(gradeNi) {
  const ni = parseFloat(gradeNi) || 0;
  if (ni <= 0) return { code: '-', name: 'Belum Ada Data', description: '-' };
  if (ni >= 2.0) {
    return {
      code: 'HGSO',
      name: 'High Grade Saprolite Ore',
      description: 'High grade Ni stockpile for Smelter'
    };
  } else if (ni >= 1.7) {
    return {
      code: 'MGSO',
      name: 'Medium Grade Saprolite Ore',
      description: 'Medium grade Ni stockpile for Smelter'
    };
  } else if (ni >= 1.5) {
    return {
      code: 'LGSO',
      name: 'Low Grade Saprolite Ore',
      description: 'Low grade Ni stockpile for Smelter'
    };
  } else if (ni >= 1.2) {
    return {
      code: 'SSO',
      name: 'Subgrade Saprolite Ore',
      description: 'Subgrade Saprolite Ore'
    };
  } else {
    return {
      code: '(K)',
      name: '(K)',
      description: 'Kadar di bawah cut-off Saprolite Ore (< 1.2% Ni)'
    };
  }
}

console.log('--- TEST 1: Saprolite Ore Classification Matrix (Ni & Fe < 30%) ---');

// 1. HGSO (Ni >= 2.0%)
const hgsoTest1 = classifyOre(2.35);
const hgsoTest2 = classifyOre(2.00);
assert.strictEqual(hgsoTest1.code, 'HGSO');
assert.strictEqual(hgsoTest1.description, 'High grade Ni stockpile for Smelter');
assert.strictEqual(hgsoTest2.code, 'HGSO');
console.log('✓ 1. HGSO (Ni >= 2.0%) passed!');

// 2. MGSO (1.7% <= Ni < 2.0%)
const mgsoTest1 = classifyOre(1.99);
const mgsoTest2 = classifyOre(1.70);
assert.strictEqual(mgsoTest1.code, 'MGSO');
assert.strictEqual(mgsoTest1.description, 'Medium grade Ni stockpile for Smelter');
assert.strictEqual(mgsoTest2.code, 'MGSO');
console.log('✓ 2. MGSO (1.7% <= Ni < 2.0%) passed!');

// 3. LGSO (1.5% <= Ni < 1.7%)
const lgsoTest1 = classifyOre(1.69);
const lgsoTest2 = classifyOre(1.50);
assert.strictEqual(lgsoTest1.code, 'LGSO');
assert.strictEqual(lgsoTest1.description, 'Low grade Ni stockpile for Smelter');
assert.strictEqual(lgsoTest2.code, 'LGSO');
console.log('✓ 3. LGSO (1.5% <= Ni < 1.7%) passed!');

// 4. SSO (1.2% <= Ni < 1.5%) - Subgrade Saprolite Ore
const ssoTest1 = classifyOre(1.49);
const ssoTest2 = classifyOre(1.20);
assert.strictEqual(ssoTest1.code, 'SSO');
assert.strictEqual(ssoTest1.name, 'Subgrade Saprolite Ore');
assert.strictEqual(ssoTest1.description, 'Subgrade Saprolite Ore');
assert.strictEqual(ssoTest2.code, 'SSO');
console.log('✓ 4. SSO (Subgrade Saprolite Ore) passed!');

// 5. Below cut-off (< 1.2% Ni) -> (K)
const kTest1 = classifyOre(1.19);
const kTest2 = classifyOre(0.85);
assert.strictEqual(kTest1.code, '(K)');
assert.strictEqual(kTest1.name, '(K)');
assert.strictEqual(kTest2.code, '(K)');
console.log('✓ 5. (K) (< 1.2% Ni) passed!');

console.log('\n--- TEST 2: Calculations & Composite Classification ---');
const tonPerBucket = 2.2 * 1.10 * 1.70; // 4.114 ton/bkt
const defaultSamples = [
  { buckets: 4, ni: 2.10 }, // HGSO
  { buckets: 2, ni: 1.85 }, // MGSO
  { buckets: 2, ni: 1.55 }  // LGSO
];

let totalTonnage = 0;
let totalTonNi = 0;

defaultSamples.forEach(s => {
  const ton = s.buckets * tonPerBucket;
  totalTonnage += ton;
  totalTonNi += ton * s.ni;
});

const avgNi = totalTonNi / totalTonnage;
const comp = classifyOre(avgNi);

console.log(`Total Tonase: ${totalTonnage.toFixed(3)} t (Expected: 32.912 t)`);
console.log(`Weighted Avg Ni: ${avgNi.toFixed(3)}% (Expected: 1.900%)`);
console.log(`Composite Code: ${comp.code} (Expected: MGSO)`);
console.log(`Peruntukan Stockpile: ${comp.description}`);

assert.strictEqual(totalTonnage.toFixed(3), '32.912');
assert.strictEqual(avgNi.toFixed(3), '1.900');
assert.strictEqual(comp.code, 'MGSO');
assert.strictEqual(comp.description, 'Medium grade Ni stockpile for Smelter');
console.log('✓ Composite calculation and abbreviation badge verified successfully!');

console.log('\n--- TEST 3: Decimal Input Handler & Normalization Logic ---');

function processGradeInput(rawInput) {
  let val = rawInput;
  // 1. Jika user tidak sengaja mengetik koma, otomatis ubah menjadi titik
  val = val.replace(/,/g, '.');
  // 2. Cegah input selain angka dan titik
  val = val.replace(/[^0-9.]/g, '');
  // 3. Pastikan hanya ada 1 tanda titik desimal
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

// 1. Normal decimal with dot: "1.35"
const t1 = processGradeInput("1.35");
assert.strictEqual(t1.formattedVal, "1.35");
assert.strictEqual(t1.numericGrade, 1.35);
console.log('✓ Normal decimal "1.35" accepted');

// 2. Decimal with comma: "1,35" -> "1.35"
const t2 = processGradeInput("1,35");
assert.strictEqual(t2.formattedVal, "1.35");
assert.strictEqual(t2.numericGrade, 1.35);
console.log('✓ Comma input "1,35" converted to "1.35"');

// 3. Trailing dot during typing: "1."
const t3 = processGradeInput("1.");
assert.strictEqual(t3.formattedVal, "1.");
assert.strictEqual(t3.numericGrade, 1.0);
console.log('✓ In-progress typing "1." preserved without error');

// 4. Multiple dots: "1.3.5" -> "1.35"
const t4 = processGradeInput("1.3.5");
assert.strictEqual(t4.formattedVal, "1.35");
assert.strictEqual(t4.numericGrade, 1.35);
console.log('✓ Multiple dots "1.3.5" sanitized to "1.35"');

// 5. Invalid characters: "1.35% abc" -> "1.35"
const t5 = processGradeInput("1.35% abc");
assert.strictEqual(t5.formattedVal, "1.35");
assert.strictEqual(t5.numericGrade, 1.35);
console.log('✓ Non-numeric characters stripped successfully');

// 6. Leading dot: ".8" -> 0.8
const t6 = processGradeInput(".8");
assert.strictEqual(t6.formattedVal, ".8");
assert.strictEqual(t6.numericGrade, 0.8);
console.log('✓ Leading dot ".8" parsed correctly as 0.8');

// 7. Empty input: "" -> 0
const t7 = processGradeInput("");
assert.strictEqual(t7.formattedVal, "");
assert.strictEqual(t7.numericGrade, 0);
console.log('✓ Empty input gracefully defaults to 0');

console.log('\n--- TEST 4: New Empty Sample Initialization & Calculation ---');
const newSample = {
  id: Date.now(),
  name: "",
  bucket: "",
  buckets: "",
  grade: "",
  gradeNi: "",
  rawGrade: ""
};

assert.strictEqual(newSample.name, "");
assert.strictEqual(newSample.bucket, "");
assert.strictEqual(newSample.grade, "");
console.log('✓ New sample row contains pure empty strings (name="", bucket="", grade="")');

function calcSample(sample, tonPerBkt) {
  const rawBkt = (sample.buckets !== undefined && sample.buckets !== '') ? sample.buckets : sample.bucket;
  const rawGrd = (sample.gradeNi !== undefined && sample.gradeNi !== '') ? sample.gradeNi : (sample.grade !== undefined && sample.grade !== '' ? sample.grade : sample.rawGrade);
  const buckets = parseFloat(rawBkt) || 0;
  const gradeNi = parseFloat(rawGrd) || 0;
  const tonnage = buckets * tonPerBkt;
  const tonNi = tonnage * gradeNi;
  const classification = classifyOre(gradeNi);
  return { buckets, gradeNi, tonnage, tonNi, classification };
}

const emptyCalc = calcSample(newSample, 4.114);
assert.strictEqual(emptyCalc.buckets, 0);
assert.strictEqual(emptyCalc.gradeNi, 0);
assert.strictEqual(emptyCalc.tonnage, 0);
assert.strictEqual(emptyCalc.tonNi, 0);
assert.strictEqual(emptyCalc.classification.code, '-');
console.log('✓ Empty sample safely calculates 0 ton, 0 tonNi, and "-" classification without error');

console.log('\n>>> ALL SAPROLITE, DECIMAL & EMPTY ROW TESTS PASSED! <<<');


