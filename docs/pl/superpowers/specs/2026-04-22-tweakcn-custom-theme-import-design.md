---
x-i18n:
    generated_at: "2026-04-25T13:58:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Projekt importu niestandardowego motywu Tweakcn

Status: zatwierdzono w terminalu 2026-04-22

## Podsumowanie

Dodaj dokładnie jeden lokalny dla przeglądarki slot niestandardowego motywu Control UI, który można zaimportować z linku udostępniania tweakcn. Istniejące wbudowane rodziny motywów pozostają `claw`, `knot` i `dash`. Nowa rodzina `custom` zachowuje się jak zwykła rodzina motywów OpenClaw i obsługuje tryby `light`, `dark` oraz `system`, gdy zaimportowany ładunek tweakcn zawiera zarówno zestawy tokenów jasnych, jak i ciemnych.

Zaimportowany motyw jest przechowywany wyłącznie w bieżącym profilu przeglądarki razem z pozostałymi ustawieniami Control UI. Nie jest zapisywany do konfiguracji Gateway i nie synchronizuje się między urządzeniami ani przeglądarkami.

## Problem

System motywów Control UI jest obecnie zamknięty na trzy zakodowane na stałe rodziny motywów:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Użytkownicy mogą przełączać się między wbudowanymi rodzinami i wariantami trybów, ale nie mogą wprowadzić motywu z tweakcn bez edytowania repozytoryjnego CSS. Oczekiwany wynik jest mniejszy niż ogólny system motywów: zachowaj trzy wbudowane motywy i dodaj jeden importowany slot sterowany przez użytkownika, który można zastąpić linkiem tweakcn.

## Cele

- Zachować bez zmian istniejące wbudowane rodziny motywów.
- Dodać dokładnie jeden importowany slot niestandardowy, a nie bibliotekę motywów.
- Akceptować link udostępniania tweakcn lub bezpośredni URL `https://tweakcn.com/r/themes/{id}`.
- Utrwalać zaimportowany motyw wyłącznie w local storage przeglądarki.
- Sprawić, by importowany slot działał z istniejącymi kontrolkami trybu `light`, `dark` i `system`.
- Zachować bezpieczne zachowanie przy błędach: nieudany import nigdy nie może zepsuć aktywnego motywu UI.

## Poza zakresem

- Brak biblioteki wielu motywów ani lokalnej dla przeglądarki listy importów.
- Brak utrwalania po stronie Gateway ani synchronizacji między urządzeniami.
- Brak dowolnego edytora CSS ani edytora surowego JSON motywu.
- Brak automatycznego ładowania zdalnych zasobów czcionek z tweakcn.
- Brak prób obsługi ładunków tweakcn, które udostępniają tylko jeden tryb.
- Brak refaktoryzacji motywów w całym repo poza punktami styku wymaganymi dla Control UI.

## Decyzje użytkownika już podjęte

- Zachować trzy wbudowane motywy.
- Dodać jeden slot importu oparty na tweakcn.
- Przechowywać importowany motyw w przeglądarce, a nie w konfiguracji Gateway.
- Obsługiwać `light`, `dark` i `system` dla importowanego slotu.
- Nadpisywanie slotu niestandardowego kolejnym importem jest zamierzonym zachowaniem.

## Zalecane podejście

Dodaj czwarty identyfikator rodziny motywu, `custom`, do modelu motywów Control UI. Rodzina `custom` staje się wybieralna tylko wtedy, gdy istnieje prawidłowy zaimportowany motyw tweakcn. Zaimportowany ładunek jest normalizowany do rekordu niestandardowego motywu specyficznego dla OpenClaw i przechowywany w local storage przeglądarki razem z pozostałymi ustawieniami UI.

W czasie działania OpenClaw renderuje zarządzany tag `<style>`, który definiuje rozwiązane bloki niestandardowych zmiennych CSS:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Dzięki temu niestandardowe zmienne motywu pozostają ograniczone do rodziny `custom` i nie wyciekają jako wbudowane zmienne CSS inline do rodzin wbudowanych.

## Architektura

### Model motywu

Zaktualizuj `ui/src/ui/theme.ts`:

- Rozszerz `ThemeName`, aby obejmował `custom`.
- Rozszerz `ResolvedTheme`, aby obejmował `custom` i `custom-light`.
- Rozszerz `VALID_THEME_NAMES`.
- Zaktualizuj `resolveTheme()`, aby `custom` odzwierciedlał istniejące zachowanie rodziny:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` lub `custom-light` zależnie od preferencji systemu operacyjnego

Dla `custom` nie dodaje się żadnych starszych aliasów.

### Model utrwalania

Rozszerz utrwalanie `UiSettings` w `ui/src/ui/storage.ts` o jeden opcjonalny ładunek custom-theme:

- `customTheme?: ImportedCustomTheme`

Zalecany zapisany kształt:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Uwagi:

- `sourceUrl` przechowuje oryginalne wejście użytkownika po normalizacji.
- `themeId` to identyfikator motywu tweakcn wyodrębniony z URL.
- `label` to pole `name` z tweakcn, jeśli istnieje, w przeciwnym razie `Custom`.
- `light` i `dark` to już znormalizowane mapy tokenów OpenClaw, a nie surowe ładunki tweakcn.
- Zaimportowany ładunek znajduje się obok innych lokalnych dla przeglądarki ustawień i jest serializowany w tym samym dokumencie local-storage.
- Jeśli zapisane dane custom-theme są brakujące lub nieprawidłowe podczas ładowania, zignoruj ładunek i wróć do `theme: "claw"`, jeśli utrwaloną rodziną było `custom`.

### Zastosowanie w czasie działania

Dodaj wąski menedżer arkusza stylów custom-theme w środowisku wykonawczym Control UI, utrzymywany blisko `ui/src/ui/app-settings.ts` i `ui/src/ui/theme.ts`.

Odpowiedzialności:

- Tworzyć lub aktualizować jeden stabilny tag `<style id="openclaw-custom-theme">` w `document.head`.
- Emitować CSS tylko wtedy, gdy istnieje prawidłowy ładunek niestandardowego motywu.
- Usuwać zawartość tagu stylu po wyczyszczeniu ładunku.
- Zachować CSS rodzin wbudowanych w `ui/src/styles/base.css`; nie wstawiać importowanych tokenów do arkusza stylów trzymanego w repo.

Ten menedżer działa zawsze, gdy ustawienia są ładowane, zapisywane, importowane lub czyszczone.

### Selektory trybu jasnego

Implementacja powinna preferować `data-theme-mode="light"` do stylowania jasnego w różnych rodzinach zamiast specjalnego traktowania `custom-light`. Jeśli istniejący selektor jest przypięty do `data-theme="light"` i musi obowiązywać dla każdej jasnej rodziny, rozszerz go w ramach tej pracy.

## UX importu

Zaktualizuj `ui/src/ui/views/config.ts` w sekcji `Appearance`:

- Dodaj kartę motywu `Custom` obok `Claw`, `Knot` i `Dash`.
- Pokazuj kartę jako wyłączoną, gdy nie istnieje zaimportowany niestandardowy motyw.
- Dodaj panel importu pod siatką motywów zawierający:
  - jedno pole tekstowe na link udostępniania tweakcn lub URL `/r/themes/{id}`
  - jeden przycisk `Import`
  - jedną ścieżkę `Replace`, gdy istnieje już niestandardowy ładunek
  - jedną akcję `Clear`, gdy istnieje już niestandardowy ładunek
- Pokazuj etykietę zaimportowanego motywu i host źródła, gdy ładunek istnieje.
- Jeśli aktywnym motywem jest `custom`, import zastępczy stosuje się natychmiast.
- Jeśli aktywnym motywem nie jest `custom`, import jedynie zapisuje nowy ładunek, dopóki użytkownik nie wybierze karty `Custom`.

Szybki selektor motywu w `ui/src/ui/views/config-quick.ts` również powinien pokazywać `Custom` tylko wtedy, gdy istnieje ładunek.

## Parsowanie URL i zdalne pobieranie

Ścieżka importu w przeglądarce akceptuje:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

Implementacja powinna normalizować obie formy do:

- `https://tweakcn.com/r/themes/{id}`

Przeglądarka pobiera następnie bezpośrednio znormalizowany endpoint `/r/themes/{id}`.

Użyj wąskiego walidatora schematu dla zewnętrznego ładunku. Preferowany jest schemat zod, ponieważ jest to niezaufana granica zewnętrzna.

Wymagane pola zdalne:

- najwyższego poziomu `name` jako opcjonalny string
- `cssVars.theme` jako opcjonalny obiekt
- `cssVars.light` jako obiekt
- `cssVars.dark` jako obiekt

Jeśli brakuje `cssVars.light` lub `cssVars.dark`, odrzuć import. To zamierzone: zatwierdzone zachowanie produktu to pełna obsługa trybów, a nie najlepsza możliwa synteza brakującej strony.

## Mapowanie tokenów

Nie odwzorowuj zmiennych tweakcn ślepo. Znormalizuj ograniczony podzbiór do tokenów OpenClaw i wyprowadź resztę w pomocniku.

### Tokeny importowane bezpośrednio

Z każdego bloku trybu tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Ze współdzielonego `cssVars.theme`, jeśli istnieje:

- `font-sans`
- `font-mono`

Jeśli blok trybu nadpisuje `font-sans`, `font-mono` lub `radius`, wartość lokalna dla trybu ma pierwszeństwo.

### Tokeny wyprowadzane dla OpenClaw

Importer wyprowadza zmienne tylko dla OpenClaw z zaimportowanych kolorów bazowych:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Zasady wyprowadzania znajdują się w czystym helperze, aby można je było testować niezależnie. Dokładne formuły mieszania kolorów są szczegółem implementacyjnym, ale helper musi spełniać dwa ograniczenia:

- zachować czytelny kontrast bliski intencji zaimportowanego motywu
- produkować stabilne dane wyjściowe dla tego samego zaimportowanego ładunku

### Tokeny ignorowane w v1

Te tokeny tweakcn są celowo ignorowane w pierwszej wersji:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

To utrzymuje zakres na tokenach, których bieżący Control UI rzeczywiście potrzebuje.

### Czcionki

Jeśli istnieją, importowane są ciągi stosów czcionek, ale OpenClaw nie ładuje zdalnych zasobów czcionek w v1. Jeśli importowany stos odwołuje się do czcionek niedostępnych w przeglądarce, obowiązuje normalne zachowanie fallback.

## Zachowanie przy błędach

Nieudane importy muszą kończyć się bezpiecznie.

- Nieprawidłowy format URL: pokaż błąd walidacji inline, nie pobieraj.
- Nieobsługiwany host lub kształt ścieżki: pokaż błąd walidacji inline, nie pobieraj.
- Błąd sieci, odpowiedź nie-OK lub nieprawidłowy JSON: pokaż błąd inline, pozostaw obecnie zapisany ładunek bez zmian.
- Błąd schematu lub brak bloków light/dark: pokaż błąd inline, pozostaw obecnie zapisany ładunek bez zmian.
- Akcja czyszczenia:
  - usuwa zapisany niestandardowy ładunek
  - usuwa zawartość zarządzanego tagu stylu niestandardowego
  - jeśli aktywny jest `custom`, przełącza rodzinę motywu z powrotem na `claw`
- Nieprawidłowy zapisany ładunek niestandardowy przy pierwszym ładowaniu:
  - zignoruj zapisany ładunek
  - nie emituj niestandardowego CSS
  - jeśli utrwaloną rodziną motywu było `custom`, wróć do `claw`

W żadnym momencie nieudany import nie powinien pozostawić aktywnego dokumentu z częściowo zastosowanymi niestandardowymi zmiennymi CSS.

## Pliki, które prawdopodobnie zmienią się w implementacji

Główne pliki:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Prawdopodobne nowe helpery:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

Testy:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- nowe ukierunkowane testy dla parsowania URL i normalizacji ładunku

## Testowanie

Minimalny zakres implementacji:

- sparsowanie URL linku udostępniania do identyfikatora motywu tweakcn
- znormalizowanie `/themes/{id}` i `/r/themes/{id}` do URL pobierania
- odrzucenie nieobsługiwanych hostów i nieprawidłowych identyfikatorów
- walidacja kształtu ładunku tweakcn
- zmapowanie prawidłowego ładunku tweakcn do znormalizowanych map tokenów OpenClaw dla trybu jasnego i ciemnego
- ładowanie i zapisywanie niestandardowego ładunku w ustawieniach lokalnych przeglądarki
- rozwiązywanie `custom` dla `light`, `dark` i `system`
- wyłączenie wyboru `Custom`, gdy nie ma ładunku
- natychmiastowe zastosowanie zaimportowanego motywu, gdy `custom` jest już aktywny
- powrót do `claw`, gdy aktywny niestandardowy motyw zostanie wyczyszczony

Cel weryfikacji ręcznej:

- zaimportowanie znanego motywu tweakcn z Settings
- przełączanie między `light`, `dark` i `system`
- przełączanie między `custom` a rodzinami wbudowanymi
- ponowne załadowanie strony i potwierdzenie, że zaimportowany niestandardowy motyw utrzymuje się lokalnie

## Uwagi dotyczące wdrożenia

Ta funkcja jest celowo mała. Jeśli użytkownicy później poproszą o wiele importowanych motywów, zmianę nazwy, eksport lub synchronizację między urządzeniami, potraktuj to jako kolejny projekt. Nie buduj zawczasu abstrakcji biblioteki motywów w tej implementacji.
