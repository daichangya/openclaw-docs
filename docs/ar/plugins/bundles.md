---
read_when:
    - تريد تثبيت حزمة متوافقة مع Codex أو Claude أو Cursor
    - تحتاج إلى فهم كيفية تحويل OpenClaw لمحتوى الحزمة إلى ميزات أصلية
    - أنت تقوم بتصحيح اكتشاف الحزمة أو القدرات المفقودة
summary: ثبّت واستخدم حزم Codex وClaude وCursor كإضافات OpenClaw
title: حزم Plugin
x-i18n:
    generated_at: "2026-04-23T14:00:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# حزم Plugin

يمكن لـ OpenClaw تثبيت إضافات من ثلاثة أنظمة خارجية: **Codex** و**Claude**
و**Cursor**. وتُسمى هذه **حزمًا** — وهي حزم محتوى وبيانات وصفية
يحوّلها OpenClaw إلى ميزات أصلية مثل Skills وhooks وأدوات MCP.

<Info>
  لا تُعد الحزم **هي نفسها** إضافات OpenClaw الأصلية. فالإضافات الأصلية تعمل
  داخل العملية ويمكنها تسجيل أي قدرة. أما الحزم فهي حزم محتوى ذات
  تحويل انتقائي للميزات وحد ثقة أضيق.
</Info>

## لماذا توجد الحزم

تُنشر العديد من الإضافات المفيدة بصيغة Codex أو Claude أو Cursor. وبدلًا
من مطالبة المؤلفين بإعادة كتابتها كإضافات OpenClaw أصلية، يكتشف OpenClaw
هذه الصيغ ويحوّل المحتوى المدعوم منها إلى مجموعة الميزات الأصلية. وهذا يعني
أنه يمكنك تثبيت حزمة أوامر Claude أو حزمة Skills لـ Codex
واستخدامها فورًا.

## تثبيت حزمة

<Steps>
  <Step title="التثبيت من دليل أو أرشيف أو سوق">
    ```bash
    # دليل محلي
    openclaw plugins install ./my-bundle

    # أرشيف
    openclaw plugins install ./my-bundle.tgz

    # سوق Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="التحقق من الاكتشاف">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    تظهر الحزم بالشكل `Format: bundle` مع نوع فرعي `codex` أو `claude` أو `cursor`.

  </Step>

  <Step title="إعادة التشغيل والاستخدام">
    ```bash
    openclaw gateway restart
    ```

    تصبح الميزات المحوّلة (Skills وhooks وأدوات MCP وإعدادات LSP الافتراضية) متاحة في الجلسة التالية.

  </Step>
</Steps>

## ما الذي يحوّله OpenClaw من الحزم

لا تعمل كل ميزات الحزم في OpenClaw حاليًا. إليك ما يعمل وما
يُكتشف لكنه لم يُوصّل بعد.

### المدعوم حاليًا

| الميزة         | كيفية التحويل                                                                                | ينطبق على      |
| -------------- | -------------------------------------------------------------------------------------------- | -------------- |
| محتوى Skills   | تُحمّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw                                 | جميع الصيغ     |
| الأوامر        | يُتعامل مع `commands/` و`.cursor/commands/` على أنها جذور Skills                            | Claude, Cursor |
| حزم hook       | تخطيطات `HOOK.md` + `handler.ts` بأسلوب OpenClaw                                            | Codex          |
| أدوات MCP      | يُدمج إعداد MCP في إعدادات Pi المضمنة؛ وتُحمّل خوادم stdio وHTTP المدعومة                  | جميع الصيغ     |
| خوادم LSP      | تُدمج ملفات `.lsp.json` في Claude و`lspServers` المعلنة في البيان في إعدادات Pi LSP الافتراضية المضمنة | Claude         |
| الإعدادات      | يُستورد `settings.json` في Claude كإعدادات Pi مضمنة افتراضية                                | Claude         |

#### محتوى Skills

- تُحمّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw
- يُتعامل مع جذور `commands` في Claude على أنها جذور Skills إضافية
- يُتعامل مع جذور `.cursor/commands` في Cursor على أنها جذور Skills إضافية

وهذا يعني أن ملفات أوامر Markdown في Claude تعمل من خلال محمّل Skills
العادي في OpenClaw. كما تعمل أوامر Markdown في Cursor عبر المسار نفسه.

#### حزم hook

- تعمل جذور hook في الحزمة **فقط** عندما تستخدم تخطيط حزمة hook العادي
  في OpenClaw. واليوم، هذه هي الحالة المتوافقة مع Codex في المقام الأول:
  - `HOOK.md`
  - `handler.ts` أو `handler.js`

#### MCP لـ Pi

- يمكن للحزم المفعّلة أن تضيف إعداد خادم MCP
- يدمج OpenClaw إعداد MCP الخاص بالحزمة في إعدادات Pi المضمنة الفعلية تحت
  `mcpServers`
- يعرّض OpenClaw أدوات MCP المدعومة من الحزمة أثناء أدوار وكيل Pi المضمن
  عبر تشغيل خوادم stdio أو الاتصال بخوادم HTTP
- تتضمن ملفات تعريف الأدوات `coding` و`messaging` أدوات MCP الخاصة بالحزم
  افتراضيًا؛ استخدم `tools.deny: ["bundle-mcp"]` لتعطيلها لوكيل أو Gateway
- لا تزال إعدادات Pi المحلية الخاصة بالمشروع تُطبّق بعد إعدادات الحزمة الافتراضية،
  لذلك يمكن لإعدادات مساحة العمل تجاوز إدخالات MCP الخاصة بالحزمة عند الحاجة
- تُرتّب فهارس أدوات MCP الخاصة بالحزم ترتيبًا حتميًا قبل التسجيل، بحيث
  لا تؤدي تغييرات ترتيب `listTools()` في المنبع إلى إرباك كتل أدوات prompt-cache

##### وسائل النقل

يمكن لخوادم MCP استخدام نقل stdio أو HTTP:

**Stdio** يشغّل عملية فرعية:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** يتصل بخادم MCP قيد التشغيل عبر `sse` افتراضيًا، أو `streamable-http` عند الطلب:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- يمكن ضبط `transport` على `"streamable-http"` أو `"sse"`؛ وعند إغفاله يستخدم OpenClaw القيمة `sse`
- يُسمح فقط بمخططات URL من نوع `http:` و`https:`
- تدعم قيم `headers` الاستيفاء بصيغة `${ENV_VAR}`
- يُرفض إدخال الخادم الذي يحتوي على كل من `command` و`url`
- تُحجب بيانات اعتماد URL ‏(userinfo ومعلمات الاستعلام) من أوصاف
  الأدوات والسجلات
- يتجاوز `connectionTimeoutMs` مهلة الاتصال الافتراضية البالغة 30 ثانية لكل من نقل stdio وHTTP

##### تسمية الأدوات

يسجّل OpenClaw أدوات MCP الخاصة بالحزم بأسماء آمنة للمزوّد بالشكل
`serverName__toolName`. فعلى سبيل المثال، إذا كان الخادم بالمفتاح `"vigil-harbor"` يعرّض
الأداة `memory_search`، فستُسجَّل باسم `vigil-harbor__memory_search`.

- تُستبدل الأحرف خارج `A-Za-z0-9_-` بـ `-`
- تُقيَّد بادئات الخادم بـ 30 حرفًا كحد أقصى
- تُقيَّد أسماء الأدوات الكاملة بـ 64 حرفًا كحد أقصى
- تعود أسماء الخوادم الفارغة إلى `mcp`
- تُفكّ الأسماء المعقّمة المتصادمة باستخدام لواحق رقمية
- يكون ترتيب الأدوات النهائي المعروض حتميًا بحسب الاسم الآمن للحفاظ على استقرار ذاكرة التخزين المؤقت في أدوار Pi المتكررة
- يتعامل ترشيح ملفات التعريف مع جميع الأدوات الصادرة من خادم MCP واحد في الحزمة على أنها مملوكة للإضافة
  تحت `bundle-mcp`، لذلك يمكن لقوائم السماح والمنع في ملفات التعريف أن تتضمن إما
  أسماء الأدوات المعروضة الفردية أو مفتاح الإضافة `bundle-mcp`

#### إعدادات Pi المضمنة

- يُستورد `settings.json` في Claude كإعدادات Pi مضمنة افتراضية عندما تكون
  الحزمة مفعّلة
- يعقّم OpenClaw مفاتيح تجاوز shell قبل تطبيقها

المفاتيح المعقّمة:

- `shellPath`
- `shellCommandPrefix`

#### Pi LSP المضمن

- يمكن لحزم Claude المفعّلة أن تضيف إعداد خادم LSP
- يحمّل OpenClaw ملف `.lsp.json` بالإضافة إلى أي مسارات `lspServers` مُعلنة في البيان
- يُدمج إعداد LSP الخاص بالحزمة في إعدادات Pi LSP الافتراضية المضمنة الفعلية
- لا يمكن تشغيل سوى خوادم LSP المدعومة المعتمدة على stdio حاليًا؛ أما وسائل النقل غير المدعومة
  فتظل تظهر في `openclaw plugins inspect <id>`

### يُكتشف ولكن لا يُنفّذ

يتم التعرّف على هذه العناصر وعرضها في أدوات التشخيص، لكن OpenClaw لا يشغّلها:

- `agents` و`hooks.json` للأتمتة و`outputStyles` في Claude
- `.cursor/agents` و`.cursor/hooks.json` و`.cursor/rules` في Cursor
- بيانات metadata المضمنة/الخاصة بالتطبيق في Codex خارج تقارير القدرات

## صيغ الحزم

<AccordionGroup>
  <Accordion title="حزم Codex">
    العلامات: `.codex-plugin/plugin.json`

    المحتوى الاختياري: `skills/` و`hooks/` و`.mcp.json` و`.app.json`

    تتوافق حزم Codex مع OpenClaw بأفضل شكل عندما تستخدم جذور Skills وأدلة
    حزم hook بأسلوب OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="حزم Claude">
    وضعا اكتشاف:

    - **قائم على البيان:** `.claude-plugin/plugin.json`
    - **من دون بيان:** تخطيط Claude الافتراضي (`skills/` و`commands/` و`agents/` و`hooks/` و`.mcp.json` و`.lsp.json` و`settings.json`)

    سلوك خاص بـ Claude:

    - يُتعامل مع `commands/` على أنه محتوى Skills
    - يُستورد `settings.json` إلى إعدادات Pi المضمنة (وتُعقّم مفاتيح تجاوز shell)
    - يعرض `.mcp.json` أدوات stdio المدعومة إلى Pi المضمن
    - يُحمّل `.lsp.json` بالإضافة إلى مسارات `lspServers` المُعلنة في البيان إلى إعدادات Pi LSP الافتراضية المضمنة
    - يُكتشف `hooks/hooks.json` لكنه لا يُنفّذ
    - تكون مسارات المكونات المخصصة في البيان إضافية (فهي توسّع القيم الافتراضية ولا تستبدلها)

  </Accordion>

  <Accordion title="حزم Cursor">
    العلامات: `.cursor-plugin/plugin.json`

    المحتوى الاختياري: `skills/` و`.cursor/commands/` و`.cursor/agents/` و`.cursor/rules/` و`.cursor/hooks.json` و`.mcp.json`

    - يُتعامل مع `.cursor/commands/` على أنه محتوى Skills
    - تكون `.cursor/rules/` و`.cursor/agents/` و`.cursor/hooks.json` للاكتشاف فقط

  </Accordion>
</AccordionGroup>

## أسبقية الاكتشاف

يفحص OpenClaw أولًا عن صيغة الإضافة الأصلية:

1. `openclaw.plugin.json` أو `package.json` صالح يحتوي على `openclaw.extensions` — يُتعامل معه على أنه **Plugin أصلي**
2. علامات الحزمة (`.codex-plugin/` أو `.claude-plugin/` أو تخطيط Claude/Cursor الافتراضي) — يُتعامل معها على أنها **حزمة**

إذا احتوى دليل على كليهما، يستخدم OpenClaw المسار الأصلي. وهذا يمنع
تثبيت الحزم ثنائية الصيغة جزئيًا كحزم.

## تبعيات وقت التشغيل والتنظيف

- تُشحَن تبعيات وقت تشغيل الإضافات المجمّعة داخل حزمة OpenClaw تحت
  `dist/*`. ولا يشغّل OpenClaw الأمر `npm install` عند بدء التشغيل للإضافات
  المجمّعة؛ إذ تتحمل عملية الإصدار مسؤولية شحن حمولة كاملة من
  التبعيات المجمّعة (راجع قاعدة التحقق بعد النشر في
  [الإصدار](/ar/reference/RELEASING)).

## الأمان

تمتلك الحزم حد ثقة أضيق من الإضافات الأصلية:

- لا يحمّل OpenClaw وحدات وقت تشغيل الحزم العشوائية داخل العملية
- يجب أن تبقى مسارات Skills وحزم hook داخل جذر الإضافة (مع التحقق من الحدود)
- تُقرأ ملفات الإعدادات باستخدام فحوصات الحدود نفسها
- قد تُشغَّل خوادم MCP المدعومة من نوع stdio كعمليات فرعية

وهذا يجعل الحزم أكثر أمانًا افتراضيًا، لكن يجب مع ذلك اعتبار الحزم الخارجية
محتوى موثوقًا بالنسبة إلى الميزات التي تعرّضها.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="يتم اكتشاف الحزمة لكن القدرات لا تعمل">
    شغّل `openclaw plugins inspect <id>`. إذا كانت القدرة مدرجة لكنها موسومة
    على أنها غير موصولة، فهذا حدّ من حدود المنتج — وليس تثبيتًا معطوبًا.
  </Accordion>

  <Accordion title="لا تظهر ملفات أوامر Claude">
    تأكد من أن الحزمة مفعّلة وأن ملفات Markdown موجودة داخل جذر
    `commands/` أو `skills/` مكتشف.
  </Accordion>

  <Accordion title="لا تُطبَّق إعدادات Claude">
    لا يُدعم إلا إعدادات Pi المضمنة من `settings.json`. ولا يتعامل OpenClaw
    مع إعدادات الحزمة على أنها ترقيعات إعداد خام.
  </Accordion>

  <Accordion title="لا تُنفَّذ hooks في Claude">
    `hooks/hooks.json` مخصص للاكتشاف فقط. إذا كنت تحتاج إلى hooks قابلة للتشغيل، فاستخدم
    تخطيط حزمة hook في OpenClaw أو اشحن Plugin أصليًا.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [تثبيت الإضافات وضبطها](/ar/tools/plugin)
- [بناء الإضافات](/ar/plugins/building-plugins) — إنشاء Plugin أصلي
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان الأصلي
