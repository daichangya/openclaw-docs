---
read_when:
    - Menyesuaikan parsing atau default direktif thinking, mode cepat, atau verbose
summary: Sintaks direktif untuk `/think`, `/fast`, `/verbose`, `/trace`, dan visibilitas reasoning
title: Level Thinking
x-i18n:
    generated_at: "2026-04-21T09:25:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# Level Thinking (direktif `/think`)

## Fungsinya

- Direktif inline di isi pesan masuk mana pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (anggaran maksimum)
  - xhigh → “ultrathink+” (usaha GPT-5.2 + model Codex dan Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptif yang dikelola provider (didukung untuk Claude 4.6 di Anthropic/Bedrock dan Anthropic Claude Opus 4.7)
  - max → reasoning maksimum dari provider (saat ini Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan provider:
  - Menu dan pemilih thinking digerakkan oleh profil provider. Plugin provider mendeklarasikan himpunan level yang tepat untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, dan `max` hanya diiklankan untuk profil provider/model yang mendukungnya. Direktif yang diketik untuk level yang tidak didukung akan ditolak dengan opsi valid model tersebut.
  - Level tak didukung yang sudah tersimpan, termasuk nilai `max` lama setelah berpindah model, dipetakan ulang ke level terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 default ke `adaptive` saat tidak ada level thinking eksplisit yang diatur.
  - Anthropic Claude Opus 4.7 tidak default ke thinking adaptif. Default effort API-nya tetap dimiliki provider kecuali Anda secara eksplisit menetapkan level thinking.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke thinking adaptif plus `output_config.effort: "xhigh"`, karena `/think` adalah direktif thinking dan `xhigh` adalah pengaturan effort Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; ini dipetakan ke jalur effort maksimum milik provider yang sama.
  - Model GPT OpenAI memetakan `/think` melalui dukungan effort Responses API yang spesifik model. `/think off` mengirim `reasoning.effort: "none"` hanya ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload reasoning nonaktif alih-alih mengirim nilai yang tidak didukung.
  - MiniMax (`minimax/*`) pada jalur streaming yang kompatibel dengan Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan thinking di parameter model atau parameter permintaan. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native milik MiniMax.
  - Z.AI (`zai/*`) hanya mendukung thinking biner (`on`/`off`). Level apa pun selain `off` diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level apa pun selain `off` ke `thinking: { type: "enabled" }`. Saat thinking diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan itu).
2. Override sesi (diatur dengan mengirim pesan yang hanya berisi direktif).
3. Default per agen (`agents.list[].thinkingDefault` dalam konfigurasi).
4. Default global (`agents.defaults.thinkingDefault` dalam konfigurasi).
5. Fallback: default yang dideklarasikan provider jika tersedia, `low` untuk model katalog lain yang ditandai mendukung reasoning, `off` jika tidak.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi direktif tersebut (spasi diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Ini akan menetap untuk sesi saat ini (default-nya per pengirim); dibersihkan dengan `/think:off` atau reset idle sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level thinking saat ini.

## Penerapan per agen

- **Pi tertanam**: level yang terselesaikan diteruskan ke runtime agen Pi dalam proses.

## Mode cepat (`/fast`)

- Level: `on|off`.
- Pesan yang hanya berisi direktif mengubah override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw menyelesaikan mode cepat dalam urutan berikut:
  1. `/fast on|off` inline/hanya-direktif
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Konfigurasi per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur auth.
- Untuk permintaan `anthropic/*` publik langsung, termasuk lalu lintas terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke tier layanan Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model `serviceTier` / `service_tier` Anthropic yang eksplisit meng-override default mode cepat ketika keduanya diatur. OpenClaw tetap melewati injeksi tier layanan Anthropic untuk base URL proxy non-Anthropic.

## Direktif verbose (`/verbose` atau `/v`)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengubah verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level yang tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sessions dengan memilih `inherit`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku untuk kasus lainnya.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat verbose aktif, agen yang mengeluarkan hasil tool terstruktur (Pi, agen JSON lain) mengirim balik setiap pemanggilan tool sebagai pesan metadata-only terpisah, diawali dengan `<emoji> <tool-name>: <arg>` bila tersedia (jalur/perintah). Ringkasan tool ini dikirim segera saat setiap tool dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan tool tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Saat verbose adalah `full`, keluaran tool juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang aman). Jika Anda mengubah `/verbose on|full|off` saat suatu proses sedang berjalan, bubble tool berikutnya akan mengikuti pengaturan baru.

## Direktif trace Plugin (`/trace`)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengubah keluaran trace Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku untuk kasus lainnya.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level trace saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris trace/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris trace dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas reasoning (`/reasoning`)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengubah apakah blok thinking ditampilkan dalam balasan.
- Saat diaktifkan, reasoning dikirim sebagai **pesan terpisah** yang diawali `Reasoning:`.
- `stream` (khusus Telegram): men-stream reasoning ke bubble draf Telegram saat balasan sedang dihasilkan, lalu mengirim jawaban final tanpa reasoning.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level reasoning saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu fallback (`off`).

## Terkait

- Dokumentasi mode elevated ada di [Elevated mode](/id/tools/elevated).

## Heartbeat

- Isi probe Heartbeat adalah prompt Heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif inline dalam pesan Heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari Heartbeat).
- Pengiriman Heartbeat default ke payload final saja. Untuk juga mengirim pesan `Reasoning:` terpisah (jika tersedia), setel `agents.defaults.heartbeat.includeReasoning: true` atau `agents.list[].heartbeat.includeReasoning: true` per agen.

## UI chat web

- Pemilih thinking chat web mencerminkan level tersimpan sesi dari penyimpanan/config sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override `thinkingOnce` sekali pakai.
- Opsi pertama selalu `Default (<resolved level>)`, di mana default yang terselesaikan berasal dari profil thinking provider model sesi aktif.
- Pemilih menggunakan `thinkingOptions` yang dikembalikan oleh baris sesi Gateway. UI browser tidak menyimpan daftar regex provider sendiri; Plugin memiliki himpunan level khusus model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif chat dan pemilih tetap sinkron.

## Profil provider

- Plugin provider dapat mengekspos `resolveThinkingProfile(ctx)` untuk mendefinisikan level dan default model yang didukung.
- Setiap level profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Provider biner menggunakan `{ id: "low", label: "on" }`.
- Hook legacy yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adaptor kompatibilitas, tetapi himpunan level kustom baru sebaiknya menggunakan `resolveThinkingProfile`.
- Baris Gateway mengekspos `thinkingOptions` dan `thinkingDefault` sehingga klien ACP/chat merender profil yang sama dengan yang digunakan validasi runtime.
