---
read_when:
    - أنت تقوم بأتمتة الإعداد الأولي داخل السكربتات أو CI
    - أنت بحاجة إلى أمثلة غير تفاعلية لمزوّدين محددين
sidebarTitle: CLI automation
summary: الإعداد الأولي المبرمج وإعداد الوكيل لـ CLI الخاص بـ OpenClaw
title: أتمتة CLI
x-i18n:
    generated_at: "2026-04-25T13:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d36801439b9243ea5cc0ab93757dde23d1ecd86c8f5b991541ee14f41bf05ac
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

استخدم `--non-interactive` لأتمتة `openclaw onboard`.

<Note>
لا تعني `--json` ضمنًا الوضع غير التفاعلي. استخدم `--non-interactive` (و`--workspace`) مع السكربتات.
</Note>

## مثال أساسي غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

أضف `--json` للحصول على ملخص قابل للقراءة آليًا.

استخدم `--skip-bootstrap` عندما تقوم الأتمتة لديك بتهيئة ملفات مساحة العمل مسبقًا ولا تريد من onboarding إنشاء ملفات bootstrap الافتراضية.

استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بالبيئة في ملفات المصادقة الشخصية بدلًا من القيم النصية الصريحة.
ويكون الاختيار التفاعلي بين مراجع البيئة ومراجع المزوّد المضبوطة (`file` أو `exec`) متاحًا في تدفق onboarding.

في وضع `ref` غير التفاعلي، يجب أن تكون متغيرات بيئة المزوّد مضبوطة في بيئة العملية.
والآن يؤدي تمرير رايات مفاتيح مضمنة من دون متغير البيئة المطابق إلى فشل سريع.

مثال:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## أمثلة خاصة بالمزوّد

<AccordionGroup>
  <Accordion title="مثال مفتاح API لـ Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    بدّل إلى `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` لكتالوج Go.
  </Accordion>
  <Accordion title="مثال Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال مزوّد مخصص">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    يكون `--custom-api-key` اختياريًا. وإذا حُذف، يتحقق onboarding من `CUSTOM_API_KEY`.

    متغير وضع المرجع:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    في هذا الوضع، يخزّن onboarding القيمة `apiKey` على أنها `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

لا يزال setup-token الخاص بـ Anthropic متاحًا كمسار token مدعوم في onboarding، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI عند توفره.
وبالنسبة إلى الإنتاج، فضّل مفتاح API لـ Anthropic.

## أضف وكيلًا آخر

استخدم `openclaw agents add <name>` لإنشاء وكيل منفصل له مساحة العمل الخاصة به،
وجلساته، وملفات المصادقة الشخصية الخاصة به. والتشغيل من دون `--workspace` يطلق المعالج.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

ما الذي يضبطه:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

ملاحظات:

- تتبع مساحات العمل الافتراضية الصيغة `~/.openclaw/workspace-<agentId>`.
- أضف `bindings` لتوجيه الرسائل الواردة (يمكن للمعالج القيام بذلك).
- الرايات غير التفاعلية: `--model`، و`--agent-dir`، و`--bind`، و`--non-interactive`.

## مستندات ذات صلة

- مركز onboarding: [الإعداد الأولي (CLI)](/ar/start/wizard)
- المرجع الكامل: [مرجع إعداد CLI الكامل](/ar/start/wizard-cli-reference)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
