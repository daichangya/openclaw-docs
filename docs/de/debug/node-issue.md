---
read_when:
    - Fehlerbehebung bei nur unter Node auftretenden Dev-Skripten oder Watch-Mode-Fehlern
    - Untersuchen von Abstürzen des tsx/esbuild-Loaders in OpenClaw
summary: Hinweise und Workarounds für den Absturz „__name is not a function“ mit Node + tsx
title: Absturz mit Node + tsx
x-i18n:
    generated_at: "2026-04-24T06:36:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# Absturz mit Node + tsx „\_\_name is not a function“

## Zusammenfassung

Das Ausführen von OpenClaw über Node mit `tsx` schlägt beim Start fehl mit:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Dies begann nach der Umstellung der Dev-Skripte von Bun auf `tsx` (Commit `2871657e`, 2026-01-06). Derselbe Laufzeitpfad funktionierte mit Bun.

## Umgebung

- Node: v25.x (beobachtet unter v25.3.0)
- tsx: 4.21.0
- Betriebssystem: macOS (Reproduktion wahrscheinlich auch auf anderen Plattformen möglich, die Node 25 ausführen)

## Reproduktion (nur Node)

```bash
# im Repo-Root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Minimale Reproduktion im Repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Prüfung der Node-Version

- Node 25.3.0: schlägt fehl
- Node 22.22.0 (Homebrew `node@22`): schlägt fehl
- Node 24: hier noch nicht installiert; muss noch verifiziert werden

## Hinweise / Hypothese

- `tsx` verwendet esbuild, um TS/ESM zu transformieren. esbuilds `keepNames` erzeugt einen Helper `__name` und umschließt Funktionsdefinitionen mit `__name(...)`.
- Der Absturz zeigt an, dass `__name` existiert, zur Laufzeit aber keine Funktion ist. Das deutet darauf hin, dass der Helper in diesem Modulpfad des Node-25-Loaders fehlt oder überschrieben wird.
- Ähnliche Probleme mit dem `__name`-Helper wurden auch bei anderen esbuild-Konsumenten gemeldet, wenn der Helper fehlt oder umgeschrieben wird.

## Verlauf der Regression

- `2871657e` (2026-01-06): Skripte wurden von Bun auf tsx umgestellt, um Bun optional zu machen.
- Davor (Bun-Pfad) funktionierten `openclaw status` und `gateway:watch`.

## Workarounds

- Verwenden Sie Bun für Dev-Skripte (derzeitige temporäre Rücknahme).
- Verwenden Sie `tsgo` für die Typechecks des Repos und führen Sie dann die gebaute Ausgabe aus:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Historischer Hinweis: `tsc` wurde hier während des Debuggings dieses Node-/tsx-Problems verwendet, aber die Typecheck-Lanes des Repos verwenden jetzt `tsgo`.
- Deaktivieren Sie nach Möglichkeit esbuild `keepNames` im TS-Loader (dadurch wird das Einfügen des `__name`-Helpers verhindert); tsx stellt dies derzeit nicht bereit.
- Testen Sie Node LTS (22/24) mit `tsx`, um festzustellen, ob das Problem spezifisch für Node 25 ist.

## Referenzen

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Nächste Schritte

- Auf Node 22/24 reproduzieren, um eine Regression in Node 25 zu bestätigen.
- `tsx` nightly testen oder auf eine frühere Version pinnen, falls eine bekannte Regression vorliegt.
- Wenn es sich auch unter Node LTS reproduzieren lässt, upstream eine minimale Reproduktion mit dem `__name`-Stack-Trace melden.

## Verwandt

- [Node.js-Installation](/de/install/node)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
