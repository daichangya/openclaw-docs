---
read_when:
    - Sie möchten QMD als Ihr Memory-Backend einrichten
    - Sie möchten erweiterte Memory-Funktionen wie Reranking oder zusätzliche indizierte Pfade
summary: Local-first-Such-Sidecar mit BM25, Vektoren, Reranking und Abfrageerweiterung
title: QMD Memory Engine
x-i18n:
    generated_at: "2026-04-05T12:40:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa8a31ec1a6cc83b6ab413b7dbed6a88055629251664119bfd84308ed166c58e
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# QMD Memory Engine

[QMD](https://github.com/tobi/qmd) ist ein Local-first-Such-Sidecar, das
parallel zu OpenClaw läuft. Es kombiniert BM25, Vektorsuche und Reranking in
einer einzigen Binärdatei und kann Inhalte über Ihre Workspace-Memory-Dateien
hinaus indizieren.

## Was es zusätzlich zur integrierten Lösung bietet

- **Reranking und Abfrageerweiterung** für besseren Recall.
- **Zusätzliche Verzeichnisse indizieren** -- Projektdokumentation, Teamnotizen, alles auf der Festplatte.
- **Sitzungstranskripte indizieren** -- frühere Unterhaltungen wiederfinden.
- **Vollständig lokal** -- läuft über Bun + node-llama-cpp, lädt GGUF-Modelle automatisch herunter.
- **Automatischer Fallback** -- wenn QMD nicht verfügbar ist, fällt OpenClaw nahtlos auf
  die integrierte Engine zurück.

## Erste Schritte

### Voraussetzungen

- QMD installieren: `bun install -g @tobilu/qmd`
- SQLite-Build, der Erweiterungen erlaubt (`brew install sqlite` auf macOS).
- QMD muss im `PATH` des Gateway verfügbar sein.
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
automatisch -- Collections, Updates und Embedding-Läufe werden für Sie gehandhabt.

## So funktioniert das Sidecar

- OpenClaw erstellt Collections aus Ihren Workspace-Memory-Dateien und allen
  konfigurierten `memory.qmd.paths` und führt dann beim Start sowie periodisch
  (standardmäßig alle 5 Minuten) `qmd update` + `qmd embed` aus.
- Die Aktualisierung beim Start läuft im Hintergrund, damit der Chat-Start nicht blockiert wird.
- Suchvorgänge verwenden den konfigurierten `searchMode` (Standard: `search`; unterstützt auch
  `vsearch` und `query`). Wenn ein Modus fehlschlägt, versucht OpenClaw es erneut mit `qmd query`.
- Wenn QMD vollständig fehlschlägt, fällt OpenClaw auf die integrierte SQLite-Engine zurück.

<Info>
Die erste Suche kann langsam sein -- QMD lädt beim ersten `qmd query`-Lauf
automatisch GGUF-Modelle (~2 GB) für Reranking und Abfrageerweiterung herunter.
</Info>

## Zusätzliche Pfade indizieren

Zeigen Sie QMD auf zusätzliche Verzeichnisse, um sie durchsuchbar zu machen:

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

Snippets aus zusätzlichen Pfaden erscheinen in Suchergebnissen als `qmd/<collection>/<relative-path>`.
`memory_get` versteht dieses Präfix und liest aus dem korrekten Collection-Root.

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

Transkripte werden als bereinigte User-/Assistant-Turns in eine dedizierte QMD-Collection unter
`~/.openclaw/agents/<id>/qmd/sessions/` exportiert.

## Suchbereich

Standardmäßig werden QMD-Suchergebnisse nur in DM-Sitzungen angezeigt (nicht in Gruppen oder
Kanälen). Konfigurieren Sie `memory.qmd.scope`, um dies zu ändern:

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

Wenn `memory.citations` auf `auto` oder `on` steht, enthalten Such-Snippets eine
Fußzeile `Source: <path#line>`. Setzen Sie `memory.citations = "off"`, um die Fußzeile wegzulassen,
während der Pfad intern weiterhin an den Agenten übergeben wird.

## Wann Sie es verwenden sollten

Wählen Sie QMD, wenn Sie Folgendes benötigen:

- Reranking für qualitativ hochwertigere Ergebnisse.
- Suche in Projektdokumentation oder Notizen außerhalb des Workspace.
- Abruf früherer Sitzungsunterhaltungen.
- Vollständig lokale Suche ohne API-Schlüssel.

Für einfachere Setups funktioniert die [integrierte Engine](/concepts/memory-builtin)
gut ohne zusätzliche Abhängigkeiten.

## Fehlerbehebung

**QMD nicht gefunden?** Stellen Sie sicher, dass sich die Binärdatei im `PATH` des Gateway befindet. Wenn OpenClaw
als Dienst läuft, erstellen Sie einen Symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Erste Suche sehr langsam?** QMD lädt GGUF-Modelle bei der ersten Verwendung herunter. Wärmen Sie es vor
mit `qmd query "test"` unter Verwendung derselben XDG-Verzeichnisse, die OpenClaw verwendet.

**Suche überschreitet das Timeout?** Erhöhen Sie `memory.qmd.limits.timeoutMs` (Standard: 4000ms).
Setzen Sie es für langsamere Hardware auf `120000`.

**Leere Ergebnisse in Gruppenchats?** Prüfen Sie `memory.qmd.scope` -- standardmäßig sind nur
DM-Sitzungen erlaubt.

**Temporäre Repositories, die im Workspace sichtbar sind, verursachen `ENAMETOOLONG` oder fehlerhafte Indizierung?**
Die Traversierung von QMD folgt derzeit dem zugrunde liegenden Verhalten des QMD-Scanners statt
den integrierten Symlink-Regeln von OpenClaw. Bewahren Sie temporäre Monorepo-Checkouts unter
versteckten Verzeichnissen wie `.tmp/` oder außerhalb indizierter QMD-Roots auf, bis QMD
Traversal ohne Zyklen oder explizite Ausschlusssteuerungen bereitstellt.

## Konfiguration

Für die vollständige Konfigurationsoberfläche (`memory.qmd.*`), Suchmodi, Aktualisierungsintervalle,
Bereichsregeln und alle anderen Regler siehe die
[Memory-Konfigurationsreferenz](/reference/memory-config).
