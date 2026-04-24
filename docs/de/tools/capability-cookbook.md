---
read_when:
    - Eine neue Core-Capability und Oberfläche zur Plugin-Registrierung hinzufügen
    - Entscheiden, ob Code in den Core, ein Vendor-Plugin oder ein Feature-Plugin gehört
    - Einen neuen Runtime-Helper für Kanäle oder Tools verdrahten
sidebarTitle: Adding Capabilities
summary: Leitfaden für Mitwirkende zum Hinzufügen einer neuen gemeinsamen Capability zum OpenClaw-Plugin-System
title: Capabilities hinzufügen (Leitfaden für Mitwirkende)
x-i18n:
    generated_at: "2026-04-24T07:02:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1e3251b9150c9744d967e91f531dfce01435b13aea3a17088ccd54f2145d14f
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Dies ist ein **Leitfaden für Mitwirkende** für OpenClaw-Core-Entwickler. Wenn Sie
  ein externes Plugin erstellen, siehe stattdessen [Plugins erstellen](/de/plugins/building-plugins).
</Info>

Verwenden Sie dies, wenn OpenClaw einen neuen Bereich benötigt, etwa Bildgenerierung, Video-
generierung oder einen zukünftigen, von Vendoren gestützten Funktionsbereich.

Die Regel:

- Plugin = Eigentumsgrenze
- Capability = gemeinsamer Core-Vertrag

Das bedeutet, Sie sollten nicht damit beginnen, einen Vendor direkt in einen Kanal oder ein
Tool zu verdrahten. Beginnen Sie damit, die Capability zu definieren.

## Wann eine Capability erstellt werden sollte

Erstellen Sie eine neue Capability, wenn all dies zutrifft:

1. mehr als ein Vendor könnte sie plausibel implementieren
2. Kanäle, Tools oder Feature-Plugins sollten sie konsumieren, ohne sich für
   den Vendor zu interessieren
3. der Core muss Fallback, Richtlinie, Konfiguration oder Zustellungsverhalten besitzen

Wenn die Arbeit nur vendorspezifisch ist und noch kein gemeinsamer Vertrag existiert, stoppen Sie und definieren Sie zuerst den Vertrag.

## Die Standardsequenz

1. Den typisierten Core-Vertrag definieren.
2. Plugin-Registrierung für diesen Vertrag hinzufügen.
3. Einen gemeinsamen Runtime-Helper hinzufügen.
4. Ein echtes Vendor-Plugin als Beweis verdrahten.
5. Feature-/Kanal-Consumer auf den Runtime-Helper umstellen.
6. Vertragstests hinzufügen.
7. Die operatorseitige Konfiguration und das Eigentumsmodell dokumentieren.

## Was wohin gehört

Core:

- Request-/Response-Typen
- Provider-Registry + Auflösung
- Fallback-Verhalten
- Konfigurationsschema plus weitergereichte Dokumentationsmetadaten `title` / `description` auf verschachtelten Objekt-, Wildcard-, Array-Element- und Kompositionsknoten
- Runtime-Helper-Oberfläche

Vendor-Plugin:

- Vendor-API-Aufrufe
- Vendor-spezifische Authentifizierungsbehandlung
- Vendor-spezifische Request-Normalisierung
- Registrierung der Capability-Implementierung

Feature-/Kanal-Plugin:

- ruft `api.runtime.*` oder den passenden Helper `plugin-sdk/*-runtime` auf
- ruft niemals direkt eine Vendor-Implementierung auf

## Dateicheckliste

Für eine neue Capability werden Sie voraussichtlich diese Bereiche anfassen:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- ein oder mehrere gebündelte Plugin-Pakete
- Konfiguration/Dokumentation/Tests

## Beispiel: Bildgenerierung

Bildgenerierung folgt der Standardform:

1. Der Core definiert `ImageGenerationProvider`
2. Der Core stellt `registerImageGenerationProvider(...)` bereit
3. Der Core stellt `runtime.imageGeneration.generate(...)` bereit
4. Die Plugins `openai`, `google`, `fal` und `minimax` registrieren von Vendoren gestützte Implementierungen
5. Zukünftige Vendoren können denselben Vertrag registrieren, ohne Kanäle/Tools zu ändern

Der Konfigurationsschlüssel ist von der Routing-Logik für Bildanalyse getrennt:

- `agents.defaults.imageModel` = Bilder analysieren
- `agents.defaults.imageGenerationModel` = Bilder generieren

Halten Sie diese getrennt, damit Fallback und Richtlinie explizit bleiben.

## Checkliste für Reviews

Bevor Sie eine neue Capability ausliefern, prüfen Sie:

- Kein Kanal/Tool importiert Vendor-Code direkt
- Der Runtime-Helper ist der gemeinsame Pfad
- Mindestens ein Vertragstest bestätigt gebündeltes Eigentum
- Die Konfigurationsdokumentation benennt den neuen Modell-/Konfigurationsschlüssel
- Die Plugin-Dokumentation erklärt die Eigentumsgrenze

Wenn ein PR die Capability-Schicht überspringt und Vendor-Verhalten fest in einen
Kanal/ein Tool codiert, schicken Sie ihn zurück und definieren Sie zuerst den Vertrag.

## Verwandt

- [Plugin](/de/tools/plugin)
- [Skills erstellen](/de/tools/creating-skills)
- [Tools und Plugins](/de/tools)
