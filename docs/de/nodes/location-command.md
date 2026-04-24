---
read_when:
    - Standort-Unterstützung für Nodes oder UI für Berechtigungen hinzufügen
    - Android-Standortberechtigungen oder Vordergrundverhalten entwerfen
summary: Standortbefehl für Nodes (`location.get`), Berechtigungsmodi und Android-Vordergrundverhalten
title: Standortbefehl
x-i18n:
    generated_at: "2026-04-24T06:46:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## Kurzfassung

- `location.get` ist ein Node-Befehl (über `node.invoke`).
- Standardmäßig deaktiviert.
- Die Android-App-Einstellungen verwenden einen Auswahlmodus: Aus / Während der Nutzung.
- Separater Schalter: Präziser Standort.

## Warum ein Auswahlmodus (nicht nur ein Schalter)

OS-Berechtigungen haben mehrere Stufen. Wir können in der App einen Auswahlmodus anbieten, aber das OS entscheidet weiterhin über die tatsächlich gewährte Berechtigung.

- iOS/macOS kann in System-Prompts/Einstellungen **Während der Nutzung** oder **Immer** anbieten.
- Die Android-App unterstützt derzeit nur Standort im Vordergrund.
- Präziser Standort ist eine separate Berechtigung (iOS 14+ „Präzise“, Android „fine“ vs. „coarse“).

Der Auswahlmodus in der UI steuert den von uns angeforderten Modus; die tatsächlich gewährte Berechtigung lebt in den OS-Einstellungen.

## Einstellungsmodell

Pro Node-Gerät:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Verhalten der UI:

- Die Auswahl von `whileUsing` fordert eine Vordergrund-Berechtigung an.
- Wenn das OS die angeforderte Stufe verweigert, auf die höchste gewährte Stufe zurücksetzen und den Status anzeigen.

## Berechtigungszuordnung (`node.permissions`)

Optional. Die macOS-Node meldet `location` über die Berechtigungszuordnung; iOS/Android kann dies weglassen.

## Befehl: `location.get`

Wird über `node.invoke` aufgerufen.

Parameter (vorgeschlagen):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Response-Payload:

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

- `LOCATION_DISABLED`: Auswahlmodus ist aus.
- `LOCATION_PERMISSION_REQUIRED`: Berechtigung für den angeforderten Modus fehlt.
- `LOCATION_BACKGROUND_UNAVAILABLE`: App ist im Hintergrund, aber nur „Während der Nutzung“ ist erlaubt.
- `LOCATION_TIMEOUT`: Kein Fix rechtzeitig.
- `LOCATION_UNAVAILABLE`: Systemfehler / keine Provider.

## Hintergrundverhalten

- Die Android-App verweigert `location.get`, wenn sie im Hintergrund ist.
- Lassen Sie OpenClaw auf Android geöffnet, wenn Sie den Standort anfordern.
- Andere Node-Plattformen können sich anders verhalten.

## Integration von Modell/Tools

- Tool-Oberfläche: Das Tool `nodes` fügt die Aktion `location_get` hinzu (Node erforderlich).
- CLI: `openclaw nodes location get --node <id>`.
- Richtlinien für Agenten: nur aufrufen, wenn der Benutzer den Standort aktiviert hat und den Umfang versteht.

## UX-Text (vorgeschlagen)

- Aus: „Standortfreigabe ist deaktiviert.“
- Während der Nutzung: „Nur wenn OpenClaw geöffnet ist.“
- Präzise: „Präzisen GPS-Standort verwenden. Zum Teilen eines ungefähren Standorts deaktivieren.“

## Verwandt

- [Channel location parsing](/de/channels/location)
- [Camera capture](/de/nodes/camera)
- [Talk mode](/de/nodes/talk)
