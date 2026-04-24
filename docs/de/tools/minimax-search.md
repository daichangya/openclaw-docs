---
read_when:
    - Sie möchten MiniMax für `web_search` verwenden
    - Sie benötigen einen MiniMax-Coding-Plan-Schlüssel
    - Sie möchten Hinweise zu MiniMax-CN-/globalen Search-Hosts
summary: MiniMax Search über die Search-API von Coding Plan
title: MiniMax Search
x-i18n:
    generated_at: "2026-04-24T07:04:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw unterstützt MiniMax als Provider für `web_search` über die Search-API von MiniMax
Coding Plan. Sie gibt strukturierte Suchergebnisse mit Titeln, URLs,
Snippets und verwandten Suchanfragen zurück.

## Einen Coding-Plan-Schlüssel holen

<Steps>
  <Step title="Einen Schlüssel erstellen">
    Erstellen oder kopieren Sie einen MiniMax-Coding-Plan-Schlüssel von
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Den Schlüssel speichern">
    Setzen Sie `MINIMAX_CODE_PLAN_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akzeptiert auch `MINIMAX_CODING_API_KEY` als Alias für eine Umgebungsvariable. `MINIMAX_API_KEY`
wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn er bereits auf ein Coding-Plan-Token verweist.

## Konfiguration

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional, wenn MINIMAX_CODE_PLAN_KEY gesetzt ist
            region: "global", // oder "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Alternative per Umgebungsvariable:** Setzen Sie `MINIMAX_CODE_PLAN_KEY` in der Gateway-Umgebung.
Bei einer Gateway-Installation legen Sie ihn in `~/.openclaw/.env` ab.

## Regionsauswahl

MiniMax Search verwendet diese Endpunkte:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Wenn `plugins.entries.minimax.config.webSearch.region` nicht gesetzt ist, löst OpenClaw
die Region in dieser Reihenfolge auf:

1. `tools.web.search.minimax.region` / plugin-eigenes `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Das bedeutet, dass CN-Onboarding oder `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search ebenfalls automatisch auf dem CN-Host hält.

Auch wenn Sie sich bei MiniMax über den OAuth-Pfad `minimax-portal` authentifiziert haben,
registriert sich die Websuche weiterhin mit der Provider-ID `minimax`; die Base-URL des OAuth-Providers
wird nur als Regionshinweis für die Auswahl des CN-/globalen Hosts verwendet.

## Unterstützte Parameter

MiniMax Search unterstützt:

- `query`
- `count` (OpenClaw kürzt die zurückgegebene Ergebnisliste auf die angeforderte Anzahl)

Providerspezifische Filter werden derzeit nicht unterstützt.

## Verwandt

- [Web Search overview](/de/tools/web) -- alle Provider und automatische Erkennung
- [MiniMax](/de/providers/minimax) -- Einrichtung von Modell, Bild, Sprache und Auth
