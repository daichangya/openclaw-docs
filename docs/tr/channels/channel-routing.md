---
read_when:
    - Kanal yönlendirmesini veya gelen kutusu davranışını değiştirme
summary: Kanal başına yönlendirme kuralları (WhatsApp, Telegram, Discord, Slack) ve paylaşılan bağlam
title: Kanal Yönlendirme
x-i18n:
    generated_at: "2026-04-23T08:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad1101d9d3411d9e9f48efd14c0dab09d76e83a6bd93c713d38efc01a14c8391
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanallar ve yönlendirme

OpenClaw yanıtları **mesajın geldiği kanala geri** yönlendirir. Model bir kanal
seçmez; yönlendirme deterministiktir ve ana makine yapılandırması tarafından
kontrol edilir.

## Temel terimler

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, ayrıca plugin kanalları. `webchat`, dahili WebChat UI kanalıdır ve yapılandırılabilir bir giden kanal değildir.
- **AccountId**: kanal başına hesap örneği (desteklendiğinde).
- İsteğe bağlı kanal varsayılan hesabı: `channels.<channel>.defaultAccount`,
  bir giden yol `accountId` belirtmediğinde hangi hesabın kullanılacağını seçer.
  - Çok hesaplı kurulumlarda, iki veya daha fazla hesap yapılandırıldığında açık bir varsayılan ayarlayın (`defaultAccount` veya `accounts.default`). Bu olmadan, yedek yönlendirme ilk normalize edilmiş hesap kimliğini seçebilir.
- **AgentId**: yalıtılmış bir çalışma alanı + oturum deposu (“beyin”).
- **SessionKey**: bağlamı depolamak ve eşzamanlılığı kontrol etmek için kullanılan kova anahtarı.

## Oturum anahtarı biçimleri (örnekler)

Doğrudan mesajlar varsayılan olarak aracının **ana** oturumunda birleştirilir:

- `agent:<agentId>:<mainKey>` (varsayılan: `agent:main:main`)

Doğrudan mesaj konuşma geçmişi ana oturumla paylaşıldığında bile, harici DM'ler
için korumalı alan ve araç ilkesi, türetilmiş hesap başına doğrudan sohbet
çalışma zamanı anahtarı kullanır; böylece kanal kaynaklı mesajlar yerel ana
oturum çalıştırmaları gibi değerlendirilmez.

Gruplar ve kanallar her kanal için yalıtılmış kalır:

- Gruplar: `agent:<agentId>:<channel>:group:<id>`
- Kanallar/odalar: `agent:<agentId>:<channel>:channel:<id>`

İş parçacıkları:

- Slack/Discord iş parçacıkları temel anahtara `:thread:<threadId>` ekler.
- Telegram forum başlıkları grup anahtarına `:topic:<topicId>` gömer.

Örnekler:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ana DM rota sabitleme

`session.dmScope` değeri `main` olduğunda, doğrudan mesajlar tek bir ana
oturumu paylaşabilir. Oturumun `lastRoute` değerinin sahip olmayan DM'ler
tarafından üzerine yazılmasını önlemek için OpenClaw, aşağıdaki koşulların tümü
doğru olduğunda `allowFrom` içinden sabitlenmiş bir sahip çıkarır:

- `allowFrom` tam olarak bir adet joker olmayan girişe sahiptir.
- Giriş, o kanal için somut bir gönderici kimliğine normalize edilebilir.
- Gelen DM göndereni bu sabitlenmiş sahip ile eşleşmez.

Bu eşleşmeme durumunda OpenClaw yine de gelen oturum meta verilerini kaydeder,
ancak ana oturum `lastRoute` değerini güncellemeyi atlar.

## Yönlendirme kuralları (bir aracının nasıl seçildiği)

Yönlendirme, gelen her mesaj için **bir aracı** seçer:

1. **Tam eş düzeyi eşleşme** (`peer.kind` + `peer.id` ile `bindings`).
2. **Üst eş düzeyi eşleşme** (iş parçacığı devralma).
3. **Sunucu + roller eşleşmesi** (Discord) `guildId` + `roles` üzerinden.
4. **Sunucu eşleşmesi** (Discord) `guildId` üzerinden.
5. **Takım eşleşmesi** (Slack) `teamId` üzerinden.
6. **Hesap eşleşmesi** (kanalda `accountId`).
7. **Kanal eşleşmesi** (o kanaldaki herhangi bir hesap, `accountId: "*"`).
8. **Varsayılan aracı** (`agents.list[].default`, aksi halde listedeki ilk giriş, yedek olarak `main`).

Bir bağlama birden fazla eşleşme alanı içerdiğinde (`peer`, `guildId`, `teamId`, `roles`), o bağlamanın uygulanması için **sağlanan tüm alanlar eşleşmelidir**.

Eşleşen aracı, hangi çalışma alanının ve oturum deposunun kullanılacağını belirler.

## Yayın grupları (birden fazla aracı çalıştırma)

Yayın grupları, OpenClaw **normalde yanıt vereceği zaman** aynı eş düzeyi için
**birden fazla aracı** çalıştırmanıza olanak tanır (örneğin: WhatsApp
gruplarında, bahsetme/etkinleştirme geçidinden sonra).

Yapılandırma:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Bkz.: [Yayın Grupları](/tr/channels/broadcast-groups).

## Yapılandırma genel görünümü

- `agents.list`: adlandırılmış aracı tanımları (çalışma alanı, model vb.).
- `bindings`: gelen kanalları/hesapları/eş düzeyleri aracılara eşler.

Örnek:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Oturum depolama

Oturum depoları durum dizini altında bulunur (varsayılan `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL dökümleri depo ile aynı yerde bulunur

Depo yolunu `session.store` ve `{agentId}` şablonlaması aracılığıyla geçersiz kılabilirsiniz.

Gateway ve ACP oturum keşfi, varsayılan `agents/` kökü altında ve şablonlanmış
`session.store` kökleri altında disk destekli aracı depolarını da tarar.
Keşfedilen depolar bu çözümlenmiş aracı kökünün içinde kalmalı ve normal bir
`sessions.json` dosyası kullanmalıdır. Sembolik bağlantılar ve kök dışı yollar
yok sayılır.

## WebChat davranışı

WebChat **seçilen aracıya** bağlanır ve varsayılan olarak aracının ana oturumunu
kullanır. Bu nedenle WebChat, o aracı için kanallar arası bağlamı tek bir yerde
görmenizi sağlar.

## Yanıt bağlamı

Gelen yanıtlar şunları içerir:

- Mümkün olduğunda `ReplyToId`, `ReplyToBody` ve `ReplyToSender`.
- Alıntılanan bağlam, `Body` alanına `[Replying to ...]` bloğu olarak eklenir.

Bu, kanallar arasında tutarlıdır.
