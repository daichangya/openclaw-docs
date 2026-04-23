---
read_when:
    - تغيير مصادقة لوحة التحكم أو أوضاع تعريضها
summary: الوصول إلى لوحة تحكم Gateway (Control UI) والمصادقة عليها
title: لوحة التحكم
x-i18n:
    generated_at: "2026-04-23T07:35:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# لوحة التحكم (Control UI)

لوحة تحكم Gateway هي واجهة Control UI في المتصفح وتُقدَّم افتراضيًا عند `/`
(يمكن تجاوزها باستخدام `gateway.controlUi.basePath`).

فتح سريع (Gateway محلي):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (أو [http://localhost:18789/](http://localhost:18789/))

مراجع أساسية:

- [Control UI](/ar/web/control-ui) للاستخدام وقدرات واجهة المستخدم.
- [Tailscale](/ar/gateway/tailscale) لأتمتة Serve/Funnel.
- [أسطح الويب](/ar/web) لأوضاع الربط والملاحظات الأمنية.

تُفرض المصادقة عند مصافحة WebSocket عبر مسار مصادقة gateway المهيأ:

- `connect.params.auth.token`
- `connect.params.auth.password`
- headers هوية Tailscale Serve عندما تكون `gateway.auth.allowTailscale: true`
- headers هوية trusted-proxy عندما تكون `gateway.auth.mode: "trusted-proxy"`

راجع `gateway.auth` في [تهيئة Gateway](/ar/gateway/configuration).

ملاحظة أمنية: تُعد Control UI **سطح إدارة** (الدردشة، والتهيئة، وموافقات exec).
لا تعرضها علنًا. وتحتفظ الواجهة بـ tokens الخاصة بعنوان URL للوحة التحكم في sessionStorage
لجلسة علامة تبويب المتصفح الحالية وعنوان gateway المحدد، وتزيلها من عنوان URL بعد التحميل.
ويُفضّل localhost أو Tailscale Serve أو نفق SSH.

## المسار السريع (موصى به)

- بعد onboarding، يفتح CLI لوحة التحكم تلقائيًا ويطبع رابطًا نظيفًا (من دون token).
- أعد فتحها في أي وقت: `openclaw dashboard` (ينسخ الرابط، ويفتح المتصفح إن أمكن، ويعرض تلميح SSH إذا كانت البيئة بدون واجهة).
- إذا طلبت الواجهة مصادقة عبر سر مشترك، فألصق token أو
  كلمة المرور المهيأة في إعدادات Control UI.

## أساسيات المصادقة (محلي مقابل بعيد)

- **Localhost**: افتح `http://127.0.0.1:18789/`.
- **مصدر token للسر المشترك**: `gateway.auth.token` (أو
  `OPENCLAW_GATEWAY_TOKEN`)؛ يمكن لـ `openclaw dashboard` تمريرها عبر جزء URL
  لتمهيد لمرة واحدة، وتحتفظ بها Control UI في sessionStorage للجلسة الحالية
  لعلامة تبويب المتصفح وعنوان gateway المحدد بدلًا من localStorage.
- إذا كانت `gateway.auth.token` مُدارة عبر SecretRef، فإن `openclaw dashboard`
  يطبع/ينسخ/يفتح عنوان URL غير مضمّن فيه token عمدًا. وهذا يمنع كشف
  tokens المُدارة خارجيًا في سجلات shell أو سجل الحافظة أو وسائط تشغيل
  المتصفح.
- إذا كانت `gateway.auth.token` مهيأة كـ SecretRef وكانت غير محلولة في shell
  الحالية، فإن `openclaw dashboard` يطبع مع ذلك عنوان URL غير مضمّن فيه token
  مع إرشادات قابلة للتنفيذ لإعداد المصادقة.
- **كلمة مرور السر المشترك**: استخدم `gateway.auth.password` المهيأة (أو
  `OPENCLAW_GATEWAY_PASSWORD`). ولا تحتفظ اللوحة بكلمات المرور عبر
  إعادة التحميل.
- **أوضاع تحمل الهوية**: يمكن لـ Tailscale Serve تلبية مصادقة Control UI/WebSocket
  عبر headers الهوية عندما تكون `gateway.auth.allowTailscale: true`، كما يمكن لـ
  reverse proxy غير loopback والواعي بالهوية تلبية ذلك عندما تكون
  `gateway.auth.mode: "trusted-proxy"`. وفي تلك الأوضاع لا تحتاج اللوحة إلى
  سر مشترك مُلصق لمصادقة WebSocket.
- **ليس localhost**: استخدم Tailscale Serve أو ربط سر مشترك غير loopback، أو
  reverse proxy غير loopback وواعٍ بالهوية مع
  `gateway.auth.mode: "trusted-proxy"`، أو نفق SSH. ولا تزال HTTP APIs تستخدم
  مصادقة السر المشترك ما لم تشغّل عمدًا
  `gateway.auth.mode: "none"` للـ private-ingress أو مصادقة HTTP الخاصة بـ trusted-proxy. راجع
  [أسطح الويب](/ar/web).

<a id="if-you-see-unauthorized-1008"></a>

## إذا رأيت "unauthorized" / 1008

- تأكد من أن gateway يمكن الوصول إليه (محليًا: `openclaw status`؛ وبعيدًا: نفق SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`).
- بالنسبة إلى `AUTH_TOKEN_MISMATCH`، يمكن للعملاء تنفيذ إعادة محاولة موثوقة واحدة باستخدام token جهاز مخزنة مؤقتًا عندما يعيد gateway تلميحات إعادة المحاولة. وتعيد إعادة محاولة token المخزنة مؤقتًا تلك استخدام النطاقات المعتمدة المخزنة مؤقتًا الخاصة بـ token؛ أما مستدعيات `deviceToken` الصريحة / `scopes` الصريحة فتحتفظ بمجموعة النطاقات المطلوبة الخاصة بها. وإذا استمرت المصادقة في الفشل بعد تلك الإعادة، فقم بحل انجراف token يدويًا.
- خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال: token/كلمة مرور مشتركة صريحة أولًا، ثم `deviceToken` صريحة، ثم token جهاز مخزنة، ثم token تمهيد.
- في مسار Control UI غير المتزامن الخاص بـ Tailscale Serve، يتم تسلسل المحاولات الفاشلة لنفس
  `{scope, ip}` قبل أن يسجل محدد failed-auth تلك المحاولات، لذلك قد تُظهر إعادة المحاولة السيئة المتزامنة الثانية بالفعل الرسالة `retry later`.
- لخطوات إصلاح انجراف token، اتبع [قائمة التحقق لاسترداد انجراف Token](/ar/cli/devices#token-drift-recovery-checklist).
- استرجع أو وفّر السر المشترك من مضيف gateway:
  - Token: `openclaw config get gateway.auth.token`
  - كلمة المرور: حل القيمة المهيأة `gateway.auth.password` أو
    `OPENCLAW_GATEWAY_PASSWORD`
  - token مُدارة عبر SecretRef: حل مزود السر الخارجي أو صدّر
    `OPENCLAW_GATEWAY_TOKEN` في هذه shell، ثم أعد تشغيل `openclaw dashboard`
  - لا يوجد سر مشترك مهيأ: `openclaw doctor --generate-gateway-token`
- في إعدادات اللوحة، ألصق token أو كلمة المرور في حقل المصادقة،
  ثم اتصل.
- يوجد محدد لغة الواجهة في **Overview -> Gateway Access -> Language**.
  وهو جزء من بطاقة الوصول، وليس قسم Appearance.
