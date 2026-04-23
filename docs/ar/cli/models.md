---
read_when:
    - تريد تغيير النماذج الافتراضية أو عرض حالة مصادقة provider
    - تريد فحص النماذج/موفري الخدمة المتاحين وتصحيح أخطاء ملفات تعريف المصادقة
summary: مرجع CLI لـ `openclaw models` (`status`/`list`/`set`/`scan`، والأسماء المستعارة، وبدائل fallback، والمصادقة)
title: النماذج
x-i18n:
    generated_at: "2026-04-23T07:22:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

اكتشاف النماذج وفحصها وتكوينها (النموذج الافتراضي، وبدائل fallback، وملفات تعريف المصادقة).

ذو صلة:

- موفرو الخدمة + النماذج: [النماذج](/ar/providers/models)
- مفاهيم اختيار النموذج + أمر slash `/models`: [مفهوم النماذج](/ar/concepts/models)
- إعداد مصادقة provider: [البدء](/ar/start/getting-started)

## الأوامر الشائعة

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

يعرض `openclaw models status` القيم المحلولة للنموذج الافتراضي وبدائل fallback بالإضافة إلى نظرة عامة على المصادقة.
وعند توفر لقطات استخدام provider، يتضمن قسم حالة OAuth/API-key
نوافذ استخدام provider ولقطات quota.
موفرو الخدمة الحاليون لنافذة الاستخدام هم: Anthropic وGitHub Copilot وGemini CLI وOpenAI
Codex وMiniMax وXiaomi وz.ai. وتأتي مصادقة الاستخدام من hooks خاصة بالـ provider
عندما تكون متاحة؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/API-key
من ملفات تعريف المصادقة أو env أو التكوين.
في مخرجات `--json`، يكون `auth.providers` هو العرض العام للـ provider
المدرك للـ env/config/store، بينما يكون `auth.oauth` هو صحة ملف تعريف مخزن المصادقة فقط.
أضف `--probe` لتشغيل probes حية للمصادقة على كل ملف تعريف provider مُكوَّن.
هذه probes هي طلبات حقيقية (وقد تستهلك tokens وتفعّل حدود المعدل).
استخدم `--agent <id>` لفحص حالة النموذج/المصادقة الخاصة بوكيل مُكوَّن. وعند عدم تحديده،
يستخدم الأمر `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` إذا كان مضبوطًا، وإلا
فيستخدم الوكيل الافتراضي المُكوَّن.
قد تأتي صفوف probe من ملفات تعريف المصادقة، أو بيانات اعتماد env، أو `models.json`.

ملاحظات:

- يقبل `models set <model-or-alias>` الصيغة `provider/model` أو اسمًا مستعارًا.
- يتضمن `models list --all` صفوف الكتالوج الثابتة المملوكة للـ provider والمضمّنة حتى
  عندما لا تكون قد أجريت المصادقة مع ذلك الـ provider بعد. وستظل هذه الصفوف معروضة
  على أنها غير متاحة إلى أن تُضبط مصادقة مطابقة.
- يفلتر `models list --provider <id>` حسب معرّف provider، مثل `moonshot` أو
  `openai-codex`. وهو لا يقبل تسميات العرض من منتقيات provider التفاعلية،
  مثل `Moonshot AI`.
- تُحلّل مراجع النموذج عبر التقسيم عند **أول** `/`. وإذا كان معرّف النموذج يتضمن `/` (بنمط OpenRouter)، فضمّن بادئة provider (مثال: `openrouter/moonshotai/kimi-k2`).
- إذا حذفت provider، فسيحل OpenClaw الإدخال أولًا كاسم مستعار، ثم
  كمطابقة فريدة للـ provider المُكوَّن لذلك المعرّف الدقيق للنموذج، وبعدها فقط
  يعود إلى provider الافتراضي المُكوَّن مع تحذير deprecation.
  وإذا لم يعد ذلك الـ provider يوفّر النموذج الافتراضي المُكوَّن، فسيعود OpenClaw
  إلى أول provider/model مُكوَّن بدلًا من إظهار
  قيمة افتراضية قديمة لprovider تمت إزالته.
- قد يعرض `models status` القيمة `marker(<value>)` في مخرجات المصادقة للعناصر النائبة غير السرية (مثل `OPENAI_API_KEY` أو `secretref-managed` أو `minimax-oauth` أو `oauth:chutes` أو `ollama-local`) بدلًا من إخفائها كأسرار.

### `models status`

الخيارات:

- `--json`
- `--plain`
- `--check` (رمز الخروج 1=منتهي/مفقود، 2=قارب على الانتهاء)
- `--probe` (probe حي لملفات تعريف المصادقة المُكوَّنة)
- `--probe-provider <name>` (probe لـ provider واحد)
- `--probe-profile <id>` (قابل للتكرار أو مفصول بفواصل لعدة profile ids)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (معرّف وكيل مُكوَّن؛ يتجاوز `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

فئات حالة probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

حالات detail/reason-code المتوقعة في probe:

- `excluded_by_auth_order`: يوجد ملف تعريف مخزّن، لكن
  `auth.order.<provider>` الصريح استبعده، لذلك يبلغ probe عن هذا الاستبعاد بدلًا
  من محاولة استخدامه.
- `missing_credential` و`invalid_expires` و`expired` و`unresolved_ref`:
  ملف التعريف موجود لكنه غير مؤهل/غير قابل للحل.
- `no_model`: توجد مصادقة provider، لكن OpenClaw لم يتمكن من حل
  مرشح نموذج قابل للفحص لذلك الـ provider.

## الأسماء المستعارة + بدائل fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## ملفات تعريف المصادقة

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` هو مساعد المصادقة التفاعلي. ويمكنه تشغيل تدفق مصادقة provider
(OAuth/API key) أو إرشادك إلى لصق token يدويًا، بحسب
الـ provider الذي تختاره.

يشغّل `models auth login` تدفق مصادقة Plugin provider (OAuth/API key). استخدم
`openclaw plugins list` لمعرفة موفري الخدمة المثبّتين.

أمثلة:

```bash
openclaw models auth login --provider openai-codex --set-default
```

ملاحظات:

- يظل `setup-token` و`paste-token` أوامر token عامة لموفري الخدمة
  الذين يوفّرون أساليب مصادقة قائمة على token.
- يتطلب `setup-token` بيئة TTY تفاعلية ويشغّل
  أسلوب token-auth الخاص بالـ provider (ويفترض افتراضيًا أسلوب `setup-token` لذلك الـ provider عندما يوفّر
  واحدًا).
- يقبل `paste-token` سلسلة token مولدة في مكان آخر أو من الأتمتة.
- يتطلب `paste-token` الخيار `--provider`، ويطلب قيمة token، ويكتبها
  إلى profile id الافتراضي `<provider>:manual` ما لم تمرر
  `--profile-id`.
- يخزّن `paste-token --expires-in <duration>` وقت انتهاء token مطلقًا من
  مدة نسبية مثل `365d` أو `12h`.
- ملاحظة Anthropic: أبلغنا فريق Anthropic أن استخدام Claude CLI بنمط OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` باعتبارهما مسموحًا بهما لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- يظل `setup-token` / `paste-token` الخاصان بـ Anthropic متاحين كمسار token مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
