---
read_when:
    - تريد تشغيل عمليات العامل من خلال السكربتات أو سطر الأوامر
    - تحتاج إلى تسليم ردود العامل إلى قناة دردشة برمجيًا
summary: تشغيل أدوار العامل من خلال CLI مع إمكانية تسليم الردود إلى القنوات اختياريًا
title: إرسال العامل
x-i18n:
    generated_at: "2026-04-21T13:35:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# إرسال العامل

يشغّل `openclaw agent` دورًا واحدًا للعامل من سطر الأوامر دون الحاجة إلى
رسالة دردشة واردة. استخدمه في مسارات العمل المؤتمتة، والاختبار،
والتسليم البرمجي.

## البدء السريع

<Steps>
  <Step title="تشغيل دور عامل بسيط">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    يرسل هذا الرسالة عبر Gateway ويطبع الرد.

  </Step>

  <Step title="استهداف عامل أو جلسة محددة">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="تسليم الرد إلى قناة">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## العلامات

| Flag                          | الوصف                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| `--message \<text\>`          | الرسالة المراد إرسالها (مطلوب)                               |
| `--to \<dest\>`               | اشتقاق مفتاح الجلسة من هدف محدد (هاتف، معرّف دردشة)          |
| `--agent \<id\>`              | استهداف عامل مضبوط (يستخدم جلسته `main`)                    |
| `--session-id \<id\>`         | إعادة استخدام جلسة موجودة حسب المعرّف                        |
| `--local`                     | فرض وقت تشغيل محلي مضمّن (تجاوز Gateway)                    |
| `--deliver`                   | إرسال الرد إلى قناة دردشة                                    |
| `--channel \<name\>`          | قناة التسليم (whatsapp وtelegram وdiscord وslack وما إلى ذلك) |
| `--reply-to \<target\>`       | تجاوز هدف التسليم                                            |
| `--reply-channel \<name\>`    | تجاوز قناة التسليم                                           |
| `--reply-account \<id\>`      | تجاوز معرّف حساب التسليم                                     |
| `--thinking \<level\>`        | ضبط مستوى التفكير لملف النموذج المحدد                        |
| `--verbose \<on\|full\|off\>` | ضبط مستوى الإسهاب                                            |
| `--timeout \<seconds\>`       | تجاوز مهلة العامل                                             |
| `--json`                      | إخراج JSON منظّم                                             |

## السلوك

- افتراضيًا، يمر CLI **عبر Gateway**. أضف `--local` لفرض
  وقت التشغيل المحلي المضمّن على الجهاز الحالي.
- إذا تعذر الوصول إلى Gateway، فإن CLI **يرجع احتياطيًا** إلى التشغيل المحلي المضمّن.
- اختيار الجلسة: يشتق `--to` مفتاح الجلسة (تحافظ أهداف المجموعات/القنوات
  على العزل؛ وتُدمَج الدردشات المباشرة في `main`).
- تستمر علامتا التفكير والإسهاب داخل مخزن الجلسة.
- الإخراج: نص عادي افتراضيًا، أو `--json` لحمولة منظّمة + بيانات وصفية.

## أمثلة

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## ذو صلة

- [مرجع CLI للعامل](/cli/agent)
- [الوكلاء الفرعيون](/ar/tools/subagents) — تشغيل وكيل فرعي في الخلفية
- [الجلسات](/ar/concepts/session) — كيفية عمل مفاتيح الجلسات
