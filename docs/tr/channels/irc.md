---
read_when:
    - OpenClaw'ı IRC kanallarına veya DM'lere bağlamak istiyorsunuz
    - IRC izin listelerini, grup ilkesini veya bahsetme geçitlemesini yapılandırıyorsunuz
summary: IRC plugin kurulumu, erişim kontrolleri ve sorun giderme
title: IRC
x-i18n:
    generated_at: "2026-04-23T08:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e198c03db9aaf4ec64db462d44d42aa352a2ddba808bcd29e21eb2791d9755ad
    source_path: channels/irc.md
    workflow: 15
---

# IRC

OpenClaw'ı klasik kanallarda (`#room`) ve doğrudan mesajlarda kullanmak istediğinizde IRC kullanın.
IRC, paketlenmiş bir plugin olarak gelir, ancak ana yapılandırmada `channels.irc` altında yapılandırılır.

## Hızlı başlangıç

1. `~/.openclaw/openclaw.json` içinde IRC yapılandırmasını etkinleştirin.
2. En azından şunları ayarlayın:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Bot koordinasyonu için özel bir IRC sunucusunu tercih edin. Kasıtlı olarak herkese açık bir IRC ağı kullanıyorsanız, yaygın seçenekler arasında Libera.Chat, OFTC ve Snoonet bulunur. Bot veya swarm arka kanal trafiği için tahmin edilebilir herkese açık kanallardan kaçının.

3. Gateway'i başlatın/yeniden başlatın:

```bash
openclaw gateway run
```

## Varsayılan güvenlik ayarları

- `channels.irc.dmPolicy` varsayılan olarak `"pairing"` değerini kullanır.
- `channels.irc.groupPolicy` varsayılan olarak `"allowlist"` değerini kullanır.
- `groupPolicy="allowlist"` ile izin verilen kanalları tanımlamak için `channels.irc.groups` ayarlayın.
- Düz metin taşımayı bilerek kabul etmiyorsanız TLS kullanın (`channels.irc.tls=true`).

## Erişim kontrolü

IRC kanalları için iki ayrı “geçit” vardır:

1. **Kanal erişimi** (`groupPolicy` + `groups`): botun bir kanaldan gelen mesajları kabul edip etmediği.
2. **Gönderen erişimi** (`groupAllowFrom` / kanal başına `groups["#channel"].allowFrom`): o kanal içinde botu kimin tetikleyebileceği.

Yapılandırma anahtarları:

- DM izin listesi (DM gönderen erişimi): `channels.irc.allowFrom`
- Grup gönderen izin listesi (kanal gönderen erişimi): `channels.irc.groupAllowFrom`
- Kanal başına kontroller (kanal + gönderen + bahsetme kuralları): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` yapılandırılmamış kanallara izin verir (**varsayılan olarak yine de bahsetme geçitlemesi uygulanır**)

İzin listesi girdileri kararlı gönderen kimliklerini kullanmalıdır (`nick!user@host`).
Salt nick eşleştirmesi değişkendir ve yalnızca `channels.irc.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.

### Sık karşılaşılan sorun: `allowFrom`, kanallar için değil DM'ler içindir

Şuna benzer günlükler görürseniz:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…bu, gönderenin **grup/kanal** mesajları için izinli olmadığı anlamına gelir. Bunu düzeltmek için şunlardan birini yapın:

- `channels.irc.groupAllowFrom` ayarlayın (tüm kanallar için genel), veya
- kanal başına gönderen izin listeleri ayarlayın: `channels.irc.groups["#channel"].allowFrom`

Örnek (`#tuirc-dev` içindeki herkesin botla konuşmasına izin vermek için):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Yanıt tetikleme (bahsetmeler)

Bir kanala izin verilmiş olsa bile (`groupPolicy` + `groups` aracılığıyla) ve gönderene izin verilmiş olsa bile, OpenClaw grup bağlamlarında varsayılan olarak **bahsetme geçitlemesi** kullanır.

Bu, mesaj botla eşleşen bir bahsetme kalıbı içermiyorsa `drop channel … (missing-mention)` gibi günlükler görebileceğiniz anlamına gelir.

Botun bir IRC kanalında **bahsetmeye gerek olmadan** yanıt vermesini sağlamak için, o kanal için bahsetme geçitlemesini devre dışı bırakın:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Ya da **tüm** IRC kanallarına izin vermek için (kanal başına izin listesi olmadan) ve yine de bahsetmeler olmadan yanıt vermek için:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Güvenlik notu (herkese açık kanallar için önerilir)

Herkese açık bir kanalda `allowFrom: ["*"]` değerine izin verirseniz, herkes botu prompt'layabilir.
Riski azaltmak için o kanalın araçlarını kısıtlayın.

### Kanaldaki herkes için aynı araçlar

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Gönderen başına farklı araçlar (sahip daha fazla yetki alır)

`"*"` için daha sıkı, kendi nick'iniz için daha gevşek bir ilke uygulamak üzere `toolsBySender` kullanın:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Notlar:

- `toolsBySender` anahtarları, IRC gönderen kimliği değerleri için `id:` kullanmalıdır:
  daha güçlü eşleştirme için `id:eigen` veya `id:eigen!~eigen@174.127.248.171`.
- Eski önek içermeyen anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.
- İlk eşleşen gönderen ilkesi kazanır; `"*"` joker geri dönüş değeridir.

Grup erişimi ile bahsetme geçitlemesi hakkında daha fazla bilgi için (ve bunların nasıl etkileştiği hakkında), bkz.: [/channels/groups](/tr/channels/groups).

## NickServ

Bağlantıdan sonra NickServ ile kimlik doğrulamak için:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Bağlantıda isteğe bağlı tek seferlik kayıt:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Tekrarlanan REGISTER denemelerini önlemek için nick kaydedildikten sonra `register` seçeneğini devre dışı bırakın.

## Ortam değişkenleri

Varsayılan hesap şunları destekler:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (virgülle ayrılmış)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST`, çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Sorun giderme

- Bot bağlanıyor ancak kanallarda hiç yanıt vermiyorsa, `channels.irc.groups` değerini **ve** bahsetme geçitlemesinin mesajları düşürüp düşürmediğini (`missing-mention`) doğrulayın. Ping olmadan yanıt vermesini istiyorsanız kanal için `requireMention:false` ayarlayın.
- Giriş başarısız olursa, nick kullanılabilirliğini ve sunucu parolasını doğrulayın.
- TLS özel bir ağda başarısız olursa, host/port ve sertifika kurulumunu doğrulayın.

## İlgili

- [Kanal Genel Bakışı](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve pairing akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sertleştirme
