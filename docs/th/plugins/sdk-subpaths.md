---
read_when:
    - การเลือก subpath ของ plugin-sdk ที่เหมาะสมสำหรับการ import ของปลั๊กอิน
    - การตรวจสอบ subpaths และพื้นผิวตัวช่วยของปลั๊กอินแบบ bundled
summary: 'แค็ตตาล็อก subpath ของ Plugin SDK: import ใดอยู่ที่ไหน จัดกลุ่มตามพื้นที่ใช้งาน'
title: subpaths ของ Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:25:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK ถูกเปิดเผยเป็นชุดของ subpaths แบบแคบภายใต้ `openclaw/plugin-sdk/`
  หน้านี้รวบรวม subpaths ที่ใช้บ่อยโดยจัดกลุ่มตามวัตถุประสงค์ รายการเต็มที่สร้างอัตโนมัติ
  ซึ่งมีมากกว่า 200 subpaths อยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`;
  subpaths ตัวช่วยของปลั๊กอินแบบ bundled ที่สงวนไว้ก็ปรากฏอยู่ที่นั่นเช่นกัน แต่ถือเป็น
  รายละเอียดของ implementation เว้นแต่หน้าคู่มือจะระบุชัดเจนว่าให้ใช้งาน

  สำหรับคู่มือการเขียนปลั๊กอิน ดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

  ## จุดเริ่มต้นของปลั๊กอิน

  | Subpath | export หลัก |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry` | `definePluginEntry` |
  | `plugin-sdk/core` | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |

  <AccordionGroup>
  <Accordion title="subpaths ของช่องทางส่งข้อความ">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | export Zod schema ของ `openclaw.json` ระดับราก (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, พร้อม `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยร่วมสำหรับ setup wizard, prompt ของ allowlist, ตัวสร้างสถานะ setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วย config/action-gate สำหรับหลายบัญชี และตัวช่วย fallback บัญชีค่าเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วย normalize account-id |
    | `plugin-sdk/account-resolution` | ตัวช่วย lookup บัญชี + fallback ค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยแบบแคบสำหรับรายการบัญชี/การกระทำกับบัญชี |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | ชนิดของ schema config ช่องทางส่งข้อความ |
    | `plugin-sdk/telegram-command-config` | ตัวช่วย normalize/validate คำสั่งแบบกำหนดเองของ Telegram พร้อม fallback ของสัญญาแบบ bundled |
    | `plugin-sdk/command-gating` | ตัวช่วยแบบแคบสำหรับ gate การอนุญาตคำสั่ง |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, ตัวช่วยวงจรชีวิต/การสรุปผลขั้นสุดท้ายของ draft stream |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยร่วมสำหรับ inbound route + การสร้าง envelope |
    | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วยร่วมสำหรับการบันทึกและ dispatch ขาเข้า |
    | `plugin-sdk/messaging-targets` | ตัวช่วย parse/match เป้าหมาย |
    | `plugin-sdk/outbound-media` | ตัวช่วยร่วมสำหรับการโหลดสื่อขาออก |
    | `plugin-sdk/outbound-runtime` | ตัวช่วยสำหรับ identity ขาออก, send delegate และการวางแผน payload |
    | `plugin-sdk/poll-runtime` | ตัวช่วย normalize poll แบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยสำหรับวงจรชีวิตและ adapter ของ thread-binding |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง agent media payload แบบเดิม |
    | `plugin-sdk/conversation-runtime` | ตัวช่วยสำหรับ conversation/thread binding, pairing และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot config ของ runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วย resolve group-policy ของ runtime |
    | `plugin-sdk/channel-status` | ตัวช่วยร่วมสำหรับ snapshot/summary สถานะช่องทางส่งข้อความ |
    | `plugin-sdk/channel-config-primitives` | primitive แบบแคบของ schema config ช่องทางส่งข้อความ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตสำหรับการเขียน config ช่องทางส่งข้อความ |
    | `plugin-sdk/channel-plugin-common` | export prelude ร่วมของปลั๊กอินช่องทางส่งข้อความ |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยอ่าน/แก้ไข config ของ allowlist |
    | `plugin-sdk/group-access` | ตัวช่วยร่วมสำหรับการตัดสินใจเรื่องการเข้าถึงกลุ่ม |
    | `plugin-sdk/direct-dm` | ตัวช่วยร่วมสำหรับการยืนยันตัวตน/guard ของ direct-DM |
    | `plugin-sdk/interactive-runtime` | ตัวช่วยสำหรับการแสดงผลข้อความเชิงความหมาย, การส่งมอบ และ interactive reply แบบเดิม ดู [Message Presentation](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | compatibility barrel สำหรับ inbound debounce, mention matching, ตัวช่วย mention-policy และ envelope helpers |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย inbound debounce แบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วยแบบแคบสำหรับ mention-policy และข้อความ mention โดยไม่ดึงพื้นผิว inbound runtime ที่กว้างกว่า |
    | `plugin-sdk/channel-envelope` | ตัวช่วยแบบแคบสำหรับการจัดรูปแบบ inbound envelope |
    | `plugin-sdk/channel-location` | ตัวช่วยสำหรับบริบทตำแหน่งของช่องทางส่งข้อความและการจัดรูปแบบ |
    | `plugin-sdk/channel-logging` | ตัวช่วย logging ของช่องทางส่งข้อความสำหรับการทิ้ง inbound และความล้มเหลวของ typing/ack |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์ของ reply |
    | `plugin-sdk/channel-actions` | ตัวช่วยสำหรับ message-action ของช่องทางส่งข้อความ พร้อมตัวช่วย schema แบบเนทีฟที่เลิกใช้แล้วแต่ยังคงไว้เพื่อความเข้ากันได้ของปลั๊กอิน |
    | `plugin-sdk/channel-targets` | ตัวช่วย parse/match เป้าหมาย |
    | `plugin-sdk/channel-contract` | ชนิดของสัญญาช่องทางส่งข้อความ |
    | `plugin-sdk/channel-feedback` | การเชื่อม feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยสัญญา secret แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และชนิดเป้าหมายของ secret |
  </Accordion>

  <Accordion title="subpaths ของผู้ให้บริการ">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | ตัวช่วย setup ที่คัดสรรแล้วสำหรับผู้ให้บริการแบบในเครื่อง/โฮสต์เอง |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วย setup แบบเจาะจงสำหรับผู้ให้บริการที่โฮสต์เองและเข้ากันได้กับ OpenAI |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วย runtime สำหรับ resolve API key ของปลั๊กอินผู้ให้บริการ |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วยสำหรับ onboarding/การเขียน profile ของ API key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์ auth ของ OAuth แบบมาตรฐาน |
    | `plugin-sdk/provider-auth-login` | ตัวช่วยร่วมสำหรับการล็อกอินแบบโต้ตอบของปลั๊กอินผู้ให้บริการ |
    | `plugin-sdk/provider-env-vars` | ตัวช่วย lookup env var สำหรับ auth ของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วย normalize model-id เช่น `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยทั่วไปสำหรับความสามารถ HTTP/endpoint ของผู้ให้บริการ รวมถึงตัวช่วย multipart form สำหรับ audio transcription |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญา config/การเลือกแบบแคบสำหรับ web-fetch เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยการลงทะเบียน/แคชสำหรับผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config/credential ของ web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องการการเชื่อมการเปิดใช้ปลั๊กอิน |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา config/credential ของ web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่าน credential แบบมีขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยการลงทะเบียน/แคช/runtime สำหรับผู้ให้บริการ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การล้าง schema + diagnostics ของ Gemini และตัวช่วย compat ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และสิ่งที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดของ stream wrapper และตัวช่วย wrapper ร่วมสำหรับ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport แบบเนทีฟของผู้ให้บริการ เช่น guarded fetch, การแปลงข้อความของ transport และ writable transport event streams |
    | `plugin-sdk/provider-onboard` | ตัวช่วย patch config สำหรับ onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ระดับโปรเซสภายในเครื่อง |
    | `plugin-sdk/group-activation` | ตัวช่วยแบบแคบสำหรับโหมดการเปิดใช้งานกลุ่มและการ parse คำสั่ง |
  </Accordion>

  <Accordion title="subpaths ด้านการยืนยันตัวตนและความปลอดภัย">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วย command registry, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความ command/help เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วย resolve ผู้อนุมัติและการยืนยันสิทธิ์ action ภายในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec แบบเนทีฟ |
    | `plugin-sdk/approval-delivery-runtime` | adapter สำหรับความสามารถ/การส่งการอนุมัติแบบเนทีฟ |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยร่วมสำหรับการ resolve approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลด adapter การอนุมัติแบบเนทีฟขนาดเบาสำหรับ entrypoint ของช่องทางส่งข้อความที่ร้อน |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วย runtime ของ approval handler ที่กว้างกว่า; ให้ใช้ seam แบบ adapter/gateway ที่แคบกว่าหากเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบเนทีฟ + account-binding |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload ของ reply สำหรับการอนุมัติ exec/plugin |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยแบบแคบสำหรับรีเซ็ตการ dedupe ของ reply ขาเข้า |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาของช่องทางส่งข้อความแบบแคบโดยไม่ดึง testing barrel ขนาดใหญ่ |
    | `plugin-sdk/command-auth-native` | ตัวช่วย command auth แบบเนทีฟ + ตัวช่วย session-target แบบเนทีฟ |
    | `plugin-sdk/command-detection` | ตัวช่วยร่วมสำหรับการตรวจจับคำสั่ง |
    | `plugin-sdk/command-primitives-runtime` | predicate ของข้อความคำสั่งแบบ lightweight สำหรับเส้นทางช่องทางส่งข้อความที่ร้อน |
    | `plugin-sdk/command-surface` | ตัวช่วย normalize เนื้อหาคำสั่งและ command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยแบบแคบสำหรับการรวบรวมสัญญา secret ของพื้นผิว secret ในช่องทางส่งข้อความ/ปลั๊กอิน |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วยแบบแคบสำหรับ `coerceSecretRef` และชนิดของ SecretRef สำหรับการ parse สัญญา secret/config |
    | `plugin-sdk/security-runtime` | ตัวช่วยร่วมด้านความเชื่อถือ, DM gating, เนื้อหาภายนอก และการรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF สำหรับ host allowlist และเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย dispatcher แบบ pinned ที่แคบโดยไม่ดึงพื้นผิว infra runtime ที่กว้าง |
    | `plugin-sdk/ssrf-runtime` | ตัวช่วย pinned-dispatcher, fetch ที่ป้องกัน SSRF และนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วย parse อินพุต secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมายของ Webhook |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยสำหรับขนาด body/timeout ของคำขอ |
  </Accordion>

  <Accordion title="subpaths ด้าน runtime และที่เก็บข้อมูล">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วย runtime/logging/backup/การติดตั้งปลั๊กอินแบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วยแบบแคบสำหรับ env, logger, timeout, retry และ backoff ของ runtime |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยทั่วไปสำหรับการลงทะเบียนและ lookup runtime-context ของช่องทางส่งข้อความ |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยร่วมสำหรับ command/hook/http/interactive ของปลั๊กอิน |
    | `plugin-sdk/hook-runtime` | ตัวช่วยร่วมสำหรับไปป์ไลน์ของ webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยสำหรับ import/binding ของ runtime แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วยสำหรับการรัน process |
    | `plugin-sdk/cli-runtime` | ตัวช่วยสำหรับการจัดรูปแบบ, การรอ และเวอร์ชันของ CLI |
    | `plugin-sdk/gateway-runtime` | ตัวช่วยไคลเอนต์ Gateway และตัวช่วย patch สถานะช่องทางส่งข้อความ |
    | `plugin-sdk/config-runtime` | ตัวช่วยโหลด/เขียน config และตัวช่วย lookup config ของปลั๊กอิน |
    | `plugin-sdk/telegram-command-config` | ตัวช่วย normalize ชื่อ/คำอธิบายคำสั่งของ Telegram และการตรวจสอบรายการซ้ำ/ความขัดแย้ง แม้ไม่มีพื้นผิวสัญญา Telegram แบบ bundled |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ดึง text-runtime barrel ที่กว้าง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติ exec/plugin, ตัวสร้างความสามารถการอนุมัติ, ตัวช่วย auth/profile, ตัวช่วยการกำหนดเส้นทาง/runtime แบบเนทีฟ |
    | `plugin-sdk/reply-runtime` | ตัวช่วย runtime ร่วมสำหรับ inbound/reply, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยแบบแคบสำหรับ reply dispatch/finalize และ conversation-label |
    | `plugin-sdk/reply-history` | ตัวช่วยร่วมสำหรับประวัติ reply ในช่วงเวลาสั้น เช่น `buildHistoryContext`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบบแคบสำหรับ text/markdown chunking |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยพาธของ session store + updated-at |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธของ state/OAuth dir |
    | `plugin-sdk/routing` | ตัวช่วย route/session-key/account binding เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยร่วมสำหรับสรุปสถานะช่องทางส่งข้อความ/บัญชี, ค่าเริ่มต้นของ runtime-state และตัวช่วยข้อมูลเมตาของปัญหา |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วยร่วมสำหรับ target resolver |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วย normalize slug/string |
    | `plugin-sdk/request-url` | ดึง URL แบบสตริงจากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบมี timeout พร้อมผลลัพธ์ stdout/stderr ที่ normalize แล้ว |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับ tool/CLI |
    | `plugin-sdk/tool-payload` | ดึง payload ที่ normalize แล้วจากอ็อบเจ็กต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
    | `plugin-sdk/temp-path` | ตัวช่วยร่วมสำหรับพาธดาวน์โหลดชั่วคราว |
    | `plugin-sdk/logging-core` | ตัวช่วย logger ระดับ subsystem และการปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดตาราง Markdown และการแปลง |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่เก็บบนดิสก์ |
    | `plugin-sdk/acp-runtime` | ตัวช่วย runtime/session และ reply-dispatch ของ ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | การ resolve ACP binding แบบอ่านอย่างเดียวโดยไม่ดึง import เริ่มต้น lifecycle |
    | `plugin-sdk/agent-config-primitives` | primitive แบบแคบของ schema config runtime ของเอเจนต์ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบไม่เข้มงวด |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วย resolve การจับคู่ชื่อที่อันตราย |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย device bootstrap และ pairing token |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วยร่วมสำหรับ passive-channel, status และ ambient proxy |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วย reply สำหรับคำสั่ง `/models`/ผู้ให้บริการ |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่งของ Skills |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize ของคำสั่งแบบเนทีฟ |
    | `plugin-sdk/agent-harness` | พื้นผิว trusted-plugin แบบทดลองสำหรับ agent harness ระดับล่าง: ชนิดของ harness, ตัวช่วย steer/abort ของการรันที่กำลังทำงาน, ตัวช่วย bridge ไปยังเครื่องมือ OpenClaw, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าของ tool และยูทิลิตีผลลัพธ์ของความพยายาม |
    | `plugin-sdk/provider-zai-endpoint` | ตัวช่วยตรวจจับ endpoint ของ Z.A.I |
    | `plugin-sdk/infra-runtime` | ตัวช่วย event/Heartbeat ของระบบ |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย flag และ event สำหรับการวินิจฉัย |
    | `plugin-sdk/error-runtime` | ตัวช่วยกราฟข้อผิดพลาด, การจัดรูปแบบ, การจัดประเภทข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ตัวช่วย wrapped fetch, proxy และ pinned lookup |
    | `plugin-sdk/runtime-fetch` | runtime fetch ที่รับรู้ dispatcher โดยไม่ดึง import ของ proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่ดึงพื้นผิว media runtime ที่กว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะ current conversation binding โดยไม่มีการกำหนดเส้นทาง configured binding หรือ pairing store |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยอ่าน session-store โดยไม่ดึง import ของการเขียน/บำรุงรักษา config แบบกว้าง |
    | `plugin-sdk/context-visibility-runtime` | การ resolve การมองเห็น context และการกรอง supplemental context โดยไม่ดึง import ของ config/security แบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วยแบบแคบสำหรับ coercion/normalization ของ primitive record/string โดยไม่ดึง markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วย normalize hostname และ SCP host |
    | `plugin-sdk/retry-runtime` | ตัวช่วย config ของ retry และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วย dir/identity/workspace ของเอเจนต์ |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่อิง config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="subpaths ด้านความสามารถและการทดสอบ">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยร่วมสำหรับ fetch/transform/store สื่อ พร้อมตัวสร้าง media payload |
    | `plugin-sdk/media-store` | ตัวช่วย media store แบบแคบ เช่น `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วยร่วมสำหรับ failover ของการสร้างสื่อ, การเลือก candidate และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ชนิดของผู้ให้บริการ media understanding พร้อม export ตัวช่วยด้านภาพ/เสียงที่หันไปทางผู้ให้บริการ |
    | `plugin-sdk/text-runtime` | ตัวช่วยร่วมสำหรับข้อความ/Markdown/logging เช่น การตัดข้อความที่มองเห็นโดยผู้ช่วย, ตัวช่วย render/chunking/table ของ Markdown, ตัวช่วยการปกปิดข้อมูล, ตัวช่วย directive-tag และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วย chunking ข้อความขาออก |
    | `plugin-sdk/speech` | ชนิดของผู้ให้บริการ speech พร้อม export ตัวช่วยด้าน directive, registry และ validation ที่หันไปทางผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ตัวช่วยร่วมสำหรับชนิดของผู้ให้บริการ speech, registry, directive และ normalization |
    | `plugin-sdk/realtime-transcription` | ชนิดของผู้ให้บริการ realtime transcription, ตัวช่วย registry และตัวช่วยร่วมสำหรับเซสชัน WebSocket |
    | `plugin-sdk/realtime-voice` | ชนิดของผู้ให้บริการ realtime voice และตัวช่วย registry |
    | `plugin-sdk/image-generation` | ชนิดของผู้ให้บริการสร้างภาพ |
    | `plugin-sdk/image-generation-core` | ตัวช่วยร่วมสำหรับชนิดของการสร้างภาพ, failover, auth และ registry |
    | `plugin-sdk/music-generation` | ชนิดของผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ตัวช่วยร่วมสำหรับชนิดของการสร้างเพลง, ตัวช่วย failover, การ lookup ผู้ให้บริการ และการ parse model-ref |
    | `plugin-sdk/video-generation` | ชนิดของผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ตัวช่วยร่วมสำหรับชนิดของการสร้างวิดีโอ, ตัวช่วย failover, การ lookup ผู้ให้บริการ และการ parse model-ref |
    | `plugin-sdk/webhook-targets` | ตัวช่วย registry ของเป้าหมาย Webhook และการติดตั้ง route |
    | `plugin-sdk/webhook-path` | ตัวช่วย normalize พาธของ Webhook |
    | `plugin-sdk/web-media` | ตัวช่วยร่วมสำหรับการโหลดสื่อระยะไกล/ในเครื่อง |
    | `plugin-sdk/zod` | `zod` ที่ re-export สำหรับผู้ใช้ Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="subpaths ด้านหน่วยความจำ">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core แบบ bundled สำหรับตัวช่วยด้าน manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade ของ runtime สำหรับดัชนี/การค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-foundation` | export ของเอนจินพื้นฐาน memory host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของ memory host, การเข้าถึง registry, ผู้ให้บริการในเครื่อง และตัวช่วยทั่วไปสำหรับ batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | export ของเอนจิน QMD ของ memory host |
    | `plugin-sdk/memory-core-host-engine-storage` | export ของเอนจิน storage ของ memory host |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของ memory host |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของ memory host |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของ memory host |
    | `plugin-sdk/memory-core-host-events` | ตัวช่วย event journal ของ memory host |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของ memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย CLI runtime ของ memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย core runtime ของ memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/runtime ของ memory host |
    | `plugin-sdk/memory-host-core` | alias แบบเป็นกลางต่อผู้จัดจำหน่ายสำหรับตัวช่วย core runtime ของ memory host |
    | `plugin-sdk/memory-host-events` | alias แบบเป็นกลางต่อผู้จัดจำหน่ายสำหรับตัวช่วย event journal ของ memory host |
    | `plugin-sdk/memory-host-files` | alias แบบเป็นกลางต่อผู้จัดจำหน่ายสำหรับตัวช่วยไฟล์/runtime ของ memory host |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับปลั๊กอินที่เกี่ยวข้องกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | facade ของ Active Memory runtime สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | alias แบบเป็นกลางต่อผู้จัดจำหน่ายสำหรับตัวช่วยสถานะของ memory host |
    | `plugin-sdk/memory-lancedb` | พื้นผิวตัวช่วย memory-lancedb แบบ bundled |
  </Accordion>

  <Accordion title="subpaths ของตัวช่วยแบบ bundled ที่สงวนไว้">
    | กลุ่ม | subpaths ปัจจุบัน | การใช้งานที่ตั้งใจไว้ |
    | --- | --- | --- |
    | เบราว์เซอร์ | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | ตัวช่วยสนับสนุนปลั๊กอินเบราว์เซอร์แบบ bundled (`browser-support` ยังคงเป็น compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | พื้นผิวตัวช่วย/runtime ของ Matrix แบบ bundled |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | พื้นผิวตัวช่วย/runtime ของ LINE แบบ bundled |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | พื้นผิวตัวช่วยของ IRC แบบ bundled |
    | ตัวช่วยเฉพาะช่องทางส่งข้อความ | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | seam สำหรับความเข้ากันได้/ตัวช่วยของช่องทางส่งข้อความแบบ bundled |
    | ตัวช่วยเฉพาะด้าน auth/ปลั๊กอิน | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | seam ของตัวช่วยฟีเจอร์/ปลั๊กอินแบบ bundled; ปัจจุบัน `plugin-sdk/github-copilot-token` export `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` และ `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้างปลั๊กอิน](/th/plugins/building-plugins)
