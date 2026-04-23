---
read_when:
    - Codex, Claude veya Cursor uyumlu bir paket kurmak istiyorsunuz
    - OpenClaw'ın paket içeriğini yerel özelliklere nasıl eşlediğini anlamanız gerekiyor
    - Paket algılaması veya eksik yeteneklerde hata ayıklıyorsunuz
summary: Codex, Claude ve Cursor paketlerini OpenClaw Plugin'leri olarak kurun ve kullanın
title: Plugin Paketleri
x-i18n:
    generated_at: "2026-04-23T09:05:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin Paketleri

OpenClaw, üç harici ekosistemden Plugin kurabilir: **Codex**, **Claude**
ve **Cursor**. Bunlara **paketler** denir — OpenClaw'ın bunları Skills, kancalar ve MCP araçları gibi yerel özelliklere eşlediği içerik ve meta veri paketleri.

<Info>
  Paketler, yerel OpenClaw Plugin'leri ile **aynı şey değildir**. Yerel Plugin'ler
  süreç içinde çalışır ve herhangi bir yeteneği kaydedebilir. Paketler ise
  seçici özellik eşleme ve daha dar bir güven sınırı olan içerik paketleridir.
</Info>

## Paketlerin neden var olduğu

Birçok yararlı Plugin, Codex, Claude veya Cursor biçiminde yayımlanır. OpenClaw,
yazarların bunları yerel OpenClaw Plugin'leri olarak yeniden yazmasını gerektirmek yerine,
bu biçimleri algılar ve desteklenen içeriklerini yerel özellik
kümesine eşler. Bu, bir Claude komut paketini veya bir Codex Skills paketini
kurup hemen kullanabileceğiniz anlamına gelir.

## Paket kurma

<Steps>
  <Step title="Bir dizinden, arşivden veya pazar yerinden kurun">
    ```bash
    # Yerel dizin
    openclaw plugins install ./my-bundle

    # Arşiv
    openclaw plugins install ./my-bundle.tgz

    # Claude pazar yeri
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Algılamayı doğrulayın">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Paketler `Format: bundle` olarak görünür ve `codex`, `claude` veya `cursor` alt türüne sahiptir.

  </Step>

  <Step title="Yeniden başlatın ve kullanın">
    ```bash
    openclaw gateway restart
    ```

    Eşlenen özellikler (Skills, kancalar, MCP araçları, LSP varsayılanları) sonraki oturumda kullanılabilir olur.

  </Step>
</Steps>

## OpenClaw'ın paketlerden eşlediği özellikler

Bugün OpenClaw'da her paket özelliği çalışmaz. Burada nelerin çalıştığı ve
nelerin algılanıp henüz bağlanmadığı açıklanmıştır.

### Şu anda desteklenenler

| Özellik      | Nasıl eşlenir                                                                                | Uygulandığı biçimler |
| ------------ | -------------------------------------------------------------------------------------------- | -------------------- |
| Skills içeriği | Paket Skills kökleri normal OpenClaw Skills olarak yüklenir                                 | Tüm biçimler         |
| Komutlar     | `commands/` ve `.cursor/commands/`, Skills kökleri olarak değerlendirilir                    | Claude, Cursor       |
| Kanca paketleri | OpenClaw tarzı `HOOK.md` + `handler.ts` düzenleri                                         | Codex                |
| MCP araçları | Paket MCP yapılandırması gömülü Pi ayarlarına birleştirilir; desteklenen stdio ve HTTP sunucuları yüklenir | Tüm biçimler         |
| LSP sunucuları | Claude `.lsp.json` ve manifest içinde bildirilen `lspServers`, gömülü Pi LSP varsayılanlarına birleştirilir | Claude               |
| Ayarlar      | Claude `settings.json`, gömülü Pi varsayılanları olarak içe aktarılır                        | Claude               |

#### Skills içeriği

- paket Skills kökleri normal OpenClaw Skills kökleri olarak yüklenir
- Claude `commands` kökleri ek Skills kökleri olarak değerlendirilir
- Cursor `.cursor/commands` kökleri ek Skills kökleri olarak değerlendirilir

Bu, Claude Markdown komut dosyalarının normal OpenClaw Skills
yükleyicisi üzerinden çalıştığı anlamına gelir. Cursor komut Markdown'u da aynı yol üzerinden çalışır.

#### Kanca paketleri

- paket kanca kökleri **yalnızca** normal OpenClaw kanca paketi
  düzenini kullanıyorsa çalışır. Bugün bu öncelikle Codex uyumlu durumdur:
  - `HOOK.md`
  - `handler.ts` veya `handler.js`

#### Pi için MCP

- etkin paketler MCP sunucu yapılandırmasına katkıda bulunabilir
- OpenClaw paket MCP yapılandırmasını etkili gömülü Pi ayarlarına
  `mcpServers` olarak birleştirir
- OpenClaw, desteklenen paket MCP araçlarını gömülü Pi aracı turları sırasında
  stdio sunucuları başlatarak veya HTTP sunucularına bağlanarak açığa çıkarır
- `coding` ve `messaging` araç profilleri varsayılan olarak paket MCP araçlarını içerir; bir aracı veya Gateway için devre dışı kalmak için `tools.deny: ["bundle-mcp"]` kullanın
- proje yerel Pi ayarları, paket varsayılanlarından sonra yine uygulanır; böylece gerektiğinde çalışma alanı ayarları paket MCP girdilerini geçersiz kılabilir
- paket MCP araç katalogları kayıttan önce belirlenimci olarak sıralanır; böylece upstream `listTools()` sırası değişiklikleri prompt-cache araç bloklarını oynatmaz

##### Taşıma türleri

MCP sunucuları stdio veya HTTP taşımasını kullanabilir:

**Stdio**, bir alt süreç başlatır:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP**, varsayılan olarak `sse`, istenirse `streamable-http` üzerinden çalışan bir MCP sunucusuna bağlanır:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport`, `"streamable-http"` veya `"sse"` olarak ayarlanabilir; belirtilmezse OpenClaw `sse` kullanır
- yalnızca `http:` ve `https:` URL şemalarına izin verilir
- `headers` değerleri `${ENV_VAR}` enterpolasyonunu destekler
- hem `command` hem `url` içeren bir sunucu girdisi reddedilir
- URL kimlik bilgileri (userinfo ve sorgu parametreleri), araç
  açıklamalarından ve günlüklerden sansürlenir
- `connectionTimeoutMs`, hem stdio hem de HTTP taşımaları için
  varsayılan 30 saniyelik bağlantı zaman aşımını geçersiz kılar

##### Araç adlandırma

OpenClaw, paket MCP araçlarını sağlayıcı için güvenli adlarla
`serverName__toolName` biçiminde kaydeder. Örneğin, `"vigil-harbor"` anahtarına sahip ve
`memory_search` aracını açığa çıkaran bir sunucu, `vigil-harbor__memory_search` olarak kaydedilir.

- `A-Za-z0-9_-` dışındaki karakterler `-` ile değiştirilir
- sunucu önekleri 30 karakterle sınırlıdır
- tam araç adları 64 karakterle sınırlıdır
- boş sunucu adları `mcp` değerine geri döner
- çakışan temizlenmiş adlar sayısal son eklerle ayrıştırılır
- son açığa çıkarılan araç sırası, yinelenen Pi
  turlarını önbellek açısından kararlı tutmak için güvenli ada göre belirlenimcidir
- profil filtreleme, tek bir paket MCP sunucusundaki tüm araçları
  `bundle-mcp` sahibi Plugin'ler olarak değerlendirir; bu nedenle profil izin listeleri ve engelleme listeleri
  tek tek açığa çıkarılmış araç adlarını veya `bundle-mcp` Plugin anahtarını içerebilir

#### Gömülü Pi ayarları

- Claude `settings.json`, paket etkin olduğunda varsayılan gömülü Pi ayarları olarak içe aktarılır
- OpenClaw, uygulamadan önce shell geçersiz kılma anahtarlarını temizler

Temizlenen anahtarlar:

- `shellPath`
- `shellCommandPrefix`

#### Gömülü Pi LSP

- etkin Claude paketleri LSP sunucu yapılandırmasına katkıda bulunabilir
- OpenClaw `.lsp.json` ile manifest içinde bildirilen tüm `lspServers` yollarını yükler
- paket LSP yapılandırması etkili gömülü Pi LSP varsayılanlarına birleştirilir
- bugün yalnızca desteklenen stdio destekli LSP sunucuları çalıştırılabilir; desteklenmeyen
  taşıma türleri yine de `openclaw plugins inspect <id>` içinde görünür

### Algılanır ancak yürütülmez

Bunlar tanınır ve tanılarda gösterilir, ancak OpenClaw bunları çalıştırmaz:

- Claude `agents`, `hooks.json` otomasyonu, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex satır içi/uygulama meta verileri, yetenek raporlaması dışında

## Paket biçimleri

<AccordionGroup>
  <Accordion title="Codex paketleri">
    İşaretleyiciler: `.codex-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex paketleri, Skills kökleri ve OpenClaw tarzı
    kanca paketi dizinleri (`HOOK.md` + `handler.ts`) kullandıklarında OpenClaw'a en iyi şekilde uyar.

  </Accordion>

  <Accordion title="Claude paketleri">
    İki algılama modu:

    - **Manifest tabanlı:** `.claude-plugin/plugin.json`
    - **Manifestsiz:** varsayılan Claude düzeni (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude'a özgü davranış:

    - `commands/`, Skills içeriği olarak değerlendirilir
    - `settings.json`, gömülü Pi ayarlarına içe aktarılır (shell geçersiz kılma anahtarları temizlenir)
    - `.mcp.json`, desteklenen stdio araçlarını gömülü Pi'ye açığa çıkarır
    - `.lsp.json` ile manifest içinde bildirilen `lspServers` yolları, gömülü Pi LSP varsayılanlarına yüklenir
    - `hooks/hooks.json` algılanır ancak yürütülmez
    - Manifest içindeki özel bileşen yolları eklemelidir (varsayılanları değiştirmez, genişletir)

  </Accordion>

  <Accordion title="Cursor paketleri">
    İşaretleyiciler: `.cursor-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/`, Skills içeriği olarak değerlendirilir
    - `.cursor/rules/`, `.cursor/agents/` ve `.cursor/hooks.json` yalnızca algılama amaçlıdır

  </Accordion>
</AccordionGroup>

## Algılama önceliği

OpenClaw önce yerel Plugin biçimini denetler:

1. `openclaw.plugin.json` veya `openclaw.extensions` içeren geçerli `package.json` — **yerel Plugin** olarak değerlendirilir
2. Paket işaretleyicileri (`.codex-plugin/`, `.claude-plugin/` veya varsayılan Claude/Cursor düzeni) — **paket** olarak değerlendirilir

Bir dizin her ikisini de içeriyorsa, OpenClaw yerel yolu kullanır. Bu, çift biçimli paketlerin
kısmen paket olarak kurulmasını önler.

## Çalışma zamanı bağımlılıkları ve temizlik

- Paketlenmiş Plugin çalışma zamanı bağımlılıkları, OpenClaw paketi içinde
  `dist/*` altında gelir. OpenClaw, paketlenmiş
  Plugin'ler için başlangıçta `npm install` çalıştırmaz; tam bir paketlenmiş
  bağımlılık yükünün gönderilmesinden sürüm hattı sorumludur (bkz.
  [Releasing](/tr/reference/RELEASING) içindeki yayımlama sonrası doğrulama kuralı).

## Güvenlik

Paketlerin güven sınırı yerel Plugin'lere göre daha dardır:

- OpenClaw süreç içinde rastgele paket çalışma zamanı modülleri yüklemez
- Skills ve kanca paketi yolları Plugin kökü içinde kalmalıdır (sınır denetimli)
- Ayar dosyaları aynı sınır denetimleriyle okunur
- Desteklenen stdio MCP sunucuları alt süreç olarak başlatılabilir

Bu, paketleri varsayılan olarak daha güvenli kılar; ancak yine de üçüncü taraf
paketleri, açığa çıkardıkları özellikler açısından güvenilir içerik olarak değerlendirmelisiniz.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Paket algılanıyor ama yetenekler çalışmıyor">
    `openclaw plugins inspect <id>` çalıştırın. Bir yetenek listeleniyor ancak
    bağlanmamış olarak işaretleniyorsa, bu bir ürün sınırıdır — bozuk kurulum değildir.
  </Accordion>

  <Accordion title="Claude komut dosyaları görünmüyor">
    Paketin etkin olduğundan ve Markdown dosyalarının algılanan
    `commands/` veya `skills/` kökü içinde bulunduğundan emin olun.
  </Accordion>

  <Accordion title="Claude ayarları uygulanmıyor">
    Yalnızca `settings.json` içindeki gömülü Pi ayarları desteklenir. OpenClaw,
    paket ayarlarını ham yapılandırma yaması olarak değerlendirmez.
  </Accordion>

  <Accordion title="Claude kancaları yürütülmüyor">
    `hooks/hooks.json` yalnızca algılama amaçlıdır. Çalıştırılabilir kancalara ihtiyacınız varsa,
    OpenClaw kanca paketi düzenini kullanın veya yerel bir Plugin gönderin.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin'leri Kurun ve Yapılandırın](/tr/tools/plugin)
- [Plugin Oluşturma](/tr/plugins/building-plugins) — yerel bir Plugin oluşturun
- [Plugin Manifesti](/tr/plugins/manifest) — yerel manifest şeması
