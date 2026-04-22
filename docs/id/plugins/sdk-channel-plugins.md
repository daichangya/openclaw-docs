---
read_when:
    - Anda sedang membangun Plugin channel perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke sebuah platform perpesanan
    - Anda perlu memahami permukaan adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun Plugin channel perpesanan bagi OpenClaw
title: Membangun Plugin Channel
x-i18n:
    generated_at: "2026-04-22T04:24:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Membangun Plugin Channel

Panduan ini membahas langkah demi langkah membangun Plugin channel yang menghubungkan OpenClaw ke sebuah
platform perpesanan. Di akhir, Anda akan memiliki channel yang berfungsi dengan keamanan DM,
pairing, reply threading, dan pengiriman pesan outbound.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Getting Started](/id/plugins/building-plugins) terlebih dahulu untuk struktur
  package dasar dan penyiapan manifest.
</Info>

## Cara kerja Plugin channel

Plugin channel tidak memerlukan tool send/edit/react sendiri. OpenClaw mempertahankan satu
tool `message` bersama di core. Plugin Anda memiliki:

- **Config** — resolusi akun dan wizard penyiapan
- **Security** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Tata bahasa sesi** — cara id percakapan khusus provider dipetakan ke chat dasar, id thread, dan fallback induk
- **Outbound** — mengirim teks, media, dan poll ke platform
- **Threading** — cara balasan di-thread

Core memiliki tool message bersama, wiring prompt, bentuk luar session-key,
pencatatan generik `:thread:`, dan dispatch.

Jika channel Anda menambahkan parameter message-tool yang membawa sumber media, tampilkan
nama parameter tersebut melalui `describeMessageTool(...).mediaSourceParams`. Core menggunakan
daftar eksplisit itu untuk normalisasi path sandbox dan kebijakan akses media outbound,
sehingga plugin tidak memerlukan special case shared-core untuk parameter avatar,
lampiran, atau cover-image yang khusus provider.
Lebih baik mengembalikan peta berbasis action seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` agar action yang tidak terkait tidak
mewarisi argumen media milik action lain. Array datar tetap berfungsi untuk parameter yang
memang sengaja dibagikan di semua action yang diekspos.

Jika platform Anda menyimpan scope tambahan di dalam id percakapan, simpan parsing itu
di plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook kanonis
untuk memetakan `rawId` ke id percakapan dasar, id thread opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates`
apa pun.
Saat Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari
induk yang paling sempit ke percakapan induk/dasar yang paling luas.

Plugin bawaan yang memerlukan parsing yang sama sebelum registry channel boot
juga dapat mengekspos file `session-key-api.ts` tingkat atas dengan
ekspor `resolveSessionConversation(...)` yang sesuai. Core menggunakan permukaan
yang aman saat bootstrap itu hanya ketika registry plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai fallback kompatibilitas legacy ketika sebuah plugin hanya memerlukan fallback induk di atas
id generik/raw. Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
fallback ke `resolveParentConversationCandidates(...)` ketika hook kanonis
menghilangkannya.

## Persetujuan dan kemampuan channel

Sebagian besar plugin channel tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` di chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Pilih satu objek `approvalCapability` pada plugin channel ketika channel memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Tempatkan fakta pengiriman/native/render/auth persetujuan di `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; core tidak lagi membaca hook auth persetujuan dari objek itu.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan chat-yang-sama.
- Jika channel Anda mengekspos persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status permukaan-pemicu/klien-native ketika berbeda dari auth persetujuan chat-yang-sama. Core menggunakan hook khusus exec itu untuk membedakan `enabled` vs `disabled`, memutuskan apakah channel pemicu mendukung persetujuan exec native, dan menyertakan channel tersebut dalam panduan fallback klien-native. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload yang khusus channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk perutean persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native milik channel. Pertahankan agar tetap lazy pada entrypoint channel yang hot dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai kebutuhan sambil tetap memungkinkan core merakit siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya ketika channel benar-benar memerlukan payload persetujuan kustom alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika channel ingin balasan jalur-disabled menjelaskan knob config yang tepat yang diperlukan untuk mengaktifkan persetujuan exec native. Hook menerima `{ channel, channelLabel, accountId }`; channel akun bernama sebaiknya merender path berscope akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika sebuah channel dapat menyimpulkan identitas DM yang stabil mirip owner dari config yang sudah ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` chat-yang-sama tanpa menambahkan logika core khusus persetujuan.
- Jika sebuah channel memerlukan pengiriman persetujuan native, pertahankan kode channel tetap berfokus pada normalisasi target plus fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Tempatkan fakta khusus channel di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sehingga core dapat merakit handler dan memiliki filtering permintaan, perutean, dedupe, expiry, subscription gateway, dan pemberitahuan routed-elsewhere. `nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:
- `availability` — apakah akun dikonfigurasi dan apakah sebuah permintaan seharusnya ditangani
- `presentation` — memetakan view model persetujuan bersama ke payload native pending/resolved/expired atau action final
- `transport` — menyiapkan target plus mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` — hook bind/unbind/clear-action opsional untuk tombol atau reaksi native
- `observe` — hook diagnostik pengiriman opsional
- Jika channel memerlukan objek milik runtime seperti client, token, Bolt app, atau penerima webhook, daftarkan objek tersebut melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context generik memungkinkan core melakukan bootstrap handler berbasis capability dari status startup channel tanpa menambahkan wrapper glue khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat lebih rendah hanya ketika seam berbasis capability belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap terbatas pada akun bot yang benar, dan `approvalKind` menjaga perilaku persetujuan exec vs plugin tetap tersedia bagi channel tanpa cabang hardcoded di core.
- Core sekarang juga memiliki pemberitahuan pengalihan rute persetujuan. Plugin channel tidak boleh mengirim pesan tindak lanjut sendiri seperti "approval went to DMs / another channel" dari `createChannelNativeApprovalRuntime`; sebaliknya, ekspos perutean origin + DM approver yang akurat melalui helper capability persetujuan bersama dan biarkan core mengagregasi pengiriman aktual sebelum memposting pemberitahuan kembali ke chat pemicu.
- Pertahankan jenis id persetujuan yang dikirim secara end-to-end. Klien native tidak boleh
  menebak atau menulis ulang perutean persetujuan exec vs plugin dari status lokal channel.
- Jenis persetujuan yang berbeda dengan sengaja dapat mengekspos permukaan native yang berbeda.
  Contoh bawaan saat ini:
  - Slack mempertahankan perutean persetujuan native tersedia untuk id exec dan plugin.
  - Matrix mempertahankan perutean DM/channel native yang sama dan UX reaksi untuk persetujuan exec
    dan plugin, sambil tetap memungkinkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya memilih capability builder dan mengekspos `approvalCapability` pada plugin.

Untuk entrypoint channel yang hot, pilih subpath runtime yang lebih sempit ketika Anda hanya
memerlukan satu bagian dari keluarga itu:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Demikian pula, pilih `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` ketika Anda tidak memerlukan permukaan umbrella
yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adapter patch setup yang aman untuk import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy yang didelegasikan
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah seam adapter sadar-env yang sempit
  untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup pemasangan-opsional
  plus beberapa primitif yang aman untuk setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika channel Anda mendukung setup atau auth berbasis env dan alur startup/config generik
perlu mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan nama itu di
manifest plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime channel atau
konstanta lokal untuk salinan yang ditujukan kepada operator saja.

Jika channel Anda dapat muncul di `status`, `channels list`, `channels status`, atau pemindaian SecretRef sebelum runtime plugin dimulai, tambahkan `openclaw.setupEntry` di `package.json`. Entrypoint itu harus aman untuk diimpor pada path perintah read-only dan harus mengembalikan metadata channel, adapter config yang aman untuk setup, adapter status, dan metadata target secret channel yang diperlukan untuk ringkasan tersebut. Jangan memulai client, listener, atau runtime transport dari entri setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya ketika Anda juga memerlukan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "instal plugin ini terlebih dahulu" di permukaan
setup, pilih `createOptionalChannelSetupSurface(...)`. Adapter/wizard yang dihasilkan gagal tertutup pada penulisan config dan finalisasi, dan menggunakan ulang pesan install-required yang sama di validasi, finalize, dan salinan tautan dokumen.

Untuk path channel hot lainnya, pilih helper yang sempit daripada permukaan legacy yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk config multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk route/envelope inbound dan
  wiring record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media plus delegasi
  identitas/send outbound dan perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` ketika route outbound harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:` saat ini
  setelah key sesi dasar masih cocok. Plugin provider dapat meng-override
  prioritas, perilaku suffix, dan normalisasi id thread ketika platformnya
  memiliki semantik pengiriman thread native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan registrasi adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya ketika tata letak field payload
  agent/media legacy masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command
  Telegram, validasi duplikat/konflik, dan kontrak config command
  yang stabil terhadap fallback

Channel khusus auth biasanya dapat berhenti pada path default: core menangani persetujuan dan plugin hanya mengekspos kemampuan outbound/auth. Channel persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom sebaiknya menggunakan helper native bersama alih-alih membuat siklus hidup persetujuan sendiri.

## Kebijakan mention inbound

Pertahankan penanganan mention inbound tetap terpisah dalam dua lapisan:

- pengumpulan bukti milik plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya ketika Anda memerlukan barrel helper
inbound yang lebih luas.

Cocok untuk logika lokal plugin:

- deteksi reply-to-bot
- deteksi quoted-bot
- pemeriksaan partisipasi thread
- pengecualian pesan layanan/sistem
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil mention eksplisit
- allowlist mention implisit
- bypass command
- keputusan skip final

Alur yang disarankan:

1. Hitung fakta mention lokal.
2. Teruskan fakta tersebut ke `resolveInboundMentionDecision({ facts, policy })`.
3. Gunakan `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, dan `decision.shouldSkip` di gerbang inbound Anda.

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

`api.runtime.channel.mentions` mengekspos helper mention bersama yang sama untuk
plugin channel bawaan yang sudah bergantung pada runtime injection:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari memuat helper runtime
inbound yang tidak terkait.

Helper lama `resolveMentionGating*` tetap ada pada
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode baru
sebaiknya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Buat file plugin standar. Field `channel` di `package.json`
    adalah yang menjadikan ini Plugin channel. Untuk permukaan metadata package
    lengkap, lihat [Plugin Setup and Config](/id/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Hubungkan OpenClaw ke Acme Chat."
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
      "description": "Plugin channel Acme Chat",
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

  <Step title="Bangun objek Plugin channel">
    Interface `ChannelPlugin` memiliki banyak permukaan adapter opsional. Mulailah dari
    yang minimum — `id` dan `setup` — lalu tambahkan adapter sesuai kebutuhan.

    Buat `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // client API platform Anda

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
      if (!token) throw new Error("acme-chat: token wajib diisi");
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

      // Keamanan DM: siapa yang boleh mengirim pesan ke bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: alur persetujuan untuk kontak DM baru
      pairing: {
        text: {
          idLabel: "username Acme Chat",
          message: "Kirim kode ini untuk memverifikasi identitas Anda:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Kode pairing: ${code}`);
          },
        },
      },

      // Threading: cara balasan dikirim
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: kirim pesan ke platform
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

    <Accordion title="Apa yang dilakukan createChatChannelPlugin untuk Anda">
      Alih-alih mengimplementasikan interface adapter tingkat rendah secara manual, Anda
      memberikan opsi deklaratif dan builder akan menyusunnya:

      | Opsi | Yang dihubungkan |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM yang dibatasi dari field config |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, berscope akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi send yang mengembalikan metadata hasil (ID pesan) |

      Anda juga dapat memberikan objek adapter mentah alih-alih opsi deklaratif
      jika memerlukan kontrol penuh.
    </Accordion>

  </Step>

  <Step title="Hubungkan entry point">
    Buat `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin channel Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Manajemen Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Manajemen Acme Chat",
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

    Tempatkan descriptor CLI milik channel di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya di bantuan root tanpa mengaktifkan runtime channel penuh,
    sementara muatan penuh normal tetap mengambil descriptor yang sama untuk registrasi
    perintah nyata. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode Gateway RPC, gunakan
    prefiks khusus plugin. Namespace admin core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    diresolusikan ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode registrasi secara otomatis. Lihat
    [Entry Points](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Tambahkan entri setup">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini alih-alih entri penuh saat channel dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari penarikan kode runtime berat selama alur setup.
    Lihat [Setup and Config](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Channel workspace bawaan yang memisahkan ekspor aman-setup ke sidecar
    module dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` ketika juga memerlukan
    setter runtime eksplisit pada waktu setup.

  </Step>

  <Step title="Tangani pesan inbound">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola yang umum adalah webhook yang memverifikasi permintaan dan
    mendispatch-nya melalui handler inbound channel Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth dikelola plugin (verifikasi signature sendiri)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Handler inbound Anda mendispatch pesan ke OpenClaw.
          // Wiring persisnya bergantung pada SDK platform Anda —
          // lihat contoh nyata di package plugin Microsoft Teams atau Google Chat bawaan.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Penanganan pesan inbound bersifat khusus channel. Setiap Plugin channel memiliki
      pipeline inbound-nya sendiri. Lihat plugin channel bawaan
      (misalnya package plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis pengujian yang diletakkan berdampingan di `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("meresolusikan akun dari config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("memeriksa akun tanpa mewujudkan secret", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("melaporkan config yang hilang", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Untuk helper pengujian bersama, lihat [Testing](/id/plugins/sdk-testing).

  </Step>
</Steps>

## Struktur file

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadata openclaw.channel
├── openclaw.plugin.json      # Manifest dengan schema config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Ekspor publik (opsional)
├── runtime-api.ts            # Ekspor runtime internal (opsional)
└── src/
    ├── channel.ts            # ChannelPlugin melalui createChatChannelPlugin
    ├── channel.test.ts       # Pengujian
    ├── client.ts             # Client API platform
    └── runtime.ts            # Penyimpanan runtime (jika diperlukan)
```

## Topik lanjutan

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balasan tetap, berscope akun, atau kustom
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan action
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/id/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagent melalui api.runtime
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan dan
kompatibilitas plugin bawaan. Seam tersebut bukan pola yang direkomendasikan untuk Plugin channel baru;
lebih baik gunakan subpath channel/setup/reply/runtime generik dari permukaan SDK umum
kecuali Anda memang memelihara keluarga plugin bawaan tersebut secara langsung.
</Note>

## Langkah berikutnya

- [Provider Plugins](/id/plugins/sdk-provider-plugins) — jika plugin Anda juga menyediakan model
- [SDK Overview](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [SDK Testing](/id/plugins/sdk-testing) — utilitas pengujian dan pengujian kontrak
- [Plugin Manifest](/id/plugins/manifest) — schema manifest lengkap
