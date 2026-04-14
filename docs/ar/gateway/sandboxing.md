---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'كيف تعمل آلية العزل في OpenClaw: الأوضاع، والنطاقات، والوصول إلى مساحة العمل، والصور'
title: العزل
x-i18n:
    generated_at: "2026-04-14T02:08:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2573d0d7462f63a68eb1750e5432211522ff5b42989a17379d3e188468bbce52
    source_path: gateway/sandboxing.md
    workflow: 15
---

# العزل

يمكن لـ OpenClaw تشغيل **الأدوات داخل واجهات عزل خلفية** لتقليل نطاق الضرر.
هذا **اختياري** ويتم التحكم فيه عبر الإعداد (`agents.defaults.sandbox` أو
`agents.list[].sandbox`). إذا كان العزل متوقفًا، فستعمل الأدوات على المضيف.
يبقى Gateway على المضيف؛ ويتم تشغيل الأدوات داخل بيئة عزل معزولة
عند التفعيل.

هذا ليس حدًا أمنيًا مثاليًا، لكنه يحد بشكل ملموس من الوصول إلى نظام الملفات
والعمليات عندما يقوم النموذج بشيء غير حكيم.

## ما الذي يتم عزله

- تنفيذ الأدوات (`exec`، `read`، `write`، `edit`، `apply_patch`، `process`، إلخ).
- متصفح معزول اختياري (`agents.defaults.sandbox.browser`).
  - افتراضيًا، يبدأ متصفح العزل تلقائيًا (لضمان إمكانية الوصول إلى CDP) عندما تحتاجه أداة المتصفح.
    اضبط ذلك عبر `agents.defaults.sandbox.browser.autoStart` و `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - افتراضيًا، تستخدم حاويات متصفح العزل شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من شبكة `bridge` العامة.
    اضبط ذلك باستخدام `agents.defaults.sandbox.browser.network`.
  - يقيّد الخيار الاختياري `agents.defaults.sandbox.browser.cdpSourceRange` حركة CDP الواردة عند حافة الحاوية باستخدام قائمة سماح CIDR (على سبيل المثال `172.21.0.1/32`).
  - يكون وصول المراقبة عبر noVNC محميًا بكلمة مرور افتراضيًا؛ ويصدر OpenClaw رابط رمز مميز قصير العمر يخدم صفحة تمهيد محلية ويفتح noVNC مع كلمة المرور في جزء الرابط (fragment) من عنوان URL، وليس في سجلات الاستعلام/الرؤوس.
  - يتيح `agents.defaults.sandbox.browser.allowHostControl` للجلسات المعزولة استهداف متصفح المضيف بشكل صريح.
  - تتحكم قوائم السماح الاختيارية في `target: "custom"`: `allowedControlUrls` و `allowedControlHosts` و `allowedControlPorts`.

ما لا يتم عزله:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحةً بالتشغيل خارج العزل (مثل `tools.elevated`).
  - **يتجاوز exec المرتفع العزل ويستخدم مسار الهروب المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).**
  - إذا كان العزل متوقفًا، فإن `tools.elevated` لا يغيّر التنفيذ (لأنه يعمل أصلًا على المضيف). راجع [الوضع المرتفع](/ar/tools/elevated).

## الأوضاع

يتحكم `agents.defaults.sandbox.mode` في **متى** يتم استخدام العزل:

- `"off"`: بدون عزل.
- `"non-main"`: عزل جلسات **غير main** فقط (الافتراضي إذا كنت تريد أن تعمل المحادثات العادية على المضيف).
- `"all"`: كل جلسة تعمل داخل بيئة عزل.
  ملاحظة: يعتمد `"non-main"` على `session.mainKey` (الافتراضي `"main"`)، وليس على معرّف الوكيل.
  تستخدم جلسات المجموعة/القناة مفاتيحها الخاصة، لذلك تُعد غير main وسيتم عزلها.

## النطاق

يتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي يتم إنشاؤها:

- `"agent"` (افتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة مشتركة بين جميع الجلسات المعزولة.

## الواجهة الخلفية

يتحكم `agents.defaults.sandbox.backend` في **أي بيئة تشغيل** توفر العزل:

- `"docker"` (افتراضي): بيئة عزل محلية مدعومة بـ Docker.
- `"ssh"`: بيئة عزل بعيدة عامة مدعومة بـ SSH.
- `"openshell"`: بيئة عزل مدعومة بـ OpenShell.

توجد إعدادات SSH الخاصة تحت `agents.defaults.sandbox.ssh`.
وتوجد إعدادات OpenShell الخاصة تحت `plugins.entries.openshell.config`.

### اختيار واجهة خلفية

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**    | حاوية محلية                      | أي مضيف يمكن الوصول إليه عبر SSH | بيئة عزل مُدارة بواسطة OpenShell                   |
| **الإعداد**         | `scripts/sandbox-setup.sh`       | مفتاح SSH + المضيف الهدف       | Plugin OpenShell مفعّل                              |
| **نموذج مساحة العمل** | ربط تحميل أو نسخ                | بعيد كمرجع أساسي (تهيئة مرة واحدة) | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` (الافتراضي: لا شيء) | يعتمد على المضيف البعيد        | يعتمد على OpenShell                                 |
| **عزل المتصفح**     | مدعوم                            | غير مدعوم                      | غير مدعوم بعد                                       |
| **ربط التحميل**     | `docker.binds`                   | غير متاح                       | غير متاح                                            |
| **الأفضل لـ**       | التطوير المحلي، والعزل الكامل    | نقل العمل إلى جهاز بعيد        | بيئات عزل بعيدة مُدارة مع مزامنة ثنائية الاتجاه اختيارية |

### واجهة Docker الخلفية

تُعد واجهة Docker الخلفية بيئة التشغيل الافتراضية، حيث تنفذ الأدوات ومتصفحات العزل محليًا عبر مقبس Docker daemon (`/var/run/docker.sock`). ويُحدَّد عزل حاوية العزل بواسطة مساحات أسماء Docker.

**قيود Docker-out-of-Docker (DooD)**:
إذا قمت بنشر OpenClaw Gateway نفسه كحاوية Docker، فسيقوم بتنسيق حاويات عزل شقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). ويؤدي ذلك إلى قيد محدد على تعيين المسارات:

- **يتطلب الإعداد مسارات المضيف**: يجب أن يحتوي إعداد `workspace` في `openclaw.json` على **المسار المطلق الخاص بمضيف النظام** (مثل `/home/user/.openclaw/workspaces`)، وليس المسار الداخلي لحاوية Gateway. عندما يطلب OpenClaw من Docker daemon إنشاء بيئة عزل، يقيّم daemon المسارات بالنسبة إلى مساحة أسماء نظام المضيف، وليس مساحة أسماء Gateway.
- **تكافؤ جسر نظام الملفات (تطابق خريطة الأحجام)**: تكتب عملية OpenClaw Gateway الأصلية أيضًا ملفات Heartbeat والجسر إلى دليل `workspace`. وبما أن Gateway يقيّم السلسلة النصية نفسها تمامًا (مسار المضيف) من داخل بيئته المحواة، فيجب أن يتضمن نشر Gateway خريطة أحجام مطابقة تربط مساحة أسماء المضيف بشكل أصلي (`-v /home/user/.openclaw:/home/user/.openclaw`).

إذا قمت بتعيين المسارات داخليًا من دون تكافؤ مطلق مع المضيف، فسيرمي OpenClaw محليًا خطأ إذن `EACCES` عند محاولة كتابة Heartbeat داخل بيئة الحاوية لأن سلسلة المسار المؤهلة بالكامل لا تكون موجودة محليًا.

### واجهة SSH الخلفية

استخدم `backend: "ssh"` عندما تريد أن يعزل OpenClaw كلاً من `exec`، وأدوات الملفات، وقراءات الوسائط على
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
- عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يهيّئ OpenClaw مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و `read` و `write` و `edit` و `apply_patch` وقراءات وسائط الموجه وتخزين الوسائط الواردة مباشرة على مساحة العمل البعيدة عبر SSH.
- لا يزامن OpenClaw التغييرات البعيدة إلى مساحة العمل المحلية تلقائيًا.

مواد المصادقة:

- `identityFile` و `certificateFile` و `knownHostsFile`: استخدم الملفات المحلية الموجودة ومرّرها عبر إعداد OpenSSH.
- `identityData` و `certificateData` و `knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يحل OpenClaw هذه القيم عبر اللقطة العادية لبيئة تشغيل الأسرار، ويكتبها إلى ملفات مؤقتة بأذونات `0600`، ويحذفها عند انتهاء جلسة SSH.
- إذا تم تعيين كل من `*File` و `*Data` للعنصر نفسه، فستكون الأولوية لـ `*Data` لتلك الجلسة من SSH.

هذا نموذج **بعيد كمرجع أساسي**. تصبح مساحة العمل البعيدة عبر SSH هي الحالة الفعلية للعزل بعد التهيئة الأولية.

نتائج مهمة:

- لن تظهر التعديلات المحلية على المضيف التي تتم خارج OpenClaw بعد خطوة التهيئة عن بُعد حتى تعيد إنشاء بيئة العزل.
- يحذف `openclaw sandbox recreate` الجذر البعيد لكل نطاق ويعيد التهيئة من المحلي عند الاستخدام التالي.
- عزل المتصفح غير مدعوم على واجهة SSH الخلفية.
- لا تنطبق إعدادات `sandbox.docker.*` على واجهة SSH الخلفية.

### واجهة OpenShell الخلفية

استخدم `backend: "openshell"` عندما تريد أن يعزل OpenClaw الأدوات في
بيئة بعيدة مُدارة بواسطة OpenShell. للحصول على دليل الإعداد الكامل، ومرجع
الإعداد، ومقارنة أوضاع مساحة العمل، راجع
[صفحة OpenShell](/ar/gateway/openshell).

يعيد OpenShell استخدام نفس نقل SSH الأساسي وجسر نظام الملفات البعيد المستخدم في
واجهة SSH الخلفية العامة، ويضيف دورة حياة خاصة بـ OpenShell
(`sandbox create/get/delete` و `sandbox ssh-config`) بالإضافة إلى وضع
مساحة العمل الاختياري `mirror`.

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

- `mirror` (افتراضي): تبقى مساحة العمل المحلية هي المرجع الأساسي. يزامن OpenClaw الملفات المحلية إلى OpenShell قبل exec ويزامن مساحة العمل البعيدة مرة أخرى بعد exec.
- `remote`: تصبح مساحة عمل OpenShell هي المرجع الأساسي بعد إنشاء بيئة العزل. يهيّئ OpenClaw مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية، ثم تعمل أدوات الملفات و exec مباشرة على بيئة العزل البعيدة من دون مزامنة التغييرات عودةً.

تفاصيل النقل البعيد:

- يطلب OpenClaw من OpenShell إعداد SSH خاصًا ببيئة العزل عبر `openshell sandbox ssh-config <name>`.
- يكتب المكوّن الأساسي إعداد SSH هذا إلى ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم مع `backend: "ssh"`.
- في وضع `mirror` فقط تختلف دورة الحياة: مزامنة من المحلي إلى البعيد قبل exec، ثم مزامنة عكسية بعد exec.

القيود الحالية لـ OpenShell:

- متصفح العزل غير مدعوم بعد
- `sandbox.docker.binds` غير مدعوم على واجهة OpenShell الخلفية
- تبقى عناصر التحكم الخاصة ببيئة Docker تحت `sandbox.docker.*` مطبقة فقط على واجهة Docker الخلفية

#### أوضاع مساحة العمل

يحتوي OpenShell على نموذجي مساحة عمل. وهذا هو الجزء الأهم عمليًا.

##### `mirror`

استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن **تبقى مساحة العمل المحلية هي المرجع الأساسي**.

السلوك:

- قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى بيئة OpenShell المعزولة.
- بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
- ما تزال أدوات الملفات تعمل عبر جسر العزل، لكن مساحة العمل المحلية تبقى مصدر الحقيقة بين الأدوار.

استخدم هذا عندما:

- تعدّل الملفات محليًا خارج OpenClaw وتريد أن تظهر هذه التغييرات في بيئة العزل تلقائيًا
- تريد أن تتصرف بيئة OpenShell المعزولة بأكبر قدر ممكن مثل واجهة Docker الخلفية
- تريد أن تعكس مساحة عمل المضيف عمليات الكتابة التي تحدث داخل العزل بعد كل دور exec

المقايضة:

- تكلفة مزامنة إضافية قبل exec وبعده

##### `remote`

استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن **تصبح مساحة عمل OpenShell هي المرجع الأساسي**.

السلوك:

- عندما يتم إنشاء بيئة العزل لأول مرة، يهيّئ OpenClaw مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و `read` و `write` و `edit` و `apply_patch` مباشرة على مساحة عمل OpenShell البعيدة.
- لا يزامن OpenClaw التغييرات البعيدة عودةً إلى مساحة العمل المحلية بعد exec.
- ما تزال قراءات الوسائط وقت الموجه تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر العزل بدلًا من افتراض مسار محلي على المضيف.
- يتم النقل عبر SSH إلى بيئة OpenShell المعزولة التي يعيدها `openshell sandbox ssh-config`.

نتائج مهمة:

- إذا عدّلت ملفات على المضيف خارج OpenClaw بعد خطوة التهيئة، فلن ترى بيئة العزل البعيدة هذه التغييرات **تلقائيًا**.
- إذا أُعيد إنشاء بيئة العزل، فستُهيَّأ مساحة العمل البعيدة من مساحة العمل المحلية مرة أخرى.
- مع `scope: "agent"` أو `scope: "shared"`، تتم مشاركة مساحة العمل البعيدة هذه ضمن ذلك النطاق نفسه.

استخدم هذا عندما:

- يجب أن تعيش بيئة العزل بشكل أساسي على الجانب البعيد الخاص بـ OpenShell
- تريد تكلفة مزامنة أقل لكل دور
- لا تريد أن تؤدي التعديلات المحلية على المضيف إلى الكتابة فوق حالة بيئة العزل البعيدة بصمت

اختر `mirror` إذا كنت تعتبر بيئة العزل بيئة تنفيذ مؤقتة.
واختر `remote` إذا كنت تعتبر بيئة العزل هي مساحة العمل الحقيقية.

#### دورة حياة OpenShell

ما تزال بيئات OpenShell المعزولة تُدار عبر دورة الحياة المعتادة للعزل:

- يعرض `openclaw sandbox list` بيئات OpenShell وكذلك بيئات Docker
- يحذف `openclaw sandbox recreate` بيئة التشغيل الحالية ويترك OpenClaw يعيد إنشاءها عند الاستخدام التالي
- كما أن منطق التنظيف المرحلي مدرك للواجهة الخلفية أيضًا

بالنسبة إلى وضع `remote`، تكون إعادة الإنشاء مهمة بشكل خاص:

- تحذف إعادة الإنشاء مساحة العمل البعيدة المرجعية لذلك النطاق
- ويقوم الاستخدام التالي بتهيئة مساحة عمل بعيدة جديدة من مساحة العمل المحلية

أما في وضع `mirror`، فتعيد إعادة الإنشاء أساسًا ضبط بيئة التنفيذ البعيدة
لأن مساحة العمل المحلية تبقى هي المرجع الأساسي على أي حال.

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` في **ما الذي يمكن لبيئة العزل رؤيته**:

- `"none"` (افتراضي): ترى الأدوات مساحة عمل معزولة تحت `~/.openclaw/sandboxes`.
- `"ro"`: يربط مساحة عمل الوكيل للقراءة فقط عند `/agent` (ويعطّل `write` و `edit` و `apply_patch`).
- `"rw"`: يربط مساحة عمل الوكيل للقراءة والكتابة عند `/workspace`.

مع الواجهة الخلفية OpenShell:

- ما يزال وضع `mirror` يستخدم مساحة العمل المحلية كمصدر مرجعي بين أدوار exec
- ويستخدم وضع `remote` مساحة العمل البعيدة لـ OpenShell كمصدر مرجعي بعد التهيئة الأولية
- وما يزال `workspaceAccess: "ro"` و `"none"` يقيّدان سلوك الكتابة بالطريقة نفسها

يتم نسخ الوسائط الواردة إلى مساحة العمل النشطة داخل بيئة العزل (`media/inbound/*`).
ملاحظة حول Skills: أداة `read` مقيّدة بجذر بيئة العزل. مع `workspaceAccess: "none"`،
يقوم OpenClaw بنسخ Skills المؤهلة إلى مساحة عمل العزل (`.../skills`) بحيث
يمكن قراءتها. ومع `"rw"`، تصبح Skills الخاصة بمساحة العمل قابلة للقراءة من
`/workspace/skills`.

## ربطات التحميل المخصصة

يقوم `agents.defaults.sandbox.docker.binds` بربط أدلة إضافية من المضيف داخل الحاوية.
الصيغة: `host:container:mode` (مثل `"/home/user/source:/source:rw"`).

يتم **دمج** الربطات العامة وربطات كل وكيل على حدة (ولا يتم استبدالها). ضمن `scope: "shared"`، يتم تجاهل ربطات كل وكيل.

يقوم `agents.defaults.sandbox.browser.binds` بربط أدلة إضافية من المضيف داخل حاوية **متصفح العزل** فقط.

- عند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `agents.defaults.sandbox.docker.binds` لحاوية المتصفح.
- وعند عدم تعيينه، تعود حاوية المتصفح إلى `agents.defaults.sandbox.docker.binds` (للتوافق مع الإصدارات السابقة).

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

- تتجاوز ربطات التحميل نظام ملفات العزل: فهي تكشف مسارات المضيف وفق الوضع الذي تحدده (`:ro` أو `:rw`).
- يحظر OpenClaw مصادر الربط الخطِرة (على سبيل المثال: `docker.sock` و `/etc` و `/proc` و `/sys` و `/dev` وربطات التحميل الأصلية التي قد تكشفها).
- ويحظر OpenClaw أيضًا جذور بيانات الاعتماد الشائعة في الدليل المنزلي مثل `~/.aws` و `~/.cargo` و `~/.config` و `~/.docker` و `~/.gnupg` و `~/.netrc` و `~/.npm` و `~/.ssh`.
- لا يقتصر التحقق من صحة الربط على مطابقة النصوص فقط. يقوم OpenClaw بتطبيع مسار المصدر، ثم يحلّه مرة أخرى عبر أعمق سلف موجود قبل إعادة التحقق من المسارات المحظورة والجذور المسموح بها.
- وهذا يعني أن محاولات الهروب عبر الآباء المرتبطين بروابط رمزية ستفشل بشكل مغلق حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: سيُحل `/workspace/run-link/new-file` على أنه `/var/run/...` إذا كانت `run-link` تشير إلى ذلك.
- وتُطبَّع جذور المصادر المسموح بها بالطريقة نفسها، لذلك فإن المسار الذي يبدو فقط داخل قائمة السماح قبل حل الرابط الرمزي سيُرفَض أيضًا على أنه `outside allowed roots`.
- يجب أن تكون الربطات الحساسة (الأسرار، ومفاتيح SSH، وبيانات اعتماد الخدمات) بنمط `:ro` ما لم يكن خلاف ذلك ضروريًا تمامًا.
- اجمع ذلك مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى وصول للقراءة إلى مساحة العمل؛ إذ تبقى أوضاع الربط مستقلة.
- راجع [العزل مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل الربطات مع سياسة الأدوات و exec المرتفع.

## الصور + الإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

قم ببنائها مرة واحدة:

```bash
scripts/sandbox-setup.sh
```

ملاحظة: لا تتضمن الصورة الافتراضية `Node`. إذا كانت إحدى Skills تحتاج إلى `Node` (أو
بيئات تشغيل أخرى)، فإما أن تُنشئ صورة مخصصة أو تثبّت ذلك عبر
`sandbox.docker.setupCommand` (يتطلب ذلك خروجًا إلى الشبكة + جذرًا قابلًا للكتابة +
ومستخدم root).

إذا كنت تريد صورة بيئة عزل أكثر عملية مع أدوات شائعة (مثل
`curl` و `jq` و `nodejs` و `python3` و `git`)، فقم بالبناء باستخدام:

```bash
scripts/sandbox-common-setup.sh
```

ثم اضبط `agents.defaults.sandbox.docker.image` إلى
`openclaw-sandbox-common:bookworm-slim`.

صورة متصفح العزل:

```bash
scripts/sandbox-browser-setup.sh
```

افتراضيًا، تعمل حاويات Docker المعزولة **من دون شبكة**.
يمكنك تجاوز ذلك باستخدام `agents.defaults.sandbox.docker.network`.

تطبّق صورة متصفح العزل المضمّنة أيضًا إعدادات Chromium افتراضية متحفظة
لأحمال العمل داخل الحاويات. تتضمن الإعدادات الافتراضية الحالية للحاوية:

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
- `--no-sandbox` و `--disable-setuid-sandbox` عند تفعيل `noSandbox`.
- علامات تقوية الرسوميات الثلاث (`--disable-3d-apis`،
  و `--disable-software-rasterizer`، و `--disable-gpu`) اختيارية، وتكون مفيدة
  عندما لا تدعم الحاويات GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  إذا كان حمل العمل لديك يتطلب WebGL أو ميزات متصفح/ثلاثية الأبعاد أخرى.
- يكون `--disable-extensions` مفعّلًا افتراضيًا ويمكن تعطيله عبر
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للتدفقات التي تعتمد على الإضافات.
- يتم التحكم في `--renderer-process-limit=2` عبر
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`، حيث إن القيمة `0` تُبقي الإعداد الافتراضي لـ Chromium.

إذا كنت تحتاج إلى ملف تعريف مختلف لبيئة التشغيل، فاستخدم صورة متصفح مخصصة وقدّم
نقطة دخول خاصة بك. أما بالنسبة إلى ملفات تعريف Chromium المحلية (غير الحاوية)، فاستخدم
`browser.extraArgs` لإلحاق علامات بدء تشغيل إضافية.

الإعدادات الأمنية الافتراضية:

- يتم حظر `network: "host"`.
- ويتم حظر `network: "container:<id>"` افتراضيًا (بسبب خطر تجاوز الانضمام إلى مساحة الأسماء).
- تجاوز طارئ: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

توجد عمليات تثبيت Docker وGateway المُحوّى هنا:
[Docker](/ar/install/docker)

بالنسبة إلى عمليات نشر Docker الخاصة بـ Gateway، يمكن لـ `scripts/docker/setup.sh` تهيئة إعدادات العزل.
اضبط `OPENCLAW_SANDBOX=1` (أو `true`/`yes`/`on`) لتفعيل هذا المسار. ويمكنك
تجاوز موقع المقبس باستخدام `OPENCLAW_DOCKER_SOCKET`. مرجع الإعداد الكامل ومتغيرات البيئة:
[Docker](/ar/install/docker#agent-sandbox).

## setupCommand (إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية العزل (وليس في كل تشغيل).
ويُنفَّذ داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

المزالق الشائعة:

- القيمة الافتراضية لـ `docker.network` هي `"none"` (من دون خروج للشبكة)، لذلك ستفشل عمليات تثبيت الحزم.
- يتطلب `docker.network: "container:<id>"` القيمة `dangerouslyAllowContainerNamespaceJoin: true` ويُستخدم فقط كخيار طارئ.
- يمنع `readOnlyRoot: true` عمليات الكتابة؛ اضبط `readOnlyRoot: false` أو أنشئ صورة مخصصة.
- يجب أن يكون `user` هو root لتثبيت الحزم (احذف `user` أو اضبط `user: "0:0"`).
- لا يرث exec داخل العزل `process.env` من المضيف. استخدم
  `agents.defaults.sandbox.docker.env` (أو صورة مخصصة) لمفاتيح API الخاصة بـ Skills.

## سياسة الأدوات + منافذ الهروب

ما تزال سياسات السماح/المنع الخاصة بالأدوات تُطبَّق قبل قواعد العزل. إذا كانت أداة ما ممنوعة
عالميًا أو لكل وكيل، فلن يعيدها العزل.

يُعد `tools.elevated` منفذ هروب صريحًا يشغّل `exec` خارج العزل (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).
وتنطبق توجيهات `/exec` فقط على المرسلين المصرّح لهم وتستمر لكل جلسة؛ ولتعطيل
`exec` بشكل صارم، استخدم منع سياسة الأدوات (راجع [العزل مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

استكشاف الأخطاء:

- استخدم `openclaw sandbox explain` لفحص وضع العزل الفعّال، وسياسة الأدوات، ومفاتيح إعدادات الإصلاح.
- راجع [العزل مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لفهم النموذج الذهني لسؤال “لماذا تم حظر هذا؟”.
  أبقه مقيدًا بإحكام.

## تجاوزات متعددة الوكلاء

يمكن لكل وكيل تجاوز إعدادات العزل + الأدوات:
`agents.list[].sandbox` و `agents.list[].tools` (بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات العزل).
راجع [العزل والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) لمعرفة الأولوية.

## مثال تمكين بسيط

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

## وثائق ذات صلة

- [OpenShell](/ar/gateway/openshell) -- إعداد الواجهة الخلفية للعزل المُدار، وأوضاع مساحة العمل، ومرجع الإعداد
- [إعدادات العزل](/ar/gateway/configuration-reference#agentsdefaultssandbox)
- [العزل مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- استكشاف أخطاء "لماذا تم حظر هذا؟"
- [العزل والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات كل وكيل والأولوية
- [الأمان](/ar/gateway/security)
