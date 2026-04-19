---
read_when:
    - Debugowanie skryptów deweloperskich uruchamianych tylko w Node lub awarii trybu obserwacji
    - Badanie awarii loadera tsx/esbuild w OpenClaw
summary: Node + tsx – uwagi o awarii „__name is not a function” i obejścia problemu
title: Awaria Node + tsx
x-i18n:
    generated_at: "2026-04-19T01:11:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Awaria Node + tsx „\_\_name is not a function”

## Podsumowanie

Uruchamianie OpenClaw przez Node z `tsx` kończy się niepowodzeniem przy starcie z błędem:

````
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
````

Zaczęło się to po przełączeniu skryptów deweloperskich z Bun na `tsx` (commit `2871657e`, 2026-01-06). Ta sama ścieżka wykonania działała z Bun.

## Środowisko

- Node: v25.x (zaobserwowano na v25.3.0)
- tsx: 4.21.0
- OS: macOS (odtworzenie prawdopodobnie także na innych platformach uruchamiających Node 25)

## Odtworzenie (tylko Node)

```bash
# w katalogu głównym repozytorium
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Minimalne odtworzenie w repozytorium

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Sprawdzenie wersji Node

- Node 25.3.0: kończy się błędem
- Node 22.22.0 (Homebrew `node@22`): kończy się błędem
- Node 24: jeszcze nie jest tu zainstalowany; wymaga weryfikacji

## Uwagi / hipoteza

- `tsx` używa esbuild do transformacji TS/ESM. Opcja `keepNames` w esbuild emituje helper `__name` i opakowuje definicje funkcji za pomocą `__name(...)`.
- Awaria wskazuje, że `__name` istnieje, ale w czasie działania nie jest funkcją, co sugeruje, że helper dla tego modułu jest nieobecny albo nadpisany w ścieżce loadera Node 25.
- Podobne problemy z helperem `__name` zgłaszano w innych narzędziach korzystających z esbuild, gdy helper jest nieobecny albo przepisany.

## Historia regresji

- `2871657e` (2026-01-06): skrypty zmieniono z Bun na tsx, aby Bun był opcjonalny.
- Wcześniej (ścieżka Bun) `openclaw status` i `gateway:watch` działały.

## Obejścia

- Używaj Bun do skryptów deweloperskich (obecny tymczasowy powrót).
- Użyj `tsgo` do sprawdzania typów w repozytorium, a następnie uruchom zbudowane wyjście:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Uwaga historyczna: podczas debugowania tego problemu Node/tsx używano tu `tsc`, ale obecnie ścieżki sprawdzania typów w repozytorium korzystają z `tsgo`.
- Wyłącz `keepNames` esbuild w loaderze TS, jeśli to możliwe (zapobiega wstawianiu helpera `__name`); `tsx` obecnie tego nie udostępnia.
- Przetestuj Node LTS (22/24) z `tsx`, aby sprawdzić, czy problem dotyczy tylko Node 25.

## Odniesienia

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Następne kroki

- Odtwórz problem na Node 22/24, aby potwierdzić regresję w Node 25.
- Przetestuj `tsx` nightly albo przypnij wcześniejszą wersję, jeśli istnieje znana regresja.
- Jeśli problem odtwarza się na Node LTS, zgłoś minimalny przypadek odtworzeniowy upstream z trace stosu `__name`.
