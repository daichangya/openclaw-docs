---
read_when:
    - Menyiapkan OpenClaw untuk pertama kali
    - Mencari pola konfigurasi umum
    - Menavigasi ke bagian konfigurasi tertentu
summary: 'Ikhtisar konfigurasi: tugas umum, penyiapan cepat, dan tautan ke referensi lengkap'
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-25T13:46:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8ffe1972fc7680d4cfc55a24fd6fc3869af593faf8c1137369dad0dbefde43a
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw membaca konfigurasi <Tooltip tip="JSON5 mendukung komentar dan trailing comma">**JSON5**</Tooltip> opsional dari `~/.openclaw/openclaw.json`.
Path konfigurasi aktif harus berupa file biasa. Tata letak `openclaw.json` yang disymlink
tidak didukung untuk penulisan yang dimiliki OpenClaw; penulisan atomik dapat mengganti
path tersebut alih-alih mempertahankan symlink. Jika Anda menyimpan konfigurasi di luar
direktori status default, arahkan `OPENCLAW_CONFIG_PATH` langsung ke file aslinya.

Jika file tidak ada, OpenClaw menggunakan default yang aman. Alasan umum untuk menambahkan konfigurasi:

- Menghubungkan saluran dan mengontrol siapa yang dapat mengirim pesan ke bot
- Mengatur model, alat, sandboxing, atau otomatisasi (cron, hook)
- Menyesuaikan sesi, media, jaringan, atau UI

Lihat [referensi lengkap](/id/gateway/configuration-reference) untuk setiap field yang tersedia.

<Tip>
**Baru mengenal konfigurasi?** Mulailah dengan `openclaw onboard` untuk penyiapan interaktif, atau lihat panduan [Contoh Konfigurasi](/id/gateway/configuration-examples) untuk konfigurasi lengkap siap salin-tempel.
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
  <Tab title="CLI (one-liner)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Buka [http://127.0.0.1:18789](http://127.0.0.1:18789) dan gunakan tab **Config**.
    Control UI merender formulir dari skema konfigurasi live, termasuk metadata dokumentasi field
    `title` / `description` ditambah skema plugin dan saluran bila
    tersedia, dengan editor **Raw JSON** sebagai jalan keluar. Untuk UI
    drill-down dan alat lainnya, gateway juga mengekspos `config.schema.lookup` untuk
    mengambil satu node skema yang dicakup ke path ditambah ringkasan child langsung.
  </Tab>
  <Tab title="Edit langsung">
    Edit `~/.openclaw/openclaw.json` secara langsung. Gateway memantau file dan menerapkan perubahan secara otomatis (lihat [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validasi ketat

<Warning>
OpenClaw hanya menerima konfigurasi yang sepenuhnya cocok dengan skema. Key yang tidak dikenal, tipe yang salah format, atau nilai yang tidak valid menyebabkan Gateway **menolak untuk memulai**. Satu-satunya pengecualian pada level root adalah `$schema` (string), sehingga editor dapat melampirkan metadata JSON Schema.
</Warning>

`openclaw config schema` mencetak JSON Schema kanonis yang digunakan oleh Control UI
dan validasi. `config.schema.lookup` mengambil satu node yang dicakup ke path ditambah
ringkasan child untuk alat drill-down. Metadata dokumentasi field `title`/`description`
diteruskan melalui objek bertingkat, wildcard (`*`), item array (`[]`), dan cabang `anyOf`/
`oneOf`/`allOf`. Skema plugin dan saluran runtime digabungkan saat
registri manifes dimuat.

Saat validasi gagal:

- Gateway tidak akan boot
- Hanya perintah diagnostik yang berfungsi (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Jalankan `openclaw doctor` untuk melihat masalah yang tepat
- Jalankan `openclaw doctor --fix` (atau `--yes`) untuk menerapkan perbaikan

Gateway menyimpan salinan tepercaya last-known-good setelah setiap startup yang berhasil.
Jika `openclaw.json` kemudian gagal validasi (atau kehilangan `gateway.mode`, menyusut
tajam, atau memiliki baris log liar yang ditambahkan di awal), OpenClaw mempertahankan file yang rusak
sebagai `.clobbered.*`, memulihkan salinan last-known-good, dan mencatat alasan
pemulihan. Giliran agen berikutnya juga menerima peringatan system-event sehingga agen utama
tidak membabi buta menulis ulang konfigurasi yang dipulihkan. Promosi ke last-known-good
dilewati saat kandidat berisi placeholder secret yang disamarkan seperti `***`.
Ketika setiap masalah validasi dicakup ke `plugins.entries.<id>...`, OpenClaw
tidak melakukan pemulihan seluruh file. OpenClaw mempertahankan konfigurasi saat ini tetap aktif dan
menampilkan kegagalan lokal plugin sehingga ketidakcocokan skema plugin atau versi host
tidak membatalkan pengaturan pengguna lain yang tidak terkait.

## Tugas umum

<AccordionGroup>
  <Accordion title="Menyiapkan saluran (WhatsApp, Telegram, Discord, dll.)">
    Setiap saluran memiliki bagian konfigurasinya sendiri di bawah `channels.<provider>`. Lihat halaman saluran khusus untuk langkah penyiapan:

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

    Semua saluran berbagi pola kebijakan DM yang sama:

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
    - Gunakan `openclaw config set agents.defaults.models '<json>' --strict-json --merge` untuk menambahkan entri allowlist tanpa menghapus model yang sudah ada. Penggantian biasa yang akan menghapus entri akan ditolak kecuali Anda memberikan `--replace`.
    - Ref model menggunakan format `provider/model` (misalnya `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` mengontrol downscaling gambar transkrip/alat (default `1200`); nilai yang lebih rendah biasanya mengurangi penggunaan token vision pada run yang banyak screenshot.
    - Lihat [Models CLI](/id/concepts/models) untuk mengganti model di chat dan [Model Failover](/id/concepts/model-failover) untuk rotasi auth dan perilaku fallback.
    - Untuk penyedia kustom/self-hosted, lihat [Custom providers](/id/gateway/config-tools#custom-providers-and-base-urls) di referensi.

  </Accordion>

  <Accordion title="Mengontrol siapa yang dapat mengirim pesan ke bot">
    Akses DM dikontrol per saluran melalui `dmPolicy`:

    - `"pairing"` (default): pengirim yang tidak dikenal mendapatkan kode pairing sekali pakai untuk disetujui
    - `"allowlist"`: hanya pengirim dalam `allowFrom` (atau penyimpanan allow yang sudah dipair)
    - `"open"`: izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)
    - `"disabled"`: abaikan semua DM

    Untuk grup, gunakan `groupPolicy` + `groupAllowFrom` atau allowlist khusus saluran.

    Lihat [referensi lengkap](/id/gateway/config-channels#dm-and-group-access) untuk detail per saluran.

  </Accordion>

  <Accordion title="Menyiapkan pembatasan mention chat grup">
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
    - Lihat [referensi lengkap](/id/gateway/config-channels#group-chat-mention-gating) untuk override per saluran dan mode self-chat.

  </Accordion>

  <Accordion title="Membatasi Skills per agen">
    Gunakan `agents.defaults.skills` untuk baseline bersama, lalu override agen
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
          { id: "locked-down", skills: [] }, // tanpa Skills
        ],
      },
    }
    ```

    - Hilangkan `agents.defaults.skills` untuk Skills tak terbatas secara default.
    - Hilangkan `agents.list[].skills` untuk mewarisi default.
    - Atur `agents.list[].skills: []` untuk tanpa Skills.
    - Lihat [Skills](/id/tools/skills), [konfigurasi Skills](/id/tools/skills-config), dan
      [Referensi Konfigurasi](/id/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Menyesuaikan pemantauan kesehatan saluran gateway">
    Kontrol seberapa agresif gateway me-restart saluran yang tampak basi:

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
    - Gunakan `channels.<provider>.healthMonitor.enabled` atau `channels.<provider>.accounts.<id>.healthMonitor.enabled` untuk menonaktifkan auto-restart pada satu saluran atau akun tanpa menonaktifkan monitor global.
    - Lihat [Health Checks](/id/gateway/health) untuk debugging operasional dan [referensi lengkap](/id/gateway/configuration-reference#gateway) untuk semua field.

  </Accordion>

  <Accordion title="Mengonfigurasi sesi dan reset">
    Sesi mengontrol kontinuitas percakapan dan isolasi:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // disarankan untuk multi-pengguna
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

    - `dmScope`: `main` (shared) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: default global untuk perutean sesi yang terikat thread (Discord mendukung `/focus`, `/unfocus`, `/agents`, `/session idle`, dan `/session max-age`).
    - Lihat [Session Management](/id/concepts/session) untuk cakupan, tautan identitas, dan kebijakan kirim.
    - Lihat [referensi lengkap](/id/gateway/config-agents#session) untuk semua field.

  </Accordion>

  <Accordion title="Mengaktifkan sandboxing">
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

    Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap dan [referensi lengkap](/id/gateway/config-agents#agentsdefaultssandbox) untuk semua opsi.

  </Accordion>

  <Accordion title="Mengaktifkan push berbasis relay untuk build iOS resmi">
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

    - Memungkinkan gateway mengirim `push.test`, wake nudge, dan reconnect wake melalui relay eksternal.
    - Menggunakan grant kirim yang dicakup ke registrasi dan diteruskan oleh aplikasi iOS yang telah dipair. Gateway tidak memerlukan token relay tingkat deployment.
    - Mengikat setiap registrasi berbasis relay ke identitas gateway yang dipair dengan aplikasi iOS, sehingga gateway lain tidak dapat menggunakan ulang registrasi yang tersimpan.
    - Mempertahankan build iOS lokal/manual pada APNs langsung. Pengiriman berbasis relay hanya berlaku untuk build resmi yang didistribusikan yang mendaftar melalui relay.
    - Harus cocok dengan base URL relay yang ditanamkan ke build iOS resmi/TestFlight, sehingga lalu lintas registrasi dan pengiriman mencapai deployment relay yang sama.

    Alur end-to-end:

    1. Pasang build iOS resmi/TestFlight yang dikompilasi dengan base URL relay yang sama.
    2. Konfigurasikan `gateway.push.apns.relay.baseUrl` pada gateway.
    3. Pair aplikasi iOS ke gateway dan biarkan sesi node dan operator terhubung.
    4. Aplikasi iOS mengambil identitas gateway, mendaftar ke relay menggunakan App Attest plus receipt aplikasi, lalu memublikasikan payload `push.apns.register` berbasis relay ke gateway yang dipair.
    5. Gateway menyimpan handle relay dan grant kirim, lalu menggunakannya untuk `push.test`, wake nudge, dan reconnect wake.

    Catatan operasional:

    - Jika Anda memindahkan aplikasi iOS ke gateway yang berbeda, hubungkan ulang aplikasi agar dapat memublikasikan registrasi relay baru yang terikat ke gateway tersebut.
    - Jika Anda mengirim build iOS baru yang menunjuk ke deployment relay yang berbeda, aplikasi menyegarkan registrasi relay yang di-cache alih-alih menggunakan ulang asal relay lama.

    Catatan kompatibilitas:

    - `OPENCLAW_APNS_RELAY_BASE_URL` dan `OPENCLAW_APNS_RELAY_TIMEOUT_MS` masih berfungsi sebagai override env sementara.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` tetap merupakan jalan keluar pengembangan khusus loopback; jangan mempertahankan URL relay HTTP dalam konfigurasi.

    Lihat [Aplikasi iOS](/id/platforms/ios#relay-backed-push-for-official-builds) untuk alur end-to-end dan [Authentication and trust flow](/id/platforms/ios#authentication-and-trust-flow) untuk model keamanan relay.

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

    - `every`: string durasi (`30m`, `2h`). Atur `0m` untuk menonaktifkan.
    - `target`: `last` | `none` | `<channel-id>` (misalnya `discord`, `matrix`, `telegram`, atau `whatsapp`)
    - `directPolicy`: `allow` (default) atau `block` untuk target Heartbeat bergaya DM
    - Lihat [Heartbeat](/id/gateway/heartbeat) untuk panduan lengkap.

  </Accordion>

  <Accordion title="Mengonfigurasi pekerjaan Cron">
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

    - `sessionRetention`: pangkas sesi run terisolasi yang sudah selesai dari `sessions.json` (default `24h`; atur `false` untuk menonaktifkan).
    - `runLog`: pangkas `cron/runs/<jobId>.jsonl` berdasarkan ukuran dan baris yang dipertahankan.
    - Lihat [Pekerjaan Cron](/id/automation/cron-jobs) untuk ikhtisar fitur dan contoh CLI.

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
    - Auth hook hanya melalui header (`Authorization: Bearer ...` atau `x-openclaw-token`); token query-string ditolak.
    - `hooks.path` tidak boleh bernilai `/`; pertahankan ingress Webhook pada subpath khusus seperti `/hooks`.
    - Pertahankan flag bypass konten tidak aman tetap nonaktif (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) kecuali untuk debugging yang sangat terbatas.
    - Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, atur juga `hooks.allowedSessionKeyPrefixes` untuk membatasi session key yang dipilih pemanggil.
    - Untuk agen yang digerakkan oleh hook, pilih tier model modern yang kuat dan kebijakan alat yang ketat (misalnya hanya-pesan plus sandboxing jika memungkinkan).

    Lihat [referensi lengkap](/id/gateway/configuration-reference#hooks) untuk semua opsi pemetaan dan integrasi Gmail.

  </Accordion>

  <Accordion title="Mengonfigurasi perutean multi-agen">
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

    Lihat [Multi-Agent](/id/concepts/multi-agent) dan [referensi lengkap](/id/gateway/config-agents#multi-agent-routing) untuk aturan binding dan profil akses per agen.

  </Accordion>

  <Accordion title="Memisahkan konfigurasi ke beberapa file ($include)">
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
    - **Array file**: di-deep-merge sesuai urutan (yang belakangan menang)
    - **Key saudara**: di-merge setelah include (mengoverride nilai yang di-include)
    - **Include bertingkat**: didukung hingga 10 level kedalaman
    - **Path relatif**: di-resolve relatif terhadap file yang melakukan include
    - **Penulisan milik OpenClaw**: ketika penulisan hanya mengubah satu bagian tingkat atas
      yang didukung oleh include file tunggal seperti `plugins: { $include: "./plugins.json5" }`,
      OpenClaw memperbarui file yang di-include tersebut dan membiarkan `openclaw.json` tetap utuh
    - **Write-through yang tidak didukung**: include root, array include, dan include
      dengan override saudara gagal tertutup untuk penulisan milik OpenClaw alih-alih
      meratakan konfigurasi
    - **Penanganan error**: error yang jelas untuk file hilang, error parse, dan include melingkar

  </Accordion>
</AccordionGroup>

## Hot reload konfigurasi

Gateway memantau `~/.openclaw/openclaw.json` dan menerapkan perubahan secara otomatis — tidak perlu restart manual untuk sebagian besar pengaturan.

Edit file langsung diperlakukan sebagai tidak tepercaya hingga lolos validasi. Watcher menunggu
churn temp-write/rename editor hingga stabil, membaca file akhir, dan menolak
edit eksternal yang tidak valid dengan memulihkan konfigurasi last-known-good. Penulisan konfigurasi
milik OpenClaw menggunakan gerbang skema yang sama sebelum menulis; clobber destruktif seperti
menghapus `gateway.mode` atau mengecilkan file lebih dari setengah akan ditolak
dan disimpan sebagai `.rejected.*` untuk inspeksi.

Kegagalan validasi lokal plugin adalah pengecualian: jika semua masalah berada di bawah
`plugins.entries.<id>...`, reload mempertahankan konfigurasi saat ini dan melaporkan masalah plugin
alih-alih memulihkan `.last-good`.

Jika Anda melihat `Config auto-restored from last-known-good` atau
`config reload restored last-known-good config` di log, periksa file
`.clobbered.*` yang sesuai di samping `openclaw.json`, perbaiki payload yang ditolak, lalu jalankan
`openclaw config validate`. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config)
untuk daftar periksa pemulihan.

### Mode reload

| Mode                   | Perilaku                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (default) | Menerapkan hot-apply perubahan aman secara instan. Otomatis restart untuk yang kritis. |
| **`hot`**              | Hanya menerapkan hot-apply perubahan aman. Mencatat peringatan saat restart diperlukan — Anda yang menanganinya. |
| **`restart`**          | Me-restart Gateway pada setiap perubahan konfigurasi, aman atau tidak.                 |
| **`off`**              | Menonaktifkan pemantauan file. Perubahan berlaku pada restart manual berikutnya.       |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Apa yang di-hot-apply vs apa yang perlu restart

Sebagian besar field di-hot-apply tanpa downtime. Dalam mode `hybrid`, perubahan yang memerlukan restart ditangani secara otomatis.

| Kategori              | Field                                                             | Perlu restart? |
| --------------------- | ----------------------------------------------------------------- | -------------- |
| Saluran               | `channels.*`, `web` (WhatsApp) — semua saluran bawaan dan plugin  | Tidak          |
| Agen & model          | `agent`, `agents`, `models`, `routing`                            | Tidak          |
| Otomatisasi           | `hooks`, `cron`, `agent.heartbeat`                                | Tidak          |
| Sesi & pesan          | `session`, `messages`                                             | Tidak          |
| Alat & media          | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Tidak          |
| UI & lain-lain        | `ui`, `logging`, `identity`, `bindings`                           | Tidak          |
| Server gateway        | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)              | **Ya**         |
| Infrastruktur         | `discovery`, `canvasHost`, `plugins`                              | **Ya**         |

<Note>
`gateway.reload` dan `gateway.remote` adalah pengecualian — mengubahnya **tidak** memicu restart.
</Note>

### Perencanaan reload

Saat Anda mengedit file sumber yang dirujuk melalui `$include`, OpenClaw merencanakan
reload dari tata letak yang ditulis di sumber, bukan dari tampilan in-memory yang diratakan.
Ini menjaga keputusan hot-reload (hot-apply vs restart) tetap dapat diprediksi bahkan ketika
satu bagian tingkat atas berada di file include tersendiri seperti
`plugins: { $include: "./plugins.json5" }`. Perencanaan reload gagal tertutup jika
tata letak sumber ambigu.

## RPC konfigurasi (pembaruan terprogram)

Untuk alat yang menulis konfigurasi melalui API gateway, utamakan alur ini:

- `config.schema.lookup` untuk memeriksa satu subtree (node skema dangkal + ringkasan
  child)
- `config.get` untuk mengambil snapshot saat ini plus `hash`
- `config.patch` untuk pembaruan parsial (JSON merge patch: objek di-merge, `null`
  menghapus, array menggantikan)
- `config.apply` hanya ketika Anda memang berniat mengganti seluruh konfigurasi
- `update.run` untuk self-update eksplisit plus restart

<Note>
Penulisan control-plane (`config.apply`, `config.patch`, `update.run`) dibatasi
laju hingga 3 permintaan per 60 detik per `deviceId+clientIp`. Permintaan restart
digabungkan lalu menegakkan cooldown 30 detik antar siklus restart.
</Note>

Contoh patch parsial:

```bash
openclaw gateway call config.get --params '{}'  # ambil payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Baik `config.apply` maupun `config.patch` menerima `raw`, `baseHash`, `sessionKey`,
`note`, dan `restartDelayMs`. `baseHash` diperlukan untuk kedua metode saat
konfigurasi sudah ada.

## Variabel environment

OpenClaw membaca env var dari proses induk ditambah:

- `.env` dari direktori kerja saat ini (jika ada)
- `~/.openclaw/.env` (fallback global)

Kedua file tersebut tidak menimpa env var yang sudah ada. Anda juga dapat mengatur env var inline di konfigurasi:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Impor env shell (opsional)">
  Jika diaktifkan dan key yang diharapkan belum diatur, OpenClaw menjalankan login shell Anda dan hanya mengimpor key yang belum ada:

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
- Env var yang hilang/kosong akan melempar error saat waktu muat
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
Path kredensial yang didukung tercantum di [SecretRef Credential Surface](/id/reference/secretref-credential-surface).
</Accordion>

Lihat [Environment](/id/help/environment) untuk prioritas dan sumber lengkap.

## Referensi lengkap

Untuk referensi lengkap per field, lihat **[Referensi Konfigurasi](/id/gateway/configuration-reference)**.

---

_Terkait: [Contoh Konfigurasi](/id/gateway/configuration-examples) · [Referensi Konfigurasi](/id/gateway/configuration-reference) · [Doctor](/id/gateway/doctor)_

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Contoh konfigurasi](/id/gateway/configuration-examples)
- [Gateway runbook](/id/gateway)
