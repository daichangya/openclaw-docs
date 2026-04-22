---
read_when:
    - تريد أن يحول الوكلاء التصحيحات أو الإجراءات القابلة لإعادة الاستخدام إلى Skills لمساحة العمل
    - أنت تقوم بتكوين ذاكرة Skills إجرائية
    - أنت تقوم بتصحيح سلوك أداة `skill_workshop`
    - أنت تقرر ما إذا كان ينبغي تفعيل الإنشاء التلقائي للـ Skills
summary: الالتقاط التجريبي للإجراءات القابلة لإعادة الاستخدام كـ Skills لمساحة العمل مع المراجعة، والموافقة، والحجر، والتحديث السريع للـ Skills
title: Plugin Skill Workshop
x-i18n:
    generated_at: "2026-04-22T04:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Plugin Skill Workshop

يُعد Skill Workshop **تجريبيًا**. وهو معطّل افتراضيًا، وقد تتغير
خوارزميات الالتقاط وprompts الخاصة بالمراجع بين الإصدارات، ويجب استخدام
عمليات الكتابة التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة مخرجات
الوضع المعلّق أولًا.

Skill Workshop هو ذاكرة إجرائية لـ Skills مساحة العمل. فهو يتيح للوكيل تحويل
سير العمل القابلة لإعادة الاستخدام، وتصحيحات المستخدم، والإصلاحات التي تم الوصول إليها بصعوبة، والمزالق المتكررة
إلى ملفات `SKILL.md` تحت:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

وهذا يختلف عن الذاكرة طويلة الأمد:

- تقوم **Memory** بتخزين الحقائق والتفضيلات والكيانات والسياق السابق.
- تقوم **Skills** بتخزين الإجراءات القابلة لإعادة الاستخدام التي ينبغي على الوكيل اتباعها في المهام المستقبلية.
- يُعد **Skill Workshop** الجسر من دور مفيد إلى Skill متين
  في مساحة العمل، مع فحوصات أمان وموافقة اختيارية.

يكون Skill Workshop مفيدًا عندما يتعلم الوكيل إجراءً مثل:

- كيفية التحقق من أصول GIF المتحركة ذات المصادر الخارجية
- كيفية استبدال أصول لقطات الشاشة والتحقق من الأبعاد
- كيفية تشغيل سيناريو QA خاص بالمستودع
- كيفية تصحيح فشل متكرر في مزوّد
- كيفية إصلاح ملاحظة محلية قديمة خاصة بسير العمل

وهو غير مخصص لما يلي:

- حقائق مثل "المستخدم يحب اللون الأزرق"
- الذاكرة الذاتية العامة الواسعة
- أرشفة النصوص الخام
- الأسرار أو بيانات الاعتماد أو نصوص prompts المخفية
- التعليمات لمرة واحدة التي لن تتكرر

## الحالة الافتراضية

إن Plugin المرفق **تجريبي** و**معطّل افتراضيًا** ما لم يتم
تفعيله صراحةً في `plugins.entries.skill-workshop`.

لا يضبط بيان Plugin القيمة `enabledByDefault: true`. أما القيمة الافتراضية `enabled: true`
داخل مخطط تكوين Plugin فلا تنطبق إلا بعد أن يكون إدخال Plugin قد تم اختياره وتحميله بالفعل.

تعني الصفة التجريبية ما يلي:

- Plugin مدعوم بالقدر الكافي للاختبار الاختياري والاستخدام الداخلي
- يمكن أن تتطور مساحة تخزين المقترحات، وحدود المراجع، وخوارزميات الالتقاط
- تُعد الموافقة المعلقة وضع البداية الموصى به
- التطبيق التلقائي مخصص لإعدادات شخصية/مساحات عمل موثوقة، وليس للبيئات المشتركة أو
  البيئات العدائية ذات الإدخال الكثيف

## التفعيل

أدنى تكوين آمن:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

باستخدام هذا التكوين:

- تكون أداة `skill_workshop` متاحة
- يتم إدراج التصحيحات القابلة لإعادة الاستخدام الصريحة كمقترحات معلقة
- يمكن لتمريرات المراجع المعتمدة على الحدود اقتراح تحديثات للـ Skills
- لا يُكتب أي ملف Skill حتى يتم تطبيق مقترح معلق

استخدم عمليات الكتابة التلقائية فقط في مساحات العمل الموثوقة:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

ما زالت القيمة `approvalPolicy: "auto"` تستخدم الماسح نفسه ومسار الحجر. وهي
لا تطبق المقترحات التي تحتوي على نتائج حرجة.

## التكوين

| المفتاح | الافتراضي | النطاق / القيم | المعنى |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | يفعّل Plugin بعد تحميل إدخال Plugin.                 |
| `autoCapture`        | `true`      | boolean                                     | يفعّل الالتقاط/المراجعة بعد الدور في الأدوار الناجحة للوكيل.          |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | إدراج المقترحات في قائمة الانتظار أو كتابة المقترحات الآمنة تلقائيًا.               |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | يختار الالتقاط الصريح للتصحيحات، أو مراجع LLM، أو كليهما، أو لا شيء. |
| `reviewInterval`     | `15`        | `1..200`                                    | تشغيل المراجع بعد هذا العدد من الأدوار الناجحة.                       |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | تشغيل المراجع بعد هذا العدد من استدعاءات الأدوات المرصودة.                    |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | المهلة الزمنية لتشغيل المراجع المضمن.                               |
| `maxPending`         | `50`        | `1..200`                                    | الحد الأقصى للمقترحات المعلقة/المحجورة المحفوظة لكل مساحة عمل.                |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | الحد الأقصى لحجم ملف Skill/ملف الدعم المُنشأ.                               |

الملفات الشخصية الموصى بها:

```json5
// متحفظ: استخدام الأداة الصريح فقط، من دون التقاط تلقائي.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// المراجعة أولًا: التقط تلقائيًا، لكن يتطلب موافقة.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// أتمتة موثوقة: اكتب المقترحات الآمنة فورًا.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// منخفض التكلفة: لا يوجد استدعاء LLM للمراجع، فقط عبارات التصحيح الصريحة.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## مسارات الالتقاط

يمتلك Skill Workshop ثلاثة مسارات للالتقاط.

### اقتراحات الأداة

يمكن للنموذج استدعاء `skill_workshop` مباشرةً عندما يرى إجراءً قابلاً لإعادة الاستخدام
أو عندما يطلب المستخدم منه حفظ/تحديث Skill.

هذا هو المسار الأكثر صراحة ويعمل حتى مع `autoCapture: false`.

### الالتقاط الاستدلالي

عندما يكون `autoCapture` مفعّلًا ويكون `reviewMode` هو `heuristic` أو `hybrid`، يقوم
Plugin بمسح الأدوار الناجحة بحثًا عن عبارات تصحيح صريحة من المستخدم:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

ينشئ هذا الالتقاط الاستدلالي مقترحًا من أحدث تعليمات مستخدم مطابقة. ويستخدم
تلميحات الموضوع لاختيار أسماء Skills لسير العمل الشائعة:

- مهام GIF المتحرك -> `animated-gif-workflow`
- مهام لقطات الشاشة أو الأصول -> `screenshot-asset-workflow`
- مهام QA أو السيناريوهات -> `qa-scenario-workflow`
- مهام GitHub PR -> `github-pr-workflow`
- التراجع -> `learned-workflows`

الالتقاط الاستدلالي ضيق عمدًا. فهو مخصص للتصحيحات الواضحة وملاحظات
العمليات القابلة للتكرار، وليس للتلخيص العام للنصوص.

### مراجع LLM

عندما يكون `autoCapture` مفعّلًا ويكون `reviewMode` هو `llm` أو `hybrid`، يقوم
Plugin بتشغيل مراجع مضمن مضغوط بعد الوصول إلى الحدود.

يتلقى المراجع ما يلي:

- نص النص الحديث، بحد أقصى آخر 12,000 حرف
- حتى 12 Skill موجودة في مساحة العمل
- حتى 2,000 حرف من كل Skill موجودة
- تعليمات JSON فقط

لا يمتلك المراجع أي أدوات:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

يمكنه إرجاع:

```json
{ "action": "none" }
```

أو مقترح Skill واحد:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "QA لأصول الوسائط",
  "reason": "سير عمل قابل لإعادة الاستخدام لقبول الوسائط المتحركة",
  "description": "تحقق من الوسائط المتحركة ذات المصادر الخارجية قبل استخدامها في المنتج.",
  "body": "## سير العمل\n\n- تحقق من وجود حركة فعلية.\n- سجّل الإسناد.\n- خزّن نسخة محلية معتمدة.\n- تحقّق داخل UI الخاص بالمنتج قبل الرد النهائي."
}
```

ويمكنه أيضًا الإلحاق بـ Skill موجودة:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "سير عمل سيناريو QA",
  "reason": "تحتاج QA الخاصة بالوسائط المتحركة إلى فحوصات قابلة لإعادة الاستخدام",
  "description": "سير عمل سيناريو QA.",
  "section": "Workflow",
  "body": "- بالنسبة لمهام GIF المتحرك، تحقّق من عدد الإطارات والإسناد قبل التمرير."
}
```

أو استبدال نص مطابق تمامًا في Skill موجودة:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "سير عمل أصول لقطات الشاشة",
  "reason": "التحقق القديم لم يتضمن تحسين الصور",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

فضّل `append` أو `replace` عندما تكون هناك Skill ذات صلة موجودة بالفعل. واستخدم `create`
فقط عندما لا تكون هناك Skill موجودة مناسبة.

## دورة حياة المقترح

يصبح كل تحديث مُنشأ مقترحًا يتضمن:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` اختياري
- `sessionId` اختياري
- `skillName`
- `title`
- `reason`
- `source`: ‏`tool` أو `agent_end` أو `reviewer`
- `status`
- `change`
- `scanFindings` اختياري
- `quarantineReason` اختياري

حالات المقترح:

- `pending` - بانتظار الموافقة
- `applied` - تمت كتابته إلى `<workspace>/skills`
- `rejected` - تم رفضه من المشغّل/النموذج
- `quarantined` - تم حظره بسبب نتائج ماسح حرجة

تُخزَّن الحالة لكل مساحة عمل تحت دليل حالة Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

يتم إزالة التكرار من المقترحات المعلقة والمحجورة حسب اسم Skill
وحمولة التغيير. ويحتفظ المخزن بأحدث المقترحات المعلقة/المحجورة حتى
`maxPending`.

## مرجع الأداة

يسجّل Plugin أداة وكيل واحدة:

```text
skill_workshop
```

### `status`

عدّ المقترحات حسب الحالة لمساحة العمل النشطة.

```json
{ "action": "status" }
```

شكل النتيجة:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

اعرض المقترحات المعلقة.

```json
{ "action": "list_pending" }
```

لعرض حالة أخرى:

```json
{ "action": "list_pending", "status": "applied" }
```

قيم `status` الصالحة:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

اعرض المقترحات المحجورة.

```json
{ "action": "list_quarantine" }
```

استخدم هذا عندما يبدو أن الالتقاط التلقائي لا يفعل شيئًا وتذكر السجلات
`skill-workshop: quarantined <skill>`.

### `inspect`

اجلب مقترحًا حسب المعرّف.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

أنشئ مقترحًا. مع `approvalPolicy: "pending"`، يتم إدراجه في قائمة الانتظار افتراضيًا.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "سير عمل GIF المتحرك",
  "reason": "وضع المستخدم قواعد قابلة لإعادة الاستخدام للتحقق من GIF.",
  "description": "تحقّق من أصول GIF المتحركة قبل استخدامها.",
  "body": "## سير العمل\n\n- تحقّق من أن عنوان URL يُحل إلى image/gif.\n- أكّد أنه يحتوي على إطارات متعددة.\n- سجّل الإسناد والترخيص.\n- تجنّب hotlinking عندما تكون هناك حاجة إلى أصل محلي."
}
```

افرض كتابة آمنة:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "تحقّق من أصول GIF المتحركة قبل استخدامها.",
  "body": "## سير العمل\n\n- تحقّق من وجود حركة فعلية.\n- سجّل الإسناد."
}
```

افرض التعليق حتى في `approvalPolicy: "auto"`:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "سير عمل استبدال لقطات الشاشة.",
  "body": "## سير العمل\n\n- تحقّق من الأبعاد.\n- حسّن PNG.\n- شغّل البوابة ذات الصلة."
}
```

ألحق بقسم:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "سير عمل سيناريو QA.",
  "body": "- بالنسبة إلى QA الخاص بالوسائط، تحقّق من أن الأصول المُنشأة تُعرض وتمر بالتحققات النهائية."
}
```

استبدل نصًا مطابقًا تمامًا:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

طبّق مقترحًا معلقًا.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

يرفض `apply` المقترحات المحجورة:

```text
quarantined proposal cannot be applied
```

### `reject`

ضع علامة على المقترح بأنه مرفوض.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

اكتب ملف دعم داخل دليل Skill موجود أو مقترح.

الأدلة العليا المسموح بها لملفات الدعم:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

مثال:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# قائمة التحقق من الإصدار\n\n- شغّل وثائق الإصدار.\n- تحقّق من سجل التغييرات.\n"
}
```

تكون ملفات الدعم مقيّدة بمساحة العمل، ومتحققًا من مساراتها، ومقيّدة بالبايتات بواسطة
`maxSkillBytes`، ومفحوصة، وتُكتب بشكل ذري.

## عمليات كتابة Skill

يكتب Skill Workshop فقط تحت:

```text
<workspace>/skills/<normalized-skill-name>/
```

تتم تسوية أسماء Skills كما يلي:

- تحويلها إلى أحرف صغيرة
- تتحول السلاسل غير المطابقة لـ `[a-z0-9_-]` إلى `-`
- تتم إزالة الأحرف غير الأبجدية الرقمية في البداية/النهاية
- الحد الأقصى للطول هو 80 حرفًا
- يجب أن يطابق الاسم النهائي النمط `[a-z0-9][a-z0-9_-]{1,79}`

بالنسبة إلى `create`:

- إذا لم تكن Skill موجودة، يكتب Skill Workshop ملف `SKILL.md` جديدًا
- إذا كانت موجودة بالفعل، يُلحق Skill Workshop النص إلى `## Workflow`

بالنسبة إلى `append`:

- إذا كانت Skill موجودة، يُلحق Skill Workshop بالقسم المطلوب
- إذا لم تكن موجودة، ينشئ Skill Workshop Skill دنيا ثم يُلحق

بالنسبة إلى `replace`:

- يجب أن تكون Skill موجودة بالفعل
- يجب أن يكون `oldText` موجودًا بشكل مطابق تمامًا
- يتم استبدال أول تطابق مطابق فقط

كل عمليات الكتابة ذرية وتحدّث لقطة Skills داخل الذاكرة فورًا، بحيث
يمكن أن تصبح Skill الجديدة أو المحدّثة مرئية من دون إعادة تشغيل Gateway.

## نموذج الأمان

يحتوي Skill Workshop على ماسح أمان لمحتوى `SKILL.md` المُنشأ وملفات
الدعم.

تؤدي النتائج الحرجة إلى حجر المقترحات:

| معرّف القاعدة | يحظر محتوى... |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | يطلب من الوكيل تجاهل التعليمات السابقة/الأعلى                   |
| `prompt-injection-system`              | يشير إلى system prompts أو رسائل المطور أو التعليمات المخفية |
| `prompt-injection-tool`                | يشجع على تجاوز إذن/موافقة الأداة                         |
| `shell-pipe-to-shell`                  | يتضمن `curl`/`wget` ممررة إلى `sh` أو `bash` أو `zsh`              |
| `secret-exfiltration`                  | يبدو أنه يرسل بيانات env/process env عبر الشبكة                 |

يتم الاحتفاظ بنتائج التحذير لكنها لا تمنع بمفردها:

| معرّف القاعدة | يحذّر من... |
| -------------------- | -------------------------------- |
| `destructive-delete` | أوامر عامة على نمط `rm -rf`    |
| `unsafe-permissions` | استخدام الأذونات على نمط `chmod 777` |

المقترحات المحجورة:

- تحتفظ بـ `scanFindings`
- تحتفظ بـ `quarantineReason`
- تظهر في `list_quarantine`
- لا يمكن تطبيقها عبر `apply`

للتعافي من مقترح محجور، أنشئ مقترحًا آمنًا جديدًا بعد إزالة
المحتوى غير الآمن. لا تعدّل JSON الخاص بالمخزن يدويًا.

## إرشادات Prompt

عند التفعيل، يحقن Skill Workshop قسم prompt قصيرًا يخبر الوكيل
باستخدام `skill_workshop` من أجل الذاكرة الإجرائية المتينة.

تركز الإرشادات على:

- الإجراءات، لا الحقائق/التفضيلات
- تصحيحات المستخدم
- الإجراءات الناجحة غير الواضحة
- المزالق المتكررة
- إصلاح Skills القديمة/الضعيفة/الخاطئة عبر append/replace
- حفظ إجراء قابل لإعادة الاستخدام بعد حلقات أدوات طويلة أو إصلاحات صعبة
- نص Skill قصير بصيغة الأمر
- عدم تفريغ النصوص

يتغير نص وضع الكتابة مع `approvalPolicy`:

- وضع pending: إدراج الاقتراحات في قائمة الانتظار؛ والتطبيق فقط بعد موافقة صريحة
- وضع auto: تطبيق تحديثات Skills مساحة العمل الآمنة عندما تكون قابلة لإعادة الاستخدام بوضوح

## التكاليف وسلوك وقت التشغيل

لا يستدعي الالتقاط الاستدلالي نموذجًا.

تستخدم مراجعة LLM تشغيلًا مضمنًا على نموذج الوكيل النشط/الافتراضي. وهي
تعتمد على الحدود، لذلك لا تعمل على كل دور افتراضيًا.

المراجع:

- يستخدم سياق المزوّد/النموذج المكوَّن نفسه عند توفره
- يعود إلى إعدادات الوكيل الافتراضية في وقت التشغيل
- لديه `reviewTimeoutMs`
- يستخدم سياق bootstrap خفيفًا
- لا يمتلك أدوات
- لا يكتب شيئًا مباشرةً
- لا يمكنه إلا إصدار مقترح يمر عبر الماسح العادي ومسار
  الموافقة/الحجر

إذا فشل المراجع، أو انتهت مهلته، أو أعاد JSON غير صالح، يسجّل Plugin
رسالة تحذير/تصحيح ويتخطى تمريرة المراجعة تلك.

## أنماط التشغيل

استخدم Skill Workshop عندما يقول المستخدم:

- "في المرة القادمة، افعل X"
- "من الآن فصاعدًا، فضّل Y"
- "تأكد من التحقق من Z"
- "احفظ هذا كسير عمل"
- "استغرق هذا وقتًا؛ تذكر العملية"
- "حدّث Skill المحلية لهذا"

نص Skill جيد:

```markdown
## Workflow

- تحقّق من أن عنوان URL الخاص بـ GIF يُحل إلى `image/gif`.
- أكّد أن الملف يحتوي على إطارات متعددة.
- سجّل عنوان URL للمصدر، والترخيص، والإسناد.
- خزّن نسخة محلية عندما يكون الأصل سيُشحن مع المنتج.
- تحقّق من أن الأصل المحلي يُعرض في UI المستهدفة قبل الرد النهائي.
```

نص Skill ضعيف:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

أسباب عدم حفظ النسخة الضعيفة:

- على شكل نص
- ليست بصيغة الأمر
- تتضمن تفاصيل مزعجة لمرة واحدة
- لا تخبر الوكيل التالي بما يجب فعله

## تصحيح الأخطاء

تحقق مما إذا كان Plugin محمّلًا:

```bash
openclaw plugins list --enabled
```

تحقق من عدد المقترحات من سياق وكيل/أداة:

```json
{ "action": "status" }
```

افحص المقترحات المعلقة:

```json
{ "action": "list_pending" }
```

افحص المقترحات المحجورة:

```json
{ "action": "list_quarantine" }
```

الأعراض الشائعة:

| العرض | السبب المحتمل | ما يجب التحقق منه |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| الأداة غير متاحة                   | لم يتم تفعيل إدخال Plugin                                                         | `plugins.entries.skill-workshop.enabled` و`openclaw plugins list` |
| لا يظهر أي مقترح تلقائي         | `autoCapture: false`، أو `reviewMode: "off"`، أو لم يتم بلوغ الحدود                    | التكوين، وحالة المقترحات، وسجلات Gateway                                |
| لم يلتقط المسار الاستدلالي شيئًا             | صياغة المستخدم لم تطابق أنماط التصحيح                                      | استخدم `skill_workshop.suggest` صريحًا أو فعّل مراجع LLM         |
| لم ينشئ المراجع مقترحًا    | أعاد المراجع `none`، أو JSON غير صالح، أو انتهت مهلته                                | سجلات Gateway، و`reviewTimeoutMs`، والحدود                          |
| لم يتم تطبيق المقترح               | `approvalPolicy: "pending"`                                                         | `list_pending`، ثم `apply`                                         |
| اختفى المقترح من المعلق     | تمت إعادة استخدام مقترح مكرر، أو تقليم الحد الأقصى للمعلقات، أو تم تطبيقه/رفضه/حجره | `status`، و`list_pending` مع مرشحات الحالة، و`list_quarantine`      |
| ملف Skill موجود لكن النموذج لا يراه | لم يتم تحديث لقطة Skill أو أن تقييد Skill يستبعده                            | حالة `openclaw skills` وأهلية Skill في مساحة العمل             |

السجلات ذات الصلة:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## سيناريوهات QA

سيناريوهات QA مدعومة بالمستودع:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

شغّل التغطية الحتمية:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

شغّل تغطية المراجع:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

سيناريو المراجع منفصل عمدًا لأنه يفعّل
`reviewMode: "llm"` ويمارس تمريرة المراجع المضمنة.

## متى يجب عدم تفعيل التطبيق التلقائي

تجنب `approvalPolicy: "auto"` عندما:

- تحتوي مساحة العمل على إجراءات حساسة
- يعمل الوكيل على مدخلات غير موثوقة
- تكون Skills مشتركة عبر فريق واسع
- ما زلت تضبط prompts أو قواعد الماسح
- يتعامل النموذج كثيرًا مع محتوى ويب/بريد إلكتروني عدائي

استخدم وضع pending أولًا. وانتقل إلى وضع auto فقط بعد مراجعة نوع
Skills التي يقترحها الوكيل في مساحة العمل تلك.

## وثائق ذات صلة

- [Skills](/ar/tools/skills)
- [Plugins](/ar/tools/plugin)
- [الاختبار](/ar/reference/test)
