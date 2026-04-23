---
read_when:
    - توصيل Codex أو Claude Code أو عميل MCP آخر بالقنوات المعتمدة على OpenClaw
    - تشغيل `openclaw mcp serve`
    - إدارة تعريفات خوادم MCP المحفوظة في OpenClaw
summary: كشف محادثات قنوات OpenClaw عبر MCP وإدارة تعريفات خوادم MCP المحفوظة
title: MCP
x-i18n:
    generated_at: "2026-04-23T07:22:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
    source_path: cli/mcp.md
    workflow: 15
---

# MCP

للأمر `openclaw mcp` وظيفتان:

- تشغيل OpenClaw كخادم MCP باستخدام `openclaw mcp serve`
- إدارة تعريفات خوادم MCP الصادرة المملوكة لـ OpenClaw باستخدام `list` و `show` و
  `set` و `unset`

بعبارة أخرى:

- `serve` يعني أن OpenClaw يعمل كخادم MCP
- `list` / `show` / `set` / `unset` تعني أن OpenClaw يعمل كسجل
  على جانب عميل MCP لخوادم MCP أخرى قد تستهلكها بيئات التشغيل الخاصة به لاحقًا

استخدم [`openclaw acp`](/ar/cli/acp) عندما ينبغي لـ OpenClaw أن يستضيف جلسة
coding harness بنفسه ويوجه بيئة التشغيل تلك عبر ACP.

## OpenClaw كخادم MCP

هذا هو مسار `openclaw mcp serve`.

## متى تستخدم `serve`

استخدم `openclaw mcp serve` عندما:

- يجب أن يتحدث Codex أو Claude Code أو عميل MCP آخر مباشرة إلى
  محادثات القنوات المعتمدة على OpenClaw
- لديك بالفعل Gateway محلي أو بعيد لـ OpenClaw مع جلسات موجّهة
- تريد خادم MCP واحدًا يعمل عبر الواجهات الخلفية لقنوات OpenClaw بدلًا
  من تشغيل جسور منفصلة لكل قناة

استخدم [`openclaw acp`](/ar/cli/acp) بدلًا من ذلك عندما ينبغي لـ OpenClaw أن يستضيف
بيئة تشغيل البرمجة بنفسه ويحافظ على جلسة الوكيل داخل OpenClaw.

## كيف يعمل

يبدأ `openclaw mcp serve` خادم MCP عبر stdio. يملك عميل MCP
هذه العملية. وما دام العميل يُبقي جلسة stdio مفتوحة، يتصل الجسر بـ
Gateway محلي أو بعيد لـ OpenClaw عبر WebSocket ويكشف محادثات القنوات
الموجّهة عبر MCP.

دورة الحياة:

1. يشغّل عميل MCP الأمر `openclaw mcp serve`
2. يتصل الجسر بـ Gateway
3. تصبح الجلسات الموجّهة محادثات MCP وأدوات transcript/history
4. توضع الأحداث الحية في قائمة انتظار داخل الذاكرة ما دام الجسر متصلًا
5. إذا كان وضع قناة Claude مفعّلًا، يمكن للجلسة نفسها أيضًا تلقي
   إشعارات دفع خاصة بـ Claude

سلوك مهم:

- تبدأ حالة قائمة الانتظار الحية عند اتصال الجسر
- يُقرأ transcript history الأقدم باستخدام `messages_read`
- لا توجد إشعارات دفع Claude إلا ما دامت جلسة MCP حية
- عند فصل العميل، يخرج الجسر وتختفي قائمة الانتظار الحية
- تُنهى خوادم stdio MCP التي يشغّلها OpenClaw (المضمّنة أو المضبوطة من المستخدم)
  كشجرة عمليات عند الإيقاف، لذا لا تبقى العمليات الفرعية التي يبدأها
  الخادم بعد خروج عميل stdio الأب
- يؤدي حذف جلسة أو إعادة تعيينها إلى التخلص من عملاء MCP لتلك الجلسة عبر
  مسار التنظيف المشترك لبيئة التشغيل، لذلك لا تبقى اتصالات stdio عالقة
  مرتبطة بجلسة تمت إزالتها

## اختر وضع العميل

استخدم الجسر نفسه بطريقتين مختلفتين:

- عملاء MCP العامّون: أدوات MCP القياسية فقط. استخدم `conversations_list`،
  و`messages_read`، و`events_poll`، و`events_wait`، و`messages_send`، و
  أدوات الموافقة.
- Claude Code: أدوات MCP القياسية بالإضافة إلى محول القناة الخاص بـ Claude.
  فعّل `--claude-channel-mode on` أو اترك القيمة الافتراضية `auto`.

حاليًا، يتصرف `auto` بالطريقة نفسها التي يتصرف بها `on`. لا يوجد كشف لقدرات
العميل حتى الآن.

## ما الذي يكشفه `serve`

يستخدم الجسر بيانات تعريف مسار الجلسة الموجودة في Gateway أصلًا لكشف
المحادثات المعتمدة على القنوات. تظهر المحادثة عندما يكون لدى OpenClaw
بالفعل حالة جلسة ذات مسار معروف مثل:

- `channel`
- بيانات تعريف المستلم أو الوجهة
- `accountId` اختياري
- `threadId` اختياري

وهذا يمنح عملاء MCP موضعًا واحدًا من أجل:

- إدراج المحادثات الموجّهة الحديثة
- قراءة transcript history الحديث
- انتظار أحداث واردة جديدة
- إرسال رد مرة أخرى عبر المسار نفسه
- رؤية طلبات الموافقة التي تصل أثناء اتصال الجسر

## الاستخدام

```bash
# Gateway محلي
openclaw mcp serve

# Gateway بعيد
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway بعيد مع مصادقة بكلمة مرور
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# تفعيل سجلات الجسر المفصلة
openclaw mcp serve --verbose

# تعطيل إشعارات الدفع الخاصة بـ Claude
openclaw mcp serve --claude-channel-mode off
```

## أدوات الجسر

يكشف الجسر الحالي أدوات MCP التالية:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

يسرد المحادثات الحديثة المعتمدة على الجلسات والتي لديها بالفعل بيانات تعريف
المسار في حالة جلسة Gateway.

مرشحات مفيدة:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

يعيد محادثة واحدة حسب `session_key`.

### `messages_read`

يقرأ رسائل النص الحديث في transcript لمحادثة واحدة معتمدة على جلسة.

### `attachments_fetch`

يستخرج كتل محتوى الرسائل غير النصية من رسالة transcript واحدة. هذه
واجهة بيانات تعريف فوق محتوى transcript، وليست مخزنًا مستقلاً دائمًا
لكتل المرفقات الثنائية.

### `events_poll`

يقرأ الأحداث الحية الموضوعة في قائمة الانتظار منذ مؤشر رقمي.

### `events_wait`

ينفذ long-poll حتى يصل الحدث المطابق التالي الموضوع في قائمة الانتظار أو
تنتهي المهلة.

استخدم هذا عندما يحتاج عميل MCP عام إلى تسليم قريب من الوقت الفعلي من دون
بروتوكول دفع خاص بـ Claude.

### `messages_send`

يرسل النص مرة أخرى عبر المسار نفسه المسجل بالفعل على الجلسة.

السلوك الحالي:

- يتطلب مسار محادثة موجودًا بالفعل
- يستخدم القناة الخاصة بالجلسة، والمستلم، ومعرّف الحساب، ومعرّف thread
- يرسل النص فقط

### `permissions_list_open`

يسرد طلبات الموافقة المعلقة الخاصة بـ exec/Plugin التي لاحظها الجسر منذ
اتصاله بـ Gateway.

### `permissions_respond`

يحسم طلب موافقة واحدًا معلقًا من طلبات exec/Plugin باستخدام:

- `allow-once`
- `allow-always`
- `deny`

## نموذج الأحداث

يحافظ الجسر على قائمة انتظار أحداث داخل الذاكرة ما دام متصلًا.

أنواع الأحداث الحالية:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

قيود مهمة:

- قائمة الانتظار حية فقط؛ وتبدأ عند بدء جسر MCP
- لا يعيد `events_poll` و`events_wait` تشغيل سجل Gateway الأقدم
  بمفردهما
- يجب قراءة الأعمال المتراكمة الدائمة باستخدام `messages_read`

## إشعارات قناة Claude

يمكن للجسر أيضًا كشف إشعارات قناة خاصة بـ Claude. وهذا هو
المكافئ في OpenClaw لمحول قناة Claude Code: تظل أدوات MCP القياسية متاحة،
لكن يمكن أيضًا أن تصل الرسائل الواردة الحية كإشعارات MCP خاصة بـ Claude.

العلامات:

- `--claude-channel-mode off`: أدوات MCP القياسية فقط
- `--claude-channel-mode on`: تفعيل إشعارات قناة Claude
- `--claude-channel-mode auto`: القيمة الافتراضية الحالية؛ سلوك الجسر نفسه كما في `on`

عند تفعيل وضع قناة Claude، يعلن الخادم قدرات Claude التجريبية
ويمكنه إرسال:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

السلوك الحالي للجسر:

- تُمرَّر رسائل transcript الواردة من النوع `user` على أنها
  `notifications/claude/channel`
- تُتتبَّع طلبات أذونات Claude المستلمة عبر MCP داخل الذاكرة
- إذا أرسلت المحادثة المرتبطة لاحقًا `yes abcde` أو `no abcde`، يحول الجسر
  ذلك إلى `notifications/claude/channel/permission`
- هذه الإشعارات مرتبطة بالجلسة الحية فقط؛ فإذا فصل عميل MCP،
  فلن يكون هناك هدف دفع

هذا السلوك مخصص للعميل عمدًا. ينبغي لعملاء MCP العامين الاعتماد على
أدوات الاستطلاع القياسية.

## تكوين عميل MCP

مثال على تكوين عميل stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

بالنسبة إلى معظم عملاء MCP العامين، ابدأ بسطح الأدوات القياسي وتجاهل
وضع Claude. فعّل وضع Claude فقط للعملاء الذين يفهمون فعلًا
طرائق الإشعار الخاصة بـ Claude.

## الخيارات

يدعم `openclaw mcp serve` ما يلي:

- `--url <url>`: عنوان URL لـ Gateway WebSocket
- `--token <token>`: رمز Gateway
- `--token-file <path>`: قراءة الرمز من ملف
- `--password <password>`: كلمة مرور Gateway
- `--password-file <path>`: قراءة كلمة المرور من ملف
- `--claude-channel-mode <auto|on|off>`: وضع إشعارات Claude
- `-v`, `--verbose`: سجلات مفصلة على stderr

يفضَّل استخدام `--token-file` أو `--password-file` بدلًا من الأسرار المضمنة
قدر الإمكان.

## الأمان وحد الثقة

لا يخترع الجسر التوجيه. فهو يكشف فقط المحادثات التي يعرف Gateway
بالفعل كيف يوجّهها.

وهذا يعني أن:

- قوائم سماح المرسلين، والاقتران، والثقة على مستوى القناة تظل من مسؤولية
  تكوين قناة OpenClaw الأساسية
- لا يمكن لـ `messages_send` إلا الرد عبر مسار مخزن موجود بالفعل
- تبقى حالة الموافقة حية/داخل الذاكرة فقط لجلسة الجسر الحالية
- يجب أن تستخدم مصادقة الجسر ضوابط رمز Gateway أو كلمة المرور نفسها التي
  تثق بها لأي عميل Gateway بعيد آخر

إذا كانت محادثة مفقودة من `conversations_list`، فالسبب المعتاد ليس
تكوين MCP. بل هو غياب بيانات تعريف المسار أو عدم اكتمالها في جلسة
Gateway الأساسية.

## الاختبار

يشحن OpenClaw اختبار Docker smoke حتميًا لهذا الجسر:

```bash
pnpm test:docker:mcp-channels
```

هذا الاختبار smoke:

- يبدأ حاوية Gateway مهيأة مسبقًا
- يبدأ حاوية ثانية تشغّل `openclaw mcp serve`
- يتحقق من اكتشاف المحادثات، وقراءات transcript، وقراءات بيانات تعريف المرفقات،
  وسلوك قائمة انتظار الأحداث الحية، وتوجيه الإرسال الصادر
- يتحقق من إشعارات القناة والأذونات بأسلوب Claude عبر جسر
  stdio MCP الحقيقي

هذه هي أسرع طريقة لإثبات أن الجسر يعمل من دون توصيل حساب
Telegram أو Discord أو iMessage حقيقي ضمن تشغيل الاختبار.

للسياق الأوسع للاختبار، راجع [الاختبار](/ar/help/testing).

## استكشاف الأخطاء وإصلاحها

### لم يتم إرجاع أي محادثات

يعني هذا عادة أن جلسة Gateway غير قابلة للتوجيه بالفعل. تأكد من أن
الجلسة الأساسية مخزّن فيها channel/provider، والمستلم، وبيانات تعريف
المسار الاختيارية للحساب/thread.

### ‏`events_poll` أو `events_wait` يفوّت الرسائل الأقدم

هذا متوقع. تبدأ قائمة الانتظار الحية عند اتصال الجسر. اقرأ transcript
history الأقدم باستخدام `messages_read`.

### لا تظهر إشعارات Claude

تحقق من كل ما يلي:

- أبقى العميل جلسة stdio MCP مفتوحة
- كانت قيمة `--claude-channel-mode` هي `on` أو `auto`
- يفهم العميل فعلًا طرائق الإشعار الخاصة بـ Claude
- حدثت الرسالة الواردة بعد اتصال الجسر

### الموافقات مفقودة

يعرض `permissions_list_open` فقط طلبات الموافقة التي تمت ملاحظتها بينما كان
الجسر متصلًا. وهو ليس API دائمًا لسجل الموافقات.

## OpenClaw كسجل عميل MCP

هذا هو مسار `openclaw mcp list` و`show` و`set` و`unset`.

هذه الأوامر لا تكشف OpenClaw عبر MCP. بل تدير تعريفات خادم MCP
المملوكة لـ OpenClaw ضمن `mcp.servers` في تكوين OpenClaw.

هذه التعريفات المحفوظة مخصصة لبيئات التشغيل التي يشغّلها OpenClaw أو يضبطها
لاحقًا، مثل Pi المضمّن ومحولات بيئات التشغيل الأخرى. يخزّن OpenClaw
التعريفات مركزيًا حتى لا تحتاج تلك البيئات إلى الاحتفاظ بقوائم خوادم
MCP مكررة خاصة بها.

سلوك مهم:

- هذه الأوامر لا تقرأ أو تكتب إلا تكوين OpenClaw
- وهي لا تتصل بخادم MCP الهدف
- وهي لا تتحقق مما إذا كان الأمر أو عنوان URL أو النقل البعيد
  قابلًا للوصول الآن
- تحدد محولات بيئات التشغيل أشكال النقل التي تدعمها فعلًا وقت
  التنفيذ
- يكشف Pi المضمّن أدوات MCP المضبوطة في ملفات تعريف أدوات `coding` و`messaging`
  العادية؛ بينما لا يزال `minimal` يخفيها، ويعطّلها
  `tools.deny: ["bundle-mcp"]` بشكل صريح

## تعريفات خوادم MCP المحفوظة

يخزّن OpenClaw أيضًا سجلًا خفيفًا لخوادم MCP في التكوين للأسطح
التي تريد تعريفات MCP مُدارة من OpenClaw.

الأوامر:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

ملاحظات:

- يقوم `list` بفرز أسماء الخوادم.
- يطبع `show` من دون اسم كائن خادم MCP المضبوط الكامل.
- يتوقع `set` قيمة كائن JSON واحدة على سطر الأوامر.
- يفشل `unset` إذا لم يكن الخادم المسمى موجودًا.

أمثلة:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

مثال على شكل التكوين:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### نقل Stdio

يشغّل عملية فرعية محلية ويتواصل عبر stdin/stdout.

| الحقل | الوصف |
| -------------------------- | --------------------------------- |
| `command` | الملف التنفيذي الذي سيتم تشغيله (مطلوب) |
| `args` | مصفوفة من وسائط سطر الأوامر |
| `env` | متغيرات بيئة إضافية |
| `cwd` / `workingDirectory` | دليل العمل الخاص بالعملية |

#### مرشح أمان البيئة لـ Stdio

يرفض OpenClaw مفاتيح بيئة بدء تشغيل المفسّر التي يمكنها تغيير كيفية بدء خادم MCP عبر stdio قبل أول RPC، حتى لو ظهرت ضمن كتلة `env` الخاصة بالخادم. تتضمن المفاتيح المحظورة `NODE_OPTIONS` و `PYTHONSTARTUP` و `PYTHONPATH` و `PERL5OPT` و `RUBYOPT` و `SHELLOPTS` و `PS4` ومتغيرات مماثلة للتحكم في بيئة التشغيل. يرفض بدء التشغيل هذه القيم مع خطأ تكوين حتى لا تتمكن من حقن تمهيد ضمني، أو تبديل المفسّر، أو تفعيل مصحح أخطاء على عملية stdio. لا تتأثر متغيرات البيئة العادية الخاصة ببيانات الاعتماد، والوكيل، والخادم (`GITHUB_TOKEN` و `HTTP_PROXY` و `*_API_KEY` المخصصة، وما إلى ذلك).

إذا كان خادم MCP لديك يحتاج فعلًا إلى أحد المتغيرات المحظورة، فاضبطه على عملية مضيف Gateway بدلًا من وضعه تحت `env` الخاصة بخادم stdio.

### نقل SSE / HTTP

يتصل بخادم MCP بعيد عبر أحداث HTTP Server-Sent Events.

| الحقل | الوصف |
| --------------------- | ---------------------------------------------------------------- |
| `url` | عنوان URL من نوع HTTP أو HTTPS للخادم البعيد (مطلوب) |
| `headers` | خريطة اختيارية من أزواج مفاتيح-قيم لرؤوس HTTP (مثل رموز المصادقة) |
| `connectionTimeoutMs` | مهلة الاتصال لكل خادم بالمللي ثانية (اختياري) |

مثال:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

تُحجب القيم الحساسة في `url` ‏(userinfo) و`headers` في السجلات
ومخرجات الحالة.

### نقل HTTP القابل للبث

يمثل `streamable-http` خيار نقل إضافيًا إلى جانب `sse` و`stdio`. ويستخدم بث HTTP للاتصال ثنائي الاتجاه مع خوادم MCP البعيدة.

| الحقل | الوصف |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url` | عنوان URL من نوع HTTP أو HTTPS للخادم البعيد (مطلوب) |
| `transport` | اضبطه على `"streamable-http"` لاختيار هذا النقل؛ وعند عدم تحديده، يستخدم OpenClaw `sse` |
| `headers` | خريطة اختيارية من أزواج مفاتيح-قيم لرؤوس HTTP (مثل رموز المصادقة) |
| `connectionTimeoutMs` | مهلة الاتصال لكل خادم بالمللي ثانية (اختياري) |

مثال:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

تدير هذه الأوامر التكوين المحفوظ فقط. وهي لا تبدأ جسر القنوات،
ولا تفتح جلسة عميل MCP حية، ولا تثبت أن الخادم الهدف قابل للوصول.

## الحدود الحالية

توثّق هذه الصفحة الجسر كما يُشحن اليوم.

الحدود الحالية:

- يعتمد اكتشاف المحادثات على بيانات تعريف مسار جلسة Gateway الموجودة
- لا يوجد بروتوكول دفع عام يتجاوز المحول الخاص بـ Claude
- لا توجد بعد أدوات لتحرير الرسائل أو إضافة التفاعلات
- يتصل نقل HTTP/SSE/streamable-http بخادم بعيد واحد؛ ولا يوجد حتى الآن upstream متعدد الإرسال
- لا يتضمن `permissions_list_open` إلا طلبات الموافقة التي تمت ملاحظتها بينما كان الجسر
  متصلًا
