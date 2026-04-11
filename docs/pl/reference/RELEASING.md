---
read_when:
    - Szukasz publicznych definicji kanałów wydań
    - |-
      Szukasz nazewnictwa wersji i harmonogramu wydań +#+#+#+#+#+assistant to=functions.read  კომენტary  北京赛车女 оВjson
      {"path":"/home/runner/work/docs/docs/source/AGENTS.md","offset":1,"limit":200}
summary: Publiczne kanały wydań, nazewnictwo wersji i harmonogram wydań
title: Polityka wydań
x-i18n:
    generated_at: "2026-04-11T02:47:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca613d094c93670c012f0b79720fad0d5d85be802f54b0acb7a8f22aca5bde12
    source_path: reference/RELEASING.md
    workflow: 15
---

# Polityka wydań

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: tagowane wydania publikowane domyślnie do npm `beta` albo do npm `latest`, jeśli zostanie to jawnie zażądane
- beta: tagi wydań wstępnych publikowane do npm `beta`
- dev: ruchoma głowa `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- Wersja poprawki stable: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- Wersja wydania wstępnego beta: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- Nie dopełniaj miesiąca ani dnia zerami
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący docelowy kanał instalacji beta
- Wydania stable i poprawki stable są domyślnie publikowane do npm `beta`; operatorzy wydań mogą jawnie kierować je do `latest` albo później promować zweryfikowaną kompilację beta
- Każde wydanie OpenClaw obejmuje jednocześnie pakiet npm i aplikację macOS

## Harmonogram wydań

- Wydania przechodzą najpierw przez beta
- Stable pojawia się dopiero po zweryfikowaniu najnowszej beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są przeznaczone wyłącznie dla maintainerów

## Kontrola przed wydaniem

- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane artefakty wydania `dist/*` i bundle Control UI istniały na potrzeby kroku walidacji paczki
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Preflight npm dla gałęzi main uruchamia również
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  przed spakowaniem tarballa, używając sekretów workflow `OPENAI_API_KEY` i
  `ANTHROPIC_API_KEY`
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiedni tag beta/poprawki) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiednią wersję beta/poprawki), aby zweryfikować opublikowaną ścieżkę instalacji z rejestru w świeżym tymczasowym prefiksie
- Automatyzacja wydania maintainerów używa teraz modelu preflight-then-promote:
  - rzeczywista publikacja npm musi przejść pomyślny npm `preflight_run_id`
  - wydania stable npm domyślnie trafiają do `beta`
  - publikację stable npm można jawnie skierować do `latest` przez wejście workflow
  - promowanie stable npm z `beta` do `latest` jest nadal dostępne jako jawny tryb ręczny w zaufanym workflow `OpenClaw NPM Release`
  - ten tryb promocji nadal wymaga prawidłowego `NPM_TOKEN` w środowisku `npm-release`, ponieważ zarządzanie npm `dist-tag` jest oddzielone od zaufanej publikacji
  - publiczny `macOS Release` służy wyłącznie do walidacji
  - rzeczywista prywatna publikacja mac musi przejść pomyślne prywatne `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować je ponownie
- Dla wydań poprawkowych stable takich jak `YYYY.M.D-N` weryfikator po publikacji sprawdza także tę samą ścieżkę aktualizacji z tymczasowego prefiksu z `YYYY.M.D` do `YYYY.M.D-N`, aby poprawki wydania nie mogły po cichu pozostawić starszych globalnych instalacji na bazowym ładunku stable
- Preflight wydania npm kończy się twardym błędem, jeśli tarball nie zawiera zarówno `dist/control-ui/index.html`, jak i niepustego ładunku `dist/control-ui/assets/`, abyśmy nie opublikowali ponownie pustego dashboardu przeglądarkowego
- Jeśli praca nad wydaniem dotyczyła planowania CI, manifestów czasowania rozszerzeń albo macierzy testów rozszerzeń, przed zatwierdzeniem zregeneruj i przejrzyj należące do planera wyjścia macierzy workflow `checks-node-extensions` z `.github/workflows/ci.yml`, aby notatki do wydania nie opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowy stabilny plik zip
  - spakowana aplikacja musi zachować niedebugowy bundle id, niepusty URL kanału Sparkle i `CFBundleVersion` równy lub wyższy od kanonicznego minimalnego progu kompilacji Sparkle dla tej wersji wydania

## Wejścia workflow NPM

`OpenClaw NPM Release` akceptuje następujące wejścia sterowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`
- `preflight_only`: `true` tylko dla walidacji/budowy/pakowania, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył przygotowanego tarballa z pomyślnego uruchomienia preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`
- `promote_beta_to_latest`: `true`, aby pominąć publikację i przenieść już opublikowaną stabilną kompilację `beta` na `latest`

Zasady:

- Tagi stable i poprawek mogą publikować zarówno do `beta`, jak i `latest`
- Tagi wydań wstępnych beta mogą publikować tylko do `beta`
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflight; workflow weryfikuje te metadane przed kontynuacją publikacji
- Tryb promocji musi używać tagu stable albo poprawki, `preflight_only=false`,
  pustego `preflight_run_id` i `npm_dist_tag=beta`
- Tryb promocji wymaga także prawidłowego `NPM_TOKEN` w środowisku `npm-release`,
  ponieważ `npm dist-tag add` nadal wymaga zwykłego uwierzytelniania npm

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
2. Wybierz `npm_dist_tag=beta` dla standardowego przepływu beta-first albo `latest` tylko wtedy, gdy celowo chcesz bezpośredniej publikacji stable
3. Zapisz pomyślny `preflight_run_id`
4. Uruchom `OpenClaw NPM Release` ponownie z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` i zapisanym `preflight_run_id`
5. Jeśli wydanie trafiło do `beta`, uruchom później `OpenClaw NPM Release` z tym samym stabilnym `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   pustym `preflight_run_id` i `npm_dist_tag=beta`, gdy chcesz przenieść tę opublikowaną kompilację do `latest`

Tryb promocji nadal wymaga zatwierdzenia środowiska `npm-release` i prawidłowego `NPM_TOKEN` w tym środowisku.

Dzięki temu zarówno ścieżka bezpośredniej publikacji, jak i ścieżka promocji beta-first pozostają udokumentowane i widoczne dla operatora.

## Publiczne odwołania

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.
