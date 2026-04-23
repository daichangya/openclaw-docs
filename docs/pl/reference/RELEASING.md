---
read_when:
    - Szukasz definicji publicznych kanałów wydań
    - Szukasz nazewnictwa wersji i harmonogramu wydań
summary: Publiczne kanały wydań, nazewnictwo wersji i harmonogram wydawniczy
title: Polityka wydań
x-i18n:
    generated_at: "2026-04-23T10:08:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# Polityka wydań

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: tagowane wydania publikowane domyślnie do npm `beta`, albo do npm `latest`, gdy zostanie to jawnie zażądane
- beta: tagi prerelease publikowane do npm `beta`
- dev: ruchoma głowa `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawki wydania stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dopełniaj miesiąca ani dnia zerami
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący docelowy kanał instalacji beta
- Wydania stable i poprawki stable są domyślnie publikowane do npm `beta`; operatorzy wydań mogą jawnie kierować je do `latest` albo później promować zweryfikowane wydanie beta
- Każde wydanie stable OpenClaw dostarcza jednocześnie pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/pakietu, a
  build/sign/notarize aplikacji mac jest zarezerwowane dla stable, chyba że jawnie zażądano inaczej

## Harmonogram wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zweryfikowaniu najnowszego beta
- Maintainerzy zwykle wycinają wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby walidacja i poprawki wydania nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został już wypchnięty lub opublikowany i wymaga poprawki, maintainerzy wycinają
  kolejny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i uwagi odzyskiwania są
  przeznaczone tylko dla maintainerów

## Preflight wydania

- Uruchom `pnpm check:test-types` przed preflightem wydania, aby pokrycie testowego TypeScript
  było zachowane poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed preflightem wydania, aby szersze kontrole
  cykli importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i bundle Control UI istniały dla kroku
  walidacji paczki
- Uruchamiaj `pnpm release:check` przed każdym tagowanym wydaniem
- Kontrole wydań są teraz uruchamiane w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia także bramkę zgodności QA Lab mock oraz aktywne
  ścieżki QA Matrix i Telegram przed zatwierdzeniem wydania. Aktywne ścieżki używają
  środowiska `qa-live-shared`; Telegram używa także dzierżaw poświadczeń Convex CI.
- Walidacja działania instalacji i aktualizacji między systemami operacyjnymi jest wysyłana z
  prywatnego workflow wywołującego
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  który wywołuje wielokrotnego użytku publiczny workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skupioną na artefaktach, podczas gdy wolniejsze aktywne kontrole pozostają w
  osobnej ścieżce, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydań muszą być uruchamiane z referencji workflow `main` albo z
  referencji workflow `release/YYYY.M.D`, aby logika workflow i sekrety pozostawały
  pod kontrolą
- To workflow akceptuje albo istniejący tag wydania, albo bieżący pełny
  40-znakowy SHA commita gałęzi workflow
- W trybie commit-SHA akceptowany jest tylko bieżący HEAD gałęzi workflow; dla
  starszych commitów wydania użyj tagu wydania
- Preflight tylko do walidacji `OpenClaw NPM Release` także akceptuje bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymogu wypchniętego tagu
- Ta ścieżka SHA służy tylko walidacji i nie może zostać promowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko dla kontroli
  metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, podczas gdy niezmieniająca stanu ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- To workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  używając zarówno sekretów workflow `OPENAI_API_KEY`, jak i `ANTHROPIC_API_KEY`
- Preflight wydania npm nie czeka już na osobną ścieżkę kontroli wydań
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo pasujący tag beta/poprawki) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo pasującą wersję beta/poprawki), aby zweryfikować opublikowaną ścieżkę
  instalacji z rejestru w świeżym tymczasowym prefiksie
- Automatyzacja wydań maintainerów używa teraz modelu preflight-then-promote:
  - rzeczywista publikacja npm musi przejść przez pomyślne npm `preflight_run_id`
  - rzeczywista publikacja npm musi być uruchamiana z tej samej gałęzi `main` lub
    `release/YYYY.M.D`, co pomyślny przebieg preflight
  - wydania stable npm domyślnie kierowane są do `beta`
  - publikacja stable npm może jawnie kierować do `latest` przez wejście workflow
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo utrzymuje publikację tylko przez OIDC
  - publiczne `macOS Release` służy tylko walidacji
  - rzeczywista prywatna publikacja mac musi przejść przez pomyślne prywatne mac
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować je ponownie
- Dla wydań poprawek stable takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`,
  aby poprawki wydań nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym stabilnym ładunku
- Preflight wydania npm kończy się bezpieczną odmową, jeśli tarball nie zawiera obu
  `dist/control-ui/index.html` oraz niepustego ładunku `dist/control-ui/assets/`,
  abyśmy nie wysłali znowu pustego dashboardu przeglądarkowego
- Weryfikacja po publikacji sprawdza także, czy opublikowana instalacja z rejestru
  zawiera niepuste zależności runtime dołączonych Pluginów w głównym układzie
  `dist/*`. Wydanie z brakującym lub pustym ładunkiem zależności
  dołączonych Pluginów nie przechodzi weryfikatora po publikacji i nie może zostać promowane
  do `latest`.
- `pnpm test:install:smoke` wymusza także budżet `unpackedSize` paczki npm na
  kandydacie tarballa aktualizacji, dzięki czemu e2e instalatora wychwytuje przypadkowe rozrosty paczki
  przed ścieżką publikacji wydania
- Jeśli praca nad wydaniem dotknęła planowania CI, manifestów czasowych rozszerzeń lub
  macierzy testów rozszerzeń, przed zatwierdzeniem zregeneruj i przejrzyj wyjścia macierzy workflow
  `checks-node-extensions` należącej do planera z `.github/workflows/ci.yml`,
  aby informacje o wydaniu nie opisywały nieaktualnego układu CI
- Gotowość stable macOS do wydania obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowe stabilne zip
  - spakowana aplikacja musi zachować niedebugowy bundle id, niepusty URL feedu Sparkle
    oraz `CFBundleVersion` co najmniej równy kanonicznemu dolnemu progowi buildu Sparkle
    dla tej wersji wydania

## Wejścia workflow NPM

`OpenClaw NPM Release` akceptuje następujące wejścia kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow dla preflightu tylko do walidacji
- `preflight_only`: `true` dla samej walidacji/build/pakowania, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane na rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z pomyślnego przebiegu preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Checks` akceptuje następujące wejścia kontrolowane przez operatora:

- `ref`: istniejący tag wydania albo bieżący pełny 40-znakowy commit `main`
  SHA do walidacji przy uruchamianiu z `main`; z gałęzi wydania użyj
  istniejącego tagu wydania albo bieżącego pełnego 40-znakowego SHA commita
  gałęzi wydania

Zasady:

- Tagi stable i poprawek mogą publikować do `beta` albo `latest`
- Tagi prerelease beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` wejście pełnego SHA commita jest dozwolone tylko, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` zawsze służy tylko walidacji i także akceptuje
  bieżący SHA commita gałęzi workflow
- Tryb commit-SHA w kontrolach wydań wymaga także bieżącego HEAD gałęzi workflow
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, które było użyte podczas preflightu;
  workflow weryfikuje te metadane przed kontynuacją publikacji

## Sekwencja wydania stable npm

Podczas wycinania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istniał, możesz użyć bieżącego pełnego SHA commita gałęzi workflow
     dla walidacyjnego dry run workflow preflight
2. Wybierz `npm_dist_tag=beta` dla zwykłego przepływu beta-first albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośredniej publikacji stable
3. Uruchom osobno `OpenClaw Release Checks` z tym samym tagiem albo
   pełnym bieżącym SHA commita gałęzi workflow, gdy chcesz pokrycia aktywnego prompt cache,
   zgodności QA Lab, Matrix i Telegram
   - To rozdzielenie jest celowe, aby aktywne pokrycie pozostawało dostępne bez
     ponownego wiązania długotrwałych lub niestabilnych kontroli z workflow publikacji
4. Zapisz pomyślne `preflight_run_id`
5. Uruchom ponownie `OpenClaw NPM Release` z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` i zapisanym `preflight_run_id`
6. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
7. Jeśli wydanie celowo zostało opublikowane bezpośrednio do `latest`, a `beta`
   powinno od razu podążyć za tym samym stabilnym buildem, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na stabilną wersję, albo pozwól, by jego harmonogramowa
   synchronizacja samonaprawcza przesunęła `beta` później

Mutacja dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo utrzymuje publikację tylko przez OIDC.

Dzięki temu zarówno ścieżka bezpośredniej publikacji, jak i ścieżka promocji beta-first są
udokumentowane i widoczne dla operatora.

## Publiczne referencje

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.
