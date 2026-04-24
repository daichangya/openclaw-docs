---
read_when:
    - Verhalten oder Standardwerte von Tippindikatoren ändern
summary: Wann OpenClaw Tippindikatoren anzeigt und wie man sie abstimmt
title: Tippindikatoren
x-i18n:
    generated_at: "2026-04-24T06:36:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

Tippindikatoren werden an den Chat-Channel gesendet, während ein Lauf aktiv ist. Verwenden Sie
`agents.defaults.typingMode`, um zu steuern, **wann** das Tippen beginnt, und `typingIntervalSeconds`,
um zu steuern, **wie oft** es aktualisiert wird.

## Standardwerte

Wenn `agents.defaults.typingMode` **nicht gesetzt** ist, behält OpenClaw das Legacy-Verhalten bei:

- **Direkte Chats**: Das Tippen beginnt sofort, sobald die Modell-Loop startet.
- **Gruppenchats mit Erwähnung**: Das Tippen beginnt sofort.
- **Gruppenchats ohne Erwähnung**: Das Tippen beginnt erst, wenn der Nachrichtentext zu streamen beginnt.
- **Heartbeat-Läufe**: Das Tippen beginnt, wenn der Heartbeat-Lauf startet, sofern das
  aufgelöste Heartbeat-Ziel ein Chat mit Unterstützung für Tippindikatoren ist und Tippen nicht deaktiviert wurde.

## Modi

Setzen Sie `agents.defaults.typingMode` auf einen der folgenden Werte:

- `never` — niemals einen Tippindikator anzeigen.
- `instant` — das Tippen **sobald die Modell-Loop beginnt** starten, selbst wenn der Lauf
  später nur das Silent-Reply-Token zurückgibt.
- `thinking` — das Tippen beim **ersten Reasoning-Delta** starten (erfordert
  `reasoningLevel: "stream"` für den Lauf).
- `message` — das Tippen beim **ersten nicht stillen Text-Delta** starten (ignoriert
  das Silent-Token `NO_REPLY`).

Reihenfolge danach, „wie früh es auslöst“:
`never` → `message` → `thinking` → `instant`

## Konfiguration

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Sie können Modus oder Taktung pro Sitzung überschreiben:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Hinweise

- Der Modus `message` zeigt kein Tippen für rein stille Antworten an, wenn die gesamte
  Payload exakt das Silent-Token ist (zum Beispiel `NO_REPLY` / `no_reply`,
  case-insensitive abgeglichen).
- `thinking` löst nur aus, wenn der Lauf Reasoning streamt (`reasoningLevel: "stream"`).
  Wenn das Modell keine Reasoning-Deltas ausgibt, beginnt das Tippen nicht.
- Heartbeat-Tippen ist ein Liveness-Signal für das aufgelöste Zustellziel. Es
  beginnt beim Start des Heartbeat-Laufs, statt der Stream-Taktung von `message` oder `thinking`
  zu folgen. Setzen Sie `typingMode: "never"`, um es zu deaktivieren.
- Heartbeats zeigen kein Tippen an, wenn `target: "none"` gesetzt ist, wenn das Ziel nicht
  aufgelöst werden kann, wenn die Chat-Zustellung für den Heartbeat deaktiviert ist oder wenn der
  Channel keine Tippindikatoren unterstützt.
- `typingIntervalSeconds` steuert die **Aktualisierungstaktung**, nicht den Startzeitpunkt.
  Der Standardwert ist 6 Sekunden.

## Verwandt

- [Presence](/de/concepts/presence)
- [Streaming and chunking](/de/concepts/streaming)
