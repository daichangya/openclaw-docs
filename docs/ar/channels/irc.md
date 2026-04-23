---
read_when:
    - تريد توصيل OpenClaw بقنوات IRC أو بالرسائل المباشرة
    - أنت تقوم بتكوين قوائم السماح في IRC، أو سياسة المجموعات، أو تقييد الإشارات.
summary: إعداد Plugin ‏IRC، وضوابط الوصول، واستكشاف الأخطاء وإصلاحها
title: IRC
x-i18n:
    generated_at: "2026-04-23T13:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e198c03db9aaf4ec64db462d44d42aa352a2ddba808bcd29e21eb2791d9755ad
    source_path: channels/irc.md
    workflow: 15
---

# IRC

استخدم IRC عندما تريد OpenClaw في القنوات التقليدية (`#room`) والرسائل المباشرة.
يأتي IRC كـ Plugin مضمّن، لكنه يُضبط في التكوين الرئيسي تحت `channels.irc`.

## البدء السريع

1. فعّل إعدادات IRC في `~/.openclaw/openclaw.json`.
2. اضبط على الأقل:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

يُفضّل استخدام خادم IRC خاص لتنسيق البوت. إذا كنت تستخدم عمدًا شبكة IRC عامة، فمن الخيارات الشائعة Libera.Chat وOFTC وSnoonet. تجنّب القنوات العامة المتوقعة لحركة المرور الخلفية الخاصة بالبوت أو السرب.

3. ابدأ/أعد تشغيل Gateway:

```bash
openclaw gateway run
```

## الإعدادات الأمنية الافتراضية

- القيمة الافتراضية لـ `channels.irc.dmPolicy` هي `"pairing"`.
- القيمة الافتراضية لـ `channels.irc.groupPolicy` هي `"allowlist"`.
- عند استخدام `groupPolicy="allowlist"`، اضبط `channels.irc.groups` لتعريف القنوات المسموح بها.
- استخدم TLS (`channels.irc.tls=true`) إلا إذا كنت تقبل عمدًا نقلًا نصيًا غير مشفر.

## التحكم في الوصول

هناك “بوابتان” منفصلتان لقنوات IRC:

1. **الوصول إلى القناة** (`groupPolicy` + `groups`): ما إذا كان البوت يقبل الرسائل من القناة أصلًا.
2. **وصول المرسل** (`groupAllowFrom` / `groups["#channel"].allowFrom` لكل قناة): من المسموح له بتفعيل البوت داخل تلك القناة.

مفاتيح التكوين:

- قائمة السماح للرسائل المباشرة (وصول مرسل الرسائل المباشرة): `channels.irc.allowFrom`
- قائمة السماح لمرسلي المجموعات (وصول مرسل القناة): `channels.irc.groupAllowFrom`
- عناصر التحكم لكل قناة (القناة + المرسل + قواعد الإشارة): `channels.irc.groups["#channel"]`
- يتيح `channels.irc.groupPolicy="open"` القنوات غير المضبوطة (**مع بقاء تقييد الإشارات مفعّلًا افتراضيًا**)

يجب أن تستخدم عناصر قائمة السماح هويات مرسل ثابتة (`nick!user@host`).
مطابقة الاسم المختصر فقط قابلة للتغيّر ولا تُفعّل إلا عند ضبط `channels.irc.dangerouslyAllowNameMatching: true`.

### ملاحظة شائعة: `allowFrom` مخصّص للرسائل المباشرة وليس للقنوات

إذا رأيت سجلات مثل:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...فهذا يعني أن المرسل غير مسموح له برسائل **المجموعة/القناة**. أصلح ذلك بإحدى الطريقتين:

- ضبط `channels.irc.groupAllowFrom` (عام لكل القنوات)، أو
- ضبط قوائم سماح المرسلين لكل قناة: `channels.irc.groups["#channel"].allowFrom`

مثال (السماح لأي شخص في `#tuirc-dev` بالتحدث إلى البوت):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## تشغيل الردود (الإشارات)

حتى إذا كانت القناة مسموحًا بها (عبر `groupPolicy` + `groups`) وكان المرسل مسموحًا به، يستخدم OpenClaw افتراضيًا **تقييد الإشارات** في سياقات المجموعات.

هذا يعني أنك قد ترى سجلات مثل `drop channel … (missing-mention)` ما لم تتضمن الرسالة نمط إشارة يطابق البوت.

لجعل البوت يرد في قناة IRC **من دون الحاجة إلى إشارة**، عطّل تقييد الإشارات لتلك القناة:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

أو للسماح **بجميع** قنوات IRC (من دون قائمة سماح لكل قناة) مع الرد أيضًا من دون إشارات:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## ملاحظة أمنية (موصى بها للقنوات العامة)

إذا سمحت بـ `allowFrom: ["*"]` في قناة عامة، فسيتمكن أي شخص من توجيه أوامر إلى البوت.
ولتقليل المخاطر، قيّد الأدوات لتلك القناة.

### الأدوات نفسها للجميع في القناة

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### أدوات مختلفة حسب المرسل (المالك يحصل على صلاحيات أكبر)

استخدم `toolsBySender` لتطبيق سياسة أكثر تشددًا على `"*"` وسياسة أخف على اسمك:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

ملاحظات:

- يجب أن تستخدم مفاتيح `toolsBySender` البادئة `id:` لقيم هوية مرسل IRC:
  `id:eigen` أو `id:eigen!~eigen@174.127.248.171` لمطابقة أقوى.
- لا تزال المفاتيح القديمة غير المسبوقة ببادئة مقبولة وتُطابق بصفتها `id:` فقط.
- أول سياسة مرسل مطابقة هي التي تُطبّق؛ و`"*"` هي الاحتياط العام.

للمزيد حول الوصول إلى المجموعات مقابل تقييد الإشارات (وكيفية تفاعلهما)، راجع: [/channels/groups](/ar/channels/groups).

## NickServ

للتعريف باستخدام NickServ بعد الاتصال:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

تسجيل اختياري لمرة واحدة عند الاتصال:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

عطّل `register` بعد تسجيل الاسم لتجنّب محاولات REGISTER المتكررة.

## متغيرات البيئة

يدعم الحساب الافتراضي ما يلي:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (مفصولة بفواصل)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

لا يمكن تعيين `IRC_HOST` من ملف `.env` خاص بمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## استكشاف الأخطاء وإصلاحها

- إذا كان البوت يتصل لكنه لا يرد أبدًا في القنوات، فتحقق من `channels.irc.groups` **وكذلك** مما إذا كان تقييد الإشارات يُسقط الرسائل (`missing-mention`). إذا كنت تريد أن يرد من دون تنبيهات، فاضبط `requireMention:false` للقناة.
- إذا فشل تسجيل الدخول، فتحقق من توفر الاسم وكلمة مرور الخادم.
- إذا فشل TLS على شبكة مخصصة، فتحقق من إعدادات المضيف/المنفذ والشهادة.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
