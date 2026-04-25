---
read_when:
    - Chcesz zrozumieć OpenClaw OAuth end-to-end
    - Napotkałeś problemy z unieważnianiem tokenów / wylogowaniem
    - Chcesz przepływy uwierzytelniania Claude CLI lub OAuth
    - Chcesz wiele kont lub routing profili
summary: 'OAuth w OpenClaw: wymiana tokenów, przechowywanie i wzorce wielu kont'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:45:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw obsługuje „subscription auth” przez OAuth dla dostawców, którzy to oferują
(w szczególności **OpenAI Codex (ChatGPT OAuth)**). W przypadku Anthropic praktyczny podział
wygląda teraz tak:

- **Klucz API Anthropic**: standardowe rozliczanie API Anthropic
- **Anthropic Claude CLI / subscription auth wewnątrz OpenClaw**: pracownicy Anthropic
  powiedzieli nam, że takie użycie jest znowu dozwolone

OpenAI Codex OAuth jest jawnie obsługiwany do użycia w zewnętrznych narzędziach, takich jak
OpenClaw. Ta strona wyjaśnia:

W przypadku Anthropic w środowisku produkcyjnym bezpieczniejszą zalecaną ścieżką pozostaje
uwierzytelnianie kluczem API.

- jak działa **wymiana tokenów** OAuth (PKCE)
- gdzie tokeny są **przechowywane** (i dlaczego)
- jak obsługiwać **wiele kont** (profile + nadpisania per sesja)

OpenClaw obsługuje także **Pluginy dostawców**, które dostarczają własne przepływy OAuth lub
oparte na kluczach API. Uruchamiaj je przez:

```bash
openclaw models auth login --provider <id>
```

## Token sink (dlaczego istnieje)

Dostawcy OAuth często wystawiają **nowy refresh token** podczas logowania lub odświeżania. Niektórzy dostawcy (lub klienci OAuth) mogą unieważniać starsze refresh tokeny, gdy dla tej samej aplikacji/użytkownika zostanie wydany nowy.

Praktyczny objaw:

- logujesz się przez OpenClaw _i_ przez Claude Code / Codex CLI → jedno z nich losowo zostaje później „wylogowane”

Aby to ograniczyć, OpenClaw traktuje `auth-profiles.json` jako **token sink**:

- środowisko wykonawcze odczytuje poświadczenia z **jednego miejsca**
- możemy utrzymywać wiele profili i routować je deterministycznie
- ponowne użycie zewnętrznego CLI zależy od dostawcy: Codex CLI może zainicjalizować pusty
  profil `openai-codex:default`, ale gdy OpenClaw ma już lokalny profil OAuth,
  lokalny refresh token jest kanoniczny; inne integracje mogą pozostać
  zarządzane zewnętrznie i ponownie odczytywać swój magazyn uwierzytelniania CLI

## Przechowywanie (gdzie żyją tokeny)

Sekrety są przechowywane **per agent**:

- Profile uwierzytelniania (OAuth + klucze API + opcjonalne odwołania na poziomie wartości): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Plik zgodności starszego typu: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statyczne wpisy `api_key` są czyszczone po wykryciu)

Starszy plik tylko do importu (nadal obsługiwany, ale nie jest głównym magazynem):

- `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu)

Wszystkie powyższe lokalizacje respektują także `$OPENCLAW_STATE_DIR` (nadpisanie katalogu stanu). Pełna dokumentacja: [/gateway/configuration](/pl/gateway/configuration-reference#auth-storage)

Informacje o statycznych SecretRef i zachowaniu aktywacji migawek w środowisku wykonawczym znajdziesz w [Secrets Management](/pl/gateway/secrets).

## Zgodność ze starszym tokenem Anthropic

<Warning>
Publiczna dokumentacja Claude Code od Anthropic mówi, że bezpośrednie użycie Claude Code mieści się w
limitach subskrypcji Claude, a pracownicy Anthropic powiedzieli nam, że użycie Claude
CLI w stylu OpenClaw jest znowu dozwolone. OpenClaw traktuje więc ponowne użycie Claude CLI i
użycie `claude -p` jako autoryzowane dla tej integracji, dopóki Anthropic
nie opublikuje nowej polityki.

Aktualną dokumentację planów Anthropic dla bezpośredniego użycia Claude Code znajdziesz w [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
oraz [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jeśli chcesz innych opcji typu subscription w OpenClaw, zobacz [OpenAI
Codex](/pl/providers/openai), [Qwen Cloud Coding
Plan](/pl/providers/qwen), [MiniMax Coding Plan](/pl/providers/minimax),
oraz [Z.AI / GLM Coding Plan](/pl/providers/glm).
</Warning>

OpenClaw udostępnia także setup-token Anthropic jako obsługiwaną ścieżkę uwierzytelniania tokenem, ale obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

## Migracja Anthropic Claude CLI

OpenClaw ponownie obsługuje ponowne użycie Anthropic Claude CLI. Jeśli masz już lokalne
logowanie Claude na hoście, onboarding/configure może użyć go bezpośrednio.

## Wymiana OAuth (jak działa logowanie)

Interaktywne przepływy logowania OpenClaw są zaimplementowane w `@mariozechner/pi-ai` i podłączone do kreatorów/poleceń.

### Setup-token Anthropic

Kształt przepływu:

1. uruchom setup-token Anthropic lub wklejanie tokenu z OpenClaw
2. OpenClaw zapisuje uzyskane poświadczenie Anthropic w profilu uwierzytelniania
3. wybór modelu pozostaje na `anthropic/...`
4. istniejące profile uwierzytelniania Anthropic pozostają dostępne dla rollbacku/kontroli kolejności

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth jest jawnie obsługiwany do użycia poza Codex CLI, w tym w przepływach OpenClaw.

Kształt przepływu (PKCE):

1. wygeneruj weryfikator/challenge PKCE + losowy `state`
2. otwórz `https://auth.openai.com/oauth/authorize?...`
3. spróbuj przechwycić callback na `http://127.0.0.1:1455/auth/callback`
4. jeśli callback nie może się zbindować (albo pracujesz zdalnie/bezobsługowo), wklej URL przekierowania/kod
5. wykonaj wymianę na `https://auth.openai.com/oauth/token`
6. wyodrębnij `accountId` z tokenu dostępu i zapisz `{ access, refresh, expires, accountId }`

Ścieżka kreatora to `openclaw onboard` → wybór uwierzytelniania `openai-codex`.

## Odświeżanie i wygaśnięcie

Profile przechowują znacznik czasu `expires`.

W środowisku wykonawczym:

- jeśli `expires` jest w przyszłości → użyj zapisanego tokenu dostępu
- jeśli wygasł → odśwież (pod blokadą pliku) i nadpisz zapisane poświadczenia
- wyjątek: niektóre poświadczenia zewnętrznego CLI pozostają zarządzane zewnętrznie; OpenClaw
  ponownie odczytuje te magazyny uwierzytelniania CLI zamiast zużywać skopiowane refresh tokeny.
  Bootstrap Codex CLI jest celowo węższy: inicjalizuje pusty
  profil `openai-codex:default`, a następnie odświeżenia należące do OpenClaw utrzymują lokalny
  profil jako kanoniczny.

Przepływ odświeżania jest automatyczny; zazwyczaj nie musisz ręcznie zarządzać tokenami.

## Wiele kont (profile) + routing

Dwa wzorce:

### 1) Preferowane: oddzielni agenci

Jeśli chcesz, aby „personal” i „work” nigdy nie wchodziły ze sobą w interakcję, użyj izolowanych agentów (oddzielne sesje + poświadczenia + obszar roboczy):

```bash
openclaw agents add work
openclaw agents add personal
```

Następnie skonfiguruj uwierzytelnianie per agent (kreator) i kieruj czaty do właściwego agenta.

### 2) Zaawansowane: wiele profili w jednym agencie

`auth-profiles.json` obsługuje wiele identyfikatorów profili dla tego samego dostawcy.

Wybór profilu odbywa się:

- globalnie przez kolejność w konfiguracji (`auth.order`)
- per sesja przez `/model ...@<profileId>`

Przykład (nadpisanie sesji):

- `/model Opus@anthropic:work`

Jak sprawdzić, jakie identyfikatory profili istnieją:

- `openclaw channels list --json` (pokazuje `auth[]`)

Powiązana dokumentacja:

- [Model failover](/pl/concepts/model-failover) (reguły rotacji + cooldown)
- [Slash commands](/pl/tools/slash-commands) (powierzchnia poleceń)

## Powiązane

- [Authentication](/pl/gateway/authentication) — przegląd uwierzytelniania dostawców modeli
- [Secrets](/pl/gateway/secrets) — przechowywanie poświadczeń i SecretRef
- [Configuration Reference](/pl/gateway/configuration-reference#auth-storage) — klucze konfiguracji uwierzytelniania
