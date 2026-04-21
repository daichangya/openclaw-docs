---
read_when:
    - Sie möchten Kimi für `web_search` verwenden
    - Sie benötigen einen `KIMI_API_KEY` oder `MOONSHOT_API_KEY`
summary: Kimi-Websuche über Moonshot-Websuche
title: Kimi-Suche
x-i18n:
    generated_at: "2026-04-21T06:31:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi-Suche

OpenClaw unterstützt Kimi als Anbieter für `web_search` und verwendet die Moonshot-Websuche, um KI-synthetisierte Antworten mit Zitaten zu erzeugen.

## API-Schlüssel abrufen

<Steps>
  <Step title="Einen Schlüssel erstellen">
    Holen Sie sich einen API-Schlüssel von [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Den Schlüssel speichern">
    Setzen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der Gateway-Umgebung oder konfigurieren Sie dies über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wenn Sie **Kimi** während `openclaw onboard` oder
`openclaw configure --section web` auswählen, kann OpenClaw außerdem nach Folgendem fragen:

- der Moonshot-API-Region:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- dem Standardmodell für die Kimi-Websuche (Standard ist `kimi-k2.6`)

## Konfiguration

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional, wenn KIMI_API_KEY oder MOONSHOT_API_KEY gesetzt ist
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
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

Wenn Sie den China-API-Host für Chat verwenden (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), verwendet OpenClaw denselben Host auch für Kimi-`web_search`, wenn `tools.web.search.kimi.baseUrl` weggelassen wird, sodass Schlüssel von [platform.moonshot.cn](https://platform.moonshot.cn/) nicht versehentlich den internationalen Endpunkt treffen (der oft HTTP 401 zurückgibt). Überschreiben Sie dies mit `tools.web.search.kimi.baseUrl`, wenn Sie eine andere Basis-URL für die Suche benötigen.

**Umgebungsalternative:** Setzen Sie `KIMI_API_KEY` oder `MOONSHOT_API_KEY` in der Gateway-Umgebung. Für eine Gateway-Installation legen Sie ihn in `~/.openclaw/.env` ab.

Wenn Sie `baseUrl` weglassen, verwendet OpenClaw standardmäßig `https://api.moonshot.ai/v1`.
Wenn Sie `model` weglassen, verwendet OpenClaw standardmäßig `kimi-k2.6`.

## Wie es funktioniert

Kimi verwendet die Moonshot-Websuche, um Antworten mit Inline-Zitaten zu synthetisieren, ähnlich dem Ansatz geerdeter Antworten von Gemini und Grok.

## Unterstützte Parameter

Die Kimi-Suche unterstützt `query`.

`count` wird für die gemeinsame Kompatibilität mit `web_search` akzeptiert, aber Kimi gibt weiterhin eine synthetisierte Antwort mit Zitaten statt einer Liste mit N Ergebnissen zurück.

Anbieterspezifische Filter werden derzeit nicht unterstützt.

## Verwandt

- [Überblick Websuche](/de/tools/web) -- alle Anbieter und automatische Erkennung
- [Moonshot AI](/de/providers/moonshot) -- Doku zum Moonshot-Modell- + Kimi-Coding-Anbieter
- [Gemini Search](/de/tools/gemini-search) -- KI-synthetisierte Antworten über Google-Grounding
- [Grok Search](/de/tools/grok-search) -- KI-synthetisierte Antworten über xAI-Grounding
