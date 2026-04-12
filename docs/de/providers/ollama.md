---
read_when:
    - Sie möchten OpenClaw über Ollama mit Cloud- oder lokalen Modellen ausführen
    - Sie benötigen Anleitungen für Einrichtung und Konfiguration von Ollama
summary: OpenClaw mit Ollama ausführen (Cloud- und lokale Modelle)
title: Ollama
x-i18n:
    generated_at: "2026-04-12T23:32:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec796241b884ca16ec7077df4f3f1910e2850487bb3ea94f8fdb37c77e02b219
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama ist eine lokale LLM-Laufzeit, mit der Sie Open-Source-Modelle einfach auf Ihrer Maschine ausführen können. OpenClaw integriert sich mit der nativen API von Ollama (`/api/chat`), unterstützt Streaming und Tool-Calling und kann lokale Ollama-Modelle automatisch erkennen, wenn Sie dies mit `OLLAMA_API_KEY` (oder einem Auth-Profil) aktivieren und keinen expliziten Eintrag `models.providers.ollama` definieren.

<Warning>
**Benutzer von Remote-Ollama**: Verwenden Sie nicht die OpenAI-kompatible URL `/v1` (`http://host:11434/v1`) mit OpenClaw. Dadurch wird Tool-Calling beschädigt, und Modelle können rohes Tool-JSON als Klartext ausgeben. Verwenden Sie stattdessen die native Ollama-API-URL: `baseUrl: "http://host:11434"` (ohne `/v1`).
</Warning>

## Erste Schritte

Wählen Sie Ihre bevorzugte Einrichtungsmethode und Ihren Modus.

<Tabs>
  <Tab title="Onboarding (empfohlen)">
    **Am besten geeignet für:** den schnellsten Weg zu einer funktionierenden Ollama-Einrichtung mit automatischer Modellerkennung.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        ```

        Wählen Sie **Ollama** aus der Provider-Liste aus.
      </Step>
      <Step title="Ihren Modus auswählen">
        - **Cloud + Lokal** — Cloud-gehostete Modelle und lokale Modelle zusammen
        - **Lokal** — nur lokale Modelle

        Wenn Sie **Cloud + Lokal** wählen und nicht bei ollama.com angemeldet sind, öffnet das Onboarding einen Browser-Anmeldefluss.
      </Step>
      <Step title="Ein Modell auswählen">
        Das Onboarding erkennt verfügbare Modelle und schlägt Standardwerte vor. Es zieht das ausgewählte Modell automatisch, wenn es lokal nicht verfügbar ist.
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Nicht interaktiver Modus

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Optional können Sie eine benutzerdefinierte Basis-URL oder ein Modell angeben:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manuelle Einrichtung">
    **Am besten geeignet für:** vollständige Kontrolle über Installation, Modell-Pulls und Konfiguration.

    <Steps>
      <Step title="Ollama installieren">
        Herunterladen von [ollama.com/download](https://ollama.com/download).
      </Step>
      <Step title="Ein lokales Modell ziehen">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Für Cloud-Modelle anmelden (optional)">
        Wenn Sie auch Cloud-Modelle möchten:

        ```bash
        ollama signin
        ```
      </Step>
      <Step title="Ollama für OpenClaw aktivieren">
        Setzen Sie einen beliebigen Wert für den API-Schlüssel (Ollama benötigt keinen echten Schlüssel):

        ```bash
        # Set environment variable
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "ollama-local"
        ```
      </Step>
      <Step title="Ihr Modell prüfen und festlegen">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Oder den Standardwert in der Konfiguration setzen:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Cloud-Modelle

<Tabs>
  <Tab title="Cloud + Lokal">
    Mit Cloud-Modellen können Sie Cloud-gehostete Modelle zusammen mit Ihren lokalen Modellen ausführen. Beispiele sind `kimi-k2.5:cloud`, `minimax-m2.7:cloud` und `glm-5.1:cloud` -- diese erfordern **kein** lokales `ollama pull`.

    Wählen Sie während der Einrichtung den Modus **Cloud + Lokal**. Der Assistent prüft, ob Sie angemeldet sind, und öffnet bei Bedarf einen Browser-Anmeldefluss. Wenn die Authentifizierung nicht verifiziert werden kann, fällt der Assistent auf Standardwerte für lokale Modelle zurück.

    Sie können sich auch direkt unter [ollama.com/signin](https://ollama.com/signin) anmelden.

    OpenClaw schlägt derzeit diese Cloud-Standardwerte vor: `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`.

  </Tab>

  <Tab title="Nur lokal">
    Im Modus „nur lokal“ erkennt OpenClaw Modelle von der lokalen Ollama-Instanz. Keine Cloud-Anmeldung erforderlich.

    OpenClaw schlägt derzeit `gemma4` als lokalen Standardwert vor.

  </Tab>
</Tabs>

## Modellerkennung (impliziter Provider)

Wenn Sie `OLLAMA_API_KEY` (oder ein Auth-Profil) setzen und **nicht** `models.providers.ollama` definieren, erkennt OpenClaw Modelle von der lokalen Ollama-Instanz unter `http://127.0.0.1:11434`.

| Verhalten            | Detail                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalogabfrage       | Fragt `/api/tags` ab                                                                                                                                                  |
| Capability-Erkennung | Verwendet Best-Effort-Abfragen an `/api/show`, um `contextWindow` auszulesen und Capabilities zu erkennen (einschließlich Vision)                                   |
| Vision-Modelle       | Modelle mit einer von `/api/show` gemeldeten `vision`-Capability werden als bildfähig markiert (`input: ["text", "image"]`), sodass OpenClaw Bilder automatisch in den Prompt injiziert |
| Reasoning-Erkennung  | Markiert `reasoning` mit einer Modellnamen-Heuristik (`r1`, `reasoning`, `think`)                                                                                    |
| Token-Limits         | Setzt `maxTokens` auf die von OpenClaw verwendete Standardobergrenze für Ollama-Max-Token                                                                            |
| Kosten               | Setzt alle Kosten auf `0`                                                                                                                                             |

Damit werden manuelle Modelleinträge vermieden, während der Katalog mit der lokalen Ollama-Instanz abgestimmt bleibt.

```bash
# See what models are available
ollama list
openclaw models list
```

Um ein neues Modell hinzuzufügen, ziehen Sie es einfach mit Ollama:

```bash
ollama pull mistral
```

Das neue Modell wird automatisch erkannt und steht zur Verwendung bereit.

<Note>
Wenn Sie `models.providers.ollama` explizit setzen, wird die automatische Erkennung übersprungen und Sie müssen Modelle manuell definieren. Siehe den Abschnitt zur expliziten Konfiguration unten.
</Note>

## Konfiguration

<Tabs>
  <Tab title="Einfach (implizite Erkennung)">
    Der einfachste Weg, Ollama zu aktivieren, ist über eine Umgebungsvariable:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Wenn `OLLAMA_API_KEY` gesetzt ist, können Sie `apiKey` im Provider-Eintrag weglassen, und OpenClaw ergänzt ihn für Verfügbarkeitsprüfungen.
    </Tip>

  </Tab>

  <Tab title="Explizit (manuelle Modelle)">
    Verwenden Sie eine explizite Konfiguration, wenn Ollama auf einem anderen Host/Port läuft, Sie bestimmte Kontextfenster oder Modelllisten erzwingen möchten oder vollständig manuelle Modelldefinitionen möchten.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            apiKey: "ollama-local",
            api: "ollama",
            models: [
              {
                id: "gpt-oss:20b",
                name: "GPT-OSS 20B",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8192,
                maxTokens: 8192 * 10
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Benutzerdefinierte Basis-URL">
    Wenn Ollama auf einem anderen Host oder Port läuft (explizite Konfiguration deaktiviert die automatische Erkennung, daher Modelle manuell definieren):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
          },
        },
      },
    }
    ```

    <Warning>
    Fügen Sie der URL kein `/v1` hinzu. Der Pfad `/v1` verwendet den OpenAI-kompatiblen Modus, in dem Tool-Calling nicht zuverlässig ist. Verwenden Sie die Basis-Ollama-URL ohne Pfadsuffix.
    </Warning>

  </Tab>
</Tabs>

### Modellauswahl

Sobald die Konfiguration eingerichtet ist, sind alle Ihre Ollama-Modelle verfügbar:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

OpenClaw unterstützt **Ollama Web Search** als gebündelten `web_search`-Provider.

| Eigenschaft | Detail                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Host        | Verwendet Ihren konfigurierten Ollama-Host (`models.providers.ollama.baseUrl`, falls gesetzt, andernfalls `http://127.0.0.1:11434`) |
| Auth        | Ohne Schlüssel                                                                                                       |
| Voraussetzung | Ollama muss laufen und Sie müssen mit `ollama signin` angemeldet sein                                              |

Wählen Sie **Ollama Web Search** während `openclaw onboard` oder `openclaw configure --section web` oder setzen Sie:

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

<Note>
Einrichtung und Verhaltensdetails finden Sie unter [Ollama Web Search](/de/tools/ollama-search).
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Veralteter OpenAI-kompatibler Modus">
    <Warning>
    **Tool-Calling ist im OpenAI-kompatiblen Modus nicht zuverlässig.** Verwenden Sie diesen Modus nur, wenn Sie das OpenAI-Format für einen Proxy benötigen und nicht von nativem Tool-Calling-Verhalten abhängig sind.
    </Warning>

    Wenn Sie stattdessen den OpenAI-kompatiblen Endpunkt verwenden müssen (zum Beispiel hinter einem Proxy, der nur das OpenAI-Format unterstützt), setzen Sie `api: "openai-completions"` explizit:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Dieser Modus unterstützt möglicherweise nicht gleichzeitig Streaming und Tool-Calling. Möglicherweise müssen Sie Streaming mit `params: { streaming: false }` in der Modellkonfiguration deaktivieren.

    Wenn `api: "openai-completions"` mit Ollama verwendet wird, injiziert OpenClaw standardmäßig `options.num_ctx`, damit Ollama nicht stillschweigend auf ein Kontextfenster von 4096 zurückfällt. Wenn Ihr Proxy/Upstream unbekannte Felder `options` ablehnt, deaktivieren Sie dieses Verhalten:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Kontextfenster">
    Für automatisch erkannte Modelle verwendet OpenClaw das von Ollama gemeldete Kontextfenster, wenn verfügbar; andernfalls fällt es auf das von OpenClaw verwendete Standard-Kontextfenster für Ollama zurück.

    Sie können `contextWindow` und `maxTokens` in der expliziten Provider-Konfiguration überschreiben:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Reasoning-Modelle">
    OpenClaw behandelt Modelle mit Namen wie `deepseek-r1`, `reasoning` oder `think` standardmäßig als reasoning-fähig.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Es ist keine zusätzliche Konfiguration erforderlich -- OpenClaw markiert sie automatisch.

  </Accordion>

  <Accordion title="Modellkosten">
    Ollama ist kostenlos und läuft lokal, daher sind alle Modellkosten auf $0 gesetzt. Das gilt sowohl für automatisch erkannte als auch für manuell definierte Modelle.
  </Accordion>

  <Accordion title="Speicher-Embeddings">
    Das gebündelte Ollama-Plugin registriert einen Provider für Speicher-Embeddings für
    [Memory Search](/de/concepts/memory). Er verwendet die konfigurierte Ollama-Basis-URL
    und den API-Schlüssel.

    | Eigenschaft   | Wert                |
    | ------------- | ------------------- |
    | Standardmodell | `nomic-embed-text` |
    | Auto-Pull     | Ja — das Embedding-Modell wird automatisch gezogen, wenn es lokal nicht vorhanden ist |

    Um Ollama als Embedding-Provider für Memory Search auszuwählen:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Streaming-Konfiguration">
    Die Ollama-Integration von OpenClaw verwendet standardmäßig die **native Ollama-API** (`/api/chat`), die Streaming und Tool-Calling gleichzeitig vollständig unterstützt. Es ist keine besondere Konfiguration erforderlich.

    <Tip>
    Wenn Sie den OpenAI-kompatiblen Endpunkt verwenden müssen, siehe oben im Abschnitt „Veralteter OpenAI-kompatibler Modus“. Streaming und Tool-Calling funktionieren in diesem Modus möglicherweise nicht gleichzeitig.
    </Tip>

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Ollama wird nicht erkannt">
    Stellen Sie sicher, dass Ollama läuft und dass Sie `OLLAMA_API_KEY` (oder ein Auth-Profil) gesetzt haben und **keinen** expliziten Eintrag `models.providers.ollama` definiert haben:

    ```bash
    ollama serve
    ```

    Prüfen Sie, ob die API erreichbar ist:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Keine Modelle verfügbar">
    Wenn Ihr Modell nicht aufgeführt ist, ziehen Sie das Modell entweder lokal oder definieren Sie es explizit in `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Verbindung abgelehnt">
    Prüfen Sie, ob Ollama auf dem richtigen Port läuft:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    Wie Sie Modelle auswählen und konfigurieren.
  </Card>
  <Card title="Ollama Web Search" href="/de/tools/ollama-search" icon="magnifying-glass">
    Vollständige Einrichtungs- und Verhaltensdetails für Ollama-gestützte Websuche.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
