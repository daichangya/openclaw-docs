---
read_when:
    - Sie möchten Grok für web_search verwenden
    - Sie benötigen einen `XAI_API_KEY` für die Websuche
summary: Grok-Websuche über web-grounded Responses von xAI
title: Grok Search
x-i18n:
    generated_at: "2026-04-05T12:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Grok Search

OpenClaw unterstützt Grok als `web_search`-Provider und verwendet web-grounded
Responses von xAI, um KI-synthetisierte Antworten zu erzeugen, die durch Live-Suchergebnisse
mit Zitaten gestützt werden.

Derselbe `XAI_API_KEY` kann auch das integrierte Tool `x_search` für die Suche in X-
Beiträgen (früher Twitter) betreiben. Wenn Sie den Schlüssel unter
`plugins.entries.xai.config.webSearch.apiKey` speichern, verwendet OpenClaw ihn jetzt auch als
Fallback für den gebündelten xAI-Modell-Provider.

Für Metriken auf Post-Ebene in X wie Reposts, Antworten, Lesezeichen oder Aufrufe
verwenden Sie bevorzugt `x_search` mit der exakten Post-URL oder Status-ID statt einer allgemeinen Such-
anfrage.

## Onboarding und Konfiguration

Wenn Sie **Grok** auswählen während:

- `openclaw onboard`
- `openclaw configure --section web`

kann OpenClaw einen separaten Folgeschritt anzeigen, um `x_search` mit demselben
`XAI_API_KEY` zu aktivieren. Dieser Folgeschritt:

- erscheint nur, nachdem Sie Grok für `web_search` ausgewählt haben
- ist keine separate Auswahl eines Web-Search-Providers auf oberster Ebene
- kann optional im selben Ablauf das `x_search`-Modell festlegen

Wenn Sie ihn überspringen, können Sie `x_search` später in der Konfiguration aktivieren oder ändern.

## API-Schlüssel abrufen

<Steps>
  <Step title="Schlüssel erstellen">
    Holen Sie sich einen API-Schlüssel von [xAI](https://console.x.ai/).
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `XAI_API_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn über:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternative über Umgebungsvariable:** Setzen Sie `XAI_API_KEY` in der Gateway-Umgebung.
Für eine Gateway-Installation fügen Sie ihn in `~/.openclaw/.env` ein.

## So funktioniert es

Grok verwendet web-grounded Responses von xAI, um Antworten mit Inline-
Zitaten zu synthetisieren, ähnlich dem Ansatz von Gemini mit Google Search grounding.

## Unterstützte Parameter

Die Grok-Suche unterstützt `query`.

`count` wird für die gemeinsame `web_search`-Kompatibilität akzeptiert, aber Grok gibt weiterhin
eine synthetisierte Antwort mit Zitaten statt einer N-Ergebnisliste zurück.

Providerspezifische Filter werden derzeit nicht unterstützt.

## Verwandt

- [Überblick über Web Search](/tools/web) -- alle Provider und automatische Erkennung
- [x_search in Web Search](/tools/web#x_search) -- erstklassige X-Suche über xAI
- [Gemini Search](/tools/gemini-search) -- KI-synthetisierte Antworten über Google-Grounding
