---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: „Sandbox per agent + ograniczenia narzędzi, pierwszeństwo i przykłady”
title: Sandbox i narzędzia w środowisku wieloagentowym
x-i18n:
    generated_at: "2026-04-25T14:00:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Konfiguracja sandbox i narzędzi w środowisku wieloagentowym

Każdy agent w konfiguracji wieloagentowej może nadpisywać globalny sandbox i politykę
narzędzi. Ta strona opisuje konfigurację per agent, reguły pierwszeństwa i
przykłady.

- **Backendy i tryby sandbox**: zobacz [Sandboxing](/pl/gateway/sandboxing).
- **Debugowanie zablokowanych narzędzi**: zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) oraz `openclaw sandbox explain`.
- **Elevated exec**: zobacz [Elevated Mode](/pl/tools/elevated).

Uwierzytelnianie jest per agent: każdy agent odczytuje własny magazyn auth ze swojego `agentDir` pod adresem
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Poświadczenia **nie** są współdzielone między agentami. Nigdy nie używaj ponownie tego samego `agentDir` dla wielu agentów.
Jeśli chcesz współdzielić poświadczenia, skopiuj `auth-profiles.json` do `agentDir` drugiego agenta.

---

## Przykłady konfiguracji

### Przykład 1: osobisty agent + ograniczony agent rodzinny

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Wynik:**

- agent `main`: działa na hoście, pełny dostęp do narzędzi
- agent `family`: działa w Dockerze (jeden kontener na agenta), tylko narzędzie `read`

---

### Przykład 2: agent do pracy ze współdzielonym sandbox

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Przykład 2b: globalny profil coding + agent tylko do wiadomości

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Wynik:**

- domyślni agenci otrzymują narzędzia coding
- agent `support` działa tylko do wiadomości (+ narzędzie Slack)

---

### Przykład 3: różne tryby sandbox per agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Globalna wartość domyślna
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Nadpisanie: main nigdy nie jest w sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Nadpisanie: public zawsze w sandbox
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Pierwszeństwo konfiguracji

Gdy istnieją jednocześnie konfiguracje globalne (`agents.defaults.*`) i specyficzne dla agenta (`agents.list[].*`):

### Konfiguracja sandbox

Ustawienia specyficzne dla agenta nadpisują ustawienia globalne:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Uwagi:**

- `agents.list[].sandbox.{docker,browser,prune}.*` nadpisuje `agents.defaults.sandbox.{docker,browser,prune}.*` dla tego agenta (ignorowane, gdy zakres sandbox rozwiązuje się do `"shared"`).

### Ograniczenia narzędzi

Kolejność filtrowania jest następująca:

1. **Profil narzędzi** (`tools.profile` lub `agents.list[].tools.profile`)
2. **Profil narzędzi dostawcy** (`tools.byProvider[provider].profile` lub `agents.list[].tools.byProvider[provider].profile`)
3. **Globalna polityka narzędzi** (`tools.allow` / `tools.deny`)
4. **Polityka narzędzi dostawcy** (`tools.byProvider[provider].allow/deny`)
5. **Polityka narzędzi specyficzna dla agenta** (`agents.list[].tools.allow/deny`)
6. **Polityka dostawcy dla agenta** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Polityka narzędzi sandbox** (`tools.sandbox.tools` lub `agents.list[].tools.sandbox.tools`)
8. **Polityka narzędzi subagenta** (`tools.subagents.tools`, jeśli dotyczy)

Każdy poziom może dodatkowo ograniczać narzędzia, ale nie może przywracać narzędzi odrzuconych na wcześniejszych poziomach.
Jeśli ustawiono `agents.list[].tools.sandbox.tools`, zastępuje ono `tools.sandbox.tools` dla tego agenta.
Jeśli ustawiono `agents.list[].tools.profile`, nadpisuje ono `tools.profile` dla tego agenta.
Klucze narzędzi dostawcy akceptują albo `provider` (np. `google-antigravity`), albo `provider/model` (np. `openai/gpt-5.4`).

Jeśli jakakolwiek jawna allowlista w tym łańcuchu sprawi, że w danym uruchomieniu nie pozostanie żadne wywoływalne narzędzie,
OpenClaw zatrzymuje się przed wysłaniem promptu do modelu. To jest celowe:
agent skonfigurowany z brakującym narzędziem, takim jak
`agents.list[].tools.allow: ["query_db"]`, powinien zakończyć się wyraźnym błędem, dopóki Plugin
rejestrujący `query_db` nie zostanie włączony, zamiast działać dalej jako agent tylko tekstowy.

Polityki narzędzi obsługują skróty `group:*`, które rozwijają się do wielu narzędzi. Pełną listę znajdziesz w [Tool groups](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Nadpisania elevated per agent (`agents.list[].tools.elevated`) mogą dodatkowo ograniczać elevated exec dla konkretnych agentów. Szczegóły znajdziesz w [Elevated Mode](/pl/tools/elevated).

---

## Migracja z pojedynczego agenta

**Przed (pojedynczy agent):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Po (wieloagentowo z różnymi profilami):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Starsze konfiguracje `agent.*` są migrowane przez `openclaw doctor`; od teraz preferuj `agents.defaults` + `agents.list`.

---

## Przykłady ograniczeń narzędzi

### Agent tylko do odczytu

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agent do bezpiecznego wykonywania (bez modyfikacji plików)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agent tylko do komunikacji

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` w tym profilu nadal zwraca ograniczony, oczyszczony widok
przywołania zamiast surowego zrzutu transkryptu. Przywołanie asystenta usuwa tagi myślenia,
szkielet `<relevant-memories>`, zwykłe tekstowe ładunki XML wywołań narzędzi
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` i ucięte bloki wywołań narzędzi),
zdegradowany szkielet wywołań narzędzi, wyciekłe tokeny sterowania modelem ASCII/full-width
oraz nieprawidłowy XML wywołań narzędzi MiniMax przed redakcją/skracaniem.

---

## Częsta pułapka: "non-main"

`agents.defaults.sandbox.mode: "non-main"` opiera się na `session.mainKey` (domyślnie `"main"`),
a nie na identyfikatorze agenta. Sesje grupowe/kanałowe zawsze dostają własne klucze, więc
są traktowane jako non-main i będą umieszczane w sandbox. Jeśli chcesz, aby agent nigdy nie trafiał do
sandbox, ustaw `agents.list[].sandbox.mode: "off"`.

---

## Testowanie

Po skonfigurowaniu sandbox i narzędzi dla wielu agentów:

1. **Sprawdź rozwiązywanie agentów:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Zweryfikuj kontenery sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Przetestuj ograniczenia narzędzi:**
   - Wyślij wiadomość wymagającą ograniczonych narzędzi
   - Zweryfikuj, że agent nie może używać narzędzi z deny listy

4. **Monitoruj logi:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Rozwiązywanie problemów

### Agent nie trafia do sandbox mimo `mode: "all"`

- Sprawdź, czy istnieje globalne `agents.defaults.sandbox.mode`, które to nadpisuje
- Konfiguracja specyficzna dla agenta ma pierwszeństwo, więc ustaw `agents.list[].sandbox.mode: "all"`

### Narzędzia są nadal dostępne mimo deny listy

- Sprawdź kolejność filtrowania narzędzi: globalna → agent → sandbox → subagent
- Każdy poziom może tylko dalej ograniczać, a nie przywracać dostęp
- Zweryfikuj w logach: `[tools] filtering tools for agent:${agentId}`

### Kontener nie jest izolowany per agent

- Ustaw `scope: "agent"` w konfiguracji sandbox specyficznej dla agenta
- Wartością domyślną jest `"session"`, co tworzy jeden kontener na sesję

---

## Powiązane

- [Sandboxing](/pl/gateway/sandboxing) -- pełna dokumentacja sandbox (tryby, zakresy, backendy, obrazy)
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie „dlaczego to jest zablokowane?”
- [Elevated Mode](/pl/tools/elevated)
- [Multi-Agent Routing](/pl/concepts/multi-agent)
- [Konfiguracja sandbox](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Zarządzanie sesjami](/pl/concepts/session)
