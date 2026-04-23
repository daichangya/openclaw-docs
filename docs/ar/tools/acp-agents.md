---
read_when:
    - تشغيل coding harnesses عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة رسائل بجلسة ACP مستمرة
    - استكشاف أخطاء backend وPlugin الخاصة بـ ACP وإصلاحها
    - تصحيح أخطاء تسليم إكمال ACP أو حلقات وكيل إلى وكيل
    - تشغيل أوامر `/acp` من الدردشة
summary: استخدم جلسات وقت تشغيل ACP لـ Codex وClaude Code وCursor وGemini CLI وOpenClaw ACP ووكلاء harness الآخرين
title: وكلاء ACP
x-i18n:
    generated_at: "2026-04-23T07:33:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# وكلاء ACP

تتيح جلسات [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) لـ OpenClaw تشغيل coding harnesses خارجية (مثل Pi وClaude Code وCodex وCursor وCopilot وOpenClaw ACP وOpenCode وGemini CLI ووكلاء ACPX المدعومين الآخرين) عبر Plugin backend لـ ACP.

إذا طلبت من OpenClaw بلغة طبيعية "شغّل هذا في Codex" أو "ابدأ Claude Code في thread"، فيجب على OpenClaw توجيه هذا الطلب إلى وقت تشغيل ACP (وليس وقت تشغيل sub-agent الأصلي). ويتم تتبع كل عملية spawn لجلسة ACP كمهمة [في الخلفية](/ar/automation/tasks).

إذا كنت تريد من Codex أو Claude Code أن يتصلا كعميل MCP خارجي مباشرة
بمحادثات القنوات الموجودة في OpenClaw، فاستخدم [`openclaw mcp serve`](/ar/cli/mcp)
بدلًا من ACP.

## أي صفحة أريد؟

هناك ثلاثة أسطح متقاربة يسهل الخلط بينها:

| تريد أن...                                                                     | استخدم هذا                              | ملاحظات                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| تشغيل Codex أو Claude Code أو Gemini CLI أو harness خارجي آخر _عبر_ OpenClaw | هذه الصفحة: وكلاء ACP                 | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام الخلفية، وعناصر تحكم وقت التشغيل |
| كشف جلسة OpenClaw Gateway _كـ_ خادم ACP لمحرر أو عميل      | [`openclaw acp`](/ar/cli/acp)            | وضع bridge. يتحدث IDE/العميل مع OpenClaw عبر ACP على stdio/WebSocket                                          |
| إعادة استخدام AI CLI محلي كنموذج fallback نصي فقط                                 | [CLI Backends](/ar/gateway/cli-backends) | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل harness                                             |

## هل يعمل هذا مباشرة؟

في الغالب، نعم.

- تشحن عمليات التثبيت الجديدة الآن Plugin وقت التشغيل المضمّن `acpx` مفعّلًا افتراضيًا.
- يفضّل Plugin `acpx` المضمّن ملفه الثنائي المحلي المثبّت `acpx`.
- عند بدء التشغيل، يفحص OpenClaw ذلك الملف الثنائي ويصلحه ذاتيًا إذا لزم الأمر.
- ابدأ بـ `/acp doctor` إذا كنت تريد فحصًا سريعًا للجاهزية.

ما الذي قد يحدث في أول استخدام:

- قد يُجلب adapter خاص بـ harness مستهدف عند الطلب باستخدام `npx` في أول مرة تستخدم فيها ذلك harness.
- ما تزال مصادقة vendor مطلوبة على المضيف لذلك harness.
- إذا لم يكن لدى المضيف وصول npm/شبكة، فقد تفشل عمليات جلب adapter في التشغيل الأول إلى أن تُسخن caches مسبقًا أو يُثبت adapter بطريقة أخرى.

أمثلة:

- `/acp spawn codex`: ينبغي أن يكون OpenClaw جاهزًا لتهيئة `acpx`، لكن قد يحتاج Codex ACP adapter إلى جلب في أول تشغيل.
- `/acp spawn claude`: الأمر نفسه مع Claude ACP adapter، بالإضافة إلى مصادقة Claude على ذلك المضيف.

## تدفق operator السريع

استخدم هذا عندما تريد runbook عمليًا لـ `/acp`:

1. أنشئ جلسة:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. اعمل في المحادثة أو thread المرتبطين (أو استهدف مفتاح تلك الجلسة صراحة).
3. تحقّق من حالة وقت التشغيل:
   - `/acp status`
4. اضبط خيارات وقت التشغيل حسب الحاجة:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. ادفع جلسة نشطة من دون استبدال السياق:
   - `/acp steer tighten logging and continue`
6. أوقف العمل:
   - `/acp cancel` (إيقاف الدور الحالي)، أو
   - `/acp close` (إغلاق الجلسة + إزالة الارتباطات)

## بداية سريعة للبشر

أمثلة على طلبات طبيعية:

- "اربط قناة Discord هذه بـ Codex."
- "ابدأ جلسة Codex مستمرة في thread هنا وأبقها مركزة."
- "شغّل هذا كجلسة Claude Code ACP أحادية وألخّص النتيجة."
- "اربط دردشة iMessage هذه بـ Codex واحتفظ بالمتابعات في مساحة العمل نفسها."
- "استخدم Gemini CLI لهذه المهمة في thread، ثم احتفظ بالمتابعات في هذا thread نفسه."

ما الذي ينبغي على OpenClaw فعله:

1. اختيار `runtime: "acp"`.
2. حل هدف harness المطلوب (`agentId`، مثل `codex`).
3. إذا طُلب الربط بالمحادثة الحالية وكان القناة النشطة تدعمه، فليربط جلسة ACP بتلك المحادثة.
4. وإلا، إذا طُلب الربط بـ thread وكانت القناة الحالية تدعمه، فليربط جلسة ACP بذلك thread.
5. توجيه رسائل المتابعة المرتبطة إلى جلسة ACP نفسها حتى فقدان التركيز/الإغلاق/الانتهاء.

## ACP مقابل sub-agents

استخدم ACP عندما تريد وقت تشغيل harness خارجيًا. واستخدم sub-agents عندما تريد تشغيلات مفوضة أصلية في OpenClaw.

| المجال          | جلسة ACP                           | تشغيل sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل       | Plugin backend لـ ACP (مثل acpx) | وقت تشغيل sub-agent الأصلي في OpenClaw  |
| مفتاح الجلسة   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                            | `/subagents ...`                   |
| أداة spawn    | `sessions_spawn` مع `runtime:"acp"` | `sessions_spawn` (وقت التشغيل الافتراضي) |

راجع أيضًا [Sub-agents](/ar/tools/subagents).

## كيف يشغّل ACP Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون الطبقة كما يلي:

1. طبقة التحكم بجلسة ACP في OpenClaw
2. Plugin وقت التشغيل المضمّن `acpx`
3. Claude ACP adapter
4. آلية وقت تشغيل/جلسة Claude نفسها

تمييز مهم:

- Claude عبر ACP هو جلسة harness مع عناصر تحكم ACP، واستئناف الجلسة، وتتبع مهام الخلفية، وإمكانية الربط الاختيارية بالمحادثة/الـ thread.
- أما CLI backends فهي أوقات تشغيل محلية احتياطية نصية فقط. راجع [CLI Backends](/ar/gateway/cli-backends).

بالنسبة إلى operators، القاعدة العملية هي:

- إذا كنت تريد `/acp spawn` أو جلسات قابلة للربط أو عناصر تحكم وقت التشغيل أو عمل harness مستمر: استخدم ACP
- وإذا كنت تريد fallback نصيًا محليًا بسيطًا عبر CLI الخام: استخدم CLI backends

## الجلسات المرتبطة

### الارتباطات بالمحادثة الحالية

استخدم `/acp spawn <harness> --bind here` عندما تريد أن تصبح المحادثة الحالية مساحة عمل ACP مستمرة من دون إنشاء child thread.

السلوك:

- يظل OpenClaw مالكًا لنقل القناة، والمصادقة، والسلامة، والتسليم.
- تُثبَّت المحادثة الحالية على مفتاح جلسة ACP المنشأ.
- تُوجَّه رسائل المتابعة في تلك المحادثة إلى جلسة ACP نفسها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` الجلسة ويزيل الارتباط بالمحادثة الحالية.

ما الذي يعنيه هذا عمليًا:

- يبقي `--bind here` سطح الدردشة نفسه. ففي Discord تبقى القناة الحالية هي القناة الحالية.
- يمكن لـ `--bind here` مع ذلك إنشاء جلسة ACP جديدة إذا كنت تنشئ عملًا جديدًا. يربط هذا الارتباط تلك الجلسة بالمحادثة الحالية.
- لا ينشئ `--bind here` child Discord thread أو Telegram topic بمفرده.
- ما يزال بإمكان وقت تشغيل ACP امتلاك دليل العمل الخاص به (`cwd`) أو مساحة عمل يديرها backend على القرص. مساحة العمل هذه منفصلة عن سطح الدردشة ولا تعني وجود thread مراسلة جديد.
- إذا أنشأت جلسة لوكيل ACP مختلف ولم تمرر `--cwd`، فإن OpenClaw يرث مساحة عمل **الوكيل المستهدف** افتراضيًا، لا مساحة عمل الطالب.
- إذا كان مسار مساحة العمل الموروثة هذا مفقودًا (`ENOENT`/`ENOTDIR`)، يعود OpenClaw إلى cwd الافتراضي للـ backend بدلًا من إعادة استخدام الشجرة الخاطئة بصمت.
- إذا كانت مساحة العمل الموروثة موجودة لكن لا يمكن الوصول إليها (مثل `EACCES`)، تعيد عملية spawn خطأ الوصول الحقيقي بدلًا من إسقاط `cwd`.

النموذج الذهني:

- سطح الدردشة: حيث يواصل الناس الحديث (`Discord channel`، `Telegram topic`، `iMessage chat`)
- جلسة ACP: حالة وقت تشغيل Codex/Claude/Gemini المستمرة التي يوجّه إليها OpenClaw
- child thread/topic: سطح مراسلة إضافي اختياري يُنشأ فقط بواسطة `--thread ...`
- مساحة عمل وقت التشغيل: موقع نظام الملفات الذي يعمل فيه harness (`cwd` أو checkout للمستودع أو مساحة عمل backend)

أمثلة:

- `/acp spawn codex --bind here`: احتفظ بهذه الدردشة، وأنشئ أو ألحق جلسة Codex ACP، ووجّه الرسائل المستقبلية هنا إليها
- `/acp spawn codex --thread auto`: قد ينشئ OpenClaw child thread/topic ويربط جلسة ACP هناك
- `/acp spawn codex --bind here --cwd /workspace/repo`: نفس ربط الدردشة أعلاه، لكن Codex يعمل في `/workspace/repo`

دعم الربط بالمحادثة الحالية:

- يمكن لقنوات الدردشة/الرسائل التي تعلن دعم الربط بالمحادثة الحالية استخدام `--bind here` عبر مسار الربط المشترك للمحادثات.
- ما تزال القنوات ذات دلالات threads/topics المخصصة قادرة على تقديم canonicalization خاص بالقناة خلف الواجهة المشتركة نفسها.
- يعني `--bind here` دائمًا "اربط المحادثة الحالية في مكانها".
- تستخدم ارتباطات المحادثة الحالية العامة مخزن الربط المشترك في OpenClaw وتبقى عبر عمليات إعادة تشغيل Gateway العادية.

ملاحظات:

- كل من `--bind here` و`--thread ...` متنافيان في `/acp spawn`.
- في Discord، يربط `--bind here` القناة أو thread الحاليين في مكانهما. ولا يكون `spawnAcpSessions` مطلوبًا إلا عندما يحتاج OpenClaw إلى إنشاء child thread لـ `--thread auto|here`.
- إذا لم تكشف القناة النشطة عن ارتباطات ACP للمحادثة الحالية، يعيد OpenClaw رسالة واضحة تفيد بعدم الدعم.
- إن أسئلة `resume` و"جلسة جديدة" هي أسئلة تخص جلسة ACP، لا أسئلة تخص القناة. يمكنك إعادة استخدام حالة وقت التشغيل أو استبدالها من دون تغيير سطح الدردشة الحالي.

### الجلسات المرتبطة بالـ thread

عندما تكون ارتباطات thread مفعلة لمحوّل قناة، يمكن ربط جلسات ACP بالـ threads:

- يربط OpenClaw thread بجلسة ACP مستهدفة.
- تُوجَّه رسائل المتابعة في ذلك thread إلى جلسة ACP المرتبطة.
- تُسلَّم مخرجات ACP إلى thread نفسه.
- تؤدي عمليات unfocus/close/archive/idle-timeout أو انتهاء الحد الأقصى للعمر إلى إزالة الارتباط.

يعتمد دعم الربط بـ thread على المحوّل. وإذا كان محوّل القناة النشط لا يدعم ارتباطات thread، يعيد OpenClaw رسالة واضحة تفيد بعدم الدعم/عدم التوفر.

إشارات الميزات المطلوبة لـ ACP المرتبط بالـ thread:

- `acp.enabled=true`
- تكون `acp.dispatch.enabled` مفعلة افتراضيًا (اضبطها على `false` لإيقاف توجيه ACP مؤقتًا)
- تفعيل إشارة spawn الخاصة بـ ACP thread في محول القناة (خاصة بالمحول)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### القنوات الداعمة للـ thread

- أي محول قناة يكشف قدرة الربط بالجلسة/الـ thread.
- الدعم المضمّن الحالي:
  - Discord threads/channels
  - Telegram topics (موضوعات المنتدى في المجموعات/supergroups وموضوعات الرسائل الخاصة)
- يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

## الإعدادات الخاصة بالقناة

بالنسبة إلى تدفقات العمل غير الزائلة، اضبط ارتباطات ACP المستمرة في إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

- يضع `bindings[].type="acp"` علامة على ارتباط محادثة ACP مستمر.
- يحدد `bindings[].match` المحادثة المستهدفة:
  - قناة أو thread في Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - موضوع منتدى Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - دردشة DM/group في BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    فضّل `chat_id:*` أو `chat_identifier:*` لارتباطات المجموعات المستقرة.
  - دردشة DM/group في iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    فضّل `chat_id:*` لارتباطات المجموعات المستقرة.
- `bindings[].agentId` هو معرّف وكيل OpenClaw المالك.
- توجد تجاوزات ACP الاختيارية تحت `bindings[].acp`:
  - `mode` (`persistent` أو `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### القيم الافتراضية لوقت التشغيل لكل وكيل

استخدم `agents.list[].runtime` لتعريف القيم الافتراضية لـ ACP مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (معرّف harness، مثل `codex` أو `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ترتيب أسبقية التجاوزات للجلسات المرتبطة بـ ACP:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. القيم الافتراضية العامة لـ ACP (مثل `acp.backend`)

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

- يضمن OpenClaw وجود جلسة ACP المكوّنة قبل الاستخدام.
- تُوجَّه الرسائل في تلك القناة أو الموضوع إلى جلسة ACP المكوّنة.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` ضبط مفتاح جلسة ACP نفسه في مكانه.
- ما تزال ارتباطات وقت التشغيل المؤقتة (مثل تلك التي تنشئها تدفقات thread-focus) تُطبق حيثما وجدت.
- بالنسبة إلى عمليات spawn عبر وكلاء ACP من دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل المستهدف من تكوين الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى cwd الافتراضي للـ backend؛ أما إخفاقات الوصول لمسارات غير مفقودة فتظهر كأخطاء spawn.

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

- تكون القيمة الافتراضية لـ `runtime` هي `subagent`، لذا اضبط `runtime: "acp"` صراحةً لجلسات ACP.
- إذا حُذف `agentId`، يستخدم OpenClaw القيمة `acp.defaultAgent` عند ضبطها.
- يتطلب `mode: "session"` مع `thread: true` من أجل الاحتفاظ بمحادثة مرتبطة مستمرة.

تفاصيل الواجهة:

- `task` (مطلوب): prompt الأولي المرسل إلى جلسة ACP.
- `runtime` (مطلوب لـ ACP): يجب أن يكون `"acp"`.
- `agentId` (اختياري): معرّف harness الهدف في ACP. ويعود إلى `acp.defaultAgent` إذا كان مضبوطًا.
- `thread` (اختياري، الافتراضي `false`): طلب تدفق ربط thread حيثما كان مدعومًا.
- `mode` (اختياري): `run` (أحادي) أو `session` (مستمر).
  - الافتراضي هو `run`
  - إذا كان `thread: true` وحُذف mode، فقد يعود OpenClaw افتراضيًا إلى سلوك مستمر بحسب مسار وقت التشغيل
  - يتطلب `mode: "session"` وجود `thread: true`
- `cwd` (اختياري): دليل العمل المطلوب لوقت التشغيل (يُتحقق منه حسب سياسة backend/وقت التشغيل). وإذا حُذف، يرث ACP spawn مساحة عمل الوكيل المستهدف عند ضبطها؛ وتعود المسارات الموروثة المفقودة إلى القيم الافتراضية للـ backend، بينما تُعاد أخطاء الوصول الحقيقية.
- `label` (اختياري): تسمية موجهة للمشغّل تُستخدم في نص الجلسة/الشريط.
- `resumeSessionId` (اختياري): استئناف جلسة ACP موجودة بدلًا من إنشاء جلسة جديدة. يعيد الوكيل تشغيل سجل محادثته عبر `session/load`. ويتطلب `runtime: "acp"`.
- `streamTo` (اختياري): تقوم `"parent"` ببث ملخصات تقدم التشغيل الأولي لـ ACP إلى جلسة الطالب كأحداث نظام.
  - وعند توفره، قد تتضمن الاستجابات المقبولة القيمة `streamLogPath` التي تشير إلى سجل JSONL مقيّد بالجلسة (`<sessionId>.acp-stream.jsonl`) ويمكنك تتبعه من أجل سجل relay الكامل.
- `model` (اختياري): تجاوز صريح للنموذج الخاص بجلسة ACP التابعة. ويُحترم عند `runtime: "acp"` بحيث تستخدم الجلسة التابعة النموذج المطلوب بدلًا من الرجوع بصمت إلى القيمة الافتراضية لوكيل الهدف.

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو أعمال خلفية يملكها parent. ويعتمد مسار التسليم على هذا الشكل.

### جلسات ACP التفاعلية

الجلسات التفاعلية مخصصة للاستمرار في الحديث على سطح دردشة مرئي:

- يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
- يربط `/acp spawn ... --thread ...` thread/topic في القناة بجلسة ACP.
- توجّه `bindings[].type="acp"` المستمرة المطابقة المحادثات إلى جلسة ACP نفسها.

تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرة إلى جلسة ACP، وتُسلَّم مخرجات ACP إلى القناة/الـ thread/topic نفسها.

### جلسات ACP الأحادية التي يملكها parent

جلسات ACP الأحادية التي تُنشأ بواسطة تشغيل وكيل آخر هي أبناء في الخلفية، مشابهة لـ sub-agents:

- يطلب parent العمل عبر `sessions_spawn({ runtime: "acp", mode: "run" })`.
- يعمل الابن في جلسة harness ACP الخاصة به.
- يُبلَّغ عن الإكمال عبر مسار إعلان إكمال المهمة الداخلي.
- يعيد parent صياغة نتيجة الابن بصوت مساعد عادي عندما يكون الرد الموجّه للمستخدم مفيدًا.

لا تتعامل مع هذا المسار على أنه دردشة نظير إلى نظير بين parent والابن. فلدى الابن بالفعل قناة إكمال تعود إلى parent.

### `sessions_send` وتسليم A2A

يمكن لـ `sessions_send` استهداف جلسة أخرى بعد spawn. وبالنسبة إلى الجلسات النظيرة العادية، يستخدم OpenClaw مسار متابعة من وكيل إلى وكيل (A2A) بعد حقن الرسالة:

- انتظر رد الجلسة المستهدفة
- اسمح اختياريًا للطالب والهدف بتبادل عدد محدود من أدوار المتابعة
- اطلب من الهدف إنتاج رسالة إعلان
- سلّم ذلك الإعلان إلى القناة أو الـ thread المرئي

يُعد هذا المسار A2A fallback للإرسال بين الجلسات النظيرة عندما يحتاج المرسِل إلى متابعة مرئية. ويظل مفعّلًا عندما تستطيع جلسة غير مرتبطة أن ترى هدف ACP وتراسله، مثلًا ضمن إعدادات واسعة لـ `tools.sessions.visibility`.

يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو parent لابنه الأحادي المملوك له من ACP. ففي تلك الحالة، قد يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ parent بنتيجة الابن، وتمرير رد parent مرة أخرى إلى الابن، وإنشاء حلقة صدى parent/child. وتبلغ نتيجة `sessions_send` عن `delivery.status="skipped"` في حالة الابن المملوك هذه لأن مسار الإكمال مسؤول بالفعل عن النتيجة.

### استئناف جلسة موجودة

استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من البدء من جديد. يعيد الوكيل تشغيل سجل المحادثة عبر `session/load`، فيتابع مع السياق الكامل لما سبق.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

حالات الاستخدام الشائعة:

- سلّم جلسة Codex من حاسوبك المحمول إلى هاتفك — واطلب من وكيلك أن يكمل من حيث توقفت
- تابع جلسة برمجة بدأتَها تفاعليًا في CLI، ولكن الآن بدون واجهة عبر وكيلك
- واصل العمل الذي انقطع بسبب إعادة تشغيل Gateway أو انتهاء المهلة في الخمول

ملاحظات:

- يتطلب `resumeSessionId` القيمة `runtime: "acp"` — ويعيد خطأ إذا استُخدم مع وقت تشغيل sub-agent.
- يعيد `resumeSessionId` حالة سجل المحادثة upstream الخاصة بـ ACP؛ بينما تظل `thread` و`mode` تُطبقان بشكل طبيعي على جلسة OpenClaw الجديدة التي تنشئها، لذلك ما يزال `mode: "session"` يتطلب `thread: true`.
- يجب أن يدعم وكيل الهدف `session/load` (ويدعمه كل من Codex وClaude Code).
- إذا لم يُعثر على معرّف الجلسة، تفشل عملية spawn بخطأ واضح — ولا يوجد fallback صامت إلى جلسة جديدة.

### اختبار operator السريع

استخدم هذا بعد نشر Gateway عندما تريد فحصًا حيًا سريعًا يؤكد أن ACP spawn
يعمل بالفعل من البداية إلى النهاية، وليس فقط أنه يجتاز اختبارات الوحدة.

البوابة الموصى بها:

1. تحقق من إصدار/commit Gateway المنشور على المضيف المستهدف.
2. أكد أن المصدر المنشور يتضمن قبول lineage الخاص بـ ACP في
   `src/gateway/sessions-patch.ts` (`جلسات subagent:* أو acp:*`).
3. افتح جلسة bridge ACPX مؤقتة إلى وكيل حي (مثل
   `razor(main)` على `jpclawhq`).
4. اطلب من ذلك الوكيل استدعاء `sessions_spawn` بالقيم:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - المهمة: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. تحقق من أن الوكيل يبلّغ عن:
   - `accepted=yes`
   - `childSessionKey` حقيقي
   - لا يوجد خطأ validator
6. نظّف جلسة ACPX bridge المؤقتة.

مثال prompt للوكيل الحي:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

ملاحظات:

- أبقِ هذا الاختبار السريع على `mode: "run"` ما لم تكن تختبر عمدًا
  جلسات ACP المستمرة المرتبطة بـ thread.
- لا تشترط `streamTo: "parent"` في البوابة الأساسية. فهذا المسار يعتمد على
  قدرات الطالب/الجلسة وهو فحص تكامل منفصل.
- تعامل مع اختبار `mode: "session"` المرتبط بـ thread بوصفه تمريرة تكامل ثانية
  وأغنى من داخل Discord thread أو Telegram topic حقيقيين.

## توافق sandbox

تعمل جلسات ACP حاليًا على وقت تشغيل المضيف، لا داخل sandbox الخاص بـ OpenClaw.

القيود الحالية:

- إذا كانت جلسة الطالب ضمن sandbox، تُمنع عمليات spawn الخاصة بـ ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
  - الخطأ: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- لا يدعم `sessions_spawn` مع `runtime: "acp"` القيمة `sandbox: "require"`.
  - الخطأ: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

استخدم `runtime: "subagent"` عندما تحتاج إلى تنفيذ مفروض بواسطة sandbox.

### من أمر `/acp`

استخدم `/acp spawn` من أجل تحكم operator الصريح من الدردشة عند الحاجة.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

الإشارات الرئيسية:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

راجع [أوامر Slash](/ar/tools/slash-commands).

## حل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key` أو `session-id` أو `session-label`).

ترتيب الحل:

1. وسيطة الهدف الصريحة (أو `--session` في `/acp steer`)
   - تحاول المفتاح
   - ثم معرّف الجلسة ذي الشكل UUID
   - ثم label
2. ربط الـ thread الحالي (إذا كانت هذه المحادثة/الـ thread مرتبطة بجلسة ACP)
3. fallback إلى جلسة الطالب الحالية

تشارك كل من ارتباطات المحادثة الحالية وارتباطات الـ thread في الخطوة 2.

إذا تعذر حل أي هدف، يعيد OpenClaw خطأ واضحًا (`Unable to resolve session target: ...`).

## أوضاع ربط spawn

يدعم `/acp spawn` الخيار `--bind here|off`.

| الوضع   | السلوك                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك واحدة نشطة. |
| `off`  | لا تنشئ ارتباطًا بالمحادثة الحالية.                          |

ملاحظات:

- يُعد `--bind here` أبسط مسار للمشغّل من أجل "اجعل هذه القناة أو الدردشة مدعومة بـ Codex."
- لا ينشئ `--bind here` child thread.
- يتوفر `--bind here` فقط على القنوات التي تكشف دعم الربط بالمحادثة الحالية.
- لا يمكن جمع `--bind` و`--thread` في الاستدعاء نفسه لـ `/acp spawn`.

## أوضاع spawn الخاصة بالـ thread

يدعم `/acp spawn` الخيار `--thread auto|here|off`.

| الوضع   | السلوك                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | داخل thread نشط: اربط ذلك الـ thread. وخارج thread: أنشئ/اربط child thread عند الدعم. |
| `here` | اشترط وجود thread نشط حالي؛ وافشل إن لم تكن داخله.                                                  |
| `off`  | لا يوجد ربط. تبدأ الجلسة غير مرتبطة.                                                                 |

ملاحظات:

- على الأسطح التي لا تدعم ربط thread، يكون السلوك الافتراضي فعليًا هو `off`.
- يتطلب spawn المرتبط بـ thread دعم سياسة القناة:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية من دون إنشاء child thread.

## عناصر تحكم ACP

عائلة الأوامر المتاحة:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

يعرض `/acp status` خيارات وقت التشغيل الفعالة، وعند توفرها، كلًا من معرّفات الجلسة على مستوى وقت التشغيل وعلى مستوى backend.

تعتمد بعض عناصر التحكم على قدرات backend. وإذا كان backend لا يدعم عنصر تحكم ما، يعيد OpenClaw خطأ واضحًا يفيد بعدم دعم هذا التحكم.

## دليل أوامر ACP

| الأمر              | ما الذي يفعله                                              | المثال                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | أنشئ جلسة ACP؛ مع ربط اختياري بالحالي أو بالـ thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ألغِ الدور الجاري للجلسة المستهدفة.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | أرسل تعليمات توجيه إلى جلسة قيد التشغيل.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | أغلق الجلسة وألغِ ربط أهداف الـ thread.                  | `/acp close`                                                  |
| `/acp status`        | اعرض backend والوضع والحالة وخيارات وقت التشغيل والقدرات. | `/acp status`                                                 |
| `/acp set-mode`      | اضبط وضع وقت التشغيل للجلسة المستهدفة.                      | `/acp set-mode plan`                                          |
| `/acp set`           | كتابة عامة لخيار تكوين وقت التشغيل.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | اضبط تجاوز دليل العمل لوقت التشغيل.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | اضبط ملف تعريف سياسة الموافقة.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | اضبط مهلة وقت التشغيل (بالثواني).                            | `/acp timeout 120`                                            |
| `/acp model`         | اضبط تجاوز نموذج وقت التشغيل.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | أزل تجاوزات خيارات وقت تشغيل الجلسة.                  | `/acp reset-options`                                          |
| `/acp sessions`      | اعرض جلسات ACP الحديثة من المخزن.                      | `/acp sessions`                                               |
| `/acp doctor`        | سلامة backend والقدرات والإصلاحات العملية.           | `/acp doctor`                                                 |
| `/acp install`       | اطبع خطوات التثبيت والتفعيل الحتمية.             | `/acp install`                                                |

يقرأ `/acp sessions` المخزن للجلسة الحالية المرتبطة أو جلسة الطالب. أما الأوامر التي تقبل رموز `session-key` أو `session-id` أو `session-label` فتحل الأهداف عبر اكتشاف جلسات Gateway، بما في ذلك جذور `session.store` المخصصة لكل وكيل.

## ربط خيارات وقت التشغيل

يحتوي `/acp` على أوامر ملائمة بالإضافة إلى مُعيِّن عام.

عمليات مكافئة:

- يربط `/acp model <id>` بمفتاح تكوين وقت التشغيل `model`.
- يربط `/acp permissions <profile>` بمفتاح تكوين وقت التشغيل `approval_policy`.
- يربط `/acp timeout <seconds>` بمفتاح تكوين وقت التشغيل `timeout`.
- يقوم `/acp cwd <path>` بتحديث تجاوز cwd لوقت التشغيل مباشرة.
- يُعد `/acp set <key> <value>` هو المسار العام.
  - حالة خاصة: `key=cwd` يستخدم مسار تجاوز cwd.
- يقوم `/acp reset-options` بمسح جميع تجاوزات وقت التشغيل للجلسة المستهدفة.

## دعم acpx harness (الحالي)

الأسماء المستعارة المضمّنة الحالية لـ acpx harness:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

عندما يستخدم OpenClaw backend من نوع acpx، فضّل هذه القيم لـ `agentId` ما لم يحدد تكوين acpx لديك أسماء مستعارة مخصصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك لا يزال يكشف ACP بوصفه `agent acp`، فقم بتجاوز أمر الوكيل `cursor` في تكوين acpx بدلًا من تغيير القيمة الافتراضية المضمّنة.

يمكن أيضًا لاستخدام acpx CLI المباشر استهداف adapters عشوائية عبر `--agent <command>`، لكن هذا المنفذ الخام هو ميزة في acpx CLI (وليس مسار `agentId` العادي في OpenClaw).

## التكوين المطلوب

الحد الأدنى الأساسي لـ ACP:

```json5
{
  acp: {
    enabled: true,
    // اختياري. الافتراضي true؛ اضبطه false لإيقاف توجيه ACP مؤقتًا مع الإبقاء على عناصر تحكم /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

يكون تكوين ربط thread خاصًا بمحول القناة. مثال لـ Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

إذا لم يعمل ACP spawn المرتبط بـ thread، فتحقق أولًا من إشارة ميزة المحول:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

لا تتطلب ارتباطات المحادثة الحالية إنشاء child-thread. وهي تتطلب سياق محادثة نشطًا ومحول قناة يكشف ارتباطات محادثة ACP.

راجع [مرجع التكوين](/ar/gateway/configuration-reference).

## إعداد Plugin لـ backend من نوع acpx

تشحن عمليات التثبيت الجديدة Plugin وقت التشغيل المضمّن `acpx` مفعّلًا افتراضيًا، لذلك
يعمل ACP عادةً من دون خطوة تثبيت يدوية للـ Plugin.

ابدأ بـ:

```text
/acp doctor
```

إذا عطلت `acpx`، أو رفضته عبر `plugins.allow` / `plugins.deny`، أو كنت تريد
التحول إلى نسخة تطوير محلية، فاستخدم مسار Plugin الصريح:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

تثبيت مساحة العمل المحلية أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقّق من سلامة backend:

```text
/acp doctor
```

### تكوين أمر وإصدار acpx

افتراضيًا، يستخدم Plugin backend المضمّن acpx (`acpx`) الملف الثنائي المحلي المثبّت الخاص بالـ Plugin:

1. يكون الأمر افتراضيًا هو `node_modules/.bin/acpx` المحلي داخل حزمة Plugin ACPX.
2. يكون الإصدار المتوقع افتراضيًا هو الإصدار المثبّت مع الامتداد.
3. يسجل بدء التشغيل ACP backend فورًا بوصفه غير جاهز.
4. تتحقق مهمة ensure في الخلفية من `acpx --version`.
5. إذا كان الملف الثنائي المحلي الخاص بالـ Plugin مفقودًا أو غير مطابق، فينفذ:
   `npm install --omit=dev --no-save acpx@<pinned>` ثم يعيد التحقق.

يمكنك تجاوز الأمر/الإصدار في تكوين Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

ملاحظات:

- يقبل `command` مسارًا مطلقًا أو نسبيًا أو اسم أمر (`acpx`).
- تُحل المسارات النسبية من دليل مساحة عمل OpenClaw.
- يؤدي `expectedVersion: "any"` إلى تعطيل المطابقة الصارمة للإصدار.
- عندما يشير `command` إلى ملف ثنائي/مسار مخصص، يُعطّل التثبيت التلقائي المحلي الخاص بالـ Plugin.
- يظل بدء تشغيل OpenClaw غير حاجب بينما يعمل فحص سلامة backend.

راجع [Plugins](/ar/tools/plugin).

### التثبيت التلقائي للتبعيات

عندما تثبت OpenClaw عالميًا باستخدام `npm install -g openclaw`، تُثبت
تبعيات وقت تشغيل acpx (الملفات الثنائية الخاصة بالمنصة) تلقائيًا
عبر hook بعد التثبيت. وإذا فشل التثبيت التلقائي، يبدأ Gateway مع ذلك
بشكل طبيعي ويبلغ عن التبعية المفقودة عبر `openclaw acp doctor`.

### جسر MCP لأدوات Plugin

افتراضيًا، لا تكشف جلسات ACPX **أدوات OpenClaw المسجلة بواسطة Plugin** إلى
ACP harness.

إذا كنت تريد لوكلاء ACP مثل Codex أو Claude Code أن يستدعوا
أدوات Plugin المثبتة في OpenClaw مثل استرجاع/تخزين الذاكرة، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مضمّنًا باسم `openclaw-plugin-tools` في
  bootstrap جلسة ACPX.
- يكشف أدوات Plugin المسجلة بالفعل بواسطة Plugins OpenClaw المثبتة والمفعلة.
- يُبقي الميزة صريحة ومعطلة افتراضيًا.

ملاحظات الأمان والثقة:

- هذا يوسّع سطح الأدوات المتاح لـ ACP harness.
- يحصل وكلاء ACP على الوصول فقط إلى أدوات Plugin النشطة بالفعل في Gateway.
- تعامل مع هذا على أنه حد الثقة نفسه المتمثل في السماح لتلك Plugins بالتنفيذ داخل
  OpenClaw نفسه.
- راجع Plugins المثبتة قبل تفعيله.

لا تزال `mcpServers` المخصصة تعمل كما في السابق. والجسر المضمّن لأدوات Plugin هو
ميزة إضافية اختيارية للراحة، وليس بديلًا عن التكوين العام لخادم MCP.

### جسر MCP لأدوات OpenClaw

افتراضيًا، لا تكشف جلسات ACPX أيضًا أدوات OpenClaw المضمّنة عبر
MCP. فعّل جسر الأدوات الأساسية المنفصل عندما يحتاج وكيل ACP إلى أدوات
مضمّنة محددة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مضمّنًا باسم `openclaw-tools` في
  bootstrap جلسة ACPX.
- يكشف أدوات OpenClaw المضمّنة المحددة. ويكشف الخادم الأولي الأداة `cron`.
- يُبقي كشف الأدوات الأساسية صريحًا ومعطّلًا افتراضيًا.

### تكوين مهلة وقت التشغيل

يضبط Plugin `acpx` المضمّن مهلة أدوار وقت التشغيل المضمنة افتراضيًا على
120 ثانية. وهذا يمنح harnesses الأبطأ مثل Gemini CLI وقتًا كافيًا لإكمال
بدء تشغيل ACP والتهيئة. تجاوز هذا إذا كان مضيفك يحتاج إلى
حد وقت تشغيل مختلف:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

### تكوين وكيل probe الخاص بالصحة

يفحص Plugin `acpx` المضمّن وكيل harness واحدًا أثناء تحديد ما إذا كان
backend وقت التشغيل المضمّن جاهزًا. والقيمة الافتراضية هي `codex`. وإذا كان نشرُك يستخدم وكيل ACP افتراضيًا مختلفًا، فاضبط وكيل probe على المعرّف نفسه:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

## تكوين الأذونات

تعمل جلسات ACP بشكل غير تفاعلي — فلا توجد TTY للموافقة على مطالبات أذونات كتابة الملفات وتنفيذ shell أو رفضها. ويوفر Plugin acpx مفتاحي تكوين يتحكمان في كيفية التعامل مع الأذونات:

تختلف أذونات ACPX harness هذه عن موافقات exec في OpenClaw وتختلف أيضًا عن إشارات bypass الخاصة بالـ vendor في CLI-backend مثل Claude CLI `--permission-mode bypassPermissions`. وتمثل ACPX `approve-all` مفتاح الحل الأخير على مستوى harness لجلسات ACP.

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل harness تنفيذها من دون طلب.

| القيمة           | السلوك                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | الموافقة التلقائية على جميع عمليات كتابة الملفات وأوامر shell.          |
| `approve-reads` | الموافقة التلقائية على القراءات فقط؛ أما الكتابة وexec فتتطلب prompts. |
| `deny-all`      | رفض جميع مطالبات الأذونات.                              |

### `nonInteractivePermissions`

يتحكم في ما يحدث عندما كان من المفترض عرض مطالبة إذن ولكن لا تتوفر TTY تفاعلية (وهو الحال دائمًا في جلسات ACP).

| القيمة  | السلوك                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | إجهاض الجلسة مع `AcpRuntimeError`. **(الافتراضي)**           |
| `deny` | رفض الإذن بصمت والمتابعة (تدهور رشيق). |

### التكوين

اضبطه عبر تكوين Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل Gateway بعد تغيير هذه القيم.

> **مهم:** يضبط OpenClaw حاليًا افتراضيًا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. وفي جلسات ACP غير التفاعلية، يمكن أن تفشل أي عملية كتابة أو exec تؤدي إلى مطالبة إذن مع الخطأ `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> إذا كنت تحتاج إلى تقييد الأذونات، فاضبط `nonInteractivePermissions` على `deny` حتى تتدهور الجلسات بشكل رشيق بدلًا من الانهيار.

## استكشاف الأخطاء وإصلاحها

| العَرَض                                                                     | السبب المرجح                                                                    | الإصلاح                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend مفقود أو معطّل.                                             | ثبّت Plugin backend وفعّله، ثم شغّل `/acp doctor`.                                                                                                        |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطّل عالميًا.                                                          | اضبط `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | تعطّل التوجيه من رسائل threads العادية.                                  | اضبط `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                                         | استخدم `agentId` مسموحًا أو حدّث `acp.allowedAgents`.                                                                                                              |
| `Unable to resolve session target: ...`                                     | رمز key/id/label غير صالح.                                                         | شغّل `/acp sessions`، وانسخ key/label الدقيق، ثم أعد المحاولة.                                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | استُخدم `--bind here` من دون محادثة نشطة قابلة للربط.                     | انتقل إلى الدردشة/القناة المستهدفة وأعد المحاولة، أو استخدم spawn غير مرتبط.                                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المحول إلى قدرة ربط ACP بالمحادثة الحالية.                      | استخدم `/acp spawn ... --thread ...` حيثما كان مدعومًا، أو اضبط `bindings[]` ذات المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | استُخدم `--thread here` خارج سياق thread.                                  | انتقل إلى thread المستهدف أو استخدم `--thread auto`/`off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | يملك مستخدم آخر هدف الربط النشط.                                    | أعد الربط بصفتك المالك أو استخدم محادثة أو thread مختلفة.                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المحول إلى قدرة ربط thread.                                        | استخدم `--thread off` أو انتقل إلى محول/قناة مدعومين.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | وقت تشغيل ACP على المضيف؛ وجلسة الطالب ضمن sandbox.                       | استخدم `runtime="subagent"` من الجلسات ضمن sandbox، أو نفّذ ACP spawn من جلسة غير ضمن sandbox.                                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | طُلِب `sandbox="require"` لوقت تشغيل ACP.                                  | استخدم `runtime="subagent"` عندما يكون sandbox مطلوبًا، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير ضمن sandbox.                                               |
| Missing ACP metadata for bound session                                      | بيانات وصفية قديمة/محذوفة لجلسة ACP.                                             | أعد الإنشاء عبر `/acp spawn`، ثم أعد الربط/التركيز على thread.                                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | يمنع `permissionMode` عمليات الكتابة/exec في جلسة ACP غير تفاعلية.             | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [تكوين الأذونات](#permission-configuration).                 |
| ACP session fails early with little output                                  | prompts الأذونات محجوبة بواسطة `permissionMode`/`nonInteractivePermissions`. | تحقق من سجلات Gateway بحثًا عن `AcpRuntimeError`. وللحصول على أذونات كاملة، اضبط `permissionMode=approve-all`؛ وللتدهور الرشيق، اضبط `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | انتهت عملية harness لكن جلسة ACP لم تبلغ عن الإكمال.             | راقب باستخدام `ps aux \| grep acpx`؛ واقتل العمليات الراكدة يدويًا.                                                                                                |
