---
read_when:
    - Ändern von Regeln für Gruppennachrichten oder Erwähnungen
summary: Verhalten und Konfiguration für die Verarbeitung von WhatsApp-Gruppennachrichten (mentionPatterns werden kanalübergreifend gemeinsam verwendet)
title: Gruppennachrichten
x-i18n:
    generated_at: "2026-04-05T12:35:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2543be5bc4c6f188f955df580a6fef585ecbfc1be36ade5d34b1a9157e021bc5
    source_path: channels/group-messages.md
    workflow: 15
---

# Gruppennachrichten (WhatsApp-Webkanal)

Ziel: Clawd soll in WhatsApp-Gruppen präsent sein, nur bei einer Erwähnung aktiviert werden und diesen Thread getrennt von der persönlichen DM-Sitzung halten.

Hinweis: `agents.list[].groupChat.mentionPatterns` wird jetzt auch von Telegram/Discord/Slack/iMessage verwendet; dieses Dokument konzentriert sich auf WhatsApp-spezifisches Verhalten. Für Multi-Agent-Setups setzen Sie `agents.list[].groupChat.mentionPatterns` pro Agent (oder verwenden Sie `messages.groupChat.mentionPatterns` als globalen Fallback).

## Aktuelle Implementierung (2025-12-03)

- Aktivierungsmodi: `mention` (Standard) oder `always`. `mention` erfordert eine Erwähnung (echte WhatsApp-@-Erwähnungen über `mentionedJids`, sichere Regex-Muster oder die E.164-Nummer des Bots irgendwo im Text). `always` aktiviert den Agenten bei jeder Nachricht, aber er sollte nur antworten, wenn er einen sinnvollen Beitrag leisten kann; andernfalls gibt er das exakte Silent-Token `NO_REPLY` / `no_reply` zurück. Standardwerte können in der Konfiguration gesetzt werden (`channels.whatsapp.groups`) und pro Gruppe über `/activation` überschrieben werden. Wenn `channels.whatsapp.groups` gesetzt ist, fungiert es auch als Gruppen-Allowlist (fügen Sie `"*"` ein, um alle zuzulassen).
- Gruppenrichtlinie: `channels.whatsapp.groupPolicy` steuert, ob Gruppennachrichten akzeptiert werden (`open|disabled|allowlist`). `allowlist` verwendet `channels.whatsapp.groupAllowFrom` (Fallback: explizites `channels.whatsapp.allowFrom`). Standard ist `allowlist` (blockiert, bis Sie Absender hinzufügen).
- Sitzungen pro Gruppe: SessionKeys sehen wie `agent:<agentId>:whatsapp:group:<jid>` aus, sodass Befehle wie `/verbose on` oder `/think high` (als eigenständige Nachrichten gesendet) auf diese Gruppe begrenzt sind; der persönliche DM-Status bleibt unberührt. Heartbeats werden für Gruppen-Threads übersprungen.
- Kontexteinfügung: **nur ausstehende** Gruppennachrichten (Standard 50), die _keinen_ Lauf ausgelöst haben, werden unter `[Chat messages since your last reply - for context]` vorangestellt, wobei die auslösende Zeile unter `[Current message - respond to this]` steht. Nachrichten, die sich bereits in der Sitzung befinden, werden nicht erneut eingefügt.
- Sichtbarkeit des Absenders: Jede Gruppen-Batch endet jetzt mit `[from: Sender Name (+E164)]`, damit Pi weiß, wer spricht.
- Ephemeral/View-once: Diese werden vor dem Extrahieren von Text/Erwähnungen entpackt, sodass Erwähnungen darin weiterhin auslösen.
- System-Prompt für Gruppen: Im ersten Turn einer Gruppensitzung (und immer dann, wenn `/activation` den Modus ändert) fügen wir dem System-Prompt einen kurzen Hinweis hinzu wie `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Wenn keine Metadaten verfügbar sind, teilen wir dem Agenten dennoch mit, dass es sich um einen Gruppenchat handelt.

## Konfigurationsbeispiel (WhatsApp)

Fügen Sie `~/.openclaw/openclaw.json` einen `groupChat`-Block hinzu, damit Erwähnungen per Anzeigename funktionieren, selbst wenn WhatsApp das sichtbare `@` im Nachrichtentext entfernt:

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

- Die Regexe sind ohne Berücksichtigung der Groß-/Kleinschreibung und verwenden dieselben Safe-Regex-Leitplanken wie andere Regex-Oberflächen in der Konfiguration; ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- WhatsApp sendet weiterhin kanonische Erwähnungen über `mentionedJids`, wenn jemand auf den Kontakt tippt, daher wird der Nummern-Fallback selten benötigt, ist aber ein nützliches Sicherheitsnetz.

### Aktivierungsbefehl (nur Eigentümer)

Verwenden Sie den Gruppenchat-Befehl:

- `/activation mention`
- `/activation always`

Nur die Eigentümernummer (aus `channels.whatsapp.allowFrom` oder die eigene E.164-Nummer des Bots, wenn nicht gesetzt) kann dies ändern. Senden Sie `/status` als eigenständige Nachricht in der Gruppe, um den aktuellen Aktivierungsmodus zu sehen.

## Verwendung

1. Fügen Sie Ihr WhatsApp-Konto (das Konto, auf dem OpenClaw läuft) zur Gruppe hinzu.
2. Sagen Sie `@openclaw …` (oder fügen Sie die Nummer ein). Nur Allowlist-Absender können dies auslösen, außer Sie setzen `groupPolicy: "open"`.
3. Der Agent-Prompt enthält den aktuellen Gruppenkontext plus den nachgestellten Marker `[from: …]`, damit er die richtige Person ansprechen kann.
4. Direktiven auf Sitzungsebene (`/verbose on`, `/think high`, `/new` oder `/reset`, `/compact`) gelten nur für die Sitzung dieser Gruppe; senden Sie sie als eigenständige Nachrichten, damit sie registriert werden. Ihre persönliche DM-Sitzung bleibt unabhängig.

## Testen / Verifizierung

- Manueller Smoke-Test:
  - Senden Sie eine `@openclaw`-Erwähnung in der Gruppe und bestätigen Sie eine Antwort, die auf den Absendernamen Bezug nimmt.
  - Senden Sie eine zweite Erwähnung und prüfen Sie, dass der Verlaufsblock enthalten ist und dann im nächsten Turn gelöscht wird.
- Prüfen Sie die Gateway-Logs (mit `--verbose` ausführen), um `inbound web message`-Einträge zu sehen, die `from: <groupJid>` und das Suffix `[from: …]` anzeigen.

## Bekannte Hinweise

- Heartbeats werden für Gruppen bewusst übersprungen, um laute Broadcasts zu vermeiden.
- Echo-Unterdrückung verwendet den kombinierten Batch-String; wenn Sie denselben Text zweimal ohne Erwähnungen senden, erhält nur die erste Nachricht eine Antwort.
- Einträge im Sitzungsspeicher erscheinen als `agent:<agentId>:whatsapp:group:<jid>` im Sitzungsspeicher (standardmäßig `~/.openclaw/agents/<agentId>/sessions/sessions.json`); ein fehlender Eintrag bedeutet nur, dass die Gruppe noch keinen Lauf ausgelöst hat.
- Tippindikatoren in Gruppen folgen `agents.defaults.typingMode` (Standard: `message` bei fehlender Erwähnung).
