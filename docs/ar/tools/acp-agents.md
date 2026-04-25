---
read_when:
    - تشغيل أحزمة البرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة مراسلة بجلسة ACP دائمة
    - استكشاف أخطاء الواجهة الخلفية لـ ACP وربط Plugin وإصلاحها
    - تصحيح تسليم إكمال ACP أو حلقات وكيل إلى وكيل
    - تشغيل أوامر `/acp` من الدردشة
summary: استخدم جلسات وقت تشغيل ACP لـ Claude Code وCursor وGemini CLI وبديل Codex ACP الصريح وOpenClaw ACP ووكلاء الحزام الآخرين
title: وكلاء ACP
x-i18n:
    generated_at: "2026-04-25T13:58:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

تتيح جلسات [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) لـ OpenClaw تشغيل أحزمة البرمجة الخارجية (على سبيل المثال Pi وClaude Code وCursor وCopilot وOpenClaw ACP وOpenCode وGemini CLI وأحزمة ACPX الأخرى المدعومة) عبر Plugin واجهة خلفية لـ ACP.

إذا طلبت من OpenClaw بلغة طبيعية ربط Codex أو التحكم فيه في المحادثة الحالية، فيجب على OpenClaw استخدام Plugin الأصلي لـ Codex app-server (`/codex bind` و`/codex threads` و`/codex resume`). وإذا طلبت `/acp` أو ACP أو acpx أو جلسة فرعية لخلفية Codex، فلا يزال بإمكان OpenClaw توجيه Codex عبر ACP. يتم تتبع كل عملية إنشاء جلسة ACP على أنها [مهمة في الخلفية](/ar/automation/tasks).

إذا طلبت من OpenClaw بلغة طبيعية "تشغيل Claude Code في سلسلة محادثة" أو استخدام حزام خارجي آخر، فيجب على OpenClaw توجيه هذا الطلب إلى وقت تشغيل ACP (وليس وقت تشغيل الوكيل الفرعي الأصلي).

إذا كنت تريد من Codex أو Claude Code الاتصال مباشرةً كعميل MCP خارجي
بمحادثات القنوات الموجودة بالفعل في OpenClaw، فاستخدم [`openclaw mcp serve`](/ar/cli/mcp)
بدلًا من ACP.

## أي صفحة أريد؟

هناك ثلاثة أسطح قريبة يسهل الخلط بينها:

| تريد أن...                                                                                     | استخدم هذا                              | ملاحظات                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ربط Codex أو التحكم فيه في المحادثة الحالية                                                    | `/codex bind` و`/codex threads`       | مسار Codex app-server الأصلي؛ ويتضمن ردود الدردشة المرتبطة، وتمرير الصور، والنموذج/الوضع السريع/الأذونات، وعناصر تحكم الإيقاف والتوجيه. ويُعد ACP بديلًا احتياطيًا صريحًا |
| تشغيل Claude Code أو Gemini CLI أو Codex ACP الصريح أو حزام خارجي آخر _عبر_ OpenClaw           | هذه الصفحة: وكلاء ACP                 | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام في الخلفية، وعناصر تحكم وقت التشغيل                                      |
| عرض جلسة OpenClaw Gateway _بصفتها_ خادم ACP لمحرر أو عميل                                      | [`openclaw acp`](/ar/cli/acp)            | وضع الجسر. يتحدث IDE/العميل بروتوكول ACP إلى OpenClaw عبر stdio/WebSocket                                                                                  |
| إعادة استخدام CLI محلي للذكاء الاصطناعي كنموذج احتياطي نصي فقط                                | [واجهات CLI الخلفية](/ar/gateway/cli-backends) | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل الحزام                                                                                 |

## هل يعمل هذا مباشرةً دون إعداد إضافي؟

في العادة، نعم. تأتي عمليات التثبيت الجديدة مع تفعيل Plugin وقت التشغيل المضمّن `acpx` افتراضيًا، مع ملف `acpx` ثنائي مثبت محليًا داخل Plugin ومثبت بإصدار محدد، ويقوم OpenClaw بفحصه وإصلاحه ذاتيًا عند بدء التشغيل. شغّل `/acp doctor` لإجراء فحص الجاهزية.

المشكلات المعتادة عند التشغيل الأول:

- قد يتم جلب محولات الحزام المستهدفة (Codex وClaude وغيرها) عند الطلب باستخدام `npx` في أول مرة تستخدمها.
- يجب أن تكون مصادقة المورّد موجودة بالفعل على المضيف لهذا الحزام.
- إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، فسيفشل جلب المحولات عند التشغيل الأول إلى أن يتم تدفئة ذاكرات التخزين المؤقت مسبقًا أو تثبيت المحول بطريقة أخرى.

## دليل التشغيل

التدفق السريع لـ `/acp` من الدردشة:

1. **إنشاء** — `/acp spawn claude --bind here` أو `/acp spawn gemini --mode persistent --thread auto` أو `/acp spawn codex --bind here` بشكل صريح
2. **اعمل** في المحادثة أو السلسلة المرتبطة (أو استهدف مفتاح الجلسة صراحةً).
3. **تحقق من الحالة** — `/acp status`
4. **اضبط** — `/acp model <provider/model>` و`/acp permissions <profile>` و`/acp timeout <seconds>`
5. **وجّه** دون استبدال السياق — `/acp steer tighten logging and continue`
6. **أوقف** — `/acp cancel` (الدور الحالي) أو `/acp close` (الجلسة + الارتباطات)

المحفزات باللغة الطبيعية التي يجب أن تُوجَّه إلى Plugin الأصلي لـ Codex:

- "اربط قناة Discord هذه بـ Codex."
- "أرفق هذه الدردشة بسلسلة Codex `<id>`."
- "اعرض سلاسل Codex، ثم اربط هذه."

يُعد ربط محادثات Codex الأصلي هو مسار التحكم الافتراضي من الدردشة. لا تزال
الأدوات الديناميكية لـ OpenClaw تُنفَّذ عبر OpenClaw، بينما تُنفَّذ أدوات Codex
الأصلية مثل shell/apply-patch داخل Codex. وبالنسبة إلى أحداث الأدوات الأصلية لـ Codex، يحقن OpenClaw
ناقل خطافات أصليًا لكل دور حتى تتمكن خطافات Plugin من حظر
`before_tool_call`، ومراقبة `after_tool_call`، وتوجيه أحداث
`PermissionRequest` الخاصة بـ Codex عبر موافقات OpenClaw. ويُعد ناقل v1
محافظًا عمدًا: فهو لا يغيّر وسيطات الأدوات الأصلية لـ Codex،
ولا يعيد كتابة سجلات سلاسل Codex، ولا يقيّد الإجابات النهائية/خطافات Stop. استخدم
ACP الصريح فقط عندما تريد نموذج وقت التشغيل/الجلسة الخاص بـ ACP. وحدود دعم Codex المضمّن
موثقة في
[عقد دعم Codex harness v1](/ar/plugins/codex-harness#v1-support-contract).

المحفزات باللغة الطبيعية التي يجب أن تُوجَّه إلى وقت تشغيل ACP:

- "شغّل هذا كجلسة Claude Code ACP أحادية الطلقة ولخّص النتيجة."
- "استخدم Gemini CLI لهذه المهمة في سلسلة محادثة، ثم احتفظ بمتابعاتها في السلسلة نفسها."
- "شغّل Codex عبر ACP في سلسلة خلفية."

يختار OpenClaw `runtime: "acp"`، ويحل `agentId` الخاص بالحزام، ويرتبط بالمحادثة الحالية أو السلسلة عند الدعم، ويوجه المتابعات إلى تلك الجلسة حتى الإغلاق/انتهاء الصلاحية. ولا يسلك Codex هذا المسار إلا عندما يكون ACP صريحًا أو عندما يظل وقت تشغيل الخلفية المطلوب بحاجة إلى ACP.

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل لحزام خارجي. واستخدم Codex app-server الأصلي لربط/التحكم في محادثات Codex. واستخدم الوكلاء الفرعيين عندما تريد تشغيلات مفوّضة أصلية في OpenClaw.

| المجال        | جلسة ACP                              | تشغيل وكيل فرعي                     |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل   | Plugin واجهة خلفية لـ ACP (مثل acpx) | وقت تشغيل الوكيل الفرعي الأصلي في OpenClaw |
| مفتاح الجلسة  | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                          | `/subagents ...`                   |
| أداة الإنشاء  | `sessions_spawn` مع `runtime:"acp"`   | `sessions_spawn` (وقت التشغيل الافتراضي) |

راجع أيضًا [الوكلاء الفرعيون](/ar/tools/subagents).

## كيف يشغّل ACP خدمة Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون الطبقات كما يلي:

1. مستوى التحكم في جلسة ACP في OpenClaw
2. Plugin وقت التشغيل المضمّن `acpx`
3. محول Claude ACP
4. آلية وقت التشغيل/الجلسة على جانب Claude

تمييز مهم:

- Claude عبر ACP هو جلسة حزام مع عناصر تحكم ACP، واستئناف الجلسة، وتتبع المهام في الخلفية، وربط اختياري بالمحادثة/السلسلة.
- واجهات CLI الخلفية هي بيئات تشغيل احتياطية محلية نصية فقط ومنفصلة. راجع [واجهات CLI الخلفية](/ar/gateway/cli-backends).

بالنسبة إلى المشغلين، القاعدة العملية هي:

- إذا كنت تريد `/acp spawn` أو جلسات قابلة للربط أو عناصر تحكم وقت التشغيل أو عمل حزام دائم: استخدم ACP
- إذا كنت تريد احتياطيًا نصيًا محليًا بسيطًا عبر CLI الخام: استخدم واجهات CLI الخلفية

## الجلسات المرتبطة

### الارتباطات بالمحادثة الحالية

يثبّت الأمر `/acp spawn <harness> --bind here` المحادثة الحالية إلى جلسة ACP التي تم إنشاؤها — من دون سلسلة فرعية، وعلى سطح الدردشة نفسه. يظل OpenClaw مسؤولًا عن النقل، والمصادقة، والسلامة، والتسليم؛ وتُوجَّه رسائل المتابعة في تلك المحادثة إلى الجلسة نفسها؛ ويعيد `/new` و`/reset` تعيين الجلسة في مكانها؛ ويزيل `/acp close` الارتباط.

النموذج الذهني:

- **سطح الدردشة** — المكان الذي يواصل فيه الأشخاص الكلام (قناة Discord، أو موضوع Telegram، أو دردشة iMessage).
- **جلسة ACP** — حالة وقت تشغيل Codex/Claude/Gemini الدائمة التي يوجّه OpenClaw إليها.
- **سلسلة/موضوع فرعي** — سطح مراسلة إضافي اختياري لا يُنشأ إلا بواسطة `--thread ...`.
- **مساحة عمل وقت التشغيل** — موقع نظام الملفات (`cwd`، أو سحب المستودع، أو مساحة عمل الواجهة الخلفية) الذي يعمل فيه الحزام. وهو مستقل عن سطح الدردشة.

أمثلة:

- `/codex bind` — احتفظ بهذه الدردشة، وأنشئ أو أرفق Codex app-server الأصلي، ووجّه الرسائل المستقبلية هنا.
- `/codex model gpt-5.4` و`/codex fast on` و`/codex permissions yolo` — اضبط سلسلة Codex الأصلية المرتبطة من الدردشة.
- `/codex stop` أو `/codex steer focus on the failing tests first` — تحكم في دور Codex الأصلي النشط.
- `/acp spawn codex --bind here` — بديل ACP احتياطي صريح لـ Codex.
- `/acp spawn codex --thread auto` — قد ينشئ OpenClaw سلسلة/موضوعًا فرعيًا ويرتبط به.
- `/acp spawn codex --bind here --cwd /workspace/repo` — ربط بالدردشة نفسها، ويعمل Codex داخل `/workspace/repo`.

ملاحظات:

- `--bind here` و`--thread ...` متنافيان.
- يعمل `--bind here` فقط على القنوات التي تعلن دعم ربط المحادثة الحالية؛ وإلا يعرض OpenClaw رسالة عدم دعم واضحة. وتستمر الارتباطات عبر عمليات إعادة تشغيل Gateway.
- في Discord، لا تكون `spawnAcpSessions` مطلوبة إلا عندما يحتاج OpenClaw إلى إنشاء سلسلة فرعية من أجل `--thread auto|here` — وليس من أجل `--bind here`.
- إذا أنشأت جلسة لوكيل ACP مختلف من دون `--cwd`، فسيرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضيًا. أما المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) فتعود إلى الإعداد الافتراضي للواجهة الخلفية؛ بينما تظهر أخطاء الوصول الأخرى (مثل `EACCES`) كأخطاء إنشاء.

### الجلسات المرتبطة بالسلاسل

عندما تكون ارتباطات السلاسل مفعّلة لمحول القناة، يمكن ربط جلسات ACP بالسلاسل:

- يربط OpenClaw سلسلة بجلسة ACP مستهدفة.
- تُوجَّه رسائل المتابعة في تلك السلسلة إلى جلسة ACP المرتبطة.
- يتم تسليم مخرجات ACP مرة أخرى إلى السلسلة نفسها.
- تؤدي إزالة التركيز/الإغلاق/الأرشفة/انتهاء مهلة الخمول أو انتهاء العمر الأقصى إلى إزالة الارتباط.

دعم ارتباط السلاسل خاص بكل محول. وإذا لم يكن محول القناة النشط يدعم ارتباطات السلاسل، فسيعرض OpenClaw رسالة عدم دعم/عدم توفر واضحة.

أعلام الميزات المطلوبة لـ ACP المرتبط بالسلاسل:

- `acp.enabled=true`
- تكون `acp.dispatch.enabled` مفعلة افتراضيًا (اضبطها على `false` لإيقاف توزيع ACP مؤقتًا)
- تفعيل علم إنشاء سلاسل ACP الخاص بمحول القناة (خاص بالمحول)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### القنوات التي تدعم السلاسل

- أي محول قناة يوفّر إمكانية ربط الجلسات/السلاسل.
- الدعم المضمّن الحالي:
  - سلاسل/قنوات Discord
  - موضوعات Telegram (موضوعات المنتديات في المجموعات/المجموعات الفائقة وموضوعات الرسائل الخاصة)
- يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

## الإعدادات الخاصة بالقنوات

بالنسبة إلى مهام العمل غير المؤقتة، هيّئ ارتباطات ACP الدائمة في إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

- تشير `bindings[].type="acp"` إلى ربط دائم لمحادثة ACP.
- تحدد `bindings[].match` المحادثة المستهدفة:
  - قناة أو سلسلة Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - موضوع منتدى Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - دردشة BlueBubbles فردية/جماعية: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    يفضَّل `chat_id:*` أو `chat_identifier:*` لارتباطات المجموعات المستقرة.
  - دردشة iMessage فردية/جماعية: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    يفضَّل `chat_id:*` لارتباطات المجموعات المستقرة.
- `bindings[].agentId` هو معرّف وكيل OpenClaw المالك.
- توجد تجاوزات ACP الاختيارية تحت `bindings[].acp`:
  - `mode` (`persistent` أو `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### الإعدادات الافتراضية لوقت التشغيل لكل وكيل

استخدم `agents.list[].runtime` لتعريف إعدادات ACP الافتراضية مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (معرّف الحزام، مثل `codex` أو `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

أولوية التجاوز لجلسات ACP المرتبطة:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. إعدادات ACP العامة الافتراضية (مثل `acp.backend`)

مثال:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

السلوك:

- يضمن OpenClaw وجود جلسة ACP المهيأة قبل استخدامها.
- تُوجَّه الرسائل في تلك القناة أو الموضوع إلى جلسة ACP المهيأة.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` تعيين مفتاح جلسة ACP نفسه في مكانه.
- لا تزال ارتباطات وقت التشغيل المؤقتة (على سبيل المثال التي تنشئها تدفقات التركيز على السلاسل) تُطبَّق عند وجودها.
- بالنسبة إلى عمليات إنشاء ACP عبر وكلاء مختلفين من دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من إعدادات الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى `cwd` الافتراضي للواجهة الخلفية؛ أما حالات فشل الوصول غير المرتبطة بالفقد فتظهر كأخطاء إنشاء.

## بدء جلسات ACP (الواجهات)

### من `sessions_spawn`

استخدم `runtime: "acp"` لبدء جلسة ACP من دور وكيل أو استدعاء أداة.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

ملاحظات:

- تكون `runtime` افتراضيًا هي `subagent`، لذا اضبط `runtime: "acp"` صراحةً لجلسات ACP.
- إذا تم حذف `agentId`، يستخدم OpenClaw القيمة `acp.defaultAgent` عند تهيئتها.
- تتطلب `mode: "session"` وجود `thread: true` للحفاظ على محادثة مرتبطة ودائمة.

تفاصيل الواجهة:

- `task` (مطلوب): المطالبة الأولية المرسلة إلى جلسة ACP.
- `runtime` (مطلوب لـ ACP): يجب أن تكون `"acp"`.
- `agentId` (اختياري): معرّف الحزام الهدف لـ ACP. ويعود إلى `acp.defaultAgent` إذا كانت مضبوطة.
- `thread` (اختياري، الافتراضي `false`): يطلب تدفق ربط السلاسل عندما يكون مدعومًا.
- `mode` (اختياري): `run` (طلقة واحدة) أو `session` (دائمة).
  - القيمة الافتراضية هي `run`
  - إذا كان `thread: true` وتم حذف mode، فقد يستخدم OpenClaw السلوك الدائم افتراضيًا حسب مسار وقت التشغيل
  - تتطلب `mode: "session"` وجود `thread: true`
- `cwd` (اختياري): دليل العمل المطلوب لوقت التشغيل (ويتم التحقق منه وفق سياسة الواجهة الخلفية/وقت التشغيل). إذا تم حذفه، يرث إنشاء ACP مساحة عمل الوكيل الهدف عند تهيئتها؛ وتعود المسارات الموروثة المفقودة إلى إعدادات الواجهة الخلفية الافتراضية، بينما تُعاد أخطاء الوصول الحقيقية.
- `label` (اختياري): تسمية موجهة للمشغّل تُستخدم في نص الجلسة/اللافتة.
- `resumeSessionId` (اختياري): استئناف جلسة ACP موجودة بدلًا من إنشاء جلسة جديدة. يعيد الوكيل تشغيل سجل محادثته عبر `session/load`. يتطلب `runtime: "acp"`.
- `streamTo` (اختياري): تؤدي القيمة `"parent"` إلى بث ملخصات تقدم تشغيل ACP الأولية مرة أخرى إلى الجلسة الطالبة كأحداث نظام.
  - عند توفرها، تتضمن الاستجابات المقبولة `streamLogPath` الذي يشير إلى سجل JSONL على مستوى الجلسة (`<sessionId>.acp-stream.jsonl`) يمكنك تتبعه للاطلاع على سجل الترحيل الكامل.
- `model` (اختياري): تجاوز صريح للنموذج لجلسة ACP الفرعية. ويتم احترامه عند `runtime: "acp"` بحيث تستخدم الجلسة الفرعية النموذج المطلوب بدلًا من الرجوع بصمت إلى الإعداد الافتراضي للوكيل الهدف.

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو أعمال خلفية يملكها الأصل. ويعتمد مسار التسليم على هذا الشكل.

### جلسات ACP التفاعلية

صُممت الجلسات التفاعلية لمواصلة الحديث على سطح دردشة مرئي:

- يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
- يربط `/acp spawn ... --thread ...` سلسلة/موضوع القناة بجلسة ACP.
- تُوجّه `bindings[].type="acp"` الدائمة المهيأة المحادثات المطابقة إلى جلسة ACP نفسها.

تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى جلسة ACP، ويتم تسليم مخرجات ACP مرة أخرى إلى القناة/السلسلة/الموضوع نفسه.

### جلسات ACP أحادية الطلقة المملوكة للأصل

جلسات ACP أحادية الطلقة التي ينشئها تشغيل وكيل آخر هي أبناء في الخلفية، على غرار الوكلاء الفرعيين:

- يطلب الأصل العمل باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
- يعمل الابن في جلسة حزام ACP الخاصة به.
- تُبلّغ النتيجة عبر مسار الإعلان الداخلي عن إكمال المهمة.
- يعيد الأصل صياغة نتيجة الابن بصوت المساعد العادي عندما تكون هناك حاجة إلى رد موجه للمستخدم.

لا تتعامل مع هذا المسار على أنه دردشة نظير إلى نظير بين الأصل والابن. فلدى الابن بالفعل قناة إكمال تعود إلى الأصل.

### `sessions_send` وتسليم A2A

يمكن لـ `sessions_send` استهداف جلسة أخرى بعد الإنشاء. وبالنسبة إلى جلسات الأقران العادية، يستخدم OpenClaw مسار متابعة وكيل إلى وكيل (A2A) بعد حقن الرسالة:

- انتظار رد الجلسة المستهدفة
- السماح اختياريًا للطالب والهدف بتبادل عدد محدود من أدوار المتابعة
- طلب من الهدف إنتاج رسالة إعلان
- تسليم هذا الإعلان إلى القناة أو السلسلة المرئية

يُعد مسار A2A هذا بديلًا احتياطيًا لعمليات الإرسال بين الأقران عندما يحتاج المرسِل إلى متابعة مرئية. ويظل مفعّلًا عندما تتمكن جلسة غير ذات صلة من رؤية هدف ACP ومراسلته، على سبيل المثال ضمن إعدادات `tools.sessions.visibility` الواسعة.

يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو أصل الابن الخاص به من جلسات ACP أحادية الطلقة المملوكة للأصل. وفي هذه الحالة، قد يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأصل بنتيجة الابن، وتمرير رد الأصل مرة أخرى إلى الابن، وإنشاء حلقة صدى بين الأصل والابن. وتعرض نتيجة `sessions_send` القيمة `delivery.status="skipped"` في حالة الابن المملوك هذه لأن مسار الإكمال هو المسؤول بالفعل عن النتيجة.

### استئناف جلسة موجودة

استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر `session/load`، بحيث يستأنف العمل مع السياق الكامل لما سبق.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

حالات الاستخدام الشائعة:

- تسليم جلسة Codex من حاسوبك المحمول إلى هاتفك — أخبر وكيلك أن يتابع من حيث توقفت
- متابعة جلسة برمجة بدأتَها تفاعليًا في CLI، والآن دون واجهة مباشرة عبر وكيلك
- استئناف عمل انقطع بسبب إعادة تشغيل Gateway أو انتهاء مهلة الخمول

ملاحظات:

- يتطلب `resumeSessionId` وجود `runtime: "acp"` — ويعيد خطأ إذا استُخدم مع وقت تشغيل الوكيل الفرعي.
- يستعيد `resumeSessionId` سجل المحادثة الصاعد لـ ACP؛ ولا تزال `thread` و`mode` تُطبَّقان بصورة طبيعية على جلسة OpenClaw الجديدة التي تنشئها، لذا لا تزال `mode: "session"` تتطلب `thread: true`.
- يجب أن يدعم الوكيل الهدف `session/load` (ويدعمه Codex وClaude Code).
- إذا لم يتم العثور على معرّف الجلسة، يفشل الإنشاء بخطأ واضح — من دون رجوع صامت إلى جلسة جديدة.

<Accordion title="اختبار Smoke بعد النشر">

بعد نشر Gateway، شغّل فحصًا حيًا من طرف إلى طرف بدلًا من الثقة في اختبارات الوحدة:

1. تحقّق من إصدار Gateway المنشور وcommit على المضيف الهدف.
2. افتح جلسة جسر ACPX مؤقتة إلى وكيل حي.
3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` باستخدام `runtime: "acp"` و`agentId: "codex"` و`mode: "run"` والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. تحقّق من `accepted=yes` ووجود `childSessionKey` حقيقي وعدم وجود خطأ validator.
5. نظّف جلسة الجسر المؤقتة.

أبقِ البوابة على `mode: "run"` وتخطَّ `streamTo: "parent"` — فمسارات `mode: "session"` المرتبطة بالسلاسل ومسارات ترحيل البث هي جولات تكامل أغنى ومنفصلة.

</Accordion>

## توافق Sandbox

تعمل جلسات ACP حاليًا على وقت تشغيل المضيف، وليس داخل Sandbox الخاص بـ OpenClaw.

القيود الحالية:

- إذا كانت الجلسة الطالبة داخل Sandbox، فسيتم حظر إنشاءات ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
  - الخطأ: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- لا يدعم `sessions_spawn` مع `runtime: "acp"` القيمة `sandbox: "require"`.
  - الخطأ: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

استخدم `runtime: "subagent"` عندما تحتاج إلى تنفيذ مفروض بواسطة Sandbox.

### من الأمر `/acp`

استخدم `/acp spawn` للتحكم التشغيلي الصريح من الدردشة عند الحاجة.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

الأعلام الأساسية:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

## حل الهدف الخاص بالجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key` أو `session-id` أو `session-label`).

ترتيب الحل:

1. وسيطة الهدف الصريحة (أو `--session` للأمر `/acp steer`)
   - يحاول المفتاح
   - ثم معرّف جلسة على هيئة UUID
   - ثم التسمية
2. ربط السلسلة الحالية (إذا كانت هذه المحادثة/السلسلة مرتبطة بجلسة ACP)
3. الرجوع إلى جلسة الطالب الحالية

تشارك كل من ارتباطات المحادثة الحالية وارتباطات السلاسل في الخطوة 2.

إذا لم يتم حل أي هدف، يعرض OpenClaw خطأ واضحًا (`Unable to resolve session target: ...`).

## أوضاع ربط الإنشاء

يدعم `/acp spawn` الخيار `--bind here|off`.

| الوضع   | السلوك                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | ربط المحادثة النشطة الحالية في مكانها؛ ويفشل إذا لم تكن هناك محادثة نشطة. |
| `off`  | عدم إنشاء ربط للمحادثة الحالية.                                        |

ملاحظات:

- يُعد `--bind here` أبسط مسار تشغيلي لعبارة "اجعل هذه القناة أو الدردشة مدعومة بـ Codex."
- لا ينشئ `--bind here` سلسلة فرعية.
- يتوفر `--bind here` فقط على القنوات التي تعرض دعم ربط المحادثة الحالية.
- لا يمكن دمج `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

## أوضاع سلاسل الإنشاء

يدعم `/acp spawn` الخيار `--thread auto|here|off`.

| الوضع   | السلوك                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | في سلسلة نشطة: يربط تلك السلسلة. وخارج السلسلة: ينشئ/يربط سلسلة فرعية عند الدعم. |
| `here` | يتطلب سلسلة نشطة حالية؛ ويفشل إذا لم تكن داخل واحدة.                                              |
| `off`  | بلا ربط. تبدأ الجلسة غير مرتبطة.                                                                  |

ملاحظات:

- على الأسطح التي لا تدعم ربط السلاسل، يكون السلوك الافتراضي فعليًا هو `off`.
- يتطلب إنشاء جلسات مرتبطة بالسلاسل دعم سياسة القناة:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية من دون إنشاء سلسلة فرعية.

## عناصر تحكم ACP

| الأمر                | ما الذي يفعله                                              | مثال                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | إنشاء جلسة ACP؛ مع ربط اختياري حالي أو ربط سلسلة.          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | إلغاء الدور الجاري للجلسة المستهدفة.                       | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | إرسال تعليمات توجيه إلى الجلسة الجارية.                    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | إغلاق الجلسة وفك ارتباط أهداف السلاسل.                     | `/acp close`                                                  |
| `/acp status`        | عرض الواجهة الخلفية، والوضع، والحالة، وخيارات وقت التشغيل، والإمكانات. | `/acp status`                                                 |
| `/acp set-mode`      | تعيين وضع وقت التشغيل للجلسة المستهدفة.                    | `/acp set-mode plan`                                          |
| `/acp set`           | كتابة خيار إعداد عام لوقت التشغيل.                         | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | تعيين تجاوز دليل العمل لوقت التشغيل.                       | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | تعيين ملف تعريف سياسة الموافقة.                            | `/acp permissions strict`                                     |
| `/acp timeout`       | تعيين مهلة وقت التشغيل (بالثواني).                         | `/acp timeout 120`                                            |
| `/acp model`         | تعيين تجاوز النموذج لوقت التشغيل.                          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | إزالة تجاوزات خيارات وقت تشغيل الجلسة.                     | `/acp reset-options`                                          |
| `/acp sessions`      | سرد جلسات ACP الحديثة من المخزن.                           | `/acp sessions`                                               |
| `/acp doctor`        | فحص سلامة الواجهة الخلفية، والإمكانات، والإصلاحات العملية. | `/acp doctor`                                                 |
| `/acp install`       | طباعة خطوات تثبيت وتمكين حتمية.                            | `/acp install`                                                |

يعرض `/acp status` خيارات وقت التشغيل الفعلية بالإضافة إلى معرّفات الجلسات على مستوى وقت التشغيل والواجهة الخلفية. وتظهر أخطاء عناصر التحكم غير المدعومة بوضوح عندما تفتقر واجهة خلفية إلى إمكانة ما. ويقرأ `/acp sessions` المخزن للجلسة الحالية المرتبطة أو جلسة الطالب الحالية؛ وتُحل رموز الهدف (`session-key` أو `session-id` أو `session-label`) عبر اكتشاف جلسات Gateway، بما في ذلك جذور `session.store` المخصصة لكل وكيل.

## تعيين خيارات وقت التشغيل

يحتوي `/acp` على أوامر مريحة ومُعيِّن عام.

العمليات المكافئة:

- يطابق `/acp model <id>` مفتاح إعداد وقت التشغيل `model`.
- يطابق `/acp permissions <profile>` مفتاح إعداد وقت التشغيل `approval_policy`.
- يطابق `/acp timeout <seconds>` مفتاح إعداد وقت التشغيل `timeout`.
- يحدّث `/acp cwd <path>` تجاوز cwd لوقت التشغيل مباشرةً.
- يُعد `/acp set <key> <value>` المسار العام.
  - حالة خاصة: يستخدم `key=cwd` مسار تجاوز cwd.
- يمسح `/acp reset-options` جميع تجاوزات وقت التشغيل للجلسة المستهدفة.

## حزام acpx وإعداد Plugin والأذونات

للاطلاع على إعداد حزام acpx (الأسماء المستعارة لـ Claude Code / Codex / Gemini CLI)،
وجسور MCP الخاصة بـ plugin-tools وOpenClaw-tools، وأوضاع أذونات ACP، راجع
[وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العرض                                                                     | السبب المحتمل                                                                  | الحل                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin الواجهة الخلفية مفقود أو معطل.                                          | ثبّت Plugin الواجهة الخلفية وفعّله، ثم شغّل `/acp doctor`.                                                                                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطل عالميًا.                                                               | اضبط `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | التوزيع من رسائل السلاسل العادية معطل.                                          | اضبط `acp.dispatch.enabled=true`.                                                                                                                                         |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                               | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                 |
| `Unable to resolve session target: ...`                                     | رمز مفتاح/معرّف/تسمية غير صحيح.                                                | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بدقة، ثم أعد المحاولة.                                                                                                       |
| `--bind here requires running /acp spawn inside an active ... conversation` | تم استخدام `--bind here` من دون محادثة نشطة قابلة للربط.                       | انتقل إلى الدردشة/القناة المستهدفة وأعد المحاولة، أو استخدم إنشاء غير مرتبط.                                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المحول إلى إمكانية ربط ACP للمحادثة الحالية.                             | استخدم `/acp spawn ... --thread ...` حيثما كان ذلك مدعومًا، أو هيّئ `bindings[]` ذات المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                         |
| `--thread here requires running /acp spawn inside an active ... thread`     | تم استخدام `--thread here` خارج سياق سلسلة.                                     | انتقل إلى السلسلة المستهدفة أو استخدم `--thread auto`/`off`.                                                                                                             |
| `Only <user-id> can rebind this channel/conversation/thread.`               | مستخدم آخر يملك هدف الربط النشط.                                               | أعد الربط بصفتك المالك أو استخدم محادثة أو سلسلة مختلفة.                                                                                                                 |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المحول إلى إمكانية ربط السلاسل.                                           | استخدم `--thread off` أو انتقل إلى محول/قناة مدعومين.                                                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | وقت تشغيل ACP يعمل على المضيف؛ وجلسة الطالب داخل Sandbox.                      | استخدم `runtime="subagent"` من جلسات Sandbox، أو شغّل إنشاء ACP من جلسة خارج Sandbox.                                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | تم طلب `sandbox="require"` لوقت تشغيل ACP.                                      | استخدم `runtime="subagent"` عند الحاجة إلى Sandbox إلزامي، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير موجودة داخل Sandbox.                                         |
| Missing ACP metadata for bound session                                      | بيانات تعريف جلسة ACP قديمة/محذوفة.                                             | أعد الإنشاء باستخدام `/acp spawn`، ثم أعد الربط/تركيز السلسلة.                                                                                                           |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | يؤدي `permissionMode` إلى حظر الكتابة/التنفيذ في جلسة ACP غير تفاعلية.          | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [إعداد الأذونات](/ar/tools/acp-agents-setup#permission-configuration).       |
| ACP session fails early with little output                                  | تتم عرقلة مطالبات الأذونات بواسطة `permissionMode`/`nonInteractivePermissions`. | تحقق من سجلات Gateway للعثور على `AcpRuntimeError`. وللحصول على أذونات كاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | انتهت عملية الحزام لكن جلسة ACP لم تبلغ عن الإكمال.                              | راقب باستخدام `ps aux \| grep acpx`؛ ثم اقتل العمليات الراكدة يدويًا.                                                                                                     |

## ذو صلة

- [الوكلاء الفرعيون](/ar/tools/subagents)
- [أدوات Sandbox متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [إرسال الوكيل](/ar/tools/agent-send)
