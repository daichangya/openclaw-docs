---
read_when:
    - Sie möchten Perplexity als Websuch-Provider konfigurieren
    - Sie benötigen den Perplexity-API-Schlüssel oder die Einrichtung des OpenRouter-Proxys
summary: Einrichtung des Perplexity-Websuch-Providers (API-Schlüssel, Suchmodi, Filterung)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T06:55:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Websuch-Provider)

Das Perplexity-Plugin stellt Websuchfunktionen über die Perplexity Search API oder Perplexity Sonar über OpenRouter bereit.

<Note>
Diese Seite behandelt das Setup des **Providers** Perplexity. Für das **Tool** Perplexity
(wie der Agent es verwendet) siehe [Perplexity-Tool](/de/tools/perplexity-search).
</Note>

| Eigenschaft  | Wert                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| Typ          | Websuch-Provider (kein Modell-Provider)                                |
| Auth         | `PERPLEXITY_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter) |
| Konfig.-Pfad | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Erste Schritte

<Steps>
  <Step title="Den API-Schlüssel setzen">
    Führen Sie den interaktiven Konfigurationsablauf für Websuche aus:

    ```bash
    openclaw configure --section web
    ```

    Oder setzen Sie den Schlüssel direkt:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Mit der Suche beginnen">
    Der Agent verwendet Perplexity automatisch für Websuchen, sobald der Schlüssel
    konfiguriert ist. Es sind keine weiteren Schritte erforderlich.
  </Step>
</Steps>

## Suchmodi

Das Plugin wählt den Transport automatisch anhand des Präfixes des API-Schlüssels aus:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Wenn Ihr Schlüssel mit `pplx-` beginnt, verwendet OpenClaw die native Perplexity Search
    API. Dieser Transport liefert strukturierte Ergebnisse zurück und unterstützt Domain-, Sprach-
    und Datumsfilter (siehe Filteroptionen unten).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Wenn Ihr Schlüssel mit `sk-or-` beginnt, routet OpenClaw über OpenRouter unter Verwendung
    des Perplexity-Sonar-Modells. Dieser Transport gibt KI-synthetisierte Antworten mit
    Zitaten zurück.
  </Tab>
</Tabs>

| Schlüsselpräfix | Transport                     | Funktionen                                       |
| --------------- | ----------------------------- | ------------------------------------------------ |
| `pplx-`         | Native Perplexity Search API  | Strukturierte Ergebnisse, Domain-/Sprach-/Datumsfilter |
| `sk-or-`        | OpenRouter (Sonar)            | KI-synthetisierte Antworten mit Zitaten          |

## Filterung der nativen API

<Note>
Filteroptionen sind nur verfügbar, wenn die native Perplexity API
(`pplx-`-Schlüssel) verwendet wird. OpenRouter-/Sonar-Suchen unterstützen diese Parameter nicht.
</Note>

Wenn die native Perplexity API verwendet wird, unterstützen Suchen die folgenden Filter:

| Filter         | Beschreibung                           | Beispiel                            |
| -------------- | -------------------------------------- | ----------------------------------- |
| Land           | 2-stelliger Ländercode                 | `us`, `de`, `jp`                    |
| Sprache        | ISO-639-1-Sprachcode                   | `en`, `fr`, `zh`                    |
| Datumsbereich  | Aktualitätsfenster                     | `day`, `week`, `month`, `year`      |
| Domain-Filter  | Allowlist oder Denylist (max. 20 Domains) | `example.com`                    |
| Inhaltsbudget  | Token-Limits pro Antwort / pro Seite   | `max_tokens`, `max_tokens_per_page` |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn das OpenClaw Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass
    `PERPLEXITY_API_KEY` diesem Prozess zur Verfügung steht.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` gesetzt ist, ist für einen launchd-/systemd-
    Daemon nicht sichtbar, sofern diese Umgebung nicht explizit importiert wird. Setzen Sie den Schlüssel in
    `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess
    ihn lesen kann.
    </Warning>

  </Accordion>

  <Accordion title="Setup des OpenRouter-Proxys">
    Wenn Sie Perplexity-Suchen lieber über OpenRouter routen möchten, setzen Sie
    stattdessen `OPENROUTER_API_KEY` (Präfix `sk-or-`) statt eines nativen Perplexity-Schlüssels.
    OpenClaw erkennt das Präfix und schaltet automatisch auf den Sonar-Transport
    um.

    <Tip>
    Der OpenRouter-Transport ist nützlich, wenn Sie bereits ein OpenRouter-Konto
    haben und konsolidierte Abrechnung über mehrere Provider hinweg möchten.
    </Tip>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Perplexity-Such-Tool" href="/de/tools/perplexity-search" icon="magnifying-glass">
    Wie der Agent Perplexity-Suchen aufruft und Ergebnisse interpretiert.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich Plugin-Einträgen.
  </Card>
</CardGroup>
