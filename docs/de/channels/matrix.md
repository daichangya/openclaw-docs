---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Matrix-Unterstützungsstatus, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-04-24T06:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix ist ein gebündelter Kanal-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Releases als gebündeltes Plugin mitgeliefert, sodass normale
gepackte Builds keine separate Installation benötigen.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Matrix ausschließt, installieren
Sie es manuell:

Von npm installieren:

```bash
openclaw plugins install @openclaw/matrix
```

Aus einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Siehe [Plugins](/de/tools/plugin) für das Verhalten von Plugins und Installationsregeln.

## Einrichtung

1. Stellen Sie sicher, dass das Matrix-Plugin verfügbar ist.
   - Aktuelle gepackte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstellen Sie ein Matrix-Konto auf Ihrem Homeserver.
3. Konfigurieren Sie `channels.matrix` mit entweder:
   - `homeserver` + `accessToken`, oder
   - `homeserver` + `userId` + `password`.
4. Starten Sie das Gateway neu.
5. Starten Sie eine DM mit dem Bot oder laden Sie ihn in einen Raum ein.
   - Neue Matrix-Einladungen funktionieren nur, wenn `channels.matrix.autoJoin` sie zulässt.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

Der Matrix-Assistent fragt nach:

- Homeserver-URL
- Authentifizierungsmethode: Access Token oder Passwort
- Benutzer-ID (nur bei Passwort-Authentifizierung)
- optionalem Gerätenamen
- ob E2EE aktiviert werden soll
- ob Raumzugriff und automatischer Beitritt bei Einladungen konfiguriert werden sollen

Wichtige Verhaltensweisen des Assistenten:

- Wenn Matrix-Authentifizierungs-Umgebungsvariablen bereits vorhanden sind und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Env-Abkürzung an, damit die Authentifizierung in den Umgebungsvariablen bleibt.
- Kontonamen werden auf die `accountId` normalisiert. Zum Beispiel wird `Ops Bot` zu `ops-bot`.
- DM-Allowlist-Einträge akzeptieren `@user:server` direkt; Anzeigenamen funktionieren nur, wenn die Live-Verzeichnissuche genau eine Übereinstimmung findet.
- Raum-Allowlist-Einträge akzeptieren Raum-IDs und Aliasse direkt. Bevorzugen Sie `!room:server` oder `#alias:server`; nicht aufgelöste Namen werden zur Laufzeit bei der Allowlist-Auflösung ignoriert.
- Im Allowlist-Modus für automatischen Beitritt bei Einladungen dürfen nur stabile Einladungsziele verwendet werden: `!roomId:server`, `#alias:server` oder `*`. Reine Raumnamen werden abgelehnt.
- Um Raumnamen vor dem Speichern aufzulösen, verwenden Sie `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` ist standardmäßig `off`.

Wenn Sie es nicht setzen, tritt der Bot eingeladenen Räumen oder neuen DM-artigen Einladungen nicht bei. Er erscheint also nicht in neuen Gruppen oder eingeladenen DMs, es sei denn, Sie treten zuerst manuell bei.

Setzen Sie `autoJoin: "allowlist"` zusammen mit `autoJoinAllowlist`, um einzuschränken, welche Einladungen akzeptiert werden, oder setzen Sie `autoJoin: "always"`, wenn er jeder Einladung beitreten soll.

Im Modus `allowlist` akzeptiert `autoJoinAllowlist` nur `!roomId:server`, `#alias:server` oder `*`.
</Warning>

Allowlist-Beispiel:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Jeder Einladung beitreten:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

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

Passwortbasierte Einrichtung (das Token wird nach der Anmeldung zwischengespeichert):

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

Matrix speichert zwischengespeicherte Zugangsdaten in `~/.openclaw/credentials/matrix/`.
Das Standardkonto verwendet `credentials.json`; benannte Konten verwenden `credentials-<account>.json`.
Wenn dort zwischengespeicherte Zugangsdaten vorhanden sind, behandelt OpenClaw Matrix für Einrichtung, Doctor und Kanalstatus-Erkennung als konfiguriert, auch wenn die aktuelle Authentifizierung nicht direkt in der Konfiguration gesetzt ist.

Entsprechende Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Für Nicht-Standardkonten verwenden Sie kontoabhängige Umgebungsvariablen:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Beispiel für das Konto `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Für die normalisierte `accountId` `ops-bot` verwenden Sie:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix maskiert Satzzeichen in `accountId`, damit kontoabhängige Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, sodass `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet wird.

Der interaktive Assistent bietet die Env-Var-Abkürzung nur an, wenn diese Authentifizierungs-Umgebungsvariablen bereits vorhanden sind und für das ausgewählte Konto noch keine Matrix-Authentifizierung in der Konfiguration gespeichert ist.

`MATRIX_HOMESERVER` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Konfigurationsbeispiel

Dies ist eine praktische Basiskonfiguration mit DM-Pairing, Raum-Allowlist und aktiviertem E2EE:

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
        sessionScope: "per-room",
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

`autoJoin` gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen. OpenClaw kann einen eingeladenen Raum
zum Zeitpunkt der Einladung nicht zuverlässig als DM oder Gruppe klassifizieren, daher laufen alle Einladungen zuerst über `autoJoin`.
`dm.policy` gilt, nachdem der Bot beigetreten ist und der Raum als DM klassifiziert wurde.

## Streaming-Vorschauen

Reply-Streaming in Matrix ist Opt-in.

Setzen Sie `channels.matrix.streaming` auf `"partial"`, wenn OpenClaw eine einzelne Live-Vorschau-Antwort senden,
diese Vorschau während der Textgenerierung durch das Modell an Ort und Stelle bearbeiten und sie abschließen soll, wenn die
Antwort fertig ist:

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
- `streaming: "partial"` erstellt eine bearbeitbare Vorschau-Nachricht für den aktuellen Assistant-Block mit normalen Matrix-Textnachrichten. Dadurch bleibt das ältere Benachrichtigungsverhalten von Matrix mit Vorschau zuerst erhalten, sodass Standard-Clients möglicherweise beim ersten gestreamten Vorschautext statt beim fertigen Block benachrichtigen.
- `streaming: "quiet"` erstellt einen bearbeitbaren stillen Vorschauhinweis für den aktuellen Assistant-Block. Verwenden Sie dies nur, wenn Sie zusätzlich Push-Regeln für Empfänger für abgeschlossene Vorschau-Bearbeitungen konfigurieren.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Bei aktivierter Vorschau über Streaming behält Matrix den Live-Entwurf für den aktuellen Block bei und bewahrt abgeschlossene Blöcke als separate Nachrichten.
- Wenn Vorschau-Streaming aktiviert ist und `blockStreaming` deaktiviert ist, bearbeitet Matrix den Live-Entwurf an Ort und Stelle und finalisiert dasselbe Event, wenn der Block oder Turn endet.
- Wenn die Vorschau nicht mehr in ein einzelnes Matrix-Event passt, beendet OpenClaw das Vorschau-Streaming und fällt auf die normale endgültige Zustellung zurück.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie, bevor die endgültige Medienantwort gesendet wird.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lassen Sie Streaming deaktiviert, wenn Sie das konservativste Rate-Limit-Verhalten möchten.

`blockStreaming` aktiviert Entwurfsvorschauen nicht von selbst.
Verwenden Sie `streaming: "partial"` oder `streaming: "quiet"` für Vorschau-Bearbeitungen; fügen Sie dann `blockStreaming: true` nur hinzu, wenn abgeschlossene Assistant-Blöcke zusätzlich als separate Fortschrittsnachrichten sichtbar bleiben sollen.

Wenn Sie Standard-Matrix-Benachrichtigungen ohne benutzerdefinierte Push-Regeln benötigen, verwenden Sie `streaming: "partial"` für das Verhalten „Vorschau zuerst“ oder lassen Sie `streaming` deaktiviert für nur endgültige Zustellung. Mit `streaming: "off"`:

- `blockStreaming: true` sendet jeden abgeschlossenen Block als normale benachrichtigende Matrix-Nachricht.
- `blockStreaming: false` sendet nur die endgültige abgeschlossene Antwort als normale benachrichtigende Matrix-Nachricht.

### Selbstgehostete Push-Regeln für stille abgeschlossene Vorschauen

Stilles Streaming (`streaming: "quiet"`) benachrichtigt Empfänger erst, wenn ein Block oder Turn abgeschlossen ist — eine Push-Regel pro Benutzer muss auf die Markierung für abgeschlossene Vorschauen passen. Siehe [Matrix-Push-Regeln für stille Vorschauen](/de/channels/matrix-push-rules) für die vollständige Einrichtung (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie absichtlich Matrix-Verkehr zwischen Agenten zulassen möchten:

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

- `allowBots: true` akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten in zulässigen Räumen und DMs.
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur, wenn sie diesen Bot sichtbar erwähnen. DMs sind weiterhin erlaubt.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Self-Reply-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von Bots verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bild-Events `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

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

Verifizierungsbefehle (alle akzeptieren `--verbose` für Diagnoseausgaben und `--json` für maschinenlesbare Ausgabe):

| Befehl                                                        | Zweck                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                               | Status von Cross-Signing und Geräteverifizierung prüfen                             |
| `openclaw matrix verify status --include-recovery-key --json` | Den gespeicherten Recovery Key einbeziehen                                          |
| `openclaw matrix verify bootstrap`                            | Cross-Signing und Verifizierung initialisieren (siehe unten)                        |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Die aktuelle Cross-Signing-Identität verwerfen und eine neue erstellen             |
| `openclaw matrix verify device "<recovery-key>"`              | Dieses Gerät mit einem Recovery Key verifizieren                                    |
| `openclaw matrix verify backup status`                        | Zustand der Raum-Schlüssel-Sicherung prüfen                                         |
| `openclaw matrix verify backup restore`                       | Raum-Schlüssel aus der Server-Sicherung wiederherstellen                            |
| `openclaw matrix verify backup reset --yes`                   | Die aktuelle Sicherung löschen und eine neue Ausgangsbasis erstellen (kann Secret Storage neu erstellen) |

In Multi-Account-Setups verwenden Matrix-CLI-Befehle implizit das Matrix-Standardkonto, sofern Sie nicht `--account <id>` übergeben.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie zuerst `channels.matrix.defaultAccount`, da diese impliziten CLI-Vorgänge sonst anhalten und Sie auffordern, ein Konto explizit auszuwählen.
Verwenden Sie `--account`, wenn Verifizierungs- oder Gerätevorgänge explizit auf ein benanntes Konto zielen sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn die Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Was verifiziert bedeutet">
    OpenClaw behandelt ein Gerät nur dann als verifiziert, wenn Ihre eigene Cross-Signing-Identität es signiert. `verify status --verbose` zeigt drei Vertrauenssignale:

    - `Locally trusted`: nur von diesem Client als vertrauenswürdig eingestuft
    - `Cross-signing verified`: das SDK meldet Verifizierung über Cross-Signing
    - `Signed by owner`: durch Ihren eigenen Self-Signing-Schlüssel signiert

    `Verified by owner` wird nur dann zu `yes`, wenn Cross-Signing oder eine Eigentümer-Signierung vorhanden ist. Lokales Vertrauen allein reicht nicht aus.

  </Accordion>

  <Accordion title="Was bootstrap macht">
    `verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Konten. Der Reihe nach führt er Folgendes aus:

    - Secret Storage initialisieren, wobei nach Möglichkeit ein vorhandener Recovery Key wiederverwendet wird
    - Cross-Signing initialisieren und fehlende öffentliche Cross-Signing-Schlüssel hochladen
    - das aktuelle Gerät markieren und per Cross-Signing signieren
    - eine serverseitige Raum-Schlüssel-Sicherung erstellen, falls noch keine existiert

    Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln erfordert, versucht OpenClaw zuerst ohne Authentifizierung, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`). Verwenden Sie `--force-reset-cross-signing` nur, wenn Sie die aktuelle Identität absichtlich verwerfen möchten.

  </Accordion>

  <Accordion title="Neue Ausgangsbasis für Sicherungen">
    Wenn Sie möchten, dass zukünftige verschlüsselte Nachrichten weiterhin funktionieren, und damit leben können, dass nicht wiederherstellbarer alter Verlauf verloren geht:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Fügen Sie `--account <id>` hinzu, um ein benanntes Konto anzusprechen. Dabei kann auch Secret Storage neu erstellt werden, wenn das aktuelle Backup-Secret nicht sicher geladen werden kann.

  </Accordion>

  <Accordion title="Verhalten beim Start">
    Mit `encryption: true` ist `startupVerification` standardmäßig `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät in einem anderen Matrix-Client eine Selbstverifizierung an, wobei Duplikate übersprungen und ein Cooldown angewendet werden. Feinabstimmung mit `startupVerificationCooldownHours` oder Deaktivierung mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt, der den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Status defekt ist, versucht OpenClaw auch ohne `channels.matrix.password` eine abgesicherte Reparatur; wenn der Homeserver eine Passwort-UIA erfordert, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Eigentümer signierte Geräte bleiben erhalten.

    Siehe [Matrix-Migration](/de/install/migrating-matrix) für den vollständigen Upgrade-Ablauf.

  </Accordion>

  <Accordion title="Verifizierungshinweise">
    Matrix veröffentlicht Hinweise zum Lebenszyklus der Verifizierung als `m.notice`-Nachrichten im strikten DM-Verifizierungsraum: Anfrage, bereit (mit Hinweis „Per Emoji verifizieren“), Start/Abschluss und SAS-Details (Emoji/Dezimal), wenn verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Für die Selbstverifizierung startet OpenClaw den SAS-Ablauf automatisch und bestätigt seine eigene Seite, sobald die Emoji-Verifizierung verfügbar ist — Sie müssen jedoch weiterhin in Ihrem Matrix-Client vergleichen und „They match“ bestätigen.

    Systemhinweise zur Verifizierung werden nicht an die Agent-Chat-Pipeline weitergeleitet.

  </Accordion>

  <Accordion title="Gerätehygiene">
    Alte von OpenClaw verwaltete Geräte können sich ansammeln. Auflisten und bereinigen:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto Store">
    Matrix-E2EE verwendet den offiziellen Rust-Crypto-Pfad von `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Der Crypto-Status wird in `crypto-idb-snapshot.json` gespeichert (mit restriktiven Dateiberechtigungen).

    Der verschlüsselte Laufzeitstatus liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Sync Store, den Crypto Store, den Recovery Key, den IDB-Snapshot, Thread-Bindungen und den Start-Verifizierungsstatus. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw das am besten passende vorhandene Stammverzeichnis erneut, sodass der vorherige Status sichtbar bleibt.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Fügen Sie `--account <id>` hinzu, wenn Sie explizit ein benanntes Matrix-Konto ansprechen möchten.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn Sie eine `http://`- oder `https://`-Avatar-URL übergeben, lädt OpenClaw sie zuerst zu Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder in die ausgewählte Kontoüberschreibung).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sendungen mit Nachrichtentools.

- `dm.sessionScope: "per-user"` (Standard) hält das Matrix-DM-Routing absenderspezifisch, sodass mehrere DM-Räume eine Sitzung teilen können, wenn sie zum selben Peer aufgelöst werden.
- `dm.sessionScope: "per-room"` isoliert jeden Matrix-DM-Raum in seinen eigenen Sitzungsschlüssel und verwendet dabei weiterhin normale DM-Authentifizierungs- und Allowlist-Prüfungen.
- Explizite Matrix-Unterhaltungsbindungen haben weiterhin Vorrang vor `dm.sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung beibehalten.
- `threadReplies: "off"` hält Antworten auf der obersten Ebene und belässt eingehende Thread-Nachrichten in der übergeordneten Sitzung.
- `threadReplies: "inbound"` antwortet innerhalb eines Threads nur dann, wenn sich die eingehende Nachricht bereits in diesem Thread befand.
- `threadReplies: "always"` hält Raumantworten in einem Thread, der an der auslösenden Nachricht verankert ist, und leitet diese Unterhaltung ab der ersten auslösenden Nachricht durch die passende threadbezogene Sitzung.
- `dm.threadReplies` überschreibt die Einstellung der obersten Ebene nur für DMs. So können Sie zum Beispiel Raum-Threads isoliert halten und DMs flach belassen.
- Eingehende Thread-Nachrichten enthalten die Wurzelnachricht des Threads als zusätzlichen Agent-Kontext.
- Sendungen mit Nachrichtentools übernehmen automatisch den aktuellen Matrix-Thread, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern kein explizites `threadId` angegeben ist.
- Die Wiederverwendung desselben DM-Benutzerziels in derselben Sitzung greift nur dann, wenn die aktuellen Sitzungsmetadaten denselben DM-Peer auf demselben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsamen Matrix-DM-Sitzung kollidiert, veröffentlicht es in diesem Raum einmalig ein `m.notice` mit dem Escape-Hatch `/focus`, wenn Thread-Bindungen aktiviert sind und dem Hinweis `dm.sessionScope`.
- Laufzeit-Thread-Bindungen werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren in Matrix-Räumen und DMs.
- `Top-level`-`/focus` in Matrix-Räumen/DMs erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Wenn Sie `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads ausführen, wird stattdessen dieser aktuelle Thread gebunden.

## ACP-Unterhaltungsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Workspaces umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des bestehenden Threads aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die gestartete ACP-Sitzung weitergeleitet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Konfiguration der Thread-Bindung

Matrix übernimmt globale Standardwerte von `session.threadBindings` und unterstützt außerdem kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flags zum Starten threadgebundener Sitzungen in Matrix sind Opt-in:

- Setzen Sie `threadBindings.spawnSubagentSessions: true`, damit `/focus` auf oberster Ebene neue Matrix-Threads erstellen und binden darf.
- Setzen Sie `threadBindings.spawnAcpSessions: true`, damit `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads binden darf.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Bestätigungsreaktionen.

- Outbound-Reaktionstools werden durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Event eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Event auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf diesem Event.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bot-Kontos.

Der Geltungsbereich von Bestätigungsreaktionen wird in der standardmäßigen OpenClaw-Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Emoji-Fallback der Agent-Identität

Der Geltungsbereich von Bestätigungsreaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Der Modus für Reaktionsbenachrichtigungen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- Standard: `own`

Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Events weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten zielen.
- `reactionNotifications: "off"` deaktiviert System-Events für Reaktionen.
- Das Entfernen von Reaktionen wird nicht in System-Events umgewandelt, da Matrix diese als Redactions und nicht als eigenständige entfernte `m.reaction`-Events darstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agenten auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Der Verlauf von Matrix-Räumen ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Verlauf von Matrix-Räumen ist nur für ausstehende Nachrichten: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann eine Momentaufnahme dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle Auslösernachricht wird nicht in `InboundHistory` aufgenommen; sie bleibt für diesen Turn im Hauptteil des eingehenden Inhalts.
- Wiederholungen desselben Matrix-Events verwenden die ursprüngliche Verlaufsaufnahme erneut, statt zu neueren Raumnachrichten weiterzuwandern.

## Kontextsichtigkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Wurzeln und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext bleibt unverändert erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber dennoch eine explizit zitierte Antwort bei.

Diese Einstellung wirkt sich auf die Sichtbarkeit ergänzenden Kontexts aus, nicht darauf, ob die eingehende Nachricht selbst eine Antwort auslösen darf.
Die Autorisierung für Auslöser kommt weiterhin von `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

## DM- und Raumrichtlinie

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

Siehe [Gruppen](/de/channels/groups) für das Verhalten von Erwähnungssteuerung und Allowlist.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und sendet nach einer kurzen Abkühlzeit möglicherweise erneut eine Erinnerungsantwort, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Status von Direktnachrichten nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen haben, die auf alte Einzelräume statt auf die aktuelle DM verweisen. Prüfen Sie die aktuelle Zuordnung für einen Peer mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- greift andernfalls auf eine aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine funktionierende DM existiert

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die funktionierende DM aus und aktualisiert die Zuordnung, damit neue Matrix-Sendungen, Verifizierungshinweise und andere Direktnachrichtenabläufe wieder den richtigen Raum ansprechen.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungs-Client für ein Matrix-Konto fungieren. Die nativen
DM-/Kanal-Routing-Schalter befinden sich weiterhin in der Konfiguration für Exec-Genehmigungen:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; fällt auf `channels.matrix.dm.allowFrom` zurück)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Genehmigende Benutzer müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Genehmigungen automatisch, wenn `enabled` nicht gesetzt ist oder `"auto"` ist und mindestens ein genehmigender Benutzer aufgelöst werden kann. Exec-Genehmigungen verwenden zuerst `execApprovals.approvers` und können auf `channels.matrix.dm.allowFrom` zurückfallen. Plugin-Genehmigungen autorisieren über `channels.matrix.dm.allowFrom`. Setzen Sie `enabled: false`, um Matrix explizit als nativen Genehmigungs-Client zu deaktivieren. Genehmigungsanfragen fallen andernfalls auf andere konfigurierte Genehmigungswege oder die Fallback-Richtlinie für Genehmigungen zurück.

Das native Routing von Matrix unterstützt beide Genehmigungsarten:

- `channels.matrix.execApprovals.*` steuert den nativen DM-/Kanal-Fanout-Modus für Matrix-Genehmigungsaufforderungen.
- Exec-Genehmigungen verwenden die Menge genehmigender Benutzer aus `execApprovals.approvers` oder `channels.matrix.dm.allowFrom`.
- Plugin-Genehmigungen verwenden die Matrix-DM-Allowlist aus `channels.matrix.dm.allowFrom`.
- Matrix-Reaktionskürzel und Nachrichtenaktualisierungen gelten für Exec- und Plugin-Genehmigungen.

Zustellregeln:

- `target: "dm"` sendet Genehmigungsaufforderungen an DMs der genehmigenden Benutzer
- `target: "channel"` sendet die Aufforderung zurück an den ursprünglichen Matrix-Raum oder die ursprüngliche DM
- `target: "both"` sendet an DMs der genehmigenden Benutzer und an den ursprünglichen Matrix-Raum oder die ursprüngliche DM

Matrix-Genehmigungsaufforderungen setzen Reaktionskürzel in der primären Genehmigungsnachricht:

- `✅` = einmal erlauben
- `❌` = ablehnen
- `♾️` = immer erlauben, wenn diese Entscheidung durch die effektive Exec-Richtlinie zulässig ist

Genehmigende Benutzer können auf diese Nachricht reagieren oder die Fallback-Slash-Befehle verwenden: `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny`.

Nur aufgelöste genehmigende Benutzer können genehmigen oder ablehnen. Bei Exec-Genehmigungen enthält die Kanalzustellung den Befehlstext; aktivieren Sie `channel` oder `both` daher nur in vertrauenswürdigen Räumen.

Überschreibung pro Konto:

- `channels.matrix.accounts.<account>.execApprovals`

Verwandte Dokumentation: [Exec-Genehmigungen](/de/tools/exec-approvals)

## Slash-Commands

Matrix-Slash-Commands (zum Beispiel `/new`, `/reset`, `/model`) funktionieren direkt in DMs. In Räumen erkennt OpenClaw auch Slash-Commands, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad auslöst, ohne dass ein benutzerdefinierter Erwähnungs-Regex erforderlich ist. So bleibt der Bot für Beiträge im Stil `@mention /command` in Räumen responsiv, wie sie von Element und ähnlichen Clients erzeugt werden, wenn ein Benutzer den Bot per Tab-Vervollständigung auswählt, bevor er den Befehl eingibt.

Autorisierungsregeln gelten weiterhin: Absender von Befehlen müssen DM- oder Raum-Allowlist-/Eigentümer-Richtlinien genauso erfüllen wie bei normalen Nachrichten.

## Multi-Account

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
Sie können vererbte Raumeinträge mit `groups.<room>.account` auf ein Matrix-Konto beschränken.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf oberster Ebene unter `channels.matrix.*` konfiguriert ist.
Partielle gemeinsame Authentifizierungsstandards erzeugen nicht von selbst ein separates implizites Standardkonto. OpenClaw synthetisiert das `default`-Konto auf oberster Ebene nur dann, wenn dieses Standardkonto eine frische Authentifizierung hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können weiterhin über `homeserver` plus `userId` erkennbar bleiben, wenn zwischengespeicherte Zugangsdaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen benannten Kontoschlüssel verweist, bewahrt die Reparatur-/Einrichtungsförderung von Einzelkonto zu Multi-Account dieses Konto, statt einen neuen Eintrag `accounts.default` zu erstellen. Nur Matrix-Authentifizierungs-/Bootstrap-Schlüssel werden in dieses geförderte Konto verschoben; gemeinsame Richtlinienschlüssel für die Zustellung bleiben auf oberster Ebene.
Setzen Sie `defaultAccount`, wenn OpenClaw ein benanntes Matrix-Konto für implizites Routing, Prüfen und CLI-Vorgänge bevorzugen soll.
Wenn mehrere Matrix-Konten konfiguriert sind und eine Konto-ID `default` ist, verwendet OpenClaw dieses Konto implizit, auch wenn `defaultAccount` nicht gesetzt ist.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie `defaultAccount` oder übergeben Sie `--account <id>` für CLI-Befehle, die auf impliziter Kontenauswahl beruhen.
Übergeben Sie `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn Sie diese implizite Auswahl für einen Befehl überschreiben möchten.

Siehe [Konfigurationsreferenz](/de/gateway/config-channels#multi-account-all-channels) für das gemeinsame Multi-Account-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver als SSRF-Schutz, sofern Sie
dies nicht explizit pro Konto aktivieren.

Wenn Ihr Homeserver auf localhost, einer LAN-/Tailscale-IP oder einem internen Hostnamen läuft, aktivieren Sie
`network.dangerouslyAllowPrivateNetwork` für dieses Matrix-Konto:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
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

## Matrix-Verkehr über einen Proxy leiten

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

Benannte Konten können den Standardwert auf oberster Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für laufenden Matrix-Verkehr und Kontostatusprüfungen.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt und greifen dann auf die Suche nach Namen beigetretener Räume für dieses Konto zurück.
- Die Suche nach Namen beigetretener Räume erfolgt nach bestem Bemühen. Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er bei der Laufzeitauflösung der Allowlist ignoriert.

## Konfigurationsreferenz

- `enabled`: den Kanal aktivieren oder deaktivieren.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Matrix-Konto erlauben, sich mit privaten/internen Homeservern zu verbinden. Aktivieren Sie dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Verkehr. Benannte Konten können den Standardwert auf oberster Ebene mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Access Token für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` über Env-/Datei-/Exec-Provider unterstützt. Siehe [Secrets Management](/de/gateway/secrets).
- `password`: Passwort für passwortbasierte Anmeldung. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts für die Passwortanmeldung.
- `avatarUrl`: gespeicherte URL des eigenen Avatars für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl von Events, die während der Start-Synchronisierung abgerufen werden.
- `encryption`: E2EE aktivieren.
- `allowlistOnly`: wenn `true`, wird die Raumpolicy `open` auf `allowlist` hochgestuft und alle aktiven DM-Richtlinien außer `disabled` (einschließlich `pairing` und `open`) werden auf `allowlist` gesetzt. Hat keine Auswirkung auf `disabled`-Richtlinien.
- `allowBots`: Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten zulassen (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumverkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnisübereinstimmungen werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `historyLimit`: maximale Anzahl von Raumnachrichten, die als Verlaufskontext für Gruppen einbezogen werden. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- `replyToMode`: `off`, `first`, `all` oder `batched`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `"partial"`, `"quiet"`, `true` oder `false`. `"partial"` und `true` aktivieren Entwurfsaktualisierungen mit Vorschau zuerst unter Verwendung normaler Matrix-Textnachrichten. `"quiet"` verwendet nicht benachrichtigende Vorschauhinweise für selbstgehostete Push-Regel-Setups. `false` entspricht `"off"`.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistant-Blöcke, während Entwurfsvorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: kanalbezogene Überschreibungen für threadgebundenes Sitzungsrouting und Lebenszyklus.
- `startupVerification`: Modus für automatische Selbstverifizierungsanfragen beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Abkühlzeit vor dem erneuten Versuch automatischer Verifizierungsanfragen beim Start.
- `textChunkLimit`: Größe ausgehender Nachrichtenblöcke in Zeichen (gilt, wenn `chunkMode` auf `length` gesetzt ist).
- `chunkMode`: `length` teilt Nachrichten nach Zeichenanzahl; `newline` teilt an Zeilengrenzen.
- `responsePrefix`: optionale Zeichenfolge, die allen ausgehenden Antworten für diesen Kanal vorangestellt wird.
- `ackReaction`: optionale Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: optionale Überschreibung des Geltungsbereichs der Bestätigungsreaktion (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Mediengrößenobergrenze in MB für ausgehende Sendungen und die Verarbeitung eingehender Medien.
- `autoJoin`: Richtlinie für automatischen Beitritt bei Einladungen (`always`, `allowlist`, `off`). Standard: `off`. Gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` auf `allowlist` gesetzt ist. Alias-Einträge werden während der Einladungsverarbeitung zu Raum-IDs aufgelöst; OpenClaw vertraut nicht auf den vom eingeladenen Raum beanspruchten Alias-Status.
- `dm`: DM-Richtlinienblock (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: steuert den DM-Zugriff, nachdem OpenClaw dem Raum beigetreten ist und ihn als DM klassifiziert hat. Dies ändert nicht, ob einer Einladung automatisch beigetreten wird.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Verkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnisübereinstimmungen werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `dm.sessionScope`: `per-user` (Standard) oder `per-room`. Verwenden Sie `per-room`, wenn jeder Matrix-DM-Raum einen separaten Kontext behalten soll, auch wenn es sich um denselben Peer handelt.
- `dm.threadReplies`: nur für DMs geltende Überschreibung der Thread-Richtlinie (`off`, `inbound`, `always`). Überschreibt die Einstellung `threadReplies` auf oberster Ebene sowohl für die Platzierung von Antworten als auch für die Sitzungsisolierung in DMs.
- `execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die genehmigenden Benutzer bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte Überschreibungen pro Konto. Werte auf oberster Ebene unter `channels.matrix` fungieren als Standardwerte für diese Einträge.
- `groups`: Richtlinienzuordnung pro Raum. Bevorzugen Sie Raum-IDs oder Aliasse; nicht aufgelöste Raumnamen werden zur Laufzeit ignoriert. Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID.
- `groups.<room>.account`: einen vererbten Raumeintrag in Multi-Account-Setups auf ein bestimmtes Matrix-Konto beschränken.
- `groups.<room>.allowBots`: Überschreibung auf Raumebene für Absender konfigurierte Bots (`true` oder `"mentions"`).
- `groups.<room>.users`: Allowlist von Absendern pro Raum.
- `groups.<room>.tools`: Überschreibungen pro Raum für erlaubte/verweigerte Tools.
- `groups.<room>.autoReply`: Überschreibung der Erwähnungssteuerung auf Raumebene. `true` deaktiviert die Erwähnungsanforderung für diesen Raum; `false` erzwingt sie wieder.
- `groups.<room>.skills`: optionaler Skill-Filter auf Raumebene.
- `groups.<room>.systemPrompt`: optionales System-Prompt-Snippet auf Raumebene.
- `rooms`: Legacy-Alias für `groups`.
- `actions`: Tool-Steuerung pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Steuerung über Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
