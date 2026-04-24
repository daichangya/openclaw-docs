---
read_when:
    - Sie möchten das standardmäßige Memory-Backend verstehen
    - Sie möchten Embedding-Provider oder Hybridsuche konfigurieren
summary: Das standardmäßige SQLite-basierte Memory-Backend mit Schlüsselwort-, Vektor- und Hybridsuche
title: Integrierte Memory-Engine
x-i18n:
    generated_at: "2026-04-24T06:34:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82c1f4dc37b4fc6c075a7fcd2ec78bfcbfbebbcba7e48d366a1da3afcaff508
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Die integrierte Engine ist das standardmäßige Memory-Backend. Sie speichert Ihren Memory-Index in
einer SQLite-Datenbank pro Agent und benötigt keine zusätzlichen Abhängigkeiten für den Einstieg.

## Was sie bereitstellt

- **Schlüsselwortsuche** über FTS5-Volltextindexierung (BM25-Bewertung).
- **Vektorsuche** über Embeddings von jedem unterstützten Provider.
- **Hybridsuche**, die beides für bessere Ergebnisse kombiniert.
- **CJK-Unterstützung** über Trigramm-Tokenisierung für Chinesisch, Japanisch und Koreanisch.
- **sqlite-vec-Beschleunigung** für In-Datenbank-Vektorabfragen (optional).

## Erste Schritte

Wenn Sie einen API-Schlüssel für OpenAI, Gemini, Voyage oder Mistral haben, erkennt die integrierte
Engine ihn automatisch und aktiviert die Vektorsuche. Keine Konfiguration erforderlich.

Um einen Provider explizit festzulegen:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Ohne einen Embedding-Provider ist nur die Schlüsselwortsuche verfügbar.

Um den integrierten lokalen Embedding-Provider zu erzwingen, setzen Sie `local.modelPath` auf eine
GGUF-Datei:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Unterstützte Embedding-Provider

| Provider | ID        | Automatisch erkannt | Hinweise                             |
| -------- | --------- | ------------------- | ------------------------------------ |
| OpenAI   | `openai`  | Ja                  | Standard: `text-embedding-3-small`   |
| Gemini   | `gemini`  | Ja                  | Unterstützt multimodal (Bild + Audio) |
| Voyage   | `voyage`  | Ja                  |                                      |
| Mistral  | `mistral` | Ja                  |                                      |
| Ollama   | `ollama`  | Nein                | Lokal, explizit setzen               |
| Local    | `local`   | Ja (zuerst)         | GGUF-Modell, ~0,6 GB Download        |

Die automatische Erkennung wählt den ersten Provider, dessen API-Schlüssel aufgelöst werden kann, in der
gezeigten Reihenfolge. Setzen Sie `memorySearch.provider`, um dies zu überschreiben.

## Wie die Indexierung funktioniert

OpenClaw indexiert `MEMORY.md` und `memory/*.md` in Blöcke (~400 Token mit
80-Token-Überlappung) und speichert sie in einer SQLite-Datenbank pro Agent.

- **Index-Speicherort:** `~/.openclaw/memory/<agentId>.sqlite`
- **Dateiüberwachung:** Änderungen an Memory-Dateien lösen eine entprellte Neuindexierung aus (1,5 s).
- **Automatische Neuindexierung:** Wenn sich Embedding-Provider, Modell oder Chunking-Konfiguration
  ändern, wird der gesamte Index automatisch neu aufgebaut.
- **Neuindexierung bei Bedarf:** `openclaw memory index --force`

<Info>
Sie können auch Markdown-Dateien außerhalb des Workspace mit
`memorySearch.extraPaths` indexieren. Siehe die
[Konfigurationsreferenz](/de/reference/memory-config#additional-memory-paths).
</Info>

## Wann sie verwendet werden sollte

Die integrierte Engine ist für die meisten Benutzer die richtige Wahl:

- Funktioniert sofort ohne zusätzliche Abhängigkeiten.
- Bewältigt Schlüsselwort- und Vektorsuche gut.
- Unterstützt alle Embedding-Provider.
- Die Hybridsuche kombiniert das Beste aus beiden Retrieval-Ansätzen.

Erwägen Sie einen Wechsel zu [QMD](/de/concepts/memory-qmd), wenn Sie Reranking, Query-
Expansion benötigen oder Verzeichnisse außerhalb des Workspace indexieren möchten.

Erwägen Sie [Honcho](/de/concepts/memory-honcho), wenn Sie sitzungsübergreifendes Memory mit
automatischer Benutzermodellierung möchten.

## Fehlerbehebung

**Memory-Suche deaktiviert?** Prüfen Sie `openclaw memory status`. Wenn kein Provider
erkannt wird, setzen Sie einen explizit oder fügen Sie einen API-Schlüssel hinzu.

**Lokaler Provider nicht erkannt?** Bestätigen Sie, dass der lokale Pfad existiert, und führen Sie aus:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sowohl eigenständige CLI-Befehle als auch das Gateway verwenden dieselbe `local`-Provider-ID.
Wenn der Provider auf `auto` gesetzt ist, werden lokale Embeddings nur dann zuerst berücksichtigt,
wenn `memorySearch.local.modelPath` auf eine vorhandene lokale Datei zeigt.

**Veraltete Ergebnisse?** Führen Sie `openclaw memory index --force` aus, um neu aufzubauen. Der Watcher
kann Änderungen in seltenen Grenzfällen verpassen.

**sqlite-vec wird nicht geladen?** OpenClaw greift automatisch auf Cosinus-Ähnlichkeit im Prozess zurück. Prüfen Sie die Logs auf den spezifischen Ladefehler.

## Konfiguration

Für die Einrichtung von Embedding-Providern, das Tuning der Hybridsuche (Gewichtungen, MMR, zeitlicher
Abfall), Batch-Indexierung, multimodales Memory, sqlite-vec, zusätzliche Pfade und alle
anderen Konfigurationsoptionen siehe die
[Memory-Konfigurationsreferenz](/de/reference/memory-config).

## Verwandt

- [Memory-Überblick](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Active Memory](/de/concepts/active-memory)
