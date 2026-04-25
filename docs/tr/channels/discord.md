---
read_when:
    - Discord kanal özellikleri üzerinde çalışılıyor
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-04-25T13:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 685dd2dce8a299233b14e7bdd5f502ee92f740b7dbb3104e86e0c2f36aabcfe1
    source_path: channels/discord.md
    workflow: 15
---

Resmî Discord gateway üzerinden Discord DM'leri ve sunucu kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleştirme modundadır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve onu OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz yoksa önce [bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve botu oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin ve **New Application** seçeneğine tıklayın. Buna "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** seçeneğine tıklayın. **Username** alanını, OpenClaw ajanınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken aşağı kaydırarak **Privileged Gateway Intents** bölümüne gelin ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve addan kimliğe eşleme için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca durum güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** seçeneğine tıklayın.

    <Note>
    Adına rağmen bu işlem ilk token'ınızı oluşturur — hiçbir şey "sıfırlanmıyor".
    </Note>

    Token'ı kopyalayıp bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve birazdan buna ihtiyacınız olacak.

  </Step>

  <Step title="Bir davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** seçeneğine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    Aşağı kaydırarak **OAuth2 URL Generator** bölümüne gelin ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Altında bir **Bot Permissions** bölümü görünecektir. En azından şunları etkinleştirin:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (isteğe bağlı)

    Bu, normal metin kanalları için temel kümedir. Discord başlıklarında paylaşım yapmayı planlıyorsanız — buna bir başlık oluşturan veya sürdüren forum ya da medya kanalı iş akışları da dahildir — ayrıca **Send Messages in Threads** iznini de etkinleştirin.
    Alttaki oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** seçeneğine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Developer Mode'u etkinleştirin ve kimliklerinizi toplayın">
    Tekrar Discord uygulamasına dönün; dahili kimlikleri kopyalayabilmek için Developer Mode'u etkinleştirmeniz gerekir.

    1. **User Settings** seçeneğine tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** seçeneğini açın
    2. Kenar çubuğunda **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token ile birlikte kaydedin — bir sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden gelen DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu açık bırakın. Yalnızca sunucu kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM'leri kapatabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir sırdır (parola gibi). Ajanınıza mesaj göndermeden önce bunu OpenClaw çalıştıran makinede ayarlayın.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw zaten arka plan hizmeti olarak çalışıyorsa OpenClaw Mac uygulaması üzerinden veya `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Ajanınıza sorun">
        OpenClaw ajanınızla mevcut herhangi bir kanalda (ör. Telegram) sohbet edin ve bunu söyleyin. Discord ilk kanalınızsa bunun yerine CLI / yapılandırma sekmesini kullanın.

        > "Discord bot token'ımı zaten yapılandırmada ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
      </Tab>
      <Tab title="CLI / yapılandırma">
        Dosya tabanlı yapılandırmayı tercih ediyorsanız şunu ayarlayın:

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

        Varsayılan hesap için env geri dönüşü:

```bash
DISCORD_BOT_TOKEN=...
```

        Düz metin `token` değerleri desteklenir. `channels.discord.token` için env/file/exec sağlayıcıları genelinde SecretRef değerleri de desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="İlk DM eşleştirmesini onaylayın">
    Gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Size bir eşleştirme koduyla yanıt verecektir.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        Eşleştirme kodunu mevcut kanalınızda ajanınıza gönderin:

        > "Bu Discord eşleştirme kodunu onayla: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Eşleştirme kodlarının süresi 1 saat sonra dolar.

    Artık Discord'da DM üzerinden ajanınızla sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümlemesi hesap farkındalığına sahiptir. Yapılandırmadaki token değerleri env geri dönüşüne üstün gelir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Gelişmiş giden çağrılar için (mesaj aracı/kanal eylemleri), açık bir çağrı başına `token` o çağrı için kullanılır. Bu; gönderme ve okuma/inceleme tarzı eylemler (örneğin read/search/fetch/thread/pins/permissions) için geçerlidir. Hesap ilkesi/yeniden deneme ayarları ise etkin çalışma zamanı anlık görüntüsünde seçili hesaptan gelmeye devam eder.
</Note>

## Önerilen: Bir sunucu çalışma alanı kurun

DM'ler çalıştıktan sonra, Discord sunucunuzu her kanalın kendi bağlamına sahip kendi ajan oturumunu aldığı tam bir çalışma alanı olarak kurabilirsiniz. Bu, yalnızca siz ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu sunucu izin listesine ekleyin">
    Bu, ajanınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord Server ID `<server_id>` değerimi sunucu izin listesine ekle"
      </Tab>
      <Tab title="Yapılandırma">

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

  <Step title="@mention olmadan yanıt verilmesine izin verin">
    Varsayılan olarak ajanınız sunucu kanallarında yalnızca @mention yapıldığında yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Ajanımın bu sunucuda @mention yapılmasına gerek olmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Yapılandırma">
        Sunucu yapılandırmanızda `requireMention: false` ayarlayın:

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

  <Step title="Sunucu kanallarında bellek için plan yapın">
    Varsayılan olarak uzun süreli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Sunucu kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md dosyasından uzun süreli bağlam gerekirse memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlam gerekiyorsa sabit yönergeleri `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun süreli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda bazı kanallar oluşturun ve sohbet etmeye başlayın. Ajanınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır — böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan başka kanallar kurabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısını sahiplenir.
- Yanıt yönlendirmesi belirleyicidir: Discord'dan gelen girişler yine Discord'a yanıtlanır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler ajan ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları, yönlendirilmiş konuşma oturumuna `CommandTargetSessionKey` taşımaya devam ederken yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`).
- Yalnızca metin Cron/Heartbeat duyuru teslimi Discord'a, ajan tarafından görünür son yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri, ajan birden fazla teslim edilebilir yük yaydığında çoklu mesaj olarak kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca başlık gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Bir başlığı otomatik oluşturmak için forum üst öğesine (`channel:<forumId>`) bir mesaj gönderin. Başlık adı, mesajınızın ilk boş olmayan satırını kullanır.
- Doğrudan bir başlık oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçirmeyin.

Örnek: başlık oluşturmak için forum üst öğesine gönderme

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum başlığı oluşturma

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa başlığın kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, ajan mesajları için Discord components v2 container desteği sunar. `components` yükü ile mesaj aracını kullanın. Etkileşim sonuçları, normal gelen mesajlar olarak yeniden ajana yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden fazla kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir reddetme iletisi alır.

`/model` ve `/models` slash komutları; sağlayıcı, model ve uyumlu çalışma zamanı açılır menülerinin yanı sıra bir Submit adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine bir kullanımdan kaldırma iletisi döndürür. Seçici yanıtı geçicidir ve yalnızca komutu çağıran kullanıcı onu kullanabilir.

Dosya ekleri:

- `file` blokları bir ek referansını işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden fazla dosya için `media-gallery` kullanın
- Yükleme adı ek referansıyla eşleşmeliyse bunu geçersiz kılmak için `filename` kullanın

Modal formlar:

- En fazla 5 alanla `components.modal` ekleyin
- Alan türleri: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw otomatik olarak bir tetikleyici düğme ekler

Örnek:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "İsteğe bağlı yedek metin",
  components: {
    reusable: true,
    text: "Bir yol seçin",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Onayla",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Reddet", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Bir seçenek belirleyin",
          options: [
            { label: "Seçenek A", value: "a" },
            { label: "Seçenek B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Ayrıntılar",
      triggerLabel: "Formu aç",
      fields: [
        { type: "text", label: "Talep eden" },
        {
          type: "select",
          label: "Öncelik",
          options: [
            { label: "Düşük", value: "low" },
            { label: "Yüksek", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.discord.dmPolicy`, DM erişimini denetler (eski: `channels.discord.dm.policy`):

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir; eski: `channels.discord.dm.allowFrom`)
    - `disabled`

    DM ilkesi açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme istenir).

    Çoklu hesap önceliği:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesap için geçerlidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` mention

    Salt sayısal kimlikler belirsizdir ve açık bir kullanıcı/kanal hedef türü verilmedikçe reddedilir.

  </Tab>

  <Tab title="Sunucu ilkesi">
    Sunucu işlemesi `channels.discord.groupPolicy` ile denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderici izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); bunlardan biri yapılandırılmışsa, göndericilere `users` VEYA `roles` ile eşleştiğinde izin verilir
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; bunu yalnızca acil durum uyumluluk modu olarak etkinleştirmek için `channels.discord.dangerouslyAllowNameMatching: true` kullanın
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarı verir
    - bir sunucuda `channels` yapılandırılmışsa listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa, izin listesine alınmış o sunucudaki tüm kanallara izin verilir

    Örnek:

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve bir `channels.discord` bloğu oluşturmazsanız, çalışma zamanı geri dönüşü `groupPolicy="allowlist"` olur (günlüklerde uyarı ile), `channels.defaults.groupPolicy` değeri `open` olsa bile.

  </Tab>

  <Tab title="Mention'lar ve grup DM'leri">
    Sunucu mesajları varsayılan olarak mention ile sınırlandırılır.

    Mention algılama şunları içerir:

    - açık bot mention'ı
    - yapılandırılmış mention kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bot-yanıtına-cevap davranışı

    `requireMention` her sunucu/kanal için yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, başka bir kullanıcıdan/rolden mention alan ancak bottan almayan mesajları isteğe bağlı olarak yok sayar (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - isteğe bağlı izin listesi: `dm.groupChannels` (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Rol tabanlı ajan yönlendirme

Discord sunucu üyelerini rol kimliğine göre farklı ajanlara yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş düzey veya üst eş düzey bağlamalardan sonra, yalnızca sunucuya özel bağlamalardan önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

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

## Yerel komutlar ve komut kimlik doğrulaması

- `commands.native` varsayılan olarak `"auto"` değerindedir ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, daha önce kaydedilmiş Discord yerel komutlarını açıkça temizler.
- Yerel komut kimlik doğrulaması, normal mesaj işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Discord arayüzünde yetkili olmayan kullanıcılar için komutlar yine de görünür olabilir; ancak yürütme yine de OpenClaw kimlik doğrulamasını uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranış için bkz. [Slash commands](/tr/tools/slash-commands).

Varsayılan slash komut ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, ajan çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` ile denetlenir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketlerine yine de uyulur.
    `first`, tur için ilk giden Discord mesajına örtük yerel yanıt referansını her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt referansını yalnızca gelen tur birden fazla mesajın debounce edilmiş bir toplu paketi olduğunda ekler. Bu, yerel yanıtları her tek mesajlık tur için değil, esas olarak belirsiz ve patlamalı sohbetler için istediğinizde kullanışlıdır.

    Mesaj kimlikleri bağlam/geçmişte görünür hâle getirilir, böylece ajanlar belirli mesajları hedefleyebilir.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir mesaj gönderip metin geldikçe onu düzenleyerek taslak yanıtları akış hâlinde verebilir. `channels.discord.streaming` şu değerleri alır: `off` (varsayılan) | `partial` | `block` | `progress`. `progress`, Discord'da `partial` olarak eşlenir; `streamMode` eski bir takma addır ve otomatik olarak taşınır.

    Varsayılan değer `off` olarak kalır çünkü birden fazla bot veya Gateway aynı hesabı paylaştığında Discord önizleme düzenlemeleri hız sınırlarına çabuk takılır.

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

    - `partial`, token'lar geldikçe tek bir önizleme mesajını düzenler.
    - `block`, taslak boyutlu parçalar yayar (boyut ve kesme noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık-yanıt final mesajları bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme mesajını yeniden kullanıp kullanmayacağını denetler.

    Önizleme akışı yalnızca metindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve başlık davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Başlık davranışı:

    - Discord başlıkları kanal oturumları olarak yönlendirilir ve aksi belirtilmedikçe üst kanal yapılandırmasını devralır.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik başlıkların üst transkriptten tohumlanmasını seçmeli olarak etkinleştirir. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - Mesaj aracı tepkileri `user:<id>` DM hedeflerini çözümleyebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme geri dönüşü sırasında korunur.

    Kanal konuları **güvenilmez** bağlam olarak enjekte edilir. İzin listeleri, ajanın kim tarafından tetiklenebileceğini sınırlar; bu tam bir ek bağlam sansürleme sınırı değildir.

  </Accordion>

  <Accordion title="Alt ajanlar için başlığa bağlı oturumlar">
    Discord, bir başlığı bir oturum hedefine bağlayabilir; böylece o başlıktaki takip mesajları aynı oturuma yönlendirilmeye devam eder (alt ajan oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni başlığı bir alt ajan/oturum hedefine bağlar
    - `/unfocus` geçerli başlık bağlamasını kaldırır
    - `/agents` etkin çalıştırmaları ve bağlama durumunu gösterir
    - `/session idle <duration|off>` odaklanmış bağlamalar için hareketsizlik nedeniyle otomatik odağı kaldırmayı inceler/günceller
    - `/session max-age <duration|off>` odaklanmış bağlamalar için katı azami yaşı inceler/günceller

    Yapılandırma:

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
        spawnSubagentSessions: false, // seçmeli
      },
    },
  },
}
```

    Notlar:

    - `session.threadBindings.*` genel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*`, Discord davranışını geçersiz kılar.
    - `sessions_spawn({ thread: true })` için başlıkları otomatik oluşturmak/bağlamak üzere `spawnSubagentSessions` değeri `true` olmalıdır.
    - ACP için (`/acp spawn ... --thread ...` veya `sessions_spawn({ runtime: "acp", thread: true })`) başlıkları otomatik oluşturmak/bağlamak üzere `spawnAcpSessions` değeri `true` olmalıdır.
    - Bir hesap için başlık bağlamaları devre dışıysa, `/focus` ve ilgili başlık bağlama işlemleri kullanılamaz.

    Bkz. [Sub-agents](/tr/tools/subagents), [ACP Agents](/tr/tools/acp-agents) ve [Configuration Reference](/tr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı, "her zaman açık" ACP çalışma alanları için, Discord konuşmalarını hedefleyen üst düzey tiplenmiş ACP bağlamalarını yapılandırın.

    Yapılandırma yolu:

    - `type: "acp"` ve `match.channel: "discord"` ile `bindings[]`

    Örnek:

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

    Notlar:

    - `/acp spawn codex --bind here`, geçerli kanal veya başlığı yerinde bağlar ve gelecekteki mesajları aynı ACP oturumunda tutar. Başlıktaki mesajlar üst kanal bağlamasını devralır.
    - Bağlı bir kanal veya başlıkta, `/new` ve `/reset` aynı ACP oturumunu yerinde sıfırlar. Geçici başlık bağlamaları etkin olduklarında hedef çözümlemeyi geçersiz kılabilir.
    - `spawnAcpSessions` yalnızca OpenClaw'ın `--thread auto|here` aracılığıyla bir alt başlık oluşturması/bağlaması gerektiğinde zorunludur.

    Bağlama davranışı ayrıntıları için bkz. [ACP Agents](/tr/tools/acp-agents).

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Sunucu başına tepki bildirim modu:

    - `off`
    - `own` (varsayılan)
    - `all`
    - `allowlist` (`guilds.<id>.users` kullanır)

    Tepki olayları sistem olaylarına dönüştürülür ve yönlendirilmiş Discord oturumuna eklenir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - ajan kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, aksi takdirde "👀")

    Notlar:

    - Discord unicode emojilerini veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Yapılandırma yazımları">
    Kanal tarafından başlatılan yapılandırma yazımları varsayılan olarak etkindir.

    Bu, `/config set|unset` akışlarını etkiler (komut özellikleri etkin olduğunda).

    Devre dışı bırakmak için:

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

  <Accordion title="Gateway proxy">
    Discord gateway WebSocket trafiğini ve başlangıç REST aramalarını (uygulama kimliği + izin listesi çözümlemesi), `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Hesap başına geçersiz kılma:

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

  <Accordion title="PluralKit desteği">
    Proxy'lenmiş mesajları sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // isteğe bağlı; özel sistemler için gerekli
      },
    },
  },
}
```

    Notlar:

    - izin listeleri `pk:<memberId>` kullanabilir
    - üye görünen adları yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ad/slug ile eşleştirilir
    - aramalar özgün mesaj kimliğini kullanır ve zaman penceresiyle sınırlıdır
    - arama başarısız olursa, proxy'lenmiş mesajlar bot mesajı olarak değerlendirilir ve `allowBots=true` olmadığı sürece bırakılır

  </Accordion>

  <Accordion title="Durum yapılandırması">
    Bir durum veya etkinlik alanı ayarladığınızda ya da otomatik durumu etkinleştirdiğinizde durum güncellemeleri uygulanır.

    Yalnızca durum örneği:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Etkinlik örneği (özel durum varsayılan etkinlik türüdür):

```json5
{
  channels: {
    discord: {
      activity: "Odak zamanı",
      activityType: 4,
    },
  },
}
```

    Yayın örneği:

```json5
{
  channels: {
    discord: {
      activity: "Canlı kodlama",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Etkinlik türü eşlemesi:

    - 0: Playing
    - 1: Streaming (`activityUrl` gerektirir)
    - 2: Listening
    - 3: Watching
    - 4: Custom (etkinlik metnini durum durumu olarak kullanır; emoji isteğe bağlıdır)
    - 5: Competing

    Otomatik durum örneği (çalışma zamanı sağlık sinyali):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token tükendi",
      },
    },
  },
}
```

    Otomatik durum, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: healthy => online, degraded veya unknown => idle, exhausted veya unavailable => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord içinde onaylar">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda yayınlayabilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir onaylayıcı çözümlenebildiğinde Discord yerel exec onaylarını otomatik etkinleştirir; bu çözümleme ya `execApprovals.approvers` içinden ya da `commands.ownerAllowFrom` içinden gelir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` üzerinden türetmez. Discord'u yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `target` değeri `channel` veya `both` olduğunda, onay istemi kanalda görünür olur. Düğmeleri yalnızca çözümlenmiş onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir reddetme alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilen kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw DM teslimine geri döner.

    Discord ayrıca diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Discord adaptörü esas olarak onaylayıcı DM yönlendirmesi ve kanal çoğaltımı ekler.
    Bu düğmeler mevcut olduğunda bunlar birincil onay kullanıcı deneyimi olur; OpenClaw yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylediğinde manuel `/approve` komutu eklemelidir.

    Gateway kimlik doğrulaması ve onay çözümlemesi, paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden çözülür; diğer kimlikler `exec.approval.resolve` üzerinden çözülür). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec approvals](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord mesaj eylemleri; mesajlaşma, kanal yönetimi, moderasyon, durum ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, planlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresini (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin      |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord mesaj eylemleri, özel kullanıcı arayüzü için `components` de kabul edebilir (ileri düzey; discord aracı üzerinden bir bileşen yükü oluşturmayı gerektirir), eski `embeds` ise kullanılabilir olmaya devam eder ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları için kullanılan vurgu rengini ayarlar (hex).
- Hesap başına `channels.discord.accounts.<id>.ui.components.accentColor` ile ayarlayın.
- components v2 mevcut olduğunda `embeds` yok sayılır.

Örnek:

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

## Ses

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli mesaj ekleri** (dalga biçimi önizleme biçimi). Gateway ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal içinde Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırmasını yapın.

Oturumları denetlemek için `/vc join|leave|status` kullanın. Komut, hesap varsayılan ajanını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve sunucu ilkesi kurallarını izler.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Otomatik katılma örneği:

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

Notlar:

- `voice.tts`, yalnızca ses oynatma için `messages.tts` değerini geçersiz kılar.
- `voice.model`, yalnızca Discord ses kanalı yanıtları için kullanılan LLM'yi geçersiz kılar. Yönlendirilmiş ajan modelini devralmak için ayarsız bırakın.
- STT, `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Ses transkript turları sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahip araçlarına erişemez (örneğin `gateway` ve `cron`).
- Ses varsayılan olarak etkindir; devre dışı bırakmak için `channels.discord.voice.enabled=false` ayarlayın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine doğrudan aktarılır.
- `@discordjs/voice` varsayılanları, ayarlanmamışsa `daveEncryption=true` ve `decryptionFailureTolerance=24` olur.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir zaman aralığında tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik toparlanır.
- Güncellemeden sonra alma günlüklerinde tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` görünüyorsa, bir bağımlılık raporu ve günlükleri toplayın. Paketlenmiş `@discordjs/voice` satırı, discord.js PR #11449'daki upstream dolgu düzeltmesini içerir; bu düzeltme discord.js issue #11419'u kapatmıştır.

Ses kanalı işlem hattı:

- Discord PCM yakalama, geçici bir WAV dosyasına dönüştürülür.
- `tools.media.audio`, örneğin `openai/gpt-4o-mini-transcribe` gibi STT işlemlerini yürütür.
- Transkript normal Discord giriş ve yönlendirme akışından geçirilir.
- Ayarlandığında `voice.model`, yalnızca bu ses kanalı turu için yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; ortaya çıkan ses bağlı olunan kanalda çalınır.

Kimlik bilgileri bileşen başına çözülür: `voice.model` için LLM yönlendirme kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması ve `messages.tts`/`voice.tts` için TTS kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak üretir, ancak inceleme ve dönüştürme için gateway ana makinesinde `ffmpeg` ve `ffprobe` bulunmalıdır.

- **Yerel bir dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı yükte metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus'a dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot hiçbir sunucu mesajını görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlıysanız Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engelleniyor">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki sunucu izin listesini doğrulayın
    - sunucu `channels` eşlemesi varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention kalıplarını doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false ama yine de engelleniyor">
    Yaygın nedenler:

    - eşleşen sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (şu konumda olmalıdır: `channels.discord.guilds` veya kanal girdisi altında)
    - gönderici sunucu/kanal `users` izin listesi tarafından engelleniyor

  </Accordion>

  <Accordion title="Uzun çalışan işleyiciler zaman aşımına uğruyor veya yinelenen yanıtlar oluşuyor">

    Tipik günlükler:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener bütçe ayarı:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker çalışma zaman aşımı ayarı:

    - tek hesap: `channels.discord.inboundWorker.runTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - varsayılan: `1800000` (30 dakika); devre dışı bırakmak için `0` ayarlayın

    Önerilen temel değer:

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

    Yavaş listener kurulumu için `eventQueue.listenerTimeout`, kuyruğa alınmış ajan turları için ayrı bir güvenlik valfi istiyorsanız yalnızca `inboundWorker.runTimeoutMs` kullanın.

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal kimlikleri için çalışır.

    Slug anahtarları kullanırsanız çalışma zamanı eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Botlar arası döngüler">
    Varsayılan olarak bot tarafından yazılmış mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız, döngü davranışını önlemek için katı mention ve izin listesi kuralları kullanın.
    Yalnızca botu mention eden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

  </Accordion>

  <Accordion title="Ses STT, DecryptionFailed(...) ile düşüyor">

    - Discord ses alma kurtarma mantığının mevcut olduğundan emin olmak için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` değerini doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` ile başlayın (upstream varsayılanı) ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra sorunlar devam ederse günlükleri toplayın ve upstream DAVE alma geçmişiyle [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ve [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içinde karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma başvurusu

Birincil başvuru: [Configuration reference - Discord](/tr/gateway/config-channels#discord).

<Accordion title="Yüksek sinyalli Discord alanları">

- başlangıç/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (listener bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslimat: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- durum: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve işlemler

- Bot token'larını sır olarak değerlendirin (gözetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalık ilkesine uygun Discord izinleri verin.
- Komut dağıtımı/durumu bayatsa gateway'i yeniden başlatın ve `openclaw channels status --probe` ile tekrar kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve izin listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları ajanlara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Çoklu ajan yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Sunucuları ve kanalları ajanlara eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
