---
read_when:
    - ทำความเข้าใจการออกแบบการผสานรวม Pi SDK ใน OpenClaw
    - การแก้ไขวงจรชีวิตของเซสชันเอเจนต์ เครื่องมือ หรือการเชื่อมต่อผู้ให้บริการสำหรับ Pi
summary: สถาปัตยกรรมของการผสานรวมเอเจนต์ Pi แบบฝังตัวของ OpenClaw และวงจรชีวิตของเซสชัน
title: สถาปัตยกรรมการผสานรวม Pi
x-i18n:
    generated_at: "2026-04-24T15:22:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

เอกสารนี้อธิบายวิธีที่ OpenClaw ผสานรวมกับ [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) และแพ็กเกจพี่น้องของมัน (`pi-ai`, `pi-agent-core`, `pi-tui`) เพื่อขับเคลื่อนความสามารถเอเจนต์ AI ของมัน

## ภาพรวม

OpenClaw ใช้ pi SDK เพื่อฝังเอเจนต์เขียนโค้ด AI เข้าไปในสถาปัตยกรรม Gateway สำหรับการรับส่งข้อความของมัน แทนที่จะเรียก pi เป็น subprocess หรือใช้โหมด RPC, OpenClaw จะ import และสร้างอินสแตนซ์ `AgentSession` ของ pi โดยตรงผ่าน `createAgentSession()` แนวทางแบบฝังตัวนี้ให้สิ่งต่อไปนี้:

- ควบคุมวงจรชีวิตของเซสชันและการจัดการอีเวนต์ได้อย่างเต็มรูปแบบ
- การ inject เครื่องมือแบบกำหนดเอง (การรับส่งข้อความ, sandbox, การดำเนินการเฉพาะช่องทาง)
- การปรับแต่ง system prompt ตามช่องทาง/บริบท
- การคงอยู่ของเซสชันพร้อมรองรับการแตกแขนง/Compaction
- การหมุนเวียนโปรไฟล์การยืนยันตัวตนหลายบัญชีพร้อม failover
- การสลับโมเดลแบบไม่ยึดติดกับผู้ให้บริการ

## การพึ่งพาแพ็กเกจ

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| แพ็กเกจ          | วัตถุประสงค์                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`          | แอ็บสแตรกชัน LLM หลัก: `Model`, `streamSimple`, ชนิดข้อความ, API ของผู้ให้บริการ                      |
| `pi-agent-core`  | ลูปเอเจนต์, การรันเครื่องมือ, ชนิด `AgentMessage`                                                      |
| `pi-coding-agent` | SDK ระดับสูง: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, เครื่องมือในตัว |
| `pi-tui`         | คอมโพเนนต์ UI สำหรับเทอร์มินัล (ใช้ในโหมด TUI ภายในเครื่องของ OpenClaw)                                |

## โครงสร้างไฟล์

```
src/agents/
├── pi-embedded-runner.ts          # ส่งออกซ้ำจาก pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # จุดเริ่มต้นหลัก: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # ตรรกะของความพยายามครั้งเดียวพร้อมการตั้งค่าเซสชัน
│   │   ├── params.ts              # ชนิด RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # สร้าง payload การตอบกลับจากผลลัพธ์การรัน
│   │   ├── images.ts              # การ inject รูปภาพสำหรับโมเดลที่รองรับการมองเห็น
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # การตรวจจับข้อผิดพลาดจากการยกเลิก
│   ├── cache-ttl.ts               # การติดตาม Cache TTL สำหรับการตัดบริบท
│   ├── compact.ts                 # ตรรกะ Compaction แบบกำหนดเอง/อัตโนมัติ
│   ├── extensions.ts              # โหลดส่วนขยาย pi สำหรับการรันแบบฝังตัว
│   ├── extra-params.ts            # พารามิเตอร์สตรีมเฉพาะผู้ให้บริการ
│   ├── google.ts                  # การแก้ไขลำดับเทิร์นสำหรับ Google/Gemini
│   ├── history.ts                 # การจำกัดประวัติ (DM เทียบกับกลุ่ม)
│   ├── lanes.ts                   # lanes คำสั่งระดับเซสชัน/ระดับโกลบอล
│   ├── logger.ts                  # logger ของระบบย่อย
│   ├── model.ts                   # การแปลงค่าโมเดลผ่าน ModelRegistry
│   ├── runs.ts                    # การติดตามการรันที่กำลังทำงาน, การยกเลิก, คิว
│   ├── sandbox-info.ts            # ข้อมูล sandbox สำหรับ system prompt
│   ├── session-manager-cache.ts   # การแคชอินสแตนซ์ SessionManager
│   ├── session-manager-init.ts    # การเริ่มต้นไฟล์เซสชัน
│   ├── system-prompt.ts           # ตัวสร้าง system prompt
│   ├── tool-split.ts              # แยกเครื่องมือเป็น builtIn กับ custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # การแมป ThinkLevel, คำอธิบายข้อผิดพลาด
├── pi-embedded-subscribe.ts       # การ subscribe/dispatch อีเวนต์ของเซสชัน
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # แฟกทอรีตัวจัดการอีเวนต์
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # การแบ่งบล็อกคำตอบแบบสตรีม
├── pi-embedded-messaging.ts       # การติดตามการส่งของเครื่องมือข้อความ
├── pi-embedded-helpers.ts         # การจัดประเภทข้อผิดพลาด, การตรวจสอบเทิร์น
├── pi-embedded-helpers/           # โมดูลตัวช่วย
├── pi-embedded-utils.ts           # ยูทิลิตีสำหรับการจัดรูปแบบ
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # การห่อ AbortSignal สำหรับเครื่องมือ
├── pi-tools.policy.ts             # นโยบาย allowlist/denylist ของเครื่องมือ
├── pi-tools.read.ts               # การปรับแต่งเครื่องมืออ่าน
├── pi-tools.schema.ts             # การทำ schema ของเครื่องมือให้เป็นมาตรฐาน
├── pi-tools.types.ts              # type alias ของ AnyAgentTool
├── pi-tool-definition-adapter.ts  # อะแดปเตอร์ AgentTool -> ToolDefinition
├── pi-settings.ts                 # การ override การตั้งค่า
├── pi-hooks/                      # hooks แบบกำหนดเองของ pi
│   ├── compaction-safeguard.ts    # ส่วนขยาย safeguard
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # ส่วนขยายการตัดบริบทตาม Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # การแปลงค่าโปรไฟล์การยืนยันตัวตน
├── auth-profiles.ts               # ที่เก็บโปรไฟล์, cooldown, failover
├── model-selection.ts             # การแปลงค่าโมเดลเริ่มต้น
├── models-config.ts               # การสร้าง models.json
├── model-catalog.ts               # แคชแค็ตตาล็อกโมเดล
├── context-window-guard.ts        # การตรวจสอบ context window
├── failover-error.ts              # คลาส FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # การแปลงค่าพารามิเตอร์ system prompt
├── system-prompt-report.ts        # การสร้างรายงานดีบัก
├── tool-summaries.ts              # สรุปคำอธิบายเครื่องมือ
├── tool-policy.ts                 # การแปลงค่านโยบายเครื่องมือ
├── transcript-policy.ts           # นโยบายตรวจสอบ transcript
├── skills.ts                      # การสร้าง snapshot/prompt ของ Skills
├── skills/                        # ระบบย่อย Skills
├── sandbox.ts                     # การแปลงค่าบริบท sandbox
├── sandbox/                       # ระบบย่อย sandbox
├── channel-tools.ts               # การ inject เครื่องมือเฉพาะช่องทาง
├── openclaw-tools.ts              # เครื่องมือเฉพาะของ OpenClaw
├── bash-tools.ts                  # เครื่องมือ exec/process
├── apply-patch.ts                 # เครื่องมือ apply_patch (OpenAI)
├── tools/                         # อิมพลีเมนเทชันของเครื่องมือแต่ละตัว
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

รันไทม์ของการดำเนินการข้อความเฉพาะช่องทางตอนนี้อยู่ในไดเรกทอรีส่วนขยายที่เป็นเจ้าของโดย Plugin แทนที่จะอยู่ภายใต้ `src/agents/tools` เช่น:

- ไฟล์รันไทม์การดำเนินการของ Discord Plugin
- ไฟล์รันไทม์การดำเนินการของ Slack Plugin
- ไฟล์รันไทม์การดำเนินการของ Telegram Plugin
- ไฟล์รันไทม์การดำเนินการของ WhatsApp Plugin

## โฟลว์การผสานรวมหลัก

### 1. การรันเอเจนต์แบบฝังตัว

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

ภายใน `runEmbeddedAttempt()` (ซึ่งถูกเรียกโดย `runEmbeddedPiAgent()`), จะมีการใช้ pi SDK:

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

### 3. การ subscribe อีเวนต์

`subscribeEmbeddedPiSession()` จะ subscribe ไปยังอีเวนต์ของ `AgentSession` จาก pi:

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

อีเวนต์ที่จัดการมีดังนี้:

- `message_start` / `message_end` / `message_update` (ข้อความ/การคิดแบบสตรีม)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. การส่งพรอมป์

หลังจากตั้งค่าเสร็จแล้ว จะมีการส่งพรอมป์ให้กับเซสชัน:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK จะจัดการลูปเอเจนต์ทั้งหมด: ส่งไปยัง LLM, รันการเรียกใช้เครื่องมือ, และสตรีมการตอบกลับ

การ inject รูปภาพเป็นแบบเฉพาะพรอมป์: OpenClaw จะโหลดการอ้างอิงรูปภาพจากพรอมป์ปัจจุบันและส่งผ่าน `images` สำหรับเทิร์นนั้นเท่านั้น มันจะไม่สแกนเทิร์นเก่าในประวัติเพื่อ inject payload รูปภาพซ้ำอีก

## สถาปัตยกรรมเครื่องมือ

### ไปป์ไลน์ของเครื่องมือ

1. **เครื่องมือพื้นฐาน**: `codingTools` ของ pi (`read`, `bash`, `edit`, `write`)
2. **การแทนที่แบบกำหนดเอง**: OpenClaw แทนที่ bash ด้วย `exec`/`process`, และปรับแต่ง read/edit/write สำหรับ sandbox
3. **เครื่องมือ OpenClaw**: การรับส่งข้อความ, browser, canvas, sessions, Cron, Gateway และอื่นๆ
4. **เครื่องมือช่องทาง**: เครื่องมือดำเนินการเฉพาะ Discord/Telegram/Slack/WhatsApp
5. **การกรองตามนโยบาย**: เครื่องมือถูกกรองตามนโยบายของโปรไฟล์, ผู้ให้บริการ, เอเจนต์, กลุ่ม, sandbox
6. **การทำ schema ให้เป็นมาตรฐาน**: schema ถูกปรับให้สะอาดสำหรับข้อจำกัดเฉพาะของ Gemini/OpenAI
7. **การห่อ AbortSignal**: เครื่องมือถูกห่อเพื่อรองรับสัญญาณยกเลิก

### อะแดปเตอร์นิยามเครื่องมือ

`AgentTool` ของ pi-agent-core มี signature ของ `execute` ที่ต่างจาก `ToolDefinition` ของ pi-coding-agent อะแดปเตอร์ใน `pi-tool-definition-adapter.ts` เชื่อมทั้งสองเข้าด้วยกัน:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // signature ของ pi-coding-agent ต่างจาก pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### กลยุทธ์การแยกเครื่องมือ

`splitSdkTools()` จะส่งเครื่องมือทั้งหมดผ่าน `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // ว่างเปล่า เรา override ทุกอย่าง
    customTools: toToolDefinitions(options.tools),
  };
}
```

สิ่งนี้ช่วยให้การกรองตามนโยบายของ OpenClaw, การผสานรวม sandbox และชุดเครื่องมือที่ขยายเพิ่มเติม ยังคงสอดคล้องกันในทุกผู้ให้บริการ

## การสร้าง System Prompt

system prompt ถูกสร้างใน `buildAgentSystemPrompt()` (`system-prompt.ts`) โดยจะประกอบพรอมป์แบบเต็มพร้อมส่วนต่างๆ ซึ่งรวมถึง Tooling, รูปแบบการเรียกใช้เครื่องมือ, มาตรการป้องกันด้านความปลอดภัย, เอกสารอ้างอิง OpenClaw CLI, Skills, เอกสาร, เวิร์กสเปซ, Sandbox, การรับส่งข้อความ, แท็กคำตอบ, น้ำเสียง, การตอบกลับแบบเงียบ, Heartbeat, ข้อมูลเมตาของรันไทม์ รวมถึง Memory และ Reactions เมื่อเปิดใช้งาน และยังรองรับไฟล์บริบทเพิ่มเติมและเนื้อหา system prompt เพิ่มเติมแบบเลือกได้ ส่วนต่างๆ จะถูกตัดให้กระชับสำหรับโหมดพรอมป์แบบย่อที่ใช้โดยซับเอเจนต์

พรอมป์จะถูกนำไปใช้หลังจากสร้างเซสชันผ่าน `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## การจัดการเซสชัน

### ไฟล์เซสชัน

เซสชันเป็นไฟล์ JSONL ที่มีโครงสร้างแบบต้นไม้ (เชื่อมโยงกันด้วย id/parentId) โดย `SessionManager` ของ Pi จะจัดการการคงอยู่ของข้อมูล:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw ห่อส่วนนี้ด้วย `guardSessionManager()` เพื่อความปลอดภัยของผลลัพธ์จากเครื่องมือ

### การแคชเซสชัน

`session-manager-cache.ts` แคชอินสแตนซ์ `SessionManager` เพื่อหลีกเลี่ยงการแยกวิเคราะห์ไฟล์ซ้ำหลายครั้ง:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### การจำกัดประวัติ

`limitHistoryTurns()` จะตัดประวัติการสนทนาตามประเภทของช่องทาง (DM เทียบกับกลุ่ม)

### Compaction

Compaction อัตโนมัติจะเริ่มทำงานเมื่อบริบทล้น รูปแบบทั่วไปของสัญญาณที่บ่งชี้ว่าล้น ได้แก่ `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` และ `ollama error: context length exceeded` ส่วน `compactEmbeddedPiSessionDirect()` จะจัดการ Compaction แบบกำหนดเอง:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## การยืนยันตัวตนและการแปลงค่าโมเดล

### โปรไฟล์การยืนยันตัวตน

OpenClaw มีที่เก็บโปรไฟล์การยืนยันตัวตนซึ่งรองรับ API key หลายชุดต่อผู้ให้บริการหนึ่งราย:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

โปรไฟล์จะถูกหมุนเวียนเมื่อเกิดความล้มเหลว พร้อมการติดตาม cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### การแปลงค่าโมเดล

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// ใช้ ModelRegistry และ AuthStorage ของ Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` จะกระตุ้นการ fallback ของโมเดลเมื่อมีการกำหนดค่าไว้:

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

## ส่วนขยายของ Pi

OpenClaw โหลดส่วนขยาย Pi แบบกำหนดเองเพื่อรองรับพฤติกรรมเฉพาะทาง:

### มาตรการป้องกัน Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` เพิ่มมาตรการป้องกันให้กับ Compaction รวมถึงการจัดสรร token budget แบบปรับตามสถานการณ์ ตลอดจนสรุปความล้มเหลวของเครื่องมือและการดำเนินการกับไฟล์:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### การตัดบริบท

`src/agents/pi-hooks/context-pruning.ts` ใช้งานการตัดบริบทโดยอิงกับ Cache-TTL:

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

## การสตรีมและการตอบกลับแบบบล็อก

### การแบ่งบล็อก

`EmbeddedBlockChunker` จัดการการสตรีมข้อความให้เป็นบล็อกคำตอบแบบแยกส่วน:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### การตัดแท็กคิด/แท็กสุดท้ายออก

เอาต์พุตแบบสตรีมจะถูกประมวลผลเพื่อตัดบล็อก `<think>`/`<thinking>` ออก และดึงเนื้อหาจาก `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // ตัดเนื้อหา <think>...</think> ออก
  // ถ้า enforceFinalTag เปิดอยู่ ให้คืนค่าเฉพาะเนื้อหา <final>...</final>
};
```

### คำสั่งกำกับการตอบกลับ

คำสั่งกำกับการตอบกลับ เช่น `[[media:url]]`, `[[voice]]`, `[[reply:id]]` จะถูกแยกวิเคราะห์และดึงออกมา:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## การจัดการข้อผิดพลาด

### การจัดประเภทข้อผิดพลาด

`pi-embedded-helpers.ts` จัดประเภทข้อผิดพลาดเพื่อให้จัดการได้อย่างเหมาะสม:

```typescript
isContextOverflowError(errorText)     // บริบทใหญ่เกินไป
isCompactionFailureError(errorText)   // Compaction ล้มเหลว
isAuthAssistantError(lastAssistant)   // การยืนยันตัวตนล้มเหลว
isRateLimitAssistantError(...)        // ติด rate limit
isFailoverAssistantError(...)         // ควรทำ failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### การ fallback ระดับการคิด

หากไม่รองรับระดับการคิดที่กำหนดไว้ ระบบจะ fallback:

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

เมื่อเปิดใช้โหมด sandbox เครื่องมือและพาธจะถูกจำกัด:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // ใช้เครื่องมือ read/edit/write แบบ sandbox
  // Exec รันในคอนเทนเนอร์
  // Browser ใช้ bridge URL
}
```

## การจัดการเฉพาะผู้ให้บริการ

### Anthropic

- การลบ magic string สำหรับการปฏิเสธ
- การตรวจสอบเทิร์นสำหรับบทบาทที่เกิดติดกัน
- การตรวจสอบพารามิเตอร์เครื่องมือของ Pi ฝั่งต้นทางอย่างเข้มงวด

### Google/Gemini

- การทำ schema ของเครื่องมือที่เป็นเจ้าของโดย Plugin ให้ปลอดปัญหา

### OpenAI

- เครื่องมือ `apply_patch` สำหรับโมเดล Codex
- การจัดการ downgrade ระดับการคิด

## การผสานรวม TUI

OpenClaw ยังมีโหมด TUI ภายในเครื่องที่ใช้คอมโพเนนต์ของ pi-tui โดยตรง:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

สิ่งนี้มอบประสบการณ์เทอร์มินัลแบบโต้ตอบที่คล้ายกับโหมดเนทีฟของ Pi

## ความแตกต่างหลักจาก Pi CLI

| ด้าน            | Pi CLI                  | OpenClaw Embedded                                                                                  |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| การเรียกใช้งาน   | คำสั่ง `pi` / RPC       | SDK ผ่าน `createAgentSession()`                                                                    |
| เครื่องมือ       | เครื่องมือเขียนโค้ดเริ่มต้น | ชุดเครื่องมือแบบกำหนดเองของ OpenClaw                                                               |
| system prompt   | AGENTS.md + prompts     | แบบไดนามิกตามช่องทาง/บริบท                                                                         |
| การเก็บเซสชัน    | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (หรือ `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| การยืนยันตัวตน   | ข้อมูลรับรองชุดเดียว      | หลายโปรไฟล์พร้อมการหมุนเวียน                                                                        |
| ส่วนขยาย        | โหลดจากดิสก์             | ทั้งแบบโปรแกรมและผ่านพาธบนดิสก์                                                                   |
| การจัดการอีเวนต์ | การเรนเดอร์ TUI         | แบบ callback (`onBlockReply` เป็นต้น)                                                               |

## สิ่งที่ควรพิจารณาในอนาคต

พื้นที่ที่อาจต้องปรับโครงสร้างใหม่:

1. **การทำ signature ของเครื่องมือให้สอดคล้องกัน**: ปัจจุบันยังต้องปรับระหว่าง signature ของ pi-agent-core และ pi-coding-agent
2. **การห่อ session manager**: `guardSessionManager` เพิ่มความปลอดภัยแต่ก็เพิ่มความซับซ้อน
3. **การโหลดส่วนขยาย**: อาจใช้ `ResourceLoader` ของ Pi ได้โดยตรงมากขึ้น
4. **ความซับซ้อนของตัวจัดการการสตรีม**: `subscribeEmbeddedPiSession` มีขนาดใหญ่ขึ้นมาก
5. **ลักษณะเฉพาะของผู้ให้บริการ**: มีเส้นทางโค้ดเฉพาะผู้ให้บริการจำนวนมาก ซึ่ง Pi อาจรองรับได้เองในอนาคต

## การทดสอบ

ความครอบคลุมของการผสานรวม Pi ครอบคลุมชุดทดสอบเหล่านี้:

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

แบบสด/เลือกเปิดใช้:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (เปิดใช้ `OPENCLAW_LIVE_TEST=1`)

สำหรับคำสั่งรันปัจจุบัน โปรดดู [เวิร์กโฟลว์การพัฒนา Pi](/th/pi-dev)

## ที่เกี่ยวข้อง

- [เวิร์กโฟลว์การพัฒนา Pi](/th/pi-dev)
- [ภาพรวมการติดตั้ง](/th/install)
