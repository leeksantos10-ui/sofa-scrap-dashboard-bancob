/**
 * Parser isolado da Análise Pré.
 * Não acessa Supabase nem altera o histórico definitivo.
 */
const ALIASES = {
  data: ['data','date','data jogo','data do jogo','kickoff','datetime'],
  confronto: ['confronto','jogo','partida','fixture','match','home away'],
  casa: ['casa','mandante','home','time casa','equipe casa','home team'],
  visitante: ['visitante','fora','away','time visitante','equipe visitante','away team'],
  campeonato: ['campeonato','competicao','competição','league','torneio','competition'],
  temporada: ['temporada','season','ano temporada'],
  rodada: ['rodada','round','matchday']
};
const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
function delimiterFor(line, choice='auto') {
  if (choice === 'tab') return '\t';
  if (choice === 'comma') return ',';
  if (choice === 'semicolon') return ';';
  let best=',', bestCount=-1, quote=false;
  const counts={',':0,';':0,'\t':0};
  for (let i=0;i<line.length;i++) {
    if(line[i]==='"' && line[i+1]==='"' && quote){i++;continue}
    if(line[i]==='"'){quote=!quote;continue}
    if(!quote && Object.hasOwn(counts,line[i])) counts[line[i]]++;
  }
  for(const d of ['\t',';',',']) if(counts[d]>bestCount){best=d;bestCount=counts[d]}
  return best;
}
function parseDelimitedLine(line, delimiter) {
  const cells=[]; let cell='', quote=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(quote && line[i+1]==='"'){cell+='"';i++}
      else quote=!quote;
    } else if(ch===delimiter && !quote){cells.push(cell.trim());cell=''}
    else cell+=ch;
  }
  if(quote) throw new Error('Há uma aspa sem fechamento em uma das linhas do arquivo.');
  cells.push(cell.trim());
  return cells;
}
function canonicalHeaders(headers) {
  return headers.map(h=>{
    const key=norm(h);
    for(const [field,aliases] of Object.entries(ALIASES)) if(aliases.some(a=>norm(a)===key)) return field;
    return key.replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') || 'coluna';
  });
}
export function parsePreliminaryFile(text, delimiter='auto', options={}) {
  if(typeof text!=='string' || !text.trim()) throw new Error('O arquivo está vazio.');
  const maxRows=Number.isInteger(options.maxRows)?Math.min(Math.max(options.maxRows,1),5000):5000;
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim());
  if(lines.length<2) throw new Error('O arquivo precisa ter cabeçalho e pelo menos um jogo.');
  const sep=delimiterFor(lines[0],delimiter);
  const headers=canonicalHeaders(parseDelimitedLine(lines[0],sep));
  if(headers.length<2) throw new Error('Não foi possível identificar as colunas.');
  const idx={};headers.forEach((h,i)=>{if(!idx[h])idx[h]=i});
  const get=(row,field)=>idx[field]===undefined?'':String(row[idx[field]]??'').trim();
  const rows=[];
  for(let i=1;i<lines.length;i++){
    if(rows.length>=maxRows) throw new Error('O arquivo excede o limite de '+maxRows+' jogos por importação.');
    const cells=parseDelimitedLine(lines[i],sep);
    if(cells.every(v=>!String(v).trim())) continue;
    let casa=get(cells,'casa'), visitante=get(cells,'visitante');
    let confronto=get(cells,'confronto');
    if(!confronto && casa && visitante) confronto=casa+' x '+visitante;
    if(!confronto) throw new Error('Linha '+(i+1)+': confronto ausente. Informe uma coluna de confronto ou casa e visitante.');
    const odds={};
    for(let j=0;j<headers.length;j++){
      const raw=String(headers[j]);
      if(/^odd[_ ]/i.test(raw)||/^odds?[_ ]/i.test(raw)) {
        const val=String(cells[j]??'').trim().replace(',','.');
        if(val && Number.isFinite(Number(val)) && Number(val)>1) odds[raw]=Number(val);
      }
    }
    const rawData=get(cells,'data');
    rows.push({
      data:rawData||null,
      confronto,
      casa:casa||null,
      visitante:visitante||null,
      campeonato:get(cells,'campeonato')||'Sem campeonato',
      temporada:get(cells,'temporada')||null,
      rodada:get(cells,'rodada')||null,
      odds,
      dados_importados:Object.fromEntries(headers.map((h,j)=>[h,String(cells[j]??'').trim()]))
    });
  }
  if(!rows.length) throw new Error('Não encontrei jogos válidos no arquivo.');
  return {delimiter:sep,headers,rows,totalLines:lines.length-1,truncated:false};
}
function normalizeGameDate(value) {
  const raw=String(value??'').trim();
  if(!raw) return null;
  let match=raw.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})(?:[T ].*)?$/);
  let year,month,day;
  if(match){year=Number(match[1]);month=Number(match[2]);day=Number(match[3]);}
  else {
    match=raw.match(/^(\\d{1,2})[\\/. -](\\d{1,2})[\\/. -](\\d{4})$/);
    if(!match) throw new Error('Data inválida: '+raw+'. Use AAAA-MM-DD ou DD/MM/AAAA.');
    day=Number(match[1]);month=Number(match[2]);year=Number(match[3]);
  }
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day) {
    throw new Error('Data inválida: '+raw+'.');
  }
  return [String(year).padStart(4,'0'),String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
}

export function validatePreliminaryRows(rows) {
  if(!Array.isArray(rows)||!rows.length) throw new Error('Nenhum jogo válido para importar.');
  if(rows.length>5000) throw new Error('Importe no máximo 5.000 jogos por arquivo.');
  const seen=new Set(), clean=[];
  for(const [i,row] of rows.entries()){
    const confronto=String(row?.confronto||'').trim();
    if(!confronto) throw new Error('Jogo '+(i+1)+': confronto obrigatório.');
    const campeonato=String(row?.campeonato||'Sem campeonato').trim()||'Sem campeonato';
    const data=normalizeGameDate(row?.data);
    const key=[norm(campeonato),norm(data||''),norm(confronto)].join('|');
    if(seen.has(key)) continue;
    seen.add(key);
    clean.push({
      data, confronto, campeonato,
      temporada:row?.temporada==null?null:String(row.temporada).trim()||null,
      rodada:row?.rodada==null?null:String(row.rodada).trim()||null,
      odds:row?.odds && typeof row.odds==='object' && !Array.isArray(row.odds)?row.odds:{},
      dados_importados:row?.dados_importados && typeof row.dados_importados==='object' && !Array.isArray(row.dados_importados)?row.dados_importados:{},
      status:'pendente'
    });
  }
  if(!clean.length) throw new Error('Não restaram jogos válidos após a validação.');
  return clean;
}
