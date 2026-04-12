---
read_when:
    - Sie möchten Perplexity als Web-Such-Provider konfigurieren
    - Sie benötigen den API-Schlüssel für Perplexity oder die Einrichtung des OpenRouter-Proxys
summary: Einrichtung des Perplexity-Web-Such-Providers (API-Schlüssel, Suchmodi, Filterung)
title: Perplexity
x-i18n:
    generated_at: "2026-04-12T23:32:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55c089e96601ebe05480d305364272c7f0ac721caa79746297c73002a9f20f55
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Web-Such-Provider)

Das Perplexity-Plugin stellt Web-Suchfunktionen über die Perplexity
Search API oder Perplexity Sonar über OpenRouter bereit.

<Note>
Diese Seite behandelt die Einrichtung des **Providers** Perplexity. Informationen zum Perplexity-
**Tool** (wie der Agent es verwendet) finden Sie unter [Perplexity tool](/de/tools/perplexity-search).
</Note>

| Eigenschaft | Wert                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| Typ         | Web-Such-Provider (kein Modell-Provider)                               |
| Auth        | `PERPLEXITY_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter) |
| Konfigurationspfad | `plugins.entries.perplexity.config.webSearch.apiKey`           |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Führen Sie den interaktiven Konfigurationsablauf für die Web-Suche aus:

    ```bash
    openclaw configure --section web
    ```

    Oder legen Sie den Schlüssel direkt fest:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Mit der Suche beginnen">
    Der Agent verwendet Perplexity automatisch für Web-Suchen, sobald der Schlüssel
    konfiguriert ist. Es sind keine zusätzlichen Schritte erforderlich.
  </Step>
</Steps>

## Suchmodi

Das Plugin wählt den Transport automatisch anhand des Präfixes des API-Schlüssels aus:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Wenn Ihr Schlüssel mit `pplx-` beginnt, verwendet OpenClaw die native Perplexity Search
    API. Dieser Transport gibt strukturierte Ergebnisse zurück und unterstützt Domain-, Sprach-
    und Datumsfilter (siehe Filteroptionen unten).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Wenn Ihr Schlüssel mit `sk-or-` beginnt, leitet OpenClaw über OpenRouter unter Verwendung
    des Perplexity-Sonar-Modells weiter. Dieser Transport gibt KI-synthetisierte Antworten mit
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
(Schlüssel `pplx-`) verwendet wird. OpenRouter-/Sonar-Suchen unterstützen diese Parameter nicht.
</Note>

Bei Verwendung der nativen Perplexity API unterstützen Suchanfragen die folgenden Filter:

| Filter           | Beschreibung                            | Beispiel                            |
| ---------------- | --------------------------------------- | ----------------------------------- |
| Land             | 2-stelliger Ländercode                  | `us`, `de`, `jp`                    |
| Sprache          | Sprachcode nach ISO 639-1               | `en`, `fr`, `zh`                    |
| Datumsbereich    | Aktualitätsfenster                      | `day`, `week`, `month`, `year`      |
| Domain-Filter    | Allowlist oder Denylist (max. 20 Domains) | `example.com`                     |
| Inhaltsbudget    | Token-Limits pro Antwort / pro Seite    | `max_tokens`, `max_tokens_per_page` |

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn das OpenClaw Gateway als Daemon (launchd/systemd) läuft, stellen Sie sicher,
    dass `PERPLEXITY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` gesetzt ist, ist für einen launchd-/systemd-
    Daemon nicht sichtbar, sofern diese Umgebung nicht explizit importiert wird. Legen Sie den Schlüssel in
    `~/.openclaw/.env` oder über `env.shellEnv` fest, damit der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>

  <Accordion title="Einrichtung des OpenRouter-Proxys">
    Wenn Sie Perplexity-Suchen lieber über OpenRouter leiten möchten, setzen Sie
    statt eines nativen Perplexity-Schlüssels einen `OPENROUTER_API_KEY` (Präfix `sk-or-`).
    OpenClaw erkennt das Präfix und wechselt automatisch zum Sonar-Transport.

    <Tip>
    Der OpenRouter-Transport ist nützlich, wenn Sie bereits ein OpenRouter-Konto haben
    und eine konsolidierte Abrechnung über mehrere Provider hinweg wünschen.
    </Tip>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Perplexity-Suchtool" href="/de/tools/perplexity-search" icon="magnifying-glass">
    Wie der Agent Perplexity-Suchen aufruft und Ergebnisse interpretiert.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich Plugin-Einträgen.
  </Card>
</CardGroup>
