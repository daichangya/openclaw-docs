---
read_when:
    - Anda sedang mengubah runtime agent tersemat atau registry harness
    - Anda sedang mendaftarkan agent harness dari plugin bawaan atau tepercaya
    - Anda perlu memahami bagaimana plugin Codex berhubungan dengan provider model
sidebarTitle: Agent Harness
summary: Surface SDK eksperimental untuk plugin yang menggantikan eksekutor agent tersemat tingkat rendah
title: Plugin Agent Harness
x-i18n:
    generated_at: "2026-04-23T09:24:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugin Agent Harness

**Agent harness** adalah eksekutor tingkat rendah untuk satu giliran agent OpenClaw
yang sudah disiapkan. Ini bukan provider model, bukan channel, dan bukan registry tool.

Gunakan surface ini hanya untuk plugin native bawaan atau tepercaya. Kontraknya
masih eksperimental karena tipe parameternya sengaja mencerminkan runner tersemat saat ini.

## Kapan menggunakan harness

Daftarkan agent harness saat suatu keluarga model memiliki runtime sesi native-nya
sendiri dan transport provider OpenClaw normal merupakan abstraksi yang salah.

Contoh:

- server coding-agent native yang memiliki thread dan Compaction sendiri
- CLI lokal atau daemon yang harus melakukan streaming peristiwa plan/reasoning/tool native
- runtime model yang memerlukan resume id sendiri selain transkrip sesi OpenClaw

**Jangan** mendaftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model HTTP atau
WebSocket normal, bangun [plugin provider](/id/plugins/sdk-provider-plugins).

## Yang tetap dimiliki core

Sebelum harness dipilih, OpenClaw sudah menyelesaikan:

- provider dan model
- status auth runtime
- tingkat thinking dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan tool
- callback balasan channel dan callback streaming
- kebijakan fallback model dan peralihan live model

Pemisahan itu disengaja. Harness menjalankan upaya yang sudah disiapkan; harness tidak memilih
provider, mengganti delivery channel, atau diam-diam mengganti model.

## Daftarkan harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Harness agent native saya",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Mulai atau lanjutkan thread native Anda.
    // Gunakan params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, dan field upaya siap lainnya.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Menjalankan model terpilih melalui daemon agent native.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Kebijakan pemilihan

OpenClaw memilih harness setelah resolusi provider/model:

1. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa harness terdaftar dengan id tersebut.
2. `OPENCLAW_AGENT_RUNTIME=pi` memaksa harness PI bawaan.
3. `OPENCLAW_AGENT_RUNTIME=auto` meminta harness terdaftar apakah mereka mendukung
   provider/model yang telah diselesaikan.
4. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan PI kecuali fallback PI
   dinonaktifkan.

Kegagalan harness plugin muncul sebagai kegagalan run. Dalam mode `auto`, fallback PI
hanya digunakan saat tidak ada harness plugin terdaftar yang mendukung
provider/model yang telah diselesaikan. Setelah sebuah harness plugin mengklaim run, OpenClaw tidak
memutar ulang giliran yang sama melalui PI karena itu dapat mengubah semantik auth/runtime
atau menduplikasi efek samping.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Core memperlakukan itu
sebagai id harness plugin biasa; alias khusus Codex harus berada di plugin
atau konfigurasi operator, bukan di selector runtime bersama.

## Pairing provider plus harness

Sebagian besar harness juga harus mendaftarkan provider. Provider membuat referensi model,
status auth, metadata model, dan pemilihan `/model` terlihat bagi bagian lain
OpenClaw. Harness kemudian mengklaim provider itu dalam `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- id provider: `codex`
- referensi model pengguna: `codex/gpt-5.4`, `codex/gpt-5.2`, atau model lain yang dikembalikan
  oleh server aplikasi Codex
- id harness: `codex`
- auth: ketersediaan provider sintetis, karena harness Codex memiliki
  login/sesi Codex native
- permintaan app-server: OpenClaw mengirim bare model id ke Codex dan membiarkan
  harness berbicara dengan protokol app-server native

Plugin Codex bersifat aditif. Referensi `openai/gpt-*` biasa tetap menjadi referensi provider OpenAI
dan terus menggunakan jalur provider OpenClaw normal. Pilih `codex/gpt-*`
saat Anda menginginkan auth yang dikelola Codex, penemuan model Codex, thread native, dan
eksekusi app-server Codex. `/model` dapat berpindah di antara model Codex yang dikembalikan
oleh app-server Codex tanpa memerlukan kredensial provider OpenAI.

Untuk penyiapan operator, contoh prefiks model, dan konfigurasi khusus Codex, lihat
[Codex Harness](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.118.0` atau yang lebih baru. Plugin Codex memeriksa
handshake inisialisasi app-server dan memblokir server yang lebih lama atau tanpa versi sehingga
OpenClaw hanya berjalan terhadap surface protokol yang telah diuji.

### Middleware hasil tool app-server Codex

Plugin bawaan juga dapat melampirkan middleware `tool_result` khusus app-server Codex melalui `api.registerCodexAppServerExtensionFactory(...)` saat
manifest mereka mendeklarasikan `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Ini adalah seam plugin tepercaya untuk transformasi hasil tool async yang perlu
berjalan di dalam harness Codex native sebelum output tool diproyeksikan kembali
ke transkrip OpenClaw.

### Mode harness Codex native

Harness `codex` bawaan adalah mode Codex native untuk giliran agent OpenClaw
tersemat. Aktifkan plugin `codex` bawaan terlebih dahulu, dan sertakan `codex` di
`plugins.allow` jika konfigurasi Anda menggunakan allowlist yang ketat. Ini berbeda
dari `openai-codex/*`:

- `openai-codex/*` menggunakan OAuth ChatGPT/Codex melalui jalur provider OpenClaw
  normal.
- `codex/*` menggunakan provider Codex bawaan dan merutekan giliran melalui Codex
  app-server.

Saat mode ini berjalan, Codex memiliki native thread id, perilaku resume,
Compaction, dan eksekusi app-server. OpenClaw tetap memiliki channel chat,
cermin transkrip yang terlihat, kebijakan tool, persetujuan, delivery media, dan pemilihan
sesi. Gunakan `embeddedHarness.runtime: "codex"` dengan
`embeddedHarness.fallback: "none"` saat Anda perlu membuktikan bahwa hanya jalur
app-server Codex yang dapat mengklaim run. Konfigurasi itu hanya guard pemilihan:
kegagalan app-server Codex sudah langsung gagal alih-alih mencoba lagi melalui PI.

## Nonaktifkan fallback PI

Secara default, OpenClaw menjalankan agent tersemat dengan `agents.defaults.embeddedHarness`
diatur ke `{ runtime: "auto", fallback: "pi" }`. Dalam mode `auto`, plugin terdaftar
harness dapat mengklaim pasangan provider/model. Jika tidak ada yang cocok, OpenClaw fallback
ke PI.

Tetapkan `fallback: "none"` saat Anda memerlukan kegagalan pemilihan harness plugin yang hilang
alih-alih menggunakan PI. Kegagalan harness plugin yang dipilih sudah gagal keras. Ini
tidak memblokir `runtime: "pi"` yang eksplisit atau `OPENCLAW_AGENT_RUNTIME=pi`.

Untuk run tersemat khusus Codex:

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
ingin OpenClaw diam-diam fallback ke PI, pertahankan `runtime: "auto"` dan nonaktifkan
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

Override per agent menggunakan bentuk yang sama:

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

Dengan fallback dinonaktifkan, sesi gagal lebih awal saat harness yang diminta tidak
terdaftar, tidak mendukung provider/model yang telah diselesaikan, atau gagal sebelum
menghasilkan efek samping giliran. Itu disengaja untuk deployment khusus Codex dan
untuk live test yang harus membuktikan bahwa jalur app-server Codex benar-benar sedang digunakan.

Pengaturan ini hanya mengontrol harness agent tersemat. Ini tidak menonaktifkan
perutean model khusus provider untuk gambar, video, musik, TTS, PDF, atau lainnya.

## Sesi native dan cermin transkrip

Harness dapat menyimpan native session id, thread id, atau token resume sisi daemon.
Jaga binding itu tetap secara eksplisit terkait dengan sesi OpenClaw, dan tetap
cerminkan output assistant/tool yang terlihat pengguna ke transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat channel
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness PI bawaan pada giliran berikutnya
- perilaku generik `/new`, `/reset`, dan penghapusan sesi

Jika harness Anda menyimpan binding sidecar, implementasikan `reset(...)` agar OpenClaw dapat
menghapusnya saat sesi OpenClaw yang memilikinya di-reset.

## Hasil tool dan media

Core membangun daftar tool OpenClaw dan meneruskannya ke upaya yang disiapkan.
Saat harness menjalankan pemanggilan tool dinamis, kembalikan hasil tool melalui
bentuk hasil harness alih-alih mengirim media channel sendiri.

Ini menjaga output teks, gambar, video, musik, TTS, persetujuan, dan tool messaging
tetap berada pada jalur delivery yang sama seperti run berbasis PI.

## Batasan saat ini

- Jalur import publik bersifat generik, tetapi beberapa alias tipe upaya/hasil masih
  membawa nama `Pi` untuk kompatibilitas.
- Instalasi harness pihak ketiga masih eksperimental. Pilih plugin provider
  sampai Anda membutuhkan runtime sesi native.
- Peralihan harness didukung antar giliran. Jangan mengganti harness di tengah
  giliran setelah tool native, persetujuan, teks assistant, atau pengiriman pesan
  dimulai.

## Terkait

- [Ringkasan SDK](/id/plugins/sdk-overview)
- [Helper Runtime](/id/plugins/sdk-runtime)
- [Plugin Provider](/id/plugins/sdk-provider-plugins)
- [Codex Harness](/id/plugins/codex-harness)
- [Provider Model](/id/concepts/model-providers)
