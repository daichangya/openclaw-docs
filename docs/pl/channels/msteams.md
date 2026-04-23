---
read_when:
    - Praca nad funkcjami kanału Microsoft Teams
summary: Status obsługi bota Microsoft Teams, możliwości i konfiguracja
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T09:55:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> „Porzućcie wszelką nadzieję, wy, którzy tu wchodzicie.”

Status: obsługiwane są tekst oraz załączniki w DM; wysyłanie plików w kanałach/grupach wymaga `sharePointSiteId` + uprawnień Graph (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)). Ankiety są wysyłane przez Adaptive Cards. Akcje wiadomości udostępniają jawne `upload-file` dla wysyłek rozpoczynanych od pliku.

## Bundlowany plugin

Microsoft Teams jest dostarczany jako bundlowany plugin w obecnych wydaniach OpenClaw, więc
w normalnym pakietowanym buildzie nie jest wymagana osobna instalacja.

Jeśli używasz starszego builda lub niestandardowej instalacji, która nie zawiera bundlowanego Teams,
zainstaluj go ręcznie:

```bash
openclaw plugins install @openclaw/msteams
```

Lokalny checkout (przy uruchamianiu z repozytorium git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że plugin Microsoft Teams jest dostępny.
   - Obecne pakietowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz **Azure Bot** (App ID + client secret + tenant ID).
3. Skonfiguruj OpenClaw za pomocą tych poświadczeń.
4. Wystaw `/api/messages` (domyślnie port 3978) przez publiczny URL lub tunel.
5. Zainstaluj pakiet aplikacji Teams i uruchom Gateway.

Minimalna konfiguracja (client secret):

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

W środowiskach produkcyjnych rozważ użycie [uwierzytelniania federacyjnego](#federated-authentication-certificate--managed-identity) (certyfikat lub managed identity) zamiast client secret.

Uwaga: czaty grupowe są domyślnie blokowane (`channels.msteams.groupPolicy: "allowlist"`). Aby zezwolić na odpowiedzi grupowe, ustaw `channels.msteams.groupAllowFrom` (lub użyj `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi, z domyślnym ograniczeniem do wzmianek).

## Cele

- Rozmawiaj z OpenClaw przez DM, czaty grupowe lub kanały Teams.
- Utrzymuj deterministyczny routing: odpowiedzi zawsze wracają na kanał, z którego przyszły.
- Domyślnie stosuj bezpieczne zachowanie kanałów (wymagane wzmianki, chyba że skonfigurowano inaczej).

## Zapisy konfiguracji

Domyślnie Microsoft Teams może zapisywać aktualizacje konfiguracji wyzwalane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz przez:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrola dostępu (DM + grupy)

**Dostęp do DM**

- Domyślnie: `channels.msteams.dmPolicy = "pairing"`. Nieznani nadawcy są ignorowani do czasu zatwierdzenia.
- `channels.msteams.allowFrom` powinno używać stabilnych identyfikatorów obiektów AAD.
- UPN i nazwy wyświetlane są mutowalne; bezpośrednie dopasowanie jest domyślnie wyłączone i włączane tylko przez `channels.msteams.dangerouslyAllowNameMatching: true`.
- Kreator może rozwiązywać nazwy do ID przez Microsoft Graph, jeśli poświadczenia na to pozwalają.

**Dostęp grupowy**

- Domyślnie: `channels.msteams.groupPolicy = "allowlist"` (blokowane, dopóki nie dodasz `groupAllowFrom`). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- `channels.msteams.groupAllowFrom` kontroluje, którzy nadawcy mogą wyzwalać działania w czatach grupowych/kanałach (fallback do `channels.msteams.allowFrom`).
- Ustaw `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi (nadal domyślnie obowiązuje ograniczenie do wzmianek).
- Aby nie zezwalać na **żadne kanały**, ustaw `channels.msteams.groupPolicy: "disabled"`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + lista dozwolonych kanałów**

- Ogranicz odpowiedzi grupowe/kanałowe, wymieniając zespoły i kanały w `channels.msteams.teams`.
- Klucze powinny używać stabilnych ID zespołów i ID konwersacji kanałów.
- Gdy `groupPolicy="allowlist"` i istnieje lista dozwolonych zespołów, akceptowane są tylko wymienione zespoły/kanały (z ograniczeniem do wzmianek).
- Kreator konfiguracji akceptuje wpisy `Team/Channel` i zapisuje je za Ciebie.
- Podczas uruchamiania OpenClaw rozwiązuje nazwy zespołów/kanałów oraz list dozwolonych użytkowników do ID (gdy uprawnienia Graph na to pozwalają)
  i loguje mapowanie; nierozwiązane nazwy zespołów/kanałów pozostają zapisane tak, jak wpisano, ale są domyślnie ignorowane przez routing, chyba że włączono `channels.msteams.dangerouslyAllowNameMatching: true`.

Przykład:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Jak to działa

1. Upewnij się, że plugin Microsoft Teams jest dostępny.
   - Obecne pakietowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz **Azure Bot** (App ID + secret + tenant ID).
3. Zbuduj **pakiet aplikacji Teams**, który odwołuje się do bota i zawiera poniższe uprawnienia RSC.
4. Prześlij/zainstaluj aplikację Teams w zespole (lub w zakresie osobistym dla DM).
5. Skonfiguruj `msteams` w `~/.openclaw/openclaw.json` (lub przez zmienne środowiskowe) i uruchom Gateway.
6. Gateway domyślnie nasłuchuje ruchu webhook Bot Framework na `/api/messages`.

## Konfiguracja Azure Bot (wymagania wstępne)

Przed konfiguracją OpenClaw musisz utworzyć zasób Azure Bot.

### Krok 1: Utwórz Azure Bot

1. Przejdź do [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Wypełnij kartę **Basics**:

   | Pole               | Wartość                                                  |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nazwa Twojego bota, np. `openclaw-msteams` (musi być unikalna) |
   | **Subscription**   | Wybierz swoją subskrypcję Azure                          |
   | **Resource group** | Utwórz nową lub użyj istniejącej                         |
   | **Pricing tier**   | **Free** do developmentu/testów                          |
   | **Type of App**    | **Single Tenant** (zalecane — zobacz uwagę poniżej)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Informacja o wycofaniu:** tworzenie nowych botów multi-tenant zostało wycofane po 2025-07-31. Dla nowych botów używaj **Single Tenant**.

3. Kliknij **Review + create** → **Create** (poczekaj około 1–2 minut)

### Krok 2: Pobierz poświadczenia

1. Przejdź do zasobu Azure Bot → **Configuration**
2. Skopiuj **Microsoft App ID** → to jest Twoje `appId`
3. Kliknij **Manage Password** → przejdź do App Registration
4. W sekcji **Certificates & secrets** → **New client secret** → skopiuj **Value** → to jest Twoje `appPassword`
5. Przejdź do **Overview** → skopiuj **Directory (tenant) ID** → to jest Twoje `tenantId`

### Krok 3: Skonfiguruj endpoint wiadomości

1. W Azure Bot → **Configuration**
2. Ustaw **Messaging endpoint** na URL webhooka:
   - Produkcja: `https://your-domain.com/api/messages`
   - Lokalny development: użyj tunelu (zobacz [Lokalny development](#local-development-tunneling) poniżej)

### Krok 4: Włącz kanał Teams

1. W Azure Bot → **Channels**
2. Kliknij **Microsoft Teams** → Configure → Save
3. Zaakceptuj Terms of Service

<a id="federated-authentication-certificate--managed-identity"></a>

## Uwierzytelnianie federacyjne (certyfikat + managed identity)

> Dodano w 2026.3.24

W środowiskach produkcyjnych OpenClaw obsługuje **uwierzytelnianie federacyjne** jako bezpieczniejszą alternatywę dla client secret. Dostępne są dwie metody:

### Opcja A: Uwierzytelnianie oparte na certyfikacie

Użyj certyfikatu PEM zarejestrowanego w rejestracji aplikacji Entra ID.

**Konfiguracja:**

1. Wygeneruj lub uzyskaj certyfikat (format PEM z kluczem prywatnym).
2. W Entra ID → App Registration → **Certificates & secrets** → **Certificates** → prześlij publiczny certyfikat.

**Config:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Zmienne środowiskowe:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opcja B: Azure Managed Identity

Użyj Azure Managed Identity do uwierzytelniania bez haseł. Jest to idealne dla wdrożeń w infrastrukturze Azure (AKS, App Service, Azure VM), gdzie managed identity jest dostępne.

**Jak to działa:**

1. Pod/VM bota ma managed identity (system-assigned lub user-assigned).
2. **Federated identity credential** łączy managed identity z rejestracją aplikacji Entra ID.
3. W runtime OpenClaw używa `@azure/identity` do pobierania tokenów z endpointu Azure IMDS (`169.254.169.254`).
4. Token jest przekazywany do SDK Teams na potrzeby uwierzytelnienia bota.

**Wymagania wstępne:**

- Infrastruktura Azure z włączonym managed identity (AKS workload identity, App Service, VM)
- Utworzone federated identity credential w rejestracji aplikacji Entra ID
- Dostęp sieciowy z poda/VM do IMDS (`169.254.169.254:80`)

**Config (system-assigned managed identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Config (user-assigned managed identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Zmienne środowiskowe:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (tylko dla user-assigned)

### Konfiguracja AKS Workload Identity

Dla wdrożeń AKS używających workload identity:

1. **Włącz workload identity** w klastrze AKS.
2. **Utwórz federated identity credential** w rejestracji aplikacji Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Dodaj adnotację do konta usługi Kubernetes** z client ID aplikacji:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Nadaj podowi etykietę** do wstrzykiwania workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zapewnij dostęp sieciowy** do IMDS (`169.254.169.254`) — jeśli używasz NetworkPolicy, dodaj regułę egress zezwalającą na ruch do `169.254.169.254/32` na porcie 80.

### Porównanie typów uwierzytelniania

| Metoda               | Config                                         | Zalety                             | Wady                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Prosta konfiguracja                | Wymagana rotacja sekretów, mniejsze bezpieczeństwo |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Brak współdzielonego sekretu w sieci | Narzut związany z zarządzaniem certyfikatami |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Uwierzytelnianie bez haseł, brak sekretów do zarządzania | Wymagana infrastruktura Azure         |

**Domyślne zachowanie:** gdy `authType` nie jest ustawione, OpenClaw domyślnie używa uwierzytelniania client secret. Istniejące konfiguracje nadal działają bez zmian.

## Lokalny development (tunelowanie)

Teams nie może połączyć się z `localhost`. Użyj tunelu do lokalnego developmentu:

**Opcja A: ngrok**

```bash
ngrok http 3978
# Skopiuj URL https, np. https://abc123.ngrok.io
# Ustaw messaging endpoint na: https://abc123.ngrok.io/api/messages
```

**Opcja B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Użyj swojego URL Tailscale Funnel jako messaging endpoint
```

## Teams Developer Portal (alternatywa)

Zamiast ręcznie tworzyć ZIP z manifestem, możesz użyć [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Kliknij **+ New app**
2. Uzupełnij podstawowe informacje (nazwa, opis, informacje o deweloperze)
3. Przejdź do **App features** → **Bot**
4. Wybierz **Enter a bot ID manually** i wklej swój Azure Bot App ID
5. Zaznacz zakresy: **Personal**, **Team**, **Group Chat**
6. Kliknij **Distribute** → **Download app package**
7. W Teams: **Apps** → **Manage your apps** → **Upload a custom app** → wybierz plik ZIP

To często jest łatwiejsze niż ręczna edycja manifestów JSON.

## Testowanie bota

**Opcja A: Azure Web Chat (najpierw zweryfikuj webhook)**

1. W Azure Portal → zasób Azure Bot → **Test in Web Chat**
2. Wyślij wiadomość — powinieneś zobaczyć odpowiedź
3. To potwierdza, że endpoint webhook działa przed konfiguracją Teams

**Opcja B: Teams (po instalacji aplikacji)**

1. Zainstaluj aplikację Teams (sideload lub katalog organizacji)
2. Znajdź bota w Teams i wyślij DM
3. Sprawdź logi Gateway pod kątem przychodzącej aktywności

## Konfiguracja (minimalna, tylko tekst)

1. **Upewnij się, że plugin Microsoft Teams jest dostępny**
   - Obecne pakietowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie:
     - Z npm: `openclaw plugins install @openclaw/msteams`
     - Z lokalnego checkoutu: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Rejestracja bota**
   - Utwórz Azure Bot (zobacz wyżej) i zanotuj:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Manifest aplikacji Teams**
   - Dodaj wpis `bot` z `botId = <App ID>`.
   - Zakresy: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (wymagane do obsługi plików w zakresie osobistym).
   - Dodaj uprawnienia RSC (poniżej).
   - Utwórz ikony: `outline.png` (32x32) i `color.png` (192x192).
   - Spakuj wszystkie trzy pliki razem: `manifest.json`, `outline.png`, `color.png`.

4. **Skonfiguruj OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Możesz też użyć zmiennych środowiskowych zamiast kluczy konfiguracji:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (opcjonalnie: `"secret"` lub `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federated + certyfikat)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcjonalne, niewymagane do uwierzytelniania)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (tylko user-assigned MI)

5. **Endpoint bota**
   - Ustaw Azure Bot Messaging Endpoint na:
     - `https://<host>:3978/api/messages` (lub wybraną ścieżkę/port).

6. **Uruchom Gateway**
   - Kanał Teams uruchamia się automatycznie, gdy dostępny jest bundlowany lub ręcznie zainstalowany plugin oraz istnieje konfiguracja `msteams` z poświadczeniami.

## Akcja informacji o członku

OpenClaw udostępnia wspieraną przez Graph akcję `member-info` dla Microsoft Teams, aby agenty i automatyzacje mogły bezpośrednio z Microsoft Graph rozwiązywać szczegóły członków kanału (nazwa wyświetlana, e-mail, rola).

Wymagania:

- Uprawnienie RSC `Member.Read.Group` (już zawarte w zalecanym manifeście)
- Dla wyszukiwań między zespołami: uprawnienie aplikacyjne Graph `User.Read.All` z admin consent

Akcja jest kontrolowana przez `channels.msteams.actions.memberInfo` (domyślnie: włączona, gdy dostępne są poświadczenia Graph).

## Kontekst historii

- `channels.msteams.historyLimit` kontroluje, ile ostatnich wiadomości z kanału/grupy jest opakowywanych do promptu.
- Fallback do `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).
- Pobrana historia wątku jest filtrowana przez listy dozwolonych nadawców (`allowFrom` / `groupAllowFrom`), więc seedowanie kontekstu wątku obejmuje tylko wiadomości od dozwolonych nadawców.
- Cytowany kontekst załączników (`ReplyTo*` pochodzący z HTML odpowiedzi Teams) jest obecnie przekazywany tak, jak został odebrany.
- Innymi słowy, listy dozwolonych kontrolują, kto może wyzwalać agenta; obecnie filtrowane są tylko określone ścieżki dodatkowego kontekstu.
- Historię DM można ograniczyć przez `channels.msteams.dmHistoryLimit` (tury użytkownika). Nadpisania per-user: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktualne uprawnienia Teams RSC (manifest)

To są **obecne uprawnienia resourceSpecific** w manifeście naszej aplikacji Teams. Obowiązują tylko wewnątrz zespołu/czatu, gdzie aplikacja jest zainstalowana.

**Dla kanałów (zakres zespołu):**

- `ChannelMessage.Read.Group` (Application) - odbiór wszystkich wiadomości kanałowych bez @wzmianki
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Dla czatów grupowych:**

- `ChatMessage.Read.Chat` (Application) - odbiór wszystkich wiadomości czatu grupowego bez @wzmianki

## Przykładowy manifest Teams (zredagowany)

Minimalny, poprawny przykład z wymaganymi polami. Zastąp ID i URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Zastrzeżenia dotyczące manifestu (pola obowiązkowe)

- `bots[].botId` **musi** odpowiadać Azure Bot App ID.
- `webApplicationInfo.id` **musi** odpowiadać Azure Bot App ID.
- `bots[].scopes` musi zawierać powierzchnie, których planujesz używać (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` jest wymagane do obsługi plików w zakresie osobistym.
- `authorization.permissions.resourceSpecific` musi zawierać uprawnienia odczytu/wysyłania na kanałach, jeśli chcesz obsługiwać ruch kanałowy.

### Aktualizacja istniejącej aplikacji

Aby zaktualizować już zainstalowaną aplikację Teams (np. dodać uprawnienia RSC):

1. Zaktualizuj `manifest.json`, dodając nowe ustawienia
2. **Zwiększ pole `version`** (np. `1.0.0` → `1.1.0`)
3. **Spakuj ponownie** manifest z ikonami (`manifest.json`, `outline.png`, `color.png`)
4. Prześlij nowy plik ZIP:
   - **Opcja A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → znajdź swoją aplikację → Upload new version
   - **Opcja B (Sideload):** W Teams → Apps → Manage your apps → Upload a custom app
5. **Dla kanałów zespołu:** zainstaluj ponownie aplikację w każdym zespole, aby nowe uprawnienia zaczęły obowiązywać
6. **Całkowicie zamknij i uruchom ponownie Teams** (nie tylko zamknij okno), aby wyczyścić zcache’owane metadane aplikacji

## Możliwości: tylko RSC vs Graph

### Przy użyciu **tylko Teams RSC** (aplikacja zainstalowana, bez uprawnień Microsoft Graph API)

Działa:

- Odczyt tekstowej treści wiadomości kanałowych.
- Wysyłanie tekstowej treści wiadomości kanałowych.
- Odbiór załączników plikowych w **zakresie osobistym (DM)**.

Nie działa:

- Zawartość **obrazów lub plików** na kanałach/w grupach (payload zawiera tylko HTML stub).
- Pobieranie załączników przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości (poza bieżącym zdarzeniem webhooka).

### Przy użyciu **Teams RSC + uprawnień aplikacyjnych Microsoft Graph**

Dodaje:

- Pobieranie hosted contents (obrazów wklejonych do wiadomości).
- Pobieranie załączników plikowych przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości kanałów/czatów przez Graph.

### RSC vs Graph API

| Możliwość              | Uprawnienia RSC      | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **Wiadomości w czasie rzeczywistym** | Tak (przez webhook)  | Nie (tylko polling)                 |
| **Wiadomości historyczne** | Nie                | Tak (można odpytywać historię)      |
| **Złożoność konfiguracji** | Tylko manifest aplikacji | Wymaga admin consent + przepływu tokenów |
| **Działa offline**     | Nie (musi działać)   | Tak (można odpytać w dowolnym momencie) |

**Sedno:** RSC służy do nasłuchiwania w czasie rzeczywistym; Graph API do dostępu historycznego. Aby nadrobić pominięte wiadomości podczas pracy offline, potrzebujesz Graph API z `ChannelMessage.Read.All` (wymaga admin consent).

## Media + historia z włączonym Graph (wymagane dla kanałów)

Jeśli potrzebujesz obrazów/plików na **kanałach** lub chcesz pobierać **historię wiadomości**, musisz włączyć uprawnienia Microsoft Graph i przyznać admin consent.

1. W Entra ID (Azure AD) **App Registration** dodaj uprawnienia aplikacyjne Microsoft Graph:
   - `ChannelMessage.Read.All` (załączniki kanałowe + historia)
   - `Chat.Read.All` lub `ChatMessage.Read.All` (czaty grupowe)
2. **Przyznaj admin consent** dla tenant.
3. Zwiększ **wersję manifestu** aplikacji Teams, prześlij go ponownie i **zainstaluj ponownie aplikację w Teams**.
4. **Całkowicie zamknij i uruchom ponownie Teams**, aby wyczyścić zcache’owane metadane aplikacji.

**Dodatkowe uprawnienie do wzmianek użytkowników:** Wzmianki @user działają od razu dla użytkowników znajdujących się w konwersacji. Jeśli jednak chcesz dynamicznie wyszukiwać i wzmiankować użytkowników, którzy **nie są w bieżącej konwersacji**, dodaj uprawnienie aplikacyjne `User.Read.All` i przyznaj admin consent.

## Znane ograniczenia

### Timeouty webhooka

Teams dostarcza wiadomości przez webhook HTTP. Jeśli przetwarzanie trwa zbyt długo (np. wolne odpowiedzi LLM), możesz zobaczyć:

- timeouty Gateway
- ponowne próby dostarczenia wiadomości przez Teams (powodujące duplikaty)
- utracone odpowiedzi

OpenClaw obsługuje to przez szybkie zwracanie odpowiedzi i proaktywne wysyłanie reply, ale bardzo wolne odpowiedzi nadal mogą powodować problemy.

### Formatowanie

Markdown w Teams jest bardziej ograniczony niż w Slack lub Discord:

- Działa podstawowe formatowanie: **bold**, _italic_, `code`, linki
- Złożony Markdown (tabele, zagnieżdżone listy) może renderować się niepoprawnie
- Adaptive Cards są obsługiwane dla ankiet i semantycznych wysyłek prezentacyjnych (zobacz poniżej)

## Konfiguracja

Kluczowe ustawienia (zobacz `/gateway/configuration`, aby poznać współdzielone wzorce kanałów):

- `channels.msteams.enabled`: włączanie/wyłączanie kanału.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: poświadczenia bota.
- `channels.msteams.webhook.port` (domyślnie `3978`)
- `channels.msteams.webhook.path` (domyślnie `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing)
- `channels.msteams.allowFrom`: lista dozwolonych dla DM (zalecane identyfikatory obiektów AAD). Kreator podczas konfiguracji rozwiązuje nazwy do ID, gdy dostęp do Graph jest dostępny.
- `channels.msteams.dangerouslyAllowNameMatching`: przełącznik awaryjny do ponownego włączenia mutowalnego dopasowywania UPN/nazwy wyświetlanej oraz bezpośredniego routingu po nazwie zespołu/kanału.
- `channels.msteams.textChunkLimit`: rozmiar chunków tekstu wychodzącego.
- `channels.msteams.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych liniach (granice akapitów) przed chunkowaniem po długości.
- `channels.msteams.mediaAllowHosts`: lista dozwolonych hostów dla przychodzących załączników (domyślnie domeny Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista dozwolonych hostów do dołączania nagłówków Authorization przy ponownych próbach pobrania mediów (domyślnie hosty Graph + Bot Framework).
- `channels.msteams.requireMention`: wymaganie @wzmianki w kanałach/grupach (domyślnie true).
- `channels.msteams.replyStyle`: `thread | top-level` (zobacz [Styl odpowiedzi](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: nadpisanie per-team.
- `channels.msteams.teams.<teamId>.requireMention`: nadpisanie per-team.
- `channels.msteams.teams.<teamId>.tools`: domyślne nadpisania polityki narzędzi per-team (`allow`/`deny`/`alsoAllow`) używane, gdy brakuje nadpisania na poziomie kanału.
- `channels.msteams.teams.<teamId>.toolsBySender`: domyślne nadpisania polityki narzędzi per-team per-sender (obsługiwany wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: nadpisanie per-channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: nadpisanie per-channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: nadpisania polityki narzędzi per-channel (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: nadpisania polityki narzędzi per-channel per-sender (obsługiwany wildcard `"*"`).
- Klucze `toolsBySender` powinny używać jawnych prefiksów:
  `id:`, `e164:`, `username:`, `name:` (starsze klucze bez prefiksu nadal mapują się tylko do `id:`).
- `channels.msteams.actions.memberInfo`: włącza lub wyłącza wspieraną przez Graph akcję informacji o członku (domyślnie: włączona, gdy dostępne są poświadczenia Graph).
- `channels.msteams.authType`: typ uwierzytelniania — `"secret"` (domyślnie) lub `"federated"`.
- `channels.msteams.certificatePath`: ścieżka do pliku certyfikatu PEM (federated + uwierzytelnianie certyfikatem).
- `channels.msteams.certificateThumbprint`: thumbprint certyfikatu (opcjonalny, niewymagany do uwierzytelniania).
- `channels.msteams.useManagedIdentity`: włącza uwierzytelnianie managed identity (tryb federated).
- `channels.msteams.managedIdentityClientId`: client ID dla user-assigned managed identity.
- `channels.msteams.sharePointSiteId`: identyfikator witryny SharePoint do przesyłania plików w czatach grupowych/kanałach (zobacz [Wysyłanie plików w czatach grupowych](#sending-files-in-group-chats)).

## Routing i sesje

- Klucze sesji mają standardowy format agenta (zobacz [/concepts/session](/pl/concepts/session)):
  - Wiadomości bezpośrednie współdzielą główną sesję (`agent:<agentId>:<mainKey>`).
  - Wiadomości kanałowe/grupowe używają identyfikatora konwersacji:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Styl odpowiedzi: wątki vs posty

Teams niedawno wprowadził dwa style UI kanałów na tym samym bazowym modelu danych:

| Styl                    | Opis                                                      | Zalecane `replyStyle`   |
| ----------------------- | --------------------------------------------------------- | ----------------------- |
| **Posts** (klasyczny)   | Wiadomości są wyświetlane jako karty z odpowiedziami w wątku pod spodem | `thread` (domyślnie)    |
| **Threads** (jak Slack) | Wiadomości płyną liniowo, bardziej jak w Slack            | `top-level`             |

**Problem:** API Teams nie ujawnia, którego stylu UI używa kanał. Jeśli użyjesz niewłaściwego `replyStyle`:

- `thread` w kanale w stylu Threads → odpowiedzi pojawiają się niezręcznie zagnieżdżone
- `top-level` w kanale w stylu Posts → odpowiedzi pojawiają się jako osobne posty najwyższego poziomu zamiast w wątku

**Rozwiązanie:** skonfiguruj `replyStyle` per-channel zgodnie z tym, jak skonfigurowany jest kanał:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Załączniki i obrazy

**Obecne ograniczenia:**

- **DM:** obrazy i załączniki plikowe działają przez API plików bota Teams.
- **Kanały/grupy:** załączniki znajdują się w pamięci M365 (SharePoint/OneDrive). Payload webhooka zawiera tylko HTML stub, a nie rzeczywiste bajty pliku. **Do pobierania załączników kanałowych wymagane są uprawnienia Graph API**.
- Dla jawnych wysyłek rozpoczynanych od pliku użyj `action=upload-file` z `media` / `filePath` / `path`; opcjonalne `message` staje się towarzyszącym tekstem/komentarzem, a `filename` nadpisuje nazwę przesłanego pliku.

Bez uprawnień Graph wiadomości kanałowe z obrazami będą odbierane tylko jako tekst (zawartość obrazu nie jest dostępna dla bota).
Domyślnie OpenClaw pobiera media tylko z nazw hostów Microsoft/Teams. Nadpisz przez `channels.msteams.mediaAllowHosts` (użyj `["*"]`, aby zezwolić na dowolny host).
Nagłówki Authorization są dołączane tylko dla hostów z `channels.msteams.mediaAuthAllowHosts` (domyślnie hosty Graph + Bot Framework). Zachowaj ścisłość tej listy (unikaj sufiksów multi-tenant).

## Wysyłanie plików w czatach grupowych

Boty mogą wysyłać pliki w DM przez przepływ FileConsentCard (wbudowany). Jednak **wysyłanie plików w czatach grupowych/kanałach** wymaga dodatkowej konfiguracji:

| Kontekst                 | Sposób wysyłania plików                     | Wymagana konfiguracja                             |
| ------------------------ | ------------------------------------------- | ------------------------------------------------- |
| **DM**                   | FileConsentCard → użytkownik akceptuje → bot przesyła | Działa od razu                                    |
| **Czaty grupowe/kanały** | Prześlij do SharePoint → udostępnij link    | Wymaga `sharePointSiteId` + uprawnień Graph       |
| **Obrazy (dowolny kontekst)** | Inline zakodowane w Base64             | Działa od razu                                    |

### Dlaczego czaty grupowe wymagają SharePoint

Boty nie mają osobistego dysku OneDrive (endpoint Graph API `/me/drive` nie działa dla tożsamości aplikacyjnych). Aby wysyłać pliki w czatach grupowych/kanałach, bot przesyła je do **witryny SharePoint** i tworzy link udostępniania.

### Konfiguracja

1. **Dodaj uprawnienia Graph API** w Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - przesyłanie plików do SharePoint
   - `Chat.Read.All` (Application) - opcjonalne, włącza linki udostępniania per-user

2. **Przyznaj admin consent** dla tenant.

3. **Pobierz identyfikator witryny SharePoint:**

   ```bash
   # Przez Graph Explorer lub curl z prawidłowym tokenem:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Przykład: dla witryny pod adresem "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Odpowiedź zawiera: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Skonfiguruj OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Zachowanie udostępniania

| Uprawnienie                              | Zachowanie udostępniania                                 |
| ---------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` tylko              | Link udostępniania dla całej organizacji (każdy w organizacji ma dostęp) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Link udostępniania per-user (dostęp mają tylko członkowie czatu) |

Udostępnianie per-user jest bezpieczniejsze, ponieważ tylko uczestnicy czatu mogą uzyskać dostęp do pliku. Jeśli brakuje uprawnienia `Chat.Read.All`, bot przechodzi na udostępnianie dla całej organizacji.

### Zachowanie fallback

| Scenariusz                                        | Wynik                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Czat grupowy + plik + skonfigurowane `sharePointSiteId` | Przesłanie do SharePoint, wysłanie linku udostępniania |
| Czat grupowy + plik + brak `sharePointSiteId`     | Próba przesłania do OneDrive (może się nie udać), wysłanie tylko tekstu |
| Czat osobisty + plik                              | Przepływ FileConsentCard (działa bez SharePoint)   |
| Dowolny kontekst + obraz                          | Inline zakodowane w Base64 (działa bez SharePoint) |

### Lokalizacja przechowywanych plików

Przesłane pliki są przechowywane w folderze `/OpenClawShared/` w domyślnej bibliotece dokumentów skonfigurowanej witryny SharePoint.

## Ankiety (Adaptive Cards)

OpenClaw wysyła ankiety Teams jako Adaptive Cards (nie ma natywnego API ankiet Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Głosy są zapisywane przez Gateway w `~/.openclaw/msteams-polls.json`.
- Gateway musi pozostać online, aby rejestrować głosy.
- Ankiety nie publikują jeszcze automatycznie podsumowań wyników (w razie potrzeby sprawdź plik store).

## Karty prezentacji

Wysyłaj semantyczne payloady prezentacji do użytkowników lub konwersacji Teams za pomocą narzędzia `message` lub CLI. OpenClaw renderuje je jako Teams Adaptive Cards na podstawie generycznego kontraktu prezentacji.

Parametr `presentation` akceptuje bloki semantyczne. Gdy podano `presentation`, tekst wiadomości jest opcjonalny.

**Narzędzie agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Szczegóły formatu target znajdziesz poniżej w sekcji [Formaty target](#target-formats).

## Formaty target

Targety MSTeams używają prefiksów do rozróżniania użytkowników i konwersacji:

| Typ target            | Format                           | Przykład                                            |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Użytkownik (po ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Użytkownik (po nazwie) | `user:<display-name>`           | `user:John Smith` (wymaga Graph API)                |
| Grupa/kanał           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupa/kanał (raw)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jeśli zawiera `@thread`) |

**Przykłady CLI:**

```bash
# Wyślij do użytkownika po ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Wyślij do użytkownika po nazwie wyświetlanej (wyzwala wyszukiwanie przez Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Wyślij do czatu grupowego lub kanału
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Wyślij kartę prezentacji do konwersacji
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Przykłady narzędzia agenta:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Uwaga: bez prefiksu `user:` nazwy domyślnie są rozwiązywane jako grupa/zespół. Zawsze używaj `user:`, gdy kierujesz wiadomość do osób po nazwie wyświetlanej.

## Wiadomości proaktywne

- Wiadomości proaktywne są możliwe dopiero **po** interakcji użytkownika, ponieważ dopiero wtedy zapisujemy odwołania do konwersacji.
- Zobacz `/gateway/configuration`, aby poznać `dmPolicy` i ograniczenia list dozwolonych.

## ID zespołów i kanałów (częsta pułapka)

Parametr zapytania `groupId` w URL-ach Teams **NIE** jest ID zespołu używanym w konfiguracji. Zamiast tego wyodrębnij ID ze ścieżki URL:

**URL zespołu:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID zespołu (zdekoduj URL)
```

**URL kanału:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID kanału (zdekoduj URL)
```

**Do konfiguracji:**

- ID zespołu = segment ścieżki po `/team/` (po zdekodowaniu URL, np. `19:Bk4j...@thread.tacv2`)
- ID kanału = segment ścieżki po `/channel/` (po zdekodowaniu URL)
- **Ignoruj** parametr zapytania `groupId`

## Kanały prywatne

Boty mają ograniczone wsparcie w kanałach prywatnych:

| Funkcja                      | Kanały standardowe | Kanały prywatne       |
| --------------------------- | ------------------ | --------------------- |
| Instalacja bota             | Tak                | Ograniczona           |
| Wiadomości w czasie rzeczywistym (webhook) | Tak     | Może nie działać      |
| Uprawnienia RSC             | Tak                | Mogą działać inaczej  |
| @wzmianki                   | Tak                | Jeśli bot jest dostępny |
| Historia przez Graph API    | Tak                | Tak (z uprawnieniami) |

**Obejścia, jeśli kanały prywatne nie działają:**

1. Używaj standardowych kanałów do interakcji z botem
2. Używaj DM — użytkownicy zawsze mogą pisać do bota bezpośrednio
3. Używaj Graph API do dostępu do historii (wymaga `ChannelMessage.Read.All`)

## Rozwiązywanie problemów

### Typowe problemy

- **Obrazy nie wyświetlają się na kanałach:** brakuje uprawnień Graph lub admin consent. Zainstaluj ponownie aplikację Teams i całkowicie zamknij/otwórz ponownie Teams.
- **Brak odpowiedzi na kanale:** wzmianki są domyślnie wymagane; ustaw `channels.msteams.requireMention=false` lub skonfiguruj to per team/channel.
- **Niezgodność wersji (Teams nadal pokazuje stary manifest):** usuń i dodaj aplikację ponownie oraz całkowicie zamknij Teams, aby odświeżyć.
- **401 Unauthorized z webhooka:** oczekiwane przy ręcznych testach bez Azure JWT — oznacza, że endpoint jest osiągalny, ale uwierzytelnianie nie powiodło się. Użyj Azure Web Chat do poprawnego testu.

### Błędy przesyłania manifestu

- **"Icon file cannot be empty":** manifest odwołuje się do plików ikon o rozmiarze 0 bajtów. Utwórz poprawne ikony PNG (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** aplikacja jest nadal zainstalowana w innym zespole/czacie. Najpierw ją znajdź i odinstaluj albo odczekaj 5–10 minut na propagację.
- **"Something went wrong" przy przesyłaniu:** zamiast tego prześlij przez [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), otwórz DevTools przeglądarki (F12) → zakładka Network i sprawdź body odpowiedzi pod kątem właściwego błędu.
- **Niepowodzenie sideload:** spróbuj użyć „Upload an app to your org's app catalog” zamiast „Upload a custom app” — to często omija ograniczenia sideload.

### Uprawnienia RSC nie działają

1. Sprawdź, czy `webApplicationInfo.id` dokładnie odpowiada App ID Twojego bota
2. Prześlij ponownie aplikację i zainstaluj ją ponownie w zespole/czacie
3. Sprawdź, czy administrator organizacji nie zablokował uprawnień RSC
4. Potwierdź, że używasz właściwego zakresu: `ChannelMessage.Read.Group` dla zespołów, `ChatMessage.Read.Chat` dla czatów grupowych

## Referencje

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - przewodnik konfiguracji Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tworzenie/zarządzanie aplikacjami Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanał/grupa wymaga Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ Pairing
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i ograniczenie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
