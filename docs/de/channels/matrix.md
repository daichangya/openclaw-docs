---
read_when:
    - Einrichten von Matrix in OpenClaw
    - Konfigurieren von Matrix-E2EE und Verifizierung
summary: Matrix-Unterstützungsstatus, Einrichtung und Konfigurationsbeispiele
title: Matrix
x-i18n:
    generated_at: "2026-04-07T06:16:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d53baa2ea5916cd00a99cae0ded3be41ffa13c9a69e8ea8461eb7baa6a99e13c
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix ist das gebündelte Matrix-Kanal-Plugin für OpenClaw.
Es verwendet das offizielle `matrix-js-sdk` und unterstützt DMs, Räume, Threads, Medien, Reaktionen, Umfragen, Standort und E2EE.

## Gebündeltes Plugin

Matrix wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin mitgeliefert, daher benötigen normale
gepackte Builds keine separate Installation.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation verwenden, die Matrix ausschließt, installieren Sie
es manuell:

Von npm installieren:

```bash
openclaw plugins install @openclaw/matrix
```

Von einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Siehe [Plugins](/de/tools/plugin) für das Verhalten von Plugins und Installationsregeln.

## Einrichtung

1. Stellen Sie sicher, dass das Matrix-Plugin verfügbar ist.
   - Aktuelle gepackte OpenClaw-Versionen enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den oben genannten Befehlen hinzufügen.
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

Was der Matrix-Assistent tatsächlich abfragt:

- Homeserver-URL
- Authentifizierungsmethode: Zugriffstoken oder Passwort
- Benutzer-ID nur, wenn Sie Passwortauthentifizierung wählen
- optionaler Gerätename
- ob E2EE aktiviert werden soll
- ob der Matrix-Raumzugriff jetzt konfiguriert werden soll
- ob das automatische Beitreten zu Matrix-Einladungen jetzt konfiguriert werden soll
- wenn automatisches Beitreten zu Einladungen aktiviert ist, ob es `allowlist`, `always` oder `off` sein soll

Wichtiges Verhalten des Assistenten:

- Wenn für das ausgewählte Konto bereits Matrix-Auth-Umgebungsvariablen vorhanden sind und für dieses Konto noch keine Authentifizierung in der Konfiguration gespeichert ist, bietet der Assistent eine Umgebungsvariablen-Verknüpfung an, damit die Einrichtung die Authentifizierung in Umgebungsvariablen belassen kann, statt Geheimnisse in die Konfiguration zu kopieren.
- Wenn Sie interaktiv ein weiteres Matrix-Konto hinzufügen, wird der eingegebene Kontoname in die Konto-ID normalisiert, die in Konfiguration und Umgebungsvariablen verwendet wird. Zum Beispiel wird `Ops Bot` zu `ops-bot`.
- Prompt-Abfragen für DM-Allowlists akzeptieren sofort vollständige `@user:server`-Werte. Anzeigenamen funktionieren nur, wenn die Live-Verzeichnissuche genau einen Treffer findet; andernfalls fordert der Assistent Sie auf, es mit einer vollständigen Matrix-ID erneut zu versuchen.
- Prompt-Abfragen für Raum-Allowlists akzeptieren Raum-IDs und Aliasse direkt. Sie können auch Namen beigetretener Räume live auflösen, aber nicht aufgelöste Namen werden bei der Einrichtung nur wie eingegeben gespeichert und später von der Laufzeit-Allowlist-Auflösung ignoriert. Bevorzugen Sie `!room:server` oder `#alias:server`.
- Der Assistent zeigt jetzt vor dem Schritt zum automatischen Beitreten zu Einladungen eine explizite Warnung an, da `channels.matrix.autoJoin` standardmäßig auf `off` steht; Agents treten eingeladenen Räumen oder neuen DM-ähnlichen Einladungen nicht bei, wenn Sie dies nicht setzen.
- Im Allowlist-Modus für automatisches Beitreten zu Einladungen verwenden Sie nur stabile Einladungsziele: `!roomId:server`, `#alias:server` oder `*`. Einfache Raumnamen werden abgelehnt.
- Die Laufzeit-Raum-/Sitzungsidentität verwendet die stabile Matrix-Raum-ID. Im Raum deklarierte Aliasse werden nur als Suchparameter verwendet, nicht als langfristiger Sitzungsschlüssel oder stabile Gruppenidentität.
- Um Raumnamen vor dem Speichern aufzulösen, verwenden Sie `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` hat standardmäßig den Wert `off`.

Wenn Sie es nicht setzen, tritt der Bot eingeladenen Räumen oder neuen DM-ähnlichen Einladungen nicht bei, sodass er nicht in neuen Gruppen oder eingeladenen DMs erscheint, es sei denn, Sie treten zuerst manuell bei.

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
Wenn dort zwischengespeicherte Anmeldedaten vorhanden sind, behandelt OpenClaw Matrix für Einrichtung, Doctor und Kanalstatus-Erkennung als konfiguriert, selbst wenn die aktuelle Authentifizierung nicht direkt in der Konfiguration gesetzt ist.

Äquivalente Umgebungsvariablen (werden verwendet, wenn der Konfigurationsschlüssel nicht gesetzt ist):

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

Beispiel für das Konto `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Für die normalisierte Konto-ID `ops-bot` verwenden Sie:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix maskiert Satzzeichen in Konto-IDs, damit kontobezogene Umgebungsvariablen kollisionsfrei bleiben.
Zum Beispiel wird `-` zu `_X2D_`, sodass `ops-prod` auf `MATRIX_OPS_X2D_PROD_*` abgebildet wird.

Der interaktive Assistent bietet die Umgebungsvariablen-Verknüpfung nur an, wenn diese Auth-Umgebungsvariablen bereits vorhanden sind und für das ausgewählte Konto noch keine Matrix-Authentifizierung in der Konfiguration gespeichert ist.

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

`autoJoin` gilt allgemein für Matrix-Einladungen, nicht nur für Raum-/Gruppeneinladungen.
Dazu gehören auch neue DM-ähnliche Einladungen. Zum Zeitpunkt der Einladung weiß OpenClaw nicht zuverlässig, ob der
eingeladene Raum letztlich als DM oder als Gruppe behandelt wird, daher durchlaufen alle Einladungen zunächst dieselbe
`autoJoin`-Entscheidung. `dm.policy` gilt weiterhin, nachdem der Bot beigetreten ist und der Raum als DM
klassifiziert wurde, sodass `autoJoin` das Beitrittsverhalten steuert, während `dm.policy` das Antwort-/Zugriffs-
verhalten steuert.

## Streaming-Vorschauen

Reply-Streaming für Matrix ist optional.

Setzen Sie `channels.matrix.streaming` auf `"partial"`, wenn OpenClaw eine einzelne Live-Vorschau-
Antwort senden, diese Vorschau während der Textgenerierung des Modells direkt bearbeiten und sie dann
abschließen soll, wenn die Antwort fertig ist:

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
- `streaming: "partial"` erstellt eine bearbeitbare Vorschau-Nachricht für den aktuellen Assistant-Block mithilfe normaler Matrix-Textnachrichten. Dadurch bleibt das Legacy-Benachrichtigungsverhalten von Matrix mit Vorschau zuerst erhalten, sodass Standard-Clients möglicherweise beim ersten gestreamten Vorschautext benachrichtigen statt beim fertigen Block.
- `streaming: "quiet"` erstellt eine bearbeitbare stille Vorschau-Benachrichtigung für den aktuellen Assistant-Block. Verwenden Sie dies nur, wenn Sie zusätzlich Empfänger-Push-Regeln für abgeschlossene Vorschau-Bearbeitungen konfigurieren.
- `blockStreaming: true` aktiviert separate Matrix-Fortschrittsnachrichten. Wenn Vorschau-Streaming aktiviert ist, behält Matrix den Live-Entwurf für den aktuellen Block bei und erhält abgeschlossene Blöcke als separate Nachrichten.
- Wenn Vorschau-Streaming aktiviert ist und `blockStreaming` deaktiviert ist, bearbeitet Matrix den Live-Entwurf direkt und finalisiert dasselbe Ereignis, wenn der Block oder Turn abgeschlossen ist.
- Wenn die Vorschau nicht mehr in ein einzelnes Matrix-Ereignis passt, beendet OpenClaw das Vorschau-Streaming und wechselt zur normalen endgültigen Zustellung.
- Medienantworten senden Anhänge weiterhin normal. Wenn eine veraltete Vorschau nicht mehr sicher wiederverwendet werden kann, entfernt OpenClaw sie vor dem Senden der endgültigen Medienantwort.
- Vorschau-Bearbeitungen verursachen zusätzliche Matrix-API-Aufrufe. Lassen Sie Streaming deaktiviert, wenn Sie das konservativste Rate-Limit-Verhalten möchten.

`blockStreaming` aktiviert Vorschauentwürfe nicht von selbst.
Verwenden Sie `streaming: "partial"` oder `streaming: "quiet"` für Vorschau-Bearbeitungen; fügen Sie dann `blockStreaming: true` nur hinzu, wenn abgeschlossene Assistant-Blöcke zusätzlich als separate Fortschrittsnachrichten sichtbar bleiben sollen.

Wenn Sie Standard-Matrix-Benachrichtigungen ohne benutzerdefinierte Push-Regeln benötigen, verwenden Sie `streaming: "partial"` für Verhalten mit Vorschau zuerst oder lassen Sie `streaming` für reine Endzustellung deaktiviert. Mit `streaming: "off"` gilt:

- `blockStreaming: true` sendet jeden abgeschlossenen Block als normale benachrichtigende Matrix-Nachricht.
- `blockStreaming: false` sendet nur die endgültige abgeschlossene Antwort als normale benachrichtigende Matrix-Nachricht.

### Selbst gehostete Push-Regeln für stille abgeschlossene Vorschauen

Wenn Sie Ihre eigene Matrix-Infrastruktur betreiben und möchten, dass stille Vorschauen nur dann benachrichtigen, wenn ein Block oder
eine endgültige Antwort fertig ist, setzen Sie `streaming: "quiet"` und fügen Sie eine Push-Regel pro Benutzer für abgeschlossene Vorschau-Bearbeitungen hinzu.

Dies ist normalerweise eine Empfänger-Benutzereinrichtung, keine globale Konfigurationsänderung am Homeserver:

Kurzübersicht, bevor Sie beginnen:

- Empfängerbenutzer = die Person, die die Benachrichtigung erhalten soll
- Bot-Benutzer = das OpenClaw-Matrix-Konto, das die Antwort sendet
- verwenden Sie für die folgenden API-Aufrufe das Zugriffstoken des Empfängerbenutzers
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

3. Beschaffen Sie das Zugriffstoken des Empfängerbenutzers.
   - Verwenden Sie das Token des empfangenden Benutzers, nicht das Token des Bots.
   - Die Wiederverwendung eines vorhandenen Client-Sitzungstokens ist normalerweise am einfachsten.
   - Wenn Sie ein neues Token erzeugen müssen, können Sie sich über die standardmäßige Matrix Client-Server-API anmelden:

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

4. Prüfen Sie, ob das Empfängerkonto bereits Pusher hat:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Wenn dies keine aktiven Pusher/Geräte zurückgibt, beheben Sie zuerst die normalen Matrix-Benachrichtigungen, bevor Sie die
folgende OpenClaw-Regel hinzufügen.

OpenClaw markiert abgeschlossene reine Text-Vorschau-Bearbeitungen mit:

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
- `$USER_ACCESS_TOKEN`: das Zugriffstoken des empfangenden Benutzers
- `openclaw-finalized-preview-botname`: eine für diesen Bot und diesen empfangenden Benutzer eindeutige Regel-ID
- `@bot:example.org`: Ihre OpenClaw-Matrix-Bot-MXID, nicht die MXID des empfangenden Benutzers

Wichtig für Setups mit mehreren Bots:

- Push-Regeln sind über `ruleId` identifiziert. Ein erneuter `PUT` gegen dieselbe Regel-ID aktualisiert diese eine Regel.
- Wenn ein empfangender Benutzer für mehrere OpenClaw-Matrix-Bot-Konten benachrichtigt werden soll, erstellen Sie pro Bot eine Regel mit einer eindeutigen Regel-ID für jede Senderübereinstimmung.
- Ein einfaches Muster ist `openclaw-finalized-preview-<botname>`, zum Beispiel `openclaw-finalized-preview-ops` oder `openclaw-finalized-preview-support`.

Die Regel wird gegen den Ereignis-Sender ausgewertet:

- authentifizieren Sie sich mit dem Token des empfangenden Benutzers
- gleichen Sie `sender` mit der MXID des OpenClaw-Bots ab

6. Prüfen Sie, ob die Regel vorhanden ist:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Testen Sie eine gestreamte Antwort. Im stillen Modus sollte der Raum einen stillen Entwurfs-
   vorschau anzeigen, und die endgültige direkte Bearbeitung sollte benachrichtigen, sobald der Block oder Turn abgeschlossen ist.

Wenn Sie die Regel später entfernen müssen, löschen Sie dieselbe Regel-ID mit dem Token des empfangenden Benutzers:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Hinweise:

- Erstellen Sie die Regel mit dem Zugriffstoken des empfangenden Benutzers, nicht mit dem des Bots.
- Neue benutzerdefinierte `override`-Regeln werden vor den standardmäßigen Unterdrückungsregeln eingefügt, daher ist kein zusätzlicher Ordnungsparameter erforderlich.
- Dies betrifft nur reine Text-Vorschau-Bearbeitungen, die OpenClaw sicher direkt finalisieren kann. Medien-Fallbacks und veraltete Vorschau-Fallbacks verwenden weiterhin die normale Matrix-Zustellung.
- Wenn `GET /_matrix/client/v3/pushers` keine Pusher anzeigt, hat der Benutzer für dieses Konto/Gerät noch keine funktionierende Matrix-Push-Zustellung.

#### Synapse

Für Synapse reicht die obige Einrichtung in der Regel allein aus:

- Es ist keine spezielle Änderung an `homeserver.yaml` für abgeschlossene OpenClaw-Vorschau-Benachrichtigungen erforderlich.
- Wenn Ihre Synapse-Bereitstellung bereits normale Matrix-Push-Benachrichtigungen sendet, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn Sie Synapse hinter einem Reverse Proxy oder mit Workern betreiben, stellen Sie sicher, dass `/_matrix/client/.../pushrules/` Synapse korrekt erreicht.
- Wenn Sie Synapse-Worker verwenden, stellen Sie sicher, dass Pusher fehlerfrei funktionieren. Die Push-Zustellung wird vom Hauptprozess oder von `synapse.app.pusher` / konfigurierten Pusher-Workern verarbeitet.

#### Tuwunel

Für Tuwunel verwenden Sie denselben Einrichtungsablauf und denselben oben gezeigten Push-Regel-API-Aufruf:

- Für den Marker für abgeschlossene Vorschauen selbst ist keine Tuwunel-spezifische Konfiguration erforderlich.
- Wenn normale Matrix-Benachrichtigungen für diesen Benutzer bereits funktionieren, sind das Benutzertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.
- Wenn Benachrichtigungen zu verschwinden scheinen, während der Benutzer auf einem anderen Gerät aktiv ist, prüfen Sie, ob `suppress_push_when_active` aktiviert ist. Tuwunel hat diese Option in Tuwunel 1.4.2 am 12. September 2025 hinzugefügt, und sie kann Pushes an andere Geräte absichtlich unterdrücken, während ein Gerät aktiv ist.

## Verschlüsselung und Verifizierung

In verschlüsselten (E2EE-)Räumen verwenden ausgehende Bildereignisse `thumbnail_file`, sodass Bildvorschauen zusammen mit dem vollständigen Anhang verschlüsselt werden. Unverschlüsselte Räume verwenden weiterhin einfaches `thumbnail_url`. Es ist keine Konfiguration erforderlich — das Plugin erkennt den E2EE-Status automatisch.

### Bot-zu-Bot-Räume

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

- `allowBots: true` akzeptiert Nachrichten von anderen konfigurierten Matrix-Bot-Konten in zulässigen Räumen und DMs.
- `allowBots: "mentions"` akzeptiert diese Nachrichten in Räumen nur dann, wenn sie diesen Bot sichtbar erwähnen. DMs sind weiterhin zulässig.
- `groups.<room>.allowBots` überschreibt die Einstellung auf Kontoebene für einen Raum.
- OpenClaw ignoriert weiterhin Nachrichten von derselben Matrix-Benutzer-ID, um Selbstantwort-Schleifen zu vermeiden.
- Matrix stellt hier kein natives Bot-Flag bereit; OpenClaw behandelt „von Bots verfasst“ als „von einem anderen konfigurierten Matrix-Konto auf diesem OpenClaw-Gateway gesendet“.

Verwenden Sie strikte Raum-Allowlists und Erwähnungsanforderungen, wenn Sie Bot-zu-Bot-Verkehr in gemeinsam genutzten Räumen aktivieren.

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

Den gespeicherten Recovery-Key in die maschinenlesbare Ausgabe einschließen:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Cross-Signing- und Verifizierungsstatus initialisieren:

```bash
openclaw matrix verify bootstrap
```

Unterstützung für mehrere Konten: Verwenden Sie `channels.matrix.accounts` mit kontospezifischen Anmeldedaten und optionalem `name`. Siehe [Configuration reference](/de/gateway/configuration-reference#multi-account-all-channels) für das gemeinsame Muster.

Ausführliche Bootstrap-Diagnose:

```bash
openclaw matrix verify bootstrap --verbose
```

Vor dem Bootstrap ein neues Cross-Signing-Identitäts-Reset erzwingen:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Dieses Gerät mit einem Recovery-Key verifizieren:

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

Ausführliche Diagnose zur Backup-Integrität:

```bash
openclaw matrix verify backup status --verbose
```

Raumschlüssel aus dem Server-Backup wiederherstellen:

```bash
openclaw matrix verify backup restore
```

Ausführliche Wiederherstellungsdiagnose:

```bash
openclaw matrix verify backup restore --verbose
```

Löschen Sie das aktuelle Server-Backup und erstellen Sie eine neue Backup-Basis. Wenn der gespeicherte
Backup-Schlüssel nicht sauber geladen werden kann, kann dieses Zurücksetzen auch den Secret Storage neu erstellen, sodass
künftige Kaltstarts den neuen Backup-Schlüssel laden können:

```bash
openclaw matrix verify backup reset --yes
```

Alle `verify`-Befehle sind standardmäßig kompakt (einschließlich stiller interner SDK-Protokollierung) und zeigen detaillierte Diagnosen nur mit `--verbose`.
Verwenden Sie `--json` für vollständige maschinenlesbare Ausgabe beim Skripting.

In Setups mit mehreren Konten verwenden Matrix-CLI-Befehle das implizite Matrix-Standardkonto, sofern Sie nicht `--account <id>` übergeben.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie zuerst `channels.matrix.defaultAccount`, sonst werden diese impliziten CLI-Operationen angehalten und Sie werden aufgefordert, ein Konto explizit auszuwählen.
Verwenden Sie `--account`, wann immer Verifizierungs- oder Geräteoperationen explizit auf ein benanntes Konto zielen sollen:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Wenn die Verschlüsselung für ein benanntes Konto deaktiviert oder nicht verfügbar ist, verweisen Matrix-Warnungen und Verifizierungsfehler auf den Konfigurationsschlüssel dieses Kontos, zum Beispiel `channels.matrix.accounts.assistant.encryption`.

### Was „verifiziert“ bedeutet

OpenClaw behandelt dieses Matrix-Gerät nur dann als verifiziert, wenn es durch Ihre eigene Cross-Signing-Identität verifiziert wurde.
In der Praxis stellt `openclaw matrix verify status --verbose` drei Vertrauenssignale bereit:

- `Locally trusted`: Dieses Gerät wird nur vom aktuellen Client als vertrauenswürdig eingestuft
- `Cross-signing verified`: Das SDK meldet das Gerät als per Cross-Signing verifiziert
- `Signed by owner`: Das Gerät ist mit Ihrem eigenen Self-Signing-Schlüssel signiert

`Verified by owner` wird nur dann zu `yes`, wenn eine Cross-Signing-Verifizierung oder eine Signierung durch den Eigentümer vorliegt.
Lokales Vertrauen allein reicht nicht aus, damit OpenClaw das Gerät als vollständig verifiziert behandelt.

### Was Bootstrap macht

`openclaw matrix verify bootstrap` ist der Reparatur- und Einrichtungsbefehl für verschlüsselte Matrix-Konten.
Er erledigt der Reihe nach Folgendes:

- initialisiert Secret Storage und verwendet nach Möglichkeit einen vorhandenen Recovery-Key erneut
- initialisiert Cross-Signing und lädt fehlende öffentliche Cross-Signing-Schlüssel hoch
- versucht, das aktuelle Gerät zu markieren und per Cross-Signing zu signieren
- erstellt ein neues serverseitiges Raumschlüssel-Backup, falls noch keines vorhanden ist

Wenn der Homeserver interaktive Authentifizierung erfordert, um Cross-Signing-Schlüssel hochzuladen, versucht OpenClaw den Upload zuerst ohne Authentifizierung, dann mit `m.login.dummy`, dann mit `m.login.password`, wenn `channels.matrix.password` konfiguriert ist.

Verwenden Sie `--force-reset-cross-signing` nur, wenn Sie die aktuelle Cross-Signing-Identität absichtlich verwerfen und eine neue erstellen möchten.

Wenn Sie das aktuelle Raumschlüssel-Backup absichtlich verwerfen und eine neue
Backup-Basis für zukünftige Nachrichten starten möchten, verwenden Sie `openclaw matrix verify backup reset --yes`.
Tun Sie dies nur, wenn Sie akzeptieren, dass nicht wiederherstellbarer alter verschlüsselter Verlauf
nicht verfügbar bleibt und dass OpenClaw Secret Storage möglicherweise neu erstellt, wenn das aktuelle Backup-
Geheimnis nicht sicher geladen werden kann.

### Neue Backup-Basis

Wenn Sie möchten, dass künftige verschlüsselte Nachrichten weiterhin funktionieren, und den Verlust nicht wiederherstellbaren alten Verlaufs akzeptieren, führen Sie diese Befehle in dieser Reihenfolge aus:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Fügen Sie jedem Befehl `--account <id>` hinzu, wenn Sie explizit auf ein benanntes Matrix-Konto zielen möchten.

### Startverhalten

Wenn `encryption: true` gesetzt ist, verwendet Matrix für `startupVerification` standardmäßig `"if-unverified"`.
Beim Start fordert Matrix, falls dieses Gerät noch nicht verifiziert ist, in einem anderen Matrix-Client eine Selbstverifizierung an,
überspringt doppelte Anforderungen, wenn bereits eine aussteht, und wendet vor einem erneuten Versuch nach Neustarts eine lokale Abklingzeit an.
Fehlgeschlagene Anforderungsversuche werden standardmäßig früher erneut versucht als erfolgreich erstellte Anforderungen.
Setzen Sie `startupVerification: "off"`, um automatische Startanforderungen zu deaktivieren, oder passen Sie `startupVerificationCooldownHours`
an, wenn Sie ein kürzeres oder längeres Wiederholungsfenster wünschen.

Beim Start wird außerdem automatisch ein konservativer Crypto-Bootstrap-Durchlauf durchgeführt.
Dieser Durchlauf versucht zuerst, den aktuellen Secret Storage und die aktuelle Cross-Signing-Identität wiederzuverwenden, und vermeidet ein Zurücksetzen von Cross-Signing, sofern Sie keinen expliziten Bootstrap-Reparaturablauf ausführen.

Wenn beim Start ein fehlerhafter Bootstrap-Status gefunden wird und `channels.matrix.password` konfiguriert ist, kann OpenClaw einen strengeren Reparaturpfad versuchen.
Wenn das aktuelle Gerät bereits vom Eigentümer signiert ist, bewahrt OpenClaw diese Identität, statt sie automatisch zurückzusetzen.

Upgrade vom vorherigen öffentlichen Matrix-Plugin:

- OpenClaw verwendet nach Möglichkeit automatisch dasselbe Matrix-Konto, dasselbe Zugriffstoken und dieselbe Geräteidentität weiter.
- Bevor umsetzbare Matrix-Migrationsänderungen ausgeführt werden, erstellt OpenClaw unter `~/Backups/openclaw-migrations/` einen Recovery-Snapshot oder verwendet einen vorhandenen erneut.
- Wenn Sie mehrere Matrix-Konten verwenden, setzen Sie `channels.matrix.defaultAccount`, bevor Sie vom alten Flat-Store-Layout upgraden, damit OpenClaw weiß, welches Konto diesen gemeinsam genutzten Legacy-Status erhalten soll.
- Wenn das vorherige Plugin einen Matrix-Raumschlüssel-Backup-Entschlüsselungsschlüssel lokal gespeichert hat, importieren der Start oder `openclaw doctor --fix` ihn automatisch in den neuen Recovery-Key-Ablauf.
- Wenn sich das Matrix-Zugriffstoken geändert hat, nachdem die Migration vorbereitet wurde, durchsucht der Start jetzt benachbarte Token-Hash-Speicherwurzeln nach ausstehendem Legacy-Wiederherstellungsstatus, bevor die automatische Backup-Wiederherstellung aufgegeben wird.
- Wenn sich das Matrix-Zugriffstoken später für dasselbe Konto, denselben Homeserver und denselben Benutzer ändert, bevorzugt OpenClaw jetzt die Wiederverwendung der vollständigsten vorhandenen Token-Hash-Speicherwurzel, statt mit einem leeren Matrix-Statusverzeichnis zu beginnen.
- Beim nächsten Gateway-Start werden gesicherte Raumschlüssel automatisch in den neuen Crypto-Store wiederhergestellt.
- Wenn das alte Plugin nur lokal vorhandene Raumschlüssel hatte, die nie gesichert wurden, warnt OpenClaw dies klar. Diese Schlüssel können nicht automatisch aus dem vorherigen Rust-Crypto-Store exportiert werden, daher bleibt möglicherweise ein Teil des alten verschlüsselten Verlaufs unzugänglich, bis er manuell wiederhergestellt wird.
- Siehe [Matrix migration](/de/install/migrating-matrix) für den vollständigen Upgrade-Ablauf, Grenzen, Recovery-Befehle und häufige Migrationsmeldungen.

Verschlüsselter Laufzeitstatus ist unter konto-, benutzer- und tokenhashspezifischen Wurzeln in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` organisiert.
Dieses Verzeichnis enthält den Sync-Store (`bot-storage.json`), den Crypto-Store (`crypto/`),
die Recovery-Key-Datei (`recovery-key.json`), den IndexedDB-Snapshot (`crypto-idb-snapshot.json`),
Thread-Bindings (`thread-bindings.json`) und den Startverifizierungsstatus (`startup-verification.json`),
wenn diese Funktionen verwendet werden.
Wenn sich das Token ändert, die Kontoidentität aber gleich bleibt, verwendet OpenClaw die beste vorhandene
Wurzel für dieses Konto/Homeserver/Benutzer-Tupel wieder, sodass vorheriger Sync-Status, Crypto-Status, Thread-Bindings
und Startverifizierungsstatus sichtbar bleiben.

### Node-Crypto-Store-Modell

Matrix-E2EE in diesem Plugin verwendet in Node den offiziellen Rust-Crypto-Pfad von `matrix-js-sdk`.
Dieser Pfad erwartet IndexedDB-basierte Persistenz, wenn der Crypto-Status Neustarts überdauern soll.

OpenClaw stellt dies in Node derzeit bereit durch:

- Verwendung von `fake-indexeddb` als vom SDK erwarteter IndexedDB-API-Shim
- Wiederherstellung des Rust-Crypto-IndexedDB-Inhalts aus `crypto-idb-snapshot.json` vor `initRustCrypto`
- Persistieren des aktualisierten IndexedDB-Inhalts zurück nach `crypto-idb-snapshot.json` nach der Initialisierung und während der Laufzeit
- Serialisieren von Snapshot-Wiederherstellung und -Persistierung gegenüber `crypto-idb-snapshot.json` mit einer beratenden Dateisperre, damit Gateway-Laufzeitpersistenz und CLI-Wartung nicht auf dieselbe Snapshot-Datei zugreifen

Dies ist Kompatibilitäts-/Speicherinfrastruktur, keine benutzerdefinierte Crypto-Implementierung.
Die Snapshot-Datei ist sensibler Laufzeitstatus und wird mit restriktiven Dateiberechtigungen gespeichert.
Unter dem Sicherheitsmodell von OpenClaw befinden sich der Gateway-Host und das lokale OpenClaw-Statusverzeichnis bereits innerhalb der vertrauenswürdigen Betreibergrenze, daher ist dies primär ein Thema der betrieblichen Haltbarkeit und keine separate Remote-Vertrauensgrenze.

Geplante Verbesserung:

- SecretRef-Unterstützung für persistentes Matrix-Schlüsselmaterial hinzufügen, sodass Recovery-Keys und zugehörige Store-Verschlüsselungsgeheimnisse von OpenClaw-Geheimnisanbietern statt nur aus lokalen Dateien bezogen werden können

## Profilverwaltung

Aktualisieren Sie das Matrix-Selbstprofil für das ausgewählte Konto mit:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Fügen Sie `--account <id>` hinzu, wenn Sie explizit auf ein benanntes Matrix-Konto zielen möchten.

Matrix akzeptiert `mxc://`-Avatar-URLs direkt. Wenn Sie eine Avatar-URL mit `http://` oder `https://` übergeben, lädt OpenClaw sie zuerst zu Matrix hoch und speichert die aufgelöste `mxc://`-URL zurück in `channels.matrix.avatarUrl` (oder in die ausgewählte Kontoüberschreibung).

## Automatische Verifizierungshinweise

Matrix veröffentlicht jetzt Hinweise zum Verifizierungslebenszyklus direkt als `m.notice`-Nachrichten im strikten DM-Verifizierungsraum.
Dazu gehören:

- Hinweise zu Verifizierungsanforderungen
- Hinweise, dass die Verifizierung bereit ist (mit explizitem Hinweis „Per Emoji verifizieren“)
- Hinweise zum Start und Abschluss der Verifizierung
- SAS-Details (Emoji und Dezimalzahlen), wenn verfügbar

Eingehende Verifizierungsanforderungen von einem anderen Matrix-Client werden verfolgt und von OpenClaw automatisch akzeptiert.
Bei Selbstverifizierungsabläufen startet OpenClaw den SAS-Ablauf außerdem automatisch, sobald die Emoji-Verifizierung verfügbar wird, und bestätigt die eigene Seite.
Bei Verifizierungsanforderungen von einem anderen Matrix-Benutzer/Gerät akzeptiert OpenClaw die Anforderung automatisch und wartet dann, bis der SAS-Ablauf normal fortgesetzt wird.
Sie müssen die Emoji- oder dezimale SAS dennoch in Ihrem Matrix-Client vergleichen und dort „Sie stimmen überein“ bestätigen, um die Verifizierung abzuschließen.

OpenClaw akzeptiert nicht blind selbst initiierte doppelte Abläufe automatisch. Beim Start wird keine neue Anforderung erstellt, wenn bereits eine Selbstverifizierungsanforderung aussteht.

Hinweise zum Verifizierungsprotokoll/System werden nicht an die Agent-Chat-Pipeline weitergeleitet, sodass sie kein `NO_REPLY` erzeugen.

### Gerätehygiene

Alte von OpenClaw verwaltete Matrix-Geräte können sich im Konto ansammeln und das Vertrauen in verschlüsselten Räumen schwerer nachvollziehbar machen.
Listen Sie sie auf mit:

```bash
openclaw matrix devices list
```

Entfernen Sie veraltete von OpenClaw verwaltete Geräte mit:

```bash
openclaw matrix devices prune-stale
```

### Reparatur direkter Räume

Wenn der Direktnachrichtenstatus nicht mehr synchron ist, kann OpenClaw veraltete `m.direct`-Zuordnungen erhalten, die auf alte Einzelräume statt auf die aktuelle DM zeigen. Prüfen Sie die aktuelle Zuordnung für einen Peer mit:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Reparieren Sie sie mit:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Die Reparatur hält die Matrix-spezifische Logik innerhalb des Plugins:

- sie bevorzugt eine strikte 1:1-DM, die bereits in `m.direct` zugeordnet ist
- andernfalls greift sie auf eine aktuell beigetretene strikte 1:1-DM mit diesem Benutzer zurück
- wenn keine intakte DM existiert, erstellt sie einen neuen direkten Raum und schreibt `m.direct` so um, dass darauf verwiesen wird

Der Reparaturablauf löscht alte Räume nicht automatisch. Er wählt nur die intakte DM aus und aktualisiert die Zuordnung, damit neue Matrix-Sendungen, Verifizierungshinweise und andere Direktnachrichtenabläufe wieder auf den richtigen Raum zielen.

## Threads

Matrix unterstützt native Matrix-Threads sowohl für automatische Antworten als auch für Message-Tool-Sendungen.

- `dm.sessionScope: "per-user"` (Standard) hält das Matrix-DM-Routing absenderspezifisch, sodass mehrere DM-Räume eine Sitzung gemeinsam nutzen können, wenn sie zum selben Peer aufgelöst werden.
- `dm.sessionScope: "per-room"` isoliert jeden Matrix-DM-Raum in einen eigenen Sitzungsschlüssel und verwendet dabei weiterhin normale DM-Authentifizierungs- und Allowlist-Prüfungen.
- Explizite Matrix-Konversationsbindungen haben weiterhin Vorrang vor `dm.sessionScope`, sodass gebundene Räume und Threads ihre gewählte Zielsitzung behalten.
- `threadReplies: "off"` hält Antworten auf oberster Ebene und belässt eingehende Thread-Nachrichten in der übergeordneten Sitzung.
- `threadReplies: "inbound"` antwortet innerhalb eines Threads nur dann, wenn die eingehende Nachricht bereits in diesem Thread war.
- `threadReplies: "always"` hält Raumantworten in einem Thread, der an der auslösenden Nachricht verankert ist, und leitet diese Unterhaltung ab der ersten auslösenden Nachricht durch die passende threadbezogene Sitzung.
- `dm.threadReplies` überschreibt die Einstellung auf oberster Ebene nur für DMs. So können Sie zum Beispiel Raum-Threads isoliert halten, während DMs flach bleiben.
- Eingehende Thread-Nachrichten enthalten die Thread-Stammnachricht als zusätzlichen Agent-Kontext.
- Message-Tool-Sendungen übernehmen jetzt automatisch den aktuellen Matrix-Thread, wenn das Ziel derselbe Raum oder dasselbe DM-Benutzerziel ist, sofern keine explizite `threadId` angegeben ist.
- Die Wiederverwendung desselben DM-Benutzerziels für dieselbe Sitzung greift nur, wenn die Metadaten der aktuellen Sitzung denselben DM-Peer auf demselben Matrix-Konto nachweisen; andernfalls fällt OpenClaw auf normales benutzerspezifisches Routing zurück.
- Wenn OpenClaw erkennt, dass ein Matrix-DM-Raum mit einem anderen DM-Raum in derselben gemeinsamen Matrix-DM-Sitzung kollidiert, veröffentlicht es in diesem Raum einmalig ein `m.notice` mit dem Ausweg `/focus`, wenn Thread-Bindings aktiviert sind und dem Hinweis `dm.sessionScope`.
- Laufzeit-Thread-Bindings werden für Matrix unterstützt. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und threadgebundenes `/acp spawn` funktionieren jetzt in Matrix-Räumen und DMs.
- `/focus` auf oberster Ebene in Matrix-Raum/DM erstellt einen neuen Matrix-Thread und bindet ihn an die Zielsitzung, wenn `threadBindings.spawnSubagentSessions=true`.
- Das Ausführen von `/focus` oder `/acp spawn --thread here` innerhalb eines vorhandenen Matrix-Threads bindet stattdessen diesen aktuellen Thread.

## ACP-Konversationsbindungen

Matrix-Räume, DMs und vorhandene Matrix-Threads können in dauerhafte ACP-Arbeitsbereiche umgewandelt werden, ohne die Chat-Oberfläche zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der Matrix-DM, des Raums oder des vorhandenen Threads aus, den Sie weiterverwenden möchten.
- In einer Matrix-DM oder einem Raum auf oberster Ebene bleibt die aktuelle DM bzw. der aktuelle Raum die Chat-Oberfläche, und zukünftige Nachrichten werden an die erzeugte ACP-Sitzung weitergeleitet.
- Innerhalb eines vorhandenen Matrix-Threads bindet `--bind here` diesen aktuellen Thread direkt.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Hinweise:

- `--bind here` erstellt keinen untergeordneten Matrix-Thread.
- `threadBindings.spawnAcpSessions` ist nur für `/acp spawn --thread auto|here` erforderlich, wenn OpenClaw einen untergeordneten Matrix-Thread erstellen oder binden muss.

### Konfiguration für Thread-Bindings

Matrix übernimmt globale Standardwerte von `session.threadBindings` und unterstützt zusätzlich kanalbezogene Überschreibungen:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Die threadgebundenen Spawn-Flags für Matrix sind Opt-in:

- Setzen Sie `threadBindings.spawnSubagentSessions: true`, damit `/focus` auf oberster Ebene neue Matrix-Threads erstellen und binden darf.
- Setzen Sie `threadBindings.spawnAcpSessions: true`, damit `/acp spawn --thread auto|here` ACP-Sitzungen an Matrix-Threads binden darf.

## Reaktionen

Matrix unterstützt ausgehende Reaktionsaktionen, eingehende Reaktionsbenachrichtigungen und eingehende Bestätigungsreaktionen.

- Outbound-Reaktions-Tooling wird durch `channels["matrix"].actions.reactions` gesteuert.
- `react` fügt einem bestimmten Matrix-Ereignis eine Reaktion hinzu.
- `reactions` listet die aktuelle Reaktionszusammenfassung für ein bestimmtes Matrix-Ereignis auf.
- `emoji=""` entfernt die eigenen Reaktionen des Bot-Kontos auf dieses Ereignis.
- `remove: true` entfernt nur die angegebene Emoji-Reaktion vom Bot-Konto.

Der Geltungsbereich von Bestätigungsreaktionen wird in dieser Reihenfolge aufgelöst:

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

Aktuelles Verhalten:

- `reactionNotifications: "own"` leitet hinzugefügte `m.reaction`-Ereignisse weiter, wenn sie sich auf vom Bot verfasste Matrix-Nachrichten beziehen.
- `reactionNotifications: "off"` deaktiviert Reaktionssystemereignisse.
- Das Entfernen von Reaktionen wird weiterhin nicht in Systemereignisse synthetisiert, da Matrix diese als Redaktionen und nicht als eigenständige `m.reaction`-Entfernungen darstellt.

## Verlaufskontext

- `channels.matrix.historyLimit` steuert, wie viele aktuelle Raumnachrichten als `InboundHistory` aufgenommen werden, wenn eine Matrix-Raumnachricht den Agent auslöst.
- Es greift auf `messages.groupChat.historyLimit` zurück. Wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`, sodass erwähnungsgesteuerte Raumnachrichten nicht gepuffert werden. Setzen Sie `0`, um dies zu deaktivieren.
- Der Matrix-Raumverlauf ist nur raumbezogen. DMs verwenden weiterhin den normalen Sitzungsverlauf.
- Der Matrix-Raumverlauf ist nur ausstehend: OpenClaw puffert Raumnachrichten, die noch keine Antwort ausgelöst haben, und erstellt dann einen Snapshot dieses Fensters, wenn eine Erwähnung oder ein anderer Auslöser eintrifft.
- Die aktuelle Auslösernachricht wird nicht in `InboundHistory` aufgenommen; sie verbleibt im Haupttext der eingehenden Nachricht für diesen Turn.
- Wiederholungen desselben Matrix-Ereignisses verwenden den ursprünglichen Verlaufssnapshot erneut, statt zu neueren Raumnachrichten weiterzudriften.

## Kontextsichtigkeit

Matrix unterstützt die gemeinsame Steuerung `contextVisibility` für ergänzenden Raumkontext wie abgerufenen Antworttext, Thread-Wurzeln und ausstehenden Verlauf.

- `contextVisibility: "all"` ist die Standardeinstellung. Ergänzender Kontext wird unverändert beibehalten.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Absender, die durch die aktiven Raum-/Benutzer-Allowlist-Prüfungen zugelassen sind.
- `contextVisibility: "allowlist_quote"` verhält sich wie `allowlist`, behält aber weiterhin ein explizites zitiertes Reply bei.

Diese Einstellung betrifft die Sichtbarkeit ergänzenden Kontexts, nicht die Frage, ob die eingehende Nachricht selbst eine Antwort auslösen kann.
Die Autorisierung von Auslösern kommt weiterhin von `groupPolicy`, `groups`, `groupAllowFrom` und den DM-Richtlinieneinstellungen.

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

Siehe [Groups](/de/channels/groups) für Verhalten bei Erwähnungssteuerung und Allowlist.

Pairing-Beispiel für Matrix-DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Wenn ein nicht genehmigter Matrix-Benutzer Ihnen vor der Genehmigung weiterhin Nachrichten sendet, verwendet OpenClaw denselben ausstehenden Pairing-Code wieder und sendet nach einer kurzen Abklingzeit möglicherweise erneut eine Erinnerungsantwort, statt einen neuen Code zu erzeugen.

Siehe [Pairing](/de/channels/pairing) für den gemeinsamen DM-Pairing-Ablauf und das Speicherlayout.

## Exec-Genehmigungen

Matrix kann für ein Matrix-Konto als Client für Exec-Genehmigungen fungieren.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (optional; greift auf `channels.matrix.dm.allowFrom` zurück)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Genehmiger müssen Matrix-Benutzer-IDs wie `@owner:example.org` sein. Matrix aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmiger aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `channels.matrix.dm.allowFrom`. Setzen Sie `enabled: false`, um Matrix explizit als nativen Genehmigungs-Client zu deaktivieren. Genehmigungsanforderungen greifen andernfalls auf andere konfigurierte Genehmigungsrouten oder die Fallback-Richtlinie für Exec-Genehmigungen zurück.

Natives Matrix-Routing ist derzeit nur für Exec vorgesehen:

- `channels.matrix.execApprovals.*` steuert natives DM-/Kanal-Routing nur für Exec-Genehmigungen.
- Plugin-Genehmigungen verwenden weiterhin das gemeinsame `/approve` im selben Chat plus gegebenenfalls konfiguriertes `approvals.plugin`-Weiterleiten.
- Matrix kann weiterhin `channels.matrix.dm.allowFrom` für die Autorisierung von Plugin-Genehmigungen wiederverwenden, wenn Genehmiger sicher abgeleitet werden können, stellt aber keinen separaten nativen DM-/Kanal-Fanout-Pfad für Plugin-Genehmigungen bereit.

Zustellungsregeln:

- `target: "dm"` sendet Genehmigungsaufforderungen an die DMs der Genehmiger
- `target: "channel"` sendet die Aufforderung zurück an den ursprünglichen Matrix-Raum oder die ursprüngliche DM
- `target: "both"` sendet an die DMs der Genehmiger und an den ursprünglichen Matrix-Raum oder die ursprüngliche DM

Matrix-Genehmigungsaufforderungen setzen Reaktionskürzel auf der primären Genehmigungsnachricht:

- `✅` = einmal erlauben
- `❌` = ablehnen
- `♾️` = immer erlauben, wenn diese Entscheidung durch die effektive Exec-Richtlinie zulässig ist

Genehmiger können auf diese Nachricht reagieren oder die Fallback-Slash-Befehle verwenden: `/approve <id> allow-once`, `/approve <id> allow-always` oder `/approve <id> deny`.

Nur aufgelöste Genehmiger können genehmigen oder ablehnen. Bei Kanalzustellung ist der Befehlstext enthalten, aktivieren Sie `channel` oder `both` daher nur in vertrauenswürdigen Räumen.

Matrix-Genehmigungsaufforderungen verwenden den gemeinsamen Core-Genehmigungsplaner wieder. Die Matrix-spezifische native Oberfläche ist nur der Transport für Exec-Genehmigungen: Raum-/DM-Routing und Verhalten beim Senden/Aktualisieren/Löschen von Nachrichten.

Kontobezogene Überschreibung:

- `channels.matrix.accounts.<account>.execApprovals`

Zugehörige Dokumentation: [Exec approvals](/de/tools/exec-approvals)

## Beispiel mit mehreren Konten

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

Werte auf oberster Ebene in `channels.matrix` dienen als Standardwerte für benannte Konten, sofern ein Konto sie nicht überschreibt.
Sie können geerbte Raumeinträge mit `groups.<room>.account` (oder Legacy-`rooms.<room>.account`) auf ein Matrix-Konto beschränken.
Einträge ohne `account` bleiben über alle Matrix-Konten hinweg gemeinsam genutzt, und Einträge mit `account: "default"` funktionieren weiterhin, wenn das Standardkonto direkt auf oberster Ebene in `channels.matrix.*` konfiguriert ist.
Teilweise gemeinsame Authentifizierungsstandards erzeugen für sich genommen kein separates implizites Standardkonto. OpenClaw synthetisiert das `default`-Konto auf oberster Ebene nur, wenn dieses Standardkonto frische Authentifizierung hat (`homeserver` plus `accessToken` oder `homeserver` plus `userId` und `password`); benannte Konten können weiterhin durch `homeserver` plus `userId` erkennbar bleiben, wenn zwischengespeicherte Anmeldedaten die Authentifizierung später erfüllen.
Wenn Matrix bereits genau ein benanntes Konto hat oder `defaultAccount` auf einen vorhandenen benannten Kontoschlüssel verweist, bewahrt die Reparatur/Einrichtungs-Promotion von Einzelkonto zu Mehrfachkonto dieses Konto, statt einen neuen Eintrag `accounts.default` zu erstellen. Nur Matrix-Auth-/Bootstrap-Schlüssel werden in dieses hochgestufte Konto verschoben; gemeinsam genutzte Zustellungsrichtlinien-Schlüssel bleiben auf oberster Ebene.
Setzen Sie `defaultAccount`, wenn OpenClaw ein benanntes Matrix-Konto für implizites Routing, Probing und CLI-Operationen bevorzugen soll.
Wenn Sie mehrere benannte Konten konfigurieren, setzen Sie `defaultAccount` oder übergeben Sie `--account <id>` für CLI-Befehle, die auf impliziter Kontenauswahl basieren.
Übergeben Sie `--account <id>` an `openclaw matrix verify ...` und `openclaw matrix devices ...`, wenn Sie diese implizite Auswahl für einen Befehl überschreiben möchten.

## Private/LAN-Homeserver

Standardmäßig blockiert OpenClaw private/interne Matrix-Homeserver zum Schutz vor SSRF, sofern Sie
nicht explizit pro Konto zustimmen.

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

## Matrix-Verkehr über Proxy leiten

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
OpenClaw verwendet dieselbe Proxy-Einstellung für Matrix-Laufzeitverkehr und Konto-Statusabfragen.

## Zielauflösung

Matrix akzeptiert diese Zielformen überall dort, wo OpenClaw nach einem Raum- oder Benutzerziel fragt:

- Benutzer: `@user:server`, `user:@user:server` oder `matrix:user:@user:server`
- Räume: `!room:server`, `room:!room:server` oder `matrix:room:!room:server`
- Aliasse: `#alias:server`, `channel:#alias:server` oder `matrix:channel:#alias:server`

Die Live-Verzeichnissuche verwendet das angemeldete Matrix-Konto:

- Benutzersuchen fragen das Matrix-Benutzerverzeichnis auf diesem Homeserver ab.
- Raumsuchen akzeptieren explizite Raum-IDs und Aliasse direkt und greifen dann auf die Suche nach Namen beigetretener Räume für dieses Konto zurück.
- Die Suche nach Namen beigetretener Räume erfolgt nach bestem Bemühen. Wenn ein Raumname nicht in eine ID oder einen Alias aufgelöst werden kann, wird er von der Laufzeit-Allowlist-Auflösung ignoriert.

## Konfigurationsreferenz

- `enabled`: den Kanal aktivieren oder deaktivieren.
- `name`: optionales Label für das Konto.
- `defaultAccount`: bevorzugte Konto-ID, wenn mehrere Matrix-Konten konfiguriert sind.
- `homeserver`: Homeserver-URL, zum Beispiel `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: diesem Matrix-Konto erlauben, sich mit privaten/internen Homeservern zu verbinden. Aktivieren Sie dies, wenn der Homeserver zu `localhost`, einer LAN-/Tailscale-IP oder einem internen Host wie `matrix-synapse` aufgelöst wird.
- `proxy`: optionale HTTP(S)-Proxy-URL für Matrix-Verkehr. Benannte Konten können den Standardwert auf oberster Ebene mit ihrem eigenen `proxy` überschreiben.
- `userId`: vollständige Matrix-Benutzer-ID, zum Beispiel `@bot:example.org`.
- `accessToken`: Zugriffstoken für tokenbasierte Authentifizierung. Klartextwerte und SecretRef-Werte werden für `channels.matrix.accessToken` und `channels.matrix.accounts.<id>.accessToken` über env/file/exec-Anbieter unterstützt. Siehe [Secrets Management](/de/gateway/secrets).
- `password`: Passwort für die passwortbasierte Anmeldung. Klartextwerte und SecretRef-Werte werden unterstützt.
- `deviceId`: explizite Matrix-Geräte-ID.
- `deviceName`: Anzeigename des Geräts für Passwortanmeldung.
- `avatarUrl`: gespeicherte Selbst-Avatar-URL für Profilsynchronisierung und `set-profile`-Aktualisierungen.
- `initialSyncLimit`: Ereignislimit für den Start-Sync.
- `encryption`: E2EE aktivieren.
- `allowlistOnly`: Verhalten nur mit Allowlist für DMs und Räume erzwingen.
- `allowBots`: Nachrichten von anderen konfigurierten OpenClaw-Matrix-Konten zulassen (`true` oder `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oder `disabled`.
- `contextVisibility`: Sichtbarkeitsmodus für ergänzenden Raumkontext (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: Allowlist von Benutzer-IDs für Raumverkehr.
- Einträge in `groupAllowFrom` sollten vollständige Matrix-Benutzer-IDs sein. Nicht aufgelöste Namen werden zur Laufzeit ignoriert.
- `historyLimit`: maximale Anzahl an Raumnachrichten, die als Gruppenverlaufs-Kontext aufgenommen werden. Greift auf `messages.groupChat.historyLimit` zurück; wenn beide nicht gesetzt sind, ist der effektive Standardwert `0`. Setzen Sie `0`, um dies zu deaktivieren.
- `replyToMode`: `off`, `first`, `all` oder `batched`.
- `markdown`: optionale Markdown-Rendering-Konfiguration für ausgehenden Matrix-Text.
- `streaming`: `off` (Standard), `partial`, `quiet`, `true` oder `false`. `partial` und `true` aktivieren Vorschau-zuerst-Entwurfsaktualisierungen mit normalen Matrix-Textnachrichten. `quiet` verwendet nicht benachrichtigende Vorschau-Hinweise für selbst gehostete Push-Regel-Setups.
- `blockStreaming`: `true` aktiviert separate Fortschrittsnachrichten für abgeschlossene Assistant-Blöcke, während Entwurfsvorschau-Streaming aktiv ist.
- `threadReplies`: `off`, `inbound` oder `always`.
- `threadBindings`: kanalbezogene Überschreibungen für threadgebundenes Sitzungsrouting und Lebenszyklus.
- `startupVerification`: Modus für automatische Selbstverifizierungsanforderung beim Start (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: Abklingzeit, bevor automatische Start-Verifizierungsanforderungen erneut versucht werden.
- `textChunkLimit`: Chunk-Größe für ausgehende Nachrichten.
- `chunkMode`: `length` oder `newline`.
- `responsePrefix`: optionales Nachrichtenpräfix für ausgehende Antworten.
- `ackReaction`: optionale Überschreibung der Bestätigungsreaktion für diesen Kanal/dieses Konto.
- `ackReactionScope`: optionale Überschreibung des Geltungsbereichs der Bestätigungsreaktion (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: Modus für eingehende Reaktionsbenachrichtigungen (`own`, `off`).
- `mediaMaxMb`: Größenobergrenze für Medien in MB bei der Matrix-Medienverarbeitung. Sie gilt für ausgehende Sendungen und die Verarbeitung eingehender Medien.
- `autoJoin`: Richtlinie für automatisches Beitreten zu Einladungen (`always`, `allowlist`, `off`). Standard: `off`. Dies gilt allgemein für Matrix-Einladungen, einschließlich DM-ähnlicher Einladungen, nicht nur für Raum-/Gruppeneinladungen. OpenClaw trifft diese Entscheidung zum Zeitpunkt der Einladung, bevor es den beigetretenen Raum zuverlässig als DM oder Gruppe klassifizieren kann.
- `autoJoinAllowlist`: Räume/Aliasse, die erlaubt sind, wenn `autoJoin` den Wert `allowlist` hat. Alias-Einträge werden bei der Verarbeitung von Einladungen in Raum-IDs aufgelöst; OpenClaw vertraut nicht auf vom eingeladenen Raum behaupteten Alias-Status.
- `dm`: DM-Richtlinienblock (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: steuert den DM-Zugriff, nachdem OpenClaw dem Raum beigetreten ist und ihn als DM klassifiziert hat. Es ändert nicht, ob einer Einladung automatisch beigetreten wird.
- Einträge in `dm.allowFrom` sollten vollständige Matrix-Benutzer-IDs sein, sofern Sie sie nicht bereits über die Live-Verzeichnissuche aufgelöst haben.
- `dm.sessionScope`: `per-user` (Standard) oder `per-room`. Verwenden Sie `per-room`, wenn jeder Matrix-DM-Raum einen separaten Kontext behalten soll, auch wenn der Peer derselbe ist.
- `dm.threadReplies`: DM-spezifische Überschreibung der Thread-Richtlinie (`off`, `inbound`, `always`). Sie überschreibt die Einstellung `threadReplies` auf oberster Ebene sowohl für die Platzierung von Antworten als auch für die Sitzungsisolierung in DMs.
- `execApprovals`: Matrix-native Zustellung für Exec-Genehmigungen (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Optional, wenn `dm.allowFrom` die Genehmiger bereits identifiziert.
- `execApprovals.target`: `dm | channel | both` (Standard: `dm`).
- `accounts`: benannte kontobezogene Überschreibungen. Werte auf oberster Ebene in `channels.matrix` dienen als Standardwerte für diese Einträge.
- `groups`: raumspezifische Richtlinienzuordnung. Bevorzugen Sie Raum-IDs oder Aliasse; nicht aufgelöste Raumnamen werden zur Laufzeit ignoriert. Die Sitzungs-/Gruppenidentität verwendet nach der Auflösung die stabile Raum-ID, während menschenlesbare Labels weiterhin aus Raumnamen stammen.
- `groups.<room>.account`: beschränkt einen geerbten Raumeintrag in Setups mit mehreren Konten auf ein bestimmtes Matrix-Konto.
- `groups.<room>.allowBots`: Überschreibung auf Raumebene für Sender aus konfigurierten Bots (`true` oder `"mentions"`).
- `groups.<room>.users`: absenderspezifische Allowlist pro Raum.
- `groups.<room>.tools`: raumspezifische Tool-Zulassen-/Ablehnen-Überschreibungen.
- `groups.<room>.autoReply`: Überschreibung der Erwähnungssteuerung auf Raumebene. `true` deaktiviert Erwähnungsanforderungen für diesen Raum; `false` erzwingt sie wieder.
- `groups.<room>.skills`: optionaler Skill-Filter auf Raumebene.
- `groups.<room>.systemPrompt`: optionaler System-Prompt-Snippet auf Raumebene.
- `rooms`: Legacy-Alias für `groups`.
- `actions`: Tool-Gating pro Aktion (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Erwähnungssteuerung
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
