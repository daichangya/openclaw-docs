---
read_when:
    - การสร้างหรือตรวจทานแผน `openclaw secrets apply`
    - การดีบักข้อผิดพลาด `Invalid plan target path`
    - การทำความเข้าใจพฤติกรรมการตรวจสอบประเภทเป้าหมายและพาธ
summary: 'สัญญาสำหรับแผน `secrets apply`: การตรวจสอบเป้าหมาย, การจับคู่พาธ และขอบเขตเป้าหมาย `auth-profiles.json`'
title: สัญญาแผนการใช้ Secrets
x-i18n:
    generated_at: "2026-04-23T05:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# สัญญาแผนการใช้ Secrets

หน้านี้กำหนดสัญญาแบบเข้มงวดที่ `openclaw secrets apply` บังคับใช้

หากเป้าหมายไม่ตรงตามกฎเหล่านี้ การใช้จะล้มเหลวก่อนมีการเปลี่ยนแปลง configuration

## รูปร่างของไฟล์แผน

`openclaw secrets apply --from <plan.json>` คาดหวังอาร์เรย์ `targets` ของ plan targets:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## ขอบเขตเป้าหมายที่รองรับ

plan targets จะถูกรับสำหรับพาธข้อมูลรับรองที่รองรับใน:

- [SecretRef Credential Surface](/th/reference/secretref-credential-surface)

## พฤติกรรมของประเภทเป้าหมาย

กฎทั่วไป:

- `target.type` ต้องเป็นประเภทที่รู้จัก และต้องตรงกับรูปร่าง `target.path` ที่ถูก normalize

compatibility aliases ยังคงยอมรับได้สำหรับแผนที่มีอยู่แล้ว:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## กฎการตรวจสอบพาธ

แต่ละเป้าหมายจะถูกตรวจสอบด้วยเงื่อนไขทั้งหมดต่อไปนี้:

- `type` ต้องเป็นประเภทเป้าหมายที่รู้จัก
- `path` ต้องเป็น dot path ที่ไม่ว่าง
- สามารถละ `pathSegments` ได้ หากระบุมา จะต้อง normalize เป็นพาธเดียวกันกับ `path` อย่างตรงกันทุกประการ
- ระบบจะปฏิเสธ segments ที่ห้ามใช้: `__proto__`, `prototype`, `constructor`
- พาธที่ถูก normalize ต้องตรงกับรูปร่างพาธที่ลงทะเบียนไว้สำหรับประเภทเป้าหมาย
- หากมีการตั้ง `providerId` หรือ `accountId` ค่าเหล่านั้นต้องตรงกับ id ที่เข้ารหัสอยู่ในพาธ
- เป้าหมาย `auth-profiles.json` ต้องมี `agentId`
- เมื่อสร้าง mapping ใหม่ใน `auth-profiles.json` ให้ใส่ `authProfileProvider`

## พฤติกรรมเมื่อเกิดความล้มเหลว

หากเป้าหมายตรวจสอบไม่ผ่าน การใช้จะออกพร้อมข้อผิดพลาดลักษณะนี้:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

จะไม่มีการเขียนใดๆ ถูกยืนยันสำหรับแผนที่ไม่ถูกต้อง

## พฤติกรรมการยินยอมของ exec provider

- `--dry-run` จะข้ามการตรวจสอบ exec SecretRef ตามค่าเริ่มต้น
- แผนที่มี exec SecretRefs/providers จะถูกปฏิเสธในโหมดเขียน เว้นแต่จะตั้ง `--allow-exec`
- เมื่อตรวจสอบ/ใช้แผนที่มี exec ให้ส่ง `--allow-exec` ทั้งในคำสั่ง dry-run และคำสั่งเขียน

## หมายเหตุเรื่องขอบเขตรันไทม์และการตรวจสอบ

- entries ของ `auth-profiles.json` ที่เป็น ref-only (`keyRef`/`tokenRef`) จะถูกรวมอยู่ในการ resolve ระหว่างรันไทม์และขอบเขตการตรวจสอบ
- `secrets apply` จะเขียนเป้าหมาย `openclaw.json` ที่รองรับ, เป้าหมาย `auth-profiles.json` ที่รองรับ และ scrub targets แบบเลือกได้

## การตรวจสอบสำหรับผู้ปฏิบัติการ

```bash
# ตรวจสอบแผนโดยไม่เขียน
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# จากนั้นค่อยใช้จริง
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# สำหรับแผนที่มี exec ให้เลือกใช้แบบชัดเจนทั้งสองโหมด
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

หากการใช้ล้มเหลวพร้อมข้อความ invalid target path ให้สร้างแผนใหม่ด้วย `openclaw secrets configure` หรือแก้พาธเป้าหมายให้เป็นรูปร่างที่รองรับตามด้านบน

## เอกสารที่เกี่ยวข้อง

- [Secrets Management](/th/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- [Configuration Reference](/th/gateway/configuration-reference)
