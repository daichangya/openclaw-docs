---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'การทำงานของ sandboxing ใน OpenClaw: โหมด ขอบเขต การเข้าถึง workspace และ images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T09:12:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw สามารถรัน **เครื่องมือภายในแบ็กเอนด์ sandbox** เพื่อลดขอบเขตความเสียหายได้
นี่เป็นฟีเจอร์ **ไม่บังคับ** และควบคุมด้วย config (`agents.defaults.sandbox` หรือ
`agents.list[].sandbox`) หากปิด sandboxing ไว้ เครื่องมือจะรันบนโฮสต์
Gateway ยังคงอยู่บนโฮสต์; การรันเครื่องมือจะเกิดขึ้นใน sandbox ที่แยกออกจากกัน
เมื่อเปิดใช้งาน

นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงระบบไฟล์
และ process ได้อย่างมีนัยสำคัญเมื่อโมเดลทำอะไรโง่ๆ

## สิ่งที่ถูก sandbox

- การรันเครื่องมือ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` ฯลฯ)
- เบราว์เซอร์แบบ sandboxed ที่เป็นตัวเลือก (`agents.defaults.sandbox.browser`)
  - โดยค่าเริ่มต้น เบราว์เซอร์ใน sandbox จะเริ่มทำงานอัตโนมัติ (เพื่อให้แน่ใจว่าเข้าถึง CDP ได้) เมื่อ browser tool ต้องใช้
    กำหนดค่าได้ผ่าน `agents.defaults.sandbox.browser.autoStart` และ `agents.defaults.sandbox.browser.autoStartTimeoutMs`
  - โดยค่าเริ่มต้น container ของ sandbox browser จะใช้ Docker network เฉพาะ (`openclaw-sandbox-browser`) แทน global `bridge` network
    กำหนดค่าได้ด้วย `agents.defaults.sandbox.browser.network`
  - `agents.defaults.sandbox.browser.cdpSourceRange` แบบไม่บังคับจะจำกัด ingress ของ CDP ที่ขอบ container ด้วย CIDR allowlist (เช่น `172.21.0.1/32`)
  - การเข้าถึงผู้สังเกตการณ์ผ่าน noVNC ถูกป้องกันด้วยรหัสผ่านเป็นค่าเริ่มต้น; OpenClaw จะปล่อย URL พร้อมโทเค็นอายุสั้นที่ให้บริการหน้า bootstrap ในเครื่อง และเปิด noVNC พร้อมรหัสผ่านใน URL fragment (ไม่ใช่ใน query/header logs)
  - `agents.defaults.sandbox.browser.allowHostControl` อนุญาตให้เซสชันแบบ sandboxed กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์โดยตรง
  - allowlists แบบไม่บังคับใช้ควบคุม `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

สิ่งที่ไม่ถูก sandbox:

- process ของ Gateway เอง
- เครื่องมือใดๆ ที่อนุญาตอย่างชัดเจนให้รันนอก sandbox (เช่น `tools.elevated`)
  - **Elevated exec จะข้าม sandboxing และใช้เส้นทาง escape ที่กำหนดไว้ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)**
  - หากปิด sandboxing อยู่ `tools.elevated` จะไม่เปลี่ยนพฤติกรรมการรัน (เพราะรันบนโฮสต์อยู่แล้ว) ดู [Elevated Mode](/th/tools/elevated)

## โหมด

`agents.defaults.sandbox.mode` ควบคุมว่า **จะใช้** sandboxing **เมื่อใด**:

- `"off"`: ไม่ใช้ sandboxing
- `"non-main"`: sandbox เฉพาะเซสชันที่ **ไม่ใช่ main** (ค่าเริ่มต้นหากคุณต้องการให้แชตปกติรันบนโฮสต์)
- `"all"`: ทุกเซสชันจะรันใน sandbox
  หมายเหตุ: `"non-main"` อิงจาก `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ agent id
  เซสชันกลุ่ม/channel จะใช้คีย์ของตัวเอง ดังนั้นจึงนับเป็น non-main และจะถูก sandbox

## ขอบเขต

`agents.defaults.sandbox.scope` ควบคุมว่า **จะสร้างกี่ containers**:

- `"agent"` (ค่าเริ่มต้น): หนึ่ง container ต่อหนึ่งเอเจนต์
- `"session"`: หนึ่ง container ต่อหนึ่งเซสชัน
- `"shared"`: หนึ่ง container ที่แชร์โดยทุกเซสชันที่ใช้ sandbox

## แบ็กเอนด์

`agents.defaults.sandbox.backend` ควบคุมว่า **runtime ใด** จะเป็นผู้ให้ sandbox:

- `"docker"` (ค่าเริ่มต้นเมื่อเปิด sandboxing): sandbox runtime ที่รองรับโดย Docker ในเครื่อง
- `"ssh"`: sandbox runtime แบบ remote ทั่วไปที่รองรับโดย SSH
- `"openshell"`: sandbox runtime ที่รองรับโดย OpenShell

config เฉพาะของ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh`
config เฉพาะของ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

### การเลือกแบ็กเอนด์

|                     | Docker                           | SSH                            | OpenShell                                                |
| ------------------- | -------------------------------- | ------------------------------ | -------------------------------------------------------- |
| **รันที่ไหน**       | container ในเครื่อง              | โฮสต์ใดก็ได้ที่เข้าถึงผ่าน SSH | sandbox ที่จัดการโดย OpenShell                          |
| **การตั้งค่า**      | `scripts/sandbox-setup.sh`       | SSH key + โฮสต์เป้าหมาย       | เปิดใช้ OpenShell plugin                                 |
| **โมเดล workspace** | bind-mount หรือ copy             | remote-canonical (seed ครั้งเดียว) | `mirror` หรือ `remote`                               |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: none) | ขึ้นกับโฮสต์ remote            | ขึ้นกับ OpenShell                                        |
| **sandbox browser** | รองรับ                           | ไม่รองรับ                     | ยังไม่รองรับ                                             |
| **bind mounts**     | `docker.binds`                   | ไม่มี                          | ไม่มี                                                     |
| **เหมาะที่สุดสำหรับ** | dev ในเครื่อง, การแยกแบบเต็ม      | offload ไปยังเครื่อง remote     | sandbox remote แบบจัดการพร้อมการซิงก์สองทางแบบไม่บังคับ |

### Docker backend

ปิด sandboxing ไว้เป็นค่าเริ่มต้น หากคุณเปิด sandboxing และไม่ได้เลือก
backend OpenClaw จะใช้ Docker backend มันจะรันเครื่องมือและ sandbox browser
ในเครื่องผ่าน Docker daemon socket (`/var/run/docker.sock`) การแยกตัวของ sandbox container
จะถูกกำหนดโดย Docker namespaces

**ข้อจำกัด Docker-out-of-Docker (DooD)**:
หากคุณ deploy OpenClaw Gateway เองเป็น Docker container มันจะ orchestration sibling sandbox containers โดยใช้ Docker socket ของโฮสต์ (DooD) ซึ่งก่อให้เกิดข้อจำกัดเฉพาะเรื่องการแมปพาธดังนี้:

- **Config ต้องใช้ Host Paths**: config `workspace` ใน `openclaw.json` ต้องมี **absolute path ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่พาธภายใน Gateway container เมื่อ OpenClaw ขอให้ Docker daemon สร้าง sandbox, daemon จะประเมินพาธโดยอิงกับ namespace ของ Host OS ไม่ใช่ namespace ของ Gateway
- **FS Bridge Parity (แมป volume ให้เหมือนกันทุกประการ)**: OpenClaw Gateway process แบบ native ก็เขียน heartbeat และ bridge files ลงในไดเรกทอรี `workspace` ด้วยเช่นกัน เนื่องจาก Gateway ประเมินสตริงเดียวกันเป๊ะ (พาธของโฮสต์) จากภายในสภาพแวดล้อมที่เป็น container ของตัวเอง การ deploy Gateway จึงต้องมี volume map เดียวกันทุกประการที่ลิงก์ namespace ของโฮสต์แบบ native (`-v /home/user/.openclaw:/home/user/.openclaw`)

หากคุณแมปพาธภายในโดยไม่มี parity แบบ absolute host OpenClaw จะโยนข้อผิดพลาด `EACCES` แบบ native เมื่อพยายามเขียน heartbeat ภายในสภาพแวดล้อม container เพราะสตริงพาธแบบ fully qualified นั้นไม่มีอยู่จริงในเชิง native

### SSH backend

ใช้ `backend: "ssh"` เมื่อคุณต้องการให้ OpenClaw sandbox `exec`, เครื่องมือไฟล์ และการอ่าน media บน
เครื่องใดๆ ที่เข้าถึงได้ผ่าน SSH

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // หรือใช้ SecretRefs / เนื้อหาแบบ inline แทนไฟล์ในเครื่อง:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

วิธีการทำงาน:

- OpenClaw จะสร้าง remote root ต่อขอบเขตภายใต้ `sandbox.ssh.workspaceRoot`
- เมื่อใช้งานครั้งแรกหลังการสร้างหรือสร้างใหม่ OpenClaw จะ seed remote workspace นั้นจาก local workspace เพียงครั้งเดียว
- หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่าน media ของพรอมป์ต์ และ inbound media staging จะรันโดยตรงกับ remote workspace ผ่าน SSH
- OpenClaw จะไม่ซิงก์การเปลี่ยนแปลงจาก remote กลับมายัง local workspace โดยอัตโนมัติ

วัสดุสำหรับการยืนยันตัวตน:

- `identityFile`, `certificateFile`, `knownHostsFile`: ใช้ไฟล์ในเครื่องที่มีอยู่และส่งผ่านผ่าน config ของ OpenSSH
- `identityData`, `certificateData`, `knownHostsData`: ใช้สตริงแบบ inline หรือ SecretRefs OpenClaw จะ resolve ผ่าน runtime snapshot ของ secrets ปกติ เขียนลงไฟล์ชั่วคราวด้วยสิทธิ์ `0600` และลบทิ้งเมื่อเซสชัน SSH จบลง
- หากตั้งทั้ง `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะมีความสำคัญกว่าในการเชื่อมต่อ SSH ครั้งนั้น

นี่คือโมเดลแบบ **remote-canonical** remote SSH workspace จะกลายเป็นสถานะ sandbox จริงหลังจาก seed ครั้งแรก

ผลลัพธ์สำคัญที่ตามมา:

- การแก้ไขบนโฮสต์ที่ทำภายนอก OpenClaw หลังขั้นตอน seed จะไม่เห็นบน remote จนกว่าคุณจะสร้าง sandbox ใหม่
- `openclaw sandbox recreate` จะลบ remote root ต่อขอบเขต แล้ว seed ใหม่จาก local ในการใช้งานครั้งถัดไป
- ไม่รองรับ browser sandboxing บน SSH backend
- การตั้งค่า `sandbox.docker.*` ใช้ไม่ได้กับ SSH backend

### OpenShell backend

ใช้ `backend: "openshell"` เมื่อคุณต้องการให้ OpenClaw sandbox เครื่องมือใน
สภาพแวดล้อม remote ที่จัดการโดย OpenShell สำหรับคู่มือการตั้งค่าแบบเต็ม ข้อมูลอ้างอิง
config และการเปรียบเทียบโหมด workspace โปรดดู
[หน้า OpenShell](/th/gateway/openshell) โดยเฉพาะ

OpenShell ใช้การขนส่งผ่าน SSH และ remote filesystem bridge แกนกลางเดียวกับ
generic SSH backend และเพิ่มวงจรชีวิตเฉพาะของ OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) พร้อมโหมด workspace แบบ `mirror`
ที่เป็นตัวเลือก

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

โหมดของ OpenShell:

- `mirror` (ค่าเริ่มต้น): local workspace ยังคงเป็น canonical OpenClaw จะซิงก์ไฟล์ในเครื่องเข้า OpenShell ก่อน exec และซิงก์ remote workspace กลับหลัง exec
- `remote`: workspace ของ OpenShell เป็น canonical หลังจากสร้าง sandbox แล้ว OpenClaw จะ seed remote workspace ครั้งเดียวจาก local workspace จากนั้น file tools และ exec จะรันโดยตรงกับ remote sandbox โดยไม่ซิงก์การเปลี่ยนแปลงกลับ

รายละเอียดการขนส่งแบบ remote:

- OpenClaw จะขอ config SSH เฉพาะ sandbox จาก OpenShell ผ่าน `openshell sandbox ssh-config <name>`
- core จะเขียน config SSH นั้นลงในไฟล์ชั่วคราว เปิดเซสชัน SSH และใช้ remote filesystem bridge เดียวกับที่ใช้โดย `backend: "ssh"`
- ในโหมด `mirror` เท่านั้นที่วงจรชีวิตต่างออกไป: ซิงก์ local ไป remote ก่อน exec แล้วซิงก์กลับหลัง exec

ข้อจำกัดปัจจุบันของ OpenShell:

- ยังไม่รองรับ sandbox browser
- ไม่รองรับ `sandbox.docker.binds` บน OpenShell backend
- runtime knobs แบบ Docker ภายใต้ `sandbox.docker.*` ยังคงใช้ได้เฉพาะกับ Docker backend

#### โหมด workspace

OpenShell มีโมเดล workspace อยู่สองแบบ นี่คือส่วนที่สำคัญที่สุดในการใช้งานจริง

##### `mirror`

ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **local workspace ยังคงเป็น canonical**

พฤติกรรม:

- ก่อน `exec` OpenClaw จะซิงก์ local workspace เข้าไปยัง OpenShell sandbox
- หลัง `exec` OpenClaw จะซิงก์ remote workspace กลับมายัง local workspace
- file tools ยังคงทำงานผ่าน sandbox bridge แต่ local workspace จะยังเป็น source of truth ระหว่างแต่ละรอบ

ใช้สิ่งนี้เมื่อ:

- คุณแก้ไขไฟล์ในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงนั้นปรากฏใน sandbox โดยอัตโนมัติ
- คุณต้องการให้ OpenShell sandbox ทำงานใกล้เคียงกับ Docker backend มากที่สุด
- คุณต้องการให้ host workspace สะท้อนการเขียนจาก sandbox หลังจากแต่ละรอบ exec

ข้อแลกเปลี่ยน:

- มีต้นทุนการซิงก์เพิ่มทั้งก่อนและหลัง exec

##### `remote`

ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้ **workspace ของ OpenShell กลายเป็น canonical**

พฤติกรรม:

- เมื่อ sandbox ถูกสร้างครั้งแรก OpenClaw จะ seed remote workspace จาก local workspace หนึ่งครั้ง
- หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงานโดยตรงกับ remote OpenShell workspace
- OpenClaw จะ **ไม่** ซิงก์การเปลี่ยนแปลงจาก remote กลับมายัง local workspace หลัง exec
- การอ่าน media ระหว่าง prompt ยังคงทำงานได้ เพราะเครื่องมือไฟล์และ media อ่านผ่าน sandbox bridge แทนที่จะสมมติว่าเป็นพาธของ local host
- การขนส่งใช้ SSH เข้าไปยัง OpenShell sandbox ที่ได้จาก `openshell sandbox ssh-config`

ผลกระทบสำคัญ:

- หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังขั้นตอน seed, remote sandbox จะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้นโดยอัตโนมัติ
- หาก sandbox ถูกสร้างใหม่ remote workspace จะถูก seed ใหม่จาก local workspace อีกครั้ง
- เมื่อใช้ `scope: "agent"` หรือ `scope: "shared"` remote workspace นั้นจะถูกแชร์ในขอบเขตเดียวกันนั้น

ใช้สิ่งนี้เมื่อ:

- sandbox ควรอยู่และทำงานหลักบนฝั่ง OpenShell แบบ remote
- คุณต้องการลด overhead ของการซิงก์ต่อรอบ
- คุณไม่ต้องการให้การแก้ไขบนโฮสต์ในเครื่องไปเขียนทับสถานะของ remote sandbox แบบเงียบๆ

เลือก `mirror` หากคุณมอง sandbox เป็นสภาพแวดล้อมชั่วคราวสำหรับการรัน
เลือก `remote` หากคุณมอง sandbox เป็น workspace จริง

#### วงจรชีวิตของ OpenShell

OpenShell sandboxes ยังคงถูกจัดการผ่านวงจรชีวิตของ sandbox ตามปกติ:

- `openclaw sandbox list` จะแสดงทั้ง runtimes ของ OpenShell และ Docker
- `openclaw sandbox recreate` จะลบ runtime ปัจจุบันและปล่อยให้ OpenClaw สร้างใหม่เมื่อใช้งานครั้งถัดไป
- ตรรกะ prune ก็รับรู้ backend เช่นกัน

สำหรับโหมด `remote` การ recreate มีความสำคัญเป็นพิเศษ:

- การ recreate จะลบ remote workspace แบบ canonical สำหรับขอบเขตนั้น
- การใช้งานครั้งถัดไปจะ seed remote workspace ใหม่จาก local workspace

สำหรับโหมด `mirror` การ recreate มีผลหลักคือรีเซ็ตสภาพแวดล้อมการรันแบบ remote
เพราะ local workspace ยังคงเป็น canonical อยู่แล้ว

## การเข้าถึง workspace

`agents.defaults.sandbox.workspaceAccess` ควบคุมว่า **sandbox จะมองเห็นอะไรได้บ้าง**:

- `"none"` (ค่าเริ่มต้น): เครื่องมือจะเห็น sandbox workspace ภายใต้ `~/.openclaw/sandboxes`
- `"ro"`: mount agent workspace แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้ `write`/`edit`/`apply_patch`)
- `"rw"`: mount agent workspace แบบอ่าน/เขียนที่ `/workspace`

เมื่อใช้ OpenShell backend:

- โหมด `mirror` ยังคงใช้ local workspace เป็นแหล่ง canonical ระหว่างแต่ละรอบ exec
- โหมด `remote` ใช้ remote OpenShell workspace เป็นแหล่ง canonical หลังการ seed ครั้งแรก
- `workspaceAccess: "ro"` และ `"none"` ยังคงจำกัดพฤติกรรมการเขียนในแบบเดียวกัน

media ขาเข้าจะถูกคัดลอกเข้า active sandbox workspace (`media/inbound/*`)
หมายเหตุเรื่อง Skills: เครื่องมือ `read` ถูกอิงกับรากของ sandbox เมื่อใช้ `workspaceAccess: "none"`
OpenClaw จะ mirror Skills ที่เข้าเกณฑ์เข้าไปใน sandbox workspace (`.../skills`) เพื่อให้
สามารถอ่านได้ เมื่อใช้ `"rw"` workspace skills จะอ่านได้จาก
`/workspace/skills`

## Custom bind mounts

`agents.defaults.sandbox.docker.binds` จะ mount ไดเรกทอรีเพิ่มเติมของโฮสต์เข้า container
รูปแบบ: `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

binds ระดับ global และต่อเอเจนต์จะถูก **รวมกัน** (ไม่ใช่แทนที่กัน) ภายใต้ `scope: "shared"` binds ต่อเอเจนต์จะถูกละเลย

`agents.defaults.sandbox.browser.binds` จะ mount ไดเรกทอรีเพิ่มเติมของโฮสต์เข้าเฉพาะ container ของ **sandbox browser**

- เมื่อตั้งค่าไว้ (รวมถึง `[]`) มันจะมาแทน `agents.defaults.sandbox.docker.binds` สำหรับ browser container
- เมื่อไม่ระบุ browser container จะ fallback ไปใช้ `agents.defaults.sandbox.docker.binds` (เข้ากันได้ย้อนหลัง)

ตัวอย่าง (source แบบอ่านอย่างเดียว + ไดเรกทอรี data เพิ่มเติม):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

หมายเหตุด้านความปลอดภัย:

- Binds จะข้ามระบบไฟล์ของ sandbox: มันเปิดเผยพาธของโฮสต์ด้วยโหมดใดก็ตามที่คุณตั้ง (`:ro` หรือ `:rw`)
- OpenClaw จะบล็อก bind sources ที่อันตราย (เช่น `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` และ parent mounts ที่จะเปิดเผยสิ่งเหล่านั้น)
- OpenClaw ยังบล็อก credential roots ทั่วไปใน home directory เช่น `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` และ `~/.ssh`
- การตรวจสอบ bind ไม่ได้เป็นเพียงการจับคู่สตริง OpenClaw จะ normalize พาธต้นทาง จากนั้น resolve อีกครั้งผ่าน deepest existing ancestor ก่อนตรวจ blocked paths และ allowed roots ใหม่
- นั่นหมายความว่าการหนีออกทาง symlink-parent จะยังล้มเหลวแบบปิดตาย แม้ leaf สุดท้ายจะยังไม่มีอยู่ก็ตาม ตัวอย่าง: `/workspace/run-link/new-file` จะยัง resolve เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น
- allowed source roots ก็ถูก canonicalize แบบเดียวกัน ดังนั้นพาธที่ดูเหมือนอยู่ใน allowlist ก่อน resolve symlink ก็ยังจะถูกปฏิเสธว่า `outside allowed roots`
- mounts ที่อ่อนไหว (secrets, SSH keys, service credentials) ควรเป็น `:ro` เว้นแต่จำเป็นจริงๆ
- ใช้ร่วมกับ `workspaceAccess: "ro"` ได้หากคุณต้องการเพียงสิทธิ์อ่าน workspace; โหมดของ bind ยังคงแยกอิสระ
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับวิธีที่ binds ทำงานร่วมกับ tool policy และ elevated exec

## Images + การตั้งค่า

Docker image เริ่มต้น: `openclaw-sandbox:bookworm-slim`

build เพียงครั้งเดียว:

```bash
scripts/sandbox-setup.sh
```

หมายเหตุ: image เริ่มต้น **ไม่มี** Node หาก Skill ต้องใช้ Node (หรือ
runtime อื่นๆ) ให้สร้าง custom image หรือ ติดตั้งผ่าน
`sandbox.docker.setupCommand` (ต้องมี network egress + root ที่เขียนได้ +
ผู้ใช้ root)

หากคุณต้องการ sandbox image ที่ใช้งานได้มากขึ้นพร้อมเครื่องมือทั่วไป (เช่น
`curl`, `jq`, `nodejs`, `python3`, `git`) ให้ build:

```bash
scripts/sandbox-common-setup.sh
```

จากนั้นตั้ง `agents.defaults.sandbox.docker.image` เป็น
`openclaw-sandbox-common:bookworm-slim`

sandboxed browser image:

```bash
scripts/sandbox-browser-setup.sh
```

โดยค่าเริ่มต้น Docker sandbox containers จะรันแบบ **ไม่มี network**
สามารถ override ได้ด้วย `agents.defaults.sandbox.docker.network`

bundled sandbox browser image ยังใช้ค่าเริ่มต้นในการเริ่ม Chromium แบบระมัดระวัง
สำหรับ workloads ที่รันใน container ด้วย ค่าเริ่มต้นของ container ปัจจุบันมี:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` และ `--disable-setuid-sandbox` เมื่อเปิดใช้ `noSandbox`
- flags สำหรับ hardening ด้านกราฟิกทั้งสาม (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) เป็นแบบไม่บังคับ และมีประโยชน์
  เมื่อ containers ไม่มีการรองรับ GPU ตั้ง `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  หาก workload ของคุณต้องใช้ WebGL หรือความสามารถ 3D/เบราว์เซอร์อื่นๆ
- `--disable-extensions` เปิดใช้เป็นค่าเริ่มต้น และสามารถปิดได้ด้วย
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับ flows ที่ต้องพึ่ง extensions
- `--renderer-process-limit=2` ถูกควบคุมโดย
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดย `0` จะคงค่าเริ่มต้นของ Chromium

หากคุณต้องการ runtime profile แบบอื่น ให้ใช้ custom browser image และจัดเตรียม
entrypoint ของคุณเอง สำหรับ Chromium profiles แบบ local (ไม่ใช่ container) ให้ใช้
`browser.extraArgs` เพื่อเพิ่ม startup flags อื่น

ค่าเริ่มต้นด้านความปลอดภัย:

- `network: "host"` ถูกบล็อก
- `network: "container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น (มีความเสี่ยงจากการ join namespace)
- override แบบ break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

การติดตั้ง Docker และ gateway แบบ container อยู่ที่นี่:
[Docker](/th/install/docker)

สำหรับการ deploy Docker gateway, `scripts/docker/setup.sh` สามารถ bootstrap config ของ sandbox ได้
ตั้ง `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้เส้นทางนั้น คุณสามารถ
override ตำแหน่ง socket ได้ด้วย `OPENCLAW_DOCKER_SOCKET` การตั้งค่าแบบเต็มและข้อมูลอ้างอิง env
ดูได้ที่: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การตั้งค่า container แบบครั้งเดียว)

`setupCommand` จะรัน **ครั้งเดียว** หลังจากสร้าง sandbox container แล้ว (ไม่ใช่ทุกครั้งที่รัน)
มันจะทำงานภายใน container ผ่าน `sh -lc`

พาธ:

- ระดับ global: `agents.defaults.sandbox.docker.setupCommand`
- ต่อเอเจนต์: `agents.list[].sandbox.docker.setupCommand`

ข้อผิดพลาดที่พบบ่อย:

- `docker.network` เริ่มต้นเป็น `"none"` (ไม่มี egress) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
- `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และเป็นแบบ break-glass เท่านั้น
- `readOnlyRoot: true` ป้องกันการเขียน; ตั้ง `readOnlyRoot: false` หรือสร้าง custom image
- `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ไม่ต้องระบุ `user` หรือใช้ `user: "0:0"`)
- sandbox exec **ไม่** สืบทอด `process.env` ของโฮสต์ ใช้
  `agents.defaults.sandbox.docker.env` (หรือ custom image) สำหรับ API keys ของ Skill

## Tool policy + ช่องทางหลบออก

นโยบาย allow/deny ของเครื่องมือยังคงมีผลก่อนกฎของ sandbox หากเครื่องมือถูกปฏิเสธ
ในระดับ global หรือต่อเอเจนต์ sandboxing ก็ไม่ทำให้มันกลับมาใช้ได้

`tools.elevated` คือช่องทางหลบออกอย่างชัดเจนที่รัน `exec` นอก sandbox (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อ exec target คือ `node`)
directives แบบ `/exec` มีผลเฉพาะกับผู้ส่งที่ได้รับอนุญาตและคงอยู่ต่อเซสชัน; หากต้องการปิดใช้
`exec` แบบถาวร ให้ใช้ tool policy deny (ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การแก้จุดบกพร่อง:

- ใช้ `openclaw sandbox explain` เพื่อตรวจโหมด sandbox ที่มีผลจริง tool policy และคีย์ config สำหรับแก้ไข
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับโมเดลความคิดแบบ “ทำไมสิ่งนี้ถึงถูกบล็อก?”
  ควรรักษาความเข้มงวดไว้

## การ override สำหรับหลายเอเจนต์

แต่ละเอเจนต์สามารถ override sandbox + tools ได้:
`agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับ sandbox tool policy)
ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับลำดับความสำคัญ

## ตัวอย่างการเปิดใช้งานแบบขั้นต่ำ

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## เอกสารที่เกี่ยวข้อง

- [OpenShell](/th/gateway/openshell) -- การตั้งค่าแบ็กเอนด์ sandbox แบบจัดการ โหมด workspace และข้อมูลอ้างอิง config
- [Sandbox Configuration](/th/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การแก้จุดบกพร่องแบบ "ทำไมสิ่งนี้ถึงถูกบล็อก?"
- [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) -- การ override ต่อเอเจนต์และลำดับความสำคัญ
- [Security](/th/gateway/security)
