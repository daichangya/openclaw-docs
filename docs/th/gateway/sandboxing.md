---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'การทำงานของ sandboxing ใน OpenClaw: โหมด ขอบเขต การเข้าถึง workspace และ images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-23T05:35:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw สามารถรัน**เครื่องมือภายใน sandbox backends** เพื่อลดขอบเขตความเสียหายได้
สิ่งนี้เป็น**ตัวเลือก**และควบคุมผ่านการกำหนดค่า (`agents.defaults.sandbox` หรือ
`agents.list[].sandbox`) หากปิด sandboxing เครื่องมือจะรันบนโฮสต์
Gateway จะยังอยู่บนโฮสต์; เมื่อเปิดใช้งาน
การรันเครื่องมือจะเกิดขึ้นใน sandbox ที่แยกออกมา

นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึง filesystem
และโปรเซสได้อย่างมีนัยสำคัญเมื่อโมเดลทำอะไรที่ผิดพลาด

## สิ่งที่ถูก sandbox

- การรันเครื่องมือ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` ฯลฯ)
- browser ที่ถูก sandbox แบบไม่บังคับ (`agents.defaults.sandbox.browser`)
  - โดยค่าเริ่มต้น sandbox browser จะเริ่มอัตโนมัติ (เพื่อให้แน่ใจว่าเข้าถึง CDP ได้) เมื่อ browser tool ต้องใช้
    กำหนดค่าได้ผ่าน `agents.defaults.sandbox.browser.autoStart` และ `agents.defaults.sandbox.browser.autoStartTimeoutMs`
  - โดยค่าเริ่มต้น คอนเทนเนอร์ sandbox browser จะใช้ Docker network เฉพาะ (`openclaw-sandbox-browser`) แทน global `bridge` network
    กำหนดค่าได้ด้วย `agents.defaults.sandbox.browser.network`
  - `agents.defaults.sandbox.browser.cdpSourceRange` แบบไม่บังคับใช้จำกัด container-edge CDP ingress ด้วย CIDR allowlist (เช่น `172.21.0.1/32`)
  - การเข้าถึงผู้สังเกตการณ์ noVNC ถูกป้องกันด้วยรหัสผ่านโดยค่าเริ่มต้น; OpenClaw จะปล่อย URL แบบ token ชั่วคราวที่ให้บริการหน้า bootstrap ในเครื่องและเปิด noVNC พร้อมรหัสผ่านใน URL fragment (ไม่ใช่ query/header logs)
  - `agents.defaults.sandbox.browser.allowHostControl` อนุญาตให้เซสชันที่ถูก sandbox กำหนดเป้าหมายไปยัง browser บนโฮสต์โดยตรง
  - allowlist แบบไม่บังคับใช้ควบคุม `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

สิ่งที่ไม่ถูก sandbox:

- โปรเซส Gateway เอง
- เครื่องมือใดๆ ที่ถูกอนุญาตให้รันนอก sandbox อย่าง explicit (เช่น `tools.elevated`)
  - **Elevated exec จะข้าม sandboxing และใช้ escape path ที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อ exec target เป็น `node`)**
  - หากปิด sandboxing, `tools.elevated` จะไม่เปลี่ยนพฤติกรรมการรัน (เพราะรันบนโฮสต์อยู่แล้ว) ดู [Elevated Mode](/th/tools/elevated)

## โหมด

`agents.defaults.sandbox.mode` ควบคุมว่า sandboxing ถูกใช้**เมื่อใด**:

- `"off"`: ไม่ใช้ sandboxing
- `"non-main"`: sandbox เฉพาะเซสชันที่**ไม่ใช่ main** (เป็นค่าเริ่มต้นหากคุณต้องการให้แชตปกติรันบนโฮสต์)
- `"all"`: ทุกเซสชันรันใน sandbox
  หมายเหตุ: `"non-main"` อิงตาม `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ agent id
  เซสชันกลุ่ม/แชนเนลใช้คีย์ของตัวเอง จึงนับเป็น non-main และจะถูก sandbox

## ขอบเขต

`agents.defaults.sandbox.scope` ควบคุมว่า**มีการสร้างคอนเทนเนอร์กี่ตัว**:

- `"agent"` (ค่าเริ่มต้น): หนึ่งคอนเทนเนอร์ต่อหนึ่งเอเจนต์
- `"session"`: หนึ่งคอนเทนเนอร์ต่อหนึ่งเซสชัน
- `"shared"`: หนึ่งคอนเทนเนอร์ที่ใช้ร่วมกันโดยทุกเซสชันที่ถูก sandbox

## Backend

`agents.defaults.sandbox.backend` ควบคุมว่า runtime ใดเป็นผู้ให้บริการ sandbox:

- `"docker"` (ค่าเริ่มต้นเมื่อเปิดใช้งาน sandboxing): sandbox runtime แบบ local ที่ใช้ Docker
- `"ssh"`: sandbox runtime แบบ remote ทั่วไปที่ใช้ SSH
- `"openshell"`: sandbox runtime ที่ขับเคลื่อนด้วย OpenShell

คอนฟิกเฉพาะ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh`
คอนฟิกเฉพาะ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

### การเลือก backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **ตำแหน่งที่รัน**   | คอนเทนเนอร์ในเครื่อง                  | โฮสต์ใดก็ได้ที่เข้าถึงผ่าน SSH ได้        | sandbox ที่ OpenShell จัดการ                           |
| **การตั้งค่า**           | `scripts/sandbox-setup.sh`       | SSH key + โฮสต์เป้าหมาย          | เปิดใช้งาน Plugin OpenShell                            |
| **โมเดล workspace** | bind-mount หรือ copy               | remote-canonical (seed ครั้งเดียว)   | `mirror` หรือ `remote`                                |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: none) | ขึ้นอยู่กับโฮสต์ระยะไกล         | ขึ้นอยู่กับ OpenShell                                |
| **browser sandbox** | รองรับ                        | ไม่รองรับ                  | ยังไม่รองรับ                                   |
| **bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **เหมาะที่สุดสำหรับ**        | การพัฒนาในเครื่อง, การแยกเต็มรูปแบบ        | การย้ายงานไปเครื่องระยะไกล | sandbox ระยะไกลแบบมีการจัดการพร้อม two-way sync แบบไม่บังคับ |

### Docker backend

sandboxing ปิดไว้โดยค่าเริ่มต้น หากคุณเปิด sandboxing และไม่ได้เลือก
backend, OpenClaw จะใช้ Docker backend มันจะรันเครื่องมือและ sandbox browsers
ในเครื่องผ่าน Docker daemon socket (`/var/run/docker.sock`) การแยกคอนเทนเนอร์ sandbox
ถูกกำหนดโดย Docker namespaces

**ข้อจำกัดของ Docker-out-of-Docker (DooD)**:
หากคุณ deploy OpenClaw Gateway เองเป็น Docker container มันจะจัดการ sandbox containers แบบ sibling โดยใช้ Docker socket ของโฮสต์ (DooD) ซึ่งทำให้เกิดข้อจำกัดเฉพาะเรื่องการแมปพาธ:

- **คอนฟิกต้องใช้พาธของโฮสต์**: ค่ากำหนด `workspace` ใน `openclaw.json` ต้องเป็น**absolute path ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่พาธภายใน Gateway container เมื่อ OpenClaw ขอให้ Docker daemon สร้าง sandbox ขึ้นมา daemon จะประเมินพาธตาม namespace ของ Host OS ไม่ใช่ namespace ของ Gateway
- **FS Bridge Parity (แมป volume แบบเหมือนกันทุกประการ)**: โปรเซส native ของ OpenClaw Gateway ก็เขียน heartbeat และไฟล์ bridge ไปยังไดเรกทอรี `workspace` เช่นกัน เนื่องจาก Gateway ประเมินสตริงเดียวกันเป๊ะ (คือพาธของโฮสต์) จากในสภาพแวดล้อม containerized ของตัวเอง การ deploy Gateway จึงต้องมี volume map แบบเดียวกันที่ลิงก์ namespace ของโฮสต์โดยตรง (`-v /home/user/.openclaw:/home/user/.openclaw`)

หากคุณแมปพาธภายในโดยไม่มี absolute host parity OpenClaw จะโยนข้อผิดพลาดสิทธิ์ `EACCES` โดยตรงเมื่อพยายามเขียน heartbeat ภายในสภาพแวดล้อมของ container เพราะสตริงพาธแบบ fully qualified นั้นไม่มีอยู่จริงในสภาพแวดล้อมแบบ native

### SSH backend

ใช้ `backend: "ssh"` เมื่อคุณต้องการให้ OpenClaw sandbox `exec`, file tools และ media reads บน
เครื่องใดก็ได้ที่เข้าถึงได้ผ่าน SSH

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

- OpenClaw จะสร้าง remote root ตามขอบเขตภายใต้ `sandbox.ssh.workspaceRoot`
- เมื่อใช้งานครั้งแรกหลังการสร้างหรือสร้างใหม่ OpenClaw จะ seed remote workspace จาก local workspace หนึ่งครั้ง
- หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่าน media จาก prompt และการจัด staging ของ media ขาเข้า จะทำงานโดยตรงกับ remote workspace ผ่าน SSH
- OpenClaw จะไม่ sync การเปลี่ยนแปลงจาก remote กลับไปยัง local workspace โดยอัตโนมัติ

วัสดุสำหรับการยืนยันตัวตน:

- `identityFile`, `certificateFile`, `knownHostsFile`: ใช้ไฟล์ในเครื่องที่มีอยู่และส่งผ่านการกำหนดค่า OpenSSH
- `identityData`, `certificateData`, `knownHostsData`: ใช้สตริงแบบ inline หรือ SecretRefs OpenClaw จะ resolve ผ่าน runtime snapshot ของ secrets ปกติ เขียนลงไฟล์ temp พร้อมสิทธิ์ `0600` และลบเมื่อ SSH session สิ้นสุด
- หากตั้งทั้ง `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะมีผลเหนือกว่าสำหรับ SSH session นั้น

นี่คือโมเดลแบบ **remote-canonical** remote SSH workspace จะกลายเป็นสถานะ sandbox จริงหลังจากขั้นตอน seed เริ่มต้น

ผลที่ตามมาที่สำคัญ:

- การแก้ไขบนโฮสต์ในเครื่องที่ทำขึ้นนอก OpenClaw หลังขั้นตอน seed จะไม่มองเห็นจากฝั่ง remote จนกว่าคุณจะสร้าง sandbox ใหม่
- `openclaw sandbox recreate` จะลบ remote root ตามขอบเขตและ seed ใหม่จาก local เมื่อใช้งานครั้งถัดไป
- browser sandboxing ไม่รองรับบน SSH backend
- การตั้งค่า `sandbox.docker.*` ไม่ใช้กับ SSH backend

### OpenShell backend

ใช้ `backend: "openshell"` เมื่อคุณต้องการให้ OpenClaw sandbox เครื่องมือใน
สภาพแวดล้อมระยะไกลที่ OpenShell จัดการไว้ สำหรับคู่มือการตั้งค่าแบบเต็ม เอกสารอ้างอิงคอนฟิก
และการเปรียบเทียบโหมด workspace โปรดดู
[หน้า OpenShell](/th/gateway/openshell) โดยเฉพาะ

OpenShell ใช้ transport แบบ SSH แกนหลักและ remote filesystem bridge เดียวกันกับ
generic SSH backend และเพิ่มวงจรชีวิตเฉพาะของ OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) พร้อมโหมด workspace `mirror`
แบบไม่บังคับ

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

โหมด OpenShell:

- `mirror` (ค่าเริ่มต้น): local workspace ยังคงเป็น canonical OpenClaw จะ sync ไฟล์ local เข้า OpenShell ก่อน exec และ sync remote workspace กลับหลัง exec
- `remote`: workspace ของ OpenShell เป็น canonical หลังจากสร้าง sandbox แล้ว OpenClaw จะ seed remote workspace จาก local workspace หนึ่งครั้ง จากนั้น file tools และ exec จะทำงานโดยตรงกับ sandbox ระยะไกลโดยไม่ sync การเปลี่ยนแปลงกลับ

รายละเอียด transport ระยะไกล:

- OpenClaw ขอคอนฟิก SSH เฉพาะ sandbox จาก OpenShell ผ่าน `openshell sandbox ssh-config <name>`
- แกนหลักจะเขียนคอนฟิก SSH นั้นลงไฟล์ temp เปิด SSH session และนำ remote filesystem bridge แบบเดียวกับ `backend: "ssh"` กลับมาใช้
- ในโหมด `mirror` แตกต่างเฉพาะวงจรชีวิตเท่านั้น: sync local ไป remote ก่อน exec แล้ว sync กลับหลัง exec

ข้อจำกัดปัจจุบันของ OpenShell:

- sandbox browser ยังไม่รองรับ
- `sandbox.docker.binds` ไม่รองรับบน OpenShell backend
- ตัวปรับ runtime เฉพาะ Docker ภายใต้ `sandbox.docker.*` ยังใช้ได้กับ Docker backend เท่านั้น

#### โหมด workspace

OpenShell มีโมเดล workspace สองแบบ ส่วนนี้คือสิ่งที่สำคัญที่สุดในทางปฏิบัติ

##### `mirror`

ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **local workspace ยังคงเป็น canonical**

พฤติกรรม:

- ก่อน `exec` OpenClaw จะ sync local workspace เข้าไปใน OpenShell sandbox
- หลัง `exec` OpenClaw จะ sync remote workspace กลับมายัง local workspace
- file tools ยังคงทำงานผ่าน sandbox bridge แต่ local workspace ยังคงเป็นแหล่งข้อมูลจริงระหว่างแต่ละ turn

ใช้เมื่อ:

- คุณแก้ไขไฟล์ในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงนั้นปรากฏใน sandbox โดยอัตโนมัติ
- คุณต้องการให้ OpenShell sandbox มีพฤติกรรมใกล้เคียงกับ Docker backend มากที่สุด
- คุณต้องการให้ host workspace สะท้อนการเขียนจาก sandbox หลังจบแต่ละ exec turn

ข้อแลกเปลี่ยน:

- มีต้นทุนการ sync เพิ่มก่อนและหลัง exec

##### `remote`

ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้ **workspace ของ OpenShell กลายเป็น canonical**

พฤติกรรม:

- เมื่อสร้าง sandbox ครั้งแรก OpenClaw จะ seed remote workspace จาก local workspace หนึ่งครั้ง
- หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงานโดยตรงกับ remote OpenShell workspace
- OpenClaw จะ **ไม่** sync การเปลี่ยนแปลงจาก remote กลับมายัง local workspace หลัง exec
- การอ่าน media ตอนสร้าง prompt ยังคงทำงานได้ เพราะ file และ media tools อ่านผ่าน sandbox bridge แทนการสมมติว่ามี local host path
- transport คือ SSH เข้าไปยัง OpenShell sandbox ที่ส่งกลับจาก `openshell sandbox ssh-config`

ผลที่ตามมาที่สำคัญ:

- หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังขั้นตอน seed remote sandbox จะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้นโดยอัตโนมัติ
- หากมีการสร้าง sandbox ใหม่ remote workspace จะถูก seed จาก local workspace อีกครั้ง
- เมื่อใช้ `scope: "agent"` หรือ `scope: "shared"` remote workspace นั้นจะถูกใช้ร่วมกันตามขอบเขตนั้นด้วย

ใช้สิ่งนี้เมื่อ:

- sandbox ควรอยู่หลักๆ ที่ฝั่ง OpenShell ระยะไกล
- คุณต้องการลด overhead ของการ sync ต่อเทิร์น
- คุณไม่ต้องการให้การแก้ไขบนโฮสต์ในเครื่องมาเขียนทับสถานะของ remote sandbox แบบเงียบๆ

เลือก `mirror` หากคุณคิดว่า sandbox เป็นสภาพแวดล้อมการรันแบบชั่วคราว
เลือก `remote` หากคุณคิดว่า sandbox คือ workspace ตัวจริง

#### วงจรชีวิตของ OpenShell

OpenShell sandboxes ยังคงถูกจัดการผ่านวงจรชีวิต sandbox ปกติ:

- `openclaw sandbox list` จะแสดงทั้ง runtimes ของ OpenShell และ Docker
- `openclaw sandbox recreate` จะลบ runtime ปัจจุบัน แล้วให้ OpenClaw สร้างใหม่เมื่อมีการใช้งานครั้งถัดไป
- logic สำหรับ prune ก็รับรู้ backend เช่นกัน

สำหรับโหมด `remote` การ recreate มีความสำคัญเป็นพิเศษ:

- recreate จะลบ remote workspace แบบ canonical สำหรับขอบเขตนั้น
- การใช้งานครั้งถัดไปจะ seed remote workspace ใหม่จาก local workspace

สำหรับโหมด `mirror` การ recreate มีผลหลักคือรีเซ็ตสภาพแวดล้อมการรันระยะไกล
เพราะ local workspace ยังคงเป็น canonical อยู่แล้ว

## การเข้าถึง Workspace

`agents.defaults.sandbox.workspaceAccess` ควบคุมว่า sandbox **มองเห็นอะไรได้บ้าง**:

- `"none"` (ค่าเริ่มต้น): เครื่องมือจะเห็น sandbox workspace ภายใต้ `~/.openclaw/sandboxes`
- `"ro"`: mount agent workspace แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้ `write`/`edit`/`apply_patch`)
- `"rw"`: mount agent workspace แบบอ่าน-เขียนที่ `/workspace`

เมื่อใช้ OpenShell backend:

- โหมด `mirror` ยังคงใช้ local workspace เป็นแหล่ง canonical ระหว่าง exec แต่ละเทิร์น
- โหมด `remote` ใช้ remote OpenShell workspace เป็นแหล่ง canonical หลังการ seed ครั้งแรก
- `workspaceAccess: "ro"` และ `"none"` ยังคงจำกัดพฤติกรรมการเขียนในลักษณะเดียวกัน

media ขาเข้าจะถูกคัดลอกเข้าไปยัง sandbox workspace ที่กำลังใช้งานอยู่ (`media/inbound/*`)
หมายเหตุเรื่อง Skills: เครื่องมือ `read` ยึด root อยู่กับ sandbox เมื่อใช้ `workspaceAccess: "none"`
OpenClaw จะ mirror Skills ที่เข้าเงื่อนไขเข้าไปใน sandbox workspace (`.../skills`) เพื่อให้
สามารถอ่านได้ เมื่อใช้ `"rw"` Skills ของ workspace จะอ่านได้จาก
`/workspace/skills`

## Custom bind mounts

`agents.defaults.sandbox.docker.binds` ใช้ mount ไดเรกทอรีเพิ่มเติมของโฮสต์เข้าไปในคอนเทนเนอร์
รูปแบบคือ `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

binds ระดับ global และระดับรายเอเจนต์จะถูก **merge** เข้าด้วยกัน (ไม่ใช่แทนที่กัน) ภายใต้ `scope: "shared"` binds แบบรายเอเจนต์จะถูกละเว้น

`agents.defaults.sandbox.browser.binds` ใช้ mount ไดเรกทอรีเพิ่มเติมของโฮสต์เข้าไปในคอนเทนเนอร์ **sandbox browser** เท่านั้น

- เมื่อมีการตั้งค่า (รวมถึง `[]`) มันจะแทนที่ `agents.defaults.sandbox.docker.binds` สำหรับ browser container
- เมื่อไม่ได้ตั้งค่า browser container จะ fallback ไปใช้ `agents.defaults.sandbox.docker.binds` (คงความเข้ากันได้ย้อนหลัง)

ตัวอย่าง (source แบบอ่านอย่างเดียว + ไดเรกทอรีข้อมูลเพิ่มเติม):

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

- binds จะข้าม filesystem ของ sandbox: มันเปิดเผยพาธของโฮสต์ด้วยโหมดที่คุณตั้ง (`:ro` หรือ `:rw`)
- OpenClaw จะบล็อก bind sources ที่อันตราย (เช่น `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` และ parent mounts ที่จะเปิดเผยสิ่งเหล่านี้)
- OpenClaw ยังบล็อก root ของข้อมูลประจำตัวใน home directory ที่พบบ่อย เช่น `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` และ `~/.ssh`
- การตรวจสอบ bind ไม่ใช่แค่การจับคู่สตริง OpenClaw จะ normalize source path แล้ว resolve ซ้ำผ่าน deepest existing ancestor ก่อนจะตรวจสอบ blocked paths และ allowed roots อีกครั้ง
- นั่นหมายความว่า symlink-parent escapes จะยัง fail closed แม้ final leaf จะยังไม่มีอยู่จริงก็ตาม ตัวอย่าง: `/workspace/run-link/new-file` จะยัง resolve เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น
- allowed source roots ก็ถูก canonicalize ด้วยวิธีเดียวกัน ดังนั้นพาธที่เพียงแค่ “ดูเหมือน” อยู่ใน allowlist ก่อน symlink resolution จะยังถูกปฏิเสธว่าเป็น `outside allowed roots`
- mount ที่มีความอ่อนไหว (secrets, SSH keys, service credentials) ควรเป็น `:ro` เว้นแต่จำเป็นจริงๆ
- ใช้ร่วมกับ `workspaceAccess: "ro"` หากคุณต้องการเพียงสิทธิ์อ่าน workspace; โหมดของ bind ยังคงเป็นอิสระจากกัน
- ดู [Sandbox เทียบกับ Tool Policy เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) เพื่อเข้าใจว่า binds ทำงานร่วมกับ tool policy และ elevated exec อย่างไร

## Images + การตั้งค่า

Docker image เริ่มต้น: `openclaw-sandbox:bookworm-slim`

สร้างหนึ่งครั้ง:

```bash
scripts/sandbox-setup.sh
```

หมายเหตุ: image เริ่มต้น **ไม่มี** Node หาก Skill ต้องใช้ Node (หรือ
runtime อื่นๆ) ให้สร้าง custom image หรือให้ติดตั้งผ่าน
`sandbox.docker.setupCommand` (ต้องมี network egress + writable root +
root user)

หากคุณต้องการ sandbox image ที่ใช้งานได้มากขึ้นพร้อมเครื่องมือทั่วไป (เช่น
`curl`, `jq`, `nodejs`, `python3`, `git`) ให้สร้างด้วย:

```bash
scripts/sandbox-common-setup.sh
```

จากนั้นตั้ง `agents.defaults.sandbox.docker.image` เป็น
`openclaw-sandbox-common:bookworm-slim`

sandboxed browser image:

```bash
scripts/sandbox-browser-setup.sh
```

โดยค่าเริ่มต้น Docker sandbox containers จะรันแบบ **ไม่มีเครือข่าย**
แทนที่ได้ด้วย `agents.defaults.sandbox.docker.network`

sandbox browser image ที่บันเดิลมายังใช้ค่าเริ่มต้นการเริ่มต้น Chromium แบบ conservative
สำหรับงานในคอนเทนเนอร์ด้วย ค่าเริ่มต้นปัจจุบันของคอนเทนเนอร์รวมถึง:

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
- `--no-sandbox` และ `--disable-setuid-sandbox` เมื่อเปิด `noSandbox`
- แฟล็กด้านกราฟิกแบบ hardening ทั้งสามตัว (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) เป็นแบบไม่บังคับ และมีประโยชน์
  เมื่อคอนเทนเนอร์ไม่มี GPU support ตั้ง `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  หากงานของคุณต้องใช้ WebGL หรือฟีเจอร์ 3D/browser อื่นๆ
- `--disable-extensions` เปิดไว้โดยค่าเริ่มต้น และสามารถปิดได้ด้วย
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับ flow ที่ต้องพึ่ง extensions
- `--renderer-process-limit=2` ถูกควบคุมด้วย
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดย `0` จะคงค่าเริ่มต้นของ Chromium

หากคุณต้องการ runtime profile แบบอื่น ให้ใช้ custom browser image และกำหนด
entrypoint เอง สำหรับโปรไฟล์ Chromium แบบ local (ไม่ใช่คอนเทนเนอร์) ให้ใช้
`browser.extraArgs` เพื่อ append แฟล็กการเริ่มต้นเพิ่มเติม

ค่าเริ่มต้นด้านความปลอดภัย:

- `network: "host"` ถูกบล็อก
- `network: "container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น (มีความเสี่ยงจากการ join namespace)
- การแทนที่แบบ break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

การติดตั้ง Docker และ Gateway แบบ containerized อยู่ที่นี่:
[Docker](/th/install/docker)

สำหรับการ deploy Gateway ด้วย Docker, `scripts/docker/setup.sh` สามารถ bootstrap คอนฟิก sandbox ได้
ตั้ง `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้เส้นทางนั้น คุณสามารถ
แทนที่ตำแหน่ง socket ได้ด้วย `OPENCLAW_DOCKER_SOCKET` ดูการตั้งค่าเต็มและเอกสารอ้างอิง env ได้ที่: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การตั้งค่าคอนเทนเนอร์แบบครั้งเดียว)

`setupCommand` จะรัน **ครั้งเดียว** หลังจากสร้าง sandbox container (ไม่ใช่ทุกครั้งที่รัน)
มันจะรันภายในคอนเทนเนอร์ผ่าน `sh -lc`

พาธ:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- รายเอเจนต์: `agents.list[].sandbox.docker.setupCommand`

จุดที่มักพลาด:

- ค่าเริ่มต้น `docker.network` คือ `"none"` (ไม่มี egress) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
- `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และเป็นแบบ break-glass เท่านั้น
- `readOnlyRoot: true` ป้องกันการเขียน; ให้ตั้ง `readOnlyRoot: false` หรือสร้าง custom image
- `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ละ `user` ไว้หรือใช้ `user: "0:0"`)
- sandbox exec **ไม่ได้** สืบทอด `process.env` จากโฮสต์ ใช้
  `agents.defaults.sandbox.docker.env` (หรือ custom image) สำหรับ API keys ของ Skills

## Tool policy + ทางออกพิเศษ

นโยบาย allow/deny ของเครื่องมือยังคงถูกใช้ก่อนกฎ sandbox หากเครื่องมือถูกปฏิเสธ
แบบ global หรือแบบรายเอเจนต์ sandboxing จะไม่ทำให้มันกลับมาใช้ได้

`tools.elevated` คือทางออกพิเศษแบบ explicit ที่รัน `exec` นอก sandbox (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อ exec target เป็น `node`)
คำสั่ง `/exec` ใช้ได้เฉพาะกับผู้ส่งที่ได้รับอนุญาตและคงอยู่ต่อ session; หากต้องการปิด
`exec` แบบเด็ดขาด ให้ใช้นโยบาย deny ของเครื่องมือ (ดู [Sandbox เทียบกับ Tool Policy เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การดีบัก:

- ใช้ `openclaw sandbox explain` เพื่อตรวจสอบ effective sandbox mode, tool policy และ fix-it config keys
- ดู [Sandbox เทียบกับ Tool Policy เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับโมเดลความเข้าใจแบบ “ทำไมสิ่งนี้ถึงถูกบล็อก?”
  ให้ล็อกมันไว้ให้แน่น

## การแทนที่แบบหลายเอเจนต์

แต่ละเอเจนต์สามารถแทนที่ sandbox + tools ได้:
`agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับนโยบายเครื่องมือของ sandbox)
ดู [Sandbox และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) สำหรับลำดับความสำคัญ

## ตัวอย่างการเปิดใช้งานขั้นต่ำ

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

- [OpenShell](/th/gateway/openshell) -- การตั้งค่า managed sandbox backend, โหมด workspace และเอกสารอ้างอิงคอนฟิก
- [Sandbox Configuration](/th/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox เทียบกับ Tool Policy เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การดีบัก “ทำไมสิ่งนี้ถึงถูกบล็อก?”
- [Sandbox และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การแทนที่แบบรายเอเจนต์และลำดับความสำคัญ
- [Security](/th/gateway/security)
