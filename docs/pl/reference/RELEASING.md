---
read_when:
    - Szukasz publicznych definicji kanałów wydań
    - Szukasz nazewnictwa wersji i harmonogramu wydań
summary: Publiczne kanały wydań, nazewnictwo wersji i harmonogram publikacji
title: Polityka wydań
x-i18n:
    generated_at: "2026-04-15T09:51:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88724307269ab783a9fbf8a0540fea198d8a3add68457f4e64d5707114fa518c
    source_path: reference/RELEASING.md
    workflow: 15
---

# Polityka wydań

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: oznaczone tagami wydania, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to wyraźnie wskazane
- beta: tagi wydań wstępnych publikowane do npm `beta`
- dev: ruchoma głowa `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawkowego wydania stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja beta prerelease: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dopełniaj miesiąca ani dnia zerami z przodu
- `latest` oznacza aktualnie promowane stabilne wydanie npm
- `beta` oznacza bieżący docelowy kanał instalacji beta
- Wydania stable i poprawkowe wydania stable domyślnie publikują do npm `beta`; operatorzy wydań mogą jawnie wskazać `latest` albo później wypromować zweryfikowaną wersję beta
- Każde wydanie OpenClaw obejmuje jednocześnie pakiet npm i aplikację macOS

## Harmonogram wydań

- Wydania najpierw trafiają do beta
- Stable pojawia się dopiero po zweryfikowaniu najnowszej wersji beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki dotyczące odzyskiwania są
  dostępne wyłącznie dla maintainerów

## Wstępna walidacja wydania

- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i bundle Control UI istniały na potrzeby kroku
  walidacji paczki
- Uruchom `pnpm release:check` przed każdym wydaniem oznaczonym tagiem
- Kontrole wydań są teraz uruchamiane w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- Międzyplatformowa walidacja instalacji i aktualizacji w czasie działania jest wywoływana z
  prywatnego workflow wywołującego
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  który uruchamia wielokrotnego użytku publiczny workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: prawdziwa ścieżka wydania npm ma pozostać krótka,
  deterministyczna i skupiona na artefaktach, podczas gdy wolniejsze kontrole na żywo pozostają w
  osobnym torze, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydań muszą być uruchamiane z referencji workflow `main`, aby logika
  workflow i sekrety pozostawały kanoniczne
- Ten workflow akceptuje albo istniejący tag wydania, albo bieżący pełny
  40-znakowy SHA commita `main`
- W trybie commit-SHA akceptowany jest tylko bieżący HEAD `origin/main`; dla
  starszych commitów wydania użyj tagu wydania
- Wstępna walidacja `OpenClaw NPM Release` w trybie tylko walidacji także akceptuje bieżący
  pełny 40-znakowy SHA commita `main` bez wymogu wypchniętego tagu
- Ta ścieżka SHA służy wyłącznie do walidacji i nie może zostać wypromowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` wyłącznie na potrzeby
  sprawdzenia metadanych pakietu; prawdziwa publikacja nadal wymaga rzeczywistego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, podczas gdy niezmieniająca stanu
  ścieżka walidacji może korzystać z większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Wstępna walidacja wydania npm nie czeka już na oddzielny tor kontroli wydań
- Przed zatwierdzeniem uruchom
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (lub odpowiadający tag beta/poprawkowy)
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (lub odpowiadającą wersję beta/poprawkową), aby zweryfikować opublikowaną ścieżkę
  instalacji z rejestru w świeżym tymczasowym prefiksie
- Automatyzacja wydań maintainerów używa teraz podejścia preflight-then-promote:
  - rzeczywista publikacja npm musi przejść pomyślny npm `preflight_run_id`
  - stabilne wydania npm domyślnie trafiają do `beta`
  - stabilna publikacja npm może jawnie kierować do `latest` przez input workflow
  - zmiana npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo zachowuje publikację wyłącznie przez OIDC
  - publiczne `macOS Release` służy wyłącznie do walidacji
  - rzeczywista prywatna publikacja mac musi przejść pomyślne prywatne uruchomienia mac
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla poprawkowych wydań stable takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`,
  aby poprawki wydań nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym stabilnym payloadzie
- Wstępna walidacja wydania npm kończy się błędem domyślnie, jeśli tarball nie zawiera zarówno
  `dist/control-ui/index.html`, jak i niepustego payloadu `dist/control-ui/assets/`,
  abyśmy nie wysłali ponownie pustego panelu przeglądarkowego
- `pnpm test:install:smoke` wymusza także budżet `unpackedSize` dla paczki npm na
  kandydackim tarballu aktualizacji, dzięki czemu e2e instalatora wychwytuje przypadkowy wzrost
  rozmiaru paczki przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotyczyły planowania CI, manifestów czasowych rozszerzeń albo
  macierzy testów rozszerzeń, przed zatwierdzeniem zregeneruj i sprawdź
  należące do planera wyniki macierzy workflow `checks-node-extensions` z `.github/workflows/ci.yml`,
  aby notatki do wydania nie opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane pliki `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowy stabilny plik zip
  - spakowana aplikacja musi zachować niedebugowy bundle id, niepusty URL kanału Sparkle
    oraz `CFBundleVersion` nie niższy niż kanoniczny minimalny poziom builda Sparkle
    dla tej wersji wydania

## Wejścia workflow NPM

`OpenClaw NPM Release` akceptuje następujące wejścia sterowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być również bieżący
  pełny 40-znakowy SHA commita `main` dla walidacyjnego preflightu
- `preflight_only`: `true` tylko dla walidacji/budowy/pakowania, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z pomyślnego uruchomienia preflightu
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Checks` akceptuje następujące wejścia sterowane przez operatora:

- `ref`: istniejący tag wydania albo bieżący pełny 40-znakowy SHA commita `main`
  do zwalidowania

Zasady:

- Tagi stable i poprawkowe mogą publikować albo do `beta`, albo do `latest`
- Tagi beta prerelease mogą publikować wyłącznie do `beta`
- Pełny SHA commita jest dozwolony tylko wtedy, gdy `preflight_only=true`
- Tryb commit-SHA w kontrolach wydań również wymaga bieżącego HEAD `origin/main`
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflightu;
  workflow weryfikuje te metadane, zanim publikacja będzie kontynuowana

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim pojawi się tag, możesz użyć bieżącego pełnego SHA commita `main` do
     walidacyjnego dry run workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu beta-first albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośrednio opublikować stabilne wydanie
3. Uruchom oddzielnie `OpenClaw Release Checks` z tym samym tagiem albo
   pełnym bieżącym SHA `main`, jeśli chcesz objąć testami prompt cache na żywo
   - To rozdzielenie jest celowe, aby pokrycie na żywo pozostawało dostępne bez
     ponownego łączenia długotrwałych lub niestabilnych kontroli z workflow publikacji
4. Zachowaj pomyślne `preflight_run_id`
5. Uruchom ponownie `OpenClaw NPM Release` z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` i zapisanym `preflight_run_id`
6. Jeśli wydanie trafiło do `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę stabilną wersję z `beta` do `latest`
7. Jeśli wydanie zostało celowo opublikowane bezpośrednio do `latest` i `beta`
   powinno od razu wskazywać ten sam stabilny build, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na stabilną wersję, albo pozwól, aby jego zaplanowana
   samonaprawcza synchronizacja przesunęła `beta` później

Zmiana dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikację wyłącznie przez OIDC.

To sprawia, że zarówno ścieżka publikacji bezpośredniej, jak i ścieżka promocji beta-first są
udokumentowane i widoczne dla operatora.

## Publiczne odniesienia

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainerzy korzystają z prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.
