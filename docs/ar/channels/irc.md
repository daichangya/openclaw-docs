---
read_when:
    - تريد توصيل OpenClaw بقنوات IRC أو الرسائل المباشرة
    - أنت تقوم بتكوين قوائم السماح في IRC، أو سياسة المجموعات، أو تقييد الإشارات
summary: إعداد Plugin الخاص بـ IRC، وعناصر التحكم في الوصول، واستكشاف الأخطاء وإصلاحها
title: IRC
x-i18n:
    generated_at: "2026-04-23T07:18:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28d0929e1e3f882eca1ba46eeb5e3fa537baaebfedbe2cf4079946cd9b432c87
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

يُفضَّل استخدام خادم IRC خاص لتنسيق البوت. إذا كنت تستخدم عمدًا شبكة IRC عامة، فمن الخيارات الشائعة Libera.Chat و OFTC و Snoonet. تجنّب القنوات العامة المتوقعة لحركة المرور الخلفية الخاصة بالبوت أو السرب.

3. ابدأ/أعد تشغيل Gateway:

```bash
openclaw gateway run
```

## الإعدادات الأمنية الافتراضية

- القيمة الافتراضية لـ `channels.irc.dmPolicy` هي `"pairing"`.
- القيمة الافتراضية لـ `channels.irc.groupPolicy` هي `"allowlist"`.
- عند استخدام `groupPolicy="allowlist"`، اضبط `channels.irc.groups` لتعريف القنوات المسموح بها.
- استخدم TLS (`channels.irc.tls=true`) ما لم تكن تقبل عمدًا النقل النصي غير المشفر.

## التحكم في الوصول

هناك «بوابتان» منفصلتان لقنوات IRC:

1. **وصول القناة** (`groupPolicy` + `groups`): هل يقبل البوت الرسائل من القناة أساسًا.
2. **وصول المرسل** (`groupAllowFrom` / الإعداد الخاص بكل قناة `groups["#channel"].allowFrom`): من المسموح له بتشغيل البوت داخل تلك القناة.

مفاتيح التكوين:

- قائمة السماح للرسائل المباشرة (وصول مرسل الرسائل المباشرة): `channels.irc.allowFrom`
- قائمة السماح لمرسلي المجموعات (وصول مرسل القناة): `channels.irc.groupAllowFrom`
- عناصر التحكم لكل قناة (القناة + المرسل + قواعد الإشارة): `channels.irc.groups["#channel"]`
- يتيح `channels.irc.groupPolicy="open"` القنوات غير المضبوطة (**لكنها تظل مقيدة بالإشارة افتراضيًا**)

يجب أن تستخدم إدخالات قائمة السماح هويات مرسل ثابتة (`nick!user@host`).
مطابقة الاسم المختصر فقط قابلة للتغير، ولا تُفعَّل إلا عند تعيين `channels.irc.dangerouslyAllowNameMatching: true`.

### مشكلة شائعة: `allowFrom` مخصص للرسائل المباشرة، وليس للقنوات

إذا رأيت سجلات مثل:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...فهذا يعني أن المرسل غير مسموح له في رسائل **المجموعة/القناة**. أصلح ذلك إما عبر:

- تعيين `channels.irc.groupAllowFrom` (عام لكل القنوات)، أو
- تعيين قوائم سماح المرسلين لكل قناة: `channels.irc.groups["#channel"].allowFrom`

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

حتى إذا كانت القناة مسموحًا بها (عبر `groupPolicy` + `groups`) وكان المرسل مسموحًا به، فإن OpenClaw يستخدم افتراضيًا **تقييد الإشارات** في سياقات المجموعات.

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

أو للسماح **لكل** قنوات IRC (من دون قائمة سماح لكل قناة) مع الرد أيضًا من دون إشارات:

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

إذا سمحت بـ `allowFrom: ["*"]` في قناة عامة، فيمكن لأي شخص توجيه أوامر إلى البوت.
لتقليل المخاطر، قيّد الأدوات لتلك القناة.

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

### أدوات مختلفة لكل مرسل (المالك يحصل على صلاحيات أكبر)

استخدم `toolsBySender` لتطبيق سياسة أشد على `"*"` وسياسة أخف على اسمك:

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
- لا تزال المفاتيح القديمة غير المسبوقة ببادئة مقبولة، وتُطابَق بصيغة `id:` فقط.
- تفوز أول سياسة مرسل مطابقة؛ وتكون `"*"` هي المطابقة الاحتياطية العامة.

للمزيد حول وصول المجموعات مقابل تقييد الإشارات (وكيفية تفاعلهما)، راجع: [/channels/groups](/ar/channels/groups).

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

عطّل `register` بعد تسجيل الاسم لتجنب محاولات `REGISTER` المتكررة.

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

<Note>
`IRC_HOST` موجود في قائمة حظر كتل نقاط النهاية ولا يمكن تعيينه من ملف
`.env` في مساحة العمل. يجب أن يأتي من بيئة الصدفة أو من بيئة عملية Gateway
حتى لا تتمكن مساحات العمل غير الموثوقة من إعادة توجيه حركة IRC إلى
خادم مختلف. راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security) للاطلاع على القائمة
الكاملة.
</Note>

## استكشاف الأخطاء وإصلاحها

- إذا كان البوت يتصل لكنه لا يرد أبدًا في القنوات، فتحقق من `channels.irc.groups` **وكذلك** مما إذا كان تقييد الإشارات يسقط الرسائل (`missing-mention`). إذا كنت تريد أن يرد من دون تنبيهات، فاضبط `requireMention:false` للقناة.
- إذا فشل تسجيل الدخول، فتحقق من توفر الاسم المستعار وكلمة مرور الخادم.
- إذا فشل TLS على شبكة مخصصة، فتحقق من المضيف/المنفذ وإعداد الشهادة.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
