---
read_when:
    - ทำความเข้าใจการออกแบบการผสานรวม Pi SDK ใน OpenClaw
    - การแก้ไขวงจรชีวิตของเซสชันเอเจนต์ การใช้เครื่องมือ หรือการเชื่อมผู้ให้บริการสำหรับ Pi
summary: สถาปัตยกรรมของการผสานรวมเอเจนต์ Pi แบบฝังตัวของ OpenClaw และวงจรชีวิตของเซสชัน
title: สถาปัตยกรรมการผสานรวม Pi
x-i18n:
    generated_at: "2026-04-23T05:43:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# สถาปัตยกรรมการผสานรวม Pi

เอกสารนี้อธิบายว่า OpenClaw ผสานรวมกับ [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) และแพ็กเกจที่อยู่ร่วมกัน (`pi-ai`, `pi-agent-core`, `pi-tui`) อย่างไร เพื่อขับเคลื่อนความสามารถของเอเจนต์ AI

## ภาพรวม

OpenClaw ใช้ pi SDK เพื่อฝังเอเจนต์เขียนโค้ด AI เข้าไปในสถาปัตยกรรม Gateway สำหรับข้อความของมัน แทนที่จะสร้าง pi เป็น subprocess หรือใช้โหมด RPC, OpenClaw จะ import และ instantiate `AgentSession` ของ pi โดยตรงผ่าน `createAgentSession()` วิธีแบบฝังตัวนี้ให้สิ่งต่อไปนี้:

- ควบคุมวงจรชีวิตของเซสชันและการจัดการ event ได้เต็มรูปแบบ
- inject เครื่องมือแบบกำหนดเอง (การส่งข้อความ, sandbox, การกระทำเฉพาะช่องทาง)
- ปรับแต่ง system prompt แยกตามช่องทาง/บริบท
- เก็บถาวรเซสชันพร้อมรองรับ branching/Compaction
- หมุนเวียน auth profile แบบหลายบัญชีพร้อม failover
- สลับโมเดลโดยไม่ยึดติดกับผู้ให้บริการรายใดรายหนึ่ง

## Dependency ของแพ็กเกจ

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| แพ็กเกจ          | จุดประสงค์                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `pi-ai`          | abstraction หลักของ LLM: `Model`, `streamSimple`, ประเภทข้อความ, API ของผู้ให้บริการ                      |
| `pi-agent-core`  | วงจรของเอเจนต์, การรัน tool, ประเภท `AgentMessage`                                                        |
| `pi-coding-agent` | SDK ระดับสูง: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, tool ที่มีมาในตัว |
| `pi-tui`         | องค์ประกอบ UI บนเทอร์มินัล (ใช้ในโหมด TUI ภายในเครื่องของ OpenClaw)                                       |

## โครงสร้างไฟล์

```
src/agents/
├── pi-embedded-runner.ts          # รี-export จาก pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # จุดเริ่มหลัก: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # ตรรกะของการลองหนึ่งครั้งพร้อมการตั้งค่าเซสชัน
│   │   ├── params.ts              # ประเภท RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # สร้าง payload ของคำตอบจากผลลัพธ์การรัน
│   │   ├── images.ts              # การ inject รูปภาพสำหรับโมเดล vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # การตรวจจับข้อผิดพลาดจากการ abort
│   ├── cache-ttl.ts               # การติดตาม Cache TTL สำหรับ context pruning
│   ├── compact.ts                 # ตรรกะ Compaction แบบ manual/auto
│   ├── extensions.ts              # โหลด extension ของ pi สำหรับการรันแบบฝังตัว
│   ├── extra-params.ts            # พารามิเตอร์สตรีมเฉพาะผู้ให้บริการ
│   ├── google.ts                  # การแก้ลำดับ turn สำหรับ Google/Gemini
│   ├── history.ts                 # การจำกัดประวัติ (DM เทียบกับกลุ่ม)
│   ├── lanes.ts                   # lane ของคำสั่งระดับเซสชัน/ระดับ global
│   ├── logger.ts                  # logger ของ subsystem
│   ├── model.ts                   # การ resolve โมเดลผ่าน ModelRegistry
│   ├── runs.ts                    # การติดตามการรันที่ active, abort, queue
│   ├── sandbox-info.ts            # ข้อมูล sandbox สำหรับ system prompt
│   ├── session-manager-cache.ts   # การแคชอินสแตนซ์ SessionManager
│   ├── session-manager-init.ts    # การเริ่มต้นไฟล์เซสชัน
│   ├── system-prompt.ts           # ตัวสร้าง system prompt
│   ├── tool-split.ts              # แยก tool เป็น builtIn กับ custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # การแมป ThinkLevel, คำอธิบายข้อผิดพลาด
├── pi-embedded-subscribe.ts       # การ subscribe/dispatch event ของเซสชัน
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # ตัวสร้าง handler ของ event
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # การแบ่ง chunk ของบล็อกคำตอบแบบสตรีม
├── pi-embedded-messaging.ts       # การติดตามการส่งของ tool ด้านข้อความ
├── pi-embedded-helpers.ts         # การจัดประเภทข้อผิดพลาด, การตรวจสอบ turn
├── pi-embedded-helpers/           # โมดูลตัวช่วย
├── pi-embedded-utils.ts           # ยูทิลิตีสำหรับจัดรูปแบบ
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # การห่อ AbortSignal สำหรับ tool
├── pi-tools.policy.ts             # นโยบาย allowlist/denylist ของ tool
├── pi-tools.read.ts               # การปรับแต่ง read tool
├── pi-tools.schema.ts             # การ normalize schema ของ tool
├── pi-tools.types.ts              # ชนิด alias AnyAgentTool
├── pi-tool-definition-adapter.ts  # ตัวแปลง AgentTool -> ToolDefinition
├── pi-settings.ts                 # การ override ของ settings
├── pi-hooks/                      # hook แบบกำหนดเองของ pi
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # การ resolve auth profile
├── auth-profiles.ts               # ที่เก็บ profile, cooldown, failover
├── model-selection.ts             # การ resolve โมเดลค่าเริ่มต้น
├── models-config.ts               # การสร้าง models.json
├── model-catalog.ts               # แคชแค็ตตาล็อกโมเดล
├── context-window-guard.ts        # การตรวจสอบหน้าต่างบริบท
├── failover-error.ts              # คลาส FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # การ resolve พารามิเตอร์ system prompt
├── system-prompt-report.ts        # การสร้างรายงานดีบัก
├── tool-summaries.ts              # สรุปคำอธิบาย tool
├── tool-policy.ts                 # การ resolve นโยบายของ tool
├── transcript-policy.ts           # นโยบายการตรวจสอบ transcript
├── skills.ts                      # การสร้างสแนปชอต/prompt ของ Skills
├── skills/                        # subsystem ของ Skills
├── sandbox.ts                     # การ resolve บริบทของ sandbox
├── sandbox/                       # subsystem ของ sandbox
├── channel-tools.ts               # การ inject tool เฉพาะช่องทาง
├── openclaw-tools.ts              # tool เฉพาะของ OpenClaw
├── bash-tools.ts                  # tool ด้าน exec/process
├── apply-patch.ts                 # tool apply_patch (OpenAI)
├── tools/                         # implementation ของ tool แต่ละตัว
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

รันไทม์ของการกระทำข้อความเฉพาะช่องทางตอนนี้อยู่ในไดเรกทอรี extension ที่ Plugin เป็นเจ้าของ
แทนที่จะอยู่ใต้ `src/agents/tools` ตัวอย่างเช่น:

- ไฟล์รันไทม์ของการกระทำใน Plugin Discord
- ไฟล์รันไทม์ของการกระทำใน Plugin Slack
- ไฟล์รันไทม์ของการกระทำใน Plugin Telegram
- ไฟล์รันไทม์ของการกระทำใน Plugin WhatsApp

## โฟลว์หลักของการผสานรวม

### 1. การรันเอเจนต์แบบฝังตัว

จุดเริ่มหลักคือ `runEmbeddedPiAgent()` ใน `pi-embedded-runner/run.ts`:

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

ภายใน `runEmbeddedAttempt()` (ซึ่งถูกเรียกโดย `runEmbeddedPiAgent()`) จะใช้ pi SDK:

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

### 3. การ subscribe event

`subscribeEmbeddedPiSession()` จะ subscribe ไปยัง event ของ `AgentSession` จาก pi:

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

event ที่จัดการมีรวมถึง:

- `message_start` / `message_end` / `message_update` (ข้อความ/thinking แบบสตรีม)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. การส่ง prompt

หลังจากตั้งค่าเสร็จ เซสชันจะถูกส่ง prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK จะจัดการวงจรของเอเจนต์ทั้งหมด: ส่งไปยัง LLM, รัน tool call, และสตรีมคำตอบ

การ inject รูปภาพเป็นแบบเฉพาะ prompt: OpenClaw จะโหลด image ref จาก prompt ปัจจุบันและ
ส่งผ่าน `images` สำหรับ turn นั้นเท่านั้น มันจะไม่สแกน turn เก่าในประวัติซ้ำ
เพื่อ inject payload ของรูปภาพกลับเข้าไปอีก

## สถาปัตยกรรมของ tool

### pipeline ของ tool

1. **Base Tools**: `codingTools` ของ pi (read, bash, edit, write)
2. **การแทนที่แบบกำหนดเอง**: OpenClaw แทนที่ bash ด้วย `exec`/`process`, และปรับแต่ง read/edit/write สำหรับ sandbox
3. **OpenClaw Tools**: การส่งข้อความ, เบราว์เซอร์, canvas, sessions, cron, gateway ฯลฯ
4. **Channel Tools**: tool การกระทำเฉพาะของ Discord/Telegram/Slack/WhatsApp
5. **การกรองด้วยนโยบาย**: tool ถูกกรองตามโปรไฟล์ ผู้ให้บริการ เอเจนต์ กลุ่ม และนโยบาย sandbox
6. **การ normalize schema**: ทำความสะอาด schema สำหรับข้อจำกัดเฉพาะของ Gemini/OpenAI
7. **การห่อด้วย AbortSignal**: tool ถูกห่อเพื่อเคารพ abort signal

### ตัวแปลงนิยามของ tool

`AgentTool` ของ pi-agent-core มี signature ของ `execute` ต่างจาก `ToolDefinition` ของ pi-coding-agent ตัวแปลงใน `pi-tool-definition-adapter.ts` ทำหน้าที่เชื่อมสองส่วนนี้:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### กลยุทธ์การแยก tool

`splitSdkTools()` จะส่ง tool ทั้งหมดผ่าน `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

วิธีนี้ช่วยให้การกรองตามนโยบายของ OpenClaw, การผสานรวมกับ sandbox และชุด tool ที่ขยายเพิ่มยังคงสอดคล้องกันข้ามผู้ให้บริการทั้งหมด

## การสร้าง system prompt

system prompt ถูกสร้างใน `buildAgentSystemPrompt()` (`system-prompt.ts`) โดยจะประกอบ prompt แบบเต็มพร้อมส่วนต่าง ๆ เช่น Tooling, รูปแบบการเรียก tool, แนวป้องกันด้านความปลอดภัย, เอกสารอ้างอิง CLI ของ OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, เมทาดาทาของรันไทม์ รวมถึง Memory และ Reactions เมื่อเปิดใช้งาน และยังรวมไฟล์บริบทและเนื้อหา system prompt เพิ่มเติมแบบไม่บังคับได้ ส่วนต่าง ๆ จะถูกตัดทอนสำหรับโหมด prompt แบบขั้นต่ำที่ใช้โดย subagent

prompt จะถูกนำไปใช้หลังสร้างเซสชันผ่าน `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## การจัดการเซสชัน

### ไฟล์เซสชัน

เซสชันเป็นไฟล์ JSONL ที่มีโครงสร้างแบบต้นไม้ (เชื่อมโยงด้วย id/parentId) `SessionManager` ของ Pi เป็นผู้จัดการการเก็บถาวร:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw จะห่อส่วนนี้ด้วย `guardSessionManager()` เพื่อความปลอดภัยของผลลัพธ์จาก tool

### การแคชเซสชัน

`session-manager-cache.ts` จะแคชอินสแตนซ์ของ SessionManager เพื่อหลีกเลี่ยงการ parse ไฟล์ซ้ำ:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### การจำกัดประวัติ

`limitHistoryTurns()` จะตัดทอนประวัติการสนทนาตามประเภทของช่องทาง (DM เทียบกับกลุ่ม)

### Compaction

auto-compaction จะถูกทริกเกอร์เมื่อบริบทล้น ลักษณะข้อผิดพลาด overflow ที่พบบ่อย
ได้แก่ `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` และ `ollama error: context
length exceeded` ส่วน `compactEmbeddedPiSessionDirect()` จัดการ
Compaction แบบ manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## การยืนยันตัวตนและการ resolve โมเดล

### Auth Profiles

OpenClaw ดูแลที่เก็บ auth profile พร้อม API key หลายชุดต่อผู้ให้บริการ:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

profile จะหมุนเวียนเมื่อเกิดความล้มเหลวพร้อมการติดตาม cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### การ resolve โมเดล

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` จะทริกเกอร์การ fallback ของโมเดลเมื่อมีการตั้งค่าไว้:

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

OpenClaw โหลด extension แบบกำหนดเองของ pi สำหรับพฤติกรรมเฉพาะทาง:

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` เพิ่มแนวป้องกันให้กับ Compaction รวมถึงการจัดงบโทเคนแบบปรับตัว พร้อมสรุปความล้มเหลวของ tool และการดำเนินการกับไฟล์:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` ติดตั้งการตัดทอนบริบทแบบอิง Cache-TTL:

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

## การสตรีมและบล็อกคำตอบ

### การแบ่งบล็อก

`EmbeddedBlockChunker` จัดการข้อความที่สตรีมให้กลายเป็นบล็อกคำตอบแยกจากกัน:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### การตัดแท็ก Thinking/Final

เอาต์พุตแบบสตรีมจะถูกประมวลผลเพื่อตัดบล็อก `<think>`/`<thinking>` และดึงเนื้อหา `<final>` ออกมา:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Reply Directives

directive ของคำตอบอย่าง `[[media:url]]`, `[[voice]]`, `[[reply:id]]` จะถูกแยกและดึงออกมา:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## การจัดการข้อผิดพลาด

### การจัดประเภทข้อผิดพลาด

`pi-embedded-helpers.ts` จัดประเภทข้อผิดพลาดเพื่อให้จัดการได้เหมาะสม:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback ของระดับ Thinking

หากไม่รองรับระดับ thinking ที่เลือกไว้ ระบบจะ fallback:

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

## การผสานรวมกับ sandbox

เมื่อเปิดใช้โหมด sandbox, tool และพาธจะถูกจำกัด:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## การจัดการเฉพาะผู้ให้บริการ

### Anthropic

- การล้าง magic string ของการปฏิเสธ
- การตรวจสอบ turn สำหรับ role ที่ต่อเนื่องกัน
- การตรวจสอบพารามิเตอร์ของ tool จาก Pi ฝั่งต้นทางแบบเข้มงวด

### Google/Gemini

- การ sanitize schema ของ tool ที่เป็นของ Plugin

### OpenAI

- tool `apply_patch` สำหรับโมเดล Codex
- การจัดการ downgrade ของระดับ thinking

## การผสานรวมกับ TUI

OpenClaw ยังมีโหมด TUI ในเครื่องที่ใช้คอมโพเนนต์จาก pi-tui โดยตรง:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

สิ่งนี้ทำให้เกิดประสบการณ์เทอร์มินัลแบบโต้ตอบที่คล้ายกับโหมด native ของ pi

## ความแตกต่างหลักจาก Pi CLI

| ด้าน              | Pi CLI                  | OpenClaw Embedded                                                                              |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| การเรียกใช้งาน    | คำสั่ง `pi` / RPC       | SDK ผ่าน `createAgentSession()`                                                                |
| Tools             | ชุด coding tools เริ่มต้น | ชุด tool แบบกำหนดเองของ OpenClaw                                                             |
| System prompt     | AGENTS.md + prompt      | แบบไดนามิกแยกตามช่องทาง/บริบท                                                                 |
| ที่เก็บเซสชัน     | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (หรือ `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth              | credential เดียว        | หลาย profile พร้อมการหมุนเวียน                                                                 |
| Extensions        | โหลดจากดิสก์            | แบบโปรแกรม + พาธบนดิสก์                                                                       |
| การจัดการ event   | การเรนเดอร์ของ TUI      | แบบ callback (`onBlockReply` ฯลฯ)                                                             |

## สิ่งที่อาจพิจารณาในอนาคต

พื้นที่ที่อาจมีการปรับโครงสร้างใหม่:

1. **การจัดแนว signature ของ tool**: ปัจจุบันยังต้องแปลงระหว่าง signature ของ pi-agent-core และ pi-coding-agent
2. **การห่อ session manager**: `guardSessionManager` เพิ่มความปลอดภัย แต่ก็เพิ่มความซับซ้อน
3. **การโหลด extension**: อาจใช้ `ResourceLoader` ของ pi ได้โดยตรงมากขึ้น
4. **ความซับซ้อนของตัวจัดการสตรีม**: `subscribeEmbeddedPiSession` มีขนาดใหญ่ขึ้นมาก
5. **ลักษณะเฉพาะของผู้ให้บริการ**: มี codepath เฉพาะผู้ให้บริการจำนวนมาก ซึ่ง pi อาจจัดการได้เองในอนาคต

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

แบบสด/ต้องเลือกเปิดเอง:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (เปิดด้วย `OPENCLAW_LIVE_TEST=1`)

สำหรับคำสั่งรันปัจจุบัน ดู [Pi Development Workflow](/th/pi-dev)
