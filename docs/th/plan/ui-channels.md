---
read_when:
    - กำลังรีแฟกเตอร์ UI ข้อความของช่องทาง เพย์โหลดแบบโต้ตอบ หรือเรนเดอร์เนทีฟของช่องทาง
    - กำลังเปลี่ยนความสามารถของเครื่องมือข้อความ คำใบ้การจัดส่ง หรือเครื่องหมายข้ามบริบท
    - กำลังดีบักการกระจายการนำเข้า Carbon ของ Discord หรือความ lazy ของรันไทม์ channel plugin
summary: แยกการนำเสนอข้อความเชิงความหมายออกจากตัวเรนเดอร์ UI แบบเนทีฟของช่องทาง
title: แผนรีแฟกเตอร์การนำเสนอของช่องทาง
x-i18n:
    generated_at: "2026-04-24T09:20:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## สถานะ

ได้ทำเสร็จแล้วสำหรับพื้นผิวของ shared agent, CLI, ความสามารถของ Plugin และการส่งขาออก:

- `ReplyPayload.presentation` ใช้เก็บ UI ข้อความเชิงความหมาย
- `ReplyPayload.delivery.pin` ใช้เก็บคำขอปักหมุดข้อความที่ส่งแล้ว
- การกระทำข้อความแบบ shared ตอนนี้เปิดเผย `presentation`, `delivery` และ `pin` แทน `components`, `blocks`, `buttons` หรือ `card` แบบเนทีฟของผู้ให้บริการ
- Core จะเรนเดอร์หรือ auto-degrade presentation ผ่านความสามารถขาออกที่ประกาศโดย Plugin
- เรนเดอร์ของ Discord, Slack, Telegram, Mattermost, MS Teams และ Feishu ใช้ generic contract นี้
- โค้ด control-plane ของช่องทาง Discord ไม่ได้นำเข้า container UI ที่อิง Carbon อีกต่อไป

เอกสาร canonical ตอนนี้อยู่ที่ [Message Presentation](/th/plugins/message-presentation)
ให้เก็บแผนนี้ไว้เป็นบริบทการติดตั้งใช้งานทางประวัติศาสตร์; หากมีการเปลี่ยนแปลงใน contract, renderer หรือพฤติกรรม fallback ให้ปรับปรุงคู่มือ canonical แทน

## ปัญหา

ปัจจุบัน UI ของช่องทางถูกแยกกระจายอยู่บนพื้นผิวที่เข้ากันไม่ได้หลายแบบ:

- Core เป็นเจ้าของ hook renderer ข้ามบริบทที่มีลักษณะเหมือน Discord ผ่าน `buildCrossContextComponents`
- `channel.ts` ของ Discord สามารถนำเข้า UI เนทีฟผ่าน `DiscordUiContainer` ซึ่งดึง dependency ของ UI runtime เข้าไปใน control plane ของ channel plugin
- agent และ CLI เปิดเผย escape hatch ของ payload แบบเนทีฟ เช่น `components` ของ Discord, `blocks` ของ Slack, `buttons` ของ Telegram หรือ Mattermost และ `card` ของ Teams หรือ Feishu
- `ReplyPayload.channelData` เก็บทั้งคำใบ้การขนส่งและ native UI envelopes
- โมเดล `interactive` แบบ generic มีอยู่แล้ว แต่แคบกว่ารูปแบบที่สมบูรณ์กว่าซึ่งใช้อยู่แล้วใน Discord, Slack, Teams, Feishu, LINE, Telegram และ Mattermost

สิ่งนี้ทำให้ core รับรู้รูปร่าง UI แบบเนทีฟ ทำให้ runtime laziness ของ Plugin อ่อนลง และเปิดทางให้ agents มีวิธีเฉพาะผู้ให้บริการมากเกินไปในการแสดงเจตนาข้อความแบบเดียวกัน

## เป้าหมาย

- Core ตัดสินใจเลือกการนำเสนอเชิงความหมายที่ดีที่สุดสำหรับข้อความจากความสามารถที่ประกาศไว้
- Extensions ประกาศความสามารถและเรนเดอร์การนำเสนอเชิงความหมายไปเป็น payload การขนส่งแบบเนทีฟ
- Web Control UI ยังคงแยกจาก chat native UI
- ไม่เปิดเผย native channel payloads ผ่านพื้นผิวข้อความแบบ shared ของ agent หรือ CLI
- ฟีเจอร์ presentation ที่ไม่รองรับจะ auto-degrade ไปเป็นตัวแทนข้อความที่ดีที่สุด
- พฤติกรรมการส่งอย่างการปักหมุดข้อความที่ส่งแล้วเป็นเมทาดาทาการส่งแบบ generic ไม่ใช่ presentation

## สิ่งที่ไม่ใช่เป้าหมาย

- ไม่มี backward compatibility shim สำหรับ `buildCrossContextComponents`
- ไม่มี native escape hatch สาธารณะสำหรับ `components`, `blocks`, `buttons` หรือ `card`
- ไม่มีการนำเข้าไลบรารี UI แบบเนทีฟของช่องทางจาก core
- ไม่มี SDK seams เฉพาะผู้ให้บริการสำหรับช่องทางแบบ bundled

## โมเดลเป้าหมาย

เพิ่มฟิลด์ `presentation` ที่ core เป็นเจ้าของลงใน `ReplyPayload`

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` จะกลายเป็นส่วนย่อยของ `presentation` ระหว่างการย้าย:

- บล็อกข้อความของ `interactive` แมปไปยัง `presentation.blocks[].type = "text"`
- บล็อกปุ่มของ `interactive` แมปไปยัง `presentation.blocks[].type = "buttons"`
- บล็อก select ของ `interactive` แมปไปยัง `presentation.blocks[].type = "select"`

schema ภายนอกของ agent และ CLI ตอนนี้ใช้ `presentation`; `interactive` ยังคงอยู่ในฐานะตัวช่วย parser/rendering แบบ legacy ภายในสำหรับผู้สร้าง reply ที่มีอยู่เดิม

## เมทาดาทาการจัดส่ง

เพิ่มฟิลด์ `delivery` ที่ core เป็นเจ้าของสำหรับพฤติกรรมการส่งที่ไม่ใช่ UI

```ts
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

ความหมาย:

- `delivery.pin = true` หมายถึงปักหมุดข้อความแรกที่ส่งสำเร็จ
- `notify` มีค่าเริ่มต้นเป็น `false`
- `required` มีค่าเริ่มต้นเป็น `false`; ช่องทางที่ไม่รองรับหรือการปักหมุดที่ล้มเหลวจะ auto-degrade โดยส่งต่อไปตามปกติ
- การกระทำข้อความ `pin`, `unpin` และ `list-pins` แบบ manual ยังคงอยู่สำหรับข้อความที่มีอยู่แล้ว

ปัจจุบันการผูก ACP topic ของ Telegram ควรย้ายจาก `channelData.telegram.pin = true` ไปเป็น `delivery.pin = true`

## Runtime Capability Contract

เพิ่ม hook สำหรับการเรนเดอร์ presentation และการจัดส่งลงใน runtime outbound adapter ไม่ใช่ control-plane channel plugin

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

พฤติกรรมของ core:

- resolve ช่องทางเป้าหมายและ runtime adapter
- ขอ presentation capabilities
- degrade บล็อกที่ไม่รองรับก่อนการเรนเดอร์
- เรียก `renderPresentation`
- หากไม่มี renderer ให้แปลง presentation เป็น text fallback
- หลังจากส่งสำเร็จ ให้เรียก `pinDeliveredMessage` เมื่อมีการร้องขอ `delivery.pin` และช่องทางรองรับ

## การแมปช่องทาง

Discord:

- เรนเดอร์ `presentation` เป็น components v2 และ Carbon containers ในโมดูลที่เป็น runtime-only
- เก็บ helper สำหรับ accent color ไว้ในโมดูลที่มีน้ำหนักเบา
- เอาการนำเข้า `DiscordUiContainer` ออกจากโค้ด control-plane ของ channel plugin

Slack:

- เรนเดอร์ `presentation` เป็น Block Kit
- เอาอินพุต `blocks` ของ agent และ CLI ออก

Telegram:

- เรนเดอร์ text, context และ divider เป็นข้อความ
- เรนเดอร์ actions และ select เป็น inline keyboards เมื่อกำหนดค่าและอนุญาตสำหรับพื้นผิวเป้าหมาย
- ใช้ text fallback เมื่อปิดใช้งาน inline buttons
- ย้าย ACP topic pinning ไปที่ `delivery.pin`

Mattermost:

- เรนเดอร์ actions เป็น interactive buttons เมื่อกำหนดค่าไว้
- เรนเดอร์บล็อกอื่นเป็น text fallback

MS Teams:

- เรนเดอร์ `presentation` เป็น Adaptive Cards
- คงการกระทำ pin/unpin/list-pins แบบ manual
- อาจติดตั้งใช้ `pinDeliveredMessage` หาก Graph รองรับได้อย่างเชื่อถือได้สำหรับบทสนทนาเป้าหมาย

Feishu:

- เรนเดอร์ `presentation` เป็น interactive cards
- คงการกระทำ pin/unpin/list-pins แบบ manual
- อาจติดตั้งใช้ `pinDeliveredMessage` สำหรับการปักหมุดข้อความที่ส่งแล้ว หากพฤติกรรมของ API เชื่อถือได้

LINE:

- เรนเดอร์ `presentation` เป็น Flex หรือ template messages เมื่อทำได้
- fallback เป็นข้อความสำหรับบล็อกที่ไม่รองรับ
- เอา LINE UI payloads ออกจาก `channelData`

ช่องทางแบบ plain หรือจำกัด:

- แปลง presentation เป็นข้อความด้วยการจัดรูปแบบแบบอนุรักษ์นิยม

## ขั้นตอนรีแฟกเตอร์

1. นำ fix สำหรับรีลีสของ Discord กลับมาใช้ใหม่ โดยแยก `ui-colors.ts` ออกจาก UI ที่อิง Carbon และเอา `DiscordUiContainer` ออกจาก `extensions/discord/src/channel.ts`
2. เพิ่ม `presentation` และ `delivery` ลงใน `ReplyPayload`, outbound payload normalization, delivery summaries และ hook payloads
3. เพิ่ม schema และ parser helpers ของ `MessagePresentation` ใน subpath ของ SDK/runtime ที่แคบ
4. แทนที่ความสามารถข้อความ `buttons`, `cards`, `components` และ `blocks` ด้วย semantic presentation capabilities
5. เพิ่ม runtime outbound adapter hooks สำหรับการเรนเดอร์ presentation และการปักหมุดการส่ง
6. แทนที่การสร้าง cross-context component ด้วย `buildCrossContextPresentation`
7. ลบ `src/infra/outbound/channel-adapters.ts` และเอา `buildCrossContextComponents` ออกจากชนิดของ channel plugin
8. เปลี่ยน `maybeApplyCrossContextMarker` ให้แนบ `presentation` แทน native params
9. อัปเดตเส้นทางส่งของ plugin-dispatch ให้ใช้เฉพาะ semantic presentation และ delivery metadata
10. เอา native payload params ของ agent และ CLI ออก: `components`, `blocks`, `buttons` และ `card`
11. เอา SDK helpers ที่สร้าง schema ของ message-tool แบบเนทีฟออก โดยแทนที่ด้วย presentation schema helpers
12. เอา envelopes แบบ UI/native ออกจาก `channelData`; คงไว้เฉพาะ transport metadata จนกว่าจะมีการทบทวนแต่ละฟิลด์ที่เหลือ
13. ย้าย renderer ของ Discord, Slack, Telegram, Mattermost, MS Teams, Feishu และ LINE
14. อัปเดตเอกสารสำหรับ message CLI, หน้าช่องทาง, plugin SDK และ cookbook ของ capability
15. รัน import fanout profiling สำหรับ Discord และ affected channel entrypoints

ขั้นตอน 1-11 และ 13-14 ถูกติดตั้งใช้งานแล้วในรีแฟกเตอร์นี้สำหรับ shared agent, CLI, plugin capability และ outbound adapter contracts ขั้นตอน 12 ยังเป็นงาน cleanup ภายในที่ลึกกว่าสำหรับ `channelData` transport envelopes แบบ provider-private ขั้นตอน 15 ยังเป็นการตรวจสอบต่อเนื่อง หากเราต้องการตัวเลข import-fanout เชิงปริมาณนอกเหนือจากเกตประเภท/การทดสอบ

## การทดสอบ

เพิ่มหรืออัปเดต:

- การทดสอบ normalization ของ presentation
- การทดสอบ auto-degrade ของ presentation สำหรับบล็อกที่ไม่รองรับ
- การทดสอบ cross-context marker สำหรับเส้นทาง plugin dispatch และ core delivery
- การทดสอบ render matrix ของช่องทางสำหรับ Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE และ text fallback
- การทดสอบ schema ของ message tool เพื่อพิสูจน์ว่าไม่มีฟิลด์แบบเนทีฟแล้ว
- การทดสอบ CLI เพื่อพิสูจน์ว่าไม่มีแฟล็กแบบเนทีฟแล้ว
- regression ของ import-laziness ที่ entrypoint ของ Discord ครอบคลุม Carbon
- การทดสอบ delivery pin สำหรับ Telegram และ generic fallback

## คำถามที่ยังเปิดอยู่

- ควรติดตั้งใช้ `delivery.pin` สำหรับ Discord, Slack, MS Teams และ Feishu ในรอบแรกเลยหรือไม่ หรือควรเริ่มจาก Telegram อย่างเดียวก่อน?
- ในอนาคต `delivery` ควรดูดซับฟิลด์ที่มีอยู่แล้ว เช่น `replyToId`, `replyToCurrent`, `silent` และ `audioAsVoice` ด้วยหรือไม่ หรือควรคงขอบเขตไว้เฉพาะพฤติกรรมหลังการส่ง?
- presentation ควรรองรับรูปภาพหรือ file references โดยตรงหรือไม่ หรือสื่อควรยังคงแยกจาก layout ของ UI ไปก่อนในตอนนี้?

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels)
- [Message presentation](/th/plugins/message-presentation)
