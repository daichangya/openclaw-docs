---
read_when:
    - คุณต้องการ sandbox ที่จัดการบนคลาวด์แทน Docker ในเครื่อง
    - คุณกำลังกำหนดค่า plugin OpenShell
    - คุณต้องเลือกใช้ระหว่างโหมด mirror และโหมด remote workspace
summary: ใช้ OpenShell เป็นแบ็กเอนด์ sandbox แบบมีการจัดการสำหรับเอเจนต์ OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T05:34:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaf9027d0632a70fb86455f8bc46dc908ff766db0eb0cdf2f7df39c715241ead
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell เป็นแบ็กเอนด์ sandbox แบบมีการจัดการสำหรับ OpenClaw แทนที่จะรัน
คอนเทนเนอร์ Docker ในเครื่อง OpenClaw จะมอบหมายวงจรชีวิตของ sandbox ให้กับ `openshell` CLI
ซึ่งจัดเตรียมสภาพแวดล้อมระยะไกลพร้อมการรันคำสั่งผ่าน SSH

plugin OpenShell ใช้ SSH transport แกนหลักและ remote filesystem
bridge เดียวกับ [แบ็กเอนด์ SSH](/th/gateway/sandboxing#ssh-backend) แบบทั่วไป มันเพิ่มวงจรชีวิตเฉพาะของ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
และโหมด workspace แบบ `mirror` ที่เป็นตัวเลือก

## ข้อกำหนดเบื้องต้น

- ติดตั้ง `openshell` CLI และอยู่ใน `PATH` (หรือตั้งพาธแบบกำหนดเองผ่าน
  `plugins.entries.openshell.config.command`)
- บัญชี OpenShell ที่มีสิทธิ์เข้าถึง sandbox
- OpenClaw Gateway กำลังทำงานบนโฮสต์

## เริ่มต้นอย่างรวดเร็ว

1. เปิดใช้ plugin และตั้งค่าแบ็กเอนด์ sandbox:

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
          mode: "remote",
        },
      },
    },
  },
}
```

2. รีสตาร์ต Gateway ใน turn ถัดไปของเอเจนต์ OpenClaw จะสร้าง sandbox ของ OpenShell
   และกำหนดเส้นทางการรัน tool ผ่านมัน

3. ตรวจสอบ:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## โหมด workspace

นี่คือการตัดสินใจที่สำคัญที่สุดเมื่อใช้ OpenShell

### `mirror`

ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **workspace ในเครื่องยังคงเป็นตัวหลัก**

พฤติกรรม:

- ก่อน `exec` OpenClaw จะซิงก์ workspace ในเครื่องเข้าไปยัง sandbox ของ OpenShell
- หลัง `exec` OpenClaw จะซิงก์ workspace ระยะไกลกลับมายัง workspace ในเครื่อง
- file tools ยังคงทำงานผ่าน sandbox bridge แต่ workspace ในเครื่อง
  ยังคงเป็นแหล่งข้อมูลจริงระหว่างแต่ละ turn

เหมาะที่สุดสำหรับ:

- คุณแก้ไขไฟล์ในเครื่องภายนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นเห็นได้ใน
  sandbox โดยอัตโนมัติ
- คุณต้องการให้ sandbox ของ OpenShell มีพฤติกรรมใกล้เคียงกับแบ็กเอนด์ Docker
  มากที่สุด
- คุณต้องการให้ workspace บนโฮสต์สะท้อนการเขียนของ sandbox หลังแต่ละ exec turn

ข้อแลกเปลี่ยน: มีต้นทุนการซิงก์เพิ่มก่อนและหลังแต่ละ exec

### `remote`

ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้
**workspace ของ OpenShell กลายเป็นตัวหลัก**

พฤติกรรม:

- เมื่อ sandbox ถูกสร้างครั้งแรก OpenClaw จะ seed workspace ระยะไกลจาก
  workspace ในเครื่องหนึ่งครั้ง
- หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงาน
  โดยตรงกับ workspace ระยะไกลของ OpenShell
- OpenClaw จะ **ไม่** ซิงก์การเปลี่ยนแปลงจากระยะไกลกลับมายัง workspace ในเครื่อง
- การอ่านสื่อในช่วง prompt ยังคงทำงานได้ เพราะ file tool และ media tool อ่านผ่าน
  sandbox bridge

เหมาะที่สุดสำหรับ:

- sandbox ควรอยู่ฝั่งระยะไกลเป็นหลัก
- คุณต้องการลด overhead การซิงก์ต่อ turn
- คุณไม่ต้องการให้การแก้ไขในเครื่องของโฮสต์ไปเขียนทับสถานะ sandbox ระยะไกลโดยเงียบ ๆ

สำคัญ: หากคุณแก้ไขไฟล์บนโฮสต์ภายนอก OpenClaw หลังจาก seed ครั้งแรก
sandbox ระยะไกลจะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้น ให้ใช้
`openclaw sandbox recreate` เพื่อ seed ใหม่

### การเลือกโหมด

|                          | `mirror`                    | `remote`                  |
| ------------------------ | --------------------------- | ------------------------- |
| **workspace ตัวหลัก**    | โฮสต์ในเครื่อง              | OpenShell ระยะไกล         |
| **ทิศทางการซิงก์**       | สองทาง (ทุก exec)           | seed ครั้งเดียว           |
| **overhead ต่อ turn**    | สูงกว่า (อัปโหลด + ดาวน์โหลด) | ต่ำกว่า (remote ops โดยตรง) |
| **เห็นการแก้ไขในเครื่องหรือไม่?** | เห็น ใน exec ถัดไป         | ไม่เห็น จนกว่าจะ recreate |
| **เหมาะที่สุดสำหรับ**     | เวิร์กโฟลว์การพัฒนา         | เอเจนต์ระยะยาว, CI        |

## เอกสารอ้างอิงการกำหนดค่า

config ของ OpenShell ทั้งหมดอยู่ภายใต้ `plugins.entries.openshell.config`:

| คีย์                      | ประเภท                    | ค่าเริ่มต้น    | คำอธิบาย                                              |
| ------------------------ | ------------------------- | -------------- | ------------------------------------------------------ |
| `mode`                   | `"mirror"` หรือ `"remote"` | `"mirror"`     | โหมดการซิงก์ workspace                                 |
| `command`                | `string`                  | `"openshell"`  | พาธหรือชื่อของ `openshell` CLI                        |
| `from`                   | `string`                  | `"openclaw"`   | แหล่งที่มาของ sandbox สำหรับการ create ครั้งแรก        |
| `gateway`                | `string`                  | —              | ชื่อ Gateway ของ OpenShell (`--gateway`)              |
| `gatewayEndpoint`        | `string`                  | —              | URL endpoint ของ Gateway ของ OpenShell (`--gateway-endpoint`) |
| `policy`                 | `string`                  | —              | policy ID ของ OpenShell สำหรับการสร้าง sandbox         |
| `providers`              | `string[]`                | `[]`           | ชื่อผู้ให้บริการที่จะผูกเมื่อสร้าง sandbox             |
| `gpu`                    | `boolean`                 | `false`        | ขอทรัพยากร GPU                                         |
| `autoProviders`          | `boolean`                 | `true`         | ส่ง `--auto-providers` ระหว่าง sandbox create          |
| `remoteWorkspaceDir`     | `string`                  | `"/sandbox"`   | workspace หลักที่เขียนได้ภายใน sandbox                |
| `remoteAgentWorkspaceDir`| `string`                  | `"/agent"`     | พาธ mount ของ workspace เอเจนต์ (สำหรับการเข้าถึงแบบอ่านอย่างเดียว) |
| `timeoutSeconds`         | `number`                  | `120`          | timeout สำหรับการทำงานของ `openshell` CLI             |

การตั้งค่าระดับ sandbox (`mode`, `scope`, `workspaceAccess`) ถูกกำหนดภายใต้
`agents.defaults.sandbox` เช่นเดียวกับแบ็กเอนด์อื่น ดู
[Sandboxing](/th/gateway/sandboxing) สำหรับเมทริกซ์แบบเต็ม

## ตัวอย่าง

### การตั้งค่า remote ขั้นต่ำ

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### โหมด mirror พร้อม GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
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
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell รายเอเจนต์พร้อม Gateway แบบกำหนดเอง

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## การจัดการวงจรชีวิต

sandbox ของ OpenShell ถูกจัดการผ่าน sandbox CLI ปกติ:

```bash
# แสดง runtime ของ sandbox ทั้งหมด (Docker + OpenShell)
openclaw sandbox list

# ตรวจสอบ policy ที่มีผลจริง
openclaw sandbox explain

# สร้างใหม่ (ลบ workspace ระยะไกล และ seed ใหม่ในการใช้งานครั้งถัดไป)
openclaw sandbox recreate --all
```

สำหรับโหมด `remote`, **recreate มีความสำคัญเป็นพิเศษ**: มันจะลบ
workspace ระยะไกลตัวหลักสำหรับ scope นั้น การใช้งานครั้งถัดไปจะ seed workspace ระยะไกลใหม่จาก
workspace ในเครื่อง

สำหรับโหมด `mirror`, recreate มีไว้รีเซ็ตสภาพแวดล้อมการรันระยะไกลเป็นหลัก เพราะ
workspace ในเครื่องยังคงเป็นตัวหลัก

### เมื่อใดควร recreate

ให้ recreate หลังเปลี่ยนค่าใดค่าหนึ่งต่อไปนี้:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## ข้อจำกัดปัจจุบัน

- ไม่รองรับ sandbox browser บนแบ็กเอนด์ OpenShell
- `sandbox.docker.binds` ใช้กับ OpenShell ไม่ได้
- ตัวเลือก runtime เฉพาะ Docker ภายใต้ `sandbox.docker.*` ใช้ได้เฉพาะกับแบ็กเอนด์ Docker
  เท่านั้น

## วิธีการทำงาน

1. OpenClaw เรียก `openshell sandbox create` (พร้อมแฟล็ก `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` ตามที่กำหนดค่าไว้)
2. OpenClaw เรียก `openshell sandbox ssh-config <name>` เพื่อรับรายละเอียดการเชื่อมต่อ SSH
   สำหรับ sandbox
3. core เขียน SSH config ลงในไฟล์ชั่วคราวและเปิดเซสชัน SSH โดยใช้ remote filesystem bridge
   เดียวกับแบ็กเอนด์ SSH แบบทั่วไป
4. ในโหมด `mirror`: ซิงก์ local ไป remote ก่อน exec, รัน แล้วซิงก์กลับหลัง exec
5. ในโหมด `remote`: seed ครั้งเดียวตอน create แล้วทำงานโดยตรงบน
   workspace ระยะไกล

## ดูเพิ่มเติม

- [Sandboxing](/th/gateway/sandboxing) -- โหมด, scope และการเปรียบเทียบแบ็กเอนด์
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การดีบัก tool ที่ถูกบล็อก
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การแทนที่รายเอเจนต์
- [Sandbox CLI](/cli/sandbox) -- คำสั่ง `openclaw sandbox`
