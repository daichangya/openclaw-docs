---
read_when:
    - Planowanie szeroko zakrojonego etapu modernizacji aplikacji OpenClaw
    - Aktualizowanie standardów implementacji frontendu dla aplikacji lub prac nad Control UI
    - Przekształcanie szerokiego przeglądu jakości produktu w etapowe prace inżynieryjne
summary: Kompleksowy plan modernizacji aplikacji z aktualizacjami umiejętności dostarczania frontendu
title: Plan modernizacji aplikacji
x-i18n:
    generated_at: "2026-04-25T13:57:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667a133cb867bb1d4d09e097925704c8b77d20ca6117a62a4c60d29ab1097283
    source_path: reference/application-modernization-plan.md
    workflow: 15
---

# Plan modernizacji aplikacji

## Cel

Przesunąć aplikację w kierunku czystszego, szybszego i łatwiejszego w utrzymaniu produktu bez
psucia obecnych workflow ani ukrywania ryzyka w szerokich refaktoryzacjach. Prace powinny
być dostarczane w małych, możliwych do przeglądu etapach z dowodami dla każdej zmienionej powierzchni.

## Zasady

- Zachowuj obecną architekturę, chyba że granica w sposób wykazalny powoduje churn,
  koszt wydajnościowy lub błędy widoczne dla użytkownika.
- Preferuj najmniejszą poprawną poprawkę dla każdego problemu, a potem powtarzaj ten proces.
- Oddzielaj wymagane poprawki od opcjonalnych ulepszeń, aby maintainerzy mogli dostarczać prace o dużej
  wartości bez czekania na subiektywne decyzje.
- Zachowuj udokumentowane i wstecznie zgodne zachowanie wobec pluginów.
- Zanim stwierdzisz, że regresja została naprawiona, zweryfikuj zachowanie w wydanej wersji, kontrakty zależności i testy.
- Najpierw popraw główną ścieżkę użytkownika: onboarding, auth, czat, konfigurację dostawców,
  zarządzanie pluginami i diagnostykę.

## Faza 1: Audyt bazowy

Zrób inwentaryzację obecnej aplikacji przed wprowadzaniem zmian.

- Zidentyfikuj najważniejsze workflow użytkownika i powierzchnie kodu, które za nie odpowiadają.
- Wypisz martwe affordance, zduplikowane ustawienia, niejasne stany błędów i kosztowne
  ścieżki renderowania.
- Zbierz bieżące polecenia walidacyjne dla każdej powierzchni.
- Oznacz problemy jako wymagane, zalecane lub opcjonalne.
- Udokumentuj znane blokery wymagające przeglądu właściciela, szczególnie zmiany API, bezpieczeństwa,
  wydania i kontraktów pluginów.

Definicja ukończenia:

- Jedna lista problemów z odwołaniami do plików względem katalogu głównego repozytorium.
- Każdy problem ma poziom ważności, powierzchnię właściciela, oczekiwany wpływ na użytkownika i proponowaną
  ścieżkę walidacji.
- Ze zmianami wymaganymi nie są mieszane spekulacyjne pozycje dotyczące porządkowania kodu.

## Faza 2: Porządkowanie produktu i UX

Nadaj priorytet widocznym workflow i usuń źródła niejasności.

- Doprecyzuj treść onboardingu i puste stany wokół auth modelu, statusu Gateway
  i konfiguracji pluginów.
- Usuń lub wyłącz martwe affordance tam, gdzie nie da się wykonać żadnej akcji.
- Zachowuj widoczność ważnych działań przy różnych szerokościach responsywnych zamiast ukrywać je
  za kruchymi założeniami layoutu.
- Skonsoliduj powtarzający się język statusów, aby błędy miały jedno źródło prawdy.
- Dodaj progresywne ujawnianie dla ustawień zaawansowanych, jednocześnie utrzymując szybki podstawowy setup.

Zalecana walidacja:

- Ręczne przejście ścieżki szczęśliwej dla konfiguracji przy pierwszym uruchomieniu i uruchomienia przez obecnego użytkownika.
- Ukierunkowane testy dla logiki routingu, utrwalania konfiguracji lub wyprowadzania statusu.
- Zrzuty ekranu przeglądarki dla zmienionych powierzchni responsywnych.

## Faza 3: Zaostrzenie architektury frontendu

Popraw łatwość utrzymania bez szerokiego przepisywania.

- Przenieś powtarzające się transformacje stanu UI do wąskich typowanych helperów.
- Zachowaj rozdział odpowiedzialności między pobieraniem danych, utrwalaniem i prezentacją.
- Preferuj istniejące hooki, store i wzorce komponentów zamiast nowych abstrakcji.
- Dziel przerośnięte komponenty tylko wtedy, gdy zmniejsza to sprzężenie lub upraszcza testy.
- Unikaj wprowadzania szerokiego stanu globalnego dla lokalnych interakcji panelu.

Wymagane zabezpieczenia:

- Nie zmieniaj publicznego zachowania jako efektu ubocznego dzielenia plików.
- Zachowaj działanie dostępności dla menu, dialogów, kart i nawigacji klawiaturą.
- Zweryfikuj, że nadal renderują się stany ładowania, pusty, błędu i optymistyczny.

## Faza 4: Wydajność i niezawodność

Skup się na zmierzonych problemach zamiast szerokiej optymalizacji teoretycznej.

- Mierz koszty uruchamiania, przejść między trasami, dużych list i transkryptu czatu.
- Zastępuj powtarzane kosztowne dane pochodne memoizowanymi selektorami lub cache'owanymi
  helperami tam, gdzie profilowanie wykazuje wartość.
- Ogranicz możliwe do uniknięcia skanowanie sieci lub systemu plików na gorących ścieżkach.
- Zachowaj deterministyczną kolejność dla danych wejściowych promptów, rejestrów, plików, pluginów i sieci
  przed budową payloadów modelu.
- Dodaj lekkie testy regresji dla gorących helperów i granic kontraktów.

Definicja ukończenia:

- Każda zmiana wydajnościowa zawiera bazę, oczekiwany wpływ, rzeczywisty wpływ i
  pozostałą lukę.
- Żadna poprawka wydajnościowa nie jest wdrażana wyłącznie na podstawie intuicji, gdy dostępny jest tani pomiar.

## Faza 5: Utwardzenie typów, kontraktów i testów

Podnieś poprawność w punktach granicznych, od których zależą użytkownicy i autorzy pluginów.

- Zastępuj luźne stringi runtime dyskryminowanymi uniami lub zamkniętymi listami kodów.
- Waliduj wejścia zewnętrzne istniejącymi helperami schematów lub `zod`.
- Dodaj testy kontraktowe wokół manifestów pluginów, katalogów dostawców, wiadomości protokołu Gateway
  i zachowania migracji konfiguracji.
- Zachowuj ścieżki zgodności w przepływach doctor lub repair zamiast ukrytych migracji
  wykonywanych przy starcie.
- Unikaj sprzężenia testów wyłącznie z wewnętrznymi szczegółami pluginów; używaj fasad SDK i udokumentowanych
  barreli.

Zalecana walidacja:

- `pnpm check:changed`
- Ukierunkowane testy dla każdej zmienionej granicy.
- `pnpm build`, gdy zmieniają się granice lazy, pakowanie lub publikowane powierzchnie.

## Faza 6: Dokumentacja i gotowość do wydania

Utrzymuj zgodność dokumentacji skierowanej do użytkownika z zachowaniem.

- Aktualizuj dokumentację wraz ze zmianami zachowania, API, konfiguracji, onboardingu lub pluginów.
- Dodawaj wpisy do changelogu tylko dla zmian widocznych dla użytkownika.
- W warstwie skierowanej do użytkownika zachowuj terminologię pluginów; wewnętrznych nazw pakietów używaj tylko tam,
  gdzie są potrzebne współtwórcom.
- Potwierdź, że instrukcje wydania i instalacji nadal odpowiadają bieżącej
  powierzchni poleceń.

Definicja ukończenia:

- Odpowiednia dokumentacja jest aktualizowana w tej samej gałęzi co zmiany zachowania.
- Gdy zostały naruszone, przechodzą wygenerowane kontrole dokumentacji lub dryfu API.
- W przekazaniu wymieniono każdą pominiętą walidację oraz powód jej pominięcia.

## Zalecany pierwszy etap

Zacznij od ograniczonego etapu dla Control UI i onboardingu:

- Przeaudytuj konfigurację przy pierwszym uruchomieniu, gotowość auth dostawców, status Gateway i powierzchnie
  konfiguracji pluginów.
- Usuń martwe działania i doprecyzuj stany awarii.
- Dodaj lub zaktualizuj ukierunkowane testy dla wyprowadzania statusu i utrwalania konfiguracji.
- Uruchom `pnpm check:changed`.

Daje to dużą wartość dla użytkownika przy ograniczonym ryzyku architektonicznym.

## Aktualizacja umiejętności frontendowej

Użyj tej sekcji, aby zaktualizować frontendowe `SKILL.md` dostarczone z zadaniem
modernizacji. Jeśli wdrażasz te wytyczne jako lokalną umiejętność OpenClaw w repozytorium,
najpierw utwórz `.agents/skills/openclaw-frontend/SKILL.md`, zachowaj frontmatter,
który należy do tej docelowej umiejętności, a następnie dodaj lub zastąp treść sekcji body
poniższą zawartością.

```markdown
# Standardy dostarczania frontendu

Używaj tej umiejętności podczas implementowania lub przeglądania prac nad React, Next.js,
desktop webview lub UI aplikacji skierowanych do użytkownika.

## Zasady operacyjne

- Zaczynaj od istniejącego workflow produktu i konwencji kodu.
- Preferuj najmniejszą poprawną poprawkę, która usprawnia bieżącą ścieżkę użytkownika.
- W przekazaniu oddzielaj wymagane poprawki od opcjonalnych ulepszeń.
- Nie twórz stron marketingowych, gdy żądanie dotyczy powierzchni aplikacji.
- Zachowuj widoczność i używalność działań w obsługiwanych rozmiarach viewportu.
- Usuwaj martwe affordance zamiast zostawiać kontrolki, które nie mogą nic zrobić.
- Zachowuj stany ładowania, pusty, błędu, sukcesu i uprawnień.
- Używaj istniejących komponentów design systemu, hooków, store i ikon, zanim dodasz
  nowe prymitywy.

## Lista kontrolna implementacji

1. Zidentyfikuj główne zadanie użytkownika oraz komponent lub trasę, które za nie odpowiadają.
2. Przed edycją przeczytaj lokalne wzorce komponentów.
3. Popraw najwęższą powierzchnię, która rozwiązuje problem.
4. Dodaj ograniczenia responsywne dla kontrolek o stałym formacie, toolbarów, siatek i
   liczników, aby tekst i stany hover nie mogły nieoczekiwanie zmieniać rozmiaru layoutu.
5. Zachowaj jasny podział odpowiedzialności między ładowaniem danych, wyprowadzaniem stanu i renderowaniem.
6. Dodaj testy, gdy zmienia się logika, utrwalanie, routing, uprawnienia lub współdzielone helpery.
7. Zweryfikuj główną ścieżkę szczęśliwą i najbardziej istotny przypadek brzegowy.

## Bramy jakości wizualnej

- Tekst musi mieścić się w swoim kontenerze na mobile i desktopie.
- Toolbary mogą się zawijać, ale kontrolki muszą pozostać osiągalne.
- Przyciski powinny używać znanych ikon, gdy ikona jest czytelniejsza niż tekst.
- Kart należy używać dla powtarzalnych elementów, modali i oprawionych narzędzi, a nie dla
  każdej sekcji strony.
- Unikaj monotonnych palet kolorów i dekoracyjnych teł, które konkurują z
  treścią operacyjną.
- Gęste powierzchnie produktowe powinny być zoptymalizowane pod kątem skanowania, porównywania i powtarzalnego
  użycia.

## Format przekazania

Zgłoś:

- Co się zmieniło.
- Jak zmieniło się zachowanie użytkownika.
- Wymaganą walidację, która przeszła.
- Każdą pominiętą walidację i konkretny powód.
- Opcjonalne dalsze prace, wyraźnie oddzielone od wymaganych poprawek.
```
