---
read_when:
    - Szukanie konkretnego kroku lub flagi onboardingu
    - Automatyzowanie onboardingu w trybie nieinteraktywnym
    - Debugowanie zachowania onboardingu
sidebarTitle: Onboarding Reference
summary: 'Pełna dokumentacja onboardingu CLI: każdy krok, flaga i pole konfiguracji'
title: Dokumentacja onboardingu
x-i18n:
    generated_at: "2026-04-23T10:08:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# Dokumentacja onboardingu

To jest pełna dokumentacja `openclaw onboard`.
Aby zobaczyć przegląd wysokiego poziomu, zajrzyj do [Onboarding (CLI)](/pl/start/wizard).

## Szczegóły przepływu (tryb lokalny)

<Steps>
  <Step title="Wykrywanie istniejącej konfiguracji">
    - Jeśli istnieje `~/.openclaw/openclaw.json`, wybierz **Keep / Modify / Reset**.
    - Ponowne uruchomienie onboardingu **nie** czyści niczego, chyba że jawnie wybierzesz **Reset**
      (albo przekażesz `--reset`).
    - CLI `--reset` domyślnie używa zakresu `config+creds+sessions`; użyj `--reset-scope full`,
      aby usunąć także workspace.
    - Jeśli konfiguracja jest nieprawidłowa albo zawiera starsze klucze, kreator zatrzymuje się i prosi
      o uruchomienie `openclaw doctor` przed kontynuacją.
    - Reset używa `trash` (nigdy `rm`) i oferuje zakresy:
      - Tylko konfiguracja
      - Konfiguracja + poświadczenia + sesje
      - Pełny reset (usuwa także workspace)
  </Step>
  <Step title="Model/Auth">
    - **Klucz API Anthropic**: używa `ANTHROPIC_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go do użycia przez daemon.
    - **Klucz API Anthropic**: preferowany wybór asystenta Anthropic w onboarding/configure.
    - **Anthropic setup-token**: nadal dostępny w onboarding/configure, choć OpenClaw preferuje teraz ponowne użycie Claude CLI, gdy jest dostępne.
    - **Subskrypcja OpenAI Code (Codex) (OAuth)**: przepływ przeglądarkowy; wklej `code#state`.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.4`, gdy model nie jest ustawiony albo ma postać `openai/*`.
    - **Subskrypcja OpenAI Code (Codex) (parowanie urządzenia)**: przepływ parowania w przeglądarce z krótkotrwałym kodem urządzenia.
      - Ustawia `agents.defaults.model` na `openai-codex/gpt-5.4`, gdy model nie jest ustawiony albo ma postać `openai/*`.
    - **Klucz API OpenAI**: używa `OPENAI_API_KEY`, jeśli jest obecny, albo prosi o klucz, a następnie zapisuje go w profilach auth.
      - Ustawia `agents.defaults.model` na `openai/gpt-5.4`, gdy model nie jest ustawiony, ma postać `openai/*` albo `openai-codex/*`.
    - **Klucz API xAI (Grok)**: prosi o `XAI_API_KEY` i konfiguruje xAI jako providera modeli.
    - **OpenCode**: prosi o `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`, pobierz go na https://opencode.ai/auth) i pozwala wybrać katalog Zen albo Go.
    - **Ollama**: najpierw oferuje **Cloud + Local**, **Cloud only** albo **Local only**. `Cloud only` prosi o `OLLAMA_API_KEY` i używa `https://ollama.com`; tryby oparte na hoście proszą o base URL Ollama, wykrywają dostępne modele i automatycznie pobierają wybrany model lokalny, gdy jest potrzebny; `Cloud + Local` sprawdza też, czy dany host Ollama jest zalogowany do dostępu cloud.
    - Więcej szczegółów: [Ollama](/pl/providers/ollama)
    - **Klucz API**: zapisuje klucz za Ciebie.
    - **Vercel AI Gateway (wielomodelowe proxy)**: prosi o `AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: prosi o Account ID, Gateway ID i `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Więcej szczegółów: [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfiguracja jest zapisywana automatycznie; domyślny model hostowany to `MiniMax-M2.7`.
      Konfiguracja z kluczem API używa `minimax/...`, a konfiguracja OAuth używa
      `minimax-portal/...`.
    - Więcej szczegółów: [MiniMax](/pl/providers/minimax)
    - **StepFun**: konfiguracja jest zapisywana automatycznie dla StepFun standard albo Step Plan na endpointach China albo global.
    - Standard obejmuje obecnie `step-3.5-flash`, a Step Plan obejmuje także `step-3.5-flash-2603`.
    - Więcej szczegółów: [StepFun](/pl/providers/stepfun)
    - **Synthetic (zgodny z Anthropic)**: prosi o `SYNTHETIC_API_KEY`.
    - Więcej szczegółów: [Synthetic](/pl/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfiguracja jest zapisywana automatycznie.
    - **Kimi Coding**: konfiguracja jest zapisywana automatycznie.
    - Więcej szczegółów: [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
    - **Skip**: na razie nie konfiguruje auth.
    - Wybierz model domyślny spośród wykrytych opcji (albo wpisz provider/model ręcznie). Dla najlepszej jakości i mniejszego ryzyka prompt injection wybierz najsilniejszy model najnowszej generacji dostępny w Twoim stosie providerów.
    - Onboarding uruchamia sprawdzenie modelu i ostrzega, jeśli skonfigurowany model jest nieznany albo brakuje auth.
    - Tryb przechowywania kluczy API domyślnie używa wartości plaintext w profilach auth. Użyj `--secret-input-mode ref`, aby zapisywać zamiast tego refy oparte na env (na przykład `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Profile auth znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (klucze API + OAuth). `~/.openclaw/credentials/oauth.json` jest starszym źródłem tylko do importu.
    - Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)
    <Note>
    Wskazówka dla środowisk headless/server: ukończ OAuth na maszynie z przeglądarką, a potem skopiuj
    `auth-profiles.json` tego agenta (na przykład
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` albo odpowiadającą
    ścieżkę `$OPENCLAW_STATE_DIR/...`) na host gateway. `credentials/oauth.json`
    jest tylko starszym źródłem importu.
    </Note>
  </Step>
  <Step title="Workspace">
    - Domyślnie `~/.openclaw/workspace` (konfigurowalne).
    - Inicjalizuje pliki workspace potrzebne do rytuału bootstrap agenta.
    - Pełny układ workspace + przewodnik po kopiach zapasowych: [Workspace agenta](/pl/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, tryb auth, ekspozycja Tailscale.
    - Zalecenie dotyczące auth: zachowaj **Token** nawet dla loopback, aby lokalni klienty WS musieli się uwierzytelniać.
    - W trybie tokena interaktywna konfiguracja oferuje:
      - **Generate/store plaintext token** (domyślnie)
      - **Use SecretRef** (opt-in)
      - Quickstart ponownie używa istniejących SecretRef `gateway.auth.token` dla providerów `env`, `file` i `exec` na potrzeby sondy onboarding/dashboard bootstrap.
      - Jeśli ten SecretRef jest skonfigurowany, ale nie można go rozwiązać, onboarding kończy się wcześnie z jasnym komunikatem naprawczym zamiast po cichu osłabiać auth w runtime.
    - W trybie hasła interaktywna konfiguracja również obsługuje przechowywanie w plaintext albo przez SecretRef.
    - Ścieżka SecretRef tokena w trybie nieinteraktywnym: `--gateway-token-ref-env <ENV_VAR>`.
      - Wymaga niepustej zmiennej env w środowisku procesu onboardingu.
      - Nie można łączyć z `--gateway-token`.
    - Wyłącz auth tylko wtedy, gdy w pełni ufasz każdemu lokalnemu procesowi.
    - Bindy inne niż loopback nadal wymagają auth.
  </Step>
  <Step title="Kanały">
    - [WhatsApp](/pl/channels/whatsapp): opcjonalne logowanie przez QR.
    - [Telegram](/pl/channels/telegram): token bota.
    - [Discord](/pl/channels/discord): token bota.
    - [Google Chat](/pl/channels/googlechat): JSON konta usługi + webhook audience.
    - [Mattermost](/pl/channels/mattermost) (Plugin): token bota + base URL.
    - [Signal](/pl/channels/signal): opcjonalna instalacja `signal-cli` + konfiguracja konta.
    - [BlueBubbles](/pl/channels/bluebubbles): **zalecane dla iMessage**; URL serwera + hasło + Webhook.
    - [iMessage](/pl/channels/imessage): starsza ścieżka CLI `imsg` + dostęp do bazy danych.
    - Bezpieczeństwo DM: domyślnie używane jest parowanie. Pierwszy DM wysyła kod; zatwierdź przez `openclaw pairing approve <channel> <code>` albo użyj allowlist.
  </Step>
  <Step title="Wyszukiwanie w sieci">
    - Wybierz obsługiwanego providera, takiego jak Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG albo Tavily (lub pomiń).
    - Providerzy oparci na API mogą używać zmiennych env albo istniejącej konfiguracji do szybkiej konfiguracji; providerzy bez kluczy używają swoich wymagań wstępnych specyficznych dla providera.
    - Pomiń przez `--skip-search`.
    - Skonfiguruj później: `openclaw configure --section web`.
  </Step>
  <Step title="Instalacja daemon">
    - macOS: LaunchAgent
      - Wymaga zalogowanej sesji użytkownika; dla trybu headless użyj własnego LaunchDaemon (nie jest dostarczany).
    - Linux (oraz Windows przez WSL2): jednostka systemd użytkownika
      - Onboarding próbuje włączyć lingering przez `loginctl enable-linger <user>`, aby Gateway pozostawał uruchomiony po wylogowaniu.
      - Może poprosić o sudo (zapisuje do `/var/lib/systemd/linger`); najpierw próbuje bez sudo.
    - **Wybór runtime:** Node (zalecane; wymagane dla WhatsApp/Telegram). Bun jest **niezalecany**.
    - Jeśli auth tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, instalacja daemon go waliduje, ale nie utrwala rozwiązanych wartości tokena plaintext w metadanych środowiska usługi nadzorującej.
    - Jeśli auth tokenem wymaga tokena, a skonfigurowany token SecretRef jest nierozwiązany, instalacja daemon jest blokowana z instrukcją naprawczą.
    - Jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja daemon jest blokowana, dopóki tryb nie zostanie ustawiony jawnie.
  </Step>
  <Step title="Sprawdzenie stanu">
    - Uruchamia Gateway (jeśli trzeba) i wykonuje `openclaw health`.
    - Wskazówka: `openclaw status --deep` dodaje sondę stanu aktywnego gateway do wyjścia statusu, w tym sondy kanałów, gdy są obsługiwane (wymaga osiągalnego gateway).
  </Step>
  <Step title="Skills (zalecane)">
    - Odczytuje dostępne Skills i sprawdza wymagania.
    - Pozwala wybrać menedżer Node: **npm / pnpm** (bun niezalecany).
    - Instaluje opcjonalne zależności (niektóre używają Homebrew na macOS).
  </Step>
  <Step title="Zakończenie">
    - Podsumowanie + kolejne kroki, w tym aplikacje iOS/Android/macOS dla dodatkowych funkcji.
  </Step>
</Steps>

<Note>
Jeśli nie wykryto GUI, onboarding wypisuje instrukcje przekierowania portu SSH dla Control UI zamiast otwierać przeglądarkę.
Jeśli brakuje zasobów Control UI, onboarding próbuje je zbudować; fallback to `pnpm ui:build` (automatycznie instaluje zależności UI).
</Note>

## Tryb nieinteraktywny

Użyj `--non-interactive`, aby zautomatyzować albo oskryptować onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Dodaj `--json`, aby uzyskać podsumowanie czytelne maszynowo.

Gateway token SecretRef w trybie nieinteraktywnym:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.

<Note>
`--json` **nie** implikuje trybu nieinteraktywnego. W skryptach używaj `--non-interactive` (oraz `--workspace`).
</Note>

Przykłady poleceń specyficznych dla providerów znajdują się w [Automatyzacja CLI](/pl/start/wizard-cli-automation#provider-specific-examples).
Używaj tej strony dokumentacji dla semantyki flag i kolejności kroków.

### Dodawanie agenta (tryb nieinteraktywny)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC kreatora Gateway

Gateway udostępnia przepływ onboardingu przez RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klienty (aplikacja macOS, Control UI) mogą renderować kroki bez ponownej implementacji logiki onboardingu.

## Konfiguracja Signal (`signal-cli`)

Onboarding może instalować `signal-cli` z wydań GitHub:

- Pobiera odpowiedni zasób wydania.
- Przechowuje go w `~/.openclaw/tools/signal-cli/<version>/`.
- Zapisuje `channels.signal.cliPath` do konfiguracji.

Uwagi:

- Buildy JVM wymagają **Java 21**.
- Tam, gdzie są dostępne, używane są buildy natywne.
- Windows używa WSL2; instalacja `signal-cli` przebiega według ścieżki Linux wewnątrz WSL.

## Co zapisuje kreator

Typowe pola w `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jeśli wybrano MiniMax)
- `tools.profile` (lokalny onboarding domyślnie ustawia `"coding"`, gdy pole nie jest ustawione; istniejące jawne wartości są zachowywane)
- `gateway.*` (tryb, bind, auth, Tailscale)
- `session.dmScope` (szczegóły zachowania: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlisty kanałów (Slack/Discord/Matrix/Microsoft Teams), gdy wykonasz opt-in podczas promptów (nazwy są rozwiązywane do identyfikatorów, gdy to możliwe).
- `skills.install.nodeManager`
  - `setup --node-manager` akceptuje `npm`, `pnpm` albo `bun`.
  - Konfiguracja ręczna nadal może używać `yarn` przez bezpośrednie ustawienie `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` zapisuje `agents.list[]` oraz opcjonalne `bindings`.

Poświadczenia WhatsApp trafiają do `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesje są przechowywane w `~/.openclaw/agents/<agentId>/sessions/`.

Niektóre kanały są dostarczane jako Pluginy. Gdy wybierzesz taki kanał podczas konfiguracji, onboarding
poprosi o jego instalację (npm albo lokalna ścieżka), zanim będzie można go skonfigurować.

## Powiązana dokumentacja

- Przegląd onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Onboarding aplikacji macOS: [Onboarding](/pl/start/onboarding)
- Dokumentacja konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration)
- Providerzy: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord), [Google Chat](/pl/channels/googlechat), [Signal](/pl/channels/signal), [BlueBubbles](/pl/channels/bluebubbles) (iMessage), [iMessage](/pl/channels/imessage) (starsze)
- Skills: [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config)
