---
read_when:
    - أنت تريد استخدام حزام app-server المضمّن الخاص بـ Codex
    - أنت بحاجة إلى أمثلة لتهيئة حزام Codex
    - أنت تريد أن تفشل النشرات المعتمدة على Codex فقط بدلًا من الرجوع إلى Pi
summary: شغّل أدوار الوكيل المضمنة في OpenClaw عبر حزام app-server المضمّن الخاص بـ Codex
title: حزام Codex
x-i18n:
    generated_at: "2026-04-25T13:52:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

يتيح Plugin ‏`codex` المضمن لـ OpenClaw تشغيل أدوار الوكيل المضمنة عبر
Codex app-server بدلًا من حزام PI المضمن.

استخدم هذا عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى: اكتشاف
النماذج، واستئناف السلاسل الأصلية، وCompaction الأصلية، وتنفيذ app-server.
ولا يزال OpenClaw يملك قنوات الدردشة، وملفات الجلسات، واختيار النماذج، والأدوات،
والموافقات، وتسليم الوسائط، ونسخة النص المرئية.

إذا كنت تحاول تكوين صورة عامة، فابدأ بـ
[بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes). والخلاصة المختصرة هي:
`openai/gpt-5.5` هو مرجع النموذج، و`codex` هي بيئة التشغيل، بينما تبقى Telegram
أو Discord أو Slack أو قناة أخرى هي سطح التواصل.

تحافظ أدوار Codex الأصلية على hooks الخاصة بـ Plugin في OpenClaw بوصفها طبقة التوافق العامة.
وهذه hooks داخل عملية OpenClaw، وليست hooks الأوامر `hooks.json` الخاصة بـ Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` لسجلات النص المنعكسة
- `agent_end`

يمكن للـ Plugins أيضًا تسجيل وسيط نتائج أدوات محايد لبيئة التشغيل لإعادة كتابة نتائج الأدوات الديناميكية في OpenClaw بعد أن ينفذ OpenClaw الأداة وقبل إعادة النتيجة إلى Codex. وهذا منفصل عن hook العام لـ Plugin ‏`tool_result_persist`، الذي يحول كتابات نتائج الأدوات في النصوص المملوكة لـ OpenClaw.

أما دلالات hooks الخاصة بـ Plugin نفسها، فراجع [hooks الخاصة بـ Plugin](/ar/plugins/hooks)
و[سلوك حراسة Plugin](/ar/tools/plugin).

يكون الحزام معطلًا افتراضيًا. ويجب أن تُبقي التهيئات الجديدة مراجع نماذج OpenAI
قياسية بصيغة `openai/gpt-*` وأن تفرض صراحةً
`embeddedHarness.runtime: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex` عندما
تريد تنفيذ app-server الأصلي. ولا تزال مراجع النماذج القديمة `codex/*` تختار
الحزام تلقائيًا للتوافق، لكن بادئات المزوّدات القديمة المدعومة ببيئة التشغيل لا
تُعرض كخيارات نموذج/مزوّد عادية.

## اختر بادئة النموذج الصحيحة

تكون المسارات الخاصة بعائلة OpenAI حساسة للبادئة. استخدم `openai-codex/*` عندما تريد
Codex OAuth عبر PI؛ واستخدم `openai/*` عندما تريد الوصول المباشر إلى OpenAI API أو
عندما تفرض حزام Codex app-server الأصلي:

| مرجع النموذج                                             | مسار بيئة التشغيل                                 | استخدمه عندما                                                                  |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | مزود OpenAI عبر بنية OpenClaw/PI | تريد وصول OpenAI Platform API المباشر الحالي باستخدام `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OpenAI Codex OAuth عبر OpenClaw/PI       | تريد مصادقة ChatGPT/Codex القائمة على الاشتراك مع مشغل PI الافتراضي.      |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | حزام Codex app-server                     | تريد تنفيذ Codex app-server الأصلي لدور الوكيل المضمن.   |

يقتصر GPT-5.5 حاليًا في OpenClaw على الاشتراك/OAuth فقط. استخدم
`openai-codex/gpt-5.5` من أجل PI OAuth، أو `openai/gpt-5.5` مع حزام
Codex app-server. ويُدعم الوصول المباشر بمفتاح API إلى `openai/gpt-5.5`
بمجرد أن تفعّل OpenAI دعم GPT-5.5 على API العامة.

لا تزال المراجع القديمة `codex/gpt-*` مقبولة كأسماء مستعارة للتوافق. وتعيد
هجرة التوافق في Doctor كتابة مراجع بيئة التشغيل الأساسية القديمة إلى مراجع نماذج
قياسية، وتسجل سياسة بيئة التشغيل بشكل منفصل، بينما تُترك المراجع القديمة الخاصة بالبدائل فقط دون تغيير لأن بيئة التشغيل تُهيأ لحاوية الوكيل بأكملها.
يجب أن تستخدم تهيئات PI Codex OAuth الجديدة `openai-codex/gpt-*`; أما تهيئات
حزام app-server الأصلية الجديدة فيجب أن تستخدم `openai/gpt-*` بالإضافة إلى
`embeddedHarness.runtime: "codex"`.

يتبع `agents.defaults.imageModel` التقسيم نفسه بحسب البادئة. استخدم
`openai-codex/gpt-*` عندما يجب أن يعمل فهم الصور عبر مسار مزود OpenAI
Codex OAuth. واستخدم `codex/gpt-*` عندما يجب أن يعمل فهم الصور
عبر دور Codex app-server محدود. ويجب أن يعلن نموذج Codex app-server
عن دعم إدخال الصور؛ إذ تفشل نماذج Codex النصية فقط قبل أن يبدأ دور الوسائط.

استخدم `/status` لتأكيد الحزام الفعّال للجلسة الحالية. وإذا كان الاختيار
مفاجئًا، ففعّل تسجيل التصحيح للنظام الفرعي `agents/harness`
وافحص سجل Gateway المهيكل `agent harness selected`. فهو
يتضمن معرّف الحزام المختار، وسبب الاختيار، وسياسة runtime/fallback، وفي
وضع `auto`، نتيجة دعم كل مرشح من Plugin.

اختيار الحزام ليس عنصر تحكم حيًا على مستوى الجلسة. فعندما يعمل دور مضمن،
يسجل OpenClaw معرّف الحزام المختار على تلك الجلسة ويستمر في استخدامه في
الأدوار اللاحقة ضمن معرّف الجلسة نفسه. غيّر تهيئة `embeddedHarness` أو
`OPENCLAW_AGENT_RUNTIME` عندما تريد أن تستخدم الجلسات المستقبلية حزامًا آخر؛
واستخدم `/new` أو `/reset` لبدء جلسة جديدة قبل تبديل محادثة قائمة بين PI وCodex.
فهذا يتجنب إعادة تشغيل نص واحد عبر نظامي جلسات أصلية غير متوافقين.

تُعامل الجلسات القديمة التي أُنشئت قبل تثبيت الحزام على أنها مثبتة على PI بمجرد أن
يصبح لديها سجل نصي. استخدم `/new` أو `/reset` لإدخال تلك المحادثة في
Codex بعد تغيير التهيئة.

يعرض `/status` بيئة تشغيل النموذج الفعلية. ويظهر حزام PI الافتراضي على أنه
`Runtime: OpenClaw Pi Default`، ويظهر حزام Codex app-server على أنه
`Runtime: OpenAI Codex`.

## المتطلبات

- OpenClaw مع توفر Plugin ‏`codex` المضمن.
- Codex app-server بالإصدار `0.118.0` أو أحدث.
- توفر مصادقة Codex لعملية app-server.

يحظر Plugin عمليات المصافحة الأقدم أو غير المعروفة الإصدار الخاصة بـ app-server. وهذا
يبقي OpenClaw على سطح البروتوكول الذي تم اختباره معه.

بالنسبة إلى الاختبارات الحية واختبارات Docker smoke، تأتي المصادقة عادةً من `OPENAI_API_KEY`، بالإضافة إلى ملفات Codex CLI الاختيارية مثل `~/.codex/auth.json` و
`~/.codex/config.toml`. استخدم مواد المصادقة نفسها التي يستخدمها Codex app-server المحلي لديك.

## الحد الأدنى من التهيئة

استخدم `openai/gpt-5.5`، وفعّل Plugin المضمن، وافرض حزام `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

إذا كانت تهيئتك تستخدم `plugins.allow`، فأدرج `codex` هناك أيضًا:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

لا تزال التهيئات القديمة التي تضبط `agents.defaults.model` أو نموذج وكيل إلى
`codex/<model>` تفعّل Plugin ‏`codex` المضمن تلقائيًا. ويجب أن تفضل التهيئات الجديدة
`openai/<model>` مع الإدخال الصريح `embeddedHarness` أعلاه.

## إضافة Codex إلى جانب نماذج أخرى

لا تضبط `runtime: "codex"` على مستوى عام إذا كان ينبغي للوكيل نفسه أن يبدّل بحرية
بين Codex ونماذج مزودين غير Codex. فبيئة التشغيل المفروضة تنطبق على كل
دور مضمن لذلك الوكيل أو الجلسة. وإذا اخترت نموذج Anthropic أثناء فرض
بيئة التشغيل هذه، فسيحاول OpenClaw استخدام حزام Codex ويفشل بشكل مغلق
بدلًا من توجيه ذلك الدور بصمت عبر PI.

استخدم بدلًا من ذلك أحد الأشكال التالية:

- ضع Codex على وكيل مخصص مع `embeddedHarness.runtime: "codex"`.
- أبقِ الوكيل الافتراضي على `runtime: "auto"` مع fallback إلى PI للاستخدام العادي المختلط
  بين المزوّدين.
- استخدم المراجع القديمة `codex/*` للتوافق فقط. ويجب أن تفضّل التهيئات الجديدة
  `openai/*` مع سياسة بيئة تشغيل Codex صريحة.

على سبيل المثال، يُبقي هذا الوكيل الافتراضي على الاختيار التلقائي العادي ويضيف
وكيل Codex منفصلًا:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

مع هذا الشكل:

- يستخدم الوكيل الافتراضي `main` مسار المزوّد العادي وبديل توافق PI.
- يستخدم الوكيل `codex` حزام Codex app-server.
- إذا كان Codex مفقودًا أو غير مدعوم للوكيل `codex`، فإن الدور يفشل
  بدلًا من استخدام PI بهدوء.

## نشرات Codex فقط

افرض حزام Codex عندما تحتاج إلى إثبات أن كل دور وكيل مضمن
يستخدم Codex. وتكون بيئات التشغيل الصريحة الخاصة بـ Plugin افتراضيًا من دون fallback إلى PI، لذا
تكون `fallback: "none"` اختيارية لكنها غالبًا مفيدة للتوثيق:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

تجاوز عبر البيئة:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

عند فرض Codex، يفشل OpenClaw مبكرًا إذا كان Plugin ‏Codex معطلًا، أو كان
app-server قديمًا جدًا، أو تعذر بدء app-server. اضبط
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` فقط إذا كنت تريد عمدًا أن يتولى PI
معالجة غياب اختيار الحزام.

## Codex لكل وكيل

يمكنك جعل وكيل واحد يعمل بـ Codex فقط بينما يحتفظ الوكيل الافتراضي
بالاختيار التلقائي العادي:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

استخدم أوامر الجلسة العادية للتبديل بين الوكلاء والنماذج. ينشئ `/new`
جلسة OpenClaw جديدة ويقوم حزام Codex بإنشاء أو استئناف سلسلة
app-server الجانبية الخاصة به حسب الحاجة. ويقوم `/reset` بمسح ربط جلسة OpenClaw
لتلك السلسلة ويسمح للدور التالي بتحليل الحزام من التهيئة الحالية مرة أخرى.

## اكتشاف النماذج

افتراضيًا، يطلب Plugin ‏Codex من app-server النماذج المتاحة. وإذا
فشل الاكتشاف أو انتهت مهلته، فإنه يستخدم كتالوج fallback مضمنًا لـ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

يمكنك ضبط الاكتشاف تحت `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex وأن يلتزم
بكتالوج fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## اتصال app-server والسياسة

افتراضيًا، يبدأ Plugin ‏Codex محليًا باستخدام:

```bash
codex app-server --listen stdio://
```

يبدأ OpenClaw افتراضيًا جلسات حزام Codex المحلية في وضع YOLO:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. وهذه هي وضعية المشغّل المحلي الموثوق المستخدمة
للـ Heartbeat المستقلة: إذ يستطيع Codex استخدام أدوات shell والشبكة من دون
التوقف عند مطالبات الموافقة الأصلية التي لا يوجد أحد للإجابة عنها.

وللانضمام اختياريًا إلى موافقات Codex المراجَعة من Guardian، اضبط `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

يستخدم وضع Guardian مسار الموافقة بالمراجعة التلقائية الأصلي في Codex. وعندما يطلب Codex
مغادرة sandbox، أو الكتابة خارج مساحة العمل، أو إضافة أذونات مثل الوصول إلى الشبكة،
فإن Codex يوجّه طلب الموافقة ذلك إلى المراجع الأصلي بدلًا من مطالبة بشرية. ويطبق
المراجع إطار المخاطر في Codex ويوافق أو يرفض
الطلب المحدد. استخدم Guardian عندما تريد مزيدًا من الحواجز الوقائية مقارنةً بوضع YOLO
لكن ما زلت بحاجة إلى أن يواصل الوكلاء غير المراقَبين التقدم.

يتوسع الإعداد المسبق `guardian` إلى `approvalPolicy: "on-request"`،
و`approvalsReviewer: "auto_review"`، و`sandbox: "workspace-write"`.
ولا تزال حقول السياسة الفردية تتجاوز `mode`، لذلك يمكن للنشرات المتقدمة مزج
الإعداد المسبق مع اختيارات صريحة. ولا تزال قيمة المراجع القديمة `guardian_subagent`
مقبولة كاسم مستعار للتوافق، لكن يجب أن تستخدم التهيئات الجديدة
`auto_review`.

بالنسبة إلى app-server يعمل بالفعل، استخدم نقل WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

الحقول المدعومة في `appServer`:

| الحقل               | الافتراضي                                  | المعنى                                                                                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | تقوم `"stdio"` بتشغيل Codex؛ وتقوم `"websocket"` بالاتصال بـ `url`.                                                     |
| `command`           | `"codex"`                                | الملف التنفيذي لنقل stdio.                                                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | الوسائط الخاصة بنقل stdio.                                                                               |
| `url`               | غير مضبوط                                    | عنوان WebSocket الخاص بـ app-server.                                                                                    |
| `authToken`         | غير مضبوط                                    | رمز Bearer لنقل WebSocket.                                                                        |
| `headers`           | `{}`                                     | ترويسات WebSocket إضافية.                                                                                     |
| `requestTimeoutMs`  | `60000`                                  | المهلة الزمنية بالمللي ثانية لاستدعاءات مستوى التحكم الخاصة بـ app-server.                                                                  |
| `mode`              | `"yolo"`                                 | إعداد مسبق لتنفيذ YOLO أو التنفيذ المعتمد على مراجعة Guardian.                                                              |
| `approvalPolicy`    | `"never"`                                | سياسة الموافقة الأصلية في Codex التي تُرسل عند بدء/استئناف/دور السلسلة.                                               |
| `sandbox`           | `"danger-full-access"`                   | وضع sandbox الأصلي في Codex الذي يُرسل عند بدء/استئناف السلسلة.                                                       |
| `approvalsReviewer` | `"user"`                                 | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية. ويظل `guardian_subagent` اسمًا مستعارًا قديمًا. |
| `serviceTier`       | غير مضبوط                                    | طبقة خدمة اختيارية لـ Codex app-server: ‏`"fast"` أو `"flex"` أو `null`. ويتم تجاهل القيم القديمة غير الصالحة.    |

لا تزال متغيرات البيئة الأقدم تعمل كبدائل للاختبار المحلي عندما
يكون حقل التهيئة المطابق غير مضبوط:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

أُزيل `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` لاختبار محلي لمرة واحدة. وتُفضّل التهيئة
للنشرات القابلة للتكرار لأنها تبقي سلوك Plugin في
الملف المراجع نفسه مع بقية إعداد حزام Codex.

## وصفات شائعة

Codex محلي مع نقل stdio الافتراضي:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

التحقق من حزام Codex فقط:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

موافقات Codex المعتمدة على مراجعة Guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

app-server بعيد مع ترويسات صريحة:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

يبقى تبديل النماذج تحت تحكم OpenClaw. وعندما تكون جلسة OpenClaw مرتبطة
بسلسلة Codex موجودة، يرسل الدور التالي النموذج الحالي
في OpenAI، والمزوّد، وسياسة الموافقة، وsandbox، وطبقة الخدمة إلى
app-server مرة أخرى. ويؤدي التبديل من `openai/gpt-5.5` إلى `openai/gpt-5.2` إلى الإبقاء على
ربط السلسلة، لكنه يطلب من Codex المتابعة بالنموذج المحدد حديثًا.

## أمر Codex

يسجل Plugin المضمن الأمر `/codex` بوصفه أمر شرطة مائلة مخولًا. وهو
عام ويعمل على أي قناة تدعم أوامر OpenClaw النصية.

أشكال شائعة:

- يعرض `/codex status` حالة اتصال app-server الحية، والنماذج، والحساب، وحدود المعدل، وخوادم MCP، وSkills.
- يسرد `/codex models` نماذج Codex app-server الحية.
- يسرد `/codex threads [filter]` سلاسل Codex الحديثة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بسلسلة Codex موجودة.
- يطلب `/codex compact` من Codex app-server تنفيذ Compaction للسلسلة المرتبطة.
- يبدأ `/codex review` المراجعة الأصلية لـ Codex للسلسلة المرتبطة.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يسرد `/codex mcp` حالة خوادم MCP في Codex app-server.
- يسرد `/codex skills` Skills الموجودة في Codex app-server.

يكتب `/codex resume` ملف الربط الجانبي نفسه الذي يستخدمه الحزام في
الأدوار العادية. وعند الرسالة التالية، يستأنف OpenClaw سلسلة Codex تلك، ويمرر
نموذج OpenClaw المحدد حاليًا إلى app-server، ويُبقي السجل الممتد
مفعّلًا.

يتطلب سطح الأوامر Codex app-server بالإصدار `0.118.0` أو أحدث. ويتم الإبلاغ عن
طرائق التحكم الفردية على أنها `unsupported by this Codex app-server` إذا كان
app-server مستقبليًا أو مخصصًا ولا يكشف تلك الطريقة عبر JSON-RPC.

## حدود hooks

يحتوي حزام Codex على ثلاث طبقات من hooks:

| الطبقة                                 | المالك                    | الغرض                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| hooks الخاصة بـ Plugin في OpenClaw                 | OpenClaw                 | توافق المنتج/Plugin عبر أحزمة PI وCodex.         |
| وسيط امتدادات Codex app-server | Plugins المضمنة في OpenClaw | سلوك المهايئ لكل دور حول الأدوات الديناميكية في OpenClaw.            |
| hooks الأصلية لـ Codex                    | Codex                    | دورة حياة Codex منخفضة المستوى وسياسة الأدوات الأصلية من تهيئة Codex. |

لا يستخدم OpenClaw ملفات Codex ‏`hooks.json` الخاصة بالمشروع أو العامة لتوجيه
سلوك Plugin في OpenClaw. وبالنسبة إلى جسر الأدوات والأذونات الأصلية المدعوم،
يقوم OpenClaw بحقن تهيئة Codex لكل سلسلة من أجل `PreToolUse` و`PostToolUse` و
`PermissionRequest`. أما hooks الأخرى في Codex مثل `SessionStart` و
`UserPromptSubmit` و`Stop` فتظل عناصر تحكم على مستوى Codex؛ ولا يتم كشفها
كـ hooks لـ Plugin في OpenClaw ضمن عقد v1.

بالنسبة إلى الأدوات الديناميكية في OpenClaw، ينفذ OpenClaw الأداة بعد أن يطلب Codex
الاستدعاء، لذلك يفعّل OpenClaw سلوك Plugin والوسيط الذي يملكه داخل
مهايئ الحزام. أما الأدوات الأصلية في Codex، فإن Codex يملك سجل الأداة القياسي.
ويمكن لـ OpenClaw عكس أحداث محددة، لكنه لا يستطيع إعادة كتابة سلسلة Codex
الأصلية ما لم يكشف Codex تلك العملية عبر app-server أو callbacks
لـ hooks الأصلية.

تأتي إسقاطات Compaction ودورة حياة LLM من إشعارات Codex app-server
وحالة مهايئ OpenClaw، وليس من أوامر hooks الأصلية لـ Codex.
وأحداث OpenClaw ‏`before_compaction` و`after_compaction` و`llm_input` و
`llm_output` هي ملاحظات على مستوى المهايئ، وليست لقطات حرفية
لحمولة الطلب الداخلي أو حمولة Compaction في Codex.

تُعرض إشعارات app-server الأصلية في Codex من نوع `hook/started` و`hook/completed`
على أنها أحداث وكيل `codex_app_server.hook` من أجل المسار والتصحيح.
وهي لا تستدعي hooks الخاصة بـ Plugin في OpenClaw.

## عقد الدعم v1

وضع Codex ليس PI مع استدعاء نموذج مختلف تحته. فـ Codex يملك المزيد من
حلقة النموذج الأصلية، ويكيّف OpenClaw أسطح Plugin والجلسة
حول ذلك الحد.

المدعوم في بيئة تشغيل Codex ‏v1:

| السطح                                 | الدعم                                 | السبب                                                                                                                                        |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| حلقة نموذج OpenAI عبر Codex         | مدعوم                               | يملك Codex app-server دور OpenAI، واستئناف السلسلة الأصلي، واستمرار الأدوات الأصلية.                                                 |
| توجيه وتسليم القنوات في OpenClaw   | مدعوم                               | تبقى Telegram وDiscord وSlack وWhatsApp وiMessage وغيرها من القنوات خارج بيئة تشغيل النموذج.                                           |
| الأدوات الديناميكية في OpenClaw                  | مدعوم                               | يطلب Codex من OpenClaw تنفيذ هذه الأدوات، لذلك يبقى OpenClaw ضمن مسار التنفيذ.                                                       |
| Plugins الخاصة بالتلقين والسياق              | مدعوم                               | يبني OpenClaw طبقات التلقين ويسقط السياق في دور Codex قبل بدء السلسلة أو استئنافها.                           |
| دورة حياة محرك السياق                | مدعوم                               | يعمل assemble وingest أو الصيانة بعد الدور وتنسيق Compaction الخاصة بمحرك السياق لأدوار Codex.                                |
| hooks الأدوات الديناميكية                      | مدعوم                               | تعمل `before_tool_call` و`after_tool_call` ووسيط نتائج الأدوات حول الأدوات الديناميكية المملوكة لـ OpenClaw.                                 |
| hooks دورة الحياة                         | مدعومة كملاحظات على مستوى المهايئ       | تُطلق `llm_input` و`llm_output` و`agent_end` و`before_compaction` و`after_compaction` بحمولات صادقة خاصة بوضع Codex.                  |
| حظر shell الأصلية وpatch أو مراقبتها | مدعوم عبر relay الخاصة بالـ hooks الأصلية | يتم تمرير Codex ‏`PreToolUse` و`PostToolUse` للأسطح الأصلية الملتزم بها. الحظر مدعوم؛ وإعادة كتابة الوسائط غير مدعومة. |
| سياسة الأذونات الأصلية                | مدعومة عبر relay الخاصة بالـ hooks الأصلية | يمكن توجيه Codex ‏`PermissionRequest` عبر سياسة OpenClaw حيث تكشفها بيئة التشغيل.                                              |
| التقاط مسار app-server           | مدعوم                               | يسجل OpenClaw الطلب الذي أرسله إلى app-server والإشعارات التي يتلقاها من app-server.                                           |

غير مدعوم في بيئة تشغيل Codex ‏v1:

| السطح                                             | حد الإصدار V1                                                                                                                                     | المسار المستقبلي                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| تعديل وسيطات الأداة الأصلية                       | يمكن لخطافات Codex الأصلية قبل الأداة الحظر، لكن OpenClaw لا يعيد كتابة وسيطات الأدوات الأصلية الخاصة بـ Codex.                                               | يتطلب دعم خطاف/مخطط Codex لاستبدال مدخلات الأداة.                                            |
| سجل محفوظات Codex الأصلي القابل للتحرير            | يمتلك Codex سجل المحادثة الأصلي القياسي. يمتلك OpenClaw نسخة معكوسة ويمكنه إسقاط سياق مستقبلي، لكنه يجب ألا يعدّل الأجزاء الداخلية غير المدعومة. | أضف واجهات برمجة تطبيقات صريحة لخادم تطبيقات Codex إذا كانت هناك حاجة إلى تعديل السجل الأصلي.                                    |
| `tool_result_persist` لسجلات الأدوات الأصلية في Codex | يحول هذا الخطاف عمليات كتابة السجل التي يملكها OpenClaw، وليس سجلات الأدوات الأصلية في Codex.                                                           | يمكنه عكس السجلات المحوّلة، لكن إعادة الكتابة القياسية تتطلب دعم Codex.                              |
| بيانات وصفية غنية أصلية لعملية Compaction                     | يلاحظ OpenClaw بدء Compaction واكتمالها، لكنه لا يتلقى قائمة مستقرة بما تم الاحتفاظ به/إسقاطه، أو فرق التوكنات، أو حمولة ملخّص.            | يحتاج إلى أحداث Compaction أكثر غنى من Codex.                                                                     |
| التدخل في Compaction                             | خطافات Compaction الحالية في OpenClaw تكون على مستوى الإشعارات في وضع Codex.                                                                         | أضف خطافات Codex قبل/بعد Compaction إذا احتاجت Plugins إلى رفض Compaction الأصلية أو إعادة كتابتها.                 |
| الإيقاف أو تقييد الإجابة النهائية                         | لدى Codex خطافات إيقاف أصلية، لكن OpenClaw لا يعرّض تقييد الإجابة النهائية كعقد Plugin في الإصدار v1.                                          | وظيفة اختيارية مستقبلية مع آليات حماية للحلقة والمهلة الزمنية.                                                 |
| تكافؤ خطافات MCP الأصلية كسطح v1 ملتزم به    | الترحيل عام، لكن OpenClaw لم يقيّد بالإصدار ويختبر سلوك خطافات MCP الأصلية قبل/بعد بشكل شامل.                               | أضف اختبارات ووثائق لترحيل MCP في OpenClaw بمجرد أن يغطي الحد الأدنى المدعوم من بروتوكول خادم التطبيق تلك الحمولات. |
| التقاط طلبات واجهة برمجة تطبيقات النموذج بايتًا ببايت             | يمكن لـ OpenClaw التقاط طلبات وإشعارات خادم التطبيق، لكن نواة Codex تبني طلب OpenAI API النهائي داخليًا.                      | يحتاج إلى حدث تتبع لطلب نموذج Codex أو واجهة برمجة تطبيقات تصحيح.                                                   |

## الأدوات والوسائط وCompaction

يغيّر Codex harness منفذ العامل المضمّن منخفض المستوى فقط.

لا يزال OpenClaw يبني قائمة الأدوات ويتلقى نتائج الأدوات الديناميكية من
harness. ويستمر النص، والصور، والفيديو، والموسيقى، وTTS، وعمليات الموافقة، ومخرجات
أدوات المراسلة عبر مسار التسليم المعتاد في OpenClaw.

إن ترحيل الخطافات الأصلية عام عن قصد، لكن عقد الدعم في الإصدار v1
محدود بمسارات الأدوات والأذونات الأصلية في Codex التي يختبرها OpenClaw. لا
تفترض أن كل حدث خطاف مستقبلي في Codex هو سطح Plugin في OpenClaw إلى أن
يسمّيه عقد وقت التشغيل بذلك.

تُوجَّه طلبات موافقة أدوات Codex MCP عبر تدفق موافقة Plugin
في OpenClaw عندما يضع Codex القيمة `_meta.codex_approval_kind` على
`"mcp_tool_call"`. وتُرسل مطالبات Codex `request_user_input` إلى
المحادثة الأصلية، وتجيب رسالة المتابعة التالية الموضوعة في قائمة الانتظار عن طلب
الخادم الأصلي بدلًا من توجيهها كسياق إضافي. أما طلبات الاستثارة الأخرى لـ MCP
فما تزال تفشل بشكل مغلق.

عندما يستخدم النموذج المحدد Codex harness، تُفوَّض عملية Compaction الأصلية
للمحادثة إلى خادم تطبيقات Codex. يحتفظ OpenClaw بنسخة معكوسة من السجل من أجل
محفوظات القناة، والبحث، و`/new`، و`/reset`، والتبديل المستقبلي للنموذج أو
harness. وتتضمن النسخة المعكوسة مطالبة المستخدم، والنص النهائي للمساعد،
وسجلات reasoning أو الخطة الخفيفة من Codex عندما يصدرها خادم التطبيق. حاليًا،
يسجل OpenClaw فقط إشارات بدء Compaction الأصلية واكتمالها. وهو لا يعرّض بعد
ملخّصًا مقروءًا للبشر لعملية Compaction أو قائمة قابلة للتدقيق بالعناصر التي
احتفظ بها Codex بعد Compaction.

ولأن Codex يمتلك المحادثة الأصلية القياسية، فإن `tool_result_persist` لا
يعيد حاليًا كتابة سجلات نتائج الأدوات الأصلية في Codex. بل يُطبّق فقط عندما
يكتب OpenClaw نتيجة أداة في سجل جلسة يملكها OpenClaw.

لا يتطلب إنشاء الوسائط PI. فالصورة، والفيديو، والموسيقى، وPDF، وTTS، وفهم
الوسائط تواصل استخدام إعدادات المزود/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel`، و`videoGenerationModel`، و`pdfModel`، و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex كمزود `/model` عادي:** هذا متوقع في
الإعدادات الجديدة. اختر نموذج `openai/gpt-*` مع
`embeddedHarness.runtime: "codex"` (أو مرجع `codex/*` قديم)، وفعّل
`plugins.entries.codex.enabled`، وتحقق مما إذا كانت `plugins.allow` تستبعد
`codex`.

**يستخدم OpenClaw PI بدلًا من Codex:** يمكن لـ `runtime: "auto"` أن يستخدم PI
كواجهة توافقية عندما لا يتولى أي Codex harness التشغيل. اضبط
`embeddedHarness.runtime: "codex"` لفرض اختيار Codex أثناء الاختبار. أصبح
وقت تشغيل Codex المفروض يفشل الآن بدلًا من الرجوع إلى PI ما لم
تضبط صراحة `embeddedHarness.fallback: "pi"`. وبمجرد اختيار خادم تطبيقات Codex،
تظهر إخفاقاته مباشرة دون إعدادات رجوع إضافية.

**يتم رفض خادم التطبيق:** حدّث Codex بحيث يُبلغ تفاوض خادم التطبيق
عن الإصدار `0.118.0` أو أحدث.

**اكتشاف النموذج بطيء:** خفّض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطّل الاكتشاف.

**يفشل نقل WebSocket مباشرة:** تحقق من `appServer.url`، و`authToken`،
وأن خادم التطبيق البعيد يتحدث الإصدار نفسه من بروتوكول خادم تطبيقات Codex.

**يستخدم نموذج غير Codex ‏PI:** هذا متوقع ما لم تكن قد فرضت
`embeddedHarness.runtime: "codex"` لذلك العامل أو اخترت مرجع `codex/*` قديمًا.
تبقى مراجع `openai/gpt-*` العادية ومراجع المزودين الآخرين على
مسار المزود المعتاد في وضع `auto`. إذا فرضت `runtime: "codex"`، فيجب أن تكون كل
دورة مضمنة لذلك العامل نموذج OpenAI يدعمه Codex.

## ذو صلة

- [Plugins حزام العامل](/ar/plugins/sdk-agent-harness)
- [أوقات تشغيل العامل](/ar/concepts/agent-runtimes)
- [مزودو النماذج](/ar/concepts/model-providers)
- [مزود OpenAI](/ar/providers/openai)
- [الحالة](/ar/cli/status)
- [خطافات Plugin](/ar/plugins/hooks)
- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
