---
read_when:
    - Models CLI hinzufügen oder ändern (models list/set/scan/aliases/fallbacks)
    - Fallback-Verhalten oder Auswahl-UX für Modelle ändern
    - Scan-Probes für Modelle aktualisieren (Tools/Bilder)
summary: 'Models CLI: auflisten, setzen, Aliasse, Fallbacks, Scan, Status'
title: Models CLI
x-i18n:
    generated_at: "2026-04-05T12:40:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08f7e50da263895dae2bd2b8dc327972ea322615f8d1918ddbd26bb0fb24840
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

Siehe [/concepts/model-failover](/concepts/model-failover) für die Rotation von
Auth-Profilen, Cooldowns und die Interaktion mit Fallbacks.
Kurzer Überblick über Provider + Beispiele: [/concepts/model-providers](/concepts/model-providers).

## So funktioniert die Modellauswahl

OpenClaw wählt Modelle in dieser Reihenfolge aus:

1. **Primärmodell** (`agents.defaults.model.primary` oder `agents.defaults.model`).
2. **Fallbacks** in `agents.defaults.model.fallbacks` (in Reihenfolge).
3. **Provider-Auth-Failover** findet innerhalb eines Providers statt, bevor zum
   nächsten Modell gewechselt wird.

Verwandt:

- `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliasse).
- `agents.defaults.imageModel` wird **nur dann** verwendet, wenn das Primärmodell keine Bilder akzeptieren kann.
- `agents.defaults.pdfModel` wird vom Tool `pdf` verwendet. Wenn es fehlt, greift das Tool auf `agents.defaults.imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `agents.defaults.imageGenerationModel` wird von der gemeinsamen Bildgenerierungsfunktion verwendet. Wenn es fehlt, kann `image_generate` weiterhin einen Auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und dann die übrigen registrierten Bildgenerierungs-Provider in der Reihenfolge der Provider-IDs. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/den API-Schlüssel dieses Providers.
- `agents.defaults.videoGenerationModel` wird von der gemeinsamen Videogenerierungsfunktion verwendet. Anders als bei der Bildgenerierung wird heute kein Provider-Standard abgeleitet. Setzen Sie ein explizites `provider/model` wie `qwen/wan2.6-t2v` und konfigurieren Sie auch die Auth/den API-Schlüssel dieses Providers.
- Standards pro Agent können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [/concepts/multi-agent](/concepts/multi-agent)).

## Schnelle Modellrichtlinie

- Setzen Sie Ihr Primärmodell auf das stärkste Modell der neuesten Generation, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzsensitive Aufgaben und Chat mit geringerer Tragweite.
- Vermeiden Sie bei Agenten mit aktivierten Tools oder nicht vertrauenswürdigen Eingaben ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht manuell bearbeiten möchten, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Auth für gängige Provider einrichten, einschließlich **OpenAI Code (Codex)
subscription** (OAuth) und **Anthropic** (API-Schlüssel oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliasse + Provider-Parameter)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

Modellreferenzen werden auf Kleinbuchstaben normalisiert. Provider-Aliasse wie `z.ai/*` werden
zu `zai/*` normalisiert.

Beispiele für Provider-Konfigurationen (einschließlich OpenCode) finden Sie unter
[/providers/opencode](/providers/opencode).

## "Model is not allowed" (und warum Antworten ausbleiben)

Wenn `agents.defaults.models` gesetzt ist, wird dies zur **Allowlist** für `/model` und für
Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist,
gibt OpenClaw Folgendes zurück:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Das geschieht **bevor** eine normale Antwort erzeugt wird, sodass es sich anfühlen kann,
als hätte die Nachricht „nicht geantwortet“. Die Lösung ist entweder:

- Das Modell zu `agents.defaults.models` hinzuzufügen, oder
- Die Allowlist zu leeren (`agents.defaults.models` entfernen), oder
- Ein Modell aus `/model list` auszuwählen.

Beispielkonfiguration für eine Allowlist:

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

- `/model` (und `/model list`) ist ein kompakter nummerierter Picker (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Provider und Modell sowie einem Submit-Schritt.
- `/model <#>` wählt aus diesem Picker aus.
- `/model` speichert die neue Sitzungsauswahl sofort.
- Wenn der Agent untätig ist, verwendet die nächste Ausführung das neue Modell sofort.
- Wenn bereits eine Ausführung aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt mit dem neuen Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen haben, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
- `/model status` ist die detaillierte Ansicht (Auth-Kandidaten und, wenn konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).
- Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
- Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), müssen Sie das Provider-Präfix angeben (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
  1. Alias-Treffer
  2. eindeutiger Treffer eines konfigurierten Providers für genau diese Modell-ID ohne Präfix
  3. veralteter Fallback auf den konfigurierten Standard-Provider
     Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw
     stattdessen auf das erste konfigurierte Provider-/Modellpaar zurück, um keinen veralteten entfernten Provider-Standard anzuzeigen.

Vollständiges Befehlsverhalten/Konfiguration: [Slash commands](/tools/slash-commands).

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
- `--local`: nur lokale Provider
- `--provider <name>`: nach Provider filtern
- `--plain`: ein Modell pro Zeile
- `--json`: maschinenlesbare Ausgabe

### `models status`

Zeigt das aufgelöste Primärmodell, Fallbacks, Bildmodell und einen Auth-Überblick
über konfigurierte Provider an. Außerdem wird der OAuth-Ablaufstatus für Profile aus dem
Auth-Store angezeigt (standardmäßig Warnung innerhalb von 24 h). `--plain` gibt nur das
aufgelöste Primärmodell aus.
Der OAuth-Status wird immer angezeigt (und in der Ausgabe von `--json` enthalten). Wenn ein konfigurierter
Provider keine Anmeldedaten hat, gibt `models status` einen Abschnitt **Missing auth** aus.
JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers`
(effektive Auth pro Provider).
Verwenden Sie `--check` für Automatisierung (Exit-Code `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
Verwenden Sie `--probe` für Live-Auth-Prüfungen; Probe-Zeilen können aus Auth-Profilen, Env-
Anmeldedaten oder `models.json` stammen.
Wenn ein explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet der Probe
`excluded_by_auth_order`, statt es zu versuchen. Wenn Auth existiert, aber für diesen Provider kein prüfbares
Modell aufgelöst werden kann, meldet der Probe `status: no_model`.

Die Wahl der Auth hängt von Provider/Konto ab. Für dauerhaft laufende Gateway-Hosts sind API-
Schlüssel in der Regel am vorhersehbarsten; Wiederverwendung der Claude CLI und vorhandene Anthropic-OAuth-/Token-Profile werden ebenfalls unterstützt.

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scanning (kostenlose OpenRouter-Modelle)

`openclaw models scan` prüft den **Katalog kostenloser Modelle** von OpenRouter und kann
optional Modelle auf Tool- und Bildunterstützung testen.

Wichtige Flags:

- `--no-probe`: Live-Probes überspringen (nur Metadaten)
- `--min-params <b>`: minimale Parametergröße (Milliarden)
- `--max-age-days <days>`: ältere Modelle überspringen
- `--provider <name>`: Filter für Provider-Präfix
- `--max-candidates <n>`: Größe der Fallback-Liste
- `--set-default`: `agents.defaults.model.primary` auf die erste Auswahl setzen
- `--set-image`: `agents.defaults.imageModel.primary` auf die erste Bildauswahl setzen

Für Probing ist ein OpenRouter-API-Schlüssel erforderlich (aus Auth-Profilen oder
`OPENROUTER_API_KEY`). Ohne Schlüssel verwenden Sie `--no-probe`, um nur Kandidaten aufzulisten.

Scan-Ergebnisse werden folgendermaßen eingestuft:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe

- OpenRouter-Liste `/models` (Filter `:free`)
- Erfordert einen OpenRouter-API-Schlüssel aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [/environment](/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Probe-Steuerungen: `--timeout`, `--concurrency`

Bei Ausführung in einem TTY können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven
Modus übergeben Sie `--yes`, um die Standardwerte zu akzeptieren.

## Modell-Registry (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden in `models.json` unter dem
Agentenverzeichnis geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei
wird standardmäßig zusammengeführt, sofern `models.mode` nicht auf `replace` gesetzt ist.

Priorität im Zusammenführungsmodus bei übereinstimmenden Provider-IDs:

- Bereits vorhandene nichtleere `baseUrl` in der `models.json` des Agenten gewinnt.
- Nichtleerer `apiKey` in der `models.json` des Agenten gewinnt nur dann, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profilkontext nicht über SecretRef verwaltet wird.
- SecretRef-verwaltete `apiKey`-Werte von Providern werden aus Quellmarkierungen (`ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen) aktualisiert, statt aufgelöste Secrets zu persistieren.
- SecretRef-verwaltete Header-Werte von Providern werden aus Quellmarkierungen aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen).
- Leere oder fehlende `apiKey`/`baseUrl` des Agenten fallen auf `models.providers` in der Konfiguration zurück.
- Andere Provider-Felder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

Die Persistierung von Markierungen ist quellautorisiert: OpenClaw schreibt Markierungen aus dem Snapshot der aktiven Quellkonfiguration (vor der Auflösung), nicht aus aufgelösten Laufzeit-Secret-Werten.
Dies gilt immer dann, wenn OpenClaw `models.json` neu generiert, einschließlich befehlsgetriebener Pfade wie `openclaw agent`.

## Verwandt

- [Model Providers](/concepts/model-providers) — Provider-Routing und Auth
- [Model Failover](/concepts/model-failover) — Fallback-Ketten
- [Image Generation](/tools/image-generation) — Konfiguration von Bildmodellen
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — Modell-Konfigurationsschlüssel
