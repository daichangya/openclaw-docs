---
read_when:
    - Ändern von Regeln für Gruppennachrichten oder Erwähnungen
summary: Verhalten und Konfiguration für die Behandlung von WhatsApp-Gruppennachrichten (`mentionPatterns` werden über alle Oberflächen hinweg gemeinsam genutzt)
title: Gruppennachrichten
x-i18n:
    generated_at: "2026-04-12T23:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d9484dd1de74d42f8dce4c3ac80d60c24864df30a7802e64893ef55506230fe
    source_path: channels/group-messages.md
    workflow: 15
---

# Gruppennachrichten (WhatsApp-Webkanal)

Ziel: Clawd in WhatsApp-Gruppen mitlaufen lassen, nur bei Erwähnung aktivieren und diesen Thread von der persönlichen DM-Sitzung getrennt halten.

Hinweis: `agents.list[].groupChat.mentionPatterns` wird jetzt auch von Telegram/Discord/Slack/iMessage verwendet; dieses Dokument konzentriert sich auf WhatsApp-spezifisches Verhalten. Für Multi-Agent-Setups setzen Sie `agents.list[].groupChat.mentionPatterns` pro Agent (oder verwenden Sie `messages.groupChat.mentionPatterns` als globalen Fallback).

## Aktuelle Implementierung (2025-12-03)

- Aktivierungsmodi: `mention` (Standard) oder `always`. `mention` erfordert eine Erwähnung (echte WhatsApp-@-Erwähnungen über `mentionedJids`, sichere Regex-Muster oder die E.164-Nummer des Bots irgendwo im Text). `always` aktiviert den Agent bei jeder Nachricht, aber er sollte nur antworten, wenn er einen sinnvollen Mehrwert liefern kann; andernfalls gibt er exakt das stille Token `NO_REPLY` / `no_reply` zurück. Standardwerte können in der Konfiguration (`channels.whatsapp.groups`) gesetzt und pro Gruppe über `/activation` überschrieben werden. Wenn `channels.whatsapp.groups` gesetzt ist, fungiert es auch als Gruppen-Allowlist (fügen Sie `"*"` ein, um alle zu erlauben).
- Gruppenrichtlinie: `channels.whatsapp.groupPolicy` steuert, ob Gruppennachrichten akzeptiert werden (`open|disabled|allowlist`). `allowlist` verwendet `channels.whatsapp.groupAllowFrom` (Fallback: explizites `channels.whatsapp.allowFrom`). Standard ist `allowlist` (blockiert, bis Sie Sender hinzufügen).
- Sitzungen pro Gruppe: Sitzungsschlüssel sehen aus wie `agent:<agentId>:whatsapp:group:<jid>`, sodass Befehle wie `/verbose on`, `/trace on` oder `/think high` (als eigenständige Nachrichten gesendet) auf diese Gruppe beschränkt sind; der Zustand persönlicher DMs bleibt unberührt. Heartbeats werden für Gruppenthreads übersprungen.
- Kontextinjektion: **Nur ausstehende** Gruppennachrichten (standardmäßig 50), die _keinen_ Lauf ausgelöst haben, werden unter `[Chat messages since your last reply - for context]` vorangestellt, mit der auslösenden Zeile unter `[Current message - respond to this]`. Nachrichten, die bereits in der Sitzung enthalten sind, werden nicht erneut eingefügt.
- Sichtbarkeit des Senders: Jeder Gruppen-Batch endet jetzt mit `[from: Sender Name (+E164)]`, damit Pi weiß, wer spricht.
- Ephemeral-/View-once-Nachrichten: Wir entpacken diese vor dem Extrahieren von Text/Erwähnungen, sodass Erwähnungen darin weiterhin auslösen.
- Gruppen-Systemprompt: Beim ersten Zug einer Gruppensitzung (und immer dann, wenn `/activation` den Modus ändert) fügen wir einen kurzen Hinweis in den Systemprompt ein, etwa `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Wenn keine Metadaten verfügbar sind, teilen wir dem Agent trotzdem mit, dass es sich um einen Gruppenchat handelt.

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

- Die Regexe sind nicht case-sensitive und verwenden dieselben Safe-Regex-Leitplanken wie andere Regex-Oberflächen in der Konfiguration; ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- WhatsApp sendet weiterhin kanonische Erwähnungen über `mentionedJids`, wenn jemand auf den Kontakt tippt, daher wird der Nummern-Fallback nur selten benötigt, ist aber ein nützliches Sicherheitsnetz.

### Aktivierungsbefehl (nur Eigentümer)

Verwenden Sie den Gruppenchat-Befehl:

- `/activation mention`
- `/activation always`

Nur die Eigentümernummer (aus `channels.whatsapp.allowFrom` oder, falls nicht gesetzt, die eigene E.164-Nummer des Bots) kann dies ändern. Senden Sie `/status` als eigenständige Nachricht in die Gruppe, um den aktuellen Aktivierungsmodus zu sehen.

## Verwendung

1. Fügen Sie Ihr WhatsApp-Konto (dasjenige, auf dem OpenClaw läuft) der Gruppe hinzu.
2. Sagen Sie `@openclaw …` (oder fügen Sie die Nummer ein). Nur Sender auf der Allowlist können ihn auslösen, es sei denn, Sie setzen `groupPolicy: "open"`.
3. Der Agent-Prompt enthält den aktuellen Gruppenkontext plus den nachgestellten Marker `[from: …]`, damit er die richtige Person ansprechen kann.
4. Sitzungsbezogene Direktiven (`/verbose on`, `/trace on`, `/think high`, `/new` oder `/reset`, `/compact`) gelten nur für die Sitzung dieser Gruppe; senden Sie sie als eigenständige Nachrichten, damit sie registriert werden. Ihre persönliche DM-Sitzung bleibt unabhängig.

## Tests / Verifizierung

- Manueller Smoke-Test:
  - Senden Sie eine `@openclaw`-Erwähnung in die Gruppe und bestätigen Sie eine Antwort, die sich auf den Namen des Senders bezieht.
  - Senden Sie eine zweite Erwähnung und verifizieren Sie, dass der Verlaufsblock enthalten ist und dann im nächsten Zug gelöscht wird.
- Prüfen Sie die Gateway-Logs (mit `--verbose` ausführen), um `inbound web message`-Einträge zu sehen, die `from: <groupJid>` und das Suffix `[from: …]` anzeigen.

## Bekannte Aspekte

- Heartbeats werden für Gruppen absichtlich übersprungen, um störende Broadcasts zu vermeiden.
- Die Echo-Unterdrückung verwendet den kombinierten Batch-String; wenn Sie denselben Text zweimal ohne Erwähnungen senden, erhält nur der erste eine Antwort.
- Einträge im Sitzungsspeicher erscheinen als `agent:<agentId>:whatsapp:group:<jid>` im Sitzungsspeicher (`~/.openclaw/agents/<agentId>/sessions/sessions.json` standardmäßig); ein fehlender Eintrag bedeutet nur, dass die Gruppe noch keinen Lauf ausgelöst hat.
- Tippindikatoren in Gruppen folgen `agents.defaults.typingMode` (Standard: `message`, wenn keine Erwähnung vorhanden ist).
