---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'كيف يعمل العزل في OpenClaw: الأوضاع، والنطاقات، والوصول إلى مساحة العمل، والصور'
title: العزل
x-i18n:
    generated_at: "2026-04-25T13:48:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

يمكن لـ OpenClaw تشغيل **الأدوات داخل واجهات عزل خلفية** لتقليل نطاق الضرر.
هذا **اختياري** وتتحكم فيه الإعدادات (`agents.defaults.sandbox` أو
`agents.list[].sandbox`). إذا كان العزل معطّلًا، فستعمل الأدوات على المضيف.
تبقى Gateway على المضيف؛ بينما يعمل تنفيذ الأدوات داخل عزل منفصل
عند التمكين.

هذا ليس حدًا أمنيًا مثاليًا، لكنه يقيّد بشكل ملموس الوصول إلى
نظام الملفات والعمليات عندما يقوم النموذج بشيء غير حكيم.

## ما الذي يتم عزله

- تنفيذ الأدوات (`exec` و`read` و`write` و`edit` و`apply_patch` و`process` وغيرها).
- Browser معزول اختياري (`agents.defaults.sandbox.browser`).
  - افتراضيًا، يبدأ Browser الخاص بالعزل تلقائيًا (لضمان أن CDP يمكن الوصول إليه) عندما تحتاجه أداة Browser.
    اضبط ذلك عبر `agents.defaults.sandbox.browser.autoStart` و`agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - افتراضيًا، تستخدم حاويات Browser الخاصة بالعزل شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من شبكة `bridge` العامة.
    اضبط ذلك باستخدام `agents.defaults.sandbox.browser.network`.
  - يقيّد `agents.defaults.sandbox.browser.cdpSourceRange` الاختياري دخول CDP على حافة الحاوية عبر قائمة سماح CIDR (مثل `172.21.0.1/32`).
  - يكون وصول مراقب noVNC محميًا بكلمة مرور افتراضيًا؛ ويصدر OpenClaw عنوان URL قصير العمر لرمز مميز يقدّم صفحة bootstrap محلية ويفتح noVNC مع كلمة المرور في جزء URL fragment (وليس في سجلات query/header).
  - يسمح `agents.defaults.sandbox.browser.allowHostControl` للجلسات المعزولة باستهداف Browser المضيف صراحةً.
  - تتحكم قوائم سماح اختيارية في `target: "custom"`: `allowedControlUrls` و`allowedControlHosts` و`allowedControlPorts`.

غير معزول:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحةً بالعمل خارج العزل (مثل `tools.elevated`).
  - **يتجاوز `exec` المرتفع العزل ويستخدم مسار الهروب المُعدّ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).**
  - إذا كان العزل معطّلًا، فلن يغيّر `tools.elevated` التنفيذ (إذ إنه يعمل أصلًا على المضيف). راجع [الوضع المرتفع](/ar/tools/elevated).

## الأوضاع

يتحكم `agents.defaults.sandbox.mode` في **وقت** استخدام العزل:

- `"off"`: بدون عزل.
- `"non-main"`: يعزل فقط الجلسات **غير الرئيسية** (الافتراضي إذا كنت تريد الدردشات العادية على المضيف).
- `"all"`: تعمل كل جلسة داخل عزل.
  ملاحظة: يعتمد `"non-main"` على `session.mainKey` (الافتراضي `"main"`)، وليس على معرّف الوكيل.
  تستخدم جلسات المجموعات/القنوات مفاتيحها الخاصة، لذا تُعد غير رئيسية وسيتم عزلها.

## النطاق

يتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي يتم إنشاؤها:

- `"agent"` (افتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة مشتركة بين كل الجلسات المعزولة.

## الواجهة الخلفية

يتحكم `agents.defaults.sandbox.backend` في **وقت التشغيل** الذي يوفّر العزل:

- `"docker"` (الافتراضي عند تمكين العزل): وقت تشغيل عزل محلي مدعوم بـ Docker.
- `"ssh"`: وقت تشغيل عزل بعيد عام مدعوم بـ SSH.
- `"openshell"`: وقت تشغيل عزل مدعوم بـ OpenShell.

توجد إعدادات SSH المحددة تحت `agents.defaults.sandbox.ssh`.
وتوجد إعدادات OpenShell المحددة تحت `plugins.entries.openshell.config`.

### اختيار واجهة خلفية

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**   | حاوية محلية                  | أي مضيف يمكن الوصول إليه عبر SSH        | عزل مُدار بواسطة OpenShell                           |
| **الإعداد**           | `scripts/sandbox-setup.sh`       | مفتاح SSH + مضيف مستهدف          | تمكين Plugin الخاص بـ OpenShell                            |
| **نموذج مساحة العمل** | ربط mount أو نسخ               | بعيد-قياسي (تهيئة مرة واحدة)   | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` (الافتراضي: لا شيء) | يعتمد على المضيف البعيد         | يعتمد على OpenShell                                |
| **Browser المعزول** | مدعوم                        | غير مدعوم                  | غير مدعوم بعد                                   |
| **ربط mount**     | `docker.binds`                   | غير متاح                            | غير متاح                                                 |
| **الأفضل لـ**        | التطوير المحلي، العزل الكامل        | النقل إلى جهاز بعيد | بيئات عزل بعيدة مُدارة مع مزامنة ثنائية اختيارية |

### الواجهة الخلفية Docker

يكون العزل معطّلًا افتراضيًا. إذا قمت بتمكين العزل ولم تختر
واجهة خلفية، يستخدم OpenClaw واجهة Docker الخلفية. فهو ينفذ الأدوات وBrowsers العزل
محليًا عبر مقبس Docker daemon (`/var/run/docker.sock`). ويتم تحديد
عزل حاويات العزل بواسطة مساحات أسماء Docker.

**قيود Docker-out-of-Docker (DooD)**:
إذا نشرت Gateway الخاصة بـ OpenClaw نفسها كحاوية Docker، فإنها تنسّق حاويات عزل شقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). ويؤدي ذلك إلى قيد محدد لتعيين المسارات:

- **تتطلب الإعدادات مسارات المضيف**: يجب أن يحتوي إعداد `workspace` في `openclaw.json` على **المسار المطلق للمضيف** (مثل `/home/user/.openclaw/workspaces`)، وليس المسار الداخلي لحاوية Gateway. عندما يطلب OpenClaw من Docker daemon إنشاء عزل، يقيّم daemon المسارات نسبةً إلى مساحة أسماء نظام تشغيل المضيف، وليس إلى مساحة أسماء Gateway.
- **تكافؤ جسر نظام الملفات (خريطة وحدات تخزين متطابقة)**: تقوم العملية الأصلية لـ OpenClaw Gateway أيضًا بكتابة ملفات Heartbeat والجسر إلى دليل `workspace`. ولأن Gateway تقيّم السلسلة نفسها تمامًا (مسار المضيف) من داخل بيئتها الحاوية، فيجب أن يتضمن نشر Gateway خريطة وحدات تخزين متطابقة تربط مساحة أسماء المضيف أصليًا (`-v /home/user/.openclaw:/home/user/.openclaw`).

إذا قمت بتعيين المسارات داخليًا من دون تكافؤ مطلق لمسار المضيف، فسيرمي OpenClaw أصليًا خطأ أذونات `EACCES` عند محاولة كتابة Heartbeat داخل بيئة الحاوية لأن سلسلة المسار المؤهلة بالكامل غير موجودة أصليًا.

### الواجهة الخلفية SSH

استخدم `backend: "ssh"` عندما تريد من OpenClaw عزل `exec` وأدوات الملفات وقراءات الوسائط على
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

كيف يعمل:

- ينشئ OpenClaw جذرًا بعيدًا لكل نطاق تحت `sandbox.ssh.workspaceRoot`.
- عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يهيّئ OpenClaw مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` وقراءات وسائط المطالبة وتجهيز الوسائط الواردة مباشرة مقابل مساحة العمل البعيدة عبر SSH.
- لا يقوم OpenClaw بمزامنة التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية تلقائيًا.

مواد المصادقة:

- `identityFile` و`certificateFile` و`knownHostsFile`: استخدم الملفات المحلية الموجودة ومررها عبر إعدادات OpenSSH.
- `identityData` و`certificateData` و`knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يحللها OpenClaw عبر اللقطة العادية لوقت تشغيل الأسرار، ويكتبها إلى ملفات مؤقتة بأذونات `0600`، ويحذفها عند انتهاء جلسة SSH.
- إذا تم تعيين كل من `*File` و`*Data` للعنصر نفسه، فإن `*Data` تفوز لتلك الجلسة من SSH.

هذا نموذج **بعيد-قياسي**. تصبح مساحة العمل البعيدة عبر SSH هي حالة العزل الحقيقية بعد التهيئة الأولية.

نتائج مهمة:

- التعديلات المحلية على المضيف التي تتم خارج OpenClaw بعد خطوة التهيئة لا تكون مرئية عن بُعد حتى تعيد إنشاء العزل.
- يقوم `openclaw sandbox recreate` بحذف الجذر البعيد لكل نطاق ثم يهيّئه مجددًا من المحلي عند الاستخدام التالي.
- لا يتم دعم Browser المعزول على الواجهة الخلفية SSH.
- لا تنطبق إعدادات `sandbox.docker.*` على الواجهة الخلفية SSH.

### الواجهة الخلفية OpenShell

استخدم `backend: "openshell"` عندما تريد من OpenClaw عزل الأدوات في
بيئة بعيدة مُدارة بواسطة OpenShell. للحصول على دليل الإعداد الكامل، ومرجع
الإعدادات، ومقارنة أوضاع مساحة العمل، راجع صفحة
[OpenShell](/ar/gateway/openshell) المخصصة.

يعيد OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد نفسه مثل
الواجهة الخلفية SSH العامة، ويضيف دورة حياة خاصة بـ OpenShell
(`sandbox create/get/delete`، و`sandbox ssh-config`) بالإضافة إلى وضع مساحة العمل
`mirror` الاختياري.

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

- `mirror` (افتراضي): تبقى مساحة العمل المحلية هي القياسية. يزامن OpenClaw الملفات المحلية إلى OpenShell قبل exec ثم يزامن مساحة العمل البعيدة مرة أخرى بعد exec.
- `remote`: تصبح مساحة عمل OpenShell هي القياسية بعد إنشاء العزل. يهيّئ OpenClaw مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية، ثم تعمل أدوات الملفات وexec مباشرة مقابل العزل البعيد من دون مزامنة التغييرات مرة أخرى.

تفاصيل النقل البعيد:

- يطلب OpenClaw من OpenShell إعداد SSH خاصًا بالعزل عبر `openshell sandbox ssh-config <name>`.
- يكتب Core إعداد SSH هذا إلى ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم بواسطة `backend: "ssh"`.
- في وضع `mirror` فقط تختلف دورة الحياة: مزامنة محلي إلى بعيد قبل exec، ثم مزامنة عكسية بعد exec.

القيود الحالية في OpenShell:

- لا يتم دعم Browser المعزول بعد
- لا يتم دعم `sandbox.docker.binds` على الواجهة الخلفية OpenShell
- لا تزال مقابض وقت التشغيل الخاصة بـ Docker تحت `sandbox.docker.*` تنطبق فقط على الواجهة الخلفية Docker

#### أوضاع مساحة العمل

يحتوي OpenShell على نموذجي مساحة عمل. وهذا هو الجزء الأكثر أهمية عمليًا.

##### `mirror`

استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن **تبقى مساحة العمل المحلية هي القياسية**.

السلوك:

- قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى عزل OpenShell.
- بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
- لا تزال أدوات الملفات تعمل عبر جسر العزل، لكن مساحة العمل المحلية تبقى مصدر الحقيقة بين الأدوار.

استخدم هذا عندما:

- تقوم بتحرير الملفات محليًا خارج OpenClaw وتريد أن تظهر هذه التغييرات في العزل تلقائيًا
- تريد أن يتصرف عزل OpenShell بأكبر قدر ممكن مثل الواجهة الخلفية Docker
- تريد أن تعكس مساحة عمل المضيف كتابات العزل بعد كل دور exec

المقايضة:

- تكلفة مزامنة إضافية قبل exec وبعده

##### `remote`

استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن **تصبح مساحة عمل OpenShell هي القياسية**.

السلوك:

- عند إنشاء العزل لأول مرة، يهيّئ OpenClaw مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرة مقابل مساحة عمل OpenShell البعيدة.
- لا يقوم OpenClaw **بمزامنة** التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية بعد exec.
- لا تزال قراءات الوسائط وقت المطالبة تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر العزل بدلًا من افتراض مسار محلي على المضيف.
- يكون النقل عبر SSH إلى عزل OpenShell الذي يعيده `openshell sandbox ssh-config`.

نتائج مهمة:

- إذا قمت بتحرير الملفات على المضيف خارج OpenClaw بعد خطوة التهيئة، فلن يرى العزل البعيد **تلك التغييرات** تلقائيًا.
- إذا أُعيد إنشاء العزل، فستُهيّأ مساحة العمل البعيدة من مساحة العمل المحلية مرة أخرى.
- مع `scope: "agent"` أو `scope: "shared"`، تتم مشاركة مساحة العمل البعيدة نفسها على ذلك النطاق نفسه.

استخدم هذا عندما:

- ينبغي أن يعيش العزل أساسًا على جانب OpenShell البعيد
- تريد حمل مزامنة أقل لكل دور
- لا تريد أن تؤدي التعديلات المحلية على المضيف إلى استبدال حالة العزل البعيدة بصمت

اختر `mirror` إذا كنت تفكر في العزل باعتباره بيئة تنفيذ مؤقتة.
واختر `remote` إذا كنت تفكر في العزل باعتباره مساحة العمل الحقيقية.

#### دورة حياة OpenShell

لا تزال عزلات OpenShell تُدار عبر دورة حياة العزل العادية:

- يعرض `openclaw sandbox list` أوقات تشغيل OpenShell وكذلك أوقات تشغيل Docker
- يحذف `openclaw sandbox recreate` وقت التشغيل الحالي ويجعل OpenClaw يعيد إنشاءه عند الاستخدام التالي
- كما أن منطق التنظيف الواعي بالواجهة الخلفية موجود أيضًا

بالنسبة إلى وضع `remote`، تكون إعادة الإنشاء مهمة بشكل خاص:

- تؤدي إعادة الإنشاء إلى حذف مساحة العمل البعيدة القياسية لذلك النطاق
- ويؤدي الاستخدام التالي إلى تهيئة مساحة عمل بعيدة جديدة من مساحة العمل المحلية

أما بالنسبة إلى وضع `mirror`، فإن إعادة الإنشاء تعيد أساسًا ضبط بيئة التنفيذ البعيدة
لأن مساحة العمل المحلية تظل هي القياسية على أي حال.

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` في **ما الذي يمكن للعزل رؤيته**:

- `"none"` (افتراضي): ترى الأدوات مساحة عمل عزل تحت `~/.openclaw/sandboxes`.
- `"ro"`: يربط مساحة عمل الوكيل للقراءة فقط عند `/agent` (ويعطّل `write`/`edit`/`apply_patch`).
- `"rw"`: يربط مساحة عمل الوكيل للقراءة والكتابة عند `/workspace`.

مع الواجهة الخلفية OpenShell:

- لا يزال وضع `mirror` يستخدم مساحة العمل المحلية كمصدر قياسي بين أدوار exec
- ويستخدم وضع `remote` مساحة عمل OpenShell البعيدة كمصدر قياسي بعد التهيئة الأولية
- ولا يزال `workspaceAccess: "ro"` و`"none"` يقيّدان سلوك الكتابة بالطريقة نفسها

يتم نسخ الوسائط الواردة إلى مساحة عمل العزل النشطة (`media/inbound/*`).
ملاحظة Skills: تكون أداة `read` متجذرة في العزل. مع `workspaceAccess: "none"`،
يعكس OpenClaw ملفات Skills المؤهلة إلى مساحة عمل العزل (`.../skills`) حتى
يمكن قراءتها. ومع `"rw"`، تصبح Skills مساحة العمل قابلة للقراءة من
`/workspace/skills`.

## ربط mount مخصصة

يقوم `agents.defaults.sandbox.docker.binds` بربط mount لأدلة مضيف إضافية داخل الحاوية.
التنسيق: `host:container:mode` (مثل `"/home/user/source:/source:rw"`).

يتم **دمج** عمليات الربط العامة وتلك الخاصة بكل وكيل (ولا يتم استبدالها). وتحت `scope: "shared"`، يتم تجاهل عمليات الربط الخاصة بكل وكيل.

يقوم `agents.defaults.sandbox.browser.binds` بربط mount لأدلة مضيف إضافية داخل حاوية **Browser المعزول** فقط.

- عند تعيينها (بما في ذلك `[]`)، فإنها تستبدل `agents.defaults.sandbox.docker.binds` لحاوية Browser.
- وعند حذفها، ترجع حاوية Browser إلى `agents.defaults.sandbox.docker.binds` (توافق رجعي).

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

ملاحظات الأمان:

- تتجاوز عمليات الربط نظام ملفات العزل: فهي تكشف مسارات المضيف بالنمط الذي تعيّنه (`:ro` أو `:rw`).
- يمنع OpenClaw مصادر الربط الخطرة (على سبيل المثال: `docker.sock` و`/etc` و`/proc` و`/sys` و`/dev` وعمليات الربط الأصل التي قد تكشفها).
- يمنع OpenClaw أيضًا جذور بيانات الاعتماد الشائعة في الدليل المنزلي مثل `~/.aws` و`~/.cargo` و`~/.config` و`~/.docker` و`~/.gnupg` و`~/.netrc` و`~/.npm` و`~/.ssh`.
- لا يقتصر التحقق من الربط على مطابقة السلاسل النصية. إذ يقوم OpenClaw بتوحيد مسار المصدر، ثم يحلله مرة أخرى عبر أعمق أصل موجود قبل إعادة التحقق من المسارات المحظورة والجذور المسموح بها.
- وهذا يعني أن هروب الأصل عبر الروابط الرمزية ما يزال يُغلق بشكل آمن حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: لا يزال `/workspace/run-link/new-file` يُحل إلى `/var/run/...` إذا كانت `run-link` تشير إلى ذلك.
- يتم توحيد الجذور المصدرية المسموح بها بالطريقة نفسها، لذا فإن المسار الذي يبدو فقط داخل قائمة السماح قبل تحليل الرابط الرمزي سيُرفض أيضًا باعتباره `outside allowed roots`.
- ينبغي أن تكون عمليات الربط الحساسة (الأسرار، ومفاتيح SSH، وبيانات اعتماد الخدمات) بصيغة `:ro` ما لم تكن هناك حاجة مطلقة لغير ذلك.
- اجمعها مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى وصول قراءة إلى مساحة العمل؛ وتظل أوضاع الربط مستقلة.
- راجع [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل عمليات الربط مع سياسة الأدوات وexec المرتفع.

## الصور + الإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

قم ببنائها مرة واحدة:

```bash
scripts/sandbox-setup.sh
```

ملاحظة: لا تتضمن الصورة الافتراضية **Node**. إذا كانت Skill تحتاج إلى Node (أو
أوقات تشغيل أخرى)، فإما أن تدمج صورة مخصصة أو تثبّت عبر
`sandbox.docker.setupCommand` (يتطلب خروجًا شبكيًا + جذرًا قابلًا للكتابة +
مستخدم root).

إذا كنت تريد صورة عزل أكثر عملية مع أدوات شائعة (على سبيل المثال
`curl` و`jq` و`nodejs` و`python3` و`git`)، فقم ببناء:

```bash
scripts/sandbox-common-setup.sh
```

ثم اضبط `agents.defaults.sandbox.docker.image` إلى
`openclaw-sandbox-common:bookworm-slim`.

صورة Browser المعزول:

```bash
scripts/sandbox-browser-setup.sh
```

افتراضيًا، تعمل حاويات Docker للعزل **من دون شبكة**.
يمكن تجاوز ذلك باستخدام `agents.defaults.sandbox.docker.network`.

تطبق صورة Browser المدمجة للعزل أيضًا إعدادات Chromium افتراضية متحفظة
لأعباء العمل داخل الحاويات. تتضمن إعدادات الحاوية الافتراضية الحالية ما يلي:

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
- `--no-sandbox` عند تمكين `noSandbox`.
- تكون علامات تقوية الرسوميات الثلاث (`--disable-3d-apis`،
  و`--disable-software-rasterizer`، و`--disable-gpu`) اختيارية وتكون مفيدة
  عندما تفتقر الحاويات إلى دعم GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  إذا كان عبء العمل لديك يتطلب WebGL أو ميزات Browser/ثلاثية الأبعاد أخرى.
- يكون `--disable-extensions` مفعّلًا افتراضيًا ويمكن تعطيله عبر
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للتدفقات المعتمدة على الإضافات.
- يتم التحكم في `--renderer-process-limit=2` بواسطة
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`، حيث تُبقي القيمة `0` افتراضي Chromium.

إذا كنت تحتاج إلى ملف وقت تشغيل مختلف، فاستخدم صورة Browser مخصصة وقدّم
نقطة دخولك الخاصة. أما بالنسبة إلى ملفات Chromium الشخصية المحلية (غير الحاوية)، فاستخدم
`browser.extraArgs` لإلحاق علامات بدء تشغيل إضافية.

الإعدادات الأمنية الافتراضية:

- يتم حظر `network: "host"`.
- يتم حظر `network: "container:<id>"` افتراضيًا (مخاطر تجاوز الانضمام إلى مساحة الاسم).
- تجاوز طارئ: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

توجد عمليات تثبيت Docker وGateway المحاوية هنا:
[Docker](/ar/install/docker)

بالنسبة إلى عمليات نشر Docker gateway، يمكن أن يقوم `scripts/docker/setup.sh` بتهيئة إعدادات العزل.
اضبط `OPENCLAW_SANDBOX=1` (أو `true`/`yes`/`on`) لتمكين هذا المسار. ويمكنك
تجاوز موقع المقبس باستخدام `OPENCLAW_DOCKER_SOCKET`. المرجع الكامل
للإعداد وenv: [Docker](/ar/install/docker#agent-sandbox).

## setupCommand (إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية العزل (وليس في كل تشغيل).
ويتم تنفيذه داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

المشكلات الشائعة:

- القيمة الافتراضية لـ `docker.network` هي `"none"` (لا يوجد خروج)، لذا ستفشل عمليات تثبيت الحزم.
- يتطلب `docker.network: "container:<id>"` القيمة `dangerouslyAllowContainerNamespaceJoin: true` وهو للطوارئ فقط.
- يمنع `readOnlyRoot: true` الكتابة؛ اضبط `readOnlyRoot: false` أو استخدم صورة مخصصة.
- يجب أن يكون `user` هو root لتثبيت الحزم (احذف `user` أو اضبط `user: "0:0"`).
- لا يرث exec الخاص بالعزل قيمة `process.env` الخاصة بالمضيف. استخدم
  `agents.defaults.sandbox.docker.env` (أو صورة مخصصة) لمفاتيح API الخاصة بـ Skills.

## سياسة الأدوات + مسارات الهروب

تظل سياسات السماح/المنع للأدوات مطبّقة قبل قواعد العزل. وإذا كانت الأداة مرفوضة
عالميًا أو لكل وكيل، فلن يعيدها العزل.

يُعد `tools.elevated` مسار هروب صريحًا يشغّل `exec` خارج العزل (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).
ولا تنطبق توجيهات `/exec` إلا على المرسلين المصرّح لهم وتستمر لكل جلسة؛ ولتعطيل
`exec` تعطيلًا صارمًا، استخدم الرفض عبر سياسة الأدوات (راجع [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

تصحيح الأخطاء:

- استخدم `openclaw sandbox explain` لفحص وضع العزل الفعّال، وسياسة الأدوات، ومفاتيح الإعدادات الخاصة بالإصلاح.
- راجع [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) للحصول على النموذج الذهني لسؤال "لماذا تم حظر هذا؟".
  أبقه مُحكم الإغلاق.

## تجاوزات متعددة الوكلاء

يمكن لكل وكيل تجاوز العزل + الأدوات:
`agents.list[].sandbox` و`agents.list[].tools` (بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات العزل).
راجع [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) لمعرفة الأولوية.

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
- [إعدادات العزل](/ar/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح أخطاء "لماذا تم حظر هذا؟"
- [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) -- التجاوزات لكل وكيل والأولوية
- [الأمان](/ar/gateway/security)
