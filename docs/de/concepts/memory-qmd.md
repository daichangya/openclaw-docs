---
read_when:
    - Sie möchten QMD als Ihr Memory-Backend einrichten
    - Sie möchten erweiterte Memory-Funktionen wie Reranking oder zusätzliche indizierte Pfade nutzen
summary: Lokaler Search-Sidecar mit BM25, Vektoren, Reranking und Query-Erweiterung
title: QMD Memory Engine
x-i18n:
    generated_at: "2026-04-12T23:28:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27afc996b959d71caed964a3cae437e0e29721728b30ebe7f014db124c88da04
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# QMD Memory Engine

[QMD](https://github.com/tobi/qmd) ist ein lokaler Search-Sidecar, der
neben OpenClaw ausgeführt wird. Er kombiniert BM25, Vektorsuche und Reranking in einer einzigen
Binärdatei und kann Inhalte über Ihre Workspace-Memory-Dateien hinaus indizieren.

## Was es gegenüber der integrierten Lösung ergänzt

- **Reranking und Query-Erweiterung** für besseren Recall.
- **Zusätzliche Verzeichnisse indizieren** -- Projektdokumentation, Teamnotizen, alles auf der Festplatte.
- **Sitzungstranskripte indizieren** -- frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** -- läuft über Bun + node-llama-cpp, lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** -- wenn QMD nicht verfügbar ist, wechselt OpenClaw nahtlos auf die
  integrierte Engine zurück.

## Erste Schritte

### Voraussetzungen

- QMD installieren: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- SQLite-Build, das Erweiterungen erlaubt (`brew install sqlite` auf macOS).
- QMD muss im `PATH` des Gateway vorhanden sein.
- macOS und Linux funktionieren sofort. Windows wird am besten über WSL2 unterstützt.

### Aktivieren

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw erstellt ein eigenständiges QMD-Home unter
`~/.openclaw/agents/<agentId>/qmd/` und verwaltet den Lebenszyklus des Sidecars
automatisch -- Collections, Updates und Embedding-Läufe werden für Sie übernommen.
Es bevorzugt die aktuellen QMD-Collection- und MCP-Abfrageformen, greift aber weiterhin auf
Legacy-Collection-Flags mit `--mask` und ältere MCP-Tool-Namen zurück, wenn nötig.

## So funktioniert der Sidecar

- OpenClaw erstellt Collections aus Ihren Workspace-Memory-Dateien und allen
  konfigurierten `memory.qmd.paths`, führt dann `qmd update` + `qmd embed` beim Start
  und regelmäßig aus (standardmäßig alle 5 Minuten).
- Die standardmäßige Workspace-Collection verfolgt `MEMORY.md` sowie den `memory/`-
  Baum. Kleingeschriebenes `memory.md` bleibt ein Bootstrap-Fallback, keine separate QMD-
  Collection.
- Die Aktualisierung beim Start läuft im Hintergrund, damit der Chat-Start nicht blockiert wird.
- Suchvorgänge verwenden den konfigurierten `searchMode` (Standard: `search`; unterstützt auch
  `vsearch` und `query`). Wenn ein Modus fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn QMD vollständig fehlschlägt, greift OpenClaw auf die integrierte SQLite-Engine zurück.

<Info>
Die erste Suche kann langsam sein -- QMD lädt GGUF-Modelle (~2 GB) für
Reranking und Query-Erweiterung beim ersten `qmd query`-Lauf automatisch herunter.
</Info>

## Modell-Overrides

QMD-Modell-Umgebungsvariablen werden unverändert aus dem Gateway-
Prozess durchgereicht, sodass Sie QMD global abstimmen können, ohne neue OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Nachdem Sie das Embedding-Modell geändert haben, führen Sie die Embeddings erneut aus, damit der Index zum
neuen Vektorraum passt.

## Zusätzliche Pfade indizieren

Richten Sie QMD auf zusätzliche Verzeichnisse aus, damit diese durchsuchbar werden:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Snippets aus zusätzlichen Pfaden erscheinen als `qmd/<collection>/<relative-path>` in
Suchergebnissen. `memory_get` versteht dieses Präfix und liest aus dem korrekten
Collection-Root.

## Sitzungstranskripte indizieren

Aktivieren Sie die Sitzungsindizierung, um frühere Unterhaltungen wiederzufinden:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkripte werden als bereinigte User-/Assistant-Turns in eine dedizierte QMD-
Collection unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert.

## Suchbereich

Standardmäßig werden QMD-Suchergebnisse in direkten Sitzungen und Channel-Sitzungen
angezeigt (nicht in Gruppen). Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Wenn der Bereich eine Suche ablehnt, protokolliert OpenClaw eine Warnung mit dem abgeleiteten Channel und
Chat-Typ, damit leere Ergebnisse leichter zu debuggen sind.

## Zitate

Wenn `memory.citations` auf `auto` oder `on` gesetzt ist, enthalten Such-Snippets eine
`Source: <path#line>`-Fußzeile. Setzen Sie `memory.citations = "off"`, um die Fußzeile wegzulassen,
während der Pfad intern weiterhin an den Agent übergeben wird.

## Wann verwenden

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für höherwertige Ergebnisse.
- Suche in Projektdokumentation oder Notizen außerhalb des Workspace.
- Wiederfinden vergangener Sitzungsunterhaltungen.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Setups funktioniert die [integrierte Engine](/de/concepts/memory-builtin) gut
ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass sich die Binärdatei im `PATH` des Gateway befindet. Wenn OpenClaw
als Dienst läuft, erstellen Sie einen Symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Erste Suche sehr langsam?** QMD lädt GGUF-Modelle bei der ersten Verwendung herunter. Wärmen Sie sie vor
mit `qmd query "test"` unter Verwendung derselben XDG-Verzeichnisse, die OpenClaw verwendet.

**Suche läuft in ein Timeout?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standard: 4000ms).
Setzen Sie den Wert auf `120000` für langsamere Hardware.

**Leere Ergebnisse in Gruppenchats?** Prüfen Sie `memory.qmd.scope` -- standardmäßig sind nur
direkte Sitzungen und Channel-Sitzungen erlaubt.

**Workspace-sichtbare temporäre Repositories verursachen `ENAMETOOLONG` oder fehlerhafte Indizierung?**
Die QMD-Durchquerung folgt derzeit dem zugrunde liegenden Verhalten des QMD-Scanners statt
den integrierten Symlink-Regeln von OpenClaw. Bewahren Sie temporäre Monorepo-Checkouts unter
versteckten Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Roots auf, bis QMD
zyklussichere Traversierung oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Für die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Aktualisierungsintervalle,
Bereichsregeln und alle weiteren Optionen siehe die
[Referenz zur Memory-Konfiguration](/de/reference/memory-config).
