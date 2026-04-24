---
read_when:
    - Persönliches Zalo für OpenClaw einrichten
    - Debuggen der Anmeldung oder des Nachrichtenflusses von Zalo Personal
summary: Unterstützung für persönliche Zalo-Konten über natives `zca-js` (QR-Anmeldung), Funktionen und Konfiguration
title: Persönliches Zalo
x-i18n:
    generated_at: "2026-04-24T06:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Persönliches Zalo (inoffiziell)

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** über natives `zca-js` innerhalb von OpenClaw.

> **Warnung:** Dies ist eine inoffizielle Integration und kann zur Sperrung/Verbannung des Kontos führen. Verwendung auf eigenes Risiko.

## Gebündeltes Plugin

Persönliches Zalo wird in aktuellen OpenClaw-Releases als gebündeltes Plugin mitgeliefert, daher ist bei normalen
paketierten Builds keine separate Installation erforderlich.

Wenn Sie eine ältere Version oder eine benutzerdefinierte Installation verwenden, die Persönliches Zalo ausschließt,
installieren Sie es manuell:

- Installation über CLI: `openclaw plugins install @openclaw/zalouser`
- Oder aus einem Source-Checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/de/tools/plugin)

Es ist keine externe `zca`-/`openzca`-CLI-Binärdatei erforderlich.

## Schnelle Einrichtung (für Einsteiger)

1. Stellen Sie sicher, dass das Plugin für Persönliches Zalo verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Anmelden (QR, auf dem Gateway-Rechner):
   - `openclaw channels login --channel zalouser`
   - Scannen Sie den QR-Code mit der mobilen Zalo-App.
3. Aktivieren Sie den Kanal:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Starten Sie das Gateway neu (oder schließen Sie die Einrichtung ab).
5. Der DM-Zugriff verwendet standardmäßig Pairing; genehmigen Sie beim ersten Kontakt den Pairing-Code.

## Was es ist

- Läuft vollständig im Prozess über `zca-js`.
- Verwendet native Event-Listener, um eingehende Nachrichten zu empfangen.
- Sendet Antworten direkt über die JS-API (Text/Medien/Link).
- Entwickelt für Anwendungsfälle mit „persönlichen Konten“, bei denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID ist `zalouser`, um explizit zu machen, dass hier ein **persönliches Zalo-Benutzerkonto** (inoffiziell) automatisiert wird. `zalo` bleibt für eine mögliche zukünftige offizielle Zalo-API-Integration reserviert.

## IDs finden (Directory)

Verwenden Sie die Directory-CLI, um Peers/Gruppen und ihre IDs zu ermitteln:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Einschränkungen

- Ausgehender Text wird in Blöcke von etwa 2000 Zeichen aufgeteilt (Zalo-Client-Limits).
- Streaming ist standardmäßig blockiert.

## Zugriffskontrolle (DMs)

`channels.zalouser.dmPolicy` unterstützt: `pairing | allowlist | open | disabled` (Standard: `pairing`).

`channels.zalouser.allowFrom` akzeptiert Benutzer-IDs oder Namen. Während der Einrichtung werden Namen mithilfe der In-Process-Kontaktsuche des Plugins in IDs aufgelöst.

Genehmigung über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standard: `channels.zalouser.groupPolicy = "open"` (Gruppen erlaubt). Verwenden Sie `channels.defaults.groupPolicy`, um den Standardwert zu überschreiben, wenn er nicht gesetzt ist.
- Auf eine Allowlist beschränken mit:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (Schlüssel sollten stabile Gruppen-IDs sein; Namen werden beim Start nach Möglichkeit in IDs aufgelöst)
  - `channels.zalouser.groupAllowFrom` (steuert, welche Absender in erlaubten Gruppen den Bot auslösen können)
- Alle Gruppen blockieren: `channels.zalouser.groupPolicy = "disabled"`.
- Der Konfigurationsassistent kann nach Gruppen-Allowlists fragen.
- Beim Start löst OpenClaw Gruppen-/Benutzernamen in Allowlists in IDs auf und protokolliert die Zuordnung.
- Das Matching der Gruppen-Allowlist erfolgt standardmäßig nur über IDs. Nicht aufgelöste Namen werden für die Authentifizierung ignoriert, außer `channels.zalouser.dangerouslyAllowNameMatching: true` ist aktiviert.
- `channels.zalouser.dangerouslyAllowNameMatching: true` ist ein Break-Glass-Kompatibilitätsmodus, der veränderliches Matching von Gruppennamen wieder aktiviert.
- Wenn `groupAllowFrom` nicht gesetzt ist, greift die Laufzeit bei Gruppen-Absenderprüfungen auf `allowFrom` zurück.
- Absenderprüfungen gelten sowohl für normale Gruppennachrichten als auch für Steuerbefehle (zum Beispiel `/new`, `/reset`).

Beispiel:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Gating für Gruppenerwähnungen

- `channels.zalouser.groups.<group>.requireMention` steuert, ob Gruppenantworten eine Erwähnung erfordern.
- Auflösungsreihenfolge: exakte Gruppen-ID/-Name -> normalisierter Gruppen-Slug -> `*` -> Standard (`true`).
- Dies gilt sowohl für Gruppen auf der Allowlist als auch im offenen Gruppenmodus.
- Das Zitieren einer Bot-Nachricht zählt als implizite Erwähnung zur Gruppenaktivierung.
- Autorisierte Steuerbefehle (zum Beispiel `/new`) können das Mention-Gating umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehende Gruppenhistorie und schließt sie bei der nächsten verarbeiteten Gruppennachricht ein.
- Das Standardlimit für die Gruppenhistorie ist `messages.groupChat.historyLimit` (Fallback `50`). Sie können es pro Konto mit `channels.zalouser.historyLimit` überschreiben.

Beispiel:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Multi-Account

Konten werden im OpenClaw-Status `zalouser`-Profilen zugeordnet. Beispiel:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Tippen, Reactions und Zustellbestätigungen

- OpenClaw sendet vor dem Versenden einer Antwort ein Schreibereignis (Best-Effort).
- Die Nachrichten-Reaktionsaktion `react` wird für `zalouser` in Kanalaktionen unterstützt.
  - Verwenden Sie `remove: true`, um ein bestimmtes Reaktions-Emoji aus einer Nachricht zu entfernen.
  - Semantik von Reactions: [Reactions](/de/tools/reactions)
- Für eingehende Nachrichten, die Ereignismetadaten enthalten, sendet OpenClaw Zustell- und Gesehen-Bestätigungen (Best-Effort).

## Fehlerbehebung

**Anmeldung bleibt nicht bestehen:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/Gruppenname wurde nicht aufgelöst:**

- Verwenden Sie numerische IDs in `allowFrom`/`groupAllowFrom`/`groups` oder exakte Freundes-/Gruppennamen.

**Upgrade von altem CLI-basiertem Setup:**

- Entfernen Sie alle alten Annahmen zu externen `zca`-Prozessen.
- Der Kanal läuft jetzt vollständig in OpenClaw ohne externe CLI-Binärdateien.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
