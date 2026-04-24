---
read_when:
    - فهم تصميم تكامل Pi SDK في OpenClaw
    - تعديل دورة حياة جلسة الوكيل، والأدوات، أو توصيل المزوّد لـ Pi
summary: بنية تكامل وكيل Pi المضمّن في OpenClaw ودورة حياة الجلسة
title: بنية تكامل Pi
x-i18n:
    generated_at: "2026-04-24T15:21:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

تصف هذه الوثيقة كيف يدمج OpenClaw مع [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) والحزم الشقيقة له (`pi-ai` و`pi-agent-core` و`pi-tui`) لتشغيل قدرات وكيل الذكاء الاصطناعي لديه.

## نظرة عامة

يستخدم OpenClaw حزمة pi SDK لتضمين وكيل برمجة بالذكاء الاصطناعي داخل بنية Gateway الخاصة بالمراسلة. بدلًا من تشغيل pi كعملية فرعية أو استخدام وضع RPC، يستورد OpenClaw مباشرة `AgentSession` الخاصة بـ pi وينشئها عبر `createAgentSession()`. يوفّر هذا النهج المضمّن ما يلي:

- تحكم كامل في دورة حياة الجلسة ومعالجة الأحداث
- حقن أدوات مخصّصة (المراسلة، وsandbox، والإجراءات الخاصة بكل قناة)
- تخصيص موجّه النظام لكل قناة/سياق
- استمرارية الجلسة مع دعم التفرّع وCompaction
- تدوير ملفات تعريف المصادقة متعددة الحسابات مع تجاوز الفشل
- تبديل النماذج بشكل مستقل عن المزوّد

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
| `pi-ai`           | تجريدات LLM الأساسية: `Model` و`streamSimple` وأنواع الرسائل وواجهات برمجة المزوّدين                 |
| `pi-agent-core`   | حلقة الوكيل، وتنفيذ الأدوات، وأنواع `AgentMessage`                                                    |
| `pi-coding-agent` | حزمة SDK عالية المستوى: `createAgentSession` و`SessionManager` و`AuthStorage` و`ModelRegistry` والأدوات المضمّنة |
| `pi-tui`          | مكوّنات واجهة الطرفية (تُستخدم في وضع TUI المحلي في OpenClaw)                                        |

## بنية الملفات

```
src/agents/
├── pi-embedded-runner.ts          # إعادة تصدير من pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # نقطة الدخول الرئيسية: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # منطق المحاولة الواحدة مع إعداد الجلسة
│   │   ├── params.ts              # نوع RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # بناء حمولات الاستجابة من نتائج التشغيل
│   │   ├── images.ts              # حقن صور نموذج الرؤية
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # اكتشاف أخطاء الإلغاء
│   ├── cache-ttl.ts               # تتبّع Cache TTL لتقليم السياق
│   ├── compact.ts                 # منطق Compaction اليدوي/التلقائي
│   ├── extensions.ts              # تحميل امتدادات pi لعمليات التشغيل المضمّنة
│   ├── extra-params.ts            # معاملات تدفق خاصة بالمزوّد
│   ├── google.ts                  # إصلاحات ترتيب الأدوار لـ Google/Gemini
│   ├── history.ts                 # تحديد السجل (رسائل مباشرة مقابل مجموعة)
│   ├── lanes.ts                   # مسارات أوامر الجلسة/العالمية
│   ├── logger.ts                  # مسجل النظام الفرعي
│   ├── model.ts                   # حلّ النموذج عبر ModelRegistry
│   ├── runs.ts                    # تتبّع العمليات النشطة، والإلغاء، والطابور
│   ├── sandbox-info.ts            # معلومات sandbox لموجّه النظام
│   ├── session-manager-cache.ts   # التخزين المؤقت لمثيلات SessionManager
│   ├── session-manager-init.ts    # تهيئة ملف الجلسة
│   ├── system-prompt.ts           # باني موجّه النظام
│   ├── tool-split.ts              # تقسيم الأدوات إلى builtIn وcustom
│   ├── types.ts                   # EmbeddedPiAgentMeta وEmbeddedPiRunResult
│   └── utils.ts                   # تعيين ThinkLevel ووصف الخطأ
├── pi-embedded-subscribe.ts       # الاشتراك/التوزيع لأحداث الجلسة
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # مصنع معالجات الأحداث
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # تجزئة ردود الكتل المتدفقة
├── pi-embedded-messaging.ts       # تتبّع الإرسال لأداة المراسلة
├── pi-embedded-helpers.ts         # تصنيف الأخطاء والتحقق من الأدوار
├── pi-embedded-helpers/           # وحدات مساعدة
├── pi-embedded-utils.ts           # أدوات تنسيق
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # تغليف AbortSignal للأدوات
├── pi-tools.policy.ts             # سياسة قائمة السماح/المنع للأدوات
├── pi-tools.read.ts               # تخصيصات أداة القراءة
├── pi-tools.schema.ts             # توحيد مخطط الأدوات
├── pi-tools.types.ts              # الاسم المستعار للنوع AnyAgentTool
├── pi-tool-definition-adapter.ts  # موائم AgentTool -> ToolDefinition
├── pi-settings.ts                 # تجاوزات الإعدادات
├── pi-hooks/                      # خطافات pi مخصّصة
│   ├── compaction-safeguard.ts    # امتداد الحماية
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # امتداد تقليم السياق لـ Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # حلّ ملف تعريف المصادقة
├── auth-profiles.ts               # مخزن الملفات الشخصية، والتهدئة، وتجاوز الفشل
├── model-selection.ts             # حلّ النموذج الافتراضي
├── models-config.ts               # توليد models.json
├── model-catalog.ts               # ذاكرة التخزين المؤقتة لفهرس النماذج
├── context-window-guard.ts        # التحقق من نافذة السياق
├── failover-error.ts              # الصنف FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER وDEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # حلّ معاملات موجّه النظام
├── system-prompt-report.ts        # توليد تقرير التصحيح
├── tool-summaries.ts              # ملخصات وصف الأدوات
├── tool-policy.ts                 # حلّ سياسة الأدوات
├── transcript-policy.ts           # سياسة التحقق من النص الحواري
├── skills.ts                      # بناء لقطة Skills/الموجّه
├── skills/                        # النظام الفرعي لـ Skills
├── sandbox.ts                     # حلّ سياق sandbox
├── sandbox/                       # النظام الفرعي لـ sandbox
├── channel-tools.ts               # حقن أدوات خاصة بالقنوات
├── openclaw-tools.ts              # أدوات خاصة بـ OpenClaw
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

توجد الآن بيئات تشغيل إجراءات الرسائل الخاصة بكل قناة في أدلة الامتدادات المملوكة للـ Plugin بدلًا من وجودها تحت `src/agents/tools`، على سبيل المثال:

- ملفات بيئة تشغيل إجراءات Plugin الخاصة بـ Discord
- ملف بيئة تشغيل إجراءات Plugin الخاصة بـ Slack
- ملف بيئة تشغيل إجراءات Plugin الخاصة بـ Telegram
- ملف بيئة تشغيل إجراءات Plugin الخاصة بـ WhatsApp

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

تشمل الأحداث التي تُعالَج ما يلي:

- `message_start` / `message_end` / `message_update` (بث النص/التفكير)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. التوجيه

بعد الإعداد، تُوجَّه الجلسة:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

تتولى SDK حلقة الوكيل كاملة: الإرسال إلى LLM، وتنفيذ استدعاءات الأدوات، وبث الاستجابات.

حقن الصور محلي على مستوى الموجّه: يحمّل OpenClaw مراجع الصور من الموجّه الحالي ويمررها عبر `images` لهذا الدور فقط. ولا يعيد فحص أدوار السجل الأقدم لإعادة حقن حمولات الصور.

## بنية الأدوات

### مسار الأدوات

1. **الأدوات الأساسية**: `codingTools` الخاصة بـ pi (`read` و`bash` و`edit` و`write`)
2. **استبدالات مخصّصة**: يستبدل OpenClaw `bash` بـ `exec`/`process`، ويخصّص `read`/`edit`/`write` لـ sandbox
3. **أدوات OpenClaw**: المراسلة، والمتصفح، وcanvas، والجلسات، وCron، وGateway، وغيرها
4. **أدوات القنوات**: أدوات إجراءات خاصة بـ Discord/Telegram/Slack/WhatsApp
5. **تصفية السياسات**: تُصفّى الأدوات حسب الملف الشخصي، والمزوّد، والوكيل، والمجموعة، وسياسات sandbox
6. **توحيد المخطط**: تُنظَّف المخططات لمعالجة سلوكيات Gemini/OpenAI الخاصة
7. **تغليف AbortSignal**: تُغلَّف الأدوات لاحترام إشارات الإلغاء

### موائم تعريف الأداة

لدى `pi-agent-core` في `AgentTool` توقيع `execute` مختلف عن `ToolDefinition` في `pi-coding-agent`. يقوم الموائم في `pi-tool-definition-adapter.ts` بربط الاثنين:

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

تقوم `splitSdkTools()` بتمرير كل الأدوات عبر `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

يضمن هذا أن تبقى تصفية السياسات في OpenClaw، وتكامل sandbox، ومجموعة الأدوات الموسّعة متّسقة عبر المزوّدين.

## إنشاء موجّه النظام

يُبنى موجّه النظام في `buildAgentSystemPrompt()` ضمن `system-prompt.ts`. ويجمّع موجّهًا كاملًا يتضمن أقسامًا مثل الأدوات، وأسلوب استدعاء الأدوات، وضوابط الأمان، ومرجع OpenClaw CLI، وSkills، والوثائق، ومساحة العمل، وsandbox، والمراسلة، ووسوم الرد، والأسلوب، والردود الصامتة، وHeartbeat، وبيانات وقت التشغيل الوصفية، بالإضافة إلى الذاكرة والتفاعلات عند تفعيلهما، وكذلك ملفات السياق الاختيارية ومحتوى موجّه النظام الإضافي. وتُقصّ الأقسام لتناسب وضع الموجّه الأدنى المستخدم بواسطة الوكلاء الفرعيين.

يُطبَّق الموجّه بعد إنشاء الجلسة عبر `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## إدارة الجلسة

### ملفات الجلسة

الجلسات عبارة عن ملفات JSONL ذات بنية شجرية (ربط عبر id/parentId). ويتولى `SessionManager` في Pi الاستمرارية:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

ويغلّف OpenClaw هذا باستخدام `guardSessionManager()` لضمان أمان نتائج الأدوات.

### التخزين المؤقت للجلسة

يقوم `session-manager-cache.ts` بتخزين مثيلات SessionManager مؤقتًا لتجنب تحليل الملفات بشكل متكرر:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### تحديد السجل

تقوم `limitHistoryTurns()` بقص سجل المحادثة حسب نوع القناة (رسائل مباشرة مقابل مجموعة).

### Compaction

يُفعَّل Compaction التلقائي عند تجاوز السياق. وتشمل توقيعات التجاوز الشائعة
`request_too_large` و`context length exceeded` و`input exceeds the
maximum number of tokens` و`input token count exceeds the maximum number of
input tokens` و`input is too long for the model` و`ollama error: context
length exceeded`. ويتولى `compactEmbeddedPiSessionDirect()` تنفيذ
Compaction اليدوي:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## المصادقة وحلّ النموذج

### ملفات تعريف المصادقة

يحافظ OpenClaw على مخزن لملفات تعريف المصادقة يتضمن عدة مفاتيح API لكل مزوّد:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

تُدوَّر الملفات الشخصية عند الفشل مع تتبع فترة التهدئة:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### حلّ النموذج

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

### تجاوز الفشل

يؤدي `FailoverError` إلى تشغيل الرجوع إلى نموذج بديل عند ضبط ذلك:

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

يضيف `src/agents/pi-hooks/compaction-safeguard.ts` ضوابط حماية إلى Compaction، بما في ذلك موازنة تكيفية لميزانية التوكنات بالإضافة إلى ملخصات فشل الأدوات وعمليات الملفات:

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

## البث وردود الكتل

### تجزئة الكتل

يدير `EmbeddedBlockChunker` بث النص إلى كتل رد منفصلة:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### إزالة وسوم التفكير/النهائي

تُعالَج مخرجات البث لإزالة كتل `<think>`/`<thinking>` واستخراج محتوى `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
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
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### الرجوع في مستوى التفكير

إذا لم يكن مستوى التفكير مدعومًا، فسيجري الرجوع إلى مستوى بديل:

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

## التعامل الخاص بالمزوّد

### Anthropic

- تنظيف سلسلة الرفض السحرية
- التحقق من الأدوار المتتالية
- تحقق صارم من معاملات أدوات Pi في الطرف العلوي

### Google/Gemini

- تنقية مخطط الأدوات المملوك للـ Plugin

### OpenAI

- أداة `apply_patch` لنماذج Codex
- التعامل مع خفض مستوى التفكير

## تكامل TUI

يمتلك OpenClaw أيضًا وضع TUI محليًا يستخدم مكوّنات pi-tui مباشرة:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

ويوفر هذا تجربة طرفية تفاعلية مشابهة للوضع الأصلي في Pi.

## الفروق الرئيسية عن Pi CLI

| الجانب          | Pi CLI                  | OpenClaw المضمّن                                                                                 |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| الاستدعاء       | أمر `pi` / RPC          | SDK عبر `createAgentSession()`                                                                   |
| الأدوات         | أدوات البرمجة الافتراضية | مجموعة أدوات OpenClaw المخصّصة                                                                   |
| موجّه النظام    | `AGENTS.md` + prompts   | ديناميكي لكل قناة/سياق                                                                           |
| تخزين الجلسة    | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (أو `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| المصادقة        | بيانات اعتماد واحدة     | عدة ملفات شخصية مع تدوير                                                                          |
| الامتدادات      | تُحمّل من القرص         | مسارات برمجية + من القرص                                                                          |
| معالجة الأحداث  | عرض TUI                 | قائم على الاستدعاءات الراجعة (`onBlockReply` وغيرها)                                            |

## اعتبارات مستقبلية

مجالات يمكن إعادة العمل عليها:

1. **محاذاة توقيع الأدوات**: يوجد حاليًا تكييف بين توقيعات pi-agent-core وpi-coding-agent
2. **تغليف مدير الجلسة**: تضيف `guardSessionManager` أمانًا لكنها تزيد التعقيد
3. **تحميل الامتدادات**: يمكن استخدام `ResourceLoader` الخاص بـ Pi بشكل أكثر مباشرة
4. **تعقيد معالج البث**: نما `subscribeEmbeddedPiSession` وأصبح كبيرًا
5. **خصائص المزوّدين**: توجد مسارات شيفرة كثيرة خاصة بالمزوّدين قد تتمكن Pi من التعامل معها مستقبلًا

## الاختبارات

يمتد تغطية تكامل Pi عبر هذه المجموعات:

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

البث المباشر/الاشتراك الاختياري:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (فعّل `OPENCLAW_LIVE_TEST=1`)

للاطلاع على أوامر التشغيل الحالية، راجع [سير عمل تطوير Pi](/ar/pi-dev).

## ذي صلة

- [سير عمل تطوير Pi](/ar/pi-dev)
- [نظرة عامة على التثبيت](/ar/install)
