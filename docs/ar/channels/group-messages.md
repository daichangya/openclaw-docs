---
read_when:
    - تغيير قواعد رسائل المجموعات أو الإشارات
summary: السلوك والإعدادات الخاصة بمعالجة رسائل مجموعات WhatsApp (تتم مشاركة `mentionPatterns` عبر جميع الواجهات)
title: رسائل المجموعات
x-i18n:
    generated_at: "2026-04-25T13:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

السلوك والإعدادات الخاصة بمعالجة رسائل مجموعات WhatsApp (تتم مشاركة `mentionPatterns` الآن عبر Telegram/Discord/Slack/iMessage أيضًا)

الهدف: السماح لـ Clawd بالبقاء داخل مجموعات WhatsApp، والاستيقاظ فقط عند الإشارة إليه، والحفاظ على هذا المسار منفصلًا عن جلسة الرسائل الخاصة الشخصية.

ملاحظة: يُستخدم `agents.list[].groupChat.mentionPatterns` الآن أيضًا بواسطة Telegram/Discord/Slack/iMessage؛ يركّز هذا المستند على السلوك الخاص بـ WhatsApp. في إعدادات الوكلاء المتعددين، اضبط `agents.list[].groupChat.mentionPatterns` لكل وكيل (أو استخدم `messages.groupChat.mentionPatterns` كخيار احتياطي عام).

## التنفيذ الحالي (2025-12-03)

- أوضاع التفعيل: `mention` (الافتراضي) أو `always`. يتطلب `mention` إشارة تنبيه (إشارات WhatsApp @ الحقيقية عبر `mentionedJids`، أو أنماط regex الآمنة، أو رقم E.164 الخاص بالبوت في أي موضع من النص). يوقظ `always` الوكيل عند كل رسالة، لكن ينبغي عليه الرد فقط عندما يستطيع إضافة قيمة فعلية؛ وإلا فإنه يعيد رمز الصمت المطابق تمامًا `NO_REPLY` / `no_reply`. يمكن تعيين القيم الافتراضية في الإعدادات (`channels.whatsapp.groups`) وتجاوزها لكل مجموعة عبر `/activation`. عند تعيين `channels.whatsapp.groups`، فإنه يعمل أيضًا كقائمة سماح للمجموعات (أدرج `"*"` للسماح للجميع).
- سياسة المجموعات: يتحكم `channels.whatsapp.groupPolicy` في ما إذا كانت رسائل المجموعات مقبولة (`open|disabled|allowlist`). يستخدم `allowlist` القيمة `channels.whatsapp.groupAllowFrom` (خيارًا احتياطيًا: `channels.whatsapp.allowFrom` الصريح). القيمة الافتراضية هي `allowlist` (محظور حتى تضيف المرسلين).
- جلسات لكل مجموعة: تبدو مفاتيح الجلسات مثل `agent:<agentId>:whatsapp:group:<jid>` لذا فإن أوامر مثل `/verbose on` أو `/trace on` أو `/think high` (المرسلة كرسائل مستقلة) تكون محصورة بتلك المجموعة؛ ولا تتأثر حالة الرسائل الخاصة الشخصية. يتم تخطي Heartbeat في مسارات المجموعات.
- حقن السياق: تتم إضافة رسائل المجموعة **المعلّقة فقط** (الافتراضي 50) التي _لم_ تؤدِّ إلى تشغيل تحت `[Chat messages since your last reply - for context]`، مع إضافة السطر المُشغِّل تحت `[Current message - respond to this]`. لا تتم إعادة حقن الرسائل الموجودة بالفعل في الجلسة.
- إظهار المرسِل: تنتهي كل دفعة مجموعة الآن بـ `[from: Sender Name (+E164)]` حتى يعرف Pi من الذي يتحدث.
- الرسائل سريعة الزوال/العرض مرة واحدة: نقوم بفكّها قبل استخراج النص/الإشارات، لذا تظل إشارات التنبيه داخلها تُفعِّل التشغيل.
- مطالبة النظام للمجموعة: في أول دور من جلسة المجموعة (وكلما غيّر `/activation` الوضع) نحقن موجزًا قصيرًا في مطالبة النظام مثل `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` إذا لم تكن البيانات الوصفية متاحة، فما زلنا نبلغ الوكيل بأنها دردشة مجموعة.

## مثال إعدادات (WhatsApp)

أضف كتلة `groupChat` إلى `~/.openclaw/openclaw.json` حتى تعمل إشارات أسماء العرض حتى عندما يزيل WhatsApp الرمز المرئي `@` من نص الرسالة:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

ملاحظات:

- تعبيرات regex غير حساسة لحالة الأحرف وتستخدم حواجز safe-regex نفسها المستخدمة في واجهات regex الأخرى في الإعدادات؛ يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يزال WhatsApp يرسل الإشارات القياسية عبر `mentionedJids` عندما ينقر شخص ما جهة الاتصال، لذا نادرًا ما تكون العودة إلى الرقم مطلوبة لكنها تمثل شبكة أمان مفيدة.

### أمر التفعيل (للمالك فقط)

استخدم أمر دردشة المجموعة:

- `/activation mention`
- `/activation always`

يمكن فقط لرقم المالك (من `channels.whatsapp.allowFrom`، أو رقم E.164 الخاص بالبوت نفسه عند عدم ضبطه) تغيير هذا. أرسل `/status` كرسالة مستقلة في المجموعة لرؤية وضع التفعيل الحالي.

## كيفية الاستخدام

1. أضف حساب WhatsApp الخاص بك (الذي يشغّل OpenClaw) إلى المجموعة.
2. قل `@openclaw …` (أو أدرج الرقم). لا يمكن إلا للمرسلين الموجودين في قائمة السماح تفعيله ما لم تضبط `groupPolicy: "open"`.
3. ستتضمن مطالبة الوكيل سياق المجموعة الحديث بالإضافة إلى علامة `[from: …]` اللاحقة حتى يتمكن من مخاطبة الشخص الصحيح.
4. تنطبق توجيهات مستوى الجلسة (`/verbose on` و`/trace on` و`/think high` و`/new` أو `/reset` و`/compact`) على جلسة تلك المجموعة فقط؛ أرسلها كرسائل مستقلة حتى يتم تسجيلها. وتبقى جلسة الرسائل الخاصة الشخصية مستقلة.

## الاختبار / التحقق

- اختبار يدوي سريع:
  - أرسل إشارة `@openclaw` في المجموعة وتأكد من وجود رد يشير إلى اسم المرسِل.
  - أرسل إشارة ثانية وتحقق من أن كتلة السجل مُضمّنة ثم يتم مسحها في الدور التالي.
- افحص سجلات Gateway (شغّل مع `--verbose`) لرؤية إدخالات `inbound web message` التي تعرض `from: <groupJid>` واللاحقة `[from: …]`.

## اعتبارات معروفة

- يتم تخطي Heartbeat عمدًا للمجموعات لتجنب البث المزعج.
- يستخدم منع التكرار النصّي سلسلة الدفعة المجمّعة؛ إذا أرسلت نصًا متطابقًا مرتين من دون إشارات، فسيحصل الأول فقط على رد.
- ستظهر إدخالات مخزن الجلسات بالشكل `agent:<agentId>:whatsapp:group:<jid>` في مخزن الجلسات (`~/.openclaw/agents/<agentId>/sessions/sessions.json` افتراضيًا)؛ وغياب إدخال يعني فقط أن المجموعة لم تُفعّل تشغيلًا بعد.
- تتبع مؤشرات الكتابة في المجموعات `agents.defaults.typingMode` (الافتراضي: `message` عند عدم وجود إشارة).

## ذو صلة

- [المجموعات](/ar/channels/groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [مجموعات البث](/ar/channels/broadcast-groups)
