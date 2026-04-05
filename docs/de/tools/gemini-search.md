---
read_when:
    - Sie möchten Gemini für web_search verwenden
    - Sie benötigen einen `GEMINI_API_KEY`
    - Sie möchten Google-Search-Grounding
summary: Gemini-Websuche mit Google-Search-Grounding
title: Gemini Search
x-i18n:
    generated_at: "2026-04-05T12:57:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Gemini Search

OpenClaw unterstützt Gemini-Modelle mit integriertem
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding),
das KI-synthetisierte Antworten zurückgibt, die durch Live-Google-Suchergebnisse mit
Zitaten gestützt werden.

## API-Schlüssel abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Gehen Sie zu [Google AI Studio](https://aistudio.google.com/apikey) und erstellen Sie einen
    API-Schlüssel.
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `GEMINI_API_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfiguration

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Alternative über Umgebungsvariable:** Setzen Sie `GEMINI_API_KEY` in der Gateway-Umgebung.
Für eine Gateway-Installation fügen Sie ihn in `~/.openclaw/.env` ein.

## So funktioniert es

Anders als herkömmliche Suchanbieter, die eine Liste von Links und Snippets zurückgeben,
verwendet Gemini Google-Search-Grounding, um KI-synthetisierte Antworten mit
Inline-Zitaten zu erzeugen. Die Ergebnisse enthalten sowohl die synthetisierte Antwort als auch die Quell-
URLs.

- Zitat-URLs aus Gemini-Grounding werden automatisch von Google-
  Weiterleitungs-URLs in direkte URLs aufgelöst.
- Die Auflösung von Weiterleitungen verwendet den SSRF-Guard-Pfad (HEAD + Redirect-Prüfungen +
  http/https-Validierung), bevor die endgültige Zitat-URL zurückgegeben wird.
- Die Auflösung von Weiterleitungen verwendet strenge SSRF-Standards, sodass Weiterleitungen auf
  private/interne Ziele blockiert werden.

## Unterstützte Parameter

Die Gemini-Suche unterstützt `query`.

`count` wird für die gemeinsame `web_search`-Kompatibilität akzeptiert, aber Gemini-Grounding
gibt weiterhin eine synthetisierte Antwort mit Zitaten statt einer N-Ergebnis-
Liste zurück.

Providerspezifische Filter wie `country`, `language`, `freshness` und
`domain_filter` werden nicht unterstützt.

## Modellauswahl

Das Standardmodell ist `gemini-2.5-flash` (schnell und kosteneffizient). Jedes Gemini-
Modell, das Grounding unterstützt, kann über
`plugins.entries.google.config.webSearch.model` verwendet werden.

## Verwandt

- [Überblick über Web Search](/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/tools/brave-search) -- strukturierte Ergebnisse mit Snippets
- [Perplexity Search](/tools/perplexity-search) -- strukturierte Ergebnisse + Inhalts-Extraktion
