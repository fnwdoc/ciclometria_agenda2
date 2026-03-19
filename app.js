// =========================================================================
// CICLOCOCKPIT V3 - UNIFIED CORE (MONITOR + AGENDA)
// =========================================================================

// =========================================================================
// CONSTANTS & CONFIGURATION
// =========================================================================

const typePillars = {
    'Assessoria': [
        { nome: 'ESTRATÉGIA', icone: '🎯' },
        { nome: 'OPERAÇÃO', icone: '⚙️' },
        { nome: 'SUPORTE', icone: '💬' },
        { nome: 'MÉTRICAS', icone: '📊' }
    ],
    'Comunidade': [
        { nome: 'ACOLHIMENTO', icone: '🏠' },
        { nome: 'CONEXÃO', icone: '🤝' },
        { nome: 'CONHECIMENTO', icone: '🔍' },
        { nome: 'CAPACITAÇÃO', icone: '🧠' }
    ],
    'Pipeline': [
        { nome: 'ATENÇÃO', icone: '📢' },
        { nome: 'INTERESSE', icone: '💡' },
        { nome: 'DESEJO', icone: '❤️' },
        { nome: 'AÇÃO', icone: '🚀' }
    ],
    'Mentoria': [
        { nome: 'ALINHAMENTO', icone: '🛤️' },
        { nome: 'COOPERAÇÃO', icone: '🤝' },
        { nome: 'VALOR', icone: '💎' },
        { nome: 'EXPANSÃO', icone: '📈' }
    ],
    'Consultoria': [
        { nome: 'LEVANTAMENTO', icone: '🔎' },
        { nome: 'ANÁLISE', icone: '🧪' },
        { nome: 'RECOMENDAÇÃO', icone: '💡' },
        { nome: 'RELATÓRIO', icone: '📄' }
    ],
    'Parceria': [
        { nome: 'ALINHAMENTO', icone: '🤝' },
        { nome: 'COOPERAÇÃO', icone: '🔄' },
        { nome: 'VALOR', icone: '💎' },
        { nome: 'EXPANSÃO', icone: '🌍' }
    ],
    'Projeto': [
        { nome: 'ESCOPO', icone: '📋' },
        { nome: 'EXECUÇÃO', icone: '⚡' },
        { nome: 'REVISÃO', icone: '🔄' },
        { nome: 'ENTREGA', icone: '📦' }
    ],
    'Default': [
        { nome: 'PLANEAMENTO', icone: '📅' },
        { nome: 'EXECUÇÃO', icone: '⚡' },
        { nome: 'REVISÃO', icone: '🔄' },
        { nome: 'ENTREGA', icone: '📦' }
    ]
};

const tutorialPages = [
    { icon: "✨", title: "GERiAH Suite", text: "Sua central de operações integrada. CRM, Agenda e Foco em um só lugar — feito para quem cuida de pessoas com propósito." },
    { icon: "👥", title: "CRM", text: "Gerencie seus leads e relacionamentos. O score é calculado automaticamente e seus leads fluem direto para a Agenda e o Foco." },
    { icon: "📅", title: "Agenda Ciclométrica", text: "Controle seus atendimentos em ciclos de 14 dias. Importe e exporte em Excel, arraste compromissos e busque clientes do CRM." },
    { icon: "🎯", title: "Foco", text: "Organize seus contextos em 4 fases: Prospecção, Ativação, Implementação e Gestão — com pilares adaptados ao tipo de cada projeto." },
    { icon: "🌐", title: "Acesso de Apoio", text: "Abra links externos diretamente no painel lateral sem sair do GERiAH Suite." }
];

const statusIcons = { 'Ativa': '🟢', 'Stand by': '🟡', 'Suspensa': '⚪', 'Cancelada': '🔴' };
const tabLabels = { 'prospec': 'Prospecção', 'ativacao': 'Ativação', 'implem': 'Implementação', 'gestao': 'Gestão', 'todos': 'Ecossistema' };

// =========================================================================
// GLOBAL STATE
// =========================================================================

let appState = {
    // Agenda data
    currentCycle: {
        startDate: moment().startOf('isoWeek').day(1), // Start on Monday
        endDate: moment().startOf('isoWeek').day(1).add(13, 'days')
    },
    timeSlots: ['09:00', '10:30', '14:00', '15:30'],
    workingDays: [2, 3, 4], // Ter, Qua, Qui
    clients: [],
    clientTypes: {
        partner: { label: 'Parceiro', color: '#4361ee', limit: 7 },
        multiplier: { label: 'Multiplicador', color: '#4cc9f0', limit: 7 },
        reserve: { label: 'Reserva', color: '#7209b7', limit: 7 }
    },
    // Monitor data
    listas: { prospec: [], ativacao: [], implem: [], gestao: [] },
    tarefasGlobal: [],
    activeUserName: "",
    currentFocusTab: 'todos',
    currentView: 'agenda',
    // CRM data
    leads: [],
    crmActivities: [],
    // Ações data
    bpData: {},
    esteiraData: {},
    aiConfig: { provider: 'groq', key: '', model: 'llama-3.3-70b-versatile' }
};

// Modals & UI Tracking
let clientModal, settingsModal, itemModal, taskModal, pillarDetailModal, tutorialModal, userModal, leadModal, crmPickerModal;
let currentTutorialPage = 0;
let editingTaskId = null;
let tempLinks = [];
let newItemTarget = 'prospec';
let draggedClientId = null;

// =========================================================================
// CORE FUNCTIONS (PERSISTENCE & SYSTEM)
// =========================================================================

function loadState() {
    // Migrar chave antiga cicloCockpitState → geriahSuiteState se necessário
    const oldKey = localStorage.getItem('cicloCockpitState');
    if (oldKey && !localStorage.getItem('geriahSuiteState')) {
        localStorage.setItem('geriahSuiteState', oldKey);
        localStorage.removeItem('cicloCockpitState');
        console.log('GERiAH Suite: dados migrados da chave anterior.');
    }

    let saved = localStorage.getItem('geriahSuiteState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.currentCycle) {
                parsed.currentCycle.startDate = moment(parsed.currentCycle.startDate);
                parsed.currentCycle.endDate = moment(parsed.currentCycle.endDate);
            }
            appState = { ...appState, ...parsed };
        } catch (e) { console.error('Error loading state:', e); }
    }
    // Limpar dados do LeadFlow separado se existirem (não migrar)
    localStorage.removeItem('leads');
    localStorage.removeItem('activities');
    
    if (appState.activeUserName) updateUserDisplay(appState.activeUserName);
    // Sempre exibe a tela de apresentação ao abrir — o nome salvo preenche o campo
    const nameInput = document.getElementById('userNameInput');
    if (nameInput && appState.activeUserName) nameInput.value = appState.activeUserName;
    userModal.show();

    window.switchView(appState.currentView || 'agenda');
    window.switchTab(appState.currentFocusTab || 'todos');
    
    updateMetrics();
    updateStats();
}

function saveState() {
    // Garantir que campos das Ações estão no appState antes de salvar
    if (!appState.bpData) appState.bpData = {};
    if (!appState.esteiraData) appState.esteiraData = {};
    if (!appState.aiConfig) appState.aiConfig = { provider: 'groq', key: '', model: 'llama-3.3-70b-versatile' };
    localStorage.setItem('geriahSuiteState', JSON.stringify(appState));
    updateStats();
    updateMetrics();
}

function updateUserDisplay(name) {
    const el = document.getElementById('displayUserName');
    if (el) el.innerText = `Olá, ${name}!`;
}

window.showToast = function(message, type = 'success') {
    const toastEl = document.getElementById('app-toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    if (!toastEl || !msgEl) return;
    msgEl.innerText = message;
    iconEl.innerHTML = type === 'success' ? '<i class="bi bi-check-circle-fill"></i>' : '<i class="bi bi-exclamation-triangle-fill"></i>';
    iconEl.className = type === 'success' ? 'text-emerald-500 text-3xl' : 'text-amber-500 text-3xl';
    new bootstrap.Toast(toastEl, { delay: 3000 }).show();
};

// =========================================================================
// VIEW SWITCHER & TAB LOGIC
// =========================================================================

window.switchView = function(view) {
    appState.currentView = view;
    document.querySelectorAll('.app-view').forEach(v => {
        const isActive = v.id === `view-${view}`;
        v.classList.toggle('active', isActive);
        v.style.setProperty('display', isActive ? 'block' : 'none', 'important');
    });
    document.querySelectorAll('.nav-pill-custom').forEach(b => {
        const isActive = b.id === `btn-view-${view}`;
        b.classList.toggle('active', isActive);
        b.classList.toggle('text-white', isActive);
    });
    
    if (view === 'agenda') renderCalendar();
    else if (view === 'monitor') { renderFoco(); renderSaude(); }
    else if (view === 'crm') { renderCRM(); }
    else if (view === 'acoes') { updateAcoesContexto(); }
    saveState();
};

window.switchTab = function(tab) {
    appState.currentFocusTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
        const targetId = `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
        b.classList.toggle('active', b.id === targetId);
    });
    // Limpar seleção ao trocar de aba — força o estado "Selecione um Contexto"
    const sel = document.getElementById('selectComunidade');
    if (sel) sel.value = 'null';
    // Piscar os botões de pilar para chamar atenção
    document.querySelectorAll('.category-btn').forEach(b => {
        b.classList.add('animate-pulse');
        setTimeout(() => b.classList.remove('animate-pulse'), 2000);
    });

    const items = tab === 'todos' ? Object.values(appState.listas).flat() : appState.listas[tab];
    const s = document.getElementById('selectComunidade');
    if (s) {
        const currentVal = s.value;
        s.innerHTML = '<option value="null">Contexto de Trabalho...</option>';
        items.filter(i => i && !i.arquivada).forEach(i => {
            const opt = new Option(`${statusIcons[i.status]} [${i.tipo}] ${i.nome}`, i.nome);
            s.appendChild(opt);
        });
        if (items.some(x => x.nome === currentVal)) s.value = currentVal;
    }
    updateCategoryButtons();
    renderFoco();
    renderSaude();
    saveState();
};

window.onProjectSelectionChange = function() {
    const val = document.getElementById('selectComunidade').value;
    if (appState.currentFocusTab === 'todos' && val !== "null") {
        for (let k in appState.listas) {
            if (appState.listas[k].some(p => p.nome === val)) {
                window.switchTab(k);
                document.getElementById('selectComunidade').value = val;
                break;
            }
        }
    }
    updateCategoryButtons();
    renderFoco();
};

// =========================================================================
// MONITOR DE FOCO - LOGIC
// =========================================================================

function updateCategoryButtons() {
    const sEl = document.getElementById('selectComunidade');
    if (!sEl) return;
    const context = sEl.value;
    const p = Object.values(appState.listas).flat().find(x => x && x.nome === context);
    const pils = typePillars[p?.tipo] || (appState.currentFocusTab === 'prospec' ? typePillars.Pipeline : typePillars.Default);
    pils.forEach((p, i) => {
        const l = document.getElementById(`label-${i}`);
        const ic = document.getElementById(`icon-${i}`);
        const seq = document.getElementById(`seq-${i}`);
        if (l) l.innerText = p.nome;
        if (ic) ic.innerText = p.icone;
        if (seq) seq.innerText = `${i + 1}`;
    });
    window.setCategoryByIndex(0);
}

window.setCategoryByIndex = (idx) => {
    const context = document.getElementById('selectComunidade').value;
    const p = Object.values(appState.listas).flat().find(x => x && x.nome === context);
    const pils = typePillars[p?.tipo] || (appState.currentFocusTab === 'prospec' ? typePillars.Pipeline : typePillars.Default);
    window.categoriaSelecionada = pils[idx];
    document.querySelectorAll('.category-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
};

window.removerTarefa = (id) => {
    appState.tarefasGlobal = appState.tarefasGlobal.filter(t => t.id !== id);
    renderFoco();
    saveState();
    window.showToast('Tarefa concluída! ✓');
};

window.adicionarTarefa = () => {
    const input = document.getElementById('inputTarefa');
    const context = document.getElementById('selectComunidade').value;
    if (!input.value.trim() || context === "null") {
        document.getElementById('taskInputWrapper').classList.add('animate-shake');
        setTimeout(() => document.getElementById('taskInputWrapper').classList.remove('animate-shake'), 500);
        return;
    }
    const links = input.value.match(/(https?:\/\/[^\s]+)/g) || [];
    appState.tarefasGlobal.push({
        id: Date.now(),
        titulo: input.value,
        contexto: context,
        categoria: window.categoriaSelecionada.nome,
        icone: window.categoriaSelecionada.icone,
        links: links
    });
    input.value = ''; renderFoco(); saveState();
    window.showToast('Ação adicionada ao foco!');
};

function renderFoco() {
    const container = document.getElementById('focoHoje');
    const sEl = document.getElementById('selectComunidade');
    if (!container || !sEl) return;
    const context = sEl.value;
    if (context === "null") {
        container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-12 gap-4">
            <div class="relative">
                <div class="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-3xl animate-pulse">🎯</div>
                <div class="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center animate-bounce">
                    <span class="text-white text-[10px] font-black">↑</span>
                </div>
            </div>
            <div class="text-center">
                <p class="text-sm font-black text-slate-600">Selecione um Contexto</p>
                <p class="text-[11px] text-slate-400 font-medium mt-1">Use o dropdown acima para escolher<br>em qual projeto deseja focar agora</p>
            </div>
            <div class="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3 animate-pulse">
                <i class="bi bi-arrow-up text-indigo-500 text-sm"></i>
                <span class="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Escolha o contexto de trabalho</span>
            </div>
        </div>`;
        return;
    }
    const p = Object.values(appState.listas).flat().find(x => x && x.nome === context);
    const pils = typePillars[p?.tipo] || (appState.currentFocusTab === 'prospec' ? typePillars.Pipeline : typePillars.Default);
    container.innerHTML = '';
    pils.forEach(pil => {
        const tasks = appState.tarefasGlobal.filter(t => t.contexto === context && t.categoria === pil.nome);
        const card = document.createElement('div');
        card.className = `glass-panel rounded-[2rem] p-5 flex flex-col gap-4 border-t-4 ${getFunnelColor(pil.nome)} transition-all ${tasks.length === 0 ? 'opacity-40 grayscale-[0.5]' : 'hover:shadow-lg'}`;
        if (tasks.length > 0) card.onclick = () => window.openPillarDetail(pil.nome);
        card.innerHTML = `
            <div class="flex justify-between items-center px-1">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">${pil.icone} ${pil.nome}</span>
                <span class="text-[9px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-black">${tasks.length}/3</span>
            </div>
            <div class="flex flex-col gap-2">
                ${tasks.map(t => `
                    <div class="p-3 bg-white/50 rounded-2xl border border-white flex justify-between items-center group/task">
                        <span class="text-[11px] font-bold text-slate-700 truncate">${t.titulo}</span>
                        <div class="flex items-center gap-2">
                            ${t.links && t.links.length > 0 ? `<button onclick="event.stopPropagation(); window.openWebPreview('${t.links[0]}')" class="text-[8px] bg-indigo-50 text-indigo-500 px-2 py-1 rounded-lg font-black uppercase hover:bg-indigo-500 hover:text-white transition-all">VER</button>` : ''}
                        </div>
                    </div>
                `).join('') || '<div class="py-4 text-center text-[10px] text-slate-300 italic font-bold">Livre</div>'}
            </div>
        `;
        container.appendChild(card);
    });
    document.getElementById('contadorFocoGlobal').innerText = `${appState.tarefasGlobal.filter(t => t.contexto === context).length} Tarefas Solicitadas`;
}

function getFunnelColor(c) {
    if (['ATENÇÃO', 'ESTRATÉGIA', 'ALINHAMENTO'].includes(c)) return 'border-sky-400';
    if (['INTERESSE', 'OPERAÇÃO', 'COOPERAÇÃO'].includes(c)) return 'border-amber-400';
    if (['DESEJO', 'SUPORTE', 'VALOR'].includes(c)) return 'border-rose-400';
    return 'border-emerald-400';
}

function renderSaude() {
    const c = document.getElementById('communityList'); if (!c) return;
    c.innerHTML = '';
    const select = document.createElement('select');
    select.className = "w-full max-w-lg bg-white/50 border border-white rounded-2xl px-6 py-4 outline-none text-slate-800 font-bold text-sm shadow-sm hover:bg-white transition-all";
    select.onchange = (e) => { if (e.target.value !== "null") { document.getElementById('selectComunidade').value = e.target.value; window.onProjectSelectionChange(); } };

    if (appState.currentFocusTab === 'todos') {
        select.innerHTML = '<option value="null">🏢 Visão Macroscópica...</option>';
        ['prospec', 'ativacao', 'implem', 'gestao'].forEach(k => {
            const items = appState.listas[k].filter(i => i && !i.arquivada);
            if (items.length > 0) {
                const grp = document.createElement('optgroup'); grp.label = tabLabels[k];
                items.forEach(i => grp.appendChild(new Option(`${statusIcons[i.status]} [${i.tipo}] ${i.nome}`, i.nome)));
                select.appendChild(grp);
            }
        });
    } else {
        select.innerHTML = `<option value="null">Filtro em ${tabLabels[appState.currentFocusTab]}...</option>`;
        appState.listas[appState.currentFocusTab].filter(i => i && !i.arquivada).forEach(i => select.appendChild(new Option(`${statusIcons[i.status]} [${i.tipo}] ${i.nome}`, i.nome)));
    }
    c.appendChild(select);
}

function updateStats() {
    const flat = Object.values(appState.listas).flat().filter(i => !i.arquivada);
    const totalAtivas = flat.filter(i => i.status === 'Ativa').length;
    if (document.getElementById('countAtivas')) document.getElementById('countAtivas').innerText = totalAtivas;
    if (document.getElementById('countStandBy')) document.getElementById('countStandBy').innerText = flat.filter(i => i.status === 'Stand by').length;
    if (document.getElementById('countVagos')) document.getElementById('countVagos').innerText = Math.max(0, 7 - totalAtivas);
    ['prospec', 'ativacao', 'implem', 'gestao'].forEach(k => {
        const el = document.getElementById(`count-tab-${k}`);
        if (el) el.innerText = appState.listas[k].filter(i => !i.arquivada).length;
    });
    if (document.getElementById('count-tab-todos')) document.getElementById('count-tab-todos').innerText = flat.length;
}

// =========================================================================
// ITEM & TASK MODALS (MONITOR SETTINGS)
// =========================================================================

window.setNewItemTarget = (t) => {
    newItemTarget = t;
    document.querySelectorAll('.target-btn').forEach(b => {
        const isActive = b.id === `target${t.charAt(0).toUpperCase() + t.slice(1)}`;
        b.classList.toggle('bg-indigo-600', isActive); b.classList.toggle('text-white', isActive); b.classList.toggle('shadow-lg', isActive);
    });
};

window.openItemModal = (mode) => {
    document.getElementById('editActions').classList.toggle('hidden', mode === 'new');
    document.getElementById('deleteWarning').classList.add('hidden');
    if (mode === 'new') {
        document.getElementById('modalTitle').innerText = 'Novo Contexto';
        document.getElementById('modalInput').value = '';
        window.setNewItemTarget(appState.currentFocusTab === 'todos' ? 'prospec' : appState.currentFocusTab);
        document.getElementById('saveItemBtn').onclick = () => {
            const name = document.getElementById('modalInput').value.trim();
            if (!name) return;
            appState.listas[newItemTarget].push({ nome: name, tipo: document.getElementById('modalTypeSelect').value, status: document.getElementById('modalStatusSelect').value, arquivada: false });
            window.switchTab(newItemTarget); itemModal.hide(); saveState();
        };
    } else {
        const name = document.getElementById('selectComunidade').value;
        if (name === "null") return window.showToast("Selecione um projeto para editar", "warning");
        const item = Object.values(appState.listas).flat().find(x => x && x.nome === name);
        let currentPhase = ""; for (let k in appState.listas) if (appState.listas[k].some(x => x.nome === name)) currentPhase = k;
        document.getElementById('modalTitle').innerText = 'Configurações';
        document.getElementById('modalInput').value = item.nome;
        document.getElementById('modalStatusSelect').value = item.status;
        document.getElementById('modalTypeSelect').value = item.tipo;
        window.setNewItemTarget(currentPhase);
        document.getElementById('saveItemBtn').onclick = () => {
            const newName = document.getElementById('modalInput').value.trim(); if (!newName) return;
            appState.listas[currentPhase] = appState.listas[currentPhase].filter(x => x && x.nome !== name);
            appState.listas[newItemTarget].push({ nome: newName, tipo: document.getElementById('modalTypeSelect').value, status: document.getElementById('modalStatusSelect').value, arquivada: false });
            appState.tarefasGlobal.forEach(t => { if (t.contexto === name) t.contexto = newName; });
            window.switchTab(newItemTarget); itemModal.hide(); saveState();
        };
    }
    itemModal.show();
};

window.handleDeleteClick = () => { document.getElementById('editActions').classList.add('hidden'); document.getElementById('deleteWarning').classList.remove('hidden'); };
// ID for delete warning button confirmed via prev code
window.confirmDelete = () => {
    const name = document.getElementById('selectComunidade').value;
    for (let k in appState.listas) appState.listas[k] = appState.listas[k].filter(x => x && x.nome !== name);
    appState.tarefasGlobal = appState.tarefasGlobal.filter(t => t.contexto !== name);
    window.switchTab(appState.currentFocusTab); itemModal.hide(); saveState(); window.showToast("Removido com sucesso.");
};

window.openPillarDetail = (pName) => {
    const context = document.getElementById('selectComunidade').value;
    const tasks = appState.tarefasGlobal.filter(t => t.contexto === context && t.categoria === pName);
    document.getElementById('pillarDetailTitle').innerText = pName;
    document.getElementById('pillarDetailProject').innerText = context;
    document.getElementById('pillarDetailIcon').innerText = tasks[0]?.icone || '📍';
    const listEl = document.getElementById('pillarDetailTasks');
    listEl.innerHTML = tasks.map(t => `
        <div class="bg-white/50 p-6 rounded-[2rem] border border-white flex flex-col gap-4 shadow-sm">
            <div class="justify-between flex items-start">
                <span class="text-sm font-bold text-slate-800">${t.titulo}</span>
                <div class="flex gap-2">
                    <button onclick="window.editTaskFromPillar(${t.id})" class="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Editar</button>
                    <button onclick="window.removerTarefa(${t.id}); pillarDetailModal.hide();" class="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Concluir</button>
                </div>
            </div>
            ${t.links && t.links.length > 0 ? `<div class="flex flex-wrap gap-2 pt-3 border-t border-slate-100">${t.links.map(l => `<button onclick="window.openWebPreview('${l}')" class="bg-white px-3 py-2 rounded-xl border text-[9px] text-indigo-500 font-bold flex items-center gap-2">🌐 Abrir</button>`).join('')}</div>` : ''}
        </div>
    `).join('') || '<div class="col-span-full py-10 text-center text-slate-300 italic">Esvaziado.</div>';
    pillarDetailModal.show();
};

window.editTaskFromPillar = (id) => {
    const t = appState.tarefasGlobal.find(x => x.id === id); if (!t) return;
    editingTaskId = id; document.getElementById('taskModalInput').value = t.titulo; tempLinks = [...(t.links || [])];
    const sel = document.getElementById('taskPillarSelect');
    const context = document.getElementById('selectComunidade').value;
    const p = Object.values(appState.listas).flat().find(x => x && x.nome === context);
    const pils = typePillars[p?.tipo] || (appState.currentFocusTab === 'prospec' ? typePillars.Pipeline : typePillars.Default);
    sel.innerHTML = pils.map(p => `<option value="${p.nome}">${p.icone} ${p.nome}</option>`).join('');
    sel.value = t.categoria; window.renderTaskModalLinks(); pillarDetailModal.hide(); taskModal.show();
};

window.renderTaskModalLinks = () => {
    const list = document.getElementById('taskModalLinksList');
    list.innerHTML = tempLinks.map((l, i) => `<div class="bg-white px-4 py-2 rounded-xl flex justify-between items-center text-[10px] border border-slate-100 font-bold mb-1"><span class="truncate text-indigo-500 flex-grow mr-4">${l}</span><button onclick="tempLinks.splice(${i},1); window.renderTaskModalLinks()" class="text-rose-500 font-black">✕</button></div>`).join('');
};

window.addLinkToCurrentTask = () => {
    const inp = document.getElementById('taskLinkInput'); let val = inp.value.trim();
    if (val) { if (!val.startsWith('http')) val = 'https://' + val; tempLinks.push(val); inp.value = ''; window.renderTaskModalLinks(); }
};

window.confirmEditTask = () => {
    const t = appState.tarefasGlobal.find(x => x.id === editingTaskId);
    if (t) {
        const newCat = document.getElementById('taskPillarSelect').value;
        const context = document.getElementById('selectComunidade').value;
        const p = Object.values(appState.listas).flat().find(x => x && x.nome === context);
        const pils = typePillars[p?.tipo] || (appState.currentFocusTab === 'prospec' ? typePillars.Pipeline : typePillars.Default);
        const pilObj = pils.find(x => x.nome === newCat);
        t.titulo = document.getElementById('taskModalInput').value.trim(); t.links = [...tempLinks]; t.categoria = newCat; t.icone = pilObj?.icone || '📍';
        renderFoco(); taskModal.hide(); saveState(); window.showToast("Ação atualizada!");
    }
};

// =========================================================================
// TUTORIAL (Bug 1 Fix — função estava ausente no app.js)
// =========================================================================

window.openTutorial = function() {
    currentTutorialPage = 0;
    renderTutorialContent();
    tutorialModal.show();
};

window.nextTutorialPage = function() {
    if (currentTutorialPage < tutorialPages.length - 1) {
        currentTutorialPage++;
        renderTutorialContent();
    } else {
        tutorialModal.hide();
    }
};

window.prevTutorialPage = function() {
    if (currentTutorialPage > 0) {
        currentTutorialPage--;
        renderTutorialContent();
    }
};

function renderTutorialContent() {
    const page = tutorialPages[currentTutorialPage];
    const content = document.getElementById('tutorialContent');
    const dots = document.getElementById('tutorialDots');
    const nextBtn = document.getElementById('nextTutorialBtn');
    const prevBtn = document.getElementById('prevTutorialBtn');
    if (!content || !dots || !nextBtn || !prevBtn) return;
    content.innerHTML = `
        <div class="text-center space-y-4">
            <span class="text-6xl block mb-6">${page.icon}</span>
            <h3 class="text-2xl font-black text-slate-900">${page.title}</h3>
            <p class="text-slate-500 leading-relaxed">${page.text}</p>
        </div>`;
    dots.innerHTML = tutorialPages.map((_, i) =>
        `<div class="h-1.5 rounded-full transition-all duration-300 ${i === currentTutorialPage ? 'dot-active bg-indigo-600 w-8' : 'w-2 bg-slate-200'}"></div>`
    ).join('');
    prevBtn.style.opacity = currentTutorialPage === 0 ? '0' : '1';
    prevBtn.style.pointerEvents = currentTutorialPage === 0 ? 'none' : 'auto';
    nextBtn.innerText = currentTutorialPage === tutorialPages.length - 1 ? 'Entendido ✓' : 'Próximo';
}

// =========================================================================
// WEB DRAWER (AUX WINDOW)
// =========================================================================

window.openWebPreview = (url) => {
    const win = document.getElementById('auxiliaryWindow');
    const ifr = document.getElementById('auxWebIframe');
    const alertArea = document.getElementById('iframeAlert');
    const fallback = document.getElementById('iframeFallbackBtn');
    if (!win || !ifr || !alertArea) return;
    ifr.src = url;
    document.getElementById('externalLinkBtn').href = url;
    document.getElementById('auxWindowTitle').innerText = url;
    fallback.setAttribute('data-url', url);
    if (url.includes('google.com') || url.includes('notion.so') || url.includes('github') || url.includes('facebook')) {
        alertArea.classList.remove('hidden'); ifr.classList.add('hidden');
    } else { alertArea.classList.add('hidden'); ifr.classList.remove('hidden'); }
    win.classList.remove('translate-x-full');
    document.getElementById('mainWrapper').style.paddingRight = "45%";
};

window.closeWebPreview = () => {
    document.getElementById('auxiliaryWindow').classList.add('translate-x-full');
    setTimeout(() => document.getElementById('auxWebIframe').src = 'about:blank', 500);
    document.getElementById('mainWrapper').style.paddingRight = "0";
};

window.expandWebPreview = () => {
    const win = document.getElementById('auxiliaryWindow');
    const isFull = win.style.width === "100%";
    win.style.width = isFull ? "45%" : "100%";
    document.getElementById('mainWrapper').style.paddingRight = isFull ? "45%" : "0";
};

window.openPopup = (url) => { if (url) window.open(url, '_blank', 'width=1200,height=800'); };

// =========================================================================
// AGENDA CICLOMÉTRICA - LOGIC (BUG-FIXED & OPTIMIZED)
// =========================================================================

function updateCycleDisplay() {
    const el = document.getElementById('current-cycle'); if (!el) return;
    el.textContent = `VIGÊNCIA: ${appState.currentCycle.startDate.format('DD/MM')} ATÉ ${appState.currentCycle.endDate.format('DD/MM/YYYY')}`;
    updateCyclePreview();
}

window.updateCyclePreview = () => {
    const inp = document.getElementById('cycle-start-date');
    const pre = document.getElementById('cycle-preview-text');
    if (!inp || !pre) return;
    const start = moment(inp.value);
    if (start.isValid()) {
        const end = start.clone().add(13, 'days');
        const dayName = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'][start.day()];
        pre.innerHTML = `<span class="text-indigo-900 font-black">${dayName} ${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')}</span>`;
        if (start.day() !== 1) pre.innerHTML += `<br><span class="text-rose-500 text-[10px] font-black uppercase">⚠️ Recomendado iniciar Segunda</span>`;
    }
};

function updateMetrics() {
    const unique = { total: new Set(), partner: new Set(), multiplier: new Set(), reserve: new Set() };
    appState.clients.forEach(c => {
        if (isClientInCurrentCycle(c)) {
            const n = c.name.trim().toLowerCase();
            unique.total.add(n);
            if (unique[c.type]) unique[c.type].add(n);
        }
    });
    const getM = (s) => (s <= 7 ? 7 : (s <= 14 ? 14 : 21));
    const totalEl = document.getElementById('total-clients');
    if (totalEl) {
        totalEl.innerText = `${unique.total.size}/${getM(unique.total.size)}`;
        totalEl.className = `text-2xl font-bold ${unique.total.size > 21 ? 'text-rose-600' : 'text-slate-800'}`;
    }
    if (document.getElementById('partner-slots')) document.getElementById('partner-slots').innerText = `${unique.partner.size}/7`;
    if (document.getElementById('multiplier-slots')) document.getElementById('multiplier-slots').innerText = `${unique.multiplier.size}/7`;
    if (document.getElementById('reserve-slots')) document.getElementById('reserve-slots').innerText = `${unique.reserve.size}/7`;
}

function isClientInCurrentCycle(c) { 
    return moment(c.date).isBetween(appState.currentCycle.startDate, appState.currentCycle.endDate, null, '[]'); 
}

function renderCalendar() {
    // Fix — dias são dinâmicos: reconstruir os containers conforme workingDays atual
    const dayNames = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo' };

    // Coletar todas as datas de trabalho do ciclo em ordem
    const dates = [];
    let cur = appState.currentCycle.startDate.clone();
    while (cur.isSameOrBefore(appState.currentCycle.endDate)) {
        if (appState.workingDays.includes(cur.isoWeekday())) dates.push(cur.clone());
        cur.add(1, 'day');
    }
    dates.sort((a, b) => a.valueOf() - b.valueOf());

    // Dividir em semana 1 (dias 0-6) e semana 2 (dias 7-13)
    const week1 = dates.filter(d => d.diff(appState.currentCycle.startDate, 'days') < 7);
    const week2 = dates.filter(d => d.diff(appState.currentCycle.startDate, 'days') >= 7);

    // Reconstruir os containers de dias dinamicamente para cada semana
    [1, 2].forEach(wNum => {
        const weekDays = wNum === 1 ? week1 : week2;
        const container = document.querySelector(`.weekdays[data-week="${wNum}"]`);
        if (!container) return;

        // Ajustar grid-cols conforme número de dias
        const cols = weekDays.length || 3;
        container.className = `weekdays grid grid-cols-1 md:grid-cols-${cols} gap-6`;

        // Reconstruir os cards de dias
        container.innerHTML = weekDays.map(dt => {
            const iso = dt.isoWeekday();
            const label = dayNames[iso] || `Dia ${iso}`;
            return `
                <div class="weekday p-5 bg-white/40 rounded-[2rem] border border-white shadow-sm" 
                     data-day="${label}" data-week="${wNum}" data-iso="${iso}">
                    <h4 class="text-[11px] font-black uppercase tracking-wider text-center mb-5 text-slate-500">
                        ${label}-feira (${dt.format('DD/MM')})
                    </h4>
                    <div class="slots space-y-3"></div>
                </div>`;
        }).join('');

        // Se não há dias nessa semana, mostrar placeholder
        if (weekDays.length === 0) {
            container.innerHTML = `<div class="col-span-full py-8 text-center text-slate-300 text-xs font-bold italic">Nenhum dia de atendimento nesta semana.</div>`;
        }
    });

    // Preencher os slots de cada dia
    document.querySelectorAll('.weekday[data-iso]').forEach(wd => {
        const iso = Number(wd.dataset.iso);
        const wNum = wd.dataset.week;
        const sCont = wd.querySelector('.slots');
        if (!sCont) return;

        const dt = dates.find(d => d.isoWeekday() === iso &&
            ((wNum === '1' && d.diff(appState.currentCycle.startDate, 'days') < 7) ||
             (wNum === '2' && d.diff(appState.currentCycle.startDate, 'days') >= 7)));

        if (!dt) return;

        appState.timeSlots.forEach(t => {
            const sdt = dt.clone().set({ hour: parseInt(t.split(':')[0]), minute: parseInt(t.split(':')[1]), second: 0 });
            const client = appState.clients.find(c => moment(c.date).isSame(sdt, 'minute'));
            const el = document.createElement('div');
            el.className = client ? `slot ${client.type} draggable` : 'slot empty';
            el.innerHTML = client
                ? `<div class="slot-time">${t}</div>
                   <div class="slot-client">${client.name}</div>
                   <div class="slot-actions">
                       <button onclick="event.stopPropagation(); window.openEditClient('${client.id}')" title="Editar"><i class="bi bi-pencil"></i></button>
                       <button onclick="event.stopPropagation(); window.deleteClient('${client.id}')" class="delete-btn" title="Excluir"><i class="bi bi-trash"></i></button>
                   </div>`
                : `<div class="slot-time">${t}</div><div class="slot-client">Livre</div><button class="add-btn" onclick="window.quickAdd('${sdt.format()}')">+</button>`;
            if (client) { el.draggable = true; el.dataset.clientId = client.id; }
            el.dataset.datetime = sdt.format();
            sCont.appendChild(el);
        });
    });

    addDragEvents();
    updateCycleDisplay();
}

function addDragEvents() {
    const slots = document.querySelectorAll('.slot');
    slots.forEach(s => {
        s.addEventListener('dragstart', (e) => {
            const cid = s.getAttribute('data-client-id');
            if (!cid) { e.preventDefault(); return; }
            draggedClientId = cid; s.classList.add('dragging');
            e.dataTransfer.setData('text/plain', cid); e.dataTransfer.effectAllowed = "move";
        });
        s.addEventListener('dragend', () => { s.classList.remove('dragging'); draggedClientId = null; });
        s.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (!s.classList.contains('dragging')) s.classList.add('drag-over'); });
        s.addEventListener('dragleave', () => s.classList.remove('drag-over'));
        s.addEventListener('drop', (e) => {
            e.preventDefault(); e.stopPropagation(); s.classList.remove('drag-over');
            const cid = e.dataTransfer.getData('text/plain') || draggedClientId; if (!cid) return;
            const targetDT = s.dataset.datetime;
            const dragIdx = appState.clients.findIndex(c => String(c.id) === String(cid)); if (dragIdx === -1) return;
            const targetIdx = appState.clients.findIndex(c => moment(c.date).isSame(targetDT, 'minute'));
            if (targetIdx !== -1) {
                const oldDate = appState.clients[dragIdx].date;
                appState.clients[dragIdx].date = appState.clients[targetIdx].date;
                appState.clients[targetIdx].date = oldDate;
            } else { appState.clients[dragIdx].date = targetDT; }
            saveState(); renderCalendar(); window.showToast("Localização atualizada.");
        });
    });
}

// =========================================================================
// AGENDA OPERATIONS
// =========================================================================

// ---- helpers do modal de compromisso ----

let _editingClientId = null;

function openClientModal(clientId, presetDatetime) {
    _editingClientId = clientId || null;
    document.getElementById('client-form').reset();
    document.getElementById('slot-conflict-warning').classList.add('hidden');

    const titleEl = document.getElementById('client-modal-title');

    if (clientId) {
        // EDIÇÃO
        const c = appState.clients.find(x => String(x.id) === String(clientId));
        if (!c) return;
        titleEl.innerText = 'Editar Atendimento';
        document.getElementById('client-name').value = c.name;
        document.getElementById('client-type').value = c.type;
        document.getElementById('client-notes').value = c.notes || '';
        const dt = moment(c.date);
        document.getElementById('client-date').value = dt.format('YYYY-MM-DD');
        document.getElementById('client-time').value = dt.format('HH:mm');
    } else {
        // NOVO
        titleEl.innerText = 'Novo Atendimento';
        if (presetDatetime) {
            const dt = moment(presetDatetime);
            document.getElementById('client-date').value = dt.format('YYYY-MM-DD');
            document.getElementById('client-time').value = dt.format('HH:mm');
        } else {
            document.getElementById('client-date').value = moment().format('YYYY-MM-DD');
            document.getElementById('client-time').value = appState.timeSlots[0] || '09:00';
        }
    }

    renderSlotShortcuts();
    checkSlotConflict();
    document.getElementById('save-client').onclick = () => window.saveClient(_editingClientId);
    clientModal.show();
}

function renderSlotShortcuts() {
    const container = document.getElementById('slot-shortcuts');
    if (!container) return;
    container.innerHTML = '';
    const dateVal = document.getElementById('client-date').value;
    if (!dateVal) return;
    appState.timeSlots.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'px-3 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all';
        btn.innerText = t;
        btn.onclick = () => {
            document.getElementById('client-time').value = t;
            checkSlotConflict();
        };
        container.appendChild(btn);
    });
}

function checkSlotConflict() {
    const dateVal = document.getElementById('client-date').value;
    const timeVal = document.getElementById('client-time').value;
    const warning = document.getElementById('slot-conflict-warning');
    if (!dateVal || !timeVal || !warning) return;
    const sdt = moment(`${dateVal} ${timeVal}`, 'YYYY-MM-DD HH:mm');
    const conflict = appState.clients.find(c =>
        moment(c.date).isSame(sdt, 'minute') && String(c.id) !== String(_editingClientId)
    );
    warning.classList.toggle('hidden', !conflict);
}

window.onClientDateChange = () => {
    renderSlotShortcuts();
    checkSlotConflict();
};

window.quickAdd = (dt) => openClientModal(null, dt);
window.openEditClient = (id) => openClientModal(id);

window.saveClient = (id) => {
    const name = document.getElementById('client-name').value.trim();
    const type = document.getElementById('client-type').value;
    const dateVal = document.getElementById('client-date').value;
    const timeVal = document.getElementById('client-time').value;
    if (!name || !dateVal || !timeVal) return window.showToast('Preencha nome, data e horário.', 'warning');
    const date = moment(`${dateVal} ${timeVal}`, 'YYYY-MM-DD HH:mm').format();
    const data = { id: id || Math.random().toString(36).substr(2, 9), name, type, date, notes: document.getElementById('client-notes').value };
    if (id) {
        const idx = appState.clients.findIndex(x => String(x.id) === String(id));
        if (idx !== -1) appState.clients[idx] = data;
    } else {
        appState.clients.push(data);
    }
    recalcAllScores();
    saveState(); renderCalendar(); clientModal.hide(); window.showToast('Agendamento salvo!');
};

window.deleteClient = (id) => {
    if (confirm('Excluir este agendamento?')) {
        appState.clients = appState.clients.filter(c => String(c.id) !== String(id));
        recalcAllScores();
        saveState(); renderCalendar(); window.showToast("Removido.");
    }
};

window.limparCiclo = () => {
    const inicio = appState.currentCycle.startDate.format('DD/MM');
    const fim = appState.currentCycle.endDate.format('DD/MM/YYYY');
    if (!confirm(`Remover todos os agendamentos do ciclo atual (${inicio} – ${fim})?\nEsta ação não pode ser desfeita.`)) return;
    const antes = appState.clients.length;
    appState.clients = appState.clients.filter(c => !isClientInCurrentCycle(c));
    const removidos = antes - appState.clients.length;
    saveState(); renderCalendar();
    window.showToast(`${removidos} agendamento(s) do ciclo removidos.`);
};

window.limparTudo = () => {
    if (!confirm('⚠️ Remover TODOS os agendamentos de todos os ciclos?\nEsta ação não pode ser desfeita.')) return;
    if (!confirm('Tem certeza? Todos os dados da Agenda serão apagados permanentemente.')) return;
    const total = appState.clients.length;
    appState.clients = [];
    saveState(); renderCalendar();
    window.showToast(`${total} agendamento(s) removidos. Agenda zerada.`);
};

// =========================================================================
// EXCEL & DATA IO
// =========================================================================

window.exportToExcel = () => {
    try {
        const wb = XLSX.utils.book_new();
        // Export Fix — usar DD/MM/YYYY legível + coluna Tipo em PT para o usuário
        // mas manter ISO internamente para reimportação robusta
        const wsData = [['Data', 'Horário', 'Cliente', 'Tipo', 'Tipo_Interno', 'Notas']];
        const typeLabels = { partner: 'Parceiro', multiplier: 'Multiplicador', reserve: 'Reserva' };
        const sorted = [...appState.clients].sort((a,b) => moment(a.date).valueOf() - moment(b.date).valueOf());
        sorted.forEach(c => {
            wsData.push([
                moment(c.date).format('DD/MM/YYYY'),
                moment(c.date).format('HH:mm'),
                c.name,
                typeLabels[c.type] || c.type,
                c.type, // coluna interna para reimportação sem ambiguidade
                c.notes || ''
            ]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Agenda");
        XLSX.writeFile(wb, `Agenda_${moment().format('DD-MM-YYYY')}.xlsx`);
        window.showToast("EXPORTAÇÃO CONCLUÍDA!");
    } catch (e) { window.showToast("Erro ao exportar!", "warning"); }
};

window.importFromExcel = (ev) => {
    const file = ev.target?.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (e) => {
        try {
            // cellDates: false — manter datas como string para parsear DD/MM/YYYY corretamente
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: false, raw: false });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' });

            // Import Fix 1 — encontrar cabeçalho mesmo com título/linhas em branco antes
            // Busca célula que seja EXATAMENTE 'data' ou 'date' (não contém, é igual)
            let hIdx = data.findIndex(row => row && row.some(cell => {
                const v = String(cell || '').toLowerCase().trim();
                return v === 'data' || v === 'date';
            }));
            if (hIdx === -1) return window.showToast("Cabeçalhos não encontrados!", "warning");

            const headers = data[hIdx].map(h => String(h || '').toLowerCase().trim());
            const colIdx = {
                data:  headers.findIndex(h => h === 'data' || h === 'date'),
                hora:  headers.findIndex(h => h.includes('hor') || h.includes('slot') || h.includes('hora')),
                nome:  headers.findIndex(h => h.includes('cliente') || h.includes('nome') || h.includes('user')),
                tipo:  headers.findIndex(h => h === 'tipo_interno' || h === 'tipo' || h.includes('cat')),
                notas: headers.findIndex(h => h.includes('nota') || h.includes('obs') || h.includes('desc'))
            };

            // Priorizar tipo_interno se existir (exportação do próprio sistema)
            const tipoInternoIdx = headers.findIndex(h => h === 'tipo_interno');

            if (colIdx.data === -1 || colIdx.nome === -1) {
                return window.showToast("Colunas Data e Cliente são obrigatórias!", "warning");
            }

            let count = 0, skipped = 0;
            for (let i = hIdx + 1; i < data.length; i++) {
                const row = data[i];
                if (!row || !row[colIdx.data] || !row[colIdx.nome]) continue;

                // Import Fix 2 — parsear DD/MM/YYYY, YYYY-MM-DD e outros formatos
                let dt;
                const rawDate = String(row[colIdx.data]).trim();
                if (rawDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    dt = moment(rawDate, 'DD/MM/YYYY', true);
                } else if (rawDate.match(/^\d{4}-\d{2}-\d{2}/)) {
                    dt = moment(rawDate);
                } else {
                    dt = moment(rawDate, ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'D/M/YYYY']);
                }

                if (!dt.isValid()) { skipped++; continue; }

                // Aplicar horário
                if (colIdx.hora !== -1 && row[colIdx.hora]) {
                    const tStr = String(row[colIdx.hora]).trim();
                    if (tStr.includes(':')) {
                        const [h, m] = tStr.split(':');
                        dt.set({ hour: parseInt(h), minute: parseInt(m), second: 0 });
                    }
                } else if (dt.hours() === 0) {
                    dt.set({ hour: 9, minute: 0, second: 0 });
                }

                // Import Fix 3 — mapear tipo PT→EN com prioridade para tipo_interno
                let type = 'partner';
                const rawTipo = tipoInternoIdx !== -1 && row[tipoInternoIdx]
                    ? String(row[tipoInternoIdx]).toLowerCase()
                    : (colIdx.tipo !== -1 && row[colIdx.tipo] ? String(row[colIdx.tipo]).toLowerCase() : '');

                if (['multiplier', 'multiplicador', 'multi'].some(k => rawTipo.includes(k))) type = 'multiplier';
                else if (['reserve', 'reserva', 'reser'].some(k => rawTipo.includes(k))) type = 'reserve';
                else if (['partner', 'parceiro', 'parce'].some(k => rawTipo.includes(k))) type = 'partner';

                if (!appState.clients.some(c => moment(c.date).isSame(dt, 'minute'))) {
                    appState.clients.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: String(row[colIdx.nome]).trim(),
                        type,
                        date: dt.format(),
                        notes: colIdx.notas !== -1 ? String(row[colIdx.notas] || '') : ''
                    });
                    count++;
                }
            }
            saveState();
            renderCalendar();
            const msg = skipped > 0
                ? `${count} importados! (${skipped} linha(s) com data inválida ignorada(s))`
                : `${count} agendamentos importados com sucesso!`;
            window.showToast(msg);
            ev.target.value = '';
        } catch (err) {
            console.error(err);
            window.showToast("Falha no processamento do arquivo.", "warning");
        }
    };
    r.readAsArrayBuffer(file);
};

window.saveData = () => {
    const data = { listas: appState.listas, tarefasGlobal: appState.tarefasGlobal, activeUserName: appState.activeUserName };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Foco_${moment().format('YYYYMMDD')}.json`; a.click();
};

window.loadData = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
    inp.onchange = (e) => {
        const r = new FileReader();
        r.onload = (ev) => {
            const d = JSON.parse(ev.target.result);
            appState.listas = d.listas; appState.tarefasGlobal = d.tarefasGlobal || []; appState.activeUserName = d.activeUserName || "";
            saveState(); window.switchTab(appState.currentFocusTab); window.showToast("Foco Restaurado!");
        };
        r.readAsText(e.target.files[0]);
    };
    inp.click();
};

window.loadExampleData = () => {
    appState.listas = { prospec: [{ nome: "Projeto Gênese", tipo: "Pipeline", status: "Ativa", arquivada: false }], ativacao: [], implem: [], gestao: [] };
    appState.tarefasGlobal = [{ id: 1, titulo: "Definir MVP", contexto: "Projeto Gênese", categoria: "ATENÇÃO", icone: "📢" }];
    saveState(); window.switchTab('prospec'); window.showToast("Exemplos Carregados.");
};

window.entrarNa = function(destino) {
    const input = document.getElementById('userNameInput');
    const n = input ? input.value.trim() : '';
    if (!n) {
        input?.classList.add('animate-shake');
        setTimeout(() => input?.classList.remove('animate-shake'), 500);
        window.showToast('Digite seu nome primeiro!', 'warning');
        input?.focus();
        return;
    }
    // Destacar card clicado brevemente
    document.querySelectorAll('.destino-card').forEach(c => c.classList.remove('selected'));
    event?.currentTarget?.classList.add('selected');

    appState.activeUserName = n;
    updateUserDisplay(n);
    if (userModal) userModal.hide();
    saveState();
    window.switchView(destino);
    window.showToast(`Bem-vinda, ${n}!`);
    renderCRMStats();
};

// Fallback — entrar sem destino vai para a última view salva
window.confirmUserName = function() {
    const input = document.getElementById('userNameInput');
    const n = input ? input.value.trim() : '';
    if (!n) return window.showToast('Digite seu nome.', 'warning');
    appState.activeUserName = n;
    updateUserDisplay(n);
    if (userModal) userModal.hide();
    saveState();
    window.switchView(appState.currentView || 'agenda');
    window.showToast(`Bem-vinda, ${n}!`);
    renderCRMStats();
};

// =========================================================================
// INITIALIZATION
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    clientModal = new bootstrap.Modal(document.getElementById('client-modal'));
    settingsModal = new bootstrap.Modal(document.getElementById('settings-modal'));
    itemModal = new bootstrap.Modal(document.getElementById('itemModal'));
    taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
    pillarDetailModal = new bootstrap.Modal(document.getElementById('pillarDetailModal'));
    tutorialModal = new bootstrap.Modal(document.getElementById('tutorialModal'));
    userModal = new bootstrap.Modal(document.getElementById('userModal'));
    leadModal = new bootstrap.Modal(document.getElementById('leadModal'));
    crmPickerModal = new bootstrap.Modal(document.getElementById('crmPickerModal'));
    initCRMAutocomplete();
    initContextoPicker();
    initAcoesModals();

    document.getElementById('settings-btn').onclick = () => {
        renderTimeSlotSettings();
        document.getElementById('cycle-start-date').value = appState.currentCycle.startDate.format('YYYY-MM-DD');
        // Fix — marcar checkboxes conforme workingDays atual ao abrir o modal
        document.querySelectorAll('input[name="working-day"]').forEach(cb => {
            cb.checked = appState.workingDays.includes(Number(cb.value));
        });
        settingsModal.show();
    };
    document.getElementById('save-settings').onclick = () => {
        appState.timeSlots = Array.from(document.querySelectorAll('.time-slot-input')).map(i => i.value).filter(v => v).sort();
        // Fix — ler os checkboxes marcados e salvar em workingDays
        const selectedDays = Array.from(document.querySelectorAll('input[name="working-day"]:checked')).map(cb => Number(cb.value));
        if (selectedDays.length > 0) appState.workingDays = selectedDays;
        const start = document.getElementById('cycle-start-date').value;
        if (start) { appState.currentCycle.startDate = moment(start); appState.currentCycle.endDate = appState.currentCycle.startDate.clone().add(13, 'days'); }
        saveAIConfig(); saveState(); renderCalendar(); settingsModal.hide(); window.showToast("Preferências salvas!");
    };

    document.getElementById('prev-cycle').onclick = () => { appState.currentCycle.startDate.subtract(14, 'days'); appState.currentCycle.endDate.subtract(14, 'days'); renderCalendar(); saveState(); };
    // Carregar config de IA ao abrir settings
    loadAISettings();
    document.getElementById('next-cycle').onclick = () => { appState.currentCycle.startDate.add(14, 'days'); appState.currentCycle.endDate.add(14, 'days'); renderCalendar(); saveState(); };

    document.getElementById('add-time-slot').onclick = () => {
        const c = document.getElementById('time-slots-container');
        const d = document.createElement('div'); d.className = 'flex gap-2';
        d.innerHTML = `<input type="time" class="form-control time-slot-input" value="09:00"><button class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">✕</button>`;
        c.appendChild(d);
    };

    document.getElementById('copy-prev-cycle').onclick = () => {
        const prevStart = appState.currentCycle.startDate.clone().subtract(14, 'days');
        const prevEnd = appState.currentCycle.endDate.clone().subtract(14, 'days');
        const prevC = appState.clients.filter(c => moment(c.date).isBetween(prevStart, prevEnd, null, '[]'));
        let count = 0;
        prevC.forEach(pc => {
            const nextD = moment(pc.date).add(14, 'days');
            if (!appState.clients.some(c => moment(c.date).isSame(nextD, 'minute'))) {
                appState.clients.push({ ...pc, id: Math.random().toString(36).substr(2, 9), date: nextD.format() });
                count++;
            }
        });
        saveState(); renderCalendar(); window.showToast(`${count} repetidos!`);
    };

    document.getElementById('import-file')?.addEventListener('change', window.importFromExcel);
    document.getElementById('client-time')?.addEventListener('change', checkSlotConflict);
    document.getElementById('add-client').onclick = () => window.quickAdd();
    document.getElementById('confirmUserNameBtn')?.addEventListener('click', window.confirmUserName);

    // Bug 3 Fix — conectar botão de confirmação de remoção de contexto
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', window.confirmDelete);

    loadState();
});

function renderTimeSlotSettings() {
    const c = document.getElementById('time-slots-container');
    c.innerHTML = appState.timeSlots.map(s => `<div class="flex gap-2"><input type="time" class="form-control time-slot-input" value="${s}"><button class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">✕</button></div>`).join('');
}


// =========================================================================
// LEAD SCORE — Cálculo automático
// =========================================================================

function calcLeadScore(lead) {
    let score = 0;

    // Dados preenchidos
    if (lead.email && lead.email.trim())  score += 10;
    if (lead.phone && lead.phone.trim())  score += 10;
    if (lead.notes && lead.notes.trim())  score += 5;

    // Tipo (Multiplicador vale mais estrategicamente)
    const tipoScores = { multiplier: 25, partner: 15, reserve: 5 };
    score += tipoScores[lead.type] || 0;

    // Canal
    const canalScores = {
        indicacao: 20, referral: 20,
        evento: 15,
        website: 5, social: 5, paid: 5, email: 5
    };
    score += canalScores[lead.channel] || 0;

    // Status
    const statusScores = {
        lead: 0, mql: 15, sql: 25,
        pql: 30, sal: 35, customer: 45
    };
    score += statusScores[lead.status] || 0;

    // Agendamento futuro
    const now = moment();
    const hasFutureAppt = appState.clients.some(c =>
        c.name.trim().toLowerCase() === lead.name.trim().toLowerCase() &&
        moment(c.date).isAfter(now)
    );
    if (hasFutureAppt) score += 15;

    // Atendimento nos últimos 14 dias
    const cutoff = moment().subtract(14, 'days');
    const hasRecentAppt = appState.clients.some(c =>
        c.name.trim().toLowerCase() === lead.name.trim().toLowerCase() &&
        moment(c.date).isBetween(cutoff, now)
    );
    if (hasRecentAppt) score += 10;

    return Math.min(100, score);
}

function recalcAllScores() {
    appState.leads.forEach(l => { l.score = calcLeadScore(l); });
}

// =========================================================================
// SAVE / LOAD GLOBAL — backup completo do sistema
// =========================================================================

window.saveGlobal = function() {
    try {
        const backup = {
            version: 'GERiAH Suite v0.1.5.0',
            savedAt: new Date().toISOString(),
            leads: appState.leads,
            crmActivities: appState.crmActivities || [],
            clients: appState.clients,
            listas: appState.listas,
            tarefasGlobal: appState.tarefasGlobal,
            activeUserName: appState.activeUserName,
            workingDays: appState.workingDays,
            timeSlots: appState.timeSlots,
            bpData: appState.bpData || {},
            esteiraData: appState.esteiraData || {},
            aiConfig: appState.aiConfig ? { provider: appState.aiConfig.provider, model: appState.aiConfig.model } : {},
            currentView: appState.currentView || 'agenda',
            currentFocusTab: appState.currentFocusTab || 'todos',
            currentCycle: {
                startDate: appState.currentCycle.startDate.format(),
                endDate: appState.currentCycle.endDate.format()
            }
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = moment().format('YYYY-MM-DD_HHmm');
        a.href = url;
        a.download = `GERiAH_Suite_backup_${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast('Backup salvo com sucesso!');
    } catch(e) {
        window.showToast('Erro ao salvar backup.', 'warning');
    }
};

window.loadGlobal = function() {
    if (!confirm('Restaurar um backup vai substituir TODOS os dados atuais.\nTem certeza?')) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                // Restaurar todos os módulos
                if (data.leads)          appState.leads = data.leads;
                if (data.crmActivities)  appState.crmActivities = data.crmActivities;
                if (data.clients)        appState.clients = data.clients;
                if (data.listas)         appState.listas = data.listas;
                if (data.tarefasGlobal)  appState.tarefasGlobal = data.tarefasGlobal;
                if (data.activeUserName) { appState.activeUserName = data.activeUserName; updateUserDisplay(data.activeUserName); }
                if (data.workingDays)    appState.workingDays = data.workingDays;
                if (data.aiConfig)       appState.aiConfig = { ...data.aiConfig, key: appState.aiConfig?.key || '' }; // key não viaja no backup
                if (data.bpData)         appState.bpData = data.bpData;
                if (data.esteiraData)    appState.esteiraData = data.esteiraData;
                if (data.timeSlots)      appState.timeSlots = data.timeSlots;
                if (data.currentView)    appState.currentView = data.currentView;
                if (data.currentFocusTab) appState.currentFocusTab = data.currentFocusTab;
                if (data.currentCycle) {
                    appState.currentCycle.startDate = moment(data.currentCycle.startDate);
                    appState.currentCycle.endDate   = moment(data.currentCycle.endDate);
                }
                saveState();
                // Re-renderizar tudo baseado na view restaurada
                const view = appState.currentView || 'agenda';
                window.switchView(view);
                window.switchTab(appState.currentFocusTab || 'todos');
                renderCRM();
                updateStats();
                updateMetrics();
                const savedAt = data.savedAt ? moment(data.savedAt).format('DD/MM/YYYY [às] HH:mm') : 'data desconhecida';
                window.showToast('Backup de ' + savedAt + ' restaurado!');
            } catch(err) {
                window.showToast('Arquivo inválido ou corrompido.', 'warning');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// =========================================================================
// CRM — LeadFlow integrado
// =========================================================================

const crmStatusMap = {
    lead: 'prospec', mql: 'prospec',
    sql: 'ativacao', pql: 'ativacao',
    sal: 'implem',
    customer: 'gestao'
};

const crmStatusLabels = {
    lead: 'Lead', mql: 'MQL', sql: 'SQL',
    pql: 'PQL', sal: 'SAL', customer: 'Cliente'
};

const crmChannelLabels = {
    website: '🌐 Website', social: '📱 Social', email: '📧 Email',
    referral: '🔗 Referral', paid: '💰 Paid Ads',
    indicacao: '🤝 Indicação', evento: '🎪 Evento'
};

window.crmView = 'cards';
window.crmSort = 'score'; // score | name | date

window.loadCRMExamples = function() {
    if (appState.leads.length > 0) {
        if (!confirm('Já existem leads cadastrados. Adicionar os exemplos mesmo assim?')) return;
    }
    const examples = [
        { id: 'ex1', name: 'Maria Aparecida Costa', email: 'maria@email.com', phone: '(11) 98765-4321', channel: 'indicacao', status: 'customer', type: 'partner', score: 0, notes: 'Consultora de moda 50+, produto formatado após PUV Score', entryDate: new Date(Date.now() - 86400000 * 30).toISOString() },
        { id: 'ex2', name: 'Roberto Figueiredo', email: 'roberto@agencia.com', phone: '(21) 99876-5432', channel: 'evento', status: 'sql', type: 'multiplier', score: 0, notes: 'Agência digital, atende empresas 50+, interessado em parceria', entryDate: new Date(Date.now() - 86400000 * 15).toISOString() },
        { id: 'ex3', name: 'Lucia Mendonça', email: 'lucia@consultoria.com', phone: '(31) 97654-3210', channel: 'indicacao', status: 'mql', type: 'partner', score: 0, notes: 'Consultora independente, público 50+, viu resultado de colega', entryDate: new Date(Date.now() - 86400000 * 10).toISOString() },
        { id: 'ex4', name: 'Carlos Eduardo Neves', email: 'carlos@empresa.com.br', phone: '(41) 96543-2109', channel: 'social', status: 'lead', type: 'reserve', score: 0, notes: 'Seguidor do Instagram, comentou no post de GERIAH PUV Score', entryDate: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: 'ex5', name: 'Ana Paula Drummond', email: 'ana@eventos.com', phone: '(51) 95432-1098', channel: 'referral', status: 'sal', type: 'multiplier', score: 0, notes: 'Produtora de eventos, ticket 5x após PUV Score, quer indicar', entryDate: new Date(Date.now() - 86400000 * 20).toISOString() },
        { id: 'ex6', name: 'José Henrique Motta', email: 'jose@cosmeticos.com', phone: '(61) 94321-0987', channel: 'website', status: 'pql', type: 'partner', score: 0, notes: 'Setor de cosméticos, +47% visitas após diagnóstico', entryDate: new Date(Date.now() - 86400000 * 8).toISOString() },
    ];
    // Calcular scores reais
    examples.forEach(l => { l.score = calcLeadScore(l); });
    appState.leads.push(...examples);
    syncAllLeadsToMonitor();
    crmAddActivity('Exemplos GERiAH carregados');
    saveState();
    renderCRM();
    window.showToast('6 leads de exemplo carregados!');
};

function syncAllLeadsToMonitor() {
    appState.leads.forEach(l => syncLeadToMonitor(l));
}
let _editingLeadId = null;


// --- Modal ---

window.openLeadModal = function(leadId = null) {
    _editingLeadId = leadId;
    const titleEl = document.getElementById('leadModalTitle');
    document.getElementById('lead-name').value = '';
    document.getElementById('lead-email').value = '';
    document.getElementById('lead-phone').value = '';
    document.getElementById('lead-channel').value = 'indicacao';
    document.getElementById('lead-status').value = 'lead';
    document.getElementById('lead-type').value = 'partner';
    document.getElementById('lead-score').value = 0;
    document.getElementById('lead-notes').value = '';
    document.getElementById('lead-monitor-hint').classList.add('hidden');

    if (leadId) {
        const lead = appState.leads.find(l => l.id === leadId);
        if (!lead) return;
        titleEl.innerText = 'Editar Lead';
        document.getElementById('lead-name').value = lead.name;
        document.getElementById('lead-email').value = lead.email || '';
        document.getElementById('lead-phone').value = lead.phone || '';
        document.getElementById('lead-channel').value = lead.channel || 'indicacao';
        document.getElementById('lead-status').value = lead.status;
        document.getElementById('lead-type').value = lead.type || 'partner';
        document.getElementById('lead-score').value = lead.score || 0;
        document.getElementById('lead-notes').value = lead.notes || '';
    } else {
        titleEl.innerText = 'Novo Lead';
    }
    window.onLeadStatusChange();
    leadModal.show();
};

window.onLeadStatusChange = function() {
    const status = document.getElementById('lead-status').value;
    const hint = document.getElementById('lead-monitor-hint');
    hint.classList.toggle('hidden', !crmStatusMap[status]);
};

window.saveLead = function() {
    const name = document.getElementById('lead-name').value.trim();
    if (!name) return window.showToast('Nome é obrigatório.', 'warning');
    const status = document.getElementById('lead-status').value;
    const lead = {
        id: _editingLeadId || Date.now().toString(),
        name,
        email: document.getElementById('lead-email').value.trim(),
        phone: document.getElementById('lead-phone').value.trim(),
        channel: document.getElementById('lead-channel').value,
        status,
        type: document.getElementById('lead-type').value,
        score: 0, // será calculado abaixo
        notes: document.getElementById('lead-notes').value.trim(),
        entryDate: _editingLeadId
            ? (appState.leads.find(l => l.id === _editingLeadId)?.entryDate || new Date().toISOString())
            : new Date().toISOString()
    };
    lead.score = calcLeadScore(lead);

    if (_editingLeadId) {
        const idx = appState.leads.findIndex(l => l.id === _editingLeadId);
        if (idx !== -1) appState.leads[idx] = lead;
        crmAddActivity(`Lead "${name}" atualizado`);
    } else {
        appState.leads.push(lead);
        crmAddActivity(`Novo lead "${name}" adicionado`);
    }

    // Integração 1 — criar/mover contexto no Monitor
    syncLeadToMonitor(lead);

    saveState();
    leadModal.hide();
    renderCRM();
    window.showToast(`Lead "${name}" salvo!`);
};

function syncLeadToMonitor(lead) {
    const fase = crmStatusMap[lead.status];
    if (!fase) return;
    // Remover de outras fases se já existir
    for (const k in appState.listas) {
        appState.listas[k] = appState.listas[k].filter(x => x && x.nome !== lead.name);
    }
    // Checar se já existe nessa fase
    const jaExiste = appState.listas[fase].some(x => x && x.nome === lead.name);
    if (!jaExiste) {
        appState.listas[fase].push({
            nome: lead.name,
            tipo: 'Pipeline',
            status: lead.status === 'customer' ? 'Ativa' : 'Ativa',
            arquivada: false,
            crmId: lead.id
        });
    }
}

window.deleteLead = function(leadId) {
    const lead = appState.leads.find(l => l.id === leadId);
    if (!lead) return;
    if (!confirm(`Remover o lead "${lead.name}"?`)) return;
    appState.leads = appState.leads.filter(l => l.id !== leadId);
    crmAddActivity(`Lead "${lead.name}" removido`);
    saveState();
    renderCRM();
    window.showToast('Lead removido.');
};

// Integração 2 — sugerir agendamento a partir do lead
window.agendarLead = function(leadId) {
    const lead = appState.leads.find(l => l.id === leadId);
    if (!lead) return;
    window.switchView('agenda');
    setTimeout(() => {
        openClientModal(null, null);
        document.getElementById('client-name').value = lead.name;
        document.getElementById('client-type').value = lead.type || 'partner';
    }, 300);
};

// --- Render CRM ---

window.renderCRM = function() {
    renderCRMStats();
    renderCRMActivities();
    if (window.crmView === 'funnel') renderCRMFunnel();
    else if (window.crmView === 'list') renderCRMList();
    else renderCRMCards();
    // Atualizar botões de view
    ['cards','list','funnel'].forEach(v => {
        const btn = document.getElementById(`crm-btn-${v}`);
        if (!btn) return;
        const active = window.crmView === v;
        btn.className = `px-3 py-2 rounded-xl text-xs font-bold transition-all border ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`;
    });
};

function renderCRMStats() {
    const leads = appState.leads;
    const total = leads.length;
    const mql = leads.filter(l => l.status === 'mql').length;
    const sql = leads.filter(l => l.status === 'sql').length;
    const customers = leads.filter(l => l.status === 'customer').length;
    const conv = total > 0 ? Math.round((customers / total) * 100) : 0;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('crm-total', total);
    set('crm-mql', mql);
    set('crm-sql', sql);
    set('crm-conversion', conv + '%');
}

function getFilteredLeads() {
    const search = (document.getElementById('crm-search')?.value || '').toLowerCase();
    const status = document.getElementById('crm-filter-status')?.value || '';
    const channel = document.getElementById('crm-filter-channel')?.value || '';
    return appState.leads.filter(l => {
        const matchSearch = !search || l.name.toLowerCase().includes(search) || (l.email || '').toLowerCase().includes(search);
        const matchStatus = !status || l.status === status;
        const matchChannel = !channel || l.channel === channel;
        return matchSearch && matchStatus && matchChannel;
    });
}

function getNextAppointment(leadName) {
    const now = moment();
    const future = appState.clients
        .filter(c => c.name.trim().toLowerCase() === leadName.trim().toLowerCase() && moment(c.date).isAfter(now))
        .sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());
    return future.length > 0 ? moment(future[0].date) : null;
}

function renderCRMCards() {
    const container = document.getElementById('crm-leads-container');
    if (!container) return;
    const leads = sortedLeads(getFilteredLeads());
    if (leads.length === 0) {
        container.innerHTML = '<div class="py-16 text-center text-slate-300 font-bold italic text-sm">Nenhum lead encontrado.</div>';
        return;
    }
    container.innerHTML = `<div class="crm-leads-grid">${leads.map(lead => {
        const next = getNextAppointment(lead.name);
        const nextHtml = next
            ? `<span class="next-appt">📅 ${next.format('DD/MM [às] HH:mm')}</span>`
            : `<span class="no-appt">Sem agendamento</span>`;
        const scoreW = Math.min(100, Math.max(0, lead.score || 0));
        return `
        <div class="crm-lead-card">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <p class="font-black text-slate-800 text-sm leading-tight">${lead.name}</p>
                    <p class="text-[10px] text-slate-400 font-medium mt-0.5">${lead.email || '—'}</p>
                </div>
                <span class="crm-badge crm-badge-${lead.status}">${crmStatusLabels[lead.status]}</span>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2">
                <span class="crm-channel">${crmChannelLabels[lead.channel] || lead.channel}</span>
                <span>Score: ${lead.score || 0}</span>
            </div>
            <div class="crm-score-bar"><div class="crm-score-fill" style="width:${scoreW}%"></div></div>
            ${nextHtml}
            <div class="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onclick="window.agendarLead('${lead.id}')" class="flex-1 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all">
                    <i class="bi bi-calendar-plus me-1"></i>Agendar
                </button>
                <button onclick="window.openLeadModal('${lead.id}')" class="flex-1 py-2 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black hover:bg-slate-200 transition-all">
                    <i class="bi bi-pencil me-1"></i>Editar
                </button>
                <button onclick="window.deleteLead('${lead.id}')" class="py-2 px-3 rounded-xl bg-rose-50 text-rose-500 text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
        </div>`;
    }).join('')}</div>`;
}

function sortedLeads(leads) {
    return [...leads].sort((a, b) => {
        if (window.crmSort === 'name') return a.name.localeCompare(b.name);
        if (window.crmSort === 'date') {
            const na = getNextAppointment(a.name);
            const nb = getNextAppointment(b.name);
            if (!na && !nb) return 0;
            if (!na) return 1;
            if (!nb) return -1;
            return na.valueOf() - nb.valueOf();
        }
        return b.score - a.score; // default: score desc
    });
}

function renderCRMList() {
    const container = document.getElementById('crm-leads-container');
    if (!container) return;
    const leads = sortedLeads(getFilteredLeads());

    if (leads.length === 0) {
        container.innerHTML = '<div class="py-16 text-center text-slate-300 font-bold italic text-sm">Nenhum lead encontrado.</div>';
        return;
    }

    const thClass = "px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 select-none";
    const sortIcon = (col) => window.crmSort === col ? ' ↓' : '';

    container.innerHTML = `
    <div class="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <table class="w-full border-collapse">
            <thead class="bg-slate-50 border-b border-slate-100">
                <tr>
                    <th class="${thClass}" onclick="window.setCRMSort('name')">Nome${sortIcon('name')}</th>
                    <th class="${thClass} hidden md:table-cell">Contato</th>
                    <th class="${thClass}" onclick="window.setCRMSort('score')">Score${sortIcon('score')}</th>
                    <th class="${thClass}">Status</th>
                    <th class="${thClass} hidden lg:table-cell">Tipo</th>
                    <th class="${thClass} hidden lg:table-cell">Canal</th>
                    <th class="${thClass}" onclick="window.setCRMSort('date')">Próx. Atend.${sortIcon('date')}</th>
                    <th class="${thClass}">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${leads.map((lead, idx) => {
                    const next = getNextAppointment(lead.name);
                    const nextTxt = next ? next.format('DD/MM [às] HH:mm') : '—';
                    const scoreColor = lead.score >= 70 ? '#15803d' : lead.score >= 40 ? '#d97706' : '#94a3b8';
                    const typeLabels = { partner: '💎 Parceiro', multiplier: '⚡ Multiplicador', reserve: '📦 Reserva' };
                    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                    return `<tr class="${rowBg} hover:bg-indigo-50/40 transition-colors">
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                                    ${lead.name.charAt(0).toUpperCase()}
                                </div>
                                <span class="text-sm font-bold text-slate-800">${lead.name}</span>
                            </div>
                        </td>
                        <td class="px-4 py-3 hidden md:table-cell">
                            <p class="text-xs font-medium text-slate-500">${lead.email || '—'}</p>
                            <p class="text-xs font-medium text-slate-400">${lead.phone || ''}</p>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <div class="crm-score-bar w-16"><div class="crm-score-fill" style="width:${lead.score}%"></div></div>
                                <span class="text-xs font-black" style="color:${scoreColor}">${lead.score}</span>
                            </div>
                        </td>
                        <td class="px-4 py-3">
                            <span class="crm-badge crm-badge-${lead.status}">${crmStatusLabels[lead.status]}</span>
                        </td>
                        <td class="px-4 py-3 hidden lg:table-cell">
                            <span class="text-xs font-bold text-slate-600">${typeLabels[lead.type] || lead.type}</span>
                        </td>
                        <td class="px-4 py-3 hidden lg:table-cell">
                            <span class="crm-channel">${crmChannelLabels[lead.channel] || lead.channel}</span>
                        </td>
                        <td class="px-4 py-3">
                            <span class="text-xs font-bold ${next ? 'text-indigo-600' : 'text-slate-300'}">${nextTxt}</span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex gap-1">
                                <button onclick="window.agendarLead('${lead.id}')" class="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all text-xs" title="Agendar">
                                    <i class="bi bi-calendar-plus"></i>
                                </button>
                                <button onclick="window.openLeadModal('${lead.id}')" class="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all text-xs" title="Editar">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button onclick="window.deleteLead('${lead.id}')" class="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs" title="Excluir">
                                    <i class="bi bi-trash3"></i>
                                </button>
                            </div>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;
}

window.setCRMSort = function(col) {
    window.crmSort = col;
    renderCRM();
};

function renderCRMFunnel() {
    const container = document.getElementById('crm-leads-container');
    if (!container) return;
    const stages = [
        { key: 'lead', label: 'Lead', color: '#94a3b8' },
        { key: 'mql', label: 'MQL', color: '#4361ee' },
        { key: 'sql', label: 'SQL', color: '#7c3aed' },
        { key: 'pql', label: 'PQL', color: '#059669' },
        { key: 'sal', label: 'SAL', color: '#d97706' },
        { key: 'customer', label: 'Cliente', color: '#15803d' }
    ];
    container.innerHTML = `<div class="crm-funnel-board">${stages.map(s => {
        const items = appState.leads.filter(l => l.status === s.key);
        return `<div class="crm-funnel-col">
            <div class="crm-funnel-col-header" style="color:${s.color}">
                <span>${s.label}</span>
                <span class="bg-white px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-500">${items.length}</span>
            </div>
            ${items.map(l => `<div class="crm-funnel-item" onclick="window.openLeadModal('${l.id}')">${l.name}</div>`).join('')}
        </div>`;
    }).join('')}</div>`;
}

function renderCRMActivities() {
    const container = document.getElementById('crm-activities');
    if (!container) return;
    const acts = (appState.crmActivities || []).slice(0, 6);
    if (acts.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-300 text-center italic font-bold">Nenhuma atividade ainda.</p>';
        return;
    }
    container.innerHTML = acts.map(a => `
        <div class="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
            <span class="text-slate-300 text-lg">·</span>
            <div>
                <p class="text-xs font-bold text-slate-700">${a.text}</p>
                <p class="text-[10px] text-slate-400 font-medium">${moment(a.timestamp).format('DD/MM [às] HH:mm')}</p>
            </div>
        </div>`).join('');
}

function crmAddActivity(text) {
    if (!appState.crmActivities) appState.crmActivities = [];
    appState.crmActivities.unshift({ id: Date.now(), text, timestamp: new Date().toISOString() });
    if (appState.crmActivities.length > 20) appState.crmActivities = appState.crmActivities.slice(0, 20);
}

// Integração 3 — Autocomplete no campo client-name da Agenda
function initCRMAutocomplete() {
    const input = document.getElementById('client-name');
    if (!input) return;
    let box = document.getElementById('crm-autocomplete-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'crm-autocomplete-box';
        box.className = 'crm-autocomplete hidden';
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(box);
    }
    input.addEventListener('input', () => {
        const val = input.value.trim().toLowerCase();
        if (!val || val.length < 2) { box.classList.add('hidden'); return; }
        const matches = appState.leads.filter(l => l.name.toLowerCase().includes(val)).slice(0, 6);
        if (matches.length === 0) { box.classList.add('hidden'); return; }
        box.innerHTML = matches.map(l => `
            <div class="crm-autocomplete-item" onmousedown="event.preventDefault(); window.selectLeadAutocomplete('${l.id}')">
                <span>${l.name}</span>
                <span class="crm-badge crm-badge-${l.status}">${crmStatusLabels[l.status]}</span>
            </div>`).join('');
        box.classList.remove('hidden');
    });
    input.addEventListener('blur', () => setTimeout(() => box.classList.add('hidden'), 200));
}

window.selectLeadAutocomplete = function(leadId) {
    const lead = appState.leads.find(l => l.id === leadId);
    if (!lead) return;
    document.getElementById('client-name').value = lead.name;
    document.getElementById('client-type').value = lead.type || 'partner';
    document.getElementById('crm-autocomplete-box')?.classList.add('hidden');
};

// =========================================================================

// =========================================================================
// CRM PICKER — buscar lead para agendar
// =========================================================================

window.openCRMPicker = function() {
    document.getElementById('crm-picker-search').value = '';
    window.renderCRMPicker();
    crmPickerModal.show();
};

window.renderCRMPicker = function() {
    const search = (document.getElementById('crm-picker-search')?.value || '').toLowerCase();
    const list = document.getElementById('crm-picker-list');
    if (!list) return;

    const leads = appState.leads
        .filter(l => !search || l.name.toLowerCase().includes(search))
        .sort((a, b) => b.score - a.score); // mais pontuados primeiro

    if (leads.length === 0) {
        list.innerHTML = '<p class="text-center text-slate-300 text-xs font-bold italic py-8">Nenhum lead encontrado.</p>';
        return;
    }

    list.innerHTML = leads.map(l => {
        const next = getNextAppointment(l.name);
        const nextTxt = next ? `📅 ${next.format('DD/MM [às] HH:mm')}` : 'Sem agendamento';
        const scoreColor = l.score >= 70 ? 'text-emerald-600' : l.score >= 40 ? 'text-amber-500' : 'text-slate-400';
        return `
        <div onclick="window.selectLeadFromPicker('${l.id}')"
            class="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all group">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    ${l.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p class="text-sm font-black text-slate-800">${l.name}</p>
                    <p class="text-[10px] text-slate-400 font-medium">${nextTxt}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <span class="crm-badge crm-badge-${l.status}">${crmStatusLabels[l.status]}</span>
                <span class="text-xs font-black ${scoreColor}">${l.score}pts</span>
            </div>
        </div>`;
    }).join('');
};

window.selectLeadFromPicker = function(leadId) {
    const lead = appState.leads.find(l => l.id === leadId);
    if (!lead) return;

    // Preencher campos do modal de agendamento
    document.getElementById('client-name').value = lead.name;
    document.getElementById('client-type').value = lead.type || 'partner';

    // Mostrar info do lead selecionado
    const info = document.getElementById('crm-lead-selected');
    const nameEl = document.getElementById('crm-lead-selected-name');
    const badgeEl = document.getElementById('crm-lead-selected-badge');
    const scoreEl = document.getElementById('crm-lead-selected-score');
    if (info && nameEl && badgeEl && scoreEl) {
        nameEl.innerText = lead.name;
        badgeEl.className = `crm-badge crm-badge-${lead.status} ml-2`;
        badgeEl.innerText = crmStatusLabels[lead.status];
        scoreEl.innerText = `Score: ${lead.score}pts`;
        info.classList.remove('hidden');
    }

    crmPickerModal.hide();
    checkSlotConflict();
    window.showToast(`${lead.name} selecionado do CRM`);
};

// Esconder info do lead se o nome for apagado manualmente
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('client-name')?.addEventListener('input', (e) => {
        if (!e.target.value.trim()) {
            document.getElementById('crm-lead-selected')?.classList.add('hidden');
        }
    });
});

// =========================================================================
// FOCO — Origem do Contexto (Manual / CRM / Agenda)
// =========================================================================

let _itemOrigem = 'manual';

window.setItemOrigem = function(origem) {
    _itemOrigem = origem;

    // Atualizar visual dos botões
    ['manual','crm','agenda'].forEach(o => {
        const btn = document.getElementById(`origem-${o}`);
        if (!btn) return;
        const active = o === origem;
        btn.className = `origem-btn flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
            active
            ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-indigo-300'
        }`;
    });

    const buscaContainer = document.getElementById('itemBuscaContainer');
    const buscaInput = document.getElementById('itemBuscaInput');
    const modalInput = document.getElementById('modalInput');

    if (origem === 'manual') {
        buscaContainer.classList.add('hidden');
        modalInput.value = '';
        modalInput.focus();
    } else {
        buscaContainer.classList.remove('hidden');
        buscaInput.value = '';
        buscaInput.placeholder = origem === 'crm' ? 'Buscar lead no CRM...' : 'Buscar cliente na Agenda...';
        buscaInput.focus();
        window.renderItemBusca();
    }
};

window.renderItemBusca = function() {
    const lista = document.getElementById('itemBuscaLista');
    const busca = (document.getElementById('itemBuscaInput')?.value || '').toLowerCase();
    if (!lista) return;

    let items = [];

    if (_itemOrigem === 'crm') {
        // Leads do CRM — excluir os que já existem no Monitor
        const jaNoFoco = Object.values(appState.listas).flat().map(x => x?.nome?.toLowerCase());
        items = appState.leads
            .filter(l => !jaNoFoco.includes(l.name.toLowerCase()))
            .filter(l => !busca || l.name.toLowerCase().includes(busca))
            .sort((a,b) => b.score - a.score)
            .map(l => ({
                label: l.name,
                sub: `${crmStatusLabels[l.status]} · Score ${l.score}`,
                badge: l.status,
                tipo: mapCRMTipoToMonitor(l),
                fase: crmStatusMap[l.status] || 'prospec'
            }));
    } else {
        // Clientes da Agenda — únicos, excluindo os que já estão no Monitor
        const jaNoFoco = Object.values(appState.listas).flat().map(x => x?.nome?.toLowerCase());
        const nomes = [...new Set(appState.clients.map(c => c.name.trim()))];
        items = nomes
            .filter(n => !jaNoFoco.includes(n.toLowerCase()))
            .filter(n => !busca || n.toLowerCase().includes(busca))
            .map(n => {
                const c = appState.clients.find(x => x.name.trim() === n);
                const next = getNextAppointment(n);
                return {
                    label: n,
                    sub: next ? `📅 ${next.format('DD/MM [às] HH:mm')}` : 'Sem próx. agendamento',
                    tipo: c?.type === 'multiplier' ? 'Parceria' : c?.type === 'reserve' ? 'Comunidade' : 'Assessoria',
                    fase: 'gestao'
                };
            });
    }

    if (items.length === 0) {
        lista.innerHTML = `<p class="text-center text-slate-300 text-xs font-bold italic py-4">${busca ? 'Nenhum resultado.' : 'Todos já estão no Foco.'}</p>`;
        return;
    }

    lista.innerHTML = items.map(item => `
        <div onclick="window.selectItemOrigem('${item.label.replace(/'/g,"\\'")}', '${item.tipo}', '${item.fase}')"
            class="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-100 bg-white hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all group">
            <div>
                <p class="text-xs font-black text-slate-800 group-hover:text-indigo-700">${item.label}</p>
                <p class="text-[10px] text-slate-400 font-medium">${item.sub}</p>
            </div>
            <span class="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">${item.tipo}</span>
        </div>`).join('');
};

window.selectItemOrigem = function(nome, tipo, fase) {
    // Preencher campos do modal
    document.getElementById('modalInput').value = nome;
    document.getElementById('modalTypeSelect').value = tipo;
    window.setNewItemTarget(fase);

    // Esconder busca e voltar visual para manual
    document.getElementById('itemBuscaContainer').classList.add('hidden');
    ['manual','crm','agenda'].forEach(o => {
        const btn = document.getElementById(`origem-${o}`);
        if (btn) btn.className = `origem-btn flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
            o === 'manual' ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-500'
        }`;
    });
    _itemOrigem = 'manual';
};

function mapCRMTipoToMonitor(lead) {
    // Mapear tipo do lead CRM para tipo de pilar do Monitor
    if (lead.type === 'multiplier') return 'Parceria';
    if (lead.type === 'reserve')    return 'Comunidade';
    // Para parceiro, usar o status para inferir o tipo de serviço
    const statusToTipo = { lead: 'Pipeline', mql: 'Pipeline', sql: 'Consultoria', pql: 'Mentoria', sal: 'Assessoria', customer: 'Assessoria' };
    return statusToTipo[lead.status] || 'Assessoria';
}

// Esconder seletor de origem quando modal está em modo edição
const _origOpenItemModal = window.openItemModal;
window.openItemModal = function(mode) {
    const selector = document.getElementById('itemOrigemSelector');
    const busca = document.getElementById('itemBuscaContainer');
    if (selector) selector.classList.toggle('hidden', mode === 'edit');
    if (busca) busca.classList.add('hidden');
    _itemOrigem = 'manual';
    // Resetar botões de origem
    window.setItemOrigem('manual');
    _origOpenItemModal(mode);
};

// =========================================================================
// CONTEXTO PICKER — dropdown visual do Foco
// =========================================================================

let contextoPicker;

function initContextoPicker() {
    const el = document.getElementById('contextoPicker');
    if (el) contextoPicker = new bootstrap.Modal(el);
}

window.openContextoPicker = function() {
    document.getElementById('contextoPicker-search').value = '';
    // Sempre abre no Ecossistema — forçar via atributo no elemento
    const listEl = document.getElementById('contextoPicker-list');
    if (listEl) listEl.dataset.forceTab = 'todos';
    window.renderContextoPicker();
    contextoPicker?.show();
    showContextoHint(false);
};

window.renderContextoPicker = function() {
    const list = document.getElementById('contextoPicker-list');
    const busca = (document.getElementById('contextoPicker-search')?.value || '').toLowerCase();
    if (!list) return;

    // Sempre usar 'todos' no picker — independente da aba ativa
    const tab = list.dataset.forceTab || 'todos';
    list.dataset.forceTab = 'todos'; // manter para chamadas via oninput

    const faseLabels = { prospec: 'Prospecção', ativacao: 'Ativação', implem: 'Implementação', gestao: 'Gestão' };
    const faseIcons  = { prospec: '🔍', ativacao: '⚡', implem: '⚙️', gestao: '🏆' };
    const statusColors = { 'Ativa': 'text-emerald-600', 'Stand by': 'text-amber-500', 'Suspensa': 'text-slate-400', 'Cancelada': 'text-rose-500' };
    const statusIco = { 'Ativa': '🟢', 'Stand by': '🟡', 'Suspensa': '⚪', 'Cancelada': '🔴' };
    const currentVal = document.getElementById('selectComunidade')?.value;

    function itemCard(item) {
        const isSelected = currentVal === item.nome;
        const safeNome = item.nome.replace(/'/g, "\\'");
        return `
        <div onclick="window.selectContexto('${safeNome}'); contextoPicker?.hide();"
            class="flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all group
            ${isSelected ? 'bg-indigo-50 border-2 border-indigo-400' : 'border border-slate-100 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'}">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl ${isSelected ? 'bg-indigo-600' : 'bg-slate-100 group-hover:bg-indigo-100'} flex items-center justify-center text-sm font-black ${isSelected ? 'text-white' : 'text-slate-500'} transition-all shrink-0">
                    ${item.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p class="text-xs font-black text-slate-800">${item.nome}</p>
                    <p class="text-[10px] text-slate-400 font-medium">${item.tipo} · ${faseLabels[item.fase] || item.fase}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <span class="text-[10px] font-black ${statusColors[item.status] || 'text-slate-400'}">${statusIco[item.status] || ''} ${item.status}</span>
                ${isSelected ? '<i class="bi bi-check-circle-fill text-indigo-600 ml-1"></i>' : ''}
            </div>
        </div>`;
    }

    // Sempre Ecossistema — todos agrupados por fase
    let html = '';
    let totalVisible = 0;
    ['prospec','ativacao','implem','gestao'].forEach(k => {
        const items = (appState.listas[k] || [])
            .filter(i => i && !i.arquivada)
            .filter(i => !busca || i.nome.toLowerCase().includes(busca))
            .map(i => ({...i, fase: k}));
        if (items.length === 0) return;
        totalVisible += items.length;
        html += `<div class="mb-3">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1.5 flex items-center gap-1">
                <span>${faseIcons[k]}</span> ${faseLabels[k]}
                <span class="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-lg ml-1">${items.length}</span>
            </p>
            <div class="space-y-1">${items.map(itemCard).join('')}</div>
        </div>`;
    });

    list.innerHTML = totalVisible === 0
        ? '<div class="py-8 text-center text-slate-300 font-bold italic text-xs">Nenhum contexto encontrado.</div>'
        : html;
};



window.selectContexto = function(nome) {
    // 1 — Encontrar a fase correta
    let faseDoContexto = null;
    for (const k in appState.listas) {
        if (appState.listas[k].some(x => x && x.nome === nome)) {
            faseDoContexto = k;
            break;
        }
    }

    // 2 — Navegar para a fase (usa switchTab completo para popular o dropdown corretamente)
    if (faseDoContexto) {
        // Chamar switchTab mas sem limpar o valor que vamos setar logo depois
        appState.currentFocusTab = faseDoContexto;
        document.querySelectorAll('.tab-btn').forEach(b => {
            const targetId = `tab${faseDoContexto.charAt(0).toUpperCase() + faseDoContexto.slice(1)}`;
            b.classList.toggle('active', b.id === targetId);
        });
        // Popular o dropdown com os itens da fase correta
        const sel = document.getElementById('selectComunidade');
        if (sel) {
            const items = appState.listas[faseDoContexto].filter(i => i && !i.arquivada);
            sel.innerHTML = '<option value="null">Contexto de Trabalho...</option>';
            items.forEach(i => {
                const opt = new Option(`${statusIcons[i.status]} [${i.tipo}] ${i.nome}`, i.nome);
                sel.appendChild(opt);
            });
        }
    }

    // 3 — Setar o valor no dropdown e disparar a atualização
    const sel = document.getElementById('selectComunidade');
    if (sel) {
        sel.value = nome;
        window.onProjectSelectionChange();
    }

    // 4 — Buscar dados para mostrar no botão visual
    const item = Object.values(appState.listas).flat().find(x => x && x.nome === nome);
    const statusIco2 = { 'Ativa': '🟢', 'Stand by': '🟡', 'Suspensa': '⚪', 'Cancelada': '🔴' };
    const ico = statusIco2[item?.status] || '🔹';
    const tipo = item?.tipo || '';

    const label = document.getElementById('contextoPickerLabel');
    const btn = document.getElementById('contextoPickerBtn');
    if (label) label.innerHTML = `
        <span class="font-black text-slate-800">${nome}</span>
        <span class="ml-2 text-[10px] font-bold text-slate-400">${ico} ${item?.status || ''}</span>
        <span class="ml-1 text-[9px] font-bold text-slate-300 uppercase tracking-wider">· ${tipo}</span>`;
    if (btn) {
        btn.classList.remove('border-slate-200', 'animate-pulse');
        btn.classList.add('border-indigo-400');
    }
    showContextoHint(false);
    saveState();
};


function showContextoHint(show) {
    const hint = document.getElementById('contextoVazioHint');
    const btn = document.getElementById('contextoPickerBtn');
    const label = document.getElementById('contextoPickerLabel');
    if (!hint || !btn) return;
    if (show) {
        hint.classList.remove('hidden');
        btn.classList.add('border-indigo-400', 'animate-pulse');
        btn.classList.remove('border-slate-200');
        if (label) label.innerHTML = '<span class="text-indigo-500">🎯 Toque para escolher o foco</span>';
    } else {
        hint.classList.add('hidden');
        btn.classList.remove('animate-pulse');
    }
}

// Sobrescrever switchTab para mostrar hint quando não há contexto
const _origSwitchTab = window.switchTab;
window.switchTab = function(tab) {
    _origSwitchTab(tab);
    // Resetar label do botão visual
    const label = document.getElementById('contextoPickerLabel');
    const btn = document.getElementById('contextoPickerBtn');
    if (label) label.innerHTML = '<span class="text-indigo-500">🎯 Toque para escolher o foco</span>';
    if (btn) btn.classList.add('border-indigo-400', 'animate-pulse');
    setTimeout(() => showContextoHint(true), 100);
};

// Também atualizar o label quando vem do loadState

// =========================================================================
// AÇÕES — Ferramentas integradas
// =========================================================================

const ferramentas = {
    'business-plan': {
        url: 'https://fnwdoc.github.io/webapp_esteira_business_Plan/',
        titulo: 'Esteira Business Plan',
        paramContexto: 'cliente'
    },
    'esteira-digital': {
        url: 'https://fnwdoc.github.io/webapp_esteira_digital/',
        titulo: 'Construtor de Receita Previsível',
        paramContexto: 'cliente'
    }
};

window.abrirFerramenta = function(id, novaJanela = false) {
    const ferramenta = ferramentas[id];
    if (!ferramenta) return;

    // Pegar contexto ativo do Foco
    const contextoAtivo = document.getElementById('selectComunidade')?.value;
    const nomeContexto = (contextoAtivo && contextoAtivo !== 'null') ? contextoAtivo : null;

    // Montar URL com parâmetro de contexto se disponível
    let url = ferramenta.url;
    if (nomeContexto) {
        url += `?${ferramenta.paramContexto}=${encodeURIComponent(nomeContexto)}`;
    }

    if (novaJanela) {
        window.openPopup(url);
        return;
    }

    // Abrir no drawer lateral
    window.openWebPreview(url);
    document.getElementById('auxWindowTitle').innerText = ferramenta.titulo;
    if (nomeContexto) {
        window.showToast(`Abrindo ${ferramenta.titulo} para: ${nomeContexto}`);
    } else {
        window.showToast(`Abrindo ${ferramenta.titulo}`);
    }
};

// Atualizar barra de contexto ativo na aba Ações
function updateAcoesContexto() {
    const el = document.getElementById('acoes-contexto-nome');
    if (!el) return;
    const contextoAtivo = document.getElementById('selectComunidade')?.value;
    if (contextoAtivo && contextoAtivo !== 'null') {
        const item = Object.values(appState.listas).flat().find(x => x && x.nome === contextoAtivo);
        const statusIco2 = { 'Ativa': '🟢', 'Stand by': '🟡', 'Suspensa': '⚪', 'Cancelada': '🔴' };
        el.innerHTML = `${contextoAtivo} <span class="text-[10px] font-bold text-slate-400 ml-2">${statusIco2[item?.status] || ''} ${item?.status || ''} · ${item?.tipo || ''}</span>`;
    } else {
        el.innerText = '— Nenhum selecionado —';
    }
}

// Sobrescrever switchView para atualizar contexto ao entrar em Ações
const _origSwitchView = window.switchView;
window.switchView = function(view) {
    _origSwitchView(view);
    if (view === 'acoes') updateAcoesContexto();
};

// Atualizar também quando contexto muda no Foco
const _origOnProjectSelectionChange = window.onProjectSelectionChange;
window.onProjectSelectionChange = function() {
    _origOnProjectSelectionChange();
    updateAcoesContexto();
};

// =========================================================================
// AÇÕES — Tab switcher
// =========================================================================

window.switchAcaoTab = function(tab) {
    // mantido para compatibilidade
};

window.acoesAbrirFerramenta = function(tool) {
    // Esconder todos os painéis e welcome
    ['acoes-welcome','acoes-painel-bp','acoes-painel-esteira','acoes-painel-assistente'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
    });

    // Desativar todos os itens do menu
    document.querySelectorAll('.acoes-menu-item').forEach(el => el.classList.remove('active'));

    // Ativar item do menu selecionado
    const menuItem = document.getElementById('acoes-menu-' + tool);
    if (menuItem) menuItem.classList.add('active');

    // Mostrar painel correto
    if (tool === 'bp') {
        const el = document.getElementById('acoes-painel-bp');
        if (el) { el.classList.remove('hidden'); el.style.display = ''; }
        bpRenderAll(); bpFetchRates();
    } else if (tool === 'esteira') {
        const el = document.getElementById('acoes-painel-esteira');
        if (el) { el.classList.remove('hidden'); el.style.display = ''; }
        esteiraRender();
    } else if (tool === 'assistente') {
        const el = document.getElementById('acoes-painel-assistente');
        if (el) { el.classList.remove('hidden'); el.style.display = 'flex'; }
        // Atualizar label de contexto e provedor
        const ctx = document.getElementById('selectComunidade')?.value;
        const label = document.getElementById('assistente-ctx-label');
        if (label) label.textContent = (ctx && ctx !== 'null') ? '📍 ' + ctx : 'Sem contexto selecionado — selecione no Foco';
        const pLabel = document.getElementById('assistente-provider-label');
        if (pLabel && appState.aiConfig?.provider) {
            const names = { groq: 'Groq ⚡', openai: 'OpenAI', anthropic: 'Anthropic' };
            pLabel.textContent = names[appState.aiConfig.provider] || 'IA';
        }
        assistenteRenderMessages();
    }
};

window.acoesFecharPainel = function() {
    ['acoes-painel-bp','acoes-painel-esteira','acoes-painel-assistente'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
    });
    const welcome = document.getElementById('acoes-welcome');
    if (welcome) { welcome.classList.remove('hidden'); welcome.style.display = ''; }
    document.querySelectorAll('.acoes-menu-item').forEach(el => el.classList.remove('active'));
};

window.acoesAbrirExterno = function(url) {
    window.openWebPreview(url);
};

// =========================================================================
// MÓDULO: BUSINESS PLAN
// =========================================================================

// Estado isolado por contexto — salvo no appState.bpData[contexto]
function bpGetState() {
    const ctx = document.getElementById('selectComunidade')?.value || '_global';
    if (!appState.bpData) appState.bpData = {};
    if (!appState.bpData[ctx]) {
        appState.bpData[ctx] = {
            growthPeriodMonths: 18,
            assessorSharePercent: 25,
            specialParticipants: 10,
            portfolio: [
                { id: 'p1', name: 'E-book / Produto Digital', price: 90, capacity: 100, unit: 'vendas' },
                { id: 'p2', name: 'Grupo / Comunidade', price: 356, capacity: 30, unit: 'membros' },
                { id: 'p3', name: 'Mentoria em Grupo', price: 762, capacity: 20, unit: 'participantes' },
                { id: 'p4', name: 'Acompanhamento Individual', price: 1400, capacity: 12, unit: 'clientes' }
            ]
        };
    }
    return appState.bpData[ctx];
}

const bpFmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

window.bpHandleShareChange = function(v) {
    const s = bpGetState(); s.assessorSharePercent = parseFloat(v) || 0;
    bpUpdateCalcs(); saveState();
};

window.bpHandleGrowthPeriod = function(v) {
    const s = bpGetState(); s.growthPeriodMonths = parseInt(v) || 1;
    bpUpdateCalcs(); saveState();
};

window.bpHandleSpecialSession = function() {
    const s = bpGetState();
    s.specialParticipants = parseInt(document.getElementById('bp-special-participants')?.value) || 0;
    bpUpdateCalcs(); saveState();
};

// Handler especial para preço em moeda estrangeira — converte para BRL antes de salvar
window.bpHandlePortfolioInputCurrency = function(id, value) {
    const s = bpGetState();
    const cur = bpRates[s.currency || 'BRL'];
    const item = s.portfolio.find(p => p.id === id);
    if (!item) return;
    const priceInCur = parseFloat(value) || 0;
    // Sempre salvar em BRL internamente
    item.price = cur.label === 'BRL' ? priceInCur : priceInCur * cur.rate;
    // Atualizar receita da linha
    const cell = document.getElementById('bp-res-' + id);
    const isBRL = cur.label === 'BRL';
    const receitaBRL = item.price * item.capacity;
    const receitaCur = isBRL ? receitaBRL : receitaBRL / cur.rate;
    if (cell) cell.textContent = cur.symbol + ' ' + receitaCur.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
    bpUpdateCalcs();
    saveState();
};

window.bpHandlePortfolioInput = function(id, field, value) {
    const s = bpGetState();
    const item = s.portfolio.find(p => p.id === id);
    if (!item) return;
    item[field] = (field === 'price' || field === 'capacity') ? (parseFloat(value) || 0) : value;
    const cell = document.getElementById(`bp-res-${id}`);
    if (cell) cell.textContent = bpFmt(item.price * item.capacity);
    bpUpdateCalcs(); saveState();
};

window.bpAddProduct = function() {
    const s = bpGetState();
    const id = 'p' + Date.now();
    s.portfolio.push({ id, name: 'Novo Produto', price: 0, capacity: 0, unit: 'unidades' });
    bpRenderPortfolio(); bpUpdateCalcs(); saveState();
};

window.bpRemoveProduct = function(id) {
    const s = bpGetState();
    s.portfolio = s.portfolio.filter(p => p.id !== id);
    bpRenderPortfolio(); bpUpdateCalcs(); saveState();
};

window.bpShowSection = function(id) {
    ['portfolio','growth'].forEach(s => {
        document.getElementById(`bp-${s}-section`)?.classList.toggle('hidden', s !== id);
        const btn = document.getElementById(`bp-subtab-${s}`);
        if (btn) btn.classList.toggle('active', s === id);
    });
    if (id === 'growth') bpRenderProjection();
};

function bpRenderPortfolio() {
    const s = bpGetState();
    const cur = bpRates[s.currency || 'BRL'];
    const sym = cur ? cur.symbol : 'R$';
    const isBRL = !cur || cur.label === 'BRL';
    const tbody = document.getElementById('bp-portfolio-body');
    if (!tbody) return;

    // Atualizar header da coluna Preço com símbolo da moeda
    const thPreco = document.querySelector('#bp-portfolio-body')?.closest('table')?.querySelector('thead th:nth-child(2)');
    if (thPreco) thPreco.textContent = 'Preço (' + sym + ')';

    tbody.innerHTML = s.portfolio.map((item, idx) => {
        // preço salvo sempre em BRL internamente
        // valor na moeda estrangeira = price / rate
        const priceInCur = isBRL ? item.price : (item.price / cur.rate);
        const priceDisplay = priceInCur.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
        const brlEquiv = item.price.toLocaleString('pt-BR', {minimumFractionDigits:2});
        const receitaBRL = item.price * item.capacity;
        const receitaCur = isBRL ? receitaBRL : (receitaBRL / cur.rate);
        const receitaDisplay = receitaCur.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
        const receitaBRLDisplay = receitaBRL.toLocaleString('pt-BR', {minimumFractionDigits:2});
        return `
        <tr style="background:${idx % 2 === 0 ? 'white' : '#f9fafb'}">
            <td><input type="text" value="${item.name}" oninput="window.bpHandlePortfolioInput('${item.id}','name',this.value)"
                class="bp-input text-indigo-800 font-bold"></td>
            <td>
                <div style="display:flex;align-items:center;gap:4px">
                    <span style="font-size:12px;font-weight:800;color:${isBRL ? '#3b82f6' : '#059669'};min-width:16px">${sym}</span>
                    <input type="number" value="${priceDisplay.replace('.','').replace(',','.')}"
                        oninput="window.bpHandlePortfolioInputCurrency('${item.id}', this.value)"
                        class="bp-input text-center" style="flex:1">
                </div>
                ${!isBRL ? `<div style="font-size:10px;color:#94a3b8;text-align:center;margin-top:2px">≈ R$ ${brlEquiv}</div>` : ''}
            </td>
            <td><input type="number" value="${item.capacity}" oninput="window.bpHandlePortfolioInput('${item.id}','capacity',this.value)"
                class="bp-input text-center"></td>
            <td><input type="text" value="${item.unit}" oninput="window.bpHandlePortfolioInput('${item.id}','unit',this.value)"
                class="bp-input text-center italic"></td>
            <td style="text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:8px">
                <div style="text-align:right">
                    <div id="bp-res-${item.id}" style="font-weight:800;color:#3b82f6">${sym} ${receitaDisplay}</div>
                    ${!isBRL ? `<div style="font-size:10px;color:#94a3b8">≈ R$ ${receitaBRLDisplay}</div>` : ''}
                </div>
                <button onclick="window.bpRemoveProduct('${item.id}')"
                    style="background:#fee2e2;color:#ef4444;border:none;border-radius:8px;padding:4px 8px;font-size:11px;cursor:pointer;font-weight:800">✕</button>
            </td>
        </tr>`;
    }).join('');
}

function bpUpdateCalcs() {
    const s = bpGetState();
    let total = 0;
    s.portfolio.forEach(p => { total += p.price * p.capacity; });
    const el = (id) => document.getElementById(id);
    if (el('bp-max-revenue')) el('bp-max-revenue').textContent = bpFmt(total);
    if (el('bp-total-footer')) el('bp-total-footer').textContent = bpFmt(total);
    if (el('bp-monthly-growth')) el('bp-monthly-growth').textContent = bpFmt(total / s.growthPeriodMonths);

    // Sessão especial (usa o produto de mentoria/grupo se existir)
    const groupProduct = s.portfolio.find(p => p.id === 'p3') || s.portfolio[0];
    if (groupProduct) {
        const gross = groupProduct.price * s.specialParticipants;
        const guest = gross * (s.assessorSharePercent / 100);
        const detEl = el('bp-special-details');
        if (detEl) detEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding-bottom:4px">
                <span>Bruto da Sessão:</span><b>${bpFmt(gross)}</b></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e5e7eb">
                <span>Comissão (${s.assessorSharePercent}%):</span><b>${bpFmt(guest)}</b></div>
            <div style="display:flex;justify-content:space-between;padding-top:4px;font-weight:800;color:#1e3a8a">
                <span>Líquido:</span><b>${bpFmt(gross - guest)}</b></div>`;
    }
}

function bpRenderProjection() {
    const s = bpGetState();
    const head = document.getElementById('bp-proj-head');
    const body = document.getElementById('bp-proj-body');
    if (!head || !body) return;
    head.innerHTML = `<tr><th>Mês</th>${s.portfolio.map(p => `<th style="text-align:center">${p.name}</th>`).join('')}<th style="text-align:right">Total</th></tr>`;
    body.innerHTML = '';
    for (let m = 1; m <= Math.min(s.growthPeriodMonths, 24); m++) {
        let total = 0;
        let row = `<td style="font-weight:800;color:#9ca3af">#${m}</td>`;
        s.portfolio.forEach(p => {
            const vol = (p.capacity / s.growthPeriodMonths) * m;
            total += vol * p.price;
            row += `<td style="text-align:center;color:#6b7280;font-style:italic">${Math.floor(vol)}</td>`;
        });
        row += `<td style="text-align:right;font-weight:800;color:#3b82f6;background:rgba(59,130,246,0.05)">${bpFmt(total)}</td>`;
        const tr = document.createElement('tr');
        tr.innerHTML = row;
        body.appendChild(tr);
    }
}

function bpRenderAll() {
    const s = bpGetState();
    const shareEl = document.getElementById('bp-assessor-share');
    const periodEl = document.getElementById('bp-growth-period');
    const partEl = document.getElementById('bp-special-participants');
    if (shareEl) shareEl.value = s.assessorSharePercent;
    if (periodEl) periodEl.value = s.growthPeriodMonths;
    if (partEl) partEl.value = s.specialParticipants;
    // Restaurar moeda salva
    if (s.currency) window.bpChangeCurrency(s.currency);
    bpRenderPortfolio();
    bpUpdateCalcs();
}

// =========================================================================
// MÓDULO: ESTEIRA DIGITAL
// =========================================================================

let esteiraModal, esteiraDetailModal2, esteiraEditingId = null;

function esteiraGetState() {
    const ctx = document.getElementById('selectComunidade')?.value || '_global';
    if (!appState.esteiraData) appState.esteiraData = {};
    if (!appState.esteiraData[ctx]) appState.esteiraData[ctx] = { products: [] };
    return appState.esteiraData[ctx];
}

function esteiraGetCol(price) {
    if (price < 500) return 'esteira-lti';
    if (price < 3000) return 'esteira-mti';
    if (price < 25000) return 'esteira-hti';
    return 'esteira-dun';
}

function esteiraFmt(valueInBRL) {
    const s = bpGetState();
    const cur = bpRates[s.currency || 'BRL'];
    if (!cur || cur.label === 'BRL') {
        return 'R$ ' + parseFloat(valueInBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    const converted = valueInBRL / cur.rate;
    const fmtConv = converted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtBRL  = parseFloat(valueInBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    return cur.symbol + ' ' + fmtConv + ' (R$ ' + fmtBRL + ')';
}

function esteiraRender() {
    const s = esteiraGetState();
    ['esteira-lti','esteira-mti','esteira-hti','esteira-dun'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    s.products.forEach(p => {
        const col = p.columnId || esteiraGetCol(p.price);
        const container = document.getElementById(col);
        if (!container) return;
        const card = document.createElement('div');
        card.className = `esteira-product-card${p.isMapaTesouro ? ' mapa-tesouro' : ''}`;
        card.dataset.id = p.id;
        const nextP = p.proximaVendaId ? s.products.find(x => x.id === p.proximaVendaId) : null;
        card.innerHTML = `
            ${p.isMapaTesouro ? '<div style="font-size:10px;font-weight:800;color:#a67c00;margin-bottom:4px">🗝️ Mapa do Tesouro</div>' : ''}
            <h6>${p.title}</h6>
            <div class="ep-price">${esteiraFmt(p.price)}</div>
            ${nextP ? `<div class="ep-proxima">→ ${nextP.title}</div>` : ''}`;
        card.addEventListener('click', () => esteiraOpenDetail(p.id));
        container.appendChild(card);
    });
    esteiraUpdateDashboard();
    esteiraInitSortable();
}

function esteiraUpdateDashboard() {
    const s = esteiraGetState();
    const n = s.products.length;
    const c = s.products.filter(p => p.proximaVendaId).length;
    const statusEl = document.getElementById('esteira-status');
    const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    el('esteira-count-produtos', n);
    el('esteira-count-conexoes', c);
    if (statusEl) {
        if (n === 0) { statusEl.textContent = 'Caótico'; statusEl.className = 'esteira-status-caotico'; }
        else if (c < n / 2) { statusEl.textContent = 'Em Construção'; statusEl.className = 'esteira-status-construindo'; }
        else { statusEl.textContent = 'Previsível'; statusEl.className = 'esteira-status-previsivel'; }
    }
}

function esteiraInitSortable() {
    if (typeof Sortable === 'undefined') return;
    ['esteira-lti','esteira-mti','esteira-hti','esteira-dun'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        new Sortable(el, {
            group: 'esteira-produtos', animation: 150,
            onEnd: (evt) => {
                const pid = evt.item.dataset.id;
                const toCol = evt.to.id;
                const s = esteiraGetState();
                const p = s.products.find(x => x.id === pid);
                if (p) { p.columnId = toCol; saveState(); }
            }
        });
    });
}

window.esteiraOpenProductModal = function(id = null) {
    esteiraEditingId = id;
    const s = esteiraGetState();
    const p = id ? s.products.find(x => x.id === id) : null;
    document.getElementById('esteiraModalTitle').textContent = p ? 'Editar Produto' : 'Novo Produto';
    document.getElementById('esteira-product-id').value = p?.id || '';
    document.getElementById('esteira-product-title').value = p?.title || '';
    document.getElementById('esteira-product-price').value = p?.price || '';
    document.getElementById('esteira-product-desc').value = p?.description || '';
    document.getElementById('esteira-product-mapa').checked = p?.isMapaTesouro || false;
    const delBtn = document.getElementById('esteira-delete-btn');
    if (delBtn) delBtn.classList.toggle('hidden', !p);
    esteiraModal?.show();
};

window.esteiraSaveProduct = function() {
    const title = document.getElementById('esteira-product-title').value.trim();
    const price = parseFloat(document.getElementById('esteira-product-price').value) || 0;
    const desc = document.getElementById('esteira-product-desc').value.trim();
    const mapa = document.getElementById('esteira-product-mapa').checked;
    if (!title) return window.showToast('Título é obrigatório.', 'warning');
    const s = esteiraGetState();
    const col = esteiraGetCol(price);
    if (esteiraEditingId) {
        const p = s.products.find(x => x.id === esteiraEditingId);
        if (p) { p.title = title; p.price = price; p.description = desc; p.columnId = col; p.isMapaTesouro = col === 'esteira-lti' ? mapa : false; }
    } else {
        s.products.push({ id: 'ep_' + Date.now(), title, price, description: desc, columnId: col, isMapaTesouro: col === 'esteira-lti' ? mapa : false, proximaVendaId: null });
    }
    esteiraModal?.hide();
    esteiraRender(); saveState();
    window.showToast('Produto salvo!');
};

window.esteiraDeleteProduct = function() {
    if (!esteiraEditingId) return;
    const s = esteiraGetState();
    s.products = s.products.filter(p => p.id !== esteiraEditingId);
    s.products.forEach(p => { if (p.proximaVendaId === esteiraEditingId) p.proximaVendaId = null; });
    esteiraModal?.hide(); esteiraRender(); saveState();
    window.showToast('Produto removido.');
};

function esteiraOpenDetail(id) {
    const s = esteiraGetState();
    const p = s.products.find(x => x.id === id);
    if (!p) return;
    esteiraEditingId = id;
    document.getElementById('esteiraDetailTitle').textContent = p.title;
    document.getElementById('esteiraDetailPrice').textContent = esteiraFmt(p.price);
    document.getElementById('esteiraDetailDesc').textContent = p.description || '';
    const sel = document.getElementById('esteira-proxima-venda');
    sel.innerHTML = '<option value="">Nenhuma (Fim da esteira)</option>';
    s.products.filter(x => x.id !== id).forEach(x => {
        const opt = new Option(`${x.title} (${esteiraFmt(x.price)})`, x.id);
        if (x.id === p.proximaVendaId) opt.selected = true;
        sel.appendChild(opt);
    });
    esteiraDetailModal2?.show();
}

window.esteiraSetProximaVenda = function(val) {
    const s = esteiraGetState();
    const p = s.products.find(x => x.id === esteiraEditingId);
    if (p) { p.proximaVendaId = val || null; esteiraRender(); saveState(); }
};

window.esteiraEditFromDetail = function() {
    window.esteiraOpenProductModal(esteiraEditingId);
};

window.esteiraExport = function() {
    const ctx = document.getElementById('selectComunidade')?.value || 'mapa';
    const s = esteiraGetState();
    const data = { clientName: ctx, products: s.products };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `esteira_${ctx.replace(/\s+/g,'_')}_${moment().format('YYYYMMDD')}.json`;
    a.click();
    window.showToast('Mapa exportado!');
};

window.esteiraImport = function(evt) {
    const file = evt.target?.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.products) {
                const ctx = document.getElementById('selectComunidade')?.value || '_global';
                if (!appState.esteiraData) appState.esteiraData = {};
                data.products.forEach(p => { if (!p.columnId) p.columnId = esteiraGetCol(p.price); });
                appState.esteiraData[ctx] = { products: data.products };
                esteiraRender(); saveState();
                window.showToast('Mapa importado!');
            }
        } catch(e) { window.showToast('Arquivo inválido.', 'warning'); }
    };
    reader.readAsText(file);
    evt.target.value = null;
};

// Inicializar modais das ferramentas
function initAcoesModals() {
    const em = document.getElementById('esteiraProductModal');
    const edm = document.getElementById('esteiraDetailModal');
    if (em) esteiraModal = new bootstrap.Modal(em);
    if (edm) esteiraDetailModal2 = new bootstrap.Modal(edm);
}

// =========================================================================
// AÇÕES — Sincronização bidirecional BP ↔ Esteira
// =========================================================================

window.bpSendToEsteira = function() {
    const bpS = bpGetState();
    const estS = esteiraGetState();

    if (bpS.portfolio.length === 0) {
        return window.showToast('Nenhum produto no portfólio para enviar.', 'warning');
    }

    // Verificar se já tem produtos na Esteira
    let acao = 'substituir';
    if (estS.products.length > 0) {
        const resposta = confirm(
            `A Esteira já tem ${estS.products.length} produto(s).\n\n` +
            `OK = Mesclar (adicionar sem apagar)\n` +
            `Cancelar = Substituir tudo`
        );
        acao = resposta ? 'mesclar' : 'substituir';
    }

    // Converter produtos do BP para formato da Esteira
    const novos = bpS.portfolio.map(p => ({
        id: 'ep_bp_' + p.id + '_' + Date.now(),
        title: p.name,
        price: p.price,
        description: `${p.capacity} ${p.unit} · Receita máx: ${bpFmt(p.price * p.capacity)}`,
        columnId: esteiraGetCol(p.price),
        isMapaTesouro: false,
        proximaVendaId: null
    }));

    if (acao === 'substituir') {
        estS.products = novos;
    } else {
        // Mesclar — evitar duplicatas pelo nome
        const nomesExistentes = estS.products.map(p => p.title.toLowerCase());
        const paraMesclar = novos.filter(p => !nomesExistentes.includes(p.title.toLowerCase()));
        estS.products.push(...paraMesclar);
        const ignorados = novos.length - paraMesclar.length;
        if (ignorados > 0) window.showToast(`${paraMesclar.length} adicionados, ${ignorados} já existiam.`);
    }

    saveState();

    // Ir para a aba Esteira para ver o resultado
    window.switchAcaoTab('esteira');
    window.showToast(`${bpS.portfolio.length} produtos enviados para a Esteira! ✓`);
};

window.esteiraImportFromBP = function() {
    const bpS = bpGetState();
    const estS = esteiraGetState();

    if (bpS.portfolio.length === 0) {
        return window.showToast('Business Plan não tem produtos ainda.', 'warning');
    }

    // Verificar se já tem produtos na Esteira
    let acao = 'substituir';
    if (estS.products.length > 0) {
        const resposta = confirm(
            `A Esteira já tem ${estS.products.length} produto(s).\n\n` +
            `OK = Mesclar (adicionar sem apagar)\n` +
            `Cancelar = Substituir tudo`
        );
        acao = resposta ? 'mesclar' : 'substituir';
    }

    const novos = bpS.portfolio.map(p => ({
        id: 'ep_bp_' + p.id + '_' + Date.now(),
        title: p.name,
        price: p.price,
        description: `${p.capacity} ${p.unit}`,
        columnId: esteiraGetCol(p.price),
        isMapaTesouro: false,
        proximaVendaId: null
    }));

    if (acao === 'substituir') {
        estS.products = novos;
    } else {
        const nomesExistentes = estS.products.map(p => p.title.toLowerCase());
        const paraMesclar = novos.filter(p => !nomesExistentes.includes(p.title.toLowerCase()));
        estS.products.push(...paraMesclar);
    }

    esteiraRender();
    saveState();
    window.showToast(`Produtos do Business Plan importados para a Esteira! ✓`);
};

// Botão na Esteira para enviar de volta ao BP
window.esteiraSendToBP = function() {
    const estS = esteiraGetState();
    const bpS = bpGetState();

    if (estS.products.length === 0) {
        return window.showToast('Nenhum produto na Esteira para enviar.', 'warning');
    }

    let acao = 'substituir';
    if (bpS.portfolio.length > 0) {
        const resposta = confirm(
            `O Business Plan já tem ${bpS.portfolio.length} produto(s).\n\n` +
            `OK = Mesclar (adicionar sem apagar)\n` +
            `Cancelar = Substituir tudo`
        );
        acao = resposta ? 'mesclar' : 'substituir';
    }

    const novos = estS.products.map((p, i) => ({
        id: 'p_est_' + i + '_' + Date.now(),
        name: p.title,
        price: p.price,
        capacity: 10,
        unit: 'clientes'
    }));

    if (acao === 'substituir') {
        bpS.portfolio = novos;
    } else {
        const nomesExistentes = bpS.portfolio.map(p => p.name.toLowerCase());
        const paraMesclar = novos.filter(p => !nomesExistentes.includes(p.name.toLowerCase()));
        bpS.portfolio.push(...paraMesclar);
    }

    bpRenderAll();
    saveState();
    window.switchAcaoTab('bp');
    window.showToast(`Produtos da Esteira enviados para o Business Plan! ✓`);
};

// =========================================================================
// BUSINESS PLAN — Seletor de moeda
// =========================================================================

// Cotações — iniciam com valores de referência, atualizadas via AwesomeAPI
const bpRates = {
    BRL: { symbol: 'R$', rate: 1,      label: 'BRL', flag: '🇧🇷' },
    USD: { symbol: '$',  rate: 5.2608, label: 'USD', flag: '🇺🇸' },
    EUR: { symbol: '€',  rate: 5.73,   label: 'EUR', flag: '🇪🇺' },
    GBP: { symbol: '£',  rate: 6.62,   label: 'GBP', flag: '🇬🇧' }
};

// Buscar cotações em tempo real via AwesomeAPI (gratuita, sem chave)
async function bpFetchRates() {
    const badge = document.getElementById('bp-rate-badge');
    const indicator = document.getElementById('bp-rates-indicator');
    try {
        if (indicator) { indicator.textContent = '⏳ Buscando cotações...'; indicator.style.color = '#94a3b8'; }
        const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL');
        if (!res.ok) throw new Error('Erro na API');
        const data = await res.json();
        // Atualizar rates com valores reais
        if (data.USDBRL) bpRates.USD.rate = parseFloat(data.USDBRL.bid);
        if (data.EURBRL) bpRates.EUR.rate = parseFloat(data.EURBRL.bid);
        if (data.GBPBRL) bpRates.GBP.rate = parseFloat(data.GBPBRL.bid);
        // Atualizar badge e indicador
        const now = moment().format('HH:mm');
        if (indicator) {
            indicator.textContent = '✅ Cotações atualizadas às ' + now;
            indicator.style.color = '#059669';
        }
        // Re-renderizar com cotações reais
        const s = bpGetState();
        if (s.currency && s.currency !== 'BRL') {
            window.bpChangeCurrency(s.currency);
        }
    } catch(e) {
        if (indicator) {
            indicator.textContent = '⚠️ Cotação de referência (sem conexão)';
            indicator.style.color = '#f59e0b';
        }
    }
}

function bpGetCurrency() {
    const s = bpGetState();
    return bpRates[s.currency || 'BRL'];
}

// Formatar valor na moeda escolhida
function bpFmtCurrency(valueInBRL) {
    const cur = bpGetCurrency();
    if (cur.label === 'BRL') {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueInBRL);
    }
    const converted = valueInBRL / cur.rate;
    return `${cur.symbol} ${converted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Formatar sempre em BRL (para mostrar ao lado)
function bpFmtBRL(valueInBRL) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueInBRL);
}

window.bpChangeCurrency = function(cur) {
    const s = bpGetState();
    s.currency = cur;
    // Sincronizar ambos seletores (topo e rodapé)
    const sel = document.getElementById('bp-currency');
    const selFooter = document.getElementById('bp-currency-footer');
    if (sel) sel.value = cur;
    if (selFooter) selFooter.value = cur;
    // Badge de cotação
    const badge = document.getElementById('bp-rate-badge');
    if (badge) {
        if (cur === 'BRL') {
            badge.classList.add('hidden');
        } else {
            const r = bpRates[cur];
            badge.textContent = '1 ' + r.label + ' = R$ ' + r.rate.toFixed(2) + ' (19/03/26)';
            badge.classList.remove('hidden');
        }
    }
    bpRenderPortfolio(); // atualiza símbolo e conversão no portfólio
    bpUpdateCalcs();
    // Re-renderizar Esteira se visível
    const esteiraModule = document.getElementById('acoes-module-esteira');
    if (esteiraModule && !esteiraModule.classList.contains('hidden')) {
        esteiraRender();
    }
    saveState();
};

// Sobrescrever bpUpdateCalcs para usar a moeda correta
const _origBpUpdateCalcs = bpUpdateCalcs;
bpUpdateCalcs = function() {
    const s = bpGetState();
    let total = 0;
    s.portfolio.forEach(p => { total += p.price * p.capacity; });

    const cur = bpGetCurrency();
    const isBRL = cur.label === 'BRL';

    const el = (id) => document.getElementById(id);

    // Valores principais na moeda escolhida
    if (el('bp-max-revenue'))    el('bp-max-revenue').textContent    = bpFmtCurrency(total);
    if (el('bp-total-footer'))   el('bp-total-footer').textContent   = bpFmtCurrency(total);
    if (el('bp-monthly-growth')) el('bp-monthly-growth').textContent = bpFmtCurrency(total / s.growthPeriodMonths);
    // Rodapé: mostrar equivalente em BRL quando moeda diferente
    const footerBrl = el('bp-total-footer-brl');
    if (footerBrl) {
        if (!isBRL) { footerBrl.textContent = '≈ ' + bpFmtBRL(total) + ' (BRL)'; }
        else { footerBrl.textContent = ''; }
    }

    // Linha secundária em BRL quando moeda diferente
    const maxBrlEl = el('bp-max-revenue-brl');
    const growthBrlEl = el('bp-monthly-growth-brl');
    if (maxBrlEl) {
        if (!isBRL) { maxBrlEl.textContent = `≈ ${bpFmtBRL(total)} (BRL)`; maxBrlEl.classList.remove('hidden'); }
        else maxBrlEl.classList.add('hidden');
    }
    if (growthBrlEl) {
        if (!isBRL) { growthBrlEl.textContent = `≈ ${bpFmtBRL(total / s.growthPeriodMonths)} (BRL)`; growthBrlEl.classList.remove('hidden'); }
        else growthBrlEl.classList.add('hidden');
    }

    // Receita por produto na tabela
    s.portfolio.forEach(p => {
        const cell = el(`bp-res-${p.id}`);
        if (cell) cell.textContent = bpFmtCurrency(p.price * p.capacity);
    });

    // Sessão especial
    const groupProduct = s.portfolio.find(p => p.id === 'p3') || s.portfolio[0];
    if (groupProduct) {
        const gross = groupProduct.price * s.specialParticipants;
        const guest = gross * (s.assessorSharePercent / 100);
        const detEl = el('bp-special-details');
        if (detEl) detEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding-bottom:4px">
                <span>Bruto:</span><b>${bpFmtCurrency(gross)}${!isBRL ? ` <span style="color:#94a3b8;font-size:10px">≈ ${bpFmtBRL(gross)}</span>` : ''}</b></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e5e7eb">
                <span>Comissão (${s.assessorSharePercent}%):</span><b>${bpFmtCurrency(guest)}</b></div>
            <div style="display:flex;justify-content:space-between;padding-top:4px;font-weight:800;color:#1e3a8a">
                <span>Líquido:</span><b>${bpFmtCurrency(gross - guest)}${!isBRL ? ` <span style="color:#94a3b8;font-size:10px">≈ ${bpFmtBRL(gross - guest)}</span>` : ''}</b></div>`;
    }
};


// =========================================================================
// CONFIGURAÇÕES — Integração com IA
// =========================================================================

const aiProviders = {
    groq: {
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        keyLink: 'https://console.groq.com/keys',
        keyLabel: 'Gerar API Key gratuita no Groq →',
        models: [
            { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile (recomendado)' },
            { value: 'llama-3.1-8b-instant',    label: 'llama-3.1-8b-instant (mais rápido)' },
            { value: 'mixtral-8x7b-32768',       label: 'mixtral-8x7b-32768' },
            { value: 'gemma2-9b-it',             label: 'gemma2-9b-it' }
        ]
    },
    openai: {
        name: 'OpenAI',
        url: 'https://api.openai.com/v1/chat/completions',
        keyLink: 'https://platform.openai.com/api-keys',
        keyLabel: 'Gerar API Key na OpenAI →',
        models: [
            { value: 'gpt-4o',       label: 'gpt-4o (recomendado)' },
            { value: 'gpt-4o-mini',  label: 'gpt-4o-mini (mais rápido)' },
            { value: 'gpt-4-turbo',  label: 'gpt-4-turbo' }
        ]
    },
    anthropic: {
        name: 'Anthropic',
        url: 'https://api.anthropic.com/v1/messages',
        keyLink: 'https://console.anthropic.com/settings/keys',
        keyLabel: 'Gerar API Key na Anthropic →',
        models: [
            { value: 'claude-3-5-sonnet-20241022', label: 'claude-3-5-sonnet (recomendado)' },
            { value: 'claude-3-haiku-20240307',    label: 'claude-3-haiku (mais rápido)' }
        ]
    }
};

// Carregar configurações de IA no modal de settings
function loadAISettings() {
    const cfg = appState.aiConfig || { provider: 'groq', key: '', model: 'llama-3.3-70b-versatile' };
    const provSel = document.getElementById('settings-ai-provider');
    const keySel  = document.getElementById('settings-ai-key');
    const modSel  = document.getElementById('settings-ai-model');
    if (provSel) provSel.value = cfg.provider || 'groq';
    if (keySel)  keySel.value  = cfg.key || '';
    if (modSel)  modSel.value  = cfg.model || 'llama-3.3-70b-versatile';
    window.settingsUpdateAIProvider(cfg.provider || 'groq');
}

window.settingsUpdateAIProvider = function(provider) {
    const p = aiProviders[provider];
    if (!p) return;
    // Atualizar link de geração de key
    const link = document.getElementById('settings-ai-link');
    if (link) link.innerHTML = `<a href="${p.keyLink}" target="_blank"
        class="text-[10px] font-black text-indigo-500 hover:text-indigo-700 transition-all">
        <i class="bi bi-box-arrow-up-right me-1"></i>${p.keyLabel}</a>`;
    // Atualizar modelos disponíveis
    const modSel = document.getElementById('settings-ai-model');
    if (modSel) {
        modSel.innerHTML = p.models.map(m => `<option value="${m.value}">${m.label}</option>`).join('');
        // Restaurar modelo salvo se for do mesmo provedor
        const saved = appState.aiConfig;
        if (saved && saved.provider === provider && saved.model) modSel.value = saved.model;
    }
    // Limpar status
    const status = document.getElementById('settings-ai-status');
    if (status) status.classList.add('hidden');
};

window.settingsToggleKeyVisibility = function() {
    const input = document.getElementById('settings-ai-key');
    const eye = document.getElementById('settings-ai-key-eye');
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    if (eye) eye.className = isHidden ? 'bi bi-eye-slash text-lg' : 'bi bi-eye text-lg';
};

window.settingsTestAI = async function() {
    const provider = document.getElementById('settings-ai-provider')?.value || 'groq';
    const key = document.getElementById('settings-ai-key')?.value?.trim();
    const model = document.getElementById('settings-ai-model')?.value;
    const status = document.getElementById('settings-ai-status');
    if (!key) {
        if (status) { status.textContent = '⚠️ Cole sua API Key antes de testar.'; status.className = 'p-3 rounded-2xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200'; status.classList.remove('hidden'); }
        return;
    }
    if (status) { status.textContent = '⏳ Testando conexão...'; status.className = 'p-3 rounded-2xl text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-200'; status.classList.remove('hidden'); }
    try {
        const p = aiProviders[provider];
        const ok = await testAIConnection(provider, key, model);
        if (ok) {
            if (status) { status.textContent = '✅ Conexão bem-sucedida! IA pronta para uso.'; status.className = 'p-3 rounded-2xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'; }
        } else {
            if (status) { status.textContent = '❌ Falha na conexão. Verifique sua API Key.'; status.className = 'p-3 rounded-2xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200'; }
        }
    } catch(e) {
        if (status) { status.textContent = '❌ Erro: ' + e.message; status.className = 'p-3 rounded-2xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200'; }
    }
};

async function testAIConnection(provider, key, model) {
    const p = aiProviders[provider];
    const body = provider === 'anthropic'
        ? { model, max_tokens: 10, messages: [{ role: 'user', content: 'Responda apenas: ok' }] }
        : { model, max_tokens: 10, messages: [{ role: 'user', content: 'Responda apenas: ok' }] };
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
    if (provider === 'anthropic') headers['anthropic-version'] = '2023-06-01';
    const res = await fetch(p.url, { method: 'POST', headers, body: JSON.stringify(body) });
    return res.ok;
}

// Salvar config de IA junto com o resto das settings
function saveAIConfig() {
    const provider = document.getElementById('settings-ai-provider')?.value || 'groq';
    const key      = document.getElementById('settings-ai-key')?.value?.trim() || '';
    const model    = document.getElementById('settings-ai-model')?.value || '';
    if (!appState.aiConfig) appState.aiConfig = {};
    appState.aiConfig = { provider, key, model };
    saveState();
}

// Expor função para chamar de fora — chamada no save-settings existente
window.saveAIConfig = saveAIConfig;

// Função pública para ferramentas de IA chamarem
window.callAI = async function(prompt, systemPrompt = '') {
    const cfg = appState.aiConfig;
    if (!cfg || !cfg.key) throw new Error('Configure sua API Key nas Configurações.');
    const p = aiProviders[cfg.provider || 'groq'];
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const body = { model: cfg.model, max_tokens: 1000, messages };
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key };
    if (cfg.provider === 'anthropic') headers['anthropic-version'] = '2023-06-01';
    const res = await fetch(p.url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('Erro na API de IA: ' + res.status);
    const data = await res.json();
    return cfg.provider === 'anthropic'
        ? data.content?.[0]?.text || ''
        : data.choices?.[0]?.message?.content || '';
};

// =========================================================================
// OPERACIONAL — Assistente GERiAH
// =========================================================================

let assistenteHistory = []; // histórico da conversa

// Montar system prompt rico com todos os dados do contexto
function assistenteBuildSystemPrompt() {
    const ctx = document.getElementById('selectComunidade')?.value;
    const ctxNome = (ctx && ctx !== 'null') ? ctx : null;
    const NL = '\n';

    // Encontrar item E sua fase correta nas listas
    let item = null;
    let faseKey = null;
    const faseLabels = { prospec: 'Prospecção', ativacao: 'Ativação', implem: 'Implementação', gestao: 'Gestão' };
    if (ctxNome) {
        for (const k in appState.listas) {
            const found = appState.listas[k].find(x => x && x.nome === ctxNome);
            if (found) { item = found; faseKey = k; break; }
        }
    }

    // Pilares do tipo
    const pilares = item ? (typePillars[item.tipo] || typePillars.Default || []) : [];
    const pilaresStr = pilares.length > 0 ? pilares.map(p => p.icone + ' ' + p.nome).join(' · ') : 'N/A';

    // Tarefas do contexto
    const tarefas = (appState.tarefasGlobal || []).filter(t => t.context === ctxNome);
    const tarefasStr = tarefas.length > 0
        ? tarefas.map(t => '  - [' + (t.status || 'pendente') + '] ' + t.texto).join(NL)
        : '  Nenhuma tarefa registrada.';

    // Business Plan
    const bpS = appState.bpData && ctxNome ? appState.bpData[ctxNome] : null;
    let bpInfo = 'Business Plan não configurado ainda.';
    if (bpS && bpS.portfolio && bpS.portfolio.length > 0) {
        const total = bpS.portfolio.reduce(function(s,p){ return s + p.price*p.capacity; }, 0);
        bpInfo = 'Portfólio:' + NL +
            bpS.portfolio.map(function(p){ return '  - ' + p.name + ': R$ ' + p.price.toFixed(2) + ' x ' + p.capacity + ' ' + p.unit + ' = R$ ' + (p.price*p.capacity).toFixed(2); }).join(NL) + NL +
            'Receita maxima/mes: R$ ' + total.toFixed(2) + NL +
            'Periodo de escala: ' + bpS.growthPeriodMonths + ' meses' + NL +
            'Regra de divisao: ' + bpS.assessorSharePercent + '%';
    }

    // Esteira Digital
    const estS = appState.esteiraData && ctxNome ? appState.esteiraData[ctxNome] : null;
    let estInfo = 'Esteira Digital não configurada ainda.';
    if (estS && estS.products && estS.products.length > 0) {
        const conexoes = estS.products.filter(function(p){ return p.proximaVendaId; }).length;
        estInfo = 'Produtos na Esteira:' + NL +
            estS.products.map(function(p){
                const faixa = (p.columnId || '').replace('esteira-','').toUpperCase();
                const prox = p.proximaVendaId ? estS.products.find(function(x){ return x.id === p.proximaVendaId; }) : null;
                return '  - [' + faixa + '] ' + p.title + ': R$ ' + p.price + (p.isMapaTesouro ? ' (Mapa do Tesouro)' : '') + (prox ? ' -> ' + prox.title : '');
            }).join(NL) + NL +
            'Conexoes de proxima venda: ' + conexoes + '/' + estS.products.length;
    }

    // Leads CRM relacionados
    const leadsRel = (appState.leads || []).filter(function(l){
        return (ctxNome && l.nome && l.nome.toLowerCase().includes(ctxNome.toLowerCase())) ||
               (item && l.tipo === item.tipo);
    }).slice(0, 5);
    const leadsInfo = leadsRel.length > 0
        ? leadsRel.map(function(l){ return '  - ' + l.nome + ' | Score: ' + (l.score||0) + ' | ' + l.status + ' | Canal: ' + (l.canal||'N/A'); }).join(NL)
        : '  Nenhum lead relacionado no CRM.';

    // Próximos atendimentos
    const hoje = moment();
    const proxAtend = (appState.clients || [])
        .filter(function(c){ return ctxNome && c.name && c.name.toLowerCase().includes(ctxNome.toLowerCase()) && moment(c.date + 'T' + c.time).isSameOrAfter(hoje); })
        .sort(function(a,b){ return moment(a.date+'T'+a.time).diff(moment(b.date+'T'+b.time)); })
        .slice(0, 3);
    const agendaInfo = proxAtend.length > 0
        ? proxAtend.map(function(c){ return '  - ' + moment(c.date).format('DD/MM') + ' as ' + c.time + ' — ' + c.name; }).join(NL)
        : '  Sem atendimentos futuros registrados.';

    return 'Você é o Assistente GERiAH — consultor estratégico especializado na metodologia FNW (Freenatwork) para profissionais de assessoria, mentoria e consultoria, com foco no público 50+.' + NL + NL +
        'SEUS TRÊS PAPÉIS:' + NL +
        '1. CONSULTOR ESTRATÉGICO — analisa o contexto com profundidade usando os dados reais abaixo' + NL +
        '2. ORIENTADOR DE AÇÕES — sugere próximos passos práticos e numerados' + NL +
        '3. EDUCADOR — explica a metodologia GERiAH de forma clara e acessível' + NL + NL +
        '═══ CONTEXTO ATIVO ═══' + NL +
        'Nome: ' + (item ? item.nome : 'Nenhum — oriente o usuário a selecionar no Foco') + NL +
        'Tipo: ' + (item ? item.tipo : 'N/A') + NL +
        'Fase: ' + (faseKey ? faseLabels[faseKey] : 'N/A') + NL +
        'Status: ' + (item ? item.status : 'N/A') + NL +
        'Pilares (' + (item ? item.tipo : '') + '): ' + pilaresStr + NL + NL +
        'TAREFAS REGISTRADAS:' + NL + tarefasStr + NL + NL +
        '═══ BUSINESS PLAN ═══' + NL + bpInfo + NL + NL +
        '═══ ESTEIRA DIGITAL ═══' + NL + estInfo + NL + NL +
        '═══ LEADS CRM RELACIONADOS ═══' + NL + leadsInfo + NL + NL +
        '═══ PRÓXIMOS ATENDIMENTOS ═══' + NL + agendaInfo + NL + NL +
        'INSTRUÇÕES:' + NL +
        '- Use SEMPRE os dados acima — nunca invente informações' + NL +
        '- Seja direto, prático e orientado a resultados reais' + NL +
        '- Linguagem acessível para o público 50+' + NL +
        '- Numere sugestões de ação baseadas nos dados do contexto' + NL +
        '- Se o Business Plan ou Esteira não estiver configurado, sugira configurar' + NL +
        '- Responda sempre em português do Brasil';
}

function assistenteRenderMessages() {
    const container = document.getElementById('assistente-messages');
    if (!container) return;

    if (assistenteHistory.length === 0) {
        const ctx = document.getElementById('selectComunidade')?.value;
        const nomeCtx = (ctx && ctx !== 'null') ? ctx : null;
        container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div class="text-4xl">🧠</div>
            <p class="text-sm font-black text-slate-600">Olá! Sou o Assistente GERiAH.</p>
            <p class="text-[11px] text-slate-400 font-medium leading-relaxed max-w-sm">
                ${nomeCtx
                    ? `Estou pronto para ajudar com <strong class="text-violet-600">${nomeCtx}</strong>. Use os chips acima ou escreva sua pergunta.`
                    : 'Selecione um contexto no Foco para que eu possa analisar os dados e oferecer sugestões personalizadas.'}
            </p>
        </div>`;
        return;
    }

    container.innerHTML = assistenteHistory.map(msg => {
        const isUser = msg.role === 'user';
        return `
        <div class="flex ${isUser ? 'justify-end' : 'justify-start'} gap-3">
            ${!isUser ? '<div class="w-8 h-8 rounded-2xl bg-violet-600 flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">🧠</div>' : ''}
            <div class="max-w-[80%] ${isUser
                ? 'bg-violet-600 text-white rounded-3xl rounded-tr-lg px-5 py-3'
                : 'bg-white border border-slate-200 text-slate-700 rounded-3xl rounded-tl-lg px-5 py-4 shadow-sm'} text-sm font-medium leading-relaxed">
                ${msg.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
            </div>
            ${isUser ? '<div class="w-8 h-8 rounded-2xl bg-indigo-100 flex items-center justify-center text-sm flex-shrink-0 mt-1">👤</div>' : ''}
        </div>`;
    }).join('');

    // Scroll para o fim
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
}

function assistenteAddLoading() {
    const container = document.getElementById('assistente-messages');
    if (!container) return;
    const el = document.createElement('div');
    el.id = 'assistente-loading';
    el.className = 'flex justify-start gap-3';
    el.innerHTML = `
        <div class="w-8 h-8 rounded-2xl bg-violet-600 flex items-center justify-center text-white text-sm flex-shrink-0">🧠</div>
        <div class="bg-white border border-slate-200 rounded-3xl rounded-tl-lg px-5 py-4 shadow-sm flex items-center gap-2">
            <div class="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style="animation-delay:0.15s"></div>
            <div class="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style="animation-delay:0.3s"></div>
        </div>`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
}

window.assistenteEnviar = async function() {
    const input = document.getElementById('assistente-input');
    const sendBtn = document.getElementById('assistente-send-btn');
    const texto = input?.value?.trim();
    if (!texto) return;

    // Verificar se tem API Key
    if (!appState.aiConfig?.key) {
        window.showToast('Configure sua API Key nas ⚙️ Configurações para usar o assistente.', 'warning');
        return;
    }

    input.value = '';
    input.style.height = 'auto';
    assistenteHistory.push({ role: 'user', content: texto });
    assistenteRenderMessages();
    assistenteAddLoading();
    if (sendBtn) sendBtn.disabled = true;

    try {
        const systemPrompt = assistenteBuildSystemPrompt();
        const messages = [
            { role: 'system', content: systemPrompt },
            ...assistenteHistory
        ];

        // Chamar IA diretamente (não via window.callAI para ter controle do histórico)
        const cfg = appState.aiConfig;
        const p = aiProviders[cfg.provider || 'groq'];
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key };
        if (cfg.provider === 'anthropic') headers['anthropic-version'] = '2023-06-01';
        const res = await fetch(p.url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model: cfg.model, max_tokens: 1500, messages })
        });

        document.getElementById('assistente-loading')?.remove();

        if (!res.ok) throw new Error('Erro na API: ' + res.status);
        const data = await res.json();
        const resposta = cfg.provider === 'anthropic'
            ? data.content?.[0]?.text || ''
            : data.choices?.[0]?.message?.content || '';

        assistenteHistory.push({ role: 'assistant', content: resposta });
        assistenteRenderMessages();

    } catch(e) {
        document.getElementById('assistente-loading')?.remove();
        assistenteHistory.push({ role: 'assistant', content: '❌ ' + e.message + '\n\nVerifique sua API Key nas Configurações.' });
        assistenteRenderMessages();
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        input?.focus();
    }
};

const quickActionPrompts = {
    proximos_passos: 'Com base em todos os dados do contexto ativo, quais são os 3 próximos passos mais importantes que devo tomar agora? Seja específico e prático.',
    diagnostico: 'Faça um diagnóstico completo do contexto ativo: o que está bem, o que precisa de atenção e quais são os riscos. Use os dados do Business Plan, Esteira e CRM.',
    proposta: 'Com base no portfólio e esteira de produtos, rascunhe uma proposta comercial resumida para apresentar a este cliente/contexto. Inclua problema, solução, investimento e próximo passo.',
    objecoes: 'Quais são as objeções mais comuns que um cliente neste perfil pode ter? Sugira respostas para cada uma, alinhadas com a metodologia GERiAH.',
    educacao: 'Explique de forma simples e acessível como funciona o GERiAH Suite e como posso usá-lo melhor para gerenciar este contexto. Inclua dicas práticas.'
};

window.assistenteQuickAction = function(action) {
    const prompt = quickActionPrompts[action];
    if (!prompt) return;
    const input = document.getElementById('assistente-input');
    if (input) input.value = prompt;
    window.assistenteEnviar();
};

window.assistenteClearChat = function() {
    assistenteHistory = [];
    assistenteRenderMessages();
};

window.assistenteRefreshCtx = function() {
    assistenteRenderMessages(); // Apenas re-renderiza o estado — o prompt é sempre recalculado no envio
    const ctx = document.getElementById('selectComunidade')?.value;
    const label = document.getElementById('assistente-ctx-label');
    if (label) label.textContent = (ctx && ctx !== 'null') ? '📍 ' + ctx : 'Sem contexto selecionado';
    window.showToast('Contexto atualizado!');
};


// =========================================================================
// HEADER — Contexto ativo sempre visível
// =========================================================================

const statusDotColors = {
    'Ativa':    '#10b981',
    'Stand by': '#f59e0b',
    'Suspensa': '#94a3b8',
    'Cancelada':'#ef4444'
};

function updateHeaderContexto() {
    const nomeEl  = document.getElementById('header-contexto-nome');
    const tipoEl  = document.getElementById('header-contexto-tipo');
    const dotEl   = document.getElementById('header-contexto-dot');
    const boxEl   = document.getElementById('header-contexto');
    if (!nomeEl || !boxEl) return;

    const ctx = document.getElementById('selectComunidade')?.value;
    const isFocoAcoes = ['monitor','acoes'].includes(appState.currentView);

    if (!ctx || ctx === 'null') {
        // Sem contexto — discreto sempre
        nomeEl.textContent = 'Sem contexto';
        nomeEl.className = 'text-[10px] font-black leading-none truncate max-w-[120px] text-slate-300';
        if (tipoEl) { tipoEl.textContent = ''; }
        if (dotEl)  { dotEl.style.background = '#cbd5e1'; }
        boxEl.style.borderColor = '#f1f5f9';
        boxEl.style.background  = '#f8fafc';
        return;
    }

    // Buscar dados do item
    let item = null;
    let faseKey = null;
    for (const k in appState.listas) {
        const found = appState.listas[k].find(x => x && x.nome === ctx);
        if (found) { item = found; faseKey = k; break; }
    }

    const faseLabels = { prospec: 'Prospecção', ativacao: 'Ativação', implem: 'Implementação', gestao: 'Gestão' };
    const dotColor = statusDotColors[item?.status] || '#94a3b8';

    nomeEl.textContent = ctx;
    if (tipoEl) tipoEl.textContent = (item?.tipo || '') + (faseKey ? ' · ' + faseLabels[faseKey] : '');
    if (dotEl) dotEl.style.background = dotColor;

    if (isFocoAcoes) {
        // Destaque — Foco ou Ações
        nomeEl.className = 'text-[10px] font-black leading-none truncate max-w-[120px] text-indigo-700';
        boxEl.style.borderColor = '#c7d2fe';
        boxEl.style.background  = '#eef2ff';
    } else {
        // Discreto — outras views
        nomeEl.className = 'text-[10px] font-black leading-none truncate max-w-[120px] text-slate-400';
        boxEl.style.borderColor = '#e2e8f0';
        boxEl.style.background  = '#f8fafc';
    }
}

// Chamar sempre que o contexto ou a view mudar
const _origSelectContexto = window.selectContexto;
window.selectContexto = function(nome) {
    _origSelectContexto(nome);
    updateHeaderContexto();
};

const _origSwitchViewHeader = window.switchView;
window.switchView = function(view) {
    _origSwitchViewHeader(view);
    updateHeaderContexto();
};


// =========================================================================
// AÇÕES — Drawer mobile
// =========================================================================

let acoesDrawerOpen = false;

window.acoesToggleDrawer = function() {
    const drawer = document.getElementById('acoes-drawer');
    const overlay = document.getElementById('acoes-drawer-overlay');
    if (!drawer) return;
    acoesDrawerOpen = !acoesDrawerOpen;
    drawer.style.transform = acoesDrawerOpen ? 'translateX(0)' : 'translateX(-100%)';
    if (overlay) overlay.classList.toggle('hidden', !acoesDrawerOpen);
    document.body.style.overflow = acoesDrawerOpen ? 'hidden' : '';
};

// Atualizar label mobile do contexto na aba Ações
function updateAcoesMobileCtx() {
    const el = document.getElementById('acoes-mobile-ctx');
    if (!el) return;
    const ctx = document.getElementById('selectComunidade')?.value;
    el.textContent = (ctx && ctx !== 'null') ? '📍 ' + ctx : '';
}

// Fechar drawer ao trocar de view
const _origSwitchViewDrawer = window.switchView;
window.switchView = function(view) {
    _origSwitchViewDrawer(view);
    if (acoesDrawerOpen) window.acoesToggleDrawer();
    if (view === 'acoes') updateAcoesMobileCtx();
};

// =========================================================================
// CRM — Exportação Excel
// =========================================================================

window.exportCRMExcel = function() {
    if (!window.XLSX) {
        window.showToast('SheetJS não carregado. Tente novamente.', 'warning');
        return;
    }

    const wb = XLSX.utils.book_new();
    const hoje = moment();

    // ── ABA 1: LEADS ──────────────────────────────────────────────────────
    const statusLabels = { lead:'Lead', mql:'MQL', sql:'SQL', pql:'PQL', sal:'SAL', customer:'Cliente' };
    const canalLabels  = { website:'Website', social:'Social Media', email:'Email', referral:'Referral', paid:'Paid Ads', indicacao:'Indicação', evento:'Evento' };

    const leadsRows = (appState.leads || []).map(l => {
        // Próximo atendimento do CRM — campo é lead.name
        const proxAtend = (appState.clients || [])
            .filter(c => c.name === l.name && moment(c.date + 'T' + c.time).isSameOrAfter(hoje))
            .sort((a,b) => moment(a.date+'T'+a.time).diff(moment(b.date+'T'+b.time)))[0];

        return {
            'Nome':               l.name || '',
            'Tipo':               l.type || '',
            'Status':             statusLabels[l.status] || l.status || '',
            'Canal':              canalLabels[l.channel] || l.channel || '',
            'Score':              l.score || 0,
            'Telefone':           l.phone || '',
            'Email':              l.email || '',
            'Empresa':            l.company || '',
            'Próx. Atendimento':  proxAtend ? moment(proxAtend.date).format('DD/MM/YYYY') + ' ' + proxAtend.time : '',
            'Observações':        l.notes || '',
            'Criado em':          l.entryDate ? moment(l.entryDate).format('DD/MM/YYYY') : (l.createdAt ? moment(l.createdAt).format('DD/MM/YYYY') : '')
        };
    });

    const wsLeads = XLSX.utils.json_to_sheet(leadsRows.length > 0 ? leadsRows : [{ 'Info': 'Nenhum lead cadastrado' }]);

    // Larguras das colunas
    wsLeads['!cols'] = [
        {wch:30}, {wch:15}, {wch:12}, {wch:15}, {wch:8},
        {wch:16}, {wch:28}, {wch:20}, {wch:20}, {wch:40}, {wch:14}
    ];
    XLSX.utils.book_append_sheet(wb, wsLeads, 'Leads');

    // ── ABA 2: ATIVIDADES ─────────────────────────────────────────────────
    const atividadesRows = (appState.crmActivities || [])
        .sort((a,b) => moment(b.timestamp || b.date || 0).diff(moment(a.timestamp || a.date || 0)))
        .map(a => ({
            'Descrição':  a.text || a.description || '',
            'Data':       a.timestamp ? moment(a.timestamp).format('DD/MM/YYYY HH:mm') : (a.date ? moment(a.date).format('DD/MM/YYYY HH:mm') : '')
        }));

    const wsAtiv = XLSX.utils.json_to_sheet(atividadesRows.length > 0 ? atividadesRows : [{ 'Info': 'Nenhuma atividade registrada' }]);
    wsAtiv['!cols'] = [{wch:30}, {wch:20}, {wch:50}, {wch:18}];
    XLSX.utils.book_append_sheet(wb, wsAtiv, 'Atividades CRM');

    // ── ABA 3: AGENDAMENTOS DO CRM ────────────────────────────────────────
    // Só agendamentos que têm um lead correspondente
    const nomesLeads = new Set((appState.leads || []).map(l => l.name));
    const agendCRM = (appState.clients || [])
        .filter(c => nomesLeads.has(c.name))
        .sort((a,b) => moment(a.date+'T'+a.time).diff(moment(b.date+'T'+b.time)))
        .map(c => ({
            'Nome':    c.name || '',
            'Data':    c.date ? moment(c.date).format('DD/MM/YYYY') : '',
            'Hora':    c.time || '',
            'Tipo':    c.type || '',
            'Status':  moment(c.date+'T'+c.time).isBefore(hoje) ? 'Realizado' : 'Futuro',
            'Ciclo':   c.cycle || ''
        }));

    const wsAgend = XLSX.utils.json_to_sheet(agendCRM.length > 0 ? agendCRM : [{ 'Info': 'Nenhum agendamento de lead encontrado' }]);
    wsAgend['!cols'] = [{wch:30}, {wch:14}, {wch:8}, {wch:15}, {wch:12}, {wch:25}];
    XLSX.utils.book_append_sheet(wb, wsAgend, 'Agendamentos CRM');

    // ── EXPORTAR ──────────────────────────────────────────────────────────
    const fileName = 'GERiAH_CRM_' + moment().format('YYYY-MM-DD_HHmm') + '.xlsx';
    XLSX.writeFile(wb, fileName);
    window.showToast('CRM exportado com ' + (appState.leads || []).length + ' leads!');
};

// =========================================================================
// CRM — Import de Leads via Excel (Google Forms/Sheets)
// =========================================================================

// Colunas aceitas no import — mapeamento flexível
const leadImportMap = {
    name:    ['nome', 'name', 'cliente', 'lead', 'contato', 'contact'],
    email:   ['email', 'e-mail', 'correio'],
    phone:   ['telefone', 'phone', 'celular', 'whatsapp', 'tel', 'fone'],
    type:    ['tipo', 'type', 'perfil', 'categoria'],
    channel: ['canal', 'channel', 'origem', 'source', 'como chegou'],
    notes:   ['observações', 'observacoes', 'notas', 'notes', 'obs', 'mensagem', 'message', 'comentário'],
    company: ['empresa', 'company', 'organização', 'negócio'],
    status:  ['status', 'etapa', 'fase']
};

const typeImportMap = {
    'parceiro': 'partner', 'partner': 'partner',
    'multiplicador': 'multiplier', 'multiplier': 'multiplier',
    'reserva': 'reserve', 'reserve': 'reserve'
};

const channelImportMap = {
    'indicação': 'indicacao', 'indicacao': 'indicacao', 'indicação': 'indicacao',
    'evento': 'evento', 'social': 'social', 'social media': 'social',
    'website': 'website', 'site': 'website',
    'email': 'email', 'e-mail': 'email',
    'referral': 'referral', 'indicado': 'referral',
    'paid': 'paid', 'anúncio': 'paid', 'ads': 'paid'
};

window.downloadLeadTemplate = function() {
    if (!window.XLSX) return window.showToast('SheetJS não disponível.', 'warning');

    const template = [
        {
            'Nome':          'Maria Aparecida Costa',
            'Email':         'maria@email.com',
            'Telefone':      '(11) 98765-4321',
            'Empresa':       'Consultoria Moda 50+',
            'Tipo':          'Parceiro',
            'Canal':         'Indicação',
            'Observações':   'Conheceu pelo Instagram, interesse em mentoria'
        },
        {
            'Nome':          '← Exemplo (apague esta linha)',
            'Email':         '',
            'Telefone':      '',
            'Empresa':       '',
            'Tipo':          'Parceiro | Multiplicador | Reserva',
            'Canal':         'Indicação | Evento | Social | Website | Email | Referral | Ads',
            'Observações':   ''
        }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    ws['!cols'] = [{wch:30},{wch:28},{wch:18},{wch:25},{wch:15},{wch:15},{wch:45}];

    // Linha de instrução no topo
    XLSX.utils.sheet_add_aoa(ws, [
        ['TEMPLATE DE LEADS — GERiAH Suite'],
        ['Preencha a partir da linha 4. Tipo e Canal devem seguir os valores da linha 3.'],
        []
    ], { origin: 'A1' });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'GERiAH_Template_Leads.xlsx');
    window.showToast('Template baixado! Use como modelo no Google Forms/Sheets.');
};

window.importLeadsFromExcel = function(evt) {
    const file = evt.target?.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', raw: false });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' });

            // Encontrar linha de cabeçalho — procura por 'nome' ou 'name' ou 'email'
            let hIdx = data.findIndex(row => row && row.some(cell => {
                const v = String(cell || '').toLowerCase().trim();
                return v === 'nome' || v === 'name' || v === 'email';
            }));

            if (hIdx === -1) {
                return window.showToast('Cabeçalho não encontrado. Use o Template para garantir o formato.', 'warning');
            }

            const headers = data[hIdx].map(h => String(h || '').toLowerCase().trim());

            // Mapear colunas dinamicamente
            const colIdx = {};
            for (const [field, aliases] of Object.entries(leadImportMap)) {
                colIdx[field] = headers.findIndex(h => aliases.some(a => h.includes(a)));
            }

            if (colIdx.name === -1) {
                return window.showToast('Coluna "Nome" é obrigatória!', 'warning');
            }

            let adicionados = 0, duplicados = 0, vazios = 0;

            for (let i = hIdx + 1; i < data.length; i++) {
                const row = data[i];
                if (!row || !row[colIdx.name] || String(row[colIdx.name]).trim() === '') { vazios++; continue; }

                const nome = String(row[colIdx.name]).trim();

                // Verificar duplicata pelo nome
                if (appState.leads.some(l => l.name.toLowerCase() === nome.toLowerCase())) {
                    duplicados++;
                    continue;
                }

                // Montar lead
                const rawType    = colIdx.type    !== -1 ? String(row[colIdx.type]    || '').toLowerCase().trim() : '';
                const rawChannel = colIdx.channel !== -1 ? String(row[colIdx.channel] || '').toLowerCase().trim() : '';

                const lead = {
                    id:         'imp_' + Date.now() + '_' + i,
                    name:       nome,
                    email:      colIdx.email   !== -1 ? String(row[colIdx.email]   || '').trim() : '',
                    phone:      colIdx.phone   !== -1 ? String(row[colIdx.phone]   || '').trim() : '',
                    company:    colIdx.company !== -1 ? String(row[colIdx.company] || '').trim() : '',
                    notes:      colIdx.notes   !== -1 ? String(row[colIdx.notes]   || '').trim() : '',
                    type:       typeImportMap[rawType]    || 'reserve',
                    channel:    channelImportMap[rawChannel] || 'indicacao',
                    status:     'lead',
                    score:      0,
                    entryDate:  new Date().toISOString()
                };

                lead.score = calcLeadScore(lead);
                appState.leads.push(lead);
                syncLeadToMonitor(lead);
                adicionados++;
            }

            saveState();
            renderCRM();
            crmAddActivity(`Import Excel: ${adicionados} leads adicionados`);

            let msg = adicionados + ' leads importados!';
            if (duplicados > 0) msg += ' ' + duplicados + ' duplicados ignorados.';
            window.showToast(msg);

        } catch(err) {
            window.showToast('Erro ao ler o arquivo: ' + err.message, 'warning');
        }
    };
    reader.readAsArrayBuffer(file);
    evt.target.value = null;
};
