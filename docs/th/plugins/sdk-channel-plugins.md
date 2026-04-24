---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางส่งข้อความใหม่
    - คุณต้องการเชื่อมต่อ OpenClaw เข้ากับแพลตฟอร์มรับส่งข้อความ
    - คุณจำเป็นต้องเข้าใจพื้นผิวอะแดปเตอร์ ChannelPlugin
sidebarTitle: Channel Plugins
summary: คู่มือแบบทีละขั้นตอนสำหรับการสร้าง Plugin ช่องทางส่งข้อความสำหรับ OpenClaw
title: |-
    การสร้าง Plugin ช่องทาง】【。analysis to=final code  大发快三开奖结果_string 1:
    We need only translate.
x-i18n:
    generated_at: "2026-04-24T09:24:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

คู่มือนี้จะแนะนำการสร้าง channel plugin ที่เชื่อม OpenClaw เข้ากับ
แพลตฟอร์มรับส่งข้อความ เมื่อจบแล้วคุณจะมี channel ที่ใช้งานได้ พร้อมความปลอดภัยสำหรับ DM,
การจับคู่, การร้อยเธรดคำตอบ และการส่งข้อความขาออก

<Info>
  หากคุณยังไม่เคยสร้าง OpenClaw plugin มาก่อน โปรดอ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อน เพื่อดูโครงสร้างแพ็กเกจ
  พื้นฐานและการตั้งค่า manifest
</Info>

## channel plugin ทำงานอย่างไร

channel plugin ไม่จำเป็นต้องมีเครื่องมือ send/edit/react ของตัวเอง OpenClaw เก็บ
เครื่องมือ `message` ที่ใช้ร่วมกันเพียงตัวเดียวไว้ใน core plugin ของคุณเป็นเจ้าของส่วนต่อไปนี้:

- **การกำหนดค่า** — การระบุบัญชีและวิซาร์ดการตั้งค่า
- **ความปลอดภัย** — นโยบาย DM และ allowlist
- **การจับคู่** — โฟลว์การอนุมัติ DM
- **ไวยากรณ์ของเซสชัน** — วิธีที่รหัสการสนทนาเฉพาะผู้ให้บริการแมปไปยังแชตพื้นฐาน, รหัสเธรด และค่าถอยกลับของ parent
- **ขาออก** — การส่งข้อความ, สื่อ และโพลไปยังแพลตฟอร์ม
- **การร้อยเธรด** — วิธีการร้อยเธรดของคำตอบ
- **การพิมพ์สำหรับ Heartbeat** — สัญญาณกำลังพิมพ์/ไม่ว่างแบบไม่บังคับสำหรับเป้าหมายการส่งของ Heartbeat

core เป็นเจ้าของเครื่องมือ message ที่ใช้ร่วมกัน, การเชื่อม prompt, รูปร่างภายนอกของ session-key,
การเก็บข้อมูล `:thread:` แบบทั่วไป และการส่งต่อ

หาก channel ของคุณรองรับตัวบ่งชี้การพิมพ์นอกเหนือจากการตอบกลับขาเข้า ให้เปิดเผย
`heartbeat.sendTyping(...)` บน channel plugin core จะเรียกสิ่งนี้พร้อมกับ
เป้าหมายการส่ง Heartbeat ที่ resolve แล้ว ก่อนที่การรันโมเดล Heartbeat จะเริ่ม และ
ใช้วงจรชีวิต typing keepalive/cleanup ที่ใช้ร่วมกัน เพิ่ม `heartbeat.clearTyping(...)`
เมื่อแพลตฟอร์มต้องการสัญญาณหยุดแบบชัดเจน

หาก channel ของคุณเพิ่มพารามิเตอร์ของ message-tool ที่มีแหล่งที่มาของสื่อ ให้เปิดเผย
ชื่อพารามิเตอร์เหล่านั้นผ่าน `describeMessageTool(...).mediaSourceParams` core ใช้
รายการที่ระบุชัดเจนนี้สำหรับการทำ sandbox path normalization และนโยบายการเข้าถึงสื่อขาออก
ดังนั้น plugin จึงไม่จำเป็นต้องมีกรณีพิเศษใน shared-core สำหรับพารามิเตอร์
avatar, attachment หรือ cover-image ที่เฉพาะผู้ให้บริการ
ควรส่งคืนเป็นแมปที่คีย์ตามแอ็กชัน เช่น
`{ "set-profile": ["avatarUrl", "avatarPath"] }` เพื่อไม่ให้แอ็กชันที่ไม่เกี่ยวข้อง
รับช่วงอาร์กิวเมนต์สื่อของอีกแอ็กชันหนึ่ง อาร์เรย์แบบแบนก็ยังใช้ได้กับพารามิเตอร์
ที่ตั้งใจให้แชร์ร่วมกันในทุกแอ็กชันที่เปิดเผย

หากแพลตฟอร์มของคุณเก็บขอบเขตเพิ่มเติมไว้ภายในรหัสการสนทนา ให้เก็บการแยกวิเคราะห์นั้นไว้
ใน plugin ด้วย `messaging.resolveSessionConversation(...)` นี่คือ hook ตามแบบฉบับ
สำหรับการแมป `rawId` ไปยังรหัสการสนทนาพื้นฐาน, รหัสเธรดแบบไม่บังคับ,
`baseConversationId` แบบชัดเจน และ `parentConversationCandidates`
ใด ๆ เมื่อคุณส่งคืน `parentConversationCandidates` ให้เรียงลำดับจาก
parent ที่แคบที่สุดไปยังการสนทนา parent/พื้นฐานที่กว้างที่สุด

Bundled plugin ที่ต้องใช้การแยกวิเคราะห์แบบเดียวกันก่อนที่ channel registry จะบูต
สามารถเปิดเผยไฟล์ระดับบนสุด `session-key-api.ts` พร้อม
export `resolveSessionConversation(...)` ที่สอดคล้องกันได้เช่นกัน core จะใช้พื้นผิว
ที่ปลอดภัยต่อการบูตสแตรปนี้ก็ต่อเมื่อ runtime plugin registry ยังไม่พร้อมใช้งาน

`messaging.resolveParentConversationCandidates(...)` ยังพร้อมใช้งานเป็น
ค่าถอยกลับเพื่อความเข้ากันได้แบบ legacy เมื่อ plugin ต้องการเพียง parent fallback
เพิ่มเติมบน generic/raw id เท่านั้น หากมีทั้งสอง hook อยู่ core จะใช้
`resolveSessionConversation(...).parentConversationCandidates` ก่อน และจะ
ถอยกลับไปใช้ `resolveParentConversationCandidates(...)` ก็ต่อเมื่อ canonical hook
ละเว้นค่าเหล่านั้น

## การอนุมัติและความสามารถของ channel

channel plugin ส่วนใหญ่ไม่จำเป็นต้องมีโค้ดเฉพาะการอนุมัติ

- core เป็นเจ้าของ `/approve` ในแชตเดียวกัน, payload ของปุ่มอนุมัติที่ใช้ร่วมกัน และการส่งแบบ fallback ทั่วไป
- ควรใช้ `approvalCapability` object เพียงตัวเดียวบน channel plugin เมื่อ channel ต้องการพฤติกรรมเฉพาะการอนุมัติ
- `ChannelPlugin.approvals` ถูกนำออกแล้ว ให้ใส่ข้อเท็จจริงเกี่ยวกับการส่ง/เนทีฟ/การเรนเดอร์/การยืนยันตัวตนของการอนุมัติไว้ใน `approvalCapability`
- `plugin.auth` มีไว้สำหรับ login/logout เท่านั้น; core จะไม่อ่าน approval auth hook จาก object นั้นอีกต่อไป
- `approvalCapability.authorizeActorAction` และ `approvalCapability.getActionAvailabilityState` คือ seam สำหรับ approval-auth ตามแบบฉบับ
- ใช้ `approvalCapability.getActionAvailabilityState` สำหรับความพร้อมใช้งานของ approval auth ในแชตเดียวกัน
- หาก channel ของคุณเปิดเผย native exec approvals ให้ใช้ `approvalCapability.getExecInitiatingSurfaceState` สำหรับสถานะของ initiating-surface/native-client เมื่อแตกต่างจาก approval auth ในแชตเดียวกัน core ใช้ hook เฉพาะ exec นี้เพื่อแยกแยะ `enabled` กับ `disabled`, ตัดสินใจว่า initiating channel รองรับ native exec approvals หรือไม่ และรวม channel นั้นไว้ในคำแนะนำ fallback ของ native-client `createApproverRestrictedNativeApprovalCapability(...)` จะเติมส่วนนี้ให้ในกรณีทั่วไป
- ใช้ `outbound.shouldSuppressLocalPayloadPrompt` หรือ `outbound.beforeDeliverPayload` สำหรับพฤติกรรมวงจรชีวิต payload ที่เฉพาะ channel เช่น การซ่อน local approval prompt ที่ซ้ำกัน หรือการส่งตัวบ่งชี้การพิมพ์ก่อนการส่ง
- ใช้ `approvalCapability.delivery` สำหรับการกำหนดเส้นทาง native approval หรือการระงับ fallback เท่านั้น
- ใช้ `approvalCapability.nativeRuntime` สำหรับข้อเท็จจริง native approval ที่ channel เป็นเจ้าของ ควรทำให้ lazy บน hot channel entrypoint ด้วย `createLazyChannelApprovalNativeRuntimeAdapter(...)` ซึ่งสามารถ import โมดูล runtime ของคุณตามต้องการ ในขณะที่ยังคงให้ core ประกอบวงจรชีวิตการอนุมัติได้
- ใช้ `approvalCapability.render` เฉพาะเมื่อ channel ต้องการ payload การอนุมัติแบบกำหนดเองจริง ๆ แทน renderer ที่ใช้ร่วมกัน
- ใช้ `approvalCapability.describeExecApprovalSetup` เมื่อ channel ต้องการให้คำตอบในเส้นทาง disabled อธิบายปุ่มปรับแต่งการกำหนดค่าที่แน่นอนซึ่งจำเป็นต่อการเปิด native exec approvals hook นี้จะได้รับ `{ channel, channelLabel, accountId }`; channel แบบ named-account ควรเรนเดอร์พาธแบบผูกกับบัญชี เช่น `channels.<channel>.accounts.<id>.execApprovals.*` แทนค่าเริ่มต้นระดับบนสุด
- หาก channel สามารถอนุมานตัวตน DM แบบ owner-like ที่เสถียรจากการกำหนดค่าที่มีอยู่ได้ ให้ใช้ `createResolvedApproverActionAuthAdapter` จาก `openclaw/plugin-sdk/approval-runtime` เพื่อจำกัด `/approve` ในแชตเดียวกัน โดยไม่ต้องเพิ่มตรรกะ core ที่เฉพาะการอนุมัติ
- หาก channel ต้องการ native approval delivery ให้คงโค้ดของ channel ไว้ที่การทำ target normalization บวกกับข้อเท็จจริงด้าน transport/presentation ใช้ `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` และ `createApproverRestrictedNativeApprovalCapability` จาก `openclaw/plugin-sdk/approval-runtime` วางข้อเท็จจริงเฉพาะ channel ไว้หลัง `approvalCapability.nativeRuntime` โดยควรผ่าน `createChannelApprovalNativeRuntimeAdapter(...)` หรือ `createLazyChannelApprovalNativeRuntimeAdapter(...)` เพื่อให้ core สามารถประกอบ handler และเป็นเจ้าของการกรองคำขอ, การกำหนดเส้นทาง, การลบรายการซ้ำ, การหมดอายุ, การสมัครใช้งาน gateway และประกาศ routed-elsewhere ได้ `nativeRuntime` ถูกแยกเป็น seam ที่เล็กลงไม่กี่ส่วน:
- `availability` — บัญชีถูกกำหนดค่าไว้หรือไม่ และคำขอควรถูกจัดการหรือไม่
- `presentation` — แมป shared approval view model ไปยัง payload เนทีฟแบบ pending/resolved/expired หรือ final action
- `transport` — เตรียม target พร้อมส่ง/อัปเดต/ลบข้อความ native approval
- `interactions` — hook bind/unbind/clear-action แบบไม่บังคับสำหรับปุ่มหรือรีแอ็กชันแบบเนทีฟ
- `observe` — hook วินิจฉัยการส่งแบบไม่บังคับ
- หาก channel ต้องการอ็อบเจ็กต์ที่ runtime เป็นเจ้าของ เช่น client, token, Bolt app หรือ webhook receiver ให้ลงทะเบียนผ่าน `openclaw/plugin-sdk/channel-runtime-context` runtime-context registry แบบทั่วไปช่วยให้ core บูตสแตรป handler ที่ขับเคลื่อนด้วย capability จากสถานะเริ่มต้นของ channel ได้ โดยไม่ต้องเพิ่ม wrapper glue ที่เฉพาะการอนุมัติ
- ใช้ `createChannelApprovalHandler` หรือ `createChannelNativeApprovalRuntime` ระดับล่างกว่า เฉพาะเมื่อ seam ที่ขับเคลื่อนด้วย capability ยังไม่สามารถแสดงความต้องการได้เพียงพอ
- channel สำหรับ native approval ต้องกำหนดเส้นทางทั้ง `accountId` และ `approvalKind` ผ่าน helper เหล่านั้น `accountId` ช่วยคงขอบเขตนโยบายการอนุมัติแบบหลายบัญชีให้อยู่กับ bot account ที่ถูกต้อง และ `approvalKind` ช่วยให้พฤติกรรมการอนุมัติแบบ exec กับ plugin พร้อมใช้งานกับ channel โดยไม่ต้องมีการแตกแขนงแบบฮาร์ดโค้ดใน core
- ตอนนี้ core เป็นเจ้าของ approval reroute notice ด้วยเช่นกัน channel plugin ไม่ควรส่งข้อความติดตามผลของตนเองประเภท "approval went to DMs / another channel" จาก `createChannelNativeApprovalRuntime`; แต่ควรเปิดเผยการกำหนดเส้นทาง origin + approver-DM ที่ถูกต้องผ่าน helper ของ shared approval capability และให้ core รวมการส่งที่เกิดขึ้นจริงก่อนโพสต์ประกาศใด ๆ กลับไปยัง initiating chat
- รักษาประเภทของ delivered approval id แบบต้นทางถึงปลายทาง native client ไม่ควร
  เดาหรือเขียนทับการกำหนดเส้นทาง approval แบบ exec กับ plugin จากสถานะในเครื่องของ channel
- approval kind ที่ต่างกันสามารถเปิดเผยพื้นผิวเนทีฟที่ต่างกันโดยตั้งใจได้
  ตัวอย่าง bundled ในปัจจุบัน:
  - Slack ยังคงเปิดให้ native approval routing ใช้งานได้ทั้งสำหรับ exec และ plugin id
  - Matrix คงการกำหนดเส้นทาง native DM/channel และ UX แบบ reaction เดียวกันไว้สำหรับ exec
    และ plugin approvals ในขณะที่ยังคงให้ auth แตกต่างกันได้ตาม approval kind
- `createApproverRestrictedNativeApprovalAdapter` ยังคงมีอยู่ในฐานะ wrapper เพื่อความเข้ากันได้ แต่โค้ดใหม่ควรใช้ capability builder และเปิดเผย `approvalCapability` บน plugin

สำหรับ hot channel entrypoint ควรใช้ subpath ของ runtime ที่แคบกว่าเมื่อคุณ
ต้องการเพียงส่วนเดียวของตระกูลนั้น:

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
`openclaw/plugin-sdk/reply-chunking` เมื่อคุณไม่ต้องการพื้นผิว umbrella
ที่กว้างกว่า

สำหรับการตั้งค่าโดยเฉพาะ:

- `openclaw/plugin-sdk/setup-runtime` ครอบคลุม helper การตั้งค่าที่ปลอดภัยต่อ runtime:
  patched setup adapter ที่ import ได้อย่างปลอดภัย (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), เอาต์พุตของ lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และ builder ของ
  setup-proxy แบบ delegated
- `openclaw/plugin-sdk/setup-adapter-runtime` คือ seam ของ adapter แบบ env-aware ที่แคบ
  สำหรับ `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` ครอบคลุม builder ของการตั้งค่าแบบ optional-install
  พร้อม primitive ที่ปลอดภัยต่อการตั้งค่าบางส่วน:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

หาก channel ของคุณรองรับการตั้งค่าหรือ auth ที่ขับเคลื่อนด้วย env และโฟลว์
startup/config แบบทั่วไปควรทราบชื่อ env เหล่านั้นก่อนที่ runtime จะโหลด ให้ประกาศไว้ใน
plugin manifest ด้วย `channelEnvVars` ให้คง `envVars` ของ channel runtime หรือค่าคงที่ในเครื่อง
ไว้สำหรับข้อความอธิบายที่แสดงแก่ผู้ปฏิบัติงานเท่านั้น

หาก channel ของคุณสามารถปรากฏใน `status`, `channels list`, `channels status` หรือ
การสแกน SecretRef ก่อนที่ plugin runtime จะเริ่มทำงาน ให้เพิ่ม `openclaw.setupEntry` ใน
`package.json` entrypoint นั้นควรปลอดภัยต่อการ import ในเส้นทางคำสั่งแบบอ่านอย่างเดียว
และควรส่งคืนเมทาดาทาของ channel, setup-safe config adapter, status
adapter และเมทาดาทาเป้าหมาย secret ของ channel ที่จำเป็นสำหรับสรุปเหล่านั้น อย่า
เริ่ม client, listener หรือ transport runtime จาก setup entry

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` และ
`splitSetupEntries`

- ใช้ seam `openclaw/plugin-sdk/setup` ที่กว้างกว่าเฉพาะเมื่อคุณยังต้องการ
  helper ของ shared setup/config ที่หนักกว่า เช่น
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

หาก channel ของคุณต้องการเพียงโฆษณาว่า "ติดตั้ง plugin นี้ก่อน" ใน
พื้นผิวการตั้งค่า ให้เลือกใช้ `createOptionalChannelSetupSurface(...)` adapter/wizard
ที่สร้างขึ้นจะปิดแบบ fail closed สำหรับการเขียนค่าคอนฟิกและการสรุปขั้นสุดท้าย และจะนำ
ข้อความต้องติดตั้งก่อนตัวเดียวกันกลับมาใช้ซ้ำในขั้นตอน validation, finalize และข้อความ
คำอธิบายพร้อมลิงก์เอกสาร

สำหรับเส้นทาง hot channel อื่น ๆ ให้เลือกใช้ helper แบบแคบแทนพื้นผิวแบบ legacy ที่กว้างกว่า:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` และ
  `openclaw/plugin-sdk/account-helpers` สำหรับการกำหนดค่าแบบหลายบัญชีและ
  fallback ของบัญชีเริ่มต้น
- `openclaw/plugin-sdk/inbound-envelope` และ
  `openclaw/plugin-sdk/inbound-reply-dispatch` สำหรับ route/envelope ขาเข้า และ
 การเชื่อม record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` สำหรับการแยกวิเคราะห์/จับคู่ target
- `openclaw/plugin-sdk/outbound-media` และ
  `openclaw/plugin-sdk/outbound-runtime` สำหรับการโหลดสื่อ รวมถึง delegate ของ
  identity/send ขาออก และการวางแผน payload
- `buildThreadAwareOutboundSessionRoute(...)` จาก
  `openclaw/plugin-sdk/channel-core` เมื่อ route ขาออกควรคง
  `replyToId`/`threadId` แบบชัดเจนไว้ หรือกู้คืนเซสชัน `:thread:` ปัจจุบัน
  หลังจาก base session key ยังคงตรงกันอยู่ Provider plugin สามารถ override
  ลำดับความสำคัญ, พฤติกรรมของ suffix และการทำ normalization ของ thread id ได้
  เมื่อแพลตฟอร์มของตนมี semantics การส่งแบบ thread แบบเนทีฟ
- `openclaw/plugin-sdk/thread-bindings-runtime` สำหรับวงจรชีวิตของ thread-binding
  และการลงทะเบียน adapter
- `openclaw/plugin-sdk/agent-media-payload` เฉพาะเมื่อยังจำเป็นต้องใช้
  layout ฟิลด์ payload ของ agent/media แบบ legacy
- `openclaw/plugin-sdk/telegram-command-config` สำหรับการทำ normalization ของ
  custom-command ใน Telegram, การตรวจสอบ duplicate/conflict และสัญญาคอนฟิกคำสั่ง
  ที่เสถียรต่อ fallback

channel ที่มีเฉพาะ auth มักจะหยุดที่เส้นทางเริ่มต้นได้เลย: core จัดการ approvals และ plugin เพียงเปิดเผยความสามารถด้าน outbound/auth เท่านั้น channel สำหรับ native approval เช่น Matrix, Slack, Telegram และ custom chat transport ควรใช้ helper แบบเนทีฟที่ใช้ร่วมกัน แทนการสร้างวงจรชีวิต approval ขึ้นเอง

## นโยบายการ mention ขาเข้า

ให้แยกการจัดการ mention ขาเข้าออกเป็นสองชั้น:

- การรวบรวมหลักฐานที่ plugin เป็นเจ้าของ
- การประเมินนโยบายแบบใช้ร่วมกัน

ใช้ `openclaw/plugin-sdk/channel-mention-gating` สำหรับการตัดสินใจด้าน mention-policy
ใช้ `openclaw/plugin-sdk/channel-inbound` เฉพาะเมื่อคุณต้องการ
helper barrel สำหรับขาเข้าที่กว้างกว่า

เหมาะกับตรรกะภายใน plugin:

- การตรวจจับ reply-to-bot
- การตรวจจับ quoted-bot
- การตรวจสอบการมีส่วนร่วมใน thread
- การยกเว้นข้อความบริการ/ระบบ
- แคชแบบเนทีฟของแพลตฟอร์มที่จำเป็นต่อการพิสูจน์การมีส่วนร่วมของบอต

เหมาะกับ helper ที่ใช้ร่วมกัน:

- `requireMention`
- ผลลัพธ์ explicit mention
- allowlist ของ implicit mention
- การข้ามคำสั่ง
- การตัดสินใจข้ามขั้นสุดท้าย

โฟลว์ที่แนะนำ:

1. คำนวณข้อเท็จจริงของ mention ในเครื่อง
2. ส่งข้อเท็จจริงเหล่านั้นเข้า `resolveInboundMentionDecision({ facts, policy })`
3. ใช้ `decision.effectiveWasMentioned`, `decision.shouldBypassMention` และ `decision.shouldSkip` ใน inbound gate ของคุณ

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

`api.runtime.channel.mentions` เปิดเผย helper การ mention แบบใช้ร่วมกันชุดเดียวกันสำหรับ
bundled channel plugin ที่พึ่งพา runtime injection อยู่แล้ว:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

หากคุณต้องการเพียง `implicitMentionKindWhen` และ
`resolveInboundMentionDecision` ให้ import จาก
`openclaw/plugin-sdk/channel-mention-gating` เพื่อหลีกเลี่ยงการโหลด
helper runtime ขาเข้าที่ไม่เกี่ยวข้อง

helper แบบเก่า `resolveMentionGating*` ยังคงอยู่บน
`openclaw/plugin-sdk/channel-inbound` ในฐานะ export เพื่อความเข้ากันได้เท่านั้น โค้ดใหม่
ควรใช้ `resolveInboundMentionDecision({ facts, policy })`

## คำแนะนำแบบทีละขั้น

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="แพ็กเกจและ manifest">
    สร้างไฟล์ plugin มาตรฐาน ฟิลด์ `channel` ใน `package.json` คือสิ่งที่
    ทำให้สิ่งนี้เป็น channel plugin สำหรับพื้นผิวเมทาดาทาของแพ็กเกจทั้งหมด
    โปรดดู [การตั้งค่าและคอนฟิก Plugin](/th/plugins/sdk-setup#openclaw-channel):

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
    อินเทอร์เฟซ `ChannelPlugin` มีพื้นผิว adapter แบบไม่บังคับหลายส่วน เริ่มจาก
    ขั้นต่ำสุด — `id` และ `setup` — แล้วค่อยเพิ่ม adapter ตามที่ต้องการ

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

    <Accordion title="createChatChannelPlugin ทำอะไรให้คุณบ้าง">
      แทนที่จะต้อง implement อินเทอร์เฟซ adapter ระดับล่างด้วยตนเอง คุณสามารถส่ง
      ตัวเลือกแบบประกาศเจตนาเข้าไป แล้วตัว builder จะประกอบสิ่งต่าง ๆ ให้:

      | ตัวเลือก | สิ่งที่เชื่อมให้ |
      | --- | --- |
      | `security.dm` | ตัว resolve ความปลอดภัย DM แบบมีขอบเขตจากฟิลด์คอนฟิก |
      | `pairing.text` | โฟลว์การจับคู่ DM แบบข้อความพร้อมการแลกเปลี่ยนโค้ด |
      | `threading` | ตัว resolve โหมด reply-to (คงที่, ผูกกับบัญชี หรือกำหนดเอง) |
      | `outbound.attachedResults` | ฟังก์ชัน send ที่ส่งคืนเมทาดาทาของผลลัพธ์ (message ID) |

      คุณยังสามารถส่งอ็อบเจ็กต์ adapter แบบดิบแทนตัวเลือกแบบประกาศเจตนาได้
      หากต้องการควบคุมแบบเต็มรูปแบบ
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

    ให้วาง descriptor CLI ที่ channel เป็นเจ้าของไว้ใน `registerCliMetadata(...)` เพื่อให้ OpenClaw
    สามารถแสดงสิ่งเหล่านี้ใน root help ได้โดยไม่ต้องเปิดใช้งาน runtime ของ channel แบบเต็ม
    ขณะที่การโหลดแบบเต็มตามปกติก็ยังคงรับ descriptor ชุดเดียวกันไปใช้สำหรับ
    การลงทะเบียนคำสั่งจริงได้ ให้เก็บ `registerFull(...)` ไว้สำหรับงานที่ทำได้เฉพาะ runtime
    หาก `registerFull(...)` ลงทะเบียนเมธอด Gateway RPC ให้ใช้คำนำหน้าเฉพาะ
    ของ plugin เนมสเปซผู้ดูแลระบบของ core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และจะ
    resolve ไปยัง `operator.admin` เสมอ
    `defineChannelPluginEntry` จัดการการแยกโหมดการลงทะเบียนให้อัตโนมัติ โปรดดู
    [Entry Points](/th/plugins/sdk-entrypoints#definechannelpluginentry) สำหรับ
    ตัวเลือกทั้งหมด

  </Step>

  <Step title="เพิ่ม setup entry">
    สร้าง `setup-entry.ts` สำหรับการโหลดแบบเบาระหว่างการเริ่มต้นใช้งาน:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw จะโหลดสิ่งนี้แทน full entry เมื่อ channel ถูกปิดใช้งาน
    หรือยังไม่ได้กำหนดค่า วิธีนี้ช่วยหลีกเลี่ยงการดึงโค้ด runtime ที่หนักเข้ามาระหว่าง setup flow
    โปรดดู [Setup and Config](/th/plugins/sdk-setup#setup-entry) สำหรับรายละเอียด

    Bundled workspace channel ที่แยก export ที่ปลอดภัยต่อ setup ออกไปไว้ใน sidecar
    module สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
    `openclaw/plugin-sdk/channel-entry-contract` เมื่อจำเป็นต้องมี
    setter ของ runtime ในช่วง setup แบบชัดเจนด้วย

  </Step>

  <Step title="จัดการข้อความขาเข้า">
    plugin ของคุณต้องรับข้อความจากแพลตฟอร์มและส่งต่อไปยัง
    OpenClaw รูปแบบทั่วไปคือ Webhook ที่ตรวจสอบคำขอและ
    dispatch ผ่าน inbound handler ของ channel ของคุณ:

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
      การจัดการข้อความขาเข้าเป็นสิ่งที่เฉพาะกับ channel แต่ละตัว channel plugin แต่ละตัวเป็นเจ้าของ
      ไปป์ไลน์ขาเข้าของตัวเอง ดูรูปแบบการใช้งานจริงได้จาก bundled channel plugin
      (เช่น แพ็กเกจ plugin ของ Microsoft Teams หรือ Google Chat)
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

    สำหรับ helper การทดสอบที่ใช้ร่วมกัน โปรดดู [การทดสอบ](/th/plugins/sdk-testing)

  </Step>
</Steps>

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-chat/
├── package.json              # เมทาดาทา openclaw.channel
├── openclaw.plugin.json      # Manifest พร้อม schema ของคอนฟิก
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # export สาธารณะ (ไม่บังคับ)
├── runtime-api.ts            # export runtime ภายใน (ไม่บังคับ)
└── src/
    ├── channel.ts            # ChannelPlugin ผ่าน createChatChannelPlugin
    ├── channel.test.ts       # การทดสอบ
    ├── client.ts             # API client ของแพลตฟอร์ม
    └── runtime.ts            # สโตร์ runtime (ถ้าจำเป็น)
```

## หัวข้อขั้นสูง

<CardGroup cols={2}>
  <Card title="ตัวเลือกการร้อยเธรด" icon="git-branch" href="/th/plugins/sdk-entrypoints#registration-mode">
    โหมดการตอบกลับแบบคงที่, ผูกกับบัญชี หรือกำหนดเอง
  </Card>
  <Card title="การผสานรวมเครื่องมือ message" icon="puzzle" href="/th/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool และการค้นหา action
  </Card>
  <Card title="การ resolve target" icon="crosshair" href="/th/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="helper ของ runtime" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, STT, สื่อ, subagent ผ่าน api.runtime
  </Card>
</CardGroup>

<Note>
seam ของ helper สำหรับ bundled บางส่วนยังคงมีอยู่เพื่อการดูแลรักษา bundled-plugin และ
ความเข้ากันได้ อย่างไรก็ตาม สิ่งเหล่านี้ไม่ใช่รูปแบบที่แนะนำสำหรับ channel plugin ใหม่;
ให้เลือกใช้ subpath แบบทั่วไปของ channel/setup/reply/runtime จากพื้นผิว SDK กลาง
เว้นแต่คุณกำลังดูแลตระกูล bundled plugin นั้นโดยตรง
</Note>

## ขั้นตอนถัดไป

- [Provider Plugins](/th/plugins/sdk-provider-plugins) — หาก plugin ของคุณมีโมเดลให้ด้วย
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิงการ import subpath แบบเต็ม
- [การทดสอบ SDK](/th/plugins/sdk-testing) — ยูทิลิตีการทดสอบและการทดสอบสัญญา
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest แบบเต็ม

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง plugin](/th/plugins/building-plugins)
- [Agent harness plugin](/th/plugins/sdk-agent-harness)
