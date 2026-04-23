---
read_when:
    - Einrichten von Matrix in OpenClaw
    - Konfigurieren von Matrix-E2EE und Verifizierung
summary: Matrix-Unterstützungsstatus, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-04-23T13:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix ist ein gebündeltes Channel-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation ohne Matrix verwenden, installieren
Sie es manuell:

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

1. Stellen Sie sicher, dass das Matrix-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
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
- Authentifizierungsmethode: Access-Token oder Passwort
- Benutzer-ID (nur bei Passwortauthentifizierung)
- optionalem Gerätenamen
- ob E2EE aktiviert werden soll
- ob Raumzugriff und automatisches Beitreten bei Einladungen konfiguriert werden sollen

Wichtige Verhaltensweisen des Assistenten:

- Wenn Matrix-Authentifizierungs-Umgebungsvariablen bereits vorhanden sind und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Umgebungsvariablen-Verknüpfung an, damit die Authentifizierung in Umgebungsvariablen bleibt.
- Kontonamen werden auf die Konto-ID normalisiert. Zum Beispiel wird aus `Ops Bot` `ops-bot`.
- DM-Allowlist-Einträge akzeptieren `@user:server` direkt; Anzeigenamen funktionieren nur, wenn eine Live-Verzeichnissuche genau einen Treffer findet.
- Raum-Allowlist-Einträge akzeptieren Raum-IDs und Aliasse direkt. Bevorzugen Sie `!room:server` oder `#alias:server`; nicht aufgelöste Namen werden zur Laufzeit von der Allowlist-Auflösung ignoriert.
- Im Allowlist-Modus für automatisches Beitreten bei Einladungen nur stabile Einladungsziele verwenden: `!roomId:server`, `#alias:server` oder `*`. Reine Raumnamen werden abgelehnt.
- Um Raumnamen vor dem Speichern aufzulösen, verwenden Sie `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` ist standardmäßig auf `off` gesetzt.

Wenn Sie es nicht festlegen, tritt der Bot eingeladenen Räumen oder neuen DM-artigen Einladungen nicht bei. Er erscheint also nicht in neuen Gruppen oder eingeladenen DMs, es sei denn, Sie treten zuerst manuell bei.

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

Passwortbasierte Einrichtung (Token wird nach der Anmeldung zwischengespeichert):

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
Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, behandelt OpenClaw Matrix für Einrichtungs-, Doctor- und Channel-Status-Erkennung als konfiguriert, auch wenn die aktuelle Authentifizierung nicht direkt in der Konfiguration gesetzt ist.

Entsprechende Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Für Nicht-Standardkonten verwenden Sie kontospezifische Umgebungsvariablen:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Beispiel für das Konto `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Für die normalisierte Konto-ID `ops-bot` verwenden Sie:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix maskiert Satzzeichen in Konto-IDs, damit kontospezifische Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, daher wird `ops-prod` zu `MATRIX_OPS_X2D_PROD_*`.

Der interaktive Assistent bietet die Umgebungsvariablen-Verknüpfung nur an, wenn diese Authentifizierungs-Umgebungsvariablen bereits vorhanden sind und für das ausgewählte Konto noch keine Matrix-Authentifizierung in der Konfiguration gespeichert ist.

`MATRIX_HOMESERVER` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

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

`autoJoin` gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen. OpenClaw kann
einen eingeladenen Raum zum Zeitpunkt der Einladung nicht zuverlässig als DM oder Gruppe
klassifizieren, daher durchlaufen alle Einladungen zuerst `autoJoin`.
`dm.policy` gilt, nachdem der Bot beigetreten ist und der Raum als DM klassifiziert wurde.

## Streaming-Vorschauen

Reply-Streaming für Matrix ist Opt-in.

Setzen Sie `channels.matrix.streaming` auf `"partial"`, wenn OpenClaw eine einzelne Live-Vorschau-Antwort
senden, diese Vorschau während der Textgenerierung durch das Modell an Ort und Stelle bearbeiten und sie
abschließend finalisieren soll, wenn die Antwort fertig ist:

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
- `streaming: "partial"` erstellt eine bearbeitbare Vorschau-Nachricht für den aktuellen Assistant-Block mit normalen Matrix-Textnachrichten. Dadurch bleibt das ältere benachrichtigungsorientierte Vorschau-zuerst-Verhalten von Matrix erhalten, sodass Standard-Clients möglicherweise beim ersten gestreamten Vorschautext benachrichtigen statt beim fertigen Block.
- `streaming: "quiet"` erstellt einen bearbeitbaren stillen Vorschau-Hinweis für den aktuellen Assistant-Block. Verwenden Sie dies nur, wenn Sie zusätzlich Push-Regeln für Empfänger für finalisierte Vorschau-Bearbeitungen konfigurieren.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Wenn Vorschau-Streaming aktiviert ist, behält Matrix den Live-Entwurf für den aktuellen Block bei und bewahrt abgeschlossene Blöcke als separate Nachrichten.
- Wenn Vorschau-Streaming aktiviert ist und `blockStreaming` deaktiviert ist, bearbeitet Matrix den Live-Entwurf an Ort und Stelle und finalisiert dasselbe Event, wenn der Block oder Turn abgeschlossen ist.
- Wenn die Vorschau nicht mehr in ein einzelnes Matrix-Event passt, beendet OpenClaw das Vorschau-Streaming und fällt auf die normale endgültige Zustellung zurück.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, redigiert OpenClaw sie vor dem Senden der endgültigen Medienantwort.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lassen Sie Streaming deaktiviert, wenn Sie das konservativste Rate-Limit-Verhalten möchten.

`blockStreaming` aktiviert Vorschau-Entwürfe nicht von selbst.
Verwenden Sie `streaming: "partial"` oder `streaming: "quiet"` für Vorschau-Bearbeitungen; fügen Sie dann `blockStreaming: true` nur hinzu, wenn abgeschlossene Assistant-Blöcke zusätzlich als separate Fortschrittsnachrichten sichtbar bleiben sollen.

Wenn Sie Standard-Matrix-Benachrichtigungen ohne benutzerdefinierte Push-Regeln benötigen, verwenden Sie `streaming: "partial"` für Vorschau-zuerst-Verhalten oder lassen Sie `streaming` für reine Endzustellung deaktiviert. Mit `streaming: "off"`:

- `blockStreaming: true` sendet jeden abgeschlossenen Block als normale benachrichtigende Matrix-Nachricht.
- `blockStreaming: false` sendet nur die endgültige abgeschlossene Antwort als normale benachrichtigende Matrix-Nachricht.

### Selbst gehostete Push-Regeln für stille finalisierte Vorschauen

Wenn Sie Ihre eigene Matrix-Infrastruktur betreiben und stille Vorschauen nur dann benachrichtigen lassen möchten, wenn ein Block oder
eine endgültige Antwort abgeschlossen ist, setzen Sie `streaming: "quiet"` und fügen Sie eine benutzerspezifische Push-Regel für finalisierte Vorschau-Bearbeitungen hinzu.

Dies ist normalerweise eine Einrichtung pro Empfängerbenutzer, keine globale Konfigurationsänderung für den Homeserver:

Kurzübersicht, bevor Sie beginnen:

- Empfängerbenutzer = die Person, die die Benachrichtigung erhalten soll
- Bot-Benutzer = das OpenClaw-Matrix-Konto, das die Antwort sendet
- verwenden Sie für die folgenden API-Aufrufe das Access-Token des Empfängerbenutzers
- gleichen Sie `sender` in der Push-Regel mit der vollständigen MXID des Bot-Benutzers ab

1. Konfigurieren Sie OpenClaw für stille Vorschauen:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Stellen Sie sicher, dass das Empfängerkonto bereits normale Matrix-Push-Benachrichtigungen erhält. Regeln für stille Vorschauen
   funktionieren nur, wenn dieser Benutzer bereits funktionierende Pusher/Geräte hat.

3. Holen Sie das Access-Token des Empfängerbenutzers.
   - Verwenden Sie das Token des empfangenden Benutzers, nicht das Token des Bots.
   - Die Wiederverwendung eines vorhandenen Client-Sitzungstokens ist in der Regel am einfachsten.
   - Wenn Sie ein neues Token ausstellen müssen, können Sie sich über die standardmäßige Matrix Client-Server-API anmelden:

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

4. Verifizieren Sie, dass das Empfängerkonto bereits Pusher hat:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Wenn dies keine aktiven Pusher/Geräte zurückgibt, beheben Sie zuerst normale Matrix-Benachrichtigungen, bevor Sie die
unten stehende OpenClaw-Regel hinzufügen.

OpenClaw markiert finalisierte reine Text-Vorschau-Bearbeitungen mit:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Erstellen Sie für jedes Empfängerkonto, das diese Benachrichtigungen erhalten soll, eine Override-Push-Regel:

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

Ersetzen Sie diese Werte, bevor Sie den Befehl ausführen:

- `https://matrix.example.org`: Ihre Homeserver-Basis-URL
- `$USER_ACCESS_TOKEN`: das Access-Token des empfangenden Benutzers
- `openclaw-finalized-preview-botname`: eine Regel-ID, die für diesen Bot bei diesem empfangenden Benutzer eindeutig ist
- `@bot:example.org`: die MXID Ihres OpenClaw-Matrix-Bots, nicht die MXID des empfangenden Benutzers

Wichtig für Setups mit mehreren Bots:

- Push-Regeln sind über `ruleId` gekennzeichnet. Ein erneutes `PUT` mit derselben Regel-ID aktualisiert diese eine Regel.
- Wenn ein empfangender Benutzer für mehrere OpenClaw-Matrix-Bot-Konten benachrichtigen soll, erstellen Sie eine Regel pro Bot mit einer eindeutigen Regel-ID für jede `sender`-Übereinstimmung.
- Ein einfaches Muster ist `openclaw-finalized-preview-<botname>`, zum Beispiel `openclaw-finalized-preview-ops` oder `openclaw-finalized-preview-support`.

Die Regel wird anhand des Event-Senders ausgewertet:

- authentifizieren Sie sich mit dem Token des empfangenden Benutzers
- gleichen Sie `sender` mit der MXID des OpenClaw-Bots ab

6. Verifizieren Sie, dass die Regel vorhanden ist:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Testen Sie eine gestreamte Antwort. Im stillen Modus sollte der Raum eine stille Entwurfs-Vorschau anzeigen, und die abschließende
   Bearbeitung an Ort und Stelle sollte benachrichtigen, sobald der Block oder Turn abgeschlossen ist.

Wenn Sie die Regel später entfernen müssen, löschen Sie dieselbe Regel-ID mit dem Token des empfangenden Benutzers:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Hinweise:

- Erstellen Sie die Regel mit dem Access-Token des empfangenden Benutzers, nicht mit dem des Bots.
- Neue benutzerdefinierte `override`-Regeln werden vor den standardmäßigen Unterdrückungsregeln eingefügt, daher ist kein zusätzlicher Ordnungsparameter erforderlich.
- Dies betrifft nur reine Text-Vorschau-Bearbeitungen, die OpenClaw sicher an Ort und Stelle finalisieren kann. Medien-Fallbacks und Fallbacks bei veralteten Vorschauen verwenden weiterhin die normale Matrix-Zustellung.
- Wenn `GET /_matrix/client/v3/pushers` keine Pusher anzeigt, hat der Benutzer für dieses Konto/Gerät noch keine funktionierende Matrix-Push-Zustellung.

#### Synapse

Für Synapse ist die obige Einrichtung normalerweise bereits ausreichend:

- Für finalisierte OpenClaw-Vorschau-Benachrichtigungen ist keine spezielle Änderung in `homeserver.yaml` erforderlich.
- Wenn Ihre Synapse-Bereitstellung bereits normale Matrix-Push-Benachrichtigungen sendet, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn Sie Synapse hinter einem Reverse Proxy oder mit Workers betreiben, stellen Sie sicher, dass `/_matrix/client/.../pushrules/` Synapse korrekt erreicht.
- Wenn Sie Synapse-Workers verwenden, stellen Sie sicher, dass Pusher funktionsfähig sind. Die Push-Zustellung wird vom Hauptprozess oder von `synapse.app.pusher` / konfigurierten Pusher-Workers verarbeitet.

#### Tuwunel

Für Tuwunel verwenden Sie denselben Einrichtungsablauf und denselben `push-rule`-API-Aufruf wie oben gezeigt:

- Für den Marker der finalisierten Vorschau selbst ist keine Tuwunel-spezifische Konfiguration erforderlich.
- Wenn normale Matrix-Benachrichtigungen für diesen Benutzer bereits funktionieren, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn Benachrichtigungen zu verschwinden scheinen, während der Benutzer auf einem anderen Gerät aktiv ist, prüfen Sie, ob `suppress_push_when_active` aktiviert ist. Tuwunel hat diese Option in Tuwunel 1.4.2 am 12. September 2025 hinzugefügt, und sie kann Pushes an andere Geräte absichtlich unterdrücken, während ein Gerät aktiv ist.

## Bot-zu-Bot-Räume

Standardmäßig werden Matrix-Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten ignoriert.

Verwenden Sie `allowBots`, wenn Sie absichtlich Inter-Agent-Matrix-Verkehr möchten:

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
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwort-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von Bot verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivieren.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bild-Events `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

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

Den gespeicherten Recovery Key in maschinenlesbarer Ausgabe einschließen:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-Signing- und Verifizierungsstatus bootstrappen:

```bash
openclaw matrix verify bootstrap
```

Ausführliche Bootstrap-Diagnosen:

```bash
openclaw matrix verify bootstrap --verbose
```

Vor dem Bootstrap ein neues Zurücksetzen der Cross-Signing-Identität erzwingen:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Dieses Gerät mit einem Recovery Key verifizieren:

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

Ausführliche Diagnosen zum Backup-Zustand:

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
Backup-Schlüssel nicht sauber geladen werden kann, kann dieses Zurücksetzen auch den Secret Storage neu erstellen, sodass
künftige Kaltstarts den neuen Backup-Schlüssel laden können:

```bash
openclaw matrix verify backup reset --yes
```

Alle `verify`-Befehle sind standardmäßig kompakt (einschließlich stiller interner SDK-Protokollierung) und zeigen detaillierte Diagnosen nur mit `--verbose`.
Verwenden Sie `--json` für eine vollständige maschinenlesbare Ausgabe in Skripten.

In Setups mit mehreren Konten verwenden Matrix-CLI-Befehle das implizite Matrix-Standardkonto, sofern Sie nicht `--account <id>` übergeben.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie zuerst `channels.matrix.defaultAccount`, sonst stoppen diese impliziten CLI-Operationen und fordern Sie auf, ein Konto explizit auszuwählen.
Verwenden Sie `--account`, wann immer Verifizierungs- oder Geräteoperationen gezielt auf ein benanntes Konto angewendet werden sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

### Was „verifiziert“ bedeutet

OpenClaw behandelt dieses Matrix-Gerät nur dann als verifiziert, wenn es durch Ihre eigene Cross-Signing-Identität verifiziert ist.
In der Praxis zeigt `openclaw matrix verify status --verbose` drei Vertrauenssignale an:

- `Locally trusted`: Dieses Gerät wird nur vom aktuellen Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: Das SDK meldet das Gerät als über Cross-Signing verifiziert
- `Signed by owner`: Das Gerät ist mit Ihrem eigenen Self-Signing-Schlüssel signiert

`Verified by owner` wird nur dann zu `yes`, wenn eine Cross-Signing-Verifizierung oder eine Signierung durch den Eigentümer vorhanden ist.
Lokales Vertrauen allein reicht nicht aus, damit OpenClaw das Gerät als vollständig verifiziert behandelt.

### Was Bootstrap tut

`openclaw matrix verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Matrix-Konten.
Er führt in dieser Reihenfolge Folgendes aus:

- bootstrapt den Secret Storage und verwendet dabei nach Möglichkeit einen vorhandenen Recovery Key erneut
- bootstrapt Cross-Signing und lädt fehlende öffentliche Cross-Signing-Schlüssel hoch
- versucht, das aktuelle Gerät zu markieren und per Cross-Signing zu signieren
- erstellt ein neues serverseitiges Raumschlüssel-Backup, falls noch keines vorhanden ist

Wenn der Homeserver interaktive Authentifizierung verlangt, um Cross-Signing-Schlüssel hochzuladen, versucht OpenClaw den Upload zuerst ohne Authentifizierung, dann mit `m.login.dummy` und anschließend mit `m.login.password`, wenn `channels.matrix.password` konfiguriert ist.

Verwenden Sie `--force-reset-cross-signing` nur, wenn Sie die aktuelle Cross-Signing-Identität absichtlich verwerfen und eine neue erstellen möchten.

Wenn Sie das aktuelle Raumschlüssel-Backup absichtlich verwerfen und eine neue
Backup-Basis für zukünftige Nachrichten beginnen möchten, verwenden Sie `openclaw matrix verify backup reset --yes`.
Tun Sie dies nur, wenn Sie akzeptieren, dass nicht wiederherstellbarer alter verschlüsselter Verlauf
nicht verfügbar bleibt und dass OpenClaw den Secret Storage möglicherweise neu erstellt, wenn das aktuelle Backup-
Geheimnis nicht sicher geladen werden kann.

### Neue Backup-Basis

Wenn Sie künftige verschlüsselte Nachrichten funktionsfähig halten und den Verlust nicht wiederherstellbaren alten Verlaufs akzeptieren möchten, führen Sie diese Befehle der Reihe nach aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Fügen Sie jedem Befehl `--account <id>` hinzu, wenn Sie gezielt ein benanntes Matrix-Konto ansprechen möchten.

### Startverhalten

Wenn `encryption: true` gesetzt ist, verwendet Matrix standardmäßig `startupVerification` mit dem Wert `"if-unverified"`.
Wenn dieses Gerät beim Start noch nicht verifiziert ist, fordert Matrix beim Start die Selbstverifizierung in einem anderen Matrix-Client an,
überspringt doppelte Anfragen, solange bereits eine aussteht, und wendet vor erneuten Versuchen nach Neustarts eine lokale Cooldown-Zeit an.
Fehlgeschlagene Anfrageversuche werden standardmäßig früher erneut versucht als erfolgreiche Anfrageerstellungen.
Setzen Sie `startupVerification: "off"`, um automatische Startanfragen zu deaktivieren, oder passen Sie `startupVerificationCooldownHours`
an, wenn Sie ein kürzeres oder längeres Wiederholungsfenster möchten.

Beim Start wird außerdem automatisch ein konservativer Crypto-Bootstrap-Durchlauf ausgeführt.
Dieser Durchlauf versucht zuerst, den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederzuverwenden, und vermeidet ein Zurücksetzen von Cross-Signing, sofern Sie keinen expliziten Bootstrap-Reparaturablauf ausführen.

Wenn beim Start dennoch ein fehlerhafter Bootstrap-Status gefunden wird, kann OpenClaw einen geschützten Reparaturpfad versuchen, selbst wenn `channels.matrix.password` nicht konfiguriert ist.
Wenn der Homeserver für diese Reparatur passwortbasierte UIA verlangt, protokolliert OpenClaw eine Warnung und hält den Start nicht-fatal, anstatt den Bot abzubrechen.
Wenn das aktuelle Gerät bereits vom Eigentümer signiert ist, bewahrt OpenClaw diese Identität, anstatt sie automatisch zurückzusetzen.

Siehe [Matrix migration](/de/install/migrating-matrix) für den vollständigen Upgrade-Ablauf, Einschränkungen, Recovery-Befehle und häufige Migrationsmeldungen.

### Verifizierungshinweise

Matrix veröffentlicht Hinweise zum Verifizierungslebenszyklus direkt im strikten DM-Verifizierungsraum als `m.notice`-Nachrichten.
Dazu gehören:

- Hinweise zu Verifizierungsanfragen
- Hinweise, dass die Verifizierung bereit ist (mit ausdrücklicher Anleitung „Mit Emoji verifizieren“)
- Hinweise zu Beginn und Abschluss der Verifizierung
- SAS-Details (Emoji und Dezimalzahlen), sofern verfügbar

Eingehende Verifizierungsanfragen von einem anderen Matrix-Client werden von OpenClaw verfolgt und automatisch akzeptiert.
Bei Selbstverifizierungsabläufen startet OpenClaw den SAS-Ablauf außerdem automatisch, sobald die Emoji-Verifizierung verfügbar wird, und bestätigt seine eigene Seite.
Bei Verifizierungsanfragen von einem anderen Matrix-Benutzer/-Gerät akzeptiert OpenClaw die Anfrage automatisch und wartet dann darauf, dass der SAS-Ablauf normal weitergeht.
Sie müssen die Emoji- oder dezimalen SAS-Werte weiterhin in Ihrem Matrix-Client vergleichen und dort „Sie stimmen überein“ bestätigen, um die Verifizierung abzuschließen.

OpenClaw akzeptiert selbst initiierte doppelte Abläufe nicht blind automatisch. Beim Start wird das Erstellen einer neuen Anfrage übersprungen, wenn bereits eine Selbstverifizierungsanfrage aussteht.

Hinweise des Verifizierungsprotokolls/-systems werden nicht an die Agent-Chat-Pipeline weitergeleitet und erzeugen daher kein `NO_REPLY`.

### Gerätehygiene

Alte, von OpenClaw verwaltete Matrix-Geräte können sich im Konto ansammeln und das Vertrauensmodell für verschlüsselte Räume schwerer nachvollziehbar machen.
Listen Sie sie auf mit:

```bash
openclaw matrix devices list
```

Entfernen Sie veraltete, von OpenClaw verwaltete Geräte mit:

```bash
openclaw matrix devices prune-stale
```

### Crypto-Store

Matrix-E2EE verwendet den offiziellen Rust-Kryptopfad des `matrix-js-sdk` in Node, mit `fake-indexeddb` als IndexedDB-Shim. Der Kryptostatus wird in einer Snapshot-Datei (`crypto-idb-snapshot.json`) gespeichert und beim Start wiederhergestellt. Die Snapshot-Datei ist sensibler Laufzeitstatus und wird mit restriktiven Dateiberechtigungen gespeichert.

Verschlüsselter Laufzeitstatus liegt unter Roots pro Konto und pro Benutzer-Token-Hash in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Dieses Verzeichnis enthält den Sync-Store (`bot-storage.json`), den Crypto-Store (`crypto/`),
die Recovery-Key-Datei (`recovery-key.json`), den IndexedDB-Snapshot (`crypto-idb-snapshot.json`),
Thread-Bindings (`thread-bindings.json`) und den Startup-Verifizierungsstatus (`startup-verification.json`).
Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw den besten vorhandenen
Root für dieses Konto-/Homeserver-/Benutzer-Tupel erneut, sodass vorheriger Sync-Status, Crypto-Status, Thread-Bindings
und Startup-Verifizierungsstatus sichtbar bleiben.

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Fügen Sie `--account <id>` hinzu, wenn Sie gezielt ein benanntes Matrix-Konto ansprechen möchten.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn Sie eine `http://`- oder `https://`-Avatar-URL übergeben, lädt OpenClaw sie zuerst zu Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder die ausgewählte Konto-Überschreibung).

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Sends von Message-Tools.

- `dm.sessionScope: "per-user"` (Standard) hält das Routing von Matrix-DMs absenderspezifisch, sodass mehrere DM-Räume eine Sitzung teilen können, wenn sie zu demselben Gegenüber aufgelöst werden.
- `dm.sessionScope: "per-room"` isoliert jeden Matrix-DM-Raum in seinen eigenen Sitzungsschlüssel und verwendet dabei weiterhin normale DM-Authentifizierungs- und Allowlist-Prüfungen.
- Explizite Matrix-Conversation-Bindings haben weiterhin Vorrang vor `dm.sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung beibehalten.
- `threadReplies: "off"` hält Antworten auf der obersten Ebene und belässt eingehende Thread-Nachrichten in der übergeordneten Sitzung.
- `threadReplies: "inbound"` antwortet innerhalb eines Threads nur dann, wenn die eingehende Nachricht bereits in diesem Thread war.
- `threadReplies: "always"` hält Raumantworten in einem Thread mit der auslösenden Nachricht als Wurzel und leitet diese Conversation ab der ersten auslösenden Nachricht durch die passende threadbezogene Sitzung.
- `dm.threadReplies` überschreibt die Einstellung auf oberster Ebene nur für DMs. So können Sie zum Beispiel Raum-Threads isoliert halten und DMs flach lassen.
- Eingehende Thread-Nachrichten enthalten die Thread-Wurzel-Nachricht als zusätzlichen Agent-Kontext.
- Sends von Message-Tools übernehmen automatisch den aktuellen Matrix-Thread, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern kein explizites `threadId` angegeben wird.
- Die Wiederverwendung desselben sitzungsbezogenen DM-Benutzerziels greift nur, wenn die Metadaten der aktuellen Sitzung dasselbe DM-Gegenüber auf demselben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf normales benutzerbezogenes Routing zurück.
- Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum auf derselben gemeinsamen Matrix-DM-Sitzung kollidiert, veröffentlicht es in diesem Raum einmalig ein `m.notice` mit dem `/focus`-Escape-Hatch, wenn Thread-Bindings aktiviert sind und der `dm.sessionScope`-Hinweis gilt.
- Laufzeit-Thread-Bindings werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren in Matrix-Räumen und DMs.
- Top-Level-`/focus` in einem Matrix-Raum/DM erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Wenn `/focus` oder `/acp spawn --thread here` innerhalb eines bestehenden Matrix-Threads ausgeführt wird, bindet es stattdessen diesen aktuellen Thread.

## ACP-Conversation-Bindings

Matrix-Räume, DMs und bestehende Matrix-Threads können in dauerhafte ACP-Workspaces umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des bestehenden Threads aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und künftige Nachrichten werden an die erzeugte ACP-Sitzung geleitet.
- Innerhalb eines bestehenden Matrix-Threads bindet `--bind here` diesen aktuellen Thread an Ort und Stelle.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Thread-Binding-Konfiguration

Matrix übernimmt globale Standardwerte aus `session.threadBindings` und unterstützt auch kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Thread-gebundene Spawn-Flags für Matrix sind Opt-in:

- Setzen Sie `threadBindings.spawnSubagentSessions: true`, damit Top-Level-`/focus` neue Matrix-Threads erstellen und binden darf.
- Setzen Sie `threadBindings.spawnAcpSessions: true`, damit `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads binden darf.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Ack-Reaktionen.

- Tooling für ausgehende Reaktionen wird durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Event eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Event auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf dieses Event.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion des Bot-Kontos.

Der Geltungsbereich von Ack-Reaktionen wird in der standardmäßigen OpenClaw-Auflösungsreihenfolge bestimmt:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Emoji-Fallback der Agent-Identität

Der Geltungsbereich der Ack-Reaktion wird in dieser Reihenfolge bestimmt:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Der Modus für Reaktionsbenachrichtigungen wird in dieser Reihenfolge bestimmt:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- Standard: `own`

Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Events weiter, wenn sie auf vom Bot verfasste Matrix-Nachrichten abzielen.
- `reactionNotifications: "off"` deaktiviert Reaktions-System-Events.
- Das Entfernen von Reaktionen wird nicht in System-Events synthetisiert, weil Matrix diese als Redactions und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` einbezogen werden, wenn eine Matrix-Raumnachricht den Agent auslöst. Fällt zurück auf `messages.groupChat.historyLimit`; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- Der Verlauf von Matrix-Räumen ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Verlauf von Matrix-Räumen ist nur für ausstehende Nachrichten: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle auslösende Nachricht ist nicht in `InboundHistory` enthalten; sie bleibt im Hauptteil der eingehenden Nachricht für diesen Turn.
- Wiederholungen desselben Matrix-Events verwenden erneut den ursprünglichen Verlaufs-Snapshot, statt zu neueren Raumnachrichten weiterzudriften.

## Kontextsichbarkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Wurzeln und ausstehenden Verlauf.

- `contextVisibility: "all"` ist der Standard. Ergänzender Kontext wird unverändert beibehalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Allowlist-Prüfungen für Raum/Benutzer zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber weiterhin eine explizit zitierte Antwort bei.

Diese Einstellung wirkt sich auf die Sichtbarkeit ergänzenden Kontexts aus, nicht darauf, ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Autorisierung für Auslöser kommt weiterhin von `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Policy-Einstellungen.

## DM- und Raum-Policy

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

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code erneut und sendet nach einer kurzen Cooldown-Zeit möglicherweise erneut eine Erinnerungsantwort, anstatt einen neuen Code auszustellen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Reparatur direkter Räume

Wenn der Direktnachrichtenstatus aus dem Tritt gerät, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Solo-Räume statt auf die aktive DM zeigen. Prüfen Sie die aktuelle Zuordnung für ein Gegenüber mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Der Reparaturablauf:

- bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- fällt zurück auf eine aktuell beigetretene strikte 1:1-DM mit diesem Benutzer
- erstellt einen neuen direkten Raum und schreibt `m.direct` neu, wenn keine intakte DM vorhanden ist

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die intakte DM aus und aktualisiert die Zuordnung, damit neue Matrix-Sends, Verifizierungshinweise und andere Direktnachrichtenabläufe wieder den richtigen Raum ansprechen.

## Exec-Freigaben

Matrix kann als nativer Freigabe-Client für ein Matrix-Konto fungieren. Die nativen
DM-/Channel-Routing-Regler befinden sich weiterhin unter der Exec-Freigabenkonfiguration:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; fällt zurück auf `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Approver müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Freigaben automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Approver aufgelöst werden kann. Exec-Freigaben verwenden zuerst `execApprovals.approvers` und können auf `channels.matrix.dm.allowFrom` zurückfallen. Plugin-Freigaben autorisieren über `channels.matrix.dm.allowFrom`. Setzen Sie `enabled: false`, um Matrix explizit als nativen Freigabe-Client zu deaktivieren. Freigabeanfragen fallen andernfalls auf andere konfigurierte Freigaberouten oder die Fallback-Policy für Freigaben zurück.

Native Matrix-Routing unterstützt beide Freigabearten:

- `channels.matrix.execApprovals.*` steuert den nativen DM-/Channel-Fanout-Modus für Matrix-Freigabeaufforderungen.
- Exec-Freigaben verwenden den Exec-Approver-Satz aus `execApprovals.approvers` oder `channels.matrix.dm.allowFrom`.
- Plugin-Freigaben verwenden die Matrix-DM-Allowlist aus `channels.matrix.dm.allowFrom`.
- Matrix-Reaktions-Shortcuts und Nachrichtenaktualisierungen gelten für Exec- und Plugin-Freigaben.

Zustellregeln:

- `target: "dm"` sendet Freigabeaufforderungen an DMs der Approver
- `target: "channel"` sendet die Aufforderung zurück an den auslösenden Matrix-Raum oder die auslösende DM
- `target: "both"` sendet an DMs der Approver und an den auslösenden Matrix-Raum oder die auslösende DM

Matrix-Freigabeaufforderungen initialisieren Reaktions-Shortcuts auf der primären Freigabenachricht:

- `✅` = einmal erlauben
- `❌` = ablehnen
- `♾️` = immer erlauben, wenn diese Entscheidung durch die effektive Exec-Policy zulässig ist

Approver können auf diese Nachricht reagieren oder die Fallback-Slash-Befehle verwenden: `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny`.

Nur aufgelöste Approver können erlauben oder ablehnen. Bei Exec-Freigaben enthält die Channel-Zustellung den Befehlstext, daher `channel` oder `both` nur in vertrauenswürdigen Räumen aktivieren.

Überschreibung pro Konto:

- `channels.matrix.accounts.<account>.execApprovals`

Verwandte Dokumentation: [Exec approvals](/de/tools/exec-approvals)

## Slash-Befehle

Matrix-Slash-Befehle (zum Beispiel `/new`, `/reset`, `/model`) funktionieren direkt in DMs. In Räumen erkennt OpenClaw außerdem Slash-Befehle, denen die eigene Matrix-Erwähnung des Bots vorangestellt ist, sodass `@bot:server /new` den Befehlspfad auslöst, ohne dass ein benutzerdefinierter Regex für Erwähnungen nötig ist. Dadurch bleibt der Bot reaktionsfähig für raumartige Beiträge im Stil `@mention /command`, die von Element und ähnlichen Clients erzeugt werden, wenn ein Benutzer den Bot per Tab-Vervollständigung einfügt, bevor er den Befehl tippt.

Autorisierungsregeln gelten weiterhin: Absender von Befehlen müssen dieselben DM- oder Raum-Allowlist-/Owner-Richtlinien erfüllen wie bei normalen Nachrichten.

## Mehrere Konten

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
Sie können geerbte Raumeinträge mit `groups.<room>.account` auf ein Matrix-Konto beschränken.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf oberster Ebene unter `channels.matrix.*` konfiguriert ist.
Partielle gemeinsame Authentifizierungsstandardwerte erzeugen für sich genommen kein separates implizites Standardkonto. OpenClaw synthetisiert das Top-Level-Konto `default` nur dann, wenn dieses Standardkonto frische Authentifizierung hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können dennoch über `homeserver` plus `userId` auffindbar bleiben, wenn zwischengespeicherte Anmeldedaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen benannten Kontoschlüssel zeigt, bewahrt die Reparatur/Einrichtungs-Hochstufung von Einzelkonto zu Mehrkonten dieses Konto, statt einen neuen Eintrag `accounts.default` zu erzeugen. Nur Matrix-Authentifizierungs-/Bootstrap-Schlüssel werden in dieses hochgestufte Konto verschoben; gemeinsame Richtlinienschlüssel für die Zustellung bleiben auf oberster Ebene.
Setzen Sie `defaultAccount`, wenn OpenClaw ein benanntes Matrix-Konto für implizites Routing, Probing und CLI-Operationen bevorzugen soll.
Wenn mehrere Matrix-Konten konfiguriert sind und eine Konto-ID `default` ist, verwendet OpenClaw dieses Konto implizit, auch wenn `defaultAccount` nicht gesetzt ist.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie `defaultAccount` oder übergeben Sie `--account <id>` für CLI-Befehle, die auf impliziter Kontoauswahl basieren.
Übergeben Sie `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn Sie diese implizite Auswahl für einen einzelnen Befehl überschreiben möchten.

Siehe [Configuration reference](/de/gateway/configuration-reference#multi-account-all-channels) für das gemeinsame Muster mit mehreren Konten.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum Schutz vor SSRF, sofern Sie
nicht explizit pro Konto ein Opt-in setzen.

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

Dieses Opt-in erlaubt nur vertrauenswürdige private/interne Ziele. Öffentliche Homeserver im Klartext wie
`http://matrix.example.org:8008` bleiben blockiert. Verwenden Sie nach Möglichkeit `https://`.

## Proxying für Matrix-Datenverkehr

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
OpenClaw verwendet dieselbe Proxy-Einstellung für den laufenden Matrix-Datenverkehr und für Account-Status-Probes.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw Sie nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt und fallen dann auf die Suche in beigetretenen Raumnamen für dieses Konto zurück.
- Die Suche nach Namen beigetretener Räume erfolgt best effort. Wenn ein Raumname nicht zu einer ID oder einem Alias aufgelöst werden kann, wird er von der Laufzeit-Auflösung der Allowlist ignoriert.

## Konfigurationsreferenz

- `enabled`: aktiviert oder deaktiviert den Channel.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: erlaubt diesem Matrix-Konto, sich mit privaten/internen Homeservern zu verbinden. Aktivieren Sie dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Datenverkehr. Benannte Konten können den Standardwert der obersten Ebene mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Access-Token für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` über Env-/Datei-/Exec-Provider hinweg unterstützt. Siehe [Secrets Management](/de/gateway/secrets).
- `password`: Passwort für passwortbasierte Anmeldung. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts für die Passwortanmeldung.
- `avatarUrl`: gespeicherte Selbst-Avatar-URL für Profilsynchronisierung und `profile set`-Aktualisierungen.
- `initialSyncLimit`: maximale Anzahl von Events, die beim Start-Sync abgerufen werden.
- `encryption`: aktiviert E2EE.
- `allowlistOnly`: wenn `true`, wird die Raum-Policy `open` auf `allowlist` hochgestuft und alle aktiven DM-Policies außer `disabled` (einschließlich `pairing` und `open`) werden auf `allowlist` gesetzt. Wirkt sich nicht auf `disabled`-Policies aus.
- `allowBots`: erlaubt Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumverkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnisübereinstimmungen werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `historyLimit`: maximale Anzahl von Raumnachrichten, die als Gruppenverlaufs-Kontext einbezogen werden. Fällt zurück auf `messages.groupChat.historyLimit`; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- `replyToMode`: `off`, `first`, `all` oder `batched`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `"partial"`, `"quiet"`, `true` oder `false`. `"partial"` und `true` aktivieren Vorschau-zuerst-Entwurfsaktualisierungen mit normalen Matrix-Textnachrichten. `"quiet"` verwendet nicht benachrichtigende Vorschau-Hinweise für selbst gehostete Push-Regel-Setups. `false` entspricht `"off"`.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistant-Blöcke, während Entwurfs-Vorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: kanalbezogene Überschreibungen für threadgebundenes Sitzungsrouting und dessen Lebenszyklus.
- `startupVerification`: automatischer Selbstverifizierungs-Anfragemodus beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Cooldown vor erneuten Versuchen automatischer Start-Verifizierungsanfragen.
- `textChunkLimit`: Größe ausgehender Nachrichten-Chunks in Zeichen (gilt, wenn `chunkMode` auf `length` gesetzt ist).
- `chunkMode`: `length` teilt Nachrichten nach Zeichenanzahl; `newline` teilt an Zeilengrenzen.
- `responsePrefix`: optionale Zeichenfolge, die allen ausgehenden Antworten für diesen Channel vorangestellt wird.
- `ackReaction`: optionale Überschreibung der Ack-Reaktion für diesen Channel/dieses Konto.
- `ackReactionScope`: optionale Überschreibung des Geltungsbereichs der Ack-Reaktion (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Mediengrößenlimit in MB für ausgehende Sends und die Verarbeitung eingehender Medien.
- `autoJoin`: Policy für automatisches Beitreten bei Einladungen (`always`, `allowlist`, `off`). Standard: `off`. Gilt für alle Matrix-Einladungen, einschließlich DM-artiger Einladungen.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` auf `allowlist` gesetzt ist. Alias-Einträge werden während der Einladungsverarbeitung zu Raum-IDs aufgelöst; OpenClaw vertraut nicht auf den vom eingeladenen Raum behaupteten Alias-Status.
- `dm`: DM-Policy-Block (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: steuert den DM-Zugriff, nachdem OpenClaw dem Raum beigetreten ist und ihn als DM klassifiziert hat. Es ändert nicht, ob einer Einladung automatisch beigetreten wird.
- `dm.allowFrom`: Allowlist von Benutzer-IDs für DM-Verkehr. Vollständige Matrix-Benutzer-IDs sind am sichersten; exakte Verzeichnisübereinstimmungen werden beim Start und bei Änderungen der Allowlist aufgelöst, während der Monitor läuft. Nicht aufgelöste Namen werden ignoriert.
- `dm.sessionScope`: `per-user` (Standard) oder `per-room`. Verwenden Sie `per-room`, wenn Sie möchten, dass jeder Matrix-DM-Raum einen separaten Kontext behält, auch wenn das Gegenüber dasselbe ist.
- `dm.threadReplies`: DM-spezifische Überschreibung der Thread-Policy (`off`, `inbound`, `always`). Überschreibt die Top-Level-Einstellung `threadReplies` sowohl für die Platzierung von Antworten als auch für die Sitzungsisolation in DMs.
- `execApprovals`: Matrix-native Zustellung von Exec-Freigaben (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die Approver bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte Überschreibungen pro Konto. Top-Level-Werte unter `channels.matrix` dienen als Standardwerte für diese Einträge.
- `groups`: Policy-Map pro Raum. Bevorzugen Sie Raum-IDs oder Aliasse; nicht aufgelöste Raumnamen werden zur Laufzeit ignoriert. Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID.
- `groups.<room>.account`: beschränkt einen geerbten Raumeintrag in Mehrkonten-Setups auf ein bestimmtes Matrix-Konto.
- `groups.<room>.allowBots`: Überschreibung auf Raumebene für konfigurierte Bot-Absender (`true` oder `"mentions"`).
- `groups.<room>.users`: Allowlist pro Raum für Absender.
- `groups.<room>.tools`: Überschreibungen für Erlauben/Verweigern von Tools pro Raum.
- `groups.<room>.autoReply`: Überschreibung des Erwähnungs-Gatings auf Raumebene. `true` deaktiviert Erwähnungsanforderungen für diesen Raum; `false` erzwingt sie wieder.
- `groups.<room>.skills`: optionaler Skills-Filter auf Raumebene.
- `groups.<room>.systemPrompt`: optionales Snippet für den System-Prompt auf Raumebene.
- `rooms`: veralteter Alias für `groups`.
- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Erwähnungs-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
