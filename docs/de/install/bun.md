---
read_when:
    - Sie die schnellste lokale Entwicklungs-Schleife möchten (bun + watch)
    - Sie auf Probleme bei Bun-Installationen/Patches/Lifecycle-Skripten stoßen
summary: 'Bun-Workflow (experimentell): Installationen und Stolperfallen im Vergleich zu pnpm'
title: Bun (experimentell)
x-i18n:
    generated_at: "2026-04-05T12:45:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun (experimentell)

<Warning>
Bun wird **nicht für die Gateway-Laufzeit empfohlen** (bekannte Probleme mit WhatsApp und Telegram). Verwenden Sie Node für die Produktion.
</Warning>

Bun ist eine optionale lokale Laufzeit, um TypeScript direkt auszuführen (`bun run ...`, `bun --watch ...`). Der Standard-Paketmanager bleibt `pnpm`, das vollständig unterstützt wird und von der Doku-Toolchain verwendet wird. Bun kann `pnpm-lock.yaml` nicht verwenden und ignoriert es.

## Installation

<Steps>
  <Step title="Abhängigkeiten installieren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` werden in Git ignoriert, daher gibt es keinen Repo-Churn. Um das Schreiben von Lockfiles vollständig zu überspringen:

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

Bun blockiert Lifecycle-Skripte von Abhängigkeiten, sofern sie nicht ausdrücklich als vertrauenswürdig markiert werden. Für dieses Repository sind die üblicherweise blockierten Skripte nicht erforderlich:

- `@whiskeysockets/baileys` `preinstall` -- prüft, ob die Node-Hauptversion >= 20 ist (OpenClaw verwendet standardmäßig Node 24 und unterstützt weiterhin Node 22 LTS, derzeit `22.14+`)
- `protobufjs` `postinstall` -- gibt Warnungen über inkompatible Versionsschemata aus (keine Build-Artefakte)

Wenn Sie auf ein Laufzeitproblem stoßen, das diese Skripte erfordert, markieren Sie sie explizit als vertrauenswürdig:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Einschränkungen

Einige Skripte hardcoden weiterhin pnpm (zum Beispiel `docs:build`, `ui:*`, `protocol:check`). Führen Sie diese vorerst mit pnpm aus.
