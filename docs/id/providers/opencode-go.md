---
read_when:
    - Anda menginginkan katalog Go OpenCode
    - Anda memerlukan ref model runtime untuk model yang dihosting Go
summary: Gunakan katalog Go OpenCode dengan penyiapan OpenCode bersama
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T13:54:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42aba47207d85cdc6d2c5d85c3726da660b456320765c83df92ee705f005d3c3
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go adalah katalog Go di dalam [OpenCode](/id/providers/opencode).
Ini menggunakan `OPENCODE_API_KEY` yang sama dengan katalog Zen, tetapi tetap memakai
ID penyedia runtime `opencode-go` agar perutean per-model upstream tetap benar.

| Property         | Value                           |
| ---------------- | ------------------------------- |
| Penyedia runtime | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Penyiapan induk  | [OpenCode](/id/providers/opencode) |

## Katalog bawaan

OpenClaw mengambil katalog Go dari registri model Pi bawaan. Jalankan
`openclaw models list --provider opencode-go` untuk daftar model saat ini.

Berdasarkan katalog Pi bawaan, penyedia ini mencakup:

| Ref model                  | Nama                  |
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
      <Step title="Tetapkan model Go sebagai default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
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
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Contoh config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku perutean">
    OpenClaw menangani perutean per-model secara otomatis saat ref model menggunakan
    `opencode-go/...`. Tidak diperlukan config penyedia tambahan.
  </Accordion>

  <Accordion title="Konvensi ref runtime">
    Ref runtime tetap eksplisit: `opencode/...` untuk Zen, `opencode-go/...` untuk Go.
    Ini menjaga perutean per-model upstream tetap benar di kedua katalog.
  </Accordion>

  <Accordion title="Kredensial bersama">
    `OPENCODE_API_KEY` yang sama digunakan oleh katalog Zen dan Go. Memasukkan
    key saat penyiapan akan menyimpan kredensial untuk kedua penyedia runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Lihat [OpenCode](/id/providers/opencode) untuk ikhtisar onboarding bersama dan referensi lengkap katalog Zen + Go.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="OpenCode (induk)" href="/id/providers/opencode" icon="server">
    Onboarding bersama, ikhtisar katalog, dan catatan lanjutan.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
</CardGroup>
