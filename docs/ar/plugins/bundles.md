---
read_when:
    - أنت تريد تثبيت حزمة متوافقة مع Codex أو Claude أو Cursor
    - أنت تحتاج إلى فهم كيفية قيام OpenClaw بربط محتوى الحزمة بالميزات الأصلية
    - أنت تستكشف أخطاء اكتشاف الحِزم أو الإمكانات المفقودة وإصلاحها
summary: تثبيت واستخدام حِزم Codex وClaude وCursor كـ Plugins في OpenClaw
title: حِزم Plugin
x-i18n:
    generated_at: "2026-04-23T07:27:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c9e48738e059c302157dd8733178109cf34840f32a3d7b5b767ac019fbc581b
    source_path: plugins/bundles.md
    workflow: 15
---

# حِزم Plugin

يمكن لـ OpenClaw تثبيت Plugins من ثلاثة أنظمة خارجية: **Codex** و**Claude**،
و**Cursor**. تُسمى هذه **حِزم** — وهي حزم محتوى وبيانات وصفية يقوم
OpenClaw بربطها بميزات أصلية مثل skills وhooks وأدوات MCP.

<Info>
  الحِزم **ليست** مثل Plugins الأصلية في OpenClaw. تعمل Plugins الأصلية
  داخل العملية نفسها ويمكنها تسجيل أي Capability. أما الحِزم فهي حزم محتوى مع
  ربط انتقائي للميزات وحد ثقة أضيق.
</Info>

## لماذا توجد الحِزم

تُنشر العديد من Plugins المفيدة بصيغة Codex أو Claude أو Cursor. وبدلًا
من مطالبة المؤلفين بإعادة كتابتها كـ Plugins أصلية في OpenClaw، يقوم OpenClaw
باكتشاف هذه الصيغ وربط محتواها المدعوم بمجموعة الميزات الأصلية. وهذا يعني
أنه يمكنك تثبيت حزمة أوامر Claude أو حزمة Skills من Codex
واستخدامها فورًا.

## تثبيت حزمة

<Steps>
  <Step title="التثبيت من دليل أو أرشيف أو marketplace">
    ```bash
    # دليل محلي
    openclaw plugins install ./my-bundle

    # أرشيف
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="التحقق من الاكتشاف">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    تظهر الحِزم كـ `Format: bundle` مع نوع فرعي `codex` أو `claude` أو `cursor`.

  </Step>

  <Step title="أعد التشغيل واستخدم">
    ```bash
    openclaw gateway restart
    ```

    تصبح الميزات المربوطة (skills وhooks وأدوات MCP وإعدادات LSP الافتراضية) متاحة في الجلسة التالية.

  </Step>
</Steps>

## ما الذي يربطه OpenClaw من الحِزم

ليست كل ميزة في الحزمة تعمل داخل OpenClaw اليوم. إليك ما يعمل وما
يُكتشف لكنه غير موصول بعد.

### المدعوم حاليًا

| الميزة | كيفية الربط | ينطبق على |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| محتوى Skills | تُحمّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw | جميع الصيغ |
| الأوامر | يُتعامل مع `commands/` و`.cursor/commands/` على أنها جذور Skills | Claude, Cursor |
| حِزم Hooks | تخطيطات `HOOK.md` + `handler.ts` بأسلوب OpenClaw | Codex |
| أدوات MCP | يُدمج تكوين MCP الخاص بالحزمة في إعدادات Pi المضمّن؛ وتُحمّل خوادم stdio وHTTP المدعومة | جميع الصيغ |
| خوادم LSP | يتم دمج `.lsp.json` من Claude و`lspServers` المعلنة في manifest في إعدادات LSP الافتراضية لـ Pi المضمّن | Claude |
| الإعدادات | يتم استيراد `settings.json` من Claude كإعدادات افتراضية لـ Pi المضمّن | Claude |

#### محتوى Skills

- تُحمّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw
- تُعامل جذور `commands` في Claude على أنها جذور Skills إضافية
- تُعامل جذور `.cursor/commands` في Cursor على أنها جذور Skills إضافية

هذا يعني أن ملفات أوامر Markdown الخاصة بـ Claude تعمل عبر أداة تحميل Skills
العادية في OpenClaw. وتعمل أوامر Markdown الخاصة بـ Cursor عبر المسار نفسه.

#### حِزم Hooks

- تعمل جذور hooks في الحزمة **فقط** عندما تستخدم تخطيط حزمة hooks العادي
  في OpenClaw. واليوم هذه هي الحالة المتوافقة أساسًا مع Codex:
  - `HOOK.md`
  - `handler.ts` أو `handler.js`

#### MCP لـ Pi

- يمكن للحِزم المفعلة أن تساهم في تكوين خادم MCP
- يدمج OpenClaw تكوين MCP الخاص بالحزمة في إعدادات Pi المضمّن الفعالة على شكل
  `mcpServers`
- يكشف OpenClaw أدوات MCP المدعومة من الحزمة أثناء أدوار وكيل Pi المضمّن عبر
  تشغيل خوادم stdio أو الاتصال بخوادم HTTP
- تتضمن ملفات تعريف الأدوات `coding` و`messaging` أدوات MCP الخاصة بالحزمة
  افتراضيًا؛ استخدم `tools.deny: ["bundle-mcp"]` لتعطيلها لوكيل أو Gateway
- تظل إعدادات Pi المحلية للمشروع مطبقة بعد إعدادات الحزمة الافتراضية، لذا
  يمكن لإعدادات مساحة العمل تجاوز إدخالات MCP الخاصة بالحزمة عند الحاجة
- تُرتب فهارس أدوات MCP الخاصة بالحزمة ترتيبًا حتميًا قبل التسجيل، بحيث لا تؤدي
  تغييرات ترتيب upstream في `listTools()` إلى اضطراب كتل أدوات prompt-cache

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

- يمكن ضبط `transport` على `"streamable-http"` أو `"sse"`؛ وعند حذفه يستخدم OpenClaw القيمة `sse`
- لا يُسمح إلا بمخططات URL من نوع `http:` و`https:`
- تدعم قيم `headers` الاستيفاء `${ENV_VAR}`
- يُرفض إدخال الخادم الذي يحتوي على كل من `command` و`url`
- تُحجب بيانات اعتماد URL ‏(userinfo ومعلمات الاستعلام) من
  أوصاف الأدوات والسجلات
- يتجاوز `connectionTimeoutMs` مهلة الاتصال الافتراضية البالغة 30 ثانية
  لكل من نقلي stdio وHTTP

##### تسمية الأدوات

يسجل OpenClaw أدوات MCP الخاصة بالحزمة بأسماء آمنة للمزود بالصيغة
`serverName__toolName`. على سبيل المثال، إذا كان الخادم ذو المفتاح `"vigil-harbor"` يوفّر
الأداة `memory_search` فسيتم تسجيلها باسم `vigil-harbor__memory_search`.

- تُستبدل الأحرف خارج `A-Za-z0-9_-` بـ `-`
- تُحد البادئات الخاصة بالخادم عند 30 حرفًا
- تُحد أسماء الأدوات الكاملة عند 64 حرفًا
- تعود أسماء الخوادم الفارغة إلى `mcp`
- يُزال غموض الأسماء المُنقحة المتصادمة باستخدام لواحق رقمية
- يكون الترتيب النهائي المكشوف للأدوات حتميًا حسب الاسم الآمن لإبقاء
  التخزين المؤقت مستقرًا عبر أدوار Pi المتكررة
- يتعامل ترشيح الملفات التعريفية مع جميع الأدوات من خادم MCP واحد في الحزمة على أنها مملوكة لـ Plugin
  باسم `bundle-mcp`، لذلك يمكن أن تتضمن قوائم السماح والمنع للملفات التعريفية
  إما أسماء الأدوات المكشوفة الفردية أو مفتاح Plugin باسم `bundle-mcp`

#### إعدادات Pi المضمّن

- يتم استيراد `settings.json` من Claude كإعدادات افتراضية لـ Pi المضمّن عندما
  تكون الحزمة مفعلة
- يقوم OpenClaw بتنقية مفاتيح تجاوز shell قبل تطبيقها

المفاتيح المنقاة:

- `shellPath`
- `shellCommandPrefix`

#### ‏LSP لـ Pi المضمّن

- يمكن لحِزم Claude المفعلة أن تساهم في تكوين خادم LSP
- يحمّل OpenClaw ملف `.lsp.json` بالإضافة إلى أي مسارات `lspServers` مُعلنة في manifest
- يُدمج تكوين LSP الخاص بالحزمة في إعدادات LSP الافتراضية الفعالة لـ Pi المضمّن
- لا يمكن تشغيل اليوم إلا خوادم LSP المدعومة والمعتمدة على stdio؛ أما وسائل النقل
  غير المدعومة فتظل تظهر في `openclaw plugins inspect <id>`

### مكتشف ولكن غير منفذ

يتم التعرف على هذه العناصر وإظهارها في التشخيصات، لكن OpenClaw لا يشغّلها:

- `agents` و`hooks.json` automation و`outputStyles` الخاصة بـ Claude
- `.cursor/agents` و`.cursor/hooks.json` و`.cursor/rules` الخاصة بـ Cursor
- البيانات الوصفية المضمنة/الخاصة بالتطبيق في Codex خارج نطاق تقارير Capability

## صيغ الحِزم

<AccordionGroup>
  <Accordion title="حِزم Codex">
    العلامات: `.codex-plugin/plugin.json`

    المحتوى الاختياري: `skills/` و`hooks/` و`.mcp.json` و`.app.json`

    تتلاءم حِزم Codex مع OpenClaw بصورة أفضل عندما تستخدم جذور Skills و
    أدلة حِزم hooks بأسلوب OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="حِزم Claude">
    وضعا اكتشاف:

    - **معتمدة على Manifest:** `.claude-plugin/plugin.json`
    - **من دون Manifest:** تخطيط Claude الافتراضي (`skills/` و`commands/` و`agents/` و`hooks/` و`.mcp.json` و`.lsp.json` و`settings.json`)

    السلوك الخاص بـ Claude:

    - يُتعامل مع `commands/` على أنه محتوى Skills
    - يتم استيراد `settings.json` إلى إعدادات Pi المضمّن (مع تنقية مفاتيح تجاوز shell)
    - يكشف `.mcp.json` أدوات stdio المدعومة لـ Pi المضمّن
    - يُحمَّل `.lsp.json` بالإضافة إلى مسارات `lspServers` المعلنة في manifest إلى إعدادات LSP الافتراضية لـ Pi المضمّن
    - يتم اكتشاف `hooks/hooks.json` لكنه لا يُنفَّذ
    - تكون مسارات المكونات المخصصة في manifest إضافية (فهي توسّع الإعدادات الافتراضية ولا تستبدلها)

  </Accordion>

  <Accordion title="حِزم Cursor">
    العلامات: `.cursor-plugin/plugin.json`

    المحتوى الاختياري: `skills/` و`.cursor/commands/` و`.cursor/agents/` و`.cursor/rules/` و`.cursor/hooks.json` و`.mcp.json`

    - يُتعامل مع `.cursor/commands/` على أنه محتوى Skills
    - `.cursor/rules/` و`.cursor/agents/` و`.cursor/hooks.json` للاكتشاف فقط

  </Accordion>
</AccordionGroup>

## أولوية الاكتشاف

يتحقق OpenClaw من صيغة Plugin الأصلية أولًا:

1. `openclaw.plugin.json` أو `package.json` صالح يحتوي على `openclaw.extensions` — يُتعامل معه كـ **Plugin أصلي**
2. علامات الحزمة (`.codex-plugin/` أو `.claude-plugin/` أو تخطيط Claude/Cursor الافتراضي) — يُتعامل معها كـ **حزمة**

إذا كان الدليل يحتوي على الاثنين معًا، يستخدم OpenClaw المسار الأصلي. وهذا يمنع
تثبيت الحزم ثنائية الصيغة جزئيًا على أنها حِزم.

## تبعيات بيئة التشغيل والتنظيف

- تُشحن تبعيات بيئة التشغيل الخاصة بالـ Plugin المضمّن داخل حزمة OpenClaw تحت
  `dist/*`. لا يشغّل OpenClaw الأمر `npm install` عند بدء التشغيل من أجل Plugins
  المضمّنة؛ إذ تقع على مسار الإصدار مسؤولية شحن حمولة تبعيات
  كاملة للـ Plugin المضمّن (راجع قاعدة التحقق بعد النشر في
  [Releasing](/ar/reference/RELEASING)).
- تتخلص تشغيلات الوكلاء الفرعيين التي تشغّل خوادم MCP المضمّنة من عملاء MCP
  هؤلاء عبر مسار تنظيف بيئة التشغيل المشترك عند خروج الوكيل الفرعي، بحيث
  لا تؤدي دورات حياة الوكلاء الفرعيين إلى تسرب عمليات stdio الابنة أو اتصالات
  MCP الطويلة الأمد عبر الأدوار.

## الأمان

تملك الحِزم حد ثقة أضيق من Plugins الأصلية:

- لا يحمّل OpenClaw وحدات بيئة تشغيل عشوائية من الحِزم داخل العملية
- يجب أن تبقى مسارات Skills وحِزم hook داخل جذر Plugin (مع فحص الحدود)
- تتم قراءة ملفات الإعدادات بفحوصات الحدود نفسها
- قد يتم تشغيل خوادم MCP المدعومة والمعتمدة على stdio كعمليات فرعية

وهذا يجعل الحِزم أكثر أمانًا افتراضيًا، لكن ينبغي لك مع ذلك معاملة الحِزم الخارجية
على أنها محتوى موثوق للميزات التي تكشفها.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="يتم اكتشاف الحزمة لكن الإمكانات لا تعمل">
    شغّل `openclaw plugins inspect <id>`. إذا كانت Capability مدرجة لكن مميزة على
    أنها غير موصولة، فهذا حدّ في المنتج — وليس تثبيتًا معطّلًا.
  </Accordion>

  <Accordion title="ملفات أوامر Claude لا تظهر">
    تأكد من أن الحزمة مفعلة وأن ملفات Markdown موجودة داخل جذر
    `commands/` أو `skills/` تم اكتشافه.
  </Accordion>

  <Accordion title="إعدادات Claude لا تُطبّق">
    لا يُدعم إلا إعدادات Pi المضمّن القادمة من `settings.json`. ولا يتعامل OpenClaw
    مع إعدادات الحزمة على أنها ترقيعات تكوين خام.
  </Accordion>

  <Accordion title="لا يتم تنفيذ hooks الخاصة بـ Claude">
    `hooks/hooks.json` للاكتشاف فقط. إذا كنت تحتاج إلى hooks قابلة للتشغيل، فاستخدم
    تخطيط حزمة hooks في OpenClaw أو اشحن Plugin أصليًا.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [تثبيت Plugins وتكوينها](/ar/tools/plugin)
- [بناء Plugins](/ar/plugins/building-plugins) — إنشاء Plugin أصلي
- [Plugin Manifest](/ar/plugins/manifest) — مخطط manifest الأصلي
