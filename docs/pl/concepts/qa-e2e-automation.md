---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA wspieranych przez repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: Prywatna struktura automatyzacji QA dla qa-lab, qa-channel, scenariuszy seed i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-08T02:14:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4aa5acc8e77303f4045d4f04372494cae21b89d2fdaba856dbb4855ced9d27
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatyzacja QA E2E

Prywatny stos QA ma na celu testowanie OpenClaw w bardziej realistyczny,
kanałowy sposób niż może to zrobić pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `qa/`: zasoby seed wspierane przez repozytorium dla zadania startowego i bazowych
  scenariuszy QA.

Obecny przepływ pracy operatora QA to dwupanelowa witryna QA:

- Po lewej: panel Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujący transkrypt w stylu Slacka i plan scenariusza.

Uruchom za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę Gateway opartą na Dockerze i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może przekazać agentowi
misję QA, obserwować rzeczywiste zachowanie kanału oraz rejestrować, co zadziałało,
co się nie powiodło i co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez każdorazowego przebudowywania obrazu Docker,
uruchom stos z pakietem QA Lab montowanym przez bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Dockera na wstępnie zbudowanym obrazie i montuje przez bind mount
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianach, a przeglądarka automatycznie przeładowuje się, gdy hash zasobu QA Lab się zmienia.

## Seedy wspierane przez repozytorium

Zasoby seed znajdują się w `qa/`:

- `qa/scenarios.md`

Są one celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta. Lista bazowa powinna pozostać na tyle szeroka, aby obejmować:

- rozmowy DM i kanałowe
- zachowanie wątków
- cykl życia działań na wiadomościach
- wywołania cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Raportowanie

`qa-lab` eksportuje raport protokołu w Markdown na podstawie obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

## Powiązana dokumentacja

- [Testowanie](/pl/help/testing)
- [Kanał QA](/pl/channels/qa-channel)
- [Panel](/web/dashboard)
