---
read_when:
    - mac-Menü-UI oder Statuslogik anpassen
summary: Logik der Menüleisten-Statusanzeige und was den Benutzern angezeigt wird
title: Menüleiste
x-i18n:
    generated_at: "2026-04-24T06:48:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logik der Menüleisten-Statusanzeige

## Was angezeigt wird

- Wir zeigen den aktuellen Arbeitsstatus des Agenten im Symbol der Menüleiste und in der ersten Statuszeile des Menüs an.
- Der Health-Status wird ausgeblendet, solange Arbeit aktiv ist; er kehrt zurück, wenn alle Sitzungen inaktiv sind.
- Der Block „Nodes“ im Menü listet nur **Geräte** auf (gekoppelte Nodes über `node.list`), nicht Client-/Presence-Einträge.
- Ein Abschnitt „Usage“ erscheint unter Context, wenn Snapshots zur Providernutzung verfügbar sind.

## Statusmodell

- Sitzungen: Events treffen mit `runId` (pro Lauf) sowie `sessionKey` in der Nutzlast ein. Die „main“-Sitzung ist der Schlüssel `main`; wenn sie fehlt, greifen wir auf die zuletzt aktualisierte Sitzung zurück.
- Priorität: main gewinnt immer. Wenn main aktiv ist, wird ihr Status sofort angezeigt. Wenn main inaktiv ist, wird die zuletzt aktive Nicht-Main-Sitzung angezeigt. Wir wechseln nicht mitten in einer Aktivität hin und her; wir schalten nur um, wenn die aktuelle Sitzung inaktiv wird oder main aktiv wird.
- Aktivitätsarten:
  - `job`: Ausführung von Befehlen auf hoher Ebene (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` mit `toolName` und `meta/args`.

## Enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (Debug-Override)

### `ActivityKind` → Glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- Standard → 🛠️

### Visuelle Zuordnung

- `idle`: normales Critter.
- `workingMain`: Badge mit Glyph, volle Tönung, Bein-Animation „working“.
- `workingOther`: Badge mit Glyph, gedämpfte Tönung, kein Herumhuschen.
- `overridden`: verwendet unabhängig von der Aktivität das gewählte Glyph/die gewählte Tönung.

## Text der Statuszeile (Menü)

- Solange Arbeit aktiv ist: `<Session role> · <activity label>`
  - Beispiele: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Wenn inaktiv: fällt auf die Health-Zusammenfassung zurück.

## Event-Ingestion

- Quelle: `agent`-Events des Control-Channels (`ControlChannel.handleAgentEvent`).
- Geparste Felder:
  - `stream: "job"` mit `data.state` für Start/Stopp.
  - `stream: "tool"` mit `data.phase`, `name`, optional `meta`/`args`.
- Labels:
  - `exec`: erste Zeile von `args.command`.
  - `read`/`write`: gekürzter Pfad.
  - `edit`: Pfad plus abgeleitete Änderungsart aus `meta`/Diff-Anzahlen.
  - Fallback: Tool-Name.

## Debug-Override

- Einstellungen ▸ Debug ▸ Auswahl „Icon override“:
  - `System (auto)` (Standard)
  - `Working: main` (pro Tool-Art)
  - `Working: other` (pro Tool-Art)
  - `Idle`
- Gespeichert über `@AppStorage("iconOverride")`; abgebildet auf `IconState.overridden`.

## Checkliste für Tests

- Job in der Main-Sitzung auslösen: prüfen, dass das Symbol sofort umschaltet und die Statuszeile das Main-Label anzeigt.
- Job in einer Nicht-Main-Sitzung auslösen, während main inaktiv ist: Symbol/Status zeigen Nicht-Main an; bleibt stabil, bis der Job fertig ist.
- Main starten, während eine andere Sitzung aktiv ist: Symbol springt sofort auf main um.
- Schnelle Tool-Bursts: sicherstellen, dass das Badge nicht flackert (TTL-Übergangszeit bei Tool-Ergebnissen).
- Health-Zeile erscheint wieder, sobald alle Sitzungen inaktiv sind.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Menüleistensymbol](/de/platforms/mac/icon)
