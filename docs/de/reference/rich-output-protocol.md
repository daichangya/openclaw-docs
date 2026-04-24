---
read_when:
    - Rendering der Assistant-Ausgabe in der Control UI ändern
    - Debuggen von Direktiven für Darstellung von `[embed ...]`, `MEDIA:`, Antworten oder Audio
summary: Shortcode-Protokoll für Rich Output für Embeds, Medien, Audio-Hinweise und Antworten
title: Rich-Output-Protokoll
x-i18n:
    generated_at: "2026-04-24T06:57:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Die Assistant-Ausgabe kann eine kleine Menge an Zustell-/Render-Direktiven enthalten:

- `MEDIA:` für die Zustellung von Anhängen
- `[[audio_as_voice]]` für Hinweise zur Audio-Darstellung
- `[[reply_to_current]]` / `[[reply_to:<id>]]` für Antwort-Metadaten
- `[embed ...]` für Rich Rendering in der Control UI

Diese Direktiven sind voneinander getrennt. `MEDIA:` und Tags für Antwort/Sprache bleiben Zustellungs-Metadaten; `[embed ...]` ist der rein webbasierte Pfad für Rich Rendering.

## `[embed ...]`

`[embed ...]` ist die einzige agentenseitige Rich-Render-Syntax für die Control UI.

Beispiel zum Selbstschließen:

```text
[embed ref="cv_123" title="Status" /]
```

Regeln:

- `[view ...]` ist für neue Ausgaben nicht mehr gültig.
- Embed-Shortcodes werden nur in der Nachrichtenoberfläche des Assistant gerendert.
- Nur URL-gestützte Embeds werden gerendert. Verwenden Sie `ref="..."` oder `url="..."`.
- Blockförmige Inline-HTML-Embed-Shortcodes werden nicht gerendert.
- Die Web-UI entfernt den Shortcode aus dem sichtbaren Text und rendert das Embed inline.
- `MEDIA:` ist kein Alias für Embeds und sollte nicht für Rich-Embed-Rendering verwendet werden.

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

## Verwandt

- [RPC adapters](/de/reference/rpc)
- [TypeBox](/de/concepts/typebox)
