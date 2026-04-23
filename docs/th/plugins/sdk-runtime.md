---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยของแกนหลักจาก Plugin (TTS, STT, การสร้างภาพ, การค้นหาเว็บ, subagent)
    - คุณต้องการเข้าใจว่า `api.runtime` เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้านคอนฟิก เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- ตัวช่วย runtime ที่ถูก inject และพร้อมใช้งานสำหรับ Plugins
title: ตัวช่วย Plugin Runtime
x-i18n:
    generated_at: "2026-04-23T05:48:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77a6e9cd48c84affa17dce684bbd0e072c8b63485e4a5d569f3793a4ea4f9c8
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# ตัวช่วย Plugin Runtime

เอกสารอ้างอิงสำหรับออบเจ็กต์ `api.runtime` ที่ถูก inject เข้าไปในทุก Plugin ระหว่างการ
ลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการ import internals ของโฮสต์โดยตรง

<Tip>
  **กำลังมองหาคำอธิบายแบบ walkthrough อยู่หรือไม่?** ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
  หรือ [Provider Plugins](/th/plugins/sdk-provider-plugins) สำหรับคู่มือแบบทีละขั้นตอน
  ที่แสดงตัวช่วยเหล่านี้ในบริบทการใช้งานจริง
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## namespaces ของ Runtime

### `api.runtime.agent`

ตัวตนของเอเจนต์ ไดเรกทอรี และการจัดการ session

```typescript
// Resolve ไดเรกทอรีทำงานของเอเจนต์
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolve workspace ของเอเจนต์
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// ดึงตัวตนของเอเจนต์
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// ดึงระดับการคิดค่าเริ่มต้น
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// ดึง timeout ของเอเจนต์
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// ตรวจให้แน่ใจว่า workspace มีอยู่
await api.runtime.agent.ensureAgentWorkspace(cfg);

// รัน embedded agent turn
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` เป็นตัวช่วยแบบเป็นกลางสำหรับการเริ่ม OpenClaw
agent turn ปกติจากโค้ด Plugin มันใช้การ resolve provider/model และ
agent-harness แบบเดียวกับที่การตอบกลับซึ่งถูกทริกเกอร์จากช่องทางใช้งาน

`runEmbeddedPiAgent(...)` ยังคงอยู่เป็น compatibility alias

**ตัวช่วยสำหรับ session store** อยู่ภายใต้ `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

ค่าคงที่ของโมเดลและผู้ให้บริการเริ่มต้น:

```typescript
const model = api.runtime.agent.defaults.model; // เช่น "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // เช่น "anthropic"
```

### `api.runtime.subagent`

เปิดและจัดการการรัน subagent แบบเบื้องหลัง

```typescript
// เริ่มการรัน subagent
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // override แบบไม่บังคับ
  model: "gpt-4.1-mini", // override แบบไม่บังคับ
  deliver: false,
});

// รอจนเสร็จ
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// อ่านข้อความใน session
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// ลบ session
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  การ override โมเดล (`provider`/`model`) ต้องได้รับการ opt-in จาก operator ผ่าน
  `plugins.entries.<id>.subagent.allowModelOverride: true` ในคอนฟิก
  Plugins ที่ไม่น่าเชื่อถือยังสามารถรัน subagents ได้ แต่คำขอ override จะถูกปฏิเสธ
</Warning>

### `api.runtime.taskFlow`

ผูก TaskFlow runtime เข้ากับ OpenClaw session key ที่มีอยู่แล้ว หรือ trusted tool
context จากนั้นสร้างและจัดการ TaskFlow โดยไม่ต้องส่ง owner ในทุกการเรียก

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Review new pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Review PR #123",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมี
OpenClaw session key ที่เชื่อถือได้อยู่แล้วจาก binding layer ของคุณเอง อย่าผูกจาก raw
user input

### `api.runtime.tts`

การสังเคราะห์เสียงจากข้อความ

```typescript
// TTS แบบมาตรฐาน
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// TTS ที่ปรับให้เหมาะกับระบบโทรศัพท์
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// แสดงรายการเสียงที่ใช้ได้
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

ใช้การกำหนดค่า `messages.tts` และการเลือกผู้ให้บริการจากแกนหลัก คืนค่า PCM audio
buffer + sample rate

### `api.runtime.mediaUnderstanding`

การวิเคราะห์รูปภาพ เสียง และวิดีโอ

```typescript
// อธิบายรูปภาพ
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// ถอดเสียงจากไฟล์เสียง
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // ไม่บังคับ ใช้เมื่อไม่สามารถอนุมาน MIME ได้
});

// อธิบายวิดีโอ
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// วิเคราะห์ไฟล์แบบทั่วไป
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

จะคืนค่า `{ text: undefined }` เมื่อไม่มีเอาต์พุตเกิดขึ้น (เช่น อินพุตถูกข้ามไป)

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` ยังคงอยู่เป็น compatibility alias
  ของ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
</Info>

### `api.runtime.imageGeneration`

การสร้างภาพ

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

การค้นหาเว็บ

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

ยูทิลิตีระดับต่ำสำหรับ media

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

การโหลดและเขียนคอนฟิก

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

ยูทิลิตีระดับระบบ

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

การ subscribe กับ events

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Logging

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

การ resolve auth ของโมเดลและผู้ให้บริการ

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

การ resolve state directory

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

โรงงานสร้าง memory tools และ CLI

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

ตัวช่วย runtime เฉพาะของช่องทาง (ใช้ได้เมื่อโหลด Plugin ของช่องทางอยู่)

`api.runtime.channel.mentions` คือพื้นผิวนโยบาย inbound mention แบบใช้ร่วมกันสำหรับ
Plugins ช่องทางที่บันเดิลมาซึ่งใช้ runtime injection:

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

ตัวช่วย mentions ที่มีให้:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` ตั้งใจไม่เปิดเผยตัวช่วย compatibility แบบเก่า
`resolveMentionGating*` ให้เลือกใช้เส้นทางที่ normalize แล้วแบบ
`{ facts, policy }`

## การเก็บอ้างอิงของ runtime

ใช้ `createPluginRuntimeStore` เพื่อเก็บอ้างอิง runtime สำหรับใช้นอก
callback ของ `register`

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// ใน entry point ของคุณ
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// ในไฟล์อื่น
export function getRuntime() {
  return store.getRuntime(); // โยนข้อผิดพลาดหากยังไม่ถูก initialize
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // คืนค่า null หากยังไม่ถูก initialize
}
```

ควรใช้ `pluginId` สำหรับตัวตนของ runtime-store รูปแบบ `key` ระดับต่ำกว่า
มีไว้สำหรับกรณีที่พบไม่บ่อยซึ่ง Plugin หนึ่งตัวตั้งใจต้องการ runtime slot มากกว่าหนึ่งชุด

## ฟิลด์ `api` ระดับบนสุดอื่นๆ

นอกเหนือจาก `api.runtime` แล้ว ออบเจ็กต์ API ยังมี:

| ฟิลด์                    | ชนิด                      | คำอธิบาย                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                                   |
| `api.name`               | `string`                  | ชื่อที่ใช้แสดงของ Plugin                                                                         |
| `api.config`             | `OpenClawConfig`          | snapshot คอนฟิกปัจจุบัน (active in-memory runtime snapshot เมื่อมีให้ใช้งาน)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | คอนฟิกเฉพาะของ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.logger`             | `PluginLogger`            | logger แบบมีขอบเขต (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่าง startup/setup แบบเบาก่อน full-entry จริง |
| `api.resolvePath(input)` | `(string) => string`      | resolve พาธโดยอิงจาก root ของ Plugin                                                  |

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- เอกสารอ้างอิง subpath
- [SDK Entry Points](/th/plugins/sdk-entrypoints) -- ตัวเลือกของ `definePluginEntry`
- [Plugin Internals](/th/plugins/architecture) -- โมเดลความสามารถและ registry
