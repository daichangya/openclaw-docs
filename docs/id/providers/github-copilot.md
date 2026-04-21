---
read_when:
    - Anda ingin menggunakan GitHub Copilot sebagai provider model
    - Anda memerlukan alur `openclaw models auth login-github-copilot`
summary: Masuk ke GitHub Copilot dari OpenClaw menggunakan device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T09:22:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7faafbd3bdcd8886e75fb0d40c3eec66355df3fca6160ebbbb9a0018b7839fe
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot adalah asisten coding AI dari GitHub. Ini menyediakan akses ke model
Copilot untuk akun dan paket GitHub Anda. OpenClaw dapat menggunakan Copilot sebagai provider model
dengan dua cara berbeda.

## Dua cara menggunakan Copilot di OpenClaw

<Tabs>
  <Tab title="Provider bawaan (github-copilot)">
    Gunakan alur login perangkat native untuk memperoleh token GitHub, lalu menukarnya dengan
    token API Copilot saat OpenClaw berjalan. Ini adalah jalur **default** dan paling sederhana
    karena tidak memerlukan VS Code.

    <Steps>
      <Step title="Jalankan perintah login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Anda akan diminta mengunjungi URL dan memasukkan kode satu kali. Biarkan
        terminal tetap terbuka sampai selesai.
      </Step>
      <Step title="Setel model default">
        ```bash
        openclaw models set github-copilot/claude-opus-4.6
        ```

        Atau di config:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.6" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Gunakan extension VS Code **Copilot Proxy** sebagai bridge lokal. OpenClaw berbicara ke
    endpoint `/v1` milik proxy dan menggunakan daftar model yang Anda konfigurasikan di sana.

    <Note>
    Pilih ini saat Anda sudah menjalankan Copilot Proxy di VS Code atau perlu merutekan
    melaluinya. Anda harus mengaktifkan Plugin dan menjaga extension VS Code tetap berjalan.
    </Note>

  </Tab>
</Tabs>

## Flag opsional

| Flag            | Deskripsi                                           |
| --------------- | --------------------------------------------------- |
| `--yes`         | Lewati prompt konfirmasi                            |
| `--set-default` | Terapkan juga model default yang direkomendasikan provider |

```bash
# Lewati konfirmasi
openclaw models auth login-github-copilot --yes

# Login dan setel model default dalam satu langkah
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="TTY interaktif diperlukan">
    Alur login perangkat memerlukan TTY interaktif. Jalankan langsung di
    terminal, bukan dalam skrip non-interaktif atau pipeline CI.
  </Accordion>

  <Accordion title="Ketersediaan model bergantung pada paket Anda">
    Ketersediaan model Copilot bergantung pada paket GitHub Anda. Jika suatu model
    ditolak, coba ID lain (misalnya `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Pemilihan transport">
    ID model Claude secara otomatis menggunakan transport Anthropic Messages. GPT,
    model o-series, dan Gemini tetap menggunakan transport OpenAI Responses. OpenClaw
    memilih transport yang benar berdasarkan ref model.
  </Accordion>

  <Accordion title="Urutan prioritas resolusi variabel environment">
    OpenClaw me-resolve auth Copilot dari variabel environment dalam
    urutan prioritas berikut:

    | Priority | Variable              | Notes                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Prioritas tertinggi, khusus Copilot |
    | 2        | `GH_TOKEN`            | Token GitHub CLI (fallback)      |
    | 3        | `GITHUB_TOKEN`        | Token GitHub standar (terendah)  |

    Saat beberapa variabel diatur, OpenClaw menggunakan yang berprioritas tertinggi.
    Alur login perangkat (`openclaw models auth login-github-copilot`) menyimpan
    tokennya di auth profile store dan didahulukan daripada semua variabel
    environment.

  </Accordion>

  <Accordion title="Penyimpanan token">
    Login menyimpan token GitHub di auth profile store dan menukarnya
    dengan token API Copilot saat OpenClaw berjalan. Anda tidak perlu mengelola
    token secara manual.
  </Accordion>
</AccordionGroup>

<Warning>
Memerlukan TTY interaktif. Jalankan perintah login langsung di terminal, bukan
di dalam skrip headless atau job CI.
</Warning>

## Embedding pencarian memori

GitHub Copilot juga dapat berfungsi sebagai provider embedding untuk
[pencarian memori](/id/concepts/memory-search). Jika Anda memiliki langganan Copilot dan
sudah login, OpenClaw dapat menggunakannya untuk embedding tanpa API key terpisah.

### Deteksi otomatis

Saat `memorySearch.provider` adalah `"auto"` (default), GitHub Copilot dicoba
pada prioritas 15 -- setelah embedding lokal tetapi sebelum OpenAI dan provider
berbayar lainnya. Jika token GitHub tersedia, OpenClaw menemukan model
embedding yang tersedia dari API Copilot dan memilih yang terbaik secara otomatis.

### Config eksplisit

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opsional: override model yang ditemukan otomatis
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Cara kerjanya

1. OpenClaw me-resolve token GitHub Anda (dari env var atau auth profile).
2. Menukarnya dengan token API Copilot berumur pendek.
3. Mengkueri endpoint `/models` Copilot untuk menemukan model embedding yang tersedia.
4. Memilih model terbaik (mengutamakan `text-embedding-3-small`).
5. Mengirim permintaan embedding ke endpoint `/embeddings` Copilot.

Ketersediaan model bergantung pada paket GitHub Anda. Jika tidak ada model embedding
yang tersedia, OpenClaw melewati Copilot dan mencoba provider berikutnya.

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="OAuth and auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
