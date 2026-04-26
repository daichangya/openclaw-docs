---
read_when:
    - Szukasz definicji publicznych kanałów wydań
    - Szukasz nazewnictwa wersji i częstotliwości wydań
summary: Publiczne kanały wydań, nazewnictwo wersji i częstotliwość wydań
title: Polityka wydań
x-i18n:
    generated_at: "2026-04-26T11:40:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: tagowane wydania publikowane domyślnie do npm `beta`, albo do npm `latest`, gdy zostanie to jawnie wskazane
- beta: tagi wydań wstępnych publikowane do npm `beta`
- dev: ruchoma głowa `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja wydania poprawkowego stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja wydania wstępnego beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza bieżące promowane wydanie stable w npm
- `beta` oznacza bieżący docelowy kanał instalacji beta
- Wydania stable i poprawkowe stable są domyślnie publikowane do npm `beta`; operatorzy wydań mogą jawnie wskazać `latest` albo później wypromować zweryfikowane wydanie beta
- Każde wydanie stable OpenClaw dostarcza jednocześnie pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  budowanie/podpisywanie/notaryzacja aplikacji mac są zarezerwowane dla stable, chyba że jawnie zażądano inaczej

## Częstotliwość wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zweryfikowaniu najnowszego beta
- Maintainerzy zwykle wycinają wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby walidacja i poprawki wydania nie blokowały nowego
  developmentu na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy wycinają
  kolejny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, akceptacje, poświadczenia i notatki dotyczące odzyskiwania
  są przeznaczone wyłącznie dla maintainerów

## Kontrole przed wydaniem

- Uruchom `pnpm check:test-types` przed kontrolami przed wydaniem, aby testowy TypeScript nadal był
  objęty sprawdzeniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolami przed wydaniem, aby szersze kontrole
  cykli importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i bundel Control UI istniały dla kroku
  walidacji paczki
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Ćwiczy ono
  qa-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje eksportowane nazwy spanów śledzenia,
  ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Kontrole wydań są teraz uruchamiane w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia również bramkę zgodności makiety QA Lab oraz aktywne
  ścieżki QA Matrix i Telegram przed akceptacją wydania. Aktywne ścieżki używają
  środowiska `qa-live-shared`; Telegram używa również dzierżaw poświadczeń Convex CI.
- Walidacja działania instalacji i aktualizacji w różnych systemach operacyjnych jest wysyłana z
  prywatnego workflow wywołującego
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  który wywołuje publiczny workflow wielokrotnego użytku
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest zamierzony: zachowaj rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skupioną na artefaktach, podczas gdy wolniejsze aktywne kontrole pozostają we
  własnej ścieżce, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydań muszą być uruchamiane z referencji workflow `main` albo z
  referencji workflow `release/YYYY.M.D`, aby logika workflow i sekrety pozostawały
  pod kontrolą
- Ten workflow akceptuje istniejący tag wydania albo bieżący pełny
  40-znakowy commit SHA gałęzi workflow
- W trybie commit-SHA akceptuje tylko bieżący HEAD gałęzi workflow; użyj
  tagu wydania dla starszych commitów wydania
- Kontrola przed wydaniem tylko do walidacji `OpenClaw NPM Release` również akceptuje bieżący
  pełny 40-znakowy commit SHA gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy wyłącznie do walidacji i nie może zostać wypromowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` wyłącznie dla kontroli metadanych
  pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow zachowują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, podczas gdy niemodyfikująca ścieżka walidacji może używać większych
  runnerów Linux Blacksmith
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Kontrola przed wydaniem npm nie czeka już na osobną ścieżkę kontroli wydań
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/poprawkowy) przed akceptacją
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/poprawkową), aby zweryfikować opublikowaną ścieżkę
  instalacji z rejestru w nowym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i rzeczywiste Telegram E2E
  względem opublikowanego pakietu npm przy użyciu współdzielonej dzierżawionej puli
  poświadczeń Telegram. Lokalne jednorazowe działania maintainerów mogą pominąć zmienne Convex i przekazać bezpośrednio trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*`.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest on celowo tylko ręczny i
  nie uruchamia się przy każdym merge.
- Automatyzacja wydań maintainerów używa teraz schematu kontrola-przed-wydaniem-następnie-promocja:
  - rzeczywista publikacja npm musi przejść pomyślny npm `preflight_run_id`
  - rzeczywista publikacja npm musi zostać uruchomiona z tej samej gałęzi `main` lub
    `release/YYYY.M.D`, co pomyślne uruchomienie kontroli przed wydaniem
  - wydania stable npm domyślnie trafiają do `beta`
  - publikacja stable npm może jawnie wskazać `latest` przez wejście workflow
  - mutacja dist-tag npm oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo utrzymuje publikację wyłącznie przez OIDC
  - publiczne `macOS Release` służy wyłącznie do walidacji
  - rzeczywista prywatna publikacja mac musi przejść pomyślne prywatne uruchomienia mac
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla wydań poprawkowych stable takich jak `YYYY.M.D-N` weryfikator po publikacji
  sprawdza również tę samą ścieżkę aktualizacji tymczasowego prefiksu z `YYYY.M.D` do `YYYY.M.D-N`,
  aby poprawki wydań nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym ładunku stable
- Kontrola przed wydaniem npm kończy się bezpieczną odmową, chyba że tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`,
  abyśmy nie dostarczyli ponownie pustego dashboardu przeglądarkowego
- Weryfikacja po publikacji sprawdza również, że opublikowana instalacja z rejestru
  zawiera niepuste zależności środowiska uruchomieniowego dołączonych Pluginów pod głównym układem `dist/*`.
  Wydanie dostarczone z brakującymi lub pustymi ładunkami zależności
  dołączonych Pluginów nie przechodzi weryfikatora po publikacji i nie może zostać wypromowane
  do `latest`.
- `pnpm test:install:smoke` egzekwuje także budżet `unpackedSize` paczki npm dla
  kandydującego tarballa aktualizacji, dzięki czemu e2e instalatora wyłapuje przypadkowe zwiększenie rozmiaru paczki
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasu rozszerzeń lub
  macierzy testów rozszerzeń, zregeneruj i przejrzyj należące do planisty
  wyjścia macierzy workflow `checks-node-extensions` z `.github/workflows/ci.yml`
  przed akceptacją, aby notatki o wydaniu nie opisywały nieaktualnego układu CI
- Gotowość wydania stable dla macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowy stable zip
  - spakowana aplikacja musi zachować identyfikator bundla inny niż debug, niepusty
    adres URL feedu Sparkle oraz `CFBundleVersion` na poziomie co najmniej kanonicznego progu kompilacji Sparkle
    dla tej wersji wydania

## Wejścia workflow NPM

`OpenClaw NPM Release` akceptuje następujące wejścia kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być również bieżący
  pełny 40-znakowy commit SHA gałęzi workflow dla kontroli przed wydaniem wyłącznie do walidacji
- `preflight_only`: `true` dla samej walidacji/budowania/pakowania, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z pomyślnego uruchomienia kontroli przed wydaniem
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Checks` akceptuje następujące wejścia kontrolowane przez operatora:

- `ref`: istniejący tag wydania albo bieżący pełny 40-znakowy commit
  SHA `main` do walidacji przy uruchamianiu z `main`; z gałęzi wydania użyj
  istniejącego tagu wydania albo bieżącego pełnego 40-znakowego commit SHA gałęzi wydania

Zasady:

- Tagi stable i poprawkowe mogą publikować do `beta` albo `latest`
- Tagi wydań wstępnych beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` pełne wejście commit SHA jest dozwolone tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` zawsze służy wyłącznie do walidacji i również akceptuje
  bieżący commit SHA gałęzi workflow
- Tryb commit-SHA w kontrolach wydań wymaga również bieżącego HEAD gałęzi workflow
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas kontroli przed wydaniem;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja wydania stable npm

Podczas wycinania wydania stable npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istniał, możesz użyć bieżącego pełnego commit
     SHA gałęzi workflow dla walidacyjnego próbnego uruchomienia workflow kontroli przed wydaniem
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu beta-first albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośredniej publikacji stable
3. Uruchom osobno `OpenClaw Release Checks` z tym samym tagiem albo
   pełnym bieżącym commit SHA gałęzi workflow, gdy chcesz uzyskać aktywne pokrycie dla prompt cache,
   zgodności QA Lab, Matrix i Telegram
   - Jest to celowo oddzielone, aby aktywne pokrycie pozostawało dostępne bez
     ponownego łączenia długotrwałych lub niestabilnych kontroli z workflow publikacji
4. Zapisz pomyślny `preflight_run_id`
5. Uruchom ponownie `OpenClaw NPM Release` z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` i zapisanym `preflight_run_id`
6. Jeśli wydanie trafiło do `beta`, użyj prywatnego
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę wersję stable z `beta` do `latest`
7. Jeśli wydanie zostało celowo opublikowane bezpośrednio do `latest`, a `beta`
   powinno od razu wskazywać tę samą kompilację stable, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na wersję stable, albo pozwól jego zaplanowanej
   samonaprawczej synchronizacji przesunąć `beta` później

Mutacja dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo utrzymuje publikację wyłącznie przez OIDC.

Dzięki temu zarówno ścieżka publikacji bezpośredniej, jak i ścieżka promocji beta-first są
udokumentowane i widoczne dla operatora.

Jeśli maintainer musi wrócić do lokalnego uwierzytelniania npm, uruchamiaj wszelkie polecenia 1Password
CLI (`op`) wyłącznie w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; trzymanie go wewnątrz tmux sprawia, że prompty,
alerty i obsługa OTP są obserwowalne oraz zapobiega powtarzającym się alertom hosta.

## Publiczne odwołania

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
