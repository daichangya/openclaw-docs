---
read_when:
    - Anda ingin menginstal bundle yang kompatibel dengan Codex, Claude, atau Cursor
    - Anda perlu memahami bagaimana OpenClaw memetakan konten bundle ke fitur native
    - Anda sedang men-debug deteksi bundle atau kemampuan yang hilang
summary: Instal dan gunakan bundle Codex, Claude, dan Cursor sebagai plugin OpenClaw
title: Bundle Plugin
x-i18n:
    generated_at: "2026-04-23T09:23:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# Bundle Plugin

OpenClaw dapat menginstal plugin dari tiga ekosistem eksternal: **Codex**, **Claude**,
dan **Cursor**. Ini disebut **bundle** — paket konten dan metadata yang
dipetakan OpenClaw ke fitur native seperti Skills, hook, dan tool MCP.

<Info>
  Bundle **tidak** sama dengan plugin OpenClaw native. Plugin native berjalan
  in-process dan dapat mendaftarkan kemampuan apa pun. Bundle adalah paket konten dengan
  pemetaan fitur selektif dan batas kepercayaan yang lebih sempit.
</Info>

## Mengapa bundle ada

Banyak plugin berguna dipublikasikan dalam format Codex, Claude, atau Cursor. Alih-alih
mengharuskan penulis menulis ulang plugin tersebut sebagai plugin OpenClaw native, OpenClaw
mendeteksi format ini dan memetakan konten yang didukungnya ke set fitur native. Ini berarti Anda dapat menginstal paket perintah Claude atau bundle skill Codex
dan langsung menggunakannya.

## Instal bundle

<Steps>
  <Step title="Instal dari direktori, arsip, atau marketplace">
    ```bash
    # Direktori lokal
    openclaw plugins install ./my-bundle

    # Arsip
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verifikasi deteksi">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundle ditampilkan sebagai `Format: bundle` dengan subtype `codex`, `claude`, atau `cursor`.

  </Step>

  <Step title="Restart dan gunakan">
    ```bash
    openclaw gateway restart
    ```

    Fitur yang dipetakan (Skills, hook, tool MCP, default LSP) tersedia pada sesi berikutnya.

  </Step>
</Steps>

## Apa yang dipetakan OpenClaw dari bundle

Tidak semua fitur bundle berjalan di OpenClaw saat ini. Berikut yang berfungsi dan yang
terdeteksi tetapi belum dirangkai.

### Saat ini didukung

| Fitur         | Cara pemetaannya                                                                          | Berlaku untuk   |
| ------------- | ----------------------------------------------------------------------------------------- | --------------- |
| Konten skill  | Root skill bundle dimuat sebagai Skills OpenClaw normal                                   | Semua format    |
| Perintah      | `commands/` dan `.cursor/commands/` diperlakukan sebagai root skill                       | Claude, Cursor  |
| Paket hook    | Tata letak bergaya OpenClaw `HOOK.md` + `handler.ts`                                      | Codex           |
| Tool MCP      | Konfigurasi MCP bundle digabungkan ke pengaturan Pi tersemat; server stdio dan HTTP yang didukung dimuat | Semua format    |
| Server LSP    | Claude `.lsp.json` dan `lspServers` yang dideklarasikan manifest digabungkan ke default LSP Pi tersemat | Claude          |
| Pengaturan    | Claude `settings.json` diimpor sebagai default Pi tersemat                                | Claude          |

#### Konten skill

- root skill bundle dimuat sebagai root skill OpenClaw normal
- root `commands` Claude diperlakukan sebagai root skill tambahan
- root `.cursor/commands` Cursor diperlakukan sebagai root skill tambahan

Ini berarti file perintah markdown Claude bekerja melalui loader skill OpenClaw
normal. Markdown perintah Cursor bekerja melalui jalur yang sama.

#### Paket hook

- root hook bundle bekerja **hanya** saat menggunakan tata letak paket hook OpenClaw
  normal. Saat ini ini terutama kasus yang kompatibel dengan Codex:
  - `HOOK.md`
  - `handler.ts` atau `handler.js`

#### MCP untuk Pi

- bundle yang diaktifkan dapat menyumbangkan konfigurasi server MCP
- OpenClaw menggabungkan konfigurasi MCP bundle ke pengaturan Pi tersemat efektif sebagai
  `mcpServers`
- OpenClaw mengekspos tool MCP bundle yang didukung selama giliran agent Pi tersemat dengan
  meluncurkan server stdio atau terhubung ke server HTTP
- profil tool `coding` dan `messaging` menyertakan tool MCP bundle secara
  default; gunakan `tools.deny: ["bundle-mcp"]` untuk opt-out bagi agent atau Gateway
- pengaturan Pi lokal proyek tetap berlaku setelah default bundle, sehingga
  pengaturan workspace dapat menimpa entri MCP bundle bila diperlukan
- katalog tool MCP bundle diurutkan secara deterministik sebelum pendaftaran, sehingga
  perubahan urutan upstream `listTools()` tidak mengacaukan blok tool prompt-cache

##### Transport

Server MCP dapat menggunakan transport stdio atau HTTP:

**Stdio** meluncurkan proses anak:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** terhubung ke server MCP yang sedang berjalan melalui `sse` secara default, atau `streamable-http` jika diminta:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` dapat diatur ke `"streamable-http"` atau `"sse"`; jika dihilangkan, OpenClaw menggunakan `sse`
- hanya skema URL `http:` dan `https:` yang diizinkan
- nilai `headers` mendukung interpolasi `${ENV_VAR}`
- entri server dengan `command` dan `url` sekaligus ditolak
- kredensial URL (userinfo dan parameter kueri) disamarkan dari deskripsi
  dan log tool
- `connectionTimeoutMs` menimpa timeout koneksi default 30 detik untuk
  transport stdio dan HTTP

##### Penamaan tool

OpenClaw mendaftarkan tool MCP bundle dengan nama aman-provider dalam bentuk
`serverName__toolName`. Contohnya, server dengan kunci `"vigil-harbor"` yang mengekspos tool
`memory_search` akan didaftarkan sebagai `vigil-harbor__memory_search`.

- karakter di luar `A-Za-z0-9_-` diganti dengan `-`
- prefiks server dibatasi hingga 30 karakter
- nama tool lengkap dibatasi hingga 64 karakter
- nama server kosong fallback ke `mcp`
- nama tersanitasi yang bertabrakan dibedakan dengan sufiks numerik
- urutan tool akhir yang diekspos bersifat deterministik menurut nama aman agar giliran Pi berulang
  tetap stabil untuk cache
- pemfilteran profil memperlakukan semua tool dari satu server MCP bundle sebagai milik plugin
  `bundle-mcp`, sehingga allowlist dan deny list profil dapat menyertakan
  nama tool individual yang diekspos atau kunci plugin `bundle-mcp`

#### Pengaturan Pi tersemat

- Claude `settings.json` diimpor sebagai pengaturan Pi tersemat default saat
  bundle diaktifkan
- OpenClaw menyanitasi kunci override shell sebelum menerapkannya

Kunci yang disanitasi:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi tersemat

- bundle Claude yang diaktifkan dapat menyumbangkan konfigurasi server LSP
- OpenClaw memuat `.lsp.json` plus path `lspServers` yang dideklarasikan manifest
- konfigurasi LSP bundle digabungkan ke default LSP Pi tersemat yang efektif
- saat ini hanya server LSP berbasis stdio yang didukung untuk dijalankan; transport yang tidak didukung
  tetap ditampilkan di `openclaw plugins inspect <id>`

### Terdeteksi tetapi tidak dieksekusi

Ini dikenali dan ditampilkan dalam diagnostik, tetapi OpenClaw tidak menjalankannya:

- Claude `agents`, otomatisasi `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Metadata inline/app Codex di luar pelaporan kemampuan

## Format bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Penanda: `.codex-plugin/plugin.json`

    Konten opsional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundle Codex paling cocok dengan OpenClaw saat menggunakan root skill dan
    direktori paket hook bergaya OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Dua mode deteksi:

    - **Berbasis manifest:** `.claude-plugin/plugin.json`
    - **Tanpa manifest:** tata letak Claude default (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Perilaku khusus Claude:

    - `commands/` diperlakukan sebagai konten skill
    - `settings.json` diimpor ke pengaturan Pi tersemat (kunci override shell disanitasi)
    - `.mcp.json` mengekspos tool stdio yang didukung ke Pi tersemat
    - `.lsp.json` plus path `lspServers` yang dideklarasikan manifest dimuat ke default LSP Pi tersemat
    - `hooks/hooks.json` terdeteksi tetapi tidak dieksekusi
    - path komponen kustom dalam manifest bersifat aditif (memperluas default, bukan menggantikannya)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Penanda: `.cursor-plugin/plugin.json`

    Konten opsional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` diperlakukan sebagai konten skill
    - `.cursor/rules/`, `.cursor/agents/`, dan `.cursor/hooks.json` hanya dideteksi

  </Accordion>
</AccordionGroup>

## Prioritas deteksi

OpenClaw memeriksa format plugin native terlebih dahulu:

1. `openclaw.plugin.json` atau `package.json` valid dengan `openclaw.extensions` — diperlakukan sebagai **plugin native**
2. Penanda bundle (`.codex-plugin/`, `.claude-plugin/`, atau tata letak Claude/Cursor default) — diperlakukan sebagai **bundle**

Jika sebuah direktori mengandung keduanya, OpenClaw menggunakan jalur native. Ini mencegah
paket format ganda terinstal sebagian sebagai bundle.

## Dependensi runtime dan pembersihan

- Dependensi runtime plugin bawaan dikirim di dalam paket OpenClaw di bawah
  `dist/*`. OpenClaw **tidak** menjalankan `npm install` saat startup untuk
  plugin bawaan; pipeline rilis bertanggung jawab mengirim payload dependensi bawaan yang lengkap
  (lihat aturan verifikasi postpublish di
  [Releasing](/id/reference/RELEASING)).

## Keamanan

Bundle memiliki batas kepercayaan yang lebih sempit daripada plugin native:

- OpenClaw **tidak** memuat modul runtime bundle arbitrer secara in-process
- Path skill dan paket hook harus tetap berada di dalam root plugin (dicek boundary)
- File pengaturan dibaca dengan pemeriksaan boundary yang sama
- Server MCP stdio yang didukung dapat diluncurkan sebagai subproses

Ini membuat bundle lebih aman secara default, tetapi Anda tetap harus memperlakukan bundle pihak ketiga
sebagai konten tepercaya untuk fitur yang memang dieksposnya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bundle terdeteksi tetapi kemampuannya tidak berjalan">
    Jalankan `openclaw plugins inspect <id>`. Jika suatu kemampuan tercantum tetapi ditandai
    belum dirangkai, itu adalah batasan produk — bukan instalasi yang rusak.
  </Accordion>

  <Accordion title="File perintah Claude tidak muncul">
    Pastikan bundle diaktifkan dan file markdown berada di dalam root
    `commands/` atau `skills/` yang terdeteksi.
  </Accordion>

  <Accordion title="Pengaturan Claude tidak diterapkan">
    Hanya pengaturan Pi tersemat dari `settings.json` yang didukung. OpenClaw
    tidak memperlakukan pengaturan bundle sebagai patch konfigurasi mentah.
  </Accordion>

  <Accordion title="Hook Claude tidak dieksekusi">
    `hooks/hooks.json` hanya dideteksi. Jika Anda membutuhkan hook yang dapat dijalankan, gunakan
    tata letak paket hook OpenClaw atau kirim plugin native.
  </Accordion>
</AccordionGroup>

## Terkait

- [Instal dan Konfigurasikan Plugin](/id/tools/plugin)
- [Membangun Plugin](/id/plugins/building-plugins) — membuat plugin native
- [Manifest Plugin](/id/plugins/manifest) — skema manifest native
