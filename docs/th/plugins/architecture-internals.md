---
read_when:
    - การติดตั้งใช้งาน provider runtime hooks, วงจรชีวิตของช่องทาง หรือ package packs
    - การดีบักลำดับการโหลด Plugin หรือสถานะของ registry
    - การเพิ่มความสามารถใหม่ของ Plugin หรือ Plugin context-engine ใหม่
summary: 'สถาปัตยกรรมภายในของ Plugin: ไปป์ไลน์การโหลด, registry, runtime hooks, HTTP routes และตารางอ้างอิง'
title: สถาปัตยกรรมภายในของ Plugin
x-i18n:
    generated_at: "2026-04-24T09:22:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

สำหรับโมเดลความสามารถสาธารณะ, รูปแบบของ Plugin และสัญญาความเป็นเจ้าของ/การทำงาน
โปรดดู [สถาปัตยกรรมของ Plugin](/th/plugins/architecture) หน้านี้เป็นข้อมูลอ้างอิง
สำหรับกลไกภายใน: ไปป์ไลน์การโหลด, registry, runtime hooks, Gateway HTTP routes, import paths และตาราง schema

## ไปป์ไลน์การโหลด

ตอนเริ่มต้น OpenClaw จะทำประมาณนี้:

1. ค้นหา roots ของ Plugin ที่เป็นผู้สมัคร
2. อ่าน manifests ของ native หรือ compatible bundle และ package metadata
3. ปฏิเสธผู้สมัครที่ไม่ปลอดภัย
4. normalize config ของ Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินการเปิดใช้งานสำหรับแต่ละผู้สมัคร
6. โหลด native modules ที่เปิดใช้งาน: bundled modules ที่ build แล้วใช้ native loader;
   native plugins ที่ยังไม่ build ใช้ jiti
7. เรียก native `register(api)` hooks และรวบรวม registrations ลงใน plugin registry
8. เปิดเผย registry ให้กับ surfaces ของคำสั่ง/รันไทม์

<Note>
`activate` เป็น alias แบบเดิมของ `register` — loader จะ resolve ตัวใดก็ตามที่มี (`def.register ?? def.activate`) และเรียกมันในจุดเดียวกัน Bundled plugins ทั้งหมดใช้ `register`; สำหรับ Plugin ใหม่ควรใช้ `register`
</Note>

safety gates จะเกิดขึ้น **ก่อน** การทำงานของรันไทม์ ผู้สมัครจะถูกบล็อก
เมื่อ entry หลุดออกนอก plugin root, path เขียนได้โดยทุกคน หรือ path
ownership ดูน่าสงสัยสำหรับ plugins ที่ไม่ใช่แบบ bundled

### ลักษณะการทำงานแบบ manifest-first

manifest คือแหล่งความจริงของ control-plane OpenClaw ใช้มันเพื่อ:

- ระบุ Plugin
- ค้นหาความสามารถที่ประกาศไว้ เช่น channels/Skills/config schema หรือ bundle capabilities
- ตรวจสอบ `plugins.entries.<id>.config`
- เสริม labels/placeholders ของ Control UI
- แสดง install/catalog metadata
- รักษา descriptors ของ activation และ setup ที่ประหยัดและใช้งานได้โดยไม่ต้องโหลด plugin runtime

สำหรับ native plugins, runtime module คือส่วนของ data-plane มันจะลงทะเบียน
พฤติกรรมจริง เช่น hooks, tools, commands หรือ provider flows

บล็อก `activation` และ `setup` แบบไม่บังคับใน manifest ยังคงอยู่บน control plane
มันเป็น descriptors แบบ metadata-only สำหรับการวางแผน activation และการค้นหา setup;
ไม่มาแทนที่ runtime registration, `register(...)` หรือ `setupEntry`
ผู้ใช้ activation แบบสดกลุ่มแรกตอนนี้ใช้ hints ของ command, channel และ provider จาก manifest
เพื่อจำกัดการโหลด Plugin ให้แคบลงก่อนการ materialize registry แบบกว้าง:

- การโหลดผ่าน CLI จะจำกัดเฉพาะ plugins ที่เป็นเจ้าของ primary command ที่ร้องขอ
- การตั้งค่า channel/การ resolve plugin จะจำกัดเฉพาะ plugins ที่เป็นเจ้าของ
  channel id ที่ร้องขอ
- การ resolve setup/runtime ของ provider แบบชัดเจน จะจำกัดเฉพาะ plugins ที่เป็นเจ้าของ
  provider id ที่ร้องขอ

ตัววางแผน activation เปิดทั้ง API แบบ ids-only สำหรับผู้เรียกเดิม และ API แบบ plan
สำหรับงานวินิจฉัยใหม่ รายการ plan จะรายงานเหตุผลที่เลือก Plugin แต่ละตัว
โดยแยก hints ของตัววางแผน `activation.*` แบบชัดเจน ออกจาก fallback ตาม ownership ใน manifest
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks การแยกเหตุผลนี้คือขอบเขตความเข้ากันได้:
metadata ของ Plugin เดิมยังคงใช้งานได้ ขณะที่โค้ดใหม่สามารถตรวจจับ broad hints
หรือพฤติกรรม fallback ได้โดยไม่เปลี่ยนความหมายของการโหลดรันไทม์

ตอนนี้การค้นหา setup จะให้ความสำคัญกับ ids ที่ descriptor เป็นเจ้าของ เช่น `setup.providers` และ
`setup.cliBackends` เพื่อจำกัด candidate plugins ให้แคบลง ก่อน fallback ไปยัง
`setup-api` สำหรับ plugins ที่ยังต้องใช้ runtime hooks ตอน setup หากมี
plugins ที่ค้นพบมากกว่าหนึ่งตัวอ้างสิทธิ์ normalized setup provider หรือ CLI backend
id เดียวกัน การค้นหา setup จะปฏิเสธเจ้าของที่กำกวมแทนที่จะพึ่งพาลำดับการค้นพบ

### สิ่งที่ loader แคชไว้

OpenClaw เก็บแคชระยะสั้นในโปรเซสสำหรับ:

- ผลการค้นหา
- ข้อมูล manifest registry
- registries ของ Plugin ที่โหลดแล้ว

แคชเหล่านี้ช่วยลดภาระการเริ่มต้นแบบเป็นช่วง ๆ และ overhead จากการเรียกคำสั่งซ้ำ
ควรมองว่าเป็นแคชเพื่อประสิทธิภาพระยะสั้น ไม่ใช่การเก็บถาวร

หมายเหตุด้านประสิทธิภาพ:

- ตั้ง `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` หรือ
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` เพื่อปิดแคชเหล่านี้
- ปรับหน้าต่างของแคชด้วย `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` และ
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`

## โมเดลของ Registry

Plugins ที่ถูกโหลดไม่ได้ mutate global ของ core แบบสุ่มโดยตรง แต่มันลงทะเบียนเข้า
plugin registry กลาง

registry นี้ติดตาม:

- plugin records (ตัวตน, แหล่งที่มา, origin, สถานะ, diagnostics)
- tools
- legacy hooks และ typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- commands ที่เป็นของ Plugin

จากนั้นฟีเจอร์ของ core จะอ่านจาก registry นั้น แทนการคุยกับโมดูล Plugin โดยตรง
สิ่งนี้ทำให้การโหลดเป็นแบบทางเดียว:

- plugin module -> การลงทะเบียนใน registry
- core runtime -> การใช้งาน registry

การแยกส่วนนี้สำคัญต่อการดูแลรักษา เพราะหมายความว่าพื้นผิวของ core ส่วนใหญ่
ต้องมีจุดเชื่อมเพียงจุดเดียว: "อ่าน registry" ไม่ใช่ "ทำกรณีพิเศษให้ทุก plugin module"

## Callbacks ของการ bind บทสนทนา

Plugins ที่ bind บทสนทนาไว้ สามารถตอบสนองเมื่อการอนุมัติถูก resolve ได้

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับ callback หลังจากคำขอ bind
ได้รับการอนุมัติหรือถูกปฏิเสธ:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

ฟิลด์ของ payload ใน callback:

- `status`: `"approved"` หรือ `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` หรือ `"deny"`
- `binding`: binding ที่ resolve แล้วสำหรับคำขอที่ได้รับอนุมัติ
- `request`: สรุปคำขอดั้งเดิม, detach hint, sender id และ
  metadata ของบทสนทนา

callback นี้มีไว้เพื่อการแจ้งเตือนเท่านั้น มันไม่เปลี่ยนว่าใครได้รับอนุญาตให้ bind
บทสนทนา และจะรันหลังจาก core จัดการการอนุมัติเสร็จแล้ว

## Provider runtime hooks

Provider plugins มี 3 ชั้น:

- **Manifest metadata** สำหรับการ lookup แบบประหยัดก่อนรันไทม์: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **Config-time hooks**: `catalog` (เดิมเรียก `discovery`) รวมถึง
  `applyConfigDefaults`
- **Runtime hooks**: hooks แบบไม่บังคับมากกว่า 40 รายการ ครอบคลุม auth, model resolution,
  stream wrapping, thinking levels, replay policy และ usage endpoints ดู
  รายการเต็มได้ที่ [ลำดับและการใช้งานของ Hook](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของ generic agent loop, failover, transcript handling และ
tool policy hooks เหล่านี้คือพื้นผิวส่วนขยายสำหรับพฤติกรรมเฉพาะ provider โดยไม่ต้อง
มี inference transport แบบกำหนดเองทั้งชุด

ใช้ `providerAuthEnvVars` ใน manifest เมื่อ provider มีข้อมูลรับรองแบบอิง env
ซึ่งเส้นทาง generic auth/status/model-picker ควรมองเห็นได้โดยไม่ต้องโหลด plugin
runtime ใช้ `providerAuthAliases` ใน manifest เมื่อ provider id หนึ่งควรนำ env vars,
auth profiles, config-backed auth และตัวเลือก onboarding API-key ของ provider id อื่นกลับมาใช้ ใช้ `providerAuthChoices` ใน manifest เมื่อ surfaces ของ CLI สำหรับ onboarding/auth-choice
ควรรู้จัก choice id ของ provider, group labels และการผูก auth แบบแฟลกเดียวอย่างง่ายโดยไม่ต้องโหลด provider runtime ส่วน `envVars` ใน provider runtime ให้คงไว้สำหรับ operator-facing hints เช่น labels ตอน onboarding หรือ env vars สำหรับการตั้งค่า OAuth client-id/client-secret

ใช้ `channelEnvVars` ใน manifest เมื่อ channel มี auth หรือ setup ที่ขับเคลื่อนด้วย env ซึ่ง generic shell-env fallback, การตรวจสอบ config/status หรือ setup prompts ควรมองเห็นได้โดยไม่ต้องโหลด channel runtime

### ลำดับและการใช้งานของ Hook

สำหรับ model/provider plugins, OpenClaw จะเรียก hooks ตามลำดับคร่าว ๆ นี้
คอลัมน์ "ใช้เมื่อใด" คือคู่มือการตัดสินใจแบบเร็ว

| # | Hook | สิ่งที่ทำ | ใช้เมื่อใด |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `catalog` | เผยแพร่ config ของ provider ลงใน `models.providers` ระหว่างการสร้าง `models.json` | Provider เป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้นของ base URL |
| 2 | `applyConfigDefaults` | ใช้ค่าเริ่มต้นของ global config ที่ provider เป็นเจ้าของระหว่างการ materialize config | ค่าเริ่มต้นขึ้นอยู่กับโหมด auth, env หรือความหมายของ model-family เฉพาะ provider |
| -- | _(built-in model lookup)_ | OpenClaw จะลองใช้เส้นทาง registry/catalog ปกติก่อน | _(ไม่ใช่ plugin hook)_ |
| 3 | `normalizeModelId` | normalize aliases ของ model-id แบบเดิมหรือแบบ preview ก่อน lookup | Provider เป็นเจ้าของการเก็บกวาด aliases ก่อน canonical model resolution |
| 4 | `normalizeTransport` | normalize `api` / `baseUrl` ของตระกูล provider ก่อน generic model assembly | Provider เป็นเจ้าของการเก็บกวาด transport สำหรับ custom provider ids ใน transport family เดียวกัน |
| 5 | `normalizeConfig` | normalize `models.providers.<id>` ก่อน runtime/provider resolution | Provider ต้องการเก็บกวาด config ที่ควรอยู่กับ Plugin; ตัวช่วย bundled ตระกูล Google ยังทำหน้าที่เป็น backstop ให้ supported Google config entries ด้วย |
| 6 | `applyNativeStreamingUsageCompat` | ใช้การเขียนทับแบบ compat สำหรับ native streaming-usage กับ config providers | Provider ต้องการการแก้ metadata ของ native streaming usage ที่ขับเคลื่อนด้วย endpoint |
| 7 | `resolveConfigApiKey` | resolve env-marker auth สำหรับ config providers ก่อนโหลด runtime auth | Provider มีการ resolve API-key แบบ env-marker ที่เป็นของ provider; `amazon-bedrock` ยังมี built-in AWS env-marker resolver ในจุดนี้ด้วย |
| 8 | `resolveSyntheticAuth` | แสดง auth แบบ local/self-hosted หรือ config-backed โดยไม่เก็บ plaintext | Provider ทำงานได้ด้วย synthetic/local credential marker |
| 9 | `resolveExternalAuthProfiles` | วางทับ external auth profiles ที่ provider เป็นเจ้าของ; ค่าเริ่มต้นของ `persistence` คือ `runtime-only` สำหรับ creds ที่เป็นของ CLI/app | Provider ใช้ข้อมูลรับรอง auth ภายนอกซ้ำโดยไม่เก็บ copied refresh tokens; ให้ประกาศ `contracts.externalAuthProviders` ใน manifest |
| 10 | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของ synthetic profile placeholders ที่จัดเก็บไว้ให้ไปอยู่หลัง auth แบบ env/config-backed | Provider เก็บ synthetic placeholder profiles ที่ไม่ควรชนะ precedence |
| 11 | `resolveDynamicModel` | ซิงก์ fallback สำหรับ model ids ที่ provider เป็นเจ้าของแต่ยังไม่อยู่ใน local registry | Provider ยอมรับ upstream model ids แบบ arbitrary |
| 12 | `prepareDynamicModel` | warm-up แบบ async แล้วจึงรัน `resolveDynamicModel` อีกครั้ง | Provider ต้องใช้ network metadata ก่อน resolve ids ที่ไม่รู้จัก |
| 13 | `normalizeResolvedModel` | เขียนทับรอบสุดท้ายก่อน embedded runner จะใช้ resolved model | Provider ต้องการ transport rewrites แต่ยังใช้ core transport อยู่ |
| 14 | `contributeResolvedModelCompat` | เพิ่ม compat flags สำหรับ vendor models ที่อยู่หลัง compatible transport อื่น | Provider รู้จักโมเดลของตัวเองบน proxy transports โดยไม่ต้องยึดความเป็นเจ้าของ provider |
| 15 | `capabilities` | metadata ด้าน transcript/tooling ที่ provider เป็นเจ้าของและถูกใช้โดย shared core logic | Provider ต้องการ transcript/provider-family quirks |
| 16 | `normalizeToolSchemas` | normalize tool schemas ก่อน embedded runner จะมองเห็น | Provider ต้องการการเก็บกวาด schema ของ transport-family |
| 17 | `inspectToolSchemas` | แสดง schema diagnostics ที่ provider เป็นเจ้าของหลังการ normalize | Provider ต้องการคำเตือนเรื่อง keyword โดยไม่สอนกฎเฉพาะ provider ให้ core |
| 18 | `resolveReasoningOutputMode` | เลือกสัญญา reasoning-output แบบ native หรือแบบ tagged | Provider ต้องการ tagged reasoning/final output แทน native fields |
| 19 | `prepareExtraParams` | normalize request params ก่อน generic stream option wrappers | Provider ต้องการ request params เริ่มต้นหรือการเก็บกวาดพารามิเตอร์ราย provider |
| 20 | `createStreamFn` | แทนที่เส้นทาง stream ปกติทั้งหมดด้วย custom transport | Provider ต้องการ wire protocol แบบกำหนดเอง ไม่ใช่เพียง wrapper |
| 21 | `wrapStreamFn` | wrapper ของ stream หลังจาก generic wrappers ถูกใช้แล้ว | Provider ต้องการ wrappers สำหรับ request headers/body/model compat โดยไม่ใช้ custom transport |
| 22 | `resolveTransportTurnState` | แนบ headers หรือ metadata แบบ native รายเทิร์นของ transport | Provider ต้องการให้ generic transports ส่ง turn identity แบบ native ของ provider |
| 23 | `resolveWebSocketSessionPolicy` | แนบ WebSocket headers แบบ native หรือ session cool-down policy | Provider ต้องการให้ generic WS transports ปรับ session headers หรือนโยบาย fallback |
| 24 | `formatApiKey` | ตัวจัดรูปแบบ auth-profile: โปรไฟล์ที่เก็บไว้จะกลายเป็นสตริง `apiKey` ตอนรันจริง | Provider เก็บ metadata ด้าน auth เพิ่มเติมและต้องการรูปแบบ runtime token แบบกำหนดเอง |
| 25 | `refreshOAuth` | override การรีเฟรช OAuth สำหรับ custom refresh endpoints หรือ refresh-failure policy | Provider ไม่เข้ากับ refreshers แบบ shared `pi-ai` |
| 26 | `buildAuthDoctorHint` | คำแนะนำการซ่อมแซมที่ถูกต่อท้ายเมื่อ OAuth refresh ล้มเหลว | Provider ต้องการคำแนะนำการซ่อม auth ที่เป็นของ provider หลังการรีเฟรชล้มเหลว |
| 27 | `matchesContextOverflowError` | matcher สำหรับ context-window overflow ที่ provider เป็นเจ้าของ | Provider มี raw overflow errors ที่ generic heuristics อาจมองไม่เห็น |
| 28 | `classifyFailoverReason` | การจัดประเภทเหตุผล failover ที่ provider เป็นเจ้าของ | Provider สามารถแมป raw API/transport errors ไปเป็น rate-limit/overload ฯลฯ ได้ |
| 29 | `isCacheTtlEligible` | นโยบาย prompt-cache สำหรับ proxy/backhaul providers | Provider ต้องการ cache TTL gating เฉพาะ proxy |
| 30 | `buildMissingAuthMessage` | ใช้แทนข้อความกู้คืน missing-auth แบบ generic | Provider ต้องการคำใบ้การกู้คืน missing-auth เฉพาะ provider |
| 31 | `suppressBuiltInModel` | การซ่อน stale upstream model พร้อม user-facing error hint แบบไม่บังคับ | Provider ต้องการซ่อน stale upstream rows หรือแทนที่ด้วย vendor hint |
| 32 | `augmentModelCatalog` | เพิ่ม synthetic/final catalog rows หลัง discovery | Provider ต้องการ synthetic forward-compat rows ใน `models list` และ pickers |
| 33 | `resolveThinkingProfile` | ชุดระดับ `/think`, labels ที่แสดง และค่าเริ่มต้นแบบเฉพาะโมเดล | Provider มี thinking ladder แบบกำหนดเองหรือ binary label สำหรับโมเดลที่เลือก |
| 34 | `isBinaryThinking` | hook ความเข้ากันได้ของ on/off reasoning toggle | Provider รองรับการคิดแบบ binary on/off เท่านั้น |
| 35 | `supportsXHighThinking` | hook ความเข้ากันได้สำหรับการรองรับ reasoning แบบ `xhigh` | Provider ต้องการให้ `xhigh` ใช้ได้เฉพาะกับบางโมเดล |
| 36 | `resolveDefaultThinkingLevel` | hook ความเข้ากันได้ของระดับ `/think` เริ่มต้น | Provider เป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับ model family |
| # | Hook | สิ่งที่ทำ | ใช้เมื่อใด |
| --- | --- | --- | --- |
| 37 | `isModernModelRef` | ตัวจับคู่ modern-model สำหรับตัวกรอง live profile และการเลือก smoke | Provider เป็นเจ้าของการจับคู่ preferred-model สำหรับ live/smoke |
| 38 | `prepareRuntimeAuth` | แลกข้อมูลรับรองที่กำหนดค่าไว้ให้เป็น token/key ที่ใช้จริงก่อน inference | Provider ต้องการ token exchange หรือข้อมูลรับรองแบบ short-lived สำหรับคำขอ |
| 39 | `resolveUsageAuth` | resolve ข้อมูลรับรองด้าน usage/billing สำหรับ `/usage` และพื้นผิวสถานะที่เกี่ยวข้อง | Provider ต้องการการแยก usage/quota token แบบกำหนดเอง หรือใช้ข้อมูลรับรองด้าน usage คนละชุด |
| 40 | `fetchUsageSnapshot` | ดึงและ normalize snapshots ด้าน usage/quota ที่เป็นของ provider หลัง resolve auth แล้ว | Provider ต้องการ usage endpoint หรือ payload parser แบบเฉพาะ provider |
| 41 | `createEmbeddingProvider` | สร้าง embedding adapter ที่ provider เป็นเจ้าของสำหรับ memory/search | พฤติกรรมด้าน memory embedding ควรอยู่กับ provider plugin |
| 42 | `buildReplayPolicy` | คืนค่านโยบาย replay ที่ควบคุมการจัดการ transcript สำหรับ provider | Provider ต้องการ transcript policy แบบกำหนดเอง (เช่น การตัด thinking-block) |
| 43 | `sanitizeReplayHistory` | เขียนทับ replay history หลัง generic transcript cleanup | Provider ต้องการ replay rewrites แบบเฉพาะ provider ที่เกินกว่าตัวช่วย Compaction แบบใช้ร่วมกัน |
| 44 | `validateReplayTurns` | ตรวจสอบหรือปรับรูป replay-turn รอบสุดท้ายก่อน embedded runner | transport ของ provider ต้องการการตรวจสอบ turn ที่เข้มงวดยิ่งขึ้นหลัง generic sanitation |
| 45 | `onModelSelected` | รัน side effects หลังการเลือกโมเดลที่เป็นของ provider | Provider ต้องการ telemetry หรือสถานะที่เป็นของ provider เมื่อโมเดลถูกใช้งาน |

## Channel runtime hooks

Channel plugins are also manifest-first.

The manifest can declare:

- `channels`
- channel display metadata
- channel env vars
- channel setup ownership

Runtime channel registration then supplies the actual channel implementation to
the registry.

The main runtime shape is the channel factory registered through the plugin API.
That factory can own:

- connect/login lifecycle
- send/receive
- pairing
- reactions, edits, threads
- channel-scoped command routing or metadata
- transport-specific diagnostics

OpenClaw core still owns generic session routing, queueing, transcript storage,
tool execution, and auth/policy above the channel transport boundary.

## Gateway HTTP routes from plugins

Plugins can register Gateway HTTP routes.

This is for cases where:

- a provider needs a webhook
- a channel transport needs a callback endpoint
- a plugin needs a small HTTP integration surface that belongs with the plugin

These routes are not supposed to bypass Gateway security. They still live under
the Gateway process and should respect the same trust model.

Internally, plugin HTTP routes are registered into the plugin registry, then the
Gateway HTTP layer mounts them into its route table.

When possible, keep public callback behavior narrow:

- validate signatures
- avoid broad unauthenticated mutation routes
- keep route ownership obvious in logs and diagnostics

## Bundle packs

OpenClaw supports **bundle packs** as a manifest-level way to describe
“optional extras” a plugin can ship.

A pack can declare things such as:

- extra npm dependencies
- external binaries or URLs
- setup hints
- install metadata

This is useful when one plugin has optional heavyweight integrations and you
want to describe them in metadata without making them part of the minimal base
runtime.

Bundle packs are descriptive control-plane metadata. Runtime code still decides
what to do with installed extras.

## Import paths and boundaries

For native plugins, the runtime code should only cross the core/plugin boundary
through public plugin seams.

Use:

- `openclaw/plugin-sdk`
- documented runtime API barrels when provided by the repo
- plugin-local files

Do **not** use:

- deep imports into core internals from extension runtime code
- cross-plugin private imports
- relative imports that escape the plugin package root

The point is to keep the runtime contract versionable and auditable.

## Internal schema tables

The registry and loader rely on three schema layers:

1. **Manifest schema**
   - identity
   - ownership declarations
   - setup metadata
   - UI metadata
   - optional bundle-pack metadata

2. **Entry config schema**
   - validates `plugins.entries.<id>.config`
   - should be owned by the plugin manifest/runtime pair
   - can be exposed to the Control UI for generated forms

3. **Runtime hook registration shape**
   - what the plugin actually registers
   - commands, tools, hooks, channels, providers, routes, services

The important architectural rule is:

- manifest/schema = control plane
- registration/runtime = data plane

## Loader decision table

| Question                            | Answer source                     |
| ----------------------------------- | --------------------------------- |
| "Should this plugin exist at all?"  | discovery + filesystem safety     |
| "What does this plugin claim?"      | manifest                          |
| "Is it enabled?"                    | config normalization + allow/deny |
| "How do I validate its config?"     | plugin config schema              |
| "What behavior does it provide?"    | runtime `register(...)`           |
| "How does core find that behavior?" | plugin registry                   |

## Runtime ownership summary

| Surface                    | Core owns? | Plugin owns? |
| -------------------------- | ---------- | ------------ |
| manifest parsing           | yes        | no           |
| plugin discovery           | yes        | no           |
| filesystem safety gates    | yes        | no           |
| registry storage           | yes        | no           |
| enable/disable resolution  | yes        | no           |
| provider auth quirks       | shared     | shared       |
| provider transport details | no         | yes          |
| channel transport details  | no         | yes          |
| session routing            | yes        | no           |
| transcript persistence     | yes        | no           |
| HTTP callback business     | shared     | shared       |
| tool schemas               | shared     | shared       |
| control-plane metadata     | no         | yes          |

## Debugging checklist

If a plugin “exists” but behavior is missing, walk this order:

1. **Discovery**
   - Was the plugin root discovered?
   - Was it blocked by safety checks?

2. **Manifest**
   - Does the manifest declare the thing you expect (provider/channel/setup id)?

3. **Enablement**
   - Is the plugin enabled after `allow`/`deny`/`entries` normalization?

4. **Runtime registration**
   - Did `register(...)` actually run?
   - Did it register into the expected registry slot?

5. **Consumer path**
   - Is the command/runtime surface reading the correct registry entry?

This ordering matters because many “plugin bugs” are actually manifest,
enablement, or loader-boundary problems, not runtime implementation bugs.

## Related

- [Plugin architecture](/th/plugins/architecture)
- [Configuration reference](/th/gateway/configuration-reference)

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ provider plugin ที่
จับคู่ได้ก่อน จากนั้นจึงไล่ผ่าน provider plugins อื่นที่รองรับ hooks จนกว่าจะมีตัวหนึ่งเปลี่ยน
model id หรือ transport/config จริง ๆ วิธีนี้ทำให้ provider shims แบบ alias/compat ยังทำงานได้
โดยไม่ต้องบังคับให้ผู้เรียกรู้ว่า bundled plugin ตัวใดเป็นเจ้าของการเขียนทับนั้น หากไม่มี provider hook ตัวใดเขียนทับ supported
Google-family config entry ตัว normalizer ของ Google แบบ bundled ก็ยังจะใช้ compatibility cleanup นั้นอยู่

หาก provider ต้องการ wire protocol แบบกำหนดเองทั้งหมดหรือ custom request executor
นั่นเป็นส่วนขยายอีกระดับหนึ่ง hooks เหล่านี้มีไว้สำหรับพฤติกรรมเฉพาะ provider ที่ยังคง
ทำงานอยู่บน inference loop ปกติของ OpenClaw

### ตัวอย่าง Provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### ตัวอย่างที่มาพร้อมระบบ

bundled provider plugins จะผสม hooks ข้างต้นเพื่อให้ตรงกับ catalog,
auth, thinking, replay และ usage ของผู้ให้บริการแต่ละราย ชุด hooks ที่เป็นข้อมูลอ้างอิงจริงอยู่กับ
แต่ละ Plugin ภายใต้ `extensions/`; หน้านี้มีไว้เพื่ออธิบายรูปร่างการใช้งาน ไม่ได้คัดลอกรายการทั้งหมดมาไว้

<AccordionGroup>
  <Accordion title="Providers แบบ pass-through catalog">
    OpenRouter, Kilocode, Z.AI, xAI ลงทะเบียน `catalog` ร่วมกับ
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้สามารถแสดง upstream
    model ids ได้ก่อนถึง static catalog ของ OpenClaw
  </Accordion>
  <Accordion title="Providers แบบ OAuth และ usage endpoint">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของ token exchange และการเชื่อมต่อ `/usage`
  </Accordion>
  <Accordion title="ตระกูล replay และ transcript cleanup">
    ตระกูลแบบตั้งชื่อที่ใช้ร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ให้ providers เลือกใช้
    transcript policy ผ่าน `buildReplayPolicy` แทนที่แต่ละ Plugin จะต้อง
    reimplement cleanup เอง
  </Accordion>
  <Accordion title="Providers แบบ catalog-only">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ
    `volcengine` ลงทะเบียนแค่ `catalog` และใช้ inference loop ที่แชร์กัน
  </Accordion>
  <Accordion title="ตัวช่วย stream เฉพาะของ Anthropic">
    Beta headers, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน
    seam แบบสาธารณะ `api.ts` / `contract-api.ts` ของ Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) แทนที่จะอยู่ใน
    generic SDK
  </Accordion>
</AccordionGroup>

## Runtime helpers

Plugins สามารถเข้าถึง core helpers บางส่วนผ่าน `api.runtime` สำหรับ TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

หมายเหตุ:

- `textToSpeech` คืนค่า TTS output payload ปกติของ core สำหรับพื้นผิวแบบไฟล์/voice-note
- ใช้การกำหนดค่า `messages.tts` และการเลือก provider ของ core
- คืนค่า PCM audio buffer + sample rate Plugins ต้อง resample/encode เองตามผู้ให้บริการ
- `listVoices` เป็นตัวเลือกเสริมราย provider ใช้สำหรับ voice pickers หรือ setup flows ที่เป็นของผู้ให้บริการ
- รายการเสียงสามารถรวม metadata ที่สมบูรณ์ขึ้นได้ เช่น locale, gender และ personality tags สำหรับ pickers ที่รับรู้ provider
- ปัจจุบัน OpenAI และ ElevenLabs รองรับ telephony ส่วน Microsoft ยังไม่รองรับ

Plugins ยังสามารถลงทะเบียน speech providers ผ่าน `api.registerSpeechProvider(...)`

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

หมายเหตุ:

- ให้คง TTS policy, fallback และการส่งคำตอบไว้ใน core
- ใช้ speech providers สำหรับพฤติกรรมการสังเคราะห์เสียงที่เป็นของผู้ให้บริการ
- อินพุต `edge` แบบเดิมของ Microsoft จะถูก normalize ไปเป็น provider id `microsoft`
- โมเดลความเป็นเจ้าของที่แนะนำคือแบบอิงบริษัท: vendor plugin หนึ่งตัวสามารถเป็นเจ้าของ
  text, speech, image และผู้ให้บริการสื่อในอนาคต เมื่อ OpenClaw เพิ่ม capability contracts เหล่านั้น

สำหรับความเข้าใจรูปภาพ/audio/video, Plugins จะลงทะเบียน
media-understanding provider แบบมีชนิด แทนการใช้ key/value bag แบบ generic:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

หมายเหตุ:

- ให้คง orchestration, fallback, config และ wiring ของช่องทางไว้ใน core
- ให้คงพฤติกรรมเฉพาะ vendor ไว้ใน provider plugin
- การขยายแบบ additive ควรคงเป็นแบบมีชนิด: methods แบบไม่บังคับใหม่, result fields แบบไม่บังคับใหม่, capabilities แบบไม่บังคับใหม่
- การสร้างวิดีโอก็ใช้รูปแบบเดียวกันอยู่แล้ว:
  - core เป็นเจ้าของ capability contract และ runtime helper
  - vendor plugins ลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins ใช้ `api.runtime.videoGeneration.*`

สำหรับ media-understanding runtime helpers, Plugins สามารถเรียก:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

สำหรับการถอดเสียงจาก audio, Plugins สามารถใช้ได้ทั้ง media-understanding runtime
หรือ STT alias แบบเดิม:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` เป็นพื้นผิวที่ใช้ร่วมกันที่แนะนำสำหรับ
  ความเข้าใจรูปภาพ/audio/video
- ใช้การกำหนดค่า audio ของ media-understanding ใน core (`tools.media.audio`) และลำดับ fallback ของ provider
- คืนค่า `{ text: undefined }` เมื่อไม่มีผลลัพธ์การถอดเสียงเกิดขึ้น (เช่น input ถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงมีอยู่ในฐานะ compatibility alias

Plugins ยังสามารถเปิดการรัน subagent แบบเบื้องหลังผ่าน `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

หมายเหตุ:

- `provider` และ `model` เป็นเพียง overrides ต่อการรัน ไม่ใช่การเปลี่ยนแปลงแบบถาวรของ session
- OpenClaw จะยอมรับฟิลด์ override เหล่านี้เฉพาะสำหรับผู้เรียกที่เชื่อถือได้
- สำหรับ fallback runs ที่ Plugin เป็นเจ้าของ ผู้ปฏิบัติงานต้องเลือกใช้ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด trusted plugins ให้เหลือเป้าหมาย canonical `provider/model` ที่ระบุ หรือใช้ `"*"` เพื่ออนุญาตทุกเป้าหมายอย่างชัดเจน
- การรัน subagent ของ Plugin ที่ไม่เชื่อถือได้ยังคงทำงาน แต่คำขอ override จะถูกปฏิเสธแทนที่จะ fallback แบบเงียบ ๆ

สำหรับ web search, Plugins สามารถใช้ runtime helper ที่ใช้ร่วมกันแทน
การเจาะเข้าไปใน agent tool wiring:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugins ยังสามารถลงทะเบียน web-search providers ผ่าน
`api.registerWebSearchProvider(...)`

หมายเหตุ:

- ให้คงการเลือก provider, credential resolution และ request semantics ที่ใช้ร่วมกันไว้ใน core
- ใช้ web-search providers สำหรับ search transports ที่เฉพาะกับ vendor
- `api.runtime.webSearch.*` เป็นพื้นผิวที่ใช้ร่วมกันที่แนะนำสำหรับ feature/channel plugins ที่ต้องการพฤติกรรมการค้นหาโดยไม่ผูกกับ agent tool wrapper

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: สร้างภาพโดยใช้สายโซ่ image-generation provider ที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการ image-generation providers ที่ใช้งานได้และความสามารถของแต่ละตัว

## Gateway HTTP routes

Plugins สามารถเปิดเผย HTTP endpoints ผ่าน `api.registerHttpRoute(...)`

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

ฟิลด์ของ route:

- `path`: เส้นทาง route ภายใต้ Gateway HTTP server
- `auth`: จำเป็น ต้องใช้ `"gateway"` เพื่อให้ต้องผ่าน gateway auth ปกติ หรือ `"plugin"` สำหรับ auth/webhook verification ที่ Plugin จัดการเอง
- `match`: ไม่บังคับ `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: ไม่บังคับ อนุญาตให้ Plugin เดียวกันแทนที่ route registration เดิมของตัวเองได้
- `handler`: ให้คืน `true` เมื่อ route นั้นจัดการคำขอแล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกถอดออกแล้ว และจะทำให้เกิดข้อผิดพลาดตอนโหลด Plugin ใช้ `api.registerHttpRoute(...)` แทน
- Plugin routes ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งของ `path + match` แบบ exact จะถูกปฏิเสธ เว้นแต่ `replaceExisting: true` และ Plugin หนึ่งไม่สามารถแทนที่ route ของอีก Plugin ได้
- routes ที่ทับซ้อนกันแต่มีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้คง chains แบบ fallthrough ของ `exact`/`prefix` ไว้เฉพาะในระดับ auth เดียวกัน
- routes แบบ `auth: "plugin"` จะ **ไม่ได้รับ** runtime scopes ของผู้ปฏิบัติงานโดยอัตโนมัติ มีไว้สำหรับ webhooks/signature verification ที่ Plugin จัดการเอง ไม่ใช่สำหรับเรียก Gateway helper calls แบบมีสิทธิ์สูง
- routes แบบ `auth: "gateway"` ทำงานภายใน Gateway request runtime scope แต่ scope นี้ถูกทำให้ระมัดระวังไว้โดยตั้งใจ:
  - bearer auth แบบ shared-secret (`gateway.auth.mode = "token"` / `"password"`) จะตรึง runtime scopes ของ plugin-route ไว้ที่ `operator.write` แม้ว่าผู้เรียกจะส่ง `x-openclaw-scopes` มาก็ตาม
  - โหมด HTTP แบบ trusted ที่มีตัวตน (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน private ingress) จะเคารพ `x-openclaw-scopes` เฉพาะเมื่อมี header นี้อย่างชัดเจน
  - หากไม่มี `x-openclaw-scopes` ในคำขอ plugin-route แบบมีตัวตนเหล่านั้น runtime scope จะ fallback ไปที่ `operator.write`
- กฎในทางปฏิบัติ: อย่าคิดว่า gateway-auth plugin route เป็นพื้นผิวระดับผู้ดูแลโดยปริยาย หาก route ของคุณต้องการพฤติกรรมแบบ admin-only ให้บังคับใช้โหมด auth แบบมีตัวตนและจัดทำเอกสารสัญญาของ header `x-openclaw-scopes` ที่ต้องระบุอย่างชัดเจน

## Plugin SDK import paths

ใช้ SDK subpaths แบบแคบแทน root barrel แบบรวมศูนย์ `openclaw/plugin-sdk`
เมื่อเขียน Plugin ใหม่ Core subpaths หลักมีดังนี้:

| Subpath | จุดประสงค์ |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | primitives สำหรับการลงทะเบียน Plugin |
| `openclaw/plugin-sdk/channel-core` | ตัวช่วย entry/build ของ Channel |
| `openclaw/plugin-sdk/core` | ตัวช่วยแบบใช้ร่วมกันทั่วไปและ umbrella contract |
| `openclaw/plugin-sdk/config-schema` | Zod schema ของ root `openclaw.json` (`OpenClawSchema`) |

Channel plugins เลือกใช้จาก family ของ seams แบบแคบ — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` และ `channel-actions` พฤติกรรมด้าน approval ควรถูกรวมศูนย์
บนสัญญา `approvalCapability` เดียว แทนการผสมอยู่ในฟิลด์ Plugin ที่ไม่เกี่ยวข้องกัน
ดู [Channel plugins](/th/plugins/sdk-channel-plugins)

ตัวช่วยด้าน runtime และ config อยู่ใต้ subpaths แบบ `*-runtime`
ที่ตรงกัน (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` เป็นต้น)

<Info>
`openclaw/plugin-sdk/channel-runtime` ถูกเลิกใช้แล้ว — เป็น compatibility shim สำหรับ
plugins รุ่นเก่า โค้ดใหม่ควร import generic primitives ที่แคบกว่าแทน
</Info>

entry points ภายในรีโป (ต่อ root ของแต่ละ bundled plugin package):

- `index.js` — entry ของ bundled plugin
- `api.js` — barrel ของ helper/types
- `runtime-api.js` — barrel สำหรับ runtime-only
- `setup-entry.js` — entry ของ setup plugin

external plugins ควร import เฉพาะ subpaths `openclaw/plugin-sdk/*` เท่านั้น ห้าม
import `src/*` ของ package Plugin อื่นจาก core หรือจาก Plugin อื่น
entry points ที่โหลดผ่าน facade จะให้ความสำคัญกับ runtime config snapshot ที่ใช้งานอยู่เมื่อมีอยู่
จากนั้นจึง fallback ไปยัง config file ที่ resolve แล้วบนดิสก์

subpaths เฉพาะความสามารถ เช่น `image-generation`, `media-understanding`
และ `speech` มีอยู่เพราะ bundled plugins ใช้มันอยู่ในปัจจุบัน สิ่งเหล่านี้ไม่ได้
ถูกตรึงเป็นสัญญาภายนอกระยะยาวโดยอัตโนมัติ — ให้ตรวจหน้า SDK reference
ที่เกี่ยวข้องเมื่อจะพึ่งพามัน

## Message tool schemas

Plugins ควรเป็นเจ้าของการเพิ่ม `describeMessageTool(...)` schema แบบเฉพาะช่องทาง
สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reactions, reads และ polls
การแสดงผลของ send ที่ใช้ร่วมกันควรใช้สัญญา `MessagePresentation` แบบ generic
แทนฟิลด์ button, component, block หรือ card แบบ native ของ provider
ดู [Message Presentation](/th/plugins/message-presentation) สำหรับสัญญา,
กฎ fallback, การแมป provider และเช็กลิสต์สำหรับผู้เขียน Plugin

send-capable plugins จะประกาศสิ่งที่ตัวเองเรนเดอร์ได้ผ่าน message capabilities:

- `presentation` สำหรับ semantic presentation blocks (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอส่งแบบปักหมุด

core เป็นผู้ตัดสินว่าจะเรนเดอร์ presentation แบบเนทีฟหรือ degrade ให้เป็นข้อความ
ห้ามเปิดเผย escape hatches ของ UI แบบ native ของ provider ผ่าน generic message tool
ตัวช่วย SDK แบบ deprecated สำหรับ native schemas แบบเดิมยังคงส่งออกไว้เพื่อรองรับ
third-party plugins ที่มีอยู่ แต่ Plugin ใหม่ไม่ควรใช้มัน

## การ resolve เป้าหมายของช่องทาง

Channel plugins ควรเป็นเจ้าของ semantics ของเป้าหมายที่เฉพาะกับช่องทาง ให้คง
outbound host ที่ใช้ร่วมกันเป็นแบบ generic และใช้พื้นผิว messaging adapter สำหรับกฎของ provider:

- `messaging.inferTargetChatType({ to })` ใช้ตัดสินว่า normalized target
  ควรถูกมองเป็น `direct`, `group` หรือ `channel` ก่อน directory lookup
- `messaging.targetResolver.looksLikeId(raw, normalized)` ใช้บอก core ว่าอินพุต
  ควรข้ามไป resolve แบบ id-like โดยตรงแทนการค้นหาใน directory หรือไม่
- `messaging.targetResolver.resolveTarget(...)` คือ fallback ของ plugin เมื่อ
  core ต้องการ provider-owned resolution ขั้นสุดท้ายหลัง normalize หรือหลังหาใน
  directory ไม่พบ
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้าง session route แบบเฉพาะ provider
  เมื่อ resolve เป้าหมายได้แล้ว

การแบ่งส่วนที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินหมวดหมู่ที่ควรเกิดขึ้นก่อน
  การค้นหา peers/groups
- ใช้ `looksLikeId` สำหรับการตรวจแบบ "ให้ถือว่านี่เป็น explicit/native target id"
- ใช้ `resolveTarget` สำหรับ provider-specific normalization fallback ไม่ใช่
  สำหรับการค้นหา directory แบบกว้าง
- ให้เก็บ ids แบบ native ของ provider เช่น chat ids, thread ids, JIDs, handles และ room
  ids ไว้ในค่า `target` หรือพารามิเตอร์เฉพาะ provider ไม่ใช่ใน generic SDK fields

## ไดเรกทอรีที่อิงกับ config

Plugins ที่ derive รายการไดเรกทอรีจาก config ควรเก็บตรรกะนั้นไว้ใน
Plugin และใช้ตัวช่วยที่ใช้ร่วมกันจาก
`openclaw/plugin-sdk/directory-runtime`

ใช้สิ่งนี้เมื่อ channel ต้องการ peers/groups ที่อิงกับ config เช่น:

- DM peers ที่ขับเคลื่อนด้วย allowlist
- channel/group maps ที่กำหนดค่าไว้
- account-scoped static directory fallbacks

ตัวช่วยที่ใช้ร่วมกันใน `directory-runtime` จัดการเฉพาะงานทั่วไป:

- query filtering
- การใช้ limit
- ตัวช่วย deduping/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีเฉพาะ channel และการ normalize id ควรอยู่ใน
implementation ของ Plugin

## Provider catalogs

Provider plugins สามารถกำหนด model catalogs สำหรับ inference ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` คืนค่ารูปร่างเดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับหนึ่ง provider entry
- `{ providers }` สำหรับหลาย provider entries

ใช้ `catalog` เมื่อ Plugin เป็นเจ้าของ provider-specific model ids, base URL
defaults หรือ auth-gated model metadata

`catalog.order` ควบคุมเวลาที่ catalog ของ Plugin จะ merge เทียบกับ implicit providers ที่มีมาใน OpenClaw:

- `simple`: providers แบบ API-key หรือ env-driven ธรรมดา
- `profile`: providers ที่ปรากฏเมื่อมี auth profiles
- `paired`: providers ที่สังเคราะห์หลาย provider entries ที่เกี่ยวข้องกัน
- `late`: รอบสุดท้าย หลังจาก implicit providers อื่น ๆ

providers ที่มา later จะชนะเมื่อคีย์ชนกัน ดังนั้น Plugins จึงสามารถ override
built-in provider entry ที่มี provider id เดียวกันได้โดยตั้งใจ

ความเข้ากันได้:

- `discovery` ยังคงทำงานได้ในฐานะ alias แบบเดิม
- หากลงทะเบียนทั้ง `catalog` และ `discovery`, OpenClaw จะใช้ `catalog`

## การตรวจสอบช่องทางแบบอ่านอย่างเดียว

หาก Plugin ของคุณลงทะเบียน channel ให้พิจารณาติดตั้ง
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` คือเส้นทางขณะรันจริง มันสามารถสมมติได้ว่าข้อมูลรับรอง
  ถูก materialize อย่างสมบูรณ์แล้ว และสามารถล้มเหลวทันทีเมื่อ secrets ที่จำเป็นขาดหาย
- เส้นทางคำสั่งแบบอ่านอย่างเดียว เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และ flows ของ doctor/config
  repair ไม่ควรต้อง materialize runtime credentials เพียงเพื่ออธิบาย configuration

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- คืนค่าเฉพาะสถานะบัญชีเชิงพรรณนา
- รักษาค่า `enabled` และ `configured`
- รวมฟิลด์ source/status ของข้อมูลรับรองเมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องคืน raw token values เพียงเพื่อรายงานความพร้อมใช้งานแบบอ่านอย่างเดียว การคืน `tokenStatus: "available"` (พร้อมฟิลด์ source ที่ตรงกัน) ก็เพียงพอสำหรับคำสั่งแนว status
- ใช้ `configured_unavailable` เมื่อข้อมูลรับรองถูกกำหนดค่าไว้ผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน

วิธีนี้ทำให้คำสั่งแบบอ่านอย่างเดียวสามารถรายงานว่า "configured but unavailable in this command path" แทนที่จะพังหรือรายงานผิดว่าบัญชียังไม่ได้กำหนดค่า

## Package packs

ไดเรกทอรีของ Plugin อาจมี `package.json` ที่มี `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น Plugin หาก pack แสดงหลาย extensions, plugin id
จะกลายเป็น `name/<fileBase>`

หาก Plugin ของคุณ import npm deps ให้ติดตั้งมันในไดเรกทอรีนั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

ข้อป้องกันด้านความปลอดภัย: ทุก entry ใน `openclaw.extensions` ต้องอยู่ภายใน plugin
directory หลังการ resolve symlink entries ที่หลุดออกนอก package directory จะถูก
ปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` จะติดตั้ง dependencies ของ Plugin ด้วย
`npm install --omit=dev --ignore-scripts` (ไม่มี lifecycle scripts และไม่มี dev dependencies ตอนรันจริง) ให้คง dependency
trees ของ Plugin เป็น "pure JS/TS" และหลีกเลี่ยงแพ็กเกจที่ต้องใช้ `postinstall` builds

ตัวเลือกเสริม: `openclaw.setupEntry` สามารถชี้ไปยังโมดูล setup-only แบบเบา
เมื่อ OpenClaw ต้องการพื้นผิว setup สำหรับ channel plugin ที่ถูกปิดใช้งาน หรือ
เมื่อ channel plugin เปิดอยู่แต่ยังไม่ถูกกำหนดค่า มันจะโหลด `setupEntry`
แทน full plugin entry วิธีนี้ช่วยให้การเริ่มต้นและ setup เบาลง
เมื่อ plugin entry หลักของคุณยังต้องต่อเครื่องมือ hooks หรือโค้ดอื่นที่เป็น runtime-only

ตัวเลือกเสริม: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถให้ channel plugin เลือกใช้เส้นทาง `setupEntry` เดียวกันในช่วง
pre-listen startup ของ gateway ได้ แม้ว่า channel จะถูกกำหนดค่าแล้วก็ตาม

ให้ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิว startup ทั้งหมดที่ต้องมี
ก่อน gateway เริ่มฟังเท่านั้น ในทางปฏิบัติหมายความว่า setup entry
ต้องลงทะเบียนทุกความสามารถที่ channel เป็นเจ้าของซึ่ง startup พึ่งพา เช่น:

- การลงทะเบียน channel เอง
- HTTP routes ใด ๆ ที่ต้องพร้อมก่อน gateway เริ่มฟัง
- gateway methods, tools หรือ services ใด ๆ ที่ต้องมีอยู่ในช่วงเวลาเดียวกันนั้น

หาก full entry ของคุณยังเป็นเจ้าของความสามารถ startup ที่จำเป็นใด ๆ อยู่ อย่าเปิดใช้
แฟลกนี้ ให้คงพฤติกรรมเริ่มต้นไว้และให้ OpenClaw โหลด full entry ระหว่าง startup

bundled channels ยังสามารถเผยแพร่ setup-only contract-surface helpers ที่ core
สามารถปรึกษาได้ก่อนโหลด full channel runtime พื้นผิว setup promotion ปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core ใช้พื้นผิวนี้เมื่อจำเป็นต้องโปรโมต legacy single-account channel
config ไปเป็น `channels.<id>.accounts.*` โดยไม่ต้องโหลด full plugin entry
Matrix เป็นตัวอย่าง bundled ปัจจุบัน: มันจะย้ายเฉพาะคีย์ด้าน auth/bootstrap ไปยัง
บัญชีที่ถูกโปรโมตแบบมีชื่อเมื่อมี named accounts อยู่แล้ว และสามารถคง
default-account key แบบ non-canonical ที่กำหนดค่าไว้ แทนการสร้าง
`accounts.default` เสมอ

setup patch adapters เหล่านั้นช่วยให้ contract-surface discovery ของ bundled ยังคง lazy
เวลา import จึงยังเบา; promotion surface จะถูกโหลดเมื่อถูกใช้ครั้งแรกแทนที่จะ
ย้อนกลับเข้า startup ของ bundled channel ตอน import โมดูล

เมื่อพื้นผิว startup เหล่านั้นมี gateway RPC methods อยู่ด้วย ให้คงไว้บน
prefix ที่เฉพาะกับ Plugin namespaces ของ admin ใน core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และจะ resolve
ไปเป็น `operator.admin` เสมอ แม้ว่า Plugin จะร้องขอ scope ที่แคบกว่าก็ตาม

ตัวอย่าง:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadata ของ channel catalog

Channel plugins สามารถประกาศ setup/discovery metadata ผ่าน `openclaw.channel` และ
install hints ผ่าน `openclaw.install` วิธีนี้ช่วยให้ core ไม่ต้องมีข้อมูล catalog ติดตัว

ตัวอย่าง:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "แชตแบบ self-hosted ผ่าน webhook bots ของ Nextcloud Talk",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

ฟิลด์ `openclaw.channel` ที่มีประโยชน์นอกเหนือจากตัวอย่างขั้นต่ำ:

- `detailLabel`: ป้ายรองสำหรับพื้นผิว catalog/status ที่สมบูรณ์ขึ้น
- `docsLabel`: override ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: plugin/channel ids ที่มีลำดับความสำคัญต่ำกว่าซึ่งรายการ catalog นี้ควรอยู่เหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความคัดลอกของ selection-surface
- `markdownCapable`: ทำเครื่องหมายว่า channel รองรับ Markdown สำหรับการตัดสินใจด้านการจัดรูปแบบขาออก
- `exposure.configured`: ซ่อน channel จากพื้นผิวรายการ configured-channel เมื่อกำหนดเป็น `false`
- `exposure.setup`: ซ่อน channel จากตัวเลือก setup/configure แบบโต้ตอบ เมื่อกำหนดเป็น `false`
- `exposure.docs`: ทำเครื่องหมาย channel ว่าเป็น internal/private สำหรับพื้นผิวนำทางเอกสาร
- `showConfigured` / `showInSetup`: alias แบบเดิมที่ยังยอมรับเพื่อความเข้ากันได้; ควรใช้ `exposure`
- `quickstartAllowFrom`: ให้ channel เลือกใช้ flow มาตรฐานของ quickstart `allowFrom`
- `forceAccountBinding`: บังคับให้ bind บัญชีอย่างชัดเจน แม้จะมีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: ให้ความสำคัญกับ session lookup เมื่อต้อง resolve announce targets

OpenClaw ยังสามารถ merge **external channel catalogs** ได้ (เช่น export จาก
MPM registry) ให้วางไฟล์ JSON ไว้ที่หนึ่งในตำแหน่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยัง
ไฟล์ JSON หนึ่งไฟล์หรือมากกว่า (คั่นด้วย comma/semicolon/`PATH`) แต่ละไฟล์ควร
มี `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` parser ยังรับ `"packages"` หรือ `"plugins"` เป็น alias แบบเดิมของคีย์ `"entries"` ด้วย

generated channel catalog entries และ provider install catalog entries จะเปิดเผย
normalized install-source facts ควบคู่กับบล็อก `openclaw.install` ดิบ
normalized facts จะระบุว่า npm spec เป็น exact version หรือ floating
selector, มี expected integrity metadata หรือไม่ และมี local source path ให้ใช้ด้วยหรือไม่
consumers ควรถือว่า `installSource` เป็นฟิลด์แบบไม่บังคับที่เพิ่มเข้ามา เพื่อให้รายการแบบ hand-built รุ่นเก่าและ compatibility shims
ไม่จำเป็นต้องสังเคราะห์มันขึ้นมา วิธีนี้ทำให้ onboarding และ diagnostics อธิบาย
สถานะของ source-plane ได้โดยไม่ต้อง import plugin runtime

official external npm entries ควรเลือกใช้ `npmSpec` แบบ exact พร้อม
`expectedIntegrity` ชื่อ package แบบเปล่าและ dist-tags ยังคงใช้ได้เพื่อความเข้ากันได้ แต่จะมี source-plane warnings ปรากฏ เพื่อให้ catalog ค่อย ๆ ไปสู่การติดตั้งแบบ pinned และตรวจสอบ integrity โดยไม่ทำให้ plugins เดิมเสีย เมื่อ onboarding ติดตั้งจาก local catalog path มันจะบันทึก
รายการ `plugins.installs` ด้วย `source: "path"` และ `sourcePath` ที่เป็น relative ต่อ workspace
เมื่อทำได้ absolute operational load path จะยังคงอยู่ใน
`plugins.load.paths`; install record จะหลีกเลี่ยงการทำซ้ำ local workstation
paths ลงใน config ระยะยาว วิธีนี้ทำให้ local development installs มองเห็นได้ต่อ
source-plane diagnostics โดยไม่เพิ่มพื้นผิวการเปิดเผย raw filesystem-path ชุดที่สอง

## Context engine plugins

Context engine plugins เป็นเจ้าของ orchestration ของ session context สำหรับ ingest, assembly
และ Compaction ลงทะเบียนจาก Plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` จากนั้นเลือก engine ที่ใช้งานอยู่ด้วย
`plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ Plugin ของคุณต้องการแทนที่หรือขยาย context
pipeline เริ่มต้น แทนที่จะเพียงเพิ่ม memory search หรือ hooks

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

หาก engine ของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึมของ Compaction ให้คง `compact()`
ไว้และ delegate อย่างชัดเจน:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## การเพิ่มความสามารถใหม่

เมื่อ Plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน ห้ามข้าม
plugin system ด้วยการเจาะแบบ private reach-in ให้เพิ่ม capability ที่ขาดหายแทน

ลำดับที่แนะนำ:

1. กำหนด core contract
   ตัดสินว่า shared behavior ใดควรเป็นของ core: policy, fallback, config merge,
   lifecycle, channel-facing semantics และรูปร่างของ runtime helper
2. เพิ่มพื้นผิว typed plugin registration/runtime
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วย
   typed capability surface ที่เล็กที่สุดแต่มีประโยชน์
3. เชื่อม core + channel/feature consumers
   Channels และ feature plugins ควรใช้ความสามารถใหม่นี้ผ่าน core
   ไม่ใช่โดย import vendor implementation โดยตรง
4. ลงทะเบียน vendor implementations
   จากนั้น vendor plugins จึงลงทะเบียน backends ของตนกับ capability นี้
5. เพิ่ม contract coverage
   เพิ่ม tests เพื่อให้ ownership และรูปร่างของ registration ยังคงชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw คงความมีจุดยืนของตัวเองไว้ได้ โดยไม่กลายเป็นระบบที่ฮาร์ดโค้ด
ตามโลกทัศน์ของ provider รายเดียว ดู [Capability Cookbook](/th/plugins/architecture)
สำหรับเช็กลิสต์ไฟล์แบบเป็นรูปธรรมและตัวอย่างที่ทำงานจริง

### เช็กลิสต์ของ Capability

เมื่อคุณเพิ่ม capability ใหม่ โดยทั่วไปการติดตั้งใช้งานควรแตะพื้นผิวเหล่านี้ร่วมกัน:

- core contract types ใน `src/<capability>/types.ts`
- core runner/runtime helper ใน `src/<capability>/runtime.ts`
- plugin API registration surface ใน `src/plugins/types.ts`
- plugin registry wiring ใน `src/plugins/registry.ts`
- plugin runtime exposure ใน `src/plugins/runtime/*` เมื่อ feature/channel
  plugins ต้องใช้มัน
- capture/test helpers ใน `src/test-utils/plugin-registration.ts`
- ownership/contract assertions ใน `src/plugins/contracts/registry.ts`
- เอกสารสำหรับผู้ปฏิบัติงาน/Plugin ใน `docs/`

หากพื้นผิวใดพื้นผิวหนึ่งหายไป มักเป็นสัญญาณว่า capability นั้น
ยังไม่ได้ผสานรวมอย่างสมบูรณ์

### เทมเพลตของ Capability

รูปแบบขั้นต่ำ:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

รูปแบบของ contract test:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

สิ่งนี้ทำให้กฎยังคงเรียบง่าย:

- core เป็นเจ้าของ capability contract + orchestration
- vendor plugins เป็นเจ้าของ vendor implementations
- feature/channel plugins ใช้ runtime helpers
- contract tests ช่วยให้ ownership ยังคงชัดเจน

## ที่เกี่ยวข้อง

- [สถาปัตยกรรมของ Plugin](/th/plugins/architecture) — โมเดลความสามารถสาธารณะและรูปร่าง
- [Plugin SDK subpaths](/th/plugins/sdk-subpaths)
- [Plugin SDK setup](/th/plugins/sdk-setup)
- [การสร้าง Plugins](/th/plugins/building-plugins)
