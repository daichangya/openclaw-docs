---
read_when:
    - กำลังทำงานกับฟีเจอร์ของ channel Google Chat
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของแอป Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T08:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

สถานะ: พร้อมสำหรับ DM + spaces ผ่าน Google Chat API webhooks (HTTP เท่านั้น)

## การตั้งค่าแบบรวดเร็ว (สำหรับผู้เริ่มต้น)

1. สร้างโปรเจ็กต์ Google Cloud และเปิดใช้ **Google Chat API**
   - ไปที่: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - เปิดใช้ API หากยังไม่ได้เปิดใช้
2. สร้าง **Service Account**:
   - กด **Create Credentials** > **Service Account**
   - ตั้งชื่อตามต้องการ (เช่น `openclaw-chat`)
   - ปล่อยสิทธิ์ว่างไว้ (กด **Continue**)
   - ปล่อย principals ที่มีสิทธิ์เข้าถึงว่างไว้ (กด **Done**)
3. สร้างและดาวน์โหลด **JSON Key**:
   - ในรายการ service accounts ให้คลิกบัญชีที่เพิ่งสร้าง
   - ไปที่แท็บ **Keys**
   - คลิก **Add Key** > **Create new key**
   - เลือก **JSON** แล้วกด **Create**
4. เก็บไฟล์ JSON ที่ดาวน์โหลดไว้บนโฮสต์ gateway ของคุณ (เช่น `~/.openclaw/googlechat-service-account.json`)
5. สร้างแอป Google Chat ใน [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - กรอก **Application info**:
     - **App name**: (เช่น `OpenClaw`)
     - **Avatar URL**: (เช่น `https://openclaw.ai/logo.png`)
     - **Description**: (เช่น `Personal AI Assistant`)
   - เปิดใช้ **Interactive features**
   - ภายใต้ **Functionality** ให้เลือก **Join spaces and group conversations**
   - ภายใต้ **Connection settings** ให้เลือก **HTTP endpoint URL**
   - ภายใต้ **Triggers** ให้เลือก **Use a common HTTP endpoint URL for all triggers** แล้วตั้งค่าเป็น URL สาธารณะของ gateway ของคุณตามด้วย `/googlechat`
     - _เคล็ดลับ: รัน `openclaw status` เพื่อค้นหา URL สาธารณะของ gateway_
   - ภายใต้ **Visibility** ให้เลือก **Make this Chat app available to specific people and groups in `<Your Domain>`**
   - ใส่อีเมลของคุณ (เช่น `user@example.com`) ในกล่องข้อความ
   - คลิก **Save** ที่ด้านล่าง
6. **เปิดใช้สถานะแอป**:
   - หลังจากบันทึกแล้ว ให้ **รีเฟรชหน้า**
   - มองหาส่วน **App status** (มักอยู่ใกล้ด้านบนหรือด้านล่างหลังบันทึก)
   - เปลี่ยนสถานะเป็น **Live - available to users**
   - คลิก **Save** อีกครั้ง
7. กำหนดค่า OpenClaw ด้วยพาธ service account + webhook audience:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - หรือ config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. ตั้งค่าประเภทและค่าของ webhook audience (ให้ตรงกับการตั้งค่าแอป Chat ของคุณ)
9. เริ่ม gateway Google Chat จะส่ง POST มายังพาธ webhook ของคุณ

## เพิ่มลงใน Google Chat

เมื่อ gateway ทำงานแล้วและอีเมลของคุณถูกเพิ่มในรายการการมองเห็น:

1. ไปที่ [Google Chat](https://chat.google.com/)
2. คลิกไอคอน **+** (บวก) ถัดจาก **Direct Messages**
3. ในแถบค้นหา (ตำแหน่งเดียวกับที่คุณใช้เพิ่มคนตามปกติ) ให้พิมพ์ **App name** ที่คุณตั้งไว้ใน Google Cloud Console
   - **หมายเหตุ**: บอทจะ _ไม่_ ปรากฏในรายการ "Marketplace" เพราะเป็นแอปส่วนตัว คุณต้องค้นหาด้วยชื่อ
4. เลือกบอทของคุณจากผลลัพธ์
5. คลิก **Add** หรือ **Chat** เพื่อเริ่มการสนทนาแบบ 1:1
6. ส่ง "Hello" เพื่อทริกเกอร์ผู้ช่วย!

## URL สาธารณะ (Webhook-only)

Google Chat webhooks ต้องใช้ HTTPS endpoint แบบสาธารณะ เพื่อความปลอดภัย **ให้เปิดเผยเฉพาะพาธ `/googlechat`** สู่อินเทอร์เน็ตเท่านั้น เก็บแดชบอร์ด OpenClaw และ endpoint สำคัญอื่นๆ ไว้ในเครือข่ายส่วนตัวของคุณ

### ตัวเลือก A: Tailscale Funnel (แนะนำ)

ใช้ Tailscale Serve สำหรับแดชบอร์ดแบบส่วนตัว และ Funnel สำหรับพาธ webhook แบบสาธารณะ วิธีนี้ทำให้ `/` เป็นส่วนตัวขณะที่เปิดเผยเฉพาะ `/googlechat`

1. **ตรวจสอบว่า gateway ของคุณ bind อยู่กับที่อยู่อะไร:**

   ```bash
   ss -tlnp | grep 18789
   ```

   จดที่อยู่ IP ไว้ (เช่น `127.0.0.1`, `0.0.0.0` หรือ Tailscale IP ของคุณ เช่น `100.x.x.x`)

2. **เปิดเผยแดชบอร์ดให้เฉพาะใน tailnet เท่านั้น (พอร์ต 8443):**

   ```bash
   # หาก bind กับ localhost (127.0.0.1 หรือ 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # หาก bind กับ Tailscale IP เท่านั้น (เช่น 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **เปิดเผยเฉพาะพาธ webhook แบบสาธารณะ:**

   ```bash
   # หาก bind กับ localhost (127.0.0.1 หรือ 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # หาก bind กับ Tailscale IP เท่านั้น (เช่น 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **อนุญาต node สำหรับการเข้าถึง Funnel:**
   หากระบบแจ้ง ให้ไปที่ URL สำหรับการอนุญาตที่แสดงในผลลัพธ์เพื่อเปิดใช้ Funnel สำหรับ node นี้ในนโยบาย tailnet ของคุณ

5. **ตรวจสอบการกำหนดค่า:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL webhook สาธารณะของคุณจะเป็น:
`https://<node-name>.<tailnet>.ts.net/googlechat`

แดชบอร์ดส่วนตัวของคุณจะยังคงเข้าถึงได้เฉพาะใน tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

ใช้ URL สาธารณะ (โดยไม่ใส่ `:8443`) ในการกำหนดค่าแอป Google Chat

> หมายเหตุ: การกำหนดค่านี้จะคงอยู่หลังรีบูต หากต้องการลบภายหลัง ให้รัน `tailscale funnel reset` และ `tailscale serve reset`

### ตัวเลือก B: Reverse Proxy (Caddy)

หากคุณใช้ reverse proxy เช่น Caddy ให้ proxy เฉพาะพาธที่ต้องการ:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

ด้วย config นี้ คำขอใดๆ ไปยัง `your-domain.com/` จะถูกละเว้นหรือส่งกลับเป็น 404 ขณะที่ `your-domain.com/googlechat` จะถูกส่งต่อไปยัง OpenClaw อย่างปลอดภัย

### ตัวเลือก C: Cloudflare Tunnel

กำหนดค่า ingress rules ของ tunnel ให้ route เฉพาะพาธ webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## วิธีการทำงาน

1. Google Chat ส่ง webhook POST มายัง gateway แต่ละคำขอจะมี header `Authorization: Bearer <token>`
   - OpenClaw จะตรวจสอบ bearer auth ก่อนอ่าน/parse เนื้อหา webhook ทั้งหมดเมื่อมี header นี้
   - รองรับคำขอ Google Workspace Add-on ที่มี `authorizationEventObject.systemIdToken` อยู่ใน body โดยใช้ขีดจำกัด body ก่อน auth ที่เข้มงวดกว่า
2. OpenClaw จะตรวจสอบ token เทียบกับ `audienceType` + `audience` ที่กำหนด:
   - `audienceType: "app-url"` → audience คือ URL webhook HTTPS ของคุณ
   - `audienceType: "project-number"` → audience คือหมายเลขโปรเจ็กต์ Cloud
3. ข้อความจะถูก route ตาม space:
   - DM ใช้ session key `agent:<agentId>:googlechat:direct:<spaceId>`
   - Spaces ใช้ session key `agent:<agentId>:googlechat:group:<spaceId>`
4. การเข้าถึง DM ใช้การ pairing เป็นค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code; อนุมัติด้วย:
   - `openclaw pairing approve googlechat <code>`
5. Group spaces ต้องมีการ @-mention เป็นค่าเริ่มต้น ใช้ `botUser` หากการตรวจจับ mention ต้องใช้ชื่อผู้ใช้ของแอป

## Targets

ใช้ตัวระบุเหล่านี้สำหรับการส่งและ allowlists:

- Direct messages: `users/<userId>` (แนะนำ)
- Raw email `name@example.com` เปลี่ยนแปลงได้ และใช้เฉพาะสำหรับการจับคู่ direct allowlist เท่านั้นเมื่อ `channels.googlechat.dangerouslyAllowNameMatching: true`
- เลิกใช้แล้ว: `users/<email>` จะถูกตีความเป็น user id ไม่ใช่ email allowlist
- Spaces: `spaces/<spaceId>`

## จุดเด่นของ config

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // หรือ serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // ไม่บังคับ; ช่วยในการตรวจจับ mention
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "ตอบสั้นๆ เท่านั้น",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

หมายเหตุ:

- สามารถส่ง credentials ของ service account แบบ inline ได้ด้วย `serviceAccount` (สตริง JSON)
- รองรับ `serviceAccountRef` เช่นกัน (env/file SecretRef) รวมถึง refs ต่อบัญชีภายใต้ `channels.googlechat.accounts.<id>.serviceAccountRef`
- พาธ webhook เริ่มต้นคือ `/googlechat` หากไม่ได้ตั้งค่า `webhookPath`
- `dangerouslyAllowNameMatching` จะเปิดการจับคู่ principal ด้วยอีเมลที่เปลี่ยนแปลงได้สำหรับ allowlists อีกครั้ง (โหมดความเข้ากันได้แบบ break-glass)
- Reactions ใช้งานได้ผ่านเครื่องมือ `reactions` และ `channels action` เมื่อเปิด `actions.reactions`
- Message actions เปิดให้ใช้ `send` สำหรับข้อความ และ `upload-file` สำหรับการส่งไฟล์แนบแบบชัดเจน `upload-file` รับ `media` / `filePath` / `path` พร้อม `message`, `filename` และการกำหนดเป้าหมาย thread แบบไม่บังคับ
- `typingIndicator` รองรับ `none`, `message` (ค่าเริ่มต้น) และ `reaction` (`reaction` ต้องใช้ user OAuth)
- ไฟล์แนบจะถูกดาวน์โหลดผ่าน Chat API และจัดเก็บไว้ใน media pipeline (จำกัดขนาดด้วย `mediaMaxMb`)

รายละเอียดการอ้างอิง secrets: [Secrets Management](/th/gateway/secrets)

## การแก้ปัญหา

### 405 Method Not Allowed

หาก Google Cloud Logs Explorer แสดงข้อผิดพลาดเช่น:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

หมายความว่ายังไม่ได้ลงทะเบียน webhook handler สาเหตุที่พบบ่อยมีดังนี้:

1. **ไม่ได้กำหนดค่า channel**: ไม่มีส่วน `channels.googlechat` ใน config ของคุณ ตรวจสอบด้วย:

   ```bash
   openclaw config get channels.googlechat
   ```

   หากแสดง "Config path not found" ให้เพิ่มการกำหนดค่า (ดู [จุดเด่นของ config](#config-highlights))

2. **ไม่ได้เปิดใช้ plugin**: ตรวจสอบสถานะ plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   หากแสดง "disabled" ให้เพิ่ม `plugins.entries.googlechat.enabled: true` ใน config ของคุณ

3. **ยังไม่ได้รีสตาร์ต gateway**: หลังเพิ่ม config แล้ว ให้รีสตาร์ต gateway:

   ```bash
   openclaw gateway restart
   ```

ตรวจสอบว่า channel กำลังทำงาน:

```bash
openclaw channels status
# ควรแสดง: Google Chat default: enabled, configured, ...
```

### ปัญหาอื่นๆ

- ตรวจสอบ `openclaw channels status --probe` เพื่อดูข้อผิดพลาดด้าน auth หรือการขาดการกำหนดค่า audience
- หากไม่มีข้อความเข้ามา ให้ยืนยัน URL webhook + การสมัครรับเหตุการณ์ของแอป Chat
- หาก mention gating บล็อกการตอบกลับ ให้ตั้งค่า `botUser` เป็นชื่อทรัพยากรผู้ใช้ของแอป แล้วตรวจสอบ `requireMention`
- ใช้ `openclaw logs --follow` ระหว่างส่งข้อความทดสอบเพื่อดูว่าคำขอมาถึง gateway หรือไม่

เอกสารที่เกี่ยวข้อง:

- [Gateway configuration](/th/gateway/configuration)
- [Security](/th/gateway/security)
- [Reactions](/th/tools/reactions)

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอน pairing
- [Groups](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การ route เซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
