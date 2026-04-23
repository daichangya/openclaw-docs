---
read_when:
    - Ändern des Renderings von Assistant-Ausgaben in der Control UI
    - Debuggen von Direktiven für `[embed ...]`, `MEDIA:`, Antwort oder Audiodarstellung
summary: Rich-Output-Shortcode-Protokoll für Embeds, Medien, Audio-Hinweise und Antworten
title: Rich-Output-Protokoll
x-i18n:
    generated_at: "2026-04-23T14:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Rich-Output-Protokoll

Assistant-Ausgaben können einen kleinen Satz von Zustellungs-/Rendering-Direktiven enthalten:

- `MEDIA:` für die Zustellung von Anhängen
- `[[audio_as_voice]]` für Hinweise zur Audiodarstellung
- `[[reply_to_current]]` / `[[reply_to:<id>]]` für Antwortmetadaten
- `[embed ...]` für Rich Rendering in der Control UI

Diese Direktiven sind voneinander getrennt. `MEDIA:` und Antwort-/Voice-Tags bleiben Zustellungsmetadaten; `[embed ...]` ist der nur fürs Web gedachte Pfad für Rich Rendering.

## `[embed ...]`

`[embed ...]` ist die einzige agentseitige Syntax für Rich Rendering in der Control UI.

Beispiel zum Selbstschließen:

```text
[embed ref="cv_123" title="Status" /]
```

Regeln:

- `[view ...]` ist für neue Ausgaben nicht mehr gültig.
- Embed-Shortcodes werden nur in der Nachrichtenoberfläche des Assistant gerendert.
- Es werden nur URL-gestützte Embeds gerendert. Verwenden Sie `ref="..."` oder `url="..."`.
- Blockförmige Inline-HTML-Embed-Shortcodes werden nicht gerendert.
- Die Web-UI entfernt den Shortcode aus dem sichtbaren Text und rendert das Embed inline.
- `MEDIA:` ist kein Embed-Alias und sollte nicht für Rich-Embed-Rendering verwendet werden.

## Gespeicherte Rendering-Form

Der normalisierte/gespeicherte Inhaltsblock des Assistant ist ein strukturiertes `canvas`-Element:

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

Gespeicherte/gerenderte Rich-Blöcke verwenden diese `canvas`-Form direkt. `present_view` wird nicht erkannt.
