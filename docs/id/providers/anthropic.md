---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
summary: Gunakan Anthropic Claude melalui kunci API atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-25T13:53:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic membangun keluarga model **Claude**. OpenClaw mendukung dua jalur auth:

- **Kunci API** — akses API Anthropic langsung dengan penagihan berbasis penggunaan (model `anthropic/*`)
- **Claude CLI** — gunakan ulang login Claude CLI yang sudah ada di host yang sama

<Warning>
Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga
OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai hal yang diizinkan kecuali
Anthropic menerbitkan kebijakan baru.

Untuk host gateway yang berjalan lama, kunci API Anthropic tetap merupakan jalur produksi yang paling jelas dan
paling dapat diprediksi.

Dokumentasi publik Anthropic saat ini:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Memulai

<Tabs>
  <Tab title="Kunci API">
    **Terbaik untuk:** akses API standar dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat kunci API di [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Atau berikan key secara langsung:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Contoh konfigurasi

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Terbaik untuk:** menggunakan ulang login Claude CLI yang sudah ada tanpa key API terpisah.

    <Steps>
      <Step title="Pastikan Claude CLI terpasang dan sudah login">
        Verifikasi dengan:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw mendeteksi dan menggunakan ulang kredensial Claude CLI yang ada.
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Detail penyiapan dan runtime untuk backend Claude CLI ada di [CLI Backends](/id/gateway/cli-backends).
    </Note>

    <Tip>
    Jika Anda menginginkan jalur penagihan yang paling jelas, gunakan kunci API Anthropic sebagai gantinya. OpenClaw juga mendukung opsi bergaya langganan dari [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Default thinking (Claude 4.6)

Model Claude 4.6 secara default menggunakan thinking `adaptive` di OpenClaw saat tidak ada level thinking eksplisit yang diatur.

Override per pesan dengan `/think:<level>` atau di params model:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Dokumentasi Anthropic terkait:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt caching

OpenClaw mendukung fitur prompt caching Anthropic untuk auth kunci API.

| Nilai               | Durasi cache | Deskripsi                                  |
| ------------------- | ------------ | ------------------------------------------ |
| `"short"` (default) | 5 menit      | Diterapkan otomatis untuk auth kunci API   |
| `"long"`            | 1 jam        | Cache yang diperluas                       |
| `"none"`            | Tanpa caching | Nonaktifkan prompt caching                |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Override cache per agen">
    Gunakan params level model sebagai baseline, lalu override agen tertentu melalui `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Urutan merge konfigurasi:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (mencocokkan `id`, override berdasarkan key)

    Ini memungkinkan satu agen mempertahankan cache yang bertahan lama sementara agen lain pada model yang sama menonaktifkan caching untuk lalu lintas bursty/berpenggunaan ulang rendah.

  </Accordion>

  <Accordion title="Catatan Claude di Bedrock">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima pass-through `cacheRetention` saat dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa menjadi `cacheRetention: "none"` saat runtime.
    - Default cerdas kunci API juga menginisialisasi `cacheRetention: "short"` untuk ref Claude-on-Bedrock saat tidak ada nilai eksplisit yang diatur.
  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode cepat">
    Toggle `/fast` bersama milik OpenClaw mendukung lalu lintas Anthropic langsung (kunci API dan OAuth ke `api.anthropic.com`).

    | Perintah | Dipetakan ke |
    |---------|--------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Hanya disuntikkan untuk permintaan `api.anthropic.com` langsung. Jalur proxy membiarkan `service_tier` tidak berubah.
    - Params `serviceTier` atau `service_tier` yang eksplisit mengoverride `/fast` saat keduanya diatur.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat di-resolve menjadi `standard`.
    </Note>

  </Accordion>

  <Accordion title="Pemahaman media (gambar dan PDF)">
    Plugin Anthropic bawaan mendaftarkan pemahaman gambar dan PDF. OpenClaw
    secara otomatis me-resolve kemampuan media dari auth Anthropic yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan.

    | Properti        | Nilai                  |
    | --------------- | ---------------------- |
    | Model default   | `claude-opus-4-6`      |
    | Input didukung  | Gambar, dokumen PDF    |

    Saat gambar atau PDF dilampirkan ke percakapan, OpenClaw secara otomatis
    merutekannya melalui penyedia pemahaman media Anthropic.

  </Accordion>

  <Accordion title="Jendela konteks 1M (beta)">
    Jendela konteks 1M Anthropic dikontrol oleh beta. Aktifkan per model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw memetakan ini ke `anthropic-beta: context-1m-2025-08-07` pada permintaan.

    <Warning>
    Memerlukan akses konteks panjang pada kredensial Anthropic Anda. Auth token lama (`sk-ant-oat-*`) ditolak untuk permintaan konteks 1M — OpenClaw mencatat peringatan dan fallback ke jendela konteks standar.
    </Warning>

  </Accordion>

  <Accordion title="Konteks 1M Claude Opus 4.7">
    `anthropic/claude-opus-4.7` dan variannya `claude-cli` memiliki jendela konteks 1M
    secara default — tidak memerlukan `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Error 401 / token tiba-tiba tidak valid">
    Auth token Anthropic kedaluwarsa dan dapat dicabut. Untuk penyiapan baru, gunakan kunci API Anthropic sebagai gantinya.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Auth Anthropic bersifat **per agen** — agen baru tidak mewarisi key agen utama. Jalankan ulang onboarding untuk agen itu (atau konfigurasikan kunci API pada host gateway), lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat profil auth mana yang aktif. Jalankan ulang onboarding, atau konfigurasikan kunci API untuk path profil tersebut.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Cooldown rate-limit Anthropic dapat dicakup ke model, sehingga model Anthropic saudara mungkin masih bisa digunakan. Tambahkan profil Anthropic lain atau tunggu cooldown selesai.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan lebih lanjut: [Troubleshooting](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Backend CLI" href="/id/gateway/cli-backends" icon="terminal">
    Detail penyiapan dan runtime backend Claude CLI.
  </Card>
  <Card title="Prompt caching" href="/id/reference/prompt-caching" icon="database">
    Cara kerja prompt caching di berbagai penyedia.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
