---
read_when:
    - Menginstal atau mengonfigurasi harness acpx untuk Claude Code / Codex / Gemini CLI
    - Mengaktifkan bridge MCP plugin-tools atau OpenClaw-tools
    - Mengonfigurasi mode izin ACP
summary: 'Menyiapkan agen ACP: config harness acpx, penyiapan Plugin, izin'
title: Agen ACP — penyiapan
x-i18n:
    generated_at: "2026-04-25T13:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Untuk gambaran umum, runbook operator, dan konsep, lihat [agen ACP](/id/tools/acp-agents).

Bagian di bawah ini mencakup config harness acpx, penyiapan Plugin untuk bridge MCP, dan konfigurasi izin.

## Dukungan harness acpx (saat ini)

Alias harness bawaan acpx saat ini:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Saat OpenClaw menggunakan backend acpx, utamakan nilai-nilai ini untuk `agentId` kecuali config acpx Anda mendefinisikan alias agen kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, timpa perintah agen `cursor` di config acpx Anda alih-alih mengubah default bawaan.

Penggunaan CLI acpx langsung juga dapat menargetkan adapter arbitrer melalui `--agent <command>`, tetapi escape hatch mentah itu adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw normal).

## Config yang diperlukan

Baseline ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Default adalah true; set false untuk menjeda dispatch ACP sambil mempertahankan kontrol /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Config pengikatan thread bersifat spesifik untuk adapter channel. Contoh untuk Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Jika spawn ACP yang terikat thread tidak berfungsi, verifikasi dulu feature flag adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Pengikatan percakapan saat ini tidak memerlukan pembuatan child-thread. Pengikatan ini memerlukan konteks percakapan aktif dan adapter channel yang mengekspos pengikatan percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi baru dikirimkan dengan Plugin runtime `acpx` bawaan yang diaktifkan secara default, jadi ACP
biasanya berfungsi tanpa langkah instalasi Plugin manual.

Mulailah dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin
beralih ke checkout pengembangan lokal, gunakan jalur Plugin eksplisit:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalasi workspace lokal selama pengembangan:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Lalu verifikasi kesehatan backend:

```text
/acp doctor
```

### Config perintah dan versi acpx

Secara default, Plugin `acpx` bawaan menggunakan biner yang dipin secara lokal pada Plugin (`node_modules/.bin/acpx` di dalam package Plugin). Saat startup, backend didaftarkan sebagai belum siap dan job latar belakang memverifikasi `acpx --version`; jika biner tidak ada atau tidak cocok, job itu menjalankan `npm install --omit=dev --no-save acpx@<pinned>` lalu memverifikasi ulang. Gateway tetap non-blocking selama proses ini.

Timpa perintah atau versi dalam config Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` menerima path absolut, path relatif (di-resolve dari workspace OpenClaw), atau nama perintah.
- `expectedVersion: "any"` menonaktifkan pencocokan versi yang ketat.
- Path `command` kustom menonaktifkan auto-install lokal Plugin.

Lihat [Plugin](/id/tools/plugin).

### Instalasi dependensi otomatis

Saat Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx
(biner spesifik platform) akan diinstal secara otomatis
melalui hook postinstall. Jika instalasi otomatis gagal, gateway tetap mulai
secara normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP tool Plugin

Secara default, sesi ACPX **tidak** mengekspos tool yang terdaftar oleh Plugin OpenClaw ke
harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil
tool Plugin OpenClaw yang terinstal seperti memory recall/store, aktifkan bridge khusus ini:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Apa yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos tool Plugin yang sudah terdaftar oleh Plugin OpenClaw yang terinstal dan diaktifkan.
- Menjaga fitur ini tetap eksplisit dan nonaktif secara default.

Catatan keamanan dan trust:

- Ini memperluas permukaan tool harness ACP.
- Agen ACP hanya mendapatkan akses ke tool Plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas trust yang sama dengan mengizinkan Plugin tersebut dieksekusi di
  OpenClaw itu sendiri.
- Tinjau Plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap berfungsi seperti sebelumnya. Bridge plugin-tools bawaan adalah
kemudahan tambahan yang opt-in, bukan pengganti config server MCP generik.

### Bridge MCP tool OpenClaw

Secara default, sesi ACPX juga **tidak** mengekspos tool bawaan OpenClaw melalui
MCP. Aktifkan bridge tool inti yang terpisah saat agen ACP memerlukan
tool bawaan terpilih seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Apa yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-tools` ke bootstrap sesi ACPX.
- Mengekspos tool bawaan OpenClaw terpilih. Server awal mengekspos `cron`.
- Menjaga eksposur tool inti tetap eksplisit dan nonaktif secara default.

### Config timeout runtime

Plugin `acpx` bawaan secara default menetapkan timeout 120 detik untuk giliran runtime tersemat. Ini memberi harness yang lebih lambat seperti Gemini CLI cukup waktu untuk menyelesaikan startup dan inisialisasi ACP. Timpa jika host Anda memerlukan
batas runtime yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Restart gateway setelah mengubah nilai ini.

### Config agen health probe

Plugin `acpx` bawaan mem-probe satu agen harness saat memutuskan apakah backend runtime tersemat sudah siap. Jika `acp.allowedAgents` ditetapkan, default-nya adalah
agen pertama yang diizinkan; jika tidak, default-nya `codex`. Jika deployment Anda
memerlukan agen ACP yang berbeda untuk health check, tetapkan agen probe secara eksplisit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Restart gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan secara non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin penulisan file dan eksekusi shell. Plugin acpx menyediakan dua key config yang mengontrol bagaimana izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah switch break-glass tingkat harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Setujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads` | Setujui otomatis hanya pembacaan; penulisan dan exec memerlukan prompt. |
| `deny-all`      | Tolak semua prompt izin.                                  |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi saat prompt izin akan ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu terjadi untuk sesi ACP).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**             |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi yang halus). |

### Konfigurasi

Tetapkan melalui config Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Restart gateway setelah mengubah nilai-nilai ini.

> **Penting:** OpenClaw saat ini menggunakan default `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, setiap penulisan atau exec yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jika Anda perlu membatasi izin, set `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi secara halus alih-alih crash.

## Terkait

- [agen ACP](/id/tools/acp-agents) — gambaran umum, runbook operator, konsep
- [Sub-agents](/id/tools/subagents)
- [Perutean multi-agen](/id/concepts/multi-agent)
