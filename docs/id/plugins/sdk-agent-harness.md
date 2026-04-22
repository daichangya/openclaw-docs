---
read_when:
    - Anda sedang mengubah runtime agen tertanam atau registry harness
    - Anda sedang mendaftarkan agent harness dari plugin bawaan atau tepercaya
    - Anda perlu memahami bagaimana plugin Codex berhubungan dengan penyedia model
sidebarTitle: Agent Harness
summary: Surface SDK eksperimental untuk plugin yang menggantikan eksekutor agen tertanam level rendah
title: Plugin Agent Harness
x-i18n:
    generated_at: "2026-04-22T09:14:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 728fef59ae3cce29a3348842820f1f71a2eac98ae6b276179bce6c85d16613df
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugin Agent Harness

**Agent harness** adalah eksekutor level rendah untuk satu giliran agen OpenClaw
yang sudah disiapkan. Ini bukan penyedia model, bukan saluran, dan bukan registry tool.

Gunakan surface ini hanya untuk plugin native bawaan atau tepercaya. Kontrak ini
masih eksperimental karena tipe parameternya sengaja mencerminkan runner
tertanam saat ini.

## Kapan menggunakan harness

Daftarkan agent harness ketika suatu keluarga model memiliki runtime sesi native
sendiri dan transport penyedia OpenClaw normal bukan abstraksi yang tepat.

Contoh:

- server coding-agent native yang memiliki thread dan Compaction
- CLI atau daemon lokal yang harus melakukan streaming event rencana/penalaran/tool native
- runtime model yang memerlukan resume id sendiri selain transkrip sesi OpenClaw

Jangan mendaftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model
HTTP atau WebSocket biasa, bangun [plugin provider](/id/plugins/sdk-provider-plugins).

## Yang tetap dimiliki core

Sebelum harness dipilih, OpenClaw sudah menyelesaikan:

- penyedia dan model
- status autentikasi runtime
- tingkat thinking dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan tool
- callback balasan saluran dan callback streaming
- kebijakan fallback model dan peralihan model live

Pemisahan itu disengaja. Harness menjalankan attempt yang sudah disiapkan; harness
tidak memilih penyedia, mengganti pengiriman saluran, atau diam-diam mengganti model.

## Mendaftarkan harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Kebijakan pemilihan

OpenClaw memilih harness setelah resolusi penyedia/model:

1. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa harness terdaftar dengan id tersebut.
2. `OPENCLAW_AGENT_RUNTIME=pi` memaksa harness PI bawaan.
3. `OPENCLAW_AGENT_RUNTIME=auto` meminta harness terdaftar apakah mereka mendukung
   penyedia/model yang telah di-resolve.
4. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan PI kecuali fallback PI
   dinonaktifkan.

Kegagalan harness plugin ditampilkan sebagai kegagalan run. Dalam mode `auto`,
fallback PI hanya digunakan ketika tidak ada harness plugin terdaftar yang mendukung
penyedia/model yang telah di-resolve. Setelah harness plugin telah mengklaim sebuah run,
OpenClaw tidak memutar ulang giliran yang sama melalui PI karena hal itu dapat mengubah
semantik autentikasi/runtime atau menduplikasi efek samping.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Core memperlakukan itu
sebagai id harness plugin biasa; alias khusus Codex harus berada di plugin
atau konfigurasi operator, bukan di selector runtime bersama.

## Pemasangan provider plus harness

Sebagian besar harness juga sebaiknya mendaftarkan provider. Provider membuat referensi model,
status autentikasi, metadata model, dan pemilihan `/model` terlihat oleh bagian lain
OpenClaw. Harness kemudian mengklaim provider tersebut di `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- id provider: `codex`
- referensi model pengguna: `codex/gpt-5.4`, `codex/gpt-5.2`, atau model lain yang dikembalikan
  oleh server aplikasi Codex
- id harness: `codex`
- autentikasi: ketersediaan provider sintetis, karena harness Codex memiliki login/sesi Codex native
- permintaan app-server: OpenClaw mengirim bare model id ke Codex dan membiarkan
  harness berbicara dengan protokol app-server native

Plugin Codex bersifat aditif. Referensi `openai/gpt-*` biasa tetap menjadi referensi provider OpenAI
dan terus menggunakan jalur provider OpenClaw normal. Pilih `codex/gpt-*`
saat Anda menginginkan autentikasi yang dikelola Codex, penemuan model Codex, thread native, dan
eksekusi app-server Codex. `/model` dapat beralih di antara model Codex yang dikembalikan
oleh app-server Codex tanpa memerlukan kredensial provider OpenAI.

Untuk penyiapan operator, contoh prefiks model, dan konfigurasi khusus Codex, lihat
[Codex Harness](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.118.0` atau yang lebih baru. Plugin Codex memeriksa
initialize handshake app-server dan memblokir server yang lebih lama atau tidak berversi agar
OpenClaw hanya berjalan terhadap surface protokol yang sudah diuji.

### Mode harness Codex native

Harness `codex` bawaan adalah mode Codex native untuk giliran agen OpenClaw
tertanam. Aktifkan plugin `codex` bawaan terlebih dahulu, dan sertakan `codex` di
`plugins.allow` jika konfigurasi Anda menggunakan allowlist yang ketat. Ini berbeda
dari `openai-codex/*`:

- `openai-codex/*` menggunakan OAuth ChatGPT/Codex melalui jalur provider OpenClaw normal.
- `codex/*` menggunakan provider Codex bawaan dan merutekan giliran melalui Codex
  app-server.

Saat mode ini berjalan, Codex memiliki thread id native, perilaku resume,
Compaction, dan eksekusi app-server. OpenClaw tetap memiliki saluran chat,
mirror transkrip yang terlihat, kebijakan tool, persetujuan, pengiriman media, dan
pemilihan sesi. Gunakan `embeddedHarness.runtime: "codex"` dengan
`embeddedHarness.fallback: "none"` saat Anda perlu membuktikan bahwa hanya jalur Codex
app-server yang dapat mengklaim run. Konfigurasi itu hanyalah penjaga pemilihan:
kegagalan app-server Codex sudah langsung gagal alih-alih mencoba lagi melalui PI.

## Menonaktifkan fallback PI

Secara default, OpenClaw menjalankan agen tertanam dengan `agents.defaults.embeddedHarness`
disetel ke `{ runtime: "auto", fallback: "pi" }`. Dalam mode `auto`, plugin terdaftar
harness dapat mengklaim pasangan provider/model. Jika tidak ada yang cocok, OpenClaw melakukan fallback
ke PI.

Setel `fallback: "none"` saat Anda perlu agar kegagalan pemilihan harness plugin yang hilang
langsung gagal alih-alih menggunakan PI. Kegagalan harness plugin yang terpilih sudah gagal keras.
Ini tidak memblokir `runtime: "pi"` eksplisit atau `OPENCLAW_AGENT_RUNTIME=pi`.

Untuk run tertanam khusus Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Jika Anda ingin harness plugin terdaftar mana pun mengklaim model yang cocok tetapi tidak pernah
ingin OpenClaw diam-diam melakukan fallback ke PI, pertahankan `runtime: "auto"` dan nonaktifkan
fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Override per agen menggunakan bentuk yang sama:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` tetap menimpa runtime yang dikonfigurasi. Gunakan
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` untuk menonaktifkan fallback PI dari
environment.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Dengan fallback dinonaktifkan, sebuah sesi gagal lebih awal ketika harness yang diminta tidak
terdaftar, tidak mendukung provider/model yang telah di-resolve, atau gagal sebelum
menghasilkan efek samping giliran. Ini disengaja untuk deployment khusus Codex dan
untuk pengujian live yang harus membuktikan bahwa jalur app-server Codex benar-benar digunakan.

Setelan ini hanya mengontrol harness agen tertanam. Ini tidak menonaktifkan
perutean model khusus provider untuk gambar, video, musik, TTS, PDF, atau yang lainnya.

## Sesi native dan mirror transkrip

Harness dapat menyimpan session id native, thread id, atau token resume sisi daemon.
Pertahankan keterikatan itu secara eksplisit terkait dengan sesi OpenClaw, dan tetap
mirror output assistant/tool yang terlihat pengguna ke dalam transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat di saluran
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness PI bawaan pada giliran berikutnya
- perilaku `/new`, `/reset`, dan penghapusan sesi generik

Jika harness Anda menyimpan sidecar binding, implementasikan `reset(...)` agar OpenClaw dapat
menghapusnya saat sesi OpenClaw pemilik di-reset.

## Hasil tool dan media

Core membangun daftar tool OpenClaw dan meneruskannya ke prepared attempt.
Saat harness mengeksekusi pemanggilan tool dinamis, kembalikan hasil tool melalui
shape hasil harness alih-alih mengirim media saluran sendiri.

Ini menjaga output teks, gambar, video, musik, TTS, persetujuan, dan messaging-tool
berada pada jalur pengiriman yang sama seperti run yang didukung PI.

## Keterbatasan saat ini

- Jalur import publik bersifat generik, tetapi beberapa alias tipe attempt/result masih
  membawa nama `Pi` demi kompatibilitas.
- Instalasi harness pihak ketiga masih eksperimental. Pilih plugin provider
  sampai Anda memerlukan runtime sesi native.
- Peralihan harness didukung antar giliran. Jangan mengganti harness di tengah
  giliran setelah tool native, persetujuan, teks assistant, atau pengiriman pesan
  telah dimulai.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Helper Runtime](/id/plugins/sdk-runtime)
- [Plugin Provider](/id/plugins/sdk-provider-plugins)
- [Codex Harness](/id/plugins/codex-harness)
- [Penyedia Model](/id/concepts/model-providers)
