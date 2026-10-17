/**
 * GCSP (Grade Control SumProduct) Calculation App
 * Tagline: Quick Calculation, Better Grade Control
 * Grade Control & Stockpile Blending Estimation System
 * PT / Mine Site Grade Control Specification (Exca 40 Ton)
 * Single-Element Assay (Ni %) & Clean Responsive Architecture
 */

// Initial State and Configuration
const DEFAULT_CONFIG = {
  excavatorType: 'Exca 40 ton',
  bucketCapacity: 2.2,    // m³
  fillFactor: 1.10,       // 110%
  oreDensity: 1.70,       // ton/m³
  cog: 1.20,              // Cut Off Grade (%)
  decimalPlaces: 3,       // 3 or 4 decimals display
  domeInfo: {
    domeId: '',
    pitLocation: '',
    date: new Date().toISOString().split('T')[0],
    geologist: ''
  }
};

// Default Sample Data: Array kosong (Empty State)
const DEFAULT_SAMPLES = [];

// Sample Data untuk Tombol 'Muat Data Contoh'
const EXAMPLE_SAMPLES = [
  { id: '1', name: 'Pit 1 - Blok A (HGS)', bucket: 4, buckets: 4, ni: 2.10, gradeNi: 2.10, rawGrade: '2.10', rawGradeNi: '2.10', fe: 14.5, gradeFe: 14.5, rawGradeFe: '14.5' },
  { id: '2', name: 'Pit 1 - Blok B (MGSO)', bucket: 3, buckets: 3, ni: 1.85, gradeNi: 1.85, rawGrade: '1.85', rawGradeNi: '1.85', fe: 18.2, gradeFe: 18.2, rawGradeFe: '18.2' },
  { id: '3', name: 'Pit 2 - Blok C (LIMONITE)', bucket: 2, buckets: 2, ni: 1.25, gradeNi: 1.25, rawGrade: '1.25', rawGradeNi: '1.25', fe: 42.0, gradeFe: 42.0, rawGradeFe: '42.0' },
  { id: '4', name: 'Pit 2 - Blok D (KONSERVASI)', bucket: 2, buckets: 2, ni: 1.10, gradeNi: 1.10, rawGrade: '1.10', rawGradeNi: '1.10', fe: 22.5, gradeFe: 22.5, rawGradeFe: '22.5' }
];

/**
 * Matriks Klasifikasi Standar Tambang Nikel Laterit & Warna Pita Penandaan (Flagging Ribbon):
 * 
 * A. Kelompok Fe ≥ 30%:
 * 1. OB (Overburden): Ni ≤ 0.99% & Fe ≥ 30% | Pita: BIRU (bg-blue-600 text-white)
 * 2. LIMONITE: Ni ≥ 1.00% & Fe ≥ 30% | Pita: MERAH - KUNING (Dual-tone gradient)
 * 
 * B. Kelompok Fe < 30%:
 * 3. KONSERVASI: 1.00% ≤ Ni ≤ 1.19% & Fe < 30% | Pita: BIRU - PINK (Dual-tone gradient)
 * 4. SSO: 1.20% ≤ Ni ≤ 1.49% & Fe < 30% | Pita: PINK (bg-pink-400 text-slate-900)
 * 5. LGSO: 1.50% ≤ Ni ≤ 1.69% & Fe < 30% | Pita: KUNING (bg-yellow-400 text-slate-900)
 * 6. MGSO: 1.70% ≤ Ni ≤ 1.99% & Fe < 30% | Pita: HIJAU (bg-emerald-600 text-white)
 * 7. HGS: Ni ≥ 2.00% & Fe < 30% | Pita: MERAH (bg-red-600 text-white)
 * 
 * C. Khusus:
 * 8. WA: Ni < 1.00% & Fe < 30% (Waste Non-Ore / Di luar batas) | Pita: PUTIH (bg-white text-slate-900)
 */
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

/**
 * Global Grade Input Handler - Mendukung format desimal fleksibel (titik & koma)
 * Mencegah karakter non-numerik, otomatis konversi koma ke titik,
 * dan memastikan hanya ada 1 tanda desimal.
 * Parameter 'field': 'ni' untuk Kadar Ni (%), 'fe' untuk Kadar Fe (%)
 */
function handleGradeInput(e, sampleId, field = 'ni') {
  const id = sampleId || (e && e.target ? e.target.dataset.id : null);
  let val = e.target.value;

  // 1. Jika user tidak sengaja mengetik koma, otomatis ubah menjadi titik
  val = val.replace(/,/g, '.');

  // 2. Cegah input selain angka dan titik
  val = val.replace(/[^0-9.]/g, '');

  // 3. Pastikan hanya ada 1 tanda titik desimal
  const parts = val.split('.');
  if (parts.length > 2) {
    val = parts[0] + '.' + parts.slice(1).join('');
  }

  // 4. Update kembali nilai di tampilan input secara langsung
  e.target.value = val;

  // 5. Parse ke float untuk perhitungan tonase x Ni dan komposit
  const numericGrade = parseFloat(val);

  // Kirim ke state aplikasi (jika kosong atau tidak valid, simpan 0)
  if (field === 'fe') {
    updateSampleFe(id, isNaN(numericGrade) ? 0 : numericGrade, val, e.target);
  } else {
    updateSampleNi(id, isNaN(numericGrade) ? 0 : numericGrade, val, e.target);
  }
}

function updateSampleNi(sampleId, numericGrade, rawVal, sourceInput) {
  if (window.nickelApp) {
    window.nickelApp.updateSampleGrade(sampleId, numericGrade, rawVal, sourceInput);
  }
}

function updateSampleFe(sampleId, numericGrade, rawVal, sourceInput) {
  if (window.nickelApp) {
    window.nickelApp.updateSampleFe(sampleId, numericGrade, rawVal, sourceInput);
  }
}

// Make accessible to global window scope for inline oninput attributes
window.handleGradeInput = handleGradeInput;
window.updateSampleNi = updateSampleNi;
window.updateSampleFe = updateSampleFe;

class NickelDomeCalculator {
  constructor() {
    this.config = { ...DEFAULT_CONFIG, domeInfo: { ...DEFAULT_CONFIG.domeInfo } };
    this.samples = [];
    this.chartInstance = null;
    this.init();
  }

  init() {
    try {
      localStorage.removeItem('nickel_dome_calc_state');
    } catch (e) { }
    this.samples = [];
    this.cacheDomElements();
    this.bindEvents();
    this.populateConfigInputs();
    this.render();
    this.initChart();
  }

  cacheDomElements() {
    // Accordion Toggle: support both toggle-params-btn / param-content and legacy IDs
    this.btnToggleParams = document.getElementById('toggle-params-btn') || document.getElementById('btn-toggle-params');
    this.accordionParamsContent = document.getElementById('param-content') || document.getElementById('accordion-params-content');
    this.chevronParams = document.getElementById('chevron-params');

    // Parameters Elements
    this.inputBucketCapacity = document.getElementById('param-bucket-capacity');
    this.inputFillFactor = document.getElementById('param-fill-factor');
    this.inputOreDensity = document.getElementById('param-ore-density');
    this.badgeTonnagePerBucket = document.getElementById('badge-tonnage-per-bucket');
    this.formulaTonnageDetail = document.getElementById('formula-tonnage-detail');
    this.btnResetParams = document.getElementById('btn-reset-params');

    // Dome Info Elements
    this.inputDomeId = document.getElementById('dome-id');
    this.inputPitLocation = document.getElementById('dome-pit');
    this.inputDate = document.getElementById('dome-date');
    this.inputGeologist = document.getElementById('dome-geologist');

    // COG and Precision
    this.inputCog = document.getElementById('input-cog');
    this.selectDecimals = document.getElementById('select-decimals');

    // Summary Cards Elements (Bottom Block)
    this.cardTotalBuckets = document.getElementById('summary-total-buckets');
    this.cardTotalTonnage = document.getElementById('summary-total-tonnage');
    this.cardAvgGrade = document.getElementById('summary-avg-grade');
    this.cardAvgFe = document.getElementById('summary-avg-fe');
    this.cardFeCategory = document.getElementById('summary-fe-category');
    this.cardCogStatusBadge = document.getElementById('summary-cog-badge');
    this.cardCogDelta = document.getElementById('summary-cog-delta');
    this.cardOreClass = document.getElementById('summary-ore-classification');
    this.cardTotalMetalNi = document.getElementById('summary-total-metal-ni');

    // Table & Mobile Cards Containers
    this.tableBody = document.getElementById('sample-table-body');
    this.mobileCardsContainer = document.getElementById('sample-cards-mobile');
    this.sampleCountBadge = document.getElementById('sample-count-badge');

    // Table Footers
    this.tableTotalBuckets = document.getElementById('footer-total-buckets');
    this.tableTotalTonnage = document.getElementById('footer-total-tonnage');
    this.tableAvgGrade = document.getElementById('footer-avg-grade');
    this.tableAvgFe = document.getElementById('footer-avg-fe');
    this.tableTotalTonGrade = document.getElementById('footer-total-ton-grade');
    this.tableCompositeClass = document.getElementById('footer-composite-classification');

    // Buttons: support both add-row-btn and btn-add-sample
    this.btnAddSample = document.getElementById('add-row-btn') || document.getElementById('btn-add-sample');
    this.btnAddSampleMobile = document.getElementById('btn-add-sample-mobile');
    this.btnLoadExample = document.getElementById('btn-load-example');
    this.btnResetAll = document.getElementById('btn-reset-all');
    this.btnExportCsv = document.getElementById('btn-export-csv');
    this.btnPrintReport = document.getElementById('btn-print-report');
    this.sampleSearch = document.getElementById('sample-search');
  }

  bindEvents() {
    // Accordion Parameter Toggle
    const toggleParamBtn = this.btnToggleParams;
    const paramContent = this.accordionParamsContent;
    if (toggleParamBtn && paramContent) {
      toggleParamBtn.addEventListener('click', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        paramContent.classList.toggle('hidden');
        paramContent.classList.toggle('collapsed');
        const isHidden = paramContent.classList.contains('hidden') || paramContent.classList.contains('collapsed');
        if (this.chevronParams) {
          this.chevronParams.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      });
    }

    // Parameter Inputs
    const paramInputs = [this.inputBucketCapacity, this.inputFillFactor, this.inputOreDensity];
    paramInputs.forEach(input => {
      if (input) {
        input.addEventListener('input', () => {
          this.updateParametersFromUI();
          this.render();
        });
      }
    });

    if (this.btnResetParams) {
      this.btnResetParams.addEventListener('click', () => {
        this.config.bucketCapacity = DEFAULT_CONFIG.bucketCapacity;
        this.config.fillFactor = DEFAULT_CONFIG.fillFactor;
        this.config.oreDensity = DEFAULT_CONFIG.oreDensity;
        this.populateConfigInputs();
        this.render();
        this.showToast('Parameter alat & material dikembalikan ke default.', 'info');
      });
    }

    // COG Input
    if (this.inputCog) {
      this.inputCog.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.config.cog = isNaN(val) || val < 0 ? 0 : val;
        this.render();
      });
    }

    // Decimals Precision Toggle
    if (this.selectDecimals) {
      this.selectDecimals.addEventListener('change', (e) => {
        this.config.decimalPlaces = parseInt(e.target.value, 10) || 3;
        this.render();
      });
    }

    // Dome Meta Inputs
    const metaInputs = [
      { el: this.inputDomeId, key: 'domeId' },
      { el: this.inputPitLocation, key: 'pitLocation' },
      { el: this.inputDate, key: 'date' },
      { el: this.inputGeologist, key: 'geologist' }
    ];
    metaInputs.forEach(item => {
      if (item.el) {
        item.el.addEventListener('input', (e) => {
          this.config.domeInfo[item.key] = e.target.value;
          this.saveToLocalStorage();
          this.updatePrintMeta();
        });
      }
    });

    // Sample Actions: Event Listener Tombol "+ Tambah Baris"
    const addRowBtn = this.btnAddSample;
    if (addRowBtn) {
      addRowBtn.addEventListener('click', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.addSampleRow();
      });
    }

    const addRowMobileBtn = this.btnAddSampleMobile;
    if (addRowMobileBtn) {
      addRowMobileBtn.addEventListener('click', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.addSampleRow();
      });
    }

    if (this.btnLoadExample) this.btnLoadExample.addEventListener('click', () => this.loadExampleData());
    if (this.btnResetAll) this.btnResetAll.addEventListener('click', () => this.resetAllData());
    if (this.btnExportCsv) this.btnExportCsv.addEventListener('click', () => this.exportToCsv());
    if (this.btnPrintReport) this.btnPrintReport.addEventListener('click', () => this.printReport());

    // Search / Filter
    if (this.sampleSearch) {
      this.sampleSearch.addEventListener('input', (e) => {
        this.renderBothViews(e.target.value.trim().toLowerCase());
      });
    }
  }

  // --- CALCULATION LOGIC ---

  getTonnagePerBucket() {
    const cap = parseFloat(this.config.bucketCapacity) || 0;
    const ff = parseFloat(this.config.fillFactor) || 0;
    const dens = parseFloat(this.config.oreDensity) || 0;
    return cap * ff * dens;
  }

  calculateSample(sample, tonnagePerBucket) {
    if (!sample) {
      return {
        buckets: 0,
        gradeNi: 0,
        gradeFe: 0,
        tonnage: 0,
        tonNi: 0,
        tonFe: 0,
        classification: classifyOre(0, 0)
      };
    }

    // Tangani nilai kosong/undefined/null secara aman
    const rawBkt = (sample.bucket !== undefined && sample.bucket !== null && sample.bucket !== '')
      ? sample.bucket
      : ((sample.buckets !== undefined && sample.buckets !== null && sample.buckets !== '') ? sample.buckets : '');

    const rawGrd = (sample.ni !== undefined && sample.ni !== null && sample.ni !== '')
      ? sample.ni
      : ((sample.gradeNi !== undefined && sample.gradeNi !== null && sample.gradeNi !== '')
          ? sample.gradeNi
          : ((sample.rawGrade !== undefined && sample.rawGrade !== null) ? sample.rawGrade : (sample.grade || '')));

    const rawFe = (sample.fe !== undefined && sample.fe !== null && sample.fe !== '')
      ? sample.fe
      : ((sample.gradeFe !== undefined && sample.gradeFe !== null && sample.gradeFe !== '')
          ? sample.gradeFe
          : ((sample.rawGradeFe !== undefined && sample.rawGradeFe !== null) ? sample.rawGradeFe : ''));

    // Gunakan parseFloat(val) || 0 agar aman dari NaN atau crash komputasi
    const buckets = parseFloat(rawBkt) || 0;
    const gradeNi = parseFloat(rawGrd) || 0;
    const gradeFe = parseFloat(rawFe) || 0;

    const tonnage = buckets * (parseFloat(tonnagePerBucket) || 0);
    const tonNi = tonnage * gradeNi;
    const tonFe = tonnage * gradeFe;
    const classification = classifyOre(gradeNi, gradeFe);

    return {
      buckets,
      gradeNi,
      gradeFe,
      tonnage,
      tonNi,
      tonFe,
      classification
    };
  }

  calculateSummary() {
    const tonnagePerBucket = this.getTonnagePerBucket();
    let totalBuckets = 0;
    let totalTonnage = 0;
    let totalTonNi = 0;
    let totalTonFe = 0;

    this.samples.forEach(sample => {
      const calc = this.calculateSample(sample, tonnagePerBucket);
      totalBuckets += calc.buckets;
      totalTonnage += calc.tonnage;
      totalTonNi += calc.tonNi;
      totalTonFe += calc.tonFe;
    });

    let weightedAvgGrade = 0;
    let weightedAvgFe = 0;
    if (totalTonnage > 0) {
      weightedAvgGrade = totalTonNi / totalTonnage;
      weightedAvgFe = totalTonFe / totalTonnage;
    }

    const compositeClassification = totalTonnage > 0
      ? classifyOre(weightedAvgGrade, weightedAvgFe)
      : { code: '-', name: 'Belum Ada Ore', ribbon: '-', badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700' };

    return {
      tonnagePerBucket,
      totalBuckets,
      totalTonnage,
      totalTonNi,
      totalTonFe,
      weightedAvgGrade,
      weightedAvgFe,
      compositeClassification
    };
  }

  // --- UI UPDATERS ---

  updateParametersFromUI() {
    if (this.inputBucketCapacity) this.config.bucketCapacity = parseFloat(this.inputBucketCapacity.value) || 0;
    if (this.inputFillFactor) this.config.fillFactor = parseFloat(this.inputFillFactor.value) || 0;
    if (this.inputOreDensity) this.config.oreDensity = parseFloat(this.inputOreDensity.value) || 0;
    this.saveToLocalStorage();
  }

  populateConfigInputs() {
    if (this.inputBucketCapacity) this.inputBucketCapacity.value = this.config.bucketCapacity;
    if (this.inputFillFactor) this.inputFillFactor.value = this.config.fillFactor;
    if (this.inputOreDensity) this.inputOreDensity.value = this.config.oreDensity;
    if (this.inputCog) this.inputCog.value = this.config.cog.toFixed(2);
    if (this.selectDecimals) this.selectDecimals.value = this.config.decimalPlaces.toString();

    if (this.inputDomeId) this.inputDomeId.value = this.config.domeInfo.domeId || '';
    if (this.inputPitLocation) this.inputPitLocation.value = this.config.domeInfo.pitLocation || '';
    if (this.inputDate) this.inputDate.value = this.config.domeInfo.date || '';
    if (this.inputGeologist) this.inputGeologist.value = this.config.domeInfo.geologist || '';
  }

  render() {
    const summary = this.calculateSummary();

    // 1. Update Parameter Card Display
    const tonPerBkt = summary.tonnagePerBucket.toFixed(3);
    if (this.badgeTonnagePerBucket) this.badgeTonnagePerBucket.textContent = `${tonPerBkt} ton/bucket`;
    if (this.formulaTonnageDetail) {
      this.formulaTonnageDetail.textContent =
        `(${this.config.bucketCapacity} m³ × ${this.config.fillFactor} × ${this.config.oreDensity} t/m³) = ${tonPerBkt} ton/bucket`;
    }

    // 2. Render Table (Desktop) & Cards (Mobile)
    const searchTerm = this.sampleSearch ? this.sampleSearch.value.trim().toLowerCase() : '';
    this.renderBothViews(searchTerm, summary);

    // 3. Update Summary Displays & Footer Totals
    this.updateSummaryDisplays(summary);
  }

  updateSummaryDisplays(summary) {
    const dec = this.config.decimalPlaces;

    // Summary Cards (Positioned in Bottom Block)
    if (this.cardTotalBuckets) this.cardTotalBuckets.textContent = summary.totalBuckets.toLocaleString('id-ID');
    if (this.cardTotalTonnage) this.cardTotalTonnage.textContent = summary.totalTonnage.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) + ' t';

    if (this.cardTotalMetalNi) {
      const pureMetalNi = (summary.totalTonNi / 100);
      this.cardTotalMetalNi.textContent = pureMetalNi.toFixed(3) + ' t Ni';
    }

    if (this.sampleCountBadge) {
      this.sampleCountBadge.textContent = `${this.samples.length} Sampel Aktif`;
    }

    // Average Fe & Fe Category
    if (summary.totalTonnage === 0) {
      if (this.cardAvgFe) {
        this.cardAvgFe.textContent = `0.${'0'.repeat(dec)}%`;
        this.cardAvgFe.className = 'text-3xl sm:text-4xl font-extrabold font-mono-calc text-slate-400';
      }
      if (this.cardFeCategory) {
        this.cardFeCategory.innerHTML = `<span class="text-slate-400">-</span>`;
      }
    } else {
      const formattedAvgFe = summary.weightedAvgFe.toFixed(dec) + '%';
      if (this.cardAvgFe) this.cardAvgFe.textContent = formattedAvgFe;

      const isHighFe = summary.weightedAvgFe >= 30.0;
      if (isHighFe) {
        if (this.cardAvgFe) this.cardAvgFe.className = 'text-3xl sm:text-4xl font-extrabold font-mono-calc text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]';
        if (this.cardFeCategory) {
          this.cardFeCategory.innerHTML = `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-950/80 text-sky-300 border border-sky-500/40">
              <span class="w-2 h-2 rounded-full bg-sky-400"></span> Fe ≥ 30% (High Fe)
            </span>
          `;
        }
      } else {
        if (this.cardAvgFe) this.cardAvgFe.className = 'text-3xl sm:text-4xl font-extrabold font-mono-calc text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]';
        if (this.cardFeCategory) {
          this.cardFeCategory.innerHTML = `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-950/80 text-orange-300 border border-orange-500/40">
              <span class="w-2 h-2 rounded-full bg-orange-400"></span> Fe < 30% (Low Fe)
            </span>
          `;
        }
      }
    }

    // Average Grade & COG Status
    if (summary.totalTonnage === 0) {
      if (this.cardAvgGrade) {
        this.cardAvgGrade.textContent = `0.${'0'.repeat(dec)}%`;
        this.cardAvgGrade.className = 'text-3xl sm:text-4xl font-extrabold font-mono-calc text-slate-400';
      }

      if (this.cardCogStatusBadge) {
        this.cardCogStatusBadge.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <span class="w-2 h-2 rounded-full bg-slate-500"></span> Belum ada data sampel
          </span>
        `;
      }
      if (this.cardCogDelta) {
        this.cardCogDelta.textContent = `Target COG: ${this.config.cog.toFixed(2)}%`;
        this.cardCogDelta.className = 'text-xs text-slate-400 mt-1';
      }

      if (this.cardOreClass) {
        this.cardOreClass.innerHTML = `<span class="text-xs text-slate-400 font-semibold">Belum Ada Ore</span>`;
      }
    } else {
      const formattedAvgNi = summary.weightedAvgGrade.toFixed(dec) + '%';
      if (this.cardAvgGrade) this.cardAvgGrade.textContent = formattedAvgNi;

      const isPassCog = summary.weightedAvgGrade >= this.config.cog;
      const delta = summary.weightedAvgGrade - this.config.cog;
      const deltaSign = delta >= 0 ? '+' : '';
      const formattedDelta = `${deltaSign}${delta.toFixed(dec)}% terhadap COG (${this.config.cog.toFixed(2)}%)`;

      if (isPassCog) {
        if (this.cardAvgGrade) this.cardAvgGrade.className = 'text-3xl sm:text-4xl font-extrabold font-mono-calc text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]';
        if (this.cardCogStatusBadge) {
          this.cardCogStatusBadge.innerHTML = `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm status-badge-pulse">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              MEMENUHI COG (≥ COG)
            </span>
          `;
        }
        if (this.cardCogDelta) {
          this.cardCogDelta.textContent = formattedDelta;
          this.cardCogDelta.className = 'text-xs font-medium text-emerald-300 mt-1';
        }
      } else {
        if (this.cardAvgGrade) this.cardAvgGrade.className = 'text-3xl sm:text-4xl font-extrabold font-mono-calc text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]';
        if (this.cardCogStatusBadge) {
          this.cardCogStatusBadge.innerHTML = `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-rose-400"></span>
              DI BAWAH COG (< COG)
            </span>
          `;
        }
        if (this.cardCogDelta) {
          this.cardCogDelta.textContent = formattedDelta;
          this.cardCogDelta.className = 'text-xs font-medium text-rose-300 mt-1';
        }
      }

      const comp = summary.compositeClassification;
      if (this.cardOreClass) {
        this.cardOreClass.innerHTML = `
          <div class="flex items-center">
            <span class="inline-flex items-center justify-center px-3 py-1 rounded-md text-sm font-black tracking-wider ${comp.badgeClass}" title="${comp.name}: ${comp.description} (Pita: ${comp.ribbon})">
              ${comp.code}
            </span>
          </div>
        `;
      }
    }

    // Update Footer Totals (Desktop Table)
    if (this.tableTotalBuckets) this.tableTotalBuckets.textContent = summary.totalBuckets.toLocaleString('id-ID');
    if (this.tableTotalTonnage) this.tableTotalTonnage.textContent = summary.totalTonnage.toFixed(3) + ' t';
    if (this.tableTotalTonGrade) this.tableTotalTonGrade.textContent = summary.totalTonNi.toFixed(4);
    if (this.tableAvgGrade) {
      this.tableAvgGrade.textContent = summary.totalTonnage > 0
        ? summary.weightedAvgGrade.toFixed(dec) + '%'
        : '-';
    }
    if (this.tableAvgFe) {
      this.tableAvgFe.textContent = summary.totalTonnage > 0
        ? summary.weightedAvgFe.toFixed(dec) + '%'
        : '-';
    }

    if (this.tableCompositeClass) {
      if (summary.totalTonnage > 0) {
        const c = summary.compositeClassification;
        this.tableCompositeClass.innerHTML = `
          <span class="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-black tracking-wide ${c.badgeClass}" title="${c.name}: ${c.description} (Pita: ${c.ribbon})">
            ${c.code}
          </span>
        `;
      } else {
        this.tableCompositeClass.innerHTML = `<span class="text-slate-400 text-xs">-</span>`;
      }
    }

    // Highlight active classification matrix card
    this.highlightActiveMatrixCard(summary.compositeClassification.code);

    // Update Chart and Print Meta
    this.updateChart(summary);
    this.updatePrintMeta();
    this.saveToLocalStorage();
  }

  updateSampleGrade(sampleId, numericGrade, rawVal, sourceInput) {
    const item = this.samples.find(s => s.id === sampleId);
    if (!item) return;

    item.gradeNi = isNaN(numericGrade) || numericGrade < 0 ? 0 : numericGrade;
    item.rawGrade = rawVal !== undefined ? rawVal : (item.gradeNi > 0 ? item.gradeNi.toString() : '');
    item.rawGradeNi = item.rawGrade;

    this.updateLiveCalculations(sampleId, sourceInput, 'ni', item.rawGrade);
  }

  updateSampleFe(sampleId, numericGrade, rawVal, sourceInput) {
    const item = this.samples.find(s => s.id === sampleId);
    if (!item) return;

    item.gradeFe = isNaN(numericGrade) || numericGrade < 0 ? 0 : numericGrade;
    item.rawGradeFe = rawVal !== undefined ? rawVal : (item.gradeFe > 0 ? item.gradeFe.toString() : '');

    this.updateLiveCalculations(sampleId, sourceInput, 'fe', item.rawGradeFe);
  }

  updateLiveCalculations(sampleId, sourceInput, changedField, rawVal) {
    const summary = this.calculateSummary();
    const item = this.samples.find(s => s.id === sampleId);
    if (!item) return;

    const calc = this.calculateSample(item, summary.tonnagePerBucket);
    const isAboveCog = calc.gradeNi >= this.config.cog;
    const ore = calc.classification;
    const tonnagePct = summary.totalTonnage > 0 ? (calc.tonnage / summary.totalTonnage) * 100 : 0;

    // 1. Update Desktop Row in-place
    const desktopRow = this.tableBody ? this.tableBody.querySelector(`tr[data-sample-id="${sampleId}"]`) : null;
    if (desktopRow) {
      const desktopNiInput = desktopRow.querySelector('.sample-grade-input');
      if (desktopNiInput && desktopNiInput !== sourceInput && changedField === 'ni' && rawVal !== undefined) {
        desktopNiInput.value = rawVal;
      }
      if (desktopNiInput) {
        if (isAboveCog) {
          desktopNiInput.classList.add('text-emerald-400', 'border-emerald-900/60');
          desktopNiInput.classList.remove('text-rose-400', 'border-rose-900/60');
        } else {
          desktopNiInput.classList.add('text-rose-400', 'border-rose-900/60');
          desktopNiInput.classList.remove('text-emerald-400', 'border-emerald-900/60');
        }
      }

      const desktopFeInput = desktopRow.querySelector('.sample-fe-input');
      if (desktopFeInput && desktopFeInput !== sourceInput && changedField === 'fe' && rawVal !== undefined) {
        desktopFeInput.value = rawVal;
      }

      const tonCell = desktopRow.querySelector('.cell-tonnage');
      if (tonCell) tonCell.textContent = `${calc.tonnage.toFixed(3)} ton`;
      const barTon = desktopRow.querySelector('.bar-tonnage-pct');
      if (barTon) {
        barTon.style.width = `${tonnagePct}%`;
        if (barTon.parentElement) barTon.parentElement.title = `Kontribusi: ${tonnagePct.toFixed(1)}%`;
      }
      const tonNiCell = desktopRow.querySelector('.cell-ton-ni');
      if (tonNiCell) tonNiCell.textContent = calc.tonNi.toFixed(4);
      const oreBadgeCell = desktopRow.querySelector('.cell-ore-badge');
      if (oreBadgeCell) {
        oreBadgeCell.innerHTML = `
          <span class="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-black tracking-wide ${ore.badgeClass}" title="${ore.name}: ${ore.description} (Pita: ${ore.ribbon})">
            ${ore.code}
          </span>
        `;
      }
    }

    // 2. Update Mobile Card in-place
    const mobileCard = this.mobileCardsContainer ? this.mobileCardsContainer.querySelector(`div[data-sample-id="${sampleId}"]`) : null;
    if (mobileCard) {
      const mobileNiInput = mobileCard.querySelector('.sample-grade-input');
      if (mobileNiInput && mobileNiInput !== sourceInput && changedField === 'ni' && rawVal !== undefined) {
        mobileNiInput.value = rawVal;
      }
      if (mobileNiInput) {
        if (isAboveCog) {
          mobileNiInput.classList.add('text-emerald-400', 'border-emerald-900/60');
          mobileNiInput.classList.remove('text-rose-400', 'border-rose-900/60');
        } else {
          mobileNiInput.classList.add('text-rose-400', 'border-rose-900/60');
          mobileNiInput.classList.remove('text-emerald-400', 'border-emerald-900/60');
        }
      }

      const mobileFeInput = mobileCard.querySelector('.sample-fe-input');
      if (mobileFeInput && mobileFeInput !== sourceInput && changedField === 'fe' && rawVal !== undefined) {
        mobileFeInput.value = rawVal;
      }

      const cardTon = mobileCard.querySelector('.card-tonnage');
      if (cardTon) cardTon.textContent = `${calc.tonnage.toFixed(3)} t`;
      const cardGradeInfo = mobileCard.querySelector('.card-grade-info');
      if (cardGradeInfo) {
        const hasGrd = item.rawGrade !== undefined && item.rawGrade !== '';
        const hasFe = item.rawGradeFe !== undefined && item.rawGradeFe !== '';
        cardGradeInfo.textContent = `${hasGrd ? calc.gradeNi.toFixed(2) + '%' : '-'} / ${hasFe ? calc.gradeFe.toFixed(2) + '%' : '-'}`;
      }
      const cardOreBadge = mobileCard.querySelector('.card-ore-badge');
      if (cardOreBadge) {
        cardOreBadge.className = `card-ore-badge px-2.5 py-0.5 rounded text-[11px] font-black tracking-wide ${ore.badgeClass}`;
        cardOreBadge.title = `${ore.name}: ${ore.description} (Pita: ${ore.ribbon})`;
        cardOreBadge.textContent = ore.code;
      }
    }

    // 3. Update summary metrics, footers, chart, print, storage
    this.updateSummaryDisplays(summary);
  }

  highlightActiveMatrixCard(activeCode) {
    const cards = document.querySelectorAll('.ore-matrix-card');
    cards.forEach(card => {
      const code = card.dataset.code;
      if (activeCode && code === activeCode) {
        card.classList.add('ring-2', 'ring-amber-400', 'shadow-lg', 'bg-slate-800/95');
      } else {
        card.classList.remove('ring-2', 'ring-amber-400', 'shadow-lg', 'bg-slate-800/95');
      }
    });
  }

  // --- RENDER BOTH DESKTOP TABLE & MOBILE CARDS ---

  renderBothViews(filterText = '', precalcSummary = null) {
    const summary = precalcSummary || this.calculateSummary();
    const tonnagePerBucket = summary.tonnagePerBucket;

    // Filter samples
    const filtered = this.samples.filter(s => {
      if (!filterText) return true;
      return s.name.toLowerCase().includes(filterText);
    });

    this.renderDesktopTable(filtered, summary, tonnagePerBucket);
    this.renderMobileCards(filtered, summary, tonnagePerBucket);
    this.bindSampleEvents();
  }

  renderDesktopTable(filtered, summary, tonnagePerBucket) {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = '';

    if (filtered.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-12 text-slate-400">
            <div class="flex flex-col items-center justify-center space-y-2.5">
              <div class="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p class="font-medium text-slate-300 text-sm">Belum ada sampel. Klik '+ Tambah Baris' untuk mulai memasukkan data.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((sample, idx) => {
      const calc = this.calculateSample(sample, tonnagePerBucket);
      const bucketVal = sample.bucket !== undefined && sample.bucket !== null && sample.bucket !== ''
        ? sample.bucket
        : (sample.buckets !== undefined && sample.buckets !== null && sample.buckets !== '' ? sample.buckets : '');

      const niVal = sample.ni !== undefined && sample.ni !== null && sample.ni !== ''
        ? sample.ni
        : (sample.gradeNi !== undefined && sample.gradeNi !== null && sample.gradeNi !== ''
            ? sample.gradeNi
            : (sample.rawGrade !== undefined && sample.rawGrade !== null ? sample.rawGrade : (sample.grade || '')));

      const feVal = sample.fe !== undefined && sample.fe !== null && sample.fe !== ''
        ? sample.fe
        : (sample.gradeFe !== undefined && sample.gradeFe !== null && sample.gradeFe !== ''
            ? sample.gradeFe
            : (sample.rawGradeFe !== undefined && sample.rawGradeFe !== null ? sample.rawGradeFe : ''));

      const hasGrade = niVal !== '' && niVal !== null && !isNaN(parseFloat(niVal));
      const gradeClass = !hasGrade ? 'text-slate-300 border-slate-700/80 focus:border-amber-500' : (calc.gradeNi >= this.config.cog ? 'text-emerald-400 border-emerald-900/60' : 'text-rose-400 border-rose-900/60');
      const tonnagePct = summary.totalTonnage > 0 ? (calc.tonnage / summary.totalTonnage) * 100 : 0;
      const ore = calc.classification;

      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors table-row-animate group';
      tr.dataset.sampleId = sample.id;

      tr.innerHTML = `
        <!-- No. -->
        <td class="px-3 py-3 text-center text-xs font-semibold text-slate-400 w-12">
          ${idx + 1}
        </td>

        <!-- Nama Sampel (Bersih tanpa ID acak) -->
        <td class="px-3 py-3">
          <input type="text" 
                 value="${this.escapeHtml(sample.name || '')}" 
                 placeholder="Contoh: Pit A - Sampel 1"
                 class="sample-name-input mining-input w-full px-2.5 py-1.5 text-xs font-semibold rounded focus:ring-1 focus:ring-amber-500"
                 data-id="${sample.id}">
        </td>

        <!-- Jumlah Bucket -->
        <td class="px-3 py-3 text-center w-36">
          <div class="inline-flex items-center space-x-1">
            <button class="btn-step-bucket-minus w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center transition-colors" data-id="${sample.id}">-</button>
            <input type="number" 
                   min="0" 
                   step="1"
                   value="${bucketVal}" 
                   placeholder="0"
                   class="sample-buckets-input mining-input w-14 text-center py-1.5 text-xs font-mono-calc font-semibold rounded"
                   data-id="${sample.id}">
            <button class="btn-step-bucket-plus w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center transition-colors" data-id="${sample.id}">+</button>
          </div>
        </td>

        <!-- Estimasi Tonase (ton) -->
        <td class="px-3 py-3 text-right w-36">
          <div class="flex flex-col items-end">
            <span class="font-mono-calc font-bold text-xs text-amber-300 cell-tonnage">
              ${calc.tonnage.toFixed(3)} ton
            </span>
            <div class="w-16 bg-slate-800 h-1 rounded-full mt-1 overflow-hidden" title="Kontribusi: ${tonnagePct.toFixed(1)}%">
              <div class="bg-amber-500/70 h-full rounded-full bar-tonnage-pct" style="width: ${tonnagePct}%;"></div>
            </div>
          </div>
        </td>

        <!-- Kadar Ni (%) -->
        <td class="px-3 py-3 text-right w-28">
          <div class="flex items-center justify-end space-x-1">
            <input type="text" 
                   inputmode="decimal" 
                   placeholder="0.0" 
                   value="${niVal}" 
                   class="sample-grade-input input-kadar mining-input w-20 text-right py-1.5 px-2 text-xs font-mono-calc font-bold rounded ${gradeClass}" 
                   data-id="${sample.id}"
                   oninput="handleGradeInput(event, '${sample.id}', 'ni')">
            <span class="text-xs font-bold text-slate-400">%</span>
          </div>
        </td>

        <!-- Kadar Fe (%) -->
        <td class="px-3 py-3 text-right w-28">
          <div class="flex items-center justify-end space-x-1">
            <input type="text" 
                   inputmode="decimal" 
                   placeholder="0.0" 
                   value="${feVal}" 
                   class="sample-fe-input mining-input w-20 text-right py-1.5 px-2 text-xs font-mono-calc font-bold rounded text-orange-200 border-slate-700/80 focus:border-orange-500" 
                   data-id="${sample.id}"
                   oninput="handleGradeInput(event, '${sample.id}', 'fe')">
            <span class="text-xs font-bold text-slate-400">%</span>
          </div>
        </td>

        <!-- Tonase × Ni -->
        <td class="px-3 py-3 text-right font-mono-calc font-semibold text-xs text-slate-300 w-28 cell-ton-ni">
          ${calc.tonNi.toFixed(4)}
        </td>

        <!-- Klasifikasi Ore Badge (Hanya Singkatan) -->
        <td class="px-3 py-3 text-center w-36 cell-ore-badge">
          <span class="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-black tracking-wide ${ore.badgeClass}" title="${ore.name}: ${ore.description} (Pita: ${ore.ribbon})">
            ${ore.code}
          </span>
        </td>

        <!-- Aksi -->
        <td class="px-3 py-3 text-center w-24">
          <div class="flex items-center justify-center space-x-1">
            <button class="btn-duplicate-row p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors" 
                    title="Duplikasi Baris" 
                    data-id="${sample.id}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </button>
            <button class="btn-delete-row p-1.5 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors" 
                    title="Hapus Baris" 
                    data-id="${sample.id}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </td>
      `;

      this.tableBody.appendChild(tr);
    });
  }

  renderMobileCards(filtered, summary, tonnagePerBucket) {
    if (!this.mobileCardsContainer) return;
    this.mobileCardsContainer.innerHTML = '';

    if (filtered.length === 0) {
      this.mobileCardsContainer.innerHTML = `
        <div class="text-center py-10 text-slate-400 glass-panel rounded-xl p-6 border border-slate-800/80 flex flex-col items-center justify-center space-y-2.5">
          <div class="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p class="font-medium text-slate-300 text-sm">Belum ada sampel. Klik '+ Tambah Baris' untuk mulai memasukkan data.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((sample, idx) => {
      const calc = this.calculateSample(sample, tonnagePerBucket);
      const bucketVal = sample.bucket !== undefined && sample.bucket !== null && sample.bucket !== ''
        ? sample.bucket
        : (sample.buckets !== undefined && sample.buckets !== null && sample.buckets !== '' ? sample.buckets : '');

      const niVal = sample.ni !== undefined && sample.ni !== null && sample.ni !== ''
        ? sample.ni
        : (sample.gradeNi !== undefined && sample.gradeNi !== null && sample.gradeNi !== ''
            ? sample.gradeNi
            : (sample.rawGrade !== undefined && sample.rawGrade !== null ? sample.rawGrade : (sample.grade || '')));

      const feVal = sample.fe !== undefined && sample.fe !== null && sample.fe !== ''
        ? sample.fe
        : (sample.gradeFe !== undefined && sample.gradeFe !== null && sample.gradeFe !== ''
            ? sample.gradeFe
            : (sample.rawGradeFe !== undefined && sample.rawGradeFe !== null ? sample.rawGradeFe : ''));

      const hasGrade = niVal !== '' && niVal !== null && !isNaN(parseFloat(niVal));
      const hasFe = feVal !== '' && feVal !== null && !isNaN(parseFloat(feVal));
      const gradeClass = !hasGrade ? 'text-slate-300 border-slate-700/80 focus:border-amber-500' : (calc.gradeNi >= this.config.cog ? 'text-emerald-400 border-emerald-900/60' : 'text-rose-400 border-rose-900/60');
      const ore = calc.classification;

      const card = document.createElement('div');
      card.className = 'glass-panel rounded-xl p-3.5 border border-slate-800 space-y-3 table-row-animate';
      card.dataset.sampleId = sample.id;

      card.innerHTML = `
        <!-- Top Row: # Index + Nama Sampel + Actions -->
        <div class="flex items-center justify-between gap-2">
          <span class="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
            ${idx + 1}
          </span>
          <input type="text" 
                 value="${this.escapeHtml(sample.name || '')}" 
                 placeholder="Nama Sampel"
                 class="sample-name-input mining-input w-full px-2.5 py-1.5 text-xs font-semibold rounded"
                 data-id="${sample.id}">
          <div class="flex items-center space-x-1 flex-shrink-0">
            <button class="btn-duplicate-row p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors" 
                    title="Duplikasi" data-id="${sample.id}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </button>
            <button class="btn-delete-row p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors" 
                    title="Hapus" data-id="${sample.id}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Middle Row: Touch-Friendly Bucket Stepper, Ni (%), and Fe (%) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          
          <!-- Bucket Stepper -->
          <div class="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-medium mb-1">Jumlah Bucket:</span>
            <div class="flex items-center justify-between">
              <button class="btn-step-bucket-minus touch-stepper-btn rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-base active:scale-95 border border-slate-700" 
                      data-id="${sample.id}">-</button>
              <input type="number" 
                     min="0" 
                     step="1" 
                     value="${bucketVal}" 
                     placeholder="0" 
                     class="sample-buckets-input mining-input w-12 text-center py-1.5 text-xs font-mono-calc font-bold rounded" 
                     data-id="${sample.id}">
              <button class="btn-step-bucket-plus touch-stepper-btn rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-base active:scale-95 border border-slate-700" 
                      data-id="${sample.id}">+</button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:contents">
            <!-- Kadar Ni (%) -->
            <div class="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400 font-medium mb-1">Kadar Ni (%):</span>
              <div class="relative">
                <input type="text" 
                       inputmode="decimal" 
                       placeholder="0.0" 
                       value="${niVal}" 
                       class="sample-grade-input input-kadar mining-input w-full py-1.5 pl-2 pr-6 text-xs font-mono-calc font-bold rounded ${gradeClass}" 
                       data-id="${sample.id}" 
                       oninput="handleGradeInput(event, '${sample.id}', 'ni')">
                <span class="absolute right-2 top-1.5 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <!-- Kadar Fe (%) -->
            <div class="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400 font-medium mb-1">Kadar Fe (%):</span>
              <div class="relative">
                <input type="text" 
                       inputmode="decimal" 
                       placeholder="0.0" 
                       value="${feVal}" 
                       class="sample-fe-input mining-input w-full py-1.5 pl-2 pr-6 text-xs font-mono-calc font-bold rounded text-orange-200 border-slate-700/80 focus:border-orange-500" 
                       data-id="${sample.id}" 
                       oninput="handleGradeInput(event, '${sample.id}', 'fe')">
                <span class="absolute right-2 top-1.5 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Bottom Summary Info Pill -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <span class="text-slate-400 text-[10px]">Tonase:</span>
            <span class="font-mono-calc font-bold text-amber-300 ml-1 card-tonnage">${calc.tonnage.toFixed(3)} t</span>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Ni / Fe:</span>
            <span class="font-mono-calc text-slate-300 ml-1 card-grade-info">${hasGrade ? calc.gradeNi.toFixed(2) + '%' : '-'} / ${hasFe ? calc.gradeFe.toFixed(2) + '%' : '-'}</span>
          </div>
          <span class="card-ore-badge px-2.5 py-0.5 rounded text-[11px] font-black tracking-wide ${ore.badgeClass}" title="${ore.name}: ${ore.description} (Pita: ${ore.ribbon})">
            ${ore.code}
          </span>
        </div>
      `;

      this.mobileCardsContainer.appendChild(card);
    });
  }

  bindSampleEvents() {
    const rootElements = [this.tableBody, this.mobileCardsContainer];

    rootElements.forEach(root => {
      if (!root) return;

      // Sample Name
      root.querySelectorAll('.sample-name-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const id = e.target.dataset.id;
          const item = this.samples.find(s => s.id === id);
          if (item) {
            item.name = e.target.value.trim();
            this.saveToLocalStorage();
            this.updateChart();
            this.updatePrintMeta();
          }
        });
      });

      // Buckets input
      root.querySelectorAll('.sample-buckets-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = e.target.dataset.id;
          const item = this.samples.find(s => s.id === id);
          if (item) {
            item.buckets = e.target.value;
            item.bucket = e.target.value;
            this.updateLiveCalculations(id, null, 'bkt', null);
          }
        });
      });

      // Stepper minus
      root.querySelectorAll('.btn-step-bucket-minus').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const item = this.samples.find(s => s.id === id);
          if (item && item.buckets > 0) {
            item.buckets = Math.max(0, item.buckets - 1);
            const bktInputs = document.querySelectorAll(`.sample-buckets-input[data-id="${id}"]`);
            bktInputs.forEach(b => b.value = item.buckets);
            this.updateLiveCalculations(id, null, 'bkt', null);
          }
        });
      });

      // Stepper plus
      root.querySelectorAll('.btn-step-bucket-plus').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const item = this.samples.find(s => s.id === id);
          if (item) {
            item.buckets = (item.buckets || 0) + 1;
            const bktInputs = document.querySelectorAll(`.sample-buckets-input[data-id="${id}"]`);
            bktInputs.forEach(b => b.value = item.buckets);
            this.updateLiveCalculations(id, null, 'bkt', null);
          }
        });
      });

      // Grade Ni - blur normalization (removes trailing dot if user leaves input like "1.")
      root.querySelectorAll('.sample-grade-input').forEach(input => {
        input.addEventListener('blur', (e) => {
          const id = e.target.dataset.id;
          const item = this.samples.find(s => s.id === id);
          if (item && item.rawGrade) {
            if (item.rawGrade.endsWith('.')) {
              item.rawGrade = item.rawGrade.slice(0, -1);
              item.rawGradeNi = item.rawGrade;
              e.target.value = item.rawGrade;
              this.updateSampleGrade(id, item.gradeNi, item.rawGrade, e.target);
            }
          }
        });
      });

      // Grade Fe - blur normalization (removes trailing dot if user leaves input like "30.")
      root.querySelectorAll('.sample-fe-input').forEach(input => {
        input.addEventListener('blur', (e) => {
          const id = e.target.dataset.id;
          const item = this.samples.find(s => s.id === id);
          if (item && item.rawGradeFe) {
            if (item.rawGradeFe.endsWith('.')) {
              item.rawGradeFe = item.rawGradeFe.slice(0, -1);
              e.target.value = item.rawGradeFe;
              this.updateSampleFe(id, item.gradeFe, item.rawGradeFe, e.target);
            }
          }
        });
      });

      // Duplicate
      root.querySelectorAll('.btn-duplicate-row').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          this.duplicateSample(id);
        });
      });

      // Delete
      root.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          this.deleteSample(id);
        });
      });
    });
  }

  // --- CRUD ACTIONS ---

  addSampleRow() {
    const nextNum = this.samples.length + 1;
    const newSample = {
      id: Date.now().toString(),
      name: "",
      bucket: "",
      buckets: "",
      ni: "",
      grade: "",
      gradeNi: "",
      rawGrade: "",
      rawGradeNi: "",
      fe: "",
      gradeFe: "",
      rawGradeFe: ""
    };
    this.samples.push(newSample);
    this.render();
    this.showToast(`Baris sampel #${nextNum} baru berhasil ditambahkan.`, 'success');
  }

  duplicateSample(id) {
    const original = this.samples.find(s => s.id === id);
    if (!original) return;

    const duplicated = {
      id: Date.now().toString(),
      name: `${original.name} (Copy)`,
      bucket: original.bucket !== undefined ? original.bucket : original.buckets,
      buckets: original.buckets !== undefined ? original.buckets : original.bucket,
      ni: original.ni !== undefined ? original.ni : original.gradeNi,
      grade: original.grade !== undefined ? original.grade : (original.gradeNi !== undefined ? original.gradeNi : ''),
      gradeNi: original.gradeNi !== undefined ? original.gradeNi : original.ni,
      rawGrade: original.rawGrade !== undefined ? original.rawGrade : (original.gradeNi !== undefined ? original.gradeNi.toString() : ''),
      rawGradeNi: original.rawGradeNi !== undefined ? original.rawGradeNi : (original.rawGrade !== undefined ? original.rawGrade : ''),
      fe: original.fe !== undefined ? original.fe : original.gradeFe,
      gradeFe: original.gradeFe !== undefined ? original.gradeFe : original.fe,
      rawGradeFe: original.rawGradeFe !== undefined ? original.rawGradeFe : (original.gradeFe !== undefined ? original.gradeFe.toString() : '')
    };
    this.samples.push(duplicated);
    this.render();
    this.showToast(`Sampel "${original.name}" diduplikasi.`, 'info');
  }

  deleteSample(id) {
    const index = this.samples.findIndex(s => s.id === id);
    if (index !== -1) {
      const removed = this.samples.splice(index, 1)[0];
      this.render();
      this.showToast(`Sampel "${removed.name}" dihapus.`, 'warning');
    }
  }

  loadExampleData() {
    this.samples = JSON.parse(JSON.stringify(EXAMPLE_SAMPLES));
    this.config.cog = 1.20;
    this.config.bucketCapacity = 2.2;
    this.config.fillFactor = 1.10;
    this.config.oreDensity = 1.70;
    this.populateConfigInputs();
    this.render();
    this.showToast('Data contoh (HGS, MGSO, LIMONITE, KONSERVASI) berhasil dimuat!', 'success');
  }

  resetAllData() {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh data sampel dome?')) {
      this.samples = [];
      this.config.domeInfo = {
        domeId: '',
        pitLocation: '',
        date: new Date().toISOString().split('T')[0],
        geologist: ''
      };
      this.populateConfigInputs();
      this.render();
      this.showToast('Seluruh data sampel telah dikosongkan.', 'warning');
    }
  }

  // --- CHART VISUALIZATION ---

  initChart() {
    try {
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js library is not loaded. Chart skipped.');
        return;
      }
      const canvas = document.getElementById('domeGradeChart');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const summary = this.calculateSummary();

      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: this.getChartData(summary),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: '#94a3b8',
                font: { family: 'Plus Jakarta Sans', size: 11 }
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderWidth: 1,
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              callbacks: {
                afterLabel: (context) => {
                  const sample = this.samples[context.dataIndex];
                  if (sample) {
                    const ore = classifyOre(sample.gradeNi, sample.gradeFe);
                    return [
                      `Klasifikasi: ${ore.code} (${ore.name})`,
                      `Pita: ${ore.ribbon}`,
                      `Fe: ${(parseFloat(sample.gradeFe) || 0).toFixed(2)}%`
                    ];
                  }
                  return '';
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.2)' },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(51, 65, 85, 0.2)' },
              ticks: {
                color: '#94a3b8',
                font: { size: 10 },
                callback: (val) => val.toFixed(1) + '%'
              },
              suggestedMin: 0,
              suggestedMax: 2.2
            }
          }
        }
      });
    } catch (err) {
      console.warn('Error initializing Chart:', err);
    }
  }

  getChartData(summary) {
    const labels = this.samples.map(s => s.name);
    const grades = this.samples.map(s => s.gradeNi);
    const bgColors = this.samples.map(s => s.gradeNi >= this.config.cog ? 'rgba(16, 185, 129, 0.75)' : 'rgba(244, 63, 94, 0.75)');
    const borderColors = this.samples.map(s => s.gradeNi >= this.config.cog ? '#10b981' : '#f43f5e');

    const cogLine = Array(this.samples.length).fill(this.config.cog);
    const avgLine = Array(this.samples.length).fill(summary.weightedAvgGrade);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Kadar Ni Sampel (%)',
          data: grades,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 6,
          order: 3
        },
        {
          label: `COG Target (${this.config.cog.toFixed(2)}%)`,
          data: cogLine,
          type: 'line',
          borderColor: '#f59e0b',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          order: 1
        },
        {
          label: `Rata-rata Dome (${summary.weightedAvgGrade.toFixed(2)}% Ni)`,
          data: avgLine,
          type: 'line',
          borderColor: '#38bdf8',
          borderWidth: 2,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
          order: 2
        }
      ]
    };
  }

  updateChart(summary = null) {
    try {
      if (!this.chartInstance) return;
      const calcSummary = summary || this.calculateSummary();
      const data = this.getChartData(calcSummary);
      this.chartInstance.data.labels = data.labels;
      this.chartInstance.data.datasets = data.datasets;
      this.chartInstance.update();
    } catch (err) {
      console.warn('Error updating chart:', err);
    }
  }

  // --- EXPORT & PRINTING ---

  exportToCsv() {
    if (this.samples.length === 0) {
      this.showToast('Tidak ada data sampel untuk diekspor.', 'warning');
      return;
    }

    const summary = this.calculateSummary();
    const tonPerBucket = summary.tonnagePerBucket;

    let csv = [];
    csv.push(['GCSP (Grade Control SumProduct) Calculation App']);
    csv.push(['Quick Calculation, Better Grade Control']);
    csv.push(['LAPORAN ESTIMASI KADAR NIKEL PER DOME']);
    csv.push([`ID Dome:`, this.config.domeInfo.domeId]);
    csv.push([`Lokasi Pit:`, this.config.domeInfo.pitLocation]);
    csv.push([`Tanggal:`, this.config.domeInfo.date]);
    csv.push([`Jenis Alat:`, this.config.excavatorType]);
    csv.push([`Kapasitas Bucket (m3):`, this.config.bucketCapacity]);
    csv.push([`Densitas Ore (ton/m3):`, this.config.oreDensity]);
    csv.push([`Tonase per Bucket (ton):`, tonPerBucket.toFixed(3)]);
    csv.push([`Cut Off Grade (COG) (%):`, this.config.cog.toFixed(2)]);
    csv.push([]);
    csv.push(['No', 'Nama Sampel', 'Jumlah Bucket', 'Estimasi Tonase (ton)', 'Kadar Ni (%)', 'Kadar Fe (%)', 'Tonase x Ni', 'Klasifikasi Ore', 'Warna Pita', 'Deskripsi Stockpile']);

    this.samples.forEach((s, idx) => {
      const calc = this.calculateSample(s, tonPerBucket);
      csv.push([
        idx + 1,
        `"${s.name.replace(/"/g, '""')}"`,
        calc.buckets,
        calc.tonnage.toFixed(3),
        calc.gradeNi.toFixed(2),
        calc.gradeFe.toFixed(2),
        calc.tonNi.toFixed(4),
        `"${calc.classification.code}"`,
        `"${calc.classification.ribbon}"`,
        `"${calc.classification.description}"`
      ]);
    });

    csv.push([]);
    csv.push(['TOTAL / RATA-RATA', '', summary.totalBuckets, summary.totalTonnage.toFixed(3), summary.weightedAvgGrade.toFixed(4), summary.weightedAvgFe.toFixed(4), summary.totalTonNi.toFixed(4), `"${summary.compositeClassification.code}"`, `"${summary.compositeClassification.ribbon}"`, `"${summary.compositeClassification.description}"`]);
    csv.push([`STATUS COG:`, summary.weightedAvgGrade >= this.config.cog ? 'MEMENUHI COG (>= COG)' : 'DI BAWAH COG (< COG)']);
    csv.push([`KLASIFIKASI DOME:`, `"${summary.compositeClassification.code}"`]);
    csv.push([`WARNA PITA (FLAGGING):`, `"${summary.compositeClassification.ribbon}"`]);
    csv.push([`PERUNTUKAN STOCKPILE:`, `"${summary.compositeClassification.description}"`]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csv.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanDomeName = (this.config.domeInfo.domeId || 'DOME').replace(/[^a-z0-9_-]/gi, '_');
    link.setAttribute('download', `Estimasi_Kadar_Nikel_${cleanDomeName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Data berhasil diekspor ke file CSV/Excel!', 'success');
  }

  printReport() {
    this.updatePrintMeta();
    this.renderPrintTable();
    window.print();
  }

  renderPrintTable() {
    const printTableBody = document.getElementById('print-table-body');
    if (!printTableBody) return;

    const summary = this.calculateSummary();
    const tonPerBucket = summary.tonnagePerBucket;
    printTableBody.innerHTML = '';

    this.samples.forEach((s, idx) => {
      const calc = this.calculateSample(s, tonPerBucket);
      const tr = document.createElement('tr');
      const classLabel = calc.classification.code;

      tr.innerHTML = `
        <td style="text-align: center;">${idx + 1}</td>
        <td>${this.escapeHtml(s.name)}</td>
        <td style="text-align: center;">${calc.buckets}</td>
        <td style="text-align: right;">${calc.tonnage.toFixed(3)}</td>
        <td style="text-align: right;">${calc.gradeNi.toFixed(2)}%</td>
        <td style="text-align: right;">${calc.gradeFe.toFixed(2)}%</td>
        <td style="text-align: right;">${calc.tonNi.toFixed(4)}</td>
        <td style="text-align: center; font-weight: bold;">${classLabel}</td>
      `;
      printTableBody.appendChild(tr);
    });

    const printTableFooter = document.getElementById('print-table-footer');
    if (printTableFooter) {
      const compLabel = summary.compositeClassification.code;

      printTableFooter.innerHTML = `
        <tr style="font-weight: bold; background-color: #f1f5f9;">
          <td colspan="2" style="text-align: right;">TOTAL / RATA-RATA:</td>
          <td style="text-align: center;">${summary.totalBuckets}</td>
          <td style="text-align: right;">${summary.totalTonnage.toFixed(3)} t</td>
          <td style="text-align: right;">${summary.weightedAvgGrade.toFixed(3)}%</td>
          <td style="text-align: right;">${summary.weightedAvgFe.toFixed(3)}%</td>
          <td style="text-align: right;">${summary.totalTonNi.toFixed(4)}</td>
          <td style="text-align: center; font-weight: bold;">${compLabel}</td>
        </tr>
      `;
    }
  }

  updatePrintMeta() {
    const summary = this.calculateSummary();
    const printDomeId = document.getElementById('print-dome-id');
    const printPitLocation = document.getElementById('print-pit-location');
    const printDate = document.getElementById('print-date');
    const printGeologist = document.getElementById('print-geologist');
    const printCog = document.getElementById('print-cog');
    const printTonPerBucket = document.getElementById('print-ton-per-bucket');
    const printCompositeClass = document.getElementById('print-composite-class');
    const printTotalBuckets = document.getElementById('print-total-buckets');
    const printTotalTonnage = document.getElementById('print-total-tonnage');
    const printAvgGrade = document.getElementById('print-avg-grade');
    const printAvgFe = document.getElementById('print-avg-fe');
    const printCogStatus = document.getElementById('print-cog-status');

    if (printDomeId) printDomeId.textContent = this.config.domeInfo.domeId || '-';
    if (printPitLocation) printPitLocation.textContent = this.config.domeInfo.pitLocation || '-';
    if (printDate) printDate.textContent = this.config.domeInfo.date || '-';
    if (printGeologist) printGeologist.textContent = this.config.domeInfo.geologist || '-';
    if (printCog) printCog.textContent = this.config.cog.toFixed(2) + '%';
    if (printTonPerBucket) printTonPerBucket.textContent = this.getTonnagePerBucket().toFixed(3) + ' ton/bucket';

    if (printCompositeClass) {
      if (summary.totalTonnage > 0) {
        const comp = summary.compositeClassification;
        printCompositeClass.textContent = `${comp.code} (${comp.ribbon})`;
      } else {
        printCompositeClass.textContent = '-';
      }
    }

    if (printTotalBuckets) printTotalBuckets.textContent = summary.totalBuckets.toString();
    if (printTotalTonnage) printTotalTonnage.textContent = summary.totalTonnage.toFixed(3) + ' ton';
    if (printAvgGrade) printAvgGrade.textContent = summary.totalTonnage > 0 ? summary.weightedAvgGrade.toFixed(this.config.decimalPlaces) + '%' : '-';
    if (printAvgFe) printAvgFe.textContent = summary.totalTonnage > 0 ? summary.weightedAvgFe.toFixed(this.config.decimalPlaces) + '%' : '-';
    if (printCogStatus) {
      if (summary.totalTonnage === 0) {
        printCogStatus.textContent = 'Belum Ada Data';
      } else {
        printCogStatus.textContent = summary.weightedAvgGrade >= this.config.cog ? 'MEMENUHI COG (≥ COG)' : 'DI BAWAH COG (< COG)';
      }
    }
  }

  // --- LOCAL STORAGE PERSISTENCE ---

  saveToLocalStorage() {
    try {
      const payload = {
        config: this.config,
        samples: this.samples.map(s => ({
          id: s.id,
          name: s.name,
          buckets: s.buckets,
          gradeNi: s.gradeNi,
          rawGrade: s.rawGrade,
          gradeFe: s.gradeFe,
          rawGradeFe: s.rawGradeFe
        }))
      };
      localStorage.setItem('nickel_dome_calc_state', JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('nickel_dome_calc_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.config) this.config = { ...this.config, ...parsed.config };
        if (parsed.samples && Array.isArray(parsed.samples)) {
          this.samples = parsed.samples.map(s => ({
            id: s.id || Date.now().toString(),
            name: s.name || 'Sampel',
            buckets: s.buckets || 0,
            gradeNi: s.gradeNi || 0,
            rawGrade: s.rawGrade !== undefined ? s.rawGrade : (s.gradeNi !== undefined ? s.gradeNi.toString() : ''),
            gradeFe: s.gradeFe || 0,
            rawGradeFe: s.rawGradeFe !== undefined ? s.rawGradeFe : (s.gradeFe !== undefined ? s.gradeFe.toString() : '')
          }));
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }

  // --- TOAST NOTIFICATION ---

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100',
      warning: 'bg-amber-900/90 border-amber-500/50 text-amber-100',
      error: 'bg-rose-900/90 border-rose-500/50 text-rose-100',
      info: 'bg-slate-900/90 border-slate-600/50 text-slate-100'
    };

    const icons = {
      success: '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
      warning: '<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
      error: '<svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
      info: '<svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };

    toast.className = `toast flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-xl text-xs backdrop-blur-md ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <div class="flex-shrink-0">${icons[type] || icons.info}</div>
      <div class="font-medium">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  renderTable(filterText = '') {
    this.renderBothViews(filterText);
  }

  renderSamples(filterText = '') {
    this.renderBothViews(filterText);
  }

  escapeHtml(string) {
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Global functions for convenience and event listeners
window.addSampleRow = function() {
  if (window.nickelApp) {
    window.nickelApp.addSampleRow();
  }
};

window.renderTable = function() {
  if (window.nickelApp) {
    window.nickelApp.renderBothViews();
  }
};

window.renderSamples = function() {
  if (window.nickelApp) {
    window.nickelApp.renderBothViews();
  }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.nickelApp = new NickelDomeCalculator();
});
