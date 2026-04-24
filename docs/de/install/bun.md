---
read_when:
    - Sie möchten die schnellste lokale Entwicklungs-Schleife (bun + watch)
    - Sie stoßen auf Probleme mit Bun bei Installation/Patches/Lifecycle-Skripten
summary: 'Bun-Workflow (experimentell): Installationen und Stolperfallen im Vergleich zu pnpm'
title: Bun (experimentell)
x-i18n:
    generated_at: "2026-04-24T06:42:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun wird **nicht für die Gateway-Laufzeit empfohlen** (bekannte Probleme mit WhatsApp und Telegram). Verwenden Sie für Produktion Node.
</Warning>

Bun ist eine optionale lokale Laufzeit zum direkten Ausführen von TypeScript (`bun run ...`, `bun --watch ...`). Der Standard-Paketmanager bleibt `pnpm`, das vollständig unterstützt wird und von den Dokumentations-Tools verwendet wird. Bun kann `pnpm-lock.yaml` nicht verwenden und ignoriert es.

## Installation

<Steps>
  <Step title="Abhängigkeiten installieren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sind in Git ignoriert, daher entsteht kein Repo-Rauschen. Um das Schreiben von Lockfiles vollständig zu überspringen:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build und Tests">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Lifecycle-Skripte

Bun blockiert Lifecycle-Skripte von Abhängigkeiten, sofern ihnen nicht explizit vertraut wird. Für dieses Repo sind die am häufigsten blockierten Skripte nicht erforderlich:

- `@whiskeysockets/baileys` `preinstall` -- prüft, ob die Node-Hauptversion >= 20 ist (OpenClaw verwendet standardmäßig Node 24 und unterstützt weiterhin Node 22 LTS, derzeit `22.14+`)
- `protobufjs` `postinstall` -- gibt Warnungen über inkompatible Versionsschemata aus (keine Build-Artefakte)

Wenn Sie auf ein Laufzeitproblem stoßen, das diese Skripte erfordert, vertrauen Sie ihnen explizit:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Einschränkungen

Einige Skripte hardcoden weiterhin pnpm (zum Beispiel `docs:build`, `ui:*`, `protocol:check`). Führen Sie diese vorerst über pnpm aus.

## Verwandt

- [Installationsüberblick](/de/install)
- [Node.js](/de/install/node)
- [Aktualisieren](/de/install/updating)
