---
read_when:
    - Menyesuaikan parsing atau default tingkat pemikiran, mode cepat, atau direktif verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat pemikiran
x-i18n:
    generated_at: "2026-04-25T13:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## Fungsinya

- Direktif inline di body masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (anggaran maksimum)
  - xhigh → “ultrathink+” (model GPT-5.2+ dan Codex, ditambah effort Anthropic Claude Opus 4.7)
  - adaptive → pemikiran adaptif yang dikelola provider (didukung untuk Claude 4.6 di Anthropic/Bedrock, Anthropic Claude Opus 4.7, dan Google Gemini dynamic thinking)
  - max → penalaran maksimum provider (saat ini Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan provider:
  - Menu dan picker thinking digerakkan oleh profil provider. Plugin provider mendeklarasikan set level yang tepat untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, dan `max` hanya diiklankan untuk profil provider/model yang mendukungnya. Direktif yang diketik untuk level yang tidak didukung ditolak dengan opsi valid milik model tersebut.
  - Level tersimpan yang sudah ada tetapi tidak didukung dipetakan ulang berdasarkan peringkat profil provider. `adaptive` fallback ke `medium` pada model non-adaptif, sedangkan `xhigh` dan `max` fallback ke level non-`off` terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 default ke `adaptive` ketika tidak ada level thinking eksplisit yang disetel.
  - Anthropic Claude Opus 4.7 tidak default ke pemikiran adaptif. Default effort API-nya tetap dimiliki provider kecuali Anda secara eksplisit menetapkan level thinking.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke pemikiran adaptif plus `output_config.effort: "xhigh"`, karena `/think` adalah direktif thinking dan `xhigh` adalah pengaturan effort Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; ini dipetakan ke jalur effort maksimum yang sama dan dimiliki provider.
  - Model OpenAI GPT memetakan `/think` melalui dukungan effort Responses API spesifik model. `/think off` mengirim `reasoning.effort: "none"` hanya ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload reasoning yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - Google Gemini memetakan `/think adaptive` ke dynamic thinking milik provider Gemini. Permintaan Gemini 3 menghilangkan `thinkingLevel` tetap, sedangkan permintaan Gemini 2.5 mengirim `thinkingBudget: -1`; level tetap tetap dipetakan ke `thinkingLevel` atau anggaran Gemini terdekat untuk keluarga model tersebut.
  - MiniMax (`minimax/*`) pada jalur streaming yang kompatibel dengan Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan thinking di parameter model atau parameter permintaan. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native milik MiniMax.
  - Z.AI (`zai/*`) hanya mendukung thinking biner (`on`/`off`). Level apa pun selain `off` diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level apa pun selain `off` ke `thinking: { type: "enabled" }`. Ketika thinking diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan itu).
2. Override sesi (disetel dengan mengirim pesan yang hanya berisi direktif).
3. Default per agen (`agents.list[].thinkingDefault` di konfigurasi).
4. Default global (`agents.defaults.thinkingDefault` di konfigurasi).
5. Fallback: default yang dideklarasikan provider jika tersedia; jika tidak, model yang mampu bernalar diresolusikan ke `medium` atau level non-`off` terdekat yang didukung untuk model itu, dan model non-penalaran tetap `off`.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi direktif (spasi diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Ini akan tetap berlaku untuk sesi saat ini (default per pengirim); dibersihkan oleh `/think:off` atau reset idle sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan state sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level thinking saat ini.

## Penerapan per agen

- **Embedded Pi**: level yang diresolusikan diteruskan ke runtime agen Pi in-process.

## Mode cepat (/fast)

- Level: `on|off`.
- Pesan yang hanya berisi direktif mengaktifkan/nonaktifkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat state mode cepat efektif saat ini.
- OpenClaw meresolusikan mode cepat dengan urutan ini:
  1. `/fast on|off` inline/hanya-direktif
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Konfigurasi per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur auth.
- Untuk permintaan langsung publik `anthropic/*`, termasuk trafik yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke service tier Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model `serviceTier` / `service_tier` Anthropic yang eksplisit menimpa default mode cepat ketika keduanya disetel. OpenClaw tetap melewati injeksi service-tier Anthropic untuk base URL proxy non-Anthropic.
- `/status` menampilkan `Fast` hanya ketika mode cepat diaktifkan.

## Direktif verbose (/verbose atau /v)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan/nonaktifkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level yang tidak valid mengembalikan petunjuk tanpa mengubah state.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sessions dengan memilih `inherit`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku dalam kondisi lain.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Ketika verbose aktif, agen yang mengeluarkan hasil alat terstruktur (Pi, agen JSON lainnya) mengirim balik setiap pemanggilan alat sebagai pesan khusus metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` bila tersedia (path/perintah). Ringkasan alat ini dikirim segera saat setiap alat dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan alat tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Ketika verbose adalah `full`, output alat juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang aman). Jika Anda mengubah `/verbose on|full|off` saat sebuah run sedang berlangsung, bubble alat berikutnya akan mengikuti pengaturan baru.

## Direktif trace Plugin (/trace)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan/nonaktifkan output trace Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku dalam kondisi lain.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level trace saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris trace/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris trace dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas penalaran (/reasoning)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengaktifkan/nonaktifkan apakah blok thinking ditampilkan dalam balasan.
- Ketika diaktifkan, reasoning dikirim sebagai **pesan terpisah** yang diawali dengan `Reasoning:`.
- `stream` (khusus Telegram): men-stream reasoning ke bubble draf Telegram saat balasan sedang dibuat, lalu mengirim jawaban akhir tanpa reasoning.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level reasoning saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu fallback (`off`).

## Terkait

- Dokumentasi mode elevated ada di [Mode elevated](/id/tools/elevated).

## Heartbeat

- Body probe Heartbeat adalah prompt heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif inline dalam pesan heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari heartbeat).
- Pengiriman Heartbeat default ke payload akhir saja. Untuk juga mengirim pesan `Reasoning:` terpisah (jika tersedia), setel `agents.defaults.heartbeat.includeReasoning: true` atau per agen `agents.list[].heartbeat.includeReasoning: true`.

## UI chat web

- Selector thinking chat web mencerminkan level tersimpan sesi dari penyimpanan/config sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override `thinkingOnce` sekali pakai.
- Opsi pertama selalu `Default (<resolved level>)`, di mana default yang diresolusikan berasal dari profil thinking provider model sesi aktif plus logika fallback yang sama yang digunakan `/status` dan `session_status`.
- Picker menggunakan `thinkingLevels` yang dikembalikan oleh baris/default sesi gateway, dengan `thinkingOptions` dipertahankan sebagai daftar label lama. UI browser tidak menyimpan daftar regex provider sendiri; plugin memiliki set level spesifik model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif chat dan picker tetap sinkron.

## Profil provider

- Plugin provider dapat mengekspos `resolveThinkingProfile(ctx)` untuk mendefinisikan level dan default yang didukung model.
- Setiap level profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Provider biner menggunakan `{ id: "low", label: "on" }`.
- Hook lama yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adaptor kompatibilitas, tetapi set level kustom baru sebaiknya menggunakan `resolveThinkingProfile`.
- Baris/default gateway mengekspos `thinkingLevels`, `thinkingOptions`, dan `thinkingDefault` sehingga klien ACP/chat merender id dan label profil yang sama seperti yang digunakan validasi runtime.
