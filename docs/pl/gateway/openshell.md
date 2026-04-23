---
read_when:
    - Chcesz zarządzane w chmurze sandboxy zamiast lokalnego Docker##
    - Konfigurujesz plugin OpenShell
    - Musisz wybrać między trybem workspace mirror a remote
summary: Użyj OpenShell jako zarządzanego backendu sandbox dla agentów OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T10:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell to zarządzany backend sandbox dla OpenClaw. Zamiast uruchamiać kontenery Docker
lokalnie, OpenClaw deleguje cykl życia sandbox do CLI `openshell`,
które udostępnia środowiska zdalne z wykonywaniem poleceń opartym na SSH.

Plugin OpenShell ponownie wykorzystuje ten sam podstawowy transport SSH i zdalny most
systemu plików co ogólny [backend SSH](/pl/gateway/sandboxing#ssh-backend). Dodaje
cykl życia specyficzny dla OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
oraz opcjonalny tryb workspace `mirror`.

## Wymagania wstępne

- CLI `openshell` zainstalowane i dostępne w `PATH` (lub ustaw własną ścieżkę przez
  `plugins.entries.openshell.config.command`)
- Konto OpenShell z dostępem do sandbox
- Gateway OpenClaw uruchomiony na hoście

## Szybki start

1. Włącz plugin i ustaw backend sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Uruchom ponownie Gateway. Przy następnym kroku agenta OpenClaw utworzy sandbox OpenShell
   i skieruje przez niego wykonywanie narzędzi.

3. Zweryfikuj:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Tryby workspace

To najważniejsza decyzja przy korzystaniu z OpenShell.

### `mirror`

Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalny
workspace pozostał kanoniczny**.

Zachowanie:

- Przed `exec` OpenClaw synchronizuje lokalny workspace do sandbox OpenShell.
- Po `exec` OpenClaw synchronizuje zdalny workspace z powrotem do lokalnego workspace.
- Narzędzia plikowe nadal działają przez most sandbox, ale lokalny workspace
  pozostaje źródłem prawdy między turami.

Najlepsze dla:

- Edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany były widoczne w
  sandbox automatycznie.
- Chcesz, aby sandbox OpenShell zachowywał się możliwie podobnie do backendu Docker.
- Chcesz, aby workspace hosta odzwierciedlał zapisy sandbox po każdej turze exec.

Kompromis: dodatkowy koszt synchronizacji przed i po każdym `exec`.

### `remote`

Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby
**workspace OpenShell stał się kanoniczny**.

Zachowanie:

- Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo zasiewa zdalny workspace z
  lokalnego workspace.
- Potem `exec`, `read`, `write`, `edit` i `apply_patch` działają
  bezpośrednio na zdalnym workspace OpenShell.
- OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnego workspace.
- Odczyty multimediów w czasie promptu nadal działają, ponieważ narzędzia plików i multimediów czytają przez
  most sandbox.

Najlepsze dla:

- Sandbox ma żyć głównie po stronie zdalnej.
- Chcesz mniejszego narzutu synchronizacji w każdej turze.
- Nie chcesz, aby lokalne edycje hosta po cichu nadpisywały stan zdalnego sandbox.

Ważne: jeśli po początkowym zasianiu edytujesz pliki na hoście poza OpenClaw,
zdalny sandbox **nie** zobaczy tych zmian. Użyj
`openclaw sandbox recreate`, aby wykonać ponowne zasianie.

### Wybór trybu

|                          | `mirror`                    | `remote`                  |
| ------------------------ | --------------------------- | ------------------------- |
| **Kanoniczny workspace** | Lokalny host                | Zdalny OpenShell          |
| **Kierunek synchronizacji** | Dwukierunkowy (każdy exec) | Jednorazowe zasianie      |
| **Narzut na turę**       | Większy (wysyłanie + pobieranie) | Mniejszy (bezpośrednie operacje zdalne) |
| **Lokalne edycje widoczne?** | Tak, przy następnym exec | Nie, aż do recreate       |
| **Najlepsze dla**        | Przepływów pracy deweloperskiej | Długotrwałych agentów, CI |

## Dokumentacja konfiguracji

Cała konfiguracja OpenShell znajduje się w `plugins.entries.openshell.config`:

| Key                       | Type                     | Default       | Opis                                                   |
| ------------------------- | ------------------------ | ------------- | ------------------------------------------------------ |
| `mode`                    | `"mirror"` lub `"remote"` | `"mirror"`    | Tryb synchronizacji workspace                          |
| `command`                 | `string`                 | `"openshell"` | Ścieżka lub nazwa CLI `openshell`                      |
| `from`                    | `string`                 | `"openclaw"`  | Źródło sandbox dla pierwszego utworzenia               |
| `gateway`                 | `string`                 | —             | Nazwa Gateway OpenShell (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | Adres URL punktu końcowego Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | Identyfikator polityki OpenShell do tworzenia sandbox  |
| `providers`               | `string[]`               | `[]`          | Nazwy dostawców do dołączenia podczas tworzenia sandbox |
| `gpu`                     | `boolean`                | `false`       | Żądaj zasobów GPU                                      |
| `autoProviders`           | `boolean`                | `true`        | Przekaż `--auto-providers` podczas `sandbox create`    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Główny zapisywalny workspace wewnątrz sandbox          |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Ścieżka montowania workspace agenta (dla dostępu tylko do odczytu) |
| `timeoutSeconds`          | `number`                 | `120`         | Limit czasu dla operacji CLI `openshell`               |

Ustawienia na poziomie sandbox (`mode`, `scope`, `workspaceAccess`) konfiguruje się w
`agents.defaults.sandbox` tak jak dla każdego backendu. Zobacz
[Sandboxing](/pl/gateway/sandboxing), aby poznać pełną macierz.

## Przykłady

### Minimalna konfiguracja remote

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Tryb mirror z GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell dla konkretnego agenta z niestandardowym Gateway

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Zarządzanie cyklem życia

Sandboxy OpenShell są zarządzane przez zwykłe CLI sandbox:

```bash
# Wyświetl wszystkie runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Sprawdź skuteczną politykę
openclaw sandbox explain

# Odtwórz (usuwa zdalny workspace, ponownie zasiewa przy następnym użyciu)
openclaw sandbox recreate --all
```

Dla trybu `remote` **recreate jest szczególnie ważne**: usuwa kanoniczny
zdalny workspace dla tego zakresu. Przy następnym użyciu następuje zasianie nowego zdalnego workspace z
lokalnego workspace.

Dla trybu `mirror` recreate głównie resetuje zdalne środowisko wykonywania, ponieważ
lokalny workspace pozostaje kanoniczny.

### Kiedy używać recreate

Użyj recreate po zmianie któregokolwiek z tych ustawień:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Utwardzanie bezpieczeństwa

OpenShell przypina deskryptor katalogu głównego workspace i przed każdym
odczytem ponownie sprawdza tożsamość sandbox, dzięki czemu podmiany symlinków lub
ponownie zamontowany workspace nie mogą przekierować odczytów poza
zamierzony zdalny workspace.

## Bieżące ograniczenia

- Przeglądarka sandbox nie jest obsługiwana przez backend OpenShell.
- `sandbox.docker.binds` nie ma zastosowania do OpenShell.
- Pokrętła runtime specyficzne dla Docker w `sandbox.docker.*` mają zastosowanie tylko do backendu Docker.

## Jak to działa

1. OpenClaw wywołuje `openshell sandbox create` (z flagami `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` zgodnie z konfiguracją).
2. OpenClaw wywołuje `openshell sandbox ssh-config <name>`, aby uzyskać szczegóły
   połączenia SSH dla sandbox.
3. Rdzeń zapisuje konfigurację SSH do pliku tymczasowego i otwiera sesję SSH przy użyciu
   tego samego zdalnego mostu systemu plików co ogólny backend SSH.
4. W trybie `mirror`: synchronizuje lokalny do zdalnego przed exec, uruchamia, synchronizuje z powrotem po exec.
5. W trybie `remote`: zasiewa raz przy tworzeniu, a potem działa bezpośrednio na zdalnym
   workspace.

## Zobacz także

- [Sandboxing](/pl/gateway/sandboxing) -- tryby, zakresy i porównanie backendów
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie zablokowanych narzędzi
- [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools) -- nadpisania dla agentów
- [Sandbox CLI](/pl/cli/sandbox) -- polecenia `openclaw sandbox`
