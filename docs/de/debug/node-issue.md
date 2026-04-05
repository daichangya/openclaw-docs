---
read_when:
    - Debuggen von Dev-Skripten nur für Node oder von Fehlern im Watch-Modus
    - Untersuchen von Abstürzen des tsx/esbuild-Loaders in OpenClaw
summary: Hinweise und Workarounds zum Absturz „__name is not a function“ mit Node + tsx
title: Node + tsx-Absturz
x-i18n:
    generated_at: "2026-04-05T12:41:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc
    source_path: debug/node-issue.md
    workflow: 15
---

# Absturz „\_\_name is not a function“ mit Node + tsx

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
- Betriebssystem: macOS (Reproduktion wahrscheinlich auch auf anderen Plattformen, auf denen Node 25 läuft)

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

- `tsx` verwendet esbuild, um TS/ESM zu transformieren. `keepNames` von esbuild erzeugt einen `__name`-Helper und umschließt Funktionsdefinitionen mit `__name(...)`.
- Der Absturz zeigt, dass `__name` existiert, zur Laufzeit aber keine Funktion ist. Das deutet darauf hin, dass der Helper in diesem Modulpfad des Node-25-Loaders fehlt oder überschrieben wird.
- Ähnliche Probleme mit dem `__name`-Helper wurden auch bei anderen esbuild-Nutzern gemeldet, wenn der Helper fehlt oder umgeschrieben wird.

## Regressionsverlauf

- `2871657e` (2026-01-06): Skripte wurden von Bun auf tsx umgestellt, um Bun optional zu machen.
- Davor (Bun-Pfad) funktionierten `openclaw status` und `gateway:watch`.

## Workarounds

- Bun für Dev-Skripte verwenden (aktueller temporärer Revert).
- Node + tsc watch verwenden und dann die kompilierte Ausgabe ausführen:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- Lokal bestätigt: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` funktioniert unter Node 25.
- `keepNames` von esbuild im TS-Loader deaktivieren, wenn möglich (verhindert das Einfügen des `__name`-Helpers); tsx stellt dies derzeit nicht bereit.
- Node LTS (22/24) mit `tsx` testen, um zu sehen, ob das Problem Node-25-spezifisch ist.

## Referenzen

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Nächste Schritte

- Reproduktion unter Node 22/24, um die Regression in Node 25 zu bestätigen.
- `tsx` nightly testen oder auf eine frühere Version pinnen, falls eine bekannte Regression existiert.
- Wenn es sich auch unter Node LTS reproduzieren lässt, Upstream eine minimale Reproduktion mit dem `__name`-Stack-Trace melden.
