// 全局年份与默认值
const BASE_YEAR = 2025;
const YEARS = [2026, 2027, 2028, 2029, 2030];
const defaults = {
  revenueGrowth: 0.10,
  margin: 0.40,
  rates: { sales: 0.10, admin: 0.06, rd: 0.08 },
  wacc: 0.12,
  g: 0.02,
  tax: 0.25
};

// 初始状态（可被上传覆盖）
const state = {
  baseYear: BASE_YEAR,
  years: YEARS,
  biz: [
    {
      name: '业务1', q0: 1000, p0: 10,
      qGrowth: {2026: 0.00, 2027: defaults.revenueGrowth, 2028: defaults.revenueGrowth, 2029: defaults.revenueGrowth, 2030: defaults.revenueGrowth},
      pGrowth: {2026: 0.00, 2027: 0.00, 2028: 0.00, 2029: 0.00, 2030: 0.00},
      margin: {2026: defaults.margin, 2027: defaults.margin, 2028: defaults.margin, 2029: defaults.margin, 2030: defaults.margin}
    },
    {
      name: '业务2', q0: 500, p0: 20,
      qGrowth: {2026: 0.00, 2027: defaults.revenueGrowth, 2028: defaults.revenueGrowth, 2029: defaults.revenueGrowth, 2030: defaults.revenueGrowth},
      pGrowth: {2026: 0.00, 2027: 0.00, 2028: 0.00, 2029: 0.00, 2030: 0.00},
      margin: {2026: defaults.margin, 2027: defaults.margin, 2028: defaults.margin, 2029: defaults.margin, 2030: defaults.margin}
    }
  ],
  company: {
    salesRate: {2026: defaults.rates.sales, 2027: defaults.rates.sales, 2028: defaults.rates.sales, 2029: defaults.rates.sales, 2030: defaults.rates.sales},
    adminRate: {2026: defaults.rates.admin, 2027: defaults.rates.admin, 2028: defaults.rates.admin, 2029: defaults.rates.admin, 2030: defaults.rates.admin},
    rdRate: {2026: defaults.rates.rd, 2027: defaults.rates.rd, 2028: defaults.rates.rd, 2029: defaults.rates.rd, 2030: defaults.rates.rd},
    taxRate: {2026: defaults.tax, 2027: defaults.tax, 2028: defaults.tax, 2029: defaults.tax, 2030: defaults.tax},
    depreciation: {2026: 50, 2027: 55, 2028: 60, 2029: 65, 2030: 70},
    capex: {2026: 80, 2027: 85, 2028: 90, 2029: 95, 2030: 100},
    wacc: defaults.wacc,
    g: defaults.g,
    tax: defaults.tax
  },
  comps: []
};

const el = sel => document.querySelector(sel);

// CSV 模板生成
function templateForecastCSV() {
  const header = ['Item','2026','2027','2028','2029','2030'].join(',');
  const rows = [
    ['Business1 Initial Volume', 1000, '', '', '', ''],
    ['Business1 Initial Price', 10, '', '', '', ''],
    ['Business1 Volume Growth', '', 0.10, 0.10, 0.10, 0.10],
    ['Business1 Price Growth', '', 0.00, 0.00, 0.00, 0.00],
    ['Business1 Gross Margin', 0.40, 0.40, 0.40, 0.40, 0.40],
    ['Business2 Initial Volume', 500, '', '', '', ''],
    ['Business2 Initial Price', 20, '', '', '', ''],
    ['Business2 Volume Growth', '', 0.10, 0.10, 0.10, 0.10],
    ['Business2 Price Growth', '', 0.00, 0.00, 0.00, 0.00],
    ['Business2 Gross Margin', 0.40, 0.40, 0.40, 0.40, 0.40],
    ['Selling Expense Rate', 0.10, 0.10, 0.10, 0.10, 0.10],
    ['Admin Expense Rate', 0.06, 0.06, 0.06, 0.06, 0.06],
    ['R&D Expense Rate', 0.08, 0.08, 0.08, 0.08, 0.08],
    ['Depreciation & Amortization', 50, 55, 60, 65, 70],
    ['Capital Expenditures', 80, 85, 90, 95, 100]
  ];
  return [header, ...rows.map(a => a.join(','))].join('\n');
}
function templateCompsCSV() {
  const header = ['Ticker','Company','EV','EBIT','EBITDA','Price','Revenue','Book Value'].join(',');
  const rows = [
    ['AAA','Peer A',1000,80,120,20,500,300],
    ['BBB','Peer B',1500,120,180,35,800,500],
    ['CCC','Peer C',800,60,100,12,400,250]
  ];
  return [header, ...rows.map(a => a.join(','))].join('\n');
}
function downloadCSV(name, content) {
  const contentWithBom = '\ufeff' + content; // UTF-8 BOM to avoid garbled text in Excel
  const blob = new Blob([contentWithBom], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// CSV 解析（简单）
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(l => l.split(',').map(v => v.trim()));
}

// 上传处理：预测
function handleForecastUpload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const mat = parseCSV(reader.result);
    const header = mat[0];
    const yearCols = header.slice(1).map(v => parseInt(v,10));
    let usedDefault = false;
    const rOrDef = (row, idx, def) => {
      const v = row && row[idx] !== '' ? parseFloat(row[idx]) : def; if(row && row[idx]==='') usedDefault = true; return isNaN(v)?def:v;
    };
    const findRow = (labels) => mat.find(r => labels.includes(r[0])) || null;
    const L = {
      b1q0: ['业务1初始销量','Business1 Initial Volume','Business 1 Initial Volume','B1 Initial Volume'],
      b1p0: ['业务1初始单价','Business1 Initial Price','Business 1 Initial Price','B1 Initial Price'],
      b1qg: ['业务1销量增长率','Business1 Volume Growth','Business 1 Volume Growth','B1 Volume Growth'],
      b1pg: ['业务1单价增长率','Business1 Price Growth','Business 1 Price Growth','B1 Price Growth'],
      b1m:  ['业务1毛利率','Business1 Gross Margin','Business 1 Gross Margin','B1 Gross Margin'],
      b2q0: ['业务2初始销量','Business2 Initial Volume','Business 2 Initial Volume','B2 Initial Volume'],
      b2p0: ['业务2初始单价','Business2 Initial Price','Business 2 Initial Price','B2 Initial Price'],
      b2qg: ['业务2销量增长率','Business2 Volume Growth','Business 2 Volume Growth','B2 Volume Growth'],
      b2pg: ['业务2单价增长率','Business2 Price Growth','Business 2 Price Growth','B2 Price Growth'],
      b2m:  ['业务2毛利率','Business2 Gross Margin','Business 2 Gross Margin','B2 Gross Margin'],
      sales:['销售费用率','Selling Expense Rate'],
      admin:['管理费用率','Admin Expense Rate','G&A Expense Rate','General & Administrative Expense Rate'],
      rd:   ['研发费用率','R&D Expense Rate'],
      dep:  ['折旧摊销','Depreciation & Amortization','Depreciation and Amortization'],
      capex:['资本性支出','Capital Expenditures','CAPEX']
    };
    // 初始量价
    const b1q0 = rOrDef(findRow(L.b1q0),1, state.biz[0].q0);
    const b1p0 = rOrDef(findRow(L.b1p0),1, state.biz[0].p0);
    const b2q0 = rOrDef(findRow(L.b2q0),1, state.biz[1].q0);
    const b2p0 = rOrDef(findRow(L.b2p0),1, state.biz[1].p0);
    state.biz[0].q0 = b1q0; state.biz[0].p0 = b1p0;
    state.biz[1].q0 = b2q0; state.biz[1].p0 = b2p0;
    // 增长率与毛利率
    const applySeries = (row, setter, defValOrFn) => {
      YEARS.forEach((y, colIdx)=>{
        const col = 1 + colIdx;
        const defVal = typeof defValOrFn === 'function' ? defValOrFn(y) : defValOrFn;
        const v = rOrDef(row, col, defVal);
        setter(y, v);
      });
    };
    applySeries(findRow(L.b1qg), (y,v)=> state.biz[0].qGrowth[y]=v, (y)=> y===2026?0.00:defaults.revenueGrowth);
    applySeries(findRow(L.b1pg), (y,v)=> state.biz[0].pGrowth[y]=v, 0.00);
    applySeries(findRow(L.b1m),  (y,v)=> state.biz[0].margin[y]=v,  defaults.margin);
    applySeries(findRow(L.b2qg), (y,v)=> state.biz[1].qGrowth[y]=v, (y)=> y===2026?0.00:defaults.revenueGrowth);
    applySeries(findRow(L.b2pg), (y,v)=> state.biz[1].pGrowth[y]=v, 0.00);
    applySeries(findRow(L.b2m),  (y,v)=> state.biz[1].margin[y]=v,  defaults.margin);
    // 公司费用率、折旧、资本支出（税率改为顶部单一输入，不在CSV中）
    applySeries(findRow(L.sales), (y,v)=> state.company.salesRate[y]=v, defaults.rates.sales);
    applySeries(findRow(L.admin), (y,v)=> state.company.adminRate[y]=v, defaults.rates.admin);
    applySeries(findRow(L.rd),    (y,v)=> state.company.rdRate[y]=v,    defaults.rates.rd);
    applySeries(findRow(L.dep),   (y,v)=> state.company.depreciation[y]=v, (y)=> state.company.depreciation[y]||50);
    applySeries(findRow(L.capex), (y,v)=> state.company.capex[y]=v,        (y)=> state.company.capex[y]||80);
    el('#defaultsMsg').classList.toggle('hidden', !usedDefault);
    renderForecastTable();
    recalcAndRenderAll();
  };
  reader.readAsText(file);
}

// 上传处理：可比公司
function handleCompsUpload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const mat = parseCSV(reader.result);
    const header = mat[0];
    const findIdx = (aliases) => {
      for(let i=0;i<header.length;i++){
        if(aliases.includes(header[i])) return i;
      }
      return -1;
    };
    const idx = {
      code: findIdx(['股票代码','Ticker','Code']),
      name: findIdx(['公司名称','Company','Company Name']),
      ev:   findIdx(['EV']),
      ebit: findIdx(['EBIT']),
      ebitda: findIdx(['EBITDA']),
      price: findIdx(['股价','Price']),
      rev:   findIdx(['收入','Revenue','Sales']),
      bv:    findIdx(['净资产','Book Value','Net Assets'])
    };
    state.comps = mat.slice(1).map(r=>({
      code: idx.code>=0? r[idx.code] : '',
      name: idx.name>=0? r[idx.name] : '',
      ev: idx.ev>=0? +r[idx.ev]||0 : 0,
      ebit: idx.ebit>=0? +r[idx.ebit]||0 : 0,
      ebitda: idx.ebitda>=0? +r[idx.ebitda]||0 : 0,
      price: idx.price>=0? +r[idx.price]||0 : 0,
      rev: idx.rev>=0? +r[idx.rev]||0 : 0,
      bv: idx.bv>=0? +r[idx.bv]||0 : 0
    }));
    renderComps();
    recalcAndRenderAll();
  };
  reader.readAsText(file);
}

// 可编辑表：预测
function renderForecastTable() {
  const years = YEARS;
  const rows = [];
  const explainMap = {
    '业务1初始销量':'销量：单位期间内售出的产品数量。用于计算收入（销量×单价）。意味着市场需求与渗透率。',
    '业务1初始单价':'单价：每单位产品的价格。与销量共同决定收入。反映定价能力与产品价值。',
    '业务1销量增长率':'销量增长率：销量相对上一年的增长百分比。体现用户增长、渠道扩张。',
    '业务1单价增长率':'单价增长率：单价相对上一年的增长百分比。体现提价、结构升级。',
    '业务1毛利率':'毛利率：毛利/收入。表示产品盈利能力与成本控制。',
    '业务2初始销量':'与业务1含义相同，针对业务2。',
    '业务2初始单价':'与业务1含义相同，针对业务2。',
    '业务2销量增长率':'与业务1含义相同，针对业务2。',
    '业务2单价增长率':'与业务1含义相同，针对业务2。',
    '业务2毛利率':'与业务1毛利率含义相同，针对业务2。',
    '销售费用率':'销售费用率：销售费用/收入。包含推广、渠道、客服等。',
    '管理费用率':'管理费用率：管理费用/收入。包含职能部门与日常管理支出。',
    '研发费用率':'研发费用率：研发费用/收入。反映研发投入强度。',
    '折旧摊销':'折旧摊销：固定资产与无形资产的费用分摊，非现金支出。',
    '资本性支出':'CAPEX：购建固定资产的现金支出，用于维持或扩张产能。'
  };
  const termLabel = (label) => {
    const exp = explainMap[label];
    return exp ? `<span class="term" data-explain="${exp}">${label}</span>` : label;
  };
  const fmtNum = (v) => {
    if(v===null || v===undefined || v==='') return '';
    const n = Number(v);
    if(!isFinite(n)) return String(v);
    return n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  };
  const r = (label, values, editableFromIdx=0) => {
    const tds = values.map((v,i)=> `<td class="num" ${i>=editableFromIdx? 'contenteditable="true"':''} data-label="${label}" data-year="${years[i]}">${v!==''?fmtNum(v):''}</td>`).join('');
    rows.push(`<tr><th class="label">${termLabel(label)}</th>${tds}</tr>`);
  };
  r('业务1初始销量', [state.biz[0].q0,'','','',''], 0);
  r('业务1初始单价', [state.biz[0].p0,'','','',''], 0);
  r('业务1销量增长率', YEARS.map(y=> state.biz[0].qGrowth[y]), 0);
  r('业务1单价增长率', YEARS.map(y=> state.biz[0].pGrowth[y]), 0);
  r('业务1毛利率', YEARS.map(y=> state.biz[0].margin[y]), 0);
  r('业务2初始销量', [state.biz[1].q0,'','','',''], 0);
  r('业务2初始单价', [state.biz[1].p0,'','','',''], 0);
  r('业务2销量增长率', YEARS.map(y=> state.biz[1].qGrowth[y]), 0);
  r('业务2单价增长率', YEARS.map(y=> state.biz[1].pGrowth[y]), 0);
  r('业务2毛利率', YEARS.map(y=> state.biz[1].margin[y]), 0);
  r('销售费用率', YEARS.map(y=> state.company.salesRate[y]), 0);
  r('管理费用率', YEARS.map(y=> state.company.adminRate[y]), 0);
  r('研发费用率', YEARS.map(y=> state.company.rdRate[y]), 0);
  r('折旧摊销', YEARS.map(y=> state.company.depreciation[y]), 0);
  r('资本性支出', YEARS.map(y=> state.company.capex[y]), 0);
  el('#forecastTable').innerHTML = `<table><thead><tr><th>项目</th>${years.map(y=>`<th>${y}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  el('#forecastTable').querySelectorAll('td[contenteditable="true"]').forEach(td=>{
    td.addEventListener('blur', onEditCell);
  });
}
function onEditCell(e){
  const td = e.target; const label = td.dataset.label; const year = +td.dataset.year;
  const raw = td.textContent.trim();
  const clean = raw.replace(/,/g,'').replace(/%/g,'');
  const val = parseFloat(clean);
  const v = isNaN(val)?0:val;
  if(label==='业务1初始销量' && year===2026) state.biz[0].q0=v;
  else if(label==='业务1初始单价' && year===2026) state.biz[0].p0=v;
  else if(label==='业务2初始销量' && year===2026) state.biz[1].q0=v;
  else if(label==='业务2初始单价' && year===2026) state.biz[1].p0=v;
  else if(label==='业务1销量增长率') state.biz[0].qGrowth[year]=v;
  else if(label==='业务1单价增长率') state.biz[0].pGrowth[year]=v;
  else if(label==='业务1毛利率') state.biz[0].margin[year]=v;
  else if(label==='业务2销量增长率') state.biz[1].qGrowth[year]=v;
  else if(label==='业务2单价增长率') state.biz[1].pGrowth[year]=v;
  else if(label==='业务2毛利率') state.biz[1].margin[year]=v;
  else if(label==='销售费用率') state.company.salesRate[year]=v;
  else if(label==='管理费用率') state.company.adminRate[year]=v;
  else if(label==='研发费用率') state.company.rdRate[year]=v;
  else if(label==='折旧摊销') state.company.depreciation[year]=v;
  else if(label==='资本性支出') state.company.capex[year]=v;
  recalcAndRenderAll();
}

// 计算逻辑
function accumulate(base, growths){
  const out = {}; let cur = base;
  YEARS.forEach((y, idx)=>{
    if(idx===0){ out[y] = cur; }
    else { cur = cur * (1 + (growths[y]||0)); out[y] = cur; }
  });
  return out;
}
function calcModel(){
  const comp = state.company;
  const b1q = accumulate(state.biz[0].q0, state.biz[0].qGrowth);
  const b1p = accumulate(state.biz[0].p0, state.biz[0].pGrowth);
  const b2q = accumulate(state.biz[1].q0, state.biz[1].qGrowth);
  const b2p = accumulate(state.biz[1].p0, state.biz[1].pGrowth);
  const revenue = {}; const gross = {}; const cost = {}; const salesExp = {}; const adminExp = {}; const rdExp = {}; const opex = {}; const ebitda = {}; const ebit = {}; const ni = {}; const dep = {}; const capex = {}; const taxRate = {}; const taxExp = {}; const fcf = {}; const pvFcf = {};
  const gmRate = {}; const salesRateOut = {}; const adminRateOut = {}; const rdRateOut = {};
  let sumPv = 0;
  YEARS.forEach((y,i)=>{
    const r1 = b1q[y] * b1p[y];
    const r2 = b2q[y] * b2p[y];
    const r = r1 + r2; revenue[y]= r;
    gross[y] = r1 * (state.biz[0].margin[y]||defaults.margin) + r2 * (state.biz[1].margin[y]||defaults.margin);
    cost[y] = r - gross[y];
    const sr = (comp.salesRate[y]||0), ar = (comp.adminRate[y]||0), rr = (comp.rdRate[y]||0);
    salesExp[y] = r * sr; adminExp[y] = r * ar; rdExp[y] = r * rr;
    gmRate[y] = r ? (gross[y] / r) : 0;
    salesRateOut[y] = r ? (salesExp[y] / r) : 0;
    adminRateOut[y] = r ? (adminExp[y] / r) : 0;
    rdRateOut[y] = r ? (rdExp[y] / r) : 0;
    opex[y] = salesExp[y] + adminExp[y] + rdExp[y];
    dep[y] = (comp.depreciation[y]||0);
    capex[y] = (comp.capex[y]||0);
    ebit[y] = gross[y] - opex[y];
    ebitda[y] = ebit[y] + dep[y];
    taxRate[y] = (comp.taxRate[y]||defaults.tax);
    taxExp[y] = ebit[y] * taxRate[y];
    ni[y] = ebit[y] - taxExp[y];
    fcf[y] = ni[y] + dep[y] - capex[y];
  });
  const wacc = comp.wacc || defaults.wacc; const g = comp.g || defaults.g;
  YEARS.forEach((y,i)=>{ const t=i+1; const pv = fcf[y] / Math.pow(1+wacc,t); pvFcf[y]=pv; sumPv += pv; });
  const tv = fcf[2030] * (1 + g) / (wacc - g);
  const pvTv = tv / Math.pow(1+wacc, YEARS.length);
  const ev = sumPv + pvTv;
  const equity = ev; // 简化：净债务=0
  const evEbit = ebit[2026]!==0 ? ev/ebit[2026] : null;
  const evRev = revenue[2026]!==0 ? ev/revenue[2026] : null;
  const evEbitda = ebitda[2026]!==0 ? ev/ebitda[2026] : null;
  return {b1q,b1p,b2q,b2p,revenue,gross,cost,salesExp,adminExp,rdExp,opex,ebitda,dep,capex,ebit,taxRate,taxExp,ni,fcf,pvFcf,sumPv,pvTv,ev,equity,evEbit,evRev,evEbitda,wacc,g,gmRate,salesRateOut,adminRateOut,rdRateOut};
}
// 渲染结果
function renderResults(m){
  const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  el('#pvFcf').textContent = nf.format(m.sumPv);
  el('#pvTv').textContent = nf.format(m.pvTv);
  el('#ev').textContent = nf.format(m.ev);
  el('#equity').textContent = nf.format(m.equity);
  el('#evEbit').textContent = m.evEbit!=null ? nf.format(m.evEbit) : '-';
  el('#evRev').textContent = m.evRev!=null ? nf.format(m.evRev) : '-';
  el('#evEbitda').textContent = m.evEbitda!=null ? nf.format(m.evEbitda) : '-';
  const Y = YEARS;
  const explainMap = {
    '收入 (Revenue)':'收入：产品或服务销售的总金额。等于销量×单价之和。',
    '成本 (Cost)':'成本：为取得收入发生的直接成本。收入−毛利。',
    '毛利 (GM)':'毛利：收入−成本。衡量产品盈利能力。',
    '毛利率 (GM%)':'毛利率：毛利/收入，反映盈利能力与成本控制。',
    '销售费用 (Selling)':'销售费用：推广、渠道、客服等费用。',
    '管理费用 (Admin)':'管理费用：职能部门与日常管理费用。',
    '研发费用 (R&D)':'研发费用：研发投入，支持产品升级与创新。',
    'EBIT':'息税前利润：毛利−运营费用（含D&A）。衡量经营盈利。',
    '税务费用 (Tax)':'税务费用：基于EBIT按税率计算的所得税。',
    'NI':'净利润：EBIT−税费。表示归属股东的当期盈利。',
    'CAPEX':'资本性支出：购建固定资产的现金支出。',
    '折旧摊销 (Depreciation)':'折旧摊销：非现金费用，在FCF中加回。',
    '自由现金流 (FCF)':'FCF：NI+折旧摊销−CAPEX。用于估值折现。',
    'PV(FCF)':'FCF的现值：按WACC折现到估值基准日。',
    '销售费用率':'销售费用/收入的比例。',
    '管理费用率':'管理费用/收入的比例。',
    '研发费用率':'研发费用/收入的比例。'
  };
  const termLabel = (label) => {
    const exp = explainMap[label];
    return exp ? `<span class="term" data-explain="${exp}">${label}</span>` : label;
  };
  const fmtNum = (v) => {
    const n = Number(v||0);
    if(!isFinite(n)) return '-';
    return n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  };
  const row = (label, arr, opts={}) => {
    const vals = Y.map(y=> {
      const v = arr[y];
      if(opts.fmt==='pct') return `<td class="num">${((v||0)*100).toFixed(1)}%</td>`;
      return `<td class="num">${fmtNum(v)}</td>`;
    }).join('');
    const trClass = opts.strong ? ' class="strong-row"' : '';
    return `<tr${trClass}><th class="label">${termLabel(label)}</th>${vals}</tr>`;
  };
  const html = [
    row('收入 (Revenue)', m.revenue),
    row('成本 (Cost)', m.cost),
    row('毛利 (GM)', m.gross, {strong:true}),
    row('毛利率 (GM%)', m.gmRate, {fmt:'pct'}),
    row('销售费用 (Selling)', m.salesExp),
    row('销售费用率', m.salesRateOut, {fmt:'pct'}),
    row('管理费用 (Admin)', m.adminExp),
    row('管理费用率', m.adminRateOut, {fmt:'pct'}),
    row('研发费用 (R&D)', m.rdExp),
    row('研发费用率', m.rdRateOut, {fmt:'pct'}),
    row('EBIT', m.ebit, {strong:true}),
    row('税务费用 (Tax)', m.taxExp),
    row('NI', m.ni, {strong:true}),
    row('CAPEX', m.capex),
    row('折旧摊销 (Depreciation)', m.dep),
    row('自由现金流 (FCF)', m.fcf, {strong:true}),
    row('PV(FCF)', m.pvFcf, {strong:true})
  ].join('');
  el('#detailTable').innerHTML = `<table><thead><tr><th>科目</th>${Y.map(y=>`<th>${y}</th>`).join('')}</tr></thead><tbody>${html}</tbody></table>`;
}

// 可比公司表与分位数
function renderComps(){
  const key = el('#sortKey').value; const filter = el('#filterName').value.toLowerCase();
  const rows = state.comps.map(c=> Object.assign({}, c, {
    ev_ebit: c.ebit? c.ev/c.ebit : null,
    ev_ebitda: c.ebitda? c.ev/c.ebitda : null,
    ev_rev: c.rev? c.ev/c.rev : null
  })).filter(c=> !filter || (c.name||'').toLowerCase().includes(filter)).sort((a,b)=>{
    const av = (a[key] !== null && a[key] !== undefined) ? a[key] : 0;
    const bv = (b[key] !== null && b[key] !== undefined) ? b[key] : 0;
    return bv - av;
  });
  const html = rows.map(c=> `<tr><td>${c.code}</td><td>${c.name}</td><td>${c.ev}</td><td>${c.ebit}</td><td>${c.ebitda}</td><td>${c.price}</td><td>${c.rev}</td><td>${c.bv}</td><td>${c.ev_ebit?c.ev_ebit.toFixed(2):'-'}</td><td>${c.ev_ebitda?c.ev_ebitda.toFixed(2):'-'}</td><td>${c.ev_rev?c.ev_rev.toFixed(2):'-'}</td></tr>`).join('');
  el('#compsTable').innerHTML = `<table><thead><tr><th>代码</th><th>公司</th><th>EV</th><th>EBIT</th><th>EBITDA</th><th>股价</th><th>收入</th><th>净资产</th><th>EV/EBIT</th><th>EV/EBITDA</th><th>EV/Revenue</th></tr></thead><tbody>${html}</tbody></table>`;
  const mArr = rows.map(r=> r.ev_ebit).filter(v=> typeof v==='number');
  const quant = p=>{ if(mArr.length===0) return null; const a=[...mArr].sort((x,y)=>x-y); const idx=Math.floor((a.length-1)*p); return a[idx]; };
  const q25=quant(0.25), q50=quant(0.50), q75=quant(0.75);
  el('#q25').textContent = q25? q25.toFixed(2) : '-';
  el('#q50').textContent = q50? q50.toFixed(2) : '-';
  el('#q75').textContent = q75? q75.toFixed(2) : '-';
}

// 图表
let bizChart, perfChart, barChart;
function renderCharts(m){
  const labels = YEARS.map(String);
  if(typeof Chart === 'undefined'){
    console.warn('Chart.js 未加载，跳过图表渲染');
    return;
  }
  // 业务趋势：两个y轴（销量、价格）
  const bq1 = YEARS.map(y=> m.b1q[y]); const bp1 = YEARS.map(y=> m.b1p[y]);
  const bq2 = YEARS.map(y=> m.b2q[y]); const bp2 = YEARS.map(y=> m.b2p[y]);
  if(bizChart) bizChart.destroy();
  bizChart = new Chart(el('#bizChart'), {
    type: 'line', data: { labels,
      datasets: [
        {label:'业务1销量', data:bq1, yAxisID:'y', borderColor:'#4e79a7'},
        {label:'业务2销量', data:bq2, yAxisID:'y', borderColor:'#59a14f'},
        {label:'业务1单价', data:bp1, yAxisID:'y1', borderColor:'#f28e2b'},
        {label:'业务2单价', data:bp2, yAxisID:'y1', borderColor:'#e15759'}
      ]
    }, options:{responsive:true, interaction:{mode:'nearest',intersect:false}, scales:{y:{position:'left'}, y1:{position:'right'}}}
  });
  // 业绩变化
  if(perfChart) perfChart.destroy();
  perfChart = new Chart(el('#perfChart'), {
    type: 'line', data: { labels,
      datasets:[
        {label:'收入', data: YEARS.map(y=> m.revenue[y]), borderColor:'#4e79a7'},
        {label:'EBIT', data: YEARS.map(y=> m.ebit[y]), borderColor:'#e15759'},
        {label:'FCF', data: YEARS.map(y=> m.fcf[y]), borderColor:'#59a14f'}
      ]
    }, options:{responsive:true, interaction:{mode:'nearest',intersect:false}}
  });
  // 柱状图：EV/EBIT
  const comps = state.comps.map(c=> ({name:c.name, val: c.ebit? c.ev/c.ebit : null})).filter(x=> x.val!==null);
  const names = ['目标公司'].concat(comps.map(c=> c.name));
  const vals = [].concat([m.evEbit || null], comps.map(c=> c.val));
  if(barChart) barChart.destroy();
  var bgColors = names.map(function(n,i){ return i===0 ? '#f28e2b' : '#4e79a7'; });
  barChart = new Chart(el('#barChart'), {
    type: 'bar',
    data: { labels: names, datasets: [{ label: 'EV/EBIT', data: vals, backgroundColor: bgColors }] },
    options: { responsive: true, plugins: { tooltip: { enabled: true } } }
  });
  // 热力图：EV/EBIT 分布
  renderHeatmap(comps.map(c=> c.val));
}
function renderHeatmap(values){
  const bins = [[0,5],[5,10],[10,15],[15,20],[20,Infinity]];
  const colors = ['#d5e8f6','#9fc5e8','#6fa8dc','#3d85c6','#1c4587'];
  const counts = bins.map(([a,b])=> values.filter(v=> v>=a && v<b).length);
  el('#heatmap').innerHTML = counts.map((cnt,i)=>{
    const title = `${bins[i][0]}-${bins[i][1]===Infinity?'∞':bins[i][1]}: ${cnt}`;
    return `<div class="heatCell" data-title="${title}" style="background:${colors[i]};opacity:${0.35+Math.min(cnt/Math.max(1,values.length),0.65)}">${title}</div>`;
  }).join('');
}

// 统一更新
function recalcAndRenderAll(){
  const m = calcModel();
  renderResults(m);
  renderComps();
  renderCharts(m);
}

// 事件绑定
function bindEvents(){
  el('#downloadForecast').addEventListener('click', ()=> downloadCSV('预测数据模板.csv', templateForecastCSV()));
  el('#downloadComps').addEventListener('click', ()=> downloadCSV('可比公司模板.csv', templateCompsCSV()));
  el('#uploadForecast').addEventListener('change', e=>{ const f=e.target.files[0]; if(f) handleForecastUpload(f); });
  el('#uploadComps').addEventListener('change', e=>{ const f=e.target.files[0]; if(f) handleCompsUpload(f); });
  el('#sortKey').addEventListener('change', ()=> renderComps());
  el('#filterName').addEventListener('input', ()=> renderComps());
  // 顶部参数输入：WACC/g/税率（百分比输入，内部按小数保存）
  const iw = el('#inputWacc'); const ig = el('#inputG'); const it = el('#inputTax');
  if(iw){ iw.addEventListener('input', ()=> { const v=parseFloat(iw.value); state.company.wacc = isNaN(v)? defaults.wacc:(v/100); recalcAndRenderAll(); }); }
  if(ig){ ig.addEventListener('input', ()=> { const v=parseFloat(ig.value); state.company.g = isNaN(v)? defaults.g:(v/100); recalcAndRenderAll(); }); }
  if(it){ it.addEventListener('input', ()=> { const v=parseFloat(it.value); state.company.tax = isNaN(v)? defaults.tax:(v/100); recalcAndRenderAll(); }); }
}

// 初始化
function init(){
  renderForecastTable();
  renderComps();
  recalcAndRenderAll();
  bindEvents();
  // 初始化顶部参数输入值（以百分比显示）
  const iw = el('#inputWacc'); const ig = el('#inputG'); const it = el('#inputTax');
  if(iw) iw.value = ((state.company.wacc||defaults.wacc)*100).toFixed(1);
  if(ig) ig.value = ((state.company.g||defaults.g)*100).toFixed(1);
  if(it) it.value = (((state.company.tax!=null? state.company.tax : defaults.tax)*100).toFixed(1));
}

document.addEventListener('DOMContentLoaded', init);