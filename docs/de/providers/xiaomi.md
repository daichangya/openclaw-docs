---
read_when:
    - Sie möchten Xiaomi-MiMo-Modelle in OpenClaw ഉപയോഗ করতে
    - Sie benötigen die Einrichtung von XIAOMI_API_KEY
summary: Xiaomi-MiMo-Modelle mit OpenClaw verwenden
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-24T06:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae61547fa5864f0cd3e19465a8a7d6ff843f9534ab9c2dd39a86a3593cafaa8d
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo ist die API-Plattform für **MiMo**-Modelle. OpenClaw verwendet den
OpenAI-kompatiblen Endpunkt von Xiaomi mit Authentifizierung über API-Schlüssel.

| Eigenschaft | Wert                            |
| ----------- | ------------------------------- |
| Anbieter    | `xiaomi`                        |
| Auth        | `XIAOMI_API_KEY`                |
| API         | OpenAI-kompatibel               |
| Base-URL    | `https://api.xiaomimimo.com/v1` |

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel beziehen">
    Erstellen Sie einen API-Schlüssel in der [Xiaomi-MiMo-Konsole](https://platform.xiaomimimo.com/#/console/api-keys).
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
  <Step title="Überprüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Integrierter Katalog

| Modellreferenz         | Eingabe     | Kontext   | Max. Ausgabe | Reasoning | Hinweise       |
| ---------------------- | ----------- | --------- | ------------ | --------- | -------------- |
| `xiaomi/mimo-v2-flash` | Text        | 262,144   | 8,192        | Nein      | Standardmodell |
| `xiaomi/mimo-v2-pro`   | Text        | 1,048,576 | 32,000       | Ja        | Großer Kontext |
| `xiaomi/mimo-v2-omni`  | Text, Bild  | 262,144   | 32,000       | Ja        | Multimodal     |

<Tip>
Die Standard-Modellreferenz ist `xiaomi/mimo-v2-flash`. Der Anbieter wird automatisch eingefügt, wenn `XIAOMI_API_KEY` gesetzt ist oder ein Auth-Profil existiert.
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
  <Accordion title="Verhalten bei Auto-Injektion">
    Der Anbieter `xiaomi` wird automatisch eingefügt, wenn `XIAOMI_API_KEY` in Ihrer Umgebung gesetzt ist oder ein Auth-Profil existiert. Sie müssen den Anbieter nicht manuell konfigurieren, es sei denn, Sie möchten Modellmetadaten oder die Base-URL überschreiben.
  </Accordion>

  <Accordion title="Modelldetails">
    - **mimo-v2-flash** — leichtgewichtig und schnell, ideal für allgemeine Textaufgaben. Keine Unterstützung für Reasoning.
    - **mimo-v2-pro** — unterstützt Reasoning mit einem Kontextfenster von 1M Tokens für Workloads mit langen Dokumenten.
    - **mimo-v2-omni** — multimodales Modell mit aktiviertem Reasoning, das sowohl Text- als auch Bildeingaben akzeptiert.

    <Note>
    Alle Modelle verwenden das Präfix `xiaomi/` (zum Beispiel `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn Modelle nicht erscheinen, prüfen Sie, ob `XIAOMI_API_KEY` gesetzt und gültig ist.
    - Wenn das Gateway als Daemon läuft, stellen Sie sicher, dass der Schlüssel diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für daemonverwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv`, um dauerhafte Verfügbarkeit sicherzustellen.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Anbieter, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Xiaomi-MiMo-Konsole" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi-MiMo-Dashboard und Verwaltung von API-Schlüsseln.
  </Card>
</CardGroup>
