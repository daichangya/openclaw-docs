---
read_when:
    - Du möchtest MiniMax für `web_search` verwenden
    - Du benötigst einen MiniMax-Coding-Plan-Schlüssel
    - Du möchtest Hinweise zu MiniMax-CN/global-Suchhosts
summary: MiniMax Search über die Such-API des Coding Plan
title: MiniMax Search
x-i18n:
    generated_at: "2026-04-05T12:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# MiniMax Search

OpenClaw unterstützt MiniMax als `web_search`-Provider über die MiniMax-
Such-API des Coding Plan. Sie liefert strukturierte Suchergebnisse mit Titeln, URLs,
Snippets und verwandten Suchanfragen zurück.

## Einen Coding-Plan-Schlüssel erhalten

<Steps>
  <Step title="Einen Schlüssel erstellen">
    Erstelle oder kopiere einen MiniMax-Coding-Plan-Schlüssel aus der
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Den Schlüssel speichern">
    Setze `MINIMAX_CODE_PLAN_KEY` in der Gateway-Umgebung oder konfiguriere ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw akzeptiert außerdem `MINIMAX_CODING_API_KEY` als env-Alias. `MINIMAX_API_KEY`
wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn es bereits auf ein Coding-Plan-Token verweist.

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

**Umgebungsalternative:** setze `MINIMAX_CODE_PLAN_KEY` in der Gateway-Umgebung.
Für eine Gateway-Installation lege es in `~/.openclaw/.env` ab.

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

Auch wenn du MiniMax über den OAuth-Pfad `minimax-portal` authentifiziert hast,
registriert sich die Websuche weiterhin als Provider-ID `minimax`; die OAuth-Provider-Base-URL
wird nur als Regionshinweis für die Auswahl des CN-/global-Hosts verwendet.

## Unterstützte Parameter

MiniMax Search unterstützt:

- `query`
- `count` (OpenClaw kürzt die zurückgegebene Ergebnisliste auf die angeforderte Anzahl)

Provider-spezifische Filter werden derzeit nicht unterstützt.

## Verwandt

- [Web Search overview](/tools/web) -- alle Provider und Auto-Erkennung
- [MiniMax](/providers/minimax) -- Modell-, Bild-, Sprach- und Authentifizierungs-Setup
