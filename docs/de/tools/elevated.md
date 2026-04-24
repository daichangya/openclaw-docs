---
read_when:
    - Standardwerte, Allowlists oder Slash-Befehl-Verhalten für den erhöhten Modus anpassen
    - Verstehen, wie Agenten in einer Sandbox auf den Host zugreifen können
summary: 'Erhöhter `exec`-Modus: Befehle außerhalb der Sandbox von einem Agenten in einer Sandbox aus ausführen'
title: Erhöhter Modus
x-i18n:
    generated_at: "2026-04-24T07:02:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

Wenn ein Agent in einer Sandbox läuft, sind seine `exec`-Befehle auf die
Sandbox-Umgebung beschränkt. **Der erhöhte Modus** erlaubt dem Agenten, aus der Sandbox auszubrechen und Befehle
stattdessen außerhalb der Sandbox auszuführen, mit konfigurierbaren Freigabeschranken.

<Info>
  Der erhöhte Modus ändert das Verhalten nur, wenn der Agent sich **in einer Sandbox** befindet. Für
  Agenten ohne Sandbox läuft `exec` bereits auf dem Host.
</Info>

## Direktiven

Steuern Sie den erhöhten Modus pro Sitzung mit Slash-Befehlen:

| Direktive        | Was sie bewirkt                                                        |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Außerhalb der Sandbox auf dem konfigurierten Hostpfad ausführen, Freigaben beibehalten |
| `/elevated ask`  | Dasselbe wie `on` (Alias)                                              |
| `/elevated full` | Außerhalb der Sandbox auf dem konfigurierten Hostpfad ausführen und Freigaben überspringen |
| `/elevated off`  | Zur auf die Sandbox beschränkten Ausführung zurückkehren               |

Auch verfügbar als `/elev on|off|ask|full`.

Senden Sie `/elevated` ohne Argument, um die aktuelle Stufe zu sehen.

## Funktionsweise

<Steps>
  <Step title="Verfügbarkeit prüfen">
    Elevated muss in der Konfiguration aktiviert sein und der Absender muss auf der Allowlist stehen:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Stufe setzen">
    Senden Sie eine Nachricht, die nur aus einer Direktive besteht, um den Sitzungsstandard zu setzen:

    ```
    /elevated full
    ```

    Oder verwenden Sie sie inline (gilt nur für diese Nachricht):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Befehle laufen außerhalb der Sandbox">
    Wenn Elevated aktiv ist, verlassen `exec`-Aufrufe die Sandbox. Der effektive Host ist
    standardmäßig `gateway` oder `node`, wenn das konfigurierte/sitzungsbezogene Exec-Ziel
    `node` ist. Im Modus `full` werden Exec-Freigaben übersprungen. Im Modus `on`/`ask`
    gelten die konfigurierten Freigaberegeln weiterhin.
  </Step>
</Steps>

## Auflösungsreihenfolge

1. **Inline-Direktive** in der Nachricht (gilt nur für diese Nachricht)
2. **Sitzungsüberschreibung** (gesetzt durch Senden einer Nachricht, die nur aus einer Direktive besteht)
3. **Globaler Standard** (`agents.defaults.elevatedDefault` in der Konfiguration)

## Verfügbarkeit und Allowlists

- **Globale Schranke**: `tools.elevated.enabled` (muss `true` sein)
- **Allowlist für Absender**: `tools.elevated.allowFrom` mit Listen pro Kanal
- **Schranke pro Agent**: `agents.list[].tools.elevated.enabled` (kann nur weiter einschränken)
- **Allowlist pro Agent**: `agents.list[].tools.elevated.allowFrom` (Absender muss sowohl global als auch pro Agent übereinstimmen)
- **Discord-Fallback**: Wenn `tools.elevated.allowFrom.discord` ausgelassen wird, wird `channels.discord.allowFrom` als Fallback verwendet
- **Alle Schranken müssen erfüllt sein**; andernfalls wird Elevated als nicht verfügbar behandelt

Formate für Allowlist-Einträge:

| Präfix                  | Entspricht                         |
| ----------------------- | ---------------------------------- |
| (keines)                | Absender-ID, E.164 oder From-Feld  |
| `name:`                 | Anzeigename des Absenders          |
| `username:`             | Benutzername des Absenders         |
| `tag:`                  | Tag des Absenders                  |
| `id:`, `from:`, `e164:` | Explizites Targeting einer Identität |

## Was Elevated nicht steuert

- **Tool-Richtlinie**: Wenn `exec` durch die Tool-Richtlinie verweigert wird, kann Elevated das nicht überschreiben
- **Richtlinie zur Host-Auswahl**: Elevated verwandelt `auto` nicht in eine freie hostübergreifende Überschreibung. Es verwendet die konfigurierten/sitzungsbezogenen Regeln für das Exec-Ziel und wählt `node` nur dann, wenn das Ziel bereits `node` ist.
- **Getrennt von `/exec`**: Die Direktive `/exec` passt sitzungsbezogene Exec-Standards für autorisierte Absender an und erfordert keinen erhöhten Modus

## Verwandt

- [Exec tool](/de/tools/exec) — Ausführung von Shell-Befehlen
- [Exec approvals](/de/tools/exec-approvals) — Freigabe- und Allowlist-System
- [Sandboxing](/de/gateway/sandboxing) — Sandbox-Konfiguration
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
