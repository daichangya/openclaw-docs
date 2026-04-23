---
read_when:
    - Menyesuaikan parsing atau default direktif thinking, fast-mode, atau verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas reasoning
title: Level Thinking
x-i18n:
    generated_at: "2026-04-23T09:29:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66033bb9272c9b9ea8fc85dc91e33e95ce4c469c56a8cd10c19632a5aa8a2338
    source_path: tools/thinking.md
    workflow: 15
---

# Level Thinking (/think directives)

## Fungsinya

- Direktif inline di body masuk mana pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (anggaran maksimum)
  - xhigh → “ultrathink+” (GPT-5.2 + model Codex dan effort Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptif yang dikelola provider (didukung untuk Claude 4.6 pada Anthropic/Bedrock dan Anthropic Claude Opus 4.7)
  - max → reasoning maksimum provider (saat ini Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan provider:
  - Menu dan picker thinking digerakkan oleh profil provider. Plugin provider mendeklarasikan kumpulan level yang tepat untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, dan `max` hanya diiklankan untuk profil provider/model yang mendukungnya. Direktif bertipe untuk level yang tidak didukung ditolak dengan opsi valid model tersebut.
  - Level tersimpan yang sudah ada tetapi tidak didukung dipetakan ulang berdasarkan peringkat profil provider. `adaptive` fallback ke `medium` pada model non-adaptif, sedangkan `xhigh` dan `max` fallback ke level non-off terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 default ke `adaptive` ketika tidak ada level thinking eksplisit yang disetel.
  - Anthropic Claude Opus 4.7 tidak default ke thinking adaptif. Default effort API-nya tetap dimiliki provider kecuali Anda secara eksplisit menyetel level thinking.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke thinking adaptif plus `output_config.effort: "xhigh"`, karena `/think` adalah direktif thinking dan `xhigh` adalah pengaturan effort Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; ini dipetakan ke jalur effort maksimum milik provider yang sama.
  - Model GPT OpenAI memetakan `/think` melalui dukungan effort Responses API spesifik model. `/think off` mengirim `reasoning.effort: "none"` hanya ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload reasoning yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - MiniMax (`minimax/*`) pada jalur streaming kompatibel Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menyetel thinking di model params atau request params. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native milik MiniMax.
  - Z.AI (`zai/*`) hanya mendukung thinking biner (`on`/`off`). Level apa pun selain `off` diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level apa pun selain `off` ke `thinking: { type: "enabled" }`. Saat thinking diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan itu).
2. Override sesi (disetel dengan mengirim pesan yang hanya berisi direktif).
3. Default per-agent (`agents.list[].thinkingDefault` di config).
4. Default global (`agents.defaults.thinkingDefault` di config).
5. Fallback: default yang dideklarasikan provider saat tersedia, `low` untuk model katalog lain yang ditandai mampu reasoning, `off` untuk selain itu.

## Menyetel default sesi

- Kirim pesan yang **hanya** berupa direktif (whitespace diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Ini akan bertahan untuk sesi saat ini (default-nya per-pengirim); dihapus oleh `/think:off` atau reset idle sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan state sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level thinking saat ini.

## Penerapan oleh agent

- **Embedded Pi**: level hasil resolve diteruskan ke runtime agent Pi in-process.

## Mode cepat (/fast)

- Level: `on|off`.
- Pesan yang hanya berupa direktif mengaktifkan/mematikan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat state mode cepat efektif saat ini.
- OpenClaw me-resolve mode cepat dalam urutan ini:
  1. Inline/direktif-saja `/fast on|off`
  2. Override sesi
  3. Default per-agent (`agents.list[].fastModeDefault`)
  4. Config per-model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur auth.
- Untuk permintaan `anthropic/*` publik langsung, termasuk lalu lintas yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke service tier Anthropic: `/fast on` menyetel `service_tier=auto`, `/fast off` menyetel `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur kompatibel Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- `serviceTier` / `service_tier` model params Anthropic eksplisit menimpa default mode cepat ketika keduanya disetel. OpenClaw tetap melewati penyuntikan service-tier Anthropic untuk base URL proxy non-Anthropic.
- `/status` menampilkan `Fast` hanya saat mode cepat diaktifkan.

## Direktif verbose (/verbose atau /v)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berupa direktif mengaktifkan/mematikan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level yang tidak valid mengembalikan petunjuk tanpa mengubah state.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sessions dengan memilih `inherit`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku untuk selain itu.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat verbose aktif, agent yang mengeluarkan hasil tool terstruktur (Pi, agent JSON lain) mengirim balik setiap pemanggilan tool sebagai pesan metadata-saja tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` saat tersedia (jalur/perintah). Ringkasan tool ini dikirim segera saat setiap tool dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan tool tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Saat verbose adalah `full`, output tool juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang aman). Jika Anda mengganti `/verbose on|full|off` saat eksekusi masih berlangsung, bubble tool berikutnya mengikuti pengaturan baru.

## Direktif jejak Plugin (/trace)

- Level: `on` | `off` (default).
- Pesan yang hanya berupa direktif mengaktifkan/mematikan output jejak Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku untuk selain itu.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level jejak saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris jejak/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris jejak dapat muncul di `/status` dan sebagai pesan diagnostik tindak lanjut setelah balasan assistant normal.

## Visibilitas reasoning (/reasoning)

- Level: `on|off|stream`.
- Pesan yang hanya berupa direktif mengaktifkan/mematikan apakah blok thinking ditampilkan dalam balasan.
- Saat diaktifkan, reasoning dikirim sebagai **pesan terpisah** dengan prefiks `Reasoning:`.
- `stream` (khusus Telegram): men-stream reasoning ke bubble draf Telegram saat balasan sedang dibuat, lalu mengirim jawaban final tanpa reasoning.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level reasoning saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per-agent (`agents.list[].reasoningDefault`), lalu fallback (`off`).

## Terkait

- Dokumentasi mode elevated ada di [Mode elevated](/id/tools/elevated).

## Heartbeat

- Body probe Heartbeat adalah prompt Heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif inline dalam pesan Heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari Heartbeat).
- Pengiriman Heartbeat default ke payload final saja. Untuk juga mengirim pesan `Reasoning:` terpisah (saat tersedia), setel `agents.defaults.heartbeat.includeReasoning: true` atau per-agent `agents.list[].heartbeat.includeReasoning: true`.

## UI obrolan web

- Pemilih thinking pada obrolan web mencerminkan level tersimpan sesi dari penyimpanan/config sesi masuk saat halaman dimuat.
- Memilih level lain menulis override sesi secara langsung melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override sekali pakai `thinkingOnce`.
- Opsi pertama selalu `Default (<resolved level>)`, di mana default hasil resolve berasal dari profil thinking provider model sesi aktif.
- Picker menggunakan `thinkingOptions` yang dikembalikan oleh baris sesi Gateway. UI browser tidak menyimpan daftar regex provider-nya sendiri; Plugin memiliki kumpulan level spesifik model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif obrolan dan picker tetap sinkron.

## Profil provider

- Plugin provider dapat mengekspos `resolveThinkingProfile(ctx)` untuk menentukan level yang didukung model dan default-nya.
- Setiap level profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Provider biner menggunakan `{ id: "low", label: "on" }`.
- Hook legacy yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adapter kompatibilitas, tetapi kumpulan level kustom baru seharusnya menggunakan `resolveThinkingProfile`.
- Baris Gateway mengekspos `thinkingOptions` dan `thinkingDefault` sehingga klien ACP/chat merender profil yang sama dengan yang digunakan validasi runtime.
