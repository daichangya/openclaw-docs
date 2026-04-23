---
read_when:
    - Uruchamianie OpenClaw za proxy uwzględniającym tożsamość მომხმარ пользователя
    - Konfigurowanie Pomerium, Caddy lub nginx z OAuth przed OpenClaw
    - Naprawianie błędów WebSocket 1008 unauthorized w konfiguracjach z reverse proxy
    - Decydowanie, gdzie ustawić HSTS i inne nagłówki utwardzające HTTP
summary: Deleguj uwierzytelnianie Gateway do zaufanego reverse proxy (Pomerium, Caddy, nginx + OAuth)
title: Zaufane uwierzytelnianie proxy
x-i18n:
    generated_at: "2026-04-23T10:01:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Zaufane uwierzytelnianie proxy

> ⚠️ **Funkcja wrażliwa na bezpieczeństwo.** Ten tryb całkowicie deleguje uwierzytelnianie do reverse proxy. Błędna konfiguracja może narazić Gateway na nieautoryzowany dostęp. Przed włączeniem przeczytaj tę stronę uważnie.

## Kiedy używać

Używaj trybu uwierzytelniania `trusted-proxy`, gdy:

- Uruchamiasz OpenClaw za **proxy uwzględniającym tożsamość** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Twoje proxy obsługuje całe uwierzytelnianie i przekazuje tożsamość użytkownika przez nagłówki
- Jesteś w środowisku Kubernetes lub kontenerowym, w którym proxy jest jedyną drogą do Gateway
- Napotykasz błędy WebSocket `1008 unauthorized`, ponieważ przeglądarki nie mogą przekazywać tokenów w ładunkach WS

## Kiedy NIE używać

- Jeśli Twoje proxy nie uwierzytelnia użytkowników (jest tylko terminatorem TLS lub load balancerem)
- Jeśli istnieje jakakolwiek ścieżka do Gateway omijająca proxy (luki w firewallu, dostęp z sieci wewnętrznej)
- Jeśli nie masz pewności, czy proxy poprawnie usuwa/nadpisuje przekazywane nagłówki
- Jeśli potrzebujesz tylko osobistego dostępu dla jednego użytkownika (rozważ Tailscale Serve + loopback dla prostszej konfiguracji)

## Jak to działa

1. Twoje reverse proxy uwierzytelnia użytkowników (OAuth, OIDC, SAML itp.)
2. Proxy dodaje nagłówek z tożsamością uwierzytelnionego użytkownika (np. `x-forwarded-user: nick@example.com`)
3. OpenClaw sprawdza, czy żądanie pochodzi z **zaufanego adresu IP proxy** (skonfigurowanego w `gateway.trustedProxies`)
4. OpenClaw wyodrębnia tożsamość użytkownika ze skonfigurowanego nagłówka
5. Jeśli wszystko się zgadza, żądanie zostaje autoryzowane

## Zachowanie parowania w Control UI

Gdy aktywny jest `gateway.auth.mode = "trusted-proxy"` i żądanie przejdzie
kontrole trusted-proxy, sesje WebSocket Control UI mogą łączyć się bez
tożsamości parowania urządzenia.

Konsekwencje:

- Parowanie nie jest już główną bramką dostępu do Control UI w tym trybie.
- Polityka uwierzytelniania reverse proxy i `allowUsers` stają się skuteczną kontrolą dostępu.
- Utrzymuj ingress gateway zablokowany tylko do adresów IP zaufanych proxy (`gateway.trustedProxies` + firewall).

## Konfiguracja

```json5
{
  gateway: {
    // Uwierzytelnianie trusted-proxy oczekuje żądań z nie-loopbackowego źródła zaufanego proxy
    bind: "lan",

    // KRYTYCZNE: Dodaj tutaj tylko adres(y) IP swojego proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Nagłówek zawierający tożsamość uwierzytelnionego użytkownika (wymagany)
        userHeader: "x-forwarded-user",

        // Opcjonalnie: nagłówki, które MUSZĄ być obecne (weryfikacja proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcjonalnie: ogranicz do konkretnych użytkowników (puste = zezwól wszystkim)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Ważna zasada runtime:

- Uwierzytelnianie trusted-proxy odrzuca żądania ze źródła loopback (`127.0.0.1`, `::1`, zakresy CIDR loopback).
- Reverse proxy loopback na tym samym hoście **nie** spełniają wymagań uwierzytelniania trusted-proxy.
- Dla konfiguracji proxy loopback na tym samym hoście użyj zamiast tego uwierzytelniania tokenem/hasłem albo kieruj ruch przez nie-loopbackowy adres zaufanego proxy, który OpenClaw może zweryfikować.
- Wdrożenia Control UI spoza loopback nadal wymagają jawnego `gateway.controlUi.allowedOrigins`.
- **Dowód z nagłówków forwarded ma pierwszeństwo przed lokalnością loopback.** Jeśli żądanie dociera przez loopback, ale zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` wskazujące na pochodzenie nielokalne, taki dowód unieważnia twierdzenie o lokalności loopback. Żądanie jest traktowane jako zdalne dla parowania, uwierzytelniania trusted-proxy i kontroli tożsamości urządzenia Control UI. Zapobiega to „praniu” tożsamości z nagłówków forwarded do uwierzytelniania trusted-proxy przez proxy loopback na tym samym hoście.

### Dokumentacja konfiguracji

| Field                                       | Required | Opis                                                                      |
| ------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Tak      | Tablica adresów IP proxy, którym ufasz. Żądania z innych IP są odrzucane. |
| `gateway.auth.mode`                         | Tak      | Musi mieć wartość `"trusted-proxy"`                                       |
| `gateway.auth.trustedProxy.userHeader`      | Tak      | Nazwa nagłówka zawierającego tożsamość uwierzytelnionego użytkownika      |
| `gateway.auth.trustedProxy.requiredHeaders` | Nie      | Dodatkowe nagłówki, które muszą być obecne, aby żądanie było zaufane      |
| `gateway.auth.trustedProxy.allowUsers`      | Nie      | Allowlista tożsamości użytkowników. Puste oznacza wszystkich uwierzytelnionych użytkowników. |

## Terminacja TLS i HSTS

Użyj jednego punktu terminacji TLS i ustaw tam HSTS.

### Zalecany wzorzec: terminacja TLS w proxy

Gdy reverse proxy obsługuje HTTPS dla `https://control.example.com`, ustaw
`Strict-Transport-Security` w proxy dla tej domeny.

- Dobre dopasowanie do wdrożeń wystawionych do internetu.
- Utrzymuje certyfikat i politykę utwardzania HTTP w jednym miejscu.
- OpenClaw może pozostać na loopback HTTP za proxy.

Przykładowa wartość nagłówka:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminacja TLS w Gateway

Jeśli sam OpenClaw bezpośrednio obsługuje HTTPS (bez proxy terminującego TLS), ustaw:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` akceptuje tekstową wartość nagłówka albo `false`, aby jawnie wyłączyć.

### Wskazówki wdrożeniowe

- Zacznij od krótkiego max age (na przykład `max-age=300`) podczas weryfikacji ruchu.
- Zwiększaj do długotrwałych wartości (na przykład `max-age=31536000`) dopiero po uzyskaniu wysokiej pewności.
- Dodaj `includeSubDomains` tylko wtedy, gdy każda subdomena jest gotowa na HTTPS.
- Używaj preload tylko wtedy, gdy celowo spełniasz wymagania preload dla całego zestawu domen.
- Lokalny development tylko na loopback nie korzysta z HSTS.

## Przykłady konfiguracji proxy

### Pomerium

Pomerium przekazuje tożsamość w `x-pomerium-claim-email` (lub innych nagłówkach claim) oraz JWT w `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Fragment konfiguracji Pomerium:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy z OAuth

Caddy z plugin `caddy-security` może uwierzytelniać użytkowników i przekazywać nagłówki tożsamości.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP Caddy/sidecar proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Fragment Caddyfile:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy uwierzytelnia użytkowników i przekazuje tożsamość w `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Fragment konfiguracji nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik z Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP kontenera Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Mieszana konfiguracja tokenów

OpenClaw odrzuca niejednoznaczne konfiguracje, w których jednocześnie aktywne są `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`) oraz tryb `trusted-proxy`. Mieszane konfiguracje tokenów mogą powodować, że żądania loopback będą po cichu uwierzytelniane niewłaściwą ścieżką.

Jeśli przy uruchomieniu widzisz błąd `mixed_trusted_proxy_token`:

- Usuń współdzielony token przy używaniu trybu trusted-proxy, albo
- Przełącz `gateway.auth.mode` na `"token"`, jeśli zamierzasz używać uwierzytelniania opartego na tokenie.

Uwierzytelnianie trusted-proxy dla loopback także kończy się bezpiecznym odrzuceniem: wywołujący z tego samego hosta muszą przekazać skonfigurowane nagłówki tożsamości przez zaufane proxy zamiast być po cichu uwierzytelniani.

## Nagłówek zakresów operatora

Uwierzytelnianie trusted-proxy to tryb HTTP **przenoszący tożsamość**, więc wywołujący mogą
opcjonalnie deklarować zakresy operatora przez `x-openclaw-scopes`.

Przykłady:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Zachowanie:

- Gdy nagłówek jest obecny, OpenClaw honoruje zadeklarowany zestaw zakresów.
- Gdy nagłówek jest obecny, ale pusty, żądanie deklaruje **brak** zakresów operatora.
- Gdy nagłówek jest nieobecny, zwykłe API HTTP przenoszące tożsamość wracają do standardowego domyślnego zestawu zakresów operatora.
- Trasy HTTP pluginów z uwierzytelnianiem Gateway są domyślnie węższe: gdy `x-openclaw-scopes` jest nieobecny, ich zakres runtime wraca do `operator.write`.
- Żądania HTTP pochodzące z przeglądarki nadal muszą przejść `gateway.controlUi.allowedOrigins` (lub celowy tryb zapasowy nagłówka Host) nawet po pomyślnym uwierzytelnieniu trusted-proxy.

Praktyczna zasada:

- Wysyłaj `x-openclaw-scopes` jawnie, gdy chcesz, aby żądanie trusted-proxy było
  węższe niż wartości domyślne albo gdy trasa plugin z uwierzytelnianiem Gateway potrzebuje
  czegoś silniejszego niż zakres write.

## Lista kontrolna bezpieczeństwa

Przed włączeniem uwierzytelniania trusted-proxy sprawdź:

- [ ] **Proxy jest jedyną ścieżką**: port Gateway jest odcięty firewallem od wszystkiego poza proxy
- [ ] **trustedProxies jest minimalne**: tylko rzeczywiste adresy IP Twojego proxy, nie całe podsieci
- [ ] **Brak źródła proxy loopback**: uwierzytelnianie trusted-proxy kończy się bezpiecznym odrzuceniem dla żądań ze źródła loopback
- [ ] **Proxy usuwa nagłówki**: Twoje proxy nadpisuje (nie dopisuje) nagłówki `x-forwarded-*` pochodzące od klientów
- [ ] **Terminacja TLS**: proxy obsługuje TLS; użytkownicy łączą się przez HTTPS
- [ ] **allowedOrigins jest jawne**: Control UI poza loopback używa jawnego `gateway.controlUi.allowedOrigins`
- [ ] **allowUsers jest ustawione** (zalecane): ogranicz do znanych użytkowników zamiast zezwalać każdemu uwierzytelnionemu
- [ ] **Brak mieszanej konfiguracji tokenów**: nie ustawiaj jednocześnie `gateway.auth.token` i `gateway.auth.mode: "trusted-proxy"`

## Audyt bezpieczeństwa

`openclaw security audit` oznaczy uwierzytelnianie trusted-proxy jako ustalenie o **krytycznej** ważności. To zamierzone — ma przypominać, że delegujesz bezpieczeństwo do konfiguracji proxy.

Audyt sprawdza:

- Bazowe ostrzeżenie/krytyczne przypomnienie `gateway.trusted_proxy_auth`
- Brak konfiguracji `trustedProxies`
- Brak konfiguracji `userHeader`
- Puste `allowUsers` (zezwala każdemu uwierzytelnionemu użytkownikowi)
- Wieloznaczną lub brakującą politykę pochodzenia przeglądarki na wystawionych powierzchniach Control UI

## Rozwiązywanie problemów

### `trusted_proxy_untrusted_source`

Żądanie nie pochodzi z adresu IP znajdującego się w `gateway.trustedProxies`. Sprawdź:

- Czy IP proxy jest poprawne? (adresy IP kontenerów Docker mogą się zmieniać)
- Czy przed proxy znajduje się load balancer?
- Użyj `docker inspect` lub `kubectl get pods -o wide`, aby znaleźć rzeczywiste adresy IP

### `trusted_proxy_loopback_source`

OpenClaw odrzucił żądanie trusted-proxy ze źródła loopback.

Sprawdź:

- Czy proxy łączy się z `127.0.0.1` / `::1`?
- Czy próbujesz użyć uwierzytelniania trusted-proxy z reverse proxy loopback na tym samym hoście?

Poprawka:

- Użyj uwierzytelniania tokenem/hasłem dla konfiguracji proxy loopback na tym samym hoście, albo
- Kieruj ruch przez nie-loopbackowy adres zaufanego proxy i utrzymuj ten adres IP w `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

Nagłówek użytkownika był pusty albo go brakowało. Sprawdź:

- Czy Twoje proxy jest skonfigurowane do przekazywania nagłówków tożsamości?
- Czy nazwa nagłówka jest poprawna? (bez rozróżniania wielkości liter, ale pisownia ma znaczenie)
- Czy użytkownik jest rzeczywiście uwierzytelniony w proxy?

### `trusted_proxy_missing_header_*`

Wymagany nagłówek nie był obecny. Sprawdź:

- konfigurację proxy dla tych konkretnych nagłówków
- czy nagłówki nie są gdzieś usuwane po drodze

### `trusted_proxy_user_not_allowed`

Użytkownik jest uwierzytelniony, ale nie znajduje się w `allowUsers`. Dodaj go albo usuń allowlistę.

### `trusted_proxy_origin_not_allowed`

Uwierzytelnianie trusted-proxy zakończyło się powodzeniem, ale nagłówek przeglądarki `Origin` nie przeszedł kontroli pochodzenia Control UI.

Sprawdź:

- `gateway.controlUi.allowedOrigins` zawiera dokładne pochodzenie przeglądarki
- nie polegasz na wieloznacznych pochodzeniach, chyba że celowo chcesz zachowanie zezwalające na wszystko
- jeśli celowo używasz trybu zapasowego nagłówka Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` jest ustawione świadomie

### WebSocket nadal nie działa

Upewnij się, że Twoje proxy:

- obsługuje uaktualnienia WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- przekazuje nagłówki tożsamości przy żądaniach uaktualnienia WebSocket (nie tylko HTTP)
- nie ma oddzielnej ścieżki uwierzytelniania dla połączeń WebSocket

## Migracja z uwierzytelniania tokenem

Jeśli przechodzisz z uwierzytelniania tokenem na trusted-proxy:

1. Skonfiguruj proxy tak, aby uwierzytelniało użytkowników i przekazywało nagłówki
2. Przetestuj konfigurację proxy niezależnie (`curl` z nagłówkami)
3. Zaktualizuj konfigurację OpenClaw o uwierzytelnianie trusted-proxy
4. Uruchom ponownie Gateway
5. Przetestuj połączenia WebSocket z Control UI
6. Uruchom `openclaw security audit` i przejrzyj ustalenia

## Powiązane

- [Bezpieczeństwo](/pl/gateway/security) — pełny przewodnik po bezpieczeństwie
- [Konfiguracja](/pl/gateway/configuration) — dokumentacja konfiguracji
- [Dostęp zdalny](/pl/gateway/remote) — inne wzorce dostępu zdalnego
- [Tailscale](/pl/gateway/tailscale) — prostsza alternatywa dla dostępu tylko w tailnet
