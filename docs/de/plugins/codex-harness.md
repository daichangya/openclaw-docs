---
read_when:
    - Sie möchten das gebündelte Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Modell-Refs und Konfigurationsbeispiele
    - Sie möchten den PI-Fallback für reine Codex-Bereitstellungen deaktivieren
summary: Eingebettete Agenten-Turns von OpenClaw über das gebündelte Codex-App-Server-Harness ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-04-24T06:49:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 095933d2c32df302c312c67fdc266d2f01b552dddb1607d6e4ecc4f3c3326acf
    source_path: plugins/codex-harness.md
    workflow: 15
---

Das gebündelte Plugin `codex` ermöglicht es OpenClaw, eingebettete Agenten-Turns über den
Codex-App-Server statt über das integrierte PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agentensitzung besitzen soll: Modell-
Discovery, natives Thread-Resume, native Compaction und App-Server-Ausführung.
OpenClaw besitzt weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und das sichtbare Spiegel-Transkript.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht.
Dabei handelt es sich um In-Process-Hooks von OpenClaw, nicht um `hooks.json`-Befehlshooks von Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` für gespiegelte Transkriptdatensätze
- `agent_end`

Gebündelte Plugins können außerdem eine Extension-Factory für den Codex-App-Server registrieren, um
asynchrone Middleware für `tool_result` hinzuzufügen. Diese Middleware läuft für dynamische OpenClaw-Tools,
nachdem OpenClaw das Tool ausgeführt hat und bevor das Ergebnis an Codex zurückgegeben wird. Sie
ist getrennt vom öffentlichen Plugin-Hook `tool_result_persist`, der OpenClaw-eigene
Tool-Ergebnisschreibvorgänge im Transkript transformiert.

Das Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten OpenAI-Modell-Refs
kanonisch als `openai/gpt-*` beibehalten und explizit
`embeddedHarness.runtime: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie
native App-Server-Ausführung möchten. Legacy-Modell-Refs `codex/*` wählen das Harness aus Kompatibilitätsgründen weiterhin automatisch aus.

## Das richtige Modellpräfix wählen

Routen der OpenAI-Familie sind präfixspezifisch. Verwenden Sie `openai-codex/*`, wenn Sie
Codex-OAuth über PI möchten; verwenden Sie `openai/*`, wenn Sie direkten OpenAI-API-Zugriff möchten oder
wenn Sie das native Codex-App-Server-Harness erzwingen:

| Modell-Ref                                            | Laufzeitpfad                                  | Verwenden Sie dies, wenn                                                     |
| ----------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenAI-Provider über OpenClaw/PI-Plumbing     | Sie aktuellen direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                                | OpenAI-Codex-OAuth über OpenClaw/PI           | Sie ChatGPT-/Codex-Abo-Auth mit dem Standard-PI-Runner möchten.            |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex-App-Server-Harness                      | Sie native Codex-App-Server-Ausführung für den eingebetteten Agenten-Turn möchten. |

GPT-5.5 ist in OpenClaw derzeit nur per Abo/OAuth verfügbar. Verwenden Sie
`openai-codex/gpt-5.5` für PI-OAuth oder `openai/gpt-5.5` mit dem Codex-
App-Server-Harness. Direkter API-Schlüssel-Zugriff für `openai/gpt-5.5` wird unterstützt,
sobald OpenAI GPT-5.5 auf der öffentlichen API freischaltet.

Legacy-Refs `codex/gpt-*` werden weiterhin als Kompatibilitäts-Aliasse akzeptiert. Neue PI-
Codex-OAuth-Konfigurationen sollten `openai-codex/gpt-*` verwenden; neue Konfigurationen für native App-Server-
Harnesses sollten `openai/gpt-*` plus `embeddedHarness.runtime:
"codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Aufteilung nach Präfix. Verwenden Sie
`openai-codex/gpt-*`, wenn Bildverständnis über den Providerpfad von OpenAI
Codex OAuth laufen soll. Verwenden Sie `codex/gpt-*`, wenn Bildverständnis
über einen begrenzten Codex-App-Server-Turn laufen soll. Das Modell des Codex-App-Servers muss
Unterstützung für Bildeingaben ausweisen; reine Text-Codex-Modelle schlagen fehl, bevor der Media-Turn
beginnt.

Verwenden Sie `/status`, um das effektive Harness für die aktuelle Sitzung zu bestätigen. Wenn die
Auswahl überraschend ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness`
und prüfen Sie den strukturierten Datensatz `agent harness selected` des Gateway. Er
enthält die ID des ausgewählten Harness, den Grund der Auswahl, die Laufzeit-/Fallback-Richtlinie und,
im Modus `auto`, das Unterstützungsresultat jedes Plugin-Kandidaten.

Die Auswahl des Harness ist keine Live-Steuerung einer Sitzung. Wenn ein eingebetteter Turn läuft,
zeichnet OpenClaw die ID des ausgewählten Harness für diese Sitzung auf und verwendet sie auch für
spätere Turns in derselben Sitzungs-ID. Ändern Sie die Konfiguration von `embeddedHarness` oder
`OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen ein anderes Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine neue Sitzung zu starten, bevor Sie eine bestehende
Konversation zwischen PI und Codex umschalten. So wird vermieden, dass ein Transkript über zwei
inkompatible native Sitzungssysteme erneut abgespielt wird.

Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als an PI gepinnt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Konversation nach Änderung der Konfiguration
für Codex zu aktivieren.

`/status` zeigt das effektive nicht-PI-Harness neben `Fast`, zum Beispiel
`Fast · codex`. Das Standard-PI-Harness bleibt `Runner: pi (embedded)` und fügt
kein separates Harness-Badge hinzu.

## Anforderungen

- OpenClaw mit dem verfügbaren gebündelten Plugin `codex`.
- Codex-App-Server `0.118.0` oder neuer.
- Für den App-Server-Prozess verfügbare Codex-Auth.

Das Plugin blockiert ältere oder versionslose Handshakes des App-Servers. So bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests kommt Auth normalerweise von `OPENAI_API_KEY` sowie
optionalen Codex-CLI-Dateien wie `~/.codex/auth.json` und
`~/.codex/config.toml`. Verwenden Sie dasselbe Auth-Material wie Ihr lokaler Codex-App-Server.

## Minimale Konfiguration

Verwenden Sie `openai/gpt-5.5`, aktivieren Sie das gebündelte Plugin und erzwingen Sie das Harness `codex`:

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie dort ebenfalls `codex` auf:

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

Legacy-Konfigurationen, die `agents.defaults.model` oder ein Agentenmodell auf
`codex/<model>` setzen, aktivieren das gebündelte Plugin `codex` weiterhin automatisch. Neue Konfigurationen sollten
`openai/<model>` plus den expliziten `embeddedHarness`-Eintrag oben bevorzugen.

## Codex hinzufügen, ohne andere Modelle zu ersetzen

Behalten Sie `runtime: "auto"` bei, wenn alte `codex/*`-Refs Codex auswählen und
PI für alles andere verwendet werden soll. Für neue Konfigurationen bevorzugen Sie explizites `runtime: "codex"` bei
den Agenten, die das Harness verwenden sollen.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Mit dieser Form:

- `/model gpt` oder `/model openai/gpt-5.5` verwendet für diese Konfiguration das Codex-App-Server-Harness.
- `/model opus` verwendet den Anthropic-Providerpfad.
- Wenn ein Nicht-Codex-Modell ausgewählt ist, bleibt PI das Kompatibilitäts-Harness.

## Reine Codex-Bereitstellungen

Deaktivieren Sie den PI-Fallback, wenn Sie nachweisen müssen, dass jeder eingebettete Agenten-Turn das
Codex-Harness verwendet:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Überschreibung per Umgebungsvariable:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist,
der App-Server zu alt ist oder der App-Server nicht starten kann.

## Codex pro Agent

Sie können einen Agenten nur für Codex konfigurieren, während der Standard-Agent die normale
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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Verwenden Sie normale Sitzungsbefehle, um Agenten und Modelle zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung, und das Codex-Harness erstellt oder setzt bei Bedarf seinen Sidecar-App-Server-
Thread fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt den nächsten Turn das Harness erneut aus der aktuellen Konfiguration auflösen.

## Modell-Discovery

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn
Discovery fehlschlägt oder ein Timeout eintritt, verwendet es einen gebündelten Fallback-Katalog für:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Sie können Discovery unter `plugins.entries.codex.config.discovery` anpassen:

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

Deaktivieren Sie Discovery, wenn Sie möchten, dass der Start auf Probes an Codex verzichtet und beim
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

## Verbindung und Richtlinie des App-Servers

Standardmäßig startet das Plugin Codex lokal mit:

```bash
codex app-server --listen stdio://
```

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung, die für
autonome Heartbeats verwendet wird: Codex kann Shell- und Netzwerk-Tools verwenden, ohne bei nativen
Genehmigungs-Prompts anzuhalten, die niemand beantworten kann.

Um die von Guardian überprüften nativen Codex-Genehmigungen zu aktivieren, setzen Sie `appServer.mode:
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

Guardian ist ein nativer Genehmigungsprüfer von Codex. Wenn Codex anfragt, die Sandbox zu verlassen, außerhalb des Workspace zu schreiben oder Berechtigungen wie Netzwerkzugriff hinzuzufügen, leitet Codex diese Genehmigungsanfrage an einen Reviewer-Subagenten statt an einen menschlichen Prompt weiter. Der Reviewer wendet das Risikoframework von Codex an und genehmigt oder lehnt die konkrete Anfrage ab. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus möchten, aber weiterhin unbeaufsichtigte Agenten Fortschritte machen sollen.

Das Preset `guardian` wird erweitert zu `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` und `sandbox: "workspace-write"`. Einzelne Richtlinienfelder überschreiben weiterhin `mode`, sodass fortgeschrittene Bereitstellungen das Preset mit expliziten Entscheidungen mischen können.

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

| Feld                | Standard                                 | Bedeutung                                                                                                  |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                          |
| `command`           | `"codex"`                                | Ausführbare Datei für `stdio`-Transport.                                                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für `stdio`-Transport.                                                                           |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                  |
| `authToken`         | nicht gesetzt                            | Bearer-Token für WebSocket-Transport.                                                                      |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                              |
| `requestTimeoutMs`  | `60000`                                  | Timeout für Control-Plane-Aufrufe an den App-Server.                                                       |
| `mode`              | `"yolo"`                                 | Preset für YOLO oder von Guardian überprüfte Ausführung.                                                   |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Start/Resume/Turn des Threads gesendet wird.                  |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Start/Resume des Threads gesendet wird.                               |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"guardian_subagent"`, damit Codex Guardian Prompts prüft.                                  |
| `serviceTier`       | nicht gesetzt                            | Optionale Service-Tier des Codex-App-Servers: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert. |

Die älteren Umgebungsvariablen funktionieren für lokale Tests weiterhin als Fallbacks, wenn
das passende Konfigurationsfeld nicht gesetzt ist:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie
stattdessen `plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration
wird für wiederholbare Bereitstellungen bevorzugt, weil das Plugin-Verhalten so in derselben
geprüften Datei liegt wie der Rest der Codex-Harness-Einrichtung.

## Häufige Rezepte

Lokaler Codex mit standardmäßigem `stdio`-Transport:

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

Validierung eines Codex-only-Harness, mit deaktiviertem PI-Fallback:

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

Von Guardian überprüfte Codex-Genehmigungen:

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
einen bestehenden Codex-Thread gebunden ist, sendet der nächste Turn das aktuell ausgewählte
OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Tier erneut an den
App-Server. Beim Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` bleibt die
Thread-Bindung erhalten, aber OpenClaw fordert Codex auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert auf jedem Kanal, der Textbefehle von OpenClaw unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-Konnektivität zum App-Server, Modelle, Account, Rate Limits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` bindet die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread.
- `/codex compact` fordert den Codex-App-Server auf, den gebundenen Thread zu komprimieren.
- `/codex review` startet die native Codex-Prüfung für den gebundenen Thread.
- `/codex account` zeigt Account- und Rate-Limit-Status.
- `/codex mcp` listet den Status der MCP-Server des Codex-App-Servers auf.
- `/codex skills` listet Skills des Codex-App-Servers auf.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für
normale Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-Modell an den App-Server und lässt die erweiterte Historie
aktiviert.

Die Befehlsoberfläche erfordert Codex-App-Server `0.118.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Das Codex-Harness hat drei Hook-Schichten:

| Schicht                               | Owner                    | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Extension-Middleware des Codex-App-Servers | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.   |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
Verhalten von OpenClaw-Plugins zu routen. Native Codex-Hooks sind nützlich für von Codex besessene
Operationen wie Shell-Richtlinie, native Prüfung von Tool-Ergebnissen, Stop-Verhalten und
native Compaction-/Modell-Lebenszyklen, aber sie sind nicht die OpenClaw-Plugin-API.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den Aufruf angefordert hat, also
führt OpenClaw das Plugin- und Middleware-Verhalten aus, das ihm im
Harness-Adapter gehört. Für Codex-native Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber es kann den nativen Codex-
Thread nicht umschreiben, sofern Codex diese Operation nicht über den App-Server oder native Hook-
Callbacks bereitstellt.

Wenn neuere Builds des Codex-App-Servers native Hook-Ereignisse für Compaction und Modell-Lebenszyklus bereitstellen, soll OpenClaw diese Protokollunterstützung versionsgesteuert freischalten und die
Ereignisse dort in den bestehenden Hook-Vertrag von OpenClaw abbilden, wo die Semantik ehrlich ist.
Bis dahin sind die Ereignisse `before_compaction`, `after_compaction`, `llm_input` und
`llm_output` von OpenClaw Beobachtungen auf Adapter-Ebene, keine Byte-für-Byte-Erfassung
der internen Request- oder Compaction-Payloads von Codex.

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Ausführer des eingebetteten Agenten.

OpenClaw erstellt weiterhin die Tool-Liste und erhält dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben des Messaging-Tools
laufen weiterhin über den normalen Zustellpfad von OpenClaw.

Genehmigungsabfragen von Codex-MCP-Tools werden über den Plugin-
Genehmigungsablauf von OpenClaw geroutet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Prompts `request_user_input` von Codex werden an den
ursprünglichen Chat zurückgesendet, und die nächste in die Warteschlange gestellte Folge-Nachricht beantwortet diese
native Server-Anfrage, statt als zusätzlicher Kontext gelenkt zu werden. Andere MCP-Abfrageanfragen schlagen weiterhin geschlossen fehl.

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw behält ein Spiegel-Transkript für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftiges Umschalten von Modell oder Harness. Der
Spiegel enthält den Benutzer-Prompt, den finalen Assistant-Text und leichtgewichtige Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Heute zeichnet OpenClaw nur Signale zum Start und Abschluss nativer Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder eine auditierbare Liste bereit, welche Einträge Codex nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit keine Datensätze von Ergebnissen Codex-nativer Tools um. Es gilt nur, wenn
OpenClaw ein Tool-Ergebnis in ein von OpenClaw besessenes Sitzungs-Transkript schreibt.

Mediengenerierung erfordert kein PI. Bild, Video, Musik, PDF, TTS und Medien-
Verständnis verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht in `/model`:** Aktivieren Sie `plugins.entries.codex.enabled`,
wählen Sie ein Modell `openai/gpt-*` mit `embeddedHarness.runtime: "codex"` (oder eine
Legacy-Ref `codex/*`) und prüfen Sie, ob `plugins.allow` `codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** Wenn kein Codex-Harness den Lauf beansprucht,
kann OpenClaw PI als Kompatibilitäts-Backend verwenden. Setzen Sie
`embeddedHarness.runtime: "codex"`, um bei Tests die Auswahl von Codex zu erzwingen, oder
`embeddedHarness.fallback: "none"`, damit fehlgeschlagen wird, wenn kein Plugin-Harness passt. Sobald
der Codex-App-Server ausgewählt ist, werden seine Fehler direkt ohne zusätzliche
Fallback-Konfiguration ausgegeben.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, sodass der Handshake des App-Servers
Version `0.118.0` oder neuer meldet.

**Modell-Discovery ist langsam:** Senken Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie Discovery.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und dass der Remote-App-Server dieselbe Protokollversion des Codex-App-Servers spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist zu erwarten, es sei denn, Sie haben
`embeddedHarness.runtime: "codex"` erzwungen (oder eine Legacy-Ref `codex/*` ausgewählt). Reine
`openai/gpt-*`- und andere Provider-Refs bleiben auf ihrem normalen Providerpfad.

## Verwandt

- [Agent Harness Plugins](/de/plugins/sdk-agent-harness)
- [Model Providers](/de/concepts/model-providers)
- [Configuration Reference](/de/gateway/configuration-reference)
- [Testing](/de/help/testing-live#live-codex-app-server-harness-smoke)
