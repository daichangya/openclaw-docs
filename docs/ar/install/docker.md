---
read_when:
    - أنت تريد Gateway داخل حاوية بدلًا من عمليات التثبيت المحلية
    - أنت تتحقق من تدفق Docker
summary: إعداد وتهيئة OpenClaw الاختياريان بالاعتماد على Docker
title: Docker
x-i18n:
    generated_at: "2026-04-21T07:21:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8d3e346ca60daa9908aef0846c9052321087af7dd2c919ce79de4d5925136a2
    source_path: install/docker.md
    workflow: 15
---

# Docker (اختياري)

Docker **اختياري**. استخدمه فقط إذا كنت تريد Gateway داخل حاوية أو تريد التحقق من تدفق Docker.

## هل Docker مناسب لي؟

- **نعم**: إذا كنت تريد بيئة Gateway معزولة ومؤقتة أو تريد تشغيل OpenClaw على مضيف من دون عمليات تثبيت محلية.
- **لا**: إذا كنت تعمل على جهازك الخاص وتريد فقط أسرع حلقة تطوير. استخدم تدفق التثبيت العادي بدلًا من ذلك.
- **ملاحظة حول العزل**: تستخدم الواجهة الخلفية الافتراضية للعزل Docker عندما يكون العزل مفعّلًا، لكن العزل يكون معطّلًا افتراضيًا ولا **يتطلب** تشغيل Gateway بالكامل داخل Docker. كما تتوفر أيضًا الواجهات الخلفية للعزل SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات المسبقة

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 غيغابايت لبناء الصورة (`pnpm install` قد يتم إنهاؤه بسبب OOM على المضيفين ذوي 1 غيغابايت مع رمز الخروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغّله على VPS/مضيف عام، فراجع
  [تقوية الأمان عند التعرض للشبكة](/ar/gateway/security)،
  وخاصة سياسة جدار الحماية Docker `DOCKER-USER`.

## Gateway داخل حاوية

<Steps>
  <Step title="بناء الصورة">
    من جذر المستودع، شغّل سكربت الإعداد:

    ```bash
    ./scripts/docker/setup.sh
    ```

    يؤدي هذا إلى بناء صورة Gateway محليًا. لاستخدام صورة مبنية مسبقًا بدلًا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تُنشر الصور المبنية مسبقًا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main` و`latest` و`<version>` (مثل `2026.2.26`).

  </Step>

  <Step title="إكمال التهيئة الأولية">
    يشغّل سكربت الإعداد التهيئة الأولية تلقائيًا. وسيقوم بما يلي:

    - طلب مفاتيح API الخاصة بالمزوّد
    - إنشاء رمز Gateway وكتابته إلى `.env`
    - تشغيل Gateway عبر Docker Compose

    أثناء الإعداد، تمر تهيئة ما قبل البدء وكتابات الإعدادات عبر
    `openclaw-gateway` مباشرةً. ويُستخدم `openclaw-cli` للأوامر التي تشغّلها بعد
    وجود حاوية Gateway بالفعل.

  </Step>

  <Step title="فتح Control UI">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك
    المضبوط داخل Settings. يكتب سكربت الإعداد رمزًا إلى `.env`
    افتراضيًا؛ وإذا بدّلت إعدادات الحاوية إلى مصادقة بكلمة مرور، فاستخدم تلك
    الكلمة بدلًا من ذلك.

    هل تحتاج الرابط مرة أخرى؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="تكوين القنوات (اختياري)">
    استخدم حاوية CLI لإضافة قنوات المراسلة:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)

  </Step>
</Steps>

### التدفق اليدوي

إذا كنت تفضّل تشغيل كل خطوة بنفسك بدلًا من استخدام سكربت الإعداد:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
شغّل `docker compose` من جذر المستودع. إذا كنت قد فعّلت `OPENCLAW_EXTRA_MOUNTS`
أو `OPENCLAW_HOME_VOLUME`، فإن سكربت الإعداد يكتب `docker-compose.extra.yml`؛
قم بتضمينه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
نظرًا لأن `openclaw-cli` يشارك مساحة أسماء الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة ما بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغّل التهيئة الأولية
وكتابات الإعدادات وقت الإعداد عبر `openclaw-gateway` مع
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية التالية:

| المتغير | الغرض |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | استخدام صورة بعيدة بدلًا من البناء محليًا                   |
| `OPENCLAW_DOCKER_APT_PACKAGES` | تثبيت حزم apt إضافية أثناء البناء (أسماء مفصولة بمسافات)        |
| `OPENCLAW_EXTENSIONS`          | تثبيت تبعيات extension مسبقًا وقت البناء (أسماء مفصولة بمسافات) |
| `OPENCLAW_EXTRA_MOUNTS`        | bind mounts إضافية من المضيف (قيم `source:target[:opts]` مفصولة بفواصل)  |
| `OPENCLAW_HOME_VOLUME`         | الإبقاء على `/home/node` داخل Docker volume مسماة                    |
| `OPENCLAW_SANDBOX`             | الاشتراك في bootstrap الخاص بالعزل (`1` أو `true` أو `yes` أو `on`)           |
| `OPENCLAW_DOCKER_SOCKET`       | تجاوز مسار Docker socket                                      |

### فحوصات السلامة

نقاط نهاية الفحص الخاصة بالحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # فحص الحيوية
curl -fsS http://127.0.0.1:18789/readyz     # فحص الجاهزية
```

تتضمن صورة Docker `HEALTHCHECK` مدمجًا يجري ping إلى `/healthz`.
إذا استمرت الفحوصات في الفشل، يضع Docker علامة `unhealthy` على الحاوية،
ويمكن لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة سلامة عميقة موثقة:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback المحلي

يضبط `scripts/docker/setup.sh` افتراضيًا القيمة `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منفذ Docker.

- `lan` (الافتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن سوى للعمليات داخل مساحة أسماء شبكة الحاوية الوصول
  إلى Gateway مباشرةً.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس الأسماء المستعارة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### التخزين والاستمرارية

يقوم Docker Compose بعمل bind-mount لـ `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، بحيث تبقى هذه المسارات
بعد استبدال الحاوية.

ودليل الإعدادات المركّب هذا هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المخزنة الخاصة بالمزوّد
- `.env` للأسرار وقت التشغيل المعتمدة على env مثل `OPENCLAW_GATEWAY_TOKEN`

للاطلاع على التفاصيل الكاملة للاستمرارية في عمليات النشر على VM، راجع
[وقت تشغيل Docker VM - ما الذي يبقى وأين](/ar/install/docker-vm-runtime#what-persists-where).

**نقاط نمو القرص الساخنة:** راقب `media/`، وملفات JSONL الخاصة بالجلسات، و`cron/runs/*.jsonl`،
وسجلات الملفات الدوّارة تحت `/tmp/openclaw/`.

### مساعدات الصدفة (اختياري)

لتسهيل إدارة Docker يوميًا، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت ClawDock من المسار الخام القديم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي لديك الموقع الجديد.

ثم استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard` وما إلى ذلك. شغّل
`clawdock-help` لجميع الأوامر.
راجع [ClawDock](/ar/install/clawdock) للاطلاع على الدليل الكامل للمساعد.

<AccordionGroup>
  <Accordion title="تمكين عزل الوكيل لـ Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار socket مخصص (مثل Docker بدون root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    لا يقوم السكربت بتركيب `docker.sock` إلا بعد نجاح متطلبات العزل. إذا
    تعذر إكمال إعداد العزل، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
    إلى `off`.

  </Accordion>

  <Accordion title="الأتمتة / CI (بدون تفاعل)">
    عطّل تخصيص pseudo-TTY في Compose باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="ملاحظة أمان للشبكات المشتركة">
    يستخدم `openclaw-cli` القيمة `network_mode: "service:openclaw-gateway"` بحيث يمكن
    لأوامر CLI الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا باعتباره
    حد ثقة مشتركًا. تقوم إعدادات compose بإسقاط `NET_RAW`/`NET_ADMIN` وتمكين
    `no-new-privileges` على `openclaw-cli`.
  </Accordion>

  <Accordion title="الأذونات وEACCES">
    تعمل الصورة باسم المستخدم `node` (uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن bind mounts على المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="إعادات بناء أسرع">
    رتّب Dockerfile بحيث يتم تخزين طبقات التبعيات مؤقتًا. هذا يتجنب إعادة تشغيل
    `pnpm install` ما لم تتغير lockfiles:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="خيارات حاوية للمستخدمين المتقدمين">
    الصورة الافتراضية تركز على الأمان وتعمل كمستخدم `node` غير الجذري. للحصول على
    حاوية أكثر اكتمالًا من حيث الميزات:

    1. **الإبقاء على `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **دمج تبعيات النظام**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **تثبيت متصفحات Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **الإبقاء على تنزيلات المتصفح**: اضبط
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` واستخدم
       `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بدون واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في
    إعدادات Docker أو الإعدادات بدون واجهة، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه والصقه
    مرة أخرى داخل المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة Docker الرئيسية `node:24-bookworm` وتنشر تعليقات توضيحية
    لصور OCI الأساسية تتضمن `org.opencontainers.image.base.name`،
    و`org.opencontainers.image.source`، وغيرها. راجع
    [تعليقات صور OCI التوضيحية](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تعمل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[وقت تشغيل Docker VM](/ar/install/docker-vm-runtime) للاطلاع على خطوات النشر المشتركة على VM
بما في ذلك دمج الـ binary داخل الصورة، والاستمرارية، والتحديثات.

## عزل الوكيل

عند تمكين `agents.defaults.sandbox` مع الواجهة الخلفية Docker، يقوم Gateway
بتشغيل تنفيذ أدوات الوكيل (shell، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. وهذا يمنحك جدارًا صلبًا
حول جلسات الوكيل غير الموثوقة أو متعددة المستأجرين من دون وضع Gateway بالكامل داخل
حاوية.

يمكن أن يكون نطاق العزل لكل وكيل (الافتراضي)، أو لكل جلسة، أو مشتركًا. ويحصل كل
نطاق على مساحة عمل خاصة به مركبة عند `/workspace`. كما يمكنك أيضًا تكوين
سياسات السماح/المنع للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات
المتصفح.

للاطلاع على الإعداد الكامل، والصور، وملاحظات الأمان، وملفات الوكلاء المتعددة، راجع:

- [العزل](/ar/gateway/sandboxing) -- المرجع الكامل للعزل
- [OpenShell](/ar/gateway/openshell) -- وصول shell تفاعلي إلى حاويات العزل
- [العزل والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

### تمكين سريع

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

ابنِ صورة العزل الافتراضية:

```bash
scripts/sandbox-setup.sh
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو أن حاوية العزل لا تبدأ">
    ابنِ صورة العزل باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    يتم إنشاء الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في العزل">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المركبة لديك،
    أو غيّر ملكية مجلد مساحة العمل.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في العزل">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (login shell)، والذي يحمّل
    `/etc/profile` وقد يعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة
    مسارات الأدوات المخصصة في البداية، أو أضف سكربتًا تحت `/etc/profile.d/` في Dockerfile لديك.
  </Accordion>

  <Accordion title="تم إنهاء البناء بسبب OOM (الخروج 137)">
    تحتاج VM إلى 2 غيغابايت RAM على الأقل. استخدم فئة جهاز أكبر وأعد المحاولة.
  </Accordion>

  <Accordion title="Unauthorized أو pairing required في Control UI">
    اجلب رابط Dashboard جديدًا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    مزيد من التفاصيل: [Dashboard](/web/dashboard)، [الأجهزة](/cli/devices).

  </Accordion>

  <Accordion title="يعرض هدف Gateway القيمة ws://172.x.x.x أو تظهر أخطاء pairing من Docker CLI">
    أعد ضبط وضع Gateway وbind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [Podman](/ar/install/podman) — بديل Podman لـ Docker
- [ClawDock](/ar/install/clawdock) — إعداد Docker Compose من المجتمع
- [التحديث](/ar/install/updating) — الحفاظ على OpenClaw محدثًا
- [الإعدادات](/ar/gateway/configuration) — إعدادات Gateway بعد التثبيت
