---
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تضيف قناة جديدة، أو مزوّدًا، أو أداة، أو قدرة أخرى إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لـ OpenClaw في دقائق معدودة
title: بناء Plugins
x-i18n:
    generated_at: "2026-04-23T07:27:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# بناء Plugins

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدو النماذج،
والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، والبحث على الويب، وأدوات الوكيل، أو أي
تركيبة منها.

لا تحتاج إلى إضافة Plugin الخاصة بك إلى مستودع OpenClaw. انشرها على
[ClawHub](/ar/tools/clawhub) أو npm وسيثبّتها المستخدمون باستخدام
`openclaw plugins install <package-name>`. يحاول OpenClaw استخدام ClawHub أولًا
ثم يعود تلقائيًا إلى npm.

## المتطلبات المسبقة

- Node >= 22 ومدير حزم (npm أو pnpm)
- الإلمام بـ TypeScript ‏(ESM)
- بالنسبة إلى Plugins داخل المستودع: استنساخ المستودع وتشغيل `pnpm install`

## ما نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ربط OpenClaw بمنصة مراسلة (Discord أو IRC أو غيرهما)
  </Card>
  <Card title="Plugin مزوّد" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    إضافة مزوّد نماذج (LLM أو proxy أو نقطة نهاية مخصصة)
  </Card>
  <Card title="Plugin أداة / خطاف" icon="wrench">
    تسجيل أدوات الوكيل، أو خطافات الأحداث، أو الخدمات — تابع أدناه
  </Card>
</CardGroup>

إذا كان Plugin القناة اختياريًا وقد لا يكون مثبّتًا عند تشغيل الإعداد الأوّلي/الإعداد،
فاستخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. فهو ينتج زوجًا من محول الإعداد + المعالج
يعلن عن متطلب التثبيت ويفشل افتراضيًا عند عمليات كتابة الإعداد الفعلية
إلى أن يتم تثبيت Plugin.

## البدء السريع: Plugin أداة

ينشئ هذا الشرح Plugin دنيا تسجّل أداة وكيل. أما
Plugins القنوات والمزوّدين فلها أدلة مخصصة مرتبطة أعلاه.

<Steps>
  <Step title="أنشئ الحزمة والبيان">
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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    تحتاج كل Plugin إلى بيان، حتى من دون إعداد. راجع
    [Manifest](/ar/plugins/manifest) للاطلاع على المخطط الكامل. وتوجد مقتطفات النشر
    القياسية لـ ClawHub في `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="اكتب نقطة الإدخال">

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

    تمثل `definePluginEntry` الخيار المناسب للـ Plugins غير الخاصة بالقنوات. أما بالنسبة إلى القنوات، فاستخدم
    `defineChannelPluginEntry` — راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
    وللاطلاع على خيارات نقاط الإدخال الكاملة، راجع [نقاط الإدخال](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="اختبر وانشر">

    **Plugins الخارجية:** تحقّق وانشر باستخدام ClawHub، ثم ثبّت:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    يتحقق OpenClaw أيضًا من ClawHub قبل npm بالنسبة إلى مواصفات الحزم المجردة مثل
    `@myorg/openclaw-my-plugin`.

    **Plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugins المضمّنة — وسيتم اكتشافها تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قدرات Plugin

يمكن لـ Plugin واحدة تسجيل أي عدد من القدرات عبر الكائن `api`:

| القدرة               | أسلوب التسجيل                                 | الدليل التفصيلي                                                                  |
| -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| استدلال نصي (LLM)    | `api.registerProvider(...)`                   | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins)                                 |
| واجهة استدلال CLI    | `api.registerCliBackend(...)`                 | [واجهات CLI الخلفية](/ar/gateway/cli-backends)                                      |
| قناة / مراسلة        | `api.registerChannel(...)`                    | [Plugins القنوات](/ar/plugins/sdk-channel-plugins)                                  |
| كلام (TTS/STT)       | `api.registerSpeechProvider(...)`             | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| نسخ فوري             | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| صوت فوري             | `api.registerRealtimeVoiceProvider(...)`      | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| فهم الوسائط          | `api.registerMediaUnderstandingProvider(...)` | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| توليد الصور          | `api.registerImageGenerationProvider(...)`    | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| توليد الموسيقى       | `api.registerMusicGenerationProvider(...)`    | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| توليد الفيديو        | `api.registerVideoGenerationProvider(...)`    | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| جلب الويب            | `api.registerWebFetchProvider(...)`           | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| البحث على الويب      | `api.registerWebSearchProvider(...)`          | [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| امتداد Pi مضمّن      | `api.registerEmbeddedExtensionFactory(...)`   | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                      |
| أدوات الوكيل         | `api.registerTool(...)`                       | أدناه                                                                            |
| أوامر مخصصة          | `api.registerCommand(...)`                    | [نقاط الإدخال](/ar/plugins/sdk-entrypoints)                                         |
| خطافات الأحداث       | `api.registerHook(...)`                       | [نقاط الإدخال](/ar/plugins/sdk-entrypoints)                                         |
| مسارات HTTP          | `api.registerHttpRoute(...)`                  | [الداخليات](/ar/plugins/architecture#gateway-http-routes)                           |
| أوامر CLI فرعية      | `api.registerCli(...)`                        | [نقاط الإدخال](/ar/plugins/sdk-entrypoints)                                         |

للاطلاع على API التسجيل الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

استخدم `api.registerEmbeddedExtensionFactory(...)` عندما تحتاج Plugin إلى
خطافات embedded-runner أصلية في Pi مثل إعادة كتابة `tool_result` غير المتزامنة
قبل إصدار رسالة نتيجة الأداة النهائية. وفضّل خطافات Plugins العادية في OpenClaw عندما
لا يحتاج العمل إلى توقيت امتداد Pi.

إذا كانت Plugin الخاصة بك تسجّل أساليب RPC مخصصة في gateway، فأبقِها على
بادئة خاصة بالـ Plugin. تظل مساحات أسماء الإدارة الأساسية (`config.*`،
و`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`، حتى إذا طلبت Plugin نطاقًا أضيق.

دلالات حراسة الخطافات التي ينبغي أخذها في الحسبان:

- `before_tool_call`: تمثل `{ block: true }` قرارًا نهائيًا وتوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل `{ block: false }` على أنها بلا قرار.
- `before_tool_call`: تؤدي `{ requireApproval: true }` إلى إيقاف تنفيذ الوكيل مؤقتًا وتطلب من المستخدم الموافقة عبر تراكب موافقة exec، أو أزرار Telegram، أو تفاعلات Discord، أو الأمر `/approve` على أي قناة.
- `before_install`: تمثل `{ block: true }` قرارًا نهائيًا وتوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل `{ block: false }` على أنها بلا قرار.
- `message_sending`: تمثل `{ cancel: true }` قرارًا نهائيًا وتوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل `{ cancel: false }` على أنها بلا قرار.
- `message_received`: فضّل الحقل المكتوب `threadId` عندما تحتاج إلى توجيه السلسلة/الموضوع الوارد. واحتفظ بـ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه المكتوبة `replyToId` / `threadId` على مفاتيح البيانات الوصفية الخاصة بالقناة.

يتعامل الأمر `/approve` مع موافقات exec وPlugin مع احتياط محدود: عندما لا يُعثر على معرّف موافقة exec، يعيد OpenClaw محاولة المعرّف نفسه عبر موافقات Plugins. ويمكن إعداد تمرير موافقات Plugins بشكل مستقل عبر `approvals.plugin` في الإعداد.

إذا كانت بنية الموافقات المخصصة تحتاج إلى اكتشاف حالة الاحتياط المحدود نفسها،
ففضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدلًا من مطابقة سلاسل انتهاء صلاحية الموافقات يدويًا.

راجع [دلالات قرارات الخطافات في نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics) للتفاصيل.

## تسجيل أدوات الوكيل

الأدوات هي دوال مكتوبة يمكن لـ LLM استدعاؤها. ويمكن أن تكون مطلوبة (متاحة
دائمًا) أو اختيارية (اشتراك من المستخدم):

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

  // أداة اختيارية — يجب على المستخدم إضافتها إلى قائمة السماح
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

يمكّن المستخدمون الأدوات الاختيارية في الإعداد:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع أدوات النواة (تُتخطى التعارضات)
- استخدم `optional: true` للأدوات ذات الآثار الجانبية أو متطلبات الثنائيات الإضافية
- يمكن للمستخدمين تمكين جميع أدوات Plugin بإضافة معرّف Plugin إلى `tools.allow`

## اصطلاحات الاستيراد

استورد دائمًا من المسارات الفرعية المركزة `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// خطأ: الجذر الأحادي (متوقف عن الاستخدام، وسيُزال)
import { ... } from "openclaw/plugin-sdk";
```

للاطلاع على مرجع المسارات الفرعية الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاصة بك، استخدم ملفات barrel المحلية (`api.ts` و`runtime-api.ts`) من أجل
الاستيرادات الداخلية — ولا تستورد Plugin الخاصة بك أبدًا عبر مسار SDK الخاص بها.

بالنسبة إلى Plugins المزوّدين، أبقِ المساعدات الخاصة بالمزوّد في ملفات barrel على
جذر تلك الحزمة ما لم يكن الحد الفاصل عامًا فعلًا. الأمثلة المضمّنة الحالية:

- Anthropic: مغلفات Claude للبث ومساعدات `service_tier` / beta
- OpenAI: بُناة المزوّد، ومساعدات النموذج الافتراضي، ومزوّدو realtime
- OpenRouter: باني المزوّد مع مساعدات الإعداد الأوّلي/الإعداد

إذا كان المساعد مفيدًا فقط داخل حزمة مزوّد مضمّنة واحدة، فأبقِه على ذلك
الحد الفاصل على جذر الحزمة بدلًا من ترقيته إلى `openclaw/plugin-sdk/*`.

لا تزال بعض حدود المساعدة المولدة `openclaw/plugin-sdk/<bundled-id>` موجودة من أجل
صيانة Plugins المضمّنة والتوافق، مثل
`plugin-sdk/feishu-setup` أو `plugin-sdk/zalo-setup`. تعامل مع هذه الأسطح
بوصفها أسطحًا محجوزة، لا بوصفها النمط الافتراضي للـ Plugins الخارجية الجديدة.

## قائمة التحقق قبل الإرسال

<Check>يحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>ملف البيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الإدخال `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم جميع الاستيرادات مسارات `plugin-sdk/<subpath>` المركزة</Check>
<Check>تستخدم الاستيرادات الداخلية وحدات محلية، لا استيرادات SDK ذاتية</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (Plugins داخل المستودع)</Check>

## اختبار إصدارات Beta

1. راقب وسوم إصدارات GitHub في [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم Beta مثل `v2026.3.N-beta.1`. ويمكنك أيضًا تفعيل الإشعارات لحساب OpenClaw الرسمي على X ‏[@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاصة بك مع وسم beta بمجرد ظهوره. تكون النافذة قبل الإصدار المستقر عادة بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاصة بك في قناة Discord ‏`plugin-forum` بعد الاختبار، إما بعبارة `all good` أو بما الذي تعطّل. وإذا لم يكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا حدث عطل، فافتح أو حدّث مشكلة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق الوسم `beta-blocker`. وضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون وضع وسوم على PRs، لذا يمثل العنوان إشارة جهة PR للمشرفين وللأتمتة. تُدمج المعيقات التي لها PR؛ أما المعيقات التي بلا PR فقد تُشحن على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار beta.
6. الصمت يعني أن كل شيء على ما يرام. وإذا فاتتك النافذة، فغالبًا سيصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins القنوات" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin قناة مراسلة
  </Card>
  <Card title="Plugins المزوّدين" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin مزوّد نماذج
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وAPI التسجيل
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS والبحث والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="الاختبار" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات وأنماط الاختبار
  </Card>
  <Card title="بيان Plugin" icon="file-json" href="/ar/plugins/manifest">
    مرجع مخطط البيان الكامل
  </Card>
</CardGroup>

## ذو صلة

- [بنية Plugin](/ar/plugins/architecture) — تعمق في البنية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع Plugin SDK
- [Manifest](/ar/plugins/manifest) — تنسيق بيان plugin
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدين
