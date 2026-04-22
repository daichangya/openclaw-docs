---
read_when:
    - Anda menginginkan katalog Go OpenCode
    - Anda memerlukan ref model runtime untuk model yang di-host di Go
summary: Gunakan katalog Go OpenCode dengan penyiapan OpenCode bersama
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go adalah katalog Go di dalam [OpenCode](/id/providers/opencode).
Katalog ini menggunakan `OPENCODE_API_KEY` yang sama seperti katalog Zen, tetapi mempertahankan
ID provider runtime `opencode-go` agar routing per model upstream tetap benar.

| Property         | Value                           |
| ---------------- | ------------------------------- |
| Provider runtime | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Setup induk      | [OpenCode](/id/providers/opencode) |

## Model yang didukung

OpenClaw mengambil katalog Go dari registry model pi bawaan. Jalankan
`openclaw models list --provider opencode-go` untuk daftar model saat ini.

Berdasarkan katalog pi bawaan, provider ini mencakup:

| Model ref                  | Name                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (batas 3x)  |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Memulai

<Tabs>
  <Tab title="Interaktif">
    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Atur model Go sebagai default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interaktif">
    <Steps>
      <Step title="Berikan key secara langsung">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Contoh konfigurasi

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Catatan lanjutan

<AccordionGroup>
  <Accordion title="Perilaku routing">
    OpenClaw menangani routing per model secara otomatis saat model ref menggunakan
    `opencode-go/...`. Tidak diperlukan konfigurasi provider tambahan.
  </Accordion>

  <Accordion title="Konvensi ref runtime">
    Ref runtime tetap eksplisit: `opencode/...` untuk Zen, `opencode-go/...` untuk Go.
    Ini menjaga routing per model upstream tetap benar di kedua katalog.
  </Accordion>

  <Accordion title="Kredensial bersama">
    `OPENCODE_API_KEY` yang sama digunakan oleh katalog Zen dan Go. Memasukkan
    key selama setup menyimpan kredensial untuk kedua provider runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Lihat [OpenCode](/id/providers/opencode) untuk ikhtisar onboarding bersama dan referensi lengkap
katalog Zen + Go.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="OpenCode (induk)" href="/id/providers/opencode" icon="server">
    Onboarding bersama, ikhtisar katalog, dan catatan lanjutan.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, model ref, dan perilaku failover.
  </Card>
</CardGroup>
