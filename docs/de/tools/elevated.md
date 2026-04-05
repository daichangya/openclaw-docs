---
read_when:
    - Anpassen von Standardwerten, Allowlists oder Slash-Command-Verhalten für den erhöhten Modus
    - Verstehen, wie sandboxed Agenten auf den Host zugreifen können
summary: 'Erhöhter Exec-Modus: Befehle außerhalb der Sandbox von einem sandboxed Agenten aus ausführen'
title: Erhöhter Modus
x-i18n:
    generated_at: "2026-04-05T12:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# Erhöhter Modus

Wenn ein Agent in einer Sandbox läuft, sind seine `exec`-Befehle auf die
Sandbox-Umgebung beschränkt. Im **erhöhten Modus** kann der Agent ausbrechen und stattdessen Befehle
außerhalb der Sandbox ausführen, mit konfigurierbaren Genehmigungsstufen.

<Info>
  Der erhöhte Modus ändert das Verhalten nur, wenn der Agent **sandboxed** ist. Bei
  nicht sandboxed Agenten läuft `exec` bereits auf dem Host.
</Info>

## Direktiven

Steuern Sie den erhöhten Modus pro Sitzung mit Slash-Commands:

| Direktive       | Was sie bewirkt                                                      |
| --------------- | -------------------------------------------------------------------- |
| `/elevated on`   | Außerhalb der Sandbox auf dem konfigurierten Host-Pfad ausführen, Genehmigungen beibehalten |
| `/elevated ask`  | Dasselbe wie `on` (Alias)                                           |
| `/elevated full` | Außerhalb der Sandbox auf dem konfigurierten Host-Pfad ausführen und Genehmigungen überspringen |
| `/elevated off`  | Zur auf die Sandbox beschränkten Ausführung zurückkehren            |

Auch verfügbar als `/elev on|off|ask|full`.

Senden Sie `/elevated` ohne Argument, um die aktuelle Stufe anzuzeigen.

## Funktionsweise

<Steps>
  <Step title="Verfügbarkeit prüfen">
    „Elevated“ muss in der Konfiguration aktiviert sein und der Absender muss auf der Allowlist stehen:

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

  <Step title="Die Stufe festlegen">
    Senden Sie eine Nachricht, die nur aus einer Direktive besteht, um den Sitzungsstandard festzulegen:

    ```
    /elevated full
    ```

    Oder verwenden Sie sie inline (gilt nur für diese Nachricht):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Befehle laufen außerhalb der Sandbox">
    Wenn „elevated“ aktiv ist, verlassen `exec`-Aufrufe die Sandbox. Der effektive Host ist standardmäßig
    `gateway` oder `node`, wenn das konfigurierte/sessionbasierte Exec-Ziel
    `node` ist. Im Modus `full` werden Exec-Genehmigungen übersprungen. In den Modi `on`/`ask`
    gelten konfigurierte Genehmigungsregeln weiterhin.
  </Step>
</Steps>

## Auflösungsreihenfolge

1. **Inline-Direktive** in der Nachricht (gilt nur für diese Nachricht)
2. **Sitzungs-Override** (gesetzt durch das Senden einer Nachricht, die nur aus einer Direktive besteht)
3. **Globaler Standard** (`agents.defaults.elevatedDefault` in der Konfiguration)

## Verfügbarkeit und Allowlists

- **Globales Gate**: `tools.elevated.enabled` (muss `true` sein)
- **Allowlist für Absender**: `tools.elevated.allowFrom` mit Listen pro Channel
- **Gate pro Agent**: `agents.list[].tools.elevated.enabled` (kann nur weiter einschränken)
- **Allowlist pro Agent**: `agents.list[].tools.elevated.allowFrom` (Absender muss sowohl global als auch pro Agent übereinstimmen)
- **Discord-Fallback**: Wenn `tools.elevated.allowFrom.discord` ausgelassen wird, wird `channels.discord.allowFrom` als Fallback verwendet
- **Alle Gates müssen erfolgreich sein**; andernfalls wird „elevated“ als nicht verfügbar behandelt

Formate für Allowlist-Einträge:

| Präfix                  | Entspricht                       |
| ----------------------- | -------------------------------- |
| (keines)                | Absender-ID, E.164 oder From-Feld |
| `name:`                 | Anzeigename des Absenders        |
| `username:`             | Benutzername des Absenders       |
| `tag:`                  | Tag des Absenders                |
| `id:`, `from:`, `e164:` | Explizite Identitätsadressierung |

## Was „elevated“ nicht steuert

- **Tool-Richtlinie**: Wenn `exec` durch die Tool-Richtlinie verweigert wird, kann „elevated“ das nicht überschreiben
- **Host-Auswahlrichtlinie**: „Elevated“ macht aus `auto` keine freie hostübergreifende Überschreibung. Es verwendet die konfigurierten/sessionbasierten Regeln für das Exec-Ziel und wählt `node` nur dann, wenn das Ziel bereits `node` ist.
- **Getrennt von `/exec`**: Die Direktive `/exec` passt die sessionbasierten Exec-Standardeinstellungen für autorisierte Absender an und erfordert keinen erhöhten Modus

## Verwandt

- [Exec-Tool](/tools/exec) — Shell-Befehlsausführung
- [Exec-Genehmigungen](/tools/exec-approvals) — Genehmigungs- und Allowlist-System
- [Sandboxing](/de/gateway/sandboxing) — Sandbox-Konfiguration
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
