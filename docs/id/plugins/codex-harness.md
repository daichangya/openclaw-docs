---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan referensi model Codex dan contoh konfigurasi
    - Anda ingin menonaktifkan fallback PI untuk deployment khusus Codex
summary: Jalankan giliran agent embedded OpenClaw melalui harness app-server Codex bawaan
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T09:23:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agent embedded melalui
app-server Codex alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agent level rendah: discovery
model, resume thread native, Compaction native, dan eksekusi app-server.
OpenClaw tetap memiliki channel chat, file sesi, pemilihan model, tools,
persetujuan, pengiriman media, dan mirror transkrip yang terlihat.

Giliran Codex native juga menghormati hook Plugin bersama sehingga shim prompt,
automasi yang sadar-Compaction, middleware tool, dan observer lifecycle tetap
selaras dengan harness PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Plugin bawaan juga dapat mendaftarkan factory ekstensi app-server Codex untuk menambahkan
middleware `tool_result` async.

Harness ini nonaktif secara default. Harness ini dipilih hanya saat Plugin `codex`
diaktifkan dan model yang di-resolve adalah model `codex/*`, atau saat Anda secara eksplisit
memaksa `embeddedHarness.runtime: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.
Jika Anda tidak pernah mengonfigurasi `codex/*`, run PI, OpenAI, Anthropic, Gemini, local,
dan provider kustom yang ada tetap mempertahankan perilaku saat ini.

## Pilih prefiks model yang tepat

OpenClaw memiliki rute terpisah untuk akses berbentuk OpenAI dan Codex:

| Model ref              | Runtime path                                 | Gunakan saat                                                                |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`       | Provider OpenAI melalui plumbing OpenClaw/PI | Anda ingin akses API OpenAI Platform langsung dengan `OPENAI_API_KEY`.      |
| `openai-codex/gpt-5.4` | Provider OAuth OpenAI Codex melalui PI       | Anda ingin OAuth ChatGPT/Codex tanpa harness app-server Codex.              |
| `codex/gpt-5.4`        | Provider Codex bawaan plus harness Codex     | Anda ingin eksekusi app-server Codex native untuk giliran agent embedded.   |

Harness Codex hanya mengambil alih model ref `codex/*`. `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local, dan ref provider kustom yang ada tetap
berada di jalur normalnya.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- App-server Codex `0.118.0` atau lebih baru.
- Auth Codex tersedia untuk proses app-server.

Plugin memblokir handshake app-server yang lebih lama atau tanpa versi. Itu menjaga
OpenClaw tetap berada pada permukaan protokol yang telah diuji.

Untuk smoke test live dan Docker, auth biasanya berasal dari `OPENAI_API_KEY`, ditambah
file CLI Codex opsional seperti `~/.codex/auth.json` dan
`~/.codex/config.toml`. Gunakan materi auth yang sama seperti yang digunakan app-server Codex lokal Anda.

## Konfigurasi minimal

Gunakan `codex/gpt-5.4`, aktifkan Plugin bawaan, dan paksa harness `codex`:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan `codex` di sana juga:

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

Menetapkan `agents.defaults.model` atau model agent menjadi `codex/<model>` juga
secara otomatis mengaktifkan Plugin `codex` bawaan. Entri Plugin eksplisit tetap
berguna dalam konfigurasi bersama karena membuat maksud deployment menjadi jelas.

## Tambahkan Codex tanpa mengganti model lain

Pertahankan `runtime: "auto"` saat Anda ingin Codex untuk model `codex/*` dan PI untuk
semua yang lain:

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
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Dengan bentuk ini:

- `/model codex` atau `/model codex/gpt-5.4` menggunakan harness app-server Codex.
- `/model gpt` atau `/model openai/gpt-5.4` menggunakan jalur provider OpenAI.
- `/model opus` menggunakan jalur provider Anthropic.
- Jika model non-Codex dipilih, PI tetap menjadi harness kompatibilitas.

## Deployment khusus Codex

Nonaktifkan fallback PI saat Anda perlu membuktikan bahwa setiap giliran agent embedded menggunakan
harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
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
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Dengan fallback dinonaktifkan, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan,
model yang diminta bukan ref `codex/*`, app-server terlalu lama, atau
app-server tidak dapat dijalankan.

## Codex per-agent

Anda dapat membuat satu agent khusus Codex sementara agent default tetap menggunakan
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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Gunakan perintah sesi normal untuk beralih agent dan model. `/new` membuat
sesi OpenClaw baru dan harness Codex membuat atau me-resume thread sidecar app-server
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut.

## Discovery model

Secara default, Plugin Codex meminta model yang tersedia kepada app-server. Jika
discovery gagal atau timeout, Plugin menggunakan katalog fallback bawaan:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Anda dapat menyesuaikan discovery di bawah `plugins.entries.codex.config.discovery`:

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

## Koneksi dan kebijakan app-server

Secara default, Plugin memulai Codex secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk Heartbeat otonom: Codex dapat menggunakan shell dan tool jaringan tanpa
berhenti pada prompt persetujuan native yang tidak ada orang untuk menjawabnya.

Untuk ikut serta dalam persetujuan yang ditinjau Guardian Codex, setel `appServer.mode:
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

Mode Guardian diperluas menjadi:

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Guardian adalah peninjau persetujuan Codex native. Saat Codex meminta untuk keluar dari
sandbox, menulis di luar workspace, atau menambahkan izin seperti akses jaringan,
Codex merutekan permintaan persetujuan tersebut ke subagent peninjau alih-alih prompt manusia.
Peninjau mengumpulkan konteks dan menerapkan kerangka risiko Codex, lalu
menyetujui atau menolak permintaan tertentu tersebut. Guardian berguna saat Anda menginginkan guardrail yang lebih kuat daripada mode YOLO tetapi tetap membutuhkan agent dan Heartbeat tanpa pengawasan untuk
terus berjalan.

Harness live Docker menyertakan probe Guardian saat
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Probe ini memulai harness Codex dalam
mode Guardian, memverifikasi bahwa command shell yang benign dan dielevasi disetujui, dan
memverifikasi bahwa unggahan secret palsu ke tujuan eksternal yang tidak tepercaya ditolak
sehingga agent meminta persetujuan eksplisit kembali.

Field kebijakan individual tetap lebih diutamakan daripada `mode`, sehingga deployment lanjutan dapat
mencampur preset dengan pilihan eksplisit.

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

| Field               | Default                                  | Meaning                                                                                                   |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                            |
| `command`           | `"codex"`                                | Executable untuk transport stdio.                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                            |
| `url`               | unset                                    | URL app-server WebSocket.                                                                                 |
| `authToken`         | unset                                    | Token Bearer untuk transport WebSocket.                                                                   |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                         |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau Guardian.                                                   |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan Codex native yang dikirim ke start/resume/turn thread.                              |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex native yang dikirim ke start/resume thread.                                            |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"guardian_subagent"` agar Codex Guardian meninjau prompt.                                        |
| `serviceTier`       | unset                                    | Tingkat layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai legacy yang tidak valid diabaikan. |

Variabel environment lama tetap berfungsi sebagai fallback untuk pengujian lokal saat
field konfigurasi yang sesuai tidak disetel:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Konfigurasi lebih
disarankan untuk deployment yang dapat diulang karena perilaku plugin tetap berada
dalam file yang sama yang telah ditinjau bersama penyiapan harness Codex lainnya.

## Resep umum

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

Validasi harness khusus Codex, dengan fallback PI dinonaktifkan:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

Persetujuan Codex yang ditinjau Guardian:

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
            approvalsReviewer: "guardian_subagent",
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

Peralihan model tetap dikendalikan OpenClaw. Saat sesi OpenClaw dilampirkan
ke thread Codex yang sudah ada, giliran berikutnya mengirim
model, provider, kebijakan persetujuan, sandbox, dan service tier `codex/*` yang sedang dipilih ke
app-server lagi. Beralih dari `codex/gpt-5.4` ke `codex/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex untuk melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bawaan mendaftarkan `/codex` sebagai slash command yang diizinkan. Perintah ini
bersifat generik dan berfungsi di channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server live, model, akun, rate limit, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex live.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex untuk melakukan Compaction pada thread yang dilampirkan.
- `/codex review` memulai review Codex native untuk thread yang dilampirkan.
- `/codex account` menampilkan status akun dan rate limit.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

`/codex resume` menulis file binding sidecar yang sama yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw me-resume thread Codex tersebut, meneruskan
model `codex/*` OpenClaw yang saat ini dipilih ke app-server, dan tetap mengaktifkan
riwayat yang diperluas.

Permukaan perintah ini memerlukan app-server Codex `0.118.0` atau lebih baru. Metode
kontrol individual akan dilaporkan sebagai `unsupported by this Codex app-server` jika
app-server masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Tools, media, dan Compaction

Harness Codex hanya mengubah executor agent embedded level rendah.

OpenClaw tetap membangun daftar tool dan menerima hasil tool dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output tool pesan
tetap melalui jalur pengiriman OpenClaw normal.

Permintaan persetujuan tool MCP Codex dirutekan melalui alur persetujuan plugin OpenClaw
saat Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`; permintaan input lainnya dan permintaan input bentuk bebas tetap gagal secara tertutup.

Saat model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke app-server Codex. OpenClaw tetap menyimpan mirror transkrip untuk riwayat channel,
pencarian, `/new`, `/reset`, dan peralihan model atau harness di masa mendatang. Mirror ini
mencakup prompt pengguna, teks assistant final, serta catatan reasoning atau rencana Codex
yang ringan saat app-server mengeluarkannya. Saat ini, OpenClaw hanya
mencatat sinyal mulai dan selesai Compaction native. OpenClaw belum mengekspos
ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat diaudit tentang entri mana yang dipertahankan Codex setelah Compaction.

Generasi media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan pemahaman
media tetap menggunakan pengaturan provider/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul di `/model`:** aktifkan `plugins.entries.codex.enabled`,
setel model ref `codex/*`, atau periksa apakah `plugins.allow` mengecualikan `codex`.

**OpenClaw menggunakan PI alih-alih Codex:** jika tidak ada harness Codex yang mengambil alih run,
OpenClaw mungkin menggunakan PI sebagai backend kompatibilitas. Setel
`embeddedHarness.runtime: "codex"` untuk memaksa pemilihan Codex saat pengujian, atau
`embeddedHarness.fallback: "none"` agar gagal saat tidak ada harness plugin yang cocok. Setelah
app-server Codex dipilih, kegagalannya akan langsung muncul tanpa konfigurasi fallback tambahan.

**App-server ditolak:** upgrade Codex agar handshake app-server
melaporkan versi `0.118.0` atau lebih baru.

**Discovery model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan discovery.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan pastikan app-server remote menggunakan versi protokol app-server Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan. Harness Codex hanya mengambil alih
model ref `codex/*`.

## Terkait

- [Plugin Harness Agent](/id/plugins/sdk-agent-harness)
- [Provider Model](/id/concepts/model-providers)
- [Referensi Konfigurasi](/id/gateway/configuration-reference)
- [Testing](/id/help/testing#live-codex-app-server-harness-smoke)
