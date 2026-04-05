---
read_when:
    - Sie möchten das standardmäßige Memory-Backend verstehen
    - Sie möchten Embedding-Provider oder Hybridsuche konfigurieren
summary: Die standardmäßige SQLite-basierte Memory-Engine mit Keyword-, Vektor- und Hybridsuche
title: Integrierte Memory-Engine
x-i18n:
    generated_at: "2026-04-05T12:39:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 181c40a43332315bf915ff6f395d9d5fd766c889e1a8d1aa525f9ba0198d3367
    source_path: concepts/memory-builtin.md
    workflow: 15
---

# Integrierte Memory-Engine

Die integrierte Engine ist das standardmäßige Memory-Backend. Sie speichert Ihren Memory-Index in
einer SQLite-Datenbank pro Agent und benötigt keine zusätzlichen Abhängigkeiten für den Einstieg.

## Was sie bietet

- **Keyword-Suche** über FTS5-Volltextindizierung (BM25-Bewertung).
- **Vektorsuche** über Embeddings von jedem unterstützten Provider.
- **Hybridsuche**, die beides für die besten Ergebnisse kombiniert.
- **CJK-Unterstützung** über Trigramm-Tokenisierung für Chinesisch, Japanisch und Koreanisch.
- **sqlite-vec-Beschleunigung** für datenbankinterne Vektorabfragen (optional).

## Erste Schritte

Wenn Sie einen API-Schlüssel für OpenAI, Gemini, Voyage oder Mistral haben, erkennt die integrierte
Engine ihn automatisch und aktiviert die Vektorsuche. Keine Konfiguration erforderlich.

So legen Sie einen Provider explizit fest:

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

Ohne einen Embedding-Provider ist nur die Keyword-Suche verfügbar.

## Unterstützte Embedding-Provider

| Provider | ID        | Automatisch erkannt | Hinweise                            |
| -------- | --------- | ------------------- | ----------------------------------- |
| OpenAI   | `openai`  | Ja                  | Standard: `text-embedding-3-small`  |
| Gemini   | `gemini`  | Ja                  | Unterstützt multimodal (Bild + Audio) |
| Voyage   | `voyage`  | Ja                  |                                     |
| Mistral  | `mistral` | Ja                  |                                     |
| Ollama   | `ollama`  | Nein                | Lokal, explizit festlegen           |
| Local    | `local`   | Ja (zuerst)         | GGUF-Modell, Download ca. 0,6 GB    |

Die automatische Erkennung wählt den ersten Provider, dessen API-Schlüssel aufgelöst werden kann, in der
angegebenen Reihenfolge. Setzen Sie `memorySearch.provider`, um dies zu überschreiben.

## So funktioniert die Indizierung

OpenClaw indiziert `MEMORY.md` und `memory/*.md` in Chunks (~400 Tokens mit
80-Token-Überlappung) und speichert sie in einer SQLite-Datenbank pro Agent.

- **Index-Speicherort:** `~/.openclaw/memory/<agentId>.sqlite`
- **Dateiüberwachung:** Änderungen an Memory-Dateien lösen eine entprellte Neuindizierung aus (1,5 s).
- **Automatische Neuindizierung:** Wenn sich Embedding-Provider, Modell oder Chunking-Konfiguration
  ändern, wird der gesamte Index automatisch neu erstellt.
- **Neuindizierung bei Bedarf:** `openclaw memory index --force`

<Info>
Sie können auch Markdown-Dateien außerhalb des Workspace mit
`memorySearch.extraPaths` indizieren. Siehe die
[Konfigurationsreferenz](/reference/memory-config#additional-memory-paths).
</Info>

## Wann verwenden

Die integrierte Engine ist für die meisten Benutzer die richtige Wahl:

- Funktioniert sofort ohne zusätzliche Abhängigkeiten.
- Beherrscht Keyword- und Vektorsuche gut.
- Unterstützt alle Embedding-Provider.
- Die Hybridsuche kombiniert die Stärken beider Retrieval-Ansätze.

Erwägen Sie den Wechsel zu [QMD](/concepts/memory-qmd), wenn Sie Reranking, Query
Expansion benötigen oder Verzeichnisse außerhalb des Workspace indizieren möchten.

Erwägen Sie [Honcho](/concepts/memory-honcho), wenn Sie sitzungsübergreifenden Memory mit
automatischer Benutzermodellierung möchten.

## Fehlerbehebung

**Memory-Suche deaktiviert?** Prüfen Sie `openclaw memory status`. Wenn kein Provider
erkannt wird, legen Sie einen explizit fest oder fügen Sie einen API-Schlüssel hinzu.

**Veraltete Ergebnisse?** Führen Sie `openclaw memory index --force` aus, um neu zu erstellen. Die Überwachung
kann Änderungen in seltenen Grenzfällen verpassen.

**sqlite-vec wird nicht geladen?** OpenClaw fällt automatisch auf prozessinterne Kosinusähnlichkeit
zurück. Prüfen Sie die Logs auf den konkreten Ladefehler.

## Konfiguration

Für die Einrichtung von Embedding-Providern, Tuning der Hybridsuche (Gewichte, MMR, temporaler
Abfall), Batch-Indizierung, multimodalen Memory, sqlite-vec, zusätzliche Pfade und alle
anderen Konfigurationsoptionen siehe die
[Konfigurationsreferenz für Memory](/reference/memory-config).
