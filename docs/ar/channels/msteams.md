---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم بوت Microsoft Teams، والإمكانات، والتكوين
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-22T04:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9d52fb2cc7801e84249a705e0fa2052d4afbb7ef58cee2d3362b3e7012348c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "تخلّوا عن كل أمل، يا من تدخلون هنا."

الحالة: يتم دعم النص + مرفقات الرسائل المباشرة؛ ويتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في محادثات المجموعات](#sending-files-in-group-chats)). تُرسَل الاستطلاعات عبر Adaptive Cards. وتعرض إجراءات الرسائل `upload-file` بشكل صريح لعمليات الإرسال التي تبدأ بالملف.

## Plugin المضمّن

يأتي Microsoft Teams باعتباره Plugin مضمّنًا في إصدارات OpenClaw الحالية، لذلك لا يلزم تثبيت منفصل في البنية المعبأة العادية.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد Teams المضمّن،
فقم بتثبيته يدويًا:

```bash
openclaw plugins install @openclaw/msteams
```

السحب المحلي للمستودع (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع (للمبتدئين)

1. تأكد من أن Plugin الخاص بـ Microsoft Teams متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ **Azure Bot** (معرّف التطبيق + سر العميل + معرّف المستأجر).
3. قم بتكوين OpenClaw باستخدام بيانات الاعتماد هذه.
4. عرّض `/api/messages` (المنفذ 3978 افتراضيًا) عبر عنوان URL عام أو نفق.
5. ثبّت حزمة تطبيق Teams وابدأ Gateway.

الحد الأدنى من التكوين (سر العميل):

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

بالنسبة لعمليات النشر الإنتاجية، فكّر في استخدام [المصادقة الاتحادية](#federated-authentication-certificate--managed-identity) (شهادة أو هوية مُدارة) بدلًا من أسرار العميل.

ملاحظة: يتم حظر محادثات المجموعات افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بالردود في المجموعات، عيّن `channels.msteams.groupAllowFrom` (أو استخدم `groupPolicy: "open"` للسماح لأي عضو، مع اشتراط الإشارة).

## الأهداف

- التحدّث إلى OpenClaw عبر الرسائل المباشرة في Teams أو محادثات المجموعات أو القنوات.
- الحفاظ على توجيه حتمي: تعود الردود دائمًا إلى القناة التي وصلت منها.
- اعتماد سلوك آمن للقنوات افتراضيًا (الإشارات مطلوبة ما لم يتم تكوين خلاف ذلك).

## عمليات كتابة التكوين

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات التكوين التي يتم تشغيلها عبر `/config set|unset` (يتطلب `commands.config: true`).

للتعطيل، استخدم:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**الوصول إلى الرسائل المباشرة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يتم تجاهل المرسلين غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائنات AAD الثابتة.
- أسماء UPN/العرض قابلة للتغيير؛ والمطابقة المباشرة معطّلة افتراضيًا ولا تُفعَّل إلا مع `channels.msteams.dangerouslyAllowNameMatching: true`.
- يمكن للمعالج حل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**الوصول إلى المجموعات**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز القيمة الافتراضية عند عدم تعيينها.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين الذين يمكنهم التفعيل في محادثات/قنوات المجموعات (ويرجع إلى `channels.msteams.allowFrom` عند عدم التعيين).
- عيّن `groupPolicy: "open"` للسماح لأي عضو (مع بقاء اشتراط الإشارة افتراضيًا).
- لعدم السماح **بأي قنوات**، عيّن `channels.msteams.groupPolicy: "disabled"`.

مثال:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**قائمة السماح لـ Teams + القنوات**

- حدّد نطاق الردود في المجموعات/القنوات من خلال إدراج الفرق والقنوات تحت `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات الفرق الثابتة ومعرّفات محادثات القنوات.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، لا يتم قبول إلا الفرق/القنوات المدرجة (مع اشتراط الإشارة).
- يقبل معالج التكوين إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يقوم OpenClaw بحل أسماء الفرق/القنوات وأسماء المستخدمين في قائمة السماح إلى معرّفات (عندما تسمح أذونات Graph بذلك)
  ويسجل عملية المطابقة؛ ويتم الاحتفاظ بأسماء الفرق/القنوات غير المحلولة كما كُتبت، لكنها تُتجاهل افتراضيًا في التوجيه ما لم يتم تفعيل `channels.msteams.dangerouslyAllowNameMatching: true`.

مثال:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## كيف يعمل

1. تأكد من أن Plugin الخاص بـ Microsoft Teams متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ **Azure Bot** (معرّف التطبيق + السر + معرّف المستأجر).
3. أنشئ **حزمة تطبيق Teams** تشير إلى البوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams داخل فريق (أو بنطاق شخصي للرسائل المباشرة).
5. قم بتكوين `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway افتراضيًا إلى حركة Webhook الخاصة بـ Bot Framework على `/api/messages`.

## إعداد Azure Bot (المتطلبات الأساسية)

قبل تكوين OpenClaw، تحتاج إلى إنشاء مورد Azure Bot.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [إنشاء Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ علامة التبويب **Basics**:

   | الحقل              | القيمة                                                    |
   | ------------------ | --------------------------------------------------------- |
   | **Bot handle**     | اسم البوت الخاص بك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **Subscription**   | اختر اشتراك Azure الخاص بك                                |
   | **Resource group** | أنشئ مجموعة جديدة أو استخدم مجموعة موجودة                 |
   | **Pricing tier**   | **Free** للتطوير/الاختبار                                 |
   | **Type of App**    | **Single Tenant** (موصى به - راجع الملاحظة أدناه)         |
   | **Creation type**  | **Create new Microsoft App ID**                           |

> **إشعار إيقاف:** تم إيقاف إنشاء بوتات جديدة متعددة المستأجرين بعد 2025-07-31. استخدم **Single Tenant** للبوتات الجديدة.

3. انقر **Review + create** → **Create** (انتظر نحو 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot الخاص بك → **Configuration**
2. انسخ **Microsoft App ID** → هذا هو `appId`
3. انقر **Manage Password** → انتقل إلى App Registration
4. ضمن **Certificates & secrets** → **New client secret** → انسخ **Value** → هذا هو `appPassword`
5. انتقل إلى **Overview** → انسخ **Directory (tenant) ID** → هذا هو `tenantId`

### الخطوة 3: تكوين نقطة نهاية المراسلة

1. في Azure Bot → **Configuration**
2. عيّن **Messaging endpoint** إلى عنوان URL الخاص بـ Webhook:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تفعيل قناة Teams

1. في Azure Bot → **Channels**
2. انقر **Microsoft Teams** → Configure → Save
3. اقبل شروط الخدمة

## المصادقة الاتحادية (الشهادة + الهوية المُدارة)

> أُضيف في 2026.3.24

بالنسبة لعمليات النشر الإنتاجية، يدعم OpenClaw **المصادقة الاتحادية** كبديل أكثر أمانًا لأسرار العميل. تتوفر طريقتان:

### الخيار أ: المصادقة المستندة إلى الشهادة

استخدم شهادة PEM مسجلة مع تسجيل تطبيق Entra ID الخاص بك.

**الإعداد:**

1. أنشئ أو احصل على شهادة (بتنسيق PEM مع المفتاح الخاص).
2. في Entra ID → App Registration → **Certificates & secrets** → **Certificates** → ارفع الشهادة العامة.

**التكوين:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**متغيرات البيئة:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### الخيار ب: Azure Managed Identity

استخدم Azure Managed Identity للمصادقة دون كلمة مرور. وهذا مثالي لعمليات النشر على بنية Azure التحتية (AKS وApp Service وAzure VMs) حيث تتوفر هوية مُدارة.

**كيف يعمل:**

1. تحتوي حاوية البوت/الآلة الافتراضية على هوية مُدارة (مخصصة من النظام أو من المستخدم).
2. يربط **بيان اعتماد هوية اتحادية** الهوية المُدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على الرموز من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يتم تمرير الرمز إلى Teams SDK لمصادقة البوت.

**المتطلبات الأساسية:**

- بنية Azure تحتية مع تفعيل الهوية المُدارة (هوية عبء عمل AKS، App Service، VM)
- إنشاء بيان اعتماد هوية اتحادية على تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من الحاوية/الآلة الافتراضية

**التكوين (هوية مُدارة مخصصة من النظام):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**التكوين (هوية مُدارة مخصصة من المستخدم):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**متغيرات البيئة:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (لهوية مخصصة من المستخدم فقط)

### إعداد AKS Workload Identity

لعمليات نشر AKS التي تستخدم workload identity:

1. **فعّل workload identity** على عنقود AKS الخاص بك.
2. **أنشئ بيان اعتماد هوية اتحادية** على تسجيل تطبيق Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **أضف تعليقًا توضيحيًا إلى Kubernetes service account** باستخدام معرّف عميل التطبيق:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **أضف تسمية إلى الحاوية** لحقن workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكد من وجود وصول شبكي** إلى IMDS (`169.254.169.254`) — إذا كنت تستخدم NetworkPolicy، فأضف قاعدة egress تسمح بحركة المرور إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة               | التكوين                                         | المزايا                            | العيوب                                 |
| --------------------- | ----------------------------------------------- | ---------------------------------- | -------------------------------------- |
| **سر العميل**         | `appPassword`                                   | إعداد بسيط                         | يتطلب تدوير الأسرار، وأقل أمانًا       |
| **الشهادة**           | `authType: "federated"` + `certificatePath`     | لا يوجد سر مشترك عبر الشبكة        | عبء إدارة الشهادات                     |
| **Managed Identity**  | `authType: "federated"` + `useManagedIdentity`  | بدون كلمة مرور، ولا توجد أسرار للإدارة | يتطلب بنية Azure التحتية               |

**السلوك الافتراضي:** عندما لا يتم تعيين `authType`، يستخدم OpenClaw مصادقة سر العميل افتراضيًا. وتستمر التكوينات الحالية بالعمل دون تغييرات.

## التطوير المحلي (الأنفاق)

لا يمكن لـ Teams الوصول إلى `localhost`. استخدم نفقًا للتطوير المحلي:

**الخيار أ: ngrok**

```bash
ngrok http 3978
# انسخ عنوان https، مثل https://abc123.ngrok.io
# عيّن نقطة نهاية المراسلة إلى: https://abc123.ngrok.io/api/messages
```

**الخيار ب: Tailscale Funnel**

```bash
tailscale funnel 3978
# استخدم عنوان URL الخاص بـ Tailscale funnel كنقطة نهاية للمراسلة
```

## Teams Developer Portal (بديل)

بدلًا من إنشاء ملف ZIP للبيان يدويًا، يمكنك استخدام [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. انقر **+ New app**
2. املأ المعلومات الأساسية (الاسم، الوصف، معلومات المطوّر)
3. انتقل إلى **App features** → **Bot**
4. اختر **Enter a bot ID manually** والصق Azure Bot App ID الخاص بك
5. حدّد النطاقات: **Personal** و**Team** و**Group Chat**
6. انقر **Distribute** → **Download app package**
7. في Teams: **Apps** → **Manage your apps** → **Upload a custom app** → اختر ملف ZIP

وغالبًا ما يكون هذا أسهل من تعديل بيانات JSON يدويًا.

## اختبار البوت

**الخيار أ: Azure Web Chat (تحقّق من Webhook أولًا)**

1. في Azure Portal → مورد Azure Bot الخاص بك → **Test in Web Chat**
2. أرسل رسالة - يجب أن ترى ردًا
3. يؤكد هذا أن نقطة نهاية Webhook الخاصة بك تعمل قبل إعداد Teams

**الخيار ب: Teams (بعد تثبيت التطبيق)**

1. ثبّت تطبيق Teams (تحميل جانبي أو كتالوج المؤسسة)
2. اعثر على البوت في Teams وأرسل رسالة مباشرة
3. تحقّق من سجلات Gateway للنشاط الوارد

## الإعداد (الحد الأدنى للنص فقط)

1. **تأكد من أن Plugin الخاص بـ Microsoft Teams متاح**
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا:
     - من npm: `openclaw plugins install @openclaw/msteams`
     - من سحب محلي للمستودع: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **تسجيل البوت**
   - أنشئ Azure Bot (راجع أعلاه) وسجّل ما يلي:
     - معرّف التطبيق
     - سر العميل (كلمة مرور التطبيق)
     - معرّف المستأجر (single-tenant)

3. **بيان تطبيق Teams**
   - أدرج إدخال `bot` مع `botId = <App ID>`.
   - النطاقات: `personal` و`team` و`groupChat`.
   - `supportsFiles: true` (مطلوب للتعامل مع الملفات في النطاق الشخصي).
   - أضف أذونات RSC (أدناه).
   - أنشئ الأيقونات: `outline.png` ‏(32x32) و`color.png` ‏(192x192).
   - اضغط الملفات الثلاثة معًا في ملف ZIP: ‏`manifest.json` و`outline.png` و`color.png`.

4. **تكوين OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   يمكنك أيضًا استخدام متغيرات البيئة بدلًا من مفاتيح التكوين:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (اتحادي + شهادة)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (اتحادي + هوية مُدارة)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (لهوية مُدارة مخصصة من المستخدم فقط)

5. **نقطة نهاية البوت**
   - عيّن Azure Bot Messaging Endpoint إلى:
     - `https://<host>:3978/api/messages` (أو المسار/المنفذ الذي اخترته).

6. **تشغيل Gateway**
   - تبدأ قناة Teams تلقائيًا عندما يكون Plugin المضمّن أو المثبّت يدويًا متاحًا، ويوجد تكوين `msteams` مع بيانات الاعتماد.

## إجراء معلومات العضو

يوفّر OpenClaw إجراء `member-info` مدعومًا بـ Graph لـ Microsoft Teams حتى تتمكن الوكلاء وعمليات الأتمتة من حل تفاصيل أعضاء القناة (اسم العرض، البريد الإلكتروني، الدور) مباشرة من Microsoft Graph.

المتطلبات:

- إذن RSC ‏`Member.Read.Group` (موجود بالفعل في البيان الموصى به)
- لعمليات البحث عبر الفرق: إذن تطبيق Graph ‏`User.Read.All` مع موافقة المسؤول

يخضع هذا الإجراء إلى `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القناة/المجموعة الحديثة التي يتم تضمينها في المطالبة.
- يعود إلى `messages.groupChat.historyLimit`. اضبطه على `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل السلسلة الذي يتم جلبه بواسطة قوائم سماح المرسلين (`allowFrom` / `groupAllowFrom`)، لذلك فإن تهيئة سياق السلسلة تتضمن فقط الرسائل من المرسلين المسموح لهم.
- يتم تمرير سياق المرفقات المقتبسة (`ReplyTo*` المشتق من HTML الرد في Teams) حاليًا كما تم استلامه.
- وبعبارة أخرى، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ ولا تتم تصفية اليوم إلا مسارات سياق تكميلية محددة.
- يمكن تقييد سجل الرسائل المباشرة باستخدام `channels.msteams.dmHistoryLimit` (دورات المستخدم). والتجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات Teams RSC الحالية (البيان)

هذه هي أذونات **resourceSpecific** الحالية في بيان تطبيق Teams لدينا. وهي تنطبق فقط داخل الفريق/الدردشة حيث تم تثبيت التطبيق.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` (Application) - استلام جميع رسائل القناة بدون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**لدردشات المجموعات:**

- `ChatMessage.Read.Chat` (Application) - استلام جميع رسائل دردشة المجموعة بدون @mention

## مثال على بيان Teams (مع إخفاء البيانات الحساسة)

مثال أدنى وصالح مع الحقول المطلوبة. استبدل المعرّفات وعناوين URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### ملاحظات مهمة حول البيان (حقول لا غنى عنها)

- يجب أن يتطابق `bots[].botId` **بالضرورة** مع Azure Bot App ID.
- يجب أن يتطابق `webApplicationInfo.id` **بالضرورة** مع Azure Bot App ID.
- يجب أن يتضمن `bots[].scopes` الواجهات التي تخطط لاستخدامها (`personal` و`team` و`groupChat`).
- يتطلب التعامل مع الملفات في النطاق الشخصي `bots[].supportsFiles: true`.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` أذونات قراءة/إرسال القنوات إذا كنت تريد حركة مرور القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبّت بالفعل (مثلًا لإضافة أذونات RSC):

1. حدّث `manifest.json` بالإعدادات الجديدة
2. **زِد حقل `version`** (مثلًا `1.0.0` ← `1.1.0`)
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json` و`outline.png` و`color.png`)
4. ارفع ملف zip الجديد:
   - **الخيار أ (Teams Admin Center):** ‏Teams Admin Center → Teams apps → Manage apps → اعثر على تطبيقك → Upload new version
   - **الخيار ب (التحميل الجانبي):** في Teams → Apps → Manage your apps → Upload a custom app
5. **لقنوات الفريق:** أعد تثبيت التطبيق في كل فريق حتى تدخل الأذونات الجديدة حيّز التنفيذ
6. **أغلق Teams بالكامل ثم أعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح البيانات الوصفية المخزنة مؤقتًا للتطبيق

## الإمكانات: RSC فقط مقابل Graph

### مع **Teams RSC فقط** (التطبيق مثبّت، بدون أذونات Microsoft Graph API)

يعمل:

- قراءة محتوى **نص** رسالة القناة.
- إرسال محتوى **نص** رسالة القناة.
- استلام مرفقات الملفات في **النطاق الشخصي (DM)**.

لا يعمل:

- **محتويات الصور أو الملفات** في القناة/المجموعة (تتضمن الحمولة فقط عنصر HTML بديلًا).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (بخلاف حدث Webhook المباشر).

### مع **Teams RSC + أذونات Microsoft Graph Application**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة داخل الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القناة/الدردشة عبر Graph.

### ‏RSC مقابل Graph API

| الإمكانية              | أذونات RSC           | Graph API                            |
| ---------------------- | -------------------- | ------------------------------------ |
| **الرسائل في الوقت الحقيقي** | نعم (عبر Webhook)   | لا (استطلاع فقط)                     |
| **الرسائل التاريخية**  | لا                   | نعم (يمكنه الاستعلام عن السجل)       |
| **تعقيد الإعداد**      | بيان التطبيق فقط     | يتطلب موافقة المسؤول + تدفق الرموز   |
| **يعمل دون اتصال**     | لا (يجب أن يكون قيد التشغيل) | نعم (يمكن الاستعلام في أي وقت) |

**الخلاصة:** ‏RSC مخصّص للاستماع في الوقت الحقيقي؛ وGraph API مخصّص للوصول التاريخي. ولتعويض الرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط + السجل المعتمدان على Graph (مطلوبان للقنوات)

إذا كنت تحتاج إلى الصور/الملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب عليك تفعيل أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **App Registration** ضمن Entra ID ‏(Azure AD)، أضف أذونات Microsoft Graph **Application**:
   - `ChannelMessage.Read.All` (مرفقات القنوات + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (لدردشات المجموعات)
2. **امنح موافقة المسؤول** للمستأجر.
3. زِد **إصدار** بيان تطبيق Teams، ثم أعد رفعه، و**أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams بالكامل ثم أعد تشغيله** لمسح البيانات الوصفية المخزنة مؤقتًا للتطبيق.

**إذن إضافي لإشارات المستخدمين:** تعمل إشارات المستخدم @mentions مباشرة للمستخدمين الموجودين في المحادثة. ولكن إذا كنت تريد البحث ديناميكيًا عن مستخدمين والإشارة إليهم وهم **ليسوا ضمن المحادثة الحالية**، فأضف إذن `User.Read.All` ‏(Application) وامنح موافقة المسؤول.

## القيود المعروفة

### مهلات Webhook

يُسلّم Teams الرسائل عبر HTTP webhook. وإذا استغرقت المعالجة وقتًا طويلًا جدًا (مثل استجابات LLM البطيئة)، فقد ترى:

- مهلات Gateway
- إعادة محاولة Teams إرسال الرسالة (مما يسبب التكرارات)
- إسقاط الردود

يتعامل OpenClaw مع هذا بإرجاع استجابة بسرعة ثم إرسال الردود بشكل استباقي، لكن الاستجابات البطيئة جدًا قد تظل تسبب مشكلات.

### التنسيق

إمكانات markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق** و_مائل_ و`code` والروابط
- قد لا يتم عرض markdown المعقد (الجداول، القوائم المتداخلة) بشكل صحيح
- يتم دعم Adaptive Cards للاستطلاعات وعمليات الإرسال الدلالية للعرض التقديمي (راجع أدناه)

## التكوين

الإعدادات الأساسية (راجع `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تفعيل/تعطيل القناة.
- `channels.msteams.appId` و`channels.msteams.appPassword` و`channels.msteams.tenantId`: بيانات اعتماد البوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة السماح للرسائل المباشرة (يوصى باستخدام معرّفات كائنات AAD). ويقوم المعالج أثناء الإعداد بحل الأسماء إلى معرّفات عندما يكون وصول Graph متاحًا.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تفعيل مطابقة UPN/أسماء العرض القابلة للتغيير والتوجيه المباشر حسب أسماء الفرق/القنوات.
- `channels.msteams.textChunkLimit`: حجم تجزئة النص الصادر.
- `channels.msteams.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التجزئة حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة السماح لمضيفي المرفقات الواردة (الافتراضي نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة السماح لإرفاق رؤوس Authorization عند إعادة محاولة الوسائط (الافتراضي مضيفو Graph + Bot Framework).
- `channels.msteams.requireMention`: اشتراط @mention في القنوات/المجموعات (الافتراضي true).
- `channels.msteams.replyStyle`: ‏`thread | top-level` (راجع [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) تُستخدم عند غياب تجاوز على مستوى القناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مُرسِل (يُدعَم الرمز العام `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مُرسِل (يُدعَم الرمز العام `"*"`).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:` و`e164:` و`username:` و`name:` (المفاتيح القديمة غير المسبوقة ما زالت تُطابِق `id:` فقط).
- `channels.msteams.actions.memberInfo`: تفعيل أو تعطيل إجراء معلومات العضو المدعوم بـ Graph (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).
- `channels.msteams.authType`: نوع المصادقة — ‏`"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (اتحادي + مصادقة بالشهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختياري، غير مطلوب للمصادقة).
- `channels.msteams.useManagedIdentity`: تفعيل مصادقة الهوية المُدارة (في وضع federation).
- `channels.msteams.managedIdentityClientId`: معرّف العميل للهوية المُدارة المخصصة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرّف موقع SharePoint لعمليات رفع الملفات في دردشات/قنوات المجموعات (راجع [إرسال الملفات في دردشات المجموعات](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (راجع [/concepts/session](/ar/concepts/session)):
  - تشترك الرسائل المباشرة في الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: السلاسل مقابل المنشورات

قدّم Teams مؤخرًا نمطَي واجهة للقنوات فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                                   | `replyStyle` الموصى به |
| ------------------------ | ------------------------------------------------------- | ---------------------- |
| **Posts** (الكلاسيكي)    | تظهر الرسائل كبطاقات مع ردود مترابطة أسفلها            | `thread` (الافتراضي)   |
| **Threads** (شبيه Slack) | تتدفق الرسائل خطيًا، بشكل أقرب إلى Slack               | `top-level`            |

**المشكلة:** لا تكشف Teams API عن نمط الواجهة الذي تستخدمه القناة. وإذا استخدمت `replyStyle` غير الصحيح:

- `thread` في قناة بنمط Threads → تظهر الردود متداخلة بشكل غير ملائم
- `top-level` في قناة بنمط Posts → تظهر الردود كمنشورات مستقلة على المستوى الأعلى بدلًا من أن تكون داخل السلسلة

**الحل:** قم بتكوين `replyStyle` لكل قناة بحسب طريقة إعداد القناة:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## المرفقات والصور

**القيود الحالية:**

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر Teams bot file APIs.
- **القنوات/المجموعات:** تعيش المرفقات في تخزين M365 ‏(SharePoint/OneDrive). ولا تتضمن حمولة Webhook إلا عنصر HTML بديلًا، وليس بايتات الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- لعمليات الإرسال الصريحة التي تبدأ بملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ وتصبح `message` الاختيارية النص/التعليق المرافق، ويقوم `filename` بتجاوز الاسم المرفوع.

من دون أذونات Graph، ستُستقبل رسائل القنوات التي تحتوي على صور كنص فقط (لن يتمكن البوت من الوصول إلى محتوى الصورة).
افتراضيًا، لا يقوم OpenClaw بتنزيل الوسائط إلا من أسماء مضيفي Microsoft/Teams. ويمكنك تجاوز ذلك باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
ولا يتم إرفاق رؤوس Authorization إلا للمضيفين المدرجين في `channels.msteams.mediaAuthAllowHosts` (الافتراضي مضيفو Graph + Bot Framework). أبقِ هذه القائمة صارمة (وتجنب لواحق متعددة المستأجرين).

## إرسال الملفات في دردشات المجموعات

يمكن للبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard ‏(مضمّن). ومع ذلك، فإن **إرسال الملفات في دردشات/قنوات المجموعات** يتطلب إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                        | الإعداد المطلوب                                   |
| ----------------------- | ------------------------------------------- | ------------------------------------------------- |
| **الرسائل المباشرة**    | FileConsentCard → يقبل المستخدم → يرفع البوت | يعمل مباشرةً                                     |
| **دردشات/قنوات المجموعات** | رفع إلى SharePoint → مشاركة الرابط         | يتطلب `sharePointSiteId` + أذونات Graph          |
| **الصور (أي سياق)**     | ترميز Base64 مضمّن                          | يعمل مباشرةً                                     |

### لماذا تحتاج دردشات المجموعات إلى SharePoint

لا تمتلك البوتات محرك OneDrive شخصيًا (فنقطة نهاية Graph API ‏`/me/drive` لا تعمل مع هويات التطبيقات). ولإرسال الملفات في دردشات/قنوات المجموعات، يرفع البوت الملف إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID ‏(Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` (Application) - اختياري، يفعّل روابط مشاركة لكل مستخدم

2. **امنح موافقة المسؤول** للمستأجر.

3. **احصل على معرّف موقع SharePoint:**

   ```bash
   # عبر Graph Explorer أو curl مع رمز صالح:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # مثال: لموقع على "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # تتضمن الاستجابة: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **قم بتكوين OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### سلوك المشاركة

| الإذن                                     | سلوك المشاركة                                             |
| ----------------------------------------- | ---------------------------------------------------------- |
| `Sites.ReadWrite.All` فقط                 | رابط مشاركة على مستوى المؤسسة (يمكن لأي شخص في المؤسسة الوصول) |
| `Sites.ReadWrite.All` + `Chat.Read.All`   | رابط مشاركة لكل مستخدم (يمكن فقط لأعضاء الدردشة الوصول)     |

تكون المشاركة لكل مستخدم أكثر أمانًا لأن المشاركين في الدردشة فقط هم من يمكنهم الوصول إلى الملف. وإذا كان إذن `Chat.Read.All` مفقودًا، يعود البوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع الاحتياطي

| السيناريو                                          | النتيجة                                             |
| -------------------------------------------------- | --------------------------------------------------- |
| دردشة مجموعة + ملف + تم تكوين `sharePointSiteId`  | الرفع إلى SharePoint، وإرسال رابط مشاركة            |
| دردشة مجموعة + ملف + لا يوجد `sharePointSiteId`   | محاولة الرفع إلى OneDrive (قد تفشل)، وإرسال نص فقط  |
| دردشة شخصية + ملف                                 | تدفق FileConsentCard ‏(يعمل دون SharePoint)         |
| أي سياق + صورة                                    | ترميز Base64 مضمّن (يعمل دون SharePoint)           |

### موقع تخزين الملفات

تُخزَّن الملفات المرفوعة في مجلد `/OpenClawShared/` داخل مكتبة المستندات الافتراضية لموقع SharePoint المُكوَّن.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams باعتبارها Adaptive Cards (لا توجد Teams poll API أصلية).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- يتم تسجيل الأصوات بواسطة Gateway في `~/.openclaw/msteams-polls.json`.
- يجب أن يظل Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا بعدُ (افحص ملف التخزين إذا لزم الأمر).

## بطاقات العرض التقديمي

أرسل حمولات عرض تقديمي دلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. ويقوم OpenClaw بعرضها كبطاقات Teams Adaptive Cards انطلاقًا من عقد العرض التقديمي العام.

تقبل المعلمة `presentation` كتلًا دلالية. وعند توفير `presentation`، يصبح نص الرسالة اختياريًا.

**أداة الوكيل:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

للتفاصيل حول تنسيق الهدف، راجع [تنسيقات الهدف](#target-formats) أدناه.

## تنسيقات الهدف

تستخدم أهداف MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الهدف            | التنسيق                         | مثال                                                |
| -------------------- | ------------------------------- | --------------------------------------------------- |
| مستخدم (حسب المعرّف) | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| مستخدم (حسب الاسم)   | `user:<display-name>`           | `user:John Smith` (يتطلب Graph API)                |
| مجموعة/قناة          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| مجموعة/قناة (خام)    | `<conversation-id>`             | `19:abc123...@thread.tacv2` (إذا كان يحتوي على `@thread`) |

**أمثلة CLI:**

```bash
# الإرسال إلى مستخدم حسب المعرّف
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# الإرسال إلى مستخدم حسب اسم العرض (يؤدي إلى بحث عبر Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# الإرسال إلى دردشة مجموعة أو قناة
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# إرسال بطاقة عرض تقديمي إلى محادثة
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**أمثلة أداة الوكيل:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

ملاحظة: بدون البادئة `user:`، تُفسَّر الأسماء افتراضيًا على أنها أهداف مجموعة/فريق. استخدم دائمًا `user:` عند استهداف الأشخاص باسم العرض.

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** أن يتفاعل المستخدم، لأننا نخزن مراجع المحادثة عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة بوابة `dmPolicy` وقائمة السماح.

## معرّفات الفريق والقناة (مشكلة شائعة)

ليست معلمة الاستعلام `groupId` في عناوين URL الخاصة بـ Teams هي معرّف الفريق المستخدم في التكوين. استخرج المعرّفات من مسار URL بدلًا من ذلك:

**عنوان URL للفريق:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    معرّف الفريق (قم بفك ترميز URL لهذا)
```

**عنوان URL للقناة:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      معرّف القناة (قم بفك ترميز URL لهذا)
```

**لأغراض التكوين:**

- معرّف الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`)
- معرّف القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معلمة الاستعلام `groupId`

## القنوات الخاصة

لدى البوتات دعم محدود في القنوات الخاصة:

| الميزة                        | القنوات القياسية | القنوات الخاصة         |
| ---------------------------- | ---------------- | ---------------------- |
| تثبيت البوت                  | نعم              | محدود                  |
| الرسائل في الوقت الحقيقي (Webhook) | نعم          | قد لا تعمل             |
| أذونات RSC                   | نعم              | قد تتصرف بشكل مختلف    |
| @mentions                    | نعم              | إذا كان البوت متاحًا   |
| سجل Graph API                | نعم              | نعم (مع الأذونات)      |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات البوت
2. استخدم الرسائل المباشرة - يمكن للمستخدمين دائمًا مراسلة البوت مباشرة
3. استخدم Graph API للوصول إلى السجل التاريخي (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### المشكلات الشائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams بالكامل ثم أعد فتحه.
- **لا توجد استجابات في القناة:** الإشارات مطلوبة افتراضيًا؛ عيّن `channels.msteams.requireMention=false` أو قم بالتكوين لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض البيان القديم):** أزل التطبيق ثم أضفه مجددًا، وأغلق Teams بالكامل لتحديثه.
- **401 Unauthorized من Webhook:** هذا متوقع عند الاختبار يدويًا دون Azure JWT - ويعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع البيان

- **"Icon file cannot be empty":** يشير البيان إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (`outline.png` بحجم 32x32، و`color.png` بحجم 192x192).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتًا في فريق/دردشة أخرى. اعثر عليه وأزل تثبيته أولًا، أو انتظر 5-10 دقائق حتى يكتمل الانتشار.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح أدوات المطور في المتصفح (F12) → علامة تبويب Network، وتحقق من جسم الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" - فهذا غالبًا ما يتجاوز قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقّق من أن `webApplicationInfo.id` يطابق App ID الخاص بالبوت تمامًا
2. أعد رفع التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقّق مما إذا كان مسؤول المؤسسة قد حظر أذونات RSC
4. تأكد من أنك تستخدم النطاق الصحيح: ‏`ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` لدردشات المجموعات

## المراجع

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (تتطلب القناة/المجموعة Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## ذو صلة

- [Channels Overview](/ar/channels) — جميع القنوات المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [Groups](/ar/channels/groups) — سلوك دردشات المجموعات وبوابة الإشارات
- [Channel Routing](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [Security](/ar/gateway/security) — نموذج الوصول والتقوية
