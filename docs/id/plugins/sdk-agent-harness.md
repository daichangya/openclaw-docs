---
read_when:
    - Anda sedang mengubah runtime agent tersemat atau registry harness
    - Anda sedang mendaftarkan harness agent dari Plugin bawaan atau tepercaya
    - Anda perlu memahami bagaimana Plugin Codex berhubungan dengan provider model
sidebarTitle: Agent Harness
summary: Permukaan SDK eksperimental untuk Plugin yang menggantikan eksekutor agent tersemat tingkat rendah
title: Plugin harness agent
x-i18n:
    generated_at: "2026-04-25T13:51:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**Harness agent** adalah eksekutor tingkat rendah untuk satu giliran agent OpenClaw yang telah disiapkan. Ini bukan provider model, bukan saluran, dan bukan registry tool.
Untuk model mental yang menghadap pengguna, lihat [runtime agent](/id/concepts/agent-runtimes).

Gunakan permukaan ini hanya untuk Plugin native bawaan atau tepercaya. Kontrak ini
masih eksperimental karena tipe parameternya sengaja mencerminkan runner tersemat saat ini.

## Kapan menggunakan harness

Daftarkan harness agent saat suatu keluarga model memiliki runtime sesi native
sendiri dan transport provider OpenClaw normal adalah abstraksi yang salah.

Contoh:

- server coding-agent native yang memiliki thread dan Compaction
- CLI atau daemon lokal yang harus melakukan streaming event plan/reasoning/tool native
- runtime model yang memerlukan resume id sendiri selain transkrip sesi OpenClaw

**Jangan** mendaftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model HTTP atau
WebSocket normal, bangun [Plugin provider](/id/plugins/sdk-provider-plugins).

## Yang tetap dimiliki core

Sebelum harness dipilih, OpenClaw sudah menyelesaikan:

- provider dan model
- status auth runtime
- level thinking dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan tool
- callback balasan saluran dan callback streaming
- fallback model dan kebijakan perpindahan model live

Pemisahan itu disengaja. Harness menjalankan upaya yang telah disiapkan; harness tidak memilih
provider, mengganti pengiriman saluran, atau diam-diam mengganti model.

## Mendaftarkan harness

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
    // params.onAgentEvent, dan field upaya yang telah disiapkan lainnya.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Agent Native Saya",
  description: "Menjalankan model tertentu melalui daemon agent native.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Kebijakan pemilihan

OpenClaw memilih harness setelah resolusi provider/model:

1. Id harness yang tercatat pada sesi yang ada akan menang, sehingga perubahan config/env tidak
   melakukan hot-switch transkrip itu ke runtime lain.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa harness terdaftar dengan id tersebut untuk
   sesi yang belum dipin.
3. `OPENCLAW_AGENT_RUNTIME=pi` memaksa harness PI bawaan.
4. `OPENCLAW_AGENT_RUNTIME=auto` meminta harness terdaftar apakah mereka mendukung
   provider/model yang telah diselesaikan.
5. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan PI kecuali fallback PI
   dinonaktifkan.

Kegagalan harness Plugin muncul sebagai kegagalan run. Dalam mode `auto`, fallback PI
hanya digunakan saat tidak ada harness Plugin terdaftar yang mendukung
provider/model yang telah diselesaikan. Setelah harness Plugin telah mengklaim suatu run, OpenClaw tidak
mengulang giliran yang sama melalui PI karena hal itu dapat mengubah semantik auth/runtime
atau menduplikasi efek samping.

Id harness yang dipilih dipersistenkan bersama id sesi setelah run tersemat.
Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai terpaku ke PI setelah
memiliki riwayat transkrip. Gunakan sesi baru/reset saat berpindah antara PI dan
harness Plugin native. `/status` menampilkan id harness non-default seperti `codex`
di samping `Fast`; PI tetap disembunyikan karena merupakan jalur kompatibilitas default.
Jika harness yang dipilih terasa mengejutkan, aktifkan logging debug `agents/harness` dan
periksa record terstruktur `agent harness selected` milik gateway. Record ini mencakup
id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan, dalam
mode `auto`, hasil dukungan setiap kandidat Plugin.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Core memperlakukannya
sebagai id harness Plugin biasa; alias khusus Codex berada di Plugin
atau konfigurasi operator, bukan di selector runtime bersama.

## Pairing provider plus harness

Sebagian besar harness juga sebaiknya mendaftarkan provider. Provider membuat model ref,
status auth, metadata model, dan pemilihan `/model` terlihat oleh bagian lain
OpenClaw. Harness kemudian mengklaim provider tersebut dalam `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- model ref pengguna yang disukai: `openai/gpt-5.5` plus
  `embeddedHarness.runtime: "codex"`
- ref kompatibilitas: ref lama `codex/gpt-*` tetap diterima, tetapi konfigurasi baru sebaiknya tidak menggunakannya sebagai ref provider/model normal
- id harness: `codex`
- auth: ketersediaan provider sintetis, karena harness Codex memiliki login/sesi Codex native
- permintaan app-server: OpenClaw mengirim bare model id ke Codex dan membiarkan
  harness berbicara dengan protokol app-server native

Plugin Codex bersifat aditif. Ref `openai/gpt-*` biasa tetap menggunakan jalur provider
OpenClaw normal kecuali Anda memaksa harness Codex dengan
`embeddedHarness.runtime: "codex"`. Ref `codex/gpt-*` lama tetap memilih
provider dan harness Codex untuk kompatibilitas.

Untuk penyiapan operator, contoh prefix model, dan konfigurasi khusus Codex, lihat
[Harness Codex](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.118.0` atau yang lebih baru. Plugin Codex memeriksa
handshake inisialisasi app-server dan memblokir server yang lebih lama atau tanpa versi sehingga
OpenClaw hanya berjalan terhadap permukaan protokol yang telah diuji.

### Middleware hasil tool

Plugin bawaan dapat menempelkan middleware hasil tool yang netral terhadap runtime melalui
`api.registerAgentToolResultMiddleware(...)` saat manifest mereka mendeklarasikan
id runtime yang ditargetkan dalam `contracts.agentToolResultMiddleware`. Seam tepercaya ini ditujukan
untuk transformasi hasil tool async yang harus dijalankan sebelum PI atau Codex memasukkan
kembali output tool ke model.

Plugin bawaan lama masih dapat menggunakan
`api.registerCodexAppServerExtensionFactory(...)` untuk middleware khusus
app-server Codex, tetapi transformasi hasil baru sebaiknya menggunakan API yang netral terhadap runtime.
Hook `api.registerEmbeddedExtensionFactory(...)` yang khusus Pi telah dihapus;
transformasi hasil tool Pi harus menggunakan middleware netral terhadap runtime.

### Mode harness Codex native

Harness `codex` bawaan adalah mode Codex native untuk giliran agent OpenClaw
tersemat. Aktifkan dulu Plugin `codex` bawaan, dan sertakan `codex` di
`plugins.allow` jika konfigurasi Anda menggunakan allowlist yang ketat. Konfigurasi app-server native
sebaiknya menggunakan `openai/gpt-*` dengan `embeddedHarness.runtime: "codex"`.
Gunakan `openai-codex/*` untuk OAuth Codex melalui PI. Ref model `codex/*` lama tetap menjadi alias kompatibilitas untuk harness native.

Saat mode ini berjalan, Codex memiliki thread id native, perilaku resume,
Compaction, dan eksekusi app-server. OpenClaw tetap memiliki saluran chat,
mirror transkrip yang terlihat, kebijakan tool, approvals, pengiriman media, dan
pemilihan sesi. Gunakan `embeddedHarness.runtime: "codex"` tanpa override `fallback`
saat Anda perlu membuktikan bahwa hanya jalur app-server Codex yang dapat mengklaim run tersebut.
Runtime Plugin eksplisit sudah gagal tertutup secara default. Setel `fallback: "pi"`
hanya saat Anda memang ingin PI menangani pemilihan harness yang hilang. Kegagalan
app-server Codex sudah gagal langsung alih-alih mencoba ulang melalui PI.

## Menonaktifkan fallback PI

Secara default, OpenClaw menjalankan agent tersemat dengan `agents.defaults.embeddedHarness`
disetel ke `{ runtime: "auto", fallback: "pi" }`. Dalam mode `auto`, harness Plugin terdaftar
dapat mengklaim pasangan provider/model. Jika tidak ada yang cocok, OpenClaw fallback ke PI.

Dalam mode `auto`, setel `fallback: "none"` saat Anda perlu kegagalan pemilihan harness Plugin yang hilang
gagal alih-alih menggunakan PI. Runtime Plugin eksplisit seperti
`runtime: "codex"` sudah gagal tertutup secara default, kecuali `fallback: "pi"` disetel
dalam konfigurasi yang sama atau scope override environment. Kegagalan harness Plugin yang dipilih
selalu gagal keras. Ini tidak memblokir `runtime: "pi"` eksplisit atau
`OPENCLAW_AGENT_RUNTIME=pi`.

Untuk run tersemat khusus Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

Jika Anda ingin harness Plugin terdaftar mana pun mengklaim model yang cocok tetapi tidak pernah
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
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` tetap meng-override runtime yang dikonfigurasi. Gunakan
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
untuk live test yang harus membuktikan bahwa jalur app-server Codex benar-benar digunakan.

Setelan ini hanya mengontrol harness agent tersemat. Ini tidak menonaktifkan
perutean model khusus provider untuk image, video, music, TTS, PDF, atau lainnya.

## Sesi native dan mirror transkrip

Harness dapat menyimpan id sesi native, thread id, atau token resume sisi daemon.
Pertahankan binding tersebut secara eksplisit terkait dengan sesi OpenClaw, dan terus
mirror output assistant/tool yang terlihat pengguna ke transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi layer kompatibilitas untuk:

- riwayat sesi yang terlihat di saluran
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness PI bawaan pada giliran berikutnya
- perilaku `/new`, `/reset`, dan penghapusan sesi generik

Jika harness Anda menyimpan binding sidecar, implementasikan `reset(...)` agar OpenClaw dapat
menghapusnya saat sesi OpenClaw pemilik direset.

## Hasil tool dan media

Core membangun daftar tool OpenClaw dan meneruskannya ke upaya yang telah disiapkan.
Saat harness mengeksekusi panggilan tool dinamis, kembalikan hasil tool tersebut melalui
bentuk hasil harness alih-alih mengirim media saluran sendiri.

Ini menjaga output text, image, video, music, TTS, approval, dan messaging-tool
tetap pada jalur pengiriman yang sama seperti run yang didukung PI.

## Batasan saat ini

- Path import publik bersifat generik, tetapi beberapa alias tipe upaya/hasil masih
  membawa nama `Pi` untuk kompatibilitas.
- Instalasi harness pihak ketiga bersifat eksperimental. Utamakan Plugin provider
  sampai Anda membutuhkan runtime sesi native.
- Perpindahan harness didukung antar giliran. Jangan mengganti harness di tengah
  giliran setelah tool native, approvals, teks assistant, atau pengiriman pesan
  telah dimulai.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Helper Runtime](/id/plugins/sdk-runtime)
- [Plugin Provider](/id/plugins/sdk-provider-plugins)
- [Harness Codex](/id/plugins/codex-harness)
- [Provider Model](/id/concepts/model-providers)
