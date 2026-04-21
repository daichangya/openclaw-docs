---
read_when:
    - Menyiapkan OpenClaw untuk pertama kali
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian config tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-21T09:17:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 479e59fb8b57c5228ef1c6076cf80a4ce6064d3f6fad5f38ea9d75eeb92811dc
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfigurasi

OpenClaw membaca config <Tooltip tip="JSON5 mendukung komentar dan trailing comma">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan config:

- Hubungkan channel dan kontrol siapa yang dapat mengirim pesan ke bot
- Atur model, tools, sandboxing, atau automasi (Cron, hooks)
- Sesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

<Tip>
**Baru mengenal konfigurasi?** Mulailah dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/id/gateway/configuration-examples) untuk config lengkap yang siap salin-tempel.
</Tip>

## Config minimal

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Mengedit config

<Tabs>
  <Tab title="Wizard interaktif">
    ```bash
    openclaw onboard       # alur onboarding lengkap
    openclaw configure     # wizard config
    ```
  </Tab>
  <Tab title="CLI (one-liner)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) lalu gunakan tab **Config**.
    Control UI merender formulir dari skema config live, termasuk metadata docs
    `title` / `description` plus skema Plugin dan channel bila
    tersedia, dengan editor **Raw JSON** sebagai jalur keluar. Untuk UI
    drill-down dan tooling lainnya, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema berbatas path plus ringkasan child langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Kunci yang tidak dikenal, tipe yang salah format, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk memulai**. Satu-satunya pengecualian level root adalah `$schema` (string), sehingga editor dapat melampirkan metadata JSON Schema.
</Warning>

Catatan tooling skema:

- `openclaw config schema` mencetak keluarga JSON Schema yang sama yang digunakan oleh Control UI
  dan validasi config.
- Perlakukan output skema tersebut sebagai kontrak machine-readable kanonis untuk
  `openclaw.json`; ikhtisar ini dan referensi konfigurasi merangkumnya.
- Nilai field `title` dan `description` dibawa ke output skema untuk
  editor dan tooling formulir.
- Entri objek bertingkat, wildcard (`*`), dan array-item (`[]`) mewarisi metadata
  docs yang sama jika dokumentasi field yang cocok ada.
- Cabang komposisi `anyOf` / `oneOf` / `allOf` juga mewarisi metadata docs
  yang sama, sehingga varian union/intersection tetap memiliki bantuan field yang sama.
- `config.schema.lookup` mengembalikan satu path config yang dinormalisasi dengan
  node skema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum,
  dan field validasi serupa), metadata petunjuk UI yang cocok, dan ringkasan child
  langsung untuk tooling drill-down.
- Skema Plugin/channel runtime digabungkan saat gateway dapat memuat
  registri manifest saat ini.
- `pnpm config:docs:check` mendeteksi drift antara artefak baseline config
  yang menghadap docs dan permukaan skema saat ini.

Saat validasi gagal:

- Gateway tidak melakukan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah yang tepat
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway juga menyimpan salinan last-known-good tepercaya setelah startup berhasil. Jika
`openclaw.json` kemudian diubah di luar OpenClaw dan tidak lagi lolos validasi, startup
dan hot reload akan mempertahankan file yang rusak sebagai snapshot `.clobbered.*` bertimestamp,
memulihkan salinan last-known-good, dan mencatat peringatan keras dengan alasan pemulihan.
Giliran main-agent berikutnya juga menerima peringatan system-event yang memberitahunya bahwa
config telah dipulihkan dan tidak boleh ditulis ulang secara membabi buta. Promosi last-known-good
diperbarui setelah startup tervalidasi dan setelah hot reload yang diterima, termasuk
penulisan config milik OpenClaw yang hash file tersimpannya masih cocok dengan
penulisan yang diterima. Promosi dilewati ketika kandidat berisi placeholder
secret yang disensor seperti `***` atau nilai token yang dipendekkan.

## Tugas umum

<AccordionGroup>
  <Accordion title="Menyiapkan channel (WhatsApp, Telegram, Discord, dll.)">
    Setiap channel memiliki bagian config sendiri di bawah `channels.<provider>`. Lihat halaman channel khusus untuk langkah penyiapan:

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

  <Accordion title="Memilih dan mengonfigurasi model">
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
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transcript/tool (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan vision-token pada run yang banyak screenshot.
    - Lihat [Models CLI](/id/concepts/models) untuk mengganti model di chat dan [Model Failover](/id/concepts/model-failover) untuk perilaku rotasi auth dan fallback.
    - Untuk provider kustom/self-hosted, lihat [Custom providers](/id/gateway/configuration-reference#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Mengontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikendalikan per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim yang tidak dikenal mendapat kode pairing satu kali untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau paired allow store)
    - `"open"`: izinkan semua DM inbound (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/id/gateway/configuration-reference#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Menyiapkan mention gating chat grup">
    Pesan grup default-nya **memerlukan mention**. Konfigurasikan pola per agent:

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

  <Accordion title="Membatasi Skills per agent">
    Gunakan `agents.defaults.skills` untuk baseline bersama, lalu override agent
    tertentu dengan `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // mewarisi github, weather
          { id: "docs", skills: ["docs-search"] }, // menggantikan default
          { id: "locked-down", skills: [] }, // tanpa skills
        ],
      },
    }
    ```

    - Hilangkan `agents.defaults.skills` agar default-nya Skills tidak dibatasi.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Setel `agents.list[].skills: []` untuk tanpa Skills.
    - Lihat [Skills](/id/tools/skills), [config Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Menyesuaikan pemantauan kesehatan channel gateway">
    Kontrol seberapa agresif gateway me-restart channel yang tampak stale:

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

    - Setel `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan restart health-monitor secara global.
    - `channelStaleEventThresholdMinutes` harus lebih besar dari atau sama dengan interval pemeriksaan.
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan auto-restart untuk satu channel atau akun tanpa menonaktifkan monitor global.
    - Lihat [Health Checks](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua field.

  </Accordion>

  <Accordion title="Mengonfigurasi sesi dan reset">
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
    - `threadBindings`: default global untuk routing sesi terikat-thread (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Session Management](/id/concepts/session) untuk scoping, tautan identitas, dan kebijakan pengiriman.
    - Lihat [referensi lengkap](/id/gateway/configuration-reference#session) untuk semua field.

  </Accordion>

  <Accordion title="Mengaktifkan sandboxing">
    Jalankan sesi agent dalam runtime sandbox terisolasi:

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

  <Accordion title="Mengaktifkan push berbasis relay untuk build iOS resmi">
    Push berbasis relay dikonfigurasi di `openclaw.json`.

    Setel ini di config gateway:

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

    Apa yang dilakukan ini:

    - Memungkinkan gateway mengirim `push.test`, wake nudge, dan reconnect wake melalui relay eksternal.
    - Menggunakan izin kirim scoped-registration yang diteruskan oleh aplikasi iOS yang dipairkan. Gateway tidak memerlukan token relay deployment-wide.
    - Mengikat setiap registration berbasis relay ke identitas gateway yang dipairkan oleh aplikasi iOS, sehingga gateway lain tidak dapat menggunakan kembali registration yang tersimpan.
    - Mempertahankan build iOS lokal/manual pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build resmi yang didistribusikan yang terdaftar melalui relay.
    - Harus cocok dengan base URL relay yang dibenamkan ke build iOS resmi/TestFlight, sehingga trafik registrasi dan pengiriman mencapai deployment relay yang sama.

    Alur end-to-end:

    1. Instal build iOS resmi/TestFlight yang dikompilasi dengan base URL relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pair aplikasi iOS ke gateway dan biarkan sesi node serta operator terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus receipt aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipairkan.
    5. Gateway menyimpan handle relay dan izin kirim, lalu menggunakannya untuk `push.test`, wake nudge, dan reconnect wake.

    Catatan operasional:

    - Jika Anda memindahkan aplikasi iOS ke gateway lain, sambungkan ulang aplikasi agar dapat memublikasikan registration relay baru yang terikat ke gateway tersebut.
    - Jika Anda mengirim build iOS baru yang menunjuk ke deployment relay berbeda, aplikasi akan me-refresh registration relay yang di-cache alih-alih menggunakan kembali origin relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` tetap berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap menjadi escape hatch pengembangan khusus loopback; jangan simpan URL relay HTTP di config.

    Lihat [Aplikasi iOS](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur end-to-end dan [Alur autentikasi dan trust](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

  </Accordion>

  <Accordion title="Menyiapkan Heartbeat (check-in berkala)">
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

    - `every`: string durasi (`30m`, `2h`). Setel `0m` untuk menonaktifkan.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target Heartbeat gaya DM
    - Lihat [Heartbeat](/id/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Mengonfigurasi job Cron">
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

    - `sessionRetention`: pangkas sesi run terisolasi yang selesai dari `sessions.json` (default `24h`; setel `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan baris yang dipertahankan.
    - Lihat [job Cron](/id/automation/cron-jobs) untuk ikhtisar fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Menyiapkan Webhook (hook)">
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
    - Auth hook hanya header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query-string ditolak.
    - `hooks.path` tidak boleh `/`; pertahankan ingress Webhook pada subpath khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman tetap nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali untuk debugging yang sangat terbatas.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, setel juga `hooks.allowedSessionKeyPrefixes` untuk membatasi session key yang dipilih pemanggil.
    - Untuk agent yang digerakkan hook, utamakan tier model modern yang kuat dan kebijakan tool yang ketat (misalnya hanya messaging plus sandboxing bila memungkinkan).

    Lihat [referensi lengkap](/id/gateway/configuration-reference#hooks) untuk semua opsi mapping dan integrasi Gmail.

  </Accordion>

  <Accordion title="Mengonfigurasi routing multi-agent">
    Jalankan beberapa agent terisolasi dengan workspace dan sesi terpisah:

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

    Lihat [Multi-Agent](/id/concepts/multi-agent) dan [referensi lengkap](/id/gateway/configuration-reference#multi-agent-routing) untuk aturan binding dan profil akses per agent.

  </Accordion>

  <Accordion title="Membagi config ke beberapa file ($include)">
    Gunakan `$include` untuk mengatur config yang besar:

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
    - **Array file**: di-merge mendalam sesuai urutan (yang terakhir menang)
    - **Sibling key**: di-merge setelah include (menimpa nilai yang di-include)
    - **Include bertingkat**: didukung hingga kedalaman 10 level
    - **Path relatif**: di-resolve relatif terhadap file yang melakukan include
    - **Penanganan error**: error yang jelas untuk file hilang, error parse, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload config

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — tidak perlu restart manual untuk sebagian besar pengaturan.

Edit file langsung diperlakukan sebagai tidak tepercaya sampai lolos validasi. Watcher menunggu
churn temp-write/rename editor mereda, membaca file final, dan menolak
edit eksternal yang tidak valid dengan memulihkan config last-known-good. Penulisan config
milik OpenClaw menggunakan gate skema yang sama sebelum menulis; clobber destruktif seperti
menghapus `gateway.mode` atau menyusutkan file lebih dari setengah akan ditolak
dan disimpan sebagai `.rejected.*` untuk inspeksi.

Jika Anda melihat `Config auto-restored from last-known-good` atau
`config reload restored last-known-good config` dalam log, periksa file
`.clobbered.*` yang cocok di sebelah `openclaw.json`, perbaiki payload yang ditolak, lalu jalankan
`openclaw config validate`. Lihat [pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config)
untuk daftar periksa pemulihan.

### Mode reload

| Mode                   | Perilaku                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan secara hot perubahan aman seketika. Otomatis restart untuk yang kritis.    |
| **`hot`**              | Menerapkan secara hot hanya perubahan aman. Mencatat peringatan saat restart diperlukan — Anda yang menanganinya. |
| **`restart`**          | Me-restart Gateway pada setiap perubahan config, aman atau tidak.                      |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.       |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Apa yang diterapkan secara hot vs apa yang perlu restart

Sebagian besar field diterapkan secara hot tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Category            | Fields                                                               | Restart needed? |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`, `web` (WhatsApp) — semua channel bawaan dan extension  | No              |
| Agent & models      | `agent`, `agents`, `models`, `routing`                               | No              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                   | No              |
| Sessions & messages | `session`, `messages`                                                | No              |
| Tools & media       | `tools`, `browser`, `skills`, `audio`, `talk`                        | No              |
| UI & misc           | `ui`, `logging`, `identity`, `bindings`                              | No              |
| Gateway server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Yes**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                                 | **Yes**         |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubahnya **tidak** memicu restart.
</Note>

## RPC config (pembaruan terprogram)

<Note>
RPC tulis control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi lajunya menjadi **3 permintaan per 60 detik** per `deviceId+clientIp`. Saat dibatasi, RPC mengembalikan `UNAVAILABLE` dengan `retryAfterMs`.
</Note>

Alur aman/default:

- `config.schema.lookup`: periksa satu subtree config berbatas path dengan node
  skema dangkal, metadata hint yang cocok, dan ringkasan child langsung
- `config.get`: ambil snapshot + hash saat ini
- `config.patch`: path pembaruan parsial yang disarankan
- `config.apply`: hanya untuk penggantian config penuh
- `update.run`: self-update + restart eksplisit

Saat Anda tidak mengganti seluruh config, utamakan `config.schema.lookup`
lalu `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (penggantian penuh)">
    Memvalidasi + menulis config penuh dan me-restart Gateway dalam satu langkah.

    <Warning>
    `config.apply` menggantikan **seluruh config**. Gunakan `config.patch` untuk pembaruan parsial, atau `openclaw config set` untuk kunci tunggal.
    </Warning>

    Param:

    - `raw` (string) — payload JSON5 untuk seluruh config
    - `baseHash` (opsional) — hash config dari `config.get` (wajib saat config sudah ada)
    - `sessionKey` (opsional) — session key untuk ping wake-up pascarestart
    - `note` (opsional) — catatan untuk sentinel restart
    - `restartDelayMs` (opsional) — jeda sebelum restart (default 2000)

    Permintaan restart dikoaleskan saat satu restart sudah tertunda/dalam proses, dan cooldown 30 detik berlaku di antara siklus restart.

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
    Menggabungkan pembaruan parsial ke config yang ada (semantik JSON merge patch):

    - Objek di-merge secara rekursif
    - `null` menghapus sebuah kunci
    - Array menggantikan

    Param:

    - `raw` (string) — JSON5 hanya dengan kunci yang akan diubah
    - `baseHash` (wajib) — hash config dari `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — sama seperti `config.apply`

    Perilaku restart sama dengan `config.apply`: restart tertunda yang dikoaleskan plus cooldown 30 detik di antara siklus restart.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variabel environment

OpenClaw membaca env var dari parent process plus:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua file tidak menimpa env var yang sudah ada. Anda juga dapat menetapkan env var inline di config:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor env shell (opsional)">
  Jika diaktifkan dan kunci yang diharapkan belum diatur, OpenClaw menjalankan login shell Anda dan hanya mengimpor kunci yang belum ada:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Padanan env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitusi env var dalam nilai config">
  Referensikan env var dalam nilai string config apa pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang cocok: `[A-Z_][A-Z0-9_]*`
- Env var yang hilang/kosong memunculkan error saat waktu muat
- Escape dengan `$${VAR}` untuk output literal
- Berfungsi di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef (env, file, exec)">
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
Path kredensial yang didukung tercantum di [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Environment](/id/help/environment) untuk prioritas dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap per field, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_
