---
read_when:
    - Sie OpenClaw mit IRC-Kanälen oder DMs verbinden möchten
    - Sie IRC-Allowlists, Gruppenrichtlinien oder Erwähnungs-Gating konfigurieren
summary: Einrichtung des IRC-Plugins, Zugriffskontrollen und Fehlerbehebung
title: IRC
x-i18n:
    generated_at: "2026-04-05T12:35:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: fceab2979db72116689c6c774d6736a8a2eee3559e3f3cf8969e673d317edd94
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Verwenden Sie IRC, wenn Sie OpenClaw in klassischen Kanälen (`#room`) und Direktnachrichten verwenden möchten.
IRC wird als Erweiterungs-Plugin bereitgestellt, aber in der Hauptkonfiguration unter `channels.irc` konfiguriert.

## Schnellstart

1. Aktivieren Sie die IRC-Konfiguration in `~/.openclaw/openclaw.json`.
2. Setzen Sie mindestens:

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

Verwenden Sie vorzugsweise einen privaten IRC-Server für die Bot-Koordination. Wenn Sie absichtlich ein öffentliches IRC-Netzwerk verwenden, sind Libera.Chat, OFTC und Snoonet gängige Optionen. Vermeiden Sie vorhersehbare öffentliche Kanäle für Bot- oder Schwarm-Backchannel-Verkehr.

3. Gateway starten/neu starten:

```bash
openclaw gateway run
```

## Standardsicherheitseinstellungen

- `channels.irc.dmPolicy` ist standardmäßig `"pairing"`.
- `channels.irc.groupPolicy` ist standardmäßig `"allowlist"`.
- Wenn `groupPolicy="allowlist"` gesetzt ist, definieren Sie mit `channels.irc.groups` die zulässigen Kanäle.
- Verwenden Sie TLS (`channels.irc.tls=true`), sofern Sie nicht absichtlich unverschlüsselten Transport akzeptieren.

## Zugriffskontrolle

Für IRC-Kanäle gibt es zwei getrennte „Schranken“:

1. **Kanalzugriff** (`groupPolicy` + `groups`): ob der Bot überhaupt Nachrichten aus einem Kanal akzeptiert.
2. **Absenderzugriff** (`groupAllowFrom` / kanalbezogen `groups["#channel"].allowFrom`): wer den Bot innerhalb dieses Kanals auslösen darf.

Konfigurationsschlüssel:

- DM-Allowlist (Zugriff für DM-Absender): `channels.irc.allowFrom`
- Gruppen-Absender-Allowlist (Zugriff für Kanalabsender): `channels.irc.groupAllowFrom`
- Kanalbezogene Steuerung (Kanal + Absender + Erwähnungsregeln): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` erlaubt nicht konfigurierte Kanäle (**standardmäßig weiterhin Erwähnungs-Gating**)

Allowlist-Einträge sollten stabile Absenderidentitäten verwenden (`nick!user@host`).
Der Abgleich nur anhand des Nicknamens ist veränderlich und nur aktiviert, wenn `channels.irc.dangerouslyAllowNameMatching: true` gesetzt ist.

### Häufiger Stolperstein: `allowFrom` ist für DMs, nicht für Kanäle

Wenn Sie Logs wie diese sehen:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…bedeutet das, dass der Absender für **Gruppen-/Kanal**-Nachrichten nicht zugelassen war. Beheben Sie das entweder durch:

- Setzen von `channels.irc.groupAllowFrom` (global für alle Kanäle), oder
- Setzen kanalbezogener Absender-Allowlists: `channels.irc.groups["#channel"].allowFrom`

Beispiel (allen in `#tuirc-dev` erlauben, mit dem Bot zu sprechen):

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

Selbst wenn ein Kanal erlaubt ist (über `groupPolicy` + `groups`) und der Absender erlaubt ist, verwendet OpenClaw in Gruppenkontexten standardmäßig **Erwähnungs-Gating**.

Das bedeutet, dass Sie möglicherweise Logs wie `drop channel … (missing-mention)` sehen, wenn die Nachricht kein Erwähnungsmuster enthält, das auf den Bot passt.

Damit der Bot in einem IRC-Kanal **ohne Erwähnung** antwortet, deaktivieren Sie das Erwähnungs-Gating für diesen Kanal:

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

Oder um **alle** IRC-Kanäle zuzulassen (keine kanalbezogene Allowlist) und dennoch ohne Erwähnungen zu antworten:

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

Wenn Sie `allowFrom: ["*"]` in einem öffentlichen Kanal zulassen, kann jede Person den Bot prompten.
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

Verwenden Sie `toolsBySender`, um auf `"*"` eine strengere Richtlinie und auf Ihren Nick eine lockerere anzuwenden:

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
  `id:eigen` oder `id:eigen!~eigen@174.127.248.171` für einen stärkeren Abgleich.
- Veraltete Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.
- Die erste passende Absenderrichtlinie gewinnt; `"*"` ist der Wildcard-Fallback.

Weitere Informationen zu Gruppenzugriff im Vergleich zu Erwähnungs-Gating (und ihrem Zusammenspiel) finden Sie unter: [/channels/groups](/channels/groups).

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

## Fehlerbehebung

- Wenn der Bot sich verbindet, aber in Kanälen nie antwortet, prüfen Sie `channels.irc.groups` **und** ob Erwähnungs-Gating Nachrichten verwirft (`missing-mention`). Wenn er ohne Erwähnungen antworten soll, setzen Sie `requireMention:false` für den Kanal.
- Wenn die Anmeldung fehlschlägt, prüfen Sie die Verfügbarkeit des Nicks und das Serverpasswort.
- Wenn TLS in einem benutzerdefinierten Netzwerk fehlschlägt, prüfen Sie Host/Port und die Zertifikatskonfiguration.

## Verwandt

- [Kanäle - Übersicht](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/gateway/security) — Zugriffsmodell und Härtung
