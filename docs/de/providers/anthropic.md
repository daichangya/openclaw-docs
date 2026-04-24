---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude in OpenClaw über API-Schlüssel oder Claude CLI verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T06:52:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic entwickelt die Modellfamilie **Claude**. OpenClaw unterstützt zwei Auth-Wege:

- **API-Schlüssel** — direkter Zugriff auf die Anthropic-API mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — Wiederverwendung eines bestehenden Claude-CLI-Logins auf demselben Host

<Warning>
Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Nutzung der Claude CLI im Stil von OpenClaw wieder erlaubt ist, daher
behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als zulässig, sofern
Anthropic keine neue Richtlinie veröffentlicht.

Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel dennoch der klarste und
am besten vorhersehbare Produktionspfad.

Die aktuellen öffentlichen Dokumente von Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Erste Schritte

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** Standard-API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="Ihren API-Schlüssel holen">
        Erstellen Sie einen API-Schlüssel in der [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # wählen Sie: Anthropic API key
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Prüfen, dass das Modell verfügbar ist">
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
    **Am besten geeignet für:** Wiederverwendung eines bestehenden Claude-CLI-Logins ohne separaten API-Schlüssel.

    <Steps>
      <Step title="Sicherstellen, dass Claude CLI installiert und angemeldet ist">
        Prüfen Sie dies mit:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # wählen Sie: Claude CLI
        ```

        OpenClaw erkennt vorhandene Claude-CLI-Anmeldedaten und verwendet sie wieder.
      </Step>
      <Step title="Prüfen, dass das Modell verfügbar ist">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Einzelheiten zu Einrichtung und Laufzeit des Claude-CLI-Backends finden Sie unter [CLI Backends](/de/gateway/cli-backends).
    </Note>

    <Tip>
    Wenn Sie den klarsten Abrechnungspfad möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel. OpenClaw unterstützt außerdem abonnementsähnliche Optionen von [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Standardwerte für Thinking (Claude 4.6)

Modelle von Claude 4.6 verwenden in OpenClaw standardmäßig `adaptive` Thinking, wenn keine explizite Thinking-Stufe gesetzt ist.

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

OpenClaw unterstützt die Prompt-Caching-Funktion von Anthropic für Auth mit API-Schlüssel.

| Wert                | Cache-Dauer | Beschreibung                              |
| ------------------- | ----------- | ----------------------------------------- |
| `"short"` (Standard) | 5 Minuten   | Wird bei API-Key-Auth automatisch angewendet |
| `"long"`            | 1 Stunde    | Erweiterter Cache                         |
| `"none"`            | Kein Caching | Prompt-Caching deaktivieren               |

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
    Verwenden Sie Modell-Parameter als Baseline und überschreiben Sie dann bestimmte Agenten über `agents.list[].params`:

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
    2. `agents.list[].params` (passende `id`, überschreibt schlüsselweise)

    So kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent auf demselben Modell das Caching für sprunghaften Traffic mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Hinweise zu Bedrock Claude">
    - Claude-Modelle von Anthropic auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren bei entsprechender Konfiguration `cacheRetention` als Durchreichung.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` erzwungen.
    - Intelligente Standardwerte für API-Schlüssel setzen bei Claude-auf-Bedrock-Refs außerdem `cacheRetention: "short"`, wenn kein expliziter Wert gesetzt ist.
  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schneller Modus">
    Der gemeinsame Schalter `/fast` von OpenClaw unterstützt direkten Anthropic-Traffic (API-Schlüssel und OAuth zu `api.anthropic.com`).

    | Befehl | Wird abgebildet auf |
    |---------|---------------------|
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
    - Wird nur für direkte Requests an `api.anthropic.com` injiziert. Proxy-Routen lassen `service_tier` unverändert.
    - Explizite Parameter `serviceTier` oder `service_tier` überschreiben `/fast`, wenn beides gesetzt ist.
    - Bei Accounts ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.
    </Note>

  </Accordion>

  <Accordion title="Medienverständnis (Bild und PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis. OpenClaw
    löst Medienfähigkeiten automatisch aus der konfigurierten Anthropic-Auth auf — keine
    zusätzliche Konfiguration ist nötig.

    | Eigenschaft       | Wert                 |
    | ----------------- | -------------------- |
    | Standardmodell    | `claude-opus-4-6`    |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn an eine Konversation ein Bild oder PDF angehängt wird, leitet OpenClaw
    es automatisch über den Anthropic-Provider für Medienverständnis weiter.

  </Accordion>

  <Accordion title="1M Kontextfenster (Beta)">
    Das 1M-Kontextfenster von Anthropic ist beta-gesteuert. Aktivieren Sie es pro Modell:

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

    OpenClaw bildet dies bei Requests auf `anthropic-beta: context-1m-2025-08-07` ab.

    <Warning>
    Erfordert Long-Context-Zugriff für Ihre Anthropic-Anmeldedaten. Legacy-Token-Auth (`sk-ant-oat-*`) wird für 1M-Kontext-Requests abgelehnt — OpenClaw protokolliert eine Warnung und fällt auf das Standard-Kontextfenster zurück.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M Kontext">
    `anthropic/claude-opus-4.7` und seine `claude-cli`-Variante haben standardmäßig ein 1M-Kontext-
    Fenster — `params.context1m: true` ist nicht erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Anthropic-Token-Auth läuft ab und kann widerrufen werden. Verwenden Sie für neue Setups stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Anthropic-Auth ist **pro Agent** — neue Agenten erben die Schlüssel des Haupt-Agenten nicht. Führen Sie das Onboarding für diesen Agenten erneut aus (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host) und prüfen Sie dann mit `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Auth-Profil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Cooldowns wegen Anthropic-Rate-Limits können modellspezifisch sein, sodass ein benachbartes Anthropic-Modell trotzdem verwendbar sein kann. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie den Cooldown ab.
  </Accordion>
</AccordionGroup>

<Note>
Mehr Hilfe: [Troubleshooting](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="CLI-Backends" href="/de/gateway/cli-backends" icon="terminal">
    Einrichtung und Laufzeitdetails des Claude-CLI-Backends.
  </Card>
  <Card title="Prompt-Caching" href="/de/reference/prompt-caching" icon="database">
    Wie Prompt-Caching providerübergreifend funktioniert.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Details zu Auth und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
