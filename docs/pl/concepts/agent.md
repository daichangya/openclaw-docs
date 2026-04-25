---
read_when:
    - Zmiana runtime agenta, bootstrapu obszaru roboczego lub zachowania sesji
summary: Runtime agenta, kontrakt obszaru roboczego i bootstrap sesji
title: Runtime agenta
x-i18n:
    generated_at: "2026-04-25T13:45:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw uruchamia **pojedynczy osadzony runtime agenta** — jeden proces agenta na
Gateway, z własnym obszarem roboczym, plikami bootstrap i magazynem sesji. Ta strona
opisuje kontrakt tego runtime: co musi zawierać obszar roboczy, które pliki są
wstrzykiwane i jak sesje wykonują bootstrap względem niego.

## Obszar roboczy (wymagany)

OpenClaw używa pojedynczego katalogu obszaru roboczego agenta (`agents.defaults.workspace`) jako **jedynego** katalogu roboczego (`cwd`) agenta dla narzędzi i kontekstu.

Zalecane: użyj `openclaw setup`, aby utworzyć `~/.openclaw/openclaw.json`, jeśli go brakuje, i zainicjalizować pliki obszaru roboczego.

Pełny układ obszaru roboczego + przewodnik po kopiach zapasowych: [Agent workspace](/pl/concepts/agent-workspace)

Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą nadpisywać to
obszarami roboczymi per sesja w `agents.defaults.sandbox.workspaceRoot` (zobacz
[Konfiguracja Gateway](/pl/gateway/configuration)).

## Pliki bootstrap (wstrzykiwane)

Wewnątrz `agents.defaults.workspace` OpenClaw oczekuje następujących plików edytowalnych przez użytkownika:

- `AGENTS.md` — instrukcje operacyjne + „pamięć”
- `SOUL.md` — persona, granice, ton
- `TOOLS.md` — notatki o narzędziach utrzymywane przez użytkownika (np. `imsg`, `sag`, konwencje)
- `BOOTSTRAP.md` — jednorazowy rytuał pierwszego uruchomienia (usuwany po zakończeniu)
- `IDENTITY.md` — nazwa/styl/emotikona agenta
- `USER.md` — profil użytkownika + preferowana forma zwracania się

W pierwszej turze nowej sesji OpenClaw wstrzykuje zawartość tych plików bezpośrednio do kontekstu agenta.

Puste pliki są pomijane. Duże pliki są przycinane i ucinane ze znacznikiem, aby prompty pozostały lekkie (przeczytaj plik, aby uzyskać pełną zawartość).

Jeśli pliku brakuje, OpenClaw wstrzykuje pojedynczy wiersz ze znacznikiem „brak pliku” (a `openclaw setup` utworzy bezpieczny domyślny szablon).

`BOOTSTRAP.md` jest tworzony tylko dla **zupełnie nowego obszaru roboczego** (gdy nie ma innych plików bootstrap). Jeśli usuniesz go po ukończeniu rytuału, nie powinien być odtwarzany przy późniejszych restartach.

Aby całkowicie wyłączyć tworzenie plików bootstrap (dla obszarów roboczych przygotowanych z wyprzedzeniem), ustaw:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Wbudowane narzędzia

Podstawowe narzędzia (read/exec/edit/write i powiązane narzędzia systemowe) są zawsze dostępne,
z zastrzeżeniem polityki narzędzi. `apply_patch` jest opcjonalne i kontrolowane przez
`tools.exec.applyPatch`. `TOOLS.md` **nie** kontroluje, które narzędzia istnieją; jest to
wskazówka, jak _Ty_ chcesz, aby były używane.

## Skills

OpenClaw ładuje Skills z następujących lokalizacji (od najwyższego priorytetu):

- Obszar roboczy: `<workspace>/skills`
- Skills agenta projektu: `<workspace>/.agents/skills`
- Osobiste Skills agenta: `~/.agents/skills`
- Zarządzane/lokalne: `~/.openclaw/skills`
- Dołączone (dostarczane z instalacją)
- Dodatkowe katalogi Skills: `skills.load.extraDirs`

Skills mogą być kontrolowane przez config/env (zobacz `skills` w [Konfiguracja Gateway](/pl/gateway/configuration)).

## Granice runtime

Osadzony runtime agenta jest zbudowany na rdzeniu agenta Pi (modele, narzędzia i
potok promptów). Zarządzanie sesjami, wykrywanie, okablowanie narzędzi i
dostarczanie kanałów to warstwy należące do OpenClaw ponad tym rdzeniem.

## Sesje

Transkrypty sesji są przechowywane jako JSONL w:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Identyfikator sesji jest stabilny i wybierany przez OpenClaw.
Starsze katalogi sesji z innych narzędzi nie są odczytywane.

## Sterowanie podczas streamingu

Gdy tryb kolejki to `steer`, wiadomości przychodzące są wstrzykiwane do bieżącego uruchomienia.
Steering z kolejki jest dostarczany **po zakończeniu wykonywania wywołań narzędzi
przez bieżącą turę asystenta**, przed następnym wywołaniem LLM. Steering nie pomija już
pozostałych wywołań narzędzi z bieżącej wiadomości asystenta; zamiast tego wstrzykuje wiadomość z kolejki przy następnej granicy modelu.

Gdy tryb kolejki to `followup` lub `collect`, wiadomości przychodzące są wstrzymywane do
zakończenia bieżącej tury, a następnie rozpoczyna się nowa tura agenta z ładunkami z kolejki. Zobacz
[Kolejka](/pl/concepts/queue), aby poznać zachowanie trybu + debounce/limit.

Block streaming wysyła ukończone bloki asystenta, gdy tylko się zakończą; jest
**domyślnie wyłączony** (`agents.defaults.blockStreamingDefault: "off"`).
Dostosuj granicę przez `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; domyślnie `text_end`).
Steruj miękkim dzieleniem bloków przez `agents.defaults.blockStreamingChunk` (domyślnie
800–1200 znaków; preferuje podziały akapitów, następnie nowe linie; zdania na końcu).
Scalaj streamowane fragmenty przez `agents.defaults.blockStreamingCoalesce`, aby ograniczyć
spam pojedynczymi liniami (scalanie oparte na bezczynności przed wysłaniem). Kanały inne niż Telegram wymagają
jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
Szczegółowe podsumowania narzędzi są emitowane przy uruchomieniu narzędzia (bez debounce); Control UI
streamuje wyjście narzędzi przez zdarzenia agenta, gdy są dostępne.
Więcej szczegółów: [Streaming + dzielenie na fragmenty](/pl/concepts/streaming).

## Referencje modeli

Referencje modeli w konfiguracji (na przykład `agents.defaults.model` i `agents.defaults.models`) są analizowane przez podział przy **pierwszym** `/`.

- Używaj `provider/model` podczas konfigurowania modeli.
- Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), dołącz prefiks providera (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz providera, OpenClaw najpierw próbuje aliasu, potem unikalnego
  dopasowania skonfigurowanego providera dla dokładnie tego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego providera. Jeśli ten provider nie udostępnia już
  skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego
  providera/modelu zamiast ujawniać nieaktualny domyślny model usuniętego providera.

## Konfiguracja (minimalna)

Co najmniej ustaw:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (zdecydowanie zalecane)

---

_Dalej: [Czaty grupowe](/pl/channels/group-messages)_ 🦞

## Powiązane

- [Agent workspace](/pl/concepts/agent-workspace)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Zarządzanie sesjami](/pl/concepts/session)
