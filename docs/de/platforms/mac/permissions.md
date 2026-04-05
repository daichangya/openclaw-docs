---
read_when:
    - Fehlende oder hängengebliebene macOS-Berechtigungsabfragen debuggen
    - Die macOS-App paketieren oder signieren
    - Bundle-IDs oder App-Installationspfade ändern
summary: Persistenz von macOS-Berechtigungen (TCC) und Signierungsanforderungen
title: macOS-Berechtigungen
x-i18n:
    generated_at: "2026-04-05T12:49:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# macOS-Berechtigungen (TCC)

macOS-Berechtigungen sind anfällig. TCC verknüpft eine Berechtigungsfreigabe mit der
Codesignatur, der Bundle-ID und dem Pfad der App auf dem Datenträger. Wenn sich einer dieser Werte ändert,
behandelt macOS die App als neu und kann Abfragen verwerfen oder ausblenden.

## Anforderungen für stabile Berechtigungen

- Gleicher Pfad: Führen Sie die App von einem festen Ort aus (für OpenClaw `dist/OpenClaw.app`).
- Gleiche Bundle-ID: Das Ändern der Bundle-ID erzeugt eine neue Berechtigungsidentität.
- Signierte App: Nicht signierte oder ad hoc signierte Builds behalten Berechtigungen nicht bei.
- Konsistente Signatur: Verwenden Sie ein echtes Apple Development- oder Developer ID-Zertifikat,
  damit die Signatur über mehrere Rebuilds hinweg stabil bleibt.

Ad hoc Signaturen erzeugen bei jedem Build eine neue Identität. macOS vergisst dann frühere
Freigaben, und Abfragen können vollständig verschwinden, bis die veralteten Einträge gelöscht werden.

## Checkliste zur Wiederherstellung, wenn Abfragen verschwinden

1. Beenden Sie die App.
2. Entfernen Sie den App-Eintrag in Systemeinstellungen -> Datenschutz & Sicherheit.
3. Starten Sie die App vom selben Pfad erneut und erteilen Sie die Berechtigungen erneut.
4. Wenn die Abfrage weiterhin nicht erscheint, setzen Sie die TCC-Einträge mit `tccutil` zurück und versuchen Sie es erneut.
5. Einige Berechtigungen erscheinen erst nach einem vollständigen Neustart von macOS erneut.

Beispiel-Resets (Bundle-ID bei Bedarf ersetzen):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Berechtigungen für Dateien und Ordner (Desktop/Dokumente/Downloads)

macOS kann auch den Zugriff auf Desktop, Dokumente und Downloads für Terminal-/Hintergrundprozesse einschränken. Wenn Dateilesevorgänge oder Verzeichnisauflistungen hängen bleiben, gewähren Sie Zugriff für denselben Prozesskontext, der Dateivorgänge ausführt (zum Beispiel Terminal/iTerm, eine per LaunchAgent gestartete App oder ein SSH-Prozess).

Problemumgehung: Verschieben Sie Dateien in den OpenClaw-Arbeitsbereich (`~/.openclaw/workspace`), wenn Sie ordnerspezifische Freigaben vermeiden möchten.

Wenn Sie Berechtigungen testen, signieren Sie immer mit einem echten Zertifikat. Ad hoc
Builds sind nur für schnelle lokale Ausführungen akzeptabel, bei denen Berechtigungen keine Rolle spielen.
