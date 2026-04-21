---
read_when:
    - Sie möchten das gebündelte Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Modell-Refs und Konfigurationsbeispiele
    - Sie möchten den Pi-Fallback für reine Codex-Bereitstellungen deaktivieren
summary: OpenClaw-eingebettete Agent-Turns über das gebündelte Codex-App-Server-Harness ausführen
title: Codex Harness
x-i18n:
    generated_at: "2026-04-21T06:27:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Das gebündelte `codex`-Plugin ermöglicht es OpenClaw, eingebettete Agent-Turns über den
Codex-App-Server statt über das integrierte Pi-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll:
Modellerkennung, natives Thread-Resume, native Compaction und App-Server-Ausführung.
OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und das sichtbare Transcript-Mirror.

Das Harness ist standardmäßig deaktiviert. Es wird nur ausgewählt, wenn das `codex`-Plugin
aktiviert ist und das aufgelöste Modell ein `codex/*`-Modell ist oder wenn Sie
explizit `embeddedHarness.runtime: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen.
Wenn Sie niemals `codex/*` konfigurieren, behalten bestehende Pi-, OpenAI-, Anthropic-, Gemini-, lokale
und benutzerdefinierte Provider-Läufe ihr bisheriges Verhalten bei.

## Das richtige Modellpräfix wählen

OpenClaw hat getrennte Pfade für OpenAI- und Codex-förmigen Zugriff:

| Modell-Ref            | Laufzeitpfad                               | Verwenden, wenn                                                            |
| --------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | OpenAI-Provider über OpenClaw/Pi-Plumbing  | Sie direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY` möchten.     |
| `openai-codex/gpt-5.4` | OpenAI-Codex-OAuth-Provider über Pi       | Sie ChatGPT/Codex-OAuth ohne das Codex-App-Server-Harness möchten.         |
| `codex/gpt-5.4`       | Gebündelter Codex-Provider plus Codex Harness | Sie native Codex-App-Server-Ausführung für den eingebetteten Agent-Turn möchten. |

Das Codex Harness beansprucht nur `codex/*`-Modell-Refs. Bestehende `openai/*`,
`openai-codex/*`, Anthropic-, Gemini-, xAI-, lokale und benutzerdefinierte Provider-Refs behalten
ihre normalen Pfade.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.118.0` oder neuer.
- Für den App-Server-Prozess verfügbare Codex-Authentifizierung.

Das Plugin blockiert ältere oder versionslose App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung gewöhnlich von `OPENAI_API_KEY`, plus
optionalen Codex-CLI-Dateien wie `~/.codex/auth.json` und
`~/.codex/config.toml`. Verwenden Sie dasselbe Auth-Material wie Ihr lokaler Codex-App-Server.

## Minimale Konfiguration

Verwenden Sie `codex/gpt-5.4`, aktivieren Sie das gebündelte Plugin und erzwingen Sie das `codex`-Harness:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Wenn Ihre Konfiguration `plugins.allow` verwendet, schließen Sie dort ebenfalls `codex` ein:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Das Setzen von `agents.defaults.model` oder eines Agent-Modells auf `codex/<model>` aktiviert das
gebündelte `codex`-Plugin ebenfalls automatisch. Der explizite Plugin-Eintrag ist in gemeinsam genutzten
Konfigurationen weiterhin nützlich, weil er die Bereitstellungsabsicht deutlich macht.

## Codex hinzufügen, ohne andere Modelle zu ersetzen

Behalten Sie `runtime: "auto"` bei, wenn Sie Codex für `codex/*`-Modelle und Pi für
alles andere möchten:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Mit dieser Form:

- `/model codex` oder `/model codex/gpt-5.4` verwendet das Codex-App-Server-Harness.
- `/model gpt` oder `/model openai/gpt-5.4` verwendet den OpenAI-Provider-Pfad.
- `/model opus` verwendet den Anthropic-Provider-Pfad.
- Wenn ein Nicht-Codex-Modell ausgewählt ist, bleibt Pi das Kompatibilitäts-Harness.

## Reine Codex-Bereitstellungen

Deaktivieren Sie den Pi-Fallback, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Turn
das Codex Harness verwendet:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Umgebungsüberschreibung:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist,
das angeforderte Modell keine `codex/*`-Ref ist, der App-Server zu alt ist oder der
App-Server nicht gestartet werden kann.

## Codex pro Agent

Sie können einen Agent rein auf Codex setzen, während der Standard-Agent die normale
Auto-Auswahl beibehält:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Verwenden Sie normale Sitzungsbefehle, um Agents und Modelle umzuschalten. `/new` erstellt eine neue
OpenClaw-Sitzung, und das Codex Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread nach Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn
die Erkennung fehlschlägt oder ein Timeout auftritt, verwendet es den gebündelten Fallback-Katalog:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Sie können die Erkennung unter `plugins.entries.codex.config.discovery` anpassen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Deaktivieren Sie die Erkennung, wenn Sie möchten, dass der Start das Probing von Codex vermeidet und beim
Fallback-Katalog bleibt:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-Server-Verbindung und Richtlinie

Standardmäßig startet das Plugin Codex lokal mit:

```bash
codex app-server --listen stdio://
```

Standardmäßig fordert OpenClaw Codex auf, native Genehmigungen anzufordern. Sie können diese
Richtlinie weiter anpassen, zum Beispiel indem Sie sie verschärfen und Prüfungen über den
Guardian leiten:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Verwenden Sie für einen bereits laufenden App-Server WebSocket-Transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet zu `url`.               |
| `command`           | `"codex"`                                | Ausführbare Datei für stdio-Transport.                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für stdio-Transport.                                           |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                |
| `authToken`         | nicht gesetzt                            | Bearer-Token für WebSocket-Transport.                                    |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                            |
| `requestTimeoutMs`  | `60000`                                  | Timeout für App-Server-Control-Plane-Aufrufe.                            |
| `approvalPolicy`    | `"on-request"`                           | Native Codex-Genehmigungsrichtlinie, die an Start/Resume/Turn des Threads gesendet wird. |
| `sandbox`           | `"workspace-write"`                      | Nativer Codex-Sandbox-Modus, der an Start/Resume des Threads gesendet wird. |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"guardian_subagent"`, damit der Codex-Guardian native Genehmigungen prüft. |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex-Service-Stufe, zum Beispiel `"priority"`.                |

Die älteren Umgebungsvariablen funktionieren weiterhin als Fallbacks für lokales Testen, wenn
das passende Konfigurationsfeld nicht gesetzt ist:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Für wiederholbare Bereitstellungen wird die Konfiguration bevorzugt.

## Häufige Rezepte

Lokales Codex mit standardmäßigem stdio-Transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validierung für reines Codex-Harness bei deaktiviertem Pi-Fallback:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Guardian-geprüfte Codex-Genehmigungen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Remote-App-Server mit expliziten Headern:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Die Modellumschaltung bleibt OpenClaw-kontrolliert. Wenn eine OpenClaw-Sitzung an einen bestehenden
Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte
`codex/*`-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Stufe erneut an den
App-Server. Ein Wechsel von `codex/gpt-5.4` zu `codex/gpt-5.2` behält die
Thread-Bindung bei, fordert Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert auf jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für
normale Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-`codex/*`-Modell an den App-Server und lässt den erweiterten
Verlauf aktiviert.

Die Befehlsoberfläche erfordert Codex-App-Server `0.118.0` oder neuer. Einzelne
Steuerungsmethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Tools, Medien und Compaction

Das Codex Harness ändert nur den Low-Level-Ausführer des eingebetteten Agent.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiterhin über den normalen OpenClaw-Zustellpfad.

Wenn das ausgewählte Modell das Codex Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw behält ein Transcript-Mirror für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Umschaltungen. Das
Mirror enthält den Benutzer-Prompt, den finalen Assistententext und leichtgewichtige Codex-
Reasoning- oder Plan-Einträge, wenn der App-Server diese ausgibt.

Mediengenerierung erfordert kein Pi. Bild-, Video-, Musik-, PDF-, TTS- und Medienverständnis
verwenden weiterhin die passenden Provider-/Modell-Einstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht in `/model`:** aktivieren Sie `plugins.entries.codex.enabled`,
setzen Sie eine `codex/*`-Modell-Ref oder prüfen Sie, ob `plugins.allow` `codex` ausschließt.

**OpenClaw fällt auf Pi zurück:** setzen Sie `embeddedHarness.fallback: "none"` oder
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` beim Testen.

**Der App-Server wird abgelehnt:** aktualisieren Sie Codex, sodass der App-Server-Handshake
Version `0.118.0` oder neuer meldet.

**Die Modellerkennung ist langsam:** senken Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** prüfen Sie `appServer.url`, `authToken`
und dass der entfernte App-Server dieselbe Version des Codex-App-Server-Protokolls spricht.

**Ein Nicht-Codex-Modell verwendet Pi:** das ist erwartet. Das Codex Harness beansprucht nur
`codex/*`-Modell-Refs.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Modell-Provider](/de/concepts/model-providers)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing#live-codex-app-server-harness-smoke)
