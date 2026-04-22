---
read_when:
    - تشغيل coding harnesses عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة رسائل بجلسة ACP دائمة
    - استكشاف أخطاء ACP backend وتوصيلات Plugin وإصلاحها
    - تصحيح أخطاء تسليم إكمال ACP أو حلقات وكيل-إلى-وكيل
    - تشغيل أوامر /acp من الدردشة
summary: استخدم جلسات وقت التشغيل ACP لـ Codex وClaude Code وCursor وGemini CLI وOpenClaw ACP ووكلاء harness الآخرين
title: وكلاء ACP
x-i18n:
    generated_at: "2026-04-22T04:29:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# وكلاء ACP

تتيح جلسات [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) لـ OpenClaw تشغيل coding harnesses خارجية (مثل Pi وClaude Code وCodex وCursor وCopilot وOpenClaw ACP وOpenCode وGemini CLI وغيرها من harnesses ‏ACPX المدعومة) عبر Plugin ACP backend.

إذا طلبت من OpenClaw بلغة طبيعية "شغّل هذا في Codex" أو "ابدأ Claude Code في thread"، فيجب على OpenClaw توجيه هذا الطلب إلى وقت تشغيل ACP (وليس إلى وقت تشغيل الوكيل الفرعي الأصلي). ويتم تتبع كل عملية spawn لجلسة ACP على أنها [مهمة خلفية](/ar/automation/tasks).

إذا كنت تريد أن يتصل Codex أو Claude Code مباشرةً كعميل MCP خارجي
بمحادثات قنوات OpenClaw الحالية، فاستخدم [`openclaw mcp serve`](/cli/mcp)
بدلًا من ACP.

## أي صفحة أريد؟

توجد ثلاث واجهات متقاربة يسهل الخلط بينها:

| أنت تريد أن...                                                                     | استخدم هذا                              | ملاحظات                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| تشغيل Codex أو Claude Code أو Gemini CLI أو harness خارجي آخر _عبر_ OpenClaw | هذه الصفحة: وكلاء ACP                 | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، والمهام الخلفية، وعناصر التحكم في وقت التشغيل |
| عرض جلسة OpenClaw Gateway _بوصفها_ خادم ACP لمحرر أو عميل      | [`openclaw acp`](/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ACP مع OpenClaw عبر stdio/WebSocket                                          |
| إعادة استخدام AI CLI محلي كنموذج احتياطي نصي فقط                                 | [CLI Backends](/ar/gateway/cli-backends) | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل harness                                             |

## هل يعمل هذا مباشرةً؟

عادةً نعم.

- تشحن التثبيتات الجديدة الآن Plugin وقت التشغيل المجمّع `acpx` مفعّلًا افتراضيًا.
- يفضّل Plugin `acpx` المجمّع الملف التنفيذي `acpx` المثبّت محليًا داخل Plugin.
- عند بدء التشغيل، يفحص OpenClaw هذا الملف التنفيذي ويصلحه ذاتيًا إذا لزم الأمر.
- ابدأ بـ `/acp doctor` إذا كنت تريد فحصًا سريعًا للجاهزية.

ما الذي قد يحدث مع أول استخدام:

- قد يتم جلب محول harness مستهدف عند الطلب باستخدام `npx` في أول مرة تستخدم فيها هذا harness.
- لا تزال مصادقة vendor مطلوبة على المضيف لذلك harness.
- إذا لم يكن لدى المضيف وصول إلى npm/الشبكة، فقد تفشل عمليات جلب المحول في التشغيل الأول إلى أن يتم تسخين cache مسبقًا أو تثبيت المحول بطريقة أخرى.

أمثلة:

- `/acp spawn codex`: يجب أن يكون OpenClaw جاهزًا لتهيئة `acpx`، لكن قد يظل محول Codex ACP بحاجة إلى جلب في التشغيل الأول.
- `/acp spawn claude`: القصة نفسها بالنسبة إلى محول Claude ACP، بالإضافة إلى المصادقة من جانب Claude على ذلك المضيف.

## تدفق تشغيل سريع

استخدم هذا عندما تريد runbook عمليًا لـ `/acp`:

1. أنشئ جلسة:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. اعمل في المحادثة أو thread المرتبطين (أو استهدف مفتاح تلك الجلسة صراحةً).
3. تحقق من حالة وقت التشغيل:
   - `/acp status`
4. اضبط خيارات وقت التشغيل حسب الحاجة:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. ادفع جلسة نشطة دون استبدال السياق:
   - `/acp steer tighten logging and continue`
6. أوقف العمل:
   - `/acp cancel` (إيقاف الدور الحالي)، أو
   - `/acp close` (إغلاق الجلسة + إزالة الارتباطات)

## بدء سريع للبشر

أمثلة على الطلبات الطبيعية:

- "اربط قناة Discord هذه بـ Codex."
- "ابدأ جلسة Codex دائمة في thread هنا وأبقها مركزة."
- "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ولخّص النتيجة."
- "اربط دردشة iMessage هذه بـ Codex وأبقِ المتابعات في مساحة العمل نفسها."
- "استخدم Gemini CLI لهذه المهمة في thread، ثم أبقِ المتابعات في thread نفسه."

ما الذي يجب أن يفعله OpenClaw:

1. يختار `runtime: "acp"`.
2. يحل هدف harness المطلوب (`agentId`، مثل `codex`).
3. إذا كان طلب ربط المحادثة الحالية مطلوبًا وكانت القناة النشطة تدعم ذلك، يربط جلسة ACP بهذه المحادثة.
4. وإلا، إذا كان ربط thread مطلوبًا وكانت القناة الحالية تدعم ذلك، يربط جلسة ACP بالـ thread.
5. يوجّه رسائل المتابعة المرتبطة إلى جلسة ACP نفسها حتى يتم إلغاء التركيز/الإغلاق/انتهاء الصلاحية.

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل harness خارجيًا. واستخدم الوكلاء الفرعيين عندما تريد تشغيلات مفوّضة أصلية في OpenClaw.

| المجال          | جلسة ACP                           | تشغيل وكيل فرعي                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل       | Plugin ACP backend (مثل acpx) | وقت تشغيل الوكيل الفرعي الأصلي في OpenClaw  |
| مفتاح الجلسة   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                            | `/subagents ...`                   |
| أداة spawn    | `sessions_spawn` مع `runtime:"acp"` | `sessions_spawn` (وقت التشغيل الافتراضي) |

راجع أيضًا [الوكلاء الفرعيون](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون الطبقات كالتالي:

1. مستوى التحكم في جلسة OpenClaw ACP
2. Plugin وقت التشغيل المجمّع `acpx`
3. محول Claude ACP
4. آلية وقت التشغيل/الجلسة من جانب Claude

تمييز مهم:

- Claude عبر ACP هو جلسة harness مع عناصر تحكم ACP، واستئناف الجلسة، وتتبع المهام الخلفية، وربط اختياري بالمحادثة/الـ thread.
- أما CLI backends فهي أوقات تشغيل احتياطية محلية منفصلة نصية فقط. راجع [CLI Backends](/ar/gateway/cli-backends).

بالنسبة إلى المشغلين، القاعدة العملية هي:

- إذا كنت تريد `/acp spawn` أو جلسات قابلة للربط أو عناصر تحكم وقت التشغيل أو عمل harness دائمًا: استخدم ACP
- إذا كنت تريد احتياطيًا نصيًا محليًا بسيطًا عبر CLI الخام: استخدم CLI backends

## الجلسات المرتبطة

### ارتباطات المحادثة الحالية

استخدم `/acp spawn <harness> --bind here` عندما تريد أن تصبح المحادثة الحالية مساحة عمل ACP دائمة من دون إنشاء child thread.

السلوك:

- يواصل OpenClaw امتلاك نقل القناة والمصادقة والأمان والتسليم.
- تُثبَّت المحادثة الحالية على مفتاح جلسة ACP المُنشأة.
- تُوجَّه رسائل المتابعة في تلك المحادثة إلى جلسة ACP نفسها.
- يعيد كل من `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` الجلسة ويزيل ربط المحادثة الحالية.

ما الذي يعنيه هذا عمليًا:

- يبقي `--bind here` سطح الدردشة نفسه. في Discord، تبقى القناة الحالية هي القناة الحالية.
- يمكن لـ `--bind here` مع ذلك إنشاء جلسة ACP جديدة إذا كنت تنشئ عملًا جديدًا. يربط هذا الخيار تلك الجلسة بالمحادثة الحالية.
- لا ينشئ `--bind here` child Discord thread أو Telegram topic بمفرده.
- يمكن أن يظل لوقت تشغيل ACP مساحة عمل ملفات خاصة به (`cwd`) أو مساحة عمل على القرص يديرها backend. وهذه مساحة عمل وقت تشغيل منفصلة عن سطح الدردشة ولا تعني وجود thread مراسلة جديد.
- إذا أنشأت جلسة لوكيل ACP مختلف ولم تمرر `--cwd`، فسيورّث OpenClaw مساحة عمل **الوكيل المستهدف** افتراضيًا، وليس مساحة عمل الطالب.
- إذا كان مسار مساحة العمل الموروثة مفقودًا (`ENOENT`/`ENOTDIR`)، فسيعود OpenClaw إلى cwd الافتراضي لـ backend بدلًا من إعادة استخدام الشجرة الخاطئة بصمت.
- إذا كانت مساحة العمل الموروثة موجودة ولكن لا يمكن الوصول إليها (مثل `EACCES`)، فستعيد عملية spawn خطأ الوصول الحقيقي بدلًا من إسقاط `cwd`.

النموذج الذهني:

- سطح الدردشة: حيث يواصل الناس الكلام (`Discord channel`، `Telegram topic`، `iMessage chat`)
- جلسة ACP: حالة وقت تشغيل Codex/Claude/Gemini الدائمة التي يوجّه إليها OpenClaw
- child thread/topic: سطح مراسلة إضافي اختياري يُنشأ فقط بواسطة `--thread ...`
- مساحة عمل وقت التشغيل: موقع نظام الملفات الذي يعمل فيه harness ‏(`cwd`، ونسخة المستودع، ومساحة عمل backend)

أمثلة:

- `/acp spawn codex --bind here`: أبقِ هذه الدردشة، وأنشئ أو اربط جلسة Codex ACP، ووجّه الرسائل المستقبلية هنا إليها
- `/acp spawn codex --thread auto`: قد ينشئ OpenClaw child thread/topic ويربط جلسة ACP هناك
- `/acp spawn codex --bind here --cwd /workspace/repo`: ربط الدردشة نفسه كما أعلاه، لكن Codex يعمل في `/workspace/repo`

دعم ربط المحادثة الحالية:

- يمكن لقنوات الدردشة/الرسائل التي تعلن دعم ربط المحادثة الحالية استخدام `--bind here` عبر مسار ربط المحادثة المشترك.
- لا تزال القنوات ذات semantics الخاصة بالـ thread/topic قادرة على توفير canonicalization خاص بالقناة خلف الواجهة المشتركة نفسها.
- يعني `--bind here` دائمًا "اربط المحادثة الحالية في مكانها".
- تستخدم ارتباطات المحادثة الحالية العامة مخزن الارتباطات المشترك في OpenClaw وتبقى بعد إعادة تشغيل gateway العادية.

ملاحظات:

- الخياران `--bind here` و`--thread ...` متنافيان في `/acp spawn`.
- في Discord، يربط `--bind here` القناة أو الـ thread الحاليين في مكانهما. ولا تكون `spawnAcpSessions` مطلوبة إلا عندما يحتاج OpenClaw إلى إنشاء child thread من أجل `--thread auto|here`.
- إذا لم تكشف القناة النشطة عن ارتباطات ACP للمحادثة الحالية، فسيعيد OpenClaw رسالة واضحة بعدم الدعم.
- أسئلة `resume` و"الجلسة الجديدة" هي أسئلة جلسة ACP، وليست أسئلة قناة. يمكنك إعادة استخدام حالة وقت التشغيل أو استبدالها من دون تغيير سطح الدردشة الحالي.

### الجلسات المرتبطة بالـ thread

عندما تكون ارتباطات thread مفعّلة لمهايئ قناة، يمكن ربط جلسات ACP بالـ threads:

- يربط OpenClaw thread بجلسة ACP مستهدفة.
- تُوجَّه رسائل المتابعة في ذلك الـ thread إلى جلسة ACP المرتبطة.
- يتم تسليم مخرجات ACP مرة أخرى إلى الـ thread نفسه.
- يؤدي إلغاء التركيز/الإغلاق/الأرشفة/انتهاء مهلة الخمول أو انتهاء العمر الأقصى إلى إزالة الربط.

يعتمد دعم ربط thread على المهايئ. وإذا لم يكن مهايئ القناة النشطة يدعم ارتباطات thread، فسيعيد OpenClaw رسالة واضحة بعدم الدعم/عدم التوفر.

إشارات الميزات المطلوبة لربط ACP بالـ thread:

- `acp.enabled=true`
- تكون `acp.dispatch.enabled` مفعلة افتراضيًا (اضبطها على `false` لإيقاف إرسال ACP مؤقتًا)
- تفعيل إشارة spawn الخاصة بـ ACP thread في مهايئ القناة (خاصة بالمهايئ)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### القنوات الداعمة للـ thread

- أي مهايئ قناة يكشف عن إمكانية ربط الجلسة/الـ thread.
- الدعم المضمّن الحالي:
  - Discord threads/channels
  - Telegram topics ‏(forum topics في المجموعات/supergroups وDM topics)
- يمكن لـ Plugins القنوات إضافة الدعم عبر واجهة الربط نفسها.

## إعدادات خاصة بالقناة

بالنسبة إلى سير العمل غير المؤقت، اضبط ارتباطات ACP الدائمة في إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

- يحدد `bindings[].type="acp"` ربط محادثة ACP دائمًا.
- يحدد `bindings[].match` المحادثة المستهدفة:
  - قناة أو thread في Discord: ‏`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: ‏`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/group chat: ‏`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    فضّل `chat_id:*` أو `chat_identifier:*` لارتباطات المجموعات المستقرة.
  - iMessage DM/group chat: ‏`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    فضّل `chat_id:*` لارتباطات المجموعات المستقرة.
- `bindings[].agentId` هو معرّف وكيل OpenClaw المالك.
- توجد تجاوزات ACP الاختيارية تحت `bindings[].acp`:
  - `mode` ‏(`persistent` أو `oneshot`)
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

ترتيب أولوية التجاوز للجلسات المرتبطة بـ ACP:

1. ‏`bindings[].acp.*`
2. ‏`agents.list[].runtime.acp.*`
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

- يضمن OpenClaw وجود جلسة ACP المُعدّة قبل استخدامها.
- تُوجَّه الرسائل في تلك القناة أو الموضوع إلى جلسة ACP المُعدّة.
- في المحادثات المرتبطة، يعيد كل من `/new` و`/reset` تعيين مفتاح جلسة ACP نفسه في مكانه.
- تظل ارتباطات وقت التشغيل المؤقتة (مثل تلك التي تنشئها تدفقات thread-focus) سارية حيثما وُجدت.
- بالنسبة إلى عمليات spawn عبر الوكلاء لـ ACP من دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل المستهدف من إعدادات الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى cwd الافتراضي لـ backend؛ أما حالات فشل الوصول إلى المسارات الموجودة فتظهر كأخطاء spawn.

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
- إذا حُذف `agentId`، يستخدم OpenClaw القيمة `acp.defaultAgent` عند إعدادها.
- يتطلب `mode: "session"` أن تكون `thread: true` للإبقاء على محادثة مرتبطة دائمة.

تفاصيل الواجهة:

- `task` (مطلوب): الـ prompt الأولي المُرسل إلى جلسة ACP.
- `runtime` (مطلوب لـ ACP): يجب أن يكون `"acp"`.
- `agentId` (اختياري): معرّف harness المستهدف لـ ACP. ويعود إلى `acp.defaultAgent` إذا تم ضبطه.
- `thread` (اختياري، الافتراضي `false`): طلب تدفق ربط thread حيثما كان مدعومًا.
- `mode` (اختياري): ‏`run` (مرة واحدة) أو `session` (دائم).
  - الافتراضي هو `run`
  - إذا كانت `thread: true` وتم حذف mode، فقد يضبط OpenClaw افتراضيًا سلوكًا دائمًا بحسب مسار وقت التشغيل
  - يتطلب `mode: "session"` أن تكون `thread: true`
- `cwd` (اختياري): دليل العمل المطلوب لوقت التشغيل (تتحقق منه سياسة backend/runtime). وإذا حُذف، فإن ACP spawn يرث مساحة عمل الوكيل المستهدف عند إعدادها؛ وتعود المسارات الموروثة المفقودة إلى القيم الافتراضية لـ backend، بينما تُعاد أخطاء الوصول الحقيقية.
- `label` (اختياري): تسمية موجهة للمشغل تُستخدم في نص الجلسة/الشعار.
- `resumeSessionId` (اختياري): استئناف جلسة ACP موجودة بدلًا من إنشاء جلسة جديدة. يعيد الوكيل تشغيل سجل محادثته عبر `session/load`. يتطلب `runtime: "acp"`.
- `streamTo` (اختياري): ‏`"parent"` يبث ملخصات تقدم تشغيل ACP الأولي مرة أخرى إلى جلسة الطالب كأحداث نظام.
  - عند توفره، تتضمن الردود المقبولة `streamLogPath` يشير إلى سجل JSONL ضمن نطاق الجلسة (`<sessionId>.acp-stream.jsonl`) يمكنك متابعته للحصول على السجل الكامل للترحيل.

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو أعمالًا خلفية يملكها الأب. ويعتمد مسار التسليم على هذا الشكل.

### جلسات ACP التفاعلية

الجلسات التفاعلية مخصصة لمواصلة الحديث على سطح دردشة مرئي:

- يقوم `/acp spawn ... --bind here` بربط المحادثة الحالية بجلسة ACP.
- يقوم `/acp spawn ... --thread ...` بربط channel thread/topic بجلسة ACP.
- تقوم `bindings[].type="acp"` الدائمة المُعدّة بتوجيه المحادثات المطابقة إلى جلسة ACP نفسها.

تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى جلسة ACP، وتُسلَّم مخرجات ACP مرة أخرى إلى القناة/الـ thread/الموضوع نفسه.

### جلسات ACP لمرة واحدة يملكها الأب

تكون جلسات ACP لمرة واحدة التي يُنشئها تشغيل وكيل آخر أبناءً خلفيين، شبيهةً بالوكلاء الفرعيين:

- يطلب الأب العمل باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
- يعمل الابن في جلسة harness ‏ACP خاصة به.
- تُبلّغ النتيجة عبر مسار الإعلان الداخلي عن اكتمال المهمة.
- يعيد الأب صياغة نتيجة الابن بصوت المساعد العادي عندما يكون الرد المواجه للمستخدم مفيدًا.

لا تتعامل مع هذا المسار على أنه دردشة نظير إلى نظير بين الأب والابن. فالابن لديه بالفعل قناة إكمال عائدة إلى الأب.

### `sessions_send` وتسليم A2A

يمكن لـ `sessions_send` استهداف جلسة أخرى بعد spawn. بالنسبة إلى الجلسات النظيرة العادية، يستخدم OpenClaw مسار متابعة وكيل-إلى-وكيل (A2A) بعد حقن الرسالة:

- انتظار رد الجلسة المستهدفة
- السماح اختياريًا للطالب والهدف بتبادل عدد محدود من أدوار المتابعة
- مطالبة الهدف بإنتاج رسالة إعلان
- تسليم هذا الإعلان إلى القناة أو الـ thread المرئي

يُعد مسار A2A هذا احتياطيًا لعمليات الإرسال بين الجلسات النظيرة حيث يحتاج المرسل إلى متابعة مرئية. ويظل مفعّلًا عندما تتمكن جلسة غير مرتبطة من رؤية هدف ACP وإرسال الرسائل إليه، مثلًا ضمن إعدادات `tools.sessions.visibility` الواسعة.

يتجاوز OpenClaw متابعة A2A فقط عندما يكون الطالب هو الأب لابنه لمرة واحدة المملوك له. ففي هذه الحالة، قد يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأب بنتيجة الابن، وتمرير رد الأب مرة أخرى إلى الابن، وإنشاء حلقة صدى بين الأب/الابن. وتبلّغ نتيجة `sessions_send` عن `delivery.status="skipped"` في حالة الابن المملوك هذه لأن مسار الإكمال مسؤول بالفعل عن النتيجة.

### استئناف جلسة موجودة

استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر `session/load`، لذلك يستكمل العمل مع السياق الكامل لما سبق.

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
- متابعة جلسة برمجة بدأتها تفاعليًا في CLI، والآن بلا واجهة عبر وكيلك
- متابعة عمل انقطع بسبب إعادة تشغيل gateway أو انتهاء مهلة الخمول

ملاحظات:

- يتطلب `resumeSessionId` القيمة `runtime: "acp"` — ويُرجع خطأ إذا استُخدم مع وقت تشغيل الوكيل الفرعي.
- يستعيد `resumeSessionId` سجل محادثة ACP upstream؛ وما تزال `thread` و`mode` تنطبقان بشكل طبيعي على جلسة OpenClaw الجديدة التي تنشئها، لذا فإن `mode: "session"` ما تزال تتطلب `thread: true`.
- يجب أن يدعم الوكيل المستهدف `session/load` (ويدعمه كل من Codex وClaude Code).
- إذا لم يتم العثور على معرّف الجلسة، تفشل عملية spawn بخطأ واضح — من دون عودة صامتة إلى جلسة جديدة.

### اختبار smoke للمشغّل

استخدم هذا بعد نشر gateway عندما تريد فحصًا مباشرًا سريعًا يؤكد أن ACP spawn
تعمل فعليًا من طرف إلى طرف، وليس فقط أنها تجتاز اختبارات الوحدة.

البوابة الموصى بها:

1. تحقق من إصدار/commit الـ gateway المنشور على المضيف المستهدف.
2. أكد أن المصدر المنشور يتضمن قبول lineage الخاص بـ ACP في
   `src/gateway/sessions-patch.ts` ‏(`subagent:* or acp:* sessions`).
3. افتح جلسة جسر ACPX مؤقتة لوكيل مباشر (مثل
   `razor(main)` على `jpclawhq`).
4. اطلب من ذلك الوكيل استدعاء `sessions_spawn` باستخدام:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - المهمة: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. تحقق من أن الوكيل يبلّغ بما يلي:
   - `accepted=yes`
   - قيمة `childSessionKey` حقيقية
   - عدم وجود خطأ validator
6. نظّف جلسة جسر ACPX المؤقتة.

مثال على prompt للوكيل المباشر:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

ملاحظات:

- أبقِ اختبار smoke هذا على `mode: "run"` ما لم تكن تختبر عمدًا
  جلسات ACP الدائمة المرتبطة بالـ thread.
- لا تشترط `streamTo: "parent"` للبوابة الأساسية. فهذا المسار يعتمد على
  إمكانيات الطالب/الجلسة وهو فحص تكامل منفصل.
- تعامل مع اختبار `mode: "session"` المرتبط بالـ thread بوصفه
  تمريرة تكامل ثانية وأغنى من Discord thread أو Telegram topic حقيقيين.

## التوافق مع Sandbox

تعمل جلسات ACP حاليًا على وقت تشغيل المضيف، وليس داخل sandbox الخاصة بـ OpenClaw.

القيود الحالية:

- إذا كانت جلسة الطالب داخل sandbox، يتم حظر ACP spawns لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
  - الخطأ: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- لا يدعم `sessions_spawn` مع `runtime: "acp"` القيمة `sandbox: "require"`.
  - الخطأ: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

استخدم `runtime: "subagent"` عندما تحتاج إلى تنفيذ مفروض بواسطة sandbox.

### من أمر `/acp`

استخدم `/acp spawn` للتحكم الصريح من المشغّل من داخل الدردشة عند الحاجة.

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

راجع [Slash Commands](/ar/tools/slash-commands).

## تحليل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key` أو `session-id` أو `session-label`).

ترتيب التحليل:

1. وسيطة الهدف الصريحة (أو `--session` لأجل `/acp steer`)
   - يحاول المفتاح أولًا
   - ثم معرّف الجلسة بشكل UUID
   - ثم التسمية
2. ربط الـ thread الحالي (إذا كانت هذه المحادثة/الـ thread مرتبطة بجلسة ACP)
3. الاحتياطي إلى جلسة الطالب الحالية

تشارك ارتباطات المحادثة الحالية وارتباطات الـ thread كلاهما في الخطوة 2.

إذا لم يتم تحليل أي هدف، يعيد OpenClaw خطأ واضحًا (`Unable to resolve session target: ...`).

## أوضاع ربط spawn

يدعم `/acp spawn` الخيار `--bind here|off`.

| الوضع   | السلوك                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | ربط المحادثة النشطة الحالية في مكانها؛ والفشل إذا لم تكن هناك محادثة نشطة. |
| `off`  | عدم إنشاء ربط للمحادثة الحالية.                          |

ملاحظات:

- يُعد `--bind here` أبسط مسار تشغيلي لعبارة "اجعل هذه القناة أو الدردشة مدعومة بواسطة Codex."
- لا ينشئ `--bind here` child thread.
- لا يتوفر `--bind here` إلا على القنوات التي تكشف عن دعم ربط المحادثة الحالية.
- لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

## أوضاع spawn للـ thread

يدعم `/acp spawn` الخيار `--thread auto|here|off`.

| الوضع   | السلوك                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | داخل thread نشط: اربط ذلك الـ thread. وخارج thread: أنشئ/اربط child thread عند الدعم. |
| `here` | اشترط وجود thread نشط حالي؛ وافشل إذا لم تكن داخله.                                                  |
| `off`  | بلا ربط. تبدأ الجلسة غير مرتبطة.                                                                 |

ملاحظات:

- على الأسطح التي لا تدعم ربط thread، يكون السلوك الافتراضي فعليًا هو `off`.
- يتطلب spawn المرتبط بالـ thread دعم سياسة القناة:
  - Discord: ‏`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: ‏`channels.telegram.threadBindings.spawnAcpSessions=true`
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

يعرض `/acp status` خيارات وقت التشغيل الفعلية، وعند التوفر، كلًا من معرّفات الجلسات على مستوى وقت التشغيل وعلى مستوى backend.

تعتمد بعض عناصر التحكم على إمكانيات backend. وإذا كان backend لا يدعم عنصر تحكم ما، يعيد OpenClaw خطأ واضحًا بعدم دعم عنصر التحكم.

## كتاب وصفات أوامر ACP

| الأمر              | ما الذي يفعله                                              | مثال                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | إنشاء جلسة ACP؛ مع ربط حالي اختياري أو ربط thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | إلغاء الدور الجاري للجلسة المستهدفة.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | إرسال توجيه steer إلى الجلسة العاملة.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | إغلاق الجلسة وإلغاء ربط أهداف thread.                  | `/acp close`                                                  |
| `/acp status`        | إظهار backend والوضع والحالة وخيارات وقت التشغيل والإمكانيات. | `/acp status`                                                 |
| `/acp set-mode`      | ضبط وضع وقت التشغيل للجلسة المستهدفة.                      | `/acp set-mode plan`                                          |
| `/acp set`           | كتابة خيار إعداد عام لوقت التشغيل.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ضبط تجاوز دليل العمل لوقت التشغيل.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ضبط ملف تعريف سياسة الموافقة.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | ضبط مهلة وقت التشغيل (بالثواني).                            | `/acp timeout 120`                                            |
| `/acp model`         | ضبط تجاوز نموذج وقت التشغيل.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | إزالة تجاوزات خيارات وقت تشغيل الجلسة.                  | `/acp reset-options`                                          |
| `/acp sessions`      | سرد جلسات ACP الحديثة من المخزن.                      | `/acp sessions`                                               |
| `/acp doctor`        | صحة backend، والإمكانيات، والإصلاحات القابلة للتنفيذ.           | `/acp doctor`                                                 |
| `/acp install`       | طباعة خطوات تثبيت وتمكين حتمية.             | `/acp install`                                                |

يقرأ `/acp sessions` المخزن للجلسة الحالية المرتبطة أو جلسة الطالب الحالية. وتقوم الأوامر التي تقبل رموز `session-key` أو `session-id` أو `session-label` بتحليل الأهداف عبر اكتشاف جلسات gateway، بما في ذلك جذور `session.store` المخصصة لكل وكيل.

## ربط خيارات وقت التشغيل

يحتوي `/acp` على أوامر راحة ومُعدّ عام.

العمليات المكافئة:

- يطابق `/acp model <id>` مفتاح إعداد وقت التشغيل `model`.
- يطابق `/acp permissions <profile>` مفتاح إعداد وقت التشغيل `approval_policy`.
- يطابق `/acp timeout <seconds>` مفتاح إعداد وقت التشغيل `timeout`.
- يحدّث `/acp cwd <path>` تجاوز cwd لوقت التشغيل مباشرةً.
- يُعد `/acp set <key> <value>` المسار العام.
  - حالة خاصة: يستخدم `key=cwd` مسار تجاوز cwd.
- يقوم `/acp reset-options` بمسح جميع تجاوزات وقت التشغيل للجلسة المستهدفة.

## دعم harness ‏acpx (الحالي)

الأسماء المستعارة المضمّنة الحالية لـ harness في acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` ‏(Cursor CLI: ‏`cursor-agent acp`)
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

عندما يستخدم OpenClaw backend ‏acpx، ففضّل هذه القيم لـ `agentId` ما لم تكن إعدادات acpx لديك تعرّف أسماء مستعارة مخصصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك ما يزال يكشف ACP على أنه `agent acp`، فقم بتجاوز أمر الوكيل `cursor` في إعدادات acpx بدلًا من تغيير القيمة الافتراضية المضمّنة.

يمكن لاستخدام acpx CLI المباشر أيضًا استهداف محولات اعتباطية عبر `--agent <command>`، لكن منفذ الهروب الخام هذا هو ميزة خاصة بـ acpx CLI (وليس مسار `agentId` العادي في OpenClaw).

## الإعدادات المطلوبة

الخط الأساسي لـ ACP في core:

```json5
{
  acp: {
    enabled: true,
    // اختياري. الافتراضي هو true؛ اضبطه على false لإيقاف إرسال ACP مؤقتًا مع الإبقاء على عناصر التحكم /acp.
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

إعداد ربط thread خاص بمهايئ القناة. مثال لـ Discord:

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

إذا لم يعمل spawn المرتبط بالـ thread في ACP، فتحقق أولًا من إشارة ميزة المهايئ:

- Discord: ‏`channels.discord.threadBindings.spawnAcpSessions=true`

لا تتطلب ارتباطات المحادثة الحالية إنشاء child thread. وهي تتطلب سياق محادثة نشطًا ومهايئ قناة يكشف عن ارتباطات محادثات ACP.

راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعداد Plugin لـ backend ‏acpx

تشحن التثبيتات الجديدة Plugin وقت التشغيل المجمّع `acpx` مفعّلًا افتراضيًا، لذا فإن ACP
تعمل عادةً من دون خطوة تثبيت Plugin يدوية.

ابدأ بـ:

```text
/acp doctor
```

إذا عطّلت `acpx`، أو منعتها عبر `plugins.allow` / `plugins.deny`، أو كنت تريد
التحويل إلى checkout تطوير محلي، فاستخدم مسار Plugin الصريح:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

تثبيت مساحة عمل محلية أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقق من صحة backend:

```text
/acp doctor
```

### إعدادات أمر وإصدار acpx

افتراضيًا، يستخدم Plugin backend ‏acpx المجمّع (`acpx`) الملف التنفيذي المثبّت محليًا داخل Plugin:

1. يكون الأمر افتراضيًا هو `node_modules/.bin/acpx` المحلي داخل حزمة Plugin ‏ACPX.
2. يكون الإصدار المتوقع افتراضيًا هو pin الخاص بالامتداد.
3. يسجّل بدء التشغيل ACP backend فورًا على أنها غير جاهزة.
4. تتحقق مهمة ensure في الخلفية من `acpx --version`.
5. إذا كان الملف التنفيذي المحلي داخل Plugin مفقودًا أو غير مطابق، فإنه يشغّل:
   `npm install --omit=dev --no-save acpx@<pinned>` ثم يعيد التحقق.

يمكنك تجاوز الأمر/الإصدار في إعداد Plugin:

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

- يقبل `command` مسارًا مطلقًا أو مسارًا نسبيًا أو اسم أمر (`acpx`).
- تُحلّ المسارات النسبية من دليل مساحة عمل OpenClaw.
- يؤدي `expectedVersion: "any"` إلى تعطيل المطابقة الصارمة للإصدار.
- عندما يشير `command` إلى ملف تنفيذي/مسار مخصص، يتم تعطيل التثبيت التلقائي المحلي داخل Plugin.
- يظل بدء تشغيل OpenClaw غير حاجز أثناء تشغيل فحص صحة backend.

راجع [Plugins](/ar/tools/plugin).

### التثبيت التلقائي للاعتماديات

عندما تثبّت OpenClaw عالميًا باستخدام `npm install -g openclaw`، تُثبَّت
اعتماديات وقت تشغيل acpx (الملفات التنفيذية الخاصة بكل منصة) تلقائيًا
عبر hook لما بعد التثبيت. وإذا فشل التثبيت التلقائي، يظل gateway يبدأ
بشكل طبيعي ويبلّغ عن الاعتمادية المفقودة عبر `openclaw acp doctor`.

### جسر MCP لأدوات Plugin

افتراضيًا، لا تكشف جلسات ACPX **أدوات OpenClaw المسجلة بواسطة Plugin** إلى
ACP harness.

إذا كنت تريد أن تستدعي وكلاء ACP مثل Codex أو Claude Code
أدوات Plugin المثبتة في OpenClaw مثل memory recall/store، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مدمجًا باسم `openclaw-plugin-tools` في
  تهيئة جلسة ACPX.
- يكشف أدوات Plugin المسجلة بالفعل بواسطة Plugins OpenClaw المثبتة
  والمفعّلة.
- يبقي الميزة صريحة ومعطلة افتراضيًا.

ملاحظات الأمان والثقة:

- يوسّع هذا سطح أدوات ACP harness.
- يحصل وكلاء ACP على وصول فقط إلى أدوات Plugin النشطة بالفعل في gateway.
- تعامل مع هذا على أنه حد الثقة نفسه كما لو سمحت لتلك Plugins بالتنفيذ داخل
  OpenClaw نفسه.
- راجع Plugins المثبتة قبل تفعيله.

لا تزال `mcpServers` المخصصة تعمل كما كانت. والجسر المدمج لأدوات Plugin هو
وسيلة راحة اختيارية إضافية، وليس بديلًا عن إعداد خادم MCP العام.

### إعدادات مهلة وقت التشغيل

يضبط Plugin ‏`acpx` المجمّع أدوار وقت التشغيل المضمنة افتراضيًا على مهلة
مدتها 120 ثانية. وهذا يمنح harnesses الأبطأ مثل Gemini CLI وقتًا كافيًا لإكمال
بدء تشغيل ACP والتهيئة. ويمكنك تجاوزها إذا كان المضيف لديك يحتاج إلى
حد وقت تشغيل مختلف:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

أعد تشغيل gateway بعد تغيير هذه القيمة.

### إعدادات وكيل فحص الصحة

يفحص Plugin ‏`acpx` المجمّع وكيل harness واحدًا أثناء تحديد ما إذا كان
وقت تشغيل backend المضمن جاهزًا. وتكون القيمة الافتراضية هي `codex`. وإذا كان النشر لديك يستخدم وكيل ACP افتراضيًا مختلفًا، فاضبط وكيل الفحص على المعرف نفسه:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل gateway بعد تغيير هذه القيمة.

## إعداد الأذونات

تعمل جلسات ACP بلا تفاعل — فلا توجد TTY للموافقة على مطالبات أذونات كتابة الملفات وتنفيذ shell أو رفضها. ويوفر Plugin ‏acpx مفتاحي إعداد يتحكمان في كيفية التعامل مع الأذونات:

تكون أذونات ACPX harness هذه منفصلة عن موافقات exec في OpenClaw ومنفصلة عن إشارات bypass الخاصة بالـ vendor في CLI backend مثل Claude CLI ‏`--permission-mode bypassPermissions`. ويُعد ACPX ‏`approve-all` مفتاح break-glass على مستوى harness لجلسات ACP.

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل harness تنفيذها من دون مطالبة.

| القيمة           | السلوك                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | الموافقة التلقائية على جميع عمليات كتابة الملفات وأوامر shell.          |
| `approve-reads` | الموافقة التلقائية على عمليات القراءة فقط؛ أما الكتابة والتنفيذ فتتطلب مطالبات. |
| `deny-all`      | رفض جميع مطالبات الأذونات.                              |

### `nonInteractivePermissions`

يتحكم في ما يحدث عندما كان ينبغي عرض مطالبة أذونات ولكن لا توجد TTY تفاعلية متاحة (وهو الحال دائمًا في جلسات ACP).

| القيمة  | السلوك                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | إجهاض الجلسة مع `AcpRuntimeError`. **(افتراضي)**           |
| `deny` | رفض الإذن بصمت والمتابعة (تدرج سلس). |

### الإعداد

يتم الضبط عبر إعداد Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل gateway بعد تغيير هذه القيم.

> **مهم:** يستخدم OpenClaw حاليًا القيم الافتراضية `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. في جلسات ACP غير التفاعلية، قد تفشل أي عملية كتابة أو تنفيذ تؤدي إلى مطالبة أذونات برسالة `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> إذا كنت تحتاج إلى تقييد الأذونات، فاضبط `nonInteractivePermissions` على `deny` حتى تتدرج الجلسات بسلاسة بدلًا من أن تتعطل.

## استكشاف الأخطاء وإصلاحها

| العرض                                                                     | السبب المحتمل                                                                    | الإصلاح                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend مفقود أو معطل.                                             | ثبّت Plugin backend وفعّله، ثم شغّل `/acp doctor`.                                                                                                        |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطل عالميًا.                                                          | اضبط `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | إرسال الرسائل من رسائل thread العادية معطل.                                  | اضبط `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل ليس في قائمة السماح.                                                         | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                              |
| `Unable to resolve session target: ...`                                     | رمز key/id/label غير صحيح.                                                         | شغّل `/acp sessions`، وانسخ المفتاح/التسمية المطابقين تمامًا، ثم أعد المحاولة.                                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | تم استخدام `--bind here` من دون محادثة نشطة قابلة للربط.                     | انتقل إلى الدردشة/القناة المستهدفة وأعد المحاولة، أو استخدم spawn غير مرتبط.                                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المهايئ إلى إمكانية ربط محادثات ACP الحالية.                      | استخدم `/acp spawn ... --thread ...` حيثما كان مدعومًا، أو اضبط `bindings[]` ذات المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | تم استخدام `--thread here` خارج سياق thread.                                  | انتقل إلى الـ thread المستهدف أو استخدم `--thread auto`/`off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | يملك مستخدم آخر هدف الربط النشط.                                    | أعد الربط بصفتك المالك أو استخدم محادثة أو thread مختلفًا.                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المهايئ إلى إمكانية ربط thread.                                        | استخدم `--thread off` أو انتقل إلى مهايئ/قناة مدعومة.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | وقت تشغيل ACP على جانب المضيف؛ جلسة الطالب داخل sandbox.                       | استخدم `runtime="subagent"` من الجلسات داخل sandbox، أو شغّل ACP spawn من جلسة خارج sandbox.                                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | تم طلب `sandbox="require"` لوقت تشغيل ACP.                                  | استخدم `runtime="subagent"` عندما تكون sandbox مطلوبة، أو استخدم ACP مع `sandbox="inherit"` من جلسة خارج sandbox.                                               |
| بيانات ACP الوصفية مفقودة للجلسة المرتبطة                                      | بيانات وصفية ACP قديمة/محذوفة للجلسة.                                             | أعد الإنشاء باستخدام `/acp spawn`، ثم أعد الربط/التركيز على الـ thread.                                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | تقوم `permissionMode` بحظر الكتابة/التنفيذ في جلسة ACP غير تفاعلية.             | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل gateway. راجع [إعداد الأذونات](#permission-configuration).                 |
| تفشل جلسة ACP مبكرًا مع مخرجات قليلة                                  | يتم حظر مطالبات الأذونات بواسطة `permissionMode`/`nonInteractivePermissions`. | تحقق من سجلات gateway بحثًا عن `AcpRuntimeError`. للحصول على أذونات كاملة، اضبط `permissionMode=approve-all`؛ وللتدرج السلس، اضبط `nonInteractivePermissions=deny`. |
| تتعطل جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                       | انتهت عملية harness لكن جلسة ACP لم تبلغ عن الإكمال.             | راقب باستخدام `ps aux \| grep acpx`؛ واقتل العمليات القديمة يدويًا.                                                                                                |
