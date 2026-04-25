---
read_when:
    - تشخيص اتصال القنوات أو سلامة Gateway
    - فهم أوامر CLI الخاصة بفحوصات السلامة وخياراتها
summary: أوامر التحقق من السلامة ومراقبة سلامة Gateway
title: فحوصات السلامة
x-i18n:
    generated_at: "2026-04-25T13:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

دليل قصير للتحقق من اتصال القنوات من دون تخمين.

## فحوصات سريعة

- `openclaw status` — ملخص محلي: إمكانية الوصول إلى Gateway/وضعه، وتلميح التحديث، وعمر مصادقة القناة المرتبطة، والجلسات + النشاط الأخير.
- `openclaw status --all` — تشخيص محلي كامل (للقراءة فقط، ملوّن، وآمن للنسخ واللصق لأغراض التصحيح).
- `openclaw status --deep` — يطلب من Gateway قيد التشغيل إجراء فحص سلامة حي (`health` مع `probe:true`)، بما في ذلك عمليات فحص القنوات لكل حساب عند دعمها.
- `openclaw health` — يطلب من Gateway قيد التشغيل لقطة السلامة الخاصة به (عبر WS فقط؛ لا توجد مقابس قنوات مباشرة من CLI).
- `openclaw health --verbose` — يفرض فحص سلامة حيًا ويطبع تفاصيل اتصال Gateway.
- `openclaw health --json` — خرج لقطة سلامة بصيغة قابلة للقراءة آليًا.
- أرسل `/status` كرسالة مستقلة في WhatsApp/WebChat للحصول على رد حالة من دون استدعاء الوكيل.
- السجلات: تتبّع `/tmp/openclaw/openclaw-*.log` وقم بالتصفية حسب `web-heartbeat` و`web-reconnect` و`web-auto-reply` و`web-inbound`.

## تشخيصات متعمقة

- بيانات الاعتماد على القرص: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` ‏(يجب أن يكون `mtime` حديثًا).
- مخزن الجلسات: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` ‏(يمكن تجاوز المسار في الإعداد). يظهر العدد والمستلمون الأخيرون عبر `status`.
- تدفق إعادة الربط: `openclaw channels logout && openclaw channels login --verbose` عندما تظهر رموز الحالة 409–515 أو `loggedOut` في السجلات. (ملاحظة: يعيد تدفق تسجيل الدخول عبر QR التشغيل تلقائيًا مرة واحدة للحالة 515 بعد الاقتران.)
- تكون التشخيصات مفعّلة افتراضيًا. يسجّل Gateway الحقائق التشغيلية ما لم يتم ضبط `diagnostics.enabled: false`. تسجّل أحداث الذاكرة عدد البايتات لـ RSS/heap وضغط العتبة وضغط النمو. وتسجّل أحداث الحمولة كبيرة الحجم ما تم رفضه أو اقتطاعه أو تقسيمه إلى أجزاء، بالإضافة إلى الأحجام والحدود عند توفرها. وهي لا تسجل نص الرسالة، أو محتويات المرفقات، أو جسم Webhook، أو جسم الطلب أو الاستجابة الخام، أو الرموز، أو cookies، أو القيم السرية. ويبدأ Heartbeat نفسه مسجل الاستقرار المحدود، وهو متاح عبر `openclaw gateway stability` أو Gateway RPC ‏`diagnostics.stability`. تؤدي عمليات خروج Gateway الفادحة، ومهلات الإيقاف، وإخفاقات بدء التشغيل بعد إعادة التشغيل إلى حفظ أحدث لقطة من المسجل تحت `~/.openclaw/logs/stability/` عند وجود أحداث؛ افحص أحدث حزمة محفوظة باستخدام `openclaw gateway stability --bundle latest`.
- لتقارير الأخطاء، شغّل `openclaw gateway diagnostics export` وأرفق ملف zip الناتج. يجمع التصدير ملخص Markdown، وأحدث حزمة استقرار، وبيانات تعريف سجلات منقحة، ولقطات حالة/سلامة منقحة لـ Gateway، وشكل الإعداد. وهو معدّ للمشاركة: يتم حذف أو تنقيح نص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وcookies، ومعرّفات الحساب/الرسائل، والقيم السرية. راجع [Diagnostics Export](/ar/gateway/diagnostics).

## إعداد Health monitor

- `gateway.channelHealthCheckMinutes`: عدد المرات التي يتحقق فيها Gateway من سلامة القنوات. الافتراضي: `5`. اضبط القيمة `0` لتعطيل عمليات إعادة تشغيل Health monitor عالميًا.
- `gateway.channelStaleEventThresholdMinutes`: المدة التي يمكن أن تبقى فيها القناة المتصلة خاملة قبل أن يعتبرها Health monitor قديمة ويعيد تشغيلها. الافتراضي: `30`. اجعل هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: الحد المتحرك لمدة ساعة واحدة لعمليات إعادة التشغيل بواسطة Health monitor لكل قناة/حساب. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل عمليات إعادة التشغيل بواسطة Health monitor لقناة محددة مع الإبقاء على المراقبة العالمية مفعّلة.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز خاص بالحسابات المتعددة وله أولوية على إعداد مستوى القناة.
- تنطبق هذه التجاوزات لكل قناة على مراقبات القنوات المضمنة التي تعرضها حاليًا: Discord وGoogle Chat وiMessage وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp.

## عند فشل شيء ما

- `logged out` أو الحالة 409–515 → أعد الربط باستخدام `openclaw channels logout` ثم `openclaw channels login`.
- تعذر الوصول إلى Gateway → ابدأ تشغيله: `openclaw gateway --port 18789` ‏(استخدم `--force` إذا كان المنفذ مشغولًا).
- لا توجد رسائل واردة → تأكد من أن الهاتف المرتبط متصل وأن المرسل مسموح له (`channels.whatsapp.allowFrom`)؛ وبالنسبة إلى الدردشات الجماعية، تأكد من تطابق قواعد قائمة السماح + الإشارات (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## أمر "health" المخصص

يطلب `openclaw health` من Gateway قيد التشغيل لقطة السلامة الخاصة به (من دون مقابس قنوات مباشرة من CLI). افتراضيًا، يمكنه إرجاع لقطة Gateway مخزنة مؤقتًا وجديدة؛ ثم يقوم Gateway بتحديث هذا cache في الخلفية. أما `openclaw health --verbose` فيفرض فحصًا حيًا بدلًا من ذلك. يبلّغ الأمر عن بيانات الاعتماد المرتبطة/عمر المصادقة عند توفرها، وملخصات الفحص لكل قناة، وملخص مخزن الجلسات، ومدة الفحص. ويخرج بقيمة غير صفرية إذا تعذر الوصول إلى Gateway أو إذا فشل الفحص/انتهت مهلته.

الخيارات:

- `--json`: خرج JSON قابل للقراءة آليًا
- `--timeout <ms>`: تجاوز مهلة الفحص الافتراضية البالغة 10 ثوانٍ
- `--verbose`: فرض فحص حي وطباعة تفاصيل اتصال Gateway
- `--debug`: اسم بديل لـ `--verbose`

تتضمن لقطة السلامة: `ok` ‏(قيمة منطقية)، و`ts` ‏(طابع زمني)، و`durationMs` ‏(زمن الفحص)، وحالة كل قناة، وتوفر الوكيل، وملخص مخزن الجلسات.

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
