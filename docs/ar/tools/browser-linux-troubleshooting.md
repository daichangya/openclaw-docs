---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: إصلاح مشكلات بدء تشغيل CDP في Chrome/Brave/Edge/Chromium للتحكم في متصفح OpenClaw على Linux
title: استكشاف أخطاء المتصفح وإصلاحها
x-i18n:
    generated_at: "2026-04-25T13:59:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## المشكلة: "Failed to start Chrome CDP on port 18800"

تفشل خدمة التحكم بالمتصفح في OpenClaw في تشغيل Chrome/Brave/Edge/Chromium مع الخطأ:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### السبب الجذري

في Ubuntu (والعديد من توزيعات Linux)، يكون تثبيت Chromium الافتراضي عبارة عن **حزمة snap**. ويتداخل تقييد AppArmor الخاص بـ snap مع الطريقة التي يشغّل بها OpenClaw عملية المتصفح ويراقبها.

يقوم الأمر `apt install chromium` بتثبيت حزمة stub تعيد التوجيه إلى snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

هذا **ليس** متصفحًا حقيقيًا - بل مجرد wrapper.

ومن أعطال التشغيل الشائعة الأخرى على Linux:

- تعني الرسالة `The profile appears to be in use by another Chromium process` أن Chrome
  وجد ملفات قفل `Singleton*` قديمة في دليل الملف الشخصي المُدار. ويقوم OpenClaw
  بإزالة هذه الأقفال ويعيد المحاولة مرة واحدة عندما يشير القفل إلى عملية ميتة أو عملية على مضيف مختلف.
- تعني الرسالة `Missing X server or $DISPLAY` أنه تم طلب متصفح مرئي صراحةً على مضيف لا يحتوي على جلسة سطح مكتب. وبشكل افتراضي، تعود الملفات الشخصية المحلية المُدارة الآن إلى الوضع headless على Linux عندما يكون كل من `DISPLAY` و`WAYLAND_DISPLAY` غير مضبوطين. وإذا قمت بتعيين `OPENCLAW_BROWSER_HEADLESS=0`،
  أو `browser.headless: false`، أو `browser.profiles.<name>.headless: false`،
  فأزل ذلك التجاوز الخاص بالوضع المرئي، أو اضبط `OPENCLAW_BROWSER_HEADLESS=1`، أو ابدأ `Xvfb`، أو شغّل
  `openclaw browser start --headless` من أجل تشغيل مُدار لمرة واحدة، أو شغّل
  OpenClaw ضمن جلسة سطح مكتب حقيقية.

### الحل 1: تثبيت Google Chrome ‏(موصى به)

ثبّت حزمة `.deb` الرسمية الخاصة بـ Google Chrome، فهي ليست معزولة بواسطة snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # إذا كانت هناك أخطاء في التبعيات
```

ثم حدّث تهيئة OpenClaw لديك (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### الحل 2: استخدام Snap Chromium مع وضع Attach-Only

إذا كنت مضطرًا لاستخدام snap Chromium، فاضبط OpenClaw ليلتصق بمتصفح تم تشغيله يدويًا:

1. حدّث التهيئة:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. شغّل Chromium يدويًا:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. اختياريًا، أنشئ خدمة systemd للمستخدم لتشغيل Chrome تلقائيًا:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

فعّلها باستخدام: `systemctl --user enable --now openclaw-browser.service`

### التحقق من أن المتصفح يعمل

تحقق من الحالة:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

اختبر التصفح:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### مرجع التهيئة

| الخيار                           | الوصف                                                              | الافتراضي                                                   |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `browser.enabled`                | تمكين التحكم بالمتصفح                                              | `true`                                                      |
| `browser.executablePath`         | مسار ملف متصفح ثنائي مبني على Chromium ‏(Chrome/Brave/Edge/Chromium) | يُكتشف تلقائيًا (ويفضّل المتصفح الافتراضي إذا كان مبنيًا على Chromium) |
| `browser.headless`               | التشغيل دون واجهة GUI                                              | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | تجاوز خاص بالعملية للوضع headless في المتصفح المحلي المُدار         | غير معيّن                                                   |
| `browser.noSandbox`              | إضافة العلم `--no-sandbox` ‏(ضروري لبعض إعدادات Linux)             | `false`                                                     |
| `browser.attachOnly`             | لا تُشغّل المتصفح، بل التصق فقط بموجود مسبقًا                      | `false`                                                     |
| `browser.cdpPort`                | منفذ Chrome DevTools Protocol                                      | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | مهلة اكتشاف Chrome المحلية المُدارة                                | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | مهلة جاهزية CDP المحلية بعد التشغيل                                 | `8000`                                                      |

على Raspberry Pi، أو مضيفات VPS الأقدم، أو وسائط التخزين البطيئة، ارفع
`browser.localLaunchTimeoutMs` عندما يحتاج Chrome إلى وقت أطول لإظهار نقطة نهاية
CDP HTTP الخاصة به. وارفع `browser.localCdpReadyTimeoutMs` عندما ينجح التشغيل لكن
يظل `openclaw browser start` يبلغ عن `not reachable after start`. ويتم تقييد القيم
بـ 120000 ms كحد أقصى.

### المشكلة: "No Chrome tabs found for profile=\"user\""

أنت تستخدم ملفًا شخصيًا من نوع `existing-session` / Chrome MCP. يستطيع OpenClaw رؤية Chrome المحلية،
لكن لا توجد ألسنة تبويب مفتوحة متاحة للاتصال بها.

خيارات الإصلاح:

1. **استخدم المتصفح المُدار:** ‏`openclaw browser start --browser-profile openclaw`
   (أو اضبط `browser.defaultProfile: "openclaw"`).
2. **استخدم Chrome MCP:** تأكد من أن Chrome المحلية تعمل وبها لسان تبويب واحد مفتوح على الأقل، ثم أعد المحاولة باستخدام `--browser-profile user`.

ملاحظات:

- إن `user` مخصصة للمضيف فقط. وبالنسبة إلى خوادم Linux، أو الحاويات، أو المضيفات البعيدة، ففضّل ملفات CDP الشخصية.
- تظل `user` / والملفات الشخصية الأخرى من نوع `existing-session` خاضعة لقيود Chrome MCP الحالية:
  الإجراءات المعتمدة على المراجع، وhooks رفع ملف واحد، وعدم وجود تجاوزات لمهلة الحوارات، وعدم وجود
  `wait --load networkidle`، وعدم وجود `responsebody` أو تصدير PDF أو اعتراض للتنزيلات أو إجراءات جماعية.
- تقوم ملفات `openclaw` المحلية بتعيين `cdpPort`/`cdpUrl` تلقائيًا؛ لا تضبطهما إلا من أجل CDP البعيدة.
- تقبل ملفات CDP الشخصية البعيدة القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) لاكتشاف `/json/version`، أو WS(S) عندما
  توفّر لك خدمة المتصفح عنوان DevTools socket مباشرًا.

## ذو صلة

- [المتصفح](/ar/tools/browser)
- [تسجيل الدخول في المتصفح](/ar/tools/browser-login)
- [استكشاف أخطاء المتصفح في WSL2 وإصلاحها لويندوز مع CDP بعيدة](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
