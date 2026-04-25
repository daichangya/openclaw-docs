---
read_when:
    - Potrzebujesz dokładnej sygnatury typu `definePluginEntry` albo `defineChannelPluginEntry`
    - Chcesz zrozumieć tryb rejestracji (pełny vs setup vs metadane CLI)
    - Szukasz opcji punktu wejścia
sidebarTitle: Entry Points
summary: Dokumentacja referencyjna `definePluginEntry`, `defineChannelPluginEntry` i `defineSetupPluginEntry`
title: Punkty wejścia Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Każdy Plugin eksportuje domyślny obiekt entry. SDK udostępnia trzy pomocniki do
ich tworzenia.

Dla zainstalowanych Plugin `package.json` powinien wskazywać ładowaniu runtime
zbudowany JavaScript, gdy jest dostępny:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` i `setupEntry` pozostają prawidłowymi wpisami źródłowymi dla developmentu w
przestrzeni roboczej i checkoutów git. `runtimeExtensions` i `runtimeSetupEntry` są preferowane,
gdy OpenClaw ładuje zainstalowany pakiet, i pozwalają pakietom npm unikać
kompilacji TypeScript w runtime. Jeśli zainstalowany pakiet deklaruje tylko
wpis źródłowy TypeScript, OpenClaw użyje pasującego zbudowanego odpowiednika
`dist/*.js`, gdy taki istnieje, a potem wróci do źródła TypeScript.

Wszystkie ścieżki entry muszą pozostać wewnątrz katalogu pakietu Plugin. Wpisy runtime
i wnioskowane zbudowane odpowiedniki JavaScript nie sprawiają, że wychodząca poza katalog
ścieżka źródłowa `extensions` albo `setupEntry` staje się prawidłowa.

<Tip>
  **Szukasz przewodnika krok po kroku?** Zobacz [Channel Plugins](/pl/plugins/sdk-channel-plugins)
  albo [Provider Plugins](/pl/plugins/sdk-provider-plugins).
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dla Plugin dostawców, Plugin narzędzi, Plugin hooków oraz wszystkiego, co **nie jest**
kanałem wiadomości.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Krótki opis",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Pole           | Typ                                                              | Wymagane | Domyślnie           |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | Tak      | —                   |
| `name`         | `string`                                                         | Tak      | —                   |
| `description`  | `string`                                                         | Tak      | —                   |
| `kind`         | `string`                                                         | Nie      | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Pusty schemat obiektu |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Tak      | —                   |

- `id` musi odpowiadać manifestowi `openclaw.plugin.json`.
- `kind` służy do wyłącznych slotów: `"memory"` albo `"context-engine"`.
- `configSchema` może być funkcją do leniwej ewaluacji.
- OpenClaw rozwiązuje i memoizuje ten schemat przy pierwszym dostępie, więc kosztowne
  budownicze schematów uruchamiają się tylko raz.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Opakowuje `definePluginEntry` o logikę specyficzną dla kanału. Automatycznie wywołuje
`api.registerChannel({ plugin })`, udostępnia opcjonalny seam metadanych CLI dla root-help
i ogranicza `registerFull` według trybu rejestracji.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Krótki opis",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Pole                  | Typ                                                              | Wymagane | Domyślnie           |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Tak      | —                   |
| `name`                | `string`                                                         | Tak      | —                   |
| `description`         | `string`                                                         | Tak      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Tak      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Pusty schemat obiektu |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nie      | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nie      | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nie      | —                   |

- `setRuntime` jest wywoływane podczas rejestracji, aby można było zapisać referencję runtime
  (zwykle przez `createPluginRuntimeStore`). Jest pomijane podczas przechwytywania
  metadanych CLI.
- `registerCliMetadata` działa podczas `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` oraz
  `api.registrationMode === "full"`.
  Używaj go jako kanonicznego miejsca dla deskryptorów CLI należących do kanału, aby root help
  pozostawał nieaktywujący, snapshoty discovery zawierały statyczne metadane poleceń,
  a zwykła rejestracja poleceń CLI pozostawała zgodna z pełnymi załadowaniami Plugin.
- Rejestracja discovery jest nieaktywująca, ale nie wolna od importów. OpenClaw może
  ewaluować zaufany entry Plugin i moduł Plugin kanału, aby zbudować
  snapshot, więc utrzymuj importy najwyższego poziomu bez efektów ubocznych, a gniazda,
  klientów, workery i usługi umieszczaj za ścieżkami tylko dla `"full"`.
- `registerFull` działa tylko wtedy, gdy `api.registrationMode === "full"`. Jest pomijane
  podczas ładowania tylko-setup.
- Podobnie jak `definePluginEntry`, `configSchema` może być leniwą fabryką, a OpenClaw
  memoizuje rozwiązany schemat przy pierwszym dostępie.
- Dla poleceń root CLI należących do Plugin preferuj `api.registerCli(..., { descriptors: [...] })`,
  gdy chcesz, aby polecenie pozostawało leniwie ładowane bez znikania z
  drzewa parsowania root CLI. Dla Plugin kanałów preferuj rejestrowanie tych deskryptorów
  z `registerCliMetadata(...)`, a `registerFull(...)` zostaw dla pracy wyłącznie runtime.
- Jeśli `registerFull(...)` rejestruje też metody RPC gateway, trzymaj je pod
  prefiksem specyficznym dla Plugin. Zarezerwowane przestrzenie nazw administracyjnych core (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) są zawsze wymuszane do
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dla lekkiego pliku `setup-entry.ts`. Zwraca tylko `{ plugin }` bez
logiki runtime ani CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw ładuje to zamiast pełnego entry, gdy kanał jest wyłączony,
nieskonfigurowany albo gdy włączone jest odroczone ładowanie. Zobacz
[Setup and Config](/pl/plugins/sdk-setup#setup-entry), aby dowiedzieć się, kiedy ma to znaczenie.

W praktyce łącz `defineSetupPluginEntry(...)` z wąskimi rodzinami pomocników setup:

- `openclaw/plugin-sdk/setup-runtime` dla bezpiecznych w runtime pomocników setup, takich jak
  bezpieczne dla importu adaptery łatek setup, wyjście lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane proxy setup
- `openclaw/plugin-sdk/channel-setup` dla powierzchni setup opcjonalnej instalacji
- `openclaw/plugin-sdk/setup-tools` dla helperów setup/install CLI/archiwów/dokumentacji

Ciężkie SDK, rejestrację CLI i długotrwałe usługi runtime zostaw w pełnym entry.

Dołączone kanały przestrzeni roboczej, które rozdzielają powierzchnie setup i runtime, mogą zamiast tego używać
`defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract`. Ten kontrakt pozwala
entry setup zachować bezpieczne dla setup eksporty plugin/secrets, jednocześnie nadal udostępniając
setter runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Używaj tego dołączonego kontraktu tylko wtedy, gdy przepływy setup naprawdę potrzebują lekkiego settera runtime
przed załadowaniem pełnego entry kanału.

## Tryb rejestracji

`api.registrationMode` mówi Plugin, jak został załadowany:

| Tryb             | Kiedy                             | Co rejestrować                                                                                                          |
| ---------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`         | Zwykłe uruchomienie Gateway       | Wszystko                                                                                                                |
| `"discovery"`    | Odkrywanie możliwości tylko do odczytu | Rejestrację kanału plus statyczne deskryptory CLI; kod entry może się ładować, ale pomijaj gniazda, workery, klientów i usługi |
| `"setup-only"`   | Kanał wyłączony/nieskonfigurowany | Tylko rejestrację kanału                                                                                                |
| `"setup-runtime"`| Przepływ setup z dostępnym runtime | Rejestrację kanału plus tylko lekki runtime potrzebny przed załadowaniem pełnego entry                                 |
| `"cli-metadata"` | Root help / przechwytywanie metadanych CLI | Tylko deskryptory CLI                                                                                                   |

`defineChannelPluginEntry` obsługuje ten podział automatycznie. Jeśli używasz
`definePluginEntry` bezpośrednio dla kanału, sprawdzaj tryb samodzielnie:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Ciężkie rejestracje tylko runtime
  api.registerService(/* ... */);
}
```

Tryb discovery buduje nieaktywujący snapshot rejestru. Nadal może ewaluować
entry Plugin i obiekt Plugin kanału, aby OpenClaw mógł zarejestrować możliwości kanału
i statyczne deskryptory CLI. Traktuj ewaluację modułu w discovery jako
zaufaną, ale lekką: bez klientów sieciowych, podprocesów, listenerów, połączeń z bazą danych,
workerów w tle, odczytów poświadczeń ani innych żywych efektów ubocznych runtime na najwyższym poziomie.

Traktuj `"setup-runtime"` jako okno, w którym powierzchnie uruchamiania tylko-setup muszą
istnieć bez ponownego wejścia w pełny runtime dołączonego kanału. Dobrze pasują tu
rejestracja kanału, bezpieczne dla setup trasy HTTP, bezpieczne dla setup metody gateway oraz
delegowane helpery setup. Ciężkie usługi w tle, rejestratory CLI i bootstrapy SDK dostawców/klientów
nadal należą do `"full"`.

W szczególności dla rejestratorów CLI:

- używaj `descriptors`, gdy rejestrator posiada jedno albo więcej poleceń root i
  chcesz, aby OpenClaw leniwie ładował rzeczywisty moduł CLI przy pierwszym wywołaniu
- upewnij się, że deskryptory obejmują każdy root polecenia najwyższego poziomu udostępniany przez
  rejestrator
- nazwy poleceń deskryptorów ogranicz do liter, cyfr, myślnika i podkreślenia,
  zaczynając od litery albo cyfry; OpenClaw odrzuca nazwy deskryptorów poza tym
  kształtem i usuwa sekwencje sterujące terminala z opisów przed renderowaniem pomocy
- używaj samych `commands` tylko dla ścieżek zgodności eager

## Kształty Plugin

OpenClaw klasyfikuje załadowane Pluginy według ich zachowania rejestracyjnego:

| Kształt               | Opis                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Jeden typ możliwości (np. tylko dostawca)          |
| **hybrid-capability** | Wiele typów możliwości (np. dostawca + mowa)       |
| **hook-only**         | Tylko hooki, bez możliwości                        |
| **non-capability**    | Narzędzia/polecenia/usługi, ale bez możliwości     |

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt Plugin.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview) — API rejestracji i dokumentacja referencyjna podścieżek
- [Pomocniki runtime](/pl/plugins/sdk-runtime) — `api.runtime` i `createPluginRuntimeStore`
- [Setup i config](/pl/plugins/sdk-setup) — manifest, setup entry, odroczone ładowanie
- [Channel Plugins](/pl/plugins/sdk-channel-plugins) — budowanie obiektu `ChannelPlugin`
- [Provider Plugins](/pl/plugins/sdk-provider-plugins) — rejestracja dostawców i hooki
