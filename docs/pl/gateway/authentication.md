---
read_when:
    - Debugowanie uwierzytelniania modelu lub wygaśnięcia OAuth
    - Dokumentowanie uwierzytelniania lub przechowywania poświadczeń
summary: 'Uwierzytelnianie modelu: OAuth, klucze API, ponowne użycie Claude CLI i token konfiguracji Anthropic'
title: Uwierzytelnianie
x-i18n:
    generated_at: "2026-04-25T13:46:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
Ta strona opisuje uwierzytelnianie **dostawcy modelu** (klucze API, OAuth, ponowne użycie Claude CLI i token konfiguracji Anthropic). Informacje o uwierzytelnianiu **połączenia Gateway** (token, hasło, trusted-proxy) znajdziesz w [Configuration](/pl/gateway/configuration) i [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth).
</Note>

OpenClaw obsługuje OAuth i klucze API dla dostawców modeli. W przypadku hostów gateway działających stale
klucze API są zwykle najbardziej przewidywalną opcją. Obsługiwane są również przepływy subskrypcyjne/OAuth,
gdy pasują do modelu konta Twojego dostawcy.

Zobacz [/concepts/oauth](/pl/concepts/oauth), aby poznać pełny przepływ OAuth i układ
przechowywania.
Informacje o uwierzytelnianiu opartym na SecretRef (`env`/`file`/`exec` providers) znajdziesz w [Secrets Management](/pl/gateway/secrets).
Informacje o regułach kwalifikowalności poświadczeń/kodów przyczyn używanych przez `models status --probe` znajdziesz w
[Auth Credential Semantics](/pl/auth-credential-semantics).

## Zalecana konfiguracja (klucz API, dowolny dostawca)

Jeśli uruchamiasz gateway działający długoterminowo, zacznij od klucza API dla wybranego
dostawcy.
W przypadku Anthropic uwierzytelnianie kluczem API nadal jest najbardziej przewidywalną konfiguracją serwerową,
ale OpenClaw obsługuje też ponowne użycie lokalnego logowania Claude CLI.

1. Utwórz klucz API w konsoli dostawcy.
2. Umieść go na **hoście gateway** (maszynie uruchamiającej `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jeśli Gateway działa pod systemd/launchd, umieść klucz najlepiej w
   `~/.openclaw/.env`, aby demon mógł go odczytać:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Następnie uruchom ponownie demona (albo zrestartuj proces Gateway) i sprawdź ponownie:

```bash
openclaw models status
openclaw doctor
```

Jeśli wolisz samodzielnie nie zarządzać zmiennymi env, onboarding może zapisać
klucze API do użycia przez demon: `openclaw onboard`.

Szczegóły dotyczące dziedziczenia env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) znajdziesz w [Help](/pl/help).

## Anthropic: zgodność Claude CLI i tokenów

Uwierzytelnianie tokenem konfiguracji Anthropic jest nadal dostępne w OpenClaw jako obsługiwana ścieżka
tokenu. Pracownicy Anthropic poinformowali nas później, że użycie Claude CLI w stylu OpenClaw jest
ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako
zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę. Gdy
ponowne użycie Claude CLI jest dostępne na hoście, jest to obecnie preferowana ścieżka.

W przypadku długoterminowych hostów gateway klucz API Anthropic nadal jest najbardziej przewidywalną
konfiguracją. Jeśli chcesz ponownie użyć istniejącego logowania Claude na tym samym hoście, użyj
ścieżki Anthropic Claude CLI w onboard/configure.

Zalecana konfiguracja hosta do ponownego użycia Claude CLI:

```bash
# Uruchom na hoście gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Jest to konfiguracja dwuetapowa:

1. Zaloguj samo Claude Code do Anthropic na hoście gateway.
2. Powiedz OpenClaw, aby przełączył wybór modelu Anthropic na lokalny backend `claude-cli`
   i zapisał pasujący profil uwierzytelniania OpenClaw.

Jeśli `claude` nie znajduje się w `PATH`, najpierw zainstaluj Claude Code albo ustaw
`agents.defaults.cliBackends.claude-cli.command` na rzeczywistą ścieżkę do pliku binarnego.

Ręczne wklejanie tokena (dowolny dostawca; zapisuje `auth-profiles.json` i aktualizuje config):

```bash
openclaw models auth paste-token --provider openrouter
```

Obsługiwane są również odwołania do profilu uwierzytelniania dla statycznych poświadczeń:

- poświadczenia `api_key` mogą używać `keyRef: { source, provider, id }`
- poświadczenia `token` mogą używać `tokenRef: { source, provider, id }`
- profile w trybie OAuth nie obsługują poświadczeń SecretRef; jeśli `auth.profiles.<id>.mode` jest ustawione na `"oauth"`, wejście `keyRef`/`tokenRef` oparte na SecretRef dla tego profilu jest odrzucane.

Kontrola przyjazna automatyzacji (kod zakończenia `1`, gdy wygasło/brakuje, `2`, gdy wygasa):

```bash
openclaw models status --check
```

Aktywne sondy uwierzytelniania:

```bash
openclaw models status --probe
```

Uwagi:

- Wiersze sond mogą pochodzić z profili uwierzytelniania, poświadczeń env lub `models.json`.
- Jeśli jawne `auth.order.<provider>` pomija zapisany profil, sonda raportuje
  `excluded_by_auth_order` dla tego profilu zamiast go próbować.
- Jeśli uwierzytelnianie istnieje, ale OpenClaw nie może rozwiązać kandydata modelu możliwego do sondowania dla
  tego dostawcy, sonda raportuje `status: no_model`.
- Okresy chłodzenia limitów szybkości mogą być przypisane do modelu. Profil objęty okresem chłodzenia dla jednego
  modelu może nadal nadawać się do użycia dla pokrewnego modelu u tego samego dostawcy.

Opcjonalne skrypty operacyjne (systemd/Termux) są opisane tutaj:
[Auth monitoring scripts](/pl/help/scripts#auth-monitoring-scripts)

## Uwaga dotycząca Anthropic

Backend Anthropic `claude-cli` jest ponownie obsługiwany.

- Pracownicy Anthropic poinformowali nas, że ta ścieżka integracji OpenClaw jest ponownie dozwolona.
- Dlatego OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone
  dla uruchomień opartych na Anthropic, chyba że Anthropic opublikuje nową politykę.
- Klucze API Anthropic pozostają najbardziej przewidywalnym wyborem dla długoterminowych hostów gateway
  i jawnej kontroli rozliczeń po stronie serwera.

## Sprawdzanie stanu uwierzytelniania modelu

```bash
openclaw models status
openclaw doctor
```

## Zachowanie rotacji kluczy API (gateway)

Niektórzy dostawcy obsługują ponawianie żądania z alternatywnymi kluczami, gdy wywołanie API
napotka limit szybkości po stronie dostawcy.

- Kolejność priorytetów:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Dostawcy Google uwzględniają też `GOOGLE_API_KEY` jako dodatkową wartość zapasową.
- Ta sama lista kluczy jest deduplikowana przed użyciem.
- OpenClaw ponawia z następnym kluczem tylko przy błędach limitu szybkości (na przykład
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` lub
  `workers_ai ... quota limit exceeded`).
- Błędy inne niż limity szybkości nie są ponawiane z alternatywnymi kluczami.
- Jeśli wszystkie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Kontrolowanie, które poświadczenie jest używane

### Dla sesji (polecenie czatu)

Użyj `/model <alias-or-id>@<profileId>`, aby przypiąć określone poświadczenie dostawcy dla bieżącej sesji (przykładowe identyfikatory profili: `anthropic:default`, `anthropic:work`).

Użyj `/model` (albo `/model list`) dla kompaktowego selektora; użyj `/model status` dla pełnego widoku (kandydaci + następny profil uwierzytelniania oraz szczegóły endpointu dostawcy, jeśli skonfigurowano).

### Dla agenta (nadpisanie CLI)

Ustaw jawne nadpisanie kolejności profilu uwierzytelniania dla agenta (zapisywane w `auth-state.json` tego agenta):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Użyj `--agent <id>`, aby wskazać konkretnego agenta; pomiń tę opcję, aby użyć skonfigurowanego agenta domyślnego.
Podczas debugowania problemów z kolejnością `openclaw models status --probe` pokazuje pominięte
zapisane profile jako `excluded_by_auth_order` zamiast cicho je pomijać.
Podczas debugowania problemów z okresem chłodzenia pamiętaj, że okresy chłodzenia limitu szybkości mogą być powiązane
z jednym identyfikatorem modelu, a nie z całym profilem dostawcy.

## Rozwiązywanie problemów

### „Nie znaleziono poświadczeń”

Jeśli brakuje profilu Anthropic, skonfiguruj klucz API Anthropic na
**hoście gateway** albo skonfiguruj ścieżkę tokena konfiguracji Anthropic, a następnie sprawdź ponownie:

```bash
openclaw models status
```

### Token wygasa/wygasł

Uruchom `openclaw models status`, aby potwierdzić, który profil wygasa. Jeśli
profil tokena Anthropic nie istnieje lub wygasł, odśwież tę konfigurację przez
token konfiguracji albo przejdź na klucz API Anthropic.

## Powiązane

- [Secrets management](/pl/gateway/secrets)
- [Dostęp zdalny](/pl/gateway/remote)
- [Przechowywanie uwierzytelniania](/pl/concepts/oauth)
