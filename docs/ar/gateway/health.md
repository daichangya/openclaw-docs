---
read_when:
    - تشخيص اتصال القناة أو سلامة Gateway
    - فهم أوامر CLI وخيارات فحص السلامة
summary: أوامر فحص السلامة ومراقبة سلامة Gateway
title: فحوصات السلامة
x-i18n:
    generated_at: "2026-04-23T07:24:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# فحوصات السلامة (CLI)

دليل قصير للتحقق من اتصال القناة من دون تخمين.

## فحوصات سريعة

- `openclaw status` — ملخص محلي: إمكانية الوصول إلى Gateway/وضعه، وتلميح التحديث، وعمر مصادقة القناة المرتبطة، والجلسات + النشاط الأخير.
- `openclaw status --all` — تشخيص محلي كامل (للقراءة فقط، ملوّن، وآمن للصق لأغراض التصحيح).
- `openclaw status --deep` — يطلب من Gateway قيد التشغيل فحص سلامة مباشرًا (`health` مع `probe:true`)، بما في ذلك فحوصات القنوات لكل حساب عند الدعم.
- `openclaw health` — يطلب من Gateway قيد التشغيل لقطة سلامته (WS فقط؛ لا توجد مقابس قنوات مباشرة من CLI).
- `openclaw health --verbose` — يفرض فحص سلامة مباشرًا ويطبع تفاصيل اتصال Gateway.
- `openclaw health --json` — إخراج لقطة سلامة قابل للقراءة آليًا.
- أرسل `/status` كرسالة مستقلة في WhatsApp/WebChat للحصول على رد حالة من دون استدعاء الوكيل.
- السجلات: تتبّع `/tmp/openclaw/openclaw-*.log` ورشّح حسب `web-heartbeat` و`web-reconnect` و`web-auto-reply` و`web-inbound`.

## تشخيصات متعمقة

- بيانات الاعتماد على القرص: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (ينبغي أن يكون `mtime` حديثًا).
- مخزن الجلسات: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (يمكن تجاوز المسار في الإعدادات). ويعرض `status` العدد والمستلمين الأخيرين.
- تدفق إعادة الربط: `openclaw channels logout && openclaw channels login --verbose` عندما تظهر رموز الحالة 409–515 أو `loggedOut` في السجلات. (ملاحظة: يعيد تدفق تسجيل الدخول عبر QR التشغيل تلقائيًا مرة واحدة عند الحالة 515 بعد الاقتران.)
- تكون التشخيصات مفعّلة افتراضيًا. يسجل Gateway الحقائق التشغيلية ما لم يتم ضبط `diagnostics.enabled: false`. تسجل أحداث الذاكرة عدد البايتات في RSS/heap، وضغط العتبات، وضغط النمو. وتسجل أحداث الحمولة كبيرة الحجم ما تم رفضه أو اقتطاعه أو تقسيمه إلى أجزاء، إضافةً إلى الأحجام والحدود عند التوفر. وهي لا تسجل نص الرسالة، أو محتويات المرفقات، أو جسم Webhook، أو جسم الطلب أو الاستجابة الخام، أو الرموز، أو cookies، أو القيم السرية. ويبدأ Heartbeat نفسه مسجل الاستقرار المحدود، وهو متاح عبر `openclaw gateway stability` أو Gateway RPC ‏`diagnostics.stability`. تحفظ حالات الخروج القاتل لـ Gateway، وانتهاء مهلات الإيقاف، وإخفاقات بدء التشغيل عند إعادة التشغيل، أحدث لقطة من المسجل تحت `~/.openclaw/logs/stability/` عند وجود أحداث؛ افحص أحدث حزمة محفوظة باستخدام `openclaw gateway stability --bundle latest`.
- بالنسبة إلى تقارير الأخطاء، شغّل `openclaw gateway diagnostics export` وأرفق ملف zip الناتج. يجمع التصدير ملخص Markdown، وأحدث حزمة استقرار، وبيانات وصفية منقحة للسجلات، ولقطات حالة/سلامة منقحة لـ Gateway، وشكل الإعدادات. وهو مخصص للمشاركة: يتم حذف أو تنقيح نصوص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وcookies، ومعرّفات الحساب/الرسالة، والقيم السرية.

## إعدادات مراقب السلامة

- `gateway.channelHealthCheckMinutes`: عدد المرات التي يتحقق فيها Gateway من سلامة القنوات. الافتراضي: `5`. اضبطه إلى `0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقب السلامة عالميًا.
- `gateway.channelStaleEventThresholdMinutes`: المدة التي يمكن أن تبقى فيها قناة متصلة خاملة قبل أن يعتبرها مراقب السلامة قديمة ويعيد تشغيلها. الافتراضي: `30`. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: حد متحرك لمدة ساعة واحدة لعمليات إعادة تشغيل مراقب السلامة لكل قناة/حساب. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل عمليات إعادة تشغيل مراقب السلامة لقناة محددة مع إبقاء المراقبة العامة مفعلة.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز متعدد الحسابات يتغلب على الإعداد على مستوى القناة.
- تنطبق هذه التجاوزات لكل قناة على مراقبات القنوات المضمّنة التي تعرضها حاليًا: Discord وGoogle Chat وiMessage وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp.

## عند فشل شيء ما

- `logged out` أو الحالة 409–515 ← أعد الربط باستخدام `openclaw channels logout` ثم `openclaw channels login`.
- تعذر الوصول إلى Gateway ← ابدأ تشغيله: `openclaw gateway --port 18789` (استخدم `--force` إذا كان المنفذ مشغولًا).
- لا توجد رسائل واردة ← أكّد أن الهاتف المرتبط متصل وأن المرسل مسموح به (`channels.whatsapp.allowFrom`)؛ وبالنسبة إلى دردشات المجموعات، تأكد من تطابق قائمة السماح + قواعد الذكر (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## أمر "health" المخصص

يطلب `openclaw health` من Gateway قيد التشغيل لقطة سلامته (من دون مقابس قنوات
مباشرة من CLI). وبشكل افتراضي، يمكنه إرجاع لقطة Gateway مخزنة مؤقتًا وحديثة؛ ثم
يقوم Gateway بتحديث تلك الذاكرة المؤقتة في الخلفية. أما `openclaw health --verbose`
فيُجبر فحصًا مباشرًا بدلًا من ذلك. ويبلغ الأمر عن بيانات الاعتماد/عمر المصادقة المرتبطة عند التوفر،
وملخصات الفحص لكل قناة، وملخص مخزن الجلسات، ومدة الفحص. ويخرج
بقيمة غير صفرية إذا تعذر الوصول إلى Gateway أو إذا فشل الفحص/انتهت مهلته.

الخيارات:

- `--json`: إخراج JSON قابل للقراءة آليًا
- `--timeout <ms>`: تجاوز مهلة الفحص الافتراضية البالغة 10 ثوانٍ
- `--verbose`: فرض فحص مباشر وطباعة تفاصيل اتصال Gateway
- `--debug`: اسم مستعار لـ `--verbose`

تتضمن لقطة السلامة: `ok` (قيمة منطقية)، و`ts` (طابع زمني)، و`durationMs` (وقت الفحص)، وحالة كل قناة، وتوفر الوكيل، وملخص مخزن الجلسات.
