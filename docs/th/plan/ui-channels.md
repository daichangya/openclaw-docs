---
read_when:
    - กำลังรีแฟกเตอร์ UI ข้อความของช่องทาง เพย์โหลดแบบโต้ตอบ หรือตัวเรนเดอร์แบบเนทีฟของช่องทาง
    - กำลังเปลี่ยนความสามารถของเครื่องมือ message, delivery hints หรือ markers ข้ามบริบท平台总代理 to=functions.read մեկնաբանություն ＿奇米影视  彩神争霸邀请码json  天天中彩票是不是{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}
    - กำลังดีบักการกระจายการ import ของ Discord Carbon หรือ lazy runtime ของ Plugin ช่องทาง
summary: แยกการนำเสนอข้อความเชิงความหมายออกจากตัวเรนเดอร์ UI แบบเนทีฟของแต่ละช่องทาง
title: แผนรีแฟกเตอร์การนำเสนอของช่องทาง
x-i18n:
    generated_at: "2026-04-23T05:43:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# แผนรีแฟกเตอร์การนำเสนอของช่องทาง

## สถานะ

มีการใช้งานแล้วสำหรับพื้นผิว shared agent, CLI, ความสามารถของ Plugin และการส่งขาออก:

- `ReplyPayload.presentation` ใช้เก็บ UI ข้อความเชิงความหมาย
- `ReplyPayload.delivery.pin` ใช้เก็บคำขอ pin ข้อความที่ส่งแล้ว
- การดำเนินการข้อความแบบใช้ร่วมกันเปิดให้ใช้ `presentation`, `delivery` และ `pin` แทน `components`, `blocks`, `buttons` หรือ `card` แบบเนทีฟของผู้ให้บริการ
- แกนหลักทำการเรนเดอร์หรือ auto-degrade การนำเสนอผ่านความสามารถขาออกที่ประกาศโดย Plugin
- ตัวเรนเดอร์ของ Discord, Slack, Telegram, Mattermost, Microsoft Teams และ Feishu ใช้สัญญาแบบทั่วไปนี้
- โค้ด control-plane ของช่องทาง Discord ไม่ import คอนเทนเนอร์ UI ที่ขับเคลื่อนด้วย Carbon อีกต่อไป

เอกสาร canonical ตอนนี้อยู่ที่ [Message Presentation](/th/plugins/message-presentation)
ให้เก็บแผนนี้ไว้เป็นบริบททางประวัติศาสตร์ของการนำไปใช้; หากมีการเปลี่ยนแปลงสัญญา ตัวเรนเดอร์ หรือพฤติกรรม fallback ให้ปรับปรุงคู่มือ canonical

## ปัญหา

UI ของช่องทางตอนนี้แยกอยู่บนหลายพื้นผิวที่เข้ากันไม่ได้:

- แกนหลักเป็นเจ้าของ hook สำหรับตัวเรนเดอร์ข้ามบริบทที่มีรูปทรงแบบ Discord ผ่าน `buildCrossContextComponents`
- `channel.ts` ของ Discord สามารถ import UI เนทีฟผ่าน `DiscordUiContainer` ซึ่งดึง dependency ของ runtime UI เข้าสู่ control plane ของ Plugin ช่องทาง
- เอเจนต์และ CLI เปิดให้ใช้ช่องทางลัดสำหรับ payload แบบเนทีฟ เช่น `components` ของ Discord, `blocks` ของ Slack, `buttons` ของ Telegram หรือ Mattermost และ `card` ของ Teams หรือ Feishu
- `ReplyPayload.channelData` มีทั้ง transport hints และ native UI envelopes
- โมเดล `interactive` แบบทั่วไปมีอยู่จริง แต่แคบกว่ารูปแบบ layout ที่สมบูรณ์กว่าซึ่งใช้อยู่แล้วใน Discord, Slack, Teams, Feishu, LINE, Telegram และ Mattermost

สิ่งนี้ทำให้แกนหลักรับรู้รูปทรงของ UI แบบเนทีฟ ทำให้ runtime laziness ของ Plugin อ่อนลง และเปิดทางให้เอเจนต์มีวิธีแบบเฉพาะผู้ให้บริการมากเกินไปในการแสดงเจตนาของข้อความแบบเดียวกัน

## เป้าหมาย

- แกนหลักตัดสินใจการนำเสนอเชิงความหมายที่ดีที่สุดสำหรับข้อความจากความสามารถที่ประกาศไว้
- ส่วนขยายประกาศความสามารถและเรนเดอร์การนำเสนอเชิงความหมายไปเป็น transport payload แบบเนทีฟ
- Web Control UI ยังคงแยกออกจาก native UI ของแชต
- native channel payloads จะไม่ถูกเปิดเผยผ่านพื้นผิวข้อความของ shared agent หรือ CLI
- ฟีเจอร์การนำเสนอที่ไม่รองรับจะ auto-degrade ไปเป็นตัวแทนแบบข้อความที่ดีที่สุด
- พฤติกรรมการส่ง เช่น การ pin ข้อความที่ส่งแล้ว เป็น metadata การส่งแบบทั่วไป ไม่ใช่การนำเสนอ

## สิ่งที่ไม่อยู่ในขอบเขต

- ไม่มี backward compatibility shim สำหรับ `buildCrossContextComponents`
- ไม่มี native escape hatches สาธารณะสำหรับ `components`, `blocks`, `buttons` หรือ `card`
- ไม่มี core imports ของไลบรารี UI แบบเนทีฟของช่องทาง
- ไม่มี provider-specific SDK seams สำหรับช่องทางที่บันเดิลมา

## โมเดลเป้าหมาย

เพิ่มฟิลด์ `presentation` ที่แกนหลักเป็นเจ้าของลงใน `ReplyPayload`

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

ระหว่างการย้าย `interactive` จะกลายเป็น subset ของ `presentation`:

- บล็อกข้อความของ `interactive` แมปไปที่ `presentation.blocks[].type = "text"`
- บล็อกปุ่มของ `interactive` แมปไปที่ `presentation.blocks[].type = "buttons"`
- บล็อก select ของ `interactive` แมปไปที่ `presentation.blocks[].type = "select"`

สคีมาภายนอกของเอเจนต์และ CLI ใช้ `presentation` แล้ว; `interactive` ยังคงอยู่เป็น internal legacy parser/rendering helper สำหรับผู้สร้าง reply เดิมที่ยังมีอยู่

## Delivery Metadata

เพิ่มฟิลด์ `delivery` ที่แกนหลักเป็นเจ้าของสำหรับพฤติกรรมการส่งที่ไม่ใช่ UI

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

- `delivery.pin = true` หมายถึง pin ข้อความแรกที่ส่งสำเร็จ
- `notify` มีค่าเริ่มต้นเป็น `false`
- `required` มีค่าเริ่มต้นเป็น `false`; ช่องทางที่ไม่รองรับหรือการ pin ที่ล้มเหลวจะ auto-degrade โดยยังคงส่งข้อความต่อไป
- การดำเนินการข้อความ `pin`, `unpin` และ `list-pins` แบบ manual ยังคงมีอยู่สำหรับข้อความที่มีอยู่แล้ว

การ bind หัวข้อ ACP ของ Telegram ในปัจจุบันควรถูกย้ายจาก `channelData.telegram.pin = true` ไปเป็น `delivery.pin = true`

## สัญญาความสามารถของ Runtime

เพิ่ม hooks สำหรับการเรนเดอร์ presentation และ delivery ลงใน runtime outbound adapter ไม่ใช่ใน control-plane channel plugin

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

พฤติกรรมของแกนหลัก:

- resolve ช่องทางเป้าหมายและ runtime adapter
- ขอความสามารถด้าน presentation
- degrade บล็อกที่ไม่รองรับก่อนการเรนเดอร์
- เรียก `renderPresentation`
- หากไม่มี renderer ให้แปลง presentation เป็น text fallback
- หลังจากส่งสำเร็จ ให้เรียก `pinDeliveredMessage` เมื่อมีการร้องขอ `delivery.pin` และช่องทางรองรับ

## การแมปตามช่องทาง

Discord:

- เรนเดอร์ `presentation` ไปเป็น components v2 และ Carbon containers ในโมดูลที่เป็น runtime-only
- คง helpers สำหรับ accent color ไว้ในโมดูลที่เบา
- ลบ imports ของ `DiscordUiContainer` ออกจากโค้ด control-plane ของ Plugin ช่องทาง

Slack:

- เรนเดอร์ `presentation` ไปเป็น Block Kit
- ลบอินพุต `blocks` ออกจากเอเจนต์และ CLI

Telegram:

- เรนเดอร์ text, context และ dividers เป็นข้อความ
- เรนเดอร์ actions และ select เป็น inline keyboards เมื่อกำหนดค่าไว้และอนุญาตสำหรับพื้นผิวเป้าหมาย
- ใช้ text fallback เมื่อปิด inline buttons
- ย้าย ACP topic pinning ไปที่ `delivery.pin`

Mattermost:

- เรนเดอร์ actions เป็น interactive buttons เมื่อกำหนดค่าไว้
- เรนเดอร์บล็อกอื่นเป็น text fallback

Microsoft Teams:

- เรนเดอร์ `presentation` ไปเป็น Adaptive Cards
- คงการดำเนินการ pin/unpin/list-pins แบบ manual
- อาจ implement `pinDeliveredMessage` หากรองรับ Graph อย่างเชื่อถือได้สำหรับบทสนทนาเป้าหมาย

Feishu:

- เรนเดอร์ `presentation` ไปเป็น interactive cards
- คงการดำเนินการ pin/unpin/list-pins แบบ manual
- อาจ implement `pinDeliveredMessage` สำหรับการ pin ข้อความที่ส่งแล้ว หากพฤติกรรมของ API เชื่อถือได้

LINE:

- เรนเดอร์ `presentation` ไปเป็น Flex หรือ template messages เมื่อทำได้
- fallback ไปเป็นข้อความสำหรับบล็อกที่ไม่รองรับ
- ลบ LINE UI payloads ออกจาก `channelData`

ช่องทางแบบ plain หรือมีข้อจำกัด:

- แปลง presentation เป็นข้อความด้วยการจัดรูปแบบแบบ conservative

## ขั้นตอนรีแฟกเตอร์

1. นำ release fix ของ Discord กลับมาใช้อีกครั้ง โดยแยก `ui-colors.ts` ออกจาก UI ที่ขับเคลื่อนด้วย Carbon และลบ `DiscordUiContainer` ออกจาก `extensions/discord/src/channel.ts`
2. เพิ่ม `presentation` และ `delivery` ลงใน `ReplyPayload`, outbound payload normalization, delivery summaries และ hook payloads
3. เพิ่มสคีมา `MessagePresentation` และ parser helpers ใน subpath ของ SDK/runtime ที่แคบ
4. แทนที่ความสามารถของ message อย่าง `buttons`, `cards`, `components` และ `blocks` ด้วย semantic presentation capabilities
5. เพิ่ม runtime outbound adapter hooks สำหรับการเรนเดอร์ presentation และการ pin ระดับ delivery
6. แทนที่การสร้าง cross-context components ด้วย `buildCrossContextPresentation`
7. ลบ `src/infra/outbound/channel-adapters.ts` และลบ `buildCrossContextComponents` ออกจากชนิดของ channel plugin
8. เปลี่ยน `maybeApplyCrossContextMarker` ให้แนบ `presentation` แทน native params
9. อัปเดตเส้นทางการส่งของ plugin-dispatch ให้ใช้เฉพาะ semantic presentation และ delivery metadata
10. ลบ native payload params ของเอเจนต์และ CLI: `components`, `blocks`, `buttons` และ `card`
11. ลบ SDK helpers ที่สร้างสคีมา message-tool แบบเนทีฟ แล้วแทนที่ด้วย presentation schema helpers
12. ลบ UI/native envelopes ออกจาก `channelData`; คงไว้เพียง transport metadata จนกว่าจะตรวจสอบแต่ละฟิลด์ที่เหลือ
13. ย้ายตัวเรนเดอร์ของ Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu และ LINE
14. อัปเดตเอกสารสำหรับ message CLI, หน้าของช่องทาง, Plugin SDK และ capability cookbook
15. รัน import fanout profiling สำหรับ Discord และ entrypoints ของช่องทางที่ได้รับผลกระทบ

ขั้นตอน 1-11 และ 13-14 ถูก implement แล้วในการรีแฟกเตอร์นี้สำหรับสัญญาของ shared agent, CLI, plugin capability และ outbound adapter ส่วนขั้นตอน 12 ยังเป็นงาน cleanup ภายในที่ลึกกว่าสำหรับ provider-private `channelData` transport envelopes ส่วนขั้นตอน 15 ยังเป็นงาน validation ติดตามผล หากเราต้องการตัวเลข import-fanout ที่วัดได้จริงนอกเหนือจาก type/test gate

## การทดสอบ

เพิ่มหรืออัปเดต:

- การทดสอบ normalization ของ presentation
- การทดสอบ auto-degrade ของ presentation สำหรับบล็อกที่ไม่รองรับ
- การทดสอบ cross-context marker สำหรับ plugin dispatch และเส้นทางการส่งของแกนหลัก
- การทดสอบ channel render matrix สำหรับ Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE และ text fallback
- การทดสอบสคีมาของ message tool เพื่อพิสูจน์ว่า native fields ถูกลบออกแล้ว
- การทดสอบ CLI เพื่อพิสูจน์ว่า native flags ถูกลบออกแล้ว
- regression เรื่อง import-laziness ของ Discord entrypoint ที่ครอบคลุม Carbon
- การทดสอบ delivery pin ที่ครอบคลุม Telegram และ generic fallback

## คำถามที่ยังเปิดอยู่

- ควร implement `delivery.pin` สำหรับ Discord, Slack, Microsoft Teams และ Feishu ตั้งแต่รอบแรก หรือเริ่มที่ Telegram เท่านั้น?
- ในอนาคต `delivery` ควรดูดซับฟิลด์ที่มีอยู่แล้ว เช่น `replyToId`, `replyToCurrent`, `silent` และ `audioAsVoice` หรือควรโฟกัสเฉพาะพฤติกรรมหลังการส่ง?
- presentation ควรรองรับ images หรือ file references โดยตรงหรือไม่ หรือควรให้ media ยังคงแยกจาก layout UI ไปก่อนในตอนนี้?
