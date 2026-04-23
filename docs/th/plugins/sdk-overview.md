---
read_when:
    - คุณต้องการทราบว่าควร import จาก subpath ใดของ SDK 银雀assistant to=final
    - คุณต้องการเอกสารอ้างอิงสำหรับเมธอด registration ทั้งหมดบน `OpenClawPluginApi`
    - คุณกำลังค้นหา export เฉพาะรายการหนึ่งของ SDK
sidebarTitle: SDK Overview
summary: แผนที่การนำเข้า เอกสารอ้างอิง Registration API และสถาปัตยกรรม SDK
title: ภาพรวม Plugin SDK
x-i18n:
    generated_at: "2026-04-23T05:47:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# ภาพรวม Plugin SDK

Plugin SDK คือสัญญาแบบมีชนิดระหว่าง plugins และ core หน้านี้คือ
เอกสารอ้างอิงสำหรับ **สิ่งที่ควร import** และ **สิ่งที่คุณสามารถ register ได้**

<Tip>
  **กำลังมองหาคู่มือ how-to อยู่หรือไม่?**
  - Plugin แรกใช่ไหม? เริ่มที่ [Getting Started](/th/plugins/building-plugins)
  - Channel Plugin? ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
  - Provider Plugin? ดู [Provider Plugins](/th/plugins/sdk-provider-plugins)
</Tip>

## ธรรมเนียมการ import

ให้ import จาก subpath ที่เฉพาะเจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

แต่ละ subpath เป็นโมดูลขนาดเล็กที่แยกตัวเองได้ สิ่งนี้ช่วยให้การเริ่มต้นเร็วและ
ป้องกันปัญหา circular dependency สำหรับ helper ของ entry/build แบบเฉพาะช่องทาง
ควรใช้ `openclaw/plugin-sdk/channel-core`; และคง `openclaw/plugin-sdk/core` ไว้สำหรับ
พื้นผิว umbrella ที่กว้างกว่าและ helper ที่ใช้ร่วมกัน เช่น
`buildChannelConfigSchema`

อย่าเพิ่มหรือพึ่งพา seam แบบ convenience ที่ตั้งชื่อตาม provider เช่น
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` หรือ
seam ของ helper ที่ติดแบรนด์ช่องทาง Bundled plugins ควรประกอบ generic
SDK subpaths ภายใน barrel `api.ts` หรือ `runtime-api.ts` ของตัวเอง และ core
ควรใช้ barrel ภายใน plugin เหล่านั้น หรือเพิ่มสัญญา SDK แบบ generic ที่แคบเมื่อความจำเป็นนั้นเป็นแบบข้ามช่องทางจริง ๆ

แผนที่ export ที่ถูกสร้างยังคงมี bundled-plugin helper seam ชุดเล็ก ๆ
เช่น `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` และ `plugin-sdk/matrix*`
subpath เหล่านั้นมีไว้สำหรับการบำรุงรักษา bundled-plugin และความเข้ากันได้เท่านั้น; จงใจเว้นไม่ใส่ไว้ในตารางทั่วไปด้านล่าง และไม่ใช่เส้นทาง import ที่แนะนำสำหรับ third-party plugin ใหม่

## เอกสารอ้างอิงของ subpath

subpath ที่ใช้บ่อยที่สุด จัดกลุ่มตามวัตถุประสงค์ รายการเต็มที่สร้างขึ้นซึ่งมีมากกว่า
200 subpath อยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`

reserved bundled-plugin helper subpath ยังคงปรากฏอยู่ในรายการที่สร้างขึ้นนั้น
ให้ถือว่าสิ่งเหล่านั้นเป็นพื้นผิวรายละเอียดการติดตั้ง/ความเข้ากันได้ เว้นแต่หน้าเอกสารจะ
ระบุอย่างชัดเจนว่าตัวใดเป็นสาธารณะ

### Plugin entry

| Subpath                     | export หลัก                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="subpath ของ Channel">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | export ของ Zod schema สำหรับราก `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, พร้อม `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | helper สำหรับ setup wizard ที่ใช้ร่วมกัน, พรอมป์ allowlist, ตัวสร้างสถานะ setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | helper สำหรับ multi-account config/action-gate และ helper สำหรับ default-account fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper สำหรับ normalize account-id |
    | `plugin-sdk/account-resolution` | helper สำหรับค้นหา account + default-fallback |
    | `plugin-sdk/account-helpers` | helper แบบแคบสำหรับ account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | ชนิดของ channel config schema |
    | `plugin-sdk/telegram-command-config` | helper สำหรับ normalize/validate Telegram custom-command พร้อม bundled-contract fallback |
    | `plugin-sdk/command-gating` | helper แบบแคบสำหรับ authorization gate ของคำสั่ง |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper สำหรับ lifecycle/finalization ของ draft stream |
    | `plugin-sdk/inbound-envelope` | helper สำหรับ route ขาเข้าและตัวสร้าง envelope แบบใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | helper แบบใช้ร่วมกันสำหรับบันทึกและ dispatch ขาเข้า |
    | `plugin-sdk/messaging-targets` | helper สำหรับ parse/match target |
    | `plugin-sdk/outbound-media` | helper แบบใช้ร่วมกันสำหรับการโหลด outbound media |
    | `plugin-sdk/outbound-runtime` | helper สำหรับ outbound identity, send delegate และการวางแผน payload |
    | `plugin-sdk/poll-runtime` | helper แบบแคบสำหรับ normalize poll |
    | `plugin-sdk/thread-bindings-runtime` | helper สำหรับ lifecycle และ adapter ของ thread-binding |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload ของ agent media แบบเดิม |
    | `plugin-sdk/conversation-runtime` | helper สำหรับ conversation/thread binding, pairing และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | helper สำหรับ runtime config snapshot |
    | `plugin-sdk/runtime-group-policy` | helper สำหรับ resolve runtime group-policy |
    | `plugin-sdk/channel-status` | helper แบบใช้ร่วมกันสำหรับ snapshot/summary ของสถานะช่องทาง |
    | `plugin-sdk/channel-config-primitives` | primitive แบบแคบสำหรับ channel config-schema |
    | `plugin-sdk/channel-config-writes` | helper สำหรับ authorization ของการเขียน channel config |
    | `plugin-sdk/channel-plugin-common` | export prelude ที่ใช้ร่วมกันของ channel plugin |
    | `plugin-sdk/allowlist-config-edit` | helper สำหรับแก้ไข/อ่าน allowlist config |
    | `plugin-sdk/group-access` | helper แบบใช้ร่วมกันสำหรับการตัดสินใจด้าน group-access |
    | `plugin-sdk/direct-dm` | helper แบบใช้ร่วมกันสำหรับ auth/guard ของ direct-DM |
    | `plugin-sdk/interactive-runtime` | helper สำหรับการนำเสนอข้อความเชิงความหมาย การส่งมอบ และการตอบกลับแบบ interactive แบบเดิม ดู [Message Presentation](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | compatibility barrel สำหรับ inbound debounce, mention matching, mention-policy helper และ envelope helper |
    | `plugin-sdk/channel-mention-gating` | helper แบบแคบสำหรับ mention-policy โดยไม่มีพื้นผิว inbound runtime ที่กว้างกว่า |
    | `plugin-sdk/channel-location` | helper สำหรับบริบทและการจัดรูปแบบตำแหน่งของช่องทาง |
    | `plugin-sdk/channel-logging` | helper สำหรับ logging ของช่องทางในกรณี inbound drop และ typing/ack failure |
    | `plugin-sdk/channel-send-result` | ชนิดของ reply result |
    | `plugin-sdk/channel-actions` | helper สำหรับ channel message-action พร้อม helper ของ native schema แบบ deprecated ที่ยังคงไว้เพื่อความเข้ากันได้ของ plugin |
    | `plugin-sdk/channel-targets` | helper สำหรับ parse/match target |
    | `plugin-sdk/channel-contract` | ชนิดของ channel contract |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อ feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | helper แบบแคบสำหรับ secret-contract เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และชนิดของ secret target |
  </Accordion>

  <Accordion title="subpath ของ Provider">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | helper สำหรับการตั้งค่า provider แบบ local/self-hosted ที่คัดสรรแล้ว |
    | `plugin-sdk/self-hosted-provider-setup` | helper แบบโฟกัสสำหรับการตั้งค่า provider แบบ self-hosted ที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของ CLI backend + ค่าคงที่ของ watchdog |
    | `plugin-sdk/provider-auth-runtime` | helper สำหรับ resolve API-key ในรันไทม์สำหรับ provider plugin |
    | `plugin-sdk/provider-auth-api-key` | helper สำหรับ onboarding/profile-write ของ API-key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์ auth ของ OAuth มาตรฐาน |
    | `plugin-sdk/provider-auth-login` | helper สำหรับ interactive login ที่ใช้ร่วมกันใน provider plugin |
    | `plugin-sdk/provider-env-vars` | helper สำหรับ lookup env-var ของ auth ใน provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy แบบใช้ร่วมกัน, helper สำหรับ provider-endpoint และ helper สำหรับ normalize model-id เช่น `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | helper สำหรับความสามารถของ HTTP/endpoint แบบ generic ของ provider รวมถึง helper สำหรับ multipart form ของ audio transcription |
    | `plugin-sdk/provider-web-fetch-contract` | helper แบบแคบสำหรับสัญญา config/selection ของ web-fetch เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | helper สำหรับ registration/cache/runtime ของ web-fetch provider |
    | `plugin-sdk/provider-web-search-config-contract` | helper แบบแคบสำหรับ config/credential ของ web-search สำหรับ provider ที่ไม่ต้องการ wiring สำหรับเปิดใช้ plugin |
    | `plugin-sdk/provider-web-search-contract` | helper แบบแคบสำหรับสัญญา config/credential ของ web-search เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และ setter/getter ของ credential แบบมีขอบเขต |
    | `plugin-sdk/provider-web-search` | helper สำหรับ registration/cache/runtime ของ web-search provider |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การทำความสะอาด Gemini schema + diagnostics และ helper ด้าน compat ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และสิ่งที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดของ stream wrapper และ helper wrapper แบบใช้ร่วมกันสำหรับ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | helper สำหรับ native provider transport เช่น guarded fetch, transport message transform และ writable transport event stream |
    | `plugin-sdk/provider-onboard` | helper สำหรับ patch config ใน onboarding |
    | `plugin-sdk/global-singleton` | helper สำหรับ singleton/map/cache ระดับโปรเซส |
  </Accordion>

  <Accordion title="subpath ด้าน Auth และความปลอดภัย">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper สำหรับ command registry, helper สำหรับ sender-authorization |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | helper สำหรับ approver resolution และ same-chat action-auth |
    | `plugin-sdk/approval-client-runtime` | helper สำหรับโปรไฟล์/ตัวกรองของ native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | adapter สำหรับ native approval capability/delivery |
    | `plugin-sdk/approval-gateway-runtime` | helper แบบใช้ร่วมกันสำหรับ approval gateway-resolution |
    | `plugin-sdk/approval-handler-adapter-runtime` | helper แบบ lightweight สำหรับการโหลด native approval adapter สำหรับ hot channel entrypoints |
    | `plugin-sdk/approval-handler-runtime` | helper ของ approval handler runtime ที่กว้างกว่า; ควรใช้ seam แบบ adapter/gateway ที่แคบกว่าหากเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | helper สำหรับ native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | helper สำหรับ payload การตอบกลับ approval ของ exec/plugin |
    | `plugin-sdk/command-auth-native` | helper สำหรับ native command auth + native session-target |
    | `plugin-sdk/command-detection` | helper แบบใช้ร่วมกันสำหรับการตรวจจับคำสั่ง |
    | `plugin-sdk/command-surface` | helper สำหรับการ normalize command-body และ command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | helper แบบแคบสำหรับการรวบรวม secret-contract ของพื้นผิว secret ของ channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | helper แบบแคบของ `coerceSecretRef` และ SecretRef typing สำหรับการ parse secret-contract/config |
    | `plugin-sdk/security-runtime` | helper แบบใช้ร่วมกันสำหรับ trust, DM gating, external-content และการเก็บรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | helper สำหรับ host allowlist และนโยบาย SSRF ของเครือข่าย private |
    | `plugin-sdk/ssrf-dispatcher` | helper แบบแคบสำหรับ pinned-dispatcher โดยไม่มีพื้นผิว infra runtime ที่กว้าง |
    | `plugin-sdk/ssrf-runtime` | helper สำหรับ pinned-dispatcher, SSRF-guarded fetch และ SSRF policy |
    | `plugin-sdk/secret-input` | helper สำหรับ parse secret input |
    | `plugin-sdk/webhook-ingress` | helper สำหรับคำขอ/เป้าหมายของ Webhook |
    | `plugin-sdk/webhook-request-guards` | helper สำหรับขนาด body/timeout ของคำขอ |
  </Accordion>

  <Accordion title="subpath ด้าน Runtime และ storage">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | helper แบบกว้างสำหรับ runtime/logging/backup/plugin-install |
    | `plugin-sdk/runtime-env` | helper แบบแคบสำหรับ runtime env, logger, timeout, retry และ backoff |
    | `plugin-sdk/channel-runtime-context` | helper แบบ generic สำหรับ registration และ lookup ของ channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | helper แบบใช้ร่วมกันสำหรับคำสั่ง/hook/http/interactive ของ plugin |
    | `plugin-sdk/hook-runtime` | helper แบบใช้ร่วมกันสำหรับไปป์ไลน์ของ webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | helper สำหรับ lazy runtime import/binding เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | helper สำหรับ process exec |
    | `plugin-sdk/cli-runtime` | helper สำหรับการจัดรูปแบบ/wait/version ของ CLI |
    | `plugin-sdk/gateway-runtime` | helper สำหรับ gateway client และการ patch channel-status |
    | `plugin-sdk/config-runtime` | helper สำหรับโหลด/เขียน config และ helper สำหรับ lookup plugin-config |
    | `plugin-sdk/telegram-command-config` | helper สำหรับ normalize ชื่อ/คำอธิบายคำสั่ง Telegram และการตรวจสอบ duplicate/conflict แม้ในกรณีที่พื้นผิว bundled Telegram contract ใช้งานไม่ได้ |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ file-reference autolink โดยไม่มี text-runtime barrel ที่กว้าง |
    | `plugin-sdk/approval-runtime` | helper สำหรับ exec/plugin approval, ตัวสร้าง approval-capability, auth/profile helper, native routing/runtime helper |
    | `plugin-sdk/reply-runtime` | helper แบบใช้ร่วมกันสำหรับ inbound/reply runtime, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | helper แบบแคบสำหรับ reply dispatch/finalize |
    | `plugin-sdk/reply-history` | helper แบบใช้ร่วมกันสำหรับ short-window reply-history เช่น `buildHistoryContext`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | helper แบบแคบสำหรับ text/markdown chunking |
    | `plugin-sdk/session-store-runtime` | helper สำหรับ path + updated-at ของ session store |
    | `plugin-sdk/state-paths` | helper สำหรับพาธของ state/OAuth dir |
    | `plugin-sdk/routing` | helper สำหรับ route/session-key/account binding เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | helper แบบใช้ร่วมกันสำหรับสรุปสถานะของ channel/account, ค่าเริ่มต้นของ runtime-state และ helper สำหรับ issue metadata |
    | `plugin-sdk/target-resolver-runtime` | helper แบบใช้ร่วมกันสำหรับ target resolver |
    | `plugin-sdk/string-normalization-runtime` | helper สำหรับ normalize slug/string |
    | `plugin-sdk/request-url` | ดึง URL แบบสตริงจากอินพุตลักษณะ fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบมีเวลา พร้อมผลลัพธ์ stdout/stderr ที่ normalized |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับ tool/CLI |
    | `plugin-sdk/tool-payload` | ดึง payload แบบ normalized จากอ็อบเจ็กต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
    | `plugin-sdk/temp-path` | helper แบบใช้ร่วมกันสำหรับพาธดาวน์โหลดชั่วคราว |
    | `plugin-sdk/logging-core` | helper สำหรับ subsystem logger และ redaction |
    | `plugin-sdk/markdown-table-runtime` | helper สำหรับโหมด markdown table |
    | `plugin-sdk/json-store` | helper ขนาดเล็กสำหรับอ่าน/เขียนสถานะ JSON |
    | `plugin-sdk/file-lock` | helper สำหรับ file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | helper สำหรับ disk-backed dedupe cache |
    | `plugin-sdk/acp-runtime` | helper สำหรับ ACP runtime/session และ reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | การ resolve ACP binding แบบอ่านอย่างเดียวโดยไม่มี lifecycle startup imports |
    | `plugin-sdk/agent-config-primitives` | primitive แบบแคบสำหรับ agent runtime config-schema |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบหลวม |
    | `plugin-sdk/dangerous-name-runtime` | helper สำหรับการ resolve dangerous-name matching |
    | `plugin-sdk/device-bootstrap` | helper สำหรับ device bootstrap และ pairing token |
    | `plugin-sdk/extension-shared` | primitive แบบใช้ร่วมกันสำหรับ passive-channel, status และ ambient proxy helper |
    | `plugin-sdk/models-provider-runtime` | helper สำหรับคำสั่ง `/models` และการตอบกลับของ provider |
    | `plugin-sdk/skill-commands-runtime` | helper สำหรับแสดงรายการคำสั่งของ Skills |
    | `plugin-sdk/native-command-registry` | helper สำหรับ registry/build/serialize ของ native command |
    | `plugin-sdk/agent-harness` | พื้นผิว trusted-plugin แบบทดลองสำหรับ low-level agent harnesses: harness types, helper สำหรับ steer/abort ของ active-run, helper สำหรับ OpenClaw tool bridge และยูทิลิตีผลลัพธ์ของ attempt |
    | `plugin-sdk/provider-zai-endpoint` | helper สำหรับตรวจจับ endpoint ของ Z.AI |
    | `plugin-sdk/infra-runtime` | helper สำหรับ system event/Heartbeat |
    | `plugin-sdk/collection-runtime` | helper ขนาดเล็กสำหรับ bounded cache |
    | `plugin-sdk/diagnostic-runtime` | helper สำหรับ diagnostic flag และ event |
    | `plugin-sdk/error-runtime` | helper สำหรับ error graph, formatting, shared error classification และ `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | helper สำหรับ wrapped fetch, proxy และ pinned lookup |
    | `plugin-sdk/runtime-fetch` | runtime fetch ที่รับรู้ dispatcher โดยไม่มี import ของ proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบ bounded โดยไม่มีพื้นผิว media runtime ที่กว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะการผูกของการสนทนาปัจจุบัน โดยไม่มี configured binding routing หรือ pairing store |
    | `plugin-sdk/session-store-runtime` | helper สำหรับอ่าน session-store โดยไม่มี import ที่กว้างของ config writes/maintenance |
    | `plugin-sdk/context-visibility-runtime` | การ resolve context visibility และการกรอง supplemental context โดยไม่มี import ด้าน config/security ที่กว้าง |
    | `plugin-sdk/string-coerce-runtime` | helper แบบแคบสำหรับ primitive record/string coercion และ normalization โดยไม่มี markdown/logging imports |
    | `plugin-sdk/host-runtime` | helper สำหรับ normalize hostname และ SCP host |
    | `plugin-sdk/retry-runtime` | helper สำหรับ retry config และ retry runner |
    | `plugin-sdk/agent-runtime` | helper สำหรับ agent dir/identity/workspace |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่รองรับด้วย config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="subpath ด้าน Capability และการทดสอบ">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | helper แบบใช้ร่วมกันสำหรับ media fetch/transform/store พร้อมตัวสร้าง media payload |
    | `plugin-sdk/media-generation-runtime` | helper แบบใช้ร่วมกันสำหรับ failover ใน media-generation, การเลือก candidate และข้อความเมื่อโมเดลหาย |
    | `plugin-sdk/media-understanding` | ชนิดของ provider สำหรับ media understanding พร้อม export ของ helper ฝั่ง provider สำหรับภาพ/เสียง |
    | `plugin-sdk/text-runtime` | helper แบบใช้ร่วมกันสำหรับ text/markdown/logging เช่น การลบข้อความที่ผู้ช่วยมองเห็นได้, helper สำหรับ render/chunking/table ของ markdown, helper สำหรับ redaction, helper สำหรับ directive-tag และยูทิลิตีข้อความที่ปลอดภัย |
    | `plugin-sdk/text-chunking` | helper สำหรับ outbound text chunking |
    | `plugin-sdk/speech` | ชนิดของ speech provider พร้อม helper ฝั่ง provider สำหรับ directive, registry และ validation |
    | `plugin-sdk/speech-core` | helper แบบใช้ร่วมกันสำหรับชนิดของ speech provider, registry, directive และ normalization |
    | `plugin-sdk/realtime-transcription` | ชนิดของ realtime transcription provider, helper สำหรับ registry และ helper สำหรับ WebSocket session แบบใช้ร่วมกัน |
    | `plugin-sdk/realtime-voice` | ชนิดของ realtime voice provider และ helper สำหรับ registry |
    | `plugin-sdk/image-generation` | ชนิดของ image generation provider |
    | `plugin-sdk/image-generation-core` | helper แบบใช้ร่วมกันสำหรับชนิดของ image-generation, failover, auth และ registry |
    | `plugin-sdk/music-generation` | ชนิดของ provider/request/result สำหรับ music generation |
    | `plugin-sdk/music-generation-core` | helper แบบใช้ร่วมกันสำหรับชนิดของ music-generation, failover helper, การค้นหา provider และการ parse model-ref |
    | `plugin-sdk/video-generation` | ชนิดของ provider/request/result สำหรับ video generation |
    | `plugin-sdk/video-generation-core` | helper แบบใช้ร่วมกันสำหรับชนิดของ video-generation, failover helper, การค้นหา provider และการ parse model-ref |
    | `plugin-sdk/webhook-targets` | registry ของเป้าหมาย Webhook และ helper สำหรับการติดตั้ง route |
    | `plugin-sdk/webhook-path` | helper สำหรับ normalize พาธของ Webhook |
    | `plugin-sdk/web-media` | helper แบบใช้ร่วมกันสำหรับการโหลดสื่อ remote/local |
    | `plugin-sdk/zod` | re-export ของ `zod` สำหรับผู้ใช้ Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="subpath ด้าน Memory">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิว helper ของ memory-core ที่มาพร้อมกัน สำหรับ helper ของ manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade ของรันไทม์สำหรับ memory index/search |
    | `plugin-sdk/memory-core-host-engine-foundation` | export ของ memory host foundation engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของ memory host, การเข้าถึง registry, local provider และ helper แบบ generic สำหรับ batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | export ของ memory host QMD engine |
    | `plugin-sdk/memory-core-host-engine-storage` | export ของ memory host storage engine |
    | `plugin-sdk/memory-core-host-multimodal` | helper แบบ multimodal ของ memory host |
    | `plugin-sdk/memory-core-host-query` | helper สำหรับ query ของ memory host |
    | `plugin-sdk/memory-core-host-secret` | helper สำหรับ secret ของ memory host |
    | `plugin-sdk/memory-core-host-events` | helper สำหรับ event journal ของ memory host |
    | `plugin-sdk/memory-core-host-status` | helper สำหรับสถานะของ memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | helper ของ CLI runtime สำหรับ memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | helper ของ core runtime สำหรับ memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | helper ด้านไฟล์/รันไทม์ของ memory host |
    | `plugin-sdk/memory-host-core` | alias แบบ vendor-neutral สำหรับ helper ของ memory host core runtime |
    | `plugin-sdk/memory-host-events` | alias แบบ vendor-neutral สำหรับ helper ของ memory host event journal |
    | `plugin-sdk/memory-host-files` | alias แบบ vendor-neutral สำหรับ helper ด้านไฟล์/รันไทม์ของ memory host |
    | `plugin-sdk/memory-host-markdown` | helper แบบใช้ร่วมกันสำหรับ managed-markdown สำหรับ plugin ที่อยู่ใกล้เคียง memory |
    | `plugin-sdk/memory-host-search` | facade ของ active memory runtime สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | alias แบบ vendor-neutral สำหรับ helper ด้านสถานะของ memory host |
    | `plugin-sdk/memory-lancedb` | พื้นผิว helper ของ memory-lancedb ที่มาพร้อมกัน |
  </Accordion>

  <Accordion title="subpath ของ bundled-helper ที่สงวนไว้">
    | Family | subpath ปัจจุบัน | การใช้งานที่ตั้งใจไว้ |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | helper สนับสนุน bundled browser plugin (`browser-support` ยังคงเป็น compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | พื้นผิว helper/runtime ของ Matrix ที่มาพร้อมกัน |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | พื้นผิว helper/runtime ของ LINE ที่มาพร้อมกัน |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | พื้นผิว helper ของ IRC ที่มาพร้อมกัน |
    | helper เฉพาะช่องทาง | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | seam สำหรับความเข้ากันได้/helper ของช่องทางที่มาพร้อมกัน |
    | helper เฉพาะ auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | seam ของ helper สำหรับฟีเจอร์/plugin ที่มาพร้อมกัน; ปัจจุบัน `plugin-sdk/github-copilot-token` export `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` และ `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registration API

callback `register(api)` จะได้รับอ็อบเจ็กต์ `OpenClawPluginApi` พร้อมเมธอดเหล่านี้:

### การ register ความสามารถ

| เมธอด                                           | สิ่งที่ register                     |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Text inference (LLM)                 |
| `api.registerAgentHarness(...)`                  | ตัวรันเอเจนต์ระดับล่างแบบทดลอง      |
| `api.registerCliBackend(...)`                    | Local CLI inference backend          |
| `api.registerChannel(...)`                       | ช่องทางการส่งข้อความ                 |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis       |
| `api.registerRealtimeTranscriptionProvider(...)` | การถอดเสียงแบบ realtime ที่สตรีมได้ |
| `api.registerRealtimeVoiceProvider(...)`         | เซสชันเสียงแบบ realtime สองทิศทาง   |
| `api.registerMediaUnderstandingProvider(...)`    | การวิเคราะห์ภาพ/เสียง/วิดีโอ         |
| `api.registerImageGenerationProvider(...)`       | การสร้างภาพ                          |
| `api.registerMusicGenerationProvider(...)`       | การสร้างดนตรี                        |
| `api.registerVideoGenerationProvider(...)`       | การสร้างวิดีโอ                       |
| `api.registerWebFetchProvider(...)`              | ผู้ให้บริการดึง/ขูดเว็บ              |
| `api.registerWebSearchProvider(...)`             | การค้นหาเว็บ                         |

### Tools และคำสั่ง

| เมธอด                          | สิ่งที่ register                                  |
| ------------------------------- | ------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent tool (required หรือ `{ optional: true }`)   |
| `api.registerCommand(def)`      | คำสั่งกำหนดเอง (ข้าม LLM)                        |

### โครงสร้างพื้นฐาน

| เมธอด                                          | สิ่งที่ register                         |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Event hook                              |
| `api.registerHttpRoute(params)`                 | HTTP endpoint ของ Gateway               |
| `api.registerGatewayMethod(name, handler)`      | เมธอด Gateway RPC                       |
| `api.registerCli(registrar, opts?)`             | CLI subcommand                          |
| `api.registerService(service)`                  | บริการเบื้องหลัง                        |
| `api.registerInteractiveHandler(registration)`  | Interactive handler                     |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi embedded-runner extension factory    |
| `api.registerMemoryPromptSupplement(builder)`   | ส่วนพรอมป์แบบ additive ที่อยู่ใกล้เคียง memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | corpus เสริมสำหรับการค้นหา/อ่าน memory แบบ additive |

namespace สำหรับแอดมินของ core ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะคงเป็น `operator.admin` เสมอ แม้ plugin จะพยายามกำหนด
gateway method scope ที่แคบกว่าก็ตาม ควรใช้ prefix ที่เฉพาะ plugin สำหรับ
เมธอดที่ plugin เป็นเจ้าของ

ใช้ `api.registerEmbeddedExtensionFactory(...)` เมื่อ plugin จำเป็นต้องใช้ Pi-native
event timing ระหว่าง OpenClaw embedded run ตัวอย่างเช่น การเขียนทับ
`tool_result` แบบ async ที่ต้องเกิดขึ้นก่อนข้อความผลลัพธ์สุดท้ายของ tool จะถูกส่งออก
ปัจจุบันนี่เป็น seam สำหรับ bundled-plugin: มีเพียง bundled plugin เท่านั้นที่ register ได้ และ
ต้องประกาศ `contracts.embeddedExtensionFactories: ["pi"]` ใน
`openclaw.plugin.json` ให้คงการใช้ hook ปกติของ OpenClaw plugin สำหรับทุกอย่างที่
ไม่ต้องใช้ seam ระดับล่างนั้น

### metadata สำหรับการ register CLI

`api.registerCli(registrar, opts?)` รับ metadata ระดับบนสุดได้สองแบบ:

- `commands`: root ของคำสั่งแบบ explicit ที่ registrar เป็นเจ้าของ
- `descriptors`: command descriptor ระดับ parse-time ที่ใช้สำหรับ root CLI help,
  routing และการ register CLI ของ plugin แบบ lazy

หากคุณต้องการให้คำสั่งของ plugin ยังคง lazy-loaded ในเส้นทาง root CLI ปกติ
ให้ระบุ `descriptors` ที่ครอบคลุมทุก root คำสั่งระดับบนสุดที่ registrar นั้นเปิดเผย

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "จัดการบัญชี Matrix, การยืนยัน, อุปกรณ์ และสถานะของโปรไฟล์",
        hasSubcommands: true,
      },
    ],
  },
);
```

ใช้ `commands` เพียงอย่างเดียวเฉพาะเมื่อคุณไม่ต้องการ lazy root CLI registration
เส้นทางความเข้ากันได้แบบ eager นั้นยังคงรองรับอยู่ แต่จะไม่ติดตั้ง
placeholder ที่รองรับ descriptor สำหรับการ lazy loading ในช่วง parse-time

### การ register CLI backend

`api.registerCliBackend(...)` ทำให้ plugin สามารถเป็นเจ้าของ config เริ่มต้นสำหรับ local
AI CLI backend เช่น `codex-cli`

- `id` ของ backend จะกลายเป็น prefix ของ provider ใน model ref เช่น `codex-cli/gpt-5`
- `config` ของ backend ใช้รูปทรงเดียวกับ `agents.defaults.cliBackends.<id>`
- config ของผู้ใช้ยังคงมีลำดับความสำคัญสูงกว่า OpenClaw จะ merge `agents.defaults.cliBackends.<id>` ทับค่าเริ่มต้นของ plugin ก่อนรัน CLI
- ใช้ `normalizeConfig` เมื่อ backend ต้องการการเขียนเพื่อความเข้ากันได้หลังการ merge
  (เช่น normalize รูปแบบแฟล็กแบบเก่า)

### ช่อง exclusive

| เมธอด                                     | สิ่งที่ register                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context engine (มี active ได้ครั้งละหนึ่งตัว) callback `assemble()` จะได้รับ `availableTools` และ `citationsMode` เพื่อให้ engine ปรับแต่งส่วนเพิ่มของพรอมป์ได้ |
| `api.registerMemoryCapability(capability)` | ความสามารถด้าน memory แบบรวมศูนย์                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | ตัวสร้างส่วนพรอมป์ของ memory                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | ตัว resolve แผน memory flush                                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | adapter ของ memory runtime                                                                                                                                   |

### adapter ของ memory embedding

| เมธอด                                         | สิ่งที่ register                                |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter ของ memory embedding สำหรับ plugin ที่ใช้งานอยู่ |

- `registerMemoryCapability` คือ API แบบ exclusive ที่แนะนำสำหรับ memory-plugin
- `registerMemoryCapability` อาจเปิดเผย `publicArtifacts.listArtifacts(...)`
  ได้ด้วย เพื่อให้ companion plugin สามารถบริโภค exported memory artifacts ผ่าน
  `openclaw/plugin-sdk/memory-host-core` แทนการเข้าถึง layout ส่วนตัวของ memory plugin ใดตัวหนึ่งโดยตรง
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` และ
  `registerMemoryRuntime` เป็น API แบบ exclusive ของ memory-plugin แบบเข้ากันได้กับของเดิม
- `registerMemoryEmbeddingProvider` ทำให้ active memory plugin สามารถ register
  embedding adapter id ได้หนึ่งตัวหรือมากกว่า (เช่น `openai`, `gemini` หรือ id ที่กำหนดเองโดย plugin)
- config ของผู้ใช้ เช่น `agents.defaults.memorySearch.provider` และ
  `agents.defaults.memorySearch.fallback` จะ resolve เทียบกับ adapter id ที่ register เหล่านั้น

### Events และวงจรชีวิต

| เมธอด                                       | หน้าที่ของมัน                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | lifecycle hook แบบมีชนิด      |
| `api.onConversationBindingResolved(handler)` | callback ของ conversation binding |

### ความหมายของการตัดสินใจใน Hook

- `before_tool_call`: การคืนค่า `{ block: true }` ถือเป็นคำตัดสินสุดท้าย เมื่อมี handler ใดตั้งค่านี้ไว้ handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: การคืนค่า `{ block: false }` จะถูกถือว่าไม่มีคำตัดสิน (เหมือนกับการไม่ส่ง `block`) ไม่ใช่การ override
- `before_install`: การคืนค่า `{ block: true }` ถือเป็นคำตัดสินสุดท้าย เมื่อมี handler ใดตั้งค่านี้ไว้ handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: การคืนค่า `{ block: false }` จะถูกถือว่าไม่มีคำตัดสิน (เหมือนกับการไม่ส่ง `block`) ไม่ใช่การ override
- `reply_dispatch`: การคืนค่า `{ handled: true, ... }` ถือเป็นคำตัดสินสุดท้าย เมื่อมี handler ใดอ้างสิทธิ์การ dispatch แล้ว handler ที่มีลำดับความสำคัญต่ำกว่าและเส้นทาง default model dispatch จะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: true }` ถือเป็นคำตัดสินสุดท้าย เมื่อมี handler ใดตั้งค่านี้ไว้ handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: การคืนค่า `{ cancel: false }` จะถูกถือว่าไม่มีคำตัดสิน (เหมือนกับการไม่ส่ง `cancel`) ไม่ใช่การ override
- `message_received`: ใช้ฟิลด์ `threadId` แบบมีชนิดเมื่อคุณต้องการกำหนดเส้นทาง thread/topic ขาเข้า ให้คง `metadata` ไว้สำหรับข้อมูลเสริมเฉพาะช่องทาง
- `message_sending`: ใช้ฟิลด์กำหนดเส้นทางแบบมีชนิด `replyToId` / `threadId` ก่อน fallback ไปยัง `metadata` เฉพาะช่องทาง
- `gateway_start`: ใช้ `ctx.config`, `ctx.workspaceDir` และ `ctx.getCron?.()` สำหรับสถานะเริ่มต้นที่ gateway เป็นเจ้าของ แทนการพึ่งพา hook ภายใน `gateway:startup`

### ฟิลด์ของอ็อบเจ็กต์ API

| ฟิลด์                    | ชนิด                      | คำอธิบาย                                                                                      |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                                 |
| `api.name`               | `string`                  | ชื่อที่ใช้แสดง                                                                                |
| `api.version`            | `string?`                 | เวอร์ชันของ Plugin (ไม่บังคับ)                                                                |
| `api.description`        | `string?`                 | คำอธิบายของ Plugin (ไม่บังคับ)                                                                |
| `api.source`             | `string`                  | พาธแหล่งที่มาของ Plugin                                                                        |
| `api.rootDir`            | `string?`                 | ไดเรกทอรีรากของ Plugin (ไม่บังคับ)                                                             |
| `api.config`             | `OpenClawConfig`          | snapshot ของ config ปัจจุบัน (snapshot ของรันไทม์ในหน่วยความจำที่ active เมื่อมี)           |
| `api.pluginConfig`       | `Record<string, unknown>` | config เฉพาะของ Plugin จาก `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/th/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | logger แบบมีขอบเขต (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่าง startup/setup แบบเบาก่อน full-entry จะโหลด |
| `api.resolvePath(input)` | `(string) => string`      | resolve พาธแบบสัมพัทธ์กับรากของ plugin                                                        |

## ธรรมเนียมของโมดูลภายใน

ภายใน plugin ของคุณ ให้ใช้ไฟล์ barrel ในเครื่องสำหรับ import ภายใน:

```
my-plugin/
  api.ts            # export สาธารณะสำหรับผู้ใช้ภายนอก
  runtime-api.ts    # export ของรันไทม์สำหรับใช้ภายในเท่านั้น
  index.ts          # entry point ของ plugin
  setup-entry.ts    # entry แบบ setup-only น้ำหนักเบา (ไม่บังคับ)
```

<Warning>
  ห้าม import plugin ของตัวเองผ่าน `openclaw/plugin-sdk/<your-plugin>`
  จาก production code ให้กำหนดเส้นทาง import ภายในผ่าน `./api.ts` หรือ
  `./runtime-api.ts` พาธของ SDK มีไว้เป็นสัญญาภายนอกเท่านั้น
</Warning>

พื้นผิวสาธารณะของ bundled plugin ที่โหลดผ่าน facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` และไฟล์ entry สาธารณะอื่นที่คล้ายกัน) ตอนนี้จะให้ความสำคัญกับ
snapshot ของ active runtime config เมื่อ OpenClaw ทำงานอยู่แล้ว หากยังไม่มี runtime
snapshot มันจะ fallback ไปยัง config file ที่ resolve ได้บนดิสก์

Provider plugin ยังสามารถเปิดเผย plugin-local contract barrel แบบแคบได้ เมื่อ helper นั้นตั้งใจให้เป็นแบบเฉพาะ provider และยังไม่เหมาะจะอยู่ใน generic SDK
subpath ตัวอย่าง bundled ปัจจุบัน: Anthropic provider เก็บ Claude
stream helpers ไว้ใน seam สาธารณะ `api.ts` / `contract-api.ts` ของตัวเอง แทนการยกระดับ
ตรรกะ beta-header และ `service_tier` ของ Anthropic เข้าไปไว้ในสัญญา generic
`plugin-sdk/*`

ตัวอย่าง bundled อื่นในปัจจุบัน:

- `@openclaw/openai-provider`: `api.ts` export ตัวสร้าง provider,
  helper ของ default-model และตัวสร้าง realtime provider
- `@openclaw/openrouter-provider`: `api.ts` export ตัวสร้าง provider พร้อม
  helper สำหรับ onboarding/config

<Warning>
  production code ของ extension ควรหลีกเลี่ยงการ import แบบ `openclaw/plugin-sdk/<other-plugin>`
  ด้วย หาก helper นั้นเป็นของใช้ร่วมกันจริง ให้ยกระดับมันไปยัง neutral SDK subpath
  เช่น `openclaw/plugin-sdk/speech`, `.../provider-model-shared` หรือพื้นผิวอื่น
  ที่ยึดตามความสามารถ แทนที่จะผูก plugin สองตัวเข้าด้วยกัน
</Warning>

## ที่เกี่ยวข้อง

- [Entry Points](/th/plugins/sdk-entrypoints) — ตัวเลือกของ `definePluginEntry` และ `defineChannelPluginEntry`
- [Runtime Helpers](/th/plugins/sdk-runtime) — เอกสารอ้างอิง namespace `api.runtime` แบบเต็ม
- [Setup and Config](/th/plugins/sdk-setup) — การแพ็กเกจ, manifests, config schemas
- [Testing](/th/plugins/sdk-testing) — ยูทิลิตีสำหรับการทดสอบและกฎ lint
- [SDK Migration](/th/plugins/sdk-migration) — การย้ายจากพื้นผิวที่ deprecated แล้ว
- [Plugin Internals](/th/plugins/architecture) — สถาปัตยกรรมเชิงลึกและโมเดลความสามารถ
