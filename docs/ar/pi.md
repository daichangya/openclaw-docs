---
read_when:
    - فهم تصميم تكامل Pi SDK في OpenClaw
    - تعديل دورة حياة جلسة الوكيل أو الأدوات أو ربط الموفّر من أجل Pi
summary: بنية تكامل وكيل Pi المضمّن في OpenClaw ودورة حياة الجلسة
title: بنية تكامل Pi
x-i18n:
    generated_at: "2026-04-25T13:51:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

تصف هذه الوثيقة كيف يندمج OpenClaw مع [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) وحزمها الشقيقة (`pi-ai` و`pi-agent-core` و`pi-tui`) لتشغيل قدرات الوكيل الذكي الخاصة به.

## نظرة عامة

يستخدم OpenClaw حزمة pi SDK لدمج وكيل برمجة ذكي داخل بنية gateway الخاصة بالمراسلة. وبدلًا من تشغيل pi كعملية فرعية أو استخدام وضع RPC، يقوم OpenClaw مباشرة باستيراد `AgentSession` من pi وإنشائها عبر `createAgentSession()`. ويوفر هذا النهج المضمّن ما يلي:

- تحكم كامل في دورة حياة الجلسة ومعالجة الأحداث
- حقن أدوات مخصصة (المراسلة، وsandbox، والإجراءات الخاصة بالقنوات)
- تخصيص system prompt لكل قناة/سياق
- حفظ الجلسات مع دعم branching/Compaction
- تدوير ملفات auth profile متعددة الحسابات مع failover
- تبديل النماذج بشكل مستقل عن الموفّر

## تبعيات الحزم

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| الحزمة            | الغرض                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | تجريدات LLM الأساسية: `Model` و`streamSimple` وأنواع الرسائل وواجهات API الخاصة بالموفّرين            |
| `pi-agent-core`   | حلقة الوكيل، وتنفيذ الأدوات، وأنواع `AgentMessage`                                                    |
| `pi-coding-agent` | SDK عالية المستوى: `createAgentSession` و`SessionManager` و`AuthStorage` و`ModelRegistry` والأدوات المدمجة |
| `pi-tui`          | مكوّنات UI الخاصة بالطرفية (تُستخدم في وضع TUI المحلي في OpenClaw)                                   |

## بنية الملفات

```
src/agents/
├── pi-embedded-runner.ts          # إعادة تصدير من pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # نقطة الدخول الرئيسية: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # منطق المحاولة الواحدة مع إعداد الجلسة
│   │   ├── params.ts              # النوع RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # بناء حمولات الاستجابة من نتائج التشغيل
│   │   ├── images.ts              # حقن الصور في نماذج الرؤية
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # اكتشاف أخطاء الإلغاء
│   ├── cache-ttl.ts               # تتبع TTL للذاكرة المؤقتة من أجل تقليم السياق
│   ├── compact.ts                 # منطق Compaction اليدوي/التلقائي
│   ├── extensions.ts              # تحميل امتدادات pi للتشغيلات المضمّنة
│   ├── extra-params.ts            # معاملات stream الخاصة بالموفّر
│   ├── google.ts                  # إصلاحات ترتيب الأدوار لـ Google/Gemini
│   ├── history.ts                 # تحديد السجل (DM مقابل المجموعة)
│   ├── lanes.ts                   # مسارات أوامر الجلسة/العالمية
│   ├── logger.ts                  # مسجل النظام الفرعي
│   ├── model.ts                   # حل النموذج عبر ModelRegistry
│   ├── runs.ts                    # تتبع التشغيلات النشطة، والإلغاء، والصف
│   ├── sandbox-info.ts            # معلومات sandbox من أجل system prompt
│   ├── session-manager-cache.ts   # تخزين مثيلات SessionManager مؤقتًا
│   ├── session-manager-init.ts    # تهيئة ملف الجلسة
│   ├── system-prompt.ts           # باني system prompt
│   ├── tool-split.ts              # تقسيم الأدوات إلى builtIn وcustom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ربط ThinkLevel، ووصف الأخطاء
├── pi-embedded-subscribe.ts       # الاشتراك في أحداث الجلسة/إرسالها
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # مصنع معالجات الأحداث
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # تقسيم ردود البث إلى كتل
├── pi-embedded-messaging.ts       # تتبع الرسائل المرسلة عبر أداة المراسلة
├── pi-embedded-helpers.ts         # تصنيف الأخطاء، والتحقق من الدورة
├── pi-embedded-helpers/           # وحدات مساعدة
├── pi-embedded-utils.ts           # أدوات تنسيق
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # تغليف AbortSignal للأدوات
├── pi-tools.policy.ts             # سياسة allowlist/denylist للأدوات
├── pi-tools.read.ts               # تخصيصات أداة القراءة
├── pi-tools.schema.ts             # تطبيع schema للأدوات
├── pi-tools.types.ts              # الاسم البديل للنوع AnyAgentTool
├── pi-tool-definition-adapter.ts  # المحول AgentTool -> ToolDefinition
├── pi-settings.ts                 # تجاوزات الإعدادات
├── pi-hooks/                      # hooks مخصصة لـ pi
│   ├── compaction-safeguard.ts    # امتداد الحماية
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # امتداد تقليم السياق وفق Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # حل auth profile
├── auth-profiles.ts               # مخزن الملفات، والتبريد، وfailover
├── model-selection.ts             # حل النموذج الافتراضي
├── models-config.ts               # توليد models.json
├── model-catalog.ts               # ذاكرة مؤقتة لفهرس النماذج
├── context-window-guard.ts        # التحقق من نافذة السياق
├── failover-error.ts              # الصنف FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # حل معاملات system prompt
├── system-prompt-report.ts        # توليد تقرير تصحيح الأخطاء
├── tool-summaries.ts              # ملخصات وصف الأدوات
├── tool-policy.ts                 # حل سياسة الأداة
├── transcript-policy.ts           # سياسة التحقق من transcript
├── skills.ts                      # لقطة Skills / بناء prompt
├── skills/                        # نظام Skills الفرعي
├── sandbox.ts                     # حل سياق sandbox
├── sandbox/                       # نظام sandbox الفرعي
├── channel-tools.ts               # حقن الأدوات الخاصة بالقنوات
├── openclaw-tools.ts              # أدوات خاصة بـ OpenClaw
├── bash-tools.ts                  # أدوات exec/process
├── apply-patch.ts                 # أداة apply_patch ‏(OpenAI)
├── tools/                         # تنفيذات الأدوات الفردية
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

توجد الآن بيئات تشغيل إجراءات الرسائل الخاصة بالقنوات ضمن
أدلة الامتدادات المملوكة لـ Plugin بدلًا من `src/agents/tools`، على سبيل المثال:

- ملفات runtime الخاصة بإجراءات Plugin لـ Discord
- ملف runtime الخاص بإجراءات Plugin لـ Slack
- ملف runtime الخاص بإجراءات Plugin لـ Telegram
- ملف runtime الخاص بإجراءات Plugin لـ WhatsApp

## تدفق التكامل الأساسي

### 1. تشغيل وكيل مضمّن

نقطة الدخول الرئيسية هي `runEmbeddedPiAgent()` في `pi-embedded-runner/run.ts`:

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

### 2. إنشاء الجلسة

داخل `runEmbeddedAttempt()` (التي تستدعيها `runEmbeddedPiAgent()`)، تُستخدم pi SDK:

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

### 3. الاشتراك في الأحداث

تشترك `subscribeEmbeddedPiSession()` في أحداث `AgentSession` الخاصة بـ pi:

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

تشمل الأحداث التي تتم معالجتها:

- `message_start` / `message_end` / `message_update` ‏(النص/التفكير المتدفق)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. إرسال prompt

بعد الإعداد، تُرسل prompt إلى الجلسة:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

تتولى SDK حلقة الوكيل الكاملة: الإرسال إلى LLM، وتنفيذ استدعاءات الأدوات، وبث الاستجابات.

يكون حقن الصور محليًا بالنسبة إلى prompt: إذ يحمّل OpenClaw مراجع الصور من prompt الحالية
ويمررها عبر `images` لتلك الدورة فقط. وهو لا يعيد فحص الأدوار الأقدم في السجل
لإعادة حقن حمولات الصور.

## بنية الأدوات

### خط أنابيب الأدوات

1. **الأدوات الأساسية**: ‏`codingTools` الخاصة بـ pi ‏(`read`, `bash`, `edit`, `write`)
2. **استبدالات مخصصة**: يستبدل OpenClaw `bash` بـ `exec`/`process`، ويخصص `read`/`edit`/`write` من أجل sandbox
3. **أدوات OpenClaw**: المراسلة، والمتصفح، وcanvas، والجلسات، وCron، وGateway، وغير ذلك
4. **أدوات القنوات**: أدوات إجراءات خاصة بـ Discord/Telegram/Slack/WhatsApp
5. **تصفية السياسات**: تُصفّى الأدوات حسب الملف الشخصي، والموفّر، والوكيل، والمجموعة، وسياسات sandbox
6. **تطبيع Schema**: تُنظَّف الـ schema لمعالجة خصوصيات Gemini/OpenAI
7. **تغليف AbortSignal**: تُغلَّف الأدوات لاحترام إشارات الإلغاء

### محول تعريف الأداة

يمتلك `AgentTool` في pi-agent-core توقيع `execute` مختلفًا عن `ToolDefinition` في pi-coding-agent. ويقوم المحول في `pi-tool-definition-adapter.ts` بربطهما:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // يختلف توقيع pi-coding-agent عن pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### استراتيجية تقسيم الأدوات

تقوم `splitSdkTools()` بتمرير جميع الأدوات عبر `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // فارغة. نحن نستبدل كل شيء
    customTools: toToolDefinitions(options.tools),
  };
}
```

وهذا يضمن بقاء تصفية السياسات في OpenClaw، وتكامل sandbox، ومجموعة الأدوات الموسعة متسقة عبر الموفّرين.

## بناء system prompt

يتم بناء system prompt في `buildAgentSystemPrompt()` ‏(`system-prompt.ts`). وهو يجمع prompt كاملة تتضمن أقسامًا مثل Tooling، وTool Call Style، ووسائل الحماية الأمنية، ومرجع OpenClaw CLI، وSkills، وDocs، وWorkspace، وSandbox، وMessaging، وReply Tags، وVoice، وSilent Replies، وHeartbeats، وبيانات runtime الوصفية، بالإضافة إلى Memory وReactions عند تمكينهما، وكذلك ملفات السياق الاختيارية ومحتوى system prompt الإضافي. ويتم تقليم الأقسام في وضع prompt الأدنى المستخدم من قبل الوكلاء الفرعيين.

تُطبَّق prompt على الجلسة بعد إنشائها عبر `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## إدارة الجلسات

### ملفات الجلسات

الجلسات هي ملفات JSONL ذات بنية شجرية (ربط id/parentId). ويتولى `SessionManager` في Pi عملية الحفظ:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

يلف OpenClaw ذلك بواسطة `guardSessionManager()` من أجل أمان نتائج الأدوات.

### التخزين المؤقت للجلسات

يقوم `session-manager-cache.ts` بتخزين مثيلات SessionManager مؤقتًا لتجنب تحليل الملفات مرارًا:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### تحديد السجل

يقوم `limitHistoryTurns()` بقص سجل المحادثة استنادًا إلى نوع القناة (DM مقابل المجموعة).

### Compaction

يتم تشغيل Compaction التلقائية عند تجاوز السياق. وتشمل
تواقيع التجاوز الشائعة
`request_too_large` و`context length exceeded` و`input exceeds the
maximum number of tokens` و`input token count exceeds the maximum number of
input tokens` و`input is too long for the model` و`ollama error: context
length exceeded`. ويتولى `compactEmbeddedPiSessionDirect()` التعامل مع
Compaction اليدوية:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## المصادقة وحل النموذج

### Auth profiles

يحتفظ OpenClaw بمخزن auth profile مع عدة مفاتيح API لكل موفّر:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

تدور الملفات الشخصية عند الفشل مع تتبع فترة التبريد:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### حل النموذج

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// يستخدم ModelRegistry وAuthStorage الخاصة بـ pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

يؤدي `FailoverError` إلى تشغيل fallback للنموذج عند تهيئته:

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

## امتدادات Pi

يحمّل OpenClaw امتدادات Pi مخصصة لسلوكيات متخصصة:

### حماية Compaction

يضيف `src/agents/pi-hooks/compaction-safeguard.ts` وسائل حماية إلى Compaction، بما في ذلك ميزانية الرموز التكيفية بالإضافة إلى ملخصات فشل الأدوات وعمليات الملفات:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### تقليم السياق

ينفذ `src/agents/pi-hooks/context-pruning.ts` تقليم السياق المعتمد على Cache-TTL:

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

## البث والردود الكتلية

### التقسيم إلى كتل

يتولى `EmbeddedBlockChunker` إدارة بث النص إلى كتل رد منفصلة:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### تجريد وسوم التفكير/النهائي

تتم معالجة الخرج المتدفق لتجريد كتل `<think>`/`<thinking>` واستخراج محتوى `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // تجريد محتوى <think>...</think>
  // إذا كانت enforceFinalTag، فأعد فقط محتوى <final>...</final>
};
```

### توجيهات الرد

تُحلَّل توجيهات الرد مثل `[[media:url]]` و`[[voice]]` و`[[reply:id]]` وتُستخرج:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## معالجة الأخطاء

### تصنيف الأخطاء

يقوم `pi-embedded-helpers.ts` بتصنيف الأخطاء للتعامل المناسب معها:

```typescript
isContextOverflowError(errorText)     // السياق كبير جدًا
isCompactionFailureError(errorText)   // فشلت Compaction
isAuthAssistantError(lastAssistant)   // فشل auth
isRateLimitAssistantError(...)        // تم تقييد المعدل
isFailoverAssistantError(...)         // ينبغي تشغيل failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### fallback لمستوى التفكير

إذا كان مستوى التفكير غير مدعوم، فيتم الرجوع إلى fallback:

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

## تكامل sandbox

عند تمكين وضع sandbox، يتم تقييد الأدوات والمسارات:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // استخدام أدوات read/edit/write داخل sandbox
  // تشغيل Exec داخل الحاوية
  // استخدام المتصفح bridge URL
}
```

## المعالجة الخاصة بالموفّر

### Anthropic

- تنظيف سلسلة الرفض السحرية
- التحقق من الأدوار المتتالية لكل دورة
- التحقق الصارم من معاملات أدوات Pi upstream

### Google/Gemini

- تنظيف schema الأداة المملوكة لـ Plugin

### OpenAI

- أداة `apply_patch` لنماذج Codex
- التعامل مع خفض مستوى التفكير

## تكامل TUI

يحتوي OpenClaw أيضًا على وضع TUI محلي يستخدم مكونات pi-tui مباشرة:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

ويوفّر ذلك تجربة طرفية تفاعلية مشابهة للوضع الأصلي في Pi.

## الفروق الرئيسية عن Pi CLI

| الجانب           | Pi CLI                  | OpenClaw المضمّن                                                                            |
| ---------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| الاستدعاء        | أمر `pi` / ‏RPC         | SDK عبر `createAgentSession()`                                                               |
| الأدوات          | أدوات البرمجة الافتراضية | مجموعة أدوات OpenClaw مخصصة                                                                  |
| system prompt    | `AGENTS.md` + prompts   | ديناميكية بحسب القناة/السياق                                                                 |
| تخزين الجلسات    | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (أو `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| auth             | بيانات اعتماد واحدة     | ملفات متعددة مع تدوير                                                                         |
| الامتدادات       | تُحمّل من القرص         | برمجيًا + مسارات على القرص                                                                    |
| معالجة الأحداث   | عرض TUI                 | قائمة على callbacks ‏(`onBlockReply` وغيرها)                                                |

## اعتبارات مستقبلية

مجالات قد تحتاج إلى إعادة صياغة:

1. **محاذاة توقيع الأداة**: يتم حاليًا التكيّف بين توقيعات pi-agent-core وpi-coding-agent
2. **تغليف مدير الجلسات**: تضيف `guardSessionManager` أمانًا لكنها تزيد التعقيد
3. **تحميل الامتدادات**: يمكن استخدام `ResourceLoader` الخاصة بـ Pi بشكل مباشر أكثر
4. **تعقيد معالج البث**: كبرت `subscribeEmbeddedPiSession` كثيرًا
5. **خصوصيات الموفّرين**: توجد مسارات شيفرة كثيرة خاصة بالموفّرين قد تتمكن Pi من التعامل معها لاحقًا

## الاختبارات

تمتد تغطية تكامل Pi عبر هذه المجموعات:

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

مباشر/اختياري:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` ‏(فعّل `OPENCLAW_LIVE_TEST=1`)

للاطلاع على أوامر التشغيل الحالية، راجع [سير عمل تطوير Pi](/ar/pi-dev).

## ذو صلة

- [سير عمل تطوير Pi](/ar/pi-dev)
- [نظرة عامة على التثبيت](/ar/install)
