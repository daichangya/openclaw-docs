---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณกำลังอัปเดต Plugin ไปสู่สถาปัตยกรรม Plugin แบบสมัยใหม่
    - คุณดูแล external plugin ของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากชั้นความเข้ากันได้ย้อนหลังแบบเดิมไปสู่ Plugin SDK แบบสมัยใหม่
title: การย้าย Plugin SDK
x-i18n:
    generated_at: "2026-04-23T05:47:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# การย้าย Plugin SDK

OpenClaw ได้เปลี่ยนจากชั้นความเข้ากันได้ย้อนหลังแบบกว้างไปสู่สถาปัตยกรรม plugin แบบสมัยใหม่
ที่ใช้ imports แบบเฉพาะเจาะจงและมีเอกสารกำกับ หาก Plugin ของคุณถูกสร้างก่อน
สถาปัตยกรรมใหม่นี้ คู่มือนี้จะช่วยคุณย้าย

## สิ่งที่กำลังเปลี่ยน

ระบบ plugin แบบเก่าให้สองพื้นผิวแบบเปิดกว้าง ซึ่งทำให้ plugins สามารถ import
ทุกอย่างที่ต้องการได้จาก entry point เดียว:

- **`openclaw/plugin-sdk/compat`** — import เดียวที่ re-export helpers
  หลายสิบตัว มันถูกสร้างขึ้นมาเพื่อให้ hook-based plugins รุ่นเก่ายังคงทำงานได้ระหว่างที่กำลังสร้าง
  สถาปัตยกรรม plugin ใหม่
- **`openclaw/extension-api`** — สะพานที่ให้ plugins เข้าถึง
  host-side helpers โดยตรง เช่น embedded agent runner

ตอนนี้ทั้งสองพื้นผิวนี้ถูกทำให้เป็น **deprecated** แล้ว มันยังทำงานได้ในรันไทม์ แต่
plugins ใหม่ต้องไม่ใช้ และ plugins ที่มีอยู่ควรย้ายก่อนที่ major release ถัดไป
จะลบมันออก

<Warning>
  ชั้นความเข้ากันได้ย้อนหลังจะถูกลบออกใน major release ในอนาคต
  Plugins ที่ยัง import จากพื้นผิวเหล่านี้จะพังเมื่อสิ่งนั้นเกิดขึ้น
</Warning>

## เหตุใดจึงมีการเปลี่ยนแปลงนี้

แนวทางเดิมก่อให้เกิดปัญหา:

- **การเริ่มต้นช้า** — import helper ตัวเดียวแต่โหลดโมดูลที่ไม่เกี่ยวข้องอีกหลายสิบตัว
- **Circular dependencies** — broad re-exports ทำให้สร้าง import cycles ได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** — ไม่มีทางบอกได้ว่า export ใดเสถียร และ export ใดเป็น internal

Plugin SDK แบบสมัยใหม่แก้ปัญหานี้: แต่ละ import path (`openclaw/plugin-sdk/\<subpath\>`)
เป็นโมดูลขนาดเล็ก แยกตัวเอง มีจุดประสงค์ชัดเจนและมีสัญญาที่มีเอกสารกำกับ

legacy provider convenience seams สำหรับ bundled channels ก็ถูกถอดออกแล้วเช่นกัน imports
เช่น `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
channel-branded helper seams และ
`openclaw/plugin-sdk/telegram-core` เป็นทางลัดภายใน mono-repo แบบ private ไม่ใช่
สัญญา plugin ที่เสถียร ให้ใช้ generic SDK subpaths แบบแคบแทน ภายใน
bundled plugin workspace ให้เก็บ provider-owned helpers ไว้ใน
`api.ts` หรือ `runtime-api.ts` ของ plugin นั้นเอง

ตัวอย่าง bundled provider ปัจจุบัน:

- Anthropic เก็บ Claude-specific stream helpers ไว้ใน seam
  `api.ts` / `contract-api.ts` ของตัวเอง
- OpenAI เก็บ provider builders, default-model helpers และ realtime provider
  builders ไว้ใน `api.ts` ของตัวเอง
- OpenRouter เก็บ provider builder และ onboarding/config helpers ไว้ใน
  `api.ts` ของตัวเอง

## วิธีการย้าย

<Steps>
  <Step title="ย้าย approval-native handlers ไปยัง capability facts">
    channel plugins ที่รองรับ approval ตอนนี้เปิดเผยพฤติกรรม native approval ผ่าน
    `approvalCapability.nativeRuntime` ร่วมกับ shared runtime-context registry

    การเปลี่ยนแปลงสำคัญ:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery ที่เกี่ยวกับ approval ออกจากการเชื่อมต่อแบบ legacy `plugin.auth` /
      `plugin.approvals` ไปไว้บน `approvalCapability`
    - `ChannelPlugin.approvals` ถูกลบออกจาก public channel-plugin
      contract แล้ว; ให้ย้ายฟิลด์ delivery/native/render ไปไว้บน `approvalCapability`
    - `plugin.auth` ยังคงมีไว้สำหรับโฟลว์ login/logout ของ channel เท่านั้น; core จะไม่อ่าน
      approval auth hooks ที่อยู่ตรงนั้นอีกต่อไป
    - ลงทะเบียน channel-owned runtime objects เช่น clients, tokens หรือ Bolt
      apps ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่ง notices สำหรับ reroute ที่ Plugin เป็นเจ้าของจาก native approval handlers;
      ขณะนี้ core เป็นเจ้าของ notices ที่ถูก route ไปที่อื่นจากผลการส่งจริง
    - เมื่อส่ง `channelRuntime` เข้า `createChannelManager(...)` ให้ส่งพื้นผิว
      `createPluginRuntime().channel` ที่ใช้งานจริง stubs แบบบางส่วนจะถูกปฏิเสธ

    ดู `/plugins/sdk-channel-plugins` สำหรับเลย์เอาต์ approval capability
    ปัจจุบัน

  </Step>

  <Step title="ตรวจสอบพฤติกรรม wrapper fallback บน Windows">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn`, Windows
    `.cmd`/`.bat` wrappers ที่ resolve ไม่ได้ ตอนนี้จะ fail closed เว้นแต่คุณจะส่ง
    `allowShellFallback: true` อย่างชัดเจน

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Set this only for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    หาก caller ของคุณไม่ได้พึ่ง shell fallback โดยเจตนา อย่าตั้ง
    `allowShellFallback` และจัดการข้อผิดพลาดที่ถูก throw แทน

  </Step>

  <Step title="ค้นหา deprecated imports">
    ค้นหาใน Plugin ของคุณว่า import มาจากพื้นผิว deprecated ตัวใดบ้าง:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="แทนที่ด้วย imports แบบเฉพาะเจาะจง">
    export แต่ละตัวจากพื้นผิวเดิมจะจับคู่กับ modern import path ที่เฉพาะเจาะจง:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    สำหรับ host-side helpers ให้ใช้ injected plugin runtime แทนการ import
    โดยตรง:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    รูปแบบเดียวกันนี้ใช้กับ legacy bridge helpers ตัวอื่นด้วย:

    | import เดิม | modern equivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="build และทดสอบ">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## เอกสารอ้างอิงพาธ import

  <Accordion title="ตารางพาธ import ที่พบบ่อย">
  | พาธ import | วัตถุประสงค์ | exports หลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | helper มาตรฐานสำหรับ plugin entry | `definePluginEntry` |
  | `plugin-sdk/core` | legacy umbrella re-export สำหรับนิยาม/builders ของ channel entry | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export ของ root config schema | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | helper สำหรับ single-provider entry | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | นิยาม/builders แบบเฉพาะเจาะจงของ channel entry | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | helpers ของ setup wizard แบบใช้ร่วมกัน | Allowlist prompts, setup status builders |
  | `plugin-sdk/setup-runtime` | helpers ของรันไทม์ช่วง setup | import-safe setup patch adapters, lookup-note helpers, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | helpers ของ setup adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | helpers ของ setup tooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | helpers แบบหลายบัญชี | Account list/config/action-gate helpers |
  | `plugin-sdk/account-id` | helpers ของ account-id | `DEFAULT_ACCOUNT_ID`, การ normalize account-id |
  | `plugin-sdk/account-resolution` | helpers สำหรับค้นหาบัญชี | Account lookup + default-fallback helpers |
  | `plugin-sdk/account-helpers` | helpers ของบัญชีแบบแคบ | Account list/account-action helpers |
  | `plugin-sdk/channel-setup` | adapters ของ setup wizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, พร้อม `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | primitive สำหรับ DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การต่อสาย reply prefix + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | factories สำหรับ config adapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | builders ของ config schema | ชนิดของ channel config schema |
  | `plugin-sdk/telegram-command-config` | helpers ของ Telegram command config | การ normalize ชื่อคำสั่ง, การตัดคำอธิบาย, การตรวจสอบ duplicate/conflict |
  | `plugin-sdk/channel-policy` | การ resolve นโยบาย group/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | helpers ของ account status และ draft stream lifecycle | `createAccountStatusSink`, helpers สำหรับการ finalize draft preview |
  | `plugin-sdk/inbound-envelope` | helpers ของ inbound envelope | helpers แบบใช้ร่วมกันสำหรับ route + envelope builder |
  | `plugin-sdk/inbound-reply-dispatch` | helpers ของ inbound reply | helpers แบบใช้ร่วมกันสำหรับ record-and-dispatch |
  | `plugin-sdk/messaging-targets` | การ parse messaging target | helpers สำหรับ parse/match target |
  | `plugin-sdk/outbound-media` | helpers ของ outbound media | การโหลด outbound media แบบใช้ร่วมกัน |
  | `plugin-sdk/outbound-runtime` | helpers ของ outbound runtime | helpers สำหรับ outbound identity/send delegate และ payload planning |
  | `plugin-sdk/thread-bindings-runtime` | helpers ของ thread-binding | helpers สำหรับ lifecycle และ adapter ของ thread-binding |
  | `plugin-sdk/agent-media-payload` | legacy media payload helpers | agent media payload builder สำหรับเลย์เอาต์ฟิลด์แบบเก่า |
  | `plugin-sdk/channel-runtime` | compatibility shim ที่ deprecated | utilities ของ legacy channel runtime เท่านั้น |
  | `plugin-sdk/channel-send-result` | ชนิดของ send result | ชนิดของ reply result |
  | `plugin-sdk/runtime-store` | ที่เก็บข้อมูล plugin แบบถาวร | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | helpers ของรันไทม์แบบกว้าง | helpers ของ runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | helpers ของ runtime env แบบแคบ | helpers ของ logger/runtime env, timeout, retry และ backoff |
  | `plugin-sdk/plugin-runtime` | helpers ของ plugin runtime แบบใช้ร่วมกัน | helpers สำหรับ plugin commands/hooks/http/interactive |
  | `plugin-sdk/hook-runtime` | helpers ของ hook pipeline | helpers แบบใช้ร่วมกันสำหรับ webhook/internal hook pipeline |
  | `plugin-sdk/lazy-runtime` | helpers ของ lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | helpers ของ process | helpers สำหรับ exec แบบใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | helpers ของ CLI runtime | helpers สำหรับ command formatting, waits, version |
  | `plugin-sdk/gateway-runtime` | helpers ของ Gateway | helpers ของ Gateway client และ channel-status patch |
  | `plugin-sdk/config-runtime` | helpers ของ config | helpers สำหรับ load/write config |
  | `plugin-sdk/telegram-command-config` | helpers ของ Telegram command | helpers สำหรับการตรวจสอบ Telegram command แบบ fallback-stable เมื่อไม่มีพื้นผิวสัญญา Telegram แบบ bundled |
  | `plugin-sdk/approval-runtime` | helpers ของ approval prompt | helpers ของ exec/plugin approval payload, approval capability/profile, native approval routing/runtime |
  | `plugin-sdk/approval-auth-runtime` | helpers ของ approval auth | Approver resolution, same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | helpers ของ approval client | Native exec approval profile/filter helpers |
  | `plugin-sdk/approval-delivery-runtime` | helpers ของ approval delivery | Native approval capability/delivery adapters |
  | `plugin-sdk/approval-gateway-runtime` | helpers ของ approval gateway | shared approval gateway-resolution helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | helpers ของ approval adapter | helpers แบบ lightweight สำหรับโหลด native approval adapter ใน hot channel entrypoints |
  | `plugin-sdk/approval-handler-runtime` | helpers ของ approval handler | helpers ของ approval handler แบบกว้าง; ควรใช้ seams แบบ adapter/gateway ที่แคบกว่าหากเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | helpers ของ approval target | helpers สำหรับ native approval target/account binding |
  | `plugin-sdk/approval-reply-runtime` | helpers ของ approval reply | helpers ของ exec/plugin approval reply payload |
  | `plugin-sdk/channel-runtime-context` | helpers ของ channel runtime-context | helpers แบบทั่วไปสำหรับ register/get/watch ของ channel runtime-context |
  | `plugin-sdk/security-runtime` | helpers ด้านความปลอดภัย | helpers แบบใช้ร่วมกันสำหรับ trust, DM gating, external-content และ secret-collection |
  | `plugin-sdk/ssrf-policy` | helpers ของนโยบาย SSRF | helpers สำหรับ host allowlist และ private-network policy |
  | `plugin-sdk/ssrf-runtime` | helpers ของ SSRF runtime | helpers ของ pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/collection-runtime` | helpers ของ bounded cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | helpers ของ diagnostic gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | helpers ของ error formatting | `formatUncaughtError`, `isApprovalNotFoundError`, helpers ของ error graph |
  | `plugin-sdk/fetch-runtime` | helpers ของ wrapped fetch/proxy | `resolveFetch`, proxy helpers |
  | `plugin-sdk/host-runtime` | helpers ของ host normalization | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | helpers ของ retry | `RetryConfig`, `retryAsync`, policy runners |
  | `plugin-sdk/allow-from` | การจัดรูป allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | การแมปอินพุต allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | helpers ของ command gating และ command-surface | `resolveControlCommandGate`, sender-authorization helpers, command registry helpers |
  | `plugin-sdk/command-status` | renderers ของ command status/help | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การ parse secret input | secret input helpers |
  | `plugin-sdk/webhook-ingress` | helpers ของ webhook request | utilities ของ webhook target |
  | `plugin-sdk/webhook-request-guards` | helpers ของ webhook body guard | helpers สำหรับ read/limit ของ request body |
  | `plugin-sdk/reply-runtime` | reply runtime แบบใช้ร่วมกัน | Inbound dispatch, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | helpers ของ reply dispatch แบบแคบ | helpers สำหรับ finalize + provider dispatch |
  | `plugin-sdk/reply-history` | helpers ของ reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผน reply reference | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | helpers ของ reply chunk | helpers สำหรับ text/markdown chunking |
  | `plugin-sdk/session-store-runtime` | helpers ของ session store | helpers สำหรับ store path + updated-at |
  | `plugin-sdk/state-paths` | helpers ของ state path | helpers ของ state และ OAuth dir |
  | `plugin-sdk/routing` | helpers ของ routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers สำหรับการ normalize session-key |
  | `plugin-sdk/status-helpers` | helpers ของ channel status | builders สำหรับสรุปสถานะ channel/account, ค่าเริ่มต้นของ runtime-state, issue metadata helpers |
  | `plugin-sdk/target-resolver-runtime` | helpers ของ target resolver | helpers แบบใช้ร่วมกันของ target resolver |
  | `plugin-sdk/string-normalization-runtime` | helpers ของ string normalization | helpers สำหรับการ normalize slug/string |
  | `plugin-sdk/request-url` | helpers ของ request URL | ดึง string URLs จากอินพุตแบบ request-like |
  | `plugin-sdk/run-command` | helpers ของ timed command | timed command runner พร้อม stdout/stderr ที่ normalize แล้ว |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับ tool/CLI |
  | `plugin-sdk/tool-payload` | การดึง tool payload | ดึง payload ที่ normalize แล้วจาก tool result objects |
  | `plugin-sdk/tool-send` | การดึง tool send | ดึงฟิลด์ send target มาตรฐานจาก tool args |
  | `plugin-sdk/temp-path` | helpers ของ temp path | helpers แบบใช้ร่วมกันสำหรับ temp-download path |
  | `plugin-sdk/logging-core` | helpers ของการบันทึก | subsystem logger และ helpers สำหรับ redaction |
  | `plugin-sdk/markdown-table-runtime` | helpers ของ markdown-table | helpers สำหรับ markdown table mode |
  | `plugin-sdk/reply-payload` | ชนิดของ message reply | ชนิดของ reply payload |
  | `plugin-sdk/provider-setup` | curated local/self-hosted provider setup helpers | helpers สำหรับการค้นหา/config ของ self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | focused OpenAI-compatible self-hosted provider setup helpers | helpers เดียวกันสำหรับการค้นหา/config ของ self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | helpers ของ provider runtime auth | helpers สำหรับ runtime API-key resolution |
  | `plugin-sdk/provider-auth-api-key` | helpers ของ provider API-key setup | helpers สำหรับ API-key onboarding/profile-write |
  | `plugin-sdk/provider-auth-result` | helpers ของ provider auth-result | standard OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | helpers ของ provider interactive login | helpers แบบใช้ร่วมกันสำหรับ interactive login |
  | `plugin-sdk/provider-env-vars` | helpers ของ provider env-var | helpers สำหรับค้นหา provider auth env-var |
  | `plugin-sdk/provider-model-shared` | helpers แบบใช้ร่วมกันสำหรับ provider model/replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, shared replay-policy builders, provider-endpoint helpers และ helpers สำหรับการ normalize model-id |
  | `plugin-sdk/provider-catalog-shared` | helpers แบบใช้ร่วมกันของ provider catalog | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | patches สำหรับ provider onboarding | helpers ของ onboarding config |
| `plugin-sdk/provider-http` | helpers ของ provider HTTP | helpers ทั่วไปสำหรับ provider HTTP/endpoint capability รวมถึง audio transcription multipart form helpers |
| `plugin-sdk/provider-web-fetch` | helpers ของ provider web-fetch | helpers สำหรับ provider registration/cache ของ web-fetch |
| `plugin-sdk/provider-web-search-config-contract` | helpers ของ provider web-search config | helpers แบบแคบสำหรับ web-search config/credential สำหรับ providers ที่ไม่ต้องใช้การเชื่อมต่อ plugin-enable |
| `plugin-sdk/provider-web-search-contract` | helpers ของ provider web-search contract | helpers แบบแคบของ contract สำหรับ web-search config/credential เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และ scoped credential setters/getters |
| `plugin-sdk/provider-web-search` | helpers ของ provider web-search | helpers สำหรับ provider registration/cache/runtime ของ web-search |
| `plugin-sdk/provider-tools` | helpers ของ provider tool/schema compat | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics และ xAI compat helpers เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | helpers ของ provider usage | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และ helpers ของ provider usage อื่นๆ |
| `plugin-sdk/provider-stream` | helpers ของ provider stream wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดของ stream wrapper และ helpers ของ wrapper แบบใช้ร่วมกันสำหรับ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | helpers ของ provider transport | helpers ของ native provider transport เช่น guarded fetch, transport message transforms และ writable transport event streams |
| `plugin-sdk/keyed-async-queue` | ordered async queue | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | helpers ของสื่อแบบใช้ร่วมกัน | helpers สำหรับ media fetch/transform/store พร้อม media payload builders |
| `plugin-sdk/media-generation-runtime` | helpers แบบใช้ร่วมกันของ media-generation | shared failover helpers, candidate selection และข้อความเมื่อไม่มีโมเดลสำหรับการสร้างภาพ/วิดีโอ/เพลง |
| `plugin-sdk/media-understanding` | helpers ของ media-understanding | ชนิดของ provider สำหรับ media understanding พร้อม exports แบบ provider-facing สำหรับ image/audio helper |
| `plugin-sdk/text-runtime` | helpers ของข้อความแบบใช้ร่วมกัน | การลบ assistant-visible-text, markdown render/chunking/table helpers, redaction helpers, directive-tag helpers, safe-text utilities และ helpers ด้าน text/logging ที่เกี่ยวข้อง |
| `plugin-sdk/text-chunking` | helpers ของ text chunking | helper สำหรับ outbound text chunking |
| `plugin-sdk/speech` | helpers ของ speech | ชนิดของ speech provider พร้อม helpers แบบ provider-facing สำหรับ directive, registry และ validation |
| `plugin-sdk/speech-core` | speech core แบบใช้ร่วมกัน | ชนิดของ speech provider, registry, directives, normalization |
| `plugin-sdk/realtime-transcription` | helpers ของ realtime transcription | ชนิดของ provider, registry helpers และ shared WebSocket session helper |
| `plugin-sdk/realtime-voice` | helpers ของ realtime voice | ชนิดของ provider และ registry helpers |
| `plugin-sdk/image-generation-core` | image-generation core แบบใช้ร่วมกัน | helpers สำหรับชนิดของ image-generation, failover, auth และ registry |
| `plugin-sdk/music-generation` | helpers ของ music-generation | ชนิดของ provider/request/result สำหรับ music-generation |
| `plugin-sdk/music-generation-core` | music-generation core แบบใช้ร่วมกัน | ชนิดของ music-generation, failover helpers, provider lookup และ model-ref parsing |
| `plugin-sdk/video-generation` | helpers ของ video-generation | ชนิดของ provider/request/result สำหรับ video-generation |
| `plugin-sdk/video-generation-core` | video-generation core แบบใช้ร่วมกัน | ชนิดของ video-generation, failover helpers, provider lookup และ model-ref parsing |
| `plugin-sdk/interactive-runtime` | helpers ของ interactive reply | normalization/reduction ของ interactive reply payload |
| `plugin-sdk/channel-config-primitives` | primitives ของ channel config | primitives แบบแคบของ channel config-schema |
| `plugin-sdk/channel-config-writes` | helpers ของ channel config-write | helpers สำหรับการอนุญาต channel config-write |
| `plugin-sdk/channel-plugin-common` | prelude แบบใช้ร่วมกันของ channel | shared channel plugin prelude exports |
| `plugin-sdk/channel-status` | helpers ของ channel status | shared channel status snapshot/summary helpers |
| `plugin-sdk/allowlist-config-edit` | helpers ของ allowlist config | helpers สำหรับแก้ไข/อ่าน allowlist config |
| `plugin-sdk/group-access` | helpers ของ group access | shared group-access decision helpers |
| `plugin-sdk/direct-dm` | helpers ของ direct-DM | shared direct-DM auth/guard helpers |
| `plugin-sdk/extension-shared` | helpers ของ extension แบบใช้ร่วมกัน | passive-channel/status และ ambient proxy helper primitives |
| `plugin-sdk/webhook-targets` | helpers ของ webhook target | webhook target registry และ route-install helpers |
| `plugin-sdk/webhook-path` | helpers ของ webhook path | helpers สำหรับการ normalize webhook path |
| `plugin-sdk/web-media` | helpers ของ web media แบบใช้ร่วมกัน | helpers สำหรับโหลดสื่อแบบ remote/local |
| `plugin-sdk/zod` | re-export ของ Zod | `zod` ที่ re-export สำหรับผู้ใช้ plugin SDK |
| `plugin-sdk/memory-core` | helpers ของ memory-core แบบ bundled | พื้นผิว helper ของ memory manager/config/file/CLI |
| `plugin-sdk/memory-core-engine-runtime` | facade ของ memory engine runtime | facade ของ memory index/search runtime |
| `plugin-sdk/memory-core-host-engine-foundation` | foundation engine ของ memory host | exports ของ memory host foundation engine |
| `plugin-sdk/memory-core-host-engine-embeddings` | embedding engine ของ memory host | contracts ของ memory embedding, การเข้าถึง registry, local provider และ generic batch/remote helpers; remote providers แบบ concrete อยู่ใน plugins เจ้าของของตนเอง |
| `plugin-sdk/memory-core-host-engine-qmd` | QMD engine ของ memory host | exports ของ memory host QMD engine |
| `plugin-sdk/memory-core-host-engine-storage` | storage engine ของ memory host | exports ของ memory host storage engine |
| `plugin-sdk/memory-core-host-multimodal` | helpers ของ multimodal บน memory host | helpers ของ multimodal บน memory host |
| `plugin-sdk/memory-core-host-query` | helpers ของ query บน memory host | helpers ของ query บน memory host |
| `plugin-sdk/memory-core-host-secret` | helpers ของ secret บน memory host | helpers ของ secret บน memory host |
| `plugin-sdk/memory-core-host-events` | helpers ของ event journal บน memory host | helpers ของ event journal บน memory host |
| `plugin-sdk/memory-core-host-status` | helpers ของ status บน memory host | helpers ของ status บน memory host |
| `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime ของ memory host | helpers ของ memory host CLI runtime |
| `plugin-sdk/memory-core-host-runtime-core` | core runtime ของ memory host | helpers ของ memory host core runtime |
| `plugin-sdk/memory-core-host-runtime-files` | file/runtime helpers ของ memory host | file/runtime helpers ของ memory host |
| `plugin-sdk/memory-host-core` | alias ของ memory host core runtime | alias แบบ vendor-neutral สำหรับ helpers ของ memory host core runtime |
| `plugin-sdk/memory-host-events` | alias ของ memory host event journal | alias แบบ vendor-neutral สำหรับ helpers ของ memory host event journal |
| `plugin-sdk/memory-host-files` | alias ของ memory host file/runtime | alias แบบ vendor-neutral สำหรับ helpers ของ memory host file/runtime |
| `plugin-sdk/memory-host-markdown` | helpers ของ managed markdown | helpers แบบใช้ร่วมกันของ managed-markdown สำหรับ memory-adjacent plugins |
| `plugin-sdk/memory-host-search` | facade ของ active memory search | lazy active-memory search-manager runtime facade |
| `plugin-sdk/memory-host-status` | alias ของ memory host status | alias แบบ vendor-neutral สำหรับ helpers ของ memory host status |
| `plugin-sdk/memory-lancedb` | helpers ของ memory-lancedb แบบ bundled | พื้นผิว helper ของ memory-lancedb |
| `plugin-sdk/testing` | ยูทิลิตีสำหรับการทดสอบ | test helpers และ mocks |
</Accordion>

ตารางนี้ตั้งใจให้เป็นเพียงชุดย่อยสำหรับการย้ายที่พบบ่อย ไม่ใช่พื้นผิว SDK ทั้งหมด
รายการเต็มของ entrypoints มากกว่า 200 รายการอยู่ที่
`scripts/lib/plugin-sdk-entrypoints.json`

รายการนั้นยังรวม bundled-plugin helper seams บางส่วน เช่น
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` และ `plugin-sdk/matrix*` สิ่งเหล่านี้ยังคงถูก export ไว้สำหรับ
การบำรุงรักษา bundled-plugin และเพื่อความเข้ากันได้ แต่ตั้งใจละออกจากตารางการย้ายที่พบบ่อย และไม่ใช่เป้าหมายที่แนะนำสำหรับโค้ด plugin ใหม่

กฎเดียวกันนี้ใช้กับตระกูล bundled-helper อื่นๆ เช่น:

- browser support helpers: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- พื้นผิว helper/plugin แบบ bundled เช่น `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` และ `plugin-sdk/voice-call`

ปัจจุบัน `plugin-sdk/github-copilot-token` เปิดเผยพื้นผิว token-helper แบบแคบ
ได้แก่ `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` และ `resolveCopilotApiToken`

ให้ใช้ import ที่แคบที่สุดที่ตรงกับงาน หากคุณหา export ไม่พบ
ให้ตรวจดูซอร์สที่ `src/plugin-sdk/` หรือสอบถามใน Discord

## ไทม์ไลน์การถอดออก

| เมื่อใด                 | สิ่งที่จะเกิดขึ้น                                                         |
| ---------------------- | ------------------------------------------------------------------------- |
| **ตอนนี้**             | พื้นผิวที่ deprecated จะส่ง runtime warnings                              |
| **major release ถัดไป** | พื้นผิวที่ deprecated จะถูกลบออก; plugins ที่ยังใช้จะล้มเหลว               |

core plugins ทั้งหมดได้ถูกย้ายแล้ว External plugins ควรย้าย
ก่อน major release ถัดไป

## การปิดคำเตือนชั่วคราว

ตั้ง environment variables เหล่านี้ระหว่างที่คุณกำลังย้าย:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นทางหนีชั่วคราว ไม่ใช่วิธีแก้ถาวร

## ที่เกี่ยวข้อง

- [Getting Started](/th/plugins/building-plugins) — สร้าง Plugin แรกของคุณ
- [SDK Overview](/th/plugins/sdk-overview) — เอกสารอ้างอิงการ import subpath แบบเต็ม
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้าง channel plugins
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง provider plugins
- [Plugin Internals](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรม
- [Plugin Manifest](/th/plugins/manifest) — เอกสารอ้างอิง schema ของ manifest
