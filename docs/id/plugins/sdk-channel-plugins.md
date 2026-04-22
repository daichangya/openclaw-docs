---
read_when:
    - Anda sedang membangun plugin channel perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami permukaan adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun plugin channel perpesanan untuk OpenClaw
title: Membangun Plugin Channel
x-i18n:
    generated_at: "2026-04-22T09:15:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Membangun Plugin Channel

Panduan ini menjelaskan proses membangun plugin channel yang menghubungkan OpenClaw ke
platform perpesanan. Pada akhirnya Anda akan memiliki channel yang berfungsi dengan keamanan DM,
pairing, threading balasan, dan perpesanan keluar.

<Info>
  Jika Anda belum pernah membangun plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket dasar
  dan penyiapan manifes.
</Info>

## Cara kerja plugin channel

Plugin channel tidak memerlukan tool send/edit/react sendiri. OpenClaw menyimpan satu
tool `message` bersama di core. Plugin Anda memiliki:

- **Config** — resolusi akun dan wizard penyiapan
- **Security** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Session grammar** — bagaimana id percakapan khusus provider dipetakan ke chat dasar, id thread, dan fallback parent
- **Outbound** — mengirim teks, media, dan polling ke platform
- **Threading** — bagaimana balasan di-thread
- **Heartbeat typing** — sinyal typing/sibuk opsional untuk target pengiriman heartbeat

Core memiliki tool message bersama, wiring prompt, bentuk session-key luar,
pembukuan generik `:thread:`, dan dispatch.

Jika channel Anda mendukung indikator typing di luar balasan masuk,
ekspos `heartbeat.sendTyping(...)` pada plugin channel. Core memanggilnya dengan
target pengiriman heartbeat yang sudah di-resolve sebelum model heartbeat mulai berjalan dan
menggunakan siklus hidup keepalive/cleanup typing bersama. Tambahkan `heartbeat.clearTyping(...)`
ketika platform memerlukan sinyal berhenti yang eksplisit.

Jika channel Anda menambahkan param message-tool yang membawa sumber media, ekspos nama
param tersebut melalui `describeMessageTool(...).mediaSourceParams`. Core menggunakan
daftar eksplisit itu untuk normalisasi path sandbox dan kebijakan akses media keluar,
sehingga plugin tidak memerlukan kasus khusus shared-core untuk param avatar,
lampiran, atau cover-image khusus provider.
Sebaiknya kembalikan map yang dikunci tindakan seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` agar tindakan yang tidak terkait tidak
mewarisi argumen media milik tindakan lain. Array datar tetap berfungsi untuk param yang
memang sengaja dibagikan di setiap tindakan yang diekspos.

Jika platform Anda menyimpan cakupan tambahan di dalam id percakapan, simpan parsing itu
di plugin dengan `messaging.resolveSessionConversation(...)`. Itulah hook kanonis
untuk memetakan `rawId` ke id percakapan dasar, id thread opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Saat Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari
parent paling sempit ke percakapan paling luas/dasar.

Bundled plugin yang memerlukan parsing yang sama sebelum registry channel aktif
juga dapat mengekspos file `session-key-api.ts` tingkat atas dengan ekspor
`resolveSessionConversation(...)` yang sesuai. Core menggunakan permukaan yang aman
untuk bootstrap itu hanya saat registry plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai fallback
kompatibilitas lama ketika plugin hanya memerlukan fallback parent di atas
id generik/raw. Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
kembali ke `resolveParentConversationCandidates(...)` ketika hook kanonis
tidak menyediakannya.

## Persetujuan dan kapabilitas channel

Sebagian besar plugin channel tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Pilih satu objek `approvalCapability` pada plugin channel ketika channel memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` telah dihapus. Letakkan fakta pengiriman/native/render/auth persetujuan di `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; core tidak lagi membaca hook auth persetujuan dari objek itu.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan yang kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan chat yang sama.
- Jika channel Anda mengekspos persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status initiating-surface/native-client ketika berbeda dari auth persetujuan chat yang sama. Core menggunakan hook khusus exec itu untuk membedakan `enabled` vs `disabled`, memutuskan apakah channel pemicu mendukung persetujuan exec native, dan menyertakan channel tersebut dalam panduan fallback native-client. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator typing sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk routing persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native yang dimiliki channel. Pertahankan agar tetap lazy pada entrypoint channel yang panas dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai kebutuhan sambil tetap membiarkan core merakit siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya ketika channel benar-benar memerlukan payload persetujuan kustom, bukan renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika channel ingin balasan pada jalur nonaktif menjelaskan knob konfigurasi yang tepat untuk mengaktifkan persetujuan exec native. Hook menerima `{ channel, channelLabel, accountId }`; channel akun bernama harus merender path bercakupan akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika sebuah channel dapat menyimpulkan identitas DM mirip pemilik yang stabil dari config yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` chat yang sama tanpa menambahkan logika core khusus persetujuan.
- Jika channel memerlukan pengiriman persetujuan native, jaga agar kode channel tetap berfokus pada normalisasi target ditambah fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus channel di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sehingga core dapat merakit handler dan memiliki penyaringan permintaan, routing, dedupe, expiry, subscription gateway, dan pemberitahuan dialihkan-ke-tempat-lain. `nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:
- `availability` — apakah akun sudah dikonfigurasi dan apakah sebuah permintaan harus ditangani
- `presentation` — memetakan view model persetujuan bersama ke payload native pending/resolved/expired atau tindakan final
- `transport` — menyiapkan target serta mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` — hook bind/unbind/clear-action opsional untuk tombol atau reaksi native
- `observe` — hook diagnostik pengiriman opsional
- Jika channel memerlukan objek yang dimiliki runtime seperti client, token, aplikasi Bolt, atau penerima Webhook, daftarkan objek tersebut melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context generik memungkinkan core melakukan bootstrap handler berbasis kapabilitas dari status startup channel tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` level lebih rendah hanya ketika seam berbasis kapabilitas belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga agar kebijakan persetujuan multi-akun tetap bercakupan pada akun bot yang tepat, dan `approvalKind` menjaga agar perilaku persetujuan exec vs plugin tetap tersedia bagi channel tanpa cabang hardcoded di core.
- Core sekarang juga memiliki pemberitahuan reroute persetujuan. Plugin channel tidak boleh mengirim pesan tindak lanjut sendiri seperti "persetujuan masuk ke DM / channel lain" dari `createChannelNativeApprovalRuntime`; sebaliknya, ekspos routing origin + approver-DM yang akurat melalui helper kapabilitas persetujuan bersama dan biarkan core mengagregasi pengiriman aktual sebelum memposting pemberitahuan kembali ke chat pemicu.
- Pertahankan jenis id persetujuan yang sudah dikirim secara end-to-end. Client native tidak boleh
  menebak atau menulis ulang routing persetujuan exec vs plugin dari status lokal channel.
- Jenis persetujuan yang berbeda dapat dengan sengaja mengekspos permukaan native yang berbeda.
  Contoh bundled saat ini:
  - Slack tetap menyediakan routing persetujuan native untuk id exec dan plugin.
  - Matrix mempertahankan routing DM/channel native dan UX reaksi yang sama untuk persetujuan exec
    dan plugin, sambil tetap membiarkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya memilih builder kapabilitas dan mengekspos `approvalCapability` pada plugin.

Untuk entrypoint channel yang panas, pilih subpath runtime yang lebih sempit saat Anda hanya
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

Demikian juga, pilih `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` ketika Anda tidak memerlukan permukaan payung
yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adapter patch setup yang aman untuk impor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy yang didelegasikan
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah
  seam adapter sempit yang sadar env untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup opsional-install
  plus beberapa primitif yang aman untuk setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika channel Anda mendukung setup atau auth berbasis env dan alur startup/config generik
perlu mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan nama itu di
manifes plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime channel atau
konstanta lokal hanya untuk salinan yang ditujukan kepada operator.

Jika channel Anda dapat muncul di `status`, `channels list`, `channels status`, atau pemindaian
SecretRef sebelum runtime plugin dimulai, tambahkan `openclaw.setupEntry` di
`package.json`. Entrypoint itu harus aman untuk diimpor pada jalur perintah baca-saja
dan harus mengembalikan metadata channel, adapter config yang aman untuk setup, adapter status,
dan metadata target secret channel yang diperlukan untuk ringkasan tersebut. Jangan
memulai client, listener, atau runtime transport dari entri setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya ketika Anda juga memerlukan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "instal plugin ini terlebih dahulu" pada
permukaan setup, pilih `createOptionalChannelSetupSurface(...)`. Adapter/wizard yang dihasilkan
gagal-tertutup pada penulisan config dan finalisasi, dan menggunakan kembali pesan install-required
yang sama di seluruh salinan validasi, finalize, dan tautan docs.

Untuk jalur channel panas lainnya, pilih helper yang sempit daripada permukaan lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk config multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk route/envelope masuk dan
  wiring record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media plus
  delegasi identitas/pengiriman keluar dan perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` saat route keluar harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:` saat ini
  setelah kunci sesi dasar masih cocok. Plugin provider dapat mengganti
  precedence, perilaku suffix, dan normalisasi id thread ketika platformnya
  memiliki semantik pengiriman thread native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya ketika tata letak field payload
  agent/media lama masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command Telegram,
  validasi duplikat/konflik, dan kontrak config perintah yang stabil untuk fallback

Channel yang hanya auth biasanya dapat berhenti di jalur default: core menangani persetujuan dan plugin hanya mengekspos kapabilitas outbound/auth. Channel persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom sebaiknya menggunakan helper native bersama alih-alih membuat siklus hidup persetujuannya sendiri.

## Kebijakan mention masuk

Pertahankan penanganan mention masuk tetap terbagi dalam dua lapisan:

- pengumpulan bukti yang dimiliki plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya saat Anda memerlukan barrel helper
masuk yang lebih luas.

Cocok untuk logika lokal plugin:

- deteksi reply-to-bot
- deteksi quoted-bot
- pemeriksaan partisipasi thread
- pengecualian service/system-message
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil mention eksplisit
- allowlist mention implisit
- bypass perintah
- keputusan skip final

Alur yang disarankan:

1. Hitung fakta mention lokal.
2. Teruskan fakta tersebut ke `resolveInboundMentionDecision({ facts, policy })`.
3. Gunakan `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, dan `decision.shouldSkip` di gerbang masuk Anda.

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
plugin channel bundled yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari memuat helper runtime
masuk lain yang tidak terkait.

Helper lama `resolveMentionGating*` tetap ada di
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode baru
sebaiknya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifes">
    Buat file plugin standar. Field `channel` di `package.json` adalah
    yang menjadikan ini plugin channel. Untuk permukaan metadata paket lengkap,
    lihat [Setup dan Config Plugin](/id/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Bangun objek plugin channel">
    Interface `ChannelPlugin` memiliki banyak permukaan adapter opsional. Mulailah dengan
    yang minimal — `id` dan `setup` — lalu tambahkan adapter sesuai kebutuhan.

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
      if (!token) throw new Error("acme-chat: token wajib ada");
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

      // Keamanan DM: siapa yang dapat mengirim pesan ke bot
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

      // Threading: bagaimana balasan dikirim
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

    <Accordion title="Yang dilakukan createChatChannelPlugin untuk Anda">
      Alih-alih mengimplementasikan interface adapter level rendah secara manual, Anda
      memberikan opsi deklaratif dan builder akan menyusunnya:

      | Opsi | Yang di-wire |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM bercakupan dari field config |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, bercakupan akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi kirim yang mengembalikan metadata hasil (ID pesan) |

      Anda juga dapat memberikan objek adapter mentah alih-alih opsi deklaratif
      jika memerlukan kontrol penuh.
    </Accordion>

  </Step>

  <Step title="Wire entry point">
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

    Letakkan descriptor CLI yang dimiliki channel di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya dalam bantuan root tanpa mengaktifkan runtime channel penuh,
    sementara pemuatan penuh normal tetap mengambil descriptor yang sama untuk pendaftaran
    perintah yang sesungguhnya. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan prefix
    khusus plugin. Namespace admin core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    di-resolve ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran ini secara otomatis. Lihat
    [Entry Point](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
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
    Lihat [Setup dan Config](/id/plugins/sdk-setup#setup-entry) untuk detailnya.

    Channel workspace bundled yang memisahkan ekspor aman-setup ke dalam modul sidecar
    dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` ketika mereka juga memerlukan
    setter runtime eksplisit pada waktu setup.

  </Step>

  <Step title="Tangani pesan masuk">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola yang umum adalah Webhook yang memverifikasi permintaan dan
    melakukan dispatch melalui handler masuk channel Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth yang dikelola plugin (verifikasi signature sendiri)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Handler masuk Anda melakukan dispatch pesan ke OpenClaw.
          // Wiring pastinya bergantung pada SDK platform Anda —
          // lihat contoh nyata di paket plugin Microsoft Teams atau Google Chat bawaan.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Penanganan pesan masuk bersifat khusus channel. Setiap plugin channel memiliki
      pipeline masuknya sendiri. Lihat plugin channel bundled
      (misalnya paket plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis pengujian yang diletakkan berdampingan di `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("me-resolve akun dari config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("memeriksa akun tanpa mematerialisasi secret", () => {
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
├── openclaw.plugin.json      # Manifes dengan skema config
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
  <Card title="Opsi threading" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balasan tetap, bercakupan akun, atau kustom
  </Card>
  <Card title="Integrasi tool message" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan tindakan
  </Card>
  <Card title="Resolusi target" icon="crosshair" href="/id/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagent melalui api.runtime
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bundled masih ada untuk pemeliharaan bundled-plugin dan
kompatibilitas. Seam tersebut bukan pola yang direkomendasikan untuk plugin channel baru;
pilih subpath channel/setup/reply/runtime generik dari permukaan SDK umum
kecuali Anda sedang memelihara keluarga bundled plugin tersebut secara langsung.
</Note>

## Langkah berikutnya

- [Plugin Provider](/id/plugins/sdk-provider-plugins) — jika plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [SDK Testing](/id/plugins/sdk-testing) — utilitas pengujian dan contract test
- [Manifes Plugin](/id/plugins/manifest) — skema manifes lengkap
