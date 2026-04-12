---
read_when:
    - Sie möchten Xiaomi-MiMo-Modelle in OpenClaw verwenden
    - Sie benötigen die Einrichtung von `XIAOMI_API_KEY`
summary: Xiaomi-MiMo-Modelle mit OpenClaw verwenden
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-12T23:33:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd5a526764c796da7e1fff61301bc2ec618e1cf3857894ba2ef4b6dd9c4dc339
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo ist die API-Plattform für **MiMo**-Modelle. OpenClaw verwendet den Xiaomi-
OpenAI-kompatiblen Endpunkt mit API-Key-Authentifizierung.

| Eigenschaft | Wert                           |
| ----------- | ------------------------------ |
| Provider    | `xiaomi`                       |
| Auth        | `XIAOMI_API_KEY`               |
| API         | OpenAI-kompatibel              |
| Base URL    | `https://api.xiaomimimo.com/v1` |

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel in der [Xiaomi MiMo-Konsole](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Oder den Schlüssel direkt übergeben:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Verfügbare Modelle

| Modell-Ref             | Eingabe     | Kontext   | Max. Ausgabe | Reasoning | Hinweise      |
| ---------------------- | ----------- | --------- | ------------ | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | Text        | 262.144   | 8.192        | Nein      | Standardmodell |
| `xiaomi/mimo-v2-pro`   | Text        | 1.048.576 | 32.000       | Ja        | Großer Kontext |
| `xiaomi/mimo-v2-omni`  | Text, Bild  | 262.144   | 32.000       | Ja        | Multimodal    |

<Tip>
Die Standard-Modell-Ref ist `xiaomi/mimo-v2-flash`. Der Provider wird automatisch eingefügt, wenn `XIAOMI_API_KEY` gesetzt ist oder ein Auth-Profil existiert.
</Tip>

## Konfigurationsbeispiel

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Verhalten bei automatischer Einfügung">
    Der Provider `xiaomi` wird automatisch eingefügt, wenn `XIAOMI_API_KEY` in Ihrer Umgebung gesetzt ist oder ein Auth-Profil existiert. Sie müssen den Provider nicht manuell konfigurieren, es sei denn, Sie möchten Modellmetadaten oder die Base URL überschreiben.
  </Accordion>

  <Accordion title="Modelldetails">
    - **mimo-v2-flash** — leichtgewichtig und schnell, ideal für allgemeine Textaufgaben. Keine Reasoning-Unterstützung.
    - **mimo-v2-pro** — unterstützt Reasoning mit einem Kontextfenster von 1 Mio. Tokens für Workloads mit langen Dokumenten.
    - **mimo-v2-omni** — multimodales Modell mit aktivierter Reasoning-Unterstützung, das sowohl Text- als auch Bildeingaben akzeptiert.

    <Note>
    Alle Modelle verwenden das Präfix `xiaomi/` (zum Beispiel `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn Modelle nicht angezeigt werden, bestätigen Sie, dass `XIAOMI_API_KEY` gesetzt und gültig ist.
    - Wenn das Gateway als Daemon läuft, stellen Sie sicher, dass der Schlüssel für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für daemonverwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv` für dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Xiaomi MiMo-Konsole" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi-MiMo-Dashboard und Verwaltung von API-Schlüsseln.
  </Card>
</CardGroup>
