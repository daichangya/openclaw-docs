---
read_when:
    - Beim Aktualisieren einer bestehenden Matrix-Installation
    - Beim Migrieren von verschlüsseltem Matrix-Verlauf und Gerätezustand
summary: Wie OpenClaw das vorherige Matrix-Plugin direkt aktualisiert, einschließlich Grenzen bei der Wiederherstellung verschlüsselter Zustände und manueller Wiederherstellungsschritte.
title: Matrix-Migration
x-i18n:
    generated_at: "2026-04-05T12:47:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b1ade057d90a524e09756bd981921988c980ea6259f5c4316a796a831e9f83b
    source_path: install/migrating-matrix.md
    workflow: 15
---

# Matrix-Migration

Diese Seite behandelt Upgrades vom vorherigen öffentlichen Plugin `matrix` auf die aktuelle Implementierung.

Für die meisten Benutzer erfolgt das Upgrade direkt:

- das Plugin bleibt `@openclaw/matrix`
- der Kanal bleibt `matrix`
- Ihre Konfiguration bleibt unter `channels.matrix`
- gecachte Anmeldeinformationen bleiben unter `~/.openclaw/credentials/matrix/`
- der Laufzeitstatus bleibt unter `~/.openclaw/matrix/`

Sie müssen keine Konfigurationsschlüssel umbenennen oder das Plugin unter einem neuen Namen neu installieren.

## Was die Migration automatisch macht

Wenn das Gateway startet und wenn Sie [`openclaw doctor --fix`](/gateway/doctor) ausführen, versucht OpenClaw, alten Matrix-Status automatisch zu reparieren.
Bevor ein ausführbarer Matrix-Migrationsschritt den Status auf der Festplatte verändert, erstellt oder verwendet OpenClaw einen fokussierten Wiederherstellungs-Snapshot erneut.

Wenn Sie `openclaw update` verwenden, hängt der genaue Auslöser davon ab, wie OpenClaw installiert ist:

- Source-Installationen führen während des Update-Ablaufs `openclaw doctor --fix` aus und starten dann standardmäßig das Gateway neu
- Installationen über Paketmanager aktualisieren das Paket, führen einen nicht interaktiven Doctor-Durchlauf aus und verlassen sich dann auf den standardmäßigen Neustart des Gateways, damit der Matrix-Migrationsstart abgeschlossen werden kann
- wenn Sie `openclaw update --no-restart` verwenden, wird die startgestützte Matrix-Migration verschoben, bis Sie später `openclaw doctor --fix` ausführen und das Gateway neu starten

Die automatische Migration umfasst:

- Erstellen oder Wiederverwenden eines Snapshots vor der Migration unter `~/Backups/openclaw-migrations/`
- Wiederverwenden Ihrer gecachten Matrix-Anmeldeinformationen
- Beibehalten derselben Account-Auswahl und Konfiguration `channels.matrix`
- Verschieben des ältesten flachen Matrix-Sync-Stores in den aktuellen accountbezogenen Speicherort
- Verschieben des ältesten flachen Matrix-Crypto-Stores in den aktuellen accountbezogenen Speicherort, wenn der Ziel-Account sicher aufgelöst werden kann
- Extrahieren eines zuvor gespeicherten Entschlüsselungsschlüssels für Matrix-Room-Key-Backups aus dem alten Rust-Crypto-Store, wenn dieser Schlüssel lokal vorhanden ist
- Wiederverwenden der vollständigsten vorhandenen Token-Hash-Speicherwurzel für denselben Matrix-Account, Homeserver und Benutzer, wenn sich das Access-Token später ändert
- Durchsuchen benachbarter Token-Hash-Speicherwurzeln nach ausstehenden Wiederherstellungsmetadaten für verschlüsselten Status, wenn sich das Matrix-Access-Token geändert hat, die Account-/Geräteidentität aber gleich geblieben ist
- Wiederherstellen gesicherter Room Keys in den neuen Crypto-Store beim nächsten Matrix-Start

Details zum Snapshot:

- OpenClaw schreibt nach einem erfolgreichen Snapshot eine Marker-Datei unter `~/.openclaw/matrix/migration-snapshot.json`, damit spätere Start- und Reparaturdurchläufe dasselbe Archiv erneut verwenden können.
- Diese automatischen Matrix-Migrations-Snapshots sichern nur Konfiguration + Status (`includeWorkspace: false`).
- Wenn Matrix nur warnungsbezogenen Migrationsstatus hat, zum Beispiel weil `userId` oder `accessToken` noch fehlen, erstellt OpenClaw den Snapshot noch nicht, weil keine Matrix-Mutation ausführbar ist.
- Wenn der Snapshot-Schritt fehlschlägt, überspringt OpenClaw die Matrix-Migration für diesen Lauf, statt den Status ohne Wiederherstellungspunkt zu verändern.

Zu Upgrades mit mehreren Accounts:

- der älteste flache Matrix-Store (`~/.openclaw/matrix/bot-storage.json` und `~/.openclaw/matrix/crypto/`) stammt aus einem Layout mit nur einem Store, daher kann OpenClaw ihn nur in ein aufgelöstes Ziel eines Matrix-Accounts migrieren
- bereits accountbezogene Legacy-Matrix-Stores werden pro konfiguriertem Matrix-Account erkannt und vorbereitet

## Was die Migration nicht automatisch tun kann

Das vorherige öffentliche Matrix-Plugin hat **nicht** automatisch Backups von Matrix-Room-Keys erstellt. Es hat den lokalen Crypto-Status persistiert und Geräteverifizierung angefordert, aber nicht garantiert, dass Ihre Room Keys auf dem Homeserver gesichert wurden.

Das bedeutet, dass manche verschlüsselten Installationen nur teilweise migriert werden können.

OpenClaw kann Folgendes nicht automatisch wiederherstellen:

- nur lokal vorhandene Room Keys, die nie gesichert wurden
- verschlüsselten Status, wenn der Ziel-Matrix-Account noch nicht aufgelöst werden kann, weil `homeserver`, `userId` oder `accessToken` noch nicht verfügbar sind
- automatische Migration eines gemeinsam genutzten flachen Matrix-Stores, wenn mehrere Matrix-Accounts konfiguriert sind, aber `channels.matrix.defaultAccount` nicht gesetzt ist
- Installationen über benutzerdefinierte Plugin-Pfade, die an einen Repo-Pfad statt an das Standard-Matrix-Paket gebunden sind
- einen fehlenden Recovery Key, wenn der alte Store gesicherte Keys hatte, den Entschlüsselungsschlüssel aber nicht lokal behalten hat

Aktueller Warnungsumfang:

- Installationen über benutzerdefinierte Matrix-Plugin-Pfade werden sowohl beim Gateway-Start als auch durch `openclaw doctor` angezeigt

Wenn Ihre alte Installation einen nur lokal vorhandenen verschlüsselten Verlauf hatte, der nie gesichert wurde, können einige ältere verschlüsselte Nachrichten nach dem Upgrade weiterhin unlesbar bleiben.

## Empfohlener Upgrade-Ablauf

1. Aktualisieren Sie OpenClaw und das Matrix-Plugin normal.
   Bevorzugen Sie einfaches `openclaw update` ohne `--no-restart`, damit der Start die Matrix-Migration sofort abschließen kann.
2. Führen Sie aus:

   ```bash
   openclaw doctor --fix
   ```

   Wenn Matrix ausführbare Migrationsarbeit hat, erstellt oder verwendet Doctor zuerst den Snapshot vor der Migration erneut und gibt den Archivpfad aus.

3. Starten oder starten Sie das Gateway neu.
4. Prüfen Sie den aktuellen Verifizierungs- und Backup-Status:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Wenn OpenClaw Ihnen mitteilt, dass ein Recovery Key benötigt wird, führen Sie aus:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Wenn dieses Gerät noch nicht verifiziert ist, führen Sie aus:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Wenn Sie absichtlich nicht wiederherstellbaren alten Verlauf aufgeben und eine frische Backup-Basis für zukünftige Nachrichten wollen, führen Sie aus:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Wenn noch kein serverseitiges Key-Backup existiert, erstellen Sie eines für zukünftige Wiederherstellungen:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Wie die Migration verschlüsselter Daten funktioniert

Die Migration verschlüsselter Daten ist ein zweistufiger Prozess:

1. Start oder `openclaw doctor --fix` erstellt oder verwendet den Snapshot vor der Migration erneut, wenn die Migration verschlüsselter Daten ausführbar ist.
2. Start oder `openclaw doctor --fix` untersucht den alten Matrix-Crypto-Store über die aktive Installation des Matrix-Plugins.
3. Wenn ein Entschlüsselungsschlüssel für das Backup gefunden wird, schreibt OpenClaw ihn in den neuen Recovery-Key-Ablauf und markiert die Wiederherstellung von Room Keys als ausstehend.
4. Beim nächsten Matrix-Start stellt OpenClaw gesicherte Room Keys automatisch in den neuen Crypto-Store wieder her.

Wenn der alte Store Room Keys meldet, die nie gesichert wurden, warnt OpenClaw, statt vorzutäuschen, dass die Wiederherstellung erfolgreich war.

## Häufige Meldungen und ihre Bedeutung

### Upgrade- und Erkennungsmeldungen

`Matrix plugin upgraded in place.`

- Bedeutung: Der alte Matrix-Status auf der Festplatte wurde erkannt und in das aktuelle Layout migriert.
- Was zu tun ist: Nichts, es sei denn, dieselbe Ausgabe enthält auch Warnungen.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat ein Wiederherstellungsarchiv erstellt, bevor Matrix-Status verändert wurde.
- Was zu tun ist: Bewahren Sie den ausgegebenen Archivpfad auf, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Bedeutung: OpenClaw hat einen bestehenden Marker für einen Matrix-Migrations-Snapshot gefunden und dieses Archiv wiederverwendet, statt ein doppeltes Backup zu erstellen.
- Was zu tun ist: Bewahren Sie den ausgegebenen Archivpfad auf, bis Sie bestätigt haben, dass die Migration erfolgreich war.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: Alter Matrix-Status existiert, aber OpenClaw kann ihn keinem aktuellen Matrix-Account zuordnen, weil Matrix nicht konfiguriert ist.
- Was zu tun ist: Konfigurieren Sie `channels.matrix`, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: OpenClaw hat alten Status gefunden, kann aber die genaue aktuelle Account-/Gerätewurzel noch nicht bestimmen.
- Was zu tun ist: Starten Sie das Gateway einmal mit einem funktionierenden Matrix-Login oder führen Sie `openclaw doctor --fix` erneut aus, nachdem gecachte Anmeldeinformationen vorhanden sind.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen Matrix-Store gefunden, weigert sich aber zu raten, welcher benannte Matrix-Account ihn erhalten soll.
- Was zu tun ist: Setzen Sie `channels.matrix.defaultAccount` auf den beabsichtigten Account und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Bedeutung: Der neue accountbezogene Speicherort hat bereits einen Sync- oder Crypto-Store, daher hat OpenClaw ihn nicht automatisch überschrieben.
- Was zu tun ist: Verifizieren Sie, dass der aktuelle Account der richtige ist, bevor Sie das kollidierende Ziel manuell entfernen oder verschieben.

`Failed migrating Matrix legacy sync store (...)` oder `Failed migrating Matrix legacy crypto store (...)`

- Bedeutung: OpenClaw hat versucht, alten Matrix-Status zu verschieben, aber der Dateisystemvorgang ist fehlgeschlagen.
- Was zu tun ist: Prüfen Sie Dateisystemberechtigungen und den Plattenstatus und führen Sie dann `openclaw doctor --fix` erneut aus.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Bedeutung: OpenClaw hat einen alten verschlüsselten Matrix-Store gefunden, aber es gibt keine aktuelle Matrix-Konfiguration, an die er angehängt werden kann.
- Was zu tun ist: Konfigurieren Sie `channels.matrix`, und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Bedeutung: Der verschlüsselte Store existiert, aber OpenClaw kann noch nicht sicher entscheiden, zu welchem aktuellen Account/Gerät er gehört.
- Was zu tun ist: Starten Sie das Gateway einmal mit einem funktionierenden Matrix-Login oder führen Sie `openclaw doctor --fix` erneut aus, nachdem gecachte Anmeldeinformationen verfügbar sind.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Bedeutung: OpenClaw hat einen gemeinsam genutzten flachen Legacy-Crypto-Store gefunden, weigert sich aber zu raten, welcher benannte Matrix-Account ihn erhalten soll.
- Was zu tun ist: Setzen Sie `channels.matrix.defaultAccount` auf den beabsichtigten Account und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Bedeutung: OpenClaw hat alten Matrix-Status erkannt, aber die Migration ist noch durch fehlende Identitäts- oder Credential-Daten blockiert.
- Was zu tun ist: Schließen Sie Matrix-Login oder Konfiguration ab und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Bedeutung: OpenClaw hat alten verschlüsselten Matrix-Status gefunden, konnte aber den Hilfseinstiegspunkt aus dem Matrix-Plugin, der diesen Store normalerweise untersucht, nicht laden.
- Was zu tun ist: Installieren Sie das Matrix-Plugin erneut oder reparieren Sie es (`openclaw plugins install @openclaw/matrix` oder `openclaw plugins install ./path/to/local/matrix-plugin` für einen Repo-Checkout), und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Bedeutung: OpenClaw hat einen unsicheren Hilfsdateipfad gefunden, der die Plugin-Wurzel verlässt oder Prüfungen an der Plugin-Grenze nicht besteht, und hat daher den Import verweigert.
- Was zu tun ist: Installieren Sie das Matrix-Plugin aus einem vertrauenswürdigen Pfad erneut und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Bedeutung: OpenClaw hat sich geweigert, Matrix-Status zu verändern, weil zuerst kein Wiederherstellungs-Snapshot erstellt werden konnte.
- Was zu tun ist: Beheben Sie den Backup-Fehler und führen Sie dann `openclaw doctor --fix` erneut aus oder starten Sie das Gateway neu.

`Failed migrating legacy Matrix client storage: ...`

- Bedeutung: Der clientseitige Matrix-Fallback hat alten flachen Speicher gefunden, aber das Verschieben ist fehlgeschlagen. OpenClaw bricht diesen Fallback jetzt ab, statt stillschweigend mit einem frischen Store zu starten.
- Was zu tun ist: Prüfen Sie Dateisystemberechtigungen oder Konflikte, lassen Sie den alten Status intakt und versuchen Sie es nach der Fehlerbehebung erneut.

`Matrix is installed from a custom path: ...`

- Bedeutung: Matrix ist an eine Installation über einen Pfad gebunden, sodass Mainline-Updates es nicht automatisch durch das Standard-Matrix-Paket des Repos ersetzen.
- Was zu tun ist: Installieren Sie mit `openclaw plugins install @openclaw/matrix` erneut, wenn Sie zum Standard-Matrix-Plugin zurückkehren möchten.

### Meldungen zur Wiederherstellung verschlüsselter Daten

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Bedeutung: Gesicherte Room Keys wurden erfolgreich in den neuen Crypto-Store wiederhergestellt.
- Was zu tun ist: Normalerweise nichts.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Bedeutung: Einige alte Room Keys existierten nur im alten lokalen Store und waren nie in das Matrix-Backup hochgeladen worden.
- Was zu tun ist: Rechnen Sie damit, dass ein Teil des alten verschlüsselten Verlaufs nicht verfügbar bleibt, sofern Sie diese Keys nicht manuell von einem anderen verifizierten Client wiederherstellen können.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Bedeutung: Es gibt ein Backup, aber OpenClaw konnte den Recovery Key nicht automatisch wiederherstellen.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` aus.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Bedeutung: OpenClaw hat den alten verschlüsselten Store gefunden, konnte ihn aber nicht sicher genug untersuchen, um die Wiederherstellung vorzubereiten.
- Was zu tun ist: Führen Sie `openclaw doctor --fix` erneut aus. Wenn sich das wiederholt, lassen Sie das alte Statusverzeichnis intakt und stellen Sie mithilfe eines anderen verifizierten Matrix-Clients plus `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` wieder her.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Bedeutung: OpenClaw hat einen Konflikt beim Backup-Key erkannt und sich geweigert, die aktuelle Datei mit dem Recovery Key automatisch zu überschreiben.
- Was zu tun ist: Verifizieren Sie, welcher Recovery Key korrekt ist, bevor Sie einen Wiederherstellungsbefehl erneut ausführen.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Bedeutung: Das ist die harte Grenze des alten Speicherformats.
- Was zu tun ist: Gesicherte Keys können weiterhin wiederhergestellt werden, aber nur lokal vorhandener verschlüsselter Verlauf bleibt möglicherweise nicht verfügbar.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Bedeutung: Das neue Plugin hat die Wiederherstellung versucht, aber Matrix hat einen Fehler zurückgegeben.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup status` aus und versuchen Sie es dann bei Bedarf erneut mit `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Meldungen zur manuellen Wiederherstellung

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Bedeutung: OpenClaw weiß, dass Sie einen Backup-Key haben sollten, aber er ist auf diesem Gerät nicht aktiv.
- Was zu tun ist: Führen Sie `openclaw matrix verify backup restore` aus oder übergeben Sie bei Bedarf `--recovery-key`.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Bedeutung: Dieses Gerät hat den Recovery Key derzeit nicht gespeichert.
- Was zu tun ist: Verifizieren Sie das Gerät zuerst mit Ihrem Recovery Key und stellen Sie dann das Backup wieder her.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Bedeutung: Der gespeicherte Key stimmt nicht mit dem aktiven Matrix-Backup überein.
- Was zu tun ist: Führen Sie `openclaw matrix verify device "<your-recovery-key>"` erneut mit dem richtigen Key aus.

Wenn Sie akzeptieren, nicht wiederherstellbaren alten verschlüsselten Verlauf zu verlieren, können Sie stattdessen die
aktuelle Backup-Basis mit `openclaw matrix verify backup reset --yes` zurücksetzen. Wenn das
gespeicherte Backup-Secret defekt ist, kann dieses Zurücksetzen auch den Secret Storage neu erstellen, damit der
neue Backup-Key nach dem Neustart korrekt geladen werden kann.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Bedeutung: Das Backup existiert, aber dieses Gerät vertraut der Cross-Signing-Kette noch nicht stark genug.
- Was zu tun ist: Führen Sie `openclaw matrix verify device "<your-recovery-key>"` erneut aus.

`Matrix recovery key is required`

- Bedeutung: Sie haben einen Wiederherstellungsschritt versucht, ohne einen erforderlichen Recovery Key anzugeben.
- Was zu tun ist: Führen Sie den Befehl erneut mit Ihrem Recovery Key aus.

`Invalid Matrix recovery key: ...`

- Bedeutung: Der angegebene Key konnte nicht geparst werden oder entsprach nicht dem erwarteten Format.
- Was zu tun ist: Versuchen Sie es erneut mit dem exakten Recovery Key aus Ihrem Matrix-Client oder Ihrer Recovery-Key-Datei.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Bedeutung: Der Key wurde angewendet, aber das Gerät konnte die Verifizierung trotzdem nicht abschließen.
- Was zu tun ist: Bestätigen Sie, dass Sie den richtigen Key verwendet haben und dass Cross-Signing für den Account verfügbar ist, und versuchen Sie es dann erneut.

`Matrix key backup is not active on this device after loading from secret storage.`

- Bedeutung: Secret Storage hat auf diesem Gerät keine aktive Backup-Sitzung erzeugt.
- Was zu tun ist: Verifizieren Sie das Gerät zuerst und prüfen Sie dann erneut mit `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Bedeutung: Dieses Gerät kann erst aus Secret Storage wiederherstellen, wenn die Geräteverifizierung abgeschlossen ist.
- Was zu tun ist: Führen Sie zuerst `openclaw matrix verify device "<your-recovery-key>"` aus.

### Meldungen zu benutzerdefinierten Plugin-Installationen

`Matrix is installed from a custom path that no longer exists: ...`

- Bedeutung: Ihr Plugin-Installationsdatensatz zeigt auf einen lokalen Pfad, der nicht mehr existiert.
- Was zu tun ist: Installieren Sie erneut mit `openclaw plugins install @openclaw/matrix` oder, wenn Sie aus einem Repo-Checkout arbeiten, mit `openclaw plugins install ./path/to/local/matrix-plugin`.

## Wenn verschlüsselter Verlauf weiterhin nicht zurückkommt

Führen Sie diese Prüfungen in der folgenden Reihenfolge aus:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Wenn das Backup erfolgreich wiederhergestellt wird, aber in einigen alten Räumen weiterhin Verlauf fehlt, wurden diese fehlenden Keys vermutlich nie durch das vorherige Plugin gesichert.

## Wenn Sie für zukünftige Nachrichten neu beginnen möchten

Wenn Sie akzeptieren, nicht wiederherstellbaren alten verschlüsselten Verlauf zu verlieren und nur eine saubere Backup-Basis für die Zukunft möchten, führen Sie diese Befehle in der folgenden Reihenfolge aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Wenn das Gerät danach weiterhin nicht verifiziert ist, schließen Sie die Verifizierung in Ihrem Matrix-Client ab, indem Sie die SAS-Emoji oder Dezimalcodes vergleichen und bestätigen, dass sie übereinstimmen.

## Verwandte Seiten

- [Matrix](/channels/matrix)
- [Doctor](/gateway/doctor)
- [Migrating](/install/migrating)
- [Plugins](/tools/plugin)
