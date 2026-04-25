---
read_when:
    - أنت تبني Plugin يحتاج إلى `before_tool_call`، أو `before_agent_reply`، أو خطافات الرسائل، أو خطافات دورة الحياة
    - أنت بحاجة إلى حظر استدعاءات الأدوات من Plugin أو إعادة كتابتها أو طلب الموافقة عليها
    - أنت تقرر بين الخطافات الداخلية وخطافات Plugin
summary: 'خطافات Plugin: اعتراض أحداث الوكيل، والأداة، والرسالة، والجلسة، ودورة حياة Gateway'
title: خطافات Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

خطافات Plugin هي نقاط امتداد داخل العملية لـ Plugins الخاصة بـ OpenClaw. استخدمها
عندما يحتاج Plugin إلى فحص أو تغيير تشغيلات الوكيل، أو استدعاءات الأدوات، أو تدفق الرسائل،
أو دورة حياة الجلسة، أو توجيه الوكلاء الفرعيين، أو عمليات التثبيت، أو بدء تشغيل Gateway.

استخدم [الخطافات الداخلية](/ar/automation/hooks) بدلًا من ذلك عندما تريد
سكريبت `HOOK.md` صغيرًا يثبته المشغّل لأحداث الأوامر وGateway مثل
`/new`، و`/reset`، و`/stop`، و`agent:bootstrap`، أو `gateway:startup`.

## البدء السريع

سجّل خطافات Plugin typed باستخدام `api.on(...)` من مدخل Plugin لديك:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

تعمل معالجات الخطافات بالتسلسل وفق `priority` تنازليًا. وتحافظ الخطافات ذات الأولوية نفسها
على ترتيب التسجيل.

## كتالوج الخطافات

تُجمَّع الخطافات حسب السطح الذي توسّعه. والأسماء المكتوبة **بخط عريض** تقبل
نتيجة قرار (حظر، أو إلغاء، أو تجاوز، أو طلب موافقة)؛ أما البقية فهي للملاحظة فقط.

**دورة الوكيل**

- `before_model_resolve` — تجاوز المزوّد أو النموذج قبل تحميل رسائل الجلسة
- `before_prompt_build` — إضافة سياق ديناميكي أو نص مطالبة النظام قبل استدعاء النموذج
- `before_agent_start` — مرحلة مجمّعة للتوافق فقط؛ ويفضّل استخدام الخطافين أعلاه
- **`before_agent_reply`** — اختصار دورة النموذج برد اصطناعي أو بصمت
- `agent_end` — ملاحظة الرسائل النهائية، وحالة النجاح، ومدة التشغيل

**ملاحظة المحادثة**

- `llm_input` — ملاحظة مدخلات المزوّد (مطالبة النظام، والمطالبة، والسجل)
- `llm_output` — ملاحظة مخرجات المزوّد

**الأدوات**

- **`before_tool_call`** — إعادة كتابة معلمات الأداة، أو حظر التنفيذ، أو طلب الموافقة
- `after_tool_call` — ملاحظة نتائج الأداة، والأخطاء، والمدة
- **`tool_result_persist`** — إعادة كتابة رسالة المساعد الناتجة عن نتيجة الأداة
- **`before_message_write`** — فحص أو حظر كتابة رسالة جارية (نادر)

**الرسائل والتسليم**

- **`inbound_claim`** — المطالبة برسالة واردة قبل توجيهها إلى الوكيل (ردود اصطناعية)
- `message_received` — ملاحظة المحتوى الوارد، والمرسل، والسلسلة، وبيانات التعريف
- **`message_sending`** — إعادة كتابة المحتوى الصادر أو إلغاء التسليم
- `message_sent` — ملاحظة نجاح التسليم الصادر أو فشله
- **`before_dispatch`** — فحص أو إعادة كتابة عملية dispatch صادرة قبل تسليمها إلى القناة
- **`reply_dispatch`** — المشاركة في مسار dispatch النهائي للرد

**الجلسات وCompaction**

- `session_start` / `session_end` — تتبّع حدود دورة حياة الجلسة
- `before_compaction` / `after_compaction` — ملاحظة أو توضيح دورات Compaction
- `before_reset` — ملاحظة أحداث إعادة تعيين الجلسة (`/reset`، وإعادات التعيين البرمجية)

**الوكلاء الفرعيون**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — تنسيق توجيه الوكيل الفرعي وتسليم الإكمال

**دورة الحياة**

- `gateway_start` / `gateway_stop` — بدء أو إيقاف الخدمات المملوكة لـ Plugin مع Gateway
- **`before_install`** — فحص عمليات مسح تثبيت skill أو Plugin ويمكنه اختياريًا الحظر

## سياسة استدعاء الأدوات

يتلقى `before_tool_call`:

- `event.toolName`
- `event.params`
- `event.runId` اختياري
- `event.toolCallId` اختياري
- حقول السياق مثل `ctx.agentId`، و`ctx.sessionKey`، و`ctx.sessionId`،
  و`ctx.trace` التشخيصي

ويمكنه إرجاع:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

القواعد:

- تكون `block: true` نهائية وتتجاوز المعالجات ذات الأولوية الأقل.
- تُعامل `block: false` على أنها بلا قرار.
- تعيد `params` كتابة معلمات الأداة من أجل التنفيذ.
- يوقف `requireApproval` تشغيل الوكيل مؤقتًا ويطلب من المستخدم عبر
  موافقات Plugin. ويمكن لأمر `/approve` الموافقة على كل من موافقات exec وموافقات Plugin.
- لا يزال بإمكان `block: true` ذي الأولوية الأقل الحظر بعد أن يكون خطاف ذو أولوية أعلى
  قد طلب الموافقة.
- تتلقى `onResolution` قرار الموافقة المحلول — `allow-once`،
  أو `allow-always`، أو `deny`، أو `timeout`، أو `cancelled`.

## خطافات المطالبة والنموذج

استخدم الخطافات الخاصة بكل مرحلة في Plugins الجديدة:

- `before_model_resolve`: يتلقى فقط المطالبة الحالية وبيانات تعريف
  المرفقات. أرجع `providerOverride` أو `modelOverride`.
- `before_prompt_build`: يتلقى المطالبة الحالية ورسائل الجلسة.
  أرجع `prependContext`، أو `systemPrompt`، أو `prependSystemContext`، أو
  `appendSystemContext`.

ولا يزال `before_agent_start` موجودًا من أجل التوافق. ويفضّل استخدام الخطافات الصريحة أعلاه
حتى لا يعتمد Plugin لديك على مرحلة مجمّعة قديمة.

يتضمن كل من `before_agent_start` و`agent_end` القيمة `event.runId` عندما يتمكن OpenClaw
من تحديد التشغيل النشط. وتتوفر القيمة نفسها أيضًا في `ctx.runId`.

يجب على Plugins غير المضمّنة التي تحتاج إلى `llm_input`، أو `llm_output`، أو `agent_end` ضبط:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

يمكن تعطيل الخطافات التي تغيّر المطالبة لكل Plugin عبر
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## خطافات الرسائل

استخدم خطافات الرسائل من أجل التوجيه على مستوى القناة وسياسة التسليم:

- `message_received`: ملاحظة المحتوى الوارد، والمرسل، و`threadId`، و`messageId`،
  و`senderId`، والارتباط الاختياري بالتشغيل/الجلسة، وبيانات التعريف.
- `message_sending`: إعادة كتابة `content` أو إرجاع `{ cancel: true }`.
- `message_sent`: ملاحظة النجاح النهائي أو الفشل.

بالنسبة إلى ردود TTS الصوتية فقط، قد يحتوي `content` على transcript مخفي منطوق
حتى عندما لا تتضمن حمولة القناة نصًا/تعليقًا مرئيًا. وتؤدي إعادة كتابة ذلك
`content` إلى تحديث transcript المرئي للخطاف فقط؛ ولن يُعرض كتعليق
للوسائط.

تكشف سياقات خطافات الرسائل عن حقول ارتباط ثابتة عند توفرها:
`ctx.sessionKey`، و`ctx.runId`، و`ctx.messageId`، و`ctx.senderId`، و`ctx.trace`،
و`ctx.traceId`، و`ctx.spanId`، و`ctx.parentSpanId`، و`ctx.callDepth`. ويفضّل استخدام
هذه الحقول من الدرجة الأولى قبل قراءة بيانات التعريف القديمة.

يفضّل استخدام الحقلين typed ‏`threadId` و`replyToId` قبل استخدام
بيانات التعريف الخاصة بالقناة.

قواعد القرار:

- يكون `message_sending` مع `cancel: true` نهائيًا.
- يُعامل `message_sending` مع `cancel: false` على أنه بلا قرار.
- يستمر `content` المعاد كتابته إلى الخطافات ذات الأولوية الأقل ما لم يلغِ خطاف لاحق
  التسليم.

## خطافات التثبيت

يعمل `before_install` بعد الفحص المضمّن لعمليات تثبيت skill وPlugin.
أرجع نتائج إضافية أو `{ block: true, blockReason }` لإيقاف
التثبيت.

تكون `block: true` نهائية. وتُعامل `block: false` على أنها بلا قرار.

## دورة حياة Gateway

استخدم `gateway_start` لخدمات Plugin التي تحتاج إلى حالة مملوكة لـ Gateway. ويكشف
السياق `ctx.config`، و`ctx.workspaceDir`، و`ctx.getCron?.()` لفحص
Cron وتحديثه. واستخدم `gateway_stop` لتنظيف الموارد طويلة التشغيل.

لا تعتمد على الخطاف الداخلي `gateway:startup` لخدمات وقت التشغيل المملوكة لـ Plugin.

## الإهمالات القادمة

بعض الأسطح المرتبطة بالخطافات مهملة لكنها لا تزال مدعومة. قم بالترحيل
قبل الإصدار الرئيسي التالي:

- **مغلفات القنوات النصية الصريحة** في معالجات `inbound_claim` و`message_received`.
  اقرأ `BodyForAgent` وكتل سياق المستخدم المنظمة
  بدلًا من تحليل نص مغلف مسطح. راجع
  [مغلفات القنوات النصية الصريحة ← BodyForAgent](/ar/plugins/sdk-migration#active-deprecations).
- لا يزال **`before_agent_start`** موجودًا من أجل التوافق. ويجب على Plugins الجديدة استخدام
  `before_model_resolve` و`before_prompt_build` بدلًا من
  المرحلة المجمّعة.
- يستخدم **`onResolution` في `before_tool_call`** الآن
  union typed ‏`PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) بدل `string` حر.

للاطلاع على القائمة الكاملة — تسجيل إمكانات الذاكرة، وملف
thinking الخاص بالمزوّد، وموفري المصادقة الخارجيين، وأنواع اكتشاف المزوّد،
وموصولات وقت تشغيل المهام، وإعادة تسمية `command-auth` → `command-status` — راجع
[ترحيل Plugin SDK → الإهمالات النشطة](/ar/plugins/sdk-migration#active-deprecations).

## ذو صلة

- [ترحيل Plugin SDK](/ar/plugins/sdk-migration) — الإهمالات النشطة والجدول الزمني للإزالة
- [بناء Plugins](/ar/plugins/building-plugins)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [الخطافات الداخلية](/ar/automation/hooks)
- [البنية الداخلية لمعمارية Plugin](/ar/plugins/architecture-internals)
