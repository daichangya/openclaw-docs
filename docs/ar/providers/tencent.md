---
read_when:
    - تريد استخدام نماذج Tencent Hy مع OpenClaw
    - تحتاج إلى إعداد مفتاح API الخاص بـ TokenHub
summary: إعداد Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T07:31:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

يأتي Tencent Cloud كـ **Plugin مزوّد مضمّنة** في OpenClaw. وهي تتيح الوصول إلى نماذج Tencent Hy عبر نقطة نهاية TokenHub ‏(`tencent-tokenhub`).

يستخدم المزوّد API متوافقة مع OpenAI.

## البدء السريع

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## مثال غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## المزوّدون ونقاط النهاية

| المزوّد            | نقطة النهاية                  | حالة الاستخدام             |
| ------------------ | ----------------------------- | -------------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy عبر Tencent TokenHub    |

## النماذج المتاحة

### tencent-tokenhub

- **hy3-preview** — معاينة Hy3 ‏(سياق 256K، واستدلال، والافتراضي)

## ملاحظات

- تستخدم مراجع نماذج TokenHub الصيغة `tencent-tokenhub/<modelId>`.
- تُشحن Plugin مع بيانات وصفية مضمّنة لتسعير Hy3 المتدرج، لذلك تُملأ تقديرات التكلفة من دون تجاوزات تسعير يدوية.
- تجاوز بيانات التسعير والسياق الوصفية في `models.providers` إذا لزم الأمر.

## ملاحظة بيئية

إذا كانت Gateway تعمل كـ daemon ‏(launchd/systemd)، فتأكد من أن `TOKENHUB_API_KEY`
متاح لتلك العملية (مثلًا في `~/.openclaw/.env` أو عبر
`env.shellEnv`).

## وثائق ذات صلة

- [إعداد OpenClaw](/ar/gateway/configuration)
- [مزوّدو النماذج](/ar/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
