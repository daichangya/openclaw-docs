---
read_when:
    - تريد صناديق حماية مُدارة سحابيًا بدلًا من Docker المحلي
    - أنت تضبط Plugin الخاص بـ OpenShell
    - تحتاج إلى الاختيار بين وضعي mirror وremote لمساحة العمل
summary: استخدام OpenShell كخلفية صندوق حماية مُدارة لوكلاء OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T07:25:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f93a8350fd48602bc535ec0480d0ed1665e558b37cc23c820ac90097862abd23
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell هو خلفية صندوق حماية مُدارة لـ OpenClaw. وبدلًا من تشغيل حاويات Docker
محليًا، يفوّض OpenClaw دورة حياة صندوق الحماية إلى CLI الخاص بـ `openshell`،
الذي يوفّر بيئات بعيدة مع تنفيذ أوامر قائم على SSH.

يعيد Plugin الخاص بـ OpenShell استخدام نقل SSH الأساسي نفسه وجسر
نظام الملفات البعيد الموجود في [خلفية SSH](/ar/gateway/sandboxing#ssh-backend) العامة. ويضيف
دورة حياة خاصة بـ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
ووضع مساحة عمل اختياريًا هو `mirror`.

## المتطلبات المسبقة

- تثبيت CLI الخاص بـ `openshell` وتوفّره على `PATH` (أو ضبط مسار مخصص عبر
  `plugins.entries.openshell.config.command`)
- حساب OpenShell مع صلاحية الوصول إلى صناديق الحماية
- تشغيل OpenClaw Gateway على المضيف

## البدء السريع

1. فعّل Plugin واضبط خلفية صندوق الحماية:

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
          mode: "remote",
        },
      },
    },
  },
}
```

2. أعد تشغيل Gateway. في الدورة التالية للوكيل، ينشئ OpenClaw
   صندوق حماية OpenShell ويوجّه تنفيذ الأدوات من خلاله.

3. تحقّق:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## أوضاع مساحة العمل

هذا هو القرار الأهم عند استخدام OpenShell.

### `mirror`

استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن تبقى **مساحة العمل المحلية هي المرجع الأساسي**.

السلوك:

- قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى صندوق حماية OpenShell.
- بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
- تظل أدوات الملفات تعمل من خلال جسر صندوق الحماية، لكن مساحة العمل المحلية
  تبقى مصدر الحقيقة بين الدورات.

الأفضل لـ:

- إذا كنت تعدّل الملفات محليًا خارج OpenClaw وتريد أن تكون تلك التغييرات مرئية في
  صندوق الحماية تلقائيًا.
- إذا كنت تريد أن يتصرف صندوق حماية OpenShell بأكبر قدر ممكن مثل خلفية Docker.
- إذا كنت تريد أن تعكس مساحة عمل المضيف عمليات الكتابة في صندوق الحماية بعد كل دورة exec.

المقايضة: كلفة مزامنة إضافية قبل كل exec وبعده.

### `remote`

استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن تصبح **مساحة عمل OpenShell هي المرجع الأساسي**.

السلوك:

- عند إنشاء صندوق الحماية لأول مرة، يهيّئ OpenClaw مساحة العمل البعيدة انطلاقًا
  من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch`
  مباشرة على مساحة عمل OpenShell البعيدة.
- لا يقوم OpenClaw **بمزامنة** التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية.
- لا تزال قراءات الوسائط وقت المطالبة تعمل لأن أدوات الملفات والوسائط تقرأ عبر
  جسر صندوق الحماية.

الأفضل لـ:

- عندما يجب أن تعيش مساحة العمل أساسًا على الجانب البعيد.
- عندما تريد كلفة مزامنة أقل في كل دورة.
- عندما لا تريد أن تؤدي التعديلات المحلية على المضيف إلى الكتابة فوق حالة صندوق الحماية البعيد بصمت.

مهم: إذا عدّلت ملفات على المضيف خارج OpenClaw بعد التهيئة الأولية،
فلن يرى صندوق الحماية البعيد تلك التغييرات. استخدم
`openclaw sandbox recreate` لإعادة التهيئة.

### اختيار وضع

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **مساحة العمل المرجعية** | المضيف المحلي              | OpenShell البعيد          |
| **اتجاه المزامنة**       | ثنائي الاتجاه (كل exec)    | تهيئة لمرة واحدة          |
| **الكلفة في كل دورة**    | أعلى (رفع + تنزيل)         | أقل (عمليات بعيدة مباشرة) |
| **هل تظهر التعديلات المحلية؟** | نعم، في exec التالي     | لا، حتى recreate          |
| **الأفضل لـ**            | تدفقات التطوير             | الوكلاء طويلو التشغيل، وCI |

## مرجع الإعدادات

توجد كل إعدادات OpenShell تحت `plugins.entries.openshell.config`:

| المفتاح                  | النوع                    | الافتراضي     | الوصف |
| ------------------------ | ------------------------ | ------------- | ----- |
| `mode`                   | `"mirror"` أو `"remote"` | `"mirror"`    | وضع مزامنة مساحة العمل |
| `command`                | `string`                 | `"openshell"` | مسار أو اسم CLI الخاص بـ `openshell` |
| `from`                   | `string`                 | `"openclaw"`  | مصدر صندوق الحماية لأول إنشاء |
| `gateway`                | `string`                 | —             | اسم Gateway الخاص بـ OpenShell (`--gateway`) |
| `gatewayEndpoint`        | `string`                 | —             | عنوان URL لنقطة نهاية Gateway الخاصة بـ OpenShell (`--gateway-endpoint`) |
| `policy`                 | `string`                 | —             | معرّف policy الخاص بـ OpenShell لإنشاء صندوق الحماية |
| `providers`              | `string[]`               | `[]`          | أسماء المزوّدين المراد إرفاقهم عند إنشاء صندوق الحماية |
| `gpu`                    | `boolean`                | `false`       | طلب موارد GPU |
| `autoProviders`          | `boolean`                | `true`        | تمرير `--auto-providers` أثناء إنشاء صندوق الحماية |
| `remoteWorkspaceDir`     | `string`                 | `"/sandbox"`  | مساحة العمل القابلة للكتابة الأساسية داخل صندوق الحماية |
| `remoteAgentWorkspaceDir`| `string`                 | `"/agent"`    | مسار ربط مساحة عمل الوكيل (للوصول للقراءة فقط) |
| `timeoutSeconds`         | `number`                 | `120`         | المهلة الزمنية لعمليات CLI الخاصة بـ `openshell` |

تُضبط الإعدادات على مستوى صندوق الحماية (`mode` و`scope` و`workspaceAccess`) تحت
`agents.defaults.sandbox` كما هو الحال مع أي خلفية. راجع
[Sandboxing](/ar/gateway/sandboxing) للاطلاع على المصفوفة الكاملة.

## أمثلة

### إعداد remote أدنى

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### وضع mirror مع GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
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
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell لكل وكيل مع Gateway مخصص

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## إدارة دورة الحياة

تُدار صناديق حماية OpenShell من خلال CLI العادي لصندوق الحماية:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

بالنسبة إلى وضع `remote`، تكون **إعادة الإنشاء مهمة بشكل خاص**: فهي تحذف
مساحة العمل البعيدة المرجعية لذلك النطاق. ويؤدي الاستخدام التالي إلى تهيئة
مساحة عمل بعيدة جديدة انطلاقًا من مساحة العمل المحلية.

وبالنسبة إلى وضع `mirror`، فإن إعادة الإنشاء تعيد أساسًا ضبط بيئة التنفيذ البعيدة لأن
مساحة العمل المحلية تظل هي المرجع الأساسي.

### متى تستخدم recreate

استخدم recreate بعد تغيير أي من هذه القيم:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## تقوية الأمان

تستخدم مساعدات صندوق حماية OpenShell التي تقرأ ملفات مساحة العمل البعيدة
واصف ملف مثبتًا لجذر مساحة العمل وتسير عبر الأسلاف انطلاقًا من هذا الواصف المثبت
بدلًا من إعادة تحليل المسار في كل قراءة. ومع إعادة التحقق من الهوية
في كل عملية، يمنع هذا استبدال الرابط الرمزي في منتصف الدورة أو
استبدال ربط مساحة العمل أثناء التشغيل من إعادة توجيه القراءات خارج
مساحة العمل البعيدة المقصودة.

- يُفتح جذر مساحة العمل مرة واحدة ويُثبَّت؛ وتعيد القراءات اللاحقة استخدام هذا الواصف.
- تسير عمليات اجتياز الأسلاف عبر إدخالات نسبية انطلاقًا من الواصف المثبت بحيث لا يمكن
  إعادة توجيهها باستبدال دليل أعلى في المسار.
- يُعاد التحقق من هوية صندوق الحماية قبل كل قراءة، بحيث لا يستطيع
  صندوق حماية أُعيد إنشاؤه أو أُعيد تعيينه أن يقدّم ملفات بصمت من مساحة عمل مختلفة.

## القيود الحالية

- متصفح صندوق الحماية غير مدعوم في خلفية OpenShell.
- لا ينطبق `sandbox.docker.binds` على OpenShell.
- تنطبق مفاتيح وقت التشغيل الخاصة بـ Docker تحت `sandbox.docker.*` فقط على
  خلفية Docker.

## كيف يعمل

1. يستدعي OpenClaw الأمر `openshell sandbox create` (مع العلامات `--from` و`--gateway` و
   `--policy` و`--providers` و`--gpu` حسب الإعدادات).
2. يستدعي OpenClaw الأمر `openshell sandbox ssh-config <name>` للحصول على تفاصيل
   اتصال SSH الخاصة بصندوق الحماية.
3. يكتب core إعدادات SSH إلى ملف مؤقت ويفتح جلسة SSH باستخدام
   جسر نظام الملفات البعيد نفسه الموجود في خلفية SSH العامة.
4. في وضع `mirror`: يزامن من المحلي إلى البعيد قبل exec، ويشغّل، ثم يزامن مجددًا بعد exec.
5. في وضع `remote`: يهيّئ مرة واحدة عند الإنشاء، ثم يعمل مباشرة على مساحة العمل
   البعيدة.

## راجع أيضًا

- [Sandboxing](/ar/gateway/sandboxing) -- الأوضاع والنطاقات ومقارنة الخلفيات
- [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح الأدوات المحظورة
- [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل
- [Sandbox CLI](/ar/cli/sandbox) -- أوامر `openclaw sandbox`
