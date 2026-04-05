---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
    - Sie möchten die Authentifizierung des Claude-CLI-Abonnements auf dem Gateway-Host wiederverwenden
summary: Anthropic Claude in OpenClaw über API-Schlüssel oder Claude CLI verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T12:53:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f2b614eba4563093522e5157848fc54a16770a2fae69f17c54f1b9bfff624f
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic entwickelt die **Claude**-Modellfamilie und bietet Zugriff über eine API.
In OpenClaw sollte die neue Anthropic-Einrichtung einen API-Schlüssel oder das lokale Claude-CLI-
Backend verwenden. Bestehende veraltete Anthropic-Token-Profile werden zur Laufzeit weiterhin berücksichtigt,
wenn sie bereits konfiguriert sind.

<Warning>
Die öffentlichen Claude-Code-Dokumente von Anthropic dokumentieren ausdrücklich die nicht interaktive CLI-
Nutzung wie `claude -p`. Auf Grundlage dieser Dokumente glauben wir, dass lokaler,
benutzerverwalteter Claude-Code-CLI-Fallback wahrscheinlich erlaubt ist.

Unabhängig davon informierte Anthropic OpenClaw-Nutzer am **4. April 2026 um 12:00 Uhr
PT / 20:00 Uhr BST**, dass **OpenClaw als Harness eines Drittanbieters zählt**. Laut ihrer
genannten Richtlinie verwendet von OpenClaw gesteuerter Claude-Login-Datenverkehr nicht mehr den
enthaltenen Claude-Abonnement-Pool und erfordert stattdessen **Extra Usage**
(nutzungsbasiert, getrennt vom Abonnement abgerechnet).

Diese Richtlinienunterscheidung betrifft die **von OpenClaw gesteuerte Wiederverwendung der Claude CLI**,
nicht das direkte Ausführen von `claude` in Ihrem eigenen Terminal. Dennoch lässt die Richtlinie von Anthropic zu Harnesses von Drittanbietern weiterhin genug Unklarheit in Bezug auf
abonnementgestützte Nutzung in externen Produkten, sodass wir diesen Pfad nicht für den produktiven Einsatz empfehlen.

Die aktuellen öffentlichen Dokumente von Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Wenn Sie den eindeutigsten Abrechnungspfad möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.
OpenClaw unterstützt auch andere abonnementähnliche Optionen, darunter [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding Plan](/providers/qwen),
[MiniMax Coding Plan](/providers/minimax) und [Z.AI / GLM Coding
Plan](/providers/glm).
</Warning>

## Option A: Anthropic-API-Schlüssel

**Am besten geeignet für:** standardmäßigen API-Zugriff und nutzungsbasierte Abrechnung.
Erstellen Sie Ihren API-Schlüssel in der Anthropic Console.

### CLI-Einrichtung

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Claude-CLI-Konfigurationsausschnitt

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Standardwerte für Thinking (Claude 4.6)

- Anthropic-Claude-4.6-Modelle verwenden in OpenClaw standardmäßig `adaptive` thinking, wenn keine explizite Thinking-Stufe gesetzt ist.
- Sie können dies pro Nachricht (`/think:<level>`) oder in Modellparametern überschreiben:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Verwandte Anthropic-Dokumente:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Fast-Modus (Anthropic API)

Der gemeinsame Schalter `/fast` von OpenClaw unterstützt auch direkten öffentlichen Anthropic-Datenverkehr, einschließlich mit API-Schlüssel und OAuth authentifizierter Anfragen an `api.anthropic.com`.

- `/fast on` wird auf `service_tier: "auto"` abgebildet
- `/fast off` wird auf `service_tier: "standard_only"` abgebildet
- Konfigurationsstandard:

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

Wichtige Einschränkungen:

- OpenClaw fügt Anthropic-Service-Tiers nur für direkte `api.anthropic.com`-Anfragen ein. Wenn Sie `anthropic/*` über einen Proxy oder ein Gateway leiten, lässt `/fast` `service_tier` unverändert.
- Explizite Anthropic-Modellparameter `serviceTier` oder `service_tier` überschreiben den Standard von `/fast`, wenn beide gesetzt sind.
- Anthropic meldet den effektiven Tier in der Antwort unter `usage.service_tier`. Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` dennoch zu `standard` aufgelöst werden.

## Prompt-Caching (Anthropic API)

OpenClaw unterstützt die Prompt-Caching-Funktion von Anthropic. Dies ist **nur für die API** verfügbar; veraltete Anthropic-Token-Authentifizierung berücksichtigt keine Cache-Einstellungen.

### Konfiguration

Verwenden Sie den Parameter `cacheRetention` in Ihrer Modellkonfiguration:

| Wert    | Cache-Dauer | Beschreibung                    |
| ------- | ----------- | ------------------------------- |
| `none`  | Kein Caching | Prompt-Caching deaktivieren    |
| `short` | 5 Minuten   | Standard für API-Key-Authentifizierung |
| `long`  | 1 Stunde    | Erweiterter Cache               |

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

### Standardwerte

Wenn Sie die Authentifizierung mit Anthropic API Key verwenden, setzt OpenClaw automatisch `cacheRetention: "short"` (5-Minuten-Cache) für alle Anthropic-Modelle. Sie können dies überschreiben, indem Sie `cacheRetention` explizit in Ihrer Konfiguration setzen.

### `cacheRetention`-Überschreibungen pro Agent

Verwenden Sie Parameter auf Modellebene als Basis und überschreiben Sie dann bestimmte Agenten über `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline for most agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override for this agent only
    ],
  },
}
```

Reihenfolge der Konfigurationszusammenführung für cachebezogene Parameter:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (übereinstimmende `id`, überschreibt nach Schlüssel)

Damit kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent auf demselben Modell das Caching deaktiviert, um Schreibkosten bei sprunghaftem Verkehr mit geringer Wiederverwendung zu vermeiden.

### Hinweise zu Bedrock Claude

- Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren konfiguriertes `cacheRetention` als Pass-through.
- Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` erzwungen.
- Die intelligenten Standardwerte für Anthropic-API-Schlüssel setzen auch `cacheRetention: "short"` für Claude-on-Bedrock-Modellreferenzen, wenn kein expliziter Wert gesetzt ist.

## 1M-Kontextfenster (Anthropic-Beta)

Das 1M-Kontextfenster von Anthropic ist durch Beta-Zugriff eingeschränkt. In OpenClaw aktivieren Sie es pro Modell
mit `params.context1m: true` für unterstützte Opus-/Sonnet-Modelle.

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

OpenClaw bildet dies bei Anthropic-Anfragen auf `anthropic-beta: context-1m-2025-08-07` ab.

Dies wird nur aktiviert, wenn `params.context1m` für
dieses Modell explizit auf `true` gesetzt ist.

Anforderung: Anthropic muss Long-Context-Nutzung für diese Anmeldedaten
zulassen (typischerweise API-Key-Abrechnung oder der Claude-Login-Pfad / die veraltete Token-Authentifizierung von OpenClaw
mit aktiviertem Extra Usage). Andernfalls gibt Anthropic Folgendes zurück:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Hinweis: Anthropic lehnt derzeit `context-1m-*`-Beta-Anfragen bei Verwendung
veralteter Anthropic-Token-Authentifizierung (`sk-ant-oat-*`) ab. Wenn Sie
`context1m: true` mit diesem veralteten Authentifizierungsmodus konfigurieren, protokolliert OpenClaw eine Warnung und
fällt auf das Standard-Kontextfenster zurück, indem der `context1m`-Beta-
Header übersprungen wird, während die erforderlichen OAuth-Betas beibehalten werden.

## Option B: Claude CLI als Nachrichtenprovider

**Am besten geeignet für:** einen Gateway-Host mit einem einzelnen Benutzer, auf dem Claude CLI bereits installiert ist
und angemeldet wurde, als lokaler Fallback statt als empfohlener Pfad für den produktiven Einsatz.

Hinweis zur Abrechnung: Wir glauben auf Grundlage der öffentlichen CLI-Dokumente von Anthropic, dass der Claude-Code-CLI-Fallback für lokale,
benutzerverwaltete Automatisierung wahrscheinlich erlaubt ist. Dennoch erzeugt die Richtlinie von Anthropic zu Harnesses von Drittanbietern genug Unklarheit in Bezug auf
abonnementgestützte Nutzung in externen Produkten, sodass wir dies nicht für den produktiven Einsatz empfehlen. Anthropic teilte OpenClaw-Nutzern außerdem mit, dass die **von OpenClaw gesteuerte** Claude-
CLI-Nutzung als Datenverkehr eines Harnesses von Drittanbietern behandelt wird und seit dem **4. April 2026
um 12:00 Uhr PT / 20:00 Uhr BST** **Extra Usage** statt der
enthaltenen Claude-Abonnementgrenzen erfordert.

Dieser Pfad verwendet für die Modellinferenz die lokale Binärdatei `claude`, anstatt
die Anthropic-API direkt aufzurufen. OpenClaw behandelt dies als **CLI-Backend-Provider**
mit Modellreferenzen wie:

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

So funktioniert es:

1. OpenClaw startet `claude -p --output-format stream-json --include-partial-messages ...`
   auf dem **Gateway-Host** und sendet den Prompt über stdin.
2. Der erste Turn sendet `--session-id <uuid>`.
3. Folge-Turns verwenden die gespeicherte Claude-Sitzung über `--resume <sessionId>` erneut.
4. Ihre Chat-Nachrichten laufen weiterhin durch die normale OpenClaw-Nachrichtenpipeline, aber
   die eigentliche Modellantwort wird von Claude CLI erzeugt.

### Anforderungen

- Claude CLI muss auf dem Gateway-Host installiert und im PATH verfügbar sein oder
  mit einem absoluten Befehlspfad konfiguriert werden.
- Claude CLI muss bereits auf demselben Host authentifiziert sein:

```bash
claude auth status
```

- OpenClaw lädt beim Gateway-Start automatisch das gebündelte Anthropic-Plugin, wenn Ihre
  Konfiguration explizit auf `claude-cli/...` oder die Backend-Konfiguration `claude-cli` verweist.

### Konfigurationsausschnitt

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

Wenn sich die Binärdatei `claude` nicht im PATH des Gateway-Hosts befindet:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### Was Sie erhalten

- Wiederverwendete Claude-Abonnement-Authentifizierung aus der lokalen CLI (zur Laufzeit gelesen, nicht persistent gespeichert)
- Normales Nachrichten-/Sitzungsrouting von OpenClaw
- Kontinuität von Claude-CLI-Sitzungen über mehrere Turns hinweg (bei Authentifizierungsänderungen ungültig)
- Gateway-Tools, die Claude CLI über eine local loopback-MCP-Bridge bereitgestellt werden
- JSONL-Streaming mit Live-Fortschritt für partielle Nachrichten

### Von Anthropic-Authentifizierung zu Claude CLI migrieren

Wenn Sie derzeit `anthropic/...` mit einem veralteten Token-Profil oder API-Schlüssel verwenden und denselben Gateway-Host auf Claude CLI
umstellen möchten, unterstützt OpenClaw dies als normalen
Migrationspfad für Provider-Authentifizierung.

Voraussetzungen:

- Claude CLI ist auf demselben **Gateway-Host** installiert, auf dem OpenClaw ausgeführt wird
- Claude CLI ist dort bereits angemeldet: `claude auth login`

Führen Sie dann aus:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Oder im Onboarding:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Interaktives `openclaw onboard` und `openclaw configure` bevorzugen jetzt zuerst **Anthropic
Claude CLI** und danach **Anthropic API key**.

Folgendes wird dabei gemacht:

- prüft, dass Claude CLI auf dem Gateway-Host bereits angemeldet ist
- stellt das Standardmodell auf `claude-cli/...` um
- schreibt Anthropic-Standardmodell-Fallbacks wie `anthropic/claude-opus-4-6`
  in `claude-cli/claude-opus-4-6` um
- fügt passende `claude-cli/...`-Einträge zu `agents.defaults.models` hinzu

Schnelle Verifizierung:

```bash
openclaw models status
```

Sie sollten das aufgelöste primäre Modell unter `claude-cli/...` sehen.

Was dabei **nicht** gemacht wird:

- Ihre bestehenden Anthropic-Authentifizierungsprofile löschen
- jede alte `anthropic/...`-Konfigurationsreferenz außerhalb des Hauptpfads für
  Standardmodell/Allowlist entfernen

Dadurch ist ein Rollback einfach: Ändern Sie das Standardmodell bei Bedarf zurück auf `anthropic/...`.

### Wichtige Einschränkungen

- Dies ist **nicht** der Anthropic-API-Provider. Es ist die lokale CLI-Laufzeit.
- OpenClaw injiziert Tool-Aufrufe nicht direkt. Claude CLI erhält Gateway-
  Tools über eine local loopback-MCP-Bridge (`bundleMcp: true`, der Standard).
- Claude CLI streamt Antworten über JSONL (`stream-json` mit
  `--include-partial-messages`). Prompts werden über stdin gesendet, nicht über argv.
- Die Authentifizierung wird zur Laufzeit aus den aktiven Claude-CLI-Anmeldedaten gelesen und nicht in
  OpenClaw-Profilen gespeichert. Schlüsselbundabfragen werden in nicht interaktiven
  Kontexten unterdrückt.
- Die Wiederverwendung von Sitzungen wird über Metadaten in `cliSessionBinding` nachverfolgt. Wenn sich der Anmeldestatus von Claude CLI
  ändert (erneute Anmeldung, Token-Rotation), werden gespeicherte Sitzungen
  ungültig und eine neue Sitzung beginnt.
- Am besten geeignet für einen persönlichen Gateway-Host, nicht für gemeinsam genutzte Multi-User-Abrechnungsumgebungen.

Weitere Details: [/gateway/cli-backends](/de/gateway/cli-backends)

## Hinweise

- Die öffentlichen Claude-Code-Dokumente von Anthropic dokumentieren weiterhin die direkte CLI-Nutzung wie
  `claude -p`. Wir glauben, dass lokaler, benutzerverwalteter Fallback wahrscheinlich erlaubt ist, aber
  der separate Hinweis von Anthropic an OpenClaw-Nutzer besagt, dass der **OpenClaw**
  Claude-Login-Pfad eine Nutzung als Harness eines Drittanbieters ist und **Extra Usage**
  erfordert (nutzungsbasiert, getrennt vom Abonnement abgerechnet). Für den produktiven Einsatz
  empfehlen wir stattdessen Anthropic-API-Schlüssel.
- Das Anthropic-Setup-Token ist in OpenClaw wieder als veralteter/manueller Pfad verfügbar. Der OpenClaw-spezifische Hinweis von Anthropic zur Abrechnung gilt weiterhin, daher sollten Sie diesen Pfad mit der Erwartung nutzen, dass Anthropic dafür **Extra Usage** verlangt.
- Details zur Authentifizierung + Regeln zur Wiederverwendung finden Sie unter [/concepts/oauth](/de/concepts/oauth).

## Fehlerbehebung

**401-Fehler / Token plötzlich ungültig**

- Veraltete Anthropic-Token-Authentifizierung kann ablaufen oder widerrufen werden.
- Für neue Setups sollten Sie zu einem Anthropic-API-Schlüssel oder dem lokalen Claude-CLI-Pfad auf dem Gateway-Host migrieren.

**Kein API-Schlüssel für Provider "anthropic" gefunden**

- Authentifizierung ist **pro Agent**. Neue Agenten übernehmen die Schlüssel des Hauptagenten nicht.
- Führen Sie das Onboarding für diesen Agenten erneut aus oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-
  Host und prüfen Sie dann mit `openclaw models status`.

**Keine Anmeldedaten für Profil `anthropic:default` gefunden**

- Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist.
- Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel oder Claude CLI für diesen Profilpfad.

**Kein verfügbares Authentifizierungsprofil (alle in Cooldown/nicht verfügbar)**

- Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`.
- Anthropic-Cooldowns für Ratenlimits können modellspezifisch sein, sodass ein benachbartes Anthropic-
  Modell möglicherweise weiterhin verwendbar ist, auch wenn das aktuelle gerade im Cooldown ist.
- Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie das Ende des Cooldowns ab.

Mehr dazu: [/gateway/troubleshooting](/de/gateway/troubleshooting) und [/help/faq](/help/faq).
