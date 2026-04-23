---
read_when:
    - البحث عن خطوة أو علامة محددة في الإعداد الأولي
    - أتمتة الإعداد الأولي باستخدام الوضع غير التفاعلي
    - 'تصحيح سلوك الإعداد الأولي +#+#+#+#+#+analysis to=none code  盈立 monologue  more reasoning: We need translate. Final only translated text. Let''s do concise faithful.'
sidebarTitle: Onboarding Reference
summary: 'المرجع الكامل للإعداد الأولي عبر CLI: كل خطوة، وعلامة، وحقل إعدادات'
title: مرجع الإعداد الأولي
x-i18n:
    generated_at: "2026-04-23T07:32:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# مرجع الإعداد الأولي

هذا هو المرجع الكامل للأمر `openclaw onboard`.
وللحصول على نظرة عامة عالية المستوى، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## تفاصيل التدفق (الوضع المحلي)

<Steps>
  <Step title="اكتشاف الإعدادات الموجودة">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر **Keep / Modify / Reset**.
    - إن إعادة تشغيل الإعداد الأولي **لا** تمحو أي شيء ما لم تختر صراحةً **Reset**
      (أو تمرر `--reset`).
    - تكون القيمة الافتراضية لـ CLI `--reset` هي `config+creds+sessions`; واستخدم `--reset-scope full`
      لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب
      منك تشغيل `openclaw doctor` قبل المتابعة.
    - يستخدم Reset الأمر `trash` (وليس `rm` أبدًا) ويعرض النطاقات التالية:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API key**: يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام daemon.
    - **Anthropic API key**: الخيار المفضل لمساعد Anthropic في onboarding/configure.
    - **Anthropic setup-token**: ما يزال متاحًا في onboarding/configure، رغم أن OpenClaw يفضل الآن إعادة استخدام Claude CLI عند توفره.
    - **OpenAI Code (Codex) subscription (OAuth)**: تدفق متصفح؛ الصق `code#state`.
      - يضبط `agents.defaults.model` إلى `openai-codex/gpt-5.4` عندما يكون النموذج غير مضبوط أو `openai/*`.
    - **OpenAI Code (Codex) subscription (device pairing)**: تدفق اقتران عبر المتصفح مع رمز جهاز قصير العمر.
      - يضبط `agents.defaults.model` إلى `openai-codex/gpt-5.4` عندما يكون النموذج غير مضبوط أو `openai/*`.
    - **OpenAI API key**: يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزنه في ملفات تعريف المصادقة.
      - يضبط `agents.defaults.model` إلى `openai/gpt-5.4` عندما يكون النموذج غير مضبوط، أو `openai/*`، أو `openai-codex/*`.
    - **xAI (Grok) API key**: يطلب `XAI_API_KEY` ويهيئ xAI كمزوّد نماذج.
    - **OpenCode**: يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`، احصل عليه من https://opencode.ai/auth) ويتيح لك اختيار كتالوج Zen أو Go.
    - **Ollama**: يعرض أولًا **Cloud + Local**، أو **Cloud only**، أو **Local only**. يطلب `Cloud only` القيمة `OLLAMA_API_KEY` ويستخدم `https://ollama.com`; أما الأوضاع المعتمدة على المضيف فتطلب عنوان URL الأساسي لـ Ollama، وتكتشف النماذج المتاحة، وتنفذ سحبًا تلقائيًا للنموذج المحلي المحدد عند الحاجة؛ كما يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجّل الدخول للوصول السحابي.
    - مزيد من التفاصيل: [Ollama](/ar/providers/ollama)
    - **API key**: يخزّن المفتاح لك.
    - **Vercel AI Gateway (multi-model proxy)**: يطلب `AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: يطلب Account ID وGateway ID و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
    - **MiniMax**: تُكتب الإعدادات تلقائيًا؛ والافتراضي المستضاف هو `MiniMax-M2.7`.
      يستخدم إعداد مفتاح API الصيغة `minimax/...`, ويستخدم إعداد OAuth
      الصيغة `minimax-portal/...`.
    - مزيد من التفاصيل: [MiniMax](/ar/providers/minimax)
    - **StepFun**: تُكتب الإعدادات تلقائيًا لـ StepFun standard أو Step Plan على نقاط نهاية الصين أو العالمية.
    - يتضمن Standard حاليًا `step-3.5-flash`, كما يتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    - مزيد من التفاصيل: [StepFun](/ar/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: يطلب `SYNTHETIC_API_KEY`.
    - مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic)
    - **Moonshot (Kimi K2)**: تُكتب الإعدادات تلقائيًا.
    - **Kimi Coding**: تُكتب الإعدادات تلقائيًا.
    - مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
    - **Skip**: لم تُهيأ المصادقة بعد.
    - اختر نموذجًا افتراضيًا من الخيارات المكتشفة (أو أدخل provider/model يدويًا). للحصول على أفضل جودة وتقليل خطر حقن المطالبات، اختر أقوى نموذج متاح من الجيل الأحدث ضمن مجموعة المزوّدين لديك.
    - يشغّل الإعداد الأولي فحصًا للنموذج ويحذّر إذا كان النموذج المضبوط غير معروف أو تنقصه المصادقة.
    - يكون وضع تخزين مفتاح API افتراضيًا هو قيم auth-profile بنص صريح. استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بـ env بدلًا من ذلك (مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - تعيش ملفات تعريف المصادقة في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (مفاتيح API + OAuth). أما `~/.openclaw/credentials/oauth.json` فهو قديم للاستيراد فقط.
    - مزيد من التفاصيل: [/concepts/oauth](/ar/concepts/oauth)
    <Note>
    نصيحة للخوادم/الوضع بدون واجهة: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
    ملف `auth-profiles.json` لذلك الوكيل (مثل
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, أو المسار المطابق
    `$OPENCLAW_STATE_DIR/...`) إلى مضيف gateway. أما `credentials/oauth.json`
    فهو مجرد مصدر استيراد قديم.
    </Note>
  </Step>
  <Step title="Workspace">
    - الافتراضي `~/.openclaw/workspace` (قابل للتهيئة).
    - يزرع ملفات مساحة العمل اللازمة لطقس الإقلاع الأولي للوكيل.
    - تخطيط مساحة العمل الكامل + دليل النسخ الاحتياطي: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - المنفذ، وbind، ووضع المصادقة، وكشف Tailscale.
    - توصية المصادقة: احتفظ بخيار **Token** حتى في loopback حتى يضطر عملاء WS المحليون إلى المصادقة.
    - في وضع token، يعرض الإعداد التفاعلي:
      - **Generate/store plaintext token** (الافتراضي)
      - **Use SecretRef** (اختياري)
      - يعيد Quickstart استخدام SecretRefs الموجودة لـ `gateway.auth.token` عبر موفري `env` و`file` و`exec` لأجل فحص onboarding/التهيئة الأولية للوحة.
      - إذا كانت SecretRef مضبوطة لكن لا يمكن حلها، يفشل onboarding مبكرًا مع رسالة إصلاح واضحة بدلًا من خفض مصادقة بيئة التشغيل بصمت.
    - في وضع password، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو عبر SecretRef.
    - مسار SecretRef غير التفاعلي لـ token: ‏`--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير env غير فارغ في بيئة عملية onboarding.
      - لا يمكن جمعه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق بالكامل في كل عملية محلية.
    - ما تزال عمليات bind غير loopback تتطلب مصادقة.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري.
    - [Telegram](/ar/channels/telegram): رمز bot.
    - [Discord](/ar/channels/discord): رمز bot.
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook.
    - [Mattermost](/ar/channels/mattermost) (Plugin): رمز bot + عنوان URL أساسي.
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + إعداد الحساب.
    - [BlueBubbles](/ar/channels/bluebubbles): **موصى به لـ iMessage**; عنوان URL للخادم + كلمة مرور + Webhook.
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI القديم + وصول DB.
    - أمان الرسائل الخاصة: الافتراضي هو الاقتران. ترسل أول رسالة خاصة رمزًا؛ وافق عبر `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="Web search">
    - اختر مزودًا مدعومًا مثل Brave أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search أو Ollama Web Search أو Perplexity أو SearXNG أو Tavily (أو تخطَّ ذلك).
    - يمكن للمزوّدين المدعومين بـ API استخدام متغيرات env أو الإعدادات الموجودة للإعداد السريع؛ أما المزوّدون الذين لا يحتاجون إلى مفتاح فيستخدمون المتطلبات الخاصة بمزوّدهم بدلًا من ذلك.
    - تخطَّ ذلك باستخدام `--skip-search`.
    - يمكن التهيئة لاحقًا عبر: `openclaw configure --section web`.
  </Step>
  <Step title="تثبيت daemon">
    - macOS: ‏LaunchAgent
      - يتطلب جلسة مستخدم مسجّل دخوله؛ أما في وضع headless فاستخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux (وWindows عبر WSL2): وحدة systemd للمستخدم
      - يحاول Onboarding تفعيل lingering عبر `loginctl enable-linger <user>` حتى تبقى Gateway مرفوعة بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`); ويجرب أولًا من دون sudo.
    - **اختيار بيئة التشغيل:** Node (موصى به؛ ومطلوب لـ WhatsApp/Telegram). أما Bun فهو **غير موصى به**.
    - إذا كانت مصادقة token تتطلب token وكانت `gateway.auth.token` مُدارة عبر SecretRef، فإن تثبيت daemon يتحقق منها لكنه لا يحفظ قيم token النصية الصريحة المحلولة ضمن بيانات بيئة خدمة المشرف.
    - إذا كانت مصادقة token تتطلب token وكانت SecretRef الخاصة بالـ token المضبوطة غير محلولة، فسيُحظر تثبيت daemon مع إرشادات عملية.
    - إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مضبوطة وكان `gateway.auth.mode` غير مضبوط، فسيُحظر تثبيت daemon حتى يتم ضبط الوضع صراحةً.
  </Step>
  <Step title="فحص السلامة">
    - يبدأ تشغيل Gateway (عند الحاجة) ويشغّل `openclaw health`.
    - نصيحة: يضيف `openclaw status --deep` فحص سلامة gateway المباشر إلى مخرجات الحالة، بما في ذلك فحوصات القنوات عند الدعم (ويتطلب gateway قابلة للوصول).
  </Step>
  <Step title="Skills (موصى بها)">
    - يقرأ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح لك اختيار مدير Node: ‏**npm / pnpm** (Bun غير موصى به).
    - يثبّت التبعيات الاختيارية (يستخدم بعضها Homebrew على macOS).
  </Step>
  <Step title="إنهاء">
    - ملخص + خطوات لاحقة، بما في ذلك تطبيقات iOS/Android/macOS للحصول على ميزات إضافية.
  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف GUI، يطبع onboarding تعليمات إعادة توجيه منفذ SSH الخاصة بـ Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول onboarding بناؤها؛ والعودة الاحتياطية هي `pnpm ui:build` (مع تثبيت تبعيات UI تلقائيًا).
</Note>

## الوضع غير التفاعلي

استخدم `--non-interactive` لأتمتة onboarding أو برمجتها نصيًا:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

أضف `--json` للحصول على ملخص قابل للقراءة آليًا.

SecretRef لرمز Gateway في الوضع غير التفاعلي:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

إن `--gateway-token` و`--gateway-token-ref-env` متنافيان.

<Note>
إن `--json` **لا** يعني الوضع غير التفاعلي. استخدم `--non-interactive` (و`--workspace`) في النصوص البرمجية.
</Note>

توجد أمثلة أوامر خاصة بالمزوّد في [أتمتة CLI](/ar/start/wizard-cli-automation#provider-specific-examples).
استخدم صفحة المرجع هذه لدلالات العلامات وترتيب الخطوات.

### إضافة وكيل (غير تفاعلي)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## ‏RPC الخاصة بمعالج Gateway

تعرض Gateway تدفق onboarding عبر RPC ‏(`wizard.start`, ‏`wizard.next`, ‏`wizard.cancel`, ‏`wizard.status`).
ويمكن للعملاء (تطبيق macOS، وControl UI) عرض الخطوات من دون إعادة تنفيذ منطق onboarding.

## إعداد Signal ‏(`signal-cli`)

يمكن لـ Onboarding تثبيت `signal-cli` من إصدارات GitHub:

- ينزّل أصل الإصدار المناسب.
- يخزّنه تحت `~/.openclaw/tools/signal-cli/<version>/`.
- يكتب `channels.signal.cliPath` إلى إعداداتك.

ملاحظات:

- تتطلب بنى JVM وجود **Java 21**.
- تُستخدم البنى الأصلية عندما تكون متاحة.
- يستخدم Windows بيئة WSL2؛ ويتبع تثبيت signal-cli تدفق Linux داخل WSL.

## ما الذي يكتبه المعالج

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار MiniMax)
- `tools.profile` (يضبط الإعداد الأولي المحلي القيمة الافتراضية `"coding"` عند عدم الضبط؛ وتُحفظ القيم الصريحة الموجودة)
- `gateway.*` (الوضع، وbind، والمصادقة، وTailscale)
- `session.dmScope` (تفاصيل السلوك: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- قوائم سماح القنوات (Slack/Discord/Matrix/Microsoft Teams) عندما تشترك فيها أثناء المطالبات (تُحل الأسماء إلى معرّفات عند الإمكان).
- `skills.install.nodeManager`
  - يقبل `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا تزال الإعدادات اليدوية تستطيع استخدام `yarn` عبر ضبط `skills.install.nodeManager` مباشرة.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` وإلى `bindings` الاختيارية.

توجد بيانات اعتماد WhatsApp تحت `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزَّن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

تُسلَّم بعض القنوات على هيئة Plugins. وعندما تختار واحدة منها أثناء الإعداد، سيطلب منك onboarding
تثبيتها (npm أو مسار محلي) قبل أن يمكن تهيئتها.

## وثائق ذات صلة

- نظرة عامة على الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- الإعداد الأولي لتطبيق macOS: [الإعداد الأولي](/ar/start/onboarding)
- مرجع الإعدادات: [تهيئة Gateway](/ar/gateway/configuration)
- المزوّدون: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)، [Google Chat](/ar/channels/googlechat)، [Signal](/ar/channels/signal)، [BlueBubbles](/ar/channels/bluebubbles) (iMessage)، [iMessage](/ar/channels/imessage) (قديم)
- Skills: [Skills](/ar/tools/skills)، [إعدادات Skills](/ar/tools/skills-config)
