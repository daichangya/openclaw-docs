---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude in OpenClaw über API-Schlüssel oder Claude CLI verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-04-07T06:18:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 423928fd36c66729985208d4d3f53aff1f94f63b908df85072988bdc41d5cf46
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic entwickelt die **Claude**-Modellfamilie und bietet Zugriff über eine API und
Claude CLI. In OpenClaw werden sowohl Anthropic-API-Schlüssel als auch die
Wiederverwendung von Claude CLI unterstützt. Bereits konfigurierte ältere Anthropic-Token-Profile
werden zur Laufzeit weiterhin berücksichtigt.

<Warning>
Mitarbeitende von Anthropic haben uns mitgeteilt, dass eine Nutzung von Claude CLI im Stil von OpenClaw wieder erlaubt ist, daher
behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese
Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.

Für langlebige Gateway-Hosts bleiben Anthropic-API-Schlüssel dennoch der klarste und
am besten vorhersehbare Produktionspfad. Wenn Sie Claude CLI bereits auf dem Host verwenden,
kann OpenClaw diese Anmeldung direkt wiederverwenden.

Die aktuellen öffentlichen Dokumente von Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Wenn Sie den klarsten Abrechnungspfad möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.
OpenClaw unterstützt auch andere abonnementartige Optionen, darunter [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding Plan](/de/providers/qwen),
[MiniMax Coding Plan](/de/providers/minimax) und [Z.AI / GLM Coding
Plan](/de/providers/glm).
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

### Anthropic-Konfigurationsausschnitt

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Thinking-Standards (Claude 4.6)

- Anthropic-Claude-4.6-Modelle verwenden in OpenClaw standardmäßig `adaptive` Thinking, wenn kein explizites Thinking-Level gesetzt ist.
- Sie können dies pro Nachricht (`/think:<level>`) oder in den Modellparametern überschreiben:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Zugehörige Anthropic-Dokumentation:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Fast-Modus (Anthropic API)

Der gemeinsame Schalter `/fast` von OpenClaw unterstützt auch direkten öffentlichen Anthropic-Datenverkehr, einschließlich Anfragen mit API-Schlüssel- und OAuth-Authentifizierung, die an `api.anthropic.com` gesendet werden.

- `/fast on` wird zu `service_tier: "auto"` zugeordnet
- `/fast off` wird zu `service_tier: "standard_only"` zugeordnet
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

- OpenClaw fügt Anthropic-Service-Tiers nur für direkte Anfragen an `api.anthropic.com` ein. Wenn Sie `anthropic/*` über einen Proxy oder ein Gateway routen, lässt `/fast` `service_tier` unverändert.
- Explizite Anthropic-Modellparameter `serviceTier` oder `service_tier` überschreiben den Standard von `/fast`, wenn beide gesetzt sind.
- Anthropic meldet das tatsächlich verwendete Tier in der Antwort unter `usage.service_tier`. Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` weiterhin zu `standard` aufgelöst werden.

## Prompt-Caching (Anthropic API)

OpenClaw unterstützt die Prompt-Caching-Funktion von Anthropic. Diese ist **nur für die API** verfügbar; ältere Anthropic-Token-Authentifizierung berücksichtigt Cache-Einstellungen nicht.

### Konfiguration

Verwenden Sie den Parameter `cacheRetention` in Ihrer Modellkonfiguration:

| Value   | Cache Duration | Description              |
| ------- | -------------- | ------------------------ |
| `none`  | Kein Caching   | Prompt-Caching deaktivieren |
| `short` | 5 Minuten      | Standard für API-Key-Authentifizierung |
| `long`  | 1 Stunde       | Erweiterter Cache        |

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

### Standards

Bei Verwendung der Anthropic-API-Key-Authentifizierung wendet OpenClaw automatisch `cacheRetention: "short"` (5-Minuten-Cache) für alle Anthropic-Modelle an. Sie können dies überschreiben, indem Sie `cacheRetention` explizit in Ihrer Konfiguration setzen.

### CacheRetention-Überschreibungen pro Agent

Verwenden Sie Modellparameter als Basis und überschreiben Sie dann bestimmte Agenten über `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // Baseline für die meisten Agenten
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // Überschreibung nur für diesen Agenten
    ],
  },
}
```

Zusammenführungsreihenfolge der Konfiguration für cachebezogene Parameter:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (passende `id`, überschreibt nach Schlüssel)

Damit kann ein Agent einen langlebigen Cache beibehalten, während ein anderer Agent auf demselben Modell das Caching deaktiviert, um Schreibkosten bei sprunghaftem oder wenig wiederverwendetem Datenverkehr zu vermeiden.

### Hinweise zu Bedrock Claude

- Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren konfiguriertes `cacheRetention` als Pass-through.
- Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` erzwungen.
- Die smarten Standardwerte für Anthropic-API-Schlüssel setzen auch für Claude-on-Bedrock-Modellreferenzen `cacheRetention: "short"`, wenn kein expliziter Wert gesetzt ist.

## 1M-Kontextfenster (Anthropic-Beta)

Das 1M-Kontextfenster von Anthropic ist beta-gesteuert. In OpenClaw aktivieren Sie es pro Modell
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

OpenClaw ordnet dies bei Anthropic-
Anfragen `anthropic-beta: context-1m-2025-08-07` zu.

Dies wird nur aktiviert, wenn `params.context1m` für
dieses Modell explizit auf `true` gesetzt ist.

Voraussetzung: Anthropic muss die Nutzung von langem Kontext für diese Anmeldedaten zulassen.

Hinweis: Anthropic lehnt derzeit `context-1m-*`-Beta-Anfragen bei Verwendung
der älteren Anthropic-Token-Authentifizierung (`sk-ant-oat-*`) ab. Wenn Sie
`context1m: true` mit diesem älteren Auth-Modus konfigurieren, protokolliert OpenClaw eine Warnung und
fällt auf das Standard-Kontextfenster zurück, indem der Kontext1m-Beta-
Header übersprungen wird, während die erforderlichen OAuth-Betas beibehalten werden.

## Claude-CLI-Backend

Das gebündelte Anthropic-`claude-cli`-Backend wird in OpenClaw unterstützt.

- Mitarbeitende von Anthropic haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist.
- OpenClaw behandelt daher die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` als
  für diese Integration zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-API-Schlüssel bleiben der klarste Produktionspfad für dauerhaft laufende Gateway-
  Hosts und explizite serverseitige Abrechnungskontrolle.
- Einrichtungs- und Laufzeitdetails finden Sie unter [/gateway/cli-backends](/de/gateway/cli-backends).

## Hinweise

- Die öffentlichen Claude-Code-Dokumente von Anthropic dokumentieren weiterhin direkte CLI-Nutzung wie
  `claude -p`, und Mitarbeitende von Anthropic haben uns mitgeteilt, dass Claude-CLI-Nutzung im Stil von OpenClaw
  wieder erlaubt ist. Wir behandeln diese Leitlinie als geklärt, sofern Anthropic
  keine neue Richtlinienänderung veröffentlicht.
- Anthropic-Setup-Token bleibt in OpenClaw als unterstützter tokenbasierter Auth-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.
- Auth-Details + Wiederverwendungsregeln finden Sie unter [/concepts/oauth](/de/concepts/oauth).

## Fehlerbehebung

**401-Fehler / Token plötzlich ungültig**

- Die tokenbasierte Anthropic-Authentifizierung kann ablaufen oder widerrufen werden.
- Für neue Setups migrieren Sie zu einem Anthropic-API-Schlüssel.

**Kein API-Schlüssel für Provider "anthropic" gefunden**

- Authentifizierung ist **pro Agent**. Neue Agenten übernehmen die Schlüssel des Hauptagenten nicht.
- Führen Sie das Onboarding für diesen Agenten erneut aus oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-
  Host und verifizieren Sie dann mit `openclaw models status`.

**Keine Anmeldedaten für Profil `anthropic:default` gefunden**

- Führen Sie `openclaw models status` aus, um zu sehen, welches Auth-Profil aktiv ist.
- Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.

**Kein verfügbares Auth-Profil (alle in Cooldown/nicht verfügbar)**

- Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`.
- Anthropic-Rate-Limit-Cooldowns können modellspezifisch sein, daher kann ein anderes Anthropic-
  Modell weiterhin nutzbar sein, selbst wenn das aktuelle gerade im Cooldown ist.
- Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie auf das Ende des Cooldowns.

Mehr: [/gateway/troubleshooting](/de/gateway/troubleshooting) und [/help/faq](/de/help/faq).
