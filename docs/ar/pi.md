---
read_when:
    - فهم تصميم تكامل Pi SDK في OpenClaw
    - تعديل دورة حياة جلسة الوكيل، والأدوات، أو ربط المزوّد لـ Pi
summary: بنية تكامل وكيل Pi المضمّن في OpenClaw ودورة حياة الجلسة
title: بنية تكامل Pi
x-i18n:
    generated_at: "2026-04-22T04:24:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# بنية تكامل Pi

تصف هذه الوثيقة كيفية تكامل OpenClaw مع [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) وحزمها الشقيقة (`pi-ai` و`pi-agent-core` و`pi-tui`) لتشغيل قدرات وكيل الذكاء الاصطناعي فيه.

## نظرة عامة

يستخدم OpenClaw ‏Pi SDK لتضمين وكيل برمجة بالذكاء الاصطناعي داخل بنية gateway الخاصة بالمراسلة. وبدلًا من تشغيل Pi كعملية فرعية أو استخدام وضع RPC، يستورد OpenClaw مباشرة `AgentSession` الخاصة بـ Pi وينشئها عبر `createAgentSession()`. ويوفر هذا النهج المضمّن ما يلي:

- تحكم كامل في دورة حياة الجلسة ومعالجة الأحداث
- حقن أدوات مخصصة (المراسلة، وsandbox، والإجراءات الخاصة بالقنوات)
- تخصيص system prompt لكل قناة/سياق
- استمرارية الجلسة مع دعم branching/Compaction
- تدوير ملفات تعريف المصادقة متعددة الحسابات مع failover
- تبديل النماذج بصورة مستقلة عن المزوّد

## تبعيات الحزم

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| الحزمة           | الغرض                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | تجريدات LLM الأساسية: `Model` و`streamSimple` وأنواع الرسائل وواجهات API الخاصة بالمزوّدين                           |
| `pi-agent-core`   | حلقة الوكيل، وتنفيذ الأدوات، وأنواع `AgentMessage`                                                       |
| `pi-coding-agent` | SDK عالية المستوى: `createAgentSession` و`SessionManager` و`AuthStorage` و`ModelRegistry` والأدوات المضمنة |
| `pi-tui`          | مكونات واجهة المستخدم الطرفية (تُستخدم في وضع TUI المحلي في OpenClaw)                                             |

## بنية الملفات

```
src/agents/
├── pi-embedded-runner.ts          # إعادة التصدير من pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # نقطة الإدخال الرئيسية: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # منطق المحاولة الواحدة مع إعداد الجلسة
│   │   ├── params.ts              # النوع RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # بناء حمولات الاستجابة من نتائج التشغيل
│   │   ├── images.ts              # حقن صور نموذج الرؤية
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # اكتشاف أخطاء الإلغاء
│   ├── cache-ttl.ts               # تتبع Cache TTL لتقليم السياق
│   ├── compact.ts                 # منطق Compaction اليدوي/التلقائي
│   ├── extensions.ts              # تحميل امتدادات Pi للتشغيلات المضمنة
│   ├── extra-params.ts            # معلمات stream الخاصة بالمزوّد
│   ├── google.ts                  # إصلاحات ترتيب الأدوار لـ Google/Gemini
│   ├── history.ts                 # تحديد السجل (الرسائل المباشرة مقابل المجموعات)
│   ├── lanes.ts                   # مسارات أوامر الجلسة/العامة
│   ├── logger.ts                  # logger للنظام الفرعي
│   ├── model.ts                   # حل النموذج عبر ModelRegistry
│   ├── runs.ts                    # تتبع التشغيلات النشطة، والإلغاء، والطابور
│   ├── sandbox-info.ts            # معلومات sandbox من أجل system prompt
│   ├── session-manager-cache.ts   # تخزين مثيلات SessionManager مؤقتًا
│   ├── session-manager-init.ts    # تهيئة ملف الجلسة
│   ├── system-prompt.ts           # باني system prompt
│   ├── tool-split.ts              # تقسيم الأدوات إلى builtIn مقابل custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ربط ThinkLevel، ووصف الأخطاء
├── pi-embedded-subscribe.ts       # الاشتراك في أحداث الجلسة/توزيعها
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # مصنع معالجات الأحداث
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # تجزئة ردود الكتل المتدفقة
├── pi-embedded-messaging.ts       # تتبع الإرسال عبر أدوات المراسلة
├── pi-embedded-helpers.ts         # تصنيف الأخطاء، والتحقق من الدور
├── pi-embedded-helpers/           # وحدات مساعدة
├── pi-embedded-utils.ts           # أدوات تنسيق
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # تغليف AbortSignal للأدوات
├── pi-tools.policy.ts             # سياسة قائمة السماح/المنع للأدوات
├── pi-tools.read.ts               # تخصيصات أداة القراءة
├── pi-tools.schema.ts             # تطبيع مخطط الأدوات
├── pi-tools.types.ts              # الاسم المستعار للنوع AnyAgentTool
├── pi-tool-definition-adapter.ts  # محول AgentTool -> ToolDefinition
├── pi-settings.ts                 # تجاوزات الإعدادات
├── pi-hooks/                      # hooks مخصصة لـ Pi
│   ├── compaction-safeguard.ts    # امتداد الحماية
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # امتداد تقليم السياق لـ Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # حل ملفات تعريف المصادقة
├── auth-profiles.ts               # مخزن الملفات التعريفية، والمهلة، وfailover
├── model-selection.ts             # حل النموذج الافتراضي
├── models-config.ts               # إنشاء models.json
├── model-catalog.ts               # ذاكرة تخزين مؤقت لفهرس النماذج
├── context-window-guard.ts        # التحقق من نافذة السياق
├── failover-error.ts              # الصنف FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # حل معلمات system prompt
├── system-prompt-report.ts        # إنشاء تقرير التصحيح
├── tool-summaries.ts              # ملخصات وصف الأدوات
├── tool-policy.ts                 # حل سياسة الأدوات
├── transcript-policy.ts           # سياسة التحقق من transcript
├── skills.ts                      # إنشاء snapshot/prompt لـ Skills
├── skills/                        # النظام الفرعي لـ Skills
├── sandbox.ts                     # حل سياق sandbox
├── sandbox/                       # النظام الفرعي لـ sandbox
├── channel-tools.ts               # حقن الأدوات الخاصة بالقنوات
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

توجد الآن أوقات تشغيل إجراءات الرسائل الخاصة بالقنوات في أدلة
الامتدادات المملوكة لـ plugin بدلًا من وجودها تحت `src/agents/tools`، على سبيل المثال:

- ملفات وقت تشغيل إجراءات Discord plugin
- ملف وقت تشغيل إجراء Slack plugin
- ملف وقت تشغيل إجراء Telegram plugin
- ملف وقت تشغيل إجراء WhatsApp plugin

## تدفق التكامل الأساسي

### 1. تشغيل وكيل مضمّن

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

داخل `runEmbeddedAttempt()` (التي تستدعيها `runEmbeddedPiAgent()`)، يتم استخدام Pi SDK:

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

تشترك `subscribeEmbeddedPiSession()` في أحداث `AgentSession` الخاصة بـ Pi:

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

تشمل الأحداث التي تتم معالجتها ما يلي:

- `message_start` / `message_end` / `message_update` (بث النص/التفكير)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. التوجيه بالمطالبة

بعد الإعداد، يتم تمرير المطالبة إلى الجلسة:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

يتولى SDK حلقة الوكيل الكاملة: الإرسال إلى LLM، وتنفيذ استدعاءات الأدوات، وبث الاستجابات.

يكون حقن الصور محليًا بالنسبة إلى prompt: يقوم OpenClaw بتحميل مراجع الصور من prompt الحالية
ويمررها عبر `images` لذلك الدور فقط. وهو لا يعيد فحص أدوار السجل الأقدم
لإعادة حقن حمولات الصور.

## بنية الأدوات

### مسار الأدوات

1. **الأدوات الأساسية**: `codingTools` الخاصة بـ Pi (read وbash وedit وwrite)
2. **بدائل مخصصة**: يستبدل OpenClaw أداة bash بـ `exec`/`process`، ويخصص read/edit/write من أجل sandbox
3. **أدوات OpenClaw**: المراسلة، والمتصفح، وcanvas، والجلسات، وCron، وgateway، وغير ذلك
4. **أدوات القنوات**: أدوات إجراءات خاصة بـ Discord/Telegram/Slack/WhatsApp
5. **تصفية السياسة**: تتم تصفية الأدوات حسب الملف التعريفي، والمزوّد، والوكيل، والمجموعة، وسياسات sandbox
6. **تطبيع المخطط**: يتم تنظيف المخططات لمراعاة غرائب Gemini/OpenAI
7. **تغليف AbortSignal**: تُغلَّف الأدوات لاحترام إشارات الإلغاء

### محول تعريف الأدوات

يمتلك `AgentTool` في pi-agent-core توقيع `execute` مختلفًا عن `ToolDefinition` في pi-coding-agent. ويقوم المحول في `pi-tool-definition-adapter.ts` بسد هذه الفجوة:

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
    builtInTools: [], // فارغة. نحن نتجاوز كل شيء
    customTools: toToolDefinitions(options.tools),
  };
}
```

يضمن هذا أن تظل تصفية السياسات في OpenClaw، وتكامل sandbox، ومجموعة الأدوات الموسعة متسقة عبر المزوّدين.

## إنشاء system prompt

يتم بناء system prompt في `buildAgentSystemPrompt()` (`system-prompt.ts`). وهو يجمع prompt كاملة تتضمن أقسامًا تشمل Tooling، وTool Call Style، ووسائل الحماية الخاصة بالسلامة، ومرجع OpenClaw CLI، وSkills، وDocs، وWorkspace، وSandbox، وMessaging، وReply Tags، وVoice، وSilent Replies، وHeartbeats، وبيانات وقت التشغيل الوصفية، بالإضافة إلى Memory وReactions عند تمكينهما، وملفات السياق الاختيارية ومحتوى system prompt الإضافي. ويتم تقليم الأقسام في وضع prompt الأدنى المستخدم للوكلاء الفرعيين.

يتم تطبيق prompt بعد إنشاء الجلسة عبر `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## إدارة الجلسات

### ملفات الجلسات

الجلسات هي ملفات JSONL ذات بنية شجرية (ربط `id`/`parentId`). ويتولى `SessionManager` في Pi الاستمرارية:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

يلف OpenClaw هذا بـ `guardSessionManager()` من أجل أمان نتائج الأدوات.

### التخزين المؤقت للجلسات

يقوم `session-manager-cache.ts` بتخزين مثيلات SessionManager مؤقتًا لتجنب تحليل الملفات بشكل متكرر:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### تحديد السجل

يقوم `limitHistoryTurns()` بتقليم سجل المحادثة بناءً على نوع القناة (رسائل مباشرة مقابل مجموعة).

### Compaction

يتم تشغيل Compaction التلقائي عند تجاوز السياق. وتشمل تواقيع التجاوز الشائعة
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

## المصادقة وحل النماذج

### ملفات تعريف المصادقة

يحافظ OpenClaw على مخزن لملفات تعريف المصادقة مع عدة مفاتيح API لكل مزوّد:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

يتم تدوير الملفات التعريفية عند الإخفاقات مع تتبع المهلة:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### حل النماذج

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// يستخدم ModelRegistry وAuthStorage من Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

يؤدي `FailoverError` إلى تشغيل fallback للنموذج عند تكوينه:

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

يقوم OpenClaw بتحميل امتدادات Pi مخصصة لسلوك متخصص:

### حماية Compaction

يضيف `src/agents/pi-hooks/compaction-safeguard.ts` وسائل حماية إلى Compaction، بما في ذلك الميزانية التكيفية للرموز بالإضافة إلى ملخصات إخفاقات الأدوات وعمليات الملفات:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### تقليم السياق

ينفذ `src/agents/pi-hooks/context-pruning.ts` تقليم السياق القائم على Cache-TTL:

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

يدير `EmbeddedBlockChunker` النص المتدفق إلى كتل رد منفصلة:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### إزالة وسوم التفكير/النهاية

تتم معالجة مخرجات البث لإزالة كتل `<think>`/`<thinking>` واستخراج محتوى `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // إزالة محتوى <think>...</think>
  // إذا كان enforceFinalTag مفعّلًا، فأعد فقط محتوى <final>...</final>
};
```

### توجيهات الرد

يتم تحليل توجيهات الرد مثل `[[media:url]]` و`[[voice]]` و`[[reply:id]]` واستخراجها:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## معالجة الأخطاء

### تصنيف الأخطاء

يقوم `pi-embedded-helpers.ts` بتصنيف الأخطاء من أجل المعالجة المناسبة:

```typescript
isContextOverflowError(errorText)     // السياق كبير جدًا
isCompactionFailureError(errorText)   // فشل Compaction
isAuthAssistantError(lastAssistant)   // فشل المصادقة
isRateLimitAssistantError(...)        // تم بلوغ حد المعدل
isFailoverAssistantError(...)         // يجب تنفيذ failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### fallback لمستوى التفكير

إذا كان مستوى التفكير غير مدعوم، يتم fallback:

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
  // استخدام أدوات read/edit/write ضمن sandbox
  // يعمل Exec داخل حاوية
  // يستخدم المتصفح عنوان URL للجسر
}
```

## المعالجة الخاصة بالمزوّد

### Anthropic

- تنظيف سلسلة الرفض السحرية
- التحقق من الأدوار المتتالية
- تحقق صارم من معلمات أدوات Pi في جهة upstream

### Google/Gemini

- تنقية مخطط الأدوات المملوك لـ plugin

### OpenAI

- أداة `apply_patch` لنماذج Codex
- معالجة خفض مستوى التفكير

## تكامل TUI

يحتوي OpenClaw أيضًا على وضع TUI محلي يستخدم مكونات pi-tui مباشرة:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

يوفر هذا تجربة طرفية تفاعلية مماثلة للوضع الأصلي في Pi.

## الفروق الرئيسية عن Pi CLI

| الجانب          | Pi CLI                  | OpenClaw المضمّن                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| الاستدعاء      | أمر `pi` / ‏RPC      | SDK عبر `createAgentSession()`                                                                 |
| الأدوات           | أدوات البرمجة الافتراضية    | مجموعة أدوات OpenClaw مخصصة                                                                     |
| system prompt   | `AGENTS.md` + prompts     | ديناميكي لكل قناة/سياق                                                                    |
| تخزين الجلسات | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (أو `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| المصادقة            | بيانات اعتماد واحدة       | ملفات تعريف متعددة مع تدوير                                                                    |
| الامتدادات      | تُحمّل من القرص        | مسارات برمجية + مسارات من القرص                                                                      |
| معالجة الأحداث  | عرض TUI           | قائم على callbacks (`onBlockReply`، إلخ)                                                            |

## اعتبارات مستقبلية

مجالات قد تحتاج إلى إعادة العمل:

1. **محاذاة توقيع الأدوات**: يوجد حاليًا تكييف بين توقيعات pi-agent-core وpi-coding-agent
2. **تغليف مدير الجلسات**: يضيف `guardSessionManager` أمانًا لكنه يزيد التعقيد
3. **تحميل الامتدادات**: يمكن أن يستخدم `ResourceLoader` في Pi بشكل أكثر مباشرة
4. **تعقيد معالج البث**: أصبح `subscribeEmbeddedPiSession` كبيرًا
5. **غرائب المزوّدين**: توجد مسارات كود خاصة بمزوّدين متعددين يمكن أن تتولاها Pi مستقبلاً

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

مباشرة/اختيارية:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (فعّل `OPENCLAW_LIVE_TEST=1`)

لأوامر التشغيل الحالية، راجع [سير عمل تطوير Pi](/ar/pi-dev).
