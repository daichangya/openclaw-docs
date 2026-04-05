---
read_when:
    - Sie möchten PDFs aus Agents analysieren
    - Sie benötigen die genauen Parameter und Grenzen des PDF-Tools
    - Sie debuggen den nativen PDF-Modus im Vergleich zum Extraktions-Fallback
summary: Ein oder mehrere PDF-Dokumente mit nativer Provider-Unterstützung und Extraktions-Fallback analysieren
title: PDF-Tool
x-i18n:
    generated_at: "2026-04-05T12:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# PDF-Tool

`pdf` analysiert ein oder mehrere PDF-Dokumente und gibt Text zurück.

Kurzüberblick zum Verhalten:

- Nativer Provider-Modus für Modell-Provider von Anthropic und Google.
- Extraktions-Fallback-Modus für andere Provider (zuerst Text extrahieren, dann bei Bedarf Seitenbilder).
- Unterstützt einzelne (`pdf`) oder mehrere (`pdfs`) Eingaben, maximal 10 PDFs pro Aufruf.

## Verfügbarkeit

Das Tool wird nur registriert, wenn OpenClaw eine PDF-fähige Modellkonfiguration für den Agent auflösen kann:

1. `agents.defaults.pdfModel`
2. Fallback auf `agents.defaults.imageModel`
3. Fallback auf das aufgelöste Sitzungs-/Standardmodell des Agent
4. wenn native PDF-Provider authentifizierungsbasiert sind, werden sie vor generischen Image-Fallback-Kandidaten bevorzugt

Wenn kein verwendbares Modell aufgelöst werden kann, wird das Tool `pdf` nicht bereitgestellt.

Hinweise zur Verfügbarkeit:

- Die Fallback-Kette ist Auth-bewusst. Ein konfiguriertes `provider/model` zählt nur, wenn
  OpenClaw diesen Provider für den Agent tatsächlich authentifizieren kann.
- Native PDF-Provider sind derzeit **Anthropic** und **Google**.
- Wenn der aufgelöste Sitzungs-/Standard-Provider bereits ein konfiguriertes Vision-/PDF-
  Modell hat, verwendet das PDF-Tool dieses wieder, bevor auf andere authentifizierungsbasierte
  Provider zurückgegriffen wird.

## Eingabereferenz

- `pdf` (`string`): ein PDF-Pfad oder eine URL
- `pdfs` (`string[]`): mehrere PDF-Pfade oder URLs, insgesamt bis zu 10
- `prompt` (`string`): Analyse-Prompt, Standard `Analyze this PDF document.`
- `pages` (`string`): Seitenfilter wie `1-5` oder `1,3,7-9`
- `model` (`string`): optionale Modellüberschreibung (`provider/model`)
- `maxBytesMb` (`number`): Größenlimit pro PDF in MB

Hinweise zur Eingabe:

- `pdf` und `pdfs` werden vor dem Laden zusammengeführt und dedupliziert.
- Wenn keine PDF-Eingabe angegeben wird, gibt das Tool einen Fehler zurück.
- `pages` wird als 1-basierte Seitennummern geparst, dedupliziert, sortiert und auf die konfigurierte maximale Seitenzahl begrenzt.
- `maxBytesMb` ist standardmäßig `agents.defaults.pdfMaxBytesMb` oder `10`.

## Unterstützte PDF-Referenzen

- lokaler Dateipfad (einschließlich `~`-Erweiterung)
- `file://`-URL
- `http://`- und `https://`-URL

Hinweise zu Referenzen:

- Andere URI-Schemata (zum Beispiel `ftp://`) werden mit `unsupported_pdf_reference` abgelehnt.
- Im Sandbox-Modus werden entfernte `http(s)`-URLs abgelehnt.
- Wenn die Datei-Richtlinie nur für den Workspace aktiviert ist, werden lokale Dateipfade außerhalb der erlaubten Wurzeln abgelehnt.

## Ausführungsmodi

### Nativer Provider-Modus

Der native Modus wird für die Provider `anthropic` und `google` verwendet.
Das Tool sendet rohe PDF-Bytes direkt an Provider-APIs.

Grenzen des nativen Modus:

- `pages` wird nicht unterstützt. Wenn es gesetzt ist, gibt das Tool einen Fehler zurück.
- Mehrere PDFs als Eingabe werden unterstützt; jedes PDF wird vor dem Prompt als nativer Dokumentblock /
  inline-PDF-Teil gesendet.

### Extraktions-Fallback-Modus

Der Fallback-Modus wird für nicht-native Provider verwendet.

Ablauf:

1. Text aus ausgewählten Seiten extrahieren (bis zu `agents.defaults.pdfMaxPages`, Standard `20`).
2. Wenn die Länge des extrahierten Texts unter `200` Zeichen liegt, ausgewählte Seiten als PNG-Bilder rendern und hinzufügen.
3. Extrahierten Inhalt plus Prompt an das ausgewählte Modell senden.

Details zum Fallback:

- Die Extraktion von Seitenbildern verwendet ein Pixelbudget von `4,000,000`.
- Wenn das Zielmodell keine Bildeingabe unterstützt und kein extrahierbarer Text vorhanden ist, gibt das Tool einen Fehler zurück.
- Wenn die Textextraktion erfolgreich ist, die Bildextraktion aber Vision für ein
  reines Textmodell erfordern würde, entfernt OpenClaw die gerenderten Bilder und fährt mit dem
  extrahierten Text fort.
- Der Extraktions-Fallback erfordert `pdfjs-dist` (und `@napi-rs/canvas` für das Rendern von Bildern).

## Konfiguration

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Siehe [Configuration Reference](/de/gateway/configuration-reference) für vollständige Felddetails.

## Ausgabedetails

Das Tool gibt Text in `content[0].text` und strukturierte Metadaten in `details` zurück.

Häufige Felder in `details`:

- `model`: aufgelöste Modellreferenz (`provider/model`)
- `native`: `true` für nativen Provider-Modus, `false` für Fallback
- `attempts`: fehlgeschlagene Fallback-Versuche vor dem Erfolg

Pfadfelder:

- einzelne PDF-Eingabe: `details.pdf`
- mehrere PDF-Eingaben: `details.pdfs[]` mit `pdf`-Einträgen
- Metadaten zur Umschreibung von Sandbox-Pfaden (falls zutreffend): `rewrittenFrom`

## Fehlerverhalten

- Fehlende PDF-Eingabe: wirft `pdf required: provide a path or URL to a PDF document`
- Zu viele PDFs: gibt einen strukturierten Fehler in `details.error = "too_many_pdfs"` zurück
- Nicht unterstütztes Referenzschema: gibt `details.error = "unsupported_pdf_reference"` zurück
- Nativer Modus mit `pages`: wirft einen klaren Fehler `pages is not supported with native PDF providers`

## Beispiele

Einzelnes PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Mehrere PDFs:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Seitengefiltertes Fallback-Modell:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Verwandt

- [Tools Overview](/tools) — alle verfügbaren Agent-Tools
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Konfiguration für pdfMaxBytesMb und pdfMaxPages
