---
read_when:
    - Yaygın kurulum, yükleme, ilk katılım veya çalışma zamanı destek sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcı tarafından bildirilen sorunları sınıflandırma
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-04-21T09:00:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bd1df258baa4b289bc95ba0f7757b61c1412e230d93ebb137cb7117fbc3a2f1
    source_path: help/faq.md
    workflow: 15
---

# SSS

Gerçek dünya kurulumları için hızlı yanıtlar ve daha derin sorun giderme (yerel geliştirme, VPS, çoklu-agent, OAuth/API anahtarları, model failover). Çalışma zamanı tanılamaları için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam config referansı için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozuksa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: OS + güncelleme, gateway/service erişilebilirliği, agent'lar/oturumlar, sağlayıcı config'i + çalışma zamanı sorunları (gateway erişilebilirse).

2. **Paylaşılabilir rapor (güvenle paylaşılabilir)**

   ```bash
   openclaw status --all
   ```

   Günlük sonunu da içeren salt okunur tanılama (token'lar sansürlenir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, probe hedef URL'sini ve service'in büyük olasılıkla hangi config'i kullandığını gösterir.

4. **Derin probe'lar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal probe'ları dahil canlı gateway sağlık probe'u çalıştırır
   (erişilebilir bir gateway gerektirir). Bkz. [Health](/tr/gateway/health).

5. **En son günlüğü izleyin**

   ```bash
   openclaw logs --follow
   ```

   RPC çalışmıyorsa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri service günlüklerinden ayrıdır; bkz. [Logging](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştırın (onarım)**

   ```bash
   openclaw doctor
   ```

   Config/durum onarımı ve geçişleri yapar + sağlık kontrollerini çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL + config yolunu gösterir
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Health](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

<AccordionGroup>
  <Accordion title="Takıldım, çıkmanın en hızlı yolu">
    Makinenizi **görebilen** yerel bir AI agent kullanın. Bu, Discord'da sormaktan çok daha etkilidir,
    çünkü "takıldım" vakalarının çoğu uzaktaki yardımcıların inceleyemeyeceği **yerel config veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar repoyu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, servisler, izinler, auth dosyaları) düzeltmenize yardımcı olabilir. Onlara
    hacklenebilir (git) kurulum aracılığıyla **tam kaynak checkout** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout'undan** kurar; böylece agent kodu + belgeleri okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra yükleyiciyi `--install-method git`
    olmadan yeniden çalıştırarak her zaman tekrar kararlı sürüme dönebilirsiniz.

    İpucu: agent'tan düzeltmeyi **planlamasını ve denetlemesini** isteyin (adım adım), sonra yalnızca
    gerekli komutları yürütün. Bu, değişiklikleri küçük ve denetlemesi daha kolay tutar.

    Gerçek bir hata veya düzeltme keşfederseniz, lütfen bir GitHub issue açın veya PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Yardım isterken şu komutlarla başlayın (çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaptıkları:

    - `openclaw status`: gateway/agent sağlığı + temel config'in hızlı anlık görüntüsü.
    - `openclaw models status`: sağlayıcı auth'u + model kullanılabilirliğini kontrol eder.
    - `openclaw doctor`: yaygın config/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI kontrolleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](#bir-şey-bozuksa-ilk-60-saniye).
    Kurulum belgeleri: [Kurulum](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sürekli atlanıyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış etkin saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/yalnızca başlıklı iskelet içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ancak görev aralıklarının henüz hiçbiri zamanı gelmemiş
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` hepsi kapalı)

    Görev modunda, zaman damgaları yalnızca gerçek bir heartbeat çalışması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlanmış olarak işaretlemez.

    Belgeler: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı kurup ayarlamanın önerilen yolu">
    Repo, kaynaktan çalıştırmayı ve ilk katılımı kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz ayrıca UI varlıklarını otomatik olarak oluşturabilir. İlk katılımdan sonra, Gateway'i genellikle **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıcılar/geliştiriciler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Henüz global kurulumunuz yoksa, bunu `pnpm openclaw onboard` ile çalıştırın.

  </Accordion>

  <Accordion title="İlk katılımdan sonra dashboard'u nasıl açarım?">
    Sihirbaz, ilk katılımdan hemen sonra tarayıcınızı temiz (tokensız) bir dashboard URL'si ile açar ve bağlantıyı özette de yazdırır. O sekmeyi açık tutun; açılmadıysa yazdırılan URL'yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Dashboard'da localhost ile uzak ortamda kimlik doğrulamayı nasıl yaparım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan sır auth'u istiyorsa, yapılandırılmış token veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan bir sır yapılandırılmadıysa, `openclaw doctor --generate-gateway-token` ile bir token oluşturun.

    **Localhost değilse:**

    - **Tailscale Serve** (önerilir): bind'i loopback olarak tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise, kimlik üst bilgileri Control UI/WebSocket auth'unu karşılar (paylaşılan sır yapıştırılmaz, güvenilir gateway host varsayılır); HTTP API'leri ise private-ingress `none` veya trusted-proxy HTTP auth'u bilerek kullanmadığınız sürece yine paylaşılan sır auth'u gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve auth denemeleri, başarısız-auth sınırlayıcı kayıt yapmadan önce serileştirilir; bu yüzden ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola auth'u yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, ardından dashboard ayarlarında eşleşen paylaşılan sırrı yapıştırın.
    - **Kimlik farkındalıklı reverse proxy**: Gateway'i loopback olmayan güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, ardından proxy URL'sini açın.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın. Tünel üzerinden de paylaşılan sır auth'u geçerlidir; istenirse yapılandırılmış token veya parolayı yapıştırın.

    Bind modları ve auth ayrıntıları için [Dashboard](/web/dashboard) ve [Web surfaces](/web) bölümlerine bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec approval config'i var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: o kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Host exec ilkesi hâlâ gerçek onay kapısıdır. Sohbet config'i yalnızca onay
    istemlerinin nerede görüneceğini ve insanların nasıl yanıt verebileceğini kontrol eder.

    Çoğu kurulumda ikisine de **ihtiyacınız olmaz**:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbette `/approve` paylaşılan yol üzerinden çalışır.
    - Desteklenen yerel bir kanal onaylayıcıları güvenli şekilde çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarlanmamış veya `"auto"` olduğunda DM-öncelikli yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri mevcut olduğunda, birincil yol o yerel UI'dır; agent, yalnızca araç sonucu sohbet onaylarının kullanılamadığını söylediğinde veya tek yol manuel onay olduğunda manuel `/approve` komutunu eklemelidir.
    - İstemlerin ayrıca başka sohbetlere veya açık operasyon odalarına iletilmesi gerekiyorsa yalnızca `approvals.exec` kullanın.
    - Onay istemlerinin kaynak oda/konuya geri gönderilmesini açıkça istiyorsanız yalnızca `channels.<channel>.execApprovals.target: "channel"` veya `"both"` kullanın.
    - Plugin onayları ayrıca ayrıdır: varsayılan olarak aynı sohbette `/approve`, isteğe bağlı `approvals.plugin` iletimi kullanırlar ve yalnızca bazı yerel kanallar bunun üstüne plugin-onayı-yerel işleyişini korur.

    Kısa sürüm: iletme yönlendirme içindir, yerel istemci config'i ise daha zengin kanala özgü UX içindir.
    Bkz. [Exec Onayları](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi çalışma zamanına ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Bun, Gateway için **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir - belgelerde kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    disk alanının yeterli olduğu listelenir ve bir **Raspberry Pi 4** üzerinde çalışabileceği belirtilir.

    Biraz ek pay istiyorsanız (günlükler, medya, diğer servisler), **2GB önerilir**, ancak
    bu kesin bir alt sınır değildir.

    İpucu: küçük bir Pi/VPS Gateway'i barındırabilir, siz de dizüstü bilgisayarınızda/telefonunuzda
    yerel ekran/kamera/canvas veya komut yürütme için **node** eşleştirebilirsiniz. Bkz. [Nodes](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipuçları var mı?">
    Kısa sürüm: çalışır, ama pürüzlü noktalar bekleyin.

    - **64-bit** bir OS kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncelleme yapabilmek için **hacklenebilir (git) kurulum** tercih edin.
    - Kanal/Skills olmadan başlayın, sonra tek tek ekleyin.
    - Garip ikili dosya sorunlarıyla karşılaşırsanız, bu genellikle bir **ARM uyumluluk** problemidir.

    Belgeler: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Wake up my friend ekranında takılı kaldı / ilk katılım hatch olmuyor. Şimdi ne yapmalıyım?">
    Bu ekran, Gateway'e erişilebilmesine ve kimlik doğrulamasının yapılmasına bağlıdır. TUI ayrıca ilk hatch sırasında
    otomatik olarak "Wake up, my friend!" gönderir. Bu satırı **yanıt olmadan**
    ve token'lar 0 olarak görüyorsanız, agent hiç çalışmamıştır.

    1. Gateway'i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durum + auth'u kontrol edin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaktaysa, tünel/Tailscale bağlantısının açık olduğundan ve UI'ın
    doğru Gateway'e işaret ettiğinden emin olun. Bkz. [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Kurulumumu yeni bir makineye (Mac mini) ilk katılımı yeniden yapmadan taşıyabilir miyim?">
    Evet. **State dizinini** ve **workspace**'i kopyalayın, sonra Doctor'ı bir kez çalıştırın. Bu,
    **iki** konumu da kopyaladığınız sürece botunuzu "tam olarak aynı" tutar
    (bellek, oturum geçmişi, auth ve kanal durumu):

    1. Yeni makineye OpenClaw kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` dizinini (varsayılan: `~/.openclaw`) kopyalayın.
    3. Workspace'inizi kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway service'ini yeniden başlatın.

    Bu, config'i, auth profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Siz
    uzak moddaysanız, oturum deposu ve workspace'in sahibi gateway host'tur; bunu unutmayın.

    **Önemli:** yalnızca workspace'inizi GitHub'a commit/push ederseniz,
    **bellek + bootstrap dosyalarını** yedeklemiş olursunuz, ancak **oturum geçmişini veya auth'u**
    yedeklemiş olmazsınız. Bunlar `~/.openclaw/` altında yaşar
    (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Şeyler diskte nerede yaşar](#şeyler-diskte-nerede-yaşar),
    [Agent workspace](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzak mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görebilirim?">
    GitHub changelog'una bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler üstte yer alır. En üst bölüm **Unreleased** olarak işaretliyse, tarihli bir sonraki
    bölüm gönderilmiş en son sürümdür. Girdiler **Highlights**, **Changes** ve
    **Fixes** altında gruplanır (gerektiğinde docs/diğer bölümlerle birlikte).

  </Accordion>

  <Accordion title="docs.openclaw.ai adresine erişemiyorum (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları, Xfinity
    Advanced Security üzerinden `docs.openclaw.ai` adresini yanlış şekilde engeller. Bunu devre dışı bırakın veya
    `docs.openclaw.ai` adresini allowlist'e ekleyin, sonra tekrar deneyin.
    Lütfen burada bildirerek engeli kaldırmamıza yardımcı olun: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ erişemiyorsanız, belgeler GitHub'da yansıtılmıştır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı ve beta arasındaki fark">
    **Kararlı** ve **beta**, ayrı kod hatları değil, **npm dist-tag** değerleridir:

    - `latest` = kararlı
    - `beta` = test için erken yapı

    Genellikle bir kararlı sürüm önce **beta**'ya gelir, ardından açık bir
    yükseltme adımı aynı sürümü `latest` konumuna taşır. Maintainer'lar gerekirse
    doğrudan `latest` konumuna da yayımlayabilir. Bu nedenle, yükseltmeden sonra
    beta ve kararlı **aynı sürüme** işaret edebilir.

    Nelerin değiştiğini görün:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Kurulum tek satırlıkları ve beta ile dev arasındaki fark için aşağıdaki accordion'a bakın.

  </Accordion>

  <Accordion title="Beta sürümünü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, `beta` npm dist-tag değeridir (`latest` ile yükseltme sonrası eşleşebilir).
    **Dev**, `main` dalının hareketli başıdır (git); yayımlandığında `dev` npm dist-tag değerini kullanır.

    Tek satırlık komutlar (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows yükleyicisi (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Daha fazla ayrıntı: [Geliştirme kanalları](/tr/install/development-channels) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="En son parçaları nasıl deneyebilirim?">
    İki seçenek:

    1. **Dev kanalı (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Bu, `main` dalına geçer ve kaynaktan günceller.

    2. **Hacklenebilir kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu size düzenleyebileceğiniz yerel bir repo verir, ardından git ile güncelleyebilirsiniz.

    Manuel olarak temiz bir clone tercih ederseniz şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Güncelleme](/cli/update), [Geliştirme kanalları](/tr/install/development-channels),
    [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve ilk katılım genellikle ne kadar sürer?">
    Yaklaşık kılavuz:

    - **Kurulum:** 2-5 dakika
    - **İlk katılım:** yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

    Takılırsa [Yükleyici takıldı](#hızlı-başlangıç-ve-ilk-çalıştırma-kurulumu)
    ve [Takıldım](#hızlı-başlangıç-ve-ilk-çalıştırma-kurulumu) bölümündeki hızlı hata ayıklama döngüsünü kullanın.

  </Accordion>

  <Accordion title="Yükleyici takıldı mı? Daha fazla geri bildirimi nasıl alırım?">
    Yükleyiciyi **ayrıntılı çıktı** ile yeniden çalıştırın:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Ayrıntılı beta kurulumu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Hacklenebilir (git) kurulum için:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows (PowerShell) eşdeğeri:

    ```powershell
    # install.ps1 dosyasında henüz özel bir -Verbose bayrağı yok.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Daha fazla seçenek: [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="Windows kurulumu git bulunamadı veya openclaw tanınmıyor diyor">
    İki yaygın Windows sorunu:

    **1) npm hatası spawn git / git bulunamadı**

    - **Git for Windows** kurun ve `git` komutunun PATH üzerinde olduğundan emin olun.
    - PowerShell'i kapatıp yeniden açın, sonra yükleyiciyi yeniden çalıştırın.

    **2) Kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` soneki gerekmez; çoğu sistemde `%AppData%\npm` olur).
    - PATH'i güncelledikten sonra PowerShell'i kapatıp yeniden açın.

    En sorunsuz Windows kurulumu istiyorsanız, yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısı bozuk Çince metin gösteriyor - ne yapmalıyım?">
    Bu genellikle yerel Windows shell'lerinde bir konsol kod sayfası uyumsuzluğudur.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi bozuk karakterler olarak gösterir
    - Aynı komut başka bir terminal profilinde düzgün görünür

    PowerShell'de hızlı geçici çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Ardından Gateway'i yeniden başlatın ve komutunuzu tekrar deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu en güncel OpenClaw'da hâlâ yeniden üretebiliyorsanız, şurada izleyin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler sorumu yanıtlamadı - daha iyi bir yanıtı nasıl alırım?">
    Tam kaynak ve belgelere yerel olarak sahip olmak için **hacklenebilir (git) kurulum** kullanın, sonra
    botunuza (veya Claude/Codex'e) _o klasörden_ sorun ki repoyu okuyup tam yanıt verebilsin.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Kurulum](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw'ı Linux üzerinde nasıl kurarım?">
    Kısa yanıt: Linux kılavuzunu izleyin, ardından ilk katılımı çalıştırın.

    - Linux hızlı yol + service kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım anlatım: [Başlangıç](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Kurulum ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VPS üzerine nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway'e ulaşmak için SSH/Tailscale kullanın.

    Kılavuzlar: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzak erişim: [Gateway remote](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum kılavuzları nerede?">
    Yaygın sağlayıcılar için bir **barındırma merkezi** tutuyoruz. Birini seçin ve kılavuzu izleyin:

    - [VPS barındırma](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta nasıl çalışır: **Gateway sunucuda çalışır**, siz de ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI (veya Tailscale/SSH) aracılığıyla erişirsiniz. State + workspace'iniz
    sunucuda yaşar, bu yüzden host'u doğruluk kaynağı olarak kabul edin ve yedekleyin.

    Buluttaki Gateway'e **node** eşleştirerek
    yerel ekran/kamera/canvas erişebilir veya Gateway'i
    bulutta tutarken dizüstü bilgisayarınızda komut çalıştırabilirsiniz.

    Merkez: [Platformlar](/tr/platforms). Uzak erişim: [Gateway remote](/tr/gateway/remote).
    Nodes: [Nodes](/tr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün ama önerilmez**. Güncelleme akışı Gateway'i yeniden başlatabilir
    (bu da etkin oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak bir shell'den çalıştırın.

    CLI'yi kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bir agent'tan otomatikleştirmeniz gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Güncelleme](/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="İlk katılım gerçekte ne yapar?">
    `openclaw onboard`, önerilen kurulum yoludur. **Yerel modda** sizi şu konularda yönlendirir:

    - **Model/auth kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token ve LM Studio gibi yerel model seçenekleri)
    - **Workspace** konumu + bootstrap dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi paketlenmiş kanal plugin'leri)
    - **Daemon kurulumu** (macOS'ta LaunchAgent; Linux/WSL2'de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **Skills** seçimi

    Ayrıca yapılandırdığınız model bilinmiyorsa veya auth'u eksikse uyarı verir.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw'ı **API anahtarları** (Anthropic/OpenAI/diğerleri) veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamanın isteğe bağlı yollarıdır.

    OpenClaw içindeki Anthropic için pratik ayrım şöyledir:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw içinde Claude CLI / Claude abonelik auth'u**: Anthropic çalışanları
      bize bu kullanımın tekrar izinli olduğunu söyledi ve OpenClaw, Anthropic yeni bir
      ilke yayımlamadığı sürece bu entegrasyon için `claude -p` kullanımını onaylı kabul ediyor

    Uzun ömürlü gateway host'ları için, Anthropic API anahtarları yine de daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi dış
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca şu diğer barındırılan abonelik tarzı seçenekleri de destekler:
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan**.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Models](/tr/providers/glm),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu yüzden
    Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw, Claude abonelik auth'u ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder. En öngörülebilir sunucu tarafı kurulumu istiyorsanız,
    bunun yerine bir Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik auth'unu (Claude Pro veya Max) destekliyor musunuz?">
    Evet.

    Anthropic çalışanları bize bu kullanıma yeniden izin verildiğini söyledi, bu yüzden OpenClaw,
    Anthropic yeni bir ilke yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p`
    kullanımını bu entegrasyon için onaylı kabul eder.

    Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak hâlâ kullanılabilir, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı auth'u hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw içindeki diğer abonelik tarzı barındırılan
    seçenekleri istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Models](/tr/providers/glm) bölümlerine bakın.

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
Bu, mevcut pencere için **Anthropic kotanız/hız sınırınızın** tükendiği anlamına gelir. Eğer
**Claude CLI** kullanıyorsanız, pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. Eğer
bir **Anthropic API anahtarı** kullanıyorsanız, kullanım/faturalandırma için Anthropic Console'u
kontrol edin ve gerekirse limitleri artırın.

    Mesaj özellikle şu ise:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M bağlam beta'sını (`context1m: true`) kullanmaya çalışıyor demektir. Bu yalnızca
    kimlik bilgileriniz uzun bağlam faturalandırmasına uygunsa çalışır (API anahtarı faturalandırması veya
    Extra Usage etkin OpenClaw Claude-login yolu).

    İpucu: bir sağlayıcı hız sınırına takıldığında OpenClaw yanıt vermeye devam edebilsin diye bir **fallback model**
    ayarlayın.
    Bkz. [Models](/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketlenmiş bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam belirteçleri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik keşfedebilir ve bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` değerini açıkça etkinleştirebilir veya manuel bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock önündeki OpenAI uyumlu bir proxy de geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex auth nasıl çalışır?">
    OpenClaw, **OpenAI Code (Codex)** desteğini OAuth (ChatGPT oturum açma) üzerinden sağlar. İlk katılım, OAuth akışını çalıştırabilir ve uygun olduğunda varsayılan modeli `openai-codex/gpt-5.4` olarak ayarlar. Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [İlk katılım (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="ChatGPT GPT-5.4 neden OpenClaw içinde openai/gpt-5.4 yolunu açmıyor?">
    OpenClaw iki yolu ayrı ele alır:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = doğrudan OpenAI Platform API

    OpenClaw içinde ChatGPT/Codex oturum açma, doğrudan `openai/*` yoluna değil,
    `openai-codex/*` yoluna bağlanır. OpenClaw içinde doğrudan API yolunu istiyorsanız,
    `OPENAI_API_KEY` ayarlayın (veya eşdeğer OpenAI sağlayıcı config'ini).
    OpenClaw içinde ChatGPT/Codex oturum açmayı istiyorsanız, `openai-codex/*` kullanın.

  </Accordion>

  <Accordion title="Codex OAuth limitleri neden ChatGPT web'den farklı olabilir?">
    `openai-codex/*`, Codex OAuth yolunu kullanır ve kullanılabilir kota pencereleri
    OpenAI tarafından yönetilir ve plana bağlıdır. Pratikte bu limitler,
    ikisi de aynı hesaba bağlı olsa bile ChatGPT web sitesi/uygulaması deneyiminden farklı olabilir.

    OpenClaw, o anda görünür sağlayıcı kullanımını/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT web yetkilerini
    doğrudan API erişimine uydurmaz veya icat etmez. Doğrudan OpenAI Platform
    faturalandırma/limit yolunu istiyorsanız, bir API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik auth'unu (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sağlar.
    OpenAI, OpenClaw gibi harici araçlar/iş akışlarında abonelik OAuth kullanımına
    açıkça izin verir. İlk katılım sizin için OAuth akışını çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [İlk katılım (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde bir client id veya secret değil,
    **plugin auth akışı** kullanır.

    Adımlar:

    1. `gemini` PATH üzerinde olacak şekilde Gemini CLI'yi yerel olarak kurun
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Oturum açtıktan sonra varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa, gateway host'ta `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth token'larını gateway host üzerindeki auth profillerinde saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Gündelik sohbetler için yerel model uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlam + güçlü güvenlik gerektirir; küçük kartlar keser ve sızdırır. Mecbursanız,
    yerelde çalıştırabildiğiniz **en büyük** model yapısını (LM Studio) çalıştırın ve [/gateway/local-models](/tr/gateway/local-models) bölümüne bakın. Daha küçük/quantized modeller prompt-injection riskini artırır - bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktalar seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD barındırmalı seçenekler sunar; verileri bölgede tutmak için ABD barındırmalı varyantı seçin. Seçtiğiniz bölgesel sağlayıcıya uyarak fallback'lerin kullanılabilir kalması için yine de `models.mode: "merge"` kullanarak bunların yanında Anthropic/OpenAI listeleyebilirsiniz.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini satın almak zorunda mıyım?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows'ta WSL2 ile). Mac mini isteğe bağlıdır -
    bazı kişiler onu her zaman açık bir host olarak satın alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir kutu da çalışır.

    Yalnızca **yalnızca macOS araçları** için bir Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) - BlueBubbles sunucusu herhangi bir Mac'te çalışır ve Gateway Linux'ta veya başka bir yerde çalışabilir. Başka yalnızca macOS araçları istiyorsanız, Gateway'i bir Mac üzerinde çalıştırın veya bir macOS node eşleştirin.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Nodes](/tr/nodes), [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekir mi?">
    Messages'a oturum açmış **bir tür macOS aygıtına** ihtiyacınız var. Bunun Mac mini olması gerekmez -
    herhangi bir Mac iş görür. iMessage için **[BlueBubbles](/tr/channels/bluebubbles)** kullanın (önerilir) - BlueBubbles sunucusu macOS üzerinde çalışırken Gateway Linux'ta veya başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway'i Linux/VPS üzerinde çalıştırın ve BlueBubbles sunucusunu Messages'a oturum açmış herhangi bir Mac üzerinde çalıştırın.
    - En basit tek makine kurulumu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Nodes](/tr/nodes),
    [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için bir Mac mini alırsam, onu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway'i çalıştırabilir**, MacBook Pro'nuz ise
    bir **node** (eşlik eden aygıt) olarak bağlanabilir. Node'lar Gateway'i çalıştırmaz -
    o aygıtta ekran/kamera/canvas ve `system.run` gibi ek yetenekler sağlarlar.

    Yaygın kalıp:

    - Gateway Mac mini üzerinde (her zaman açık).
    - MacBook Pro macOS uygulamasını veya bir node host'u çalıştırır ve Gateway ile eşleşir.
    - Bunu görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Nodes](/tr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı gateway'ler için **Node** kullanın.

    Yine de Bun ile deneme yapmak istiyorsanız, bunu
    WhatsApp/Telegram içermeyen üretim dışı bir gateway'de yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne girer?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimlikleri ister. Config içinde zaten eski `@username` girdileriniz varsa, `openclaw doctor --fix` bunları çözmeyi deneyebilir.

    Daha güvenli yöntem (üçüncü taraf bot olmadan):

    - Botunuza DM gönderin, sonra `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmi Bot API:

    - Botunuza DM gönderin, sonra `https://api.telegram.org/bot<bot_token>/getUpdates` çağrısını yapın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az gizli):

    - `@userinfobot` veya `@getidsbot` botuna DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi, farklı OpenClaw örnekleriyle tek bir WhatsApp numarası kullanabilir mi?">
    Evet, **çoklu-agent yönlendirme** ile. Her gönderenin WhatsApp **DM**'sini (peer `kind: "direct"`, gönderen E.164 biçiminde örn. `+15551234567`) farklı bir `agentId`'ye bağlayın; böylece her kişi kendi workspace'ini ve oturum deposunu alır. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına küreseldir. Bkz. [Çoklu-Agent Yönlendirme](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" agent'i ve bir "kodlama için Opus" agent'i çalıştırabilir miyim?'>
    Evet. Çoklu-agent yönlendirmeyi kullanın: her agente kendi varsayılan modelini verin, sonra gelen rotaları (sağlayıcı hesabı veya belirli peer'ler) her agente bağlayın. Örnek config [Çoklu-Agent Yönlendirme](/tr/concepts/multi-agent) bölümünde bulunur. Ayrıca [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration) bölümlerine bakın.
  </Accordion>

  <Accordion title="Homebrew Linux üzerinde çalışır mı?">
    Evet. Homebrew Linux'u da destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw'ı systemd üzerinden çalıştırıyorsanız, `brew` ile kurulan araçların oturum açılmayan shell'lerde çözümlenebilmesi için service PATH'inin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekiniz) içerdiğinden emin olun.
    Son derlemeler ayrıca Linux systemd service'lerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlıysa `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerini dikkate alır.

  </Accordion>

  <Accordion title="Hacklenebilir git kurulumu ile npm install arasındaki fark">
    - **Hacklenebilir (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıcılar için en iyisi.
      Derlemeleri yerelde çalıştırırsınız ve kod/belgeleri yamalayabilirsiniz.
    - **npm install:** global CLI kurulumu, repo yok, "sadece çalıştırmak" için en iyisi.
      Güncellemeler npm dist-tag'lerinden gelir.

    Belgeler: [Başlangıç](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. Diğer kurulum türünü kurun, sonra gateway service'in yeni giriş noktasını göstermesi için Doctor'ı çalıştırın.
    Bu **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir. State'iniz
    (`~/.openclaw`) ve workspace'iniz (`~/.openclaw/workspace`) olduğu gibi kalır.

    npm'den git'e:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git'ten npm'e:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor bir gateway service giriş noktası uyumsuzluğu algılar ve service config'ini mevcut kurulumla eşleşecek şekilde yeniden yazmayı teklif eder (otomasyonda `--repair` kullanın).

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](#şeyler-diskte-nerede-yaşar).

  </Accordion>

  <Accordion title="Gateway'i dizüstü bilgisayarımda mı yoksa bir VPS üzerinde mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız VPS kullanın**. En düşük sürtünmeyi istiyorsanız
    ve uyku/yeniden başlatmalarla sorun yaşamıyorsanız, yerelde çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artıları:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kopmaları = bağlantı kesilmeleri, OS güncellemeleri/yeniden başlatmalar işi keser, uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayarın uyku sorunları yok, çalışır durumda tutmak daha kolay.
    - **Eksileri:** genellikle headless çalışır (ekran görüntüsü kullanın), yalnızca uzak dosya erişimi vardır, güncellemeler için SSH kullanmanız gerekir.

    **OpenClaw'a özgü not:** WhatsApp/Telegram/Slack/Mattermost/Discord hepsi bir VPS üzerinde gayet iyi çalışır. Tek gerçek ödünleşim **headless tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Yerel çalışma, Mac'i aktif olarak kullandığınızda ve yerel dosya erişimi veya görünür tarayıcıyla UI otomasyonu istediğinizde harikadır.

  </Accordion>

  <Accordion title="OpenClaw'ı özel bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değil, ama **güvenilirlik ve yalıtım için önerilir**.

    - **Özel host (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutması daha kolay.
    - **Paylaşımlı dizüstü/masaüstü:** test ve aktif kullanım için tamamen uygundur, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın en iyisini istiyorsanız, Gateway'i özel bir host'ta tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/exec araçları için bir **node** olarak eşleştirin. Bkz. [Nodes](/tr/nodes).
    Güvenlik rehberliği için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen OS nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** ek pay için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden çok kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    OS: **Ubuntu LTS** kullanın (veya modern bir Debian/Ubuntu). Linux kurulum yolu en iyi burada test edilmiştir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM'yi VPS ile aynı şekilde değerlendirin: her zaman açık olmalı, erişilebilir olmalı ve
    Gateway ile etkinleştirdiğiniz tüm kanallar için yeterli RAM'e sahip olmalıdır.

    Temel rehberlik:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden çok kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **OS:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız, **WSL2 en kolay VM tarzı kurulumdur** ve en iyi araç
    uyumluluğuna sahiptir. Bkz. [Windows](/tr/platforms/windows), [VPS barındırma](/tr/vps).
    macOS'u bir VM içinde çalıştırıyorsanız, bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi aygıtlarınızda çalıştırdığınız kişisel bir AI asistandır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketlenmiş kanal plugin'leri) yanıt verir ve ayrıca desteklenen platformlarda ses + canlı Canvas da sunabilir. **Gateway** her zaman açık kontrol düzlemidir; ürün asistanın kendisidir.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "sadece bir Claude sarmalayıcısı" değildir. Kendi
    donanımınızda çalışan, zaten kullandığınız sohbet uygulamalarından erişilebilen,
    durum bilgili oturumlar, bellek ve araçlarla iş akışlarınızın kontrolünü barındırılan bir
    SaaS'a bırakmadan güçlü bir asistan çalıştırmanıza olanak tanıyan **yerel öncelikli bir kontrol düzlemidir**.

    Öne çıkanlar:

    - **Aygıtlarınız, verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve
      workspace + oturum geçmişini yerelde tutun.
    - **Web sandbox değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** agent başına yönlendirme
      ve failover ile Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın.
    - **Yalnızca yerel seçenek:** isterseniz **tüm verilerin aygıtınızda kalabilmesi** için yerel modeller çalıştırın.
    - **Çoklu-agent yönlendirme:** kanal, hesap veya görev başına ayrı agent'lar; her birinin
      kendi workspace'i ve varsayılanları vardır.
    - **Açık kaynak ve hacklenebilir:** vendor lock-in olmadan inceleyin, genişletin ve kendi host'unuzda çalıştırın.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu-agent](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizlik, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri de kaldırabilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt agent'lar kullandığınızda en iyi şekilde çalışır.

  </Accordion>

  <Accordion title="OpenClaw için günlük hayattaki en iyi beş kullanım alanı nedir?">
    Günlük kazançlar genelde şöyle görünür:

    - **Kişisel brifingler:** gelen kutusu, takvim ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** e-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat odaklı dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** form doldurma, veri toplama ve web görevlerini yineleme.
    - **Cihazlar arası koordinasyon:** telefonunuzdan görev gönderin, Gateway bunu sunucuda çalıştırsın ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için lead gen, outreach, reklamlar ve bloglarda yardımcı olabilir mi?">
    Evet, **araştırma, nitelendirme ve taslak hazırlama** için. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve outreach veya reklam metni taslakları yazabilir.

    **Outreach veya reklam çalıştırma** için insanı döngüde tutun. Spam'den kaçının, yerel yasalara ve
    platform ilkelerine uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli kalıp,
    OpenClaw'ın taslak hazırlaması ve sizin onaylamanızdır.

    Belgeler: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a kıyasla avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE yerine geçmez. Repo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + workspace**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hook'lar)
    - **Her zaman açık Gateway** (bir VPS üzerinde çalıştırın, her yerden etkileşim kurun)
    - Yerel tarayıcı/ekran/kamera/exec için **Nodes**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repo'yu kirli tutmadan Skills'i nasıl özelleştirebilirim?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmalar kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir; bu yüzden yönetilen geçersiz kılmalar git'e dokunmadan yine de paketlenmiş Skills'in önüne geçer. Skill'in genel olarak kurulu olması ama yalnızca bazı agent'lara görünmesi gerekiyorsa, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Yalnızca yukarı akışa değer düzenlemeler repoda yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'i özel bir klasörden yükleyebilir miyim?">
    Evet. Ek dizinleri `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak değerlendirir. Skill yalnızca belirli agent'lara görünmeliyse, bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen kalıplar şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına `model` geçersiz kılması ayarlayabilir.
    - **Alt agent'lar**: görevleri, farklı varsayılan modellere sahip ayrı agent'lara yönlendirin.
    - **İsteğe bağlı geçiş**: geçerli oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu-Agent Yönlendirme](/tr/concepts/multi-agent) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl dışarı aktarırım?">
    Uzun veya paralel görevler için **alt agent'lar** kullanın. Alt agent'lar kendi oturumlarında çalışır,
    özet döndürür ve ana sohbetinizin yanıt verebilir kalmasını sağlar.

    Botunuzdan "bu görev için bir alt agent başlat" isteyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını görmek için sohbette `/status` kullanın (ve meşgul olup olmadığını).

    Token ipucu: uzun görevler ve alt agent'lar ikisi de token tüketir. Maliyet önemliyse,
    alt agent'lar için daha ucuz bir model ayarlayın: `agents.defaults.subagents.model`.

    Belgeler: [Alt agent'lar](/tr/tools/subagents), [Arka plan görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da thread'e bağlı subagent oturumları nasıl çalışır?">
    Thread bağlamaları kullanın. Bir Discord thread'ini bir subagent'a veya oturum hedefine bağlayabilirsiniz; böylece o thread'deki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `sessions_spawn` ile `thread: true` kullanarak başlatın (ve kalıcı takip için isteğe bağlı olarak `mode: "session"` ekleyin).
    - Veya `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odağı kaldırmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - Thread'i ayırmak için `/unfocus` kullanın.

    Gerekli config:

    - Küresel varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Başlatmada otomatik bağlama: `channels.discord.threadBindings.spawnSubagentSessions: true` ayarlayın.

    Belgeler: [Alt agent'lar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Referansı](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt agent tamamlandı, ama tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenmiş requester rotasını kontrol edin:

    - Tamamlanma modu alt agent teslimatı, varsa herhangi bir bağlı thread veya konuşma rotasını tercih eder.
    - Tamamlanma kaynağı yalnızca bir kanal taşıyorsa, doğrudan teslimatın yine de başarılı olabilmesi için OpenClaw requester oturumunun kayıtlı rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir kayıtlı rota varsa, doğrudan teslimat başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimatına geri döner.
    - Geçersiz veya eski hedefler yine de kuyruk geri dönüşünü veya son teslimat başarısızlığını zorlayabilir.
    - Alt sürecin son görünür asistan yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` veya tam olarak `ANNOUNCE_SKIP` ise, OpenClaw eski ilerlemeyi göndermek yerine bildirimi kasıtlı olarak bastırır.
    - Alt süreç yalnızca araç çağrılarından sonra zaman aşımına uğradıysa, bildirim ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özeti olarak daraltabilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt agent'lar](/tr/tools/subagents), [Arka plan görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar tetiklenmiyor. Neyi kontrol etmeliyim?">
    Cron, Gateway süreci içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlı olmadığını doğrulayın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile host saat dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi, ama kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` ise, runner geri dönüş gönderimi beklenmez.
    - Eksik veya geçersiz bildirim hedefi (`channel` / `to`) varsa, runner giden teslimatı atlamıştır.
    - Kanal auth hataları (`unauthorized`, `Forbidden`) runner'ın teslim etmeyi denediği ama kimlik bilgilerinin engellediği anlamına gelir.
    - Sessiz yalıtılmış sonuç (`NO_REPLY` / `no_reply` yalnızca) kasıtlı olarak teslim edilemez kabul edilir, bu yüzden runner kuyruk geri dönüş teslimatını da bastırır.

    Yalıtılmış Cron işleri için, bir sohbet rotası mevcut olduğunda agent yine de `message`
    aracıyla doğrudan gönderebilir. `--announce` yalnızca runner'ın
    agent'in zaten göndermediği son metin için geri dönüş yolunu kontrol eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka plan görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Yalıtılmış bir cron çalışması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    Yalıtılmış Cron, etkin çalışma `LiveSessionModelSwitchError` fırlattığında çalışma zamanı model devrini kalıcılaştırabilir ve yeniden deneyebilir. Yeniden deneme, değiştirilen
    sağlayıcıyı/modeli korur ve geçiş yeni bir auth profili geçersiz kılması taşıdıysa,
    Cron bunu da yeniden denemeden önce kalıcılaştırır.

    İlgili seçim kuralları:

    - Uygunsa önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra kayıtlı herhangi bir cron-oturum model geçersiz kılması.
    - Sonra normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden sonra,
    Cron sonsuza dek döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Linux üzerinde Skills'i nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills'i workspace'inize bırakın. macOS Skills UI Linux'ta yoktur.
    Skills'e [https://clawhub.ai](https://clawhub.ai) adresinden göz atın.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Yerel `openclaw skills install`, etkin workspace `skills/`
    dizinine yazar. Ayrı `clawhub` CLI'yi yalnızca kendi Skills'inizi yayımlamak veya
    eşitlemek istiyorsanız kurun. Agent'lar arasında paylaşılan kurulumlar için Skill'i
    `~/.openclaw/skills` altına koyun ve hangi agent'ların görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw zamanlanmış görevleri veya arka planda sürekli çalışan görevleri çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalardan sonra kalır).
    - "Ana oturum" periyodik kontrolleri için **Heartbeat**.
    - Özet yayımlayan veya sohbetlere teslim eden otonom agent'lar için **Yalıtılmış işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'e özel Skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan hayır. macOS Skills, `metadata.openclaw.os` ve gerekli ikili dosyalarla geçitlenir ve Skills yalnızca **Gateway host** üzerinde uygun olduklarında sistem isteminde görünür. Linux'ta `darwin`-yalnızca Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), geçitlemeyi geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç kalıp vardır:

    **Seçenek A - Gateway'i bir Mac üzerinde çalıştırın (en basiti).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-portları-zaten-çalışıyor-ve-uzak-mod) veya Tailscale üzerinden bağlanın. Skills normal şekilde yüklenir çünkü Gateway host'u macOS'tur.

    **Seçenek B - bir macOS node kullanın (SSH yok).**
    Gateway'i Linux üzerinde çalıştırın, bir macOS node (menubar uygulaması) eşleştirin ve Mac üzerinde **Node Run Commands** ayarını "Always Ask" veya "Always Allow" olarak ayarlayın. Gerekli ikili dosyalar node üzerinde varsa, OpenClaw macOS'e özel Skills'i uygun kabul edebilir. Agent bu Skills'i `nodes` aracı üzerinden çalıştırır. "Always Ask" seçerseniz, istemde "Always Allow" onayı bu komutu allowlist'e ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (ileri düzey).**
    Gateway'i Linux üzerinde tutun, ancak gerekli CLI ikili dosyaları bir Mac üzerinde çalışan SSH sarmalayıcılarına çözümlensin. Sonra Skill'i Linux'a izin verecek şekilde geçersiz kılın ki uygun kalsın.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux host üzerinde PATH'e koyun (örneğin `~/bin/memo`).
    3. Skill meta verisini (workspace veya `~/.openclaw/skills`) Linux'a izin verecek şekilde geçersiz kılın:

       ```markdown
       ---
       name: apple-notes
       description: macOS üzerinde memo CLI aracılığıyla Apple Notes'u yönetin.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills anlık görüntüsünün yenilenmesi için yeni bir oturum başlatın.

  </Accordion>

  <Accordion title="Notion veya HeyGen entegrasyonunuz var mı?">
    Şu anda yerleşik değil.

    Seçenekler:

    - **Özel Skill / plugin:** güvenilir API erişimi için en iyi yol (Notion/HeyGen ikisinin de API'si var).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ama daha yavaş ve daha kırılgandır.

    İstemci başına bağlam tutmak istiyorsanız (ajans iş akışları), basit bir kalıp şudur:

    - Her istemci için bir Notion sayfası (bağlam + tercihler + etkin iş).
    - Agent'tan oturum başında o sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir Skill oluşturun.

    Skills kurun:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin workspace `skills/` dizinine gider. Agent'lar arasında paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin. Paylaşılan bir kurulumu yalnızca bazı agent'lar görmeliyse, `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills Homebrew ile kurulu ikili dosyalar bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills config](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

  </Accordion>

  <Accordion title="Mevcut oturumu açık Chrome'umu OpenClaw ile nasıl kullanırım?">
    Chrome DevTools MCP üzerinden bağlanan yerleşik `user` tarayıcı profilini kullanın:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Özel bir ad istiyorsanız, açık bir MCP profili oluşturun:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Bu yol, yerel host tarayıcısını veya bağlı bir tarayıcı node'unu kullanabilir. Gateway başka bir yerde çalışıyorsa, ya tarayıcı makinesinde bir node host çalıştırın ya da bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlamalar:

    - eylemler CSS selector odaklı değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda bir seferde tek dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir

  </Accordion>
</AccordionGroup>

## Sandbox ve bellek

<AccordionGroup>
  <Accordion title="Özel bir sandboxing belgesi var mı?">
    Evet. Bkz. [Sandboxing](/tr/gateway/sandboxing). Docker'a özgü kurulum için (Docker içinde tam gateway veya sandbox imajları), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker kısıtlı hissettiriyor - tüm özellikleri nasıl etkinleştiririm?">
    Varsayılan imaj güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır, bu nedenle
    sistem paketlerini, Homebrew'u veya paketlenmiş tarayıcıları içermez. Daha tam bir kurulum için:

    - Önbelleklerin korunması için `/home/node` dizinini `OPENCLAW_HOME_VOLUME` ile kalıcılaştırın.
    - Sistem bağımlılıklarını imaja `OPENCLAW_DOCKER_APT_PACKAGES` ile yerleştirin.
    - Paketlenmiş CLI ile Playwright tarayıcılarını kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları herkese açık/sandbox içinde tek bir agent ile yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler**, herkese açık trafiğiniz **gruplar** ise.

    `agents.defaults.sandbox.mode: "non-main"` kullanın; böylece grup/kanal oturumları (ana olmayan anahtarlar) yapılandırılmış sandbox arka ucunda çalışır, ana DM oturumu ise host üzerinde kalır. Bir arka uç seçmezseniz varsayılan arka uç Docker'dır. Sonra sandbox içindeki oturumlarda hangi araçların kullanılabileceğini `tools.sandbox.tools` ile sınırlayın.

    Kurulum anlatımı + örnek config: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Ana config referansı: [Gateway yapılandırması](/tr/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Host klasörünü sandbox içine nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Küresel + agent başına bağlamalar birleşir; `scope: "shared"` olduğunda agent başına bağlamalar yok sayılır. Hassas olan her şey için `:ro` kullanın ve bağlamaların sandbox dosya sistemi duvarlarını baypas ettiğini unutmayın.

    OpenClaw, bind kaynaklarını hem normalize edilmiş yol hem de en derin mevcut üst öğe üzerinden çözümlenen canonical yol karşısında doğrular. Bu, son yol segmenti henüz mevcut olmasa bile symlink üst öğe kaçışlarının yine de fail-closed olduğu ve symlink çözümlemesinden sonra da izin verilen kök denetimlerinin uygulanmaya devam ettiği anlamına gelir.

    Örnekler ve güvenlik notları için [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) bölümlerine bakın.

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, agent workspace içindeki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içindeki günlük notlar
    - `MEMORY.md` içindeki düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca modele otomatik Compaction öncesinde
    kalıcı notlar yazmasını hatırlatmak için **sessiz bir pre-compaction bellek flush** çalıştırır. Bu yalnızca workspace
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek bir şeyleri unutmaya devam ediyor. Bunu nasıl kalıcı yaparım?">
    Bottan **bilgiyi belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam ise `memory/YYYY-MM-DD.md` içine gitmelidir.

    Bu, hâlâ geliştirdiğimiz bir alandır. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapması gerektiğini bilir. Unutmaya devam ediyorsa, Gateway'in her çalıştırmada aynı
    workspace'i kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Agent workspace](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalır mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalır. Sınır
    model değil, depolama alanınızdır. **Oturum bağlamı** yine de modelin
    bağlam penceresiyle sınırlıdır; bu yüzden uzun konuşmalar Compact edilebilir veya kesilebilir. Bu nedenle
    bellek araması vardır - yalnızca ilgili parçaları tekrar bağlama çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması için OpenAI API anahtarı gerekir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/completions'ı kapsar ve
    embeddings erişimi vermez, bu nedenle **Codex ile oturum açmak (OAuth veya
    Codex CLI login)** anlamsal bellek aramasına yardımcı olmaz. OpenAI embeddings için
    hâlâ gerçek bir API anahtarı gerekir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw bir API anahtarını
    çözümleyebildiğinde otomatik olarak bir sağlayıcı seçer (auth profilleri, `models.providers.*.apiKey` veya ortam değişkenleri).
    Bir OpenAI anahtarı çözülürse OpenAI'ı, aksi halde bir Gemini anahtarı
    çözülürse Gemini'yi, sonra Voyage'ı, sonra Mistral'ı tercih eder. Uzak anahtar yoksa, siz yapılandırana kadar bellek
    araması devre dışı kalır. Yapılandırılmış ve mevcut bir yerel model yolunuz
    varsa, OpenClaw
    `local` seçeneğini tercih eder. Siz açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda Ollama desteklenir.

    Yerelde kalmak istiyorsanız, `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız,
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya local** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Şeyler diskte nerede yaşar

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerelde mi kaydedilir?">
    Hayır - **OpenClaw'ın durumu yereldir**, ancak **harici servisler onlara gönderdiğinizi yine de görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, config ve workspace Gateway host üzerinde yaşar
      (`~/.openclaw` + workspace dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/etc.) gönderdiğiniz mesajlar
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/etc.) mesaj verilerini
      kendi sunucularında saklar.
    - **Ayak izini siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Agent workspace](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede saklar?">
    Her şey `$OPENCLAW_STATE_DIR` altında yaşar (varsayılan: `~/.openclaw`):

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana config (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarma (ilk kullanımda auth profillerine kopyalanır)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya tabanlı secret payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agent başına durum (agentDir + oturumlar)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durumu (agent başına)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (agent başına)                                       |

    Eski tek agent yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Workspace**'iniz (`AGENTS.md`, bellek dosyaları, Skills vb.) ayrıdır ve `agents.defaults.workspace` ile yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede yaşamalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **agent workspace** içinde yaşar.

    - **Workspace (agent başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (veya `MEMORY.md` yoksa eski geri dönüş `memory.md`),
      `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
    - **State dizini (`~/.openclaw`)**: config, kanal/sağlayıcı durumu, auth profilleri, oturumlar, günlükler
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan workspace `~/.openclaw/workspace` dizinidir ve şu şekilde yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutuyorsa", Gateway'in her açılışta aynı
    workspace'i kullandığını doğrulayın (ve unutmayın: uzak mod,
    yerel dizüstü bilgisayarınızı değil **gateway host'un** workspace'ini kullanır).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, sohbete güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Agent workspace](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Agent workspace**'inizi **özel** bir git reposuna koyun ve özel bir yerde
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın "zihnini" daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifreli secrets payload'ları).
    Tam geri yükleme gerekiyorsa, workspace'i ve state dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Agent workspace](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Ayrı kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Agent'lar workspace dışında çalışabilir mi?">
    Evet. Workspace, katı bir sandbox değil, **varsayılan cwd** ve bellek çapasidir.
    Göreli yollar workspace içinde çözülür, ancak mutlak yollar
    sandboxing etkin değilse diğer host konumlarına erişebilir. Yalıtım gerekiyorsa,
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya agent başına sandbox ayarlarını kullanın. Bir
    repoyu varsayılan çalışma dizini yapmak istiyorsanız, o agent'ın
    `workspace` alanını repo köküne yönlendirin. OpenClaw repo'su yalnızca kaynak koddur;
    agent'ın bilerek içinde çalışmasını istemiyorsanız workspace'i ondan ayrı tutun.

    Örnek (repo varsayılan cwd olarak):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Uzak mod: oturum deposu nerede?">
    Oturum durumu **gateway host** tarafından sahiplenilir. Uzak moddaysanız, önem verdiğiniz oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Config temelleri

<AccordionGroup>
  <Accordion title="Config hangi formatta? Nerede?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` konumundan isteğe bağlı bir **JSON5** config okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa, güvenli sayılabilecek varsayılanları kullanır (varsayılan workspace olarak `~/.openclaw/workspace` dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve şimdi hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    Loopback olmayan bind'ler **geçerli bir gateway auth yolu gerektirir**. Uygulamada bu şu anlama gelir:

    - paylaşılan sır auth'u: token veya parola
    - doğru yapılandırılmış, loopback olmayan kimlik farkındalıklı reverse proxy arkasında `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Notlar:

    - `gateway.remote.token` / `.password` kendi başlarına yerel gateway auth'unu etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa geri dönüş olarak `gateway.remote.*` kullanabilir.
    - Parola auth'u için bunun yerine `gateway.auth.mode: "password"` ile birlikte `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password`, SecretRef aracılığıyla açıkça yapılandırılmış ancak çözümlenmemişse, çözümleme fail-closed olur (maskeleyen uzak geri dönüş yok).
    - Paylaşılan sır Control UI kurulumları, `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında saklanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek üst bilgilerini kullanır. Paylaşılan sırları URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile, aynı host üzerindeki loopback reverse proxy'ler yine de trusted-proxy auth'unu karşılamaz. Trusted proxy yapılandırılmış, loopback olmayan bir kaynak olmalıdır.

  </Accordion>

  <Accordion title="Neden artık localhost üzerinde bir token'a ihtiyacım var?">
    OpenClaw, loopback dahil olmak üzere gateway auth'unu varsayılan olarak zorunlu kılar. Normal varsayılan yolda bu token auth'u anlamına gelir: açık bir auth yolu yapılandırılmamışsa, gateway başlangıcı token moduna çözülür ve bir tane otomatik üretir, bunu `gateway.auth.token` içine kaydeder; dolayısıyla **yerel WS istemcileri kimlik doğrulamalıdır**. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir auth yolu tercih ediyorsanız, açıkça parola modunu (veya loopback olmayan kimlik farkındalıklı reverse proxy'ler için `trusted-proxy`) seçebilirsiniz. **Gerçekten** açık loopback istiyorsanız, config içinde açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor sizin için her zaman bir token üretebilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Config değişikliğinden sonra yeniden başlatmam gerekir mi?">
    Gateway config'i izler ve hot-reload destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri hot-apply yapar, kritik olanlar için yeniden başlatır
    - `hot`, `restart`, `off` de desteklenir

  </Accordion>

  <Accordion title="Eğlenceli CLI sloganlarını nasıl kapatırım?">
    Config içinde `cli.banner.taglineMode` ayarlayın:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: slogan metnini gizler ama banner başlık/sürüm satırını korur.
    - `default`: her zaman `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen eğlenceli/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız, ortam değişkeni olarak `OPENCLAW_HIDE_BANNER=1` ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web fetch'i) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search`, seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırdığınız Ollama host'unu kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmî olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendi host'unuzda çalışır; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

    **Önerilen:** `openclaw configure --section web` çalıştırın ve bir sağlayıcı seçin.
    Ortam değişkeni alternatifleri:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` veya `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // isteğe bağlı; otomatik algılama için atlayın
            },
          },
        },
    }
    ```

    Sağlayıcıya özgü web-search config'i artık `plugins.entries.<plugin>.config.webSearch.*` altında yaşar.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni config'lerde kullanılmamalıdır.
    Firecrawl web-fetch geri dönüş config'i `plugins.entries.firecrawl.config.webFetch.*` altında yaşar.

    Notlar:

    - Allowlist kullanıyorsanız, `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` atlanırsa, OpenClaw mevcut kimlik bilgilerinden hazır ilk fetch geri dönüş sağlayıcısını otomatik algılar. Bugün paketlenmiş sağlayıcı Firecrawl'dır.
    - Daemon'lar ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya service ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply config'imi sildi. Nasıl kurtarırım ve bunu nasıl önlerim?">
    `config.apply`, **tüm config'i** değiştirir. Kısmi bir nesne gönderirseniz, diğer her şey
    kaldırılır.

    Güncel OpenClaw, birçok kazara ezmeyi korur:

    - OpenClaw tarafından sahip olunan config yazımları, yazmadan önce değişiklik sonrası tam config'i doğrular.
    - Geçersiz veya yıkıcı OpenClaw sahipli yazımlar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan düzenleme başlangıcı veya hot reload'u bozarsa, Gateway son bilinen iyi config'i geri yükler ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydeder.
    - Kurtarmadan sonra ana agent bir açılış uyarısı alır, böylece kötü config'i tekrar körlemesine yazmaz.

    Kurtarma:

    - `Config auto-restored from last-known-good`, `Config write rejected:` veya `config reload restored last-known-good config` için `openclaw logs --follow` kontrol edin.
    - Etkin config'in yanında en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - Çalışıyorsa etkin geri yüklenmiş config'i koruyun, ardından yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - `openclaw config validate` ve `openclaw doctor` çalıştırın.
    - Son bilinen iyi veya reddedilmiş payload yoksa, yedekten geri yükleyin veya `openclaw doctor` yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedikse bir hata bildirin ve son bilinen config'inizi veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama agent'i çoğu zaman günlüklerden veya geçmişten çalışan bir config'i yeniden oluşturabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yolu veya alan şeklini bilmiyorsanız önce `config.schema.lookup` kullanın; bu, daha derine inmek için sığ bir schema düğümü ve doğrudan alt özetleri döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam config değiştirme için kalsın.
    - Bir agent çalıştırmasından sahip-yalnız `gateway` aracını kullanıyorsanız, yine de `tools.exec.ask` / `tools.exec.security` yollarına yazımları reddeder (`aynı korumalı exec yollarına normalize edilen eski `tools.bash.*` takma adları dahil).

    Belgeler: [Config](/cli/config), [Configure](/cli/configure), [Gateway sorun giderme](/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında uzmanlaşmış çalışanlarla merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın kalıp **bir Gateway** (örn. Raspberry Pi) artı **node**'lar ve **agent**'lardır:

    - **Gateway (merkez):** kanalların (Signal/WhatsApp) sahibi, yönlendirme ve oturumların sahibi.
    - **Nodes (aygıtlar):** Mac/iOS/Android çevre birimi olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) açığa çıkarır.
    - **Agents (çalışanlar):** özel roller için ayrı zihinler/workspace'ler (örn. "Hetzner ops", "Kişisel veriler").
    - **Alt agent'lar:** paralellik istediğinizde ana agent'tan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanır ve agent/oturum değiştirir.

    Belgeler: [Nodes](/nodes), [Uzak erişim](/gateway/remote), [Çoklu-Agent Yönlendirme](/concepts/multi-agent), [Alt agent'lar](/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="OpenClaw tarayıcısı headless çalışabilir mi?">
    Evet. Bu bir config seçeneğidir:
__OC_I18N_900049__
    Varsayılan `false`'tur (headful). Headless mod bazı sitelerde anti-bot kontrollerini tetiklemeye daha yatkındır. Bkz. [Tarayıcı](/tools/browser).

    Headless, **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, logins). Ana farklar:

    - Görünür tarayıcı penceresi yoktur (görsele ihtiyacınız varsa ekran görüntüleri kullanın).
    - Bazı siteler headless modda otomasyona karşı daha katıdır (CAPTCHA'lar, anti-bot).
      Örneğin, X/Twitter headless oturumları sık sık engeller.

  </Accordion>

  <Accordion title="Tarayıcı denetimi için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya herhangi bir Chromium tabanlı tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam config örnekleri için [Tarayıcı](/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak gateway'ler ve node'lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve node'lar arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway agent'i çalıştırır ve
    yalnızca bir node aracı gerektiğinde **Gateway WebSocket** üzerinden node'ları çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node'lar gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrıları alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa agent'im bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı bir node olarak eşleştirin**. Gateway başka yerde çalışır, ama
    Gateway WebSocket üzerinden yerel makinenizde `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık host üzerinde çalıştırın (VPS/ev sunucusu).
    2. Gateway host'u ile bilgisayarınızı aynı tailnet'e alın.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve **SSH üzerinden Uzak** modda (veya doğrudan tailnet ile) bağlanın
       ki bir node olarak kaydolabilsin.
    5. Node'u Gateway üzerinde onaylayın:
__OC_I18N_900050__
    Ayrı bir TCP köprüsü gerekmez; node'lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS node eşleştirmek, o makinede `system.run` izni verir. Yalnızca
    güvendiğiniz aygıtları eşleştirin ve [Güvenlik](/gateway/security) bölümünü inceleyin.

    Belgeler: [Nodes](/nodes), [Gateway protokolü](/gateway/protocol), [macOS uzak modu](/platforms/mac/remote), [Güvenlik](/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temelleri kontrol edin:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Sonra auth ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız, `gateway.auth.allowTailscale` ayarının doğru yapıldığından emin olun.
    - SSH tüneliyle bağlanıyorsanız, yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - Allowlist'lerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/gateway/tailscale), [Uzak erişim](/gateway/remote), [Kanallar](/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbirleriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprü yoktur, ancak bunu birkaç
    güvenilir şekilde bağlayabilirsiniz:

    **En basit:** iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye mesaj göndermesini sağlayın, sonra Bot B normal şekilde yanıtlasın.

    **CLI köprüsü (genel):** diğer Gateway'i
    `openclaw agent --message ... --deliver` ile çağıran bir betik çalıştırın; bunu diğer botun
    dinlediği bir sohbeti hedefleyerek yapın. Bir bot uzak bir VPS üzerindeyse, CLI'nizi
    SSH/Tailscale üzerinden o uzak Gateway'e yönlendirin (bkz. [Uzak erişim](/gateway/remote)).

    Örnek kalıp (hedef Gateway'e erişebilen bir makinede çalıştırın):
__OC_I18N_900051__
    İpucu: iki botun sonsuz döngüye girmemesi için bir koruma kuralı ekleyin (yalnızca bahsetme, kanal
    allowlist'leri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzak erişim](/gateway/remote), [Agent CLI](/cli/agent), [Agent gönderimi](/tools/agent-send).

  </Accordion>

  <Accordion title="Birden çok agent için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Tek bir Gateway, her biri kendi workspace'ine, model varsayılanlarına
    ve yönlendirmesine sahip birden çok agent barındırabilir. Bu normal kurulumdur ve
    agent başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca sert yalıtım (güvenlik sınırları) veya
    paylaşmak istemediğiniz çok farklı config'ler gerektiğinde kullanın. Aksi halde tek bir Gateway tutun ve
    birden çok agent veya alt agent kullanın.

  </Accordion>

  <Accordion title="Uzak bir Gateway'den SSH yerine kişisel dizüstü bilgisayarımda node kullanmanın bir faydası var mı?">
    Evet - uzak bir Gateway'den dizüstü bilgisayarınıza ulaşmanın birinci sınıf yolu node'lardır ve
    shell erişiminden fazlasını açarlar. Gateway macOS/Linux üzerinde çalışır (Windows'ta WSL2) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeterlidir), bu yüzden
    yaygın bir kurulum her zaman açık bir host artı node olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Node'lar Gateway WebSocket'e dışarı bağlanır ve cihaz eşleştirmesi kullanır.
    - **Daha güvenli yürütme denetimleri.** `system.run`, o dizüstü bilgisayarda node allowlist'leri/onaylarıyla geçitlenir.
    - **Daha fazla cihaz aracı.** Node'lar `system.run` yanında `canvas`, `camera` ve `screen` de sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway'i bir VPS üzerinde tutun ama Chrome'u dizüstü bilgisayardaki bir node host üzerinden yerelde çalıştırın veya host üzerindeki yerel Chrome'a Chrome MCP ile bağlanın.

    SSH geçici shell erişimi için uygundur, ancak node'lar sürekli agent iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Tarayıcı](/tools/browser).

  </Accordion>

  <Accordion title="Node'lar gateway service çalıştırır mı?">
    Hayır. Bilerek yalıtılmış profiller çalıştırmadığınız sürece host başına yalnızca **bir gateway** çalışmalıdır (bkz. [Çoklu gateway'ler](/gateway/multiple-gateways)). Node'lar gateway'e bağlanan çevre birimleridir
    (iOS/Android node'ları veya menubar uygulamasında macOS "node mode"). Headless node
    host'ları ve CLI denetimi için bkz. [Node host CLI](/cli/node).

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Config'i uygulamak için API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce sığ schema düğümü, eşleşen UI ipucu ve doğrudan alt özetleriyle bir config alt ağacını inceleyin
    - `config.get`: mevcut anlık görüntüyü + hash'i alın
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda hot-reload yapar ve gerektiğinde yeniden başlatır
    - `config.apply`: tam config'i doğrula + değiştir; mümkün olduğunda hot-reload yapar ve gerektiğinde yeniden başlatır
    - Sahip-yalnız `gateway` çalışma zamanı aracı yine de `tools.exec.ask` / `tools.exec.security` yollarını yeniden yazmayı reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize edilir

  </Accordion>

  <Accordion title="İlk kurulum için en az mantıklı config">__OC_I18N_900052__
    Bu, workspace'inizi ayarlar ve botu kimin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurarım ve Mac'imden nasıl bağlanırım?">
    En az adımlar:

    1. **VPS üzerinde kurun + oturum açın**
__OC_I18N_900053__
    2. **Mac'inizde kurun + oturum açın**
       - Tailscale uygulamasını kullanın ve aynı tailnet'e giriş yapın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirin ki VPS'in kararlı bir adı olsun.
    4. **Tailnet ana makine adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız, VPS üzerinde Tailscale Serve kullanın:
__OC_I18N_900054__
    Bu, gateway'i loopback'e bağlı tutar ve HTTPS'i Tailscale üzerinden açığa çıkarır. Bkz. [Tailscale](/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac node'u uzak Gateway'e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS**'yi açığa çıkarır. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Uzak modda kullanın** (SSH hedefi tailnet ana makine adı olabilir).
       Uygulama Gateway portunu tünelleyecek ve node olarak bağlanacaktır.
    3. Gateway üzerinde **node'u onaylayın**:
__OC_I18N_900055__
    Belgeler: [Gateway protokolü](/gateway/protocol), [Discovery](/gateway/discovery), [macOS uzak modu](/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurmalı mıyım yoksa sadece node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa, onu
    bir **node** olarak ekleyin. Bu, tek bir Gateway tutar ve yinelenen config'den kaçınır. Yerel node araçları
    şu anda yalnızca macOS'ta vardır, ancak bunu diğer OS'lere de genişletmeyi planlıyoruz.

    İkinci bir Gateway'i yalnızca **sert yalıtım** veya tamamen ayrı iki bot gerektiğinde kurun.

    Belgeler: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Çoklu gateway'ler](/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw ortam değişkenlerini ana süreçten (shell, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - geçerli çalışma dizinindeki `.env`
    - `~/.openclaw/.env` içindeki genel geri dönüş `.env` dosyası (namıdiğer `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut ortam değişkenlerinin üzerine yazmaz.

    Ayrıca config içinde satır içi ortam değişkenleri de tanımlayabilirsiniz (yalnızca süreç ortamında eksikse uygulanır):
__OC_I18N_900056__
    Tam öncelik ve kaynaklar için bkz. [/environment](/help/environment).

  </Accordion>

  <Accordion title="Gateway'i service üzerinden başlattım ve ortam değişkenlerim kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın düzeltme:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun ki service shell ortamınızı devralmasa bile alınsınlar.
    2. Shell içe aktarmayı etkinleştirin (isteğe bağlı kolaylık):
__OC_I18N_900057__
    Bu, login shell'inizi çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla üzerine yazmaz). Ortam değişkeni eşdeğerleri:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ama models status "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env içe aktarmanın** etkin olup olmadığını raporlar. "Shell env: off"
    demek ortam değişkenlerinizin eksik olduğu anlamına gelmez - yalnızca OpenClaw'ın
    login shell'inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway service olarak çalışıyorsa (launchd/systemd), shell
    ortamınızı devralmaz. Bunu şu yollardan biriyle düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:
__OC_I18N_900058__
    2. Veya shell içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya config `env` bloğunuza ekleyin (yalnızca eksikse uygulanır).

    Sonra gateway'i yeniden başlatın ve tekrar kontrol edin:
__OC_I18N_900059__
    Copilot token'ları `COPILOT_GITHUB_TOKEN` içinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    Bkz. [/concepts/model-providers](/concepts/model-providers) ve [/environment](/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve çoklu sohbetler

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Tek başına bir mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/concepts/session).
  </Accordion>

  <Accordion title="Hiç /new göndermezsem oturumlar otomatik sıfırlanır mı?">
    Oturumların süresi `session.idleMinutes` sonrasında dolabilir, ama bu varsayılan olarak **devre dışıdır** (varsayılan **0**).
    Boşta kalma süresi sonlandırmasını etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma döneminden **sonraki**
    mesaj o sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, transcript'leri silmez - sadece yeni bir oturum başlatır.
__OC_I18N_900060__
  </Accordion>

  <Accordion title="Bir OpenClaw örnekleri ekibi yapmanın bir yolu var mı (bir CEO ve birçok agent)?">
    Evet, **çoklu-agent yönlendirme** ve **alt agent'lar** ile. Bir koordinatör
    agent ve kendi workspace'leri ile modelleri olan birkaç çalışan agent oluşturabilirsiniz.

    Bununla birlikte, bu en iyi **eğlenceli bir deney** olarak görülmelidir. Token açısından ağırdır ve
    genellikle ayrı oturumlara sahip tek bot kullanmaktan daha az verimlidir. Bizim
    öngördüğümüz tipik model, konuştuğunuz tek bir bot ve paralel işler için farklı oturumlardır. Bu
    bot gerektiğinde alt agent'lar da başlatabilir.

    Belgeler: [Çoklu-agent yönlendirme](/concepts/multi-agent), [Alt agent'lar](/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Bağlam görev ortasında neden kesildi? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction veya kesmeye yol açabilir.

    Yardımcı olanlar:

    - Bottan geçerli durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı workspace içinde tutun ve bottan onu tekrar okumasını isteyin.
    - Ana sohbetin daha küçük kalması için uzun veya paralel işler için alt agent'lar kullanın.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen sıfırlayıp kurulu tutmak istiyorum. Nasıl yaparım?">
    Sıfırlama komutunu kullanın:
__OC_I18N_900061__
    Etkileşimsiz tam sıfırlama:
__OC_I18N_900062__
    Sonra kurulumu yeniden çalıştırın:
__OC_I18N_900063__
    Notlar:

    - İlk katılım, mevcut bir config görürse **Sıfırla** seçeneğini de sunar. Bkz. [İlk katılım (CLI)](/start/wizard).
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her state dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Dev sıfırlama: `openclaw gateway --dev --reset` (yalnızca dev; dev config + kimlik bilgileri + oturumlar + workspace'i siler).

  </Accordion>

  <Accordion title='“context too large” hataları alıyorum - nasıl sıfırlar veya Compact ederim?'>
    Şunlardan birini kullanın:

    - **Compact** (konuşmayı korur ama eski dönüşleri özetler):
__OC_I18N_900064__
      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Sıfırla** (aynı sohbet anahtarı için yeni oturum kimliği):
__OC_I18N_900065__
    Devam ederse:

    - Eski araç çıktısını budamak için **oturum budamayı** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Belgeler: [Compaction](/concepts/compaction), [Oturum budama](/concepts/session-pruning), [Oturum yönetimi](/concepts/session).

  </Accordion>

  <Accordion title='Neden "LLM request rejected: messages.content.tool_use.input field required" görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model gerekli
    `input` olmadan bir `tool_use` bloğu üretti. Bu genellikle oturum geçmişinin eski veya bozuk olduğu anlamına gelir (sıklıkla uzun thread'lerden
    veya bir araç/schema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (tek başına mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30 dakikada** bir çalışır (OAuth auth kullanırken **1 saat**). Ayarlayın veya devre dışı bırakın:
__OC_I18N_900066__
    `HEARTBEAT.md` mevcut ama fiilen boşsa (yalnızca boş satırlar ve
    `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını korumak için heartbeat çalışmasını atlar.
    Dosya yoksa heartbeat yine çalışır ve model ne yapacağına karar verir.

    Agent başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot hesabı" eklemem gerekir mi?'>
    Hayır. OpenClaw **kendi hesabınız** üzerinde çalışır, yani siz gruptaysanız OpenClaw da onu görebilir.
    Varsayılan olarak, göndericilere izin verene kadar grup yanıtları engellenir (`groupPolicy: "allowlist"`).

    Grup yanıtlarını yalnızca **sizin** tetikleyebilmenizi istiyorsanız:
__OC_I18N_900067__
  </Accordion>

  <Accordion title="Bir WhatsApp grubunun JID'sini nasıl alırım?">
    Seçenek 1 (en hızlı): günlükleri izleyin ve grupta bir test mesajı gönderin:
__OC_I18N_900068__
    `@g.us` ile biten `chatId` (veya `from`) alanını arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/allowlist'e eklenmişse): config'den grupları listeleyin:
__OC_I18N_900069__
    Belgeler: [WhatsApp](/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Bahsetme geçidi açık (varsayılan). Botu @mention etmeniz gerekir (veya `mentionPatterns` ile eşleşmelidir).
    - `channels.whatsapp.groups` yapılandırdınız ama `"*"` eklemediniz ve grup allowlist'e alınmamış.

    Bkz. [Gruplar](/channels/groups) ve [Grup mesajları](/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/thread'ler DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma daralır. Gruplar/kanallar kendi oturum anahtarlarına sahiptir ve Telegram konuları / Discord thread'leri ayrı oturumlardır. Bkz. [Gruplar](/channels/groups) ve [Grup mesajları](/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç workspace ve agent oluşturabilirim?">
    Sert sınır yok. Onlarca (hatta yüzlerce) sorun olmaz, ama şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transcript'ler `~/.openclaw/agents/<agentId>/sessions/` altında yaşar.
    - **Token maliyeti:** daha fazla agent daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** agent başına auth profilleri, workspace'ler ve kanal yönlendirmesi.

    İpuçları:

    - Agent başına bir **etkin** workspace tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Dağınık workspace'leri ve profil uyumsuzluklarını görmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Birden çok botu veya sohbeti aynı anda çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden çok yalıtılmış agent çalıştırmak ve gelen mesajları
    kanal/hesap/peer'e göre yönlendirmek için **Çoklu-Agent Yönlendirme** kullanın. Slack kanal olarak desteklenir ve belirli agent'lara bağlanabilir.

    Tarayıcı erişimi güçlüdür ama "bir insanın yapabildiği her şeyi yapar" anlamına gelmez - anti-bot, CAPTCHA'lar ve MFA
    yine de otomasyonu engelleyebilir. En güvenilir tarayıcı denetimi için host üzerinde yerel Chrome MCP kullanın
    veya tarayıcının gerçekten çalıştığı makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway host'u (VPS/Mac mini).
    - Rol başına bir agent (bindings).
    - Bu agent'lara bağlanan Slack kanalları.
    - Gerektiğinde Chrome MCP veya bir node üzerinden yerel tarayıcı.

    Belgeler: [Çoklu-Agent Yönlendirme](/concepts/multi-agent), [Slack](/channels/slack),
    [Tarayıcı](/tools/browser), [Nodes](/nodes).

  </Accordion>
</AccordionGroup>

## Modeller: varsayılanlar, seçim, takma adlar, değiştirme

<AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw'ın varsayılan modeli, şu şekilde ayarladığınız modeldir:
__OC_I18N_900070__
    Modeller `provider/model` olarak referans verilir (örnek: `openai/gpt-5.4`). Sağlayıcıyı atlarsanız, OpenClaw önce bir takma ad dener, sonra bu tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve ancak ondan sonra kullanımdan kalkmış bir uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya geri döner. O sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, eski kaldırılmış sağlayıcı varsayılanını göstermek yerine OpenClaw ilk yapılandırılmış sağlayıcı/modele geri döner. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli öneriyorsunuz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda bulunan en güçlü son nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdili agent'lar için:** maliyetten çok model gücünü önceliklendirin.
    **Rutin/düşük riskli sohbet için:** daha ucuz fallback modeller kullanın ve agent rolüne göre yönlendirin.

    MiniMax'ın kendi belgeleri vardır: [MiniMax](/providers/minimax) ve
    [Yerel modeller](/gateway/local-models).

    Temel kural: yüksek riskli işler için karşılayabildiğiniz **en iyi modeli** kullanın, rutin
    sohbet veya özetler içinse daha ucuz model kullanın. Modelleri agent başına yönlendirebilir ve
    uzun görevleri paralelleştirmek için alt agent'lar kullanabilirsiniz (her alt agent token tüketir). Bkz. [Modeller](/concepts/models) ve
    [Alt agent'lar](/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı quantized modeller prompt-injection'a ve güvensiz davranışlara
    daha açıktır. Bkz. [Güvenlik](/gateway/security).

    Daha fazla bağlam: [Modeller](/concepts/models).

  </Accordion>

  <Accordion title="Config'imi silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam config değiştirmelerden kaçının.

    Güvenli seçenekler:

    - sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model config'ini günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` düzenleyin

    Tüm config'i değiştirmek istemiyorsanız, kısmi bir nesneyle `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Lookup payload'ı size normalize edilmiş yolu, sığ schema belgelerini/kısıtlarını ve doğrudan alt özetleri verir.
    kısmi güncellemeler için.
    Config'in üzerine yazdıysanız, yedekten geri yükleyin veya onarım için `openclaw doctor` yeniden çalıştırın.

    Belgeler: [Modeller](/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi host ettiğim modelleri kullanabilir miyim (llama.cpp, vLLM, Ollama)?">
    Evet. Yerel modeller için en kolay yol Ollama'dır.

    En hızlı kurulum:

    1. Ollama'yı `https://ollama.com/download` üzerinden kurun
    2. `ollama pull gemma4` gibi bir yerel model çekin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local`, size bulut modelleri ile yerel Ollama modellerinizi birlikte verir
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel pull gerektirmez
    - Elle geçiş için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya ağır quantized modeller prompt-injection'a daha açıktır.
    Araç kullanabilen her bot için **büyük modelleri**
    şiddetle öneriyoruz. Yine de küçük modeller istiyorsanız, sandboxing ve katı araç allowlist'lerini etkinleştirin.

    Belgeler: [Ollama](/providers/ollama), [Yerel modeller](/gateway/local-models),
    [Model sağlayıcıları](/concepts/model-providers), [Güvenlik](/gateway/security),
    [Sandboxing](/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklı olabilir ve zaman içinde değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her gateway üzerindeki mevcut çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenlik açısından hassas/araç etkin agent'lar için mevcut en güçlü son nesil modeli kullanın.
  </Accordion>

  <Accordion title="Modelleri anında nasıl değiştiririm (yeniden başlatmadan)?">
    Tek başına mesaj olarak `/model` komutunu kullanın:
__OC_I18N_900071__
    Bunlar yerleşik takma adlardır. Özel takma adlar `agents.defaults.models` aracılığıyla eklenebilir.

    Kullanılabilir modelleri `/model`, `/model list` veya `/model status` ile listeleyebilirsiniz.

    `/model` (ve `/model list`) kompakt, numaralı bir seçici gösterir. Numarayla seçin:
__OC_I18N_900072__
    Sağlayıcı için belirli bir auth profilini de zorlayabilirsiniz (oturum başına):
__OC_I18N_900073__
    İpucu: `/model status`, hangi agent'in etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sırada hangi auth profilinin deneneceğini gösterir.
    Ayrıca mevcut olduğunda yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) da gösterir.

    **@profile ile ayarladığım profile sabitlemesini nasıl kaldırırım?**

    `/model` komutunu `@profile` son eki **olmadan** yeniden çalıştırın:
__OC_I18N_900074__
    Varsayılana dönmek istiyorsanız, `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi auth profilinin etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.2 ve kodlama için Codex 5.3 kullanabilir miyim?">
    Evet. Birini varsayılan yapın ve gerektiğinde değiştirin:

    - **Hızlı geçiş (oturum başına):** günlük görevler için `/model gpt-5.4`, Codex OAuth ile kodlama için `/model openai-codex/gpt-5.4`.
    - **Varsayılan + geçiş:** `agents.defaults.model.primary` değerini `openai/gpt-5.4` olarak ayarlayın, sonra kodlarken `openai-codex/gpt-5.4`'e geçin (veya tam tersi).
    - **Alt agent'lar:** kodlama görevlerini farklı varsayılan modele sahip alt agent'lara yönlendirin.

    Bkz. [Modeller](/concepts/models) ve [Slash komutları](/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.4 için hızlı modu nasıl yapılandırırım?">
    Oturum geçişi veya config varsayılanı kullanın:

    - **Oturum başına:** oturum `openai/gpt-5.4` veya `openai-codex/gpt-5.4` kullanırken `/fast on` gönderin.
    - **Model başına varsayılan:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode` değerini `true` yapın.
    - **Codex OAuth için de:** `openai-codex/gpt-5.4` kullanıyorsanız aynı bayrağı orada da ayarlayın.

    Örnek:
__OC_I18N_900075__
    OpenAI için hızlı mod, desteklenen yerel Responses isteklerinde `service_tier = "priority"` olarak eşlenir. Oturum `/fast` geçersiz kılmaları config varsayılanlarını bastırır.

    Bkz. [Thinking ve hızlı mod](/tools/thinking) ve [OpenAI hızlı mod](/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Neden "Model ... is not allowed" görüyorum ve sonra yanıt gelmiyor?'>
    `agents.defaults.models` ayarlıysa, bu alan `/model` ve herhangi bir
    oturum geçersiz kılma için **allowlist** haline gelir. Bu listede olmayan bir modeli seçmek şunu döndürür:
__OC_I18N_900076__
    Bu hata normal bir yanıt **yerine** döndürülür. Düzeltme: modeli
    `agents.defaults.models` içine ekleyin, allowlist'i kaldırın veya `/model list` içinden bir model seçin.

  </Accordion>

  <Accordion title='Neden "Unknown model: minimax/MiniMax-M2.7" görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı config'i veya auth
    profili bulunamadı), bu yüzden model çözümlenemiyor.

    Düzeltme kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` dalından çalıştırın), sonra gateway'i yeniden başlatın.
    2. MiniMax'ın yapılandırıldığından emin olun (sihirbaz veya JSON) ya da eşleşen sağlayıcının enjekte edilebilmesi için
       env/auth profillerinde MiniMax auth'unun
       bulunduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya saklanmış MiniMax
       OAuth'u).
    3. Auth yolunuz için tam model kimliğini kullanın (büyük/küçük harfe duyarlı):
       API anahtarı kurulumu için `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`,
       OAuth kurulumu için `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:
__OC_I18N_900077__
       ve listeden seçin (veya sohbette `/model list`).

    Bkz. [MiniMax](/providers/minimax) ve [Modeller](/concepts/models).

  </Accordion>

  <Accordion title="MiniMax'ı varsayılan, OpenAI'ı karmaşık görevler için kullanabilir miyim?">
    Evet. **MiniMax'ı varsayılan** olarak kullanın ve gerektiğinde modelleri **oturum başına** değiştirin.
    Fallback'ler **hatalar** içindir, "zor görevler" için değil; bu nedenle `/model` veya ayrı bir agent kullanın.

    **Seçenek A: oturum başına değiştirin**
__OC_I18N_900078__
    Sonra:
__OC_I18N_900079__
    **Seçenek B: ayrı agent'lar**

    - Agent A varsayılanı: MiniMax
    - Agent B varsayılanı: OpenAI
    - Agent'a göre yönlendirin veya değiştirmek için `/agent` kullanın

    Belgeler: [Modeller](/concepts/models), [Çoklu-Agent Yönlendirme](/concepts/multi-agent), [MiniMax](/providers/minimax), [OpenAI](/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısaltma ile gelir (yalnızca model `agents.defaults.models` içinde mevcutsa uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı adla kendi takma adınızı ayarlarsanız, sizin değeriniz kazanır.

  </Accordion>

  <Accordion title="Model kısayollarını (takma adları) nasıl tanımlarım/geçersiz kılarım?">
    Takma adlar `agents.defaults.models.<modelId>.alias` içinden gelir. Örnek:
__OC_I18N_900080__
    Sonra `/model sonnet` (veya desteklendiğinde `/<alias>`) o model kimliğine çözülür.

  </Accordion>

  <Accordion title="OpenRouter veya Z.AI gibi diğer sağlayıcılardan modelleri nasıl eklerim?">
    OpenRouter (token başına ödeme; birçok model):
__OC_I18N_900081__
    Z.AI (GLM modelleri):
__OC_I18N_900082__
    Bir sağlayıcı/model referans verip gereken sağlayıcı anahtarı eksikse, çalışma zamanında auth hatası alırsınız (örn. `No API key found for provider "zai"`).

    **Yeni bir agent ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni agent'ın** auth deposunun boş olduğu anlamına gelir. Auth agent başınadır ve
    şurada saklanır:
__OC_I18N_900083__
    Düzeltme seçenekleri:

    - `openclaw agents add <id>` çalıştırın ve sihirbaz sırasında auth'u yapılandırın.
    - Veya `auth-profiles.json` dosyasını ana agent'ın `agentDir` içinden yeni agent'ın `agentDir` içine kopyalayın.

    `agentDir` dizinini agent'lar arasında yeniden kullanmayın; bu auth/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model failover ve "All models failed"

<AccordionGroup>
  <Accordion title="Failover nasıl çalışır?">
    Failover iki aşamada gerçekleşir:

    1. Aynı sağlayıcı içinde **Auth profile rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki sonraki modele **Model fallback**.

    Başarısız profillere cooldown uygulanır (üstel backoff), böylece OpenClaw bir sağlayıcı hız sınırına takıldığında veya geçici olarak başarısız olduğunda bile yanıt vermeye devam edebilir.

    Hız sınırı kovası yalnızca sıradan `429` yanıtlarını içermez. OpenClaw
    ayrıca `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` gibi iletileri ve
    periyodik kullanım penceresi sınırlarını (`weekly/monthly limit reached`) failover'a değer
    hız sınırları olarak değerlendirir.

    Faturalandırma gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı
    `401` veya `403` üzerinde açık faturalandırma metni döndürürse, OpenClaw bunu yine de
    faturalandırma şeridinde tutabilir, ancak sağlayıcıya özgü metin eşleyiciler bunlara
    sahip olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Eğer bir `402`
    iletisi bunun yerine yeniden denenebilir bir kullanım penceresi veya
    organizasyon/workspace harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu
    uzun bir faturalandırma devre dışı bırakması değil, `rate_limit` olarak değerlendirir.

    Bağlam taşması hataları farklıdır: örneğin
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar, model fallback'ini ilerletmek yerine
    Compaction/yeniden deneme yolunda kalır.

    Genel sunucu hatası metni kasıtlı olarak "içinde unknown/error geçen her şey"den
    daha dardır. OpenClaw, Anthropic'in yalın `An unknown error occurred`, OpenRouter'ın yalın
    `Provider returned error`, `Unhandled stop reason:
    error` gibi stop-reason hataları, geçici sunucu metni içeren JSON `api_error` payload'ları
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı meşgul hataları gibi
    sağlayıcı kapsamlı geçici şekilleri, sağlayıcı bağlamı
    eşleştiğinde failover'a değer timeout/aşırı yüklenme sinyalleri olarak değerlendirir.
    `LLM request failed with an unknown
    error.` gibi genel iç fallback metni muhafazakâr kalır ve tek başına model fallback'ini tetiklemez.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” ne anlama gelir?'>
    Bu, sistemin `anthropic:default` auth profile kimliğini kullanmaya çalıştığı, ancak beklenen auth deposunda bunun için kimlik bilgileri bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Auth profillerinin nerede yaşadığını doğrulayın** (yeni ve eski yollar)
      - Güncel: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - `ANTHROPIC_API_KEY` değerini shell'inizde ayarladıysanız ama Gateway'i systemd/launchd ile çalıştırıyorsanız, bunu devralmayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` etkinleştirin.
    - **Doğru agent'ı düzenlediğinizden emin olun**
      - Çoklu-agent kurulumları birden çok `auth-profiles.json` dosyası olabileceği anlamına gelir.
    - **Model/auth durumunu mantık kontrolünden geçirin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimlik doğrulamasının yapılıp yapılmadığını görmek için `openclaw models status` kullanın.

    **“No credentials found for profile anthropic” için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic auth profiline sabitlendiği ama Gateway'in
    bunu auth deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway host üzerinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **Gateway host** üzerindeki `~/.openclaw/.env` içine `ANTHROPIC_API_KEY` koyun.
      - Eksik bir profili zorlayan sabit sıralamayı temizleyin:
__OC_I18N_900084__
    - **Komutları gateway host üzerinde çalıştırdığınızı doğrulayın**
      - Uzak modda auth profilleri dizüstü bilgisayarınızda değil, gateway makinesinde yaşar.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de denedi ve başarısız oldu?">
    Model config'inizde fallback olarak Google Gemini varsa (veya bir Gemini kısayoluna geçtiyseniz), OpenClaw bunu model fallback sırasında dener. Google kimlik bilgilerini yapılandırmadıysanız, `No API key found for provider "google"` görürsünüz.

    Düzeltme: ya Google auth sağlayın ya da fallback oraya yönlenmesin diye `agents.defaults.model.fallbacks` / takma adlardan Google modellerini kaldırın veya kaçının.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Neden: oturum geçmişi **imzasız thinking blokları** içeriyor (çoğunlukla
    yarım kalmış/kısmi bir akıştan). Google Antigravity, thinking blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız thinking bloklarını temizler. Hâlâ görünüyorsa, **yeni bir oturum** başlatın veya o agent için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Auth profilleri: nedirler ve nasıl yönetilirler

İlgili: [/concepts/oauth](/concepts/oauth) (OAuth akışları, token depolama, çoklu hesap kalıpları)

<AccordionGroup>
  <Accordion title="Auth profile nedir?">
    Auth profile, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada yaşar:
__OC_I18N_900085__
  </Accordion>

  <Accordion title="Tipik profile kimlikleri nelerdir?">
    OpenClaw, sağlayıcı önekli kimlikler kullanır, örneğin:

    - `anthropic:default` (e-posta kimliği olmadığında yaygın)
    - OAuth kimlikleri için `anthropic:<email>`
    - sizin seçtiğiniz özel kimlikler (örn. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi auth profilinin deneneceğini kontrol edebilir miyim?">
    Evet. Config, profiller için isteğe bağlı meta veri ve sağlayıcı başına bir sıralama (`auth.order.<provider>`) destekler. Bu sırları saklamaz; kimlikleri sağlayıcı/mod ile eşler ve rotasyon sırasını belirler.

    OpenClaw, kısa bir **cooldown** (hız sınırları/timeout/auth hataları) veya daha uzun bir **disabled** durumundaysa (faturalandırma/yetersiz kredi), bir profili geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` alanını kontrol edin. Ayarlama: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı cooldown'ları model kapsamlı olabilir. Bir model için cooldown'da olan bir profil, aynı sağlayıcıdaki kardeş model için yine de kullanılabilir olabilir; faturalandırma/devre dışı pencereleri ise tüm profili engellemeye devam eder.

    Ayrıca CLI üzerinden **agent başına** sıralama geçersiz kılması da ayarlayabilirsiniz (o agent'ın `auth-state.json` dosyasında saklanır):
__OC_I18N_900086__
    Belirli bir agent'ı hedeflemek için:
__OC_I18N_900087__
    Gerçekte neyin deneneceğini doğrulamak için şunu kullanın:
__OC_I18N_900088__
    Saklanan bir profil açık sıralamadan çıkarılmışsa, probe onu sessizce denemek yerine
    o profil için `excluded_by_auth_order` raporlar.

  </Accordion>

  <Accordion title="OAuth ve API anahtarı - fark nedir?">
    OpenClaw her ikisini de destekler:

    - **OAuth** çoğu zaman abonelik erişimini kullanır (uygun olduğunda).
    - **API anahtarları** token başına ödeme faturalandırması kullanır.

    Sihirbaz, Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını açıkça destekler.

  </Accordion>
</AccordionGroup>

## Gateway: portlar, "already running" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi portu kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, hook'lar vb.) için tek çoklanmış portu kontrol eder.

    Öncelik:
__OC_I18N_900089__
  </Accordion>

  <Accordion title='Neden openclaw gateway status "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor'un** görünümüdür (launchd/systemd/schtasks). Bağlantı probe'u ise CLI'ın gerçekten gateway WebSocket'e bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (probe'un gerçekten kullandığı URL)
    - `Listening:` (portta gerçekten neyin bağlı olduğu)
    - `Last gateway error:` (süreç canlıyken port dinlemiyorsa yaygın kök neden)

  </Accordion>

  <Accordion title='Neden openclaw gateway status "Config (cli)" ve "Config (service)" farklı gösteriyor?'>
    Bir config dosyasını düzenliyorsunuz ama service başka birini çalıştırıyor (çoğu zaman `--profile` / `OPENCLAW_STATE_DIR` uyumsuzluğu).

    Düzeltme:
__OC_I18N_900090__
    Bunu service'in kullanmasını istediğiniz aynı `--profile` / ortam ile çalıştırın.

  </Accordion>

  <Accordion title='“another gateway instance is already listening” ne anlama geliyor?'>
    OpenClaw, başlangıçta WebSocket dinleyicisini hemen bağlayarak çalışma zamanı kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, portu boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı paylaşılan sır uzak kimlik bilgileriyle uzak bir WebSocket URL'sine yöneltin:
__OC_I18N_900091__
    Notlar:

    - `openclaw gateway`, yalnızca `gateway.mode` `local` olduğunda başlar (veya geçersiz kılma bayrağını geçirirseniz).
    - macOS uygulaması config dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; kendi başlarına yerel gateway auth'unu etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya sürekli yeniden bağlanıyor). Şimdi ne yapmalıyım?'>
    Gateway auth yolunuz ile UI'ın auth yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekmede yenilemeler, uzun ömürlü localStorage token kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, güvenilir istemciler gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış cihaz token'ıyla sınırlı bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token'ıyla birlikte saklanan önbelleğe alınmış onaylı scope'ları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar yine de önbelleğe alınmış scope'ları devralmak yerine istedikleri scope kümesini korur.
    - Bu yeniden deneme yolunun dışında, bağlanma auth önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklı cihaz token'ı, sonra bootstrap token'ıdır.
    - Bootstrap token scope denetimleri rol önekli çalışır. Yerleşik bootstrap operator allowlist'i yalnızca operator isteklerini karşılar; node veya diğer operator olmayan roller yine de kendi rol önekleri altındaki scope'lara ihtiyaç duyar.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa, önce tünel kurun: `ssh -N -L 18789:127.0.0.1:18789 user@host`, sonra `http://127.0.0.1:18789/` açın.
    - Paylaşılan sır modu: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, sonra eşleşen sırrı Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik üst bilgilerini atlayan ham loopback/tailnet URL'sini değil Serve URL'sini açtığınızdan emin olun.
    - Trusted-proxy modu: aynı host loopback proxy'si veya ham gateway URL'si üzerinden değil, yapılandırılmış loopback olmayan kimlik farkındalıklı proxy üzerinden geldiğinizden emin olun.
    - Bir yeniden denemeden sonra uyumsuzluk sürerse, eşleştirilmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildi derse, iki şeyi kontrol edin:
      - eşleştirilmiş cihaz oturumları yalnızca **kendi** cihazlarını döndürebilir; ayrıca `operator.admin`'e sahip değillerse
      - açık `--scope` değerleri, çağıranın mevcut operator scope'larını aşamaz
    - Hâlâ takılı mı? `openclaw status --all` çalıştırın ve [Sorun Giderme](/gateway/troubleshooting) adımlarını izleyin. Auth ayrıntıları için [Dashboard](/web/dashboard) bölümüne bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bind, ağ arabirimlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arabirim kapalıysa), bağlanacak bir şey yoktur.

    Düzeltme:

    - O host üzerinde Tailscale'i başlatın (100.x adresi olsun), veya
    - `gateway.bind: "loopback"` / `"lan"` seçeneğine geçin.

    Not: `tailnet` açık bir seçimdir. `auto` loopback'i tercih eder; yalnızca tailnet'e bağlanmak istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı host üzerinde birden çok Gateway çalıştırabilir miyim?">
    Genellikle hayır - tek bir Gateway birden çok mesajlaşma kanalını ve agent'ı çalıştırabilir. Birden çok Gateway'i yalnızca yedeklilik (örn: kurtarma botu) veya sert yalıtım gerektiğinde kullanın.

    Evet, ancak şunları yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına config)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (workspace yalıtımı)
    - `gateway.port` (benzersiz portlar)

    Hızlı kurulum (önerilen):

    - Örnek başına `openclaw --profile <name> ...` kullanın (otomatik olarak `~/.openclaw-<name>` oluşturur).
    - Her profil config'inde benzersiz `gateway.port` ayarlayın (veya elle çalıştırmalar için `--port` geçin).
    - Profil başına service kurun: `openclaw --profile <name> gateway install`.

    Profiller service adlarına da sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Çoklu gateway'ler](/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 ne anlama geliyor?'>
    Gateway bir **WebSocket sunucusudur** ve aldığı ilk mesajın
    bir `connect` frame'i olmasını bekler. Başka bir şey alırsa bağlantıyı
    **code 1008** ile kapatır (ilke ihlali).

    Yaygın nedenler:

    - Bir tarayıcıda **HTTP** URL'sini açtınız (`http://...`), WS istemcisi yerine.
    - Yanlış portu veya yolu kullandınız.
    - Bir proxy veya tünel auth üst bilgilerini çıkardı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS portunu normal bir tarayıcı sekmesinde açmayın.
    3. Auth açıksa, `connect` frame'ine token/parolayı ekleyin.

    CLI veya TUI kullanıyorsanız, URL şu şekilde görünmelidir:
__OC_I18N_900092__
    Protokol ayrıntıları: [Gateway protokolü](/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Günlükleme ve hata ayıklama

<AccordionGroup>
  <Accordion title="Günlükler nerede?">
    Dosya günlükleri (yapılandırılmış):
__OC_I18N_900093__
    `logging.file` ile kararlı yol ayarlayabilirsiniz. Dosya günlük seviyesi `logging.level` ile kontrol edilir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` ile kontrol edilir.

    En hızlı günlük takibi:
__OC_I18N_900094__
    Service/supervisor günlükleri (gateway launchd/systemd ile çalışıyorsa):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için [Sorun Giderme](/gateway/troubleshooting) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway service'ini nasıl başlatır/durdurur/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:
__OC_I18N_900095__
    Gateway'i elle çalıştırıyorsanız, `openclaw gateway --force` portu geri alabilir. Bkz. [Gateway](/gateway).

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım - OpenClaw'ı nasıl yeniden başlatırım?">
    **İki Windows kurulum modu** vardır:

    **1) WSL2 (önerilen):** Gateway Linux içinde çalışır.

    PowerShell'i açın, WSL'e girin, sonra yeniden başlatın:
__OC_I18N_900096__
    Service'i hiç kurmadıysanız, ön planda başlatın:
__OC_I18N_900097__
    **2) Yerel Windows (önerilmez):** Gateway doğrudan Windows'ta çalışır.

    PowerShell'i açın ve şunu çalıştırın:
__OC_I18N_900098__
    Elle çalıştırıyorsanız (service yok), şunu kullanın:
__OC_I18N_900099__
    Belgeler: [Windows (WSL2)](/platforms/windows), [Gateway service runbook](/gateway).

  </Accordion>

  <Accordion title="Gateway açık ama yanıtlar hiç gelmiyor. Neyi kontrol etmeliyim?">
    Hızlı sağlık taramasıyla başlayın:
__OC_I18N_900100__
    Yaygın nedenler:

    - Model auth'u **gateway host** üzerinde yüklenmemiş (bkz. `models status`).
    - Kanal eşleştirme/allowlist yanıtları engelliyor (kanal config'i + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açık.

    Uzak çalışıyorsanız, tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'e erişilebildiğini doğrulayın.

    Belgeler: [Kanallar](/channels), [Sorun Giderme](/gateway/troubleshooting), [Uzak erişim](/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - şimdi ne?'>
    Bu genellikle UI'ın WebSocket bağlantısını kaybettiği anlamına gelir. Kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaksa, tünel/Tailscale bağlantısı açık mı?

    Sonra günlükleri izleyin:
__OC_I18N_900101__
    Belgeler: [Dashboard](/web/dashboard), [Uzak erişim](/gateway/remote), [Sorun Giderme](/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Günlükler ve kanal durumuyla başlayın:
__OC_I18N_900102__
    Sonra hatayla eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla girdi var. OpenClaw zaten Telegram sınırına göre kırpar ve daha az komutla yeniden dener, ama yine de bazı menü girdilerinin kaldırılması gerekir. Plugin/Skills/özel komut sayısını azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: VPS üzerindeyseniz veya bir proxy arkasındaysanız, giden HTTPS'nin izinli olduğunu ve `api.telegram.org` için DNS'in çalıştığını doğrulayın.

    Gateway uzaktaysa, günlükleri Gateway host üzerinde incelediğinizden emin olun.

    Belgeler: [Telegram](/channels/telegram), [Kanal sorun giderme](/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'e erişilebildiğini ve agent'in çalışabildiğini doğrulayın:
__OC_I18N_900103__
    TUI içinde, geçerli durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız, teslimatın etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/web/tui), [Slash komutları](/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Service'i kurduysanız:
__OC_I18N_900104__
    Bu, **supervised service**'i durdurur/başlatır (macOS'ta launchd, Linux'ta systemd).
    Gateway arka planda daemon olarak çalışıyorsa bunu kullanın.

    Ön planda çalıştırıyorsanız, Ctrl-C ile durdurun, sonra:
__OC_I18N_900105__
    Belgeler: [Gateway service runbook](/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart ile openclaw gateway arasındaki fark">
    - `openclaw gateway restart`: **arka plan service**'ini yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: bu terminal oturumu için gateway'i **ön planda** çalıştırır.

    Service'i kurduysanız gateway komutlarını kullanın. Tek seferlik ön plan çalıştırma istediğinizde
    `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha ayrıntılı konsol çıktısı almak için Gateway'i `--verbose` ile başlatın. Sonra kanal auth, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görsel/PDF üretti ama hiçbir şey gönderilmedi">
    Agent'ten giden ekler, kendi satırında `MEDIA:<path-or-url>` satırı içermelidir. Bkz. [OpenClaw asistan kurulumu](/start/openclaw) ve [Agent gönderimi](/tools/agent-send).

    CLI gönderimi:
__OC_I18N_900106__
    Ayrıca şunları kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve allowlist'ler tarafından engellenmemiş.
    - Dosya sağlayıcının boyut sınırları içinde (görseller en fazla 2048px'e yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini workspace, temp/media-store ve sandbox doğrulamalı dosyalarla sınırlar.
    - `tools.fs.workspaceOnly=false`, agent'in zaten okuyabildiği host-yerel dosyaların `MEDIA:` ile gönderilmesine izin verir, ancak yalnızca medya ve güvenli belge türleri için (görseller, ses, video, PDF ve Office belgeleri). Düz metin ve secret benzeri dosyalar yine de engellenir.

    Bkz. [Images](/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'ı gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak değerlendirin. Varsayılanlar riski azaltmak için tasarlanmıştır:

    - DM yetenekli kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen göndericiler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` kontrol edin.
    - DM'leri herkese açık yapmak açık etkinleştirme gerektirir (`dmPolicy: "open"` ve allowlist `"*"`).

    Riskli DM ilkelerini görmek için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi endişe kaynağıdır?">
    Hayır. Prompt injection, sadece botun DM'ine kimin yazabildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okuyorsa (web search/fetch, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış günlükler), o içerik modele el koymaya çalışan talimatlar içerebilir.
    Bu, **tek gönderici siz olsanız bile** olabilir.

    En büyük risk, araçlar etkin olduğunda ortaya çıkar: model
    bağlamı dışarı sızdırmaya veya sizin adınıza araç çağırmaya kandırılabilir. Etki alanını şu yollarla azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları devre dışı bir "reader" agent kullanarak
    - araç etkin agent'larda `web_search` / `web_fetch` / `browser` kapalı tutarak
    - çözümlenmiş dosya/belge metnini de güvenilmeyen sayarak: OpenResponses
      `input_file` ve medya eki çıkarımı, ham dosya metnini geçirmek yerine çıkarılan metni
      açık dış içerik sınır işaretleyicileri içine sarar
    - sandboxing ve katı araç allowlist'leri uygulayarak

    Ayrıntılar: [Güvenlik](/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şeyler ters giderse etki alanını küçültür. Bu ayrıca
    kişisel hesaplarınızı etkilemeden kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyaç duyduğunuz araçlara ve hesaplara erişim verin, gerekirse
    sonra genişletin.

    Belgeler: [Güvenlik](/gateway/security), [Eşleştirme](/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik **önermiyoruz**. En güvenli kalıp şudur:

    - DM'leri **eşleştirme modunda** veya sıkı bir allowlist'te tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlasın, sonra **göndermeden önce onaylayın**.

    Denemek istiyorsanız, bunu ayrılmış bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, **eğer** agent yalnızca sohbet amaçlıysa ve girdi güvenilirse. Küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu nedenle araç etkin agent'lar için
    veya güvenilmeyen içerik okunurken bunlardan kaçının. Daha küçük model kullanmanız gerekiyorsa,
    araçları kilitleyin ve bir sandbox içinde çalıştırın. Bkz. [Güvenlik](/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleştirme kodu almadım">
    Eşleştirme kodları yalnızca bilinmeyen bir gönderici bota mesaj gönderdiğinde ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod üretmez.

    Bekleyen istekleri kontrol edin:
__OC_I18N_900107__
    Anında erişim istiyorsanız, gönderici kimliğinizi allowlist'e ekleyin veya o hesap için `dmPolicy: "open"`
    ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj atar mı? Eşleştirme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM ilkesi **eşleştirme**dir. Bilinmeyen göndericiler yalnızca eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin tetiklediğiniz açık gönderimlere yanıt verir.

    Eşleştirmeyi şununla onaylayın:
__OC_I18N_900108__
    Bekleyen istekleri listeleyin:
__OC_I18N_900109__
    Sihirbaz telefon numarası istemi: kendi **allowlist/sahibinizi** ayarlamak için kullanılır, böylece kendi DM'lerinize izin verilir. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranız üzerinde çalıştırıyorsanız, o numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Dahili veya araç mesajlarının çoğu yalnızca o oturum için **verbose**, **trace** veya **reasoning** etkin olduğunda görünür.

    Bunu gördüğünüz sohbette şu düzeltmeyi yapın:
__OC_I18N_900110__
    Hâlâ çok gürültülüyse, Control UI içindeki oturum ayarlarını kontrol edin ve verbose
    seçeneğini **inherit** olarak ayarlayın. Ayrıca config içinde `verboseDefault`
    değeri `on` olan bir bot profile kullanmadığınızı doğrulayın.

    Belgeler: [Thinking ve verbose](/tools/thinking), [Güvenlik](/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Şunlardan herhangi birini **tek başına mesaj** olarak gönderin (slash yok):
__OC_I18N_900111__
    Bunlar abort tetikleyicileridir (slash komutları değildir).

    Arka plan süreçleri için (exec aracından), agent'tan şunu çalıştırmasını isteyebilirsiniz:
__OC_I18N_900112__
    Slash komutları genel görünümü: bkz. [Slash komutları](/tools/slash-commands).

    Çoğu komut, `/` ile başlayan **tek başına** mesaj olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) allowlist'e alınmış göndericiler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan nasıl Discord mesajı gönderirim? ("Cross-context messaging denied")'>
    OpenClaw varsayılan olarak **sağlayıcılar arası** mesajlaşmayı engeller. Araç çağrısı
    Telegram'a bağlıysa, açıkça izin vermediğiniz sürece Discord'a göndermez.

    Agent için sağlayıcılar arası mesajlaşmayı etkinleştirin:
__OC_I18N_900113__
    Config'i düzenledikten sonra gateway'i yeniden başlatın.

  </Accordion>

  <Accordion title='Botun hızlı arka arkaya gelen mesajları "görmezden geldiğini" neden hissediyorum?'>
    Kuyruk modu, yeni mesajların devam eden bir çalışmayla nasıl etkileşime girdiğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - yeni mesajlar mevcut görevi yeniden yönlendirir
    - `followup` - mesajları tek tek çalıştırır
    - `collect` - mesajları toplar ve bir kez yanıtlar (varsayılan)
    - `steer-backlog` - şimdi yeniden yönlendirir, sonra backlog'u işler
    - `interrupt` - mevcut çalışmayı iptal eder ve baştan başlar

    Followup modları için `debounce:2s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz.

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='Anthropic için API anahtarıyla varsayılan model nedir?'>
    OpenClaw içinde kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya auth profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görüyorsanız, bu Gateway'in çalışan agent için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) içinde sorun veya bir [GitHub discussion](https://github.com/openclaw/openclaw/discussions) açın.
