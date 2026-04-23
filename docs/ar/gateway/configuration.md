---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط إعدادات شائعة
    - الانتقال إلى أقسام إعدادات محددة
summary: 'نظرة عامة على الإعدادات: المهام الشائعة، والإعداد السريع، وروابط المرجع الكامل'
title: الإعدادات
x-i18n:
    generated_at: "2026-04-23T07:24:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8130d29e9fbf5104d0a76f26b26186b6aab2b211030b8c8ba0d1131daf890993
    source_path: gateway/configuration.md
    workflow: 15
---

# الإعدادات

يقرأ OpenClaw إعدادات اختيارية بصيغة <Tooltip tip="تدعم JSON5 التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار الإعدادات النشط ملفًا عاديًا. التخطيطات التي تستخدم
`openclaw.json` كرابط رمزي غير مدعومة لعمليات الكتابة التي يملكها OpenClaw؛ إذ قد تستبدل
الكتابة الذرية المسار بدلًا من الحفاظ على الرابط الرمزي. إذا كنت تحتفظ بالإعدادات خارج
دليل الحالة الافتراضي، فوجّه `OPENCLAW_CONFIG_PATH` مباشرة إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. من الأسباب الشائعة لإضافة ملف إعدادات:

- توصيل القنوات والتحكم في من يمكنه مراسلة البوت
- ضبط النماذج، والأدوات، والعزل، أو الأتمتة (Cron، وHooks)
- ضبط الجلسات، والوسائط، والشبكات، أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

<Tip>
**هل أنت جديد على الإعدادات؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة الإعدادات](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة جاهزة للنسخ واللصق.
</Tip>

## الحد الأدنى من الإعدادات

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تعديل الإعدادات

<Tabs>
  <Tab title="المعالج التفاعلي">
    ```bash
    openclaw onboard       # تدفق الإعداد الأولي الكامل
    openclaw configure     # معالج الإعدادات
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
    تعرض واجهة التحكم نموذجًا من مخطط الإعدادات الحي، بما في ذلك بيانات
    التوثيق الوصفية للحقل `title` / `description` بالإضافة إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كمسار هروب. وبالنسبة إلى
    واجهات التعمق والأدوات الأخرى، يكشف gateway أيضًا `config.schema.lookup` من أجل
    جلب عقدة مخطط واحدة محددة المسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تعديل مباشر">
    عدّل `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبق التغييرات تلقائيًا (راجع [إعادة التحميل السريع](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق المخطط بالكامل. أي مفاتيح غير معروفة، أو أنواع غير صحيحة، أو قيم غير صالحة ستجعل Gateway **يرفض البدء**. الاستثناء الوحيد على مستوى الجذر هو `$schema` ‏(سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

ملاحظات حول أدوات المخطط:

- يطبع `openclaw config schema` عائلة JSON Schema نفسها التي تستخدمها واجهة التحكم
  والتحقق من الإعدادات.
- تعامل مع خرج هذا المخطط على أنه العقد القابل للقراءة آليًا المرجعي لملف
  `openclaw.json`؛ وتقوم هذه النظرة العامة ومرجع الإعدادات بتلخيصه.
- تُنقل قيم `title` و`description` الخاصة بالحقول إلى خرج المخطط من أجل
  أدوات المحرر والنماذج.
- ترث إدخالات الكائنات المتداخلة، وwildcard (`*`)، وعناصر المصفوفة (`[]`)
  بيانات التوثيق الوصفية نفسها حيثما وُجد توثيق مطابق للحقول.
- ترث أيضًا فروع التركيبات `anyOf` / `oneOf` / `allOf` بيانات التوثيق
  الوصفية نفسها، بحيث تحتفظ متغيرات union/intersection بمساعدة الحقول نفسها.
- يعيد `config.schema.lookup` مسار إعدادات واحدًا بعد التطبيع مع
  عقدة مخطط سطحية (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة
  وحقول تحقق مشابهة)، وبيانات تلميح واجهة مستخدم وصفية مطابقة، وملخصات الأبناء
  المباشرين لأدوات التعمق.
- يتم دمج مخططات Plugin/القنوات وقت التشغيل عندما يتمكن gateway من تحميل
  سجل manifest الحالي.
- يكتشف `pnpm config:docs:check` الانجراف بين عناصر الأساس الخاصة بالإعدادات
  المواجهة للتوثيق وسطح المخطط الحالي.

عند فشل التحقق:

- لا يتم إقلاع Gateway
- تعمل فقط أوامر التشخيص (`openclaw doctor` و`openclaw logs` و`openclaw health` و`openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway أيضًا بنسخة موثوقة من آخر إعدادات سليمة معروفة بعد نجاح بدء التشغيل. إذا
تم تعديل `openclaw.json` لاحقًا خارج OpenClaw ولم يعد صالحًا، فإن بدء التشغيل
وإعادة التحميل السريع يحافظان على الملف المعطوب كلقطة زمنية باسم `.clobbered.*`،
ويستعيدان نسخة آخر إعدادات سليمة معروفة، ويسجلان تحذيرًا واضحًا مع سبب الاستعادة.
كما تتعامل استعادة القراءة عند بدء التشغيل أيضًا مع الانخفاضات الحادة في الحجم، وغياب بيانات الإعدادات الوصفية، وغياب
`gateway.mode` على أنها مؤشرات تلف حرجة عندما كانت
نسخة آخر إعدادات سليمة معروفة تحتوي على تلك الحقول.
إذا تمت إضافة سطر حالة/سجل عن طريق الخطأ قبل إعداد JSON صالح
في غير ذلك، يمكن لبدء gateway و`openclaw doctor --fix` إزالة البادئة،
والاحتفاظ بالملف الملوث كملف `.clobbered.*`، ومتابعة العمل باستخدام
JSON المستعاد.
ويتلقى الدور التالي للوكيل الرئيسي أيضًا تحذيرًا كحدث نظام يخبره بأن
الإعدادات قد تم استعادتها ويجب عدم إعادة كتابتها بشكل أعمى. ويتم تحديث ترقية
آخر إعدادات سليمة معروفة بعد بدء تشغيل تم التحقق منه وبعد عمليات إعادة التحميل السريع المقبولة، بما في ذلك
عمليات كتابة الإعدادات التي يملكها OpenClaw عندما يظل تجزئة الملف المحفوظة مطابقة لعملية
الكتابة المقبولة. ويتم تخطي الترقية عندما يحتوي المرشح على
عناصر نائبة للأسرار منقّحة مثل `***` أو قيم رموز مميزة مختصرة.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp أو Telegram أو Discord أو غيرها)">
    لكل قناة قسم إعدادات خاص بها تحت `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

    - [WhatsApp](/ar/channels/whatsapp) — ‏`channels.whatsapp`
    - [Telegram](/ar/channels/telegram) — ‏`channels.telegram`
    - [Discord](/ar/channels/discord) — ‏`channels.discord`
    - [Feishu](/ar/channels/feishu) — ‏`channels.feishu`
    - [Google Chat](/ar/channels/googlechat) — ‏`channels.googlechat`
    - [Microsoft Teams](/ar/channels/msteams) — ‏`channels.msteams`
    - [Slack](/ar/channels/slack) — ‏`channels.slack`
    - [Signal](/ar/channels/signal) — ‏`channels.signal`
    - [iMessage](/ar/channels/imessage) — ‏`channels.imessage`
    - [Mattermost](/ar/channels/mattermost) — ‏`channels.mattermost`

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

  <Accordion title="اختيار النماذج وإعدادها">
    اضبط النموذج الأساسي والبدائل الاختيارية:

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

    - يعرّف `agents.defaults.models` فهرس النماذج ويعمل كقائمة سماح للأمر `/model`.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح من دون إزالة النماذج الحالية. تُرفض عمليات الاستبدال العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج تنسيق `provider/model` ‏(مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير أبعاد الصور في النص/الأداة (الافتراضي `1200`)؛ وعادةً ما تقلل القيم الأقل من استخدام رموز الرؤية في التشغيلات الثقيلة بلقطات الشاشة.
    - راجع [CLI الخاص بالنماذج](/ar/concepts/models) لتبديل النماذج داخل الدردشة و[Model Failover](/ar/concepts/model-failover) لمعرفة سلوك تدوير المصادقة والبدائل.
    - بالنسبة إلى المزوّدين المخصصين/المستضافين ذاتيًا، راجع [المزوّدون المخصصون](/ar/gateway/configuration-reference#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة البوت">
    يتم التحكم في الوصول إلى الرسائل الخاصة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: المرسلون الموجودون فقط في `allowFrom` ‏(أو مخزن السماح الخاص بالاقتران)
    - `"open"`: السماح لجميع الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل جميع الرسائل الخاصة

    بالنسبة إلى المجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#dm-and-group-access) للتفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد تقييد الإشارات في الدردشة الجماعية">
    تفترض رسائل المجموعات افتراضيًا **اشتراط الإشارة**. قم بتكوين الأنماط لكل وكيل:

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

    - **إشارات البيانات الوصفية**: إشارات @ أصلية (WhatsApp tap-to-mention، وTelegram @bot، وما إلى ذلك)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#group-chat-mention-gating) لمعرفة التجاوزات الخاصة بكل قناة ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كخط أساس مشترك، ثم تجاوز
    الوكلاء المحددين باستخدام `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // يرث github وweather
          { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية
          { id: "locked-down", skills: [] }, // بدون Skills
        ],
      },
    }
    ```

    - احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
    - راجع [Skills](/ar/tools/skills) و[إعدادات Skills](/ar/tools/skills-config) و
      [مرجع الإعدادات](/ar/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة سلامة قنوات gateway">
    تحكم في مدى شدة إعادة تشغيل gateway للقنوات التي تبدو قديمة:

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

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقبة السلامة على مستوى عام.
    - يجب أن تكون `channelStaleEventThresholdMinutes` أكبر من أو تساوي فترة الفحص.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائي لقناة أو حساب واحد من دون تعطيل المراقب العام.
    - راجع [فحوصات السلامة](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لجميع الحقول.

  </Accordion>

  <Accordion title="تكوين الجلسات وعمليات إعادة التعيين">
    تتحكم الجلسات في استمرارية المحادثة وعزلها:

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
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالسلاسل (يدعم Discord الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تمكين العزل">
    شغّل جلسات الوكيل داخل بيئات تشغيل معزولة:

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

  <Accordion title="تمكين push المدعوم بالـ relay لإصدارات iOS الرسمية">
    يتم تكوين push المدعوم بالـ relay في `openclaw.json`.

    اضبط هذا في إعدادات gateway:

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

    - يسمح للـ gateway بإرسال `push.test`، وإشعارات التنبيه للإيقاظ، وإيقاظات إعادة الاتصال عبر relay خارجي.
    - يستخدم إذن إرسال محددًا بالتسجيل تُمرّره إلى الأمام تطبيقات iOS المقترنة. لا يحتاج gateway إلى رمز relay على مستوى النشر بالكامل.
    - يربط كل تسجيل مدعوم بالـ relay بهوية gateway التي اقترن بها تطبيق iOS، بحيث لا يمكن لـ Gateway آخر إعادة استخدام التسجيل المخزن.
    - يُبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. تنطبق عمليات الإرسال المدعومة بالـ relay فقط على الإصدارات الرسمية الموزعة التي سُجلت عبر relay.
    - يجب أن يطابق عنوان URL الأساسي للـ relay المضمّن في إصدار iOS الرسمي/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نشر relay نفسه.

    التدفق من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسميًا/TestFlight تم تجميعه باستخدام عنوان URL الأساسي نفسه للـ relay.
    2. اضبط `gateway.push.apns.relay.baseUrl` على الـ gateway.
    3. اقترن تطبيق iOS مع الـ gateway ودَع كلًا من جلسات node وoperator تتصل.
    4. يجلب تطبيق iOS هوية gateway، ويسجل لدى relay باستخدام App Attest مع إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالـ relay إلى الـ gateway المقترن.
    5. يخزن الـ gateway مقبض relay وإذن الإرسال، ثم يستخدمهما لـ `push.test`، وإشعارات الإيقاظ، وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل relay جديد مرتبط بذلك الـ gateway.
    - إذا أصدرت إصدار iOS جديدًا يشير إلى نشر relay مختلف، فسيقوم التطبيق بتحديث تسجيل relay المخزن مؤقتًا بدلًا من إعادة استخدام أصل relay القديم.

    ملاحظة التوافق:

    - لا يزال كل من `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات بيئة مؤقتة.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` مسار هروب تطويري خاصًا بـ loopback فقط؛ لا تحتفظ بعناوين URL للـ relay باستخدام HTTP في الإعدادات.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق الكامل من البداية إلى النهاية و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج أمان relay.

  </Accordion>

  <Accordion title="إعداد Heartbeat ‏(عمليات تحقق دورية)">
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

    - `every`: سلسلة مدة (`30m`، `2h`). اضبطها على `0m` للتعطيل.
    - `target`: ‏`last` | `none` | `<channel-id>` (مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: ‏`allow` (الافتراضي) أو `block` لأهداف Heartbeat بنمط الرسائل الخاصة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للحصول على الدليل الكامل.

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

    - `sessionRetention`: احذف جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبطه على `false` للتعطيل).
    - `runLog`: احذف `cron/runs/<jobId>.jsonl` بحسب الحجم والأسطر المحتفظ بها.
    - راجع [مهام Cron](/ar/automation/cron-jobs) للحصول على نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhooks ‏(Hooks)">
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
    - تعامل مع جميع محتويات حمولة hook/webhook على أنها إدخال غير موثوق.
    - استخدم `hooks.token` مخصصًا؛ ولا تعِد استخدام رمز Gateway المشترك.
    - تكون مصادقة Hook عبر الترويسات فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ ويتم رفض رموز سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ إدخال webhook على مسار فرعي مخصص مثل `/hooks`.
    - اترك أعلام تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent` و`hooks.mappings[].allowUnsafeExternalContent`) ما لم تكن تنفذ تصحيح أخطاء محكم النطاق.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسة التي يختارها المتصل.
    - بالنسبة إلى الوكلاء المدفوعين بواسطة hooks، فضّل طبقات نماذج حديثة قوية وسياسة أدوات صارمة (مثل المراسلة فقط مع العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="تكوين توجيه متعدد الوكلاء">
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

    راجع [متعدد الوكلاء](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/configuration-reference#multi-agent-routing) لقواعد الربط وملفات تعريف الوصول لكل وكيل.

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
    - **مصفوفة ملفات**: يتم دمجها دمجًا عميقًا بالترتيب (اللاحق يفوز)
    - **مفاتيح الأشقاء**: يتم دمجها بعد include ‏(وتتجاوز القيم المضمنة)
    - **تضمينات متداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **عمليات الكتابة التي يملكها OpenClaw**: عندما يغيّر أحد عمليات الكتابة قسمًا علويًا واحدًا فقط
      مدعومًا بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يقوم OpenClaw بتحديث الملف المضمّن ويترك `openclaw.json` كما هو
    - **الكتابة العابرة غير المدعومة**: تفشل التضمينات الجذرية، ومصفوفات include، وعمليات التضمين
      التي تحتوي على تجاوزات من الأشقاء بشكل مغلق بالنسبة إلى عمليات الكتابة التي يملكها OpenClaw بدلًا من
      تسطيح الإعدادات
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل السريع للإعدادات

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبق التغييرات تلقائيًا — ولا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل التعديلات المباشرة على الملفات على أنها غير موثوقة إلى أن يتم التحقق منها. ينتظر المراقب
حتى يستقر اضطراب الكتابة/إعادة التسمية المؤقتة من المحرر، ثم يقرأ
الملف النهائي، ويرفض التعديلات الخارجية غير الصالحة باستعادة آخر إعدادات سليمة معروفة. تستخدم
عمليات كتابة الإعدادات التي يملكها OpenClaw البوابة نفسها الخاصة بالمخطط قبل الكتابة؛ وتُرفض عمليات الإفساد التدميرية مثل
إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف
وتُحفظ باسم `.rejected.*` للفحص.

إذا رأيت `Config auto-restored from last-known-good` أو
`config reload restored last-known-good config` في السجلات، فافحص ملف
`.clobbered.*` المطابق بجانب `openclaw.json`، وأصلح الحمولة المرفوضة، ثم شغّل
`openclaw config validate`. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)
للحصول على قائمة التحقق الخاصة بالاستعادة.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبّق التغييرات الآمنة فورًا. ويعيد التشغيل تلقائيًا للتغييرات الحرجة.           |
| **`hot`**              | يطبّق التغييرات الآمنة فقط. ويسجل تحذيرًا عند الحاجة إلى إعادة تشغيل — وأنت تتولى ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في الإعدادات، سواء كان آمنًا أم لا.                                 |
| **`off`**              | يعطّل مراقبة الملفات. تصبح التغييرات فعالة عند إعادة التشغيل اليدوية التالية.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما الذي يُطبَّق سريعًا وما الذي يحتاج إلى إعادة تشغيل

تُطبَّق معظم الحقول سريعًا من دون توقف. وفي وضع `hybrid`، تتم معالجة التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة            | الحقول                                                            | هل يلزم إعادة تشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| القنوات            | `channels.*`, `web` (WhatsApp) — جميع القنوات المضمنة وقنوات Plugin | لا              |
| الوكيل والنماذج      | `agent`, `agents`, `models`, `routing`                            | لا              |
| الأتمتة          | `hooks`, `cron`, `agent.heartbeat`                                | لا              |
| الجلسات والرسائل | `session`, `messages`                                             | لا              |
| الأدوات والوسائط       | `tools`, `browser`, `skills`, `audio`, `talk`                     | لا              |
| واجهة المستخدم ومتفرقات           | `ui`, `logging`, `identity`, `bindings`                           | لا              |
| خادم Gateway      | `gateway.*` (المنفذ، والربط، والمصادقة، وTailscale، وTLS، وHTTP)              | **نعم**         |
| البنية التحتية      | `discovery`, `canvasHost`, `plugins`                              | **نعم**         |

<Note>
يشكل كل من `gateway.reload` و`gateway.remote` استثناءين — فتغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تعدّل ملف مصدر يُشار إليه عبر `$include`، يخطط OpenClaw
إعادة التحميل من التخطيط المؤلف في المصدر، وليس من العرض المسطح داخل الذاكرة.
ويبقي ذلك قرارات إعادة التحميل السريع (تطبيق سريع مقابل إعادة تشغيل) قابلة للتنبؤ حتى عندما
يكون قسم علوي واحد موجودًا في ملف مضمن مستقل مثل
`plugins: { $include: "./plugins.json5" }`.

إذا تعذر تخطيط إعادة التحميل بأمان — على سبيل المثال، لأن تخطيط المصدر
يجمع بين تضمينات الجذر وتجاوزات الأشقاء — فإن OpenClaw يفشل بشكل مغلق، ويسجل
السبب، ويُبقي الإعدادات الحالية قيد التشغيل كما هي حتى تتمكن من إصلاح شكل
المصدر بدلًا من الرجوع بصمت إلى إعادة تحميل مسطّحة.

## Config RPC ‏(تحديثات برمجية)

<Note>
استدعاءات RPC الخاصة بكتابة مستوى التحكم (`config.apply`, `config.patch`, `update.run`) محدودة المعدل إلى **3 طلبات لكل 60 ثانية** لكل `deviceId+clientIp`. عند تطبيق الحد، يعيد RPC الرمز `UNAVAILABLE` مع `retryAfterMs`.
</Note>

التدفق الآمن/الافتراضي:

- `config.schema.lookup`: افحص شجرة فرعية واحدة من الإعدادات محددة المسار مع
  عقدة مخطط سطحية، وبيانات تلميح وصفية مطابقة، وملخصات الأبناء المباشرين
- `config.get`: اجلب اللقطة الحالية + التجزئة
- `config.patch`: المسار المفضل للتحديث الجزئي
- `config.apply`: استبدال الإعدادات بالكامل فقط
- `update.run`: تحديث ذاتي صريح + إعادة تشغيل

عندما لا تستبدل الإعدادات بالكامل، ففضّل `config.schema.lookup`
ثم `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (استبدال كامل)">
    يتحقق من الإعدادات الكاملة + يكتبها ويعيد تشغيل Gateway في خطوة واحدة.

    <Warning>
    يستبدل `config.apply` **الإعدادات بالكامل**. استخدم `config.patch` للتحديثات الجزئية، أو `openclaw config set` للمفاتيح المفردة.
    </Warning>

    المعاملات:

    - `raw` (string) — حمولة JSON5 للإعدادات بالكامل
    - `baseHash` (اختياري) — تجزئة الإعدادات من `config.get` (مطلوبة عند وجود إعدادات)
    - `sessionKey` (اختياري) — مفتاح الجلسة لنبضة الإيقاظ بعد إعادة التشغيل
    - `note` (اختياري) — ملاحظة لـ restart sentinel
    - `restartDelayMs` (اختياري) — التأخير قبل إعادة التشغيل (الافتراضي 2000)

    يتم دمج طلبات إعادة التشغيل عندما يكون أحدها معلقًا/قيد التنفيذ بالفعل، وتُطبّق فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.

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
    يدمج تحديثًا جزئيًا في الإعدادات الموجودة (بدلالات JSON merge patch):

    - يتم دمج الكائنات بشكل递归
    - تحذف `null` مفتاحًا
    - تستبدل المصفوفات بالكامل

    المعاملات:

    - `raw` (string) — JSON5 يحتوي فقط على المفاتيح المراد تغييرها
    - `baseHash` (مطلوبة) — تجزئة الإعدادات من `config.get`
    - `sessionKey` و`note` و`restartDelayMs` — مثل `config.apply`

    يطابق سلوك إعادة التشغيل `config.apply`: عمليات إعادة تشغيل معلقة مدمجة بالإضافة إلى فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.

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

- `.env` من دليل العمل الحالي (إن وجد)
- `~/.openclaw/.env` ‏(احتياطي عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة بالفعل. يمكنك أيضًا ضبط متغيرات بيئة مضمّنة في الإعدادات:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد env من shell (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، يشغّل OpenClaw shell تسجيل الدخول الخاص بك ويستورد فقط المفاتيح المفقودة:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

المكافئ في متغيرات البيئة: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات env في قيم الإعدادات">
  ارجع إلى متغيرات env في أي قيمة سلسلة نصية ضمن الإعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تتم مطابقة الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ وقت التحميل
- استخدم `$${VAR}` للخروج الحرفي
- يعمل ذلك داخل ملفات `$include`
- استبدال مضمن: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="مراجع الأسرار (env, file, exec)">
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

توجد تفاصيل SecretRef ‏(بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
أما مسارات بيانات الاعتماد المدعومة فهي مدرجة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) لمعرفة الأولوية الكاملة والمصادر.

## المرجع الكامل

للحصول على المرجع الكامل حقلًا بحقل، راجع **[مرجع الإعدادات](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [مرجع الإعدادات](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_
