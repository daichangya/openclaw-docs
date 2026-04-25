---
read_when:
    - Anda perlu menjelaskan workspace agent atau tata letak filenya
    - Anda ingin mencadangkan atau memigrasikan workspace agent
summary: 'Workspace agent: lokasi, tata letak, dan strategi backup'
title: Workspace agent
x-i18n:
    generated_at: "2026-04-25T13:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Workspace adalah rumah agent. Ini adalah satu-satunya direktori kerja yang digunakan untuk
tool file dan untuk konteks workspace. Jaga agar tetap private dan perlakukan sebagai memori.

Ini terpisah dari `~/.openclaw/`, yang menyimpan konfigurasi, kredensial, dan
sesi.

**Penting:** workspace adalah **cwd default**, bukan sandbox keras. Tool
menyelesaikan path relatif terhadap workspace, tetapi path absolut tetap dapat menjangkau
lokasi lain di host kecuali sandboxing diaktifkan. Jika Anda membutuhkan isolasi, gunakan
[`agents.defaults.sandbox`](/id/gateway/sandboxing) (dan/atau konfigurasi sandbox per‑agent).
Saat sandboxing diaktifkan dan `workspaceAccess` bukan `"rw"`, tool beroperasi
di dalam workspace sandbox di bawah `~/.openclaw/sandboxes`, bukan workspace host Anda.

## Lokasi default

- Default: `~/.openclaw/workspace`
- Jika `OPENCLAW_PROFILE` disetel dan bukan `"default"`, default menjadi
  `~/.openclaw/workspace-<profile>`.
- Override di `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure`, atau `openclaw setup` akan membuat
workspace dan menanam file bootstrap jika belum ada.
Salinan seed sandbox hanya menerima file reguler di dalam workspace; alias
symlink/hardlink yang diselesaikan ke luar workspace sumber akan diabaikan.

Jika Anda sudah mengelola file workspace sendiri, Anda dapat menonaktifkan pembuatan
file bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Folder workspace tambahan

Instalasi lama mungkin telah membuat `~/openclaw`. Menyimpan beberapa direktori
workspace dapat menyebabkan drift autentikasi atau status yang membingungkan, karena hanya
satu workspace yang aktif pada suatu waktu.

**Rekomendasi:** pertahankan satu workspace aktif. Jika Anda tidak lagi menggunakan
folder tambahan tersebut, arsipkan atau pindahkan ke Trash (misalnya `trash ~/openclaw`).
Jika Anda memang ingin mempertahankan beberapa workspace, pastikan
`agents.defaults.workspace` menunjuk ke workspace yang aktif.

`openclaw doctor` memperingatkan saat mendeteksi direktori workspace tambahan.

## Peta file workspace (arti setiap file)

Berikut adalah file standar yang diharapkan OpenClaw di dalam workspace:

- `AGENTS.md`
  - Instruksi operasional untuk agent dan bagaimana agent harus menggunakan memori.
  - Dimuat pada awal setiap sesi.
  - Tempat yang baik untuk aturan, prioritas, dan detail "bagaimana harus berperilaku".

- `SOUL.md`
  - Persona, nada, dan batasan.
  - Dimuat di setiap sesi.
  - Panduan: [Panduan Kepribadian SOUL.md](/id/concepts/soul)

- `USER.md`
  - Siapa pengguna itu dan bagaimana menyapanya.
  - Dimuat di setiap sesi.

- `IDENTITY.md`
  - Nama, vibe, dan emoji agent.
  - Dibuat/diperbarui selama ritual bootstrap.

- `TOOLS.md`
  - Catatan tentang tool lokal dan konvensi Anda.
  - Tidak mengontrol ketersediaan tool; ini hanya panduan.

- `HEARTBEAT.md`
  - Checklist kecil opsional untuk menjalankan Heartbeat.
  - Buat tetap singkat agar tidak memboroskan token.

- `BOOT.md`
  - Checklist startup opsional yang dijalankan otomatis saat restart gateway (saat [hook internal](/id/automation/hooks) diaktifkan).
  - Buat tetap singkat; gunakan message tool untuk pengiriman outbound.

- `BOOTSTRAP.md`
  - Ritual satu kali untuk proses pertama kali dijalankan.
  - Hanya dibuat untuk workspace yang benar-benar baru.
  - Hapus setelah ritual selesai.

- `memory/YYYY-MM-DD.md`
  - Log memori harian (satu file per hari).
  - Disarankan membaca hari ini + kemarin saat memulai sesi.

- `MEMORY.md` (opsional)
  - Memori jangka panjang yang dikurasi.
  - Hanya dimuat di sesi utama yang private (bukan konteks bersama/grup).

Lihat [Memory](/id/concepts/memory) untuk alur kerja dan flush memori otomatis.

- `skills/` (opsional)
  - Skills khusus workspace.
  - Lokasi Skills dengan prioritas tertinggi untuk workspace tersebut.
  - Meng-override skills agent proyek, skills agent pribadi, skills managed, skills bawaan, dan `skills.load.extraDirs` saat nama bertabrakan.

- `canvas/` (opsional)
  - File UI canvas untuk tampilan node (misalnya `canvas/index.html`).

Jika ada file bootstrap yang hilang, OpenClaw menyisipkan penanda "missing file" ke dalam
sesi dan melanjutkan. File bootstrap besar dipotong saat disisipkan;
sesuaikan batas dengan `agents.defaults.bootstrapMaxChars` (default: 12000) dan
`agents.defaults.bootstrapTotalMaxChars` (default: 60000).
`openclaw setup` dapat membuat ulang default yang hilang tanpa menimpa
file yang sudah ada.

## Apa yang TIDAK ada di workspace

Ini berada di bawah `~/.openclaw/` dan TIDAK boleh dikomit ke repo workspace:

- `~/.openclaw/openclaw.json` (konfigurasi)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profil autentikasi model: OAuth + API key)
- `~/.openclaw/credentials/` (status saluran/provider plus data impor OAuth lama)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrip sesi + metadata)
- `~/.openclaw/skills/` (Skills managed)

Jika Anda perlu memigrasikan sesi atau konfigurasi, salin secara terpisah dan simpan
di luar version control.

## Backup git (direkomendasikan, private)

Perlakukan workspace sebagai memori private. Letakkan di repo git **private** agar
di-back up dan dapat dipulihkan.

Jalankan langkah-langkah ini di mesin tempat Gateway berjalan (di situlah
workspace berada).

### 1) Inisialisasi repo

Jika git terinstal, workspace baru akan diinisialisasi secara otomatis. Jika
workspace ini belum menjadi repo, jalankan:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Tambahkan remote private (opsi ramah pemula)

Opsi A: GitHub web UI

1. Buat repository **private** baru di GitHub.
2. Jangan inisialisasi dengan README (menghindari konflik merge).
3. Salin URL remote HTTPS.
4. Tambahkan remote dan push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opsi B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opsi C: GitLab web UI

1. Buat repository **private** baru di GitLab.
2. Jangan inisialisasi dengan README (menghindari konflik merge).
3. Salin URL remote HTTPS.
4. Tambahkan remote dan push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Pembaruan berkelanjutan

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Jangan komit secrets

Bahkan di repo private, hindari menyimpan secrets di workspace:

- API key, token OAuth, password, atau kredensial private.
- Apa pun di bawah `~/.openclaw/`.
- Dump mentah obrolan atau lampiran sensitif.

Jika Anda harus menyimpan referensi sensitif, gunakan placeholder dan simpan
secret yang sebenarnya di tempat lain (password manager, environment variables, atau `~/.openclaw/`).

Saran awal `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Memindahkan workspace ke mesin baru

1. Clone repo ke path yang diinginkan (default `~/.openclaw/workspace`).
2. Setel `agents.defaults.workspace` ke path tersebut di `~/.openclaw/openclaw.json`.
3. Jalankan `openclaw setup --workspace <path>` untuk menanam file yang mungkin hilang.
4. Jika Anda membutuhkan sesi, salin `~/.openclaw/agents/<agentId>/sessions/` dari
   mesin lama secara terpisah.

## Catatan lanjutan

- Perutean multi-agent dapat menggunakan workspace berbeda per agent. Lihat
  [Perutean saluran](/id/channels/channel-routing) untuk konfigurasi perutean.
- Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menggunakan
  workspace sandbox per sesi di bawah `agents.defaults.sandbox.workspaceRoot`.

## Terkait

- [Standing Orders](/id/automation/standing-orders) — instruksi persisten di file workspace
- [Heartbeat](/id/gateway/heartbeat) — file workspace HEARTBEAT.md
- [Sesi](/id/concepts/session) — path penyimpanan sesi
- [Sandboxing](/id/gateway/sandboxing) — akses workspace di lingkungan sandboxed
