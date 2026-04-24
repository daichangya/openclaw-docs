---
read_when:
    - คุณเห็นคำเตือน `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - คุณเห็นคำเตือน `OPENCLAW_EXTENSION_API_DEPRECATED`
    - คุณกำลังอัปเดต Plugin ให้เป็นสถาปัตยกรรม Plugin แบบสมัยใหม่
    - คุณดูแล Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง Plugin SDK แบบสมัยใหม่
title: การย้ายไปใช้ Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:24:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ได้ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้างไปสู่สถาปัตยกรรม Plugin แบบสมัยใหม่ที่มีการนำเข้าแบบเจาะจงและมีเอกสารรองรับ หาก Plugin ของคุณถูกสร้างมาก่อนสถาปัตยกรรมใหม่นี้ คู่มือนี้จะช่วยคุณย้ายระบบ

## สิ่งที่กำลังเปลี่ยนไป

ระบบ Plugin แบบเดิมมีพื้นผิว 2 จุดที่เปิดกว้าง ทำให้ Plugin นำเข้าสิ่งใดก็ได้ที่ต้องการจากจุดเข้าใช้งานเดียว:

- **`openclaw/plugin-sdk/compat`** — การนำเข้าเพียงครั้งเดียวที่ re-export helper หลายสิบตัว มันถูกเพิ่มเข้ามาเพื่อให้ Plugin แบบ hook รุ่นเก่ายังคงทำงานได้ระหว่างที่กำลังสร้างสถาปัตยกรรม Plugin ใหม่
- **`openclaw/extension-api`** — บริดจ์ที่เปิดให้ Plugin เข้าถึง helper ฝั่งโฮสต์โดยตรง เช่น embedded agent runner

ตอนนี้ทั้งสองพื้นผิวนี้ **เลิกใช้งานแล้ว** มันยังทำงานได้ใน runtime แต่ Plugin ใหม่ต้องไม่ใช้งาน และ Plugin เดิมควรย้ายออกก่อนที่ major release ถัดไปจะลบมันออก

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารรองรับใหม่ใน change เดียวกันกับที่เพิ่มตัวแทนใหม่ การเปลี่ยนสัญญาที่ทำให้เข้ากันไม่ได้ต้องผ่าน compatibility adapter, diagnostics, docs และช่วง deprecation ก่อนเสมอ กฎนี้ใช้กับการนำเข้า SDK, ฟิลด์ manifest, setup API, hook และพฤติกรรมการลงทะเบียน runtime

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกนำออกใน major release ในอนาคต
  Plugin ที่ยังนำเข้าจากพื้นผิวเหล่านี้จะใช้งานไม่ได้เมื่อถึงเวลานั้น
</Warning>

## เหตุผลที่มีการเปลี่ยนแปลงนี้

แนวทางเดิมก่อให้เกิดปัญหา:

- **เริ่มต้นช้า** — การนำเข้า helper ตัวเดียวทำให้โหลดโมดูลที่ไม่เกี่ยวข้องอีกหลายสิบตัว
- **Circular dependency** — การ re-export แบบกว้างทำให้เกิด import cycle ได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** — ไม่มีทางบอกได้ว่า export ไหนเสถียร และ export ไหนเป็นของภายใน

Plugin SDK แบบสมัยใหม่แก้ปัญหานี้: แต่ละเส้นทางการนำเข้า (`openclaw/plugin-sdk/\<subpath\>`) เป็นโมดูลขนาดเล็ก แยกเป็นสัดส่วน มีจุดประสงค์ชัดเจน และมีสัญญาที่มีเอกสารรองรับ

รอยต่อ convenience แบบเดิมสำหรับ provider ของ channel ที่มาพร้อมกันก็ถูกนำออกแล้วเช่นกัน การนำเข้าอย่าง `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, รอยต่อ helper ที่ใช้ชื่อ channel และ `openclaw/plugin-sdk/telegram-core` เป็นทางลัด private mono-repo ไม่ใช่สัญญา Plugin ที่เสถียร ให้ใช้ subpath ของ SDK แบบ generic ที่แคบและเฉพาะเจาะจงแทน ภายใน workspace ของ Plugin ที่มาพร้อมกัน ให้เก็บ helper ที่เป็นของ provider ไว้ใน `api.ts` หรือ `runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง provider ที่มาพร้อมกันในปัจจุบัน:

- Anthropic เก็บ helper สำหรับสตรีมที่เฉพาะกับ Claude ไว้ในรอยต่อ `api.ts` / `contract-api.ts` ของตัวเอง
- OpenAI เก็บ builder ของ provider, helper ค่าเริ่มต้นของ model และ builder ของ realtime provider ไว้ใน `api.ts` ของตัวเอง
- OpenRouter เก็บ helper สำหรับ builder ของ provider และ onboarding/config ไว้ใน `api.ts` ของตัวเอง

## นโยบายความเข้ากันได้

สำหรับ Plugin ภายนอก งานด้านความเข้ากันได้จะเป็นไปตามลำดับนี้:

1. เพิ่มสัญญาใหม่
2. คงพฤติกรรมเดิมไว้ผ่าน compatibility adapter
3. ส่ง diagnostic หรือ warning ที่ระบุเส้นทางเดิมและตัวแทนใหม่
4. ครอบคลุมทั้งสองเส้นทางในชุดทดสอบ
5. บันทึกการ deprecation และเส้นทาง migration ไว้ในเอกสาร
6. นำออกหลังจากช่วง migration ที่ประกาศไว้แล้วเท่านั้น โดยปกติมักเป็นใน major release

หากฟิลด์ manifest ยังถูกยอมรับอยู่ ผู้เขียน Plugin ก็ยังสามารถใช้งานต่อได้จนกว่าเอกสารและ diagnostics จะระบุเป็นอย่างอื่น โค้ดใหม่ควรเลือกใช้ตัวแทนที่มีเอกสารรองรับ แต่ Plugin เดิมไม่ควรพังในการออก minor release ตามปกติ

## วิธีการย้ายระบบ

<Steps>
  <Step title="ย้าย approval-native handler ไปใช้ capability facts">
    Plugin channel ที่รองรับ approval ตอนนี้เปิดเผยพฤติกรรม approval แบบ native
    ผ่าน `approvalCapability.nativeRuntime` ร่วมกับ shared runtime-context registry

    การเปลี่ยนแปลงหลัก:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery ที่เฉพาะกับ approval ออกจาก wiring แบบเดิมของ `plugin.auth` /
      `plugin.approvals` ไปไว้ที่ `approvalCapability`
    - `ChannelPlugin.approvals` ถูกนำออกจากสัญญา public channel-plugin แล้ว;
      ให้ย้ายฟิลด์ delivery/native/render ไปไว้ที่ `approvalCapability`
    - `plugin.auth` ยังคงมีไว้สำหรับ flow login/logout ของ channel เท่านั้น; core
      จะไม่อ่าน approval auth hooks จากจุดนั้นอีกต่อไป
    - ลงทะเบียนออบเจ็กต์ runtime ที่เป็นของ channel เช่น client, token หรือ Bolt
      app ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่ง reroute notice ที่เป็นของ Plugin จาก native approval handler;
      ตอนนี้ core เป็นผู้ดูแล notice แบบ routed-elsewhere จากผลลัพธ์การส่งจริง
    - เมื่อส่ง `channelRuntime` เข้าไปใน `createChannelManager(...)` ให้ระบุ
      พื้นผิว `createPluginRuntime().channel` ที่ใช้งานได้จริง
      ระบบจะปฏิเสธ stub แบบไม่ครบ

    ดู `/plugins/sdk-channel-plugins` สำหรับเลย์เอาต์ approval capability ปัจจุบัน

  </Step>

  <Step title="ตรวจสอบพฤติกรรม fallback ของ Windows wrapper">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn`, Windows wrapper
    แบบ `.cmd`/`.bat` ที่หาไม่พบจะ fail-closed แล้ว เว้นแต่คุณจะส่ง
    `allowShellFallback: true` อย่างชัดเจน

    ```typescript
    // ก่อนหน้า
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // หลังจากนี้
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // กำหนดค่านี้เฉพาะสำหรับ caller ด้านความเข้ากันได้ที่เชื่อถือได้
      // ซึ่งยอมรับ shell-mediated fallback โดยตั้งใจ
      allowShellFallback: true,
    });
    ```

    หาก caller ของคุณไม่ได้พึ่งพา shell fallback โดยตั้งใจ อย่าตั้งค่า
    `allowShellFallback` และให้จัดการ error ที่ถูก throw แทน

  </Step>

  <Step title="ค้นหาการนำเข้าที่เลิกใช้งานแล้ว">
    ค้นหาใน Plugin ของคุณว่ามีการนำเข้าจากพื้นผิวที่เลิกใช้งานแล้วหรือไม่:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="แทนที่ด้วยการนำเข้าแบบเจาะจง">
    export แต่ละตัวจากพื้นผิวเดิมจะจับคู่กับเส้นทางการนำเข้าแบบสมัยใหม่ที่เฉพาะเจาะจง:

    ```typescript
    // ก่อนหน้า (เลเยอร์ความเข้ากันได้ย้อนหลังที่เลิกใช้งานแล้ว)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // หลังจากนี้ (การนำเข้าแบบสมัยใหม่ที่เจาะจง)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    สำหรับ helper ฝั่งโฮสต์ ให้ใช้ runtime ของ Plugin ที่ถูก inject แทนการนำเข้าโดยตรง:

    ```typescript
    // ก่อนหน้า (extension-api bridge ที่เลิกใช้งานแล้ว)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // หลังจากนี้ (runtime ที่ถูก inject)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    รูปแบบเดียวกันนี้ใช้กับ helper ของบริดจ์แบบเดิมตัวอื่นด้วย:

    | การนำเข้าเดิม | ตัวเทียบเท่าแบบสมัยใหม่ |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build และทดสอบ">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงเส้นทางการนำเข้า

  <Accordion title="ตารางเส้นทางการนำเข้าที่ใช้บ่อย">
  | เส้นทางการนำเข้า | วัตถุประสงค์ | export หลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | helper สำหรับจุดเข้าใช้งาน Plugin แบบ canonical | `definePluginEntry` |
  | `plugin-sdk/core` | umbrella re-export แบบเดิมสำหรับนิยาม/ตัวสร้างจุดเข้าใช้งาน channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export ของ schema config ระดับราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | helper สำหรับจุดเข้าใช้งาน provider เดี่ยว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | นิยามและตัวสร้างจุดเข้าใช้งาน channel แบบเจาะจง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | helper สำหรับตัวช่วยตั้งค่าที่ใช้ร่วมกัน | prompt แบบ allowlist, ตัวสร้างสถานะการตั้งค่า |
  | `plugin-sdk/setup-runtime` | helper runtime ระหว่างการตั้งค่า | adapter patch สำหรับ setup ที่ import-safe, helper สำหรับ lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | helper สำหรับ setup adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | helper เครื่องมือสำหรับการตั้งค่า | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | helper สำหรับหลายบัญชี | helper สำหรับรายการบัญชี/config/action-gate |
  | `plugin-sdk/account-id` | helper สำหรับ account-id | `DEFAULT_ACCOUNT_ID`, การทำ account-id normalization |
  | `plugin-sdk/account-resolution` | helper สำหรับ lookup บัญชี | helper สำหรับ lookup บัญชี + default-fallback |
  | `plugin-sdk/account-helpers` | helper สำหรับบัญชีแบบแคบ | helper สำหรับรายการบัญชี/account-action |
  | `plugin-sdk/channel-setup` | adapter สำหรับตัวช่วยตั้งค่า | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, พร้อม `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | primitive สำหรับการจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | wiring สำหรับคำนำหน้าการตอบกลับ + การพิมพ์ | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | factory สำหรับ config adapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้าง schema config | ประเภท schema config ของ channel |
  | `plugin-sdk/telegram-command-config` | helper สำหรับ config คำสั่ง Telegram | การทำ command-name normalization, การตัด description, การตรวจสอบ duplicate/conflict |
  | `plugin-sdk/channel-policy` | การ resolve นโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | helper สำหรับสถานะบัญชีและวงจรชีวิต draft stream | `createAccountStatusSink`, helper สำหรับ finalization ของ draft preview |
  | `plugin-sdk/inbound-envelope` | helper สำหรับ inbound envelope | helper สำหรับ route + ตัวสร้าง envelope ที่ใช้ร่วมกัน |
  | `plugin-sdk/inbound-reply-dispatch` | helper สำหรับ inbound reply | helper สำหรับ record-and-dispatch ที่ใช้ร่วมกัน |
  | `plugin-sdk/messaging-targets` | การแยกวิเคราะห์ messaging target | helper สำหรับแยกวิเคราะห์/จับคู่ target |
  | `plugin-sdk/outbound-media` | helper สำหรับ outbound media | การโหลด outbound media ที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-runtime` | helper สำหรับ outbound runtime | helper สำหรับ outbound identity/send delegate และการวางแผน payload |
  | `plugin-sdk/thread-bindings-runtime` | helper สำหรับ thread-binding | helper สำหรับวงจรชีวิตและ adapter ของ thread-binding |
  | `plugin-sdk/agent-media-payload` | helper สำหรับ media payload แบบเดิม | ตัวสร้าง agent media payload สำหรับเลย์เอาต์ฟิลด์แบบเดิม |
  | `plugin-sdk/channel-runtime` | compatibility shim ที่เลิกใช้งานแล้ว | utility สำหรับ channel runtime แบบเดิมเท่านั้น |
  | `plugin-sdk/channel-send-result` | ประเภทผลลัพธ์การส่ง | ประเภทผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | ที่เก็บข้อมูล Plugin แบบคงอยู่ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | helper runtime แบบกว้าง | helper สำหรับ runtime/logging/backup/การติดตั้ง Plugin |
  | `plugin-sdk/runtime-env` | helper runtime env แบบแคบ | helper สำหรับ logger/runtime env, timeout, retry และ backoff |
  | `plugin-sdk/plugin-runtime` | helper runtime ของ Plugin ที่ใช้ร่วมกัน | helper สำหรับคำสั่ง/hook/http/interactive ของ Plugin |
  | `plugin-sdk/hook-runtime` | helper สำหรับ hook pipeline | helper สำหรับ webhook/internal hook pipeline ที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | helper สำหรับ lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | helper สำหรับ process | helper สำหรับ exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | helper สำหรับ CLI runtime | helper สำหรับการจัดรูปแบบคำสั่ง, waits, เวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | helper สำหรับ Gateway | helper สำหรับ Gateway client และ patch สถานะ channel |
  | `plugin-sdk/config-runtime` | helper สำหรับ config | helper สำหรับโหลด/เขียน config |
  | `plugin-sdk/telegram-command-config` | helper สำหรับคำสั่ง Telegram | helper สำหรับตรวจสอบคำสั่ง Telegram แบบ fallback-stable เมื่อไม่สามารถใช้พื้นผิวสัญญา Telegram ที่มาพร้อมกันได้ |
  | `plugin-sdk/approval-runtime` | helper สำหรับ approval prompt | payload สำหรับ exec/plugin approval, helper สำหรับ approval capability/profile, helper สำหรับ routing/runtime ของ native approval |
  | `plugin-sdk/approval-auth-runtime` | helper สำหรับ approval auth | การ resolve approver, การยืนยันตัวตนของ action ในแชตเดียวกัน |
  | `plugin-sdk/approval-client-runtime` | helper สำหรับ approval client | helper สำหรับ profile/filter ของ native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | helper สำหรับ approval delivery | adapter สำหรับ native approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | helper สำหรับ approval gateway | helper สำหรับ approval gateway-resolution ที่ใช้ร่วมกัน |
  | `plugin-sdk/approval-handler-adapter-runtime` | helper สำหรับ approval adapter | helper แบบ lightweight สำหรับโหลด native approval adapter สำหรับ hot channel entrypoint |
  | `plugin-sdk/approval-handler-runtime` | helper สำหรับ approval handler | helper runtime สำหรับ approval handler แบบกว้างกว่า; ให้ใช้รอยต่อ adapter/gateway ที่แคบกว่านี้เมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | helper สำหรับ approval target | helper สำหรับ native approval target/account binding |
  | `plugin-sdk/approval-reply-runtime` | helper สำหรับ approval reply | helper สำหรับ payload การตอบกลับของ exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | helper สำหรับ channel runtime-context | helper แบบ generic สำหรับ register/get/watch ของ channel runtime-context |
  | `plugin-sdk/security-runtime` | helper สำหรับความปลอดภัย | helper สำหรับ trust, DM gating, external-content และ secret-collection ที่ใช้ร่วมกัน |
  | `plugin-sdk/ssrf-policy` | helper สำหรับนโยบาย SSRF | helper สำหรับ host allowlist และนโยบาย private-network |
  | `plugin-sdk/ssrf-runtime` | helper สำหรับ SSRF runtime | helper สำหรับ pinned-dispatcher, guarded fetch, นโยบาย SSRF |
  | `plugin-sdk/collection-runtime` | helper สำหรับ bounded cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | helper สำหรับ diagnostic gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | helper สำหรับจัดรูปแบบข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, helper สำหรับ error graph |
  | `plugin-sdk/fetch-runtime` | helper สำหรับ wrapped fetch/proxy | `resolveFetch`, helper สำหรับ proxy |
  | `plugin-sdk/host-runtime` | helper สำหรับ host normalization | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | helper สำหรับ retry | `RetryConfig`, `retryAsync`, policy runners |
  | `plugin-sdk/allow-from` | การจัดรูปแบบ allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | การแมปอินพุต allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | helper สำหรับ command gating และพื้นผิวคำสั่ง | `resolveControlCommandGate`, helper สำหรับ sender-authorization, helper สำหรับ command registry |
  | `plugin-sdk/command-status` | renderer สำหรับสถานะ/ความช่วยเหลือของคำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การแยกวิเคราะห์ secret input | helper สำหรับ secret input |
  | `plugin-sdk/webhook-ingress` | helper สำหรับคำขอ Webhook | utility สำหรับ Webhook target |
  | `plugin-sdk/webhook-request-guards` | helper สำหรับ body guard ของ Webhook | helper สำหรับการอ่าน/จำกัด request body |
  | `plugin-sdk/reply-runtime` | reply runtime ที่ใช้ร่วมกัน | inbound dispatch, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | helper สำหรับ reply dispatch แบบแคบ | helper สำหรับ finalize, provider dispatch และ conversation-label |
  | `plugin-sdk/reply-history` | helper สำหรับ reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผน reply reference | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | helper สำหรับ reply chunk | helper สำหรับ chunking ของข้อความ/Markdown |
  | `plugin-sdk/session-store-runtime` | helper สำหรับ session store | helper สำหรับ store path + updated-at |
  | `plugin-sdk/state-paths` | helper สำหรับ state path | helper สำหรับ state และไดเรกทอรี OAuth |
  | `plugin-sdk/routing` | helper สำหรับ routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper สำหรับ session-key normalization |
  | `plugin-sdk/status-helpers` | helper สำหรับสถานะ channel | ตัวสร้างสรุปสถานะ channel/account, ค่าเริ่มต้น runtime-state, helper สำหรับเมทาดาทาของ issue |
  | `plugin-sdk/target-resolver-runtime` | helper สำหรับ target resolver | helper สำหรับ target resolver ที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | helper สำหรับ string normalization | helper สำหรับ slug/string normalization |
  | `plugin-sdk/request-url` | helper สำหรับ request URL | ดึง URL แบบสตริงจากอินพุตที่คล้าย request |
  | `plugin-sdk/run-command` | helper สำหรับคำสั่งแบบมีเวลา | ตัวรันคำสั่งแบบมีเวลาพร้อม stdout/stderr ที่ normalize แล้ว |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับ tool/CLI |
  | `plugin-sdk/tool-payload` | การแยก payload ของ tool | ดึง payload ที่ normalize แล้วจากออบเจ็กต์ผลลัพธ์ของ tool |
  | `plugin-sdk/tool-send` | การแยกการส่งของ tool | ดึงฟิลด์ target สำหรับการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
  | `plugin-sdk/temp-path` | helper สำหรับ temp path | helper สำหรับพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน |
  | `plugin-sdk/logging-core` | helper สำหรับ logging | logger ระดับ subsystem และ helper สำหรับ redaction |
  | `plugin-sdk/markdown-table-runtime` | helper สำหรับ Markdown table | helper สำหรับโหมด Markdown table |
  | `plugin-sdk/reply-payload` | ประเภทการตอบกลับของข้อความ | ประเภท reply payload |
  | `plugin-sdk/provider-setup` | helper สำหรับการตั้งค่า provider แบบ local/self-hosted ที่คัดสรรแล้ว | helper สำหรับการค้นหา/กำหนดค่า provider แบบ self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | helper แบบเจาะจงสำหรับการตั้งค่า provider แบบ self-hosted ที่เข้ากันได้กับ OpenAI | helper เดียวกันสำหรับการค้นหา/กำหนดค่า provider แบบ self-hosted |
  | `plugin-sdk/provider-auth-runtime` | helper สำหรับ provider runtime auth | helper สำหรับการ resolve API key ใน runtime |
  | `plugin-sdk/provider-auth-api-key` | helper สำหรับการตั้งค่า API key ของ provider | helper สำหรับ onboarding/profile-write ของ API key |
  | `plugin-sdk/provider-auth-result` | helper สำหรับ provider auth-result | ตัวสร้าง auth-result มาตรฐานสำหรับ OAuth |
  | `plugin-sdk/provider-auth-login` | helper สำหรับ interactive login ของ provider | helper สำหรับ interactive login ที่ใช้ร่วมกัน |
  | `plugin-sdk/provider-selection-runtime` | helper สำหรับการเลือก provider | helper สำหรับการเลือก provider แบบ configured-or-auto และการรวม raw provider config |
  | `plugin-sdk/provider-env-vars` | helper สำหรับ env var ของ provider | helper สำหรับ lookup env var การยืนยันตัวตนของ provider |
  | `plugin-sdk/provider-model-shared` | helper ที่ใช้ร่วมกันสำหรับ model/replay ของ provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy ที่ใช้ร่วมกัน, helper สำหรับ provider-endpoint และ helper สำหรับ model-id normalization |
  | `plugin-sdk/provider-catalog-shared` | helper แคตตาล็อก provider ที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | patch สำหรับ onboarding ของ provider | helper สำหรับ config การ onboarding |
  | `plugin-sdk/provider-http` | helper HTTP ของ provider | helper ทั่วไปสำหรับความสามารถด้าน HTTP/endpoint ของ provider รวมถึง helper สำหรับ multipart form ของ audio transcription |
  | `plugin-sdk/provider-web-fetch` | helper web-fetch ของ provider | helper สำหรับการลงทะเบียน/แคช provider แบบ web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | helper สำหรับ config ของ provider web-search | helper แบบแคบสำหรับ config/credential ของ web-search สำหรับ provider ที่ไม่ต้องใช้ wiring เปิดใช้งาน Plugin |
  | `plugin-sdk/provider-web-search-contract` | helper สำหรับสัญญา provider web-search | helper แบบแคบสำหรับสัญญา config/credential ของ web-search เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และ setter/getter ของ credential แบบมีขอบเขต |
  | `plugin-sdk/provider-web-search` | helper สำหรับ provider web-search | helper สำหรับการลงทะเบียน/แคช/runtime ของ provider web-search |
  | `plugin-sdk/provider-tools` | helper ความเข้ากันได้ของ tool/schema ของ provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การ cleanup schema ของ Gemini + diagnostics และ helper ความเข้ากันได้ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | helper การใช้งานของ provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และ helper การใช้งานของ provider อื่น ๆ |
  | `plugin-sdk/provider-stream` | helper ตัวครอบ stream ของ provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภทตัวครอบ stream และ helper ตัวครอบที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | helper transport ของ provider | helper สำหรับ native provider transport เช่น guarded fetch, การแปลง transport message และ writable transport event streams |
  | `plugin-sdk/keyed-async-queue` | async queue แบบมีลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | helper media ที่ใช้ร่วมกัน | helper สำหรับ fetch/transform/store ของ media พร้อมตัวสร้าง media payload |
  | `plugin-sdk/media-generation-runtime` | helper การสร้าง media ที่ใช้ร่วมกัน | helper สำหรับ failover, การเลือก candidate และข้อความเมื่อไม่มี model สำหรับการสร้างภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | helper การทำความเข้าใจ media | ประเภท provider สำหรับการทำความเข้าใจ media พร้อม export helper ฝั่ง provider สำหรับภาพ/เสียง |
  | `plugin-sdk/text-runtime` | helper ข้อความที่ใช้ร่วมกัน | การตัดข้อความที่มองเห็นโดย assistant, helper สำหรับ render/chunking/table ของ Markdown, helper สำหรับ redaction, helper สำหรับ directive-tag, utility สำหรับ safe-text และ helper ด้าน text/logging ที่เกี่ยวข้อง |
  | `plugin-sdk/text-chunking` | helper สำหรับ chunking ข้อความ | helper สำหรับ chunking ข้อความขาออก |
  | `plugin-sdk/speech` | helper สำหรับเสียงพูด | ประเภท provider สำหรับเสียงพูด พร้อม helper สำหรับ directive, registry และ validation ฝั่ง provider |
  | `plugin-sdk/speech-core` | speech core ที่ใช้ร่วมกัน | ประเภท provider สำหรับเสียงพูด, registry, directives, normalization |
  | `plugin-sdk/realtime-transcription` | helper สำหรับการถอดเสียงแบบเรียลไทม์ | ประเภท provider, helper สำหรับ registry และ helper สำหรับเซสชัน WebSocket ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | helper สำหรับเสียงแบบเรียลไทม์ | ประเภท provider, helper สำหรับ registry/resolution และ helper สำหรับ bridge session |
  | `plugin-sdk/image-generation-core` | image-generation core ที่ใช้ร่วมกัน | ประเภทสำหรับการสร้างภาพ, failover, auth และ helper สำหรับ registry |
  | `plugin-sdk/music-generation` | helper สำหรับการสร้างเพลง | ประเภท provider/request/result สำหรับการสร้างเพลง |
  | `plugin-sdk/music-generation-core` | music-generation core ที่ใช้ร่วมกัน | ประเภทสำหรับการสร้างเพลง, helper สำหรับ failover, การ lookup provider และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | helper สำหรับการสร้างวิดีโอ | ประเภท provider/request/result สำหรับการสร้างวิดีโอ |
  | `plugin-sdk/video-generation-core` | video-generation core ที่ใช้ร่วมกัน | ประเภทสำหรับการสร้างวิดีโอ, helper สำหรับ failover, การ lookup provider และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | helper สำหรับการตอบกลับแบบ interactive | การ normalize/reduce ของ interactive reply payload |
  | `plugin-sdk/channel-config-primitives` | primitive สำหรับ config ของ channel | primitive แบบแคบสำหรับ schema config ของ channel |
  | `plugin-sdk/channel-config-writes` | helper สำหรับการเขียน config ของ channel | helper สำหรับการอนุญาตการเขียน config ของ channel |
  | `plugin-sdk/channel-plugin-common` | prelude ของ channel ที่ใช้ร่วมกัน | export prelude ของ channel plugin ที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-status` | helper สำหรับสถานะ channel | helper สำหรับ snapshot/summary สถานะ channel ที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | helper สำหรับ config allowlist | helper สำหรับแก้ไข/อ่าน config allowlist |
  | `plugin-sdk/group-access` | helper สำหรับการเข้าถึงกลุ่ม | helper สำหรับการตัดสินใจ group-access ที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm` | helper สำหรับ Direct-DM | helper สำหรับ auth/guard ของ direct-DM ที่ใช้ร่วมกัน |
  | `plugin-sdk/extension-shared` | helper extension ที่ใช้ร่วมกัน | primitive ของ passive-channel/status และ ambient proxy helper |
  | `plugin-sdk/webhook-targets` | helper สำหรับ Webhook target | helper สำหรับ registry ของ Webhook target และการติดตั้ง route |
  | `plugin-sdk/webhook-path` | helper สำหรับพาธ Webhook | helper สำหรับการ normalize พาธ Webhook |
  | `plugin-sdk/web-media` | helper web media ที่ใช้ร่วมกัน | helper สำหรับการโหลด media แบบ remote/local |
  | `plugin-sdk/zod` | re-export ของ Zod | `zod` ที่ re-export สำหรับผู้ใช้ Plugin SDK |
  | `plugin-sdk/memory-core` | helper ของ memory-core ที่มาพร้อมกัน | พื้นผิว helper สำหรับ memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | facade runtime ของ memory engine | facade runtime สำหรับ memory index/search |
  | `plugin-sdk/memory-core-host-engine-foundation` | foundation engine ของ memory host | export ของ foundation engine สำหรับ memory host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | embedding engine ของ memory host | สัญญาสำหรับ memory embedding, การเข้าถึง registry, local provider และ helper ทั่วไปสำหรับ batch/remote; provider ระยะไกลแบบ concrete จะอยู่ใน Plugin ที่เป็นเจ้าของ |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine ของ memory host | export ของ QMD engine สำหรับ memory host |
  | `plugin-sdk/memory-core-host-engine-storage` | storage engine ของ memory host | export ของ storage engine สำหรับ memory host |
  | `plugin-sdk/memory-core-host-multimodal` | helper multimodal ของ memory host | helper multimodal ของ memory host |
  | `plugin-sdk/memory-core-host-query` | helper query ของ memory host | helper query ของ memory host |
  | `plugin-sdk/memory-core-host-secret` | helper secret ของ memory host | helper secret ของ memory host |
  | `plugin-sdk/memory-core-host-events` | helper event journal ของ memory host | helper event journal ของ memory host |
  | `plugin-sdk/memory-core-host-status` | helper สถานะของ memory host | helper สถานะของ memory host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime ของ memory host | helper CLI runtime ของ memory host |
  | `plugin-sdk/memory-core-host-runtime-core` | core runtime ของ memory host | helper core runtime ของ memory host |
  | `plugin-sdk/memory-core-host-runtime-files` | helper file/runtime ของ memory host | helper file/runtime ของ memory host |
  | `plugin-sdk/memory-host-core` | alias ของ core runtime ของ memory host | alias ที่เป็นกลางต่อ vendor สำหรับ helper core runtime ของ memory host |
  | `plugin-sdk/memory-host-events` | alias ของ event journal ของ memory host | alias ที่เป็นกลางต่อ vendor สำหรับ helper event journal ของ memory host |
  | `plugin-sdk/memory-host-files` | alias ของ file/runtime ของ memory host | alias ที่เป็นกลางต่อ vendor สำหรับ helper file/runtime ของ memory host |
  | `plugin-sdk/memory-host-markdown` | helper สำหรับ managed markdown | helper managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้เคียงกับ memory |
  | `plugin-sdk/memory-host-search` | facade สำหรับการค้นหา Active Memory | facade runtime แบบ lazy สำหรับ active-memory search-manager |
  | `plugin-sdk/memory-host-status` | alias ของสถานะ memory host | alias ที่เป็นกลางต่อ vendor สำหรับ helper สถานะของ memory host |
  | `plugin-sdk/memory-lancedb` | helper ของ memory-lancedb ที่มาพร้อมกัน | พื้นผิว helper ของ memory-lancedb |
  | `plugin-sdk/testing` | utility สำหรับทดสอบ | helper และ mock สำหรับทดสอบ |
</Accordion>

ตารางนี้ตั้งใจให้เป็นเพียงชุดย้ายระบบที่ใช้บ่อย ไม่ใช่พื้นผิว SDK ทั้งหมด รายการเต็มของ entrypoint กว่า 200 รายการอยู่ที่ `scripts/lib/plugin-sdk-entrypoints.json`

รายการนั้นยังคงมีรอยต่อ helper ของ Plugin ที่มาพร้อมกันบางส่วน เช่น `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` และ `plugin-sdk/matrix*` ซึ่งยังคงถูก export ไว้เพื่อการดูแล Plugin ที่มาพร้อมกันและเพื่อความเข้ากันได้ แต่ถูกละเว้นจากตารางการย้ายระบบที่ใช้บ่อยโดยตั้งใจ และไม่ใช่เป้าหมายที่แนะนำสำหรับโค้ด Plugin ใหม่

กฎเดียวกันนี้ใช้กับตระกูล bundled-helper อื่น ๆ ด้วย เช่น:

- helper รองรับ browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- พื้นผิว helper/Plugin ที่มาพร้อมกัน เช่น `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` และ `plugin-sdk/voice-call`

ปัจจุบัน `plugin-sdk/github-copilot-token` เปิดเผยพื้นผิว helper สำหรับ token แบบแคบคือ `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` และ `resolveCopilotApiToken`

ให้ใช้การนำเข้าที่แคบที่สุดซึ่งตรงกับงานนั้น หากคุณหา export ไม่พบ ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือสอบถามใน Discord

## กำหนดเวลาการนำออก

| เมื่อใด                 | สิ่งที่จะเกิดขึ้น                                                      |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้**             | พื้นผิวที่เลิกใช้งานแล้วจะส่งคำเตือนใน runtime                        |
| **major release ถัดไป** | พื้นผิวที่เลิกใช้งานแล้วจะถูกนำออก; Plugin ที่ยังใช้อยู่จะล้มเหลว      |

Plugin หลักทั้งหมดได้ย้ายระบบแล้ว Plugin ภายนอกควรย้ายก่อน major release ถัดไป

## การซ่อนคำเตือนชั่วคราว

ตั้งค่าตัวแปรสภาพแวดล้อมเหล่านี้ระหว่างที่คุณกำลังย้ายระบบ:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นช่องทางหลบเลี่ยงชั่วคราว ไม่ใช่วิธีแก้ถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) — สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิงการนำเข้า subpath แบบเต็ม
- [Plugin Channel](/th/plugins/sdk-channel-plugins) — การสร้าง Plugin channel
- [Plugin Provider](/th/plugins/sdk-provider-plugins) — การสร้าง Plugin provider
- [รายละเอียดภายในของ Plugin](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรม
- [Plugin Manifest](/th/plugins/manifest) — ข้อมูลอ้างอิง schema ของ manifest
