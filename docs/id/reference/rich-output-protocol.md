---
read_when:
    - Mengubah rendering output asisten di UI Control
    - Men-debug directive presentasi `[embed ...]`, `MEDIA:`, reply, atau audio
summary: Protokol shortcode rich output untuk embed, media, hint audio, dan balasan
title: Protokol Rich Output
x-i18n:
    generated_at: "2026-04-23T09:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Protokol Rich Output

Output asisten dapat membawa sekumpulan kecil directive pengiriman/rendering:

- `MEDIA:` untuk pengiriman lampiran
- `[[audio_as_voice]]` untuk hint presentasi audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` untuk metadata balasan
- `[embed ...]` untuk rendering kaya UI Control

Directive ini terpisah. `MEDIA:` dan tag balasan/suara tetap merupakan metadata pengiriman; `[embed ...]` adalah jalur render kaya khusus web.

## `[embed ...]`

`[embed ...]` adalah satu-satunya sintaks render kaya yang ditujukan ke agen untuk UI Control.

Contoh self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

Aturan:

- `[view ...]` tidak lagi valid untuk output baru.
- Shortcode embed dirender hanya di surface pesan asisten.
- Hanya embed berbasis URL yang dirender. Gunakan `ref="..."` atau `url="..."`.
- Shortcode embed HTML inline berbentuk blok tidak dirender.
- UI web menghapus shortcode dari teks yang terlihat dan merender embed secara inline.
- `MEDIA:` bukan alias embed dan tidak boleh digunakan untuk rendering rich embed.

## Bentuk Rendering yang Tersimpan

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

Blok kaya yang disimpan/dirender menggunakan bentuk `canvas` ini secara langsung. `present_view` tidak dikenali.
