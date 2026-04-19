---
read_when:
    - تصحيح أخطاء نصوص التطوير الخاصة بـ Node فقط أو حالات فشل وضع المراقبة
    - التحقيق في أعطال مُحمِّل tsx/esbuild في OpenClaw
summary: ملاحظات الأعطال والحلول البديلة لخطأ Node + tsx "__name is not a function"
title: تعطل Node + tsx
x-i18n:
    generated_at: "2026-04-19T01:11:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# تعطل Node + tsx بسبب الخطأ "\_\_name is not a function"

## الملخص

يفشل تشغيل OpenClaw عبر Node مع `tsx` عند بدء التشغيل مع ظهور ما يلي:

```bash
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

بدأ هذا بعد تبديل نصوص التطوير من Bun إلى `tsx` (الالتزام `2871657e`، بتاريخ 2026-01-06). كان مسار وقت التشغيل نفسه يعمل مع Bun.

## البيئة

- Node: ‏v25.x (تمت ملاحظته على v25.3.0)
- tsx: ‏4.21.0
- نظام التشغيل: macOS (ومن المرجح أيضًا أن يظهر في بيئات أخرى تشغّل Node 25)

## إعادة الإنتاج (Node فقط)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## إعادة إنتاج مصغّرة داخل المستودع

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## التحقق من إصدار Node

- Node 25.3.0: يفشل
- Node 22.22.0 (Homebrew `node@22`): يفشل
- Node 24: غير مثبّت هنا بعد؛ يحتاج إلى تحقق

## ملاحظات / فرضية

- يستخدم `tsx` أداة esbuild لتحويل TS/ESM. يقوم خيار `keepNames` في esbuild بإخراج مساعد `__name` ويلف تعريفات الدوال باستخدام `__name(...)`.
- يشير التعطل إلى أن `__name` موجود لكنه ليس دالة وقت التشغيل، ما يعني ضمنيًا أن هذا المساعد مفقود أو تمت الكتابة فوقه لهذه الوحدة في مسار مُحمِّل Node 25.
- تم الإبلاغ عن مشكلات مشابهة تتعلق بالمساعد `__name` في مستهلكين آخرين لـ esbuild عندما يكون المساعد مفقودًا أو يُعاد كتابته.

## سجل الانحدار

- `2871657e` (2026-01-06): تم تغيير النصوص من Bun إلى tsx لجعل Bun اختياريًا.
- قبل ذلك (مسار Bun)، كان `openclaw status` و `gateway:watch` يعملان.

## الحلول البديلة

- استخدام Bun لنصوص التطوير (الرجوع المؤقت الحالي).
- استخدام `tsgo` لفحص أنواع المستودع، ثم تشغيل الخرج المبني:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- ملاحظة تاريخية: تم استخدام `tsc` هنا أثناء تصحيح مشكلة Node/tsx هذه، لكن مسارات فحص الأنواع في المستودع تستخدم الآن `tsgo`.
- تعطيل `keepNames` الخاص بـ esbuild في مُحمِّل TS إن أمكن (فهذا يمنع إدراج المساعد `__name`)؛ ولا يوفّر tsx حاليًا هذا الخيار.
- اختبار Node LTS (22/24) مع `tsx` لمعرفة ما إذا كانت المشكلة خاصة بـ Node 25.

## المراجع

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## الخطوات التالية

- إعادة الإنتاج على Node 22/24 لتأكيد ما إذا كان هناك انحدار في Node 25.
- اختبار `tsx` nightly أو تثبيته على إصدار أقدم إذا كان هناك انحدار معروف.
- إذا أمكن إعادة إنتاجه على Node LTS، فافتح إعادة إنتاج مصغّرة لدى المصدر مع تتبع مكدس `__name`.
