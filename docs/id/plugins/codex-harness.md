---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan contoh config harness Codex
    - Anda ingin deployment khusus Codex gagal alih-alih fallback ke PI
summary: Jalankan giliran agen embedded OpenClaw melalui harness app-server Codex bawaan
title: Harness Codex
x-i18n:
    generated_at: "2026-04-25T13:50:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen embedded melalui
app-server Codex alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agen tingkat rendah: discovery
model, resume thread native, Compaction native, dan eksekusi app-server.
OpenClaw tetap memiliki chat channel, file sesi, pemilihan model, tool,
approval, pengiriman media, dan mirror transkrip yang terlihat.

Jika Anda sedang mencoba memahami orientasinya, mulai dari
[Agent runtimes](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah referensi model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau channel lain tetap menjadi surface komunikasi.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan kompatibilitas publik.
Ini adalah hook OpenClaw dalam proses, bukan hook perintah `hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk rekaman transkrip mirror
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil tool yang netral terhadap runtime untuk menulis ulang hasil tool dinamis OpenClaw setelah OpenClaw mengeksekusi tool dan sebelum hasilnya dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil tool transkrip milik OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Plugin hooks](/id/plugins/hooks)
dan [Plugin guard behavior](/id/tools/plugin).

Harness ini nonaktif secara default. Config baru sebaiknya menjaga referensi model OpenAI tetap
kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`embeddedHarness.runtime: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` saat mereka
menginginkan eksekusi app-server native. Referensi model `codex/*` legacy masih otomatis memilih
harness demi kompatibilitas, tetapi prefix provider legacy berbasis runtime tidak
ditampilkan sebagai pilihan model/provider normal.

## Pilih prefix model yang tepat

Rute keluarga OpenAI bersifat spesifik terhadap prefix. Gunakan `openai-codex/*` saat Anda ingin
OAuth Codex melalui PI; gunakan `openai/*` saat Anda menginginkan akses API OpenAI langsung atau
saat Anda memaksa harness app-server Codex native:

| Referensi model                                      | Jalur runtime                                | Gunakan saat                                                              |
| ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | Provider OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses API OpenAI Platform langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OAuth OpenAI Codex melalui OpenClaw/PI       | Anda menginginkan auth subscription ChatGPT/Codex dengan runner PI default. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex                    | Anda menginginkan eksekusi app-server Codex native untuk giliran agen embedded. |

GPT-5.5 saat ini hanya tersedia melalui subscription/OAuth di OpenClaw. Gunakan
`openai-codex/gpt-5.5` untuk OAuth PI, atau `openai/gpt-5.5` dengan harness
app-server Codex. Akses API key langsung untuk `openai/gpt-5.5` didukung
setelah OpenAI mengaktifkan GPT-5.5 pada API publik.

Referensi legacy `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi kompatibilitas doctor
menulis ulang referensi runtime primary legacy menjadi referensi model kanonis dan mencatat kebijakan runtime secara terpisah, sementara referensi legacy yang hanya fallback dibiarkan tidak berubah karena runtime dikonfigurasi untuk seluruh container agen.
Config OAuth Codex PI baru sebaiknya menggunakan `openai-codex/gpt-*`; config harness app-server native baru sebaiknya menggunakan `openai/gpt-*` plus
`embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefix yang sama. Gunakan
`openai-codex/gpt-*` saat pemahaman gambar harus berjalan melalui jalur provider OAuth OpenAI
Codex. Gunakan `codex/gpt-*` saat pemahaman gambar harus berjalan
melalui giliran app-server Codex yang terbatas. Model app-server Codex harus
mengiklankan dukungan input gambar; model Codex khusus teks gagal sebelum giliran media
dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa rekaman terstruktur `agent harness selected` milik gateway. Rekaman ini
mencakup ID harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan,
dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

Pemilihan harness bukan kontrol sesi live. Saat sebuah giliran embedded berjalan,
OpenClaw mencatat ID harness yang dipilih pada sesi tersebut dan terus menggunakannya untuk
giliran selanjutnya dalam ID sesi yang sama. Ubah config `embeddedHarness` atau
`OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi mendatang menggunakan harness lain;
gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum mengalihkan percakapan yang sudah ada antara PI dan Codex. Ini menghindari replay satu transkrip melalui
dua sistem sesi native yang tidak kompatibel.

Sesi legacy yang dibuat sebelum pin harness diperlakukan sebagai dipin ke PI setelah mereka
memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk mengikutsertakan percakapan itu ke
Codex setelah mengubah config.

`/status` menampilkan runtime model efektif. Harness PI default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness app-server Codex muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- App-server Codex `0.118.0` atau lebih baru.
- Auth Codex tersedia untuk proses app-server.

Plugin memblokir handshake app-server yang lebih lama atau tanpa versi. Ini menjaga
OpenClaw tetap berada pada surface protokol yang telah diuji terhadapnya.

Untuk pengujian smoke live dan Docker, auth biasanya berasal dari `OPENAI_API_KEY`, ditambah
file CLI Codex opsional seperti `~/.codex/auth.json` dan
`~/.codex/config.toml`. Gunakan materi auth yang sama dengan yang digunakan app-server Codex lokal Anda.

## Config minimal

Gunakan `openai/gpt-5.5`, aktifkan Plugin bawaan, dan paksa harness `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Jika config Anda menggunakan `plugins.allow`, sertakan juga `codex` di sana:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Config legacy yang menetapkan `agents.defaults.model` atau model agen ke
`codex/<model>` tetap mengaktifkan Plugin `codex` bawaan secara otomatis. Config baru sebaiknya
memilih `openai/<model>` plus entri `embeddedHarness` eksplisit di atas.

## Tambahkan Codex bersama model lain

Jangan tetapkan `runtime: "codex"` secara global jika agen yang sama harus bebas berpindah
antara model provider Codex dan non-Codex. Runtime yang dipaksa berlaku untuk setiap
giliran embedded bagi agen atau sesi tersebut. Jika Anda memilih model Anthropic saat
runtime itu dipaksa, OpenClaw tetap mencoba harness Codex dan gagal tertutup
alih-alih diam-diam merutekan giliran itu melalui PI.

Sebagai gantinya, gunakan salah satu bentuk berikut:

- Tempatkan Codex pada agen khusus dengan `embeddedHarness.runtime: "codex"`.
- Pertahankan agen default pada `runtime: "auto"` dan fallback PI untuk penggunaan
  provider campuran normal.
- Gunakan referensi `codex/*` legacy hanya demi kompatibilitas. Config baru sebaiknya memilih
  `openai/*` plus kebijakan runtime Codex yang eksplisit.

Misalnya, ini mempertahankan agen default pada pemilihan otomatis normal dan
menambahkan agen Codex terpisah:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

Dengan bentuk ini:

- Agen `main` default menggunakan jalur provider normal dan fallback kompatibilitas PI.
- Agen `codex` menggunakan harness app-server Codex.
- Jika Codex hilang atau tidak didukung untuk agen `codex`, giliran tersebut gagal
  alih-alih diam-diam menggunakan PI.

## Deployment khusus Codex

Paksa harness Codex saat Anda perlu membuktikan bahwa setiap giliran agen embedded
menggunakan Codex. Runtime Plugin eksplisit secara default tidak memiliki fallback PI, jadi
`fallback: "none"` bersifat opsional tetapi sering berguna sebagai dokumentasi:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Override environment:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan, app-server terlalu lama, atau app-server tidak dapat dimulai. Tetapkan
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` hanya jika Anda memang ingin PI menangani
pemilihan harness yang hilang.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap mempertahankan
pemilihan otomatis normal:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Gunakan perintah sesi normal untuk berpindah agen dan model. `/new` membuat
sesi OpenClaw baru dan harness Codex membuat atau melanjutkan thread app-server sidecar
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread itu
dan membiarkan giliran berikutnya me-resolve harness dari config saat ini lagi.

## Discovery model

Secara default, Plugin Codex meminta model yang tersedia ke app-server. Jika
discovery gagal atau timeout, ia menggunakan katalog fallback bawaan untuk:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Anda dapat menyetel discovery di bawah `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Nonaktifkan discovery saat Anda ingin startup menghindari probing Codex dan tetap menggunakan
katalog fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Koneksi app-server dan kebijakan

Secara default, Plugin memulai Codex secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk Heartbeat otonom: Codex dapat menggunakan tool shell dan jaringan tanpa
berhenti pada prompt approval native yang tidak ada orang untuk menjawabnya.

Untuk memilih approval dengan peninjauan Guardian milik Codex, tetapkan `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Mode Guardian menggunakan jalur approval auto-review native milik Codex. Saat Codex meminta untuk
keluar dari sandbox, menulis di luar workspace, atau menambahkan izin seperti akses jaringan,
Codex merutekan permintaan approval tersebut ke reviewer native alih-alih prompt manusia. Reviewer menerapkan kerangka risiko Codex dan menyetujui atau menolak
permintaan spesifik tersebut. Gunakan Guardian saat Anda menginginkan guardrail lebih banyak daripada mode YOLO tetapi tetap membutuhkan agen tanpa pengawasan untuk terus membuat kemajuan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap mengoverride `mode`, jadi deployment lanjutan dapat mencampur
preset dengan pilihan eksplisit. Nilai reviewer lama `guardian_subagent`
masih diterima sebagai alias kompatibilitas, tetapi config baru sebaiknya menggunakan
`auto_review`.

Untuk app-server yang sudah berjalan, gunakan transport WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Field `appServer` yang didukung:

| Field               | Default                                  | Arti                                                                                                        |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` memunculkan Codex; `"websocket"` terhubung ke `url`.                                              |
| `command`           | `"codex"`                                | Executable untuk transport stdio.                                                                           |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                              |
| `url`               | unset                                    | URL app-server WebSocket.                                                                                   |
| `authToken`         | unset                                    | Token bearer untuk transport WebSocket.                                                                     |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                  |
| `requestTimeoutMs`  | `60000`                                  | Batas waktu untuk pemanggilan control-plane app-server.                                                     |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau dengan review Guardian.                                                     |
| `approvalPolicy`    | `"never"`                                | Kebijakan approval Codex native yang dikirim ke start/resume/turn thread.                                   |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex native yang dikirim ke start/resume thread.                                              |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt approval native. `guardian_subagent` tetap menjadi alias legacy. |
| `serviceTier`       | unset                                    | Tingkat layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai legacy tidak valid diabaikan. |

Environment variable lama masih berfungsi sebagai fallback untuk pengujian lokal saat
field config yang cocok tidak ditetapkan:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal satu kali. Config lebih
disukai untuk deployment yang dapat diulang karena menjaga perilaku Plugin tetap berada di
file yang sama dan telah ditinjau bersama sisa penyiapan harness Codex.

## Recipe umum

Codex lokal dengan transport stdio default:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validasi harness khusus Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approval Codex dengan review Guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remote dengan header eksplisit:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Peralihan model tetap dikontrol oleh OpenClaw. Saat sebuah sesi OpenClaw terhubung
ke thread Codex yang sudah ada, giliran berikutnya mengirim model
OpenAI yang saat ini dipilih, provider, kebijakan approval, sandbox, dan tingkat layanan ke
app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex untuk melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bawaan mendaftarkan `/codex` sebagai slash command yang berotorisasi. Ini
bersifat generik dan bekerja di channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server live, model, akun, rate limit, server MCP, dan Skills.
- `/codex models` menampilkan model app-server Codex live.
- `/codex threads [filter]` menampilkan thread Codex terbaru.
- `/codex resume <thread-id>` menghubungkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex untuk melakukan Compaction pada thread yang terhubung.
- `/codex review` memulai review native Codex untuk thread yang terhubung.
- `/codex account` menampilkan status akun dan rate-limit.
- `/codex mcp` menampilkan status server MCP app-server Codex.
- `/codex skills` menampilkan Skills app-server Codex.

`/codex resume` menulis file binding sidecar yang sama dengan yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan model OpenClaw yang saat ini dipilih ke app-server, dan mempertahankan
riwayat lanjutan tetap aktif.

Surface perintah ini memerlukan app-server Codex `0.118.0` atau lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
app-server masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin lintas harness PI dan Codex.           |
| Middleware extension app-server Codex | Plugin bawaan OpenClaw   | Perilaku adapter per giliran di sekitar tool dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan tool native dari config Codex. |

OpenClaw tidak menggunakan file `hooks.json` Codex tingkat proyek atau global untuk merutekan
perilaku Plugin OpenClaw. Untuk bridge tool dan izin native yang didukung,
OpenClaw menyuntikkan config Codex per thread untuk `PreToolUse`, `PostToolUse`, dan
`PermissionRequest`. Hook Codex lain seperti `SessionStart`,
`UserPromptSubmit`, dan `Stop` tetap merupakan kontrol tingkat Codex; hook tersebut tidak diekspos
sebagai hook Plugin OpenClaw dalam kontrak v1.

Untuk tool dinamis OpenClaw, OpenClaw mengeksekusi tool setelah Codex meminta
pemanggilan tersebut, sehingga OpenClaw memicu perilaku Plugin dan middleware yang dimilikinya di
adapter harness. Untuk tool native Codex, Codex memiliki rekaman tool kanonis.
OpenClaw dapat mem-mirror event tertentu, tetapi tidak dapat menulis ulang thread Codex native
kecuali Codex mengekspos operasi tersebut melalui app-server atau callback hook native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi app-server Codex
dan state adapter OpenClaw, bukan perintah hook Codex native.
Event `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` milik OpenClaw adalah observasi tingkat adapter, bukan tangkapan byte-per-byte
atas permintaan internal Codex atau payload Compaction.

Notifikasi app-server native Codex `hook/started` dan `hook/completed` diproyeksikan
sebagai event agen `codex_app_server.hook` untuk trajectory dan debugging.
Event tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukanlah PI dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak bagian
dari loop model native, dan OpenClaw menyesuaikan surface Plugin dan sesi
di sekitar batas tersebut.

Didukung dalam runtime Codex v1:

| Surface                                 | Dukungan                                 | Mengapa                                                                                                                                     |
| --------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex         | Didukung                                 | App-server Codex memiliki giliran OpenAI, resume thread native, dan kelanjutan tool native.                                                |
| Perutean dan pengiriman channel OpenClaw | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan channel lain tetap berada di luar runtime model.                                        |
| Tool dinamis OpenClaw                   | Didukung                                 | Codex meminta OpenClaw mengeksekusi tool ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                            |
| Plugin prompt dan context               | Didukung                                 | OpenClaw membangun overlay prompt dan memproyeksikan context ke giliran Codex sebelum memulai atau melanjutkan thread.                    |
| Siklus hidup mesin context              | Didukung                                 | Assemble, ingest atau pemeliharaan setelah giliran, dan koordinasi Compaction mesin context berjalan untuk giliran Codex.                 |
| Hook tool dinamis                       | Didukung                                 | `before_tool_call`, `after_tool_call`, dan middleware hasil tool berjalan di sekitar tool dinamis milik OpenClaw.                          |
| Hook siklus hidup                       | Didukung sebagai observasi adapter       | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` aktif dengan payload mode Codex yang jujur.           |
| Blokir atau observasi shell dan patch native | Didukung melalui relay hook native   | `PreToolUse` dan `PostToolUse` Codex di-relay untuk surface tool native yang sudah dikomit. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                   | Didukung melalui relay hook native       | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw saat runtime mengeksposnya.                                           |
| Penangkapan trajectory app-server       | Didukung                                 | OpenClaw merekam permintaan yang dikirim ke app-server dan notifikasi app-server yang diterimanya.                                         |

Tidak didukung dalam runtime Codex v1:

| Surface                                             | Batas V1                                                                                                                                         | Jalur masa depan                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Mutasi argumen tool native                          | Hook pre-tool native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen tool native Codex.                                      | Memerlukan dukungan hook/schema Codex untuk penggantian input tool.                                        |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki mirror dan dapat memproyeksikan context masa depan, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika operasi thread native diperlukan.                            |
| `tool_result_persist` untuk rekaman tool native Codex | Hook itu mentransformasi penulisan transkrip milik OpenClaw, bukan rekaman tool native Codex.                                                 | Dapat mem-mirror rekaman yang telah ditransformasi, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata Compaction native yang kaya                | OpenClaw mengamati awal dan akhir Compaction, tetapi tidak menerima daftar tetap yang dipertahankan/dibuang, delta token, atau payload ringkasan. | Memerlukan event Compaction Codex yang lebih kaya.                                                         |
| Intervensi Compaction                               | Hook Compaction OpenClaw saat ini berada pada level notifikasi dalam mode Codex.                                                                | Tambahkan hook pre/post Compaction Codex jika Plugin perlu memveto atau menulis ulang Compaction native.  |
| Stop atau gating jawaban final                      | Codex memiliki hook stop native, tetapi OpenClaw tidak mengekspos gating jawaban final sebagai kontrak Plugin v1.                               | Primitive opt-in di masa depan dengan pengaman loop dan timeout.                                           |
| Paritas hook MCP native sebagai surface v1 yang dikomit | Relay bersifat generik, tetapi OpenClaw belum memberi version-gate dan menguji perilaku hook pre/post MCP native secara end to end.         | Tambahkan pengujian dan dokumentasi relay MCP OpenClaw setelah batas bawah protokol app-server yang didukung mencakup payload tersebut. |
| Penangkapan permintaan API model byte-per-byte      | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi inti Codex membangun permintaan API OpenAI final secara internal.         | Memerlukan event pelacakan model-request Codex atau API debug.                                             |

## Tool, media, dan Compaction

Harness Codex hanya mengubah eksekutor agen embedded tingkat rendah.

OpenClaw tetap membangun daftar tool dan menerima hasil tool dinamis dari
harness. Teks, gambar, video, musik, TTS, approval, dan output tool pesan
tetap melalui jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1 terbatas
pada jalur tool dan izin native Codex yang diuji oleh OpenClaw. Jangan
mengasumsikan setiap event hook Codex di masa depan adalah surface Plugin OpenClaw sampai
kontrak runtime menamainya.

Elicitation approval tool MCP Codex dirutekan melalui alur approval Plugin
OpenClaw saat Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke
chat asal, dan pesan tindak lanjut berikutnya yang masuk antrean menjawab
permintaan server native tersebut alih-alih diarahkan sebagai context tambahan. Permintaan
elicitation MCP lainnya tetap gagal tertutup.

Saat model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke app-server Codex. OpenClaw mempertahankan mirror transkrip untuk history channel,
pencarian, `/new`, `/reset`, dan perpindahan model atau harness di masa mendatang. Mirror ini
mencakup prompt pengguna, teks asisten final, dan rekaman reasoning atau rencana Codex ringan saat app-server mengeluarkannya. Saat ini, OpenClaw hanya
mencatat sinyal awal dan akhir Compaction native. OpenClaw belum mengekspos ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat diaudit tentang entri mana yang dipertahankan Codex setelah Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak
menulis ulang rekaman hasil tool native Codex. Hook ini hanya berlaku saat
OpenClaw menulis hasil tool transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan pemahaman
media tetap menggunakan pengaturan provider/model yang cocok seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai provider `/model` normal:** itu memang diharapkan untuk
config baru. Pilih model `openai/gpt-*` dengan
`embeddedHarness.runtime: "codex"` (atau referensi `codex/*` legacy), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `runtime: "auto"` tetap dapat menggunakan PI sebagai
backend kompatibilitas saat tidak ada harness Codex yang mengklaim run. Tetapkan
`embeddedHarness.runtime: "codex"` untuk memaksa pemilihan Codex selama pengujian. Runtime
Codex yang dipaksa kini gagal alih-alih fallback ke PI kecuali Anda
secara eksplisit menetapkan `embeddedHarness.fallback: "pi"`. Setelah app-server Codex
dipilih, kegagalannya muncul secara langsung tanpa config fallback tambahan.

**App-server ditolak:** upgrade Codex agar handshake app-server
melaporkan versi `0.118.0` atau lebih baru.

**Discovery model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan discovery.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa app-server remote berbicara dengan versi protokol app-server Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan kecuali Anda memaksa
`embeddedHarness.runtime: "codex"` untuk agen tersebut atau memilih referensi
`codex/*` legacy. Referensi biasa `openai/gpt-*` dan provider lain tetap berada di jalur
provider normalnya dalam mode `auto`. Jika Anda memaksa `runtime: "codex"`, setiap giliran embedded
untuk agen tersebut harus merupakan model OpenAI yang didukung Codex.

## Terkait

- [Agent harness plugins](/id/plugins/sdk-agent-harness)
- [Agent runtimes](/id/concepts/agent-runtimes)
- [Model providers](/id/concepts/model-providers)
- [OpenAI provider](/id/providers/openai)
- [Status](/id/cli/status)
- [Plugin hooks](/id/plugins/hooks)
- [Configuration reference](/id/gateway/configuration-reference)
- [Testing](/id/help/testing-live#live-codex-app-server-harness-smoke)
