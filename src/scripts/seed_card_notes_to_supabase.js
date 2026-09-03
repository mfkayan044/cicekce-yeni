const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cksauvgjodsduhxtnqwm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2F1dmdqb2RzZHVoeHRucXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzE0OTUsImV4cCI6MjEwMzg0NzQ5NX0.4a5gB69LbXyG9zVE9AxKGp_BGDL9cTn3QSs4zj6Oirc';

const supabase = createClient(supabaseUrl, supabaseKey);

const cardNotesData = [
  // 1. Aşk & Romantik (20 Notes)
  { category: "Aşk & Romantik", tr: "Sen benim hayatıma giren en güzel lütuf, kalbimin tek sahibisin. Seni çok seviyorum." },
  { category: "Aşk & Romantik", tr: "Her günüm seninle güzel, her anım seninle anlamlı. Varlığına binlerce kez şükürler olsun." },
  { category: "Aşk & Romantik", tr: "Gözlerinin içinde kaybolduğum tek dünyamsın. Aşkımız sonsuza kadar sürsün." },
  { category: "Aşk & Romantik", tr: "Dünyanın en güzel kokan çiçeği bile senin kokunun yanında sönük kalır sevgilim." },
  { category: "Aşk & Romantik", tr: "Seninle geçen her saniye ömrüme ömür katıyor. Kalbimin biricik sahibi, seni seviyorum." },
  { category: "Aşk & Romantik", tr: "Bu çiçekler sana olan sevgimin sadece küçük bir simgesi. Seni her gün daha çok seviyorum." },
  { category: "Aşk & Romantik", tr: "Sen benim tek gerçeğim, ömrümün en tatlı hediyesisin. İyi ki hayatımdasın." },
  { category: "Aşk & Romantik", tr: "Karanlık dünyamı aydınlatan güneşim, her şeyim. Aşkınla renkleniyor günlerim." },
  { category: "Aşk & Romantik", tr: "Gülüşünle baharı getiren kadın/adam, seni sonsuz bir aşkla seviyorum." },
  { category: "Aşk & Romantik", tr: "Seninle bir ömür boyu el ele yürümek en büyük dileğim. Seni çok ama çok seviyorum." },
  { category: "Aşk & Romantik", tr: "Dünyadaki tüm çiçekleri toplasam yine de senin zarafetine erişemezler bir tanem." },
  { category: "Aşk & Romantik", tr: "Sadece bugün değil, aldığım her nefeste aklımdasın ve kalbimdesin." },
  { category: "Aşk & Romantik", tr: "Bana aşkı öğreten, her anımda yanımda olan meleğime sonsuz sevgilerle." },
  { category: "Aşk & Romantik", tr: "Sensiz bir gün bile eksik. Yanımda olduğun her an için teşekkür ederim sevgilim." },
  { category: "Aşk & Romantik", tr: "Hayatımın en güzel hikayesi seninle başladı ve seninle devam ediyor." },
  { category: "Aşk & Romantik", tr: "Mesafeler ne kadar uzak olursa olsun, kalbim hep senin ritminle atıyor." },
  { category: "Aşk & Romantik", tr: "Sen benim sığınacak limanım, huzurum ve sonsuz aşkımsın." },
  { category: "Aşk & Romantik", tr: "Gözlerine her baktığımda ilk günkü heyecanı yaşıyorum. Seni çok seviyorum." },
  { category: "Aşk & Romantik", tr: "Bir tek sen ol yanımda, başka hiçbir şey istemem bu dünyada." },
  { category: "Aşk & Romantik", tr: "Hayatımda başıma gelen en güzel şey sensin sevgilim. Sonsuza kadar seninle..." },

  // 2. Doğum Günü (20 Notes)
  { category: "Doğum Günü", tr: "İyi ki doğdun! Yeni yaşında sağlık, mutluluk ve tüm dileklerinin gerçekleşmesini dilerim." },
  { category: "Doğum Günü", tr: "Hayatıma renk katışının kaçıncı yılı bilmiyorum ama iyi ki varsın, doğum günün kutlu olsun!" },
  { category: "Doğum Günü", tr: "Yeni yaşın sana tüm güzellikleri, neşeyi ve başarıyı getirsin. Mutlu yıllar!" },
  { category: "Doğum Günü", tr: "Gülüşün gibi aydınlık, kalbin gibi güzel bir yıl seninle olsun. Doğum günün kutlu olsun!" },
  { category: "Doğum Günü", tr: "Senin gibi harika bir dost/insan iyi ki var. Yaşın kaç olursa olsun ruhun hep genç kalsın!" },
  { category: "Doğum Günü", tr: "Bugün senin günün! Tüm hayallerine bir adım daha yaklaştığın harika bir yaş dilerim." },
  { category: "Doğum Günü", tr: "Yıllar sana sadece zarafet ve tecrübe katsın. Doğum günün kutlu olsun bir tanem!" },
  { category: "Doğum Günü", tr: "Nice mutlu, sağlıklı ve başarı dolu yıllara! İyi ki doğdun, iyi ki hayatımızdasın." },
  { category: "Doğum Günü", tr: "Yeni yaşında her günün bir öncekinden daha güzel geçsin. Mutlu yıllar dilerim!" },
  { category: "Doğum Günü", tr: "Dünyanın en tatlı insanına en tatlı doğum günü dilekleriyle! Sevgilerle..." },
  { category: "Doğum Günü", tr: "Pastandaki mumlar kadar aydınlık ve umut dolu bir geleceğin olsun. Doğum günün kutlu olsun!" },
  { category: "Doğum Günü", tr: "Sen doğduğun gün dünya daha güzel bir yer oldu. İyi ki doğdun!" },
  { category: "Doğum Günü", tr: "Hayatın boyunca yüzünden tebessüm, kalbinden sevgi eksik olmasın. Mutlu yıllar!" },
  { category: "Doğum Günü", tr: "Yeni yaşında yeni başlangıçlar, muhteşem anılar ve sınırsız mutluluklar seninle olsun." },
  { category: "Doğum Günü", tr: "İyi ki yollarımız kesişmiş. Doğum gününü en içten dileklerimle kutlarım!" },
  { category: "Doğum Günü", tr: "Her yaşın ayrı bir güzelliği var ama bu yaşın sana uğur getirsin. Mutlu yıllar!" },
  { category: "Doğum Günü", tr: "Gönlünden geçen ne varsa yeni yaşında hepsine kavuşman dileğiyle. Doğum günün kutlu olsun!" },
  { category: "Doğum Günü", tr: "Birlikte daha nice doğum günleri kutlamak dileğiyle! İyi ki doğdun dostum." },
  { category: "Doğum Günü", tr: "Bugün tüm dualarım ve dileklerim senin mutluluğun için. Nice güzel yıllara!" },
  { category: "Doğum Günü", tr: "Ömrün boyunca hep sevgiyle çevrelen, mutluluk peşini hiç bırakmasın. Doğum günün kutlu olsun!" },

  // 3. Özür (20 Notes)
  { category: "Özür", tr: "Seni kırdığım için çok üzgünüm. Lütfen beni affet, sensiz anlarım anlamsız." },
  { category: "Özür", tr: "İsteyerek olmadı sevgilim. Kalbini kırdıysam binlerce kez özür dilerim. Seni çok seviyorum." },
  { category: "Özür", tr: "Hatamın farkındayım ve telafi etmek için ne gerekiyorsa yapmaya hazırım. Affet beni..." },
  { category: "Özür", tr: "Bu çiçekler üzüntümün ve pişmanlığımın simgesidir. Lütfen bana bir şans daha ver." },
  { category: "Özür", tr: "Seni üzmek isteyeceğim son şey bile değil. Tüm kalbimle özür diliyorum." },
  { category: "Özür", tr: "Gülüşünü benden esirgeme ne olur. Seni çok seviyorum, affet beni lütfen." },
  { category: "Özür", tr: "Yanlış anlaşıldığım için çok üzgünüm. Aramızdaki bağı hiçbir şeyin bozmasına izin vermeyelim." },
  { category: "Özür", tr: "Düşüncesizce davrandım ve seni üzdüm. Kalbindeki yerimi kaybetmek istemiyorum, bağışla beni." },
  { category: "Özür", tr: "Sana verdiğim değeri biliyorsun. Bir anlık hatam için samimiyetle özür diliyorum." },
  { category: "Özür", tr: "Bu çiçeklerin kokusu aramızdaki kırgınlığı unuttursun. Seni seviyorum." },
  { category: "Özür", tr: "Kalbindeki sevgiyi yeniden hissetmek en büyük dileğim. Lütfen beni bağışla." },
  { category: "Özür", tr: "Seni kırmak kendimi kırmaktır. Üzüntümü tarif edecek kelime bulamıyorum, özür dilerim." },
  { category: "Özür", tr: "Aramızdaki tatlı sert günleri geride bırakalım mı? Seni çok özledim." },
  { category: "Özür", tr: "Sana olan sevgim her hatamdan daha büyük. Lütfen gül yüzünü benden esirgeme." },
  { category: "Özür", tr: "Samimi bir özür ve kucak dolusu sevgilerle... Affet beni bir tanem." },
  { category: "Özür", tr: "Bir daha seni asla üzmeyeceğime söz veriyorum. Beni affedebilir misin?" },
  { category: "Özür", tr: "Sessizliğin beni incitiyor. Lütfen bu kırgınlığa son verelim." },
  { category: "Özür", tr: "Senin mutluluğun benim tek önceliğim. Seni üzdüğüm için gerçekten çok üzgünüm." },
  { category: "Özür", tr: "Bize bir şans daha tanı. Hatamı telafi etmeme izin ver lütfen." },
  { category: "Özür", tr: "En büyük hatam seni üzmekti, en büyük umudum ise seni yeniden gülümsetebilmektir." },

  // 4. Yeni Bebek (20 Notes)
  { category: "Yeni Bebek", tr: "Hoş geldin bebek! Ailenize sağlık, mutluluk ve neşe getirmesini dileriz." },
  { category: "Yeni Bebek", tr: "Dünyaya gözlerini açan minik meleğinize uzun, sağlıklı ve mutlu bir ömür dileriz." },
  { category: "Yeni Bebek", tr: "Anne ve baba olmanızı tebrik eder, bebeğinizle birlikte nice huzurlu yıllar dileriz." },
  { category: "Yeni Bebek", tr: "Minik mucizenizin doğumuyla evinizden kahkahalar hiç eksik olmasın. Gözünüz aydın!" },
  { category: "Yeni Bebek", tr: "Ailenizin yeni üyesi hoş geldi! Şansı bol, bahtı açık bir ömrü olsun." },
  { category: "Yeni Bebek", tr: "Bebeğinizin dünyaya gelişiyle yeşeren yeni mutluluklarınızı yürekten kutlarız." },
  { category: "Yeni Bebek", tr: "Dünyanın en güzel duygusunu tadan anne ve babayı tebrik ederiz. Hoş geldin küçük bebek!" },
  { category: "Yeni Bebek", tr: "Minik elleri ve küçük ayaklarıyla hayatınıza neşe katacak melek hoş geldi." },
  { category: "Yeni Bebek", tr: "Sevginizin en güzel meyvesi olan bebeğinizle sağlık dolu bir ömür dileriz." },
  { category: "Yeni Bebek", tr: "Gözünüz aydın! Bebeğinize ve size uzun, huzurlu ve bol neşeli bir gelecek dileriz." },
  { category: "Yeni Bebek", tr: "Evlat sevgisiyle aydınlanan yuvanızda mutluluklar dileriz. Tebrikler!" },
  { category: "Yeni Bebek", tr: "Dünyaya hoş geldin minik prens/prenses! Hayatın hep güzelliklerle dolsun." },
  { category: "Yeni Bebek", tr: "Yeni doğan meleğinize sağlık ve mutluluk dolu bir ömür temenni ederiz." },
  { category: "Yeni Bebek", tr: "Anne ve babalık yolculuğunuzda sonsuz sabır ve kucak dolusu mutluluklar dileriz." },
  { category: "Yeni Bebek", tr: "Ailenizin tatlı neşesi bebeğinizle birlikte güzel anılar biriktirmeniz dileğiyle." },
  { category: "Yeni Bebek", tr: "Meleğinizin gelişiyle eviniz bereket, gönlünüz huzur dolsun." },
  { category: "Yeni Bebek", tr: "Bebek kokusuyla dolan yuvanızda neşeli kahkahalar eksik olmasın." },
  { category: "Yeni Bebek", tr: "Gözlerinizdeki mutluluk ışıltısı hiç sönmesin. Tebrik ederiz!" },
  { category: "Yeni Bebek", tr: "Bebeğinizin adım adım büyüyüşüne tanıklık edeceğiniz harika bir ömür dileriz." },
  { category: "Yeni Bebek", tr: "Geleceğin güzel insanına hoş geldin diyor, tüm aileyi sevgiyle kucaklıyoruz." },

  // 5. Geçmiş Olsun (20 Notes)
  { category: "Geçmiş Olsun", tr: "Geçmiş olsun! En kısa sürede sağlığınıza kavuşup aramıza dönmeniz dileğiyle." },
  { category: "Geçmiş Olsun", tr: "Acil şifalar dilerim. Kalbim ve dualarım seninle, bir an önce iyileşmen dileğiyle." },
  { category: "Geçmiş Olsun", tr: "Güçlü duruşunla bu rahatsızlığı da atlatacağına eminim. Çok geçmiş olsun!" },
  { category: "Geçmiş Olsun", tr: "Bu çiçekler sana moral ve neşe getirsin. En kısa zamanda eski enerjine kavuşmanı dilerim." },
  { category: "Geçmiş Olsun", tr: "Geçmiş olsun dileklerimle... Kendine çok iyi bak, seni çok seviyoruz." },
  { category: "Geçmiş Olsun", tr: "En kısa sürede sağlığına kavuşup o güzel gülüşünle aramızı aydınlatman dileğiyle." },
  { category: "Geçmiş Olsun", tr: "Sağlık dolu günlerin çok yakın olduğuna inanıyorum. Şifa diliyorum." },
  { category: "Geçmiş Olsun", tr: "Hastalıklar geçici, sevgimiz kalıcıdır. Çok geçmiş olsun canım benim." },
  { category: "Geçmiş Olsun", tr: "Yaşadığın bu tatsız rahatsızlığı hızla atlatmanı temenni eder, acil şifalar dilerim." },
  { category: "Geçmiş Olsun", tr: "Dualarımız seninle. Kendini dinlendir ve çabucak iyileş!" },
  { category: "Geçmiş Olsun", tr: "Geçmiş olsun! Seni en kısa zamanda dimdik ve sağlıklı görmek istiyoruz." },
  { category: "Geçmiş Olsun", tr: "Moralini hep yüksek tut, sen neleri atlatmadın ki! Acil şifalar dilerim." },
  { category: "Geçmiş Olsun", tr: "Sağlığın yerinde olmadığı her an eksikliğini hissediyoruz. Çabuk iyileş!" },
  { category: "Geçmiş Olsun", tr: "Sevgimiz ve dualarımız sana şifa olsun. Çok geçmiş olsun." },
  { category: "Geçmiş Olsun", tr: "Kısa sürede sağlığına kavuşup tüm enerjinle geri dönmen dileğiyle..." },
  { category: "Geçmiş Olsun", tr: "Gözlerimiz yollarda kalmasın, çabucak iyileşip aramıza katıl. Geçmiş olsun!" },
  { category: "Geçmiş Olsun", tr: "Zor günler geride kalacak, sağlıklı ve huzurlu günler seninle olacak. Şifalar dilerim." },
  { category: "Geçmiş Olsun", tr: "Kendine dikkat et ve doktor tavsiyelerini unutma! Acil şifalar." },
  { category: "Geçmiş Olsun", tr: "Geçmiş olsun dileklerimizi sunar, en içten şifa temennilerimizi iletiriz." },
  { category: "Geçmiş Olsun", tr: "Senin güçlü bünyen bu hastalığı hemen yenecektir. Sevgiyle kal!" },

  // 6. Genel & Teşekkür (20 Notes)
  { category: "Genel & Teşekkür", tr: "Her şey için çok teşekkür ederim. İyi ki varsın ve iyi ki hayatımdasın!" },
  { category: "Genel & Teşekkür", tr: "Bana kattığın tüm güzellikler ve desteğin için sonsuz teşekkürler." },
  { category: "Genel & Teşekkür", tr: "Zarafetin ve inceliğin için minnettarım. Şansım olduğun için teşekkür ederim." },
  { category: "Genel & Teşekkür", tr: "Gününüz bu çiçekler kadar renkli ve neşeli geçsin. Sevgilerle..." },
  { category: "Genel & Teşekkür", tr: "Samimiyetiniz, güler yüzünüz ve dostluğunuz için çok teşekkür ederim." },
  { category: "Genel & Teşekkür", tr: "Zor zamanlarımda yanımda olduğun için minnettarım. Harika bir dostsun." },
  { category: "Genel & Teşekkür", tr: "Başarılarınızın devamını diler, emeğiniz için teşekkür ederiz." },
  { category: "Genel & Teşekkür", tr: "Hayatıma kattığınız değer ve içtenliğiniz için içtenlikle teşekkürler." },
  { category: "Genel & Teşekkür", tr: "Bu küçük hediye size verdiğim büyük değerin küçük bir nişanesidir." },
  { category: "Genel & Teşekkür", tr: "Nazik misafirperverliğiniz için çok teşekkür ederiz. Her şey harikaydı!" },
  { category: "Genel & Teşekkür", tr: "İyi günde kötü günde yanımda durduğun için teşekkür ederim dostum." },
  { category: "Genel & Teşekkür", tr: "Yeni işinde ve kariyerinde sonsuz başarılar dilerim. Tebrikler!" },
  { category: "Genel & Teşekkür", tr: "Tebrik eder, başarılarının devamlı olmasını dilerim. Sevgiler!" },
  { category: "Genel & Teşekkür", tr: "Katkılarınız ve özveriniz için şirketimiz adına teşekkür ederiz." },
  { category: "Genel & Teşekkür", tr: "Bana ilham verdiğin ve her zaman desteklediğin için minnettarım." },
  { category: "Genel & Teşekkür", tr: "Harika ev sahipliğiniz ve leziz ikramlarınız için çok teşekkürler." },
  { category: "Genel & Teşekkür", tr: "Varlığın hayatıma neşe katıyor. Her an için teşekkür ederim." },
  { category: "Genel & Teşekkür", tr: "İnceliğiniz ve nazik düşünceniz için çok teşekkür ederiz." },
  { category: "Genel & Teşekkür", tr: "Umarım bu çiçekler yüzünüzde tatlı bir tebessüm oluşturur. Sevgiler..." },
  { category: "Genel & Teşekkür", tr: "Dostluğun benim için çok kıymetli. İyi ki varsın, teşekkür ederim!" }
];

async function seedCardNotes() {
  console.log("Creating card_notes table in Supabase if not exists...");
  
  const formattedNotes = cardNotesData.map((note, index) => ({
    id: `NOTE-${index + 1}`,
    category: note.category,
    tr: note.tr,
    en: note.tr,
    status: "Aktif"
  }));

  console.log(`Seeding ${formattedNotes.length} card notes to Supabase...`);

  const { error } = await supabase.from('card_notes').upsert(formattedNotes, { onConflict: 'id' });
  if (error) {
    console.error("Card Notes Seed Error:", error.message);
  } else {
    console.log("✓ All 120 Card Notes (20 Per Category) Successfully Seeded to Live Supabase!");
  }
}

seedCardNotes();
