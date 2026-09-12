export type HookahFlavor = {
  id: string;
  name: string;
  line: 'classic' | 'dark';
  price: number;
  color: string;
  tags: string[];
  note: string;
};

export const hookahFlavors: HookahFlavor[] = [
  { id: 'love-66', name: 'Love 66', line: 'classic', price: 580, color: '#e76555', tags: ['Karpuz', 'Kavun', 'Çarkıfelek', 'Nane'], note: 'Tropik meyvelerle kavun ve karpuzun buluştuğu, sonunda ferahlık bırakan canlı bir profil.' },
  { id: 'lady', name: 'Lady', line: 'classic', price: 580, color: '#e99a45', tags: ['Mango', 'Şeftali', 'Nane', 'Buz'], note: 'Olgun mango ve şeftali karakterini serin bir bitişle dengeleyen tatlı tropik profil.' },
  { id: 'moscow', name: 'Moscow', line: 'classic', price: 580, color: '#7d5ba6', tags: ['Muz', 'Orman meyveleri', 'Mentol'], note: 'Muzun yumuşak tatlılığı, koyu orman meyveleri ve belirgin serinlikle tamamlanır.' },
  { id: 'anason', name: 'Anason', line: 'classic', price: 580, color: '#81915a', tags: ['Anason', 'Baharatlı', 'Klasik'], note: 'Belirgin anason karakterine sahip, aromatik ve geleneksel bir seçim.' },
  { id: 'uzum', name: 'Üzüm', line: 'classic', price: 580, color: '#74547e', tags: ['Üzüm', 'Meyvemsi', 'Tatlı'], note: 'Olgun üzümün dolgun ve temiz meyve karakterini öne çıkaran sade profil.' },
  { id: 'izmir-romantik', name: 'İzmir Romantik', line: 'classic', price: 580, color: '#ee6d68', tags: ['Karpuz', 'Çilek', 'Portakal', 'Nane'], note: 'Karpuz ve çileğe narenciye canlılığı ile hafif nane ferahlığı ekleyen renkli karışım.' },
  { id: 'kola', name: 'Kola', line: 'classic', price: 580, color: '#87513c', tags: ['Kola', 'Baharat', 'Karamel'], note: 'Kola baharatlarını karamelimsi bir tatlılıkla veren tanıdık ve yoğun profil.' },
  { id: 'dejavu', name: 'Dejavu', line: 'classic', price: 580, color: '#da768e', tags: ['Meyve kokteyli', 'Tatlı', 'Ferah'], note: 'Tatlı meyve kokteyli karakteri ve dengeli ferahlığıyla yumuşak içimli bir imza seçimi.' },
  { id: 'karpuz', name: 'Karpuz', line: 'classic', price: 580, color: '#e9525f', tags: ['Karpuz', 'Sulu', 'Yaz'], note: 'Olgun karpuzun sulu, hafif ve yazlık karakterini doğrudan öne çıkarır.' },
  { id: 'pismis-seftali', name: 'Pişmiş Şeftali', line: 'classic', price: 580, color: '#e88b5c', tags: ['Şeftali', 'Karamelize', 'Tatlı'], note: 'Şeftalinin sıcak, yoğun ve hafif karamelize edilmiş tatlı yönünü taşır.' },
  { id: 'turkish-mastic', name: 'Turkish Mastic', line: 'classic', price: 580, color: '#75a990', tags: ['Damla sakızı', 'Bitkisel', 'Ferah'], note: 'Damla sakızının reçinemsi, temiz ve kendine özgü ferah karakteri.' },
  { id: 'miamor', name: 'Miamor', line: 'classic', price: 580, color: '#e7bc42', tags: ['Muz', 'Ananas', 'Nane'], note: 'Muz ve ananasın tropik tatlılığını hafif nane ferahlığıyla birleştirir.' },
  { id: 'yaban-mersini', name: 'Yaban Mersini', line: 'classic', price: 580, color: '#5366a8', tags: ['Yaban mersini', 'Mayhoş', 'Meyvemsi'], note: 'Yaban mersininin koyu, hafif mayhoş ve aromatik meyve karakteri.' },
  { id: 'ananas', name: 'Ananas', line: 'classic', price: 580, color: '#e9b83f', tags: ['Ananas', 'Tropik', 'Canlı'], note: 'Tatlı ve hafif ekşi ananas notalarıyla parlak bir tropik profil.' },
  { id: 'cilek', name: 'Çilek', line: 'classic', price: 580, color: '#dc4f61', tags: ['Çilek', 'Tatlı', 'Meyvemsi'], note: 'Olgun çileğin yumuşak, tatlı ve kolay tanınan meyve karakteri.' },
  { id: 'tatli-cadi', name: 'Tatlı Cadı', line: 'classic', price: 580, color: '#bd5d87', tags: ['Kırmızı meyve', 'Şekerli', 'Yumuşak'], note: 'Kırmızı meyveleri şekerli ve yumuşak bir karakterde buluşturan Zoi seçimi.' },
  { id: 'pinkman', name: 'Pinkman', line: 'dark', price: 650, color: '#e54d74', tags: ['Greyfurt', 'Çilek', 'Ahududu'], note: 'Greyfurtun narenciye keskinliğini çilek ve ahududunun tatlı ekşiliğiyle birleştiren yoğun profil.' },
  { id: 'vanilla', name: 'Vanilla', line: 'dark', price: 650, color: '#e3c78e', tags: ['Vanilya', 'Kremsi', 'Yumuşak'], note: 'Kremsi vanilya karakteriyle sıcak, yuvarlak ve tatlı bir profil.' },
  { id: 'cookie', name: 'Cookie', line: 'dark', price: 650, color: '#b77948', tags: ['Kurabiye', 'Tereyağlı', 'Tatlı'], note: 'Fırından çıkmış kurabiye hissi veren tereyağlı ve belirgin tatlı karakter.' },
  { id: 'forest-berry', name: 'Forest Berry', line: 'dark', price: 650, color: '#76446f', tags: ['Orman meyveleri', 'Mayhoş', 'Yoğun'], note: 'Koyu orman meyvelerinin tatlı ve mayhoş taraflarını yoğun bir gövdede toplar.' },
  { id: 'nutella', name: 'Nutella', line: 'dark', price: 650, color: '#8d593d', tags: ['Fındık', 'Kakao', 'Kremsi'], note: 'Kakao ve fındık notalarını kremsi, tatlı ve dolgun bir karakterde sunar.' },
  { id: 'ahududu', name: 'Ahududu', line: 'dark', price: 650, color: '#c83f67', tags: ['Ahududu', 'Ekşi tatlı', 'Canlı'], note: 'Ahududunun belirgin ekşi tatlı dengesini canlı ve yoğun şekilde öne çıkarır.' },
  { id: 'brownie', name: 'Brownie', line: 'dark', price: 650, color: '#6d4638', tags: ['Kakao', 'Kek', 'Yoğun'], note: 'Yoğun kakao ve sıcak kek notalarıyla tok bir tatlı profili.' },
  { id: 'ananas-gofret', name: 'Ananas Gofret', line: 'dark', price: 650, color: '#d8a443', tags: ['Ananas', 'Gofret', 'Kremsi'], note: 'Canlı ananası kremalı gofret karakteriyle buluşturan tropik tatlı profili.' },
  { id: 'ananas-buz', name: 'Ananas Buz', line: 'dark', price: 650, color: '#5eb8a5', tags: ['Ananas', 'Buz', 'Ferah'], note: 'Ananasın tatlı ekşi canlılığını güçlü bir serinlikle tamamlar.' },
];
