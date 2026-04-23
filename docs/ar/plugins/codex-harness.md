---
read_when:
    - تريد استخدام app-server harness المضمّن الخاص بـ Codex
    - تحتاج إلى مراجع نماذج Codex وأمثلة على الإعدادات
    - تريد تعطيل الرجوع إلى Pi لعمليات النشر الخاصة بـ Codex فقط
summary: شغّل أدوار الوكيل المضمّن في OpenClaw عبر app-server harness المضمّن الخاص بـ Codex
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T14:00:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

يتيح Plugin ‏`codex` المضمّن لـ OpenClaw تشغيل أدوار الوكيل المضمّن عبر
Codex app-server بدلًا من PI harness المضمّن.

استخدم هذا عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى: اكتشاف
النماذج، واستئناف الخيط الأصلي، وCompaction الأصلي، وتنفيذ app-server.
وما زال OpenClaw يملك قنوات الدردشة، وملفات الجلسات، واختيار النماذج، والأدوات،
والموافقات، وتسليم الوسائط، ونسخة السجل المرئية.

تحترم أدوار Codex الأصلية أيضًا hooks المشتركة لـ Plugin بحيث تظل
prompt shims، والأتمتة الواعية بـ Compaction، وtool middleware، ومراقبو دورة الحياة
متوافقة مع PI harness:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

يمكن أيضًا لـ Plugins المضمّنة تسجيل Codex app-server extension factory لإضافة
`tool_result` middleware غير المتزامن.

يكون harness معطلًا افتراضيًا. ولا يتم اختياره إلا عندما يكون Plugin ‏`codex`
مفعّلًا ويكون النموذج الذي تم حله نموذج `codex/*`، أو عندما تفرض صراحةً
`embeddedHarness.runtime: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.
إذا لم تضبط `codex/*` مطلقًا، فستحتفظ تشغيلات PI وOpenAI وAnthropic وGemini وlocal
وcustom-provider الحالية بسلوكها الحالي.

## اختر بادئة النموذج الصحيحة

لدى OpenClaw مسارات منفصلة للوصول بشكل OpenAI وبشكل Codex:

| مرجع النموذج              | مسار وقت التشغيل                                 | يُستخدم عندما                                                                |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | مزوّد OpenAI عبر OpenClaw/PI plumbing | تريد وصولًا مباشرًا إلى OpenAI Platform API باستخدام `OPENAI_API_KEY`.       |
| `openai-codex/gpt-5.4` | مزوّد OpenAI Codex OAuth عبر PI       | تريد ChatGPT/Codex OAuth من دون Codex app-server harness.      |
| `codex/gpt-5.4`        | مزوّد Codex المضمّن بالإضافة إلى Codex harness    | تريد تنفيذ Codex app-server الأصلي لدور الوكيل المضمّن. |

لا يطالب Codex harness إلا بمراجع النماذج `codex/*`. أما مراجع `openai/*`
و`openai-codex/*` وAnthropic وGemini وxAI وlocal وcustom provider الحالية فتبقى
على مساراتها العادية.

## المتطلبات

- OpenClaw مع توفر Plugin ‏`codex` المضمّن.
- Codex app-server بالإصدار `0.118.0` أو أحدث.
- توفر مصادقة Codex لعملية app-server.

يحظر Plugin عمليات handshake الأقدم أو غير المرقمة لإصدار app-server. وهذا يُبقي
OpenClaw على سطح البروتوكول الذي اختُبر عليه.

بالنسبة لاختبارات smoke الحية وDocker، تأتي المصادقة عادةً من `OPENAI_API_KEY`، بالإضافة
إلى ملفات Codex CLI الاختيارية مثل `~/.codex/auth.json` و
`~/.codex/config.toml`. استخدم نفس مواد المصادقة التي يستخدمها Codex app-server
المحلي لديك.

## الحد الأدنى من الإعدادات

استخدم `codex/gpt-5.4`، ومكّن Plugin المضمّن، وافرِض harness ‏`codex`:

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

إذا كان config لديك يستخدم `plugins.allow`، فضمّن `codex` هناك أيضًا:

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

يؤدي أيضًا ضبط `agents.defaults.model` أو نموذج وكيل إلى `codex/<model>` إلى
تفعيل Plugin ‏`codex` المضمّن تلقائيًا. وما زال إدخال Plugin الصريح
مفيدًا في الإعدادات المشتركة لأنه يجعل نية النشر واضحة.

## أضف Codex من دون استبدال النماذج الأخرى

أبقِ `runtime: "auto"` عندما تريد استخدام Codex لنماذج `codex/*` وPI
لكل شيء آخر:

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

مع هذا الشكل:

- يستخدم `/model codex` أو `/model codex/gpt-5.4` ‏Codex app-server harness.
- يستخدم `/model gpt` أو `/model openai/gpt-5.4` مسار مزوّد OpenAI.
- يستخدم `/model opus` مسار مزوّد Anthropic.
- إذا تم اختيار نموذج غير Codex، يبقى PI هو harness التوافقي.

## عمليات النشر الخاصة بـ Codex فقط

عطّل الرجوع إلى PI عندما تحتاج إلى إثبات أن كل دور وكيل مضمّن يستخدم
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

مع تعطيل fallback، يفشل OpenClaw مبكرًا إذا كان Plugin ‏Codex معطلًا،
أو إذا لم يكن النموذج المطلوب مرجع `codex/*`، أو إذا كان app-server قديمًا جدًا، أو إذا
تعذر بدء app-server.

## Codex لكل وكيل

يمكنك جعل وكيل واحد خاصًا بـ Codex فقط بينما يحتفظ الوكيل الافتراضي
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

استخدم أوامر الجلسة العادية للتبديل بين الوكلاء والنماذج. ينشئ `/new`
جلسة OpenClaw جديدة، وينشئ Codex harness أو يستأنف خيط app-server الجانبي
عند الحاجة. ويمسح `/reset` ربط جلسة OpenClaw لذلك الخيط.

## اكتشاف النموذج

افتراضيًا، يطلب Plugin ‏Codex من app-server النماذج المتاحة. إذا
فشل الاكتشاف أو انتهت مهلته، فإنه يستخدم كتالوج fallback المضمّن:

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

افتراضيًا، يبدأ OpenClaw جلسات Codex harness المحلية في وضع YOLO:
`approvalPolicy: "never"` و`approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. وهذه هي وضعية المشغّل المحلي الموثوق المستخدمة
لـ Heartbeat المستقلة: إذ يمكن لـ Codex استخدام shell وأدوات الشبكة من دون
التوقف عند مطالبات الموافقة الأصلية عندما لا يكون هناك أحد للإجابة.

للاشتراك في موافقات Codex التي يراجعها Guardian، اضبط `appServer.mode:
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

يتوسع وضع Guardian إلى:

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

Guardian هو مراجع موافقات أصلي في Codex. عندما يطلب Codex الخروج من
sandbox، أو الكتابة خارج مساحة العمل، أو إضافة أذونات مثل الوصول إلى الشبكة،
فإن Codex يوجّه طلب الموافقة هذا إلى reviewer subagent بدلًا من مطالبة بشرية.
يجمع reviewer السياق ويطبق إطار المخاطر الخاص بـ Codex، ثم
يوافق على الطلب المحدد أو يرفضه. يكون Guardian مفيدًا عندما تريد مزيدًا من
القيود الوقائية مقارنةً بوضع YOLO لكنك ما زلت تحتاج إلى وكلاء وHeartbeat غير
مراقبة لتُحرز تقدمًا.

يتضمن Docker live harness فحص Guardian عندما تكون
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. إذ يبدأ Codex harness في
وضع Guardian، ويتحقق من الموافقة على أمر shell مصعّد وغير ضار، ويتحقق
من رفض رفع secret مزيفة إلى وجهة خارجية غير موثوقة بحيث يعود الوكيل
ليطلب موافقة صريحة.

ما زالت حقول السياسة الفردية تتقدم على `mode`، لذا يمكن لعمليات النشر المتقدمة
مزج الإعداد المسبق مع اختيارات صريحة.

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

حقول `appServer` المدعومة:

| الحقل               | الافتراضي                                  | المعنى                                                                                                   |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | تقوم `"stdio"` بتشغيل Codex؛ وتتصل `"websocket"` بـ `url`.                                                  |
| `command`           | `"codex"`                                | الملف التنفيذي لنقل stdio.                                                                           |
| `args`              | `["app-server", "--listen", "stdio://"]` | الوسيطات لنقل stdio.                                                                            |
| `url`               | غير مضبوط                                    | عنوان URL لـ WebSocket app-server.                                                                                 |
| `authToken`         | غير مضبوط                                    | Bearer token لنقل WebSocket.                                                                     |
| `headers`           | `{}`                                     | ترويسات WebSocket إضافية.                                                                                  |
| `requestTimeoutMs`  | `60000`                                  | المهلة الزمنية لاستدعاءات control-plane الخاصة بـ app-server.                                                               |
| `mode`              | `"yolo"`                                 | إعداد مسبق لتنفيذ YOLO أو التنفيذ بمراجعة Guardian.                                                           |
| `approvalPolicy`    | `"never"`                                | سياسة الموافقة الأصلية في Codex المرسلة إلى بدء/استئناف/دور الخيط.                                            |
| `sandbox`           | `"danger-full-access"`                   | وضع sandbox الأصلي في Codex المرسل إلى بدء/استئناف الخيط.                                                    |
| `approvalsReviewer` | `"user"`                                 | استخدم `"guardian_subagent"` للسماح لـ Codex Guardian بمراجعة المطالبات.                                           |
| `serviceTier`       | غير مضبوط                                    | مستوى خدمة Codex app-server اختياري: `"fast"` أو `"flex"` أو `null`. يتم تجاهل القيم القديمة غير الصالحة. |

ما زالت متغيرات البيئة الأقدم تعمل كبدائل احتياطية للاختبار المحلي عندما
يكون حقل config المطابق غير مضبوط:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

تمت إزالة `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` لاختبار محلي لمرة واحدة. يُفضَّل config
لعمليات النشر القابلة للتكرار لأنه يبقي سلوك Plugin في
نفس الملف المُراجع مع بقية إعداد Codex harness.

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

التحقق من Codex-only harness، مع تعطيل الرجوع إلى PI:

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

موافقات Codex بمراجعة Guardian:

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

يظل تبديل النماذج خاضعًا لتحكم OpenClaw. عندما تكون جلسة OpenClaw مرفقة
بخيط Codex موجود، يرسل الدور التالي
النموذج `codex/*` المحدد حاليًا، والمزوّد، وسياسة الموافقة، وsandbox، ومستوى الخدمة إلى
app-server مرة أخرى. يحافظ التبديل من `codex/gpt-5.4` إلى `codex/gpt-5.2`
على ربط الخيط لكنه يطلب من Codex المتابعة باستخدام النموذج المحدد حديثًا.

## أمر Codex

يسجل Plugin المضمّن الأمر `/codex` كأمر slash مخوّل. وهو
عام ويعمل على أي قناة تدعم أوامر OpenClaw النصية.

الصيغ الشائعة:

- يعرض `/codex status` حالة اتصال app-server الحية، والنماذج، والحساب، وحدود المعدل، وخوادم MCP، وSkills.
- يعرض `/codex models` نماذج Codex app-server الحية.
- يعرض `/codex threads [filter]` خيوط Codex الحديثة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بخيط Codex موجود.
- يطلب `/codex compact` من Codex app-server تنفيذ Compaction للخيط المرفق.
- يبدأ `/codex review` مراجعة Codex الأصلية للخيط المرفق.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يعرض `/codex mcp` حالة خادم MCP في Codex app-server.
- يعرض `/codex skills` Skills الخاصة بـ Codex app-server.

يكتب `/codex resume` ملف الربط الجانبي نفسه الذي يستخدمه harness في
الأدوار العادية. وفي الرسالة التالية، يستأنف OpenClaw خيط Codex هذا، ويمرر
نموذج OpenClaw ‏`codex/*` المحدد حاليًا إلى app-server، ويبقي
السجل الموسّع مفعّلًا.

يتطلب سطح الأوامر Codex app-server بالإصدار `0.118.0` أو أحدث. وتُبلَّغ
طرق التحكم الفردية على أنها `unsupported by this Codex app-server` إذا كان
app-server مستقبليًا أو مخصصًا لا يعرّض طريقة JSON-RPC تلك.

## الأدوات والوسائط وCompaction

لا يغيّر Codex harness سوى منفذ الوكيل المضمّن منخفض المستوى.

وما زال OpenClaw يبني قائمة الأدوات ويتلقى نتائج الأدوات الديناميكية من
harness. ويستمر النص، والصور، والفيديو، والموسيقى، وTTS، والموافقات، ومخرجات
أداة المراسلة عبر مسار التسليم العادي في OpenClaw.

تُوجَّه طلبات موافقة أداة Codex MCP عبر تدفق موافقة Plugin في OpenClaw
عندما يضع Codex القيمة `_meta.codex_approval_kind` على
`"mcp_tool_call"`؛ أما طلبات elicitation الأخرى وطلبات الإدخال الحر فما زالت
تفشل بشكل مغلق.

عندما يستخدم النموذج المحدد Codex harness، يتم تفويض Compaction الأصلي للخيط إلى
Codex app-server. يحتفظ OpenClaw بنسخة مرآة من السجل من أجل سجل القناة،
والبحث، و`/new`، و`/reset`، والتبديل المستقبلي للنموذج أو harness. وتتضمن
النسخة المرآة مطالبة المستخدم، والنص النهائي للمساعد، وسجلات reasoning أو الخطة الخفيفة من Codex
عندما يصدرها app-server. وحتى اليوم، لا يسجل OpenClaw إلا إشارات
بدء Compaction الأصلي واكتماله. وهو لا يعرّض بعد ملخصًا مقروءًا بشريًا لـ
Compaction أو قائمة قابلة للتدقيق بالعناصر التي احتفظ بها Codex بعد Compaction.

لا يتطلب إنشاء الوسائط PI. إذ تستمر عمليات الصور، والفيديو، والموسيقى، وPDF، وTTS، وفهم الوسائط
في استخدام إعدادات المزوّد/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel` و`videoGenerationModel` و`pdfModel` و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex في `/model`:** فعّل `plugins.entries.codex.enabled`،
واضبط مرجع نموذج `codex/*`، أو تحقّق مما إذا كانت `plugins.allow` تستبعد `codex`.

**يستخدم OpenClaw ‏PI بدلًا من Codex:** إذا لم يطالب أي Codex harness بالتشغيل،
فقد يستخدم OpenClaw ‏PI كواجهة توافق. اضبط
`embeddedHarness.runtime: "codex"` لفرض اختيار Codex أثناء الاختبار، أو
`embeddedHarness.fallback: "none"` للفشل عند عدم تطابق أي Plugin harness. وبمجرد
اختيار Codex app-server، تظهر إخفاقاته مباشرةً من دون إعداد fallback إضافي.

**تم رفض app-server:** رقِّ Codex لكي تبلغ عملية handshake الخاصة بـ app-server
عن الإصدار `0.118.0` أو أحدث.

**اكتشاف النموذج بطيء:** خفّض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطّل الاكتشاف.

**يفشل نقل WebSocket فورًا:** تحقّق من `appServer.url` و`authToken`،
ومن أن app-server البعيد يتحدث بنفس إصدار بروتوكول Codex app-server.

**يستخدم نموذج غير Codex ‏PI:** هذا متوقع. لا يطالب Codex harness إلا
بمراجع النماذج `codex/*`.

## ذو صلة

- [Plugins Agent Harness](/ar/plugins/sdk-agent-harness)
- [مزودو النماذج](/ar/concepts/model-providers)
- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [الاختبار](/ar/help/testing#live-codex-app-server-harness-smoke)
