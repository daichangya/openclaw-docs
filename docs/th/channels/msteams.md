---
read_when:
    - กำลังพัฒนาฟีเจอร์ช่องทาง Microsoft Teams
summary: สถานะการรองรับบอต Microsoft Teams ความสามารถ และการกำหนดค่า
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T05:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9d52fb2cc7801e84249a705e0fa2052d4afbb7ef58cee2d3362b3e7012348c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "จงละทิ้งความหวังทั้งปวง ผู้ที่ก้าวเข้ามาที่นี่"

สถานะ: รองรับข้อความตัวอักษร + ไฟล์แนบใน DM; การส่งไฟล์ในแชนเนล/กลุ่มต้องใช้ `sharePointSiteId` + สิทธิ์ Graph (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats)) โพลล์จะถูกส่งผ่าน Adaptive Cards การดำเนินการข้อความมี `upload-file` แบบชัดเจนสำหรับการส่งที่เน้นไฟล์เป็นหลัก

## Plugin ที่มาพร้อมในชุด

Microsoft Teams มาพร้อมเป็น Plugin ที่บันเดิลมาใน OpenClaw รุ่นปัจจุบัน ดังนั้น
โดยปกติในการติดตั้งแบบแพ็กเกจจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Teams ที่บันเดิลมา
ให้ติดตั้งด้วยตนเอง:

```bash
openclaw plugins install @openclaw/msteams
```

Local checkout (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Microsoft Teams พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันบันเดิลมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองด้วยคำสั่งด้านบน
2. สร้าง **Azure Bot** (App ID + client secret + tenant ID)
3. กำหนดค่า OpenClaw ด้วยข้อมูลประจำตัวเหล่านั้น
4. เปิดเผย `/api/messages` (พอร์ต 3978 โดยค่าเริ่มต้น) ผ่าน URL สาธารณะหรือ tunnel
5. ติดตั้งแพ็กเกจแอป Teams และเริ่ม Gateway

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

สำหรับการนำไปใช้งานใน production ให้พิจารณาใช้ [federated authentication](#federated-authentication-certificate--managed-identity) (certificate หรือ managed identity) แทน client secret

หมายเหตุ: แชตกลุ่มจะถูกบล็อกโดยค่าเริ่มต้น (`channels.msteams.groupPolicy: "allowlist"`) หากต้องการอนุญาตการตอบกลับในกลุ่ม ให้ตั้ง `channels.msteams.groupAllowFrom` (หรือใช้ `groupPolicy: "open"` เพื่ออนุญาตสมาชิกใดก็ได้ โดยยังคงจำกัดด้วยการ mention ตามค่าเริ่มต้น)

## เป้าหมาย

- สนทนากับ OpenClaw ผ่าน Microsoft Teams DM, แชตกลุ่ม หรือแชนเนล
- รักษาการกำหนดเส้นทางให้แน่นอน: การตอบกลับจะกลับไปยังแชนเนลเดิมที่ข้อความเข้ามาเสมอ
- ใช้พฤติกรรมแชนเนลที่ปลอดภัยเป็นค่าเริ่มต้น (ต้องมีการ mention เว้นแต่จะกำหนดค่าไว้เป็นอย่างอื่น)

## การเขียนคอนฟิก

โดยค่าเริ่มต้น Microsoft Teams ได้รับอนุญาตให้เขียนการอัปเดตคอนฟิกที่ถูกเรียกโดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

**การเข้าถึง DM**

- ค่าเริ่มต้น: `channels.msteams.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะถูกละเว้นจนกว่าจะได้รับการอนุมัติ
- `channels.msteams.allowFrom` ควรใช้ AAD object ID ที่คงที่
- UPN/ชื่อที่แสดงผลเปลี่ยนแปลงได้ การจับคู่โดยตรงจึงปิดไว้ตามค่าเริ่มต้น และจะเปิดเฉพาะเมื่อ `channels.msteams.dangerouslyAllowNameMatching: true`
- ตัวช่วยตั้งค่าสามารถ resolve ชื่อเป็น ID ผ่าน Microsoft Graph ได้เมื่อข้อมูลประจำตัวอนุญาต

**การเข้าถึงกลุ่ม**

- ค่าเริ่มต้น: `channels.msteams.groupPolicy = "allowlist"` (บล็อกไว้จนกว่าคุณจะเพิ่ม `groupAllowFrom`) ใช้ `channels.defaults.groupPolicy` เพื่อแทนที่ค่าเริ่มต้นเมื่อยังไม่ได้ตั้งค่า
- `channels.msteams.groupAllowFrom` ควบคุมว่าผู้ส่งคนใดสามารถทริกเกอร์ในแชตกลุ่ม/แชนเนลได้ (fallback ไปใช้ `channels.msteams.allowFrom`)
- ตั้ง `groupPolicy: "open"` เพื่ออนุญาตสมาชิกทุกคน (แต่ยังคงจำกัดด้วยการ mention ตามค่าเริ่มต้น)
- หากต้องการ **ไม่อนุญาตแชนเนลใดเลย** ให้ตั้ง `channels.msteams.groupPolicy: "disabled"`

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

**Teams + allowlist ของแชนเนล**

- กำหนดขอบเขตการตอบกลับในกลุ่ม/แชนเนลโดยระบุ teams และ channels ภายใต้ `channels.msteams.teams`
- คีย์ควรใช้ team ID และ channel conversation ID ที่คงที่
- เมื่อ `groupPolicy="allowlist"` และมี teams allowlist อยู่ จะยอมรับเฉพาะ teams/channels ที่ระบุไว้เท่านั้น (โดยยังคงจำกัดด้วยการ mention)
- ตัวช่วยตั้งค่ายอมรับรายการ `Team/Channel` และบันทึกให้คุณ
- ตอนเริ่มต้น OpenClaw จะ resolve ชื่อ team/channel และ allowlist ของผู้ใช้เป็น ID (เมื่อสิทธิ์ Graph อนุญาต)
  และบันทึกการแมปลง log; ชื่อ team/channel ที่ resolve ไม่ได้จะถูกเก็บตามที่พิมพ์ไว้ แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางตามค่าเริ่มต้น เว้นแต่จะเปิด `channels.msteams.dangerouslyAllowNameMatching: true`

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

## วิธีการทำงาน

1. ตรวจสอบให้แน่ใจว่า Plugin Microsoft Teams พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันบันเดิลมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองด้วยคำสั่งด้านบน
2. สร้าง **Azure Bot** (App ID + secret + tenant ID)
3. สร้าง **แพ็กเกจแอป Teams** ที่อ้างอิงบอตและรวมสิทธิ์ RSC ด้านล่าง
4. อัปโหลด/ติดตั้งแอป Teams ลงใน team (หรือ personal scope สำหรับ DM)
5. กำหนดค่า `msteams` ใน `~/.openclaw/openclaw.json` (หรือตัวแปรสภาพแวดล้อม) และเริ่ม Gateway
6. Gateway จะรับทราฟฟิก webhook ของ Bot Framework ที่ `/api/messages` โดยค่าเริ่มต้น

## การตั้งค่า Azure Bot (ข้อกำหนดเบื้องต้น)

ก่อนกำหนดค่า OpenClaw คุณต้องสร้างทรัพยากร Azure Bot ก่อน

### ขั้นตอนที่ 1: สร้าง Azure Bot

1. ไปที่ [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. กรอกแท็บ **Basics**:

   | ฟิลด์ | ค่า |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ชื่อบอตของคุณ เช่น `openclaw-msteams` (ต้องไม่ซ้ำกัน) |
   | **Subscription**   | เลือก Azure subscription ของคุณ |
   | **Resource group** | สร้างใหม่หรือใช้ที่มีอยู่ |
   | **Pricing tier**   | **Free** สำหรับ dev/testing |
   | **Type of App**    | **Single Tenant** (แนะนำ - ดูหมายเหตุด้านล่าง) |
   | **Creation type**  | **Create new Microsoft App ID** |

> **ประกาศการเลิกใช้งาน:** การสร้างบอตแบบ multi-tenant ใหม่ถูกเลิกใช้งานหลังวันที่ 2025-07-31 ใช้ **Single Tenant** สำหรับบอตใหม่

3. คลิก **Review + create** → **Create** (รอประมาณ 1-2 นาที)

### ขั้นตอนที่ 2: รับข้อมูลประจำตัว

1. ไปที่ทรัพยากร Azure Bot ของคุณ → **Configuration**
2. คัดลอก **Microsoft App ID** → นี่คือ `appId` ของคุณ
3. คลิก **Manage Password** → ไปที่ App Registration
4. ภายใต้ **Certificates & secrets** → **New client secret** → คัดลอก **Value** → นี่คือ `appPassword` ของคุณ
5. ไปที่ **Overview** → คัดลอก **Directory (tenant) ID** → นี่คือ `tenantId` ของคุณ

### ขั้นตอนที่ 3: กำหนดค่า Messaging Endpoint

1. ใน Azure Bot → **Configuration**
2. ตั้งค่า **Messaging endpoint** เป็น URL webhook ของคุณ:
   - Production: `https://your-domain.com/api/messages`
   - Local dev: ใช้ tunnel (ดู [การพัฒนาแบบ Local](#local-development-tunneling) ด้านล่าง)

### ขั้นตอนที่ 4: เปิดใช้งานช่องทาง Teams

1. ใน Azure Bot → **Channels**
2. คลิก **Microsoft Teams** → Configure → Save
3. ยอมรับ Terms of Service

## Federated Authentication (Certificate + Managed Identity)

> เพิ่มใน 2026.3.24

สำหรับการนำไปใช้งานใน production OpenClaw รองรับ **federated authentication** เป็นทางเลือกที่ปลอดภัยกว่าสำหรับ client secret โดยมีให้เลือกสองวิธี:

### ตัวเลือก A: การยืนยันตัวตนด้วย certificate

ใช้ PEM certificate ที่ลงทะเบียนกับ app registration ใน Entra ID ของคุณ

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

ใช้ Azure Managed Identity สำหรับการยืนยันตัวตนแบบไม่ใช้รหัสผ่าน เหมาะอย่างยิ่งสำหรับการนำไปใช้งานบนโครงสร้างพื้นฐาน Azure (AKS, App Service, Azure VMs) ที่มี managed identity พร้อมใช้งาน

**วิธีทำงาน:**

1. pod/VM ของบอตมี managed identity (system-assigned หรือ user-assigned)
2. **federated identity credential** เชื่อม managed identity เข้ากับ app registration ใน Entra ID
3. ระหว่างรัน OpenClaw ใช้ `@azure/identity` เพื่อรับ token จาก Azure IMDS endpoint (`169.254.169.254`)
4. token จะถูกส่งให้ Teams SDK เพื่อใช้ยืนยันตัวตนของบอต

**ข้อกำหนดเบื้องต้น:**

- โครงสร้างพื้นฐาน Azure ที่เปิดใช้งาน managed identity (AKS workload identity, App Service, VM)
- มีการสร้าง federated identity credential บน app registration ใน Entra ID
- pod/VM ต้องเข้าถึงเครือข่ายไปยัง IMDS (`169.254.169.254:80`) ได้

**คอนฟิก (system-assigned managed identity):**

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

**คอนฟิก (user-assigned managed identity):**

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

### การตั้งค่า AKS Workload Identity

สำหรับการนำไปใช้งานบน AKS ที่ใช้ workload identity:

1. **เปิดใช้งาน workload identity** บน AKS cluster ของคุณ
2. **สร้าง federated identity credential** บน app registration ใน Entra ID:

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

4. **ใส่ label ให้ pod** เพื่อฉีด workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **ตรวจสอบให้แน่ใจว่าเข้าถึงเครือข่าย** ไปยัง IMDS (`169.254.169.254`) ได้ — หากใช้ NetworkPolicy ให้เพิ่มกฎ egress ที่อนุญาตทราฟฟิกไปยัง `169.254.169.254/32` บนพอร์ต 80

### การเปรียบเทียบประเภทการยืนยันตัวตน

| วิธี | คอนฟิก | ข้อดี | ข้อเสีย |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | ตั้งค่าง่าย | ต้องหมุนเวียน secret, ปลอดภัยน้อยกว่า |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | ไม่มี shared secret ผ่านเครือข่าย | มีภาระในการจัดการ certificate |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | ไม่ต้องใช้รหัสผ่าน ไม่มี secret ให้จัดการ | ต้องใช้โครงสร้างพื้นฐาน Azure |

**พฤติกรรมค่าเริ่มต้น:** เมื่อไม่ได้ตั้ง `authType` OpenClaw จะใช้การยืนยันตัวตนแบบ client secret โดยค่าเริ่มต้น คอนฟิกที่มีอยู่เดิมยังคงใช้งานต่อได้โดยไม่ต้องเปลี่ยนแปลง

## การพัฒนาแบบ Local (Tunneling)

Teams ไม่สามารถเข้าถึง `localhost` ได้ ใช้ tunnel สำหรับการพัฒนาแบบ local:

**ตัวเลือก A: ngrok**

```bash
ngrok http 3978
# คัดลอก URL https เช่น https://abc123.ngrok.io
# ตั้ง messaging endpoint เป็น: https://abc123.ngrok.io/api/messages
```

**ตัวเลือก B: Tailscale Funnel**

```bash
tailscale funnel 3978
# ใช้ URL funnel ของ Tailscale เป็น messaging endpoint
```

## Teams Developer Portal (ทางเลือกอื่น)

แทนที่จะสร้างไฟล์ manifest ZIP ด้วยตนเอง คุณสามารถใช้ [Teams Developer Portal](https://dev.teams.microsoft.com/apps) ได้:

1. คลิก **+ New app**
2. กรอกข้อมูลพื้นฐาน (ชื่อ คำอธิบาย ข้อมูลนักพัฒนา)
3. ไปที่ **App features** → **Bot**
4. เลือก **Enter a bot ID manually** แล้ววาง Azure Bot App ID ของคุณ
5. เลือก scopes: **Personal**, **Team**, **Group Chat**
6. คลิก **Distribute** → **Download app package**
7. ใน Teams: **Apps** → **Manage your apps** → **Upload a custom app** → เลือกไฟล์ ZIP

วิธีนี้มักง่ายกว่าการแก้ไขไฟล์ manifest JSON ด้วยมือ

## การทดสอบบอต

**ตัวเลือก A: Azure Web Chat (ตรวจสอบ webhook ก่อน)**

1. ใน Azure Portal → ทรัพยากร Azure Bot ของคุณ → **Test in Web Chat**
2. ส่งข้อความ — คุณควรเห็นการตอบกลับ
3. วิธีนี้ยืนยันได้ว่า endpoint ของ webhook ทำงานได้ก่อนตั้งค่า Teams

**ตัวเลือก B: Teams (หลังติดตั้งแอป)**

1. ติดตั้งแอป Teams (sideload หรือ org catalog)
2. ค้นหาบอตใน Teams แล้วส่ง DM
3. ตรวจสอบ log ของ Gateway สำหรับ activity ขาเข้า

## การตั้งค่า (ขั้นต่ำแบบข้อความเท่านั้น)

1. **ตรวจสอบให้แน่ใจว่า Plugin Microsoft Teams พร้อมใช้งาน**
   - OpenClaw รุ่นแพ็กเกจปัจจุบันบันเดิลมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเอง:
     - จาก npm: `openclaw plugins install @openclaw/msteams`
     - จาก local checkout: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **การลงทะเบียนบอต**
   - สร้าง Azure Bot (ดูด้านบน) และจดค่า:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Teams app manifest**
   - ใส่รายการ `bot` โดยมี `botId = <App ID>`
   - Scopes: `personal`, `team`, `groupChat`
   - `supportsFiles: true` (จำเป็นสำหรับการจัดการไฟล์ใน personal scope)
   - เพิ่มสิทธิ์ RSC (ด้านล่าง)
   - สร้างไอคอน: `outline.png` (32x32) และ `color.png` (192x192)
   - บีบอัดทั้งสามไฟล์รวมกัน: `manifest.json`, `outline.png`, `color.png`

4. **กำหนดค่า OpenClaw**

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

   คุณยังสามารถใช้ตัวแปรสภาพแวดล้อมแทนคีย์คอนฟิกได้:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (ไม่บังคับ: `"secret"` หรือ `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (ไม่บังคับ ไม่จำเป็นสำหรับการยืนยันตัวตน)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (เฉพาะ user-assigned MI)

5. **Bot endpoint**
   - ตั้ง Azure Bot Messaging Endpoint เป็น:
     - `https://<host>:3978/api/messages` (หรือ path/port ที่คุณเลือก)

6. **เรียกใช้ Gateway**
   - ช่องทาง Teams จะเริ่มทำงานโดยอัตโนมัติเมื่อมี Plugin ที่บันเดิลมาหรือติดตั้งเองพร้อมใช้งาน และมีคอนฟิก `msteams` พร้อมข้อมูลประจำตัว

## การดำเนินการ member info

OpenClaw เปิดให้ใช้การดำเนินการ `member-info` ที่ทำงานผ่าน Graph สำหรับ Microsoft Teams เพื่อให้เอเจนต์และระบบอัตโนมัติสามารถ resolve รายละเอียดสมาชิกในแชนเนลได้โดยตรงจาก Microsoft Graph (เช่น ชื่อที่แสดง อีเมล บทบาท)

ข้อกำหนด:

- สิทธิ์ RSC `Member.Read.Group` (มีอยู่แล้วใน manifest ที่แนะนำ)
- สำหรับการค้นหาข้ามทีม: สิทธิ์ Graph Application `User.Read.All` พร้อม admin consent

การดำเนินการนี้ถูกควบคุมด้วย `channels.msteams.actions.memberInfo` (ค่าเริ่มต้น: เปิดใช้งานเมื่อมีข้อมูลประจำตัว Graph พร้อมใช้งาน)

## History context

- `channels.msteams.historyLimit` ควบคุมจำนวนข้อความล่าสุดในแชนเนล/กลุ่มที่จะถูกห่อรวมเข้าไปใน prompt
- fallback ไปใช้ `messages.groupChat.historyLimit` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)
- ประวัติเธรดที่ดึงมาจะถูกกรองด้วย allowlist ของผู้ส่ง (`allowFrom` / `groupAllowFrom`) ดังนั้นการ seed thread context จะรวมเฉพาะข้อความจากผู้ส่งที่ได้รับอนุญาต
- context ของไฟล์แนบที่ถูกอ้างอิง (`ReplyTo*` ที่ได้จาก HTML การตอบกลับของ Teams) ปัจจุบันจะถูกส่งต่อไปตามที่ได้รับ
- กล่าวอีกนัยหนึ่ง allowlist ใช้ควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้; ปัจจุบันมีการกรองเฉพาะเส้นทาง context เสริมบางแบบเท่านั้น
- ประวัติ DM สามารถจำกัดได้ด้วย `channels.msteams.dmHistoryLimit` (จำนวนเทิร์นของผู้ใช้) การตั้งค่าแทนที่รายผู้ใช้: `channels.msteams.dms["<user_id>"].historyLimit`

## สิทธิ์ Teams RSC ปัจจุบัน (Manifest)

นี่คือ **resourceSpecific permissions** ที่มีอยู่ใน Teams app manifest ของเรา โดยจะมีผลเฉพาะภายในทีม/แชตที่ติดตั้งแอปไว้

**สำหรับแชนเนล (team scope):**

- `ChannelMessage.Read.Group` (Application) - รับข้อความทุกข้อความในแชนเนลได้โดยไม่ต้องมี @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**สำหรับแชตกลุ่ม:**

- `ChatMessage.Read.Chat` (Application) - รับข้อความทุกข้อความในแชตกลุ่มได้โดยไม่ต้องมี @mention

## ตัวอย่าง Teams Manifest (ปกปิดข้อมูลแล้ว)

ตัวอย่างขั้นต่ำที่ถูกต้องพร้อมฟิลด์ที่จำเป็น ให้แทนที่ ID และ URL

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

### ข้อควรระวังของ Manifest (ฟิลด์ที่ต้องมี)

- `bots[].botId` **ต้อง** ตรงกับ Azure Bot App ID
- `webApplicationInfo.id` **ต้อง** ตรงกับ Azure Bot App ID
- `bots[].scopes` ต้องรวมพื้นผิวที่คุณวางแผนจะใช้ (`personal`, `team`, `groupChat`)
- `bots[].supportsFiles: true` จำเป็นสำหรับการจัดการไฟล์ใน personal scope
- `authorization.permissions.resourceSpecific` ต้องรวมสิทธิ์อ่าน/ส่งของแชนเนล หากคุณต้องการทราฟฟิกของแชนเนล

### การอัปเดตแอปที่มีอยู่แล้ว

หากต้องการอัปเดตแอป Teams ที่ติดตั้งอยู่แล้ว (เช่น เพื่อเพิ่มสิทธิ์ RSC):

1. อัปเดต `manifest.json` ของคุณด้วยการตั้งค่าใหม่
2. **เพิ่มค่าในฟิลด์ `version`** (เช่น `1.0.0` → `1.1.0`)
3. **บีบอัดใหม่** manifest พร้อมไอคอน (`manifest.json`, `outline.png`, `color.png`)
4. อัปโหลด zip ใหม่:
   - **ตัวเลือก A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → ค้นหาแอปของคุณ → Upload new version
   - **ตัวเลือก B (Sideload):** ใน Teams → Apps → Manage your apps → Upload a custom app
5. **สำหรับแชนเนลของทีม:** ติดตั้งแอปใหม่ในแต่ละทีมเพื่อให้สิทธิ์ใหม่มีผล
6. **ปิดและเปิด Teams ใหม่ทั้งหมด** (ไม่ใช่แค่ปิดหน้าต่าง) เพื่อล้างข้อมูลเมทาดาทาของแอปที่แคชไว้

## ความสามารถ: RSC อย่างเดียว เทียบกับ Graph

### เมื่อมี **Teams RSC เท่านั้น** (ติดตั้งแอปแล้ว ไม่มีสิทธิ์ Graph API)

ทำได้:

- อ่านเนื้อหาข้อความ **ข้อความตัวอักษร** ในแชนเนล
- ส่งเนื้อหาข้อความ **ข้อความตัวอักษร** ไปยังแชนเนล
- รับไฟล์แนบใน **personal (DM)**

ทำไม่ได้:

- เนื้อหา **รูปภาพหรือไฟล์** ในแชนเนล/กลุ่ม (payload จะมีเพียง HTML stub)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความ (นอกเหนือจากอีเวนต์ webhook แบบสด)

### เมื่อมี **Teams RSC + สิทธิ์ Microsoft Graph Application**

จะเพิ่มความสามารถ:

- ดาวน์โหลด hosted contents (รูปภาพที่วางลงในข้อความ)
- ดาวน์โหลดไฟล์แนบที่เก็บไว้ใน SharePoint/OneDrive
- อ่านประวัติข้อความของแชนเนล/แชตผ่าน Graph

### RSC เทียบกับ Graph API

| ความสามารถ | สิทธิ์ RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **ข้อความแบบเรียลไทม์**  | ใช่ (ผ่าน webhook)    | ไม่ (polling เท่านั้น) |
| **ข้อความย้อนหลัง** | ไม่ | ใช่ (สามารถ query ประวัติได้) |
| **ความซับซ้อนในการตั้งค่า**    | แค่ app manifest | ต้องมี admin consent + token flow |
| **ทำงานตอนออฟไลน์ได้**       | ไม่ (ต้องกำลังรันอยู่) | ใช่ (query ได้ทุกเวลา) |

**สรุป:** RSC ใช้สำหรับการฟังแบบเรียลไทม์; Graph API ใช้สำหรับการเข้าถึงข้อมูลย้อนหลัง หากต้องการตามอ่านข้อความที่พลาดไประหว่างออฟไลน์ คุณต้องใช้ Graph API พร้อม `ChannelMessage.Read.All` (ต้องมี admin consent)

## สื่อ + ประวัติที่เปิดใช้ Graph (จำเป็นสำหรับแชนเนล)

หากคุณต้องการรูปภาพ/ไฟล์ใน **แชนเนล** หรือต้องการดึง **ประวัติข้อความ** คุณต้องเปิดสิทธิ์ Microsoft Graph และให้ admin consent

1. ใน Entra ID (Azure AD) **App Registration** ให้เพิ่มสิทธิ์ Microsoft Graph แบบ **Application permissions**:
   - `ChannelMessage.Read.All` (ไฟล์แนบในแชนเนล + ประวัติ)
   - `Chat.Read.All` หรือ `ChatMessage.Read.All` (แชตกลุ่ม)
2. **Grant admin consent** ให้กับ tenant
3. เพิ่มค่า **manifest version** ของแอป Teams, อัปโหลดใหม่ และ **ติดตั้งแอปใหม่ใน Teams**
4. **ปิดและเปิด Teams ใหม่ทั้งหมด** เพื่อล้างข้อมูลเมทาดาทาของแอปที่แคชไว้

**สิทธิ์เพิ่มเติมสำหรับการ mention ผู้ใช้:** การ @mention ผู้ใช้ทำงานได้ทันทีสำหรับผู้ใช้ที่อยู่ในการสนทนาอยู่แล้ว อย่างไรก็ตาม หากคุณต้องการค้นหาและ mention ผู้ใช้แบบไดนามิกที่ **ไม่ได้อยู่ในการสนทนาปัจจุบัน** ให้เพิ่มสิทธิ์ `User.Read.All` (Application) และให้ admin consent

## ข้อจำกัดที่ทราบ

### Webhook timeouts

Teams ส่งข้อความผ่าน HTTP webhook หากการประมวลผลใช้เวลานานเกินไป (เช่น การตอบกลับจาก LLM ช้า) คุณอาจพบ:

- Gateway timeouts
- Teams พยายามส่งข้อความซ้ำ (ทำให้เกิดข้อความซ้ำ)
- การตอบกลับที่ตกหล่น

OpenClaw จัดการเรื่องนี้โดยตอบกลับอย่างรวดเร็วและส่งคำตอบแบบ proactive แต่คำตอบที่ช้ามากอาจยังทำให้เกิดปัญหาได้

### การจัดรูปแบบ

Markdown ของ Teams มีข้อจำกัดมากกว่า Slack หรือ Discord:

- การจัดรูปแบบพื้นฐานใช้งานได้: **ตัวหนา**, _ตัวเอียง_, `code`, ลิงก์
- Markdown ที่ซับซ้อน (ตาราง, รายการซ้อน) อาจแสดงผลไม่ถูกต้อง
- รองรับ Adaptive Cards สำหรับโพลล์และการส่งแบบ semantic presentation (ดูด้านล่าง)

## การกำหนดค่า

การตั้งค่าหลัก (ดู `/gateway/configuration` สำหรับรูปแบบแชนเนลแบบใช้ร่วมกัน):

- `channels.msteams.enabled`: เปิด/ปิดใช้งานช่องทาง
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ข้อมูลประจำตัวของบอต
- `channels.msteams.webhook.port` (ค่าเริ่มต้น `3978`)
- `channels.msteams.webhook.path` (ค่าเริ่มต้น `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.msteams.allowFrom`: allowlist ของ DM (แนะนำให้ใช้ AAD object ID) ตัวช่วยตั้งค่าจะ resolve ชื่อเป็น ID ระหว่างการตั้งค่าเมื่อมี Graph access
- `channels.msteams.dangerouslyAllowNameMatching`: สวิตช์ break-glass สำหรับเปิดใช้งานการจับคู่ UPN/ชื่อที่แสดงผลซึ่งเปลี่ยนแปลงได้ และการกำหนดเส้นทางตามชื่อทีม/แชนเนลโดยตรงอีกครั้ง
- `channels.msteams.textChunkLimit`: ขนาด chunk ของข้อความขาออก
- `channels.msteams.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนจะแยกตามความยาว
- `channels.msteams.mediaAllowHosts`: allowlist สำหรับโฮสต์ไฟล์แนบขาเข้า (ค่าเริ่มต้นเป็นโดเมนของ Microsoft/Teams)
- `channels.msteams.mediaAuthAllowHosts`: allowlist สำหรับการแนบ Authorization header เมื่อ retry การดึงสื่อ (ค่าเริ่มต้นเป็นโฮสต์ของ Graph + Bot Framework)
- `channels.msteams.requireMention`: ต้องมี @mention ในแชนเนล/กลุ่ม (ค่าเริ่มต้น true)
- `channels.msteams.replyStyle`: `thread | top-level` (ดู [รูปแบบการตอบกลับ](#reply-style-threads-vs-posts))
- `channels.msteams.teams.<teamId>.replyStyle`: การตั้งค่าแทนที่รายทีม
- `channels.msteams.teams.<teamId>.requireMention`: การตั้งค่าแทนที่รายทีม
- `channels.msteams.teams.<teamId>.tools`: การตั้งค่าแทนที่นโยบายเครื่องมือเริ่มต้นรายทีม (`allow`/`deny`/`alsoAllow`) ที่ใช้เมื่อไม่มีการตั้งค่าแทนที่รายแชนเนล
- `channels.msteams.teams.<teamId>.toolsBySender`: การตั้งค่าแทนนโยบายเครื่องมือเริ่มต้นรายทีมแยกตามผู้ส่ง (รองรับ wildcard `"*"`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: การตั้งค่าแทนที่รายแชนเนล
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: การตั้งค่าแทนที่รายแชนเนล
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: การตั้งค่าแทนนโยบายเครื่องมือรายแชนเนล (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: การตั้งค่าแทนนโยบายเครื่องมือรายแชนเนลแยกตามผู้ส่ง (รองรับ wildcard `"*"`)
- คีย์ `toolsBySender` ควรใช้ prefix แบบชัดเจน:
  `id:`, `e164:`, `username:`, `name:` (คีย์แบบเดิมที่ไม่มี prefix จะยังแมปไปที่ `id:` เท่านั้น)
- `channels.msteams.actions.memberInfo`: เปิดหรือปิดการดำเนินการ member info ที่ทำงานผ่าน Graph (ค่าเริ่มต้น: เปิดใช้งานเมื่อมีข้อมูลประจำตัว Graph พร้อมใช้งาน)
- `channels.msteams.authType`: ประเภทการยืนยันตัวตน — `"secret"` (ค่าเริ่มต้น) หรือ `"federated"`
- `channels.msteams.certificatePath`: พาธไปยังไฟล์ PEM certificate (federated + certificate auth)
- `channels.msteams.certificateThumbprint`: thumbprint ของ certificate (ไม่บังคับ ไม่จำเป็นสำหรับการยืนยันตัวตน)
- `channels.msteams.useManagedIdentity`: เปิดใช้งานการยืนยันตัวตนด้วย managed identity (โหมด federated)
- `channels.msteams.managedIdentityClientId`: client ID สำหรับ user-assigned managed identity
- `channels.msteams.sharePointSiteId`: SharePoint site ID สำหรับการอัปโหลดไฟล์ในแชตกลุ่ม/แชนเนล (ดู [การส่งไฟล์ในแชตกลุ่ม](#sending-files-in-group-chats))

## การกำหนดเส้นทางและ Session

- Session keys ใช้รูปแบบมาตรฐานของเอเจนต์ (ดู [/concepts/session](/th/concepts/session)):
  - ข้อความส่วนตัวจะใช้ session หลักร่วมกัน (`agent:<agentId>:<mainKey>`)
  - ข้อความในแชนเนล/กลุ่มจะใช้ conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## รูปแบบการตอบกลับ: Threads เทียบกับ Posts

เมื่อไม่นานมานี้ Teams ได้เพิ่มรูปแบบ UI ของแชนเนล 2 แบบบนโมเดลข้อมูลพื้นฐานเดียวกัน:

| รูปแบบ | คำอธิบาย | `replyStyle` ที่แนะนำ |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (แบบคลาสสิก)      | ข้อความแสดงเป็นการ์ดพร้อมการตอบกลับแบบ threaded อยู่ด้านล่าง | `thread` (ค่าเริ่มต้น) |
| **Threads** (คล้าย Slack) | ข้อความไหลต่อเนื่องกันเชิงเส้น คล้าย Slack มากกว่า | `top-level` |

**ปัญหา:** Teams API ไม่ได้เปิดเผยว่าแชนเนลใช้รูปแบบ UI แบบใด หากคุณใช้ `replyStyle` ผิด:

- `thread` ในแชนเนลแบบ Threads → คำตอบจะไปซ้อนกันอย่างไม่สวยงาม
- `top-level` ในแชนเนลแบบ Posts → คำตอบจะกลายเป็นโพสต์ระดับบนสุดแยกต่างหากแทนที่จะอยู่ในเธรด

**วิธีแก้:** กำหนด `replyStyle` รายแชนเนลตามรูปแบบที่แชนเนลถูกตั้งไว้:

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

- **DM:** รูปภาพและไฟล์แนบใช้งานได้ผ่าน Teams bot file APIs
- **แชนเนล/กลุ่ม:** ไฟล์แนบอยู่ในที่เก็บข้อมูล M365 (SharePoint/OneDrive) payload ของ webhook จะมีเพียง HTML stub ไม่ใช่ไบต์ของไฟล์จริง **จำเป็นต้องมีสิทธิ์ Graph API** เพื่อดาวน์โหลดไฟล์แนบของแชนเนล
- สำหรับการส่งแบบ explicit ที่เน้นไฟล์เป็นหลัก ให้ใช้ `action=upload-file` กับ `media` / `filePath` / `path`; `message` แบบไม่บังคับจะกลายเป็นข้อความ/คำอธิบายประกอบ และ `filename` ใช้แทนชื่อไฟล์ที่อัปโหลดได้

หากไม่มีสิทธิ์ Graph ข้อความในแชนเนลที่มีรูปภาพจะถูกรับมาเป็นข้อความอย่างเดียว (บอตจะเข้าถึงเนื้อหารูปภาพไม่ได้)
โดยค่าเริ่มต้น OpenClaw จะดาวน์โหลดสื่อจาก hostname ของ Microsoft/Teams เท่านั้น แทนที่ได้ด้วย `channels.msteams.mediaAllowHosts` (ใช้ `["*"]` เพื่ออนุญาตทุกโฮสต์)
Authorization headers จะถูกแนบเฉพาะกับโฮสต์ใน `channels.msteams.mediaAuthAllowHosts` เท่านั้น (ค่าเริ่มต้นคือโฮสต์ Graph + Bot Framework) ควรรักษารายการนี้ให้เข้มงวด (หลีกเลี่ยง suffix แบบ multi-tenant)

## การส่งไฟล์ในแชตกลุ่ม

บอตสามารถส่งไฟล์ใน DM ได้โดยใช้ flow แบบ FileConsentCard (มีให้ในตัว) อย่างไรก็ตาม **การส่งไฟล์ในแชตกลุ่ม/แชนเนล** ต้องมีการตั้งค่าเพิ่มเติม:

| บริบท | วิธีส่งไฟล์ | การตั้งค่าที่ต้องมี |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → ผู้ใช้ยอมรับ → บอตอัปโหลด | ใช้งานได้ทันที |
| **แชตกลุ่ม/แชนเนล** | อัปโหลดไปยัง SharePoint → แชร์ลิงก์            | ต้องใช้ `sharePointSiteId` + สิทธิ์ Graph |
| **รูปภาพ (ทุกบริบท)** | inline แบบ Base64-encoded                        | ใช้งานได้ทันที |

### ทำไมแชตกลุ่มจึงต้องใช้ SharePoint

บอตไม่มีไดรฟ์ OneDrive ส่วนตัว (Graph API endpoint `/me/drive` ใช้ไม่ได้กับ application identities) หากต้องการส่งไฟล์ในแชตกลุ่ม/แชนเนล บอตจะอัปโหลดไปยัง **ไซต์ SharePoint** และสร้างลิงก์แชร์

### การตั้งค่า

1. **เพิ่มสิทธิ์ Graph API** ใน Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - อัปโหลดไฟล์ไปยัง SharePoint
   - `Chat.Read.All` (Application) - ไม่บังคับ เปิดใช้ลิงก์แชร์แบบรายผู้ใช้

2. **Grant admin consent** ให้กับ tenant

3. **รับ SharePoint site ID ของคุณ:**

   ```bash
   # ผ่าน Graph Explorer หรือ curl พร้อม token ที่ใช้ได้:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # ตัวอย่าง: สำหรับไซต์ที่ "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # การตอบกลับประกอบด้วย: "id": "contoso.sharepoint.com,guid1,guid2"
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

| สิทธิ์ | พฤติกรรมการแชร์ |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` เท่านั้น              | ลิงก์แชร์ทั้งองค์กร (ทุกคนในองค์กรเข้าถึงได้) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ลิงก์แชร์แบบรายผู้ใช้ (เฉพาะสมาชิกในแชตเข้าถึงได้) |

การแชร์แบบรายผู้ใช้ปลอดภัยกว่า เพราะมีเพียงผู้เข้าร่วมแชตเท่านั้นที่เข้าถึงไฟล์ได้ หากไม่มีสิทธิ์ `Chat.Read.All` บอตจะ fallback ไปใช้การแชร์ทั้งองค์กร

### พฤติกรรม fallback

| สถานการณ์ | ผลลัพธ์ |
| ------------------------------------------------- | -------------------------------------------------- |
| แชตกลุ่ม + ไฟล์ + กำหนด `sharePointSiteId` แล้ว | อัปโหลดไปยัง SharePoint แล้วส่งลิงก์แชร์ |
| แชตกลุ่ม + ไฟล์ + ไม่มี `sharePointSiteId`         | พยายามอัปโหลดไปยัง OneDrive (อาจล้มเหลว) แล้วส่งเฉพาะข้อความ |
| แชตส่วนตัว + ไฟล์                              | flow แบบ FileConsentCard (ทำงานได้โดยไม่ต้องใช้ SharePoint) |
| ทุกบริบท + รูปภาพ                               | inline แบบ Base64-encoded (ทำงานได้โดยไม่ต้องใช้ SharePoint) |

### ตำแหน่งที่เก็บไฟล์

ไฟล์ที่อัปโหลดจะถูกเก็บในโฟลเดอร์ `/OpenClawShared/` ใน document library เริ่มต้นของไซต์ SharePoint ที่กำหนดไว้

## โพลล์ (Adaptive Cards)

OpenClaw ส่งโพลล์ใน Teams เป็น Adaptive Cards (ไม่มี Teams poll API แบบเนทีฟ)

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- คะแนนโหวตจะถูกบันทึกโดย Gateway ใน `~/.openclaw/msteams-polls.json`
- Gateway ต้องออนไลน์อยู่เพื่อบันทึกคะแนนโหวต
- โพลล์ยังไม่โพสต์สรุปผลอัตโนมัติในตอนนี้ (หากจำเป็นให้ตรวจสอบไฟล์ store)

## การ์ดการนำเสนอ

ส่ง payload การนำเสนอเชิงความหมายไปยังผู้ใช้หรือบทสนทนาใน Teams โดยใช้เครื่องมือ `message` หรือ CLI OpenClaw จะแสดงผลเป็น Teams Adaptive Cards จากสัญญาการนำเสนอแบบทั่วไป

พารามิเตอร์ `presentation` รองรับ semantic blocks เมื่อมี `presentation` ข้อความประกอบจะไม่บังคับ

**เครื่องมือของเอเจนต์:**

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

| ประเภทเป้าหมาย | รูปแบบ | ตัวอย่าง |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ผู้ใช้ (ตาม ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ผู้ใช้ (ตามชื่อ)      | `user:<display-name>`            | `user:John Smith` (ต้องใช้ Graph API)              |
| กลุ่ม/แชนเนล       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| กลุ่ม/แชนเนล (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (หากมี `@thread`) |

**ตัวอย่าง CLI:**

```bash
# ส่งให้ผู้ใช้ตาม ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# ส่งให้ผู้ใช้ตามชื่อที่แสดง (ทริกเกอร์การค้นหาผ่าน Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# ส่งไปยังแชตกลุ่มหรือแชนเนล
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# ส่งการ์ดการนำเสนอไปยังบทสนทนา
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**ตัวอย่างเครื่องมือของเอเจนต์:**

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

หมายเหตุ: หากไม่มี prefix `user:` ชื่อต่างๆ จะถูกตีความเป็นการ resolve กลุ่ม/ทีมโดยค่าเริ่มต้น ใช้ `user:` เสมอเมื่อระบุเป้าหมายเป็นบุคคลด้วยชื่อที่แสดง

## การส่งข้อความแบบ Proactive

- การส่งข้อความแบบ proactive ทำได้ **หลังจาก** ผู้ใช้มีการโต้ตอบแล้วเท่านั้น เพราะเราจะเก็บ conversation references ณ จุดนั้น
- ดู `/gateway/configuration` สำหรับ `dmPolicy` และการจำกัดด้วย allowlist

## Team และ Channel IDs (จุดที่มักพลาด)

พารามิเตอร์ `groupId` ใน URL ของ Teams **ไม่ใช่** team ID ที่ใช้สำหรับการกำหนดค่า ให้ดึง ID จาก path ใน URL แทน:

**URL ของ Team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (ทำ URL-decode ค่านี้)
```

**URL ของ Channel:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (ทำ URL-decode ค่านี้)
```

**สำหรับคอนฟิก:**

- Team ID = path segment หลัง `/team/` (หลัง URL-decoded แล้ว เช่น `19:Bk4j...@thread.tacv2`)
- Channel ID = path segment หลัง `/channel/` (หลัง URL-decoded แล้ว)
- **ไม่ต้องสนใจ** query parameter `groupId`

## Private Channels

บอตรองรับ private channels อย่างจำกัด:

| ฟีเจอร์ | Standard Channels | Private Channels |
| ---------------------------- | ----------------- | ---------------------- |
| การติดตั้งบอต             | ได้               | จำกัด                |
| ข้อความแบบเรียลไทม์ (webhook) | ได้               | อาจใช้ไม่ได้           |
| สิทธิ์ RSC              | ได้               | อาจมีพฤติกรรมต่างออกไป |
| @mentions                    | ได้               | ได้ หากเข้าถึงบอตได้   |
| ประวัติผ่าน Graph API            | ได้               | ได้ (เมื่อมีสิทธิ์) |

**วิธีแก้ชั่วคราวหาก private channels ใช้งานไม่ได้:**

1. ใช้ standard channels สำหรับการโต้ตอบกับบอต
2. ใช้ DM - ผู้ใช้สามารถส่งข้อความหาบอตได้โดยตรงเสมอ
3. ใช้ Graph API สำหรับการเข้าถึงข้อมูลย้อนหลัง (ต้องมี `ChannelMessage.Read.All`)

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

- **รูปภาพไม่แสดงในแชนเนล:** ขาดสิทธิ์ Graph หรือ admin consent ติดตั้งแอป Teams ใหม่ แล้วปิด/เปิด Teams ใหม่ทั้งหมด
- **ไม่มีการตอบกลับในแชนเนล:** โดยค่าเริ่มต้นต้องมีการ mention; ให้ตั้ง `channels.msteams.requireMention=false` หรือกำหนดค่าแยกรายทีม/แชนเนล
- **เวอร์ชันไม่ตรงกัน (Teams ยังแสดง manifest เก่า):** ลบแอปแล้วเพิ่มใหม่ และปิด Teams ทั้งหมดเพื่อรีเฟรช
- **401 Unauthorized จาก webhook:** เป็นเรื่องปกติเมื่อทดสอบด้วยตนเองโดยไม่มี Azure JWT - หมายความว่า endpoint เข้าถึงได้แต่การยืนยันตัวตนล้มเหลว ใช้ Azure Web Chat เพื่อทดสอบอย่างถูกต้อง

### ข้อผิดพลาดในการอัปโหลด Manifest

- **"Icon file cannot be empty":** manifest อ้างอิงไฟล์ไอคอนที่มีขนาด 0 ไบต์ ให้สร้างไอคอน PNG ที่ถูกต้อง (`outline.png` ขนาด 32x32, `color.png` ขนาด 192x192)
- **"webApplicationInfo.Id already in use":** แอปยังติดตั้งอยู่ในทีม/แชตอื่น ให้ค้นหาและถอนการติดตั้งก่อน หรือรอ 5-10 นาทีเพื่อให้การเปลี่ยนแปลงแพร่กระจาย
- **"Something went wrong" ตอนอัปโหลด:** ให้อัปโหลดผ่าน [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) แทน เปิด DevTools ของเบราว์เซอร์ (F12) → แท็บ Network แล้วตรวจสอบ response body เพื่อดูข้อผิดพลาดจริง
- **Sideload ล้มเหลว:** ลองใช้ "Upload an app to your org's app catalog" แทน "Upload a custom app" - วิธีนี้มักข้ามข้อจำกัดของ sideload ได้

### สิทธิ์ RSC ไม่ทำงาน

1. ตรวจสอบว่า `webApplicationInfo.id` ตรงกับ App ID ของบอตคุณทุกตัวอักษร
2. อัปโหลดแอปใหม่และติดตั้งใหม่ในทีม/แชต
3. ตรวจสอบว่าแอดมินขององค์กรบล็อกสิทธิ์ RSC หรือไม่
4. ยืนยันว่าคุณใช้ scope ที่ถูกต้อง: `ChannelMessage.Read.Group` สำหรับ teams, `ChatMessage.Read.Chat` สำหรับแชตกลุ่ม

## เอกสารอ้างอิง

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - คู่มือการตั้งค่า Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - สร้าง/จัดการแอป Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (แชนเนล/กลุ่มต้องใช้ Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอน Pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการจำกัดด้วยการ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่งด้านความปลอดภัย
