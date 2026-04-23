---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden.
summary: Anthropic Claude über API-Schlüssel oder Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T14:04:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic entwickelt die **Claude**-Modellfamilie. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** — direkter Anthropic-API-Zugriff mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — Wiederverwendung einer vorhandenen Claude-CLI-Anmeldung auf demselben Host

<Warning>
Mitarbeiter von Anthropic haben uns mitgeteilt, dass die Claude-CLI-Nutzung im Stil von OpenClaw wieder erlaubt ist, daher
behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als zulässig, solange
Anthropic keine neue Richtlinie veröffentlicht.

Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin der klarste und
vorhersehbarste Produktionspfad.

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
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie einen API-Schlüssel in der [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # wählen Sie: Anthropic API key
        ```

        Oder den Schlüssel direkt übergeben:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
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
    **Am besten geeignet für:** Wiederverwendung einer vorhandenen Claude-CLI-Anmeldung ohne separaten API-Schlüssel.

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

        OpenClaw erkennt die vorhandenen Claude-CLI-Zugangsdaten und verwendet sie erneut.
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Details zu Setup und Laufzeit für das Claude-CLI-Backend finden Sie unter [CLI Backends](/de/gateway/cli-backends).
    </Note>

    <Tip>
    Wenn Sie den klarsten Abrechnungspfad möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel. OpenClaw unterstützt außerdem Abo-ähnliche Optionen von [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Standardwerte für Thinking (Claude 4.6)

Claude-4.6-Modelle verwenden in OpenClaw standardmäßig `adaptive` Thinking, wenn kein explizites Thinking-Level gesetzt ist.

Pro Nachricht mit `/think:<level>` oder in den Modellparametern überschreiben:

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
Zugehörige Anthropic-Dokumentation:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt-Caching

OpenClaw unterstützt Anthropics Prompt-Caching-Funktion für API-Schlüssel-Authentifizierung.

| Wert                | Cache-Dauer | Beschreibung                              |
| ------------------- | ----------- | ----------------------------------------- |
| `"short"` (Standard) | 5 Minuten   | Wird für API-Schlüssel-Authentifizierung automatisch angewendet |
| `"long"`            | 1 Stunde    | Erweiterter Cache                         |
| `"none"`            | Kein Caching | Prompt-Caching deaktivieren              |

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

    Reihenfolge beim Konfigurations-Merge:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (passende `id`, überschreibt nach Schlüssel)

    Damit kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent auf demselben Modell Caching für burstartigen Traffic mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Hinweise zu Bedrock Claude">
    - Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren bei Konfiguration die Durchreichung von `cacheRetention`.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` gezwungen.
    - Intelligente Standardwerte für API-Schlüssel setzen außerdem `cacheRetention: "short"` für Claude-on-Bedrock-Referenzen, wenn kein expliziter Wert gesetzt ist.
  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schnellmodus">
    OpenClaws gemeinsamer Schalter `/fast` unterstützt direkten Anthropic-Datenverkehr (API-Schlüssel und OAuth an `api.anthropic.com`).

    | Befehl | Entspricht |
    |---------|------------|
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
    - Wird nur für direkte Anfragen an `api.anthropic.com` eingefügt. Proxy-Routen lassen `service_tier` unverändert.
    - Explizite Parameter `serviceTier` oder `service_tier` überschreiben `/fast`, wenn beides gesetzt ist.
    - Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.
    </Note>

  </Accordion>

  <Accordion title="Medienverständnis (Bild und PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis. OpenClaw
    löst Medienfähigkeiten automatisch aus der konfigurierten Anthropic-Authentifizierung auf — zusätzliche
    Konfiguration ist nicht erforderlich.

    | Eigenschaft      | Wert                 |
    | ---------------- | -------------------- |
    | Standardmodell   | `claude-opus-4-6`    |
    | Unterstützte Eingaben | Bilder, PDF-Dokumente |

    Wenn ein Bild oder PDF an eine Unterhaltung angehängt wird, leitet OpenClaw es automatisch
    an den Anthropic-Provider für Medienverständnis weiter.

  </Accordion>

  <Accordion title="1M-Kontextfenster (Beta)">
    Anthropics 1M-Kontextfenster ist Beta-gesteuert. Aktivieren Sie es pro Modell:

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

    OpenClaw bildet dies bei Anfragen auf `anthropic-beta: context-1m-2025-08-07` ab.

    <Warning>
    Erfordert Long-Context-Zugriff für Ihre Anthropic-Zugangsdaten. Legacy-Token-Authentifizierung (`sk-ant-oat-*`) wird für 1M-Kontext-Anfragen abgelehnt — OpenClaw protokolliert eine Warnung und fällt auf das Standard-Kontextfenster zurück.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M-Kontext">
    `anthropic/claude-opus-4.7` und seine Variante `claude-cli` haben standardmäßig ein 1M-Kontextfenster — kein `params.context1m: true` erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Anthropic-Token-Authentifizierung kann ablaufen oder widerrufen werden. Migrieren Sie bei neuen Setups zu einem Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API-Schlüssel für Provider "anthropic" gefunden'>
    Authentifizierung ist **pro Agent**. Neue Agenten übernehmen die Schlüssel des Hauptagenten nicht. Führen Sie das Onboarding für diesen Agenten erneut aus oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host und prüfen Sie dann mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Zugangsdaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Auth-Profil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Auth-Profil (alle in Cooldown)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Anthropic-Rate-Limit-Cooldowns können modellbezogen sein, daher kann ein benachbartes Anthropic-Modell weiterhin nutzbar sein. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie das Ende des Cooldowns ab.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Troubleshooting](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Referenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="CLI Backends" href="/de/gateway/cli-backends" icon="terminal">
    Setup- und Laufzeitdetails für das Claude-CLI-Backend.
  </Card>
  <Card title="Prompt-Caching" href="/de/reference/prompt-caching" icon="database">
    Wie Prompt-Caching providerübergreifend funktioniert.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
</CardGroup>
