---
read_when:
    - أنت تريد تشغيل OpenClaw على مدار الساعة طوال أيام الأسبوع على GCP
    - أنت تريد Gateway جاهزًا للإنتاج ويعمل دائمًا على جهازك الافتراضي الخاص
    - أنت تريد تحكمًا كاملًا في الاستمرارية والثنائيات وسلوك إعادة التشغيل
summary: شغّل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على جهاز افتراضي GCP Compute Engine ‏(Docker) مع حالة دائمة
title: GCP
x-i18n:
    generated_at: "2026-04-19T01:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4cf7924cbcfae74f268c88caedb79ed87a6ad37f4910ad65d92a5d99fe49c1
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw على GCP Compute Engine ‏(Docker، دليل VPS للإنتاج)

## الهدف

تشغيل OpenClaw Gateway دائمًا مع حالة دائمة على جهاز افتراضي GCP Compute Engine باستخدام Docker، مع حالة دائمة، وثنائيات مضمّنة داخل الصورة، وسلوك آمن عند إعادة التشغيل.

إذا كنت تريد "OpenClaw يعمل على مدار الساعة طوال أيام الأسبوع مقابل نحو 5 إلى 12 دولارًا شهريًا"، فهذا إعداد موثوق على Google Cloud.
تختلف الأسعار حسب نوع الجهاز والمنطقة؛ اختر أصغر جهاز افتراضي يناسب حمل العمل لديك ثم قم بالترقية إذا واجهت حالات نفاد الذاكرة.

## ماذا نفعل هنا (بشكل مبسط)؟

- إنشاء مشروع GCP وتفعيل الفوترة
- إنشاء جهاز افتراضي Compute Engine
- تثبيت Docker ‏(بيئة تشغيل معزولة للتطبيق)
- تشغيل OpenClaw Gateway داخل Docker
- جعل `~/.openclaw` و `~/.openclaw/workspace` دائمين على المضيف (لتبقى عبر إعادة التشغيل/إعادة البناء)
- الوصول إلى Control UI من حاسوبك المحمول عبر نفق SSH

تتضمن الحالة المثبّتة على `~/.openclaw` الملف `openclaw.json` وملف
`agents/<agentId>/agent/auth-profiles.json` لكل وكيل و`.env`.

يمكن الوصول إلى Gateway عبر:

- إعادة توجيه منفذ SSH من حاسوبك المحمول
- تعريض المنفذ مباشرة إذا كنت تدير الجدار الناري والرموز المميّزة بنفسك

يستخدم هذا الدليل Debian على GCP Compute Engine.
يعمل Ubuntu أيضًا؛ فقط طابِق أسماء الحزم وفقًا لذلك.
للتدفق العام لـ Docker، راجع [Docker](/ar/install/docker).

---

## المسار السريع (للمشغّلين ذوي الخبرة)

1. أنشئ مشروع GCP وفعّل Compute Engine API
2. أنشئ جهازًا افتراضيًا Compute Engine ‏(`e2-small`، وDebian 12، و20GB)
3. اتصل بالجهاز عبر SSH
4. ثبّت Docker
5. انسخ مستودع OpenClaw
6. أنشئ أدلة مضيف دائمة
7. اضبط `.env` و`docker-compose.yml`
8. ضمّن الثنائيات المطلوبة داخل الصورة، ثم ابنِ وشغّل

---

## ما الذي تحتاجه

- حساب GCP ‏(الفئة المجانية مؤهلة لـ `e2-micro`)
- تثبيت gcloud CLI ‏(أو استخدام Cloud Console)
- وصول SSH من حاسوبك المحمول
- إلمام أساسي بـ SSH والنسخ/اللصق
- نحو 20 إلى 30 دقيقة
- Docker وDocker Compose
- بيانات اعتماد مصادقة النموذج
- بيانات اعتماد مزوّد اختيارية
  - رمز QR لـ WhatsApp
  - رمز بوت Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="تثبيت gcloud CLI ‏(أو استخدام Console)">
    **الخيار A: ‏gcloud CLI** (موصى به للأتمتة)

    ثبّته من [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    قم بالتهيئة والمصادقة:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **الخيار B: ‏Cloud Console**

    يمكن تنفيذ جميع الخطوات من خلال واجهة الويب على [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="إنشاء مشروع GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    فعّل الفوترة من [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (مطلوب لـ Compute Engine).

    فعّل Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. انتقل إلى IAM & Admin > Create Project
    2. سمّه وأنشئه
    3. فعّل الفوترة للمشروع
    4. انتقل إلى APIs & Services > Enable APIs > وابحث عن "Compute Engine API" > ثم Enable

  </Step>

  <Step title="إنشاء الجهاز الافتراضي">
    **أنواع الأجهزة:**

    | النوع     | المواصفات                 | التكلفة             | ملاحظات                                        |
    | --------- | ------------------------- | ------------------- | ---------------------------------------------- |
    | e2-medium | 2 vCPU، و4GB RAM          | نحو 25 دولارًا/شهرًا | الأكثر موثوقية لعمليات بناء Docker المحلية     |
    | e2-small  | 2 vCPU، و2GB RAM          | نحو 12 دولارًا/شهرًا | الحد الأدنى الموصى به لبناء Docker             |
    | e2-micro  | 2 vCPU ‏(مشتركة)، و1GB RAM | مؤهل للفئة المجانية | يفشل كثيرًا بسبب نفاد الذاكرة أثناء بناء Docker (`exit 137`) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. انتقل إلى Compute Engine > VM instances > Create instance
    2. الاسم: `openclaw-gateway`
    3. المنطقة: `us-central1`، والنطاق: `us-central1-a`
    4. نوع الجهاز: `e2-small`
    5. قرص الإقلاع: Debian 12، و20GB
    6. أنشئ الجهاز

  </Step>

  <Step title="الاتصال بالجهاز عبر SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    انقر زر "SSH" بجوار جهازك الافتراضي في لوحة تحكم Compute Engine.

    ملاحظة: قد يستغرق نشر مفاتيح SSH من 1 إلى 2 دقيقة بعد إنشاء الجهاز الافتراضي. إذا رُفض الاتصال، انتظر ثم أعد المحاولة.

  </Step>

  <Step title="تثبيت Docker ‏(على الجهاز الافتراضي)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    سجّل الخروج ثم ادخل مرة أخرى ليُطبّق تغيير المجموعة:

    ```bash
    exit
    ```

    ثم اتصل عبر SSH مرة أخرى:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    تحقّق:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="نسخ مستودع OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    يفترض هذا الدليل أنك ستبني صورة مخصصة لضمان استمرارية الثنائيات.

  </Step>

  <Step title="إنشاء أدلة المضيف الدائمة">
    حاويات Docker مؤقتة.
    يجب أن تعيش جميع الحالات طويلة الأمد على المضيف.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="إعداد متغيرات البيئة">
    أنشئ ملف `.env` في جذر المستودع.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    اترك `OPENCLAW_GATEWAY_TOKEN` فارغًا ما لم تكن تريد صراحةً
    إدارته عبر `.env`؛ يكتب OpenClaw رمز Gateway عشوائيًا إلى
    الإعدادات عند أول تشغيل. أنشئ كلمة مرور keyring والصقها في
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تقم بإيداع هذا الملف.**

    ملف `.env` هذا مخصّص لمتغيرات بيئة الحاوية/وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`.
    أما مصادقة OAuth/API-key الخاصة بالمزوّدات المخزّنة فتوجد في
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` المثبّت.

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
          # الموصى به: أبقِ Gateway مقصورًا على loopback على الجهاز الافتراضي؛ وادخل إليه عبر نفق SSH.
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

    `--allow-unconfigured` مخصّص فقط لتسهيل التمهيد الأولي، وليس بديلًا عن إعداد صحيح لـ gateway. مع ذلك، اضبط المصادقة (`gateway.auth.token` أو كلمة المرور) واستخدم إعدادات ربط آمنة لبيئة النشر لديك.

  </Step>

  <Step title="خطوات وقت التشغيل المشتركة لـ Docker على الجهاز الافتراضي">
    استخدم دليل وقت التشغيل المشترك للتدفق المعتاد لمضيف Docker:

    - [ضمّن الثنائيات المطلوبة داخل الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [البناء والتشغيل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يبقى ثابتًا وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="ملاحظات تشغيل خاصة بـ GCP">
    على GCP، إذا فشل البناء مع `Killed` أو `exit code 137` أثناء `pnpm install --frozen-lockfile`، فهذا يعني أن الجهاز الافتراضي نفدت ذاكرته. استخدم `e2-small` كحد أدنى، أو `e2-medium` لبناء أولي أكثر موثوقية.

    عند الربط على LAN ‏(`OPENCLAW_GATEWAY_BIND=lan`)، اضبط مصدر متصفح موثوقًا قبل المتابعة:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    إذا غيّرت منفذ gateway، فاستبدل `18789` بالمنفذ الذي ضبطته.

  </Step>

  <Step title="الوصول من حاسوبك المحمول">
    أنشئ نفق SSH لإعادة توجيه منفذ Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    افتح في متصفحك:

    `http://127.0.0.1:18789/`

    أعد طباعة رابط لوحة تحكم نظيف:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    إذا طلبت Control UI مصادقة السر المشترك، الصق الرمز المميّز أو
    كلمة المرور المهيأة في إعدادات Control UI. يكتب تدفق Docker هذا رمزًا
    مميّزًا افتراضيًا؛ وإذا بدّلت إعداد الحاوية إلى مصادقة بكلمة مرور، فاستخدم
    كلمة المرور تلك بدلًا من ذلك.

    إذا عرضت Control UI الرسالة `unauthorized` أو `disconnected (1008): pairing required`، فوافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    هل تحتاج مرجع الاستمرارية المشتركة والتحديثات مرة أخرى؟
    راجع [Docker VM Runtime](/ar/install/docker-vm-runtime#what-persists-where) و[تحديثات Docker VM Runtime](/ar/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## استكشاف الأخطاء وإصلاحها

**رُفض اتصال SSH**

قد يستغرق نشر مفاتيح SSH من 1 إلى 2 دقيقة بعد إنشاء الجهاز الافتراضي. انتظر ثم أعد المحاولة.

**مشكلات OS Login**

تحقّق من ملف تعريف OS Login لديك:

```bash
gcloud compute os-login describe-profile
```

تأكد من أن حسابك يملك أذونات IAM المطلوبة (Compute OS Login أو Compute OS Admin Login).

**نفاد الذاكرة (OOM)**

إذا فشل بناء Docker مع `Killed` و`exit code 137`، فهذا يعني أن الجهاز الافتراضي قُتل بسبب نفاد الذاكرة. قم بالترقية إلى e2-small ‏(الحد الأدنى) أو e2-medium ‏(موصى به لعمليات البناء المحلية الموثوقة):

```bash
# أوقف الجهاز الافتراضي أولًا
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# غيّر نوع الجهاز
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# شغّل الجهاز الافتراضي
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## حسابات الخدمة (أفضل الممارسات الأمنية)

للاستخدام الشخصي، يعمل حساب المستخدم الافتراضي لديك بشكل جيد.

أما للأتمتة أو خطوط CI/CD، فأنشئ حساب خدمة مخصصًا بأقل قدر ممكن من الأذونات:

1. أنشئ حساب خدمة:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. امنح دور Compute Instance Admin ‏(أو دورًا مخصصًا أضيق):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

تجنب استخدام دور Owner للأتمتة. استخدم مبدأ أقل قدر من الامتيازات.

راجع [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) لمعرفة تفاصيل أدوار IAM.

---

## الخطوات التالية

- اضبط قنوات المراسلة: [القنوات](/ar/channels)
- اقترن بالأجهزة المحلية كعُقد: [Nodes](/ar/nodes)
- اضبط Gateway: [إعداد Gateway](/ar/gateway/configuration)
