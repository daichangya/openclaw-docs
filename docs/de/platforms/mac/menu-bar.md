---
read_when:
    - UI oder Statuslogik der Mac-Menüleiste anpassen
summary: Logik der Menüleisten-Statusanzeige und was Benutzern angezeigt wird
title: Menüleiste
x-i18n:
    generated_at: "2026-04-05T12:49:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logik der Menüleisten-Statusanzeige

## Was angezeigt wird

- Wir zeigen den aktuellen Arbeitsstatus des Agenten im Symbol der Menüleiste und in der ersten Statuszeile des Menüs an.
- Der Gesundheitsstatus wird ausgeblendet, während Arbeit aktiv ist; er kehrt zurück, sobald alle Sitzungen untätig sind.
- Der Block „Nodes“ im Menü listet nur **Geräte** auf (gepairte Nodes über `node.list`), nicht Client-/Presence-Einträge.
- Ein Abschnitt „Usage“ erscheint unter Context, wenn Nutzungs-Snapshots des Providers verfügbar sind.

## Zustandsmodell

- Sitzungen: Ereignisse kommen mit `runId` (pro Lauf) plus `sessionKey` in der Payload. Die Sitzung „main“ hat den Schlüssel `main`; wenn sie fehlt, greifen wir auf die zuletzt aktualisierte Sitzung zurück.
- Priorität: main gewinnt immer. Wenn main aktiv ist, wird ihr Zustand sofort angezeigt. Wenn main untätig ist, wird die zuletzt aktive Nicht-Main-Sitzung angezeigt. Wir wechseln nicht mitten in aktiver Arbeit hin und her; wir wechseln nur, wenn die aktuelle Sitzung untätig wird oder main aktiv wird.
- Aktivitätsarten:
  - `job`: Ausführung von Befehlen auf hoher Ebene (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` mit `toolName` und `meta/args`.

## `IconState`-Enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (Debug-Überschreibung)

### `ActivityKind` → Glyphe

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- Standard → 🛠️

### Visuelles Mapping

- `idle`: normales Critter.
- `workingMain`: Badge mit Glyphe, volle Tönung, Beinanimation „working“.
- `workingOther`: Badge mit Glyphe, gedämpfte Tönung, kein Huschen.
- `overridden`: verwendet die ausgewählte Glyphe/Tönung unabhängig von der Aktivität.

## Text der Statuszeile (Menü)

- Während Arbeit aktiv ist: `<Session role> · <activity label>`
  - Beispiele: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Wenn untätig: fällt auf die Gesundheitszusammenfassung zurück.

## Ereignisaufnahme

- Quelle: `agent`-Ereignisse des Control Channel (`ControlChannel.handleAgentEvent`).
- Geparste Felder:
  - `stream: "job"` mit `data.state` für Start/Stopp.
  - `stream: "tool"` mit `data.phase`, `name`, optional `meta`/`args`.
- Labels:
  - `exec`: erste Zeile von `args.command`.
  - `read`/`write`: gekürzter Pfad.
  - `edit`: Pfad plus abgeleitete Änderungsart aus `meta`/Diff-Anzahlen.
  - Fallback: Toolname.

## Debug-Überschreibung

- Settings ▸ Debug ▸ Picker „Icon override“:
  - `System (auto)` (Standard)
  - `Working: main` (pro Tool-Art)
  - `Working: other` (pro Tool-Art)
  - `Idle`
- Gespeichert über `@AppStorage("iconOverride")`; abgebildet auf `IconState.overridden`.

## Test-Checkliste

- Hauptsitzungs-Job auslösen: prüfen, dass das Symbol sofort wechselt und die Statuszeile die Main-Beschriftung zeigt.
- Nicht-Main-Sitzungs-Job auslösen, während main untätig ist: Symbol/Status zeigt Nicht-Main; bleibt stabil, bis der Job endet.
- Main starten, während other aktiv ist: Symbol wechselt sofort zu main.
- Schnelle Tool-Bursts: sicherstellen, dass das Badge nicht flackert (TTL-Kulanz bei Tool-Ergebnissen).
- Die Gesundheitszeile erscheint erneut, sobald alle Sitzungen untätig sind.
