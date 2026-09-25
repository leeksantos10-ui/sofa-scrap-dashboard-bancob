// Sofa Scrap — GitHub/Render ROOT-ONLY build — P/L FILTER FIX 01
// Tudo fica em um único arquivo para facilitar upload pelo celular.
// A lógica do dashboard/API foi preservada; apenas a camada HTTP foi adaptada
// para rodar como Web Service Node no Render, sem a pasta /api.
import http from 'node:http';
import {URL} from 'node:url';

const INDEX_HTML="<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Sofa Scrap</title><link rel=\"stylesheet\" href=\"styles.css\">\n<script src=\"https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js\"></script></head><body><div class=\"app\"><aside class=\"sidebar\"><div class=\"brand\"><span class=\"brand-mark\">\u25a5</span><span>Sofa <b>Scrap</b></span></div><nav>\n<button class=\"nav active\" data-page=\"dashboard\">\u2302 <span>Dashboard</span></button><button class=\"nav\" data-page=\"backtest\">\u2301 <span>Backtest</span></button><button class=\"nav\" data-page=\"metricas\">\u223f <span>M\u00e9tricas</span></button><button class=\"nav\" data-page=\"filtros\">\u2315 <span>Filtros</span></button><button class=\"nav\" data-page=\"campeonatos\">\u265c <span>Campeonatos</span></button><button class=\"nav\" data-page=\"relatorios\">\u25a4 <span>Relat\u00f3rios</span></button><button class=\"nav\" data-page=\"importacao\">\u21e9 <span>Importa\u00e7\u00e3o</span></button><button class=\"nav\" data-page=\"config\">\u2699 <span>Configura\u00e7\u00f5es</span></button></nav><div class=\"db\"><small>Banco de dados</small><strong><i></i> <span id=\"sideStatus\">Conectando...</span></strong><small>Banco B \u2022 Sofa Scrap</small></div></aside><main><header class=\"mobileHead\"><div class=\"mobileBrand\"><img src=\"logo.svg\" alt=\"Sofa Scrap\"><b>Sofa Scrap</b></div><span id=\"mobilePage\">Dashboard <small id=\"appVersion\">V47</small></span></header>\n<section id=\"page-dashboard\" class=\"page active\"><header class=\"top\"><div class=\"dashboardBrand\"><img src=\"logo.svg\" alt=\"Sofa Scrap\"><div><h1>Dashboard</h1><p>Vis\u00e3o geral da estrat\u00e9gia \u2022 o filtro salvo vale para todos os gr\u00e1ficos</p></div></div><div class=\"filters\"><label>Temporada<select id=\"season\"><option>Todos</option></select></label><label>Campeonatos<div id=\"dashChampPicker\" class=\"champPicker\"></div></label><label>Filtro<select id=\"dashFilter\"><option value=\"\">Sem filtro</option></select></label><label>Mercado<select id=\"market\"><option>OVER_0_5</option><option>UNDER_0_5</option><option>OVER_1_5</option><option>UNDER_1_5</option><option selected>OVER_2_5</option><option>UNDER_2_5</option><option>OVER_3_5</option><option>UNDER_3_5</option><option>1X2_CASA</option><option>1X2_EMPATE</option><option>1X2_VISITANTE</option><option>DC_1X</option><option>DC_12</option><option>DC_X2</option><option>DNB_CASA</option><option>DNB_VISITANTE</option><option>BTTS_SIM</option><option>BTTS_NAO</option></select></label><label>P/L calculado por<select id=\"pnlRef\"><option value=\"365\">Odd 365 (Banco B)</option><option value=\"JUSTA\">Odd Justa</option></select></label><button class=\"apply\" id=\"apply\">Aplicar</button><small class=\"muted applyHint\">Ao aplicar, os KPIs e gr\u00e1ficos ser\u00e3o recalculados para o filtro e mercado escolhidos.</small></div></header><section class=\"cards\"><article><small>Entradas</small><strong id=\"entries\">0</strong></article><article><small>Winrate</small><strong id=\"winrate\">0,0%</strong></article><article><small>Odd m\u00e9dia</small><strong id=\"avgodd\">0,00</strong></article><article><small>Lucro l\u00edquido</small><strong id=\"profit\">+0,00</strong></article><article><small>ROI</small><strong id=\"roi\">0,0%</strong></article><article><small>Drawdown</small><strong id=\"dd\">-0,00</strong></article><article><small>Odd justa m\u00e9dia</small><strong id=\"fairOdd\">0,00</strong></article><article><small>P/L justo l\u00edquido</small><strong id=\"fairProfit\">+0,00</strong></article><article><small>ROI justo</small><strong id=\"fairROI\">0,0%</strong></article></section><section class=\"grid2\"><article class=\"panel chart\"><div class=\"panel-head\"><h2>Evolu\u00e7\u00e3o da Estrat\u00e9gia</h2><small>Lucro acumulado</small></div><svg id=\"curve\" viewBox=\"0 0 700 260\" preserveAspectRatio=\"none\"></svg></article><article class=\"panel monthly\"><div class=\"panel-head\"><h2>Resultado por M\u00eas</h2></div><div class=\"bars\" id=\"monthlyBars\"></div><div class=\"months\" id=\"monthlyLabels\"></div></article></section><section class=\"grid3\"><article class=\"panel\"><div class=\"panel-head\"><h2>Desempenho por Campeonato</h2></div><div class=\"tableWrap\"><table><thead><tr><th>Campeonato</th><th>Entradas</th><th>Winrate</th><th>Lucro</th><th>ROI</th></tr></thead><tbody id=\"champBody\"></tbody></table></div></article><article class=\"panel donut\"><div class=\"panel-head\"><h2>Distribui\u00e7\u00e3o</h2></div><div class=\"donut-circle\" id=\"donut\"><b id=\"distTotal\">0</b><small>Entradas</small></div><p>\ud83d\udfe2 <span id=\"greenCount\">Green 0</span> &nbsp; \ud83d\udd34 <span id=\"redCount\">Red 0</span></p></article></section><section class=\"panel blockReport\"><div class=\"panel-head\"><h2>Desempenho por 10 Blocos</h2><span class=\"muted\">Ordem cronol\u00f3gica \u2022 filtro e mercado atuais</span></div><div id=\"blockTabs\" class=\"blockTabs\"></div><div class=\"tableWrap\"><table><thead><tr><th>Bloco</th><th>Entradas</th><th>Green</th><th>Red</th><th>Winrate</th><th>Odd m\u00e9dia</th><th>P/L</th><th>ROI</th></tr></thead><tbody id=\"blockBody\"></tbody></table></div></section><section class=\"panel recentPanel\"><div class=\"panel-head\"><div><h2>Entradas Recentes</h2><span id=\"recentSummary\" class=\"muted\">Todas as entradas do recorte</span></div><label class=\"pageSize\">20 por p\u00e1gina<select id=\"recentPageSize\"><option value=\"20\" selected>20</option><option value=\"50\">50</option><option value=\"100\">100</option></select></label></div><div class=\"tableWrap\"><table><thead><tr><th>#</th><th>Data</th><th>Confronto</th><th>Campeonato</th><th>Mercado</th><th>Odd</th><th>Resultado</th><th>P/L</th></tr></thead><tbody id=\"recentBody\"></tbody></table></div><div id=\"recentPagination\" class=\"pagination\"></div></section><section class=\"panel champReport\"><div class=\"panel-head\"><h2>Relat\u00f3rio por Campeonato</h2><span class=\"muted\">Para o filtro e mercado atuais</span></div><div class=\"tableWrap\"><table><thead><tr><th>Campeonato</th><th>Entradas</th><th>Green</th><th>Red</th><th>Winrate</th><th>Odd m\u00e9dia</th><th>P/L</th><th>ROI</th></tr></thead><tbody id=\"champReportBody\"></tbody></table></div></section><section class=\"panel\"><div class=\"panel-head\"><h2>P/L por Mercado</h2><small>Mesmo filtro \u2022 todos os mercados</small></div><div id=\"marketListBottom\"></div></section></section>\n<section id=\"page-backtest\" class=\"page\"><div class=\"top\"><div><h1>Backtest</h1><p>Configure e execute testes usando o Banco B.</p></div></div><div class=\"panel formPanel\"><div class=\"formGrid\"><label>Nome<input id=\"btName\" value=\"Meu Backtest\"></label><label>Filtro salvo<select id=\"btFilter\"><option value=\"\">Sem filtro</option></select></label><label>Mercado<select id=\"btMarket\"><option>OVER_0_5</option><option>UNDER_0_5</option><option>OVER_1_5</option><option>UNDER_1_5</option><option selected>OVER_2_5</option><option>UNDER_2_5</option><option>OVER_3_5</option><option>UNDER_3_5</option><option>1X2_CASA</option><option>1X2_EMPATE</option><option>1X2_VISITANTE</option><option>DC_1X</option><option>DC_12</option><option>DC_X2</option><option>DNB_CASA</option><option>DNB_VISITANTE</option><option>BTTS_SIM</option><option>BTTS_NAO</option></select></label><label>Stake fixa<input id=\"btStake\" type=\"number\" step=\"0.01\" min=\"0.01\" value=\"1\"></label><label>Odd m\u00ednima<input id=\"btOddMin\" type=\"number\" step=\"0.01\" min=\"0\" placeholder=\"Sem limite\"></label><label>Odd m\u00e1xima<input id=\"btOddMax\" type=\"number\" step=\"0.01\" min=\"0\" placeholder=\"Sem limite\"></label><label>Temporada<select id=\"btSeason\"><option>Todos</option></select></label><label>Campeonato<select id=\"btChamp\"><option>Todos</option></select></label></div><button class=\"apply\" id=\"createBT\">Salvar e executar</button><div id=\"btMsg\" class=\"statusBox\"></div></div><div class=\"cards mini\"><article><small>Entradas</small><strong id=\"btEntries\">0</strong></article><article><small>Winrate</small><strong id=\"btWin\">0,0%</strong></article><article><small>Lucro</small><strong id=\"btProfit\">+0,00</strong></article><article><small>ROI</small><strong id=\"btROI\">0,0%</strong></article><article><small>Drawdown</small><strong id=\"btDD\">-0,00</strong></article></div><div class=\"panel\"><div class=\"panel-head\"><h2>\u00daltimas configura\u00e7\u00f5es</h2><span id=\"btConfigCount\" class=\"muted\"></span></div><div id=\"btConfigList\" class=\"savedList\"></div></div><div class=\"panel\"><div class=\"panel-head\"><h2>\u00daltimas entradas do backtest</h2></div><div class=\"tableWrap\"><table><thead><tr><th>Data</th><th>Confronto</th><th>Campeonato</th><th>Odd</th><th>Resultado</th><th>P/L</th></tr></thead><tbody id=\"btRows\"></tbody></table></div></div></section>\n<section id=\"page-metricas\" class=\"page\"><div class=\"top\"><div><h1>M\u00e9tricas</h1><p>Crie e gerencie as m\u00e9tricas hist\u00f3ricas que ser\u00e3o usadas nos filtros e backtests.</p></div></div><div class=\"panel formPanel metricBuilder\"><div class=\"panel-head\"><h2>+ Nova m\u00e9trica</h2><span class=\"muted\">A configura\u00e7\u00e3o \u00e9 salva no Banco B</span></div><div class=\"formGrid\"><label>Nome<input id=\"metricName\" placeholder=\"Ex.: Gols Casa \u00daltimos 5\"></label><div id=\"metricNormalFields\" class=\"formGrid metricNormalFields\"><label>Campo<select id=\"metricField\"><option value=\"\">Carregando campos...</option></select></label><label>Contexto<select id=\"metricContext\"><option>CASA</option><option>FORA</option><option>GERAL</option></select></label><label>Opera\u00e7\u00e3o<select id=\"metricOperation\"><option>MEDIA</option><option>VALOR</option><option>SOMA</option><option>MIN</option><option>MAX</option><option>DESVIO_PADRAO</option><option>CV</option></select></label><label>Janela de jogos<input id=\"metricWindow\" type=\"number\" min=\"1\" value=\"5\"></label><label>M\u00ednimo de jogos<input id=\"metricMinimum\" type=\"number\" min=\"1\" value=\"3\"></label></div></div><div id=\"metricCompositeFields\" class=\"metricCompositeFields\" style=\"display:none\"><label>Opera\u00e7\u00e3o da composi\u00e7\u00e3o<select id=\"metricCompositeOperation\"><option>MEDIA</option><option>SOMA</option><option>SUBTRACAO</option><option>MULTIPLICACAO</option><option>DIVISAO</option></select></label><div id=\"metricComponents\"></div><button type=\"button\" class=\"secondary\" id=\"addMetricComponent\">+ Adicionar m\u00e9trica</button><small class=\"muted\">Combine 2 ou mais m\u00e9tricas j\u00e1 cadastradas. A composi\u00e7\u00e3o pode ser usada depois nos filtros.</small></div><div class=\"metricSpecial\"><label>Tipo<select id=\"metricType\"><option value=\"NORMAL\">M\u00e9trica normal</option><option value=\"CUSTO_PONTO\">Custo do Ponto</option><option value=\"COMPOSTA\">M\u00e9trica composta</option></select></label><label>Descri\u00e7\u00e3o<input id=\"metricDescription\" placeholder=\"Opcional\"></label></div><div class=\"rowBtns\"><button class=\"apply\" id=\"saveMetric\">Salvar m\u00e9trica</button><button class=\"secondary\" id=\"clearMetric\">Limpar</button></div><div id=\"metricMsg\" class=\"statusBox\"></div></div><div class=\"panel\"><div class=\"panel-head\"><h2>M\u00e9tricas cadastradas</h2><span id=\"metricCount\" class=\"muted\"></span></div><div class=\"tableWrap\"><table><thead><tr><th>ID</th><th>Nome</th><th>Campo</th><th>Contexto</th><th>Janela</th><th>M\u00ednimo</th><th>Opera\u00e7\u00e3o</th><th>Status</th><th>A\u00e7\u00e3o</th></tr></thead><tbody id=\"metricBody\"></tbody></table></div></div></section>\n<section id=\"page-filtros\" class=\"page\"><div class=\"top\"><div><h1>Criador de Filtros</h1><p>Monte condi\u00e7\u00f5es e salve a estrat\u00e9gia no Banco B.</p></div></div><div class=\"panel formPanel\"><div class=\"formGrid\"><label>Nome do filtro<input id=\"filterName\" value=\"Novo filtro\"></label><label>L\u00f3gica entre condi\u00e7\u00f5es<select id=\"filterLogic\"><option value=\"E\">E \u2014 todas devem ser verdadeiras</option><option value=\"OU\">OU \u2014 pelo menos uma</option></select></label></div><label class=\"champLabel\">Campeonatos do filtro<div id=\"filterChampPicker\" class=\"champPicker\"></div><small class=\"muted\">Escolha Todos ou marque um ou v\u00e1rios campeonatos. Essa sele\u00e7\u00e3o fica salva junto com o filtro.</small></label><div id=\"conditions\"></div><div class=\"rowBtns\"><button class=\"secondary\" id=\"addCondition\">+ Adicionar condi\u00e7\u00e3o</button><button class=\"apply\" id=\"saveFilter\">Salvar filtro</button></div><div id=\"filterMsg\" class=\"statusBox\"></div></div><div class=\"panel\"><div class=\"panel-head\"><h2>Filtros salvos</h2></div><div id=\"savedFilters\" class=\"savedList\"></div></div></section>\n<section id=\"page-campeonatos\" class=\"page\"><div class=\"top\"><div><h1>Campeonatos</h1><p>Vis\u00e3o consolidada dos campeonatos dispon\u00edveis no Banco B.</p></div></div><div class=\"panel\"><div class=\"tableWrap\"><table><thead><tr><th>Campeonato</th><th>Entradas</th><th>Winrate</th><th>Lucro</th><th>ROI</th></tr></thead><tbody id=\"champPageBody\"></tbody></table></div></div></section>\n<section id=\"page-relatorios\" class=\"page\"><div class=\"top\"><div><h1>Relat\u00f3rios</h1><p>Relat\u00f3rios r\u00e1pidos a partir do filtro atual do Dashboard.</p></div></div><div class=\"grid2\"><div class=\"panel\"><h2>Resumo mensal</h2><div class=\"tableWrap\"><table><thead><tr><th>M\u00eas</th><th>Entradas</th><th>Green</th><th>Winrate</th><th>Lucro</th><th>ROI</th></tr></thead><tbody id=\"reportMonth\"></tbody></table></div></div><div class=\"panel\"><h2>Resumo por campeonato</h2><div class=\"tableWrap\"><table><thead><tr><th>Campeonato</th><th>Entradas</th><th>Green</th><th>Winrate</th><th>Lucro</th></tr></thead><tbody id=\"reportChamp\"></tbody></table></div></div></div></section>\n<section id=\"page-importacao\" class=\"page\"><div class=\"top\"><div><h1>Importa\u00e7\u00e3o</h1><p>Adicione jogos ao Banco B. Os dados ficam salvos permanentemente.</p></div></div><div class=\"importOverview\"><article><small>Banco B</small><strong id=\"dbGameCount\">0</strong><span>jogos salvos permanentemente</span></article><div><b>Como funciona</b><span>1. Escolha o arquivo \u2192 2. Confira novos e existentes \u2192 3. Confirme a importa\u00e7\u00e3o.</span></div></div><div class=\"panel formPanel importDangerPanel\"><div class=\"panel-head\"><h2>Excluir uma temporada</h2><span class=\"muted\">Apaga somente os jogos daquela temporada</span></div><div class=\"rowBtns\"><label style=\"flex:1;min-width:180px\">Temporada<select id=\"deleteSeason\"><option>Carregando...</option></select></label><button class=\"danger\" id=\"deleteSeasonBtn\" disabled>Apagar temporada</button></div><div id=\"deleteSeasonMsg\" class=\"statusBox\"></div><small class=\"muted\">Esta a\u00e7\u00e3o \u00e9 permanente. Os filtros, m\u00e9tricas e configura\u00e7\u00f5es n\u00e3o ser\u00e3o apagados.</small></div><div class=\"panel formPanel importPanel\"><div class=\"panel-head\"><h2>1. Escolher arquivo</h2><span class=\"muted\">XLSX / CSV / TSV / TXT</span></div><div class=\"importDrop\" id=\"importDrop\"><div class=\"importIcon\">\u21e9</div><strong>Selecione ou arraste seu arquivo aqui</strong><small>Use o TSV gerado pela extens\u00e3o Sofa Scrap ou uma planilha exportada.</small><input id=\"importFile\" type=\"file\" accept=\".xlsx,.xls,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain\"></div><div class=\"importFileName\" id=\"importFileName\"></div><div class=\"rowBtns\"><button class=\"apply\" id=\"startImport\" disabled>2. Conferir e importar</button><button class=\"secondary\" id=\"clearImport\">Limpar</button></div><div class=\"importStatus\" id=\"importStatus\"><span class=\"statusDot\"></span><b>Aguardando arquivo</b></div><div class=\"progressWrap\"><div class=\"progressTrack\"><div class=\"progressBar\" id=\"importProgress\"></div></div><div class=\"progressText\"><span id=\"importProgressText\">0%</span><span id=\"importProgressLabel\">Pronto para importar</span></div></div><div class=\"importStats\"><article><small>Arquivo</small><strong id=\"importTotal\">0</strong><span>jogos lidos</span></article><article><small>Importados</small><strong id=\"importInserted\">0</strong><span>jogos novos</span></article><article><small>J\u00e1 existentes</small><strong id=\"importSkipped\">0</strong><span>n\u00e3o duplicados</span></article><article><small>Erros</small><strong id=\"importErrors\">0</strong><span>linhas com problema</span></article></div><div class=\"panel importLogPanel\"><div class=\"panel-head\"><h2>3. Andamento</h2><span id=\"importBatchLabel\" class=\"muted\">Nenhuma importa\u00e7\u00e3o em andamento.</span></div><div id=\"importLog\" class=\"importLog\"><div class=\"muted\">Aqui aparecer\u00e1 o progresso da importa\u00e7\u00e3o.</div></div></div></div></section><section id=\"page-config\" class=\"page\"><div class=\"top\"><div><h1>Configura\u00e7\u00f5es</h1><p>Informa\u00e7\u00f5es da conex\u00e3o e ambiente do Sofa Scrap.</p></div></div><div class=\"panel\"><div class=\"configItem\"><span>Status do Banco B</span><strong id=\"configStatus\">Verificando...</strong></div><div class=\"configItem\"><span>Fonte</span><strong>Supabase \u2022 Banco B</strong></div><div class=\"configItem\"><span>Projeto</span><strong>Sofa Scrap</strong></div><div class=\"configItem\"><span>Seguran\u00e7a</span><strong>Chave publishable no navegador + chave secreta apenas no servidor</strong></div><div class=\"configItem\"><span>Comiss\u00e3o da exchange (%)</span><strong><input id=\"exchangeCommission\" type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" value=\"4.5\" style=\"width:110px;background:#0d1c2d;border:1px solid #29405a;color:#eef3fa;border-radius:8px;padding:8px\"><button class=\"secondary\" id=\"saveCommission\">Salvar</button><small id=\"commissionMsg\" class=\"muted\"></small></strong></div></div></section>\n</main></div><script src=\"app.js?v=50\"></script></body></html>\n";
const APP_JS="const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];\nconst esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#039;'}[c]));\nconst fmt=(n,d=2)=>Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});\nconst money=n=>(Number(n||0)>=0?'+':'')+fmt(n);\nconst monthLabel=m=>{const [y,mo]=String(m).split('-');return new Date(Number(y),Number(mo)-1,1).toLocaleDateString('pt-BR',{month:'short'}).replace('.','')};\nfunction set(id,v){const e=document.getElementById(id);if(e)e.textContent=v}\nlet dashboardData=null,metricData=null,filterData=null;\nconst APP_VERSION='V53';\nlet recentPage=1;\nlet recentPageSize=20;\nlet editingFilterId=null;\n\nfunction renderCurve(c){\n const svg=$('#curve'); if(!svg)return;\n if(!c?.length){svg.innerHTML='<text x=\"50%\" y=\"50%\" text-anchor=\"middle\" fill=\"#73849a\">Sem dados para exibir</text>';return;}\n const w=700,h=260,p=28,vals=c.map(x=>Number(x.acumulado||0));\n const rawMin=Math.min(0,...vals),rawMax=Math.max(0,...vals);\n const range=Math.max(rawMax-rawMin,1),pad=range*0.08;\n const min=rawMin<0?rawMin-pad:0, max=rawMax>0?rawMax+pad:0, scale=Math.max(max-min,1);\n const xAt=i=>p+(w-2*p)*i/Math.max(1,c.length-1), yAt=v=>h-p-(v-min)/scale*(h-2*p), zero=yAt(0);\n const pts=c.map((x,i)=>[xAt(i),yAt(Number(x.acumulado||0))]);\n const labels=[min,max].filter((v,i,a)=>a.indexOf(v)===i).map(v=>`<text x=\"4\" y=\"${yAt(v)+3}\" class=\"axisLabel\">${esc(fmt(v,0))}</text>`).join('');\n let segments='';\n for(let i=1;i<pts.length;i++){\n   const a=pts[i-1],b=pts[i], va=vals[i-1],vb=vals[i], positive=vb>=0&&va>=0, negative=vb<0&&va<0;\n   let color=positive?'#55e68a':negative?'#ff6870':'#b8c4d3';\n   segments+=`<line x1=\"${a[0]}\" y1=\"${a[1]}\" x2=\"${b[0]}\" y2=\"${b[1]}\" stroke=\"${color}\" stroke-width=\"3\" stroke-linecap=\"round\"/>`;\n }\n svg.innerHTML=`<line class=\"zeroLine\" x1=\"${p}\" y1=\"${zero}\" x2=\"${w-p}\" y2=\"${zero}\"/><text x=\"${w-p+5}\" y=\"${zero+3}\" class=\"zeroLabel\">0</text>${labels}${segments}`;\n}\nfunction renderBlocks(blocks){\n const tabs=$('#blockTabs'),body=$('#blockBody');\n if(!tabs||!body)return;\n const bs=blocks||[];\n tabs.innerHTML=bs.length?bs.map(b=>`<button class=\"blockTab\" data-block=\"${b.bloco}\"><b>Bloco ${b.bloco}</b><small>${b.inicio}-${b.fim} \u2022 ${b.entries} jogos</small></button>`).join(''):'<span class=\"muted\">Nenhum bloco dispon\u00edvel.</span>';\n body.innerHTML=bs.map(b=>`<tr><td>Bloco ${b.bloco}</td><td>${b.entries}</td><td class=\"positive\">${b.greens}</td><td class=\"negative\">${b.reds}</td><td>${fmt(b.winrate,1)}%</td><td>${fmt(b.oddMedia,2)}</td><td class=\"${b.lucro>=0?'positive':'negative'}\">${money(b.lucro)}</td><td class=\"${b.roi>=0?'positive':'negative'}\">${fmt(b.roi,1)}%</td></tr>`).join('')||emptyRow(8,'Nenhum jogo passou pelo recorte.');\n tabs.querySelectorAll('.blockTab').forEach(btn=>btn.addEventListener('click',()=>{tabs.querySelectorAll('.blockTab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const n=Number(btn.dataset.block);const row=bs.find(x=>x.bloco===n);if(row)body.innerHTML=`<tr><td>Bloco ${row.bloco}</td><td>${row.entries}</td><td class=\"positive\">${row.greens}</td><td class=\"negative\">${row.reds}</td><td>${fmt(row.winrate,1)}%</td><td>${fmt(row.oddMedia,2)}</td><td class=\"${row.lucro>=0?'positive':'negative'}\">${money(row.lucro)}</td><td class=\"${row.roi>=0?'positive':'negative'}\">${fmt(row.roi,1)}%</td></tr>`;}));\n if(bs[0])tabs.querySelector('.blockTab')?.classList.add('active');\n}\nfunction renderRecent(rows){\n const body=$('#recentBody'),pag=$('#recentPagination'),summary=$('#recentSummary'); if(!body||!pag)return;\n const all=Array.isArray(rows)?rows:[], total=all.length, pages=Math.max(1,Math.ceil(total/recentPageSize)); recentPage=Math.min(Math.max(1,recentPage),pages);\n const slice=all.slice().reverse().slice((recentPage-1)*recentPageSize,recentPage*recentPageSize);\n body.innerHTML=slice.map((x,i)=>`<tr><td>${(recentPage-1)*recentPageSize+i+1}</td><td>${esc(x.DATA)}</td><td>${esc(x.CONFRONTO)}</td><td>${esc(x.CAMPEONATO)}</td><td>${esc(x.mercado_label)}</td><td>${fmt(x.odd)}</td><td><b class=\"pill ${x.green?'green':'red'}\">${x.green?'Green':'Red'}</b></td><td class=\"${x.pnl>=0?'positive':'negative'}\">${money(x.pnl)}</td></tr>`).join('')||emptyRow(8,'Nenhuma entrada encontrada.');\n if(summary)summary.textContent=`${total.toLocaleString('pt-BR')} entradas \u2022 ${recentPageSize} por p\u00e1gina`;\n const btns=[];btns.push(`<button class=\"secondary pageBtn\" data-page=\"${Math.max(1,recentPage-1)}\" ${recentPage<=1?'disabled':''}>\u2039</button>`);\n const windowPages=[];for(let i=1;i<=pages;i++){if(i<=3||i===pages||Math.abs(i-recentPage)<=1)windowPages.push(i);else if(windowPages.at(-1)!=='\u2026')windowPages.push('\u2026');}\n windowPages.forEach(i=>btns.push(i==='\u2026'?'<span class=\"pageEllipsis\">\u2026</span>':`<button class=\"secondary pageBtn${i===recentPage?' active':''}\" data-page=\"${i}\">${i}</button>`));\n btns.push(`<button class=\"secondary pageBtn\" data-page=\"${Math.min(pages,recentPage+1)}\" ${recentPage>=pages?'disabled':''}>\u203a</button>`);pag.innerHTML=btns.join('');pag.querySelectorAll('.pageBtn').forEach(b=>b.addEventListener('click',()=>{recentPage=Number(b.dataset.page);renderRecent(dashboardData?.rows||[]);}));\n}\nfunction renderDashboard(d){\n dashboardData=d;set('entries',Number(d.entries||0).toLocaleString('pt-BR'));set('winrate',fmt(d.winrate,1)+'%');set('avgodd',fmt(d.oddMedia,2));set('profit',money(d.lucro));set('roi',fmt(d.roi,1)+'%');set('dd','-'+fmt(Math.abs(d.drawdown)));set('fairOdd',d.fairOddMedia==null?'0,00':fmt(d.fairOddMedia,2));set('fairProfit',money(d.lucroJustoLiquido||0));set('fairROI',fmt(d.roiJustoLiquido||0,1)+'%');$('#profit')?.classList.toggle('negative',d.lucro<0);$('#profit')?.classList.toggle('positive',d.lucro>=0);renderCurve(d.curve||[]);\n const mb=$('#monthlyBars'),ml=$('#monthlyLabels');if(mb&&ml){mb.innerHTML='';ml.innerHTML='';const mx=Math.max(1,...(d.monthly||[]).map(x=>Math.abs(x.lucro)));(d.monthly||[]).forEach(x=>{const b=document.createElement('span');b.style.height=Math.max(6,Math.abs(x.lucro)/mx*100)+'%';if(x.lucro<0)b.classList.add('red');b.title=`${x.mes}: ${money(x.lucro)}`;mb.appendChild(b);const l=document.createElement('small');l.textContent=monthLabel(x.mes);ml.appendChild(l)})}\n const champs=d.championships||[];if($('#champBody'))$('#champBody').innerHTML=champs.map(champRow).join('')||emptyRow(5,'Nenhum campeonato no recorte.');const total=d.entries||1;if($('#donut'))$('#donut').style.setProperty('--green',((d.distributions?.green||0)/total*100)+'%');set('distTotal',Number(d.entries||0).toLocaleString('pt-BR'));set('greenCount','Green '+(d.distributions?.green||0));set('redCount','Red '+(d.distributions?.red||0));\n renderBlocks(d.blocks||[]);recentPage=1;renderRecent(d.rows||[]);\n if($('#champReportBody'))$('#champReportBody').innerHTML=champs.map(x=>`<tr><td>${esc(x.nome)}</td><td>${x.entries}</td><td class=\"positive\">${x.greens}</td><td class=\"negative\">${x.reds}</td><td>${fmt(x.winrate,1)}%</td><td>${fmt(x.oddMedia,2)}</td><td class=\"${x.lucro>=0?'positive':'negative'}\">${money(x.lucro)}</td><td class=\"${x.roi>=0?'positive':'negative'}\">${fmt(x.roi,1)}%</td></tr>`).join('')||emptyRow(8,'Nenhum campeonato encontrado.');\n const mm=$('#marketListBottom');if(mm){const selected=String(d.market||'');mm.innerHTML=`<div class=\"marketSummaryHead\"><span>Mercado</span><span>Entradas</span><span>Winrate</span><span>P/L (${d.pnlRef==='JUSTA'?'Justa':'365'})</span><span>ROI</span><span>Odd justa</span><span>P/L justo</span><span>ROI justo</span></div>`+(d.markets||[]).map(x=>{const active=String(x.mercado)===selected;return `<div class=\"marketSummaryRow${active?' selected':''}\"><b>${esc(x.label)}</b><span>${x.entries}</span><span>${fmt(x.winrate,1)}%</span><span class=\"${x.lucro>=0?'positive':'negative'}\">${money(x.lucro)}</span><span class=\"${x.roi>=0?'positive':'negative'}\">${fmt(x.roi,1)}%</span><span>${x.oddJustaMedia==null?'\u2014':fmt(x.oddJustaMedia,2)}</span><span class=\"${(x.lucroJustoLiquido||0)>=0?'positive':'negative'}\">${x.lucroJustoLiquido==null?'\u2014':money(x.lucroJustoLiquido)}</span><span class=\"${(x.roiJustoLiquido||0)>=0?'positive':'negative'}\">${x.roiJustoLiquido==null?'\u2014':fmt(x.roiJustoLiquido,1)+'%'}</span></div>`}).join('')||'<span class=\"muted\">Nenhum mercado dispon\u00edvel.</span>'}\n}\nfunction champRow(x){return `<tr><td>${esc(x.nome)}</td><td>${x.entries}</td><td>${fmt(x.winrate,1)}%</td><td class=\"${x.lucro>=0?'positive':'negative'}\">${money(x.lucro)}</td><td>${fmt(x.roi,1)}%</td></tr>`}\nfunction emptyRow(cols,msg){return `<tr><td colspan=\"${cols}\" class=\"muted\">${esc(msg)}</td></tr>`}\nasync function api(path,opts={}){const r=await fetch(path,{cache:'no-store',...opts});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Error(d.error||d.detail||JSON.stringify(d));return d}\nfunction champPickerValues(id){const box=$(id);if(!box)return[];const all=box.querySelector('input[data-all=\"1\"]');if(all?.checked)return[];return [...box.querySelectorAll('input[data-champ=\"1\"]:checked')].map(x=>x.value).filter(Boolean)}\nfunction setChampPicker(id,values=[],disabled=false){const box=$(id);if(!box)return;const vals=new Set((values||[]).map(String));const all=box.querySelector('input[data-all=\"1\"]');const items=[...box.querySelectorAll('input[data-champ=\"1\"]')];const has=vals.size>0;items.forEach(x=>{x.checked=has&&vals.has(String(x.value));x.disabled=disabled});if(all){all.checked=!has;all.disabled=disabled}box.classList.toggle('disabled',disabled);updateChampPickerSummary(id)}\nfunction renderChampPicker(id,vals,selected=[],disabled=false){const box=$(id);if(!box)return;box.innerHTML=`<button type=\"button\" class=\"pickerTrigger\"><span class=\"pickerSummary\">Todos os campeonatos</span><span class=\"pickerChevron\">\u25be</span></button><div class=\"pickerMenu\"><label class=\"pickerAll\"><input type=\"checkbox\" data-all=\"1\"> <b>Todos</b></label><div class=\"pickerItems\">${(vals||[]).map(v=>`<label><input type=\"checkbox\" data-champ=\"1\" value=\"${esc(v)}\"> <span>${esc(v)}</span></label>`).join('')}</div></div>`;const trigger=box.querySelector('.pickerTrigger');const menu=box.querySelector('.pickerMenu');trigger?.addEventListener('click',e=>{e.preventDefault();if(trigger.disabled)return;document.querySelectorAll('.champPicker .pickerMenu.open').forEach(m=>{if(m!==menu)m.classList.remove('open')});menu?.classList.toggle('open')});const all=box.querySelector('input[data-all=\"1\"]');all?.addEventListener('change',()=>{if(all.checked)box.querySelectorAll('input[data-champ=\"1\"]').forEach(x=>x.checked=false);updateChampPickerSummary(id)});box.querySelectorAll('input[data-champ=\"1\"]').forEach(x=>x.addEventListener('change',()=>{if(x.checked&&all)all.checked=false;const any=box.querySelector('input[data-champ=\"1\"]:checked');if(!any&&all)all.checked=true;updateChampPickerSummary(id)}));setChampPicker(id,selected,disabled)}\ndocument.addEventListener('click',e=>{if(!e.target.closest('.champPicker'))document.querySelectorAll('.champPicker .pickerMenu.open').forEach(m=>m.classList.remove('open'))});\nfunction updateChampPickerSummary(id){const box=$(id);if(!box)return;const disabled=box.classList.contains('disabled');const all=box.querySelector('input[data-all=\"1\"]');const vals=[...box.querySelectorAll('input[data-champ=\"1\"]:checked')];const label=box.querySelector('.pickerSummary');if(label)label.textContent=disabled?(vals.length?`${vals.length} campeonato(s) definidos pelo filtro`:'Todos os campeonatos definidos pelo filtro'):(all?.checked||!vals.length?'Todos os campeonatos':`${vals.length} campeonato(s) selecionado(s)`);const trigger=box.querySelector('.pickerTrigger');if(trigger)trigger.disabled=disabled;const menu=box.querySelector('.pickerMenu');if(disabled)menu?.classList.remove('open')}\nasync function dash(){\n const btn=$('#apply');\n const market=$('#market')?.value||'OVER_2_5';\n const pnlRef=$('#pnlRef')?.value||'365';\n const filterName=$('#dashFilter')?.selectedOptions?.[0]?.textContent||'Sem filtro';\n if(btn){btn.disabled=true;btn.classList.add('loading');btn.innerHTML='<span class=\"spinner\"></span> Aplicando...';}\n set('sideStatus','Atualizando...');\n set('configStatus',`Aplicando \u2022 ${market} \u2022 ${filterName}`);\n try{\n  const q=new URLSearchParams({temporada:$('#season').value||'Todos',campeonato:'Todos',campeonatos:JSON.stringify(champPickerValues('#dashChampPicker')),mercado:market,pnl_ref:pnlRef,filtro_id:$('#dashFilter')?.value||'',comissao:localStorage.getItem('sofa_comissao')||'4.5'});\n  const d=await api('/api/dashboard?'+q);\n  renderDashboard(d);\n  if(d.filter){setChampPicker('#dashChampPicker',d.filter.campeonatos||[],Boolean((d.filter.campeonatos||[]).length));}\n  set('sideStatus','Conectado');\n  set('configStatus',d.filter?.nome?`Banco B conectado \u2022 ${d.filter.nome} \u2022 ${d.marketLabel}`:`Banco B conectado \u2022 ${d.marketLabel}`);\n }catch(e){\n  set('sideStatus','Erro');\n  set('configStatus','Erro: '+e.message);\n  throw e;\n }finally{\n  if(btn){btn.disabled=false;btn.classList.remove('loading');btn.textContent='Aplicar';}\n }\n}\nasync function options(){const d=await api('/api/dashboard?action=options');const fill=(id,vals)=>{const e=$(id);if(!e)return;e.innerHTML='<option>Todos</option>'+(vals||[]).map(x=>`<option>${esc(x)}</option>`).join('')};fill('#season',d.seasonsAvailable);fill('#btSeason',d.seasonsAvailable);fill('#btChamp',d.championshipsAvailable);renderChampPicker('#dashChampPicker',d.championshipsAvailable);renderChampPicker('#filterChampPicker',d.championshipsAvailable)}\nfunction metricOptions(){return (metricData?.metricas||[]).filter(x=>x.ativa!==false&&x.ativo!==false).map(x=>`<option value=\"${x.id}\" data-campo=\"${esc(x.campo||'')}\">${esc(x.nome||x.name||('M\u00e9trica '+x.id))}</option>`).join('')}\nconst OFFICIAL_FIELDS=[\n['RATING_CASA','Rating Casa'],['RATING_VISITANTE','Rating Visitante'],['GOLS_CASA_FT','Gols Casa FT'],['GOLS_VISITANTE_FT','Gols Visitante FT'],['XG_CASA','xG Casa'],['XG_VISITANTE','xG Visitante'],['XG_NO_ALVO_CASA','xG no alvo Casa'],['XG_NO_ALVO_VISITANTE','xG no alvo Visitante'],['FINALIZACOES_TOTAIS_CASA','Finaliza\u00e7\u00f5es totais Casa'],['FINALIZACOES_TOTAIS_VISITANTE','Finaliza\u00e7\u00f5es totais Visitante'],['FINALIZACOES_NO_ALVO_CASA','Finaliza\u00e7\u00f5es no alvo Casa'],['FINALIZACOES_NO_ALVO_VISITANTE','Finaliza\u00e7\u00f5es no alvo Visitante'],['FINALIZACOES_FORA_ALVO_CASA','Finaliza\u00e7\u00f5es fora do alvo Casa'],['FINALIZACOES_FORA_ALVO_VISITANTE','Finaliza\u00e7\u00f5es fora do alvo Visitante'],['FINALIZACOES_BLOQUEADAS_CASA','Finaliza\u00e7\u00f5es bloqueadas Casa'],['FINALIZACOES_BLOQUEADAS_VISITANTE','Finaliza\u00e7\u00f5es bloqueadas Visitante'],['ESCANTEIOS_CASA','Escanteios Casa'],['ESCANTEIOS_VISITANTE','Escanteios Visitante'],['POSSE_BOLA_CASA','Posse de bola Casa'],['POSSE_BOLA_VISITANTE','Posse de bola Visitante'],['PASSES_TOTAIS_CASA','Passes totais Casa'],['PASSES_TOTAIS_VISITANTE','Passes totais Visitante'],['PASSES_CERTOS_CASA','Passes certos Casa'],['PASSES_CERTOS_VISITANTE','Passes certos Visitante'],['PASSES_LONGOS_CERTOS_CASA','Passes longos certos Casa'],['PASSES_LONGOS_CERTOS_VISITANTE','Passes longos certos Visitante'],['CRUZAMENTOS_CERTOS_CASA','Cruzamentos certos Casa'],['CRUZAMENTOS_CERTOS_VISITANTE','Cruzamentos certos Visitante'],['TOQUES_AREA_ADVERSARIA_CASA','Toques na \u00e1rea advers\u00e1ria Casa'],['TOQUES_AREA_ADVERSARIA_VISITANTE','Toques na \u00e1rea advers\u00e1ria Visitante'],['ENTRADAS_TERCO_FINAL_CASA','Entradas no ter\u00e7o final Casa'],['ENTRADAS_TERCO_FINAL_VISITANTE','Entradas no ter\u00e7o final Visitante'],['DESARMES_TOTAIS_CASA','Desarmes totais Casa'],['DESARMES_TOTAIS_VISITANTE','Desarmes totais Visitante'],['PCT_DESARMES_GANHOS_CASA','% Desarmes ganhos Casa'],['PCT_DESARMES_GANHOS_VISITANTE','% Desarmes ganhos Visitante'],['INTERCEPTACOES_CASA','Intercepta\u00e7\u00f5es Casa'],['INTERCEPTACOES_VISITANTE','Intercepta\u00e7\u00f5es Visitante'],['RECUPERACOES_BOLA_CASA','Recupera\u00e7\u00f5es de bola Casa'],['RECUPERACOES_BOLA_VISITANTE','Recupera\u00e7\u00f5es de bola Visitante'],['CORTES_CLEARANCES_CASA','Cortes/Clearances Casa'],['CORTES_CLEARANCES_VISITANTE','Cortes/Clearances Visitante'],['PCT_DUELOS_GANHOS_CASA','% Duelos ganhos Casa'],['PCT_DUELOS_GANHOS_VISITANTE','% Duelos ganhos Visitante'],['DESARMES_SOFRIDOS_CASA','Desarmes sofridos Visitante'],['DESARMES_SOFRIDOS_VISITANTE','Desarmes sofridos Visitante']];\nfunction fieldOptions(){const src=Array.isArray(metricData?.campose)&&metricData.campose.length?metricData.campose:OFFICIAL_FIELDS.map(([campo,nome])=>({campo,nome}));return src.map(x=>{const v=x.campo||x.field||x.nome||x.name||'';const label=x.nome||x.label||v;return v?`<option value=\"${esc(v)}\">${esc(label)}${label!==v?' \u2014 '+esc(v):''}</option>`:''}).join('')}\nasync function loadMetrics(){const mf=$('#metricField');try{metricData=await api('/api/dashboard?action=metrics');set('metricMsg','');}catch(err){metricData={metricas:[],campose:OFFICIAL_FIELDS.map(([campo,nome])=>({campo,nome}))};set('metricMsg','API de m\u00e9tricas indispon\u00edvel; campos oficiais carregados localmente.');}const ms=metricData.metricas||[];set('metricCount',ms.length+' m\u00e9tricas/configura\u00e7\u00f5es');if($('#metricBody'))$('#metricBody').innerHTML=ms.map(x=>{const active=x.ativa??x.ativo??true;const canManage=x.fonte==='metricas_config'||x.campo!==undefined;return `<tr><td>${x.id??''}</td><td>${esc(x.nome||x.name||'')}</td><td>${esc(x.campo||x.field||'')}</td><td>${esc(x.contexto||'')}</td><td>${x.janela_jogos??x.janela??''}</td><td>${x.minimo_jogos??x.minimo??''}</td><td>${esc(x.operacao||'')}</td><td><b class=\"pill ${active?'green':'red'}\">${active?'Ativa':'Inativa'}</b></td><td>${canManage?`<button class=\"secondary metricEdit\" data-id=\"${x.id}\">Editar</button> <button class=\"secondary metricToggle\" data-id=\"${x.id}\" data-active=\"${active}\">${active?'Desativar':'Ativar'}</button>${x.fonte==='metricas_config'?` <button class=\"remove metricDelete\" data-id=\"${x.id}\">Excluir</button>`:''}`:'\u2014'}</td></tr>`}).join('')||emptyRow(9,'Nenhuma m\u00e9trica cadastrada. Crie a primeira acima.');if(mf)mf.innerHTML='<option value=\"\">Selecione um campo</option>'+fieldOptions()+`<option value=\"CUSTO_PONTO\">CUSTO_PONTO \u2014 Custo do Ponto</option>`;$$('.metricSelect').forEach(e=>e.innerHTML='<option value=\"\">Selecione uma m\u00e9trica</option>'+metricOptions());}\nasync function editMetric(id){const x=(metricData?.metricas||[]).find(m=>String(m.id)===String(id));if(!x||x.fonte!=='metricas_config'){set('metricMsg','Esta m\u00e9trica n\u00e3o pode ser editada.');return;}window.metricEditingId=Number(id);$('#metricName').value=x.nome||'';$('#metricDescription').value=x.descricao||'';const tipo=(x.formula?.tipo||((x.campo||'')==='COMPOSTA'?'COMPOSTA':(x.campo||'')==='CUSTO_PONTO'?'CUSTO_PONTO':'NORMAL')).toUpperCase();$('#metricType').value=tipo;if(tipo==='COMPOSTA'){syncMetricBuilder();$('#metricCompositeOperation').value=x.formula?.operacao||x.operacao||'MEDIA';const comps=x.formula?.componentes||[];$('#metricComponents').innerHTML='';comps.forEach(()=>addMetricComponent());$$('.compMetric').forEach((e,i)=>e.value=String(comps[i]?.metrica_id||''));}else{syncMetricBuilder();$('#metricField').value=x.campo||'';$('#metricContext').value=x.contexto||'CASA';$('#metricOperation').value=x.operacao||'MEDIA';$('#metricWindow').value=x.janela_jogos??x.janela??5;$('#metricMinimum').value=x.minimo_jogos??x.minimo??3;}const b=$('#saveMetric');if(b)b.textContent='Salvar altera\u00e7\u00f5es';set('metricMsg',`Editando m\u00e9trica #${id}. Altere os campos e salve.`);document.querySelector('#page-metricas')?.scrollIntoView({behavior:'smooth',block:'start'});}\nasync function saveMetric(){const nome=$('#metricName').value.trim(),tipo=$('#metricType').value;if(!nome){set('metricMsg','Informe o nome da m\u00e9trica.');return}let body={nome,descricao:$('#metricDescription').value.trim(),tipo};if(tipo==='COMPOSTA'){const comps=$$('.metricComponent').map(x=>({metrica_id:Number(x.querySelector('.compMetric').value)})).filter(x=>x.metrica_id>0);const op=$('#metricCompositeOperation')?.value||'MEDIA';if(comps.length<2){set('metricMsg','Adicione pelo menos 2 m\u00e9tricas \u00e0 composi\u00e7\u00e3o.');return}if(new Set(comps.map(x=>x.metrica_id)).size!==comps.length){set('metricMsg','N\u00e3o repita a mesma m\u00e9trica na composi\u00e7\u00e3o.');return}body.campo='COMPOSTA';body.contexto='GERAL';body.janela_jogos=1;body.minimo_jogos=1;body.operacao=op;body.componentes=comps;}else{let campo=$('#metricField').value;if(tipo==='CUSTO_PONTO')campo='CUSTO_PONTO';if(!campo){set('metricMsg','Selecione um campo.');return}body.campo=campo;body.contexto=$('#metricContext').value;body.janela_jogos=Number($('#metricWindow').value||5);body.minimo_jogos=Number($('#metricMinimum').value||3);body.operacao=$('#metricOperation').value;}const payload=encodeURIComponent(JSON.stringify(body));set('metricMsg',window.metricEditingId?'Salvando altera\u00e7\u00f5es...':'Salvando...');const action=window.metricEditingId?`update_metric&id=${window.metricEditingId}&payload=${payload}`:`save_metric&payload=${payload}`;await api('/api/dashboard?action='+action);set('metricMsg',window.metricEditingId?'\u2713 M\u00e9trica atualizada no Banco B.':'\u2713 M\u00e9trica salva no Banco B.');window.metricEditingId=null;await loadMetrics();$$('.metricSelect').forEach(e=>e.innerHTML='<option value=\"\">Selecione uma m\u00e9trica</option>'+metricOptions());clearMetric(true);}\nfunction addMetricComponent(){const w=$('#metricComponents');if(!w)return;const n=document.createElement('div');n.className='metricComponent';n.innerHTML='<label>M\u00e9trica<select class=\"compMetric\"><option value=\"\">Selecione uma m\u00e9trica</option></select></label><button type=\"button\" class=\"remove\">Remover</button>';n.querySelector('.remove').onclick=()=>{n.remove()};w.appendChild(n);n.querySelector('.compMetric').innerHTML='<option value=\"\">Selecione uma m\u00e9trica</option>'+metricOptions();}\nfunction syncMetricBuilder(){const t=$('#metricType'),normal=$('.metricNormalFields'),comp=$('#metricCompositeFields');if(!t)return;const isComp=t.value==='COMPOSTA';if(normal)normal.style.display=isComp?'none':'grid';if(comp)comp.style.display=isComp?'block':'none';if(isComp&&!$('#metricComponents')?.children.length){addMetricComponent();addMetricComponent();}}\nfunction bindMetricType(){const t=$('#metricType'),f=$('#metricField');if(!t||!f)return;const sync=()=>{const special=t.value==='CUSTO_PONTO';f.disabled=special;if(special)f.value='CUSTO_PONTO';else if(f.value==='CUSTO_PONTO')f.value='';syncMetricBuilder();};t.onchange=sync;sync()}\nfunction clearMetric(silent=false){window.metricEditingId=null;['metricName','metricDescription'].forEach(id=>{const e=$('#'+id);if(e)e.value=''});if($('#metricField'))$('#metricField').value='';if($('#metricContext'))$('#metricContext').value='CASA';if($('#metricOperation'))$('#metricOperation').value='MEDIA';if($('#metricWindow'))$('#metricWindow').value=5;if($('#metricMinimum'))$('#metricMinimum').value=3;if($('#metricType'))$('#metricType').value='NORMAL';if($('#metricComponents'))$('#metricComponents').innerHTML='';if($('#metricCompositeFields'))$('#metricCompositeFields').style.display='none';const b=$('#saveMetric');if(b)b.textContent='Salvar m\u00e9trica';if(!silent)set('metricMsg','')}\nfunction addMetricComponent(){const w=$('#metricComponents');if(!w)return;const n=document.createElement('div');n.className='metricComponent';n.innerHTML='<label>M\u00e9trica<select class=\"compMetric\"><option value=\"\">Selecione uma m\u00e9trica</option></select></label><button type=\"button\" class=\"remove\">Remover</button>';n.querySelector('.remove').onclick=()=>{n.remove()};w.appendChild(n);n.querySelector('.compMetric').innerHTML='<option value=\"\">Selecione uma m\u00e9trica</option>'+metricOptions();}\nfunction syncMetricBuilder(){const t=$('#metricType'),normal=$('.metricNormalFields'),comp=$('#metricCompositeFields');if(!t)return;const isComp=t.value==='COMPOSTA';if(normal)normal.style.display=isComp?'none':'grid';if(comp)comp.style.display=isComp?'block':'none';if(isComp&&!$('#metricComponents')?.children.length){addMetricComponent();addMetricComponent();}}\nfunction bindMetricType(){const t=$('#metricType'),f=$('#metricField');if(!t||!f)return;const sync=()=>{const special=t.value==='CUSTO_PONTO';f.disabled=special;if(special)f.value='CUSTO_PONTO';else if(f.value==='CUSTO_PONTO')f.value='';syncMetricBuilder();};t.onchange=sync;sync()}\nfunction clearMetric(silent=false){['metricName','metricDescription'].forEach(id=>{const e=$('#'+id);if(e)e.value=''});if($('#metricField'))$('#metricField').value='';if($('#metricContext'))$('#metricContext').value='CASA';if($('#metricOperation'))$('#metricOperation').value='MEDIA';if($('#metricWindow'))$('#metricWindow').value=5;if($('#metricMinimum'))$('#metricMinimum').value=3;if($('#metricType'))$('#metricType').value='NORMAL';if($('#metricComponents'))$('#metricComponents').innerHTML='';if($('#metricCompositeFields'))$('#metricCompositeFields').style.display='none';if(!silent)set('metricMsg','')}\nasync function loadFilters(){filterData=await api('/api/dashboard?action=filters');const fs=filterData.filtros||[];if($('#savedFilters'))$('#savedFilters').innerHTML=fs.filter(f=>Number.isInteger(Number(f.id))&&Number(f.id)>0).slice(0,5).map(f=>`<div class=\"saved\"><div><b>${esc(f.nome)}</b><br><small>ID ${f.id} \u2022 ${f.ativo?'Ativo':'Inativo'} \u2022 ${(f.condicoes||[]).length} condi\u00e7\u00e3o(\u00f5es)</small></div><div class=\"savedBtns\"><button class=\"secondary editFilter\" data-id=\"${f.id}\">Editar</button><button class=\"secondary toggleFilter\" data-id=\"${f.id}\">${f.ativo?'Desativar':'Ativar'}</button><button class=\"danger deleteFilter\" data-id=\"${f.id}\">Apagar</button></div></div>`).join('')||'<span class=\"muted\">Nenhum filtro salvo ainda.</span>';const active=fs.filter(f=>f.ativo&&Number.isInteger(Number(f.id))&&Number(f.id)>0);if($('#btFilter'))$('#btFilter').innerHTML='<option value=\"\">Sem filtro</option>'+active.map(f=>`<option value=\"${f.id}\">${esc(f.nome)}</option>`).join('');if($('#dashFilter')){const current=$('#dashFilter').value;$('#dashFilter').innerHTML='<option value=\"\">Sem filtro</option>'+active.map(f=>`<option value=\"${f.id}\">${esc(f.nome)}</option>`).join('');if(active.some(f=>String(f.id)===String(current)))$('#dashFilter').value=current;const chosen=active.find(f=>String(f.id)===String(current));if(chosen)setChampPicker('#dashChampPicker',chosen.campeonatos||[],Boolean((chosen.campeonatos||[]).length));}}\nfunction addCondition(){const wrap=$('#conditions');if(!wrap)return;const n=document.createElement('div');n.className='condition';n.innerHTML=`<label>M\u00e9trica<select class=\"metricSelect\"><option value=\"\">Selecione uma m\u00e9trica</option></select></label><label>Operador<select class=\"op\"><option>></option><option>>=</option><option><</option><option><=</option><option>=</option><option><></option></select></label><label>Comparar com<select class=\"compareMode\"><option value=\"VALOR\">Valor</option><option value=\"METRICA\">Outra m\u00e9trica</option></select></label><label class=\"valueWrap\">Valor<input class=\"val\" type=\"number\" step=\"0.01\" value=\"2\"></label><label class=\"compareWrap\" style=\"display:none\">M\u00e9trica comparada<select class=\"compareMetric\"><option value=\"\">Selecione uma m\u00e9trica</option></select></label><label>Contexto<select class=\"ctx\"><option>CASA</option><option>FORA</option><option>GERAL</option></select></label><label>Janela<input class=\"win\" type=\"number\" min=\"1\" value=\"5\"></label><label>M\u00ednimo<input class=\"min\" type=\"number\" min=\"1\" value=\"3\"></label><label>Opera\u00e7\u00e3o<select class=\"operation\"><option>MEDIA</option><option>VALOR</option><option>SOMA</option><option>MIN</option><option>MAX</option><option>DESVIO_PADRAO</option><option>CV</option></select></label><button class=\"remove\">Remover</button>`;n.querySelector('.remove').onclick=()=>{n.remove();updateConditionState()};const mode=n.querySelector('.compareMode');mode.onchange=()=>{const m=mode.value==='METRICA';n.querySelector('.valueWrap').style.display=m?'none':'block';n.querySelector('.compareWrap').style.display=m?'block':'none';};wrap.appendChild(n);if(metricData){n.querySelector('.metricSelect').innerHTML='<option value=\"\">Selecione uma m\u00e9trica</option>'+metricOptions();n.querySelector('.compareMetric').innerHTML='<option value=\"\">Selecione uma m\u00e9trica</option>'+metricOptions();}updateConditionState()}\n\nfunction updateConditionState(){const cs=$$('.condition');cs.forEach((c,i)=>{const r=c.querySelector('.remove');if(r)r.disabled=cs.length===1;r.title=cs.length===1?'O filtro precisa ter pelo menos uma condi\u00e7\u00e3o':'Remover condi\u00e7\u00e3o';});}\nasync function editFilter(id){\n const d=await api('/api/dashboard?action=filter_detail&id='+Number(id)); const f=d.filtro;\n if(!f){set('filterMsg','Filtro n\u00e3o encontrado.');return;}\n if(!metricData)await loadMetrics(); editingFilterId=Number(id); $('#filterName').value=f.nome||'';\n const group=(d.nos||[]).find(n=>n.tipo==='GRUPO'); $('#filterLogic').value=group?.operador_logico||d.relacoes?.[0]?.operador||'E';\n setChampPicker('#filterChampPicker',f.campeonatos||[]);\n const wrap=$('#conditions');wrap.innerHTML='';\n const nodes=(d.nos||[]).filter(n=>n.tipo==='CONDICAO').sort((a,b)=>Number(a.ordem||0)-Number(b.ordem||0));\n nodes.forEach(n=>{const c=(d.condicoes||[]).find(x=>Number(x.no_id)===Number(n.id))||n;addCondition();const el=$('#conditions .condition:last-child');el.querySelector('.metricSelect').value=String(c.metrica_id||n.metrica_id||'');el.querySelector('.op').value=c.operador||n.comparador||'>';const cmp=c.metrica_comparada_id||n.metrica_comparada_id;el.querySelector('.compareMode').value=cmp?'METRICA':'VALOR';el.querySelector('.valueWrap').style.display=cmp?'none':'block';el.querySelector('.compareWrap').style.display=cmp?'block':'none';el.querySelector('.val').value=c.valor??n.valor??2;el.querySelector('.compareMetric').value=cmp?String(cmp):'';el.querySelector('.ctx').value=c.contexto||n.contexto||'CASA';el.querySelector('.win').value=c.janela??n.janela??5;el.querySelector('.min').value=c.minimo??n.minimo??3;el.querySelector('.operation').value=c.operacao||n.operacao||'MEDIA';});\n if(!nodes.length)addCondition(); const b=$('#saveFilter');if(b)b.textContent='Salvar altera\u00e7\u00f5es';set('filterMsg',`Editando filtro #${id}. Altere as condi\u00e7\u00f5es e salve.`);document.querySelector('#page-filtros')?.scrollIntoView({behavior:'smooth',block:'start'});\n}\nasync function saveFilter(){\n const nome=$('#filterName').value.trim()||'Novo filtro';\n const cond=$$('.condition').map(x=>{\n   const s=x.querySelector('.metricSelect');const id=Number(s.value);const m=(metricData?.metricas||[]).find(z=>String(z.id)===String(id));\n   const compare=x.querySelector('.compareMode')?.value||'VALOR';\n   const out={metrica_id:id,campo:m?.campo||'',operador:x.querySelector('.op').value,valor:compare==='VALOR'?Number(x.querySelector('.val').value):null,percentual:null,metrica_comparada_id:compare==='METRICA'?Number(x.querySelector('.compareMetric').value)||null:null,contexto:x.querySelector('.ctx').value,janela:Number(x.querySelector('.win').value),minimo:Number(x.querySelector('.min').value||3),operacao:x.querySelector('.operation').value};\n   return out;\n });\n if(cond.some(c=>!c.metrica_id)){set('filterMsg','Selecione uma m\u00e9trica em todas as condi\u00e7\u00f5es.');return}\n if(cond.some(c=>c.metrica_comparada_id===null && !Number.isFinite(c.valor))){set('filterMsg','Preencha o valor ou selecione uma m\u00e9trica de compara\u00e7\u00e3o em todas as condi\u00e7\u00f5es.');return}\n if(cond.some(c=>c.metrica_comparada_id!==null && (!Number.isInteger(c.metrica_comparada_id)||c.metrica_comparada_id<=0))){set('filterMsg','Selecione a m\u00e9trica comparada em todas as condi\u00e7\u00f5es.');return}\n set('filterMsg','Salvando filtro...');\n const payload=encodeURIComponent(JSON.stringify({nome,operador:$('#filterLogic').value,campeonatos:champPickerValues('#filterChampPicker'),condicoes:cond}));\n const action=editingFilterId?`update_filter&id=${editingFilterId}&payload=${payload}`:`save_filter&payload=${payload}`;\n await api('/api/dashboard?action='+action);set('filterMsg',editingFilterId?'\u2713 Filtro atualizado no Banco B.':'\u2713 Filtro salvo no Banco B.');editingFilterId=null;await loadFilters();$('#conditions').innerHTML='';addCondition();const fb=$('#saveFilter');if(fb)fb.textContent='Salvar filtro';\n}\nasync function backtest(){const payload=encodeURIComponent(JSON.stringify({nome:$('#btName').value.trim()||'Meu Backtest',filtro_id:($('#btFilter').value && Number.isInteger(Number($('#btFilter').value)) && Number($('#btFilter').value)>0)?Number($('#btFilter').value):null,mercado:$('#btMarket').value,stake_fixa:Number($('#btStake').value||1),odd_minima:$('#btOddMin').value?Number($('#btOddMin').value):null,odd_maxima:$('#btOddMax').value?Number($('#btOddMax').value):null,temporada:$('#btSeason').value==='Todos'?null:$('#btSeason').value,campeonato:$('#btChamp').value==='Todos'?null:$('#btChamp').value}));set('btMsg','Salvando configura\u00e7\u00e3o e executando...');const d=await api('/api/dashboard?action=save_backtest_config&payload='+payload);const cfgId=Number(d?.config?.id);if(!Number.isInteger(cfgId)||cfgId<=0)throw Error('A configura\u00e7\u00e3o foi salva, mas o ID retornado \u00e9 inv\u00e1lido.');const b=await api('/api/dashboard?action=backtest&config_id='+cfgId);set('btEntries',b.entries);set('btWin',fmt(b.winrate,1)+'%');set('btProfit',money(b.lucro));set('btROI',fmt(b.roi,1)+'%');set('btDD','-'+fmt(Math.abs(b.drawdown)));$('#btRows').innerHTML=(b.rows||[]).map(x=>`<tr><td>${esc(x.DATA)}</td><td>${esc(x.CONFRONTO)}</td><td>${esc(x.CAMPEONATO)}</td><td>${fmt(x.odd)}</td><td><b class=\"pill ${x.green?'green':'red'}\">${x.green?'Green':'Red'}</b></td><td class=\"${x.pnl>=0?'positive':'negative'}\">${money(x.pnl)}</td></tr>`).join('')||emptyRow(6,'Nenhuma entrada passou pelo recorte.');set('btMsg',`\u2713 Backtest executado${b.config?.filtro_id?' com filtro aplicado.':' sem filtro.'}`);await loadBacktestConfigs()}\nasync function loadBacktestConfigs(){try{const d=await api('/api/dashboard?action=backtest_configs'),xs=d.configs||[];set('btConfigCount',Math.min(5,xs.length||0)+' recentes');if($('#btConfigList'))$('#btConfigList').innerHTML=xs.filter(x=>Number.isInteger(Number(x.id))&&Number(x.id)>0).slice(0,5).map(x=>`<div class=\"saved\"><div><b>${esc(x.nome||'Backtest '+x.id)}</b><br><small>ID ${x.id} \u2022 ${esc(x.mercado||'')} \u2022 Stake ${fmt(x.stake_fixa||1)}${x.filtro_id?' \u2022 Filtro #'+x.filtro_id:''}</small></div><button class=\"danger deleteBacktest\" data-id=\"${x.id}\">Apagar</button></div>`).join('')||'<span class=\"muted\">Nenhuma configura\u00e7\u00e3o v\u00e1lida salva.</span>'}catch(e){set('btConfigCount','Erro ao carregar') }}\nasync function loadImportCount(){try{const d=await api('/api/dashboard?action=db_count');set('dbGameCount',Number(d.count||0).toLocaleString('pt-BR'));}catch(e){set('dbGameCount','\u2014');}}\nfunction normalizeImportHeader(h){return String(h??'').replace(/\\ufeff/g,'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[()\\-\\/]/g,' ').replace(/\\s+/g,' ').trim()}\nasync function parseImportFile(file){\n const name=String(file?.name||'').toLowerCase();\n if(!file)throw Error('Nenhum arquivo selecionado.');\n if(typeof XLSX==='undefined')throw Error('Leitor de planilhas n\u00e3o carregado. Recarregue a p\u00e1gina e tente novamente.');\n const buf=await file.arrayBuffer();\n let wb;\n try{wb=XLSX.read(buf,{type:'array',cellDates:false,raw:false});}catch(e){throw Error('N\u00e3o consegui ler este arquivo. Use XLSX, CSV, TSV ou TXT.');}\n const sheet=wb.Sheets[wb.SheetNames[0]];\n if(!sheet)throw Error('O arquivo n\u00e3o possui uma planilha v\u00e1lida.');\n const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});\n const rows0=matrix.filter(r=>Array.isArray(r)&&r.some(v=>String(v??'').trim()!==''));\n if(!rows0.length)throw Error('O arquivo est\u00e1 vazio.');\n const headers=rows0[0].map(v=>String(v??'').trim());\n if(headers.length<2)throw Error('N\u00e3o consegui identificar as colunas do arquivo.');\n const rows=[];\n for(let i=1;i<rows0.length;i++){const vals=rows0[i];if(!vals.some(v=>String(v??'').trim()!==''))continue;const r={};headers.forEach((h,j)=>r[h]=String(vals[j]??'').trim());rows.push(r)}\n return{headers,rows};\n}\nconst IMPORT_ALIASES={\n 'data':'DATA','date':'DATA','hora':'HORA','time':'HORA','confronto':'CONFRONTO','campeonato':'CAMPEONATO','competicao':'CAMPEONATO','temporada':'TEMPORADA',\n 'gols casa ht':'GOLS_CASA_HT','gols visitante ht':'GOLS_VISITANTE_HT','gols casa ft':'GOLS_CASA_FT','gols visitante ft':'GOLS_VISITANTE_FT',\n 'odds casa':'ODD_1X2_CASA','odd casa':'ODD_1X2_CASA','odds empate':'ODD_1X2_EMPATE','odd empate':'ODD_1X2_EMPATE','odds visitante':'ODD_1X2_VISITANTE','odd visitante':'ODD_1X2_VISITANTE',\n 'over ht':'ODD_OVER_HT','over 0 5':'ODD_OVER_0_5','under 0 5':'ODD_UNDER_0_5','over 1 5':'ODD_OVER_1_5','under 1 5':'ODD_UNDER_1_5','over 2 5':'ODD_OVER_2_5','under 2 5':'ODD_UNDER_2_5','over 3 5':'ODD_OVER_3_5','under 3 5':'ODD_UNDER_3_5',\n 'btts sim':'ODD_BTTS_SIM','btts nao':'ODD_BTTS_NAO','btts sim ft':'ODD_BTTS_SIM','btts nao ft':'ODD_BTTS_NAO',\n 'lg score casa':'LG_SCORE_CASA','lg score visitante':'LG_SCORE_VISITANTE','hscore':'HSCORE','lg score':'LG_SCORE',\n 'odd justa over 0 5':'ODD_JUSTA_OVER_0_5','odd justa under 0 5':'ODD_JUSTA_UNDER_0_5','odd justa over 1 5':'ODD_JUSTA_OVER_1_5','odd justa under 1 5':'ODD_JUSTA_UNDER_1_5','odd justa over 2 5':'ODD_JUSTA_OVER_2_5','odd justa under 2 5':'ODD_JUSTA_UNDER_2_5','odd justa over 3 5':'ODD_JUSTA_OVER_3_5','odd justa under 3 5':'ODD_JUSTA_UNDER_3_5'\n};\nconst IMPORT_KNOWN=new Set(['DATA','HORA','CONFRONTO','CAMPEONATO','TEMPORADA','GOLS_CASA_HT','GOLS_VISITANTE_HT','GOLS_CASA_FT','GOLS_VISITANTE_FT','ODD_1X2_CASA','ODD_1X2_EMPATE','ODD_1X2_VISITANTE','ODD_OVER_HT','ODD_OVER_0_5','ODD_UNDER_0_5','ODD_OVER_1_5','ODD_UNDER_1_5','ODD_OVER_2_5','ODD_UNDER_2_5','ODD_OVER_3_5','ODD_UNDER_3_5','ODD_BTTS_SIM','ODD_BTTS_NAO','LG_SCORE_CASA','LG_SCORE_VISITANTE','HSCORE','LG_SCORE']);\nfunction importFieldName(h){const raw=String(h??'').trim();const n=normalizeImportHeader(raw);if(IMPORT_ALIASES[n])return IMPORT_ALIASES[n];const direct=raw.toUpperCase().replace(/\\s+/g,'_');return IMPORT_KNOWN.has(direct)?direct:null}\nfunction importValue(field,v){let x=String(v??'').trim();if(!x)return null;if(field==='DATA'){let m=x.match(/^(\\d{1,2})[\\/-](\\d{1,2})[\\/-](\\d{4})/);if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;m=x.match(/^(\\d{4})[\\/-](\\d{1,2})[\\/-](\\d{1,2})/);if(m)return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;return x}if(['HORA','CONFRONTO','CAMPEONATO'].includes(field))return x;const n=Number(x.replace(/\\s/g,'').replace(',','.'));return Number.isFinite(n)?n:x}\nfunction seasonLabel(v){const s=String(v??'');return ({'58766':'2024','72034':'2025','2026':'2026'}[s]||s)}\nfunction inferImportSeason(fileName){const m=String(fileName||'').match(/(?:^|[^0-9])(2024|2025|2026)(?:[^0-9]|$)/);return m?({'2024':'58766','2025':'72034','2026':'2026'}[m[1]]||m[1]):null}\nfunction prepareImportRows(parsed,fileName=''){const fields=parsed.headers.map(h=>({header:h,field:importFieldName(h)}));const rows=[];let errors=0;const inferredSeason=inferImportSeason(fileName);for(const source of parsed.rows){const out={};fields.forEach(({header,field})=>{if(field){const v=importValue(field,source[header]);if(v!==null)out[field]=v}});if(!out.TEMPORADA&&inferredSeason)out.TEMPORADA=inferredSeason;if(!out.DATA||!out.CONFRONTO||!out.CAMPEONATO){errors++;continue}delete out.id;rows.push(out)}return{rows,errors,fields}}\nfunction setImportStatus(type,title,detail=''){const e=$('#importStatus');if(!e)return;e.className='importStatus '+type;e.innerHTML=`<span class=\"statusDot\"></span><b>${esc(title)}</b>${detail?`<small>${esc(detail)}</small>`:''}`}\nfunction importLog(msg,type=''){const box=$('#importLog');if(!box)return;const div=document.createElement('div');div.className='logLine '+type;div.textContent=msg;box.prepend(div)}\nasync function startImport(){const file=$('#importFile')?.files?.[0];if(!file)return;const btn=$('#startImport');btn.disabled=true;$('#clearImport').disabled=true;setImportStatus('working','Preparando importa\u00e7\u00e3o...','Lendo o arquivo e conferindo o Banco B.');$('#importLog').innerHTML='';let parsed;try{parsed=await parseImportFile(file)}catch(e){setImportStatus('error','Erro na leitura',e.message);btn.disabled=false;$('#clearImport').disabled=false;return}const prep=prepareImportRows(parsed,file.name);set('importTotal',prep.rows.length);set('importInserted','0');set('importSkipped','0');set('importErrors',prep.errors);if(!prep.rows.length){setImportStatus('error','Nenhum jogo v\u00e1lido',`Linhas descartadas: ${prep.errors}`);btn.disabled=false;$('#clearImport').disabled=false;return}try{const preview=await api('/api/dashboard?action=inspect_import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:prep.rows})});const season=preview.season?seasonLabel(preview.season):'';const champ=preview.championship||'';setImportStatus('ready','Arquivo conferido',`${preview.newCount} novo(s) \u2022 ${preview.existingCount} j\u00e1 existente(s)`);importLog(`PR\u00c9VIA: ${preview.total} jogo(s) \u2022 ${preview.newCount} novo(s) \u2022 ${preview.existingCount} j\u00e1 existente(s).`,'ok');if(champ||season)importLog(`Identifica\u00e7\u00e3o: ${champ||'Campeonato n\u00e3o informado'}${season?` \u2022 Temporada ${season}`:''}.`,'ok');const msg=`Encontramos ${preview.total} jogos.\n\n${preview.newCount} ser\u00e3o importados.\n${preview.existingCount} j\u00e1 existem no Banco B e n\u00e3o ser\u00e3o duplicados.${season?`\n\nTemporada: ${season}`:''}${champ?`\nCampeonato: ${champ}`:''}\n\nDeseja continuar?`;if(!confirm(msg)){setImportStatus('ready','Importa\u00e7\u00e3o cancelada','Nenhum jogo foi alterado.');importLog('Importa\u00e7\u00e3o cancelada pelo usu\u00e1rio.','error');btn.disabled=false;$('#clearImport').disabled=false;return}}catch(e){setImportStatus('error','Erro na confer\u00eancia',e.message);importLog(`Pr\u00e9via: erro \u2014 ${e.message}`,'error');btn.disabled=false;$('#clearImport').disabled=false;return}setImportStatus('working','Importando...','Os jogos est\u00e3o sendo gravados permanentemente no Banco B.');const batchSize=100,totalBatches=Math.ceil(prep.rows.length/batchSize);let inserted=0,skipped=0,errors=prep.errors;const insertedIds=[];for(let i=0;i<prep.rows.length;i+=batchSize){const batch=prep.rows.slice(i,i+batchSize);const batchNo=Math.floor(i/batchSize)+1;set('importProgressLabel',`Gravando lote ${batchNo} de ${totalBatches}...`);try{const d=await api('/api/dashboard?action=import_games',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:batch})});inserted+=Number(d.inserted||0);skipped+=Number(d.skipped||0);if(Array.isArray(d.insertedIds))insertedIds.push(...d.insertedIds);errors+=Number(d.errors||0);set('importInserted',inserted);set('importSkipped',skipped);set('importErrors',errors);const pct=Math.round((Math.min(i+batch.length,prep.rows.length)/prep.rows.length)*100);$('#importProgress').style.width=pct+'%';set('importProgressText',pct+'%');importLog(`Lote ${batchNo}/${totalBatches}: ${d.inserted||0} importado(s), ${d.skipped||0} j\u00e1 existente(s).`,'ok')}catch(e){errors++;set('importErrors',errors);setImportStatus('error','Importa\u00e7\u00e3o interrompida',e.message);importLog(`Lote ${batchNo}: erro \u2014 ${e.message}`,'error');btn.disabled=false;$('#clearImport').disabled=false;return}}$('#importProgress').style.width='100%';set('importProgressText','100%');set('importProgressLabel','Importação gravada • preparando métricas');setImportStatus('working','Jogos importados','Agora o sistema está preparando automaticamente o cache das métricas usadas pelos filtros ativos.');if(insertedIds.length){try{const warm=await api('/api/dashboard?action=prewarm_import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jogo_ids:insertedIds})});set('importProgressLabel','Cache das métricas preparado');importLog(`CACHE: ${warm.jogos||insertedIds.length} jogo(s) • ${warm.filtros||0} filtro(s) preparado(s).`,warm.ok?'ok':'error');if(!warm.ok&&Array.isArray(warm.erros)&&warm.erros.length)importLog(`CACHE: ${warm.erros.length} filtro(s) apresentou(aram) erro; o restante continua utilizável.`,'error');}catch(e){importLog(`CACHE: não foi possível pré-aquecer automaticamente — ${e.message}. As métricas continuam calculáveis sob demanda.`,'error')}}else{set('importProgressLabel','Nenhum jogo novo para preparar');}set('importProgressText','100%');setImportStatus('done','Importação finalizada',`${inserted} jogo(s) novo(s) salvo(s) permanentemente no Banco B.`);importLog(`FINALIZADO: ${inserted} novo(s), ${skipped} já existente(s), ${errors} erro(s).`,'done');btn.disabled=false;$('#clearImport').disabled=false;try{await options();await loadFilters();await dash()}catch{}}\nfunction resetImport(){const f=$('#importFile');if(f)f.value='';set('importFileName','');set('importTotal','0');set('importInserted','0');set('importSkipped','0');set('importErrors','0');set('importProgressText','0%');set('importProgressLabel','Pronto para importar');$('#importProgress').style.width='0%';$('#startImport').disabled=true;$('#importLog').innerHTML='<div class=\"muted\">Aqui aparecer\u00e1 o progresso da importa\u00e7\u00e3o.</div>';setImportStatus('idle','Aguardando arquivo');}\nasync function loadDeleteSeasons(){const sel=$('#deleteSeason'),btn=$('#deleteSeasonBtn');if(!sel)return;try{const d=await api('/api/dashboard?action=options');const seasons=d.seasonsAvailable||[];sel.innerHTML='<option value=\"\">Selecione uma temporada</option>'+seasons.map(x=>`<option value=\"${esc(x)}\">${esc(x)}</option>`).join('');if(btn)btn.disabled=!seasons.length;}catch(e){sel.innerHTML='<option value=\"\">Erro ao carregar</option>';if(btn)btn.disabled=true;}}\nasync function deleteSeason(){const sel=$('#deleteSeason'),season=sel?.value;if(!season)return;const ok=confirm(`ATEN\u00c7\u00c3O: apagar todos os jogos da temporada ${season}.\\n\\nEsta a\u00e7\u00e3o \u00e9 permanente e n\u00e3o pode ser desfeita.\\n\\nDeseja continuar?`);if(!ok)return;const btn=$('#deleteSeasonBtn');if(btn)btn.disabled=true;set('deleteSeasonMsg',`Apagando os jogos da temporada ${season}...`);try{const d=await api('/api/dashboard?action=delete_season&season='+encodeURIComponent(season),{method:'POST'});set('deleteSeasonMsg',Number(d.deleted||0)>0?`\u2713 Temporada ${season} apagada: ${Number(d.deleted||0).toLocaleString('pt-BR')} jogo(s) removido(s).`:`Nenhum jogo foi removido da temporada ${season}.`);await loadImportCount();await options();await loadFilters();await dash();await loadDeleteSeasons();}catch(e){set('deleteSeasonMsg','Erro: '+e.message);if(btn)btn.disabled=false;}}\nfunction bindImport(){const f=$('#importFile'),drop=$('#importDrop');if(!f||!drop)return;f.addEventListener('change',()=>{const file=f.files?.[0];if(file){set('importFileName',file.name);$('#startImport').disabled=false;setImportStatus('ready','Arquivo pronto',`${file.name} \u2022 ${(file.size/1024).toFixed(1)} KB`)}else resetImport()});['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));drop.addEventListener('drop',e=>{const file=e.dataTransfer.files?.[0];if(!file)return;try{const dt=new DataTransfer();dt.items.add(file);f.files=dt.files;f.dispatchEvent(new Event('change'))}catch{setImportStatus('error','N\u00e3o foi poss\u00edvel anexar o arquivo','Use o bot\u00e3o de sele\u00e7\u00e3o.')}});$('#startImport')?.addEventListener('click',()=>startImport().catch(e=>{setImportStatus('error','Erro na importa\u00e7\u00e3o',e.message);$('#startImport').disabled=false;$('#clearImport').disabled=false}));$('#clearImport')?.addEventListener('click',resetImport);$('#deleteSeasonBtn')?.addEventListener('click',()=>deleteSeason().catch(e=>set('deleteSeasonMsg','Erro: '+e.message)))}\nfunction navigate(page){const b=$(`.nav[data-page=\"${page}\"]`);$$('.nav').forEach(x=>x.classList.remove('active'));b?.classList.add('active');$$('.page').forEach(x=>x.classList.remove('active'));$(`#page-${page}`)?.classList.add('active');set('mobilePage',b?.querySelector('span')?.textContent||page);if(page==='metricas'&&!metricData)loadMetrics().catch(e=>set('metricMsg','Erro: '+e.message));if(page==='filtros'){if(!metricData)loadMetrics().then(loadFilters).catch(e=>set('filterMsg','Erro: '+e.message));else if(!filterData)loadFilters().catch(e=>set('filterMsg','Erro: '+e.message));}if(page==='backtest')loadBacktestConfigs().catch(()=>{});if(page==='importacao')loadImportCount().catch(()=>{});}\ndocument.addEventListener('click',async e=>{const ef=e.target.closest('.editFilter');if(ef){try{await editFilter(ef.dataset.id)}catch(err){set('filterMsg','Erro: '+err.message)}return}const toggle=e.target.closest('.toggleFilter');if(toggle){try{await api('/api/dashboard?action=toggle_filter&id='+toggle.dataset.id);await loadFilters();set('filterMsg','\u2713 Status do filtro atualizado.')}catch(err){set('filterMsg','Erro: '+err.message)}return}const delFilter=e.target.closest('.deleteFilter');if(delFilter){if(!confirm('Apagar este filtro e suas condi\u00e7\u00f5es? Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.'))return;try{await api('/api/dashboard?action=delete_filter&id='+delFilter.dataset.id);await loadFilters();set('filterMsg','\u2713 Filtro apagado.')}catch(err){set('filterMsg','Erro: '+err.message)}return}const delBt=e.target.closest('.deleteBacktest');if(delBt){if(!confirm('Apagar esta configura\u00e7\u00e3o de backtest? Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.'))return;try{await api('/api/dashboard?action=delete_backtest_config&id='+delBt.dataset.id);await loadBacktestConfigs();set('btMsg','\u2713 Configura\u00e7\u00e3o apagada.')}catch(err){set('btMsg','Erro: '+err.message)}return}const me=e.target.closest('.metricEdit');if(me){try{await editMetric(me.dataset.id)}catch(err){set('metricMsg','Erro: '+err.message)}return}const mt=e.target.closest('.metricToggle');if(mt){try{await api('/api/dashboard?action=toggle_metric&id='+mt.dataset.id+'&active='+mt.dataset.active);await loadMetrics();set('metricMsg','\u2713 Status da m\u00e9trica atualizado.')}catch(err){set('metricMsg','Erro: '+err.message)}return}const del=e.target.closest('.metricDelete');if(del){if(!confirm('Excluir esta m\u00e9trica/configura\u00e7\u00e3o?'))return;try{await api('/api/dashboard?action=delete_metric&id='+del.dataset.id);await loadMetrics();set('metricMsg','\u2713 M\u00e9trica exclu\u00edda.')}catch(err){set('metricMsg','Erro: '+err.message)}return}const nav=e.target.closest('.nav');if(nav)navigate(nav.dataset.page)});\ndocument.addEventListener('DOMContentLoaded',async()=>{set('appVersion',APP_VERSION);try{await options();await loadFilters();await dash()}catch(e){set('sideStatus','Erro');set('configStatus','Erro: '+e.message)}const ci=$('#exchangeCommission');if(ci)ci.value=localStorage.getItem('sofa_comissao')||'4.5';$('#saveCommission')?.addEventListener('click',()=>{const v=Number(ci.value);if(!Number.isFinite(v)||v<0||v>100){set('commissionMsg','Informe uma comiss\u00e3o entre 0 e 100%.');return}localStorage.setItem('sofa_comissao',String(v));set('commissionMsg','\u2713 Comiss\u00e3o salva.');dash().catch(()=>{})});$('#recentPageSize')?.addEventListener('change',e=>{recentPageSize=Number(e.target.value||20);recentPage=1;renderRecent(dashboardData?.rows||[])});$('#apply')?.addEventListener('click',()=>dash().catch(()=>{}));$('#pnlRef')?.addEventListener('change',()=>dash().catch(()=>{}));$('#dashFilter')?.addEventListener('change',()=>{const f=(filterData?.filtros||[]).find(x=>String(x.id)===String($('#dashFilter').value));if(f)setChampPicker('#dashChampPicker',f.campeonatos||[],Boolean((f.campeonatos||[]).length));dash().catch(()=>{})});addCondition();$('#addCondition')?.addEventListener('click',addCondition);$('#saveFilter')?.addEventListener('click',()=>saveFilter().catch(e=>set('filterMsg','Erro: '+e.message)));$('#saveMetric')?.addEventListener('click',()=>saveMetric().catch(e=>set('metricMsg','Erro: '+e.message)));$('#addMetricComponent')?.addEventListener('click',addMetricComponent);$('#clearMetric')?.addEventListener('click',()=>clearMetric());bindMetricType();$('#createBT')?.addEventListener('click',()=>backtest().catch(e=>set('btMsg','Erro: '+e.message)));loadFilters().catch(()=>{});loadBacktestConfigs().catch(()=>{});bindImport();loadImportCount().catch(()=>{});loadDeleteSeasons().catch(()=>{});});\n";
const STYLES_CSS="*{box-sizing:border-box}body{margin:0;background:#07111f;color:#e9eef7;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}.app{display:flex;min-height:100vh}.sidebar{width:220px;position:fixed;left:0;top:0;bottom:0;background:#091526;border-right:1px solid #1a2b42;padding:22px 14px;display:flex;flex-direction:column;z-index:10}.brand{font-size:20px;font-weight:700;display:flex;gap:9px;align-items:center;margin:4px 8px 30px}.brand-mark{color:#55e68a}.sidebar nav{display:grid;gap:7px}.nav{border:0;background:transparent;color:#91a0b5;text-align:left;padding:12px 10px;border-radius:12px;font-size:14px;cursor:pointer}.nav span{margin-left:8px}.nav.active,.nav:hover{background:#0b3a2a;color:#68e99a}.db{margin-top:auto;border:1px solid #20324a;border-radius:12px;padding:12px;font-size:11px;color:#8d9caf}.db strong{display:block;color:#70e59b;margin:4px 0}.db i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#5be28e}main{margin-left:220px;width:calc(100% - 220px);padding:28px;max-width:1600px}.page{display:none}.page.active{display:block}.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}.top h1{font-size:34px;margin:0 0 5px}.top p{margin:0;color:#8998ad}.filters{display:flex;gap:10px;align-items:end;flex-wrap:wrap}.filters label,.formGrid label{font-size:12px;color:#8c9bb0;display:grid;gap:6px}.filters select,.formGrid select,.formGrid input{background:#0d1c2d;border:1px solid #29405a;color:#eef3fa;border-radius:10px;padding:12px;min-width:150px;outline:none}.apply{background:#54df87;color:#04130b;border:0;border-radius:10px;padding:12px 20px;font-weight:800;cursor:pointer}.secondary{background:#102236;color:#dce7f3;border:1px solid #2a415c;border-radius:10px;padding:11px 16px;font-weight:700}.cards{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:18px}.cards article{background:#0d1a2b;border:1px solid #1d3048;border-radius:16px;padding:18px;min-height:105px}.cards small{display:block;color:#8c9bb0;font-size:12px}.cards strong{display:block;font-size:28px;margin-top:10px}.positive{color:#58e18b!important}.negative{color:#ff6870!important}.grid2{display:grid;grid-template-columns:1.7fr 1fr;gap:16px;margin-bottom:16px}.grid3{display:grid;grid-template-columns:1.5fr .8fr .9fr;gap:16px;margin-bottom:16px}.panel{background:#0d1a2b;border:1px solid #1d3048;border-radius:16px;padding:18px;margin-bottom:16px;overflow:hidden}.panel h2{font-size:15px;margin:0}.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.muted{color:#73849a;font-size:11px}.chart svg{width:100%;height:300px}.line{fill:none;stroke:#62e997;stroke-width:3}.area{fill:#62e997;opacity:.12}.bars{height:180px;display:flex;align-items:end;gap:9px;padding:10px 4px}.bars span{flex:1;max-width:28px;background:#56df8a;border-radius:6px 6px 0 0}.bars span.red{background:#ff6870}.months{display:flex;gap:8px}.months small{flex:1;text-align:center;color:#728399;font-size:9px}.donut{text-align:center}.donut-circle{margin:28px auto 15px;width:120px;height:120px;border-radius:50%;background:conic-gradient(#57df8a var(--green,0%),#ff6870 0);display:grid;place-content:center;position:relative}.donut-circle:after{content:\"\";position:absolute;inset:25px;background:#0d1a2b;border-radius:50%}.donut-circle b,.donut-circle small{z-index:1}.donut-circle b{font-size:22px}.donut-circle small{font-size:9px;color:#8797aa}.markets label{display:flex;justify-content:space-between;color:#93a2b6;font-size:11px;margin:13px 0 5px}.markets div div>span{display:block;height:5px;background:#55a8ff;border-radius:10px}.tableWrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:11px}th,td{text-align:left;padding:9px 8px;border-bottom:1px solid #1b2b40;white-space:nowrap}th{color:#718198;font-weight:600}td{color:#cfd8e5}.pill{padding:3px 7px;border-radius:20px;font-size:9px}.pill.green{background:#103b28;color:#65e597}.pill.red{background:#401b20;color:#ff747b}.formPanel{max-width:1000px}.formGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.rowBtns{display:flex;gap:10px;flex-wrap:wrap}.statusBox{margin-top:12px;color:#6fe49a;font-size:12px;min-height:18px}.condition{display:grid;grid-template-columns:1.4fr .9fr .8fr .7fr .7fr auto;gap:8px;align-items:end;margin:10px 0;padding:12px;background:#0a1625;border:1px solid #1b2d43;border-radius:12px}.condition label{display:grid;gap:5px;color:#8190a5;font-size:10px}.condition select,.condition input{background:#0e1d2f;border:1px solid #2a405a;color:#e8eef7;padding:9px;border-radius:8px;width:100%}.remove{border:1px solid #55303a;background:#24151a;color:#ff7c84;border-radius:8px;padding:9px;cursor:pointer}.metricSpecial{display:grid;grid-template-columns:.7fr 2fr;gap:12px;margin-bottom:16px}.metricSpecial label{font-size:12px;color:#8c9bb0;display:grid;gap:6px}.metricSpecial input,.metricSpecial select{background:#0d1c2d;border:1px solid #29405a;color:#eef3fa;border-radius:10px;padding:12px;outline:none}.savedList{display:grid;gap:8px}.saved{display:flex;justify-content:space-between;gap:10px;padding:12px;background:#0a1625;border:1px solid #1b2d43;border-radius:10px}.saved small{color:#8090a4}.configItem{display:flex;justify-content:space-between;padding:15px 4px;border-bottom:1px solid #1b2d43;gap:15px}.configItem strong{font-size:13px;text-align:right}.mini{grid-template-columns:repeat(5,1fr)}.mobileHead{display:none}\n@media(max-width:1100px){.metricSpecial{grid-template-columns:1fr 2fr}.cards{grid-template-columns:repeat(3,1fr)}.grid3{grid-template-columns:1fr}.formGrid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.sidebar{width:54px;padding:16px 7px}.brand span:last-child,.nav span,.db{display:none}.brand{margin:3px 4px 22px}.nav{text-align:center;padding:11px 3px;font-size:16px}main{margin-left:54px;width:calc(100% - 54px);padding:14px}.mobileHead{display:flex;justify-content:space-between;color:#a6b3c5;font-size:11px;margin-bottom:12px}.top{display:block}.top h1{font-size:27px}.filters{display:grid;grid-template-columns:1fr;margin-top:16px}.filters label,.filters select{width:100%}.apply{width:100%}.cards,.mini{grid-template-columns:repeat(2,1fr)}.cards article{padding:14px;min-height:90px}.cards strong{font-size:23px}.grid2{grid-template-columns:1fr}.chart svg{height:230px}.condition{grid-template-columns:1fr 1fr}.condition .remove{grid-column:1/-1}.formGrid{grid-template-columns:1fr}.metricSpecial{grid-template-columns:1fr}.panel{padding:14px}.top p{font-size:12px}}\n/* V18 mobile usability */\n.condition .remove:disabled{opacity:.45;cursor:not-allowed}.statusBox{line-height:1.5}.tableWrap{scrollbar-width:thin}.saved{align-items:center}.saved button{white-space:nowrap}.panel .muted{line-height:1.5}@media(max-width:760px){.saved{align-items:flex-start}.saved button{padding:9px 10px;font-size:11px}.condition{grid-template-columns:1fr 1fr}.condition label:first-child{grid-column:1/-1}.condition label:nth-child(4),.condition label:nth-child(5),.condition label:nth-child(6),.condition label:nth-child(7){grid-column:span 1}.tableWrap table{min-width:620px}.panel h2{line-height:1.3}.metricBuilder .rowBtns button{width:100%}}\n\n.savedBtns{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}\n.danger{border:1px solid rgba(255,90,100,.28);background:rgba(255,90,100,.08);color:#ff9ca3;border-radius:10px;padding:9px 12px;cursor:pointer;font:inherit}\n.danger:hover{background:rgba(255,90,100,.16)}\n\n.marketSummaryHead,.marketSummaryRow{display:grid;grid-template-columns:1.55fr .55fr .65fr .65fr .65fr .7fr .75fr .7fr;gap:7px;align-items:center}.marketSummaryHead{color:#718198;font-size:9px;padding:0 8px 7px;border-bottom:1px solid #1b2b40}.marketSummaryRow{padding:8px;border-bottom:1px solid #18283b;font-size:10px}.marketSummaryRow:last-child{border-bottom:0}.marketSummaryRow b{color:#d9e2ee;font-weight:700}.marketSummaryRow span{text-align:right;color:#aebccd}.marketSummaryRow.selected{background:#0f2b25;border-radius:8px;box-shadow:inset 2px 0 0 #58e18b}.marketSummaryRow.selected b{color:#68e99a}.marketSummaryRow .positive,.marketSummaryRow .negative{font-weight:800}\n@media(max-width:900px){.marketSummaryHead,.marketSummaryRow{grid-template-columns:1.5fr .5fr .65fr .7fr .6fr .7fr .7fr .65fr;font-size:9px;gap:4px}.marketSummaryRow{padding:7px 5px}.marketSummaryHead{padding-left:5px;padding-right:5px}}\n\n/* V40 \u2014 feedback visual durante a aplica\u00e7\u00e3o dos filtros */\n.apply.loading{opacity:.78;cursor:wait;transform:none}\n.apply:disabled{pointer-events:none}\n.spinner{display:inline-block;width:15px;height:15px;border:2px solid rgba(0,0,0,.28);border-top-color:currentColor;border-radius:50%;vertical-align:-3px;animation:sofaSpin .7s linear infinite;margin-right:7px}\n@keyframes sofaSpin{to{transform:rotate(360deg)}}\n\n/* V41 \u2014 sele\u00e7\u00e3o m\u00faltipla de campeonatos */\n.champPicker{position:relative;min-width:220px}.pickerTrigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#0d1c2d;border:1px solid #29405a;border-radius:10px;color:#eef3fa;padding:10px 12px;font:inherit;text-align:left;cursor:pointer}.pickerTrigger:disabled{opacity:.72;cursor:not-allowed}.pickerSummary{color:#eef3fa;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pickerChevron{color:#8fa9bd;font-size:14px}.pickerMenu{display:none;position:absolute;z-index:50;top:calc(100% + 5px);left:0;right:0;background:#0d1c2d;border:1px solid #29405a;border-radius:10px;padding:8px 10px;max-height:230px;overflow:auto;box-shadow:0 12px 30px rgba(0,0,0,.35)}.pickerMenu.open{display:block}.pickerAll{display:block;padding:7px 4px;border-bottom:1px solid #20344d;color:#dce7f3;cursor:pointer}.pickerItems{display:grid;grid-template-columns:1fr;gap:2px;margin-top:4px}.pickerItems label{display:flex!important;align-items:center;gap:7px;padding:7px 4px;color:#c5d0df!important;font-size:11px!important;cursor:pointer}.champPicker input{accent-color:#55df89}.champPicker.disabled{opacity:.72}.champPicker.disabled input{cursor:not-allowed}.champLabel{font-size:12px;color:#8c9bb0;display:grid;gap:6px;margin-bottom:14px}.champLabel>small{font-size:10px}@media(max-width:760px){.champPicker{width:100%;min-width:0}.pickerMenu{max-height:260px}.pickerItems{grid-template-columns:1fr 1fr}.filters .champPicker{min-width:0}.champLabel{margin-bottom:12px}}\n\n.metricCompositeFields{margin:12px 0;padding:12px;background:#0a1625;border:1px solid #1b2d43;border-radius:12px}.metricCompositeFields>label{display:grid;gap:6px;color:#8c9bb0;font-size:12px;margin-bottom:10px}.metricCompositeFields select{background:#0d1c2d;border:1px solid #29405a;color:#eef3fa;border-radius:10px;padding:10px}.metricComponent{display:flex;gap:8px;align-items:end;margin:8px 0}.metricComponent label{flex:1;display:grid;gap:5px;color:#8190a5;font-size:10px}.metricComponent select{width:100%;background:#0e1d2f;border:1px solid #2a405a;color:#e8eef7;padding:9px;border-radius:8px}.metricNormalFields{display:grid}\n/* V47 \u2014 identidade, gr\u00e1fico zero, blocos e pagina\u00e7\u00e3o */\n.dashboardBrand{display:flex;align-items:center;gap:16px}.dashboardBrand img{width:220px;height:auto;max-height:72px;object-fit:contain}.mobileBrand{display:flex;align-items:center;gap:7px}.mobileBrand img{width:26px;height:26px;object-fit:contain}.zeroLine{stroke:#718096;stroke-width:1.5;stroke-dasharray:5 5;opacity:.8}.zeroLabel,.axisLabel{fill:#73849a;font-size:10px}.grid3{grid-template-columns:1.5fr .8fr}.blockTabs{display:flex;gap:8px;overflow-x:auto;padding:2px 0 12px;scrollbar-width:thin}.blockTab{flex:0 0 auto;min-width:110px;background:#0a1625;border:1px solid #20374f;color:#cbd7e6;border-radius:10px;padding:9px 11px;text-align:left;cursor:pointer}.blockTab b,.blockTab small{display:block}.blockTab b{font-size:11px}.blockTab small{font-size:9px;color:#73849a;margin-top:4px}.blockTab.active{border-color:#55e68a;box-shadow:0 0 0 1px rgba(85,230,138,.15) inset}.recentPanel .panel-head{align-items:center}.pageSize{display:flex;align-items:center;gap:7px;color:#8392a6;font-size:10px}.pageSize select{background:#0d1c2d;border:1px solid #29405a;color:#eef3fa;border-radius:8px;padding:7px 9px}.pagination{display:flex;gap:6px;align-items:center;justify-content:center;padding-top:12px;flex-wrap:wrap}.pagination button{min-width:34px;padding:7px 9px}.pagination .active{border-color:#55e68a;color:#55e68a;background:#0b2c20}.pagination button:disabled{opacity:.4;cursor:not-allowed}.pageEllipsis{color:#718198;padding:0 3px}.champReport{margin-bottom:16px}.marketSummaryHead,.marketSummaryRow{display:grid;grid-template-columns:1.6fr repeat(7,minmax(70px,1fr));gap:7px;align-items:center}.marketSummaryHead{font-size:9px;color:#718198;border-bottom:1px solid #1b2b40;padding:7px 0}.marketSummaryRow{font-size:10px;border-bottom:1px solid #1b2b40;padding:9px 0}.marketSummaryRow.selected{background:#0b2c20;border-radius:8px}.marketSummaryRow b{font-size:10px}.marketSummaryRow span{text-align:left}.marketSummaryRow .positive,.marketSummaryRow .negative{font-weight:700}\n@media(max-width:760px){.dashboardBrand{gap:8px}.dashboardBrand img{width:150px;max-height:54px}.dashboardBrand h1{font-size:27px}.dashboardBrand p{font-size:12px}.grid3{grid-template-columns:1fr}.blockTab{min-width:96px}.recentPanel .panel-head{align-items:flex-start;gap:10px}.pageSize{font-size:9px}.marketSummaryHead,.marketSummaryRow{min-width:760px}.champReport .tableWrap{overflow-x:auto}.chart svg{height:240px}}\n.dashboardBrand{flex-direction:column;align-items:flex-start;gap:10px}.dashboardBrand img{display:block}\n\n.importOverview{display:grid;grid-template-columns:220px 1fr;gap:14px;margin-bottom:16px}.importOverview>article,.importOverview>div{background:#0d1a2b;border:1px solid #1d3048;border-radius:16px;padding:18px}.importOverview article small,.importOverview div{color:#8c9bb0;font-size:12px}.importOverview article strong{display:block;font-size:28px;color:#58e18b;margin:6px 0}.importOverview article span,.importOverview div span{display:block;color:#73849a;font-size:11px}.importOverview div{display:flex;flex-direction:column;justify-content:center;gap:6px}.importOverview div b{color:#dce7f3;font-size:13px}.importDrop{border:1px dashed #31506d;border-radius:14px;padding:28px 18px;text-align:center;background:#0a1625;cursor:pointer;display:grid;gap:7px}.importDrop:hover,.importDrop.drag{border-color:#55df89;background:#0b1d19}.importDrop strong{color:#e8eef7}.importDrop small{color:#73849a}.importDrop input{display:block;margin:10px auto 0;max-width:100%;color:#aebccd}.importIcon{font-size:30px;color:#55df89}.importFileName{margin:10px 0;color:#cbd6e3;font-size:12px;min-height:16px}.importStatus{display:flex;align-items:center;gap:8px;margin-top:14px;min-height:28px;color:#dce7f3}.importStatus small{color:#7f90a5}.importStatus .statusDot{width:8px;height:8px;border-radius:50%;background:#718198;flex:0 0 auto}.importStatus.ready .statusDot,.importStatus.working .statusDot{background:#55df89}.importStatus.done .statusDot{background:#55df89}.importStatus.error .statusDot{background:#ff6870}.progressWrap{margin:12px 0 16px}.progressTrack{height:8px;background:#081321;border-radius:20px;overflow:hidden;border:1px solid #1b2d43}.progressBar{width:0;height:100%;background:#55df89;transition:width .2s ease}.progressText{display:flex;justify-content:space-between;margin-top:6px;color:#73849a;font-size:10px}.importStats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}.importStats article{background:#0a1625;border:1px solid #1b2d43;border-radius:12px;padding:12px}.importStats small{display:block;color:#73849a;font-size:10px}.importStats strong{display:block;font-size:21px;margin:5px 0;color:#e8eef7}.importStats span{font-size:10px;color:#73849a}.importLogPanel{margin:0;padding:14px}.importLog{max-height:190px;overflow:auto;display:grid;gap:6px}.logLine{font-size:11px;color:#9eb0c3;padding:7px 9px;border-radius:8px;background:#091522}.logLine.ok{color:#75e39b}.logLine.error{color:#ff7d84}.logLine.done{color:#75e39b;font-weight:700}@media(max-width:760px){.importOverview{grid-template-columns:1fr}.importStats{grid-template-columns:1fr 1fr}.importDrop{padding:22px 12px}}\n\n.importDangerPanel{margin-top:16px;border:1px solid rgba(220,80,80,.25)}\n.importDangerPanel .danger{white-space:nowrap}\n.importDangerPanel label{display:flex;flex-direction:column;gap:6px}\n";
const LOGO_SVG="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 420 100\" role=\"img\" aria-label=\"Sofa Scrap\">\n  <defs><linearGradient id=\"g\" x1=\"0\" x2=\"1\"><stop stop-color=\"#4ee589\"/><stop offset=\"1\" stop-color=\"#8af5b2\"/></linearGradient></defs>\n  <g transform=\"translate(6 8)\">\n    <circle cx=\"42\" cy=\"42\" r=\"36\" fill=\"#0d1a2b\" stroke=\"url(#g)\" stroke-width=\"4\"/>\n    <path d=\"M20 30c9-13 28-14 39-3 8 8 10 20 6 30-5 12-20 20-33 15-14-5-21-20-16-34z\" fill=\"none\" stroke=\"#eef3fa\" stroke-width=\"4\"/>\n    <path d=\"M41 18l7 9-8 7-10-5 2-10zM60 31l-2 12-11 1-5-10 8-8zM27 45l11-2 7 9-6 9-11-4zM52 46l9-2 5 9-8 7-9-8z\" fill=\"#eef3fa\"/>\n    <rect x=\"78\" y=\"44\" width=\"9\" height=\"34\" rx=\"2\" fill=\"url(#g)\"/><rect x=\"92\" y=\"34\" width=\"9\" height=\"44\" rx=\"2\" fill=\"url(#g)\"/><rect x=\"106\" y=\"22\" width=\"9\" height=\"56\" rx=\"2\" fill=\"url(#g)\"/>\n    <path d=\"M77 30c16-13 28-18 43-19\" fill=\"none\" stroke=\"url(#g)\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M114 7l7 4-6 6\" fill=\"none\" stroke=\"url(#g)\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  </g>\n  <text x=\"135\" y=\"53\" font-family=\"Inter,Arial,sans-serif\" font-size=\"38\" font-weight=\"800\" fill=\"#eef3fa\">Sofa <tspan fill=\"#55e68a\">Scrap</tspan></text>\n  <text x=\"137\" y=\"78\" font-family=\"Inter,Arial,sans-serif\" font-size=\"10\" font-weight=\"600\" letter-spacing=\"2\" fill=\"#8797aa\">AN\u00c1LISE QUE GERA ESTRAT\u00c9GIA</text>\n</svg>\n";

async function dashboardHandler(req, res) {
const FAIR_GROUPS={
 '1X2_CASA':['ODD_1X2_CASA','ODD_1X2_EMPATE','ODD_1X2_VISITANTE'],
 '1X2_EMPATE':['ODD_1X2_CASA','ODD_1X2_EMPATE','ODD_1X2_VISITANTE'],
 '1X2_VISITANTE':['ODD_1X2_CASA','ODD_1X2_EMPATE','ODD_1X2_VISITANTE'],
 'DC_1X':['ODD_DC_1X','ODD_DC_12','ODD_DC_X2'],'DC_12':['ODD_DC_1X','ODD_DC_12','ODD_DC_X2'],'DC_X2':['ODD_DC_1X','ODD_DC_12','ODD_DC_X2'],
 'DNB_CASA':['ODD_DNB_CASA','ODD_DNB_VISITANTE'],'DNB_VISITANTE':['ODD_DNB_CASA','ODD_DNB_VISITANTE'],
 'BTTS_SIM':['ODD_BTTS_SIM','ODD_BTTS_NAO'],'BTTS_NAO':['ODD_BTTS_SIM','ODD_BTTS_NAO'],
 'OVER_0_5':['ODD_OVER_0_5','ODD_UNDER_0_5'],'UNDER_0_5':['ODD_OVER_0_5','ODD_UNDER_0_5'],
 'OVER_1_5':['ODD_OVER_1_5','ODD_UNDER_1_5'],'UNDER_1_5':['ODD_OVER_1_5','ODD_UNDER_1_5'],
 'OVER_2_5':['ODD_OVER_2_5','ODD_UNDER_2_5'],'UNDER_2_5':['ODD_OVER_2_5','ODD_UNDER_2_5'],
 'OVER_3_5':['ODD_OVER_3_5','ODD_UNDER_3_5'],'UNDER_3_5':['ODD_OVER_3_5','ODD_UNDER_3_5']
};
function fairOdd(j,market){const keys=FAIR_GROUPS[market];if(!keys)return null;const vals=keys.map(k=>num(j[k]));if(vals.some(v=>v===null||v<=1))return null;const sum=vals.reduce((a,v)=>a+1/v,0);const raw=num(j[marketMap[market]?.odd]);return raw===null||raw<=1?null:raw*sum;}
function fairPnl(j,market,stake=1,commission=.045){const f=fairOdd(j,market);const mc=marketMap[market];if(f===null||!mc)return null;const g=num(j.GOLS_CASA_FT),h=num(j.GOLS_VISITANTE_FT);if(g===null||h===null)return null;const green=mc.win(g,h);const gross=(green?f-1:-1)*stake;const net=gross>0?gross*(1-commission):gross;return {fairOdd:f,fairPnlGross:gross,fairPnlNet:net};}
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || anon;
    if (!base) return res.status(500).json({error:'Falta NEXT_PUBLIC_SUPABASE_URL nas Environment Variables do Vercel.'});
    if (!secret) return res.status(500).json({error:'Falta a chave do Supabase nas Environment Variables do Vercel.'});
    const p = req.query || {};
    const action = String(p.action || 'dashboard');
    const headers = secret.startsWith('sb_secret_') ? {apikey: secret} : {apikey: secret, Authorization:`Bearer ${secret}`};
    const get = async (path) => { const r=await fetch(`${base}/rest/v1/${path}`,{headers,cache:'no-store'}); const d=await r.json(); if(!r.ok) throw new Error(JSON.stringify(d)); return d; };
    const getAll = async (path, pageSize=1000, maxRows=50000) => {
      const clean=String(path).replace(/([?&])limit=\d+/i,'$1').replace(/[?&]$/,'');
      const out=[];
      for(let offset=0; out.length<maxRows; offset+=pageSize){
        const sep=clean.includes('?')?'&':'?';
        const page=await get(`${clean}${sep}limit=${pageSize}&offset=${offset}`);
        if(!Array.isArray(page)||!page.length) break;
        out.push(...page);
        if(page.length<pageSize) break;
      }
      return out.slice(0,maxRows);
    };
    const post = async (path, body, method='POST', select=null) => {
      const finalPath=select ? `${path}${path.includes('?')?'&':'?'}select=${encodeURIComponent(select)}` : path;
      const isInsert = method === 'POST' && !path.startsWith('rpc/');
      const baseHeaders={...headers,'Content-Type':'application/json'};
      // Para inserts dos registros que precisam do ID gerado, pedimos somente
      // os headers. Isso evita depender de SELECT/RLS para devolver a linha.
      // O PostgREST informa o registro criado no header Location.
      if (isInsert) baseHeaders.Prefer='return=representation';
      const r=await fetch(`${base}/rest/v1/${finalPath}`,{method,headers:baseHeaders,body:JSON.stringify(body)});
      const text=await r.text();
      let d={}; try{d=text?JSON.parse(text):{}}catch{d={raw:text}}
      if(!r.ok) throw new Error(JSON.stringify(d));
      if(isInsert && select){
        const loc=r.headers.get('location') || r.headers.get('content-location') || '';
        const m=loc.match(/[?&]id=eq\.([^&]+)/i);
        if(m) return [{id:m[1]}];
        // Alguns ambientes podem não mandar Location. Se a representação
        // vier mesmo assim, aproveitamos o ID retornado.
        if(Array.isArray(d) && d[0]?.id!=null) return d;
        if(d && d.id!=null) return d;
      }
      return d;
    };
    const createRow = async (table, body, fallbackPath) => {
      const created = await post(table, body);
      if (Array.isArray(created) && created[0]?.id != null) return created[0];
      if (created && !Array.isArray(created) && created.id != null) return created;
      const fallback = await get(fallbackPath);
      return Array.isArray(fallback) ? (fallback[0] || null) : null;
    };
    const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
    const seasonLabel=v=>String(v??'')==='72034'?'2025':String(v??'');
    const marketMap={
      '1X2_CASA':{label:'1X2 Casa',odd:'ODD_1X2_CASA',win:(g,h)=>g>h},
      '1X2_EMPATE':{label:'1X2 Empate',odd:'ODD_1X2_EMPATE',win:(g,h)=>g===h},
      '1X2_VISITANTE':{label:'1X2 Visitante',odd:'ODD_1X2_VISITANTE',win:(g,h)=>h>g},
      'DC_1X':{label:'Dupla Chance 1X',odd:'ODD_DC_1X',win:(g,h)=>g>=h},
      'DC_12':{label:'Dupla Chance 12',odd:'ODD_DC_12',win:(g,h)=>g!==h},
      'DC_X2':{label:'Dupla Chance X2',odd:'ODD_DC_X2',win:(g,h)=>h>=g},
      'DNB_CASA':{label:'DNB Casa',odd:'ODD_DNB_CASA',win:(g,h)=>g>h},
      'DNB_VISITANTE':{label:'DNB Visitante',odd:'ODD_DNB_VISITANTE',win:(g,h)=>h>g},
      'BTTS_SIM':{label:'BTTS Sim',odd:'ODD_BTTS_SIM',win:(g,h)=>g>=1&&h>=1},
      'BTTS_NAO':{label:'BTTS Não',odd:'ODD_BTTS_NAO',win:(g,h)=>g===0||h===0},
      'OVER_0_5':{label:'Over 0.5',odd:'ODD_OVER_0_5',win:(g,h)=>g+h>=1},
      'UNDER_0_5':{label:'Under 0.5',odd:'ODD_UNDER_0_5',win:(g,h)=>g+h<1},
      'OVER_1_5':{label:'Over 1.5',odd:'ODD_OVER_1_5',win:(g,h)=>g+h>=2},
      'UNDER_1_5':{label:'Under 1.5',odd:'ODD_UNDER_1_5',win:(g,h)=>g+h<2},
      'OVER_2_5':{label:'Over 2.5',odd:'ODD_OVER_2_5',win:(g,h)=>g+h>=3},
      'UNDER_2_5':{label:'Under 2.5',odd:'ODD_UNDER_2_5',win:(g,h)=>g+h<3},
      'OVER_3_5':{label:'Over 3.5',odd:'ODD_OVER_3_5',win:(g,h)=>g+h>=4},
      'UNDER_3_5':{label:'Under 3.5',odd:'ODD_UNDER_3_5',win:(g,h)=>g+h<4}
    };
    const fairOddMap={
      '1X2_CASA':'ODD_JUSTA_1X2_CASA','1X2_EMPATE':'ODD_JUSTA_1X2_EMPATE','1X2_VISITANTE':'ODD_JUSTA_1X2_VISITANTE',
      'DC_1X':'ODD_JUSTA_DC_1X','DC_12':'ODD_JUSTA_DC_12','DC_X2':'ODD_JUSTA_DC_X2',
      'DNB_CASA':'ODD_JUSTA_DNB_CASA','DNB_VISITANTE':'ODD_JUSTA_DNB_VISITANTE',
      'BTTS_SIM':'ODD_JUSTA_BTTS_SIM','BTTS_NAO':'ODD_JUSTA_BTTS_NAO',
      'OVER_0_5':'ODD_JUSTA_OVER_0_5','UNDER_0_5':'ODD_JUSTA_UNDER_0_5',
      'OVER_1_5':'ODD_JUSTA_OVER_1_5','UNDER_1_5':'ODD_JUSTA_UNDER_1_5',
      'OVER_2_5':'ODD_JUSTA_OVER_2_5','UNDER_2_5':'ODD_JUSTA_UNDER_2_5',
      'OVER_3_5':'ODD_JUSTA_OVER_3_5','UNDER_3_5':'ODD_JUSTA_UNDER_3_5'
    };
    const getFairOdd=(j,market)=>{const k=fairOddMap[market];const v=k?num(j[k]):null;return v!==null&&v>1?v:null};
    const buildFilter = async (fid) => {
      if(!fid) return null;
      const [f,n,c,r]=await Promise.all([
        get(`filtros?id=eq.${fid}&select=*&limit=1`),
        get(`filtro_nos?filtro_id=eq.${fid}&select=*&order=ordem.asc,id.asc&limit=2000`),
        get(`filtro_condicoes?select=*&limit=4000`),
        get(`filtro_nos_relacoes?filtro_id=eq.${fid}&select=*&order=ordem.asc,id.asc&limit=4000`)
      ]);
      return {filtro:f[0]||null,nos:n,condicoes:c.filter(x=>n.some(nn=>nn.id===x.no_id)),relacoes:r};
    };
    if(action==='db_count') {
      const r=await fetch(`${base}/rest/v1/jogos?select=id&limit=1`,{headers:{...headers,Prefer:'count=exact'},cache:'no-store'});
      if(!r.ok) throw new Error('Não foi possível consultar a quantidade de jogos do Banco B.');
      const cr=r.headers.get('content-range')||'';
      const m=cr.match(/\/([0-9]+)$/);
      return res.status(200).json({ok:true,count:m?Number(m[1]):0});
    }
    if(action==='delete_season' && req.method==='POST'){
      let season=String(p.season||'').trim();
      if(!season)return res.status(400).json({error:'Informe a temporada para exclusão.'});
      // O seletor da tela envia o valor REAL gravado em TEMPORADA.
      // Mantemos apenas a compatibilidade histórica 2025 -> 72034.
      if(season==='2025') season='72034';
      const filter=`TEMPORADA=eq.${encodeURIComponent(season)}`;
      // Primeiro conferimos quantos registros existem exatamente para esse valor.
      const existing=await get(`jogos?select=TEMPORADA&${filter}&limit=50000`);
      const found=Array.isArray(existing)?existing.length:0;
      if(!found){
        return res.status(404).json({error:`Nenhum jogo encontrado para a temporada ${season}.`,season,deleted:0});
      }
      // DELETE direto no PostgREST, sem enviar corpo JSON. Isso evita o problema
      // da versão anterior, em que o DELETE era feito pelo helper de INSERT/POST.
      const r=await fetch(`${base}/rest/v1/jogos?${filter}`,{
        method:'DELETE',
        headers:{...headers,'Prefer':'return=representation'},
        cache:'no-store'
      });
      const txt=await r.text();
      let body={}; try{body=txt?JSON.parse(txt):{}}catch{body={raw:txt}};
      if(!r.ok) throw new Error(JSON.stringify(body));
      const deleted=Array.isArray(body)?body.length:found;
      return res.status(200).json({ok:true,season,deleted,found});
    }
    if(action==='options'){
      // Usa a mesma base completa do Banco B. O limite de 5.000 deixava
      // campeonatos de fora do menu quando a tabela tinha mais registros.
      const data=await getAll('jogos?select=%22CAMPEONATO%22,%22TEMPORADA%22',1000,50000);
      return res.status(200).json({championshipsAvailable:[...new Set(data.map(x=>x.CAMPEONATO).filter(Boolean))].sort(),seasonsAvailable:[...new Set(data.map(x=>seasonLabel(x.TEMPORADA)).filter(Boolean))].sort((a,b)=>Number(b)-Number(a))});
    }
    if(action==='metrics'){
      // A tela de métricas não pode ficar travada se metricas_campos estiver sem grant/estrutura diferente.
      // As colunas oficiais do Banco B são a fonte de fallback da lista de campos.
      const [mr,cr,fr]=await Promise.allSettled([
        get('metricas?select=*&order=id.asc&limit=500'),
        get('metricas_config?select=*&order=id.asc&limit=500'),
        get('metricas_campos?select=*&order=id.asc&limit=500')
      ]);
      const m=mr.status==='fulfilled'?mr.value:[];
      const cfg=cr.status==='fulfilled'?cr.value:[];
      const dbFields=fr.status==='fulfilled'?fr.value:[];
      const normalizedCfg=cfg.map(x=>({...x,id:x.id,nome:x.nome||x.name||`Configuração ${x.id}`,campo:x.campo||x.field||'',contexto:x.contexto||'GERAL',janela:x.janela_jogos??x.janela??5,minimo:x.minimo_jogos??x.minimo??1,operacao:x.operacao||'MEDIA',ativa:x.ativa??x.ativo??true,fonte:'metricas_config'}));
      const cfgIds=new Set(normalizedCfg.map(x=>String(x.id)));
      const legacy=m.filter(x=>!cfgIds.has(String(x.id)));
      const campose=dbFields.length?dbFields:[];
      const fallbackFields=[
      ['RATING_CASA','Rating Casa'],['RATING_VISITANTE','Rating Visitante'],
      ['GOLS_CASA_FT','Gols Casa FT'],['GOLS_VISITANTE_FT','Gols Visitante FT'],
      ['XG_CASA','xG Casa'],['XG_VISITANTE','xG Visitante'],['XG_NO_ALVO_CASA','xG no alvo Casa'],['XG_NO_ALVO_VISITANTE','xG no alvo Visitante'],
      ['FINALIZACOES_TOTAIS_CASA','Finalizações totais Casa'],['FINALIZACOES_TOTAIS_VISITANTE','Finalizações totais Visitante'],
      ['FINALIZACOES_NO_ALVO_CASA','Finalizações no alvo Casa'],['FINALIZACOES_NO_ALVO_VISITANTE','Finalizações no alvo Visitante'],
      ['FINALIZACOES_FORA_ALVO_CASA','Finalizações fora do alvo Casa'],['FINALIZACOES_FORA_ALVO_VISITANTE','Finalizações fora do alvo Visitante'],
      ['FINALIZACOES_BLOQUEADAS_CASA','Finalizações bloqueadas Casa'],['FINALIZACOES_BLOQUEADAS_VISITANTE','Finalizações bloqueadas Visitante'],
      ['ESCANTEIOS_CASA','Escanteios Casa'],['ESCANTEIOS_VISITANTE','Escanteios Visitante'],
      ['POSSE_BOLA_CASA','Posse de bola Casa'],['POSSE_BOLA_VISITANTE','Posse de bola Visitante'],
      ['PASSES_TOTAIS_CASA','Passes totais Casa'],['PASSES_TOTAIS_VISITANTE','Passes totais Visitante'],
      ['PASSES_CERTOS_CASA','Passes certos Casa'],['PASSES_CERTOS_VISITANTE','Passes certos Visitante'],
      ['PASSES_LONGOS_CERTOS_CASA','Passes longos certos Casa'],['PASSES_LONGOS_CERTOS_VISITANTE','Passes longos certos Visitante'],
      ['CRUZAMENTOS_CERTOS_CASA','Cruzamentos certos Casa'],['CRUZAMENTOS_CERTOS_VISITANTE','Cruzamentos certos Visitante'],
      ['TOQUES_AREA_ADVERSARIA_CASA','Toques na área adversária Casa'],['TOQUES_AREA_ADVERSARIA_VISITANTE','Toques na área adversária Visitante'],
      ['ENTRADAS_TERCO_FINAL_CASA','Entradas no terço final Casa'],['ENTRADAS_TERCO_FINAL_VISITANTE','Entradas no terço final Visitante'],
      ['DESARMES_TOTAIS_CASA','Desarmes totais Casa'],['DESARMES_TOTAIS_VISITANTE','Desarmes totais Visitante'],
      ['PCT_DESARMES_GANHOS_CASA','% Desarmes ganhos Casa'],['PCT_DESARMES_GANHOS_VISITANTE','% Desarmes ganhos Visitante'],
      ['INTERCEPTACOES_CASA','Interceptações Casa'],['INTERCEPTACOES_VISITANTE','Interceptações Visitante'],
      ['RECUPERACOES_BOLA_CASA','Recuperações de bola Casa'],['RECUPERACOES_BOLA_VISITANTE','Recuperações de bola Visitante'],
      ['CORTES_CLEARANCES_CASA','Cortes/Clearances Casa'],['CORTES_CLEARANCES_VISITANTE','Cortes/Clearances Visitante'],
      ['PCT_DUELOS_GANHOS_CASA','% Duelos ganhos Casa'],['PCT_DUELOS_GANHOS_VISITANTE','% Duelos ganhos Visitante'],
      ['DESARMES_SOFRIDOS_CASA','Desarmes sofridos Casa'],['DESARMES_SOFRIDOS_VISITANTE','Desarmes sofridos Visitante']
    ].map(([campo,nome])=>({campo,nome}));
;
      return res.status(200).json({metricas:[...normalizedCfg,...legacy],configs:cfg,campose:campose.length?campose:fallbackFields,fieldsSource:campose.length?'Banco B':'fallback oficial',warnings:{metricas:mr.status==='rejected',configs:cr.status==='rejected',campos:fr.status==='rejected'}});
    }
    if(action==='save_metric'){
      const body=JSON.parse(p.payload||'{}');
      const campo=String(body.campo||'').trim();
      const tipo=String(body.tipo||'NORMAL').toUpperCase();
      if(!body.nome||(!campo && tipo!=='COMPOSTA')) return res.status(400).json({error:'Nome e campo são obrigatórios.'});
      if(tipo==='COMPOSTA' && (!Array.isArray(body.componentes)||body.componentes.length<2)) return res.status(400).json({error:'Uma métrica composta precisa de pelo menos 2 métricas.'});
      const exists=await get(`metricas_config?nome=eq.${encodeURIComponent(body.nome)}&select=id&limit=1`);
      if(exists.length) return res.status(409).json({error:'Já existe uma métrica com esse nome.'});
      const formula=(tipo==='CUSTO_PONTO')
        ? {tipo:'CUSTO_PONTO',odd:'ODD_1X2',pontuacao:{vitoria:3,empate:1,derrota:0}}
        : (tipo==='COMPOSTA'
          ? {tipo:'COMPOSTA',operacao:String(body.operacao||'MEDIA').toUpperCase(),componentes:body.componentes.map(x=>({metrica_id:Number(x.metrica_id)}))}
          : {tipo:'NORMAL',campo});
      // Nunca envie o campo id: no Banco B ele é identity/generated always.
      const created=await post('metricas_config',{
        nome:body.nome,descricao:body.descricao||'',campo:tipo==='COMPOSTA'?'COMPOSTA':campo,contexto:body.contexto||'CASA',
        janela_jogos:Number(body.janela_jogos||5),minimo_jogos:Number(body.minimo_jogos||3),
        operacao:body.operacao||'MEDIA',ativa:true,formula
      },'POST','id,*');
      let row=Array.isArray(created)?created[0]:created;
      let metricId=Number(row?.id);
      // Algumas configurações de PostgREST podem não devolver representation.
      // Reconsulta pelo nome recém-criado para recuperar o identity gerado.
      if(!Number.isInteger(metricId)||metricId<=0){
        const check=await get(`metricas_config?nome=eq.${encodeURIComponent(body.nome)}&select=*&order=id.desc&limit=1`);
        row=check?.[0]||null; metricId=Number(row?.id);
      }
      if(!Number.isInteger(metricId)||metricId<=0) throw new Error('A métrica foi gravada, mas não foi possível recuperar o ID gerado pelo Banco B.');
      return res.status(200).json({ok:true,metric:row});
    }
    if(action==='update_metric'){
      const id=Number(p.id||0);
      const body=JSON.parse(p.payload||'{}');
      if(!Number.isInteger(id)||id<=0) return res.status(400).json({error:'ID da métrica inválido.'});
      const atual=await get(`metricas_config?id=eq.${id}&select=*&limit=1`);
      if(!atual[0]) return res.status(404).json({error:'Métrica não encontrada.'});
      const nome=String(body.nome||'').trim();
      const tipo=String(body.tipo||'NORMAL').toUpperCase();
      const campo=String(body.campo||'').trim();
      if(!nome||(!campo&&tipo!=='COMPOSTA')) return res.status(400).json({error:'Nome e campo são obrigatórios.'});
      const dup=await get(`metricas_config?nome=eq.${encodeURIComponent(nome)}&id=neq.${id}&select=id&limit=1`);
      if(dup.length) return res.status(409).json({error:'Já existe outra métrica com esse nome.'});
      if(tipo==='COMPOSTA' && (!Array.isArray(body.componentes)||body.componentes.length<2)) return res.status(400).json({error:'Uma métrica composta precisa de pelo menos 2 métricas.'});
      const formula=(tipo==='CUSTO_PONTO')
        ? {tipo:'CUSTO_PONTO',odd:'ODD_1X2',pontuacao:{vitoria:3,empate:1,derrota:0}}
        : (tipo==='COMPOSTA'
          ? {tipo:'COMPOSTA',operacao:String(body.operacao||'MEDIA').toUpperCase(),componentes:body.componentes.map(x=>({metrica_id:Number(x.metrica_id)}))}
          : {tipo:'NORMAL',campo});
      const updated=await post(`metricas_config?id=eq.${id}`,{
        nome,descricao:body.descricao||'',campo:tipo==='COMPOSTA'?'COMPOSTA':campo,contexto:body.contexto||'CASA',
        janela_jogos:Number(body.janela_jogos||5),minimo_jogos:Number(body.minimo_jogos||3),
        operacao:body.operacao||'MEDIA',formula
      },'PATCH','id,*');
      return res.status(200).json({ok:true,metric:(Array.isArray(updated)?updated[0]:updated)||{id}});
    }
    if(action==='toggle_metric'){
      const id=Number(p.id||0); const active=String(p.active)==='true';
      const updated=await post(`metricas_config?id=eq.${id}`,{ativa:!active},'PATCH');
      return res.status(200).json({ok:true,metric:updated[0]||{id,ativa:!active}});
    }
    if(action==='delete_metric'){
      const id=Number(p.id||0);
      const used=await get(`filtro_condicoes?metrica_id=eq.${id}&select=no_id&limit=1`);
      if(used.length) return res.status(409).json({error:'Esta métrica já está sendo usada em um filtro. Desative-a em vez de excluir.'});
      await post(`metricas_config?id=eq.${id}`,{},'DELETE');
      return res.status(200).json({ok:true});
    }
    if(action==='filters'){
      const [f,n,c]=await Promise.all([get('filtros?select=*&order=id.asc&limit=500'),get('filtro_nos?select=*&order=id.asc&limit=2000'),get('filtro_condicoes?select=*&order=id.asc&limit=4000')]);
      const enriched=f.map(x=>({...x,condicoes:n.filter(nn=>nn.filtro_id===x.id&&nn.tipo==='CONDICAO').map(nn=>c.find(cc=>cc.no_id===nn.id)).filter(Boolean)}));
      return res.status(200).json({filtros:enriched,nos:n,condicoes:c});
    }
    if(action==='filter_detail'){
      const detail=await buildFilter(Number(p.id||0));
      return res.status(200).json(detail||{});
    }
    if(action==='toggle_filter'){
      const id=Number(p.id||0); const current=await get(`filtros?id=eq.${id}&select=id,ativo&limit=1`); if(!current[0])return res.status(404).json({error:'Filtro não encontrado.'});
      const updated=await post(`filtros?id=eq.${id}`,{ativo:!current[0].ativo},'PATCH'); return res.status(200).json({ok:true,filtro:updated[0]||{id,ativo:!current[0].ativo}});
    }
    if(action==='delete_filter'){
      const id=Number(p.id||0);
      if(!Number.isInteger(id)||id<=0) return res.status(400).json({error:'ID do filtro inválido.'});
      const current=await get(`filtros?id=eq.${id}&select=id,nome&limit=1`);
      if(!current[0]) return res.status(404).json({error:'Filtro não encontrado.'});
      // Remove dependências primeiro porque o schema atual do Banco B não usa FK CASCADE.
      await post(`filtro_nos_relacoes?filtro_id=eq.${id}`,{},'DELETE');
      const nodes=await get(`filtro_nos?filtro_id=eq.${id}&select=id`);
      for(const n of (nodes||[])) await post(`filtro_condicoes?no_id=eq.${Number(n.id)}`,{},'DELETE');
      await post(`filtro_nos?filtro_id=eq.${id}`,{},'DELETE');
      // Se houver backtests ligados ao filtro, preservamos o histórico e apenas desligamos o filtro.
      await post(`backtest_config?filtro_id=eq.${id}`,{filtro_id:null},'PATCH');
      await post(`filtros?id=eq.${id}`,{},'DELETE');
      return res.status(200).json({ok:true});
    }
    if(action==='update_filter'){
      const id=Number(p.id||0); const body=JSON.parse(p.payload||'{}');
      if(!Number.isInteger(id)||id<=0) return res.status(400).json({error:'ID do filtro inválido.'});
      const current=await get(`filtros?id=eq.${id}&select=id,nome,ativo,campeonatos&limit=1`);
      if(!current[0]) return res.status(404).json({error:'Filtro não encontrado.'});
      const nome=String(body.nome||'Novo filtro').trim();
      const dup=await get(`filtros?nome=eq.${encodeURIComponent(nome)}&id=neq.${id}&select=id&limit=1`);
      if(dup.length) return res.status(409).json({error:'Já existe outro filtro com esse nome.'});
      const conds=Array.isArray(body.condicoes)?body.condicoes:[];
      if(!conds.length) return res.status(400).json({error:'O filtro precisa ter pelo menos uma condição.'});
      const campeonatos=Array.isArray(body.campeonatos)?[...new Set(body.campeonatos.map(x=>String(x||'').trim()).filter(Boolean))]:[];
      await post(`filtros?id=eq.${id}`,{nome,campeonatos:campeonatos.length?campeonatos:null},'PATCH');
      // Preserve o ID do filtro. Recriamos apenas nós/condições internas para
      // que backtests e referências existentes continuem apontando para o mesmo filtro.
      await post(`filtro_nos_relacoes?filtro_id=eq.${id}`,{},'DELETE');
      const nodes=await get(`filtro_nos?filtro_id=eq.${id}&select=id`);
      for(const n of (nodes||[])) await post(`filtro_condicoes?no_id=eq.${Number(n.id)}`,{},'DELETE');
      await post(`filtro_nos?filtro_id=eq.${id}`,{},'DELETE');
      const operador=String(body.operador||'E').toUpperCase()==='OU'?'OU':'E';
      const grows=await post('filtro_nos',{filtro_id:id,no_pai_id:null,tipo:'GRUPO',operador_logico:operador,ordem:0},'POST','id');
      let grupo=Array.isArray(grows)?grows[0]:grows; let grupoId=Number(grupo?.id);
      if(!Number.isInteger(grupoId)||grupoId<=0){const recent=await get(`filtro_nos?filtro_id=eq.${id}&tipo=eq.GRUPO&select=id&order=id.desc&limit=10`);grupo=recent?.[0];grupoId=Number(grupo?.id);}
      if(!Number.isInteger(grupoId)||grupoId<=0) throw new Error('Não consegui criar o grupo interno do filtro atualizado.');
      for(let i=0;i<conds.length;i++){
        const c=conds[i]||{}; const val=(c.valor===null||c.valor===undefined||String(c.valor).trim()==='')?null:Number(String(c.valor).replace(',','.')); const pct=(c.percentual===null||c.percentual===undefined||String(c.percentual).trim()==='')?null:Number(String(c.percentual).replace(',','.'));
        const nrows=await post('filtro_nos',{filtro_id:id,no_pai_id:grupoId,tipo:'CONDICAO',ordem:i,metrica_id:c.metrica_id?Number(c.metrica_id):null,comparador:c.operador||'>',valor:val,percentual:pct},'POST','id');
        let no=Array.isArray(nrows)?nrows[0]:nrows; let noId=Number(no?.id);
        if(!Number.isInteger(noId)||noId<=0){const recent=await get(`filtro_nos?filtro_id=eq.${id}&no_pai_id=eq.${grupoId}&tipo=eq.CONDICAO&select=id,ordem&order=id.desc&limit=50`);no=(recent||[]).find(x=>Number(x.ordem)===i)||recent?.[0];noId=Number(no?.id);}
        if(!Number.isInteger(noId)||noId<=0) throw new Error(`Não consegui criar a condição ${i+1} do filtro atualizado.`);
        await post('filtro_condicoes',{no_id:noId,metrica_id:c.metrica_id?Number(c.metrica_id):null,campo:c.campo||null,operador:c.operador||'>',valor:val,percentual:pct,metrica_comparada_id:c.metrica_comparada_id?Number(c.metrica_comparada_id):null,contexto:c.contexto||'CASA',janela:Number(c.janela||5),minimo:Number(c.minimo||3),operacao:c.operacao||'MEDIA'},'POST','id');
        await post('filtro_nos_relacoes',{filtro_id:id,no_pai_id:grupoId,no_filho_id:noId,operador:operador,ordem:i},'POST','id');
      }
      return res.status(200).json({ok:true,filtro:{id,nome,ativo:current[0].ativo,campeonatos}});
    }
    if(action==='save_filter'){
      const body=JSON.parse(p.payload||'{}');
      const nome=String(body.nome||'Novo filtro').trim();
      const existing=await get(`filtros?nome=eq.${encodeURIComponent(nome)}&select=id,nome,ativo&order=id.desc&limit=1`);
      if(existing.length) return res.status(409).json({error:'Já existe um filtro com esse nome.',filtro:existing[0]});
      const conds=Array.isArray(body.condicoes)?body.condicoes:[];
      const campeonatos=Array.isArray(body.campeonatos)
        ? [...new Set(body.campeonatos.map(x=>String(x||'').trim()).filter(Boolean))]
        : [];

      // Caminho único e determinístico: REST + return=representation.
      // Não usamos RPC para criação porque algumas versões da função RPC
      // gravavam o registro mas retornavam vazio, deixando o dashboard sem ID.
      const created=await post('filtros',{
        nome,descricao:body.descricao||'',ativo:true,campeonatos:campeonatos.length?campeonatos:null
      },'POST','id,nome,ativo,campeonatos');
      let filtro=Array.isArray(created)?created[0]:created;
      let filtroId=Number(filtro?.id);
      if(!Number.isInteger(filtroId)||filtroId<=0){
        // Alguns projetos/PostgREST podem criar a linha e retornar 201 sem
        // representation/Location. Nesse caso, não dependemos do filtro
        // por query string: buscamos os últimos registros e localizamos
        // exatamente o nome que acabamos de gravar.
        const recent=await get('filtros?select=id,nome,ativo&order=id.desc&limit=50');
        const wanted=String(nome).trim().toLocaleLowerCase('pt-BR');
        filtro=(recent||[]).find(x=>String(x.nome||'').trim().toLocaleLowerCase('pt-BR')===wanted) || null;
        filtroId=Number(filtro?.id);
      }
      if(!Number.isInteger(filtroId)||filtroId<=0) throw new Error('O filtro foi gravado, mas não consegui localizar o ID gerado no Banco B. O registro existe; a falha é apenas na recuperação do ID.');

      const operador=String(body.operador||'E').toUpperCase()==='OU'?'OU':'E';
      const grows=await post('filtro_nos',{
        filtro_id:filtroId,no_pai_id:null,tipo:'GRUPO',operador_logico:operador,ordem:0
      },'POST','id');
      let grupo=Array.isArray(grows)?grows[0]:grows;
      let grupoId=Number(grupo?.id);
      if(!Number.isInteger(grupoId)||grupoId<=0){
        const recent=await get(`filtro_nos?filtro_id=eq.${filtroId}&tipo=eq.GRUPO&select=id,filtro_id,tipo&order=id.desc&limit=10`);
        grupo=recent?.[0]||null; grupoId=Number(grupo?.id);
      }
      if(!Number.isInteger(grupoId)||grupoId<=0) throw new Error('O grupo do filtro foi criado, mas não consegui localizar o ID dele no Banco B.');

      for(let i=0;i<conds.length;i++){
        const c=conds[i]||{};
        const val=(c.valor===null||c.valor===undefined||String(c.valor).trim()==='')?null:Number(String(c.valor).replace(',','.'));
        const pct=(c.percentual===null||c.percentual===undefined||String(c.percentual).trim()==='')?null:Number(String(c.percentual).replace(',','.'));
        const nrows=await post('filtro_nos',{
          filtro_id:filtroId,no_pai_id:grupoId,tipo:'CONDICAO',ordem:i,
          metrica_id:c.metrica_id?Number(c.metrica_id):null,
          comparador:c.operador||'>',valor:val,percentual:pct
        },'POST','id');
        let no=Array.isArray(nrows)?nrows[0]:nrows;
        let noId=Number(no?.id);
        if(!Number.isInteger(noId)||noId<=0){
          const recent=await get(`filtro_nos?filtro_id=eq.${filtroId}&no_pai_id=eq.${grupoId}&tipo=eq.CONDICAO&select=id,ordem&order=id.desc&limit=50`);
          no=(recent||[]).find(x=>Number(x.ordem)===i) || recent?.[0] || null; noId=Number(no?.id);
        }
        if(!Number.isInteger(noId)||noId<=0) throw new Error(`A condição ${i+1} foi criada, mas não consegui localizar o ID dela no Banco B.`);

        await post('filtro_condicoes',{
          no_id:noId,metrica_id:c.metrica_id?Number(c.metrica_id):null,
          campo:c.campo||null,operador:c.operador||'>',valor:val,percentual:pct,metrica_comparada_id:c.metrica_comparada_id?Number(c.metrica_comparada_id):null,
          contexto:c.contexto||'CASA',janela:Number(c.janela||5),minimo:Number(c.minimo||3),
          operacao:c.operacao||'MEDIA'
        },'POST','id');

        await post('filtro_nos_relacoes',{
          filtro_id:filtroId,no_pai_id:grupoId,no_filho_id:noId,
          operador:operador,ordem:i
        },'POST','id');
      }
      return res.status(200).json({ok:true,filtro:{id:filtroId,nome,ativo:true,campeonatos}});
    }
if(action==='inspect_import' && req.method==='POST'){
      let body={};
      try{body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{})}catch{ return res.status(400).json({error:'JSON inválido na prévia.'}); }
      const incoming=Array.isArray(body.rows)?body.rows:[];
      if(!incoming.length)return res.status(400).json({error:'Nenhum jogo foi enviado para a prévia.'});
      const norm=v=>String(v??'').trim().toLocaleLowerCase('pt-BR');
      const keyOf=r=>`${norm(r.TEMPORADA)}|${norm(r.DATA)}|${norm(r.CONFRONTO)}|${norm(r.CAMPEONATO)}`;
      const existing=new Set();
      for(let offset=0;;offset+=1000){
        const xs=await get(`jogos?select=id,%22TEMPORADA%22,%22DATA%22,%22CONFRONTO%22,%22CAMPEONATO%22&order=id.asc&limit=1000&offset=${offset}`);
        for(const x of (xs||[]))existing.add(keyOf(x));
        if(!xs || xs.length<1000)break;
      }
      let newCount=0, existingCount=0;
      const seen=new Set(existing);
      for(const r of incoming){ const k=keyOf(r); if(seen.has(k)) existingCount++; else {seen.add(k);newCount++;} }
      const sample=incoming.find(r=>r.TEMPORADA||r.CAMPEONATO||r.DATA);
      return res.status(200).json({ok:true,total:incoming.length,newCount,existingCount,season:sample?.TEMPORADA??null,championship:sample?.CAMPEONATO??null});
    }
    if(action==='import_games' && req.method==='POST'){
      let body={};
      try{body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{})}catch{ return res.status(400).json({error:'JSON inválido na importação.'}); }
      const incoming=Array.isArray(body.rows)?body.rows:[];
      if(!incoming.length)return res.status(400).json({error:'Nenhum jogo foi enviado para importação.'});
      const norm=v=>String(v??'').trim().toLocaleLowerCase('pt-BR');
      const keyOf=r=>`${norm(r.TEMPORADA)}|${norm(r.DATA)}|${norm(r.CONFRONTO)}|${norm(r.CAMPEONATO)}`;
      // Lemos as chaves existentes por páginas. O Banco B é permanente: nada é apagado.
      const existing=new Set();
      for(let offset=0;;offset+=1000){
        const xs=await get(`jogos?select=id,%22TEMPORADA%22,%22DATA%22,%22CONFRONTO%22,%22CAMPEONATO%22&order=id.asc&limit=1000&offset=${offset}`);
        for(const x of (xs||[]))existing.add(keyOf(x));
        if(!xs || xs.length<1000)break;
      }
      // Descobre as colunas reais da tabela antes de inserir.
      // Isso impede que uma coluna extra do TSV provoque PGREST102
      // ("object keys must match") e mantém a importação compatível
      // com a estrutura atual do Banco B.
      const schemaRows=await get('jogos?select=*&limit=1');
      const allowedKeys=new Set(Object.keys(schemaRows?.[0]||{}));
      allowedKeys.delete('id');
      // PostgREST exige que todos os objetos de um INSERT em lote tenham
      // exatamente o mesmo conjunto de chaves. O TSV pode ter células
      // vazias em linhas diferentes, então primeiro montamos a lista de
      // campos válidos e depois completamos cada linha com null.
      const candidateKeys=[...new Set(incoming.flatMap(r=>Object.keys(r||{})))].filter(k=>allowedKeys.has(k));
      const unique=[];let skipped=0,errors=0;const seen=new Set(existing);
      for(const r0 of incoming){
        const r={};
        for(const k of candidateKeys) r[k]=Object.prototype.hasOwnProperty.call(r0||{},k)?(r0[k]??null):null;
        if(!r.DATA||!r.CONFRONTO||!r.CAMPEONATO){errors++;continue}
        const k=keyOf(r);if(seen.has(k)){skipped++;continue}seen.add(k);unique.push(r);
      }
      let inserted=0;
      const insertedIds=[];
      if(unique.length){
        // Lote pequeno para não estourar payload do PostgREST/Vercel.
        for(let i=0;i<unique.length;i+=50){
          const part=unique.slice(i,i+50);
          const created=await post('jogos',part,'POST');
          const ids=Array.isArray(created)?created.map(x=>Number(x?.id)).filter(x=>Number.isInteger(x)&&x>0):[];
          insertedIds.push(...ids);
          inserted+=part.length;
        }
      }
      return res.status(200).json({ok:true,received:incoming.length,inserted,skipped,errors,insertedIds});
    }
    if(action==='prewarm_import' && req.method==='POST'){
      let body={};
      try{body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{})}catch{ return res.status(400).json({error:'JSON inválido no pré-cálculo.'}); }
      const ids=[...new Set((Array.isArray(body.jogo_ids)?body.jogo_ids:[]).map(Number).filter(x=>Number.isInteger(x)&&x>0))];
      if(!ids.length)return res.status(200).json({ok:true,jogos:0,filtros:0});
      const filtros=await get('filtros?ativo=eq.true&select=id,nome&order=id.asc&limit=500');
      let processados=0;
      const erros=[];
      for(const f of (filtros||[])){
        try{
          await post('rpc/preaquecer_cache_filtro_lote',{p_filtro_id:Number(f.id),p_jogo_ids:ids},'POST');
          processados++;
        }catch(e){
          erros.push({filtro_id:Number(f.id),nome:f.nome||'',erro:e.message});
        }
      }
      return res.status(erros.length?207:200).json({ok:erros.length===0,jogos:ids.length,filtros:processados,erros});
    }
        if(action==='save_backtest_config'){
      const body=JSON.parse(p.payload||'{}');
      const filtroId=body.filtro_id===null||body.filtro_id===undefined||body.filtro_id===''?null:Number(body.filtro_id);
      if(filtroId!==null && (!Number.isInteger(filtroId)||filtroId<=0)) return res.status(400).json({error:'ID do filtro inválido.'});
      const nome=String(body.nome||'Novo backtest').trim();
      const payloadRow={
        nome,filtro_id:filtroId,mercado:body.mercado||'OVER_2_5',
        odd_minima:body.odd_minima===null||body.odd_minima===undefined||body.odd_minima===''?null:Number(body.odd_minima),
        odd_maxima:body.odd_maxima===null||body.odd_maxima===undefined||body.odd_maxima===''?null:Number(body.odd_maxima),
        edge_minimo_pct:null,data_inicio:body.data_inicio||null,data_fim:body.data_fim||null,
        campeonato:body.campeonato||null,temporada:body.temporada||null,stake_fixa:Number(body.stake_fixa||1),ativo:true
      };
      const created=await post('backtest_config',payloadRow,'POST','id');
      let row=Array.isArray(created)?created[0]:created;
      let configId=Number(row?.id);
      if(!Number.isInteger(configId)||configId<=0){
        const recent=await get('backtest_config?select=*&order=id.desc&limit=50');
        const wanted=String(nome).trim().toLocaleLowerCase('pt-BR');
        row=(recent||[]).find(x=>String(x.nome||'').trim().toLocaleLowerCase('pt-BR')===wanted) || null;
        configId=Number(row?.id);
      }
      if(!Number.isInteger(configId)||configId<=0) throw new Error('A configuração foi gravada, mas não consegui localizar o ID gerado no Banco B. O registro existe; a falha é apenas na recuperação do ID.');
      return res.status(200).json({ok:true,config:row});
    }
    if(action==='delete_backtest_config'){
      const id=Number(p.id||0);
      if(!Number.isInteger(id)||id<=0) return res.status(400).json({error:'ID da configuração inválido.'});
      const current=await get(`backtest_config?id=eq.${id}&select=id&limit=1`);
      if(!current[0]) return res.status(404).json({error:'Configuração de backtest não encontrada.'});
      await post(`backtest_config?id=eq.${id}`,{},'DELETE');
      return res.status(200).json({ok:true});
    }
    if(action==='backtest_configs') return res.status(200).json({configs:await get('backtest_config?id=not.is.null&select=*&order=id.desc&limit=10')});
    if(action==='backtest'){
      const cfgid=Number(p.config_id); if(!Number.isInteger(cfgid)||cfgid<=0) return res.status(400).json({error:'ID de configuração de backtest inválido.'}); const a=await get(`backtest_config?id=eq.${cfgid}&select=*&limit=1`); const cfg=a[0]||null;
      if(!cfg) return res.status(400).json({error:'Configuração de backtest não encontrada.'});
      const mercado=cfg.mercado||'OVER_2_5',mc=marketMap[mercado]; if(!mc) return res.status(400).json({error:'Mercado não suportado nesta versão.'});
      if(cfg.filtro_id){
        try{
          const filterCheck=await get(`filtros?id=eq.${Number(cfg.filtro_id)}&select=id,nome,ativo,campeonatos&limit=1`);
          if(!filterCheck[0]) return res.status(400).json({error:'O filtro selecionado não existe mais no Banco B.',filtro_id:cfg.filtro_id});
          if(filterCheck[0].ativo===false) return res.status(400).json({error:'O filtro selecionado está inativo.',filtro_id:cfg.filtro_id});
          // Executa o filtro diretamente por jogo. Isso evita depender da função consolidada
          // executar_backtest_detalhado, que pode ter assinatura/RETURNS diferente no Banco B.
          // A função avaliar_filtro já é a função validada do motor de filtros.
          let path='jogos?select=*&order=%22DATA%22.asc&limit=5000';
          if(cfg.campeonato) path+=`&%22CAMPEONATO%22=eq.${encodeURIComponent(cfg.campeonato)}`;
          if(cfg.temporada) path+=`&%22TEMPORADA%22=eq.${encodeURIComponent(String(cfg.temporada)==='2025'?'72034':cfg.temporada)}`;
          if(cfg.data_inicio) path+=`&%22DATA%22=gte.${encodeURIComponent(cfg.data_inicio)}`;
          if(cfg.data_fim) path+=`&%22DATA%22=lte.${encodeURIComponent(cfg.data_fim)}`;
          let games=await get(path);
          const filtroCampeonatos=Array.isArray(filterCheck[0].campeonatos)?filterCheck[0].campeonatos.filter(Boolean):[];
          if(filtroCampeonatos.length){ const allowed=new Set(filtroCampeonatos.map(x=>String(x))); games=games.filter(j=>allowed.has(String(j.CAMPEONATO||''))); }
          const eligible=games.filter(j=>{
            const g=num(j.GOLS_CASA_FT),h=num(j.GOLS_VISITANTE_FT),odd=num(j[mc.odd]);
            if(g===null||h===null||odd===null||odd<=1)return false;
            if(cfg.odd_minima!==null && cfg.odd_minima!==undefined && odd<Number(cfg.odd_minima))return false;
            if(cfg.odd_maxima!==null && cfg.odd_maxima!==undefined && odd>Number(cfg.odd_maxima))return false;
            return true;
          });
          const approved=[];
          // Avaliação confiável jogo a jogo. A RPC em lote da V46 pode retornar
          // uma representação diferente dependendo da versão do PostgREST;
          // para não transformar um filtro válido em zero entradas, usamos
          // a função oficial avaliar_filtro diretamente, em blocos de 20.
          const chunkSize=20;
          for(let i=0;i<eligible.length;i+=chunkSize){
            const chunk=eligible.slice(i,i+chunkSize);
            const results=await Promise.all(chunk.map(async j=>{
              try{
                const r=await post('rpc/avaliar_filtro',{p_filtro_id:Number(cfg.filtro_id),p_jogo_id:Number(j.id)},'POST');
                const ok=r===true||r===1||r==='true'||
                  (Array.isArray(r)&&((r[0]===true)||(r[0]===1)||(r[0]?.avaliar_filtro===true)))||
                  r?.avaliar_filtro===true||r?.avaliar_filtro===1||r?.avaliar_filtro==='true';
                return {j,ok};
              }catch(e){throw new Error(`Falha ao avaliar o filtro no jogo ${j.id}: ${e.message||String(e)}`);}
            }));
            results.forEach(x=>{if(x.ok)approved.push(x.j)});
          }
          const mapped=approved.map(j=>{
            const g=num(j.GOLS_CASA_FT),h=num(j.GOLS_VISITANTE_FT),odd=num(j[mc.odd]);
            const green=mc.win(g,h);
            return {DATA:j.DATA,CONFRONTO:j.CONFRONTO,CAMPEONATO:j.CAMPEONATO,odd,green,pnl:(green?odd-1:-1)*Number(cfg.stake_fixa||1)};
          });
          let cum=0,peak=0,dd=0;const curve=mapped.map(r=>{cum+=r.pnl;peak=Math.max(peak,cum);dd=Math.max(dd,peak-cum);return{data:r.DATA,acumulado:cum};});
          const greens=mapped.filter(r=>r.green).length,lucro=mapped.reduce((s,r)=>s+r.pnl,0),stake=Number(cfg.stake_fixa||1);
          return res.status(200).json({config:cfg,entries:mapped.length,greens,reds:mapped.length-greens,winrate:mapped.length?greens/mapped.length*100:0,oddMedia:mapped.length?mapped.reduce((s,r)=>s+r.odd,0)/mapped.length:0,lucro,roi:mapped.length?lucro/(mapped.length*stake)*100:0,drawdown:dd,curve,rows:mapped.slice(-50).reverse()});
        }catch(e){
          return res.status(500).json({error:'Não foi possível executar o filtro salvo no backtest. O filtro não foi ignorado.',detail:e.message||String(e)});
        }
      }
      let path='jogos?select=*&order=%22DATA%22.asc&limit=5000';
      if(cfg.campeonato) path+=`&CAMPEONATO=eq.${encodeURIComponent(cfg.campeonato)}`;
      if(cfg.temporada) path+=`&%22TEMPORADA%22=eq.${encodeURIComponent(String(cfg.temporada)==='2025'?'72034':cfg.temporada)}`;
      const data=await get(path); const rows=data.map(j=>{const g=num(j.GOLS_CASA_FT),h=num(j.GOLS_VISITANTE_FT),odd=num(j[mc.odd]);if(g===null||h===null||odd===null||odd<=1)return null;const green=mc.win(g,h);return {DATA:j.DATA,CONFRONTO:j.CONFRONTO,CAMPEONATO:j.CAMPEONATO,odd,green,pnl:(green?odd-1:-1)*Number(cfg.stake_fixa||1)};}).filter(Boolean);
      let cum=0,peak=0,dd=0;const curve=rows.map(r=>{cum+=r.pnl;peak=Math.max(peak,cum);dd=Math.max(dd,peak-cum);return{data:r.DATA,acumulado:cum};});const greens=rows.filter(r=>r.green).length,lucro=rows.reduce((s,r)=>s+r.pnl,0);return res.status(200).json({config:cfg,entries:rows.length,greens,reds:rows.length-greens,winrate:rows.length?greens/rows.length*100:0,oddMedia:rows.length?rows.reduce((s,r)=>s+r.odd,0)/rows.length:0,lucro,roi:rows.length?lucro/(rows.length*Number(cfg.stake_fixa||1))*100:0,drawdown:dd,curve,rows:rows.slice(-50).reverse()});
    }
    const temporada=String(p.temporada||'Todos'), campeonato=String(p.campeonato||'Todos'), market=String(p.mercado||'OVER_2_5');
    const commission=Math.max(0,Math.min(100,Number(p.comissao??4.5)||0))/100;
    const pnlRef=String(p.pnl_ref||'365').toUpperCase()==='JUSTA'?'JUSTA':'365';
    let campeonatosSelecionados=[];
    try{ const raw=p.campeonatos; if(raw){ const arr=JSON.parse(String(raw)); if(Array.isArray(arr)) campeonatosSelecionados=[...new Set(arr.map(x=>String(x||'').trim()).filter(Boolean))]; } }catch{}
    const select=['"id"','"DATA"','"CONFRONTO"','"CAMPEONATO"','"TEMPORADA"','"GOLS_CASA_FT"','"GOLS_VISITANTE_FT"',
      '"ODD_1X2_CASA"','"ODD_1X2_EMPATE"','"ODD_1X2_VISITANTE"','"ODD_DC_1X"','"ODD_DC_12"','"ODD_DC_X2"',
      '"ODD_DNB_CASA"','"ODD_DNB_VISITANTE"','"ODD_BTTS_SIM"','"ODD_BTTS_NAO"',
      '"ODD_OVER_0_5"','"ODD_UNDER_0_5"','"ODD_OVER_1_5"','"ODD_UNDER_1_5"',
      '"ODD_OVER_2_5"','"ODD_UNDER_2_5"','"ODD_OVER_3_5"','"ODD_UNDER_3_5"',
      '"ODD_JUSTA_1X2_CASA"','"ODD_JUSTA_1X2_EMPATE"','"ODD_JUSTA_1X2_VISITANTE"',
      '"ODD_JUSTA_DC_1X"','"ODD_JUSTA_DC_12"','"ODD_JUSTA_DC_X2"','"ODD_JUSTA_DNB_CASA"','"ODD_JUSTA_DNB_VISITANTE"',
      '"ODD_JUSTA_BTTS_SIM"','"ODD_JUSTA_BTTS_NAO"','"ODD_JUSTA_OVER_0_5"','"ODD_JUSTA_UNDER_0_5"',
      '"ODD_JUSTA_OVER_1_5"','"ODD_JUSTA_UNDER_1_5"','"ODD_JUSTA_OVER_2_5"','"ODD_JUSTA_UNDER_2_5"',
      '"ODD_JUSTA_OVER_3_5"','"ODD_JUSTA_UNDER_3_5"'].join(',');
    let path=`jogos?select=${select}&order=%22DATA%22.asc`;
    if(temporada&&!/^todos$/i.test(temporada))path+=`&%22TEMPORADA%22=eq.${encodeURIComponent(temporada==='2025'?'72034':temporada)}`;
    if(campeonato&&!/^todos$/i.test(campeonato) && !campeonatosSelecionados.length)path+=`&%22CAMPEONATO%22=eq.${encodeURIComponent(campeonato)}`;
    let data=await getAll(path,1000,50000);
    if(campeonatosSelecionados.length){ const allowed=new Set(campeonatosSelecionados); data=data.filter(j=>allowed.has(String(j.CAMPEONATO||''))); }
    const rawDashboardGames=data.length;
    const filtroId=Number(p.filtro_id||0);
    let selectedFilter=null;
    if(filtroId>0){
      const fcheck=await get(`filtros?id=eq.${filtroId}&select=id,nome,ativo,campeonatos&limit=1`);
      if(!fcheck[0]) return res.status(400).json({error:'O filtro selecionado não existe mais no Banco B.',filtro_id:filtroId});
      if(fcheck[0].ativo===false) return res.status(400).json({error:'O filtro selecionado está inativo.',filtro_id:filtroId});
      selectedFilter=fcheck[0];
      const filtroCampeonatos=Array.isArray(selectedFilter.campeonatos)?selectedFilter.campeonatos.filter(Boolean):[];
      if(filtroCampeonatos.length){ const allowed=new Set(filtroCampeonatos.map(x=>String(x))); data=data.filter(j=>allowed.has(String(j.CAMPEONATO||''))); }
      // O Dashboard usa deliberadamente a mesma avaliação oficial jogo a jogo
      // validada no Banco B. Não usamos executar_filtro_jogos aqui porque essa RPC
      // pode devolver uma resposta paginada/truncada pelo PostgREST, produzindo
      // contagens diferentes do resultado real do filtro.
      const approved=[];
      // Usa a RPC oficial em lote: uma chamada HTTP avalia vários jogos.
      // Isso preserva exatamente o motor de avaliar_filtro, mas elimina uma
      // chamada HTTP por jogo.
      const chunkSize=100;
      for(let i=0;i<data.length;i+=chunkSize){
        const chunk=data.slice(i,i+chunkSize);
        try{
          const ids=chunk.map(j=>Number(j.id));
          const r=await post('rpc/avaliar_filtro_lote',{p_filtro_id:filtroId,p_jogo_ids:ids},'POST');
          let rows=r;
          if(typeof rows==='string'){try{rows=JSON.parse(rows)}catch{rows=[]}}
          if(!Array.isArray(rows)) rows=rows?.data||rows?.rows||[];
          const approvedIds=new Set(rows.map(x=>{
            if(typeof x==='number'||typeof x==='string') return Number(x);
            return Number(x?.jogo_id??x?.id);
          }).filter(Number.isFinite));
          chunk.forEach(j=>{if(approvedIds.has(Number(j.id))) approved.push(j)});
        }catch(e){
          throw new Error(`Falha ao avaliar o lote do filtro (${chunk.length} jogos): ${e.message||e}`);
        }
      }
      data=approved;
    }
    const mc=marketMap[market]||marketMap.OVER_2_5;
    const getRows=m=>data.map(j=>{const g=num(j.GOLS_CASA_FT),h=num(j.GOLS_VISITANTE_FT),odd=num(j[m.odd]);if(g===null||h===null||odd===null||odd<=1)return null;const green=m.win(g,h),marketKey=Object.entries(marketMap).find(([,v])=>v===m)?.[0],fo=marketKey?getFairOdd(j,marketKey):null,primaryOdd=pnlRef==='JUSTA'?fo:odd;if(primaryOdd===null||primaryOdd<=1)return null;return {...j,temporada_label:seasonLabel(j.TEMPORADA),odd,green,pnl:green?primaryOdd-1:-1,mercado_label:m.label,fairOdd:fo,fairPnlGross:fo===null?null:(green?fo-1:-1),fairPnlNet:fo===null?null:(green?fo-1:-1),pnlOdd:odd,pnlOddJusta:fo,pnlRef};}).filter(Boolean);
    const rows=getRows(mc);let cum=0,peak=0,dd=0;const curve=rows.map(x=>{cum+=x.pnl;peak=Math.max(peak,cum);dd=Math.max(dd,peak-cum);return{data:x.DATA,confronto:x.CONFRONTO,pnl:x.pnl,acumulado:cum};});
    const greens=rows.filter(x=>x.green).length,lucro=rows.reduce((s,x)=>s+x.pnl,0),entries=rows.length,calcROI=entries?lucro/entries*100:0;const fairRows=rows.filter(x=>x.fairPnlNet!==null),fairLucro=fairRows.reduce((s,x)=>s+x.fairPnlNet,0),fairROI=entries?fairLucro/entries*100:0;
    const monthlyMap={};rows.forEach(x=>{const k=String(x.DATA||'').slice(0,7)||'Sem data';(monthlyMap[k]??=[]).push(x);});
    const monthly=Object.entries(monthlyMap).map(([mes,rs])=>{const l=rs.reduce((s,x)=>s+x.pnl,0),g=rs.filter(x=>x.green).length;return{mes,entries:rs.length,greens:g,reds:rs.length-g,winrate:g/rs.length*100,lucro:l,roi:l/rs.length*100};});
    const champMap={};rows.forEach(x=>(champMap[x.CAMPEONATO||'Sem campeonato']??=[]).push(x));
    const championships=Object.entries(champMap).map(([nome,rs])=>{const l=rs.reduce((s,x)=>s+x.pnl,0),g=rs.filter(x=>x.green).length;return{nome,entries:rs.length,greens:g,reds:rs.length-g,winrate:g/rs.length*100,oddMedia:rs.length?rs.reduce((s,x)=>s+x.odd,0)/rs.length:0,lucro:l,roi:l/rs.length*100};}).sort((a,b)=>b.entries-a.entries);
    const blocks=[]; const blockCount=Math.min(10,rows.length); if(blockCount){const baseSize=Math.floor(rows.length/blockCount),remainder=rows.length%blockCount;let cursor=0;for(let b=0;b<blockCount;b++){const size=baseSize+(b<remainder?1:0),rs=rows.slice(cursor,cursor+size),l=rs.reduce((s,x)=>s+x.pnl,0),g=rs.filter(x=>x.green).length;blocks.push({bloco:b+1,inicio:cursor+1,fim:cursor+rs.length,entries:rs.length,greens:g,reds:rs.length-g,winrate:g/rs.length*100,oddMedia:rs.length?rs.reduce((s,x)=>s+x.odd,0)/rs.length:0,lucro:l,roi:l/rs.length*100});cursor+=size;}}
    const tableRows=rows.map(x=>({DATA:x.DATA,CONFRONTO:x.CONFRONTO,CAMPEONATO:x.CAMPEONATO,mercado_label:x.mercado_label,odd:x.odd,green:x.green,pnl:x.pnl}));
    const markets=Object.entries(marketMap).map(([k,m])=>{const rs=getRows(m),l=rs.reduce((s,x)=>s+x.pnl,0),g=rs.filter(x=>x.green).length,fr=rs.filter(x=>x.fairPnlNet!==null),fl=fr.reduce((s,x)=>s+x.fairPnlNet,0);return{mercado:k,label:m.label,entries:rs.length,greens:g,reds:rs.length-g,winrate:rs.length?g/rs.length*100:0,lucro:l,roi:rs.length?l/rs.length*100:0,oddJustaMedia:fr.length?fr.reduce((s,x)=>s+x.fairOdd,0)/fr.length:null,lucroJustoLiquido:fl,roiJustoLiquido:fr.length?fl/fr.length*100:0};});
    return res.status(200).json({source:'Supabase Banco B',market,pnlRef,marketLabel:mc.label,filter:selectedFilter?{id:selectedFilter.id,nome:selectedFilter.nome,ativo:selectedFilter.ativo,jogosAprovados:data.length,jogosAntesDoFiltro:rawDashboardGames,jogosComDadosDoMercado:data.filter(j=>num(j[mc.odd])!==null&&num(j[mc.odd])>1).length}:null,entries,greens,reds:entries-greens,winrate:entries?greens/entries*100:0,oddMedia:entries?rows.reduce((s,x)=>s+x.odd,0)/entries:0,lucro,roi:calcROI,drawdown:dd,curve,rows:tableRows,fairOddMedia:fairRows.length?fairRows.reduce((s,x)=>s+x.fairOdd,0)/fairRows.length:null,lucroJustoLiquido:fairLucro,roiJustoLiquido:fairROI,comissaoExchange:commission*100,monthly,championships,blocks,distributions:{green:greens,red:entries-greens},markets,seasonsAvailable:[...new Set(data.map(x=>seasonLabel(x.TEMPORADA)).filter(Boolean))].sort((a,b)=>Number(b)-Number(a)),championshipsAvailable:[...new Set(data.map(x=>x.CAMPEONATO).filter(Boolean))].sort(),totalJogosFiltrados:data.length});
  } catch(e){return res.status(500).json({error:e.message||String(e)});}
}


async function heartbeatHandler(req, res) {
  try {
    const expected = process.env.CRON_SECRET;
    if (expected) {
      const auth = req.headers.authorization || '';
      if (auth !== `Bearer ${expected}`) return res.status(401).json({ error: 'Unauthorized' });
    }
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!base || !secret) return res.status(500).json({ error: 'Supabase não configurado nas Environment Variables do Vercel.' });
    const headers = secret.startsWith('sb_secret_') ? { apikey: secret } : { apikey: secret, Authorization: `Bearer ${secret}` };
    const r = await fetch(`${base}/rest/v1/jogos?select=id&limit=1`, { headers, cache: 'no-store' });
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text || 'Falha ao consultar o Supabase.' });
    }
    const rows = await r.json();
    return res.status(200).json({ ok: true, source: 'Supabase Banco B', checkedAt: new Date().toISOString(), hasData: Array.isArray(rows) && rows.length > 0 });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}


function responseAdapter(res) {
  let statusCode=200;
  return {
    status(code) { statusCode=Number(code)||200; return this; },
    json(payload) {
      const out=JSON.stringify(payload);
      res.statusCode=statusCode;
      res.setHeader('Content-Type','application/json; charset=utf-8');
      res.setHeader('Cache-Control','no-store');
      res.end(out);
    },
    end(body='') {
      res.statusCode=statusCode;
      res.end(body);
    }
  };
}

async function readBody(req) {
  if(req.method==='GET' || req.method==='HEAD') return undefined;
  const chunks=[];
  for await (const chunk of req) chunks.push(chunk);
  const raw=Buffer.concat(chunks).toString('utf8');
  if(!raw) return undefined;
  try { return JSON.parse(raw); } catch { return raw; }
}

function sendStatic(res,status,type,body) {
  res.statusCode=status;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','no-cache');
  res.end(body);
}

const server=http.createServer(async (req,res)=>{
  try {
    const u=new URL(req.url||'/', `http://${req.headers.host||'localhost'}`);
    if(u.pathname==='/health' || u.pathname==='/') {
      if(u.pathname==='/health') return sendStatic(res,200,'application/json; charset=utf-8',JSON.stringify({ok:true,service:'sofa-scrap-dashboard'}));
      return sendStatic(res,200,'text/html; charset=utf-8',INDEX_HTML);
    }
    if(u.pathname==='/app.js') return sendStatic(res,200,'text/javascript; charset=utf-8',APP_JS);
    if(u.pathname==='/styles.css') return sendStatic(res,200,'text/css; charset=utf-8',STYLES_CSS);
    if(u.pathname==='/logo.svg') return sendStatic(res,200,'image/svg+xml; charset=utf-8',LOGO_SVG);
    if(u.pathname==='/api/dashboard') {
      const body=await readBody(req);
      const q=Object.fromEntries(u.searchParams.entries());
      const rr={...req,query:q,body};
      return await dashboardHandler(rr,responseAdapter(res));
    }
    if(u.pathname==='/api/heartbeat') {
      const body=await readBody(req);
      const q=Object.fromEntries(u.searchParams.entries());
      const rr={...req,query:q,body};
      return await heartbeatHandler(rr,responseAdapter(res));
    }
    return sendStatic(res,404,'application/json; charset=utf-8',JSON.stringify({error:'Not found'}));
  } catch(e) {
    console.error(e);
    if(!res.headersSent) sendStatic(res,500,'application/json; charset=utf-8',JSON.stringify({error:e?.message||String(e)}));
  }
});

const port=Number(process.env.PORT||10000);
server.listen(port,'0.0.0.0',()=>console.log(`Sofa Scrap running on port ${port}`));
