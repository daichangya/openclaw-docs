---
read_when:
    - تريد تشغيل OpenClaw على مدار الساعة طوال أيام الأسبوع على VPS سحابي (وليس على حاسوبك المحمول)
    - تريد Gateway بمستوى إنتاج، يعمل دائمًا، على VPS خاص بك
    - تريد تحكمًا كاملًا في الاستمرارية، والثنائيات، وسلوك إعادة التشغيل
    - أنت تشغّل OpenClaw في Docker على Hetzner أو مزود مشابه
summary: شغّل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على VPS رخيص من Hetzner (Docker) مع حالة دائمة وثنائيات مدمجة
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw على Hetzner (دليل VPS للإنتاج باستخدام Docker)

## الهدف

شغّل OpenClaw Gateway بشكل دائم على VPS من Hetzner باستخدام Docker، مع حالة دائمة، وثنائيات مدمجة، وسلوك آمن لإعادة التشغيل.

إذا كنت تريد “OpenClaw يعمل على مدار الساعة طوال أيام الأسبوع مقابل حوالي 5 دولارات”، فهذا هو أبسط إعداد موثوق.
تتغير أسعار Hetzner؛ اختر أصغر VPS بنظام Debian/Ubuntu ثم قم بالترقية إذا واجهت حالات نفاد الذاكرة (OOM).

تذكير بنموذج الأمان:

- الوكلاء المشتركون على مستوى الشركة مناسبون عندما يكون الجميع ضمن نفس نطاق الثقة ويكون وقت التشغيل مخصصًا للأعمال فقط.
- حافظ على فصل صارم: VPS/وقت تشغيل مخصص + حسابات مخصصة؛ لا تستخدم ملفات Apple/Google/المتصفح/مدير كلمات المرور الشخصية على ذلك المضيف.
- إذا كان المستخدمون خصومًا لبعضهم البعض، فافصل بينهم حسب Gateway/المضيف/مستخدم نظام التشغيل.

راجع [الأمان](/ar/gateway/security) و[VPS hosting](/ar/vps).

## ماذا نفعل هنا (بشكل مبسط)؟

- استئجار خادم Linux صغير (VPS من Hetzner)
- تثبيت Docker (وقت تشغيل تطبيق معزول)
- تشغيل OpenClaw Gateway داخل Docker
- حفظ `~/.openclaw` + `~/.openclaw/workspace` على المضيف (لتبقى بعد إعادة التشغيل/إعادة البناء)
- الوصول إلى واجهة Control UI من حاسوبك المحمول عبر نفق SSH

تتضمن حالة `~/.openclaw` المركّبة هذه `openclaw.json`، وملف
`agents/<agentId>/agent/auth-profiles.json` لكل وكيل، و`.env`.

يمكن الوصول إلى Gateway عبر:

- إعادة توجيه منفذ SSH من حاسوبك المحمول
- تعريض المنفذ مباشرة إذا كنت تدير الجدار الناري والرموز المميزة بنفسك

يفترض هذا الدليل استخدام Ubuntu أو Debian على Hetzner.  
إذا كنت تستخدم VPS بنظام Linux آخر، فقم بمواءمة الحزم وفقًا لذلك.
للتدفق العام باستخدام Docker، راجع [Docker](/ar/install/docker).

---

## المسار السريع (للمشغلين ذوي الخبرة)

1. تجهيز VPS من Hetzner
2. تثبيت Docker
3. استنساخ مستودع OpenClaw
4. إنشاء أدلة مضيف دائمة
5. إعداد `.env` و`docker-compose.yml`
6. تضمين الثنائيات المطلوبة داخل الصورة
7. `docker compose up -d`
8. التحقق من الاستمرارية وإمكانية الوصول إلى Gateway

---

## ما الذي تحتاج إليه

- VPS من Hetzner مع صلاحية root
- وصول SSH من حاسوبك المحمول
- إلمام أساسي بـ SSH + النسخ/اللصق
- حوالي 20 دقيقة
- Docker وDocker Compose
- بيانات اعتماد مصادقة النموذج
- بيانات اعتماد موفر اختيارية
  - رمز QR لـ WhatsApp
  - رمز bot لـ Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="تجهيز VPS">
    أنشئ VPS بنظام Ubuntu أو Debian في Hetzner.

    اتصل بصلاحية root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    يفترض هذا الدليل أن VPS يحتفظ بالحالة.
    لا تتعامل معه على أنه بنية تحتية قابلة للاستبدال.

  </Step>

  <Step title="تثبيت Docker (على VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    تحقّق:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="استنساخ مستودع OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    يفترض هذا الدليل أنك ستبني صورة مخصصة لضمان استمرارية الثنائيات.

  </Step>

  <Step title="إنشاء أدلة مضيف دائمة">
    حاويات Docker مؤقتة بطبيعتها.
    يجب أن تعيش كل حالة طويلة الأمد على المضيف.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # اضبط الملكية على مستخدم الحاوية (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="إعداد متغيرات البيئة">
    أنشئ ملف `.env` في جذر المستودع.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    اترك `OPENCLAW_GATEWAY_TOKEN` فارغًا ما لم تكن تريد صراحةً
    إدارته من خلال `.env`؛ يكتب OpenClaw رمزًا مميزًا عشوائيًا لـ Gateway في
    الإعدادات عند أول تشغيل. أنشئ كلمة مرور لسلسلة المفاتيح والصقها في
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تقم بعمل commit لهذا الملف.**

    ملف `.env` هذا مخصص لمتغيرات بيئة الحاوية/وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`.
    أما مصادقة OAuth/مفاتيح API الخاصة بالموفرات المخزنة فتوجد في
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` المركّب.

  </Step>

  <Step title="إعداد Docker Compose">
    أنشئ أو حدّث `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # يُوصى بإبقاء Gateway مقصورًا على loopback في VPS؛ والوصول إليه عبر نفق SSH.
          # لتعريضه للعامة، أزل البادئة `127.0.0.1:` واضبط الجدار الناري وفقًا لذلك.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    الخيار `--allow-unconfigured` مخصص فقط لتسهيل التهيئة الأولية، وليس بديلًا عن إعداد مناسب لـ gateway. استمر في ضبط المصادقة (`gateway.auth.token` أو كلمة المرور) واستخدم إعدادات bind آمنة لبيئة النشر الخاصة بك.

  </Step>

  <Step title="خطوات وقت تشغيل Docker VM المشتركة">
    استخدم دليل وقت التشغيل المشترك لتدفق مضيف Docker العام:

    - [تضمين الثنائيات المطلوبة داخل الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [البناء والتشغيل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يُحفَظ وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="الوصول الخاص بـ Hetzner">
    بعد خطوات البناء والتشغيل المشتركة، أنشئ نفقًا من حاسوبك المحمول:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    افتح:

    `http://127.0.0.1:18789/`

    الصق السر المشترك الذي قمت بإعداده. يستخدم هذا الدليل رمز gateway
    المميز افتراضيًا؛ وإذا انتقلت إلى المصادقة بكلمة مرور، فاستخدم كلمة المرور تلك بدلًا منه.

  </Step>
</Steps>

خريطة الاستمرارية المشتركة موجودة في [Docker VM Runtime](/ar/install/docker-vm-runtime#what-persists-where).

## البنية التحتية كرمز (Terraform)

بالنسبة للفرق التي تفضّل تدفقات العمل الخاصة بالبنية التحتية كرمز، يوفّر إعداد Terraform تُديره جهة من المجتمع ما يلي:

- إعداد Terraform معياري مع إدارة للحالة البعيدة
- تجهيز آلي عبر cloud-init
- نصوص نشر (bootstrap وdeploy وbackup/restore)
- تقوية أمنية (جدار ناري وUFW ووصول SSH فقط)
- إعداد نفق SSH للوصول إلى gateway

**المستودعات:**

- البنية التحتية: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- إعداد Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

يكمل هذا النهج إعداد Docker أعلاه من خلال نشرات قابلة لإعادة الإنتاج، وبنية تحتية مُدارة بالإصدارات، وتعافٍ تلقائي من الكوارث.

> **ملاحظة:** تتم صيانته من قبل المجتمع. للمشكلات أو المساهمات، راجع روابط المستودعات أعلاه.

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- إعداد Gateway: [إعداد Gateway](/ar/gateway/configuration)
- حافظ على تحديث OpenClaw: [التحديث](/ar/install/updating)
