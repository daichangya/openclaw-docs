---
read_when:
    - Chcesz krótszych wyników narzędzi `exec` lub `bash` w OpenClaw
    - Chcesz włączyć dołączony Plugin tokenjuice
    - Musisz zrozumieć, co zmienia tokenjuice i co pozostawia w surowej postaci
summary: Kompaktowanie zaszumionych wyników narzędzi exec i bash za pomocą opcjonalnego dołączonego Pluginu
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-25T14:00:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` to opcjonalny dołączony Plugin, który kompaktuje zaszumione wyniki narzędzi `exec` i `bash`
po wykonaniu polecenia.

Zmienia zwracany `tool_result`, a nie samo polecenie. Tokenjuice nie
przepisuje danych wejściowych powłoki, nie uruchamia ponownie poleceń ani nie zmienia kodów wyjścia.

Obecnie dotyczy to osadzonych uruchomień PI oraz dynamicznych narzędzi OpenClaw w harnessie
app-server Codex. Tokenjuice podłącza się do middleware wyników narzędzi OpenClaw i
przycina dane wyjściowe, zanim wrócą do aktywnej sesji harnessu.

## Włącz Plugin

Szybka ścieżka:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Równoważnie:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw już dostarcza ten Plugin. Nie ma osobnego kroku `plugins install`
ani `tokenjuice install openclaw`.

Jeśli wolisz edytować konfigurację bezpośrednio:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Co zmienia tokenjuice

- Kompaktuje zaszumione wyniki `exec` i `bash`, zanim zostaną zwrócone do sesji.
- Pozostawia samo wykonanie polecenia bez zmian.
- Zachowuje dokładne odczyty zawartości plików i inne polecenia, które tokenjuice powinien pozostawić w surowej postaci.
- Pozostaje opcjonalny: wyłącz Plugin, jeśli chcesz dosłownych danych wyjściowych wszędzie.

## Sprawdź, czy działa

1. Włącz Plugin.
2. Uruchom sesję, która może wywoływać `exec`.
3. Uruchom zaszumione polecenie, takie jak `git status`.
4. Sprawdź, czy zwrócony wynik narzędzia jest krótszy i bardziej uporządkowany niż surowe dane wyjściowe powłoki.

## Wyłącz Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Lub:

```bash
openclaw plugins disable tokenjuice
```

## Powiązane

- [Narzędzie Exec](/pl/tools/exec)
- [Poziomy myślenia](/pl/tools/thinking)
- [Silnik kontekstu](/pl/concepts/context-engine)
