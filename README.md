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

## 🔬 Matriks Klasifikasi Saprolite (Acuan Kadar Ni & Fe < 30%)

Klasifikasi ditampilkan ringkas hanya berupa singkatan resmi pada tabel, kartu, dan laporan:

| Badge | Nama Lengkap | Kriteria Kadar | Deskripsi Peruntukan Stockpile | Styling Badge |
|---|---|---|---|---|
| **HGSO** | High Grade Saprolite Ore | $\text{Ni} \ge 2.0\%$ (Fe < 30%) | High grade Ni stockpile for Smelter | 🔴 `bg-red-600 text-white font-bold` |
| **MGSO** | Medium Grade Saprolite Ore | $1.7\% \le \text{Ni} < 2.0\%$ (Fe < 30%) | Medium grade Ni stockpile for Smelter | 🟢 `bg-emerald-600 text-white font-bold` |
| **LGSO** | Low Grade Saprolite Ore | $1.5\% \le \text{Ni} < 1.7\%$ (Fe < 30%) | Low grade Ni stockpile for Smelter | 🟡 `bg-yellow-400 text-black font-semibold` |
| **SSO** | Subgrade Saprolite Ore | $1.2\% \le \text{Ni} < 1.5\%$ (Fe < 30%) | Subgrade Saprolite Ore | 🔵 `bg-blue-500 text-white font-bold` |
| **(K)** | (K) | $\text{Ni} < 1.2\%$ | Di bawah cut-off Saprolite Ore | ⚫ `bg-slate-700 text-slate-200 font-bold` |

---

## 📐 Formula Perhitungan Tambang

1. **Estimasi Tonase per Baris Sampel**:
   $$\text{Estimasi Tonase (ton)} = \text{Jumlah Bucket} \times \text{Tonase per Bucket}$$

2. **Rata-rata Tertimbang Kadar Ni Dome (%)**:
   $$\text{Kadar Ni Dome (\%)} = \frac{\sum (\text{Estimasi Tonase}_i \times \text{Kadar Ni}_i)}{\sum \text{Estimasi Tonase}_i}$$

3. **Evaluasi Cut Off Grade (COG)**:
   - Jika $\text{Kadar Dome} \ge \text{COG}$: Badge Hijau **"MEMENUHI COG (≥ COG)"**
   - Jika $\text{Kadar Dome} < \text{COG}$: Badge Merah **"DI BAWAH COG (< COG)"**

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi aktif pada server lokal:
👉 **`http://localhost:5050`**

Atau langsung buka file [**`index.html`**](file:///d:/FGDP/CODING/KALKULATOR%20ESTIMASI%20KADAR%20NIKEL%20%28Ni%29%20PER%20DOME/index.html) menggunakan browser Anda.
