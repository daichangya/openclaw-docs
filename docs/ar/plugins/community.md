---
read_when:
    - أنت تريد العثور على Plugins خارجية لـ OpenClaw
    - أنت تريد نشر Plugin الخاصة بك أو إدراجها
summary: 'Plugins الخاصة بـ OpenClaw التي يصونها المجتمع: التصفح، والتثبيت، وإرسال Plugin الخاصة بك'
title: Plugins المجتمع
x-i18n:
    generated_at: "2026-04-21T07:23:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Plugins المجتمع

Plugins المجتمع هي حزم خارجية توسّع OpenClaw بقنوات أو أدوات أو مزودات أو قدرات أخرى جديدة. يتم بناؤها وصيانتها
بواسطة المجتمع، ونشرها على [ClawHub](/ar/tools/clawhub) أو npm، ويمكن
تثبيتها بأمر واحد.

ClawHub هو سطح الاكتشاف المعتمد لـ Plugins المجتمع. لا تفتح
طلبات سحب للوثائق فقط لمجرد إضافة Plugin الخاصة بك هنا لتحسين قابلية الاكتشاف؛ انشرها على
ClawHub بدلًا من ذلك.

```bash
openclaw plugins install <package-name>
```

يفحص OpenClaw أولًا ClawHub ثم يعود تلقائيًا إلى npm.

## Plugins المدرجة

### Apify

استخرج البيانات من أي موقع ويب باستخدام أكثر من 20,000 أداة استخراج جاهزة. دع الوكيل
يستخرج البيانات من Instagram وFacebook وTikTok وYouTube وGoogle Maps وGoogle
Search ومواقع التجارة الإلكترونية وغير ذلك — فقط بمجرد الطلب.

- **npm:** `@apify/apify-openclaw-plugin`
- **المستودع:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

جسر OpenClaw مستقل لمحادثات Codex App Server. اربط دردشة
بخيط Codex، وتحدث إليه بنص عادي، وتحكم فيه بأوامر أصلية للدردشة من أجل
الاستئناف، والتخطيط، والمراجعة، واختيار model، وCompaction، وغير ذلك.

- **npm:** `openclaw-codex-app-server`
- **المستودع:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

تكامل روبوت مؤسسي باستخدام وضع Stream. يدعم النصوص والصور و
رسائل الملفات عبر أي عميل DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **المستودع:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin لإدارة السياق دون فقدان في OpenClaw. تلخيص محادثات
قائم على DAG مع Compaction تدريجي — يحافظ على دقة السياق الكاملة
مع تقليل استخدام الرموز.

- **npm:** `@martian-engineering/lossless-claw`
- **المستودع:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin رسمية تصدّر تتبعات الوكيل إلى Opik. راقب سلوك الوكيل،
والتكلفة، والرموز، والأخطاء، وغير ذلك.

- **npm:** `@opik/opik-openclaw`
- **المستودع:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

امنح وكيل OpenClaw الخاص بك صورة رمزية Live2D مع مزامنة حركة الشفاه في الوقت
الفعلي، وتعابير المشاعر، وتحويل النص إلى كلام. يتضمن أدوات للمبدعين من أجل إنشاء
الأصول بالذكاء الاصطناعي والنشر بنقرة واحدة إلى Prometheus Marketplace. وهو حاليًا في مرحلة alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **المستودع:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

اربط OpenClaw بـ QQ عبر QQ Bot API. يدعم الدردشات الخاصة، و
الإشارات في المجموعات، ورسائل القنوات، والوسائط الغنية بما في ذلك الصوت، والصور، والفيديوهات،
والملفات.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **المستودع:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin قناة WeCom لـ OpenClaw من فريق Tencent WeCom. تعمل بواسطة
اتصالات WebSocket الدائمة الخاصة بـ WeCom Bot، وتدعم الرسائل المباشرة والمجموعات،
والردود المتدفقة، والرسائل الاستباقية، ومعالجة الصور/الملفات، وتنسيق Markdown،
والتحكم المدمج في الوصول، وSkills الخاصة بالمستندات/الاجتماعات/الرسائل.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **المستودع:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## أرسل Plugin الخاصة بك

نرحّب بـ Plugins المجتمع المفيدة، والموثقة، والآمنة في التشغيل.

<Steps>
  <Step title="انشر على ClawHub أو npm">
    يجب أن تكون Plugin الخاصة بك قابلة للتثبيت عبر `openclaw plugins install \<package-name\>`.
    انشرها على [ClawHub](/ar/tools/clawhub) (مفضّل) أو npm.
    راجع [بناء Plugins](/ar/plugins/building-plugins) للاطلاع على الدليل الكامل.

  </Step>

  <Step title="استضفها على GitHub">
    يجب أن تكون الشيفرة المصدرية في مستودع عام مع وثائق إعداد ومتتبع
    للمشكلات.

  </Step>

  <Step title="استخدم طلبات سحب الوثائق فقط لتغييرات وثائق المصدر">
    لا تحتاج إلى طلب سحب للوثائق فقط لجعل Plugin الخاصة بك قابلة للاكتشاف. انشرها
    على ClawHub بدلًا من ذلك.

    افتح طلب سحب للوثائق فقط عندما تحتاج وثائق المصدر الخاصة بـ OpenClaw إلى
    تغيير فعلي في المحتوى، مثل تصحيح إرشادات التثبيت أو إضافة
    وثائق عبر المستودعات تنتمي إلى مجموعة الوثائق الرئيسية.

  </Step>
</Steps>

## معايير الجودة

| المتطلب | السبب |
| --------------------------- | --------------------------------------------- |
| منشورة على ClawHub أو npm | يحتاج المستخدمون إلى أن يعمل `openclaw plugins install` |
| مستودع GitHub عام          | مراجعة المصدر، وتتبع المشكلات، والشفافية   |
| وثائق الإعداد والاستخدام        | يحتاج المستخدمون إلى معرفة كيفية تكوينها        |
| صيانة نشطة          | تحديثات حديثة أو تعامل متجاوب مع المشكلات   |

قد يتم رفض الأغلفة منخفضة الجهد، أو الملكية غير الواضحة، أو الحزم غير المصانة.

## ذو صلة

- [تثبيت Plugins وتكوينها](/ar/tools/plugin) — كيفية تثبيت أي Plugin
- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاصة بك
- [Plugin Manifest](/ar/plugins/manifest) — مخطط manifest
