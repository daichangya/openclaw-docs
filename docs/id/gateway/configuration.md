---
read_when:
    - Menyiapkan OpenClaw untuk pertama kali
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ringkasan konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-23T09:21:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfigurasi

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 mendukung komentar dan trailing comma">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.
Path konfigurasi aktif harus berupa file biasa. Tata letak
`openclaw.json` yang disymlink tidak didukung untuk penulisan milik OpenClaw; penulisan atomik dapat mengganti
path tersebut alih-alih mempertahankan symlink. Jika Anda menyimpan konfigurasi di luar
direktori status default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file aslinya.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan konfigurasi:

- Hubungkan channel dan kontrol siapa yang dapat mengirim pesan ke bot
- Tetapkan model, tool, sandboxing, atau otomatisasi (Cron, hook)
- Sesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

<Tip>
**Baru mengenal konfigurasi?** Mulailah dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/id/gateway/configuration-examples) untuk konfigurasi lengkap yang siap salin-tempel.
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
    openclaw onboard       # alur onboarding penuh
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
  <Tab title="UI Control">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    UI Control merender formulir dari skema konfigurasi live, termasuk metadata docs
    `title` / `description` plus skema plugin dan channel jika
    tersedia, dengan editor **Raw JSON** sebagai jalur darurat. Untuk UI
    drill-down dan tooling lainnya, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema yang dibatasi path plus ringkasan child langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file tersebut dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Kunci yang tidak dikenal, tipe yang salah format, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk mulai**. Satu-satunya pengecualian tingkat root adalah `$schema` (string), agar editor dapat melampirkan metadata JSON Schema.
</Warning>

`openclaw config schema` mencetak JSON Schema kanonis yang digunakan oleh UI Control
dan validasi. `config.schema.lookup` mengambil satu node yang dibatasi path plus
ringkasan child untuk tooling drill-down. Metadata docs field `title`/`description`
diteruskan melalui objek bertingkat, wildcard (`*`), item array (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema plugin dan channel runtime digabungkan saat
registry manifest dimuat.

Saat validasi gagal:

- Gateway tidak akan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah persisnya
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway menyimpan salinan tepercaya last-known-good setelah setiap startup yang berhasil.
Jika `openclaw.json` kemudian gagal validasi (atau menghapus `gateway.mode`, menyusut
tajam, atau memiliki baris log asing yang diawali di depannya), OpenClaw mempertahankan file yang rusak
sebagai `.clobbered.*`, memulihkan salinan last-known-good, dan mencatat alasan pemulihan
tersebut. Giliran agent berikutnya juga menerima peringatan peristiwa sistem agar agent utama
tidak menulis ulang konfigurasi yang dipulihkan secara membabi buta. Promosi ke last-known-good
dilewati saat kandidat berisi placeholder rahasia yang disamarkan seperti `***`.

## Tugas umum

<AccordionGroup>
  <Accordion title="Menyiapkan channel (WhatsApp, Telegram, Discord, dll.)">
    Setiap channel memiliki bagian konfigurasi sendiri di bawah `channels.<provider>`. Lihat halaman channel khusus untuk langkah penyiapan:

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
    Tetapkan model utama dan fallback opsional:

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
    - Gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri allowlist tanpa menghapus model yang sudah ada. Penggantian biasa yang akan menghapus entri akan ditolak kecuali Anda memberikan `--replace`.
    - Referensi model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transkrip/tool (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan token vision pada run yang banyak screenshot.
    - Lihat [CLI Models](/id/concepts/models) untuk mengganti model di chat dan [Model Failover](/id/concepts/model-failover) untuk rotasi auth dan perilaku fallback.
    - Untuk provider kustom/self-hosted, lihat [Provider kustom](/id/gateway/configuration-reference#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Mengontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per channel melalui `dmPolicy`:

    - `"pairing"` (default): pengirim yang tidak dikenal mendapatkan kode pairing sekali pakai untuk disetujui
    - `"allowlist"`: hanya pengirim di `allowFrom` (atau store allow berpasangan)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus channel.

    Lihat [referensi lengkap](/id/gateway/configuration-reference#dm-and-group-access) untuk detail per channel.

  </Accordion>

  <Accordion title="Menyiapkan pembatasan mention chat grup">
    Pesan grup secara default **memerlukan mention**. Konfigurasikan pola per agent:

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

    - **Mention metadata**: @-mention native (WhatsApp tap-to-mention, Telegram @bot, dll.)
    - **Pola teks**: pola regex aman di `mentionPatterns`
    - Lihat [referensi lengkap](/id/gateway/configuration-reference#group-chat-mention-gating) untuk override per channel dan mode self-chat.

  </Accordion>

  <Accordion title="Membatasi Skill per agent">
    Gunakan `agents.defaults.skills` untuk baseline bersama, lalu override
    agent tertentu dengan `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // mewarisi github, weather
          { id: "docs", skills: ["docs-search"] }, // menggantikan default
          { id: "locked-down", skills: [] }, // tanpa Skills
        ],
      },
    }
    ```

    - Hilangkan `agents.defaults.skills` untuk Skills yang tidak dibatasi secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Tetapkan `agents.list[].skills: []` agar tanpa Skills.
    - Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Menyesuaikan pemantauan kesehatan channel Gateway">
    Kontrol seberapa agresif gateway me-restart channel yang tampak usang:

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

    - Tetapkan `gateway.channelHealthCheckMinutes: 0` untuk menonaktifkan restart health-monitor secara global.
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
    - `threadBindings`: default global untuk perutean sesi terikat thread (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Manajemen Sesi](/id/concepts/session) untuk scoping, identity link, dan kebijakan pengiriman.
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

    Tetapkan ini di konfigurasi gateway:

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

    - Memungkinkan Gateway mengirim `push.test`, wake nudge, dan reconnect wake melalui relay eksternal.
    - Menggunakan grant pengiriman berscope registrasi yang diteruskan oleh aplikasi iOS yang dipasangkan. Gateway tidak memerlukan token relay yang berlaku untuk seluruh deployment.
    - Mengikat setiap registrasi berbasis relay ke identitas Gateway yang dipasangkan oleh aplikasi iOS, sehingga Gateway lain tidak dapat menggunakan ulang registrasi yang disimpan.
    - Menjaga build iOS lokal/manual tetap menggunakan APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build resmi yang didistribusikan dan terdaftar melalui relay.
    - Harus cocok dengan URL dasar relay yang di-embed ke dalam build iOS resmi/TestFlight, sehingga trafik registrasi dan pengiriman mencapai deployment relay yang sama.

    Alur end-to-end:

    1. Instal build iOS resmi/TestFlight yang dikompilasi dengan URL dasar relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada Gateway.
    3. Pairing aplikasi iOS ke Gateway dan biarkan sesi node maupun operator terhubung.
    4. Aplikasi iOS mengambil identitas Gateway, mendaftar ke relay menggunakan App Attest plus receipt aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke Gateway yang dipasangkan.
    5. Gateway menyimpan handle relay dan grant pengiriman, lalu menggunakannya untuk `push.test`, wake nudge, dan reconnect wake.

    Catatan operasional:

    - Jika Anda memindahkan aplikasi iOS ke Gateway yang berbeda, hubungkan ulang aplikasi agar dapat memublikasikan registrasi relay baru yang terikat ke Gateway tersebut.
    - Jika Anda merilis build iOS baru yang menunjuk ke deployment relay yang berbeda, aplikasi akan menyegarkan registrasi relay yang di-cache alih-alih menggunakan ulang asal relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap merupakan jalur darurat pengembangan khusus loopback; jangan simpan URL relay HTTP di konfigurasi.

    Lihat [Aplikasi iOS](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur end-to-end dan [Alur autentikasi dan kepercayaan](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

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

    - `every`: string durasi (`30m`, `2h`). Tetapkan `0m` untuk menonaktifkan.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target Heartbeat bergaya DM
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

    - `sessionRetention`: pangkas sesi run terisolasi yang telah selesai dari `sessions.json` (default `24h`; tetapkan `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan jumlah baris yang dipertahankan.
    - Lihat [Job Cron](/id/automation/cron-jobs) untuk ringkasan fitur dan contoh CLI.

  </Accordion>

  <Accordion title="Menyiapkan webhook (hook)">
    Aktifkan endpoint webhook HTTP pada Gateway:

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
    - Perlakukan semua konten payload hook/webhook sebagai input yang tidak tepercaya.
    - Gunakan `hooks.token` khusus; jangan gunakan ulang token Gateway bersama.
    - Autentikasi hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query-string ditolak.
    - `hooks.path` tidak boleh berupa `/`; simpan ingress webhook pada subpath khusus seperti `/hooks`.
    - Biarkan flag bypass konten tidak aman tetap nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali untuk debugging yang sangat terbatas.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi kunci sesi yang dipilih pemanggil.
    - Untuk agent yang digerakkan hook, pilih tier model modern yang kuat dan kebijakan tool yang ketat (misalnya hanya messaging plus sandboxing jika memungkinkan).

    Lihat [referensi lengkap](/id/gateway/configuration-reference#hooks) untuk semua opsi mapping dan integrasi Gmail.

  </Accordion>

  <Accordion title="Mengonfigurasi perutean multi-agent">
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

  <Accordion title="Memisahkan konfigurasi ke beberapa file ($include)">
    Gunakan `$include` untuk mengatur konfigurasi yang besar:

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

    - **Satu file**: menggantikan objek yang memuatnya
    - **Array file**: deep-merge sesuai urutan (yang belakangan menang)
    - **Kunci sibling**: digabungkan setelah include (menimpa nilai yang disertakan)
    - **Include bertingkat**: didukung hingga 10 level kedalaman
    - **Path relatif**: diselesaikan relatif terhadap file yang menyertakan
    - **Penulisan milik OpenClaw**: saat penulisan hanya mengubah satu bagian tingkat atas
      yang didukung include satu file seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file yang disertakan itu dan membiarkan `openclaw.json` tetap utuh
    - **Write-through yang tidak didukung**: include root, array include, dan include
      dengan override sibling gagal tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan konfigurasi
    - **Penanganan error**: error yang jelas untuk file hilang, error parse, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload konfigurasi

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — tidak perlu restart manual untuk sebagian besar pengaturan.

Edit file langsung diperlakukan sebagai tidak tepercaya sampai lolos validasi. Watcher menunggu
churn temp-write/rename editor mereda, membaca file akhir, dan menolak
edit eksternal yang tidak valid dengan memulihkan konfigurasi last-known-good. Penulisan konfigurasi
milik OpenClaw menggunakan gate skema yang sama sebelum menulis; clobber destruktif seperti
menghapus `gateway.mode` atau mengecilkan file lebih dari setengahnya akan ditolak
dan disimpan sebagai `.rejected.*` untuk diperiksa.

Jika Anda melihat `Config auto-restored from last-known-good` atau
`config reload restored last-known-good config` di log, periksa file
`.clobbered.*` yang cocok di samping `openclaw.json`, perbaiki payload yang ditolak, lalu jalankan
`openclaw config validate`. Lihat [pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config)
untuk checklist pemulihannya.

### Mode reload

| Mode                   | Perilaku                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan perubahan aman secara langsung. Otomatis restart untuk perubahan kritis.     |
| **`hot`**              | Hanya menerapkan perubahan aman secara langsung. Mencatat peringatan saat restart diperlukan — Anda yang menanganinya. |
| **`restart`**          | Me-restart Gateway pada setiap perubahan konfigurasi, aman atau tidak.                  |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Apa yang diterapkan langsung vs apa yang memerlukan restart

Sebagian besar field diterapkan langsung tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Kategori            | Field                                                             | Perlu restart? |
| ------------------- | ----------------------------------------------------------------- | -------------- |
| Channel             | `channels.*`, `web` (WhatsApp) — semua channel bawaan dan plugin  | Tidak          |
| Agent & model       | `agent`, `agents`, `models`, `routing`                            | Tidak          |
| Otomatisasi         | `hooks`, `cron`, `agent.heartbeat`                                | Tidak          |
| Sesi & pesan        | `session`, `messages`                                             | Tidak          |
| Tool & media        | `tools`, `browser`, `skills`, `audio`, `talk`                     | Tidak          |
| UI & lainnya        | `ui`, `logging`, `identity`, `bindings`                           | Tidak          |
| Server Gateway      | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)              | **Ya**         |
| Infrastruktur       | `discovery`, `canvasHost`, `plugins`                              | **Ya**         |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubah keduanya **tidak** memicu restart.
</Note>

### Perencanaan reload

Saat Anda mengedit file sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
reload dari tata letak yang ditulis pada sumber, bukan tampilan in-memory yang diratakan.
Ini menjaga keputusan hot-reload (diterapkan langsung vs restart) tetap dapat diprediksi bahkan saat
satu bagian tingkat atas berada di file include-nya sendiri seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan reload gagal tertutup jika
tata letak sumber ambigu.

## RPC konfigurasi (pembaruan terprogram)

Untuk tooling yang menulis konfigurasi melalui API Gateway, pilih alur ini:

- `config.schema.lookup` untuk memeriksa satu subtree (node skema dangkal + ringkasan
  child)
- `config.get` untuk mengambil snapshot saat ini plus `hash`
- `config.patch` untuk pembaruan parsial (JSON merge patch: objek digabungkan, `null`
  menghapus, array menggantikan)
- `config.apply` hanya saat Anda memang ingin mengganti seluruh konfigurasi
- `update.run` untuk self-update eksplisit plus restart

<Note>
Penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi
lajunya menjadi 3 permintaan per 60 detik per `deviceId+clientIp`. Permintaan restart
digabungkan lalu menerapkan cooldown 30 detik di antara siklus restart.
</Note>

Contoh patch parsial:

```bash
openclaw gateway call config.get --params '{}'  # ambil payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` dan `config.patch` sama-sama menerima `raw`, `baseHash`, `sessionKey`,
`note`, dan `restartDelayMs`. `baseHash` wajib untuk kedua metode saat
konfigurasi sudah ada.

## Variabel lingkungan

OpenClaw membaca variabel lingkungan dari proses induk plus:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua file tidak menimpa variabel lingkungan yang sudah ada. Anda juga dapat menetapkan env var inline di konfigurasi:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor env shell (opsional)">
  Jika diaktifkan dan kunci yang diharapkan belum ditetapkan, OpenClaw menjalankan login shell Anda dan hanya mengimpor kunci yang belum ada:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Padanan env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitusi env var dalam nilai konfigurasi">
  Rujuk env var di nilai string konfigurasi mana pun dengan `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Aturan:

- Hanya nama huruf besar yang cocok: `[A-Z_][A-Z0-9_]*`
- Variabel yang hilang/kosong melempar error saat waktu muat
- Escape dengan `$${VAR}` untuk output literal
- Berfungsi di dalam file `$include`
- Substitusi inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Ref rahasia (env, file, exec)">
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

Detail SecretRef (termasuk `secrets.providers` untuk `env`/`file`/`exec`) ada di [Manajemen Rahasia](/id/gateway/secrets).
Path kredensial yang didukung tercantum di [Surface Kredensial SecretRef](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Environment](/id/help/environment) untuk prioritas dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap field demi field, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_
