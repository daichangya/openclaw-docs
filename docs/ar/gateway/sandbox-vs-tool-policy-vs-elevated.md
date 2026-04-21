---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'لماذا يتم حظر أداة: بيئة تشغيل sandbox، وسياسة السماح/المنع للأدوات، وبوابات exec المرتفعة الصلاحيات'
title: Sandbox مقابل سياسة الأدوات مقابل Elevated
x-i18n:
    generated_at: "2026-04-21T07:20:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox مقابل سياسة الأدوات مقابل Elevated

يحتوي OpenClaw على ثلاثة عناصر تحكم مرتبطة (لكنها مختلفة):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) يحدد **أين تعمل الأدوات** (واجهة sandbox الخلفية مقابل المضيف).
2. **سياسة الأدوات** (`tools.*` و`tools.sandbox.tools.*` و`agents.list[].tools.*`) تحدد **أي الأدوات متاحة/مسموح بها**.
3. **Elevated** (`tools.elevated.*` و`agents.list[].tools.elevated.*`) هو **مخرج خاص بـ exec فقط** للتشغيل خارج sandbox عندما تكون داخل sandbox (ويكون `gateway` افتراضيًا، أو `node` عندما يكون هدف exec مضبوطًا على `node`).

## تصحيح سريع

استخدم أداة الفحص لمعرفة ما الذي يفعله OpenClaw _فعليًا_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

وهي تطبع:

- نمط/nطاق sandbox الفعّال/وصول مساحة العمل
- ما إذا كانت الجلسة حاليًا داخل sandbox (الرئيسية مقابل غير الرئيسية)
- سياسة السماح/المنع الفعالة لأدوات sandbox (وما إذا كانت قادمة من الوكيل أو الإعداد العام أو الافتراضي)
- بوابات elevated ومسارات مفاتيح الإصلاح

## Sandbox: أين تعمل الأدوات

يتم التحكم في sandboxing بواسطة `agents.defaults.sandbox.mode`:

- `"off"`: كل شيء يعمل على المضيف.
- `"non-main"`: يتم وضع الجلسات غير الرئيسية فقط داخل sandbox (وهي “مفاجأة” شائعة للمجموعات/القنوات).
- `"all"`: كل شيء يعمل داخل sandbox.

راجع [Sandboxing](/ar/gateway/sandboxing) للاطلاع على المصفوفة الكاملة (النطاق، وربط مساحة العمل، والصور).

### Bind mounts ‏(فحص أمني سريع)

- `docker.binds` _يخترق_ نظام ملفات sandbox: أي شيء تربطه يصبح مرئيًا داخل الحاوية بالنمط الذي تحدده (`:ro` أو `:rw`).
- الوضع الافتراضي هو القراءة والكتابة إذا حذفت النمط؛ فضّل `:ro` للمصدر/الأسرار.
- تتجاهل القيمة `scope: "shared"` الروابط الخاصة بكل وكيل (تُطبَّق الروابط العامة فقط).
- يتحقق OpenClaw من مصادر الربط مرتين: أولًا على مسار المصدر المطبع، ثم مرة أخرى بعد حله عبر أعمق سلف موجود. ولا تتجاوز عمليات الهروب عبر الوالد الرمزي فحوصات المسار المحظور أو الجذر المسموح.
- لا تزال مسارات الأوراق غير الموجودة تُفحص بأمان. فإذا كان `/workspace/alias-out/new-file` يُحل عبر والد مرتبط رمزيًا إلى مسار محظور أو إلى خارج الجذور المسموح بها المضبوطة، يُرفض الربط.
- إن ربط `/var/run/docker.sock` يمنح فعليًا التحكم بالمضيف إلى sandbox؛ فلا تفعل ذلك إلا عن قصد.
- وصول مساحة العمل (`workspaceAccess: "ro"`/`"rw"`) مستقل عن أنماط الربط.

## سياسة الأدوات: ما الأدوات الموجودة/القابلة للاستدعاء

توجد طبقتان مهمتان:

- **ملف تعريف الأدوات**: `tools.profile` و`agents.list[].tools.profile` (قائمة السماح الأساسية)
- **ملف تعريف أدوات الموفّر**: `tools.byProvider[provider].profile` و`agents.list[].tools.byProvider[provider].profile`
- **سياسة الأدوات العامة/لكل وكيل**: `tools.allow`/`tools.deny` و`agents.list[].tools.allow`/`agents.list[].tools.deny`
- **سياسة أدوات الموفّر**: `tools.byProvider[provider].allow/deny` و`agents.list[].tools.byProvider[provider].allow/deny`
- **سياسة أدوات sandbox** (تُطبَّق فقط عند العمل داخل sandbox): ‏`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و`agents.list[].tools.sandbox.tools.*`

قواعد عامة:

- `deny` يفوز دائمًا.
- إذا كانت `allow` غير فارغة، فكل ما عدا ذلك يُعامل على أنه محظور.
- سياسة الأدوات هي نقطة التوقف الصارمة: لا يمكن لـ `/exec` تجاوز أداة `exec` المحظورة.
- لا يغيّر `/exec` إلا الإعدادات الافتراضية الخاصة بالجلسة للمرسلين المصرح لهم؛ وهو لا يمنح وصولًا إلى الأدوات.
  تقبل مفاتيح أدوات الموفّر إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

### مجموعات الأدوات (اختصارات)

تدعم سياسات الأدوات (العامة، والوكيل، وsandbox) إدخالات `group:*` التي تتوسع إلى عدة أدوات:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

المجموعات المتاحة:

- `group:runtime`: ‏`exec` و`process` و`code_execution` (يُقبل `bash` باعتباره
  اسمًا مستعارًا لـ `exec`)
- `group:fs`: ‏`read` و`write` و`edit` و`apply_patch`
- `group:sessions`: ‏`sessions_list` و`sessions_history` و`sessions_send` و`sessions_spawn` و`sessions_yield` و`subagents` و`session_status`
- `group:memory`: ‏`memory_search` و`memory_get`
- `group:web`: ‏`web_search` و`x_search` و`web_fetch`
- `group:ui`: ‏`browser` و`canvas`
- `group:automation`: ‏`cron` و`gateway`
- `group:messaging`: ‏`message`
- `group:nodes`: ‏`nodes`
- `group:agents`: ‏`agents_list`
- `group:media`: ‏`image` و`image_generate` و`video_generate` و`tts`
- `group:openclaw`: جميع أدوات OpenClaw المضمنة (باستثناء plugins الخاصة بالموفر)

## Elevated: "تشغيل على المضيف" خاص بـ exec فقط

لا يمنح Elevated أدوات إضافية؛ بل يؤثر فقط على `exec`.

- إذا كنت داخل sandbox، فإن `/elevated on` (أو `exec` مع `elevated: true`) يشغّل خارج sandbox (وقد تظل الموافقات مطلوبة).
- استخدم `/elevated full` لتخطي موافقات exec لهذه الجلسة.
- إذا كنت تعمل بالفعل مباشرة على المضيف، فإن elevated عمليًا بلا تأثير (لكنه يظل خاضعًا للبوابات).
- ليس Elevated **مقيدًا على مستوى Skill** ولا **يتجاوز** سياسة السماح/المنع للأدوات.
- لا يمنح Elevated تجاوزات عشوائية عبر المضيف من `host=auto`؛ بل يتبع قواعد هدف exec العادية ويحافظ فقط على `node` عندما يكون الهدف المضبوط/الخاص بالجلسة هو `node` بالفعل.
- `/exec` منفصل عن elevated. فهو يضبط فقط إعدادات exec الافتراضية لكل جلسة للمرسلين المصرح لهم.

البوابات:

- التفعيل: `tools.elevated.enabled` (واختياريًا `agents.list[].tools.elevated.enabled`)
- قوائم السماح للمرسلين: `tools.elevated.allowFrom.<provider>` (واختياريًا `agents.list[].tools.elevated.allowFrom.<provider>`)

راجع [Elevated Mode](/ar/tools/elevated).

## إصلاحات شائعة لـ "سجن sandbox"

### "الأداة X محظورة بواسطة سياسة أدوات sandbox"

مفاتيح الإصلاح (اختر واحدًا):

- تعطيل sandbox: ‏`agents.defaults.sandbox.mode=off` (أو لكل وكيل `agents.list[].sandbox.mode=off`)
- السماح بالأداة داخل sandbox:
  - أزلها من `tools.sandbox.tools.deny` (أو من `agents.list[].tools.sandbox.tools.deny` لكل وكيل)
  - أو أضفها إلى `tools.sandbox.tools.allow` (أو إلى allow لكل وكيل)

### "كنت أظن أن هذه هي الرئيسية، فلماذا هي داخل sandbox؟"

في نمط `"non-main"`، لا تكون مفاتيح المجموعة/القناة _رئيسية_. استخدم مفتاح الجلسة الرئيسية (كما يظهر في `sandbox explain`) أو بدّل النمط إلى `"off"`.

## راجع أيضًا

- [Sandboxing](/ar/gateway/sandboxing) -- المرجع الكامل لـ sandbox (الأنماط، والنطاقات، والواجهات الخلفية، والصور)
- [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) -- التجاوزات لكل وكيل وترتيب الأولوية
- [Elevated Mode](/ar/tools/elevated)
