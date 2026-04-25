---
read_when:
    - Kodlama harness'lerini ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesajlaşma kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu ve Plugin bağlantısında sorun giderme
    - ACP tamamlama teslimi veya ajandan ajana döngülerde hata ayıklama
    - Sohbetten `/acp` komutlarını kullanma
summary: Claude Code, Cursor, Gemini CLI, açık Codex ACP fallback, OpenClaw ACP ve diğer harness ajanları için ACP çalışma zamanı oturumlarını kullanın
title: ACP ajanları
x-i18n:
    generated_at: "2026-04-25T13:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları, OpenClaw'ın bir ACP arka uç Plugin'i üzerinden harici kodlama harness'lerini (örneğin Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI ve desteklenen diğer ACPX harness'leri) çalıştırmasını sağlar.

OpenClaw'a düz dilde geçerli konuşmada Codex'i bağlamasını veya denetlemesini isterseniz, OpenClaw yerel Codex app-server Plugin'ini kullanmalıdır (`/codex bind`, `/codex threads`, `/codex resume`). `/acp`, ACP, acpx veya bir Codex arka plan alt oturumu isterseniz, OpenClaw yine de Codex'i ACP üzerinden yönlendirebilir. Her ACP oturumu oluşturma işlemi bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

OpenClaw'a düz dilde "bir ileti dizisinde Claude Code başlat" demeniz veya başka bir harici harness kullanmanız durumunda, OpenClaw bu isteği yerel alt ajan çalışma zamanına değil ACP çalışma zamanına yönlendirmelidir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına harici bir MCP istemcisi olarak doğrudan bağlanmasını istiyorsanız, ACP yerine [`openclaw mcp serve`](/tr/cli/mcp) kullanın.

## Hangi sayfayı istiyorum?

Karıştırılması kolay üç yakın yüzey vardır:

| Şunu yapmak istiyorsunuz...                                                                       | Şunu kullanın                        | Notlar                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Geçerli konuşmada Codex'i bağlamak veya denetlemek                                                | `/codex bind`, `/codex threads`      | Yerel Codex app-server yolu; bağlı sohbet yanıtlarını, görüntü iletmeyi, model/hızlı/izinleri, durdurma ve yönlendirme denetimlerini içerir. ACP açık bir fallback'tir |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici harness'i OpenClaw _üzerinden_ çalıştırmak | Bu sayfa: ACP ajanları               | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı denetimleri                               |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ sunmak    | [`openclaw acp`](/tr/cli/acp)           | Köprü modu. IDE/istemci stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                                                                   |
| Yerel bir AI CLI'yi yalnızca metin kullanan fallback model olarak yeniden kullanmak               | [CLI Backends](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yoktur, ACP denetimleri yoktur, harness çalışma zamanı yoktur                                                               |

## Bu kutudan çıktığı gibi çalışır mı?

Genellikle evet. Yeni kurulumlar varsayılan olarak etkinleştirilmiş paketlenmiş `acpx` çalışma zamanı Plugin'iyle gelir; bu Plugin, başlangıçta OpenClaw'ın yoklayıp kendi kendini onardığı Plugin-yerel, sabitlenmiş bir `acpx` ikilisi içerir. Hazır olma denetimi için `/acp doctor` çalıştırın.

İlk çalıştırma tuzakları:

- Hedef harness bağdaştırıcıları (Codex, Claude vb.) ilk kullanımda `npx` ile isteğe bağlı getirilebilir.
- O harness için üretici kimlik doğrulamasının yine de ana sistemde mevcut olması gerekir.
- Ana sistemde npm veya ağ erişimi yoksa, önbellekler önceden ısıtılana veya bağdaştırıcı başka bir yolla kurulana kadar ilk çalıştırma bağdaştırıcı getirmeleri başarısız olur.

## Operatör çalışma kitabı

Sohbetten hızlı `/acp` akışı:

1. **Oluştur** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` veya açık `/acp spawn codex --bind here`
2. Bağlı konuşmada veya ileti dizisinde **çalışın** (ya da oturum anahtarını açıkça hedefleyin).
3. **Durumu denetleyin** — `/acp status`
4. **Ayarlayın** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. Bağlamı değiştirmeden **yönlendirin** — `/acp steer tighten logging and continue`
6. **Durdurun** — `/acp cancel` (geçerli tur) veya `/acp close` (oturum + bağlar)

Yerel Codex Plugin'ine yönlendirilmesi gereken doğal dil tetikleyicileri:

- "Bu Discord kanalını Codex'e bağla."
- "Bu sohbeti Codex thread `<id>` öğesine ekle."
- "Codex thread'lerini göster, sonra bunu bağla."

Yerel Codex konuşma bağlama, varsayılan sohbet denetim yoludur. OpenClaw
dinamik araçları OpenClaw üzerinden çalışmaya devam ederken, shell/apply-patch
gibi Codex-yerel araçlar Codex içinde çalışır. Codex-yerel araç olayları için
OpenClaw, Plugin kancalarının `before_tool_call` işlemini engellemesi,
`after_tool_call` olayını gözlemlemesi ve Codex `PermissionRequest`
olaylarını OpenClaw onayları üzerinden yönlendirmesi için tur başına yerel bir
kanca aktarma katmanı enjekte eder. v1 aktarma katmanı bilinçli olarak
temkinlidir: Codex-yerel araç bağımsız değişkenlerini değiştirmez, Codex
thread kayıtlarını yeniden yazmaz veya nihai yanıtları/Stop kancalarını
engellemez. ACP'yi yalnızca ACP çalışma zamanı/oturum modelini istediğinizde
açıkça kullanın. Gömülü Codex destek sınırı
[Codex harness v1 support contract](/tr/plugins/codex-harness#v1-support-contract)
belgesinde açıklanmıştır.

ACP çalışma zamanına yönlendirilmesi gereken doğal dil tetikleyicileri:

- "Bunu tek kullanımlık bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
- "Bu görev için bir ileti dizisinde Gemini CLI kullan, sonra takipleri aynı ileti dizisinde tut."
- "Codex'i ACP üzerinden bir arka plan ileti dizisinde çalıştır."

OpenClaw `runtime: "acp"` seçer, harness `agentId` değerini çözümler, destekleniyorsa geçerli konuşmaya veya ileti dizisine bağlanır ve kapatma/süre dolumuna kadar takipleri bu oturuma yönlendirir. Codex bu yolu yalnızca ACP açıkça istendiğinde veya istenen arka plan çalışma zamanının hâlâ ACP gerektirdiği durumlarda izler.

## ACP ve alt ajanlar

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. Codex konuşma bağlama/denetleme için yerel Codex app-server kullanın. OpenClaw-yerel devredilmiş çalıştırmalar istediğinizde alt ajanları kullanın.

| Alan          | ACP oturumu                           | Alt ajan çalıştırması              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Çalışma zamanı | ACP arka uç Plugin'i (örneğin acpx)   | OpenClaw yerel alt ajan çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Ana komutlar  | `/acp ...`                            | `/subagents ...`                   |
| Oluşturma aracı | `sessions_spawn` ile `runtime:"acp"` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Sub-agents](/tr/tools/subagents).

## ACP, Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturumu denetim düzlemi
2. paketlenmiş `acpx` çalışma zamanı Plugin'i
3. Claude ACP bağdaştırıcısı
4. Claude tarafı çalışma zamanı/oturum düzeni

Önemli ayrım:

- ACP Claude; ACP denetimleri, oturum sürdürme, arka plan görevi izleme ve isteğe bağlı konuşma/ileti dizisi bağlama içeren bir harness oturumudur.
- CLI arka uçları ayrı, yalnızca metin kullanan yerel fallback çalışma zamanlarıdır. Bkz. [CLI Backends](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- `/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness işleri istiyorsanız: ACP kullanın
- ham CLI üzerinden basit yerel metin fallback'i istiyorsanız: CLI arka uçlarını kullanın

## Bağlı oturumlar

### Geçerli konuşma bağları

`/acp spawn <harness> --bind here`, geçerli konuşmayı oluşturulan ACP oturumuna sabitler — alt ileti dizisi yoktur, aynı sohbet yüzeyi kullanılır. OpenClaw taşıma, kimlik doğrulama, güvenlik ve teslimata sahip olmaya devam eder; bu konuşmadaki takip mesajları aynı oturuma yönlendirilir; `/new` ve `/reset` oturumu yerinde sıfırlar; `/acp close` bağı kaldırır.

Zihinsel model:

- **sohbet yüzeyi** — insanların konuşmaya devam ettiği yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** — OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **alt ileti dizisi/konu** — yalnızca `--thread ...` ile oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **çalışma zamanı çalışma alanı** — harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, arka uç çalışma alanı). Sohbet yüzeyinden bağımsızdır.

Örnekler:

- `/codex bind` — bu sohbeti koruyun, yerel Codex app-server oluşturun veya ekleyin, gelecekteki mesajları buraya yönlendirin.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — bağlı yerel Codex thread'ini sohbetten ayarlayın.
- `/codex stop` veya `/codex steer focus on the failing tests first` — etkin yerel Codex turunu denetleyin.
- `/acp spawn codex --bind here` — Codex için açık ACP fallback'i.
- `/acp spawn codex --thread auto` — OpenClaw bir alt ileti dizisi/konu oluşturabilir ve oraya bağlayabilir.
- `/acp spawn codex --bind here --cwd /workspace/repo` — aynı sohbet bağı, Codex `/workspace/repo` içinde çalışır.

Notlar:

- `--bind here` ve `--thread ...` birbirini dışlar.
- `--bind here` yalnızca geçerli konuşma bağlamayı bildiren kanallarda çalışır; aksi durumda OpenClaw açık bir desteklenmiyor mesajı döndürür. Bağlar Gateway yeniden başlatmaları arasında kalıcıdır.
- Discord'da `spawnAcpSessions`, yalnızca OpenClaw `--thread auto|here` için bir alt ileti dizisi oluşturmak zorunda olduğunda gereklidir — `--bind here` için değil.
- Farklı bir ACP ajanına `--cwd` olmadan oluşturursanız, OpenClaw varsayılan olarak **hedef ajanın** çalışma alanını devralır. Devralınan eksik yollar (`ENOENT`/`ENOTDIR`) arka uç varsayılanına geri düşer; diğer erişim hataları (ör. `EACCES`) oluşturma hataları olarak gösterilir.

### İleti dizisine bağlı oturumlar

Bir kanal bağdaştırıcısında ileti dizisi bağları etkinleştirildiğinde, ACP oturumları ileti dizilerine bağlanabilir:

- OpenClaw bir ileti dizisini hedef ACP oturumuna bağlar.
- Bu ileti dizisindeki takip mesajları bağlı ACP oturumuna yönlendirilir.
- ACP çıktısı aynı ileti dizisine geri teslim edilir.
- Odak kaldırma/kapatma/arşivleme/boşta kalma zaman aşımı veya azami yaş süresi dolumu bağı kaldırır.

İleti dizisi bağlama desteği bağdaştırıcıya özeldir. Etkin kanal bağdaştırıcısı ileti dizisi bağlarını desteklemiyorsa, OpenClaw açık bir desteklenmiyor/kullanılamıyor mesajı döndürür.

İleti dizisine bağlı ACP için gerekli özellik bayrakları:

- `acp.enabled=true`
- `acp.dispatch.enabled` varsayılan olarak açıktır (ACP dispatch'i duraklatmak için `false` ayarlayın)
- Kanal bağdaştırıcısı ACP thread-spawn bayrağı etkin olmalıdır (bağdaştırıcıya özel)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### İleti dizisini destekleyen kanallar

- Oturum/ileti dizisi bağlama yeteneği sunan herhangi bir kanal bağdaştırıcısı.
- Geçerli yerleşik destek:
  - Discord thread'leri/kanalları
  - Telegram konuları (gruplar/süper gruplardaki forum konuları ve DM konuları)
- Plugin kanalları aynı bağlama arabirimi üzerinden destek ekleyebilir.

## Kanala özgü ayarlar

Geçici olmayan iş akışları için, kalıcı ACP bağlarını üst düzey `bindings[]` girdilerinde yapılandırın.

### Bağ modeli

- `bindings[].type="acp"` kalıcı bir ACP konuşma bağını işaretler.
- `bindings[].match` hedef konuşmayı tanımlar:
  - Discord kanalı veya thread'i: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum konusu: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/grup sohbeti: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağları için `chat_id:*` veya `chat_identifier:*` tercih edin.
  - iMessage DM/grup sohbeti: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağları için `chat_id:*` tercih edin.
- `bindings[].agentId`, sahibi olan OpenClaw ajan kimliğidir.
- İsteğe bağlı ACP geçersiz kılmaları `bindings[].acp` altında bulunur:
  - `mode` (`persistent` veya `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Ajan başına çalışma zamanı varsayılanları

Ajan başına ACP varsayılanlarını bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness kimliği, örneğin `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP bağlı oturumları için geçersiz kılma önceliği:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. genel ACP varsayılanları (örneğin `acp.backend`)

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
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
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
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Davranış:

- OpenClaw, yapılandırılmış ACP oturumunun kullanımdan önce var olmasını sağlar.
- O kanal veya konudaki mesajlar yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağları (örneğin thread-focus akışları tarafından oluşturulanlar), mevcut oldukları yerde yine uygulanır.
- Açık bir `cwd` olmadan çapraz ajan ACP oluşturmalarında OpenClaw, hedef ajan çalışma alanını ajan yapılandırmasından devralır.
- Eksik devralınmış çalışma alanı yolları arka uç varsayılan `cwd` değerine geri düşer; eksiklik dışındaki erişim hataları oluşturma hataları olarak gösterilir.

## ACP oturumlarını başlatma (arabirimler)

### `sessions_spawn` içinden

Bir ajan turundan veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notlar:

- `runtime` varsayılan olarak `subagent` olur; bu yüzden ACP oturumları için açıkça `runtime: "acp"` ayarlayın.
- `agentId` atlanırsa OpenClaw, yapılandırılmışsa `acp.defaultAgent` değerini kullanır.
- `mode: "session"`, kalıcı bağlı bir konuşmayı korumak için `thread: true` gerektirir.

Arabirim ayrıntıları:

- `task` (gerekli): ACP oturumuna gönderilen ilk istem.
- `runtime` (ACP için gerekli): `"acp"` olmalıdır.
- `agentId` (isteğe bağlı): ACP hedef harness kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri düşer.
- `thread` (isteğe bağlı, varsayılan `false`): desteklenen yerlerde thread bağlama akışı ister.
- `mode` (isteğe bağlı): `run` (tek seferlik) veya `session` (kalıcı).
  - varsayılan `run` olur
  - `thread: true` ise ve mod atlanmışsa, OpenClaw çalışma zamanı yoluna göre varsayılan olarak kalıcı davranışı kullanabilir
  - `mode: "session"` için `thread: true` gerekir
- `cwd` (isteğe bağlı): istenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı ilkesi tarafından doğrulanır). Atlanırsa ACP oluşturma, yapılandırılmışsa hedef ajan çalışma alanını devralır; eksik devralınan yollar arka uç varsayılanlarına geri düşerken gerçek erişim hataları döndürülür.
- `label` (isteğe bağlı): oturum/banner metninde kullanılan, operatöre dönük etiket.
- `resumeSessionId` (isteğe bağlı): yenisini oluşturmak yerine mevcut bir ACP oturumunu sürdürür. Ajan konuşma geçmişini `session/load` üzerinden yeniden oynatır. `runtime: "acp"` gerektirir.
- `streamTo` (isteğe bağlı): `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak isteyen oturuma geri akıtır.
  - Kullanılabilir olduğunda kabul edilen yanıtlar, tam aktarma geçmişi için takip edebileceğiniz oturum kapsamlı bir JSONL günlüğüne (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerir.
- `model` (isteğe bağlı): ACP alt oturumu için açık model geçersiz kılması. `runtime: "acp"` için dikkate alınır; böylece alt oturum sessizce hedef ajan varsayılanına düşmek yerine istenen modeli kullanır.

## Teslim modeli

ACP oturumları ya etkileşimli çalışma alanları ya da üst öğeye ait arka plan işleri olabilir. Teslim yolu bu biçime bağlıdır.

### Etkileşimli ACP oturumları

Etkileşimli oturumlar görünür bir sohbet yüzeyinde konuşmaya devam etmek içindir:

- `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
- `/acp spawn ... --thread ...`, bir kanal thread'ini/konusunu ACP oturumuna bağlar.
- Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna gider ve ACP çıktısı aynı kanal/thread/konuya geri teslim edilir.

### Üst öğeye ait tek seferlik ACP oturumları

Başka bir ajan çalıştırması tarafından oluşturulan tek seferlik ACP oturumları, alt ajanlara benzer arka plan alt öğelerdir:

- Üst öğe `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
- Alt öğe kendi ACP harness oturumunda çalışır.
- Tamamlanma, iç görev-tamamlama duyuru yolu üzerinden geri bildirilir.
- Kullanıcıya dönük bir yanıt faydalı olduğunda üst öğe, alt öğe sonucunu normal asistan sesiyle yeniden yazar.

Bu yolu üst öğe ile alt öğe arasında eşten eşe bir sohbet gibi ele almayın. Alt öğenin zaten üst öğeye geri giden bir tamamlanma kanalı vardır.

### `sessions_send` ve A2A teslimi

`sessions_send`, oluşturmadan sonra başka bir oturumu hedefleyebilir. Normal eş oturumları için OpenClaw, mesajı enjekte ettikten sonra ajandan ajana (A2A) bir takip yolu kullanır:

- hedef oturumun yanıtını bekle
- isteğe bağlı olarak isteyenle hedefin sınırlı sayıda takip turu değiş tokuş etmesine izin ver
- hedeften bir duyuru mesajı üretmesini iste
- bu duyuruyu görünür kanala veya thread'e teslim et

Bu A2A yolu, gönderen görünür bir takip istediğinde eş gönderimler için bir fallback'tir. Geniş `tools.sessions.visibility` ayarları altında ilgisiz bir oturum bir ACP hedefini görebilip ona mesaj gönderebildiğinde olduğu gibi etkin kalır.

OpenClaw, yalnızca isteyen kendi üst öğeye ait tek seferlik ACP alt öğesinin üst öğesi olduğunda A2A takibini atlar. Bu durumda görev tamamlamanın üstünde A2A çalıştırmak, alt öğenin sonucuyla üst öğeyi uyandırabilir, üst öğenin yanıtını alt öğeye geri iletebilir ve bir üst/alt yankı döngüsü oluşturabilir. `sessions_send` sonucu, sahip olunan-alt öğe durumu için `delivery.status="skipped"` bildirir çünkü sonuçtan zaten tamamlanma yolu sorumludur.

### Mevcut bir oturumu sürdürme

Yeniden başlatmak yerine önceki bir ACP oturumunu sürdürmek için `resumeSessionId` kullanın. Ajan konuşma geçmişini `session/load` üzerinden yeniden oynatır; böylece önce olanların tam bağlamıyla kaldığı yerden devam eder.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Yaygın kullanım durumları:

- Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin — ajanınıza kaldığınız yerden devam etmesini söyleyin
- CLI içinde etkileşimli olarak başlattığınız bir kodlama oturumunu şimdi ajanınız üzerinden başsız olarak sürdürün
- Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesilen işi devam ettirin

Notlar:

- `resumeSessionId`, `runtime: "acp"` gerektirir — alt ajan çalışma zamanıyla kullanılırsa hata döner.
- `resumeSessionId`, upstream ACP konuşma geçmişini geri yükler; `thread` ve `mode`, oluşturduğunuz yeni OpenClaw oturumuna yine normal şekilde uygulanır, bu yüzden `mode: "session"` için hâlâ `thread: true` gerekir.
- Hedef ajan `session/load` desteği sunmalıdır (Codex ve Claude Code sunar).
- Oturum kimliği bulunamazsa, oluşturma açık bir hatayla başarısız olur — yeni bir oturuma sessiz fallback yoktur.

<Accordion title="Dağıtım sonrası smoke testi">

Bir Gateway dağıtımından sonra, birim testlerine güvenmek yerine canlı bir uçtan uca denetim çalıştırın:

1. Hedef ana sistemde dağıtılmış Gateway sürümünü ve commit'ini doğrulayın.
2. Canlı bir ajana geçici bir ACPX köprü oturumu açın.
3. Bu ajandan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` görevi ile `sessions_spawn` çağırmasını isteyin.
4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
5. Geçici köprü oturumunu temizleyin.

Kapıyı `mode: "run"` üzerinde tutun ve `streamTo: "parent"` değerini atlayın — thread'e bağlı `mode: "session"` ve akış aktarma yolları ayrı, daha zengin entegrasyon geçişleridir.

</Accordion>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ı içinde değil, ana sistem çalışma zamanında çalışır.

Geçerli sınırlamalar:

- İsteyen oturum sandbox içindeyse ACP oluşturmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
  - Hata: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteklemez.
  - Hata: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Sandbox zorlamalı yürütme gerektiğinde `runtime: "subagent"` kullanın.

### `/acp` komutundan

Gerektiğinde sohbetten açık operatör denetimi için `/acp spawn` kullanın.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Temel bayraklar:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Bkz. [Slash Commands](/tr/tools/slash-commands).

## Oturum hedef çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefi kabul eder (`session-key`, `session-id` veya `session-label`).

Çözümleme sırası:

1. Açık hedef bağımsız değişkeni (veya `/acp steer` için `--session`)
   - önce anahtarı dener
   - sonra UUID biçimindeki oturum kimliğini
   - sonra etiketi
2. Geçerli thread bağı (bu konuşma/thread bir ACP oturumuna bağlıysa)
3. Geçerli isteyen oturum fallback'i

Geçerli konuşma bağları ve thread bağları da 2. adıma katılır.

Hiçbir hedef çözümlenmezse OpenClaw açık bir hata döndürür (`Unable to resolve session target: ...`).

## Oluşturma bağ modları

`/acp spawn`, `--bind here|off` destekler.

| Mod    | Davranış                                                              |
| ------ | --------------------------------------------------------------------- |
| `here` | Geçerli etkin konuşmayı yerinde bağlar; hiçbiri etkin değilse başarısız olur. |
| `off`  | Geçerli konuşma bağı oluşturmaz.                                      |

Notlar:

- `--bind here`, "bu kanalı veya sohbeti Codex destekli yap" için en basit operatör yoludur.
- `--bind here` bir alt thread oluşturmaz.
- `--bind here` yalnızca geçerli konuşma bağlama desteği sunan kanallarda kullanılabilir.
- `--bind` ve `--thread`, aynı `/acp spawn` çağrısında birlikte kullanılamaz.

## Oluşturma thread modları

`/acp spawn`, `--thread auto|here|off` destekler.

| Mod    | Davranış                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------- |
| `auto` | Etkin bir thread içindeyse: o thread'i bağlar. Thread dışındaysa: destekleniyorsa bir alt thread oluşturur/bağlar. |
| `here` | Geçerli etkin thread'i gerektirir; içinde değilse başarısız olur.                                  |
| `off`  | Bağ yok. Oturum bağlı olmadan başlar.                                                              |

Notlar:

- Thread bağlama olmayan yüzeylerde varsayılan davranış fiilen `off` olur.
- Thread'e bağlı oluşturma, kanal ilke desteği gerektirir:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Alt thread oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

## ACP denetimleri

| Komut                | Ne yapar                                                | Örnek                                                        |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı olarak geçerli bağ veya thread bağı oluşturur. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | Hedef oturum için devam eden turu iptal eder.           | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve thread hedeflerinin bağını kaldırır. | `/acp close`                                                 |
| `/acp status`        | Arka ucu, modu, durumu, çalışma zamanı seçeneklerini, yetenekleri gösterir. | `/acp status`                                                |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı modunu ayarlar.        | `/acp set-mode plan`                                         |
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneği yazımı.      | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar. | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | Onay ilkesi profilini ayarlar.                          | `/acp permissions strict`                                    |
| `/acp timeout`       | Çalışma zamanı zaman aşımını ayarlar (saniye).          | `/acp timeout 120`                                           |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.        | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Oturum çalışma zamanı seçenek geçersiz kılmalarını kaldırır. | `/acp reset-options`                                     |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                  | `/acp sessions`                                              |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler. | `/acp doctor`                                                |
| `/acp install`       | Deterministik kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                           |

`/acp status`, etkin çalışma zamanı seçeneklerini, ayrıca çalışma zamanı düzeyi ve arka uç düzeyi oturum tanımlayıcılarını gösterir. Bir arka uç bir yetenekten yoksun olduğunda desteklenmeyen-denetim hataları açık şekilde gösterilir. `/acp sessions`, geçerli bağlı veya isteyen oturum için depoyu okur; hedef belirteçleri (`session-key`, `session-id` veya `session-label`), özel ajan başına `session.store` kökleri dahil olmak üzere Gateway oturum keşfi üzerinden çözümlenir.

## Çalışma zamanı seçenekleri eşleme

`/acp`, kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir.

Eşdeğer işlemler:

- `/acp model <id>`, çalışma zamanı yapılandırma anahtarı `model` değerine eşlenir.
- `/acp permissions <profile>`, çalışma zamanı yapılandırma anahtarı `approval_policy` değerine eşlenir.
- `/acp timeout <seconds>`, çalışma zamanı yapılandırma anahtarı `timeout` değerine eşlenir.
- `/acp cwd <path>`, çalışma zamanı `cwd` geçersiz kılmasını doğrudan günceller.
- `/acp set <key> <value>`, genel yoldur.
  - Özel durum: `key=cwd`, `cwd` geçersiz kılma yolunu kullanır.
- `/acp reset-options`, hedef oturum için tüm çalışma zamanı geçersiz kılmalarını temizler.

## acpx harness, Plugin kurulumu ve izinler

acpx harness yapılandırması (Claude Code / Codex / Gemini CLI takma adları),
plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP izin modları için
bkz. [ACP agents — setup](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                    | Düzeltme                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Arka uç Plugin'i eksik veya devre dışı.                                         | Arka uç Plugin'ini kurup etkinleştirin, sonra `/acp doctor` çalıştırın.                                                                                                     |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı.                                                    | `acp.enabled=true` ayarlayın.                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal thread mesajlarından dispatch devre dışı.                                | `acp.dispatch.enabled=true` ayarlayın.                                                                                                                                        |
| `ACP agent "<id>" is not allowed by policy`                                 | Ajan allowlist içinde değil.                                                    | İzin verilen `agentId` kullanın veya `acp.allowedAgents` değerini güncelleyin.                                                                                               |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                         | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin.                                                                                               |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bir bağlanabilir konuşma olmadan kullanıldı.               | Hedef sohbet/kanala gidin ve yeniden deneyin ya da bağsız oluşturma kullanın.                                                                                                |
| `Conversation bindings are unavailable for <channel>.`                      | Bağdaştırıcı, geçerli konuşma ACP bağlama yeteneğine sahip değil.               | Desteklenen yerlerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                        |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, bir thread bağlamı dışında kullanıldı.                         | Hedef thread'e geçin veya `--thread auto`/`off` kullanın.                                                                                                                    |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Başka bir kullanıcı etkin bağ hedefinin sahibi.                                 | Sahibi olarak yeniden bağlayın veya farklı bir konuşma ya da thread kullanın.                                                                                                |
| `Thread bindings are unavailable for <channel>.`                            | Bağdaştırıcıda thread bağlama yeteneği yok.                                     | `--thread off` kullanın veya desteklenen bağdaştırıcı/kanala geçin.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı ana sistem tarafındadır; isteyen oturum sandbox içindedir.   | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP oluşturmayı sandbox olmayan bir oturumdan yapın.                                                       |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                            | Zorunlu sandbox için `runtime="subagent"` kullanın veya sandbox olmayan bir oturumdan ACP'yi `sandbox="inherit"` ile kullanın.                                              |
| Bound session için ACP üst verileri eksik                                   | Eski/silinmiş ACP oturumu üst verileri.                                         | `/acp spawn` ile yeniden oluşturun, sonra thread'i yeniden bağlayın/odaklayın.                                                                                              |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimli olmayan ACP oturumunda yazma/yürütmeyi engelliyor. | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve Gateway'i yeniden başlatın. Bkz. [Permission configuration](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP oturumu az çıktıyla erken başarısız oluyor                              | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor. | Gateway günlüklerinde `AcpRuntimeError` arayın. Tam izinler için `permissionMode=approve-all`; kontrollü bozulma için `nonInteractivePermissions=deny` ayarlayın.          |
| ACP oturumu işi tamamladıktan sonra süresiz takılı kalıyor                  | Harness süreci bitti ama ACP oturumu tamamlandığını bildirmedi.                 | `ps aux \| grep acpx` ile izleyin; eski süreçleri el ile sonlandırın.                                                                                                       |

## İlgili

- [Sub-agents](/tr/tools/subagents)
- [Çok ajanlı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [Ajan gönderimi](/tr/tools/agent-send)
