---
read_when:
    - تريد استخدام app-server harness المضمّن الخاص بـ Codex
    - تحتاج إلى مراجع نماذج Codex وأمثلة إعدادات
    - تريد تعطيل الرجوع الاحتياطي إلى Pi في عمليات النشر الخاصة بـ Codex فقط
summary: تشغيل دورات الوكيل المضمّن في OpenClaw عبر app-server harness المضمّن الخاص بـ Codex
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T07:27:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5eff5a2af66033d575bc05c9f31a23ed0367bedc518dc25364e60a3012bfdff
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

يتيح Plugin المضمّن `codex` لـ OpenClaw تشغيل دورات الوكيل المضمّن عبر
Codex app-server بدلًا من PI harness المدمج.

استخدم هذا عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى: اكتشاف
النماذج، واستئناف الخيوط الأصلية، وCompaction الأصلي، وتنفيذ app-server.
ولا يزال OpenClaw يملك قنوات الدردشة، وملفات الجلسات، واختيار النماذج، والأدوات،
والموافقات، وتسليم الوسائط، ونسخة transcript المرئية.

كما تحترم دورات Codex الأصلية أيضًا hooks المشتركة الخاصة بـ Plugin بحيث تبقى
شيفرات prompt الوسيطة، والأتمتة الواعية بـ Compaction، وmiddleware الأدوات،
ومراقبو دورة الحياة متوافقة مع PI harness:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

يمكن أيضًا لـ Plugins المضمّنة تسجيل factory لامتداد Codex app-server لإضافة
middleware غير متزامن لـ `tool_result`، كما تُوجَّه كتابات transcript
المعكوسة الخاصة بـ Codex عبر `before_message_write`.

تكون الـ harness معطلة افتراضيًا. ولا يتم اختيارها إلا عندما يكون Plugin
`codex` مفعّلًا ويكون النموذج المحلول من نوع `codex/*`، أو عندما تفرض صراحة
`embeddedHarness.runtime: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.
وإذا لم تُهيئ `codex/*` مطلقًا، فإن تشغيلات PI وOpenAI وAnthropic وGemini وlocal
والمزوّدات المخصصة الحالية تبقى على سلوكها الحالي.

## اختر بادئة النموذج الصحيحة

يمتلك OpenClaw مسارات منفصلة للوصول على هيئة OpenAI والوصول على هيئة Codex:

| مرجع النموذج          | مسار وقت التشغيل                            | استخدمه عندما |
| --------------------- | ------------------------------------------- | ------------- |
| `openai/gpt-5.4`      | مزوّد OpenAI عبر بنية OpenClaw/PI           | تريد وصولًا مباشرًا إلى OpenAI Platform API باستخدام `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4`| مزوّد OpenAI Codex OAuth عبر PI             | تريد ChatGPT/Codex OAuth من دون Codex app-server harness. |
| `codex/gpt-5.4`       | مزوّد Codex المضمّن بالإضافة إلى Codex harness | تريد تنفيذ Codex app-server الأصلي لدورة الوكيل المضمّن. |

لا تطالب Codex harness إلا بمراجع النماذج `codex/*`. أما المراجع الحالية `openai/*`،
و`openai-codex/*`، وAnthropic، وGemini، وxAI، وlocal، والمزوّدات المخصصة، فتبقى
على مساراتها العادية.

## المتطلبات

- OpenClaw مع توافر Plugin `codex` المضمّن.
- Codex app-server بالإصدار `0.118.0` أو أحدث.
- توافر مصادقة Codex لعملية app-server.

يمنع Plugin المصافحات القديمة أو غير المرقمة للإصدار الخاصة بـ app-server. وهذا يبقي
OpenClaw على سطح البروتوكول الذي تم اختباره عليه.

بالنسبة إلى الاختبارات الحية واختبارات Docker الدخانية، تأتي المصادقة عادة من `OPENAI_API_KEY`، بالإضافة إلى
ملفات Codex CLI الاختيارية مثل `~/.codex/auth.json` و
`~/.codex/config.toml`. استخدم مواد المصادقة نفسها التي يستخدمها
Codex app-server المحلي لديك.

## الحد الأدنى من الإعداد

استخدم `codex/gpt-5.4`، وفعّل Plugin المضمّن، وافرِض
Codex harness:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

إذا كان config لديك يستخدم `plugins.allow`، فأدرج `codex` هناك أيضًا:

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

يؤدي ضبط `agents.defaults.model` أو نموذج وكيل إلى `codex/<model>` أيضًا إلى
تفعيل Plugin `codex` المضمّن تلقائيًا. ولا يزال إدخال Plugin الصريح
مفيدًا في الإعدادات المشتركة لأنه يجعل نية النشر واضحة.

## أضف Codex من دون استبدال النماذج الأخرى

أبقِ `runtime: "auto"` عندما تريد Codex لنماذج `codex/*` وPI لكل
شيء آخر:

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
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

بهذا الشكل:

- يستخدم `/model codex` أو `/model codex/gpt-5.4` ‏Codex app-server harness.
- يستخدم `/model gpt` أو `/model openai/gpt-5.4` مسار مزوّد OpenAI.
- يستخدم `/model opus` مسار مزوّد Anthropic.
- إذا تم اختيار نموذج غير Codex، يبقى PI هو harness التوافقي.

## عمليات النشر الخاصة بـ Codex فقط

عطّل الرجوع الاحتياطي إلى PI عندما تحتاج إلى إثبات أن كل دورة وكيل مضمّن تستخدم
Codex harness:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

تجاوز البيئة:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

عند تعطيل الرجوع الاحتياطي، يفشل OpenClaw مبكرًا إذا كان Plugin الخاص بـ Codex معطلًا،
أو إذا لم يكن النموذج المطلوب من نوع `codex/*`، أو إذا كان app-server قديمًا جدًا، أو إذا
تعذر بدء app-server.

## Codex لكل وكيل

يمكنك جعل وكيل واحد خاصًا بـ Codex بينما يحتفظ الوكيل الافتراضي باختيار
تلقائي عادي:

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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

استخدم أوامر الجلسة العادية لتبديل الوكلاء والنماذج. ينشئ `/new` جلسة
OpenClaw جديدة، وتقوم Codex harness بإنشاء أو استئناف خيط app-server
الجانبي حسب الحاجة. ويزيل `/reset` ربط جلسة OpenClaw لذلك الخيط.

## اكتشاف النماذج

افتراضيًا، يطلب Plugin الخاص بـ Codex النماذج المتاحة من app-server. وإذا
فشل الاكتشاف أو انتهت مهلته، يستخدم الفهرس الاحتياطي المضمّن:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex والالتزام
بالفهرس الاحتياطي:

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

افتراضيًا، يبدأ Plugin تشغيل Codex محليًا باستخدام:

```bash
codex app-server --listen stdio://
```

افتراضيًا، يبدأ OpenClaw جلسات Codex harness المحلية في وضع YOLO:
`approvalPolicy: "never"` و`approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. وهذه هي وضعية المشغّل المحلي الموثوق المستخدمة
لـ Heartbeat المستقلة: حيث يمكن لـ Codex استخدام أدوات shell والشبكة
من دون التوقف عند مطالبات الموافقة الأصلية التي لا يوجد أحد حاضر للإجابة عنها.

للاشتراك في الموافقات التي يراجعها Guardian في Codex، اضبط `appServer.mode:
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

يوسّع وضع Guardian إلى:

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Guardian هو مراجع موافقات أصلي في Codex. وعندما يطلب Codex الخروج من
صندوق الحماية، أو الكتابة خارج مساحة العمل، أو إضافة أذونات مثل الوصول إلى الشبكة،
فإن Codex يوجّه طلب الموافقة ذلك إلى وكيل فرعي مراجع بدلًا من مطالبة بشرية.
ويجمع المراجع السياق ويطبق إطار المخاطر الخاص بـ Codex، ثم
يوافق أو يرفض الطلب المحدد. ويكون Guardian مفيدًا عندما تريد حواجز حماية
أكثر من وضع YOLO لكنك لا تزال تحتاج إلى وكلاء وHeartbeats غير مراقَبة
لمواصلة التقدم.

يتضمن Docker live harness مجسًا لـ Guardian عندما تكون
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. فهو يبدأ Codex harness في
وضع Guardian، ويتحقق من الموافقة على أمر shell مُصعّد وغير ضار، ويتحقق
من رفض رفع سر مزيف إلى وجهة خارجية غير موثوقة بحيث
يطلب الوكيل موافقة صريحة من جديد.

لا تزال حقول السياسة الفردية تتغلب على `mode`، لذا يمكن لعمليات النشر المتقدمة
مزج الإعداد المسبق مع اختيارات صريحة.

وبالنسبة إلى app-server يعمل بالفعل، استخدم نقل WebSocket:

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

حقول `appServer` المدعومة:

| الحقل              | الافتراضي                                | المعنى |
| ------------------ | ---------------------------------------- | ------ |
| `transport`        | `"stdio"`                                | يقوم `"stdio"` بتشغيل Codex؛ ويتصل `"websocket"` بـ `url`. |
| `command`          | `"codex"`                                | الملف التنفيذي لنقل stdio. |
| `args`             | `["app-server", "--listen", "stdio://"]` | الوسائط لنقل stdio. |
| `url`              | غير مضبوط                                | عنوان URL لـ WebSocket app-server. |
| `authToken`        | غير مضبوط                                | رمز Bearer لنقل WebSocket. |
| `headers`          | `{}`                                     | ترويسات WebSocket إضافية. |
| `requestTimeoutMs` | `60000`                                  | المهلة الزمنية لاستدعاءات control-plane الخاصة بـ app-server. |
| `mode`             | `"yolo"`                                 | إعداد مسبق لتنفيذ YOLO أو التنفيذ الذي يراجعه guardian. |
| `approvalPolicy`   | `"never"`                                | سياسة الموافقة الأصلية في Codex المُرسلة عند بدء/استئناف/دورة الخيط. |
| `sandbox`          | `"danger-full-access"`                   | وضع صندوق الحماية الأصلي في Codex المُرسل عند بدء/استئناف الخيط. |
| `approvalsReviewer`| `"user"`                                 | استخدم `"guardian_subagent"` للسماح لـ Codex Guardian بمراجعة المطالبات. |
| `serviceTier`      | غير مضبوط                                | طبقة خدمة اختيارية لـ Codex app-server: `"fast"` أو `"flex"` أو `null`. ويتم تجاهل القيم القديمة غير الصالحة. |

لا تزال متغيرات البيئة الأقدم تعمل كقيم احتياطية للاختبار المحلي عندما
يكون حقل الإعداد المطابق غير مضبوط:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

تمت إزالة `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` لاختبار محلي لمرة واحدة. ويُفضَّل config
لعمليات النشر القابلة لإعادة التكرار لأنه يُبقي سلوك Plugin في
الملف المُراجَع نفسه مع بقية إعداد Codex harness.

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

التحقق من Codex-only harness، مع تعطيل الرجوع الاحتياطي إلى PI:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

موافقات Codex التي يراجعها Guardian:

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
            approvalsReviewer: "guardian_subagent",
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

يبقى تبديل النماذج تحت تحكم OpenClaw. وعندما تُرفق جلسة OpenClaw
بخيط Codex موجود، ترسل الدورة التالية
النموذج الحالي المحدد من نوع `codex/*`، والمزوّد، وسياسة الموافقة، وصندوق الحماية، وطبقة الخدمة إلى
app-server مرة أخرى. ويُبقي التبديل من `codex/gpt-5.4` إلى `codex/gpt-5.2`
ربط الخيط، لكنه يطلب من Codex المتابعة باستخدام النموذج المحدد حديثًا.

## أمر Codex

يسجل Plugin المضمّن الأمر `/codex` كأمر slash مخوّل. وهو
عام ويعمل على أي قناة تدعم أوامر OpenClaw النصية.

الأشكال الشائعة:

- يعرض `/codex status` اتصال app-server المباشر، والنماذج، والحساب، وحدود المعدل، وخوادم MCP، وSkills.
- يسرد `/codex models` نماذج Codex app-server المباشرة.
- يسرد `/codex threads [filter]` خيوط Codex الحديثة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بخيط Codex موجود.
- يطلب `/codex compact` من Codex app-server تنفيذ Compaction للخيط المرتبط.
- يبدأ `/codex review` مراجعة Codex الأصلية للخيط المرتبط.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يسرد `/codex mcp` حالة خادم MCP في Codex app-server.
- يسرد `/codex skills` Skills في Codex app-server.

يكتب `/codex resume` ملف الربط الجانبي نفسه الذي تستخدمه harness في
الدورات العادية. وفي الرسالة التالية، يستأنف OpenClaw خيط Codex ذلك، ويمرر
نموذج OpenClaw الحالي المحدد من نوع `codex/*` إلى app-server، ويحافظ على
تفعيل السجل الموسع.

يتطلب سطح الأوامر Codex app-server بالإصدار `0.118.0` أو أحدث. وتُبلَّغ الطرق
التحكمية الفردية على أنها `unsupported by this Codex app-server` إذا كان
app-server مستقبليًا أو مخصصًا لا يوفّر طريقة JSON-RPC تلك.

## الأدوات والوسائط وCompaction

تغيّر Codex harness منفّذ الوكيل المضمّن منخفض المستوى فقط.

ولا يزال OpenClaw يبني قائمة الأدوات ويتلقى نتائج الأدوات الديناميكية من
harness. ويستمر النص والصور والفيديو والموسيقى وTTS والموافقات ومخرجات
أدوات المراسلة عبر مسار التسليم العادي في OpenClaw.

تُوجَّه طلبات موافقة أدوات Codex MCP عبر تدفق موافقة Plugin في OpenClaw
عندما يضع Codex العلامة `_meta.codex_approval_kind` على
`"mcp_tool_call"`؛ أما طلبات الاستحضار الأخرى وطلبات الإدخال الحر فلا تزال
تفشل بشكل مغلق.

عندما يستخدم النموذج المحدد Codex harness، يُفوَّض Compaction الأصلي للخيط إلى
Codex app-server. ويحتفظ OpenClaw بنسخة transcript معكوسة من أجل سجل القناة،
والبحث، و`/new`، و`/reset`، والتبديل المستقبلي للنموذج أو harness. وتتضمن
النسخة المعكوسة مطالبة المستخدم، والنص النهائي للمساعد، وسجلات استدلال أو خطة
خفيفة من Codex عندما يصدرها app-server. وحتى الآن، يسجل OpenClaw فقط
إشارات بدء Compaction الأصلي واكتماله. وهو لا يعرّض بعد ملخصًا مقروءًا للبشر
عن Compaction أو قائمة قابلة للتدقيق بالعناصر التي احتفظ بها Codex بعد Compaction.

لا يتطلب توليد الوسائط وجود PI. إذ تستمر الصور والفيديو والموسيقى وPDF وTTS و
فهم الوسائط في استخدام إعدادات المزوّد/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel` و`videoGenerationModel` و`pdfModel` و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex في `/model`:** فعّل `plugins.entries.codex.enabled`،
واضبط مرجع نموذج `codex/*`، أو تحقّق مما إذا كان `plugins.allow` يستبعد `codex`.

**يستخدم OpenClaw PI بدلًا من Codex:** إذا لم تطالب أي Codex harness بالتشغيل،
فقد يستخدم OpenClaw PI كخلفية توافقية. اضبط
`embeddedHarness.runtime: "codex"` لفرض اختيار Codex أثناء الاختبار، أو
`embeddedHarness.fallback: "none"` للفشل عندما لا تطابق أي Plugin harness. وبمجرد
اختيار Codex app-server، تظهر إخفاقاته مباشرة من دون إعدادات
رجوع احتياطي إضافية.

**تم رفض app-server:** قم بترقية Codex بحيث تُبلّغ مصافحة app-server
عن الإصدار `0.118.0` أو أحدث.

**اكتشاف النموذج بطيء:** خفّض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطّل الاكتشاف.

**يفشل نقل WebSocket فورًا:** تحقّق من `appServer.url` و`authToken`
ومن أن app-server البعيد يتحدث الإصدار نفسه من بروتوكول Codex app-server.

**يستخدم نموذج غير Codex PI:** هذا متوقع. إذ لا تطالب Codex harness إلا
بمراجع النماذج `codex/*`.

## ذو صلة

- [Plugins الخاصة بـ Agent Harness](/ar/plugins/sdk-agent-harness)
- [مزوّدو النماذج](/ar/concepts/model-providers)
- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [الاختبار](/ar/help/testing#live-codex-app-server-harness-smoke)
