---
read_when:
    - Sie möchten QMD als Ihr Memory-Backend einrichten
    - Sie möchten erweiterte Memory-Funktionen wie Reranking oder zusätzliche indizierte Pfade
summary: Lokaler Such-Sidecar mit BM25, Vektoren, Reranking und Query-Expansion
title: QMD-Memory-Engine
x-i18n:
    generated_at: "2026-04-24T06:34:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d7af326291e194a04a17aa425901bf7e2517c23bae8282cd504802d24e9e522
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) ist ein lokaler Such-Sidecar, der
neben OpenClaw läuft. Er kombiniert BM25, Vektorsuche und Reranking in einer
einzigen Binärdatei und kann Inhalte jenseits Ihrer Workspace-Memory-Dateien indizieren.

## Was es gegenüber dem integrierten System hinzufügt

- **Reranking und Query-Expansion** für besseren Recall.
- **Zusätzliche Verzeichnisse indizieren** -- Projektdokumentation, Teamnotizen, alles auf der Festplatte.
- **Sitzungstranskripte indizieren** -- frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** -- läuft über Bun + node-llama-cpp, lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** -- wenn QMD nicht verfügbar ist, fällt OpenClaw nahtlos auf die integrierte Engine zurück.

## Erste Schritte

### Voraussetzungen

- QMD installieren: `npm install -g @tobilu/qmd` oder `bun install -g @tobilu/qmd`
- SQLite-Build, der Erweiterungen zulässt (`brew install sqlite` auf macOS).
- QMD muss sich im `PATH` des Gateway befinden.
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
`~/.openclaw/agents/<agentId>/qmd/` und verwaltet den Lebenszyklus des Sidecar
automatisch -- Collections, Updates und Embedding-Läufe werden für Sie gehandhabt.
Es bevorzugt aktuelle QMD-Collection- und MCP-Abfrageformen, fällt aber weiterhin auf
veraltete `--mask`-Collection-Flags und ältere MCP-Tool-Namen zurück, wenn nötig.
Die Abgleichslogik beim Start erstellt außerdem veraltete verwaltete Collections wieder anhand ihrer
kanonischen Muster neu, wenn noch eine ältere QMD-Collection mit demselben Namen vorhanden ist.

## Wie der Sidecar funktioniert

- OpenClaw erstellt Collections aus Ihren Workspace-Memory-Dateien und allen
  konfigurierten `memory.qmd.paths` und führt dann beim Start
  sowie periodisch (standardmäßig alle 5 Minuten) `qmd update` + `qmd embed` aus.
- Die Standard-Workspace-Collection verfolgt `MEMORY.md` sowie den Baum `memory/`.
  Kleingeschriebenes `memory.md` wird nicht als Root-Memory-Datei indiziert.
- Die Aktualisierung beim Start läuft im Hintergrund, damit der Chat-Start nicht blockiert wird.
- Suchen verwenden den konfigurierten `searchMode` (Standard: `search`; unterstützt auch
  `vsearch` und `query`). Wenn ein Modus fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn QMD vollständig fehlschlägt, fällt OpenClaw auf die integrierte SQLite-Engine zurück.

<Info>
Die erste Suche kann langsam sein -- QMD lädt GGUF-Modelle (~2 GB) für
Reranking und Query-Expansion beim ersten `qmd query`-Lauf automatisch herunter.
</Info>

## Modellüberschreibungen

QMD-Modell-Umgebungsvariablen werden unverändert aus dem Gateway-Prozess
durchgereicht, sodass Sie QMD global abstimmen können, ohne neue OpenClaw-Konfiguration hinzuzufügen:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Nach dem Ändern des Embedding-Modells führen Sie die Embeddings erneut aus, damit der Index zum
neuen Vektorraum passt.

## Zusätzliche Pfade indizieren

Richten Sie QMD auf zusätzliche Verzeichnisse, um sie durchsuchbar zu machen:

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
Suchergebnissen. `memory_get` versteht dieses Präfix und liest aus der richtigen
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

Transkripte werden als bereinigte User-/Assistant-Durchläufe in eine dedizierte QMD-Collection
unter `~/.openclaw/agents/<id>/qmd/sessions/` exportiert.

## Suchbereich

Standardmäßig werden QMD-Suchergebnisse in Direkt- und Kanalsitzungen
(aber nicht in Gruppen) angezeigt. Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

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

Wenn der Bereich eine Suche verweigert, protokolliert OpenClaw eine Warnung mit dem abgeleiteten Kanal und
Chat-Typ, damit leere Ergebnisse leichter zu debuggen sind.

## Quellenangaben

Wenn `memory.citations` auf `auto` oder `on` gesetzt ist, enthalten Such-Snippets eine
Fußzeile `Source: <path#line>`. Setzen Sie `memory.citations = "off"`, um die Fußzeile wegzulassen,
während der Pfad intern weiterhin an den Agenten übergeben wird.

## Wann Sie es verwenden sollten

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für höherwertige Ergebnisse.
- Durchsuchbare Projektdokumentation oder Notizen außerhalb des Workspace.
- Das Wiederfinden vergangener Sitzungsgespräche.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Setups funktioniert die [integrierte Engine](/de/concepts/memory-builtin) gut
ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass sich die Binärdatei im `PATH` des Gateway befindet. Wenn OpenClaw
als Dienst läuft, erstellen Sie einen Symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Erste Suche sehr langsam?** QMD lädt GGUF-Modelle bei der ersten Verwendung herunter. Wärmen Sie es vor
mit `qmd query "test"` unter Verwendung derselben XDG-Verzeichnisse, die OpenClaw verwendet.

**Suche läuft in ein Timeout?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standard: 4000 ms).
Setzen Sie es auf `120000` für langsamere Hardware.

**Leere Ergebnisse in Gruppenchats?** Prüfen Sie `memory.qmd.scope` -- standardmäßig
sind nur Direkt- und Kanalsitzungen erlaubt.

**Die Suche im Root-Memory wurde plötzlich zu breit?** Starten Sie das Gateway neu oder warten Sie auf den
nächsten Abgleich beim Start. OpenClaw erstellt veraltete verwaltete Collections wieder anhand der
kanonischen Muster `MEMORY.md` und `memory/`, wenn es einen Konflikt mit demselben Namen erkennt.

**Temporäre Repositories, die im Workspace sichtbar sind, verursachen `ENAMETOOLONG` oder fehlerhafte Indizierung?**
Die Traversierung von QMD folgt derzeit dem zugrunde liegenden Verhalten des QMD-Scanners statt
den integrierten Symlink-Regeln von OpenClaw. Halten Sie temporäre Monorepo-Checkouts unter
versteckten Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Roots, bis QMD eine
zyklussichere Traversierung oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Update-Intervalle,
Bereichsregeln und alle weiteren Einstellungen finden Sie in der
[Memory-Konfigurationsreferenz](/de/reference/memory-config).

## Verwandt

- [Memory-Übersicht](/de/concepts/memory)
- [Integrierte Memory-Engine](/de/concepts/memory-builtin)
- [Honcho Memory](/de/concepts/memory-honcho)
