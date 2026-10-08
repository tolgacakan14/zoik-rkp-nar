'use client';
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, Search, X, Coffee, IceCreamBowl, Utensils, LayoutGrid, List, ChevronRight, ChevronLeft, ChevronDown, Check } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog-local';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hookahFlavors, type HookahFlavor } from '@/data/hookah';
import { pairingGuides, productPresentation } from '@/data/productPresentation';
import { defaultSettings, hookahFromCsv, localMenu, menuFromCsv, settingsFromCsv, type LiveMenuItem, type LiveSettings } from '@/lib/live-menu';
const HookahEducation3D = lazy(() => import('@/components/HookahEducation3D').then(module => ({ default: module.HookahEducation3D })));
type Item = LiveMenuItem & { category: string };
const sections = [
  { name: 'İçecekler', icon: Coffee, categories: ['Espresso Bar', 'Zoi Bar', 'Ice Bar', 'Matcha', 'Kokteyl', 'Frozen & Milkshake', 'Tea Pot', 'Soğuk İçecekler'] },
  { name: 'Yiyecekler', icon: Utensils, categories: ['Gurme Sandviç', 'Tostlar', 'Başlangıçlar', 'Makarna Mantı'] },
  { name: 'Tatlılar', icon: IceCreamBowl, categories: ['Tatlılar', 'Dondurma'] },
  { name: 'Diğer', icon: LayoutGrid, categories: ['Lüks Çerez', 'Şarjmatik'] },
];
const notes: Record<string, string> = {'Espresso Bar':'Sıcak kahveler','Zoi Bar':'Zoi imza kahveleri','Ice Bar':'Soğuk kahveler','Matcha':'Sıcak ve soğuk matcha','Kokteyl':'Alkolsüz imza kokteyller','Frozen & Milkshake':'Frozen ve milkshake','Tea Pot':'Çay çeşitleri','Soğuk İçecekler':'Şişe ve kutu içecekler','Gurme Sandviç':'Gurme sandviçler','Tostlar':'Bazlama tostlar','Başlangıçlar':'Paylaşımlıklar','Makarna Mantı':'Ana yemekler','Tatlılar':'Günlük tatlılar','Dondurma':'Kase ve külah'};
// Hanging garland bulbs for the hero illustration: [x, y, dropLength] along the
// sagging cable, computed once from the same quadratic curve as the SVG path
// below (P0 25,150 · P1 220,186 · P2 415,150) so they sit exactly on the line.
const heroBulbs: Array<[number, number, number]> = [
  [56.2, 155.3, 34], [87.4, 159.7, 52], [118.6, 163.1, 30], [153.7, 165.9, 58],
  [188.8, 167.5, 26], [220.0, 168.0, 60], [251.2, 167.5, 28], [286.3, 165.9, 56],
  [321.4, 163.1, 32], [352.6, 159.7, 50], [383.8, 155.3, 36],
];
const oliveBranches: Array<[string, number]> = [
  ['M84 278 C65 252 47 235 20 224 C12 221 7 216 3 209',.02],
  ['M82 253 C61 226 39 213 12 201',.07],
  ['M83 232 C64 204 44 190 18 180 C10 177 5 171 2 164',.13],
  ['M85 216 C73 188 64 163 65 137 C65 119 59 105 48 91',.22],
  ['M88 278 C108 251 127 235 155 225 C165 221 173 215 179 207',.04],
  ['M88 251 C109 226 131 211 166 198',.09],
  ['M88 231 C107 204 128 189 158 179 C168 175 175 168 179 159',.16],
  ['M88 214 C100 187 108 163 107 136 C107 116 114 98 127 82',.24],
  ['M38 219 C29 203 25 188 26 171',.3],['M51 207 C39 190 36 174 38 155',.35],
  ['M65 190 C52 173 48 154 50 134',.4],['M67 139 C78 119 83 101 81 81',.46],
  ['M140 217 C151 201 155 185 154 168',.32],['M127 205 C140 189 144 171 142 151',.37],
  ['M111 188 C125 171 130 152 128 131',.42],['M107 137 C97 116 94 97 97 75',.48],
];
const oliveLeaves: Array<[number, number, number, number]> = [
  [10,184,-63,.22],[18,193,-28,.26],[25,207,-61,.3],[35,215,-19,.34],[20,159,-59,.38],[29,169,-19,.41],
  [37,183,-56,.44],[49,190,-12,.47],[29,128,-55,.46],[40,140,-16,.49],[48,154,-52,.52],[61,163,-7,.55],
  [43,101,-48,.53],[53,113,-9,.56],[62,129,-44,.59],[72,141,3,.62],[68,84,-33,.61],[77,99,8,.64],
  [83,116,-29,.67],[94,125,16,.7],[91,72,-18,.69],[101,87,21,.72],[105,104,-14,.75],[116,112,27,.78],
  [119,52,-27,.73],[126,67,17,.76],[126,83,-24,.79],[137,96,31,.82],[142,116,35,.6],[151,130,62,.63],
  [132,143,28,.57],[145,154,58,.61],[151,165,31,.53],[163,177,62,.57],[135,183,24,.48],[150,194,57,.52],
  [116,205,20,.4],[132,215,54,.44],[107,221,10,.35],[121,234,45,.39],[91,232,-9,.31],[105,248,39,.35],
  [54,225,-48,.35],[43,238,-19,.39],[32,220,-63,.32],[25,238,-28,.36],[49,254,-42,.29],[62,264,-7,.33],
  [73,181,-29,.48],[91,181,26,.51],[73,203,-34,.43],[95,201,31,.46],[69,279,-26,.2],[94,274,31,.23],
];
function OliveTree({ side }: { side: 'left' | 'right' }) {
  return <svg className={`olive-tree olive-tree-${side}`} viewBox="0 0 180 360" fill="none" aria-hidden="true">
    <g className="olive-wood">
      <path className="olive-trunk-fill" d="M79 360 C75 330 72 310 77 285 C81 263 74 244 77 222 C80 201 88 184 87 161 C86 143 80 129 84 111 C87 97 91 84 91 69 C91 55 87 45 89 34 C93 47 99 57 98 72 C97 90 92 102 93 117 C94 137 101 151 98 173 C95 194 86 210 86 231 C86 253 94 269 90 290 C86 312 89 336 94 360 Z"/>
      <path className="olive-trunk" pathLength={1} d="M86 359 C82 328 80 311 84 288 C89 263 79 246 82 221 C85 198 94 180 92 158 C90 137 85 126 89 108 C94 88 96 72 92 55 C90 47 90 40 92 32"/>
      <path className="olive-bark" d="M84 338 C90 327 88 313 85 302 M81 286 C88 278 88 266 84 255 M82 232 C89 222 91 210 89 199 M89 176 C94 165 94 151 90 141"/>
      <path className="olive-root" d="M84 354 C65 354 53 358 42 360 M90 353 C108 353 122 357 136 360"/>
      {oliveBranches.map(([d,reveal],index)=><path key={index} className={index<8?'olive-branch olive-scaffold':'olive-branch'} pathLength={1} d={d} style={{'--branch-at':reveal} as CSSProperties}/>)}
    </g>
    <g className="olive-crown">
      {oliveLeaves.filter((_,index)=>index%4!==3).map(([x,y,rotation,reveal],index)=><g className={`olive-leaflet ${index<7||index%10===0?'olive-signature':''}`} key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rotation})`} style={{'--leaf-at':reveal} as CSSProperties}>
        <path className="olive-leaf" d={index%3===0?'M0 -9 C3.6 -5.8 3.8 1.5 -.4 9 C-3.1 4.8 -3.4 -2.8 0 -9Z':'M0 -8.5 C3 -5.2 3.4 1.8 0 8.5 C-3.5 4.2 -3 -2.3 0 -8.5Z'}/>
        {index%2===0&&<path className="olive-leaf-vein" d="M0 -6.5 C.2 -2 .1 2.5 0 6"/>}
      </g>)}
      <circle className="olive-fruit olive-signature-fruit" cx="43" cy="211" r="3.5" style={{'--leaf-at':.12} as CSSProperties}/>
      <circle className="olive-fruit" cx="95" cy="174" r="3.3" style={{'--leaf-at':.48} as CSSProperties}/>
      <circle className="olive-fruit" cx="59" cy="108" r="3.1" style={{'--leaf-at':.62} as CSSProperties}/>
      <circle className="olive-fruit" cx="128" cy="202" r="3.4" style={{'--leaf-at':.56} as CSSProperties}/>
      <circle className="olive-fruit" cx="31" cy="162" r="3" style={{'--leaf-at':.7} as CSSProperties}/>
      <circle className="olive-fruit" cx="142" cy="151" r="3.2" style={{'--leaf-at':.76} as CSSProperties}/>
    </g>
  </svg>;
}
function ProductImage({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false);
  return item.image && !failed ? <img src={item.image} alt={item.name} loading="lazy" onError={() => setFailed(true)} /> : <div className="image-absent" aria-label="Ürün fotoğrafı bulunmuyor"><Coffee size={30} strokeWidth={1} /><span>zoi</span></div>;
}
export default function Home() {
  const [menuData,setMenuData]=useState(localMenu);
  const [hookahOptions,setHookahOptions]=useState<Array<HookahFlavor & {soldOut?:boolean}>>(hookahFlavors);
  const [liveSettings,setLiveSettings]=useState<LiveSettings>(defaultSettings);
  const [section,setSection]=useState('İçecekler');
  const [category,setCategory]=useState('Espresso Bar');
  const [query,setQuery]=useState('');
  const [view,setView]=useState<'grid'|'list'>('grid');
  const [selected,setSelected]=useState<Item|null>(null);
  const [visibleCount,setVisibleCount]=useState(6);
  const loadMoreRef=useRef<HTMLDivElement|null>(null);
  const [categoriesOpen,setCategoriesOpen]=useState(false);
  const [educationOpen,setEducationOpen]=useState(false);
  const [hookahDetail,setHookahDetail]=useState(false);
  const [hookahLine,setHookahLine]=useState<'classic'|'dark'>('classic');
  const [hookahQuery,setHookahQuery]=useState('');
  const [aromaStatus,setAromaStatus]=useState('Aroma seçerek karışımını oluştur');
  const [selectedAromaIds,setSelectedAromaIds]=useState<string[]>([]);
  const [focusedAromaId,setFocusedAromaId]=useState('');
  const heroRef=useRef<HTMLElement|null>(null);
  const sectionDefinitions=useMemo(()=>sections.map(entry=>{
    const categories=menuData.groups.filter(group=>group.section?group.section===entry.name:entry.categories.includes(group.category)).map(group=>group.category);
    return {...entry,categories:categories.length?categories:entry.categories};
  }),[menuData]);
  const activeSection=sectionDefinitions.find(entry=>entry.name===section)||sectionDefinitions[0];
  const normalized=query.trim().toLocaleLowerCase('tr-TR');
  const results=useMemo(()=>menuData.groups.filter(group=>normalized||group.category===category).flatMap(group=>group.items.map(item=>({...item,category:group.category}))).filter(item=>!normalized||[item.name,item.description,item.category].join(' ').toLocaleLowerCase('tr-TR').includes(normalized)),[menuData,category,normalized]);
  useEffect(()=>{
    let mounted=true;
    fetch('/api/menu',{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new Error('Canlı menü kullanılamıyor');
      const payload=await response.json() as {menuCsv:string;hookahCsv:string;settingsCsv:string};
      if(!mounted)return;
      const nextMenu=menuFromCsv(payload.menuCsv);
      const nextHookah=hookahFromCsv(payload.hookahCsv);
      if(nextMenu.groups.length)setMenuData(nextMenu);
      if(nextHookah.length)setHookahOptions(nextHookah);
      setLiveSettings(settingsFromCsv(payload.settingsCsv));
    }).catch(()=>{});
    return()=>{mounted=false};
  },[]);
  useEffect(()=>setVisibleCount(6),[category,normalized,view]);
  useEffect(()=>{
    if(visibleCount>=results.length||!loadMoreRef.current)return;
    const observer=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting)setVisibleCount(count=>Math.min(count+6,results.length));},{rootMargin:'120px 0px'});
    observer.observe(loadMoreRef.current);
    return ()=>observer.disconnect();
  },[visibleCount,results.length,category,normalized,view]);
  useEffect(()=>{
    const hero=heroRef.current;
    if(!hero)return;
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0;
    const update=()=>{
      frame=0;
      const distance=Math.max(hero.offsetHeight*.72,1);
      const progress=reducedMotion.matches?1:Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/distance));
      hero.style.setProperty('--olive-progress',progress.toFixed(3));
    };
    const schedule=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
    update();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    reducedMotion.addEventListener?.('change',schedule);
    return ()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);reducedMotion.removeEventListener?.('change',schedule);if(frame)window.cancelAnimationFrame(frame);};
  },[]);
  const selectedAromas=selectedAromaIds.map(id=>hookahOptions.find(flavor=>flavor.id===id)).filter((flavor):flavor is HookahFlavor=>Boolean(flavor));
  const focusedAroma=selectedAromas.find(flavor=>flavor.id===focusedAromaId)||selectedAromas.at(-1);
  const visibleAromas=hookahOptions.filter(flavor=>flavor.line===hookahLine&&flavor.name.toLocaleLowerCase('tr-TR').includes(hookahQuery.toLocaleLowerCase('tr-TR')));
  const selectedPresentation=selected?{...productPresentation[selected.id],intro:selected.description||productPresentation[selected.id]?.intro,character:selected.character||productPresentation[selected.id]?.character,intensity:selected.intensity||productPresentation[selected.id]?.intensity}:undefined;
  const detailIntro=selected?.description&&!selected.description.startsWith('İçerik bilgisi')?selected.description:selectedPresentation?.intro;
  const pairingOptions=selected?pairingGuides[selected.category]:undefined;
  const fallbackPairingGuide=selected&&pairingOptions?.length?pairingOptions[(Number(selected.id)-1)%pairingOptions.length]:undefined;
  const pairingGuide=selected?.pairingProductId?{productId:selected.pairingProductId,note:selected.pairingNote||''}:fallbackPairingGuide;
  const pairedProduct=pairingGuide?menuData.groups.flatMap(group=>group.items.map(item=>({...item,category:group.category}))).find(item=>item.id===pairingGuide.productId):undefined;
  const selectedCategoryItems=selected?menuData.groups.find(group=>group.category===selected.category)?.items.map(item=>({...item,category:selected.category}))||[]:[];
  const selectedIndex=selected?selectedCategoryItems.findIndex(item=>item.id===selected.id):-1;
  const previousProduct=selectedIndex>=0?selectedCategoryItems[(selectedIndex-1+selectedCategoryItems.length)%selectedCategoryItems.length]:undefined;
  const nextProduct=selectedIndex>=0?selectedCategoryItems[(selectedIndex+1)%selectedCategoryItems.length]:undefined;
  function chooseCategory(name:string){const parent=sectionDefinitions.find(entry=>entry.categories.includes(name));if(parent)setSection(parent.name);setCategory(name);setQuery('');setCategoriesOpen(false);window.scrollTo({top:0,behavior:'smooth'});}
  function chooseSection(name:string){const entry=sectionDefinitions.find(option=>option.name===name);if(entry)chooseCategory(entry.categories[0]);}
  function changeHookahLine(line:'classic'|'dark'){setHookahLine(line);setHookahQuery('');setSelectedAromaIds([]);setFocusedAromaId('');setAromaStatus('Aroma seçerek karışımını oluştur');setHookahDetail(false);}
  function toggleAroma(flavor:HookahFlavor&{soldOut?:boolean}){if(flavor.soldOut){setAromaStatus(`${flavor.name} şu an tükendi`);return;}const picked=selectedAromaIds.includes(flavor.id);if(picked){const next=selectedAromaIds.filter(id=>id!==flavor.id);setSelectedAromaIds(next);setFocusedAromaId(next.at(-1)||'');setAromaStatus(`${flavor.name} çıkarıldı`);return;}if(selectedAromaIds.length>=liveSettings.maxAromas){setFocusedAromaId(flavor.id);setAromaStatus(`${liveSettings.maxAromas} aroma sınırı · önce bir aromayı çıkar`);return;}const next=[...selectedAromaIds,flavor.id];setSelectedAromaIds(next);setFocusedAromaId(flavor.id);setAromaStatus(`${flavor.name} eklendi · ${next.length}/${liveSettings.maxAromas}`);}
  return <main className="menu-app">
    <header className="brand-header"><a className="brand" href="#menu" aria-label="Zoi Kırkpınar menü"><span className="brand-symbol"><img src="/logo.webp" alt="Zoi" /></span></a><span className="menu-word">MENÜ</span><button className="icon-button header-categories" onClick={()=>setCategoriesOpen(true)} aria-label="Tüm kategorileri aç"><LayoutGrid size={19}/></button></header>

    {/* Hand-drawn line-art hero: no photo, a light illustration of the storefront
        (roofline, treetop, hanging garland) with the wordmark drawn in the same
        broken-ring style as the sign, and the cafe name typed on in sequence. */}
    <section className="hero" aria-label="Zoi Kırkpınar" ref={heroRef}>
      <OliveTree side="left"/>
      <OliveTree side="right"/>
      <svg className="hero-line-art" viewBox="0 0 440 300" fill="none" aria-hidden="true">
        <path className="la-line la-roof-ghost" pathLength={1} d="M18,152 L220,53 L422,152" />
        <path className="la-line la-roof" pathLength={1} d="M20,150 L220,55 L420,150" />
        <path className="la-line la-foliage-back" pathLength={1} d="
          M40,134 q11,-16 22,-2 q11,-18 22,0 q11,-15 22,3 q11,-19 22,-3
          q11,-14 22,2 q11,-18 22,-2 q11,-15 22,4 q11,-17 22,-1
          q11,-14 22,3 q11,-15 22,-4 q11,-12 22,2 q11,-16 22,-3 q11,-13 22,2" />
        <path className="la-line la-foliage" pathLength={1} d="
          M46,128 q12,-22 24,-4 q12,-24 24,-2 q12,-20 24,4 q12,-26 24,-6
          q12,-18 24,2 q12,-24 24,-4 q12,-20 24,6 q12,-22 24,-2
          q12,-18 24,4 q12,-20 24,-6 q12,-16 24,2 q12,-20 24,-4" />
        <path className="la-line la-garland" pathLength={1} d="M25,150 Q220,186 415,150" />
        <path className="la-line la-sprig" pathLength={1} d="M40,134 q-9,-11 -4,-24" />
        <path className="la-line la-sprig" pathLength={1} d="M400,134 q9,-11 4,-24" />
        <ellipse className="la-glow" cx={205} cy={222} rx={132} ry={66} />
        {heroBulbs.map(([x,y,drop],index)=>(
          <g className="la-bulb" style={{'--bulb-delay':`${1.05+index*.05}s`} as CSSProperties} key={index}>
            <path pathLength={1} d={`M${x},${y} L${x},${y+drop}`} />
            <circle cx={x} cy={y+drop+5} r={3.4} />
          </g>
        ))}
      </svg>
      <div className="hero-copy">
        <img className="hero-brandmark" src="/logo.webp" alt="Zoi" />
        <span className="hero-kicker">CAFE &amp; NARGİLE</span>
        <h1 className="hero-name" aria-label="Zoi Kırkpınar">
          {'KIRKPINAR'.split('').map((letter,index)=>(
            <span key={index} style={{'--letter-delay':`${1.5+index*.045}s`} as CSSProperties}>{letter}</span>
          ))}
        </h1>
      </div>
    </section>

    <button className="hero-cta" onClick={()=>{setHookahDetail(false);setEducationOpen(true)}}>
      <span className="hero-cta-text">
        <strong>Nargileni Oluştur</strong>
        <small>{hookahOptions.filter(flavor=>!flavor.soldOut).length} aroma · kendi karışımını tasarla</small>
      </span>
      <span className="hero-cta-arrow"><ArrowUpRight size={18}/></span>
    </button>

    <div className="sticky-controls">
      <div className="menu-search-row">
        <label className="menu-search"><Search size={17}/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Menüde ara" aria-label="Menüde ürün ara"/>{query&&<button onClick={()=>setQuery('')} aria-label="Aramayı temizle"><X size={16}/></button>}</label>
        <button className="menu-directory-button" onClick={()=>setCategoriesOpen(true)} aria-label="Tüm kategorileri aç"><LayoutGrid size={18}/><span>Kategoriler</span></button>
      </div>
      <div className="section-tabs">
        <Tabs value={section} onValueChange={chooseSection}><TabsList className="section-list" aria-label="Menü bölümleri">{sectionDefinitions.map(({name,icon:Icon})=><TabsTrigger value={name} key={name} className="section-tab"><Icon size={20} strokeWidth={1.5}/><span>{name}</span></TabsTrigger>)}</TabsList></Tabs>
      </div>
      {!normalized&&<nav className="category-strip" aria-label="Alt kategoriler">{activeSection.categories.map(name=><button key={name} className={name===category?'category-chip selected':'category-chip'} aria-current={name===category?'true':undefined} onClick={()=>chooseCategory(name)}>{name}</button>)}</nav>}
    </div>
    <section id="menu" className="menu-content" aria-label={normalized?'Arama sonuçları':category}>
      <div className="results-heading"><h2>{normalized?'Arama':category}<span>{results.length}</span></h2><div className="view-switch" aria-label="Menü görünümü"><button aria-label="Kart görünümü" aria-pressed={view==='grid'} className={view==='grid'?'active':''} onClick={()=>setView('grid')}><LayoutGrid size={17}/></button><button aria-label="Liste görünümü" aria-pressed={view==='list'} className={view==='list'?'active':''} onClick={()=>setView('list')}><List size={19}/></button></div></div>
      {results.length?<><div className={'product-grid '+(view==='list'?'list-view':'')} key={category+normalized+view}>{results.slice(0,visibleCount).map((item,index)=><button className={'menu-card '+(item.soldOut?'sold-out':'')} style={{'--reveal-order':index%6} as CSSProperties} key={item.id} onClick={()=>setSelected(item)}><div className="card-image"><ProductImage item={item}/>{item.soldOut&&<span className="sold-out-badge">Tükendi</span>}</div><div className="card-content"><h3>{item.name}</h3><div className="card-bottom"><strong>{item.soldOut?'Bugün yok':<>{item.price.toLocaleString('tr-TR')}<span>₺</span></>}</strong></div></div></button>)}</div>{visibleCount<results.length&&<div className="more-products" ref={loadMoreRef}><button onClick={()=>setVisibleCount(count=>Math.min(count+6,results.length))}>6 ürün daha göster <ChevronDown size={16}/></button></div>}</>:<div className="empty-results"><Search size={30} strokeWidth={1}/><h3>Sonuç yok</h3><button onClick={()=>setQuery('')}>Menüye dön</button></div>}
      <button className="all-categories-button" onClick={()=>setCategoriesOpen(true)}>Tüm menü<span>Kategorileri gör <ChevronDown size={16}/></span></button>
    </section>
    <footer className="menu-footer"><span>zoi <small>KIRKPINAR</small></span><p>Alerjen ve içerik bilgisi için ekibimize danışabilirsin.</p><a className="menu-credit-link" href="https://tab-marketing-site.vercel.app/" target="_blank" rel="noreferrer" aria-label="Tab Marketing sitesini aç">Menü tasarımı · Tab Marketing</a></footer>
    <Dialog open={Boolean(selected)} onOpenChange={open=>{if(!open)setSelected(null)}}>
      <DialogContent className="detail-dialog" showCloseButton={false}>{selected&&<>
        <DialogClose className="dialog-dismiss" aria-label="Ürün detayını kapat">Kapat <X size={17}/></DialogClose>
        <div className="detail-image"><ProductImage key={selected.id} item={selected}/><span className="detail-visual-index">ZOI · KIRKPINAR</span><div className="detail-navigation" aria-label="Kategori ürünleri"><button onClick={()=>previousProduct&&setSelected(previousProduct)} aria-label="Önceki ürün"><ChevronLeft size={17}/></button><span>{selectedIndex+1} / {selectedCategoryItems.length}</span><button onClick={()=>nextProduct&&setSelected(nextProduct)} aria-label="Sonraki ürün"><ChevronRight size={17}/></button></div></div>
        <div className="detail-body" key={selected.id}>
          <span className="detail-category">ZOI SEÇKİSİ <i/> {selected.category}</span>
          <DialogTitle className="detail-title">{selected.name}</DialogTitle>
          {detailIntro&&<DialogDescription className="detail-description">{detailIntro}</DialogDescription>}
          <div className="detail-traits"><div><small>KARAKTER</small><strong>{selectedPresentation?.character||notes[selected.category]||selected.category}</strong></div>{selectedPresentation?.intensity&&<div><small>YOĞUNLUK</small><span className="detail-intensity" aria-label={`${selectedPresentation.intensity} / 4`}>{[1,2,3,4].map(level=><i key={level} className={level<=selectedPresentation.intensity!?'filled':''}/>)}</span></div>}</div>
          <div className="detail-bottom"><strong>{selected.soldOut?'Bugün tükendi':<>{selected.price.toLocaleString('tr-TR')} <span>₺</span></>}</strong><DialogClose className="back-to-menu">Menüye dön <ArrowUpRight size={16}/></DialogClose></div>
          {pairedProduct&&pairingGuide&&<button className="detail-pairing" onClick={()=>setSelected(pairedProduct)} aria-label={`${pairedProduct.name} önerisini aç`}>
            <span className="pairing-copy"><span className="pairing-eyebrow">BUNUNLA İYİ GİDER · {pairedProduct.category}</span><span className="pairing-name">{pairedProduct.name}</span><span className="pairing-note">{pairingGuide.note}</span><span className="pairing-price">{pairedProduct.price.toLocaleString('tr-TR')} ₺</span></span>
            <span className="pairing-arrow"><ArrowUpRight size={18}/></span>
          </button>}
        </div>
      </>}</DialogContent>
    </Dialog>
    <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}><DialogContent className="categories-dialog" showCloseButton={false}><div className="categories-dialog-heading"><div><DialogTitle>Kategoriler</DialogTitle><DialogDescription>Bugün canın ne çekiyor?</DialogDescription></div><DialogClose className="icon-button" aria-label="Kategorileri kapat"><X size={22}/></DialogClose></div><div className="category-directory">{sectionDefinitions.map(({name,icon:Icon,categories})=><div key={name}><h3><Icon size={17}/>{name}</h3>{categories.map(name=><button key={name} className={name===category?'current-category':''} onClick={()=>chooseCategory(name)}><span>{name}</span><small>{menuData.groups.find(entry=>entry.category===name)?.items.length}</small><ChevronRight size={16}/></button>)}</div>)}</div></DialogContent></Dialog>
    <Dialog open={educationOpen} onOpenChange={setEducationOpen}><DialogContent className="education-dialog hookah-builder" showCloseButton={false}>
      <DialogClose className="hookah-close" aria-label="Nargile menüsünü kapat"><X size={19}/></DialogClose>
      <div className={'education-visual '+(hookahLine==='dark'?'dark-visual':'')} style={{'--aroma':focusedAroma?.color||'#6f8980'} as CSSProperties}>
        <img className="zoi-model-emblem" src="/logo.webp" alt="" aria-hidden="true" />
        <Suspense fallback={<div className="hookah-loading">Model hazırlanıyor…</div>}><HookahEducation3D accents={selectedAromas.map(flavor=>flavor.color)} darkLine={hookahLine==='dark'} onDetailChange={setHookahDetail}/></Suspense>
        <span className="model-mark">{hookahDetail?'Tekrar dokun · Geri dön':'Dokun · Detaya yaklaş'}</span>
      </div>
      <div className="education-panel builder-panel">
        <div className="builder-heading"><div><DialogTitle className="education-title">Nargileni oluştur</DialogTitle><DialogDescription className="education-intro">En fazla {liveSettings.maxAromas} aroma seç.</DialogDescription></div></div>
        <div className="line-switch" aria-label="Nargile serisi">
          <button className={hookahLine==='classic'?'active':''} onClick={()=>changeHookahLine('classic')}><span>Klasik</span><strong>{liveSettings.classicPrice} ₺</strong></button>
          <button className={hookahLine==='dark'?'active':''} onClick={()=>changeHookahLine('dark')}><span>Dark</span><strong>{liveSettings.darkPrice} ₺</strong></button>
        </div>
        <div className="blend-rail"><span>KARIŞIMIN</span><div className="blend-slots">{Array.from({length:liveSettings.maxAromas},(_,index)=>{const flavor=selectedAromas[index];return flavor?<button key={flavor.id} onClick={()=>toggleAroma(flavor)} aria-label={`${flavor.name} aromasını çıkar`} style={{'--flavor':flavor.color} as CSSProperties}><i/>{flavor.name}<X size={13}/></button>:<span key={index}>+ Aroma</span>})}</div></div>
        <label className="flavor-search"><Search size={16}/><input value={hookahQuery} onChange={event=>setHookahQuery(event.target.value)} placeholder="Aroma ara" aria-label="Nargile aroması ara"/>{hookahQuery&&<button onClick={()=>setHookahQuery('')} aria-label="Aroma aramasını temizle"><X size={15}/></button>}</label>
        <div className="flavor-count"><span>Aromalar</span><small>{selectedAromas.length}/{liveSettings.maxAromas}</small></div>
        <p className="aroma-status" aria-live="polite">{aromaStatus}</p>
        <div className="flavor-grid" aria-label="Aroma seçenekleri">
          {visibleAromas.map(flavor=>{const picked=selectedAromaIds.includes(flavor.id);return <button key={flavor.id} aria-pressed={picked} disabled={flavor.soldOut} className={`${picked?'flavor-card picked':'flavor-card'}${flavor.soldOut?' sold-out':''}`} onClick={()=>toggleAroma(flavor)}><i style={{'--flavor':flavor.color} as CSSProperties}/><span><strong>{flavor.name}</strong><small>{flavor.soldOut?'Tükendi':flavor.tags.slice(0,2).join(' · ')}</small></span><b>{picked?<Check size={14}/>:<span>{flavor.soldOut?'—':'+'}</span>}</b></button>})}
        </div>
        {focusedAroma&&<div className="flavor-profile" style={{'--aroma':focusedAroma.color} as CSSProperties}><div className="profile-top"><span><i style={{background:focusedAroma.color}}/>{focusedAroma.name}</span><small>TAT PROFİLİ</small></div><p>{focusedAroma.note}</p><div className="taste-tags">{focusedAroma.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>}
        <div className="service-extras"><span>Servis seçenekleri</span><div><small>Kafa değişimi <b>{liveSettings.headChange} ₺</b></small><small>Buzlu marpuç <b>+{liveSettings.iceHose} ₺</b></small></div></div>
        <p className="hookah-note">Tütün ürünleri sağlığa zararlıdır.</p>
      </div>
    </DialogContent></Dialog>
  </main>;
}
