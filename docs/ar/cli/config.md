---
read_when:
    - تريد قراءة التكوين أو تعديله بشكل غير تفاعلي
summary: مرجع CLI لـ `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: التكوين
x-i18n:
    generated_at: "2026-04-23T07:21:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

مساعدات التكوين لإجراء تعديلات غير تفاعلية في `openclaw.json`: قراءة/تعيين/إلغاء تعيين/ملف/مخطط/التحقق من
القيم حسب المسار وطباعة ملف التكوين النشط. شغّل الأمر من دون أمر فرعي من أجل
فتح معالج التكوين (وهو نفسه `openclaw configure`).

خيارات الجذر:

- `--section <section>`: مرشّح أقسام إعداد موجّه قابل للتكرار عند تشغيل `openclaw config` بدون أمر فرعي

الأقسام الموجّهة المدعومة:

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
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

اطبع مخطط JSON المُولّد لـ `openclaw.json` إلى stdout بصيغة JSON.

ما الذي يتضمنه:

- مخطط التكوين الجذري الحالي، بالإضافة إلى حقل سلسلة `$schema` على مستوى الجذر لأدوات المحرر
- بيانات التوثيق الوصفية للحقلين `title` و`description` المستخدمة بواسطة Control UI
- ترث عُقد الكائنات المتداخلة، والبدائل العامة (`*`)، وعناصر المصفوفة (`[]`) نفس بيانات `title` / `description` الوصفية عند وجود توثيق حقول مطابق
- ترث فروع `anyOf` / `oneOf` / `allOf` أيضًا نفس بيانات التوثيق الوصفية عند وجود توثيق حقول مطابق
- بيانات مخطط وصفية حية على أفضل جهد للـ Plugin + القناة عندما يمكن تحميل manifest وقت التشغيل
- مخططًا احتياطيًا نظيفًا حتى عندما يكون التكوين الحالي غير صالح

RPC وقت التشغيل ذو الصلة:

- يعيد `config.schema.lookup` مسار تكوين واحدًا بعد تطبيعه مع
  عقدة مخطط سطحية (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة)،
  وبيانات hints لواجهة المستخدم المطابقة، وملخصات الأبناء المباشرين. استخدمه من أجل
  التعمق المقيّد بالمسار في Control UI أو العملاء المخصصين.

```bash
openclaw config schema
```

مرّره إلى ملف عندما تريد فحصه أو التحقق منه باستخدام أدوات أخرى:

```bash
openclaw config schema > openclaw.schema.json
```

### المسارات

تستخدم المسارات ترميز النقطة أو الأقواس:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

استخدم فهرس قائمة الوكلاء لاستهداف وكيل محدد:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## القيم

تُحلَّل القيم بصيغة JSON5 عندما يكون ذلك ممكنًا؛ وإلا فتُعامل كسلاسل نصية.
استخدم `--strict-json` لفرض تحليل JSON5. ولا يزال `--json` مدعومًا كاسم بديل قديم.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الخام بصيغة JSON بدلًا من نص منسق للطرفية.

يستبدل إسناد الكائنات المسار المستهدف افتراضيًا. وترفض مسارات الخرائط/القوائم المحمية
التي تحتفظ عادةً بإدخالات يضيفها المستخدم، مثل `agents.defaults.models`
و`models.providers` و`models.providers.<id>.models` و`plugins.entries` و
`auth.profiles`، عمليات الاستبدال التي قد تزيل إدخالات موجودة ما لم
تمرر `--replace`.

استخدم `--merge` عند إضافة إدخالات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما تريد عمدًا أن تصبح القيمة المقدمة
هي القيمة الكاملة للمسار المستهدف.

## أوضاع `config set`

يدعم `openclaw config set` أربعة أنماط للإسناد:

1. وضع القيمة: `openclaw config set <path> <value>`
2. وضع مُنشئ SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. وضع مُنشئ provider (لمسار `secrets.providers.<alias>` فقط):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. وضع الدفعات (`--batch-json` أو `--batch-file`):

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

ملاحظة سياسة:

- تُرفض إسنادات SecretRef على الأسطح غير المدعومة القابلة للتغيير وقت التشغيل (مثل `hooks.token` و`commands.ownerDisplaySecret` وWebhook tokens الخاصة بربط خيوط Discord وWhatsApp creds JSON). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).

يستخدم تحليل الدفعات دائمًا حمولة الدفعة (`--batch-json`/`--batch-file`) كمصدر وحيد للحقيقة.
ولا يغير `--strict-json` / `--json` سلوك تحليل الدفعات.

يبقى وضع مسار/قيمة JSON مدعومًا لكل من SecretRefs وproviders:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## إشارات مُنشئ Provider

يجب أن تستخدم أهداف مُنشئ provider المسار `secrets.providers.<alias>`.

الإشارات الشائعة:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider البيئة (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (قابلة للتكرار)

Provider الملف (`--provider-source file`):

- `--provider-path <path>` (مطلوب)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Provider التنفيذ (`--provider-source exec`):

- `--provider-command <path>` (مطلوب)
- `--provider-arg <arg>` (قابلة للتكرار)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (قابلة للتكرار)
- `--provider-pass-env <ENV_VAR>` (قابلة للتكرار)
- `--provider-trusted-dir <path>` (قابلة للتكرار)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

مثال على Provider تنفيذ مُحصّن:

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

استخدم `--dry-run` للتحقق من التغييرات دون الكتابة إلى `openclaw.json`.

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

- وضع المُنشئ: يشغّل فحوصات قابلية الحل لـ SecretRef الخاصة بالمراجع/المزوّدات المتغيرة.
- وضع JSON (`--strict-json` أو `--json` أو وضع الدفعات): يشغّل التحقق من المخطط بالإضافة إلى فحوصات قابلية حل SecretRef.
- يعمل أيضًا التحقق من السياسة لأسطح الأهداف المعروفة غير المدعومة لـ SecretRef.
- تقيّم فحوصات السياسة كامل التكوين بعد التغيير، لذلك لا يمكن لعمليات الكتابة على الكائن الأب (مثل تعيين `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
- تُتخطى فحوصات SecretRef التنفيذية افتراضيًا أثناء التشغيل التجريبي لتجنب الآثار الجانبية للأوامر.
- استخدم `--allow-exec` مع `--dry-run` للاشتراك في فحوصات SecretRef التنفيذية (قد يؤدي هذا إلى تنفيذ أوامر provider).
- `--allow-exec` مخصص للتشغيل التجريبي فقط ويعطي خطأ إذا استُخدم بدون `--dry-run`.

يطبع `--dry-run --json` تقريرًا قابلاً للقراءة آليًا:

- `ok`: ما إذا نجح التشغيل التجريبي
- `operations`: عدد عمليات الإسناد التي تم تقييمها
- `checks`: ما إذا شُغلت فحوصات المخطط/قابلية الحل
- `checks.resolvabilityComplete`: ما إذا اكتملت فحوصات قابلية الحل (تكون false عندما تُتخطى مراجع exec)
- `refsChecked`: عدد المراجع التي تم حلّها فعليًا أثناء التشغيل التجريبي
- `skippedExecRefs`: عدد مراجع exec التي تم تخطيها لأن `--allow-exec` لم يُضبط
- `errors`: حالات فشل المخطط/قابلية الحل المنظمة عندما يكون `ok=false`

### شكل مخرجات JSON

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

- `config schema validation failed`: شكل التكوين بعد التغيير غير صالح؛ صحح المسار/القيمة أو شكل كائن provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: أعد بيانات الاعتماد تلك إلى إدخال نص عادي/سلسلة نصية واحتفظ بـ SecretRefs على الأسطح المدعومة فقط.
- `SecretRef assignment(s) could not be resolved`: لا يمكن حاليًا حل provider/ref المشار إليه (متغير بيئة مفقود، أو مؤشر ملف غير صالح، أو فشل provider تنفيذي، أو عدم تطابق provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: تخطى التشغيل التجريبي مراجع exec؛ أعد التشغيل باستخدام `--allow-exec` إذا كنت تحتاج إلى التحقق من قابلية حل exec.
- بالنسبة إلى وضع الدفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

## أمان الكتابة

يقوم `openclaw config set` وكتّاب التكوين الآخرين المملوكين لـ OpenClaw بالتحقق من
كامل التكوين بعد التغيير قبل تثبيته على القرص. إذا فشلت الحمولة الجديدة في
التحقق من المخطط أو بدت كاستبدال تدميري، فسيُترك التكوين النشط كما هو
وتُحفظ الحمولة المرفوضة بجواره باسم `openclaw.json.rejected.*`.
ويجب أن يكون مسار التكوين النشط ملفًا عاديًا. أما التخطيطات ذات
`openclaw.json` المرتبط رمزيًا فهي غير مدعومة للكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرة
إلى الملف الحقيقي بدلًا من ذلك.

فضّل الكتابة عبر CLI للتعديلات الصغيرة:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

إذا رُفضت كتابة، فافحص الحمولة المحفوظة وصحح شكل التكوين الكامل:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

لا تزال الكتابة المباشرة من المحرر مسموحًا بها، لكن Gateway الجاري تشغيله يعاملها على أنها
غير موثوقة حتى تجتاز التحقق. ويمكن استعادة التعديلات المباشرة غير الصالحة من
النسخة الاحتياطية الأخيرة المعروفة بأنها صالحة أثناء بدء التشغيل أو إعادة التحميل السريع. راجع
[استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config).

## الأوامر الفرعية

- `config file`: اطبع مسار ملف التكوين النشط (بعد حله من `OPENCLAW_CONFIG_PATH` أو من الموقع الافتراضي). يجب أن يشير المسار إلى ملف عادي، وليس إلى رابط رمزي.

أعد تشغيل Gateway بعد التعديلات.

## التحقق

تحقق من التكوين الحالي مقابل المخطط النشط من دون بدء
Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

بعد نجاح `openclaw config validate`، يمكنك استخدام TUI المحلي ليقوم
وكيل مضمّن بمقارنة التكوين النشط مع الوثائق بينما تتحقق من
كل تغيير من الطرفية نفسها:

إذا كان التحقق يفشل بالفعل، فابدأ بـ `openclaw configure` أو
`openclaw doctor --fix`. لا يتجاوز `openclaw chat` حاجز
التكوين غير الصالح.

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

حلقة الإصلاح المعتادة:

- اطلب من الوكيل مقارنة التكوين الحالي لديك مع صفحة الوثائق ذات الصلة واقتراح أصغر إصلاح ممكن.
- طبّق تعديلات مستهدفة باستخدام `openclaw config set` أو `openclaw configure`.
- أعد تشغيل `openclaw config validate` بعد كل تغيير.
- إذا نجح التحقق لكن بيئة التشغيل لا تزال غير سليمة، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.
