'use client';
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, Search, X, Coffee, IceCreamBowl, Utensils, LayoutGrid, List, ChevronRight, ChevronDown, SlidersHorizontal, Check } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog-local';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import menu from '@/data/menu.json';
import { hookahFlavors, type HookahFlavor } from '@/data/hookah';
const HookahEducation3D = lazy(() => import('@/components/HookahEducation3D').then(module => ({ default: module.HookahEducation3D })));
type Item = (typeof menu.groups)[number]['items'][number] & { category: string };
const sections = [
  { name: 'İçecekler', icon: Coffee, categories: ['Espresso Bar', 'Zoi Bar', 'Ice Bar', 'Matcha', 'Kokteyl', 'Frozen & Milkshake', 'Tea Pot', 'Soğuk İçecekler'] },
  { name: 'Yiyecekler', icon: Utensils, categories: ['Gurme Sandviç', 'Tostlar', 'Başlangıçlar', 'Makarna Mantı'] },
  { name: 'Tatlılar', icon: IceCreamBowl, categories: ['Tatlılar', 'Dondurma'] },
  { name: 'Diğer', icon: LayoutGrid, categories: ['Lüks Çerez', 'Şarjmatik'] },
];
const notes: Record<string, string> = {'Espresso Bar':'Sıcak kahveler','Zoi Bar':'Zoi imza kahveleri','Ice Bar':'Soğuk kahveler','Matcha':'Sıcak ve soğuk matcha','Kokteyl':'Alkolsüz imza kokteyller','Frozen & Milkshake':'Frozen ve milkshake','Tea Pot':'Çay çeşitleri','Soğuk İçecekler':'Şişe ve kutu içecekler','Gurme Sandviç':'Gurme sandviçler','Tostlar':'Bazlama tostlar','Başlangıçlar':'Paylaşımlıklar','Makarna Mantı':'Ana yemekler','Tatlılar':'Günlük tatlılar','Dondurma':'Kase ve külah'};
function ProductImage({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false);
  return item.image && !failed ? <img src={item.image} alt={item.name} loading="lazy" onError={() => setFailed(true)} /> : <div className="image-absent" aria-label="Ürün fotoğrafı bulunmuyor"><Coffee size={30} strokeWidth={1} /><span>zoi</span></div>;
}
export default function Home() {
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
  const [selectedAromaIds,setSelectedAromaIds]=useState<string[]>(['love-66']);
  const [focusedAromaId,setFocusedAromaId]=useState('love-66');
  const activeSection=sections.find(entry=>entry.name===section)!;
  const normalized=query.trim().toLocaleLowerCase('tr-TR');
  const results=useMemo(()=>menu.groups.filter(group=>normalized||group.category===category).flatMap(group=>group.items.map(item=>({...item,category:group.category}))).filter(item=>!normalized||[item.name,item.description,item.category].join(' ').toLocaleLowerCase('tr-TR').includes(normalized)),[category,normalized]);
  useEffect(()=>setVisibleCount(6),[category,normalized,view]);
  useEffect(()=>{
    if(visibleCount>=results.length||!loadMoreRef.current)return;
    const observer=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting)setVisibleCount(count=>Math.min(count+6,results.length));},{rootMargin:'120px 0px'});
    observer.observe(loadMoreRef.current);
    return ()=>observer.disconnect();
  },[visibleCount,results.length,category,normalized,view]);
  const selectedAromas=selectedAromaIds.map(id=>hookahFlavors.find(flavor=>flavor.id===id)).filter((flavor):flavor is HookahFlavor=>Boolean(flavor));
  const focusedAroma=selectedAromas.find(flavor=>flavor.id===focusedAromaId)||selectedAromas.at(-1);
  const visibleAromas=hookahFlavors.filter(flavor=>flavor.line===hookahLine&&flavor.name.toLocaleLowerCase('tr-TR').includes(hookahQuery.toLocaleLowerCase('tr-TR')));
  const selectedNotes=Array.from(new Set(selectedAromas.flatMap(flavor=>flavor.tags))).slice(0,6);
  function chooseCategory(name:string){const parent=sections.find(entry=>entry.categories.includes(name));if(parent)setSection(parent.name);setCategory(name);setQuery('');setCategoriesOpen(false);window.scrollTo({top:0,behavior:'smooth'});}
  function chooseSection(name:string){const entry=sections.find(option=>option.name===name);if(entry)chooseCategory(entry.categories[0]);}
  function changeHookahLine(line:'classic'|'dark'){const first=hookahFlavors.find(flavor=>flavor.line===line)!;setHookahLine(line);setHookahQuery('');setSelectedAromaIds([first.id]);setFocusedAromaId(first.id);setHookahDetail(false);}
  function toggleAroma(flavor:HookahFlavor){const picked=selectedAromaIds.includes(flavor.id);if(picked){const next=selectedAromaIds.filter(id=>id!==flavor.id);setSelectedAromaIds(next);setFocusedAromaId(next.at(-1)||'');return;}const next=selectedAromaIds.length>=3?[...selectedAromaIds.slice(1),flavor.id]:[...selectedAromaIds,flavor.id];setSelectedAromaIds(next);setFocusedAromaId(flavor.id);}
  return <main className="menu-app">
    <header className="brand-header"><a className="brand" href="#menu" aria-label="Zoi Kırkpınar menü"><span className="brand-symbol"><img src="/logo.webp" alt="Zoi" /></span></a><span className="menu-word">MENÜ</span><button className="icon-button header-categories" onClick={()=>setCategoriesOpen(true)} aria-label="Tüm kategorileri aç"><LayoutGrid size={19}/></button></header>
    <div className="sticky-controls">
      <div className="search-row"><label className="search-input"><Search size={19} strokeWidth={1.6}/><input type="search" aria-label="Menüde ürün ara" placeholder="Kahve, tatlı, sandviç…" value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button onClick={()=>setQuery('')} aria-label="Aramayı temizle"><X size={17}/></button>}</label><button className="category-launcher" aria-label="Tüm kategoriler" onClick={()=>setCategoriesOpen(true)}><SlidersHorizontal size={20} strokeWidth={1.6}/></button></div>
      <Tabs value={section} onValueChange={chooseSection} className="section-tabs"><TabsList className="section-list" aria-label="Menü bölümleri">{sections.map(({name,icon:Icon})=><TabsTrigger value={name} key={name} className="section-tab"><Icon size={20} strokeWidth={1.5}/><span>{name}</span></TabsTrigger>)}</TabsList></Tabs>
      {!normalized&&<nav className="category-strip" aria-label="Alt kategoriler">{activeSection.categories.map(name=><button key={name} className={name===category?'category-chip selected':'category-chip'} aria-current={name===category?'true':undefined} onClick={()=>chooseCategory(name)}>{name}</button>)}</nav>}
    </div>
    <section id="menu" className="menu-content" aria-label={normalized?'Arama sonuçları':category}>
      <button className="education-banner" onClick={()=>{setHookahDetail(false);setEducationOpen(true)}}>
        <span className="education-copy"><strong>Nargile</strong><span>25 aroma</span></span>
        <span className="education-action">Oluştur <ArrowUpRight size={17}/></span>
      </button>
      <div className="results-heading"><h2>{normalized?'Arama':category}<span>{results.length}</span></h2><div className="view-switch" aria-label="Menü görünümü"><button aria-label="Kart görünümü" aria-pressed={view==='grid'} className={view==='grid'?'active':''} onClick={()=>setView('grid')}><LayoutGrid size={17}/></button><button aria-label="Liste görünümü" aria-pressed={view==='list'} className={view==='list'?'active':''} onClick={()=>setView('list')}><List size={19}/></button></div></div>
      {results.length?<><div className={'product-grid '+(view==='list'?'list-view':'')} key={category+normalized+view}>{results.slice(0,visibleCount).map((item,index)=><button className="menu-card" style={{'--reveal-order':index%6} as CSSProperties} key={item.id} onClick={()=>setSelected(item)}><div className="card-image"><ProductImage item={item}/></div><div className="card-content"><h3>{item.name}</h3><div className="card-bottom"><strong>{item.price.toLocaleString('tr-TR')}<span>₺</span></strong></div></div></button>)}</div>{visibleCount<results.length&&<div className="more-products" ref={loadMoreRef}><button onClick={()=>setVisibleCount(count=>Math.min(count+6,results.length))}>6 ürün daha göster <ChevronDown size={16}/></button></div>}</>:<div className="empty-results"><Search size={30} strokeWidth={1}/><h3>Sonuç yok</h3><button onClick={()=>setQuery('')}>Menüye dön</button></div>}
      <button className="all-categories-button" onClick={()=>setCategoriesOpen(true)}>Tüm menü<span>Kategorileri gör <ChevronDown size={16}/></span></button>
    </section>
    <footer className="menu-footer"><span>zoi <small>KIRKPINAR</small></span><p>Alerjen ve içerik bilgisi için ekibimize danışabilirsin.</p></footer>
    <Dialog open={Boolean(selected)} onOpenChange={open=>{if(!open)setSelected(null)}}>
      <DialogContent className="detail-dialog" showCloseButton={false}>{selected&&<>
        <DialogClose className="dialog-dismiss" aria-label="Ürün detayını kapat"><X size={19}/></DialogClose>
        <div className="detail-image"><ProductImage item={selected}/></div>
        <div className="detail-body">
          <span className="detail-category">{selected.category}</span>
          <DialogTitle className="detail-title">{selected.name}</DialogTitle>
          {selected.description&&<DialogDescription className="detail-description">{selected.description}</DialogDescription>}
          <div className="detail-bottom"><strong>{selected.price.toLocaleString('tr-TR')} <span>₺</span></strong><DialogClose className="back-to-menu">Menüye dön <ArrowUpRight size={16}/></DialogClose></div>
        </div>
      </>}</DialogContent>
    </Dialog>
    <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}><DialogContent className="categories-dialog" showCloseButton={false}><div className="categories-dialog-heading"><div><DialogTitle>Kategoriler</DialogTitle><DialogDescription>Bugün canın ne çekiyor?</DialogDescription></div><DialogClose className="icon-button" aria-label="Kategorileri kapat"><X size={22}/></DialogClose></div><div className="category-directory">{sections.map(({name,icon:Icon,categories})=><div key={name}><h3><Icon size={17}/>{name}</h3>{categories.map(name=><button key={name} className={name===category?'current-category':''} onClick={()=>chooseCategory(name)}><span>{name}</span><small>{menu.groups.find(entry=>entry.category===name)?.items.length}</small><ChevronRight size={16}/></button>)}</div>)}</div></DialogContent></Dialog>
    <Dialog open={educationOpen} onOpenChange={setEducationOpen}><DialogContent className="education-dialog hookah-builder" showCloseButton={false}>
      <DialogClose className="hookah-close" aria-label="Nargile menüsünü kapat"><X size={19}/></DialogClose>
      <div className={'education-visual '+(hookahLine==='dark'?'dark-visual':'')} style={{'--aroma':focusedAroma?.color||'#6f8980'} as CSSProperties}>
        <span className="public-label">ZOI · KIRKPINAR</span>
        <Suspense fallback={<div className="hookah-loading">Model hazırlanıyor…</div>}><HookahEducation3D accents={selectedAromas.map(flavor=>flavor.color)} darkLine={hookahLine==='dark'} onDetailChange={setHookahDetail}/></Suspense>
        <span className="model-mark">{hookahDetail?'Genel görünüm için dokun':'360° · Detay için dokun'}</span>
      </div>
      <div className="education-panel builder-panel">
        <div className="builder-heading"><div><DialogTitle className="education-title">Nargileni oluştur</DialogTitle><DialogDescription className="education-intro">En fazla 3 aroma seç.</DialogDescription></div></div>
        <div className="line-switch" aria-label="Nargile serisi">
          <button className={hookahLine==='classic'?'active':''} onClick={()=>changeHookahLine('classic')}><span>Klasik</span><strong>580 ₺</strong></button>
          <button className={hookahLine==='dark'?'active':''} onClick={()=>changeHookahLine('dark')}><span>Dark</span><strong>650 ₺</strong></button>
        </div>
        <label className="flavor-search"><Search size={16}/><input value={hookahQuery} onChange={event=>setHookahQuery(event.target.value)} placeholder="Aroma ara" aria-label="Nargile aroması ara"/>{hookahQuery&&<button onClick={()=>setHookahQuery('')} aria-label="Aroma aramasını temizle"><X size={15}/></button>}</label>
        <div className="flavor-count"><span>Aromalar</span><small>{selectedAromas.length}/3</small></div>
        <div className="flavor-grid" aria-label="Aroma seçenekleri">
          {visibleAromas.map(flavor=>{const picked=selectedAromaIds.includes(flavor.id);return <button key={flavor.id} aria-pressed={picked} className={picked?'flavor-card picked':'flavor-card'} onClick={()=>toggleAroma(flavor)}><i style={{'--flavor':flavor.color} as CSSProperties}/><span>{flavor.name}</span>{picked&&<b><Check size={12}/></b>}</button>})}
        </div>
        {focusedAroma&&<div className="flavor-profile" style={{'--aroma':focusedAroma.color} as CSSProperties}><div className="profile-top"><span><i style={{background:focusedAroma.color}}/>{focusedAroma.name}</span><small>TAT PROFİLİ</small></div><p>{focusedAroma.note}</p><div className="taste-tags">{focusedAroma.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>}
        <div className={'blend-summary '+(!selectedAromas.length?'is-empty':'')}><div><small>SEÇİMİN</small><strong>{selectedAromas.length?selectedAromas.map(flavor=>flavor.name).join(' + '):'Aroma seç'}</strong>{selectedAromas.length>0&&<p>{selectedNotes.join(' · ')}</p>}</div><b>{hookahLine==='dark'?'650':'580'} <span>₺</span></b></div>
        <div className="service-extras"><span>Servis seçenekleri</span><div><small>Kafa değişimi <b>450 ₺</b></small><small>Buzlu marpuç <b>+75 ₺</b></small></div></div>
        <p className="hookah-note">Tütün ürünleri sağlığa zararlıdır.</p>
      </div>
    </DialogContent></Dialog>
  </main>;
}
