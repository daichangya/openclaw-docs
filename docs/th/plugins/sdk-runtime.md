---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยของ core จาก Plugin (TTS, STT, การสร้างภาพ, การค้นหาเว็บ, subagent, Node)
    - คุณต้องการทำความเข้าใจว่า `api.runtime` เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้านคอนฟิก เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูกฉีดเข้ามาและพร้อมให้ Plugin ใช้งาน
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-04-24T09:25:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

ข้อมูลอ้างอิงสำหรับออบเจ็กต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุก Plugin ระหว่างการลงทะเบียน
ให้ใช้ตัวช่วยเหล่านี้แทนการ import ส่วนภายในของโฮสต์โดยตรง

<Tip>
  **กำลังมองหาคำแนะนำแบบเป็นขั้นตอนอยู่หรือไม่?** ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
  หรือ [Provider Plugins](/th/plugins/sdk-provider-plugins) สำหรับคู่มือแบบทีละขั้นตอน
  ที่แสดงการใช้ตัวช่วยเหล่านี้ในบริบทจริง
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## namespace ของรันไทม์

### `api.runtime.agent`

อัตลักษณ์เอเจนต์, ไดเรกทอรี และการจัดการเซสชัน

```typescript
// Resolve the agent's working directory
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolve agent workspace
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Get agent identity
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Get default thinking level
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Get agent timeout
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Ensure workspace exists
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Run an embedded agent turn
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

`runEmbeddedAgent(...)` คือตัวช่วยแบบเป็นกลางสำหรับเริ่มเทิร์นเอเจนต์ OpenClaw
ปกติจากโค้ด Plugin โดยจะใช้การ resolve ผู้ให้บริการ/โมเดลและ
การเลือก agent harness แบบเดียวกับการตอบกลับที่ถูกกระตุ้นจาก channel

`runEmbeddedPiAgent(...)` ยังคงมีอยู่ในฐานะ alias เพื่อความเข้ากันได้

**ตัวช่วย session store** อยู่ภายใต้ `api.runtime.agent.session`:

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

เปิดใช้งานและจัดการการรัน subagent แบบเบื้องหลัง

```typescript
// Start a subagent run
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // optional override
  model: "gpt-4.1-mini", // optional override
  deliver: false,
});

// Wait for completion
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Read session messages
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Delete a session
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  การ override โมเดล (`provider`/`model`) ต้องได้รับการ opt-in จาก operator ผ่าน
  `plugins.entries.<id>.subagent.allowModelOverride: true` ในคอนฟิก
  Plugin ที่ไม่น่าเชื่อถือยังคงรัน subagent ได้ แต่คำขอ override จะถูกปฏิเสธ
</Warning>

### `api.runtime.nodes`

แสดงรายการ Node ที่เชื่อมต่ออยู่และเรียกใช้คำสั่งของโฮสต์ Node จากโค้ด Plugin
ที่โหลดโดย Gateway ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงานภายในเครื่องบนอุปกรณ์ที่จับคู่ไว้
เช่น browser หรือ audio bridge บน Mac อีกเครื่อง

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

รันไทม์นี้พร้อมใช้งานเฉพาะภายใน Gateway เท่านั้น
คำสั่งของ Node ยังคงผ่านการจับคู่ Node ของ Gateway ตามปกติ, allowlist ของคำสั่ง
และการจัดการคำสั่งภายในเครื่องของ Node

### `api.runtime.taskFlow`

ผูกรันไทม์ TaskFlow เข้ากับ session key ของ OpenClaw ที่มีอยู่
หรือบริบทเครื่องมือที่เชื่อถือได้ แล้วจึงสร้างและจัดการ TaskFlow โดยไม่ต้องส่ง owner ทุกครั้งที่เรียก

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

ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมี session key
ของ OpenClaw ที่เชื่อถือได้จากเลเยอร์การผูกของคุณเองอยู่แล้ว
อย่าผูกจากอินพุตดิบของผู้ใช้

### `api.runtime.tts`

การสังเคราะห์ข้อความเป็นเสียงพูด

```typescript
// Standard TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Telephony-optimized TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// List available voices
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

ใช้คอนฟิก `messages.tts` และการเลือกผู้ให้บริการจาก core
ส่งกลับบัฟเฟอร์เสียง PCM + sample rate

### `api.runtime.mediaUnderstanding`

การวิเคราะห์ภาพ เสียง และวิดีโอ

```typescript
// Describe an image
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transcribe audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // optional, for when MIME cannot be inferred
});

// Describe a video
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Generic file analysis
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

ส่งกลับ `{ text: undefined }` เมื่อไม่มีการสร้างผลลัพธ์ (เช่น อินพุตถูกข้าม)

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` ยังคงมีอยู่ในฐานะ alias เพื่อความเข้ากันได้
  สำหรับ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
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

ยูทิลิตีสื่อระดับต่ำ

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
  scale: 6, // 1-12
  marginModules: 4, // 0-16
});
const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
const tmpRoot = resolvePreferredOpenClawTmpDir();
const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
  tmpRoot,
  dirPrefix: "my-plugin-qr-",
  fileName: "qr.png",
});
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

การสมัครรับ event

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

การบันทึกล็อก

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

การ resolve การยืนยันตัวตนของโมเดลและผู้ให้บริการ

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

การ resolve ไดเรกทอรี state

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

factory ของเครื่องมือหน่วยความจำและ CLI

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

ตัวช่วยรันไทม์เฉพาะของ channel (พร้อมใช้งานเมื่อมีการโหลด Channel plugin)

`api.runtime.channel.mentions` คือ surface นโยบายการกล่าวถึงขาเข้าที่ใช้ร่วมกันสำหรับ
Channel plugin แบบ bundled ที่ใช้การฉีดรันไทม์:

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

ตัวช่วยการกล่าวถึงที่พร้อมใช้งาน:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` จงใจไม่เปิดเผยตัวช่วยความเข้ากันได้
`resolveMentionGating*` แบบเก่า ควรใช้เส้นทางแบบทำให้เป็นมาตรฐาน
`{ facts, policy }`

## การเก็บ reference ของรันไทม์

ใช้ `createPluginRuntimeStore` เพื่อเก็บ reference ของรันไทม์ไว้ใช้ภายนอก
callback `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// In your entry point
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In other files
export function getRuntime() {
  return store.getRuntime(); // throws if not initialized
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // returns null if not initialized
}
```

ควรใช้ `pluginId` สำหรับอัตลักษณ์ของ runtime-store รูปแบบ `key`
ระดับต่ำกว่านั้นมีไว้สำหรับกรณีที่พบไม่บ่อยซึ่ง Plugin หนึ่งตั้งใจต้องใช้สล็อตรันไทม์มากกว่าหนึ่งสล็อต

## ฟิลด์ `api` ระดับบนสุดอื่น ๆ

นอกเหนือจาก `api.runtime` แล้ว ออบเจ็กต์ API ยังมีให้ด้วย:

| ฟิลด์                    | ชนิดข้อมูล                | คำอธิบาย                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                               |
| `api.name`               | `string`                  | ชื่อที่ใช้แสดงของ Plugin                                                                    |
| `api.config`             | `OpenClawConfig`          | snapshot คอนฟิกปัจจุบัน (snapshot ของรันไทม์ในหน่วยความจำที่กำลังใช้งานเมื่อมี)            |
| `api.pluginConfig`       | `Record<string, unknown>` | คอนฟิกเฉพาะของ Plugin จาก `plugins.entries.<id>.config`                                    |
| `api.logger`             | `PluginLogger`            | logger แบบมีขอบเขต (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือช่วงเริ่มต้น/ตั้งค่าแบบเบาก่อนเข้า entry แบบเต็ม |
| `api.resolvePath(input)` | `(string) => string`      | resolve พาธโดยอิงกับรากของ Plugin                                                          |

## ที่เกี่ยวข้อง

- [SDK Overview](/th/plugins/sdk-overview) -- ข้อมูลอ้างอิง subpath
- [SDK Entry Points](/th/plugins/sdk-entrypoints) -- ตัวเลือกของ `definePluginEntry`
- [Plugin Internals](/th/plugins/architecture) -- โมเดลความสามารถและรีจิสทรี
