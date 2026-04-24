---
read_when:
    - Sie möchten GitHub Copilot als Modell-Provider verwenden
    - Sie benötigen den `openclaw models auth login-github-copilot`-Ablauf
summary: Bei GitHub Copilot aus OpenClaw heraus mit dem Device Flow anmelden
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-24T06:53:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot ist GitHubs AI-Coding-Assistent. Er bietet Zugriff auf Copilot-
Modelle für Ihr GitHub-Konto und Ihren Tarif. OpenClaw kann Copilot auf zwei verschiedene Arten als Modell-
Provider verwenden.

## Zwei Möglichkeiten, Copilot in OpenClaw zu verwenden

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Verwenden Sie den nativen Device-Login-Ablauf, um ein GitHub-Token zu erhalten, und tauschen Sie es dann aus, wenn OpenClaw läuft, gegen
    Copilot-API-Token aus. Dies ist der **Standardpfad** und der einfachste Weg,
    weil dafür kein VS Code erforderlich ist.

    <Steps>
      <Step title="Den Anmeldebefehl ausführen">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sie werden aufgefordert, eine URL zu besuchen und einen einmaligen Code einzugeben. Lassen Sie das
        Terminal geöffnet, bis der Vorgang abgeschlossen ist.
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Oder in der Konfiguration:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Verwenden Sie die VS-Code-Erweiterung **Copilot Proxy** als lokale Bridge. OpenClaw spricht mit
    dem `/v1`-Endpunkt des Proxy und verwendet die Modellliste, die Sie dort konfigurieren.

    <Note>
    Wählen Sie dies, wenn Sie Copilot Proxy bereits in VS Code ausführen oder Routing
    darüber benötigen. Sie müssen das Plugin aktivieren und die VS-Code-Erweiterung weiter ausführen.
    </Note>

  </Tab>
</Tabs>

## Optionale Flags

| Flag            | Beschreibung                                        |
| --------------- | --------------------------------------------------- |
| `--yes`         | Bestätigungsabfrage überspringen                    |
| `--set-default` | Auch das empfohlene Standardmodell des Providers anwenden |

```bash
# Bestätigung überspringen
openclaw models auth login-github-copilot --yes

# Anmelden und das Standardmodell in einem Schritt setzen
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Interaktives TTY erforderlich">
    Der Device-Login-Ablauf erfordert ein interaktives TTY. Führen Sie ihn direkt in einem
    Terminal aus, nicht in einem nicht interaktiven Skript oder einer CI-Pipeline.
  </Accordion>

  <Accordion title="Modellverfügbarkeit hängt von Ihrem Tarif ab">
    Die Verfügbarkeit von Copilot-Modellen hängt von Ihrem GitHub-Tarif ab. Wenn ein Modell
    abgelehnt wird, versuchen Sie eine andere ID (zum Beispiel `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transportauswahl">
    Claude-Modell-IDs verwenden automatisch den Transport Anthropic Messages. GPT-,
    o-series- und Gemini-Modelle behalten den Transport OpenAI Responses. OpenClaw
    wählt basierend auf der Modell-Ref den richtigen Transport aus.
  </Accordion>

  <Accordion title="Reihenfolge der Auflösung von Umgebungsvariablen">
    OpenClaw löst Copilot-Auth aus Umgebungsvariablen in der folgenden
    Prioritätsreihenfolge auf:

    | Priorität | Variable               | Hinweise                         |
    | --------- | ---------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Höchste Priorität, Copilot-spezifisch |
    | 2         | `GH_TOKEN`             | GitHub-CLI-Token (Fallback)      |
    | 3         | `GITHUB_TOKEN`         | Standard-GitHub-Token (niedrigste Priorität) |

    Wenn mehrere Variablen gesetzt sind, verwendet OpenClaw die Variable mit der höchsten Priorität.
    Der Device-Login-Ablauf (`openclaw models auth login-github-copilot`) speichert
    sein Token im Auth-Profile-Store und hat Vorrang vor allen Umgebungsvariablen.

  </Accordion>

  <Accordion title="Token-Speicherung">
    Die Anmeldung speichert ein GitHub-Token im Auth-Profile-Store und tauscht es
    beim Ausführen von OpenClaw gegen ein Copilot-API-Token aus. Sie müssen das
    Token nicht manuell verwalten.
  </Accordion>
</AccordionGroup>

<Warning>
Erfordert ein interaktives TTY. Führen Sie den Anmeldebefehl direkt in einem Terminal aus, nicht
in einem headless Skript oder CI-Job.
</Warning>

## Embeddings für Memory Search

GitHub Copilot kann auch als Embedding-Provider für
[Memory Search](/de/concepts/memory-search) dienen. Wenn Sie ein Copilot-Abonnement haben und
sich angemeldet haben, kann OpenClaw es ohne separaten API-Key für Embeddings verwenden.

### Automatische Erkennung

Wenn `memorySearch.provider` auf `"auto"` gesetzt ist (der Standard), wird GitHub Copilot
mit Priorität 15 ausprobiert — nach lokalen Embeddings, aber vor OpenAI und anderen kostenpflichtigen
Providern. Wenn ein GitHub-Token verfügbar ist, entdeckt OpenClaw verfügbare
Embedding-Modelle aus der Copilot-API und wählt automatisch das beste aus.

### Explizite Konfiguration

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: das automatisch erkannte Modell überschreiben
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Wie es funktioniert

1. OpenClaw löst Ihr GitHub-Token auf (aus Env-Variablen oder Auth-Profil).
2. Tauscht es gegen ein kurzlebiges Copilot-API-Token aus.
3. Fragt den Copilot-Endpunkt `/models` ab, um verfügbare Embedding-Modelle zu entdecken.
4. Wählt das beste Modell aus (bevorzugt `text-embedding-3-small`).
5. Sendet Embedding-Anfragen an den Copilot-Endpunkt `/embeddings`.

Die Modellverfügbarkeit hängt von Ihrem GitHub-Tarif ab. Wenn keine Embedding-Modelle
verfügbar sind, überspringt OpenClaw Copilot und versucht den nächsten Provider.

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="OAuth and auth" href="/de/gateway/authentication" icon="key">
    Details zu Auth und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
</CardGroup>
