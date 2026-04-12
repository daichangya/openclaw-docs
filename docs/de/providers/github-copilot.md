---
read_when:
    - Sie möchten GitHub Copilot als Modell-Provider verwenden
    - Sie benötigen den `openclaw models auth login-github-copilot`-Ablauf
summary: Bei GitHub Copilot aus OpenClaw mit dem Device Flow anmelden
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-12T23:30:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51fee006e7d4e78e37b0c29356b0090b132de727d99b603441767d3fb642140b
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot ist GitHubs KI-Coding-Assistent. Er bietet Zugriff auf Copilot-
Modelle für Ihr GitHub-Konto und Ihren Tarif. OpenClaw kann Copilot auf zwei verschiedene Arten als Modell-
Provider verwenden.

## Zwei Möglichkeiten, Copilot in OpenClaw zu verwenden

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Verwenden Sie den nativen Device-Login-Ablauf, um ein GitHub-Token zu erhalten, und tauschen Sie es dann
    beim Ausführen von OpenClaw gegen Copilot-API-Token aus. Dies ist der **Standard** und der einfachste Weg,
    weil dafür kein VS Code erforderlich ist.

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Sie werden aufgefordert, eine URL aufzurufen und einen einmaligen Code einzugeben. Lassen Sie das
        Terminal geöffnet, bis der Vorgang abgeschlossen ist.
      </Step>
      <Step title="Set a default model">
        ```bash
        openclaw models set github-copilot/gpt-4o
        ```

        Oder in der Konfiguration:

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Verwenden Sie die VS Code-Erweiterung **Copilot Proxy** als lokale Brücke. OpenClaw kommuniziert mit
    dem `/v1`-Endpunkt des Proxys und verwendet die Modellliste, die Sie dort konfigurieren.

    <Note>
    Wählen Sie dies, wenn Sie Copilot Proxy bereits in VS Code ausführen oder den Datenverkehr
    darüber leiten müssen. Sie müssen das Plugin aktivieren und die VS Code-Erweiterung weiterhin ausführen.
    </Note>

  </Tab>
</Tabs>

## Optionale Flags

| Flag            | Beschreibung                                        |
| --------------- | --------------------------------------------------- |
| `--yes`         | Die Bestätigungsabfrage überspringen                |
| `--set-default` | Zusätzlich das empfohlene Standardmodell des Providers anwenden |

```bash
# Bestätigung überspringen
openclaw models auth login-github-copilot --yes

# Anmelden und das Standardmodell in einem Schritt festlegen
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    Der Device-Login-Ablauf erfordert ein interaktives TTY. Führen Sie ihn direkt in einem
    Terminal aus, nicht in einem nicht interaktiven Skript oder einer CI-Pipeline.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    Die Verfügbarkeit von Copilot-Modellen hängt von Ihrem GitHub-Tarif ab. Wenn ein Modell
    abgelehnt wird, versuchen Sie eine andere ID (zum Beispiel `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transport selection">
    Claude-Modell-IDs verwenden automatisch den Anthropic-Messages-Transport. GPT-,
    o-series- und Gemini-Modelle verwenden weiterhin den OpenAI-Responses-Transport. OpenClaw
    wählt den richtigen Transport anhand der Modell-Referenz aus.
  </Accordion>

  <Accordion title="Resolution order of environment variables">
    OpenClaw löst die Copilot-Authentifizierung aus Umgebungsvariablen in der folgenden
    Prioritätsreihenfolge auf:

    | Priorität | Variable               | Hinweise                         |
    | --------- | ---------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Höchste Priorität, Copilot-spezifisch |
    | 2         | `GH_TOKEN`             | GitHub-CLI-Token (Fallback)      |
    | 3         | `GITHUB_TOKEN`         | Standard-GitHub-Token (niedrigste Priorität) |

    Wenn mehrere Variablen gesetzt sind, verwendet OpenClaw die Variable mit der höchsten Priorität.
    Der Device-Login-Ablauf (`openclaw models auth login-github-copilot`) speichert
    sein Token im Authentifizierungsprofil-Speicher und hat Vorrang vor allen Umgebungs-
    variablen.

  </Accordion>

  <Accordion title="Token storage">
    Die Anmeldung speichert ein GitHub-Token im Authentifizierungsprofil-Speicher und tauscht es
    beim Ausführen von OpenClaw gegen ein Copilot-API-Token aus. Sie müssen das
    Token nicht manuell verwalten.
  </Accordion>
</AccordionGroup>

<Warning>
Erfordert ein interaktives TTY. Führen Sie den Login-Befehl direkt in einem Terminal aus, nicht
innerhalb eines Headless-Skripts oder CI-Jobs.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
