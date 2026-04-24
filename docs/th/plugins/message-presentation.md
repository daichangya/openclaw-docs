---
read_when:
    - การเพิ่มหรือแก้ไขการเรนเดอร์การ์ดข้อความ ปุ่ม หรือเมนูเลือก
    - การสร้างปลั๊กอินช่องทางส่งข้อความที่รองรับข้อความขาออกแบบริช
    - การเปลี่ยนการแสดงผลของเครื่องมือข้อความหรือความสามารถด้านการส่งมอบ
    - การดีบักรีเกรสชันของการเรนเดอร์การ์ด/บล็อก/คอมโพเนนต์เฉพาะผู้ให้บริการ
summary: การ์ดข้อความเชิงความหมาย ปุ่ม เมนูเลือก ข้อความสำรอง และคำใบ้การส่งสำหรับปลั๊กอินช่องทางส่งข้อความ
title: การแสดงผลข้อความ
x-i18n:
    generated_at: "2026-04-24T09:23:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

การแสดงผลข้อความคือสัญญาร่วมของ OpenClaw สำหรับ UI แชตขาออกแบบริช
โดยช่วยให้เอเจนต์ คำสั่ง CLI โฟลว์การอนุมัติ และปลั๊กอิน สามารถอธิบายเจตนาของข้อความ
เพียงครั้งเดียว ขณะที่ปลั๊กอินของแต่ละช่องทางส่งข้อความเรนเดอร์เป็นรูปแบบเนทีฟที่ดีที่สุดเท่าที่ทำได้

ใช้ presentation สำหรับ UI ข้อความแบบพกพา:

- ส่วนข้อความ
- ข้อความบริบท/ส่วนท้ายขนาดเล็ก
- ตัวคั่น
- ปุ่ม
- เมนูเลือก
- ชื่อการ์ดและโทน

อย่าเพิ่มฟิลด์แบบเนทีฟของผู้ให้บริการใหม่ เช่น Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` หรือ Feishu `card` ลงในเครื่องมือข้อความแบบใช้ร่วมกัน ฟิลด์เหล่านั้นเป็นผลลัพธ์ของตัวเรนเดอร์ที่ปลั๊กอินช่องทางส่งข้อความเป็นผู้ดูแล

## สัญญา

ผู้เขียนปลั๊กอินนำเข้าสัญญาสาธารณะจาก:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

โครงสร้าง:

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

- `value` คือค่า action ระดับแอปพลิเคชันที่ถูกส่งกลับผ่านเส้นทาง interaction
  เดิมของช่องทางนั้น เมื่อช่องทางรองรับคอนโทรลที่คลิกได้
- `url` คือปุ่มลิงก์ ซึ่งสามารถมีได้โดยไม่ต้องมี `value`
- `label` เป็นฟิลด์บังคับ และยังถูกใช้ในข้อความ fallback ด้วย
- `style` เป็นข้อมูลเชิงแนะนำ ตัวเรนเดอร์ควรแมปสไตล์ที่ไม่รองรับไปเป็นค่าเริ่มต้นที่ปลอดภัย แทนที่จะทำให้การส่งล้มเหลว

ความหมายของเมนูเลือก:

- `options[].value` คือค่าระดับแอปพลิเคชันที่ถูกเลือก
- `placeholder` เป็นข้อมูลเชิงแนะนำ และอาจถูกละเลยโดยช่องทางที่ไม่รองรับเมนูเลือกแบบเนทีฟ
- หากช่องทางไม่รองรับเมนูเลือก ข้อความ fallback จะแสดงรายการ labels

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

ปุ่มลิงก์แบบ URL อย่างเดียว:

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

เมนูเลือก:

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

การส่งแบบปักหมุด:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

การส่งแบบปักหมุดพร้อม JSON แบบระบุชัดเจน:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## สัญญาของตัวเรนเดอร์

ปลั๊กอินช่องทางส่งข้อความประกาศการรองรับการเรนเดอร์บน outbound adapter:

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

ฟิลด์ความสามารถถูกออกแบบให้เป็น boolean แบบเรียบง่ายโดยตั้งใจ ฟิลด์เหล่านี้อธิบายว่า
ตัวเรนเดอร์สามารถทำให้องค์ประกอบใดโต้ตอบได้ ไม่ใช่ข้อจำกัดทั้งหมดของแพลตฟอร์มเนทีฟ
ตัวเรนเดอร์ยังคงเป็นผู้รับผิดชอบข้อจำกัดเฉพาะแพลตฟอร์ม เช่น จำนวนปุ่มสูงสุด จำนวนบล็อก และขนาดการ์ด

## ลำดับการเรนเดอร์ในแกนหลัก

เมื่อ `ReplyPayload` หรือ action ของข้อความมี `presentation` แกนหลักจะ:

1. ทำ normalization ให้กับ payload ของ presentation
2. resolve outbound adapter ของช่องทางเป้าหมาย
3. อ่าน `presentationCapabilities`
4. เรียก `renderPresentation` เมื่อตัว adapter สามารถเรนเดอร์ payload ได้
5. fallback ไปเป็นข้อความแบบอนุรักษ์นิยมเมื่อไม่มี adapter หรือไม่สามารถเรนเดอร์ได้
6. ส่ง payload ที่ได้ผ่านเส้นทางการส่งของช่องทางตามปกติ
7. ใช้ข้อมูลเมตาการส่ง เช่น `delivery.pin` หลังจากส่งข้อความแรกสำเร็จ

แกนหลักเป็นผู้ดูแลพฤติกรรม fallback เพื่อให้ฝั่งผู้สร้างสามารถไม่ผูกกับช่องทางใดช่องทางหนึ่ง
ส่วนปลั๊กอินช่องทางส่งข้อความเป็นผู้ดูแลการเรนเดอร์แบบเนทีฟและการจัดการ interaction

## กฎการลดระดับ

presentation ต้องปลอดภัยต่อการส่งบนช่องทางที่มีความสามารถจำกัด

ข้อความ fallback ประกอบด้วย:

- `title` เป็นบรรทัดแรก
- บล็อก `text` เป็นย่อหน้าปกติ
- บล็อก `context` เป็นบรรทัดบริบทแบบกระชับ
- บล็อก `divider` เป็นตัวคั่นแบบมองเห็นได้
- labels ของปุ่ม รวมถึง URL สำหรับปุ่มลิงก์
- labels ของตัวเลือกในเมนูเลือก

คอนโทรลแบบเนทีฟที่ไม่รองรับควรถูกลดระดับแทนที่จะทำให้การส่งทั้งหมดล้มเหลว
ตัวอย่าง:

- Telegram ที่ปิดปุ่ม inline จะส่งข้อความ fallback
- ช่องทางที่ไม่รองรับเมนูเลือกจะแสดงรายการตัวเลือกเป็นข้อความ
- ปุ่มแบบ URL อย่างเดียวจะกลายเป็นปุ่มลิงก์แบบเนทีฟหรือบรรทัด URL แบบ fallback
- ความล้มเหลวของการปักหมุดแบบไม่บังคับจะไม่ทำให้ข้อความที่ส่งแล้วล้มเหลว

ข้อยกเว้นหลักคือ `delivery.pin.required: true`; หากมีการร้องขอให้ปักหมุดเป็นข้อบังคับ
และช่องทางไม่สามารถปักหมุดข้อความที่ส่งได้ การส่งจะรายงานว่าล้มเหลว

## การแมปผู้ให้บริการ

ตัวเรนเดอร์แบบ bundled ในปัจจุบัน:

| ช่องทาง | เป้าหมายการเรนเดอร์แบบเนทีฟ | หมายเหตุ |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord | Components และ component containers | คง `channelData.discord.components` แบบเดิมไว้สำหรับผู้สร้าง payload แบบเนทีฟของผู้ให้บริการที่มีอยู่แล้ว แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation` |
| Slack | Block Kit | คง `channelData.slack.blocks` แบบเดิมไว้สำหรับผู้สร้าง payload แบบเนทีฟของผู้ให้บริการที่มีอยู่แล้ว แต่การส่งแบบใช้ร่วมกันใหม่ควรใช้ `presentation` |
| Telegram | ข้อความพร้อม inline keyboards | ปุ่ม/เมนูเลือกต้องอาศัยความสามารถของปุ่ม inline บนพื้นผิวเป้าหมาย มิฉะนั้นจะใช้ข้อความ fallback |
| Mattermost | ข้อความพร้อม interactive props | บล็อกชนิดอื่นจะลดระดับเป็นข้อความ |
| Microsoft Teams | Adaptive Cards | ข้อความ `message` แบบ plain จะถูกรวมไปกับการ์ดเมื่อมีการระบุทั้งสองอย่าง |
| Feishu | การ์ดโต้ตอบได้ | ส่วนหัวการ์ดสามารถใช้ `title` ได้; เนื้อหาไม่ทำซ้ำชื่อนั้น |
| ช่องทางแบบ plain | ข้อความ fallback | ช่องทางที่ไม่มีตัวเรนเดอร์ก็ยังคงได้ผลลัพธ์ที่อ่านรู้เรื่อง |

ความเข้ากันได้กับ payload แบบเนทีฟของผู้ให้บริการเป็นเพียงความสะดวกในช่วงเปลี่ยนผ่านสำหรับ
ผู้สร้าง reply ที่มีอยู่เดิม ไม่ใช่เหตุผลสำหรับการเพิ่มฟิลด์แบบเนทีฟใหม่ลงในสคีมาร่วม

## Presentation เทียบกับ InteractiveReply

`InteractiveReply` คือชุดย่อยภายในรุ่นเก่าที่ใช้โดยตัวช่วยสำหรับการอนุมัติและ interaction
โดยรองรับ:

- ข้อความ
- ปุ่ม
- เมนูเลือก

`MessagePresentation` คือสัญญาการส่งร่วมหลักที่ใช้จริง โดยเพิ่มสิ่งต่อไปนี้:

- ชื่อ
- โทน
- บริบท
- ตัวคั่น
- ปุ่มแบบ URL อย่างเดียว
- ข้อมูลเมตาการส่งแบบทั่วไปผ่าน `ReplyPayload.delivery`

ใช้ helper จาก `openclaw/plugin-sdk/interactive-runtime` เมื่อต้องเชื่อมโค้ดรุ่นเก่า:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

โค้ดใหม่ควรรับหรือสร้าง `MessagePresentation` โดยตรง

## การปักหมุดการส่ง

การปักหมุดเป็นพฤติกรรมการส่ง ไม่ใช่ presentation ให้ใช้ `delivery.pin` แทน
ฟิลด์แบบเนทีฟของผู้ให้บริการ เช่น `channelData.telegram.pin`

ความหมาย:

- `pin: true` จะปักหมุดข้อความแรกที่ส่งสำเร็จ
- ค่าเริ่มต้นของ `pin.notify` คือ `false`
- ค่าเริ่มต้นของ `pin.required` คือ `false`
- ความล้มเหลวของการปักหมุดแบบไม่บังคับจะลดระดับและคงข้อความที่ส่งไว้
- ความล้มเหลวของการปักหมุดแบบบังคับจะทำให้การส่งล้มเหลว
- ข้อความแบบ chunked จะปักหมุด chunk แรกที่ถูกส่ง ไม่ใช่ chunk ท้ายสุด

action ของข้อความแบบ `pin`, `unpin` และ `pins` ด้วยตนเองยังคงมีอยู่
สำหรับข้อความเดิมที่ผู้ให้บริการรองรับการกระทำเหล่านั้น

## เช็กลิสต์สำหรับผู้เขียนปลั๊กอิน

- ประกาศ `presentation` จาก `describeMessageTool(...)` เมื่อช่องทางสามารถ
  เรนเดอร์หรือสามารถลดระดับ presentation เชิงความหมายได้อย่างปลอดภัย
- เพิ่ม `presentationCapabilities` ไปยัง runtime outbound adapter
- ทำ `renderPresentation` ในโค้ด runtime ไม่ใช่ในโค้ดตั้งค่าปลั๊กอินฝั่ง control plane
- อย่านำไลบรารี UI แบบเนทีฟเข้าไปไว้ในเส้นทาง setup/catalog ที่ร้อน
- รักษาข้อจำกัดของแพลตฟอร์มไว้ในตัวเรนเดอร์และการทดสอบ
- เพิ่มการทดสอบ fallback สำหรับปุ่มที่ไม่รองรับ เมนูเลือก ปุ่ม URL การซ้ำกันของ title/text และการส่งแบบผสม `message` กับ `presentation`
- เพิ่มการรองรับการปักหมุดการส่งผ่าน `deliveryCapabilities.pin` และ
  `pinDeliveredMessage` เฉพาะเมื่อผู้ให้บริการสามารถปักหมุด message id ที่ส่งได้
- อย่าเปิดเผยฟิลด์การ์ด/บล็อก/คอมโพเนนต์/ปุ่มแบบเนทีฟใหม่ของผู้ให้บริการผ่านสคีมา action ของข้อความแบบใช้ร่วมกัน

## เอกสารที่เกี่ยวข้อง

- [Message CLI](/th/cli/message)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [สถาปัตยกรรมปลั๊กอิน](/th/plugins/architecture-internals#message-tool-schemas)
- [แผนรีแฟกเตอร์การแสดงผลของช่องทางส่งข้อความ](/th/plan/ui-channels)
