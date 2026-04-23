---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
summary: Gunakan Anthropic Claude melalui API key atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T09:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic membangun keluarga model **Claude**. OpenClaw mendukung dua jalur auth:

- **API key** — akses API Anthropic langsung dengan billing berbasis penggunaan (model `anthropic/*`)
- **Claude CLI** — gunakan kembali login Claude CLI yang sudah ada pada host yang sama

<Warning>
Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diperbolehkan lagi, jadi
OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai sesuatu yang diizinkan kecuali
Anthropic menerbitkan kebijakan baru.

Untuk host Gateway yang berjalan lama, API key Anthropic tetap merupakan jalur produksi
yang paling jelas dan paling dapat diprediksi.

Docs publik Anthropic saat ini:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Memulai

<Tabs>
  <Tab title="API key">
    **Terbaik untuk:** akses API standar dan billing berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan API key Anda">
        Buat API key di [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        # pilih: Anthropic API key
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

    ### Contoh config

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Terbaik untuk:** menggunakan kembali login Claude CLI yang sudah ada tanpa API key terpisah.

    <Steps>
      <Step title="Pastikan Claude CLI terinstal dan sudah login">
        Verifikasi dengan:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        # pilih: Claude CLI
        ```

        OpenClaw mendeteksi dan menggunakan kembali kredensial Claude CLI yang sudah ada.
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Detail setup dan runtime untuk backend Claude CLI ada di [CLI Backends](/id/gateway/cli-backends).
    </Note>

    <Tip>
    Jika Anda menginginkan jalur billing yang paling jelas, gunakan API key Anthropic sebagai gantinya. OpenClaw juga mendukung opsi bergaya langganan dari [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Default thinking (Claude 4.6)

Model Claude 4.6 default ke thinking `adaptive` di OpenClaw ketika tidak ada level thinking eksplisit yang diatur.

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
Docs Anthropic terkait:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt caching

OpenClaw mendukung fitur prompt caching Anthropic untuk auth API key.

| Value               | Durasi cache | Description                               |
| ------------------- | ------------ | ----------------------------------------- |
| `"short"` (default) | 5 menit      | Diterapkan otomatis untuk auth API key    |
| `"long"`            | 1 jam        | Cache diperpanjang                        |
| `"none"`            | Tanpa cache  | Nonaktifkan prompt caching                |

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
  <Accordion title="Override cache per-agent">
    Gunakan params tingkat model sebagai baseline Anda, lalu override agent tertentu melalui `agents.list[].params`:

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

    Urutan merge config:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` yang cocok, override berdasarkan key)

    Ini memungkinkan satu agent mempertahankan cache yang tahan lama sementara agent lain pada model yang sama menonaktifkan caching untuk lalu lintas bursty/penggunaan ulang rendah.

  </Accordion>

  <Accordion title="Catatan Claude di Bedrock">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima pass-through `cacheRetention` saat dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.
    - Smart default API key juga menyemai `cacheRetention: "short"` untuk ref Claude-on-Bedrock saat tidak ada nilai eksplisit yang diatur.
  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode cepat">
    Toggle `/fast` bersama OpenClaw mendukung lalu lintas Anthropic langsung (API key dan OAuth ke `api.anthropic.com`).

    | Command | Dipetakan ke |
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
    - Hanya disuntikkan untuk request `api.anthropic.com` langsung. Rute proxy membiarkan `service_tier` tetap tidak diubah.
    - Params `serviceTier` atau `service_tier` yang eksplisit menimpa `/fast` saat keduanya diatur.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat di-resolve menjadi `standard`.
    </Note>

  </Accordion>

  <Accordion title="Pemahaman media (gambar dan PDF)">
    Plugin Anthropic bawaan mendaftarkan pemahaman gambar dan PDF. OpenClaw
    me-resolve kapabilitas media secara otomatis dari auth Anthropic yang dikonfigurasi — tidak
    diperlukan config tambahan.

    | Property       | Value                |
    | -------------- | -------------------- |
    | Model default  | `claude-opus-4-6`    |
    | Input yang didukung | Gambar, dokumen PDF |

    Saat gambar atau PDF dilampirkan ke percakapan, OpenClaw secara otomatis
    merutekannya melalui provider pemahaman media Anthropic.

  </Accordion>

  <Accordion title="Jendela konteks 1M (beta)">
    Jendela konteks 1M Anthropic dibatasi beta. Aktifkan per model:

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

    OpenClaw memetakan ini ke `anthropic-beta: context-1m-2025-08-07` pada request.

    <Warning>
    Memerlukan akses long-context pada kredensial Anthropic Anda. Auth token lama (`sk-ant-oat-*`) ditolak untuk request konteks 1M — OpenClaw mencatat peringatan dan fallback ke jendela konteks standar.
    </Warning>

  </Accordion>

  <Accordion title="Konteks 1M Claude Opus 4.7">
    `anthropic/claude-opus-4.7` dan variannya `claude-cli` memiliki jendela konteks
    1M secara default — tidak perlu `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Error 401 / token tiba-tiba tidak valid">
    Auth token Anthropic dapat kedaluwarsa atau dicabut. Untuk setup baru, migrasikan ke API key Anthropic.
  </Accordion>

  <Accordion title='Tidak ada API key yang ditemukan untuk provider "anthropic"'>
    Auth adalah **per agent**. Agent baru tidak mewarisi key milik agent utama. Jalankan ulang onboarding untuk agent tersebut, atau konfigurasikan API key pada host Gateway, lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='Tidak ada kredensial yang ditemukan untuk profile "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat auth profile mana yang aktif. Jalankan ulang onboarding, atau konfigurasikan API key untuk path profile tersebut.
  </Accordion>

  <Accordion title="Tidak ada auth profile yang tersedia (semua dalam cooldown)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Cooldown rate limit Anthropic dapat dicakup per model, jadi model Anthropic lain yang setara mungkin masih dapat digunakan. Tambahkan profile Anthropic lain atau tunggu cooldown selesai.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan lebih lanjut: [Troubleshooting](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Backend CLI" href="/id/gateway/cli-backends" icon="terminal">
    Detail setup dan runtime backend Claude CLI.
  </Card>
  <Card title="Prompt caching" href="/id/reference/prompt-caching" icon="database">
    Cara kerja prompt caching di berbagai provider.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
