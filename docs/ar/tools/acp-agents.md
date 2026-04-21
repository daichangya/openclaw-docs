---
read_when:
    - تشغيل أدوات تسخير البرمجة عبر ACP
    - إعداد جلسات ACP مرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة مراسلة بجلسة ACP دائمة
    - استكشاف أخطاء الواجهة الخلفية لـ ACP وربط Plugin وإصلاحها
    - تشغيل أوامر /acp من الدردشة
summary: استخدم جلسات تشغيل ACP لكل من Codex وClaude Code وCursor وGemini CLI وOpenClaw ACP ووكلاء التسخير الآخرين
title: وكلاء ACP
x-i18n:
    generated_at: "2026-04-21T13:35:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# وكلاء ACP

تتيح جلسات [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) لـ OpenClaw تشغيل أدوات تسخير برمجة خارجية (مثل Pi وClaude Code وCodex وCursor وCopilot وOpenClaw ACP وOpenCode وGemini CLI وغيرها من أدوات تسخير ACPX المدعومة) عبر Plugin واجهة خلفية لـ ACP.

إذا طلبت من OpenClaw بلغة طبيعية "شغّل هذا في Codex" أو "ابدأ Claude Code في سلسلة نقاش"، فيجب على OpenClaw توجيه هذا الطلب إلى وقت تشغيل ACP (وليس وقت تشغيل الوكيل الفرعي الأصلي). يتم تتبع كل عملية إنشاء جلسة ACP باعتبارها [مهمة في الخلفية](/ar/automation/tasks).

إذا كنت تريد أن يتصل Codex أو Claude Code مباشرةً بصفته عميل MCP خارجيًا
بمحادثات قنوات OpenClaw الحالية، فاستخدم [`openclaw mcp serve`](/cli/mcp)
بدلًا من ACP.

## أي صفحة أريد؟

توجد ثلاثة أسطح قريبة يسهل الخلط بينها:

| تريد أن... | استخدم هذا | ملاحظات |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| تشغيل Codex أو Claude Code أو Gemini CLI أو أداة تسخير خارجية أخرى _عبر_ OpenClaw | هذه الصفحة: وكلاء ACP                 | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام الخلفية، وعناصر تحكم وقت التشغيل |
| عرض جلسة OpenClaw Gateway _كـ_ خادم ACP لمحرر أو عميل | [`openclaw acp`](/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ACP إلى OpenClaw عبر stdio/WebSocket |
| إعادة استخدام AI CLI محلي كنموذج احتياطي نصي فقط | [واجهات CLI الخلفية](/ar/gateway/cli-backends) | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل أداة التسخير |

## هل يعمل هذا مباشرةً دون إعداد إضافي؟

عادةً نعم.

- تأتي عمليات التثبيت الجديدة الآن مع تفعيل Plugin وقت التشغيل المضمّن `acpx` افتراضيًا.
- يفضّل Plugin ‏`acpx` المضمّن ملفه التنفيذي `acpx` المثبّت محليًا داخل Plugin.
- عند بدء التشغيل، يفحص OpenClaw هذا الملف التنفيذي ويصلحه ذاتيًا إذا لزم الأمر.
- ابدأ بـ `/acp doctor` إذا أردت فحصًا سريعًا للجاهزية.

ما الذي قد يحدث مع ذلك عند أول استخدام:

- قد يتم جلب محوّل أداة التسخير المستهدفة عند الطلب باستخدام `npx` في أول مرة تستخدم فيها تلك الأداة.
- يجب أن تكون مصادقة المورّد موجودة على المضيف لتلك الأداة.
- إذا لم يكن لدى المضيف وصول إلى npm/الشبكة، فقد يفشل جلب المحوّل في أول تشغيل إلى أن يتم تسخين الذاكرات المؤقتة مسبقًا أو تثبيت المحوّل بطريقة أخرى.

أمثلة:

- `/acp spawn codex`: يجب أن يكون OpenClaw جاهزًا لتهيئة `acpx`، لكن قد يظل محوّل Codex ACP بحاجة إلى جلب في أول تشغيل.
- `/acp spawn claude`: نفس الأمر بالنسبة إلى محوّل Claude ACP، بالإضافة إلى مصادقة Claude على ذلك المضيف.

## تدفق عمل سريع للمشغّل

استخدم هذا عندما تريد دليلاً عمليًا لأوامر `/acp`:

1. أنشئ جلسة:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. اعمل في المحادثة أو سلسلة النقاش المرتبطة (أو استهدف مفتاح تلك الجلسة صراحةً).
3. تحقّق من حالة وقت التشغيل:
   - `/acp status`
4. اضبط خيارات وقت التشغيل حسب الحاجة:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. وجّه جلسة نشطة دون استبدال السياق:
   - `/acp steer tighten logging and continue`
6. أوقف العمل:
   - `/acp cancel` (إيقاف الدور الحالي)، أو
   - `/acp close` (إغلاق الجلسة + إزالة الارتباطات)

## بدء سريع للبشر

أمثلة على طلبات طبيعية:

- "اربط قناة Discord هذه بـ Codex."
- "ابدأ جلسة Codex دائمة في سلسلة نقاش هنا وأبقها مركّزة."
- "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ثم لخّص النتيجة."
- "اربط دردشة iMessage هذه بـ Codex وأبقِ المتابعات في مساحة العمل نفسها."
- "استخدم Gemini CLI لهذه المهمة في سلسلة نقاش، ثم أبقِ المتابعات في سلسلة النقاش نفسها."

ما الذي يجب على OpenClaw فعله:

1. اختيار `runtime: "acp"`.
2. حل هدف أداة التسخير المطلوبة (`agentId`، مثلًا `codex`).
3. إذا كان طلب الربط بالمحادثة الحالية مطلوبًا وكانت القناة النشطة تدعمه، اربط جلسة ACP بتلك المحادثة.
4. بخلاف ذلك، إذا كان ربط سلسلة النقاش مطلوبًا وكانت القناة الحالية تدعمه، اربط جلسة ACP بسلسلة النقاش.
5. وجّه رسائل المتابعة المرتبطة إلى جلسة ACP نفسها إلى أن يتم إلغاء التركيز عليها أو إغلاقها أو انتهاء صلاحيتها.

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل لأداة تسخير خارجية. واستخدم الوكلاء الفرعيين عندما تريد تشغيلات مفوّضة أصلية في OpenClaw.

| المجال | جلسة ACP | تشغيل وكيل فرعي |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل | Plugin واجهة خلفية لـ ACP (مثل acpx) | وقت تشغيل الوكيل الفرعي الأصلي في OpenClaw |
| مفتاح الجلسة | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                            | `/subagents ...`                   |
| أداة الإنشاء | `sessions_spawn` مع `runtime:"acp"` | `sessions_spawn` (وقت التشغيل الافتراضي) |

راجع أيضًا [الوكلاء الفرعيون](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون البنية كما يلي:

1. مستوى التحكم في جلسات OpenClaw ACP
2. Plugin وقت التشغيل المضمّن `acpx`
3. محوّل Claude ACP
4. آلية وقت التشغيل/الجلسة الخاصة بـ Claude

تمييز مهم:

- Claude عبر ACP هو جلسة أداة تسخير تتضمن عناصر تحكم ACP، واستئناف الجلسة، وتتبع مهام الخلفية، وربطًا اختياريًا بالمحادثة/سلسلة النقاش.
- واجهات CLI الخلفية هي أوقات تشغيل محلية احتياطية منفصلة نصية فقط. راجع [واجهات CLI الخلفية](/ar/gateway/cli-backends).

بالنسبة إلى المشغّلين، القاعدة العملية هي:

- إذا كنت تريد `/acp spawn`، أو جلسات قابلة للربط، أو عناصر تحكم وقت التشغيل، أو عمل أداة تسخير دائمًا: استخدم ACP
- إذا كنت تريد احتياطيًا نصيًا محليًا بسيطًا عبر CLI الخام: استخدم واجهات CLI الخلفية

## الجلسات المرتبطة

### الارتباطات بالمحادثة الحالية

استخدم `/acp spawn <harness> --bind here` عندما تريد أن تصبح المحادثة الحالية مساحة عمل ACP دائمة من دون إنشاء سلسلة نقاش فرعية.

السلوك:

- يواصل OpenClaw امتلاك نقل القناة، والمصادقة، والأمان، والتسليم.
- يتم تثبيت المحادثة الحالية على مفتاح جلسة ACP التي تم إنشاؤها.
- يتم توجيه رسائل المتابعة في تلك المحادثة إلى جلسة ACP نفسها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يقوم `/acp close` بإغلاق الجلسة وإزالة ربط المحادثة الحالية.

ما يعنيه هذا عمليًا:

- يُبقي `--bind here` سطح الدردشة نفسه. على Discord، تظل القناة الحالية هي القناة الحالية.
- لا يزال بإمكان `--bind here` إنشاء جلسة ACP جديدة إذا كنت تنشئ عملًا جديدًا. يربط هذا الخيار تلك الجلسة بالمحادثة الحالية.
- لا ينشئ `--bind here` سلسلة Discord فرعية أو موضوع Telegram بمفرده.
- لا يزال بإمكان وقت تشغيل ACP أن يملك دليل عمل خاصًا به (`cwd`) أو مساحة عمل على القرص يديرها الـ backend. مساحة عمل وقت التشغيل هذه منفصلة عن سطح الدردشة ولا تعني وجود سلسلة مراسلة جديدة.
- إذا أنشأت جلسة لوكيل ACP مختلف ولم تمرّر `--cwd`، يرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضيًا، وليس مساحة عمل الطالب.
- إذا كان مسار مساحة العمل الموروثة هذا مفقودًا (`ENOENT`/`ENOTDIR`)، يعود OpenClaw إلى `cwd` الافتراضي للواجهة الخلفية بدلًا من إعادة استخدام الشجرة الخاطئة بصمت.
- إذا كانت مساحة العمل الموروثة موجودة ولكن لا يمكن الوصول إليها (مثلًا `EACCES`)، تعيد عملية الإنشاء خطأ الوصول الحقيقي بدلًا من إسقاط `cwd`.

النموذج الذهني:

- سطح الدردشة: المكان الذي يواصل فيه الأشخاص الحديث (`قناة Discord`، `موضوع Telegram`، `دردشة iMessage`)
- جلسة ACP: حالة وقت تشغيل Codex/Claude/Gemini الدائمة التي يوجّه إليها OpenClaw
- سلسلة النقاش/الموضوع الفرعي: سطح مراسلة إضافي اختياري يتم إنشاؤه فقط بواسطة `--thread ...`
- مساحة عمل وقت التشغيل: موقع نظام الملفات الذي تعمل فيه أداة التسخير (`cwd`، ونسخة المستودع، ومساحة العمل التي تديرها الواجهة الخلفية)

أمثلة:

- `/acp spawn codex --bind here`: احتفظ بهذه الدردشة، وأنشئ أو أرفق جلسة Codex ACP، ووجّه الرسائل المستقبلية هنا إليها
- `/acp spawn codex --thread auto`: قد ينشئ OpenClaw سلسلة نقاش/موضوعًا فرعيًا ويربط جلسة ACP هناك
- `/acp spawn codex --bind here --cwd /workspace/repo`: ربط الدردشة نفسه كما سبق، لكن Codex يعمل في `/workspace/repo`

دعم الربط بالمحادثة الحالية:

- يمكن لقنوات الدردشة/الرسائل التي تعلن دعم ربط المحادثة الحالية استخدام `--bind here` عبر مسار ربط المحادثة المشترك.
- لا يزال بإمكان القنوات ذات دلالات سلاسل النقاش/الموضوعات المخصصة توفير تحويلها إلى الصيغة القياسية على مستوى القناة خلف الواجهة المشتركة نفسها.
- يعني `--bind here` دائمًا "اربط المحادثة الحالية في مكانها".
- تستخدم ارتباطات المحادثة الحالية العامة مخزن الربط المشترك في OpenClaw وتبقى بعد عمليات إعادة تشغيل Gateway العادية.

ملاحظات:

- الخياران `--bind here` و`--thread ...` متنافيان في `/acp spawn`.
- على Discord، يقوم `--bind here` بربط القناة أو سلسلة النقاش الحالية في مكانها. ولا يلزم `spawnAcpSessions` إلا عندما يحتاج OpenClaw إلى إنشاء سلسلة نقاش فرعية لـ `--thread auto|here`.
- إذا لم تعرض القناة النشطة ارتباطات ACP للمحادثة الحالية، يعرض OpenClaw رسالة واضحة تفيد بعدم الدعم.
- أسئلة `resume` و"جلسة جديدة" هي أسئلة تخص جلسة ACP، وليست أسئلة تخص القناة. يمكنك إعادة استخدام حالة وقت التشغيل أو استبدالها من دون تغيير سطح الدردشة الحالي.

### الجلسات المرتبطة بسلسلة نقاش

عندما تكون ارتباطات سلاسل النقاش مفعّلة لمهايئ قناة ما، يمكن ربط جلسات ACP بسلاسل النقاش:

- يربط OpenClaw سلسلة نقاش بجلسة ACP مستهدفة.
- يتم توجيه رسائل المتابعة في سلسلة النقاش تلك إلى جلسة ACP المرتبطة.
- يتم تسليم خرج ACP مرة أخرى إلى سلسلة النقاش نفسها.
- تؤدي إزالة التركيز أو الإغلاق أو الأرشفة أو انتهاء مهلة الخمول أو انتهاء الحد الأقصى للعمر إلى إزالة الربط.

دعم ربط سلاسل النقاش خاص بكل مهايئ. إذا كان مهايئ القناة النشطة لا يدعم ارتباطات سلاسل النقاش، يعرض OpenClaw رسالة واضحة تفيد بعدم الدعم/عدم التوفر.

علامات الميزات المطلوبة لـ ACP المرتبط بسلسلة نقاش:

- `acp.enabled=true`
- تكون `acp.dispatch.enabled` مفعّلة افتراضيًا (اضبطها على `false` لإيقاف توزيع ACP مؤقتًا)
- تفعيل علامة إنشاء سلاسل نقاش ACP في مهايئ القناة (خاصة بالمهايئ)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### القنوات التي تدعم سلاسل النقاش

- أي مهايئ قناة يوفّر إمكانية ربط الجلسة/سلسلة النقاش.
- الدعم المضمّن الحالي:
  - سلاسل نقاش/قنوات Discord
  - موضوعات Telegram (موضوعات المنتدى في المجموعات/المجموعات الفائقة وموضوعات الرسائل الخاصة)
- يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

## إعدادات خاصة بالقنوات

بالنسبة إلى تدفقات العمل غير المؤقتة، اضبط ارتباطات ACP الدائمة في إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

- يشير `bindings[].type="acp"` إلى ربط محادثة ACP دائم.
- يحدّد `bindings[].match` المحادثة المستهدفة:
  - قناة أو سلسلة نقاش Discord: ‏`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - موضوع منتدى Telegram: ‏`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - دردشة BlueBubbles فردية/جماعية: ‏`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    يُفضَّل `chat_id:*` أو `chat_identifier:*` لارتباطات المجموعات الثابتة.
  - دردشة iMessage فردية/جماعية: ‏`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    يُفضَّل `chat_id:*` لارتباطات المجموعات الثابتة.
- يمثّل `bindings[].agentId` معرّف وكيل OpenClaw المالك.
- توجد تجاوزات ACP الاختيارية ضمن `bindings[].acp`:
  - `mode` (`persistent` أو `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### القيم الافتراضية لوقت التشغيل لكل وكيل

استخدم `agents.list[].runtime` لتعريف قيم ACP الافتراضية مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (معرّف أداة التسخير، مثل `codex` أو `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

أولوية التجاوز لجلسات ACP المرتبطة:

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

- يضمن OpenClaw وجود جلسة ACP المضبوطة قبل الاستخدام.
- يتم توجيه الرسائل في تلك القناة أو ذلك الموضوع إلى جلسة ACP المضبوطة.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` تعيين مفتاح جلسة ACP نفسه في مكانه.
- تظل ارتباطات وقت التشغيل المؤقتة (مثل تلك التي تنشئها تدفقات التركيز على سلاسل النقاش) مطبّقة حيثما وُجدت.
- عند إنشاء جلسات ACP عبر وكلاء مختلفة من دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من إعدادات الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى `cwd` الافتراضي للواجهة الخلفية؛ أما حالات فشل الوصول للمسارات غير المفقودة فتظهر كأخطاء إنشاء.

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
- إذا تم حذف `agentId`، يستخدم OpenClaw القيمة `acp.defaultAgent` عند ضبطها.
- تتطلب `mode: "session"` وجود `thread: true` للاحتفاظ بمحادثة مرتبطة دائمة.

تفاصيل الواجهة:

- `task` (مطلوب): الموجّه الأولي المُرسل إلى جلسة ACP.
- `runtime` (مطلوب لـ ACP): يجب أن تكون قيمته `"acp"`.
- `agentId` (اختياري): معرّف أداة التسخير الهدف لـ ACP. يرجع إلى `acp.defaultAgent` إذا تم ضبطه.
- `thread` (اختياري، الافتراضي `false`): طلب تدفق ربط سلسلة النقاش حيثما كان مدعومًا.
- `mode` (اختياري): ‏`run` (تشغيل لمرة واحدة) أو `session` (دائم).
  - القيمة الافتراضية هي `run`
  - إذا كانت `thread: true` وتم حذف `mode`، فقد يجعل OpenClaw السلوك الدائم هو الافتراضي وفقًا لمسار وقت التشغيل
  - تتطلب `mode: "session"` وجود `thread: true`
- `cwd` (اختياري): دليل العمل المطلوب لوقت التشغيل (ويتم التحقق منه وفقًا لسياسة الواجهة الخلفية/وقت التشغيل). إذا تم حذفه، يرث إنشاء ACP مساحة عمل الوكيل الهدف عند ضبطها؛ وتعود المسارات الموروثة المفقودة إلى القيم الافتراضية للواجهة الخلفية، بينما يتم إرجاع أخطاء الوصول الحقيقية.
- `label` (اختياري): تسمية موجّهة للمشغّل تُستخدم في نص الجلسة/اللافتة.
- `resumeSessionId` (اختياري): استئناف جلسة ACP موجودة بدلًا من إنشاء جلسة جديدة. يعيد الوكيل تشغيل سجل محادثته عبر `session/load`. يتطلب `runtime: "acp"`.
- `streamTo` (اختياري): القيمة `"parent"` تبث ملخصات تقدّم تشغيل ACP الأولي إلى جلسة الطالب كأحداث نظام.
  - عند توفره، قد تتضمن الاستجابات المقبولة `streamLogPath` يشير إلى سجل JSONL خاص بالنطاق الخاص بالجلسة (`<sessionId>.acp-stream.jsonl`) يمكنك تتبعه للاطلاع على سجل الترحيل الكامل.

### استئناف جلسة موجودة

استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر `session/load`، بحيث يستكمل العمل مع السياق الكامل لما سبق.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

حالات الاستخدام الشائعة:

- تسليم جلسة Codex من حاسوبك المحمول إلى هاتفك — اطلب من وكيلك أن يكمل من حيث توقفت
- متابعة جلسة برمجة بدأتَها تفاعليًا في CLI، والآن دون واجهة عبر وكيلك
- استكمال العمل الذي انقطع بسبب إعادة تشغيل Gateway أو انتهاء مهلة الخمول

ملاحظات:

- يتطلب `resumeSessionId` وجود `runtime: "acp"` — ويُرجع خطأ إذا استُخدم مع وقت تشغيل الوكيل الفرعي.
- يعيد `resumeSessionId` سجل المحادثة العلوي لـ ACP؛ وتظل `thread` و`mode` مطبّقتين بشكل طبيعي على جلسة OpenClaw الجديدة التي تنشئها، لذا تظل `mode: "session"` تتطلب `thread: true`.
- يجب أن يدعم الوكيل الهدف `session/load` (ويدعمه Codex وClaude Code).
- إذا لم يتم العثور على معرّف الجلسة، يفشل الإنشاء برسالة خطأ واضحة — من دون رجوع صامت إلى جلسة جديدة.

### اختبار دخاني للمشغّل

استخدم هذا بعد نشر Gateway عندما تريد تحققًا حيًا سريعًا من أن إنشاء ACP
يعمل فعليًا من طرف إلى طرف، وليس فقط أنه يجتاز اختبارات الوحدة.

البوابة الموصى بها:

1. تحقّق من إصدار/التزام Gateway المنشور على المضيف الهدف.
2. أكّد أن المصدر المنشور يتضمن قبول سلالة ACP في
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. افتح جلسة جسر ACPX مؤقتة إلى وكيل حي (مثل
   `razor(main)` على `jpclawhq`).
4. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - المهمة: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. تحقّق من أن الوكيل يبلّغ بما يلي:
   - `accepted=yes`
   - `childSessionKey` حقيقي
   - عدم وجود خطأ تحقق
6. نظّف جلسة جسر ACPX المؤقتة.

مثال على موجّه للوكيل الحي:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

ملاحظات:

- أبقِ هذا الاختبار الدخاني على `mode: "run"` ما لم تكن تختبر عمدًا
  جلسات ACP دائمة مرتبطة بسلسلة نقاش.
- لا تشترط `streamTo: "parent"` للبوابة الأساسية. يعتمد هذا المسار على
  قدرات جلسة الطالب/الجلسة وهو فحص تكاملي منفصل.
- تعامل مع اختبار `mode: "session"` المرتبط بسلسلة نقاش كتمرير
  تكاملي ثانٍ وأكثر غنى من سلسلة Discord حقيقية أو موضوع Telegram حقيقي.

## توافق sandbox

تعمل جلسات ACP حاليًا على وقت تشغيل المضيف، وليس داخل sandbox الخاص بـ OpenClaw.

القيود الحالية:

- إذا كانت جلسة الطالب داخل sandbox، يتم حظر إنشاءات ACP لكلٍّ من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
  - الخطأ: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- لا يدعم `sessions_spawn` مع `runtime: "acp"` القيمة `sandbox: "require"`.
  - الخطأ: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

استخدم `runtime: "subagent"` عندما تحتاج إلى تنفيذ مفروض بواسطة sandbox.

### من أمر `/acp`

استخدم `/acp spawn` للتحكم الصريح من جهة المشغّل من الدردشة عند الحاجة.

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

## حل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key` أو `session-id` أو `session-label`).

ترتيب الحل:

1. وسيطة هدف صريحة (أو `--session` مع `/acp steer`)
   - تحاول أولًا المفتاح
   - ثم معرّف الجلسة ذي الشكل UUID
   - ثم التسمية
2. ربط سلسلة النقاش الحالية (إذا كانت هذه المحادثة/سلسلة النقاش مرتبطة بجلسة ACP)
3. الرجوع إلى جلسة الطالب الحالية

تشارك ارتباطات المحادثة الحالية وارتباطات سلاسل النقاش كلاهما في الخطوة 2.

إذا لم يتم حل أي هدف، يعرض OpenClaw خطأ واضحًا (`Unable to resolve session target: ...`).

## أوضاع الربط عند الإنشاء

يدعم `/acp spawn` الخيار `--bind here|off`.

| الوضع | السلوك |
| ------ | ---------------------------------------------------------------------- |
| `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك محادثة نشطة. |
| `off`  | لا تنشئ ربطًا للمحادثة الحالية. |

ملاحظات:

- يمثّل `--bind here` أبسط مسار للمشغّل من أجل "اجعل هذه القناة أو الدردشة مدعومة بـ Codex."
- لا ينشئ `--bind here` سلسلة نقاش فرعية.
- يتوفر `--bind here` فقط على القنوات التي توفّر دعم ربط المحادثة الحالية.
- لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

## أوضاع سلاسل النقاش عند الإنشاء

يدعم `/acp spawn` الخيار `--thread auto|here|off`.

| الوضع | السلوك |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | داخل سلسلة نقاش نشطة: اربط تلك السلسلة. خارج سلسلة نقاش: أنشئ/اربط سلسلة نقاش فرعية عند الدعم. |
| `here` | اشترط وجود سلسلة النقاش النشطة الحالية؛ وافشل إذا لم تكن داخل واحدة. |
| `off`  | بلا ربط. تبدأ الجلسة غير مرتبطة. |

ملاحظات:

- على الأسطح التي لا تدعم ربط سلاسل النقاش، يكون السلوك الافتراضي فعليًا هو `off`.
- يتطلب الإنشاء المرتبط بسلسلة نقاش دعم سياسة القناة:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية من دون إنشاء سلسلة نقاش فرعية.

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

يعرض `/acp status` خيارات وقت التشغيل الفعلية، وعند التوفر، معرّفات الجلسات على مستوى وقت التشغيل وعلى مستوى الواجهة الخلفية.

تعتمد بعض عناصر التحكم على قدرات الواجهة الخلفية. وإذا كانت واجهة خلفية لا تدعم عنصر تحكم ما، يعرض OpenClaw خطأ واضحًا يفيد بأن عنصر التحكم غير مدعوم.

## دليل وصفات أوامر ACP

| الأمر | ما الذي يفعله | مثال |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | إنشاء جلسة ACP؛ مع ربط اختياري بالمحادثة الحالية أو بسلسلة نقاش. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | إلغاء الدور الجاري للجلسة المستهدفة. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | إرسال تعليمات توجيه إلى الجلسة الجارية. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | إغلاق الجلسة وفك ربط أهداف سلاسل النقاش. | `/acp close`                                                  |
| `/acp status`        | عرض الواجهة الخلفية، والوضع، والحالة، وخيارات وقت التشغيل، والقدرات. | `/acp status`                                                 |
| `/acp set-mode`      | ضبط وضع وقت التشغيل للجلسة المستهدفة. | `/acp set-mode plan`                                          |
| `/acp set`           | كتابة خيار عام لإعداد وقت التشغيل. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ضبط تجاوز دليل العمل لوقت التشغيل. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ضبط ملف تعريف سياسة الموافقة. | `/acp permissions strict`                                     |
| `/acp timeout`       | ضبط مهلة وقت التشغيل (بالثواني). | `/acp timeout 120`                                            |
| `/acp model`         | ضبط تجاوز نموذج وقت التشغيل. | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | إزالة تجاوزات خيارات وقت تشغيل الجلسة. | `/acp reset-options`                                          |
| `/acp sessions`      | سرد جلسات ACP الحديثة من المخزن. | `/acp sessions`                                               |
| `/acp doctor`        | سلامة الواجهة الخلفية، والقدرات، والإصلاحات القابلة للتنفيذ. | `/acp doctor`                                                 |
| `/acp install`       | طباعة خطوات تثبيت وتمكين حتمية. | `/acp install`                                                |

يقوم `/acp sessions` بقراءة المخزن للجلسة المرتبطة الحالية أو جلسة الطالب الحالية. وتقوم الأوامر التي تقبل رموز `session-key` أو `session-id` أو `session-label` بحل الأهداف عبر اكتشاف جلسات Gateway، بما في ذلك جذور `session.store` المخصصة لكل وكيل.

## تعيين خيارات وقت التشغيل

يحتوي `/acp` على أوامر ملائمة ومُعيّن عام.

عمليات مكافئة:

- يطابق `/acp model <id>` مفتاح إعداد وقت التشغيل `model`.
- يطابق `/acp permissions <profile>` مفتاح إعداد وقت التشغيل `approval_policy`.
- يطابق `/acp timeout <seconds>` مفتاح إعداد وقت التشغيل `timeout`.
- يحدّث `/acp cwd <path>` تجاوز `cwd` لوقت التشغيل مباشرةً.
- يمثّل `/acp set <key> <value>` المسار العام.
  - حالة خاصة: يستخدم `key=cwd` مسار تجاوز `cwd`.
- يمسح `/acp reset-options` جميع تجاوزات وقت التشغيل للجلسة المستهدفة.

## دعم أدوات تسخير acpx (الحالي)

الأسماء المستعارة المضمّنة الحالية لأدوات تسخير acpx:

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

عندما يستخدم OpenClaw الواجهة الخلفية acpx، ففضّل هذه القيم لـ `agentId` ما لم يحدد إعداد acpx لديك أسماء مستعارة مخصصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك لا يزال يعرّض ACP على أنه `agent acp`، فجاوز أمر الوكيل `cursor` في إعداد acpx بدلًا من تغيير القيمة المضمّنة الافتراضية.

يمكن لاستخدام CLI المباشر لـ acpx أيضًا استهداف محوّلات اعتباطية عبر `--agent <command>`، لكن منفذ الهروب الخام هذا هو ميزة في acpx CLI (وليس مسار `agentId` العادي في OpenClaw).

## الإعداد المطلوب

خط أساس ACP الأساسي:

```json5
{
  acp: {
    enabled: true,
    // اختياري. القيمة الافتراضية هي true؛ اضبطها على false لإيقاف توزيع ACP مؤقتًا مع الإبقاء على عناصر تحكم /acp.
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

يكون إعداد ربط سلاسل النقاش خاصًا بمهايئ القناة. مثال على Discord:

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

إذا لم ينجح إنشاء ACP المرتبط بسلسلة نقاش، فتحقّق أولًا من علامة ميزة المهايئ:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

لا تتطلب الارتباطات بالمحادثة الحالية إنشاء سلسلة نقاش فرعية. وهي تتطلب سياق محادثة نشطًا ومهايئ قناة يوفّر ارتباطات محادثة ACP.

راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعداد Plugin للواجهة الخلفية acpx

تأتي عمليات التثبيت الجديدة مع تفعيل Plugin وقت التشغيل المضمّن `acpx` افتراضيًا، لذلك
يعمل ACP عادةً من دون خطوة تثبيت Plugin يدويًا.

ابدأ بـ:

```text
/acp doctor
```

إذا كنت قد عطّلت `acpx`، أو رفضته عبر `plugins.allow` / `plugins.deny`، أو كنت
تريد التبديل إلى نسخة تطوير محلية، فاستخدم مسار Plugin الصريح:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

تثبيت مساحة عمل محلية أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقّق من سلامة الواجهة الخلفية:

```text
/acp doctor
```

### إعداد أمر acpx والإصدار

افتراضيًا، يستخدم Plugin الواجهة الخلفية acpx المضمّن (`acpx`) الملف التنفيذي المثبّت محليًا داخل Plugin:

1. تكون القيمة الافتراضية للأمر هي `node_modules/.bin/acpx` المحلي داخل حزمة Plugin ACPX.
2. تكون القيمة الافتراضية للإصدار المتوقع هي التثبيت المثبّت في الامتداد.
3. يسجّل بدء التشغيل الواجهة الخلفية ACP مباشرةً على أنها غير جاهزة.
4. تتحقق مهمة ضمان في الخلفية من `acpx --version`.
5. إذا كان الملف التنفيذي المحلي داخل Plugin مفقودًا أو غير مطابق، يشغّل:
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

- يقبل `command` مسارًا مطلقًا، أو مسارًا نسبيًا، أو اسم أمر (`acpx`).
- يتم حل المسارات النسبية من دليل مساحة عمل OpenClaw.
- يؤدي `expectedVersion: "any"` إلى تعطيل المطابقة الصارمة للإصدار.
- عندما يشير `command` إلى ملف تنفيذي/مسار مخصص، يتم تعطيل التثبيت التلقائي المحلي داخل Plugin.
- يظل بدء تشغيل OpenClaw غير حاجب أثناء تنفيذ فحص سلامة الواجهة الخلفية.

راجع [Plugins](/ar/tools/plugin).

### التثبيت التلقائي للتبعيات

عندما تثبّت OpenClaw عالميًا باستخدام `npm install -g openclaw`، يتم تثبيت
تبعيات وقت تشغيل acpx (الملفات التنفيذية الخاصة بالمنصة) تلقائيًا
عبر خطاف postinstall. وإذا فشل التثبيت التلقائي، فستبدأ Gateway مع ذلك
بشكل طبيعي وتبلّغ عن التبعية المفقودة عبر `openclaw acp doctor`.

### جسر MCP لأدوات Plugin

افتراضيًا، لا تعرّض جلسات ACPX **أدوات OpenClaw المسجّلة عبر Plugin** إلى
أداة تسخير ACP.

إذا كنت تريد أن تستدعي وكلاء ACP مثل Codex أو Claude Code أدوات
OpenClaw المثبّتة عبر Plugin مثل استدعاء/تخزين الذاكرة، فعِّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مضمّنًا باسم `openclaw-plugin-tools` في تمهيد جلسة ACPX.
- يعرّض أدوات Plugin المسجّلة بالفعل بواسطة Plugins OpenClaw المثبّتة والمفعّلة.
- يُبقي الميزة صريحة ومعطلة افتراضيًا.

ملاحظات الأمان والثقة:

- يوسّع هذا سطح أدوات أداة تسخير ACP.
- تحصل وكلاء ACP على وصول فقط إلى أدوات Plugin النشطة بالفعل في Gateway.
- تعامل مع هذا على أنه حد الثقة نفسه المتمثل في السماح لتلك Plugins بالتنفيذ داخل
  OpenClaw نفسه.
- راجع Plugins المثبّتة قبل تفعيله.

تظل `mcpServers` المخصصة تعمل كما كانت من قبل. جسر أدوات Plugin المضمّن هو
وسيلة راحة إضافية اختيارية، وليس بديلًا عن إعداد خادم MCP العام.

### إعداد مهلة وقت التشغيل

يضبط Plugin ‏`acpx` المضمّن افتراضيًا أدوار وقت التشغيل المضمّن على مهلة
مدتها 120 ثانية. يمنح هذا أدوات التسخير الأبطأ مثل Gemini CLI وقتًا كافيًا لإكمال
بدء ACP والتهيئة. يمكنك تجاوزه إذا كان المضيف لديك يحتاج إلى حد مختلف
لوقت التشغيل:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

### إعداد وكيل فحص السلامة

يفحص Plugin ‏`acpx` المضمّن وكيل أداة تسخير واحدًا أثناء تقرير ما إذا كانت
الواجهة الخلفية لوقت التشغيل المضمّن جاهزة. والقيمة الافتراضية هي `codex`. إذا كان
نشرُك يستخدم وكيل ACP افتراضيًا مختلفًا، فاضبط وكيل الفحص على المعرّف نفسه:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

## إعداد الأذونات

تعمل جلسات ACP بشكل غير تفاعلي — لا توجد TTY للموافقة على مطالبات أذونات كتابة الملفات وتنفيذ shell أو رفضها. يوفّر Plugin ‏acpx مفتاحَي إعداد يتحكمان في كيفية التعامل مع الأذونات:

أذونات أدوات تسخير ACPX هذه منفصلة عن موافقات تنفيذ OpenClaw ومنفصلة عن أعلام تجاوز المورّد في واجهات CLI الخلفية مثل Claude CLI ‏`--permission-mode bypassPermissions`. يمثّل ACPX ‏`approve-all` مفتاح الطوارئ على مستوى أداة التسخير لجلسات ACP.

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل أداة التسخير تنفيذها من دون مطالبة.

| القيمة | السلوك |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | الموافقة التلقائية على جميع عمليات كتابة الملفات وأوامر shell. |
| `approve-reads` | الموافقة التلقائية على القراءات فقط؛ وتتطلب الكتابات والتنفيذ مطالبات. |
| `deny-all`      | رفض جميع مطالبات الأذونات. |

### `nonInteractivePermissions`

يتحكم فيما يحدث عندما كان من المفترض عرض مطالبة إذن ولكن لا تتوفر TTY تفاعلية (وهو الحال دائمًا في جلسات ACP).

| القيمة | السلوك |
| ------ | ----------------------------------------------------------------- |
| `fail` | إجهاض الجلسة مع `AcpRuntimeError`. **(الافتراضي)** |
| `deny` | رفض الإذن بصمت ومتابعة التنفيذ (تراجع رشيق). |

### الإعداد

اضبطه عبر إعداد Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل Gateway بعد تغيير هذه القيم.

> **مهم:** يستخدم OpenClaw حاليًا افتراضيًا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. في جلسات ACP غير التفاعلية، قد تفشل أي عملية كتابة أو تنفيذ تؤدي إلى مطالبة إذن مع الخطأ `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> إذا كنت بحاجة إلى تقييد الأذونات، فاضبط `nonInteractivePermissions` على `deny` بحيث تتراجع الجلسات بشكل رشيق بدلًا من أن تتعطل.

## استكشاف الأخطاء وإصلاحها

| العرض | السبب المحتمل | الإصلاح |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin الواجهة الخلفية مفقود أو معطّل. | ثبّت Plugin الواجهة الخلفية وفعّله، ثم شغّل `/acp doctor`. |
| `ACP is disabled by policy (acp.enabled=false)`                             | تم تعطيل ACP على مستوى عام. | اضبط `acp.enabled=true`. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | تم تعطيل التوزيع من رسائل سلاسل النقاش العادية. | اضبط `acp.dispatch.enabled=true`. |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح. | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`. |
| `Unable to resolve session target: ...`                                     | رمز مفتاح/معرّف/تسمية غير صحيح. | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بدقة، ثم أعد المحاولة. |
| `--bind here requires running /acp spawn inside an active ... conversation` | تم استخدام `--bind here` دون وجود محادثة نشطة قابلة للربط. | انتقل إلى الدردشة/القناة المستهدفة وأعد المحاولة، أو استخدم إنشاءً غير مرتبط. |
| `Conversation bindings are unavailable for <channel>.`                      | المهايئ يفتقر إلى إمكانية ربط ACP بالمحادثة الحالية. | استخدم `/acp spawn ... --thread ...` حيثما كان مدعومًا، أو اضبط `bindings[]` من المستوى الأعلى، أو انتقل إلى قناة مدعومة. |
| `--thread here requires running /acp spawn inside an active ... thread`     | تم استخدام `--thread here` خارج سياق سلسلة نقاش. | انتقل إلى سلسلة النقاش المستهدفة أو استخدم `--thread auto`/`off`. |
| `Only <user-id> can rebind this channel/conversation/thread.`               | يملك مستخدم آخر هدف الربط النشط. | أعد الربط بصفتك المالك أو استخدم محادثة أو سلسلة نقاش مختلفة. |
| `Thread bindings are unavailable for <channel>.`                            | المهايئ يفتقر إلى إمكانية ربط سلاسل النقاش. | استخدم `--thread off` أو انتقل إلى مهايئ/قناة مدعومة. |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | وقت تشغيل ACP يعمل على جانب المضيف؛ وجلسة الطالب داخل sandbox. | استخدم `runtime="subagent"` من الجلسات الموجودة داخل sandbox، أو شغّل إنشاء ACP من جلسة ليست داخل sandbox. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | تم طلب `sandbox="require"` لوقت تشغيل ACP. | استخدم `runtime="subagent"` عندما يكون sandbox المطلوب إلزاميًا، أو استخدم ACP مع `sandbox="inherit"` من جلسة ليست داخل sandbox. |
| Missing ACP metadata for bound session                                      | بيانات وصفية قديمة/محذوفة لجلسة ACP. | أعد الإنشاء باستخدام `/acp spawn`، ثم أعد الربط/التركيز على سلسلة النقاش. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | يمنع `permissionMode` عمليات الكتابة/التنفيذ في جلسة ACP غير تفاعلية. | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [إعداد الأذونات](#permission-configuration). |
| ACP session fails early with little output                                  | تم حظر مطالبات الأذونات بواسطة `permissionMode`/`nonInteractivePermissions`. | تحقّق من سجلات Gateway بحثًا عن `AcpRuntimeError`. للحصول على أذونات كاملة، اضبط `permissionMode=approve-all`؛ وللتراجع الرشيق، اضبط `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | انتهت عملية أداة التسخير لكن جلسة ACP لم تُبلغ عن الاكتمال. | راقب باستخدام `ps aux \| grep acpx`؛ واقتل العمليات القديمة يدويًا. |
