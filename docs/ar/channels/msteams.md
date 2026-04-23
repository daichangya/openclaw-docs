---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم بوت Microsoft Teams، والإمكانات، والتكوين
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T07:19:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "تخلّوا عن كل أمل، يا من تدخلون هنا."

الحالة: النص + مرفقات الرسائل المباشرة مدعومان؛ يتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في الدردشات الجماعية](#sending-files-in-group-chats)). تُرسل الاستطلاعات عبر Adaptive Cards. تعرض إجراءات الرسائل `upload-file` بشكل صريح لعمليات الإرسال التي تبدأ بملف.

## Plugin المضمّن

يأتي Microsoft Teams كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا يلزم تثبيت منفصل في البنية المجمّعة العادية.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستثني Teams المضمّن،
فثبّته يدويًا:

```bash
openclaw plugins install @openclaw/msteams
```

نسخة checkout محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع (للمبتدئين)

1. تأكد من أن Plugin الخاص بـ Microsoft Teams متاح.
   - تتضمن إصدارات OpenClaw المجمّعة الحالية هذا Plugin بالفعل.
   - يمكن للإصدارات/التثبيتات الأقدم أو المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ **Azure Bot** (App ID + client secret + tenant ID).
3. اضبط OpenClaw باستخدام بيانات الاعتماد تلك.
4. عرّض `/api/messages` (المنفذ 3978 افتراضيًا) عبر عنوان URL عام أو نفق.
5. ثبّت حزمة تطبيق Teams وابدأ Gateway.

الحد الأدنى من التكوين (client secret):

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

بالنسبة لعمليات النشر الإنتاجية، فكّر في استخدام [المصادقة الموحدة](#federated-authentication-certificate--managed-identity) (شهادة أو managed identity) بدلًا من client secrets.

ملاحظة: تُحظر الدردشات الجماعية افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بالردود الجماعية، اضبط `channels.msteams.groupAllowFrom` (أو استخدم `groupPolicy: "open"` للسماح لأي عضو، مع تقييد بالإشارة).

## الأهداف

- التحدث إلى OpenClaw عبر الرسائل المباشرة في Teams أو الدردشات الجماعية أو القنوات.
- الحفاظ على توجيه حتمي: تعود الردود دائمًا إلى القناة التي وصلت منها.
- الاعتماد على سلوك قناة آمن افتراضيًا (الإشارات مطلوبة ما لم يُضبط خلاف ذلك).

## عمليات كتابة التكوين

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات التكوين التي تُفعَّل بواسطة `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**وصول الرسائل المباشرة**

- الإعداد الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يتم تجاهل المرسلين غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائنات AAD الثابتة.
- إن UPNs/أسماء العرض قابلة للتغيير؛ وتكون المطابقة المباشرة معطلة افتراضيًا ولا تُفعَّل إلا مع `channels.msteams.dangerouslyAllowNameMatching: true`.
- يمكن للمعالج resolve الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**وصول المجموعات**

- الإعداد الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز الإعداد الافتراضي عند عدم تعيينه.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين الذين يمكنهم التفعيل في الدردشات/القنوات الجماعية (مع الرجوع إلى `channels.msteams.allowFrom`).
- اضبط `groupPolicy: "open"` للسماح لأي عضو (مع تقييد بالإشارة افتراضيًا).
- لعدم السماح **بأي قنوات**، اضبط `channels.msteams.groupPolicy: "disabled"`.

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

**Teams + قائمة سماح القنوات**

- حدّد نطاق الردود الجماعية/القنوات عبر إدراج الفرق والقنوات ضمن `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات الفرق الثابتة ومعرّفات محادثات القنوات.
- عند `groupPolicy="allowlist"` ومع وجود قائمة سماح للفرق، لا تُقبل إلا الفرق/القنوات المدرجة (مع تقييد بالإشارة).
- يقبل معالج الإعداد إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يقوم OpenClaw بعمل resolve لأسماء الفرق/القنوات وأسماء قوائم سماح المستخدمين إلى معرّفات (عندما تسمح أذونات Graph)
  ويسجل هذا الربط؛ أما أسماء الفرق/القنوات التي لم يتم resolve لها فتُحتفظ كما كُتبت لكنها تُتجاهل افتراضيًا في التوجيه ما لم يتم تفعيل `channels.msteams.dangerouslyAllowNameMatching: true`.

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
   - تتضمن إصدارات OpenClaw المجمّعة الحالية هذا Plugin بالفعل.
   - يمكن للإصدارات/التثبيتات الأقدم أو المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ **Azure Bot** (App ID + secret + tenant ID).
3. أنشئ **حزمة تطبيق Teams** تشير إلى البوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams داخل فريق (أو ضمن النطاق الشخصي للرسائل المباشرة).
5. اضبط `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway إلى حركة Webhook الخاصة بـ Bot Framework على `/api/messages` افتراضيًا.

## إعداد Azure Bot (المتطلبات المسبقة)

قبل ضبط OpenClaw، تحتاج إلى إنشاء مورد Azure Bot.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ علامة تبويب **Basics**:

   | الحقل | القيمة |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | اسم البوت الخاص بك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **Subscription** | اختر اشتراك Azure الخاص بك |
   | **Resource group** | أنشئ مجموعة جديدة أو استخدم مجموعة موجودة |
   | **Pricing tier** | **Free** للتطوير/الاختبار |
   | **Type of App** | **Single Tenant** (موصى به - راجع الملاحظة أدناه) |
   | **Creation type** | **Create new Microsoft App ID** |

> **إشعار إيقاف:** تم إيقاف إنشاء بوتات جديدة متعددة المستأجرين بعد 2025-07-31. استخدم **Single Tenant** للبوتات الجديدة.

3. انقر **Review + create** → **Create** (انتظر نحو 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot الخاص بك → **Configuration**
2. انسخ **Microsoft App ID** → هذا هو `appId`
3. انقر **Manage Password** → انتقل إلى App Registration
4. ضمن **Certificates & secrets** → **New client secret** → انسخ **Value** → هذا هو `appPassword`
5. انتقل إلى **Overview** → انسخ **Directory (tenant) ID** → هذا هو `tenantId`

### الخطوة 3: ضبط نقطة نهاية المراسلة

1. في Azure Bot → **Configuration**
2. اضبط **Messaging endpoint** على عنوان URL الخاص بـ webhook:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تفعيل قناة Teams

1. في Azure Bot → **Channels**
2. انقر **Microsoft Teams** → Configure → Save
3. اقبل شروط الخدمة

<a id="federated-authentication-certificate--managed-identity"></a>

## المصادقة الموحدة (شهادة + Managed Identity)

> أضيف في 2026.3.24

بالنسبة لعمليات النشر الإنتاجية، يدعم OpenClaw **المصادقة الموحدة** كبديل أكثر أمانًا من client secrets. تتوفر طريقتان:

### الخيار A: المصادقة المعتمدة على الشهادة

استخدم شهادة PEM مسجلة في App Registration الخاصة بك في Entra ID.

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

### الخيار B: Azure Managed Identity

استخدم Azure Managed Identity للمصادقة من دون كلمة مرور. وهذا مثالي لعمليات النشر على بنية Azure التحتية (AKS وApp Service وآلات Azure الافتراضية) حيث تتوفر managed identity.

**كيف يعمل:**

1. تحتوي pod/VM الخاصة بالبوت على managed identity (معينة من النظام أو من المستخدم).
2. يربط **federated identity credential** بين managed identity وApp Registration في Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw الحزمة `@azure/identity` للحصول على رموز من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يُمرَّر الرمز إلى Teams SDK لمصادقة البوت.

**المتطلبات المسبقة:**

- بنية Azure تحتية مع تفعيل managed identity (AKS workload identity أو App Service أو VM)
- إنشاء federated identity credential على App Registration في Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من pod/VM

**التكوين (managed identity معينة من النظام):**

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

**التكوين (managed identity معينة من المستخدم):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط للهوية المعينة من المستخدم)

### إعداد AKS Workload Identity

لنشرات AKS التي تستخدم workload identity:

1. **فعّل workload identity** على عنقود AKS الخاص بك.
2. **أنشئ federated identity credential** على App Registration في Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **أضف تعليقًا توضيحيًا إلى Kubernetes service account** باستخدام app client ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **أضف label إلى pod** لحقن workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكد من الوصول الشبكي** إلى IMDS (`169.254.169.254`) — إذا كنت تستخدم NetworkPolicy، فأضف قاعدة egress تسمح بحركة المرور إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة | التكوين | المزايا | العيوب |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret** | `appPassword` | إعداد بسيط | يتطلب تدوير السر، وأقل أمانًا |
| **Certificate** | `authType: "federated"` + `certificatePath` | لا يوجد سر مشترك عبر الشبكة | عبء إدارة الشهادات |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | بلا كلمة مرور، ولا أسرار تحتاج إلى إدارة | يتطلب بنية Azure التحتية |

**السلوك الافتراضي:** عندما لا يتم تعيين `authType`، يستخدم OpenClaw افتراضيًا مصادقة client secret. تستمر التكوينات الحالية في العمل من دون تغييرات.

## التطوير المحلي (الأنفاق)

لا يمكن لـ Teams الوصول إلى `localhost`. استخدم نفقًا للتطوير المحلي:

**الخيار A: ngrok**

```bash
ngrok http 3978
# انسخ عنوان URL الذي يبدأ بـ https، مثل https://abc123.ngrok.io
# اضبط نقطة نهاية المراسلة على: https://abc123.ngrok.io/api/messages
```

**الخيار B: Tailscale Funnel**

```bash
tailscale funnel 3978
# استخدم عنوان URL الخاص بـ Tailscale Funnel كنقطة نهاية للمراسلة
```

## Teams Developer Portal (بديل)

بدلًا من إنشاء ملف manifest ZIP يدويًا، يمكنك استخدام [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. انقر **+ New app**
2. املأ المعلومات الأساسية (الاسم، الوصف، معلومات المطور)
3. انتقل إلى **App features** → **Bot**
4. اختر **Enter a bot ID manually** والصق Azure Bot App ID الخاص بك
5. حدّد النطاقات: **Personal** و **Team** و **Group Chat**
6. انقر **Distribute** → **Download app package**
7. في Teams: **Apps** → **Manage your apps** → **Upload a custom app** → اختر ملف ZIP

غالبًا ما يكون هذا أسهل من تحرير ملفات JSON manifest يدويًا.

## اختبار البوت

**الخيار A: Azure Web Chat (تحقق من Webhook أولًا)**

1. في Azure Portal → مورد Azure Bot الخاص بك → **Test in Web Chat**
2. أرسل رسالة - يجب أن ترى ردًا
3. هذا يؤكد أن نقطة نهاية Webhook تعمل قبل إعداد Teams

**الخيار B: Teams (بعد تثبيت التطبيق)**

1. ثبّت تطبيق Teams (تحميل جانبي أو كتالوج المؤسسة)
2. اعثر على البوت في Teams وأرسل رسالة مباشرة
3. تحقق من سجلات Gateway لرؤية النشاط الوارد

## الإعداد (الحد الأدنى للنص فقط)

1. **تأكد من أن Plugin الخاص بـ Microsoft Teams متاح**
   - تتضمن إصدارات OpenClaw المجمّعة الحالية هذا Plugin بالفعل.
   - يمكن للإصدارات/التثبيتات الأقدم أو المخصصة إضافته يدويًا:
     - من npm: `openclaw plugins install @openclaw/msteams`
     - من نسخة checkout محلية: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **تسجيل البوت**
   - أنشئ Azure Bot (راجع أعلاه) وسجّل ما يلي:
     - App ID
     - client secret (App password)
     - Tenant ID (single-tenant)

3. **Teams app manifest**
   - أدرج إدخال `bot` بحيث يكون `botId = <App ID>`.
   - النطاقات: `personal` و `team` و `groupChat`.
   - `supportsFiles: true` (مطلوب لمعالجة الملفات ضمن النطاق الشخصي).
   - أضف أذونات RSC (أدناه).
   - أنشئ الأيقونات: `outline.png` (32x32) و `color.png` (192x192).
   - اضغط الملفات الثلاثة معًا في ملف ZIP: `manifest.json` و `outline.png` و `color.png`.

4. **اضبط OpenClaw**

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
   - `MSTEAMS_CERTIFICATE_PATH` (مصادقة موحدة + شهادة)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (مصادقة موحدة + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (لهوية MI المعينة من المستخدم فقط)

5. **نقطة نهاية البوت**
   - اضبط Azure Bot Messaging Endpoint على:
     - `https://<host>:3978/api/messages` (أو المسار/المنفذ الذي اخترته).

6. **شغّل Gateway**
   - تبدأ قناة Teams تلقائيًا عندما يكون Plugin المضمّن أو المثبّت يدويًا متاحًا ويوجد تكوين `msteams` مع بيانات الاعتماد.

## إجراء معلومات العضو

يوفّر OpenClaw إجراء `member-info` معتمدًا على Graph لـ Microsoft Teams بحيث تتمكن الوكلاء وعمليات الأتمتة من resolve تفاصيل أعضاء القناة (اسم العرض، البريد الإلكتروني، الدور) مباشرة من Microsoft Graph.

المتطلبات:

- إذن RSC باسم `Member.Read.Group` (موجود بالفعل في manifest الموصى به)
- لعمليات البحث عبر الفرق: إذن Graph Application باسم `User.Read.All` مع موافقة المسؤول

يتم تقييد الإجراء بواسطة `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عندما تتوفر بيانات اعتماد Graph).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القناة/المجموعة الحديثة التي تُغلّف داخل prompt.
- يرجع إلى `messages.groupChat.historyLimit`. اضبطه على `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل الخيط الذي يتم جلبه بواسطة قوائم سماح المرسلين (`allowFrom` / `groupAllowFrom`)، لذلك فإن تهيئة سياق الخيط لا تتضمن إلا رسائل من مرسلين مسموح بهم.
- يُمرَّر سياق المرفقات المقتبسة (`ReplyTo*` المشتق من HTML الرد في Teams) حاليًا كما تم استلامه.
- بمعنى آخر، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ ولا تتم تصفية اليوم إلا بعض مسارات السياق التكميلي المحددة.
- يمكن تقييد سجل الرسائل المباشرة عبر `channels.msteams.dmHistoryLimit` (أدوار المستخدم). تجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات Teams RSC الحالية (Manifest)

هذه هي أذونات **resourceSpecific** الحالية في Teams app manifest الخاص بنا. وهي تنطبق فقط داخل الفريق/الدردشة المثبّت فيها التطبيق.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` (Application) - استلام جميع رسائل القناة من دون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**للدردشات الجماعية:**

- `ChatMessage.Read.Chat` (Application) - استلام جميع رسائل الدردشة الجماعية من دون @mention

## مثال على Teams Manifest (منقح)

مثال أدنى وصالح يحتوي على الحقول المطلوبة. استبدل المعرّفات وعناوين URL.

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

### تحذيرات خاصة بـ Manifest (حقول أساسية)

- يجب أن يطابق `bots[].botId` **بالضرورة** Azure Bot App ID.
- يجب أن يطابق `webApplicationInfo.id` **بالضرورة** Azure Bot App ID.
- يجب أن يتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal` و `team` و `groupChat`).
- إن `bots[].supportsFiles: true` مطلوب لمعالجة الملفات في النطاق الشخصي.
- يجب أن تتضمن `authorization.permissions.resourceSpecific` أذونات قراءة/إرسال القنوات إذا كنت تريد حركة مرور القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبّت بالفعل (مثلًا لإضافة أذونات RSC):

1. حدّث ملف `manifest.json` بالإعدادات الجديدة
2. **زد قيمة الحقل `version`** (مثلًا `1.0.0` → `1.1.0`)
3. **أعد ضغط** manifest مع الأيقونات (`manifest.json` و `outline.png` و `color.png`)
4. ارفع ملف zip الجديد:
   - **الخيار A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → اعثر على تطبيقك → Upload new version
   - **الخيار B (التحميل الجانبي):** في Teams → Apps → Manage your apps → Upload a custom app
5. **لقنوات الفرق:** أعد تثبيت التطبيق في كل فريق حتى تدخل الأذونات الجديدة حيز التنفيذ
6. **أغلق Teams تمامًا ثم أعد تشغيله** (لا تكتفِ بإغلاق النافذة) لمسح بيانات تعريف التطبيق المخزنة مؤقتًا

## الإمكانات: RSC فقط مقابل Graph

### مع **Teams RSC فقط** (التطبيق مثبّت، من دون أذونات Graph API)

يعمل:

- قراءة محتوى **النص** لرسائل القناة.
- إرسال محتوى **النص** لرسائل القناة.
- استلام مرفقات الملفات في **النطاق الشخصي (DM)**.

لا يعمل:

- **محتويات الصور أو الملفات** في القنوات/المجموعات (تتضمن الحمولة فقط HTML stub).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (أبعد من حدث Webhook الحي).

### مع **Teams RSC + أذونات Microsoft Graph Application**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة داخل الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القنوات/الدردشات عبر Graph.

### ‏RSC مقابل Graph API

| الإمكانية | أذونات RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل في الوقت الفعلي** | نعم (عبر Webhook) | لا (استطلاع فقط) |
| **الرسائل التاريخية** | لا | نعم (يمكن الاستعلام عن السجل) |
| **تعقيد الإعداد** | App manifest فقط | يتطلب موافقة المسؤول + تدفق الرموز |
| **يعمل دون اتصال** | لا (يجب أن يكون قيد التشغيل) | نعم (يمكن الاستعلام في أي وقت) |

**الخلاصة:** إن RSC مخصص للاستماع في الوقت الفعلي؛ أما Graph API فمخصص للوصول إلى السجل. للحاق بالرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط + السجل المفعّلان عبر Graph (مطلوب للقنوات)

إذا كنت تحتاج إلى صور/ملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب عليك تفعيل أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **App Registration** ضمن Entra ID (Azure AD)، أضف أذونات Microsoft Graph من نوع **Application**:
   - `ChannelMessage.Read.All` (مرفقات القنوات + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (الدردشات الجماعية)
2. **امنح موافقة المسؤول** للمستأجر.
3. ارفع قيمة **إصدار manifest** لتطبيق Teams، ثم أعد رفعه، ثم **أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams تمامًا ثم أعد تشغيله** لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

**إذن إضافي لإشارات المستخدمين:** تعمل إشارات المستخدمين @mentions مباشرة للمستخدمين الموجودين في المحادثة. ولكن إذا أردت البحث ديناميكيًا عن مستخدمين والإشارة إليهم وهم **ليسوا في المحادثة الحالية**، فأضف إذن `User.Read.All` من نوع Application وامنح موافقة المسؤول.

## القيود المعروفة

### مهلات Webhook

يُسلّم Teams الرسائل عبر HTTP Webhook. إذا استغرقت المعالجة وقتًا طويلًا جدًا (مثل بطء استجابات LLM)، فقد ترى:

- مهلات Gateway
- إعادة محاولة Teams لإرسال الرسالة (مما يسبب تكرارات)
- إسقاط الردود

يتعامل OpenClaw مع هذا عبر الإرجاع السريع وإرسال الردود بشكل استباقي، ولكن قد تظل الاستجابات البطيئة جدًا تسبب مشكلات.

### التنسيق

إن Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق** و _مائل_ و `code` والروابط
- قد لا يُعرض Markdown المعقد (الجداول، القوائم المتداخلة) بشكل صحيح
- تُدعم Adaptive Cards للاستطلاعات وعمليات الإرسال ذات العرض الدلالي (راجع أدناه)

## التكوين

الإعدادات الرئيسية (راجع `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تفعيل/تعطيل القناة.
- `channels.msteams.appId` و `channels.msteams.appPassword` و `channels.msteams.tenantId`: بيانات اعتماد البوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة سماح الرسائل المباشرة (يُنصح باستخدام معرّفات كائنات AAD). يقوم المعالج بعمل resolve للأسماء إلى معرّفات أثناء الإعداد عندما يتوفر وصول Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تفعيل مطابقة UPN/اسم العرض القابلة للتغيير والتوجيه المباشر باسم الفريق/القناة.
- `channels.msteams.textChunkLimit`: حجم تجزئة النص الصادر.
- `channels.msteams.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التجزئة حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة سماح لمضيفي المرفقات الواردة (تكون افتراضيًا نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة سماح لإرفاق رؤوس Authorization عند إعادة محاولة الوسائط (تكون افتراضيًا مضيفي Graph + Bot Framework).
- `channels.msteams.requireMention`: اشتراط @mention في القنوات/المجموعات (الافتراضي true).
- `channels.msteams.replyStyle`: ‏`thread | top-level` (راجع [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) تُستخدم عند غياب تجاوز على مستوى القناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مرسل (مع دعم wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مرسل (مع دعم wildcard `"*"`).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:` و `e164:` و `username:` و `name:` (لا تزال المفاتيح القديمة غير المسبوقة ببادئة تُطابَق مع `id:` فقط).
- `channels.msteams.actions.memberInfo`: تفعيل أو تعطيل إجراء معلومات العضو المعتمد على Graph (الافتراضي: مفعّل عندما تتوفر بيانات اعتماد Graph).
- `channels.msteams.authType`: نوع المصادقة — `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (مصادقة موحدة + مصادقة بالشهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختيارية، غير مطلوبة للمصادقة).
- `channels.msteams.useManagedIdentity`: تفعيل مصادقة managed identity (في وضع federated).
- `channels.msteams.managedIdentityClientId`: معرّف العميل للـ managed identity المعينة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرّف موقع SharePoint لرفع الملفات في الدردشات/القنوات الجماعية (راجع [إرسال الملفات في الدردشات الجماعية](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (راجع [/concepts/session](/ar/concepts/session)):
  - تشارك الرسائل المباشرة الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: Threads مقابل Posts

قدّمت Teams مؤخرًا نمطين لواجهة القنوات فوق نموذج البيانات الأساسي نفسه:

| النمط | الوصف | `replyStyle` الموصى به |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (كلاسيكي) | تظهر الرسائل كبطاقات مع ردود مترابطة أسفلها | `thread` (الافتراضي) |
| **Threads** (شبيه بـ Slack) | تتدفق الرسائل خطيًا، بشكل أقرب إلى Slack | `top-level` |

**المشكلة:** لا تكشف Teams API عن نمط واجهة المستخدم الذي تستخدمه القناة. إذا استخدمت `replyStyle` غير الصحيح:

- `thread` في قناة بنمط Threads → تظهر الردود متداخلة بشكل غير مريح
- `top-level` في قناة بنمط Posts → تظهر الردود كمنشورات مستقلة على المستوى الأعلى بدلًا من داخل الخيط

**الحل:** اضبط `replyStyle` لكل قناة بحسب إعداد القناة:

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
- **القنوات/المجموعات:** تعيش المرفقات في تخزين M365 ‏(SharePoint/OneDrive). لا تتضمن حمولة Webhook إلا HTML stub، وليس وحدات بايت الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- لعمليات الإرسال الصريحة التي تبدأ بملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ ويصبح `message` الاختياري هو النص/التعليق المصاحب، ويتجاوز `filename` الاسم المرفوع.

من دون أذونات Graph، سيتم استلام رسائل القنوات التي تحتوي على صور كنص فقط (ولا يمكن للبوت الوصول إلى محتوى الصورة).
افتراضيًا، ينزّل OpenClaw الوسائط فقط من أسماء مضيف Microsoft/Teams. يمكنك التجاوز باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
لا تُرفق رؤوس Authorization إلا للمضيفين الموجودين في `channels.msteams.mediaAuthAllowHosts` (الافتراضي: مضيفو Graph + Bot Framework). أبقِ هذه القائمة صارمة (وتجنب لواحق multi-tenant).

## إرسال الملفات في الدردشات الجماعية

يمكن للبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard ‏(مضمّن). ولكن **إرسال الملفات في الدردشات/القنوات الجماعية** يتطلب إعدادًا إضافيًا:

| السياق | كيفية إرسال الملفات | الإعداد المطلوب |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة** | FileConsentCard → يقبل المستخدم → يرفع البوت | يعمل مباشرة |
| **الدردشات/القنوات الجماعية** | الرفع إلى SharePoint → مشاركة رابط | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | مضمنة inline بترميز Base64 | يعمل مباشرة |

### لماذا تحتاج الدردشات الجماعية إلى SharePoint

لا تمتلك البوتات محرك OneDrive شخصيًا (لا تعمل نقطة نهاية Graph API ‏`/me/drive` مع هويات التطبيق). لإرسال الملفات في الدردشات/القنوات الجماعية، يرفع البوت الملف إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID ‏(Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` (Application) - اختياري، يفعّل روابط المشاركة لكل مستخدم

2. **امنح موافقة المسؤول** للمستأجر.

3. **احصل على معرّف موقع SharePoint الخاص بك:**

   ```bash
   # عبر Graph Explorer أو curl مع رمز صالح:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # مثال: لموقع على "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # تتضمن الاستجابة: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **اضبط OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... تكوين آخر ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### سلوك المشاركة

| الإذن | سلوك المشاركة |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` فقط | رابط مشاركة على مستوى المؤسسة (يمكن لأي شخص داخل المؤسسة الوصول) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | رابط مشاركة لكل مستخدم (يمكن فقط لأعضاء الدردشة الوصول) |

تكون المشاركة لكل مستخدم أكثر أمانًا لأن المشاركين في الدردشة فقط هم من يمكنهم الوصول إلى الملف. إذا كان إذن `Chat.Read.All` مفقودًا، يعود البوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع الاحتياطي

| السيناريو | النتيجة |
| ------------------------------------------------- | -------------------------------------------------- |
| دردشة جماعية + ملف + تم ضبط `sharePointSiteId` | الرفع إلى SharePoint، وإرسال رابط مشاركة |
| دردشة جماعية + ملف + لا يوجد `sharePointSiteId` | محاولة رفع إلى OneDrive (قد تفشل)، وإرسال نص فقط |
| دردشة شخصية + ملف | تدفق FileConsentCard (يعمل من دون SharePoint) |
| أي سياق + صورة | مضمنة inline بترميز Base64 ‏(تعمل من دون SharePoint) |

### موقع تخزين الملفات

تُخزَّن الملفات المرفوعة في مجلد `/OpenClawShared/` ضمن مكتبة المستندات الافتراضية لموقع SharePoint المضبوط.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams على شكل Adaptive Cards (لا توجد Teams poll API أصلية).

- CLI: ‏`openclaw message poll --channel msteams --target conversation:<id> ...`
- تُسجل الأصوات بواسطة Gateway في `~/.openclaw/msteams-polls.json`.
- يجب أن يبقى Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا بعد (افحص ملف التخزين إذا لزم الأمر).

## بطاقات العرض

أرسل حمولات عرض دلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. يعرضها OpenClaw كبطاقات Teams Adaptive Cards انطلاقًا من عقد العرض العام.

تقبل المعلمة `presentation` كتلًا دلالية. عند توفير `presentation`، يصبح نص الرسالة اختياريًا.

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

| نوع الهدف | التنسيق | مثال |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| مستخدم (بالمعرّف) | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| مستخدم (بالاسم) | `user:<display-name>` | `user:John Smith` (يتطلب Graph API) |
| مجموعة/قناة | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| مجموعة/قناة (خام) | `<conversation-id>` | `19:abc123...@thread.tacv2` (إذا كان يحتوي على `@thread`) |

**أمثلة CLI:**

```bash
# الإرسال إلى مستخدم حسب المعرّف
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# الإرسال إلى مستخدم حسب اسم العرض (يحفّز بحث Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# الإرسال إلى دردشة جماعية أو قناة
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# إرسال بطاقة عرض إلى محادثة
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

ملاحظة: من دون البادئة `user:`، تُفسَّر الأسماء افتراضيًا على أنها أسماء مجموعات/فرق. استخدم دائمًا `user:` عند استهداف الأشخاص باسم العرض.

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** أن يتفاعل المستخدم، لأننا نخزّن مراجع المحادثة عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة `dmPolicy` وتقييد قائمة السماح.

## معرّفات الفريق والقناة (مشكلة شائعة)

إن معلمة الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليست** معرّف الفريق المستخدم في التكوين. استخرج المعرّفات من مسار URL بدلًا من ذلك:

**عنوان URL للفريق:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    معرّف الفريق (افك ترميز URL لهذا)
```

**عنوان URL للقناة:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      معرّف القناة (افك ترميز URL لهذا)
```

**لأغراض التكوين:**

- معرّف الفريق = مقطع المسار بعد `/team/` ‏(بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`)
- معرّف القناة = مقطع المسار بعد `/channel/` ‏(بعد فك ترميز URL)
- **تجاهل** معلمة الاستعلام `groupId`

## القنوات الخاصة

يدعم البوت القنوات الخاصة بشكل محدود:

| الميزة | القنوات القياسية | القنوات الخاصة |
| ---------------------------- | ----------------- | ---------------------- |
| تثبيت البوت | نعم | محدود |
| الرسائل في الوقت الفعلي (webhook) | نعم | قد لا تعمل |
| أذونات RSC | نعم | قد تتصرف بشكل مختلف |
| @mentions | نعم | إذا كان الوصول إلى البوت ممكنًا |
| سجل Graph API | نعم | نعم (مع الأذونات) |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات البوت
2. استخدم الرسائل المباشرة - يمكن للمستخدمين دائمًا مراسلة البوت مباشرة
3. استخدم Graph API للوصول إلى السجل (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### المشكلات الشائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams تمامًا ثم أعد فتحه.
- **لا توجد ردود في القناة:** الإشارات مطلوبة افتراضيًا؛ اضبط `channels.msteams.requireMention=false` أو اضبطه لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض manifest القديم):** أزل التطبيق ثم أضفه مرة أخرى وأغلق Teams تمامًا لتحديثه.
- **401 Unauthorized من webhook:** هذا متوقع عند الاختبار اليدوي من دون Azure JWT - ويعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع Manifest

- **"Icon file cannot be empty":** يشير manifest إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (`outline.png` بحجم 32x32 و`color.png` بحجم 192x192).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتًا في فريق/دردشة أخرى. اعثر عليه وأزل تثبيته أولًا، أو انتظر 5-10 دقائق حتى يكتمل الانتشار.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح أدوات المطور في المتصفح (F12) → علامة تبويب Network، وتحقق من جسم الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" - فهذا غالبًا يتجاوز قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقق من أن `webApplicationInfo.id` يطابق App ID الخاص بالبوت لديك تمامًا
2. أعد رفع التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقق مما إذا كان مسؤول المؤسسة قد حظر أذونات RSC
4. تأكد من أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` للدردشات الجماعية

## المراجع

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (القنوات/المجموعات تتطلب Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
