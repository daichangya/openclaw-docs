---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط الإعداد الشائعة
    - الانتقال إلى أقسام إعداد محددة
summary: 'نظرة عامة على الإعداد: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: الإعداد
x-i18n:
    generated_at: "2026-04-21T07:19:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 479e59fb8b57c5228ef1c6076cf80a4ce6064d3f6fad5f38ea9d75eeb92811dc
    source_path: gateway/configuration.md
    workflow: 15
---

# الإعداد

يقرأ OpenClaw ملف إعداد اختياريًا بصيغة <Tooltip tip="JSON5 تدعم التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. من الأسباب الشائعة لإضافة إعداد:

- ربط القنوات والتحكم في من يمكنه مراسلة الروبوت
- تعيين النماذج والأدوات والعزل أو الأتمتة (Cron وhooks)
- ضبط الجلسات والوسائط والشبكات أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

<Tip>
**هل أنت جديد على الإعداد؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة الإعداد](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة جاهزة للنسخ واللصق.
</Tip>

## الحد الأدنى من الإعداد

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تحرير الإعداد

<Tabs>
  <Tab title="المعالج التفاعلي">
    ```bash
    openclaw onboard       # تدفق الإعداد الأولي الكامل
    openclaw configure     # معالج الإعداد
    ```
  </Tab>
  <Tab title="CLI (أوامر سطر واحد)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="واجهة التحكم">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم علامة التبويب **Config**.
    تعرض واجهة التحكم نموذجًا من schema الإعداد الحي، بما في ذلك بيانات التوثيق الوصفية للحقلين
    `title` / `description` بالإضافة إلى schema الخاصة بالـ Plugin والقناة عند
    توفرها، مع محرر **Raw JSON** كخيار احتياطي. ولواجهات
    التعمق والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup` من أجل
    جلب عقدة schema واحدة محددة بالمسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تحرير مباشر">
    حرر `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبّق التغييرات تلقائيًا (راجع [إعادة التحميل السريع](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق schema بالكامل. تؤدي المفاتيح غير المعروفة، أو الأنواع غير الصحيحة، أو القيم غير الصالحة إلى أن يرفض Gateway **بدء التشغيل**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

ملاحظات أدوات schema:

- يطبع `openclaw config schema` عائلة JSON Schema نفسها المستخدمة بواسطة واجهة التحكم
  والتحقق من الإعداد.
- تعامل مع خرج schema هذا باعتباره العقد المقروء آليًا المعتمد لملف
  `openclaw.json`؛ إذ يقدم هذا الملخص ومرجع الإعداد خلاصة له.
- تُنقل قيم الحقلين `title` و`description` إلى خرج schema من أجل
  أدوات المحررات والنماذج.
- ترث إدخالات الكائنات المتداخلة وwildcard (`*`) وعناصر المصفوفات (`[]`)
  بيانات التوثيق الوصفية نفسها عندما توجد وثائق مطابقة للحقل.
- ترث فروع التركيبات `anyOf` / `oneOf` / `allOf` بيانات التوثيق
  الوصفية نفسها أيضًا، بحيث تحافظ صيغ union/intersection على المساعدة نفسها للحقل.
- يعيد `config.schema.lookup` مسار إعداد واحدًا مُطبّعًا مع
  عقدة schema سطحية (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة
  وحقول التحقق المشابهة)، وبيانات تلميحات واجهة المستخدم الوصفية المطابقة، وملخصات الأبناء المباشرين
  لأدوات التعمق.
- تُدمج schema الخاصة بالقنوات/الـ Plugin وقت التشغيل عندما يتمكن Gateway من تحميل
  سجل manifest الحالي.
- يكتشف `pnpm config:docs:check` الانحراف بين عناصر baseline الخاصة بالإعداد المواجهة للوثائق
  وسطح schema الحالي.

عند فشل التحقق:

- لا يبدأ Gateway
- لا تعمل إلا الأوامر التشخيصية (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

ويحتفظ Gateway أيضًا بنسخة موثوقة من آخر إعداد صالح معروف بعد بدء تشغيل ناجح. إذا
تم تغيير `openclaw.json` لاحقًا خارج OpenClaw ولم يعد صالحًا، فإن بدء التشغيل
وإعادة التحميل السريع يحتفظان بالملف المعطوب كلقطة `.clobbered.*` مختومة بالوقت،
ويستعيدان نسخة آخر إعداد صالح معروف، ويسجلان تحذيرًا واضحًا مع سبب الاسترداد.
كما تتلقى دورة الوكيل الرئيسي التالية أيضًا تحذير حدث نظام يخبره بأن
الإعداد قد استُعيد ويجب عدم إعادة كتابته عميانيًا. ويُحدّث ترقية آخر إعداد صالح معروف
بعد بدء تشغيل تم التحقق منه وبعد عمليات إعادة التحميل السريع المقبولة، بما في ذلك
عمليات كتابة الإعداد المملوكة لـ OpenClaw التي لا يزال hash الملف المحفوظ فيها يطابق
الكتابة المقبولة. ويتم تخطي الترقية عندما يحتوي المرشح على عناصر نائبة لأسرار
محجوبة مثل `***` أو قيم tokens مختصرة.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp، Telegram، Discord، إلخ)">
    لكل قناة قسم إعداد خاص بها ضمن `channels.<provider>`. راجع صفحة القناة المخصصة للحصول على خطوات الإعداد:

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
          allowFrom: ["tg:123"], // فقط لـ allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="اختيار النماذج وتهيئتها">
    اضبط النموذج الأساسي وبدائل اختيارية:

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

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل كقائمة السماح لـ `/model`.
    - تستخدم مراجع النماذج صيغة `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور السجل/الأدوات (الافتراضي `1200`)؛ وتؤدي القيم الأقل عادةً إلى تقليل استخدام رموز الرؤية في التشغيلات الثقيلة باللقطات.
    - راجع [CLI النماذج](/ar/concepts/models) لتبديل النماذج داخل الدردشة و[التحويل الاحتياطي للنموذج](/ar/concepts/model-failover) لمعرفة سلوك تدوير المصادقة والبدائل.
    - بالنسبة إلى المزوّدين المخصصين/المستضافين ذاتيًا، راجع [المزوّدون المخصصون](/ar/gateway/configuration-reference#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة الروبوت">
    يتم التحكم في الوصول إلى الرسائل الخاصة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: يُسمح فقط للمرسلين الموجودين في `allowFrom` (أو في مخزن السماح المقترن)
    - `"open"`: السماح لجميع الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل جميع الرسائل الخاصة

    بالنسبة إلى المجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#dm-and-group-access) للتفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد بوابة الذكر في دردشات المجموعات">
    تكون رسائل المجموعات افتراضيًا على **اشتراط الذكر**. اضبط الأنماط لكل وكيل:

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

    - **الذكر في البيانات الوصفية**: إشارات @ الأصلية (@-mention في WhatsApp، و@bot في Telegram، إلخ)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#group-chat-mention-gating) للتجاوزات الخاصة بكل قناة ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كأساس مشترك، ثم تجاوز الوكلاء
    المحددين بواسطة `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // يرث github وweather
          { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
          { id: "locked-down", skills: [] }, // بدون Skills
        ],
      },
    }
    ```

    - احذف `agents.defaults.skills` إذا أردت Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة القيم الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
    - راجع [Skills](/ar/tools/skills) و[إعداد Skills](/ar/tools/skills-config) و
      [مرجع الإعداد](/ar/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة سلامة قنوات Gateway">
    تحكم في مدى شدة إعادة تشغيل Gateway للقنوات التي تبدو خاملة:

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

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة التشغيل لمراقبة السلامة عالميًا.
    - يجب أن تكون `channelStaleEventThresholdMinutes` أكبر من أو مساوية لفاصل التحقق.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائي لقناة أو حساب واحد من دون تعطيل المراقب العام.
    - راجع [فحوصات السلامة](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لجميع الحقول.

  </Accordion>

  <Accordion title="تهيئة الجلسات وعمليات إعادة الضبط">
    تتحكم الجلسات في استمرارية المحادثة والعزل:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // موصى به لعدة مستخدمين
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
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالخيوط (يدعم Discord الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق وروابط الهوية وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تفعيل العزل">
    شغّل جلسات الوكيل في بيئات sandbox معزولة:

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

    راجع [العزل](/ar/gateway/sandboxing) للحصول على الدليل الكامل و[المرجع الكامل](/ar/gateway/configuration-reference#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تفعيل push المعتمد على relay لبنيات iOS الرسمية">
    يتم إعداد push المعتمد على relay في `openclaw.json`.

    اضبط هذا في إعداد Gateway:

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

    ما الذي يفعله هذا:

    - يتيح لـ Gateway إرسال `push.test` وتنبيهات التنشيط ورسائل إيقاظ إعادة الاتصال عبر relay خارجي.
    - يستخدم إذن إرسال ضمن نطاق التسجيل يمرره تطبيق iOS المقترن. لا يحتاج Gateway إلى relay token على مستوى النشر بالكامل.
    - يربط كل تسجيل معتمد على relay بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يمكن لـ Gateway آخر إعادة استخدام التسجيل المخزن.
    - يُبقي بُنى iOS المحلية/اليدوية على APNs المباشر. لا تنطبق الإرسالات المعتمدة على relay إلا على البنيات الرسمية الموزعة التي سُجلت عبر relay.
    - يجب أن يطابق عنوان URL الأساسي للـ relay المضمّن في بنية iOS الرسمية/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نشر relay نفسه.

    التدفق من طرف إلى طرف:

    1. ثبّت بنية iOS رسمية/TestFlight جرى تجميعها باستخدام عنوان URL الأساسي نفسه للـ relay.
    2. اضبط `gateway.push.apns.relay.baseUrl` على Gateway.
    3. اقترن بتطبيق iOS مع Gateway ودع جلسات Node والمشغّل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجّل لدى relay باستخدام App Attest مع إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المعتمدة على relay إلى Gateway المقترن.
    5. يخزّن Gateway معرّف relay وإذن الإرسال، ثم يستخدمهما في `push.test` وتنبيهات التنشيط ورسائل إيقاظ إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل relay جديد مرتبط بذلك Gateway.
    - إذا أصدرت بنية iOS جديدة تشير إلى نشر relay مختلف، فسيحدّث التطبيق تسجيل relay المخزن مؤقتًا بدلًا من إعادة استخدام أصل relay القديم.

    ملاحظة التوافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات env مؤقتة.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذًا تطويريًا خاصًا بـ loopback فقط؛ لا تحفظ عناوين relay بصيغة HTTP في الإعداد.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) لمعرفة التدفق الكامل و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لمعرفة نموذج أمان relay.

  </Accordion>

  <Accordion title="إعداد Heartbeat (تسجيلات وصول دورية)">
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

    - `every`: سلسلة مدة (`30m`, `2h`). اضبط `0m` للتعطيل.
    - `target`: ‏`last` | `none` | `<channel-id>` (مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: ‏`allow` (الافتراضي) أو `block` لأهداف Heartbeat بأسلوب الرسائل الخاصة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للحصول على الدليل الكامل.

  </Accordion>

  <Accordion title="تهيئة وظائف Cron">
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

    - `sessionRetention`: إزالة جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبط `false` للتعطيل).
    - `runLog`: تقليم `cron/runs/<jobId>.jsonl` حسب الحجم والأسطر المحتفظ بها.
    - راجع [وظائف Cron](/ar/automation/cron-jobs) للحصول على نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhook (hooks)">
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

    ملاحظة أمنية:
    - تعامل مع جميع محتويات حمولة hook/webhook على أنها إدخال غير موثوق.
    - استخدم `hooks.token` مخصصًا؛ لا تعِد استخدام Gateway token المشترك.
    - تكون مصادقة hook عبر الرؤوس فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ وتُرفض tokens في query string.
    - لا يمكن أن يكون `hooks.path` مساويًا لـ `/`؛ احتفظ بحركة Webhook الواردة على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ علامات تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) ما لم تكن تجري تصحيح أخطاء محددًا بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يختارها المتصل.
    - بالنسبة إلى الوكلاء الذين يقودهم hook، فضّل مستويات النماذج الحديثة القوية وسياسة الأدوات الصارمة (مثل المراسلة فقط مع العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="تهيئة توجيه الوكلاء المتعددين">
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

    راجع [الوكلاء المتعددون](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/configuration-reference#multi-agent-routing) لمعرفة قواعد الربط وملفات الوصول لكل وكيل.

  </Accordion>

  <Accordion title="تقسيم الإعداد إلى ملفات متعددة ($include)">
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
    - **مصفوفة ملفات**: تُدمج دمجًا عميقًا بالترتيب (الأخير يتغلب)
    - **المفاتيح الشقيقة**: تُدمج بعد includes (وتتجاوز القيم المضمنة)
    - **includes المتداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، وعمليات التضمين الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل السريع للإعداد

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبّق التغييرات تلقائيًا — لا حاجة إلى إعادة تشغيل يدوي لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة على أنها غير موثوقة حتى تجتاز التحقق. وينتظر المراقب
حتى تهدأ تقلبات الكتابة المؤقتة/إعادة التسمية من المحرر، ثم يقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة عبر استعادة آخر إعداد صالح معروف. وتستخدم
عمليات كتابة الإعداد المملوكة لـ OpenClaw بوابة schema نفسها قبل الكتابة؛ أما الاستبدالات التدميرية مثل
إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف فتُرفض
وتُحفَظ باسم `.rejected.*` للفحص.

إذا رأيت السجل `Config auto-restored from last-known-good` أو
`config reload restored last-known-good config`، فافحص الملف المطابق
`.clobbered.*` المجاور لـ `openclaw.json`، وأصلح الحمولة المرفوضة، ثم شغّل
`openclaw config validate`. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)
للاطلاع على قائمة التحقق الخاصة بالاسترداد.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبّق التغييرات الآمنة فورًا. ويعيد التشغيل تلقائيًا للتغييرات الحرجة.                |
| **`hot`**              | يطبّق التغييرات الآمنة فقط. ويسجل تحذيرًا عند الحاجة إلى إعادة تشغيل — وأنت تتولى ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في الإعداد، سواء كان آمنًا أم لا.                      |
| **`off`**              | يعطّل مراقبة الملفات. وتدخل التغييرات حيز التنفيذ عند إعادة التشغيل اليدوي التالية.    |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما الذي يُطبّق سريعًا وما الذي يحتاج إلى إعادة تشغيل

تُطبّق معظم الحقول سريعًا من دون توقف. في وضع `hybrid`، تُعالج التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة              | الحقول                                                               | هل يلزم إعادة تشغيل؟ |
| ------------------ | -------------------------------------------------------------------- | -------------------- |
| القنوات            | `channels.*`, `web` (WhatsApp) — كل القنوات المدمجة وقنوات الامتدادات | لا                   |
| الوكيل والنماذج    | `agent`, `agents`, `models`, `routing`                               | لا                   |
| الأتمتة            | `hooks`, `cron`, `agent.heartbeat`                                   | لا                   |
| الجلسات والرسائل   | `session`, `messages`                                                | لا                   |
| الأدوات والوسائط   | `tools`, `browser`, `skills`, `audio`, `talk`                        | لا                   |
| واجهة المستخدم ومتفرقات | `ui`, `logging`, `identity`, `bindings`                              | لا                   |
| خادم Gateway       | `gateway.*` (المنفذ، والربط، والمصادقة، وtailscale، وTLS، وHTTP)      | **نعم**             |
| البنية التحتية     | `discovery`, `canvasHost`, `plugins`                                 | **نعم**             |

<Note>
يُعد `gateway.reload` و`gateway.remote` استثناءين — فتغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

## Config RPC (تحديثات برمجية)

<Note>
تُقيَّد طلبات RPC الخاصة بالكتابة في مستوى التحكم (`config.apply`, `config.patch`, `update.run`) بمعدل **3 طلبات لكل 60 ثانية** لكل `deviceId+clientIp`. وعند بلوغ الحد، تُرجع RPC القيمة `UNAVAILABLE` مع `retryAfterMs`.
</Note>

التدفق الآمن/الافتراضي:

- `config.schema.lookup`: فحص شجرة الإعداد الفرعية المحددة بمسار واحد مع عقدة
  schema سطحية، وبيانات hint وصفية مطابقة، وملخصات الأبناء المباشرين
- `config.get`: جلب اللقطة الحالية + hash
- `config.patch`: المسار المفضل للتحديث الجزئي
- `config.apply`: استبدال الإعداد الكامل فقط
- `update.run`: تحديث ذاتي + إعادة تشغيل صريحان

عندما لا تستبدل الإعداد بالكامل، فضّل `config.schema.lookup`
ثم `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (استبدال كامل)">
    يتحقق من الإعداد الكامل ويكتبه ويعيد تشغيل Gateway في خطوة واحدة.

    <Warning>
    يستبدل `config.apply` **الإعداد بالكامل**. استخدم `config.patch` للتحديثات الجزئية، أو `openclaw config set` للمفاتيح الفردية.
    </Warning>

    المعلمات:

    - `raw` (سلسلة نصية) — حمولة JSON5 للإعداد بالكامل
    - `baseHash` (اختياري) — hash الإعداد من `config.get` (مطلوب عندما يكون الإعداد موجودًا)
    - `sessionKey` (اختياري) — مفتاح الجلسة لطلب ping التنشيط بعد إعادة التشغيل
    - `note` (اختياري) — ملاحظة لـ restart sentinel
    - `restartDelayMs` (اختياري) — تأخير قبل إعادة التشغيل (الافتراضي 2000)

    تُدمج طلبات إعادة التشغيل عندما يكون طلب منها معلقًا/قيد التنفيذ بالفعل، كما تُطبّق فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.

    ```bash
    openclaw gateway call config.get --params '{}'  # التقط payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (تحديث جزئي)">
    يدمج تحديثًا جزئيًا في الإعداد الحالي (وفق دلالات JSON merge patch):

    - تُدمج الكائنات بشكل递归
    - تحذف `null` مفتاحًا
    - تستبدل المصفوفات

    المعلمات:

    - `raw` (سلسلة نصية) — JSON5 يحتوي فقط على المفاتيح المراد تغييرها
    - `baseHash` (مطلوب) — hash الإعداد من `config.get`
    - `sessionKey` و`note` و`restartDelayMs` — مثل `config.apply`

    يطابق سلوك إعادة التشغيل `config.apply`: دمج طلبات إعادة التشغيل المعلقة بالإضافة إلى فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## متغيرات البيئة

يقرأ OpenClaw متغيرات env من العملية الأب بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وُجد)
- `~/.openclaw/.env` (حل احتياطي عام)

لا يتجاوز أي من الملفين متغيرات env الموجودة. يمكنك أيضًا تعيين متغيرات env مضمنة في الإعداد:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد env من shell (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، يشغّل OpenClaw login shell الخاص بك ويستورد المفاتيح الناقصة فقط:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

المكافئ في متغير env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات env في قيم الإعداد">
  أشر إلى متغيرات env في أي قيمة سلسلة نصية في الإعداد باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تتم مطابقة الأسماء المكتوبة بالأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ وقت التحميل
- استخدم `$${VAR}` للهروب وإخراجها حرفيًا
- يعمل هذا داخل ملفات `$include`
- استبدال مضمن: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

توجد تفاصيل SecretRef (بما في ذلك `secrets.providers` الخاصة بـ `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
وتُسرد مسارات بيانات الاعتماد المدعومة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) للاطلاع على الأولوية الكاملة والمصادر.

## المرجع الكامل

للاطلاع على المرجع الكامل حقلًا بحقل، راجع **[مرجع الإعداد](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة الإعداد](/ar/gateway/configuration-examples) · [مرجع الإعداد](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_
