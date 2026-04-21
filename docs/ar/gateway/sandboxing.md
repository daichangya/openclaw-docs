---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'كيف تعمل آلية العزل في OpenClaw: الأوضاع، والنطاقات، والوصول إلى مساحة العمل، والصور'
title: العزل
x-i18n:
    generated_at: "2026-04-21T07:20:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# العزل

يمكن لـ OpenClaw تشغيل **الأدوات داخل واجهات عزل خلفية** لتقليل نطاق الضرر.
وهذا **اختياري** وتتحكم فيه الإعدادات (`agents.defaults.sandbox` أو
`agents.list[].sandbox`). إذا كان العزل معطّلًا، تعمل الأدوات على المضيف.
يبقى Gateway على المضيف؛ ويعمل تنفيذ الأدوات داخل بيئة عزل منفصلة
عند التمكين.

هذا ليس حدًا أمنيًا مثاليًا، لكنه يحدّ فعليًا من الوصول إلى نظام الملفات
والعمليات عندما يفعل النموذج شيئًا أحمق.

## ما الذي يتم عزله

- تنفيذ الأدوات (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`، وغيرها).
- متصفح اختياري معزول (`agents.defaults.sandbox.browser`).
  - افتراضيًا، يبدأ متصفح العزل تلقائيًا (لضمان إمكانية الوصول إلى CDP) عندما تحتاجه أداة المتصفح.
    اضبط ذلك عبر `agents.defaults.sandbox.browser.autoStart` و`agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - افتراضيًا، تستخدم حاويات متصفح العزل شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من الشبكة العامة `bridge`.
    اضبط ذلك عبر `agents.defaults.sandbox.browser.network`.
  - يقيّد الخيار الاختياري `agents.defaults.sandbox.browser.cdpSourceRange` دخول CDP عند حافة الحاوية باستخدام قائمة سماح CIDR (مثلًا `172.21.0.1/32`).
  - يكون وصول المراقبة عبر noVNC محميًا بكلمة مرور افتراضيًا؛ ويصدر OpenClaw عنوان URL لرمز قصير العمر يعرض صفحة bootstrap محلية ويفتح noVNC مع كلمة المرور في جزء URL بعد `#` (وليس في سجلات الاستعلام/الرؤوس).
  - يتيح `agents.defaults.sandbox.browser.allowHostControl` للجلسات المعزولة استهداف متصفح المضيف صراحةً.
  - تتحكم قوائم السماح الاختيارية في `target: "custom"`: ‏`allowedControlUrls` و`allowedControlHosts` و`allowedControlPorts`.

غير معزول:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحةً بالعمل خارج العزل (مثل `tools.elevated`).
  - **يتجاوز exec المرتفع العزل ويستخدم مسار الهروب المهيأ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).**
  - إذا كان العزل معطّلًا، فلن يغيّر `tools.elevated` التنفيذ (إذ يكون أصلًا على المضيف). راجع [الوضع المرتفع](/ar/tools/elevated).

## الأوضاع

يتحكم `agents.defaults.sandbox.mode` في **وقت** استخدام العزل:

- `"off"`: بدون عزل.
- `"non-main"`: يعزل فقط الجلسات **غير الرئيسية** (الافتراضي إذا كنت تريد الدردشات العادية على المضيف).
- `"all"`: تعمل كل جلسة داخل عزل.
  ملاحظة: يعتمد `"non-main"` على `session.mainKey` (والافتراضي `"main"`)، وليس على معرّف الوكيل.
  تستخدم جلسات المجموعات/القنوات مفاتيحها الخاصة، لذلك تُعد غير رئيسية وسيتم عزلها.

## النطاق

يتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي يتم إنشاؤها:

- `"agent"` (الافتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة مشتركة بين جميع الجلسات المعزولة.

## الواجهة الخلفية

يتحكم `agents.defaults.sandbox.backend` في **بيئة التشغيل** التي توفّر العزل:

- `"docker"` (الافتراضي عند تمكين العزل): بيئة عزل محلية مدعومة بـ Docker.
- `"ssh"`: بيئة عزل بعيدة عامة مدعومة بـ SSH.
- `"openshell"`: بيئة عزل مدعومة بـ OpenShell.

توجد إعدادات SSH الخاصة تحت `agents.defaults.sandbox.ssh`.
وتوجد إعدادات OpenShell الخاصة تحت `plugins.entries.openshell.config`.

### اختيار واجهة خلفية

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**   | حاوية محلية                      | أي مضيف يمكن الوصول إليه عبر SSH | بيئة عزل مُدارة بواسطة OpenShell                    |
| **الإعداد**         | `scripts/sandbox-setup.sh`       | مفتاح SSH + المضيف الهدف       | Plugin OpenShell مفعّل                              |
| **نموذج مساحة العمل** | ربط تحميل أو نسخ                | بعيد-معتمد أساسيًا (بذر مرة واحدة) | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` (الافتراضي: none) | يعتمد على المضيف البعيد        | يعتمد على OpenShell                                 |
| **عزل المتصفح**     | مدعوم                            | غير مدعوم                      | غير مدعوم بعد                                       |
| **Bind mounts**     | `docker.binds`                   | غير متاح                       | غير متاح                                            |
| **الأفضل لـ**       | التطوير المحلي، والعزل الكامل     | تفريغ العمل إلى جهاز بعيد      | بيئات عزل بعيدة مُدارة مع مزامنة ثنائية الاتجاه اختيارية |

### واجهة Docker الخلفية

يكون العزل معطّلًا افتراضيًا. إذا فعّلت العزل ولم تختر
واجهة خلفية، يستخدم OpenClaw واجهة Docker الخلفية. فهو ينفّذ الأدوات ومتصفحات العزل
محليًا عبر مقبس Docker daemon ‏(`/var/run/docker.sock`). ويتحدد عزل حاوية العزل
بحسب مساحات الأسماء في Docker.

**قيود Docker-out-of-Docker ‏(DooD)**:
إذا نشرت OpenClaw Gateway نفسه كحاوية Docker، فإنه يدير حاويات العزل الشقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). وهذا يفرض قيدًا محددًا على تعيين المسارات:

- **تتطلب الإعدادات مسارات المضيف**: يجب أن يحتوي إعداد `workspace` في `openclaw.json` على **المسار المطلق الخاص بالمضيف** (مثل `/home/user/.openclaw/workspaces`) وليس مسار حاوية Gateway الداخلي. عندما يطلب OpenClaw من Docker daemon إنشاء عزل، يقيّم daemon المسارات بالنسبة إلى مساحة أسماء نظام تشغيل المضيف، وليس مساحة أسماء Gateway.
- **تكافؤ جسر نظام الملفات (خريطة وحدات تخزين متطابقة)**: تكتب عملية OpenClaw Gateway الأصلية أيضًا ملفات Heartbeat والجسر إلى دليل `workspace`. ولأن Gateway يقيّم السلسلة نفسها تمامًا (مسار المضيف) من داخل بيئته المحوّاة الخاصة، فيجب أن يتضمن نشر Gateway خريطة وحدات تخزين متطابقة تربط مساحة أسماء المضيف أصلًا (`-v /home/user/.openclaw:/home/user/.openclaw`).

إذا قمت بتعيين المسارات داخليًا من دون تكافؤ مطلق مع المضيف، فسيرمي OpenClaw أصلًا خطأ صلاحيات `EACCES` عند محاولة كتابة Heartbeat داخل بيئة الحاوية لأن سلسلة المسار المؤهلة بالكامل غير موجودة أصلًا.

### واجهة SSH الخلفية

استخدم `backend: "ssh"` عندما تريد أن يعزل OpenClaw أوامر `exec` وأدوات الملفات وقراءات الوسائط على
أي جهاز يمكن الوصول إليه عبر SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // أو استخدم SecretRefs / محتويات مضمنة بدلًا من الملفات المحلية:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

كيف يعمل ذلك:

- ينشئ OpenClaw جذرًا بعيدًا لكل نطاق تحت `sandbox.ssh.workspaceRoot`.
- عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يبذر OpenClaw مساحة العمل البعيدة هذه من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` وقراءات وسائط المطالبة وتجهيز الوسائط الواردة مباشرةً على مساحة العمل البعيدة عبر SSH.
- لا يزامن OpenClaw التغييرات البعيدة إلى مساحة العمل المحلية تلقائيًا.

مواد المصادقة:

- `identityFile` و`certificateFile` و`knownHostsFile`: استخدم ملفات محلية موجودة ومرّرها عبر إعداد OpenSSH.
- `identityData` و`certificateData` و`knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يحل OpenClaw هذه القيم عبر اللقطة العادية لوقت تشغيل الأسرار، ويكتبها في ملفات مؤقتة بتصريح `0600`، ويحذفها عند انتهاء جلسة SSH.
- إذا تم ضبط كل من `*File` و`*Data` للعنصر نفسه، فإن `*Data` تتغلب في تلك الجلسة من SSH.

هذا نموذج **بعيد-معتمد أساسيًا**. تصبح مساحة عمل SSH البعيدة هي الحالة الحقيقية للعزل بعد البذر الأولي.

نتائج مهمة:

- التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw بعد خطوة البذر لا تكون مرئية عن بُعد حتى تعيد إنشاء العزل.
- يحذف `openclaw sandbox recreate` الجذر البعيد لكل نطاق ثم يعيد البذر من المحلي عند الاستخدام التالي.
- عزل المتصفح غير مدعوم على واجهة SSH الخلفية.
- لا تنطبق إعدادات `sandbox.docker.*` على واجهة SSH الخلفية.

### واجهة OpenShell الخلفية

استخدم `backend: "openshell"` عندما تريد أن يعزل OpenClaw الأدوات في
بيئة بعيدة مُدارة بواسطة OpenShell. للاطلاع على دليل الإعداد الكامل ومرجع
الإعدادات ومقارنة أوضاع مساحة العمل، راجع
[صفحة OpenShell](/ar/gateway/openshell).

يعيد OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد نفسه الموجودين في
واجهة SSH الخلفية العامة، ويضيف دورة حياة خاصة بـ OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) بالإضافة إلى وضع مساحة العمل الاختياري `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

أوضاع OpenShell:

- `mirror` (الافتراضي): تبقى مساحة العمل المحلية هي المعتمدة أساسيًا. يزامن OpenClaw الملفات المحلية إلى OpenShell قبل exec ويزامن مساحة العمل البعيدة مرة أخرى بعد exec.
- `remote`: تصبح مساحة عمل OpenShell هي المعتمدة أساسيًا بعد إنشاء العزل. يبذر OpenClaw مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية، ثم تعمل أدوات الملفات وexec مباشرةً على العزل البعيد من دون مزامنة التغييرات عودةً.

تفاصيل النقل البعيد:

- يطلب OpenClaw من OpenShell إعداد SSH خاصًا بالعزل عبر `openshell sandbox ssh-config <name>`.
- يكتب القلب هذا الإعداد في ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم مع `backend: "ssh"`.
- يختلف الأمر فقط في وضع `mirror` من حيث دورة الحياة: مزامنة من المحلي إلى البعيد قبل exec، ثم مزامنة عكسية بعد exec.

القيود الحالية لـ OpenShell:

- متصفح العزل غير مدعوم بعد
- `sandbox.docker.binds` غير مدعوم على واجهة OpenShell الخلفية
- لا تزال مفاتيح وقت التشغيل الخاصة بـ Docker تحت `sandbox.docker.*` تنطبق فقط على واجهة Docker الخلفية

#### أوضاع مساحة العمل

لدى OpenShell نموذجان لمساحة العمل. وهذا هو الجزء الأهم عمليًا.

##### `mirror`

استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد **أن تبقى مساحة العمل المحلية هي المعتمدة أساسيًا**.

السلوك:

- قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى عزل OpenShell.
- بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
- لا تزال أدوات الملفات تعمل عبر جسر العزل، لكن تبقى مساحة العمل المحلية مصدر الحقيقة بين الجولات.

استخدم هذا عندما:

- تعدّل الملفات محليًا خارج OpenClaw وتريد أن تظهر هذه التغييرات في العزل تلقائيًا
- تريد أن يتصرف عزل OpenShell بأكبر قدر ممكن مثل واجهة Docker الخلفية
- تريد أن تعكس مساحة عمل المضيف عمليات الكتابة في العزل بعد كل جولة exec

المقايضة:

- تكلفة مزامنة إضافية قبل exec وبعده

##### `remote`

استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد **أن تصبح مساحة عمل OpenShell هي المعتمدة أساسيًا**.

السلوك:

- عند إنشاء العزل لأول مرة، يقوم OpenClaw ببذر مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرةً على مساحة عمل OpenShell البعيدة.
- لا يقوم OpenClaw **بمزامنة** التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية بعد exec.
- لا تزال قراءات الوسائط وقت المطالبة تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر العزل بدلًا من افتراض مسار محلي على المضيف.
- يكون النقل عبر SSH إلى عزل OpenShell الذي يعيده `openshell sandbox ssh-config`.

نتائج مهمة:

- إذا عدّلت الملفات على المضيف خارج OpenClaw بعد خطوة البذر، فلن يرى العزل البعيد **تلك التغييرات تلقائيًا**.
- إذا أُعيد إنشاء العزل، فستُبذر مساحة العمل البعيدة من مساحة العمل المحلية مرة أخرى.
- مع `scope: "agent"` أو `scope: "shared"`، تتم مشاركة مساحة العمل البعيدة هذه على ذلك النطاق نفسه.

استخدم هذا عندما:

- ينبغي أن تعيش بيئة العزل أساسًا على جانب OpenShell البعيد
- تريد تقليل كلفة المزامنة لكل جولة
- لا تريد أن تؤدي التعديلات المحلية على المضيف إلى الكتابة فوق حالة العزل البعيدة بصمت

اختر `mirror` إذا كنت تعتبر العزل بيئة تنفيذ مؤقتة.
واختر `remote` إذا كنت تعتبر العزل مساحة العمل الحقيقية.

#### دورة حياة OpenShell

لا تزال بيئات عزل OpenShell تُدار عبر دورة حياة العزل العادية:

- يُظهر `openclaw sandbox list` بيئات تشغيل OpenShell إضافةً إلى بيئات تشغيل Docker
- يحذف `openclaw sandbox recreate` بيئة التشغيل الحالية ويجعل OpenClaw يعيد إنشاءها عند الاستخدام التالي
- كما أن منطق التنظيف aware بالواجهة الخلفية أيضًا

بالنسبة إلى وضع `remote`، تكون إعادة الإنشاء مهمة بشكل خاص:

- تؤدي إعادة الإنشاء إلى حذف مساحة العمل البعيدة المعتمدة لذلك النطاق
- ويقوم الاستخدام التالي ببذر مساحة عمل بعيدة جديدة من مساحة العمل المحلية

أما بالنسبة إلى وضع `mirror`، فإن إعادة الإنشاء تعيد أساسًا ضبط بيئة التنفيذ البعيدة
لأن مساحة العمل المحلية تبقى هي المعتمدة على أي حال.

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` في **ما الذي يمكن أن يراه العزل**:

- `"none"` (الافتراضي): ترى الأدوات مساحة عمل معزولة تحت `~/.openclaw/sandboxes`.
- `"ro"`: يربط مساحة عمل الوكيل للقراءة فقط عند `/agent` (ويعطّل `write` و`edit` و`apply_patch`).
- `"rw"`: يربط مساحة عمل الوكيل للقراءة والكتابة عند `/workspace`.

مع واجهة OpenShell الخلفية:

- لا يزال وضع `mirror` يستخدم مساحة العمل المحلية كمصدر معتمد بين جولات exec
- يستخدم وضع `remote` مساحة عمل OpenShell البعيدة كمصدر معتمد بعد البذر الأولي
- لا يزال `workspaceAccess: "ro"` و`"none"` يقيّدان سلوك الكتابة بالطريقة نفسها

يتم نسخ الوسائط الواردة إلى مساحة العمل المعزولة النشطة (`media/inbound/*`).
ملاحظة Skills: أداة `read` تكون مؤصلة إلى جذر العزل. ومع `workspaceAccess: "none"`،
يقوم OpenClaw بعكس Skills المؤهلة إلى مساحة العمل المعزولة (`.../skills`) بحيث
يمكن قراءتها. ومع `"rw"`، يمكن قراءة Skills الخاصة بمساحة العمل من
`/workspace/skills`.

## Bind mounts مخصصة

يقوم `agents.defaults.sandbox.docker.binds` بربط أدلة مضيف إضافية داخل الحاوية.
الصيغة: `host:container:mode` (مثل `"/home/user/source:/source:rw"`).

يتم **دمج** عمليات الربط العامة وتلك الخاصة بكل وكيل (ولا يتم استبدالها). وتحت `scope: "shared"`، يتم تجاهل عمليات الربط الخاصة بكل وكيل.

يقوم `agents.defaults.sandbox.browser.binds` بربط أدلة مضيف إضافية داخل حاوية **متصفح العزل** فقط.

- عند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `agents.defaults.sandbox.docker.binds` لحاوية المتصفح.
- وعند حذفه، تعود حاوية المتصفح إلى `agents.defaults.sandbox.docker.binds` (توافق مع الإصدارات السابقة).

مثال (مصدر للقراءة فقط + دليل بيانات إضافي):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

ملاحظات أمنية:

- تتجاوز عمليات الربط نظام ملفات العزل: فهي تعرض مسارات المضيف بالنمط الذي تعيّنه (`:ro` أو `:rw`).
- يحظر OpenClaw مصادر الربط الخطرة (مثل: `docker.sock` و`/etc` و`/proc` و`/sys` و`/dev` وعمليات الربط الأصلية التي قد تكشفها).
- كما يحظر OpenClaw جذور بيانات الاعتماد الشائعة في الدليل المنزلي مثل `~/.aws` و`~/.cargo` و`~/.config` و`~/.docker` و`~/.gnupg` و`~/.netrc` و`~/.npm` و`~/.ssh`.
- لا يقتصر التحقق من عمليات الربط على مطابقة السلاسل. بل يقوم OpenClaw بتطبيع مسار المصدر، ثم يحلّه مرة أخرى عبر أعمق سلف موجود قبل إعادة التحقق من المسارات المحظورة والجذور المسموح بها.
- وهذا يعني أن محاولات الهروب عبر symlink-parent لا تزال تُغلَق افتراضيًا حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: لا يزال `/workspace/run-link/new-file` يُحل كـ `/var/run/...` إذا كان `run-link` يشير إلى هناك.
- يتم أيضًا تحويل الجذور المسموح بها إلى الشكل القياسي نفسه، لذا فإن المسار الذي يبدو فقط داخل قائمة السماح قبل حلّ الرابط الرمزي سيُرفَض أيضًا باعتباره `outside allowed roots`.
- يجب أن تكون عمليات الربط الحساسة (الأسرار، ومفاتيح SSH، وبيانات اعتماد الخدمات) بنمط `:ro` ما لم يكن غير ذلك مطلوبًا تمامًا.
- اجمع ذلك مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى الوصول للقراءة إلى مساحة العمل؛ وتبقى أوضاع الربط مستقلة.
- راجع [العزل مقابل سياسة الأدوات مقابل الوضع المرتفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل عمليات الربط مع سياسة الأدوات وexec المرتفع.

## الصور + الإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

قم ببنائها مرة واحدة:

```bash
scripts/sandbox-setup.sh
```

ملاحظة: لا تتضمن الصورة الافتراضية Node. إذا كانت إحدى Skills تحتاج إلى Node (أو
بيئات تشغيل أخرى)، فإما أن تُنشئ صورة مخصصة أو تثبّت ذلك عبر
`sandbox.docker.setupCommand` (يتطلب خروج شبكة + جذرًا قابلًا للكتابة +
مستخدم root).

إذا كنت تريد صورة عزل أكثر عملية مع أدوات شائعة (مثل
`curl` و`jq` و`nodejs` و`python3` و`git`)، فقم ببناء:

```bash
scripts/sandbox-common-setup.sh
```

ثم اضبط `agents.defaults.sandbox.docker.image` إلى
`openclaw-sandbox-common:bookworm-slim`.

صورة متصفح العزل:

```bash
scripts/sandbox-browser-setup.sh
```

افتراضيًا، تعمل حاويات عزل Docker **من دون شبكة**.
يمكنك تجاوز ذلك عبر `agents.defaults.sandbox.docker.network`.

تطبق صورة متصفح العزل المضمّنة أيضًا إعدادات Chromium افتراضية متحفظة
لأعباء العمل داخل الحاويات. وتتضمن الإعدادات الافتراضية الحالية للحاوية:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` و`--disable-setuid-sandbox` عندما يكون `noSandbox` مفعّلًا.
- تكون علامات تقوية الرسوميات الثلاث (`--disable-3d-apis`,
  و`--disable-software-rasterizer` و`--disable-gpu`) اختيارية، وهي مفيدة
  عندما تفتقر الحاويات إلى دعم GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  إذا كان حمل العمل لديك يتطلب WebGL أو ميزات ثلاثية الأبعاد/متصفح أخرى.
- يتم تمكين `--disable-extensions` افتراضيًا ويمكن تعطيله عبر
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للتدفقات التي تعتمد على الإضافات.
- يتم التحكم في `--renderer-process-limit=2` عبر
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`، حيث تبقي القيمة `0` افتراضي Chromium نفسه.

إذا كنت تحتاج إلى ملف تعريف تشغيل مختلف، فاستخدم صورة متصفح مخصصة ووفّر
entrypoint خاصًا بك. أما بالنسبة إلى ملفات تعريف Chromium المحلية (غير الحاوية)، فاستخدم
`browser.extraArgs` لإلحاق علامات بدء تشغيل إضافية.

الإعدادات الأمنية الافتراضية:

- يتم حظر `network: "host"`.
- يتم حظر `network: "container:<id>"` افتراضيًا (بسبب خطر تجاوز الانضمام إلى مساحة الاسم).
- تجاوز طارئ: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

توجد تثبيتات Docker وGateway المعبأ في حاويات هنا:
[Docker](/ar/install/docker)

بالنسبة إلى عمليات نشر Gateway عبر Docker، يمكن لـ `scripts/docker/setup.sh` تهيئة إعدادات العزل.
اضبط `OPENCLAW_SANDBOX=1` (أو `true`/`yes`/`on`) لتمكين هذا المسار. ويمكنك
تجاوز موقع المقبس عبر `OPENCLAW_DOCKER_SOCKET`. مرجع الإعداد الكامل والمتغيرات البيئية:
[Docker](/ar/install/docker#agent-sandbox).

## setupCommand (إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية العزل (وليس في كل تشغيل).
ويتم تنفيذه داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

العثرات الشائعة:

- القيمة الافتراضية لـ `docker.network` هي `"none"` (من دون خروج شبكة)، لذا ستفشل تثبيتات الحزم.
- يتطلب `docker.network: "container:<id>"` تعيين `dangerouslyAllowContainerNamespaceJoin: true` وهو مخصص فقط لحالات الطوارئ.
- يمنع `readOnlyRoot: true` عمليات الكتابة؛ اضبط `readOnlyRoot: false` أو أنشئ صورة مخصصة.
- يجب أن يكون `user` هو root لتثبيت الحزم (احذف `user` أو اضبط `user: "0:0"`).
- لا يرث exec المعزول `process.env` الخاص بالمضيف. استخدم
  `agents.defaults.sandbox.docker.env` (أو صورة مخصصة) لمفاتيح API الخاصة بالـ Skills.

## سياسة الأدوات + منافذ الهروب

لا تزال سياسات السماح/المنع الخاصة بالأدوات تُطبّق قبل قواعد العزل. فإذا كانت أداة ما محظورة
عالميًا أو لكل وكيل، فلن يعيدها العزل.

يمثل `tools.elevated` منفذ هروب صريحًا يشغّل `exec` خارج العزل (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).
لا تنطبق توجيهات `/exec` إلا على المُرسلين المخولين وتستمر لكل جلسة؛ ولتعطيل
`exec` تعطيلًا صارمًا، استخدم المنع عبر سياسة الأدوات (راجع [العزل مقابل سياسة الأدوات مقابل الوضع المرتفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

تصحيح الأخطاء:

- استخدم `openclaw sandbox explain` لفحص وضع العزل الفعّال، وسياسة الأدوات، ومفاتيح إعدادات الإصلاح.
- راجع [العزل مقابل سياسة الأدوات مقابل الوضع المرتفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لفهم النموذج الذهني لسؤال "لماذا تم حظر هذا؟".
  أبقه مُحكم الإغلاق.

## تجاوزات متعددة الوكلاء

يمكن لكل وكيل تجاوز إعدادات العزل + الأدوات:
`agents.list[].sandbox` و`agents.list[].tools` (بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات العزل).
راجع [العزل والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) لمعرفة الأسبقية.

## مثال تمكين أدنى

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## مستندات ذات صلة

- [OpenShell](/ar/gateway/openshell) -- إعداد الواجهة الخلفية للعزل المُدار، وأوضاع مساحة العمل، ومرجع الإعدادات
- [إعدادات العزل](/ar/gateway/configuration-reference#agentsdefaultssandbox)
- [العزل مقابل سياسة الأدوات مقابل الوضع المرتفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح سؤال "لماذا تم حظر هذا؟"
- [العزل والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- التجاوزات لكل وكيل والأسبقية
- [الأمان](/ar/gateway/security)
