---
read_when:
    - Melakukan scripting atau debugging browser agen melalui API kontrol lokal
    - Mencari referensi CLI `openclaw browser`
    - Menambahkan otomatisasi browser kustom dengan snapshot dan ref
summary: API kontrol browser OpenClaw, referensi CLI, dan tindakan scripting
title: API kontrol browser
x-i18n:
    generated_at: "2026-04-25T13:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1515ca1e31e6fd8fd3e0f34f17ce309c52202e26ed3b79e24a460380efab040d
    source_path: tools/browser-control.md
    workflow: 15
---

Untuk penyiapan, konfigurasi, dan pemecahan masalah, lihat [Browser](/id/tools/browser).
Halaman ini adalah referensi untuk API HTTP kontrol lokal, CLI `openclaw browser`,
dan pola scripting (snapshot, ref, wait, alur debug).

## API Kontrol (opsional)

Hanya untuk integrasi lokal, Gateway mengekspos API HTTP loopback kecil:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Aksi: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Unduhan: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Jaringan: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Pengaturan: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Semua endpoint menerima `?profile=<name>`. `POST /start?headless=true` meminta
peluncuran headless sekali pakai untuk profil terkelola lokal tanpa mengubah
konfigurasi browser yang disimpan; profil attach-only, CDP jarak jauh, dan sesi yang sudah ada menolak
override tersebut karena OpenClaw tidak meluncurkan proses browser tersebut.

Jika autentikasi gateway shared-secret dikonfigurasi, rute HTTP browser juga memerlukan autentikasi:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` atau autentikasi HTTP Basic dengan kata sandi tersebut

Catatan:

- API browser loopback mandiri ini **tidak** menggunakan trusted-proxy atau
  header identitas Tailscale Serve.
- Jika `gateway.auth.mode` adalah `none` atau `trusted-proxy`, rute browser loopback ini
  tidak mewarisi mode pembawa identitas tersebut; tetap gunakan hanya loopback.

### Kontrak error `/act`

`POST /act` menggunakan respons error terstruktur untuk validasi tingkat rute dan
kegagalan kebijakan:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Nilai `code` saat ini:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` tidak ada atau tidak dikenali.
- `ACT_INVALID_REQUEST` (HTTP 400): payload aksi gagal dinormalisasi atau divalidasi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` digunakan dengan jenis aksi yang tidak didukung.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (atau `wait --fn`) dinonaktifkan oleh konfigurasi.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` level atas atau batch bertentangan dengan target permintaan.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): aksi tidak didukung untuk profil sesi yang sudah ada.

Kegagalan runtime lainnya masih dapat mengembalikan `{ "error": "<message>" }` tanpa
field `code`.

### Persyaratan Playwright

Beberapa fitur (navigate/act/AI snapshot/role snapshot, screenshot elemen,
PDF) memerlukan Playwright. Jika Playwright tidak terinstal, endpoint tersebut mengembalikan
error 501 yang jelas.

Yang masih berfungsi tanpa Playwright:

- Snapshot ARIA
- Screenshot halaman untuk browser `openclaw` terkelola saat WebSocket CDP
  per-tab tersedia
- Screenshot halaman untuk profil `existing-session` / Chrome MCP
- Screenshot berbasis ref `existing-session` (`--ref`) dari keluaran snapshot

Yang masih memerlukan Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- Screenshot elemen selektor CSS (`--element`)
- ekspor PDF browser penuh

Screenshot elemen juga menolak `--full-page`; rute mengembalikan `fullPage is
not supported for element screenshots`.

Jika Anda melihat `Playwright is not available in this gateway build`, perbaiki
dependency runtime plugin browser bawaan sehingga `playwright-core` terinstal,
lalu mulai ulang gateway. Untuk instalasi paket, jalankan `openclaw doctor --fix`.
Untuk Docker, instal juga biner browser Chromium seperti ditunjukkan di bawah.

#### Instalasi Playwright Docker

Jika Gateway Anda berjalan di Docker, hindari `npx playwright` (konflik override npm).
Gunakan CLI bawaan sebagai gantinya:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Untuk mempertahankan unduhan browser, tetapkan `PLAYWRIGHT_BROWSERS_PATH` (misalnya,
`/home/node/.cache/ms-playwright`) dan pastikan `/home/node` dipertahankan melalui
`OPENCLAW_HOME_VOLUME` atau bind mount. Lihat [Docker](/id/install/docker).

## Cara kerjanya (internal)

Server kontrol loopback kecil menerima permintaan HTTP dan terhubung ke browser berbasis Chromium melalui CDP. Aksi lanjutan (click/type/snapshot/PDF) melewati Playwright di atas CDP; saat Playwright tidak ada, hanya operasi non-Playwright yang tersedia. Agen melihat satu antarmuka stabil sementara browser dan profil lokal/jarak jauh dapat saling bertukar bebas di bawahnya.

## Referensi cepat CLI

Semua perintah menerima `--browser-profile <name>` untuk menargetkan profil tertentu, dan `--json` untuk keluaran yang dapat dibaca mesin.

<AccordionGroup>

<Accordion title="Dasar: status, tab, buka/fokus/tutup">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # peluncuran headless terkelola lokal sekali pakai
openclaw browser stop            # juga membersihkan emulasi pada attach-only/CDP jarak jauh
openclaw browser tabs
openclaw browser tab             # pintasan untuk tab saat ini
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspeksi: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # atau --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Aksi: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # atau e12 untuk role ref
openclaw browser click-coords 120 340        # koordinat viewport
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Status: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear untuk menghapus
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Catatan:

- `upload` dan `dialog` adalah panggilan **arming**; jalankan sebelum click/press yang memicu chooser/dialog.
- `click`/`type`/dst memerlukan `ref` dari `snapshot` (angka `12`, role ref `e12`, atau ARIA ref yang dapat ditindaklanjuti `ax12`). Selektor CSS sengaja tidak didukung untuk aksi. Gunakan `click-coords` saat posisi viewport yang terlihat adalah satu-satunya target yang andal.
- Jalur download, trace, dan upload dibatasi ke root temp OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` juga dapat mengatur input file secara langsung melalui `--input-ref` atau `--element`.

Sekilas tentang flag snapshot:

- `--format ai` (default dengan Playwright): AI snapshot dengan ref numerik (`aria-ref="<n>"`).
- `--format aria`: pohon aksesibilitas dengan ref `axN`. Saat Playwright tersedia, OpenClaw mengikat ref dengan backend DOM id ke halaman live sehingga aksi lanjutan dapat menggunakannya; jika tidak, perlakukan keluaran ini hanya untuk inspeksi.
- `--efficient` (atau `--mode efficient`): preset role snapshot ringkas. Tetapkan `browser.snapshotDefaults.mode: "efficient"` agar ini menjadi default (lihat [Konfigurasi Gateway](/id/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` memaksa role snapshot dengan ref `ref=e12`. `--frame "<iframe>"` membatasi role snapshot ke iframe.
- `--labels` menambahkan screenshot khusus viewport dengan label ref yang dioverlay (mencetak `MEDIA:<path>`).
- `--urls` menambahkan tujuan tautan yang ditemukan ke AI snapshot.

## Snapshot dan ref

OpenClaw mendukung dua gaya “snapshot”:

- **AI snapshot (ref numerik)**: `openclaw browser snapshot` (default; `--format ai`)
  - Keluaran: snapshot teks yang menyertakan ref numerik.
  - Aksi: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Secara internal, ref diselesaikan melalui `aria-ref` milik Playwright.

- **Role snapshot (role ref seperti `e12`)**: `openclaw browser snapshot --interactive` (atau `--compact`, `--depth`, `--selector`, `--frame`)
  - Keluaran: daftar/pohon berbasis role dengan `[ref=e12]` (dan opsional `[nth=1]`).
  - Aksi: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Secara internal, ref diselesaikan melalui `getByRole(...)` (ditambah `nth()` untuk duplikat).
  - Tambahkan `--labels` untuk menyertakan screenshot viewport dengan label `e12` yang dioverlay.
  - Tambahkan `--urls` saat teks tautan ambigu dan agen memerlukan target
    navigasi yang konkret.

- **ARIA snapshot (ARIA ref seperti `ax12`)**: `openclaw browser snapshot --format aria`
  - Keluaran: pohon aksesibilitas sebagai node terstruktur.
  - Aksi: `openclaw browser click ax12` berfungsi saat jalur snapshot dapat mengikat
    ref melalui Playwright dan Chrome backend DOM id.
  - Jika Playwright tidak tersedia, ARIA snapshot tetap berguna untuk
    inspeksi, tetapi ref mungkin tidak dapat ditindaklanjuti. Lakukan snapshot ulang dengan `--format ai`
    atau `--interactive` saat Anda memerlukan ref aksi.

Perilaku ref:

- Ref **tidak stabil antar navigasi**; jika sesuatu gagal, jalankan ulang `snapshot` dan gunakan ref baru.
- Jika role snapshot diambil dengan `--frame`, role ref dibatasi ke iframe tersebut hingga role snapshot berikutnya.
- Ref `axN` yang tidak dikenal atau kedaluwarsa akan langsung gagal alih-alih diteruskan ke
  selektor `aria-ref` milik Playwright. Jalankan snapshot baru pada tab yang sama saat
  hal itu terjadi.

## Peningkatan wait

Anda dapat menunggu lebih dari sekadar waktu/teks:

- Menunggu URL (glob didukung oleh Playwright):
  - `openclaw browser wait --url "**/dash"`
- Menunggu status load:
  - `openclaw browser wait --load networkidle`
- Menunggu predikat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Menunggu selektor menjadi terlihat:
  - `openclaw browser wait "#main"`

Ini dapat digabungkan:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Alur debug

Saat sebuah aksi gagal (misalnya “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Gunakan `click <ref>` / `type <ref>` (utamakan role ref dalam mode interaktif)
3. Jika masih gagal: `openclaw browser highlight <ref>` untuk melihat apa yang ditargetkan Playwright
4. Jika halaman berperilaku aneh:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Untuk debug mendalam: rekam trace:
   - `openclaw browser trace start`
   - reproduksi masalahnya
   - `openclaw browser trace stop` (mencetak `TRACE:<path>`)

## Keluaran JSON

`--json` ditujukan untuk scripting dan tooling terstruktur.

Contoh:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshot dalam JSON menyertakan `refs` plus blok kecil `stats` (lines/chars/refs/interactive) agar alat dapat memahami ukuran dan kepadatan payload.

## Pengaturan status dan environment

Ini berguna untuk alur kerja “buat situs berperilaku seperti X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (versi lama `set headers --json '{"X-Debug":"1"}'` tetap didukung)
- Autentikasi HTTP basic: `set credentials user pass` (atau `--clear`)
- Geolokasi: `set geo <lat> <lon> --origin "https://example.com"` (atau `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zona waktu / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (preset device Playwright)
  - `set viewport 1280 720`

## Keamanan dan privasi

- Profil browser openclaw dapat berisi sesi yang sudah login; perlakukan sebagai sesuatu yang sensitif.
- `browser act kind=evaluate` / `openclaw browser evaluate` dan `wait --fn`
  mengeksekusi JavaScript sewenang-wenang dalam konteks halaman. Prompt injection dapat
  mengarahkan hal ini. Nonaktifkan dengan `browser.evaluateEnabled=false` jika Anda tidak memerlukannya.
- Untuk login dan catatan anti-bot (X/Twitter, dll.), lihat [Login browser + posting X/Twitter](/id/tools/browser-login).
- Jaga host Gateway/node tetap privat (hanya loopback atau tailnet).
- Endpoint CDP jarak jauh sangat kuat; tunnel dan lindungi endpoint tersebut.

Contoh strict-mode (blok tujuan privat/internal secara default):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // izin tepat opsional
    },
  },
}
```

## Terkait

- [Browser](/id/tools/browser) — ikhtisar, konfigurasi, profil, keamanan
- [Login browser](/id/tools/browser-login) — masuk ke situs
- [Pemecahan masalah Browser Linux](/id/tools/browser-linux-troubleshooting)
- [Pemecahan masalah Browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
