---
read_when:
    - Ändern des Verhaltens oder der Standardwerte von Tippindikatoren
summary: Wann OpenClaw Tippindikatoren anzeigt und wie man sie anpasst
title: Tippindikatoren
x-i18n:
    generated_at: "2026-04-05T12:41:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28c8c395a135fc0745181aab66a93582177e6acd0b3496debcbb98159a4f11dc
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Tippindikatoren

Tippindikatoren werden an den Chat-Kanal gesendet, während ein Lauf aktiv ist. Verwenden Sie
`agents.defaults.typingMode`, um zu steuern, **wann** Tippen beginnt, und `typingIntervalSeconds`,
um zu steuern, **wie oft** es aktualisiert wird.

## Standardwerte

Wenn `agents.defaults.typingMode` **nicht gesetzt** ist, behält OpenClaw das veraltete Verhalten bei:

- **Direktchats**: Tippen beginnt sofort, sobald die Modellschleife startet.
- **Gruppenchats mit Erwähnung**: Tippen beginnt sofort.
- **Gruppenchats ohne Erwähnung**: Tippen beginnt erst, wenn der Nachrichtentext zu streamen beginnt.
- **Heartbeat-Läufe**: Tippen ist deaktiviert.

## Modi

Setzen Sie `agents.defaults.typingMode` auf einen der folgenden Werte:

- `never` — niemals einen Tippindikator anzeigen.
- `instant` — mit dem Tippen **beginnen, sobald die Modellschleife startet**, auch wenn der Lauf
  später nur das Silent-Reply-Token zurückgibt.
- `thinking` — beim **ersten Reasoning-Delta** mit dem Tippen beginnen (erfordert
  `reasoningLevel: "stream"` für den Lauf).
- `message` — beim **ersten nicht stillen Text-Delta** mit dem Tippen beginnen (ignoriert
  das Silent-Token `NO_REPLY`).

Reihenfolge von „wie früh es ausgelöst wird“:
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

- Der Modus `message` zeigt kein Tippen für nur stille Antworten an, wenn die gesamte
  Payload genau das Silent-Token ist (zum Beispiel `NO_REPLY` / `no_reply`,
  ohne Berücksichtigung der Groß-/Kleinschreibung abgeglichen).
- `thinking` wird nur ausgelöst, wenn der Lauf Reasoning streamt (`reasoningLevel: "stream"`).
  Wenn das Modell keine Reasoning-Deltas ausgibt, beginnt das Tippen nicht.
- Heartbeats zeigen niemals Tippen an, unabhängig vom Modus.
- `typingIntervalSeconds` steuert die **Aktualisierungstaktung**, nicht den Startzeitpunkt.
  Der Standardwert ist 6 Sekunden.
