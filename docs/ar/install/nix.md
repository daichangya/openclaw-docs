---
read_when:
    - أنت تريد تثبيتات قابلة لإعادة الإنتاج وقابلة للتراجع
    - أنت تستخدم بالفعل Nix/NixOS/Home Manager
    - أنت تريد أن يكون كل شيء مثبتًا ومُدارًا بصورة تصريحية
summary: تثبيت OpenClaw تصريحيًا باستخدام Nix
title: Nix
x-i18n:
    generated_at: "2026-04-25T13:50:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

ثبّت OpenClaw بصورة تصريحية باستخدام **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — وحدة Home Manager متكاملة.

<Info>
يُعد مستودع [nix-openclaw](https://github.com/openclaw/nix-openclaw) مصدر الحقيقة لتثبيت Nix. وهذه الصفحة مجرد نظرة عامة سريعة.
</Info>

## ما الذي ستحصل عليه

- Gateway + تطبيق macOS + الأدوات (whisper وspotify وcameras) -- كلها مثبتة بالإصدارات
- خدمة Launchd تصمد بعد إعادة التشغيل
- نظام Plugin مع تهيئة تصريحية
- تراجع فوري: `home-manager switch --rollback`

## البدء السريع

<Steps>
  <Step title="تثبيت Determinate Nix">
    إذا لم يكن Nix مثبتًا بالفعل، فاتبع تعليمات [مثبّت Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="إنشاء flake محلي">
    استخدم قالب agent-first من مستودع nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # انسخ templates/agent-first/flake.nix من مستودع nix-openclaw
    ```
  </Step>
  <Step title="تهيئة الأسرار">
    اضبط رمز روبوت المراسلة ومفتاح API الخاص بمزوّد النموذج. وتعمل الملفات النصية العادية في `~/.secrets/` بشكل جيد.
  </Step>
  <Step title="املأ العناصر النائبة في القالب ثم نفّذ switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="التحقق">
    تأكد من أن خدمة launchd تعمل وأن روبوتك يستجيب للرسائل.
  </Step>
</Steps>

راجع [README الخاص بـ nix-openclaw](https://github.com/openclaw/nix-openclaw) للاطلاع على جميع خيارات الوحدة والأمثلة.

## سلوك وقت التشغيل في وضع Nix

عند ضبط `OPENCLAW_NIX_MODE=1` ‏(ويُضبط تلقائيًا مع nix-openclaw)، يدخل OpenClaw في وضع حتمي يعطّل تدفقات التثبيت التلقائي.

يمكنك أيضًا ضبطه يدويًا:

```bash
export OPENCLAW_NIX_MODE=1
```

على macOS، لا يرث تطبيق GUI تلقائيًا متغيرات بيئة shell. فعّل وضع Nix عبر defaults بدلًا من ذلك:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### ما الذي يتغير في وضع Nix

- تُعطَّل تدفقات التثبيت التلقائي والتحوير الذاتي
- تظهر الاعتمادات المفقودة برسائل معالجة خاصة بـ Nix
- تعرض واجهة المستخدم شريط وضع Nix للقراءة فقط

### مسارات التهيئة والحالة

يقرأ OpenClaw تهيئة JSON5 من `OPENCLAW_CONFIG_PATH` ويخزن البيانات القابلة للتغيير في `OPENCLAW_STATE_DIR`. وعند التشغيل تحت Nix، اضبط هذين المسارين صراحةً إلى مواقع مُدارة من Nix حتى تبقى حالة وقت التشغيل والتهيئة خارج المتجر غير القابل للتغيير.

| المتغير               | الافتراضي                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### اكتشاف PATH للخدمة

تكتشف خدمة Gateway عبر launchd/systemd تلقائيًا الملفات التنفيذية في ملفات Nix profile بحيث
تعمل Plugins والأدوات التي تنفذ أوامر shell إلى ملفات تنفيذية مثبتة عبر `nix`
من دون إعداد PATH يدويًا:

- عندما تكون `NIX_PROFILES` مضبوطة، يُضاف كل إدخال إلى PATH الخاص بالخدمة
  بترتيب أولوية من اليمين إلى اليسار (وهو ما يطابق أولوية Nix shell — حيث يفوز الإدخال الأيمن).
- عندما لا تكون `NIX_PROFILES` مضبوطة، تتم إضافة `~/.nix-profile/bin` كبديل.

ينطبق هذا على كل من بيئتي خدمة macOS launchd وLinux systemd.

## ذو صلة

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- دليل الإعداد الكامل
- [المعالج](/ar/start/wizard) -- إعداد CLI بدون Nix
- [Docker](/ar/install/docker) -- إعداد بالحاويات
