---
read_when:
    - Sie möchten Ollama für `web_search` verwenden
    - |-
      Sie möchten einen schlüsselfreien `web_search`-Provider օգտագործելӡаны to=functions.read კომენტary  天天乐购彩票json
      {"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-qa-testing/SKILL.md"}
    - Sie benötigen eine Anleitung zur Einrichtung von Ollama Web Search
summary: Ollama Web Search über Ihren konfigurierten Ollama-Host
title: Ollama-Websuche
x-i18n:
    generated_at: "2026-04-24T07:04:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw unterstützt **Ollama Web Search** als gebündelten `web_search`-Provider.
Er verwendet die experimentelle Web-Such-API von Ollama und gibt strukturierte Ergebnisse
mit Titeln, URLs und Snippets zurück.

Anders als der Ollama-Modell-Provider benötigt dieses Setup standardmäßig keinen API key.
Es erfordert jedoch:

- einen Ollama-Host, der von OpenClaw aus erreichbar ist
- `ollama signin`

## Einrichtung

<Steps>
  <Step title="Ollama starten">
    Stellen Sie sicher, dass Ollama installiert ist und läuft.
  </Step>
  <Step title="Anmelden">
    Führen Sie aus:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search auswählen">
    Führen Sie aus:

    ```bash
    openclaw configure --section web
    ```

    Wählen Sie dann **Ollama Web Search** als Provider.

  </Step>
</Steps>

Wenn Sie Ollama bereits für Modelle verwenden, nutzt Ollama Web Search denselben
konfigurierten Host wieder.

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Optionale Überschreibung des Ollama-Hosts:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Wenn keine explizite Ollama-Base-URL gesetzt ist, verwendet OpenClaw `http://127.0.0.1:11434`.

Wenn Ihr Ollama-Host Bearer-Auth erwartet, verwendet OpenClaw für Web-Such-Anfragen ebenfalls
`models.providers.ollama.apiKey` (oder die passende env-gestützte Provider-Auth).

## Hinweise

- Für diesen Provider ist kein websuchspezifisches API-key-Feld erforderlich.
- Wenn der Ollama-Host auth-geschützt ist, verwendet OpenClaw den normalen API key des Ollama-
  Providers wieder, sofern vorhanden.
- OpenClaw warnt während des Setups, wenn Ollama nicht erreichbar oder nicht angemeldet ist,
  blockiert die Auswahl aber nicht.
- Die Laufzeit-Auto-Erkennung kann auf Ollama Web Search zurückfallen, wenn kein Provider mit
  höherer Priorität und konfigurierten Zugangsdaten vorhanden ist.
- Der Provider verwendet den experimentellen Endpunkt `/api/experimental/web_search`
  von Ollama.

## Verwandt

- [Web Search overview](/de/tools/web) -- alle Provider und Auto-Erkennung
- [Ollama](/de/providers/ollama) -- Einrichtung von Ollama-Modellen und Cloud-/Lokal-Modi
