---
read_when:
    - Menyiapkan OpenClaw untuk pertama kali
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-22T04:22:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c627ccf9f17087e0b71663fe3086d637aeaa8cd1d6d34d816bfcbc0f0cc6f07c
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfigurasi

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 mendukung komentar dan trailing comma">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan konfigurasi:

- Menghubungkan channel dan mengontrol siapa yang dapat mengirim pesan ke bot
- Mengatur model, tools, sandboxing, atau automasi (Cron, hooks)
- Menyetel sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

<Tip>
**Baru menggunakan konfigurasi?** Mulai dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Configuration Examples](/id/gateway/configuration-examples) untuk konfigurasi lengkap yang bisa langsung disalin-tempel.
</Tip>

## Konfigurasi minimal

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Mengedit konfigurasi

<Tabs>
  <Tab title="Wizard interaktif">
    ```bash
    openclaw onboard       # alur onboarding lengkap
    openclaw configure     # wizard konfigurasi
    ```
  </Tab>
  <Tab title="CLI (satu baris)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    Control UI merender formulir dari skema konfigurasi live, termasuk metadata docs field
    `title` / `description` serta skema Plugin dan channel saat
    tersedia, dengan editor **Raw JSON** sebagai jalur darurat. Untuk UI
    drill-down dan tooling lainnya, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema yang dicakup path plus ringkasan child langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya sesuai dengan skema. Key yang tidak dikenal, tipe yang malformed, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk memulai**. Satu-satunya pengecualian tingkat root adalah `$schema` (string), sehingga editor dapat melampirkan metadata JSON Schema.
</Warning>

Catatan tooling skema:

- `openclaw config schema` mencetak keluarga JSON Schema yang sama yang digunakan oleh Control UI
  dan validasi konfigurasi.
- Perlakukan output skema tersebut sebagai kontrak machine-readable kanonis untuk
  `openclaw.json`; ikhtisar ini dan referensi konfigurasi merangkumnya.
- Nilai field `title` dan `description` dibawa ke output skema untuk
  tooling editor dan formulir.
- Entri objek bertingkat, wildcard (`*`), dan item array (`[]`) mewarisi metadata docs yang sama
  saat dokumentasi field yang cocok ada.
- Cabang komposisi `anyOf` / `oneOf` / `allOf` juga mewarisi metadata docs yang sama,
  sehingga varian union/intersection tetap mempertahankan bantuan field yang sama.
- `config.schema.lookup` mengembalikan satu path konfigurasi yang dinormalisasi dengan
  node skema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum,
  dan field validasi serupa), metadata hint UI yang cocok, serta ringkasan child langsung
  untuk tooling drill-down.
- Skema Plugin/channel runtime digabungkan saat gateway dapat memuat
  registry manifest saat ini.
- `pnpm config:docs:check` mendeteksi drift antara artefak baseline konfigurasi
  yang menghadap docs dan permukaan skema saat ini.

Saat validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah secara tepat
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway juga menyimpan salinan trusted last-known-good setelah startup berhasil. Jika
`openclaw.json` kemudian diubah di luar OpenClaw dan tidak lagi lolos validasi, startup
dan hot reload akan mempertahankan file rusak sebagai snapshot `.clobbered.*` bertimestamp,
memulihkan salinan last-known-good, dan mencatat peringatan keras dengan alasan pemulihan.
Giliran agen utama berikutnya juga menerima peringatan system-event yang memberi tahu bahwa
konfigurasi dipulihkan dan tidak boleh ditulis ulang secara membabi buta. Promosi last-known-good
diperbarui setelah startup tervalidasi dan setelah hot reload yang diterima, termasuk
penulisan konfigurasi milik OpenClaw yang hash file tersimpannya masih cocok dengan
penulisan yang diterima. Promosi dilewati saat kandidat berisi placeholder secret
yang telah disunting seperti `***` atau nilai token yang dipendekkan.

## Tugas umum

<AccordionGroup>
  <Accordion title="Siapkan channel (WhatsApp, Telegram, Discord, dll.)">
    Setiap channel memiliki bagian konfigurasinya sendiri di bawah `channels.<provider>`. Lihat halaman channel khusus untuk langkah penyiapan:

    - [WhatsApp](/id/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/id/channels/telegram) — `channels.telegram`
    - [Discord](/id/channels/discord) — `channels.discord`
    - [Feishu](/id/channels/feishu) — `channels.feishu`
    - [Google Chat](/id/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/id/channels/msteams) — `channels.msteams`
    - [Slack](/id/channels/slack) — `channels.slack`
    - [Signal](/id/channels/signal) — `channels.signal`
    - [iMessage](/id/channels/imessage) — `channels.imessage`
    - [Mattermost](/id/channels/mattermost) — `channels.mattermost`

    Semua channel berbagi pola kebijakan DM yang sama:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // hanya untuk allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Pilih dan konfigurasikan model">
    Atur model utama dan fallback opsional:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` mendefinisikan katalog model dan bertindak sebagai allowlist untuk `/model`.
    - Ref model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transkrip/tool (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan vision-token pada run yang banyak screenshot.
    - Lihat [Models CLI](/id/concepts/models) untuk mengganti model di chat dan [Model Failover](/id/concepts/model-failover) untuk rotasi auth dan perilaku fallback.
    - Untuk provider kustom/self-hosted, lihat [Custom providers](/id/gateway/configuration-reference#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Kontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim yang tidak dikenal mendapat kode pairing sekali pakai untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau paired allow store)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/id/gateway/configuration-reference#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Siapkan gating mention chat grup">
    Pesan grup secara default **memerlukan mention**. Konfigurasikan pola per agen:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Metadata mention**: @-mention native (WhatsApp tap-to-mention, Telegram @bot, dll.)
    - **Pola teks**: pola regex aman di `mentionPatterns`
    - Lihat [referensi lengkap](/id/gateway/configuration-reference#group-chat-mention-gating) untuk override per channel dan mode self-chat.

  </Accordion>

  <Accordion title="Batasi Skills per agen">
    Gunakan `agents.defaults.skills` untuk baseline bersama, lalu override agen tertentu
    dengan `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // mewarisi github, weather
          { id: "docs", skills: ["docs-search"] }, // mengganti default
          { id: "locked-down", skills: [] }, // tanpa skills
        ],
      },
    }
    ```

    - Hilangkan `agents.defaults.skills` untuk Skills tak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Atur `agents.list[].skills: []` untuk tanpa Skills.
    - Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Setel pemantauan kesehatan channel gateway">
    Kontrol seberapa agresif gateway me-restart channel yang terlihat stale:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Atur `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan restart health-monitor secara global.
    - `channelStaleEventThresholdMinutes` harus lebih besar dari atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan auto-restart untuk satu channel atau akun tanpa menonaktifkan monitor global.
    - Lihat [Health Checks](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua field.

  </Accordion>

  <Accordion title="Konfigurasikan sesi dan reset">
    Sesi mengontrol kontinuitas dan isolasi percakapan:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // direkomendasikan untuk multi-pengguna
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (bersama) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: default global untuk routing sesi yang terikat thread (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Session Management](/id/concepts/session) untuk scoping, tautan identitas, dan kebijakan pengiriman.
    - Lihat [referensi lengkap](/id/gateway/configuration-reference#session) untuk semua field.

  </Accordion>

  <Accordion title="Aktifkan sandboxing">
    Jalankan sesi agen dalam runtime sandbox terisolasi:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Bangun image terlebih dahulu: `scripts/sandbox-setup.sh`

    Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/configuration-reference#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Aktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay dikonfigurasi di `openclaw.json`.

    Atur ini di konfigurasi gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opsional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Padanan CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Yang dilakukan ini:

    - Memungkinkan gateway mengirim `push.test`, wake nudges, dan reconnect wakes melalui relay eksternal.
    - Menggunakan send grant yang dicakup registrasi yang diteruskan oleh aplikasi iOS yang dipairing. Gateway tidak memerlukan token relay tingkat deployment.
    - Mengikat setiap registrasi berbasis relay ke identitas gateway yang dipairing oleh aplikasi iOS, sehingga gateway lain tidak dapat menggunakan ulang registrasi yang tersimpan.
    - Mempertahankan build iOS lokal/manual pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build resmi yang didistribusikan dan mendaftar melalui relay.
    - Harus cocok dengan URL dasar relay yang ditanamkan ke dalam build iOS resmi/TestFlight, sehingga trafik registrasi dan pengiriman mencapai deployment relay yang sama.

    Alur end-to-end:

    1. Instal build iOS resmi/TestFlight yang dikompilasi dengan URL dasar relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pair aplikasi iOS ke gateway dan biarkan sesi node dan operator sama-sama terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus receipt aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipairing.
    5. Gateway menyimpan relay handle dan send grant, lalu menggunakannya untuk `push.test`, wake nudges, dan reconnect wakes.

    Catatan operasional:

    - Jika Anda mengganti aplikasi iOS ke gateway lain, sambungkan ulang aplikasi agar dapat memublikasikan registrasi relay baru yang terikat ke gateway tersebut.
    - Jika Anda mengirim build iOS baru yang menunjuk ke deployment relay berbeda, aplikasi akan merefresh registrasi relay cache-nya alih-alih menggunakan ulang origin relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap merupakan jalur darurat pengembangan khusus loopback; jangan menyimpan URL relay HTTP dalam konfigurasi.

    Lihat [iOS App](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur end-to-end dan [Authentication and trust flow](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

  </Accordion>

  <Accordion title="Siapkan Heartbeat (check-in berkala)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: string durasi (`30m`, `2h`). Atur `0m` untuk menonaktifkan.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target Heartbeat bergaya DM
    - Lihat [Heartbeat](/id/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Konfigurasikan pekerjaan Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: pangkas sesi run terisolasi yang selesai dari `sessions.json` (default `24h`; atur `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan jumlah baris yang dipertahankan.
    - Lihat [Cron jobs](/id/automation/cron-jobs) untuk ikhtisar fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Siapkan Webhook (hooks)">
    Aktifkan endpoint Webhook HTTP pada Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Catatan keamanan:
    - Perlakukan semua konten payload hook/Webhook sebagai input yang tidak tepercaya.
    - Gunakan `hooks.token` khusus; jangan gunakan ulang token Gateway bersama.
    - Auth hook hanya berbasis header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query-string ditolak.
    - `hooks.path` tidak boleh berupa `/`; pertahankan ingress Webhook pada subpath khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali saat melakukan debugging yang sangat terbatas.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, atur juga `hooks.allowedSessionKeyPrefixes` untuk membatasi session key yang dipilih pemanggil.
    - Untuk agen yang dipicu hook, pilih tier model modern yang kuat dan kebijakan tool yang ketat (misalnya hanya-pesan ditambah sandboxing jika memungkinkan).

    Lihat [referensi lengkap](/id/gateway/configuration-reference#hooks) untuk semua opsi mapping dan integrasi Gmail.

  </Accordion>

  <Accordion title="Konfigurasikan routing multi-agen">
    Jalankan beberapa agen terisolasi dengan workspace dan sesi terpisah:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Lihat [Multi-Agent](/id/concepts/multi-agent) dan [referensi lengkap](/id/gateway/configuration-reference#multi-agent-routing) untuk aturan binding dan profil akses per agen.

  </Accordion>

  <Accordion title="Pisahkan konfigurasi ke beberapa file ($include)">
    Gunakan `$include` untuk mengatur konfigurasi besar:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **File tunggal**: menggantikan objek yang memuatnya
    - **Array file**: di-deep-merge secara berurutan (yang terakhir menang)
    - **Sibling key**: digabung setelah include (menimpa nilai yang di-include)
    - **Include bertingkat**: didukung hingga kedalaman 10 tingkat
    - **Path relatif**: di-resolve relatif terhadap file yang melakukan include
    - **Penanganan error**: error yang jelas untuk file hilang, parse error, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload konfigurasi

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — tidak perlu restart manual untuk sebagian besar pengaturan.

Edit file langsung diperlakukan sebagai tidak tepercaya sampai lolos validasi. Watcher menunggu
churn temp-write/rename editor mereda, membaca file final, dan menolak
edit eksternal yang tidak valid dengan memulihkan konfigurasi last-known-good. Penulisan konfigurasi
milik OpenClaw menggunakan gate skema yang sama sebelum menulis; clobber destruktif seperti
menghapus `gateway.mode` atau mengecilkan file lebih dari setengah akan ditolak
dan disimpan sebagai `.rejected.*` untuk inspeksi.

Jika Anda melihat `Config auto-restored from last-known-good` atau
`config reload restored last-known-good config` di log, periksa file
`.clobbered.*` yang sesuai di samping `openclaw.json`, perbaiki payload yang ditolak, lalu jalankan
`openclaw config validate`. Lihat [Gateway troubleshooting](/id/gateway/troubleshooting#gateway-restored-last-known-good-config)
untuk checklist pemulihan.

### Mode reload

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan hot perubahan aman secara instan. Otomatis restart untuk perubahan kritis.  |
| **`hot`**              | Hanya menerapkan hot perubahan aman. Mencatat peringatan saat restart diperlukan — Anda yang menanganinya. |
| **`restart`**          | Me-restart Gateway pada setiap perubahan konfigurasi, aman atau tidak.                  |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Apa yang diterapkan hot vs apa yang memerlukan restart

Sebagian besar field diterapkan hot tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Category            | Fields                                                            | Restart needed? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`, `web` (WhatsApp) — semua channel bawaan dan Plugin | No              |
| Agent & models      | `agent`, `agents`, `models`, `routing`                            | No              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                | No              |
| Sessions & messages | `session`, `messages`                                             | No              |
| Tools & media       | `tools`, `browser`, `skills`, `audio`, `talk`                     | No              |
| UI & misc           | `ui`, `logging`, `identity`, `bindings`                           | No              |
| Gateway server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Yes**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **Yes**         |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubahnya **tidak** memicu restart.
</Note>

## RPC konfigurasi (pembaruan terprogram)

<Note>
RPC penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi hingga **3 permintaan per 60 detik** per `deviceId+clientIp`. Saat dibatasi, RPC mengembalikan `UNAVAILABLE` dengan `retryAfterMs`.
</Note>

Alur aman/default:

- `config.schema.lookup`: periksa satu subtree konfigurasi yang dicakup path dengan node skema dangkal, metadata hint yang cocok, dan ringkasan child langsung
- `config.get`: ambil snapshot + hash saat ini
- `config.patch`: jalur pembaruan parsial yang disarankan
- `config.apply`: hanya untuk penggantian konfigurasi penuh
- `update.run`: self-update + restart eksplisit

Saat Anda tidak mengganti seluruh konfigurasi, pilih `config.schema.lookup`
lalu `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (penggantian penuh)">
    Memvalidasi + menulis konfigurasi penuh dan me-restart Gateway dalam satu langkah.

    <Warning>
    `config.apply` menggantikan **seluruh konfigurasi**. Gunakan `config.patch` untuk pembaruan parsial, atau `openclaw config set` untuk satu key.
    </Warning>

    Parameter:

    - `raw` (string) — payload JSON5 untuk seluruh konfigurasi
    - `baseHash` (opsional) — hash konfigurasi dari `config.get` (wajib saat konfigurasi ada)
    - `sessionKey` (opsional) — session key untuk ping wake-up setelah restart
    - `note` (opsional) — catatan untuk sentinel restart
    - `restartDelayMs` (opsional) — jeda sebelum restart (default 2000)

    Permintaan restart dikoaleskan saat satu permintaan sudah tertunda/sedang berlangsung, dan cooldown 30 detik berlaku di antara siklus restart.

    ```bash
    openclaw gateway call config.get --params '{}'  # ambil payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (pembaruan parsial)">
    Menggabungkan pembaruan parsial ke konfigurasi yang ada (semantik JSON merge patch):

    - Objek digabung secara rekursif
    - `null` menghapus key
    - Array menggantikan

    Parameter:

    - `raw` (string) — JSON5 dengan hanya key yang akan diubah
    - `baseHash` (wajib) — hash konfigurasi dari `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — sama seperti `config.apply`

    Perilaku restart sama dengan `config.apply`: restart tertunda dikoaleskan ditambah cooldown 30 detik di antara siklus restart.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variabel lingkungan

OpenClaw membaca variabel lingkungan dari proses induk ditambah:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua file tidak menimpa variabel lingkungan yang sudah ada. Anda juga dapat mengatur variabel lingkungan inline di konfigurasi:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor env shell (opsional)">
  Jika diaktifkan dan key yang diharapkan belum diatur, OpenClaw menjalankan login shell Anda dan mengimpor hanya key yang hilang:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Padanan variabel lingkungan: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitusi variabel lingkungan dalam nilai konfigurasi">
  Referensikan variabel lingkungan dalam nilai string konfigurasi apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang dicocokkan: `[A-Z_][A-Z0-9_]*`
- Variabel yang hilang/kosong memunculkan error saat waktu muat
- Escape dengan `$${VAR}` untuk output literal
- Bekerja di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Ref secret (env, file, exec)">
  Untuk field yang mendukung objek SecretRef, Anda dapat menggunakan:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Detail SecretRef (termasuk `secrets.providers` untuk `env`/`file`/`exec`) ada di [Secrets Management](/id/gateway/secrets).
Path kredensial yang didukung tercantum di [SecretRef Credential Surface](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Environment](/id/help/environment) untuk prioritas dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap field demi field, lihat **[Configuration Reference](/id/gateway/configuration-reference)**.

---

_Terkait: [Configuration Examples](/id/gateway/configuration-examples) · [Configuration Reference](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_
