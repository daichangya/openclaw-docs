---
read_when:
    - Du möchtest Ollama für `web_search` verwenden
    - Du möchtest einen schlüsselfreien `web_search`-Provider
    - Du benötigst eine Einrichtungsanleitung für die Ollama-Websuche
summary: Ollama-Websuche über deinen konfigurierten Ollama-Host
title: Ollama-Websuche
x-i18n:
    generated_at: "2026-04-05T12:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Ollama-Websuche

OpenClaw unterstützt **Ollama-Websuche** als gebündelten `web_search`-Provider.
Sie verwendet die experimentelle Websuch-API von Ollama und gibt strukturierte Ergebnisse
mit Titeln, URLs und Snippets zurück.

Anders als der Ollama-Modell-Provider benötigt dieses Setup standardmäßig
keinen API-Key. Es erfordert jedoch:

- einen Ollama-Host, der von OpenClaw aus erreichbar ist
- `ollama signin`

## Einrichtung

<Steps>
  <Step title="Ollama starten">
    Stelle sicher, dass Ollama installiert ist und läuft.
  </Step>
  <Step title="Anmelden">
    Führe Folgendes aus:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama-Websuche auswählen">
    Führe Folgendes aus:

    ```bash
    openclaw configure --section web
    ```

    Wähle dann **Ollama-Websuche** als Provider aus.

  </Step>
</Steps>

Wenn du Ollama bereits für Modelle verwendest, nutzt die Ollama-Websuche denselben
konfigurierten Host erneut.

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

Wenn dein Ollama-Host Bearer-Auth erwartet, verwendet OpenClaw
`models.providers.ollama.apiKey` (oder die passende env-gestützte Provider-Auth)
auch für Websuch-Anfragen erneut.

## Hinweise

- Für diesen Provider ist kein webspezifisches API-Key-Feld erforderlich.
- Wenn der Ollama-Host auth-geschützt ist, verwendet OpenClaw den normalen API-Key
  des Ollama-Providers erneut, falls vorhanden.
- OpenClaw warnt während der Einrichtung, wenn Ollama nicht erreichbar ist oder keine Anmeldung besteht,
  blockiert die Auswahl jedoch nicht.
- Die automatische Laufzeiterkennung kann auf die Ollama-Websuche zurückfallen, wenn kein Credential-Provider
  mit höherer Priorität konfiguriert ist.
- Der Provider verwendet den experimentellen Endpunkt `/api/experimental/web_search`
  von Ollama.

## Verwandt

- [Überblick zur Websuche](/tools/web) -- alle Provider und automatische Erkennung
- [Ollama](/providers/ollama) -- Einrichtung von Ollama-Modellen und Cloud-/lokale Modi
