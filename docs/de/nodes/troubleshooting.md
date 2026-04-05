---
read_when:
    - Node ist verbunden, aber Kamera-/Canvas-/Screen-/Exec-Tools schlagen fehl
    - Sie brauchen das mentale Modell für Node-Pairing versus Approvals
summary: Fehlerbehebung bei Node-Pairing, Vordergrundanforderungen, Berechtigungen und Tool-Fehlern
title: Node-Fehlerbehebung
x-i18n:
    generated_at: "2026-04-05T12:48:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# Node-Fehlerbehebung

Verwenden Sie diese Seite, wenn eine Node im Status sichtbar ist, Node-Tools aber fehlschlagen.

## Befehlsabfolge

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Führen Sie dann Node-spezifische Prüfungen aus:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Gesunde Signale:

- Node ist verbunden und für die Rolle `node` gepairt.
- `nodes describe` enthält die Fähigkeit, die Sie aufrufen.
- Exec-Approvals zeigen den erwarteten Modus/die erwartete Allowlist.

## Vordergrundanforderungen

`canvas.*`, `camera.*` und `screen.*` funktionieren auf iOS-/Android-Nodes nur im Vordergrund.

Schnell prüfen und beheben:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Wenn Sie `NODE_BACKGROUND_UNAVAILABLE` sehen, holen Sie die Node-App in den Vordergrund und versuchen Sie es erneut.

## Berechtigungsmatrix

| Fähigkeit                    | iOS                                     | Android                                      | macOS-Node-App                | Typischer Fehlercode           |
| --------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Kamera (+ Mikrofon für Clip-Audio)     | Kamera (+ Mikrofon für Clip-Audio)           | Kamera (+ Mikrofon für Clip-Audio) | `*_PERMISSION_REQUIRED`   |
| `screen.record`              | Bildschirmaufnahme (+ Mikro optional)  | Prompt für Bildschirmaufnahme (+ Mikro optional) | Bildschirmaufnahme         | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Beim Verwenden oder Immer (abhängig vom Modus) | Vordergrund-/Hintergrundstandort abhängig vom Modus | Standortberechtigung | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (Node-Host-Pfad)                   | n/a (Node-Host-Pfad)                         | Exec-Approvals erforderlich   | `SYSTEM_RUN_DENIED`            |

## Pairing versus Approvals

Dies sind unterschiedliche Schranken:

1. **Device Pairing**: Darf diese Node mit dem Gateway verbinden?
2. **Gateway-Node-Befehlsrichtlinie**: Ist die RPC-Befehls-ID durch `gateway.nodes.allowCommands` / `denyCommands` und Plattform-Standards erlaubt?
3. **Exec-Approvals**: Darf diese Node lokal einen bestimmten Shell-Befehl ausführen?

Schnelle Prüfungen:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Wenn Pairing fehlt, genehmigen Sie zuerst das Node-Gerät.
Wenn `nodes describe` einen Befehl nicht enthält, prüfen Sie die Gateway-Node-Befehlsrichtlinie und ob die Node diesen Befehl beim Verbinden tatsächlich deklariert hat.
Wenn Pairing in Ordnung ist, `system.run` aber fehlschlägt, korrigieren Sie Exec-Approvals/Allowlist auf dieser Node.

Node-Pairing ist eine Identitäts-/Vertrauensschranke, keine Genehmigungsoberfläche pro Befehl. Für `system.run` liegt die Richtlinie pro Node in der Exec-Approvals-Datei dieser Node (`openclaw approvals get --node ...`), nicht im Pairing-Datensatz des Gateways.

Für Approval-gestützte Läufe mit `host=node` bindet das Gateway die Ausführung außerdem an den
vorbereiteten kanonischen `systemRunPlan`. Wenn ein späterer Aufrufer Befehl/cwd oder
Sitzungsmetadaten verändert, bevor der genehmigte Lauf weitergeleitet wird, lehnt das Gateway den
Lauf als Approval-Mismatch ab, statt der bearbeiteten Nutzlast zu vertrauen.

## Häufige Node-Fehlercodes

- `NODE_BACKGROUND_UNAVAILABLE` → App ist im Hintergrund; in den Vordergrund holen.
- `CAMERA_DISABLED` → Kamera-Schalter in den Node-Einstellungen deaktiviert.
- `*_PERMISSION_REQUIRED` → Betriebssystemberechtigung fehlt/wurde verweigert.
- `LOCATION_DISABLED` → Standortmodus ist aus.
- `LOCATION_PERMISSION_REQUIRED` → Angeforderter Standortmodus wurde nicht gewährt.
- `LOCATION_BACKGROUND_UNAVAILABLE` → App ist im Hintergrund, aber es besteht nur die Berechtigung „While Using“.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Anfrage benötigt explizite Genehmigung.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl wird durch den Allowlist-Modus blockiert.
  Auf Windows-Node-Hosts werden Shell-Wrapper-Formen wie `cmd.exe /c ...` im
  Allowlist-Modus als Allowlist-Miss behandelt, sofern sie nicht über den Ask-Flow genehmigt wurden.

## Schneller Wiederherstellungszyklus

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Wenn Sie weiterhin nicht weiterkommen:

- Device Pairing erneut genehmigen.
- Node-App erneut öffnen (Vordergrund).
- Betriebssystemberechtigungen erneut gewähren.
- Exec-Approval-Richtlinie neu erstellen/anpassen.

Verwandt:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
