---
read_when:
    - تريد إنشاء Plugin جديدة لـ OpenClaw
    - تحتاج إلى بدء سريع لتطوير Plugins
    - أنت تضيف قناة جديدة أو موفّرًا أو أداة أو قدرة أخرى إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لـ OpenClaw خلال دقائق
title: بناء Plugins
x-i18n:
    generated_at: "2026-04-25T13:52:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

توسّع Plugins إمكانات OpenClaw بقدرات جديدة: القنوات، وموفّرو النماذج،
والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، والبحث في الويب، وأدوات الوكيل، أو أي
تركيبة من ذلك.

لا تحتاج إلى إضافة Plugin الخاصة بك إلى مستودع OpenClaw. انشرها إلى
[ClawHub](/ar/tools/clawhub) أو npm وسيقوم المستخدمون بتثبيتها باستخدام
`openclaw plugins install <package-name>`. ويحاول OpenClaw استخدام ClawHub أولًا ثم
يعود تلقائيًا إلى npm.

## المتطلبات المسبقة

- Node >= 22 ومدير حزم (npm أو pnpm)
- إلمام بـ TypeScript ‏(ESM)
- بالنسبة إلى Plugins داخل المستودع: يجب استنساخ المستودع وتشغيل `pnpm install`

## ما نوع Plugin التي تريدها؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    اربط OpenClaw بمنصة مراسلة (Discord، وIRC، إلخ)
  </Card>
  <Card title="Plugin موفّر" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف موفّر نماذج (LLM، أو proxy، أو نقطة نهاية مخصصة)
  </Card>
  <Card title="Plugin أداة / hook" icon="wrench" href="/ar/plugins/hooks">
    سجّل أدوات الوكيل، أو event hooks، أو الخدمات — تابع أدناه
  </Card>
</CardGroup>

بالنسبة إلى Plugin قناة ليس من المضمون تثبيتها عند تشغيل onboarding/setup،
استخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. إذ يُنتج محول إعداد + زوج معالج
يعرضان متطلب التثبيت ويفشلان بشكل مغلق عند محاولات كتابة التهيئة الفعلية
إلى أن يتم تثبيت Plugin.

## بدء سريع: Plugin أداة

ينشئ هذا الشرح Plugin دنيا تسجّل أداة وكيل. أما Plugins الخاصة بالقنوات
والموفّرين فلها أدلة مخصصة مرتبطة أعلاه.

<Steps>
  <Step title="أنشئ الحزمة وmanifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "تضيف أداة مخصصة إلى OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    تحتاج كل Plugin إلى manifest، حتى لو لم تكن هناك تهيئة. راجع
    [Manifest](/ar/plugins/manifest) للاطلاع على schema الكاملة. وتوجد
    مقتطفات النشر القياسية إلى ClawHub في `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="اكتب نقطة الدخول">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` مخصص لـ Plugins غير القنوات. أما القنوات فاستخدم
    `defineChannelPluginEntry` — راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
    وللاطلاع على خيارات نقطة الدخول الكاملة، راجع [نقاط الدخول](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="اختبر وانشر">

    **Plugins الخارجية:** تحقّق وانشر باستخدام ClawHub، ثم ثبّت:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    كما يتحقق OpenClaw أيضًا من ClawHub قبل npm عند استخدام مواصفات حزمة مجردة مثل
    `@myorg/openclaw-my-plugin`.

    **Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugins المجمّعة — وسيتم اكتشافها تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قدرات Plugin

يمكن لـ Plugin واحدة تسجيل أي عدد من القدرات عبر الكائن `api`:

| القدرة                | طريقة التسجيل                                   | الدليل التفصيلي                                                                 |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| الاستدلال النصي (LLM) | `api.registerProvider(...)`                     | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins)                              |
| خلفية استدلال CLI     | `api.registerCliBackend(...)`                   | [واجهات CLI الخلفية](/ar/gateway/cli-backends)                                     |
| القناة / المراسلة     | `api.registerChannel(...)`                      | [Plugins القنوات](/ar/plugins/sdk-channel-plugins)                                 |
| الكلام (TTS/STT)      | `api.registerSpeechProvider(...)`               | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| النسخ الفوري          | `api.registerRealtimeTranscriptionProvider(...)`| [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| الصوت الفوري          | `api.registerRealtimeVoiceProvider(...)`        | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| فهم الوسائط           | `api.registerMediaUnderstandingProvider(...)`   | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الصور           | `api.registerImageGenerationProvider(...)`      | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الموسيقى        | `api.registerMusicGenerationProvider(...)`      | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الفيديو         | `api.registerVideoGenerationProvider(...)`      | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جلب الويب             | `api.registerWebFetchProvider(...)`             | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| البحث في الويب        | `api.registerWebSearchProvider(...)`            | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware لنتائج الأدوات | `api.registerAgentToolResultMiddleware(...)` | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                    |
| أدوات الوكيل          | `api.registerTool(...)`                         | أدناه                                                                           |
| أوامر مخصصة           | `api.registerCommand(...)`                      | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |
| Plugin hooks          | `api.on(...)`                                   | [Plugin hooks](/ar/plugins/hooks)                                                   |
| Internal event hooks  | `api.registerHook(...)`                         | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |
| مسارات HTTP           | `api.registerHttpRoute(...)`                    | [الداخليات](/ar/plugins/architecture-internals#gateway-http-routes)               |
| أوامر فرعية لـ CLI    | `api.registerCli(...)`                          | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |

للاطلاع على API التسجيل الكاملة، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

يمكن لـ Plugins المجمّعة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
تحتاج إلى إعادة كتابة غير متزامنة لنتائج الأدوات قبل أن يراها النموذج. وصرّح
عن بيئات التشغيل المستهدفة في `contracts.agentToolResultMiddleware`، مثل
`["pi", "codex"]`. وهذه فتحة موثوقة لـ Plugin مجمّعة؛ أما
Plugins الخارجية فينبغي أن تفضّل Plugin hooks العادية في OpenClaw ما لم
ينمُ في OpenClaw سياسة ثقة صريحة لهذه القدرة.

إذا كانت Plugin الخاصة بك تسجل أساليب RPC مخصصة في Gateway، فأبقِها تحت
بادئة خاصة بـ Plugin. إذ تبقى أسماء النطاقات الإدارية الأساسية (`config.*`،
`exec.approvals.*`، `wizard.*`، `update.*`) محجوزة وتحل دائمًا إلى
`operator.admin`، حتى لو طلبت Plugin نطاقًا أضيق.

دلالات حماية hooks التي يجب تذكّرها:

- `before_tool_call`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل `{ block: false }` على أنها بلا قرار.
- `before_tool_call`: تؤدي `{ requireApproval: true }` إلى إيقاف تنفيذ الوكيل مؤقتًا ومطالبة المستخدم بالموافقة عبر طبقة exec approval، أو أزرار Telegram، أو تفاعلات Discord، أو أمر `/approve` في أي قناة.
- `before_install`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل `{ block: false }` على أنها بلا قرار.
- `message_sending`: تكون `{ cancel: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل `{ cancel: false }` على أنها بلا قرار.
- `message_received`: فضّل الحقل المطبّع `threadId` عندما تحتاج إلى توجيه inbound thread/topic. وأبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه المطبّعة `replyToId` / `threadId` على مفاتيح metadata الخاصة بالقناة.

يتعامل أمر `/approve` مع موافقات exec وPlugin مع fallback محدود: عندما لا يتم العثور على معرّف exec approval، يعيد OpenClaw محاولة المعرّف نفسه عبر موافقات Plugin. ويمكن تهيئة إعادة توجيه موافقات Plugin بشكل مستقل عبر `approvals.plugin` في التهيئة.

إذا كانت بنية الموافقة المخصصة تحتاج إلى اكتشاف حالة fallback المحدودة نفسها،
ففضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدلًا من مطابقة سلاسل انتهاء صلاحية الموافقة يدويًا.

راجع [Plugin hooks](/ar/plugins/hooks) للاطلاع على الأمثلة ومرجع hooks.

## تسجيل أدوات الوكيل

الأدوات هي دوال مطبّعة يمكن لـ LLM استدعاؤها. ويمكن أن تكون مطلوبة (متاحة دائمًا)
أو اختيارية (بتفعيل المستخدم):

```typescript
register(api) {
  // أداة مطلوبة — متاحة دائمًا
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // أداة اختيارية — يجب على المستخدم إضافتها إلى allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

يفعّل المستخدمون الأدوات الاختيارية في التهيئة:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع الأدوات الأساسية (يتم تخطي التعارضات)
- استخدم `optional: true` للأدوات ذات التأثيرات الجانبية أو التي تتطلب ملفات تنفيذية إضافية
- يمكن للمستخدمين تمكين جميع الأدوات من Plugin بإضافة معرّف Plugin إلى `tools.allow`

## اصطلاحات الاستيراد

استورد دائمًا من مسارات فرعية مركزة من `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// خطأ: الجذر الأحادي (قديم وسيزال)
import { ... } from "openclaw/plugin-sdk";
```

للاطلاع على مرجع المسارات الفرعية الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاصة بك، استخدم ملفات barrel المحلية (`api.ts`, `runtime-api.ts`) من أجل
الاستيرادات الداخلية — ولا تستورد Plugin الخاصة بك أبدًا عبر مسار SDK الخاص بها.

بالنسبة إلى Plugins الموفّرين، أبقِ المساعدات الخاصة بكل موفّر في ملفات barrel
الجذرية الخاصة بتلك الحزمة ما لم تكن الفتحة عامة فعلًا. الأمثلة المجمّعة الحالية:

- Anthropic: أغلفة Claude stream ومساعدات `service_tier` / beta
- OpenAI: بُناة الموفّر، ومساعدات النموذج الافتراضي، وموفّرات realtime
- OpenRouter: باني الموفّر بالإضافة إلى مساعدات onboarding/config

إذا كانت أداة مساعدة مفيدة فقط داخل حزمة موفّر مجمّعة واحدة، فأبقِها على
فتحة جذر تلك الحزمة بدلًا من ترقيتها إلى `openclaw/plugin-sdk/*`.

لا تزال بعض الفتحات المساعدة المولدة `openclaw/plugin-sdk/<bundled-id>` موجودة من أجل
صيانة Plugins المجمّعة والتوافق، مثل
`plugin-sdk/feishu-setup` أو `plugin-sdk/zalo-setup`. تعامل مع هذه الفتحات
على أنها أسطح محجوزة، لا على أنها النمط الافتراضي لـ Plugins الخارجية الجديدة.

## قائمة تحقق ما قبل الإرسال

<Check>يحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>manifest **openclaw.plugin.json** موجودة وصالحة</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم جميع الاستيرادات مسارات `plugin-sdk/<subpath>` المركزة</Check>
<Check>تستخدم الاستيرادات الداخلية وحدات محلية، وليس استيرادات ذاتية من SDK</Check>
<Check>نجحت الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>نجح `pnpm check` ‏(للـ Plugins داخل المستودع)</Check>

## اختبار الإصدار التجريبي

1. راقب وسوم إصدارات GitHub في [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو الوسوم التجريبية مثل `v2026.3.N-beta.1`. ويمكنك أيضًا تفعيل الإشعارات لحساب OpenClaw الرسمي على X ‏[@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاصة بك مقابل الوسم التجريبي بمجرد ظهوره. وعادة ما تكون النافذة قبل الإصدار المستقر بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاصة بك في قناة Discord ‏`plugin-forum` بعد الاختبار إما `all good` أو ما الذي تعطل. وإذا لم يكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطّل شيء ما، فافتح مشكلة أو حدّث مشكلة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق الوسم `beta-blocker`. وضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord. لا يمكن للمساهمين وضع وسوم على PRs، لذا يكون العنوان هو الإشارة على مستوى PR للمشرفين والأتمتة. يتم دمج المشكلات المانعة التي لديها PR؛ أما المشكلات المانعة التي لا تملك PR فقد تُشحن على أي حال. ويراقب المشرفون هذه السلاسل أثناء اختبار النسخة التجريبية.
6. الصمت يعني أن كل شيء جيد. وإذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins القنوات" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin قناة مراسلة
  </Card>
  <Card title="Plugins الموفّرين" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin موفّر نماذج
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وAPI التسجيل
  </Card>
  <Card title="مساعدات runtime" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS، والبحث، والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="الاختبار" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات وأنماط الاختبار
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/ar/plugins/manifest">
    المرجع الكامل لـ schema الخاصة بالـ manifest
  </Card>
</CardGroup>

## ذو صلة

- [بنية Plugin](/ar/plugins/architecture) — شرح معمق للبنية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع Plugin SDK
- [Manifest](/ar/plugins/manifest) — تنسيق manifest الخاصة بالـ plugin
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins) — بناء Plugins الموفّرين
