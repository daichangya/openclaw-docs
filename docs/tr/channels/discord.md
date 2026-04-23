---
read_when:
    - Discord kanal özellikleri üzerinde çalışılıyor
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-04-23T08:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Durum: resmi Discord gateway üzerinden DM'ler ve sunucu kanalları için hazır.

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

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa önce [bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve **New Application** seçeneğine tıklayın. Buna "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** seçeneğine tıklayın. **Username** alanını, OpenClaw agent'ınıza verdiğiniz ad neyse ona ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken, aşağı kaydırarak **Privileged Gateway Intents** bölümüne gidin ve şunları etkinleştirin:

    - **Message Content Intent** (zorunlu)
    - **Server Members Intent** (önerilir; rol izin listeleri ve adtan-kimliğe eşleme için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca durum güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** seçeneğine tıklayın.

    <Note>
    Adına rağmen bu işlem ilk token'ınızı üretir — hiçbir şey "sıfırlanmıyor".
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre içinde buna ihtiyacınız olacak.

  </Step>

  <Step title="Bir davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** seçeneğine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    Aşağı kaydırıp **OAuth2 URL Generator** bölümünde şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Altında bir **Bot Permissions** bölümü görünecek. En azından şunları etkinleştirin:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (isteğe bağlı)

    Bu, normal metin kanalları için temel izin kümesidir. Discord thread'lerinde paylaşım yapmayı planlıyorsanız, forum veya medya kanalı iş akışlarıyla thread oluşturma ya da devam ettirme dahil, ayrıca **Send Messages in Threads** iznini de etkinleştirin.
    Altta oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlamak için **Continue** seçeneğine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Developer Mode'u etkinleştirin ve kimliklerinizi toplayın">
    Discord uygulamasına geri dönün; dahili kimlikleri kopyalayabilmek için Developer Mode'u etkinleştirmeniz gerekir.

    1. **User Settings** seçeneğine tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** seçeneğini açın
    2. Kenar çubuğunda **server icon** üzerine sağ tıklayın → **Copy Server ID**
    3. Kendi **avatar**'ınıza sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token ile birlikte kaydedin — sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden gelen DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **server icon** üzerine sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu açık tutun. Yalnızca sunucu kanallarını kullanmayı planlıyorsanız, eşleştirmeden sonra DM'leri kapatabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir gizlidir (parola gibi). Agent'ınıza mesaj göndermeden önce bunu OpenClaw çalıştıran makinede ayarlayın.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw zaten arka plan hizmeti olarak çalışıyorsa, OpenClaw Mac uygulaması üzerinden veya `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        OpenClaw agent'ınızla mevcut herhangi bir kanalda (ör. Telegram) sohbet edin ve bunu söyleyin. Discord ilk kanalınızsa bunun yerine CLI / config sekmesini kullanın.

        > "Discord bot token'ımı zaten config içinde ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
      </Tab>
      <Tab title="CLI / config">
        Dosya tabanlı config tercih ediyorsanız şunu ayarlayın:

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

        Varsayılan hesap için env fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        Düz metin `token` değerleri desteklenir. SecretRef değerleri de `channels.discord.token` için env/file/exec sağlayıcıları genelinde desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="İlk DM eşleştirmesini onaylayın">
    Gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Size bir eşleştirme kodu ile yanıt verecektir.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        Eşleştirme kodunu mevcut kanalınızda agent'ınıza gönderin:

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

    Artık Discord'da agent'ınızla DM üzerinden sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümlemesi hesap farkındalıklıdır. Config içindeki token değerleri env fallback'e üstün gelir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Gelişmiş giden çağrılar için (message tool/channel actions), açıkça belirtilmiş çağrı başına `token` o çağrı için kullanılır. Bu, gönderme ve okuma/probe tarzı işlemler (örneğin read/search/fetch/thread/pins/permissions) için geçerlidir. Hesap ilkesi/yeniden deneme ayarları yine etkin runtime snapshot içindeki seçili hesaptan gelir.
</Note>

## Önerilen: Bir sunucu çalışma alanı kurun

DM'ler çalıştıktan sonra, Discord sunucunuzu her kanalın kendi bağlamına sahip kendi agent oturumunu aldığı tam bir çalışma alanı olarak kurabilirsiniz. Bu, yalnızca sizin ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu sunucu izin listesine ekleyin">
    Bu, agent'ınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        > "Discord Server ID `<server_id>` değerimi sunucu izin listesine ekle"
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

  <Step title="@mention olmadan yanıt vermeye izin verin">
    Varsayılan olarak agent'ınız sunucu kanallarında yalnızca @mention yapıldığında yanıt verir. Özel bir sunucu için büyük olasılıkla her mesaja yanıt vermesini istersiniz.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        > "Agent'ımın bu sunucuda @mention yapılmasına gerek kalmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Config">
        Sunucu config'inizde `requireMention: false` ayarlayın:

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

  <Step title="Sunucu kanallarında bellek kullanımını planlayın">
    Varsayılan olarak uzun vadeli bellek (`MEMORY.md`) yalnızca DM oturumlarında yüklenir. Sunucu kanalları `MEMORY.md` dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        > "Discord kanallarında soru sorduğumda, `MEMORY.md` içinden uzun vadeli bağlam gerekirse memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kalıcı yönergeleri `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun vadeli notları `MEMORY.md` içinde tutun ve ihtiyaç halinde memory araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbete başlayın. Agent'ınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır — böylece iş akışınıza uygun `#coding`, `#home`, `#research` veya başka kanallar kurabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirme deterministiktir: Discord'dan gelenler Discord'a geri yanıtlanır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler agent ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilmiş konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.

## Forum kanalları

Discord forum ve medya kanalları yalnızca thread gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Forum üst öğesine (`channel:<forumId>`) mesaj göndererek otomatik olarak bir thread oluşturun. Thread başlığı, mesajınızın ilk boş olmayan satırını kullanır.
- Doğrudan bir thread oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçmeyin.

Örnek: thread oluşturmak için forum üst öğesine gönderin

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum thread'i oluşturun

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa thread'in kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, agent mesajları için Discord components v2 container desteği sunar. `components` payload'u ile message tool kullanın. Etkileşim sonuçları normal gelen mesajlar olarak yeniden agent'a yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action row'lar en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden fazla kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimlerin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketleri veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar ephemeral bir reddetme alır.

`/model` ve `/models` slash komutları, sağlayıcı ve model açılır menülerinin yanı sıra bir Submit adımı içeren etkileşimli bir model seçici açar. `commands.modelsWrite=false` olmadığı sürece `/models add`, sohbetten yeni bir sağlayıcı/model girişi eklemeyi de destekler ve yeni eklenen modeller gateway yeniden başlatılmadan görünür. Seçici yanıtı ephemeraldir ve yalnızca komutu çağıran kullanıcı bunu kullanabilir.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adı ek referansıyla eşleşmeliyse bunu geçersiz kılmak için `filename` kullanın

Modal formlar:

- En fazla 5 alanla `components.modal` ekleyin
- Alan türleri: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw otomatik olarak bir tetikleme düğmesi ekler

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
          placeholder: "Bir seçenek seçin",
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
        { type: "text", label: "İstek sahibi" },
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
    `channels.discord.dmPolicy`, DM erişimini denetler (eski kullanım: `channels.discord.dm.policy`):

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir; eski kullanım: `channels.discord.dm.allowFrom`)
    - `disabled`

    DM ilkesi açık değilse bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme istenir).

    Çok hesaplı öncelik sırası:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesap için geçerlidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ayarları yoksa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` mention

    Çıplak sayısal kimlikler belirsizdir ve açık bir kullanıcı/kanal hedef türü verilmedikçe reddedilir.

  </Tab>

  <Tab title="Sunucu ilkesi">
    Sunucu işleme davranışı `channels.discord.groupPolicy` ile denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel ayar `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); bunlardan biri yapılandırılmışsa gönderenler `users` VEYA `roles` ile eşleştiğinde izinli olur
    - doğrudan ad/etiket eşleştirme varsayılan olarak kapalıdır; bunu yalnızca acil durum uyumluluk modu olarak `channels.discord.dangerouslyAllowNameMatching: true` ile etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarı verir
    - bir sunucuda `channels` yapılandırılmışsa listede olmayan kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa izin listesine alınmış o sunucudaki tüm kanallara izin verilir

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve bir `channels.discord` bloğu oluşturmazsanız, çalışma zamanı fallback'i `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla), `channels.defaults.groupPolicy` `open` olsa bile.

  </Tab>

  <Tab title="Mention'lar ve grup DM'leri">
    Sunucu mesajları varsayılan olarak mention ile sınırlandırılır.

    Mention algılaması şunları içerir:

    - açık bot mention'ı
    - yapılandırılmış mention kalıpları (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota-yanıtlama davranışı

    `requireMention`, sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, başka bir kullanıcıdan/rolden bahseden ancak bottan bahsetmeyen mesajları isteğe bağlı olarak düşürür (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - isteğe bağlı izin listesi: `dm.groupChannels` (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Role dayalı agent yönlendirmesi

Discord sunucu üyelerini rol kimliğine göre farklı agent'lara yönlendirmek için `bindings[].match.roles` kullanın. Role dayalı bağlamalar yalnızca rol kimliklerini kabul eder ve eş veya üst-eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanların eşleşmesi gerekir.

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

## Developer Portal kurulumu

<AccordionGroup>
  <Accordion title="Uygulama ve bot oluşturun">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Bot token'ını kopyalayın

  </Accordion>

  <Accordion title="Ayrıcalıklı intent'ler">
    **Bot -> Privileged Gateway Intents** altında şunları etkinleştirin:

    - Message Content Intent
    - Server Members Intent (önerilir)

    Presence intent isteğe bağlıdır ve yalnızca durum güncellemeleri almak istiyorsanız gereklidir. Bot durumunu ayarlamak (`setPresence`), üyeler için durum güncellemelerini etkinleştirmeyi gerektirmez.

  </Accordion>

  <Accordion title="OAuth kapsamları ve temel izinler">
    OAuth URL oluşturucu:

    - kapsamlar: `bot`, `applications.commands`

    Tipik temel izinler:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (isteğe bağlı)

    Bu, normal metin kanalları için temel izin kümesidir. Discord thread'lerinde paylaşım yapmayı planlıyorsanız, forum veya medya kanalı iş akışlarıyla thread oluşturma ya da devam ettirme dahil, ayrıca **Send Messages in Threads** iznini de etkinleştirin.
    Açıkça gerekmedikçe `Administrator` kullanmaktan kaçının.

  </Accordion>

  <Accordion title="Kimlikleri kopyalayın">
    Discord Developer Mode'u etkinleştirin, ardından şunları kopyalayın:

    - server ID
    - channel ID
    - user ID

    Güvenilir denetimler ve probe'lar için OpenClaw config içinde sayısal kimlikleri tercih edin.

  </Accordion>
</AccordionGroup>

## Yerel komutlar ve komut yetkilendirmesi

- `commands.native` varsayılan olarak `"auto"` değerindedir ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, daha önce kaydedilmiş Discord yerel komutlarını açıkça temizler.
- Yerel komut yetkilendirmesi, normal mesaj işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Yetkili olmayan kullanıcılar için komutlar yine de Discord arayüzünde görünür olabilir; yürütme yine de OpenClaw yetkilendirmesini uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranış için [Slash komutları](/tr/tools/slash-commands) sayfasına bakın.

Varsayılan slash komutu ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, agent çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` ile denetlenir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt thread'lemeyi devre dışı bırakır. Açık `[[reply_to_*]]` etiketlerine yine de uyulur.
    `first`, tur için ilk giden Discord mesajına örtük yerel yanıt referansını her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt referansını yalnızca gelen turun birden çok mesajdan oluşan debounce edilmiş bir toplu işlem olduğu durumda ekler. Bu, yerel yanıtları her tek mesajlık tur yerine daha çok belirsiz, patlamalı sohbetler için istediğinizde kullanışlıdır.

    Agent'ların belirli mesajları hedefleyebilmesi için mesaj kimlikleri bağlam/geçmiş içinde gösterilir.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir mesaj gönderip metin geldikçe düzenleyerek taslak yanıtları akış halinde sunabilir. `channels.discord.streaming`, `off` (varsayılan) | `partial` | `block` | `progress` değerlerini alır. `progress`, Discord'da `partial` olarak eşlenir; `streamMode` eski bir takma addır ve otomatik olarak taşınır.

    Varsayılan değer `off` olarak kalır çünkü birden fazla bot veya Gateway aynı hesabı paylaştığında Discord önizleme düzenlemeleri hız sınırlarına hızla ulaşır.

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
    - `block`, taslak boyutunda parçalar yayar (boyutu ve kırılma noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık-yanıt finalleri bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), tool/ilerleme güncellemelerinin önizleme mesajını yeniden kullanıp kullanmayacağını denetler.

    Önizleme akışı yalnızca metindir; medya yanıtları normal teslimata fallback yapar. `block` akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve thread davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread davranışı:

    - Discord thread'leri kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal config'ini devralır.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik thread'lerin üst transkriptten başlangıç verisi almasını sağlar. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - Message tool tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme fallback'i sırasında korunur.

    Kanal konuları **güvenilmez** bağlam olarak enjekte edilir. İzin listeleri agent'ı kimin tetikleyebileceğini sınırlar; bu, tam bir ek-bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt agent'lar için thread'e bağlı oturumlar">
    Discord, bir thread'i bir oturum hedefine bağlayabilir; böylece o thread'deki takip mesajları aynı oturuma yönlendirilmeye devam eder (alt agent oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni thread'i bir alt agent/oturum hedefine bağlar
    - `/unfocus` geçerli thread bağını kaldırır
    - `/agents` etkin çalıştırmaları ve bağ durumu gösterir
    - `/session idle <duration|off>` odaklı bağlamalar için hareketsizlik nedeniyle otomatik odak kaldırmayı görüntüler/günceller
    - `/session max-age <duration|off>` odaklı bağlamalar için kesin azami yaşı görüntüler/günceller

    Config:

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
        spawnSubagentSessions: false, // isteğe bağlı etkinleştirme
      },
    },
  },
}
```

    Notlar:

    - `session.threadBindings.*` genel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*`, Discord davranışını geçersiz kılar.
    - `spawnSubagentSessions`, `sessions_spawn({ thread: true })` için thread'leri otomatik oluşturup bağlamak üzere true olmalıdır.
    - `spawnAcpSessions`, ACP için thread'leri otomatik oluşturup bağlamak üzere true olmalıdır (`/acp spawn ... --thread ...` veya `sessions_spawn({ runtime: "acp", thread: true })`).
    - Bir hesap için thread bağlamaları devre dışıysa `/focus` ve ilgili thread bağlama işlemleri kullanılamaz.

    Bkz. [Sub-agents](/tr/tools/subagents), [ACP Agents](/tr/tools/acp-agents) ve [Configuration Reference](/tr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı, "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey türlendirilmiş ACP bağlamaları yapılandırın.

    Config yolu:

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

    - `/acp spawn codex --bind here`, geçerli kanalı veya thread'i yerinde bağlar ve gelecekteki mesajları aynı ACP oturumunda tutar. Thread mesajları üst kanal bağlamasını devralır.
    - Bağlanmış bir kanal veya thread içinde `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici thread bağlamaları etkinken hedef çözümlemeyi geçersiz kılabilir.
    - `spawnAcpSessions`, yalnızca OpenClaw'ın `--thread auto|here` aracılığıyla bir alt thread oluşturup bağlaması gerektiğinde gereklidir.

    Bağlama davranışı ayrıntıları için [ACP Agents](/tr/tools/acp-agents) sayfasına bakın.

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Sunucu başına tepki bildirimi modu:

    - `off`
    - `own` (varsayılan)
    - `all`
    - `allowlist` (`guilds.<id>.users` kullanır)

    Tepki olayları sistem olaylarına dönüştürülür ve yönlendirilen Discord oturumuna eklenir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent kimliği emoji fallback'i (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
    - Bir kanal ya da hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Config yazımları">
    Kanal tarafından başlatılan config yazımları varsayılan olarak etkindir.

    Bu, `/config set|unset` akışlarını etkiler (komut özellikleri etkin olduğunda).

    Devre dışı bırakma:

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
    Discord gateway WebSocket trafiğini ve başlangıç REST sorgularını (uygulama kimliği + izin listesi çözümlemesi) `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

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
        token: "pk_live_...", // isteğe bağlı; özel sistemler için gerekir
      },
    },
  },
}
```

    Notlar:

    - izin listeleri `pk:<memberId>` kullanabilir
    - üye görünen adları yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ad/slug ile eşleştirilir
    - sorgular özgün mesaj kimliğini kullanır ve zaman penceresiyle sınırlıdır
    - sorgu başarısız olursa proxy'lenmiş mesajlar bot mesajı olarak değerlendirilir ve `allowBots=true` olmadığı sürece düşürülür

  </Accordion>

  <Accordion title="Durum yapılandırması">
    Durum güncellemeleri, bir durum ya da etkinlik alanı ayarladığınızda veya otomatik durumu etkinleştirdiğinizde uygulanır.

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
      activity: "Odaklanma zamanı",
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

    - 0: Oynuyor
    - 1: Yayın yapıyor (`activityUrl` gerektirir)
    - 2: Dinliyor
    - 3: İzliyor
    - 4: Özel (etkinlik metnini durum durumu olarak kullanır; emoji isteğe bağlıdır)
    - 5: Rekabet ediyor

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

    Otomatik durum, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => online, bozulmuş veya bilinmeyen => idle, tükenmiş veya kullanılamaz => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord içinde onaylar">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda yayınlayabilir.

    Config yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine fallback yapar)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamışsa veya `"auto"` ise ve en az bir onaylayan çözümlenebiliyorsa, ister `execApprovals.approvers` ister `commands.ownerAllowFrom` üzerinden olsun, yerel exec onaylarını otomatik etkinleştirir. Discord, kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` değerlerinden exec onaylayıcı çıkarmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Yalnızca çözümlenen onaylayanlar düğmeleri kullanabilir; diğer kullanıcılar ephemeral bir reddetme alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw DM teslimine fallback yapar.

    Discord ayrıca diğer sohbet kanallarının kullandığı paylaşılan onay düğmelerini de işler. Yerel Discord bağdaştırıcısı esas olarak onaylayıcı DM yönlendirmesi ve kanal fanout ekler.
    Bu düğmeler mevcut olduğunda bunlar birincil onay UX'i olur; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun
    manuel onay olduğunu söylediğinde manuel bir `/approve` komutu içermelidir.

    Gateway kimlik doğrulaması ve onay çözümlemesi, paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden çözülür; diğer kimlikler `exec.approval.resolve` üzerinden çözülür). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec approvals](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools ve eylem geçitleri

Discord mesaj eylemleri mesajlaşma, kanal yönetimi, moderasyon, durum ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, planlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem geçitleri `channels.discord.actions.*` altında bulunur.

Varsayılan geçit davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin      |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord mesaj eylemleri özel UI için `components` da kabul edebilir (ileri seviye; discord tool aracılığıyla bir bileşen payload'u oluşturmayı gerektirir), ancak eski `embeds` hâlâ kullanılabilir olsa da önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen container'ları için kullanılan vurgu rengini ayarlar (hex).
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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **voice channels** (sürekli konuşmalar) ve **voice message attachments** (dalga biçimi önizleme biçimi). Gateway ikisini de destekler.

### Voice channels

Gereksinimler:

- Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
- `channels.discord.voice` yapılandırın.
- Botun hedef ses kanalında Connect + Speak izinlerine sahip olması gerekir.

Oturumları denetlemek için `/vc join|leave|status` kullanın. Komut hesap varsayılan agent'ını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

Otomatik katılma örneği:

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

Notlar:

- `voice.tts`, yalnızca ses oynatma için `messages.tts` değerini geçersiz kılar.
- Ses transkript turları sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) değerinden türetir; sahip olmayan konuşmacılar yalnızca sahip araçlara erişemez (örneğin `gateway` ve `cron`).
- Ses varsayılan olarak etkindir; devre dışı bırakmak için `channels.discord.voice.enabled=false` ayarlayın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine aynen geçirilir.
- `@discordjs/voice` varsayılanları ayarlanmamışsa `daveEncryption=true` ve `decryptionFailureTolerance=24` değerleridir.
- OpenClaw ayrıca alma çözme başarısızlıklarını izler ve kısa bir zaman penceresinde tekrarlanan başarısızlıklardan sonra ses kanalından ayrılıp yeniden katılarak otomatik toparlanır.
- Alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa, bu [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) içinde izlenen yukarı akış `@discordjs/voice` alma hatası olabilir.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak oluşturur, ancak inceleme ve dönüştürme için gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini çıkartın (Discord aynı payload içinde metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus'a dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot sunucu mesajlarını görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağımlıysanız Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engelleniyor">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki sunucu izin listesini doğrulayın
    - sunucu `channels` eşlemesi varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention kalıplarını doğrulayın

    Yararlı denetimler:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false ama yine de engelleniyor">
    Yaygın nedenler:

    - eşleşen sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış ( `channels.discord.guilds` veya kanal girdisi altında olmalıdır )
    - gönderen, sunucu/kanal `users` izin listesi tarafından engelleniyor

  </Accordion>

  <Accordion title="Uzun süren handler'lar zaman aşımına uğruyor veya yinelenen yanıtlar oluşuyor">

    Tipik günlükler:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener bütçe ayarı:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çok hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker çalıştırma zaman aşımı ayarı:

    - tek hesap: `channels.discord.inboundWorker.runTimeoutMs`
    - çok hesap: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - varsayılan: `1800000` (30 dakika); devre dışı bırakmak için `0` ayarlayın

    Önerilen temel ayar:

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

    Yavaş listener kurulumu için `eventQueue.listenerTimeout`, kuyruğa alınmış agent turları için ayrı bir güvenlik supabı istiyorsanız yalnızca `inboundWorker.runTimeoutMs` kullanın.

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin denetimleri yalnızca sayısal kanal kimlikleri için çalışır.

    Slug anahtarları kullanıyorsanız çalışma zamanı eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski kullanım: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bottan bota döngüler">
    Varsayılan olarak bot tarafından yazılmış mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız, döngü davranışını önlemek için sıkı mention ve izin listesi kuralları kullanın.
    Yalnızca bottan bahseden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

  </Accordion>

  <Accordion title="Voice STT, DecryptionFailed(...) ile düşüyor">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` olduğunu doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` (yukarı akış varsayılanı) ile başlayın ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar sürerse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma başvuru işaretçileri

Birincil başvuru:

- [Configuration reference - Discord](/tr/gateway/configuration-reference#discord)

Yüksek sinyalli Discord alanları:

- başlangıç/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (listener bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslimat: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb`, `retry`
  - `mediaMaxMb`, giden Discord yüklemelerini sınırlar (varsayılan: `100MB`)
- eylemler: `actions.*`
- durum: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Güvenlik ve işlemler

- Bot token'larını gizli olarak değerlendirin (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- Asgari ayrıcalıklı Discord izinleri verin.
- Komut dağıtımı/durumu bayatsa gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden denetleyin.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Güvenlik](/tr/gateway/security)
- [Çok agent'lı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
- [Slash komutları](/tr/tools/slash-commands)
