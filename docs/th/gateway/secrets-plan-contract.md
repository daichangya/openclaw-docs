---
read_when:
    - การสร้างหรือตรวจทานแผน `openclaw secrets apply`
    - การดีบักข้อผิดพลาดของ `Invalid plan target path`
    - การทำความเข้าใจพฤติกรรมการตรวจสอบชนิดเป้าหมายและพาธ
summary: 'สัญญาสำหรับแผน `secrets apply`: การตรวจสอบความถูกต้องของเป้าหมาย การจับคู่พาธ และขอบเขตเป้าหมายของ `auth-profiles.json`'
title: สัญญาแผน apply ของ secrets
x-i18n:
    generated_at: "2026-04-24T09:12:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

หน้านี้กำหนดสัญญาแบบเข้มงวดที่ถูกบังคับใช้โดย `openclaw secrets apply`

หากเป้าหมายไม่ตรงตามกฎเหล่านี้ apply จะล้มเหลวก่อนมีการแก้ไข configuration

## รูปแบบไฟล์แผน

`openclaw secrets apply --from <plan.json>` คาดหวัง `targets` array ของเป้าหมายในแผน:

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

ระบบยอมรับเป้าหมายในแผนสำหรับ paths ของข้อมูลรับรองที่รองรับใน:

- [SecretRef Credential Surface](/th/reference/secretref-credential-surface)

## พฤติกรรมของชนิดเป้าหมาย

กฎทั่วไป:

- `target.type` ต้องเป็นค่าที่รู้จักและต้องตรงกับรูปแบบ `target.path` ที่ถูก normalize แล้ว

compatibility aliases ยังยอมรับได้สำหรับแผนเดิมที่มีอยู่:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## กฎการตรวจสอบพาธ

แต่ละเป้าหมายจะถูกตรวจสอบด้วยเงื่อนไขทั้งหมดต่อไปนี้:

- `type` ต้องเป็นชนิดเป้าหมายที่รู้จัก
- `path` ต้องเป็น dot path ที่ไม่ว่าง
- `pathSegments` สามารถละได้ หากระบุมา จะต้อง normalize แล้วได้ path ที่ตรงกับ `path` ทุกประการ
- segments ที่ต้องห้ามจะถูกปฏิเสธ: `__proto__`, `prototype`, `constructor`
- path ที่ normalize แล้วต้องตรงกับรูปแบบ path ที่ลงทะเบียนไว้สำหรับชนิดเป้าหมายนั้น
- หากมีการตั้ง `providerId` หรือ `accountId` ไว้ ค่านั้นต้องตรงกับ id ที่ถูกเข้ารหัสอยู่ใน path
- เป้าหมายของ `auth-profiles.json` ต้องมี `agentId`
- เมื่อสร้าง mapping ใหม่ใน `auth-profiles.json` ให้รวม `authProfileProvider` มาด้วย

## พฤติกรรมเมื่อเกิดความล้มเหลว

หากเป้าหมายใดไม่ผ่านการตรวจสอบ apply จะออกพร้อมข้อผิดพลาดเช่น:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

จะไม่มีการเขียนใดถูกคอมมิตสำหรับแผนที่ไม่ถูกต้อง

## พฤติกรรมการยินยอมของ exec provider

- `--dry-run` จะข้ามการตรวจสอบ exec SecretRef เป็นค่าเริ่มต้น
- แผนที่มี exec SecretRefs/providers จะถูกปฏิเสธในโหมดเขียน เว้นแต่จะตั้ง `--allow-exec`
- เมื่อตรวจสอบ/นำแผนที่มี exec ไปใช้ ให้ส่ง `--allow-exec` ทั้งในคำสั่ง dry-run และคำสั่งเขียนจริง

## หมายเหตุเรื่องขอบเขต runtime และ audit

- รายการ `auth-profiles.json` แบบ ref-only (`keyRef`/`tokenRef`) ถูกรวมอยู่ในการ resolve ขณะรันและในขอบเขตการ audit
- `secrets apply` จะเขียนเป้าหมาย `openclaw.json` ที่รองรับ เป้าหมาย `auth-profiles.json` ที่รองรับ และ scrub targets แบบไม่บังคับ

## การตรวจสอบสำหรับ operator

```bash
# ตรวจสอบแผนโดยไม่เขียน
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# จากนั้นจึง apply จริง
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# สำหรับแผนที่มี exec ให้ opt in อย่างชัดเจนทั้งสองโหมด
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

หาก apply ล้มเหลวพร้อมข้อความ invalid target path ให้สร้างแผนใหม่ด้วย `openclaw secrets configure` หรือแก้ไข target path ให้เป็นรูปแบบที่รองรับตามด้านบน

## เอกสารที่เกี่ยวข้อง

- [Secrets Management](/th/gateway/secrets)
- [CLI `secrets`](/th/cli/secrets)
- [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- [Configuration Reference](/th/gateway/configuration-reference)
