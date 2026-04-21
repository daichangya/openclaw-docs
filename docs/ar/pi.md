---
read_when:
    - فهم تصميم تكامل Pi SDK في OpenClaw
    - تعديل دورة حياة جلسة العامل، أو الأدوات، أو ربط الموفّر لـ Pi
summary: بنية تكامل عامل Pi المضمّن في OpenClaw ودورة حياة الجلسة
title: بنية تكامل Pi
x-i18n:
    generated_at: "2026-04-21T07:22:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ece62eb1459e8a861610c8502f2b3bf5172500207df5e78f4abe7a2a416a47fc
    source_path: pi.md
    workflow: 15
---

# بنية تكامل Pi

يصف هذا المستند كيف يدمج OpenClaw مع [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) والحزم الشقيقة له (`pi-ai` و`pi-agent-core` و`pi-tui`) لتشغيل قدرات عامل الذكاء الاصطناعي فيه.

## نظرة عامة

يستخدم OpenClaw حزمة pi SDK لتضمين عامل برمجة بالذكاء الاصطناعي داخل بنية gateway الخاصة بالمراسلة. وبدلًا من تشغيل pi كعملية فرعية أو استخدام وضع RPC، يقوم OpenClaw مباشرة باستيراد `AgentSession` الخاص بـ pi وإنشائه عبر `createAgentSession()`. ويوفر هذا النهج المضمّن ما يلي:

- تحكم كامل في دورة حياة الجلسة ومعالجة الأحداث
- حقن أدوات مخصصة (المراسلة، وsandbox، والإجراءات الخاصة بكل قناة)
- تخصيص موجّه النظام لكل قناة/سياق
- استمرارية الجلسة مع دعم التفرع وCompaction
- تدوير ملفات تعريف المصادقة متعددة الحسابات مع الرجوع الاحتياطي
- تبديل النماذج بشكل مستقل عن الموفّر

## تبعيات الحزم

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| الحزمة            | الغرض                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | تجريدات LLM الأساسية: `Model`، و`streamSimple`، وأنواع الرسائل، وواجهات API الخاصة بالموفّر               |
| `pi-agent-core`   | حلقة العامل، وتنفيذ الأدوات، وأنواع `AgentMessage`                                                          |
| `pi-coding-agent` | SDK عالي المستوى: `createAgentSession`، و`SessionManager`، و`AuthStorage`، و`ModelRegistry`، والأدوات المضمّنة |
| `pi-tui`          | مكونات واجهة الطرفية (تُستخدم في وضع TUI المحلي في OpenClaw)                                              |

## بنية الملفات

```
src/agents/
├── pi-embedded-runner.ts          # إعادة تصدير من pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # نقطة الإدخال الرئيسية: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # منطق المحاولة الواحدة مع إعداد الجلسة
│   │   ├── params.ts              # نوع RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # بناء حمولات الاستجابة من نتائج التشغيل
│   │   ├── images.ts              # حقن صور نموذج الرؤية
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # اكتشاف خطأ الإلغاء
│   ├── cache-ttl.ts               # تتبع Cache TTL لتقليم السياق
│   ├── compact.ts                 # منطق Compaction اليدوي/التلقائي
│   ├── extensions.ts              # تحميل امتدادات pi للتشغيلات المضمّنة
│   ├── extra-params.ts            # معاملات البث الخاصة بالموفّر
│   ├── google.ts                  # إصلاحات ترتيب الأدوار لـ Google/Gemini
│   ├── history.ts                 # تحديد السجل (رسائل مباشرة مقابل مجموعة)
│   ├── lanes.ts                   # مسارات الأوامر الخاصة بالجلسة/العامة
│   ├── logger.ts                  # مسجل النظام الفرعي
│   ├── model.ts                   # حل النموذج عبر ModelRegistry
│   ├── runs.ts                    # تتبع التشغيلات النشطة، والإلغاء، والطابور
│   ├── sandbox-info.ts            # معلومات sandbox لموجّه النظام
│   ├── session-manager-cache.ts   # تخزين مؤقت لمثيلات SessionManager
│   ├── session-manager-init.ts    # تهيئة ملف الجلسة
│   ├── system-prompt.ts           # باني موجّه النظام
│   ├── tool-split.ts              # تقسيم الأدوات إلى builtIn مقابل custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # تعيين ThinkLevel، ووصف الأخطاء
├── pi-embedded-subscribe.ts       # اشتراك/توزيع أحداث الجلسة
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # مصنع معالجات الأحداث
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # تقسيم ردود الكتل المتدفقة
├── pi-embedded-messaging.ts       # تتبع الإرسال بواسطة أداة المراسلة
├── pi-embedded-helpers.ts         # تصنيف الأخطاء، والتحقق من الدور
├── pi-embedded-helpers/           # وحدات المساعدة
├── pi-embedded-utils.ts           # أدوات التنسيق
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # تغليف AbortSignal للأدوات
├── pi-tools.policy.ts             # سياسة قائمة السماح/المنع للأدوات
├── pi-tools.read.ts               # تخصيصات أداة القراءة
├── pi-tools.schema.ts             # تطبيع مخطط الأدوات
├── pi-tools.types.ts              # الاسم المستعار للنوع AnyAgentTool
├── pi-tool-definition-adapter.ts  # محوّل AgentTool -> ToolDefinition
├── pi-settings.ts                 # تجاوزات الإعدادات
├── pi-hooks/                      # خطافات pi المخصصة
│   ├── compaction-safeguard.ts    # امتداد الحماية
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # امتداد تقليم السياق لـ Cache TTL
│   └── context-pruning/
├── model-auth.ts                  # حل ملف تعريف المصادقة
├── auth-profiles.ts               # مخزن ملفات التعريف، والتهدئة، والرجوع الاحتياطي
├── model-selection.ts             # حل النموذج الافتراضي
├── models-config.ts               # توليد models.json
├── model-catalog.ts               # تخزين مؤقت لفهرس النماذج
├── context-window-guard.ts        # التحقق من نافذة السياق
├── failover-error.ts              # الصنف FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # حل معاملات موجّه النظام
├── system-prompt-report.ts        # توليد تقرير تصحيح
├── tool-summaries.ts              # ملخصات وصف الأدوات
├── tool-policy.ts                 # حل سياسة الأدوات
├── transcript-policy.ts           # سياسة التحقق من النص
├── skills.ts                      # بناء لقطة/mوجّه Skills
├── skills/                        # النظام الفرعي Skills
├── sandbox.ts                     # حل سياق sandbox
├── sandbox/                       # النظام الفرعي sandbox
├── channel-tools.ts               # حقن الأدوات الخاصة بالقناة
├── openclaw-tools.ts              # الأدوات الخاصة بـ OpenClaw
├── bash-tools.ts                  # أدوات exec/process
├── apply-patch.ts                 # أداة apply_patch (OpenAI)
├── tools/                         # تطبيقات الأدوات الفردية
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

أصبحت بيئات تشغيل إجراءات الرسائل الخاصة بكل قناة موجودة الآن داخل
مجلدات الامتداد المملوكة من Plugin بدلًا من وجودها تحت `src/agents/tools`، على سبيل المثال:

- ملفات بيئة تشغيل إجراءات Plugin الخاص بـ Discord
- ملف بيئة تشغيل إجراء Plugin الخاص بـ Slack
- ملف بيئة تشغيل إجراء Plugin الخاص بـ Telegram
- ملف بيئة تشغيل إجراء Plugin الخاص بـ WhatsApp

## تدفق التكامل الأساسي

### 1. تشغيل عامل مضمّن

نقطة الإدخال الرئيسية هي `runEmbeddedPiAgent()` في `pi-embedded-runner/run.ts`:

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

داخل `runEmbeddedAttempt()` (التي تستدعيها `runEmbeddedPiAgent()`)، تُستخدم حزمة pi SDK:

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

تقوم `subscribeEmbeddedPiSession()` بالاشتراك في أحداث `AgentSession` الخاصة بـ pi:

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

تشمل الأحداث المُعالَجة ما يلي:

- `message_start` / `message_end` / `message_update` (بث النص/التفكير)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. إرسال الموجّه

بعد الإعداد، يُرسل الموجّه إلى الجلسة:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

تتعامل SDK مع حلقة العامل الكاملة: الإرسال إلى LLM، وتنفيذ استدعاءات الأدوات، وبث الاستجابات.

حقن الصور محلي بالنسبة إلى الموجّه: يقوم OpenClaw بتحميل مراجع الصور من الموجّه الحالي و
يمررها عبر `images` لتلك الدورة فقط. وهو لا يعيد فحص الدورات الأقدم في السجل
لإعادة حقن حمولات الصور.

## بنية الأدوات

### خط معالجة الأدوات

1. **الأدوات الأساسية**: ‏`codingTools` الخاصة بـ pi ‏(`read`, `bash`, `edit`, `write`)
2. **البدائل المخصصة**: يستبدل OpenClaw ‏`bash` بـ `exec`/`process`، ويخصص read/edit/write لأجل sandbox
3. **أدوات OpenClaw**: المراسلة، والمتصفح، وcanvas، والجلسات، وcron، وgateway، وغير ذلك
4. **أدوات القنوات**: أدوات الإجراءات الخاصة بـ Discord/Telegram/Slack/WhatsApp
5. **تصفية السياسات**: تُصفّى الأدوات حسب ملفات التعريف، والموفّر، والعامل، والمجموعة، وسياسات sandbox
6. **تطبيع المخطط**: تُنظَّف المخططات لمعالجة خصائص Gemini/OpenAI
7. **تغليف AbortSignal**: تُغلَّف الأدوات لاحترام إشارات الإلغاء

### محوّل تعريف الأداة

يحتوي `AgentTool` في pi-agent-core على توقيع `execute` مختلف عن `ToolDefinition` في pi-coding-agent. ويجسر المحوّل في `pi-tool-definition-adapter.ts` هذه الفجوة:

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

### استراتيجية تقسيم الأدوات

تقوم `splitSdkTools()` بتمرير جميع الأدوات عبر `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

وهذا يضمن بقاء تصفية السياسات في OpenClaw، وتكامل sandbox، ومجموعة الأدوات الموسعة متسقة عبر الموفّرين.

## بناء موجّه النظام

يُبنى موجّه النظام في `buildAgentSystemPrompt()` (`system-prompt.ts`). إذ يجمع موجّهًا كاملًا يضم أقسامًا تشمل الأدوات، وأسلوب استدعاء الأدوات، وضوابط الأمان، ومرجع CLI الخاص بـ OpenClaw، وSkills، والمستندات، ومساحة العمل، وSandbox، والمراسلة، ووسوم الرد، والصوت، والردود الصامتة، وHeartbeats، وبيانات وقت التشغيل الوصفية، بالإضافة إلى الذاكرة وReactions عند تفعيلهما، وكذلك ملفات السياق الاختيارية ومحتوى موجّه النظام الإضافي. وتُقص هذه الأقسام لاستخدام وضع الموجّه الأدنى المستخدم بواسطة العاملات الفرعيات.

يُطبّق الموجّه بعد إنشاء الجلسة عبر `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## إدارة الجلسة

### ملفات الجلسة

الجلسات هي ملفات JSONL ذات بنية شجرية (روابط id/parentId). ويتولى `SessionManager` الخاص بـ Pi الاستمرارية:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

ويغلّف OpenClaw ذلك عبر `guardSessionManager()` لأمان نتائج الأدوات.

### التخزين المؤقت للجلسات

يقوم `session-manager-cache.ts` بتخزين مثيلات SessionManager مؤقتًا لتجنب تحليل الملفات بشكل متكرر:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### تحديد السجل

تقوم `limitHistoryTurns()` بقص سجل المحادثة بناءً على نوع القناة (رسالة مباشرة مقابل مجموعة).

### Compaction

يُفعَّل Compaction التلقائي عند تجاوز السياق. وتشمل
أنماط تجاوز السياق الشائعة
`request_too_large`، و`context length exceeded`، و`input exceeds the
maximum number of tokens`، و`input token count exceeds the maximum number of
input tokens`، و`input is too long for the model`، و`ollama error: context
length exceeded`. ويتولى `compactEmbeddedPiSessionDirect()` تنفيذ
Compaction اليدوي:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## المصادقة وحل النموذج

### ملفات تعريف المصادقة

يحافظ OpenClaw على مخزن لملفات تعريف المصادقة مع عدة مفاتيح API لكل موفّر:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

وتُدوَّر ملفات التعريف عند الإخفاقات مع تتبع التهدئة:

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

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### الرجوع الاحتياطي

يؤدي `FailoverError` إلى تشغيل الرجوع الاحتياطي للنموذج عند تكوينه:

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

يقوم OpenClaw بتحميل امتدادات Pi مخصصة لسلوكيات متخصصة:

### حماية Compaction

يضيف `src/agents/pi-hooks/compaction-safeguard.ts` ضوابط حماية إلى Compaction، بما في ذلك الميزانية التكيفية للرموز بالإضافة إلى ملخصات إخفاقات الأدوات وعمليات الملفات:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### تقليم السياق

ينفذ `src/agents/pi-hooks/context-pruning.ts` تقليم السياق المعتمد على Cache TTL:

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

## البث وردود الكتل

### تقطيع الكتل

يتولى `EmbeddedBlockChunker` إدارة النص المتدفق إلى كتل رد منفصلة:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### إزالة وسوم التفكير/النهائي

تُعالج المخرجات المتدفقة لإزالة كتل `<think>`/`<thinking>` واستخراج محتوى `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### توجيهات الرد

تُحلل توجيهات الرد مثل `[[media:url]]`، و`[[voice]]`، و`[[reply:id]]` وتُستخرج:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## معالجة الأخطاء

### تصنيف الأخطاء

يقوم `pi-embedded-helpers.ts` بتصنيف الأخطاء لمعالجتها بالشكل المناسب:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### الرجوع الاحتياطي لمستوى التفكير

إذا كان مستوى التفكير غير مدعوم، فسيتم الرجوع الاحتياطي:

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

## تكامل Sandbox

عند تفعيل وضع sandbox، تُقيَّد الأدوات والمسارات:

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

## المعالجة الخاصة بكل موفّر

### Anthropic

- تنظيف سلسلة الرفض السحرية
- التحقق من الدور عند تتابع الأدوار
- تحقق صارم من معاملات أدوات Pi في المنبع

### Google/Gemini

- تنقية مخطط الأدوات المملوكة من Plugin

### OpenAI

- أداة `apply_patch` لنماذج Codex
- معالجة خفض مستوى التفكير

## تكامل TUI

يحتوي OpenClaw أيضًا على وضع TUI محلي يستخدم مكونات pi-tui مباشرة:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

ويوفّر هذا تجربة طرفية تفاعلية مشابهة للوضع الأصلي في Pi.

## الفروق الأساسية عن Pi CLI

| الجانب          | Pi CLI                  | OpenClaw المضمّن                                                                              |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| الاستدعاء       | أمر `pi` / RPC          | SDK عبر `createAgentSession()`                                                                |
| الأدوات         | أدوات البرمجة الافتراضية | مجموعة أدوات OpenClaw المخصصة                                                                  |
| موجّه النظام    | AGENTS.md + prompts     | ديناميكي بحسب القناة/السياق                                                                   |
| تخزين الجلسات   | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (أو `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| المصادقة        | بيانات اعتماد واحدة      | عدة ملفات تعريف مع تدوير                                                                       |
| الامتدادات      | تُحمّل من القرص         | برمجيًا + مسارات قرص                                                                           |
| معالجة الأحداث  | عرض TUI                 | قائمة على callbacks ‏(`onBlockReply`، وما إلى ذلك)                                            |

## اعتبارات مستقبلية

مجالات يمكن إعادة العمل عليها لاحقًا:

1. **محاذاة توقيع الأدوات**: يوجد حاليًا تكييف بين توقيعات pi-agent-core وpi-coding-agent
2. **تغليف مدير الجلسة**: يضيف `guardSessionManager` أمانًا لكنه يزيد التعقيد
3. **تحميل الامتدادات**: يمكن استخدام `ResourceLoader` الخاص بـ Pi بشكل أكثر مباشرة
4. **تعقيد معالج البث**: أصبح `subscribeEmbeddedPiSession` كبيرًا
5. **خصائص الموفّرين**: توجد مسارات كود خاصة بكثير من الموفّرين ويمكن أن يتولاها Pi مستقبلًا

## الاختبارات

تغطي اختبارات تكامل Pi هذه المجموعات:

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

الاختبارات الحية/الاختيارية:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (فعّل `OPENCLAW_LIVE_TEST=1`)

للاطلاع على أوامر التشغيل الحالية، راجع [سير عمل تطوير Pi](/ar/pi-dev).
