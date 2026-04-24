---
read_when:
    - คุณต้องการ sandbox แบบจัดการผ่านคลาวด์แทน Docker ในเครื่อง
    - คุณกำลังกำหนดค่า Plugin OpenShell
    - คุณต้องการเลือกระหว่างโหมด mirror และ remote workspace
summary: ใช้ OpenShell เป็นแบ็กเอนด์ sandbox แบบมีการจัดการสำหรับเอเจนต์ OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T09:11:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell เป็นแบ็กเอนด์ sandbox แบบมีการจัดการสำหรับ OpenClaw แทนที่จะรัน Docker
containers ในเครื่อง OpenClaw จะมอบหมายวงจรชีวิตของ sandbox ให้กับ CLI `openshell`
ซึ่งจะจัดเตรียมสภาพแวดล้อมระยะไกลพร้อมการรันคำสั่งผ่าน SSH

Plugin OpenShell ใช้ transport แบบ SSH หลักและ
remote filesystem bridge เดียวกันกับ [แบ็กเอนด์ SSH](/th/gateway/sandboxing#ssh-backend) ทั่วไป โดยเพิ่มวงจรชีวิตเฉพาะของ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
และโหมด workspace แบบ `mirror` ที่เป็นตัวเลือก

## ข้อกำหนดเบื้องต้น

- ติดตั้ง CLI `openshell` แล้วและอยู่ใน `PATH` (หรือกำหนด path เองผ่าน
  `plugins.entries.openshell.config.command`)
- มีบัญชี OpenShell ที่เข้าถึง sandbox ได้
- OpenClaw Gateway กำลังทำงานอยู่บนโฮสต์

## เริ่มต้นอย่างรวดเร็ว

1. เปิดใช้ Plugin และตั้งค่าแบ็กเอนด์ sandbox:

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

2. รีสตาร์ต Gateway ในเทิร์นถัดไปของเอเจนต์ OpenClaw จะสร้าง OpenShell
   sandbox และกำหนดเส้นทางการรัน tool ผ่าน sandbox นั้น

3. ตรวจสอบ:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## โหมด Workspace

นี่คือการตัดสินใจที่สำคัญที่สุดเมื่อใช้ OpenShell

### `mirror`

ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **local
workspace ยังคงเป็นตัวหลัก**

พฤติกรรม:

- ก่อน `exec`, OpenClaw จะซิงก์ local workspace เข้าไปใน OpenShell sandbox
- หลัง `exec`, OpenClaw จะซิงก์ remote workspace กลับมายัง local workspace
- file tools ยังคงทำงานผ่าน sandbox bridge แต่ local workspace
  ยังคงเป็นแหล่งความจริงระหว่างเทิร์น

เหมาะที่สุดสำหรับ:

- คุณแก้ไขไฟล์ในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นมองเห็นได้ใน
  sandbox โดยอัตโนมัติ
- คุณต้องการให้ OpenShell sandbox ทำงานเหมือนแบ็กเอนด์ Docker
  ให้มากที่สุด
- คุณต้องการให้ host workspace สะท้อนการเขียนจาก sandbox หลังทุกเทิร์นของ exec

ข้อแลกเปลี่ยน: มีต้นทุนการซิงก์เพิ่มก่อนและหลังแต่ละ exec

### `remote`

ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้
**OpenShell workspace กลายเป็นตัวหลัก**

พฤติกรรม:

- เมื่อ sandbox ถูกสร้างครั้งแรก OpenClaw จะ seed remote workspace จาก
  local workspace หนึ่งครั้ง
- หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงาน
  โดยตรงกับ remote OpenShell workspace
- OpenClaw จะ **ไม่** ซิงก์การเปลี่ยนแปลงจากระยะไกลกลับมายัง local workspace
- การอ่านสื่อในช่วง prompt ยังคงทำงานได้ เพราะ file และ media tools อ่านผ่าน
  sandbox bridge

เหมาะที่สุดสำหรับ:

- sandbox ควรอยู่ทางฝั่งระยะไกลเป็นหลัก
- คุณต้องการลดภาระการซิงก์ต่อเทิร์น
- คุณไม่ต้องการให้การแก้ไขในเครื่องของโฮสต์เขียนทับสถานะ sandbox ระยะไกลอย่างเงียบ ๆ

สำคัญ: หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังจากการ seed ครั้งแรก
remote sandbox จะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้น ให้ใช้
`openclaw sandbox recreate` เพื่อ seed ใหม่

### การเลือกโหมด

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **workspace ตัวหลัก**    | โฮสต์ในเครื่อง             | OpenShell ระยะไกล         |
| **ทิศทางการซิงก์**       | สองทาง (ทุก exec)          | seed ครั้งเดียว           |
| **ภาระต่อเทิร์น**        | สูงกว่า (อัปโหลด + ดาวน์โหลด) | ต่ำกว่า (ทำงานระยะไกลโดยตรง) |
| **มองเห็นการแก้ไขในเครื่องหรือไม่?** | ใช่ ใน exec ถัดไป          | ไม่ จนกว่าจะ recreate     |
| **เหมาะที่สุดสำหรับ**     | เวิร์กโฟลว์การพัฒนา         | เอเจนต์ระยะยาว, CI        |

## เอกสารอ้างอิงการกำหนดค่า

config ของ OpenShell ทั้งหมดอยู่ภายใต้ `plugins.entries.openshell.config`:

| Key                       | Type                     | ค่าเริ่มต้น   | คำอธิบาย                                            |
| ------------------------- | ------------------------ | ------------- | --------------------------------------------------- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | โหมดการซิงก์ workspace                              |
| `command`                 | `string`                 | `"openshell"` | path หรือชื่อของ CLI `openshell`                    |
| `from`                    | `string`                 | `"openclaw"`  | แหล่ง sandbox สำหรับการสร้างครั้งแรก               |
| `gateway`                 | `string`                 | —             | ชื่อ OpenShell Gateway (`--gateway`)                |
| `gatewayEndpoint`         | `string`                 | —             | URL ปลายทาง OpenShell Gateway (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID ของนโยบาย OpenShell สำหรับการสร้าง sandbox      |
| `providers`               | `string[]`               | `[]`          | ชื่อ providers ที่จะแนบเมื่อสร้าง sandbox           |
| `gpu`                     | `boolean`                | `false`       | ขอทรัพยากร GPU                                     |
| `autoProviders`           | `boolean`                | `true`        | ส่ง `--auto-providers` ระหว่างสร้าง sandbox         |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | workspace หลักที่เขียนได้ภายใน sandbox             |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | path สำหรับ mount workspace ของเอเจนต์ (สำหรับการเข้าถึงแบบอ่านอย่างเดียว) |
| `timeoutSeconds`          | `number`                 | `120`         | timeout สำหรับการทำงานของ CLI `openshell`           |

การตั้งค่าระดับ sandbox (`mode`, `scope`, `workspaceAccess`) ถูกกำหนดภายใต้
`agents.defaults.sandbox` เช่นเดียวกับแบ็กเอนด์อื่น ๆ ดู
[Sandboxing](/th/gateway/sandboxing) สำหรับเมทริกซ์ฉบับเต็ม

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

### โหมด Mirror พร้อม GPU

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

### OpenShell รายเอเจนต์พร้อม gateway แบบกำหนดเอง

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

OpenShell sandboxes ถูกจัดการผ่าน CLI ของ sandbox ตามปกติ:

```bash
# แสดง runtimes ของ sandbox ทั้งหมด (Docker + OpenShell)
openclaw sandbox list

# ตรวจสอบนโยบายที่มีผลจริง
openclaw sandbox explain

# Recreate (ลบ remote workspace แล้ว seed ใหม่ในการใช้งานครั้งถัดไป)
openclaw sandbox recreate --all
```

สำหรับโหมด `remote`, **recreate มีความสำคัญเป็นพิเศษ**: มันจะลบ
remote workspace ตัวหลักสำหรับ scope นั้น การใช้งานครั้งถัดไปจะ seed remote workspace ใหม่จาก
local workspace

สำหรับโหมด `mirror`, recreate มีผลหลักในการรีเซ็ตสภาพแวดล้อมการรันระยะไกล เพราะ
local workspace ยังคงเป็นตัวหลัก

### เมื่อใดควร recreate

ให้ recreate หลังจากเปลี่ยนค่าใดค่าหนึ่งต่อไปนี้:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## การเสริมความแข็งแกร่งด้านความปลอดภัย

OpenShell จะตรึง workspace root fd และตรวจสอบตัวตนของ sandbox ซ้ำก่อนทุกการ
อ่าน ดังนั้นการสลับ symlink หรือ workspace ที่ถูก remount จะไม่สามารถเปลี่ยนทิศทางการอ่านให้ออกนอก
remote workspace ที่ตั้งใจไว้ได้

## ข้อจำกัดปัจจุบัน

- ไม่รองรับ sandbox browser บนแบ็กเอนด์ OpenShell
- `sandbox.docker.binds` ใช้ไม่ได้กับ OpenShell
- ปุ่มควบคุม runtime เฉพาะ Docker ภายใต้ `sandbox.docker.*` ใช้ได้เฉพาะกับแบ็กเอนด์ Docker
  เท่านั้น

## วิธีการทำงาน

1. OpenClaw เรียก `openshell sandbox create` (พร้อมแฟล็ก `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` ตามที่กำหนดค่าไว้)
2. OpenClaw เรียก `openshell sandbox ssh-config <name>` เพื่อรับรายละเอียดการเชื่อมต่อ SSH
   สำหรับ sandbox
3. Core จะเขียน config ของ SSH ลงในไฟล์ชั่วคราวและเปิดเซสชัน SSH โดยใช้
   remote filesystem bridge เดียวกันกับแบ็กเอนด์ SSH ทั่วไป
4. ในโหมด `mirror`: ซิงก์ local ไปยัง remote ก่อน exec, รัน แล้วซิงก์กลับหลัง exec
5. ในโหมด `remote`: seed หนึ่งครั้งตอนสร้าง แล้วทำงานโดยตรงกับ remote
   workspace

## ที่เกี่ยวข้อง

- [Sandboxing](/th/gateway/sandboxing) -- โหมด ขอบเขต และการเปรียบเทียบแบ็กเอนด์
- [Sandbox เทียบกับ Tool Policy เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การดีบัก tools ที่ถูกบล็อก
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การกำหนดแทนรายเอเจนต์
- [Sandbox CLI](/th/cli/sandbox) -- คำสั่ง `openclaw sandbox`
