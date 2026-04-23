---
read_when:
    - Potrzebujesz szczegółowego opisu działania `openclaw onboard`
    - Diagnozujesz wyniki onboardingu albo integrujesz klientów onboardingu
sidebarTitle: CLI reference
summary: Pełna dokumentacja przepływu konfiguracji CLI, konfiguracji auth/modelu, wyjść i elementów wewnętrznych
title: Dokumentacja konfiguracji CLI
x-i18n:
    generated_at: "2026-04-23T10:09:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Dokumentacja konfiguracji CLI

Ta strona jest pełną dokumentacją `openclaw onboard`.
Krótki przewodnik znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

## Co robi kreator

Tryb lokalny (domyślny) prowadzi Cię przez:

- Konfigurację modelu i auth (OAuth subskrypcji OpenAI Code, Anthropic Claude CLI albo klucz API, a także opcje MiniMax, GLM, Ollama, Moonshot, StepFun i AI Gateway)
- Lokalizację obszaru roboczego i pliki bootstrap
- Ustawienia Gateway (port, bind, auth, Tailscale)
- Kanały i providerów (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles i inne bundlowane Pluginy kanałów)
- Instalację daemona (LaunchAgent, jednostka systemd użytkownika albo natywne Scheduled Task Windows z zapasową ścieżką Startup-folder)
- Kontrolę kondycji
- Konfigurację Skills

Tryb zdalny konfiguruje tę maszynę tak, aby łączyła się z Gateway działającym gdzie indziej.
Nie instaluje ani nie modyfikuje niczego na zdalnym hoście.

## Szczegóły przepływu lokalnego

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz Keep, Modify albo Reset.
    - Ponowne uruchomienie kreatora nie usuwa niczego, chyba że jawnie wybierzesz Reset (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie używa zakresu `config+creds+sessions`; użyj `--reset-scope full`, aby usunąć także obszar roboczy.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, kreator zatrzymuje się i prosi o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa też obszar roboczy)
  </Step>
  <Step title="Model i auth">
    - Pełna macierz opcji znajduje się w [Opcje auth i modeli](#auth-and-model-options).
  </Step>
  <Step title="Obszar roboczy">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Tworzy pliki obszaru roboczego potrzebne do bootstrapu przy pierwszym uruchomieniu.
    - Układ obszaru roboczego: [Agent workspace](/pl/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Pyta o port, bind, tryb auth i ekspozycję przez Tailscale.
    - Zalecane: pozostaw włączone auth tokenem nawet dla loopback, aby lokalni klienci WS musieli się uwierzytelniać.
    - W trybie tokena interaktywna konfiguracja oferuje:
      - **Generate/store plaintext token** (domyślnie)
      - **Use SecretRef** (opcjonalnie)
    - W trybie hasła interaktywna konfiguracja także obsługuje przechowywanie jako plaintext albo SecretRef.
    - Nieinteraktywna ścieżka SecretRef tokena: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej env w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz auth tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Powiązania spoza loopback nadal wymagają auth.
  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie QR
    - [Telegram](/pl/channels/telegram): token bota
    - [Discord](/pl/channels/discord): token bota
    - [Google Chat](/pl/channels/googlechat): JSON konta serwisowego + webhook audience
    - [Mattermost](/pl/channels/mattermost): token bota + base URL
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta
    - [BlueBubbles](/pl/channels/bluebubbles): zalecane dla iMessage; URL serwera + hasło + webhook
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do DB
    - Bezpieczeństwo DM: domyślnie parowanie. Pierwszy DM wysyła kod; zatwierdź przez
      `openclaw pairing approve <channel> <code>` albo użyj list dozwolonych.
  </Step>
  <Step title="Instalacja daemona">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu bezobsługowego użyj własnego LaunchDaemon (nie jest dostarczany).
    - Linux i Windows przez WSL2: jednostka systemd użytkownika
      - Kreator próbuje wykonać `loginctl enable-linger <user>`, aby Gateway działało po wylogowaniu.
      - Może poprosić o sudo (zapisuje do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - Natywny Windows: najpierw Scheduled Task
      - Jeśli utworzenie zadania jest odrzucone, OpenClaw wraca do elementu logowania per użytkownik w folderze Startup i natychmiast uruchamia Gateway.
      - Scheduled Tasks pozostają preferowane, bo zapewniają lepszy status nadzorcy.
    - Wybór runtime: Node (zalecane; wymagane dla WhatsApp i Telegram). Bun nie jest zalecany.
  </Step>
  <Step title="Kontrola kondycji">
    - Uruchamia Gateway (jeśli potrzeba) i wykonuje `openclaw health`.
    - `openclaw status --deep` dodaje do wyniku statusu żywą sondę kondycji Gateway, w tym sondy kanałów, gdy są obsługiwane.
  </Step>
  <Step title="Skills">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżera Node: npm, pnpm albo bun.
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).
  </Step>
  <Step title="Zakończenie">
    - Podsumowanie i kolejne kroki, w tym opcje aplikacji iOS, Android i macOS.
  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, kreator wypisuje instrukcje przekierowania portu SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, kreator próbuje je zbudować; zapasowo używa `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Szczegóły trybu zdalnego

Tryb zdalny konfiguruje tę maszynę tak, aby łączyła się z Gateway działającym gdzie indziej.

<Info>
Tryb zdalny nie instaluje ani nie modyfikuje niczego na zdalnym hoście.
</Info>

Co ustawiasz:

- URL zdalnego Gateway (`ws://...`)
- Token, jeśli zdalne auth Gateway jest wymagane (zalecane)

<Note>
- Jeśli Gateway jest dostępne tylko przez loopback, użyj tunelowania SSH albo tailnet.
- Wskazówki wykrywania:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opcje auth i modeli

<AccordionGroup>
  <Accordion title="Klucz API Anthropic">
    Używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez daemona.
  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (OAuth)">
    Przepływ przeglądarkowy; wklej `code#state`.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.4`, gdy model jest nieustawiony albo ma postać `openai/*`.

  </Accordion>
  <Accordion title="Subskrypcja OpenAI Code (parowanie urządzenia)">
    Przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.

    Ustawia `agents.defaults.model` na `openai-codex/gpt-5.4`, gdy model jest nieustawiony albo ma postać `openai/*`.

  </Accordion>
  <Accordion title="Klucz API OpenAI">
    Używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie przechowuje poświadczenie w profilach auth.

    Ustawia `agents.defaults.model` na `openai/gpt-5.4`, gdy model jest nieustawiony, ma postać `openai/*` albo `openai-codex/*`.

  </Accordion>
  <Accordion title="Klucz API xAI (Grok)">
    Prosi o `XAI_API_KEY` i konfiguruje xAI jako providera modelu.
  </Accordion>
  <Accordion title="OpenCode">
    Prosi o `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`) i pozwala wybrać katalog Zen albo Go.
    URL konfiguracji: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Klucz API (ogólny)">
    Przechowuje klucz za Ciebie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Prosi o `AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Prosi o ID konta, ID bramy i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfiguracja jest zapisywana automatycznie. Domyślny model hostowany to `MiniMax-M2.7`; konfiguracja z kluczem API używa
    `minimax/...`, a konfiguracja OAuth używa `minimax-portal/...`.
    Więcej szczegółów: [MiniMax](/pl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfiguracja jest zapisywana automatycznie dla StepFun standard albo Step Plan na endpointach China lub global.
    Standard obecnie obejmuje `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    Więcej szczegółów: [StepFun](/pl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (zgodne z Anthropic)">
    Prosi o `SYNTHETIC_API_KEY`.
    Więcej szczegółów: [Synthetic](/pl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (chmurowe i lokalne modele otwarte)">
    Najpierw pyta o `Cloud + Local`, `Cloud only` albo `Local only`.
    `Cloud only` używa `OLLAMA_API_KEY` z `https://ollama.com`.
    Tryby oparte na hoście pytają o base URL (domyślnie `http://127.0.0.1:11434`), wykrywają dostępne modele i sugerują ustawienia domyślne.
    `Cloud + Local` sprawdza też, czy ten host Ollama jest zalogowany do dostępu chmurowego.
    Więcej szczegółów: [Ollama](/pl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot i Kimi Coding">
    Konfiguracje Moonshot (Kimi K2) i Kimi Coding są zapisywane automatycznie.
    Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot).
  </Accordion>
  <Accordion title="Niestandardowy provider">
    Działa ze zgodnymi z OpenAI i zgodnymi z Anthropic endpointami.

    Interaktywny onboarding obsługuje te same wybory przechowywania klucza API co inne przepływy kluczy API providerów:
    - **Paste API key now** (plaintext)
    - **Use secret reference** (odwołanie env albo skonfigurowanego providera, z walidacją preflight)

    Flagi nieinteraktywne:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcjonalne; zapasowo używa `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcjonalne)
    - `--custom-compatibility <openai|anthropic>` (opcjonalne; domyślnie `openai`)

  </Accordion>
  <Accordion title="Pomiń">
    Pozostawia auth nieskonfigurowane.
  </Accordion>
</AccordionGroup>

Zachowanie modeli:

- Wybierz model domyślny z wykrytych opcji albo ręcznie wprowadź providera i model.
- Gdy onboarding zaczyna się od wyboru auth providera, selektor modeli automatycznie preferuje
  tego providera. Dla Volcengine i BytePlus ta sama preferencja
  pasuje też do ich wariantów planu kodowania (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jeśli filtr preferowanego providera byłby pusty, selektor wraca do
  pełnego katalogu zamiast nie pokazywać żadnych modeli.
- Kreator uruchamia kontrolę modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje dla niego auth.

Ścieżki poświadczeń i profili:

- Profile auth (klucze API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Starszy import OAuth: `~/.openclaw/credentials/oauth.json`

Tryb przechowywania poświadczeń:

- Domyślne zachowanie onboardingu zapisuje klucze API jako wartości plaintext w profilach auth.
- `--secret-input-mode ref` włącza tryb odwołań zamiast przechowywania kluczy jako plaintext.
  W konfiguracji interaktywnej możesz wybrać:
  - odwołanie do zmiennej środowiskowej (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - odwołanie do skonfigurowanego providera (`file` albo `exec`) z aliasem providera + id
- Interaktywny tryb odwołań wykonuje szybką walidację preflight przed zapisaniem.
  - Odwołania env: sprawdza nazwę zmiennej i niepustą wartość w bieżącym środowisku onboardingu.
  - Odwołania providera: sprawdza konfigurację providera i rozwiązuje żądane id.
  - Jeśli preflight się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.
- W trybie nieinteraktywnym `--secret-input-mode ref` działa tylko z env.
  - Ustaw zmienną env providera w środowisku procesu onboardingu.
  - Flagi inline z kluczem (na przykład `--openai-api-key`) wymagają ustawienia tej zmiennej env; w przeciwnym razie onboarding szybko kończy się błędem.
  - Dla niestandardowych providerów nieinteraktywny tryb `ref` zapisuje `models.providers.<id>.apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - W tym przypadku niestandardowego providera `--custom-api-key` wymaga ustawienia `CUSTOM_API_KEY`; w przeciwnym razie onboarding szybko kończy się błędem.
- Poświadczenia auth Gateway obsługują wybór plaintext i SecretRef w konfiguracji interaktywnej:
  - Tryb tokena: **Generate/store plaintext token** (domyślnie) albo **Use SecretRef**.
  - Tryb hasła: plaintext albo SecretRef.
- Nieinteraktywna ścieżka SecretRef tokena: `--gateway-token-ref-env <ENV_VAR>`.
- Istniejące konfiguracje plaintext nadal działają bez zmian.

<Note>
Wskazówka dla trybu bezobsługowego i serwerów: zakończ OAuth na maszynie z przeglądarką, a następnie skopiuj
`auth-profiles.json` tego agenta (na przykład
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą mu
ścieżkę `$OPENCLAW_STATE_DIR/...`) na host Gateway. `credentials/oauth.json`
jest tylko starszym źródłem importu.
</Note>

## Wyjścia i elementy wewnętrzne

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano MiniMax)
- `tools.profile` (lokalny onboarding domyślnie ustawia to na `"coding"`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (lokalny onboarding domyślnie ustawia to na `per-channel-peer`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listy dozwolonych kanałów (Slack, Discord, Matrix, Microsoft Teams), gdy wybierzesz tę opcję w promptach (nazwy są rozwiązywane do ID, gdy to możliwe)
- `skills.install.nodeManager`
  - Flaga `setup --node-manager` akceptuje `npm`, `pnpm` albo `bun`.
  - Ręczna konfiguracja może później nadal ustawić `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` oraz opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Niektóre kanały są dostarczane jako Pluginy. Po wybraniu ich podczas konfiguracji kreator
prosi o instalację Pluginu (npm albo ścieżka lokalna) przed konfiguracją kanału.
</Note>

RPC kreatora Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Klienci (aplikacja macOS i Control UI) mogą renderować kroki bez ponownego implementowania logiki onboardingu.

Zachowanie konfiguracji Signal:

- Pobiera odpowiedni asset wydania
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`
- Zapisuje `channels.signal.cliPath` w konfiguracji
- Buildy JVM wymagają Java 21
- Tam, gdzie są dostępne, używane są buildy natywne
- Windows używa WSL2 i podąża za linuksowym przepływem `signal-cli` wewnątrz WSL

## Powiązana dokumentacja

- Centrum onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Automatyzacja i skrypty: [CLI Automation](/pl/start/wizard-cli-automation)
- Dokumentacja poleceń: [`openclaw onboard`](/pl/cli/onboard)
