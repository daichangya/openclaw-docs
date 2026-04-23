---
read_when:
    - تريد واجهة TUI لـ Gateway (ملائمة للوصول عن بُعد)
    - تريد تمرير url/token/session من السكربتات
    - تريد تشغيل TUI في وضع محلي مضمّن من دون Gateway
    - تريد استخدام openclaw chat أو `openclaw tui --local`
summary: مرجع CLI لـ `openclaw tui` (واجهة طرفية محلية مضمّنة أو مدعومة من Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-23T07:23:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

افتح واجهة TUI الطرفية المتصلة بـ Gateway، أو شغّلها في الوضع
المحلي المضمّن.

ذو صلة:

- دليل TUI: [TUI](/ar/web/tui)

ملاحظات:

- `chat` و`terminal` هما اسمان مستعاران لـ `openclaw tui --local`.
- لا يمكن دمج `--local` مع `--url` أو `--token` أو `--password`.
- يقوم `tui` بتحليل SecretRefs لمصادقة gateway المهيأة من أجل مصادقة الرمز/كلمة المرور عندما يكون ذلك ممكنًا (موفّرو `env`/`file`/`exec`).
- عند التشغيل من داخل دليل مساحة عمل وكيل مهيأ، يختار TUI هذا الوكيل تلقائيًا كإعداد افتراضي لمفتاح الجلسة (ما لم تكن قيمة `--session` صراحةً هي `agent:<id>:...`).
- يستخدم الوضع المحلي وقت تشغيل الوكيل المضمّن مباشرةً. تعمل معظم الأدوات المحلية، لكن ميزات Gateway فقط غير متاحة.
- يضيف الوضع المحلي الأمر `/auth [provider]` داخل سطح أوامر TUI.
- لا تزال بوابات موافقة Plugin مطبقة في الوضع المحلي. وتطلب الأدوات التي تتطلب موافقة قرارًا في الطرفية؛ ولا تتم الموافقة تلقائيًا بصمت لأن Gateway غير مشارك.

## أمثلة

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## حلقة إصلاح الإعدادات

استخدم الوضع المحلي عندما تكون الإعدادات الحالية صالحة بالفعل وتريد أن يقوم
الوكيل المضمّن بفحصها، ومقارنتها بالمستندات، والمساعدة في إصلاحها
من الطرفية نفسها:

إذا كان `openclaw config validate` يفشل بالفعل، فاستخدم `openclaw configure` أو
`openclaw doctor --fix` أولًا. لا يتجاوز `openclaw chat` حاجز الإعدادات
غير الصالحة.

```bash
openclaw chat
```

ثم داخل TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

طبّق إصلاحات مستهدفة باستخدام `openclaw config set` أو `openclaw configure`، ثم
أعد تشغيل `openclaw config validate`. راجع [TUI](/ar/web/tui) و[Config](/ar/cli/config).
