---
read_when:
    - تريد Gateway مُعبّأة في حاوية باستخدام Podman بدلًا من Docker
summary: تشغيل OpenClaw في حاوية Podman دون صلاحيات root
title: Podman
x-i18n:
    generated_at: "2026-04-23T07:26:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

شغّل OpenClaw Gateway في حاوية Podman دون صلاحيات root، وتُدار بواسطة المستخدم الحالي غير الجذر.

النموذج المقصود هو:

- يشغّل Podman حاوية gateway.
- يمثّل CLI الخاص بـ `openclaw` على المضيف مستوى التحكم.
- تبقى الحالة الدائمة على المضيف ضمن `~/.openclaw` افتراضيًا.
- تستخدم الإدارة اليومية الأوامر `openclaw --container <name> ...` بدلًا من `sudo -u openclaw` أو `podman exec` أو مستخدم خدمة منفصل.

## المتطلبات المسبقة

- **Podman** في وضع rootless
- تثبيت **OpenClaw CLI** على المضيف
- **اختياري:** `systemd --user` إذا كنت تريد بدءًا تلقائيًا مُدارًا عبر Quadlet
- **اختياري:** `sudo` فقط إذا كنت تريد `loginctl enable-linger "$(whoami)"` لاستمرارية التشغيل عند الإقلاع على مضيف headless

## البدء السريع

<Steps>
  <Step title="إعداد لمرة واحدة">
    من جذر المستودع، شغّل `./scripts/podman/setup.sh`.
  </Step>

  <Step title="بدء حاوية Gateway">
    ابدأ الحاوية باستخدام `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="تشغيل الإعداد الأوّلي داخل الحاوية">
    شغّل `./scripts/run-openclaw-podman.sh launch setup`، ثم افتح `http://127.0.0.1:18789/`.
  </Step>

  <Step title="إدارة الحاوية العاملة من CLI على المضيف">
    اضبط `OPENCLAW_CONTAINER=openclaw`، ثم استخدم أوامر `openclaw` العادية من المضيف.
  </Step>
</Steps>

تفاصيل الإعداد:

- يبني `./scripts/podman/setup.sh` الصورة `openclaw:local` في مخزن Podman الجذري الخاص بك افتراضيًا، أو يستخدم `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` إذا قمت بضبط أحدهما.
- ينشئ `~/.openclaw/openclaw.json` مع `gateway.mode: "local"` إذا كان مفقودًا.
- ينشئ `~/.openclaw/.env` مع `OPENCLAW_GATEWAY_TOKEN` إذا كان مفقودًا.
- بالنسبة إلى التشغيلات اليدوية، يقرأ المساعد فقط قائمة سماح صغيرة من المفاتيح المرتبطة بـ Podman من `~/.openclaw/.env` ويمرر متغيرات env صريحة في وقت التشغيل إلى الحاوية؛ ولا يمرر ملف env الكامل إلى Podman.

إعداد مُدار عبر Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

يمثل Quadlet خيارًا خاصًا بـ Linux فقط لأنه يعتمد على خدمات systemd للمستخدم.

يمكنك أيضًا ضبط `OPENCLAW_PODMAN_QUADLET=1`.

متغيرات env الاختيارية للبناء/الإعداد:

- `OPENCLAW_IMAGE` أو `OPENCLAW_PODMAN_IMAGE` -- لاستخدام صورة موجودة/تم سحبها بدلًا من بناء `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- لتثبيت حزم apt إضافية أثناء بناء الصورة
- `OPENCLAW_EXTENSIONS` -- لتثبيت تبعيات Plugins مسبقًا وقت البناء

بدء الحاوية:

```bash
./scripts/run-openclaw-podman.sh launch
```

يبدأ السكربت الحاوية باستخدام uid/gid الحاليين مع `--userns=keep-id` ويربط حالة OpenClaw الخاصة بك داخل الحاوية عبر bind mount.

الإعداد الأوّلي:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

ثم افتح `http://127.0.0.1:18789/` واستخدم الرمز الموجود في `~/.openclaw/.env`.

إعداد CLI الافتراضي على المضيف:

```bash
export OPENCLAW_CONTAINER=openclaw
```

بعد ذلك ستعمل أوامر مثل هذه داخل تلك الحاوية تلقائيًا:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # يتضمن فحص خدمة إضافيًا
openclaw doctor
openclaw channels login
```

على macOS، قد تجعل Podman machine المتصفح يبدو غير محلي بالنسبة إلى gateway.
إذا أبلغت Control UI عن أخطاء مصادقة الأجهزة بعد التشغيل، فاستخدم إرشادات Tailscale في
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

للوصول عبر HTTPS أو المتصفح البعيد، اتبع مستندات Tailscale الأساسية.

ملاحظة خاصة بـ Podman:

- أبقِ مضيف النشر في Podman على `127.0.0.1`.
- فضّل `tailscale serve` المُدار من المضيف على `openclaw gateway --tailscale serve`.
- على macOS، إذا كان سياق مصادقة الجهاز في المتصفح المحلي غير موثوق، فاستخدم وصول Tailscale بدلًا من حلول الأنفاق المحلية المؤقتة.

راجع:

- [Tailscale](/ar/gateway/tailscale)
- [Control UI](/ar/web/control-ui)

## Systemd ‏(Quadlet، اختياري)

إذا شغّلت `./scripts/podman/setup.sh --quadlet`، فسيثبّت الإعداد ملف Quadlet في:

```bash
~/.config/containers/systemd/openclaw.container
```

أوامر مفيدة:

- **البدء:** `systemctl --user start openclaw.service`
- **الإيقاف:** `systemctl --user stop openclaw.service`
- **الحالة:** `systemctl --user status openclaw.service`
- **السجلات:** `journalctl --user -u openclaw.service -f`

بعد تعديل ملف Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

لاستمرارية التشغيل عند الإقلاع على مضيفات SSH/headless، فعّل lingering للمستخدم الحالي:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## الإعداد وenv والتخزين

- **دليل الإعداد:** `~/.openclaw`
- **دليل مساحة العمل:** `~/.openclaw/workspace`
- **ملف الرمز:** `~/.openclaw/.env`
- **مساعد التشغيل:** `./scripts/run-openclaw-podman.sh`

يقوم سكربت التشغيل وQuadlet بربط حالة المضيف داخل الحاوية عبر bind mount:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

افتراضيًا، تكون هذه أدلة على المضيف، وليست حالة مجهولة داخل الحاوية، لذلك
تبقى `openclaw.json`، و`auth-profiles.json` لكل وكيل، وحالة القنوات/المزوّدات،
والجلسات، ومساحة العمل محفوظة عند استبدال الحاوية.
كما يقوم إعداد Podman أيضًا بزرع `gateway.controlUi.allowedOrigins` للقيمتين `127.0.0.1` و`localhost` على منفذ gateway المنشور حتى تعمل dashboard المحلية مع الربط غير الحلقي للحاوية.

متغيرات env مفيدة للمشغّل اليدوي:

- `OPENCLAW_PODMAN_CONTAINER` -- اسم الحاوية (`openclaw` افتراضيًا)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- الصورة المطلوب تشغيلها
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- منفذ المضيف المعين إلى `18789` داخل الحاوية
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- منفذ المضيف المعين إلى `18790` داخل الحاوية
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- واجهة المضيف للمنافذ المنشورة؛ الافتراضي هو `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- وضع ربط gateway داخل الحاوية؛ الافتراضي هو `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (الافتراضي)، أو `auto`، أو `host`

يقرأ المشغّل اليدوي `~/.openclaw/.env` قبل إنهاء القيم الافتراضية للحاوية/الصورة، لذلك يمكنك حفظ هذه القيم هناك.

إذا استخدمت `OPENCLAW_CONFIG_DIR` أو `OPENCLAW_WORKSPACE_DIR` غير الافتراضيين، فاضبط المتغيرات نفسها لكلٍّ من `./scripts/podman/setup.sh` وأوامر `./scripts/run-openclaw-podman.sh launch` اللاحقة. ولا يحتفظ المشغّل المحلي في المستودع بتجاوزات المسارات المخصصة عبر جلسات shell المختلفة.

ملاحظة Quadlet:

- تحافظ خدمة Quadlet المولدة عمدًا على شكل افتراضي ثابت ومشدّد: منافذ منشورة على `127.0.0.1`، و`--bind lan` داخل الحاوية، وفضاء أسماء مستخدم `keep-id`.
- وتثبت القيم `OPENCLAW_NO_RESPAWN=1` و`Restart=on-failure` و`TimeoutStartSec=300`.
- كما تنشر كلًا من `127.0.0.1:18789:18789` ‏(gateway) و`127.0.0.1:18790:18790` ‏(bridge).
- وتقرأ `~/.openclaw/.env` كملف `EnvironmentFile` في وقت التشغيل لقيم مثل `OPENCLAW_GATEWAY_TOKEN`، لكنها لا تستهلك قائمة السماح الخاصة بالمشغّل اليدوي لتجاوزات Podman.
- إذا كنت تحتاج إلى منافذ نشر مخصصة، أو مضيف نشر مختلف، أو علامات تشغيل حاوية أخرى، فاستخدم المشغّل اليدوي أو عدّل `~/.config/containers/systemd/openclaw.container` مباشرة، ثم أعد تحميل الخدمة وأعد تشغيلها.

## أوامر مفيدة

- **سجلات الحاوية:** `podman logs -f openclaw`
- **إيقاف الحاوية:** `podman stop openclaw`
- **إزالة الحاوية:** `podman rm -f openclaw`
- **فتح عنوان dashboard من CLI على المضيف:** `openclaw dashboard --no-open`
- **السلامة/الحالة عبر CLI على المضيف:** `openclaw gateway status --deep` (فحص RPC + فحص خدمة إضافي)

## استكشاف الأخطاء وإصلاحها

- **رفض الأذونات (EACCES) في الإعداد أو مساحة العمل:** تعمل الحاوية افتراضيًا باستخدام `--userns=keep-id` و`--user <your uid>:<your gid>`. تأكد من أن مسارات الإعداد/مساحة العمل على المضيف مملوكة للمستخدم الحالي.
- **تم حظر بدء Gateway (غياب `gateway.mode=local`):** تأكد من وجود `~/.openclaw/openclaw.json` وأنه يضبط `gateway.mode="local"`. ينشئ `scripts/podman/setup.sh` هذا الملف إذا كان مفقودًا.
- **تصيب أوامر CLI الخاصة بالحاوية الهدف الخطأ:** استخدم `openclaw --container <name> ...` صراحةً، أو صدّر `OPENCLAW_CONTAINER=<name>` في shell.
- **يفشل `openclaw update` مع `--container`:** هذا متوقع. أعد بناء الصورة/سحبها، ثم أعد تشغيل الحاوية أو خدمة Quadlet.
- **لا تبدأ خدمة Quadlet:** شغّل `systemctl --user daemon-reload`، ثم `systemctl --user start openclaw.service`. وعلى الأنظمة headless قد تحتاج أيضًا إلى `sudo loginctl enable-linger "$(whoami)"`.
- **يحظر SELinux عمليات bind mount:** اترك سلوك الربط الافتراضي كما هو؛ يضيف المشغّل تلقائيًا `:Z` على Linux عندما يكون SELinux في وضع enforcing أو permissive.

## ذو صلة

- [Docker](/ar/install/docker)
- [عملية Gateway في الخلفية](/ar/gateway/background-process)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
