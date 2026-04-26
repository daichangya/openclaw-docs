---
read_when:
    - Chcesz zrozumieć, jakie narzędzia udostępnia OpenClaw
    - Musisz skonfigurować, zezwolić na narzędzia lub je zablokować
    - Decydujesz między wbudowanymi narzędziami, Skills i Pluginami
summary: 'Przegląd narzędzi i Pluginów OpenClaw: co agent potrafi zrobić i jak go rozszerzać'
title: Narzędzia i Pluginy
x-i18n:
    generated_at: "2026-04-26T11:42:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

Wszystko, co agent robi poza generowaniem tekstu, dzieje się przez **narzędzia**.
Narzędzia to sposób, w jaki agent odczytuje pliki, uruchamia polecenia, przegląda sieć, wysyła
wiadomości i wchodzi w interakcje z urządzeniami.

## Narzędzia, Skills i Pluginy

OpenClaw ma trzy warstwy, które współpracują ze sobą:

<Steps>
  <Step title="Narzędzia to to, co wywołuje agent">
    Narzędzie to typowana funkcja, którą agent może wywołać (np. `exec`, `browser`,
    `web_search`, `message`). OpenClaw dostarcza zestaw **wbudowanych narzędzi**, a
    Pluginy mogą rejestrować dodatkowe.

    Agent widzi narzędzia jako strukturalne definicje funkcji wysyłane do API modelu.

  </Step>

  <Step title="Skills uczą agenta kiedy i jak">
    Skill to plik markdown (`SKILL.md`) wstrzykiwany do promptu systemowego.
    Skills dają agentowi kontekst, ograniczenia i instrukcje krok po kroku dotyczące
    skutecznego używania narzędzi. Skills znajdują się w Twoim workspace, we współdzielonych folderach
    albo są dostarczane wewnątrz Pluginów.

    [Dokumentacja Skills](/pl/tools/skills) | [Tworzenie Skills](/pl/tools/creating-skills)

  </Step>

  <Step title="Pluginy pakują wszystko razem">
    Plugin to pakiet, który może rejestrować dowolną kombinację możliwości:
    kanały, dostawców modeli, narzędzia, Skills, mowę, transkrypcję w czasie rzeczywistym,
    głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów, generowanie wideo,
    web fetch, web search i inne. Niektóre Pluginy są **rdzeniowe** (dostarczane z
    OpenClaw), inne są **zewnętrzne** (publikowane w npm przez społeczność).

    [Instalacja i konfiguracja Pluginów](/pl/tools/plugin) | [Zbuduj własny](/pl/plugins/building-plugins)

  </Step>
</Steps>

## Wbudowane narzędzia

Te narzędzia są dostarczane z OpenClaw i są dostępne bez instalowania jakichkolwiek Pluginów:

| Narzędzie                                 | Co robi                                                               | Strona                                                       |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Uruchamia polecenia powłoki, zarządza procesami w tle                 | [Exec](/pl/tools/exec), [Akceptacje Exec](/pl/tools/exec-approvals) |
| `code_execution`                          | Uruchamia sandboxowaną zdalną analizę Pythona                         | [Code Execution](/pl/tools/code-execution)                      |
| `browser`                                 | Steruje przeglądarką Chromium (nawigacja, kliknięcia, zrzuty ekranu)  | [Browser](/pl/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`   | Przeszukuje sieć, przeszukuje posty X, pobiera treść stron            | [Web](/pl/tools/web), [Web Fetch](/pl/tools/web-fetch)             |
| `read` / `write` / `edit`                 | Operacje wejścia/wyjścia na plikach w workspace                       |                                                              |
| `apply_patch`                             | Wielohunkowe poprawki plików                                          | [Apply Patch](/pl/tools/apply-patch)                            |
| `message`                                 | Wysyła wiadomości przez wszystkie kanały                              | [Agent Send](/pl/tools/agent-send)                              |
| `canvas`                                  | Steruje Node Canvas (present, eval, snapshot)                         |                                                              |
| `nodes`                                   | Odkrywa sparowane urządzenia i kieruje do nich działania              |                                                              |
| `cron` / `gateway`                        | Zarządza zadaniami harmonogramu; sprawdza, poprawia, restartuje lub aktualizuje Gateway |                                                              |
| `image` / `image_generate`                | Analizuje lub generuje obrazy                                         | [Generowanie obrazów](/pl/tools/image-generation)               |
| `music_generate`                          | Generuje utwory muzyczne                                              | [Generowanie muzyki](/pl/tools/music-generation)                |
| `video_generate`                          | Generuje wideo                                                        | [Generowanie wideo](/pl/tools/video-generation)                 |
| `tts`                                     | Jednorazowa konwersja tekstu na mowę                                  | [TTS](/pl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Zarządzanie sesjami, status i orkiestracja subagentów                 | [Subagenci](/pl/tools/subagents)                                |
| `session_status`                          | Lekkie odczytywanie w stylu `/status` i nadpisanie modelu sesji       | [Narzędzia sesji](/pl/concepts/session-tool)                    |

Do pracy z obrazami używaj `image` do analizy oraz `image_generate` do generowania lub edycji. Jeśli wskazujesz `openai/*`, `google/*`, `fal/*` albo innego niedomyślnego dostawcę obrazów, najpierw skonfiguruj auth/klucz API tego dostawcy.

Do pracy z muzyką używaj `music_generate`. Jeśli wskazujesz `google/*`, `minimax/*` albo innego niedomyślnego dostawcę muzyki, najpierw skonfiguruj auth/klucz API tego dostawcy.

Do pracy z wideo używaj `video_generate`. Jeśli wskazujesz `qwen/*` albo innego niedomyślnego dostawcę wideo, najpierw skonfiguruj auth/klucz API tego dostawcy.

Do generowania audio sterowanego workflow używaj `music_generate`, gdy Plugin taki jak
ComfyUI go rejestruje. Jest to oddzielne od `tts`, które służy do zamiany tekstu na mowę.

`session_status` to lekkie narzędzie statusu/odczytu w grupie sesji.
Odpowiada na pytania w stylu `/status` dotyczące bieżącej sesji i może
opcjonalnie ustawić nadpisanie modelu dla sesji; `model=default` usuwa to
nadpisanie. Podobnie jak `/status` może uzupełniać rzadkie liczniki tokenów/cache oraz
etykietę aktywnego modelu środowiska uruchomieniowego na podstawie ostatniego wpisu użycia w transkrypcie.

`gateway` to narzędzie środowiska uruchomieniowego tylko dla właściciela do operacji Gateway:

- `config.schema.lookup` dla jednego poddrzewa konfiguracji ograniczonego ścieżką przed edycjami
- `config.get` dla bieżącej migawki konfiguracji + hasha
- `config.patch` dla częściowych aktualizacji konfiguracji z restartem
- `config.apply` tylko dla pełnej zamiany konfiguracji
- `update.run` dla jawnej samodzielnej aktualizacji + restartu

Dla częściowych zmian preferuj `config.schema.lookup`, a potem `config.patch`. Używaj
`config.apply` tylko wtedy, gdy celowo zastępujesz całą konfigurację.
Aby zapoznać się z szerszą dokumentacją konfiguracji, przeczytaj [Konfiguracja](/pl/gateway/configuration) oraz
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference).
Narzędzie odmawia także zmiany `tools.exec.ask` lub `tools.exec.security`;
starsze aliasy `tools.bash.*` są normalizowane do tych samych chronionych ścieżek exec.

### Narzędzia dostarczane przez Pluginy

Pluginy mogą rejestrować dodatkowe narzędzia. Kilka przykładów:

- [Diffs](/pl/tools/diffs) — przeglądarka i renderer diffów
- [LLM Task](/pl/tools/llm-task) — krok LLM tylko JSON dla ustrukturyzowanych danych wyjściowych
- [Lobster](/pl/tools/lobster) — typowane środowisko uruchomieniowe workflow z wznawialnymi akceptacjami
- [Music Generation](/pl/tools/music-generation) — współdzielone narzędzie `music_generate` z dostawcami opartymi na workflow
- [OpenProse](/pl/prose) — orkiestracja workflow z podejściem markdown-first
- [Tokenjuice](/pl/tools/tokenjuice) — kompaktuje zaszumione wyniki narzędzi `exec` i `bash`

## Konfiguracja narzędzi

### Listy zezwalania i blokowania

Kontroluj, które narzędzia agent może wywoływać przez `tools.allow` / `tools.deny` w
konfiguracji. Blokowanie zawsze ma pierwszeństwo przed zezwoleniem.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw kończy się bezpieczną odmową, gdy jawna allowlist rozwiązuje się do braku wywoływalnych narzędzi.
Na przykład `tools.allow: ["query_db"]` działa tylko wtedy, gdy załadowany Plugin rzeczywiście
rejestruje `query_db`. Jeśli allowlist nie pasuje do żadnego
wbudowanego narzędzia, narzędzia Pluginu ani dołączonego do pakietu narzędzia MCP,
uruchomienie zatrzymuje się przed wywołaniem modelu zamiast przechodzić dalej jako uruchomienie tylko tekstowe, które mogłoby halucynować wyniki narzędzi.

### Profile narzędzi

`tools.profile` ustawia bazową allowlist przed zastosowaniem `allow`/`deny`.
Nadpisanie per agent: `agents.list[].tools.profile`.

| Profil      | Co obejmuje                                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Brak ograniczeń (tak samo jak brak ustawienia)                                                                                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | tylko `session_status`                                                                                                                          |

`coding` obejmuje lekkie narzędzia web (`web_search`, `web_fetch`, `x_search`),
ale nie obejmuje pełnego narzędzia sterowania przeglądarką. Automatyzacja przeglądarki może sterować prawdziwymi
sesjami i zalogowanymi profilami, więc dodaj ją jawnie przez
`tools.alsoAllow: ["browser"]` albo per agent przez
`agents.list[].tools.alsoAllow: ["browser"]`.

Profile `coding` i `messaging` dopuszczają również skonfigurowane narzędzia bundle MCP
pod kluczem Pluginu `bundle-mcp`. Dodaj `tools.deny: ["bundle-mcp"]`, gdy
chcesz, aby profil zachował swoje zwykłe wbudowane narzędzia, ale ukrył wszystkie skonfigurowane narzędzia MCP.
Profil `minimal` nie obejmuje narzędzi bundle MCP.

### Grupy narzędzi

Używaj skrótów `group:*` w listach zezwalania/blokowania:

| Grupa              | Narzędzia                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` jest akceptowane jako alias `exec`)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                          |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                               |
| `group:web`        | web_search, x_search, web_fetch                                                                         |
| `group:ui`         | browser, canvas                                                                                         |
| `group:automation` | cron, gateway                                                                                           |
| `group:messaging`  | message                                                                                                 |
| `group:nodes`      | nodes                                                                                                   |
| `group:agents`     | agents_list                                                                                             |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                              |
| `group:openclaw`   | Wszystkie wbudowane narzędzia OpenClaw (bez narzędzi Pluginów)                                          |

`sessions_history` zwraca ograniczony, filtrowany pod kątem bezpieczeństwa widok przywołania. Usuwa
tagi Thinking, rusztowanie `<relevant-memories>`, ładunki XML wywołań narzędzi w postaci zwykłego tekstu
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi),
zdegradowane rusztowanie wywołań narzędzi, wyciekłe tokeny sterowania modelem ASCII/full-width
oraz błędny XML wywołań narzędzi MiniMax z tekstu asystenta, a następnie stosuje
redakcję/przycinanie i w razie potrzeby placeholdery zbyt dużych wierszy zamiast działać
jak surowy zrzut transkryptu.

### Ograniczenia specyficzne dla dostawcy

Używaj `tools.byProvider`, aby ograniczać narzędzia dla określonych dostawców bez
zmieniania globalnych ustawień domyślnych:

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
