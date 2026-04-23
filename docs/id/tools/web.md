---
read_when:
    - Anda ingin mengaktifkan atau mengonfigurasi `web_search`
    - Anda ingin mengaktifkan atau mengonfigurasi `x_search`
    - Anda perlu memilih provider pencarian
    - Anda ingin memahami deteksi otomatis dan fallback provider
sidebarTitle: Web Search
summary: '`web_search`, `x_search`, dan `web_fetch` -- cari di web, cari postingan X, atau ambil konten halaman'
title: Pencarian Web
x-i18n:
    generated_at: "2026-04-23T09:29:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e568670e1e15f195dbac1a249723a2ad873d6c49217575959b8eea2cb14ef75
    source_path: tools/web.md
    workflow: 15
---

# Pencarian Web

Tool `web_search` mencari di web menggunakan provider yang Anda konfigurasi dan
mengembalikan hasil. Hasil di-cache per kueri selama 15 menit (dapat dikonfigurasi).

OpenClaw juga menyertakan `x_search` untuk postingan X (sebelumnya Twitter) dan
`web_fetch` untuk pengambilan URL ringan. Pada fase ini, `web_fetch` tetap
lokal sementara `web_search` dan `x_search` dapat menggunakan xAI Responses di balik layar.

<Info>
  `web_search` adalah tool HTTP ringan, bukan otomatisasi browser. Untuk
  situs yang berat JavaScript atau login, gunakan [Web Browser](/id/tools/browser). Untuk
  mengambil URL tertentu, gunakan [Web Fetch](/id/tools/web-fetch).
</Info>

## Mulai cepat

<Steps>
  <Step title="Pilih provider">
    Pilih provider dan selesaikan penyiapan yang diperlukan. Beberapa provider
    tidak memerlukan key, sementara yang lain menggunakan API key. Lihat halaman provider di bawah untuk
    detailnya.
  </Step>
  <Step title="Konfigurasi">
    ```bash
    openclaw configure --section web
    ```
    Ini menyimpan provider dan kredensial yang diperlukan. Anda juga dapat menetapkan env
    var (misalnya `BRAVE_API_KEY`) dan melewati langkah ini untuk provider
    berbasis API.
  </Step>
  <Step title="Gunakan">
    Agent sekarang dapat memanggil `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Untuk postingan X, gunakan:

    ```javascript
    await x_search({ query: "resep makan malam" });
    ```

  </Step>
</Steps>

## Memilih provider

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/id/tools/brave-search">
    Hasil terstruktur dengan snippet. Mendukung mode `llm-context`, filter negara/bahasa. Tersedia tier gratis.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/id/tools/duckduckgo-search">
    Fallback tanpa key. Tidak perlu API key. Integrasi tidak resmi berbasis HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/id/tools/exa-search">
    Pencarian neural + kata kunci dengan ekstraksi konten (highlight, teks, ringkasan).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/id/tools/firecrawl">
    Hasil terstruktur. Paling baik dipasangkan dengan `firecrawl_search` dan `firecrawl_scrape` untuk ekstraksi mendalam.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/id/tools/gemini-search">
    Jawaban tersintesis AI dengan sitasi melalui grounding Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/id/tools/grok-search">
    Jawaban tersintesis AI dengan sitasi melalui grounding web xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/id/tools/kimi-search">
    Jawaban tersintesis AI dengan sitasi melalui pencarian web Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/id/tools/minimax-search">
    Hasil terstruktur melalui API pencarian MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/id/tools/ollama-search">
    Pencarian tanpa key melalui host Ollama yang Anda konfigurasi. Memerlukan `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/id/tools/perplexity-search">
    Hasil terstruktur dengan kontrol ekstraksi konten dan pemfilteran domain.
  </Card>
  <Card title="SearXNG" icon="server" href="/id/tools/searxng-search">
    Meta-search self-hosted. Tidak perlu API key. Mengagregasi Google, Bing, DuckDuckGo, dan lainnya.
  </Card>
  <Card title="Tavily" icon="globe" href="/id/tools/tavily">
    Hasil terstruktur dengan kedalaman pencarian, pemfilteran topik, dan `tavily_extract` untuk ekstraksi URL.
  </Card>
</CardGroup>

### Perbandingan provider

| Provider                                  | Gaya hasil                  | Filter                                           | API key                                                                          |
| ----------------------------------------- | --------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/id/tools/brave-search)              | Snippet terstruktur         | Negara, bahasa, waktu, mode `llm-context`        | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/id/tools/duckduckgo-search)    | Snippet terstruktur         | --                                               | Tidak ada (tanpa key)                                                            |
| [Exa](/id/tools/exa-search)                  | Terstruktur + diekstrak     | Mode neural/kata kunci, tanggal, ekstraksi konten | `EXA_API_KEY`                                                                  |
| [Firecrawl](/id/tools/firecrawl)             | Snippet terstruktur         | Melalui tool `firecrawl_search`                  | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/id/tools/gemini-search)            | Tersintesis AI + sitasi     | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/id/tools/grok-search)                | Tersintesis AI + sitasi     | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/id/tools/kimi-search)                | Tersintesis AI + sitasi     | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/id/tools/minimax-search)   | Snippet terstruktur         | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/id/tools/ollama-search) | Snippet terstruktur         | --                                               | Tidak ada secara default; `ollama signin` diperlukan, dapat menggunakan ulang bearer auth provider Ollama |
| [Perplexity](/id/tools/perplexity-search)    | Snippet terstruktur         | Negara, bahasa, waktu, domain, batas konten      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/id/tools/searxng-search)          | Snippet terstruktur         | Kategori, bahasa                                 | Tidak ada (self-hosted)                                                          |
| [Tavily](/id/tools/tavily)                   | Snippet terstruktur         | Melalui tool `tavily_search`                     | `TAVILY_API_KEY`                                                                 |

## Deteksi otomatis

## Pencarian web OpenAI native

Model OpenAI Responses langsung menggunakan tool `web_search` hosted milik OpenAI secara otomatis saat pencarian web OpenClaw diaktifkan dan tidak ada provider terkelola yang dipasangkan. Ini adalah perilaku milik provider dalam plugin OpenAI bawaan dan hanya berlaku untuk trafik API OpenAI native, bukan base URL proxy yang kompatibel dengan OpenAI atau rute Azure. Tetapkan `tools.web.search.provider` ke provider lain seperti `brave` agar tetap menggunakan tool `web_search` terkelola untuk model OpenAI, atau tetapkan `tools.web.search.enabled: false` untuk menonaktifkan pencarian terkelola dan pencarian OpenAI native.

## Pencarian web Codex native

Model yang mampu Codex secara opsional dapat menggunakan tool Responses `web_search` native provider alih-alih fungsi `web_search` terkelola milik OpenClaw.

- Konfigurasikan di bawah `tools.web.search.openaiCodex`
- Hanya aktif untuk model yang mampu Codex (`openai-codex/*` atau provider yang menggunakan `api: "openai-codex-responses"`)
- `web_search` terkelola tetap berlaku untuk model non-Codex
- `mode: "cached"` adalah pengaturan default dan direkomendasikan
- `tools.web.search.enabled: false` menonaktifkan pencarian terkelola dan native

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Jika pencarian Codex native diaktifkan tetapi model saat ini tidak mampu Codex, OpenClaw tetap mempertahankan perilaku `web_search` terkelola normal.

## Menyiapkan pencarian web

Daftar provider di docs dan alur penyiapan bersifat alfabetis. Deteksi otomatis mempertahankan urutan prioritas yang terpisah.

Jika tidak ada `provider` yang disetel, OpenClaw memeriksa provider dalam urutan ini dan menggunakan
yang pertama siap:

Provider berbasis API terlebih dahulu:

1. **Brave** -- `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey` (urutan 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` atau `plugins.entries.minimax.config.webSearch.apiKey` (urutan 15)
3. **Gemini** -- `GEMINI_API_KEY` atau `plugins.entries.google.config.webSearch.apiKey` (urutan 20)
4. **Grok** -- `XAI_API_KEY` atau `plugins.entries.xai.config.webSearch.apiKey` (urutan 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` atau `plugins.entries.moonshot.config.webSearch.apiKey` (urutan 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` atau `plugins.entries.perplexity.config.webSearch.apiKey` (urutan 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey` (urutan 60)
8. **Exa** -- `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey` (urutan 65)
9. **Tavily** -- `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey` (urutan 70)

Fallback tanpa key setelah itu:

10. **DuckDuckGo** -- fallback HTML tanpa key tanpa akun atau API key (urutan 100)
11. **Ollama Web Search** -- fallback tanpa key melalui host Ollama yang Anda konfigurasi; mengharuskan Ollama dapat dijangkau dan sudah sign in dengan `ollama signin` serta dapat menggunakan ulang bearer auth provider Ollama jika host memerlukannya (urutan 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (urutan 200)

Jika tidak ada provider yang terdeteksi, sistem akan fallback ke Brave (Anda akan mendapatkan
error key hilang yang meminta Anda mengonfigurasinya).

<Note>
  Semua field key provider mendukung objek SecretRef. SecretRef berscope plugin
  di bawah `plugins.entries.<plugin>.config.webSearch.apiKey` diselesaikan untuk
  provider Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity, dan Tavily bawaan
  baik saat provider dipilih secara eksplisit melalui `tools.web.search.provider` maupun
  dipilih melalui auto-detect. Dalam mode auto-detect, OpenClaw hanya menyelesaikan
  key provider yang dipilih -- SecretRef yang tidak dipilih tetap tidak aktif, sehingga Anda dapat
  menyimpan beberapa provider terkonfigurasi tanpa membayar biaya resolusi untuk
  yang tidak Anda gunakan.
</Note>

## Konfigurasi

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // atau hilangkan untuk deteksi otomatis
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Konfigurasi spesifik provider (API key, base URL, mode) berada di bawah
`plugins.entries.<plugin>.config.webSearch.*`. Lihat halaman provider untuk
contoh.

Pemilihan provider fallback `web_fetch` terpisah:

- pilih dengan `tools.web.fetch.provider`
- atau hilangkan field itu dan biarkan OpenClaw mendeteksi otomatis provider web-fetch pertama yang siap dari kredensial yang tersedia
- saat ini provider web-fetch bawaan adalah Firecrawl, dikonfigurasi di bawah
  `plugins.entries.firecrawl.config.webFetch.*`

Saat Anda memilih **Kimi** selama `openclaw onboard` atau
`openclaw configure --section web`, OpenClaw juga dapat menanyakan:

- region API Moonshot (`https://api.moonshot.ai/v1` atau `https://api.moonshot.cn/v1`)
- model default pencarian web Kimi (default ke `kimi-k2.6`)

Untuk `x_search`, konfigurasikan `plugins.entries.xai.config.xSearch.*`. Tool ini menggunakan
fallback `XAI_API_KEY` yang sama seperti pencarian web Grok.
Konfigurasi lama `tools.web.x_search.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.
Saat Anda memilih Grok selama `openclaw onboard` atau `openclaw configure --section web`,
OpenClaw juga dapat menawarkan penyiapan `x_search` opsional dengan key yang sama.
Ini adalah langkah tindak lanjut terpisah di dalam jalur Grok, bukan pilihan
provider pencarian web tingkat atas yang terpisah. Jika Anda memilih provider lain, OpenClaw tidak
menampilkan prompt `x_search`.

### Menyimpan API key

<Tabs>
  <Tab title="File konfigurasi">
    Jalankan `openclaw configure --section web` atau tetapkan key secara langsung:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Variabel lingkungan">
    Tetapkan env var provider di environment proses Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Untuk instalasi gateway, simpan di `~/.openclaw/.env`.
    Lihat [Env vars](/id/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parameter tool

| Parameter             | Deskripsi                                             |
| --------------------- | ----------------------------------------------------- |
| `query`               | Kueri pencarian (wajib)                               |
| `count`               | Hasil yang dikembalikan (1-10, default: 5)            |
| `country`             | Kode negara ISO 2 huruf (misalnya "US", "DE")         |
| `language`            | Kode bahasa ISO 639-1 (misalnya "en", "de")           |
| `search_lang`         | Kode bahasa pencarian (khusus Brave)                  |
| `freshness`           | Filter waktu: `day`, `week`, `month`, atau `year`     |
| `date_after`          | Hasil setelah tanggal ini (YYYY-MM-DD)                |
| `date_before`         | Hasil sebelum tanggal ini (YYYY-MM-DD)                |
| `ui_lang`             | Kode bahasa UI (khusus Brave)                         |
| `domain_filter`       | Array allowlist/denylist domain (khusus Perplexity)   |
| `max_tokens`          | Total anggaran konten, default 25000 (khusus Perplexity) |
| `max_tokens_per_page` | Batas token per halaman, default 2048 (khusus Perplexity) |

<Warning>
  Tidak semua parameter bekerja dengan semua provider. Mode `llm-context` Brave
  menolak `ui_lang`, `freshness`, `date_after`, dan `date_before`.
  Gemini, Grok, dan Kimi mengembalikan satu jawaban tersintesis dengan sitasi. Mereka
  menerima `count` untuk kompatibilitas tool bersama, tetapi itu tidak mengubah
  bentuk jawaban yang grounded.
  Perplexity berperilaku sama saat Anda menggunakan jalur kompatibilitas
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` atau `OPENROUTER_API_KEY`).
  SearXNG hanya menerima `http://` untuk host private-network tepercaya atau loopback;
  endpoint SearXNG publik harus menggunakan `https://`.
  Firecrawl dan Tavily hanya mendukung `query` dan `count` melalui `web_search`
  -- gunakan tool khusus mereka untuk opsi lanjutan.
</Warning>

## x_search

`x_search` mengueri postingan X (sebelumnya Twitter) menggunakan xAI dan mengembalikan
jawaban tersintesis AI dengan sitasi. Tool ini menerima kueri bahasa alami dan
filter terstruktur opsional. OpenClaw hanya mengaktifkan tool `x_search` xAI bawaan
pada permintaan yang melayani panggilan tool ini.

<Note>
  xAI mendokumentasikan `x_search` sebagai mendukung pencarian kata kunci, pencarian semantik, pencarian pengguna,
  dan pengambilan thread. Untuk statistik engagement per postingan seperti repost,
  balasan, bookmark, atau view, pilih lookup yang menargetkan URL postingan persis
  atau status ID. Pencarian kata kunci yang luas dapat menemukan postingan yang tepat tetapi mengembalikan metadata per postingan yang kurang lengkap. Pola yang baik adalah: temukan postingannya terlebih dahulu, lalu
  jalankan kueri `x_search` kedua yang berfokus pada postingan persis tersebut.
</Note>

### Konfigurasi x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // opsional jika XAI_API_KEY sudah disetel
          },
        },
      },
    },
  },
}
```

### Parameter x_search

| Parameter                    | Deskripsi                                              |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Kueri pencarian (wajib)                                |
| `allowed_x_handles`          | Batasi hasil ke handle X tertentu                      |
| `excluded_x_handles`         | Kecualikan handle X tertentu                           |
| `from_date`                  | Hanya sertakan postingan pada atau setelah tanggal ini (YYYY-MM-DD) |
| `to_date`                    | Hanya sertakan postingan pada atau sebelum tanggal ini (YYYY-MM-DD) |
| `enable_image_understanding` | Izinkan xAI memeriksa gambar yang dilampirkan ke postingan yang cocok |
| `enable_video_understanding` | Izinkan xAI memeriksa video yang dilampirkan ke postingan yang cocok |

### Contoh x_search

```javascript
await x_search({
  query: "resep makan malam",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistik per postingan: gunakan URL status atau status ID yang persis bila memungkinkan
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Contoh

```javascript
// Pencarian dasar
await web_search({ query: "OpenClaw plugin SDK" });

// Pencarian khusus Jerman
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Hasil terbaru (minggu lalu)
await web_search({ query: "perkembangan AI", freshness: "week" });

// Rentang tanggal
await web_search({
  query: "penelitian iklim",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Pemfilteran domain (khusus Perplexity)
await web_search({
  query: "ulasan produk",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profil tool

Jika Anda menggunakan profil tool atau allowlist, tambahkan `web_search`, `x_search`, atau `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // atau: allow: ["group:web"]  (termasuk web_search, x_search, dan web_fetch)
  },
}
```

## Terkait

- [Web Fetch](/id/tools/web-fetch) -- ambil URL dan ekstrak konten yang mudah dibaca
- [Web Browser](/id/tools/browser) -- otomatisasi browser penuh untuk situs yang berat JavaScript
- [Grok Search](/id/tools/grok-search) -- Grok sebagai provider `web_search`
- [Ollama Web Search](/id/tools/ollama-search) -- pencarian web tanpa key melalui host Ollama Anda
