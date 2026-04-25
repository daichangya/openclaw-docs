---
read_when:
    - تصحيح أخطاء مصادقة النموذج أو انتهاء صلاحية OAuth
    - توثيق المصادقة أو تخزين بيانات الاعتماد
summary: 'مصادقة النموذج: OAuth، ومفاتيح API، وإعادة استخدام Claude CLI، وsetup-token الخاص بـ Anthropic'
title: المصادقة
x-i18n:
    generated_at: "2026-04-25T13:45:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
تغطي هذه الصفحة مصادقة **مزوّد النموذج** (مفاتيح API، وOAuth، وإعادة استخدام Claude CLI، وsetup-token الخاص بـ Anthropic). أما مصادقة **اتصال gateway** (الرمز المميز، وكلمة المرور، وtrusted-proxy)، فراجع [الإعدادات](/ar/gateway/configuration) و[Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth).
</Note>

يدعم OpenClaw OAuth ومفاتيح API لمزوّدي النماذج. وبالنسبة إلى مضيفي gateway
الدائمين التشغيل، تكون مفاتيح API عادةً الخيار الأكثر قابلية للتنبؤ. كما أن
تدفقات الاشتراك/OAuth مدعومة أيضًا عندما تطابق نموذج حساب المزوّد لديك.

راجع [/concepts/oauth](/ar/concepts/oauth) لمعرفة تدفق OAuth الكامل
وتخطيط التخزين.
وبالنسبة إلى المصادقة المعتمدة على SecretRef (موفرو `env`/`file`/`exec`)، راجع [إدارة الأسرار](/ar/gateway/secrets).
أما قواعد أهلية بيانات الاعتماد/رموز الأسباب المستخدمة بواسطة `models status --probe`، فراجع
[دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics).

## الإعداد الموصى به (مفتاح API، أي مزوّد)

إذا كنت تشغّل gateway طويل الأمد، فابدأ بمفتاح API للمزوّد الذي اخترته.
وبالنسبة إلى Anthropic تحديدًا، تظل مصادقة مفتاح API هي إعداد الخادم الأكثر
قابلية للتنبؤ، لكن OpenClaw يدعم أيضًا إعادة استخدام تسجيل دخول Claude CLI المحلي.

1. أنشئ مفتاح API في وحدة تحكم المزوّد لديك.
2. ضعه على **مضيف gateway** (الجهاز الذي يشغّل `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. إذا كان Gateway يعمل تحت systemd/launchd، فالأفضل وضع المفتاح في
   `~/.openclaw/.env` حتى يتمكن daemon من قراءته:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

ثم أعد تشغيل daemon (أو أعد تشغيل عملية Gateway) وتحقق مرة أخرى:

```bash
openclaw models status
openclaw doctor
```

إذا كنت تفضّل ألا تدير متغيرات البيئة بنفسك، فيمكن لعملية الإعداد الأولي تخزين
مفاتيح API لاستخدام daemon: `openclaw onboard`.

راجع [المساعدة](/ar/help) لمعرفة تفاصيل توريث البيئة (`env.shellEnv`,
`~/.openclaw/.env`، systemd/launchd).

## Anthropic: Claude CLI وتوافق token

لا تزال مصادقة setup-token الخاصة بـ Anthropic متاحة في OpenClaw كمسار
token مدعوم. وقد أبلغنا فريق Anthropic منذ ذلك الحين أن استخدام Claude CLI
بأسلوب OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI
واستخدام `claude -p` على أنهما مساران معتمدان لهذا التكامل ما لم تنشر
Anthropic سياسة جديدة. وعندما يكون إعادة استخدام Claude CLI متاحًا على المضيف،
فإنه يصبح الآن المسار المفضّل.

وبالنسبة إلى مضيفي gateway طويلَي الأمد، يظل مفتاح API الخاص بـ Anthropic
هو الإعداد الأكثر قابلية للتنبؤ. وإذا كنت تريد إعادة استخدام تسجيل دخول Claude الحالي
على المضيف نفسه، فاستخدم مسار Anthropic Claude CLI في onboard/configure.

إعداد المضيف الموصى به لإعادة استخدام Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

هذا إعداد من خطوتين:

1. سجّل دخول Claude Code نفسه إلى Anthropic على مضيف gateway.
2. أخبر OpenClaw بأن يبدّل اختيار نموذج Anthropic إلى الواجهة الخلفية المحلية `claude-cli`
   وأن يخزّن ملف المصادقة الشخصي المطابق في OpenClaw.

إذا لم يكن `claude` موجودًا على `PATH`، فإما أن تثبّت Claude Code أولًا أو تضبط
`agents.defaults.cliBackends.claude-cli.command` على المسار الحقيقي للملف التنفيذي.

إدخال token يدويًا (أي مزوّد؛ يكتب `auth-profiles.json` + يحدّث الإعدادات):

```bash
openclaw models auth paste-token --provider openrouter
```

كما أن مراجع ملفات المصادقة الشخصية مدعومة أيضًا لبيانات الاعتماد الثابتة:

- يمكن لبيانات اعتماد `api_key` استخدام `keyRef: { source, provider, id }`
- يمكن لبيانات اعتماد `token` استخدام `tokenRef: { source, provider, id }`
- لا تدعم الملفات الشخصية في وضع OAuth بيانات الاعتماد عبر SecretRef؛ فإذا كانت `auth.profiles.<id>.mode` مضبوطة على `"oauth"`، فسيُرفض إدخال `keyRef`/`tokenRef` المعتمد على SecretRef لذلك الملف.

فحص مناسب للأتمتة (الخروج `1` عند الانتهاء/الغياب، و`2` عند قرب الانتهاء):

```bash
openclaw models status --check
```

اختبارات مصادقة حية:

```bash
openclaw models status --probe
```

ملاحظات:

- يمكن أن تأتي صفوف الاختبار من ملفات المصادقة، أو بيانات اعتماد البيئة، أو `models.json`.
- إذا كان `auth.order.<provider>` الصريح يستبعد ملفًا مخزنًا، فإن الاختبار يبلّغ
  عن `excluded_by_auth_order` لذلك الملف بدلًا من تجربته.
- إذا كانت المصادقة موجودة لكن OpenClaw لا يستطيع تحليل مرشح نموذج قابل للاختبار
  لذلك المزوّد، فإن الاختبار يبلّغ عن `status: no_model`.
- يمكن أن تكون فترات التهدئة الخاصة بحدود المعدل مقيدة بالنموذج. وقد يظل الملف
  الموجود في فترة تهدئة لنموذج واحد قابلًا للاستخدام لنموذج شقيق على المزوّد نفسه.

توجد نصوص التشغيل الاختيارية (systemd/Termux) موثقة هنا:
[نصوص مراقبة المصادقة](/ar/help/scripts#auth-monitoring-scripts)

## ملاحظة Anthropic

الواجهة الخلفية `claude-cli` الخاصة بـ Anthropic مدعومة مجددًا.

- أبلغنا فريق Anthropic أن مسار تكامل OpenClaw هذا مسموح به مرة أخرى.
- لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` باعتبارهما معتمدين
  لعمليات التشغيل المدعومة من Anthropic ما لم تنشر Anthropic سياسة جديدة.
- تظل مفاتيح API الخاصة بـ Anthropic الخيار الأكثر قابلية للتنبؤ لمضيفي gateway
  طويلَي الأمد وللتحكم الصريح في الفوترة على جانب الخادم.

## التحقق من حالة مصادقة النموذج

```bash
openclaw models status
openclaw doctor
```

## سلوك تدوير مفاتيح API (gateway)

يدعم بعض المزوّدين إعادة محاولة الطلب باستخدام مفاتيح بديلة عندما تؤدي
استدعاءات API إلى بلوغ حد المعدل لدى المزوّد.

- ترتيب الأولوية:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز واحد)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- يتضمن مزوّدو Google أيضًا `GOOGLE_API_KEY` كرجوع احتياطي إضافي.
- تتم إزالة التكرارات من قائمة المفاتيح نفسها قبل الاستخدام.
- يعيد OpenClaw المحاولة باستخدام المفتاح التالي فقط عند أخطاء حد المعدل (مثل
  `429`، أو `rate_limit`، أو `quota`، أو `resource exhausted`، أو `Too many concurrent
requests`، أو `ThrottlingException`، أو `concurrency limit reached`، أو
  `workers_ai ... quota limit exceeded`).
- لا تتم إعادة محاولة الأخطاء غير المرتبطة بحد المعدل بمفاتيح بديلة.
- إذا فشلت جميع المفاتيح، تتم إعادة الخطأ النهائي من آخر محاولة.

## التحكم في بيانات الاعتماد المستخدمة

### لكل جلسة (أمر دردشة)

استخدم `/model <alias-or-id>@<profileId>` لتثبيت بيانات اعتماد مزوّد معينة للجلسة الحالية (أمثلة على معرّفات الملفات: `anthropic:default`، `anthropic:work`).

استخدم `/model` (أو `/model list`) لمنتقٍ مضغوط؛ واستخدم `/model status` للعرض الكامل (المرشحون + ملف المصادقة التالي، بالإضافة إلى تفاصيل نقطة نهاية المزوّد عند ضبطها).

### لكل وكيل (تجاوز CLI)

اضبط تجاوزًا صريحًا لترتيب ملفات المصادقة لوكيل (يُخزَّن في `auth-state.json` لذلك الوكيل):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

استخدم `--agent <id>` لاستهداف وكيل محدد؛ واحذفه لاستخدام الوكيل الافتراضي المضبوط.
وعندما تصحح أخطاء الترتيب، يعرض `openclaw models status --probe` الملفات
المخزنة المستبعَدة على أنها `excluded_by_auth_order` بدلًا من تخطيها بصمت.
وعندما تصحح أخطاء فترات التهدئة، فتذكر أن فترات التهدئة الخاصة بحدود المعدل قد تكون مرتبطة
بمعرّف نموذج واحد بدلًا من ملف المزوّد بالكامل.

## استكشاف الأخطاء وإصلاحها

### "No credentials found"

إذا كان ملف Anthropic مفقودًا، فاضبط مفتاح API لـ Anthropic على
**مضيف gateway** أو أعد إعداد مسار setup-token الخاص بـ Anthropic، ثم تحقق مرة أخرى:

```bash
openclaw models status
```

### token على وشك الانتهاء/منتهية

شغّل `openclaw models status` لتأكيد أي ملف على وشك الانتهاء. وإذا كان ملف token
الخاص بـ Anthropic مفقودًا أو منتهيًا، فحدّث هذا الإعداد عبر
setup-token أو انتقل إلى مفتاح API خاص بـ Anthropic.

## ذو صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [الوصول عن بُعد](/ar/gateway/remote)
- [تخزين المصادقة](/ar/concepts/oauth)
