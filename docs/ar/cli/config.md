---
read_when:
    - تريد قراءة التهيئة أو تعديلها دون تفاعل
summary: مرجع CLI لـ `openclaw config` (get/set/unset/file/schema/validate)
title: التهيئة
x-i18n:
    generated_at: "2026-04-25T13:43:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

مساعدات التهيئة لإجراء تعديلات غير تفاعلية في `openclaw.json`: ‏get/set/unset/file/schema/validate
للقيم حسب المسار وطباعة ملف التهيئة النشط. شغّل الأمر دون أمر فرعي
لفتح معالج التهيئة (كما في `openclaw configure`).

خيارات الجذر:

- `--section <section>`: مرشح أقسام الإعداد الموجّه القابل للتكرار عند تشغيل `openclaw config` دون أمر فرعي

أقسام الإعداد الموجّه المدعومة:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## أمثلة

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

اطبع JSON schema المُولَّد لـ `openclaw.json` إلى stdout بصيغة JSON.

ما الذي يتضمنه:

- مخطط التهيئة الجذرية الحالي، بالإضافة إلى حقل سلسلة `$schema` جذري لأدوات المحرر
- بيانات `title` و`description` الوصفية للحقول المستخدمة من قبل Control UI
- ترث عُقد الكائنات المتداخلة، وعناصر wildcard (`*`)، وعناصر المصفوفات (`[]`) بيانات `title` / `description` الوصفية نفسها عند وجود توثيق مطابق للحقل
- ترث فروع `anyOf` / `oneOf` / `allOf` أيضًا بيانات التوثيق الوصفية نفسها عند وجود توثيق مطابق للحقل
- بيانات وصفية آنية لأفضل جهد لمخططات Plugin + القناة عندما يمكن تحميل manifests وقت التشغيل
- مخطط fallback نظيف حتى عندما تكون التهيئة الحالية غير صالحة

RPC وقت التشغيل ذو الصلة:

- يعرض `config.schema.lookup` مسار تهيئة واحدًا مُطبَّعًا مع عقدة مخطط سطحية (`title`, `description`, `type`, `enum`, `const`, والحدود الشائعة)،
  وبيانات وصفية مطابقة لتلميحات UI، وملخصات الأبناء المباشرين. استخدمه
  للتعمق المقيَّد بالمسار في Control UI أو العملاء المخصصين.

```bash
openclaw config schema
```

مرّره إلى ملف عندما تريد فحصه أو التحقق منه باستخدام أدوات أخرى:

```bash
openclaw config schema > openclaw.schema.json
```

### المسارات

تستخدم المسارات صيغة النقطة أو الأقواس:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

استخدم فهرس قائمة الوكيل لاستهداف وكيل محدد:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## القيم

تُحلَّل القيم كـ JSON5 عندما يكون ذلك ممكنًا؛ وإلا فتُعامل كسلاسل نصية.
استخدم `--strict-json` لفرض تحليل JSON5. وما زال `--json` مدعومًا كاسم بديل قديم.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الخام كـ JSON بدلًا من النص المنسق للطرفية.

يستبدل إسناد الكائن المسار المستهدف افتراضيًا. وترفض مسارات الخرائط/القوائم
المحمية التي تحتوي عادةً على إدخالات مضافة من المستخدم، مثل `agents.defaults.models`،
و`models.providers`، و`models.providers.<id>.models`، و`plugins.entries`، و
`auth.profiles`، عمليات الاستبدال التي قد تزيل إدخالات موجودة ما لم
تمرر `--replace`.

استخدم `--merge` عند إضافة إدخالات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما تريد عمدًا أن تصبح القيمة المقدمة
هي القيمة الكاملة للمسار المستهدف.

## أوضاع `config set`

يدعم `openclaw config set` أربعة أنماط للإسناد:

1. وضع القيمة: `openclaw config set <path> <value>`
2. وضع إنشاء SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. وضع إنشاء الموفّر (للمسار `secrets.providers.<alias>` فقط):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. وضع الدُفعات (`--batch-json` أو `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

ملاحظة حول السياسة:

- تُرفض إسنادات SecretRef على الأسطح غير المدعومة القابلة للتغيير وقت التشغيل (مثل `hooks.token`، و`commands.ownerDisplaySecret`، وWebhook tokens الخاصة بربط سلاسل Discord، وWhatsApp creds JSON). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).

يستخدم تحليل الدُفعات دائمًا حمولة الدفعة (`--batch-json`/`--batch-file`) كمصدر موثوق.
لا يغيّر `--strict-json` / `--json` سلوك تحليل الدُفعات.

يبقى وضع مسار/قيمة JSON مدعومًا لكل من SecretRefs والموفّرين:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## أعلام إنشاء الموفّر

يجب أن تستخدم أهداف إنشاء الموفّر `secrets.providers.<alias>` كمسار.

الأعلام الشائعة:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

موفّر env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (قابل للتكرار)

موفّر file (`--provider-source file`):

- `--provider-path <path>` (مطلوب)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

موفّر exec (`--provider-source exec`):

- `--provider-command <path>` (مطلوب)
- `--provider-arg <arg>` (قابل للتكرار)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (قابل للتكرار)
- `--provider-pass-env <ENV_VAR>` (قابل للتكرار)
- `--provider-trusted-dir <path>` (قابل للتكرار)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

مثال لموفّر exec مُقسى:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## تشغيل تجريبي

استخدم `--dry-run` للتحقق من صحة التغييرات دون كتابة `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

سلوك التشغيل التجريبي:

- وضع الإنشاء: يشغّل فحوصات قابلية حل SecretRef للمراجع/الموفّرين المتغيرين.
- وضع JSON (`--strict-json` أو `--json` أو وضع الدُفعات): يشغّل التحقق من المخطط بالإضافة إلى فحوصات قابلية حل SecretRef.
- يجري أيضًا التحقق من السياسة للأسطح المستهدفة المعروفة غير المدعومة لـ SecretRef.
- تقيّم فحوصات السياسة التهيئة الكاملة بعد التغيير، لذلك لا يمكن لكتابات الكائنات الأصلية (مثل تعيين `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
- تُتخطى فحوصات SecretRef الخاصة بـ exec افتراضيًا أثناء التشغيل التجريبي لتجنب الآثار الجانبية للأوامر.
- استخدم `--allow-exec` مع `--dry-run` لتمكين فحوصات SecretRef الخاصة بـ exec (قد يؤدي ذلك إلى تنفيذ أوامر الموفّر).
- `--allow-exec` مخصص للتشغيل التجريبي فقط ويُرجع خطأ إذا استُخدم دون `--dry-run`.

يطبع `--dry-run --json` تقريرًا قابلاً للقراءة آليًا:

- `ok`: ما إذا كان التشغيل التجريبي قد نجح
- `operations`: عدد عمليات الإسناد التي تم تقييمها
- `checks`: ما إذا كانت فحوصات المخطط/قابلية الحل قد أُجريت
- `checks.resolvabilityComplete`: ما إذا كانت فحوصات قابلية الحل قد اكتملت (تكون false عند تخطي مراجع exec)
- `refsChecked`: عدد المراجع التي تم حلّها فعليًا أثناء التشغيل التجريبي
- `skippedExecRefs`: عدد مراجع exec التي تم تخطيها لأن `--allow-exec` لم يُضبط
- `errors`: حالات فشل منظمة للمخطط/قابلية الحل عندما يكون `ok=false`

### شكل إخراج JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // موجود لأخطاء قابلية الحل
    },
  ],
}
```

مثال نجاح:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

مثال فشل:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

إذا فشل التشغيل التجريبي:

- `config schema validation failed`: شكل التهيئة بعد التغيير غير صالح؛ أصلح المسار/القيمة أو شكل كائن الموفّر/المرجع.
- `Config policy validation failed: unsupported SecretRef usage`: انقل بيانات الاعتماد هذه مرة أخرى إلى إدخال plaintext/string وأبقِ SecretRefs على الأسطح المدعومة فقط.
- `SecretRef assignment(s) could not be resolved`: لا يمكن حاليًا حل الموفّر/المرجع المشار إليه (متغير بيئة مفقود، أو مؤشر ملف غير صالح، أو فشل موفّر exec، أو عدم تطابق الموفّر/المصدر).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: تخطى التشغيل التجريبي مراجع exec؛ أعد التشغيل مع `--allow-exec` إذا كنت بحاجة إلى التحقق من قابلية حل exec.
- بالنسبة إلى وضع الدُفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

## أمان الكتابة

يتحقق `openclaw config set` وكتّاب التهيئة الآخرين المملوكين لـ OpenClaw من صحة
التهيئة الكاملة بعد التغيير قبل تثبيتها على القرص. إذا فشلت الحمولة الجديدة في
التحقق من المخطط أو بدت كأنها استبدال تدميري، تُترك التهيئة النشطة كما هي
وتُحفظ الحمولة المرفوضة بجانبها باسم `openclaw.json.rejected.*`.
يجب أن يكون مسار التهيئة النشط ملفًا عاديًا. تخطيطات `openclaw.json`
الرمزية عبر symlink غير مدعومة للكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرة
إلى الملف الحقيقي بدلًا من ذلك.

فضّل الكتابة عبر CLI للتعديلات الصغيرة:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

إذا رُفضت كتابة، فافحص الحمولة المحفوظة وأصلح شكل التهيئة الكامل:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

لا تزال الكتابة المباشرة من المحرر مسموحًا بها، لكن Gateway الجاري تشغيله يتعامل معها على أنها
غير موثوقة إلى أن تجتاز التحقق. ويمكن استعادة التعديلات المباشرة غير الصالحة من
النسخة الاحتياطية الأخيرة المعروفة الصالحة أثناء بدء التشغيل أو إعادة التحميل الساخنة. راجع
[استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config).

تقتصر استعادة الملف الكامل على حالات التهيئة المعطلة عالميًا، مثل
أخطاء التحليل، أو فشل schema على مستوى الجذر، أو فشل ترحيل قديم، أو حالات الفشل المختلطة
بين Plugin والجذر. وإذا فشل التحقق فقط ضمن `plugins.entries.<id>...`،
فإن OpenClaw يبقي `openclaw.json` النشط في مكانه ويبلّغ عن المشكلة المحلية الخاصة بـ Plugin
بدلًا من استعادة `.last-good`. ويمنع هذا تغييرات schema الخاصة بـ Plugin أو عدم توافق
`minHostVersion` من التسبب في التراجع عن إعدادات المستخدم الأخرى غير المرتبطة، مثل models،
وproviders، وملفات auth profiles، والقنوات، وتعريض Gateway، والأدوات، والذاكرة، والمتصفح، أو
تهيئة Cron.

## الأوامر الفرعية

- `config file`: اطبع مسار ملف التهيئة النشط (المحلول من `OPENCLAW_CONFIG_PATH` أو من الموقع الافتراضي). يجب أن يشير المسار إلى ملف عادي، وليس symlink.

أعد تشغيل Gateway بعد التعديلات.

## Validate

تحقق من التهيئة الحالية مقابل schema النشطة دون بدء
Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

بعد نجاح `openclaw config validate`، يمكنك استخدام TUI المحلية بحيث يقوم
وكيل مضمّن بمقارنة التهيئة النشطة مع المستندات بينما تتحقق من
كل تغيير من الطرفية نفسها:

إذا كان التحقق يفشل بالفعل، فابدأ باستخدام `openclaw configure` أو
`openclaw doctor --fix`. ولا يتجاوز `openclaw chat` حاجز التهيئة غير الصالحة.

```bash
openclaw chat
```

ثم داخل TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

حلقة إصلاح نموذجية:

- اطلب من الوكيل مقارنة تهيئتك الحالية بصفحة المستندات ذات الصلة واقتراح أصغر إصلاح ممكن.
- طبّق تعديلات مستهدفة باستخدام `openclaw config set` أو `openclaw configure`.
- أعد تشغيل `openclaw config validate` بعد كل تغيير.
- إذا نجح التحقق لكن بيئة التشغيل ما زالت غير سليمة، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [التهيئة](/ar/gateway/configuration)
