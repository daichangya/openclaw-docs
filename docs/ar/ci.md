---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تقوم بتصحيح أخطاء فحوصات GitHub Actions الفاشلة
summary: مخطط مهام CI، وبوابات النطاق، وما يعادلها من الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-04-22T04:21:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# مسار CI

يعمل CI عند كل push إلى `main` وعند كل pull request. ويستخدم تحديد نطاق ذكيًا لتخطي المهام المكلفة عندما تتغير مناطق غير مرتبطة فقط.

## نظرة عامة على المهام

| المهمة                           | الغرض                                                                                         | وقت التشغيل                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | اكتشاف التغييرات الخاصة بالوثائق فقط، والنطاقات المتغيرة، وPlugins المتغيرة، وبناء بيان CI     | دائمًا في push وPR غير المسودين     |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق workflow عبر `zizmor`                                            | دائمًا في push وPR غير المسودين     |
| `security-dependency-audit`      | تدقيق lockfile الإنتاجي بدون تبعيات مقابل تنبيهات npm                                         | دائمًا في push وPR غير المسودين     |
| `security-fast`                  | مجمّع مطلوب لمهام الأمان السريعة                                                               | دائمًا في push وPR غير المسودين     |
| `build-artifacts`                | بناء `dist/` وواجهة Control UI مرة واحدة، ورفع artifacts قابلة لإعادة الاستخدام للمهام التابعة | تغييرات ذات صلة بـ Node             |
| `checks-fast-core`               | مسارات صحة Linux السريعة مثل فحوصات bundled/plugin-contract/protocol                          | تغييرات ذات صلة بـ Node             |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المجزأة مع نتيجة فحص مجمعة مستقرة                                          | تغييرات ذات صلة بـ Node             |
| `checks-node-extensions`         | شظايا اختبارات Plugin المضمّنة الكاملة عبر مجموعة extension                                    | تغييرات ذات صلة بـ Node             |
| `checks-node-core-test`          | شظايا اختبارات Node الأساسية، باستثناء مسارات القنوات وbundled والعقود وextension             | تغييرات ذات صلة بـ Node             |
| `extension-fast`                 | اختبارات مركزة فقط لـ Plugins المضمّنة التي تغيّرت                                             | عند اكتشاف تغييرات في extension     |
| `check`                          | ما يعادل البوابة المحلية الرئيسية المجزأة: أنواع الإنتاج وlint وguards وأنواع الاختبار وsmoke الصارم | تغييرات ذات صلة بـ Node             |
| `check-additional`               | شظايا architecture وboundary وextension-surface guards وpackage-boundary وgateway-watch         | تغييرات ذات صلة بـ Node             |
| `build-smoke`                    | اختبارات smoke لـ CLI المبني وsmoke ذاكرة بدء التشغيل                                          | تغييرات ذات صلة بـ Node             |
| `checks`                         | مسارات Linux Node المتبقية: اختبارات القنوات وتوافق Node 22 الخاص بـ push فقط                 | تغييرات ذات صلة بـ Node             |
| `check-docs`                     | تنسيق الوثائق وlint وفحوصات الروابط المعطلة                                                   | عند تغير الوثائق                    |
| `skills-python`                  | Ruff + pytest للـ Skills المعتمدة على Python                                                   | تغييرات ذات صلة بـ Python Skills    |
| `checks-windows`                 | مسارات الاختبار الخاصة بـ Windows                                                              | تغييرات ذات صلة بـ Windows          |
| `macos-node`                     | مسار اختبارات TypeScript على macOS باستخدام artifacts المبنية المشتركة                         | تغييرات ذات صلة بـ macOS            |
| `macos-swift`                    | lint وبناء واختبارات Swift لتطبيق macOS                                                        | تغييرات ذات صلة بـ macOS            |
| `android`                        | مصفوفة بناء Android واختباره                                                                    | تغييرات ذات صلة بـ Android          |

## ترتيب الإخفاق السريع

تُرتَّب المهام بحيث تفشل الفحوصات الرخيصة قبل تشغيل المهام المكلفة:

1. يحدد `preflight` أي المسارات موجودة أصلًا. ومنطق `docs-scope` و`changed-scope` هو خطوات داخل هذه المهمة، وليس مهام مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة دون انتظار مهام artifact ومصفوفات المنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون التابعون من البدء بمجرد جاهزية البناء المشترك.
4. بعد ذلك تتفرع مسارات المنصات وبيئات التشغيل الأثقل: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-extensions` و`checks-node-core-test` و`extension-fast` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدة في `src/scripts/ci-changed-scope.test.ts`.
ويعيد workflow المنفصل `install-smoke` استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. إذ يحسب `run_install_smoke` من إشارة changed-smoke الأضيق، لذلك لا يعمل Docker/install smoke إلا عند التغييرات ذات الصلة بالتثبيت والتغليف والحاويات.

يوجد منطق المسارات المتغيرة المحلية في `scripts/changed-lanes.mjs` ويُنفَّذ بواسطة `scripts/check-changed.mjs`. وهذه البوابة المحلية أكثر صرامة بشأن حدود architecture من نطاق منصة CI الواسع: فتغييرات الإنتاج الأساسية تشغّل typecheck للإنتاج الأساسي بالإضافة إلى اختبارات الأساس، وتغييرات اختبارات الأساس فقط تشغّل typecheck/اختبارات الأساس فقط، وتغييرات إنتاج extension تشغّل typecheck لإنتاج extension بالإضافة إلى اختبارات extension، وتغييرات اختبارات extension فقط تشغّل typecheck/اختبارات extension فقط. أما تغييرات Plugin SDK العامة أو plugin-contract فتوسّع التحقق ليشمل extension لأن extension تعتمد على هذه العقود الأساسية. وتُشغّل زيادات الإصدار التي تقتصر على بيانات الإصدار الوصفية فحوصات مستهدفة للإصدار/التهيئة/تبعيات الجذر. أما تغييرات الجذر/التهيئة غير المعروفة فتميل احتياطيًا إلى جميع المسارات.

عند push، تضيف مصفوفة `checks` مسار `compat-node22` الخاص بـ push فقط. أما في pull requests، فيتم تخطي هذا المسار وتبقى المصفوفة مركزة على مسارات الاختبار/القنوات العادية.

تنقسم أبطأ عائلات اختبارات Node إلى شظايا include-file بحيث تبقى كل مهمة صغيرة: تقسم عقود القنوات تغطية registry والأساس إلى ثماني شظايا موزونة لكل منهما، وتنقسم اختبارات auto-reply reply command إلى أربع شظايا include-pattern، وتنقسم مجموعات auto-reply reply prefix الكبيرة الأخرى إلى شظيتين لكل منها. كما يفصل `check-additional` أيضًا بين أعمال package-boundary compile/canary وبين أعمال runtime topology الخاصة بـ gateway/architecture.

قد يضع GitHub علامة `cancelled` على المهام المستبدلة عندما يصل push أحدث إلى PR نفسه أو مرجع `main`. تعامل مع ذلك على أنه ضوضاء CI ما لم يكن التشغيل الأحدث للمرجع نفسه يفشل أيضًا. وتشير فحوصات الشظايا المجمعة صراحةً إلى حالة الإلغاء هذه بحيث يسهل تمييزها عن فشل الاختبار.

## المشغلات

| المشغّل                         | المهام                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight` و`security-scm-fast` و`security-dependency-audit` و`security-fast` و`build-artifacts` وفحوصات Linux وفحوصات الوثائق وPython Skills و`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node` و`macos-swift` على `openclaw/openclaw`؛ أما forks فتعود إلى `macos-latest`                                                              |

## المكافئات المحلية

```bash
pnpm changed:lanes   # فحص مصنف المسارات المتغيرة المحلي لـ origin/main...HEAD
pnpm check:changed   # البوابة المحلية الذكية: typecheck/lint/tests المتغيرة حسب مسار الحدود
pnpm check          # البوابة المحلية السريعة: tsgo للإنتاج + lint مجزأ + fast guards متوازية
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
