---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام التكوين المحددة
summary: 'نظرة عامة على التكوين: المهام الشائعة، الإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-04-23T13:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# التكوين

يقرأ OpenClaw تكوين **JSON5** اختياريًا من `~/.openclaw/openclaw.json` <Tooltip tip="يدعم JSON5 التعليقات والفواصل اللاحقة"></Tooltip>.
يجب أن يكون مسار التكوين النشط ملفًا عاديًا. التخطيطات التي تستخدم
`openclaw.json` المرتبط برمز symlink غير مدعومة لعمليات الكتابة التي يملكها OpenClaw؛
قد تستبدل الكتابة الذرية المسار بدلًا من الحفاظ على الرابط الرمزي. إذا كنت تحتفظ
بالتكوين خارج دليل الحالة الافتراضي، فوجّه `OPENCLAW_CONFIG_PATH` مباشرةً إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. ومن الأسباب الشائعة لإضافة تكوين:

- توصيل القنوات والتحكم في من يمكنه مراسلة البوت
- ضبط النماذج والأدوات والعزل والأتمتة (Cron والخطافات)
- ضبط الجلسات والوسائط والشبكات أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

<Tip>
**هل أنت جديد على التكوين؟** ابدأ باستخدام `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة التكوين](/ar/gateway/configuration-examples) للحصول على تكوينات كاملة جاهزة للنسخ واللصق.
</Tip>

## الحد الأدنى من التكوين

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تحرير التكوين

<Tabs>
  <Tab title="المعالج التفاعلي">
    ```bash
    openclaw onboard       # مسار الإعداد الكامل
    openclaw configure     # معالج التكوين
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
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم علامة التبويب **Config**.
    تعرض Control UI نموذجًا من مخطط التكوين المباشر، بما في ذلك بيانات التوثيق
    الوصفية `title` / `description` بالإضافة إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كخيار احتياطي. وبالنسبة إلى واجهات المستخدم
    المتعمقة والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup` من أجل
    جلب عقدة مخطط واحدة ضمن نطاق مسار معيّن مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تحرير مباشر">
    حرّر `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبّق التغييرات تلقائيًا (راجع [إعادة التحميل الفوري](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا التكوينات التي تطابق المخطط بالكامل. المفاتيح غير المعروفة، والأنواع المشوهة، أو القيم غير الصالحة تجعل Gateway **يرفض البدء**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema القياسي المستخدم بواسطة Control UI
والتحقق. يجلب `config.schema.lookup` عقدة واحدة ضمن نطاق مسار معيّن مع
ملخصات الأبناء لأدوات الاستكشاف المتعمق. وتستمر بيانات التوثيق الوصفية
للحقلين `title`/`description` عبر الكائنات المتداخلة، والحرف البديل (`*`)،
وعناصر المصفوفات (`[]`)، وفروع `anyOf`/`oneOf`/`allOf`.
كما تُدمج مخططات Plugin والقنوات وقت التشغيل عند تحميل سجل manifest.

عند فشل التحقق:

- لا يبدأ Gateway
- تعمل الأوامر التشخيصية فقط (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات بدقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة أخيرة معروفة سليمة بعد كل بدء تشغيل ناجح.
إذا فشل `openclaw.json` لاحقًا في التحقق (أو أسقط `gateway.mode`، أو تقلص
بحدة، أو أُضيف إليه سطر سجل بالخطأ في البداية)، فإن OpenClaw يحتفظ بالملف
المعطوب باسم `.clobbered.*`، ويستعيد النسخة الأخيرة المعروفة السليمة، ويسجل
سبب الاستعادة. كما تتلقى دورة الوكيل التالية تحذيرًا كحدث نظام حتى لا يقوم
الوكيل الرئيسي بإعادة كتابة التكوين المستعاد بشكل أعمى. يتم تخطي الترقية إلى
النسخة الأخيرة المعروفة السليمة عندما يحتوي المرشح على عناصر نائبة لأسرار
محجوبة مثل `***`.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp أو Telegram أو Discord وما إلى ذلك)">
    لكل قناة قسم تكوين خاص بها تحت `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

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

    تشترك جميع القنوات في نفس نمط سياسة الرسائل المباشرة:

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

  <Accordion title="اختيار النماذج وتكوينها">
    اضبط النموذج الأساسي وعمليات الرجوع الاختيارية:

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

    - يعرّف `agents.defaults.models` فهرس النماذج ويعمل كقائمة السماح لأمر `/model`.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح من دون إزالة النماذج الحالية. تُرفض عمليات الاستبدال العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج التنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور النصوص وأدوات التشغيل (القيمة الافتراضية `1200`)؛ وعادةً ما تقلل القيم الأقل من استخدام vision-token في التشغيلات الكثيفة بلقطات الشاشة.
    - راجع [Models CLI](/ar/concepts/models) لتبديل النماذج في المحادثة و[Model Failover](/ar/concepts/model-failover) لسلوك تدوير المصادقة والرجوع الاحتياطي.
    - بالنسبة إلى موفري الخدمة المخصصين/ذاتيي الاستضافة، راجع [الموفرون المخصصون](/ar/gateway/configuration-reference#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة البوت">
    يتم التحكم في الوصول إلى الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (افتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: يُسمح فقط للمرسلين الموجودين في `allowFrom` (أو مخزن السماح المقترن)
    - `"open"`: السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل جميع الرسائل المباشرة

    بالنسبة إلى المجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقنوات.

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#dm-and-group-access) للحصول على التفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد التحكم بالإشارة في الدردشة الجماعية">
    تكون الرسائل الجماعية افتراضيًا **تتطلب إشارة**. اضبط الأنماط لكل وكيل:

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

    - **الإشارات الوصفية**: إشارات @ الأصلية (الإشارة بالنقر في WhatsApp، أو Telegram @bot، وما إلى ذلك)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#group-chat-mention-gating) للحصول على التجاوزات الخاصة بكل قناة ووضع المحادثة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كخط أساس مشترك، ثم تجاوز الوكلاء المحددين باستخدام `agents.list[].skills`:

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

    - احذف `agents.defaults.skills` لجعل Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة القيم الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
    - راجع [Skills](/ar/tools/skills) و[تكوين Skills](/ar/tools/skills-config) و
      [مرجع التكوين](/ar/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة صحة القنوات في Gateway">
    تحكم في مدى شدة قيام Gateway بإعادة تشغيل القنوات التي تبدو راكدة:

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

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل إعادة التشغيل الناتجة عن مراقبة الصحة على مستوى عالمي.
    - يجب أن تكون `channelStaleEventThresholdMinutes` أكبر من أو مساوية لفاصل التحقق.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائي لقناة أو حساب واحد من دون تعطيل المراقبة العامة.
    - راجع [فحوصات الصحة](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لجميع الحقول.

  </Accordion>

  <Accordion title="تكوين الجلسات وعمليات إعادة التعيين">
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

    - `dmScope`: `main` (مشترك) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: القيم الافتراضية العامة لتوجيه الجلسات المرتبطة بسلاسل الرسائل (يدعم Discord الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) للنطاق وروابط الهوية وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تمكين العزل">
    شغّل جلسات الوكيل في بيئات تشغيل معزولة:

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

    ابنِ الصورة أولًا: `scripts/sandbox-setup.sh`

    راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/configuration-reference#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تمكين الإشعارات الفورية المعتمدة على relay لبنيات iOS الرسمية">
    يتم تكوين الإشعارات الفورية المعتمدة على relay في `openclaw.json`.

    اضبط هذا في تكوين Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // اختياري. الافتراضي: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    المكافئ في CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    ما يفعله هذا:

    - يتيح لـ Gateway إرسال `push.test` وتنبيهات الإيقاظ وتنبيهات إعادة الاتصال عبر relay الخارجي.
    - يستخدم منحة إرسال مرتبطة بالتسجيل يمررها تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز relay على مستوى النشر كله.
    - يربط كل تسجيل مدعوم بـ relay بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يمكن لـ Gateway آخر إعادة استخدام التسجيل المخزن.
    - يُبقي بنيات iOS المحلية/اليدوية على APNs المباشر. تنطبق عمليات الإرسال المدعومة بـ relay فقط على البنيات الرسمية الموزعة التي سجلت عبر relay.
    - يجب أن يطابق عنوان URL الأساسي لـ relay المضمّن في بنية iOS الرسمية/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نفس نشر relay.

    التدفق الكامل من طرف إلى طرف:

    1. ثبّت بنية iOS رسمية/TestFlight جرى تجميعها باستخدام عنوان URL الأساسي نفسه لـ relay.
    2. اضبط `gateway.push.apns.relay.baseUrl` على Gateway.
    3. اقترن تطبيق iOS مع Gateway ودع كلًا من جلسات Node والمشغّل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل مع relay باستخدام App Attest مع إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بـ relay إلى Gateway المقترن.
    5. يخزن Gateway معرّف relay ومنحة الإرسال، ثم يستخدمهما في `push.test` وتنبيهات الإيقاظ وتنبيهات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا نقلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل relay جديد مرتبط بذلك Gateway.
    - إذا أصدرت بنية iOS جديدة تشير إلى نشر relay مختلف، فسيحدّث التطبيق تسجيل relay المخزن مؤقتًا بدلًا من إعادة استخدام أصل relay القديم.

    ملاحظة التوافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر متغيرات البيئة.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` مخرجًا تطويريًا يقتصر على local loopback؛ لا تحفظ عناوين URL لـ relay عبر HTTP في التكوين.

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
    - `target`: `last` | `none` | `<channel-id>` (على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (افتراضي) أو `block` لأهداف Heartbeat بأسلوب الرسائل المباشرة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="تكوين مهام Cron">
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

    - `sessionRetention`: احذف جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبط `false` للتعطيل).
    - `runLog`: احذف `cron/runs/<jobId>.jsonl` حسب الحجم والأسطر المحتفظ بها.
    - راجع [مهام Cron](/ar/automation/cron-jobs) للحصول على نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhook (الخطافات)">
    فعّل نقاط نهاية Webhook عبر HTTP على Gateway:

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

    ملاحظة أمنية:
    - تعامل مع كل محتوى حمولات hook/Webhook على أنه إدخال غير موثوق.
    - استخدم `hooks.token` مخصصًا؛ لا تعِد استخدام الرمز المشترك لـ Gateway.
    - مصادقة Hook تعتمد على الترويسة فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ تُرفض الرموز في سلسلة الاستعلام.
    - لا يمكن أن تكون `hooks.path` مساوية لـ `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ علامات تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent` و`hooks.mappings[].allowUnsafeExternalContent`) ما لم تكن تنفذ تصحيح أخطاء محدودًا بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسة التي يختارها المتصل.
    - بالنسبة إلى الوكلاء المعتمدين على hook، ففضّل مستويات نماذج حديثة قوية وسياسة أدوات صارمة (مثل المراسلة فقط مع العزل متى أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="تكوين التوجيه متعدد الوكلاء">
    شغّل عدة وكلاء معزولين بمساحات عمل وجلسات منفصلة:

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

    راجع [الوكلاء المتعددون](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/configuration-reference#multi-agent-routing) لقواعد الربط وملفات الوصول الخاصة بكل وكيل.

  </Accordion>

  <Accordion title="تقسيم التكوين إلى ملفات متعددة ($include)">
    استخدم `$include` لتنظيم التكوينات الكبيرة:

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
    - **مصفوفة من الملفات**: تُدمج دمجًا عميقًا بالترتيب (الأخير يفوز)
    - **المفاتيح الشقيقة**: تُدمج بعد التضمينات (وتتجاوز القيم المضمّنة)
    - **تضمينات متداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **الكتابات التي يملكها OpenClaw**: عندما تغيّر الكتابة قسمًا واحدًا فقط من المستوى الأعلى
      مدعومًا بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`,
      يحدّث OpenClaw ذلك الملف المضمّن ويترك `openclaw.json` دون تغيير
    - **الكتابة العبرية غير المدعومة**: تفشل التضمينات الجذرية ومصفوفات التضمين والتضمينات
      التي لها تجاوزات شقيقة بشكل مغلق في الكتابات التي يملكها OpenClaw بدلًا من
      تسطيح التكوين
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة وأخطاء التحليل والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل الفوري للتكوين

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبق التغييرات تلقائيًا — لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل التعديلات المباشرة على الملف على أنها غير موثوقة حتى تجتاز التحقق. ينتظر
المراقب حتى تهدأ فوضى الكتابة المؤقتة/إعادة التسمية من المحرر، ثم يقرأ
الملف النهائي، ويرفض التعديلات الخارجية غير الصالحة عبر استعادة التكوين
الأخير المعروف السليم. تستخدم كتابات التكوين التي يملكها OpenClaw
بوابة المخطط نفسها قبل الكتابة؛ وتُرفض التخريبات الإتلافية مثل
إسقاط `gateway.mode` أو تقليص الملف لأكثر من النصف
وتُحفظ باسم `.rejected.*` للفحص.

إذا رأيت `Config auto-restored from last-known-good` أو
`config reload restored last-known-good config` في السجلات، فافحص ملف
`.clobbered.*` المطابق بجوار `openclaw.json`، وأصلح الحمولة المرفوضة، ثم شغّل
`openclaw config validate`. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)
للاطلاع على قائمة خطوات الاسترداد.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (افتراضي) | يطبق التغييرات الآمنة فورًا. ويعيد التشغيل تلقائيًا للتغييرات الحرجة.                 |
| **`hot`**              | يطبق التغييرات الآمنة فقط. ويسجل تحذيرًا عند الحاجة إلى إعادة تشغيل — وتتولى أنت ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في التكوين، سواء كان آمنًا أم لا.                     |
| **`off`**              | يعطّل مراقبة الملفات. تصبح التغييرات سارية عند إعادة التشغيل اليدوية التالية.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما الذي يُطبَّق فورًا وما الذي يحتاج إلى إعادة تشغيل

تُطبَّق معظم الحقول فورًا من دون توقف للخدمة. وفي وضع `hybrid`، تُعالَج التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة              | الحقول                                                            | هل يلزم إعادة تشغيل؟ |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| القنوات            | `channels.*`, `web` (WhatsApp) — جميع القنوات المضمنة وقنوات Plugin | لا                   |
| الوكيل والنماذج    | `agent`, `agents`, `models`, `routing`                            | لا                   |
| الأتمتة            | `hooks`, `cron`, `agent.heartbeat`                                | لا                   |
| الجلسات والرسائل   | `session`, `messages`                                             | لا                   |
| الأدوات والوسائط   | `tools`, `browser`, `skills`, `audio`, `talk`                     | لا                   |
| واجهة المستخدم ومتفرقات | `ui`, `logging`, `identity`, `bindings`                       | لا                   |
| خادم Gateway       | `gateway.*` (المنفذ والربط والمصادقة وTailscale وTLS وHTTP)        | **نعم**              |
| البنية التحتية     | `discovery`, `canvasHost`, `plugins`                              | **نعم**              |

<Note>
`gateway.reload` و`gateway.remote` استثناءان — تغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تحرر ملف مصدر يُشار إليه عبر `$include`، يخطط OpenClaw
إعادة التحميل من التخطيط المكتوب في المصدر، وليس من العرض المسطح داخل الذاكرة.
وهذا يجعل قرارات إعادة التحميل الفوري (تطبيق فوري أم إعادة تشغيل) قابلة للتنبؤ حتى عندما
يعيش قسم واحد من المستوى الأعلى في ملف مضمّن مستقل مثل
`plugins: { $include: "./plugins.json5" }`. يفشل تخطيط إعادة التحميل بشكل مغلق إذا كان
تخطيط المصدر ملتبسًا.

## Config RPC (تحديثات برمجية)

بالنسبة إلى الأدوات التي تكتب التكوين عبر Gateway API، ففضّل هذا التدفق:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات
  الأبناء)
- `config.get` لجلب اللقطة الحالية مع `hash`
- `config.patch` للتحديثات الجزئية (JSON merge patch: الكائنات تُدمج، و`null`
  يحذف، والمصفوفات تستبدل)
- `config.apply` فقط عندما تنوي استبدال التكوين بالكامل
- `update.run` لتنفيذ التحديث الذاتي الصريح مع إعادة التشغيل

<Note>
عمليات الكتابة على مستوى التحكم (`config.apply`, `config.patch`, `update.run`) تكون
محددة المعدل إلى 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. وتُدمج طلبات إعادة
التشغيل ثم تفرض فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.
</Note>

مثال على patch جزئي:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` الحقول `raw` و`baseHash` و`sessionKey`,
`note` و`restartDelayMs`. يكون `baseHash` مطلوبًا للطريقتين عندما
يوجد تكوين بالفعل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأم بالإضافة إلى:

- `.env` من دليل العمل الحالي (إذا وُجد)
- `~/.openclaw/.env` (بديل عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة. ويمكنك أيضًا ضبط متغيرات بيئة مضمنة في التكوين:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد متغيرات بيئة Shell (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، يشغّل OpenClaw login shell الخاص بك ويستورد فقط المفاتيح المفقودة:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

المكافئ في متغيرات البيئة: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات البيئة في قيم التكوين">
  أشر إلى متغيرات البيئة في أي قيمة سلسلة نصية في التكوين باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تتم مطابقة الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ وقت التحميل
- استخدم `$${VAR}` للهروب وإخراج القيمة حرفيًا
- يعمل داخل ملفات `$include`
- استبدال مضمن: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="مراجع الأسرار (env وfile وexec)">
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

توجد تفاصيل SecretRef (بما في ذلك `secrets.providers` الخاصة بـ `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
وترد مسارات بيانات الاعتماد المدعومة في [واجهة بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) للحصول على الأولوية الكاملة والمصادر.

## المرجع الكامل

للاطلاع على المرجع الكامل حقلًا بحقل، راجع **[مرجع التكوين](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة التكوين](/ar/gateway/configuration-examples) · [مرجع التكوين](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_
