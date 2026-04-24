---
read_when:
    - Sie möchten PDFs aus Agenten heraus analysieren
    - Sie benötigen die genauen Parameter und Limits des PDF-Tools
    - Sie debuggen den nativen PDF-Modus gegenüber dem Extraktions-Fallback
summary: Ein oder mehrere PDF-Dokumente mit nativer Provider-Unterstützung und Extraktions-Fallback analysieren
title: PDF-Tool
x-i18n:
    generated_at: "2026-04-24T07:04:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analysiert ein oder mehrere PDF-Dokumente und gibt Text zurück.

Kurzes Verhalten:

- Nativer Provider-Modus für die Modellanbieter Anthropic und Google.
- Extraktions-Fallback-Modus für andere Anbieter (zuerst Text extrahieren, dann bei Bedarf Seitenbilder).
- Unterstützt einzelne (`pdf`) oder mehrere (`pdfs`) Eingaben, maximal 10 PDFs pro Aufruf.

## Verfügbarkeit

Das Tool wird nur registriert, wenn OpenClaw für den Agenten eine PDF-fähige Modellkonfiguration auflösen kann:

1. `agents.defaults.pdfModel`
2. Fallback auf `agents.defaults.imageModel`
3. Fallback auf das aufgelöste Sitzungs-/Standardmodell des Agenten
4. wenn native PDF-Anbieter auth-gestützt sind, diese vor generischen bildbasierten Fallback-Kandidaten bevorzugen

Wenn kein verwendbares Modell aufgelöst werden kann, wird das Tool `pdf` nicht bereitgestellt.

Hinweise zur Verfügbarkeit:

- Die Fallback-Kette ist auth-bewusst. Ein konfiguriertes `provider/model` zählt nur,
  wenn OpenClaw diesen Anbieter für den Agenten tatsächlich authentifizieren kann.
- Native PDF-Anbieter sind derzeit **Anthropic** und **Google**.
- Wenn der aufgelöste Anbieter der Sitzung/des Standards bereits ein konfiguriertes Vision-/PDF-
  Modell hat, verwendet das PDF-Tool dieses erneut, bevor auf andere auth-gestützte
  Anbieter zurückgegriffen wird.

## Eingabereferenz

<ParamField path="pdf" type="string">
Ein PDF-Pfad oder eine PDF-URL.
</ParamField>

<ParamField path="pdfs" type="string[]">
Mehrere PDF-Pfade oder -URLs, insgesamt bis zu 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analyse-Prompt.
</ParamField>

<ParamField path="pages" type="string">
Seitenfilter wie `1-5` oder `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Optionale Modellüberschreibung im Format `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Größenlimit pro PDF in MB. Standard ist `agents.defaults.pdfMaxBytesMb` oder `10`.
</ParamField>

Hinweise zur Eingabe:

- `pdf` und `pdfs` werden vor dem Laden zusammengeführt und dedupliziert.
- Wenn keine PDF-Eingabe bereitgestellt wird, gibt das Tool einen Fehler aus.
- `pages` wird als 1-basierte Seitennummern geparst, dedupliziert, sortiert und auf die konfigurierte Maximalzahl von Seiten begrenzt.
- `maxBytesMb` hat standardmäßig den Wert `agents.defaults.pdfMaxBytesMb` oder `10`.

## Unterstützte PDF-Referenzen

- lokaler Dateipfad (einschließlich `~`-Erweiterung)
- `file://`-URL
- `http://`- und `https://`-URL

Hinweise zu Referenzen:

- Andere URI-Schemata (zum Beispiel `ftp://`) werden mit `unsupported_pdf_reference` abgelehnt.
- Im Sandbox-Modus werden entfernte `http(s)`-URLs abgelehnt.
- Wenn die Dateirichtlinie „nur Workspace“ aktiviert ist, werden lokale Dateipfade außerhalb der erlaubten Roots abgelehnt.

## Ausführungsmodi

### Nativer Provider-Modus

Der native Modus wird für den Anbieter `anthropic` und `google` verwendet.
Das Tool sendet rohe PDF-Bytes direkt an Provider-APIs.

Grenzen des nativen Modus:

- `pages` wird nicht unterstützt. Wenn gesetzt, gibt das Tool einen Fehler zurück.
- Eingaben mit mehreren PDFs werden unterstützt; jede PDF wird als nativer Dokumentblock /
  eingebetteter PDF-Part vor dem Prompt gesendet.

### Extraktions-Fallback-Modus

Der Fallback-Modus wird für nicht native Anbieter verwendet.

Ablauf:

1. Text aus ausgewählten Seiten extrahieren (bis zu `agents.defaults.pdfMaxPages`, Standard `20`).
2. Wenn die Länge des extrahierten Texts unter `200` Zeichen liegt, ausgewählte Seiten zu PNG-Bildern rendern und einbeziehen.
3. Extrahierten Inhalt plus Prompt an das ausgewählte Modell senden.

Details zum Fallback:

- Die Extraktion von Seitenbildern verwendet ein Pixelbudget von `4,000,000`.
- Wenn das Zielmodell keine Bildeingaben unterstützt und kein extrahierbarer Text vorhanden ist, gibt das Tool einen Fehler aus.
- Wenn die Textextraktion erfolgreich ist, die Bildextraktion aber Vision für ein reines Textmodell erfordern würde, lässt OpenClaw die gerenderten Bilder weg und arbeitet mit dem extrahierten Text weiter.
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

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) für vollständige Felddetails.

## Ausgabedetails

Das Tool gibt Text in `content[0].text` und strukturierte Metadaten in `details` zurück.

Häufige Felder in `details`:

- `model`: aufgelöste Modellreferenz (`provider/model`)
- `native`: `true` für nativen Provider-Modus, `false` für Fallback
- `attempts`: fehlgeschlagene Fallback-Versuche vor dem Erfolg

Pfadfelder:

- einzelne PDF-Eingabe: `details.pdf`
- mehrere PDF-Eingaben: `details.pdfs[]` mit Einträgen `pdf`
- Metadaten für Umschreiben von Sandbox-Pfaden (wenn zutreffend): `rewrittenFrom`

## Fehlerverhalten

- Fehlende PDF-Eingabe: löst `pdf required: provide a path or URL to a PDF document` aus
- Zu viele PDFs: gibt strukturierten Fehler in `details.error = "too_many_pdfs"` zurück
- Nicht unterstütztes Referenzschema: gibt `details.error = "unsupported_pdf_reference"` zurück
- Nativer Modus mit `pages`: löst klaren Fehler `pages is not supported with native PDF providers` aus

## Beispiele

Einzelne PDF:

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

- [Tools-Überblick](/de/tools) — alle verfügbaren Agenten-Tools
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Konfiguration für pdfMaxBytesMb und pdfMaxPages
