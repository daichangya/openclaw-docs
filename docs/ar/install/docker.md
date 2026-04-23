---
read_when:
    - تريد Gateway معتمدًا على الحاويات بدلًا من التثبيتات المحلية
    - أنت تتحقق من تدفق Docker
summary: إعداد وتهيئة OpenClaw اختياريًا باستخدام Docker
title: Docker
x-i18n:
    generated_at: "2026-04-23T07:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (اختياري)

Docker **اختياري**. استخدمه فقط إذا كنت تريد Gateway معتمدًا على الحاويات أو التحقق من تدفق Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة وسهلة التخلص منها أو تريد تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: أنت تعمل على جهازك الشخصي وتريد فقط أسرع دورة تطوير. استخدم تدفق التثبيت العادي بدلًا من ذلك.
- **ملاحظة حول العزل**: تستخدم الواجهة الخلفية الافتراضية للعزل Docker عند تمكين العزل، لكن العزل يكون معطّلًا افتراضيًا و**لا** يتطلب تشغيل Gateway بالكامل داخل Docker. كما تتوفر أيضًا الواجهات الخلفية SSH وOpenShell الخاصة بالعزل. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات المسبقة

- Docker Desktop ‏(أو Docker Engine) + Docker Compose v2
- ما لا يقل عن 2 غيغابايت RAM لبناء الصورة (`pnpm install` قد يُقتل بسبب OOM على مضيفين بذاكرة 1 غيغابايت مع الخروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تعمل على VPS/مضيف عام، فراجع
  [تحصين الأمان للتعرض للشبكة](/ar/gateway/security)،
  وخاصة سياسة جدار الحماية Docker ‏`DOCKER-USER`.

## Gateway معتمد على الحاويات

<Steps>
  <Step title="بناء الصورة">
    من جذر المستودع، شغّل نص الإعداد البرمجي:

    ```bash
    ./scripts/docker/setup.sh
    ```

    يؤدي هذا إلى بناء صورة gateway محليًا. لاستخدام صورة مبنية مسبقًا بدلًا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    يتم نشر الصور المبنية مسبقًا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main` و`latest` و`<version>` ‏(مثل `2026.2.26`).

  </Step>

  <Step title="إكمال التهيئة الأولية">
    يشغّل نص الإعداد البرمجي التهيئة الأولية تلقائيًا. وسيقوم بما يلي:

    - طلب مفاتيح API الخاصة بالمزوّد
    - إنشاء رمز Gateway وكتابته إلى `.env`
    - بدء gateway عبر Docker Compose

    أثناء الإعداد، يتم تنفيذ التهيئة الأولية قبل البدء وعمليات كتابة الإعدادات من خلال
    `openclaw-gateway` مباشرةً. أما `openclaw-cli` فهو للأوامر التي تشغّلها بعد
    وجود حاوية gateway بالفعل.

  </Step>

  <Step title="فتح واجهة التحكم">
    افتح `http://127.0.0.1:18789/` في browser والصق
    السر المشترك المُعدّ في Settings. يكتب نص الإعداد البرمجي رمزًا إلى `.env` افتراضيًا؛ وإذا بدّلت إعداد الحاوية إلى مصادقة كلمة المرور، فاستخدم كلمة المرور تلك بدلًا من ذلك.

    هل تحتاج إلى عنوان URL مرة أخرى؟

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

    المستندات: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)

  </Step>
</Steps>

### التدفق اليدوي

إذا كنت تفضل تشغيل كل خطوة بنفسك بدلًا من استخدام نص الإعداد البرمجي:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
شغّل `docker compose` من جذر المستودع. إذا قمت بتمكين `OPENCLAW_EXTRA_MOUNTS`
أو `OPENCLAW_HOME_VOLUME`، فسيكتب نص الإعداد البرمجي الملف `docker-compose.extra.yml`؛ قم
بتضمينه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
لأن `openclaw-cli` يشارك مساحة اسم الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة ما بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغّل التهيئة الأولية
وكتابات الإعدادات وقت الإعداد من خلال `openclaw-gateway` باستخدام
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل نص الإعداد البرمجي متغيرات البيئة الاختيارية التالية:

| المتغير                       | الغرض                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | استخدام صورة بعيدة بدلًا من البناء محليًا                  |
| `OPENCLAW_DOCKER_APT_PACKAGES` | تثبيت حزم apt إضافية أثناء البناء (أسماء مفصولة بمسافات)       |
| `OPENCLAW_EXTENSIONS`          | تثبيت تبعيات Plugin مسبقًا وقت البناء (أسماء مفصولة بمسافات)   |
| `OPENCLAW_EXTRA_MOUNTS`        | ربط mountات مضيف إضافية (مفصولة بفواصل بصيغة `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | الإبقاء على `/home/node` في Docker volume مُسمى                   |
| `OPENCLAW_SANDBOX`             | التفعيل الاختياري لتمهيد العزل (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`       | تجاوز مسار Docker socket                                     |

### فحوصات السلامة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # الحيوية
curl -fsS http://127.0.0.1:18789/readyz     # الجاهزية
```

تتضمن صورة Docker عنصر `HEALTHCHECK` مدمجًا يقوم بإرسال ping إلى `/healthz`.
إذا استمرت الفحوصات في الفشل، يضع Docker علامة `unhealthy` على الحاوية،
ويمكن لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة سلامة عميقة موثقة:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يفترض `scripts/docker/setup.sh` القيمة `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل الوصول من المضيف إلى
`http://127.0.0.1:18789` مع نشر منافذ Docker.

- `lan` (الافتراضي): يمكن لـ browser المضيف وCLI المضيف الوصول إلى منفذ gateway المنشور.
- `loopback`: لا يمكن سوى للعمليات داخل مساحة اسم شبكة الحاوية الوصول
  مباشرة إلى gateway.

<Note>
استخدم قيم وضع الربط في `gateway.bind` ‏(`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس الأسماء المستعارة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### التخزين والاستمرارية

يقوم Docker Compose بربط mount لـ `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، بحيث تبقى هذه المسارات
بعد استبدال الحاوية.

ذلك الدليل المربوط للإعدادات هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key الخاصة بالمزوّد المخزنة
- `.env` للأسرار وقت التشغيل المدعومة بـ env مثل `OPENCLAW_GATEWAY_TOKEN`

للحصول على التفاصيل الكاملة للاستمرارية في نشرات VM، راجع
[Docker VM Runtime - ما الذي يبقى وأين](/ar/install/docker-vm-runtime#what-persists-where).

**النقاط الساخنة لنمو القرص:** راقب `media/`، وملفات JSONL الخاصة بالجلسات، و`cron/runs/*.jsonl`،
وسجلات الملفات الدوارة تحت `/tmp/openclaw/`.

### مساعدات shell ‏(اختياري)

لتسهيل إدارة Docker اليومية، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت `ClawDock` من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي لديك الموقع الجديد.

ثم استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard` وغير ذلك. شغّل
`clawdock-help` لعرض جميع الأوامر.
راجع [ClawDock](/ar/install/clawdock) للحصول على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="تمكين عزل الوكيل لـ Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار socket مخصص (مثل Docker دون root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    لا يقوم النص البرمجي بربط `docker.sock` إلا بعد نجاح المتطلبات المسبقة للعزل. وإذا
    تعذر إكمال إعداد العزل، يعيد النص البرمجي تعيين `agents.defaults.sandbox.mode`
    إلى `off`.

  </Accordion>

  <Accordion title="الأتمتة / CI (غير تفاعلي)">
    عطّل تخصيص Compose pseudo-TTY باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="ملاحظة أمان للشبكة المشتركة">
    يستخدم `openclaw-cli` القيمة `network_mode: "service:openclaw-gateway"` بحيث يمكن
    لأوامر CLI الوصول إلى gateway عبر `127.0.0.1`. تعامل مع هذا على أنه
    حد ثقة مشترك. يقوم إعداد compose بإسقاط `NET_RAW`/`NET_ADMIN` وتمكين
    `no-new-privileges` على `openclaw-cli`.
  </Accordion>

  <Accordion title="الأذونات وEACCES">
    تعمل الصورة كمستخدم `node` ‏(uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن bind mounts الخاصة بالمضيف مملوكة للمعرّف uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="إعادة بناء أسرع">
    رتّب Dockerfile بحيث تُخزَّن طبقات التبعيات مؤقتًا. هذا يتجنب إعادة تشغيل
    `pnpm install` ما لم تتغير ملفات القفل:

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

  <Accordion title="خيارات الحاوية للمستخدمين المتقدمين">
    الصورة الافتراضية تركّز على الأمان وتعمل كمستخدم `node` غير root. للحصول على
    حاوية أكثر اكتمالًا من حيث الميزات:

    1. **الإبقاء على `/home/node`**: ‏`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين تبعيات النظام**: ‏`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **تثبيت متصفحات Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **الإبقاء على تنزيلات browser**: اضبط
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` واستخدم
       `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth ‏(Docker بلا واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في browser. في
    إعدادات Docker أو البيئات عديمة الواجهة، انسخ عنوان URL الكامل الخاص بإعادة التوجيه الذي وصلت إليه والصقه
    مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة Docker الرئيسية `node:24-bookworm` وتنشر
    تعليقات OCI التوضيحية الخاصة بالصورة الأساسية بما في ذلك `org.opencontainers.image.base.name`,
    و`org.opencontainers.image.source`، وغيرها. راجع
    [تعليقات OCI التوضيحية للصور](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تعمل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[Docker VM Runtime](/ar/install/docker-vm-runtime) للحصول على خطوات النشر على VM المشتركة
بما في ذلك تضمين الملفات الثنائية، والاستمرارية، والتحديثات.

## عزل الوكيل

عندما يتم تمكين `agents.defaults.sandbox` باستخدام الواجهة الخلفية Docker، يقوم gateway
بتشغيل تنفيذ أدوات الوكيل (shell، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى gateway نفسه على المضيف. يمنحك هذا جدارًا صلبًا
حول جلسات الوكيل غير الموثوقة أو متعددة المستأجرين من دون تحويل gateway بالكامل إلى حاوية.

يمكن أن يكون نطاق العزل لكل وكيل (الافتراضي)، أو لكل جلسة، أو مشتركًا. ويحصل كل نطاق
على مساحة عمل خاصة به تُربط عند `/workspace`. ويمكنك أيضًا تكوين
سياسات السماح/المنع للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات
browser.

للحصول على الإعداد الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددة، راجع:

- [العزل](/ar/gateway/sandboxing) -- المرجع الكامل للعزل
- [OpenShell](/ar/gateway/openshell) -- وصول shell تفاعلي إلى حاويات العزل
- [عزل متعدد الوكلاء والأدوات](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

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
  <Accordion title="الصورة مفقودة أو حاوية العزل لا تبدأ">
    ابنِ صورة العزل باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    يتم إنشاء الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء أذونات في العزل">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المربوطة،
    أو غيّر ملكية مجلد مساحة العمل.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في العزل">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` ‏(login shell)، والذي يقوم بتحميل
    `/etc/profile` وقد يعيد تعيين PATH. اضبط `docker.env.PATH` لإضافة
    مسارات أدواتك المخصصة في البداية، أو أضف سكربتًا تحت `/etc/profile.d/` في Dockerfile الخاص بك.
  </Accordion>

  <Accordion title="تم القتل بسبب OOM أثناء بناء الصورة (الخروج 137)">
    تحتاج VM إلى ما لا يقل عن 2 غيغابايت RAM. استخدم فئة جهاز أكبر ثم أعد المحاولة.
  </Accordion>

  <Accordion title="Unauthorized أو يلزم الاقتران في Control UI">
    اجلب رابط dashboard جديدًا ووافق على جهاز browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    مزيد من التفاصيل: [Dashboard](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

  </Accordion>

  <Accordion title="يعرض هدف Gateway القيمة ws://172.x.x.x أو تظهر أخطاء اقتران من Docker CLI">
    أعد تعيين وضع gateway والربط:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [Podman](/ar/install/podman) — بديل Podman لـ Docker
- [ClawDock](/ar/install/clawdock) — إعداد مجتمعي لـ Docker Compose
- [التحديث](/ar/install/updating) — الحفاظ على OpenClaw محدّثًا
- [الإعدادات](/ar/gateway/configuration) — إعدادات gateway بعد التثبيت
