---
read_when:
    - Control UI'da asistan çıktı işlemeyi değiştirme
    - '`[embed ...]`, `MEDIA:`, `reply` veya ses sunum yönergelerinde hata ayıklama'
summary: Gömüler, medya, ses ipuçları ve yanıtlar için zengin çıktı shortcode protokolü
title: Zengin çıktı protokolü
x-i18n:
    generated_at: "2026-04-25T13:57:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Asistan çıktısı küçük bir teslim/render yönergesi kümesi taşıyabilir:

- Ek teslimi için `MEDIA:`
- Ses sunum ipuçları için `[[audio_as_voice]]`
- Yanıt üst verileri için `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI zengin render'ı için `[embed ...]`

Bu yönergeler ayrıdır. `MEDIA:` ve yanıt/ses etiketleri teslim üst verisi olarak kalır; `[embed ...]` yalnızca web'e özel zengin render yoludur.

Blok akışı etkin olduğunda, `MEDIA:` bir tur için tek teslim üst verisi olarak
kalır. Aynı medya URL'si akışlı bir blokta gönderilir ve son asistan
yükünde tekrar edilirse, OpenClaw eki bir kez teslim eder ve yineleneni son
yükten çıkarır.

## `[embed ...]`

`[embed ...]`, Control UI için ajana dönük tek zengin render sözdizimidir.

Kendi kendini kapatan örnek:

```text
[embed ref="cv_123" title="Status" /]
```

Kurallar:

- `[view ...]` artık yeni çıktı için geçerli değildir.
- Embed shortcode'ları yalnızca asistan mesajı yüzeyinde render edilir.
- Yalnızca URL destekli embed'ler render edilir. `ref="..."` veya `url="..."` kullanın.
- Blok biçimli satır içi HTML embed shortcode'ları render edilmez.
- Web UI, shortcode'u görünür metinden çıkarır ve embed'i satır içinde render eder.
- `MEDIA:` bir embed takma adı değildir ve zengin embed render'ı için kullanılmamalıdır.

## Depolanan render biçimi

Normalize edilmiş/depolanmış asistan içerik bloğu, yapılandırılmış bir `canvas` öğesidir:

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

Depolanan/render edilen zengin bloklar doğrudan bu `canvas` biçimini kullanır. `present_view` tanınmaz.

## İlgili

- [RPC bağdaştırıcıları](/tr/reference/rpc)
- [Typebox](/tr/concepts/typebox)
