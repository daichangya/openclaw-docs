---
read_when:
    - Hinzufügen einer neuen Core-Fähigkeit und Plugin-Registrierungsoberfläche
    - Entscheiden, ob Code in den Core, ein Vendor-Plugin oder ein Feature-Plugin gehört
    - Verdrahten einer neuen Laufzeithilfe für Channels oder Tools
sidebarTitle: Adding Capabilities
summary: Leitfaden für Mitwirkende zum Hinzufügen einer neuen gemeinsam genutzten Fähigkeit zum OpenClaw-Plugin-System
title: Fähigkeiten hinzufügen (Leitfaden für Mitwirkende)
x-i18n:
    generated_at: "2026-04-05T12:56:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# Fähigkeiten hinzufügen

<Info>
  Dies ist ein **Leitfaden für Mitwirkende** für OpenClaw-Core-Entwickler. Wenn du
  ein externes Plugin erstellst, siehe stattdessen [Building Plugins](/plugins/building-plugins).
</Info>

Verwende dies, wenn OpenClaw einen neuen Bereich braucht, zum Beispiel Bildgenerierung, Video-
Generierung oder einen künftigen, von einem Vendor unterstützten Funktionsbereich.

Die Regel:

- plugin = Ownership-Grenze
- capability = gemeinsamer Core-Vertrag

Das bedeutet, dass du nicht damit beginnen solltest, einen Vendor direkt in einen Channel oder ein
Tool zu verdrahten. Beginne damit, die Fähigkeit zu definieren.

## Wann eine Fähigkeit erstellt werden sollte

Erstelle eine neue Fähigkeit, wenn all dies zutrifft:

1. mehr als ein Vendor könnte sie plausibel implementieren
2. Channels, Tools oder Feature-Plugins sollten sie nutzen können, ohne sich um
   den Vendor zu kümmern
3. der Core muss Fallback-, Richtlinien-, Konfigurations- oder Zustellverhalten besitzen

Wenn die Arbeit nur für einen Vendor gedacht ist und noch kein gemeinsamer Vertrag existiert, stoppe
und definiere zuerst den Vertrag.

## Die Standardabfolge

1. Definiere den typisierten Core-Vertrag.
2. Füge Plugin-Registrierung für diesen Vertrag hinzu.
3. Füge eine gemeinsame Laufzeithilfe hinzu.
4. Verdrahte ein echtes Vendor-Plugin als Nachweis.
5. Stelle Feature-/Channel-Konsumenten auf die Laufzeithilfe um.
6. Füge Vertragstests hinzu.
7. Dokumentiere die operator-seitige Konfiguration und das Ownership-Modell.

## Was wohin gehört

Core:

- Request-/Response-Typen
- Provider-Registry + Auflösung
- Fallback-Verhalten
- Konfigurationsschema plus weitergegebene `title`- / `description`-Docs-Metadaten auf verschachtelten Objekt-, Wildcard-, Array-Item- und Kompositionsknoten
- Oberfläche der Laufzeithilfe

Vendor-Plugin:

- Vendor-API-Aufrufe
- Vendor-Authentifizierungshandhabung
- Vendor-spezifische Request-Normalisierung
- Registrierung der Fähigkeitsimplementierung

Feature-/Channel-Plugin:

- ruft `api.runtime.*` oder die passende Hilfe `plugin-sdk/*-runtime` auf
- ruft niemals direkt eine Vendor-Implementierung auf

## Dateicheckliste

Für eine neue Fähigkeit wirst du voraussichtlich diese Bereiche anfassen:

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
- Konfiguration/Docs/Tests

## Beispiel: Bildgenerierung

Die Bildgenerierung folgt der Standardform:

1. der Core definiert `ImageGenerationProvider`
2. der Core stellt `registerImageGenerationProvider(...)` bereit
3. der Core stellt `runtime.imageGeneration.generate(...)` bereit
4. die Plugins `openai`, `google`, `fal` und `minimax` registrieren Vendor-gestützte Implementierungen
5. künftige Vendoren können denselben Vertrag registrieren, ohne Channels/Tools zu ändern

Der Konfigurationsschlüssel ist getrennt vom Routing der Vision-Analyse:

- `agents.defaults.imageModel` = Bilder analysieren
- `agents.defaults.imageGenerationModel` = Bilder generieren

Halte diese getrennt, damit Fallback und Richtlinien explizit bleiben.

## Prüfcheckliste

Bevor du eine neue Fähigkeit auslieferst, verifiziere:

- kein Channel/Tool importiert Vendor-Code direkt
- die Laufzeithilfe ist der gemeinsame Pfad
- mindestens ein Vertragstest bestätigt gebündeltes Ownership
- Konfigurations-Docs nennen den neuen Modell-/Konfigurationsschlüssel
- Plugin-Docs erklären die Ownership-Grenze

Wenn ein PR die Fähigkeitsebene überspringt und Vendor-Verhalten fest in einen
Channel/ein Tool codiert, schicke ihn zurück und definiere zuerst den Vertrag.
