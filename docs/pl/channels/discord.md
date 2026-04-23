---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Stan obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-04-23T09:55:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: gotowe do DM-ów i kanałów serwerowych przez oficjalną bramę Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Discord DM-y domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i przepływ naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw go utwórz](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Create My Own > For me and my friends**).

<Steps>
  <Step title="Utwórz aplikację i bota Discord">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nadaj jej nazwę, na przykład „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na nazwę, której używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz uprzywilejowane intencje">
    Nadal na stronie **Bot**, przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazwy do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji statusu)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem do góry na stronie **Bot** i kliknij **Reset Token**.

    <Note>
    Wbrew nazwie spowoduje to wygenerowanie pierwszego tokena — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i będzie Ci zaraz potrzebny.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do swojego serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do swojego serwera.

    Przewiń w dół do **OAuth2 URL Generator** i włącz:

    - `bot`
    - `applications.commands`

    Poniżej pojawi się sekcja **Bot Permissions**. Włącz co najmniej:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcjonalne)

    Jest to podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach pracy kanałów forum lub mediów, które tworzą lub kontynuują wątek, włącz także **Send Messages in Threads**.
    Skopiuj wygenerowany URL na dole, wklej go do przeglądarki, wybierz swój serwer i kliknij **Continue**, aby nawiązać połączenie. Powinieneś teraz zobaczyć swojego bota na serwerze Discord.

  </Step>

  <Step title="Włącz tryb deweloperski i zbierz swoje ID">
    Po powrocie do aplikacji Discord musisz włączyć Developer Mode, aby móc kopiować wewnętrzne ID.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem myszy ikonę swojego **serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem myszy swój **własny awatar** → **Copy User ID**

    Zapisz swoje **Server ID** i **User ID** razem z Bot Token — w następnym kroku przekażesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na DM-y od członków serwera">
    Aby parowanie działało, Discord musi pozwolić Twojemu botowi wysłać Ci DM. Kliknij prawym przyciskiem myszy ikonę swojego **serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci DM-y. Pozostaw tę opcję włączoną, jeśli chcesz używać Discord DM-ów z OpenClaw. Jeśli planujesz używać tylko kanałów serwerowych, możesz wyłączyć DM-y po sparowaniu.

  </Step>

  <Step title="Ustaw bezpiecznie token bota (nie wysyłaj go na czacie)">
    Token Twojego bota Discord jest sekretem (jak hasło). Ustaw go na maszynie, na której działa OpenClaw, zanim wyślesz wiadomość do swojego agenta.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie przez aplikację OpenClaw na Maca albo przez zatrzymanie i ponowne uruchomienie procesu `openclaw gateway run`.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu tę informację. Jeśli Discord jest Twoim pierwszym kanałem, zamiast tego użyj karty CLI / config.

        > „Ustawiłem już token mojego bota Discord w konfiguracji. Dokończ proszę konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
      </Tab>
      <Tab title="CLI / config">
        Jeśli wolisz konfigurację opartą na pliku, ustaw:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Zapasowa zmienna środowiskowa dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        Obsługiwane są jawne wartości `token`. Obsługiwane są także wartości SecretRef dla `channels.discord.token` we wszystkich providerach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zatwierdź pierwsze parowanie DM">
    Poczekaj, aż brama będzie działać, a następnie wyślij DM do swojego bota w Discord. Odpowie kodem parowania.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        Wyślij kod parowania do swojego agenta na istniejącym kanale:

        > „Zatwierdź ten kod parowania Discord: `<CODE>`”
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kody parowania wygasają po 1 godzinie.

    Powinieneś teraz móc rozmawiać ze swoim agentem przez DM w Discord.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów jest zależne od konta. Wartości tokena z konfiguracji mają pierwszeństwo przed zapasową zmienną środowiskową. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/działania kanału) jawny `token` dla pojedynczego wywołania jest używany tylko dla tego wywołania. Dotyczy to działań typu send oraz read/probe (na przykład read/search/fetch/thread/pins/permissions). Zasady konta i ustawienia ponawiania nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: Skonfiguruj przestrzeń roboczą serwera

Gdy DM-y już działają, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał ma własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteście tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    Dzięki temu agent będzie mógł odpowiadać na dowolnym kanale na Twoim serwerze, a nie tylko w DM-ach.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > „Dodaj moje Discord Server ID `<server_id>` do listy dozwolonych serwerów”
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zezwól na odpowiedzi bez @mention">
    Domyślnie agent odpowiada na kanałach serwerowych tylko wtedy, gdy zostanie oznaczony przez @mention. W przypadku prywatnego serwera prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > „Pozwól mojemu agentowi odpowiadać na tym serwerze bez konieczności użycia @mention”
      </Tab>
      <Tab title="Config">
        Ustaw `requireMention: false` w konfiguracji serwera:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zaplanuj użycie pamięci na kanałach serwerowych">
    Domyślnie pamięć długoterminowa (`MEMORY.md`) jest wczytywana tylko w sesjach DM. Kanały serwerowe nie wczytują automatycznie `MEMORY.md`.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > „Gdy zadaję pytania na kanałach Discord, używaj `memory_search` lub `memory_get`, jeśli potrzebujesz długoterminowego kontekstu z `MEMORY.md`.”
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Notatki długoterminowe przechowuj w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną odizolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` lub inne, które pasują do Twojego sposobu pracy.

## Model środowiska uruchomieniowego

- Gateway zarządza połączeniem z Discord.
- Routing odpowiedzi jest deterministyczny: wiadomości przychodzące z Discord otrzymują odpowiedzi z powrotem do Discord.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały serwerowe mają izolowane klucze sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM-y są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikowe działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), jednocześnie przenosząc `CommandTargetSessionKey` do routowanej sesji konwersacji.

## Kanały forum

Kanały forum i mediów w Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku użyje pierwszego niepustego wiersza Twojej wiadomości.
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. Nie przekazuj `--message-id` dla kanałów forum.

Przykład: wyślij do nadrzędnego forum, aby utworzyć wątek

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Przykład: jawnie utwórz wątek forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Nadrzędne fora nie akceptują komponentów Discord. Jeśli potrzebujesz komponentów, wysyłaj do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są kierowane z powrotem do agenta jako zwykłe wiadomości przychodzące i podlegają istniejącym ustawieniom Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowe. Ustaw `components.reusable=true`, aby umożliwić wielokrotne używanie przycisków, wyborów i formularzy do czasu ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (ID użytkowników Discord, tagi lub `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymają efemeryczną odmowę.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi providera i modelu oraz krokiem Submit. O ile `commands.modelsWrite=false` nie jest ustawione, `/models add` obsługuje także dodawanie nowego wpisu provider/model z poziomu czatu, a nowo dodane modele pojawiają się bez restartowania bramy. Odpowiedź selektora jest efemeryczna i tylko użytkownik, który wywołał polecenie, może z niej korzystać.

Załączniki plików:

- bloki `file` muszą wskazywać odwołanie do załącznika (`attachment://<filename>`)
- Przekaż załącznik przez `media`/`path`/`filePath` (jeden plik); użyj `media-gallery` dla wielu plików
- Użyj `filename`, aby nadpisać nazwę przesyłanego pliku, gdy powinna odpowiadać odwołaniu do załącznika

Formularze modalne:

- Dodaj `components.modal` z maksymalnie 5 polami
- Typy pól: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw automatycznie dodaje przycisk wyzwalający

Przykład:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady DM">
    `channels.discord.dmPolicy` kontroluje dostęp do DM-ów (starsza nazwa: `channels.discord.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`; starsza nazwa: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jeśli zasady DM nie są otwarte, nieznani użytkownicy są blokowani (albo proszeni o sparowanie w trybie `pairing`).

    Priorytet dla wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Format celu DM dla dostarczenia:

    - `user:<id>`
    - wzmianka `<@id>`

    Same numeryczne ID są niejednoznaczne i odrzucane, chyba że podano jawny typ celu użytkownik/kanał.

  </Tab>

  <Tab title="Zasady serwera">
    Obsługa serwerów jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczna baza, gdy istnieje `channels.discord`, to `allowlist`.

    Zachowanie `allowlist`:

    - serwer musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany `slug`)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne ID) i `roles` (tylko ID ról); jeśli skonfigurowano którekolwiek z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowanie po nazwie/tagu jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale ID są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazwa/tag
    - jeśli serwer ma skonfigurowane `channels`, kanały spoza listy są odrzucane
    - jeśli serwer nie ma bloku `channels`, wszystkie kanały na tym serwerze z listy dozwolonych są dozwolone

    Przykład:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, zapasowe zachowanie środowiska uruchomieniowego to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Wzmianki i grupowe DM-y">
    Wiadomości na serwerze są domyślnie ograniczone do wiadomości ze wzmianką.

    Wykrywanie wzmianki obejmuje:

    - jawną wzmiankę bota
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, zapasowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    `requireMention` konfiguruje się osobno dla serwera/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` może opcjonalnie odrzucać wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM-y:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (ID kanałów lub slugi)

  </Tab>
</Tabs>

### Routing agenta oparty na rolach

Użyj `bindings[].match.roles`, aby kierować członków serwera Discord do różnych agentów według ID roli. Powiązania oparte na rolach akceptują tylko ID ról i są oceniane po powiązaniach peer lub parent-peer, a przed powiązaniami tylko dla serwera. Jeśli powiązanie ustawia także inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Konfiguracja Developer Portal

<AccordionGroup>
  <Accordion title="Utwórz aplikację i bota">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Skopiuj token bota

  </Accordion>

  <Accordion title="Uprzywilejowane intencje">
    W **Bot -> Privileged Gateway Intents** włącz:

    - Message Content Intent
    - Server Members Intent (zalecane)

    Presence intent jest opcjonalne i wymagane tylko wtedy, gdy chcesz otrzymywać aktualizacje statusu. Ustawianie statusu bota (`setPresence`) nie wymaga włączania aktualizacji statusu dla członków.

  </Accordion>

  <Accordion title="Zakresy OAuth i podstawowe uprawnienia">
    Generator URL OAuth:

    - zakresy: `bot`, `applications.commands`

    Typowe podstawowe uprawnienia:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcjonalne)

    Jest to podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach pracy kanałów forum lub mediów, które tworzą lub kontynuują wątek, włącz także **Send Messages in Threads**.
    Unikaj `Administrator`, chyba że jest to wyraźnie potrzebne.

  </Accordion>

  <Accordion title="Skopiuj ID">
    Włącz Discord Developer Mode, a następnie skopiuj:

    - ID serwera
    - ID kanału
    - ID użytkownika

    W konfiguracji OpenClaw preferuj numeryczne ID, aby zapewnić niezawodne audyty i sondowanie.

  </Accordion>
</AccordionGroup>

## Natywne polecenia i uwierzytelnianie poleceń

- `commands.native` domyślnie ma wartość `"auto"` i jest włączone dla Discord.
- Nadpisanie per kanał: `channels.discord.commands.native`.
- `commands.native=false` jawnie czyści wcześniej zarejestrowane natywne polecenia Discord.
- Uwierzytelnianie natywnych poleceń używa tych samych list dozwolonych/zasad Discord co zwykła obsługa wiadomości.
- Polecenia mogą być nadal widoczne w interfejsie Discord dla użytkowników bez uprawnień; wykonanie nadal egzekwuje uwierzytelnianie OpenClaw i zwraca „brak autoryzacji”.

Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać katalog poleceń i ich działanie.

Domyślne ustawienia poleceń ukośnikowych:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Tagi odpowiedzi i natywne odpowiedzi">
    Discord obsługuje tagi odpowiedzi w danych wyjściowych agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Sterowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.
    `first` zawsze dołącza niejawne natywne odwołanie odpowiedzi do pierwszej wychodzącej wiadomości Discord w danej turze.
    `batched` dołącza niejawne natywne odwołanie odpowiedzi Discord tylko wtedy, gdy
    przychodząca tura była zdebounce'owaną partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie w niejednoznacznych, gwałtownych rozmowach, a nie w każdej
    turze z pojedynczą wiadomością.

    ID wiadomości są udostępniane w kontekście/historii, aby agenci mogli kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podgląd transmisji na żywo">
    OpenClaw może strumieniować wersje robocze odpowiedzi przez wysłanie tymczasowej wiadomości i jej edytowanie w miarę napływu tekstu. `channels.discord.streaming` przyjmuje wartości `off` (domyślnie) | `partial` | `block` | `progress`. `progress` mapuje się na `partial` w Discord; `streamMode` to starszy alias i jest automatycznie migrowany.

    Domyślnie pozostaje `off`, ponieważ edycje podglądu w Discord szybko trafiają w limity szybkości, gdy wiele botów lub bram współdzieli jedno konto.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływu tokenów.
    - `block` emituje fragmenty o rozmiarze wersji roboczej (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczane do `textChunkLimit`).
    - Ostateczne wiadomości z multimediami, błędami i jawnymi odpowiedziami anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.

    Transmisja podglądu obsługuje tylko tekst; odpowiedzi multimedialne wracają do zwykłego dostarczania. Gdy jawnie włączone jest strumieniowanie `block`, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii serwera:

    - `channels.discord.historyLimit` domyślnie `20`
    - zapasowo: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrolki historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanałów i dziedziczą konfigurację kanału nadrzędnego, chyba że ją nadpisano.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) pozwala nowym automatycznym wątkom inicjalizować się na podstawie transkryptu nadrzędnego. Nadpisania per konto znajdują się pod `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozpoznawać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas zapasowej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako kontekst **niezaufany**. Listy dozwolonych kontrolują, kto może wywołać agenta, a nie pełną granicę redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji subagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuń bieżące powiązanie wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązania
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne odwiązywanie po bezczynności dla powiązań z fokusem
    - `/session max-age <duration|off>` sprawdź/zaktualizuj twardy maksymalny wiek dla powiązań z fokusem

    Konfiguracja:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // wymaga jawnego włączenia
      },
    },
  },
}
```

    Uwagi:

    - `session.threadBindings.*` ustawia globalne wartości domyślne.
    - `channels.discord.threadBindings.*` nadpisuje zachowanie Discord.
    - `spawnSubagentSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla ACP (`/acp spawn ... --thread ...` lub `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązywania wątków są niedostępne.

    Zobacz [Sub-agents](/pl/tools/subagents), [ACP Agents](/pl/tools/acp-agents) i [Configuration Reference](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    W przypadku stabilnych, „zawsze aktywnych” obszarów roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP kierowane do konwersacji Discord.

    Ścieżka konfiguracji:

    - `bindings[]` z `type: "acp"` i `match.channel: "discord"`

    Przykład:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Uwagi:

    - `/acp spawn codex --bind here` wiąże bieżący kanał lub wątek na miejscu i utrzymuje przyszłe wiadomości w tej samej sesji ACP. Wiadomości w wątku dziedziczą powiązanie kanału nadrzędnego.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP na miejscu. Tymczasowe powiązania wątków mogą nadpisywać rozwiązywanie celu, gdy są aktywne.
    - `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw ma utworzyć/powiązać podrzędny wątek przez `--thread auto|here`.

    Zobacz [ACP Agents](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach per serwer:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są przekształcane w zdarzenia systemowe i dołączane do kierowanej sesji Discord.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji unicode lub niestandardowe nazwy emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji">
    Zapisy konfiguracji inicjowane z kanału są domyślnie włączone.

    Dotyczy to przepływów `/config set|unset` (gdy funkcje poleceń są włączone).

    Wyłącz:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy Gateway">
    Kieruj ruch WebSocket bramy Discord oraz wyszukiwania REST podczas uruchamiania (ID aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Nadpisanie per konto:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Obsługa PluralKit">
    Włącz rozwiązywanie PluralKit, aby mapować proxowane wiadomości na tożsamość członka systemu:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcjonalne; potrzebne dla prywatnych systemów
      },
    },
  },
}
```

    Uwagi:

    - listy dozwolonych mogą używać `pk:<memberId>`
    - wyświetlane nazwy członków są dopasowywane po nazwie/slugu tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego ID wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, proxowane wiadomości są traktowane jako wiadomości bota i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Konfiguracja statusu">
    Aktualizacje statusu są stosowane, gdy ustawisz pole statusu lub aktywności albo gdy włączysz automatyczny status.

    Przykład tylko ze statusem:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Przykład aktywności (niestandardowy status to domyślny typ aktywności):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Przykład transmisji:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa typów aktywności:

    - 0: Playing
    - 1: Streaming (wymaga `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (używa tekstu aktywności jako stanu statusu; emoji jest opcjonalne)
    - 5: Competing

    Przykład automatycznego statusu (sygnał kondycji środowiska uruchomieniowego):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Automatyczny status mapuje dostępność środowiska uruchomieniowego na status Discord: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzanie oparte na przyciskach w DM-ach i może opcjonalnie publikować prośby o zatwierdzenie w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, używa zapasowo `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z `commands.ownerAllowFrom`. Discord nie wyprowadza zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    Gdy `target` ma wartość `channel` lub `both`, prośba o zatwierdzenie jest widoczna w kanale. Tylko rozpoznani zatwierdzający mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Prośby o zatwierdzenie zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli nie da się wyprowadzić ID kanału z klucza sesji, OpenClaw wraca do dostarczenia przez DM.

    Discord renderuje także współdzielone przyciski zatwierdzeń używane przez inne kanały czatu. Natywny adapter Discord głównie dodaje routing DM do zatwierdzających i rozsyłanie do kanałów.
    Gdy te przyciski są obecne, są one podstawowym UX zatwierdzeń; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatowe są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

    Uwierzytelnianie Gateway i rozwiązywanie zatwierdzeń podążają za współdzielonym kontraktem klienta Gateway (`plugin:` IDs są rozwiązywane przez `plugin.approval.resolve`; inne ID przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [Exec approvals](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki działań

Działania wiadomości Discord obejmują wysyłanie wiadomości, administrację kanałem, moderację, status i działania na metadanych.

Główne przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- status: `setPresence`

Działanie `event-create` akceptuje opcjonalny parametr `image` (URL lub lokalna ścieżka pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki działań znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa działań                                                                                                                                                            | Domyślnie |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone  |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## Interfejs Components v2

OpenClaw używa Discord components v2 dla zatwierdzeń exec i znaczników między kontekstami. Działania wiadomości Discord mogą także akceptować `components` dla niestandardowego interfejsu (zaawansowane; wymaga zbudowania ładunku komponentów przez narzędzie discord), podczas gdy starsze `embeds` są nadal dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustaw per konto przez `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` są ignorowane, gdy obecne są components v2.

Przykład:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Głos

Discord ma dwie odrębne powierzchnie głosowe: czasu rzeczywistego **kanały głosowe** (ciągłe rozmowy) oraz **załączniki wiadomości głosowych** (format podglądu z falą dźwiękową). Gateway obsługuje oba.

### Kanały głosowe

Wymagania:

- Włącz natywne polecenia (`commands.native` lub `channels.discord.commands.native`).
- Skonfiguruj `channels.discord.voice`.
- Bot potrzebuje uprawnień Connect + Speak w docelowym kanale głosowym.

Użyj `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i podąża za tymi samymi regułami listy dozwolonych oraz group policy co inne polecenia Discord.

Przykład automatycznego dołączania:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Uwagi:

- `voice.tts` nadpisuje `messages.tts` tylko dla odtwarzania głosowego.
- Tury transkrypcji głosowych wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskiwać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos jest domyślnie włączony; ustaw `channels.discord.voice.enabled=false`, aby go wyłączyć.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw monitoruje także błędy deszyfrowania odbioru i automatycznie odzyskuje działanie przez opuszczenie i ponowne dołączenie do kanału głosowego po wielokrotnych błędach w krótkim oknie czasu.
- Jeśli logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, może to być błąd odbioru upstream `@discordjs/voice` śledzony w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali dźwiękowej i wymagają dźwięku OGG/Opus. OpenClaw generuje falę dźwiękową automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście Gateway do inspekcji i konwersji.

- Podaj **lokalną ścieżkę do pliku** (URL-e są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst i wiadomość głosową w tym samym ładunku).
- Dowolny format audio jest akceptowany; OpenClaw konwertuje do OGG/Opus w razie potrzeby.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji lub bot nie widzi wiadomości z serwera">

    - włącz Message Content Intent
    - włącz Server Members Intent, jeśli polegasz na rozwiązywaniu użytkowników/członków
    - uruchom ponownie Gateway po zmianie intencji

  </Accordion>

  <Accordion title="Wiadomości z serwera są nieoczekiwanie blokowane">

    - sprawdź `groupPolicy`
    - sprawdź listę dozwolonych serwerów w `channels.discord.guilds`
    - jeśli istnieje mapa `channels` serwera, dozwolone są tylko wymienione kanały
    - sprawdź działanie `requireMention` i wzorce wzmianek

    Przydatne polecenia:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, ale nadal blokowane">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych serwerów/kanałów
    - `requireMention` skonfigurowano w niewłaściwym miejscu (musi być pod `channels.discord.guilds` albo wpisem kanału)
    - nadawca zablokowany przez listę dozwolonych `users` serwera/kanału

  </Accordion>

  <Accordion title="Długotrwałe handlery przekraczają limit czasu lub powodują zduplikowane odpowiedzi">

    Typowe logi:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Ustawienie budżetu listenera:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Ustawienie limitu czasu wykonania workera:

    - jedno konto: `channels.discord.inboundWorker.runTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - domyślnie: `1800000` (30 minut); ustaw `0`, aby wyłączyć

    Zalecana baza:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Użyj `eventQueue.listenerTimeout` dla powolnej konfiguracji listenera, a `inboundWorker.runTimeoutMs`
    tylko wtedy, gdy chcesz osobny zawór bezpieczeństwa dla kolejkowanych tur agenta.

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Sprawdzanie uprawnień przez `channels status --probe` działa tylko dla numerycznych ID kanałów.

    Jeśli używasz kluczy slug, dopasowanie środowiska uruchomieniowego nadal może działać, ale sonda nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasady DM wyłączone: `channels.discord.dmPolicy="disabled"` (starsza nazwa: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot do bota">
    Domyślnie wiadomości napisane przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, używaj ścisłych reguł wzmianek i list dozwolonych, aby uniknąć zapętlania.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

  </Accordion>

  <Accordion title="Voice STT wypada z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby logika odzyskiwania odbioru głosu Discord była dostępna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy utrzymują się po automatycznym ponownym dołączeniu, zbierz logi i porównaj z [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Wskaźniki do dokumentacji konfiguracji

Główna dokumentacja:

- [Configuration reference - Discord](/pl/gateway/configuration-reference#discord)

Pola Discord o wysokim znaczeniu:

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker przychodzący: `inboundWorker.runTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- multimedia/ponawianie: `mediaMaxMb`, `retry`
  - `mediaMaxMb` ogranicza wychodzące uploady Discord (domyślnie: `100MB`)
- działania: `actions.*`
- status: `activity`, `status`, `activityType`, `activityUrl`
- interfejs: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (w nadzorowanych środowiskach preferowane `DISCORD_BOT_TOKEN`).
- Przyznawaj uprawnienia Discord według zasady najmniejszych uprawnień.
- Jeśli wdrożenie/stan poleceń jest nieaktualny, uruchom ponownie Gateway i sprawdź ponownie przez `openclaw channels status --probe`.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
- [Polecenia ukośnikowe](/pl/tools/slash-commands)
