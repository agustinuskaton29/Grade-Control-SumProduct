# GCSP (Grade Control SumProduct) Calculation App
**"Quick Calculation, Better Grade Control"**
*Progressive Web App (PWA) & Grade Control Stockpile Blending Estimation System (Exca 40 Ton)*

Aplikasi web modern, presisi, offline-ready (PWA), dan responsif (Mobile-First) untuk menghitung estimasi tonase dan kadar rata-rata tertimbang (*weighted average grade*) nikel (**Ni**) per dome stockpile tambang nikel laterit.

---

## 🛠️ Spesifikasi Alat & Parameter Dasar

| Parameter | Nilai Default | Keterangan |
|---|---|---|
| **Jenis Alat** | Exca 40 ton | Spesifikasi alat muat tunggal |
| **Kapasitas Bucket** | `2.2 m³` | Volume nominal bucket excavator |
| **Faktor Pengisian (Bucket Fill Factor)** | `1.10` (110%) | Efisiensi pengisian bucket |
| **Densitas Ore** | `1.70 ton/m³` | Berat jenis basah (*wet density*) |
| **Tonase per Bucket** | **`4.114 ton/bucket`** | $2.2 \times 1.10 \times 1.70 = 4.114\text{ ton/bucket}$ |

---

## 🔬 Matriks Klasifikasi Material & Warna Pita Penandaan (Flagging Ribbon)

Klasifikasi ditentukan otomatis berdasarkan kombinasi kadar Nikel (**Ni**) dan Besi (**Fe**), ditampilkan ringkas berupa kode TYPE resmi pada tabel, kartu, dan dokumen laporan:

### A. Kelompok Fe ≥ 30%
| TYPE | Kadar Ni (%) | Kadar Fe (%) | Warna Pita (Flagging) | Badge Styling | Keterangan |
|---|---|---|---|---|---|
| **OB** | $\text{Ni} \le 0.99\%$ | $\text{Fe} \ge 30\%$ | 🔵 **BIRU** | `bg-blue-600 text-white font-bold` | Overburden |
| **LIMONITE** | $\text{Ni} \ge 1.00\%$ | $\text{Fe} \ge 30\%$ | 🔴🟡 **MERAH - KUNING** | Gradien Merah - Kuning | Limonite Ore |

### B. Kelompok Fe < 30%
| TYPE | Kadar Ni (%) | Kadar Fe (%) | Warna Pita (Flagging) | Badge Styling | Keterangan |
|---|---|---|---|---|---|
| **KONSERVASI** | $1.00\% \le \text{Ni} \le 1.19\%$ | $\text{Fe} < 30\%$ | 🔵🌸 **BIRU - PINK** | Gradien Biru - Pink | Ore Konservasi |
| **SSO** | $1.20\% \le \text{Ni} \le 1.49\%$ | $\text{Fe} < 30\%$ | 🌸 **PINK** | `bg-pink-400 text-slate-900 font-semibold` | Subgrade Saprolite Ore |
| **LGSO** | $1.50\% \le \text{Ni} \le 1.69\%$ | $\text{Fe} < 30\%$ | 🟡 **KUNING** | `bg-yellow-400 text-slate-900 font-semibold` | Low Grade Saprolite Ore |
| **MGSO** | $1.70\% \le \text{Ni} \le 1.99\%$ | $\text{Fe} < 30\%$ | 🟢 **HIJAU** | `bg-emerald-600 text-white font-bold` | Medium Grade Saprolite Ore |
| **HGS** | $\text{Ni} \ge 2.00\%$ | $\text{Fe} < 30\%$ | 🔴 **MERAH** | `bg-red-600 text-white font-bold` | High Grade Saprolite Ore |

### C. Khusus
| TYPE | Kadar Ni (%) | Kadar Fe (%) | Warna Pita (Flagging) | Badge Styling | Keterangan |
|---|---|---|---|---|---|
| **WA** | $\text{Ni} < 1.00\%$ | $\text{Fe} < 30\%$ | ⚪ **PUTIH** | `bg-white text-slate-900 border font-semibold` | Waste Non-Ore / Di luar batas |

---

## 📐 Formula Perhitungan Tambang

1. **Estimasi Tonase per Baris Sampel**:
   $$\text{Estimasi Tonase (ton)} = \text{Jumlah Bucket} \times \text{Tonase per Bucket}$$

2. **Rata-rata Tertimbang Kadar Ni Dome (%)**:
   $$\text{Rata-rata Ni (\%)} = \frac{\sum (\text{Estimasi Tonase}_i \times \text{Kadar Ni}_i)}{\sum \text{Estimasi Tonase}_i}$$

3. **Rata-rata Tertimbang Kadar Fe Dome (%)**:
   $$\text{Rata-rata Fe (\%)} = \frac{\sum (\text{Estimasi Tonase}_i \times \text{Kadar Fe}_i)}{\sum \text{Estimasi Tonase}_i}$$

4. **Evaluasi Cut Off Grade (COG)**:
   - Jika $\text{Kadar Dome} \ge \text{COG}$: Badge Hijau **"MEMENUHI COG (≥ COG)"**
   - Jika $\text{Kadar Dome} < \text{COG}$: Badge Merah **"DI BAWAH COG (< COG)"**

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi aktif pada server lokal:
👉 **`http://localhost:5050`**

Atau langsung buka file [**`index.html`**](file:///d:/FGDP/CODING/KALKULATOR%20ESTIMASI%20KADAR%20NIKEL%20%28Ni%29%20PER%20DOME/index.html) menggunakan browser Anda.
