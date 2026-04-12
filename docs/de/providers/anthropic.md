---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude über API-Schlüssel oder Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-04-12T23:29:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e3dda5f98ade9d4c3841888103bfb43d59e075d358a701ed0ae3ffb8d5694a7
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic entwickelt die **Claude**-Modellfamilie. OpenClaw unterstützt zwei Authentifizierungswege:

- **API key** — direkter Zugriff auf die Anthropic-API mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — Wiederverwendung einer bestehenden Claude CLI-Anmeldung auf demselben Host

<Warning>
Anthropic-Mitarbeitende haben uns mitgeteilt, dass die Verwendung von Claude CLI im OpenClaw-Stil wieder erlaubt ist, daher
behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` als zulässig, sofern
Anthropic keine neue Richtlinie veröffentlicht.

Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin der klarste und
am besten vorhersehbare Produktionspfad.

Anthropics aktuelle öffentliche Dokumentation:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
  </Warning>

## Erste Schritte

<Tabs>
  <Tab title="API key">
    **Am besten geeignet für:** standardmäßigen API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="Get your API key">
        Erstellen Sie einen API-Schlüssel in der [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Am besten geeignet für:** die Wiederverwendung einer bestehenden Claude CLI-Anmeldung ohne separaten API-Schlüssel.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Prüfen Sie dies mit:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw erkennt die vorhandenen Claude CLI-Anmeldedaten und verwendet sie wieder.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Einrichtungs- und Laufzeitdetails für das Claude CLI-Backend finden Sie unter [CLI Backends](/de/gateway/cli-backends).
    </Note>

    <Tip>
    Wenn Sie den klarsten Abrechnungspfad möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel. OpenClaw unterstützt außerdem Abonnement-ähnliche Optionen von [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Standardwerte für Thinking (Claude 4.6)

Claude 4.6-Modelle verwenden in OpenClaw standardmäßig `adaptive` Thinking, wenn keine explizite Thinking-Stufe gesetzt ist.

Überschreiben Sie dies pro Nachricht mit `/think:<level>` oder in den Modellparametern:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Verwandte Anthropic-Dokumentation:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt-Caching

OpenClaw unterstützt die Prompt-Caching-Funktion von Anthropic für die Authentifizierung per API-Schlüssel.

| Wert                | Cache-Dauer   | Beschreibung                                |
| ------------------- | ------------- | ------------------------------------------- |
| `"short"` (Standard) | 5 Minuten     | Wird bei Authentifizierung per API-Schlüssel automatisch angewendet |
| `"long"`            | 1 Stunde      | Erweiterter Cache                           |
| `"none"`            | Kein Caching  | Prompt-Caching deaktivieren                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cache-Überschreibungen pro Agent">
    Verwenden Sie Modellparameter als Basis und überschreiben Sie dann bestimmte Agenten über `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Reihenfolge beim Zusammenführen der Konfiguration:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (passende `id`, überschreibt pro Schlüssel)

    Dadurch kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent auf demselben Modell das Caching für sprunghaften Verkehr mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Hinweise zu Bedrock Claude">
    - Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren bei entsprechender Konfiguration `cacheRetention` als Durchreichparameter.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` festgelegt.
    - Intelligente Standardwerte für API-Schlüssel setzen auch für Claude-on-Bedrock-Referenzen `cacheRetention: "short"`, wenn kein expliziter Wert gesetzt ist.
  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schnellmodus">
    OpenClaws gemeinsamer `/fast`-Schalter unterstützt direkten Anthropic-Datenverkehr (API-Schlüssel und OAuth zu `api.anthropic.com`).

    | Befehl | Entspricht |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Wird nur für direkte `api.anthropic.com`-Anfragen eingefügt. Proxy-Routen lassen `service_tier` unverändert.
    - Explizite Parameter `serviceTier` oder `service_tier` überschreiben `/fast`, wenn beide gesetzt sind.
    - Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.
    </Note>

  </Accordion>

  <Accordion title="Media Understanding (Bild und PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis. OpenClaw
    löst Media-Fähigkeiten automatisch aus der konfigurierten Anthropic-Authentifizierung auf — es ist
    keine zusätzliche Konfiguration erforderlich.

    | Eigenschaft      | Wert                 |
    | -------------- | -------------------- |
    | Standardmodell  | `claude-opus-4-6`    |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn ein Bild oder PDF an eine Unterhaltung angehängt wird, leitet OpenClaw es automatisch
    über den Anthropic-Provider für Media Understanding weiter.

  </Accordion>

  <Accordion title="1M-Kontextfenster (Beta)">
    Anthropics 1M-Kontextfenster ist beta-gesteuert. Aktivieren Sie es pro Modell:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw ordnet dies in Anfragen `anthropic-beta: context-1m-2025-08-07` zu.

    <Warning>
    Erfordert Zugriff auf langen Kontext für Ihre Anthropic-Anmeldedaten. Legacy-Token-Authentifizierung (`sk-ant-oat-*`) wird für 1M-Kontextanfragen abgelehnt — OpenClaw protokolliert eine Warnung und fällt auf das Standard-Kontextfenster zurück.
    </Warning>

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Die Anthropic-Token-Authentifizierung kann ablaufen oder widerrufen werden. Migrieren Sie bei neuen Setups zu einem Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API key für Provider "anthropic" gefunden'>
    Die Authentifizierung ist **pro Agent**. Neue Agenten erben die Schlüssel des Haupt-Agenten nicht. Führen Sie das Onboarding für diesen Agenten erneut aus oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host und verifizieren Sie dann mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Anmeldedaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Authentifizierungsprofil (alle in Cooldown)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Anthropic-Rate-Limit-Cooldowns können modellbezogen sein, daher kann ein anderes Anthropic-Modell weiterhin nutzbar sein. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie das Ende des Cooldowns ab.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="CLI Backends" href="/de/gateway/cli-backends" icon="terminal">
    Einrichtung und Laufzeitdetails des Claude CLI-Backends.
  </Card>
  <Card title="Prompt-Caching" href="/de/reference/prompt-caching" icon="database">
    Wie Prompt-Caching providerübergreifend funktioniert.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
