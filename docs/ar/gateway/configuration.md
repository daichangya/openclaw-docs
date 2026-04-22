---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام التكوين المحددة
summary: 'نظرة عامة على التكوين: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-04-22T04:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c627ccf9f17087e0b71663fe3086d637aeaa8cd1d6d34d816bfcbc0f0cc6f07c
    source_path: gateway/configuration.md
    workflow: 15
---

# التكوين

يقرأ OpenClaw تكوينًا اختياريًا بصيغة <Tooltip tip="JSON5 يدعم التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. ومن الأسباب الشائعة لإضافة تكوين:

- توصيل القنوات والتحكم في من يمكنه مراسلة البوت
- تعيين النماذج، والأدوات، وsandboxing، أو الأتمتة (Cron، hooks)
- ضبط الجلسات، والوسائط، والشبكات، أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

<Tip>
**هل أنت جديد على التكوين؟** ابدأ باستخدام `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة التكوين](/ar/gateway/configuration-examples) للحصول على تكوينات كاملة قابلة للنسخ واللصق.
</Tip>

## الحد الأدنى من التكوين

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تعديل التكوين

<Tabs>
  <Tab title="المعالج التفاعلي">
    ```bash
    openclaw onboard       # تدفق الإعداد الأولي الكامل
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
  <Tab title="واجهة المستخدم Control">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم علامة التبويب **Config**.
    تعرض واجهة المستخدم Control نموذجًا من مخطط التكوين المباشر، بما في ذلك بيانات
    التوثيق `title` / `description` الخاصة بالحقول، بالإضافة إلى مخططات plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كخيار احتياطي. وبالنسبة إلى واجهات
    التعمق والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup` من أجل
    جلب عقدة مخطط واحدة محددة المسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تعديل مباشر">
    عدّل `~/.openclaw/openclaw.json` مباشرة. يراقب Gateway الملف ويطبّق التغييرات تلقائيًا (راجع [إعادة التحميل السريع](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا التكوينات التي تطابق المخطط بالكامل. وتتسبب المفاتيح غير المعروفة، أو الأنواع غير الصحيحة، أو القيم غير الصالحة في أن **يرفض Gateway بدء التشغيل**. والاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، بحيث يمكن للمحررات إرفاق بيانات JSON Schema الوصفية.
</Warning>

ملاحظات أدوات المخطط:

- يطبع `openclaw config schema` عائلة JSON Schema نفسها التي تستخدمها واجهة المستخدم Control
  والتحقق من التكوين.
- تعامل مع مخرجات هذا المخطط على أنها العقد القياسي القابل للقراءة آليًا لـ
  `openclaw.json`؛ وتقوم هذه النظرة العامة ومرجع التكوين بتلخيصه.
- تُنقل قيم `title` و`description` الخاصة بالحقول إلى مخرجات المخطط من أجل
  أدوات المحرر والنماذج.
- ترث إدخالات الكائنات المتداخلة، وwildcard (`*`)، وعناصر المصفوفات (`[]`) بيانات
  التوثيق الوصفية نفسها حيثما وُجد توثيق حقل مطابق.
- وترث أيضًا فروع التركيب `anyOf` / `oneOf` / `allOf` بيانات
  التوثيق الوصفية نفسها، بحيث تحتفظ متغيرات union/intersection بمساعدة الحقول نفسها.
- يعيد `config.schema.lookup` مسار تكوين واحدًا مُطبّعًا مع عقدة مخطط سطحية
  (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة
  وحقول تحقق مماثلة)، وبيانات تلميحات واجهة المستخدم المطابقة، وملخصات الأبناء المباشرين
  لأدوات التعمق.
- يتم دمج مخططات plugin/القنوات أثناء التشغيل عندما يتمكن gateway من تحميل
  سجل manifest الحالي.
- يكتشف `pnpm config:docs:check` الانحراف بين
  عناصر baseline الخاصة بالتكوين المواجهة للوثائق وسطح المخطط الحالي.

عند فشل التحقق:

- لا يتم إقلاع Gateway
- لا تعمل إلا الأوامر التشخيصية (`openclaw doctor` و`openclaw logs` و`openclaw health` و`openclaw status`)
- شغّل `openclaw doctor` لمعرفة المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

ويحتفظ Gateway أيضًا بنسخة موثوقة معروفة بأنها صالحة بعد بدء تشغيل ناجح. وإذا
تم لاحقًا تغيير `openclaw.json` خارج OpenClaw ولم يعد صالحًا، فإن بدء التشغيل
وإعادة التحميل السريع يحافظان على الملف المعطّل كلقطة `.clobbered.*` تحمل طابعًا زمنيًا،
ويستعيدان آخر نسخة معروفة بأنها صالحة، ويسجلان تحذيرًا واضحًا مع سبب الاسترداد.
ويتلقى دور الوكيل الرئيسي التالي أيضًا تحذير حدث-نظام يخبره بأن
التكوين قد تم استعادته ويجب عدم إعادة كتابته بشكل أعمى. ويتم تحديث ترقية آخر نسخة معروفة بأنها صالحة
بعد بدء تشغيل تم التحقق منه وبعد عمليات إعادة التحميل السريع المقبولة، بما في ذلك
كتابات التكوين المملوكة لـ OpenClaw التي لا يزال hash الملف المحفوظ فيها يطابق
الكتابة المقبولة. ويتم تخطي الترقية عندما يحتوي المرشح على عناصر نائبة
منقّحة لأسرار مثل `***` أو قيم token مختصرة.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp أو Telegram أو Discord وما إلى ذلك)">
    لكل قناة قسم تكوين خاص بها ضمن `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

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

    تشترك جميع القنوات في نمط سياسة الرسائل المباشرة نفسه:

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

  <Accordion title="اختيار النماذج وتكوينها">
    عيّن النموذج الأساسي وخيارات fallback الاختيارية:

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
    - تستخدم مراجع النماذج صيغة `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير حجم الصور في transcript/tool (الافتراضي `1200`)؛ وتقلل القيم الأقل عادةً من استخدام vision-token في التشغيلات الكثيفة باللقطات.
    - راجع [Models CLI](/ar/concepts/models) لتبديل النماذج داخل الدردشة و[Model Failover](/ar/concepts/model-failover) لمعرفة تدوير المصادقة وسلوك fallback.
    - بالنسبة إلى مقدّمي الخدمات المخصصين/ذوي الاستضافة الذاتية، راجع [Custom providers](/ar/gateway/configuration-reference#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة البوت">
    يتم التحكم في وصول الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز pairing لمرة واحدة للموافقة
    - `"allowlist"`: فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن)
    - `"open"`: السماح لجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل جميع الرسائل المباشرة

    بالنسبة إلى المجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#dm-and-group-access) للحصول على التفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد تقييد الذكر في دردشة المجموعات">
    تستخدم رسائل المجموعات افتراضيًا **اشتراط الذكر**. قم بتكوين الأنماط لكل وكيل:

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

    - **الذكر في البيانات الوصفية**: إشارات @ الأصلية (الضغط للذكر في WhatsApp، و@bot في Telegram، وما إلى ذلك)
    - **الأنماط النصية**: أنماط regex آمنة في `mentionPatterns`
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#group-chat-mention-gating) للحصول على التجاوزات الخاصة بكل قناة ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كخط أساس مشترك، ثم تجاوز الوكلاء
    المحددين باستخدام `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // يرث github, weather
          { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية
          { id: "locked-down", skills: [] }, // بدون Skills
        ],
      },
    }
    ```

    - احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - عيّن `agents.list[].skills: []` لعدم استخدام أي Skills.
    - راجع [Skills](/ar/tools/skills) و[إعداد Skills](/ar/tools/skills-config) و
      [مرجع التكوين](/ar/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة سلامة قنوات gateway">
    تحكم في مدى قوة إعادة تشغيل gateway للقنوات التي تبدو قديمة:

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

    - عيّن `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقبة السلامة عالميًا.
    - يجب أن يكون `channelStaleEventThresholdMinutes` أكبر من أو مساويًا لفاصل التحقق.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائي لقناة أو حساب واحد من دون تعطيل المراقب العام.
    - راجع [Health Checks](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لجميع الحقول.

  </Accordion>

  <Accordion title="تكوين الجلسات وإعادة التعيين">
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

    - `dmScope`: ‏`main` (مشتركة) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: القيم الافتراضية العامة لتوجيه الجلسات المرتبطة بالخيوط (يدعم Discord الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تمكين sandboxing">
    شغّل جلسات الوكيل داخل بيئات sandbox معزولة:

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

    قم أولًا ببناء الصورة: `scripts/sandbox-setup.sh`

    راجع [Sandboxing](/ar/gateway/sandboxing) للحصول على الدليل الكامل و[المرجع الكامل](/ar/gateway/configuration-reference#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تمكين push المدعوم بـ relay للإصدارات الرسمية من iOS">
    يتم تكوين push المدعوم بـ relay في `openclaw.json`.

    عيّن هذا في تكوين gateway:

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

    المكافئ عبر CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    ما الذي يفعله هذا:

    - يتيح لـ gateway إرسال `push.test` وتنبيهات الإيقاظ وعمليات إيقاظ إعادة الاتصال عبر relay الخارجي.
    - يستخدم إذن إرسال بنطاق التسجيل تتم إعادة توجيهه بواسطة تطبيق iOS المقترن. ولا يحتاج gateway إلى token relay على مستوى النشر بالكامل.
    - يربط كل تسجيل مدعوم بـ relay بهوية gateway التي اقترن بها تطبيق iOS، بحيث لا يمكن لـ gateway آخر إعادة استخدام التسجيل المخزن.
    - يُبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. وتنطبق الإرسالات المدعومة بـ relay فقط على الإصدارات الرسمية الموزعة التي سجّلت عبر relay.
    - يجب أن يطابق عنوان URL الأساسي لـ relay المضمَّن في إصدار iOS الرسمي/TestFlight، بحيث تصل حركة التسجيل والإرسال إلى نشر relay نفسه.

    التدفق من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسميًا/TestFlight تم تجميعه باستخدام عنوان URL الأساسي نفسه لـ relay.
    2. قم بتكوين `gateway.push.apns.relay.baseUrl` على gateway.
    3. قم بإقران تطبيق iOS بـ gateway واترك كلًا من جلسات Node والمشغّل تتصل.
    4. يجلب تطبيق iOS هوية gateway، ويسجل مع relay باستخدام App Attest بالإضافة إلى إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بـ relay إلى gateway المقترن.
    5. يخزن gateway مقبض relay وإذن الإرسال، ثم يستخدمهما من أجل `push.test` وتنبيهات الإيقاظ وعمليات إيقاظ إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا قمت بتبديل تطبيق iOS إلى gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل relay جديد مرتبط بذلك gateway.
    - إذا قمت بشحن إصدار iOS جديد يشير إلى نشر relay مختلف، فسيحدّث التطبيق تسجيل relay المخزن مؤقتًا بدلًا من إعادة استخدام مصدر relay القديم.

    ملاحظة التوافق:

    - ما زال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات env مؤقتة.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` مخرج تطوير خاصًا بـ local loopback فقط؛ لا تحتفظ بعناوين URL خاصة بـ HTTP relay في التكوين.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) لمعرفة التدفق الكامل من البداية إلى النهاية و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لمعرفة نموذج أمان relay.

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

    - `every`: سلسلة مدة (`30m`، `2h`). عيّن `0m` للتعطيل.
    - `target`: ‏`last` | `none` | `<channel-id>` (على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: ‏`allow` (الافتراضي) أو `block` لأهداف Heartbeat بأسلوب الرسائل المباشرة
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

    - `sessionRetention`: إزالة جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ عيّن `false` للتعطيل).
    - `runLog`: تقليم `cron/runs/<jobId>.jsonl` حسب الحجم وعدد الأسطر المحتفظ بها.
    - راجع [مهام Cron](/ar/automation/cron-jobs) لمعرفة نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhook (hooks)">
    قم بتمكين نقاط نهاية HTTP Webhook على Gateway:

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
    - تعامل مع كل محتوى حمولة hook/Webhook على أنه إدخال غير موثوق.
    - استخدم `hooks.token` مخصصًا؛ لا تعِد استخدام token الخاص بـ Gateway المشترك.
    - تكون مصادقة Hook عبر الترويسة فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ ويتم رفض tokens في query string.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ علامات تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent` و`hooks.mappings[].allowUnsafeExternalContent`) ما لم تكن تجري تصحيح أخطاء محدودًا بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يحددها المتصل.
    - بالنسبة إلى الوكلاء المدفوعين بـ hook، ففضّل مستويات نماذج حديثة قوية وسياسة أدوات صارمة (على سبيل المثال، المراسلة فقط مع sandboxing حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="تكوين توجيه متعدد الوكلاء">
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

    راجع [Multi-Agent](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/configuration-reference#multi-agent-routing) لمعرفة قواعد الربط وملفات الوصول الخاصة بكل وكيل.

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
    - **مصفوفة ملفات**: يتم دمجها بعمق بالترتيب (اللاحق يفوز)
    - **مفاتيح شقيقة**: يتم دمجها بعد include (وتتجاوز القيم المضمّنة)
    - **تضمينات متداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: يتم حلها نسبةً إلى الملف الذي يضمّنها
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، وحلقات التضمين

  </Accordion>
</AccordionGroup>

## إعادة التحميل السريع للتكوين

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبّق التغييرات تلقائيًا — لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة على أنها غير موثوقة حتى يتم التحقق منها. وينتظر المراقب
استقرار تغييرات الكتابة/إعادة التسمية المؤقتة من المحرر، ويقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة من خلال استعادة آخر تكوين معروف بأنه صالح. وتستخدم
كتابات التكوين المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة؛ ويتم رفض
الكتابات المدمّرة
مثل إسقاط `gateway.mode` أو تقليص الملف إلى أقل من النصف
ويتم حفظها بصيغة `.rejected.*` للفحص.

إذا رأيت `Config auto-restored from last-known-good` أو
`config reload restored last-known-good config` في السجلات، فافحص الملف
`.clobbered.*` المطابق بجوار `openclaw.json`، ثم أصلح الحمولة المرفوضة، ثم شغّل
`openclaw config validate`. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)
للاطلاع على قائمة التحقق الخاصة بالاسترداد.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبّق التغييرات الآمنة فورًا أثناء التشغيل. ويعيد التشغيل تلقائيًا للتغييرات الحرجة.           |
| **`hot`**              | يطبّق التغييرات الآمنة فقط أثناء التشغيل. ويسجل تحذيرًا عندما تكون إعادة التشغيل مطلوبة — وتتولى أنت ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في التكوين، سواء كان آمنًا أم لا.                                 |
| **`off`**              | يعطّل مراقبة الملفات. وتصبح التغييرات سارية في إعادة التشغيل اليدوية التالية.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما الذي يُطبَّق أثناء التشغيل مقابل ما يحتاج إلى إعادة تشغيل

تُطبَّق معظم الحقول أثناء التشغيل من دون توقف. وفي وضع `hybrid`، تتم معالجة التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة            | الحقول                                                            | هل يلزم إعادة تشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| القنوات            | `channels.*`, `web` (WhatsApp) — جميع القنوات المضمنة وقنوات plugin | لا              |
| الوكيل والنماذج      | `agent`, `agents`, `models`, `routing`                            | لا              |
| الأتمتة          | `hooks`, `cron`, `agent.heartbeat`                                | لا              |
| الجلسات والرسائل | `session`, `messages`                                             | لا              |
| الأدوات والوسائط       | `tools`, `browser`, `skills`, `audio`, `talk`                     | لا              |
| واجهة المستخدم ومتفرقات           | `ui`, `logging`, `identity`, `bindings`                           | لا              |
| خادم Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **نعم**         |
| البنية التحتية      | `discovery`, `canvasHost`, `plugins`                              | **نعم**         |

<Note>
يُعد `gateway.reload` و`gateway.remote` استثناءين — فتغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

## Config RPC (تحديثات برمجية)

<Note>
تخضع عمليات RPC الخاصة بالكتابة في مستوى التحكم (`config.apply` و`config.patch` و`update.run`) لتحديد معدل يبلغ **3 طلبات لكل 60 ثانية** لكل `deviceId+clientIp`. وعند بلوغ الحد، يعيد RPC القيمة `UNAVAILABLE` مع `retryAfterMs`.
</Note>

التدفق الآمن/الافتراضي:

- `config.schema.lookup`: فحص شجرة فرعية واحدة من التكوين محددة بالمسار مع عقدة
  مخطط سطحية، وبيانات التلميحات المطابقة، وملخصات الأبناء المباشرين
- `config.get`: جلب snapshot الحالي + hash
- `config.patch`: المسار المفضل للتحديثات الجزئية
- `config.apply`: استبدال التكوين بالكامل فقط
- `update.run`: تحديث ذاتي صريح + إعادة تشغيل

عندما لا تستبدل التكوين بالكامل، ففضّل `config.schema.lookup`
ثم `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (استبدال كامل)">
    يتحقق من التكوين الكامل ويكتبه ثم يعيد تشغيل Gateway في خطوة واحدة.

    <Warning>
    يستبدل `config.apply` **التكوين بالكامل**. استخدم `config.patch` للتحديثات الجزئية، أو `openclaw config set` للمفاتيح المفردة.
    </Warning>

    المعلمات:

    - `raw` (string) — حمولة JSON5 للتكوين بالكامل
    - `baseHash` (اختياري) — hash التكوين من `config.get` (مطلوب عندما يكون التكوين موجودًا)
    - `sessionKey` (اختياري) — مفتاح الجلسة لتنبيه الاستيقاظ بعد إعادة التشغيل
    - `note` (اختياري) — ملاحظة لـ restart sentinel
    - `restartDelayMs` (اختياري) — التأخير قبل إعادة التشغيل (الافتراضي 2000)

    يتم دمج طلبات إعادة التشغيل بينما يكون أحدها معلقًا/قيد التنفيذ بالفعل، وتُطبَّق مهلة 30 ثانية بين دورات إعادة التشغيل.

    ```bash
    openclaw gateway call config.get --params '{}'  # التقاط payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (تحديث جزئي)">
    يدمج تحديثًا جزئيًا في التكوين الحالي (وفق دلالات JSON merge patch):

    - يتم دمج الكائنات بشكل递归
    - تؤدي `null` إلى حذف مفتاح
    - تستبدل المصفوفات

    المعلمات:

    - `raw` (string) — ‏JSON5 يحتوي فقط على المفاتيح المطلوب تغييرها
    - `baseHash` (مطلوب) — hash التكوين من `config.get`
    - `sessionKey` و`note` و`restartDelayMs` — مثل `config.apply`

    يطابق سلوك إعادة التشغيل `config.apply`: دمج طلبات إعادة التشغيل المعلقة مع مهلة 30 ثانية بين دورات إعادة التشغيل.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأب بالإضافة إلى:

- `.env` من دليل العمل الحالي (إذا كان موجودًا)
- `~/.openclaw/.env` (fallback عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة بالفعل. ويمكنك أيضًا تعيين متغيرات بيئة مضمنة داخل التكوين:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد متغيرات بيئة shell (اختياري)">
  إذا كان ممكّنًا ولم تكن المفاتيح المتوقعة معيّنة، يشغّل OpenClaw login shell الخاص بك ويستورد فقط المفاتيح المفقودة:

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
  ارجع إلى متغيرات البيئة في أي قيمة سلسلة نصية ضمن التكوين باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تتم مطابقة الأسماء ذات الأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تتسبب المتغيرات المفقودة/الفارغة في حدوث خطأ وقت التحميل
- استخدم `$${VAR}` للهروب وإخراج القيمة حرفيًا
- يعمل داخل ملفات `$include`
- الاستبدال المضمن: `"${BASE}/v1"` ← `"https://api.example.com/v1"`

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

توجد تفاصيل SecretRef (بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) في [Secrets Management](/ar/gateway/secrets).
وترد مسارات بيانات الاعتماد المدعومة في [SecretRef Credential Surface](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [Environment](/ar/help/environment) لمعرفة الأولوية الكاملة والمصادر.

## المرجع الكامل

للاطلاع على المرجع الكامل حقلًا بحقل، راجع **[مرجع التكوين](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة التكوين](/ar/gateway/configuration-examples) · [مرجع التكوين](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_
