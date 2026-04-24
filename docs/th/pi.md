---
read_when:
    - การทำความเข้าใจการออกแบบการผสานรวม Pi SDK ใน OpenClaw
    - การแก้ไขวงจรชีวิตของเซสชันเอเจนต์ เครื่องมือ หรือการเชื่อมต่อ provider สำหรับ Pi
summary: สถาปัตยกรรมของการผสานรวม Pi agent แบบฝังตัวของ OpenClaw และวงจรชีวิตของเซสชัน
title: สถาปัตยกรรมการผสานรวม Pi
x-i18n:
    generated_at: "2026-04-24T09:20:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

เอกสารนี้อธิบายวิธีที่ OpenClaw ผสานรวมกับ [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) และแพ็กเกจพี่น้องของมัน (`pi-ai`, `pi-agent-core`, `pi-tui`) เพื่อขับเคลื่อนความสามารถด้าน AI agent

## ภาพรวม

OpenClaw ใช้ pi SDK เพื่อฝัง AI coding agent เข้าไปในสถาปัตยกรรม messaging gateway ของตน แทนที่จะ spawn pi เป็น subprocess หรือใช้โหมด RPC, OpenClaw จะ import และสร้าง `AgentSession` ของ pi โดยตรงผ่าน `createAgentSession()` แนวทางแบบฝังตัวนี้ให้สิ่งต่อไปนี้:

- ควบคุมวงจรชีวิตของเซสชันและการจัดการ events ได้เต็มรูปแบบ
- ฉีด tools แบบกำหนดเองได้ (messaging, sandbox, channel-specific actions)
- ปรับแต่ง system prompt แยกตามแชนแนล/บริบท
- ทำ session persistence พร้อมรองรับ branching/Compaction
- หมุนเวียน auth profile แบบหลายบัญชีพร้อม failover
- สลับโมเดลแบบไม่ผูกกับ provider

## การพึ่งพาแพ็กเกจ

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| แพ็กเกจ          | วัตถุประสงค์                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`          | Abstractions หลักของ LLM: `Model`, `streamSimple`, ชนิดข้อความ, provider APIs                         |
| `pi-agent-core`  | agent loop, การเรียกใช้ tool, ชนิด `AgentMessage`                                                     |
| `pi-coding-agent`| SDK ระดับสูง: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, built-in tools |
| `pi-tui`         | คอมโพเนนต์ Terminal UI (ใช้ในโหมด TUI ภายในเครื่องของ OpenClaw)                                       |

## โครงสร้างไฟล์

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports จาก pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # จุดเริ่มต้นหลัก: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # ตรรกะของความพยายามครั้งเดียวพร้อมการตั้งค่า session
│   │   ├── params.ts              # ชนิด RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # สร้าง response payloads จากผลลัพธ์ของการรัน
│   │   ├── images.ts              # การฉีดรูปภาพของ vision model
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # การตรวจจับ abort error
│   ├── cache-ttl.ts               # การติดตาม Cache TTL สำหรับ context pruning
│   ├── compact.ts                 # ตรรกะ Compaction แบบแมนนวล/อัตโนมัติ
│   ├── extensions.ts              # โหลด pi extensions สำหรับ embedded runs
│   ├── extra-params.ts            # stream params เฉพาะ provider
│   ├── google.ts                  # การแก้ลำดับเทิร์นของ Google/Gemini
│   ├── history.ts                 # การจำกัดประวัติ (DM เทียบกับกลุ่ม)
│   ├── lanes.ts                   # session/global command lanes
│   ├── logger.ts                  # ตัวบันทึกของ subsystem
│   ├── model.ts                   # การ resolve โมเดลผ่าน ModelRegistry
│   ├── runs.ts                    # การติดตาม active run, abort, queue
│   ├── sandbox-info.ts            # ข้อมูล sandbox สำหรับ system prompt
│   ├── session-manager-cache.ts   # การแคช SessionManager instance
│   ├── session-manager-init.ts    # การเริ่มต้นไฟล์ session
│   ├── system-prompt.ts           # ตัวสร้าง system prompt
│   ├── tool-split.ts              # แยก tools เป็น builtIn กับ custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # การแมประดับ ThinkLevel, คำอธิบายข้อผิดพลาด
├── pi-embedded-subscribe.ts       # การ subscribe/dispatch events ของ session
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # โรงงานสร้าง event handler
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # การแบ่งบล็อกคำตอบแบบสตรีม
├── pi-embedded-messaging.ts       # การติดตามการส่งของ messaging tool
├── pi-embedded-helpers.ts         # การจัดประเภทข้อผิดพลาด, การตรวจสอบเทิร์น
├── pi-embedded-helpers/           # โมดูลตัวช่วย
├── pi-embedded-utils.ts           # utilities สำหรับการจัดรูปแบบ
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # การห่อ AbortSignal ให้ tools
├── pi-tools.policy.ts             # นโยบาย allowlist/denylist ของ tools
├── pi-tools.read.ts               # การปรับแต่ง read tool
├── pi-tools.schema.ts             # การ normalize schema ของ tools
├── pi-tools.types.ts              # type alias AnyAgentTool
├── pi-tool-definition-adapter.ts  # ตัวแปลง AgentTool -> ToolDefinition
├── pi-settings.ts                 # การแทนที่ settings
├── pi-hooks/                      # pi hooks แบบกำหนดเอง
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # การ resolve auth profile
├── auth-profiles.ts               # profile store, cooldown, failover
├── model-selection.ts             # การ resolve โมเดลเริ่มต้น
├── models-config.ts               # การสร้าง models.json
├── model-catalog.ts               # แคชแค็ตตาล็อกโมเดล
├── context-window-guard.ts        # การตรวจสอบ context window
├── failover-error.ts              # คลาส FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # การ resolve พารามิเตอร์ system prompt
├── system-prompt-report.ts        # การสร้างรายงาน debug
├── tool-summaries.ts              # สรุปคำอธิบาย tools
├── tool-policy.ts                 # การ resolve นโยบาย tool
├── transcript-policy.ts           # นโยบายตรวจสอบ transcript
├── skills.ts                      # การสร้าง snapshot/prompt ของ Skills
├── skills/                        # subsystem ของ Skills
├── sandbox.ts                     # การ resolve บริบท sandbox
├── sandbox/                       # subsystem ของ sandbox
├── channel-tools.ts               # การฉีด tools เฉพาะแชนแนล
├── openclaw-tools.ts              # tools เฉพาะของ OpenClaw
├── bash-tools.ts                  # tools exec/process
├── apply-patch.ts                 # tool apply_patch (OpenAI)
├── tools/                         # การ implement tools รายตัว
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

runtime ของการกระทำข้อความเฉพาะแชนแนลตอนนี้อยู่ในไดเรกทอรี extension
ที่เป็นของ Plugin แทนที่จะอยู่ใต้ `src/agents/tools` เช่น:

- ไฟล์ runtime ของการกระทำใน Discord Plugin
- ไฟล์ runtime ของการกระทำใน Slack Plugin
- ไฟล์ runtime ของการกระทำใน Telegram Plugin
- ไฟล์ runtime ของการกระทำใน WhatsApp Plugin

## โฟลว์การผสานรวมหลัก

### 1. การรัน Embedded Agent

จุดเริ่มต้นหลักคือ `runEmbeddedPiAgent()` ใน `pi-embedded-runner/run.ts`:

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

### 2. การสร้างเซสชัน

ภายใน `runEmbeddedAttempt()` (ซึ่งถูกเรียกโดย `runEmbeddedPiAgent()`) จะมีการใช้ pi SDK:

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

### 3. การ subscribe events

`subscribeEmbeddedPiSession()` ทำการ subscribe กับ events ของ `AgentSession` จาก pi:

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

events ที่จัดการ ได้แก่:

- `message_start` / `message_end` / `message_update` (การสตรีม text/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. การส่ง Prompt

หลังตั้งค่าเสร็จ เซสชันจะถูกส่ง prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK จะจัดการ agent loop ทั้งหมด: ส่งไปยัง LLM, เรียกใช้ tool calls และสตรีม responses

การฉีดรูปภาพเป็นแบบ prompt-local: OpenClaw จะโหลด image refs จาก prompt ปัจจุบันและ
ส่งผ่าน `images` สำหรับเทิร์นนั้นเท่านั้น มันจะไม่สแกนประวัติเทิร์นเก่าอีกครั้ง
เพื่อนำ image payloads กลับมาฉีดซ้ำ

## สถาปัตยกรรมของ Tool

### Tool Pipeline

1. **Base Tools**: `codingTools` ของ pi (read, bash, edit, write)
2. **Custom Replacements**: OpenClaw แทนที่ bash ด้วย `exec`/`process`, ปรับแต่ง read/edit/write สำหรับ sandbox
3. **OpenClaw Tools**: messaging, browser, canvas, sessions, cron, gateway เป็นต้น
4. **Channel Tools**: action tools เฉพาะ Discord/Telegram/Slack/WhatsApp
5. **Policy Filtering**: กรอง tools ตามนโยบายของ profile, provider, agent, group, sandbox
6. **Schema Normalization**: ทำความสะอาด schemas สำหรับ quirks ของ Gemini/OpenAI
7. **AbortSignal Wrapping**: ห่อ tools ให้เคารพ abort signals

### ตัวแปลง Tool Definition

`AgentTool` ของ pi-agent-core มีลายเซ็น `execute` ต่างจาก `ToolDefinition` ของ pi-coding-agent ตัวแปลงใน `pi-tool-definition-adapter.ts` ใช้เชื่อมทั้งสองอย่าง:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // ลายเซ็นของ pi-coding-agent ต่างจาก pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### กลยุทธ์การแยก Tool

`splitSdkTools()` จะส่ง tools ทั้งหมดผ่าน `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // ว่าง เรา override ทุกอย่าง
    customTools: toToolDefinitions(options.tools),
  };
}
```

สิ่งนี้ช่วยให้การกรองตามนโยบายของ OpenClaw การผสานรวม sandbox และชุดเครื่องมือที่ขยายเพิ่มเติม มีพฤติกรรมสอดคล้องกันข้าม providers

## การประกอบ System Prompt

system prompt ถูกสร้างใน `buildAgentSystemPrompt()` (`system-prompt.ts`) โดยประกอบ prompt แบบเต็มพร้อม sections เช่น Tooling, Tool Call Style, Safety guardrails, เอกสารอ้างอิง OpenClaw CLI, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Runtime metadata รวมถึง Memory และ Reactions เมื่อเปิดใช้งาน และไฟล์บริบทกับเนื้อหา system prompt เพิ่มเติมตามตัวเลือก sections จะถูกตัดให้สั้นลงสำหรับโหมด prompt แบบ minimal ที่ใช้กับ subagents

prompt จะถูกนำไปใช้หลังจากสร้างเซสชันผ่าน `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## การจัดการเซสชัน

### ไฟล์เซสชัน

เซสชันเป็นไฟล์ JSONL ที่มีโครงสร้างแบบต้นไม้ (เชื่อมโยงกันด้วย id/parentId) `SessionManager` ของ Pi จัดการ persistence:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw ห่อสิ่งนี้ด้วย `guardSessionManager()` เพื่อความปลอดภัยของผลลัพธ์จาก tool

### การแคชเซสชัน

`session-manager-cache.ts` แคช SessionManager instances เพื่อหลีกเลี่ยงการ parse ไฟล์ซ้ำ:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### การจำกัดประวัติ

`limitHistoryTurns()` ตัดประวัติการสนทนาตามชนิดของแชนแนล (DM เทียบกับกลุ่ม)

### Compaction

auto-Compaction จะถูกทริกเกอร์เมื่อบริบทล้น signatures ของ overflow ที่พบบ่อย
ได้แก่ `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` และ `ollama error: context
length exceeded` ส่วน `compactEmbeddedPiSessionDirect()` จัดการ
Compaction แบบแมนนวล:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## การยืนยันตัวตนและการ Resolve โมเดล

### Auth Profiles

OpenClaw ดูแล auth profile store ที่มี API keys หลายตัวต่อ provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profiles จะหมุนเวียนเมื่อเกิดความล้มเหลวพร้อมการติดตาม cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### การ Resolve โมเดล

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// ใช้ ModelRegistry และ AuthStorage ของ pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` จะทริกเกอร์ model fallback เมื่อมีการกำหนดค่าไว้:

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

## Pi Extensions

OpenClaw โหลด pi extensions แบบกำหนดเองสำหรับพฤติกรรมเฉพาะทาง

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` เพิ่ม guardrails ให้กับ Compaction รวมถึง adaptive token budgeting พร้อมสรุปความล้มเหลวของ tool และการทำงานกับไฟล์:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` ทำ cache-TTL based context pruning:

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

## การสตรีมและ Block Replies

### Block Chunking

`EmbeddedBlockChunker` จัดการการสตรีมข้อความให้กลายเป็นบล็อกคำตอบแยกชิ้น:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### การลบแท็ก Thinking/Final

เอาต์พุตที่สตรีมจะถูกประมวลผลเพื่อลบบล็อก `<think>`/`<thinking>` และดึงเนื้อหา `<final>` ออกมา:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // ลบเนื้อหา <think>...</think>
  // หาก enforceFinalTag ให้ส่งคืนเฉพาะเนื้อหา <final>...</final>
};
```

### Reply Directives

reply directives เช่น `[[media:url]]`, `[[voice]]`, `[[reply:id]]` จะถูก parse และดึงออก:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## การจัดการข้อผิดพลาด

### การจัดประเภทข้อผิดพลาด

`pi-embedded-helpers.ts` จัดประเภทข้อผิดพลาดเพื่อให้จัดการได้เหมาะสม:

```typescript
isContextOverflowError(errorText)     // บริบทใหญ่เกินไป
isCompactionFailureError(errorText)   // Compaction ล้มเหลว
isAuthAssistantError(lastAssistant)   // auth ล้มเหลว
isRateLimitAssistantError(...)        // ติด rate limit
isFailoverAssistantError(...)         // ควร failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking Level Fallback

หากไม่รองรับระดับความคิดที่ใช้ ระบบจะ fallback:

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

## การผสานรวม Sandbox

เมื่อเปิดใช้โหมด sandbox tools และ paths จะถูกจำกัด:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // ใช้ read/edit/write tools แบบ sandboxed
  // Exec รันใน container
  // Browser ใช้ bridge URL
}
```

## การจัดการเฉพาะ Provider

### Anthropic

- การลบ refusal magic string
- การตรวจสอบเทิร์นสำหรับบทบาทที่ติดกันต่อเนื่อง
- การตรวจสอบพารามิเตอร์ของ Pi tool ฝั่ง upstream แบบเข้มงวด

### Google/Gemini

- การ sanitize tool schema ที่เป็นของ Plugin

### OpenAI

- tool `apply_patch` สำหรับโมเดล Codex
- การจัดการ downgrade ของระดับความคิด

## การผสานรวม TUI

OpenClaw ยังมีโหมด TUI ภายในเครื่องที่ใช้คอมโพเนนต์ของ pi-tui โดยตรง:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

สิ่งนี้ให้ประสบการณ์เทอร์มินัลแบบโต้ตอบคล้ายกับโหมดเนทีฟของ pi

## ความแตกต่างหลักจาก Pi CLI

| ด้าน              | Pi CLI                  | OpenClaw Embedded                                                                              |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| การเรียกใช้งาน    | คำสั่ง `pi` / RPC       | SDK ผ่าน `createAgentSession()`                                                                |
| Tools             | เครื่องมือ coding ค่าเริ่มต้น | ชุดเครื่องมือ OpenClaw แบบกำหนดเอง                                                           |
| System prompt     | `AGENTS.md` + prompts   | แบบไดนามิกแยกตามแชนแนล/บริบท                                                                  |
| ที่เก็บเซสชัน     | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (หรือ `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth              | ข้อมูลรับรองเดี่ยว       | หลายโปรไฟล์พร้อมการหมุนเวียน                                                                   |
| Extensions        | โหลดจากดิสก์            | แบบโปรแกรมร่วมกับพาธบนดิสก์                                                                  |
| การจัดการ events  | การเรนเดอร์ TUI         | แบบ callback (`onBlockReply` เป็นต้น)                                                          |

## สิ่งที่ควรพิจารณาในอนาคต

พื้นที่ที่อาจปรับโครงสร้างใหม่ได้:

1. **การทำให้ลายเซ็นของ tool สอดคล้องกัน**: ตอนนี้ยังมีการแปลงระหว่างลายเซ็นของ pi-agent-core และ pi-coding-agent
2. **การห่อ session manager**: `guardSessionManager` เพิ่มความปลอดภัยแต่ก็เพิ่มความซับซ้อน
3. **การโหลด extensions**: อาจใช้ `ResourceLoader` ของ pi โดยตรงมากขึ้นได้
4. **ความซับซ้อนของ streaming handler**: `subscribeEmbeddedPiSession` มีขนาดใหญ่ขึ้นมาก
5. **quirks เฉพาะ provider**: มี codepaths เฉพาะ provider หลายจุดที่ pi อาจจัดการเองได้ในอนาคต

## การทดสอบ

ความครอบคลุมของการผสานรวม Pi กระจายอยู่ในชุดทดสอบเหล่านี้:

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

แบบสด/ต้อง opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (เปิดใช้ด้วย `OPENCLAW_LIVE_TEST=1`)

สำหรับคำสั่งการรันปัจจุบัน ดู [Pi Development Workflow](/th/pi-dev)

## ที่เกี่ยวข้อง

- [Pi development workflow](/th/pi-dev)
- [Install overview](/th/install)
