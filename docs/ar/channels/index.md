---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-04-25T13:41:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

يمكن لـ OpenClaw التحدث إليك على أي تطبيق دردشة تستخدمه بالفعل. تتصل كل قناة عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط وردود الفعل فتختلف حسب القناة.

## ملاحظات التسليم

- يتم تحويل ردود Telegram التي تحتوي على صيغة صور Markdown، مثل `![alt](url)`،
  إلى ردود وسائط في مسار الإرسال النهائي متى أمكن.
- يتم توجيه الرسائل المباشرة متعددة الأشخاص في Slack كدردشات جماعية، لذلك تنطبق
  سياسة المجموعات وسلوك الإشارات وقواعد جلسات المجموعات على محادثات MPIM.
- إعداد WhatsApp يتم عند الطلب: يمكن أن تعرض عملية الإعداد مسار الإعداد قبل
  تجهيز تبعيات تشغيل Baileys، ولا يحمّل Gateway بيئة تشغيل WhatsApp
  إلا عندما تكون القناة نشطة فعليًا.

## القنوات المدعومة

- [BlueBubbles](/ar/channels/bluebubbles) — **موصى به لـ iMessage**؛ يستخدم واجهة REST API لخادم BlueBubbles على macOS مع دعم كامل للميزات (Plugin مضمن؛ تعديل الرسائل، وإلغاء الإرسال، والتأثيرات، وردود الفعل، وإدارة المجموعات — التعديل معطّل حاليًا على macOS 26 Tahoe).
- [Discord](/ar/channels/discord) — Discord Bot API + Gateway؛ يدعم الخوادم والقنوات والرسائل المباشرة.
- [Feishu](/ar/channels/feishu) — روبوت Feishu/Lark عبر WebSocket (Plugin مضمن).
- [Google Chat](/ar/channels/googlechat) — تطبيق Google Chat API عبر HTTP webhook.
- [iMessage (legacy)](/ar/channels/imessage) — تكامل macOS قديم عبر imsg CLI (مهمل، استخدم BlueBubbles للإعدادات الجديدة).
- [IRC](/ar/channels/irc) — خوادم IRC التقليدية؛ قنوات + رسائل مباشرة مع عناصر تحكم الاقتران/قائمة السماح.
- [LINE](/ar/channels/line) — روبوت LINE Messaging API (Plugin مضمن).
- [Matrix](/ar/channels/matrix) — بروتوكول Matrix (Plugin مضمن).
- [Mattermost](/ar/channels/mattermost) — Bot API + WebSocket؛ قنوات ومجموعات ورسائل مباشرة (Plugin مضمن).
- [Microsoft Teams](/ar/channels/msteams) — Bot Framework؛ دعم مؤسسي (Plugin مضمن).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) — دردشة مستضافة ذاتيًا عبر Nextcloud Talk (Plugin مضمن).
- [Nostr](/ar/channels/nostr) — رسائل مباشرة لامركزية عبر NIP-04 (Plugin مضمن).
- [QQ Bot](/ar/channels/qqbot) — QQ Bot API؛ دردشة خاصة ودردشة جماعية ووسائط غنية (Plugin مضمن).
- [Signal](/ar/channels/signal) — signal-cli؛ يركز على الخصوصية.
- [Slack](/ar/channels/slack) — Bolt SDK؛ تطبيقات مساحة العمل.
- [Synology Chat](/ar/channels/synology-chat) — Synology NAS Chat عبر Webhooks صادرة وواردة (Plugin مضمن).
- [Telegram](/ar/channels/telegram) — Bot API عبر grammY؛ يدعم المجموعات.
- [Tlon](/ar/channels/tlon) — تطبيق مراسلة قائم على Urbit (Plugin مضمن).
- [Twitch](/ar/channels/twitch) — دردشة Twitch عبر اتصال IRC (Plugin مضمن).
- [Voice Call](/ar/plugins/voice-call) — الاتصال الهاتفي عبر Plivo أو Twilio (Plugin، يُثبَّت بشكل منفصل).
- [WebChat](/ar/web/webchat) — واجهة WebChat لـ Gateway عبر WebSocket.
- [WeChat](/ar/channels/wechat) — Plugin Tencent iLink Bot عبر تسجيل الدخول برمز QR؛ الدردشات الخاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) — الأكثر شعبية؛ يستخدم Baileys ويتطلب الاقتران برمز QR.
- [Zalo](/ar/channels/zalo) — Zalo Bot API؛ تطبيق المراسلة الشهير في فيتنام (Plugin مضمن).
- [Zalo Personal](/ar/channels/zalouser) — حساب Zalo شخصي عبر تسجيل الدخول برمز QR (Plugin مضمن).

## ملاحظات

- يمكن تشغيل القنوات بالتزامن؛ قم بتهيئة عدة قنوات وسيوجّه OpenClaw الرسائل لكل دردشة.
- عادةً ما يكون أسرع إعداد هو **Telegram** (رمز مميز بسيط للروبوت). يتطلب WhatsApp الاقتران برمز QR
  ويخزن المزيد من الحالة على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- يتم فرض الاقتران في الرسائل المباشرة وقوائم السماح من أجل الأمان؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- يتم توثيق موفري النماذج بشكل منفصل؛ راجع [موفرو النماذج](/ar/providers/models).
