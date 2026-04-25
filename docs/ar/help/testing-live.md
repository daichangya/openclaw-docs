---
read_when:
    - تشغيل اختبارات smoke الحية لمصفوفة النماذج / الواجهات الخلفية لـ CLI / ACP / موفري الوسائط
    - تصحيح أخطاء تحليل بيانات اعتماد الاختبارات الحية
    - إضافة اختبار حي جديد خاص بمزوّد معين
sidebarTitle: Live tests
summary: 'الاختبارات الحية (التي تلامس الشبكة): مصفوفة النماذج، والواجهات الخلفية لـ CLI، وACP، وموفرو الوسائط، وبيانات الاعتماد'
title: 'الاختبار: الأجنحة الحية'
x-i18n:
    generated_at: "2026-04-25T13:49:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9b2c2954eddd1b911dde5bb3a834a6f9429c91429f3fb07a509eec80183cc52
    source_path: help/testing-live.md
    workflow: 15
---

للبدء السريع، ومشغّلات QA، وأجنحة unit/integration، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة أجنحة الاختبار **الحية** (التي تلامس الشبكة):
مصفوفة النماذج، والواجهات الخلفية لـ CLI، وACP، واختبارات موفري الوسائط الحية، بالإضافة
إلى التعامل مع بيانات الاعتماد.

## حي: أوامر smoke للملف الشخصي المحلي

قم بتحميل `~/.profile` قبل الفحوصات الحية المخصصة حتى تتطابق مفاتيح المزوّد ومسارات الأدوات المحلية
مع صدفتك:

```bash
source ~/.profile
```

اختبار smoke آمن للوسائط:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

اختبار smoke آمن لجهوزية المكالمات الصوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

يكون `voicecall smoke` تشغيلًا تجريبيًا ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة إشعار فعلية. وبالنسبة إلى Twilio وTelnyx و
Plivo، يتطلب فحص الجهوزية الناجح عنوان webhook عامًا؛ أما حلول loopback/البدائل المحلية فقط أو الخاصة
فتُرفض عمدًا.

## حي: مسح شامل لإمكانات عقدة Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلَن حاليًا** بواسطة عقدة Android متصلة والتحقق من سلوك عقد الأوامر.
- النطاق:
  - إعداد مسبق/يدوي (لا يقوم الجناح بتثبيت التطبيق أو تشغيله أو إقرانه).
  - التحقق من `node.invoke` عبر gateway لكل أمر للعقدة المحددة في Android.
- الإعداد المسبق المطلوب:
  - يجب أن يكون تطبيق Android متصلًا بالفعل ومقترنًا مع gateway.
  - يجب إبقاء التطبيق في الواجهة الأمامية.
  - يجب منح الأذونات/الموافقة على الالتقاط للإمكانات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## حي: smoke للنماذج (مفاتيح الملفات الشخصية)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- تخبرنا "النموذج المباشر" ما إذا كان المزوّد/النموذج يمكنه الإجابة أصلًا باستخدام المفتاح المعطى.
- يخبرنا "smoke للـ Gateway" ما إذا كان المسار الكامل لـ gateway+agent يعمل لهذا النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال مباشر للنموذج (من دون gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لتحديد النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (ومعالجات استهدافية عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذا الجناح فعليًا؛ وإلا فسيُتخطى حتى يظل `pnpm test:live` مركّزًا على smoke الخاص بـ gateway
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وDeepSeek V4، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح الحديثة/الشاملة حدًا منسقًا عالي الإشارة افتراضيًا؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا لحد أصغر.
  - تستخدم عمليات المسح الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` كمهلة كاملة لاختبار النموذج المباشر. الافتراضي: 60 دقيقة.
  - تعمل اختبارات النموذج المباشر بتوازٍ من 20 مسارًا افتراضيًا؛ اضبط `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل البيئة الاحتياطية
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- سبب وجود هذا:
  - لفصل "واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح" عن "مسار gateway agent معطل"
  - لاحتواء معالجات صغيرة ومعزولة (مثال: إعادة تشغيل reasoning في OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: smoke للـ Gateway + وكيل dev (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (مع تجاوز النموذج لكل تشغيل)
  - التكرار عبر النماذج التي لها مفاتيح والتحقق من:
    - استجابة "ذات معنى" (من دون أدوات)
    - نجاح استدعاء أداة حقيقي (اختبار read)
    - اختبارات أدوات إضافية اختيارية (اختبار exec+read)
    - استمرار عمل مسارات التراجع الخاصة بـ OpenAI (tool-call-only → follow-up)
- تفاصيل الاختبار (حتى تتمكن من شرح الإخفاقات بسرعة):
  - اختبار `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` قراءته ثم إعادة nonce.
  - اختبار `exec+read`: يطلب الاختبار من الوكيل كتابة nonce في ملف مؤقت عبر `exec` ثم `read` قراءته مجددًا.
  - اختبار الصورة: يرفق الاختبار ملف PNG مُنشأً (قط + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وDeepSeek V4، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات المسح الحديثة/الشاملة للـ gateway حدًا منسقًا عالي الإشارة افتراضيًا؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين (لتجنب "OpenRouter لكل شيء"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون اختبارات الأدوات + الصور مفعلة دائمًا في هذا الاختبار الحي:
  - اختبار `read` + اختبار `exec+read` (ضغط على الأدوات)
  - يعمل اختبار الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولّد الاختبار ملف PNG صغيرًا مع “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` إلى `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (مع تساهل OCR: الأخطاء البسيطة مسموحة)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## حي: smoke للواجهة الخلفية لـ CLI (Claude أو Codex أو Gemini أو CLIات محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + agent باستخدام واجهة خلفية CLI محلية، من دون لمس إعداداتك الافتراضية.
- تعيش الإعدادات الافتراضية لاختبارات smoke الخاصة بكل واجهة خلفية مع تعريف `cli-backend.ts` الخاص بالامتداد المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الإعدادات الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - سلوك الأمر/الوسيطات/الصورة يأتي من بيانات تعريف Plugin الواجهة الخلفية لـ CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في المطالبة). وتكون وصفات Docker معطّلة لهذا افتراضيًا ما لم يُطلب صراحة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسيطات CLI بدلًا من حقنها في المطالبة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسيطات الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في اختبار الاستمرارية داخل الجلسة نفسها Claude Sonnet -> Opus عندما يدعم النموذج المحدد هدف تبديل. وتكون وصفات Docker معطلة لهذا افتراضيًا من أجل موثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في اختبار loopback لـ MCP/tool. وتكون وصفات Docker معطلة لهذا افتراضيًا ما لم يُطلب صراحة.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-cli-backend
```

وصفات Docker لمزوّد واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد مشغّل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل smoke الحي للواجهة الخلفية لـ CLI داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحلل بيانات تعريف smoke الخاصة بالواجهة الخلفية لـ CLI من الامتداد المالك، ثم يثبّت حزمة CLI المطابقة الخاصة بـ Linux (`@anthropic-ai/claude-code`، أو `@openai/codex`، أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا ضمن `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth المحمولة لاشتراك Claude Code عبر `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. وهو يثبت أولًا نجاح `claude -p` المباشر في Docker، ثم يشغّل دورتين لـ Gateway CLI-backend من دون الحفاظ على متغيرات بيئة مفتاح Anthropic API. ويعطّل هذا المسار الخاص بالاشتراك اختبارات Claude MCP/tool والصورة افتراضيًا لأن Claude يوجّه حاليًا استخدام تطبيقات الجهات الخارجية عبر فوترة استخدام إضافي بدل حدود خطة الاشتراك العادية.
- أصبح smoke الحي للواجهة الخلفية لـ CLI الآن يمارس التدفق الكامل من طرف إلى طرف نفسه لكل من Claude وCodex وGemini: دورة نصية، ثم دورة تصنيف صورة، ثم استدعاء أداة `cron` في MCP والتحقق منه عبر gateway CLI.
- كما أن smoke الافتراضي لـ Claude يرقع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## حي: smoke لربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من التدفق الحقيقي لربط محادثات ACP مع وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قنوات رسائل اصطناعية في مكانها
  - إرسال متابعة عادية على نفس المحادثة
  - التحقق من أن المتابعة تصل إلى transcript جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP عند استخدام `pnpm test:live ...` مباشرة: `claude`
  - القناة الاصطناعية: سياق محادثة بنمط الرسائل المباشرة في Slack
  - الواجهة الخلفية لـ ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- ملاحظات:
  - يستخدم هذا المسار سطح `chat.send` الخاص بـ gateway مع حقول مسار أصل اصطناعية مخصصة للمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم الخارجي.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin `acpx` للوكيل المحدد ضمن أدوات اختبار ACP.

مثال:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-acp-bind
```

وصفات Docker لوكيل واحد:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

ملاحظات Docker:

- يوجد مشغّل Docker في `scripts/test-live-acp-bind-docker.sh`.
- افتراضيًا، يشغّل smoke ربط ACP مقابل وكلاء CLI الحية المجمعة بالتسلسل: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يقوم بتحميل `~/.profile`، وتجهيز مواد مصادقة CLI المطابقة داخل الحاوية، ثم يثبّت CLI الحي المطلوب (`@anthropic-ai/claude-code`، أو `@openai/codex`، أو `@google/gemini-cli`، أو `opencode-ai`) إذا كان مفقودًا. أما الواجهة الخلفية لـ ACP نفسها فهي الحزمة المضمّنة `acpx/runtime` من Plugin ‏`acpx`.
- إن متغير Docker الخاص بـ OpenCode هو مسار تراجعي صارم لوكيل واحد. فهو يكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (الافتراضي `opencode/kimi-k2.6`) بعد تحميل `~/.profile`، ويتطلب `pnpm test:docker:live-acp-bind:opencode` transcript مساعد مرتبطًا بدلًا من قبول التخطي العام بعد الربط.
- إن استدعاءات `acpx` المباشرة عبر CLI هي مسار يدوي/حل بديل فقط لمقارنة السلوك خارج Gateway. أما smoke ربط ACP في Docker فيمارس الواجهة الخلفية المضمّنة لـ `acpx` في OpenClaw.

## حي: smoke لحزام app-server الخاص بـ Codex

- الهدف: التحقق من حزام Codex المملوك لـ Plugin عبر طريقة `agent` العادية في gateway:
  - تحميل Plugin ‏`codex` المضمّن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال الدورة الأولى لوكيل gateway إلى `openai/gpt-5.2` مع فرض حزام Codex
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن
    thread الخاص بـ app-server يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر gateway نفسه
  - اختياريًا تشغيل اختباري shell تصعيديين مُراجعين من Guardian: أمر
    بسيط ينبغي الموافقة عليه، وأمر رفع سر مزيف ينبغي
    رفضه حتى يطلب الوكيل تأكيدًا
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.2`
- اختبار الصورة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- اختبار MCP/tool الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- اختبار Guardian الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يضبط smoke القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا يتمكن
  حزام Codex المعطل من النجاح عبر الرجوع بصمت إلى Pi.
- المصادقة: تأتي مصادقة app-server الخاصة بـ Codex من تسجيل اشتراك Codex المحلي. ويمكن
  لاختبارات Docker smoke أيضًا توفير `OPENAI_API_KEY` للاختبارات غير الخاصة بـ Codex عند الاقتضاء،
  بالإضافة إلى نسخ اختيارية من `~/.codex/auth.json` و`~/.codex/config.toml`.

وصفة محلية:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

وصفة Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

ملاحظات Docker:

- يوجد مشغّل Docker في `scripts/test-live-codex-harness-docker.sh`.
- يقوم بتحميل `~/.profile` المركّب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبت `@openai/codex` في بادئة npm
  قابلة للكتابة ومركّبة، ويجهز شجرة المصدر، ثم يشغّل اختبار Codex-harness الحي فقط.
- يفعّل Docker اختبارات الصورة، وMCP/tool، وGuardian افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيحي
  أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد
  الاختبار الحي حتى لا تتمكن الأسماء المستعارة القديمة أو الرجوع الاحتياطي إلى Pi من إخفاء
  تراجع حزام Codex.

### الوصفات الحية الموصى بها

تكون قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتقلب:

- نموذج واحد، مباشر (من دون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، smoke للـ gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke التفكير التكيفي لـ Google:
  - إذا كانت المفاتيح المحلية موجودة في ملف shell الشخصي: `source ~/.profile`
  - Gemini 3 الافتراضي الديناميكي: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 بميزانية ديناميكية: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بنمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` واجهة Gemini CLI المحلية على جهازك (مع مصادقة منفصلة وخصائص مختلفة للأدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مصادقة مفتاح API / ملف شخصي)؛ وهذا ما يقصده معظم المستخدمين بعبارة “Gemini”.
  - CLI: يستدعي OpenClaw ملف `gemini` التنفيذي المحلي عبر shell؛ وله مصادقته الخاصة وقد يتصرف بشكل مختلف (البث/دعم الأدوات/اختلاف الإصدارات).

## حي: مصفوفة النماذج (ما الذي نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (فالاختبارات الحية اختيارية)، لكن هذه هي النماذج **الموصى بها** للتغطية المنتظمة على جهاز تطوير يملك المفاتيح.

### مجموعة smoke الحديثة (استدعاء الأدوات + الصور)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع استمرار عمله:

- OpenAI (غير Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل smoke للـ gateway مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة مزوّد:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: `xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا يدعم الأدوات وقمت بتفعيله)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### Vision: إرسال الصور (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل يدعم الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل Claude/Gemini/متغيرات OpenAI الداعمة للرؤية، إلخ) لتشغيل اختبار الصورة.

### المجمّعات / البوابات البديلة

إذا كانت مفاتيحك مفعلة، فإننا ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين يدعمون الأدوات+الصور)
- OpenCode: ‏`opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

هناك مزوّدون آخرون يمكنك تضمينهم في المصفوفة الحية (إذا كانت لديك بيانات الاعتماد/الإعدادات):

- المضمّنون: `openai`، و`openai-codex`، و`anthropic`، و`google`، و`google-vertex`، و`google-antigravity`، و`google-gemini-cli`، و`zai`، و`openrouter`، و`opencode`، و`opencode-go`، و`xai`، و`groq`، و`cerebras`، و`mistral`، و`github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي proxy متوافق مع OpenAI/Anthropic (مثل LM Studio، وvLLM، وLiteLLM، وغيرها)

نصيحة: لا تحاول ترميز "جميع النماذج" بشكل ثابت في المستندات. فالقائمة المرجعية هي كل ما يعيده `discoverModels(...)` على جهازك + كل ما هو متاح من المفاتيح.

## بيانات الاعتماد (لا تقم أبدًا بحفظها في المستودع)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يستخدمها CLI. والآثار العملية لذلك:

- إذا كان CLI يعمل، فينبغي أن تجد الاختبارات الحية المفاتيح نفسها.
- إذا قال اختبار حي "لا توجد بيانات اعتماد"، فقم بتصحيح الخطأ بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات المصادقة الشخصية لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (وهذا هو المقصود بـ “profile keys” في الاختبارات الحية)
- الإعدادات: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المنزل المرحلي للاختبارات الحية عند وجوده، لكنه ليس مخزن profile-key الرئيسي)
- تنسخ عمليات التشغيل الحية المحلية الإعداد النشط، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى منزل اختباري مؤقت افتراضيًا؛ وتتخطى المنازل الحية المرحلية `workspace/` و`sandboxes/`، كما تُزال تجاوزات المسار `agents.*.workspace` و`agentDir` حتى تبقى الاختبارات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح البيئة (مثل المفاتيح المصدَّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram حي (نسخ صوتي)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus حي لخطة البرمجة

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز النموذج الاختياري: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI حي لوسائط سير العمل

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يمارس المسارات المضمّنة الخاصة بالصور والفيديو و`music_generate` في comfy
  - يتخطى كل إمكانية ما لم تكن `plugins.entries.comfy.config.<capability>` مضبوطة
  - مفيد بعد تغيير إرسال سير العمل في comfy، أو polling، أو التنزيلات، أو تسجيل Plugin

## حي لتوليد الصور

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحزام: `pnpm test:live:media image`
- النطاق:
  - يُعدّد كل Plugin مزوّد لتوليد الصور مسجل
  - يحمّل متغيرات البيئة المفقودة الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الاختبار
  - يستخدم مفاتيح API الحية/من البيئة قبل ملفات المصادقة المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا للاستخدام
  - يشغّل كل مزوّد مُهيأ عبر وقت تشغيل توليد الصور المشترك:
    - `<provider>:generate`
    - `<provider>:edit` عندما يعلن المزوّد دعم التحرير
- المزوّدون المضمّنون الحاليون المشمولون:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- التضييق الاختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على البيئة فقط

بالنسبة إلى مسار CLI المشحون، أضف اختبار smoke لـ `infer` بعد نجاح الاختبار الحي
للمزوّد/وقت التشغيل:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل وسيطات CLI، وتحليل الإعدادات/الوكيل الافتراضي، وتفعيل
Plugin المضمّن، وإصلاح تبعيات وقت التشغيل المضمّنة عند الطلب، ووقت تشغيل
توليد الصور المشترك، وطلب المزوّد الحي.

## حي لتوليد الموسيقى

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحزام: `pnpm test:live:media music`
- النطاق:
  - يمارس مسار مزوّد توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات البيئة الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الاختبار
  - يستخدم مفاتيح API الحية/من البيئة قبل ملفات المصادقة المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا للاستخدام
  - يشغّل كلا وضعي وقت التشغيل المعلنين عند توفرهما:
    - `generate` بإدخال يعتمد على المطالبة فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: ‏`generate`، و`edit`
    - `minimax`: ‏`generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا المسح المشترك
- التضييق الاختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على البيئة فقط

## حي لتوليد الفيديو

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحزام: `pnpm test:live:media video`
- النطاق:
  - يمارس مسار مزوّد توليد الفيديو المضمّن المشترك
  - يفترض افتراضيًا مسار smoke الآمن للإصدار: مزوّدات غير FAL، وطلب text-to-video واحد لكل مزوّد، ومطالبة lobster لمدة ثانية واحدة، وسقف عمليات لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (الافتراضي `180000`)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الطابور لدى المزوّد قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات البيئة الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الاختبار
  - يستخدم مفاتيح API الحية/من البيئة قبل ملفات المصادقة المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صور محلية معتمدًا على buffer في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محلي معتمدًا على buffer في المسح المشترك
  - مزوّدو `imageToVideo` المعلنون حاليًا ولكن المتخطَّون في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` للنص إلى فيديو بالإضافة إلى مسار `kling` يستخدم افتراضيًا fixture بعنوان URL لصورة بعيدة
  - التغطية الحية الحالية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزوّدو `videoToVideo` المعلنون حاليًا ولكن المتخطَّون في المسح المشترك:
    - `alibaba`، و`qwen`، و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا معتمدًا على buffer وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات الوصول الخاصة بالمؤسسة لفيديو inpaint/remix
- التضييق الاختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل سقف عملية كل مزوّد من أجل تشغيل smoke أكثر صرامة
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على البيئة فقط

## الحزام الحي للوسائط

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل أجنحة الاختبارات الحية المشتركة للصور والموسيقى والفيديو عبر نقطة دخول أصلية واحدة للمستودع
  - يحمّل تلقائيًا متغيرات البيئة المفقودة الخاصة بالمزوّد من `~/.profile`
  - يضيّق كل جناح تلقائيًا إلى المزوّدين الذين يملكون حاليًا مصادقة صالحة للاستخدام افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، لذلك يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذو صلة

- [الاختبار](/ar/help/testing) — أجنحة unit وintegration وQA وDocker
