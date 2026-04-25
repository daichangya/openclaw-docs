---
read_when:
    - Mengubah rendering output asisten di Control UI
    - Men-debug arahan presentasi `[embed ...]`, `MEDIA:`, balasan, atau audio
summary: Protokol shortcode rich output untuk embed, media, petunjuk audio, dan balasan
title: Protokol rich output
x-i18n:
    generated_at: "2026-04-25T13:56:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Output asisten dapat membawa sejumlah kecil arahan pengiriman/rendering:

- `MEDIA:` untuk pengiriman lampiran
- `[[audio_as_voice]]` untuk petunjuk presentasi audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` untuk metadata balasan
- `[embed ...]` untuk rich rendering di Control UI

Arahan-arahan ini terpisah. Tag `MEDIA:` dan reply/voice tetap menjadi metadata pengiriman; `[embed ...]` adalah jalur rich render khusus web.

Saat block streaming diaktifkan, `MEDIA:` tetap menjadi metadata pengiriman tunggal untuk satu
turn. Jika URL media yang sama dikirim dalam blok streaming dan diulang di payload
asisten final, OpenClaw mengirim lampiran satu kali dan menghapus duplikatnya
dari payload final.

## `[embed ...]`

`[embed ...]` adalah satu-satunya sintaks rich render yang menghadap agen untuk Control UI.

Contoh self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

Aturan:

- `[view ...]` tidak lagi valid untuk output baru.
- Shortcode embed hanya dirender di permukaan pesan asisten.
- Hanya embed berbasis URL yang dirender. Gunakan `ref="..."` atau `url="..."`.
- Shortcode embed HTML inline berbentuk blok tidak dirender.
- UI web menghapus shortcode dari teks yang terlihat dan merender embed secara inline.
- `MEDIA:` bukan alias embed dan tidak boleh digunakan untuk rich embed rendering.

## Bentuk rendering yang disimpan

Blok konten asisten yang dinormalisasi/disimpan adalah item `canvas` terstruktur:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Blok rich yang disimpan/dirender menggunakan bentuk `canvas` ini secara langsung. `present_view` tidak dikenali.

## Terkait

- [Adaptor RPC](/id/reference/rpc)
- [Typebox](/id/concepts/typebox)
