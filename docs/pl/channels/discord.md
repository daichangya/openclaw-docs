---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

Gotowe do DM-ów i kanałów serwerowych przez oficjalną bramę Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    DM-y Discorda domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i przepływ naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw utwórz serwer](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Create My Own > For me and my friends**).

<Steps>
  <Step title="Utwórz aplikację Discord i bota">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nadaj jej nazwę, na przykład „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na nazwę, której używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz uprzywilejowane intencje">
    Nadal na stronie **Bot** przewiń do sekcji **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowania nazwy do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji statusu)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem na górę strony **Bot** i kliknij **Reset Token**.

    <Note>
    Wbrew nazwie spowoduje to wygenerowanie pierwszego tokena — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i za chwilę będzie potrzebny.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do swojego serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do swojego serwera.

    Przewiń do **OAuth2 URL Generator** i włącz:

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

    To podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discorda, w tym w przepływach pracy kanałów forum lub mediów, które tworzą lub kontynuują wątek, włącz także **Send Messages in Threads**.
    Skopiuj wygenerowany URL na dole, wklej go do przeglądarki, wybierz swój serwer i kliknij **Continue**, aby połączyć. Powinieneś teraz zobaczyć swojego bota na serwerze Discord.

  </Step>

  <Step title="Włącz Tryb dewelopera i zbierz swoje identyfikatory">
    Po powrocie do aplikacji Discord musisz włączyć Tryb dewelopera, aby móc kopiować wewnętrzne identyfikatory.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem myszy **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem myszy **swój awatar** → **Copy User ID**

    Zapisz **Server ID** i **User ID** razem z Bot Token — w następnym kroku przekażesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na DM-y od członków serwera">
    Aby parowanie działało, Discord musi pozwalać Twojemu botowi wysyłać Ci DM-y. Kliknij prawym przyciskiem myszy **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci DM-y. Pozostaw to włączone, jeśli chcesz używać DM-ów Discorda z OpenClaw. Jeśli planujesz używać tylko kanałów serwerowych, możesz wyłączyć DM-y po sparowaniu.

  </Step>

  <Step title="Ustaw bezpiecznie token bota (nie wysyłaj go na czacie)">
    Token bota Discord to sekret (jak hasło). Ustaw go na maszynie, na której działa OpenClaw, zanim napiszesz do swojego agenta.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jeśli OpenClaw już działa jako usługa w tle, uruchom go ponownie za pomocą aplikacji OpenClaw Mac lub zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu te informacje. Jeśli Discord to Twój pierwszy kanał, zamiast tego użyj karty CLI / config.

        > „Ustawiłem już token mojego bota Discord w konfiguracji. Dokończ proszę konfigurację Discorda, używając User ID `<user_id>` i Server ID `<server_id>`.”
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

        Zmienna środowiskowa zapasowa dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        Zwykłe tekstowe wartości `token` są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` w providerach env/file/exec. Zobacz [Secrets Management](/pl/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zatwierdź pierwsze parowanie DM">
    Poczekaj, aż Gateway będzie działać, a następnie wyślij DM do swojego bota w Discordzie. Odpowie kodem parowania.

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

    Powinieneś teraz móc rozmawiać ze swoim agentem przez DM w Discordzie.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów uwzględnia konto. Wartości tokenów z konfiguracji mają pierwszeństwo przed zapasową zmienną środowiskową. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości / działania kanałowe) jawny `token` dla danego wywołania jest używany tylko dla tego wywołania. Dotyczy to działań typu wysyłanie oraz odczyt/sprawdzanie (na przykład read/search/fetch/thread/pins/permissions). Ustawienia zasad konta i ponawiania nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: skonfiguruj przestrzeń roboczą serwera

Gdy DM-y już działają, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteście tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    Dzięki temu Twój agent będzie mógł odpowiadać na dowolnym kanale na Twoim serwerze, a nie tylko w DM-ach.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > „Dodaj mój Discord Server ID `<server_id>` do listy dozwolonych serwerów”
      </Tab>
      <Tab title="Konfiguracja">

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
    Domyślnie Twój agent odpowiada w kanałach serwerowych tylko wtedy, gdy zostanie oznaczony przez @mention. Na prywatnym serwerze prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > „Pozwól mojemu agentowi odpowiadać na tym serwerze bez konieczności oznaczania go przez @mention”
      </Tab>
      <Tab title="Konfiguracja">
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

  <Step title="Zaplanuj użycie pamięci w kanałach serwerowych">
    Domyślnie pamięć długoterminowa (`MEMORY.md`) jest ładowana tylko w sesjach DM. Kanały serwerowe nie ładują automatycznie `MEMORY.md`.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > „Kiedy zadaję pytania na kanałach Discorda, używaj `memory_search` lub `memory_get`, jeśli potrzebujesz długoterminowego kontekstu z `MEMORY.md`.”
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Długoterminowe notatki trzymaj w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Twój agent widzi nazwę kanału, a każdy kanał otrzymuje własną odizolowaną sesję — możesz więc utworzyć `#coding`, `#home`, `#research` albo cokolwiek, co pasuje do Twojego sposobu pracy.

## Model działania środowiska uruchomieniowego

- Gateway zarządza połączeniem z Discordem.
- Trasowanie odpowiedzi jest deterministyczne: wiadomości przychodzące z Discorda wracają do Discorda.
- Metadane serwera/kanału Discord są dodawane do promptu modelu jako niezaufany kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę otoczkę do odpowiedzi, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących i z kontekstu przyszłych odtworzeń.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały serwerowe mają izolowane klucze sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM-y są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikowe działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), jednocześnie nadal przenosząc `CommandTargetSessionKey` do trasowanej sesji rozmowy.
- Dostarczanie ogłoszeń tekstowych Cron/Heartbeat do Discorda używa końcowej odpowiedzi widocznej dla asystenta tylko raz. Ładunki mediów i ustrukturyzowanych komponentów pozostają wielowiadościowe, gdy agent emituje wiele dostarczalnych ładunków.

## Kanały forum

Kanały forum i mediów Discorda akceptują tylko posty we wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszego niepustego wiersza Twojej wiadomości.
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

Nadrzędne fora nie akceptują komponentów Discorda. Jeśli potrzebujesz komponentów, wyślij do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są kierowane z powrotem do agenta jako zwykłe wiadomości przychodzące i podążają za istniejącymi ustawieniami Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków lub pojedyncze menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowego użytku. Ustaw `components.reusable=true`, aby umożliwić wielokrotne używanie przycisków, selektorów i formularzy aż do momentu wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` dla tego przycisku (identyfikatory użytkowników Discorda, tagi lub `*`). Gdy to jest skonfigurowane, niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modeli z rozwijanymi listami providera, modelu i zgodnych środowisk uruchomieniowych oraz krokiem Submit. `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i tylko użytkownik, który go wywołał, może z niego korzystać.

Załączniki plików:

- bloki `file` muszą wskazywać na odwołanie do załącznika (`attachment://<filename>`)
- przekaż załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- użyj `filename`, aby zastąpić nazwę przesyłanego pliku, gdy powinna odpowiadać odwołaniu do załącznika

Formularze modalne:

- dodaj `components.modal` z maksymalnie 5 polami
- typy pól: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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

## Kontrola dostępu i trasowanie

<Tabs>
  <Tab title="Zasady DM">
    `channels.discord.dmPolicy` kontroluje dostęp do DM-ów (starsza wersja: `channels.discord.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`; starsza wersja: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jeśli zasady DM nie są otwarte, nieznani użytkownicy są blokowani (lub otrzymują monit o parowanie w trybie `pairing`).

    Priorytet dla wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same numeryczne ID są niejednoznaczne i odrzucane, chyba że podano jawny rodzaj celu użytkownika/kanału.

  </Tab>

  <Tab title="Zasady serwera">
    Obsługa serwerów jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczną bazą, gdy istnieje `channels.discord`, jest `allowlist`.

    Zachowanie `allowlist`:

    - serwer musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne ID) i `roles` (tylko ID ról); jeśli skonfigurowano któreś z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowanie nazwy/tagu jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale ID są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy z nazwą/tagiem
    - jeśli serwer ma skonfigurowane `channels`, kanały spoza listy są odrzucane
    - jeśli serwer nie ma bloku `channels`, wszystkie kanały w tym serwerze z listy dozwolonych są dozwolone

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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, zapasowe ustawienie środowiska uruchomieniowego to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Wzmianki i grupowe DM-y">
    Wiadomości na serwerach są domyślnie ograniczane przez wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, zapasowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi-do-bota w obsługiwanych przypadkach

    `requireMention` jest konfigurowane dla każdego serwera/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM-y:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (ID kanałów lub slugi)

  </Tab>
</Tabs>

### Trasowanie agenta oparte na rolach

Użyj `bindings[].match.roles`, aby kierować członków serwera Discord do różnych agentów według ID roli. Powiązania oparte na rolach akceptują tylko ID ról i są oceniane po powiązaniach peer lub parent-peer, a przed powiązaniami tylko-serwerowymi. Jeśli powiązanie ustawia też inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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

## Natywne polecenia i autoryzacja poleceń

- `commands.native` ma domyślnie wartość `"auto"` i jest włączone dla Discorda.
- Nadpisanie per kanał: `channels.discord.commands.native`.
- `commands.native=false` jawnie usuwa wcześniej zarejestrowane natywne polecenia Discorda.
- Autoryzacja natywnych poleceń używa tych samych list dozwolonych/zasad Discorda co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discorda dla użytkowników, którzy nie mają uprawnień; wykonanie nadal wymusza autoryzację OpenClaw i zwraca „brak autoryzacji”.

Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać katalog poleceń i ich działanie.

Domyślne ustawienia poleceń ukośnikowych:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Tagi odpowiedzi i natywne odpowiedzi">
    Discord obsługuje tagi odpowiedzi w danych wyjściowych agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Kontrolowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discorda dla danej tury.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discorda tylko wtedy, gdy
    przychodząca tura była odbitym pakietem wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie przy niejednoznacznych, gwałtownych czatach, a nie przy każdej
    pojedynczej turze wiadomości.

    ID wiadomości są ujawniane w kontekście/historii, aby agenci mogli kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować wersje robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływu tekstu. `channels.discord.streaming` przyjmuje `off` (domyślnie) | `partial` | `block` | `progress`. `progress` mapuje się do `partial` na Discordzie; `streamMode` jest starszym aliasem i jest automatycznie migrowane.

    Domyślnie pozostaje `off`, ponieważ edycje podglądu na Discordzie szybko osiągają limity szybkości, gdy wiele botów lub Gateway współdzieli jedno konto.

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
    - Media, błędy i jawne finalne odpowiedzi anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.

    Strumieniowanie podglądu jest tylko tekstowe; odpowiedzi z mediami wracają do zwykłego dostarczania. Gdy `block` streaming jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii serwera:

    - `channels.discord.historyLimit` domyślnie `20`
    - zapasowo: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Sterowanie historią DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discorda są trasowane jako sesje kanałów i dziedziczą konfigurację kanału nadrzędnego, chyba że zostanie ona nadpisana.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza dla nowych automatycznych wątków zasianie z transkryptu nadrzędnego. Nadpisania per konto znajdują się pod `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas zapasowej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może wyzwolić agenta, ale nie są pełną granicą redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, tak aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji subagenta).

    Polecenia:

    - `/focus <target>` wiąże bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuwa bieżące powiązanie wątku
    - `/agents` pokazuje aktywne uruchomienia i stan powiązania
    - `/session idle <duration|off>` sprawdza/aktualizuje automatyczne odwiązanie po bezczynności dla skoncentrowanych powiązań
    - `/session max-age <duration|off>` sprawdza/aktualizuje twardy maksymalny wiek dla skoncentrowanych powiązań

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Uwagi:

    - `session.threadBindings.*` ustawia globalne wartości domyślne.
    - `channels.discord.threadBindings.*` nadpisuje zachowanie Discorda.
    - `spawnSubagentSessions` musi mieć wartość true, aby automatycznie tworzyć/wiązać wątki dla `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` musi mieć wartość true, aby automatycznie tworzyć/wiązać wątki dla ACP (`/acp spawn ... --thread ...` lub `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Sub-agenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    Dla stabilnych, „zawsze aktywnych” przestrzeni roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP kierowane do rozmów Discorda.

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
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP na miejscu. Tymczasowe powiązania wątków mogą podczas aktywności nadpisywać rozwiązywanie celu.
    - `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć/powiązać podrzędny wątek przez `--thread auto|here`.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach per serwer:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są zamieniane na zdarzenia systemowe i dołączane do trasowanej sesji Discord.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - zapasowo emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji Unicode lub niestandardowe nazwy emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji">
    Zapisy konfiguracji inicjowane z kanału są domyślnie włączone.

    Wpływa to na przepływy `/config set|unset` (gdy funkcje poleceń są włączone).

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
    Kieruj ruch WebSocket Gateway Discorda i wyszukiwania REST przy uruchamianiu (ID aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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
    Włącz rozwiązywanie PluralKit, aby mapować wiadomości proxy na tożsamość członka systemu:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcjonalne; potrzebne dla systemów prywatnych
      },
    },
  },
}
```

    Uwagi:

    - listy dozwolonych mogą używać `pk:<memberId>`
    - wyświetlane nazwy członków są dopasowywane według nazwy/sluga tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego ID wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości proxy są traktowane jako wiadomości bota i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Konfiguracja statusu">
    Aktualizacje statusu są stosowane, gdy ustawisz pole statusu lub aktywności albo gdy włączysz automatyczny status.

    Przykład tylko statusu:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Przykład aktywności (niestandardowy status jest domyślnym typem aktywności):

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

    Przykład strumieniowania:

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

    - 0: Gra
    - 1: Strumieniowanie (wymaga `activityUrl`)
    - 2: Słuchanie
    - 3: Oglądanie
    - 4: Niestandardowa (używa tekstu aktywności jako stanu statusu; emoji jest opcjonalne)
    - 5: Rywalizacja

    Przykład automatycznego statusu (sygnał stanu środowiska uruchomieniowego):

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

    Auto presence mapuje dostępność środowiska uruchomieniowego na status Discorda: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzenia oparte na przyciskach w DM-ach i może opcjonalnie publikować prompty zatwierdzania w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; zapasowo używa `commands.ownerAllowFrom`, gdy to możliwe)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z `commands.ownerAllowFrom`. Discord nie wyprowadza zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani z `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzania.

    Gdy `target` ma wartość `channel` lub `both`, prompt zatwierdzenia jest widoczny w kanale. Tylko rozwiązani zatwierdzający mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Prompty zatwierdzenia zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli ID kanału nie może zostać wyprowadzone z klucza sesji, OpenClaw przełącza się na dostarczanie przez DM.

    Discord renderuje również współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discorda głównie dodaje trasowanie DM-ów zatwierdzających i rozsyłanie do kanałów.
    Gdy te przyciski są obecne, są one podstawowym UX zatwierdzania; OpenClaw
    powinien uwzględniać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

    Autoryzacja Gateway i rozwiązywanie zatwierdzeń podążają za współdzielonym kontraktem klienta Gateway (`plugin:` IDs są rozwiązywane przez `plugin.approval.resolve`; inne ID przez `exec.approval.resolve`). Zatwierdzenia wygasają domyślnie po 30 minutach.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki działań

Działania wiadomości Discord obejmują wiadomości, administrację kanałami, moderację, status i działania na metadanych.

Podstawowe przykłady:

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

## UI komponentów v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i znaczników międzykontekstowych. Działania wiadomości Discord mogą także akceptować `components` dla niestandardowego UI (zaawansowane; wymaga skonstruowania ładunku komponentu przez narzędzie Discord), podczas gdy starsze `embeds` nadal są dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discorda (hex).
- Ustaw per konto przez `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` są ignorowane, gdy obecne są komponenty v2.

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

Lista konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Nadaj uprawnienia Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz natywne polecenia (`commands.native` lub `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i podlega tym samym regułom list dozwolonych oraz zasad grupowych co inne polecenia Discorda.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Przykład automatycznego dołączania:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
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
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Uwagi:

- `voice.tts` nadpisuje `messages.tts` tylko dla odtwarzania głosowego.
- `voice.model` nadpisuje LLM używany tylko dla odpowiedzi w kanałach głosowych Discorda. Pozostaw nieustawione, aby dziedziczyć model trasowanego agenta.
- STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- Tury transkrypcji głosowej wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskiwać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos jest domyślnie włączony; ustaw `channels.discord.voice.enabled=false`, aby go wyłączyć.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw monitoruje również błędy odszyfrowywania przy odbiorze i automatycznie odzyskuje działanie przez opuszczenie/ponowne dołączenie do kanału głosowego po wielokrotnych błędach w krótkim oknie czasowym.
- Jeśli logi odbioru po aktualizacji wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` zawiera poprawkę dopełnienia z discord.js PR #11449, która zamknęła issue #11419 w discord.js.

Pipeline kanału głosowego:

- Przechwytywany PCM z Discorda jest konwertowany do tymczasowego pliku WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypcja jest wysyłana przez zwykłe wejście i trasowanie Discorda.
- `voice.model`, jeśli jest ustawione, nadpisuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest łączone z `messages.tts`; wynikowy dźwięk jest odtwarzany w dołączonym kanale.

Poświadczenia są rozwiązywane dla każdego komponentu osobno: autoryzacja trasy LLM dla `voice.model`, autoryzacja STT dla `tools.media.audio` oraz autoryzacja TTS dla `messages.tts`/`voice.tts`.

### Wiadomości głosowe

Wiadomości głosowe Discorda pokazują podgląd fali dźwiękowej i wymagają dźwięku OGG/Opus. OpenClaw generuje falę dźwiękową automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście Gateway, aby analizować i konwertować.

- Podaj **lokalną ścieżkę pliku** (URL-e są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst i wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje go do OGG/Opus w razie potrzeby.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji lub bot nie widzi wiadomości z serwera">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależysz od rozwiązywania użytkowników/członków
    - uruchom ponownie Gateway po zmianie intencji

  </Accordion>

  <Accordion title="Wiadomości z serwera są nieoczekiwanie blokowane">

    - sprawdź `groupPolicy`
    - sprawdź listę dozwolonych serwerów w `channels.discord.guilds`
    - jeśli istnieje mapa `channels` serwera, dozwolone są tylko wymienione kanały
    - sprawdź zachowanie `requireMention` i wzorce wzmianek

    Przydatne polecenia:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention ustawione na false, ale nadal blokowane">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych serwerów/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi być pod `channels.discord.guilds` lub wpisem kanału)
    - nadawca blokowany przez listę dozwolonych `users` serwera/kanału

  </Accordion>

  <Accordion title="Długotrwałe handlery przekraczają limit czasu lub duplikują odpowiedzi">

    Typowe logi:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Parametr budżetu listenera:

    - pojedyncze konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Parametr limitu czasu wykonania workera:

    - pojedyncze konto: `channels.discord.inboundWorker.runTimeoutMs`
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

    Użyj `eventQueue.listenerTimeout` dla powolnej konfiguracji listenera oraz `inboundWorker.runTimeoutMs`
    tylko wtedy, gdy chcesz osobny zawór bezpieczeństwa dla kolejkowanych tur agenta.

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Sprawdzenia uprawnień `channels status --probe` działają tylko dla numerycznych ID kanałów.

    Jeśli używasz kluczy slug, dopasowanie w środowisku uruchomieniowym nadal może działać, ale probe nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasady DM wyłączone: `channels.discord.dmPolicy="disabled"` (starsza wersja: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-do-bota">
    Domyślnie wiadomości autorstwa botów są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianek i list dozwolonych, aby uniknąć zapętleń.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

  </Accordion>

  <Accordion title="Głosowe STT wypada z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby logika odzyskiwania odbioru głosowego Discord była obecna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy trwają po automatycznym ponownym dołączeniu, zbierz logi i porównaj z historią odbioru DAVE upstream w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) i [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/autoryzacja: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker wejściowy: `inboundWorker.runTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb` (ogranicza wychodzące przesyłanie do Discorda, domyślnie `100MB`), `retry`
- działania: `actions.*`
- status: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (w nadzorowanych środowiskach preferowane `DISCORD_BOT_TOKEN`).
- Nadawaj minimalne niezbędne uprawnienia Discorda.
- Jeśli wdrożenie/stan poleceń jest nieaktualny, uruchom ponownie Gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie czatu grupowego i listy dozwolonych.
  </Card>
  <Card title="Trasowanie kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Trasowanie wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj serwery i kanały do agentów.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Zachowanie natywnych poleceń.
  </Card>
</CardGroup>
