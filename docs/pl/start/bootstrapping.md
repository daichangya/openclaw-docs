---
read_when:
    - Zrozumienie, co dzieje się przy pierwszym uruchomieniu agenta
    - Wyjaśnianie, gdzie znajdują się pliki bootstrapowania
    - Debugowanie konfiguracji tożsamości podczas wdrażania
sidebarTitle: Bootstrapping
summary: Rytuał bootstrapowania agenta, który inicjuje obszar roboczy i pliki tożsamości
title: Bootstrapowanie agenta
x-i18n:
    generated_at: "2026-04-25T13:58:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

Bootstrapowanie to rytuał **pierwszego uruchomienia**, który przygotowuje obszar roboczy agenta i
zbiera szczegóły tożsamości. Dzieje się po wdrożeniu, gdy agent uruchamia się
po raz pierwszy.

## Co robi bootstrapowanie

Przy pierwszym uruchomieniu agenta OpenClaw bootstrapuje obszar roboczy (domyślnie
`~/.openclaw/workspace`):

- Inicjuje `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Uruchamia krótki rytuał pytań i odpowiedzi (po jednym pytaniu naraz).
- Zapisuje tożsamość i preferencje do `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Usuwa `BOOTSTRAP.md` po zakończeniu, aby uruchamiał się tylko raz.

## Pomijanie bootstrapowania

Aby pominąć ten krok dla wstępnie przygotowanego obszaru roboczego, uruchom `openclaw onboard --skip-bootstrap`.

## Gdzie jest uruchamiane

Bootstrapowanie zawsze działa na **hoście Gateway**. Jeśli aplikacja macOS łączy się z
zdalnym Gateway, obszar roboczy i pliki bootstrapowania znajdują się na tej zdalnej
maszynie.

<Note>
Gdy Gateway działa na innej maszynie, edytuj pliki obszaru roboczego na hoście gateway
(na przykład `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Powiązane dokumenty

- Wdrażanie aplikacji macOS: [Wdrażanie](/pl/start/onboarding)
- Układ obszaru roboczego: [Obszar roboczy agenta](/pl/concepts/agent-workspace)
