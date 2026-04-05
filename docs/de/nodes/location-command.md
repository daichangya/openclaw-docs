---
read_when:
    - Beim Hinzufügen von Standortunterstützung für Nodes oder einer Berechtigungs-UI
    - Beim Entwerfen von Android-Standortberechtigungen oder Vordergrundverhalten
summary: Standortbefehl für Nodes (location.get), Berechtigungsmodi und Android-Vordergrundverhalten
title: Standortbefehl
x-i18n:
    generated_at: "2026-04-05T12:48:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# Standortbefehl (Nodes)

## TL;DR

- `location.get` ist ein Node-Befehl (über `node.invoke`).
- Standardmäßig deaktiviert.
- Android-App-Einstellungen verwenden einen Selektor: Aus / Während der Nutzung.
- Separater Schalter: Präziser Standort.

## Warum ein Selektor (nicht nur ein Schalter)

OS-Berechtigungen sind mehrstufig. Wir können in der App einen Selektor bereitstellen, aber das OS entscheidet weiterhin über die tatsächlich erteilte Berechtigung.

- iOS/macOS kann in System-Prompts/Einstellungen **Während der Nutzung** oder **Immer** anbieten.
- Die Android-App unterstützt derzeit nur Standort im Vordergrund.
- Präziser Standort ist eine separate Berechtigung (iOS 14+ „Präzise“, Android „fine“ vs. „coarse“).

Der Selektor in der UI steuert den von uns angeforderten Modus; die tatsächlich erteilte Berechtigung lebt in den OS-Einstellungen.

## Einstellungsmodell

Pro Node-Gerät:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI-Verhalten:

- Die Auswahl von `whileUsing` fordert die Berechtigung für den Vordergrund an.
- Wenn das OS die angeforderte Stufe verweigert, auf die höchste erteilte Stufe zurücksetzen und den Status anzeigen.

## Berechtigungszuordnung (`node.permissions`)

Optional. Der macOS-Node meldet `location` über die Berechtigungszuordnung; iOS/Android können dies weglassen.

## Befehl: `location.get`

Aufgerufen über `node.invoke`.

Parameter (vorgeschlagen):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Antwort-Payload:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Fehler (stabile Codes):

- `LOCATION_DISABLED`: Selektor ist aus.
- `LOCATION_PERMISSION_REQUIRED`: Berechtigung für den angeforderten Modus fehlt.
- `LOCATION_BACKGROUND_UNAVAILABLE`: App ist im Hintergrund, aber nur „Während der Nutzung“ ist erlaubt.
- `LOCATION_TIMEOUT`: keine Positionsbestimmung rechtzeitig.
- `LOCATION_UNAVAILABLE`: Systemfehler / keine Provider.

## Hintergrundverhalten

- Die Android-App verweigert `location.get`, während sie im Hintergrund ist.
- Halten Sie OpenClaw geöffnet, wenn Sie auf Android den Standort anfordern.
- Andere Node-Plattformen können sich anders verhalten.

## Integration in Modell/Tooling

- Tool-Oberfläche: Das Tool `nodes` fügt die Aktion `location_get` hinzu (Node erforderlich).
- CLI: `openclaw nodes location get --node <id>`.
- Agent-Richtlinien: Nur aufrufen, wenn der Benutzer Standort aktiviert hat und den Umfang versteht.

## UX-Text (vorgeschlagen)

- Aus: „Standortfreigabe ist deaktiviert.“
- Während der Nutzung: „Nur wenn OpenClaw geöffnet ist.“
- Präzise: „Präzisen GPS-Standort verwenden. Zum Teilen eines ungefähren Standorts ausschalten.“
