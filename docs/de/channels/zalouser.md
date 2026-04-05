---
read_when:
    - Einrichten von Zalo Personal für OpenClaw
    - Fehlerbehebung bei Zalo-Personal-Login oder Nachrichtenfluss
summary: Unterstützung für persönliche Zalo-Konten über natives zca-js (QR-Login), Funktionen und Konfiguration
title: Zalo Personal
x-i18n:
    generated_at: "2026-04-05T12:37:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331b95041463185472d242cb0a944972f0a8e99df8120bda6350eca86ad5963f
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (inoffiziell)

Status: experimentell. Diese Integration automatisiert ein **persönliches Zalo-Konto** über natives `zca-js` innerhalb von OpenClaw.

> **Warnung:** Dies ist eine inoffizielle Integration und kann zur Sperrung/Blockierung des Kontos führen. Verwendung auf eigenes Risiko.

## Gebündeltes Plugin

Zalo Personal wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Zalo Personal ausschließt,
installieren Sie es manuell:

- Über CLI installieren: `openclaw plugins install @openclaw/zalouser`
- Oder aus einem Quellcode-Checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Details: [Plugins](/tools/plugin)

Es ist keine externe `zca`-/`openzca`-CLI-Binärdatei erforderlich.

## Schnelle Einrichtung (für Einsteiger)

1. Stellen Sie sicher, dass das Zalo-Personal-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
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
- Verwendet native Ereignis-Listener zum Empfangen eingehender Nachrichten.
- Sendet Antworten direkt über die JS-API (Text/Medien/Link).
- Entwickelt für Anwendungsfälle mit „persönlichen Konten“, bei denen die Zalo Bot API nicht verfügbar ist.

## Benennung

Die Kanal-ID ist `zalouser`, um deutlich zu machen, dass dies ein **persönliches Zalo-Benutzerkonto** (inoffiziell) automatisiert. `zalo` bleibt für eine mögliche zukünftige offizielle Zalo-API-Integration reserviert.

## IDs finden (Verzeichnis)

Verwenden Sie die Verzeichnis-CLI, um Peers/Gruppen und deren IDs zu ermitteln:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Einschränkungen

- Ausgehender Text wird auf etwa 2000 Zeichen segmentiert (Zalo-Client-Limits).
- Streaming ist standardmäßig blockiert.

## Zugriffssteuerung (DMs)

`channels.zalouser.dmPolicy` unterstützt: `pairing | allowlist | open | disabled` (Standard: `pairing`).

`channels.zalouser.allowFrom` akzeptiert Benutzer-IDs oder Namen. Während der Einrichtung werden Namen mithilfe der im Plugin integrierten Kontaktsuche zu IDs aufgelöst.

Genehmigen über:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Gruppenzugriff (optional)

- Standard: `channels.zalouser.groupPolicy = "open"` (Gruppen erlaubt). Verwenden Sie `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn er nicht gesetzt ist.
- Auf eine Allowlist beschränken mit:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (Schlüssel sollten stabile Gruppen-IDs sein; Namen werden beim Start nach Möglichkeit zu IDs aufgelöst)
  - `channels.zalouser.groupAllowFrom` (steuert, welche Absender in erlaubten Gruppen den Bot auslösen können)
- Alle Gruppen blockieren: `channels.zalouser.groupPolicy = "disabled"`.
- Der Konfigurationsassistent kann nach Gruppen-Allowlists fragen.
- Beim Start löst OpenClaw Gruppen-/Benutzernamen in Allowlists zu IDs auf und protokolliert die Zuordnung.
- Der Abgleich mit der Gruppen-Allowlist erfolgt standardmäßig nur per ID. Nicht aufgelöste Namen werden für die Authentifizierung ignoriert, sofern nicht `channels.zalouser.dangerouslyAllowNameMatching: true` aktiviert ist.
- `channels.zalouser.dangerouslyAllowNameMatching: true` ist ein Kompatibilitätsmodus für Notfälle, der den Abgleich mit veränderlichen Gruppennamen wieder aktiviert.
- Wenn `groupAllowFrom` nicht gesetzt ist, verwendet die Runtime `allowFrom` als Fallback für Prüfungen von Gruppenabsendern.
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

### Mention-Gating für Gruppen

- `channels.zalouser.groups.<group>.requireMention` steuert, ob Antworten in Gruppen eine Erwähnung erfordern.
- Auflösungsreihenfolge: exakte Gruppen-ID/-Name -> normalisierter Gruppen-Slug -> `*` -> Standard (`true`).
- Dies gilt sowohl für allowlistete Gruppen als auch für den offenen Gruppenmodus.
- Autorisierte Steuerbefehle (zum Beispiel `/new`) können das Mention-Gating umgehen.
- Wenn eine Gruppennachricht übersprungen wird, weil eine Erwähnung erforderlich ist, speichert OpenClaw sie als ausstehende Gruppenhistorie und fügt sie bei der nächsten verarbeiteten Gruppennachricht ein.
- Das Limit der Gruppenhistorie verwendet standardmäßig `messages.groupChat.historyLimit` (Fallback `50`). Sie können es pro Konto mit `channels.zalouser.historyLimit` überschreiben.

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

## Mehrere Konten

Konten werden in OpenClaw-Status auf `zalouser`-Profile abgebildet. Beispiel:

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

## Tippen, Reaktionen und Zustellbestätigungen

- OpenClaw sendet vor dem Senden einer Antwort ein Tippen-Ereignis (Best-Effort).
- Die Nachrichtenreaktionsaktion `react` wird für `zalouser` bei Kanalaktionen unterstützt.
  - Verwenden Sie `remove: true`, um ein bestimmtes Reaktions-Emoji aus einer Nachricht zu entfernen.
  - Reaktionssemantik: [Reactions](/tools/reactions)
- Für eingehende Nachrichten, die Ereignismetadaten enthalten, sendet OpenClaw Zustellungs- und Gesehen-Bestätigungen (Best-Effort).

## Fehlerbehebung

**Login bleibt nicht bestehen:**

- `openclaw channels status --probe`
- Erneut anmelden: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist-/Gruppenname wurde nicht aufgelöst:**

- Verwenden Sie numerische IDs in `allowFrom`/`groupAllowFrom`/`groups` oder exakte Freundes-/Gruppennamen.

**Von einer alten CLI-basierten Einrichtung aktualisiert:**

- Entfernen Sie alle Annahmen über alte externe `zca`-Prozesse.
- Der Kanal läuft jetzt vollständig in OpenClaw ohne externe CLI-Binärdateien.

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/channels/groups) — Verhalten von Gruppenchats und Mention-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
