---
read_when:
    - Sie ändern die eingebettete Agent-Runtime oder die Harness-Registry.
    - Sie registrieren ein Agent-Harness aus einem gebündelten oder vertrauenswürdigen Plugin.
    - Sie möchten verstehen, wie das Codex-Plugin mit Modell-Providern zusammenhängt.
sidebarTitle: Agent Harness
summary: Experimentelle SDK-Oberfläche für Plugins, die den eingebetteten Low-Level-Agent-Executor ersetzen
title: Agent-Harness-Plugins
x-i18n:
    generated_at: "2026-04-24T06:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Ein **Agent-Harness** ist der Low-Level-Executor für einen vorbereiteten OpenClaw-Agent-
Turn. Es ist kein Modell-Provider, kein Channel und keine Tool-Registry.

Verwenden Sie diese Oberfläche nur für gebündelte oder vertrauenswürdige native Plugins. Der Vertrag ist
weiterhin experimentell, weil die Parametertypen absichtlich den aktuellen
eingebetteten Runner spiegeln.

## Wann ein Harness verwendet werden sollte

Registrieren Sie ein Agent-Harness, wenn eine Modelfamilie ihre eigene native Sitzungs-
Runtime hat und der normale OpenClaw-Provider-Transport die falsche Abstraktion ist.

Beispiele:

- ein nativer Coding-Agent-Server, der Threads und Compaction selbst verwaltet
- eine lokale CLI oder ein Daemon, der native Plan-/Reasoning-/Tool-Ereignisse streamen muss
- eine Modell-Runtime, die zusätzlich zum OpenClaw-
  Sitzungs-Transkript ihre eigene Resume-ID benötigt

Registrieren Sie **kein** Harness nur, um eine neue LLM-API hinzuzufügen. Für normale HTTP- oder
WebSocket-Modell-APIs bauen Sie ein [Provider-Plugin](/de/plugins/sdk-provider-plugins).

## Was der Core weiterhin besitzt

Bevor ein Harness ausgewählt wird, hat OpenClaw bereits Folgendes aufgelöst:

- Provider und Modell
- Runtime-Authentifizierungszustand
- Thinking-Level und Kontextbudget
- das OpenClaw-Transkript/die Sitzungsdatei
- Workspace, Sandbox und Tool-Richtlinie
- Channel-Reply-Callbacks und Streaming-Callbacks
- Modell-Fallback und Richtlinie für Live-Modellwechsel

Diese Aufteilung ist beabsichtigt. Ein Harness führt einen vorbereiteten Versuch aus; es wählt
keine Provider, ersetzt keine Channel-Zustellung und wechselt nicht stillschweigend Modelle.

## Ein Harness registrieren

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mein natives Agent-Harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Ihren nativen Thread starten oder fortsetzen.
    // Verwenden Sie params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent und die anderen vorbereiteten Versuchsfelder.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Führt ausgewählte Modelle über einen nativen Agent-Daemon aus.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Auswahlrichtlinie

OpenClaw wählt ein Harness nach der Auflösung von Provider/Modell:

1. Die aufgezeichnete Harness-ID einer bestehenden Sitzung gewinnt, damit Änderungen an Config/Env
   dieses Transkript nicht im laufenden Betrieb auf eine andere Runtime umschalten.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt ein registriertes Harness mit dieser ID für
   Sitzungen, die noch nicht festgelegt sind.
3. `OPENCLAW_AGENT_RUNTIME=pi` erzwingt das eingebaute PI-Harness.
4. `OPENCLAW_AGENT_RUNTIME=auto` fragt registrierte Harnesses, ob sie den
   aufgelösten Provider/das Modell unterstützen.
5. Wenn kein registriertes Harness passt, verwendet OpenClaw PI, sofern der PI-Fallback nicht
   deaktiviert ist.

Fehler von Plugin-Harnesses werden als Laufzeitfehler sichtbar. Im Modus `auto` wird der PI-Fallback
nur verwendet, wenn kein registriertes Plugin-Harness den aufgelösten
Provider/das Modell unterstützt. Sobald ein Plugin-Harness einen Lauf beansprucht hat, spielt OpenClaw
denselben Turn nicht noch einmal über PI ab, weil dies Auth-/Runtime-Semantik verändern
oder Seiteneffekte duplizieren kann.

Die ausgewählte Harness-ID wird nach einem eingebetteten Lauf zusammen mit der Sitzungs-ID persistiert.
Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als an PI angeheftet behandelt, sobald sie
Transkriptverlauf besitzen. Verwenden Sie eine neue/zurückgesetzte Sitzung, wenn Sie zwischen PI und einem
nativen Plugin-Harness wechseln. `/status` zeigt nicht-standardmäßige Harness-IDs wie `codex`
neben `Fast`; PI bleibt verborgen, weil es der standardmäßige Kompatibilitätspfad ist.
Wenn das ausgewählte Harness überraschend ist, aktivieren Sie Debug-Logging für `agents/harness` und
prüfen Sie den strukturierten Gateway-Record `agent harness selected`. Er enthält
die ausgewählte Harness-ID, den Grund der Auswahl, die Runtime-/Fallback-Richtlinie und im
Modus `auto` das Support-Ergebnis jedes Plugin-Kandidaten.

Das gebündelte Codex-Plugin registriert `codex` als seine Harness-ID. Der Core behandelt das
als gewöhnliche Plugin-Harness-ID; Codex-spezifische Aliase gehören in das Plugin
oder die Operator-Konfiguration, nicht in den gemeinsamen Runtime-Selektor.

## Pairing von Provider und Harness

Die meisten Harnesses sollten außerdem einen Provider registrieren. Der Provider macht Modell-Referenzen,
Auth-Status, Modellmetadaten und die Auswahl über `/model` für den Rest von
OpenClaw sichtbar. Das Harness beansprucht dann diesen Provider in `supports(...)`.

Das gebündelte Codex-Plugin folgt diesem Muster:

- Provider-ID: `codex`
- Benutzer-Modellreferenzen: `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"`;
  alte Referenzen `codex/gpt-*` bleiben aus Kompatibilitätsgründen akzeptiert
- Harness-ID: `codex`
- Auth: synthetische Provider-Verfügbarkeit, weil das Codex-Harness den
  nativen Codex-Login/die native Sitzung selbst besitzt
- App-Server-Request: OpenClaw sendet die reine Modell-ID an Codex und lässt das
  Harness mit dem nativen App-Server-Protokoll sprechen

Das Codex-Plugin ist additiv. Reine Referenzen `openai/gpt-*` verwenden weiterhin den
normalen OpenClaw-Provider-Pfad, außer Sie erzwingen das Codex-Harness mit
`embeddedHarness.runtime: "codex"`. Ältere Referenzen `codex/gpt-*` wählen aus
Kompatibilitätsgründen weiterhin den Codex-Provider und das Codex-Harness.

Für Operator-Setup, Beispiele für Modellpräfixe und reine Codex-Konfigurationen siehe
[Codex Harness](/de/plugins/codex-harness).

OpenClaw erfordert Codex app-server `0.118.0` oder neuer. Das Codex-Plugin prüft
den Initialize-Handshake des App-Servers und blockiert ältere oder nicht versionierte Server, damit
OpenClaw nur gegen die Protokolloberfläche läuft, mit der es getestet wurde.

### Middleware für Tool-Ergebnisse im Codex-App-Server

Gebündelte Plugins können außerdem Codex-app-server-spezifische Middleware für `tool_result`
über `api.registerCodexAppServerExtensionFactory(...)` anhängen, wenn ihr
Manifest `contracts.embeddedExtensionFactories: ["codex-app-server"]` deklariert.
Dies ist die Schnittstelle für vertrauenswürdige Plugins für asynchrone Tool-Result-Transformationen, die innerhalb des nativen Codex-Harness laufen müssen, bevor die Tool-Ausgabe zurück in das OpenClaw-Transkript projiziert wird.

### Nativer Codex-Harness-Modus

Das gebündelte Harness `codex` ist der native Codex-Modus für eingebettete OpenClaw-
Agent-Turns. Aktivieren Sie zuerst das gebündelte `codex`-Plugin und nehmen Sie `codex` in
`plugins.allow` auf, wenn Ihre Konfiguration eine restriktive Allowlist verwendet. Native App-Server-
Konfigurationen sollten `openai/gpt-*` mit `embeddedHarness.runtime: "codex"` verwenden.
Verwenden Sie stattdessen `openai-codex/*` für Codex OAuth über PI. Alte Modellreferenzen `codex/*`
bleiben als Kompatibilitätsalias für das native Harness erhalten.

Wenn dieser Modus läuft, besitzt Codex die native Thread-ID, Resume-Verhalten,
Compaction und Ausführung des App-Servers. OpenClaw besitzt weiterhin den Chat-Channel,
den sichtbaren Transkript-Spiegel, die Tool-Richtlinie, Freigaben, Medienzustellung und Sitzungs-
auswahl. Verwenden Sie `embeddedHarness.runtime: "codex"` mit
`embeddedHarness.fallback: "none"`, wenn Sie nachweisen müssen, dass nur der Codex-
App-Server-Pfad den Lauf beanspruchen kann. Diese Konfiguration ist nur eine Auswahl-Leitplanke:
Fehler des Codex-App-Servers schlagen bereits direkt fehl, statt über PI erneut versucht zu werden.

## PI-Fallback deaktivieren

Standardmäßig führt OpenClaw eingebettete Agenten mit `agents.defaults.embeddedHarness`
gesetzt auf `{ runtime: "auto", fallback: "pi" }` aus. Im Modus `auto` können registrierte Plugin-
Harnesses ein Provider-/Modell-Paar beanspruchen. Wenn keines passt, fällt OpenClaw auf PI zurück.

Setzen Sie `fallback: "none"`, wenn das Fehlen einer passenden Plugin-Harness-Auswahl fehlschlagen
soll, statt PI zu verwenden. Fehler bereits ausgewählter Plugin-Harnesses schlagen ohnehin hart fehl. Dies blockiert kein explizites `runtime: "pi"` oder `OPENCLAW_AGENT_RUNTIME=pi`.

Für eingebettete Läufe nur mit Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Wenn jedes registrierte Plugin-Harness passende Modelle beanspruchen darf, Sie aber nie möchten,
dass OpenClaw stillschweigend auf PI zurückfällt, behalten Sie `runtime: "auto"` bei und deaktivieren den Fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Überschreibungen pro Agent verwenden dieselbe Form:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` überschreibt weiterhin die konfigurierte Runtime. Verwenden Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, um den PI-Fallback aus der
Umgebung zu deaktivieren.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt eine Sitzung früh fehl, wenn das angeforderte Harness nicht
registriert ist, den aufgelösten Provider/das Modell nicht unterstützt oder fehlschlägt, bevor
Seiteneffekte des Turns erzeugt wurden. Das ist beabsichtigt für reine Codex-Bereitstellungen und
für Live-Tests, die nachweisen müssen, dass der Pfad des Codex-App-Servers tatsächlich verwendet wird.

Diese Einstellung steuert nur das eingebettete Agent-Harness. Sie deaktiviert
nicht bild-, video-, musik-, TTS-, PDF- oder andere provider-spezifische Modell-Routing-Pfade.

## Native Sitzungen und Transkript-Spiegel

Ein Harness kann eine native Sitzungs-ID, Thread-ID oder ein daemonseitiges Resume-Token behalten.
Halten Sie diese Bindung explizit mit der OpenClaw-Sitzung verknüpft und spiegeln Sie
benutzersichtbare Assistant-/Tool-Ausgabe weiterhin in das OpenClaw-Transkript.

Das OpenClaw-Transkript bleibt die Kompatibilitätsschicht für:

- sichtbaren Sitzungsverlauf in Channels
- Transkript-Suche und -Indexierung
- späteres Zurückwechseln zum eingebauten PI-Harness in einem folgenden Turn
- generisches Verhalten von `/new`, `/reset` und dem Löschen von Sitzungen

Wenn Ihr Harness eine Sidecar-Bindung speichert, implementieren Sie `reset(...)`, damit OpenClaw
sie löschen kann, wenn die zugehörige OpenClaw-Sitzung zurückgesetzt wird.

## Tool- und Medienergebnisse

Der Core erstellt die OpenClaw-Tool-Liste und übergibt sie in den vorbereiteten Versuch.
Wenn ein Harness einen dynamischen Tool-Aufruf ausführt, geben Sie das Tool-Ergebnis über
die Ergebnisform des Harness zurück, statt Channel-Medien selbst zu senden.

Dadurch bleiben Text-, Bild-, Video-, Musik-, TTS-, Freigabe- und Messaging-Tool-Ausgaben
auf demselben Zustellungspfad wie bei PI-gestützten Läufen.

## Aktuelle Einschränkungen

- Der öffentliche Importpfad ist generisch, aber einige Typalias für Versuche/Ergebnisse tragen aus Kompatibilitätsgründen noch
  `Pi`-Namen.
- Die Installation von Third-Party-Harnesses ist experimentell. Bevorzugen Sie Provider-Plugins,
  bis Sie wirklich eine native Sitzungs-Runtime brauchen.
- Ein Wechsel des Harnesses zwischen Turns wird unterstützt. Wechseln Sie Harnesses nicht mitten in einem Turn,
  nachdem native Tools, Freigaben, Assistant-Text oder Nachrichtensendungen bereits begonnen haben.

## Verwandt

- [SDK Overview](/de/plugins/sdk-overview)
- [Runtime Helpers](/de/plugins/sdk-runtime)
- [Provider Plugins](/de/plugins/sdk-provider-plugins)
- [Codex Harness](/de/plugins/codex-harness)
- [Model Providers](/de/concepts/model-providers)
