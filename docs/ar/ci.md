---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تقوم بتصحيح أعطال فحوصات GitHub Actions
summary: رسم مهام CI البياني، وبوابات النطاق، والأوامر المحلية المكافئة
title: مسار CI
x-i18n:
    generated_at: "2026-04-21T07:18:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# مسار CI

يعمل CI عند كل دفع إلى `main` وعند كل طلب سحب. ويستخدم تحديد نطاق ذكيًا لتخطي المهام المكلفة عندما تتغير فقط أجزاء غير ذات صلة.

## نظرة عامة على المهام

| المهمة                             | الغرض                                                                                         | وقت تشغيلها                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                        | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، وextensions المتغيرة، وبناء بيان CI          | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `security-scm-fast`                | اكتشاف المفاتيح الخاصة ومراجعة سير العمل عبر `zizmor`                                        | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `security-dependency-audit`        | تدقيق production lockfile بدون تبعيات مقابل تنبيهات npm                                      | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast`                    | مجمّع مطلوب لمهام الأمان السريعة                                                              | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `build-artifacts`                  | بناء `dist/` وواجهة Control UI مرة واحدة، ورفع artifacts قابلة لإعادة الاستخدام للمهام اللاحقة | التغييرات ذات الصلة بـ Node          |
| `checks-fast-core`                 | مسارات صحة Linux السريعة مثل فحوصات bundled/plugin-contract/protocol                         | التغييرات ذات الصلة بـ Node          |
| `checks-fast-contracts-channels`   | فحوصات عقود القنوات المجزأة مع نتيجة فحص مجمعة مستقرة                                        | التغييرات ذات الصلة بـ Node          |
| `checks-node-extensions`           | مقاطع اختبارات bundled-plugin الكاملة عبر مجموعة extensions                                  | التغييرات ذات الصلة بـ Node          |
| `checks-node-core-test`            | مقاطع اختبارات Node الأساسية، باستثناء مسارات القنوات وbundled وcontract وextension          | التغييرات ذات الصلة بـ Node          |
| `extension-fast`                   | اختبارات مركزة فقط للـ plugins المضمنة التي تغيّرت                                            | عند اكتشاف تغييرات في extension      |
| `check`                            | المكافئ المحلي الرئيسي المجزأ: أنواع production، وlint، والحواجز، وأنواع الاختبار، وstrict smoke | التغييرات ذات الصلة بـ Node          |
| `check-additional`                 | حواجز البنية، والحدود، وواجهة extension، وحدود الحزم، ومقاطع gateway-watch                    | التغييرات ذات الصلة بـ Node          |
| `build-smoke`                      | اختبارات smoke لـ CLI المبني وstartup-memory smoke                                            | التغييرات ذات الصلة بـ Node          |
| `checks`                           | مسارات Linux Node المتبقية: اختبارات القنوات وتوافق Node 22 الخاص بعمليات الدفع فقط          | التغييرات ذات الصلة بـ Node          |
| `check-docs`                       | تنسيق الوثائق وlint وفحوصات الروابط المعطلة                                                   | عند تغيّر الوثائق                    |
| `skills-python`                    | `Ruff` + `pytest` للـ Skills المعتمدة على Python                                              | التغييرات ذات الصلة بـ Python skills |
| `checks-windows`                   | مسارات اختبار خاصة بـ Windows                                                                 | التغييرات ذات الصلة بـ Windows       |
| `macos-node`                       | مسار اختبارات TypeScript على macOS باستخدام artifacts المبنية المشتركة                        | التغييرات ذات الصلة بـ macOS         |
| `macos-swift`                      | lint وبناء واختبارات Swift لتطبيق macOS                                                       | التغييرات ذات الصلة بـ macOS         |
| `android`                          | مصفوفة بناء واختبار Android                                                                   | التغييرات ذات الصلة بـ Android       |

## ترتيب الإخفاق السريع

تُرتَّب المهام بحيث تفشل الفحوصات الرخيصة قبل تشغيل المهام المكلفة:

1. يحدد `preflight` أي المسارات موجودة أصلًا. ومنطق `docs-scope` و`changed-scope` عبارة عن خطوات داخل هذه المهمة، وليس مهام مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام artifacts ومصفوفات المنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء فور جاهزية البناء المشترك.
4. بعد ذلك تتفرع مسارات المنصات وبيئات التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-extensions` و`checks-node-core-test` و`extension-fast` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدات في `src/scripts/ci-changed-scope.test.ts`.
ويعيد سير العمل المنفصل `install-smoke` استخدام نص النطاق نفسه عبر مهمة `preflight` الخاصة به. وهو يحسب `run_install_smoke` من إشارة changed-smoke الأضيق، لذا لا يعمل Docker/install smoke إلا عند التغييرات ذات الصلة بالتثبيت أو التغليف أو الحاويات.

يوجد منطق المسارات المتغيرة المحلي في `scripts/changed-lanes.mjs` ويُنفذ بواسطة `scripts/check-changed.mjs`. وهذه البوابة المحلية أكثر صرامة بشأن حدود البنية من نطاق منصات CI العام: فتغييرات production الأساسية تشغّل فحص أنواع core prod بالإضافة إلى اختبارات core، وتغييرات اختبارات core فقط تشغّل فقط فحص أنواع واختبارات core test، وتغييرات production الخاصة بـ extension تشغّل فحص أنواع extension prod بالإضافة إلى اختبارات extension، وتغييرات اختبارات extension فقط تشغّل فقط فحص الأنواع والاختبارات الخاصة بـ extension test. وتؤدي تغييرات Plugin SDK العامة أو plugin-contract إلى توسيع التحقق ليشمل extension لأن extensions تعتمد على تلك العقود الأساسية. أما التغييرات غير المعروفة في الجذر/الإعدادات فتفشل بأمان إلى جميع المسارات.

في عمليات الدفع، تضيف مصفوفة `checks` مسار `compat-node22` الخاص بعمليات الدفع فقط. وفي طلبات السحب، يتم تخطي هذا المسار وتبقى المصفوفة مركزة على مسارات الاختبار/القنوات العادية.

يتم تقسيم أبطأ عائلات اختبارات Node إلى مقاطع include-file لكي تبقى كل مهمة صغيرة: تنقسم عقود القنوات إلى ثمانية مقاطع موزونة لكل من registry وcore coverage، وتنقسم اختبارات أوامر الرد auto-reply إلى أربعة مقاطع بنمط include-pattern، وتنقسم مجموعات بادئات الرد auto-reply الكبيرة الأخرى إلى مقطعين لكل مجموعة. كما يفصل `check-additional` أيضًا بين أعمال compile/canary الخاصة بحدود الحزم وبين أعمال runtime topology الخاصة بـ gateway/architecture.

قد يضع GitHub علامة `cancelled` على المهام المستبدلة عندما يصل دفع أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك على أنه ضجيج CI ما لم يكن أحدث تشغيل للمرجع نفسه فاشلًا أيضًا. وتشير فحوصات المقاطع المجمعة إلى حالة الإلغاء هذه صراحة لتسهيل تمييزها عن فشل الاختبار.

## المشغّلات

| المشغّل                          | المهام                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight` و`security-scm-fast` و`security-dependency-audit` و`security-fast` و`build-artifacts` وفحوصات Linux وفحوصات الوثائق وPython Skills و`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `macos-latest`                   | `macos-node` و`macos-swift`                                                                                                                            |

## المكافئات المحلية

```bash
pnpm changed:lanes   # فحص مصنّف المسارات المتغيرة المحلي لـ origin/main...HEAD
pnpm check:changed   # بوابة محلية ذكية: typecheck/lint/tests المتغيرة حسب مسار الحدود
pnpm check          # بوابة محلية سريعة: production tsgo + lint مجزأ + حواجز سريعة متوازية
pnpm check:test-types
pnpm check:timed    # البوابة نفسها مع توقيتات لكل مرحلة
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # اختبارات vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # تنسيق الوثائق + lint + الروابط المعطلة
pnpm build          # بناء dist عندما تكون مسارات CI artifact/build-smoke مهمة
```
