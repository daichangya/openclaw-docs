---
read_when:
    - Sie möchten GitHub Copilot als Modell-Provider verwenden.
    - Sie benötigen den Ablauf `openclaw models auth login-github-copilot`.
summary: Bei GitHub Copilot aus OpenClaw heraus mit dem Device Flow anmelden
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T06:30:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7faafbd3bdcd8886e75fb0d40c3eec66355df3fca6160ebbbb9a0018b7839fe
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot ist der KI-Coding-Assistent von GitHub. Er bietet Zugriff auf Copilot-
Modelle für Ihr GitHub-Konto und Ihren Tarif. OpenClaw kann Copilot auf zwei verschiedene Arten
als Modell-Provider verwenden.

## Zwei Möglichkeiten, Copilot in OpenClaw zu verwenden

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Verwenden Sie den nativen Device-Login-Flow, um ein GitHub-Token zu erhalten, und tauschen Sie es dann gegen
    Copilot-API-Tokens aus, wenn OpenClaw läuft. Dies ist der **Standard** und der einfachste Weg,
    da dafür kein VS Code erforderlich ist.

    <Steps>
      <Step title="Den Login-Befehl ausführen">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sie werden aufgefordert, eine URL zu besuchen und einen einmaligen Code einzugeben. Lassen Sie das
        Terminal geöffnet, bis der Vorgang abgeschlossen ist.
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```bash
        openclaw models set github-copilot/claude-opus-4.6
        ```

        Oder in der Konfiguration:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.6" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Verwenden Sie die VS-Code-Extension **Copilot Proxy** als lokale Bridge. OpenClaw kommuniziert mit
    dem `/v1`-Endpunkt des Proxys und verwendet die Modellliste, die Sie dort konfigurieren.

    <Note>
    Wählen Sie dies, wenn Sie Copilot Proxy bereits in VS Code ausführen oder darüber
    routen müssen. Sie müssen das Plugin aktivieren und die VS-Code-Extension weiter ausführen.
    </Note>

  </Tab>
</Tabs>

## Optionale Flags

| Flag            | Beschreibung                                        |
| --------------- | --------------------------------------------------- |
| `--yes`         | Bestätigungsabfrage überspringen                    |
| `--set-default` | Zusätzlich das empfohlene Standardmodell des Providers anwenden |

```bash
# Bestätigung überspringen
openclaw models auth login-github-copilot --yes

# Anmelden und das Standardmodell in einem Schritt festlegen
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Interaktives TTY erforderlich">
    Der Device-Login-Flow erfordert ein interaktives TTY. Führen Sie ihn direkt in einem
    Terminal aus, nicht in einem nicht interaktiven Skript oder einer CI-Pipeline.
  </Accordion>

  <Accordion title="Modellverfügbarkeit hängt von Ihrem Tarif ab">
    Die Verfügbarkeit von Copilot-Modellen hängt von Ihrem GitHub-Tarif ab. Wenn ein Modell
    abgelehnt wird, versuchen Sie eine andere ID (zum Beispiel `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transportauswahl">
    Modell-IDs von Claude verwenden automatisch den Transport Anthropic Messages. GPT-,
    o-series- und Gemini-Modelle verwenden weiterhin den Transport OpenAI Responses. OpenClaw
    wählt den richtigen Transport basierend auf der Modell-Ref aus.
  </Accordion>

  <Accordion title="Reihenfolge bei der Auflösung von Umgebungsvariablen">
    OpenClaw löst die Copilot-Authentifizierung in der folgenden
    Prioritätsreihenfolge aus Umgebungsvariablen auf:

    | Priorität | Variable               | Hinweise                         |
    | --------- | ---------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Höchste Priorität, Copilot-spezifisch |
    | 2         | `GH_TOKEN`             | GitHub-CLI-Token (Fallback)      |
    | 3         | `GITHUB_TOKEN`         | Standard-GitHub-Token (niedrigste Priorität) |

    Wenn mehrere Variablen gesetzt sind, verwendet OpenClaw die Variable mit der höchsten Priorität.
    Der Device-Login-Flow (`openclaw models auth login-github-copilot`) speichert
    sein Token im Auth-Profil-Store und hat Vorrang vor allen Umgebungsvariablen.

  </Accordion>

  <Accordion title="Token-Speicherung">
    Beim Login wird ein GitHub-Token im Auth-Profil-Store gespeichert und beim Ausführen von OpenClaw
    gegen ein Copilot-API-Token ausgetauscht. Sie müssen das
    Token nicht manuell verwalten.
  </Accordion>
</AccordionGroup>

<Warning>
Erfordert ein interaktives TTY. Führen Sie den Login-Befehl direkt in einem Terminal aus, nicht
innerhalb eines headless Skripts oder CI-Jobs.
</Warning>

## Embeddings für die Memory-Suche

GitHub Copilot kann auch als Embedding-Provider für die
[Memory-Suche](/de/concepts/memory-search) dienen. Wenn Sie ein Copilot-Abonnement haben und
angemeldet sind, kann OpenClaw es ohne separaten API-Key für Embeddings verwenden.

### Automatische Erkennung

Wenn `memorySearch.provider` auf `"auto"` gesetzt ist (Standard), wird GitHub Copilot
mit Priorität 15 ausprobiert — nach lokalen Embeddings, aber vor OpenAI und anderen kostenpflichtigen
Providern. Wenn ein GitHub-Token verfügbar ist, erkennt OpenClaw verfügbare
Embedding-Modelle über die Copilot-API und wählt automatisch das beste aus.

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

### So funktioniert es

1. OpenClaw löst Ihr GitHub-Token auf (aus Env-Variablen oder dem Auth-Profil).
2. Tauscht es gegen ein kurzlebiges Copilot-API-Token aus.
3. Fragt den Copilot-Endpunkt `/models` ab, um verfügbare Embedding-Modelle zu erkennen.
4. Wählt das beste Modell aus (bevorzugt `text-embedding-3-small`).
5. Sendet Embedding-Anfragen an den Copilot-Endpunkt `/embeddings`.

Die Modellverfügbarkeit hängt von Ihrem GitHub-Tarif ab. Wenn keine Embedding-Modelle
verfügbar sind, überspringt OpenClaw Copilot und probiert den nächsten Provider aus.

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
</CardGroup>
