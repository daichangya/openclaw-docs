---
read_when:
    - Merombak UI pesan channel, payload interaktif, atau renderer native channel
    - Mengubah kapabilitas tool pesan, petunjuk pengiriman, atau penanda lintas konteks
    - Men-debug fanout impor Discord Carbon atau kelazy-an runtime plugin channel
summary: Pisahkan presentasi pesan semantik dari renderer UI native channel.
title: Rencana Refaktor Presentasi Channel
x-i18n:
    generated_at: "2026-04-22T04:23:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# Rencana Refaktor Presentasi Channel

## Status

Diimplementasikan untuk surface shared agent, CLI, kapabilitas plugin, dan pengiriman keluar:

- `ReplyPayload.presentation` membawa UI pesan semantik.
- `ReplyPayload.delivery.pin` membawa permintaan pin pesan terkirim.
- Tindakan pesan bersama mengekspos `presentation`, `delivery`, dan `pin` alih-alih `components`, `blocks`, `buttons`, atau `card` yang native-provider.
- Core merender atau melakukan auto-degrade presentasi melalui kapabilitas keluar yang dideklarasikan plugin.
- Renderer Discord, Slack, Telegram, Mattermost, Microsoft Teams, dan Feishu menggunakan kontrak generik.
- Kode control-plane channel Discord tidak lagi mengimpor container UI berbasis Carbon.

Dokumentasi kanonis sekarang ada di [Message Presentation](/id/plugins/message-presentation).
Pertahankan rencana ini sebagai konteks implementasi historis; perbarui panduan kanonis
untuk perubahan kontrak, renderer, atau perilaku fallback.

## Masalah

UI channel saat ini terbagi di beberapa surface yang tidak kompatibel:

- Core memiliki hook renderer lintas konteks berbentuk Discord melalui `buildCrossContextComponents`.
- `channel.ts` Discord dapat mengimpor UI Carbon native melalui `DiscordUiContainer`, yang menarik dependensi UI runtime ke control plane plugin channel.
- Agent dan CLI mengekspos escape hatch payload native seperti Discord `components`, Slack `blocks`, Telegram atau Mattermost `buttons`, dan Teams atau Feishu `card`.
- `ReplyPayload.channelData` membawa petunjuk transport dan envelope UI native.
- Model `interactive` generik memang ada, tetapi lebih sempit daripada layout yang lebih kaya yang sudah digunakan oleh Discord, Slack, Teams, Feishu, LINE, Telegram, dan Mattermost.

Ini membuat core sadar akan bentuk UI native, melemahkan kelazy-an runtime plugin, dan memberi agent terlalu banyak cara spesifik provider untuk mengekspresikan intent pesan yang sama.

## Tujuan

- Core memutuskan presentasi semantik terbaik untuk sebuah pesan dari kapabilitas yang dideklarasikan.
- Extension mendeklarasikan kapabilitas dan merender presentasi semantik ke payload transport native.
- UI Control web tetap terpisah dari UI native chat.
- Payload channel native tidak diekspos melalui surface pesan shared agent atau CLI.
- Fitur presentasi yang tidak didukung melakukan auto-degrade ke representasi teks terbaik.
- Perilaku pengiriman seperti pin pesan terkirim adalah metadata pengiriman generik, bukan presentasi.

## Bukan Tujuan

- Tidak ada shim kompatibilitas mundur untuk `buildCrossContextComponents`.
- Tidak ada escape hatch native publik untuk `components`, `blocks`, `buttons`, atau `card`.
- Tidak ada impor core atas library UI native-channel.
- Tidak ada seam SDK spesifik provider untuk channel bawaan.

## Model Target

Tambahkan field `presentation` milik core ke `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

`interactive` menjadi subset dari `presentation` selama migrasi:

- Blok teks `interactive` dipetakan ke `presentation.blocks[].type = "text"`.
- Blok tombol `interactive` dipetakan ke `presentation.blocks[].type = "buttons"`.
- Blok select `interactive` dipetakan ke `presentation.blocks[].type = "select"`.

Skema agent eksternal dan CLI sekarang menggunakan `presentation`; `interactive` tetap menjadi helper parser/rendering lama internal untuk produser balasan yang sudah ada.

## Metadata Pengiriman

Tambahkan field `delivery` milik core untuk perilaku pengiriman yang bukan UI.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semantik:

- `delivery.pin = true` berarti pin pesan pertama yang berhasil dikirim.
- `notify` default-nya `false`.
- `required` default-nya `false`; channel yang tidak didukung atau pinning yang gagal melakukan auto-degrade dengan tetap melanjutkan pengiriman.
- Tindakan pesan manual `pin`, `unpin`, dan `list-pins` tetap ada untuk pesan yang sudah ada.

Binding topik ACP Telegram saat ini harus dipindahkan dari `channelData.telegram.pin = true` ke `delivery.pin = true`.

## Kontrak Kapabilitas Runtime

Tambahkan hook render presentasi dan pengiriman ke adapter outbound runtime, bukan plugin channel control-plane.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Perilaku core:

- Resolve channel target dan adapter runtime.
- Minta kapabilitas presentasi.
- Lakukan degrade pada blok yang tidak didukung sebelum rendering.
- Panggil `renderPresentation`.
- Jika tidak ada renderer, ubah presentasi ke fallback teks.
- Setelah pengiriman berhasil, panggil `pinDeliveredMessage` saat `delivery.pin` diminta dan didukung.

## Pemetaan Channel

Discord:

- Render `presentation` ke components v2 dan container Carbon dalam modul runtime-only.
- Pertahankan helper warna aksen di modul ringan.
- Hapus impor `DiscordUiContainer` dari kode control-plane plugin channel.

Slack:

- Render `presentation` ke Block Kit.
- Hapus input `blocks` pada agent dan CLI.

Telegram:

- Render teks, context, dan divider sebagai teks.
- Render action dan select sebagai inline keyboard saat dikonfigurasi dan diizinkan untuk surface target.
- Gunakan fallback teks saat tombol inline dinonaktifkan.
- Pindahkan pinning topik ACP ke `delivery.pin`.

Mattermost:

- Render action sebagai tombol interaktif saat dikonfigurasi.
- Render blok lain sebagai fallback teks.

Microsoft Teams:

- Render `presentation` ke Adaptive Cards.
- Pertahankan tindakan manual pin/unpin/list-pins.
- Secara opsional implementasikan `pinDeliveredMessage` jika dukungan Graph andal untuk percakapan target.

Feishu:

- Render `presentation` ke kartu interaktif.
- Pertahankan tindakan manual pin/unpin/list-pins.
- Secara opsional implementasikan `pinDeliveredMessage` untuk pinning pesan terkirim jika perilaku API andal.

LINE:

- Render `presentation` ke pesan Flex atau template bila memungkinkan.
- Fallback ke teks untuk blok yang tidak didukung.
- Hapus payload UI LINE dari `channelData`.

Channel polos atau terbatas:

- Ubah presentasi ke teks dengan formatting konservatif.

## Langkah Refaktor

1. Terapkan ulang perbaikan rilis Discord yang memisahkan `ui-colors.ts` dari UI berbasis Carbon dan menghapus `DiscordUiContainer` dari `extensions/discord/src/channel.ts`.
2. Tambahkan `presentation` dan `delivery` ke `ReplyPayload`, normalisasi payload keluar, ringkasan pengiriman, dan payload hook.
3. Tambahkan skema `MessagePresentation` dan helper parser di subpath SDK/runtime yang sempit.
4. Ganti kapabilitas pesan `buttons`, `cards`, `components`, dan `blocks` dengan kapabilitas presentasi semantik.
5. Tambahkan hook adapter outbound runtime untuk render presentasi dan pinning pengiriman.
6. Ganti konstruksi komponen lintas konteks dengan `buildCrossContextPresentation`.
7. Hapus `src/infra/outbound/channel-adapters.ts` dan hapus `buildCrossContextComponents` dari tipe plugin channel.
8. Ubah `maybeApplyCrossContextMarker` agar menempelkan `presentation` alih-alih parameter native.
9. Perbarui jalur pengiriman plugin-dispatch agar hanya menggunakan presentasi semantik dan metadata pengiriman.
10. Hapus parameter payload native agent dan CLI: `components`, `blocks`, `buttons`, dan `card`.
11. Hapus helper SDK yang membuat skema message-tool native, ganti dengan helper skema presentasi.
12. Hapus envelope UI/native dari `channelData`; pertahankan hanya metadata transport sampai setiap field yang tersisa ditinjau.
13. Migrasikan renderer Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, dan LINE.
14. Perbarui docs untuk CLI pesan, halaman channel, SDK plugin, dan cookbook kapabilitas.
15. Jalankan profiling fanout impor untuk Discord dan entrypoint channel yang terdampak.

Langkah 1-11 dan 13-14 diimplementasikan dalam refaktor ini untuk kontrak shared agent, CLI, kapabilitas plugin, dan adapter outbound. Langkah 12 tetap menjadi pass pembersihan internal yang lebih dalam untuk envelope transport `channelData` privat-provider. Langkah 15 tetap menjadi validasi tindak lanjut jika kita ingin angka fanout impor yang terukur di luar gate type/test.

## Pengujian

Tambahkan atau perbarui:

- Pengujian normalisasi presentasi.
- Pengujian auto-degrade presentasi untuk blok yang tidak didukung.
- Pengujian marker lintas konteks untuk plugin dispatch dan jalur pengiriman core.
- Pengujian matriks render channel untuk Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE, dan fallback teks.
- Pengujian skema message tool yang membuktikan field native sudah hilang.
- Pengujian CLI yang membuktikan flag native sudah hilang.
- Regresi import-laziness entrypoint Discord yang mencakup Carbon.
- Pengujian pin pengiriman yang mencakup Telegram dan fallback generik.

## Pertanyaan Terbuka

- Apakah `delivery.pin` harus diimplementasikan untuk Discord, Slack, Microsoft Teams, dan Feishu pada pass pertama, atau Telegram saja dulu?
- Apakah `delivery` pada akhirnya harus menyerap field yang ada seperti `replyToId`, `replyToCurrent`, `silent`, dan `audioAsVoice`, atau tetap fokus pada perilaku pasca-pengiriman?
- Apakah presentasi harus mendukung gambar atau referensi file secara langsung, atau media harus tetap terpisah dari layout UI untuk saat ini?
