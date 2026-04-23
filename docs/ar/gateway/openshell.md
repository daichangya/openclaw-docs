---
read_when:
    - أنت تريد صناديق حماية مُدارة سحابيًا بدلًا من Docker المحلي
    - أنت تقوم بإعداد Plugin ‏OpenShell
    - تحتاج إلى الاختيار بين وضعي mirror وremote workspace
summary: استخدم OpenShell كواجهة خلفية لصندوق حماية مُدار لوكلاء OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T13:59:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

يُعد OpenShell واجهة خلفية لصندوق حماية مُدار لـ OpenClaw. فبدلًا من تشغيل
حاويات Docker محليًا، يفوّض OpenClaw دورة حياة صندوق الحماية إلى CLI ‏`openshell`،
الذي يوفّر بيئات بعيدة مع تنفيذ أوامر قائم على SSH.

يعيد Plugin ‏OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد
نفسه كما في [واجهة SSH الخلفية](/ar/gateway/sandboxing#ssh-backend) العامة. ويضيف
دورة حياة خاصة بـ OpenShell ‏(`sandbox create/get/delete`، و`sandbox ssh-config`)
ووضع مساحة عمل اختياريًا هو `mirror`.

## المتطلبات الأساسية

- تثبيت CLI ‏`openshell` ووجوده على `PATH` (أو تعيين مسار مخصص عبر
  `plugins.entries.openshell.config.command`)
- حساب OpenShell مع إمكانية الوصول إلى sandbox
- تشغيل OpenClaw Gateway على المضيف

## البدء السريع

1. فعّل Plugin وعيّن الواجهة الخلفية لصندوق الحماية:

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

2. أعد تشغيل Gateway. في دورة الوكيل التالية، ينشئ OpenClaw
   صندوق حماية OpenShell ويوجه تنفيذ الأدوات من خلاله.

3. تحقّق:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## أوضاع مساحة العمل

هذا هو القرار الأهم عند استخدام OpenShell.

### `mirror`

استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن **تبقى
مساحة العمل المحلية هي المرجع الأساسي**.

السلوك:

- قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى صندوق حماية OpenShell.
- بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
- تظل أدوات الملفات تعمل عبر جسر sandbox، لكن مساحة العمل المحلية
  تبقى مصدر الحقيقة بين الدورات.

الأفضل لـ:

- قيامك بتحرير الملفات محليًا خارج OpenClaw، وتريد أن تكون هذه التغييرات مرئية في
  sandbox تلقائيًا.
- رغبتك في أن يتصرف صندوق حماية OpenShell بأكبر قدر ممكن مثل واجهة Docker الخلفية.
- رغبتك في أن تعكس مساحة عمل المضيف كتابات sandbox بعد كل دورة exec.

المقايضة: تكلفة مزامنة إضافية قبل كل exec وبعده.

### `remote`

استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن **تصبح
مساحة عمل OpenShell هي المرجع الأساسي**.

السلوك:

- عند إنشاء صندوق الحماية للمرة الأولى، يهيّئ OpenClaw مساحة العمل البعيدة انطلاقًا
  من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch`
  مباشرةً على مساحة عمل OpenShell البعيدة.
- لا يقوم OpenClaw **بمزامنة** التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية.
- تظل قراءات الوسائط وقت المطالبة تعمل لأن أدوات الملفات والوسائط تقرأ عبر
  جسر sandbox.

الأفضل لـ:

- أن تعيش sandbox أساسًا على الجانب البعيد.
- رغبتك في تقليل حمل المزامنة في كل دورة.
- عدم رغبتك في أن تؤدي تعديلات المضيف المحلية إلى الكتابة فوق حالة sandbox البعيدة بصمت.

مهم: إذا حرّرت ملفات على المضيف خارج OpenClaw بعد التهيئة الأولية،
فلن ترى sandbox البعيدة تلك التغييرات. استخدم
`openclaw sandbox recreate` لإعادة التهيئة.

### اختيار وضع

|                          | `mirror`                   | `remote`                    |
| ------------------------ | -------------------------- | --------------------------- |
| **مساحة العمل المرجعية** | المضيف المحلي              | OpenShell البعيد            |
| **اتجاه المزامنة**       | ثنائي الاتجاه (كل exec)    | تهيئة لمرة واحدة            |
| **الحمل في كل دورة**     | أعلى (رفع + تنزيل)         | أقل (عمليات بعيدة مباشرة)   |
| **هل تظهر التعديلات المحلية؟** | نعم، في exec التالية  | لا، حتى recreate            |
| **الأفضل لـ**            | مهام سير عمل التطوير       | الوكلاء طويلة التشغيل، وCI  |

## مرجع الإعداد

توجد كل إعدادات OpenShell ضمن `plugins.entries.openshell.config`:

| Key                       | Type                     | Default       | الوصف                                                |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` أو `"remote"` | `"mirror"`    | وضع مزامنة مساحة العمل                               |
| `command`                 | `string`                 | `"openshell"` | مسار أو اسم CLI ‏`openshell`                         |
| `from`                    | `string`                 | `"openclaw"`  | مصدر sandbox عند الإنشاء لأول مرة                    |
| `gateway`                 | `string`                 | —             | اسم OpenShell Gateway ‏(`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | عنوان نقطة نهاية OpenShell Gateway ‏(`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | معرّف سياسة OpenShell لإنشاء sandbox                 |
| `providers`               | `string[]`               | `[]`          | أسماء الموفّرين المطلوب إرفاقها عند إنشاء sandbox   |
| `gpu`                     | `boolean`                | `false`       | طلب موارد GPU                                        |
| `autoProviders`           | `boolean`                | `true`        | تمرير `--auto-providers` أثناء إنشاء sandbox         |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | مساحة العمل الأساسية القابلة للكتابة داخل sandbox    |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | مسار تحميل مساحة عمل الوكيل (للوصول للقراءة فقط)     |
| `timeoutSeconds`          | `number`                 | `120`         | مهلة عمليات CLI ‏`openshell`                         |

تُضبط إعدادات مستوى sandbox ‏(`mode` و`scope` و`workspaceAccess`) ضمن
`agents.defaults.sandbox` كما هو الحال مع أي واجهة خلفية. راجع
[Sandboxing](/ar/gateway/sandboxing) للاطلاع على المصفوفة الكاملة.

## أمثلة

### إعداد remote بسيط

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

تُدار صناديق حماية OpenShell عبر CLI المعتاد لصندوق الحماية:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

في وضع `remote`، تكون **إعادة الإنشاء مهمة بشكل خاص**: فهي تحذف
مساحة العمل البعيدة المرجعية لذلك النطاق. وعند الاستخدام التالي تُهيَّأ مساحة عمل بعيدة جديدة
من مساحة العمل المحلية.

أما في وضع `mirror`، فتعيد إعادة الإنشاء أساسًا ضبط بيئة التنفيذ البعيدة لأن
مساحة العمل المحلية تبقى هي المرجع الأساسي.

### متى يجب إعادة الإنشاء

أعِد الإنشاء بعد تغيير أي مما يلي:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## تعزيز الأمان

يثبّت OpenShell واصف ملف جذر مساحة العمل ويعيد التحقق من هوية sandbox قبل كل
عملية قراءة، حتى لا تتمكن عمليات تبديل الروابط الرمزية أو إعادة تحميل مساحة العمل من
إعادة توجيه القراءات خارج مساحة العمل البعيدة المقصودة.

## القيود الحالية

- متصفح sandbox غير مدعوم على واجهة OpenShell الخلفية.
- لا ينطبق `sandbox.docker.binds` على OpenShell.
- تنطبق مفاتيح ضبط وقت التشغيل الخاصة بـ Docker ضمن `sandbox.docker.*` على
  واجهة Docker الخلفية فقط.

## كيف يعمل

1. يستدعي OpenClaw الأمر `openshell sandbox create` (مع العلامات `--from` و`--gateway`،
   و`--policy`، و`--providers`، و`--gpu` بحسب الإعداد).
2. يستدعي OpenClaw الأمر `openshell sandbox ssh-config <name>` للحصول على تفاصيل اتصال SSH
   الخاصة بـ sandbox.
3. يكتب النظام الأساسي إعداد SSH إلى ملف مؤقت ويفتح جلسة SSH باستخدام
   جسر نظام الملفات البعيد نفسه كما في واجهة SSH الخلفية العامة.
4. في وضع `mirror`: يزامن من المحلي إلى البعيد قبل exec، ثم يشغّل، ثم يزامن عودةً بعد exec.
5. في وضع `remote`: يهيّئ مرة واحدة عند الإنشاء، ثم يعمل مباشرةً على
   مساحة العمل البعيدة.

## راجع أيضًا

- [Sandboxing](/ar/gateway/sandboxing) -- الأوضاع، والنطاقات، ومقارنة الواجهات الخلفية
- [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح الأدوات المحظورة
- [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل
- [Sandbox CLI](/ar/cli/sandbox) -- أوامر `openclaw sandbox`
