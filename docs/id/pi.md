---
read_when:
    - Memahami desain integrasi SDK Pi di OpenClaw
    - Memodifikasi siklus hidup sesi agen, tooling, atau wiring provider untuk Pi
summary: Arsitektur integrasi agen Pi tertanam OpenClaw dan siklus hidup sesi
title: Arsitektur Integrasi Pi
x-i18n:
    generated_at: "2026-04-21T09:19:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ece62eb1459e8a861610c8502f2b3bf5172500207df5e78f4abe7a2a416a47fc
    source_path: pi.md
    workflow: 15
---

# Arsitektur Integrasi Pi

Dokumen ini menjelaskan bagaimana OpenClaw berintegrasi dengan [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) dan package saudaranya (`pi-ai`, `pi-agent-core`, `pi-tui`) untuk mendukung kemampuan agen AI-nya.

## Ringkasan

OpenClaw menggunakan SDK pi untuk menanamkan agen coding AI ke dalam arsitektur gateway messaging-nya. Alih-alih menjalankan pi sebagai subprocess atau menggunakan mode RPC, OpenClaw langsung mengimpor dan membuat instance `AgentSession` milik pi melalui `createAgentSession()`. Pendekatan tertanam ini memberikan:

- Kontrol penuh atas siklus hidup sesi dan penanganan event
- Injeksi tool kustom (messaging, sandbox, tindakan khusus channel)
- Kustomisasi system prompt per channel/konteks
- Persistensi sesi dengan dukungan branching/Compaction
- Rotasi auth profile multi-akun dengan failover
- Peralihan model yang agnostik provider

## Dependensi Package

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Package           | Tujuan                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstraksi LLM inti: `Model`, `streamSimple`, tipe message, API provider                                |
| `pi-agent-core`   | Loop agen, eksekusi tool, tipe `AgentMessage`                                                          |
| `pi-coding-agent` | SDK tingkat tinggi: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, tool bawaan |
| `pi-tui`          | Komponen UI terminal (digunakan dalam mode TUI lokal OpenClaw)                                         |

## Struktur File

```
src/agents/
├── pi-embedded-runner.ts          # Mengekspor ulang dari pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entri utama: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika satu percobaan dengan penyiapan sesi
│   │   ├── params.ts              # Tipe RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Membangun payload respons dari hasil run
│   │   ├── images.ts              # Injeksi gambar model vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Deteksi error abort
│   ├── cache-ttl.ts               # Pelacakan TTL cache untuk pruning konteks
│   ├── compact.ts                 # Logika Compaction manual/otomatis
│   ├── extensions.ts              # Memuat extension pi untuk embedded run
│   ├── extra-params.ts            # Parameter stream khusus provider
│   ├── google.ts                  # Perbaikan urutan giliran Google/Gemini
│   ├── history.ts                 # Pembatasan riwayat (DM vs grup)
│   ├── lanes.ts                   # Lane perintah sesi/global
│   ├── logger.ts                  # Logger subsistem
│   ├── model.ts                   # Resolusi model melalui ModelRegistry
│   ├── runs.ts                    # Pelacakan run aktif, abort, antrean
│   ├── sandbox-info.ts            # Info sandbox untuk system prompt
│   ├── session-manager-cache.ts   # Caching instance SessionManager
│   ├── session-manager-init.ts    # Inisialisasi file sesi
│   ├── system-prompt.ts           # Builder system prompt
│   ├── tool-split.ts              # Memisah tool menjadi builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Pemetaan ThinkLevel, deskripsi error
├── pi-embedded-subscribe.ts       # Subscription/pengiriman event sesi
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory handler event
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking balasan blok streaming
├── pi-embedded-messaging.ts       # Pelacakan pengiriman tool messaging
├── pi-embedded-helpers.ts         # Klasifikasi error, validasi giliran
├── pi-embedded-helpers/           # Modul helper
├── pi-embedded-utils.ts           # Utilitas pemformatan
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Pembungkus AbortSignal untuk tool
├── pi-tools.policy.ts             # Kebijakan allowlist/denylist tool
├── pi-tools.read.ts               # Kustomisasi tool baca
├── pi-tools.schema.ts             # Normalisasi skema tool
├── pi-tools.types.ts              # Alias tipe AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Override pengaturan
├── pi-hooks/                      # Hook pi kustom
│   ├── compaction-safeguard.ts    # Extension safeguard
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extension pruning konteks Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Resolusi auth profile
├── auth-profiles.ts               # Store profile, cooldown, failover
├── model-selection.ts             # Resolusi model default
├── models-config.ts               # Pembuatan models.json
├── model-catalog.ts               # Cache katalog model
├── context-window-guard.ts        # Validasi jendela konteks
├── failover-error.ts              # Kelas FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolusi parameter system prompt
├── system-prompt-report.ts        # Pembuatan laporan debug
├── tool-summaries.ts              # Ringkasan deskripsi tool
├── tool-policy.ts                 # Resolusi kebijakan tool
├── transcript-policy.ts           # Kebijakan validasi transcript
├── skills.ts                      # Snapshot/pembuatan prompt Skills
├── skills/                        # Subsistem skill
├── sandbox.ts                     # Resolusi konteks sandbox
├── sandbox/                       # Subsistem sandbox
├── channel-tools.ts               # Injeksi tool khusus channel
├── openclaw-tools.ts              # Tool khusus OpenClaw
├── bash-tools.ts                  # Tool exec/process
├── apply-patch.ts                 # tool apply_patch (OpenAI)
├── tools/                         # Implementasi tool individual
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Runtime tindakan pesan khusus channel kini berada di direktori extension
milik plugin, bukan lagi di bawah `src/agents/tools`, misalnya:

- file runtime tindakan plugin Discord
- file runtime tindakan plugin Slack
- file runtime tindakan plugin Telegram
- file runtime tindakan plugin WhatsApp

## Alur Integrasi Inti

### 1. Menjalankan Agen Tertanam

Titik masuk utama adalah `runEmbeddedPiAgent()` di `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Pembuatan Sesi

Di dalam `runEmbeddedAttempt()` (dipanggil oleh `runEmbeddedPiAgent()`), SDK pi digunakan:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Subscription Event

`subscribeEmbeddedPiSession()` berlangganan ke event `AgentSession` milik pi:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Event yang ditangani mencakup:

- `message_start` / `message_end` / `message_update` (teks/thinking streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Setelah penyiapan, sesi diberi prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK menangani loop agen penuh: mengirim ke LLM, mengeksekusi pemanggilan tool, dan melakukan streaming respons.

Injeksi gambar bersifat lokal terhadap prompt: OpenClaw memuat referensi gambar dari prompt saat ini dan
meneruskannya melalui `images` hanya untuk giliran tersebut. OpenClaw tidak memindai ulang giliran riwayat lama
untuk menginjeksi ulang payload gambar.

## Arsitektur Tool

### Pipeline Tool

1. **Tool Dasar**: `codingTools` milik pi (read, bash, edit, write)
2. **Pengganti Kustom**: OpenClaw mengganti bash dengan `exec`/`process`, menyesuaikan read/edit/write untuk sandbox
3. **Tool OpenClaw**: messaging, browser, canvas, sessions, Cron, Gateway, dll.
4. **Tool Channel**: tool tindakan khusus Discord/Telegram/Slack/WhatsApp
5. **Pemfilteran Kebijakan**: Tool difilter menurut kebijakan profil, provider, agen, grup, sandbox
6. **Normalisasi Skema**: Skema dibersihkan untuk keanehan Gemini/OpenAI
7. **Pembungkusan AbortSignal**: Tool dibungkus agar mematuhi sinyal abort

### Adapter Definisi Tool

`AgentTool` milik pi-agent-core memiliki signature `execute` yang berbeda dari `ToolDefinition` milik pi-coding-agent. Adapter di `pi-tool-definition-adapter.ts` menjembatani hal ini:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // signature pi-coding-agent berbeda dari pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategi Pemisahan Tool

`splitSdkTools()` meneruskan semua tool melalui `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Kosong. Kami menimpa semuanya
    customTools: toToolDefinitions(options.tools),
  };
}
```

Ini memastikan pemfilteran kebijakan, integrasi sandbox, dan kumpulan tool yang diperluas milik OpenClaw tetap konsisten di seluruh provider.

## Konstruksi System Prompt

System prompt dibangun di `buildAgentSystemPrompt()` (`system-prompt.ts`). Fungsi ini menyusun prompt lengkap dengan bagian-bagian termasuk Tooling, Gaya Pemanggilan Tool, guardrail Keamanan, referensi CLI OpenClaw, Skills, Dokumen, Workspace, Sandbox, Messaging, Tag Balasan, Voice, Balasan Senyap, Heartbeat, metadata Runtime, ditambah Memory dan Reactions saat diaktifkan, serta file konteks opsional dan konten system prompt tambahan. Bagian-bagian ini dipangkas untuk mode prompt minimal yang digunakan oleh subagent.

Prompt diterapkan setelah pembuatan sesi melalui `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Manajemen Sesi

### File Sesi

Sesi adalah file JSONL dengan struktur pohon (tautan id/parentId). `SessionManager` milik Pi menangani persistensi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw membungkus ini dengan `guardSessionManager()` untuk keamanan hasil tool.

### Caching Sesi

`session-manager-cache.ts` menyimpan cache instance SessionManager untuk menghindari parsing file berulang:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Pembatasan Riwayat

`limitHistoryTurns()` memangkas riwayat percakapan berdasarkan tipe channel (DM vs grup).

### Compaction

Compaction otomatis dipicu saat konteks meluap. Tanda tangan overflow yang umum
mencakup `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model`, dan `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` menangani Compaction
manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autentikasi & Resolusi Model

### Auth Profile

OpenClaw memelihara store auth profile dengan beberapa kunci API per provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile dirotasi saat terjadi kegagalan dengan pelacakan cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolusi Model

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Menggunakan ModelRegistry dan AuthStorage milik Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` memicu fallback model saat dikonfigurasi:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Extension Pi

OpenClaw memuat extension Pi kustom untuk perilaku khusus:

### Safeguard Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` menambahkan guardrail pada Compaction, termasuk penganggaran token adaptif ditambah ringkasan kegagalan tool dan operasi file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Pruning Konteks

`src/agents/pi-hooks/context-pruning.ts` mengimplementasikan pruning konteks berbasis cache-TTL:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Streaming & Balasan Blok

### Chunking Blok

`EmbeddedBlockChunker` mengelola streaming teks menjadi blok balasan terpisah:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Penghapusan Tag Thinking/Final

Output streaming diproses untuk menghapus blok `<think>`/`<thinking>` dan mengekstrak konten `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Hapus konten <think>...</think>
  // Jika enforceFinalTag, hanya kembalikan konten <final>...</final>
};
```

### Arahan Balasan

Arahan balasan seperti `[[media:url]]`, `[[voice]]`, `[[reply:id]]` diurai dan diekstrak:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Penanganan Error

### Klasifikasi Error

`pi-embedded-helpers.ts` mengklasifikasikan error untuk penanganan yang sesuai:

```typescript
isContextOverflowError(errorText)     // Konteks terlalu besar
isCompactionFailureError(errorText)   // Compaction gagal
isAuthAssistantError(lastAssistant)   // Kegagalan autentikasi
isRateLimitAssistantError(...)        // Terkena rate limit
isFailoverAssistantError(...)         // Harus failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback Tingkat Thinking

Jika tingkat thinking tidak didukung, sistem akan fallback:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Integrasi Sandbox

Saat mode sandbox diaktifkan, tool dan path dibatasi:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Gunakan tool read/edit/write dalam sandbox
  // Exec berjalan di container
  // Browser menggunakan URL bridge
}
```

## Penanganan Khusus Provider

### Anthropic

- Penghapusan magic string refusal
- Validasi giliran untuk role berurutan
- Validasi parameter tool Pi upstream yang ketat

### Google/Gemini

- Sanitasi skema tool milik plugin

### OpenAI

- Tool `apply_patch` untuk model Codex
- Penanganan penurunan tingkat thinking

## Integrasi TUI

OpenClaw juga memiliki mode TUI lokal yang langsung menggunakan komponen pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Ini menyediakan pengalaman terminal interaktif yang mirip dengan mode native Pi.

## Perbedaan Utama dari Pi CLI

| Aspek           | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation      | perintah `pi` / RPC     | SDK melalui `createAgentSession()`                                                             |
| Tools           | Tool coding default     | Kumpulan tool OpenClaw kustom                                                                  |
| system prompt   | AGENTS.md + prompt      | Dinamis per channel/konteks                                                                    |
| Penyimpanan sesi | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (atau `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Satu kredensial         | Multi-profile dengan rotasi                                                                    |
| Extension       | Dimuat dari disk        | Secara terprogram + path disk                                                                  |
| Penanganan event | Rendering TUI           | Berbasis callback (`onBlockReply`, dll.)                                                       |

## Pertimbangan Mendatang

Area yang mungkin perlu dikerjakan ulang:

1. **Penyelarasan signature tool**: Saat ini mengadaptasi antara signature pi-agent-core dan pi-coding-agent
2. **Pembungkusan session manager**: `guardSessionManager` menambah keamanan tetapi meningkatkan kompleksitas
3. **Pemuatan extension**: Dapat menggunakan `ResourceLoader` milik Pi secara lebih langsung
4. **Kompleksitas handler streaming**: `subscribeEmbeddedPiSession` telah tumbuh besar
5. **Keanehan provider**: Banyak codepath khusus provider yang berpotensi dapat ditangani oleh Pi

## Pengujian

Cakupan integrasi Pi mencakup suite berikut:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (aktifkan `OPENCLAW_LIVE_TEST=1`)

Untuk perintah run saat ini, lihat [Alur Kerja Pengembangan Pi](/id/pi-dev).
