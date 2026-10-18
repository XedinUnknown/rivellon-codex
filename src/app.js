const D = JSON.parse(document.getElementById('data').textContent);
const IC = D.icons;
const ICONS = JSON.parse(document.getElementById('icons').textContent);
const gIcon = k => ICONS.game[k] ? `<svg class="gi" viewBox="0 0 ${ICONS.gameSize[0]} ${ICONS.gameSize[1]}" aria-hidden="true">${ICONS.game[k]}</svg>` : '';
const lIcon = n => (ICONS.lucide[n]||'').replace(/<!--.*?-->/s,'').replace('<svg','<svg aria-hidden="true"');
// Icon for any named thing (recipes, ingredients): keyword rules first, then the sheet category.
const NAME_ICON_RULES = [
  [/skill ?book|grimoire|tome/,'x-book'],[/scroll/,'x-scroll'],[/rune frame|rune/,'rune'],[/pixie dust|dust/,'x-sparkle'],
  [/arrowhead/,'x-arrowhead'],[/arrow/,'x-arrow'],[/grenade|bomb|flask of|nail flask|smoke/,'x-bomb'],
  [/poison|venom|toxic/,'x-poison'],[/heal|restor|regenerat/,'x-heal'],[/herbmix|herb|leaf|flower|root|thorn|drudanae|whisperwood|bloodwood|blossom|petal|fern/,'x-herbs'],
  [/potion|elixir|draught|tonic|concoction|brew/,'x-potion'],
  [/stew|soup|dinner|pie|meal|porridge|salad|sandwich/,'x-meal'],[/bread|loaf|flour|dough|bun/,'x-bread'],[/apple|pear|fruit|berr/,'x-apple'],[/grape/,'x-grapes'],
  [/mushroom|shroom/,'x-mushroom'],[/fish|eel|crab|clam|squid/,'x-fish'],[/meat|ham|steak|sausage|chicken|leg of|ribs|bacon/,'x-meat'],[/cheese/,'x-cheese'],
  [/egg/,'x-egg'],[/tomato/,'x-tomato'],[/potato/,'x-potato'],[/carrot/,'x-carrot'],[/pumpkin/,'x-pumpkin'],[/honey/,'x-honey'],[/salt|pepper|spice|sugar/,'x-salt'],
  [/wine|beer|ale|mead|rum|liquor|tea|coffee|milk|juice|drink/,'x-drink'],[/water|puddle/,'x-water'],[/oil|tar|grease/,'x-oil'],[/blood/,'x-blood'],
  [/essence|crystal|gem|pearl|amethyst|diamond|emerald|ruby|sapphire|tourmaline/,'x-essence'],[/source orb|orb|globe/,'x-orb'],[/soul|ghost|spirit/,'x-ghost'],
  [/face|mask/,'x-mask'],[/skull|head/,'x-skull'],[/bone/,'x-bone'],[/feather/,'x-feather'],[/claw/,'x-claw'],[/tooth|fang/,'x-tooth'],[/horn|shell/,'x-horn'],[/heart/,'x-heart'],
  [/eye/,'x-eye'],[/tentacle/,'x-tentacle'],[/slime|goo|ooze/,'x-slime'],[/web|silk|spider/,'x-web'],
  [/two-?hand|2h|greatsword|zweihander/,'sword2'],[/sword|blade|sabre|saber/,'sword'],[/axe/,'axe'],[/mace|club|hammer of/,'mace'],[/dagger|shiv|knife/,'dagger'],[/wand/,'wand'],[/spear|harpoon|pike|stick$/,'spear'],
  [/staff/,'staff'],[/crossbow/,'crossbow'],[/bow/,'bow'],[/shield|targe/,'shield'],[/helm|hat|cap|hood|crown/,'helmet'],[/armou?r|shirt|robe|breastplate|chest/,'chest'],
  [/glove|gauntlet/,'gloves'],[/boot|shoe|sandal/,'boots'],[/belt|girdle/,'belt'],[/trouser|pants|leggings/,'leggings'],[/ring/,'ring'],[/amulet|necklace|pendant/,'amulet'],
  [/ingot|\bbar\b|metal|iron|steel|plate|scale|nail|chain|wire/,'x-metal'],[/ore|nugget|clay/,'x-ore'],[/leather|hide|pelt|fur|skin/,'x-hide'],[/needle|thread|string/,'x-needle'],[/cloth|fabric|linen|wool|rag/,'x-cloth'],
  [/wood|branch|stick|plank|log|twig|staff of|pole/,'x-wood'],[/stone|rock|pebble|boulder|sand/,'x-stone'],[/ink|quill|pen/,'x-quill'],[/paper|parchment|book page|letter|note/,'x-paper'],[/map/,'x-map'],
  [/key/,'x-key'],[/lockpick/,'x-lockpick'],[/hammer|tongs|tool|kit|pan|pot|mortar|pestle|saw|chisel|shovel|knife/,'x-tool'],[/jar|bottle|vial|beaker|glass/,'x-jar'],[/coin|gold/,'x-coin'],
  [/fire|flame|ember|cinder/,'x-fire'],[/ice|frost|snow/,'x-ice'],[/lightning|thunder|spark/,'x-lightning'],
];
const CAT_ICON = {grimoire:'x-book',book:'x-book',skillbook:'x-book',scroll:'x-scroll',potions:'x-potion',arrows:'x-arrow',food:'x-meal',drink:'x-drink',weapons:'sword',weapon:'sword',grenades:'x-bomb',
  objects:'x-bag',quest:'x-paper',runes:'rune',armour:'chest',boost:'x-boost',mats:'x-ore',essence:'x-essence',junk:'x-bag',tool:'x-tool',equipment:'chest'};
function nameIcon(name, ...cats){
  const n = String(name||'').toLowerCase();
  for(const [rx,k] of NAME_ICON_RULES) if(rx.test(n) && ICONS.game[k]) return k;
  for(const c of cats){ const k = CAT_ICON[String(c||'').toLowerCase()]; if(k && ICONS.game[k]) return k; }
  return 'x-bag';
}
function itemIconKey(it){
  if(!it) return 'empty';
  if(it.kind==='weapon'){ const m = String(it.type||'').match(/^w:([^:]+):(\d)/); if(!m) return 'sword';
    const n = m[1].toLowerCase(), h = m[2]; if(['sword','axe','mace'].includes(n)) return h==='2' ? n+'2' : n; return ICONS.game[n] ? n : 'sword'; }
  return ICONS.game[it.kind] ? it.kind : 'empty';
}
const SCH = {Aerotheurge:'aero',Geomancer:'geo',Huntsman:'hunt',Hydrosophist:'hydro',Necromancer:'necro',Polymorph:'poly',Pyrokinetic:'pyro',Scoundrel:'scou',Summoning:'summ',Warfare:'war'};  // in-game order
const SCHOOLS = Object.keys(SCH);
const WEAPON_AB = ['Dual Wielding','Ranged','Single-Handed','Two-Handed'];
const DEF_AB = ['Leadership','Perseverance','Retribution'];
const CIVIL_AB = ['Bartering','Loremaster','Lucky Charm','Persuasion','Sneaking','Telekinesis','Thievery'];
const ALL_AB = [...SCHOOLS,...WEAPON_AB,...DEF_AB,...CIVIL_AB];
const ATTRS = ['Strength','Finesse','Intelligence','Constitution','Memory','Wits'];
const ALIASES = {aero:'Aerotheurge',geo:'Geomancer',hydro:'Hydrosophist',pyro:'Pyrokinetic',necro:'Necromancer',poly:'Polymorph',hunt:'Huntsman',scoundrel:'Scoundrel',summon:'Summoning',war:'Warfare',
  str:'Strength',fin:'Finesse',int:'Intelligence',con:'Constitution',mem:'Memory',wit:'Wits',wits:'Wits',dw:'Dual Wielding','1h':'Single-Handed','2h':'Two-Handed',
  'critical chance':'Crit Chance','crit':'Crit Chance','critical damage':'Crit Damage','crit dmg':'Crit Damage','critical multiplier':'Crit Damage','crit multiplier':'Crit Damage',vitality:'HP',lifesteal:'Life Steal'};
function handsOf(it){ return !it || it.kind!=='weapon' || !it.type || !/:(1|2)$/.test(it.type) ? null : +it.type.slice(-1); }  // the weapon type decides
const RESISTS = ['Fire Resistance','Water Resistance','Air Resistance','Earth Resistance','Poison Resistance','Physical Resistance','Piercing Resistance'];
const STAT_NAMES = [...RESISTS,'Vitality','Movement','Initiative','Crit Chance','Crit Damage','Accuracy','Dodging','Life Steal','Damage','Blocking','Reflect Melee','Cleave','Physical Armour','Magic Armour','Max AP','Starting AP','AP Recovery','Source Points'];
const RARITIES = ['Common','Uncommon','Rare','Epic','Legendary','Divine','Unique'];
const rcol = r => r ? `var(--r-${String(r).toLowerCase()})` : '';
const rarTag = r => r ? `<span class="rar" style="--rc:${rcol(r)}"><span class="rdot"></span>${esc(r)}</span>` : '';
const KINDS = {helmet:'Helmet',amulet:'Amulet',chest:'Chest',gloves:'Gloves',belt:'Belt',leggings:'Leggings',boots:'Boots',ring:'Ring',weapon:'Weapon',shield:'Shield',rune:'Rune'};
const SOCKETS = [['weapon','⚔️','In a weapon'],['armor','🛡','In armour'],['amulet','📿','In an amulet']];
// [slot id, label, item kinds that fit, Gear Stats columns for roll suggestions]
const SLOTS = [['helmet','Helmet',['helmet'],['Helmet']],['amulet','Amulet',['amulet'],['Amulet']],['chest','Chest',['chest'],['Chest Armour']],['gloves','Gloves',['gloves'],['Gloves']],
  ['belt','Belt',['belt'],['Belt']],['leggings','Leggings',['leggings'],['Leggings']],['boots','Boots',['boots'],['Boots']],['ring1','Ring',['ring'],['Ring']],['ring2','Ring',['ring'],['Ring']],
  ['main','Main hand',['weapon'],['1H Weapon (Str)','Dagger/Wand','2H Melee Str/Fin','2H Staff','Ranged Weapon']],['off','Off hand',['shield','weapon'],['Shield','1H Weapon (Str)','Dagger/Wand']]];
const KIND_COLS = {helmet:['Helmet'],amulet:['Amulet'],chest:['Chest Armour'],gloves:['Gloves'],belt:['Belt'],leggings:['Leggings'],boots:['Boots'],ring:['Ring'],weapon:['1H Weapon (Str)','Dagger/Wand','2H Melee Str/Fin','2H Staff','Ranged Weapon'],shield:['Shield']};
const MEMBERS = [{id:'sol',name:'Sol',ab:'Sol'},{id:'fane',name:'Fane',ab:'Fa'},{id:'sebille',name:'Sebille',ab:'Se'},{id:'beast',name:'Beast',ab:'Be'}];
const EMO = {ap:['⚡','Action points'], sp:['💠','Source points'], cd:['⏳','Cooldown (turns)'], mem:['🧠','Memory slots'], range:['🎯','Range (m)'], book:['📖','Skill book level'], dur:['⏱','Duration'], dmg:['⚔️','Damage'], lvl:['📈','Level']};
const em = (k, v) => `<span title="${EMO[k][1]}" aria-label="${EMO[k][1]} ${esc(v)}"><span aria-hidden="true">${EMO[k][0]}</span> <b>${esc(v)}</b></span>`;
const col = s => `var(--${SCH[s]||'line'})`;
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const img = h => h && IC[h] ? `<img class="ic" src="${IC[h]}" alt="" loading="lazy">` : `<div class="noic"></div>`;
const fmt = n => (Math.round(n*10)/10).toLocaleString();
const sgn = n => (n>0?'+':'')+fmt(n);
const clone = o => JSON.parse(JSON.stringify(o));
const slug = (p,s) => p+'-'+String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-');

// ---------- lookup tables for chips ----------
const SKILL_OBJ = Object.fromEntries([...D.summons,...D.special,...D.skills].map(s=>[s.name.toLowerCase(), s]));
const SKILL_BY_LC = Object.fromEntries(Object.values(SKILL_OBJ).map(s=>[s.name.toLowerCase(), s.name]));
const baseStatus = n => n.replace(/\s*\((aura|caster|no Status Effect)\)\s*/gi,'').trim();
const STATUS_OBJ = {}; for(const s of D.statuses){ const k = baseStatus(s.name).toLowerCase(); if(!STATUS_OBJ[k] && !/no status effect/i.test(s.name)) STATUS_OBJ[k] = s; }
const AB_ALL = [...ALL_AB, ...ATTRS];
const AB_LC = Object.fromEntries(AB_ALL.map(a=>[a.toLowerCase(), a]));
function linkRegex(){
  const names = [...new Set([...Object.keys(STATUS_OBJ), ...Object.keys(SKILL_OBJ), ...Object.keys(AB_LC)])].filter(n=>n.length>=3).sort((a,b)=>b.length-a.length);
  return new RegExp('(^|[^A-Za-z])(' + names.map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')(?![A-Za-z])','gi');
}
const LINK_RX = linkRegex();
function chipFor(name, prefer='status', extra=''){
  const lc = String(name).toLowerCase().trim();
  const order = prefer==='skill' ? ['skill','status','ab'] : prefer==='ab' ? ['ab','status','skill'] : ['status','skill','ab'];
  for(const t of order){
    if(t==='status' && STATUS_OBJ[lc]) return statusChip(STATUS_OBJ[lc], extra);
    if(t==='skill' && SKILL_OBJ[lc]) return skillChip(SKILL_OBJ[lc].name, extra);
    if(t==='ab' && AB_LC[lc]) return abChip(AB_LC[lc], '', extra);
  }
  return null;
}
// Escape text and turn every skill/status/ability name inside it into a chip.
function linkify(text, prefer='status'){
  if(text==null) return '';
  const s = String(text); let out='', last=0, m;
  LINK_RX.lastIndex = 0;
  while((m = LINK_RX.exec(s))){
    const start = m.index + m[1].length; const word = m[2];
    if(word[0] !== word[0].toUpperCase()) continue;              // only Capitalised mentions are names
    if(AB_LC[word.toLowerCase()] && prefer!=='ab' && !STATUS_OBJ[word.toLowerCase()] && !SKILL_OBJ[word.toLowerCase()]) continue;  // abilities only where asked
    const chip = chipFor(word, prefer, 'data-inline="1"');
    if(!chip) continue;
    out += esc(s.slice(last, start)) + chip; last = start + word.length;
  }
  return out + esc(s.slice(last));
}
function skillChip(name, extra=''){
  const sk = SKILL_OBJ[String(name).toLowerCase()];
  const c = sk ? col(sk.school) : 'var(--line)';
  const ic = sk && sk.icon && IC[sk.icon] ? `<img src="${IC[sk.icon]}" alt="">` : '';
  const inl = extra.includes('data-inline');
  return `<button class="skchip${inl?' lk':''}" style="--c:${c}" data-skill="${esc(sk?sk.name:name)}" ${extra}>${ic}<span>${esc(inl?name:(sk?sk.name:name))}</span></button>`;
}
function statusChip(st, extra=''){
  const ic = st.icon && IC[st.icon] ? `<img src="${IC[st.icon]}" alt="">` : '';
  const inl = extra.includes('data-inline');
  return `<button class="skchip st${inl?' lk':''}" data-status="${esc(st.name)}" ${extra}>${ic}<span>${esc(baseStatus(st.name))}</span></button>`;
}
function abChip(a, suffix='', extra=''){
  const inl = extra.includes('data-inline');
  return `<button class="skchip ab${inl?' lk':''}" style="--c:${SCH[a]?col(a):'var(--muted)'}" data-ab="${esc(a)}" ${extra}><span>${esc(a)}${suffix?` ${esc(suffix)}`:''}</span></button>`;
}
function bonusChipHtml(b){
  if(b.text){ const p = parseBonus(b.text); if(p && (p.status||p.immune||p.reflect)) b = p; }
  if(b.reflect){ const r=b.reflect; return `<span class="bchip refl" title="Reflects part of the damage you take back at the attacker">🪞 Reflect ${r.pct}%${r.from&&r.from!=='all'?' '+esc(r.from):''}${r.type?` as <span class="dmgt" style="--c:${DMG_COL[r.type]||'var(--ink)'}">${DMG_EMO[r.type]||''} ${esc(r.type)}</span>`:''}</span>`; }
  if(b.status){ const st = STATUS_OBJ[b.status.toLowerCase()]; return `<span class="bchip gst" title="Applied to the wearer">💫 ${st?statusChip(st,'data-inline="1"'):esc(b.status)}</span>`; }
  if(b.immune){ const st = STATUS_OBJ[b.immune.toLowerCase()]; return `<span class="bchip" title="Immunity">🚫 ${st?statusChip(st,'data-inline="1"'):esc(b.immune)}</span>`; }
  if(b.skill) return skillChip(b.skill);
  if(b.stat && AB_LC[b.stat.toLowerCase()]) return abChip(AB_LC[b.stat.toLowerCase()], `${sgn(b.value)}${b.pct?'%':''}`);
  if(b.stat){ const m = b.stat.match(/^(Set|Inflict)\s+(.+)$/i); if(m && STATUS_OBJ[m[2].toLowerCase()]) return `<span class="bchip">${esc(m[1])} ${statusChip(STATUS_OBJ[m[2].toLowerCase()],'data-inline="1"')} ${sgn(b.value)}${b.pct?'%':''}</span>`; return `<span class="bchip">${esc(b.stat)} ${sgn(b.value)}${b.pct?'%':''}</span>`; }
  return `<span class="bchip">${linkify(b.text)}</span>`;
}

// ---------- state ----------
const blank = m => ({name:m.name, level:0, points:{}, attributes:{}, gear:{}, talents:[], known:[], notes:'', schema:2});
let party = Object.fromEntries(MEMBERS.map(m=>[m.id,blank(m)]));
let ITEMS = {};
// Reference tables ship inside the page; on claude.ai the database's "ref" collection replaces them once it loads.
const REF_EMBEDDED = JSON.parse(document.getElementById('ref').textContent);
let REF = REF_EMBEDDED, refErr = null;
let partyLoaded = false, canWrite = false, db = null;
let state = {tab:'skills', q:'', schools:new Set(), craft:false, use:false, known:false, who:'sol', cats:new Set(), ing:'', refSec:'talents', kinds:new Set(),
  calc:{type:'w:Staff:2', level:8, rarity:'Common', name:'', bonuses:[], equip:''}, flash:''};
try{ const s = JSON.parse(localStorage.getItem('codex.ui')||'{}'); Object.assign(state, {tab:s.tab||state.tab, who:s.who||state.who, refSec:s.refSec||state.refSec, gearView:s.gearView||'view', partyView:s.partyView||'overview', sects:s.sects||{}}); if(s.calc) state.calc={...state.calc,...s.calc,bonuses:[],name:'',equip:''}; }catch(e){}
function remember(){ try{ localStorage.setItem('codex.ui', JSON.stringify({tab:state.tab, who:state.who, refSec:state.refSec, calc:{type:state.calc.type,level:state.calc.level,rarity:state.calc.rarity}, gearView:state.gearView, partyView:state.partyView, sects:state.sects})); }catch(e){} }

// ---------- party + item model ----------
function normalize(body, m){
  const b = clone(body||{});
  const p = {...blank(m), ...b};
  if(!b.schema && b.abilities && !b.points) p.points = b.abilities;   // v1 docs stored totals in `abilities`
  delete p.abilities;
  p.points = p.points||{}; p.attributes = p.attributes||{}; p.gear = p.gear||{}; p.talents = p.talents||[]; p.known = p.known||[];
  p.schema = 2;
  return p;
}
function canonStat(s){
  const t = s.trim().replace(/\s+/g,' '); const lc = t.toLowerCase();
  const res = lc.match(/^(fire|water|air|earth|poison|physical|piercing)\s*res(ist(ance)?)?$/); if(res) return res[1][0].toUpperCase()+res[1].slice(1)+' Resistance';
  return AB_LC[lc] || ALIASES[lc] || STAT_NAMES.find(x=>x.toLowerCase()===lc) || t;
}
function parseBonus(raw){
  const t = raw.trim(); if(!t) return null; let m;
  if((m = t.match(/^skill\s*:\s*(.+)$/i))) return {skill: SKILL_BY_LC[m[1].trim().toLowerCase()] || m[1].trim()};
  if((m = t.match(/^(?:status|applies|wearer)\s*:\s*(.+)$/i))) return {status: stName(m[1])};
  if((m = t.match(/^immun(?:e|ity)\s*(?:to)?\s*:?\s*(.+)$/i))) return {immune: stName(m[1])};
  if((m = t.match(/^reflect\s+(\d+(?:\.\d+)?)\s*%?\s*(?:of\s+)?(melee|ranged|all)?\s*(?:damage)?\s*(?:as\s+([a-z]+))?/i))) return {reflect:{pct:+m[1], from:(m[2]||'all').toLowerCase(), type: m[3] ? (DMG_TYPES.find(x=>x.toLowerCase()===m[3].toLowerCase())||m[3]) : null}};
  if((m = t.match(/^(.+?)\s*:?\s*([+-]?\d+(?:\.\d+)?)\s*(%)?$/))) return {stat: canonStat(m[1]), value: +m[2], pct: !!m[3]};
  if((m = t.match(/^([+-]?\d+(?:\.\d+)?)\s*(%)?\s+(.+)$/))) return {stat: canonStat(m[3]), value: +m[1], pct: !!m[2]};
  if(SKILL_BY_LC[t.toLowerCase()]) return {skill: SKILL_BY_LC[t.toLowerCase()]};
  return {text: t};
}
const stName = s => { const st = STATUS_OBJ[baseStatus(s.trim()).toLowerCase()]; return st ? baseStatus(st.name) : s.trim(); };
const reflectLabel = r => `Reflect ${r.pct}%${r.from&&r.from!=='all'?' '+r.from:''} damage${r.type?' as '+r.type:''}`;
const bonusLabel = b => b.reflect ? reflectLabel(b.reflect) : b.status ? `Status: ${b.status}` : b.immune ? `Immune to ${b.immune}` : b.skill ? `Skill: ${b.skill}` : b.stat ? `${b.stat} ${sgn(b.value)}${b.pct?'%':''}` : b.text;
function slotItem(member, slot){ const g = party[member].gear?.[slot]; if(!g) return null; if(g.itemId) return ITEMS[g.itemId] ? {...ITEMS[g.itemId], id:g.itemId} : null; return g.bonuses||g.name ? g : null; }
function whoWears(itemId){ for(const m of MEMBERS) for(const [slot,g] of Object.entries(party[m.id].gear||{})) if(g && g.itemId===itemId) return {member:m.id, slot}; return null; }
function totals(id){
  const gear = {}, other = {}, skills = [], statuses = [], immune = [], reflect = [];
  const twoH = handsOf(slotItem(id,'main'))===2;
  for(const [slot] of SLOTS){
    if(slot==='off' && twoH) continue;
    const it = slotItem(id, slot); if(!it) continue;
    for(let b of [...(it.bonuses||[]), ...runeBonuses(it)]){
      if(b.text){ const p = parseBonus(b.text); if(p && (p.status||p.immune||p.reflect)) b = p; }
      if(b.reflect){ reflect.push({...b.reflect, item:it.name||slot}); continue; }
      if(b.status){ statuses.push({status:b.status, item:it.name||slot}); continue; }
      if(b.immune){ immune.push({status:b.immune, item:it.name||slot}); continue; }
      if(b.skill) skills.push({skill:b.skill, item:it.name||slot});
      else if(b.stat){ const k = b.stat+(b.pct?' %':''); const bag = AB_ALL.includes(b.stat) ? gear : other; bag[k] = (bag[k]||0) + b.value; }
    }
  }
  const p = party[id];
  const ab = {}; for(const a of ALL_AB) ab[a] = (+p.points?.[a]||0) + (gear[a]||0);
  const at = {}; for(const a of ATTRS) at[a] = p.attributes?.[a]!=null && p.attributes[a]!=='' ? (+p.attributes[a]) + (gear[a]||0) : null;
  return {ab, at, gear, other, skills, statuses, immune, reflect};
}
let TOT = {}; function recalc(){ for(const m of MEMBERS) TOT[m.id] = totals(m.id); }
recalc();
function meets(member, sk){ const ab = TOT[member].ab; return sk.req.every(([s,l])=> (ab[s]||0) >= (Number(l)||0)); }
function isKnown(member, sk){ return (party[member]?.known||[]).includes(sk.name); }
function gearSkill(member, sk){ return TOT[member].skills.find(x=>x.skill.toLowerCase()===sk.name.toLowerCase()); }

// ---------- generic helpers ----------
function textOf(x){ const out=[]; (function walk(v,k){ if(k==='icon') return; if(v==null) return; if(typeof v==='object'){ for(const kk in v) walk(v[kk],kk); } else out.push(String(v)); })(x,''); return out.join(' ').toLowerCase(); }
function matches(text,q){ if(!q) return true; if(q.length>=3) return text.includes(q); return new RegExp('(^|[^a-z0-9])'+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(text); }
function notesHtml(n, labels={}){
  if(!n) return ''; const parts = Object.entries(n).filter(([k,v])=>v);
  if(!parts.length) return '';
  return `<details class="nt"><summary>Sheet notes</summary>${parts.map(([k,v])=>`<p>${labels[k]?`<b>${esc(labels[k])}:</b> `:''}${linkify(v)}</p>`).join('')}</details>`;
}
const refRows = k => REF && REF[k] ? (REF[k].rows || []) : [];
function needRef(){ return REF ? '' : `<div class="loading">${refErr ? esc(refErr) : 'Loading reference data from the database…'}</div>`; }
function infoSkill(name){ if(!REF) return null; if(!REF._skillMap) REF._skillMap = Object.fromEntries(refRows('skills').map(r=>[String(r.name).toLowerCase(), r])); return REF._skillMap[name.toLowerCase()]; }
function infoStatus(name){ if(!REF) return null; if(!REF._stMap) REF._stMap = Object.fromEntries(refRows('statuses').map(r=>[baseStatus(String(r.name)).toLowerCase(), r])); return REF._stMap[baseStatus(name).toLowerCase()]; }
function refAb(a){ if(!REF) return null; return refRows('abilities').find(r=>r.name===a) || refRows('attributes').find(r=>r.name===a); }

// ---------- tooltips ----------
function skillTip(sk){
  const inf = infoSkill(sk.name);
  const fx = (sk.effects||[]).map(f=>`<li>${linkify(f.e)}${f.dur&&f.dur!=='-'?` <span class="d">⏱ ${esc(f.dur)}</span>`:''}</li>`).join('');
  const req = (sk.req||[]).map(([s,l])=>`<span class="r" style="color:${col(s)};border-color:${col(s)}">${esc(s)} ${esc(l)}</span>`).join('');
  return `<div class="hd">${img(sk.icon)}<div><h3>${esc(sk.name)}</h3><span class="school" style="--c:${col(sk.school)}">${esc(sk.school||sk.group||'')}</span></div></div>
    <div class="stats">${em('ap',sk.ap)}${sk.sp&&sk.sp!=='-'?em('sp',sk.sp):''}${em('cd',sk.cd)}${sk.mem!=null?em('mem',sk.mem):''}${em('range',sk.range)}</div>
    ${sk.dmg&&sk.dmg!=='-'?`<div class="dmg">⚔️ ${esc(sk.dmg)}${sk.scale&&sk.scale!=='-'?` · scales with ${esc(sk.scale)}`:''}</div>`:''}
    ${inf&&inf.description?`<p>${esc(inf.description)}</p>`:''}
    ${fx?`<ul class="fx">${fx}</ul>`:''}
    ${req?`<div class="req">${req}${sk.weapon?`<span class="tag">Needs ${esc(sk.weapon)}</span>`:''}</div>`:''}
    <div class="note" style="margin-top:6px">Click to open</div>`;
}
function statusTip(st){
  const inf = infoStatus(st.name);
  const list = (h, arr) => arr && arr.length ? `<p><b>${h}:</b> ${arr.filter(x=>!x.startsWith('§')).slice(0,10).map(esc).join(', ')}${arr.length>10?'…':''}</p>` : '';
  return `<div class="hd">${img(st.icon)}<div><h3>${esc(baseStatus(st.name))}</h3><span class="school" style="--c:var(--accent)">Status effect</span></div></div>
    ${st.effects&&st.effects.length?`<ul class="fx">${st.effects.map(e=>`<li><span>${esc(e)}</span></li>`).join('')}</ul>`:''}
    ${inf&&inf.effect&&!(st.effects||[]).length?`<p>${esc(inf.effect)}</p>`:''}
    ${list('Removed by', st.treat)}${list('Resisted by', st.resist)}
    <div class="note" style="margin-top:6px">Click to open</div>`;
}
function abTip(a){
  const r = refAb(a);
  const who = MEMBERS.map(m=>`${m.name} <b>${ATTRS.includes(a) ? (TOT[m.id].at[a]??'—') : (TOT[m.id].ab[a]||0)}</b>`).join(' · ');
  return `<div class="hd"><div><h3 style="color:${SCH[a]?col(a):'inherit'}">${esc(a)}</h3><span class="school" style="--c:var(--muted)">${ATTRS.includes(a)?'Attribute':r&&r.type?esc(r.type)+' ability':'Ability'}</span></div></div>
    ${r&&r.effect?`<p>${esc(r.effect)}</p>`:''}${r&&r.notes?`<p class="note">${esc(r.notes)}</p>`:''}
    <p class="note">Party totals: ${who}</p>`;
}

// ---------- tabs ----------
const TAB_ICON = {skills:'sparkles',status:'activity',summons:'ghost',special:'swords',crafting:'hammer',items:'backpack',gear:'calculator',reference:'book-open',party:'users'};
const TABS = () => [['party','Party',4],['items','Items',Object.keys(ITEMS).length],['skills','Skills',D.skills.length],['status','Status effects',D.statuses.length],['summons','Summons',D.summons.length],['special','Weapon & racial',D.special.length],
  ['crafting','Crafting',REF?refRows('recipes').length:'…'],['gear','Gear calculator',''],['reference','Reference','']];
function renderTabs(){
  document.getElementById('tabs').innerHTML = TABS().map(([k,l,n])=>`<button role="tab" aria-selected="${state.tab===k}" data-tab="${k}" title="${esc(l)}" aria-label="${esc(l)}">${lIcon(TAB_ICON[k])}<span class="lbl">${l}</span>${n!==''?`<span class="count">${n}</span>`:''}</button>`).join('');
  const sk = state.tab==='skills';
  for(const id of ['t-craft','t-use','t-known','schools','legend']) document.getElementById(id).hidden = !sk;
  document.getElementById('q').hidden = ['party','gear'].includes(state.tab);
  document.getElementById('bar').hidden = state.tab==='party';
  document.getElementById('q').placeholder = state.tab==='crafting' ? 'Search recipes, effects, ingredients…' : state.tab==='reference' ? 'Search this section…' : state.tab==='items' ? 'Search items and bonuses…' : 'Search names, effects, statuses…';
  renderSub();
}
document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]'); if(!b) return; if(b.dataset.tab==='party' && state.tab==='party') state.partyView='overview'; state.tab=b.dataset.tab; document.getElementById('side').classList.remove('open'); remember(); render(); window.scrollTo({top:0});});
(function(){
  const side = document.getElementById('side'), btn = document.getElementById('sidetoggle');
  let collapsed = false; try{ collapsed = localStorage.getItem('codex.side')==='1'; }catch(e){}
  const narrow = () => window.matchMedia('(max-width:700px)').matches;
  const paint = () => { const shut = narrow() ? !side.classList.contains('open') : collapsed; side.classList.toggle('collapsed', !narrow() && collapsed);
    btn.innerHTML = lIcon(shut ? 'panel-left-open' : 'panel-left-close'); btn.title = btn.ariaLabel = shut ? 'Expand menu' : 'Collapse menu'; };
  btn.addEventListener('click', ()=>{ if(narrow()) side.classList.toggle('open'); else { collapsed = !collapsed; try{ localStorage.setItem('codex.side', collapsed?'1':'0'); }catch(e){} } paint(); });
  window.addEventListener('resize', paint); paint();
})();
document.getElementById('schools').innerHTML = SCHOOLS.map(s=>`<button class="chip" style="--c:${col(s)}" aria-pressed="false" data-s="${s}">${s}</button>`).join('');
document.getElementById('schools').addEventListener('click',e=>{const b=e.target.closest('[data-s]'); if(!b) return; const s=b.dataset.s; state.schools.has(s)?state.schools.delete(s):state.schools.add(s); b.setAttribute('aria-pressed',state.schools.has(s)); render();});
document.getElementById('q').addEventListener('input',e=>{state.q=e.target.value.trim().toLowerCase(); renderView();});
for(const k of ['craft','use','known']) document.getElementById('f-'+k).addEventListener('change',e=>{state[k]=e.target.checked; render();});

const REF_SECTIONS = [
  ['talents','Talents'],['abilities','Abilities'],['attributes','Attributes'],['stats','Other stats'],['raceTraits','Race traits'],['classes','Classes'],
  ['surfaces','Surfaces & clouds'],['runes','Runes'],['combos','Combo matrix'],['infoStatuses','Statuses (Info)'],['ingredients','Ingredients'],
  ['values','Crafted item values'],['talentPoints','Talent points'],['bugs','Known bugs'],['tabs','About the sheet']];
function renderSub(){
  const el = document.getElementById('subchips'); let html = '';
  if(state.tab==='crafting' && REF){
    const cats = [...new Set(refRows('recipes').map(r=>r.category).filter(Boolean))].sort();
    html = cats.map(c=>`<button class="chip" aria-pressed="${state.cats.has(c)}" data-cat="${esc(c)}">${esc(c)}</button>`).join('') +
      (state.ing ? `<button class="chip" aria-pressed="true" data-ingclear="1" title="Clear ingredient filter">Uses: ${esc(state.ing)} ×</button>` : '');
  } else if(state.tab==='reference'){
    html = REF_SECTIONS.map(([k,l])=>`<button class="chip" aria-pressed="${state.refSec===k}" data-ref="${k}">${l}</button>`).join('');
  } else if(state.tab==='items'){
    html = Object.entries(KINDS).map(([k,l])=>`<button class="chip" aria-pressed="${state.kinds.has(k)}" data-kind="${k}">${l}</button>`).join('');
  }
  el.innerHTML = html; el.hidden = !html;
}
document.getElementById('subchips').addEventListener('click',e=>{
  const c=e.target.closest('[data-cat]'), r=e.target.closest('[data-ref]'), x=e.target.closest('[data-ingclear]'), k=e.target.closest('[data-kind]');
  if(c){ const v=c.dataset.cat; state.cats.has(v)?state.cats.delete(v):state.cats.add(v); }
  else if(r){ state.refSec=r.dataset.ref; remember(); }
  else if(x){ state.ing=''; }
  else if(k){ const v=k.dataset.kind; state.kinds.has(v)?state.kinds.delete(v):state.kinds.add(v); }
  else return;
  render();
});

// ---------- skills ----------
function skillText(sk){ return [sk.name,sk.school,sk.dmg,sk.scale,...sk.effects.map(f=>f.e),...sk.req.map(r=>r[0])].join(' ').toLowerCase(); }
const TGT = {S:'self',A:'allies',E:'enemies'};
function renderSkill(sk){
  const c = col(sk.school);
  const fx = sk.effects.map(f=>{
    const dur = f.dur && f.dur!=='-' ? `${f.chain?'then ':''}⏱ ${f.dur} turn${f.dur==='1'?'':'s'}` : (f.chain?'then':'');
    const res = f.res && f.res!=='-' ? `🛡 ${f.res.replace('Physic. Arm.','phys. armour').replace('Magic Arm.','magic armour')}` : '';
    const tg = f.t ? '🎯 '+f.t.split('').map(x=>TGT[x]).join(', ') : '';
    return `<li><span>${linkify(f.e)}</span><span class="d">${[dur,res,tg].filter(Boolean).map(esc).join(' · ')}</span></li>`;
  }).join('');
  const dmg = sk.dmg && sk.dmg!=='-' ? `<div class="dmg">⚔️ ${esc(sk.dmg)}${sk.block&&sk.block!=='-'?` · 🛡 ${esc(sk.block)}`:''}${sk.scale&&sk.scale!=='-'?` · scales with ${linkify(sk.scale,'ab')}`:''}</div>` : '';
  const req = sk.req.map(([s,l])=>`<span class="r" style="color:${col(s)};border-color:${col(s)}">${esc(s)} ${esc(l)}</span>`).join('');
  const chips = MEMBERS.map(m=>{
    const k=isKnown(m.id,sk), g=gearSkill(m.id,sk), ok=meets(m.id,sk);
    const st = k?'knows it':g?`granted by ${g.item}`:ok?'meets requirements':'requirements not met';
    const title = `${m.name}: ${st}${canWrite?' (click to mark '+(k?'unknown':'known')+')':''}`;
    return `<button class="pc ${k?'known':g?'gear':ok?'ok':''}" data-m="${m.id}" data-k="${esc(sk.name)}" title="${esc(title)}" aria-label="${esc(title)}" ${canWrite?'':'disabled'}>${m.ab}</button>`;
  }).join('');
  const inf = infoSkill(sk.name);
  const infHtml = inf ? `<details class="nt"><summary>Info sheet</summary>
      ${inf.description?`<p>${linkify(inf.description)}</p>`:''}
      ${inf.numbers!=null&&inf.numbers!=='-'?`<p><b>${esc(inf.numType||'Numbers')}:</b> ${esc(inf.numbers)}${inf.scaling&&inf.scaling!=='-'?` (scales with ${esc(inf.scaling)})`:''}</p>`:''}
      ${inf.weaponReq?`<p><b>Weapon:</b> ${esc(inf.weaponReq)}</p>`:''}
      ${inf.statusRef?`<p>${linkify(inf.statusRef)}</p>`:''}
      ${inf._notes?Object.values(inf._notes).map(v=>`<p>${linkify(v)}</p>`).join(''):''}</details>` : '';
  return `<article class="entry" id="${slug('sk',sk.name)}" style="--c:${c}">${img(sk.icon)}<div style="min-width:0">
    <div class="hd"><h3>${esc(sk.name)}</h3><span class="school">${esc(sk.school)}</span>${sk.craft?'<span class="tag craft">Combo</span>':''}${sk.sp&&sk.sp!=='-'?'<span class="tag">Source</span>':''}</div>
    <div class="stats">${em('ap',sk.ap)}${sk.sp&&sk.sp!=='-'?em('sp',sk.sp):''}${em('cd',sk.cd)}${em('mem',sk.mem)}${em('range',sk.range)}${em('book',sk.book)}</div>
    ${dmg}${fx?`<ul class="fx">${fx}</ul>`:''}
    <div class="req">${req}${sk.weapon?`<span class="tag">Needs ${esc(sk.weapon)}</span>`:''}<span class="party">${chips}</span></div>
    ${infHtml}
  </div></article>`;
}
function renderSkills(){
  let list = D.skills.filter(sk=>{
    if(state.schools.size && !sk.req.some(r=>state.schools.has(r[0]))) return false;
    if(state.craft && !sk.craft) return false;
    if(state.use && !MEMBERS.some(m=>meets(m.id,sk)||gearSkill(m.id,sk))) return false;
    if(state.known && !MEMBERS.some(m=>isKnown(m.id,sk)||gearSkill(m.id,sk))) return false;
    if(state.q && !matches(skillText(sk),state.q)) return false;
    return true;
  });
  list.sort((a,b)=>SCHOOLS.indexOf(a.school)-SCHOOLS.indexOf(b.school)||(+a.book||0)-(+b.book||0)||a.name.localeCompare(b.name));
  setLine(`${list.length} of ${D.skills.length} skills${partyLoaded?'':' · party not loaded yet'}`);
  return list.length ? `<div class="list">${list.map(renderSkill).join('')}</div>` : `<div class="empty">No skills match these filters.</div>`;
}

// ---------- statuses ----------
// list entries can be "A → B" (A turns into B); chip each side
const arrowList = (arr, prefer) => `<ul>${arr.map(x=>`<li>${x.split('→').map(p=>{ const t=p.trim(); return chipFor(t,prefer) || linkify(t,prefer); }).join(' → ')}</li>`).join('')}</ul>`;
function renderStatus(){
  const q=state.q;
  const list = D.statuses.filter(s=>matches(textOf(s),q));
  setLine(`${list.length} of ${D.statuses.length} status effects`);
  const group = arr => { let out='', buf=[]; const flush=()=>{ if(buf.length){ out+=arrowList(buf,'status'); buf=[]; } };
    for(const t of arr){ if(t.startsWith('§')){ flush(); out+=`<h4>${esc(t.slice(1))}</h4>`; } else buf.push(t); } flush(); return out; };
  return list.length ? `<div class="list">${list.map(s=>{
    const causes = Object.entries(s.causes).filter(([k,v])=>v.length).map(([k,v])=>`<h4>${esc(k)}</h4>${arrowList(v, /skill/i.test(k)?'skill':'status')}`).join('');
    return `<article class="entry" id="${slug('st',s.name)}" style="--c:var(--accent)">${img(s.icon)}<div style="min-width:0">
      <div class="hd"><h3>${esc(s.name)}</h3></div>
      ${s.effects.length?`<ul class="fx">${s.effects.map(e=>`<li><span>${linkify(e)}</span></li>`).join('')}</ul>`:''}
      <div class="cols">
        ${causes?`<div>${causes}</div>`:''}
        ${s.resist.length?`<div><h4>Resisted by (${esc(s.resistHead)})</h4>${arrowList(s.resist,'status')}</div>`:''}
        ${s.immune.length?`<div><h4>Immunity from (${esc(s.immuneHead)})</h4>${arrowList(s.immune,'status')}</div>`:''}
        ${s.treat.length?`<div><h4>Removed by (${esc(s.treatHead)})</h4>${group(s.treat)}</div>`:''}
      </div></div></article>`;}).join('')}</div>` : `<div class="empty">No status effects match “${esc(q)}”.</div>`;
}

function renderSimple(arr,label){
  const q=state.q;
  const list = arr.filter(x=>matches(textOf(x),q));
  setLine(`${list.length} of ${arr.length} ${label}`);
  let out='', g=null;
  for(const x of list){
    if(x.group!==g){ g=x.group; out+=`<h2 style="font:700 1.1rem var(--display);margin:18px 0 0">${esc(g)}</h2>`; }
    out+=`<article class="entry" id="${slug('sk',x.name)}" style="--c:var(--accent);margin-top:8px">${img(x.icon)}<div style="min-width:0">
      <div class="hd"><h3>${esc(x.name)}</h3></div>
      <div class="stats">${em('ap',x.ap)}${x.sp&&x.sp!=='-'?em('sp',x.sp):''}${em('cd',x.cd)}${em('range',x.range)}</div>
      ${x.dmg&&x.dmg!=='-'?`<div class="dmg">⚔️ ${esc(x.dmg)}${x.block&&x.block!=='-'?` · 🛡 ${esc(x.block)}`:''}${x.scale&&x.scale!=='-'?` · scales with ${linkify(x.scale,'ab')}`:''}</div>`:''}
      ${x.effect&&x.effect!=='-'?`<ul class="fx"><li><span>${linkify(x.effect)}</span>${x.dur&&x.dur!=='-'?`<span class="d">⏱ ${esc(x.dur)} turns</span>`:''}</li></ul>`:''}
      ${x.extra?`<div class="req"><span class="tag">Needs ${esc(x.extra)}</span></div>`:''}
    </div></article>`;
  }
  return out || `<div class="empty">Nothing matches “${esc(q)}”.</div>`;
}

// ---------- crafting ----------
let ING_CAT = {};
function renderCrafting(){
  if(!REF) return needRef();
  if(!REF._ingCat) REF._ingCat = Object.fromEntries(refRows('ingredients').map(r=>[String(r.name).toLowerCase(), r.category])); ING_CAT = REF._ingCat;
  const all = refRows('recipes');
  const ingLc = state.ing.toLowerCase();
  const list = all.filter(r=>{
    if(state.cats.size && !state.cats.has(r.category)) return false;
    if(ingLc && !(r.ingredients||[]).some(i=>String(i.name).toLowerCase()===ingLc)) return false;
    return matches(textOf(r), state.q);
  });
  const shown = list.slice(0,250);
  setLine(`${list.length} of ${all.length} recipes${list.length>shown.length?` · showing the first ${shown.length}, search to narrow`:''} · click an ingredient to see everything it's used in`);
  if(!list.length) return `<div class="empty">No recipes match.</div>`;
  return `<div class="rows">${shown.map(r=>{
    const ings = (r.ingredients||[]).map(i=>`<button class="ingb" data-ing="${esc(i.name)}" title="${esc(i.mode==='Transform'?'Transformed into the result (not just used up)':'Used up')}"><span class="iicon">${gIcon(nameIcon(i.name, ING_CAT[String(i.name).toLowerCase()]))}</span>${esc(i.name)}${i.mode==='Transform'?' <small>transforms</small>':''}</button>`).join('<span>+</span>');
    const tags = [r.category, r.subcat && r.subcat!==r.category ? r.subcat : null, r.station ? `at ${r.station}` : null].filter(Boolean);
    const resChip = r.category==='Grimoire' ? (chipFor(String(r.result).replace(/\s+(Skillbook|Scroll)$/i,''),'skill')||'') : '';
    return `<article class="rrow" style="--c:var(--accent)"><div class="hd"><span class="ricon">${gIcon(nameIcon(r.result, r.subcat, r.category))}</span><h3>${esc(r.result)}${r.amount&&r.amount>1?` ×${esc(r.amount)}`:''}</h3>${resChip}${r.result2?`<span class="tag">+ ${esc(r.result2)}${r.amount2>1?` ×${esc(r.amount2)}`:''}</span>`:''}${tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${r.effect?`<div class="dmg">${linkify(r.effect)}</div>`:''}
      <div class="ing">${ings}</div>
      ${notesHtml(r._notes,{result:'Result',effect:'Effect',result2:'Second result',ing1:'Ingredient 1',ing2:'Ingredient 2',ing3:'Ingredient 3',ing4:'Ingredient 4',ing5:'Ingredient 5'})}</article>`;
  }).join('')}</div>`;
}

// ---------- gear calculator ----------
function calcTypes(){
  const t = [];
  for(const w of refRows('weapons')) t.push({key:`w:${w.name}:${w.hands}`, label:`${w.name} (${w.hands}H)`, kind:'weapon', itemKind:'weapon', row:w, group:'Weapons'});
  for(const a of refRows('armor')){
    const ik = {Helmet:'helmet',Chest:'chest',Gloves:'gloves',Leggings:'leggings',Boots:'boots',Belt:'belt',Ring:'ring',Amulet:'amulet','Off-Hand':'shield'}[a.slot];
    t.push({key:`a:${a.material}:${a.slot}`, label: a.material===a.slot ? a.slot : `${a.material} ${a.slot}`, kind:'armor', itemKind:ik, row:a, group: ['Belt','Ring','Amulet'].includes(a.slot)?'Accessories':a.slot==='Off-Hand'?'Shield':'Armour'});
  }
  return t;
}
function interp(points, L){
  const pts = points.filter(([l,v])=>typeof v==='number');
  if(!pts.length) return null;
  if(L<=pts[0][0]) return pts[0][1];
  for(let i=0;i<pts.length-1;i++){
    const [l1,v1]=pts[i],[l2,v2]=pts[i+1];
    if(L===l1) return v1; if(L===l2) return v2;
    if(L>l1 && L<l2){ const f=(L-l1)/(l2-l1); return v1>0&&v2>0 ? v1*Math.pow(v2/v1,f) : v1+(v2-v1)*f; }
  }
  return pts[pts.length-1][1];
}
function rollColumn(t){
  if(t.kind==='armor'){ return {Helmet:'Helmet',Chest:'Chest Armour',Gloves:'Gloves',Leggings:'Leggings',Boots:'Boots',Belt:'Belt',Ring:'Ring',Amulet:'Amulet','Off-Hand':'Shield'}[t.row.slot]; }
  const w=t.row; if(w.name==='Staff') return '2H Staff'; if(['Bow','Crossbow'].includes(w.name)) return 'Ranged Weapon';
  if(['Dagger','Wand'].includes(w.name)) return 'Dagger/Wand'; return w.hands===2 ? '2H Melee Str/Fin' : '1H Weapon (Str)';
}
function rarityRow(t){
  const rows = refRows('rarity');
  const name = t.kind==='weapon' ? (t.row.hands===2&&['Sword','Axe','Mace'].includes(t.row.name)?'2H '+t.row.name:t.row.name) : ({'Off-Hand':'Shield'}[t.row.slot]||t.row.slot);
  return rows.find(r=>r.type===name);
}
function calcBase(t, L, rk){
  const rr = rarityRow(t);
  const mult = rk==='Common' ? 1 : (rr && rr['x'+rk]) || null;
  if(t.kind==='weapon'){ const w=t.row; const v = interp([[1,w.d1],[5,w.d5],[10,w.d10],[15,w.d15],[20,w.d20],[22,w.d22]], L); return {mult, damage: v!=null ? Math.round(v*(mult||1)*10)/10 : null}; }
  const a=t.row; const ph = interp([[1,a.p1],[10,a.p10],[20,a.p20]], L), mg = interp([[1,a.m1],[10,a.m10],[20,a.m20]], L);
  return {mult, phys: ph!=null?Math.round(ph*(mult||1)):null, magic: mg!=null?Math.round(mg*(mult||1)):null};
}
function rollChip(r){
  if(r.kind==='skill') return skillChip(r.stat);
  if(r.kind==='set'||r.kind==='inflict'){ const s = r.stat.replace(/^(Set|Inflict)\s+/,''); const st = STATUS_OBJ[s.toLowerCase()]; return st ? `<span class="rl">${r.kind==='set'?'Set':'Inflict'} ${statusChip(st,'data-inline="1"')}${r.min!=null?` ${r.min}${r.max!==r.min?'–'+r.max:''}${r.pct?'%':''}`:''}</span>` : `<span class="rl">${esc(r.text)}</span>`; }
  if(r.kind==='stat' && AB_LC[r.stat.toLowerCase()]) return abChip(AB_LC[r.stat.toLowerCase()], `${r.min}${r.max!==r.min?'–'+r.max:''}`);
  return `<span class="rl">${esc(r.text)}</span>`;
}
function renderGearCalc(){
  if(!REF) return needRef();
  const types = calcTypes(); let t = types.find(x=>x.key===state.calc.type) || types[0];
  const L = Math.max(1, Math.min(22, +state.calc.level||1));
  const rk = state.calc.rarity;
  const base = calcBase(t, L, rk), mult = base.mult;
  let big = '';
  if(t.kind==='weapon'){
    const w=t.row;
    big = `<div><b>${base.damage!=null?fmt(base.damage):'—'}</b><span>⚔️ avg base damage${mult&&mult!==1?` (×${mult} for ${rk})`:''}</span></div>
      <div><b style="font-size:1rem">${linkify(w.attribute,'ab')}</b><span>scales with</span></div><div><b>${esc(w.range)}m</b><span>🎯 range</span></div>`;
  } else {
    const a=t.row;
    big = `<div><b>${base.phys!=null?fmt(base.phys):'—'}</b><span>🛡 physical armour</span></div><div><b>${base.magic!=null?fmt(base.magic):'—'}</b><span>✨ magic armour</span></div>
      ${a.attribute&&a.attribute!=='-'&&AB_LC[String(a.attribute).toLowerCase()]?`<div>${abChip(a.attribute)}<span>requirement attribute</span></div>`:''}`;
  }
  const exact = t.kind==='weapon' ? [1,5,10,15,20,22].includes(L) : [1,10,20].includes(L);
  const column = rollColumn(t);
  const rolls = refRows('gearRolls').filter(r=>r.slot===column);
  const groups = {'Abilities & attributes':[], 'Combat stats':[], 'Skills granted':[], 'On-hit statuses':[], 'Other':[]};
  for(const r of rolls){
    const g = r.kind==='skill' ? 'Skills granted' : (r.kind==='set'||r.kind==='inflict') ? 'On-hit statuses' : r.kind==='stat' && AB_ALL.includes(r.stat) ? 'Abilities & attributes' : r.kind==='stat' ? 'Combat stats' : 'Other';
    groups[g].push(`<li>${rollChip(r)}${r._notes?` <small title="${esc(r._notes.text)}">ⓘ</small>`:''}</li>`);
  }
  setLine(`Estimates from the Info sheet${exact?'':' · this level is between the sheet\'s sample levels, so the number is interpolated'}`);
  const opt = (g)=>types.filter(x=>x.group===g).map(x=>`<option value="${esc(x.key)}" ${x.key===t.key?'selected':''}>${esc(x.label)}</option>`).join('');
  const sheetNotes = REF.rarity?.sheetNotes ? Object.values(REF.rarity.sheetNotes).filter((v,i,a)=>a.indexOf(v)===i) : [];
  const fitSlots = SLOTS.filter(s=>s[2].includes(t.itemKind));
  const C = state.calc;
  return `<div class="calc">
    <div class="card"><div class="ctl">
      <label>Item type<select data-calc="type"><optgroup label="Weapons">${opt('Weapons')}</optgroup><optgroup label="Armour">${opt('Armour')}</optgroup><optgroup label="Shield">${opt('Shield')}</optgroup><optgroup label="Accessories">${opt('Accessories')}</optgroup></select></label>
      <label>Level<input type="number" min="1" max="22" value="${L}" data-calc="level" style="width:5em"></label>
      <label>Rarity<select class="rarsel" data-rar="${esc(rk)}" style="--rc:${rcol(rk)}" data-calc="rarity">${RARITIES.slice(0,6).map(r=>`<option style="color:${rcol(r)}" ${r===rk?'selected':''}>${r}</option>`).join('')}</select></label>
    </div>
    <div class="big">${big}</div>
    ${rk!=='Common'&&!mult?`<p class="note">No ${esc(rk)} multiplier in the sheet for this item type.</p>`:''}
    <p class="note">Base values for a ${esc(t.label)} before bonuses${t.kind==='weapon'?' (weapon damage is the average of the roll range)':''}. The sheet's samples are levels ${t.kind==='weapon'?'1, 5, 10, 15, 20, 22':'1, 10, 20'}; other levels are interpolated, and rarity multipliers come from level-20 items.</p>
    ${notesHtml(t.row._notes)}
    </div>
    ${canWrite&&db?`<div class="card"><h3>Save as an item</h3>
      <div class="ctl"><label style="flex:1 1 220px">Name<input type="text" value="${esc(C.name)}" placeholder="e.g. Magical Dwarven Staff" data-calcf="name"></label>
        <label>Equip on<select data-calcf="equip"><option value="">Don't equip</option>${MEMBERS.flatMap(m=>fitSlots.map(s=>`<option value="${m.id}:${s[0]}" ${C.equip===m.id+':'+s[0]?'selected':''}>${esc(party[m.id].name)} · ${s[1]}${slotItem(m.id,s[0])?' (replace)':''}</option>`)).join('')}</select></label></div>
      <div class="bon">${C.bonuses.map((b,i)=>`<span class="bwrap">${bonusChipHtml(b)}<button class="x" data-cbrm="${i}" aria-label="Remove ${esc(bonusLabel(b))}">×</button></span>`).join('')}</div>
      <div class="addrow"><input type="text" list="dl-calc" placeholder="Add bonus from the tooltip, e.g. Pyrokinetic +1, then Enter" data-cadd="1" aria-label="Add a bonus"><button class="btn" data-calcsave="1">Save item</button></div>
      <datalist id="dl-calc">${suggestOpts(KIND_COLS[t.itemKind]||[])}</datalist>
      ${state.flash?`<p class="note" style="color:var(--known)">${esc(state.flash)}</p>`:''}
    </div>`:''}
    <div class="card"><h3>What a ${esc(column)} can roll</h3>
      <div class="rolls">${Object.entries(groups).filter(([g,v])=>v.length).map(([g,v])=>`<div><h4>${g}</h4><ul class="chipul">${v.join('')}</ul></div>`).join('')}</div>
      <p class="note">Ranges from the sheet's Gear Stats tab. Higher rarities roll more of these at once; ranges grow with level.</p></div>
    <div class="card"><h3>Weapon damage by level</h3><div class="scroll"><table class="wide"><thead><tr><th>Weapon</th><th>Lvl 1</th><th>5</th><th>10</th><th>15</th><th>20</th><th>22</th></tr></thead><tbody>
      ${refRows('weapons').map(w=>`<tr><td>${esc(w.hands===2&&['Sword','Axe','Mace'].includes(w.name)?'2H '+w.name:w.name)}</td>${['d1','d5','d10','d15','d20','d22'].map(k=>`<td>${esc(w[k])}</td>`).join('')}</tr>`).join('')}
      ${refRows('weaponCompare').map(w=>`<tr><td title="${esc(w.notes||'')}"><i>${esc(w.name)}</i></td>${['d1','d5','d10','d15','d20','d22'].map(k=>`<td>${w[k]!=null?fmt(w[k]):''}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div><p class="note">Italic rows are the sheet author's comparisons (hover for their notes).</p></div>
    ${sheetNotes.length?`<div class="card"><h3>About rarity multipliers</h3>${sheetNotes.map(n=>`<p class="note" style="white-space:pre-line">${esc(n)}</p>`).join('')}</div>`:''}
  </div>`;
}

// ---------- reference ----------
const REF_FIELDS = {
  talents:[['description','Effect'],['requirements','Needs']],
  abilities:[['type','Type'],['effect','Passive'],['notes','Notes']],
  attributes:[['effect','Per point over 10'],['notes','Notes']],
  stats:[['effect','What it does'],['notes','Notes']],
  raceTraits:[['race','Race'],['description','Effect']],
  classes:[['ability1','Ability'],['ability2','Ability'],['civil','Civil'],['talent','Talent'],['skill1','Skill'],['skill2','Skill'],['skill3','Skill'],['weapons','Weapons'],['shield','Shield'],['extraItems','Extra']],
  surfaces:[['kind','Type'],['description','Effect'],['duration','Turns'],['resist','Resisted by'],['interactions','Interactions'],['vaporizeSpike','Vaporize / spike']],
  infoStatuses:[['resist','Resisted by'],['effect','Effect']],
  ingredients:[['value','Base value'],['category','Category'],['notes','Notes']],
  talentPoints:[['total','Talent points so far']],
  bugs:[['conditions','Conditions'],['steps','Steps'],['notes','Notes']],
  tabs:[['description','Contents'],['status','DE status']],
};
const CHIP_FIELDS = {ability1:'ab',ability2:'ab',civil:'ab',skill1:'skill',skill2:'skill',skill3:'skill'};
const TITLE = {raceTraits:r=>r.trait, talentPoints:r=>`Level ${r.level}`, bugs:r=>r.bug, tabs:r=>r.tab, classes:r=>r.name};
const KIND = {S:'Surface',C:'Cloud'}; const RES = {P:'physical armour',M:'magic armour'};
function renderReference(){
  if(!REF) return needRef();
  const sec = state.refSec, q = state.q;
  if(sec==='runes'){
    const R = REF.runes?.data||{};
    const cell = v => AB_LC[String(v||'').toLowerCase()] ? abChip(AB_LC[String(v).toLowerCase()]) : esc(v);
    const tbl = (rows,hasArm)=>`<div class="scroll"><table class="wide"><thead><tr><th>Rune</th><th>Weapon</th>${hasArm?'<th>Armour</th><th>Amulet</th>':''}</tr></thead><tbody>${rows.filter(r=>matches(textOf(r),q)).map(r=>`<tr><td>${esc(r.rune)}</td><td>${cell(r.weapon)}</td>${hasArm?`<td>${cell(r.armor)}</td><td>${cell(r.amulet)}</td>`:''}</tr>`).join('')}</tbody></table></div>`;
    setLine('Runes (Info sheet)');
    return `<div class="calc"><div class="card"><h3>What each rune boosts</h3>${tbl(R.boosts||[],true)}</div>
      <div class="card"><h3>Rune strength by size</h3><div class="scroll"><table class="wide"><thead><tr><th>Size</th><th>Weapon</th><th>Armour</th><th>Amulet</th></tr></thead><tbody>${(R.sizes||[]).map(s=>`<tr><td>${esc(s.size)}</td><td>${esc(s.weapon)}</td><td>${esc(s.armor)}</td><td>${esc(s.amulet)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><h3>Mythic runes (ability bonuses)</h3>${tbl(R.mythic||[],true)}</div>
      <div class="card"><h3>Power runes</h3>${tbl(R.power||[],false)}</div>
      ${R.sourceOrb?`<div class="card"><h3>Source Orb in a socket</h3><p>Weapon: ${linkify(R.sourceOrb.weapon,'skill')} · Armour: ${linkify(R.sourceOrb.armor,'skill')} · Amulet: ${linkify(R.sourceOrb.amulet,'skill')}</p></div>`:''}</div>`;
  }
  if(sec==='combos'){
    const rows = refRows('combos'); const els=['Aerotheurge','Geomancer','Hydrosophist','Pyrokinetic']; const others=[...new Set(rows.map(r=>r.other))];
    setLine('Combo skills: one elemental book + one non-elemental book (1 point in each school to craft)');
    return `<div class="card" style="margin-top:14px"><div class="scroll"><table class="wide"><thead><tr><th></th>${els.map(e=>`<th>${abChip(e)}</th>`).join('')}</tr></thead><tbody>
      ${others.map(o=>`<tr><td>${abChip(o)}</td>${els.map(e=>{const r=rows.find(x=>x.other===o&&x.element===e); return `<td style="text-align:left">${r?(chipFor(r.skill,'skill')||esc(r.skill)):''}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  }
  if(sec==='values'){
    const rows = refRows('values').filter(r=>matches(textOf(r),q)); const L=[...Array(20)].map((_,i)=>String(i+1));
    setLine('Gold value of crafted gear by level (blank = not recorded)');
    return `<div class="card" style="margin-top:14px"><div class="scroll"><table class="wide"><thead><tr><th>Item</th>${L.map(l=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.item)}</td>${L.map(l=>`<td>${r.byLevel[l]!=null?esc(r.byLevel[l]):''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  }
  const key = sec==='infoStatuses' ? 'statuses' : sec;
  const fields = REF_FIELDS[sec] || [];
  const all = refRows(key); const list = all.filter(r=>matches(textOf(r),q));
  setLine(`${list.length} of ${all.length} · ${REF_SECTIONS.find(s=>s[0]===sec)[1]}`);
  if(!list.length) return `<div class="empty">Nothing matches.</div>`;
  const labels = Object.fromEntries(fields);
  return `<div class="rows">${list.map(r=>{
    let title = esc((TITLE[sec]||(x=>x.name))(r));
    if(sec==='abilities'||sec==='attributes') title = abChip(r.name); else if(sec==='ingredients') title = `<span class="ricon">${gIcon(nameIcon(r.name, r.category))}</span>${title}`; else if(sec==='infoStatuses') title = chipFor(baseStatus(String(r.name)),'status') || title;
    const kv = fields.map(([k,l])=>{ let v=r[k]; if(v==null||v==='-'||v==='') return ''; if(sec==='surfaces'&&k==='kind') v=KIND[v]||v; if(k==='resist') v=RES[v]||v;
      const html = CHIP_FIELDS[k] && sec==='classes' ? (chipFor(String(v), CHIP_FIELDS[k]) || esc(v)) : ['effect','description','notes','interactions','requirements','steps','conditions','vaporizeSpike'].includes(k) ? linkify(v) : esc(v);
      return `<dt>${esc(l)}</dt><dd>${html}</dd>`; }).join('');
    const extra = sec==='classes' ? `<dt>Attributes</dt><dd>${['str','fin','int','con','wit'].filter(k=>r[k]).map(k=>`${k.toUpperCase()} +${r[k]}`).join(', ')||'—'}</dd>` : '';
    return `<article class="rrow" style="--c:${SCH[r.name]?col(r.name):'var(--line)'}"><h3>${title}</h3><dl class="kv">${kv}${extra}</dl>${notesHtml(r._notes, {...labels,name:'Name',bug:'Bug',tab:'Tab',trait:'Trait',race:'Race'})}</article>`;
  }).join('')}</div>`;
}

// ---------- items ----------
function suggestOpts(cols){
  const opts = new Set();
  for(const r of (REF?refRows('gearRolls'):[]).filter(r=>cols.includes(r.slot))){
    if(r.kind==='skill') opts.add(`Skill: ${r.stat}`);
    else if(r.kind==='stat') opts.add(`${r.stat} +${r.min}${r.pct?'%':''}`);
    else if(r.kind!=='rune') opts.add(r.text);
  }
  for(const a of AB_ALL) opts.add(`${a} +1`);
  for(const r of RESISTS) opts.add(`${r} +5%`);
  for(const s of ['HP +20','Reflect 10% melee damage as Air','Reflect 10% ranged damage as Physical','Vitality +10%','Movement +0.5','Initiative +2','Crit Chance +3%','Crit Damage +10%','Accuracy +5%','Dodging +5%','Life Steal +5%','Damage +5%']) opts.add(s);
  for(const s of ['Cursed','Warm','Burning','Blessed','Regenerating','Magic Shell']) opts.add(`Status: ${s}`);
  for(const s of [...D.skills,...D.special].map(x=>x.name).sort()) opts.add(`Skill: ${s}`);
  for(const s of ['Stunned','Knocked Down','Burning','Poisoned','Chilled','Frozen','Shocked','Bleeding','Diseased']) opts.add(`Immune to ${s}`);
  return [...opts].map(o=>`<option value="${esc(o)}"></option>`).join('');
}
const DMG_TYPES = ['Physical','Piercing','Fire','Water','Air','Earth','Poison'];
const DMG_COL = {Physical:'var(--war)',Piercing:'var(--necro)',Fire:'var(--pyro)',Water:'var(--hydro)',Air:'var(--aero)',Earth:'var(--geo)',Poison:'var(--hunt)'};
const DMG_EMO = {Physical:'⚔️',Piercing:'🗡️',Fire:'🔥',Water:'💧',Air:'🌀',Earth:'🪨',Poison:'☠️'};
const isWeapon = it => it.kind==='weapon';
const hasArmour = it => !['weapon','rune'].includes(it.kind) || (it.st&&(it.st.phys||it.st.magic));
const dmgTxt = d => d && (d.min!=null||d.max!=null) ? `<span class="dmgt" style="--c:${DMG_COL[d.type]||'var(--ink)'}">${DMG_EMO[d.type]||'⚔️'} ${esc(d.min??'?')}${d.max!=null&&d.max!==d.min?'–'+esc(d.max):''} ${esc(d.type||'')}</span>` : '';
function runeSocket(it){ return it.kind==='weapon' ? 'weapon' : it.kind==='amulet' ? 'amulet' : 'armor'; }
function sheetRune(name){ if(!REF||!name) return null; const R = REF.runes?.data||{}; const w = String(name).replace(/\s*rune$/i,'').split(' '); return (R.boosts||[]).find(r=>w.includes(r.rune)) || null; }
function runeOf(host){ const r = host?.st?.rune; return r && r!=='empty' && ITEMS[r] ? {...ITEMS[r], id:r} : null; }
function runeBonuses(host){ const r = runeOf(host); return r ? ((r.runeFx||{})[runeSocket(host)]||[]) : []; }
function socketedIn(runeId){ for(const [iid,x] of Object.entries(ITEMS)) if(x.st && x.st.rune===runeId) return {id:iid, ...x}; return null; }
function runeLabel(host, v){ if(!v) return 'No slot'; if(v==='empty') return 'Empty slot'; const r = ITEMS[v]; return r ? (r.name||'(unnamed rune)') : '(missing rune)'; }
function statLine(it){
  const s = it.st||{}; const out = [];
  if(isWeapon(it)){ if(handsOf(it)) out.push(`✋ ${handsOf(it)}H`); if(s.dmg) out.push(dmgTxt(s.dmg)); for(const x of (s.extra||[])) out.push('+ '+dmgTxt(x)); }
  if(s.phys) out.push(`🛡 ${esc(s.phys)}`); if(s.magic) out.push(`✨ ${esc(s.magic)}`);
  if(s.crit) out.push(`🎲 ${esc(s.crit)}% crit`); if(s.critDmg) out.push(`💥 ${esc(s.critDmg)}% crit dmg`); if(s.block) out.push(`🧱 ${esc(s.block)}% block`);
  if(s.reqAttr) out.push(`🔒 ${abChip(s.reqAttr, s.reqVal||'', 'data-inline="1"')}`);
  if(s.rune) out.push(`💎 ${esc(runeLabel(it, s.rune))}`);
  if(s.weight) out.push(`⚖️ ${esc(s.weight)} kg`);
  if(s.value) out.push(`🪙 ${Number(s.value).toLocaleString()}`);
  return out.join(' · ');
}
function itemMeta(it){
  const tl = it.type ? (calcTypes().find(t=>t.key===it.type)||{}).label : null;
  const bits = [KINDS[it.kind]||it.kind, tl, it.level ? `lvl ${it.level}` : null].filter(Boolean);
  const sl = statLine(it);
  const est = !sl && it.base ? (it.base.damage!=null ? `≈ ⚔️ ${fmt(it.base.damage)} avg (estimate)` : `≈ 🛡 ${fmt(it.base.phys||0)} · ✨ ${fmt(it.base.magic||0)} (estimate)`) : '';
  return `${it.rarity?rarTag(it.rarity)+' · ':''}${bits.map(esc).join(' · ')}${sl?` · ${sl}`:''}${est?` · ${est}`:''}`;
}
function statsEditor(it){
  const s = it.st||{}; const dis = canWrite?'':'disabled';
  const num = (f, v, ph, w='4.4em') => `<input type="number" step="any" value="${v??''}" placeholder="${ph}" data-ist="${f}" aria-label="${ph}" style="width:${w}" ${dis}>`;
  const typeSel = (f, v) => `<select class="dmgsel" style="--dc:${DMG_COL[v]||'var(--ink)'}" data-ist="${f}" aria-label="Damage type" ${dis}>${DMG_TYPES.map(t=>`<option value="${t}" style="color:${DMG_COL[t]}" ${v===t?'selected':''}>${DMG_EMO[t]} ${t}</option>`).join('')}</select>`;
  const types = calcTypes().filter(t=>t.itemKind===it.kind);
  const rows = [];
  const L = (icon, title, inner) => `<label class="mini" title="${title}"><span aria-hidden="true">${icon}</span><span class="sr">${title}</span>${inner}</label>`;
  if(types.length>1 || it.kind==='weapon') rows.push(L('🏷️',it.kind==='weapon'?'Weapon type (decides 1H/2H)':'Item type',`<select data-itype="1" ${dis}><option value="">—</option>${types.map(t=>`<option value="${esc(t.key)}" ${it.type===t.key?'selected':''}>${esc(t.label)}</option>`).join('')}</select>`));
  if(isWeapon(it) && handsOf(it)) rows.push(`<span class="mini" title="Set by the weapon type"><span aria-hidden="true">✋</span> <b>${handsOf(it)}H</b></span>`);
  if(isWeapon(it)){
    rows.push(L(DMG_EMO[s.dmg?.type]||'⚔️','Damage (min–max, type)',`${num('dmg.min',s.dmg?.min,'min')}–${num('dmg.max',s.dmg?.max,'max')} ${typeSel('dmg.type',s.dmg?.type||'Physical')}`));
    rows.push(L('➕','Extra damage (min–max, type)',`${num('extra.min',s.extra?.[0]?.min,'min')}–${num('extra.max',s.extra?.[0]?.max,'max')} ${typeSel('extra.type',s.extra?.[0]?.type||'Fire')}`));
    rows.push(L('🎲','Critical chance %',num('crit',s.crit,'crit %','4.6em')));
    rows.push(L('💥','Critical damage %',num('critDmg',s.critDmg,'crit dmg %','5.6em')));
  }
  if(hasArmour(it)) rows.push(L('🛡','Physical armour',num('phys',s.phys,'phys','5.2em')) + L('✨','Magic armour',num('magic',s.magic,'magic','5.2em')));
  if(it.kind==='shield') rows.push(L('🧱','Block chance %',num('block',s.block,'block %','4.8em')));
  if(!['ring','amulet','belt','rune'].includes(it.kind)) rows.push(L('🔒','Requirement',`<select data-ist="reqAttr" ${dis}><option value="">—</option>${ATTRS.slice(0,4).map(a=>`<option ${s.reqAttr===a?'selected':''}>${a}</option>`).join('')}</select> ${num('reqVal',s.reqVal,'#','3.6em')}`));
  if(it.kind!=='rune'){
    const free = Object.entries(ITEMS).filter(([rid,x])=>x.kind==='rune' && (!socketedIn(rid) || s.rune===rid));
    const opts = [['','No slot'],['empty','Empty slot'], ...free.map(([rid,x])=>[rid, x.name||'(unnamed rune)'])];
    if(canWrite&&db) opts.push(['__newrune','＋ New rune…']);
    rows.push(L('💎','Rune slot',`<select data-ist="rune" ${dis}>${opts.map(([v,l])=>`<option value="${esc(v)}" ${(s.rune||'')===v?'selected':''}>${esc(l)}</option>`).join('')}</select>${runeBonuses(it).length?` <span class="bon" style="display:inline-flex">${runeBonuses(it).map(bonusChipHtml).join('')}</span>`:''}`));
  }
  rows.push(L('⚖️','Weight (kg)',num('weight',s.weight,'kg','4.6em')));
  rows.push(L('🪙','Gold value',num('value',s.value,'gold','5.6em')));
  return `<div class="strow">${rows.join('')}</div>`;
}
// Editor used in Party slots and the Items tab. ctx = 'slot:<slot>' or 'item'
function bonusArr(it, sock){ if(sock){ it.runeFx = it.runeFx||{}; return it.runeFx[sock] = it.runeFx[sock]||[]; } return it.bonuses = it.bonuses||[]; }
function itemEditor(id, it, kindCols, ctx){
  const dl = 'dl-'+id;
  return `<div class="ied" data-item="${esc(id)}">
    <div class="sh"><input type="text" class="iname${it.rarity?' rarname':''}" style="--rc:${rcol(it.rarity)}" value="${esc(it.name||'')}" placeholder="Item name" data-iname="1" aria-label="Item name" ${canWrite?'':'disabled'}>
      <select class="rarsel" data-rar="${esc(it.rarity||'')}" style="--rc:${rcol(it.rarity)}" data-irar="1" aria-label="Rarity" ${canWrite?'':'disabled'}><option value="">Rarity</option>${RARITIES.map(r=>`<option style="color:${rcol(r)}" ${it.rarity===r?'selected':''}>${r}</option>`).join('')}</select>
      <label class="mini" title="Item level"><span aria-hidden="true">📈</span><input type="number" min="1" max="35" value="${it.level||''}" placeholder="lvl" data-ilvl="1" aria-label="Item level" style="width:4.2em" ${canWrite?'':'disabled'}></label></div>
    ${statsEditor(it)}
    ${it.kind==='rune' ? runeFxEditor(id, it, dl) : bonusList(it.bonuses||[], '', dl, 'Add: Hydrosophist +1 · Fire Resistance +5% · Skill: First Aid · Status: Cursed · Immune to Stunned')}
    ${canWrite?`<datalist id="${dl}">${suggestOpts(kindCols)}</datalist>`:''}
  </div>`;
}
function bonusList(arr, sock, dl, ph){
  return `<div class="bon">${arr.map((b,i)=>`<span class="bwrap">${bonusChipHtml(b)}${canWrite?`<button class="x" data-ibrm="${i}" data-sock="${sock}" aria-label="Remove ${esc(bonusLabel(b))}">×</button>`:''}</span>`).join('')}</div>
    ${canWrite?`<div class="addrow"><input type="text" list="${dl}" placeholder="${esc(ph)}" data-iadd="1" data-sock="${sock}" aria-label="Add a bonus"></div>`:''}`;
}
function runeFxEditor(id, it, dl){
  const sr = sheetRune(it.name); const host = socketedIn(id);
  return `<div class="runefx">${host?`<p class="note">💎 Socketed in <b>${esc(host.name||'an item')}</b>: its ${runeSocket(host)} effect applies.</p>`:'<p class="note">Not socketed. Pick it in an item\'s 💎 Rune slot.</p>'}
    ${SOCKETS.map(([k,ic,label])=>`<div class="sock"><span class="mini" title="${label}"><span aria-hidden="true">${ic}</span> ${label}${sr&&sr[k]&&sr[k]!=='-'?` <span class="note">· sheet: ${esc(sr[k])}</span>`:''}</span>
      ${bonusList((it.runeFx||{})[k]||[], k, dl, 'Effect from the rune tooltip, e.g. Fire Resistance +10%')}</div>`).join('')}</div>`;
}
function renderItems(){
  const q = state.q;
  const all = Object.entries(ITEMS).map(([id,it])=>({id,...it}));
  const list = all.filter(it=>(!state.kinds.size || state.kinds.has(it.kind)) && matches(textOf(it), q))
    .sort((a,b)=>Object.keys(KINDS).indexOf(a.kind)-Object.keys(KINDS).indexOf(b.kind) || String(a.name).localeCompare(String(b.name)));
  const bagGold = all.filter(it=>!whoWears(it.id)).reduce((a,it)=>a+(+it.st?.value||0),0), wornGold = all.filter(it=>whoWears(it.id)).reduce((a,it)=>a+(+it.st?.value||0),0);
  const bagKg = all.filter(it=>!whoWears(it.id)).reduce((a,it)=>a+(+it.st?.weight||0),0);
  setLine(`${list.length} of ${all.length} items · 🪙 ${bagGold.toLocaleString()} in the bag, ${wornGold.toLocaleString()} worn · ⚖️ ${fmt(bagKg)} kg in the bag · saved in the page's database (collection "items")`);
  const newBar = canWrite&&db ? `<div class="card" style="margin-top:14px"><div class="ctl"><label>New item of type<select data-newkind="1">${Object.entries(KINDS).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label><button class="btn" data-newitem="1">Add item</button><span class="note">Or build one from the Gear calculator, or from an empty Party slot.</span></div></div>` : '';
  if(!list.length) return newBar + `<div class="empty" style="margin-top:12px">${all.length?'No items match.':'No items saved yet.'}</div>`;
  return newBar + `<div class="rows">${list.map(it=>{
    const w = whoWears(it.id);
    const fits = SLOTS.filter(s=>s[2].includes(it.kind) && !(s[0]==='off' && handsOf(it)===2));
    return `<article class="rrow" id="${slug('it',it.id)}" style="--c:${rcol(it.rarity)||'var(--line)'}">
      <div class="hd"><span style="width:26px;height:26px;color:${rcol(it.rarity)||'var(--muted)'}">${gIcon(itemIconKey(it))}</span><span class="tag">${esc(KINDS[it.kind]||it.kind)}</span>${!statLine(it)&&it.base?`<span class="tag">${itemMeta(it).split(' · ').filter(x=>x.startsWith('≈')).join(' ')}</span>`:''}${it.kind==='rune' ? (socketedIn(it.id)?`<span class="tag" style="color:var(--known)">💎 In ${esc(socketedIn(it.id).name||'an item')}</span>`:'<span class="tag">Loose</span>') : w?`<span class="tag" style="color:var(--known)">Worn by ${esc(party[w.member].name)} (${esc(SLOTS.find(s=>s[0]===w.slot)[1])})</span>`:'<span class="tag">In the bag</span>'}</div>
      ${itemEditor(it.id, it, KIND_COLS[it.kind]||[], 'item')}
      ${canWrite?`<div class="addrow" style="margin-top:6px">${it.kind!=='rune'?`<select data-equipsel="${esc(it.id)}" aria-label="Equip on"><option value="">Equip on…</option>${MEMBERS.flatMap(m=>fits.map(s=>`<option value="${m.id}:${s[0]}">${esc(party[m.id].name)} · ${s[1]}${slotItem(m.id,s[0])?' (replace)':''}</option>`)).join('')}${w?'<option value="unequip">Unequip</option>':''}</select>`:''}
        <button class="btn" data-del="${esc(it.id)}">${state.confirmDel===it.id?'Click again to delete':'Delete'}</button></div>`:''}
    </article>`;}).join('')}</div>`;
}

// ---------- party ----------
const ED = () => canWrite && !!db && state.editing;
const numCell = (v, ph, attrs) => ED() ? `<input type="number" ${attrs} value="${v??''}" placeholder="${ph}">` : `<span>${v??'<span class="note">'+ph+'</span>'}</span>`;
function abRow(id, a, tot){
  const p = party[id]; const g = tot.gear[a]||0;
  return `<tr><td>${abChip(a)}</td><td class="n">${numCell(p.points[a], '0', `min="0" max="15" data-pt="${esc(a)}" aria-label="${esc(a)} points"`)}</td><td class="g">${g?sgn(g):''}</td><td class="t" data-tot="${esc(a)}">${tot.ab[a]||0}</td></tr>`;
}
function slotHtml(id, [slot,label,kinds,cols]){
  const g = party[id].gear?.[slot]; const it = slotItem(id, slot);
  const mainIt = slot==='off' ? slotItem(id,'main') : null;
  if(mainIt && handsOf(mainIt)===2) return `<div class="slot locked" data-slot="off" title="Two-handed: occupies both hands"><div class="sh"><span class="sl">${label}</span><select class="rarsel" data-rar="${esc(mainIt.rarity||'')}" style="--rc:${rcol(mainIt.rarity)}" disabled aria-label="Off hand: ${esc(mainIt.name||'two-handed weapon')}"><option>${esc(mainIt.name||'(two-handed weapon)')}</option></select><span class="note">✋ 2H</span></div></div>`;
  const choices = Object.entries(ITEMS).filter(([iid,x])=>kinds.includes(x.kind) && !(slot==='off' && handsOf(x)===2)).sort((a,b)=>String(a[1].name).localeCompare(String(b[1].name)));
  const sel = `<select class="rarsel" data-rar="${esc(it?it.rarity||'':'')}" style="--rc:${it?rcol(it.rarity):''}" data-slotsel="${slot}" aria-label="${label} item" ${canWrite?'':'disabled'}><option value="">— empty —</option>${choices.map(([iid,x])=>{ const w=whoWears(iid); return `<option style="color:${rcol(x.rarity)}" value="${esc(iid)}" ${g&&g.itemId===iid?'selected':''}>${esc(x.name||'(unnamed)')}${w&&!(w.member===id&&w.slot===slot)?` (on ${esc(party[w.member].name)})`:''}</option>`; }).join('')}${canWrite&&db?'<option value="__new">＋ New item…</option>':''}</select>`;
  return `<div class="slot" data-slot="${slot}">
    <div class="sh"><span class="sl">${label}</span>${sel}</div>
    ${it&&it.id ? itemEditor(it.id, it, cols, 'slot') : it ? `<div class="bon">${(it.bonuses||[]).map(bonusChipHtml).join('')}</div>` : ''}
  </div>`;
}
function renderParty(){
  setLine('');
  return state.partyView==='detail' ? renderPartyDetail() : renderPartyOverview();
}
function renderPartyOverview(){
  return `<div class="pover">${MEMBERS.map(m=>miniCard(m.id)).join('')}</div>`;
}
function miniCard(id){
  const p = party[id], d = derived(id);
  const t = k => tileHtml(id, SL(k), true);
  return `<section class="card mini-cc" data-open="${id}" tabindex="0" role="button" aria-label="Open ${esc(p.name)}">
    <div class="mc">
      <div class="cc-helm">${t('helmet')}</div>
      <div class="cc-left">${['chest','gloves','belt','boots'].map(t).join('')}</div>
      <div class="mc-mid"><div class="portrait sm">${gIcon(portraitKey(p))}</div>
        <div class="ccname">${esc(p.name)}</div>
        <div class="note">${[p.undead?'Undead':'', p.race||'', p.gender||''].filter(Boolean).join(' ')||'&nbsp;'} · Lvl ${p.level||'?'}</div>
        <div class="mstats"><span title="Vitality (estimate)"><span class="si">${gIcon('heart')}</span>${d.vit.toLocaleString()}</span><span title="AP start / max"><span class="si">${gIcon('ap')}</span>${d.start}/${d.maxAP}</span></div></div>
      <div class="cc-right">${['amulet','ring1','ring2','leggings'].map(t).join('')}</div>
      <div class="cc-weap">${t('main')}${t('off')}</div>
    </div></section>`;
}
function renderPartyDetail(){
  const id = state.who, p = party[id], tot = TOT[id], ed = ED();
  const otherAb = [...WEAPON_AB,...DEF_AB,...CIVIL_AB];
  const openOther = otherAb.some(a=>tot.ab[a]);
  const other = Object.entries(tot.other);
  const sortedKnown = [...p.known].sort((a,b)=>{const A=SKILL_OBJ[a.toLowerCase()],B=SKILL_OBJ[b.toLowerCase()];return SCHOOLS.indexOf(A?.school)-SCHOOLS.indexOf(B?.school)||a.localeCompare(b);});
  return `<div class="ptop"><button class="btn" data-back="1">← Party</button>
    <div class="who">${MEMBERS.map(m=>`<button aria-pressed="${m.id===id}" data-who="${m.id}"><span class="wp">${gIcon(portraitKey(party[m.id]))}</span><span class="wn">${esc(party[m.id].name||m.name)}<small>Lvl ${party[m.id].level||'?'}</small></span></button>`).join('')}</div>
    ${canWrite&&db?`<span class="viewtoggle" role="group" aria-label="Mode"><button data-mode="view" aria-pressed="${!ed}">View</button><button data-mode="edit" aria-pressed="${ed}">${lIcon('pencil')} Edit</button></span>`:''}</div>
  <div class="pdetail member${ed?' editing':''}" data-m="${id}">
    ${charCard(id)}
    <div class="card">
      <div class="lvl" style="display:flex;gap:8px;align-items:center"><h3 style="flex:1">Stats</h3><label for="lvl">📈 Level</label>${ed?`<input id="lvl" type="number" min="1" max="35" value="${p.level||''}" data-f="level" style="width:4.2em">`:`<b>${p.level||'—'}</b>`}</div>
      ${(()=>{ const B = Object.fromEntries(budget(id).map(r=>[r[0], r]));
        const head = ['<thead><tr><th>Ability</th><th>Points</th><th>Gear</th><th>Total</th></tr></thead>'];
        return [
        sect('attrs','dumbbell','Attributes', B['Attribute points'],
          `<table class="tt"><thead><tr><th>Attribute</th><th>Base</th><th>Gear</th><th>Total</th></tr></thead><tbody>${ATTRS.map(a=>`<tr><td>${abChip(a)}</td><td class="n">${numCell(p.attributes[a], '10', `min="0" max="60" data-at="${a}" aria-label="${a} base"`)}</td><td class="g">${tot.gear[a]?sgn(tot.gear[a]):''}</td><td class="t" data-tota="${a}">${tot.at[a]??'—'}</td></tr>`).join('')}</tbody></table>`),
        sect('combat','swords','Combat abilities', B['Combat ability points'],
          `<table class="tt">${head}<tbody>${SCHOOLS.map(a=>abRow(id,a,tot)).join('')}<tr class="sub"><td colspan="4">Weapon &amp; defence</td></tr>${[...WEAPON_AB,...DEF_AB].filter(a=>ed||tot.ab[a]).map(a=>abRow(id,a,tot)).join('')||'<tr><td class="note" colspan="4">None</td></tr>'}</tbody></table>`),
        sect('civil','handshake','Civil abilities', B['Civil ability points'],
          `<table class="tt">${head}<tbody>${CIVIL_AB.filter(a=>ed||tot.ab[a]).map(a=>abRow(id,a,tot)).join('')||'<tr><td class="note" colspan="4">None</td></tr>'}</tbody></table>`),
        sect('talents','star','Talents', B['Talents (not racial)'],
          `<div class="bon">${p.talents.map((t,i)=>`<span class="bwrap"><span class="bchip" title="${esc((refRows('talents').find(x=>x.name===t)||{}).description||(refRows('raceTraits').find(x=>x.trait===t)||{}).description||'')}">${esc(t)}</span>${ed?`<button class="x" data-trm="${i}" aria-label="Remove ${esc(t)}">×</button>`:''}</span>`).join('')||'<span class="note">None</span>'}</div>
          ${ed?`<div class="addrow"><input type="text" list="dl-talents" placeholder="Add a talent" data-tadd="1" aria-label="Add a talent"></div><datalist id="dl-talents">${refRows('talents').map(t=>`<option value="${esc(t.name)}"></option>`).join('')}</datalist>`:''}`),
        sect('gear','shield','From gear', null, `${equippedSummary(id).replace('<h4>Equipped</h4>','')}
          ${other.length?`<h4>Other stats</h4><div class="bon">${other.map(([k,v])=>bonusChipHtml({stat:k.replace(' %',''), value:v, pct:k.endsWith(' %')})).join('')}</div>`:''}
          ${tot.statuses.length||tot.immune.length?`<h4>Statuses</h4><div class="bon">${tot.statuses.map(s=>{const st=STATUS_OBJ[s.status.toLowerCase()]; return `<span class="bchip gst" title="From ${esc(s.item)}">💫 ${st?statusChip(st,'data-inline="1"'):esc(s.status)}</span>`;}).join('')}${tot.immune.map(s=>{const st=STATUS_OBJ[s.status.toLowerCase()]; return `<span class="bchip" title="From ${esc(s.item)}">🚫 ${st?statusChip(st,'data-inline="1"'):esc(s.status)}</span>`;}).join('')}</div>`:''}
          ${tot.reflect.length?`<h4>Reflect</h4><div class="bon">${tot.reflect.map(r=>`<span title="From ${esc(r.item)}">${bonusChipHtml({reflect:r})}</span>`).join('')}</div>`:''}
          ${tot.skills.length?`<h4>Skills</h4><div class="bon">${tot.skills.map(s=>skillChip(s.skill,`data-from="${esc(s.item)}"`)).join('')}</div>`:''}`),
        ].join(''); })()}
      ${sect('known','sparkles',`Known skills <small class="note">(${p.known.length})</small>`, null, `<div class="bon">${sortedKnown.length?sortedKnown.map(n=>skillChip(n)).join(''):'<span class="note">None marked yet. Click the markers on the Skills tab.</span>'}</div>`)}
      ${sect('notes','notebook-pen','Notes', null, ed?`<textarea data-f="notes" placeholder="Plans, reminders…">${esc(p.notes||'')}</textarea>`:`<div class="notesview">${p.notes?esc(p.notes):'<span class="note">No notes</span>'}</div>`)}
    </div>
  </div>`;
}
// Point budgets (DOS2): creation 3 attribute / 2 combat / 1 civil / 1 talent;
// each level +2 attribute, +1 combat; civil at levels 2, 6, 10…; talents at 3, 8, 13…
function budget(id){
  const p = party[id], L = Math.max(1, +p.level||1);
  const has = t => p.talents.includes(t);
  const raceNames = new Set(refRows('raceTraits').map(r=>r.trait));
  const poly = +p.points?.Polymorph||0;
  const attrAvail = 3 + 2*(L-1) + poly + (has('Bigger & Better')?2:0);
  const combatAvail = 2 + (L-1) + (has('All Skilled Up')?1:0);
  const civilAvail = 1 + [...Array(L+1).keys()].filter(l=>l>=2 && (l-2)%4===0).length + (has('All Skilled Up')?1:0);
  const talentAvail = 1 + [...Array(L+1).keys()].filter(l=>l>=3 && (l-3)%5===0).length;
  const attrEntered = ATTRS.some(a=>p.attributes[a]!=null && p.attributes[a]!=='');
  const attrSpent = ATTRS.reduce((s,a)=>s + ((+p.attributes[a]||10) - 10), 0);
  const low = ATTRS.filter(a=>p.attributes[a]!=null && p.attributes[a]!=='' && +p.attributes[a]<10);
  const combatSpent = [...SCHOOLS,...WEAPON_AB,...DEF_AB].reduce((s,a)=>s+(+p.points?.[a]||0),0);
  const civilSpent = CIVIL_AB.reduce((s,a)=>s+(+p.points?.[a]||0),0);
  const talentSpent = p.talents.filter(t=>!raceNames.has(t)).length;
  return [
    ['Attribute points', attrEntered?attrSpent:null, attrAvail, low.length?`${low.join(', ')} below the base of 10`:'' ],
    ['Combat ability points', combatSpent, combatAvail, ''],
    ['Civil ability points', civilSpent, civilAvail, ''],
    ['Talents (not racial)', talentSpent, talentAvail, ''],
  ];
}
const BUDGET_RULES = 'At creation: 3 attribute, 2 combat, 1 civil point, 1 talent. Each level: +2 attribute, +1 combat. Civil points at levels 2, 6, 10…; talents at 3, 8, 13…. Polymorph +1 attribute per point; All Skilled Up +1 combat +1 civil; Bigger & Better +2 attribute. Racial talents don\'t count.';
function budgetBadge(row){
  if(!row) return '';
  const [label, spent, avail, warn] = row;
  const [cls, txt] = spent==null ? ['note','— / '+avail] : spent===avail ? ['ok',`${spent} / ${avail} ✓`] : spent<avail ? ['under',`${spent} / ${avail} · ${avail-spent} to spend`] : ['over',`${spent} / ${avail} · ${spent-avail} over`];
  return `<span class="bstat ${cls}" title="${esc(label)}: ${esc(BUDGET_RULES)}">${txt}${warn?` <span class="bwarn" title="${esc(warn)}">⚠</span>`:''}</span>`;
}
const SECT_DEFAULT = {attrs:true, combat:true, civil:false, talents:true, gear:false, known:true, notes:true};
function sect(key, icon, title, budgetRow, body){
  const open = state.sects?.[key] ?? SECT_DEFAULT[key];
  return `<details class="sect" data-sect="${key}" ${open?'open':''}><summary><span class="sic">${lIcon(icon)}</span><span class="stitle">${title}</span>${budgetBadge(budgetRow)}</summary><div class="sbody">${body}</div></details>`;
}
function budgetHtml(id){
  const rows = budget(id).map(([label, spent, avail, warn])=>{
    const st = spent==null ? ['—','note','not entered'] : spent===avail ? ['✓','ok','all spent'] : spent<avail ? ['○','under',`${avail-spent} unspent`] : ['⚠','over',`${spent-avail} over budget`];
    return `<tr class="bud ${st[1]}"><td>${label}</td><td class="n">${spent??'—'} / ${avail}</td><td>${st[0]} ${st[2]}${warn?` · ⚠ ${esc(warn)}`:''}</td></tr>`;
  }).join('');
  return `<h4>Point budget at level ${party[id].level||1}</h4><table class="tt budget"><tbody>${rows}</tbody></table>
    <p class="note">Rules: at creation 3 attribute, 2 combat, 1 civil points and 1 talent; each level +2 attribute and +1 combat; civil at levels 2, 6, 10…; talents at 3, 8, 13…. Polymorph adds 1 attribute point per point, All Skilled Up +1 combat and +1 civil, Bigger &amp; Better +2 attribute. Racial talents (from the Race traits list) don't count.</p>`;
}
const RACES = ['Human','Elf','Dwarf','Lizard'], GENDERS = ['Male','Female'];
const BASE_VIT = [0,30,45,65,85,110,135,165,200,235,285,345,415,560,685,840,1015,1255,1790,2240,2815,3545,4480,5670,7190,9130];
function portraitKey(p){ if(p.undead) return 'p-undead'; const r=(p.race||'').toLowerCase(); if(r==='lizard') return 'p-lizard'; if(['human','elf','dwarf'].includes(r)) return `p-${r}-${p.gender==='Female'?'f':'m'}`; return 'p-unknown'; }
function derived(id){
  const p = party[id], t = TOT[id], L = Math.min(25, Math.max(1, +p.level||1)), o = t.other;
  const con = t.at.Constitution;
  let racePct = 0; if(p.race){ for(const r of refRows('raceTraits').filter(r=>r.race===p.race)){ const m = String(r.description||'').match(/\+(\d+)% Vitality/i); if(m) racePct += +m[1]; } }
  const pct = (o['Vitality %']||0) + (o['HP %']||0) + racePct;
  const flat = (o['HP']||0) + (o['Vitality']||0);
  const vit = Math.round(BASE_VIT[L] * (1 + 0.07*((con??10)-10) + pct/100) + flat);
  const maxAP = 6 + (o['Max AP']||0), rec = 4 + (o['AP Recovery']||0);
  const start = p.talents.includes('Glass Cannon') ? maxAP : 4 + (o['Starting AP']||0);
  return {vit, conKnown: con!=null, racePct, pct, flat, maxAP, rec, start, L};
}
function tileHtml(id, [slot,label], mini=false){
  const main = slotItem(id,'main'); const twoH = handsOf(main)===2;
  let it = slotItem(id, slot), locked = false;
  if(slot==='off' && twoH){ it = main; locked = true; }
  const canSwap = !mini && canWrite && !!db && !locked;
  const editable = canSwap && ED();
  const pop = canSwap ? ` data-pick="${slot}" role="button"` : '';
  const pen = editable && it ? `<button class="pen" data-pop="${slot}" title="Edit this item" aria-label="Edit ${esc(label)} item">${lIcon('pencil')}</button>` : '';
  if(mini){ const ic = it ? gIcon(itemIconKey(it)) : gIcon(slot.startsWith('ring')?'ring':slot==='main'?'sword':slot==='off'?'shield':slot);
    return `<div class="mtile${it?'':' empty'}${locked?' locked2':''}" style="--rc:${it?rcol(it.rarity)||'var(--ink)':'var(--line)'}" ${it?`data-itemtip="${esc(it.id||'')}"`:''} aria-label="${esc(label)}: ${esc(it?it.name||'':'empty')}">${ic}</div>`; }
  if(!it) return `<div class="tile empty"${pop} tabindex="0" aria-label="${esc(label)}: empty${pop?' (click to pick an item)':''}"><div class="ico">${gIcon(slot.startsWith('ring')?'ring':slot==='main'?'sword':slot==='off'?'shield':slot)}</div><div class="tx"><span class="sl2">${label}</span><span class="nm">—</span></div></div>`;
  const s = it.st||{}; const sub = isWeapon(it) && s.dmg ? dmgTxt(s.dmg) : (s.phys||s.magic) ? `🛡 ${s.phys||0} · ✨ ${s.magic||0}` : (it.bonuses||[]).slice(0,2).map(bonusLabel).map(esc).join(', ');
  return `<div class="tile${locked?' locked2':''}"${pop} style="--rc:${rcol(it.rarity)||'var(--ink)'}" data-itemtip="${esc(it.id||'')}" tabindex="0" aria-label="${esc(label)}: ${esc(it.name||'')}">
    <div class="ico">${gIcon(itemIconKey(it))}</div><div class="tx"><span class="sl2">${label}${locked?' · 2H':''}</span><span class="nm">${esc(it.name||'(unnamed)')}</span><span class="mini2">${sub||'&nbsp;'}</span></div>
    ${runeOf(it)?`<span class="rn" title="Rune: ${esc(runeOf(it).name)}">${gIcon('rune')}</span>`:''}${pen}</div>`;
}
function pickerHtml(id){
  const def = SL(state.pickSlot); if(!def) return '';
  const [slot,label,kinds] = def; const cur = party[id].gear?.[slot]?.itemId;
  const list = Object.entries(ITEMS).filter(([iid,x])=>kinds.includes(x.kind) && !(slot==='off' && handsOf(x)===2))
    .sort((a,b)=>(RARITIES.indexOf(b[1].rarity)-RARITIES.indexOf(a[1].rarity)) || String(a[1].name).localeCompare(String(b[1].name)));
  const row = (iid,x) => { const w = whoWears(iid); const other = w && !(w.member===id && w.slot===slot);
    return `<button class="prow${iid===cur?' cur':''}" data-q="${esc(textOf(x))}" role="option" data-pickitem="${esc(iid)}" data-itemtip="${esc(iid)}" style="--rc:${rcol(x.rarity)||'var(--ink)'}"><span class="pi">${gIcon(itemIconKey(x))}</span><span class="pt"><span class="nm">${esc(x.name||'(unnamed)')}</span><span class="note">${statLine(x)||esc(KINDS[x.kind]||'')}</span></span>${other?`<span class="tag">on ${esc(party[w.member].name)}</span>`:iid===cur?'<span class="tag">equipped</span>':''}</button>`; };
  return `<div class="picker" role="dialog" aria-label="Choose ${esc(label)}"><div class="phd">${esc(label)}<button class="x" data-pickclose="1" aria-label="Close">${lIcon('x')}</button></div>
    <div class="psearch"><input type="search" placeholder="Search ${list.length} item${list.length===1?'':'s'}: name, stat, bonus…" data-picksearch="1" aria-label="Search items"></div>
    <div class="plist" role="listbox">${list.map(([iid,x])=>row(iid,x)).join('')||'<p class="note" style="padding:6px 10px">No items of this kind yet.</p>'}</div>
    <p class="note pempty" hidden style="padding:8px 14px">Nothing matches.</p>
    <div class="pfoot">${cur?`<button class="btn" data-pickitem="">Unequip</button>`:''}<button class="btn" data-pickitem="__new">＋ New item</button></div></div>`;
}
const SL = k => SLOTS.find(s=>s[0]===k);
function charCard(id){
  const p = party[id], d = derived(id), dis = canWrite?'':'disabled';
  const sel = (f, opts, v, ph) => `<select class="ccsel" data-f="${f}" aria-label="${ph}" ${dis}><option value="">${ph}</option>${opts.map(o=>`<option ${v===o?'selected':''}>${o}</option>`).join('')}</select>`;
  const raceTraits = p.race ? refRows('raceTraits').filter(r=>r.race===p.race) : [];
  return `<section class="card cc-card">
    <div class="cc">
      <div class="cc-helm">${tileHtml(id, SL('helmet'))}</div>
      <div class="cc-left">${['chest','gloves','belt','boots'].map(k=>tileHtml(id, SL(k))).join('')}</div>
      <div class="cc-mid">
        <div class="portrait">${gIcon(portraitKey(p))}</div>
        <div class="ccname">${esc(p.name)}</div>
        ${ED()?`<div class="ccrow">${sel('race',RACES,p.race,'Race')}${sel('gender',GENDERS,p.gender,'Gender')}<label class="mini" title="Undead"><input type="checkbox" data-f="undead" ${p.undead?'checked':''}> Undead</label></div>`:`<div class="note">${[p.undead?'Undead':'', p.race||'', p.gender||''].filter(Boolean).join(' ')||'Race not set'} · Level ${p.level||'?'}</div>`}
        <div class="ccstats">
          <div title="Vitality estimate: base ${BASE_VIT[d.L]} at level ${d.L} × (1 + 7% per Constitution over 10${d.pct?` + ${d.pct}% from gear/race`:''})${d.flat?` + ${d.flat} flat`:''}"><span class="si">${gIcon('heart')}</span><b>≈${d.vit.toLocaleString()}</b><small>Vitality${d.conKnown?'':' (Con 10 assumed)'}</small></div>
          <div title="Action points: start ${d.start}, max ${d.maxAP}, recovery ${d.rec} per turn"><span class="si">${gIcon('ap')}</span><b>${d.start} / ${d.maxAP}</b><small>AP start / max · +${d.rec}/turn</small></div>
        </div>
        ${raceTraits.length?`<div class="bon" style="justify-content:center">${raceTraits.map(r=>`<span class="bchip" title="${esc(r.description||'')}">${esc(r.trait)}</span>`).join('')}</div>`:''}
      </div>
      <div class="cc-right">${['amulet','ring1','ring2','leggings'].map(k=>tileHtml(id, SL(k))).join('')}</div>
      <div class="cc-weap">${tileHtml(id, SL('main'))}${tileHtml(id, SL('off'))}</div>
    </div>
    <p class="note">Hover an item for details (hold Ctrl to keep it open)${canWrite&&db?'. Click a slot to swap the item'+(ED()?'; the ✎ pen edits the item itself':''):''}. Vitality is an estimate from the level table and Constitution (+7% per point); AP uses the base 4 start / 6 max / 4 recovery plus gear and Glass Cannon. Lone Wolf isn't applied (party of four), nor are conditional effects like What a Rush.</p>
    ${canWrite && db && state.popSlot ? popHtml(id) : ''}${canWrite && db && state.pickSlot ? pickerHtml(id) : ''}
  </section>`;
}
function popHtml(id){
  const def = SL(state.popSlot); if(!def) return '';
  return `<div class="popwrap" data-popclose="1"><div class="pop" role="dialog" aria-modal="true" aria-label="Edit ${esc(def[1])}">
    <div style="display:flex;align-items:center"><h3 style="flex:1">${esc(def[1])}</h3><button class="x" data-popclose="1" aria-label="Close">${lIcon('x')}</button></div>
    ${slotHtml(id, def)}</div></div>`;
}
function itemTip(it){
  const s = it.st||{}, rb = runeBonuses(it), r = runeOf(it), w = it.id ? whoWears(it.id) : null;
  const tl = it.type ? (calcTypes().find(t=>t.key===it.type)||{}).label : null;
  const rows = [];
  const add = (icon, label, val) => { if(val!=null && val!=='') rows.push(`<dt title="${esc(label)}">${icon} ${esc(label)}</dt><dd>${val}</dd>`); };
  if(isWeapon(it)){
    add('✋','Hands', handsOf(it)?handsOf(it)+'H':null);
    add(DMG_EMO[s.dmg?.type]||'⚔️','Damage', s.dmg ? dmgTxt(s.dmg) : null);
    for(const x of (s.extra||[])) add('➕','Extra damage', dmgTxt(x));
    add('🎲','Crit chance', s.crit!=null ? `${esc(s.crit)}%` : null);
    add('💥','Crit damage', s.critDmg!=null ? `${esc(s.critDmg)}%` : null);
  }
  add('🛡','Physical armour', s.phys!=null ? esc(s.phys) : null);
  add('✨','Magic armour', s.magic!=null ? esc(s.magic) : null);
  add('🧱','Block', s.block!=null ? `${esc(s.block)}%` : null);
  add('🔒','Requires', s.reqAttr ? abChip(s.reqAttr, s.reqVal||'', 'data-inline="1"') : null);
  add('💎','Rune slot', s.rune ? (s.rune==='empty' ? 'Empty' : r ? esc(r.name||'Rune') : '?') : null);
  add('⚖️','Weight', s.weight!=null ? `${esc(s.weight)} kg` : null);
  add('🪙','Value', s.value!=null ? Number(s.value).toLocaleString() : null);
  if(!statLine(it) && it.base) add('≈','Estimate', it.base.damage!=null ? `${fmt(it.base.damage)} avg damage` : `🛡 ${fmt(it.base.phys||0)} · ✨ ${fmt(it.base.magic||0)}`);
  const sub = [it.rarity?rarTag(it.rarity):'', esc(tl||KINDS[it.kind]||it.kind||''), it.level?`Level ${esc(it.level)}`:''].filter(Boolean).join(' · ');
  const runeFx = it.kind==='rune' ? SOCKETS.map(([k,ic,label])=>{ const arr=(it.runeFx||{})[k]||[]; return arr.length?`<p class="note" style="margin:6px 0 2px">${ic} ${label}</p><div class="bon">${arr.map(bonusChipHtml).join('')}</div>`:''; }).join('') : '';
  return `<div class="itip" style="--rc:${rcol(it.rarity)||'var(--ink)'}">
    <div class="hd"><div class="iti">${gIcon(itemIconKey(it))}</div><div><div class="nm">${esc(it.name||'(unnamed)')}</div><div class="note">${sub}</div></div></div>
    ${rows.length?`<dl class="istats">${rows.join('')}</dl>`:''}
    ${(it.bonuses||[]).length?`<div class="bon" style="margin-top:6px">${it.bonuses.map(bonusChipHtml).join('')}</div>`:''}
    ${r?`<div class="irune"><p class="note">💎 ${esc(r.name||'Rune')} · ${runeSocket(it)} effect</p>${rb.length?`<div class="bon">${rb.map(bonusChipHtml).join('')}</div>`:'<p class="note">No effect entered yet</p>'}</div>`:''}
    ${runeFx}
    ${it.notes?`<p class="note" style="white-space:pre-line">${esc(it.notes)}</p>`:''}
    <p class="note ifoot">${w?`Worn by ${esc(party[w.member].name)} · ${esc(SL(w.slot)[1])}`:it.kind==='rune'?(socketedIn(it.id)?`Socketed in ${esc(socketedIn(it.id).name||'an item')}`:'Loose'):'In the bag'}<span class="pinhint"> · hold Ctrl to keep this open</span></p>
  </div>`;
}
function equippedSummary(id){
  let phys=0, magic=0, wt=0; const weapons=[];
  const twoH = handsOf(slotItem(id,'main'))===2;
  for(const [slot] of SLOTS){ if(slot==='off' && twoH) continue; const it = slotItem(id, slot); if(!it) continue; const s=it.st||{}; phys+=+s.phys||0; magic+=+s.magic||0; wt+=+s.weight||0; if(it.kind==='weapon') weapons.push(`<span class="rar" style="--rc:${rcol(it.rarity)||'var(--ink)'}">${esc(it.name||'Weapon')}</span>: ${[dmgTxt(s.dmg),...(s.extra||[]).map(x=>'+ '+dmgTxt(x))].filter(Boolean).join(' ')||'<span class="note">damage not entered</span>'}`); }
  return `<h4>Equipped</h4><div class="note" style="color:var(--ink)">🛡 <b>${phys}</b> physical armour · ✨ <b>${magic}</b> magic armour · ⚖️ <b>${fmt(wt)}</b> kg worn${weapons.length?'<br>'+weapons.join('<br>'):''}</div>`;
}
function refreshTotals(id){
  recalc(); const tot = TOT[id]; const sec = document.querySelector('.member');
  if(!sec) return;
  const bt = sec.querySelector('table.budget'); if(bt){ const tmp=document.createElement('div'); tmp.innerHTML=budgetHtml(id); bt.replaceWith(tmp.querySelector('table.budget')); }
  sec.querySelectorAll('[data-tot]').forEach(el=>el.textContent = tot.ab[el.dataset.tot]||0);
  sec.querySelectorAll('[data-tota]').forEach(el=>el.textContent = tot.at[el.dataset.tota]??'—');
}

function setLine(t){ document.getElementById('sline').textContent=t; }
function renderView(){
  recalc(); hideTip();
  const v=document.getElementById('view');
  queueMicrotask(positionPopups);
  v.innerHTML = state.tab==='skills'?renderSkills(): state.tab==='status'?renderStatus(): state.tab==='summons'?renderSimple(D.summons,'summon skills'): state.tab==='special'?renderSimple(D.special,'weapon & racial skills'):
    state.tab==='crafting'?renderCrafting(): state.tab==='items'?renderItems(): state.tab==='gear'?renderGearCalc(): state.tab==='reference'?renderReference(): renderParty();
}
function positionPopups(){
  const pk = view.querySelector('.picker'); if(!pk || !state.pickSlot) return;
  const t = view.querySelector(`[data-pick="${state.pickSlot}"]`); if(!t) return;
  const r = t.getBoundingClientRect(), w = Math.min(380, window.innerWidth-16);
  pk.style.width = w+'px';
  let x = Math.min(window.innerWidth - w - 8, Math.max(8, r.left)); let y = r.bottom + 4;
  const h = pk.offsetHeight; if(y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 4);
  pk.style.left = x+'px'; pk.style.top = y+'px';
}
function render(){ renderTabs(); renderView(); }
// Re-render but put the cursor back where it was (same field of the same item).
const FOCUS_KEYS = ['iname','irar','ilvl','ist','itype','iadd','slotsel','calc','calcf','pt','at','f','tadd','cadd','equipsel'];
function renderKeep(){
  const el = document.activeElement; let key = null, pos = null;
  if(el && view.contains(el)){
    const iid = el.closest('[data-item]')?.dataset.item || '';
    const a = FOCUS_KEYS.find(k=>el.dataset[k]!=null);
    if(a) key = {iid, a, v: el.dataset[a], slot: el.closest('[data-slot]')?.dataset.slot || ''};
    try{ pos = el.selectionStart; }catch(_){}
  }
  renderView();
  if(!key) return;
  const sel = (key.slot?`[data-slot="${CSS.escape(key.slot)}"] `:'') + (key.iid?`[data-item="${CSS.escape(key.iid)}"] `:'') + `[data-${key.a}="${CSS.escape(key.v)}"]`;
  const n = view.querySelector(sel) || view.querySelector(`[data-${key.a}="${CSS.escape(key.v)}"]`);
  if(n){ n.focus({preventScroll:true}); if(pos!=null){ try{ n.setSelectionRange(pos,pos); }catch(_){} } }
}
let deferred = false;   // a sync update arrived while a field was focused
function refocus(sel){ const el = document.querySelector(sel); if(el){ el.focus(); } }

// ---------- persistence ----------
const pending = {}; const timers = {}; const writing = {}; const dirty = {};
// Send only what changed since the last synced copy, so two open views editing different
// fields (or one view with stale data) don't overwrite each other's work.
const synced = {};   // key -> last body known to be in the database
const NESTED = new Set(['points','attributes','gear','st','runeFx']);
const same = (a,b) => JSON.stringify(a??null) === JSON.stringify(b??null);
function diffPatch(cur, base){
  const patch = {}; const keys = new Set([...Object.keys(cur||{}), ...Object.keys(base||{})]);
  for(const k of keys){
    if(same(cur?.[k], base?.[k])) continue;
    const c = cur?.[k], b = base?.[k];
    if(NESTED.has(k) && c && b && typeof c==='object' && typeof b==='object' && !Array.isArray(c)){
      const sub = {}; for(const s of new Set([...Object.keys(c), ...Object.keys(b)])) if(!same(c[s], b[s])) sub[s] = c[s] ?? null;
      patch[k] = sub;
    } else patch[k] = c ?? null;
  }
  return patch;
}
async function writeDoc(key, path, bodyFn){
  if(!db||!canWrite) return;
  if(writing[key]){ pending[key]=true; return; }
  writing[key]=true; lastErr=null; saveIndicator();
  try{
    const body = bodyFn();
    if(body===null){ await db.doc(path).delete(); delete synced[key]; }
    else {
      const cur = clone(body), base = synced[key];
      if(!base) await db.doc(path).set(cur);
      else { const patch = diffPatch(cur, base); if(Object.keys(patch).length){ try{ await db.doc(path).update(patch); } catch(e){ if(e && e.code==='invalid_argument') await db.doc(path).set(cur); else throw e; } } }
      synced[key] = cur;
    }
  }
  catch(e){ lastErr = (e&&e.message)||'unknown error'; if(e&&e.code==='invalid_argument'){ canWrite=false; render(); } }
  writing[key]=false;
  if(pending[key]){ pending[key]=false; writeDoc(key, path, bodyFn); } else if(!timers[key]){ dirty[key]=false; }
  saveIndicator();
}
let lastErr = null;
function saveIndicator(){
  const el = document.getElementById('savestate'); if(!el) return;
  const busy = Object.values(writing).some(Boolean) || Object.values(timers).some(Boolean);
  const [cls, txt, tip] = !db ? ['off','Not syncing','This view has no database access, so nothing you change here is saved.']
    : !canWrite ? ['off','Read-only','You can view the party but not change it.']
    : lastErr ? ['error','Not saved', 'The last save failed: '+lastErr+'. Your change is still on screen; edit again to retry.']
    : busy ? ['pending','Saving…','Changes save on their own a moment after you stop typing. No save button needed.']
    : ['ok','All changes saved','Everything you change saves on its own, a moment after you stop typing. Claude reads the same database.'];
  el.className = 'savestate '+cls; el.title = tip; el.innerHTML = `<span class="dot"></span><span class="stxt">${txt}</span>`;
}
function queue(key, path, bodyFn, delay=600){ dirty[key]=true; setTimeout(saveIndicator,0); clearTimeout(timers[key]); timers[key]=setTimeout(()=>{ timers[key]=null; writeDoc(key, path, bodyFn); },delay); }
const queueSave = (id, delay) => queue('party/'+id, 'party/'+id, ()=>party[id], delay);
const queueItem = (iid, delay) => queue('items/'+iid, 'items/'+iid, ()=>ITEMS[iid] ?? null, delay);
const newId = () => 'it-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function createItem(fields){ const iid = newId(); ITEMS[iid] = {name:'', kind:'weapon', rarity:'', level:null, bonuses:[], created:new Date().toISOString(), ...fields}; queueItem(iid, 50); return iid; }
function equip(iid, member, slot){
  if(slot==='off' && handsOf(ITEMS[iid])===2) return;
  if(slot==='main' && handsOf(ITEMS[iid])===2 && party[member].gear.off){ delete party[member].gear.off; }
  const w = whoWears(iid); if(w){ delete party[w.member].gear[w.slot]; if(w.member!==member) queueSave(w.member, 100); }
  party[member].gear[slot] = {itemId: iid}; queueSave(member, 100);
}
function unequip(iid){ const w = whoWears(iid); if(w){ delete party[w.member].gear[w.slot]; queueSave(w.member, 100); } }

const view = document.getElementById('view');
function navTo(kind, name){
  hideTip();
  const resetSkillFilters = ()=>{ state.schools.clear(); state.craft=state.use=state.known=false; for(const k of ['craft','use','known']) document.getElementById('f-'+k).checked=false; document.querySelectorAll('#schools .chip').forEach(b=>b.setAttribute('aria-pressed','false')); };
  let target;
  if(kind==='skill'){ const sk=SKILL_OBJ[name.toLowerCase()]; if(!sk) return; state.tab = D.skills.includes(sk)?'skills':D.summons.includes(sk)?'summons':'special'; resetSkillFilters(); state.q=sk.name.toLowerCase(); target=slug('sk',sk.name); document.getElementById('q').value=sk.name; }
  else if(kind==='status'){ const st=STATUS_OBJ[baseStatus(name).toLowerCase()]; if(!st) return; state.tab='status'; state.q=baseStatus(st.name).toLowerCase(); target=slug('st',st.name); document.getElementById('q').value=baseStatus(st.name); }
  else if(kind==='ab'){ state.tab='reference'; state.refSec = ATTRS.includes(name)?'attributes':'abilities'; state.q=name.toLowerCase(); document.getElementById('q').value=name; }
  remember(); render();
  const el = target && document.getElementById(target); if(el) el.scrollIntoView({block:'center'}); else window.scrollTo({top:0});
}
document.addEventListener('mousedown',e=>{ if(state.pickSlot && !e.target.closest('.picker') && !e.target.closest('[data-pick]')){ state.pickSlot=null; renderView(); } });
window.addEventListener('scroll',()=>{ if(state.pickSlot) positionPopups(); },{passive:true});
view.addEventListener('click',e=>{
  const pc=e.target.closest('.pc');
  if(pc && !pc.disabled){
    const m=pc.dataset.m, k=pc.dataset.k, p=party[m];
    p.known = p.known.includes(k) ? p.known.filter(x=>x!==k) : [...p.known,k];
    const sk = D.skills.find(s=>s.name===k), kn = p.known.includes(k), g = gearSkill(m,sk), ok = meets(m,sk);
    pc.className = 'pc '+(kn?'known':g?'gear':ok?'ok':'');
    queueSave(m); return;
  }
  const sc=e.target.closest('[data-skill]'); if(sc){ navTo('skill', sc.dataset.skill); return; }
  const stc=e.target.closest('[data-status]'); if(stc){ navTo('status', stc.dataset.status); return; }
  const abc=e.target.closest('[data-ab]'); if(abc){ navTo('ab', abc.dataset.ab); return; }
  const pc2=e.target.closest('[data-popclose]');
  if(pc2 && (pc2.tagName==='BUTTON' || e.target===pc2)){ state.popSlot=null; hideTip(); renderView(); return; }
  const po=e.target.closest('[data-pop]'); if(po){ state.pickSlot=null; state.popSlot=po.dataset.pop; hideTip(); renderView(); const f=view.querySelector('.pop select, .pop input'); if(f) f.focus(); return; }
  const md=e.target.closest('[data-mode]'); if(md){ state.editing = md.dataset.mode==='edit'; state.pickSlot=state.popSlot=null; renderView(); return; }
  const bk=e.target.closest('[data-back]'); if(bk){ state.partyView='overview'; state.pickSlot=state.popSlot=null; remember(); renderView(); return; }
  const op=e.target.closest('[data-open]'); if(op && !e.target.closest('a,button:not([data-open])')){ state.who=op.dataset.open; state.partyView='detail'; remember(); renderView(); window.scrollTo({top:0}); return; }
  if(e.target.closest('[data-pickclose]')){ state.pickSlot=null; renderView(); return; }
  const pi=e.target.closest('[data-pickitem]');
  if(pi){ const id=state.who, slot=state.pickSlot, v=pi.dataset.pickitem; state.pickSlot=null;
    if(v==='__new'){ const kinds=SL(slot)[2]; const iid=createItem({kind:kinds[0]}); equip(iid,id,slot); state.popSlot=slot; }
    else if(!v){ delete party[id].gear[slot]; queueSave(id,100); }
    else equip(v,id,slot);
    hideTip(); renderView(); positionPopups(); return; }
  const pk=e.target.closest('[data-pick]'); if(pk && !e.target.closest('[data-pop]')){ state.pickSlot = state.pickSlot===pk.dataset.pick ? null : pk.dataset.pick; state.popSlot=null; hideTip(); renderView(); positionPopups(); const s=view.querySelector('[data-picksearch]'); if(s) s.focus({preventScroll:true}); return; }
  const w=e.target.closest('[data-who]'); if(w){ state.who=w.dataset.who; state.popSlot=state.pickSlot=null; remember(); renderView(); return; }
  const ing=e.target.closest('[data-ing]'); if(ing){ state.ing=ing.dataset.ing; state.q=''; document.getElementById('q').value=''; render(); window.scrollTo({top:0}); return; }
  const ibrm=e.target.closest('[data-ibrm]'); if(ibrm){ const iid=ibrm.closest('[data-item]').dataset.item; bonusArr(ITEMS[iid], ibrm.dataset.sock).splice(+ibrm.dataset.ibrm,1); queueItem(iid,200); renderView(); return; }
  const trm=e.target.closest('[data-trm]'); if(trm){ const id=state.who; party[id].talents.splice(+trm.dataset.trm,1); queueSave(id,200); renderView(); return; }
  const cbrm=e.target.closest('[data-cbrm]'); if(cbrm){ state.calc.bonuses.splice(+cbrm.dataset.cbrm,1); renderView(); return; }
  if(e.target.closest('[data-calcsave]')){
    const types = calcTypes(); const t = types.find(x=>x.key===state.calc.type)||types[0]; const C = state.calc; const L = +C.level||1;
    const b = calcBase(t, L, C.rarity); const base = t.kind==='weapon' ? {damage:b.damage} : {phys:b.phys, magic:b.magic};
    const iid = createItem({name: C.name || `${C.rarity} ${t.label}`, kind:t.itemKind, type:t.key, level:L, rarity:C.rarity, bonuses:clone(C.bonuses), base});
    let msg = `Saved “${ITEMS[iid].name}” to Items`;
    if(C.equip){ const [m,s]=C.equip.split(':'); equip(iid,m,s); msg += ` and equipped it on ${party[m].name}`; }
    state.flash = msg + '.'; state.calc = {...state.calc, name:'', bonuses:[], equip:''}; renderView(); setTimeout(()=>{ state.flash=''; }, 4000); return;
  }
  if(e.target.closest('[data-newitem]')){ const k = view.querySelector('[data-newkind]').value; const iid = createItem({kind:k}); renderView(); refocus(`[data-item="${iid}"] [data-iname]`); return; }
  const del=e.target.closest('[data-del]');
  if(del){ const iid=del.dataset.del; if(state.confirmDel!==iid){ state.confirmDel=iid; renderView(); return; } state.confirmDel=null; unequip(iid); const host = socketedIn(iid); if(host){ ITEMS[host.id].st.rune='empty'; queueItem(host.id,50); } delete ITEMS[iid]; queueItem(iid,50); renderView(); return; }
});
view.addEventListener('keydown',e=>{
  if(e.target.dataset && e.target.dataset.picksearch){ if(e.key==='Enter'){ const f=[...view.querySelectorAll('.picker .prow')].find(r=>!r.hidden); if(f){ e.preventDefault(); f.click(); } return; } if(e.key==='ArrowDown'){ const f=[...view.querySelectorAll('.picker .prow')].find(r=>!r.hidden); if(f){ e.preventDefault(); f.focus(); } return; } }
  if(e.target.classList && e.target.classList.contains('prow') && (e.key==='ArrowDown'||e.key==='ArrowUp')){ e.preventDefault(); const rows=[...view.querySelectorAll('.picker .prow')].filter(r=>!r.hidden); const i=rows.indexOf(e.target); const n=rows[i+(e.key==='ArrowDown'?1:-1)]; if(n) n.focus(); else if(e.key==='ArrowUp'){ const s=view.querySelector('[data-picksearch]'); if(s) s.focus(); } return; }
  if(e.key==='Escape' && state.pickSlot){ const s=state.pickSlot; state.pickSlot=null; renderView(); const t=view.querySelector(`[data-pick="${s}"]`); if(t) t.focus(); return; }
  if(e.key==='Escape' && state.popSlot){ const s=state.popSlot; state.popSlot=null; renderView(); const t=view.querySelector(`[data-pop="${s}"]`); if(t) t.focus(); return; }
  if((e.key==='Enter'||e.key===' ') && e.target.dataset && (e.target.dataset.pick||e.target.dataset.open)){ e.preventDefault(); e.target.click(); return; }
  if((e.key==='Enter'||e.key===' ') && e.target.dataset && e.target.dataset.pop){ e.preventDefault(); e.target.click(); return; }
  if(e.key!=='Enter') return;
  const el = e.target;
  if(el.dataset.iadd){
    const iid = el.closest('[data-item]').dataset.item; const b=parseBonus(el.value); if(!b) return; e.preventDefault();
    bonusArr(ITEMS[iid], el.dataset.sock).push(b); queueItem(iid,200); renderView(); refocus(`[data-item="${iid}"] [data-iadd][data-sock="${el.dataset.sock||''}"]`);
  } else if(el.dataset.cadd){
    const b=parseBonus(el.value); if(!b) return; e.preventDefault(); state.calc.bonuses.push(b); renderView(); refocus('[data-cadd]');
  } else if(el.dataset.tadd){
    const t=el.value.trim(); if(!t) return; e.preventDefault(); const id=state.who;
    const hit = refRows('talents').find(x=>String(x.name).toLowerCase()===t.toLowerCase());
    party[id].talents.push(hit?hit.name:t); queueSave(id,200); renderView(); refocus('[data-tadd]');
  }
});
view.addEventListener('change',e=>{
  const el=e.target;
  if(el.tagName==='SELECT' && el.closest('[data-item]')){ recalc(); renderKeep(); return; }
  if(el.tagName==='INPUT' && el.closest('[data-item]') && !el.dataset.iadd){ deferred = true; }
  if(el.dataset.slotsel){
    const id=state.who, slot=el.dataset.slotsel, v=el.value;
    if(v==='__new'){ const kinds = SLOTS.find(s=>s[0]===slot)[2]; const iid=createItem({kind:kinds[0]}); equip(iid,id,slot); renderView(); refocus(`[data-item="${iid}"] [data-iname]`); return; }
    if(!v){ delete party[id].gear[slot]; queueSave(id,100); } else equip(v,id,slot);
    renderView(); return;
  }
  if(el.dataset.equipsel){
    const iid=el.dataset.equipsel, v=el.value; if(!v) return;
    if(v==='unequip') unequip(iid); else { const [m,s]=v.split(':'); equip(iid,m,s); }
    renderView(); return;
  }
});
view.addEventListener('input',e=>{
  const el=e.target;
  if(el.dataset.picksearch){ const q=el.value.trim().toLowerCase(); let n=0; view.querySelectorAll('.picker .prow').forEach(r=>{ const ok=!q||r.dataset.q.includes(q); r.hidden=!ok; if(ok) n++; }); const em=view.querySelector('.picker .pempty'); if(em) em.hidden = n>0; return; }
  if(el.dataset.calc){ state.calc[el.dataset.calc] = el.dataset.calc==='level' ? (parseInt(el.value)||1) : el.value; if(el.dataset.calc==='type') state.calc.equip=''; remember(); if(el.dataset.calc!=='level' || el.value) { const f=el.dataset.calc; renderView(); const back=view.querySelector(`[data-calc="${f}"]`); if(back&&f==='level'){ back.focus(); const n=back.value.length; try{back.setSelectionRange(n,n);}catch(_){} } } return; }
  if(el.dataset.calcf){ state.calc[el.dataset.calcf] = el.value; return; }
  const ied = el.closest('[data-item]');
  if(ied && (el.dataset.ist || el.dataset.itype)){
    const iid=ied.dataset.item; const it=ITEMS[iid]; if(!it) return;
    if(el.dataset.itype){ it.type = el.value || null; delete it.hands; queueItem(iid); return; }
    it.st = it.st || {}; const f = el.dataset.ist; let v = el.tagName==='SELECT' ? (el.value||null) : (el.value===''?null:+el.value);
    if(f==='rune' && v==='__newrune'){ v = createItem({kind:'rune', name:'', runeFx:{}}); }
    if(f.startsWith('dmg.')){ it.st.dmg = {type:'Physical', ...(it.st.dmg||{}), [f.slice(4)]: v}; if(f==='dmg.type'){ const ic=el.closest('label').querySelector('[aria-hidden]'); if(ic) ic.textContent = DMG_EMO[v]||'⚔️'; } }
    else if(f.startsWith('extra.')){ const e = {type:'Fire', ...((it.st.extra||[])[0]||{}), [f.slice(6)]: v}; it.st.extra = (e.min==null&&e.max==null) ? [] : [e]; }
    else it.st[f] = v;
    queueItem(iid); return;
  }
  if(ied && (el.dataset.iname||el.dataset.irar||el.dataset.ilvl)){
    const iid=ied.dataset.item; const it=ITEMS[iid]; if(!it) return;
    if(el.dataset.iname) it.name=el.value; else if(el.dataset.irar){ it.rarity=el.value; const c=rcol(it.rarity); el.style.setProperty('--rc',c); el.dataset.rar=it.rarity; const n=ied.querySelector('[data-iname]'); n.style.setProperty('--rc',c); n.classList.toggle('rarname',!!it.rarity); const card=ied.closest('.rrow'); if(card) card.style.setProperty('--c', c||'var(--line)'); } else it.level=parseInt(el.value)||null;
    queueItem(iid); return;
  }
  const sec=el.closest('.member'); if(!sec) return;
  const id=sec.dataset.m, p=party[id];
  if(el.dataset.pt){ const v=el.value===''?undefined:Math.max(0,parseInt(el.value)||0); p.points={...p.points}; if(v==null) delete p.points[el.dataset.pt]; else p.points[el.dataset.pt]=v; refreshTotals(id); }
  else if(el.dataset.at){ const v=el.value===''?undefined:Math.max(0,parseInt(el.value)||0); p.attributes={...p.attributes}; if(v==null) delete p.attributes[el.dataset.at]; else p.attributes[el.dataset.at]=v; refreshTotals(id); }
  else if(el.dataset.f==='level'){ p.level=parseInt(el.value)||0; refreshTotals(id); }
  else if(el.dataset.f==='notes'){ p.notes=el.value; }
  else if(['race','gender'].includes(el.dataset.f)){ p[el.dataset.f]=el.value||null; queueSave(id); renderKeep(); return; }
  else if(el.dataset.f==='undead'){ p.undead=el.checked; queueSave(id); renderKeep(); return; }
  else return;
  queueSave(id);
});

// ---------- tooltip ----------
const tip = document.createElement('div'); tip.id='tip'; tip.className='tip'; tip.setAttribute('role','tooltip'); tip.hidden=true; document.body.appendChild(tip);
function showTip(el){
  if(tipPinned || tip.classList.contains('held')) return;
  if(state.pickSlot && el.dataset.pick) return;
  let html = '';
  if(el.dataset.skill){ const sk = SKILL_OBJ[el.dataset.skill.toLowerCase()]; if(!sk) return; html = skillTip(sk) + (el.dataset.from?`<div class="note">From ${esc(el.dataset.from)}</div>`:''); }
  else if(el.dataset.status){ const st = STATUS_OBJ[baseStatus(el.dataset.status).toLowerCase()]; if(!st) return; html = statusTip(st); }
  else if(el.dataset.ab){ html = abTip(el.dataset.ab); }
  else if(el.dataset.itemtip!=null){ const it = ITEMS[el.dataset.itemtip]; if(!it) return; html = itemTip({...it, id: el.dataset.itemtip}); }
  else return;
  tip.innerHTML = html; tip.hidden=false;
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  let x = Math.min(window.innerWidth - w - 8, Math.max(8, r.left)); let y = r.bottom + 6;
  if(y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 6);
  tip.style.left = x+'px'; tip.style.top = y+'px';
}
let tipPinned = false, tipHover = false;
function hideTip(force){ if((tipPinned || tip.classList.contains('held')) && !force) return; tip.hidden=true; tip.classList.remove('pinned','held'); }
function setPinned(on){
  if(on){ tipPinned = !tip.hidden; tip.classList.toggle('pinned', tipPinned); return; }
  const over = tipHover || tip.matches(':hover');
  tipPinned = false; tip.classList.remove('pinned');
  if(over && !tip.hidden) tip.classList.add('held');      // stay until the mouse leaves it
  else { tip.hidden = true; tip.classList.remove('held'); }
}
window.addEventListener('keydown', e=>{ if(e.key==='Control'||e.key==='Meta') setPinned(true); });
window.addEventListener('keyup', e=>{ if(e.key==='Control'||e.key==='Meta') setPinned(false); });
window.addEventListener('blur', ()=>setPinned(false));
tip.addEventListener('mouseenter', ()=>{ tipHover = true; });
tip.addEventListener('mouseleave', ()=>{ tipHover = false; if(!tipPinned){ tip.classList.remove('held'); hideTip(true); } });
tip.addEventListener('click', e=>{
  const sc=e.target.closest('[data-skill]'), st=e.target.closest('[data-status]'), ab=e.target.closest('[data-ab]');
  if(sc||st||ab){ tipPinned=false; hideTip(true); navTo(sc?'skill':st?'status':'ab', (sc||st||ab).dataset[sc?'skill':st?'status':'ab']); }
});
const TIPSEL = '[data-skill],[data-status],[data-ab],[data-itemtip]';
view.addEventListener('mouseover',e=>{ const c=e.target.closest(TIPSEL); if(c) showTip(c); });
view.addEventListener('mouseout',e=>{ const c=e.target.closest(TIPSEL); if(c && !c.contains(e.relatedTarget) && !(e.relatedTarget && tip.contains(e.relatedTarget))) hideTip(); });
view.addEventListener('focusin',e=>{ const c=e.target.closest(TIPSEL); if(c) showTip(c); });
view.addEventListener('focusout',e=>{ if(e.target.closest(TIPSEL)) hideTip(); });
window.addEventListener('scroll',()=>hideTip(),{passive:true});
view.addEventListener('toggle',e=>{ const d=e.target; if(d.matches && d.matches('details.sect')){ state.sects = {...(state.sects||{}), [d.dataset.sect]: d.open}; remember(); } }, true);
view.addEventListener('focusout',e=>{
  const to = e.relatedTarget;
  if(to && /INPUT|TEXTAREA|SELECT|BUTTON/.test(to.tagName)) return;   // moving between fields: wait
  if(deferred){ deferred = false; setTimeout(()=>{ if(!(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) render(); }, 0); }
});

render(); saveIndicator();
(async()=>{
  try{
    db = window.claude ? await window.claude.use('db') : null;
    const user = window.claude ? await window.claude.use('user') : null;
    if(!db){ refErr='Reference data lives in this page\'s database, which is unavailable in this view.'; render(); return; }
    let cw = user ? await user.can('data.write') : null;
    canWrite = cw!==false; saveIndicator();
    const typing = () => document.activeElement && document.activeElement.closest('#view') && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    db.collection('party').onSnapshot(snap=>{
      for(const d of snap.docs){ const m = MEMBERS.find(x=>x.id===d.id); if(m){ synced['party/'+d.id] = normalize(d.data(), m); if(!dirty['party/'+d.id]) party[d.id] = normalize(d.data(), m); } }
      partyLoaded=true;
      if(!typing()) render(); else { deferred = true; renderTabs(); }
    }, err=>{ setLine('Party sync stopped: '+err.code); });
    db.collection('items').onSnapshot(snap=>{
      const seen = new Set();
      for(const d of snap.docs){ seen.add(d.id); synced['items/'+d.id] = clone(d.data()); if(!dirty['items/'+d.id]) ITEMS[d.id] = clone(d.data()); }
      for(const k of Object.keys(ITEMS)) if(!seen.has(k) && !dirty['items/'+k]) delete ITEMS[k];
      if(!typing()) render(); else { deferred = true; renderTabs(); }
    }, err=>{ setLine('Item sync stopped: '+err.code); });
    db.collection('ref').onSnapshot(snap=>{
      const r = {}; for(const d of snap.docs) r[d.id] = d.data();
      REF = r; refErr = null;
      if(!typing()) render(); else { deferred = true; renderTabs(); }
    }, err=>{ refErr = 'Could not load reference data ('+err.code+').'; render(); });
  }catch(e){ db=null; refErr='Reference data is unavailable in this view.'; render(); }
})();
