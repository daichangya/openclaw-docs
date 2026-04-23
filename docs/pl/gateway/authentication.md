---
read_when:
    - Debugowanie uwierzytelniania modelu lub wygaśnięcia OAuth
    - Dokumentowanie uwierzytelniania lub przechowywania poświadczeń
summary: 'Uwierzytelnianie modeli: OAuth, klucze API, ponowne użycie Claude CLI oraz token konfiguracji Anthropic'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-04-23T14:55:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# Uwierzytelnianie (dostawcy modeli)

<Note>
Ta strona dotyczy uwierzytelniania **dostawcy modeli** (klucze API, OAuth, ponowne użycie Claude CLI oraz token konfiguracji Anthropic). Informacje o uwierzytelnianiu **połączenia z Gateway** (token, hasło, trusted-proxy) znajdziesz w [Configuration](/pl/gateway/configuration) oraz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dla dostawców modeli. W przypadku hostów Gateway działających stale klucze API są zwykle najbardziej przewidywalną opcją. Obsługiwane są również przepływy subskrypcji/OAuth, gdy pasują do modelu konta u dostawcy.

Pełny przebieg OAuth i układ przechowywania opisano w [/concepts/oauth](/pl/concepts/oauth).
Informacje o uwierzytelnianiu opartym na SecretRef (dostawcy `env`/`file`/`exec`) znajdziesz w [Secrets Management](/pl/gateway/secrets).
Informacje o zasadach kwalifikowalności poświadczeń i kodach przyczyn używanych przez `models status --probe` znajdziesz w
[Auth Credential Semantics](/pl/auth-credential-semantics).

## Zalecana konfiguracja (klucz API, dowolny dostawca)

Jeśli uruchamiasz długo działający Gateway, zacznij od klucza API dla wybranego
dostawcy.
W przypadku Anthropic uwierzytelnianie kluczem API nadal jest najbardziej przewidywalną konfiguracją serwerową, ale OpenClaw obsługuje też ponowne użycie lokalnego logowania Claude CLI.

1. Utwórz klucz API w konsoli dostawcy.
2. Umieść go na **hoście Gateway** (maszynie uruchamiającej `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jeśli Gateway działa pod systemd/launchd, najlepiej umieścić klucz w
   `~/.openclaw/.env`, aby demon mógł go odczytać:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Następnie uruchom ponownie demona (lub proces Gateway) i sprawdź ponownie:

```bash
openclaw models status
openclaw doctor
```

Jeśli wolisz nie zarządzać samodzielnie zmiennymi środowiskowymi, onboarding może zapisać
klucze API do użycia przez demona: `openclaw onboard`.

Szczegóły dotyczące dziedziczenia środowiska (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) znajdziesz w [Help](/pl/help).

## Anthropic: zgodność Claude CLI i tokenów

Uwierzytelnianie tokenem konfiguracji Anthropic jest nadal dostępne w OpenClaw jako obsługiwana ścieżka tokenu. Zespół Anthropic poinformował nas później, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI oraz użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową politykę. Gdy ponowne użycie Claude CLI jest dostępne na hoście, jest to obecnie preferowana ścieżka.

W przypadku długo działających hostów Gateway klucz API Anthropic nadal jest najbardziej przewidywalną konfiguracją. Jeśli chcesz ponownie użyć istniejącego logowania Claude na tym samym hoście, użyj ścieżki Anthropic Claude CLI w onboarding/configure.

Zalecana konfiguracja hosta do ponownego użycia Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Jest to konfiguracja dwuetapowa:

1. Zaloguj samo Claude Code do Anthropic na hoście Gateway.
2. Powiedz OpenClaw, aby przełączył wybór modelu Anthropic na lokalny backend `claude-cli`
   i zapisał odpowiadający mu profil uwierzytelniania OpenClaw.

Jeśli `claude` nie jest w `PATH`, najpierw zainstaluj Claude Code albo ustaw
`agents.defaults.cliBackends.claude-cli.command` na rzeczywistą ścieżkę do pliku binarnego.

Ręczne wklejenie tokenu (dowolny dostawca; zapisuje `auth-profiles.json` + aktualizuje konfigurację):

```bash
openclaw models auth paste-token --provider openrouter
```

Odwołania do profili uwierzytelniania są też obsługiwane dla statycznych poświadczeń:

- poświadczenia `api_key` mogą używać `keyRef: { source, provider, id }`
- poświadczenia `token` mogą używać `tokenRef: { source, provider, id }`
- Profile w trybie OAuth nie obsługują poświadczeń SecretRef; jeśli dla `auth.profiles.<id>.mode` ustawiono `"oauth"`, dane wejściowe `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu są odrzucane.

Kontrola przyjazna automatyzacji (kod wyjścia `1`, gdy brak/wygaśnięcie, `2`, gdy wkrótce wygaśnie):

```bash
openclaw models status --check
```

Aktywne sondy uwierzytelniania:

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze sondy mogą pochodzić z profili uwierzytelniania, poświadczeń środowiskowych lub `models.json`.
- Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda zgłasza
  dla tego profilu `excluded_by_auth_order` zamiast próbować go użyć.
- Jeśli uwierzytelnianie istnieje, ale OpenClaw nie może ustalić kandydata modelu nadającego się do sondowania dla tego dostawcy, sonda zgłasza `status: no_model`.
- Okresy ochłodzenia limitów szybkości mogą być przypisane do modelu. Profil objęty okresem ochłodzenia dla jednego
  modelu może nadal nadawać się do użycia dla pokrewnego modelu u tego samego dostawcy.

Opcjonalne skrypty operacyjne (systemd/Termux) są opisane tutaj:
[Skrypty monitorowania uwierzytelniania](/pl/help/scripts#auth-monitoring-scripts)

## Uwaga dotycząca Anthropic

Backend Anthropic `claude-cli` jest ponownie obsługiwany.

- Zespół Anthropic poinformował nas, że ta ścieżka integracji OpenClaw jest znów dozwolona.
- Dlatego OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako usankcjonowane
  dla uruchomień opartych na Anthropic, chyba że Anthropic opublikuje nową politykę.
- Klucze API Anthropic pozostają najbardziej przewidywalnym wyborem dla długo działających hostów Gateway
  oraz dla jawnej kontroli rozliczeń po stronie serwera.

## Sprawdzanie stanu uwierzytelniania modelu

```bash
openclaw models status
openclaw doctor
```

## Zachowanie podczas rotacji kluczy API (Gateway)

Niektórzy dostawcy obsługują ponawianie żądania z alternatywnymi kluczami, gdy wywołanie API
trafi na limit szybkości po stronie dostawcy.

- Kolejność priorytetów:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Dostawcy Google uwzględniają też `GOOGLE_API_KEY` jako dodatkowy mechanizm awaryjny.
- Ta sama lista kluczy jest przed użyciem deduplikowana.
- OpenClaw ponawia próbę z następnym kluczem tylko przy błędach limitu szybkości (na przykład
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` lub
  `workers_ai ... quota limit exceeded`).
- Błędy inne niż limit szybkości nie są ponawiane z alternatywnymi kluczami.
- Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Sterowanie używanym poświadczeniem

### Dla sesji (komenda czatu)

Użyj `/model <alias-or-id>@<profileId>`, aby przypiąć konkretne poświadczenie dostawcy dla bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).

Użyj `/model` (lub `/model list`) dla zwartego selektora; użyj `/model status` dla pełnego widoku (kandydaci + następny profil uwierzytelniania oraz szczegóły endpointu dostawcy, jeśli są skonfigurowane).

### Dla agenta (nadpisanie CLI)

Ustaw jawne nadpisanie kolejności profili uwierzytelniania dla agenta (zapisywane w `auth-state.json` tego agenta):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby wskazać konkretnego agenta; pomiń tę opcję, aby użyć skonfigurowanego domyślnego agenta.
Podczas debugowania problemów z kolejnością `openclaw models status --probe` pokazuje pominięte
zapisane profile jako `excluded_by_auth_order` zamiast pomijać je po cichu.
Podczas debugowania problemów z okresem ochłodzenia pamiętaj, że okresy ochłodzenia limitów szybkości mogą być powiązane
z jednym identyfikatorem modelu, a nie z całym profilem dostawcy.

## Rozwiązywanie problemów

### „Nie znaleziono poświadczeń”

Jeśli brakuje profilu Anthropic, skonfiguruj klucz API Anthropic na
**hoście Gateway** albo skonfiguruj ścieżkę tokenu konfiguracji Anthropic, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wkrótce wygasa/wygasł

Uruchom `openclaw models status`, aby potwierdzić, który profil wkrótce wygaśnie. Jeśli profil tokenu
Anthropic nie istnieje lub wygasł, odśwież tę konfigurację przez
token konfiguracji albo przejdź na klucz API Anthropic.
