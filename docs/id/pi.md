---
read_when:
    - Memahami desain integrasi Pi SDK di OpenClaw
    - Memodifikasi siklus hidup sesi agen, tooling, atau pengkabelan provider untuk Pi
summary: Arsitektur integrasi agen Pi tertanam OpenClaw dan siklus hidup sesi
title: Arsitektur integrasi Pi
x-i18n:
    generated_at: "2026-04-25T13:49:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

Dokumen ini menjelaskan bagaimana OpenClaw berintegrasi dengan [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) dan paket saudaranya (`pi-ai`, `pi-agent-core`, `pi-tui`) untuk mendukung capability agen AI-nya.

## Ikhtisar

OpenClaw menggunakan SDK pi untuk menanamkan agen coding AI ke dalam arsitektur gateway pesannya. Alih-alih menjalankan pi sebagai subprocess atau menggunakan mode RPC, OpenClaw langsung mengimpor dan menginisialisasi `AgentSession` milik pi melalui `createAgentSession()`. Pendekatan tertanam ini memberikan:

- Kontrol penuh atas siklus hidup sesi dan penanganan event
- Injeksi tool kustom (pesan, sandbox, aksi spesifik saluran)
- Kustomisasi system prompt per saluran/konteks
- Persistensi sesi dengan dukungan branching/Compaction
- Rotasi profil auth multi-akun dengan failover
- Peralihan model yang agnostik terhadap provider

## Dependensi paket

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Paket             | Tujuan                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstraksi LLM inti: `Model`, `streamSimple`, tipe pesan, API provider                                  |
| `pi-agent-core`   | Loop agen, eksekusi tool, tipe `AgentMessage`                                                          |
| `pi-coding-agent` | SDK tingkat tinggi: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, tool bawaan |
| `pi-tui`          | Komponen UI terminal (digunakan dalam mode TUI lokal OpenClaw)                                         |

## Struktur file

```
src/agents/
├── pi-embedded-runner.ts          # Re-export dari pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entri utama: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika percobaan tunggal dengan pengaturan sesi
│   │   ├── params.ts              # Tipe RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Membangun payload respons dari hasil run
│   │   ├── images.ts              # Injeksi gambar model vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Deteksi error abort
│   ├── cache-ttl.ts               # Pelacakan cache TTL untuk pruning konteks
│   ├── compact.ts                 # Logika Compaction manual/otomatis
│   ├── extensions.ts              # Memuat ekstensi pi untuk run tertanam
│   ├── extra-params.ts            # Param stream spesifik provider
│   ├── google.ts                  # Perbaikan urutan giliran Google/Gemini
│   ├── history.ts                 # Pembatasan riwayat (DM vs grup)
│   ├── lanes.ts                   # Lane perintah sesi/global
│   ├── logger.ts                  # Logger subsistem
│   ├── model.ts                   # Resolusi model melalui ModelRegistry
│   ├── runs.ts                    # Pelacakan run aktif, abort, antrean
│   ├── sandbox-info.ts            # Info sandbox untuk system prompt
│   ├── session-manager-cache.ts   # Cache instance SessionManager
│   ├── session-manager-init.ts    # Inisialisasi file sesi
│   ├── system-prompt.ts           # Builder system prompt
│   ├── tool-split.ts              # Membagi tool menjadi builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Pemetaan ThinkLevel, deskripsi error
├── pi-embedded-subscribe.ts       # Langganan/pengiriman event sesi
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory handler event
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking balasan blok streaming
├── pi-embedded-messaging.ts       # Pelacakan pengiriman tool pesan
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
│   ├── compaction-safeguard.ts    # Ekstensi safeguard
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Ekstensi pruning konteks cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Resolusi profil auth
├── auth-profiles.ts               # Penyimpanan profil, cooldown, failover
├── model-selection.ts             # Resolusi model default
├── models-config.ts               # Generasi models.json
├── model-catalog.ts               # Cache katalog model
├── context-window-guard.ts        # Validasi jendela konteks
├── failover-error.ts              # Kelas FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolusi parameter system prompt
├── system-prompt-report.ts        # Pembuatan laporan debug
├── tool-summaries.ts              # Ringkasan deskripsi tool
├── tool-policy.ts                 # Resolusi kebijakan tool
├── transcript-policy.ts           # Kebijakan validasi transkrip
├── skills.ts                      # Snapshot/pembuatan prompt skill
├── skills/                        # Subsistem skill
├── sandbox.ts                     # Resolusi konteks sandbox
├── sandbox/                       # Subsistem sandbox
├── channel-tools.ts               # Injeksi tool spesifik saluran
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

Runtime aksi pesan spesifik saluran sekarang berada di direktori ekstensi yang dimiliki Plugin, bukan lagi di bawah `src/agents/tools`, misalnya:

- file runtime aksi Plugin Discord
- file runtime aksi Plugin Slack
- file runtime aksi Plugin Telegram
- file runtime aksi Plugin WhatsApp

## Alur integrasi inti

### 1. Menjalankan agen tertanam

Titik masuk utamanya adalah `runEmbeddedPiAgent()` di `pi-embedded-runner/run.ts`:

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

### 2. Pembuatan sesi

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

### 3. Langganan event

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

- `message_start` / `message_end` / `message_update` (streaming teks/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Setelah pengaturan selesai, sesi diberi prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK menangani loop agen penuh: mengirim ke LLM, mengeksekusi panggilan tool, men-stream respons.

Injeksi gambar bersifat lokal pada prompt: OpenClaw memuat referensi gambar dari prompt saat ini dan
meneruskannya melalui `images` hanya untuk giliran itu. OpenClaw tidak memindai ulang giliran riwayat lama
untuk menyuntikkan kembali payload gambar.

## Arsitektur tool

### Pipeline tool

1. **Tool dasar**: `codingTools` milik pi (read, bash, edit, write)
2. **Pengganti kustom**: OpenClaw mengganti bash dengan `exec`/`process`, menyesuaikan read/edit/write untuk sandbox
3. **Tool OpenClaw**: messaging, browser, canvas, sessions, cron, gateway, dll.
4. **Tool saluran**: tool aksi spesifik Discord/Telegram/Slack/WhatsApp
5. **Penyaringan kebijakan**: tool difilter berdasarkan profil, provider, agen, grup, dan kebijakan sandbox
6. **Normalisasi skema**: skema dibersihkan untuk keanehan Gemini/OpenAI
7. **Pembungkusan AbortSignal**: tool dibungkus agar menghormati abort signal

### Adapter definisi tool

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

### Strategi pemisahan tool

`splitSdkTools()` meneruskan semua tool melalui `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Kosong. Kami menimpa semuanya
    customTools: toToolDefinitions(options.tools),
  };
}
```

Ini memastikan penyaringan kebijakan OpenClaw, integrasi sandbox, dan kumpulan tool yang diperluas tetap konsisten di seluruh provider.

## Konstruksi system prompt

System prompt dibangun di `buildAgentSystemPrompt()` (`system-prompt.ts`). Ini menyusun prompt penuh dengan bagian-bagian seperti Tooling, Tool Call Style, pembatas Safety, referensi CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeat, metadata Runtime, serta Memory dan Reactions saat diaktifkan, ditambah file konteks opsional dan konten system prompt tambahan. Bagian-bagian dipangkas untuk mode prompt minimal yang digunakan oleh subagen.

Prompt diterapkan setelah pembuatan sesi melalui `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Manajemen sesi

### File sesi

Sesi adalah file JSONL dengan struktur pohon (tautan id/parentId). `SessionManager` milik Pi menangani persistensi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw membungkus ini dengan `guardSessionManager()` untuk keamanan hasil tool.

### Cache sesi

`session-manager-cache.ts` menyimpan instance SessionManager dalam cache untuk menghindari parsing file berulang:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Pembatasan riwayat

`limitHistoryTurns()` memangkas riwayat percakapan berdasarkan jenis saluran (DM vs grup).

### Compaction

Auto-Compaction dipicu saat konteks meluap. Tanda luapan umum
mencakup `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, dan `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` menangani
Compaction manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autentikasi & resolusi model

### Profil auth

OpenClaw memelihara penyimpanan profil auth dengan beberapa API key per provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profil berotasi saat gagal dengan pelacakan cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolusi model

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

## Ekstensi Pi

OpenClaw memuat ekstensi Pi kustom untuk perilaku khusus:

### Safeguard Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` menambahkan pagar pembatas ke Compaction, termasuk penganggaran token adaptif plus ringkasan kegagalan tool dan operasi file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

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

## Streaming & block reply

### Block chunking

`EmbeddedBlockChunker` mengelola streaming teks menjadi blok balasan diskret:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Penghapusan tag thinking/final

Output streaming diproses untuk menghapus blok `<think>`/`<thinking>` dan mengekstrak konten `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Hapus konten <think>...</think>
  // Jika enforceFinalTag, hanya kembalikan konten <final>...</final>
};
```

### Directive balasan

Directive balasan seperti `[[media:url]]`, `[[voice]]`, `[[reply:id]]` di-parse dan diekstrak:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Penanganan error

### Klasifikasi error

`pi-embedded-helpers.ts` mengklasifikasikan error untuk penanganan yang sesuai:

```typescript
isContextOverflowError(errorText)     // Konteks terlalu besar
isCompactionFailureError(errorText)   // Compaction gagal
isAuthAssistantError(lastAssistant)   // Kegagalan auth
isRateLimitAssistantError(...)        // Terkena rate limit
isFailoverAssistantError(...)         // Harus failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback tingkat thinking

Jika tingkat thinking tidak didukung, akan fallback:

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

## Integrasi sandbox

Saat mode sandbox diaktifkan, tool dan path dibatasi:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Gunakan tool read/edit/write yang disandbox
  // Exec berjalan di container
  // Browser menggunakan URL bridge
}
```

## Penanganan spesifik provider

### Anthropic

- Pembersihan magic string refusal
- Validasi giliran untuk role yang berurutan
- Validasi parameter tool upstream Pi yang ketat

### Google/Gemini

- Sanitasi skema tool yang dimiliki Plugin

### OpenAI

- tool `apply_patch` untuk model Codex
- Penanganan downgrade tingkat thinking

## Integrasi TUI

OpenClaw juga memiliki mode TUI lokal yang menggunakan komponen pi-tui secara langsung:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Ini menyediakan pengalaman terminal interaktif yang mirip dengan mode native Pi.

## Perbedaan utama dari Pi CLI

| Aspek            | Pi CLI                  | OpenClaw Embedded                                                                              |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation       | perintah `pi` / RPC     | SDK melalui `createAgentSession()`                                                             |
| Tool             | Tool coding default     | Rangkaian tool OpenClaw kustom                                                                 |
| System prompt    | AGENTS.md + prompt      | Dinamis per saluran/konteks                                                                    |
| Penyimpanan sesi | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (atau `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth             | Kredensial tunggal      | Multi-profil dengan rotasi                                                                     |
| Ekstensi         | Dimuat dari disk        | Jalur terprogram + disk                                                                        |
| Penanganan event | Rendering TUI           | Berbasis callback (`onBlockReply`, dll.)                                                       |

## Pertimbangan ke depan

Area untuk potensi perombakan:

1. **Penyelarasan signature tool**: Saat ini beradaptasi antara signature pi-agent-core dan pi-coding-agent
2. **Pembungkusan session manager**: `guardSessionManager` menambah keamanan tetapi meningkatkan kompleksitas
3. **Pemuatan ekstensi**: Dapat menggunakan `ResourceLoader` Pi secara lebih langsung
4. **Kompleksitas handler streaming**: `subscribeEmbeddedPiSession` sudah menjadi besar
5. **Keanehan provider**: Banyak codepath spesifik provider yang berpotensi ditangani oleh Pi

## Pengujian

Cakupan integrasi Pi mencakup suite ini:

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

## Terkait

- [Alur kerja pengembangan Pi](/id/pi-dev)
- [Ikhtisar instalasi](/id/install)
