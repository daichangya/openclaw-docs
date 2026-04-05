---
read_when:
    - Sie ändern die Markdown-Formatierung oder das Chunking für ausgehende Kanäle
    - Sie fügen einen neuen Kanal-Formatter oder ein neues Stil-Mapping hinzu
    - Sie debuggen Formatierungsregressionen kanalübergreifend
summary: Markdown-Formatierungspipeline für ausgehende Kanäle
title: Markdown-Formatierung
x-i18n:
    generated_at: "2026-04-05T12:39:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3794674e30e265208d14a986ba9bdc4ba52e0cb69c446094f95ca6c674e4566
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

# Markdown-Formatierung

OpenClaw formatiert ausgehendes Markdown, indem es in eine gemeinsame
Zwischendarstellung (IR) umgewandelt wird, bevor kanalspezifische Ausgabe gerendert wird. Die IR hält den
Quelltext intakt und trägt dabei Stil-/Link-Spans, sodass Chunking und Rendering
kanalübergreifend konsistent bleiben können.

## Ziele

- **Konsistenz:** ein Parse-Schritt, mehrere Renderer.
- **Sicheres Chunking:** Text vor dem Rendern aufteilen, damit Inline-Formatierung nie
  über Chunks hinweg bricht.
- **Passung pro Kanal:** dieselbe IR auf Slack mrkdwn, Telegram HTML und Signal-
  Stilbereiche abbilden, ohne Markdown erneut zu parsen.

## Pipeline

1. **Markdown -> IR parsen**
   - Die IR ist Klartext plus Stil-Spans (fett/kursiv/durchgestrichen/code/spoiler) und Link-Spans.
   - Offsets sind UTF-16-Codeeinheiten, sodass Signal-Stilbereiche mit seiner API übereinstimmen.
   - Tabellen werden nur geparst, wenn ein Kanal sich für die Tabellenkonvertierung entscheidet.
2. **IR chunking (Format zuerst)**
   - Chunking erfolgt auf dem IR-Text vor dem Rendern.
   - Inline-Formatierung wird nicht über Chunks hinweg geteilt; Spans werden pro Chunk zugeschnitten.
3. **Pro Kanal rendern**
   - **Slack:** mrkdwn-Tokens (fett/kursiv/durchgestrichen/code), Links als `<url|label>`.
   - **Telegram:** HTML-Tags (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** Klartext + `text-style`-Bereiche; Links werden zu `label (url)`, wenn sich das Label unterscheidet.

## IR-Beispiel

Eingabe-Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (schematisch):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Wo es verwendet wird

- Ausgehende Adapter für Slack, Telegram und Signal rendern aus der IR.
- Andere Kanäle (WhatsApp, iMessage, Microsoft Teams, Discord) verwenden weiterhin Klartext oder
  ihre eigenen Formatierungsregeln; dabei wird die Markdown-Tabellenkonvertierung vor dem
  Chunking angewendet, wenn sie aktiviert ist.

## Tabellenbehandlung

Markdown-Tabellen werden von Chat-Clients nicht konsistent unterstützt. Verwenden Sie
`markdown.tables`, um die Konvertierung pro Kanal (und pro Konto) zu steuern.

- `code`: Tabellen als Codeblöcke rendern (Standard für die meisten Kanäle).
- `bullets`: jede Zeile in Aufzählungspunkte umwandeln (Standard für Signal + WhatsApp).
- `off`: Tabellen-Parsing und -Konvertierung deaktivieren; roher Tabellen-Text wird durchgereicht.

Konfigurationsschlüssel:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Chunking-Regeln

- Chunk-Limits kommen aus Kanaladaptern/-konfiguration und werden auf den IR-Text angewendet.
- Code-Fences werden als einzelner Block mit abschließendem Zeilenumbruch beibehalten, damit Kanäle
  sie korrekt rendern.
- Listenpräfixe und Blockquote-Präfixe sind Teil des IR-Textes, sodass Chunking
  nicht mitten in einem Präfix trennt.
- Inline-Stile (fett/kursiv/durchgestrichen/inline-code/spoiler) werden nie über
  Chunks hinweg geteilt; der Renderer öffnet Stile in jedem Chunk erneut.

Wenn Sie mehr über das Verhalten von Chunking kanalübergreifend wissen müssen, siehe
[Streaming + chunking](/concepts/streaming).

## Link-Richtlinie

- **Slack:** `[label](url)` -> `<url|label>`; nackte URLs bleiben nackt. Autolink
  ist beim Parsen deaktiviert, um doppelte Verlinkung zu vermeiden.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-Parse-Modus).
- **Signal:** `[label](url)` -> `label (url)`, sofern das Label nicht der URL entspricht.

## Spoiler

Spoiler-Markierungen (`||spoiler||`) werden nur für Signal geparst, wo sie auf
SPOILER-Stilbereiche abgebildet werden. Andere Kanäle behandeln sie als Klartext.

## So fügen Sie einen Kanal-Formatter hinzu oder aktualisieren ihn

1. **Einmal parsen:** Verwenden Sie den gemeinsamen Helper `markdownToIR(...)` mit kanalgeeigneten
   Optionen (Autolink, Überschriftenstil, Blockquote-Präfix).
2. **Rendern:** Implementieren Sie einen Renderer mit `renderMarkdownWithMarkers(...)` und einer
   Stil-Marker-Map (oder Signal-Stilbereichen).
3. **Chunking:** Rufen Sie `chunkMarkdownIR(...)` vor dem Rendern auf; rendern Sie jeden Chunk.
4. **Adapter verdrahten:** Aktualisieren Sie den ausgehenden Kanaladapter, damit er den neuen Chunker
   und Renderer verwendet.
5. **Testen:** Fügen Sie Formatierungstests hinzu oder aktualisieren Sie sie sowie einen Test für die ausgehende Zustellung, wenn der
   Kanal Chunking verwendet.

## Häufige Stolperfallen

- Slack-Winkelklammer-Tokens (`<@U123>`, `<#C123>`, `<https://...>`) müssen
  erhalten bleiben; maskieren Sie rohes HTML sicher.
- Telegram-HTML erfordert das Escapen von Text außerhalb von Tags, um fehlerhaftes Markup zu vermeiden.
- Signal-Stilbereiche hängen von UTF-16-Offsets ab; verwenden Sie keine Codepoint-Offsets.
- Behalten Sie abschließende Zeilenumbrüche für eingefasste Codeblöcke bei, damit schließende Marker in
  ihrer eigenen Zeile landen.
