---
read_when:
    - Szukasz definicji publicznych kanałów wydań
    - Szukasz nazewnictwa wersji i harmonogramu wydań
summary: Publiczne kanały wydań, nazewnictwo wersji i harmonogram wydawania
title: Zasady wydań
x-i18n:
    generated_at: "2026-04-25T13:57:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: tagowane wydania, które domyślnie publikują do npm `beta`, albo do npm `latest`, jeśli zostanie to wyraźnie wskazane
- beta: tagi wydań wstępnych, które publikują do npm `beta`
- dev: bieżący head gałęzi `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja wydania poprawkowego stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja wydania wstępnego beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza aktualne promowane stabilne wydanie npm
- `beta` oznacza aktualny docelowy kanał instalacji beta
- Wydania stable i poprawkowe stable domyślnie publikują do npm `beta`; operatorzy wydań mogą jawnie wskazać `latest` albo później promować zweryfikowaną kompilację beta
- Każde stabilne wydanie OpenClaw dostarczane jest jednocześnie jako pakiet npm i aplikacja macOS;
  wydania beta zazwyczaj najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  budowanie/podpisywanie/notaryzacja aplikacji macOS są zarezerwowane dla stable, chyba że wyraźnie zażądano inaczej

## Harmonogram wydań

- Wydania przechodzą najpierw przez beta
- Stable pojawia się dopiero po zweryfikowaniu najnowszej beta
- Maintainerzy zwykle przygotowują wydania z gałęzi `release/YYYY.M.D` utworzonej
  na podstawie bieżącej `main`, aby walidacja i poprawki wydań nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został już wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  kolejny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki dotyczące odzyskiwania są
  przeznaczone wyłącznie dla maintainerów

## Kontrole przed wydaniem

- Uruchom `pnpm check:test-types` przed kontrolami przedwydaniowymi, aby testowy TypeScript nadal był
  objęty sprawdzeniami poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolami przedwydaniowymi, aby szersze sprawdzenia
  cykli importu i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` oraz pakiet Control UI istniały dla kroku
  walidacji pack
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też bramkę zgodności mocków QA Lab oraz aktywne
  ścieżki QA dla Matrix i Telegram przed zatwierdzeniem wydania. Aktywne ścieżki używają środowiska
  `qa-live-shared`; Telegram używa również dzierżaw poświadczeń Convex CI.
- Wielosystemowa walidacja instalacji i aktualizacji w czasie uruchomienia jest wysyłana z
  prywatnego workflow wywołującego
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  który wywołuje publiczny workflow wielokrotnego użytku
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: rzeczywista ścieżka wydania npm ma pozostać krótka,
  deterministyczna i skupiona na artefaktach, podczas gdy wolniejsze kontrole na żywo pozostają w
  osobnej ścieżce, aby nie opóźniać ani nie blokować publikacji
- Kontrole wydania muszą być uruchamiane z referencji workflow `main` albo z
  referencji workflow `release/YYYY.M.D`, aby logika workflow i sekrety pozostały
  pod kontrolą
- Ten workflow akceptuje albo istniejący tag wydania, albo bieżący pełny 40-znakowy
  SHA commita gałęzi workflow
- W trybie SHA commita akceptowany jest tylko bieżący HEAD gałęzi workflow; dla starszych commitów wydań użyj
  tagu wydania
- Walidacyjny tryb preflight w `OpenClaw NPM Release` również akceptuje bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy wyłącznie do walidacji i nie może zostać promowana do rzeczywistej publikacji
- W trybie SHA workflow tworzy syntetyczne `v<package.json version>` wyłącznie dla sprawdzenia metadanych
  pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow zachowują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub,
  podczas gdy niemodyfikująca ścieżka walidacji może używać większych
  runnerów Linux Blacksmith
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` oraz `ANTHROPIC_API_KEY`
- Preflight wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/poprawkowy) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/poprawkową), aby zweryfikować opublikowaną ścieżkę
  instalacji z rejestru w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegrama oraz rzeczywiste Telegram E2E
  względem opublikowanego pakietu npm z użyciem współdzielonej puli dzierżawionych poświadczeń Telegram.
  Lokalne jednorazowe działania maintainera mogą pominąć zmienne Convex i przekazać bezpośrednio trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*`.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny i
  nie uruchamia się przy każdym merge.
- Automatyzacja wydań maintainerów używa teraz modelu preflight-then-promote:
  - rzeczywista publikacja npm musi przejść pomyślny npm `preflight_run_id`
  - rzeczywista publikacja npm musi być uruchomiona z tej samej gałęzi `main` lub
    `release/YYYY.M.D`, co pomyślny przebieg preflight
  - stabilne wydania npm domyślnie kierowane są do `beta`
  - stabilna publikacja npm może jawnie wskazać `latest` przez input workflow
  - modyfikacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo zachowuje publikację wyłącznie przez OIDC
  - publiczny `macOS Release` służy wyłącznie do walidacji
  - rzeczywista prywatna publikacja mac musi przejść pomyślne prywatne przebiegi
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- W przypadku poprawek stable takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji z tymczasowym prefiksem z `YYYY.M.D` do `YYYY.M.D-N`,
  aby poprawki wydań nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym ładunku stable
- Preflight wydania npm kończy się niepowodzeniem w trybie fail-closed, jeśli tarball nie zawiera zarówno
  `dist/control-ui/index.html`, jak i niepustego ładunku `dist/control-ui/assets/`,
  abyśmy nie opublikowali ponownie pustego dashboardu przeglądarkowego
- Weryfikacja po publikacji sprawdza również, czy opublikowana instalacja z rejestru
  zawiera niepuste dołączone zależności runtime Pluginów pod głównym układem `dist/*`.
  Wydanie, które trafia z brakującym lub pustym ładunkiem zależności
  dołączonych Pluginów, kończy się niepowodzeniem w weryfikatorze po publikacji i nie może zostać promowane
  do `latest`.
- `pnpm test:install:smoke` egzekwuje również limit `unpackedSize` z npm pack dla
  kandydującego tarballa aktualizacji, więc e2e instalatora wychwytuje przypadkowe nadmierne zwiększenie pakietu
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotyczyły planowania CI, manifestów czasowych rozszerzeń lub
  macierzy testów rozszerzeń, przed zatwierdzeniem wygeneruj ponownie i przejrzyj należące do planera
  wyniki macierzy workflow `checks-node-extensions` z `.github/workflows/ci.yml`,
  aby notatki wydania nie opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowy stabilny zip
  - spakowana aplikacja musi zachować identyfikator pakietu niebędący debug, niepusty
    adres URL feedu Sparkle oraz `CFBundleVersion` równy lub wyższy od kanonicznego minimalnego progu kompilacji Sparkle
    dla tej wersji wydania

## Inputy workflow NPM

`OpenClaw NPM Release` akceptuje następujące inputy kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być również bieżący
  pełny 40-znakowy SHA commita gałęzi workflow dla walidacyjnego trybu preflight
- `preflight_only`: `true` tylko dla walidacji/budowania/pakowania, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagany na rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z pomyślnego przebiegu preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Checks` akceptuje następujące inputy kontrolowane przez operatora:

- `ref`: istniejący tag wydania lub bieżący pełny 40-znakowy commit `main`,
  który ma zostać zweryfikowany po uruchomieniu z `main`; z gałęzi wydania użyj
  istniejącego tagu wydania albo bieżącego pełnego 40-znakowego SHA commita gałęzi wydania

Zasady:

- Tagi stable i poprawek mogą publikować zarówno do `beta`, jak i do `latest`
- Tagi wydań wstępnych beta mogą publikować wyłącznie do `beta`
- Dla `OpenClaw NPM Release` pełny input SHA commita jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` zawsze służy wyłącznie do walidacji i akceptuje również
  bieżący SHA commita gałęzi workflow
- Tryb SHA commita dla kontroli wydania wymaga również bieżącego HEAD gałęzi workflow
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflight;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istniał, możesz użyć bieżącego pełnego SHA commita gałęzi workflow
     do walidacyjnego dry run workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu beta-first albo `latest` tylko wtedy,
   gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Uruchom osobno `OpenClaw Release Checks` z tym samym tagiem albo
   pełnym bieżącym SHA commita gałęzi workflow, gdy chcesz objąć pokryciem aktywny prompt cache,
   zgodność QA Lab, Matrix i Telegram
   - Jest to rozdzielone celowo, aby aktywne pokrycie pozostało dostępne bez
     ponownego sprzęgania długotrwałych lub niestabilnych kontroli z workflow publikacji
4. Zapisz pomyślny `preflight_run_id`
5. Uruchom ponownie `OpenClaw NPM Release` z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` i zapisanym `preflight_run_id`
6. Jeśli wydanie trafiło do `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
7. Jeśli wydanie zostało celowo opublikowane bezpośrednio do `latest` i `beta`
   ma od razu wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na stabilną wersję, albo pozwól, by jego zaplanowana
   samonaprawiająca synchronizacja przeniosła `beta` później

Modyfikacja dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikację wyłącznie przez OIDC.

Dzięki temu zarówno ścieżka bezpośredniej publikacji, jak i ścieżka promocji beta-first pozostają
udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszelkie polecenia
CLI 1Password (`op`) wyłącznie w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; utrzymanie tego w tmux sprawia, że prompty,
alerty i obsługa OTP są widoczne oraz zapobiega powtarzającym się alertom hosta.

## Referencje publiczne

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
