---
read_when:
    - تريد استخدام حزام app-server المضمّن لـ Codex
    - أنت بحاجة إلى مراجع نماذج Codex وأمثلة إعدادات
    - تريد تعطيل الرجوع إلى Pi لعمليات النشر التي تستخدم Codex فقط
summary: شغّل أدوار الوكيل المضمّن في OpenClaw عبر حزام app-server المضمّن لـ Codex
title: حزام Codex
x-i18n:
    generated_at: "2026-04-21T07:22:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# حزام Codex

يتيح Plugin ‏`codex` المضمّن لـ OpenClaw تشغيل أدوار الوكيل المضمّن عبر
Codex app-server بدلًا من حزام Pi المضمّن.

استخدم هذا عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى: اكتشاف
النموذج، واستئناف الخيوط الأصلي، وCompaction الأصلي، وتنفيذ app-server.
يظل OpenClaw مسؤولًا عن قنوات الدردشة، وملفات الجلسات، واختيار النموذج، والأدوات،
والموافقات، وتسليم الوسائط، ونسخة transcript المرئية.

يكون الحزام معطّلًا افتراضيًا. ولا يتم اختياره إلا عندما يكون Plugin ‏`codex`
مفعّلًا ويكون النموذج المحلول نموذج `codex/*`، أو عندما تفرض صراحةً
`embeddedHarness.runtime: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.
إذا لم تضبط أبدًا `codex/*`، فإن تشغيلات PI وOpenAI وAnthropic وGemini وlocal
وcustom-provider الحالية تحتفظ بسلوكها الحالي.

## اختر بادئة النموذج الصحيحة

يمتلك OpenClaw مسارات منفصلة للوصول بشكل OpenAI وبشكل Codex:

| مرجع النموذج           | مسار وقت التشغيل                              | استخدمه عندما                                                             |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`       | مزود OpenAI عبر مسار OpenClaw/PI              | تريد وصولًا مباشرًا إلى OpenAI Platform API باستخدام `OPENAI_API_KEY`.   |
| `openai-codex/gpt-5.4` | مزود OpenAI Codex OAuth عبر PI                | تريد ChatGPT/Codex OAuth بدون حزام Codex app-server.                      |
| `codex/gpt-5.4`        | مزود Codex المضمّن مع حزام Codex              | تريد تنفيذًا أصليًا عبر Codex app-server لدور الوكيل المضمّن.            |

لا يطالب حزام Codex إلا بمراجع النماذج `codex/*`. أما مراجع `openai/*`
و`openai-codex/*` وAnthropic وGemini وxAI وlocal وcustom provider الحالية
فتحتفظ بمساراتها العادية.

## المتطلبات

- OpenClaw مع توفر Plugin ‏`codex` المضمّن.
- Codex app-server بالإصدار `0.118.0` أو أحدث.
- توفر مصادقة Codex لعملية app-server.

يمنع Plugin مصافحات app-server الأقدم أو غير المرقّمة بالإصدار. وهذا يُبقي
OpenClaw على سطح البروتوكول الذي تم اختباره معه.

بالنسبة لاختبارات smoke الحية وDocker، تأتي المصادقة عادةً من `OPENAI_API_KEY`، مع
ملفات Codex CLI الاختيارية مثل `~/.codex/auth.json` و
`~/.codex/config.toml`. استخدم مادة المصادقة نفسها التي يستخدمها Codex app-server
المحلي لديك.

## الحد الأدنى من الإعدادات

استخدم `codex/gpt-5.4`، وفعّل Plugin المضمّن، وافرِض حزام `codex`:

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

إذا كانت إعداداتك تستخدم `plugins.allow`، فأدرج `codex` هناك أيضًا:

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

يؤدي ضبط `agents.defaults.model` أو نموذج وكيل إلى `codex/<model>` أيضًا
إلى التفعيل التلقائي لـ Plugin ‏`codex` المضمّن. ولا يزال إدخال Plugin الصريح
مفيدًا في الإعدادات المشتركة لأنه يجعل نية النشر واضحة.

## أضف Codex بدون استبدال النماذج الأخرى

احتفظ بالقيمة `runtime: "auto"` عندما تريد Codex لنماذج `codex/*` وPI لكل
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

مع هذا الشكل:

- يستخدم `/model codex` أو `/model codex/gpt-5.4` حزام Codex app-server.
- يستخدم `/model gpt` أو `/model openai/gpt-5.4` مسار مزود OpenAI.
- يستخدم `/model opus` مسار مزود Anthropic.
- إذا تم اختيار نموذج غير Codex، يظل PI حزام التوافق.

## عمليات النشر التي تستخدم Codex فقط

عطّل الرجوع إلى Pi عندما تحتاج إلى إثبات أن كل دور وكيل مضمّن يستخدم
حزام Codex:

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

مع تعطيل الرجوع، يفشل OpenClaw مبكرًا إذا كان Plugin ‏Codex معطّلًا،
أو لم يكن النموذج المطلوب مرجع `codex/*`، أو كان app-server قديمًا جدًا، أو
تعذر بدء app-server.

## Codex لكل وكيل

يمكنك جعل وكيل واحد يستخدم Codex فقط بينما يحتفظ الوكيل الافتراضي بالاختيار
التلقائي العادي:

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

استخدم أوامر الجلسة العادية للتبديل بين الوكلاء والنماذج. ينشئ `/new` جلسة
OpenClaw جديدة وينشئ حزام Codex أو يستأنف خيط app-server الجانبي حسب
الحاجة. ويمسح `/reset` ربط جلسة OpenClaw لذلك الخيط.

## اكتشاف النموذج

افتراضيًا، يطلب Plugin ‏Codex من app-server النماذج المتاحة. وإذا
فشل الاكتشاف أو انتهت مهلته، فإنه يستخدم catalog الاحتياطي المضمّن:

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

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex ويلتزم بـ
catalog الاحتياطي:

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

افتراضيًا، يطلب OpenClaw من Codex طلب الموافقات الأصلية. ويمكنك ضبط هذه
السياسة أكثر، مثلًا عبر تشديدها وتوجيه المراجعات عبر guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

بالنسبة إلى app-server قيد التشغيل بالفعل، استخدم نقل WebSocket:

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

| الحقل               | الافتراضي                                | المعنى                                                                   |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | يقوم `"stdio"` ببدء Codex؛ ويتصل `"websocket"` إلى `url`.               |
| `command`           | `"codex"`                                | الملف التنفيذي لنقل stdio.                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | الوسائط لنقل stdio.                                                      |
| `url`               | غير مضبوط                                | عنوان WebSocket لـ app-server.                                           |
| `authToken`         | غير مضبوط                                | Bearer token لنقل WebSocket.                                             |
| `headers`           | `{}`                                     | ترويسات WebSocket إضافية.                                                |
| `requestTimeoutMs`  | `60000`                                  | المهلة لاستدعاءات مستوى التحكم في app-server.                            |
| `approvalPolicy`    | `"on-request"`                           | سياسة موافقة Codex الأصلية المرسلة عند بدء/استئناف/دور الخيط.           |
| `sandbox`           | `"workspace-write"`                      | وضع sandbox الأصلي لـ Codex المرسل عند بدء/استئناف الخيط.               |
| `approvalsReviewer` | `"user"`                                 | استخدم `"guardian_subagent"` لجعل Codex guardian يراجع الموافقات الأصلية. |
| `serviceTier`       | غير مضبوط                                | طبقة خدمة Codex اختيارية، مثل `"priority"`.                             |

لا تزال متغيرات البيئة الأقدم تعمل كبدائل لاختبارات local عندما
يكون حقل الإعداد المطابق غير مضبوط:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

تُفضَّل الإعدادات من أجل عمليات نشر قابلة للتكرار.

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

التحقق من الحزام الذي يستخدم Codex فقط، مع تعطيل الرجوع إلى Pi:

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

موافقات Codex يراجعها guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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

يبقى تبديل النماذج تحت تحكم OpenClaw. عندما تكون جلسة OpenClaw مرفقة
بخيط Codex موجود، يرسل الدور التالي النموذج المحدد حاليًا
`codex/*`، والمزوّد، وسياسة الموافقة، وsandbox، وservice tier إلى
app-server مرة أخرى. يؤدي التبديل من `codex/gpt-5.4` إلى `codex/gpt-5.2` إلى
الاحتفاظ بربط الخيط لكنه يطلب من Codex المتابعة باستخدام النموذج المحدد حديثًا.

## أمر Codex

يسجل Plugin المضمّن الأمر `/codex` كأمر slash مخوّل. وهو
عام ويعمل على أي قناة تدعم أوامر النص في OpenClaw.

الصيغ الشائعة:

- يعرض `/codex status` الاتصال الحي بـ app-server، والنماذج، والحساب، وحدود المعدل، وخوادم MCP، وSkills.
- يسرد `/codex models` نماذج Codex app-server الحية.
- يسرد `/codex threads [filter]` أحدث خيوط Codex.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بخيط Codex موجود.
- يطلب `/codex compact` من Codex app-server تنفيذ Compaction للخيط المرفق.
- يبدأ `/codex review` مراجعة Codex الأصلية للخيط المرفق.
- يعرض `/codex account` حالة الحساب وحد المعدل.
- يسرد `/codex mcp` حالة خادم MCP في Codex app-server.
- يسرد `/codex skills` Skills في Codex app-server.

يكتب `/codex resume` ملف الربط الجانبي نفسه الذي يستخدمه الحزام في
الأدوار العادية. وفي الرسالة التالية، يستأنف OpenClaw خيط Codex ذلك، ويمرّر
نموذج OpenClaw الحالي المحدد `codex/*` إلى app-server، ويُبقي
السجل الموسّع مفعّلًا.

يتطلب سطح الأوامر Codex app-server بالإصدار `0.118.0` أو أحدث. ويتم
الإبلاغ عن طرق التحكم الفردية على أنها `unsupported by this Codex app-server` إذا
لم يكشف app-server مستقبلي أو مخصص عن طريقة JSON-RPC تلك.

## الأدوات، والوسائط، وCompaction

يغيّر حزام Codex منفّذ الوكيل المضمّن منخفض المستوى فقط.

يظل OpenClaw يبني قائمة الأدوات ويتلقى نتائج الأدوات الديناميكية من
الحزام. ويستمر النص، والصور، والفيديو، والموسيقى، وTTS، والموافقات، ومخرجات
أدوات المراسلة عبر مسار التسليم العادي في OpenClaw.

عندما يستخدم النموذج المحدد حزام Codex، يتم تفويض Compaction الخيط
الأصلي إلى Codex app-server. يحتفظ OpenClaw بنسخة transcript
لأجل سجل القناة، والبحث، و`/new`، و`/reset`، والتبديل المستقبلي للنموذج أو الحزام. وتتضمن
النسخة مطالبة المستخدم، ونص المساعد النهائي، وسجلات reasoning أو plan
الخفيفة الخاصة بـ Codex عندما يصدرها app-server.

لا يتطلب إنشاء الوسائط PI. وتستمر الصور، والفيديو، والموسيقى، وPDF، وTTS، وفهم
الوسائط في استخدام إعدادات المزود/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel` و`videoGenerationModel` و`pdfModel` و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex في `/model`:** فعّل `plugins.entries.codex.enabled`،
واضبط مرجع نموذج `codex/*`، أو تحقّق مما إذا كان `plugins.allow` يستبعد `codex`.

**يعود OpenClaw إلى PI:** اضبط `embeddedHarness.fallback: "none"` أو
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` أثناء الاختبار.

**يتم رفض app-server:** حدّث Codex بحيث تُبلغ مصافحة app-server
عن الإصدار `0.118.0` أو أحدث.

**اكتشاف النموذج بطيء:** خفّض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطّل الاكتشاف.

**يفشل نقل WebSocket فورًا:** تحقّق من `appServer.url` و
`authToken` ومن أن app-server البعيد يتحدث بإصدار بروتوكول Codex app-server نفسه.

**يستخدم نموذج غير Codex حزام PI:** هذا متوقع. لا يطالب حزام Codex إلا
بمراجع النماذج `codex/*`.

## ذات صلة

- [Plugins حزام الوكيل](/ar/plugins/sdk-agent-harness)
- [مزودو النماذج](/ar/concepts/model-providers)
- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [الاختبار](/ar/help/testing#live-codex-app-server-harness-smoke)
