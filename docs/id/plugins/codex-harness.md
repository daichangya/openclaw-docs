---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan referensi model Codex dan contoh konfigurasi
    - Anda ingin menonaktifkan fallback PI untuk deployment khusus Codex
summary: Jalankan giliran agen tersemat OpenClaw melalui harness app-server Codex bawaan
title: Harness Codex
x-i18n:
    generated_at: "2026-04-22T09:14:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19bc7481bf7cdce983efe70e697f8665ace875d96f126979b95dd3f2f739fa8a
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tersemat melalui app-server Codex alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki kendali atas sesi agen tingkat rendah: penemuan model, pelanjutan thread native, Compaction native, dan eksekusi app-server.
OpenClaw tetap memiliki kendali atas kanal chat, file sesi, pemilihan model, tool,
persetujuan, pengiriman media, dan cerminan transkrip yang terlihat.

Harness ini nonaktif secara default. Harness ini dipilih hanya saat plugin `codex`
diaktifkan dan model hasil resolusi adalah model `codex/*`, atau saat Anda secara eksplisit
memaksa `embeddedHarness.runtime: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.
Jika Anda tidak pernah mengonfigurasi `codex/*`, proses PI, OpenAI, Anthropic, Gemini, local,
dan custom-provider yang ada akan tetap mempertahankan perilaku saat ini.

## Pilih prefiks model yang tepat

OpenClaw memiliki rute terpisah untuk akses berbentuk OpenAI dan Codex:

| Ref model              | Jalur runtime                                | Gunakan saat                                                              |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`       | Provider OpenAI melalui alur OpenClaw/PI     | Anda ingin akses API OpenAI Platform langsung dengan `OPENAI_API_KEY`.    |
| `openai-codex/gpt-5.4` | Provider OpenAI Codex OAuth melalui PI       | Anda ingin ChatGPT/Codex OAuth tanpa harness app-server Codex.            |
| `codex/gpt-5.4`        | Provider Codex bawaan plus harness Codex     | Anda ingin eksekusi app-server Codex native untuk giliran agen tersemat.  |

Harness Codex hanya menangani ref model `codex/*`. Ref `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local, dan custom provider yang ada tetap
menggunakan jalur normalnya.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- App-server Codex `0.118.0` atau yang lebih baru.
- Autentikasi Codex tersedia untuk proses app-server.

Plugin ini memblokir handshake app-server yang lebih lama atau tanpa versi. Ini menjaga
OpenClaw tetap berada pada permukaan protokol yang sudah diuji.

Untuk smoke test live dan Docker, autentikasi biasanya berasal dari `OPENAI_API_KEY`, ditambah
file CLI Codex opsional seperti `~/.codex/auth.json` dan
`~/.codex/config.toml`. Gunakan materi autentikasi yang sama dengan yang digunakan app-server Codex lokal Anda.

## Konfigurasi minimal

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

Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan juga `codex` di sana:

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

Menyetel `agents.defaults.model` atau model agen ke `codex/<model>` juga
akan otomatis mengaktifkan plugin `codex` bawaan. Entri plugin eksplisit tetap
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

Nonaktifkan fallback PI saat Anda perlu membuktikan bahwa setiap giliran agen tersemat menggunakan
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

Override lingkungan:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Dengan fallback dinonaktifkan, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
model yang diminta bukan ref `codex/*`, app-server terlalu lama, atau
app-server tidak dapat dimulai.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap menggunakan
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

Gunakan perintah sesi normal untuk berpindah agen dan model. `/new` membuat sesi
OpenClaw baru dan harness Codex membuat atau melanjutkan thread sidecar app-server
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut.

## Penemuan model

Secara default, plugin Codex meminta model yang tersedia ke app-server. Jika
penemuan gagal atau habis waktu, plugin ini menggunakan katalog fallback bawaan:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Anda dapat menyetel penemuan di bawah `plugins.entries.codex.config.discovery`:

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

Nonaktifkan penemuan saat Anda ingin startup menghindari probing Codex dan tetap menggunakan
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

Secara default, OpenClaw memulai sesi harness Codex lokal sepenuhnya tanpa batas:
`approvalPolicy: "never"` dan `sandbox: "danger-full-access"`. Ini sesuai dengan
postur operator lokal tepercaya yang digunakan oleh CLI Codex dan memungkinkan
Heartbeat otonom menggunakan tool jaringan dan shell tanpa menunggu jalur
persetujuan native tak terlihat. Anda dapat memperketat kebijakan tersebut, misalnya
dengan merutekan peninjauan melalui guardian:

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
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.          |
| `command`           | `"codex"`                                | Executable untuk transport stdio.                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                          |
| `url`               | unset                                    | URL app-server WebSocket.                                               |
| `authToken`         | unset                                    | Token bearer untuk transport WebSocket.                                 |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                              |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                       |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan Codex native yang dikirim ke start/resume/turn thread. |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex native yang dikirim ke start/resume thread.          |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"guardian_subagent"` agar guardian Codex meninjau persetujuan native. |
| `serviceTier`       | unset                                    | Tingkat layanan Codex opsional, misalnya `"priority"`.                  |

Variabel lingkungan lama masih berfungsi sebagai fallback untuk pengujian lokal saat
field konfigurasi yang sesuai tidak disetel:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Konfigurasi lebih disarankan untuk deployment yang dapat diulang.

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

App-server jarak jauh dengan header eksplisit:

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
ke thread Codex yang sudah ada, giliran berikutnya mengirim model
`codex/*`, provider, kebijakan persetujuan, sandbox, dan tingkat layanan yang saat ini dipilih ke
app-server lagi. Beralih dari `codex/gpt-5.4` ke `codex/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex untuk melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bawaan mendaftarkan `/codex` sebagai slash command yang diotorisasi. Perintah ini
bersifat generik dan berfungsi di kanal apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server live, model, akun, rate limit, server MCP, dan Skills.
- `/codex models` menampilkan daftar model app-server Codex live.
- `/codex threads [filter]` menampilkan daftar thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex untuk melakukan Compaction pada thread yang terlampir.
- `/codex review` memulai peninjauan native Codex untuk thread yang terlampir.
- `/codex account` menampilkan status akun dan rate limit.
- `/codex mcp` menampilkan daftar status server MCP app-server Codex.
- `/codex skills` menampilkan daftar Skills app-server Codex.

`/codex resume` menulis file binding sidecar yang sama seperti yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan model OpenClaw `codex/*` yang saat ini dipilih ke app-server, dan tetap mengaktifkan
riwayat yang diperluas.

Permukaan perintah ini memerlukan app-server Codex `0.118.0` atau yang lebih baru. Metode kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
app-server versi masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Tool, media, dan Compaction

Harness Codex hanya mengubah eksekutor agen tersemat tingkat rendah.

OpenClaw tetap membangun daftar tool dan menerima hasil tool dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output tool perpesanan
tetap melalui jalur pengiriman OpenClaw normal.

Saat model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke app-server Codex. OpenClaw tetap menyimpan cerminan transkrip untuk
riwayat kanal, pencarian, `/new`, `/reset`, dan peralihan model atau harness di masa depan. Cerminan tersebut
mencakup prompt pengguna, teks asisten akhir, dan catatan penalaran atau rencana Codex yang ringan ketika app-server mengeluarkannya.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan provider/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul di `/model`:** aktifkan `plugins.entries.codex.enabled`,
setel ref model `codex/*`, atau periksa apakah `plugins.allow` mengecualikan `codex`.

**OpenClaw menggunakan PI alih-alih Codex:** jika tidak ada harness Codex yang menangani proses ini,
OpenClaw dapat menggunakan PI sebagai backend kompatibilitas. Setel
`embeddedHarness.runtime: "codex"` untuk memaksa pemilihan Codex saat pengujian, atau
`embeddedHarness.fallback: "none"` agar gagal saat tidak ada harness plugin yang cocok. Setelah
app-server Codex dipilih, kegagalannya akan muncul langsung tanpa
konfigurasi fallback tambahan.

**App-server ditolak:** upgrade Codex agar handshake app-server
melaporkan versi `0.118.0` atau yang lebih baru.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan pastikan app-server jarak jauh menggunakan versi protokol app-server Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan. Harness Codex hanya menangani
ref model `codex/*`.

## Terkait

- [Plugin Harness Agen](/id/plugins/sdk-agent-harness)
- [Provider Model](/id/concepts/model-providers)
- [Referensi Konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing#live-codex-app-server-harness-smoke)
