---
read_when:
    - Sie möchten den gebündelten Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Modellreferenzen und Konfigurationsbeispiele
    - Sie möchten den Pi-Fallback für reine Codex-Bereitstellungen deaktivieren
summary: OpenClaw eingebettete Agent-Züge über den gebündelten Codex-App-Server-Harness ausführen
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T14:03:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Das gebündelte Plugin `codex` ermöglicht es OpenClaw, eingebettete Agent-Züge über den
Codex-App-Server statt über den integrierten Pi-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll: Model-
Erkennung, natives Thread-Resume, native Compaction und App-Server-Ausführung.
OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und das sichtbare Transkript-Mirror.

Native Codex-Züge respektieren außerdem die gemeinsamen Plugin-Hooks, sodass Prompt-Shims,
Compaction-bewusste Automatisierung, Tool-Middleware und Lifecycle-Beobachter mit dem Pi-Harness
abgestimmt bleiben:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Gebündelte Plugins können außerdem eine Codex-App-Server-Extension-Factory registrieren, um
asynchrone `tool_result`-Middleware hinzuzufügen.

Der Harness ist standardmäßig deaktiviert. Er wird nur ausgewählt, wenn das Plugin `codex`
aktiviert ist und das aufgelöste Modell ein `codex/*`-Modell ist oder wenn Sie explizit
`embeddedHarness.runtime: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen.
Wenn Sie niemals `codex/*` konfigurieren, behalten bestehende Pi-, OpenAI-, Anthropic-, Gemini-, lokale
und benutzerdefinierte Provider-Läufe ihr aktuelles Verhalten bei.

## Das richtige Modellpräfix wählen

OpenClaw hat getrennte Pfade für OpenAI- und Codex-förmigen Zugriff:

| Model ref              | Laufzeitpfad                                 | Verwenden Sie dies, wenn                                                  |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`       | OpenAI-Provider über OpenClaw/Pi-Plumbing    | Sie direkten Zugriff auf die OpenAI Platform API mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.4` | OpenAI-Codex-OAuth-Provider über Pi          | Sie ChatGPT/Codex-OAuth ohne den Codex-App-Server-Harness möchten.        |
| `codex/gpt-5.4`        | Gebündelter Codex-Provider plus Codex-Harness | Sie native Codex-App-Server-Ausführung für den eingebetteten Agent-Zug möchten. |

Der Codex-Harness übernimmt nur `codex/*`-Model-Refs. Bestehende `openai/*`,
`openai-codex/*`, Anthropic-, Gemini-, xAI-, lokale und benutzerdefinierte Provider-Refs behalten
ihre normalen Pfade.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem Plugin `codex`.
- Codex-App-Server `0.118.0` oder neuer.
- Für den App-Server-Prozess verfügbare Codex-Authentifizierung.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests kommt die Authentifizierung normalerweise aus `OPENAI_API_KEY`, plus
optionalen Codex-CLI-Dateien wie `~/.codex/auth.json` und
`~/.codex/config.toml`. Verwenden Sie dasselbe Auth-Material wie Ihr lokaler Codex-App-Server.

## Minimale Konfiguration

Verwenden Sie `codex/gpt-5.4`, aktivieren Sie das gebündelte Plugin und erzwingen Sie den
Harness `codex`:

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

Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie dort auch `codex` auf:

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

Das Setzen von `agents.defaults.model` oder eines Agent-Modells auf `codex/<model>` aktiviert außerdem
automatisch das gebündelte Plugin `codex`. Der explizite Plugin-Eintrag ist in gemeinsam genutzten Konfigurationen weiterhin
nützlich, weil er die Absicht der Bereitstellung deutlich macht.

## Codex hinzufügen, ohne andere models zu ersetzen

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

- `/model codex` oder `/model codex/gpt-5.4` verwendet den Codex-App-Server-Harness.
- `/model gpt` oder `/model openai/gpt-5.4` verwendet den OpenAI-Provider-Pfad.
- `/model opus` verwendet den Anthropic-Provider-Pfad.
- Wenn ein Nicht-Codex-Modell ausgewählt ist, bleibt Pi der Kompatibilitäts-Harness.

## Reine Codex-Bereitstellungen

Deaktivieren Sie den Pi-Fallback, wenn Sie sicherstellen müssen, dass jeder eingebettete Agent-Zug den
Codex-Harness verwendet:

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

Überschreibung per Umgebung:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist,
das angeforderte Modell keine `codex/*`-Ref ist, der App-Server zu alt ist oder der
App-Server nicht gestartet werden kann.

## Codex pro Agent

Sie können einen Agent rein auf Codex festlegen, während der Standard-Agent die normale
automatische Auswahl beibehält:

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

Verwenden Sie normale Sitzungsbefehle, um Agents und models zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung und der Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread bei Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread.

## Model-Erkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren models. Wenn die
Erkennung fehlschlägt oder ein Timeout erreicht, wird der gebündelte Fallback-Katalog verwendet:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Sie können die Erkennung unter `plugins.entries.codex.config.discovery` abstimmen:

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

Deaktivieren Sie die Erkennung, wenn beim Start kein Codex geprüft werden soll und stattdessen der
Fallback-Katalog verwendet werden soll:

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

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung für
autonome Heartbeats: Codex kann Shell- und Netzwerk-Tools verwenden, ohne bei nativen
Genehmigungsaufforderungen anzuhalten, die niemand beantworten kann.

Um sich für guardian-geprüfte Codex-Genehmigungen zu entscheiden, setzen Sie `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Der Guardian-Modus wird erweitert zu:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

Guardian ist ein nativer Codex-Genehmigungsprüfer. Wenn Codex die Sandbox verlassen,
außerhalb des Workspace schreiben oder Berechtigungen wie Netzwerkzugriff hinzufügen möchte,
leitet Codex diese Genehmigungsanfrage an einen Prüfer-Subagent statt an eine menschliche
Aufforderung weiter. Der Prüfer sammelt Kontext und wendet das Risikoframework von Codex an und
genehmigt oder verweigert dann die konkrete Anfrage. Guardian ist nützlich, wenn Sie mehr
Leitplanken als im YOLO-Modus möchten, aber unbeaufsichtigte Agents und Heartbeats dennoch
Fortschritte machen sollen.

Der Docker-Live-Harness enthält eine Guardian-Prüfung, wenn
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Er startet den Codex-Harness im
Guardian-Modus, verifiziert, dass ein harmloser eskalierter Shell-Befehl genehmigt wird, und
verifiziert, dass ein Upload eines Fake-Secrets an ein nicht vertrauenswürdiges externes Ziel
abgelehnt wird, sodass der Agent explizit erneut um Genehmigung bittet.

Die einzelnen Richtlinienfelder haben weiterhin Vorrang vor `mode`, sodass fortgeschrittene Bereitstellungen
das Preset mit expliziten Entscheidungen kombinieren können.

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

| Field               | Standard                                 | Bedeutung                                                                                                  |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                           |
| `command`           | `"codex"`                                | Ausführbare Datei für den Stdio-Transport.                                                                 |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den Stdio-Transport.                                                                         |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                  |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                  |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                              |
| `requestTimeoutMs`  | `60000`                                  | Timeout für Control-Plane-Aufrufe des App-Servers.                                                         |
| `mode`              | `"yolo"`                                 | Preset für YOLO oder guardian-geprüfte Ausführung.                                                         |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzen/Zug gesendet wird.                    |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzen gesendet wird.                                |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"guardian_subagent"`, damit Codex Guardian Aufforderungen prüfen kann.                     |
| `serviceTier`       | nicht gesetzt                            | Optionale Service-Tier des Codex-App-Servers: `"fast"`, `"flex"` oder `null`. Ungültige veraltete Werte werden ignoriert. |

Die älteren Umgebungsvariablen funktionieren weiterhin als Fallbacks für lokale Tests, wenn
das entsprechende Konfigurationsfeld nicht gesetzt ist:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird
für reproduzierbare Bereitstellungen bevorzugt, weil dadurch das Verhalten des Plugins in derselben
geprüften Datei wie der Rest des Codex-Harness-Setups bleibt.

## Häufige Rezepte

Lokales Codex mit Standard-Stdio-Transport:

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

Validierung eines reinen Codex-Harness, mit deaktiviertem Pi-Fallback:

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
            mode: "guardian",
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

Das Umschalten von Modellen bleibt von OpenClaw gesteuert. Wenn eine OpenClaw-Sitzung an
einen bestehenden Codex-Thread angehängt ist, sendet der nächste Zug das aktuell ausgewählte
`codex/*`-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Tier erneut an den
App-Server. Beim Wechsel von `codex/gpt-5.4` zu `codex/gpt-5.2` bleibt die
Thread-Bindung erhalten, aber Codex wird aufgefordert, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Command. Er ist
generisch und funktioniert auf jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Konto, Rate Limits, MCP-Server und Skills.
- `/codex models` listet Live-models des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu verdichten.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex account` zeigt Konto- und Rate-Limit-Status.
- `/codex mcp` listet den Status der MCP-Server des Codex-App-Servers auf.
- `/codex skills` listet Skills des Codex-App-Servers auf.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die der Harness für
normale Züge verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-`codex/*`-Modell an den App-Server und hält den erweiterten
Verlauf aktiviert.

Die Befehlsoberfläche erfordert Codex-App-Server `0.118.0` oder neuer. Einzelne
Control-Methoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Tools, Medien und Compaction

Der Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agents.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiter über den normalen OpenClaw-Zustellpfad.

Genehmigungsabfragen für Codex-MCP-Tools werden durch den Plugin-
Genehmigungsablauf von OpenClaw geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert; andere Abfragen und Anfragen mit freier Eingabe werden weiterhin fail-closed behandelt.

Wenn das ausgewählte Modell den Codex-Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw behält ein Transkript-Mirror für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftiges Umschalten von Modell oder Harness. Das
Mirror enthält den Benutzer-Prompt, den finalen Assistententext und leichtgewichtige Codex-
Reasoning- oder Plan-Einträge, wenn der App-Server sie ausgibt. Derzeit protokolliert OpenClaw nur
native Start- und Abschluss-Signale der Compaction. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder eine auditierbare Liste der Einträge bereit, die Codex
nach der Compaction behalten hat.

Die Mediengenerierung erfordert kein Pi. Bild-, Video-, Musik-, PDF-, TTS- und Medien-
Verständnis verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht in `/model`:** aktivieren Sie `plugins.entries.codex.enabled`,
setzen Sie eine `codex/*`-Modell-Ref oder prüfen Sie, ob `plugins.allow` `codex` ausschließt.

**OpenClaw verwendet Pi statt Codex:** wenn kein Codex-Harness den Lauf übernimmt,
kann OpenClaw Pi als Kompatibilitäts-Backend verwenden. Setzen Sie
`embeddedHarness.runtime: "codex"`, um die Auswahl von Codex beim Testen zu erzwingen, oder
`embeddedHarness.fallback: "none"`, damit der Vorgang fehlschlägt, wenn kein Plugin-Harness passt. Sobald
der Codex-App-Server ausgewählt ist, werden seine Fehler direkt ohne zusätzliche
Fallback-Konfiguration angezeigt.

**Der App-Server wird abgelehnt:** aktualisieren Sie Codex, sodass der App-Server-Handshake
Version `0.118.0` oder neuer meldet.

**Die Model-Erkennung ist langsam:** verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** prüfen Sie `appServer.url`, `authToken`
und dass der Remote-App-Server dieselbe Protokollversion des Codex-App-Servers spricht.

**Ein Nicht-Codex-Modell verwendet Pi:** das ist zu erwarten. Der Codex-Harness übernimmt nur
`codex/*`-Model-Refs.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Modell-Provider](/de/concepts/model-providers)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testing](/de/help/testing#live-codex-app-server-harness-smoke)
