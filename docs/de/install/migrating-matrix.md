---
read_when:
    - Eine bestehende Matrix-Installation aktualisieren
    - Verschlüsselten Matrix-Verlauf und Gerätezustand migrieren
summary: Wie OpenClaw das vorherige Matrix-Plugin direkt aktualisiert, einschließlich Grenzen bei der Wiederherstellung verschlüsselter Zustände und manueller Wiederherstellungsschritte.
title: Matrix-Migration
x-i18n:
    generated_at: "2026-04-24T06:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

Diese Seite behandelt Upgrades vom vorherigen öffentlichen Plugin `matrix` auf die aktuelle Implementierung.

Für die meisten Benutzer erfolgt das Upgrade direkt vor Ort:

- das Plugin bleibt `@openclaw/matrix`
- der Kanal bleibt `matrix`
- Ihre Konfiguration bleibt unter `channels.matrix`
- zwischengespeicherte Anmeldedaten bleiben unter `~/.openclaw/credentials/matrix/`
- der Laufzeitstatus bleibt unter `~/.openclaw/matrix/`

Sie müssen keine Konfigurationsschlüssel umbenennen oder das Plugin unter einem neuen Namen neu installieren.

## Was die Migration automatisch macht

Wenn das Gateway startet und wenn Sie [`openclaw doctor --fix`](/de/gateway/doctor) ausführen, versucht OpenClaw, alten Matrix-Status automatisch zu reparieren.
Bevor ein umsetzbarer Matrix-Migrationsschritt den Status auf dem Datenträger verändert, erstellt oder verwendet OpenClaw einen gezielten Recovery-Snapshot wieder.

Wenn Sie `openclaw update` verwenden, hängt der genaue Auslöser davon ab, wie OpenClaw installiert ist:

- Quellinstallationen führen während des Update-Ablaufs `openclaw doctor --fix` aus und starten dann standardmäßig das Gateway neu
- Paketmanager-Installationen aktualisieren das Paket, führen einen nicht interaktiven Doctor-Durchlauf aus und verlassen sich dann auf den standardmäßigen Gateway-Neustart, damit der Start die Matrix-Migration abschließen kann
- wenn Sie `openclaw update --no-restart` verwenden, wird die startgestützte Matrix-Migration aufgeschoben, bis Sie später `openclaw doctor --fix` ausführen und das Gateway neu starten

Die automatische Migration umfasst:

- Erstellen oder Wiederverwenden eines Snapshots vor der Migration unter `~/Backups/openclaw-migrations/`
- Wiederverwenden Ihrer zwischengespeicherten Matrix-Anmeldedaten
- Beibehalten derselben Account-Auswahl und `channels.matrix`-Konfiguration
- Verschieben des ältesten flachen Matrix-Sync-Stores an den aktuellen kontobezogenen Speicherort
- Verschieben des ältesten flachen Matrix-Krypto-Stores an den aktuellen kontobezogenen Speicherort, wenn der Ziel-Account sicher aufgelöst werden kann
- Extrahieren eines zuvor gespeicherten Entschlüsselungsschlüssels für Matrix-Raumschlüssel-Backups aus dem alten Rust-Krypto-Store, wenn dieser Schlüssel lokal vorhanden ist
- Wiederverwenden der vollständigsten vorhandenen Token-Hash-Speicherwurzel für denselben Matrix-Account, Homeserver und Benutzer, wenn sich das Access-Token später ändert
- Durchsuchen benachbarter Token-Hash-Speicherwurzeln nach ausstehenden Metadaten zur Wiederherstellung verschlüsselter Zustände, wenn sich das Matrix-Access-Token geändert hat, Account-/Geräteidentität aber gleich geblieben sind
- Wiederherstellen gesicherter Raumschlüssel in den neuen Krypto-Store beim nächsten Matrix-Start

Details zum Snapshot:

- OpenClaw schreibt nach einem erfolgreichen Snapshot eine Marker-Datei nach `~/.openclaw/matrix/migration-snapshot.json`, damit spätere Start- und Reparaturdurchläufe dasselbe Archiv wiederverwenden können.
- Diese automatischen Matrix-Migrations-Snapshots sichern nur Konfiguration + Status (`includeWorkspace: false`).
- Wenn Matrix nur warnungsbezogenen Migrationsstatus hat, zum Beispiel weil `userId` oder `accessToken` noch fehlen, erstellt OpenClaw den Snapshot noch nicht, weil keine Matrix-Mutation umsetzbar ist.
- Wenn der Snapshot-Schritt fehlschlägt, überspringt OpenClaw die Matrix-Migration für diesen Lauf, statt den Status ohne Wiederherstellungspunkt zu verändern.

Zu Multi-Account-Upgrades:

- der älteste flache Matrix-Store (`~/.openclaw/matrix/bot-storage.json` und `~/.openclaw/matrix/crypto/`) stammt aus einem Single-Store-Layout, daher kann OpenClaw ihn nur in ein aufgelöstes Matrix-Account-Ziel migrieren
- bereits kontobezogene ältere Matrix-Stores werden pro konfiguriertem Matrix-Account erkannt und vorbereitet

## Was die Migration nicht automatisch machen kann

Das vorherige öffentliche Matrix-Plugin hat **nicht** automatisch Matrix-Raumschlüssel-Backups erstellt. Es hat lokalen Krypto-Status gespeichert und Geräteverifikation angefordert, aber es hat nicht garantiert, dass Ihre Raumschlüssel auf dem Homeserver gesichert wurden.

Das bedeutet, dass manche verschlüsselten Installationen nur teilweise migriert werden können.

OpenClaw kann Folgendes nicht automatisch wiederherstellen:

- nur lokal vorhandene Raumschlüssel, die nie gesichert wurden
- verschlüsselten Status, wenn der Ziel-Matrix-Account noch nicht aufgelöst werden kann, weil `homeserver`, `userId` oder `accessToken` noch nicht verfügbar sind
- automatische Migration eines gemeinsam genutzten flachen Matrix-Stores, wenn mehrere Matrix-Accounts konfiguriert sind, aber `channels.matrix.defaultAccount` nicht gesetzt ist
- Installationen mit benutzerdefiniertem Plugin-Pfad, die auf einen Repository-Pfad statt auf das Standard-Matrix-Paket gepinnt sind
- einen fehlenden Recovery-Schlüssel, wenn der alte Store gesicherte Schlüssel hatte, den Entschlüsselungsschlüssel aber nicht lokal gespeichert hat

Aktueller Warnungsumfang:

- Installationen mit benutzerdefiniertem Matrix-Plugin-Pfad werden sowohl beim Gateway-Start als auch von `openclaw doctor` gemeldet

Wenn Ihre alte Installation lokal vorhandenen verschlüsselten Verlauf hatte, der nie gesichert wurde, können einige ältere verschlüsselte Nachrichten nach dem Upgrade weiter unlesbar bleiben.

## Empfohlener Upgrade-Ablauf

1. Aktualisieren Sie OpenClaw und das Matrix-Plugin wie gewohnt.
   Bevorzugen Sie einfaches `openclaw update` ohne `--no-restart`, damit der Start die Matrix-Migration sofort abschließen kann.
2. Führen Sie aus:

   ```bash
   openclaw doctor --fix
   ```

   Wenn Matrix umsetzbare Migrationsarbeit hat, erstellt oder verwendet Doctor zuerst den Snapshot vor der Migration wieder und gibt den Archivpfad aus.

3. Starten oder starten Sie das Gateway neu.
4. Prüfen Sie den aktuellen Verifikations- und Backup-Status:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Wenn OpenClaw Ihnen mitteilt, dass ein Recovery-Schlüssel benötigt wird, führen Sie aus:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Wenn dieses Gerät noch nicht verifiziert ist, führen Sie aus:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Wenn Sie absichtlich nicht wiederherstellbaren alten Verlauf aufgeben und eine frische Backup-Basis für zukünftige Nachrichten möchten, führen Sie aus:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Wenn noch kein serverseitiges Schlüssel-Backup existiert, erstellen Sie eines für zukünftige Wiederherstellungen:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Wie die verschlüsselte Migration funktioniert

Die verschlüsselte Migration ist ein zweistufiger Prozess:

1. Der Start oder `openclaw doctor --fix` erstellt oder verwendet den Snapshot vor der Migration wieder, wenn eine verschlüsselte Migration umsetzbar ist.
2. Der Start oder `openclaw doctor --fix` untersucht den alten Matrix-Krypto-Store über die aktive Matrix-Plugin-Installation.
3. Wenn ein Backup-Entschlüsselungsschlüssel gefunden wird, schreibt OpenClaw ihn in den neuen Recovery-Key-Ablauf und markiert die Wiederherstellung von Raumschlüsseln als ausstehend.
4. Beim nächsten Matrix-Start stellt OpenClaw gesicherte Raumschlüssel automatisch in den neuen Krypto-Store wieder her.

Wenn der alte Store Raumschlüssel meldet, die nie gesichert wurden, warnt OpenClaw, statt so zu tun, als sei die Wiederherstellung erfolgreich gewesen.

## Häufige Meldungen und ihre Bedeutung

### Upgrade- und Erkennungsmeldungen

`Matrix plugin upgraded in place.`

- Bedeutung: Der alte Matrix-Status auf dem Datenträger wurde erkannt und in das aktuelle Layout migriert.
- Was zu tun ist: nichts, es sei denn, dieselbe Ausgabe enthält auch Warnungen.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat ein Wiederherstellungsarchiv erstellt, bevor der Matrix-Status verändert wurde.
- Was zu tun ist: Behalten Sie den ausgegebenen Archivpfad, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat einen vorhandenen Marker für einen Matrix-Migrations-Snapshot gefunden und dieses Archiv wiederverwendet, statt ein doppeltes Backup zu erstellen.
- Was zu tun ist: Behalten Sie den ausgegebenen Archivpfad, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: Alter Matrix-Status existiert, aber OpenClaw kann ihn keinem aktuellen Matrix-Account zuordnen, weil Matrix nicht konfiguriert ist.
- Was zu tun ist: Konfigurieren Sie `channels.matrix`, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: OpenClaw hat alten Status gefunden, kann aber die genaue aktuelle Account-/Gerätewurzel noch nicht bestimmen.
- Was zu tun ist: Starten Sie das Gateway einmal mit funktionierendem Matrix-Login, oder führen Sie `openclaw doctor --fix` erneut aus, nachdem zwischengespeicherte Anmeldedaten vorhanden sind.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen Matrix-Store gefunden, weigert sich aber zu raten, welcher benannte Matrix-Account ihn erhalten soll.
- Was zu tun ist: Setzen Sie `channels.matrix.defaultAccount` auf den vorgesehenen Account und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Bedeutung: Der neue kontobezogene Speicherort enthält bereits einen Sync- oder Krypto-Store, daher hat OpenClaw ihn nicht automatisch überschrieben.
- Was zu tun ist: Prüfen Sie, dass der aktuelle Account der richtige ist, bevor Sie das konfliktbehaftete Ziel manuell entfernen oder verschieben.

`Failed migrating Matrix legacy sync store (...)` oder `Failed migrating Matrix legacy crypto store (...)`

- Bedeutung: OpenClaw hat versucht, alten Matrix-Status zu verschieben, aber der Dateisystemvorgang ist fehlgeschlagen.
- Was zu tun ist: Prüfen Sie Dateisystemberechtigungen und Datenträgerstatus und führen Sie dann `openclaw doctor --fix` erneut aus.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: OpenClaw hat einen alten verschlüsselten Matrix-Store gefunden, aber es gibt keine aktuelle Matrix-Konfiguration, an die er angehängt werden kann.
- Was zu tun ist: Konfigurieren Sie `channels.matrix`, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: Der verschlüsselte Store existiert, aber OpenClaw kann nicht sicher bestimmen, zu welchem aktuellen Account/Gerät er gehört.
- Was zu tun ist: Starten Sie das Gateway einmal mit funktionierendem Matrix-Login, oder führen Sie `openclaw doctor --fix` erneut aus, nachdem zwischengespeicherte Anmeldedaten verfügbar sind.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen Legacy-Krypto-Store gefunden, weigert sich aber zu raten, welcher benannte Matrix-Account ihn erhalten soll.
- Was zu tun ist: Setzen Sie `channels.matrix.defaultAccount` auf den vorgesehenen Account und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Bedeutung: OpenClaw hat alten Matrix-Status erkannt, aber die Migration ist noch durch fehlende Identitäts- oder Anmeldedaten blockiert.
- Was zu tun ist: Schließen Sie Matrix-Login oder Konfiguration ab und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Bedeutung: OpenClaw hat alten verschlüsselten Matrix-Status gefunden, konnte aber den Hilfs-Einstiegspunkt aus dem Matrix-Plugin nicht laden, der diesen Store normalerweise untersucht.
- Was zu tun ist: Installieren Sie das Matrix-Plugin erneut oder reparieren Sie es (`openclaw plugins install @openclaw/matrix` oder `openclaw plugins install ./path/to/local/matrix-plugin` für einen Repository-Checkout) und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Bedeutung: OpenClaw hat einen Pfad zu einer Hilfsdatei gefunden, der die Plugin-Wurzel verlässt oder Plugin-Grenzprüfungen nicht besteht, und hat den Import daher verweigert.
- Was zu tun ist: Installieren Sie das Matrix-Plugin aus einem vertrauenswürdigen Pfad erneut und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Bedeutung: OpenClaw hat sich geweigert, Matrix-Status zu verändern, weil zuvor kein Recovery-Snapshot erstellt werden konnte.
- Was zu tun ist: Beheben Sie den Backup-Fehler und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Failed migrating legacy Matrix client storage: ...`

- Bedeutung: Der clientseitige Matrix-Fallback hat alten flachen Speicher gefunden, aber das Verschieben ist fehlgeschlagen. OpenClaw bricht diesen Fallback jetzt ab, statt still mit einem frischen Store zu starten.
- Was zu tun ist: Prüfen Sie Dateisystemberechtigungen oder Konflikte, lassen Sie den alten Status intakt und versuchen Sie es erneut, nachdem Sie den Fehler behoben haben.

`Matrix is installed from a custom path: ...`

- Bedeutung: Matrix ist an eine Pfad-Installation gepinnt, daher ersetzen Mainline-Updates es nicht automatisch durch das Standard-Matrix-Paket des Repositorys.
- Was zu tun ist: Installieren Sie es mit `openclaw plugins install @openclaw/matrix` neu, wenn Sie zum Standard-Matrix-Plugin zurückkehren möchten.

### Meldungen zur Wiederherstellung verschlüsselter Zustände

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Bedeutung: gesicherte Raumschlüssel wurden erfolgreich in den neuen Krypto-Store wiederhergestellt.
- Was zu tun ist: normalerweise nichts.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Bedeutung: einige alte Raumschlüssel existierten nur im alten lokalen Store und wurden nie in das Matrix-Backup hochgeladen.
- Was zu tun ist: Rechnen Sie damit, dass ein Teil des alten verschlüsselten Verlaufs nicht verfügbar bleibt, sofern Sie diese Schlüssel nicht manuell aus einem anderen verifizierten Client wiederherstellen können.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Bedeutung: Ein Backup existiert, aber OpenClaw konnte den Recovery-Schlüssel nicht automatisch wiederherstellen.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` aus.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Bedeutung: OpenClaw hat den alten verschlüsselten Store gefunden, konnte ihn aber nicht sicher genug untersuchen, um die Wiederherstellung vorzubereiten.
- Was zu tun ist: Führen Sie `openclaw doctor --fix` erneut aus. Wenn dies erneut auftritt, lassen Sie das alte Statusverzeichnis intakt und stellen Sie den Zustand mit einem anderen verifizierten Matrix-Client plus `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` wieder her.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Bedeutung: OpenClaw hat einen Konflikt bei den Backup-Schlüsseln erkannt und sich geweigert, die aktuelle Datei mit dem Recovery-Schlüssel automatisch zu überschreiben.
- Was zu tun ist: Prüfen Sie, welcher Recovery-Schlüssel korrekt ist, bevor Sie erneut einen Wiederherstellungsbefehl ausführen.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Bedeutung: Dies ist die harte Grenze des alten Speicherformats.
- Was zu tun ist: Gesicherte Schlüssel können weiterhin wiederhergestellt werden, aber lokal vorhandener verschlüsselter Verlauf kann nicht verfügbar bleiben.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Bedeutung: Das neue Plugin hat die Wiederherstellung versucht, aber Matrix hat einen Fehler zurückgegeben.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup status` aus und versuchen Sie es dann bei Bedarf erneut mit `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Meldungen zur manuellen Wiederherstellung

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Bedeutung: OpenClaw weiß, dass Sie einen Backup-Schlüssel haben sollten, aber er ist auf diesem Gerät nicht aktiv.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup restore` aus oder übergeben Sie bei Bedarf `--recovery-key`.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Bedeutung: Auf diesem Gerät ist der Recovery-Schlüssel derzeit nicht gespeichert.
- Was zu tun ist: Verifizieren Sie zuerst das Gerät mit Ihrem Recovery-Schlüssel und stellen Sie dann das Backup wieder her.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Bedeutung: Der gespeicherte Schlüssel stimmt nicht mit dem aktiven Matrix-Backup überein.
- Was zu tun ist: Führen Sie `openclaw matrix verify device "<your-recovery-key>"` mit dem richtigen Schlüssel erneut aus.

Wenn Sie den Verlust nicht wiederherstellbaren alten verschlüsselten Verlaufs akzeptieren, können Sie stattdessen
die aktuelle Backup-Basis mit `openclaw matrix verify backup reset --yes` zurücksetzen. Wenn das
gespeicherte Backup-Secret defekt ist, kann dieses Zurücksetzen auch den Secret-Speicher neu erstellen, damit der
neue Backup-Schlüssel nach dem Neustart korrekt geladen werden kann.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Bedeutung: Das Backup existiert, aber dieses Gerät vertraut der Cross-Signing-Kette noch nicht stark genug.
- Was zu tun ist: Führen Sie `openclaw matrix verify device "<your-recovery-key>"` erneut aus.

`Matrix recovery key is required`

- Bedeutung: Sie haben einen Wiederherstellungsschritt versucht, ohne einen Recovery-Schlüssel anzugeben, obwohl einer erforderlich war.
- Was zu tun ist: Führen Sie den Befehl erneut mit Ihrem Recovery-Schlüssel aus.

`Invalid Matrix recovery key: ...`

- Bedeutung: Der angegebene Schlüssel konnte nicht geparst werden oder entsprach nicht dem erwarteten Format.
- Was zu tun ist: Versuchen Sie es erneut mit dem exakten Recovery-Schlüssel aus Ihrem Matrix-Client oder Ihrer Recovery-Key-Datei.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Bedeutung: Der Schlüssel wurde angewendet, aber das Gerät konnte die Verifizierung trotzdem nicht abschließen.
- Was zu tun ist: Bestätigen Sie, dass Sie den richtigen Schlüssel verwendet haben und dass Cross-Signing für den Account verfügbar ist, und versuchen Sie es dann erneut.

`Matrix key backup is not active on this device after loading from secret storage.`

- Bedeutung: Der Secret-Speicher hat auf diesem Gerät keine aktive Backup-Sitzung erzeugt.
- Was zu tun ist: Verifizieren Sie zuerst das Gerät und prüfen Sie dann erneut mit `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Bedeutung: Dieses Gerät kann nicht aus dem Secret-Speicher wiederherstellen, bis die Geräteverifizierung abgeschlossen ist.
- Was zu tun ist: Führen Sie zuerst `openclaw matrix verify device "<your-recovery-key>"` aus.

### Meldungen zu benutzerdefinierten Plugin-Installationen

`Matrix is installed from a custom path that no longer exists: ...`

- Bedeutung: Ihr Plugin-Installationsdatensatz verweist auf einen lokalen Pfad, der nicht mehr existiert.
- Was zu tun ist: Installieren Sie es erneut mit `openclaw plugins install @openclaw/matrix`, oder, wenn Sie aus einem Repository-Checkout arbeiten, mit `openclaw plugins install ./path/to/local/matrix-plugin`.

## Wenn verschlüsselter Verlauf weiterhin nicht zurückkommt

Führen Sie diese Prüfungen in dieser Reihenfolge aus:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Wenn das Backup erfolgreich wiederhergestellt wird, in einigen alten Räumen aber weiterhin Verlauf fehlt, wurden diese fehlenden Schlüssel wahrscheinlich nie vom vorherigen Plugin gesichert.

## Wenn Sie für zukünftige Nachrichten neu anfangen möchten

Wenn Sie den Verlust nicht wiederherstellbaren alten verschlüsselten Verlaufs akzeptieren und nur künftig eine saubere Backup-Basis möchten, führen Sie diese Befehle in dieser Reihenfolge aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Wenn das Gerät danach weiterhin nicht verifiziert ist, schließen Sie die Verifizierung in Ihrem Matrix-Client ab, indem Sie die SAS-Emojis oder Dezimalcodes vergleichen und bestätigen, dass sie übereinstimmen.

## Verwandte Seiten

- [Matrix](/de/channels/matrix)
- [Doctor](/de/gateway/doctor)
- [Migrating](/de/install/migrating)
- [Plugins](/de/tools/plugin)
