---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Status der Matrix-Unterstützung, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-04-05T12:37:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5c49ad2125d97adf66b5517f8409567eff8b86e20224a32fcb940a02cb0659
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix ist das gebündelte Matrix-Channel-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher
benötigen normale paketierte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Matrix ausschließt, installieren
Sie es manuell:

Von npm installieren:

```bash
openclaw plugins install @openclaw/matrix
```

Von einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Siehe [Plugins](/tools/plugin) für Plugin-Verhalten und Installationsregeln.

## Einrichtung

1. Stellen Sie sicher, dass das Matrix-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
3. Konfigurieren Sie `channels.matrix` mit entweder:
   - `homeserver` + `accessToken`, oder
   - `homeserver` + `userId` + `password`.
4. Starten Sie das Gateway neu.
5. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

Was der Matrix-Assistent tatsächlich abfragt:

- Homeserver-URL
- Authentifizierungsmethode: Access Token oder Passwort
- Benutzer-ID nur, wenn Sie Passwortauthentifizierung wählen
- optionaler Gerätename
- ob E2EE aktiviert werden soll
- ob der Matrix-Raumzugriff jetzt konfiguriert werden soll

Wichtiges Verhalten des Assistenten:

- Wenn Matrix-Auth-Umgebungsvariablen für das ausgewählte Konto bereits existieren und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Umgebungsvariablen-Abkürzung an und schreibt für dieses Konto nur `enabled: true`.
- Wenn Sie interaktiv ein weiteres Matrix-Konto hinzufügen, wird der eingegebene Kontoname in die Konto-ID normalisiert, die in Konfiguration und Umgebungsvariablen verwendet wird. Zum Beispiel wird `Ops Bot` zu `ops-bot`.
- DM-Allowlist-Eingabeaufforderungen akzeptieren sofort vollständige `@user:server`-Werte. Anzeigenamen funktionieren nur, wenn die Live-Verzeichnissuche genau einen Treffer findet; andernfalls fordert der Assistent Sie auf, es mit einer vollständigen Matrix-ID erneut zu versuchen.
- Raum-Allowlist-Eingabeaufforderungen akzeptieren Raum-IDs und Aliasse direkt. Sie können auch Namen beigetretener Räume live auflösen, aber nicht aufgelöste Namen werden bei der Einrichtung nur so gespeichert, wie sie eingegeben wurden, und später bei der Laufzeit-Allowlist-Auflösung ignoriert. Bevorzugen Sie `!room:server` oder `#alias:server`.
- Die Laufzeit-Raum-/Sitzungsidentität verwendet die stabile Matrix-Raum-ID. In Räumen deklarierte Aliasse werden nur als Lookup-Eingaben verwendet, nicht als langfristiger Sitzungsschlüssel oder stabile Gruppenidentität.
- Um Raumnamen vor dem Speichern aufzulösen, verwenden Sie `openclaw channels resolve --channel matrix "Project Room"`.

Minimale tokenbasierte Einrichtung:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Passwortbasierte Einrichtung (Token wird nach dem Login zwischengespeichert):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix speichert zwischengespeicherte Anmeldedaten in `~/.openclaw/credentials/matrix/`.
Das Standardkonto verwendet `credentials.json`; benannte Konten verwenden `credentials-<account>.json`.

Entsprechende Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Für Nicht-Standardkonten verwenden Sie kontobezogene Umgebungsvariablen:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Beispiel für Konto `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Für die normalisierte Konto-ID `ops-bot` verwenden Sie:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix maskiert Satzzeichen in Konto-IDs, damit kontobezogene Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, sodass `ops-prod` zu `MATRIX_OPS_X2D_PROD_*` wird.

Der interaktive Assistent bietet die Umgebungsvariablen-Abkürzung nur an, wenn diese Auth-Umgebungsvariablen bereits vorhanden sind und das ausgewählte Konto nicht bereits Matrix-Authentifizierung in der Konfiguration gespeichert hat.

## Konfigurationsbeispiel

Dies ist eine praktische Basiskonfiguration mit DM-Pairing, Raum-Allowlist und aktivierter E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Streaming-Vorschauen

Matrix-Antwort-Streaming ist Opt-in.

Setzen Sie `channels.matrix.streaming` auf `"partial"`, wenn Sie möchten, dass OpenClaw eine einzelne Entwurfsantwort sendet,
diesen Entwurf während der Textgenerierung des Modells direkt bearbeitet und ihn dann finalisiert, wenn die Antwort
fertig ist:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` ist der Standard. OpenClaw wartet auf die endgültige Antwort und sendet sie einmal.
- `streaming: "partial"` erstellt eine bearbeitbare Vorschau-Nachricht für den aktuellen Assistant-Block, anstatt mehrere partielle Nachrichten zu senden.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Mit `streaming: "partial"` behält Matrix den Live-Entwurf für den aktuellen Block bei und bewahrt abgeschlossene Blöcke als separate Nachrichten.
- Wenn `streaming: "partial"` gesetzt und `blockStreaming` deaktiviert ist, bearbeitet Matrix nur den Live-Entwurf und sendet die abgeschlossene Antwort, sobald dieser Block oder Turn beendet ist.
- Wenn die Vorschau nicht mehr in ein einzelnes Matrix-Ereignis passt, stoppt OpenClaw das Vorschau-Streaming und greift auf die normale endgültige Zustellung zurück.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie vor dem Senden der endgültigen Medienantwort.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lassen Sie Streaming deaktiviert, wenn Sie das konservativste Rate-Limit-Verhalten wünschen.

`blockStreaming` aktiviert Entwurfsvorschauen nicht von selbst.
Verwenden Sie `streaming: "partial"` für Vorschau-Bearbeitungen; fügen Sie dann `blockStreaming: true` nur hinzu, wenn Sie auch möchten, dass abgeschlossene Assistant-Blöcke als separate Fortschrittsnachrichten sichtbar bleiben.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE) Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

### Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie bewusst Matrix-Datenverkehr zwischen Agents möchten:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten in erlaubten Räumen und DMs.
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur, wenn sie diesen Bot sichtbar erwähnen. DMs bleiben weiterhin erlaubt.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwort-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von einem Bot verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Datenverkehr in gemeinsam genutzten Räumen aktivieren.

Verschlüsselung aktivieren:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Verifizierungsstatus prüfen:

```bash
openclaw matrix verify status
```

Ausführlicher Status (vollständige Diagnose):

```bash
openclaw matrix verify status --verbose
```

Den gespeicherten Wiederherstellungsschlüssel in maschinenlesbarer Ausgabe einschließen:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-Signing- und Verifizierungsstatus bootstrapen:

```bash
openclaw matrix verify bootstrap
```

Mehrkonten-Unterstützung: Verwenden Sie `channels.matrix.accounts` mit kontospezifischen Anmeldedaten und optionalem `name`. Siehe [Konfigurationsreferenz](/gateway/configuration-reference#multi-account-all-channels) für das gemeinsame Muster.

Ausführliche Bootstrap-Diagnose:

```bash
openclaw matrix verify bootstrap --verbose
```

Vor dem Bootstrap ein frisches Zurücksetzen der Cross-Signing-Identität erzwingen:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Ausführliche Details zur Geräteverifizierung:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Integrität des Raumschlüssel-Backups prüfen:

```bash
openclaw matrix verify backup status
```

Ausführliche Diagnose des Backup-Zustands:

```bash
openclaw matrix verify backup status --verbose
```

Raumschlüssel aus dem Server-Backup wiederherstellen:

```bash
openclaw matrix verify backup restore
```

Ausführliche Diagnose der Wiederherstellung:

```bash
openclaw matrix verify backup restore --verbose
```

Das aktuelle Server-Backup löschen und eine frische Backup-Basis erstellen. Wenn der gespeicherte
Backup-Schlüssel nicht sauber geladen werden kann, kann dieses Zurücksetzen auch den Secret Storage neu erstellen, sodass
zukünftige Kaltstarts den neuen Backup-Schlüssel laden können:

```bash
openclaw matrix verify backup reset --yes
```

Alle `verify`-Befehle sind standardmäßig kompakt (einschließlich stiller interner SDK-Protokollierung) und zeigen detaillierte Diagnosen nur mit `--verbose`.
Verwenden Sie `--json` für vollständige maschinenlesbare Ausgabe beim Skripten.

In Mehrkonten-Setups verwenden Matrix-CLI-Befehle das implizite Matrix-Standardkonto, sofern Sie nicht `--account <id>` übergeben.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie zuerst `channels.matrix.defaultAccount`, sonst stoppen diese impliziten CLI-Operationen und fordern Sie auf, explizit ein Konto auszuwählen.
Verwenden Sie `--account`, wann immer Verifizierungs- oder Geräteoperationen explizit auf ein benanntes Konto zielen sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn die Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

### Was „verifiziert“ bedeutet

OpenClaw behandelt dieses Matrix-Gerät nur dann als verifiziert, wenn es durch Ihre eigene Cross-Signing-Identität verifiziert ist.
In der Praxis zeigt `openclaw matrix verify status --verbose` drei Vertrauenssignale:

- `Locally trusted`: Dieses Gerät wird nur vom aktuellen Client vertraut
- `Cross-signing verified`: Das SDK meldet das Gerät als über Cross-Signing verifiziert
- `Signed by owner`: Das Gerät ist mit Ihrem eigenen Self-Signing-Schlüssel signiert

`Verified by owner` wird nur dann zu `yes`, wenn Cross-Signing-Verifizierung oder Owner-Signing vorhanden ist.
Lokales Vertrauen allein reicht nicht aus, damit OpenClaw das Gerät als vollständig verifiziert behandelt.

### Was Bootstrap tut

`openclaw matrix verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Matrix-Konten.
Er macht der Reihe nach Folgendes:

- bootstrappt Secret Storage und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel erneut
- bootstrappt Cross-Signing und lädt fehlende öffentliche Cross-Signing-Schlüssel hoch
- versucht, das aktuelle Gerät zu markieren und per Cross-Signing zu signieren
- erstellt ein neues serverseitiges Raumschlüssel-Backup, falls noch keines existiert

Wenn der Homeserver interaktive Authentifizierung zum Hochladen von Cross-Signing-Schlüsseln verlangt, versucht OpenClaw den Upload zuerst ohne Authentifizierung, dann mit `m.login.dummy` und dann mit `m.login.password`, wenn `channels.matrix.password` konfiguriert ist.

Verwenden Sie `--force-reset-cross-signing` nur, wenn Sie bewusst die aktuelle Cross-Signing-Identität verwerfen und eine neue erstellen möchten.

Wenn Sie bewusst das aktuelle Raumschlüssel-Backup verwerfen und eine neue
Backup-Basis für zukünftige Nachrichten starten möchten, verwenden Sie `openclaw matrix verify backup reset --yes`.
Tun Sie dies nur, wenn Sie akzeptieren, dass nicht wiederherstellbarer alter verschlüsselter Verlauf
nicht verfügbar bleibt und OpenClaw Secret Storage möglicherweise neu erstellt, wenn das aktuelle Backup-
Geheimnis nicht sicher geladen werden kann.

### Frische Backup-Basis

Wenn Sie möchten, dass zukünftige verschlüsselte Nachrichten weiterhin funktionieren, und akzeptieren, dass nicht wiederherstellbarer alter Verlauf verloren geht, führen Sie diese Befehle in dieser Reihenfolge aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Fügen Sie jedem Befehl `--account <id>` hinzu, wenn Sie explizit ein benanntes Matrix-Konto ansprechen möchten.

### Startverhalten

Wenn `encryption: true` gesetzt ist, verwendet Matrix standardmäßig `startupVerification` mit dem Wert `"if-unverified"`.
Beim Start fordert Matrix, wenn dieses Gerät noch nicht verifiziert ist, die Selbstverifizierung in einem anderen Matrix-Client an,
überspringt doppelte Anfragen, solange bereits eine aussteht, und wendet vor einem erneuten Versuch nach Neustarts eine lokale Cooldown-Zeit an.
Fehlgeschlagene Anforderungsversuche werden standardmäßig schneller wiederholt als eine erfolgreiche Anforderungserstellung.
Setzen Sie `startupVerification: "off"`, um automatische Startanfragen zu deaktivieren, oder passen Sie `startupVerificationCooldownHours`
an, wenn Sie ein kürzeres oder längeres Wiederholungsfenster möchten.

Beim Start wird außerdem automatisch ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt.
Dieser Durchlauf versucht zuerst, den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederzuverwenden, und vermeidet das Zurücksetzen von Cross-Signing, sofern Sie nicht explizit einen Bootstrap-Reparaturablauf starten.

Wenn beim Start ein fehlerhafter Bootstrap-Status gefunden wird und `channels.matrix.password` konfiguriert ist, kann OpenClaw einen strengeren Reparaturpfad versuchen.
Wenn das aktuelle Gerät bereits vom Eigentümer signiert ist, bewahrt OpenClaw diese Identität, anstatt sie automatisch zurückzusetzen.

Upgrade vom vorherigen öffentlichen Matrix-Plugin:

- OpenClaw verwendet nach Möglichkeit automatisch dasselbe Matrix-Konto, denselben Access Token und dieselbe Geräteidentität weiter.
- Bevor ausführbare Matrix-Migrationsänderungen laufen, erstellt oder verwendet OpenClaw einen Wiederherstellungs-Snapshot unter `~/Backups/openclaw-migrations/`.
- Wenn Sie mehrere Matrix-Konten verwenden, setzen Sie `channels.matrix.defaultAccount` vor dem Upgrade vom alten Flat-Store-Layout, damit OpenClaw weiß, welches Konto diesen gemeinsam genutzten Legacy-Status erhalten soll.
- Wenn das vorherige Plugin lokal einen Entschlüsselungsschlüssel für Matrix-Raumschlüssel-Backups gespeichert hatte, importiert der Start oder `openclaw doctor --fix` ihn automatisch in den neuen Wiederherstellungsschlüssel-Ablauf.
- Wenn sich der Matrix-Access-Token nach Vorbereitung der Migration geändert hat, durchsucht der Start jetzt benachbarte Token-Hash-Speicherwurzeln nach ausstehendem Legacy-Wiederherstellungsstatus, bevor die automatische Backup-Wiederherstellung aufgegeben wird.
- Wenn sich der Matrix-Access-Token später für dasselbe Konto, denselben Homeserver und denselben Benutzer ändert, verwendet OpenClaw jetzt bevorzugt die vollständigste vorhandene Token-Hash-Speicherwurzel weiter, anstatt mit einem leeren Matrix-Statusverzeichnis zu beginnen.
- Beim nächsten Gateway-Start werden gesicherte Raumschlüssel automatisch in den neuen Krypto-Store wiederhergestellt.
- Wenn das alte Plugin lokale Raumschlüssel hatte, die nie gesichert wurden, warnt OpenClaw dies klar. Diese Schlüssel können nicht automatisch aus dem vorherigen Rust-Krypto-Store exportiert werden, daher kann ein Teil des alten verschlüsselten Verlaufs nicht verfügbar bleiben, bis er manuell wiederhergestellt wird.
- Siehe [Matrix-Migration](/install/migrating-matrix) für den vollständigen Upgrade-Ablauf, Einschränkungen, Wiederherstellungsbefehle und häufige Migrationsmeldungen.

Der verschlüsselte Laufzeitstatus ist unter konto- und benutzerbezogenen Token-Hash-Wurzeln in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` organisiert.
Dieses Verzeichnis enthält den Sync-Store (`bot-storage.json`), den Krypto-Store (`crypto/`),
die Wiederherstellungsschlüsseldatei (`recovery-key.json`), den IndexedDB-Snapshot (`crypto-idb-snapshot.json`),
Thread-Bindings (`thread-bindings.json`) und den Startverifizierungsstatus (`startup-verification.json`),
wenn diese Funktionen verwendet werden.
Wenn sich der Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw die beste vorhandene
Wurzel für dieses Konto-/Homeserver-/Benutzer-Tupel weiter, sodass vorheriger Sync-Status, Krypto-Status, Thread-Bindings
und Startverifizierungsstatus weiterhin sichtbar bleiben.

### Node-Krypto-Store-Modell

Matrix-E2EE in diesem Plugin verwendet den offiziellen `matrix-js-sdk`-Rust-Kryptopfad in Node.
Dieser Pfad erwartet IndexedDB-basierte Persistenz, wenn der Krypto-Status Neustarts überstehen soll.

OpenClaw stellt dies in Node derzeit bereit, indem es:

- `fake-indexeddb` als vom SDK erwarteten IndexedDB-API-Shim verwendet
- die Rust-Krypto-IndexedDB-Inhalte vor `initRustCrypto` aus `crypto-idb-snapshot.json` wiederherstellt
- die aktualisierten IndexedDB-Inhalte nach der Initialisierung und während der Laufzeit zurück in `crypto-idb-snapshot.json` persistiert
- Snapshot-Wiederherstellung und -Persistierung gegenüber `crypto-idb-snapshot.json` mit einer Advisory-Dateisperre serialisiert, damit Gateway-Laufzeitpersistenz und CLI-Wartung nicht gleichzeitig auf dieselbe Snapshot-Datei zugreifen

Dies ist Kompatibilitäts-/Speicher-Plumbing, keine benutzerdefinierte Krypto-Implementierung.
Die Snapshot-Datei ist sensibler Laufzeitstatus und wird mit restriktiven Dateiberechtigungen gespeichert.
Im Sicherheitsmodell von OpenClaw befinden sich der Gateway-Host und das lokale OpenClaw-Statusverzeichnis bereits innerhalb der vertrauenswürdigen Betreibergrenze, daher handelt es sich dabei primär um ein betriebliches Dauerhaftigkeitsproblem und nicht um eine separate entfernte Vertrauensgrenze.

Geplante Verbesserung:

- SecretRef-Unterstützung für persistentes Matrix-Schlüsselmaterial hinzufügen, damit Wiederherstellungsschlüssel und zugehörige Store-Verschlüsselungsgeheimnisse aus OpenClaw-Secrets-Providern statt nur aus lokalen Dateien bezogen werden können

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Fügen Sie `--account <id>` hinzu, wenn Sie explizit ein benanntes Matrix-Konto ansprechen möchten.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn Sie eine `http://`- oder `https://`-Avatar-URL übergeben, lädt OpenClaw sie zuerst zu Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder in die ausgewählte Kontoüberschreibung).

## Automatische Verifizierungshinweise

Matrix veröffentlicht jetzt Hinweise zum Verifizierungslebenszyklus direkt im strikten DM-Verifizierungsraum als `m.notice`-Nachrichten.
Dazu gehören:

- Hinweise zu Verifizierungsanfragen
- Hinweise, dass die Verifizierung bereit ist (mit expliziter Anleitung „Per Emoji verifizieren“)
- Hinweise zu Verifizierungsstart und -abschluss
- SAS-Details (Emoji und Dezimal), wenn verfügbar

Eingehende Verifizierungsanfragen von einem anderen Matrix-Client werden von OpenClaw nachverfolgt und automatisch akzeptiert.
Für Selbstverifizierungsabläufe startet OpenClaw den SAS-Ablauf ebenfalls automatisch, sobald Emoji-Verifizierung verfügbar wird, und bestätigt seine eigene Seite.
Bei Verifizierungsanfragen von einem anderen Matrix-Benutzer/-Gerät akzeptiert OpenClaw die Anfrage automatisch und wartet dann, bis der SAS-Ablauf normal fortschreitet.
Sie müssen die Emoji- oder Dezimal-SAS weiterhin in Ihrem Matrix-Client vergleichen und dort „Sie stimmen überein“ bestätigen, um die Verifizierung abzuschließen.

OpenClaw akzeptiert selbst initiierte doppelte Abläufe nicht blind automatisch. Beim Start wird keine neue Anfrage erstellt, wenn bereits eine Selbstverifizierungsanfrage aussteht.

Hinweise des Verifizierungsprotokolls/-systems werden nicht an die Agent-Chat-Pipeline weitergeleitet, sodass sie kein `NO_REPLY` erzeugen.

### Gerätehygiene

Alte von OpenClaw verwaltete Matrix-Geräte können sich auf dem Konto ansammeln und das Vertrauen in verschlüsselten Räumen schwerer nachvollziehbar machen.
Listen Sie sie auf mit:

```bash
openclaw matrix devices list
```

Entfernen Sie veraltete, von OpenClaw verwaltete Geräte mit:

```bash
openclaw matrix devices prune-stale
```

### Reparatur direkter Räume

Wenn der Direktnachrichtenstatus nicht mehr synchron ist, kann OpenClaw am Ende veraltete `m.direct`-Zuordnungen haben, die auf alte Einzelräume statt auf die aktive DM verweisen. Prüfen Sie die aktuelle Zuordnung für einen Peer mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Der Reparaturablauf hält die Matrix-spezifische Logik innerhalb des Plugins:

- er bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- andernfalls greift er auf eine aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- wenn keine funktionierende DM existiert, erstellt er einen neuen direkten Raum und schreibt `m.direct` so um, dass darauf verwiesen wird

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die funktionierende DM aus und aktualisiert die Zuordnung, damit neue Matrix-Sendungen, Verifizierungshinweise und andere Direktnachrichtenabläufe wieder den richtigen Raum ansteuern.

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Message-Tool-Sendungen.

- `threadReplies: "off"` hält Antworten auf oberster Ebene und hält eingehende Thread-Nachrichten in der übergeordneten Sitzung.
- `threadReplies: "inbound"` antwortet innerhalb eines Threads nur dann, wenn sich die eingehende Nachricht bereits in diesem Thread befand.
- `threadReplies: "always"` hält Raumantworten in einem Thread, der an der auslösenden Nachricht verankert ist, und leitet diese Unterhaltung über die passende threadbezogene Sitzung ab der ersten auslösenden Nachricht weiter.
- `dm.threadReplies` überschreibt die oberste Einstellung nur für DMs. So können Sie beispielsweise Raum-Threads isoliert halten und DMs dennoch flach halten.
- Eingehende Thread-Nachrichten enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Message-Tool-Sendungen übernehmen jetzt automatisch den aktuellen Matrix-Thread, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern kein explizites `threadId` angegeben wurde.
- Laufzeit-Thread-Bindings werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundene `/acp spawn` funktionieren jetzt in Matrix-Räumen und DMs.
- Das Matrix-Raum-/DM-`/focus` auf oberster Ebene erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Wenn `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads ausgeführt wird, wird stattdessen dieser aktuelle Thread gebunden.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Workspaces umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des bestehenden Threads aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geroutet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread direkt.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Thread-Binding-Konfiguration

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Threadgebundene Spawn-Flags für Matrix sind Opt-in:

- Setzen Sie `threadBindings.spawnSubagentSessions: true`, damit `/focus` auf oberster Ebene neue Matrix-Threads erstellen und binden darf.
- Setzen Sie `threadBindings.spawnAcpSessions: true`, damit `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads binden darf.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Ack-Reaktionen.

- Ausgehende Reaktions-Tooling wird durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion vom Bot-Konto.

Der Geltungsbereich von Ack-Reaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Emoji-Fallback aus der Agent-Identität

Der Ack-Reaktionsbereich wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Der Modus für Reaktionsbenachrichtigungen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- Standard: `own`

Aktuelles Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten zielen.
- `reactionNotifications: "off"` deaktiviert Reaktionssystemereignisse.
- Das Entfernen von Reaktionen wird weiterhin nicht in Systemereignisse synthetisiert, da Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst.
- Es greift auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um es zu deaktivieren.
- Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Matrix-Raumverlauf ist nur ausstehend: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Trigger eintrifft.
- Die aktuelle Trigger-Nachricht ist nicht in `InboundHistory` enthalten; sie bleibt für diesen Turn im Haupttext des Eingangs.
- Wiederholungen desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufs-Snapshot wieder, anstatt zu neueren Raumnachrichten weiterzudriften.

## Kontextsichtigkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Wurzeln und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext wird wie empfangen beibehalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen erlaubt sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber weiterhin eine explizit zitierte Antwort.

Diese Einstellung wirkt sich auf die Sichtbarkeit des ergänzenden Kontexts aus, nicht darauf, ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Trigger-Autorisierung kommt weiterhin von `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

## Beispiel für DM- und Raumrichtlinien

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Siehe [Groups](/channels/groups) für Erwähnungs-Gating- und Allowlist-Verhalten.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Sie vor der Genehmigung weiterhin anschreibt, verwendet OpenClaw denselben ausstehenden Pairing-Code wieder und sendet nach einer kurzen Cooldown-Zeit möglicherweise erneut eine Erinnerungsantwort, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Exec-Genehmigungen

Matrix kann als Exec-Genehmigungsclient für ein Matrix-Konto fungieren.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; greift auf `channels.matrix.dm.allowFrom` zurück)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Genehmigende Benutzer müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmigender aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `channels.matrix.dm.allowFrom`. Setzen Sie `enabled: false`, um Matrix explizit als nativen Genehmigungsclient zu deaktivieren. Genehmigungsanfragen greifen andernfalls auf andere konfigurierte Genehmigungsrouten oder die Exec-Genehmigungs-Fallback-Richtlinie zurück.

Natives Matrix-Routing ist heute nur für Exec vorgesehen:

- `channels.matrix.execApprovals.*` steuert natives DM-/Kanal-Routing nur für Exec-Genehmigungen.
- Plugin-Genehmigungen verwenden weiterhin das gemeinsame `/approve` im selben Chat plus jede konfigurierte Weiterleitung über `approvals.plugin`.
- Matrix kann weiterhin `channels.matrix.dm.allowFrom` für die Autorisierung von Plugin-Genehmigungen wiederverwenden, wenn Genehmigende sicher abgeleitet werden können, stellt aber keinen separaten nativen DM-/Kanal-Fanout-Pfad für Plugin-Genehmigungen bereit.

Zustellungsregeln:

- `target: "dm"` sendet Genehmigungsaufforderungen an DMs der Genehmigenden
- `target: "channel"` sendet die Aufforderung zurück an den ursprünglichen Matrix-Raum oder die ursprüngliche DM
- `target: "both"` sendet an DMs der Genehmigenden und an den ursprünglichen Matrix-Raum oder die ursprüngliche DM

Matrix verwendet heute textbasierte Genehmigungsaufforderungen. Genehmigende lösen sie mit `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny` auf.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Die Kanalzustellung enthält den Befehlstext, daher sollten Sie `channel` oder `both` nur in vertrauenswürdigen Räumen aktivieren.

Matrix-Genehmigungsaufforderungen verwenden erneut den gemeinsamen Core-Genehmigungsplaner. Die Matrix-spezifische native Oberfläche ist nur der Transport für Exec-Genehmigungen: Raum-/DM-Routing sowie Verhalten beim Senden/Aktualisieren/Löschen von Nachrichten.

Kontoübergreifende Überschreibung:

- `channels.matrix.accounts.<account>.execApprovals`

Zugehörige Dokumentation: [Exec approvals](/tools/exec-approvals)

## Mehrkontenbeispiel

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Werte auf oberster Ebene unter `channels.matrix` fungieren als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
Sie können geerbte Raumeinträge mit `groups.<room>.account` (oder dem Legacy-`rooms.<room>.account`) auf ein Matrix-Konto beschränken.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf oberster Ebene unter `channels.matrix.*` konfiguriert ist.
Partielle gemeinsam genutzte Auth-Standardwerte erstellen nicht von selbst ein separates implizites Standardkonto. OpenClaw synthetisiert das oberste `default`-Konto nur dann, wenn dieses Standardkonto frische Authentifizierung hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können weiterhin über `homeserver` plus `userId` erkennbar bleiben, wenn zwischengespeicherte Anmeldedaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen benannten Kontoschlüssel zeigt, bewahrt die Reparatur-/Einrichtungs-Promotion von Einzelkonto zu Mehrkonto dieses Konto, anstatt einen frischen `accounts.default`-Eintrag zu erstellen. Nur Matrix-Auth-/Bootstrap-Schlüssel werden in dieses hochgestufte Konto verschoben; gemeinsam genutzte Zustellungsrichtlinien-Schlüssel bleiben auf oberster Ebene.
Setzen Sie `defaultAccount`, wenn OpenClaw ein benanntes Matrix-Konto für implizites Routing, Probing und CLI-Operationen bevorzugen soll.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie `defaultAccount` oder übergeben Sie `--account <id>` für CLI-Befehle, die auf impliziter Kontoauswahl beruhen.
Übergeben Sie `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn Sie diese implizite Auswahl für einen Befehl überschreiben möchten.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum SSRF-Schutz, sofern Sie
nicht explizit pro Konto opt-in setzen.

Wenn Ihr Homeserver auf localhost, einer LAN-/Tailscale-IP oder einem internen Hostnamen läuft, aktivieren Sie
`allowPrivateNetwork` für dieses Matrix-Konto:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI-Einrichtungsbeispiel:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Dieses Opt-in erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Bevorzugen Sie nach Möglichkeit `https://`.

## Matrix-Datenverkehr über Proxy leiten

Wenn Ihre Matrix-Bereitstellung einen expliziten ausgehenden HTTP(S)-Proxy benötigt, setzen Sie `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Benannte Konten können den Standardwert der obersten Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Laufzeitdatenverkehr und Kontostatus-Probes.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzer-Lookups fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raum-Lookups akzeptieren explizite Raum-IDs und Aliasse direkt und greifen dann auf die Suche nach Namen beigetretener Räume für dieses Konto zurück.
- Die Namenssuche in beigetretenen Räumen ist Best Effort. Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er von der Laufzeit-Allowlist-Auflösung ignoriert.

## Konfigurationsreferenz

- `enabled`: den Kanal aktivieren oder deaktivieren.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `allowPrivateNetwork`: diesem Matrix-Konto erlauben, sich mit privaten/internen Homeservern zu verbinden. Aktivieren Sie dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Benannte Konten können den Standardwert der obersten Ebene mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Access Token für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` über env-/file-/exec-Provider unterstützt. Siehe [Secrets Management](/gateway/secrets).
- `password`: Passwort für passwortbasierten Login. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts für Passwort-Login.
- `avatarUrl`: gespeicherte Selbst-Avatar-URL für Profilsynchronisierung und `set-profile`-Aktualisierungen.
- `initialSyncLimit`: Ereignislimit für die Startsynchronisierung.
- `encryption`: E2EE aktivieren.
- `allowlistOnly`: Verhalten nur mit Allowlist für DMs und Räume erzwingen.
- `allowBots`: Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten zulassen (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumdatenverkehr.
- `groupAllowFrom`-Einträge sollten vollständige Matrix-Benutzer-IDs sein. Nicht aufgelöste Namen werden zur Laufzeit ignoriert.
- `historyLimit`: maximale Anzahl von Raumnachrichten, die als Gruppenverlaufs-Kontext einbezogen werden. Greift auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um es zu deaktivieren.
- `replyToMode`: `off`, `first` oder `all`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `partial`, `true` oder `false`. `partial` und `true` aktivieren Einzelnachrichten-Entwurfsvorschauen mit Bearbeitung direkt an Ort und Stelle.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistant-Blöcke, während Entwurfsvorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: kanalbezogene Überschreibungen für threadgebundenes Sitzungsrouting und Lifecycle.
- `startupVerification`: Modus für automatische Selbstverifizierungsanfragen beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Cooldown vor erneuten automatischen Startverifizierungsanfragen.
- `textChunkLimit`: Chunk-Größe für ausgehende Nachrichten.
- `chunkMode`: `length` oder `newline`.
- `responsePrefix`: optionales Nachrichtenpräfix für ausgehende Antworten.
- `ackReaction`: optionale Ack-Reaktionsüberschreibung für diesen Kanal/dieses Konto.
- `ackReactionScope`: optionale Bereichsüberschreibung für Ack-Reaktionen (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Größenlimit für Medien in MB bei Matrix-Medienverarbeitung. Es gilt für ausgehende Sendungen und eingehende Medienverarbeitung.
- `autoJoin`: Richtlinie für automatisches Beitreten bei Einladungen (`always`, `allowlist`, `off`). Standard: `off`.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` auf `allowlist` steht. Alias-Einträge werden während der Einladungsverarbeitung in Raum-IDs aufgelöst; OpenClaw vertraut keinem vom eingeladenen Raum behaupteten Alias-Status.
- `dm`: DM-Richtlinienblock (`enabled`, `policy`, `allowFrom`, `threadReplies`).
- `dm.allowFrom`-Einträge sollten vollständige Matrix-Benutzer-IDs sein, sofern Sie sie nicht bereits über Live-Verzeichnissuche aufgelöst haben.
- `dm.threadReplies`: nur für DMs geltende Thread-Richtlinienüberschreibung (`off`, `inbound`, `always`). Sie überschreibt die oberste `threadReplies`-Einstellung sowohl für Antwortplatzierung als auch für Sitzungsisolierung in DMs.
- `execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die Genehmigenden bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte kontoindividuelle Überschreibungen. Werte in `channels.matrix` auf oberster Ebene fungieren als Standardwerte für diese Einträge.
- `groups`: raumbezogene Richtlinienzuordnung. Bevorzugen Sie Raum-IDs oder Aliasse; nicht aufgelöste Raumnamen werden zur Laufzeit ignoriert. Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID, während menschenlesbare Labels weiterhin von Raumnamen kommen.
- `groups.<room>.account`: beschränkt einen geerbten Raumeintrag in Mehrkonten-Setups auf ein bestimmtes Matrix-Konto.
- `groups.<room>.allowBots`: raumbezogene Überschreibung für Sender aus konfigurierten Bots (`true` oder `"mentions"`).
- `groups.<room>.users`: senderbezogene Allowlist pro Raum.
- `groups.<room>.tools`: toolbezogene Allow-/Deny-Überschreibungen pro Raum.
- `groups.<room>.autoReply`: raumbezogene Überschreibung für Erwähnungs-Gating. `true` deaktiviert Erwähnungsanforderungen für diesen Raum; `false` aktiviert sie dort wieder.
- `groups.<room>.skills`: optionaler Skill-Filter pro Raum.
- `groups.<room>.systemPrompt`: optionales System-Prompt-Snippet pro Raum.
- `rooms`: Legacy-Alias für `groups`.
- `actions`: toolbezogenes Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
