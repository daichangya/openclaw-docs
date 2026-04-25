---
read_when:
    - تريد فهم OAuth في OpenClaw من البداية إلى النهاية
    - واجهت مشكلات في إبطال الرمز / تسجيل الخروج
    - تريد تدفقات مصادقة Claude CLI أو OAuth
    - تريد حسابات متعددة أو توجيه ملفات التعريف
summary: 'OAuth في OpenClaw: تبادل الرموز والتخزين وأنماط الحسابات المتعددة'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

يدعم OpenClaw ما يسمى "مصادقة الاشتراك" عبر OAuth لمزودي الخدمة الذين يقدمونها
(وخاصة **OpenAI Codex ‏(ChatGPT OAuth)**). أما بالنسبة إلى Anthropic، فأصبح
التقسيم العملي الآن كما يلي:

- **مفتاح Anthropic API**: فوترة Anthropic API العادية
- **مصادقة Anthropic Claude CLI / مصادقة الاشتراك داخل OpenClaw**: أخبرنا موظفو Anthropic
  أن هذا الاستخدام مسموح به مرة أخرى

إن OpenAI Codex OAuth مدعوم صراحةً للاستخدام في الأدوات الخارجية مثل
OpenClaw. تشرح هذه الصفحة ما يلي:

بالنسبة إلى Anthropic في بيئات الإنتاج، يظل استخدام مفتاح API هو المسار
الموصى به والأكثر أمانًا.

- كيف يعمل **تبادل الرموز** في OAuth ‏(PKCE)
- أين يتم **تخزين** الرموز (ولماذا)
- كيفية التعامل مع **حسابات متعددة** (ملفات تعريف + تجاوزات لكل جلسة)

يدعم OpenClaw أيضًا **Plugins للمزوّدين** التي تأتي بتدفقات OAuth أو API‑key
الخاصة بها. شغّلها عبر:

```bash
openclaw models auth login --provider <id>
```

## مصرف الرموز (لماذا يوجد)

غالبًا ما يقوم مزودو OAuth بإصدار **رمز تحديث جديد** أثناء تدفقات تسجيل الدخول/التحديث. ويمكن لبعض المزودين (أو عملاء OAuth) إبطال رموز التحديث الأقدم عندما يتم إصدار رمز جديد للمستخدم/التطبيق نفسه.

العرض العملي:

- تسجّل الدخول عبر OpenClaw _وكذلك_ عبر Claude Code / Codex CLI → ثم يتعرض أحدهما لاحقًا بشكل عشوائي لحالة "تسجيل الخروج"

ولتقليل ذلك، يتعامل OpenClaw مع `auth-profiles.json` بوصفه **مصرف رموز**:

- يقرأ وقت التشغيل بيانات الاعتماد من **مكان واحد**
- يمكننا الاحتفاظ بملفات تعريف متعددة وتوجيهها بشكل حتمي
- تختلف إعادة استخدام CLI الخارجي حسب المزوّد: يمكن لـ Codex CLI تهيئة ملف
  تعريف فارغ `openai-codex:default`، لكن بمجرد أن يمتلك OpenClaw ملف OAuth محليًا،
  يصبح رمز التحديث المحلي هو المرجع الأساسي؛ ويمكن أن تبقى التكاملات الأخرى
  مُدارة خارجيًا مع إعادة قراءة مخزن مصادقة CLI الخاص بها

## التخزين (أين تعيش الرموز)

يتم تخزين الأسرار **لكل وكيل**:

- ملفات تعريف المصادقة (OAuth + مفاتيح API + مراجع على مستوى القيم عند الحاجة): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ملف التوافق القديم: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (يتم تنظيف إدخالات `api_key` الثابتة عند اكتشافها)

ملف الاستيراد القديم فقط (لا يزال مدعومًا، لكنه ليس المخزن الرئيسي):

- `~/.openclaw/credentials/oauth.json` (يتم استيراده إلى `auth-profiles.json` عند أول استخدام)

تحترم جميع المسارات أعلاه أيضًا `$OPENCLAW_STATE_DIR` (تجاوز دليل الحالة). المرجع الكامل: [/gateway/configuration](/ar/gateway/configuration-reference#auth-storage)

بالنسبة إلى مراجع الأسرار الثابتة وسلوك تفعيل اللقطة في وقت التشغيل، راجع [إدارة الأسرار](/ar/gateway/secrets).

## التوافق القديم لرموز Anthropic

<Warning>
تقول مستندات Claude Code العامة من Anthropic إن استخدام Claude Code المباشر يظل ضمن
حدود اشتراك Claude، وقد أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw
مسموح به مرة أخرى. لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام
`claude -p` على أنهما مساران معتمدان لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.

للاطلاع على مستندات خطة Claude Code المباشرة الحالية من Anthropic، راجع [استخدام Claude Code
مع خطة Pro أو Max
الخاصة بك](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
و[استخدام Claude Code مع خطة Team أو Enterprise
الخاصة بك](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

إذا كنت تريد خيارات أخرى على نمط الاشتراك داخل OpenClaw، فراجع [OpenAI
Codex](/ar/providers/openai)، و[Qwen Cloud Coding
Plan](/ar/providers/qwen)، و[MiniMax Coding Plan](/ar/providers/minimax)،
و[Z.AI / GLM Coding Plan](/ar/providers/glm).
</Warning>

يكشف OpenClaw أيضًا عن setup-token الخاص بـ Anthropic كمسار مصادقة مدعوم بالرموز، لكنه يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عندما يكونان متاحين.

## ترحيل Anthropic Claude CLI

يدعم OpenClaw إعادة استخدام Anthropic Claude CLI مرة أخرى. إذا كان لديك بالفعل
تسجيل دخول Claude محلي على المضيف، فيمكن لعمليتَي onboarding/configure إعادة استخدامه مباشرةً.

## تبادل OAuth (كيف يعمل تسجيل الدخول)

يتم تنفيذ تدفقات تسجيل الدخول التفاعلية في OpenClaw داخل `@mariozechner/pi-ai` وربطها بالمعالجات/الأوامر.

### setup-token في Anthropic

شكل التدفق:

1. ابدأ setup-token الخاص بـ Anthropic أو paste-token من داخل OpenClaw
2. يخزن OpenClaw بيانات اعتماد Anthropic الناتجة في ملف تعريف مصادقة
3. يبقى اختيار النموذج على `anthropic/...`
4. تظل ملفات تعريف مصادقة Anthropic الحالية متاحة للرجوع/التحكم في الترتيب

### OpenAI Codex ‏(ChatGPT OAuth)

إن OpenAI Codex OAuth مدعوم صراحةً للاستخدام خارج Codex CLI، بما في ذلك تدفقات OpenClaw.

شكل التدفق (PKCE):

1. إنشاء PKCE verifier/challenge مع `state` عشوائي
2. فتح `https://auth.openai.com/oauth/authorize?...`
3. محاولة التقاط callback على `http://127.0.0.1:1455/auth/callback`
4. إذا تعذر ربط callback (أو كنت تعمل عن بُعد/من دون واجهة)، ألصق redirect URL/code
5. إجراء التبادل على `https://auth.openai.com/oauth/token`
6. استخراج `accountId` من access token وتخزين `{ access, refresh, expires, accountId }`

مسار المعالج هو `openclaw onboard` → خيار المصادقة `openai-codex`.

## التحديث + انتهاء الصلاحية

تخزن ملفات التعريف طابعًا زمنيًا `expires`.

في وقت التشغيل:

- إذا كانت قيمة `expires` في المستقبل → استخدم access token المخزن
- إذا انتهت الصلاحية → حدّث (تحت file lock) واكتب بيانات الاعتماد المخزنة فوق السابقة
- الاستثناء: تبقى بعض بيانات اعتماد CLI الخارجية مُدارة خارجيًا؛ ويعيد OpenClaw
  قراءة مخازن مصادقة CLI تلك بدلًا من استهلاك رموز التحديث المنسوخة.
  إن تهيئة Codex CLI أضيق عمدًا: فهي تزرع ملف تعريف فارغًا
  `openai-codex:default`، ثم تجعل عمليات التحديث المملوكة لـ OpenClaw الملف
  المحلي هو المرجع الأساسي.

تدفق التحديث تلقائي؛ وبوجه عام لا تحتاج إلى إدارة الرموز يدويًا.

## الحسابات المتعددة (ملفات التعريف) + التوجيه

هناك نمطان:

### 1) المفضل: وكلاء منفصلون

إذا أردت ألا يتفاعل "الشخصي" و"العمل" مطلقًا، فاستخدم وكلاء معزولين (جلسات + بيانات اعتماد + مساحة عمل منفصلة):

```bash
openclaw agents add work
openclaw agents add personal
```

ثم كوّن المصادقة لكل وكيل (عبر المعالج) ووجّه الدردشات إلى الوكيل الصحيح.

### 2) متقدم: ملفات تعريف متعددة داخل وكيل واحد

يدعم `auth-profiles.json` عدة معرّفات ملفات تعريف للمزوّد نفسه.

اختر ملف التعريف المستخدم عبر:

- بشكل عام عبر ترتيب الإعداد (`auth.order`)
- لكل جلسة عبر `/model ...@<profileId>`

مثال (تجاوز على مستوى الجلسة):

- `/model Opus@anthropic:work`

كيفية معرفة معرّفات ملفات التعريف الموجودة:

- `openclaw channels list --json` (يعرض `auth[]`)

المستندات ذات الصلة:

- [التبديل التلقائي بين النماذج](/ar/concepts/model-failover) (قواعد التدوير + التهدئة)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) (سطح الأوامر)

## ذو صلة

- [المصادقة](/ar/gateway/authentication) — نظرة عامة على مصادقة مزود النماذج
- [الأسرار](/ar/gateway/secrets) — تخزين بيانات الاعتماد وSecretRef
- [مرجع الإعداد](/ar/gateway/configuration-reference#auth-storage) — مفاتيح إعداد المصادقة
