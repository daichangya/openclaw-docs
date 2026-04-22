---
read_when:
    - أنت تريد فهرس OpenCode Go
    - أنت بحاجة إلى مراجع نماذج وقت التشغيل للنماذج المستضافة على Go
summary: استخدم فهرس OpenCode Go مع إعداد OpenCode المشترك
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:28:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go هو فهرس Go ضمن [OpenCode](/ar/providers/opencode).
يستخدم `OPENCODE_API_KEY` نفسه الذي يستخدمه فهرس Zen، لكنه يحتفظ بمعرّف مزود
وقت التشغيل `opencode-go` بحيث يظل التوجيه upstream لكل نموذج صحيحًا.

| الخاصية         | القيمة                          |
| ---------------- | ------------------------------- |
| مزود وقت التشغيل | `opencode-go`                   |
| المصادقة         | `OPENCODE_API_KEY`              |
| الإعداد الأصل    | [OpenCode](/ar/providers/opencode) |

## النماذج المدعومة

يجلب OpenClaw فهرس Go من سجل نماذج Pi المضمّن. شغّل
`openclaw models list --provider opencode-go` للحصول على قائمة النماذج الحالية.

اعتبارًا من فهرس Pi المضمّن، يتضمن المزود:

| مرجع النموذج              | الاسم                  |
| ------------------------- | ---------------------- |
| `opencode-go/glm-5`       | GLM-5                  |
| `opencode-go/glm-5.1`     | GLM-5.1                |
| `opencode-go/kimi-k2.5`   | Kimi K2.5              |
| `opencode-go/kimi-k2.6`   | Kimi K2.6 (حدود 3x)    |
| `opencode-go/mimo-v2-omni`| MiMo V2 Omni           |
| `opencode-go/mimo-v2-pro` | MiMo V2 Pro            |
| `opencode-go/minimax-m2.5`| MiniMax M2.5           |
| `opencode-go/minimax-m2.7`| MiniMax M2.7           |
| `opencode-go/qwen3.5-plus`| Qwen3.5 Plus           |
| `opencode-go/qwen3.6-plus`| Qwen3.6 Plus           |

## البدء

<Tabs>
  <Tab title="تفاعلي">
    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="تعيين نموذج Go كنموذج افتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="التحقق من توفر النماذج">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="غير تفاعلي">
    <Steps>
      <Step title="تمرير المفتاح مباشرة">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="التحقق من توفر النماذج">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## مثال على Config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## ملاحظات متقدمة

<AccordionGroup>
  <Accordion title="سلوك التوجيه">
    يتولى OpenClaw التوجيه لكل نموذج تلقائيًا عندما يستخدم مرجع النموذج
    `opencode-go/...`. لا يلزم أي Config إضافي للمزود.
  </Accordion>

  <Accordion title="اصطلاح مراجع وقت التشغيل">
    تظل مراجع وقت التشغيل صريحة: `opencode/...` لـ Zen، و`opencode-go/...` لـ Go.
    وهذا يُبقي التوجيه upstream لكل نموذج صحيحًا عبر كلا الفهرسين.
  </Accordion>

  <Accordion title="بيانات اعتماد مشتركة">
    يتم استخدام `OPENCODE_API_KEY` نفسه لكل من فهرسي Zen وGo. يؤدي إدخال
    المفتاح أثناء الإعداد إلى تخزين بيانات الاعتماد لكلا مزودي وقت التشغيل.
  </Accordion>
</AccordionGroup>

<Tip>
راجع [OpenCode](/ar/providers/opencode) للاطلاع على نظرة عامة على الإعداد المشترك والمرجع الكامل
لفهرسي Zen + Go.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="OpenCode (الأصل)" href="/ar/providers/opencode" icon="server">
    الإعداد المشترك، ونظرة عامة على الفهرس، والملاحظات المتقدمة.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودين، ومراجع النماذج، وسلوك الاسترداد.
  </Card>
</CardGroup>
