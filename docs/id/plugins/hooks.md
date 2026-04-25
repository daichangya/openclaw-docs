---
read_when:
    - Anda sedang membangun Plugin yang memerlukan `before_tool_call`, `before_agent_reply`, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk pemanggilan tool dari sebuah Plugin
    - Anda sedang memilih antara hook internal dan Plugin hooks
summary: 'Plugin hooks: mencegat peristiwa agen, tool, pesan, sesi, dan siklus hidup Gateway'
title: Plugin hooks
x-i18n:
    generated_at: "2026-04-25T13:51:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin hooks adalah titik ekstensi dalam proses untuk Plugin OpenClaw. Gunakan
ini saat sebuah Plugin perlu memeriksa atau mengubah eksekusi agen, pemanggilan tool, alur pesan,
siklus hidup sesi, routing subagen, instalasi, atau startup Gateway.

Gunakan [internal hooks](/id/automation/hooks) sebagai gantinya saat Anda menginginkan
skrip `HOOK.md` kecil yang diinstal operator untuk perintah dan peristiwa Gateway seperti
`/new`, `/reset`, `/stop`, `agent:bootstrap`, atau `gateway:startup`.

## Mulai cepat

Daftarkan Plugin hooks bertipe dengan `api.on(...)` dari entry Plugin Anda:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Handler hook berjalan secara berurutan dalam `priority` menurun. Hook dengan prioritas yang sama
mempertahankan urutan pendaftaran.

## Katalog hook

Hook dikelompokkan berdasarkan surface yang diperluas. Nama yang **dicetak tebal** menerima
hasil keputusan (block, cancel, override, atau require approval); semua yang lain hanya untuk observasi.

**Giliran agen**

- `before_model_resolve` — override provider atau model sebelum pesan sesi dimuat
- `before_prompt_build` — tambahkan konteks dinamis atau teks prompt sistem sebelum pemanggilan model
- `before_agent_start` — fase gabungan untuk kompatibilitas saja; sebaiknya gunakan dua hook di atas
- **`before_agent_reply`** — short-circuit giliran model dengan balasan sintetis atau keheningan
- `agent_end` — amati pesan akhir, status keberhasilan, dan durasi eksekusi

**Observasi percakapan**

- `llm_input` — amati input provider (prompt sistem, prompt, riwayat)
- `llm_output` — amati output provider

**Tools**

- **`before_tool_call`** — tulis ulang parameter tool, blokir eksekusi, atau minta persetujuan
- `after_tool_call` — amati hasil tool, error, dan durasi
- **`tool_result_persist`** — tulis ulang pesan asisten yang dihasilkan dari hasil tool
- **`before_message_write`** — periksa atau blokir penulisan pesan yang sedang berlangsung (jarang)

**Pesan dan pengiriman**

- **`inbound_claim`** — klaim pesan masuk sebelum routing agen (balasan sintetis)
- `message_received` — amati konten masuk, pengirim, thread, dan metadata
- **`message_sending`** — tulis ulang konten keluar atau batalkan pengiriman
- `message_sent` — amati keberhasilan atau kegagalan pengiriman keluar
- **`before_dispatch`** — periksa atau tulis ulang dispatch keluar sebelum handoff kanal
- **`reply_dispatch`** — berpartisipasi dalam pipeline dispatch balasan akhir

**Sesi dan Compaction**

- `session_start` / `session_end` — lacak batas siklus hidup sesi
- `before_compaction` / `after_compaction` — amati atau beri anotasi pada siklus Compaction
- `before_reset` — amati peristiwa reset sesi (`/reset`, reset terprogram)

**Subagen**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordinasikan routing subagen dan pengiriman hasil penyelesaian

**Siklus hidup**

- `gateway_start` / `gateway_stop` — mulai atau hentikan layanan milik Plugin bersama Gateway
- **`before_install`** — periksa hasil pemindaian instalasi Skill atau Plugin dan opsional memblokir

## Kebijakan pemanggilan tool

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- opsional `event.runId`
- opsional `event.toolCallId`
- field konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, dan
  `ctx.trace` diagnostik

Hook ini dapat mengembalikan:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Aturan:

- `block: true` bersifat terminal dan melewati handler dengan prioritas lebih rendah.
- `block: false` diperlakukan sebagai tidak ada keputusan.
- `params` menulis ulang parameter tool untuk eksekusi.
- `requireApproval` menjeda eksekusi agen dan meminta persetujuan pengguna melalui
  persetujuan Plugin. Perintah `/approve` dapat menyetujui persetujuan exec maupun Plugin.
- `block: true` dari prioritas yang lebih rendah tetap dapat memblokir setelah hook dengan prioritas lebih tinggi
  meminta persetujuan.
- `onResolution` menerima keputusan persetujuan yang telah diselesaikan — `allow-once`,
  `allow-always`, `deny`, `timeout`, atau `cancelled`.

## Hook prompt dan model

Gunakan hook khusus fase untuk Plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan metadata
  lampiran. Kembalikan `providerOverride` atau `modelOverride`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `systemPrompt`, `prependSystemContext`, atau
  `appendSystemContext`.

`before_agent_start` tetap ada untuk kompatibilitas. Sebaiknya gunakan hook eksplisit di atas
agar Plugin Anda tidak bergantung pada fase gabungan lama.

`before_agent_start` dan `agent_end` menyertakan `event.runId` saat OpenClaw dapat
mengidentifikasi eksekusi aktif. Nilai yang sama juga tersedia di `ctx.runId`.

Plugin non-bawaan yang memerlukan `llm_input`, `llm_output`, atau `agent_end` harus menyetel:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Hook yang memodifikasi prompt dapat dinonaktifkan per Plugin dengan
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hook pesan

Gunakan hook pesan untuk routing tingkat kanal dan kebijakan pengiriman:

- `message_received`: amati konten masuk, pengirim, `threadId`, `messageId`,
  `senderId`, korelasi eksekusi/sesi opsional, dan metadata.
- `message_sending`: tulis ulang `content` atau kembalikan `{ cancel: true }`.
- `message_sent`: amati keberhasilan atau kegagalan akhir.

Untuk balasan TTS hanya-audio, `content` dapat berisi transkrip lisan tersembunyi
meskipun payload kanal tidak memiliki teks/caption yang terlihat. Menulis ulang
`content` tersebut hanya memperbarui transkrip yang terlihat oleh hook; itu tidak dirender sebagai
caption media.

Konteks hook pesan mengekspos field korelasi stabil saat tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Utamakan
field kelas satu ini sebelum membaca metadata lama.

Utamakan field bertipe `threadId` dan `replyToId` sebelum menggunakan
metadata khusus kanal.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` diperlakukan sebagai tidak ada keputusan.
- `content` yang telah ditulis ulang diteruskan ke hook prioritas lebih rendah kecuali hook yang lebih akhir
  membatalkan pengiriman.

## Hook instalasi

`before_install` berjalan setelah pemindaian bawaan untuk instalasi Skill dan Plugin.
Kembalikan temuan tambahan atau `{ block: true, blockReason }` untuk menghentikan
instalasi.

`block: true` bersifat terminal. `block: false` diperlakukan sebagai tidak ada keputusan.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk layanan Plugin yang memerlukan state milik Gateway. Konteks
mengekspos `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk
pemeriksaan serta pembaruan Cron. Gunakan `gateway_stop` untuk membersihkan resource yang berjalan lama.

Jangan bergantung pada hook internal `gateway:startup` untuk layanan runtime milik Plugin.

## Deprekasi mendatang

Beberapa surface yang berdekatan dengan hook sudah deprecated tetapi masih didukung. Lakukan migrasi
sebelum rilis mayor berikutnya:

- **Envelope kanal plaintext** pada handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mem-parse teks envelope datar. Lihat
  [Plaintext channel envelopes → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** tetap ada untuk kompatibilitas. Plugin baru sebaiknya menggunakan
  `before_model_resolve` dan `before_prompt_build` alih-alih fase gabungan.
- **`onResolution` di `before_tool_call`** sekarang menggunakan union
  `PluginApprovalResolution` bertipe (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` bentuk bebas.

Untuk daftar lengkap — pendaftaran kemampuan memory, profil thinking provider,
provider auth eksternal, tipe penemuan provider, accessor runtime task, dan
penggantian nama `command-auth` → `command-status` — lihat
[Plugin SDK migration → Active deprecations](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Plugin SDK migration](/id/plugins/sdk-migration) — deprekasi aktif dan timeline penghapusan
- [Building plugins](/id/plugins/building-plugins)
- [Plugin SDK overview](/id/plugins/sdk-overview)
- [Plugin entry points](/id/plugins/sdk-entrypoints)
- [Internal hooks](/id/automation/hooks)
- [Plugin architecture internals](/id/plugins/architecture-internals)
