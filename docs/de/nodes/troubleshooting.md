---
read_when:
    - Der Node ist verbunden, aber die Tools für Kamera/Canvas/Bildschirm/Exec schlagen fehl
    - Sie benötigen das mentale Modell für Node-Kopplung versus Genehmigungen
summary: Fehlerbehebung bei Node-Kopplung, Anforderungen im Vordergrund, Berechtigungen und Tool-Fehlern
title: Fehlerbehebung bei Nodes
x-i18n:
    generated_at: "2026-04-24T06:46:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Verwenden Sie diese Seite, wenn ein Node im Status sichtbar ist, aber Node-Tools fehlschlagen.

## Befehlsleiter

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Führen Sie dann node-spezifische Prüfungen aus:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Gesunde Signale:

- Der Node ist verbunden und für die Rolle `node` gekoppelt.
- `nodes describe` enthält die Fähigkeit, die Sie aufrufen.
- Exec approvals zeigen den erwarteten Modus/die erwartete Allowlist.

## Anforderungen im Vordergrund

`canvas.*`, `camera.*` und `screen.*` funktionieren auf iOS-/Android-Nodes nur im Vordergrund.

Schnellprüfung und Behebung:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Wenn Sie `NODE_BACKGROUND_UNAVAILABLE` sehen, bringen Sie die Node-App in den Vordergrund und versuchen Sie es erneut.

## Berechtigungsmatrix

| Fähigkeit                    | iOS                                     | Android                                     | macOS-Node-App                 | Typischer Fehlercode           |
| ---------------------------- | --------------------------------------- | ------------------------------------------- | ------------------------------ | ------------------------------ |
| `camera.snap`, `camera.clip` | Kamera (+ Mikrofon für Clip-Audio)      | Kamera (+ Mikrofon für Clip-Audio)          | Kamera (+ Mikrofon für Clip-Audio) | `*_PERMISSION_REQUIRED`    |
| `screen.record`              | Bildschirmaufnahme (+ Mikrofon optional) | Screen-Capture-Prompt (+ Mikrofon optional) | Bildschirmaufnahme             | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Während Nutzung oder Immer (je nach Modus) | Vordergrund-/Hintergrund-Ortung je nach Modus | Standortberechtigung         | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/v (Node-Host-Pfad)                    | n/v (Node-Host-Pfad)                        | Exec approvals erforderlich    | `SYSTEM_RUN_DENIED`            |

## Kopplung versus Genehmigungen

Das sind unterschiedliche Schranken:

1. **Gerätekopplung**: Darf sich dieser Node mit dem Gateway verbinden?
2. **Gateway-Richtlinie für Node-Befehle**: Ist die RPC-Befehls-ID durch `gateway.nodes.allowCommands` / `denyCommands` und die Plattform-Standardwerte erlaubt?
3. **Exec approvals**: Darf dieser Node lokal einen bestimmten Shell-Befehl ausführen?

Schnellprüfungen:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Wenn die Kopplung fehlt, genehmigen Sie zuerst das Node-Gerät.
Wenn `nodes describe` einen Befehl nicht enthält, prüfen Sie die Gateway-Richtlinie für Node-Befehle und ob der Node diesen Befehl beim Verbinden tatsächlich deklariert hat.
Wenn die Kopplung in Ordnung ist, aber `system.run` fehlschlägt, korrigieren Sie Exec approvals/Allowlist auf diesem Node.

Die Node-Kopplung ist eine Identitäts-/Vertrauensschranke, keine Genehmigungsoberfläche pro Befehl. Für `system.run` befindet sich die nodebezogene Richtlinie in der Exec-Approvals-Datei dieses Nodes (`openclaw approvals get --node ...`), nicht im Kopplungseintrag des Gateway.

Für approvalgestützte Ausführungen mit `host=node` bindet das Gateway die Ausführung außerdem an den
vorbereiteten kanonischen `systemRunPlan`. Wenn ein späterer Aufrufer Befehl/cwd oder
Sitzungsmetadaten verändert, bevor der genehmigte Lauf weitergeleitet wird, weist das Gateway den
Lauf als Approval-Mismatch zurück, anstatt der bearbeiteten Payload zu vertrauen.

## Häufige Node-Fehlercodes

- `NODE_BACKGROUND_UNAVAILABLE` → App ist im Hintergrund; bringen Sie sie in den Vordergrund.
- `CAMERA_DISABLED` → Kamera-Umschalter in den Node-Einstellungen deaktiviert.
- `*_PERMISSION_REQUIRED` → Betriebssystemberechtigung fehlt/wurde verweigert.
- `LOCATION_DISABLED` → Standortmodus ist aus.
- `LOCATION_PERMISSION_REQUIRED` → angeforderter Standortmodus wurde nicht gewährt.
- `LOCATION_BACKGROUND_UNAVAILABLE` → App ist im Hintergrund, aber es liegt nur die Berechtigung „While Using“ vor.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Request benötigt eine explizite Genehmigung.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl wird durch den Allowlist-Modus blockiert.
  Auf Windows-Node-Hosts werden Shell-Wrapper-Formen wie `cmd.exe /c ...` im
  Allowlist-Modus als Allowlist-Miss behandelt, sofern sie nicht über den Ask-Flow genehmigt wurden.

## Schnelle Wiederherstellungsschleife

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Wenn Sie weiterhin blockiert sind:

- Genehmigen Sie die Gerätekopplung erneut.
- Öffnen Sie die Node-App erneut (Vordergrund).
- Erteilen Sie die OS-Berechtigungen erneut.
- Erstellen/passen Sie die Exec-Genehmigungsrichtlinie neu an.

Verwandt:

- [/nodes/index](/de/nodes/index)
- [/nodes/camera](/de/nodes/camera)
- [/nodes/location-command](/de/nodes/location-command)
- [/tools/exec-approvals](/de/tools/exec-approvals)
- [/gateway/pairing](/de/gateway/pairing)

## Verwandt

- [Nodes-Überblick](/de/nodes)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
