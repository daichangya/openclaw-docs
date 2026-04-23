---
read_when:
    - ACP tabanlı IDE entegrasyonlarını ayarlama
    - ACP oturum yönlendirmesini Gateway'e hata ayıklama
summary: IDE entegrasyonları için ACP köprüsünü çalıştırın
title: acp
x-i18n:
    generated_at: "2026-04-23T08:58:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

OpenClaw Gateway ile konuşan [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) köprüsünü çalıştırın.

Bu komut, IDE'ler için stdio üzerinden ACP konuşur ve istemleri WebSocket üzerinden Gateway'e iletir. ACP oturumlarını Gateway oturum anahtarlarıyla eşlenmiş halde tutar.

`openclaw acp`, tam ACP yerel editör çalışma zamanı değil, Gateway destekli bir ACP köprüsüdür. Oturum yönlendirmesine, istem teslimine ve temel akış güncellemelerine odaklanır.

Harici bir MCP istemcisinin bir ACP harness oturumu barındırmak yerine doğrudan OpenClaw kanal konuşmalarıyla konuşmasını istiyorsanız, bunun yerine [`openclaw mcp serve`](/tr/cli/mcp) kullanın.

## Bu ne değildir

Bu sayfa sık sık ACP harness oturumlarıyla karıştırılır.

`openclaw acp` şu anlama gelir:

- OpenClaw bir ACP sunucusu gibi davranır
- bir IDE veya ACP istemcisi OpenClaw'a bağlanır
- OpenClaw bu işi bir Gateway oturumuna iletir

Bu, OpenClaw'ın `acpx` üzerinden Codex veya Claude Code gibi harici bir harness çalıştırdığı [ACP Agents](/tr/tools/acp-agents) yapısından farklıdır.

Hızlı kural:

- editör/istemci ACP ile OpenClaw'a konuşmak istiyorsa: `openclaw acp` kullanın
- OpenClaw Codex/Claude/Gemini'yi bir ACP harness olarak başlatmalıysa: `/acp spawn` ve [ACP Agents](/tr/tools/acp-agents) kullanın

## Uyumluluk Matrisi

| ACP alanı                                                             | Durum       | Notlar                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Uygulandı   | Stdio üzerinden Gateway chat/send + abort için çekirdek köprü akışı.                                                                                                                                                                            |
| `listSessions`, slash komutları                                       | Uygulandı   | Oturum listesi Gateway oturum durumuna karşı çalışır; komutlar `available_commands_update` ile ilan edilir.                                                                                                                                    |
| `loadSession`                                                         | Kısmi       | ACP oturumunu bir Gateway oturum anahtarına yeniden bağlar ve depolanan kullanıcı/assistant metin geçmişini yeniden oynatır. Araç/sistem geçmişi henüz yeniden oluşturulmaz.                                                                   |
| İstem içeriği (`text`, gömülü `resource`, görseller)                  | Kısmi       | Metin/kaynaklar sohbet girdisine düzleştirilir; görseller Gateway eklerine dönüşür.                                                                                                                                                             |
| Oturum kipleri                                                        | Kısmi       | `session/set_mode` desteklenir ve köprü, düşünce düzeyi, araç ayrıntı düzeyi, akıl yürütme, kullanım ayrıntısı ve yükseltilmiş eylemler için başlangıç Gateway destekli oturum denetimlerini sunar. Daha geniş ACP yerel kip/yapılandırma yüzeyleri hâlâ kapsam dışıdır. |
| Oturum bilgisi ve kullanım güncellemeleri                             | Kısmi       | Köprü, önbelleğe alınmış Gateway oturum anlık görüntülerinden `session_info_update` ve en iyi çabayla `usage_update` bildirimleri üretir. Kullanım yaklaşıktır ve yalnızca Gateway belirteç toplamlarını taze olarak işaretlediğinde gönderilir. |
| Araç akışı                                                            | Kısmi       | `tool_call` / `tool_call_update` olayları, Gateway araç argümanları/sonuçları bunları sunduğunda ham G/Ç, metin içeriği ve en iyi çabayla dosya konumlarını içerir. Gömülü terminaller ve daha zengin diff tabanlı çıktı hâlâ sunulmaz.          |
| Oturum başına MCP sunucuları (`mcpServers`)                           | Desteklenmiyor | Köprü kipi, oturum başına MCP sunucusu isteklerini reddeder. MCP'yi bunun yerine OpenClaw gateway veya agent üzerinde yapılandırın.                                                                                                          |
| İstemci dosya sistemi yöntemleri (`fs/read_text_file`, `fs/write_text_file`) | Desteklenmiyor | Köprü ACP istemci dosya sistemi yöntemlerini çağırmaz.                                                                                                                                                                                     |
| İstemci terminal yöntemleri (`terminal/*`)                            | Desteklenmiyor | Köprü ACP istemci terminalleri oluşturmaz veya terminal kimliklerini araç çağrıları üzerinden akıtmaz.                                                                                                                                      |
| Oturum planları / düşünce akışı                                       | Desteklenmiyor | Köprü şu anda ACP planı veya düşünce güncellemeleri değil, çıktı metni ve araç durumu üretir.                                                                                                                                               |

## Bilinen Sınırlamalar

- `loadSession`, depolanan kullanıcı ve assistant metin geçmişini yeniden oynatır, ancak geçmiş araç çağrılarını, sistem bildirimlerini veya daha zengin ACP yerel olay türlerini yeniden oluşturmaz.
- Birden fazla ACP istemcisi aynı Gateway oturum anahtarını paylaşıyorsa, olay ve iptal yönlendirmesi istemci başına kesin olarak yalıtılmış değil, en iyi çabadır. Temiz editör yerel turlar gerektiğinde varsayılan yalıtılmış `acp:<uuid>` oturumlarını tercih edin.
- Gateway durdurma durumları ACP durdurma nedenlerine çevrilir, ancak bu eşleme tam ACP yerel bir çalışma zamanından daha az ifade gücüne sahiptir.
- Başlangıç oturum denetimleri şu anda Gateway düğmelerinin odaklanmış bir alt kümesini sunar: düşünce düzeyi, araç ayrıntı düzeyi, akıl yürütme, kullanım ayrıntısı ve yükseltilmiş eylemler. Model seçimi ve exec-host denetimleri henüz ACP yapılandırma seçenekleri olarak sunulmaz.
- `session_info_update` ve `usage_update`, canlı ACP yerel çalışma zamanı muhasebesinden değil Gateway oturum anlık görüntülerinden türetilir. Kullanım yaklaşıktır, maliyet verisi taşımaz ve yalnızca Gateway toplam belirteç verisini taze olarak işaretlediğinde üretilir.
- Araç takip verisi en iyi çabayladır. Köprü, bilinen araç argümanları/sonuçlarında görünen dosya yollarını gösterebilir, ancak henüz ACP terminalleri veya yapılandırılmış dosya diff'leri üretmez.

## Kullanım

```bash
openclaw acp

# Uzak Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Uzak Gateway (dosyadan token)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Mevcut bir oturum anahtarına bağlan
openclaw acp --session agent:main:main

# Etikete göre bağlan (önceden var olmalı)
openclaw acp --session-label "support inbox"

# İlk istemden önce oturum anahtarını sıfırla
openclaw acp --session agent:main:main --reset-session
```

## ACP istemcisi (hata ayıklama)

IDE olmadan köprüyü akıl sağlığı testi için yerleşik ACP istemcisini kullanın.
ACP köprüsünü başlatır ve istemleri etkileşimli olarak yazmanıza izin verir.

```bash
openclaw acp client

# Başlatılan köprüyü uzak bir Gateway'e yönlendirin
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Sunucu komutunu geçersiz kılın (varsayılan: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

İzin modeli (istemci hata ayıklama kipi):

- Otomatik onay izin listesi tabanlıdır ve yalnızca güvenilir çekirdek araç kimliklerine uygulanır.
- `read` otomatik onayı geçerli çalışma diziniyle sınırlıdır (`--cwd` ayarlıysa).
- ACP yalnızca dar salt okunur sınıfları otomatik onaylar: etkin cwd altındaki kapsamlı `read` çağrıları ile salt okunur arama araçları (`search`, `web_search`, `memory_search`). Bilinmeyen/çekirdek dışı araçlar, kapsam dışı okumalar, yürütme yetenekli araçlar, kontrol düzlemi araçları, değiştirici araçlar ve etkileşimli akışlar her zaman açık istem onayı gerektirir.
- Sunucu tarafından sağlanan `toolCall.kind`, güvenilmeyen meta veri olarak değerlendirilir (yetkilendirme kaynağı değildir).
- Bu ACP köprüsü ilkesi, ACPX harness izinlerinden ayrıdır. OpenClaw'ı `acpx` arka ucu üzerinden çalıştırırsanız, `plugins.entries.acpx.config.permissionMode=approve-all`, o harness oturumu için acil durum “yolo” anahtarıdır.

## Bu nasıl kullanılır

Bir IDE'nin (veya başka bir istemcinin) Agent Client Protocol konuştuğu ve bunun bir OpenClaw Gateway oturumunu sürmesini istediğinizde ACP kullanın.

1. Gateway'in çalıştığından emin olun (yerel veya uzak).
2. Gateway hedefini yapılandırın (yapılandırma veya bayraklarla).
3. IDE'nizi stdio üzerinden `openclaw acp` çalıştıracak şekilde yönlendirin.

Örnek yapılandırma (kalıcı):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Örnek doğrudan çalıştırma (yapılandırma yazmadan):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# yerel süreç güvenliği için tercih edilir
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agent seçimi

ACP agent'ları doğrudan seçmez. Gateway oturum anahtarına göre yönlendirir.

Belirli bir agent'ı hedeflemek için agent kapsamlı oturum anahtarları kullanın:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Her ACP oturumu tek bir Gateway oturum anahtarına eşlenir. Bir agent'ın birçok oturumu olabilir; anahtarı veya etiketi geçersiz kılmadığınız sürece ACP varsayılan olarak yalıtılmış bir `acp:<uuid>` oturumu kullanır.

Oturum başına `mcpServers`, köprü kipinde desteklenmez. Bir ACP istemcisi bunları `newSession` veya `loadSession` sırasında gönderirse, köprü sessizce yok saymak yerine açık bir hata döndürür.

ACPX destekli oturumların OpenClaw plugin araçlarını veya `cron` gibi seçili yerleşik araçları görmesini istiyorsanız, oturum başına `mcpServers` geçirmeye çalışmak yerine gateway tarafı ACPX MCP köprülerini etkinleştirin. Bkz. [ACP Agents](/tr/tools/acp-agents#plugin-tools-mcp-bridge) ve [OpenClaw tools MCP bridge](/tr/tools/acp-agents#openclaw-tools-mcp-bridge).

## `acpx` içinden kullanım (Codex, Claude, diğer ACP istemcileri)

Codex veya Claude Code gibi bir kodlama agent'ının ACP üzerinden OpenClaw botunuzla konuşmasını istiyorsanız, yerleşik `openclaw` hedefiyle `acpx` kullanın.

Tipik akış:

1. Gateway'i çalıştırın ve ACP köprüsünün ona erişebildiğinden emin olun.
2. `acpx openclaw`'ı `openclaw acp`'ye yönlendirin.
3. Kodlama agent'ının kullanmasını istediğiniz OpenClaw oturum anahtarını hedefleyin.

Örnekler:

```bash
# Varsayılan OpenClaw ACP oturumunuza tek seferlik istek
acpx openclaw exec "Etkin OpenClaw oturum durumunu özetle."

# Takip turları için kalıcı adlandırılmış oturum
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Bu depo ile ilgili son bağlamı OpenClaw iş agent'ımdan iste."
```

`acpx openclaw`'ın her seferinde belirli bir Gateway ve oturum anahtarını hedeflemesini istiyorsanız, `~/.acpx/config.json` içindeki `openclaw` agent komutunu geçersiz kılın:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Depoya yerel bir OpenClaw checkout'u için, ACP akışı temiz kalsın diye dev runner yerine doğrudan CLI giriş noktasını kullanın. Örneğin:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Bu, Codex, Claude Code veya ACP farkındalığı olan başka bir istemcinin bir terminali kazımadan OpenClaw agent'ından bağlamsal bilgi çekmesini sağlamanın en kolay yoludur.

## Zed editörü kurulumu

`~/.config/zed/settings.json` içine özel bir ACP agent'ı ekleyin (veya Zed'in Ayarlar arayüzünü kullanın):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Belirli bir Gateway veya agent'ı hedeflemek için:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed'de Agent panelini açın ve bir iş parçacığı başlatmak için “OpenClaw ACP” seçeneğini seçin.

## Oturum eşleme

Varsayılan olarak ACP oturumları, `acp:` önekli yalıtılmış bir Gateway oturum anahtarı alır.
Bilinen bir oturumu yeniden kullanmak için bir oturum anahtarı veya etiketi geçin:

- `--session <key>`: belirli bir Gateway oturum anahtarı kullanır.
- `--session-label <label>`: mevcut bir oturumu etikete göre çözümler.
- `--reset-session`: bu anahtar için yeni bir oturum kimliği üretir (aynı anahtar, yeni transcript).

ACP istemciniz meta veriyi destekliyorsa, oturum başına geçersiz kılabilirsiniz:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Oturum anahtarları hakkında daha fazla bilgi için [/concepts/session](/tr/concepts/session) sayfasına bakın.

## Seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırılmışsa varsayılan olarak gateway.remote.url kullanılır).
- `--token <token>`: Gateway kimlik doğrulama belirteci.
- `--token-file <path>`: Gateway kimlik doğrulama belirtecini dosyadan okur.
- `--password <password>`: Gateway kimlik doğrulama parolası.
- `--password-file <path>`: Gateway kimlik doğrulama parolasını dosyadan okur.
- `--session <key>`: varsayılan oturum anahtarı.
- `--session-label <label>`: çözümlenecek varsayılan oturum etiketi.
- `--require-existing`: oturum anahtarı/etiketi yoksa başarısız olur.
- `--reset-session`: ilk kullanımdan önce oturum anahtarını sıfırlar.
- `--no-prefix-cwd`: istemlerin başına çalışma dizinini eklemez.
- `--provenance <off|meta|meta+receipt>`: ACP provenance meta verisini veya receipt'leri içerir.
- `--verbose, -v`: stderr'e ayrıntılı günlükleme.

Güvenlik notu:

- `--token` ve `--password`, bazı sistemlerde yerel süreç listelerinde görünebilir.
- `--token-file`/`--password-file` veya ortam değişkenlerini (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) tercih edin.
- Gateway kimlik doğrulama çözümlemesi, diğer Gateway istemcileri tarafından kullanılan paylaşılan sözleşmeyi izler:
  - yerel kip: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` geri dönüşü (yapılandırılmış ama çözümlenmemiş yerel SecretRef'ler kapalı başarısız olur)
  - uzak kip: uzak öncelik kurallarına göre env/yapılandırma geri dönüşüyle `gateway.remote.*`
  - `--url`, güvenli geçersiz kılma içindir ve örtük yapılandırma/env kimlik bilgilerini yeniden kullanmaz; açık `--token`/`--password` (veya dosya varyantlarını) geçin
- ACP çalışma zamanı arka ucu alt süreçleri `OPENCLAW_SHELL=acp` alır; bu, bağlama özgü shell/profile kuralları için kullanılabilir.
- `openclaw acp client`, başlatılan köprü sürecinde `OPENCLAW_SHELL=acp-client` ayarlar.

### `acp client` seçenekleri

- `--cwd <dir>`: ACP oturumu için çalışma dizini.
- `--server <command>`: ACP sunucu komutu (varsayılan: `openclaw`).
- `--server-args <args...>`: ACP sunucusuna geçirilen ek argümanlar.
- `--server-verbose`: ACP sunucusunda ayrıntılı günlüklemeyi etkinleştirir.
- `--verbose, -v`: ayrıntılı istemci günlüklemesi.
