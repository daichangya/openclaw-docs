---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan referensi model Codex dan contoh config
    - Anda ingin menonaktifkan fallback PI untuk deployment khusus Codex
summary: Jalankan giliran agent embedded OpenClaw melalui harness app-server Codex bawaan
title: Harness Codex
x-i18n:
    generated_at: "2026-04-21T09:20:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agent embedded melalui
app-server Codex alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agent level rendah: penemuan
model, resume thread native, Compaction native, dan eksekusi app-server.
OpenClaw tetap memiliki channel chat, file sesi, pemilihan model, tool,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Harness ini nonaktif secara default. Harness ini dipilih hanya saat plugin `codex`
diaktifkan dan model yang diselesaikan adalah model `codex/*`, atau saat Anda secara eksplisit
memaksa `embeddedHarness.runtime: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.
Jika Anda tidak pernah mengonfigurasi `codex/*`, run PI, OpenAI, Anthropic, Gemini, local,
dan custom-provider yang ada tetap mempertahankan perilaku saat ini.

## Pilih prefiks model yang tepat

OpenClaw memiliki rute terpisah untuk akses berbentuk OpenAI dan Codex:

| Referensi model       | Jalur runtime                                | Gunakan saat                                                              |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Provider OpenAI melalui plumbing OpenClaw/PI | Anda ingin akses API OpenAI Platform langsung dengan `OPENAI_API_KEY`.    |
| `openai-codex/gpt-5.4` | Provider OAuth OpenAI Codex melalui PI      | Anda ingin OAuth ChatGPT/Codex tanpa harness app-server Codex.            |
| `codex/gpt-5.4`       | Provider Codex bawaan plus harness Codex     | Anda ingin eksekusi app-server Codex native untuk giliran agent embedded. |

Harness Codex hanya mengambil referensi model `codex/*`. Referensi `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local, dan custom provider yang ada tetap
menggunakan jalur normalnya.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- App-server Codex `0.118.0` atau yang lebih baru.
- Auth Codex tersedia untuk proses app-server.

Plugin ini memblokir handshake app-server yang lebih lama atau tanpa versi. Itu menjaga
OpenClaw tetap pada surface protokol yang sudah diuji.

Untuk smoke test live dan Docker, auth biasanya berasal dari `OPENAI_API_KEY`, ditambah
file CLI Codex opsional seperti `~/.codex/auth.json` dan
`~/.codex/config.toml`. Gunakan materi auth yang sama seperti yang digunakan app-server Codex lokal Anda.

## Config minimal

Gunakan `codex/gpt-5.4`, aktifkan plugin bawaan, dan paksa harness `codex`:

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

Jika config Anda menggunakan `plugins.allow`, sertakan `codex` di sana juga:

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

Menyetel `agents.defaults.model` atau model agent ke `codex/<model>` juga
mengaktifkan otomatis plugin `codex` bawaan. Entri plugin eksplisit tetap
berguna dalam config bersama karena membuat niat deployment menjadi jelas.

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

Dengan fallback dinonaktifkan, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
model yang diminta bukan referensi `codex/*`, app-server terlalu lama, atau
app-server tidak dapat dimulai.

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

Gunakan perintah sesi normal untuk mengganti agent dan model. `/new` membuat
sesi OpenClaw baru dan harness Codex membuat atau me-resume thread sidecar app-server
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut.

## Penemuan model

Secara default, plugin Codex meminta model yang tersedia dari app-server. Jika
penemuan gagal atau timeout, plugin ini menggunakan katalog fallback bawaan:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Anda dapat menyesuaikan penemuan di bawah `plugins.entries.codex.config.discovery`:

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

Nonaktifkan penemuan saat Anda ingin startup menghindari probing Codex dan tetap pada
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

Secara default, plugin memulai Codex secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Secara default, OpenClaw meminta Codex untuk meminta persetujuan native. Anda dapat menyesuaikan
kebijakan itu lebih lanjut, misalnya dengan memperketatnya dan merutekan review melalui
guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| Field               | Default                                  | Arti                                                                    |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` memunculkan Codex; `"websocket"` terhubung ke `url`.          |
| `command`           | `"codex"`                                | Executable untuk transport stdio.                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                          |
| `url`               | unset                                    | URL app-server WebSocket.                                               |
| `authToken`         | unset                                    | Token Bearer untuk transport WebSocket.                                 |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                              |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                       |
| `approvalPolicy`    | `"on-request"`                           | Kebijakan persetujuan Codex native yang dikirim ke start/resume/turn thread. |
| `sandbox`           | `"workspace-write"`                      | Mode sandbox Codex native yang dikirim ke start/resume thread.          |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"guardian_subagent"` agar guardian Codex meninjau persetujuan native. |
| `serviceTier`       | unset                                    | Tingkat layanan Codex opsional, misalnya `"priority"`.                  |

Environment variable lama masih berfungsi sebagai fallback untuk pengujian lokal saat
field config yang cocok tidak disetel:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Config lebih dipilih untuk deployment yang dapat diulang.

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

Persetujuan Codex yang ditinjau guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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

Peralihan model tetap dikendalikan oleh OpenClaw. Saat sesi OpenClaw terpasang
ke thread Codex yang sudah ada, giliran berikutnya mengirim model `codex/*`,
provider, kebijakan persetujuan, sandbox, dan service tier yang saat ini dipilih ke
app-server lagi. Beralih dari `codex/gpt-5.4` ke `codex/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bawaan mendaftarkan `/codex` sebagai perintah slash yang diotorisasi. Perintah ini
generik dan berfungsi di channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server live, model, akun, rate limit, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex live.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` memasang sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex untuk melakukan Compaction pada thread yang terpasang.
- `/codex review` memulai review native Codex untuk thread yang terpasang.
- `/codex account` menampilkan akun dan status rate limit.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

`/codex resume` menulis file binding sidecar yang sama yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw me-resume thread Codex tersebut, meneruskan
model OpenClaw `codex/*` yang sedang dipilih ke app-server, dan tetap mengaktifkan
riwayat yang diperluas.

Surface perintah ini memerlukan app-server Codex `0.118.0` atau yang lebih baru. Metode kontrol individual
dilaporkan sebagai `unsupported by this Codex app-server` jika
app-server masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Tools, media, dan Compaction

Harness Codex hanya mengubah eksekutor agent embedded tingkat rendah.

OpenClaw tetap membangun daftar tool dan menerima hasil tool dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output messaging-tool
tetap melalui jalur pengiriman OpenClaw normal.

Saat model yang dipilih menggunakan harness Codex, Compaction thread native didelegasikan
ke app-server Codex. OpenClaw mempertahankan cermin transkrip untuk riwayat channel,
pencarian, `/new`, `/reset`, dan peralihan model atau harness di masa depan. Cermin ini
mencakup prompt pengguna, teks asisten final, dan catatan reasoning atau plan Codex yang ringan saat app-server mengeluarkannya.

Generasi media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan provider/model yang cocok seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul di `/model`:** aktifkan `plugins.entries.codex.enabled`,
setel referensi model `codex/*`, atau periksa apakah `plugins.allow` mengecualikan `codex`.

**OpenClaw fallback ke PI:** setel `embeddedHarness.fallback: "none"` atau
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` saat pengujian.

**App-server ditolak:** upgrade Codex agar handshake app-server
melaporkan versi `0.118.0` atau yang lebih baru.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa app-server remote berbicara dengan versi protokol app-server Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan. Harness Codex hanya mengambil
referensi model `codex/*`.

## Terkait

- [Agent Harness Plugins](/id/plugins/sdk-agent-harness)
- [Model Providers](/id/concepts/model-providers)
- [Configuration Reference](/id/gateway/configuration-reference)
- [Testing](/id/help/testing#live-codex-app-server-harness-smoke)
