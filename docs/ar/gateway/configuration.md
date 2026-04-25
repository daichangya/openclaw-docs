---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط إعدادات شائعة
    - الانتقال إلى أقسام إعدادات محددة
summary: 'نظرة عامة على الإعدادات: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: الإعدادات
x-i18n:
    generated_at: "2026-04-25T13:46:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8ffe1972fc7680d4cfc55a24fd6fc3869af593faf8c1137369dad0dbefde43a
    source_path: gateway/configuration.md
    workflow: 15
---

يقرأ OpenClaw إعدادات اختيارية بصيغة <Tooltip tip="يدعم JSON5 التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار الإعدادات النشط ملفًا عاديًا. تخطيطات `openclaw.json` المرتبطة
برابط رمزي غير مدعومة لعمليات الكتابة التي يملكها OpenClaw؛ فقد تؤدي الكتابة
الذرية إلى استبدال المسار بدلًا من الحفاظ على الرابط الرمزي. إذا كنت تحتفظ
بالإعدادات خارج دليل الحالة الافتراضي، فوجّه `OPENCLAW_CONFIG_PATH` مباشرةً إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. ومن الأسباب الشائعة لإضافة إعدادات:

- توصيل القنوات والتحكم في من يمكنه مراسلة البوت
- ضبط النماذج، والأدوات، وSandboxing، أو الأتمتة (cron، الخطافات)
- ضبط الجلسات، والوسائط، والشبكات، أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) للاطلاع على كل حقل متاح.

<Tip>
**هل أنت جديد على الإعدادات؟** ابدأ باستخدام `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة الإعدادات](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة قابلة للنسخ واللصق.
</Tip>

## الحد الأدنى من الإعدادات

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تحرير الإعدادات

<Tabs>
  <Tab title="المعالج التفاعلي">
    ```bash
    openclaw onboard       # تدفق الإعداد الأولي الكامل
    openclaw configure     # معالج الإعدادات
    ```
  </Tab>
  <Tab title="CLI (أوامر مختصرة)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="واجهة Control UI">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم علامة تبويب **Config**.
    تعرض واجهة Control UI نموذجًا من مخطط الإعدادات الحي، بما في ذلك بيانات
    التوثيق الوصفية للحقلين `title` / `description` بالإضافة إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كخيار احتياطي. وبالنسبة إلى
    واجهات التعمق والأدوات الأخرى، يعرّض Gateway أيضًا `config.schema.lookup` من أجل
    جلب عقدة مخطط واحدة محددة بالمسار بالإضافة إلى ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تحرير مباشر">
    حرر `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبّق التغييرات تلقائيًا (راجع [إعادة التحميل الفوري](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق المخطط بالكامل. تؤدي المفاتيح غير المعروفة، أو الأنواع المشوهة، أو القيم غير الصالحة إلى أن **يرفض Gateway البدء**. والاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

يعرض `openclaw config schema` مخطط JSON Schema القياسي الذي تستخدمه واجهة Control UI
وعملية التحقق. ويجلب `config.schema.lookup` عقدة واحدة محددة بالمسار بالإضافة إلى
ملخصات الأبناء لأدوات التعمق. وتنتقل بيانات توثيق الحقلين `title`/`description`
عبر الكائنات المتداخلة، والرمز العام (`*`)، وعنصر المصفوفة (`[]`)، وفروع `anyOf`/
`oneOf`/`allOf`. وتُدمج مخططات Plugin والقنوات وقت التشغيل عندما يكون
سجل manifest محمّلًا.

عند فشل التحقق:

- لا يبدأ Gateway
- تعمل فقط أوامر التشخيص (`openclaw doctor`، و`openclaw logs`، و`openclaw health`، و`openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة من آخر إعدادات سليمة معروفة بعد كل بدء تشغيل ناجح.
إذا فشل `openclaw.json` لاحقًا في التحقق (أو أسقط `gateway.mode`، أو تقلص
بشكل حاد، أو كان هناك سطر سجل شارد مضاف في البداية)، يحافظ OpenClaw على الملف
المعطوب باسم `.clobbered.*`، ويستعيد نسخة آخر حالة سليمة معروفة، ويسجل سبب
الاستعادة. كما تتلقى دورة الوكيل التالية أيضًا تحذير حدث نظام حتى لا يقوم
الوكيل الرئيسي بإعادة كتابة الإعدادات المستعادة بشكل أعمى. ويتم تخطي الترقية إلى آخر حالة سليمة معروفة
عندما يحتوي المرشح على عناصر نائبة منقحة للأسرار مثل `***`.
وعندما تكون جميع مشكلات التحقق محصورة ضمن `plugins.entries.<id>...`، فإن OpenClaw
لا ينفذ استعادة للملف بالكامل. بل يبقي الإعدادات الحالية نشطة
ويظهر الفشل المحلي الخاص بـ Plugin حتى لا يؤدي عدم تطابق مخطط Plugin أو إصدار المضيف
إلى التراجع عن إعدادات مستخدم أخرى غير مرتبطة.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp أو Telegram أو Discord أو غيرها)">
    لكل قناة قسم إعدادات خاص بها تحت `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

    - [WhatsApp](/ar/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/ar/channels/telegram) — `channels.telegram`
    - [Discord](/ar/channels/discord) — `channels.discord`
    - [Feishu](/ar/channels/feishu) — `channels.feishu`
    - [Google Chat](/ar/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/ar/channels/msteams) — `channels.msteams`
    - [Slack](/ar/channels/slack) — `channels.slack`
    - [Signal](/ar/channels/signal) — `channels.signal`
    - [iMessage](/ar/channels/imessage) — `channels.imessage`
    - [Mattermost](/ar/channels/mattermost) — `channels.mattermost`

    تشترك جميع القنوات في نمط سياسة الرسائل الخاصة نفسه:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="اختيار النماذج وإعدادها">
    اضبط النموذج الأساسي وخيارات الرجوع الاحتياطي الاختيارية:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - يعرّف `agents.defaults.models` فهرس النماذج ويعمل كقائمة السماح لـ `/model`.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح من دون إزالة النماذج الحالية. ويتم رفض عمليات الاستبدال العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير الصور في نص الجلسة/الأدوات (الافتراضي `1200`)؛ وغالبًا ما تقلل القيم الأقل استخدام رموز الرؤية في التشغيلات الثقيلة باللقطات.
    - راجع [CLI الخاص بالنماذج](/ar/concepts/models) لتبديل النماذج داخل الدردشة و[الرجوع الاحتياطي للنموذج](/ar/concepts/model-failover) لمعرفة تدوير المصادقة وسلوك الرجوع الاحتياطي.
    - بالنسبة إلى المزوّدين المخصصين/المستضافين ذاتيًا، راجع [المزوّدون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة البوت">
    يتم التحكم في الوصول إلى الرسائل الخاصة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: يُسمح فقط للمرسلين الموجودين في `allowFrom` (أو مخزن السماح المقترن)
    - `"open"`: السماح بجميع الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل جميع الرسائل الخاصة

    بالنسبة إلى المجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) لمعرفة التفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد اشتراط الإشارة في دردشات المجموعات">
    تستخدم رسائل المجموعات افتراضيًا وضع **طلب الإشارة**. قم بإعداد الأنماط لكل وكيل:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **الإشارات الوصفية**: إشارات @ الأصلية (النقر للإشارة في WhatsApp، و@bot في Telegram، وغير ذلك)
    - **الأنماط النصية**: أنماط regex آمنة في `mentionPatterns`
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لمعرفة التجاوزات الخاصة بكل قناة ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كأساس مشترك، ثم تجاوز
    الوكلاء المحددين عبر `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` للوراثة من الإعدادات الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم وجود Skills.
    - راجع [Skills](/ar/tools/skills)، و[إعدادات Skills](/ar/tools/skills-config)، و
      [مرجع الإعدادات](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة سلامة القنوات في Gateway">
    تحكم في مدى شدة قيام Gateway بإعادة تشغيل القنوات التي تبدو متوقفة:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل إعادة التشغيل الخاصة بمراقب السلامة عالميًا.
    - يجب أن تكون `channelStaleEventThresholdMinutes` أكبر من أو مساوية لفاصل التحقق.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائية لقناة واحدة أو حساب واحد دون تعطيل المراقب العالمي.
    - راجع [فحوصات السلامة](/ar/gateway/health) للتصحيح التشغيلي و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لجميع الحقول.

  </Accordion>

  <Accordion title="إعداد الجلسات وإعادة التعيين">
    تتحكم الجلسات في استمرارية المحادثة والعزل:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: ‏`main` (مشترك) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالخيوط (يدعم Discord الأوامر `/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تمكين Sandboxing">
    شغّل جلسات الوكيل داخل بيئات تشغيل معزولة في Sandbox:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    قم ببناء الصورة أولًا: `scripts/sandbox-setup.sh`

    راجع [Sandboxing](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تمكين الدفع المعتمد على relay لإصدارات iOS الرسمية">
    يتم إعداد الدفع المعتمد على relay في `openclaw.json`.

    اضبط هذا في إعدادات Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    المقابل في CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    ما الذي يفعله هذا:

    - يتيح لـ Gateway إرسال `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال عبر relay الخارجي.
    - يستخدم منحة إرسال ضمن نطاق التسجيل يتم تمريرها من تطبيق iOS المقترن. ولا يحتاج Gateway إلى رمز relay مميز على مستوى النشر بالكامل.
    - يربط كل تسجيل مدعوم بـ relay بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يمكن لـ Gateway آخر إعادة استخدام التسجيل المخزن.
    - يبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. تنطبق الإرسالات المعتمدة على relay فقط على الإصدارات الرسمية الموزعة التي سجلت عبر relay.
    - يجب أن يطابق URL الأساسي للـ relay المضمن في إصدار iOS الرسمي/TestFlight، بحيث تصل حركة التسجيل والإرسال إلى نشر relay نفسه.

    التدفق من طرف إلى طرف:

    1. ثبّت إصدار iOS رسميًا/TestFlight تم تجميعه باستخدام URL الأساسي نفسه للـ relay.
    2. اضبط `gateway.push.apns.relay.baseUrl` على Gateway.
    3. اقترن تطبيق iOS مع Gateway ودع كلًا من جلسات node والمشغّل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل لدى relay باستخدام App Attest بالإضافة إلى إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بـ relay إلى Gateway المقترن.
    5. يخزن Gateway مقبض relay ومنحة الإرسال، ثم يستخدمهما في `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل relay جديد مرتبط بذلك Gateway.
    - إذا أصدرت إصدار iOS جديدًا يشير إلى نشر relay مختلف، فسيحدّث التطبيق تسجيل relay المخزن مؤقتًا بدلًا من إعادة استخدام أصل relay القديم.

    ملاحظة التوافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر متغيرات البيئة.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذ هروب للتطوير على loopback فقط؛ لا تحفظ عناوين URL الخاصة بـ HTTP relay في الإعدادات.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق الكامل من طرف إلى طرف و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج أمان relay.

  </Accordion>

  <Accordion title="إعداد Heartbeat (عمليات تحقق دورية)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: سلسلة مدة (`30m`، `2h`). اضبط `0m` للتعطيل.
    - `target`: ‏`last` | `none` | `<channel-id>` (على سبيل المثال `discord`، أو `matrix`، أو `telegram`، أو `whatsapp`)
    - `directPolicy`: ‏`allow` (الافتراضي) أو `block` لأهداف Heartbeat من نمط الرسائل الخاصة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="إعداد وظائف Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: يقلّم جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبطه على `false` للتعطيل).
    - `runLog`: يقلّم `cron/runs/<jobId>.jsonl` حسب الحجم وعدد الأسطر المحتفظ بها.
    - راجع [وظائف Cron](/ar/automation/cron-jobs) للحصول على نظرة عامة على الميزات وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhooks (الخطافات)">
    فعّل نقاط نهاية HTTP Webhook على Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    ملاحظة أمان:
    - تعامل مع كل محتوى حمولة hook/webhook على أنه إدخال غير موثوق.
    - استخدم `hooks.token` مخصصًا؛ ولا تعِد استخدام الرمز المميز المشترك لـ Gateway.
    - مصادقة hook تعتمد على الترويسات فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ ويتم رفض الرموز المميزة في سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` مساويًا لـ `/`؛ أبقِ إدخال webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ رايات تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`، و`hooks.mappings[].allowUnsafeExternalContent`) ما لم تكن تقوم بتصحيح محدود النطاق بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يختارها المستدعي.
    - بالنسبة إلى الوكلاء المدفوعين بالخطافات، فضّل مستويات نماذج قوية وحديثة وسياسة أدوات صارمة (على سبيل المثال المراسلة فقط بالإضافة إلى Sandboxing عند الإمكان).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات المطابقة وتكامل Gmail.

  </Accordion>

  <Accordion title="إعداد التوجيه متعدد الوكلاء">
    شغّل عدة وكلاء معزولين مع مساحات عمل وجلسات منفصلة:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    راجع [الوكلاء المتعددون](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/config-agents#multi-agent-routing) لمعرفة قواعد الروابط وملفات الوصول الخاصة بكل وكيل.

  </Accordion>

  <Accordion title="تقسيم الإعدادات إلى ملفات متعددة ($include)">
    استخدم `$include` لتنظيم الإعدادات الكبيرة:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **ملف واحد**: يستبدل الكائن الحاوي
    - **مصفوفة ملفات**: يتم دمجها دمجًا عميقًا بالترتيب (واللاحق يفوز)
    - **مفاتيح مجاورة**: يتم دمجها بعد الملفات المضمنة (وتتجاوز القيم المضمنة)
    - **تضمينات متداخلة**: مدعومة حتى عمق 10 مستويات
    - **مسارات نسبية**: يتم حلها نسبة إلى الملف الذي يتضمنها
    - **عمليات الكتابة المملوكة لـ OpenClaw**: عندما يغيّر أي كتابة قسمًا واحدًا فقط من المستوى الأعلى
      مدعومًا بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يقوم OpenClaw بتحديث ذلك الملف المضمن ويترك `openclaw.json` كما هو
    - **الكتابة العابرة غير المدعومة**: تضمينات الجذر، ومصفوفات التضمين، والتضمينات
      ذات التجاوزات المجاورة تفشل في وضع الإغلاق الآمن في عمليات الكتابة المملوكة لـ OpenClaw بدلًا من
      تسطيح الإعدادات
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل الفوري للإعدادات

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبّق التغييرات تلقائيًا — لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة على أنها غير موثوقة حتى يتم التحقق منها. ينتظر المراقب
حتى تستقر فوضى الكتابة المؤقتة/إعادة التسمية الخاصة بالمحرر، ثم يقرأ
الملف النهائي، ويرفض التعديلات الخارجية غير الصالحة عن طريق استعادة آخر إعدادات سليمة معروفة. تستخدم
عمليات الكتابة المملوكة لـ OpenClaw في الإعدادات حاجز المخطط نفسه قبل الكتابة؛ ويتم رفض عمليات الإتلاف
مثل إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف
ويتم حفظها باسم `.rejected.*` للفحص.

تُعد حالات فشل التحقق المحلية الخاصة بـ Plugin استثناءً: إذا كانت جميع المشكلات ضمن
`plugins.entries.<id>...`، فإن إعادة التحميل تبقي الإعدادات الحالية وتبلغ عن مشكلة Plugin
بدلًا من استعادة `.last-good`.

إذا رأيت `Config auto-restored from last-known-good` أو
`config reload restored last-known-good config` في السجلات، فافحص ملف
`.clobbered.*` المطابق بجوار `openclaw.json`، ثم أصلح الحمولة المرفوضة، وبعد ذلك شغّل
`openclaw config validate`. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)
للحصول على قائمة التحقق الخاصة بالاستعادة.

### أوضاع إعادة التحميل

| الوضع                 | السلوك                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبّق التغييرات الآمنة فورًا. ويعيد التشغيل تلقائيًا للتغييرات الحرجة.              |
| **`hot`**             | يطبّق التغييرات الآمنة فقط. ويسجل تحذيرًا عند الحاجة إلى إعادة التشغيل — وتتولى أنت ذلك. |
| **`restart`**         | يعيد تشغيل Gateway عند أي تغيير في الإعدادات، سواء كان آمنًا أم لا.                   |
| **`off`**             | يعطّل مراقبة الملفات. وتصبح التغييرات فعالة عند إعادة التشغيل اليدوية التالية.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما الذي يُطبَّق فوريًا وما الذي يحتاج إلى إعادة تشغيل

تُطبّق معظم الحقول فوريًا من دون توقف. وفي وضع `hybrid`، تتم معالجة التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة              | الحقول                                                            | هل يلزم إعادة تشغيل؟ |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| القنوات            | `channels.*`، و`web` (WhatsApp) — جميع القنوات المدمجة وقنوات Plugin | لا                   |
| الوكيل والنماذج    | `agent`، و`agents`، و`models`، و`routing`                         | لا                   |
| الأتمتة            | `hooks`، و`cron`، و`agent.heartbeat`                              | لا                   |
| الجلسات والرسائل   | `session`، و`messages`                                            | لا                   |
| الأدوات والوسائط   | `tools`، و`browser`، و`skills`، و`mcp`، و`audio`، و`talk`         | لا                   |
| الواجهة والمتفرقات | `ui`، و`logging`، و`identity`، و`bindings`                        | لا                   |
| خادم Gateway       | `gateway.*` (المنفذ، والربط، والمصادقة، وTailscale، وTLS، وHTTP)  | **نعم**              |
| البنية التحتية     | `discovery`، و`canvasHost`، و`plugins`                            | **نعم**              |

<Note>
يُعد `gateway.reload` و`gateway.remote` استثناءين — فتغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تحرر ملف مصدر تتم الإشارة إليه عبر `$include`، يقوم OpenClaw بتخطيط
إعادة التحميل من التخطيط المكتوب في المصدر، وليس من العرض المسطح في الذاكرة.
وهذا يجعل قرارات إعادة التحميل الفوري (تطبيق فوري مقابل إعادة تشغيل) قابلة للتنبؤ حتى عندما
يكون قسم واحد من المستوى الأعلى موجودًا في ملفه المضمن الخاص مثل
`plugins: { $include: "./plugins.json5" }`. ويفشل تخطيط إعادة التحميل في وضع الإغلاق الآمن إذا كان
تخطيط المصدر ملتبسًا.

## Config RPC (تحديثات برمجية)

بالنسبة إلى الأدوات التي تكتب الإعدادات عبر API الخاص بـ Gateway، ففضّل هذا التدفق:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات الأبناء)
- `config.get` لجلب اللقطة الحالية بالإضافة إلى `hash`
- `config.patch` للتحديثات الجزئية (تصحيح دمج JSON: يتم دمج الكائنات، و`null`
  يحذف، والمصفوفات تُستبدل)
- `config.apply` فقط عندما تنوي استبدال الإعدادات بالكامل
- `update.run` للتحديث الذاتي الصريح بالإضافة إلى إعادة التشغيل

<Note>
عمليات الكتابة على مستوى التحكم (`config.apply`، و`config.patch`، و`update.run`) تكون
مقيّدة إلى 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. كما يتم
تجميع طلبات إعادة التشغيل ثم فرض فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.
</Note>

مثال على تصحيح جزئي:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` القيم `raw`، و`baseHash`، و`sessionKey`،
و`note`، و`restartDelayMs`. وتكون `baseHash` مطلوبة لكلتا الطريقتين عندما
توجد إعدادات بالفعل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأصلية بالإضافة إلى:

- `.env` من دليل العمل الحالي (إذا كان موجودًا)
- `~/.openclaw/.env` (خيار احتياطي عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة. ويمكنك أيضًا تعيين متغيرات بيئة مضمنة داخل الإعدادات:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد متغيرات بيئة shell (اختياري)">
  إذا كان هذا الخيار مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، فسيشغّل OpenClaw shell تسجيل الدخول لديك ويستورد المفاتيح المفقودة فقط:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

المقابل كمتغير بيئة: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات البيئة في قيم الإعدادات">
  أشِر إلى متغيرات البيئة في أي قيمة سلسلة نصية ضمن الإعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تتم مطابقة الأسماء الكبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند التحميل
- استخدم `$${VAR}` للحصول على مخرجات حرفية
- يعمل هذا داخل ملفات `$include`
- الاستبدال المضمن: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="مراجع الأسرار (env، file، exec)">
  بالنسبة إلى الحقول التي تدعم كائنات SecretRef، يمكنك استخدام:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

توجد تفاصيل SecretRef (بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
وترد مسارات بيانات الاعتماد المدعومة في [واجهة بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) لمعرفة الأولوية الكاملة والمصادر.

## المرجع الكامل

للاطلاع على المرجع الكامل حقلًا بحقل، راجع **[مرجع الإعدادات](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [مرجع الإعدادات](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
