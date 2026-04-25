---
read_when:
    - أنت بحاجة إلى استدعاء مساعدات core من داخل Plugin (TTS، وSTT، وإنشاء الصور، والبحث على الويب، وsubagent، وnodes)
    - أنت تريد أن تفهم ما الذي يكشفه `api.runtime`
    - أنت تصل إلى مساعدات config أو الوكيل أو الوسائط من كود Plugin
sidebarTitle: Runtime Helpers
summary: '`api.runtime` -- مساعدات runtime المحقونة المتاحة لـ Plugins'
title: مساعدات runtime الخاصة بـ Plugin
x-i18n:
    generated_at: "2026-04-25T13:55:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

مرجع الكائن `api.runtime` المحقون في كل Plugin أثناء
التسجيل. استخدم هذه المساعدات بدلًا من استيراد مكوّنات المضيف الداخلية مباشرة.

<Tip>
  **هل تبحث عن شرح عملي؟** راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  أو [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة
  تُظهر هذه المساعدات في سياقها.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## مساحات أسماء Runtime

### `api.runtime.agent`

هوية الوكيل، والأدلة، وإدارة الجلسات.

```typescript
// حل دليل عمل الوكيل
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// حل مساحة عمل الوكيل
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// احصل على هوية الوكيل
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// احصل على مستوى thinking الافتراضي
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// احصل على مهلة الوكيل
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// تأكد من وجود مساحة العمل
await api.runtime.agent.ensureAgentWorkspace(cfg);

// شغّل دور وكيل مضمن
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

يُعد `runEmbeddedAgent(...)` المساعد المحايد لبدء دور وكيل OpenClaw
عادي من كود Plugin. وهو يستخدم حل المزوّد/النموذج نفسه واختيار
agent-harness نفسه كما في الردود التي تشغّلها القنوات.

ويظل `runEmbeddedPiAgent(...)` اسمًا مستعارًا للتوافق.

**مساعدات مخزن الجلسة** موجودة تحت `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

ثوابت النموذج والمزوّد الافتراضية:

```typescript
const model = api.runtime.agent.defaults.model; // مثل "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // مثل "anthropic"
```

### `api.runtime.subagent`

تشغيل وإدارة عمليات subagent الخلفية.

```typescript
// ابدأ تشغيل subagent
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // تجاوز اختياري
  model: "gpt-4.1-mini", // تجاوز اختياري
  deliver: false,
});

// انتظر الاكتمال
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// اقرأ رسائل الجلسة
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// احذف جلسة
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  تتطلب تجاوزات النموذج (`provider`/`model`) اشتراكًا صريحًا من المشغّل عبر
  `plugins.entries.<id>.subagent.allowModelOverride: true` في التهيئة.
  ولا تزال Plugins غير الموثوقة قادرة على تشغيل subagents، لكن طلبات التجاوز تُرفض.
</Warning>

### `api.runtime.nodes`

إدراج العُقد المتصلة واستدعاء أمر مستضاف على العقدة من كود Plugin
المحمّل عبر Gateway أو من أوامر CLI الخاصة بـ Plugin. استخدم هذا عندما يملك Plugin عملاً محليًا على
جهاز مقترن، مثل جسر متصفح أو صوت على جهاز Mac آخر.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

داخل Gateway، تكون هذه البيئة داخل العملية. وفي أوامر CLI الخاصة بـ Plugin، تستدعي
Gateway المهيأ عبر RPC، بحيث تتمكن أوامر مثل `openclaw googlemeet
recover-tab` من فحص العُقد المقترنة من الطرفية. ولا تزال أوامر العقدة تمر
عبر pairing العادي للعقدة في Gateway، وقوائم سماح الأوامر، ومعالجة الأوامر المحلية للعقدة.

### `api.runtime.taskFlow`

اربط وقت تشغيل TaskFlow بمفتاح جلسة OpenClaw موجود أو بسياق أداة موثوق،
ثم أنشئ Task Flows وأدرها من دون تمرير مالك في كل استدعاء.

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

استخدم `bindSession({ sessionKey, requesterOrigin })` عندما يكون لديك بالفعل
مفتاح جلسة OpenClaw موثوق من طبقة الربط الخاصة بك. ولا تربط انطلاقًا من إدخال مستخدم خام.

### `api.runtime.tts`

تحويل النص إلى كلام.

```typescript
// TTS قياسي
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// TTS محسّن للهاتف
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// اعرض الأصوات المتاحة
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

يستخدم التهيئة الأساسية `messages.tts` واختيار المزوّد. ويعيد مخزنًا مؤقتًا
لصوت PCM + معدل العينة.

### `api.runtime.mediaUnderstanding`

تحليل الصور والصوت والفيديو.

```typescript
// صف صورة
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// نسخ صوتي
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // اختياري، عندما لا يمكن استنتاج MIME
});

// صف فيديو
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// تحليل ملف عام
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

يعيد `{ text: undefined }` عندما لا يتم إنتاج أي مخرجات (مثل الإدخال المتخطى).

<Info>
  يظل `api.runtime.stt.transcribeAudioFile(...)` اسمًا مستعارًا للتوافق
  لـ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

إنشاء الصور.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

البحث على الويب.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

أدوات وسائط منخفضة المستوى.

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

تحميل config وكتابته.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

أدوات على مستوى النظام.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

اشتراكات الأحداث.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

التسجيل.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

حل مصادقة النموذج والمزوّد.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

حل دليل الحالة.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

مصانع أدوات الذاكرة وCLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

مساعدات runtime خاصة بالقناة (متاحة عند تحميل Plugin قناة).

يمثل `api.runtime.channel.mentions` سطح سياسة mentions الواردة المشترك
لـ Plugins القنوات المضمنة التي تستخدم حقن runtime:

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

مساعدات mentions المتاحة:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

لا يكشف `api.runtime.channel.mentions` عمدًا عن مساعدات التوافق الأقدم
`resolveMentionGating*`. وفضّل المسار المطبّع
`{ facts, policy }`.

## تخزين مراجع runtime

استخدم `createPluginRuntimeStore` لتخزين مرجع runtime من أجل استخدامه خارج
callback الخاص بـ `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// في نقطة الإدخال الخاصة بك
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// في ملفات أخرى
export function getRuntime() {
  return store.getRuntime(); // يرمي خطأ إذا لم تتم التهيئة
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // يعيد null إذا لم تتم التهيئة
}
```

فضّل `pluginId` لهوية runtime-store. أما الصيغة منخفضة المستوى `key` فهي
مخصصة للحالات غير الشائعة التي يحتاج فيها Plugin واحد عمدًا إلى أكثر من فتحة runtime
واحدة.

## حقول `api` الأخرى في المستوى الأعلى

إلى جانب `api.runtime`، يوفّر كائن API أيضًا:

| الحقل                    | النوع                     | الوصف                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | معرّف Plugin                                                                               |
| `api.name`               | `string`                  | اسم العرض الخاص بـ Plugin                                                                  |
| `api.config`             | `OpenClawConfig`          | لقطة config الحالية (لقطة runtime داخل الذاكرة النشطة عند توفرها)                         |
| `api.pluginConfig`       | `Record<string, unknown>` | config الخاصة بـ Plugin من `plugins.entries.<id>.config`                                   |
| `api.logger`             | `PluginLogger`            | مسجّل ذو نطاق محدد (`debug` و`info` و`warn` و`error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ وتمثل `"setup-runtime"` نافذة startup/setup الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل مسار نسبةً إلى جذر Plugin                                                               |

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع المسارات الفرعية
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry`
- [المكوّنات الداخلية لـ Plugin](/ar/plugins/architecture) — نموذج القدرات والسجل
