---
read_when:
    - Sie möchten OpenClaw mit IRC-Kanälen oder Direktnachrichten verbinden
    - Sie konfigurieren IRC-Allowlisten, Gruppenrichtlinien oder Mention-Gating
summary: Einrichtung des IRC-Plugin, Zugriffskontrollen und Fehlerbehebung
title: IRC
x-i18n:
    generated_at: "2026-04-24T06:27:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

Einrichtung des IRC-Plugin, Zugriffskontrollen und Fehlerbehebung

IRC

Sie möchten OpenClaw mit IRC-Kanälen oder Direktnachrichten verbinden

Sie konfigurieren IRC-Allowlisten, Gruppenrichtlinien oder Mention-Gating

Verwenden Sie IRC, wenn Sie OpenClaw in klassischen Kanälen (`#room`) und Direktnachrichten einsetzen möchten.
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

Bevorzugen Sie für die Bot-Koordination einen privaten IRC-Server. Wenn Sie absichtlich ein öffentliches IRC-Netzwerk verwenden, sind Libera.Chat, OFTC und Snoonet gängige Optionen. Vermeiden Sie vorhersehbare öffentliche Kanäle für Bot- oder Schwarm-Backchannel-Verkehr.

3. Starten Sie das Gateway bzw. starten Sie es neu:

```bash
openclaw gateway run
```

## Sicherheitsstandards

- `channels.irc.dmPolicy` ist standardmäßig `"pairing"`.
- `channels.irc.groupPolicy` ist standardmäßig `"allowlist"`.
- Bei `groupPolicy="allowlist"` legen Sie mit `channels.irc.groups` die erlaubten Kanäle fest.
- Verwenden Sie TLS (`channels.irc.tls=true`), sofern Sie nicht absichtlich unverschlüsselte Übertragung akzeptieren.

## Zugriffskontrolle

Für IRC-Kanäle gibt es zwei getrennte „Schranken“:

1. **Kanalzugriff** (`groupPolicy` + `groups`): ob der Bot Nachrichten aus einem Kanal überhaupt akzeptiert.
2. **Absenderzugriff** (`groupAllowFrom` / pro Kanal `groups["#channel"].allowFrom`): wer den Bot innerhalb dieses Kanals auslösen darf.

Konfigurationsschlüssel:

- DM-Allowlist (DM-Absenderzugriff): `channels.irc.allowFrom`
- Gruppen-Absender-Allowlist (Kanal-Absenderzugriff): `channels.irc.groupAllowFrom`
- Pro-Kanal-Steuerung (Kanal + Absender + Mention-Regeln): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` erlaubt nicht konfigurierte Kanäle (**standardmäßig weiterhin durch Mention-Gating geschützt**)

Allowlist-Einträge sollten stabile Absenderidentitäten verwenden (`nick!user@host`).
Der Abgleich nur nach Nick ist veränderlich und wird nur aktiviert, wenn `channels.irc.dangerouslyAllowNameMatching: true` gesetzt ist.

### Häufiger Stolperstein: `allowFrom` gilt für DMs, nicht für Kanäle

Wenn Sie Protokolle wie diese sehen:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…bedeutet das, dass der Absender für **Gruppen-/Kanal**-Nachrichten nicht erlaubt war. Beheben Sie das entweder durch:

- Setzen von `channels.irc.groupAllowFrom` (global für alle Kanäle), oder
- Setzen von Absender-Allowlisten pro Kanal: `channels.irc.groups["#channel"].allowFrom`

Beispiel (jede Person in `#tuirc-dev` darf mit dem Bot sprechen):

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

## Antwortauslösung (Mentions)

Selbst wenn ein Kanal erlaubt ist (über `groupPolicy` + `groups`) und der Absender erlaubt ist, verwendet OpenClaw in Gruppenkontexten standardmäßig **Mention-Gating**.

Das bedeutet, dass Sie möglicherweise Protokolle wie `drop channel … (missing-mention)` sehen, sofern die Nachricht kein Mention-Muster enthält, das zum Bot passt.

Damit der Bot in einem IRC-Kanal **ohne erforderliche Mention** antwortet, deaktivieren Sie Mention-Gating für diesen Kanal:

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

Oder um **alle** IRC-Kanäle zuzulassen (keine Allowlist pro Kanal) und trotzdem ohne Mentions zu antworten:

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

## Sicherheitshinweis (empfohlen für öffentliche Kanäle)

Wenn Sie `allowFrom: ["*"]` in einem öffentlichen Kanal zulassen, kann jede Person den Bot ansprechen.
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

- `toolsBySender`-Schlüssel sollten `id:` für IRC-Absenderidentitätswerte verwenden:
  `id:eigen` oder `id:eigen!~eigen@174.127.248.171` für stärkeren Abgleich.
- Ältere Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.
- Die erste passende Absenderrichtlinie gewinnt; `"*"` ist der Wildcard-Fallback.

Weitere Informationen zu Gruppenzugriff im Vergleich zu Mention-Gating (und wie beides zusammenspielt) finden Sie unter: [/channels/groups](/de/channels/groups).

## NickServ

Zur Identifizierung bei NickServ nach dem Verbinden:

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

Optionale einmalige Registrierung beim Verbinden:

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

Deaktivieren Sie `register`, nachdem der Nick registriert wurde, um wiederholte `REGISTER`-Versuche zu vermeiden.

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

- Wenn der Bot sich verbindet, aber in Kanälen nie antwortet, prüfen Sie `channels.irc.groups` **und** ob Mention-Gating Nachrichten verwirft (`missing-mention`). Wenn er ohne Pings antworten soll, setzen Sie `requireMention:false` für den Kanal.
- Wenn die Anmeldung fehlschlägt, prüfen Sie die Verfügbarkeit des Nick und das Server-Passwort.
- Wenn TLS in einem benutzerdefinierten Netzwerk fehlschlägt, prüfen Sie Host/Port und die Zertifikatseinrichtung.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Kanalweiterleitung](/de/channels/channel-routing) — Sitzungsweiterleitung für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
