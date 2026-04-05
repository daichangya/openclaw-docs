---
read_when:
    - Sie möchten Kimi für web_search verwenden
    - Sie benötigen einen `KIMI_API_KEY` oder `MOONSHOT_API_KEY`
summary: Kimi-Websuche über Moonshot-Websuche
title: Kimi Search
x-i18n:
    generated_at: "2026-04-05T12:57:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753757a5497a683c35b4509ed3709b9514dc14a45612675d0f729ae6668c82a5
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi Search

OpenClaw unterstützt Kimi als `web_search`-Provider und verwendet die Moonshot-Websuche,
um KI-synthetisierte Antworten mit Zitaten zu erzeugen.

## API-Schlüssel abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Holen Sie sich einen API-Schlüssel von [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der Gateway-Umgebung oder
    konfigurieren Sie dies über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wenn Sie **Kimi** während `openclaw onboard` oder
`openclaw configure --section web` auswählen, kann OpenClaw auch nach Folgendem fragen:

- der Moonshot-API-Region:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- dem Standardmodell für die Kimi-Websuche (Standard ist `kimi-k2.5`)

## Konfiguration

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Wenn Sie für Chat den China-API-Host verwenden (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), verwendet OpenClaw denselben Host auch für Kimi
`web_search`, wenn `tools.web.search.kimi.baseUrl` weggelassen wird, sodass Schlüssel von
[platform.moonshot.cn](https://platform.moonshot.cn/) nicht versehentlich den
internationalen Endpunkt treffen (der oft HTTP 401 zurückgibt). Überschreiben Sie dies
mit `tools.web.search.kimi.baseUrl`, wenn Sie eine andere Basis-URL für die Suche benötigen.

**Alternative über Umgebungsvariablen:** Setzen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der
Gateway-Umgebung. Für eine Gateway-Installation fügen Sie ihn in `~/.openclaw/.env` ein.

Wenn Sie `baseUrl` weglassen, verwendet OpenClaw standardmäßig `https://api.moonshot.ai/v1`.
Wenn Sie `model` weglassen, verwendet OpenClaw standardmäßig `kimi-k2.5`.

## So funktioniert es

Kimi verwendet die Moonshot-Websuche, um Antworten mit Inline-Zitaten zu synthetisieren,
ähnlich dem Grounded-Response-Ansatz von Gemini und Grok.

## Unterstützte Parameter

Die Kimi-Suche unterstützt `query`.

`count` wird für die gemeinsame `web_search`-Kompatibilität akzeptiert, aber Kimi gibt weiterhin
eine synthetisierte Antwort mit Zitaten statt einer N-Ergebnisliste zurück.

Providerspezifische Filter werden derzeit nicht unterstützt.

## Verwandt

- [Überblick über Web Search](/tools/web) -- alle Provider und automatische Erkennung
- [Moonshot AI](/providers/moonshot) -- Dokumentation zum Moonshot-Modell und Kimi-Coding-Provider
- [Gemini Search](/tools/gemini-search) -- KI-synthetisierte Antworten über Google-Grounding
- [Grok Search](/tools/grok-search) -- KI-synthetisierte Antworten über xAI-Grounding
