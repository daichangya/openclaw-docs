---
read_when:
    - Sie möchten OpenClaw mit IRC-Kanälen oder Direktnachrichten verbinden
    - Sie konfigurieren IRC-Zulassungslisten, Gruppenrichtlinien oder Erwähnungs-Gating
summary: Einrichtung, Zugriffskontrollen und Fehlerbehebung für das IRC Plugin
title: IRC
x-i18n:
    generated_at: "2026-04-23T13:57:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e198c03db9aaf4ec64db462d44d42aa352a2ddba808bcd29e21eb2791d9755ad
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Verwenden Sie IRC, wenn Sie OpenClaw in klassischen Kanälen (`#room`) und Direktnachrichten nutzen möchten.
IRC wird als gebündeltes Plugin mitgeliefert, wird aber in der Hauptkonfiguration unter `channels.irc` konfiguriert.

## Schnellstart

1. Aktivieren Sie die IRC-Konfiguration in `~/.openclaw/openclaw.json`.
2. Legen Sie mindestens Folgendes fest:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Bevorzugen Sie einen privaten IRC-Server für die Bot-Koordination. Wenn Sie absichtlich ein öffentliches IRC-Netzwerk verwenden, sind Libera.Chat, OFTC und Snoonet gängige Optionen. Vermeiden Sie vorhersehbare öffentliche Kanäle für Bot- oder Schwarm-Backchannel-Verkehr.

3. Starten Sie das Gateway oder starten Sie es neu:

```bash
openclaw gateway run
```

## Standardsicherheitseinstellungen

- `channels.irc.dmPolicy` ist standardmäßig auf `"pairing"` gesetzt.
- `channels.irc.groupPolicy` ist standardmäßig auf `"allowlist"` gesetzt.
- Bei `groupPolicy="allowlist"` legen Sie mit `channels.irc.groups` die erlaubten Kanäle fest.
- Verwenden Sie TLS (`channels.irc.tls=true`), sofern Sie nicht absichtlich unverschlüsselte Übertragung akzeptieren.

## Zugriffskontrolle

Für IRC-Kanäle gibt es zwei getrennte „Sperren“:

1. **Kanalzugriff** (`groupPolicy` + `groups`): ob der Bot Nachrichten aus einem Kanal überhaupt akzeptiert.
2. **Absenderzugriff** (`groupAllowFrom` / pro Kanal `groups["#channel"].allowFrom`): wer den Bot innerhalb dieses Kanals auslösen darf.

Konfigurationsschlüssel:

- DM-Zulassungsliste (Absenderzugriff für DMs): `channels.irc.allowFrom`
- Zulassungsliste für Gruppenabsender (Absenderzugriff für Kanäle): `channels.irc.groupAllowFrom`
- Steuerung pro Kanal (Kanal + Absender + Erwähnungsregeln): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` erlaubt nicht konfigurierte Kanäle (**standardmäßig weiterhin Erwähnungs-Gating**)

Einträge in Zulassungslisten sollten stabile Absenderidentitäten verwenden (`nick!user@host`).
Der Abgleich nur anhand des Nicknamens ist veränderlich und wird nur aktiviert, wenn `channels.irc.dangerouslyAllowNameMatching: true` gesetzt ist.

### Häufiger Stolperstein: `allowFrom` ist für DMs, nicht für Kanäle

Wenn Sie Protokolleinträge wie diese sehen:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…bedeutet das, dass der Absender für **Gruppen-/Kanal**-Nachrichten nicht zugelassen war. Beheben Sie das entweder durch:

- Setzen von `channels.irc.groupAllowFrom` (global für alle Kanäle), oder
- Setzen kanalbezogener Absender-Zulassungslisten: `channels.irc.groups["#channel"].allowFrom`

Beispiel (beliebigen Nutzern in `#tuirc-dev` erlauben, mit dem Bot zu sprechen):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Antwortauslösung (Erwähnungen)

Auch wenn ein Kanal erlaubt ist (über `groupPolicy` + `groups`) und der Absender erlaubt ist, verwendet OpenClaw in Gruppenkontexten standardmäßig **Erwähnungs-Gating**.

Das bedeutet, dass Sie möglicherweise Protokolleinträge wie `drop channel … (missing-mention)` sehen, sofern die Nachricht kein Erwähnungsmuster enthält, das zum Bot passt.

Damit der Bot in einem IRC-Kanal **ohne erforderliche Erwähnung** antwortet, deaktivieren Sie das Erwähnungs-Gating für diesen Kanal:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Oder um **alle** IRC-Kanäle zu erlauben (keine Zulassungsliste pro Kanal) und trotzdem ohne Erwähnungen zu antworten:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Sicherheitshinweis (für öffentliche Kanäle empfohlen)

Wenn Sie in einem öffentlichen Kanal `allowFrom: ["*"]` zulassen, kann jeder den Bot ansprechen.
Um das Risiko zu verringern, beschränken Sie die Tools für diesen Kanal.

### Dieselben Tools für alle im Kanal

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Unterschiedliche Tools pro Absender (Eigentümer erhält mehr Rechte)

Verwenden Sie `toolsBySender`, um eine strengere Richtlinie auf `"*"` und eine weniger strenge auf Ihren Nick anzuwenden:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Hinweise:

- Schlüssel in `toolsBySender` sollten `id:` für IRC-Absenderidentitätswerte verwenden:
  `id:eigen` oder `id:eigen!~eigen@174.127.248.171` für einen stärkeren Abgleich.
- Ältere Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.
- Die erste passende Absenderrichtlinie gewinnt; `"*"` ist der Platzhalter-Fallback.

Weitere Informationen zu Gruppenzugriff im Vergleich zu Erwähnungs-Gating (und deren Zusammenspiel) finden Sie unter: [/channels/groups](/de/channels/groups).

## NickServ

Zur Identifizierung bei NickServ nach dem Verbindungsaufbau:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Optionale einmalige Registrierung beim Verbindungsaufbau:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Deaktivieren Sie `register`, nachdem der Nick registriert wurde, um wiederholte REGISTER-Versuche zu vermeiden.

## Umgebungsvariablen

Das Standardkonto unterstützt:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (durch Kommas getrennt)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Fehlerbehebung

- Wenn der Bot eine Verbindung herstellt, aber in Kanälen nie antwortet, prüfen Sie `channels.irc.groups` **und** ob Erwähnungs-Gating Nachrichten verwirft (`missing-mention`). Wenn er ohne Pings antworten soll, setzen Sie `requireMention:false` für den Kanal.
- Wenn die Anmeldung fehlschlägt, prüfen Sie die Verfügbarkeit des Nicks und das Serverpasswort.
- Wenn TLS in einem benutzerdefinierten Netzwerk fehlschlägt, prüfen Sie Host/Port und die Zertifikatskonfiguration.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
