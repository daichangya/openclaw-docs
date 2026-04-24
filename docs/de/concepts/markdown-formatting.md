---
read_when:
    - Sie ändern die Markdown-Formatierung oder Chunking für ausgehende Kanäle.
    - Sie fügen einen neuen Kanal-Formatter oder eine neue Stilzuordnung hinzu.
    - Sie debuggen Formatierungsregressionen über mehrere Kanäle hinweg.
summary: Markdown-Formatierungspipeline für ausgehende Kanäle
title: Markdown-Formatierung
x-i18n:
    generated_at: "2026-04-24T06:34:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw formatiert ausgehendes Markdown, indem es es vor dem Rendern kanalspezifischer Ausgabe in eine gemeinsame Zwischenrepräsentation (IR) umwandelt. Die IR hält den
Quelltext intakt und trägt gleichzeitig Stil-/Link-Spans, sodass Chunking und Rendering
über Kanäle hinweg konsistent bleiben können.

## Ziele

- **Konsistenz:** ein Parsing-Schritt, mehrere Renderer.
- **Sicheres Chunking:** Text vor dem Rendern aufteilen, damit Inline-Formatierung
  niemals über Chunks hinweg bricht.
- **An den Kanal angepasst:** dieselbe IR auf Slack-mrkdwn, Telegram-HTML und Signal-
  Stilbereiche abbilden, ohne Markdown erneut zu parsen.

## Pipeline

1. **Markdown -> IR parsen**
   - Die IR ist Klartext plus Stil-Spans (fett/kursiv/durchgestrichen/code/spoiler) und Link-Spans.
   - Offsets sind UTF-16-Codeeinheiten, damit Stilbereiche in Signal mit dessen API übereinstimmen.
   - Tabellen werden nur geparst, wenn ein Kanal die Tabellenkonvertierung aktiviert.
2. **IR in Chunks aufteilen (format-first)**
   - Das Chunking erfolgt auf dem IR-Text vor dem Rendern.
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

## Wo sie verwendet wird

- Ausgehende Adapter für Slack, Telegram und Signal rendern aus der IR.
- Andere Kanäle (WhatsApp, iMessage, Microsoft Teams, Discord) verwenden weiterhin Klartext oder
  ihre eigenen Formatierungsregeln, wobei die Konvertierung von Markdown-Tabellen vor dem
  Chunking angewendet wird, wenn sie aktiviert ist.

## Tabellenbehandlung

Markdown-Tabellen werden von Chat-Clients nicht einheitlich unterstützt. Verwenden Sie
`markdown.tables`, um die Konvertierung pro Kanal (und pro Konto) zu steuern.

- `code`: Tabellen als Codeblöcke rendern (Standard für die meisten Kanäle).
- `bullets`: jede Zeile in Aufzählungspunkte umwandeln (Standard für Signal + WhatsApp).
- `off`: Tabellenparsing und -konvertierung deaktivieren; der rohe Tabellentext wird unverändert durchgereicht.

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

- Chunk-Grenzen kommen von Kanaladaptern/-konfigurationen und werden auf den IR-Text angewendet.
- Code Fences werden als einzelner Block mit abschließendem Zeilenumbruch beibehalten, damit Kanäle
  sie korrekt rendern.
- Listenpräfixe und Blockquote-Präfixe sind Teil des IR-Texts, sodass das Chunking
  sie nicht mitten im Präfix aufteilt.
- Inline-Stile (fett/kursiv/durchgestrichen/inline-code/spoiler) werden niemals über
  Chunks hinweg geteilt; der Renderer öffnet Stile innerhalb jedes Chunks erneut.

Wenn Sie mehr über das Chunking-Verhalten über Kanäle hinweg wissen möchten, siehe
[Streaming + Chunking](/de/concepts/streaming).

## Link-Richtlinie

- **Slack:** `[label](url)` -> `<url|label>`; rohe URLs bleiben roh. Autolink
  ist während des Parsens deaktiviert, um doppelte Verlinkung zu vermeiden.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML-Parse-Modus).
- **Signal:** `[label](url)` -> `label (url)`, sofern das Label nicht mit der URL übereinstimmt.

## Spoiler

Spoiler-Markierungen (`||spoiler||`) werden nur für Signal geparst, wo sie auf
SPOILER-Stilbereiche abgebildet werden. Andere Kanäle behandeln sie als Klartext.

## So fügen Sie einen Kanal-Formatter hinzu oder aktualisieren ihn

1. **Einmal parsen:** Verwenden Sie den gemeinsamen Helper `markdownToIR(...)` mit kanalgeeigneten
   Optionen (autolink, Überschriftenstil, Blockquote-Präfix).
2. **Rendern:** Implementieren Sie einen Renderer mit `renderMarkdownWithMarkers(...)` und einer
   Stil-Markierungszuordnung (oder Signal-Stilbereichen).
3. **Chunking:** Rufen Sie `chunkMarkdownIR(...)` vor dem Rendern auf; rendern Sie jeden Chunk.
4. **Adapter anbinden:** Aktualisieren Sie den ausgehenden Kanaladapter so, dass er den neuen Chunker
   und Renderer verwendet.
5. **Testen:** Fügen Sie Formatierungstests und, falls der
   Kanal Chunking verwendet, einen Test für die ausgehende Zustellung hinzu oder aktualisieren Sie sie.

## Häufige Stolperfallen

- Slack-Angle-Bracket-Tokens (`<@U123>`, `<#C123>`, `<https://...>`) müssen
  erhalten bleiben; escapen Sie rohes HTML sicher.
- Telegram-HTML erfordert das Escapen von Text außerhalb von Tags, um fehlerhaftes Markup zu vermeiden.
- Signal-Stilbereiche hängen von UTF-16-Offsets ab; verwenden Sie keine Codepoint-Offsets.
- Behalten Sie abschließende Zeilenumbrüche für fenced Codeblöcke bei, damit schließende Markierungen in
  ihrer eigenen Zeile landen.

## Verwandt

- [Streaming und Chunking](/de/concepts/streaming)
- [System-Prompt](/de/concepts/system-prompt)
