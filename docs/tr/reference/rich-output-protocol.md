---
read_when:
    - Control UI içinde assistant çıktı işlemesini değiştirme
    - '`[embed ...]`, `MEDIA:`, yanıt veya ses sunum yönergelerini ayıklama'
summary: Gömüler, medya, ses ipuçları ve yanıtlar için zengin çıktı kısa kod protokolü
title: Zengin Çıktı Protokolü
x-i18n:
    generated_at: "2026-04-23T09:10:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Zengin Çıktı Protokolü

Assistant çıktısı küçük bir teslim/render yönergesi kümesi taşıyabilir:

- ek teslimi için `MEDIA:`
- ses sunum ipuçları için `[[audio_as_voice]]`
- yanıt meta verisi için `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI zengin render için `[embed ...]`

Bu yönergeler ayrıdır. `MEDIA:` ve yanıt/ses etiketleri teslim meta verisi olarak kalır; `[embed ...]` yalnızca web'e özgü zengin render yoludur.

## `[embed ...]`

`[embed ...]`, Control UI için agent'a dönük tek zengin render söz dizimidir.

Kendi kendine kapanan örnek:

```text
[embed ref="cv_123" title="Durum" /]
```

Kurallar:

- `[view ...]` artık yeni çıktı için geçerli değildir.
- Embed kısa kodları yalnızca assistant mesaj yüzeyinde render edilir.
- Yalnızca URL destekli embed'ler render edilir. `ref="..."` veya `url="..."` kullanın.
- Blok biçimli satır içi HTML embed kısa kodları render edilmez.
- Web UI kısa kodu görünür metinden sıyırır ve embed'i satır içinde render eder.
- `MEDIA:` bir embed takma adı değildir ve zengin embed render için kullanılmamalıdır.

## Saklanan Render Şekli

Normalize edilmiş/saklanan assistant içerik bloğu yapılandırılmış bir `canvas` öğesidir:

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

Saklanan/render edilen zengin bloklar bu `canvas` şeklini doğrudan kullanır. `present_view` tanınmaz.
