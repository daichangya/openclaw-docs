---
read_when:
    - Hinzufügen oder Ändern der Models-CLI (models list/set/scan/aliases/fallbacks)
    - Fallback-Verhalten von Modellen oder UX der Modellauswahl ändern
    - Modell-scan-Prüfungen aktualisieren (Tools/Bilder)
summary: 'Models-CLI: auflisten, setzen, Aliasse, Fallbacks, scan, Status'
title: Models-CLI
x-i18n:
    generated_at: "2026-04-24T06:34:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

Siehe [/concepts/model-failover](/de/concepts/model-failover) für die Rotation von Auth-Profilen,
Cooldowns und die Interaktion mit Fallbacks.
Kurzer Anbieterüberblick + Beispiele: [/concepts/model-providers](/de/concepts/model-providers).

## Wie die Modellauswahl funktioniert

OpenClaw wählt Modelle in dieser Reihenfolge aus:

1. **Primäres** Modell (`agents.defaults.model.primary` oder `agents.defaults.model`).
2. **Fallbacks** in `agents.defaults.model.fallbacks` (in Reihenfolge).
3. **Anbieter-Auth-Failover** erfolgt innerhalb eines Anbieters, bevor zum
   nächsten Modell gewechselt wird.

Verwandt:

- `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliasse).
- `agents.defaults.imageModel` wird **nur dann** verwendet, wenn das primäre Modell keine Bilder akzeptieren kann.
- `agents.defaults.pdfModel` wird vom Tool `pdf` verwendet. Wenn es weggelassen wird, greift das Tool
  auf `agents.defaults.imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `agents.defaults.imageGenerationModel` wird von der gemeinsamen Fähigkeit zur Bildgenerierung verwendet. Wenn es weggelassen wird, kann `image_generate` dennoch einen Auth-gestützten Anbieterstandard ableiten. Es versucht zuerst den aktuellen Standardanbieter und dann die verbleibenden registrierten Anbieter für Bildgenerierung in Anbieter-ID-Reihenfolge. Wenn Sie ein bestimmtes Anbieter-/Modellpaar setzen, konfigurieren Sie auch die Auth/den API-Schlüssel dieses Anbieters.
- `agents.defaults.musicGenerationModel` wird von der gemeinsamen Fähigkeit zur Musikgenerierung verwendet. Wenn es weggelassen wird, kann `music_generate` dennoch einen Auth-gestützten Anbieterstandard ableiten. Es versucht zuerst den aktuellen Standardanbieter und dann die verbleibenden registrierten Anbieter für Musikgenerierung in Anbieter-ID-Reihenfolge. Wenn Sie ein bestimmtes Anbieter-/Modellpaar setzen, konfigurieren Sie auch die Auth/den API-Schlüssel dieses Anbieters.
- `agents.defaults.videoGenerationModel` wird von der gemeinsamen Fähigkeit zur Videogenerierung verwendet. Wenn es weggelassen wird, kann `video_generate` dennoch einen Auth-gestützten Anbieterstandard ableiten. Es versucht zuerst den aktuellen Standardanbieter und dann die verbleibenden registrierten Anbieter für Videogenerierung in Anbieter-ID-Reihenfolge. Wenn Sie ein bestimmtes Anbieter-/Modellpaar setzen, konfigurieren Sie auch die Auth/den API-Schlüssel dieses Anbieters.
- Standardwerte pro Agent können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [/concepts/multi-agent](/de/concepts/multi-agent)).

## Kurze Modellrichtlinie

- Setzen Sie Ihr primäres Modell auf das stärkste Modell der neuesten Generation, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzsensitive Aufgaben und weniger kritische Chats.
- Für Agenten mit aktivierten Tools oder nicht vertrauenswürdigen Eingaben vermeiden Sie ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht manuell bearbeiten möchten, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Auth für gängige Anbieter einrichten, einschließlich **OpenAI Code (Codex)
subscription** (OAuth) und **Anthropic** (API-Schlüssel oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliasse + Anbieterparameter)
- `models.providers` (benutzerdefinierte Anbieter, die in `models.json` geschrieben werden)

Modellreferenzen werden zu Kleinbuchstaben normalisiert. Anbieter-Aliasse wie `z.ai/*` werden
zu `zai/*` normalisiert.

Beispiele für die Anbieterkonfiguration (einschließlich OpenCode) finden Sie in
[/providers/opencode](/de/providers/opencode).

### Sichere Bearbeitung der Allowlist

Verwenden Sie additive Schreibvorgänge, wenn Sie `agents.defaults.models` manuell aktualisieren:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` schützt Modell-/Anbietermaps vor versehentlichem Überschreiben. Eine
einfache Objektzuweisung an `agents.defaults.models`, `models.providers` oder
`models.providers.<id>.models` wird abgelehnt, wenn dadurch vorhandene
Einträge entfernt würden. Verwenden Sie `--merge` für additive Änderungen; verwenden Sie `--replace` nur dann, wenn der angegebene Wert zum vollständigen Zielwert werden soll.

Interaktive Anbietereinrichtung und `openclaw configure --section model` führen ebenfalls
anbieterbezogene Auswahlen in die vorhandene Allowlist zusammen, sodass das Hinzufügen von Codex,
Ollama oder einem anderen Anbieter keine unabhängigen Modelleinträge entfernt.

## „Model is not allowed“ (und warum Antworten ausbleiben)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für
Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist steht,
gibt OpenClaw Folgendes zurück:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Dies geschieht **bevor** eine normale Antwort generiert wird, sodass es sich so anfühlen kann,
als habe die Nachricht „nicht geantwortet“. Die Lösung besteht darin:

- das Modell zu `agents.defaults.models` hinzuzufügen, oder
- die Allowlist zu leeren (`agents.defaults.models` entfernen), oder
- ein Modell aus `/model list` auszuwählen.

Beispiel für eine Allowlist-Konfiguration:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Modelle im Chat wechseln (`/model`)

Sie können Modelle für die aktuelle Sitzung wechseln, ohne neu zu starten:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Hinweise:

- `/model` (und `/model list`) ist ein kompakter, nummerierter Picker (Modellfamilie + verfügbare Anbieter).
- In Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Anbieter und Modell sowie einem Submit-Schritt.
- `/models add` ist standardmäßig verfügbar und kann mit `commands.modelsWrite=false` deaktiviert werden.
- Wenn aktiviert, ist `/models add <provider> <modelId>` der schnellste Weg; ein einfaches `/models add` startet, wo unterstützt, einen geführten Ablauf mit Anbieter zuerst.
- Nach `/models add` wird das neue Modell in `/models` und `/model` verfügbar, ohne dass das Gateway neu gestartet werden muss.
- `/model <#>` wählt aus diesem Picker aus.
- `/model` speichert die neue Sitzungsauswahl sofort.
- Wenn der Agent im Leerlauf ist, verwendet der nächste Lauf sofort das neue Modell.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Retry-Punkt mit dem neuen Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Retry-Gelegenheit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
- `/model status` ist die Detailansicht (Auth-Kandidaten und, wenn konfiguriert, Anbieter-Endpunkt `baseUrl` + `api`-Modus).
- Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
- Wenn die Modell-ID selbst `/` enthält (im Stil von OpenRouter), müssen Sie das Anbieterpräfix angeben (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Anbieter weglassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
  1. Alias-Übereinstimmung
  2. eindeutige configured-provider-Übereinstimmung für genau diese nicht präfixierte Modell-ID
  3. veralteter Fallback auf den konfigurierten Standardanbieter
     Wenn dieser Anbieter das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw
     stattdessen auf das erste konfigurierte Anbieter-/Modellpaar zurück, um
     keinen veralteten, entfernten Anbieterstandard anzuzeigen.

Vollständiges Befehlsverhalten/volle Konfiguration: [Slash commands](/de/tools/slash-commands).

Beispiele:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## CLI-Befehle

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (ohne Unterbefehl) ist eine Abkürzung für `models status`.

### `models list`

Zeigt standardmäßig konfigurierte Modelle an. Nützliche Flags:

- `--all`: vollständiger Katalog
- `--local`: nur lokale Anbieter
- `--provider <id>`: nach Anbieter-ID filtern, zum Beispiel `moonshot`; Anzeige-
  Bezeichnungen aus interaktiven Pickern werden nicht akzeptiert
- `--plain`: ein Modell pro Zeile
- `--json`: maschinenlesbare Ausgabe

`--all` enthält gebündelte statische Katalogzeilen im Besitz des Anbieters bereits vor der Konfiguration von Auth, sodass reine Erkennungsansichten Modelle anzeigen können, die erst nach Hinzufügen passender Anbieter-Anmeldedaten verfügbar sind.

### `models status`

Zeigt das aufgelöste primäre Modell, Fallbacks, das Bildmodell und einen Auth-Überblick
über konfigurierte Anbieter an. Es zeigt außerdem den OAuth-Ablaufstatus für im Auth-Store gefundene Profile an (warnt standardmäßig innerhalb von 24h). `--plain` gibt nur das
aufgelöste primäre Modell aus.
Der OAuth-Status wird immer angezeigt (und in der Ausgabe von `--json` enthalten). Wenn ein konfigurierter
Anbieter keine Anmeldedaten hat, gibt `models status` einen Abschnitt **Missing auth** aus.
JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers`
(effektive Auth pro Anbieter, einschließlich Env-gestützter Anmeldedaten). `auth.oauth`
betrifft nur die Profilintegrität des Auth-Stores; Anbieter nur mit Env erscheinen dort nicht.
Verwenden Sie `--check` für Automatisierung (Exit `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
Verwenden Sie `--probe` für Live-Auth-Prüfungen; Probe-Zeilen können aus Auth-Profilen, Env-
Anmeldedaten oder `models.json` stammen.
Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet Probe
`excluded_by_auth_order`, statt es zu versuchen. Wenn Auth existiert, aber kein prüfbares Modell für diesen Anbieter aufgelöst werden kann, meldet Probe `status: no_model`.

Die Auth-Auswahl ist anbieter-/kontenabhängig. Für ständig aktive Gateway-Hosts sind API-
Schlüssel in der Regel am vorhersehbarsten; die Wiederverwendung von Claude CLI und vorhandene Anthropic-
OAuth-/Token-Profile werden ebenfalls unterstützt.

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scan (kostenlose OpenRouter-Modelle)

`openclaw models scan` prüft den **kostenlosen Modellkatalog** von OpenRouter und kann
optional Modelle auf Tool- und Bildunterstützung prüfen.

Wichtige Flags:

- `--no-probe`: Live-Prüfungen überspringen (nur Metadaten)
- `--min-params <b>`: minimale Parametergröße (Milliarden)
- `--max-age-days <days>`: ältere Modelle überspringen
- `--provider <name>`: Filter nach Anbieterpräfix
- `--max-candidates <n>`: Größe der Fallback-Liste
- `--set-default`: `agents.defaults.model.primary` auf die erste Auswahl setzen
- `--set-image`: `agents.defaults.imageModel.primary` auf die erste Bildauswahl setzen

Für das Prüfen ist ein OpenRouter-API-Schlüssel erforderlich (aus Auth-Profilen oder
`OPENROUTER_API_KEY`). Ohne Schlüssel verwenden Sie `--no-probe`, um nur Kandidaten aufzulisten.

Scan-Ergebnisse werden nach folgenden Kriterien sortiert:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe

- OpenRouter-Liste `/models` (Filter `:free`)
- Erfordert OpenRouter-API-Schlüssel aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [/environment](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Probe-Steuerung: `--timeout`, `--concurrency`

Wenn die Ausführung in einem TTY erfolgt, können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven
Modus übergeben Sie `--yes`, um die Standardwerte zu akzeptieren.

## Modellregistry (`models.json`)

Benutzerdefinierte Anbieter in `models.providers` werden in `models.json` unter dem
Agentenverzeichnis geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei
wird standardmäßig zusammengeführt, sofern `models.mode` nicht auf `replace` gesetzt ist.

Priorität des Merge-Modus für übereinstimmende Anbieter-IDs:

- Bereits vorhandenes, nicht leeres `baseUrl` in der `models.json` des Agenten hat Vorrang.
- Bereits vorhandenes, nicht leeres `apiKey` in der `models.json` des Agenten hat nur dann Vorrang, wenn dieser Anbieter im aktuellen Kontext von Konfiguration/Auth-Profil nicht durch SecretRef verwaltet wird.
- Durch SecretRef verwaltete `apiKey`-Werte von Anbietern werden aus Quellmarkern aktualisiert (`ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs), statt aufgelöste Secrets zu persistieren.
- Durch SecretRef verwaltete Header-Werte von Anbietern werden aus Quellmarkern aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs).
- Leeres oder fehlendes `apiKey`/`baseUrl` des Agenten fällt auf `models.providers` aus der Konfiguration zurück.
- Andere Anbieterfelder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

Die Persistenz von Markern ist quellenautoritatv: OpenClaw schreibt Marker aus dem aktiven Quell-Konfigurationssnapshot (vor der Auflösung), nicht aus aufgelösten Laufzeit-Secret-Werten.
Dies gilt immer dann, wenn OpenClaw `models.json` neu generiert, einschließlich befehlsgesteuerter Pfade wie `openclaw agent`.

## Verwandt

- [Modellanbieter](/de/concepts/model-providers) — Anbieter-Routing und Auth
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Bildgenerierung](/de/tools/image-generation) — Konfiguration des Bildmodells
- [Musikgenerierung](/de/tools/music-generation) — Konfiguration des Musikmodells
- [Videogenerierung](/de/tools/video-generation) — Konfiguration des Videomodells
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Konfigurationsschlüssel für Modelle
