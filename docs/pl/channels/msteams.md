---
read_when:
    - Praca nad funkcjami kanału Microsoft Teams
summary: Status obsługi bota Microsoft Teams, możliwości i konfiguracja
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

Status: tekst + załączniki DM są obsługiwane; wysyłanie plików w kanałach/grupach wymaga `sharePointSiteId` + uprawnień Graph (zobacz [Wysyłanie plików na czatach grupowych](#sending-files-in-group-chats)). Ankiety są wysyłane za pomocą Adaptive Cards. Akcje wiadomości udostępniają jawne `upload-file` dla wysyłek zorientowanych na pliki.

## Plugin dołączony do pakietu

Microsoft Teams jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc w standardowej spakowanej kompilacji nie jest wymagana osobna instalacja.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera dołączonego Teams, zainstaluj go ręcznie:

```bash
openclaw plugins install @openclaw/msteams
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) obsługuje rejestrację bota, tworzenie manifestu i generowanie poświadczeń jednym poleceniem.

**1. Zainstaluj i zaloguj się**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # sprawdź, czy jesteś zalogowany i widzisz informacje o dzierżawie
```

> **Uwaga:** Teams CLI jest obecnie w wersji preview. Polecenia i flagi mogą zmieniać się między wydaniami.

**2. Uruchom tunel** (Teams nie może połączyć się z localhost)

Zainstaluj i uwierzytelnij CLI devtunnel, jeśli jeszcze tego nie zrobiono ([przewodnik na start](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Konfiguracja jednorazowa (trwały URL między sesjami):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Każda sesja deweloperska:
devtunnel host my-openclaw-bot
# Twój endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **Uwaga:** `--allow-anonymous` jest wymagane, ponieważ Teams nie może uwierzytelniać się z devtunnels. Każde przychodzące żądanie do bota jest nadal automatycznie weryfikowane przez SDK Teams.

Alternatywy: `ngrok http 3978` lub `tailscale funnel 3978` (ale mogą zmieniać URL w każdej sesji).

**3. Utwórz aplikację**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

To pojedyncze polecenie:

- Tworzy aplikację Entra ID (Azure AD)
- Generuje client secret
- Buduje i przesyła manifest aplikacji Teams (z ikonami)
- Rejestruje bota (domyślnie zarządzanego przez Teams — bez potrzeby subskrypcji Azure)

Dane wyjściowe pokażą `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` oraz **Teams App ID** — zanotuj je do kolejnych kroków. Oferowane jest także bezpośrednie zainstalowanie aplikacji w Teams.

**4. Skonfiguruj OpenClaw** za pomocą poświadczeń z danych wyjściowych:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Lub użyj bezpośrednio zmiennych środowiskowych: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Zainstaluj aplikację w Teams**

`teams app create` poprosi o zainstalowanie aplikacji — wybierz „Install in Teams”. Jeśli to pominięto, możesz później pobrać link:

```bash
teams app get <teamsAppId> --install-link
```

**6. Sprawdź, czy wszystko działa**

```bash
teams app doctor <teamsAppId>
```

To uruchamia diagnostykę obejmującą rejestrację bota, konfigurację aplikacji AAD, poprawność manifestu i konfigurację SSO.

W przypadku wdrożeń produkcyjnych rozważ użycie [uwierzytelniania federacyjnego](#federated-authentication-certificate--managed-identity) (certyfikat lub tożsamość zarządzana) zamiast client secret.

Uwaga: czaty grupowe są domyślnie blokowane (`channels.msteams.groupPolicy: "allowlist"`). Aby zezwolić na odpowiedzi grupowe, ustaw `channels.msteams.groupAllowFrom` (lub użyj `groupPolicy: "open"`, aby zezwolić dowolnemu członkowi, z bramkowaniem wzmianką).

## Cele

- Rozmawiaj z OpenClaw przez DM-y Teams, czaty grupowe lub kanały.
- Zachowaj deterministyczny routing: odpowiedzi zawsze wracają na kanał, z którego przyszły.
- Domyślnie stosuj bezpieczne zachowanie kanału (wzmianki są wymagane, chyba że skonfigurowano inaczej).

## Zapisy konfiguracji

Domyślnie Microsoft Teams może zapisywać aktualizacje konfiguracji wywołane przez `/config set|unset` (wymaga `commands.config: true`).

Wyłącz za pomocą:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrola dostępu (DM-y + grupy)

**Dostęp do DM**

- Domyślnie: `channels.msteams.dmPolicy = "pairing"`. Nieznani nadawcy są ignorowani do momentu zatwierdzenia.
- `channels.msteams.allowFrom` powinno używać stabilnych identyfikatorów obiektów AAD.
- Nie polegaj na dopasowywaniu UPN/nazwy wyświetlanej przy allowlistach — mogą się zmieniać. OpenClaw domyślnie wyłącza bezpośrednie dopasowywanie nazw; włącz je jawnie przez `channels.msteams.dangerouslyAllowNameMatching: true`.
- Kreator może rozwiązywać nazwy do identyfikatorów przez Microsoft Graph, gdy poświadczenia na to pozwalają.

**Dostęp do grup**

- Domyślnie: `channels.msteams.groupPolicy = "allowlist"` (zablokowane, dopóki nie dodasz `groupAllowFrom`). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- `channels.msteams.groupAllowFrom` kontroluje, którzy nadawcy mogą wywoływać działanie na czatach grupowych/kanałach (z fallbackiem do `channels.msteams.allowFrom`).
- Ustaw `groupPolicy: "open"`, aby zezwolić każdemu członkowi (domyślnie nadal z bramkowaniem wzmianką).
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

**Allowlista Teams + kanału**

- Ogranicz odpowiedzi grupowe/kanałowe, podając zespoły i kanały w `channels.msteams.teams`.
- Klucze powinny używać stabilnych identyfikatorów zespołu i identyfikatorów konwersacji kanału.
- Gdy `groupPolicy="allowlist"` i obecna jest allowlista zespołów, akceptowane są tylko wymienione zespoły/kanały (z bramkowaniem wzmianką).
- Kreator konfiguracji akceptuje wpisy `Team/Channel` i zapisuje je za Ciebie.
- Przy uruchomieniu OpenClaw rozwiązuje nazwy zespołów/kanałów i użytkowników z allowlist do identyfikatorów (gdy pozwalają na to uprawnienia Graph)
  i zapisuje mapowanie w logach; nierozwiązane nazwy zespołów/kanałów pozostają zapisane tak, jak wpisano, ale domyślnie są ignorowane przy routingu, chyba że włączono `channels.msteams.dangerouslyAllowNameMatching: true`.

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

<details>
<summary><strong>Konfiguracja ręczna (bez Teams CLI)</strong></summary>

Jeśli nie możesz użyć Teams CLI, możesz skonfigurować bota ręcznie przez Azure Portal.

### Jak to działa

1. Upewnij się, że Plugin Microsoft Teams jest dostępny (dołączony w bieżących wydaniach).
2. Utwórz **Azure Bot** (App ID + secret + tenant ID).
3. Zbuduj **pakiet aplikacji Teams**, który odwołuje się do bota i zawiera poniższe uprawnienia RSC.
4. Prześlij/zainstaluj aplikację Teams w zespole (lub w zakresie osobistym dla DM-ów).
5. Skonfiguruj `msteams` w `~/.openclaw/openclaw.json` (lub zmiennych środowiskowych) i uruchom Gateway.
6. Gateway domyślnie nasłuchuje ruchu webhook Bot Framework na `/api/messages`.

### Krok 1: Utwórz Azure Bot

1. Przejdź do [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Wypełnij kartę **Basics**:

   | Field              | Wartość                                                  |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nazwa Twojego bota, np. `openclaw-msteams` (musi być unikalna) |
   | **Subscription**   | Wybierz swoją subskrypcję Azure                          |
   | **Resource group** | Utwórz nową lub użyj istniejącej                         |
   | **Pricing tier**   | **Free** dla developmentu/testów                         |
   | **Type of App**    | **Single Tenant** (zalecane — zobacz uwagę poniżej)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Informacja o wycofaniu:** Tworzenie nowych botów wielodostępnych zostało wycofane po 2025-07-31. Dla nowych botów używaj **Single Tenant**.

3. Kliknij **Review + create** → **Create** (poczekaj około 1–2 minuty)

### Krok 2: Pobierz poświadczenia

1. Przejdź do zasobu Azure Bot → **Configuration**
2. Skopiuj **Microsoft App ID** → to będzie Twoje `appId`
3. Kliknij **Manage Password** → przejdź do rejestracji aplikacji
4. W sekcji **Certificates & secrets** → **New client secret** → skopiuj **Value** → to będzie Twoje `appPassword`
5. Przejdź do **Overview** → skopiuj **Directory (tenant) ID** → to będzie Twoje `tenantId`

### Krok 3: Skonfiguruj endpoint wiadomości

1. W Azure Bot → **Configuration**
2. Ustaw **Messaging endpoint** na URL webhooka:
   - Produkcja: `https://your-domain.com/api/messages`
   - Lokalny development: użyj tunelu (zobacz [Rozwój lokalny](#local-development-tunneling) poniżej)

### Krok 4: Włącz kanał Teams

1. W Azure Bot → **Channels**
2. Kliknij **Microsoft Teams** → Configure → Save
3. Zaakceptuj Terms of Service

### Krok 5: Zbuduj manifest aplikacji Teams

- Dodaj wpis `bot` z `botId = <App ID>`.
- Zakresy: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (wymagane dla obsługi plików w zakresie osobistym).
- Dodaj uprawnienia RSC (zobacz [Uprawnienia RSC](#current-teams-rsc-permissions-manifest)).
- Utwórz ikony: `outline.png` (32x32) i `color.png` (192x192).
- Spakuj wszystkie trzy pliki razem: `manifest.json`, `outline.png`, `color.png`.

### Krok 6: Skonfiguruj OpenClaw

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

Zmienne środowiskowe: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Krok 7: Uruchom Gateway

Kanał Teams uruchamia się automatycznie, gdy Plugin jest dostępny i konfiguracja `msteams` zawiera poświadczenia.

</details>

## Uwierzytelnianie federacyjne (certyfikat + tożsamość zarządzana)

> Dodano w 2026.3.24

Dla wdrożeń produkcyjnych OpenClaw obsługuje **uwierzytelnianie federacyjne** jako bezpieczniejszą alternatywę dla client secret. Dostępne są dwie metody:

### Opcja A: Uwierzytelnianie oparte na certyfikacie

Użyj certyfikatu PEM zarejestrowanego w rejestracji aplikacji Entra ID.

**Konfiguracja:**

1. Wygeneruj lub pozyskaj certyfikat (format PEM z kluczem prywatnym).
2. W Entra ID → App Registration → **Certificates & secrets** → **Certificates** → prześlij certyfikat publiczny.

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

Użyj Azure Managed Identity do uwierzytelniania bez haseł. To rozwiązanie idealnie nadaje się do wdrożeń na infrastrukturze Azure (AKS, App Service, maszyny wirtualne Azure), gdzie dostępna jest tożsamość zarządzana.

**Jak to działa:**

1. Pod/VM bota ma tożsamość zarządzaną (przypisaną przez system lub użytkownika).
2. **Poświadczenie tożsamości federacyjnej** łączy tożsamość zarządzaną z rejestracją aplikacji Entra ID.
3. W czasie działania OpenClaw używa `@azure/identity` do pobierania tokenów z endpointu Azure IMDS (`169.254.169.254`).
4. Token jest przekazywany do SDK Teams na potrzeby uwierzytelniania bota.

**Wymagania wstępne:**

- Infrastruktura Azure z włączoną tożsamością zarządzaną (AKS workload identity, App Service, VM)
- Poświadczenie tożsamości federacyjnej utworzone w rejestracji aplikacji Entra ID
- Dostęp sieciowy do IMDS (`169.254.169.254:80`) z poda/VM

**Config (tożsamość zarządzana przypisana przez system):**

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

**Config (tożsamość zarządzana przypisana przez użytkownika):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (tylko dla MI przypisanej przez użytkownika)

### Konfiguracja AKS Workload Identity

Dla wdrożeń AKS używających workload identity:

1. **Włącz workload identity** w klastrze AKS.
2. **Utwórz poświadczenie tożsamości federacyjnej** w rejestracji aplikacji Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Dodaj adnotację do konta usługi Kubernetes** z identyfikatorem klienta aplikacji:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Dodaj etykietę do poda** dla wstrzykiwania workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zapewnij dostęp sieciowy** do IMDS (`169.254.169.254`) — jeśli używasz NetworkPolicy, dodaj regułę wyjściową zezwalającą na ruch do `169.254.169.254/32` na porcie 80.

### Porównanie typów uwierzytelniania

| Method               | Config                                         | Zalety                            | Wady                                  |
| -------------------- | ---------------------------------------------- | --------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Prosta konfiguracja               | Wymagana rotacja sekretu, mniejsze bezpieczeństwo |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Brak współdzielonego sekretu w sieci | Narzut związany z zarządzaniem certyfikatami |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Uwierzytelnianie bez haseł, brak sekretów do zarządzania | Wymagana infrastruktura Azure |

**Zachowanie domyślne:** Gdy `authType` nie jest ustawione, OpenClaw domyślnie używa uwierzytelniania client secret. Istniejące konfiguracje nadal działają bez zmian.

## Rozwój lokalny (tunelowanie)

Teams nie może połączyć się z `localhost`. Użyj trwałego tunelu deweloperskiego, aby URL pozostawał taki sam między sesjami:

```bash
# Konfiguracja jednorazowa:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Każda sesja deweloperska:
devtunnel host my-openclaw-bot
```

Alternatywy: `ngrok http 3978` lub `tailscale funnel 3978` (URL mogą zmieniać się w każdej sesji).

Jeśli URL tunelu się zmieni, zaktualizuj endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Testowanie bota

**Uruchom diagnostykę:**

```bash
teams app doctor <teamsAppId>
```

W jednym przebiegu sprawdza rejestrację bota, aplikację AAD, manifest i konfigurację SSO.

**Wyślij wiadomość testową:**

1. Zainstaluj aplikację Teams (użyj linku instalacyjnego z `teams app get <id> --install-link`)
2. Znajdź bota w Teams i wyślij DM
3. Sprawdź logi Gateway pod kątem przychodzącej aktywności

## Zmienne środowiskowe

Wszystkie klucze konfiguracji można ustawić także przez zmienne środowiskowe:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opcjonalnie: `"secret"` lub `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certyfikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcjonalne, niewymagane do uwierzytelniania)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (tylko MI przypisana przez użytkownika)

## Akcja informacji o członku

OpenClaw udostępnia dla Microsoft Teams akcję `member-info` opartą na Graph, dzięki czemu agenci i automatyzacje mogą bezpośrednio z Microsoft Graph rozwiązywać szczegóły członków kanału (nazwa wyświetlana, e-mail, rola).

Wymagania:

- Uprawnienie RSC `Member.Read.Group` (już obecne w zalecanym manifeście)
- Dla wyszukiwań między zespołami: uprawnienie aplikacyjne Graph `User.Read.All` z zgodą administratora

Akcja jest kontrolowana przez `channels.msteams.actions.memberInfo` (domyślnie: włączona, gdy dostępne są poświadczenia Graph).

## Kontekst historii

- `channels.msteams.historyLimit` kontroluje, ile ostatnich wiadomości kanałowych/grupowych jest opakowywanych do promptu.
- Z fallbackiem do `messages.groupChat.historyLimit`. Ustaw `0`, aby wyłączyć (domyślnie 50).
- Pobrana historia wątku jest filtrowana przez allowlisty nadawców (`allowFrom` / `groupAllowFrom`), więc zasiewanie kontekstu wątku obejmuje tylko wiadomości od dozwolonych nadawców.
- Cytowany kontekst załączników (`ReplyTo*` pochodzący z HTML odpowiedzi Teams) jest obecnie przekazywany w otrzymanej postaci.
- Innymi słowy, allowlisty kontrolują, kto może wywołać agenta; obecnie filtrowane są tylko określone ścieżki kontekstu uzupełniającego.
- Historię DM można ograniczyć przez `channels.msteams.dmHistoryLimit` (tury użytkownika). Nadpisania per użytkownik: `channels.msteams.dms["<user_id>"].historyLimit`.

## Bieżące uprawnienia Teams RSC (manifest)

To są **istniejące uprawnienia resourceSpecific** w naszym manifeście aplikacji Teams. Obowiązują one tylko wewnątrz zespołu/czatu, w którym aplikacja jest zainstalowana.

**Dla kanałów (zakres zespołu):**

- `ChannelMessage.Read.Group` (Application) - odbieranie wszystkich wiadomości kanałowych bez @wzmianki
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Dla czatów grupowych:**

- `ChatMessage.Read.Chat` (Application) - odbieranie wszystkich wiadomości czatu grupowego bez @wzmianki

Aby dodać uprawnienia RSC przez Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Przykładowy manifest Teams (redakcja)

Minimalny, poprawny przykład z wymaganymi polami. Zastąp identyfikatory i URL.

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
- `authorization.permissions.resourceSpecific` musi zawierać uprawnienia odczytu/wysyłania kanałowego, jeśli chcesz obsługiwać ruch kanałowy.

### Aktualizacja istniejącej aplikacji

Aby zaktualizować już zainstalowaną aplikację Teams (np. w celu dodania uprawnień RSC):

```bash
# Pobierz, edytuj i ponownie prześlij manifest
teams app manifest download <teamsAppId> manifest.json
# Edytuj lokalnie manifest.json...
teams app manifest upload manifest.json <teamsAppId>
# Wersja jest automatycznie zwiększana, jeśli treść się zmieniła
```

Po aktualizacji zainstaluj ponownie aplikację w każdym zespole, aby nowe uprawnienia zaczęły obowiązywać, i **całkowicie zamknij i ponownie uruchom Teams** (nie tylko zamknij okno), aby wyczyścić pamięć podręczną metadanych aplikacji.

<details>
<summary>Ręczna aktualizacja manifestu (bez CLI)</summary>

1. Zaktualizuj `manifest.json` o nowe ustawienia
2. **Zwiększ pole `version`** (np. `1.0.0` → `1.1.0`)
3. **Ponownie spakuj** manifest z ikonami (`manifest.json`, `outline.png`, `color.png`)
4. Prześlij nowy plik zip:
   - **Teams Admin Center:** Teams apps → Manage apps → znajdź swoją aplikację → Upload new version
   - **Sideload:** w Teams → Apps → Manage your apps → Upload a custom app

</details>

## Możliwości: tylko RSC vs Graph

### Z użyciem **tylko Teams RSC** (aplikacja zainstalowana, bez uprawnień Microsoft Graph API)

Działa:

- Odczyt **tekstu** wiadomości kanałowych.
- Wysyłanie **tekstu** wiadomości kanałowych.
- Odbieranie załączników plikowych **w zakresie osobistym (DM)**.

Nie działa:

- Zawartość **obrazów lub plików** w kanałach/grupach (payload zawiera tylko stub HTML).
- Pobieranie załączników przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości (poza zdarzeniem webhook na żywo).

### Z użyciem **Teams RSC + uprawnień aplikacyjnych Microsoft Graph**

Dodaje:

- Pobieranie hostowanej zawartości (obrazy wklejone do wiadomości).
- Pobieranie załączników plikowych przechowywanych w SharePoint/OneDrive.
- Odczyt historii wiadomości kanału/czatu przez Graph.

### RSC vs Graph API

| Capability              | Uprawnienia RSC       | Graph API                            |
| ----------------------- | --------------------- | ------------------------------------ |
| **Wiadomości w czasie rzeczywistym** | Tak (przez webhook)   | Nie (tylko polling)                  |
| **Wiadomości historyczne** | Nie                   | Tak (możliwość odpytywania historii) |
| **Złożoność konfiguracji** | Tylko manifest aplikacji | Wymaga zgody administratora + przepływu tokenów |
| **Działa offline**      | Nie (musi działać)    | Tak (zapytania w dowolnym momencie)  |

**Podsumowanie:** RSC służy do nasłuchiwania w czasie rzeczywistym; Graph API służy do dostępu historycznego. Aby nadrobić pominięte wiadomości podczas pracy offline, potrzebujesz Graph API z `ChannelMessage.Read.All` (wymaga zgody administratora).

## Multimedia i historia z włączonym Graph (wymagane dla kanałów)

Jeśli potrzebujesz obrazów/plików w **kanałach** lub chcesz pobierać **historię wiadomości**, musisz włączyć uprawnienia Microsoft Graph i udzielić zgody administratora.

1. W **App Registration** Entra ID (Azure AD) dodaj uprawnienia aplikacyjne Microsoft Graph:
   - `ChannelMessage.Read.All` (załączniki kanałowe + historia)
   - `Chat.Read.All` lub `ChatMessage.Read.All` (czaty grupowe)
2. **Udziel zgody administratora** dla dzierżawy.
3. Zwiększ **wersję manifestu** aplikacji Teams, prześlij go ponownie i **zainstaluj ponownie aplikację w Teams**.
4. **Całkowicie zamknij i ponownie uruchom Teams**, aby wyczyścić pamięć podręczną metadanych aplikacji.

**Dodatkowe uprawnienie dla wzmianek użytkowników:** @wzmianki użytkowników działają od razu dla użytkowników obecnych w rozmowie. Jeśli jednak chcesz dynamicznie wyszukiwać i oznaczać użytkowników, którzy **nie są w bieżącej rozmowie**, dodaj uprawnienie aplikacyjne `User.Read.All` i udziel zgody administratora.

## Znane ograniczenia

### Limity czasu webhooka

Teams dostarcza wiadomości przez webhook HTTP. Jeśli przetwarzanie trwa zbyt długo (np. przy wolnych odpowiedziach LLM), możesz zobaczyć:

- Przekroczenia limitu czasu Gateway
- Ponowne próby dostarczenia wiadomości przez Teams (powodujące duplikaty)
- Utracone odpowiedzi

OpenClaw obsługuje to, zwracając odpowiedź szybko i wysyłając odpowiedzi proaktywnie, ale bardzo wolne odpowiedzi nadal mogą powodować problemy.

### Formatowanie

Markdown Teams jest bardziej ograniczony niż w Slack lub Discord:

- Podstawowe formatowanie działa: **pogrubienie**, _kursywa_, `code`, linki
- Złożony markdown (tabele, listy zagnieżdżone) może nie renderować się poprawnie
- Adaptive Cards są obsługiwane dla ankiet i wysyłek prezentacji semantycznych (zobacz poniżej)

## Konfiguracja

Kluczowe ustawienia (zobacz `/gateway/configuration`, aby poznać współdzielone wzorce kanałów):

- `channels.msteams.enabled`: włącz/wyłącz kanał.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: poświadczenia bota.
- `channels.msteams.webhook.port` (domyślnie `3978`)
- `channels.msteams.webhook.path` (domyślnie `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing)
- `channels.msteams.allowFrom`: lista dozwolonych dla DM (zalecane identyfikatory obiektów AAD). Kreator podczas konfiguracji rozwiązuje nazwy na identyfikatory, gdy dostępny jest dostęp do Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: przełącznik awaryjny do ponownego włączenia dopasowywania zmiennych UPN/nazw wyświetlanych oraz bezpośredniego routingu nazw zespołów/kanałów.
- `channels.msteams.textChunkLimit`: rozmiar fragmentu tekstu wychodzącego.
- `channels.msteams.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych wierszach (granice akapitów) przed dzieleniem według długości.
- `channels.msteams.mediaAllowHosts`: lista dozwolonych hostów dla przychodzących załączników (domyślnie domeny Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista dozwolonych hostów do dołączania nagłówków Authorization przy ponownych próbach pobrania multimediów (domyślnie hosty Graph + Bot Framework).
- `channels.msteams.requireMention`: wymagaj @wzmianki w kanałach/grupach (domyślnie true).
- `channels.msteams.replyStyle`: `thread | top-level` (zobacz [Styl odpowiedzi](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: nadpisanie per zespół.
- `channels.msteams.teams.<teamId>.requireMention`: nadpisanie per zespół.
- `channels.msteams.teams.<teamId>.tools`: domyślne nadpisania zasad narzędzi per zespół (`allow`/`deny`/`alsoAllow`) używane, gdy brakuje nadpisania kanału.
- `channels.msteams.teams.<teamId>.toolsBySender`: domyślne nadpisania zasad narzędzi per zespół i nadawcę (obsługiwany wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: nadpisanie per kanał.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: nadpisanie per kanał.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: nadpisania zasad narzędzi per kanał (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: nadpisania zasad narzędzi per kanał i nadawcę (obsługiwany wildcard `"*"`).
- Klucze `toolsBySender` powinny używać jawnych prefiksów:
  `id:`, `e164:`, `username:`, `name:` (starsze klucze bez prefiksu nadal mapują się tylko do `id:`).
- `channels.msteams.actions.memberInfo`: włącz lub wyłącz akcję informacji o członku opartą na Graph (domyślnie: włączona, gdy dostępne są poświadczenia Graph).
- `channels.msteams.authType`: typ uwierzytelniania — `"secret"` (domyślnie) lub `"federated"`.
- `channels.msteams.certificatePath`: ścieżka do pliku certyfikatu PEM (federated + uwierzytelnianie certyfikatem).
- `channels.msteams.certificateThumbprint`: odcisk certyfikatu (opcjonalny, niewymagany do uwierzytelniania).
- `channels.msteams.useManagedIdentity`: włącz uwierzytelnianie managed identity (tryb federated).
- `channels.msteams.managedIdentityClientId`: identyfikator klienta dla tożsamości zarządzanej przypisanej przez użytkownika.
- `channels.msteams.sharePointSiteId`: identyfikator witryny SharePoint do przesyłania plików na czatach grupowych/kanałach (zobacz [Wysyłanie plików na czatach grupowych](#sending-files-in-group-chats)).

## Routing i sesje

- Klucze sesji używają standardowego formatu agenta (zobacz [/concepts/session](/pl/concepts/session)):
  - Wiadomości bezpośrednie współdzielą sesję główną (`agent:<agentId>:<mainKey>`).
  - Wiadomości kanałowe/grupowe używają identyfikatora konwersacji:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Styl odpowiedzi: wątki vs posty

Teams niedawno wprowadził dwa style UI kanałów na tym samym bazowym modelu danych:

| Style                    | Opis                                                      | Zalecane `replyStyle`    |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (klasyczny)    | Wiadomości pojawiają się jako karty z odpowiedziami w wątku pod spodem | `thread` (domyślnie) |
| **Threads** (jak Slack)  | Wiadomości płyną liniowo, bardziej jak w Slack            | `top-level`              |

**Problem:** API Teams nie ujawnia, którego stylu UI używa kanał. Jeśli użyjesz niewłaściwego `replyStyle`:

- `thread` w kanale w stylu Threads → odpowiedzi pojawiają się niezręcznie zagnieżdżone
- `top-level` w kanale w stylu Posts → odpowiedzi pojawiają się jako osobne posty najwyższego poziomu zamiast w wątku

**Rozwiązanie:** Skonfiguruj `replyStyle` per kanał na podstawie sposobu skonfigurowania kanału:

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

**Bieżące ograniczenia:**

- **DM-y:** obrazy i załączniki plikowe działają przez API plików bota Teams.
- **Kanały/grupy:** załączniki znajdują się w pamięci M365 (SharePoint/OneDrive). Payload webhooka zawiera tylko stub HTML, a nie rzeczywiste bajty pliku. **Do pobierania załączników kanałowych wymagane są uprawnienia Graph API**.
- W przypadku jawnych wysyłek zorientowanych na pliki użyj `action=upload-file` z `media` / `filePath` / `path`; opcjonalne `message` staje się towarzyszącym tekstem/komentarzem, a `filename` nadpisuje przesyłaną nazwę.

Bez uprawnień Graph wiadomości kanałowe z obrazami będą odbierane tylko jako tekst (zawartość obrazu nie jest dostępna dla bota).
Domyślnie OpenClaw pobiera multimedia tylko z nazw hostów Microsoft/Teams. Nadpisz to przez `channels.msteams.mediaAllowHosts` (użyj `["*"]`, aby zezwolić na dowolny host).
Nagłówki Authorization są dołączane tylko dla hostów w `channels.msteams.mediaAuthAllowHosts` (domyślnie hosty Graph + Bot Framework). Zachowaj ścisłość tej listy (unikaj sufiksów wielodostępnych).

## Wysyłanie plików na czatach grupowych

Boty mogą wysyłać pliki w DM-ach przy użyciu przepływu FileConsentCard (wbudowany). Jednak **wysyłanie plików na czatach grupowych/kanałach** wymaga dodatkowej konfiguracji:

| Context                  | Jak pliki są wysyłane                       | Wymagana konfiguracja                            |
| ------------------------ | ------------------------------------------- | ------------------------------------------------ |
| **DM-y**                 | FileConsentCard → użytkownik akceptuje → bot przesyła | Działa od razu                             |
| **Czaty grupowe/kanały** | Prześlij do SharePoint → udostępnij link    | Wymaga `sharePointSiteId` + uprawnień Graph      |
| **Obrazy (dowolny kontekst)** | Zakodowane inline w Base64             | Działa od razu                                   |

### Dlaczego czaty grupowe wymagają SharePoint

Boty nie mają osobistego dysku OneDrive (endpoint Graph API `/me/drive` nie działa dla tożsamości aplikacji). Aby wysyłać pliki na czatach grupowych/kanałach, bot przesyła je do **witryny SharePoint** i tworzy link udostępniania.

### Konfiguracja

1. **Dodaj uprawnienia Graph API** w Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - przesyłanie plików do SharePoint
   - `Chat.Read.All` (Application) - opcjonalne, włącza linki udostępniania per użytkownik

2. **Udziel zgody administratora** dla dzierżawy.

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

| Permission                              | Zachowanie udostępniania                                  |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` tylko             | Link udostępniania dla całej organizacji (każdy w organizacji ma dostęp) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link udostępniania per użytkownik (dostęp mają tylko członkowie czatu)  |

Udostępnianie per użytkownik jest bezpieczniejsze, ponieważ tylko uczestnicy czatu mają dostęp do pliku. Jeśli brakuje uprawnienia `Chat.Read.All`, bot przełącza się na udostępnianie dla całej organizacji.

### Zachowanie awaryjne

| Scenario                                          | Wynik                                             |
| ------------------------------------------------- | ------------------------------------------------- |
| Czat grupowy + plik + skonfigurowane `sharePointSiteId` | Prześlij do SharePoint, wyślij link udostępniania |
| Czat grupowy + plik + brak `sharePointSiteId`     | Spróbuj przesłać do OneDrive (może się nie udać), wyślij tylko tekst |
| Czat osobisty + plik                              | Przepływ FileConsentCard (działa bez SharePoint)  |
| Dowolny kontekst + obraz                          | Zakodowany inline w Base64 (działa bez SharePoint) |

### Lokalizacja przechowywania plików

Przesłane pliki są przechowywane w folderze `/OpenClawShared/` w domyślnej bibliotece dokumentów skonfigurowanej witryny SharePoint.

## Ankiety (Adaptive Cards)

OpenClaw wysyła ankiety Teams jako Adaptive Cards (nie ma natywnego API ankiet Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Głosy są zapisywane przez Gateway w `~/.openclaw/msteams-polls.json`.
- Gateway musi pozostawać online, aby zapisywać głosy.
- Ankiety nie publikują jeszcze automatycznie podsumowań wyników (w razie potrzeby sprawdź plik magazynu).

## Karty prezentacji

Wysyłaj semantyczne payloady prezentacji do użytkowników lub konwersacji Teams za pomocą narzędzia `message` lub CLI. OpenClaw renderuje je jako Teams Adaptive Cards z ogólnego kontraktu prezentacji.

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

Szczegóły formatu celu znajdziesz poniżej w sekcji [Formaty celu](#target-formats).

## Formaty celu

Cele MSTeams używają prefiksów do rozróżniania użytkowników i konwersacji:

| Target type         | Format                           | Przykład                                            |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Użytkownik (według ID) | `user:<aad-object-id>`        | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Użytkownik (według nazwy) | `user:<display-name>`     | `user:John Smith` (wymaga Graph API)               |
| Grupa/kanał         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Grupa/kanał (surowy) | `<conversation-id>`             | `19:abc123...@thread.tacv2` (jeśli zawiera `@thread`) |

**Przykłady CLI:**

```bash
# Wyślij do użytkownika według ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Wyślij do użytkownika według nazwy wyświetlanej (wywołuje wyszukiwanie przez Graph API)
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

Uwaga: bez prefiksu `user:` nazwy domyślnie są rozwiązywane jako grupa/zespół. Zawsze używaj `user:`, gdy kierujesz wiadomość do osób według nazwy wyświetlanej.

## Wiadomości proaktywne

- Wiadomości proaktywne są możliwe **dopiero po** interakcji użytkownika, ponieważ wtedy zapisujemy odwołania do konwersacji.
- Zobacz `/gateway/configuration`, aby poznać ustawienia `dmPolicy` i bramkowania allowlist.

## Identyfikatory zespołów i kanałów (częsta pułapka)

Parametr zapytania `groupId` w URL-ach Teams **NIE** jest identyfikatorem zespołu używanym do konfiguracji. Zamiast tego wyodrębnij identyfikatory ze ścieżki URL:

**URL zespołu:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID zespołu (zdekoduj ten URL)
```

**URL kanału:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID kanału (zdekoduj ten URL)
```

**Do konfiguracji:**

- ID zespołu = segment ścieżki po `/team/` (po dekodowaniu URL, np. `19:Bk4j...@thread.tacv2`)
- ID kanału = segment ścieżki po `/channel/` (po dekodowaniu URL)
- **Ignoruj** parametr zapytania `groupId`

## Kanały prywatne

Boty mają ograniczoną obsługę w kanałach prywatnych:

| Feature                      | Kanały standardowe | Kanały prywatne       |
| ---------------------------- | ------------------ | --------------------- |
| Instalacja bota              | Tak                | Ograniczona           |
| Wiadomości w czasie rzeczywistym (webhook) | Tak      | Mogą nie działać      |
| Uprawnienia RSC              | Tak                | Mogą działać inaczej  |
| @wzmianki                    | Tak                | Jeśli bot jest dostępny |
| Historia przez Graph API     | Tak                | Tak (z uprawnieniami) |

**Obejścia, jeśli kanały prywatne nie działają:**

1. Używaj standardowych kanałów do interakcji z botem
2. Używaj DM-ów — użytkownicy zawsze mogą napisać do bota bezpośrednio
3. Używaj Graph API do dostępu historycznego (wymaga `ChannelMessage.Read.All`)

## Rozwiązywanie problemów

### Typowe problemy

- **Obrazy nie pokazują się w kanałach:** brakuje uprawnień Graph lub zgody administratora. Zainstaluj ponownie aplikację Teams i całkowicie zamknij/otwórz ponownie Teams.
- **Brak odpowiedzi na kanale:** domyślnie wymagane są wzmianki; ustaw `channels.msteams.requireMention=false` lub skonfiguruj to per zespół/kanał.
- **Niezgodność wersji (Teams nadal pokazuje stary manifest):** usuń i dodaj ponownie aplikację oraz całkowicie zamknij Teams, aby odświeżyć.
- **401 Unauthorized z webhooka:** oczekiwane przy ręcznym testowaniu bez Azure JWT — oznacza, że endpoint jest osiągalny, ale uwierzytelnianie się nie powiodło. Do poprawnego testowania użyj Azure Web Chat.

### Błędy przesyłania manifestu

- **"Icon file cannot be empty":** manifest odwołuje się do plików ikon, które mają 0 bajtów. Utwórz prawidłowe ikony PNG (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** aplikacja jest nadal zainstalowana w innym zespole/czacie. Najpierw ją znajdź i odinstaluj albo odczekaj 5–10 minut na propagację.
- **"Something went wrong" podczas przesyłania:** zamiast tego prześlij przez [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), otwórz DevTools przeglądarki (F12) → kartę Network i sprawdź treść odpowiedzi pod kątem faktycznego błędu.
- **Niepowodzenie sideload:** spróbuj opcji „Upload an app to your org's app catalog” zamiast „Upload a custom app” — często omija to ograniczenia sideload.

### Uprawnienia RSC nie działają

1. Sprawdź, czy `webApplicationInfo.id` dokładnie odpowiada App ID Twojego bota
2. Prześlij ponownie aplikację i zainstaluj ją ponownie w zespole/czacie
3. Sprawdź, czy administrator organizacji nie zablokował uprawnień RSC
4. Potwierdź, że używasz właściwego zakresu: `ChannelMessage.Read.Group` dla zespołów, `ChatMessage.Read.Chat` dla czatów grupowych

## Dokumentacja

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - przewodnik konfiguracji Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tworzenie/zarządzanie aplikacjami Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanał/grupa wymaga Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI do zarządzania botami

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
