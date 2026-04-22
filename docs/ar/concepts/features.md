---
read_when:
    - أنت تريد قائمة كاملة بكل ما يدعمه OpenClaw
summary: إمكانات OpenClaw عبر القنوات، والتوجيه، والوسائط، وتجربة المستخدم.
title: الميزات
x-i18n:
    generated_at: "2026-04-22T04:22:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# الميزات

## أبرز الميزات

<Columns>
  <Card title="القنوات" icon="message-square" href="/ar/channels">
    Discord وiMessage وSignal وSlack وTelegram وWhatsApp وWebChat وغير ذلك عبر Gateway واحدة.
  </Card>
  <Card title="Plugins" icon="plug" href="/ar/tools/plugin">
    تضيف Plugins المضمّنة Matrix وNextcloud Talk وNostr وTwitch وZalo وغير ذلك بدون عمليات تثبيت منفصلة في الإصدارات الحالية العادية.
  </Card>
  <Card title="التوجيه" icon="route" href="/ar/concepts/multi-agent">
    توجيه متعدد الوكلاء مع جلسات معزولة.
  </Card>
  <Card title="الوسائط" icon="image" href="/ar/nodes/images">
    الصور والصوت والفيديو والمستندات وتوليد الصور/الفيديو.
  </Card>
  <Card title="التطبيقات وواجهة المستخدم" icon="monitor" href="/web/control-ui">
    Web Control UI وتطبيق مساعد لنظام macOS.
  </Card>
  <Card title="عُقد الأجهزة المحمولة" icon="smartphone" href="/ar/nodes">
    عُقد iOS وAndroid مع الاقتران والصوت/الدردشة وأوامر الجهاز الغنية.
  </Card>
</Columns>

## القائمة الكاملة

**القنوات:**

- تشمل القنوات المضمنة Discord وGoogle Chat وiMessage (القديم) وIRC وSignal وSlack وTelegram وWebChat وWhatsApp
- تشمل قنوات Plugins المضمنة BlueBubbles لـ iMessage وFeishu وLINE وMatrix وMattermost وMicrosoft Teams وNextcloud Talk وNostr وQQ Bot وSynology Chat وTlon وTwitch وZalo وZalo Personal
- تشمل Plugins القنوات الاختيارية المثبتة بشكل منفصل Voice Call وحِزم الجهات الخارجية مثل WeChat
- يمكن لـ Plugins القنوات التابعة لجهات خارجية توسيع Gateway بشكل أكبر، مثل WeChat
- دعم الدردشة الجماعية مع التفعيل القائم على الإشارة
- أمان الرسائل الخاصة باستخدام قوائم السماح والاقتران

**الوكيل:**

- runtime وكيل مضمّن مع تدفق الأدوات
- توجيه متعدد الوكلاء مع جلسات معزولة لكل مساحة عمل أو مرسل
- الجلسات: تُدمج الدردشات المباشرة في `main` مشتركة؛ بينما تكون المجموعات معزولة
- البث والتقسيم للردود الطويلة

**المصادقة والمزودون:**

- أكثر من 35 مزود نماذج (Anthropic وOpenAI وGoogle وغيرهم)
- مصادقة الاشتراك عبر OAuth (مثل OpenAI Codex)
- دعم المزودات المخصصة والمستضافة ذاتيًا (vLLM وSGLang وOllama وأي نقطة نهاية متوافقة مع OpenAI أو Anthropic)

**الوسائط:**

- الصور والصوت والفيديو والمستندات إدخالًا وإخراجًا
- أسطح إمكانات مشتركة لتوليد الصور وتوليد الفيديو
- نسخ المذكرات الصوتية إلى نص
- تحويل النص إلى كلام مع عدة مزودين

**التطبيقات والواجهات:**

- WebChat وControl UI في المتصفح
- تطبيق مساعد في شريط القوائم على macOS
- عقدة iOS مع الاقتران وCanvas والكاميرا وتسجيل الشاشة والموقع والصوت
- عقدة Android مع الاقتران والدردشة والصوت وCanvas والكاميرا وأوامر الجهاز

**الأدوات والأتمتة:**

- أتمتة المتصفح وexec وsandboxing
- البحث على الويب (Brave وDuckDuckGo وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وOllama Web Search وPerplexity وSearXNG وTavily)
- مهام Cron وجدولة Heartbeat
- Skills وPlugins وخطوط أنابيب سير العمل (Lobster)
