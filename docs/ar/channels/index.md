---
read_when:
    - تريد اختيار قناة دردشة لـ OpenClaw
    - تحتاج إلى نظرة عامة سريعة على منصات المراسلة المدعومة
summary: منصات المراسلة التي يمكن لـ OpenClaw الاتصال بها
title: قنوات الدردشة
x-i18n:
    generated_at: "2026-04-19T01:11:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# قنوات الدردشة

يمكن لـ OpenClaw التحدث معك عبر أي تطبيق دردشة تستخدمه بالفعل. يتصل كل Channel عبر Gateway.
النص مدعوم في كل مكان؛ أما الوسائط والتفاعلات فتختلف حسب الـ channel.

## القنوات المدعومة

- [BlueBubbles](/ar/channels/bluebubbles) — **موصى به لـ iMessage**؛ يستخدم واجهة REST API لخادم BlueBubbles على macOS مع دعم كامل للميزات (Plugin مضمّن؛ التعديل، إلغاء الإرسال، التأثيرات، التفاعلات، إدارة المجموعات — التعديل معطّل حاليًا على macOS 26 Tahoe).
- [Discord](/ar/channels/discord) — Discord Bot API + Gateway؛ يدعم الخوادم والقنوات والرسائل الخاصة.
- [Feishu](/ar/channels/feishu) — بوت Feishu/Lark عبر WebSocket (Plugin مضمّن).
- [Google Chat](/ar/channels/googlechat) — تطبيق Google Chat API عبر HTTP webhook.
- [iMessage (legacy)](/ar/channels/imessage) — تكامل macOS قديم عبر imsg CLI (مهمل، استخدم BlueBubbles للإعدادات الجديدة).
- [IRC](/ar/channels/irc) — خوادم IRC الكلاسيكية؛ قنوات + رسائل خاصة مع عناصر تحكم بالاقتران وقائمة السماح.
- [LINE](/ar/channels/line) — بوت LINE Messaging API (Plugin مضمّن).
- [Matrix](/ar/channels/matrix) — بروتوكول Matrix (Plugin مضمّن).
- [Mattermost](/ar/channels/mattermost) — Bot API + WebSocket؛ القنوات والمجموعات والرسائل الخاصة (Plugin مضمّن).
- [Microsoft Teams](/ar/channels/msteams) — Bot Framework؛ دعم للمؤسسات (Plugin مضمّن).
- [Nextcloud Talk](/ar/channels/nextcloud-talk) — دردشة مستضافة ذاتيًا عبر Nextcloud Talk (Plugin مضمّن).
- [Nostr](/ar/channels/nostr) — رسائل خاصة لامركزية عبر NIP-04 (Plugin مضمّن).
- [QQ Bot](/ar/channels/qqbot) — QQ Bot API؛ دردشة خاصة، دردشة جماعية، ووسائط غنية (Plugin مضمّن).
- [Signal](/ar/channels/signal) — signal-cli؛ يركز على الخصوصية.
- [Slack](/ar/channels/slack) — Bolt SDK؛ تطبيقات مساحات العمل.
- [Synology Chat](/ar/channels/synology-chat) — Synology NAS Chat عبر webhooks صادرة وواردة (Plugin مضمّن).
- [Telegram](/ar/channels/telegram) — Bot API عبر grammY؛ يدعم المجموعات.
- [Tlon](/ar/channels/tlon) — برنامج مراسلة قائم على Urbit (Plugin مضمّن).
- [Twitch](/ar/channels/twitch) — دردشة Twitch عبر اتصال IRC (Plugin مضمّن).
- [Voice Call](/ar/plugins/voice-call) — الاتصالات الهاتفية عبر Plivo أو Twilio (Plugin، يُثبَّت بشكل منفصل).
- [WebChat](/web/webchat) — واجهة Gateway WebChat عبر WebSocket.
- [WeChat](/ar/channels/wechat) — Plugin بوت Tencent iLink عبر تسجيل الدخول باستخدام QR؛ الدردشات الخاصة فقط (Plugin خارجي).
- [WhatsApp](/ar/channels/whatsapp) — الأكثر شيوعًا؛ يستخدم Baileys ويتطلب الاقتران عبر QR.
- [Zalo](/ar/channels/zalo) — Zalo Bot API؛ تطبيق المراسلة الشهير في فيتنام (Plugin مضمّن).
- [Zalo Personal](/ar/channels/zalouser) — حساب Zalo شخصي عبر تسجيل الدخول باستخدام QR (Plugin مضمّن).

## ملاحظات

- يمكن تشغيل القنوات بالتزامن؛ اضبط عدة قنوات وسيقوم OpenClaw بالتوجيه لكل دردشة.
- عادةً ما يكون أسرع إعداد هو **Telegram** (رمز بوت بسيط). يتطلب WhatsApp الاقتران عبر QR ويخزن
  مزيدًا من الحالة على القرص.
- يختلف سلوك المجموعات حسب القناة؛ راجع [المجموعات](/ar/channels/groups).
- يتم فرض الاقتران في الرسائل الخاصة وقوائم السماح لأسباب تتعلق بالسلامة؛ راجع [الأمان](/ar/gateway/security).
- استكشاف الأخطاء وإصلاحها: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).
- يتم توثيق موفري النماذج بشكل منفصل؛ راجع [موفرو النماذج](/ar/providers/models).
