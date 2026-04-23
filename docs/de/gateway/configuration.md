---
read_when:
    - OpenClaw zum ersten Mal einrichten
    - Suche nach gängigen Konfigurationsmustern
    - Zu bestimmten Konfigurationsabschnitten navigieren
summary: 'Konfigurationsübersicht: häufige Aufgaben, Schnelleinrichtung und Links zur vollständigen Referenz'
title: Konfiguration
x-i18n:
    generated_at: "2026-04-23T14:01:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# Konfiguration

OpenClaw liest eine optionale <Tooltip tip="JSON5 unterstützt Kommentare und nachgestellte Kommas">**JSON5**</Tooltip>-Konfiguration aus `~/.openclaw/openclaw.json`.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Layouts mit
symlinktem `openclaw.json` werden für von OpenClaw verwaltete Schreibvorgänge nicht unterstützt; ein atomarer Schreibvorgang kann
den Pfad ersetzen, statt den Symlink beizubehalten. Wenn Sie die Konfiguration außerhalb des
standardmäßigen Statusverzeichnisses speichern, verweisen Sie `OPENCLAW_CONFIG_PATH` direkt auf die echte Datei.

Wenn die Datei fehlt, verwendet OpenClaw sichere Standardwerte. Häufige Gründe für das Hinzufügen einer Konfiguration:

- Kanäle verbinden und steuern, wer dem Bot Nachrichten senden kann
- models, Tools, Sandboxing oder Automatisierung festlegen (Cron, Hooks)
- Sitzungen, Medien, Netzwerk oder UI abstimmen

Siehe die [vollständige Referenz](/de/gateway/configuration-reference) für alle verfügbaren Felder.

<Tip>
**Neu bei der Konfiguration?** Beginnen Sie mit `openclaw onboard` für die interaktive Einrichtung oder sehen Sie sich den Leitfaden [Konfigurationsbeispiele](/de/gateway/configuration-examples) mit vollständigen Copy-paste-Konfigurationen an.
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
    Die Control UI rendert ein Formular aus dem Live-Konfigurationsschema, einschließlich der Felddokumentationsmetadaten
    `title` / `description` sowie Plugin- und Kanalschemata, wenn
    verfügbar, mit einem **Raw JSON**-Editor als Escape Hatch. Für Drill-down-
    UIs und andere Tools stellt das Gateway außerdem `config.schema.lookup` bereit, um
    einen einzelnen pfadbezogenen Schemaknoten plus Zusammenfassungen unmittelbarer untergeordneter Elemente
    abzurufen.
  </Tab>
  <Tab title="Direkt bearbeiten">
    Bearbeiten Sie `~/.openclaw/openclaw.json` direkt. Das Gateway überwacht die Datei und übernimmt Änderungen automatisch (siehe [Hot Reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Strikte Validierung

<Warning>
OpenClaw akzeptiert nur Konfigurationen, die vollständig dem Schema entsprechen. Unbekannte Schlüssel, fehlerhafte Typen oder ungültige Werte führen dazu, dass das Gateway den **Start verweigert**. Die einzige Ausnahme auf Root-Ebene ist `$schema` (string), damit Editoren JSON-Schema-Metadaten anhängen können.
</Warning>

`openclaw config schema` gibt das kanonische JSON-Schema aus, das von Control UI
und der Validierung verwendet wird. `config.schema.lookup` ruft einen einzelnen pfadbezogenen Knoten plus
Zusammenfassungen untergeordneter Elemente für Drill-down-Tools ab. Felddokumentationsmetadaten `title`/`description`
werden durch verschachtelte Objekte, Wildcards (`*`), Array-Elemente (`[]`) und `anyOf`/
`oneOf`/`allOf`-Zweige weitergereicht. Laufzeit-Plugin- und Kanalschemata werden zusammengeführt, wenn die
Manifest-Registry geladen ist.

Wenn die Validierung fehlschlägt:

- Das Gateway startet nicht
- Nur Diagnosebefehle funktionieren (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Führen Sie `openclaw doctor` aus, um die genauen Probleme zu sehen
- Führen Sie `openclaw doctor --fix` (oder `--yes`) aus, um Reparaturen anzuwenden

Das Gateway behält nach jedem erfolgreichen Start eine vertrauenswürdige letzte funktionierende Kopie.
Wenn `openclaw.json` später die Validierung nicht besteht (oder `gateway.mode` entfernt, stark
schrumpft oder eine versehentlich vorangestellte Logzeile enthält), bewahrt OpenClaw die defekte Datei
als `.clobbered.*` auf, stellt die letzte funktionierende Kopie wieder her und protokolliert den Grund
für die Wiederherstellung. Der nächste Agent-Zug erhält außerdem eine Systemereigniswarnung, damit der Haupt-
Agent die wiederhergestellte Konfiguration nicht blind überschreibt. Die Übernahme als letzte funktionierende Kopie
wird übersprungen, wenn ein Kandidat redigierte Secret-Platzhalter wie `***` enthält.

## Häufige Aufgaben

<AccordionGroup>
  <Accordion title="Einen Kanal einrichten (WhatsApp, Telegram, Discord usw.)">
    Jeder Kanal hat einen eigenen Konfigurationsabschnitt unter `channels.<provider>`. Siehe die jeweilige Kanalseite für Einrichtungsanweisungen:

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

  <Accordion title="models auswählen und konfigurieren">
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
    - Verwenden Sie `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, um Allowlist-Einträge hinzuzufügen, ohne vorhandene models zu entfernen. Einfache Ersetzungen, die Einträge entfernen würden, werden abgelehnt, sofern Sie nicht `--replace` angeben.
    - Modellreferenzen verwenden das Format `provider/model` (z. B. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` steuert das Herunterskalieren von Bildern in Transkripten/Tools (Standard `1200`); niedrigere Werte reduzieren bei Läufen mit vielen Screenshots normalerweise den Verbrauch von Vision-Tokens.
    - Siehe [Models CLI](/de/concepts/models) zum Wechseln von models im Chat und [Model Failover](/de/concepts/model-failover) für Auth-Rotation und Fallback-Verhalten.
    - Für benutzerdefinierte/selbst gehostete Provider siehe [Benutzerdefinierte Provider](/de/gateway/configuration-reference#custom-providers-and-base-urls) in der Referenz.

  </Accordion>

  <Accordion title="Steuern, wer dem Bot Nachrichten senden kann">
    Der DM-Zugriff wird pro Kanal über `dmPolicy` gesteuert:

    - `"pairing"` (Standard): unbekannte Absender erhalten einen einmaligen Pairing-Code zur Genehmigung
    - `"allowlist"`: nur Absender in `allowFrom` (oder im gepairten Allow-Store)
    - `"open"`: alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)
    - `"disabled"`: alle DMs ignorieren

    Für Gruppen verwenden Sie `groupPolicy` + `groupAllowFrom` oder kanalspezifische Allowlists.

    Siehe die [vollständige Referenz](/de/gateway/configuration-reference#dm-and-group-access) für Details pro Kanal.

  </Accordion>

  <Accordion title="Erwähnungssteuerung in Gruppenchats einrichten">
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
    - Siehe [vollständige Referenz](/de/gateway/configuration-reference#group-chat-mention-gating) für Überschreibungen pro Kanal und den Selbstchat-Modus.

  </Accordion>

  <Accordion title="Skills pro Agent einschränken">
    Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und überschreiben Sie dann bestimmte
    Agents mit `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // erbt github, weather
          { id: "docs", skills: ["docs-search"] }, // ersetzt Standardwerte
          { id: "locked-down", skills: [] }, // keine Skills
        ],
      },
    }
    ```

    - Lassen Sie `agents.defaults.skills` weg, wenn Skills standardmäßig nicht eingeschränkt sein sollen.
    - Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
    - Setzen Sie `agents.list[].skills: []` für keine Skills.
    - Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und
      die [Konfigurationsreferenz](/de/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Überwachung des Kanalzustands des Gateways abstimmen">
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

    - Setzen Sie `gateway.channelHealthCheckMinutes: 0`, um zustandsbedingte Neustarts global zu deaktivieren.
    - `channelStaleEventThresholdMinutes` sollte größer oder gleich dem Prüfintervall sein.
    - Verwenden Sie `channels.<provider>.healthMonitor.enabled` oder `channels.<provider>.accounts.<id>.healthMonitor.enabled`, um automatische Neustarts für einen Kanal oder ein Konto zu deaktivieren, ohne die globale Überwachung abzuschalten.
    - Siehe [Health Checks](/de/gateway/health) für operatives Debugging und die [vollständige Referenz](/de/gateway/configuration-reference#gateway) für alle Felder.

  </Accordion>

  <Accordion title="Sitzungen und Zurücksetzungen konfigurieren">
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

    - `dmScope`: `main` (gemeinsam) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: globale Standardwerte für threadgebundenes Sitzungsrouting (Discord unterstützt `/focus`, `/unfocus`, `/agents`, `/session idle` und `/session max-age`).
    - Siehe [Sitzungsverwaltung](/de/concepts/session) für Geltungsbereich, Identitätsverknüpfungen und Senderichtlinien.
    - Siehe [vollständige Referenz](/de/gateway/configuration-reference#session) für alle Felder.

  </Accordion>

  <Accordion title="Sandboxing aktivieren">
    Führen Sie Agent-Sitzungen in isolierten Sandbox-Laufzeiten aus:

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

    Erstellen Sie das Image zuerst: `scripts/sandbox-setup.sh`

    Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung und die [vollständige Referenz](/de/gateway/configuration-reference#agentsdefaultssandbox) für alle Optionen.

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
    - Verwendet eine registrierungsbezogene Sendeberechtigung, die von der gekoppelten iOS-App weitergeleitet wird. Das Gateway benötigt kein relayweites Deployment-Token.
    - Bindet jede relaygestützte Registrierung an die Gateway-Identität, mit der die iOS-App gekoppelt wurde, sodass ein anderes Gateway die gespeicherte Registrierung nicht wiederverwenden kann.
    - Belässt lokale/manuelle iOS-Builds bei direktem APNs. Relaygestützte Sendungen gelten nur für offiziell verteilte Builds, die sich über das Relay registriert haben.
    - Muss mit der Relay-Basis-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist, damit Registrierungs- und Sendedatenverkehr dieselbe Relay-Bereitstellung erreicht.

    End-to-End-Ablauf:

    1. Installieren Sie einen offiziellen/TestFlight-iOS-Build, der mit derselben Relay-Basis-URL kompiliert wurde.
    2. Konfigurieren Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
    3. Koppeln Sie die iOS-App mit dem Gateway und lassen Sie sowohl Node- als auch Operator-Sitzungen verbinden.
    4. Die iOS-App ruft die Gateway-Identität ab, registriert sich beim Relay mit App Attest plus dem App-Receipt und veröffentlicht dann die relaygestützte Payload `push.apns.register` an das gekoppelte Gateway.
    5. Das Gateway speichert den Relay-Handle und die Sendeberechtigung und verwendet sie dann für `push.test`, Wake-Nudges und Reconnect-Wakes.

    Betriebshinweise:

    - Wenn Sie die iOS-App auf ein anderes Gateway umstellen, verbinden Sie die App erneut, damit sie eine neue an dieses Gateway gebundene Relay-Registrierung veröffentlichen kann.
    - Wenn Sie einen neuen iOS-Build ausliefern, der auf eine andere Relay-Bereitstellung verweist, aktualisiert die App ihre zwischengespeicherte Relay-Registrierung, anstatt den alten Relay-Ursprung wiederzuverwenden.

    Kompatibilitätshinweis:

    - `OPENCLAW_APNS_RELAY_BASE_URL` und `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funktionieren weiterhin als temporäre Umgebungsvariablen-Überschreibungen.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` bleibt eine nur für Loopback gedachte Entwicklungs-Notlösung; persistieren Sie keine HTTP-Relay-URLs in der Konfiguration.

    Siehe [iOS-App](/de/platforms/ios#relay-backed-push-for-official-builds) für den End-to-End-Ablauf und [Authentifizierungs- und Vertrauensablauf](/de/platforms/ios#authentication-and-trust-flow) für das Relay-Sicherheitsmodell.

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

    - `every`: Dauerzeichenfolge (`30m`, `2h`). Setzen Sie `0m`, um zu deaktivieren.
    - `target`: `last` | `none` | `<channel-id>` (zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`)
    - `directPolicy`: `allow` (Standard) oder `block` für DM-artige Heartbeat-Ziele
    - Siehe [Heartbeat](/de/gateway/heartbeat) für die vollständige Anleitung.

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

    - `sessionRetention`: abgeschlossene isolierte Ausführungssitzungen aus `sessions.json` entfernen (Standard `24h`; auf `false` setzen, um zu deaktivieren).
    - `runLog`: `cron/runs/<jobId>.jsonl` nach Größe und Anzahl beibehaltener Zeilen bereinigen.
    - Siehe [Cron-Jobs](/de/automation/cron-jobs) für den Funktionsüberblick und CLI-Beispiele.

  </Accordion>

  <Accordion title="Webhooks (Hooks) einrichten">
    Aktivieren Sie HTTP-Webhook-Endpunkte auf dem Gateway:

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
    - Behandeln Sie alle Payload-Inhalte von Hooks/Webhooks als nicht vertrauenswürdige Eingaben.
    - Verwenden Sie ein eigenes `hooks.token`; verwenden Sie nicht das gemeinsame Gateway-Token erneut.
    - Hook-Authentifizierung ist nur über Header möglich (`Authorization: Bearer ...` oder `x-openclaw-token`); Tokens in der Query-String werden abgelehnt.
    - `hooks.path` darf nicht `/` sein; halten Sie den Webhook-Eingang auf einem eigenen Unterpfad wie `/hooks`.
    - Lassen Sie Unsichere-Inhalte-Bypass-Flags deaktiviert (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), außer für eng begrenztes Debugging.
    - Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um vom Aufrufer ausgewählte Sitzungsschlüssel zu begrenzen.
    - Für hookgesteuerte Agents sollten Sie starke moderne Modellklassen und eine strikte Tool-Richtlinie bevorzugen (zum Beispiel nur Messaging plus wenn möglich Sandboxing).

    Siehe [vollständige Referenz](/de/gateway/configuration-reference#hooks) für alle Mapping-Optionen und die Gmail-Integration.

  </Accordion>

  <Accordion title="Multi-Agent-Routing konfigurieren">
    Führen Sie mehrere isolierte Agents mit getrennten Workspaces und Sitzungen aus:

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

    Siehe [Multi-Agent](/de/concepts/multi-agent) und die [vollständige Referenz](/de/gateway/configuration-reference#multi-agent-routing) für Bindungsregeln und Zugriffsprofile pro Agent.

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
    - **Array von Dateien**: wird der Reihe nach per Deep Merge zusammengeführt (spätere Einträge gewinnen)
    - **Benachbarte Schlüssel**: werden nach den Includes zusammengeführt (überschreiben eingeschlossene Werte)
    - **Verschachtelte Includes**: bis zu 10 Ebenen tief unterstützt
    - **Relative Pfade**: werden relativ zur einbindenden Datei aufgelöst
    - **Von OpenClaw verwaltete Schreibvorgänge**: wenn ein Schreibvorgang nur einen Abschnitt der obersten Ebene ändert,
      der durch ein Include mit einzelner Datei gesichert ist, etwa `plugins: { $include: "./plugins.json5" }`,
      aktualisiert OpenClaw diese eingebundene Datei und lässt `openclaw.json` unverändert
    - **Nicht unterstütztes Write-through**: Root-Includes, Include-Arrays und Includes
      mit benachbarten Überschreibungen werden für von OpenClaw verwaltete Schreibvorgänge fail-closed behandelt, statt
      die Konfiguration zu flatten
    - **Fehlerbehandlung**: klare Fehler für fehlende Dateien, Parse-Fehler und zirkuläre Includes

  </Accordion>
</AccordionGroup>

## Hot Reload der Konfiguration

Das Gateway überwacht `~/.openclaw/openclaw.json` und übernimmt Änderungen automatisch — für die meisten Einstellungen ist kein manueller Neustart erforderlich.

Direkte Dateibearbeitungen werden als nicht vertrauenswürdig behandelt, bis sie validiert sind. Der Watcher wartet,
bis sich temporäre Schreib-/Umbenennungsvorgänge des Editors beruhigt haben, liest die endgültige Datei und lehnt
ungültige externe Bearbeitungen ab, indem er die letzte funktionierende Konfiguration wiederherstellt. Von OpenClaw verwaltete
Konfigurationsschreibvorgänge verwenden vor dem Schreiben dieselbe Schemaprüfung; destruktive Überschreibungen wie
das Entfernen von `gateway.mode` oder eine Verkleinerung der Datei um mehr als die Hälfte werden abgelehnt
und zur Prüfung als `.rejected.*` gespeichert.

Wenn Sie `Config auto-restored from last-known-good` oder
`config reload restored last-known-good config` in den Logs sehen, prüfen Sie die zugehörige
Datei `.clobbered.*` neben `openclaw.json`, korrigieren Sie die abgelehnte Payload und führen Sie dann
`openclaw config validate` aus. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-restored-last-known-good-config)
für die Wiederherstellungs-Checkliste.

### Reload-Modi

| Mode                   | Verhalten                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (Standard) | Wendet sichere Änderungen sofort per Hot Apply an. Startet bei kritischen Änderungen automatisch neu. |
| **`hot`**              | Wendet nur sichere Änderungen per Hot Apply an. Protokolliert eine Warnung, wenn ein Neustart erforderlich ist — Sie kümmern sich darum. |
| **`restart`**          | Startet das Gateway bei jeder Konfigurationsänderung neu, ob sicher oder nicht.        |
| **`off`**              | Deaktiviert die Dateiüberwachung. Änderungen werden beim nächsten manuellen Neustart wirksam. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Was per Hot Apply übernommen wird und was einen Neustart benötigt

Die meisten Felder werden ohne Downtime per Hot Apply übernommen. Im Modus `hybrid` werden Änderungen, die einen Neustart erfordern, automatisch verarbeitet.

| Category            | Felder                                                            | Neustart erforderlich? |
| ------------------- | ----------------------------------------------------------------- | ---------------------- |
| Kanäle              | `channels.*`, `web` (WhatsApp) — alle integrierten und Plugin-Kanäle | Nein                 |
| Agent & models      | `agent`, `agents`, `models`, `routing`                            | Nein                   |
| Automatisierung     | `hooks`, `cron`, `agent.heartbeat`                                | Nein                   |
| Sitzungen & Nachrichten | `session`, `messages`                                         | Nein                   |
| Tools & Medien      | `tools`, `browser`, `skills`, `audio`, `talk`                     | Nein                   |
| UI & Sonstiges      | `ui`, `logging`, `identity`, `bindings`                           | Nein                   |
| Gateway-Server      | `gateway.*` (Port, Bind, Auth, Tailscale, TLS, HTTP)              | **Ja**                 |
| Infrastruktur       | `discovery`, `canvasHost`, `plugins`                              | **Ja**                 |

<Note>
`gateway.reload` und `gateway.remote` sind Ausnahmen — deren Änderung löst **keinen** Neustart aus.
</Note>

### Reload-Planung

Wenn Sie eine Quelldatei bearbeiten, auf die über `$include` verwiesen wird, plant OpenClaw
das Reload anhand des quellseitig verfassten Layouts, nicht anhand der geflatten In-Memory-Ansicht.
Dadurch bleiben Hot-Reload-Entscheidungen (Hot Apply vs. Neustart) vorhersehbar, selbst wenn ein
einzelner Abschnitt der obersten Ebene in einer eigenen eingebundenen Datei lebt, etwa
`plugins: { $include: "./plugins.json5" }`. Die Reload-Planung wird fail-closed behandelt, wenn das
Quelllayout mehrdeutig ist.

## Config RPC (programmatische Updates)

Für Tools, die Konfigurationen über die Gateway-API schreiben, bevorzugen Sie diesen Ablauf:

- `config.schema.lookup`, um einen Teilbaum zu prüfen (flacher Schemaknoten + Zusammenfassungen
  untergeordneter Elemente)
- `config.get`, um den aktuellen Snapshot plus `hash` abzurufen
- `config.patch` für partielle Updates (JSON Merge Patch: Objekte werden zusammengeführt, `null`
  löscht, Arrays werden ersetzt)
- `config.apply` nur dann, wenn Sie beabsichtigen, die gesamte Konfiguration zu ersetzen
- `update.run` für explizites Selbstupdate plus Neustart

<Note>
Schreibvorgänge auf der Control Plane (`config.apply`, `config.patch`, `update.run`) sind
auf 3 Anfragen pro 60 Sekunden pro `deviceId+clientIp` ratenbegrenzt. Neustartanfragen werden
zusammengefasst und erzwingen dann eine Cooldown-Zeit von 30 Sekunden zwischen Neustartzyklen.
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

OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess sowie aus:

- `.env` aus dem aktuellen Arbeitsverzeichnis (falls vorhanden)
- `~/.openclaw/.env` (globaler Fallback)

Keine der beiden Dateien überschreibt vorhandene Umgebungsvariablen. Sie können auch Inline-Umgebungsvariablen in der Konfiguration setzen:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell-Import von Umgebungsvariablen (optional)">
  Wenn dies aktiviert ist und erwartete Schlüssel nicht gesetzt sind, führt OpenClaw Ihre Login-Shell aus und importiert nur die fehlenden Schlüssel:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Entsprechende Umgebungsvariable: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Ersetzung von Umgebungsvariablen in Konfigurationswerten">
  Verweisen Sie in jedem String-Konfigurationswert mit `${VAR_NAME}` auf Umgebungsvariablen:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regeln:

- Es werden nur Namen in Großbuchstaben abgeglichen: `[A-Z_][A-Z0-9_]*`
- Fehlende/leere Variablen verursachen beim Laden einen Fehler
- Mit `$${VAR}` für wörtliche Ausgabe escapen
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

Details zu SecretRef (einschließlich `secrets.providers` für `env`/`file`/`exec`) finden Sie unter [Secrets Management](/de/gateway/secrets).
Unterstützte Anmeldedatenpfade sind unter [SecretRef Credential Surface](/de/reference/secretref-credential-surface) aufgeführt.
</Accordion>

Siehe [Umgebung](/de/help/environment) für vollständige Priorität und Quellen.

## Vollständige Referenz

Die vollständige Referenz aller Felder finden Sie unter **[Konfigurationsreferenz](/de/gateway/configuration-reference)**.

---

_Verwandt: [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Konfigurationsreferenz](/de/gateway/configuration-reference) · [Doctor](/de/gateway/doctor)_
