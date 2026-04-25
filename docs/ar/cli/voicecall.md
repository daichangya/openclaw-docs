---
read_when:
    - أنت تستخدم Plugin الخاص بالمكالمات الصوتية وتريد نقاط دخول CLI
    - تريد أمثلة سريعة لـ `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: مرجع CLI لـ `openclaw voicecall` (سطح أوامر Plugin الخاص بالمكالمات الصوتية)
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T13:44:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` هو أمر يوفّره Plugin. لا يظهر إلا إذا كان Plugin المكالمات الصوتية مثبتًا ومُمكّنًا.

المستند الرئيسي:

- Plugin المكالمات الصوتية: [Voice Call](/ar/plugins/voice-call)

## الأوامر الشائعة

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

يطبع `setup` فحوصات الجاهزية بصيغة مقروءة للبشر افتراضيًا. استخدم `--json` من أجل
البرامج النصية:

```bash
openclaw voicecall setup --json
```

بالنسبة إلى الموفّرين الخارجيين (`twilio` و`telnyx` و`plivo`)، يجب على setup حل
عنوان URL عام لـ Webhook من `publicUrl` أو نفق أو تعريض Tailscale. ويتم رفض
fallback الخاص بـ serve على loopback/خاص لأن شركات الاتصالات لا يمكنها الوصول إليه.

يشغّل `smoke` فحوصات الجاهزية نفسها. ولن يجري مكالمة هاتفية حقيقية
ما لم يكن كل من `--to` و`--yes` موجودين:

```bash
openclaw voicecall smoke --to "+15555550123"        # تشغيل تجريبي
openclaw voicecall smoke --to "+15555550123" --yes  # مكالمة notify مباشرة
```

## تعريض Webhooks ‏(Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

ملاحظة أمان: لا تعرّض نقطة نهاية Webhook إلا للشبكات التي تثق بها. ويفضل استخدام Tailscale Serve بدلًا من Funnel متى أمكن.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
