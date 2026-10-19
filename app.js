/**
 * GCSP (Grade Control SumProduct) Calculation App
 * Tagline: Quick Calculation, Better Grade Control
 * Grade Control & Stockpile Blending Estimation System
 * PT Halmahera Sukses Mineral Specification (Exca 40 Ton)
 * Single-Element Assay (Ni %) & Clean Responsive Architecture
 */

// Initial State and Configuration
const DEFAULT_CONFIG = {
  excavatorType: 'Exca 40 ton',
  bucketCapacity: 2.2,    // m³
  fillFactor: 1.10,       // 110%
  oreDensity: 1.70,       // ton/m³
  cog: 1.20,              // Cut Off Grade (%)
  decimalPlaces: 3,       // Desimal display (2, 3, or 4)
  domeInfo: {
    domeId: '',
    pitLocation: '',
    date: new Date().toISOString().split('T')[0],
    geologist: ''
  }
};

/**
 * Helper pembentuk objek sampel baru yang aman dan default kosong
 */
function createNewSample() {
  return {
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    name: "",
    bucket: "",
    ni: ""
  };
}

// Sample Data untuk Tombol 'Muat Data Contoh'
const EXAMPLE_SAMPLES = [
  { id: 'ex-1', name: 'Pit 1 - Blok A (HGS)', bucket: '4', ni: '2.10' },
  { id: 'ex-2', name: 'Pit 1 - Blok B (MGSO)', bucket: '3', ni: '1.85' },
  { id: 'ex-3', name: 'Pit 2 - Blok C (LGSO)', bucket: '2', ni: '1.55' },
  { id: 'ex-4', name: 'Pit 2 - Blok D (SSO)', bucket: '2', ni: '1.30' }
];

/**
 * Matriks Klasifikasi Standar Tambang Nikel Laterit (Saprolite Ore berbasis Ni %):
 * - Ni ≥ 2.00%           -> HGS (Badge Merah)
 * - 1.70% ≤ Ni ≤ 1.99%   -> MGSO (Badge Hijau)
 * - 1.50% ≤ Ni ≤ 1.69%   -> LGSO (Badge Kuning)
 * - 1.20% ≤ Ni ≤ 1.49%   -> SSO (Badge Pink)
 * - 1.00% ≤ Ni ≤ 1.19%   -> KONSERVASI (Badge Biru - Pink)
 * - Ni < 1.00%           -> WA (Badge Putih, teks gelap)
 * - Data kosong          -> "-"
 */
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

/**
 * Sanitasi string input desimal:
 * Otomatis ganti koma (,) menjadi titik (.) dan hanya izinkan 1 titik desimal.
 */
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

/**
 * Global input handlers untuk event inline pada tabel & kartu
 */
function handleGradeInput(e, sampleId) {
  const input = e.target;
  const sanitized = sanitizeDecimalInput(input.value);
  input.value = sanitized;
  if (window.nickelApp) {
    window.nickelApp.updateSampleGrade(sampleId, sanitized, input);
  }
}

function handleBucketInput(e, sampleId) {
  const input = e.target;
  const sanitized = sanitizeDecimalInput(input.value);
  input.value = sanitized;
  if (window.nickelApp) {
    window.nickelApp.updateSampleBucket(sampleId, sanitized, input);
  }
}

function toggleParamsAccordion() {
  const content = document.getElementById('param-content');
  const chevron = document.getElementById('chevron-params');
  if (!content) return;
  content.classList.toggle('hidden');
  const isHidden = content.classList.contains('hidden');
  if (chevron) {
    chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
  }
}

class NickelDomeCalculator {
  constructor() {
    this.config = { ...DEFAULT_CONFIG, domeInfo: { ...DEFAULT_CONFIG.domeInfo } };
    this.samples = [];
    this.chartInstance = null;
    this.init();
  }

  init() {
    this.samples = [];
    this.cacheDomElements();
    this.bindEvents();
    this.populateConfigInputs();
    this.render();
    this.initChart();
  }

  cacheDomElements() {
    // Accordion
    this.btnToggleParams = document.getElementById('toggle-params-btn') || document.getElementById('btn-toggle-params');
    this.accordionParamsContent = document.getElementById('param-content') || document.getElementById('accordion-params-content');
    this.chevronParams = document.getElementById('chevron-params');

    // Parameters
    this.inputBucketCapacity = document.getElementById('param-bucket-capacity');
    this.inputFillFactor = document.getElementById('param-fill-factor');
    this.inputOreDensity = document.getElementById('param-ore-density');
    this.badgeTonnagePerBucket = document.getElementById('badge-tonnage-per-bucket');
    this.btnResetParams = document.getElementById('btn-reset-params');

    // Dome Meta
    this.inputDomeId = document.getElementById('dome-id');
    this.inputPitLocation = document.getElementById('dome-pit');
    this.inputDate = document.getElementById('dome-date');
    this.inputGeologist = document.getElementById('dome-geologist');

    // Target COG & Precision
    this.inputCog = document.getElementById('input-cog');
    this.selectDecimals = document.getElementById('select-decimals');

    // Summary Cards (4 Cards)
    this.cardTotalBuckets = document.getElementById('summary-total-buckets');
    this.cardTotalTonnage = document.getElementById('summary-total-tonnage');
    this.cardAvgGrade = document.getElementById('summary-avg-grade');
    this.cardCogStatusBadge = document.getElementById('summary-cog-badge');
    this.cardCogDelta = document.getElementById('summary-cog-delta');
    this.cardOreClass = document.getElementById('summary-ore-classification');

    // Containers
    this.tableBody = document.getElementById('sample-table-body');
    this.mobileCardsContainer = document.getElementById('sample-cards-mobile');
    this.sampleCountBadge = document.getElementById('sample-count-badge');

    // Table Footers
    this.tableTotalBuckets = document.getElementById('footer-total-buckets');
    this.tableTotalTonnage = document.getElementById('footer-total-tonnage');
    this.tableAvgGrade = document.getElementById('footer-avg-grade');
    this.tableTotalTonGrade = document.getElementById('footer-total-ton-grade');
    this.tableCompositeClass = document.getElementById('footer-composite-classification');

    // Action Buttons
    this.btnAddSample = document.getElementById('add-row-btn') || document.getElementById('add-sample-btn') || document.querySelector('.btn-add-sample');
    this.btnAddSampleMobile = document.getElementById('btn-add-sample-mobile');
    this.btnLoadExample = document.getElementById('btn-load-example');
    this.btnResetAll = document.getElementById('btn-reset-all');
    this.btnExportCsv = document.getElementById('btn-export-csv');
    this.btnPrintReport = document.getElementById('btn-print-report');
    this.sampleSearch = document.getElementById('sample-search');
  }

  bindEvents() {
    // Accordion Toggle
    if (this.btnToggleParams) {
      this.btnToggleParams.onclick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        toggleParamsAccordion();
      };
    }

    // Parameters Inputs
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
        const val = parseFloat(sanitizeDecimalInput(e.target.value));
        this.config.cog = isNaN(val) || val < 0 ? 0 : val;
        this.render();
      });
    }

    // Decimals Precision
    if (this.selectDecimals) {
      this.selectDecimals.addEventListener('change', (e) => {
        this.config.decimalPlaces = parseInt(e.target.value, 10) || 3;
        this.render();
      });
    }

    // Dome Info Inputs
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
          this.updatePrintMeta();
        });
      }
    });

    // Persistent Add Sample Buttons
    const addBtns = [
      document.getElementById('add-row-btn'),
      document.getElementById('add-sample-btn'),
      document.getElementById('btn-add-sample'),
      document.getElementById('btn-add-sample-mobile'),
      ...document.querySelectorAll('.btn-add-sample')
    ].filter(Boolean);

    addBtns.forEach(btn => {
      btn.onclick = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.addSampleRow();
      };
    });

    if (this.btnLoadExample) this.btnLoadExample.addEventListener('click', () => this.loadExampleData());
    if (this.btnResetAll) this.btnResetAll.addEventListener('click', () => this.resetAllData());
    if (this.btnExportCsv) this.btnExportCsv.addEventListener('click', () => this.exportToCsv());
    if (this.btnPrintReport) this.btnPrintReport.addEventListener('click', () => this.printReport());

    if (this.sampleSearch) {
      this.sampleSearch.addEventListener('input', (e) => {
        this.renderBothViews(e.target.value.trim().toLowerCase());
      });
    }
  }

  getTonnagePerBucket() {
    const cap = parseFloat(this.config.bucketCapacity) || 0;
    const ff = parseFloat(this.config.fillFactor) || 0;
    const dens = parseFloat(this.config.oreDensity) || 0;
    return cap * ff * dens;
  }

  calculateSample(sample, tonnagePerBucket) {
    if (!sample) {
      return {
        hasBucket: false,
        hasNi: false,
        isComplete: false,
        buckets: 0,
        gradeNi: null,
        tonnage: 0,
        tonNi: null,
        classification: classifyOre('')
      };
    }

    const rawBucket = sample.bucket !== undefined && sample.bucket !== null ? String(sample.bucket).trim() : '';
    const rawNi = sample.ni !== undefined && sample.ni !== null ? String(sample.ni).trim() : '';

    const hasBucket = rawBucket !== '' && !isNaN(parseFloat(rawBucket)) && parseFloat(rawBucket) > 0;
    const hasNi = rawNi !== '' && !isNaN(parseFloat(rawNi));

    const buckets = hasBucket ? parseFloat(rawBucket) : 0;
    const gradeNi = hasNi ? parseFloat(rawNi) : null;
    const tonnage = hasBucket ? buckets * (parseFloat(tonnagePerBucket) || 0) : 0;
    const tonNi = (hasBucket && hasNi) ? tonnage * gradeNi : null;
    const classification = hasNi ? classifyOre(gradeNi) : { code: '-', ribbon: '-', badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700' };

    const isComplete = hasBucket && hasNi;

    return {
      hasBucket,
      hasNi,
      isComplete,
      buckets,
      gradeNi,
      tonnage,
      tonNi,
      classification
    };
  }

  calculateSummary() {
    const tonnagePerBucket = this.getTonnagePerBucket();
    let totalBuckets = 0;
    let totalTonnage = 0;
    let totalTonNi = 0;
    let completedCount = 0;

    this.samples.forEach(sample => {
      const calc = this.calculateSample(sample, tonnagePerBucket);
      if (calc.isComplete) {
        totalBuckets += calc.buckets;
        totalTonnage += calc.tonnage;
        totalTonNi += calc.tonNi;
        completedCount++;
      }
    });

    const weightedAvgGrade = totalTonnage > 0 ? totalTonNi / totalTonnage : 0;
    const compositeClassification = totalTonnage > 0
      ? classifyOre(weightedAvgGrade)
      : { code: '-', name: 'Belum Ada Ore', ribbon: '-', badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700' };

    return {
      tonnagePerBucket,
      totalBuckets,
      totalTonnage,
      totalTonNi,
      weightedAvgGrade,
      compositeClassification,
      completedCount
    };
  }

  updateParametersFromUI() {
    if (this.inputBucketCapacity) this.config.bucketCapacity = parseFloat(sanitizeDecimalInput(this.inputBucketCapacity.value)) || 0;
    if (this.inputFillFactor) this.config.fillFactor = parseFloat(sanitizeDecimalInput(this.inputFillFactor.value)) || 0;
    if (this.inputOreDensity) this.config.oreDensity = parseFloat(sanitizeDecimalInput(this.inputOreDensity.value)) || 0;
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

    // Update Parameter display
    const tonPerBkt = summary.tonnagePerBucket.toFixed(3);
    if (this.badgeTonnagePerBucket) this.badgeTonnagePerBucket.textContent = `${tonPerBkt} ton/bucket`;

    // Render Table and Cards
    const searchTerm = this.sampleSearch ? this.sampleSearch.value.trim().toLowerCase() : '';
    this.renderBothViews(searchTerm, summary);

    // Update Summary Displays
    this.updateSummaryDisplays(summary);
  }

  updateSummaryDisplays(summary) {
    const dec = this.config.decimalPlaces;

    // Card 1: Total Bucket
    if (this.cardTotalBuckets) this.cardTotalBuckets.textContent = summary.totalBuckets.toLocaleString('id-ID');

    // Card 2: Total Tonase
    if (this.cardTotalTonnage) this.cardTotalTonnage.textContent = summary.totalTonnage.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) + ' t';

    // Badge Count
    if (this.sampleCountBadge) {
      this.sampleCountBadge.textContent = `${this.samples.length} Sampel (${summary.completedCount} Komplit)`;
    }

    // Card 3: Rata-Rata Ni & Klasifikasi Komposit
    if (summary.totalTonnage === 0) {
      if (this.cardAvgGrade) {
        this.cardAvgGrade.textContent = `0.${'0'.repeat(dec)}%`;
        this.cardAvgGrade.className = 'text-3xl sm:text-4xl font-extrabold font-mono-calc text-slate-400';
      }
      if (this.cardOreClass) {
        this.cardOreClass.innerHTML = `<span class="text-xs text-slate-400 font-semibold">Belum Ada Ore</span>`;
      }
      if (this.cardCogStatusBadge) {
        this.cardCogStatusBadge.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <span class="w-2 h-2 rounded-full bg-slate-500"></span> Belum ada data
          </span>
        `;
      }
      if (this.cardCogDelta) {
        this.cardCogDelta.textContent = `Target COG: ${this.config.cog.toFixed(2)}%`;
        this.cardCogDelta.className = 'text-xs text-slate-400 mt-1';
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
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
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

    // Update Desktop Footer
    if (this.tableTotalBuckets) this.tableTotalBuckets.textContent = summary.totalBuckets.toLocaleString('id-ID');
    if (this.tableTotalTonnage) this.tableTotalTonnage.textContent = summary.totalTonnage.toFixed(3) + ' t';
    if (this.tableTotalTonGrade) this.tableTotalTonGrade.textContent = summary.totalTonnage > 0 ? summary.totalTonNi.toFixed(4) : '-';
    if (this.tableAvgGrade) {
      this.tableAvgGrade.textContent = summary.totalTonnage > 0 ? summary.weightedAvgGrade.toFixed(dec) + '%' : '-';
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

    // Highlight matrix card pedoman
    this.highlightActiveMatrixCard(summary.compositeClassification.code);

    // Update Chart & Print
    this.updateChart(summary);
    this.updatePrintMeta();
  }

  highlightActiveMatrixCard(activeCode) {
    const cards = document.querySelectorAll('.ore-matrix-card');
    cards.forEach(card => {
      const code = card.dataset.code;
      if (activeCode && activeCode !== '-' && code === activeCode) {
        card.classList.add('ring-2', 'ring-amber-400', 'shadow-lg', 'bg-slate-800/95');
      } else {
        card.classList.remove('ring-2', 'ring-amber-400', 'shadow-lg', 'bg-slate-800/95');
      }
    });
  }

  renderBothViews(filterText = '', precalcSummary = null) {
    const summary = precalcSummary || this.calculateSummary();
    const tonnagePerBucket = summary.tonnagePerBucket;

    const filtered = this.samples.filter(s => {
      if (!filterText) return true;
      return (s.name || '').toLowerCase().includes(filterText);
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
          <td colspan="8" class="text-center py-10 text-slate-400">
            <div class="flex flex-col items-center justify-center space-y-2">
              <div class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p class="font-medium text-slate-300 text-xs">Belum ada sampel. Klik '+ Tambah Baris' untuk mulai memasukkan data.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((sample, idx) => {
      const calc = this.calculateSample(sample, tonnagePerBucket);
      const isAboveCog = calc.hasNi && calc.gradeNi >= this.config.cog;
      const gradeClass = !calc.hasNi ? 'text-slate-300 border-slate-700/80 focus:border-amber-500' : (isAboveCog ? 'text-emerald-400 border-emerald-900/60' : 'text-rose-400 border-rose-900/60');
      const ore = calc.classification;

      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors table-row-animate group';
      tr.dataset.sampleId = sample.id;

      tr.innerHTML = `
        <!-- No. -->
        <td class="px-3 py-3 text-center text-xs font-semibold text-slate-400 w-12">
          ${idx + 1}
        </td>

        <!-- Nama Sampel -->
        <td class="px-3 py-3">
          <input type="text" 
                 value="${this.escapeHtml(sample.name || '')}" 
                 placeholder="Nama / Kode Sampel"
                 class="sample-name-input mining-input w-full px-2.5 py-1.5 text-xs font-semibold rounded focus:ring-1 focus:ring-amber-500"
                 data-id="${sample.id}">
        </td>

        <!-- Jumlah Bucket -->
        <td class="px-3 py-3 text-center w-36">
          <div class="inline-flex items-center space-x-1">
            <button class="btn-step-bucket-minus w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center transition-colors" data-id="${sample.id}">-</button>
            <input type="text" 
                   inputmode="decimal" 
                   value="${this.escapeHtml(sample.bucket !== undefined && sample.bucket !== null ? String(sample.bucket) : '')}" 
                   placeholder="0"
                   class="sample-buckets-input mining-input w-14 text-center py-1.5 text-xs font-mono-calc font-semibold rounded"
                   data-id="${sample.id}"
                   oninput="handleBucketInput(event, '${sample.id}')">
            <button class="btn-step-bucket-plus w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center transition-colors" data-id="${sample.id}">+</button>
          </div>
        </td>

        <!-- Estimasi Tonase (ton) -->
        <td class="px-3 py-3 text-right w-36">
          <span class="font-mono-calc font-bold text-xs text-cyan-300 cell-tonnage">
            ${calc.hasBucket ? calc.tonnage.toFixed(3) + ' ton' : '-'}
          </span>
        </td>

        <!-- Kadar Ni (%) -->
        <td class="px-3 py-3 text-right w-28">
          <div class="flex items-center justify-end space-x-1">
            <input type="text" 
                   inputmode="decimal" 
                   placeholder="0.00" 
                   value="${this.escapeHtml(sample.ni !== undefined && sample.ni !== null ? String(sample.ni) : '')}" 
                   class="sample-grade-input input-kadar mining-input w-20 text-right py-1.5 px-2 text-xs font-mono-calc font-bold rounded ${gradeClass}" 
                   data-id="${sample.id}"
                   oninput="handleGradeInput(event, '${sample.id}')">
            <span class="text-xs font-bold text-slate-400">%</span>
          </div>
        </td>

        <!-- Tonase × Ni -->
        <td class="px-3 py-3 text-right font-mono-calc font-semibold text-xs text-slate-300 w-28 cell-ton-ni">
          ${calc.isComplete ? calc.tonNi.toFixed(4) : '-'}
        </td>

        <!-- Klasifikasi Ore Badge -->
        <td class="px-3 py-3 text-center w-36 cell-ore-badge">
          ${calc.hasNi 
            ? `<span class="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-black tracking-wide ${ore.badgeClass}" title="${ore.name}: ${ore.description} (Pita: ${ore.ribbon})">${ore.code}</span>` 
            : `<span class="text-slate-400 text-xs">-</span>`}
        </td>

        <!-- Aksi -->
        <td class="px-3 py-3 text-center w-20 no-print">
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
        <div class="text-center py-8 text-slate-400 glass-panel rounded-xl p-5 border border-slate-800/80 flex flex-col items-center justify-center space-y-2">
          <div class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p class="font-medium text-slate-300 text-xs">Belum ada sampel. Klik '+ Tambah Baris' untuk mulai memasukkan data.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((sample, idx) => {
      const calc = this.calculateSample(sample, tonnagePerBucket);
      const isAboveCog = calc.hasNi && calc.gradeNi >= this.config.cog;
      const gradeClass = !calc.hasNi ? 'text-slate-300 border-slate-700/80 focus:border-amber-500' : (isAboveCog ? 'text-emerald-400 border-emerald-900/60' : 'text-rose-400 border-rose-900/60');
      const ore = calc.classification;

      const card = document.createElement('div');
      card.className = 'glass-panel rounded-xl p-3 border border-slate-800 space-y-2.5 table-row-animate';
      card.dataset.sampleId = sample.id;

      card.innerHTML = `
        <!-- Baris 1: Index + Nama + Aksi -->
        <div class="flex items-center justify-between gap-2">
          <span class="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
            ${idx + 1}
          </span>
          <input type="text" 
                 value="${this.escapeHtml(sample.name || '')}" 
                 placeholder="Nama / Kode Sampel"
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

        <!-- Baris 2: Input Bucket & Input Ni (%) -->
        <div class="grid grid-cols-2 gap-2">
          <!-- Bucket Stepper -->
          <div class="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
            <span class="text-[10px] text-slate-400 font-medium block mb-1">Jumlah Bucket:</span>
            <div class="flex items-center justify-between">
              <button class="btn-step-bucket-minus touch-stepper-btn rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm border border-slate-700 active:scale-95" 
                      data-id="${sample.id}">-</button>
              <input type="text" 
                     inputmode="decimal" 
                     value="${this.escapeHtml(sample.bucket !== undefined && sample.bucket !== null ? String(sample.bucket) : '')}" 
                     placeholder="0" 
                     class="sample-buckets-input mining-input w-12 text-center py-1 text-xs font-mono-calc font-bold rounded" 
                     data-id="${sample.id}"
                     oninput="handleBucketInput(event, '${sample.id}')">
              <button class="btn-step-bucket-plus touch-stepper-btn rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm border border-slate-700 active:scale-95" 
                      data-id="${sample.id}">+</button>
            </div>
          </div>

          <!-- Kadar Ni (%) -->
          <div class="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-medium mb-1">Kadar Ni (%):</span>
            <div class="relative">
              <input type="text" 
                     inputmode="decimal" 
                     placeholder="0.00" 
                     value="${this.escapeHtml(sample.ni !== undefined && sample.ni !== null ? String(sample.ni) : '')}" 
                     class="sample-grade-input input-kadar mining-input w-full py-1 pl-2 pr-6 text-xs font-mono-calc font-bold rounded ${gradeClass}" 
                     data-id="${sample.id}" 
                     oninput="handleGradeInput(event, '${sample.id}')">
              <span class="absolute right-2 top-1 text-xs font-bold text-slate-400">%</span>
            </div>
          </div>
        </div>

        <!-- Baris 3: Hasil Terhitung (Tonase, Ton × Ni, Klasifikasi) -->
        <div class="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-xs">
          <div class="flex items-center space-x-2">
            <span class="text-[10px] text-slate-400">Tonase:</span>
            <span class="font-mono-calc font-bold text-cyan-300 card-tonnage">
              ${calc.hasBucket ? calc.tonnage.toFixed(3) + ' t' : '-'}
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <span class="text-[10px] text-slate-400">Ton × Ni:</span>
            <span class="font-mono-calc font-semibold text-slate-300 card-ton-ni">
              ${calc.isComplete ? calc.tonNi.toFixed(4) : '-'}
            </span>
          </div>

          <div class="card-ore-badge">
            ${calc.hasNi 
              ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${ore.badgeClass}" title="${ore.name}: ${ore.description} (Pita: ${ore.ribbon})">${ore.code}</span>` 
              : `<span class="text-slate-500 text-xs">-</span>`}
          </div>
        </div>
      `;

      this.mobileCardsContainer.appendChild(card);
    });
  }

  bindSampleEvents() {
    const rootElements = [this.tableBody, this.mobileCardsContainer].filter(Boolean);

    rootElements.forEach(root => {
      // Nama input
      root.querySelectorAll('.sample-name-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const id = e.target.dataset.id;
          const item = this.samples.find(s => s.id === id);
          if (item) {
            item.name = e.target.value.trim();
            this.updateChart();
            this.updatePrintMeta();
          }
        });
      });

      // Stepper minus
      root.querySelectorAll('.btn-step-bucket-minus').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.id;
          const item = this.samples.find(s => s.id === id);
          if (item) {
            const current = parseFloat(item.bucket) || 0;
            const updated = Math.max(0, Math.floor(current) - 1);
            item.bucket = updated > 0 ? String(updated) : '';
            this.syncBucketInputs(id, item.bucket);
            this.updateLiveCalculations(id);
          }
        };
      });

      // Stepper plus
      root.querySelectorAll('.btn-step-bucket-plus').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.id;
          const item = this.samples.find(s => s.id === id);
          if (item) {
            const current = parseFloat(item.bucket) || 0;
            const updated = Math.floor(current) + 1;
            item.bucket = String(updated);
            this.syncBucketInputs(id, item.bucket);
            this.updateLiveCalculations(id);
          }
        };
      });

      // Duplicate
      root.querySelectorAll('.btn-duplicate-row').forEach(btn => {
        btn.onclick = () => {
          this.duplicateSample(btn.dataset.id);
        };
      });

      // Delete
      root.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.onclick = () => {
          this.deleteSample(btn.dataset.id);
        };
      });
    });
  }

  syncBucketInputs(sampleId, value) {
    document.querySelectorAll(`.sample-buckets-input[data-id="${sampleId}"]`).forEach(input => {
      input.value = value;
    });
  }

  updateSampleGrade(sampleId, sanitizedVal, sourceInput) {
    const item = this.samples.find(s => s.id === sampleId);
    if (!item) return;
    item.ni = sanitizedVal;

    // Sync input lain (misal desktop ke mobile atau sebaliknya)
    document.querySelectorAll(`.sample-grade-input[data-id="${sampleId}"]`).forEach(inp => {
      if (inp !== sourceInput && inp.value !== sanitizedVal) {
        inp.value = sanitizedVal;
      }
    });

    this.updateLiveCalculations(sampleId);
  }

  updateSampleBucket(sampleId, sanitizedVal, sourceInput) {
    const item = this.samples.find(s => s.id === sampleId);
    if (!item) return;
    item.bucket = sanitizedVal;

    // Sync input lain
    document.querySelectorAll(`.sample-buckets-input[data-id="${sampleId}"]`).forEach(inp => {
      if (inp !== sourceInput && inp.value !== sanitizedVal) {
        inp.value = sanitizedVal;
      }
    });

    this.updateLiveCalculations(sampleId);
  }

  updateLiveCalculations(sampleId) {
    const summary = this.calculateSummary();
    const item = this.samples.find(s => s.id === sampleId);
    if (!item) return;

    const calc = this.calculateSample(item, summary.tonnagePerBucket);
    const isAboveCog = calc.hasNi && calc.gradeNi >= this.config.cog;
    const ore = calc.classification;

    // Update Desktop Row
    if (this.tableBody) {
      const desktopRow = this.tableBody.querySelector(`tr[data-sample-id="${sampleId}"]`);
      if (desktopRow) {
        const niInput = desktopRow.querySelector('.sample-grade-input');
        if (niInput) {
          if (!calc.hasNi) {
            niInput.classList.remove('text-emerald-400', 'border-emerald-900/60', 'text-rose-400', 'border-rose-900/60');
            niInput.classList.add('text-slate-300', 'border-slate-700/80');
          } else if (isAboveCog) {
            niInput.classList.add('text-emerald-400', 'border-emerald-900/60');
            niInput.classList.remove('text-rose-400', 'border-rose-900/60', 'text-slate-300', 'border-slate-700/80');
          } else {
            niInput.classList.add('text-rose-400', 'border-rose-900/60');
            niInput.classList.remove('text-emerald-400', 'border-emerald-900/60', 'text-slate-300', 'border-slate-700/80');
          }
        }

        const tonCell = desktopRow.querySelector('.cell-tonnage');
        if (tonCell) tonCell.textContent = calc.hasBucket ? calc.tonnage.toFixed(3) + ' ton' : '-';

        const tonNiCell = desktopRow.querySelector('.cell-ton-ni');
        if (tonNiCell) tonNiCell.textContent = calc.isComplete ? calc.tonNi.toFixed(4) : '-';

        const oreBadgeCell = desktopRow.querySelector('.cell-ore-badge');
        if (oreBadgeCell) {
          oreBadgeCell.innerHTML = calc.hasNi
            ? `<span class="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-black tracking-wide ${ore.badgeClass}" title="${ore.name}: ${ore.description} (Pita: ${ore.ribbon})">${ore.code}</span>`
            : `<span class="text-slate-400 text-xs">-</span>`;
        }
      }
    }

    // Update Mobile Card
    if (this.mobileCardsContainer) {
      const mobileCard = this.mobileCardsContainer.querySelector(`div[data-sample-id="${sampleId}"]`);
      if (mobileCard) {
        const mobileNiInput = mobileCard.querySelector('.sample-grade-input');
        if (mobileNiInput) {
          if (!calc.hasNi) {
            mobileNiInput.classList.remove('text-emerald-400', 'border-emerald-900/60', 'text-rose-400', 'border-rose-900/60');
            mobileNiInput.classList.add('text-slate-300', 'border-slate-700/80');
          } else if (isAboveCog) {
            mobileNiInput.classList.add('text-emerald-400', 'border-emerald-900/60');
            mobileNiInput.classList.remove('text-rose-400', 'border-rose-900/60', 'text-slate-300', 'border-slate-700/80');
          } else {
            mobileNiInput.classList.add('text-rose-400', 'border-rose-900/60');
            mobileNiInput.classList.remove('text-emerald-400', 'border-emerald-900/60', 'text-slate-300', 'border-slate-700/80');
          }
        }

        const cardTon = mobileCard.querySelector('.card-tonnage');
        if (cardTon) cardTon.textContent = calc.hasBucket ? calc.tonnage.toFixed(3) + ' t' : '-';

        const cardTonNi = mobileCard.querySelector('.card-ton-ni');
        if (cardTonNi) cardTonNi.textContent = calc.isComplete ? calc.tonNi.toFixed(4) : '-';

        const cardOreBadge = mobileCard.querySelector('.card-ore-badge');
        if (cardOreBadge) {
          cardOreBadge.innerHTML = calc.hasNi
            ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${ore.badgeClass}" title="${ore.name}: ${ore.description} (Pita: ${ore.ribbon})">${ore.code}</span>`
            : `<span class="text-slate-500 text-xs">-</span>`;
        }
      }
    }

    // Update summary metrics
    this.updateSummaryDisplays(summary);
  }

  // --- CRUD ACTIONS ---

  addSampleRow() {
    const newSample = createNewSample();
    this.samples.push(newSample);
    this.render();
    this.showToast(`Baris sampel #${this.samples.length} baru berhasil ditambahkan.`, 'success');
  }

  duplicateSample(id) {
    const original = this.samples.find(s => s.id === id);
    if (!original) return;

    const duplicated = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      name: original.name ? `${original.name} (Copy)` : '',
      bucket: original.bucket || '',
      ni: original.ni || ''
    };
    this.samples.push(duplicated);
    this.render();
    this.showToast(`Sampel "${original.name || 'Baru'}" diduplikasi.`, 'info');
  }

  deleteSample(id) {
    const index = this.samples.findIndex(s => s.id === id);
    if (index !== -1) {
      const removed = this.samples.splice(index, 1)[0];
      this.render();
      this.showToast(`Sampel "${removed.name || 'Sampel'}" dihapus.`, 'warning');
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
    this.showToast('Data contoh (HGS, MGSO, LGSO, SSO) berhasil dimuat!', 'success');
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
      if (typeof Chart === 'undefined') return;
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
                  if (sample && sample.ni) {
                    const ore = classifyOre(sample.ni);
                    return [
                      `Klasifikasi: ${ore.code} (${ore.name})`,
                      `Pita: ${ore.ribbon}`
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
    const labels = this.samples.map((s, idx) => s.name || `Sampel #${idx + 1}`);
    const grades = this.samples.map(s => parseFloat(s.ni) || 0);
    const bgColors = grades.map(g => g >= this.config.cog ? 'rgba(16, 185, 129, 0.75)' : 'rgba(244, 63, 94, 0.75)');
    const borderColors = grades.map(g => g >= this.config.cog ? '#10b981' : '#f43f5e');

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

  updateChart(summary) {
    if (!this.chartInstance) return;
    const calcSummary = summary || this.calculateSummary();
    this.chartInstance.data = this.getChartData(calcSummary);
    this.chartInstance.update();
  }

  // --- CSV EXPORT ---

  exportToCsv() {
    const summary = this.calculateSummary();
    const tonPerBucket = summary.tonnagePerBucket;

    const csv = [];
    csv.push(['LEMBAR ESTIMASI KADAR NIKEL PER DOME - GCSP']);
    csv.push(['Quick Calculation, Better Grade Control']);
    csv.push(['PT HALMAHERA SUKSES MINERAL']);
    csv.push([]);
    csv.push(['ID Dome:', this.config.domeInfo.domeId || '-']);
    csv.push(['Lokasi Pit / Blok:', this.config.domeInfo.pitLocation || '-']);
    csv.push(['Tanggal:', this.config.domeInfo.date || '-']);
    csv.push(['Grade Control Staff:', this.config.domeInfo.geologist || '-']);
    csv.push(['Alat Muat:', this.config.excavatorType]);
    csv.push(['Kapasitas Bucket:', `${this.config.bucketCapacity} m3`]);
    csv.push(['Fill Factor:', `${this.config.fillFactor}`]);
    csv.push(['Densitas Ore:', `${this.config.oreDensity} ton/m3`]);
    csv.push(['Tonase per Bucket:', `${tonPerBucket.toFixed(3)} ton`]);
    csv.push(['Target Cut Off Grade (COG):', `${this.config.cog.toFixed(2)}%`]);
    csv.push([]);
    csv.push(['No.', 'Nama Sampel', 'Jumlah Bucket', 'Estimasi Tonase (ton)', 'Kadar Ni (%)', 'Tonase x Ni', 'Klasifikasi Ore', 'Warna Pita', 'Keterangan']);

    this.samples.forEach((sample, idx) => {
      const calc = this.calculateSample(sample, tonPerBucket);
      csv.push([
        idx + 1,
        `"${sample.name || '-'}"`,
        calc.hasBucket ? calc.buckets : '',
        calc.hasBucket ? calc.tonnage.toFixed(3) : '',
        calc.hasNi ? calc.gradeNi.toFixed(2) : '',
        calc.isComplete ? calc.tonNi.toFixed(4) : '',
        `"${calc.classification.code}"`,
        `"${calc.classification.ribbon}"`,
        `"${calc.classification.description}"`
      ]);
    });

    csv.push([]);
    csv.push(['TOTAL / RATA-RATA DOME', '', summary.totalBuckets, summary.totalTonnage.toFixed(3), summary.weightedAvgGrade.toFixed(4), summary.totalTonNi.toFixed(4), `"${summary.compositeClassification.code}"`, `"${summary.compositeClassification.ribbon}"`, `"${summary.compositeClassification.description}"`]);
    csv.push([`STATUS COG:`, summary.weightedAvgGrade >= this.config.cog ? 'MEMENUHI COG (>= COG)' : 'DI BAWAH COG (< COG)']);
    csv.push([`KLASIFIKASI DOME:`, `"${summary.compositeClassification.code}"`]);
    csv.push([`WARNA PITA (FLAGGING):`, `"${summary.compositeClassification.ribbon}"`]);

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

  // --- PRINT TEMPLATE ---

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
        <td>${this.escapeHtml(s.name || '-')}</td>
        <td style="text-align: center;">${calc.hasBucket ? calc.buckets : '-'}</td>
        <td style="text-align: right;">${calc.hasBucket ? calc.tonnage.toFixed(3) : '-'}</td>
        <td style="text-align: right;">${calc.hasNi ? calc.gradeNi.toFixed(2) + '%' : '-'}</td>
        <td style="text-align: right;">${calc.isComplete ? calc.tonNi.toFixed(4) : '-'}</td>
        <td style="text-align: center; font-weight: bold;">${classLabel}</td>
      `;
      printTableBody.appendChild(tr);
    });

    const printTableFooter = document.getElementById('print-table-footer');
    if (printTableFooter) {
      const compLabel = summary.compositeClassification.code;

      printTableFooter.innerHTML = `
        <tr style="font-weight: bold; background-color: #f1f5f9;">
          <td colspan="2" style="text-align: right;">TOTAL & RATA-RATA:</td>
          <td style="text-align: center;">${summary.totalBuckets}</td>
          <td style="text-align: right;">${summary.totalTonnage.toFixed(3)} t</td>
          <td style="text-align: right;">${summary.totalTonnage > 0 ? summary.weightedAvgGrade.toFixed(3) + '%' : '-'}</td>
          <td style="text-align: right;">${summary.totalTonnage > 0 ? summary.totalTonNi.toFixed(4) : '-'}</td>
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
    if (printCogStatus) {
      if (summary.totalTonnage === 0) {
        printCogStatus.textContent = 'Belum Ada Data';
      } else {
        printCogStatus.textContent = summary.weightedAvgGrade >= this.config.cog ? 'MEMENUHI COG (≥ COG)' : 'DI BAWAH COG (< COG)';
      }
    }
  }

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

  escapeHtml(string) {
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Global scope helpers for external scripts & buttons
window.createNewSample = createNewSample;
window.classifyOre = classifyOre;
window.sanitizeDecimalInput = sanitizeDecimalInput;
window.handleGradeInput = handleGradeInput;
window.handleBucketInput = handleBucketInput;
window.toggleParamsAccordion = toggleParamsAccordion;

window.addSampleRow = function() {
  if (window.nickelApp) {
    window.nickelApp.addSampleRow();
  }
};

window.renderTable = function() {
  if (window.nickelApp) {
    window.nickelApp.render();
  }
};

window.updateCalculations = function() {
  if (window.nickelApp) {
    window.nickelApp.render();
  }
};

// State proxy to window.samples
Object.defineProperty(window, 'samples', {
  get() {
    return window.nickelApp ? window.nickelApp.samples : [];
  },
  set(newVal) {
    if (window.nickelApp) {
      window.nickelApp.samples = newVal;
    }
  }
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.nickelApp = new NickelDomeCalculator();
});
