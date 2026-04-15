---
read_when:
    - Matrix in OpenClaw einrichten
    - Matrix-E2EE und Verifizierung konfigurieren
summary: Matrix-Unterstützungsstatus, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-04-15T19:41:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd730bb9d0c8a548ee48b20931b3222e9aa1e6e95f1390b0c236645e03f3576d
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix ist ein gebündeltes Channel-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher
benötigen normale paketierte Builds keine separate Installation.

Wenn du einen älteren Build oder eine benutzerdefinierte Installation verwendest, die Matrix ausschließt, installiere
es manuell:

Von npm installieren:

```bash
openclaw plugins install @openclaw/matrix
```

Aus einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Siehe [Plugins](/de/tools/plugin) für Plugin-Verhalten und Installationsregeln.

## Einrichtung

1. Stelle sicher, dass das Matrix-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
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
- Authentifizierungsmethode: Access Token oder Passwort
- Benutzer-ID (nur bei Passwort-Authentifizierung)
- optionaler Gerätename
- ob E2EE aktiviert werden soll
- ob Raumzugriff und automatisches Beitreten zu Einladungen konfiguriert werden sollen

Wichtige Verhaltensweisen des Assistenten:

- Wenn Matrix-Auth-Umgebungsvariablen bereits vorhanden sind und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Umgebungsvariablen-Verknüpfung an, um die Authentifizierung in Umgebungsvariablen zu belassen.
- Kontonamen werden zur Konto-ID normalisiert. Zum Beispiel wird `Ops Bot` zu `ops-bot`.
- DM-Allowlist-Einträge akzeptieren `@user:server` direkt; Anzeigenamen funktionieren nur, wenn die Live-Verzeichnissuche genau einen Treffer findet.
- Raum-Allowlist-Einträge akzeptieren Raum-IDs und Aliase direkt. Bevorzuge `!room:server` oder `#alias:server`; nicht aufgelöste Namen werden zur Laufzeit von der Allowlist-Auflösung ignoriert.
- Im Allowlist-Modus für automatisches Beitreten zu Einladungen nur stabile Einladungsziele verwenden: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.
- Um Raumnamen vor dem Speichern aufzulösen, verwende `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` ist standardmäßig auf `off` gesetzt.

Wenn du es nicht setzt, tritt der Bot eingeladenen Räumen oder neuen DM-ähnlichen Einladungen nicht bei und erscheint daher nicht in neuen Gruppen oder eingeladenen DMs, es sei denn, du trittst zuerst manuell bei.

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
Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, behandelt OpenClaw Matrix für Setup, doctor und Channel-Status-Erkennung als konfiguriert, auch wenn die aktuelle Authentifizierung nicht direkt in der Konfiguration gesetzt ist.

Äquivalente Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

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

Matrix maskiert Satzzeichen in Konto-IDs, damit kontoabhängige Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, daher wird `ops-prod` zu `MATRIX_OPS_X2D_PROD_*`.

Der interaktive Assistent bietet die Umgebungsvariablen-Verknüpfung nur an, wenn diese Auth-Umgebungsvariablen bereits vorhanden sind und für das ausgewählte Konto noch keine Matrix-Authentifizierung in der Konfiguration gespeichert ist.

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

`autoJoin` gilt für alle Matrix-Einladungen, einschließlich DM-ähnlicher Einladungen. OpenClaw kann einen
eingeladenen Raum zum Zeitpunkt der Einladung nicht zuverlässig als DM oder Gruppe
klassifizieren, daher laufen alle Einladungen zuerst über `autoJoin`.
`dm.policy` wird angewendet, nachdem der Bot beigetreten ist und der Raum als DM klassifiziert wurde.

## Streaming-Vorschauen

Reply-Streaming für Matrix ist optional.

Setze `channels.matrix.streaming` auf `"partial"`, wenn OpenClaw eine einzelne Live-Vorschau-Antwort senden,
diese Vorschau während der Textgenerierung durch das Modell an Ort und Stelle bearbeiten und sie dann abschließen soll, wenn die
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

- `streaming: "off"` ist die Standardeinstellung. OpenClaw wartet auf die endgültige Antwort und sendet sie einmal.
- `streaming: "partial"` erstellt eine bearbeitbare Vorschau-Nachricht für den aktuellen Assistentenblock mit normalen Matrix-Textnachrichten. Dadurch bleibt das ältere benachrichtigungsorientierte Vorschau-zuerst-Verhalten von Matrix erhalten, sodass Standard-Clients möglicherweise beim ersten gestreamten Vorschautext statt beim fertigen Block benachrichtigen.
- `streaming: "quiet"` erstellt einen bearbeitbaren unauffälligen Vorschauhinweis für den aktuellen Assistentenblock. Verwende dies nur, wenn du zusätzlich Push-Regeln für Empfänger für abgeschlossene Vorschau-Bearbeitungen konfigurierst.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Wenn Vorschau-Streaming aktiviert ist, behält Matrix den Live-Entwurf für den aktuellen Block bei und lässt abgeschlossene Blöcke als separate Nachrichten bestehen.
- Wenn Vorschau-Streaming aktiviert und `blockStreaming` deaktiviert ist, bearbeitet Matrix den Live-Entwurf an Ort und Stelle und schließt dasselbe Ereignis ab, wenn der Block oder Turn endet.
- Wenn die Vorschau nicht mehr in ein einzelnes Matrix-Ereignis passt, beendet OpenClaw das Vorschau-Streaming und fällt auf normale endgültige Zustellung zurück.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, entfernt OpenClaw sie vor dem Senden der endgültigen Medienantwort.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lasse Streaming deaktiviert, wenn du das konservativste Rate-Limit-Verhalten möchtest.

`blockStreaming` aktiviert Entwurfsvorschauen nicht von selbst.
Verwende `streaming: "partial"` oder `streaming: "quiet"` für Vorschau-Bearbeitungen; füge dann `blockStreaming: true` nur hinzu, wenn du außerdem möchtest, dass abgeschlossene Assistentenblöcke als separate Fortschrittsnachrichten sichtbar bleiben.

Wenn du Matrix-Standardbenachrichtigungen ohne benutzerdefinierte Push-Regeln benötigst, verwende `streaming: "partial"` für Vorschau-zuerst-Verhalten oder lasse `streaming` deaktiviert, um nur endgültige Zustellung zu erhalten. Mit `streaming: "off"`:

- `blockStreaming: true` sendet jeden abgeschlossenen Block als normale benachrichtigende Matrix-Nachricht.
- `blockStreaming: false` sendet nur die endgültige abgeschlossene Antwort als normale benachrichtigende Matrix-Nachricht.

### Selbstgehostete Push-Regeln für unauffällige abgeschlossene Vorschauen

Wenn du deine eigene Matrix-Infrastruktur betreibst und unauffällige Vorschauen nur dann benachrichtigen sollen, wenn ein Block oder eine
endgültige Antwort abgeschlossen ist, setze `streaming: "quiet"` und füge eine benutzerspezifische Push-Regel für abgeschlossene Vorschau-Bearbeitungen hinzu.

Dies ist normalerweise eine Einrichtung pro Empfängerbenutzer, keine globale Konfigurationsänderung des Homeservers:

Kurzübersicht, bevor du beginnst:

- Empfängerbenutzer = die Person, die die Benachrichtigung erhalten soll
- Bot-Benutzer = das OpenClaw-Matrix-Konto, das die Antwort sendet
- verwende für die folgenden API-Aufrufe das Access Token des Empfängerbenutzers
- gleiche `sender` in der Push-Regel mit der vollständigen MXID des Bot-Benutzers ab

1. Konfiguriere OpenClaw so, dass unauffällige Vorschauen verwendet werden:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Stelle sicher, dass das Empfängerkonto bereits normale Matrix-Push-Benachrichtigungen erhält. Regeln für unauffällige Vorschauen
   funktionieren nur, wenn dieser Benutzer bereits funktionierende Pusher/Geräte hat.

3. Hole das Access Token des Empfängerbenutzers.
   - Verwende das Token des empfangenden Benutzers, nicht das Token des Bots.
   - Die Wiederverwendung eines vorhandenen Client-Sitzungstokens ist normalerweise am einfachsten.
   - Wenn du ein neues Token erzeugen musst, kannst du dich über die Standard-Matrix-Client-Server-API anmelden:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Verifiziere, dass das Empfängerkonto bereits Pusher hat:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Wenn dies keine aktiven Pusher/Geräte zurückgibt, behebe zuerst normale Matrix-Benachrichtigungen, bevor du die
untenstehende OpenClaw-Regel hinzufügst.

OpenClaw markiert abgeschlossene Vorschau-Bearbeitungen nur mit Text mit:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Erstelle für jedes Empfängerkonto, das diese Benachrichtigungen erhalten soll, eine Override-Push-Regel:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Ersetze diese Werte, bevor du den Befehl ausführst:

- `https://matrix.example.org`: die Basis-URL deines Homeservers
- `$USER_ACCESS_TOKEN`: das Access Token des empfangenden Benutzers
- `openclaw-finalized-preview-botname`: eine Regel-ID, die für diesen Bot bei diesem empfangenden Benutzer eindeutig ist
- `@bot:example.org`: die MXID deines OpenClaw-Matrix-Bots, nicht die MXID des empfangenden Benutzers

Wichtig für Setups mit mehreren Bots:

- Push-Regeln werden über `ruleId` referenziert. Ein erneutes `PUT` mit derselben Regel-ID aktualisiert diese eine Regel.
- Wenn ein empfangender Benutzer für mehrere OpenClaw-Matrix-Bot-Konten benachrichtigt werden soll, erstelle eine Regel pro Bot mit einer eindeutigen Regel-ID für jede `sender`-Übereinstimmung.
- Ein einfaches Muster ist `openclaw-finalized-preview-<botname>`, zum Beispiel `openclaw-finalized-preview-ops` oder `openclaw-finalized-preview-support`.

Die Regel wird gegen den Ereignisabsender ausgewertet:

- authentifiziere dich mit dem Token des empfangenden Benutzers
- gleiche `sender` mit der MXID des OpenClaw-Bots ab

6. Verifiziere, dass die Regel existiert:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Teste eine gestreamte Antwort. Im leisen Modus sollte der Raum eine leise Entwurfsvorschau anzeigen und die endgültige
   Bearbeitung an Ort und Stelle sollte benachrichtigen, sobald der Block oder Turn abgeschlossen ist.

Wenn du die Regel später entfernen musst, lösche dieselbe Regel-ID mit dem Token des empfangenden Benutzers:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Hinweise:

- Erstelle die Regel mit dem Access Token des empfangenden Benutzers, nicht mit dem Token des Bots.
- Neue benutzerdefinierte `override`-Regeln werden vor den standardmäßigen Unterdrückungsregeln eingefügt, daher ist kein zusätzlicher Reihenfolgeparameter erforderlich.
- Dies betrifft nur Vorschau-Bearbeitungen nur mit Text, die OpenClaw sicher an Ort und Stelle abschließen kann. Medien-Fallbacks und Fallbacks für veraltete Vorschauen verwenden weiterhin die normale Matrix-Zustellung.
- Wenn `GET /_matrix/client/v3/pushers` keine Pusher anzeigt, hat der Benutzer für dieses Konto/Gerät noch keine funktionierende Matrix-Push-Zustellung.

#### Synapse

Für Synapse reicht die obige Einrichtung normalerweise bereits aus:

- Es ist keine spezielle Änderung an `homeserver.yaml` für abgeschlossene OpenClaw-Vorschau-Benachrichtigungen erforderlich.
- Wenn deine Synapse-Bereitstellung bereits normale Matrix-Push-Benachrichtigungen sendet, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn du Synapse hinter einem Reverse-Proxy oder mit Workern betreibst, stelle sicher, dass `/_matrix/client/.../pushrules/` Synapse korrekt erreicht.
- Wenn du Synapse-Worker betreibst, stelle sicher, dass die Pusher fehlerfrei arbeiten. Die Push-Zustellung wird vom Hauptprozess oder von `synapse.app.pusher` / konfigurierten Pusher-Workern übernommen.

#### Tuwunel

Für Tuwunel verwende denselben Einrichtungsablauf und denselben oben gezeigten `pushrules`-API-Aufruf:

- Für die Markierung der abgeschlossenen Vorschau selbst ist keine Tuwunel-spezifische Konfiguration erforderlich.
- Wenn normale Matrix-Benachrichtigungen für diesen Benutzer bereits funktionieren, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn Benachrichtigungen zu verschwinden scheinen, während der Benutzer auf einem anderen Gerät aktiv ist, prüfe, ob `suppress_push_when_active` aktiviert ist. Tuwunel hat diese Option in Tuwunel 1.4.2 am 12. September 2025 hinzugefügt, und sie kann Pushes an andere Geräte absichtlich unterdrücken, während ein Gerät aktiv ist.

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwende `allowBots`, wenn du absichtlich Matrix-Verkehr zwischen Agents möchtest:

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
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur dann, wenn sie diesen Bot sichtbar erwähnen. DMs sind weiterhin erlaubt.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen einzelnen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Schleifen durch Selbstantworten zu vermeiden.
- Matrix bietet hier kein natives Bot-Flag; OpenClaw behandelt „von Bots verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwende strikte Raum-Allowlists und Erwähnungspflichten, wenn du Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivierst.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

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

Ausführlicher Status (vollständige Diagnosen):

```bash
openclaw matrix verify status --verbose
```

Den gespeicherten Wiederherstellungsschlüssel in maschinenlesbarer Ausgabe einbeziehen:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-Signing- und Verifizierungsstatus initialisieren:

```bash
openclaw matrix verify bootstrap
```

Ausführliche Bootstrap-Diagnosen:

```bash
openclaw matrix verify bootstrap --verbose
```

Vor dem Bootstrap ein vollständiges Zurücksetzen der Cross-Signing-Identität erzwingen:

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

Ausführliche Diagnosen zur Backup-Integrität:

```bash
openclaw matrix verify backup status --verbose
```

Raumschlüssel aus dem Server-Backup wiederherstellen:

```bash
openclaw matrix verify backup restore
```

Ausführliche Diagnosen zur Wiederherstellung:

```bash
openclaw matrix verify backup restore --verbose
```

Das aktuelle Server-Backup löschen und eine neue Backup-Basis erstellen. Wenn der gespeicherte
Backup-Schlüssel nicht sauber geladen werden kann, kann dieses Zurücksetzen auch den Secret Storage neu erstellen, damit
zukünftige Kaltstarts den neuen Backup-Schlüssel laden können:

```bash
openclaw matrix verify backup reset --yes
```

Alle `verify`-Befehle sind standardmäßig knapp gehalten (einschließlich stiller interner SDK-Protokollierung) und zeigen ausführliche Diagnosen nur mit `--verbose`.
Verwende `--json` für vollständige maschinenlesbare Ausgabe in Skripten.

In Multi-Account-Setups verwenden Matrix-CLI-Befehle implizit das Matrix-Standardkonto, sofern du nicht `--account <id>` übergibst.
Wenn du mehrere benannte Konten konfigurierst, setze zuerst `channels.matrix.defaultAccount`, sonst werden diese impliziten CLI-Operationen angehalten und fordern dich auf, ein Konto explizit auszuwählen.
Verwende `--account`, wann immer Verifizierungs- oder Geräteoperationen ausdrücklich auf ein benanntes Konto zielen sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

### Was „verifiziert“ bedeutet

OpenClaw behandelt dieses Matrix-Gerät nur dann als verifiziert, wenn es durch deine eigene Cross-Signing-Identität verifiziert wurde.
In der Praxis zeigt `openclaw matrix verify status --verbose` drei Vertrauenssignale an:

- `Locally trusted`: Dieses Gerät ist nur durch den aktuellen Client als vertrauenswürdig markiert
- `Cross-signing verified`: Das SDK meldet das Gerät als durch Cross-Signing verifiziert
- `Signed by owner`: Das Gerät ist mit deinem eigenen Self-Signing-Schlüssel signiert

`Verified by owner` wird nur dann zu `yes`, wenn Cross-Signing-Verifizierung oder Owner-Signing vorhanden ist.
Lokales Vertrauen allein reicht nicht aus, damit OpenClaw das Gerät als vollständig verifiziert behandelt.

### Was Bootstrap macht

`openclaw matrix verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Matrix-Konten.
Er führt der Reihe nach Folgendes aus:

- initialisiert den Secret Storage und verwendet nach Möglichkeit einen vorhandenen Wiederherstellungsschlüssel erneut
- initialisiert Cross-Signing und lädt fehlende öffentliche Cross-Signing-Schlüssel hoch
- versucht, das aktuelle Gerät zu markieren und per Cross-Signing zu signieren
- erstellt ein neues serverseitiges Raumschlüssel-Backup, falls noch keines existiert

Wenn der Homeserver interaktive Authentifizierung zum Hochladen von Cross-Signing-Schlüsseln verlangt, versucht OpenClaw das Hochladen zuerst ohne Authentifizierung, dann mit `m.login.dummy` und anschließend mit `m.login.password`, wenn `channels.matrix.password` konfiguriert ist.

Verwende `--force-reset-cross-signing` nur, wenn du absichtlich die aktuelle Cross-Signing-Identität verwerfen und eine neue erstellen möchtest.

Wenn du absichtlich das aktuelle Raumschlüssel-Backup verwerfen und eine neue
Backup-Basis für zukünftige Nachrichten starten möchtest, verwende `openclaw matrix verify backup reset --yes`.
Tue dies nur, wenn du akzeptierst, dass nicht wiederherstellbarer alter verschlüsselter Verlauf
weiterhin nicht verfügbar bleibt und dass OpenClaw den Secret Storage möglicherweise neu erstellt, wenn das aktuelle Backup-Secret nicht sicher geladen werden kann.

### Neue Backup-Basis

Wenn du sicherstellen möchtest, dass zukünftige verschlüsselte Nachrichten weiterhin funktionieren, und akzeptierst, nicht wiederherstellbaren alten Verlauf zu verlieren, führe diese Befehle in dieser Reihenfolge aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Füge `--account <id>` zu jedem Befehl hinzu, wenn du explizit ein benanntes Matrix-Konto ansprechen möchtest.

### Startverhalten

Wenn `encryption: true` gesetzt ist, verwendet Matrix standardmäßig `startupVerification` mit dem Wert `"if-unverified"`.
Beim Start fordert Matrix, falls dieses Gerät noch nicht verifiziert ist, in einem anderen Matrix-Client zur Selbstverifizierung auf,
überspringt doppelte Anforderungen, solange bereits eine aussteht, und verwendet vor einem erneuten Versuch nach Neustarts eine lokale Abklingzeit.
Fehlgeschlagene Anforderungsversuche werden standardmäßig früher erneut versucht als eine erfolgreiche Erstellung der Anforderung.
Setze `startupVerification: "off"`, um automatische Anfragen beim Start zu deaktivieren, oder passe `startupVerificationCooldownHours`
an, wenn du ein kürzeres oder längeres Wiederholungsfenster möchtest.

Beim Start wird außerdem automatisch ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt.
Dieser Durchlauf versucht zuerst, den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederzuverwenden, und vermeidet ein Zurücksetzen von Cross-Signing, sofern du nicht ausdrücklich einen Bootstrap-Reparaturablauf ausführst.

Wenn beim Start dennoch ein fehlerhafter Bootstrap-Status erkannt wird, kann OpenClaw einen abgesicherten Reparaturpfad versuchen, selbst wenn `channels.matrix.password` nicht konfiguriert ist.
Wenn der Homeserver für diese Reparatur passwortbasierte UIA verlangt, protokolliert OpenClaw eine Warnung und hält den Start weiterhin nicht fatal, anstatt den Bot abzubrechen.
Wenn das aktuelle Gerät bereits vom Eigentümer signiert ist, bewahrt OpenClaw diese Identität, anstatt sie automatisch zurückzusetzen.

Siehe [Matrix migration](/de/install/migrating-matrix) für den vollständigen Upgrade-Ablauf, Grenzen, Wiederherstellungsbefehle und häufige Migrationsmeldungen.

### Verifizierungshinweise

Matrix veröffentlicht Hinweise zum Lebenszyklus der Verifizierung direkt im strikten DM-Verifizierungsraum als `m.notice`-Nachrichten.
Dazu gehören:

- Hinweise zu Verifizierungsanfragen
- Hinweise zur Verifizierungsbereitschaft (mit ausdrücklichem Hinweis „Per Emoji verifizieren“)
- Hinweise zum Start und Abschluss der Verifizierung
- SAS-Details (Emoji und Dezimalzahl), wenn verfügbar

Eingehende Verifizierungsanfragen von einem anderen Matrix-Client werden von OpenClaw nachverfolgt und automatisch angenommen.
Bei Selbstverifizierungsabläufen startet OpenClaw den SAS-Ablauf auch automatisch, sobald die Emoji-Verifizierung verfügbar wird, und bestätigt die eigene Seite.
Bei Verifizierungsanfragen von einem anderen Matrix-Benutzer/-Gerät nimmt OpenClaw die Anfrage automatisch an und wartet dann darauf, dass der SAS-Ablauf normal fortgesetzt wird.
Du musst die Emoji- oder dezimale SAS dennoch in deinem Matrix-Client vergleichen und dort „Sie stimmen überein“ bestätigen, um die Verifizierung abzuschließen.

OpenClaw akzeptiert selbst initiierte doppelte Abläufe nicht blind automatisch. Beim Start wird keine neue Anfrage erstellt, wenn bereits eine Selbstverifizierungsanfrage aussteht.

Hinweise zum Verifizierungsprotokoll/System werden nicht an die Agent-Chat-Pipeline weitergeleitet und erzeugen daher kein `NO_REPLY`.

### Gerätehygiene

Alte, von OpenClaw verwaltete Matrix-Geräte können sich im Konto ansammeln und das Vertrauen in verschlüsselten Räumen schwerer nachvollziehbar machen.
Liste sie auf mit:

```bash
openclaw matrix devices list
```

Entferne veraltete, von OpenClaw verwaltete Geräte mit:

```bash
openclaw matrix devices prune-stale
```

### Crypto-Store

Matrix-E2EE verwendet den offiziellen Rust-Crypto-Pfad von `matrix-js-sdk` in Node, mit `fake-indexeddb` als IndexedDB-Shim. Der Crypto-Status wird in einer Snapshot-Datei (`crypto-idb-snapshot.json`) gespeichert und beim Start wiederhergestellt. Die Snapshot-Datei ist sensibler Laufzeitstatus und wird mit restriktiven Dateiberechtigungen gespeichert.

Verschlüsselter Laufzeitstatus liegt unter roots pro Konto und Benutzer mit Token-Hash in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Dieses Verzeichnis enthält den Sync-Store (`bot-storage.json`), den Crypto-Store (`crypto/`),
die Wiederherstellungsschlüssel-Datei (`recovery-key.json`), den IndexedDB-Snapshot (`crypto-idb-snapshot.json`),
Thread-Bindings (`thread-bindings.json`) und den Status der Startverifizierung (`startup-verification.json`).
Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw die beste vorhandene
Root für dieses Konto-/Homeserver-/Benutzer-Tupel wieder, sodass vorheriger Sync-Status, Crypto-Status, Thread-Bindings
und Startverifizierungsstatus sichtbar bleiben.

## Profilverwaltung

Aktualisiere das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Füge `--account <id>` hinzu, wenn du explizit ein benanntes Matrix-Konto ansprechen möchtest.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn du eine `http://`- oder `https://`-Avatar-URL übergibst, lädt OpenClaw sie zuerst zu Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder in den ausgewählten Konto-Override).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sendungen über Message-Tools.

- `dm.sessionScope: "per-user"` (Standard) hält das DM-Routing in Matrix absenderspezifisch, sodass mehrere DM-Räume eine Sitzung gemeinsam nutzen können, wenn sie zum selben Peer aufgelöst werden.
- `dm.sessionScope: "per-room"` isoliert jeden Matrix-DM-Raum in seinen eigenen Sitzungsschlüssel und verwendet dabei weiterhin normale DM-Authentifizierungs- und Allowlist-Prüfungen.
- Explizite Matrix-Konversations-Bindings haben weiterhin Vorrang vor `dm.sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung beibehalten.
- `threadReplies: "off"` hält Antworten auf der obersten Ebene und behält eingehende Thread-Nachrichten in der übergeordneten Sitzung.
- `threadReplies: "inbound"` antwortet innerhalb eines Threads nur dann, wenn die eingehende Nachricht bereits in diesem Thread war.
- `threadReplies: "always"` hält Raumantworten in einem Thread mit der auslösenden Nachricht als Wurzel und leitet diese Konversation ab der ersten auslösenden Nachricht über die passende threadbezogene Sitzung.
- `dm.threadReplies` überschreibt die Einstellung auf oberster Ebene nur für DMs. So kannst du zum Beispiel Raum-Threads isoliert halten und DMs flach halten.
- Eingehende Thread-Nachrichten enthalten die Thread-Wurzel-Nachricht als zusätzlichen Agent-Kontext.
- Sendungen über Message-Tools übernehmen den aktuellen Matrix-Thread automatisch, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern kein explizites `threadId` angegeben wird.
- Die Wiederverwendung desselben sitzungsbezogenen DM-Benutzerziels greift nur, wenn die Metadaten der aktuellen Sitzung denselben DM-Peer im selben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsamen Matrix-DM-Sitzung kollidiert, veröffentlicht es in diesem Raum einmalig ein `m.notice` mit dem `/focus`-Ausweg, wenn Thread-Bindings aktiviert sind, sowie dem Hinweis `dm.sessionScope`.
- Laufzeit-Thread-Bindings werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren in Matrix-Räumen und DMs.
- `/focus` auf oberster Ebene in Matrix-Räumen/DMs erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Wenn `/focus` oder `/acp spawn --thread here` innerhalb eines vorhandenen Matrix-Threads ausgeführt wird, bindet dies stattdessen diesen aktuellen Thread.

## ACP-Konversations-Bindings

Matrix-Räume, DMs und vorhandene Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führe `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des vorhandenen Threads aus, den du weiterverwenden möchtest.
- In einer Matrix-DM oder einem Matrix-Raum auf oberster Ebene bleibt die aktuelle DM/der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung weitergeleitet.
- Innerhalb eines vorhandenen Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Thread-Binding-Konfiguration

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt außerdem kanalbezogene Overrides:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Threadgebundene Spawn-Flags für Matrix sind optional:

- Setze `threadBindings.spawnSubagentSessions: true`, um zuzulassen, dass `/focus` auf oberster Ebene neue Matrix-Threads erstellt und bindet.
- Setze `threadBindings.spawnAcpSessions: true`, um zuzulassen, dass `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads bindet.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Bestätigungsreaktionen.

- Tooling für ausgehende Reaktionen wird durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf diesem Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion vom Bot-Konto.

Der Geltungsbereich für Bestätigungsreaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Emoji-Fallback der Agent-Identität

Der Geltungsbereich von Bestätigungsreaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Der Benachrichtigungsmodus für Reaktionen wird in dieser Reihenfolge aufgelöst:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- Standard: `own`

Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie sich auf vom Bot verfasste Matrix-Nachrichten beziehen.
- `reactionNotifications: "off"` deaktiviert Reaktions-Systemereignisse.
- Das Entfernen von Reaktionen wird nicht zu Systemereignissen synthetisiert, da Matrix diese als Redaktionen und nicht als eigenständige Entfernungen von `m.reaction` darstellt.

## Verlaufs-Kontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setze `0`, um dies zu deaktivieren.
- Der Verlauf von Matrix-Räumen ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Verlauf von Matrix-Räumen ist nur für ausstehende Nachrichten: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle auslösende Nachricht ist nicht in `InboundHistory` enthalten; sie bleibt für diesen Turn im Hauptteil der eingehenden Nachricht.
- Wiederholungsversuche desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufs-Snapshot wieder, anstatt auf neuere Raumnachrichten weiterzudriften.

## Kontextsichtbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Wurzeln und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext bleibt wie empfangen erhalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber dennoch eine explizit zitierte Antwort bei.

Diese Einstellung beeinflusst die Sichtbarkeit ergänzenden Kontexts, nicht ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Autorisierung von Auslösern kommt weiterhin von `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Siehe [Groups](/de/channels/groups) für Erwähnungs-Gating und Allowlist-Verhalten.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer dich vor der Genehmigung weiter anschreibt, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und kann nach einer kurzen Abklingzeit erneut eine Erinnerung senden, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Status von Direktnachrichten nicht synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen haben, die auf alte Einzelräume statt auf die aktive DM zeigen. Prüfe die aktuelle Zuordnung für einen Peer mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repariere sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt auf eine aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- erstellt einen neuen Direkt-Raum und schreibt `m.direct` neu, wenn keine gesunde DM existiert

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die gesunde DM aus und aktualisiert die Zuordnung, damit neue Matrix-Sendungen, Verifizierungshinweise und andere Direktnachrichtenabläufe wieder den richtigen Raum ansprechen.

## Exec-Genehmigungen

Matrix kann als nativer Genehmigungs-Client für ein Matrix-Konto fungieren. Die nativen
DM-/Channel-Routing-Schalter befinden sich weiterhin unter der Exec-Genehmigungskonfiguration:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; fällt auf `channels.matrix.dm.allowFrom` zurück)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Genehmiger müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Genehmigungen automatisch, wenn `enabled` nicht gesetzt ist oder `"auto"` lautet und mindestens ein Genehmiger aufgelöst werden kann. Exec-Genehmigungen verwenden zuerst `execApprovals.approvers` und können auf `channels.matrix.dm.allowFrom` zurückfallen. Plugin-Genehmigungen autorisieren über `channels.matrix.dm.allowFrom`. Setze `enabled: false`, um Matrix ausdrücklich als nativen Genehmigungs-Client zu deaktivieren. Andernfalls fallen Genehmigungsanfragen auf andere konfigurierte Genehmigungsrouten oder die Genehmigungs-Fallback-Richtlinie zurück.

Matrix-native Weiterleitung unterstützt beide Genehmigungsarten:

- `channels.matrix.execApprovals.*` steuert den nativen DM-/Channel-Fanout-Modus für Matrix-Genehmigungsaufforderungen.
- Exec-Genehmigungen verwenden die Menge der Exec-Genehmiger aus `execApprovals.approvers` oder `channels.matrix.dm.allowFrom`.
- Plugin-Genehmigungen verwenden die DM-Allowlist von Matrix aus `channels.matrix.dm.allowFrom`.
- Matrix-Reaktionskürzel und Nachrichtenaktualisierungen gelten sowohl für Exec- als auch für Plugin-Genehmigungen.

Zustellregeln:

- `target: "dm"` sendet Genehmigungsaufforderungen an Genehmiger-DMs
- `target: "channel"` sendet die Aufforderung zurück an den auslösenden Matrix-Raum oder die auslösende DM
- `target: "both"` sendet an Genehmiger-DMs und an den auslösenden Matrix-Raum oder die auslösende DM

Matrix-Genehmigungsaufforderungen initialisieren Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` = einmal erlauben
- `❌` = ablehnen
- `♾️` = immer erlauben, wenn diese Entscheidung durch die effektive Exec-Richtlinie zulässig ist

Genehmiger können auf diese Nachricht reagieren oder die Fallback-Slash-Befehle verwenden: `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny`.

Nur aufgelöste Genehmiger können genehmigen oder ablehnen. Bei Exec-Genehmigungen enthält die Channel-Zustellung den Befehlstext, daher solltest du `channel` oder `both` nur in vertrauenswürdigen Räumen aktivieren.

Kontoabhängiger Override:

- `channels.matrix.accounts.<account>.execApprovals`

Verwandte Dokumentation: [Exec approvals](/de/tools/exec-approvals)

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

Werte auf oberster Ebene unter `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
Du kannst geerbte Raumeinträge mit `groups.<room>.account` auf ein einzelnes Matrix-Konto begrenzen.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam genutzt, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf oberster Ebene unter `channels.matrix.*` konfiguriert ist.
Partielle gemeinsame Auth-Standardwerte erzeugen für sich genommen kein separates implizites Standardkonto. OpenClaw synthetisiert das Standardkonto auf oberster Ebene `default` nur dann, wenn dieses Standardkonto aktuelle Auth-Daten hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können weiterhin über `homeserver` plus `userId` erkennbar bleiben, wenn zwischengespeicherte Anmeldedaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen benannten Kontoschlüssel zeigt, bewahrt die Reparatur-/Einrichtungs-Hochstufung von Einzelkonto zu Multi-Account dieses Konto, anstatt einen neuen `accounts.default`-Eintrag zu erstellen. Nur Matrix-Authentifizierungs-/Bootstrap-Schlüssel werden in dieses hochgestufte Konto verschoben; gemeinsame Zustellungsrichtlinien-Schlüssel bleiben auf oberster Ebene.
Setze `defaultAccount`, wenn OpenClaw ein benanntes Matrix-Konto für implizites Routing, Sondierung und CLI-Operationen bevorzugen soll.
Wenn mehrere Matrix-Konten konfiguriert sind und eine Konto-ID `default` ist, verwendet OpenClaw dieses Konto implizit, auch wenn `defaultAccount` nicht gesetzt ist.
Wenn du mehrere benannte Konten konfigurierst, setze `defaultAccount` oder übergib `--account <id>` für CLI-Befehle, die auf impliziter Kontoauswahl beruhen.
Übergib `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn du diese implizite Auswahl für einen einzelnen Befehl überschreiben möchtest.

Siehe [Configuration reference](/de/gateway/configuration-reference#multi-account-all-channels) für das gemeinsame Multi-Account-Muster.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum SSRF-Schutz, sofern du
nicht explizit pro Konto optierst.

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

Dieses Opt-in erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche unverschlüsselte Homeserver wie
`http://matrix.example.org:8008` bleiben blockiert. Bevorzuge nach Möglichkeit `https://`.

## Matrix-Verkehr über einen Proxy leiten

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

Benannte Konten können den Standardwert auf oberster Ebene mit `channels.matrix.accounts.<id>.proxy` überschreiben.
OpenClaw verwendet dieselbe Proxy-Einstellung für Laufzeit-Matrix-Verkehr und Konto-Status-Sondierungen.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt und fallen dann auf die Suche nach beigetretenen Raumnamen für dieses Konto zurück.
- Die Suche nach Namen beigetretener Räume erfolgt nach bestem Bemühen. Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er bei der Laufzeit-Allowlist-Auflösung ignoriert.

## Konfigurationsreferenz

- `enabled`: den Channel aktivieren oder deaktivieren.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: erlaubt diesem Matrix-Konto, sich mit privaten/internen Homeservern zu verbinden. Aktiviere dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Verkehr. Benannte Konten können den Standardwert auf oberster Ebene mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Access Token für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` über env-/file-/exec-Provider unterstützt. Siehe [Secrets Management](/de/gateway/secrets).
- `password`: Passwort für passwortbasierte Anmeldung. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts für Passwort-Login.
- `avatarUrl`: gespeicherte Selbst-Avatar-URL für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl von Ereignissen, die während der Start-Synchronisierung abgerufen werden.
- `encryption`: E2EE aktivieren.
- `allowlistOnly`: wenn `true`, wird die Raumrichtlinie `open` auf `allowlist` hochgestuft und alle aktiven DM-Richtlinien außer `disabled` (einschließlich `pairing` und `open`) werden zu `allowlist` gezwungen. Wirkt sich nicht auf `disabled`-Richtlinien aus.
- `allowBots`: Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten erlauben (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumverkehr. Einträge sollten vollständige Matrix-Benutzer-IDs sein; nicht aufgelöste Namen werden zur Laufzeit ignoriert.
- `historyLimit`: maximale Anzahl von Raumnachrichten, die als Gruppenverlaufs-Kontext einbezogen werden. Fällt auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setze `0`, um dies zu deaktivieren.
- `replyToMode`: `off`, `first`, `all` oder `batched`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `"partial"`, `"quiet"`, `true` oder `false`. `"partial"` und `true` aktivieren Vorschau-zuerst-Entwurfsaktualisierungen mit normalen Matrix-Textnachrichten. `"quiet"` verwendet nicht benachrichtigende Vorschauhinweise für selbstgehostete Push-Regel-Setups. `false` entspricht `"off"`.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistentenblöcke, während Entwurfsvorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: kanalbezogene Overrides für threadgebundenes Sitzungsrouting und Lebenszyklus.
- `startupVerification`: Modus für automatische Selbstverifizierungsanforderungen beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Abklingzeit vor einem erneuten Versuch automatischer Start-Verifizierungsanforderungen.
- `textChunkLimit`: Größe ausgehender Nachrichten-Chunks in Zeichen (gilt, wenn `chunkMode` `length` ist).
- `chunkMode`: `length` teilt Nachrichten nach Zeichenzahl; `newline` teilt an Zeilengrenzen.
- `responsePrefix`: optionale Zeichenfolge, die allen ausgehenden Antworten für diesen Channel vorangestellt wird.
- `ackReaction`: optionaler Override für Bestätigungsreaktionen für diesen Channel/dieses Konto.
- `ackReactionScope`: optionaler Override für den Geltungsbereich von Bestätigungsreaktionen (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Größenlimit für Medien in MB für ausgehende Sendungen und eingehende Medienverarbeitung.
- `autoJoin`: Richtlinie für automatisches Beitreten zu Einladungen (`always`, `allowlist`, `off`). Standard: `off`. Gilt für alle Matrix-Einladungen, einschließlich DM-ähnlicher Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` auf `allowlist` gesetzt ist. Alias-Einträge werden während der Einladungsverarbeitung zu Raum-IDs aufgelöst; OpenClaw vertraut keinem Alias-Status, den der eingeladene Raum behauptet.
- `dm`: DM-Richtlinienblock (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: steuert den DM-Zugriff, nachdem OpenClaw dem Raum beigetreten ist und ihn als DM klassifiziert hat. Ändert nicht, ob einer Einladung automatisch beigetreten wird.
- `dm.allowFrom`: Einträge sollten vollständige Matrix-Benutzer-IDs sein, es sei denn, du hast sie bereits über die Live-Verzeichnissuche aufgelöst.
- `dm.sessionScope`: `per-user` (Standard) oder `per-room`. Verwende `per-room`, wenn du möchtest, dass jeder Matrix-DM-Raum einen getrennten Kontext behält, selbst wenn der Peer derselbe ist.
- `dm.threadReplies`: DM-spezifischer Override für Thread-Richtlinien (`off`, `inbound`, `always`). Überschreibt die Einstellung `threadReplies` auf oberster Ebene sowohl für die Platzierung von Antworten als auch für die Sitzungsisolierung in DMs.
- `execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die Genehmiger bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte kontoabhängige Overrides. Werte auf oberster Ebene unter `channels.matrix` dienen als Standardwerte für diese Einträge.
- `groups`: raumbezogene Richtlinienzuordnung. Bevorzuge Raum-IDs oder Aliasse; nicht aufgelöste Raumnamen werden zur Laufzeit ignoriert. Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID.
- `groups.<room>.account`: beschränkt einen geerbten Raumeintrag in Multi-Account-Setups auf ein bestimmtes Matrix-Konto.
- `groups.<room>.allowBots`: raumbezogener Override für Absender aus konfigurierten Bots (`true` oder `"mentions"`).
- `groups.<room>.users`: absenderbezogene Allowlist pro Raum.
- `groups.<room>.tools`: raumbezogene Tool-Allow-/Deny-Overrides.
- `groups.<room>.autoReply`: raumbezogener Override für Erwähnungs-Gating. `true` deaktiviert Erwähnungspflichten für diesen Raum; `false` erzwingt sie wieder.
- `groups.<room>.skills`: optionaler raumbezogener Skills-Filter.
- `groups.<room>.systemPrompt`: optionaler raumbezogener System-Prompt-Ausschnitt.
- `rooms`: Legacy-Alias für `groups`.
- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Erwähnungs-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
