---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Musisz skonfigurować, zezwolić na narzędzia lub je zablokować
    - Decydujesz między wbudowanymi narzędziami, Skills i Pluginami
summary: 'Przegląd narzędzi i Plugin OpenClaw: co agent potrafi robić i jak go rozszerzać'
title: Narzędzia i Pluginy
x-i18n:
    generated_at: "2026-04-25T13:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

Wszystko, co agent robi poza generowaniem tekstu, dzieje się przez **narzędzia**.
Narzędzia pozwalają agentowi czytać pliki, uruchamiać polecenia, przeglądać web, wysyłać
wiadomości i wchodzić w interakcje z urządzeniami.

## Narzędzia, Skills i Pluginy

OpenClaw ma trzy warstwy, które współdziałają:

<Steps>
  <Step title="Narzędzia to to, co wywołuje agent">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw dostarcza zestaw **wbudowanych narzędzi**, a
    Pluginy mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako ustrukturyzowane definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills uczą agenta kiedy i jak">
    Skill to plik markdown (`SKILL.md`) wstrzykiwany do promptu systemowego.
    Skills dają agentowi kontekst, ograniczenia i instrukcje krok po kroku
    dotyczące skutecznego używania narzędzi. Skills znajdują się w Twoim obszarze roboczym, we współdzielonych folderach
    albo są dostarczane wewnątrz Pluginów.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Pluginy pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, providerów modeli, narzędzia, Skills, mowę, transkrypcję realtime,
    głos realtime, rozumienie mediów, generowanie obrazów, generowanie wideo,
    web fetch, web search i inne. Niektóre Pluginy są **rdzeniowe** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane przez społeczność w npm).

    [Instalacja i konfiguracja Pluginów](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i są dostępne bez instalowania jakichkolwiek Pluginów:

| Narzędzie                                 | Co robi                                                               | Strona                                                       |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Uruchamia polecenia powłoki, zarządza procesami w tle                 | [Exec](/pl/tools/exec), [Exec Approvals](/pl/tools/exec-approvals) |
| `code_execution`                          | Uruchamia sandboxowaną zdalną analizę Python                          | [Code Execution](/pl/tools/code-execution)                      |
| `browser`                                 | Steruje przeglądarką Chromium (nawigacja, kliknięcia, zrzuty ekranu)  | [Browser](/pl/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`   | Przeszukuje web, przeszukuje wpisy X, pobiera zawartość stron         | [Web](/pl/tools/web), [Web Fetch](/pl/tools/web-fetch)             |
| `read` / `write` / `edit`                 | Wejście/wyjście plików w obszarze roboczym                            |                                                              |
| `apply_patch`                             | Wielohunkowe patche plików                                            | [Apply Patch](/pl/tools/apply-patch)                            |
| `message`                                 | Wysyła wiadomości przez wszystkie kanały                              | [Agent Send](/pl/tools/agent-send)                              |
| `canvas`                                  | Steruje node Canvas (present, eval, snapshot)                         |                                                              |
| `nodes`                                   | Wykrywa i wybiera sparowane urządzenia                                |                                                              |
| `cron` / `gateway`                        | Zarządza zaplanowanymi zadaniami; sprawdza, patchuje, restartuje lub aktualizuje gateway |                                                              |
| `image` / `image_generate`                | Analizuje lub generuje obrazy                                         | [Image Generation](/pl/tools/image-generation)                  |
| `music_generate`                          | Generuje utwory muzyczne                                              | [Music Generation](/pl/tools/music-generation)                  |
| `video_generate`                          | Generuje wideo                                                        | [Video Generation](/pl/tools/video-generation)                  |
| `tts`                                     | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, status i orkiestracja subagentów                | [Sub-agents](/pl/tools/subagents)                               |
| `session_status`                          | Lekki odczyt w stylu `/status` i nadpisanie modelu dla sesji          | [Session Tools](/pl/concepts/session-tool)                      |

Do pracy z obrazami używaj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli kierujesz żądanie do `openai/*`, `google/*`, `fal/*` lub innego niedomyślnego providera obrazów, najpierw skonfiguruj auth/klucz API tego providera.

Do pracy z muzyką używaj `music_generate`. Jeśli kierujesz żądanie do `google/*`, `minimax/*` lub innego niedomyślnego providera muzyki, najpierw skonfiguruj auth/klucz API tego providera.

Do pracy z wideo używaj `video_generate`. Jeśli kierujesz żądanie do `qwen/*` lub innego niedomyślnego providera wideo, najpierw skonfiguruj auth/klucz API tego providera.

Do generowania audio sterowanego workflow używaj `music_generate`, gdy rejestruje je
Plugin taki jak ComfyUI. Jest to oddzielne od `tts`, które służy do text-to-speech.

`session_status` to lekkie narzędzie status/odczytu w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu per sesja; `model=default` czyści to
nadpisanie. Podobnie jak `/status`, może uzupełniać rzadkie liczniki tokenów/cache i
etykietę aktywnego modelu runtime na podstawie najnowszego wpisu użycia transkryptu.

`gateway` to narzędzie runtime tylko dla właściciela do operacji na gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji o określonej ścieżce przed edycją
- `config.get` dla bieżącej migawki konfiguracji + hasha
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko do pełnej wymiany konfiguracji
- `update.run` do jawnej samodzielnej aktualizacji + restartu

Dla częściowych zmian preferuj `config.schema.lookup`, a następnie `config.patch`. Używaj
`config.apply` tylko wtedy, gdy celowo zastępujesz całą konfigurację.
Narzędzie odmawia też zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez Pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Kilka przykładów:

- [Diffs](/pl/tools/diffs) — przeglądarka i renderer diffów
- [LLM Task](/pl/tools/llm-task) — krok LLM tylko-JSON dla ustrukturyzowanego wyjścia
- [Lobster](/pl/tools/lobster) — typowany runtime workflow z wznawialnymi zatwierdzeniami
- [Music Generation](/pl/tools/music-generation) — współdzielone narzędzie `music_generate` z providerami opartymi na workflow
- [OpenProse](/pl/prose) — orkiestracja workflow w stylu markdown-first
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktuje zaszumione wyniki narzędzi `exec` i `bash`

## Konfiguracja narzędzi

### Listy zezwoleń i blokad

Kontroluj, które narzędzia agent może wywoływać przez `tools.allow` / `tools.deny` w
konfiguracji. `deny` zawsze ma pierwszeństwo nad `allow`.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw bezpiecznie kończy działanie, gdy jawna allowlista nie rozwiązuje się do żadnych wywoływalnych narzędzi.
Na przykład `tools.allow: ["query_db"]` działa tylko wtedy, gdy załadowany Plugin rzeczywiście
rejestruje `query_db`. Jeśli żadne narzędzie wbudowane, Plugin ani dołączone narzędzie MCP nie pasuje do
allowlisty, uruchomienie zatrzymuje się przed wywołaniem modelu zamiast przechodzić do uruchomienia tylko tekstowego, które mogłoby halucynować wyniki narzędzi.

### Profile narzędzi

`tools.profile` ustawia bazową allowlistę przed zastosowaniem `allow`/`deny`.
Nadpisanie per agent: `agents.list[].tools.profile`.

| Profil      | Co obejmuje                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Bez ograniczeń (to samo co brak ustawienia)                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | Tylko `session_status`                                                                                                                           |

Profile `coding` i `messaging` zezwalają także na skonfigurowane narzędzia bundle MCP
pod kluczem Plugin `bundle-mcp`. Dodaj `tools.deny: ["bundle-mcp"]`, gdy
chcesz, by profil zachował normalne narzędzia wbudowane, ale ukrył wszystkie skonfigurowane narzędzia MCP.
Profil `minimal` nie obejmuje narzędzi bundle MCP.

### Grupy narzędzi

Używaj skrótów `group:*` w listach allow/deny:

| Grupa              | Narzędzia                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowany jako alias `exec`)                                  |
| `group:fs`         | read, write, edit, apply_patch                                                                             |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status  |
| `group:memory`     | memory_search, memory_get                                                                                  |
| `group:web`        | web_search, x_search, web_fetch                                                                            |
| `group:ui`         | browser, canvas                                                                                            |
| `group:automation` | cron, gateway                                                                                              |
| `group:messaging`  | message                                                                                                    |
| `group:nodes`      | nodes                                                                                                      |
| `group:agents`     | agents_list                                                                                                |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                 |
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (bez narzędzi Plugin)                                               |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok odtworzenia. Usuwa
tagi myślenia, rusztowanie `<relevant-memories>`, tekstowe payloady XML wywołań narzędzi
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi),
zdegradowane rusztowanie wywołań narzędzi, wyciekłe tokeny sterujące modelu ASCII/full-width
oraz nieprawidłowy XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/przycinanie i ewentualne placeholdery zbyt dużych wierszy zamiast działać
jak surowy zrzut transkryptu.

### Ograniczenia specyficzne dla providera

Użyj `tools.byProvider`, aby ograniczyć narzędzia dla określonych providerów bez
zmieniania ustawień globalnych:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
