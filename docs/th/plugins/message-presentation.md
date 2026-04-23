---
read_when:
    - กำลังเพิ่มหรือแก้ไขการเรนเดอร์การ์ดข้อความ ปุ่ม หรือ select
    - กำลังสร้าง Plugin ช่องทางที่รองรับข้อความขาออกแบบ rich message
    - กำลังเปลี่ยนความสามารถด้าน presentation หรือ delivery ของเครื่องมือ message
    - กำลังดีบัก regression ของการเรนเดอร์ card/block/component แบบเฉพาะผู้ให้บริการ
summary: การ์ดข้อความเชิงความหมาย ปุ่ม select ข้อความ fallback และ delivery hints สำหรับ Plugin ช่องทาง
title: การนำเสนอข้อความ
x-i18n:
    generated_at: "2026-04-23T05:47:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# การนำเสนอข้อความ

การนำเสนอข้อความคือสัญญาแบบใช้ร่วมกันของ OpenClaw สำหรับ UI ข้อความขาออกแบบ rich message
มันช่วยให้เอเจนต์ คำสั่ง CLI approval flows และ Plugins สามารถอธิบาย
เจตนาของข้อความเพียงครั้งเดียว ขณะที่แต่ละ Plugin ของช่องทางจะเรนเดอร์เป็นรูปแบบเนทีฟที่ดีที่สุดเท่าที่ทำได้

ใช้ presentation สำหรับ UI ข้อความแบบพกพา:

- ส่วนข้อความ
- ข้อความบริบท/ท้ายข้อความขนาดเล็ก
- เส้นคั่น
- ปุ่ม
- เมนู select
- ชื่อการ์ดและโทน

อย่าเพิ่มฟิลด์แบบเนทีฟของผู้ให้บริการใหม่ เช่น `components` ของ Discord, `blocks` ของ Slack
`buttons` ของ Telegram, `card` ของ Teams หรือ `card` ของ Feishu ลงใน
เครื่องมือข้อความแบบใช้ร่วมกัน สิ่งเหล่านั้นเป็นผลลัพธ์ของ renderer ที่เป็นเจ้าของโดย Plugin ของช่องทาง

## สัญญา

ผู้เขียน Plugin นำเข้าสัญญาสาธารณะจาก:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

รูปทรง:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

ความหมายของปุ่ม:

- `value` คือค่าแอปพลิเคชันสำหรับ action ที่ถูก route กลับผ่าน interaction path
  ที่มีอยู่ของช่องทาง เมื่อช่องทางรองรับตัวควบคุมแบบคลิกได้
- `url` คือปุ่มลิงก์ สามารถมีได้โดยไม่มี `value`
- `label` เป็นค่าบังคับ และยังถูกใช้ใน text fallback ด้วย
- `style` เป็นเพียงคำแนะนำ Renderers ควรแมป style ที่ไม่รองรับไปยังค่าเริ่มต้นที่ปลอดภัย
  ไม่ใช่ทำให้การส่งล้มเหลว

ความหมายของ select:

- `options[].value` คือค่าแอปพลิเคชันที่ถูกเลือก
- `placeholder` เป็นเพียงคำแนะนำและอาจถูกละเลยโดยช่องทางที่ไม่มีการรองรับ
  select แบบเนทีฟ
- หากช่องทางไม่รองรับ selects ข้อความ fallback จะแสดง labels เป็นรายการ

## ตัวอย่างฝั่งผู้สร้าง

การ์ดแบบง่าย:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

ปุ่มลิงก์แบบ URL-only:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

เมนู select:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

การส่งผ่าน CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

การส่งพร้อม pin:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

การส่งพร้อม pin โดยใช้ JSON แบบ explicit:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## สัญญาของ Renderer

Plugin ของช่องทางประกาศการรองรับการเรนเดอร์บน outbound adapter ของตัวเอง:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

ฟิลด์ capability ถูกตั้งใจให้เป็น boolean แบบง่ายๆ มันอธิบายว่า
renderer สามารถทำให้สิ่งใดโต้ตอบได้บ้าง ไม่ใช่ข้อจำกัดของแพลตฟอร์มแบบเนทีฟทุกอย่าง Renderers ยังคง
เป็นเจ้าของข้อจำกัดเฉพาะแพลตฟอร์ม เช่น จำนวนปุ่มสูงสุด จำนวนบล็อก และขนาดการ์ด

## ลำดับการเรนเดอร์ของแกนหลัก

เมื่อ `ReplyPayload` หรือการดำเนินการข้อความมี `presentation`, แกนหลักจะ:

1. normalize payload ของ presentation
2. resolve outbound adapter ของช่องทางเป้าหมาย
3. อ่าน `presentationCapabilities`
4. เรียก `renderPresentation` เมื่อ adapter สามารถเรนเดอร์ payload ได้
5. fallback ไปเป็นข้อความแบบ conservative เมื่อไม่มี adapter หรือไม่สามารถเรนเดอร์ได้
6. ส่ง payload ที่ได้ผ่านเส้นทางการส่งของช่องทางตามปกติ
7. ใช้ delivery metadata เช่น `delivery.pin` หลังจากส่งข้อความแรกสำเร็จ

แกนหลักเป็นเจ้าของพฤติกรรม fallback เพื่อให้ผู้สร้างสามารถไม่ต้องผูกกับช่องทางได้ Plugins ของช่องทาง
เป็นเจ้าของการเรนเดอร์แบบเนทีฟและการจัดการ interaction

## กฎการลดระดับ

presentation ต้องปลอดภัยต่อการส่งบนช่องทางที่มีข้อจำกัด

fallback text ประกอบด้วย:

- `title` เป็นบรรทัดแรก
- บล็อก `text` เป็นย่อหน้าปกติ
- บล็อก `context` เป็นบรรทัดบริบทแบบกะทัดรัด
- บล็อก `divider` เป็นตัวคั่นที่มองเห็นได้
- labels ของปุ่ม รวมถึง URLs สำหรับปุ่มลิงก์
- labels ของตัวเลือก select

ตัวควบคุมแบบเนทีฟที่ไม่รองรับควรถูกลดระดับแทนที่จะทำให้การส่งทั้งหมดล้มเหลว
ตัวอย่าง:

- Telegram ที่ปิด inline buttons จะส่ง text fallback
- ช่องทางที่ไม่รองรับ select จะแสดงตัวเลือก select เป็นข้อความ
- ปุ่มแบบ URL-only จะกลายเป็นปุ่มลิงก์แบบเนทีฟหรือบรรทัด URL แบบ fallback
- ความล้มเหลวของการ pin แบบไม่บังคับจะไม่ทำให้ข้อความที่ส่งแล้วล้มเหลว

ข้อยกเว้นหลักคือ `delivery.pin.required: true`; หากมีการร้องขอให้ pin แบบ
required และช่องทางไม่สามารถ pin ข้อความที่ส่งได้ การส่งจะถูกรายงานว่าล้มเหลว

## การแมปตามผู้ให้บริการ

ตัวเรนเดอร์ที่บันเดิลมาในปัจจุบัน:

| ช่องทาง         | เป้าหมายการเรนเดอร์แบบเนทีฟ                | หมายเหตุ                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components และ component containers | ยังคงรักษา `channelData.discord.components` แบบเดิมไว้สำหรับผู้สร้าง payload แบบเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation` |
| Slack           | Block Kit                           | ยังคงรักษา `channelData.slack.blocks` แบบเดิมไว้สำหรับผู้สร้าง payload แบบเนทีฟของผู้ให้บริการที่มีอยู่ แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation`       |
| Telegram        | ข้อความพร้อม inline keyboards          | ปุ่ม/selects ต้องอาศัยความสามารถ inline button สำหรับพื้นผิวเป้าหมาย; มิฉะนั้นจะใช้ text fallback                                         |
| Mattermost      | ข้อความพร้อม interactive props         | บล็อกอื่นจะลดระดับไปเป็นข้อความ                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | ข้อความ `message` แบบธรรมดาจะถูกรวมไปกับการ์ดเมื่อมีการส่งทั้งสองอย่างพร้อมกัน                                                                            |
| Feishu          | Interactive cards                   | ส่วนหัวของการ์ดสามารถใช้ `title`; เนื้อหาหลีกเลี่ยงการทำซ้ำชื่อดังกล่าว                                                                                  |
| ช่องทางแบบ plain  | Text fallback                       | ช่องทางที่ไม่มี renderer ก็ยังได้เอาต์พุตที่อ่านได้                                                                                            |

ความเข้ากันได้กับ payload แบบเนทีฟของผู้ให้บริการเป็นเพียงตัวช่วยช่วงเปลี่ยนผ่านสำหรับ
ผู้สร้าง reply ที่มีอยู่แล้ว ไม่ใช่เหตุผลที่จะเพิ่มฟิลด์แบบเนทีฟใหม่ในพื้นผิวที่ใช้ร่วมกัน

## Presentation เทียบกับ InteractiveReply

`InteractiveReply` คือ subset ภายในแบบเดิมที่ใช้โดย approval และ interaction
helpers รองรับ:

- text
- buttons
- selects

`MessagePresentation` คือสัญญา canonical สำหรับการส่งแบบใช้ร่วมกัน มันเพิ่ม:

- title
- tone
- context
- divider
- ปุ่มแบบ URL-only
- delivery metadata แบบทั่วไปผ่าน `ReplyPayload.delivery`

ใช้ helpers จาก `openclaw/plugin-sdk/interactive-runtime` เมื่อต้อง bridge โค้ดเก่า:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

โค้ดใหม่ควรรับหรือสร้าง `MessagePresentation` โดยตรง

## Delivery Pin

การ pin เป็นพฤติกรรมการส่ง ไม่ใช่การนำเสนอ ใช้ `delivery.pin` แทน
ฟิลด์แบบเนทีฟของผู้ให้บริการ เช่น `channelData.telegram.pin`

ความหมาย:

- `pin: true` จะ pin ข้อความแรกที่ส่งสำเร็จ
- `pin.notify` มีค่าเริ่มต้นเป็น `false`
- `pin.required` มีค่าเริ่มต้นเป็น `false`
- ความล้มเหลวของการ pin แบบไม่บังคับจะลดระดับและปล่อยให้ข้อความที่ส่งแล้วยังคงอยู่
- ความล้มเหลวของการ pin แบบ required จะทำให้การส่งล้มเหลว
- ข้อความที่ถูกแบ่งเป็นหลาย chunk จะ pin chunk แรกที่ถูกส่ง ไม่ใช่ chunk สุดท้าย

การดำเนินการข้อความ `pin`, `unpin` และ `pins` แบบ manual ยังคงมีอยู่สำหรับ
ข้อความที่มีอยู่แล้วในจุดที่ผู้ให้บริการรองรับการดำเนินการเหล่านั้น

## เช็กลิสต์สำหรับผู้เขียน Plugin

- ประกาศ `presentation` จาก `describeMessageTool(...)` เมื่อช่องทางสามารถ
  เรนเดอร์หรือ degrade semantic presentation ได้อย่างปลอดภัย
- เพิ่ม `presentationCapabilities` ลงใน runtime outbound adapter
- implement `renderPresentation` ใน runtime code ไม่ใช่ใน
  control-plane plugin setup code
- อย่านำไลบรารี UI แบบเนทีฟเข้าไปไว้ในเส้นทาง hot setup/catalog
- คงข้อจำกัดของแพลตฟอร์มไว้ใน renderer และการทดสอบ
- เพิ่มการทดสอบ fallback สำหรับปุ่มที่ไม่รองรับ, selects, URL buttons, การซ้ำซ้อนของ title/text
  และการส่งแบบผสม `message` กับ `presentation`
- เพิ่มการรองรับ delivery pin ผ่าน `deliveryCapabilities.pin` และ
  `pinDeliveredMessage` เฉพาะเมื่อผู้ให้บริการสามารถ pin message id ที่ส่งแล้วได้
- อย่าเปิดเผยฟิลด์ card/block/component/button แบบเนทีฟใหม่ของผู้ให้บริการผ่าน
  สคีมา shared message action

## เอกสารที่เกี่ยวข้อง

- [Message CLI](/cli/message)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture#message-tool-schemas)
- [แผนรีแฟกเตอร์การนำเสนอของช่องทาง](/th/plan/ui-channels)
