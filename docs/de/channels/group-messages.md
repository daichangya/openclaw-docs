---
read_when:
    - Ändern von Regeln für Gruppennachrichten oder Erwähnungen
summary: Verhalten und Konfiguration für die Verarbeitung von WhatsApp-Gruppennachrichten (`mentionPatterns` werden übergreifend gemeinsam verwendet)
title: Gruppennachrichten
x-i18n:
    generated_at: "2026-04-24T06:27:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f67ed72c0e61aef18a529cb1d9dbc98909e213352ff7cbef93fe4c9bf8357186
    source_path: channels/group-messages.md
    workflow: 15
---

# Gruppennachrichten (WhatsApp-Web-Channel)

Ziel: Clawd in WhatsApp-Gruppen sitzen lassen, nur bei einem Ping aufwecken und diesen Thread getrennt von der persönlichen DM-Sitzung halten.

Hinweis: `agents.list[].groupChat.mentionPatterns` wird inzwischen auch von Telegram/Discord/Slack/iMessage verwendet; dieses Dokument konzentriert sich auf WhatsApp-spezifisches Verhalten. Für Multi-Agent-Setups setzen Sie `agents.list[].groupChat.mentionPatterns` pro Agent (oder verwenden Sie `messages.groupChat.mentionPatterns` als globalen Fallback).

## Aktuelle Implementierung (2025-12-03)

- Aktivierungsmodi: `mention` (Standard) oder `always`. `mention` erfordert einen Ping (echte WhatsApp-@-Erwähnungen über `mentionedJids`, sichere Regex-Muster oder die E.164 des Bots an beliebiger Stelle im Text). `always` weckt den Agent bei jeder Nachricht auf, aber er sollte nur antworten, wenn er sinnvoll Mehrwert liefern kann; andernfalls gibt er das exakte Silent-Token `NO_REPLY` / `no_reply` zurück. Standards können in der Konfiguration gesetzt und pro Gruppe über `/activation` überschrieben werden. Wenn `channels.whatsapp.groups` gesetzt ist, fungiert es auch als Gruppen-Allowlist (fügen Sie `"*"` hinzu, um alle zuzulassen).
- Gruppenrichtlinie: `channels.whatsapp.groupPolicy` steuert, ob Gruppennachrichten akzeptiert werden (`open|disabled|allowlist`). `allowlist` verwendet `channels.whatsapp.groupAllowFrom` (Fallback: explizites `channels.whatsapp.allowFrom`). Standard ist `allowlist` (blockiert, bis Sie Absender hinzufügen).
- Sitzungen pro Gruppe: Sitzungsschlüssel sehen aus wie `agent:<agentId>:whatsapp:group:<jid>`, sodass Befehle wie `/verbose on`, `/trace on` oder `/think high` (als eigenständige Nachrichten gesendet) auf diese Gruppe beschränkt sind; der persönliche DM-Status bleibt unberührt. Heartbeats werden für Gruppenthreads übersprungen.
- Kontextinjektion: **Nur ausstehende** Gruppennachrichten (Standard 50), die _keinen_ Lauf ausgelöst haben, werden unter `[Chat messages since your last reply - for context]` vorangestellt, mit der auslösenden Zeile unter `[Current message - respond to this]`. Nachrichten, die bereits in der Sitzung enthalten sind, werden nicht erneut eingefügt.
- Sichtbarkeit des Absenders: Jeder Gruppen-Batch endet jetzt mit `[from: Sender Name (+E164)]`, damit Pi weiß, wer spricht.
- Vergänglich/Einmal ansehen: Diese werden vor dem Extrahieren von Text/Erwähnungen entpackt, sodass Pings darin weiterhin auslösen.
- Gruppen-System-Prompt: Im ersten Turn einer Gruppensitzung (und immer dann, wenn `/activation` den Modus ändert) fügen wir einen kurzen Hinweis in den System-Prompt ein wie `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Wenn keine Metadaten verfügbar sind, teilen wir dem Agent dennoch mit, dass es sich um einen Gruppenchat handelt.

## Konfigurationsbeispiel (WhatsApp)

Fügen Sie `~/.openclaw/openclaw.json` einen `groupChat`-Block hinzu, damit Pings über Anzeigenamen funktionieren, selbst wenn WhatsApp das sichtbare `@` im Nachrichtentext entfernt:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Hinweise:

- Die Regexe sind nicht case-sensitiv und verwenden dieselben Safe-Regex-Schutzmechanismen wie andere Regex-Oberflächen in der Konfiguration; ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- WhatsApp sendet weiterhin kanonische Erwähnungen über `mentionedJids`, wenn jemand auf den Kontakt tippt; der Nummern-Fallback ist daher selten erforderlich, aber ein nützliches Sicherheitsnetz.

### Aktivierungsbefehl (nur Owner)

Verwenden Sie den Gruppenchat-Befehl:

- `/activation mention`
- `/activation always`

Nur die Owner-Nummer (aus `channels.whatsapp.allowFrom` oder die E.164 des Bots selbst, wenn nicht gesetzt) kann dies ändern. Senden Sie `/status` als eigenständige Nachricht in die Gruppe, um den aktuellen Aktivierungsmodus zu sehen.

## Verwendung

1. Fügen Sie Ihr WhatsApp-Konto (dasjenige, auf dem OpenClaw läuft) zur Gruppe hinzu.
2. Sagen Sie `@openclaw …` (oder fügen Sie die Nummer ein). Nur Absender auf der Allowlist können dies auslösen, außer Sie setzen `groupPolicy: "open"`.
3. Der Agent-Prompt enthält den aktuellen Gruppenkontext plus den abschließenden Marker `[from: …]`, damit er die richtige Person ansprechen kann.
4. Direktiven auf Sitzungsebene (`/verbose on`, `/trace on`, `/think high`, `/new` oder `/reset`, `/compact`) gelten nur für die Sitzung dieser Gruppe; senden Sie sie als eigenständige Nachrichten, damit sie registriert werden. Ihre persönliche DM-Sitzung bleibt unabhängig.

## Tests / Verifizierung

- Manueller Smoke-Test:
  - Senden Sie einen `@openclaw`-Ping in die Gruppe und bestätigen Sie eine Antwort, die sich auf den Absendernamen bezieht.
  - Senden Sie einen zweiten Ping und prüfen Sie, dass der Verlaufsblock enthalten ist und dann im nächsten Turn geleert wird.
- Prüfen Sie die Gateway-Logs (mit `--verbose` ausführen), um `inbound web message`-Einträge mit `from: <groupJid>` und dem Suffix `[from: …]` zu sehen.

## Bekannte Aspekte

- Heartbeats werden für Gruppen absichtlich übersprungen, um laute Broadcasts zu vermeiden.
- Echo-Unterdrückung verwendet den kombinierten Batch-String; wenn Sie denselben Text zweimal ohne Erwähnungen senden, erhält nur der erste eine Antwort.
- Einträge im Sitzungsspeicher erscheinen als `agent:<agentId>:whatsapp:group:<jid>` im Sitzungsspeicher (`~/.openclaw/agents/<agentId>/sessions/sessions.json` standardmäßig); ein fehlender Eintrag bedeutet nur, dass die Gruppe noch keinen Lauf ausgelöst hat.
- Tippindikatoren in Gruppen folgen `agents.defaults.typingMode` (Standard: `message`, wenn keine Erwähnung erfolgt).

## Verwandt

- [Groups](/de/channels/groups)
- [Channel routing](/de/channels/channel-routing)
- [Broadcast groups](/de/channels/broadcast-groups)
