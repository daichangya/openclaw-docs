---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Nach gängigen Konfigurationsmustern suchen
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsüberblick: häufige Aufgaben, Schnelleinrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-04-24T06:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw liest eine optionale <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommata">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Symlinkte `openclaw.json`-
Layouts werden für OpenClaw-eigene Schreibvorgänge nicht unterstützt; ein atomarer Schreibvorgang kann
den Pfad ersetzen, statt den Symlink beizubehalten. Wenn Sie die Konfiguration außerhalb des
Standard-Statusverzeichnisses aufbewahren, zeigen Sie `OPENCLAW_CONFIG_PATH` direkt auf die tatsächliche Datei.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe, eine Konfiguration hinzuzufügen:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden kann
- Modelle, Tools, Sandboxing oder Automatisierung setzen (Cron, Hooks)
- Sitzungen, Medien, Netzwerk oder UI anpassen

Siehe die [vollständige Referenz](/de/gateway/configuration-reference) für jedes verfügbare Feld.

<Tip>
**Neu bei der Konfiguration?** Beginnen Sie mit `openclaw onboard` für die interaktive Einrichtung oder sehen Sie sich den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) mit vollständigen Copy-Paste-Konfigurationen an.
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
    Öffnen Sie [http://127.0.0.1:18789](http://127.0.0.1:18789) und verwenden Sie den Reiter **Config**.
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der
    Feld-Dokumentationsmetadaten `title` / `description` sowie Plugin- und Kanalschemas, wenn
    verfügbar, mit einem Editor für **Raw JSON** als Ausweichmöglichkeit. Für Drill-down-
    UIs und andere Werkzeuge stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen einzelnen pfadbezogenen Schemaknoten plus Zusammenfassungen der direkten Child-Knoten abzurufen.
  </Tab>
  <Tab title="Direkt bearbeiten">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und wendet Änderungen automatisch an (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (String), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON Schema aus, das von der Control UI
und zur Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten plus
Zusammenfassungen der Child-Knoten für Drill-down-Werkzeuge ab. Die Feld-Dokumentationsmetadaten `title`/`description`
werden durch verschachtelte Objekte, Wildcard- (`*`), Array-Element- (`[]`) und `anyOf`/
`oneOf`/`allOf`-Zweige weitergetragen. Laufzeit-Plugin- und Kanalschemas werden eingeblendet, wenn die
Manifest-Registry geladen ist.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Das Gateway behält nach jedem erfolgreichen Start eine vertrauenswürdige Last-known-good-Kopie.
Wenn `openclaw.json` später die Validierung nicht besteht (oder `gateway.mode` entfernt, stark
schrumpft oder eine versehentliche Log-Zeile vorangestellt bekommt), bewahrt OpenClaw die fehlerhafte Datei
als `.clobbered.*` auf, stellt die Last-known-good-Kopie wieder her und protokolliert den Grund der Wiederherstellung.
Der nächste Agent-Durchlauf erhält außerdem eine Systemereignis-Warnung, damit der Haupt-
Agent die wiederhergestellte Konfiguration nicht blind überschreibt. Die Übernahme zur Last-known-good-Kopie
wird übersprungen, wenn ein Kandidat redigierte Secret-Platzhalter wie `***` enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat seinen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Siehe die jeweilige Kanalseite für die Einrichtungsschritte:

    - [WhatsApp](/de/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/de/channels/telegram) — `channels.telegram`
    - [Discord](/de/channels/discord) — `channels.discord`
    - [Feishu](/de/channels/feishu) — `channels.feishu`
    - [Google Chat](/de/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/de/channels/msteams) — `channels.msteams`
    - [Slack](/de/channels/slack) — `channels.slack`
    - [Signal](/de/channels/signal) — `channels.signal`
    - [iMessage](/de/channels/imessage) — `channels.imessage`
    - [Mattermost](/de/channels/mattermost) — `channels.mattermost`

    Alle Kanäle verwenden dasselbe Muster für die DM-Richtlinie:

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
    Legen Sie das Primärmodell und optionale Fallbacks fest:

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
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Allowlist-Einträge hinzuzufügen, ohne vorhandene Modelle zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` übergeben.
    - Modell-Refs verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert die Verkleinerung von Bildern in Transkripten/Tools (Standard `1200`); kleinere Werte reduzieren in der Regel die Nutzung von Vision-Token bei screenshotlastigen Läufen.
    - Siehe [Models CLI](/de/concepts/models) zum Umschalten von Modellen im Chat und [Modell-Failover](/de/concepts/model-failover) für das Verhalten bei Auth-Rotation und Fallback.
    - Für benutzerdefinierte/selbst gehostete Provider siehe [Benutzerdefinierte Provider](/de/gateway/config-tools#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden kann">
    Der DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Pairing-Code zur Genehmigung
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gepaarten Allow-Store)
    - `"open"`: alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Für Gruppen verwenden Sie `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    Siehe die [vollständige Referenz](/de/gateway/config-channels#dm-and-group-access) für Details pro Kanal.

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

    - **Metadaten-Erwähnungen**: native @-Erwähnungen (WhatsApp Tap-to-Mention, Telegram @bot usw.)
    - **Textmuster**: sichere Regex-Muster in `mentionPatterns`
    - Siehe die [vollständige Referenz](/de/gateway/config-channels#group-chat-mention-gating) für Überschreibungen pro Kanal und den Self-Chat-Modus.

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basislinie und überschreiben Sie dann bestimmte
    Agenten mit `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // erbt github, weather
          { id: "docs", skills: ["docs-search"] }, // ersetzt Standards
          { id: "locked-down", skills: [] }, // keine Skills
        ],
      },
    }
    ```

    - Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu haben.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
    - Setzen Sie `agents.list[].skills: []` für keine Skills.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Überwachung der Kanal-Integrität des Gateways abstimmen">
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

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um durch Health-Monitor ausgelöste Neustarts global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um Auto-Neustarts für einen Kanal oder ein Konto zu deaktivieren, ohne den globalen Monitor zu deaktivieren.
    - Siehe [Health Checks](/de/gateway/health) für operatives Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Sitzungen und Resets konfigurieren">
    Sitzungen steuern Kontinuität und Isolation von Unterhaltungen:

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

    - `dmScope`: `main` (gemeinsam genutzt) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globale Standardwerte für threadgebundenes Sitzungsrouting (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Sitzungsverwaltung](/de/concepts/session) für Scoping, Identitätsverknüpfungen und Sende-Richtlinien.
    - Siehe die [vollständige Referenz](/de/gateway/config-agents#session) für alle Felder.

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Agent-Sitzungen in isolierten Sandbox-Laufzeiten ausführen:

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

    Siehe [Sandboxing](/de/gateway/sandboxing) für den vollständigen Leitfaden und die [vollständige Referenz](/de/gateway/config-agents#agentsdefaultssandbox) für alle Optionen.

  </Accordion>

  <Accordion title="Relay-gestützten Push für offizielle iOS-Builds aktivieren">
    Relay-gestützter Push wird in `openclaw.json` konfiguriert.

    Setzen Sie dies in der Gateway-Konfiguration:

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
    - Verwendet eine registrierungsbezogene Sendeberechtigung, die von der gepaarten iOS-App weitergeleitet wird. Das Gateway benötigt kein deploymentsweites Relay-Token.
    - Bindet jede Relay-gestützte Registrierung an die Gateway-Identität, mit der die iOS-App gepaart wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Behält lokale/manuelle iOS-Builds auf direktem APNs. Relay-gestützte Sendungen gelten nur für offiziell verteilte Builds, die sich über das Relay registriert haben.
    - Muss zur Relay-Basis-URL passen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist, damit Registrierungs- und Sendedatenverkehr dieselbe Relay-Bereitstellung erreichen.

    Ende-zu-Ende-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Pairen Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operator-Sitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich mit dem Relay unter Verwendung von App Attest plus dem App-Beleg und veröffentlicht dann die Relay-gestützte Payload `push.apns.register` an das gepaarte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Wake-Nudges und Reconnect-Wakes.

    Betriebliche Hinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue, an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung zeigt, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, statt die alte Relay-Herkunft wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Env-Overrides.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt eine nur für Loopback gedachte Entwicklungs-Ausnahme; persistieren Sie keine HTTP-Relay-URLs in der Konfiguration.

    Siehe [iOS-App](/de/platforms/ios#relay-backed-push-for-official-builds) für den Ende-zu-Ende-Ablauf und [Authentifizierungs- und Vertrauensfluss](/de/platforms/ios#authentication-and-trust-flow) für das Sicherheitsmodell des Relays.

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

    - `every`: Dauer-String (`30m`, `2h`). Setzen Sie `0m`, um zu deaktivieren.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standard) oder `block` für DM-artige Heartbeat-Ziele
    - Siehe [Heartbeat](/de/gateway/heartbeat) für den vollständigen Leitfaden.

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

    - `sessionRetention`: abgeschlossene isolierte Lauf-Sitzungen aus `sessions.json` bereinigen (Standard `24h`; auf `false` setzen, um zu deaktivieren).
    - `runLog`: `cron/runs/<jobId>.jsonl` nach Größe und beibehaltenen Zeilen bereinigen.
    - Siehe [Cron-Jobs](/de/automation/cron-jobs) für den Funktionsüberblick und CLI-Beispiele.

  </Accordion>

  <Accordion title="Webhooks einrichten (Hooks)">
    HTTP-Webhook-Endpunkte auf dem Gateway aktivieren:

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
    - Behandeln Sie alle Hook-/Webhook-Payload-Inhalte als nicht vertrauenswürdige Eingaben.
    - Verwenden Sie ein dediziertes `hooks.token`; verwenden Sie nicht das gemeinsame Gateway-Token erneut.
    - Hook-Authentifizierung ist nur headerbasiert (`Authorization: Bearer ...` oder `x-openclaw-token`); Tokens in Query-Strings werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halten Sie Webhook-Ingress auf einem dedizierten Unterpfad wie `/hooks`.
    - Lassen Sie Flags zur Umgehung unsicherer Inhalte deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer bei eng begrenztem Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer gewählte Sitzungsschlüssel einzugrenzen.
    - Für Hook-gesteuerte Agenten bevorzugen Sie starke moderne Modellklassen und eine strikte Tool-Richtlinie (zum Beispiel nur Messaging plus nach Möglichkeit Sandboxing).

    Siehe die [vollständige Referenz](/de/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Mehrere isolierte Agenten mit separaten Workspaces und Sitzungen ausführen:

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

    Siehe [Multi-Agent](/de/concepts/multi-agent) und die [vollständige Referenz](/de/gateway/config-agents#multi-agent-routing) für Bindungsregeln und Zugriffsprofile pro Agent.

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

    - **Einzelne Datei**: ersetzt das enthaltene Objekt
    - **Array aus Dateien**: wird in Reihenfolge tief zusammengeführt (spätere gewinnt)
    - **Benachbarte Schlüssel**: werden nach Includes zusammengeführt (überschreiben enthaltene Werte)
    - **Verschachtelte Includes**: werden bis zu 10 Ebenen tief unterstützt
    - **Relative Pfade**: werden relativ zur einschließenden Datei aufgelöst
    - **Von OpenClaw verwaltete Schreibvorgänge**: wenn ein Schreibvorgang nur einen Top-Level-Abschnitt ändert,
      der durch ein Include einer einzelnen Datei gestützt wird, etwa `plugins: { $include: "./plugins.json5" }`,
      aktualisiert OpenClaw diese eingebundene Datei und lässt `openclaw.json` intakt
    - **Nicht unterstütztes Write-through**: Root-Includes, Include-Arrays und Includes
      mit benachbarten Overrides schlagen für von OpenClaw verwaltete Schreibvorgänge fail-closed fehl, statt
      die Konfiguration zu flatten
    - **Fehlerbehandlung**: klare Fehler bei fehlenden Dateien, Parse-Fehlern und zirkulären Includes

  </Accordion>
</AccordionGroup>

## Hot Reload der Konfiguration

Das Gateway überwacht `~/.openclaw/openclaw.json` und wendet Änderungen automatisch an — für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateibearbeitungen gelten als nicht vertrauenswürdig, bis sie validiert sind. Der Watcher wartet,
bis Temp-Write-/Rename-Aktivität des Editors abgeklungen ist, liest die endgültige Datei und lehnt
ungültige externe Bearbeitungen ab, indem er die Last-known-good-Konfiguration wiederherstellt. Von OpenClaw verwaltete
Konfigurationsschreibvorgänge verwenden vor dem Schreiben dasselbe Schema-Gate; destruktive Beschädigungen wie
das Entfernen von `gateway.mode` oder das Verkleinern der Datei um mehr als die Hälfte werden abgelehnt
und als `.rejected.*` zur Untersuchung gespeichert.

Wenn Sie `Config auto-restored from last-known-good` oder
`config reload restored last-known-good config` in Logs sehen, untersuchen Sie die passende
Datei `.clobbered.*` neben `openclaw.json`, beheben Sie die abgelehnte Payload und führen Sie dann
`openclaw config validate` aus. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-restored-last-known-good-config)
für die Wiederherstellungs-Checkliste.

### Reload-Modi

| Modus                  | Verhalten                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot Reload an. Führt für kritische Änderungen automatisch Neustarts aus. |
| **`hot`**              | Wendet nur sichere Änderungen per Hot Reload an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist — Sie übernehmen das. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, sicher oder nicht.          |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot Reload angewendet wird und was einen Neustart braucht

Die meisten Felder werden ohne Downtime per Hot Reload angewendet. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch behandelt.

| Kategorie            | Felder                                                            | Neustart nötig? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kanäle              | `channels.*`, `web` (WhatsApp) — alle integrierten und Plugin-Kanäle | Nein            |
| Agent & Modelle     | `agent`, `agents`, `models`, `routing`                            | Nein            |
| Automatisierung     | `hooks`, `cron`, `agent.heartbeat`                                | Nein            |
| Sitzungen & Nachrichten | `session`, `messages`                                         | Nein            |
| Tools & Medien      | `tools`, `browser`, `skills`, `audio`, `talk`                     | Nein            |
| UI & Sonstiges      | `ui`, `logging`, `identity`, `bindings`                           | Nein            |
| Gateway-Server      | `gateway.*` (Port, Bind, Auth, Tailscale, TLS, HTTP)              | **Ja**          |
| Infrastruktur       | `discovery`, `canvasHost`, `plugins`                              | **Ja**          |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen — Änderungen daran lösen **keinen** Neustart aus.
</Note>

### Reload-Planung

Wenn Sie eine Quelldatei bearbeiten, auf die über `$include` verwiesen wird, plant OpenClaw
das Reload anhand des vom Quelltext verfassten Layouts, nicht anhand der geflatten In-Memory-Ansicht.
Dadurch bleiben Hot-Reload-Entscheidungen (Hot Apply vs. Neustart) vorhersehbar, selbst wenn ein
einzelner Top-Level-Abschnitt in einer eigenen eingebundenen Datei liegt, etwa
`plugins: { $include: "./plugins.json5" }`. Die Reload-Planung schlägt fail-closed fehl, wenn das
Quelllayout mehrdeutig ist.

## Config RPC (programmatische Updates)

Für Werkzeuge, die Konfiguration über die Gateway-API schreiben, bevorzugen Sie diesen Ablauf:

- `config.schema.lookup`, um einen Teilbaum zu untersuchen (flacher
  Schemaknoten + Zusammenfassungen der Child-Knoten)
- `config.get`, um den aktuellen Snapshot plus `hash` abzurufen
- `config.patch` für partielle Updates (JSON Merge Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays werden ersetzt)
- `config.apply` nur dann, wenn Sie beabsichtigen, die gesamte Konfiguration zu ersetzen
- `update.run` für explizites Selbst-Update plus Neustart

<Note>
Schreibvorgänge der Control Plane (`config.apply`, `config.patch`, `update.run`) sind
auf 3 Anfragen pro 60 Sekunden pro `deviceId+clientIp` begrenzt.
Neustartanfragen werden zusammengefasst und erzwingen dann einen Cooldown von 30 Sekunden zwischen Neustartzyklen.
</Note>

Beispiel für einen partiellen Patch:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash erfassen
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Sowohl `config.apply` als auch `config.patch` akzeptieren `raw`, `baseHash`, `sessionKey`,
`note` und `restartDelayMs`. `baseHash` ist für beide Methoden erforderlich, wenn bereits eine
Konfiguration existiert.

## Umgebungsvariablen

OpenClaw liest Env-Variablen aus dem übergeordneten Prozess sowie aus:

- `.env` aus dem aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Fallback)

Keine der beiden Dateien überschreibt bestehende Env-Variablen. Sie können auch Inline-Env-Variablen in der Konfiguration setzen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import der Shell-Umgebung (optional)">
  Wenn aktiviert und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env-Variablen-Äquivalent: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Ersetzung von Env-Variablen in Konfigurationswerten">
  Referenzieren Sie Env-Variablen in jedem Konfigurations-Stringwert mit `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Es werden nur Namen in Großbuchstaben erkannt: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen werfen beim Laden einen Fehler
- Mit `$${VAR}` escapen für literale Ausgabe
- Funktioniert auch in `$include`-Dateien
- Inline-Ersetzung: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret-Refs (env, file, exec)">
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

Details zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secrets Management](/de/gateway/secrets).
Unterstützte Anmeldedatenpfade sind in [SecretRef Credential Surface](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Siehe [Umgebung](/de/help/environment) für die vollständige Priorität und die Quellen.

## Vollständige Referenz

Die vollständige Referenz aller Felder finden Sie unter **[Konfigurationsreferenz](/de/gateway/configuration-reference)**.

---

_Verwandt: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
- [Gateway-Runbook](/de/gateway)
