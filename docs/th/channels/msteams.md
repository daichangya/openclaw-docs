---
read_when:
    - กำลังทำงานกับฟีเจอร์ช่องของ Microsoft Teams
summary: สถานะการรองรับบอต Microsoft Teams ความสามารถ และการกำหนดค่า
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T08:59:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

รองรับการส่งข้อความและไฟล์แนบใน DM แล้ว; การส่งไฟล์ในช่องและกลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats)) โพลล์จะถูกส่งผ่าน Adaptive Cards การดำเนินการกับข้อความเปิดเผย `upload-file` แบบชัดเจนสำหรับการส่งที่เน้นไฟล์ก่อน

## Bundled plugin

Microsoft Teams มาพร้อมเป็น Plugin ที่รวมมาให้ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
จึงไม่ต้องติดตั้งแยกต่างหากใน build แบบแพ็กเกจปกติ

หากคุณใช้ build รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Teams มาด้วย
ให้ติดตั้งด้วยตนเอง:

```bash
openclaw plugins install @openclaw/msteams
```

เช็กเอาต์ภายในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Microsoft Teams พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยคำสั่งด้านบน
2. สร้าง **Azure Bot** (App ID + client secret + tenant ID)
3. กำหนดค่า OpenClaw ด้วย credentials เหล่านั้น
4. เปิดเผย `/api/messages` (พอร์ต 3978 โดยค่าเริ่มต้น) ผ่าน URL สาธารณะหรือ tunnel
5. ติดตั้งแพ็กเกจแอป Teams แล้วเริ่ม Gateway

คอนฟิกขั้นต่ำ (client secret):

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

สำหรับการปรับใช้จริง ให้พิจารณาใช้ [การยืนยันตัวตนแบบ federated](#federated-authentication) (certificate หรือ managed identity) แทน client secret

หมายเหตุ: แชตกลุ่มถูกบล็อกเป็นค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้งค่า `channels.msteams.groupAllowFrom` (หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ โดยยังคงควบคุมด้วย mention เป็นค่าเริ่มต้น)

## การเขียนคอนฟิก

โดยค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดตคอนฟิกที่ถูกทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่คงที่
- อย่าพึ่งพาการจับคู่ UPN/display-name สำหรับ allowlist — ค่าเหล่านี้เปลี่ยนได้ OpenClaw ปิดการจับคู่ชื่อโดยตรงเป็นค่าเริ่มต้น; หากต้องการใช้ ให้เปิดอย่างชัดเจนด้วย `channels.msteams.dangerouslyAllowNameMatching: true`
- wizard สามารถแปลงชื่อเป็น ID ผ่าน Microsoft Graph ได้เมื่อ credentials อนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (บล็อกไว้จนกว่าคุณจะเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าไว้
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งคนใดสามารถทริกเกอร์ในแชตกลุ่ม/ช่องได้ (fallback ไปยัง `channels.msteams.allowFrom`)
- ตั้งค่า `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน (แต่ยังคงควบคุมด้วย mention เป็นค่าเริ่มต้น)
- หากต้องการอนุญาต **ไม่ให้มีช่องใดเลย** ให้ตั้งค่า `channels.msteams.groupPolicy: "disabled"`

ตัวอย่าง:

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

**Teams + allowlist ของช่อง**

- กำหนดขอบเขตการตอบกลับในกลุ่ม/ช่องโดยระบุ teams และ channels ภายใต้ `channels.msteams.teams`
- คีย์ควรใช้ team ID และ channel conversation ID ที่คงที่
- เมื่อ `groupPolicy="allowlist"` และมี teams allowlist อยู่ จะยอมรับเฉพาะ teams/channels ที่ระบุไว้เท่านั้น (ยังคงควบคุมด้วย mention)
- configure wizard รองรับรายการ `Team/Channel` และจะบันทึกให้คุณ
- เมื่อเริ่มต้น OpenClaw จะ resolve ชื่อทีม/ช่องและชื่อผู้ใช้ใน allowlist เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึก mapping ไว้ในล็อก; ชื่อทีม/ช่องที่ resolve ไม่ได้จะยังถูกเก็บไว้ตามที่พิมพ์ แต่จะถูกเพิกเฉยสำหรับการ routing โดยค่าเริ่มต้น เว้นแต่จะเปิด `channels.msteams.dangerouslyAllowNameMatching: true`

ตัวอย่าง:

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

## การตั้งค่า Azure Bot

ก่อนกำหนดค่า OpenClaw ให้สร้าง resource Azure Bot และบันทึก credentials ของมัน

<Steps>
  <Step title="Create the Azure Bot">
    ไปที่ [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) และกรอกแท็บ **Basics**:

    | Field              | Value                                                    |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำกัน)      |
    | **Subscription**   | Azure subscription ของคุณ                                |
    | **Resource group** | สร้างใหม่หรือใช้ที่มีอยู่                                |
    | **Pricing tier**   | **Free** สำหรับ dev/testing                               |
    | **Type of App**    | **Single Tenant** (แนะนำ)                                |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    บอตแบบ multi-tenant ใหม่ถูกยกเลิกหลัง 2025-07-31 ใช้ **Single Tenant** สำหรับบอตใหม่
    </Note>

    คลิก **Review + create** → **Create** (รอประมาณ 1-2 นาที)

  </Step>

  <Step title="Capture credentials">
    จาก resource Azure Bot → **Configuration**:

    - คัดลอก **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → คัดลอกค่า → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Configure messaging endpoint">
    Azure Bot → **Configuration** → ตั้งค่า **Messaging endpoint**:

    - เวอร์ชันใช้งานจริง: `https://your-domain.com/api/messages`
    - การพัฒนาในเครื่อง: ใช้ tunnel (ดู [การพัฒนาในเครื่อง](#local-development-tunneling))

  </Step>

  <Step title="Enable the Teams channel">
    Azure Bot → **Channels** → คลิก **Microsoft Teams** → Configure → Save ยอมรับ Terms of Service
  </Step>
</Steps>

## การยืนยันตัวตนแบบ federated

> เพิ่มใน 2026.3.24

สำหรับการปรับใช้จริง OpenClaw รองรับ **การยืนยันตัวตนแบบ federated** เป็นทางเลือกที่ปลอดภัยกว่าสำหรับ client secret โดยมีให้ใช้สองวิธี:

### ตัวเลือก A: การยืนยันตัวตนด้วย certificate

ใช้ PEM certificate ที่ลงทะเบียนกับ Entra ID app registration ของคุณ

**การตั้งค่า:**

1. สร้างหรือจัดหา certificate (รูปแบบ PEM พร้อม private key)
2. ใน Entra ID → App Registration → **Certificates & secrets** → **Certificates** → อัปโหลด public certificate

**คอนฟิก:**

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

**ตัวแปรสภาพแวดล้อม:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### ตัวเลือก B: Azure Managed Identity

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน วิธีนี้เหมาะอย่างยิ่งสำหรับการปรับใช้บนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity ให้ใช้งาน

**วิธีทำงาน:**

1. pod/VM ของบอตมี managed identity (system-assigned หรือ user-assigned)
2. **federated identity credential** จะเชื่อม managed identity เข้ากับ Entra ID app registration
3. ขณะรัน OpenClaw จะใช้ `@azure/identity` เพื่อรับ token จาก Azure IMDS endpoint (`169.254.169.254`)
4. token จะถูกส่งต่อไปยัง Teams SDK เพื่อใช้ยืนยันตัวตนของบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้งาน managed identity แล้ว (AKS workload identity, App Service, VM)
- มีการสร้าง federated identity credential บน Entra ID app registration
- pod/VM สามารถเข้าถึง IMDS (`169.254.169.254:80`) ผ่านเครือข่ายได้

**คอนฟิก (managed identity แบบ system-assigned):**

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

**คอนฟิก (managed identity แบบ user-assigned):**

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

**ตัวแปรสภาพแวดล้อม:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (เฉพาะแบบ user-assigned)

### การตั้งค่า AKS workload identity

สำหรับการปรับใช้ AKS ที่ใช้ workload identity:

1. **เปิดใช้งาน workload identity** บน AKS cluster ของคุณ
2. **สร้าง federated identity credential** บน Entra ID app registration:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **ใส่ annotation ให้ Kubernetes service account** ด้วย app client ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **ใส่ label ให้ pod** สำหรับการ inject workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **ตรวจสอบให้แน่ใจว่าสามารถเข้าถึง IMDS ผ่านเครือข่ายได้** (`169.254.169.254`) — หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` ที่พอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| วิธี                  | คอนฟิก                                         | ข้อดี                              | ข้อเสีย                              |
| --------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------ |
| **Client secret**     | `appPassword`                                  | ตั้งค่าง่าย                        | ต้องหมุนเวียน secret, ปลอดภัยน้อยกว่า |
| **Certificate**       | `authType: "federated"` + `certificatePath`    | ไม่มี shared secret ผ่านเครือข่าย | มีภาระในการจัดการ certificate         |
| **Managed Identity**  | `authType: "federated"` + `useManagedIdentity` | ไม่ใช้รหัสผ่าน ไม่มี secrets ให้จัดการ | ต้องใช้โครงสร้างพื้นฐาน Azure       |

**พฤติกรรมเริ่มต้น:** เมื่อไม่ได้ตั้งค่า `authType` OpenClaw จะใช้การยืนยันตัวตนด้วย client secret เป็นค่าเริ่มต้น คอนฟิกที่มีอยู่เดิมยังคงทำงานต่อได้โดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาในเครื่อง (tunneling)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้ tunnel สำหรับการพัฒนาในเครื่อง:

**ตัวเลือก A: ngrok**

```bash
ngrok http 3978
# คัดลอก URL แบบ https เช่น https://abc123.ngrok.io
# ตั้งค่า messaging endpoint เป็น: https://abc123.ngrok.io/api/messages
```

**ตัวเลือก B: Tailscale Funnel**

```bash
tailscale funnel 3978
# ใช้ URL ของ Tailscale funnel เป็น messaging endpoint
```

## Teams Developer Portal (ทางเลือก)

แทนที่จะสร้างไฟล์ manifest ZIP ด้วยตนเอง คุณสามารถใช้ [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. คลิก **+ New app**
2. กรอกข้อมูลพื้นฐาน (ชื่อ คำอธิบาย ข้อมูลผู้พัฒนา)
3. ไปที่ **App features** → **Bot**
4. เลือก **Enter a bot ID manually** แล้ววาง Azure Bot App ID ของคุณ
5. ทำเครื่องหมายขอบเขต: **Personal**, **Team**, **Group Chat**
6. คลิก **Distribute** → **Download app package**
7. ใน Teams: **Apps** → **Manage your apps** → **Upload a custom app** → เลือกไฟล์ ZIP

วิธีนี้มักง่ายกว่าการแก้ไขไฟล์ manifest JSON ด้วยมือ

## การทดสอบบอต

**ตัวเลือก A: Azure Web Chat (ตรวจสอบ webhook ก่อน)**

1. ใน Azure Portal → resource Azure Bot ของคุณ → **Test in Web Chat**
2. ส่งข้อความ — คุณควรเห็นการตอบกลับ
3. วิธีนี้ยืนยันว่า endpoint webhook ของคุณทำงานก่อนตั้งค่า Teams

**ตัวเลือก B: Teams (หลังติดตั้งแอป)**

1. ติดตั้งแอป Teams (sideload หรือผ่าน org catalog)
2. ค้นหาบอตใน Teams แล้วส่ง DM
3. ตรวจสอบล็อก Gateway สำหรับ incoming activity

<Accordion title="การแทนที่ด้วยตัวแปรสภาพแวดล้อม">

คีย์คอนฟิกของบอต/การยืนยันตัวตนทั้งหมดสามารถตั้งค่าผ่านตัวแปรสภาพแวดล้อมได้เช่นกัน:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` หรือ `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (federated + certificate)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (federated + managed identity; client ID ใช้เฉพาะแบบ user-assigned)

</Accordion>

## การดำเนินการข้อมูลสมาชิก

OpenClaw เปิดเผยการดำเนินการ `member-info` ที่ขับเคลื่อนด้วย Graph สำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถ resolve รายละเอียดสมาชิกของช่องได้โดยตรงจาก Microsoft Graph (ชื่อที่แสดง อีเมล บทบาท)

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อม admin consent

การดำเนินการนี้ถูกควบคุมด้วย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดเมื่อมี Graph credentials ให้ใช้)

## บริบทประวัติ

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความช่อง/กลุ่มล่าสุดที่จะถูกห่อเข้าไปใน prompt
- fallback ไปยัง `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)
- ประวัติเธรดที่ดึงมาจะถูกกรองโดย allowlist ของผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการ seed บริบทของเธรดจะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาต
- บริบทไฟล์แนบที่ถูกอ้างถึง (`ReplyTo*` ที่ได้มาจาก HTML การตอบกลับของ Teams) ปัจจุบันจะถูกส่งผ่านตามที่ได้รับ
- กล่าวอีกนัยหนึ่ง allowlist ใช้ควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้; วันนี้จะมีการกรองเฉพาะเส้นทางบริบทเสริมบางอย่างเท่านั้น
- ประวัติ DM สามารถจำกัดได้ด้วย `channels.msteams.dmHistoryLimit` (user turns) การแทนที่รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ Teams RSC ปัจจุบัน

ต่อไปนี้คือ **resourceSpecific permissions ที่มีอยู่แล้ว** ใน manifest ของแอป Teams ของเรา โดยจะมีผลเฉพาะภายในทีมหรือแชตที่ติดตั้งแอปไว้เท่านั้น

**สำหรับ channels (ขอบเขตทีม):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความช่องทั้งหมดได้โดยไม่ต้องมี @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**สำหรับแชตกลุ่ม:**

- `ChatMessage.Read.Chat` (Application) - รับข้อความแชตกลุ่มทั้งหมดได้โดยไม่ต้องมี @mention

## ตัวอย่าง manifest ของ Teams

ตัวอย่างขั้นต่ำที่ถูกต้องพร้อมฟิลด์ที่จำเป็น แทนที่ IDs และ URLs ตามจริง

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

### ข้อควรระวังเกี่ยวกับ manifest (ฟิลด์ที่ต้องมี)

- `bots[].botId` **ต้อง**ตรงกับ Azure Bot App ID
- `webApplicationInfo.id` **ต้อง**ตรงกับ Azure Bot App ID
- `bots[].scopes` ต้องรวมพื้นผิวที่คุณวางแผนจะใช้ (`personal`, `team`, `groupChat`)
- `bots[].supportsFiles: true` จำเป็นสำหรับการจัดการไฟล์ในขอบเขต personal
- `authorization.permissions.resourceSpecific` ต้องรวมสิทธิ์อ่าน/ส่งของช่อง หากคุณต้องการทราฟฟิกของช่อง

### การอัปเดตแอปที่มีอยู่แล้ว

หากต้องการอัปเดตแอป Teams ที่ติดตั้งอยู่แล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าในฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **zip ใหม่** manifest พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลดไฟล์ zip ใหม่:
   - **ตัวเลือก A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → ค้นหาแอปของคุณ → Upload new version
   - **ตัวเลือก B (Sideload):** ใน Teams → Apps → Manage your apps → Upload a custom app
5. **สำหรับช่องของทีม:** ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล
6. **ออกจาก Teams ให้หมดแล้วเปิดใหม่อีกครั้ง** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้าง metadata ของแอปที่แคชไว้

## ความสามารถ: RSC เท่านั้น เทียบกับ Graph

### Teams RSC เท่านั้น (ไม่มีสิทธิ์ Graph API)

ใช้งานได้:

- อ่านเนื้อหา **ข้อความ** ของข้อความในช่อง
- ส่งเนื้อหา **ข้อความ** ไปยังช่อง
- รับไฟล์แนบใน **ข้อความส่วนตัว (DM)**

ใช้งานไม่ได้:

- **รูปภาพหรือเนื้อหาไฟล์** ในช่อง/กลุ่ม (payload จะมีเพียง HTML stub)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจาก live webhook event)

### Teams RSC ร่วมกับสิทธิ์ Microsoft Graph application

เพิ่มความสามารถ:

- ดาวน์โหลด hosted contents (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความของช่อง/แชตผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ             | สิทธิ์ RSC            | Graph API                            |
| ---------------------- | --------------------- | ------------------------------------ |
| **ข้อความแบบเรียลไทม์** | ได้ (ผ่าน webhook)     | ไม่ได้ (polling เท่านั้น)             |
| **ข้อความย้อนหลัง**     | ไม่ได้                | ได้ (สามารถ query ประวัติได้)         |
| **ความซับซ้อนในการตั้งค่า** | เฉพาะ app manifest    | ต้องใช้ admin consent + token flow   |
| **ทำงานแบบออฟไลน์**     | ไม่ได้ (ต้องกำลังรัน)  | ได้ (query ได้ทุกเวลา)                |

**สรุป:** RSC ใช้สำหรับการฟังแบบเรียลไทม์; Graph API ใช้สำหรับการเข้าถึงข้อมูลย้อนหลัง หากต้องการตามอ่านข้อความที่พลาดไปขณะออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องมี admin consent)

## สื่อและประวัติที่เปิดใช้ Graph (จำเป็นสำหรับ channels)

หากคุณต้องการรูปภาพ/ไฟล์ใน **channels** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดใช้สิทธิ์ Microsoft Graph และให้ admin consent

1. ใน Entra ID (Azure AD) **App Registration** ให้เพิ่ม Microsoft Graph **Application permissions**:
   - `ChannelMessage.Read.All` (ไฟล์แนบของช่อง + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชตกลุ่ม)
2. **ให้ admin consent** สำหรับ tenant
3. เพิ่มค่า **manifest version** ของแอป Teams, อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ออกจาก Teams ให้หมดแล้วเปิดใหม่อีกครั้ง** เพื่อล้าง metadata ของแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการ mention ผู้ใช้:** การ @mention ผู้ใช้ทำงานได้ทันทีสำหรับผู้ใช้ที่อยู่ในการสนทนาอยู่แล้ว อย่างไรก็ตาม หากคุณต้องการค้นหาและ mention ผู้ใช้ที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** แบบไดนามิก ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ admin consent

## ข้อจำกัดที่ทราบ

### Webhook timeouts

Teams ส่งข้อความผ่าน HTTP webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับ LLM ช้า) คุณอาจพบ:

- Gateway timeouts
- Teams ลองส่งข้อความซ้ำ (ทำให้เกิดข้อความซ้ำ)
- คำตอบตกหล่น

OpenClaw จัดการเรื่องนี้โดยตอบกลับอย่างรวดเร็วและส่งคำตอบแบบ proactive แต่การตอบกลับที่ช้ามากอาจยังทำให้เกิดปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- markdown ที่ซับซ้อน (ตาราง, รายการซ้อนกัน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลล์และการส่งแบบ semantic presentation (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าแบบจัดกลุ่ม (ดู `/gateway/configuration` สำหรับแพตเทิร์นช่องที่ใช้ร่วมกัน)

<AccordionGroup>
  <Accordion title="Core และ webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: credentials ของบอต
    - `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
    - `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
  </Accordion>

  <Accordion title="การยืนยันตัวตน">
    - `authType`: `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
    - `certificatePath`, `certificateThumbprint`: การยืนยันตัวตนแบบ federated + certificate (thumbprint เป็นทางเลือก)
    - `useManagedIdentity`, `managedIdentityClientId`: การยืนยันตัวตนแบบ federated + managed identity
  </Accordion>

  <Accordion title="การควบคุมการเข้าถึง">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
    - `allowFrom`: allowlist ของ DM, ควรใช้ AAD object ID; wizard จะ resolve ชื่อเมื่อมีสิทธิ์เข้าถึง Graph
    - `dangerouslyAllowNameMatching`: ตัวเลือก break-glass สำหรับ UPN/display-name ที่เปลี่ยนแปลงได้ และการ routing ด้วยชื่อทีม/ช่อง
    - `requireMention`: บังคับให้มี @mention ใน channels/groups (ค่าเริ่มต้น `true`)
  </Accordion>

  <Accordion title="การแทนที่ระดับทีมและช่อง">
    ทั้งหมดนี้จะ override ค่าเริ่มต้นระดับบนสุด:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: ค่านโยบายเครื่องมือเริ่มต้นระดับทีม
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    คีย์ของ `toolsBySender` รองรับ prefix `id:`, `e164:`, `username:`, `name:` (คีย์ที่ไม่มี prefix จะถูกแมปเป็น `id:`) `"*"` คือ wildcard

  </Accordion>

  <Accordion title="การส่งมอบ สื่อ และการดำเนินการ">
    - `textChunkLimit`: ขนาด chunk ของข้อความขาออก
    - `chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` (แยกตามขอบเขตย่อหน้าก่อนแล้วค่อยดูความยาว)
    - `mediaAllowHosts`: allowlist ของ host สำหรับไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมน Microsoft/Teams)
    - `mediaAuthAllowHosts`: host ที่อาจได้รับ Authorization headers เมื่อ retry (ค่าเริ่มต้นเป็น Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: เปิด/ปิดการดำเนินการข้อมูลสมาชิกที่ขับเคลื่อนด้วย Graph (ค่าเริ่มต้นเปิดเมื่อมี Graph)
    - `sharePointSiteId`: จำเป็นสำหรับการอัปโหลดไฟล์ในแชตกลุ่ม/channels (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## การกำหนดเส้นทางและเซสชัน

- session key ใช้รูปแบบมาตรฐานของเอเจนต์ (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความส่วนตัวใช้เซสชันหลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความในช่อง/กลุ่มใช้ conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: threads เทียบกับ posts

เมื่อไม่นานมานี้ Teams ได้เพิ่มรูปแบบ UI ของช่องสองแบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ                  | คำอธิบาย                                                | `replyStyle` ที่แนะนำ |
| ----------------------- | ------------------------------------------------------- | --------------------- |
| **Posts** (แบบดั้งเดิม) | ข้อความจะแสดงเป็นการ์ดและมีคำตอบแบบเธรดอยู่ด้านล่าง      | `thread` (ค่าเริ่มต้น) |
| **Threads** (คล้าย Slack) | ข้อความไหลแบบเชิงเส้น คล้าย Slack มากกว่า             | `top-level`           |

**ปัญหา:** Teams API ไม่เปิดเผยว่าช่องใช้รูปแบบ UI แบบใด หากคุณใช้ `replyStyle` ไม่ตรง:

- `thread` ในช่องแบบ Threads → คำตอบจะไปซ้อนกันอย่างไม่สวยงาม
- `top-level` ในช่องแบบ Posts → คำตอบจะปรากฏเป็นโพสต์ระดับบนแยกต่างหาก แทนที่จะอยู่ในเธรด

**วิธีแก้:** กำหนดค่า `replyStyle` เป็นรายช่องตามวิธีตั้งค่าของช่องนั้น:

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

## ไฟล์แนบและรูปภาพ

**ข้อจำกัดปัจจุบัน:**

- **DMs:** รูปภาพและไฟล์แนบใช้งานได้ผ่าน Teams bot file APIs
- **Channels/groups:** ไฟล์แนบจะอยู่ในที่เก็บข้อมูล M365 (SharePoint/OneDrive) โดย payload ของ webhook จะมีเพียง HTML stub ไม่ใช่ไบต์ของไฟล์จริง **ต้องใช้สิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของช่อง
- สำหรับการส่งแบบเน้นไฟล์ก่อนอย่างชัดเจน ให้ใช้ `action=upload-file` กับ `media` / `filePath` / `path`; `message` แบบไม่บังคับจะกลายเป็นข้อความ/หมายเหตุประกอบ และ `filename` จะ override ชื่อไฟล์ที่อัปโหลด

หากไม่มีสิทธิ์ Graph ข้อความในช่องที่มีรูปภาพจะถูกรับมาเป็นข้อความอย่างเดียว (บอตไม่สามารถเข้าถึงเนื้อหารูปภาพได้)
โดยค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจาก hostnames ของ Microsoft/Teams เท่านั้น สามารถ override ได้ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุก host)
Authorization headers จะถูกแนบให้เฉพาะ host ที่อยู่ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นคือ Graph + Bot Framework hosts) ควรคงรายการนี้ให้เข้มงวด (หลีกเลี่ยง suffix แบบ multi-tenant)

## การส่งไฟล์ในแชตกลุ่ม

บอตสามารถส่งไฟล์ใน DM ได้โดยใช้โฟลว์ FileConsentCard (มีมาให้ในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชตกลุ่ม/channels** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท                   | วิธีส่งไฟล์                               | การตั้งค่าที่ต้องใช้                            |
| ----------------------- | ---------------------------------------- | ----------------------------------------------- |
| **DMs**                 | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที                                  |
| **แชตกลุ่ม/channels**  | อัปโหลดไปยัง SharePoint → แชร์ลิงก์       | ต้องใช้ `sharePointSiteId` + สิทธิ์ Graph      |
| **รูปภาพ (ทุกบริบท)**   | inline แบบเข้ารหัส Base64               | ใช้งานได้ทันที                                  |

### เหตุใดแชตกลุ่มจึงต้องใช้ SharePoint

บอตไม่มีไดรฟ์ OneDrive ส่วนตัว (Graph API endpoint `/me/drive` ใช้ไม่ได้กับ application identities) ในการส่งไฟล์ในแชตกลุ่ม/channels บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** และสร้างลิงก์แชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ, เปิดใช้ลิงก์แชร์แบบรายผู้ใช้

2. **ให้ admin consent** สำหรับ tenant

3. **ดึง SharePoint site ID ของคุณ:**

   ```bash
   # ผ่าน Graph Explorer หรือ curl พร้อม token ที่ถูกต้อง:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # ตัวอย่าง: สำหรับไซต์ที่ "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # คำตอบจะมี: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **กำหนดค่า OpenClaw:**

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

### พฤติกรรมการแชร์

| สิทธิ์                                   | พฤติกรรมการแชร์                                          |
| ---------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` เท่านั้น           | ลิงก์แชร์ทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้)            |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | ลิงก์แชร์แบบรายผู้ใช้ (เฉพาะสมาชิกแชตเข้าถึงได้)         |

การแชร์แบบรายผู้ใช้ปลอดภัยกว่า เนื่องจากมีเพียงผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะ fallback ไปใช้การแชร์ทั้งองค์กร

### พฤติกรรม fallback

| สถานการณ์                                          | ผลลัพธ์                                              |
| -------------------------------------------------- | ---------------------------------------------------- |
| แชตกลุ่ม + ไฟล์ + กำหนด `sharePointSiteId` แล้ว     | อัปโหลดไปยัง SharePoint, ส่งลิงก์แชร์                |
| แชตกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`         | พยายามอัปโหลดไปยัง OneDrive (อาจล้มเหลว), ส่งข้อความอย่างเดียว |
| แชตส่วนตัว + ไฟล์                                  | โฟลว์ FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint) |
| ทุกบริบท + รูปภาพ                                  | inline แบบเข้ารหัส Base64 (ทำงานได้โดยไม่ต้องใช้ SharePoint) |

### ตำแหน่งที่เก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกเก็บไว้ในโฟลเดอร์ `/OpenClawShared/` ภายใน document library เริ่มต้นของไซต์ SharePoint ที่กำหนดไว้

## โพลล์ (adaptive cards)

OpenClaw ส่งโพลล์ของ Teams เป็น Adaptive Cards (ไม่มี Teams poll API แบบ native)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- คะแนนโหวตจะถูกบันทึกโดย Gateway ใน `~/.openclaw/msteams-polls.json`
- Gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- โพลล์ยังไม่โพสต์สรุปผลอัตโนมัติในตอนนี้ (หากจำเป็นให้ตรวจสอบไฟล์ store)

## การ์ดการนำเสนอ

ส่ง payload การนำเสนอเชิงความหมายไปยังผู้ใช้หรือบทสนทนาใน Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะเรนเดอร์เป็น Teams Adaptive Cards จากสัญญาการนำเสนอแบบทั่วไป

พารามิเตอร์ `presentation` รองรับ semantic blocks เมื่อมี `presentation` ข้อความ message จะเป็นค่าไม่บังคับ

**เครื่องมือเอเจนต์:**

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

สำหรับรายละเอียดรูปแบบเป้าหมาย ดู [รูปแบบเป้าหมาย](#target-formats) ด้านล่าง

## รูปแบบเป้าหมาย

เป้าหมายของ MSTeams ใช้ prefix เพื่อแยกระหว่างผู้ใช้และบทสนทนา:

| ประเภทเป้าหมาย          | รูปแบบ                           | ตัวอย่าง                                            |
| ----------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID)         | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ผู้ใช้ (ตามชื่อ)        | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API)              |
| กลุ่ม/ช่อง              | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| กลุ่ม/ช่อง (raw)        | `<conversation-id>`              | `19:abc123...@thread.tacv2` (หากมี `@thread`)      |

**ตัวอย่าง CLI:**

```bash
# ส่งถึงผู้ใช้ตาม ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# ส่งถึงผู้ใช้ตาม display name (ทริกเกอร์การค้นหาผ่าน Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# ส่งถึงแชตกลุ่มหรือช่อง
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# ส่งการ์ดการนำเสนอไปยังบทสนทนา
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**ตัวอย่างเครื่องมือเอเจนต์:**

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

หมายเหตุ: หากไม่มี prefix `user:` ชื่อจะถูกตีความเป็นการ resolve กลุ่ม/ทีมโดยค่าเริ่มต้น ใช้ `user:` เสมอเมื่อระบุเป้าหมายเป็นบุคคลด้วย display name

## การส่งข้อความเชิงรุก

- การส่งข้อความเชิงรุกทำได้ **หลังจาก** ผู้ใช้มีการโต้ตอบแล้วเท่านั้น เพราะเราจะเก็บ conversation references ณ จุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการควบคุมด้วย allowlist

## IDs ของทีมและช่อง

พารามิเตอร์ query `groupId` ใน URL ของ Teams **ไม่ใช่** team ID ที่ใช้สำหรับการกำหนดค่า ให้ดึง IDs จาก path ของ URL แทน:

**URL ของทีม:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (ถอดรหัส URL ค่านี้)
```

**URL ของช่อง:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (ถอดรหัส URL ค่านี้)
```

**สำหรับคอนฟิก:**

- Team ID = ส่วน path หลัง `/team/` (ถอดรหัส URL แล้ว เช่น `19:Bk4j...@thread.tacv2`)
- Channel ID = ส่วน path หลัง `/channel/` (ถอดรหัส URL แล้ว)
- **ไม่ต้องสนใจ** พารามิเตอร์ query `groupId`

## ช่องส่วนตัว

บอตรองรับช่องส่วนตัวอย่างจำกัด:

| ฟีเจอร์                      | ช่องมาตรฐาน        | ช่องส่วนตัว            |
| ---------------------------- | ------------------ | ---------------------- |
| การติดตั้งบอต                | ได้                | จำกัด                  |
| ข้อความแบบเรียลไทม์ (webhook) | ได้                | อาจใช้ไม่ได้            |
| สิทธิ์ RSC                   | ได้                | อาจทำงานต่างออกไป      |
| @mentions                    | ได้                | ได้หากบอตเข้าถึงได้    |
| ประวัติผ่าน Graph API        | ได้                | ได้ (เมื่อมีสิทธิ์)     |

**วิธีแก้ชั่วคราวหากช่องส่วนตัวใช้งานไม่ได้:**

1. ใช้ช่องมาตรฐานสำหรับการโต้ตอบกับบอต
2. ใช้ DMs - ผู้ใช้สามารถส่งข้อความหาบอตโดยตรงได้เสมอ
3. ใช้ Graph API สำหรับการเข้าถึงย้อนหลัง (ต้องใช้ `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

- **รูปภาพไม่แสดงในช่อง:** ไม่มีสิทธิ์ Graph หรือไม่มี admin consent ติดตั้งแอป Teams ใหม่ และออก/เปิด Teams ใหม่ทั้งหมด
- **ไม่มีการตอบกลับในช่อง:** โดยค่าเริ่มต้นต้องมี mentions; ตั้งค่า `channels.msteams.requireMention=false` หรือกำหนดค่าเป็นรายทีม/ช่อง
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบแล้วเพิ่มแอปใหม่ และออกจาก Teams ให้หมดเพื่อรีเฟรช
- **401 Unauthorized จาก webhook:** เป็นสิ่งที่คาดไว้เมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT - หมายความว่า endpoint เข้าถึงได้แต่การยืนยันตัวตนล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลด manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ ให้สร้างไอคอน PNG ที่ถูกต้อง (`outline.png` ขนาด 32x32, `color.png` ขนาด 192x192)
- **"webApplicationInfo.Id already in use":** แอปยังคงถูกติดตั้งอยู่ในทีมหรือแชตอื่น ให้ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีให้การเผยแพร่เสร็จ
- **"Something went wrong" ตอนอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน จากนั้นเปิด browser DevTools (F12) → แท็บ Network และตรวจสอบ response body เพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" — วิธีนี้มักข้ามข้อจำกัดของ sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอตของคุณแบบเป๊ะ
2. อัปโหลดแอปใหม่และติดตั้งใหม่ในทีมหรือแชต
3. ตรวจสอบว่าแอดมินขององค์กรคุณได้บล็อกสิทธิ์ RSC ไว้หรือไม่
4. ยืนยันว่าคุณใช้ขอบเขตถูกต้อง: `ChannelMessage.Read.Group` สำหรับทีม และ `ChatMessage.Read.Chat` สำหรับแชตกลุ่ม

## อ้างอิง

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/group ต้องใช้ Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ภาพรวม Channels" icon="list" href="/th/channels">
    ช่องที่รองรับทั้งหมด
  </Card>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    การยืนยันตัวตน DM และโฟลว์การจับคู่
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรมของแชตกลุ่มและการควบคุมด้วย mention
  </Card>
  <Card title="Channel routing" icon="route" href="/th/channels/channel-routing">
    การกำหนดเส้นทางเซสชันสำหรับข้อความ
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    โมเดลการเข้าถึงและการเสริมความปลอดภัย
  </Card>
</CardGroup>
