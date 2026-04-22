---
read_when:
    - Menambahkan atau memodifikasi rendering kartu pesan, tombol, atau select
    - Membangun plugin channel yang mendukung pesan keluar yang kaya
    - Mengubah presentasi tool pesan atau kapabilitas pengiriman
    - Men-debug regresi rendering card/block/component spesifik provider
summary: Kartu pesan semantik, tombol, select, teks fallback, dan petunjuk pengiriman untuk plugin channel
title: Presentasi Pesan
x-i18n:
    generated_at: "2026-04-22T04:23:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# Presentasi Pesan

Presentasi pesan adalah kontrak bersama OpenClaw untuk UI chat keluar yang kaya.
Kontrak ini memungkinkan agent, perintah CLI, alur persetujuan, dan plugin untuk
mendeskripsikan intent pesan satu kali, sementara setiap plugin channel merender
bentuk native terbaik yang bisa didukungnya.

Gunakan presentasi untuk UI pesan yang portabel:

- bagian teks
- teks konteks/footer kecil
- divider
- tombol
- menu select
- judul dan tone kartu

Jangan tambahkan field native-provider baru seperti Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, atau Feishu `card` ke tool pesan
bersama. Itu adalah output renderer yang dimiliki plugin channel.

## Kontrak

Penulis plugin mengimpor kontrak publik dari:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Bentuknya:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
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

Semantik tombol:

- `value` adalah nilai aksi aplikasi yang diarahkan kembali melalui jalur
  interaksi channel yang sudah ada saat channel mendukung kontrol yang bisa diklik.
- `url` adalah tombol tautan. Ini dapat ada tanpa `value`.
- `label` wajib dan juga digunakan dalam fallback teks.
- `style` bersifat advisory. Renderer harus memetakan style yang tidak didukung ke
  default yang aman, bukan menggagalkan pengiriman.

Semantik select:

- `options[].value` adalah nilai aplikasi yang dipilih.
- `placeholder` bersifat advisory dan dapat diabaikan oleh channel tanpa
  dukungan select native.
- Jika sebuah channel tidak mendukung select, fallback teks menampilkan daftar label.

## Contoh producer

Kartu sederhana:

```json
{
  "title": "Persetujuan deploy",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary siap dipromosikan." },
    { "type": "context", "text": "Build 1234, staging lulus." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Setujui", "value": "deploy:approve", "style": "success" },
        { "label": "Tolak", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Tombol tautan khusus URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Catatan rilis sudah siap." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Buka catatan", "url": "https://example.com/release" }]
    }
  ]
}
```

Menu select:

```json
{
  "title": "Pilih environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Pengiriman CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Persetujuan deploy" \
  --presentation '{"title":"Persetujuan deploy","tone":"warning","blocks":[{"type":"text","text":"Canary siap."},{"type":"buttons","buttons":[{"label":"Setujui","value":"deploy:approve","style":"success"},{"label":"Tolak","value":"deploy:decline","style":"danger"}]}]}'
```

Pengiriman dengan pin:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topik dibuka" \
  --pin
```

Pengiriman dengan pin menggunakan JSON eksplisit:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Kontrak renderer

Plugin channel mendeklarasikan dukungan render pada adapter outbound mereka:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Field kapabilitas sengaja dibuat sebagai boolean sederhana. Field ini menjelaskan apa yang
dapat dibuat interaktif oleh renderer, bukan setiap batas platform native. Renderer tetap
memiliki batas spesifik platform seperti jumlah tombol maksimum, jumlah blok, dan
ukuran kartu.

## Alur render core

Saat `ReplyPayload` atau tindakan pesan menyertakan `presentation`, core:

1. Menormalisasi payload presentasi.
2. Me-resolve adapter outbound channel target.
3. Membaca `presentationCapabilities`.
4. Memanggil `renderPresentation` saat adapter dapat merender payload.
5. Melakukan fallback ke teks konservatif saat adapter tidak ada atau tidak dapat merender.
6. Mengirim payload yang dihasilkan melalui jalur pengiriman channel normal.
7. Menerapkan metadata pengiriman seperti `delivery.pin` setelah pesan pertama
   berhasil dikirim.

Core memiliki perilaku fallback sehingga producer dapat tetap channel-agnostik. Plugin
channel memiliki rendering native dan penanganan interaksi.

## Aturan degradasi

Presentasi harus aman dikirim pada channel yang terbatas.

Fallback teks mencakup:

- `title` sebagai baris pertama
- blok `text` sebagai paragraf normal
- blok `context` sebagai baris konteks ringkas
- blok `divider` sebagai pemisah visual
- label tombol, termasuk URL untuk tombol tautan
- label opsi select

Kontrol native yang tidak didukung harus melakukan degrade alih-alih menggagalkan seluruh pengiriman.
Contoh:

- Telegram dengan tombol inline nonaktif mengirim fallback teks.
- Channel tanpa dukungan select menampilkan opsi select sebagai teks.
- Tombol khusus URL menjadi tombol tautan native atau baris URL fallback.
- Kegagalan pin opsional tidak menggagalkan pesan yang sudah dikirim.

Pengecualian utamanya adalah `delivery.pin.required: true`; jika pin diminta sebagai
wajib dan channel tidak dapat mem-pin pesan terkirim, pengiriman dilaporkan gagal.

## Pemetaan provider

Renderer bawaan saat ini:

| Channel         | Target render native                 | Catatan                                                                                                                                           |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components dan component containers  | Mempertahankan `channelData.discord.components` lama untuk producer payload native-provider yang sudah ada, tetapi pengiriman shared baru harus menggunakan `presentation`. |
| Slack           | Block Kit                            | Mempertahankan `channelData.slack.blocks` lama untuk producer payload native-provider yang sudah ada, tetapi pengiriman shared baru harus menggunakan `presentation`.       |
| Telegram        | Teks plus inline keyboard            | Tombol/select memerlukan kapabilitas tombol inline untuk surface target; jika tidak, fallback teks digunakan.                                   |
| Mattermost      | Teks plus properti interaktif        | Blok lain melakukan degrade ke teks.                                                                                                             |
| Microsoft Teams | Adaptive Cards                       | Teks `message` polos disertakan bersama kartu saat keduanya diberikan.                                                                           |
| Feishu          | Kartu interaktif                     | Header kartu dapat menggunakan `title`; body menghindari duplikasi judul tersebut.                                                               |
| Channel polos   | Fallback teks                        | Channel tanpa renderer tetap mendapatkan output yang mudah dibaca.                                                                                |

Kompatibilitas payload native-provider adalah kemudahan transisi untuk producer
balasan yang sudah ada. Ini bukan alasan untuk menambahkan field native bersama yang baru.

## Presentasi vs InteractiveReply

`InteractiveReply` adalah subset internal lama yang digunakan oleh helper persetujuan dan interaksi.
Ini mendukung:

- teks
- tombol
- select

`MessagePresentation` adalah kontrak pengiriman bersama yang kanonis. Kontrak ini menambahkan:

- title
- tone
- context
- divider
- tombol khusus URL
- metadata pengiriman generik melalui `ReplyPayload.delivery`

Gunakan helper dari `openclaw/plugin-sdk/interactive-runtime` saat menjembatani
kode yang lebih lama:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Kode baru harus langsung menerima atau menghasilkan `MessagePresentation`.

## Pin pengiriman

Pinning adalah perilaku pengiriman, bukan presentasi. Gunakan `delivery.pin` alih-alih
field native-provider seperti `channelData.telegram.pin`.

Semantik:

- `pin: true` mem-pin pesan pertama yang berhasil dikirim.
- `pin.notify` default-nya `false`.
- `pin.required` default-nya `false`.
- Kegagalan pin opsional melakukan degrade dan membiarkan pesan yang dikirim tetap utuh.
- Kegagalan pin wajib menggagalkan pengiriman.
- Pesan yang di-chunk akan mem-pin chunk pertama yang dikirim, bukan chunk terakhir.

Tindakan pesan manual `pin`, `unpin`, dan `pins` tetap ada untuk pesan yang sudah ada
saat provider mendukung operasi tersebut.

## Checklist penulis plugin

- Deklarasikan `presentation` dari `describeMessageTool(...)` saat channel dapat
  merender atau secara aman melakukan degrade pada presentasi semantik.
- Tambahkan `presentationCapabilities` ke adapter outbound runtime.
- Implementasikan `renderPresentation` di kode runtime, bukan di kode setup plugin
  control-plane.
- Jauhkan library UI native dari jalur setup/katalog yang panas.
- Pertahankan batas platform di renderer dan test.
- Tambahkan test fallback untuk tombol yang tidak didukung, select, tombol URL, duplikasi title/teks,
  dan pengiriman campuran `message` plus `presentation`.
- Tambahkan dukungan pin pengiriman melalui `deliveryCapabilities.pin` dan
  `pinDeliveredMessage` hanya saat provider dapat mem-pin id pesan terkirim.
- Jangan mengekspos field card/block/component/button native-provider baru melalui
  skema tindakan pesan bersama.

## Docs terkait

- [CLI Pesan](/cli/message)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Arsitektur Plugin](/id/plugins/architecture#message-tool-schemas)
- [Rencana Refaktor Presentasi Channel](/id/plan/ui-channels)
