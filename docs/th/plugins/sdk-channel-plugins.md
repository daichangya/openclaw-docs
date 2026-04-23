---
read_when:
    - คุณกำลังสร้าง channel plugin สำหรับระบบส่งข้อความตัวใหม่
    - คุณต้องการเชื่อม OpenClaw เข้ากับแพลตฟอร์มส่งข้อความ
    - คุณต้องการทำความเข้าใจพื้นผิว adapter ของ ChannelPlugin
sidebarTitle: Channel Plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง channel plugin สำหรับระบบส่งข้อความของ OpenClaw
title: การสร้าง Channel Plugins
x-i18n:
    generated_at: "2026-04-23T05:47:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# การสร้าง Channel Plugins

คู่มือนี้จะพาคุณสร้าง channel plugin ที่เชื่อม OpenClaw เข้ากับ
แพลตฟอร์มส่งข้อความ เมื่อจบแล้วคุณจะมีช่องทางที่ใช้งานได้จริงพร้อมความปลอดภัยของ DM,
การจับคู่, การผูกเธรดคำตอบ และการส่งข้อความขาออก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน ให้เริ่มจาก
  [Getting Started](/th/plugins/building-plugins) ก่อน เพื่อดูโครงสร้าง package
  และการตั้งค่า manifest พื้นฐาน
</Info>

## วิธีการทำงานของ channel plugin

channel plugin ไม่จำเป็นต้องมี send/edit/react tool ของตัวเอง OpenClaw คงไว้เพียง
tool `message` ที่ใช้ร่วมกันใน core สิ่งที่ Plugin ของคุณเป็นเจ้าของคือ:

- **Config** — การ resolve บัญชีและ setup wizard
- **Security** — นโยบาย DM และ allowlist
- **Pairing** — โฟลว์อนุมัติ DM
- **Session grammar** — วิธีที่ conversation id แบบเฉพาะผู้ให้บริการแมปไปเป็น base chat, thread id และ fallback ของ parent
- **Outbound** — การส่งข้อความ สื่อ และโพลไปยังแพลตฟอร์ม
- **Threading** — วิธีที่คำตอบถูกผูกเป็นเธรด
- **Heartbeat typing** — สัญญาณ typing/busy แบบไม่บังคับสำหรับเป้าหมายการส่งมอบของ Heartbeat

core เป็นเจ้าของ message tool ที่ใช้ร่วมกัน การเชื่อม prompt, รูปร่างของ session key ภายนอก,
การเก็บสถานะ `:thread:` แบบทั่วไป และการ dispatch

หากช่องทางของคุณรองรับ typing indicator นอกเหนือจากการตอบกลับขาเข้า ให้เปิดเผย
`heartbeat.sendTyping(...)` บน channel plugin core จะเรียกมันด้วยเป้าหมายการส่งมอบของ Heartbeat ที่ resolve แล้วก่อนเริ่มการรันโมเดลของ Heartbeat และใช้วงจรการ keepalive/cleanup ของ typing ที่ใช้ร่วมกัน เพิ่ม `heartbeat.clearTyping(...)`
เมื่อแพลตฟอร์มต้องการสัญญาณหยุดแบบ explicit

หากช่องทางของคุณเพิ่มพารามิเตอร์ของ message-tool ที่มีแหล่งที่มาของสื่อ ให้เปิดเผยชื่อพารามิเตอร์เหล่านั้นผ่าน `describeMessageTool(...).mediaSourceParams` core ใช้รายการ explicit นี้สำหรับการ normalize พาธใน sandbox และนโยบายการเข้าถึงสื่อขาออก ดังนั้น Plugin จึงไม่ต้องมีกรณีพิเศษใน shared-core สำหรับพารามิเตอร์อย่าง avatar, attachment หรือ cover-image ที่เฉพาะผู้ให้บริการ
ควรส่งคืนเป็น map ที่มี action เป็นคีย์ เช่น
`{ "set-profile": ["avatarUrl", "avatarPath"] }` เพื่อไม่ให้ action ที่ไม่เกี่ยวข้องรับพารามิเตอร์สื่อของอีก action หนึ่งโดยไม่ตั้งใจ flat array ก็ยังใช้ได้สำหรับพารามิเตอร์ที่ตั้งใจให้ใช้ร่วมกันทุก action ที่เปิดเผย

หากแพลตฟอร์มของคุณเก็บ scope เพิ่มเติมไว้ภายใน conversation id ให้เก็บตรรกะการ parse นั้นไว้ใน Plugin ผ่าน `messaging.resolveSessionConversation(...)` นี่คือ hook มาตรฐานสำหรับการแมป `rawId` ไปเป็น base conversation id, thread id แบบไม่บังคับ, `baseConversationId` แบบ explicit และ `parentConversationCandidates`
หากคุณส่งคืน `parentConversationCandidates` ให้เรียงลำดับจาก parent ที่แคบที่สุดไปยัง conversation หลัก/กว้างที่สุด

bundled plugin ที่ต้องใช้การ parse แบบเดียวกันก่อนที่ registry ของช่องทางจะบูต
สามารถเปิดเผยไฟล์ระดับบนสุด `session-key-api.ts` พร้อม export
`resolveSessionConversation(...)` ที่ตรงกันได้เช่นกัน core จะใช้พื้นผิวที่ปลอดภัยต่อการ bootstrap นี้เฉพาะเมื่อยังไม่มี runtime plugin registry ให้ใช้

`messaging.resolveParentConversationCandidates(...)` ยังคงใช้ได้ในฐานะ fallback เพื่อความเข้ากันได้แบบ legacy เมื่อ Plugin ต้องการเพียง fallback ของ parent ที่ซ้อนอยู่เหนือ generic/raw id หากมีทั้งสอง hook core จะใช้
`resolveSessionConversation(...).parentConversationCandidates` ก่อน และจะ fallback ไปใช้ `resolveParentConversationCandidates(...)` ก็ต่อเมื่อ canonical hook ไม่ได้ส่งคืนข้อมูลดังกล่าว

## การอนุมัติและความสามารถของช่องทาง

channel plugin ส่วนใหญ่ไม่จำเป็นต้องมีโค้ดเฉพาะด้านการอนุมัติ

- core เป็นเจ้าของ `/approve` ในแชตเดียวกัน, payload ของปุ่มอนุมัติที่ใช้ร่วมกัน และการส่งมอบ fallback แบบทั่วไป
- ควรใช้ `approvalCapability` อ็อบเจ็กต์เดียวบน channel plugin เมื่อช่องทางต้องมีพฤติกรรมเฉพาะด้านการอนุมัติ
- `ChannelPlugin.approvals` ถูกถอดออกแล้ว ให้วางข้อเท็จจริงเกี่ยวกับการส่งมอบ/แบบ native/การเรนเดอร์/การยืนยันตัวตนของการอนุมัติไว้ที่ `approvalCapability`
- `plugin.auth` ใช้สำหรับ login/logout เท่านั้น; core จะไม่อ่าน hook ด้านการยืนยันตัวตนของการอนุมัติจากอ็อบเจ็กต์นั้นอีก
- `approvalCapability.authorizeActorAction` และ `approvalCapability.getActionAvailabilityState` คือ seam มาตรฐานสำหรับ auth ของการอนุมัติ
- ใช้ `approvalCapability.getActionAvailabilityState` สำหรับความพร้อมใช้งานด้าน auth ของการอนุมัติในแชตเดียวกัน
- หากช่องทางของคุณเปิดเผยการอนุมัติ exec แบบ native ให้ใช้ `approvalCapability.getExecInitiatingSurfaceState` สำหรับสถานะของ initiating-surface/native-client เมื่อมันแตกต่างจาก auth ของการอนุมัติในแชตเดียวกัน core ใช้ hook เฉพาะ exec นี้เพื่อแยก `enabled` ออกจาก `disabled`, ตัดสินว่าช่องทางต้นทางรองรับการอนุมัติ exec แบบ native หรือไม่ และใส่ช่องทางนั้นไว้ในคำแนะนำ fallback สำหรับ native-client `createApproverRestrictedNativeApprovalCapability(...)` จะเติมส่วนนี้ให้ในกรณีทั่วไป
- ใช้ `outbound.shouldSuppressLocalPayloadPrompt` หรือ `outbound.beforeDeliverPayload` สำหรับพฤติกรรมวงจรชีวิตของ payload แบบเฉพาะช่องทาง เช่น การซ่อน prompt อนุมัติภายในเครื่องที่ซ้ำกัน หรือการส่ง typing indicator ก่อนการส่งมอบ
- ใช้ `approvalCapability.delivery` เฉพาะสำหรับการกำหนดเส้นทางแบบ native ของการอนุมัติ หรือการระงับ fallback
- ใช้ `approvalCapability.nativeRuntime` สำหรับข้อเท็จจริงของการอนุมัติแบบ native ที่เป็นของช่องทางนั้น ควรทำให้เป็นแบบ lazy บน entrypoint ที่ร้อนของช่องทางด้วย `createLazyChannelApprovalNativeRuntimeAdapter(...)` ซึ่งสามารถ import โมดูลรันไทม์ของคุณตามต้องการ ขณะเดียวกันยังให้ core ประกอบวงจรชีวิตของการอนุมัติได้
- ใช้ `approvalCapability.render` เฉพาะเมื่อช่องทางจำเป็นต้องใช้ payload ของการอนุมัติแบบกำหนดเองจริง ๆ แทน renderer ที่ใช้ร่วมกัน
- ใช้ `approvalCapability.describeExecApprovalSetup` เมื่อช่องทางต้องการให้คำตอบในเส้นทางที่ปิดใช้งานอธิบายคอนฟิกที่จำเป็นอย่างชัดเจนเพื่อเปิดใช้การอนุมัติ exec แบบ native hook นี้จะรับ `{ channel, channelLabel, accountId }`; ช่องทางที่มีบัญชีแบบมีชื่อควรเรนเดอร์พาธที่กำหนดขอบเขตตามบัญชี เช่น `channels.<channel>.accounts.<id>.execApprovals.*` แทนค่าเริ่มต้นระดับบนสุด
- หากช่องทางสามารถอนุมานตัวตนใน DM ที่เสถียรในลักษณะคล้ายเจ้าของจากคอนฟิกที่มีอยู่ได้ ให้ใช้ `createResolvedApproverActionAuthAdapter` จาก `openclaw/plugin-sdk/approval-runtime` เพื่อจำกัด `/approve` ในแชตเดียวกัน โดยไม่ต้องเพิ่มตรรกะเฉพาะการอนุมัติใน core
- หากช่องทางต้องการการส่งมอบการอนุมัติแบบ native ให้คงโค้ดของช่องทางให้โฟกัสที่การ normalize เป้าหมาย พร้อมข้อเท็จจริงด้าน transport/presentation ใช้ `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` และ `createApproverRestrictedNativeApprovalCapability` จาก `openclaw/plugin-sdk/approval-runtime` ให้วางข้อเท็จจริงเฉพาะช่องทางไว้หลัง `approvalCapability.nativeRuntime` โดยควรผ่าน `createChannelApprovalNativeRuntimeAdapter(...)` หรือ `createLazyChannelApprovalNativeRuntimeAdapter(...)` เพื่อให้ core ประกอบ handler ได้ และเป็นเจ้าของการกรองคำขอ การกำหนดเส้นทาง การ dedupe การหมดอายุ การ subscribe กับ Gateway และข้อความแจ้ง routed-elsewhere เอง `nativeRuntime` ถูกแยกเป็น seam ย่อยไม่กี่ส่วน:
- `availability` — บัญชีถูกตั้งค่าไว้หรือไม่ และควรจัดการคำขอนั้นหรือไม่
- `presentation` — แมป shared approval view model ไปยัง payload แบบ native สำหรับ pending/resolved/expired หรือ action ขั้นสุดท้าย
- `transport` — เตรียมเป้าหมาย รวมถึงส่ง/อัปเดต/ลบข้อความอนุมัติแบบ native
- `interactions` — hook สำหรับ bind/unbind/clear-action แบบไม่บังคับ สำหรับปุ่มหรือ reaction แบบ native
- `observe` — hook สำหรับการวินิจฉัยการส่งมอบแบบไม่บังคับ
- หากช่องทางต้องการอ็อบเจ็กต์ที่เป็นของรันไทม์ เช่น client, token, Bolt app หรือ webhook receiver ให้ลงทะเบียนผ่าน `openclaw/plugin-sdk/channel-runtime-context` runtime-context registry แบบทั่วไปช่วยให้ core bootstrap handler ที่ขับเคลื่อนด้วย capability จากสถานะการเริ่มต้นของช่องทางได้ โดยไม่ต้องเพิ่มโค้ด glue เฉพาะการอนุมัติ
- ใช้ `createChannelApprovalHandler` หรือ `createChannelNativeApprovalRuntime` ระดับต่ำกว่าก็ต่อเมื่อ seam ที่ขับเคลื่อนด้วย capability ยังไม่แสดงออกได้เพียงพอ
- ช่องทางที่มีการอนุมัติแบบ native ต้องกำหนดเส้นทางทั้ง `accountId` และ `approvalKind` ผ่าน helper เหล่านั้น `accountId` ทำให้นโยบายการอนุมัติแบบหลายบัญชีถูกจำกัดอยู่กับบัญชีบอตที่ถูกต้อง และ `approvalKind` ทำให้พฤติกรรมการอนุมัติ exec เทียบกับ Plugin พร้อมใช้งานกับช่องทางนั้น โดยไม่ต้องมีสาขา hardcoded ใน core
- ตอนนี้ core เป็นเจ้าของข้อความแจ้ง reroute ของการอนุมัติด้วยเช่นกัน channel plugin ไม่ควรส่งข้อความติดตามผลของตัวเองประเภท "approval ถูกส่งไปยัง DM / อีกช่องทางหนึ่ง" จาก `createChannelNativeApprovalRuntime`; ให้เปิดเผยการกำหนดเส้นทางของ origin + DM ของ approver อย่างถูกต้องผ่าน helper ของ approval capability ที่ใช้ร่วมกัน แล้วปล่อยให้ core รวมการส่งมอบจริงก่อนโพสต์ข้อความแจ้งกลับไปยังแชตต้นทาง
- ให้คงชนิด id ของ approval ที่ถูกส่งมอบไว้ครบตั้งแต่ต้นจนจบ ไคลเอนต์แบบ native ไม่ควร
  เดาหรือเขียนเส้นทางของการอนุมัติ exec เทียบกับ Plugin ใหม่จากสถานะภายในช่องทาง
- approval kind ที่ต่างกันสามารถตั้งใจให้เปิดเผยพื้นผิวแบบ native ที่ต่างกันได้
  ตัวอย่าง bundled ปัจจุบัน:
  - Slack คงการกำหนดเส้นทางการอนุมัติแบบ native ไว้ได้ทั้งสำหรับ exec และ Plugin id
  - Matrix คงการกำหนดเส้นทาง DM/channel แบบ native และ UX แบบ reaction เดียวกันไว้สำหรับ exec
    และ Plugin approval ขณะเดียวกันก็ยังให้ออธต่างกันได้ตาม approval kind
- `createApproverRestrictedNativeApprovalAdapter` ยังคงมีอยู่ในฐานะ compatibility wrapper แต่โค้ดใหม่ควรเลือกใช้ capability builder และเปิดเผย `approvalCapability` บน Plugin

สำหรับ entrypoint ของช่องทางที่ร้อน ควรเลือกใช้ runtime subpath ที่แคบกว่าเมื่อคุณต้องการเพียงบางส่วนของกลุ่มนั้น:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

ในทำนองเดียวกัน ควรใช้ `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` และ
`openclaw/plugin-sdk/reply-chunking` เมื่อคุณไม่จำเป็นต้องใช้พื้นผิว umbrella ที่กว้างกว่า

สำหรับ setup โดยเฉพาะ:

- `openclaw/plugin-sdk/setup-runtime` ครอบคลุม helper สำหรับ setup ที่ปลอดภัยต่อรันไทม์:
  setup patch adapter ที่ปลอดภัยต่อการ import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), เอาต์พุตแบบ lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และตัวสร้าง delegated
  setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` คือ seam ของ adapter แบบ env-aware ที่แคบ
  สำหรับ `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` ครอบคลุมตัวสร้าง setup สำหรับ optional-install พร้อม primitive ที่ปลอดภัยต่อ setup บางตัว:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

หากช่องทางของคุณรองรับ setup หรือ auth แบบขับเคลื่อนด้วย env และโฟลว์ startup/config ทั่วไป
ควรรู้ชื่อ env เหล่านั้นก่อนที่ runtime จะโหลด ให้ประกาศไว้ใน
manifest ของ Plugin ด้วย `channelEnvVars` ส่วน `envVars` ในรันไทม์ของช่องทางหรือค่าคงที่ภายในเครื่อง
ให้คงไว้สำหรับข้อความที่แสดงแก่ผู้ปฏิบัติงานเท่านั้น

หากช่องทางของคุณสามารถปรากฏใน `status`, `channels list`, `channels status` หรือการสแกน SecretRef ได้ก่อนที่ runtime ของ Plugin จะเริ่ม ให้เพิ่ม `openclaw.setupEntry` ใน `package.json` entrypoint นั้นควรปลอดภัยต่อการ import ในเส้นทางคำสั่งแบบอ่านอย่างเดียว และควรส่งคืนเมทาดาทาของช่องทาง, setup-safe config adapter, status adapter และเมทาดาทาเป้าหมาย secret ของช่องทางที่จำเป็นต่อสรุปเหล่านั้น ห้ามเริ่ม client, listener หรือ transport runtime จาก setup entry

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` และ
`splitSetupEntries`

- ให้ใช้ seam `openclaw/plugin-sdk/setup` ที่กว้างกว่าก็ต่อเมื่อคุณต้องการ
  helper การตั้งค่า/config แบบใช้ร่วมกันที่หนักกว่า เช่น
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

หากช่องทางของคุณเพียงต้องการประกาศว่า "ต้องติดตั้ง Plugin นี้ก่อน" ในพื้นผิวของ setup ให้เลือกใช้ `createOptionalChannelSetupSurface(...)` adapter/wizard ที่สร้างขึ้นจะ fail closed สำหรับการเขียนคอนฟิกและการ finalize และใช้ข้อความ install-required เดียวกันซ้ำในการตรวจสอบ, finalize และข้อความลิงก์เอกสาร

สำหรับเส้นทางช่องทางที่ร้อนอื่น ๆ ควรเลือก helper ที่แคบกว่าแทนพื้นผิวแบบ legacy ที่กว้างกว่า:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` และ
  `openclaw/plugin-sdk/account-helpers` สำหรับคอนฟิกหลายบัญชีและ
  fallback ของบัญชีค่าเริ่มต้น
- `openclaw/plugin-sdk/inbound-envelope` และ
  `openclaw/plugin-sdk/inbound-reply-dispatch` สำหรับการกำหนดเส้นทาง/envelope ของขาเข้า และ
  การเชื่อมการบันทึกและ dispatch
- `openclaw/plugin-sdk/messaging-targets` สำหรับการ parse/จับคู่เป้าหมาย
- `openclaw/plugin-sdk/outbound-media` และ
  `openclaw/plugin-sdk/outbound-runtime` สำหรับการโหลดสื่อ รวมถึง delegate ด้าน identity/send ขาออกและการวางแผน payload
- `buildThreadAwareOutboundSessionRoute(...)` จาก
  `openclaw/plugin-sdk/channel-core` เมื่อเส้นทางขาออกควรคง `replyToId`/`threadId` แบบ explicit ไว้ หรือกู้คืนเซสชัน `:thread:` ปัจจุบันหลังจาก base session key ยังคงตรงกัน Provider plugin สามารถ override ลำดับความสำคัญ พฤติกรรมของ suffix และการ normalize thread id ได้เมื่อแพลตฟอร์มของพวกมันมี semantics การส่งมอบเธรดแบบ native
- `openclaw/plugin-sdk/thread-bindings-runtime` สำหรับวงจรชีวิตของ thread-binding
  และการลงทะเบียน adapter
- `openclaw/plugin-sdk/agent-media-payload` เฉพาะเมื่อยังจำเป็นต้องใช้
  รูปแบบฟิลด์ของ payload แบบ agent/media แบบ legacy
- `openclaw/plugin-sdk/telegram-command-config` สำหรับการ normalize คำสั่งแบบกำหนดเองของ Telegram การตรวจสอบค่าซ้ำ/ค่าชนกัน และสัญญาคอนฟิกของคำสั่งที่เสถียรต่อ fallback

ช่องทางที่มีเฉพาะ auth โดยทั่วไปสามารถหยุดที่เส้นทางค่าเริ่มต้นได้: core จัดการ approvals และ Plugin เพียงเปิดเผยความสามารถด้าน outbound/auth ช่องทางที่มี native approval เช่น Matrix, Slack, Telegram และระบบขนส่งแชตแบบกำหนดเอง ควรใช้ helper แบบ native ที่ใช้ร่วมกัน แทนการสร้างวงจรชีวิต approval ของตัวเอง

## นโยบายการกล่าวถึงขาเข้า

ให้แยกการจัดการการกล่าวถึงขาเข้าเป็นสองชั้น:

- การรวบรวมหลักฐานที่เป็นของ Plugin
- การประเมินนโยบายที่ใช้ร่วมกัน

ใช้ `openclaw/plugin-sdk/channel-mention-gating` สำหรับการตัดสินใจด้านนโยบายการกล่าวถึง
ใช้ `openclaw/plugin-sdk/channel-inbound` เฉพาะเมื่อคุณต้องการ
barrel ของ helper ฝั่งขาเข้าที่กว้างกว่า

ตัวอย่างตรรกะที่เหมาะจะอยู่ใน Plugin:

- การตรวจจับการตอบกลับถึงบอต
- การตรวจจับการ quote ข้อความของบอต
- การตรวจสอบการมีส่วนร่วมในเธรด
- การตัดข้อความบริการ/ระบบออก
- แคชแบบ native ของแพลตฟอร์มที่จำเป็นต่อการพิสูจน์ว่าบอตมีส่วนร่วมอยู่

สิ่งที่เหมาะจะอยู่ใน helper ที่ใช้ร่วมกัน:

- `requireMention`
- ผลลัพธ์การกล่าวถึงแบบ explicit
- allowlist ของการกล่าวถึงโดยนัย
- การข้ามเมื่อเป็นคำสั่ง
- การตัดสินใจขั้นสุดท้ายว่าจะข้ามหรือไม่

โฟลว์ที่แนะนำ:

1. คำนวณข้อเท็จจริงการกล่าวถึงในฝั่งภายในเครื่อง
2. ส่งข้อเท็จจริงเหล่านั้นเข้าไปใน `resolveInboundMentionDecision({ facts, policy })`
3. ใช้ `decision.effectiveWasMentioned`, `decision.shouldBypassMention` และ `decision.shouldSkip` ใน gate ของขาเข้าของคุณ

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` เปิดเผย helper ด้านการกล่าวถึงแบบใช้ร่วมกันชุดเดียวกันสำหรับ
bundled channel plugin ที่พึ่งพาการ inject ของรันไทม์อยู่แล้ว:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

หากคุณต้องการเพียง `implicitMentionKindWhen` และ
`resolveInboundMentionDecision` ให้ import จาก
`openclaw/plugin-sdk/channel-mention-gating` เพื่อหลีกเลี่ยงการโหลด helper รันไทม์ของขาเข้าอย่างอื่นที่ไม่เกี่ยวข้อง

helper แบบเก่า `resolveMentionGating*` ยังคงอยู่บน
`openclaw/plugin-sdk/channel-inbound` ในฐานะ export เพื่อความเข้ากันได้เท่านั้น โค้ดใหม่
ควรใช้ `resolveInboundMentionDecision({ facts, policy })`

## ขั้นตอนแบบลงมือทำ

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package และ manifest">
    สร้างไฟล์มาตรฐานของ Plugin ฟิลด์ `channel` ใน `package.json` คือ
    สิ่งที่ทำให้สิ่งนี้เป็น channel plugin สำหรับพื้นผิวเมทาดาทาของ package แบบเต็ม
    ดู [Plugin Setup and Config](/th/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="สร้างอ็อบเจ็กต์ channel plugin">
    อินเทอร์เฟซ `ChannelPlugin` มีพื้นผิว adapter แบบไม่บังคับจำนวนมาก เริ่มจาก
    ขั้นต่ำ — `id` และ `setup` — แล้วค่อยเพิ่ม adapter ตามที่คุณต้องการ

    สร้าง `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="สิ่งที่ createChatChannelPlugin จัดการให้คุณ">
      แทนที่จะต้อง implement อินเทอร์เฟซ adapter ระดับล่างด้วยตนเอง คุณสามารถส่ง
      ตัวเลือกแบบ declarative แล้วตัว builder จะประกอบมันให้:

      | ตัวเลือก | สิ่งที่มันเชื่อมให้ |
      | --- | --- |
      | `security.dm` | ตัว resolve ความปลอดภัยของ DM แบบมีขอบเขตจากฟิลด์ในคอนฟิก |
      | `pairing.text` | โฟลว์การจับคู่ DM แบบข้อความพร้อมการแลกรหัส |
      | `threading` | ตัว resolve โหมด reply-to (แบบคงที่, แยกตามบัญชี หรือกำหนดเอง) |
      | `outbound.attachedResults` | ฟังก์ชันส่งที่คืนเมทาดาทาของผลลัพธ์ (message ID) |

      คุณยังสามารถส่งอ็อบเจ็กต์ adapter ดิบแทนตัวเลือกแบบ declarative ได้
      หากต้องการควบคุมเต็มรูปแบบ
    </Accordion>

  </Step>

  <Step title="เชื่อม entry point">
    สร้าง `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    ให้วาง descriptor ของ CLI ที่เป็นของช่องทางใน `registerCliMetadata(...)` เพื่อให้ OpenClaw
    แสดงมันใน root help ได้โดยไม่ต้องเปิดใช้ runtime ของช่องทางเต็มรูปแบบ
    ขณะที่การโหลดเต็มตามปกติก็ยังคงรับ descriptor เดิมไปสำหรับการลงทะเบียนคำสั่งจริง
    ให้คง `registerFull(...)` ไว้สำหรับงานที่ใช้ได้เฉพาะตอน runtime
    หาก `registerFull(...)` ลงทะเบียนเมธอด Gateway RPC ให้ใช้
    คำนำหน้าเฉพาะของ Plugin namespace admin หลักของ core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และจะ
    resolve ไปที่ `operator.admin` เสมอ
    `defineChannelPluginEntry` จัดการการแยกตามโหมดการลงทะเบียนให้อัตโนมัติ ดู
    [Entry Points](/th/plugins/sdk-entrypoints#definechannelpluginentry) สำหรับ
    ตัวเลือกทั้งหมด

  </Step>

  <Step title="เพิ่ม setup entry">
    สร้าง `setup-entry.ts` สำหรับการโหลดแบบเบาระหว่าง onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw จะโหลดสิ่งนี้แทน entry แบบเต็มเมื่อช่องทางถูกปิดใช้งาน
    หรือยังไม่ได้ตั้งค่า วิธีนี้ช่วยหลีกเลี่ยงการดึงโค้ดรันไทม์ที่หนักระหว่างโฟลว์ setup
    ดูรายละเอียดได้ที่ [Setup and Config](/th/plugins/sdk-setup#setup-entry)

    ช่องทางใน bundled workspace ที่แยก export ที่ปลอดภัยต่อ setup ไปไว้ใน sidecar
    module สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
    `openclaw/plugin-sdk/channel-entry-contract` ได้ เมื่อพวกมันยังต้องการ
    setup-time runtime setter แบบ explicit

  </Step>

  <Step title="จัดการข้อความขาเข้า">
    Plugin ของคุณต้องรับข้อความจากแพลตฟอร์มและส่งต่อเข้า
    OpenClaw รูปแบบที่ใช้กันทั่วไปคือ Webhook ที่ตรวจสอบคำขอและ
    dispatch มันผ่าน inbound handler ของช่องทางคุณ:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      การจัดการข้อความขาเข้าเป็นเรื่องเฉพาะของแต่ละช่องทาง แต่ละ channel plugin เป็นเจ้าของ
      inbound pipeline ของตัวเอง ดูรูปแบบจริงได้จาก bundled channel plugin
      (เช่น package ของ Plugin Microsoft Teams หรือ Google Chat)
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="ทดสอบ">
เขียนการทดสอบแบบ colocated ใน `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    สำหรับตัวช่วยการทดสอบแบบใช้ร่วมกัน ดู [Testing](/th/plugins/sdk-testing)

  </Step>
</Steps>

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-chat/
├── package.json              # เมทาดาทา openclaw.channel
├── openclaw.plugin.json      # Manifest พร้อม config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # export สาธารณะ (ไม่บังคับ)
├── runtime-api.ts            # export ภายในสำหรับรันไทม์ (ไม่บังคับ)
└── src/
    ├── channel.ts            # ChannelPlugin ผ่าน createChatChannelPlugin
    ├── channel.test.ts       # การทดสอบ
    ├── client.ts             # ไคลเอนต์ API ของแพลตฟอร์ม
    └── runtime.ts            # runtime store (หากจำเป็น)
```

## หัวข้อขั้นสูง

<CardGroup cols={2}>
  <Card title="ตัวเลือกด้าน threading" icon="git-branch" href="/th/plugins/sdk-entrypoints#registration-mode">
    โหมดการตอบกลับแบบคงที่ แยกตามบัญชี หรือกำหนดเอง
  </Card>
  <Card title="การผสานรวมกับ message tool" icon="puzzle" href="/th/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool และการค้นหา action
  </Card>
  <Card title="การ resolve เป้าหมาย" icon="crosshair" href="/th/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, STT, media, subagent ผ่าน api.runtime
  </Card>
</CardGroup>

<Note>
ยังมี helper seam บางตัวของ bundled อยู่เพื่อการดูแล bundled plugin และ
ความเข้ากันได้ สิ่งเหล่านี้ไม่ใช่รูปแบบที่แนะนำสำหรับ channel plugin ใหม่;
ควรใช้ subpath แบบทั่วไปของ channel/setup/reply/runtime จากพื้นผิว SDK กลาง
เว้นแต่คุณกำลังดูแล bundled plugin family นั้นโดยตรง
</Note>

## ขั้นตอนถัดไป

- [Provider Plugins](/th/plugins/sdk-provider-plugins) — หาก Plugin ของคุณให้บริการโมเดลด้วย
- [ภาพรวม SDK](/th/plugins/sdk-overview) — เอกสารอ้างอิง import subpath แบบเต็ม
- [SDK Testing](/th/plugins/sdk-testing) — ยูทิลิตีการทดสอบและ contract test
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest แบบเต็ม
