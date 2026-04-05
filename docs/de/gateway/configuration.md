---
read_when:
    - Sie richten OpenClaw zum ersten Mal ein
    - Sie suchen nach häufigen Konfigurationsmustern
    - Sie navigieren zu bestimmten Konfigurationsabschnitten
summary: 'Konfigurationsüberblick: häufige Aufgaben, schnelle Einrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-04-05T12:43:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguration

OpenClaw liest eine optionale <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe, eine Konfiguration hinzuzufügen:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden kann
- Modelle, Tools, Sandboxing oder Automatisierung festlegen (Cron, Hooks)
- Sitzungen, Medien, Netzwerk oder UI anpassen

In der [vollständigen Referenz](/gateway/configuration-reference) finden Sie jedes verfügbare Feld.

<Tip>
**Neu bei der Konfiguration?** Beginnen Sie mit `openclaw onboard` für die interaktive Einrichtung oder sehen Sie sich die Anleitung [Configuration Examples](/gateway/configuration-examples) für vollständige Copy-and-paste-Konfigurationen an.
</Tip>

## Minimale Konfiguration

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Konfiguration bearbeiten

<Tabs>
  <Tab title="Interaktiver Assistent">
    ```bash
    openclaw onboard       # vollständiger Onboarding-Ablauf
    openclaw configure     # Konfigurationsassistent
    ```
  </Tab>
  <Tab title="CLI (Einzeiler)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Öffnen Sie [http://127.0.0.1:18789](http://127.0.0.1:18789) und verwenden Sie den Tab **Config**.
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der Docs-Metadaten
    `title` / `description` der Felder sowie Plugin- und Kanalschemata, sofern
    verfügbar, mit einem **Raw JSON**-Editor als Ausweichmöglichkeit. Für Drill-down-
    UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen einzelnen pfadbezogenen Schemaknoten plus unmittelbare Zusammenfassungen der Unterelemente abzurufen.
  </Tab>
  <Tab title="Direkt bearbeiten">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und wendet Änderungen automatisch an (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den Start **verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (string), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

Hinweise zu Schema-Tools:

- `openclaw config schema` gibt dieselbe JSON-Schema-Familie aus, die von Control UI
  und der Konfigurationsvalidierung verwendet wird.
- Feldwerte für `title` und `description` werden in die Schema-Ausgabe für
  Editor- und Formular-Tools übernommen.
- Verschachtelte Objekt-, Wildcard- (`*`) und Array-Item- (`[]`) Einträge übernehmen dieselben
  Docs-Metadaten, wenn passende Felddokumentation vorhanden ist.
- Auch Kompositionszweige mit `anyOf` / `oneOf` / `allOf` übernehmen dieselben Docs-
  Metadaten, sodass Union-/Intersection-Varianten dieselbe Feldhilfe behalten.
- `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen
  Schemaknoten (`title`, `description`, `type`, `enum`, `const`, häufige Grenzen
  und ähnliche Validierungsfelder), zugeordneten UI-Hinweis-Metadaten sowie unmittelbaren Zusammenfassungen
  der Unterelemente für Drill-down-Tools zurück.
- Runtime-Plugin-/Kanalschemata werden zusammengeführt, wenn das Gateway die
  aktuelle Manifest-Registry laden kann.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat einen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Die Einrichtungsschritte finden Sie auf der jeweiligen Kanalseite:

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Feishu](/channels/feishu) — `channels.feishu`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/channels/msteams) — `channels.msteams`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`

    Alle Kanäle verwenden dasselbe DM-Richtlinienmuster:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // nur für allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modelle auswählen und konfigurieren">
    Legen Sie das primäre Modell und optionale Fallbacks fest:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` definiert den Modellkatalog und dient als Allowlist für `/model`.
    - Modell-Refs verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert das Downscaling von Bildern in Transkripten/Tools (Standard `1200`); niedrigere Werte reduzieren in der Regel den Verbrauch von Vision-Tokens bei screenshotlastigen Ausführungen.
    - Siehe [Models CLI](/concepts/models) zum Wechseln von Modellen im Chat und [Model Failover](/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbst gehostete Provider siehe [Custom providers](/gateway/configuration-reference#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden darf">
    Der DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Pairing-Code zur Genehmigung
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gepaarten Allow-Store)
    - `"open"`: erlaubt alle eingehenden DMs (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: ignoriert alle DMs

    Für Gruppen verwenden Sie `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    In der [vollständigen Referenz](/gateway/configuration-reference#dm-and-group-access) finden Sie kanalspezifische Details.

  </Accordion>

  <Accordion title="Mention-Gating für Gruppenchats einrichten">
    Gruppennachrichten erfordern standardmäßig eine **Erwähnung**. Konfigurieren Sie Muster pro Agent:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (WhatsApp Tap-to-mention, Telegram @bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - Siehe [vollständige Referenz](/gateway/configuration-reference#group-chat-mention-gating) für kanalspezifische Überschreibungen und den Self-Chat-Modus.

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` für eine gemeinsame Baseline und überschreiben Sie dann bestimmte
    Agenten mit `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // übernimmt github, weather
          { id: "docs", skills: ["docs-search"] }, // ersetzt Standardwerte
          { id: "locked-down", skills: [] }, // keine Skills
        ],
      },
    }
    ```

    - Lassen Sie `agents.defaults.skills` weg, damit Skills standardmäßig nicht eingeschränkt sind.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu übernehmen.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zu erlauben.
    - Siehe [Skills](/tools/skills), [Skills config](/tools/skills-config) und
      die [Configuration Reference](/gateway/configuration-reference#agentsdefaultsskills).

  </Accordion>

  <Accordion title="Gateway-Kanalzustandsüberwachung anpassen">
    Steuern Sie, wie aggressiv das Gateway Kanäle neu startet, die veraltet wirken:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um Neustarts durch den Health Monitor global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen einzelnen Kanal oder ein einzelnes Konto zu deaktivieren, ohne den globalen Monitor auszuschalten.
    - Siehe [Health Checks](/gateway/health) für operative Fehlerbehebung und die [vollständige Referenz](/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Sitzungen und Resets konfigurieren">
    Sitzungen steuern Gesprächskontinuität und Isolation:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // empfohlen für mehrere Benutzer
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (geteilt) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globale Standardwerte für threadgebundenes Sitzungsrouting (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Session Management](/concepts/session) für Scoping, Identitätsverknüpfungen und Sende-Richtlinien.
    - Siehe [vollständige Referenz](/gateway/configuration-reference#session) für alle Felder.

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Führen Sie Agentensitzungen in isolierten Docker-Containern aus:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Erstellen Sie zuerst das Image: `scripts/sandbox-setup.sh`

    Siehe [Sandboxing](/gateway/sandboxing) für die vollständige Anleitung und die [vollständige Referenz](/gateway/configuration-reference#agentsdefaultssandbox) für alle Optionen.

  </Accordion>

  <Accordion title="Relay-gestützten Push für offizielle iOS-Builds aktivieren">
    Relay-gestützter Push wird in `openclaw.json` konfiguriert.

    Legen Sie dies in der Gateway-Konfiguration fest:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Standard: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI-Äquivalent:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Was dies bewirkt:

    - Ermöglicht dem Gateway, `push.test`, Wake-Nudges und Reconnect-Wakes über das externe Relay zu senden.
    - Verwendet eine registrierungsbezogene Sendeberechtigung, die von der gepaarten iOS-App weitergeleitet wird. Das Gateway benötigt kein Relay-Token für die gesamte Bereitstellung.
    - Bindet jede relaygestützte Registrierung an die Gateway-Identität, mit der die iOS-App gepaart wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Lässt lokale/manuelle iOS-Builds bei direktem APNs. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die sich über das Relay registriert haben.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist, damit Registrierungs- und Sendetraffic dieselbe Relay-Bereitstellung erreichen.

    Ende-zu-Ende-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Pairen Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operator-Sitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich beim Relay mit App Attest plus dem App-Receipt und veröffentlicht dann die relaygestützte `push.apns.register`-Payload an das gepaarte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Wake-Nudges und Reconnect-Wakes.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, anstatt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Env-Überschreibungen.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt eine nur für loopback gedachte Entwicklungs-Ausweichmöglichkeit; speichern Sie keine HTTP-Relay-URLs dauerhaft in der Konfiguration.

    Siehe [iOS App](/platforms/ios#relay-backed-push-for-official-builds) für den Ende-zu-Ende-Ablauf und [Authentication and trust flow](/platforms/ios#authentication-and-trust-flow) für das Relay-Sicherheitsmodell.

  </Accordion>

  <Accordion title="Heartbeat einrichten (periodische Check-ins)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: Duration-String (`30m`, `2h`). Setzen Sie `0m`, um zu deaktivieren.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standard) oder `block` für DM-artige Heartbeat-Ziele
    - Siehe [Heartbeat](/gateway/heartbeat) für die vollständige Anleitung.

  </Accordion>

  <Accordion title="Cron-Jobs konfigurieren">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: bereinigt abgeschlossene isolierte Ausführungssitzungen aus `sessions.json` (Standard `24h`; setzen Sie `false`, um zu deaktivieren).
    - `runLog`: bereinigt `cron/runs/<jobId>.jsonl` nach Größe und beibehaltenen Zeilen.
    - Siehe [Cron jobs](/automation/cron-jobs) für Funktionsüberblick und CLI-Beispiele.

  </Accordion>

  <Accordion title="Webhooks einrichten (Hooks)">
    Aktivieren Sie HTTP-Webhook-Endpunkte im Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Sicherheitshinweis:
    - Behandeln Sie alle Hook-/Webhook-Payload-Inhalte als nicht vertrauenswürdige Eingabe.
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie nicht das gemeinsame Gateway-Token erneut.
    - Hook-Authentifizierung ist nur Header-basiert (`Authorization: Bearer ...` oder `x-openclaw-token`); Tokens in Query-Strings werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halten Sie den Webhook-Eingang auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Bypass-Flags für unsichere Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer für eng begrenztes Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer gewählte Sitzungsschlüssel zu begrenzen.
    - Für Hook-gesteuerte Agenten bevorzugen Sie starke moderne Modellstufen und eine strikte Tool-Richtlinie (zum Beispiel nur Messaging plus nach Möglichkeit Sandboxing).

    Siehe [vollständige Referenz](/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Führen Sie mehrere isolierte Agenten mit separaten Workspaces und Sitzungen aus:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Siehe [Multi-Agent](/concepts/multi-agent) und die [vollständige Referenz](/gateway/configuration-reference#multi-agent-routing) für Binding-Regeln und agentenspezifische Zugriffsprofile.

  </Accordion>

  <Accordion title="Konfiguration auf mehrere Dateien aufteilen ($include)">
    Verwenden Sie `$include`, um große Konfigurationen zu organisieren:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Einzelne Datei**: ersetzt das enthaltende Objekt
    - **Array von Dateien**: wird der Reihe nach tief zusammengeführt (spätere gewinnt)
    - **Nebenschlüssel**: werden nach Includes zusammengeführt (überschreiben inkludierte Werte)
    - **Verschachtelte Includes**: werden bis zu 10 Ebenen tief unterstützt
    - **Relative Pfade**: werden relativ zur inkludierenden Datei aufgelöst
    - **Fehlerbehandlung**: klare Fehler bei fehlenden Dateien, Parse-Fehlern und zirkulären Includes

  </Accordion>
</AccordionGroup>

## Hot Reload der Konfiguration

Das Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an — für die meisten Einstellungen ist kein manueller Neustart erforderlich.

### Reload-Modi

| Modus                  | Verhalten                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort hot an. Startet bei kritischen Änderungen automatisch neu. |
| **`hot`**              | Wendet nur sichere Änderungen hot an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist — Sie kümmern sich darum. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, sicher oder nicht.             |
| **`off`**              | Deaktiviert die Dateibeobachtung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was hot angewendet wird und was einen Neustart erfordert

Die meisten Felder werden ohne Ausfallzeit hot angewendet. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch verarbeitet.

| Kategorie           | Felder                                                               | Neustart erforderlich? |
| ------------------- | -------------------------------------------------------------------- | ---------------------- |
| Kanäle              | `channels.*`, `web` (WhatsApp) — alle integrierten und Erweiterungskanäle | Nein                   |
| Agent & Modelle     | `agent`, `agents`, `models`, `routing`                               | Nein                   |
| Automatisierung     | `hooks`, `cron`, `agent.heartbeat`                                   | Nein                   |
| Sitzungen & Nachrichten | `session`, `messages`                                            | Nein                   |
| Tools & Medien      | `tools`, `browser`, `skills`, `audio`, `talk`                        | Nein                   |
| UI & Sonstiges      | `ui`, `logging`, `identity`, `bindings`                              | Nein                   |
| Gateway-Server      | `gateway.*` (Port, Bind, Auth, Tailscale, TLS, HTTP)                 | **Ja**                 |
| Infrastruktur       | `discovery`, `canvasHost`, `plugins`                                 | **Ja**                 |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen — Änderungen daran lösen **keinen** Neustart aus.
</Note>

## Config-RPC (programmatische Updates)

<Note>
Control-Plane-Schreib-RPCs (`config.apply`, `config.patch`, `update.run`) sind auf **3 Anfragen pro 60 Sekunden** pro `deviceId+clientIp` begrenzt. Bei Begrenzung gibt der RPC `UNAVAILABLE` mit `retryAfterMs` zurück.
</Note>

Sicherer/standardmäßiger Ablauf:

- `config.schema.lookup`: untersucht einen pfadbezogenen Konfigurationsunterbaum mit einem flachen
  Schemaknoten, zugeordneten Hinweis-Metadaten und unmittelbaren Zusammenfassungen der Unterelemente
- `config.get`: ruft den aktuellen Snapshot + Hash ab
- `config.patch`: bevorzugter Pfad für Teilaktualisierungen
- `config.apply`: nur für vollständigen Konfigurationsersatz
- `update.run`: explizites Selbst-Update + Neustart

Wenn Sie nicht die gesamte Konfiguration ersetzen, bevorzugen Sie `config.schema.lookup`
und dann `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (vollständiger Ersatz)">
    Validiert + schreibt die vollständige Konfiguration und startet das Gateway in einem Schritt neu.

    <Warning>
    `config.apply` ersetzt die **gesamte Konfiguration**. Verwenden Sie `config.patch` für Teilaktualisierungen oder `openclaw config set` für einzelne Schlüssel.
    </Warning>

    Parameter:

    - `raw` (string) — JSON5-Payload für die gesamte Konfiguration
    - `baseHash` (optional) — Konfigurations-Hash aus `config.get` (erforderlich, wenn Konfiguration vorhanden ist)
    - `sessionKey` (optional) — Sitzungsschlüssel für den Wake-up-Ping nach dem Neustart
    - `note` (optional) — Hinweis für das Neustart-Sentinel
    - `restartDelayMs` (optional) — Verzögerung vor dem Neustart (Standard 2000)

    Neustartanfragen werden zusammengefasst, während bereits eine aussteht/läuft, und zwischen Neustartzyklen gilt eine Abkühlzeit von 30 Sekunden.

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash erfassen
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (Teilaktualisierung)">
    Führt eine Teilaktualisierung in die bestehende Konfiguration zusammen (JSON-Merge-Patch-Semantik):

    - Objekte werden rekursiv zusammengeführt
    - `null` löscht einen Schlüssel
    - Arrays werden ersetzt

    Parameter:

    - `raw` (string) — JSON5 nur mit den zu ändernden Schlüsseln
    - `baseHash` (erforderlich) — Konfigurations-Hash aus `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — wie bei `config.apply`

    Das Neustartverhalten entspricht `config.apply`: zusammengefasste ausstehende Neustarts plus eine Abkühlzeit von 30 Sekunden zwischen Neustartzyklen.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen

OpenClaw liest Umgebungsvariablen aus dem Elternprozess sowie aus:

- `.env` aus dem aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Fallback)

Keine der beiden Dateien überschreibt bestehende Umgebungsvariablen. Sie können auch Inline-Umgebungsvariablen in der Konfiguration setzen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-Env-Import (optional)">
  Wenn aktiviert und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Entsprechende Env-Variable: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env-Variablenersetzung in Konfigurationswerten">
  Verweisen Sie in jedem Stringwert der Konfiguration mit `${VAR_NAME}` auf Umgebungsvariablen:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Es werden nur Großbuchstabennamen abgeglichen: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen lösen beim Laden einen Fehler aus
- Escapen Sie mit `$${VAR}` für eine wörtliche Ausgabe
- Funktioniert auch in `$include`-Dateien
- Inline-Ersetzung: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRefs (env, file, exec)">
  Für Felder, die SecretRef-Objekte unterstützen, können Sie Folgendes verwenden:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Details zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secrets Management](/gateway/secrets).
Unterstützte Anmeldedatenpfade sind unter [SecretRef Credential Surface](/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Siehe [Environment](/help/environment) für vollständige Vorrangregeln und Quellen.

## Vollständige Referenz

Die vollständige Referenz für alle Felder finden Sie unter **[Configuration Reference](/gateway/configuration-reference)**.

---

_Verwandt: [Configuration Examples](/gateway/configuration-examples) · [Configuration Reference](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
