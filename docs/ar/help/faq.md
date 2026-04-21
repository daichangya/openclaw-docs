---
read_when:
    - الإجابة عن أسئلة الدعم الشائعة المتعلقة بالإعداد أو التثبيت أو الإعداد الأولي أو وقت التشغيل
    - فرز المشكلات التي يبلغ عنها المستخدمون قبل الانتقال إلى تصحيح أعمق للأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتهيئته واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-04-21T07:21:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bd1df258baa4b289bc95ba0f7757b61c1412e230d93ebb137cb7117fbc3a2f1
    source_path: help/faq.md
    workflow: 15
---

# الأسئلة الشائعة

إجابات سريعة مع استكشاف أعمق للأخطاء والإصلاحات لبيئات الإعداد الواقعية (التطوير المحلي، وVPS، والوكلاء المتعددون، ومفاتيح OAuth/API، والتحويل الاحتياطي للنماذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). وللاطلاع على مرجع التهيئة الكامل، راجع [التهيئة](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك شيء معطّل

1. **الحالة السريعة (أول فحص)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، وإمكانية الوصول إلى Gateway/الخدمة، والوكلاء/الجلسات، وتهيئة المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلًا للوصول).

2. **تقرير قابل للصق (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع إخفاء الرموز المميزة).

3. **حالة الـ daemon والمنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض حالة تشغيل المشرف مقابل إمكانية الوصول إلى RPC، وعنوان URL الهدف الخاص بالفحص، وأي تهيئة استخدمتها الخدمة على الأرجح.

4. **فحوصات عميقة**

   ```bash
   openclaw status --deep
   ```

   يشغّل فحص سلامة حيًا لـ Gateway، بما في ذلك فحوصات القنوات عندما تكون مدعومة
   (يتطلب Gateway يمكن الوصول إليه). راجع [Health](/ar/gateway/health).

5. **تتبّع أحدث سجل**

   ```bash
   openclaw logs --follow
   ```

   إذا كان RPC متوقفًا، فارجع إلى:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   سجلات الملفات منفصلة عن سجلات الخدمة؛ راجع [Logging](/ar/logging) و[استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

6. **تشغيل doctor (الإصلاحات)**

   ```bash
   openclaw doctor
   ```

   يُصلح/يُرحّل التهيئة والحالة + يشغّل فحوصات السلامة. راجع [Doctor](/ar/gateway/doctor).

7. **لقطة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # يعرض عنوان URL الهدف + مسار التهيئة عند حدوث أخطاء
   ```

   يطلب من Gateway الجاري تشغيله لقطة كاملة (WS فقط). راجع [Health](/ar/gateway/health).

## البدء السريع والإعداد لأول تشغيل

<AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من التعطل؟">
    استخدم وكيل AI محليًا يمكنه **رؤية جهازك**. هذا أكثر فاعلية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات محلية في التهيئة أو البيئة**
    لا يستطيع المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    يمكن لهذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح
    الإعداد على مستوى جهازك (PATH، والخدمات، والأذونات، وملفات المصادقة). امنحها **نسخة المصدر الكاملة**
    عبر تثبيت hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    هذا يثبت OpenClaw **من نسخة git**، بحيث يستطيع الوكيل قراءة الكود + الوثائق
    والاستدلال على الإصدار الدقيق الذي تشغله. ويمكنك دائمًا العودة لاحقًا إلى الإصدار المستقر
    بإعادة تشغيل المثبّت من دون `--install-method git`.

    نصيحة: اطلب من الوكيل أن **يخطط ويشرف** على الإصلاح (خطوة بخطوة)، ثم ينفّذ فقط
    الأوامر الضرورية. هذا يُبقي التغييرات صغيرة وأسهل في التدقيق.

    إذا اكتشفت خطأً حقيقيًا أو إصلاحًا، فيُرجى فتح issue على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (وشارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة عن سلامة Gateway/الوكيل + التهيئة الأساسية.
    - `openclaw models status`: يفحص مصادقة المزوّد + توفر النموذج.
    - `openclaw doctor`: يتحقق من مشكلات التهيئة/الحالة الشائعة ويصلحها.

    فحوصات CLI مفيدة أخرى: `openclaw status --all` و`openclaw logs --follow`،
    و`openclaw gateway status`، و`openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطّل](#أول-60-ثانية-إذا-كان-هناك-شيء-معطّل).
    وثائق التثبيت: [Install](/ar/install)، [إشارات المثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="Heartbeat يستمر في التخطي. ماذا تعني أسباب التخطي؟">
    الأسباب الشائعة لتخطي Heartbeat:

    - `quiet-hours`: خارج نافذة الساعات النشطة المهيأة
    - `empty-heartbeat-file`: الملف `HEARTBEAT.md` موجود لكنه يحتوي فقط على هيكل فارغ/رؤوس فقط
    - `no-tasks-due`: وضع مهام `HEARTBEAT.md` نشط لكن لم يحن موعد أي من فترات المهام بعد
    - `alerts-disabled`: كل إظهار Heartbeat معطّل (`showOk` و`showAlerts` و`useIndicator` كلها متوقفة)

    في وضع المهام، لا يتم تقديم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل
    Heartbeat فعلي. أما عمليات التشغيل المتخطاة فلا تضع علامة على المهام على أنها مكتملة.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد الأولي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضًا بناء أصول واجهة المستخدم تلقائيًا. بعد الإعداد الأولي، عادةً ما تشغّل Gateway على المنفذ **18789**.

    من المصدر (للمساهمين/المطورين):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    إذا لم يكن لديك تثبيت عام بعد، فشغّله عبر `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="كيف أفتح لوحة التحكم بعد الإعداد الأولي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف للوحة التحكم (من دون رمز مميز) مباشرة بعد الإعداد الأولي ويطبع أيضًا الرابط في الملخص. أبقِ علامة التبويب تلك مفتوحة؛ وإذا لم يتم تشغيلها، فانسخ/ألصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة التحكم على localhost مقابل الوضع البعيد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلب مصادقة shared-secret، فألصق الرمز المميز أو كلمة المرور المهيأة في إعدادات Control UI.
    - مصدر الرمز المميز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم إعداد أي shared secret بعد، فأنشئ رمزًا مميزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كانت `gateway.auth.allowTailscale` تساوي `true`، فإن رؤوس الهوية تلبّي مصادقة Control UI/WebSocket (من دون لصق shared secret، بافتراض مضيف Gateway موثوق)؛ ولا تزال HTTP APIs تتطلب مصادقة shared-secret ما لم تستخدم عمدًا `none` لإدخال خاص أو مصادقة HTTP عبر trusted-proxy.
      تتم سلسلة محاولات مصادقة Serve المتزامنة السيئة من العميل نفسه قبل أن يسجل محدِّد المصادقة الفاشلة تلك المحاولات، لذلك قد تُظهر إعادة المحاولة السيئة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو قم بتهيئة مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم ألصق shared secret المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي مدرك للهوية**: أبقِ Gateway خلف trusted proxy غير مربوط على loopback، وقم بتهيئة `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. تظل مصادقة shared-secret مطبقة عبر النفق؛ ألصق الرمز المميز أو كلمة المرور المهيأة إذا طُلب منك ذلك.

    راجع [لوحة التحكم](/web/dashboard) و[واجهات الويب](/web) للاطلاع على أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا توجد تهيئتان لموافقات exec لموافقات الدردشة؟">
    هما تتحكمان في طبقتين مختلفتين:

    - `approvals.exec`: يمرر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    تظل سياسة exec الخاصة بالمضيف هي بوابة الموافقة الحقيقية. أما تهيئة الدردشة فتنظم فقط مكان ظهور
    مطالبات الموافقة وكيف يمكن للأشخاص الرد عليها.

    في معظم الإعدادات، **لا** تحتاج إلى كليهما:

    - إذا كانت الدردشة تدعم الأوامر والردود بالفعل، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كانت هناك قناة أصلية مدعومة يمكنها استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية بنمط DM-first عندما تكون `channels.<channel>.execApprovals.enabled` غير مضبوطة أو `"auto"`.
    - عندما تكون بطاقات/أزرار الموافقة الأصلية متاحة، تكون واجهة المستخدم الأصلية هي المسار الأساسي؛ ولا ينبغي للوكيل تضمين أمر `/approve` يدوي إلا إذا كانت نتيجة الأداة تشير إلى أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا تمرير المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة مرة أخرى: فهي تستخدم `/approve` في الدردشة نفسها افتراضيًا، مع تمرير اختياري عبر `approvals.plugin`، وفقط بعض القنوات الأصلية تبقي معالجة الموافقة الأصلية الخاصة بـ Plugin فوق ذلك.

    باختصار: التمرير مخصص للتوجيه، أما تهيئة العميل الأصلي فهي لتجربة استخدام أغنى خاصة بالقناة.
    راجع [Exec Approvals](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    Node **>= 22** مطلوب. ويُوصى باستخدام `pnpm`. أما Bun فهو **غير موصى به** لـ Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. إن Gateway خفيف الوزن - تشير الوثائق إلى أن **512MB-1GB RAM** و**نواة واحدة** وحوالي **500MB**
    من القرص تكفي للاستخدام الشخصي، وتذكر أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا كنت تريد هامشًا إضافيًا (للسجلات، والوسائط، والخدمات الأخرى)، فـ **2GB موصى بها**، لكنها
    ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لـ Pi/VPS صغير استضافة Gateway، ويمكنك إقران **nodes** على الحاسوب المحمول/الهاتف من أجل
    الشاشة/الكاميرا/اللوحة المحلية أو تنفيذ الأوامر. راجع [Nodes](/ar/nodes).

  </Accordion>

  <Accordion title="هل توجد نصائح لتثبيتات Raspberry Pi؟">
    باختصار: يعمل، لكن توقّع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وحافظ على Node >= 22.
    - فضّل تثبيت **hackable (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات ثنائية غريبة، فعادةً ما تكون مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [Install](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق عند wake up my friend / الإعداد الأولي لا يكتمل. ماذا الآن؟">
    تعتمد تلك الشاشة على أن يكون Gateway قابلًا للوصول ومصادقًا عليه. كما يرسل TUI أيضًا
    "Wake up, my friend!" تلقائيًا عند أول اكتمال للإعداد. إذا رأيت هذا السطر مع **عدم وجود رد**
    وبقيت الرموز عند 0، فهذا يعني أن الوكيل لم يعمل مطلقًا.

    1. أعد تشغيل Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. تحقّق من الحالة + المصادقة:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. إذا ظل معلقًا، فشغّل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن واجهة المستخدم
    موجّهة إلى Gateway الصحيح. راجع [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني ترحيل إعدادي إلى جهاز جديد (Mac mini) من دون إعادة الإعداد الأولي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يُبقي الروبوت "كما هو تمامًا" (الذاكرة، وسجل الجلسات، والمصادقة، وحالة
    القناة) ما دمت تنسخ **الموقعين** معًا:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة العمل الخاصة بك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    هذا يحافظ على التهيئة، وملفات تعريف المصادقة، وبيانات اعتماد WhatsApp، والجلسات، والذاكرة. إذا كنت تعمل في
    الوضع البعيد، فتذكّر أن مضيف Gateway هو الذي يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تلتزم/تدفع مساحة عملك فقط إلى GitHub، فأنت تنشئ نسخة احتياطية
    من **الذاكرة + ملفات bootstrap**، لكن **ليس** من سجل الجلسات أو المصادقة. فهذه توجد
    تحت `~/.openclaw/` (على سبيل المثال `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أماكن وجود الملفات على القرص](#أين-توجد-الأشياء-على-القرص)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى ما الجديد في أحدث إصدار؟">
    تحقق من سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات تكون في الأعلى. إذا كان القسم العلوي معنّونًا **Unreleased**، فالقسم التالي المؤرخ
    هو أحدث إصدار تم شحنه. وتُجمع الإدخالات ضمن **Highlights** و**Changes** و
    **Fixes** (إضافة إلى أقسام الوثائق/أخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تقوم بعض اتصالات Comcast/Xfinity بحظر `docs.openclaw.ai` بشكل غير صحيح عبر Xfinity
    Advanced Security. عطّلها أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يُرجى مساعدتنا في رفع هذا الحظر بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال غير قادر على الوصول إلى الموقع، فالوثائق معكوسة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين stable وbeta">
    إن **stable** و**beta** هما **وسما npm dist-tag**، وليسا خطّي كود منفصلين:

    - `latest` = stable
    - `beta` = بنية مبكرة للاختبار

    عادةً، يصل الإصدار المستقر إلى **beta** أولًا، ثم تنقل خطوة
    ترقية صريحة ذلك الإصدار نفسه إلى `latest`. ويمكن للمشرفين أيضًا
    النشر مباشرة إلى `latest` عند الحاجة. ولهذا السبب قد يشير beta وstable
    إلى **الإصدار نفسه** بعد الترقية.

    اطلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    للاطلاع على أوامر التثبيت المختصرة والفرق بين beta وdev، راجع الـ accordion أدناه.

  </Accordion>

  <Accordion title="كيف أثبت إصدار beta وما الفرق بين beta وdev؟">
    إن **Beta** هو وسم npm dist-tag `beta` (وقد يطابق `latest` بعد الترقية).
    أما **Dev** فهو الرأس المتحرك لفرع `main` (git)؛ وعند نشره يستخدم وسم npm dist-tag `dev`.

    أوامر مختصرة (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مُثبّت Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    مزيد من التفاصيل: [قنوات التطوير](/ar/install/development-channels) و[إشارات المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أجرّب أحدث الأجزاء؟">
    هناك خياران:

    1. **قناة Dev (نسخة git):**

    ```bash
    openclaw update --channel dev
    ```

    يؤدي هذا إلى التبديل إلى فرع `main` والتحديث من المصدر.

    2. **تثبيت hackable (من موقع المثبّت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك هذا مستودعًا محليًا يمكنك تعديله، ثم تحديثه عبر git.

    إذا كنت تفضّل استنساخًا نظيفًا يدويًا، فاستخدم:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    الوثائق: [Update](/cli/update)، [قنوات التطوير](/ar/install/development-channels)،
    [Install](/ar/install).

  </Accordion>

  <Accordion title="كم يستغرق التثبيت والإعداد الأولي عادةً؟">
    تقدير تقريبي:

    - **التثبيت:** من 2 إلى 5 دقائق
    - **الإعداد الأولي:** من 5 إلى 15 دقيقة حسب عدد القنوات/النماذج التي تقوم بتهيئتها

    إذا علق، فاستخدم [المثبّت عالق؟](#البدء-السريع-والإعداد-لأول-تشغيل)
    وحلقة التصحيح السريعة في [أنا عالق](#البدء-السريع-والإعداد-لأول-تشغيل).

  </Accordion>

  <Accordion title="المثبّت عالق؟ كيف أحصل على مزيد من التغذية الراجعة؟">
    أعد تشغيل المثبّت مع **مخرجات مطولة**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت Beta مع verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    لتثبيت hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    المكافئ في Windows (PowerShell):

    ```powershell
    # install.ps1 لا يحتوي بعد على إشارة -Verbose مخصصة.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    مزيد من الخيارات: [إشارات المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="تثبيت Windows يقول git غير موجود أو openclaw غير معروف">
    مشكلتان شائعتان في Windows:

    **1) خطأ npm spawn git / git غير موجود**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود في PATH لديك.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل المثبّت.

    **2) openclaw غير معروف بعد التثبيت**

    - مجلد npm global bin لديك غير موجود في PATH.
    - تحقّق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم (لا حاجة إلى اللاحقة `\bin` في Windows؛ ففي معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا كنت تريد إعداد Windows الأكثر سلاسة، فاستخدم **WSL2** بدل Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="يعرض خرج exec في Windows نصًا صينيًا مشوهًا - ماذا أفعل؟">
    يكون هذا عادةً عدم تطابق في code page الخاصة بوحدة التحكم على قواقع Windows الأصلية.

    الأعراض:

    - يظهر خرج `system.run`/`exec` الذي يحتوي على الصينية كنص مشوّه
    - يبدو الأمر نفسه جيدًا في ملف تعريف طرفية آخر

    حل سريع في PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    ثم أعد تشغيل Gateway وأعد محاولة الأمر:

    ```powershell
    openclaw gateway restart
    ```

    إذا كنت لا تزال تستطيع إعادة إنتاج هذا على أحدث إصدار من OpenClaw، فتابعه/أبلغ عنه في:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **تثبيت hackable (git)** حتى تكون لديك كل المصادر والوثائق محليًا، ثم اسأل
    الروبوت الخاص بك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [Install](/ar/install) و[إشارات المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبت OpenClaw على Linux؟">
    الإجابة القصيرة: اتبع دليل Linux، ثم شغّل الإعداد الأولي.

    - المسار السريع لـ Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - الشرح الكامل: [البدء](/ar/start/getting-started).
    - المثبّت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبت OpenClaw على VPS؟">
    أي VPS يعمل بنظام Linux مناسب. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول البعيد: [Gateway remote](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين توجد أدلة التثبيت السحابي/VPS؟">
    نحتفظ بـ **مركز استضافة** يضم المزودين الشائعين. اختر واحدًا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزودين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيف يعمل هذا في السحابة: تعمل **Gateway على الخادم**، وتصل إليها
    من الحاسوب المحمول/الهاتف عبر Control UI (أو Tailscale/SSH). وتوجد حالتك + مساحة العمل
    على الخادم، لذا تعامل مع المضيف بوصفه مصدر الحقيقة وقم بأخذ نسخة احتياطية له.

    يمكنك إقران **nodes** (Mac/iOS/Android/headless) مع Gateway السحابية هذه للوصول إلى
    الشاشة/الكاميرا/اللوحة المحلية أو تشغيل الأوامر على الحاسوب المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول البعيد: [Gateway remote](/ar/gateway/remote).
    Nodes: [Nodes](/ar/nodes)، [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw أن يحدّث نفسه؟">
    الإجابة القصيرة: **ممكن، لكنه غير موصى به**. قد يؤدي تدفق التحديث إلى إعادة تشغيل
    Gateway (مما يسقط الجلسة النشطة)، وقد يحتاج إلى نسخة git نظيفة،
    وقد يطلب تأكيدًا. والأكثر أمانًا هو تشغيل التحديثات من shell بصفتك المشغّل.

    استخدم CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    إذا كان لا بد من الأتمتة عبر وكيل:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    الوثائق: [Update](/cli/update)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="ماذا يفعل الإعداد الأولي فعليًا؟">
    يُعد `openclaw onboard` مسار الإعداد الموصى به. في **الوضع المحلي** يرشدك خلال:

    - **إعداد النموذج/المصادقة** (OAuth للمزوّد، ومفاتيح API، وanthropic setup-token، بالإضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات bootstrap
    - **إعدادات Gateway** (الربط/المنفذ/المصادقة/tailscale)
    - **القنوات** (WhatsApp وTelegram وDiscord وMattermost وSignal وiMessage، بالإضافة إلى Plugins القنوات المضمّنة مثل QQ Bot)
    - **تثبيت daemon** (LaunchAgent على macOS؛ ووحدة systemd للمستخدم على Linux/WSL2)
    - **فحوصات السلامة** واختيار **Skills**

    كما يحذّرك أيضًا إذا كان النموذج المهيأ لديك غير معروف أو تنقصه المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/وغيرها) أو باستخدام
    **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. وتمثل الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) طرقًا اختيارية لمصادقة هؤلاء المزودين.

    بالنسبة إلى Anthropic في OpenClaw، يكون التقسيم العملي كما يلي:

    - **مفتاح Anthropic API**: فوترة عادية لـ Anthropic API
    - **مصادقة Claude CLI / اشتراك Claude في OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مرة أخرى، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه معتمد لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفي Gateway طويلي العمر، تظل مفاتيح Anthropic API هي الإعداد
    الأكثر قابلية للتنبؤ. كما أن OpenAI Codex OAuth مدعوم صراحةً للأدوات
    الخارجية مثل OpenClaw.

    يدعم OpenClaw أيضًا خيارات أخرى مستضافة بنمط الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan**، و**MiniMax Coding Plan**، و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [GLM Models](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max من دون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بنمط OpenClaw مسموح به مرة أخرى، لذلك
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما معتمدان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. وإذا كنت تريد
    إعدادًا من جانب الخادم أكثر قابلية للتنبؤ، فاستخدم مفتاح Anthropic API بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مرة أخرى، لذلك يتعامل OpenClaw
    مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال Anthropic setup-token متاحًا بوصفه مسار رمز مميز مدعومًا في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    أما لأحمال العمل الإنتاجية أو متعددة المستخدمين، فتبقى مصادقة مفتاح Anthropic API هي
    الخيار الأكثر أمانًا وقابلية للتنبؤ. وإذا كنت تريد خيارات مستضافة أخرى
    بنمط الاشتراك في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، و[Qwen / Model
    Cloud](/ar/providers/qwen)، و[MiniMax](/ar/providers/minimax)، و[GLM
    Models](/ar/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
هذا يعني أن **حصة/حد المعدل لدى Anthropic** قد استُنفدت في النافذة الحالية. إذا كنت
تستخدم **Claude CLI**، فانتظر حتى تُعاد تعيين النافذة أو قم بترقية خطتك. وإذا كنت
تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
لمعرفة الاستخدام/الفوترة وارفع الحدود حسب الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    النسخة التجريبية للسياق 1M لدى Anthropic (`context1m: true`). وهذا لا يعمل إلا عندما تكون
    بيانات الاعتماد الخاصة بك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو
    مسار تسجيل الدخول إلى Claude في OpenClaw مع تفعيل Extra Usage).

    نصيحة: عيّن **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من الاستمرار في الرد أثناء خضوع أحد المزوّدين لتقييد المعدل.
    راجع [Models](/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يحتوي OpenClaw على مزوّد **Amazon Bedrock (Converse)** مضمّن. عند وجود مؤشرات بيئة AWS، يمكن لـ OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزوّد ضمني `amazon-bedrock`؛ وإلا يمكنك تمكين `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزودو النماذج](/ar/providers/models). وإذا كنت تفضّل تدفقًا مُدارًا للمفاتيح، فإن استخدام Proxy متوافق مع OpenAI أمام Bedrock يظل خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). يمكن للإعداد الأولي تشغيل تدفق OAuth وسيضبط النموذج الافتراضي إلى `openai-codex/gpt-5.4` عند الاقتضاء. راجع [مزودو النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يؤدي ChatGPT GPT-5.4 إلى فتح openai/gpt-5.4 في OpenClaw؟">
    يتعامل OpenClaw مع المسارين بشكل منفصل:

    - `openai-codex/gpt-5.4` = OAuth الخاص بـ ChatGPT/Codex
    - `openai/gpt-5.4` = OpenAI Platform API مباشر

    في OpenClaw، يتم ربط تسجيل الدخول إلى ChatGPT/Codex بمسار `openai-codex/*`،
    وليس بمسار `openai/*` المباشر. إذا كنت تريد مسار API المباشر في
    OpenClaw، فعيّن `OPENAI_API_KEY` (أو تهيئة مزود OpenAI المكافئة).
    وإذا كنت تريد تسجيل الدخول إلى ChatGPT/Codex في OpenClaw، فاستخدم `openai-codex/*`.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود Codex OAuth عن ChatGPT على الويب؟">
    يستخدم `openai-codex/*` مسار Codex OAuth، وتكون نوافذ الحصة القابلة للاستخدام فيه
    مُدارة من OpenAI وتعتمد على الخطة. وعمليًا، قد تختلف هذه الحدود عن
    تجربة موقع/تطبيق ChatGPT على الويب، حتى عندما يكون الاثنان مرتبطين بالحساب نفسه.

    يمكن لـ OpenClaw عرض نوافذ الاستخدام/الحصة المرئية حاليًا للمزوّد في
    `openclaw models status`، لكنه لا يخترع ولا يوحّد
    الامتيازات الخاصة بـ ChatGPT على الويب إلى وصول مباشر إلى API. إذا كنت تريد مسار
    الفوترة/الحدود المباشر في OpenAI Platform، فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **اشتراك OAuth الخاص بـ OpenAI Code (Codex)**.
    تسمح OpenAI صراحةً باستخدام OAuth للاشتراك في الأدوات/التدفقات الخارجية
    مثل OpenClaw. ويمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزودو النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أُعد Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس client id أو secret في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا بحيث يكون `gemini` موجودًا في `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف gateway

    يؤدي هذا إلى تخزين رموز OAuth في ملفات تعريف المصادقة على مضيف gateway. التفاصيل: [مزودو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للدردشات العادية؟">
    غالبًا لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ أما البطاقات الصغيرة فتقتطع وتسرّب. وإذا اضطررت، فشغّل **أكبر** بنية نموذج يمكنك تشغيلها محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّمة من خطر حقن prompt - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أحافظ على حركة النموذج المستضاف داخل منطقة معينة؟">
    اختر نقاط نهاية مثبتة على منطقة محددة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر المتغير المستضاف في الولايات المتحدة للحفاظ على البيانات داخل المنطقة. ولا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه الخيارات باستخدام `models.mode: "merge"` حتى تظل النماذج الاحتياطية متاحة مع احترام المزوّد ذي المنطقة المحددة الذي اخترته.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (وWindows عبر WSL2). وMac mini اختياري - فبعض الأشخاص
    يشترونه كمضيف دائم التشغيل، لكن VPS صغيرًا أو خادمًا منزليًا أو جهازًا من فئة Raspberry Pi يصلح أيضًا.

    تحتاج إلى Mac **فقط لأدوات macOS فقط**. وبالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) (موصى به) - يعمل خادم BlueBubbles على أي Mac، ويمكن أن تعمل Gateway على Linux أو في مكان آخر. وإذا كنت تريد أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على Mac أو أقرن Node يعمل على macOS.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)، [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **أي جهاز macOS** مسجل الدخول إلى Messages. ولا **يشترط** أن يكون Mac mini -
    أي جهاز Mac يصلح. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** (موصى به) لـ iMessage - يعمل خادم BlueBubbles على macOS، بينما يمكن أن تعمل Gateway على Linux أو في مكان آخر.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي Mac مسجل الدخول إلى Messages.
    - شغّل كل شيء على جهاز Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)،
    [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، هل يمكنني وصله بـ MacBook Pro؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لـ MacBook Pro الاتصال به بوصفه
    **Node** (جهازًا مرافقًا). لا تقوم Nodes بتشغيل Gateway - بل توفّر
    قدرات إضافية مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - تشغيل Gateway على Mac mini (دائم التشغيل).
    - يقوم MacBook Pro بتشغيل تطبيق macOS أو مضيف Node ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    الوثائق: [Nodes](/ar/nodes)، [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُوصى باستخدام Bun. فنحن نرى أخطاء وقت تشغيل، خاصةً مع WhatsApp وTelegram.
    استخدم **Node** من أجل Gateways مستقرة.

    وإذا كنت لا تزال تريد التجربة باستخدام Bun، فافعل ذلك على Gateway غير إنتاجية
    من دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ماذا يوضع في allowFrom؟">
    إن `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram البشري المُرسل** (رقمي). وليس اسم مستخدم الروبوت.

    يطلب الإعداد معرّفات مستخدمين رقمية فقط. وإذا كانت لديك بالفعل إدخالات قديمة من نوع `@username` في التهيئة، فيمكن لـ `openclaw doctor --fix` محاولة تحليلها.

    الطريقة الأكثر أمانًا (من دون روبوت تابع لجهة خارجية):

    - أرسل رسالة خاصة إلى روبوتك، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة خاصة إلى روبوتك، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    طرف ثالث (خصوصية أقل):

    - أرسل رسالة خاصة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع نسخ OpenClaw مختلفة؟">
    نعم، عبر **التوجيه متعدد الوكلاء**. اربط **الرسائل الخاصة** الخاصة بـ WhatsApp لكل مُرسل (النظير `kind: "direct"`، ومعرّف المُرسل E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمله ومخزن جلساته الخاصين. ولا تزال الردود تأتي من **حساب WhatsApp نفسه**، ويظل التحكم في وصول الرسائل الخاصة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عامًا لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "دردشة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزود أو أقران محددين) بكل وكيل. يوجد مثال للتهيئة في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[التهيئة](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux (Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا كنت تشغّل OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew الخاصة بك) حتى يتم تحليل الأدوات المثبتة عبر `brew` في القواقع غير الخاصة بتسجيل الدخول.
    كما تضيف البنيات الحديثة أيضًا مسبقًا أدلة bin الشائعة للمستخدم في خدمات Linux systemd (مثل `~/.local/bin` و`~/.npm-global/bin` و`~/.local/share/pnpm` و`~/.bun/bin`) وتحترم `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند تعيينها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للتعديل وتثبيت npm">
    - **تثبيت hackable (git):** نسخة مصدر كاملة، قابلة للتعديل، وهي الأفضل للمساهمين.
      تقوم بتشغيل البنيات محليًا ويمكنك تصحيح الكود/الوثائق.
    - **تثبيت npm:** تثبيت CLI عام، من دون مستودع، وهو الأفضل إذا كنت تريد "تشغيله فقط".
      تأتي التحديثات من وسوم npm dist-tags.

    الوثائق: [البدء](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل لاحقًا بين تثبيتات npm وgit؟">
    نعم. ثبّت النوع الآخر، ثم شغّل Doctor حتى تشير خدمة gateway إلى نقطة الدخول الجديدة.
    هذا **لا يحذف بياناتك** - بل يغيّر فقط تثبيت كود OpenClaw. وتبقى حالتك
    (`~/.openclaw`) ومساحة العمل (`~/.openclaw/workspace`) من دون تغيير.

    من npm إلى git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    من git إلى npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    يكتشف Doctor عدم تطابق نقطة دخول خدمة gateway ويعرض إعادة كتابة تهيئة الخدمة لتطابق التثبيت الحالي (استخدم `--repair` في الأتمتة).

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](#أين-توجد-الأشياء-على-القرص).

  </Accordion>

  <Accordion title="هل ينبغي أن أشغّل Gateway على الحاسوب المحمول أم على VPS؟">
    الإجابة القصيرة: **إذا كنت تريد موثوقية على مدار الساعة، فاستخدم VPS**. وإذا كنت تريد
    أقل قدر من الاحتكاك ولا تمانع النوم/إعادة التشغيل، فشغّلها محليًا.

    **الحاسوب المحمول (Gateway محلية)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح مرئية.
    - **السلبيات:** النوم/انقطاع الشبكة = انقطاعات، تحديثات/إعادات تشغيل نظام التشغيل تقطع العمل، ويجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** دائم التشغيل، شبكة مستقرة، لا توجد مشكلات نوم الحاسوب المحمول، وأسهل في الإبقاء عليه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل من دون واجهة (استخدم لقطات الشاشة)، وصول إلى الملفات عن بُعد فقط، ويجب أن تستخدم SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp وTelegram وSlack وMattermost وDiscord جميعها جيدًا من VPS. والمقايضة الحقيقية الوحيدة هي **متصفح بلا واجهة** مقابل نافذة مرئية. راجع [Browser](/ar/tools/browser).

    **الإعداد الافتراضي الموصى به:** VPS إذا واجهت انقطاعات في gateway من قبل. أما التشغيل المحلي فهو رائع عندما تكون تستخدم Mac بنشاط وتريد وصولًا محليًا إلى الملفات أو أتمتة واجهة المستخدم مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به من أجل الموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** دائم التشغيل، عدد أقل من الانقطاعات بسبب النوم/إعادة التشغيل، أذونات أنظف، وأسهل في الإبقاء عليه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات عند نوم الجهاز أو تحديثه.

    إذا كنت تريد أفضل ما في العالمين، فأبقِ Gateway على مضيف مخصص وأقرن حاسوبك المحمول بوصفه **Node** لأدوات الشاشة/الكاميرا/exec المحلية. راجع [Nodes](/ar/nodes).
    ولإرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS ونظام التشغيل الموصى به؟">
    OpenClaw خفيف الوزن. بالنسبة إلى Gateway أساسية + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، و1GB RAM، وحوالي 500MB من القرص.
    - **الموصى به:** 1-2 vCPU، و2GB RAM أو أكثر كهامش إضافي (للسجلات، والوسائط، والقنوات المتعددة). يمكن أن تكون أدوات Node وأتمتة المتصفح شرهة للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). مسار التثبيت على Linux هو الأكثر اختبارًا هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw داخل VM وما المتطلبات؟">
    نعم. تعامل مع VM كما تتعامل مع VPS: يجب أن تكون دائمة التشغيل، وقابلة للوصول، وتملك
    ما يكفي من RAM لـ Gateway وأي قنوات تقوم بتمكينها.

    إرشادات أساسية:

    - **الحد الأدنى المطلق:** 1 vCPU، و1GB RAM.
    - **الموصى به:** 2GB RAM أو أكثر إذا كنت تشغّل عدة قنوات، أو أتمتة متصفح، أو أدوات وسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو أسهل إعداد بنمط VM** ويملك أفضل توافق
    مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    وإذا كنت تشغّل macOS داخل VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw في فقرة واحدة؟">
    OpenClaw هو مساعد AI شخصي تقوم بتشغيله على أجهزتك الخاصة. يرد على أسطح المراسلة التي تستخدمها بالفعل (WhatsApp وTelegram وSlack وMattermost وDiscord وGoogle Chat وSignal وiMessage وWebChat وPlugins القنوات المضمّنة مثل QQ Bot)، ويمكنه أيضًا تنفيذ الصوت + Canvas حي على المنصات المدعومة. إن **Gateway** هي طبقة التحكم الدائمة التشغيل؛ أما المساعد فهو المنتج.
  </Accordion>

  <Accordion title="عرض القيمة">
    OpenClaw ليس "مجرد غلاف لـ Claude". إنه **طبقة تحكم محلية أولًا** تتيح لك تشغيل
    مساعد قوي على **عتادك الخاص**، ويمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - من دون تسليم التحكم في تدفقات عملك إلى
    SaaS مستضاف.

    أبرز النقاط:

    - **أجهزتك، بياناتك:** شغّل Gateway أينما تريد (Mac أو Linux أو VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليًا.
    - **قنوات حقيقية، لا بيئة ويب معزولة:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage وغيرها،
      بالإضافة إلى الصوت على الهاتف وCanvas على المنصات المدعومة.
    - **غير مقيد بنموذج واحد:** استخدم Anthropic وOpenAI وMiniMax وOpenRouter وغيرها، مع توجيه
      لكل وكيل وتحويل احتياطي.
    - **خيار محلي فقط:** شغّل نماذج محلية بحيث **يمكن أن تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة أو حساب أو مهمة، ولكل منهم
      مساحة عمله وإعداداته الافتراضية الخاصة.
    - **مفتوح المصدر وقابل للتعديل:** افحصه، ووسّعه، واستضفه ذاتيًا من دون ارتهان لمزوّد.

    الوثائق: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [متعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا ينبغي أن أفعل أولًا؟">
    مشاريع أولى جيدة:

    - بناء موقع ويب (WordPress أو Shopify أو موقع ثابت بسيط).
    - إعداد نموذج أولي لتطبيق جوال (المخطط، والشاشات، وخطة API).
    - تنظيم الملفات والمجلدات (التنظيف، والتسمية، ووضع العلامات).
    - ربط Gmail وأتمتة الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل شكل عندما تقسّمها إلى مراحل
    وتستخدم الوكلاء الفرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أهم خمس حالات استخدام يومية لـ OpenClaw؟">
    عادةً ما تبدو المكاسب اليومية كما يلي:

    - **إحاطات شخصية:** ملخصات للبريد الوارد، والتقويم، والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع، وملخصات، ومسودات أولى للرسائل الإلكترونية أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ Cron أو Heartbeat.
    - **أتمتة المتصفح:** تعبئة النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **التنسيق بين الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway تشغّلها على خادم، وتلقَّ النتيجة مرة أخرى في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw المساعدة في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات لـ SaaS؟">
    نعم بالنسبة إلى **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص إعلانية.

    أما بالنسبة إلى **التواصل أو تشغيل الإعلانات**، فأبقِ إنسانًا داخل الحلقة. تجنب
    البريد المزعج، واتبع القوانين المحلية وسياسات المنصات، وراجع أي شيء قبل إرساله.
    النمط الأكثر أمانًا هو أن يقوم OpenClaw بالصوغ وأنت توافق.

    الوثائق: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنةً بـ Claude Code في تطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا عن IDE. استخدم
    Claude Code أو Codex لأسرع حلقة برمجة مباشرة داخل مستودع. واستخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيق الأدوات.

    المزايا:

    - **ذاكرة + مساحة عمل دائمة** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp وTelegram وTUI وWebChat)
    - **تنسيق الأدوات** (المتصفح، والملفات، والجدولة، وhooks)
    - **Gateway دائمة التشغيل** (شغّلها على VPS، وتفاعل معها من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/exec المحلية

    العرض: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills من دون إبقاء المستودع متسخًا؟">
    استخدم التجاوزات المُدارة بدلًا من تحرير نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). تكون الأولوية كالتالي: `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المضمّنة ← `skills.load.extraDirs`، لذلك تظل التجاوزات المُدارة تتفوق على Skills المضمّنة من دون لمس git. وإذا كنت تحتاج إلى تثبيت Skill على مستوى عام لكن يجب أن تكون مرئية لبعض الوكلاء فقط، فأبقِ النسخة المشتركة في `~/.openclaw/skills` وتحكّم في الإظهار عبر `agents.defaults.skills` و`agents.list[].skills`. وينبغي فقط أن تعيش التعديلات الجديرة بالرفع upstream داخل المستودع وتُرسل كـ PRs.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). يكون ترتيب الأولوية الافتراضي هو `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المضمّنة ← `skills.load.extraDirs`. يقوم `clawhub` بالتثبيت في `./skills` افتراضيًا، ويتعامل OpenClaw معها على أنها `<workspace>/skills` في الجلسة التالية. وإذا كان ينبغي أن تكون Skill مرئية فقط لوكلاء محددين، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **وظائف Cron**: يمكن للوظائف المعزولة تعيين تجاوز `model` لكل وظيفة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين لديهم نماذج افتراضية مختلفة.
    - **التبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [وظائف Cron](/ar/automation/cron-jobs)، و[التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد الروبوت أثناء أداء عمل ثقيل. كيف أنقل ذلك إلى جهة أخرى؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلستهم الخاصة،
    ويعيدون ملخصًا، ويحافظون على استجابة الدردشة الرئيسية.

    اطلب من الروبوت "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` داخل الدردشة لرؤية ما الذي تفعله Gateway الآن (وما إذا كانت مشغولة).

    نصيحة تتعلق بالرموز: المهام الطويلة والوكلاء الفرعيون يستهلكون الرموز. وإذا كانت الكلفة مصدر قلق، فعيّن
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكلاء الفرعيين المرتبطة بالسلاسل على Discord؟">
    استخدم روابط السلاسل. يمكنك ربط سلسلة Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في تلك السلسلة على تلك الجلسة المرتبطة.

    التدفق الأساسي:

    - أنشئ عبر `sessions_spawn` باستخدام `thread: true` (واختياريًا `mode: "session"` للمتابعة الدائمة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل السلسلة.

    التهيئة المطلوبة:

    - القيم الافتراضية العامة: `session.threadBindings.enabled` و`session.threadBindings.idleHours` و`session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled` و`channels.discord.threadBindings.idleHours` و`channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند الإنشاء: عيّن `channels.discord.threadBindings.spawnSubagentSessions: true`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع التهيئة](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="اكتمل وكيل فرعي، لكن تحديث الاكتمال ذهب إلى المكان الخطأ أو لم يُنشر مطلقًا. ما الذي يجب أن أتحقق منه؟">
    تحقّق أولًا من مسار الطالب الذي تم تحليله:

    - يفضّل تسليم الوكيل الفرعي في وضع الاكتمال أي سلسلة أو مسار محادثة مرتبط عندما يكون موجودًا.
    - إذا كان أصل الاكتمال يحمل قناة فقط، يعود OpenClaw إلى المسار المخزّن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يظل التسليم المباشر ممكنًا.
    - إذا لم يوجد لا مسار مرتبط ولا مسار مخزّن صالح للاستخدام، فقد يفشل التسليم المباشر وتسقط النتيجة بدلًا من ذلك إلى تسليم جلسة في قائمة الانتظار بدل النشر الفوري في الدردشة.
    - قد تفرض الأهداف غير الصالحة أو القديمة أيضًا الرجوع إلى قائمة الانتظار أو فشل التسليم النهائي.
    - إذا كان آخر رد مرئي للمساعد في الوكيل الابن هو الرمز الصامت الدقيق `NO_REPLY` / `no_reply`، أو `ANNOUNCE_SKIP` تمامًا، فإن OpenClaw يكبت الإعلان عمدًا بدلًا من نشر تقدم أقدم قديم.
    - إذا انتهت مهلة الوكيل الابن بعد استدعاءات أدوات فقط، فقد يختصر الإعلان ذلك إلى ملخص قصير للتقدم الجزئي بدلًا من إعادة تشغيل خرج الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا تعمل Cron أو التذكيرات. ما الذي يجب أن أتحقق منه؟">
    تعمل Cron داخل عملية Gateway. وإذا لم تكن Gateway تعمل بشكل مستمر،
    فلن تعمل الوظائف المجدولة.

    قائمة تحقق:

    - تأكد من أن cron مفعّلة (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير مضبوط.
    - تحقّق من أن Gateway تعمل على مدار الساعة (من دون نوم/إعادات تشغيل).
    - تحقّق من إعدادات المنطقة الزمنية للوظيفة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يتم إرسال شيء إلى القناة. لماذا؟">
    تحقّق من وضع التسليم أولًا:

    - يعني `--no-deliver` / `delivery.mode: "none"` أنه لا يُتوقع إرسال احتياطي من المشغّل.
    - يعني غياب هدف إعلان صالح أو عدم صحته (`channel` / `to`) أن المشغّل تخطى التسليم الصادر.
    - تعني إخفاقات مصادقة القناة (`unauthorized`، `Forbidden`) أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمدًا، لذلك يكبت المشغّل أيضًا التسليم الاحتياطي من قائمة الانتظار.

    بالنسبة إلى وظائف cron المعزولة، لا يزال بإمكان الوكيل الإرسال مباشرة باستخدام أداة `message`
    عندما يكون مسار دردشة متاحًا. يتحكم `--announce` فقط في مسار الرجوع الخاص بالمشغّل
    للنص النهائي الذي لم يرسله الوكيل بالفعل.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّلت عملية cron معزولة النماذج أو أعادت المحاولة مرة واحدة؟">
    يكون هذا عادةً مسار تبديل النموذج الحي، وليس جدولة مكررة.

    يمكن لـ cron المعزولة أن تحفظ عملية تسليم نموذج وقت التشغيل وتعيد المحاولة عندما
    تُطلق العملية النشطة `LiveSessionModelSwitchError`. وتحافظ إعادة المحاولة على
    المزود/النموذج المُبدَّل، وإذا حمل التبديل تجاوزًا جديدًا لملف تعريف المصادقة، فإن cron
    تحفظه أيضًا قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يفوز أولًا تجاوز نموذج Gmail hook عند انطباقه.
    - ثم `model` لكل وظيفة.
    - ثم أي تجاوز نموذج مخزّن لجلسة cron.
    - ثم اختيار النموذج العادي للوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولى إضافة إلى إعادتَي محاولة للتبديل،
    تُجهض cron بدلًا من الدوران إلى ما لا نهاية.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبّت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو ضع Skills داخل مساحة عملك. لا تتوفر واجهة Skills الخاصة بـ macOS على Linux.
    تصفّح Skills على [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    يكتب `openclaw skills install` الأصلي داخل دليل `skills/` في مساحة العمل النشطة.
    ثبّت CLI المنفصل `clawhub` فقط إذا كنت تريد النشر أو
    مزامنة Skills الخاصة بك. وبالنسبة إلى التثبيتات المشتركة بين الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا كنت تريد تضييق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw تشغيل المهام وفق جدول زمني أو باستمرار في الخلفية؟">
    نعم. استخدم المجدول في Gateway:

    - **وظائف Cron** للمهام المجدولة أو المتكررة (تستمر عبر عمليات إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية "للجلسة الرئيسية".
    - **وظائف معزولة** لوكلاء مستقلين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ macOS فقط من Linux؟">
    ليس مباشرة. يتم تقييد Skills الخاصة بـ macOS بواسطة `metadata.openclaw.os` إضافة إلى الثنائيات المطلوبة، ولا تظهر Skills في system prompt إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن يتم تحميل Skills المقصورة على `darwin` (مثل `apple-notes` و`apple-reminders` و`things-mac`) ما لم تتجاوز هذا التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - شغّل Gateway على Mac (الأبسط).**
    شغّل Gateway حيث توجد ثنائيات macOS، ثم اتصل من Linux في [الوضع البعيد](#منافذ-gateway-تعمل-بالفعل-والوضع-البعيد) أو عبر Tailscale. وسيتم تحميل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار B - استخدم Node يعمل على macOS (من دون SSH).**
    شغّل Gateway على Linux، وأقرن Node يعمل على macOS (تطبيق شريط القوائم)، واضبط **Node Run Commands** على "Always Ask" أو "Always Allow" على جهاز Mac. يمكن لـ OpenClaw التعامل مع Skills الخاصة بـ macOS فقط على أنها مؤهلة عندما تكون الثنائيات المطلوبة موجودة على Node. ويشغّل الوكيل تلك Skills عبر أداة `nodes`. وإذا اخترت "Always Ask"، فإن الموافقة على "Always Allow" في المطالبة تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار C - مرّر ثنائيات macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل ثنائيات CLI المطلوبة تُحل إلى أغلفة SSH تعمل على جهاز Mac. ثم تجاوز Skill للسماح بـ Linux بحيث تبقى مؤهلة.

    1. أنشئ غلاف SSH للثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع الغلاف في `PATH` على مضيف Linux (مثل `~/bin/memo`).
    3. تجاوز metadata الخاصة بالـ Skill (في مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

       ```markdown
       ---
       name: apple-notes
       description: إدارة Apple Notes عبر CLI `memo` على macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. ابدأ جلسة جديدة حتى يتم تحديث snapshot الخاص بالـ Skills.

  </Accordion>

  <Accordion title="هل لديكم تكامل Notion أو HeyGen؟">
    ليس مضمّنًا اليوم.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل لوصول API موثوق (لكل من Notion وHeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل من دون كود لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد الاحتفاظ بالسياق لكل عميل (في تدفقات عمل الوكالات)، فهناك نمط بسيط:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    وإذا كنت تريد تكاملًا أصليًا، فافتح طلب ميزة أو ابنِ Skill
    تستهدف تلك الواجهات البرمجية.

    ثبّت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل التثبيتات الأصلية إلى دليل `skills/` في مساحة العمل النشطة. وبالنسبة إلى Skills المشتركة بين الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. وإذا كان ينبغي أن ترى بعض الوكلاء فقط تثبيتًا مشتركًا، فقم بتهيئة `agents.defaults.skills` أو `agents.list[].skills`. وتتوقع بعض Skills وجود ثنائيات مثبّتة عبر Homebrew؛ وعلى Linux يعني هذا Linuxbrew (راجع إدخال الأسئلة الشائعة الخاص بـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[تهيئة Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الحالي المسجل دخوله مع OpenClaw؟">
    استخدم ملف تعريف المتصفح المضمّن `user`، الذي يتصل عبر Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    وإذا كنت تريد اسمًا مخصصًا، فأنشئ ملف تعريف MCP صريحًا:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو Browser Node متصل. وإذا كانت Gateway تعمل في مكان آخر، فإما أن تشغّل مضيف Node على جهاز المتصفح أو تستخدم CDP بعيدًا بدلًا من ذلك.

    القيود الحالية على `existing-session` / `user`:

    - الإجراءات تعتمد على المراجع ref، وليست معتمدة على محددات CSS
    - تتطلب الرفعات `ref` / `inputRef` وتدعم حاليًا ملفًا واحدًا في كل مرة
    - لا تزال `responsebody`، وتصدير PDF، واعتراض التنزيلات، والإجراءات الدفعية تحتاج إلى متصفح مُدار أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل والذاكرة

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). ولإعداد Docker الخاص (Gateway كاملة داخل Docker أو صور sandbox)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدودًا - كيف أمكّن الميزات الكاملة؟">
    الصورة الافتراضية تضع الأمان أولًا وتعمل كمستخدم `node`، لذلك فهي لا
    تتضمن حزم النظام، أو Homebrew، أو المتصفحات المضمّنة. وللحصول على إعداد أكمل:

    - اجعل `/home/node` مستمرًا باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المخبأة.
    - ادمج تبعيات النظام في الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمّن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - عيّن `PLAYWRIGHT_BROWSERS_PATH` وتأكد من بقاء ذلك المسار.

    الوثائق: [Docker](/ar/install/docker)، [Browser](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل الخاصة شخصية لكن جعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كانت الحركة الخاصة لديك هي **الرسائل الخاصة** وكانت الحركة العامة لديك هي **المجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` بحيث تعمل جلسات المجموعات/القنوات (المفاتيح غير الرئيسية) داخل الواجهة الخلفية المعزولة المهيأة، بينما تبقى جلسة الرسائل الخاصة الرئيسية على المضيف. ويكون Docker هو الواجهة الخلفية الافتراضية إذا لم تختر غيره. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال التهيئة: [المجموعات: رسائل خاصة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع التهيئة الأساسي: [تهيئة Gateway](/ar/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلدًا من المضيف داخل sandbox؟">
    عيّن `agents.defaults.sandbox.docker.binds` إلى `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). يتم دمج الروابط العامة + روابط كل وكيل؛ ويتم تجاهل روابط كل وكيل عندما يكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس، وتذكّر أن الروابط تتجاوز جدران نظام ملفات sandbox.

    يتحقق OpenClaw من مصادر الربط مقابل كل من المسار المطبع والمسار القانوني الذي يتم تحليله عبر أعمق أصل موجود. وهذا يعني أن عمليات الهروب عبر آباء الروابط الرمزية لا تزال تفشل بشكل مغلق حتى عندما لا يكون مقطع المسار الأخير موجودًا بعد، كما أن فحوصات الجذور المسموح بها تظل مطبقة بعد تحليل الروابط الرمزية.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للاطلاع على أمثلة وملاحظات السلامة.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw هي مجرد ملفات Markdown داخل مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات منسقة طويلة الأمد في `MEMORY.md` (للجلسات الرئيسية/الخاصة فقط)

    كما يشغّل OpenClaw أيضًا **تفريغ ذاكرة صامتًا قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. ولا يعمل هذا إلا عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه sandboxes للقراءة فقط). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="الذاكرة تستمر في نسيان الأشياء. كيف أجعلها ثابتة؟">
    اطلب من الروبوت أن **يكتب الحقيقة في الذاكرة**. تنتمي الملاحظات طويلة الأمد إلى `MEMORY.md`،
    أما السياق قصير الأمد فيذهب إلى `memory/YYYY-MM-DD.md`.

    لا يزال هذا مجالًا نعمل على تحسينه. ومن المفيد تذكير النموذج بتخزين الذكريات؛
    فهو سيعرف ما يجب فعله. وإذا استمر في النسيان، فتحقق من أن Gateway تستخدم مساحة العمل نفسها
    في كل تشغيل.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر الذاكرة إلى الأبد؟ ما الحدود؟">
    توجد ملفات الذاكرة على القرص وتستمر حتى تحذفها. والحد هو
    سعتك التخزينية، وليس النموذج. أما **سياق الجلسة** فلا يزال محدودًا بنافذة
    سياق النموذج، لذلك قد يتم Compaction أو اقتطاع المحادثات الطويلة. ولهذا السبب
    يوجد بحث الذاكرة - فهو يعيد فقط الأجزاء ذات الصلة إلى السياق.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب البحث الدلالي في الذاكرة مفتاح OpenAI API؟">
    نعم، ولكن فقط إذا كنت تستخدم **OpenAI embeddings**. يغطي Codex OAuth الدردشة/الإكمالات
    و**لا** يمنح وصولًا إلى embeddings، لذلك فإن **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يفيد في البحث الدلالي في الذاكرة. ولا تزال OpenAI embeddings
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تعيّن مزودًا بشكل صريح، فسيختار OpenClaw مزودًا تلقائيًا عندما
    يتمكن من تحليل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    وهو يفضّل OpenAI إذا أمكن تحليل مفتاح OpenAI، وإلا Gemini إذا أمكن تحليل مفتاح Gemini،
    ثم Voyage، ثم Mistral. وإذا لم يكن هناك مفتاح بعيد متاح، يبقى بحث الذاكرة
    معطلًا حتى تقوم بتهيئته. وإذا كان لديك مسار نموذج محلي
    مهيأ وموجود، فإن OpenClaw
    يفضّل `local`. ويُدعم Ollama عندما تعيّن صراحةً
    `memorySearch.provider = "ollama"`.

    وإذا كنت تفضّل البقاء محليًا، فعيّن `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). وإذا كنت تريد Gemini embeddings، فعيّن
    `memorySearch.provider = "gemini"` ووفّر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). نحن ندعم نماذج embedding من **OpenAI وGemini وVoyage وMistral وOllama أو local**
    - راجع [الذاكرة](/ar/concepts/memory) للحصول على تفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل يتم حفظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية لا تزال ترى ما ترسله إليها**.

    - **محلي افتراضيًا:** الجلسات، وملفات الذاكرة، والتهيئة، ومساحة العمل توجد على مضيف Gateway
      (`~/.openclaw` + دليل مساحة العمل لديك).
    - **بعيد بحكم الضرورة:** الرسائل التي ترسلها إلى مزودي النماذج (Anthropic/OpenAI/إلخ) تذهب إلى
      واجهات API الخاصة بهم، كما تخزن منصات الدردشة (WhatsApp/Telegram/Slack/إلخ) بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في البصمة:** يؤدي استخدام نماذج محلية إلى إبقاء prompts على جهازك، لكن
      حركة القناة لا تزال تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء يوجد تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | التهيئة الرئيسية (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، ومفاتيح API، و`keyRef`/`tokenRef` الاختياريان) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة أسرار اختيارية مدعومة بملف لمزوّدي `file` SecretRef         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُنظف منه إدخالات `api_key` الثابتة)              |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة المزوّد (مثل `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة لكل وكيل (agentDir + sessions)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات تعريف الجلسة (لكل وكيل)                                     |

    المسار القديم للوكيل الواحد: `~/.openclaw/agent/*` (يُرحّله `openclaw doctor`).

    إن **مساحة العمل** الخاصة بك (AGENTS.md، وملفات الذاكرة، وSkills، وما إلى ذلك) منفصلة ويتم تهيئتها عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    توجد هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md` و`SOUL.md` و`IDENTITY.md` و`USER.md`،
      و`MEMORY.md` (أو الاحتياطي القديم `memory.md` عندما يكون `MEMORY.md` غائبًا)،
      و`memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياريًا.
    - **دليل الحالة (`~/.openclaw`)**: التهيئة، وحالة القناة/المزوّد، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن تهيئتها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا كان الروبوت "ينسى" بعد إعادة التشغيل، فتأكد من أن Gateway تستخدم مساحة العمل نفسها
    في كل تشغيل (وتذكّر: يستخدم الوضع البعيد مساحة عمل **مضيف gateway**
    وليس الحاسوب المحمول المحلي لديك).

    نصيحة: إذا كنت تريد سلوكًا أو تفضيلًا دائمًا، فاطلب من الروبوت أن **يكتبه في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** الخاصة بك في مستودع git **خاص** وأنشئ لها نسخة احتياطية
    في مكان خاص (مثل GitHub private). وهذا يلتقط الذاكرة + ملفات AGENTS/SOUL/USER
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    **لا** تلتزم بأي شيء تحت `~/.openclaw` (بيانات الاعتماد، أو الجلسات، أو الرموز المميزة، أو حمولة الأسرار المشفرة).
    وإذا كنت تحتاج إلى استعادة كاملة، فأنشئ نسخة احتياطية لكل من مساحة العمل ودليل الحالة
    بشكل منفصل (راجع سؤال الترحيل أعلاه).

    الوثائق: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إلغاء التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. إن مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست sandbox صارمة.
    تُحل المسارات النسبية داخل مساحة العمل، لكن يمكن للمسارات المطلقة الوصول إلى
    مواقع أخرى على المضيف ما لم يكن العزل مفعّلًا. وإذا كنت تحتاج إلى عزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات sandbox لكل وكيل. وإذا كنت
    تريد أن يكون مستودع ما هو دليل العمل الافتراضي، فوجّه
    `workspace` لذلك الوكيل إلى جذر المستودع. إن مستودع OpenClaw هو مجرد كود مصدر؛ أبقِ
    مساحة العمل منفصلة ما لم تكن تريد عمدًا أن يعمل الوكيل داخله.

    مثال (المستودع بوصفه cwd الافتراضي):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="الوضع البعيد: أين يوجد مخزن الجلسات؟">
    تكون حالة الجلسة مملوكة لـ **مضيف gateway**. إذا كنت في الوضع البعيد، فإن مخزن الجلسات الذي يهمك يوجد على الجهاز البعيد، وليس على الحاسوب المحمول المحلي لديك. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات التهيئة

<AccordionGroup>
  <Accordion title="ما تنسيق التهيئة؟ وأين توجد؟">
    يقرأ OpenClaw تهيئة **JSON5** اختيارية من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، فإنه يستخدم قيمًا افتراضية آمنة إلى حد ما (بما في ذلك مساحة عمل افتراضية `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='لقد عيّنت gateway.bind: "lan" (أو "tailnet") والآن لا شيء يستمع / تقول واجهة المستخدم unauthorized'>
    تتطلب عمليات الربط غير الخاصة بـ loopback **مسار مصادقة صالح لـ gateway**. وعمليًا يعني ذلك:

    - مصادقة shared-secret: رمز مميز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي غير loopback ومدرك للهوية ومهيأ بشكل صحيح

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    ملاحظات:

    - لا تؤدي `gateway.remote.token` / `.password` إلى تمكين مصادقة gateway المحلية بمفردها.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كرجوع فقط عندما تكون `gateway.auth.*` غير مضبوطة.
    - بالنسبة إلى مصادقة كلمة المرور، عيّن بدلًا من ذلك `gateway.auth.mode: "password"` مع `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا تم تهيئة `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وكانت غير قابلة للتحليل، يفشل التحليل بشكل مغلق (من دون إخفاء الرجوع البعيد).
    - تصادق إعدادات Control UI ذات shared-secret عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزّنة في إعدادات التطبيق/واجهة المستخدم). أما الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` فتستخدم رؤوس الطلبات بدلًا من ذلك. تجنب وضع shared secrets في عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، لا تزال الوكلاء العكسية ذات loopback على المضيف نفسه **لا** تستوفي مصادقة trusted-proxy. يجب أن يكون trusted proxy مصدرًا غير loopback مهيأً.

  </Accordion>

  <Accordion title="لماذا أحتاج الآن إلى رمز مميز على localhost؟">
    يفرض OpenClaw مصادقة gateway افتراضيًا، بما في ذلك loopback. وفي المسار الافتراضي العادي يعني ذلك مصادقة الرمز المميز: إذا لم يُهيأ مسار مصادقة صريح، فإن بدء تشغيل gateway يحل إلى وضع الرمز المميز ويولّد واحدًا تلقائيًا ويحفظه في `gateway.auth.token`، لذلك **يجب على عملاء WS المحليين المصادقة**. وهذا يمنع العمليات المحلية الأخرى من استدعاء Gateway.

    وإذا كنت تفضّل مسار مصادقة مختلفًا، فيمكنك اختيار وضع كلمة المرور صراحةً (أو، بالنسبة إلى الوكلاء العكسيين غير loopback والمدركين للهوية، `trusted-proxy`). وإذا كنت **حقًا** تريد loopback مفتوحًا، فعيّن `gateway.auth.mode: "none"` صراحةً في التهيئة. ويمكن لـ Doctor إنشاء رمز مميز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير التهيئة؟">
    تراقب Gateway التهيئة وتدعم إعادة التحميل السريع:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): يطبّق التغييرات الآمنة سريعًا، ويعيد التشغيل للتغييرات الحرجة
    - كما أن `hot` و`restart` و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطّل العبارات الطريفة في CLI؟">
    عيّن `cli.banner.taglineMode` في التهيئة:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: يُخفي نص العبارة مع الإبقاء على سطر عنوان الشعار/الإصدار.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات طريفة/موسمية متناوبة (السلوك الافتراضي).
    - إذا كنت لا تريد أي شعار إطلاقًا، فعيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أمكّن web search (وweb fetch)؟">
    تعمل `web_fetch` من دون مفتاح API. أما `web_search` فتعتمد على
    المزوّد الذي اخترته:

    - يتطلب المزوّدون المعتمدون على API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily إعداد مفتاح API المعتاد.
    - إن Ollama Web Search لا تحتاج إلى مفتاح، لكنها تستخدم مضيف Ollama المهيأ لديك وتتطلب `ollama signin`.
    - إن DuckDuckGo لا تحتاج إلى مفتاح، لكنها تكامل غير رسمي قائم على HTML.
    - إن SearXNG لا تحتاج إلى مفتاح/مستضافة ذاتيًا؛ قم بتهيئة `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **الموصى به:** شغّل `openclaw configure --section web` واختر مزودًا.
    بدائل متغيرات البيئة:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` أو `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY` أو `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // اختياري؛ احذفه للاكتشاف التلقائي
            },
          },
        },
    }
    ```

    توجد الآن تهيئة web-search الخاصة بكل مزود تحت `plugins.entries.<plugin>.config.webSearch.*`.
    لا تزال مسارات المزود القديمة `tools.web.search.*` تُحمّل مؤقتًا من أجل التوافق، لكن لا ينبغي استخدامها في التهيئات الجديدة.
    توجد تهيئة الرجوع الخاصة بـ Firecrawl web-fetch تحت `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - تكون `web_fetch` مفعّلة افتراضيًا (ما لم يتم تعطيلها صراحةً).
    - إذا تم حذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزود رجوع جاهز لـ fetch من بيانات الاعتماد المتاحة. والمزوّد المضمّن اليوم هو Firecrawl.
    - تقرأ daemons متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="قام config.apply بمسح تهيئتي. كيف أستعيدها وأتجنب ذلك؟">
    يقوم `config.apply` باستبدال **التهيئة بأكملها**. وإذا أرسلت كائنًا جزئيًا، فسيتم
    حذف كل شيء آخر.

    يحمي OpenClaw الحالي من كثير من حالات الكتابة المدمّرة العرضية:

    - تتحقق عمليات كتابة التهيئة المملوكة لـ OpenClaw من التهيئة الكاملة بعد التغيير قبل الكتابة.
    - يتم رفض عمليات الكتابة المملوكة لـ OpenClaw غير الصالحة أو المدمّرة وحفظها باسم `openclaw.json.rejected.*`.
    - إذا أدت عملية تحرير مباشرة إلى كسر بدء التشغيل أو إعادة التحميل السريع، تستعيد Gateway آخر تهيئة سليمة معروفة وتحفظ الملف المرفوض باسم `openclaw.json.clobbered.*`.
    - يتلقى الوكيل الرئيسي تحذيرًا عند الإقلاع بعد الاستعادة حتى لا يعيد كتابة التهيئة السيئة بشكل أعمى.

    الاستعادة:

    - تحقّق من `openclaw logs --follow` بحثًا عن `Config auto-restored from last-known-good` أو `Config write rejected:` أو `config reload restored last-known-good config`.
    - افحص أحدث ملف `openclaw.json.clobbered.*` أو `openclaw.json.rejected.*` بجانب التهيئة النشطة.
    - أبقِ التهيئة النشطة المستعادة إذا كانت تعمل، ثم انسخ فقط المفاتيح المقصودة مرة أخرى باستخدام `openclaw config set` أو `config.patch`.
    - شغّل `openclaw config validate` و`openclaw doctor`.
    - إذا لم يكن لديك آخر نسخة سليمة معروفة أو حمولة مرفوضة، فاستعد من النسخة الاحتياطية، أو أعد تشغيل `openclaw doctor` وأعد تهيئة القنوات/النماذج.
    - إذا كان هذا غير متوقع، فافتح بلاغ خطأ وأرفق آخر تهيئة معروفة لديك أو أي نسخة احتياطية.
    - يمكن لوكيل برمجة محلي غالبًا إعادة بناء تهيئة عاملة من السجلات أو المحفوظات.

    تجنّبه:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` لعمليات التحرير التفاعلية.
    - استخدم أولًا `config.schema.lookup` عندما لا تكون متأكدًا من مسار دقيق أو شكل حقل؛ فهو يعيد عقدة schema سطحية مع ملخصات الأبناء المباشرين للتعمق.
    - استخدم `config.patch` لعمليات RPC الجزئية؛ واحتفظ بـ `config.apply` لاستبدال التهيئة الكاملة فقط.
    - إذا كنت تستخدم أداة `gateway` المخصصة للمالك فقط من تشغيل وكيل، فستظل ترفض الكتابات إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبّع إلى مسارات exec المحمية نفسها).

    الوثائق: [التهيئة](/cli/config)، [Configure](/cli/configure)، [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزية مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحدة** (مثل Raspberry Pi) إضافة إلى **nodes** و**agents**:

    - **Gateway (مركزية):** تملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **Nodes (الأجهزة):** تتصل أجهزة Mac/iOS/Android كأجهزة طرفية وتكشف الأدوات المحلية (`system.run` و`canvas` و`camera`).
    - **Agents (العمّال):** عقول/مساحات عمل منفصلة لأدوار خاصة (مثل "Hetzner ops" و"Personal data").
    - **الوكلاء الفرعيون:** أنشئ عملًا في الخلفية من وكيل رئيسي عندما تريد تنفيذًا متوازيًا.
    - **TUI:** اتصل بـ Gateway وبدّل بين الوكلاء/الجلسات.

    الوثائق: [Nodes](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/web/tui).

  </Accordion>

  <Accordion title="هل يمكن لمتصفح OpenClaw أن يعمل بلا واجهة؟">
    نعم. إنه خيار في التهيئة:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    القيمة الافتراضية هي `false` (بواجهة). ويكون الوضع بلا واجهة أكثر عرضة لتحفيز فحوصات مكافحة الروبوتات على بعض المواقع. راجع [Browser](/ar/tools/browser).

    يستخدم الوضع بلا واجهة **محرك Chromium نفسه** ويعمل مع معظم الأتمتة (النماذج، والنقرات، والكشط، وتسجيلات الدخول). والاختلافات الأساسية هي:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا كنت تحتاج إلى عناصر بصرية).
    - بعض المواقع أكثر تشددًا تجاه الأتمتة في الوضع بلا واجهة (CAPTCHAs، ومكافحة الروبوتات).
      على سبيل المثال، كثيرًا ما تحظر X/Twitter الجلسات بلا واجهة.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    عيّن `browser.executablePath` إلى ثنائي Brave لديك (أو أي متصفح قائم على Chromium) وأعد تشغيل Gateway.
    راجع أمثلة التهيئة الكاملة في [Browser](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways البعيدة وNodes

<AccordionGroup>
  <Accordion title="كيف تنتقل الأوامر بين Telegram وgateway وnodes؟">
    تتم معالجة رسائل Telegram بواسطة **gateway**. وتشغّل gateway الوكيل
    ثم فقط تستدعي nodes عبر **Gateway WebSocket** عندما تكون هناك حاجة إلى أداة node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    لا ترى Nodes حركة المزوّد الواردة؛ بل تستقبل فقط استدعاءات RPC الخاصة بـ node.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كانت Gateway مستضافة عن بُعد؟">
    الإجابة القصيرة: **أقرن حاسوبك بوصفه Node**. تعمل Gateway في مكان آخر، لكنها تستطيع
    استدعاء أدوات `node.*` (الشاشة، والكاميرا، والنظام) على جهازك المحلي عبر Gateway WebSocket.

    إعداد نموذجي:

    1. شغّل Gateway على المضيف الدائم التشغيل (VPS/خادم منزلي).
    2. ضع مضيف Gateway وحاسوبك على tailnet نفسها.
    3. تأكد من إمكانية الوصول إلى Gateway WS (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **Remote over SSH** (أو tailnet مباشرة)
       حتى يتمكن من التسجيل بوصفه Node.
    5. وافق على Node على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم أي جسر TCP منفصل؛ إذ تتصل Nodes عبر Gateway WebSocket.

    تذكير أمني: يتيح إقران Node تعمل على macOS تشغيل `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [Nodes](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [الوضع البعيد على macOS](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى ردودًا. ماذا الآن؟">
    تحقّق من الأساسيات:

    - هل Gateway تعمل: `openclaw gateway status`
    - سلامة Gateway: `openclaw status`
    - سلامة القناة: `openclaw channels status`

    ثم تحقّق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من أن `gateway.auth.allowTailscale` مضبوطة بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فتأكد من أن النفق المحلي يعمل ويشير إلى المنفذ الصحيح.
    - تأكد من أن قوائم السماح لديك (DM أو المجموعة) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول البعيد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لمثيلين من OpenClaw التحدث إلى بعضهما (محلي + VPS)؟">
    نعم. لا توجد وصلة "روبوت إلى روبوت" مضمّنة، لكن يمكنك توصيلهما بعدة
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يمكن لكلا الروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اطلب من Bot A إرسال رسالة إلى Bot B، ثم دع Bot B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل script يستدعي Gateway الأخرى باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع فيها الروبوت
    الآخر. وإذا كان أحد الروبوتين موجودًا على VPS بعيدة، فاجعل CLI لديك يشير إلى Gateway البعيدة
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يستطيع الوصول إلى Gateway المستهدفة):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجزًا وقائيًا حتى لا يدخل الروبوتان في حلقة لا تنتهي (الرد عند الذكر فقط، أو قوائم سماح للقنوات،
    أو قاعدة "لا ترد على رسائل الروبوتات").

    الوثائق: [الوصول البعيد](/ar/gateway/remote)، [Agent CLI](/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPS منفصلة لعدة وكلاء؟">
    لا. يمكن لـ Gateway واحدة استضافة عدة وكلاء، لكل منهم مساحة عمله، وإعداداته الافتراضية للنموذج،
    وتوجيهه. هذا هو الإعداد المعتاد، وهو أرخص وأبسط بكثير من تشغيل
    VPS واحدة لكل وكيل.

    استخدم VPS منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمان) أو
    تهيئات مختلفة جدًا لا تريد مشاركتها. وبخلاف ذلك، أبقِ Gateway واحدة
    واستخدم عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل هناك فائدة من استخدام Node على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - تُعد Nodes الطريقة الأساسية للوصول إلى حاسوبك المحمول من Gateway بعيدة، وهي
    تفتح أكثر من مجرد وصول shell. تعمل Gateway على macOS/Linux (وعلى Windows عبر WSL2) وهي
    خفيفة الوزن (VPS صغير أو جهاز من فئة Raspberry Pi مناسب؛ و4 GB RAM أكثر من كافية)، لذا فإن إعدادًا
    شائعًا هو مضيف دائم التشغيل إضافة إلى حاسوبك المحمول بوصفه Node.

    - **لا حاجة إلى SSH وارد.** تتصل Nodes إلى الخارج بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانًا.** يتم تقييد `system.run` بقوائم السماح/الموافقات الخاصة بالـ node على ذلك الحاسوب المحمول.
    - **أدوات أجهزة أكثر.** تكشف Nodes عن `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة متصفح محلية.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف node على الحاسوب المحمول، أو اتصل بـ Chrome المحلية على المضيف عبر Chrome MCP.

    إن SSH مناسبة للوصول العَرَضي إلى shell، لكن Nodes أبسط لتدفقات عمل الوكيل المستمرة
    وأتمتة الأجهزة.

    الوثائق: [Nodes](/ar/nodes)، [Nodes CLI](/cli/nodes)، [Browser](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تشغّل nodes خدمة gateway؟">
    لا. يجب أن تعمل **gateway واحدة** فقط لكل مضيف ما لم تكن تشغّل عمدًا ملفات تعريف معزولة (راجع [Gateways متعددة](/ar/gateway/multiple-gateways)). إن Nodes أجهزة طرفية تتصل
    بـ gateway (Nodes iOS/Android، أو "وضع node" على macOS في تطبيق شريط القوائم). وبالنسبة إلى
    مضيفي nodes بلا واجهة والتحكم عبر CLI، راجع [Node host CLI](/cli/node).

    يلزم إعادة تشغيل كاملة لتغييرات `gateway` و`discovery` و`canvasHost`.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق التهيئة؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة فرعية واحدة من التهيئة مع عقدة schema سطحية، وإشارة UI المطابقة، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + hash
    - `config.patch`: تحديث جزئي آمن (مفضّل لمعظم تعديلات RPC)؛ يعيد التحميل سريعًا عندما يكون ذلك ممكنًا ويعيد التشغيل عند الحاجة
    - `config.apply`: يتحقق من التهيئة الكاملة ويستبدلها؛ يعيد التحميل سريعًا عندما يكون ذلك ممكنًا ويعيد التشغيل عند الحاجة
    - لا تزال أداة وقت التشغيل `gateway` المخصصة للمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ وتُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="حد أدنى معقول من التهيئة لأول تثبيت">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يضبط هذا مساحة العمل لديك ويقيّد من يمكنه تشغيل الروبوت.

  </Accordion>

  <Accordion title="كيف أُعد Tailscale على VPS وأتصل من جهاز Mac؟">
    خطوات دنيا:

    1. **ثبّت وسجّل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ثبّت وسجّل الدخول على جهاز Mac**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى tailnet نفسها.
    3. **فعّل MagicDNS (موصى به)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يكون لـ VPS اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا كنت تريد Control UI من دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يُبقي هذا gateway مربوطة على loopback ويعرض HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل Node على Mac بـ Gateway بعيدة (Tailscale Serve)؟">
    يعرض Serve **Gateway Control UI + WS**. وتتصل Nodes عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS وMac على tailnet نفسها**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيقوم التطبيق بتمرير منفذ Gateway والاتصال بوصفه Node.
    3. **وافق على Node** على gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    الوثائق: [بروتوكول Gateway](/ar/gateway/protocol)، [Discovery](/ar/gateway/discovery)، [الوضع البعيد على macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل ينبغي أن أثبّت على حاسوب محمول ثانٍ أم أضيف Node فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (الشاشة/الكاميرا/exec) على الحاسوب المحمول الثاني، فأضفه بوصفه
    **Node**. فهذا يُبقي Gateway واحدة ويتجنب ازدواجية التهيئة. أدوات node المحلية
    حاليًا خاصة بـ macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانية فقط عندما تحتاج إلى **عزل صارم** أو إلى روبوتين منفصلين تمامًا.

    الوثائق: [Nodes](/ar/nodes)، [Nodes CLI](/cli/nodes)، [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل .env

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأم (shell، أو launchd/systemd، أو CI، وما إلى ذلك) ويحمّل أيضًا بالإضافة إلى ذلك:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطي عام من `~/.openclaw/.env` (المعروف أيضًا باسم `$OPENCLAW_STATE_DIR/.env`)

    لا يتجاوز أي من ملفي `.env` متغيرات البيئة الموجودة بالفعل.

    يمكنك أيضًا تعريف متغيرات بيئة مضمنة في التهيئة (تُطبَّق فقط إذا كانت مفقودة من process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    راجع [/environment](/ar/help/environment) للاطلاع على ترتيب الأولوية الكامل والمصادر.

  </Accordion>

  <Accordion title="بدأت Gateway عبر الخدمة واختفت متغيرات البيئة الخاصة بي. ماذا الآن؟">
    هناك إصلاحان شائعان:

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` حتى يتم التقاطها حتى عندما لا ترث الخدمة متغيرات البيئة من shell لديك.
    2. فعّل استيراد shell (ميزة راحة باشتراك اختياري):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    يؤدي هذا إلى تشغيل login shell لديك واستيراد المفاتيح المتوقعة المفقودة فقط (من دون تجاوز أبدًا). مكافئات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1` و`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='لقد عيّنت COPILOT_GITHUB_TOKEN، لكن models status تعرض "Shell env: off." لماذا؟'>
    تعرض `openclaw models status` ما إذا كان **استيراد shell env** مفعّلًا. لا تعني عبارة "Shell env: off"
    أن متغيرات البيئة لديك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    login shell الخاصة بك تلقائيًا.

    إذا كانت Gateway تعمل كخدمة (launchd/systemd)، فلن ترث بيئة
    shell لديك. أصلح ذلك عبر أحد الخيارات التالية:

    1. ضع الرمز المميز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في التهيئة (يُطبَّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل gateway وأعد التحقق:

    ```bash
    openclaw models status
    ```

    تتم قراءة رموز Copilot من `COPILOT_GITHUB_TOKEN` (وأيضًا `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والدردشات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد الجلسات تلقائيًا إذا لم أرسل /new أبدًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضيًا** (الافتراضي **0**).
    عيّنها إلى قيمة موجبة لتمكين انتهاء الصلاحية عند الخمول. وعند التمكين، تبدأ
    الرسالة **التالية** بعد فترة الخمول معرّف جلسة جديدًا لمفتاح الدردشة ذلك.
    هذا لا يحذف النصوص - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من مثيلات OpenClaw (مدير تنفيذي واحد والعديد من الوكلاء)؟">
    نعم، عبر **التوجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل
    منسّق واحد وعدة وكلاء عاملين يملكون مساحات عملهم ونماذجهم الخاصة.

    ومع ذلك، من الأفضل النظر إلى هذا على أنه **تجربة ممتعة**. فهو كثيف الاستهلاك للرموز وغالبًا
    أقل كفاءة من استخدام روبوت واحد مع جلسات منفصلة. والنموذج المعتاد الذي
    نتصوره هو روبوت واحد تتحدث معه، مع جلسات مختلفة للعمل المتوازي. ويمكن لذلك
    الروبوت أيضًا إنشاء وكلاء فرعيين عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="لماذا تم اقتطاع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    يكون سياق الجلسة محدودًا بنافذة النموذج. ويمكن للدردشات الطويلة، أو مخارج الأدوات الكبيرة، أو
    عدد كبير من الملفات أن تؤدي إلى Compaction أو اقتطاع.

    ما الذي يساعد:

    - اطلب من الروبوت تلخيص الحالة الحالية وكتابتها في ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل الموضوعات.
    - أبقِ السياق المهم في مساحة العمل واطلب من الروبوت قراءته مجددًا.
    - استخدم الوكلاء الفرعيين للعمل الطويل أو المتوازي حتى تبقى الدردشة الرئيسية أصغر.
    - اختر نموذجًا ذا نافذة سياق أكبر إذا كان هذا يحدث كثيرًا.

  </Accordion>

  <Accordion title="كيف أعيد تعيين OpenClaw بالكامل لكن مع إبقائه مثبتًا؟">
    استخدم أمر إعادة التعيين:

    ```bash
    openclaw reset
    ```

    إعادة تعيين كاملة غير تفاعلية:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    ثم أعد تشغيل الإعداد:

    ```bash
    openclaw onboard --install-daemon
    ```

    ملاحظات:

    - يوفّر الإعداد الأولي أيضًا خيار **Reset** إذا رأى تهيئة موجودة. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا كنت تستخدم ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد تعيين كل دليل حالة (الافتراضي هو `~/.openclaw-<profile>`).
    - إعادة تعيين التطوير: `openclaw gateway --dev --reset` (خاص بالتطوير؛ يمسح تهيئة التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد التعيين أو أجري Compaction؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (تحافظ على المحادثة لكنها تلخص الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة تعيين** (معرّف جلسة جديد لمفتاح الدردشة نفسه):

      ```
      /new
      /reset
      ```

    وإذا ظل هذا يحدث:

    - فعّل أو اضبط **تشذيب الجلسة** (`agents.defaults.contextPruning`) لتقليص خرج الأدوات القديمة.
    - استخدم نموذجًا ذا نافذة سياق أكبر.

    الوثائق: [Compaction](/ar/concepts/compaction)، [تشذيب الجلسة](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من المزوّد: فقد أصدر النموذج كتلة `tool_use` من دون
    `input` المطلوب. ويعني هذا عادة أن سجل الجلسة قديم أو تالف (غالبًا بعد سلاسل طويلة
    أو تغيير أداة/schema).

    الحل: ابدأ جلسة جديدة باستخدام `/new` (رسالة مستقلة).

  </Accordion>

  <Accordion title="لماذا أتلقى رسائل Heartbeat كل 30 دقيقة؟">
    تعمل Heartbeats كل **30m** افتراضيًا (**1h** عند استخدام مصادقة OAuth). اضبطها أو عطّلها:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // أو "0m" للتعطيل
          },
        },
      },
    }
    ```

    إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (فقط أسطر فارغة ورؤوس markdown
    مثل `# Heading`)، فإن OpenClaw يتخطى تشغيل Heartbeat لتوفير استدعاءات API.
    وإذا كان الملف مفقودًا، فإن Heartbeat لا تزال تعمل ويقرر النموذج ما يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. الوثائق: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل يجب أن أضيف "حساب روبوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك الشخصي**، لذلك إذا كنت موجودًا في المجموعة، يمكن لـ OpenClaw رؤيتها.
    افتراضيًا، يتم حظر الردود في المجموعات حتى تسمح للمرسلين (`groupPolicy: "allowlist"`).

    إذا كنت تريد أن تكون **أنت فقط** قادرًا على تشغيل الردود في المجموعة:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="كيف أحصل على JID لمجموعة WhatsApp؟">
    الخيار 1 (الأسرع): تتبّع السجلات وأرسل رسالة اختبار في المجموعة:

    ```bash
    openclaw logs --follow --json
    ```

    ابحث عن `chatId` (أو `from`) المنتهي بـ `@g.us`، مثل:
    `1234567890-1234567890@g.us`.

    الخيار 2 (إذا كانت مهيأة/موجودة في قائمة السماح بالفعل): اعرض المجموعات من التهيئة:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [Directory](/cli/directory)، [Logs](/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    هناك سببان شائعان:

    - تقييد الذكر مفعّل (الافتراضي). يجب أن تقوم بعمل @mention للروبوت (أو تطابق `mentionPatterns`).
    - لقد قمت بتهيئة `channels.whatsapp.groups` من دون `"*"` ولم تُضف المجموعة إلى قائمة السماح.

    راجع [Groups](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/السلاسل السياق مع الرسائل الخاصة؟">
    تنهار الدردشات المباشرة إلى الجلسة الرئيسية افتراضيًا. أما المجموعات/القنوات فلها مفاتيح جلسات خاصة بها، كما أن موضوعات Telegram / سلاسل Discord هي جلسات منفصلة. راجع [Groups](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء التي يمكنني إنشاؤها؟">
    لا توجد حدود صارمة. العشرات (بل حتى المئات) مناسبة، لكن راقب ما يلي:

    - **نمو القرص:** توجد الجلسات + النصوص تحت `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** يعني المزيد من الوكلاء المزيد من استخدام النماذج المتزامن.
    - **العبء التشغيلي:** ملفات تعريف المصادقة لكل وكيل، ومساحات العمل، وتوجيه القنوات.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قلّم الجلسات القديمة (احذف JSONL أو إدخالات التخزين) إذا نما القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابقات ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة روبوتات أو دردشات في الوقت نفسه (Slack)، وكيف ينبغي أن أعد ذلك؟">
    نعم. استخدم **التوجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. إن Slack مدعومة كقناة ويمكن ربطها بوكلاء محددين.

    إن الوصول إلى المتصفح قوي لكنه ليس "افعل أي شيء يمكن للإنسان فعله" - إذ لا تزال إجراءات مكافحة الروبوتات وCAPTCHAs وMFA
    قادرة على حظر الأتمتة. وللحصول على أكثر تحكم موثوق في المتصفح، استخدم Chrome MCP محليًا على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعلًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway دائم التشغيل (VPS/Mac mini).
    - وكيل واحد لكل دور (bindings).
    - قناة (أو قنوات) Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو Node عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [Browser](/ar/tools/browser)، [Nodes](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج: القيم الافتراضية، والاختيار، والأسماء المستعارة، والتبديل

<AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    إن النموذج الافتراضي في OpenClaw هو ما تعيّنه على النحو التالي:

    ```
    agents.defaults.model.primary
    ```

    يُشار إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.4`). وإذا حذفت المزوّد، يحاول OpenClaw أولًا اسمًا مستعارًا، ثم تطابق مزود مهيأ فريد لذلك المعرّف الدقيق للنموذج، وبعدها فقط يعود إلى المزوّد الافتراضي المهيأ كمسار توافق قديم. وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول مزود/نموذج مهيأ بدل إظهار افتراضي قديم من مزود تمت إزالته. ومع ذلك، ينبغي أن تقوم **صراحةً** بتعيين `provider/model`.

  </Accordion>

  <Accordion title="ما النموذج الذي توصي به؟">
    **الافتراضي الموصى به:** استخدم أقوى نموذج من الجيل الأحدث متاح في مجموعة مزوديك.
    **للوكلاء المفعّلة بالأدوات أو ذات الإدخال غير الموثوق:** قدّم قوة النموذج على الكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لـ MiniMax وثائقها الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    القاعدة العامة: استخدم **أفضل نموذج يمكنك تحمّل تكلفته** للأعمال عالية المخاطر، ونموذجًا
    أرخص للدردشة الروتينية أو الملخصات. ويمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لتشغيل المهام الطويلة بشكل متوازٍ (كل وكيل فرعي يستهلك رموزًا). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المكمّمة بدرجة كبيرة أكثر عرضة لحقن prompt
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج من دون مسح التهيئة؟">
    استخدم **أوامر النموذج** أو حرّر حقول **النموذج** فقط. تجنب الاستبدال الكامل للتهيئة.

    الخيارات الآمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث تهيئة النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - حرّر `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنب `config.apply` مع كائن جزئي ما لم تكن تنوي استبدال التهيئة بأكملها.
    وبالنسبة إلى تعديلات RPC، افحص أولًا باستخدام `config.schema.lookup` وفضّل `config.patch`. تعطيك حمولة lookup المسار المطبع، ووثائق/قيود schema السطحية، وملخصات الأبناء المباشرين
    للتحديثات الجزئية.
    وإذا كنت قد استبدلت التهيئة فعلًا، فاستعد من النسخة الاحتياطية أو أعد تشغيل `openclaw doctor` لإصلاحها.

    الوثائق: [النماذج](/ar/concepts/models)، [Configure](/cli/configure)، [التهيئة](/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتيًا (llama.cpp، vLLM، Ollama)؟">
    نعم. إن Ollama هي أسهل طريق للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجًا محليًا مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضًا، فشغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية بالإضافة إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: النماذج الأصغر أو المكمّمة بشدة أكثر عرضة لحقن prompt.
    ونحن نوصي بشدة باستخدام **نماذج كبيرة** لأي روبوت يمكنه استخدام الأدوات.
    وإذا كنت لا تزال تريد نماذج صغيرة، ففعّل العزل وقوائم سماح صارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزودو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي يستخدمها OpenClaw وFlawd وKrill؟">
    - قد تختلف هذه البيئات وقد تتغير بمرور الوقت؛ ولا توجد توصية ثابتة بمزوّد معين.
    - تحقّق من إعداد وقت التشغيل الحالي على كل gateway باستخدام `openclaw models status`.
    - للوكلاء الحساسة أمنيًا/المفعّلة بالأدوات، استخدم أقوى نموذج من الجيل الأحدث متاح.
  </Accordion>

  <Accordion title="كيف أبدّل النماذج أثناء التشغيل (من دون إعادة تشغيل)؟">
    استخدم الأمر `/model` كرسالة مستقلة:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    هذه هي الأسماء المستعارة المضمّنة. ويمكن إضافة أسماء مستعارة مخصصة عبر `agents.defaults.models`.

    يمكنك عرض النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (و`/model list`) منتقيًا مرقمًا ومضغوطًا. اختر حسب الرقم:

    ```
    /model 3
    ```

    يمكنك أيضًا فرض ملف تعريف مصادقة معين للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` أي وكيل نشط، وأي ملف `auth-profiles.json` يُستخدم، وأي ملف تعريف مصادقة ستُجرَّب محاولته بعد ذلك.
    كما يعرض نقطة نهاية المزوّد المهيأة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف قمت بتثبيته باستخدام @profile؟**

    أعد تشغيل `/model` **من دون** اللاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    وإذا كنت تريد العودة إلى الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` للتأكد من ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.2 للمهام اليومية وCodex 5.3 للبرمجة؟">
    نعم. عيّن أحدهما كافتراضي وبدّل حسب الحاجة:

    - **تبديل سريع (لكل جلسة):** استخدم `/model gpt-5.4` للمهام اليومية، و`/model openai-codex/gpt-5.4` للبرمجة باستخدام Codex OAuth.
    - **افتراضي + تبديل:** عيّن `agents.defaults.model.primary` إلى `openai/gpt-5.4`، ثم بدّل إلى `openai-codex/gpt-5.4` عند البرمجة (أو العكس).
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكلاء فرعيين لديهم نموذج افتراضي مختلف.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أهيّئ fast mode لـ GPT 5.4؟">
    استخدم إما مفتاح تبديل لكل جلسة أو افتراضيًا في التهيئة:

    - **لكل جلسة:** أرسل `/fast on` بينما تستخدم الجلسة `openai/gpt-5.4` أو `openai-codex/gpt-5.4`.
    - **افتراضي لكل نموذج:** عيّن `agents.defaults.models["openai/gpt-5.4"].params.fastMode` إلى `true`.
    - **Codex OAuth أيضًا:** إذا كنت تستخدم أيضًا `openai-codex/gpt-5.4`، فعيّن الراية نفسها هناك.

    مثال:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    بالنسبة إلى OpenAI، يُطابِق fast mode القيمة `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتغلب إعدادات `/fast` الخاصة بالجلسة على القيم الافتراضية في التهيئة.

    راجع [Thinking and fast mode](/ar/tools/thinking) و[OpenAI fast mode](/ar/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا يأتي أي رد؟'>
    إذا كانت `agents.defaults.models` مضبوطة، فإنها تصبح **قائمة السماح** لكل من `/model` وأي
    تجاوزات للجلسة. واختيار نموذج غير موجود في تلك القائمة يعيد:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    يُعاد هذا الخطأ **بدلًا من** رد عادي. الحل: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجًا من `/model list`.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    هذا يعني أن **المزوّد غير مهيأ** (لم يتم العثور على تهيئة مزود MiniMax أو ملف
    تعريف مصادقة)، لذلك لا يمكن تحليل النموذج.

    قائمة تحقق للحل:

    1. قم بالترقية إلى إصدار OpenClaw حالي (أو شغّل من المصدر `main`)، ثم أعد تشغيل gateway.
    2. تأكد من أن MiniMax مهيأة (عبر المعالج أو JSON)، أو من وجود مصادقة MiniMax
       في env/ملفات تعريف المصادقة بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، و`MINIMAX_OAUTH_TOKEN` أو مصادقة MiniMax
       OAuth المخزنة لـ `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (مع حساسية حالة الأحرف) لمسار المصادقة لديك:
       `minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed` لإعداد
       مفتاح API، أو `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` لإعداد OAuth.
    4. شغّل:

       ```bash
       openclaw models list
       ```

       واختر من القائمة (أو `/model list` في الدردشة).

    راجع [MiniMax](/ar/providers/minimax) و[النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام MiniMax كافتراضي وOpenAI للمهام المعقدة؟">
    نعم. استخدم **MiniMax كافتراضي** وبدّل النماذج **لكل جلسة** عند الحاجة.
    إن النماذج الاحتياطية مخصصة **للأخطاء**، لا "للمهام الصعبة"، لذا استخدم `/model` أو وكيلًا منفصلًا.

    **الخيار A: التبديل لكل جلسة**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    ثم:

    ```
    /model gpt
    ```

    **الخيار B: وكلاء منفصلون**

    - الوكيل A الافتراضي: MiniMax
    - الوكيل B الافتراضي: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مضمّنة؟">
    نعم. يشحن OpenClaw بعض الاختصارات الافتراضية (تُطبَّق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا عيّنت اسمًا مستعارًا خاصًا بك بالاسم نفسه، فإن قيمتك هي التي تفوز.

  </Accordion>

  <Accordion title="كيف أعرّف/أتجاوز اختصارات النماذج (الأسماء المستعارة)؟">
    تأتي الأسماء المستعارة من `agents.defaults.models.<modelId>.alias`. مثال:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    بعد ذلك، يُحل `/model sonnet` (أو `/<alias>` عندما يكون مدعومًا) إلى معرّف ذلك النموذج.

  </Accordion>

  <Accordion title="كيف أضيف نماذج من مزودين آخرين مثل OpenRouter أو Z.AI؟">
    OpenRouter (الدفع حسب الرمز؛ نماذج كثيرة):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (نماذج GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    إذا أشرت إلى مزود/نموذج لكن مفتاح المزوّد المطلوب مفقود، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يتم العثور على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. المصادقة تكون لكل وكيل
    وتُخزّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الحل:

    - شغّل `openclaw agents add <id>` وقم بتهيئة المصادقة أثناء المعالج.
    - أو انسخ `auth-profiles.json` من `agentDir` الخاص بالوكيل الرئيسي إلى `agentDir` الخاص بالوكيل الجديد.

    **لا** تعِد استخدام `agentDir` بين الوكلاء؛ فهذا يسبب تضارب المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## التحويل الاحتياطي للنماذج و"All models failed"

<AccordionGroup>
  <Accordion title="كيف يعمل التحويل الاحتياطي؟">
    يحدث التحويل الاحتياطي على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** داخل المزوّد نفسه.
    2. **الرجوع إلى نموذج احتياطي** إلى النموذج التالي في `agents.defaults.model.fallbacks`.

    تنطبق فترات تهدئة على ملفات التعريف الفاشلة (exponential backoff)، بحيث يمكن لـ OpenClaw الاستمرار في الرد حتى عندما يكون أحد المزوّدين مقيّد المعدل أو فاشلًا مؤقتًا.

    تتضمن سلة تقييد المعدل أكثر من مجرد استجابات `429` العادية. كما يتعامل OpenClaw
    أيضًا مع رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) بوصفها
    حدود معدل تستحق التحويل الاحتياطي.

    لا تكون بعض الاستجابات التي تبدو كأنها فوترة من نوع `402`، كما تبقى بعض استجابات HTTP `402`
    أيضًا ضمن تلك السلة المؤقتة. وإذا أعاد مزود ما
    نص فوترة صريحًا على `401` أو `403`، فيمكن لـ OpenClaw إبقاؤه في
    مسار الفوترة، لكن مطابقات النص الخاصة بالمزوّد تظل محصورة في
    المزوّد الذي يملكها (على سبيل المثال OpenRouter `Key limit exceeded`). وإذا بدت رسالة `402`
    بدلًا من ذلك وكأنها نافذة استخدام قابلة لإعادة المحاولة أو
    حد إنفاق للمؤسسة/مساحة العمل (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، فإن OpenClaw يتعامل معها بوصفها
    `rate_limit`، لا تعطيل فوترة طويل الأمد.

    أخطاء تجاوز السياق مختلفة: فالتواقيع مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` تبقى على مسار Compaction/إعادة المحاولة بدل التقدم في
    الرجوع إلى نموذج احتياطي.

    يكون نص الخطأ العام للخادم أضيق عمدًا من "أي شيء يحتوي
    على unknown/error". يتعامل OpenClaw فعلًا مع الأشكال المؤقتة الخاصة بالمزوّد
    مثل Anthropic العاري `An unknown error occurred`، وOpenRouter العاري
    `Provider returned error`، وأخطاء سبب التوقف مثل `Unhandled stop reason:
    error`، وحمولات JSON من نوع `api_error` ذات نص خادم مؤقت
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`)، وأخطاء انشغال المزوّد مثل `ModelNotReadyException` بوصفها
    إشارات تستحق التحويل الاحتياطي من نوع timeout/overloaded عندما يتطابق
    سياق المزوّد.
    أما نص الرجوع الداخلي العام مثل `LLM request failed with an unknown
    error.` فيبقى محافظًا ولا يؤدي إلى الرجوع إلى نموذج احتياطي بمفرده.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني هذا أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يتمكن من العثور على بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة تحقق للحل:**

    - **تأكد من مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يتم ترحيله بواسطة `openclaw doctor`)
    - **تأكد من أن متغير البيئة لديك محمّل بواسطة Gateway**
      - إذا كنت قد عيّنت `ANTHROPIC_API_KEY` في shell لديك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا ترثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تحرر الوكيل الصحيح**
      - تعني إعدادات الوكلاء المتعددين أنه قد تكون هناك عدة ملفات `auth-profiles.json`.
    - **تحقق منطقيًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المهيأة وما إذا كانت المزوّدات مصادَقًا عليها.

    **قائمة تحقق للحل لعبارة "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا تستطيع العثور عليه في مخزن المصادقة لديها.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف gateway**.
      - امسح أي ترتيب مثبت يفرض ملف تعريف مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأكد من أنك تشغّل الأوامر على مضيف gateway**
      - في الوضع البعيد، توجد ملفات تعريف المصادقة على جهاز gateway، وليس على الحاسوب المحمول لديك.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا Google Gemini وفشل؟">
    إذا كانت تهيئة النموذج لديك تتضمن Google Gemini كنموذج احتياطي (أو قمت بالتبديل إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء الرجوع إلى نموذج احتياطي. وإذا لم تكن قد هيّأت بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الحل: إما أن توفّر مصادقة Google، أو تزيل/تتجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يتم التوجيه إلى هناك عند الرجوع.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل thinking من دون تواقيع** (غالبًا من
    بث متوقف/جزئي). يتطلب Google Antigravity تواقيع لكتل thinking.

    الحل: يزيل OpenClaw الآن كتل thinking غير الموقعة في Google Antigravity Claude. وإذا ظل الأمر ظاهرًا، فابدأ **جلسة جديدة** أو عيّن `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيفية إدارتها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، وتخزين الرموز المميزة، وأنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمى (OAuth أو مفتاح API) مرتبط بمزوّد. وتوجد ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ما معرّفات الملفات التعريفية النموذجية؟">
    يستخدم OpenClaw معرّفات مسبوقة بالمزوّد مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها أنت (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في أي ملف تعريف مصادقة تتم تجربته أولًا؟">
    نعم. تدعم التهيئة بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل مزوّد (`auth.order.<provider>`). وهذا **لا** يخزن الأسرار؛ بل يربط المعرّفات بالمزوّد/الوضع ويضبط ترتيب التدوير.

    قد يتخطى OpenClaw مؤقتًا ملفًا تعريفيًا إذا كان في **فترة تهدئة** قصيرة (تقييد معدل/مهلات/إخفاقات مصادقة) أو حالة **تعطيل** أطول (فوترة/أرصدة غير كافية). ولمعاينة ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة تقييد المعدل ضمن نطاق النموذج. فملف تعريف يمر بفترة تهدئة
    لنموذج واحد قد يظل صالحًا لنموذج شقيق على المزوّد نفسه،
    بينما لا تزال نوافذ الفوترة/التعطيل تحظر الملف التعريفي كله.

    يمكنك أيضًا تعيين تجاوز ترتيب **لكل وكيل** (مخزّن في `auth-state.json` لذلك الوكيل) عبر CLI:

    ```bash
    # يستخدم الوكيل الافتراضي المهيأ افتراضيًا (احذف --agent)
    openclaw models auth order get --provider anthropic

    # ثبّت التدوير على ملف تعريف واحد (جرّب هذا فقط)
    openclaw models auth order set --provider anthropic anthropic:default

    # أو عيّن ترتيبًا صريحًا (رجوع داخل المزوّد)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # امسح التجاوز (الرجوع إلى config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    لاستهداف وكيل محدد:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    وللتحقق مما سيُجرَّب فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا تم حذف ملف تعريف مخزن من الترتيب الصريح، فسيعرض probe
    `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - **OAuth** غالبًا ما يستفيد من الوصول عبر الاشتراك (عند انطباق ذلك).
    - **مفاتيح API** تستخدم فوترة الدفع حسب الرمز.

    يدعم المعالج صراحةً Anthropic Claude CLI وOpenAI Codex OAuth ومفاتيح API.

  </Accordion>
</AccordionGroup>

## Gateway: المنافذ، و"already running"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي تستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ الموحد الواحد لكل من WebSocket + HTTP (Control UI، وhooks، وما إلى ذلك).

    ترتيب الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا تقول openclaw gateway status "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هو منظور **المشرف** (launchd/systemd/schtasks). أما connectivity probe فهو CLI التي تتصل فعليًا بـ gateway WebSocket.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه الفحص فعليًا)
    - `Listening:` (ما هو مربوط فعليًا على المنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا تعرض openclaw gateway status "Config (cli)" و"Config (service)" مختلفتين؟'>
    أنت تحرر ملف تهيئة بينما تقوم الخدمة بتشغيل ملف آخر (غالبًا بسبب عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الحل:

    ```bash
    openclaw gateway install --force
    ```

    شغّل هذا من `--profile` / البيئة نفسها التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ما معنى "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفلًا وقت التشغيل من خلال ربط مستمع WebSocket فورًا عند بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). وإذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن مثيلًا آخر يستمع بالفعل.

    الحل: أوقف المثيل الآخر، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (العميل يتصل بـ Gateway في مكان آخر)؟">
    عيّن `gateway.mode: "remote"` وأشر إلى عنوان URL بعيد لـ WebSocket، اختياريًا مع بيانات اعتماد بعيدة من نوع shared-secret:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    ملاحظات:

    - لا يبدأ `openclaw gateway` إلا عندما يكون `gateway.mode` هو `local` (أو إذا مررت راية override).
    - يراقب تطبيق macOS ملف التهيئة ويبدّل الأوضاع مباشرة عند تغيّر هذه القيم.
    - إن `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة من جهة العميل فقط؛ ولا تفعّل مصادقة gateway المحلية بمفردها.

  </Accordion>

  <Accordion title='تقول Control UI "unauthorized" (أو تستمر في إعادة الاتصال). ماذا الآن؟'>
    مسار مصادقة gateway لديك وطريقة المصادقة في واجهة المستخدم غير متطابقين.

    حقائق (من الكود):

    - تحتفظ Control UI بالرمز المميز في `sessionStorage` لجلسة علامة التبويب الحالية في المتصفح وعنوان URL المحدد للـ gateway، بحيث تظل عمليات التحديث داخل علامة التبويب نفسها تعمل من دون استعادة ثبات الرمز المميز طويل العمر في localStorage.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة محدودة واحدة باستخدام رمز جهاز مخبأ عندما تعيد gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`).
    - تعيد إعادة محاولة الرمز المخبأ الآن استخدام النطاقات المعتمدة المخبأة المخزنة مع رمز الجهاز. ولا يزال مستدعيو `deviceToken` الصريح / `scopes` الصريح يحتفظون بمجموعة النطاقات المطلوبة بدلًا من وراثة النطاقات المخبأة.
    - خارج مسار إعادة المحاولة هذا، يكون ترتيب أولوية مصادقة الاتصال كالتالي: shared token/password صريحة أولًا، ثم `deviceToken` صريح، ثم رمز جهاز مخزن، ثم bootstrap token.
    - تكون فحوصات نطاق bootstrap token مسبوقة بالدور. ولا تلبّي قائمة السماح المضمّنة لمشغّل bootstrap إلا طلبات المشغّل؛ أما الأدوار الأخرى غير المشغّل مثل node فتظل تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    الحل:

    - الأسرع: `openclaw dashboard` (يطبع عنوان URL للوحة التحكم وينسخه، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان بلا واجهة).
    - إذا لم يكن لديك رمز مميز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كنت في وضع بعيد، فأنشئ نفقًا أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع shared-secret: عيّن `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم ألصق السر المطابق في إعدادات Control UI.
    - وضع Tailscale Serve: تأكد من تمكين `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان loopback/tailnet خامًا يتجاوز رؤوس هوية Tailscale.
    - وضع trusted-proxy: تأكد من أنك تمر عبر الوكيل المدرك للهوية غير loopback المهيأ، وليس عبر وكيل loopback على المضيف نفسه أو عنوان URL خام للـ gateway.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، فقم بتدوير/إعادة اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا قالت عملية التدوير تلك إنها رُفضت، فتحقق من أمرين:
      - يمكن لجلسات الجهاز المقترن تدوير **جهازها الخاص فقط** ما لم تكن تملك أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة أن تتجاوز نطاقات المشغّل الحالية لدى المستدعي
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [Dashboard](/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لقد عيّنت gateway.bind tailnet لكنه لا يستطيع الربط ولا يوجد شيء يستمع">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات الشبكة لديك (النطاق 100.64.0.0/10). وإذا لم يكن الجهاز على Tailscale (أو كانت الواجهة متوقفة)، فلا يوجد شيء ليرتبط به.

    الحل:

    - شغّل Tailscale على ذلك المضيف (حتى يملك عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا خاصًا بـ tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادةً لا - يمكن لـ Gateway واحدة تشغيل عدة قنوات مراسلة ووكلاء. استخدم عدة Gateways فقط عندما تحتاج إلى ازدواجية (مثل: rescue bot) أو عزل صارم.

    نعم، لكن يجب أن تعزل:

    - `OPENCLAW_CONFIG_PATH` (تهيئة لكل مثيل)
    - `OPENCLAW_STATE_DIR` (حالة لكل مثيل)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل مثيل (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - عيّن `gateway.port` فريدًا في تهيئة كل profile (أو مرّر `--port` للتشغيلات اليدوية).
    - ثبّت خدمة لكل profile: `openclaw --profile <name> gateway install`.

    تضيف Profiles أيضًا لواحق إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ والأسماء القديمة `com.openclaw.*` و`openclaw-gateway-<profile>.service` و`OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ما معنى "invalid handshake" / code 1008؟'>
    إن Gateway هي **خادم WebSocket**، وتتوقع أن تكون أول رسالة
    على الإطلاق هي إطار `connect`. وإذا استلمت أي شيء آخر، فإنها تغلق الاتصال
    باستخدام **code 1008** (مخالفة سياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدل عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - أزال وكيل أو نفق رؤوس المصادقة أو أرسل طلبًا غير مخصص للـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان WS URL: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في علامة تبويب متصفح عادية.
    3. إذا كانت المصادقة مفعّلة، فأدرج الرمز المميز/كلمة المرور في إطار `connect`.

    إذا كنت تستخدم CLI أو TUI، فيجب أن يبدو عنوان URL كما يلي:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

  </Accordion>
</AccordionGroup>

## التسجيل والتصحيح

<AccordionGroup>
  <Accordion title="أين توجد السجلات؟">
    سجلات الملفات (مهيكلة):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    يمكنك تعيين مسار ثابت عبر `logging.file`. ويتم التحكم في مستوى سجل الملفات عبر `logging.level`. ويتم التحكم في تفصيلية وحدة التحكم عبر `--verbose` و`logging.consoleLevel`.

    أسرع تتبّع للسجل:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما تعمل gateway عبر launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و`gateway.err.log` (الافتراضي: `~/.openclaw/logs/...`؛ وتستخدم profiles `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting) للمزيد.

  </Accordion>

  <Accordion title="كيف أبدأ/أوقف/أعيد تشغيل خدمة Gateway؟">
    استخدم مساعدات gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغّل gateway يدويًا، فيمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت طرفيتي على Windows - كيف أعيد تشغيل OpenClaw؟">
    هناك **وضعا تثبيت على Windows**:

    **1) WSL2 (موصى به):** تعمل Gateway داخل Linux.

    افتح PowerShell، ثم ادخل إلى WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبّت الخدمة مطلقًا، فابدأها في الواجهة الأمامية:

    ```bash
    openclaw gateway run
    ```

    **2) Windows الأصلي (غير موصى به):** تعمل Gateway مباشرة في Windows.

    افتح PowerShell وشغّل:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغّلها يدويًا (من دون خدمة)، فاستخدم:

    ```powershell
    openclaw gateway run
    ```

    الوثائق: [Windows (WSL2)](/ar/platforms/windows)، [كتيب تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="Gateway تعمل لكن الردود لا تصل أبدًا. ما الذي يجب أن أتحقق منه؟">
    ابدأ بمسح سريع للسلامة:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - مصادقة النموذج غير محمّلة على **مضيف gateway** (تحقق من `models status`).
    - الاقتران/قائمة السماح في القناة تحظر الردود (تحقق من تهيئة القناة + السجلات).
    - WebChat/Dashboard مفتوحة من دون الرمز المميز الصحيح.

    إذا كنت في وضع بعيد، فتأكد من أن اتصال النفق/Tailscale يعمل وأن
    Gateway WebSocket قابلة للوصول.

    الوثائق: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ماذا الآن؟'>
    يعني هذا عادة أن واجهة المستخدم فقدت اتصال WebSocket. تحقّق من:

    1. هل Gateway تعمل؟ `openclaw gateway status`
    2. هل Gateway سليمة؟ `openclaw status`
    3. هل لدى واجهة المستخدم الرمز المميز الصحيح؟ `openclaw dashboard`
    4. إذا كنت في وضع بعيد، فهل يعمل رابط النفق/Tailscale؟

    ثم تتبّع السجلات:

    ```bash
    openclaw logs --follow
    ```

    الوثائق: [Dashboard](/web/dashboard)، [الوصول البعيد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="فشل Telegram setMyCommands. ما الذي يجب أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابِق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على عدد كبير جدًا من الإدخالات. يقوم OpenClaw بالفعل بتقليصها إلى حد Telegram ثم يعيد المحاولة بعدد أقل من الأوامر، لكن لا تزال بعض إدخالات القائمة بحاجة إلى الحذف. قلّل أوامر Plugin/Skill/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من السماح بـ HTTPS الصادر وأن DNS يعمل لـ `api.telegram.org`.

    إذا كانت Gateway بعيدة، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    الوثائق: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="تعرض TUI عدم وجود خرج. ما الذي يجب أن أتحقق منه؟">
    أولًا تأكد من أن Gateway قابلة للوصول وأن الوكيل يستطيع العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لرؤية الحالة الحالية. وإذا كنت تتوقع ردودًا في
    قناة دردشة، فتأكد من تمكين التسليم (`/deliver on`).

    الوثائق: [TUI](/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway تمامًا ثم أبدأها؟">
    إذا كنت قد ثبّت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يؤدي هذا إلى إيقاف/بدء **الخدمة الخاضعة للإشراف** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما تعمل Gateway في الخلفية كـ daemon.

    وإذا كنت تشغّلها في الواجهة الأمامية، فأوقفها عبر Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    الوثائق: [كتيب تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="اشرح لي ببساطة: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **الخدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل gateway **في الواجهة الأمامية** لهذه الجلسة الطرفية.

    إذا كنت قد ثبّت الخدمة، فاستخدم أوامر gateway. واستخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في الواجهة الأمامية.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على مزيد من التفاصيل عند فشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على مزيد من التفاصيل في وحدة التحكم. ثم افحص ملف السجل بحثًا عن مصادقة القناة، وتوجيه النموذج، وأخطاء RPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="أنشأت Skill صورة/PDF، لكن لم يتم إرسال شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقّق أيضًا من:

    - أن القناة الهدف تدعم الوسائط الصادرة وليست محظورة بقوائم السماح.
    - أن الملف ضمن حدود الحجم الخاصة بالمزوّد (يتم تغيير حجم الصور إلى حد أقصى 2048px).
    - يؤدي `tools.fs.workspaceOnly=true` إلى قصر الإرسال عبر المسارات المحلية على مساحة العمل وtemp/media-store والملفات التي تم التحقق منها عبر sandbox.
    - يتيح `tools.fs.workspaceOnly=false` لـ `MEDIA:` إرسال الملفات المحلية على المضيف التي يمكن للوكيل قراءتها بالفعل، ولكن فقط للوسائط إضافة إلى أنواع المستندات الآمنة (الصور، والصوت، والفيديو، وPDF، ومستندات Office). أما النصوص العادية والملفات الشبيهة بالأسرار فلا تزال محظورة.

    راجع [Images](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw لرسائل DM الواردة؟">
    تعامل مع الرسائل الخاصة الواردة على أنها إدخال غير موثوق. وقد صُممت القيم الافتراضية لتقليل الخطر:

    - السلوك الافتراضي على القنوات القادرة على DM هو **pairing**:
      - يتلقى المرسلون المجهولون رمز اقتران؛ ولا يعالج الروبوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - يتم تقييد الطلبات المعلقة عند **3 لكل قناة**؛ تحقّق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل الرمز.
    - يتطلب فتح الرسائل الخاصة علنًا اشتراكًا صريحًا (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل الخاصة المحفوفة بالمخاطر.

  </Accordion>

  <Accordion title="هل يُعد حقن prompt مصدر قلق للروبوتات العامة فقط؟">
    لا. إن حقن prompt يتعلق بـ **المحتوى غير الموثوق**، وليس فقط بمن يمكنه إرسال DM إلى الروبوت.
    فإذا كان مساعدك يقرأ محتوى خارجيًا (web search/fetch، وصفحات المتصفح، ورسائل البريد الإلكتروني،
    والمستندات، والمرفقات، والسجلات الملصقة)، فيمكن أن يتضمن هذا المحتوى تعليمات تحاول
    اختطاف النموذج. ويمكن أن يحدث هذا حتى لو كنت **أنت المرسل الوحيد**.

    يكون الخطر الأكبر عندما تكون الأدوات مفعّلة: إذ يمكن خداع النموذج
    لاستخراج السياق أو استدعاء الأدوات نيابةً عنك. قلّل نصف قطر الانفجار عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطّل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطّلة للوكلاء المفعّلة بالأدوات
    - التعامل مع نصوص الملفات/المستندات المفككة على أنها غير موثوقة أيضًا: حيث يقوم OpenResponses
      `input_file` واستخراج مرفقات الوسائط كلاهما بلف النص المستخرج داخل
      علامات حدود صريحة للمحتوى الخارجي بدل تمرير النص الخام للملف
    - العزل وقوائم سماح صارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل ينبغي أن يملك الروبوت بريدًا إلكترونيًا أو حساب GitHub أو رقم هاتف خاصًا به؟">
    نعم، لمعظم الإعدادات. إن عزل الروبوت بحسابات وأرقام هواتف منفصلة
    يقلّل نصف قطر الانفجار إذا حدث خطأ ما. كما أن هذا يسهل أيضًا تدوير
    بيانات الاعتماد أو إلغاء الوصول من دون التأثير في حساباتك الشخصية.

    ابدأ على نطاق صغير. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعلًا، ووسّع
    لاحقًا إذا لزم الأمر.

    الوثائق: [الأمان](/ar/gateway/security)، [Pairing](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. وأكثر الأنماط أمانًا هو:

    - أبقِ الرسائل الخاصة في **وضع pairing** أو قائمة سماح ضيقة.
    - استخدم **رقمًا أو حسابًا منفصلًا** إذا كنت تريده أن يرسل نيابة عنك.
    - دعه يصيغ، ثم **وافق قبل الإرسال**.

    إذا كنت تريد التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكان الإدخال موثوقًا. المستويات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذا تجنبها للوكلاء المفعّلة بالأدوات
    أو عند قراءة محتوى غير موثوق. وإذا كان لا بد من استخدام نموذج أصغر، فأحكم
    الأدوات وشغّله داخل sandbox. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكنني لم أتلق رمز اقتران">
    يتم إرسال رموز الاقتران **فقط** عندما يرسل مرسل مجهول رسالة إلى الروبوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. ولا يؤدي `/start` وحده إلى إنشاء رمز.

    تحقّق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    وإذا كنت تريد وصولًا فوريًا، فأضف معرّف المرسل الخاص بك إلى قائمة السماح أو عيّن `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات اتصالي؟ كيف يعمل pairing؟">
    لا. سياسة الرسائل الخاصة الافتراضية في WhatsApp هي **pairing**. يحصل المرسلون المجهولون فقط على رمز اقتران ولا تتم **معالجة** رسالتهم. لا يرد OpenClaw إلا على الدردشات التي يتلقاها أو على الإرسالات الصريحة التي تقوم بتشغيلها.

    وافق على الاقتران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لتعيين **قائمة السماح/المالك** الخاصة بك بحيث يُسمح برسائلك الخاصة. ولا تُستخدم للإرسال التلقائي. وإذا كنت تشغّل على رقم WhatsApp الشخصي الخاص بك، فاستخدم ذلك الرقم ومكّن `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإلغاء المهام، و"إنه لا يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    تظهر معظم الرسائل الداخلية أو رسائل الأدوات فقط عندما يكون **verbose** أو **trace** أو **reasoning** مفعّلًا
    لتلك الجلسة.

    الحل في الدردشة التي تراها فيها:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    وإذا ظلت مزعجة، فتحقق من إعدادات الجلسة في Control UI واضبط verbose
    على **inherit**. وتأكد أيضًا من أنك لا تستخدم ملف تعريف روبوت مع `verboseDefault` معيّنًا
    إلى `on` في التهيئة.

    الوثائق: [Thinking and verbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="كيف أوقف/ألغي مهمة قيد التشغيل؟">
    أرسل أيًا مما يلي **كرسالة مستقلة** (من دون شرطة مائلة):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    هذه محفزات إيقاف، وليست أوامر slash.

    بالنسبة إلى العمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    لمحة عامة عن أوامر slash: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات القليلة (مثل `/status`) تعمل أيضًا ضمن السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("Cross-context messaging denied")'>
    يحظر OpenClaw الرسائل **عبر المزودات المختلفة** افتراضيًا. فإذا كان استدعاء أداة ما مرتبطًا
    بـ Telegram، فلن يرسل إلى Discord ما لم تسمح بذلك صراحة.

    فعّل الرسائل عبر المزودات المختلفة للوكيل:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    أعد تشغيل gateway بعد تحرير التهيئة.

  </Accordion>

  <Accordion title='لماذا يبدو وكأن الروبوت "يتجاهل" الرسائل السريعة المتتالية؟'>
    يتحكم وضع queue في كيفية تفاعل الرسائل الجديدة مع تشغيل قيد التنفيذ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - تعيد الرسائل الجديدة توجيه المهمة الحالية
    - `followup` - تشغّل الرسائل واحدة تلو الأخرى
    - `collect` - تجمع الرسائل وترد مرة واحدة (الافتراضي)
    - `steer-backlog` - توجيه الآن، ثم معالجة التراكم
    - `interrupt` - إلغاء التشغيل الحالي والبدء من جديد

    يمكنك إضافة خيارات مثل `debounce:2s cap:25 drop:summarize` لأوضاع followup.

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic مع مفتاح API؟'>
    في OpenClaw، تكون بيانات الاعتماد واختيار النموذج منفصلين. يؤدي تعيين `ANTHROPIC_API_KEY` (أو تخزين مفتاح Anthropic API في ملفات تعريف المصادقة) إلى تمكين المصادقة، لكن النموذج الافتراضي الفعلي هو ما تهيئه أنت في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). وإذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم تتمكن من العثور على بيانات اعتماد Anthropic في `auth-profiles.json` المتوقع للوكيل الجاري تشغيله.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [GitHub discussion](https://github.com/openclaw/openclaw/discussions).
