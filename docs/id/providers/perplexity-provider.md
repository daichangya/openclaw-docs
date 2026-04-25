---
read_when:
    - Anda ingin mengonfigurasi Perplexity sebagai penyedia pencarian web
    - Anda memerlukan penyiapan API key Perplexity atau proxy OpenRouter
summary: Penyiapan penyedia pencarian web Perplexity (API key, mode pencarian, pemfilteran)
title: Perplexity
x-i18n:
    generated_at: "2026-04-25T13:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Plugin Perplexity menyediakan kemampuan pencarian web melalui Perplexity
Search API atau Perplexity Sonar melalui OpenRouter.

<Note>
Halaman ini membahas penyiapan **penyedia** Perplexity. Untuk **tool**
Perplexity (bagaimana agen menggunakannya), lihat [tool Perplexity](/id/tools/perplexity-search).
</Note>

| Property    | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Tipe        | Penyedia pencarian web (bukan penyedia model)                          |
| Auth        | `PERPLEXITY_API_KEY` (langsung) atau `OPENROUTER_API_KEY` (melalui OpenRouter) |
| Jalur config | `plugins.entries.perplexity.config.webSearch.apiKey`                  |

## Memulai

<Steps>
  <Step title="Tetapkan API key">
    Jalankan alur konfigurasi pencarian web interaktif:

    ```bash
    openclaw configure --section web
    ```

    Atau tetapkan key secara langsung:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Mulai mencari">
    Agen akan otomatis menggunakan Perplexity untuk pencarian web setelah key
    dikonfigurasi. Tidak diperlukan langkah tambahan.
  </Step>
</Steps>

## Mode pencarian

Plugin secara otomatis memilih transport berdasarkan prefiks API key:

<Tabs>
  <Tab title="API Perplexity native (pplx-)">
    Saat key Anda diawali dengan `pplx-`, OpenClaw menggunakan Perplexity Search
    API native. Transport ini mengembalikan hasil terstruktur dan mendukung filter
    domain, bahasa, dan tanggal (lihat opsi pemfilteran di bawah).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Saat key Anda diawali dengan `sk-or-`, OpenClaw merutekan melalui OpenRouter menggunakan
    model Perplexity Sonar. Transport ini mengembalikan jawaban hasil sintesis AI dengan
    sitasi.
  </Tab>
</Tabs>

| Prefiks key | Transport                    | Fitur                                            |
| ----------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`     | Perplexity Search API native | Hasil terstruktur, filter domain/bahasa/tanggal |
| `sk-or-`    | OpenRouter (Sonar)           | Jawaban hasil sintesis AI dengan sitasi         |

## Pemfilteran API native

<Note>
Opsi pemfilteran hanya tersedia saat menggunakan API Perplexity native
(key `pplx-`). Pencarian OpenRouter/Sonar tidak mendukung parameter ini.
</Note>

Saat menggunakan API Perplexity native, pencarian mendukung filter berikut:

| Filter         | Deskripsi                              | Contoh                              |
| -------------- | -------------------------------------- | ----------------------------------- |
| Negara         | Kode negara 2 huruf                    | `us`, `de`, `jp`                    |
| Bahasa         | Kode bahasa ISO 639-1                  | `en`, `fr`, `zh`                    |
| Rentang tanggal | Jendela kebaruan                      | `day`, `week`, `month`, `year`      |
| Filter domain  | Allowlist atau denylist (maks 20 domain) | `example.com`                     |
| Anggaran konten | Batas token per respons / per halaman | `max_tokens`, `max_tokens_per_page` |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Variabel environment untuk proses daemon">
    Jika OpenClaw Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `PERPLEXITY_API_KEY` tersedia untuk proses tersebut.

    <Warning>
    Key yang hanya ditetapkan di `~/.profile` tidak akan terlihat oleh daemon
    launchd/systemd kecuali environment tersebut diimpor secara eksplisit. Tetapkan key di
    `~/.openclaw/.env` atau melalui `env.shellEnv` agar proses gateway dapat
    membacanya.
    </Warning>

  </Accordion>

  <Accordion title="Penyiapan proxy OpenRouter">
    Jika Anda lebih suka merutekan pencarian Perplexity melalui OpenRouter, tetapkan
    `OPENROUTER_API_KEY` (prefiks `sk-or-`) alih-alih key Perplexity native.
    OpenClaw akan mendeteksi prefiks tersebut dan beralih ke transport Sonar
    secara otomatis.

    <Tip>
    Transport OpenRouter berguna jika Anda sudah memiliki akun OpenRouter
    dan menginginkan penagihan terpusat di berbagai penyedia.
    </Tip>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Tool pencarian Perplexity" href="/id/tools/perplexity-search" icon="magnifying-glass">
    Cara agen memanggil pencarian Perplexity dan menafsirkan hasil.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap termasuk entri Plugin.
  </Card>
</CardGroup>
