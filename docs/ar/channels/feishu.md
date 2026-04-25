---
read_when:
    - تريد ربط روبوت Feishu/Lark
    - أنت تهيّئ قناة Feishu
summary: نظرة عامة على روبوت Feishu وميزاته وتهيئته
title: Feishu
x-i18n:
    generated_at: "2026-04-25T13:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark هي منصة تعاون شاملة حيث تتحدث الفرق، وتشارك المستندات، وتدير التقويمات، وتنجز العمل معًا.

**الحالة:** جاهزة للإنتاج للرسائل الخاصة بالروبوت + الدردشات الجماعية. WebSocket هو الوضع الافتراضي؛ ووضع Webhook اختياري.

---

## البدء السريع

> **يتطلب OpenClaw 2026.4.25 أو أحدث.** شغّل `openclaw --version` للتحقق. وقم بالترقية باستخدام `openclaw update`.

<Steps>
  <Step title="تشغيل معالج إعداد القناة">
  ```bash
  openclaw channels login --channel feishu
  ```
  امسح رمز QR باستخدام تطبيق Feishu/Lark على الهاتف المحمول لإنشاء روبوت Feishu/Lark تلقائيًا.
  </Step>
  
  <Step title="بعد اكتمال الإعداد، أعد تشغيل Gateway لتطبيق التغييرات">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## التحكم في الوصول

### الرسائل الخاصة

قم بتهيئة `dmPolicy` للتحكم في من يمكنه مراسلة الروبوت عبر الرسائل الخاصة:

- `"pairing"` — يتلقى المستخدمون غير المعروفين رمز اقتران؛ وافق عبر CLI
- `"allowlist"` — لا يمكن الدردشة إلا للمستخدمين المدرجين في `allowFrom` (الافتراضي: مالك الروبوت فقط)
- `"open"` — السماح لجميع المستخدمين
- `"disabled"` — تعطيل جميع الرسائل الخاصة

**الموافقة على طلب اقتران:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### الدردشات الجماعية

**سياسة المجموعات** (`channels.feishu.groupPolicy`):

| القيمة         | السلوك                                   |
| ------------- | ------------------------------------------ |
| `"open"`      | الرد على جميع الرسائل في المجموعات          |
| `"allowlist"` | الرد فقط على المجموعات المدرجة في `groupAllowFrom` |
| `"disabled"`  | تعطيل جميع رسائل المجموعات                 |

الافتراضي: `allowlist`

**اشتراط الإشارة** (`channels.feishu.requireMention`):

- `true` — يتطلب @mention (افتراضي)
- `false` — الرد من دون @mention
- تجاوز لكل مجموعة: `channels.feishu.groups.<chat_id>.requireMention`

---

## أمثلة على تهيئة المجموعات

### السماح لجميع المجموعات، من دون اشتراط @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### السماح لجميع المجموعات، مع الاستمرار في اشتراط @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### السماح لمجموعات محددة فقط

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // تبدو معرّفات المجموعات بهذا الشكل: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### تقييد المرسلين داخل مجموعة

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // تبدو open_ids للمستخدمين بهذا الشكل: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## الحصول على معرّفات المجموعة/المستخدم

### معرّفات المجموعات (`chat_id`، التنسيق: `oc_xxx`)

افتح المجموعة في Feishu/Lark، وانقر على أيقونة القائمة في الزاوية العلوية اليمنى، ثم انتقل إلى **الإعدادات**. يكون معرّف المجموعة (`chat_id`) مدرجًا في صفحة الإعدادات.

![الحصول على معرّف المجموعة](/images/feishu-get-group-id.png)

### معرّفات المستخدمين (`open_id`، التنسيق: `ou_xxx`)

ابدأ تشغيل Gateway، وأرسل رسالة خاصة إلى الروبوت، ثم تحقق من السجلات:

```bash
openclaw logs --follow
```

ابحث عن `open_id` في مخرجات السجل. يمكنك أيضًا التحقق من طلبات الاقتران المعلقة:

```bash
openclaw pairing list feishu
```

---

## الأوامر الشائعة

| الأمر   | الوصف                 |
| --------- | --------------------------- |
| `/status` | عرض حالة الروبوت             |
| `/reset`  | إعادة تعيين الجلسة الحالية   |
| `/model`  | عرض نموذج الذكاء الاصطناعي أو تبديله |

> لا يدعم Feishu/Lark قوائم أوامر الشرطة المائلة الأصلية، لذا أرسل هذه الأوامر كرسائل نصية عادية.

---

## استكشاف الأخطاء وإصلاحها

### الروبوت لا يرد في الدردشات الجماعية

1. تأكد من إضافة الروبوت إلى المجموعة
2. تأكد من أنك تشير إلى الروبوت باستخدام @mention (مطلوب افتراضيًا)
3. تحقق من أن `groupPolicy` ليست `"disabled"`
4. تحقق من السجلات: `openclaw logs --follow`

### الروبوت لا يستقبل الرسائل

1. تأكد من نشر الروبوت واعتماده في Feishu Open Platform / Lark Developer
2. تأكد من أن اشتراك الأحداث يتضمن `im.message.receive_v1`
3. تأكد من تحديد **persistent connection** (WebSocket)
4. تأكد من منح جميع نطاقات الأذونات المطلوبة
5. تأكد من أن Gateway قيد التشغيل: `openclaw gateway status`
6. تحقق من السجلات: `openclaw logs --follow`

### تم تسريب App Secret

1. أعد تعيين App Secret في Feishu Open Platform / Lark Developer
2. حدّث القيمة في تهيئتك
3. أعد تشغيل Gateway: `openclaw gateway restart`

---

## التهيئة المتقدمة

### حسابات متعددة

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "الروبوت الأساسي",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "الروبوت الاحتياطي",
          enabled: false,
        },
      },
    },
  },
}
```

يتحكم `defaultAccount` في الحساب المستخدم عندما لا تحدد واجهات API الصادرة `accountId`.

### حدود الرسائل

- `textChunkLimit` — حجم مقطع النص الصادر (الافتراضي: `2000` حرف)
- `mediaMaxMb` — حد رفع/تنزيل الوسائط (الافتراضي: `30` ميغابايت)

### البث

يدعم Feishu/Lark الردود المتدفقة عبر البطاقات التفاعلية. عند التمكين، يحدّث الروبوت البطاقة في الوقت الفعلي أثناء إنشاء النص.

```json5
{
  channels: {
    feishu: {
      streaming: true, // تمكين إخراج البطاقات المتدفقة (الافتراضي: true)
      blockStreaming: true, // تمكين البث على مستوى الكتلة (الافتراضي: true)
    },
  },
}
```

اضبط `streaming: false` لإرسال الرد الكامل في رسالة واحدة.

### تحسين الحصة

قلّل عدد استدعاءات API الخاصة بـ Feishu/Lark باستخدام علامتين اختياريتين:

- `typingIndicator` (الافتراضي `true`): اضبطه على `false` لتخطي استدعاءات تفاعل الكتابة
- `resolveSenderNames` (الافتراضي `true`): اضبطه على `false` لتخطي عمليات البحث عن ملفات تعريف المرسلين

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### جلسات ACP

يدعم Feishu/Lark بروتوكول ACP للرسائل الخاصة ورسائل سلاسل المجموعات. يعتمد ACP في Feishu/Lark على الأوامر النصية — لا توجد قوائم أوامر الشرطة المائلة الأصلية، لذا استخدم رسائل `/acp ...` مباشرة في المحادثة.

#### ربط ACP دائم

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### إنشاء ACP من الدردشة

في رسالة خاصة أو سلسلة رسائل في Feishu/Lark:

```text
/acp spawn codex --thread here
```

يعمل `--thread here` مع الرسائل الخاصة ورسائل السلاسل في Feishu/Lark. تُوجَّه الرسائل اللاحقة في المحادثة المرتبطة مباشرة إلى جلسة ACP تلك.

### توجيه متعدد الوكلاء

استخدم `bindings` لتوجيه الرسائل الخاصة أو المجموعات في Feishu/Lark إلى وكلاء مختلفين.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

حقول التوجيه:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (رسالة خاصة) أو `"group"` (دردشة جماعية)
- `match.peer.id`: Open ID للمستخدم (`ou_xxx`) أو معرّف المجموعة (`oc_xxx`)

راجع [الحصول على معرّفات المجموعة/المستخدم](#get-groupuser-ids) للاطلاع على نصائح البحث.

---

## مرجع التهيئة

التهيئة الكاملة: [تهيئة Gateway](/ar/gateway/configuration)

| الإعداد                                           | الوصف                                | الافتراضي          |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | تمكين/تعطيل القناة                 | `true`           |
| `channels.feishu.domain`                          | نطاق API (`feishu` أو `lark`)            | `feishu`         |
| `channels.feishu.connectionMode`                  | نقل الأحداث (`websocket` أو `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | الحساب الافتراضي للتوجيه الصادر       | `default`        |
| `channels.feishu.verificationToken`               | مطلوب لوضع Webhook                  | —                |
| `channels.feishu.encryptKey`                      | مطلوب لوضع Webhook                  | —                |
| `channels.feishu.webhookPath`                     | مسار توجيه Webhook                         | `/feishu/events` |
| `channels.feishu.webhookHost`                     | مضيف ربط Webhook                          | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | منفذ ربط Webhook                          | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | تجاوز النطاق لكل حساب                | `feishu`         |
| `channels.feishu.dmPolicy`                        | سياسة الرسائل الخاصة                                  | `allowlist`      |
| `channels.feishu.allowFrom`                       | قائمة السماح للرسائل الخاصة (قائمة `open_id`)                | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | سياسة المجموعات                               | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | قائمة السماح للمجموعات                            | —                |
| `channels.feishu.requireMention`                  | اشتراط @mention في المجموعات                 | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | تجاوز @mention لكل مجموعة                | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | تمكين/تعطيل مجموعة محددة            | `true`           |
| `channels.feishu.textChunkLimit`                  | حجم مقطع الرسالة                         | `2000`           |
| `channels.feishu.mediaMaxMb`                      | حد حجم الوسائط                           | `30`             |
| `channels.feishu.streaming`                       | إخراج البطاقات المتدفقة                      | `true`           |
| `channels.feishu.blockStreaming`                  | البث على مستوى الكتلة                      | `true`           |
| `channels.feishu.typingIndicator`                 | إرسال تفاعلات الكتابة                      | `true`           |
| `channels.feishu.resolveSenderNames`              | تحليل أسماء العرض للمرسلين               | `true`           |

---

## أنواع الرسائل المدعومة

### الاستقبال

- ✅ نص
- ✅ نص منسق (post)
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ ملصقات

### الإرسال

- ✅ نص
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ بطاقات تفاعلية (بما في ذلك التحديثات المتدفقة)
- ⚠️ نص منسق (تنسيق على نمط post؛ لا يدعم كامل إمكانات التأليف في Feishu/Lark)

تستخدم فقاعات الصوت الأصلية في Feishu/Lark نوع رسالة Feishu `audio` وتتطلب
تحميل وسائط Ogg/Opus (`file_type: "opus"`). يتم إرسال وسائط `.opus` و`.ogg` الحالية
مباشرةً كصوت أصلي. يتم تحويل MP3/WAV/M4A وغيرها من تنسيقات الصوت المحتملة
إلى Ogg/Opus بتردد 48kHz باستخدام `ffmpeg` فقط عندما يطلب الرد
إرسالًا صوتيًا (`audioAsVoice` / أداة الرسائل `asVoice`، بما في ذلك ردود
الملاحظات الصوتية المعتمدة على TTS). وتبقى مرفقات MP3 العادية ملفاتً عادية.
إذا لم يكن `ffmpeg` موجودًا أو فشل التحويل، يعود OpenClaw إلى مرفق ملف
ويسجل السبب.

### سلاسل الرسائل والردود

- ✅ ردود مضمنة
- ✅ ردود سلاسل الرسائل
- ✅ تظل ردود الوسائط مدركةً للسلسلة عند الرد على رسالة ضمن سلسلة

بالنسبة إلى `groupSessionScope: "group_topic"` و`"group_topic_sender"`، تستخدم
مجموعات الموضوعات الأصلية في Feishu/Lark الحدث `thread_id` (`omt_*`) بوصفه
مفتاح جلسة الموضوع الأساسي. وتستمر ردود المجموعات العادية التي يحولها OpenClaw
إلى سلاسل في استخدام معرّف رسالة جذر الرد (`om_*`) بحيث تظل الجولة الأولى
وجولة المتابعة ضمن الجلسة نفسها.

---

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وضبط اشتراط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
