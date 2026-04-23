---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Status des Matrix-Supports, Einrichtungs- und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-04-23T14:55:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e9d4d656b47aca2dacb00e591378cb26631afc5b634074bc26e21741b418b47
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix ist ein gebündeltes Channel-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn du eine ältere Build-Version oder eine benutzerdefinierte Installation verwendest, die Matrix ausschließt, installiere
es manuell:

Von npm installieren:

```bash
openclaw plugins install @openclaw/matrix
```

Aus einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Siehe [Plugins](/de/tools/plugin) für das Plugin-Verhalten und Installationsregeln.

## Einrichtung

1. Stelle sicher, dass das Matrix-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstelle ein Matrix-Konto auf deinem Homeserver.
3. Konfiguriere `channels.matrix` mit entweder:
   - `homeserver` + `accessToken`, oder
   - `homeserver` + `userId` + `password`.
4. Starte das Gateway neu.
5. Starte eine DM mit dem Bot oder lade ihn in einen Raum ein.
   - Neue Matrix-Einladungen funktionieren nur, wenn `channels.matrix.autoJoin` sie zulässt.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

Der Matrix-Assistent fragt nach:

- Homeserver-URL
- Authentifizierungsmethode: Access-Token oder Passwort
- Benutzer-ID (nur bei Passwort-Authentifizierung)
- optionaler Gerätename
- ob E2EE aktiviert werden soll
- ob Raumzugriff und automatisches Beitreten bei Einladungen konfiguriert werden sollen

Wichtige Verhaltensweisen des Assistenten:

- Wenn Matrix-Auth-Umgebungsvariablen bereits vorhanden sind und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Umgebungsvariablen-Verknüpfung an, damit die Authentifizierung in Umgebungsvariablen verbleibt.
- Kontonamen werden auf die Konto-ID normalisiert. Zum Beispiel wird `Ops Bot` zu `ops-bot`.
- DM-Allowlist-Einträge akzeptieren direkt `@user:server`; Anzeigenamen funktionieren nur, wenn die Live-Verzeichnissuche genau eine Übereinstimmung findet.
- Raum-Allowlist-Einträge akzeptieren direkt Raum-IDs und Aliase. Bevorzuge `!room:server` oder `#alias:server`; nicht aufgelöste Namen werden zur Laufzeit bei der Allowlist-Auflösung ignoriert.
- Im Allowlist-Modus für automatisches Beitreten bei Einladungen dürfen nur stabile Einladungsziele verwendet werden: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.
- Um Raumnamen vor dem Speichern aufzulösen, verwende `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` hat standardmäßig den Wert `off`.

Wenn du es nicht setzt, tritt der Bot eingeladenen Räumen oder neuen DM-artigen Einladungen nicht bei, sodass er nicht in neuen Gruppen oder eingeladenen DMs erscheint, sofern du ihn nicht zuerst manuell beitreten lässt.

Setze `autoJoin: "allowlist"` zusammen mit `autoJoinAllowlist`, um einzuschränken, welche Einladungen akzeptiert werden, oder setze `autoJoin: "always"`, wenn er jeder Einladung beitreten soll.

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

Matrix speichert zwischengespeicherte Anmeldedaten in `~/.openclaw/credentials/matrix/`.
Das Standardkonto verwendet `credentials.json`; benannte Konten verwenden `credentials-<account>.json`.
Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, betrachtet OpenClaw Matrix für Einrichtung, Doctor und Channel-Status-Erkennung als konfiguriert, auch wenn die aktuelle Authentifizierung nicht direkt in der Konfiguration gesetzt ist.

Entsprechende Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Für Nicht-Standardkonten verwende kontoabhängige Umgebungsvariablen:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Beispiel für das Konto `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Für die normalisierte Konto-ID `ops-bot` verwende:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix escaped Satzzeichen in Konto-IDs, damit kontoabhängige Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, sodass `ops-prod` zu `MATRIX_OPS_X2D_PROD_*` wird.

Der interaktive Assistent bietet die Umgebungsvariablen-Verknüpfung nur an, wenn diese Auth-Umgebungsvariablen bereits vorhanden sind und für das ausgewählte Konto noch keine Matrix-Authentifizierung in der Konfiguration gespeichert ist.

`MATRIX_HOMESERVER` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Konfigurationsbeispiel

Dies ist eine praxistaugliche Basiskonfiguration mit DM-Pairing, Raum-Allowlist und aktiviertem E2EE:

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

`autoJoin` gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen. OpenClaw kann einen eingeladenen Raum zum Zeitpunkt der Einladung nicht zuverlässig
als DM oder Gruppe klassifizieren, daher laufen alle Einladungen zunächst über `autoJoin`.
`dm.policy` wird angewendet, nachdem der Bot beigetreten ist und der Raum als DM klassifiziert wurde.

## Streaming-Vorschauen

Reply-Streaming für Matrix ist Opt-in.

Setze `channels.matrix.streaming` auf `"partial"`, wenn OpenClaw eine einzelne Live-Vorschau-Antwort senden,
diese Vorschau während der Textgenerierung durch das Modell an Ort und Stelle bearbeiten und sie anschließend
abschließen soll, sobald die Antwort fertig ist:

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
- `streaming: "partial"` erstellt für den aktuellen Assistant-Block eine bearbeitbare Vorschau-Nachricht mit normalen Matrix-Textnachrichten. Dadurch bleibt das ältere Matrix-Verhalten „Vorschau zuerst“ für Benachrichtigungen erhalten, sodass Standard-Clients möglicherweise beim ersten gestreamten Vorschautext benachrichtigen statt beim fertigen Block.
- `streaming: "quiet"` erstellt für den aktuellen Assistant-Block eine bearbeitbare leise Vorschau-Mitteilung. Verwende dies nur, wenn du zusätzlich Empfänger-Push-Regeln für abgeschlossene Vorschau-Bearbeitungen konfigurierst.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Wenn Vorschau-Streaming aktiviert ist, behält Matrix den Live-Entwurf für den aktuellen Block bei und erhält abgeschlossene Blöcke als separate Nachrichten.
- Wenn Vorschau-Streaming aktiviert ist und `blockStreaming` deaktiviert ist, bearbeitet Matrix den Live-Entwurf an Ort und Stelle und finalisiert dasselbe Event, wenn der Block oder Turn abgeschlossen ist.
- Wenn die Vorschau nicht mehr in ein einzelnes Matrix-Event passt, beendet OpenClaw das Vorschau-Streaming und greift auf die normale endgültige Zustellung zurück.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie vor dem Senden der endgültigen Medienantwort.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lasse Streaming deaktiviert, wenn du das konservativste Verhalten bei Rate-Limits möchtest.

`blockStreaming` aktiviert für sich allein keine Entwurfs-Vorschauen.
Verwende `streaming: "partial"` oder `streaming: "quiet"` für Vorschau-Bearbeitungen; füge dann `blockStreaming: true` nur hinzu, wenn abgeschlossene Assistant-Blöcke auch als separate Fortschrittsnachrichten sichtbar bleiben sollen.

Wenn du Standard-Matrix-Benachrichtigungen ohne benutzerdefinierte Push-Regeln benötigst, verwende `streaming: "partial"` für das Verhalten „Vorschau zuerst“ oder lasse `streaming` deaktiviert für eine reine Endzustellung. Bei `streaming: "off"` gilt:

- `blockStreaming: true` sendet jeden abgeschlossenen Block als normale benachrichtigende Matrix-Nachricht.
- `blockStreaming: false` sendet nur die endgültige vollständige Antwort als normale benachrichtigende Matrix-Nachricht.

### Selbstgehostete Push-Regeln für leise abgeschlossene Vorschauen

Leises Streaming (`streaming: "quiet"`) benachrichtigt Empfänger erst, wenn ein Block oder Turn abgeschlossen ist — eine benutzerspezifische Push-Regel muss den Marker für abgeschlossene Vorschauen abgleichen. Siehe [Matrix-Push-Regeln für leise Vorschauen](/de/channels/matrix-push-rules) für die vollständige Einrichtung (Empfänger-Token, Pusher-Prüfung, Regelinstallation, Hinweise pro Homeserver).

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwende `allowBots`, wenn du absichtlich Matrix-Datenverkehr zwischen Agents zulassen möchtest:

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
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur, wenn sie diesen Bot sichtbar erwähnen. DMs sind weiterhin erlaubt.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Schleifen durch Selbstantworten zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von einem Bot verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwende strikte Raum-Allowlists und Erwähnungsanforderungen, wenn du Bot-zu-Bot-Datenverkehr in gemeinsam genutzten Räumen aktivierst.

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

Verifizierungsbefehle (alle unterstützen `--verbose` für Diagnoseausgaben und `--json` für maschinenlesbare Ausgabe):

| Befehl                                                        | Zweck                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                               | Cross-Signing- und Geräteverifizierungsstatus prüfen                                |
| `openclaw matrix verify status --include-recovery-key --json` | Den gespeicherten Wiederherstellungsschlüssel einbeziehen                           |
| `openclaw matrix verify bootstrap`                            | Cross-Signing und Verifizierung bootstrapen (siehe unten)                           |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Die aktuelle Cross-Signing-Identität verwerfen und eine neue erstellen             |
| `openclaw matrix verify device "<recovery-key>"`              | Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren                     |
| `openclaw matrix verify backup status`                        | Zustand der Raumschlüssel-Sicherung prüfen                                          |
| `openclaw matrix verify backup restore`                       | Raumschlüssel aus der Serversicherung wiederherstellen                              |
| `openclaw matrix verify backup reset --yes`                   | Die aktuelle Sicherung löschen und eine neue Ausgangsbasis erstellen (kann Secret Storage neu erstellen) |

In Multi-Account-Setups verwenden Matrix-CLI-Befehle implizit das Matrix-Standardkonto, sofern du nicht `--account <id>` übergibst.
Wenn du mehrere benannte Konten konfigurierst, setze zuerst `channels.matrix.defaultAccount`, sonst werden diese impliziten CLI-Operationen angehalten und fordern dich auf, ein Konto explizit auszuwählen.
Verwende `--account`, wenn Verifizierungs- oder Geräteoperationen explizit auf ein benanntes Konto zielen sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Was verifiziert bedeutet">
    OpenClaw betrachtet ein Gerät nur dann als verifiziert, wenn deine eigene Cross-Signing-Identität es signiert. `verify status --verbose` zeigt drei Vertrauenssignale:

    - `Locally trusted`: nur von diesem Client als vertrauenswürdig eingestuft
    - `Cross-signing verified`: das SDK meldet Verifizierung über Cross-Signing
    - `Signed by owner`: von deinem eigenen Self-Signing-Schlüssel signiert

    `Verified by owner` wird nur dann zu `yes`, wenn Cross-Signing oder Owner-Signing vorhanden ist. Lokales Vertrauen allein reicht nicht aus.

  </Accordion>

  <Accordion title="Was bootstrap bewirkt">
    `verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Konten. Der Reihe nach:

    - bootstrapped Secret Storage und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel wieder
    - bootstrapped Cross-Signing und lädt fehlende öffentliche Cross-Signing-Schlüssel hoch
    - markiert und cross-signiert das aktuelle Gerät
    - erstellt eine serverseitige Raumschlüssel-Sicherung, falls noch keine vorhanden ist

    Wenn der Homeserver UIA zum Hochladen von Cross-Signing-Schlüsseln verlangt, versucht OpenClaw zuerst ohne Authentifizierung, dann `m.login.dummy`, dann `m.login.password` (erfordert `channels.matrix.password`). Verwende `--force-reset-cross-signing` nur, wenn du die aktuelle Identität absichtlich verwerfen willst.

  </Accordion>

  <Accordion title="Neue Ausgangsbasis für Sicherungen">
    Wenn du möchtest, dass zukünftige verschlüsselte Nachrichten weiter funktionieren und akzeptierst, dass nicht wiederherstellbarer alter Verlauf verloren geht:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Füge `--account <id>` hinzu, um ein benanntes Konto als Ziel zu verwenden. Dabei kann auch Secret Storage neu erstellt werden, wenn das aktuelle Sicherungsgeheimnis nicht sicher geladen werden kann.

  </Accordion>

  <Accordion title="Startverhalten">
    Mit `encryption: true` ist `startupVerification` standardmäßig `"if-unverified"`. Beim Start fordert ein nicht verifiziertes Gerät die Selbstverifizierung in einem anderen Matrix-Client an, überspringt Duplikate und wendet eine Abkühlzeit an. Passe dies mit `startupVerificationCooldownHours` an oder deaktiviere es mit `startupVerification: "off"`.

    Beim Start wird außerdem ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt, der die aktuelle Secret Storage und die aktuelle Cross-Signing-Identität wiederverwendet. Wenn der Bootstrap-Status fehlerhaft ist, versucht OpenClaw eine geschützte Reparatur auch ohne `channels.matrix.password`; wenn der Homeserver Passwort-UIA verlangt, protokolliert der Start eine Warnung und bleibt nicht fatal. Bereits vom Owner signierte Geräte bleiben erhalten.

    Siehe [Matrix migration](/de/install/migrating-matrix) für den vollständigen Upgrade-Ablauf.

  </Accordion>

  <Accordion title="Verifizierungshinweise">
    Matrix veröffentlicht Hinweise zum Verifizierungslebenszyklus im strikten DM-Verifizierungsraum als `m.notice`-Nachrichten: Anfrage, bereit (mit Hinweis „Verify by emoji“), Start/Abschluss und SAS-Details (Emoji/Dezimal), wenn verfügbar.

    Eingehende Anfragen von einem anderen Matrix-Client werden verfolgt und automatisch akzeptiert. Bei Selbstverifizierung startet OpenClaw den SAS-Ablauf automatisch und bestätigt seine eigene Seite, sobald die Emoji-Verifizierung verfügbar ist — du musst aber weiterhin in deinem Matrix-Client vergleichen und „They match“ bestätigen.

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
    Matrix-E2EE verwendet den offiziellen Rust-Crypto-Pfad von `matrix-js-sdk` mit `fake-indexeddb` als IndexedDB-Shim. Der Crypto-Status wird in `crypto-idb-snapshot.json` persistiert (mit restriktiven Dateiberechtigungen).

    Der verschlüsselte Laufzeitstatus liegt unter `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` und umfasst den Sync-Store, den Crypto-Store, den Wiederherstellungsschlüssel, den IDB-Snapshot, Thread-Bindungen und den Startverifizierungsstatus. Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw das beste vorhandene Root erneut, damit der bisherige Status sichtbar bleibt.

  </Accordion>
</AccordionGroup>

## Profilverwaltung

Aktualisiere das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Füge `--account <id>` hinzu, wenn du explizit ein benanntes Matrix-Konto als Ziel verwenden möchtest.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn du eine `http://`- oder `https://`-Avatar-URL übergibst, lädt OpenClaw sie zuerst zu Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder in die ausgewählte Konto-Überschreibung).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sendungen über Message-Tools.

- `dm.sessionScope: "per-user"` (Standard) hält Matrix-DM-Routing absenderbezogen, sodass mehrere DM-Räume eine Sitzung gemeinsam nutzen können, wenn sie zum selben Peer aufgelöst werden.
- `dm.sessionScope: "per-room"` isoliert jeden Matrix-DM-Raum in seinen eigenen Sitzungsschlüssel, verwendet aber weiterhin normale DM-Authentifizierungs- und Allowlist-Prüfungen.
- Explizite Matrix-Konversationsbindungen haben weiterhin Vorrang vor `dm.sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung beibehalten.
- `threadReplies: "off"` hält Antworten auf Top-Level-Ebene und belässt eingehende Thread-Nachrichten in der Parent-Sitzung.
- `threadReplies: "inbound"` antwortet innerhalb eines Threads nur dann, wenn die eingehende Nachricht bereits in diesem Thread war.
- `threadReplies: "always"` hält Raumantworten in einem Thread, der an der auslösenden Nachricht verankert ist, und leitet diese Konversation ab der ersten auslösenden Nachricht über die passende threadbezogene Sitzung.
- `dm.threadReplies` überschreibt die Top-Level-Einstellung nur für DMs. So kannst du zum Beispiel Raum-Threads isoliert halten und DMs flach halten.
- Eingehende Thread-Nachrichten enthalten die Thread-Root-Nachricht als zusätzlichen Agent-Kontext.
- Sendungen über Message-Tools übernehmen den aktuellen Matrix-Thread automatisch, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern keine explizite `threadId` angegeben wird.
- Die Wiederverwendung desselben sitzungsbezogenen DM-Benutzerziels greift nur, wenn die Metadaten der aktuellen Sitzung denselben DM-Peer auf demselben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsam genutzten Matrix-DM-Sitzung kollidiert, veröffentlicht es einmalig ein `m.notice` in diesem Raum mit dem `/focus`-Escape-Hatch, wenn Thread-Bindungen aktiviert sind und dem Hinweis `dm.sessionScope`.
- Laufzeit-Thread-Bindungen werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren in Matrix-Räumen und DMs.
- Top-Level-`/focus` in einem Matrix-Raum oder einer DM erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Das Ausführen von `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads bindet stattdessen diesen aktuellen Thread.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche verwandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führe `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des bestehenden Threads aus, den du weiterverwenden möchtest.
- In einer Matrix-DM oder einem Raum auf Top-Level-Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung geleitet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread direkt.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Thread-Bindungs-Konfiguration

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt auch channelbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Threadgebundene Spawn-Flags für Matrix sind Opt-in:

- Setze `threadBindings.spawnSubagentSessions: true`, damit Top-Level-`/focus` neue Matrix-Threads erstellen und binden darf.
- Setze `threadBindings.spawnAcpSessions: true`, damit `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads binden darf.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Ack-Reaktionen.

- Tooling für ausgehende Reaktionen wird durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Event eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Event auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf dieses Event.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bot-Kontos.

Der Geltungsbereich von Ack-Reaktionen wird in der Standard-Reihenfolge von OpenClaw aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Fallback auf das Agent-Identity-Emoji

Der Scope von Ack-Reaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Der Modus für Reaktionsbenachrichtigungen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- Standard: `own`

Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Events weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten zielen.
- `reactionNotifications: "off"` deaktiviert Reaktions-System-Events.
- Das Entfernen von Reaktionen wird nicht in System-Events synthetisiert, da Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setze `0`, um dies zu deaktivieren.
- Der Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Matrix-Raumverlauf ist nur für ausstehende Nachrichten: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle Auslösernachricht ist nicht in `InboundHistory` enthalten; sie bleibt für diesen Turn im Hauptteil der eingehenden Nachricht.
- Wiederholungen desselben Matrix-Events verwenden den ursprünglichen Verlaufssnapshot erneut, statt auf neuere Raumnachrichten vorzurücken.

## Kontextsichtigkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Roots und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext bleibt unverändert erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber dennoch eine explizit zitierte Antwort.

Diese Einstellung wirkt sich auf die Sichtbarkeit ergänzenden Kontexts aus, nicht darauf, ob die eingehende Nachricht selbst eine Antwort auslösen darf.
Die Autorisierung für Auslöser kommt weiterhin aus `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Siehe [Groups](/de/channels/groups) für Verhalten bei Erwähnungs-Gating und Allowlist.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn dir ein nicht genehmigter Matrix-Benutzer vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und sendet nach einer kurzen Abkühlzeit möglicherweise erneut eine Erinnerungsantwort, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Status von Direktnachrichten aus dem Takt gerät, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Einzelräume statt auf die aktive DM verweisen. Prüfe die aktuelle Zuordnung für einen Peer mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repariere sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt auf jede aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine gesunde DM existiert

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die gesunde DM aus und aktualisiert die Zuordnung, sodass neue Matrix-Sendungen, Verifizierungshinweise und andere Direktnachrichten-Abläufe wieder auf den richtigen Raum zielen.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungs-Client für ein Matrix-Konto fungieren. Die nativen
DM-/Channel-Routing-Schalter liegen weiterhin unter der Exec-Genehmigungskonfiguration:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; fällt auf `channels.matrix.dm.allowFrom` zurück)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Genehmigende müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmigender aufgelöst werden kann. Exec-Genehmigungen verwenden zuerst `execApprovals.approvers` und können auf `channels.matrix.dm.allowFrom` zurückfallen. Plugin-Genehmigungen autorisieren über `channels.matrix.dm.allowFrom`. Setze `enabled: false`, um Matrix explizit als nativen Genehmigungs-Client zu deaktivieren. Genehmigungsanfragen fallen andernfalls auf andere konfigurierte Genehmigungswege oder die Fallback-Richtlinie für Genehmigungen zurück.

Matrix-Native-Routing unterstützt beide Genehmigungsarten:

- `channels.matrix.execApprovals.*` steuert den nativen DM-/Channel-Fanout-Modus für Matrix-Genehmigungsaufforderungen.
- Exec-Genehmigungen verwenden die Exec-Genehmigenden aus `execApprovals.approvers` oder `channels.matrix.dm.allowFrom`.
- Plugin-Genehmigungen verwenden die Matrix-DM-Allowlist aus `channels.matrix.dm.allowFrom`.
- Matrix-Reaktionskürzel und Nachrichtenaktualisierungen gelten sowohl für Exec- als auch für Plugin-Genehmigungen.

Zustellungsregeln:

- `target: "dm"` sendet Genehmigungsaufforderungen an DMs der Genehmigenden
- `target: "channel"` sendet die Aufforderung zurück an den auslösenden Matrix-Raum oder die DM
- `target: "both"` sendet an DMs der Genehmigenden und an den auslösenden Matrix-Raum oder die DM

Matrix-Genehmigungsaufforderungen setzen Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` = einmal erlauben
- `❌` = ablehnen
- `♾️` = immer erlauben, wenn diese Entscheidung durch die effektive Exec-Richtlinie zulässig ist

Genehmigende können auf diese Nachricht reagieren oder die Fallback-Slash-Befehle verwenden: `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny`.

Nur aufgelöste Genehmigende können genehmigen oder ablehnen. Bei Exec-Genehmigungen umfasst die Channel-Zustellung den Befehlstext, daher solltest du `channel` oder `both` nur in vertrauenswürdigen Räumen aktivieren.

Kontoabhängige Überschreibung:

- `channels.matrix.accounts.<account>.execApprovals`

Verwandte Dokumentation: [Exec approvals](/de/tools/exec-approvals)

## Slash-Befehle

Matrix-Slash-Befehle (zum Beispiel `/new`, `/reset`, `/model`) funktionieren direkt in DMs. In Räumen erkennt OpenClaw zusätzlich Slash-Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad auslöst, ohne dass ein benutzerdefinierter Erwähnungs-Regex erforderlich ist. So bleibt der Bot reaktionsfähig auf raumtypische Beiträge im Stil `@mention /command`, die Element und ähnliche Clients senden, wenn ein Benutzer den Bot per Tab-Vervollständigung auswählt, bevor er den Befehl eintippt.

Autorisierungsregeln gelten weiterhin: Befehlssender müssen genau wie bei normalen Nachrichten die DM- oder Raum-Allowlist-/Owner-Richtlinien erfüllen.

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

Top-Level-Werte unter `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
Du kannst geerbte Raumeinträge mit `groups.<room>.account` auf ein Matrix-Konto begrenzen.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam genutzt, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf Top-Level unter `channels.matrix.*` konfiguriert ist.
Partielle gemeinsame Auth-Standardwerte erzeugen für sich genommen kein separates implizites Standardkonto. OpenClaw synthetisiert das Top-Level-Konto `default` nur dann, wenn dieses Standardkonto frische Authentifizierung hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können dennoch über `homeserver` plus `userId` auffindbar bleiben, wenn zwischengespeicherte Anmeldedaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen benannten Kontoschlüssel verweist, bewahrt die Reparatur-/Einrichtungs-Promotion von Einzelkonto zu Multi-Account dieses Konto, statt einen neuen Eintrag `accounts.default` zu erstellen. Nur Matrix-Auth-/Bootstrap-Schlüssel werden in dieses hochgestufte Konto verschoben; gemeinsame Zustellungsrichtlinien-Schlüssel bleiben auf der obersten Ebene.
Setze `defaultAccount`, wenn OpenClaw für implizites Routing, Probing und CLI-Operationen ein benanntes Matrix-Konto bevorzugen soll.
Wenn mehrere Matrix-Konten konfiguriert sind und eine Konto-ID `default` ist, verwendet OpenClaw dieses Konto implizit auch dann, wenn `defaultAccount` nicht gesetzt ist.
Wenn du mehrere benannte Konten konfigurierst, setze `defaultAccount` oder übergib `--account <id>` für CLI-Befehle, die auf impliziter Kontoauswahl beruhen.
Übergebe `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn du diese implizite Auswahl für einen einzelnen Befehl überschreiben möchtest.

Siehe [Configuration reference](/de/gateway/configuration-reference#multi-account-all-channels) für das gemeinsame Multi-Account-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum Schutz vor SSRF, sofern du
nicht explizit pro Konto zustimmst.

Wenn dein Homeserver auf localhost, einer LAN-/Tailscale-IP oder einem internen Hostnamen läuft, aktiviere
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

Dieses Opt-in erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche Homeserver mit Klartext wie
`http://matrix.example.org:8008` bleiben blockiert. Bevorzuge nach Möglichkeit `https://`.

## Matrix-Datenverkehr über Proxy leiten

Wenn deine Matrix-Bereitstellung einen expliziten ausgehenden HTTP(S)-Proxy benötigt, setze `channels.matrix.proxy`:

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

Benannte Konten können den Top-Level-Standard mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für laufenden Matrix-Datenverkehr und Prüfungen des Kontostatus.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw dich nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliase: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Die Live-Verzeichnisauflösung verwendet das angemeldete Matrix-Konto:

- Benutzerabfragen durchsuchen das Matrix-Benutzerverzeichnis auf diesem Homeserver.
- Raumabfragen akzeptieren explizite Raum-IDs und Aliase direkt und fallen dann auf die Suche nach beigetretenen Raumnamen für dieses Konto zurück.
- Die Suche nach Namen beigetretener Räume ist Best-Effort. Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er bei der Laufzeit-Auflösung der Allowlist ignoriert.

## Konfigurationsreferenz

- `enabled`: den Channel aktivieren oder deaktivieren.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Matrix-Konto erlauben, sich mit privaten/internen Homeservern zu verbinden. Aktiviere dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Benannte Konten können den Top-Level-Standard mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Access-Token für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` bei env-/file-/exec-Providern unterstützt. Siehe [Secrets Management](/de/gateway/secrets).
- `password`: Passwort für passwortbasierte Anmeldung. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts für die Passwort-Anmeldung.
- `avatarUrl`: gespeicherte Self-Avatar-URL für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl an Events, die beim Startup-Sync abgerufen werden.
- `encryption`: E2EE aktivieren.
- `allowlistOnly`: wenn `true`, wird die Raumrichtlinie `open` auf `allowlist` hochgestuft und alle aktiven DM-Richtlinien außer `disabled` (einschließlich `pairing` und `open`) werden zu `allowlist` erzwungen. Hat keine Auswirkung auf `disabled`-Richtlinien.
- `allowBots`: Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten zulassen (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumdatenverkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnisübereinstimmungen werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `historyLimit`: maximale Anzahl an Raumnachrichten, die als Gruppenverlaufs-Kontext einbezogen werden. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setze `0`, um dies zu deaktivieren.
- `replyToMode`: `off`, `first`, `all` oder `batched`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `"partial"`, `"quiet"`, `true` oder `false`. `"partial"` und `true` aktivieren Vorschau-zuerst-Entwurfsaktualisierungen mit normalen Matrix-Textnachrichten. `"quiet"` verwendet nicht benachrichtigende Vorschau-Hinweise für selbstgehostete Push-Regel-Setups. `false` entspricht `"off"`.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistant-Blöcke, während Entwurfs-Vorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: channelbezogene Überschreibungen für threadgebundenes Sitzungsrouting und dessen Lebenszyklus.
- `startupVerification`: Modus für automatische Selbstverifizierungsanfragen beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Abkühlzeit vor erneutem Versuch automatischer Startverifizierungsanfragen.
- `textChunkLimit`: Größe ausgehender Nachrichten-Chunks in Zeichen (gilt, wenn `chunkMode` auf `length` steht).
- `chunkMode`: `length` teilt Nachrichten nach Zeichenanzahl; `newline` teilt an Zeilengrenzen.
- `responsePrefix`: optionale Zeichenfolge, die allen ausgehenden Antworten für diesen Channel vorangestellt wird.
- `ackReaction`: optionale Überschreibung der Ack-Reaktion für diesen Channel/dieses Konto.
- `ackReactionScope`: optionale Überschreibung des Ack-Reaktionsbereichs (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Obergrenze für Mediengröße in MB für ausgehende Sendungen und eingehende Medienverarbeitung.
- `autoJoin`: Richtlinie für automatisches Beitreten bei Einladungen (`always`, `allowlist`, `off`). Standard: `off`. Gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliase, die zulässig sind, wenn `autoJoin` auf `allowlist` steht. Alias-Einträge werden bei der Einladungsverarbeitung zu Raum-IDs aufgelöst; OpenClaw vertraut nicht dem Alias-Status, den der eingeladene Raum behauptet.
- `dm`: DM-Richtlinienblock (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: steuert den DM-Zugriff, nachdem OpenClaw dem Raum beigetreten ist und ihn als DM klassifiziert hat. Ändert nicht, ob einer Einladung automatisch beigetreten wird.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Datenverkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnisübereinstimmungen werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `dm.sessionScope`: `per-user` (Standard) oder `per-room`. Verwende `per-room`, wenn jeder Matrix-DM-Raum einen separaten Kontext behalten soll, selbst wenn es derselbe Peer ist.
- `dm.threadReplies`: DM-spezifische Überschreibung der Thread-Richtlinie (`off`, `inbound`, `always`). Überschreibt die Top-Level-Einstellung `threadReplies` sowohl für die Platzierung von Antworten als auch für die Sitzungsisolierung in DMs.
- `execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die Genehmigenden bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte kontoabhängige Überschreibungen. Top-Level-Werte unter `channels.matrix` dienen als Standardwerte für diese Einträge.
- `groups`: richtlinienbezogene Zuordnung pro Raum. Bevorzuge Raum-IDs oder Aliase; nicht aufgelöste Raumnamen werden zur Laufzeit ignoriert. Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID.
- `groups.<room>.account`: einen geerbten Raumeintrag in Multi-Account-Setups auf ein bestimmtes Matrix-Konto beschränken.
- `groups.<room>.allowBots`: raumbezogene Überschreibung für Sender aus konfigurierten Bots (`true` oder `"mentions"`).
- `groups.<room>.users`: senderbezogene Allowlist pro Raum.
- `groups.<room>.tools`: raumbezogene Tool-Allow-/Deny-Überschreibungen.
- `groups.<room>.autoReply`: raumbezogene Überschreibung für Erwähnungs-Gating. `true` deaktiviert die Erwähnungsanforderungen für diesen Raum; `false` erzwingt sie wieder.
- `groups.<room>.skills`: optionaler raumbezogener Skills-Filter.
- `groups.<room>.systemPrompt`: optionales raumbezogenes System-Prompt-Snippet.
- `rooms`: Legacy-Alias für `groups`.
- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
