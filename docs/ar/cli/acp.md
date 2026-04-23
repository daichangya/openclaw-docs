---
read_when:
    - إعداد عمليات التكامل مع IDE المعتمدة على ACP
    - تصحيح توجيه جلسة ACP إلى Gateway
summary: شغّل جسر ACP لعمليات التكامل مع IDE
title: acp
x-i18n:
    generated_at: "2026-04-23T07:20:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

شغّل جسر [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) الذي يتواصل مع OpenClaw Gateway.

يتحدث هذا الأمر ACP عبر stdio لبيئات IDE ويعيد توجيه المطالبات إلى Gateway
عبر WebSocket. ويُبقي جلسات ACP مرتبطة بمفاتيح جلسات Gateway.

إن `openclaw acp` هو جسر ACP مدعوم بـ Gateway، وليس بيئة تشغيل تحرير
كاملة أصلية لـ ACP. فهو يركز على توجيه الجلسات، وتسليم المطالبات، وتحديثات
البث الأساسية.

إذا كنت تريد أن يتواصل عميل MCP خارجي مباشرةً مع محادثات قنوات OpenClaw
بدلًا من استضافة جلسة harness لـ ACP، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلًا من ذلك.

## ما الذي ليس عليه هذا الأمر

غالبًا ما يحدث التباس بين هذه الصفحة وجلسات harness الخاصة بـ ACP.

يعني `openclaw acp` ما يلي:

- يعمل OpenClaw كخادم ACP
- يتصل IDE أو عميل ACP بـ OpenClaw
- يعيد OpenClaw توجيه هذا العمل إلى جلسة Gateway

وهذا يختلف عن [وكلاء ACP](/ar/tools/acp-agents)، حيث يشغّل OpenClaw
harness خارجيًا مثل Codex أو Claude Code من خلال `acpx`.

قاعدة سريعة:

- إذا كان المحرر/العميل يريد التحدث عبر ACP إلى OpenClaw: استخدم `openclaw acp`
- إذا كان ينبغي لـ OpenClaw تشغيل Codex/Claude/Gemini كـ ACP harness: استخدم `/acp spawn` و[وكلاء ACP](/ar/tools/acp-agents)

## مصفوفة التوافق

| مجال ACP                                                              | الحالة      | ملاحظات                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | مُنفّذ | تدفق الجسر الأساسي عبر stdio إلى Gateway chat/send + abort.                                                                                                                                                                                        |
| `listSessions`, أوامر الشرطة المائلة                                        | مُنفّذ | تعمل قائمة الجلسات اعتمادًا على حالة جلسة Gateway؛ ويتم الإعلان عن الأوامر عبر `available_commands_update`.                                                                                                                                       |
| `loadSession`                                                         | جزئي     | يعيد ربط جلسة ACP بمفتاح جلسة Gateway ويعيد تشغيل السجل النصي المخزن للمستخدم/المساعد. لم تتم إعادة بناء سجل الأدوات/النظام بعد.                                                                                                   |
| محتوى المطالبة (`text`, و`resource` المضمَّن، والصور)                  | جزئي     | يُسطَّح النص/الموارد إلى إدخال دردشة؛ وتصبح الصور مرفقات Gateway.                                                                                                                                                                 |
| أوضاع الجلسة                                                         | جزئي     | `session/set_mode` مدعوم، ويعرض الجسر عناصر تحكم أولية للجلسة مدعومة بـ Gateway لمستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات المرتفعة الصلاحية. أما أسطح أوضاع/تهيئة ACP الأصلية الأوسع فما تزال خارج النطاق. |
| معلومات الجلسة وتحديثات الاستخدام                                        | جزئي     | يصدر الجسر إشعارات `session_info_update` و`usage_update` بأفضل جهد من لقطات جلسة Gateway المخزنة مؤقتًا. الاستخدام تقريبي ولا يُرسل إلا عندما يوسم Gateway إجماليات الرموز على أنها حديثة.                                        |
| بث الأدوات                                                        | جزئي     | تتضمن أحداث `tool_call` / `tool_call_update` الإدخال/الإخراج الخام، والمحتوى النصي، ومواقع الملفات بأفضل جهد عندما تكشف وسائط/نتائج أدوات Gateway عنها. ولا تزال الطرفيات المضمنة ومخرجات الفروقات الأصلية الأكثر غنى غير مكشوفة.                        |
| خوادم MCP لكل جلسة (`mcpServers`)                                | غير مدعوم | يرفض وضع الجسر طلبات خوادم MCP لكل جلسة. اضبط MCP على OpenClaw gateway أو الوكيل بدلًا من ذلك.                                                                                                                                     |
| أساليب نظام ملفات العميل (`fs/read_text_file`, `fs/write_text_file`) | غير مدعوم | لا يستدعي الجسر أساليب نظام ملفات عميل ACP.                                                                                                                                                                                          |
| أساليب طرفية العميل (`terminal/*`)                                | غير مدعوم | لا ينشئ الجسر طرفيات لعميل ACP ولا يبث معرّفات الطرفيات من خلال استدعاءات الأدوات.                                                                                                                                                       |
| خطط الجلسة / بث التفكير                                     | غير مدعوم | يصدر الجسر حاليًا نص الإخراج وحالة الأداة، وليس تحديثات الخطة أو التفكير الخاصة بـ ACP.                                                                                                                                                         |

## القيود المعروفة

- يعيد `loadSession` تشغيل السجل النصي المخزن للمستخدم والمساعد، لكنه لا
  يعيد بناء استدعاءات الأدوات التاريخية أو إشعارات النظام أو أنواع أحداث
  ACP الأصلية الأكثر غنى.
- إذا شارك عدة عملاء ACP مفتاح جلسة Gateway نفسه، فسيكون توجيه الأحداث
  والإلغاء بأفضل جهد بدلًا من العزل الصارم لكل عميل. يُفضّل استخدام جلسات
  `acp:<uuid>` المعزولة افتراضيًا عندما تحتاج إلى أدوار نظيفة محلية للمحرر.
- تُترجم حالات التوقف في Gateway إلى أسباب توقف في ACP، لكن هذا الربط
  أقل تعبيرًا من بيئة تشغيل أصلية بالكامل لـ ACP.
- تعرض عناصر تحكم الجلسة الأولية حاليًا مجموعة مركزة من مفاتيح Gateway:
  مستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات
  المرتفعة الصلاحية. ولم تُكشف بعد خيارات اختيار النموذج والتحكم في exec-host
  كخيارات تهيئة ACP.
- تُشتق `session_info_update` و`usage_update` من لقطات جلسة Gateway،
  وليس من محاسبة مباشرة أصلية لـ ACP في بيئة التشغيل. الاستخدام تقريبي،
  ولا يحمل بيانات تكلفة، ولا يُصدر إلا عندما يوسم Gateway بيانات إجمالي
  الرموز على أنها حديثة.
- بيانات متابعة الأدوات تُقدَّم بأفضل جهد. يمكن للجسر إظهار مسارات الملفات
  التي تظهر في وسائط/نتائج الأدوات المعروفة، لكنه لا يصدر بعد طرفيات ACP أو
  فروقات ملفات مهيكلة.

## الاستخدام

```bash
openclaw acp

# Gateway بعيد
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway بعيد (الرمز من ملف)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# الإرفاق بمفتاح جلسة موجود
openclaw acp --session agent:main:main

# الإرفاق عبر التسمية (يجب أن تكون موجودة مسبقًا)
openclaw acp --session-label "support inbox"

# إعادة تعيين مفتاح الجلسة قبل أول مطالبة
openclaw acp --session agent:main:main --reset-session
```

## عميل ACP (تصحيح)

استخدم عميل ACP المدمج للتحقق من سلامة الجسر من دون IDE.
فهو يشغّل جسر ACP ويتيح لك كتابة المطالبات بشكل تفاعلي.

```bash
openclaw acp client

# توجيه الجسر المُشغَّل إلى Gateway بعيد
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# تجاوز أمر الخادم (الافتراضي: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

نموذج الأذونات (وضع تصحيح العميل):

- تعتمد الموافقة التلقائية على قائمة السماح، ولا تنطبق إلا على معرّفات الأدوات الأساسية الموثوقة.
- تُقيَّد الموافقة التلقائية لـ `read` بدليل العمل الحالي (`--cwd` عند ضبطه).
- لا يوافق ACP تلقائيًا إلا على فئات القراءة فقط الضيقة: استدعاءات `read` المقيّدة تحت cwd النشط بالإضافة إلى أدوات البحث للقراءة فقط (`search`, `web_search`, `memory_search`). تتطلب الأدوات غير المعروفة/غير الأساسية، وعمليات القراءة خارج النطاق، والأدوات القادرة على التنفيذ، وأدوات مستوى التحكم، والأدوات المعدِّلة، والتدفقات التفاعلية موافقة صريحة دائمًا.
- يُعامل `toolCall.kind` المقدم من الخادم على أنه بيانات وصفية غير موثوقة (وليس مصدرًا للتفويض).
- سياسة جسر ACP هذه منفصلة عن أذونات ACPX harness. إذا شغّلت OpenClaw عبر الواجهة الخلفية `acpx`، فإن `plugins.entries.acpx.config.permissionMode=approve-all` هو مفتاح الكسر الزجاجي "yolo" لتلك جلسة harness.

## كيفية استخدام هذا

استخدم ACP عندما يكون IDE (أو عميل آخر) يتحدث Agent Client Protocol وتريد
أن يقود جلسة OpenClaw Gateway.

1. تأكد من أن Gateway يعمل (محليًا أو عن بُعد).
2. اضبط هدف Gateway (من خلال الإعدادات أو الخيارات).
3. وجّه IDE لديك لتشغيل `openclaw acp` عبر stdio.

مثال على الإعدادات (دائمة):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

مثال على التشغيل المباشر (من دون كتابة إعدادات):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# مفضّل لسلامة العملية المحلية
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## اختيار الوكلاء

لا يختار ACP الوكلاء مباشرة. بل يوجّه حسب مفتاح جلسة Gateway.

استخدم مفاتيح الجلسات ذات النطاق الخاص بالوكيل لاستهداف وكيل معيّن:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

تُربط كل جلسة ACP بمفتاح جلسة Gateway واحد. ويمكن لوكيل واحد أن يملك
جلسات كثيرة؛ ويستخدم ACP افتراضيًا جلسة معزولة من النوع `acp:<uuid>`
ما لم تتجاوز المفتاح أو التسمية.

لا تُدعم `mcpServers` لكل جلسة في وضع الجسر. إذا أرسلها عميل ACP
أثناء `newSession` أو `loadSession`، فسيعيد الجسر خطأ واضحًا بدلًا من
تجاهلها بصمت.

إذا كنت تريد أن ترى الجلسات المدعومة بـ ACPX أدوات Plugin الخاصة بـ OpenClaw أو
أدوات مضمّنة مختارة مثل `cron`، ففعّل جسور MCP الخاصة بـ ACPX على جانب gateway
بدلًا من محاولة تمرير `mcpServers` لكل جلسة. راجع
[وكلاء ACP](/ar/tools/acp-agents#plugin-tools-mcp-bridge) و
[جسر MCP لأدوات OpenClaw](/ar/tools/acp-agents#openclaw-tools-mcp-bridge).

## الاستخدام من `acpx` (Codex وClaude وعملاء ACP الآخرين)

إذا كنت تريد أن يتحدث وكيل برمجي مثل Codex أو Claude Code مع
روبوت OpenClaw لديك عبر ACP، فاستخدم `acpx` مع الهدف المدمج `openclaw`.

التدفق المعتاد:

1. شغّل Gateway وتأكد من أن جسر ACP يمكنه الوصول إليه.
2. وجّه `acpx openclaw` إلى `openclaw acp`.
3. استهدف مفتاح جلسة OpenClaw الذي تريد أن يستخدمه الوكيل البرمجي.

أمثلة:

```bash
# طلب لمرة واحدة إلى جلسة OpenClaw ACP الافتراضية
acpx openclaw exec "Summarize the active OpenClaw session state."

# جلسة مسماة دائمة للأدوار اللاحقة
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

إذا كنت تريد أن يستهدف `acpx openclaw` Gateway ومفتاح جلسة محددين في كل
مرة، فتجاوز أمر الوكيل `openclaw` في `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

لنسخة OpenClaw محلية على مستوى المستودع، استخدم نقطة إدخال CLI المباشرة بدل
مشغّل التطوير حتى يبقى تدفق ACP نظيفًا. على سبيل المثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

هذه هي أسهل طريقة للسماح لـ Codex أو Claude Code أو أي عميل آخر مدرك لـ ACP
بسحب معلومات سياقية من وكيل OpenClaw من دون كشط طرفية.

## إعداد محرر Zed

أضف وكيل ACP مخصصًا في `~/.config/zed/settings.json` (أو استخدم واجهة إعدادات Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

لاستهداف Gateway أو وكيل محدد:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

في Zed، افتح لوحة Agent واختر “OpenClaw ACP” لبدء سلسلة محادثة.

## ربط الجلسات

افتراضيًا، تحصل جلسات ACP على مفتاح جلسة Gateway معزول يبدأ بالبادئة `acp:`.
ولإعادة استخدام جلسة معروفة، مرّر مفتاح جلسة أو تسمية:

- `--session <key>`: استخدم مفتاح جلسة Gateway محددًا.
- `--session-label <label>`: حلّ جلسة موجودة بواسطة التسمية.
- `--reset-session`: أنشئ معرّف جلسة جديدًا لهذا المفتاح (المفتاح نفسه، وسجل جديد).

إذا كان عميل ACP لديك يدعم البيانات الوصفية، فيمكنك التجاوز لكل جلسة:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

تعرّف أكثر على مفاتيح الجلسات في [/concepts/session](/ar/concepts/session).

## الخيارات

- `--url <url>`: عنوان WebSocket لـ Gateway (يستخدم افتراضيًا القيمة `gateway.remote.url` عند ضبطها).
- `--token <token>`: رمز مصادقة Gateway.
- `--token-file <path>`: اقرأ رمز مصادقة Gateway من ملف.
- `--password <password>`: كلمة مرور مصادقة Gateway.
- `--password-file <path>`: اقرأ كلمة مرور مصادقة Gateway من ملف.
- `--session <key>`: مفتاح الجلسة الافتراضي.
- `--session-label <label>`: تسمية الجلسة الافتراضية لحلها.
- `--require-existing`: الفشل إذا لم يكن مفتاح/تسمية الجلسة موجودًا.
- `--reset-session`: إعادة تعيين مفتاح الجلسة قبل أول استخدام.
- `--no-prefix-cwd`: لا تضف دليل العمل الحالي كبادئة إلى المطالبات.
- `--provenance <off|meta|meta+receipt>`: تضمين بيانات ACP الوصفية الخاصة بالمصدر أو الإيصالات.
- `--verbose, -v`: تسجيل verbose إلى stderr.

ملاحظة أمنية:

- قد يكون `--token` و`--password` مرئيين في قوائم العمليات المحلية على بعض الأنظمة.
- يُفضّل استخدام `--token-file`/`--password-file` أو متغيرات البيئة (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- يتبع حل مصادقة Gateway العقد المشترك المستخدم من قبل عملاء Gateway الآخرين:
  - الوضع المحلي: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> العودة إلى `gateway.remote.*` فقط عندما يكون `gateway.auth.*` غير مضبوط (تفشل SecretRefs المحلية المضبوطة ولكن غير المحلولة بشكل مغلق)
  - الوضع البعيد: `gateway.remote.*` مع الرجوع إلى env/config وفق قواعد أولوية الوضع البعيد
  - `--url` آمن للتجاوز ولا يعيد استخدام بيانات اعتماد ضمنية من config/env؛ مرّر `--token`/`--password` صريحين (أو متغيراتهما المعتمدة على الملفات)
- تتلقى العمليات الفرعية للواجهة الخلفية لبيئة تشغيل ACP المتغير `OPENCLAW_SHELL=acp`، ويمكن استخدامه لقواعد shell/profile الخاصة بالسياق.
- يضبط `openclaw acp client` القيمة `OPENCLAW_SHELL=acp-client` على عملية الجسر التي يشغّلها.

### خيارات `acp client`

- `--cwd <dir>`: دليل العمل لجلسة ACP.
- `--server <command>`: أمر خادم ACP (الافتراضي: `openclaw`).
- `--server-args <args...>`: وسائط إضافية تُمرَّر إلى خادم ACP.
- `--server-verbose`: تفعيل التسجيل verbose على خادم ACP.
- `--verbose, -v`: تسجيل verbose للعميل.
