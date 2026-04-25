---
read_when:
    - Potrzebujesz szczegółowego opisu działania `openclaw onboard`
    - Debugujesz wyniki onboardingu lub integrujesz klientów onboardingu
sidebarTitle: CLI reference
summary: Pełna dokumentacja przepływu konfiguracji CLI, ustawień auth/modeli, wyników i elementów wewnętrznych
title: Dokumentacja konfiguracji CLI
x-i18n:
    generated_at: "2026-04-25T13:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Ta strona to pełna dokumentacja `openclaw onboard`.
Krótki przewodnik znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) prowadzi przez:

- Konfigurację modelu i auth (OAuth subskrypcji OpenAI Code, Anthropic Claude CLI lub klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację workspace i pliki bootstrap
- Ustawienia Gateway (port, bind, auth, tailscale)
- Kanały i dostawców (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles oraz inne wbudowane pluginy kanałów)
- Instalację daemona (LaunchAgent, jednostka użytkownika systemd lub natywne Windows Scheduled Task z awaryjnym użyciem folderu Startup)
- Health check
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę tak, aby łączyła się z Gateway uruchomionym gdzie indziej.
Nie instaluje ani nie modyfikuje niczego na zdalnym hoście.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz Keep, Modify albo Reset.
    - Ponowne uruchomienie kreatora nie usuwa niczego, chyba że jawnie wybierzesz Reset (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie używa zakresu `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć również workspace.
    - Jeśli konfiguracja jest nieprawidłowa lub zawiera starsze klucze, kreator zatrzymuje się i prosi o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa też workspace)
  </Step>
  <Step title="Model i auth">
    - Pełna macierz opcji znajduje się w [Opcje auth i modeli](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Tworzy pliki workspace potrzebne do bootstrap przy pierwszym uruchomieniu.
    - Układ workspace: [Agent workspace](/pl/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Pyta o port, bind, tryb auth i ekspozycję przez tailscale.
    - Zalecane: pozostaw włączone auth tokenem nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelnić.
    - W trybie tokenu interaktywna konfiguracja oferuje:
      - **Wygeneruj/zapisz token jawnym tekstem** (domyślnie)
      - **Użyj SecretRef** (opcjonalnie)
    - W trybie hasła interaktywna konfiguracja także obsługuje przechowywanie jawnym tekstem lub przez SecretRef.
    - Ścieżka SecretRef dla tokenu w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
      - Nie może być łączone z `--gateway-token`.
    - Wyłączaj auth tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Bindy inne niż loopback nadal wymagają auth.
  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + webhook audience
    - [Mattermost](/pl/channels/mattermost): token bota + bazowy URL
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [BlueBubbles](/pl/channels/bluebubbles): zalecane dla iMessage; URL serwera + hasło + webhook
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do DB
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwsza wiadomość DM wysyła kod; zatwierdź przez
      `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.
  </Step>
  <Step title="Instalacja daemona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla środowisk headless użyj własnego LaunchDaemon (nie jest dostarczany).
    - Linux i Windows przez WSL2: jednostka użytkownika systemd
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby gateway działał po wylogowaniu.
      - Może poprosić o sudo (zapisuje do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw Scheduled Task
      - Jeśli utworzenie zadania zostanie zabronione, OpenClaw wraca do elementu logowania per-user w folderze Startup i natychmiast uruchamia gateway.
      - Scheduled Tasks pozostają preferowane, ponieważ zapewniają lepszy status nadzorcy.
    - Wybór runtime: Node (zalecane; wymagane dla WhatsApp i Telegram). Bun nie jest zalecany.
  </Step>
  <Step title="Health check">
    - Uruchamia gateway (jeśli trzeba) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje do wyniku statusu sondę live zdrowia gateway, w tym sondy kanałów, gdy są obsługiwane.
  </Step>
  <Step title="Skills">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżer Node: npm, pnpm lub bun.
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).
  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i kolejne kroki, w tym opcje aplikacji dla iOS, Androida i macOS.
  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, kreator wyświetla instrukcje przekierowania portów SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; ścieżką awaryjną jest `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę tak, aby łączyła się z Gateway uruchomionym gdzie indziej.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na zdalnym hoście.
</Info>

Co ustawiasz:

- URL zdalnego Gateway (`ws://...`)
- Token, jeśli zdalny Gateway wymaga auth (zalecane)

<Note>
- Jeśli gateway jest dostępny tylko przez loopback, użyj tunelowania SSH lub tailnet.
- Wskazówki wykrywania:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opcje auth i modeli

<AccordionGroup>
  <Accordion title="Klucz API Anthropic">
    Używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez daemon.
  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (OAuth)">
    Przepływ w przeglądarce; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony lub należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (parowanie urządzenia)">
    Przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.5`, gdy model nie jest ustawiony lub należy już do rodziny OpenAI.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje poświadczenie w profilach auth.

    Ustawia `agents.defaults.model` na `openai/gpt-5.4`, gdy model nie jest ustawiony, ma prefiks `openai/*` albo `openai-codex/*`.

  </Accordion>
  <Accordion title="Klucz API xAI (Grok)">
    Prosi o `XAI_API_KEY` i konfiguruje xAI jako dostawcę modeli.
  </Accordion>
  <Accordion title="OpenCode">
    Prosi o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`) i pozwala wybrać katalog Zen albo Go.
    URL konfiguracji: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Klucz API (ogólny)">
    Zapisuje klucz za Ciebie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Prosi o `AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Prosi o account ID, gateway ID i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfiguracja jest zapisywana automatycznie. Domyślny model hostowany to `MiniMax-M2.7`; konfiguracja z kluczem API używa
    `minimax/...`, a konfiguracja OAuth używa `minimax-portal/...`.
    Więcej szczegółów: [MiniMax](/pl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfiguracja jest zapisywana automatycznie dla StepFun standard lub Step Plan na endpointach chińskich albo globalnych.
    Wersja standardowa obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    Więcej szczegółów: [StepFun](/pl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (zgodny z Anthropic)">
    Prosi o `SYNTHETIC_API_KEY`.
    Więcej szczegółów: [Synthetic](/pl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud i lokalne modele open)">
    Najpierw pyta o `Cloud + Local`, `Cloud only` albo `Local only`.
    `Cloud only` używa `OLLAMA_API_KEY` z `https://ollama.com`.
    Tryby oparte na hoście pytają o bazowy URL (domyślnie `http://127.0.0.1:11434`), wykrywają dostępne modele i sugerują wartości domyślne.
    `Cloud + Local` sprawdza też, czy ten host Ollama jest zalogowany do dostępu cloud.
    Więcej szczegółów: [Ollama](/pl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot i Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot).
  </Accordion>
  <Accordion title="Niestandardowy dostawca">
    Działa z endpointami zgodnymi z OpenAI i Anthropic.

    Interaktywny onboarding obsługuje te same opcje przechowywania klucza API co inne przepływy kluczy API dostawców:
    - **Wklej klucz API teraz** (jawny tekst)
    - **Użyj odwołania do sekretu** (odwołanie do zmiennej środowiskowej lub skonfigurowanego dostawcy, z walidacją przed zapisem)

    Flagi nieinteraktywne:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalne; domyślnie używa `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalne)
    - `--custom-compatibility <openai|anthropic>` (opcjonalne; domyślnie `openai`)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia auth nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modelu:

- Wybierz model domyślny z wykrytych opcji albo wprowadź dostawcę i model ręcznie.
- Gdy onboarding zaczyna się od wyboru auth dostawcy, selektor modeli automatycznie preferuje
  tego dostawcę. Dla Volcengine i BytePlus ta sama preferencja
  obejmuje również ich warianty planów coding (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy byłby pusty, selektor wraca do pełnego katalogu zamiast wyświetlać brak modeli.
- Kreator uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany lub brakuje auth.

Ścieżki poświadczeń i profili:

- Profile auth (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import starszego OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania poświadczeń:

- Domyślne zachowanie onboardingu zapisuje klucze API jako wartości jawnego tekstu w profilach auth.
- `--secret-input-mode ref` włącza tryb odwołań zamiast przechowywania klucza jawnym tekstem.
  W konfiguracji interaktywnej możesz wybrać:
  - odwołanie do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - odwołanie do skonfigurowanego dostawcy (`file` lub `exec`) z aliasem dostawcy + id
- Interaktywny tryb odwołań wykonuje szybką walidację przed zapisem.
  - Odwołania env: sprawdza nazwę zmiennej i niepustą wartość w bieżącym środowisku onboardingu.
  - Odwołania dostawcy: sprawdza konfigurację dostawcy i rozwiązuje żądane id.
  - Jeśli walidacja wstępna się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.
- W trybie nieinteraktywnym `--secret-input-mode ref` jest obsługiwane tylko przez env.
  - Ustaw zmienną środowiskową dostawcy w środowisku procesu onboardingu.
  - Flagi klucza inline (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej środowiskowej; w przeciwnym razie onboarding kończy się natychmiast błędem.
  - Dla niestandardowych dostawców nieinteraktywny tryb `ref` zapisuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku niestandardowego dostawcy `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie onboarding kończy się natychmiast błędem.
- Poświadczenia auth Gateway obsługują w konfiguracji interaktywnej wybór jawnego tekstu i SecretRef:
  - Tryb tokenu: **Wygeneruj/zapisz token jawnym tekstem** (domyślnie) albo **Użyj SecretRef**.
  - Tryb hasła: jawny tekst albo SecretRef.
- Ścieżka SecretRef dla tokenu w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje z jawnym tekstem nadal działają bez zmian.

<Note>
Wskazówka dla środowisk headless i serwerów: ukończ OAuth na maszynie z przeglądarką, a następnie skopiuj
`auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` lub odpowiadającą mu
ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
jest tylko starszym źródłem importu.
</Note>

## Wyniki i elementy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, gdy przekazano `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (jeśli wybrano MiniMax)
- `tools.profile` (lokalny onboarding domyślnie ustawia `"coding"`, jeśli brak wartości; istniejące jawne wartości są zachowywane)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (lokalny onboarding domyślnie ustawia to na `per-channel-peer`, jeśli brak wartości; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych dla kanałów (Slack, Discord, Matrix, Microsoft Teams), gdy wyrazisz zgodę podczas promptów (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe)
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` akceptuje `npm`, `pnpm` lub `bun`.
  - Ręczna konfiguracja może później nadal ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` i opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Niektóre kanały są dostarczane jako pluginy. Gdy zostaną wybrane podczas konfiguracji, kreator
prosi o zainstalowanie pluginu (npm lub ścieżka lokalna) przed konfiguracją kanału.
</Note>

RPC kreatora Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i Control UI) mogą renderować kroki bez ponownej implementacji logiki onboardingu.

Zachowanie konfiguracji Signal:

- Pobiera odpowiedni asset wydania
- Zapisuje go w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Buildy JVM wymagają Java 21
- Buildy natywne są używane, gdy są dostępne
- Windows używa WSL2 i stosuje przepływ Linux `signal-cli` wewnątrz WSL

## Powiązana dokumentacja

- Centrum onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [CLI Automation](/pl/start/wizard-cli-automation)
- Dokumentacja poleceń: [`openclaw onboard`](/pl/cli/onboard)
