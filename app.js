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
    const btn = win.querySelector('button[onclick*="expandWebPreview"]');
    const isFull = win.dataset.expanded === '1';
    if (isFull) {
        // Voltar ao tamanho normal
        win.style.width = '';
        win.style.maxWidth = '45%';
        win.style.minWidth = 'min(100vw, 400px)';
        win.dataset.expanded = '0';
        if (btn) btn.textContent = '⤢';
    } else {
        // Expandir tela cheia
        win.style.width = '100%';
        win.style.maxWidth = '100%';
        win.style.minWidth = '100%';
        win.dataset.expanded = '1';
        if (btn) btn.textContent = '⤡';
    }
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

function crmAddActivity(text, leadName, type) {
    if (!appState.crmActivities) appState.crmActivities = [];
    // Extrair nome do lead do texto se não fornecido (ex: 'Lead "Maria" atualizado')
    if (!leadName) {
        const match = text.match(/Lead "([^"]+)"/);
        if (match) leadName = match[1];
    }
    // Inferir tipo se não fornecido
    if (!type) {
        if (text.includes('adicionado')) type = 'Novo Lead';
        else if (text.includes('atualizado')) type = 'Atualização';
        else if (text.includes('removido')) type = 'Remoção';
        else if (text.includes('Import')) type = 'Import';
        else if (text.includes('Exemplo')) type = 'Sistema';
        else type = 'Atividade';
    }
    appState.crmActivities.unshift({
        id: Date.now(),
        text,
        leadName: leadName || '',
        type,
        timestamp: new Date().toISOString()
    });
    if (appState.crmActivities.length > 50) appState.crmActivities = appState.crmActivities.slice(0, 50);
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
    ['acoes-welcome','acoes-painel-bp','acoes-painel-esteira','acoes-painel-assistente','acoes-painel-cops','acoes-painel-puv-audit','acoes-painel-simulador'].forEach(id => {
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
    } else if (tool === 'simulador') {
        const el = document.getElementById('acoes-painel-simulador');
        if (el) { el.classList.remove('hidden'); el.style.display = ''; }
        const menuItem2 = document.getElementById('acoes-menu-simulador');
        if (menuItem2) menuItem2.classList.add('active');
        setTimeout(() => window.simInit(), 50);
    } else if (tool === 'cops') {
        const el = document.getElementById('acoes-painel-cops');
        if (el) { el.classList.remove('hidden'); el.style.display = ''; }
        const menuItem2 = document.getElementById('acoes-menu-cops');
        if (menuItem2) menuItem2.classList.add('active');
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
    const body = { model: cfg.model, max_tokens: 3000, messages };
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
    const statusLabels  = { lead:'Lead', mql:'MQL', sql:'SQL', pql:'PQL', sal:'SAL', customer:'Cliente' };
    const tipoLabels    = { partner:'Parceiro', multiplier:'Multiplicador', reserve:'Reserva' };
    const canalLabels   = { website:'Website', social:'Social Media', email:'Email', referral:'Referral', paid:'Paid Ads', indicacao:'Indicação', evento:'Evento' };

    const leadsRows = (appState.leads || [])
        .sort((a,b) => (b.score||0) - (a.score||0))  // mesma ordem do CRM: score desc
        .map(l => {
            const proxAtend = (appState.clients || [])
                .filter(c => c.name === l.name && moment(c.date + 'T' + c.time).isSameOrAfter(hoje))
                .sort((a,b) => moment(a.date+'T'+a.time).diff(moment(b.date+'T'+b.time)))[0];

            return {
                'Nome':              l.name || '',
                'Email':             l.email || '',
                'Telefone':          l.phone || '',
                'Score':             l.score || 0,
                'Status':            statusLabels[l.status] || l.status || '',
                'Tipo':              tipoLabels[l.type] || l.type || '',
                'Canal':             canalLabels[l.channel] || l.channel || '',
                'Próx. Atendimento': proxAtend ? moment(proxAtend.date).format('DD/MM/YYYY') + ' ' + proxAtend.time : '—',
                'Empresa':           l.company || '',
                'Observações':       l.notes || '',
                'Criado em':         l.entryDate ? moment(l.entryDate).format('DD/MM/YYYY') : ''
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
        .map(a => {
            const texto = a.text || a.description || '';
            // Extrair lead do texto se não estiver salvo
            let lead = a.leadName || '';
            if (!lead) {
                const m = texto.match(/Lead "([^"]+)"/);
                if (m) lead = m[1];
            }
            // Inferir tipo se não estiver salvo
            let tipo = a.type || '';
            if (!tipo) {
                if (texto.includes('adicionado')) tipo = 'Novo Lead';
                else if (texto.includes('atualizado')) tipo = 'Atualização';
                else if (texto.includes('removido')) tipo = 'Remoção';
                else if (texto.includes('Import')) tipo = 'Import';
                else if (texto.includes('Exemplo')) tipo = 'Sistema';
                else tipo = 'Atividade';
            }
            return {
                'Lead':       lead,
                'Tipo':       tipo,
                'Descrição':  texto,
                'Data':       a.timestamp ? moment(a.timestamp).format('DD/MM/YYYY HH:mm') : (a.date ? moment(a.date).format('DD/MM/YYYY HH:mm') : '')
            };
        });

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

// =========================================================================
// PUVZap — Janela popup contida com iframe
// =========================================================================
window.abrirPUVZap = function() {
    const w = 480, h = 700;
    const left = screen.width - w - 20;
    const top = 50;

    // Abre WhatsApp Web direto no popup — usuário já logado vai ver o grupo
    const popup = window.open(
        'https://web.whatsapp.com/accept?code=HYvnmCO2mdT5bcwrXTXo0r',
        'PUVZap',
        'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top +
        ',resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no'
    );

    if (!popup) {
        window.open('https://web.whatsapp.com/accept?code=HYvnmCO2mdT5bcwrXTXo0r', '_blank');
    } else {
        popup.focus();
    }
};

// =========================================================================
// AÇÕES — PUV Audit (Editor Estratégico GERiAH)
// =========================================================================

window.auditData = null;

const auditExampleData = {
    alvo: { nome: "Mariana Costa", canal: "Instagram", url: "https://instagram.com/marianacosta_vendas", contexto_realidade: "Consultora de vendas B2B. Foca muito em conteúdo técnico. Objetivo é humanizar e atrair decisores de empresas." },
    score_total: 14, score_max: 28, classificacao: "Médio",
    documento_secoes: { diagnostico_performance: "O perfil possui autoridade clara, mas a linguagem é excessivamente corporativa para o Instagram, criando barreira de conexão." },
    criterios: [
        { nome: "Clareza da Promessa (Bio)", score: 3, justificativa: "A bio é direta, mas falta o 'como' ela entrega o resultado.", oportunidade_salto: "Adicionar CTA clara para diagnóstico gratuito." },
        { nome: "Identidade Visual", score: 2, justificativa: "Cores muito frias. Falta contraste em capas de Reels.", oportunidade_salto: "Usar tipografia maior e cores de destaque nas headlines." },
        { nome: "Prova Social", score: 1, justificativa: "Apenas prints de conversas nos destaques.", oportunidade_salto: "Criar depoimentos em vídeo curtos com clientes reais." },
        { nome: "Consistência de Conteúdo", score: 4, justificativa: "Postagens diárias e bem estruturadas.", oportunidade_salto: "Alternar formatos estáticos com carrosséis educativos." }
    ],
    persona_detectada: { primaria: "Gerentes de vendas de pequenas empresas (30-45 anos).", secundaria: "Empreendedores solo que querem escalar times.", conflito: "O conteúdo parece manual de instruções e não solução desejável." },
    plano_acao_adaptacao: "Focar em Conteúdo de Autoridade Humana, transformando conhecimento técnico em pílulas de rotina.",
    top3_acoes: ["Reformular os 3 posts fixados (Humanização + Oferta + Autoridade)", "Sequência de 5 Stories diários respondendo dores dos gerentes", "Alterar a Bio para versão mais humana e direta"]
};

window.auditLoadExample = function() {
    window.auditData = JSON.parse(JSON.stringify(auditExampleData));
    auditRender();
};

window.auditNewProfile = function() {
    // Pré-preencher com contexto ativo do Suite
    const ctx = document.getElementById('selectComunidade')?.value;
    const ctxNome = (ctx && ctx !== 'null') ? ctx : '';
    window.auditData = {
        alvo: { nome: ctxNome, canal: '', url: '', contexto_realidade: '' },
        score_total: 0, score_max: 28, classificacao: 'Médio',
        documento_secoes: { diagnostico_performance: '' },
        criterios: [
            { nome: 'Clareza da Promessa (Bio)', score: 0, justificativa: '', oportunidade_salto: '' },
            { nome: 'Identidade Visual', score: 0, justificativa: '', oportunidade_salto: '' },
            { nome: 'Prova Social', score: 0, justificativa: '', oportunidade_salto: '' },
            { nome: 'Consistência de Conteúdo', score: 0, justificativa: '', oportunidade_salto: '' }
        ],
        persona_detectada: { primaria: '', secundaria: '', conflito: '' },
        plano_acao_adaptacao: '', top3_acoes: ['', '', '']
    };
    auditRender();
};

window.auditImportJSON = function(evt) {
    const file = evt.target?.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            window.auditData = JSON.parse(e.target.result);
            auditRender();
            window.showToast('Análise importada!');
        } catch(err) { window.showToast('Arquivo inválido.', 'warning'); }
    };
    reader.readAsText(file);
    evt.target.value = null;
};

function auditRender() {
    const d = window.auditData;
    if (!d) return;

    document.getElementById('audit-landing').classList.add('hidden');
    document.getElementById('audit-editor').classList.remove('hidden');

    // Geral
    document.getElementById('audit-input-nome').value = d.alvo.nome || '';
    document.getElementById('audit-input-canal').value = d.alvo.canal || '';
    document.getElementById('audit-input-url').value = d.alvo.url || '';
    document.getElementById('audit-input-contexto').value = d.alvo.contexto_realidade || '';
    document.getElementById('audit-score-display').textContent = d.score_total || 0;
    document.getElementById('audit-score-max').textContent = d.score_max || 28;
    document.getElementById('audit-input-classificacao').value = d.classificacao || 'Médio';

    // Critérios
    const critList = document.getElementById('audit-criterios-list');
    critList.innerHTML = d.criterios.map((c, i) => `
        <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <div class="flex justify-between items-start gap-4">
                <div class="flex-1">
                    <input class="w-full bg-transparent font-black text-lg text-[#2D1530] border-none outline-none mb-1"
                        value="${c.nome}" onchange="window.auditUpdateCrit(${i}, 'nome', this.value)">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pilar de Avaliação</p>
                </div>
                <input type="number" min="0" max="4" value="${c.score}"
                    class="w-14 h-14 bg-white border-2 border-slate-200 rounded-2xl font-black text-xl text-center text-[#2D1530] outline-none"
                    onchange="window.auditUpdateCrit(${i}, 'score', this.value)">
            </div>
            <div class="space-y-2">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Justificativa</label>
                <textarea class="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 min-h-[70px] outline-none"
                    onchange="window.auditUpdateCrit(${i}, 'justificativa', this.value)">${c.justificativa}</textarea>
            </div>
            <div class="space-y-2">
                <label class="text-[9px] font-black text-[#2D1530]/60 uppercase tracking-widest">⚡ Oportunidade de Salto</label>
                <input class="w-full p-3 bg-[#2D1530]/5 border border-[#2D1530]/10 rounded-xl text-xs font-bold text-[#2D1530] outline-none"
                    value="${c.oportunidade_salto}" onchange="window.auditUpdateCrit(${i}, 'oportunidade_salto', this.value)">
            </div>
        </div>`).join('');

    // Persona
    document.getElementById('audit-persona-primaria').value = d.persona_detectada.primaria || '';
    document.getElementById('audit-persona-secundaria').value = d.persona_detectada.secundaria || '';
    document.getElementById('audit-persona-conflito').value = d.persona_detectada.conflito || '';

    // Documento
    const docList = document.getElementById('audit-documento-list');
    docList.innerHTML = Object.entries(d.documento_secoes).map(([key, value]) => `
        <div class="space-y-2">
            <label class="text-[9px] font-black text-[#2D1530]/40 uppercase tracking-widest">${key.replace(/_/g,' ')}</label>
            <textarea class="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-700 min-h-[200px] outline-none leading-relaxed focus:bg-white"
                onchange="window.auditUpdateDoc('${key}', this.value)">${value}</textarea>
        </div>`).join('');

    // Ações
    document.getElementById('audit-plano-adaptacao').value = d.plano_acao_adaptacao || '';
    const top3 = document.getElementById('audit-top3-list');
    top3.innerHTML = d.top3_acoes.map((a, i) => `
        <div class="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div class="w-10 h-10 bg-[#2D1530] rounded-xl flex items-center justify-center text-white font-black shrink-0">${i+1}</div>
            <input class="flex-1 text-sm font-bold text-slate-800 border-b border-slate-100 focus:border-[#2D1530] outline-none py-1"
                value="${a}" onchange="window.auditUpdateAction(${i}, this.value)">
        </div>`).join('');
}

window.auditSwitchTab = function(tab) {
    document.querySelectorAll('.audit-tab-btn').forEach(b => {
        const isActive = b.dataset.audittab === tab;
        b.className = 'audit-tab-btn px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ' +
            (isActive ? 'bg-[#2D1530] text-white' : 'text-slate-400 hover:bg-slate-100');
    });
    document.querySelectorAll('.audit-tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById('audit-tab-' + tab)?.classList.remove('hidden');
};

window.auditUpdateField = function(field, val) {
    if (!window.auditData) return;
    if (field === 'contexto') window.auditData.alvo.contexto_realidade = val;
    else if (field === 'classificacao') window.auditData.classificacao = val;
    else window.auditData.alvo[field] = val;
};

window.auditUpdateCrit = function(idx, field, val) {
    if (!window.auditData) return;
    window.auditData.criterios[idx][field] = val;
    if (field === 'score') {
        window.auditData.score_total = window.auditData.criterios.reduce((s, c) => s + (parseInt(c.score)||0), 0);
        document.getElementById('audit-score-display').textContent = window.auditData.score_total;
    }
};

window.auditUpdatePersona = function(field, val) {
    if (!window.auditData) return;
    window.auditData.persona_detectada[field] = val;
};

window.auditUpdateDoc = function(key, val) {
    if (!window.auditData) return;
    window.auditData.documento_secoes[key] = val;
};

window.auditUpdateAction = function(idx, val) {
    if (!window.auditData) return;
    window.auditData.top3_acoes[idx] = val;
};

window.auditGenerateAI = async function() {
    if (!window.auditData) return;
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações primeiro.', 'warning');
        return;
    }
    const ctx = window.auditData.alvo.contexto_realidade;
    if (!ctx || ctx.length < 10) {
        window.showToast('Preencha o campo Contexto com mais detalhes.', 'warning');
        return;
    }

    const btn = document.getElementById('audit-ai-btn-text');
    const loading = document.getElementById('audit-ai-loading');
    if (btn) btn.textContent = 'Gerando...';
    if (loading) loading.classList.remove('hidden');

    try {
        const systemPrompt = 'Você é um Estrategista Digital Sênior especialista em auditoria de perfis para Instagram/LinkedIn. Crie um plano de ação tático baseado na realidade do cliente. Responda APENAS em JSON válido com os campos: plano_resumo (string) e top3 (array de 3 strings).';
        const prompt = 'Analise este contexto: "' + ctx + '". Nome: ' + window.auditData.alvo.nome + '. Plataforma: ' + window.auditData.alvo.canal + '. Gere plano_resumo e top3 ações prioritárias.';

        const resposta = await window.callAI(prompt, systemPrompt);

        // Tentar parsear JSON da resposta
        const clean = resposta.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        if (parsed.plano_resumo) window.auditData.plano_acao_adaptacao = parsed.plano_resumo;
        if (parsed.top3) window.auditData.top3_acoes = parsed.top3;

        auditRender();
        window.auditSwitchTab('acoes');
        window.showToast('Plano estratégico gerado! ✓');
    } catch(e) {
        window.showToast('Erro na IA: ' + e.message, 'warning');
    } finally {
        if (btn) btn.textContent = 'Gerar com IA';
        if (loading) loading.classList.add('hidden');
    }
};

window.auditClose = function() {
    if (confirm('Fechar o projeto atual? Alterações não exportadas serão perdidas.')) {
        window.auditData = null;
        document.getElementById('audit-landing').classList.remove('hidden');
        document.getElementById('audit-editor').classList.add('hidden');
    }
};

window.auditExportJSON = function() {
    if (!window.auditData) return;
    const name = (window.auditData.alvo.nome || 'perfil').toLowerCase().replace(/\s+/g,'_');
    const blob = new Blob([JSON.stringify(window.auditData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'geriah_audit_' + name + '.json';
    a.click();
    window.showToast('Projeto salvo como JSON!');
};

window.auditExportHTML = function() {
    if (!window.auditData) return;
    const d = window.auditData;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://cdn.tailwindcss.com"><\/script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
<style>body{font-family:'Inter',sans-serif;print-color-adjust:exact;}@media print{.no-print{display:none;}}</style>
</head><body class="bg-slate-50 p-10">
<div class="max-w-[850px] mx-auto bg-white p-12 shadow-2xl rounded-lg">
<header class="flex justify-between items-start border-b-4 border-[#2D1530] pb-10 mb-10">
<div><img src="https://geriah-suite.vercel.app/logo.png" class="h-14 mb-4"/>
<h1 class="text-4xl font-black text-[#2D1530] uppercase">${d.alvo.nome}</h1>
<p class="text-slate-400 font-bold uppercase text-sm">${d.alvo.canal} • Auditoria de Perfil</p></div>
<div class="text-right"><div class="text-6xl font-black text-[#2D1530]">${d.score_total}<span class="text-slate-200 text-2xl">/${d.score_max}</span></div>
<div class="bg-[#2D1530] text-white px-4 py-1 text-xs font-black uppercase rounded-full mt-2 inline-block">${d.classificacao}</div></div>
</header>
<section class="mb-10"><h2 class="text-xs font-black text-[#2D1530] uppercase tracking-widest mb-4">Diagnóstico Geral</h2>
<div class="p-6 bg-slate-50 rounded-2xl italic text-slate-700 border-l-8 border-slate-200">"${d.documento_secoes.diagnostico_performance || ''}"</div></section>
<section class="mb-10"><h2 class="text-xs font-black text-[#2D1530] uppercase tracking-widest mb-6">Pilares Estratégicos</h2>
<div class="grid gap-4">${d.criterios.map(c => `<div class="border border-slate-100 p-5 rounded-2xl"><div class="flex justify-between items-center mb-2"><h3 class="font-black text-[#2D1530] uppercase">${c.nome}</h3><span class="bg-white px-3 py-1 rounded-full text-xs font-black border">${c.score}/4</span></div><p class="text-sm text-slate-600 mb-3">${c.justificativa}</p><div class="bg-[#2D1530] text-white p-3 rounded-xl text-[10px] font-black uppercase">→ ${c.oportunidade_salto}</div></div>`).join('')}</div></section>
<section><h2 class="text-xs font-black text-[#2D1530] uppercase tracking-widest mb-4">Plano de Implementação</h2>
<div class="p-6 bg-purple-50 rounded-2xl text-purple-900 font-bold italic mb-6">"${d.plano_acao_adaptacao}"</div>
<div class="grid gap-3">${d.top3_acoes.map((a,i) => `<div class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border"><div class="w-8 h-8 bg-[#2D1530] text-white flex items-center justify-center rounded-xl font-black text-sm">${i+1}</div><p class="font-black text-[#2D1530] uppercase">${a}</p></div>`).join('')}</div></section>
<div class="no-print mt-10 flex justify-center"><button onclick="window.print()" class="bg-[#2D1530] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Imprimir PDF</button></div>
</div></body></html>`;
    const name = (d.alvo.nome || 'relatorio').toLowerCase().replace(/\s+/g,'_');
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'geriah_audit_' + name + '.html';
    a.click();
    window.showToast('Relatório HTML gerado!');
};

// Registrar painel no acoesAbrirFerramenta
const _origAcoesAbrir = window.acoesAbrirFerramenta;
window.acoesAbrirFerramenta = function(tool) {
    _origAcoesAbrir(tool);
    if (tool === 'puv-audit') {
        ['acoes-welcome','acoes-painel-bp','acoes-painel-esteira','acoes-painel-assistente','acoes-painel-cops','acoes-painel-puv-audit','acoes-painel-simulador'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
        });
        document.querySelectorAll('.acoes-menu-item').forEach(el => el.classList.remove('active'));
        const menuItem = document.getElementById('acoes-menu-puv-audit');
        if (menuItem) menuItem.classList.add('active');
        const painel = document.getElementById('acoes-painel-puv-audit');
        if (painel) { painel.classList.remove('hidden'); painel.style.display = ''; }
        // Pré-preencher contexto ativo se landing ainda visível
        if (!window.auditData) {
            const ctx = document.getElementById('selectComunidade')?.value;
        }
    }
};

// =========================================================================
// OPERACIONAL — COPS Engine
// =========================================================================

let copsHipotesesSelecionadas = [];
let copsResultado = null;

window.copsToggleKB = function() {
    const area = document.getElementById('cops-kb-area');
    const btn = document.getElementById('cops-kb-toggle');
    const hidden = area.classList.toggle('hidden');
    if (btn) btn.textContent = hidden ? '▼ Expandir' : '▲ Recolher';
};

function copsBuildContext() {
    // Construir contexto rico do Suite para alimentar a IA
    const ctx = document.getElementById('selectComunidade')?.value;
    const ctxNome = (ctx && ctx !== 'null') ? ctx : null;

    let item = null, faseKey = null;
    const faseLabels = { prospec:'Prospecção', ativacao:'Ativação', implem:'Implementação', gestao:'Gestão' };
    if (ctxNome) {
        for (const k in appState.listas) {
            const f = appState.listas[k].find(x => x && x.nome === ctxNome);
            if (f) { item = f; faseKey = k; break; }
        }
    }

    const bpS = appState.bpData && ctxNome ? appState.bpData[ctxNome] : null;
    const estS = appState.esteiraData && ctxNome ? appState.esteiraData[ctxNome] : null;
    const kbExtra = document.getElementById('cops-kb-text')?.value?.trim() || '';

    let ctx_str = '=== DADOS DO SISTEMA GERiAH ===\n';
    if (item) {
        ctx_str += 'Contexto ativo: ' + item.nome + ' | Tipo: ' + item.tipo + ' | Fase: ' + (faseLabels[faseKey]||'') + ' | Status: ' + item.status + '\n';
    }
    if (bpS && bpS.portfolio && bpS.portfolio.length > 0) {
        ctx_str += '\nPortfólio FNW:\n' + bpS.portfolio.map(p => '- ' + p.name + ': R$ ' + p.price + ' x ' + p.capacity + ' ' + p.unit).join('\n');
    }
    if (estS && estS.products && estS.products.length > 0) {
        ctx_str += '\nEsteira de produtos:\n' + estS.products.map(p => '- ' + p.title + ': R$ ' + p.price).join('\n');
    }
    if (kbExtra) {
        ctx_str += '\n\n=== BASE DE CONHECIMENTO FNW (fornecida pelo usuário) ===\n' + kbExtra;
    }
    ctx_str += '\n\n=== METODOLOGIA FNW/GERiAH ===\nSistema de assessoria com fases: Prospecção → Ativação → Implementação → Gestão.\nTipos de atendimento: Assessoria, Comunidade, Mentoria, Consultoria, Parceria, Pipeline, Projeto.\nFoco em público 50+, autonomia, esperança, renovação, inteligência.';

    return ctx_str;
}

window.copsGenerate = async function() {
    const raw = document.getElementById('cops-raw-input')?.value?.trim();
    if (!raw || raw.length < 20) {
        window.showToast('Cole um documento ou descreva a situação primeiro.', 'warning');
        return;
    }
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações.', 'warning');
        return;
    }

    const icon = document.getElementById('cops-generate-icon');
    const txt = document.getElementById('cops-generate-text');
    if (icon) icon.textContent = '⏳';
    if (txt) txt.textContent = 'Analisando...';

    try {
        const sysPrompt = `Você é um Estrategista Sênior da FNW Assessoria, especialista em diagnóstico organizacional e propostas de assessoria para profissionais e empreendedores 50+.

Sua tarefa é estruturar qualquer situação/documento no framework COPS e gerar hipóteses de entrega baseadas na metodologia FNW.

Responda APENAS em JSON válido com esta estrutura exata:
{
  "contexto": "quem é, onde está, qual o cenário atual",
  "ocorrencia": "o que aconteceu ou está acontecendo",
  "problema": "a dor real por trás da ocorrência (não o sintoma, o problema raiz)",
  "solucao_imaginada": "o que o cliente/usuário acha que precisa",
  "solucao_efetiva": "o que realmente resolve, baseado na metodologia FNW e dados do sistema",
  "hipoteses": [
    {"titulo": "Nome curto da hipótese", "descricao": "O que entregaria e como", "tipo": "Assessoria|Mentoria|Consultoria|Comunidade|Projeto"},
    {"titulo": "...", "descricao": "...", "tipo": "..."},
    {"titulo": "...", "descricao": "...", "tipo": "..."}
  ]
}`;

        // Limitar tamanho do input — API tem limite de tokens
        const MAX_CHARS = 12000;
        const rawTruncado = raw.length > MAX_CHARS
            ? raw.substring(0, MAX_CHARS) + '\n\n[... documento truncado para análise — ' + raw.length + ' caracteres no total]'
            : raw;
        const userPrompt = copsBuildContext() + '\n\n=== SITUAÇÃO/DOCUMENTO A ANALISAR ===\n' + rawTruncado;
        const resposta = await window.callAI(userPrompt, sysPrompt);

        const clean = resposta.replace(/```json|```/g,'').trim();
        copsResultado = JSON.parse(clean);

        // Renderizar resultado nos campos editáveis
        const setTA = (id, val) => { const el = document.getElementById(id); if (el) { el.value = val || ''; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }};
        setTA('cops-contexto',          copsResultado.contexto);
        setTA('cops-ocorrencia',         copsResultado.ocorrencia);
        setTA('cops-problema',           copsResultado.problema);
        setTA('cops-solucao-imaginada',  copsResultado.solucao_imaginada);
        setTA('cops-solucao-efetiva',    copsResultado.solucao_efetiva);

        // Hipóteses selecionáveis
        copsHipotesesSelecionadas = [];
        const hipEl = document.getElementById('cops-hipoteses');
        const tipoColors = { Assessoria:'bg-blue-100 text-blue-700', Mentoria:'bg-purple-100 text-purple-700', Consultoria:'bg-amber-100 text-amber-700', Comunidade:'bg-emerald-100 text-emerald-700', Projeto:'bg-rose-100 text-rose-700' };
        hipEl.innerHTML = (copsResultado.hipoteses || []).map((h, i) => `
            <div class="bg-white border-2 border-violet-100 rounded-2xl overflow-hidden transition-all cops-hip-wrapper-${i}">
                <!-- Header clicável para selecionar -->
                <div onclick="window.copsToggleHip(${i}, this.closest('.cops-hip-wrapper-${i}'))"
                    class="cops-hip flex items-start gap-3 p-4 cursor-pointer hover:bg-violet-50 transition-all">
                    <div class="w-5 h-5 rounded-full border-2 border-violet-300 flex items-center justify-center flex-shrink-0 mt-0.5 cops-check-${i}"></div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <input class="flex-1 text-xs font-black text-slate-800 bg-transparent border-none outline-none"
                                value="${h.titulo}" onclick="event.stopPropagation()"
                                onchange="window.copsUpdateHip(${i}, 'titulo', this.value)">
                            <span class="text-[8px] font-black px-2 py-0.5 rounded-full ${tipoColors[h.tipo]||'bg-slate-100 text-slate-600'}">${h.tipo}</span>
                            <button onclick="event.stopPropagation(); window.copsRefinarHip(${i})"
                                class="text-[8px] font-black text-violet-600 bg-violet-100 px-2 py-0.5 rounded-lg hover:bg-violet-600 hover:text-white transition-all">✨ IA</button>
                        </div>
                        <textarea class="w-full text-[11px] text-slate-500 font-medium leading-relaxed bg-transparent border-none outline-none resize-none"
                            rows="2" onclick="event.stopPropagation()"
                            onchange="window.copsUpdateHip(${i}, 'descricao', this.value)">${h.descricao}</textarea>
                    </div>
                </div>
            </div>`).join('');

        document.getElementById('cops-step-input').classList.add('hidden');
        document.getElementById('cops-step-result').classList.remove('hidden');
        window.showToast('COPS estruturado com sucesso! ✓');

    } catch(e) {
        window.showToast('Erro na análise: ' + e.message, 'warning');
    } finally {
        if (icon) icon.textContent = '🔬';
        if (txt) txt.textContent = 'Analisar e Estruturar em COPS';
    }
};

window.copsToggleHip = function(idx, el) {
    const check = el.querySelector('.cops-check-' + idx);
    const selected = copsHipotesesSelecionadas.includes(idx);
    if (selected) {
        copsHipotesesSelecionadas = copsHipotesesSelecionadas.filter(i => i !== idx);
        el.classList.remove('border-violet-500', 'bg-violet-50');
        el.classList.add('border-violet-100');
        if (check) check.innerHTML = '';
    } else {
        copsHipotesesSelecionadas.push(idx);
        el.classList.add('border-violet-500', 'bg-violet-50');
        el.classList.remove('border-violet-100');
        if (check) check.innerHTML = '<div class="w-3 h-3 rounded-full bg-violet-500"></div>';
    }
};

window.copsGerarProposta = async function() {
    if (!copsResultado) return;
    if (copsHipotesesSelecionadas.length === 0) {
        window.showToast('Selecione pelo menos uma hipótese primeiro.', 'warning');
        return;
    }
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações.', 'warning');
        return;
    }

    const hipSel = copsHipotesesSelecionadas.map(i => copsResultado.hipoteses[i]);
    const ctx = document.getElementById('selectComunidade')?.value;
    const ctxNome = (ctx && ctx !== 'null') ? ctx : 'Cliente';

    window.showToast('Gerando proposta...');

    try {
        const sysPrompt = 'Você é um Consultor Sênior da FNW Assessoria. Gere uma proposta de assessoria profissional, clara e persuasiva baseada no diagnóstico COPS fornecido. Use linguagem direta, empática e orientada a resultados. Formato: texto corrido em HTML simples (use <h3>, <p>, <strong>, <ul>, <li>).';

        const entregaveisStr = (copsResultado._entregaveis && copsResultado._entregaveis.length > 0)
            ? '\n\nENTREGÁVEIS SELECIONADOS (incluir na proposta):\n' + copsResultado._entregaveis.map((e,i) => (i+1) + '. ' + e).join('\n')
            : '';

        // Contexto resumido — evitar token limit
        const bpS = appState.bpData?.[ctx];
        const bpResumo = bpS && bpS.portfolio?.length > 0
            ? 'Portfólio: ' + bpS.portfolio.map(p => p.name + ' R$' + p.price).join(', ')
            : '';

        const userPrompt = 'CLIENTE: ' + ctxNome + '\n' +
            (bpResumo ? bpResumo + '\n' : '') +
            '\nDIAGNÓSTICO COPS:\n' +
            'Contexto: ' + copsResultado.contexto + '\n' +
            'Ocorrência: ' + copsResultado.ocorrencia + '\n' +
            'Problema: ' + copsResultado.problema + '\n' +
            'Solução Imaginada: ' + copsResultado.solucao_imaginada + '\n' +
            'Solução Efetiva FNW: ' + copsResultado.solucao_efetiva + '\n\n' +
            'HIPÓTESES APROVADAS:\n' + hipSel.map(h => '- ' + h.titulo + ': ' + h.descricao).join('\n') +
            entregaveisStr + '\n\n' +
            'Gere uma proposta de assessoria completa em HTML (use <h3>, <p>, <strong>, <ul>, <li>) com:\n' +
            '1. Abertura empática (1 parágrafo)\n' +
            '2. Diagnóstico resumido\n' +
            '3. Solução proposta\n' +
            '4. Lista dos entregáveis acima\n' +
            '5. Próximos passos\n' +
            '6. CTA direto';

        const resposta = await window.callAI(userPrompt, sysPrompt);

        const propostaEl = document.getElementById('cops-proposta-content');
        propostaEl.innerHTML = resposta
            .replace(/```html|```/g,'')
            .replace(/\n\n/g,'</p><p>')
            .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');

        document.getElementById('cops-step-result').classList.add('hidden');
        document.getElementById('cops-step-proposta').classList.remove('hidden');
        window.showToast('Proposta gerada! ✓');

    } catch(e) {
        window.showToast('Erro ao gerar proposta: ' + e.message, 'warning');
    }
};

window.copsCopiar = function() {
    if (!copsResultado) return;
    const texto = 'COPS — DIAGNÓSTICO ESTRUTURADO\n\n' +
        'C — CONTEXTO\n' + copsResultado.contexto + '\n\n' +
        'O — OCORRÊNCIA\n' + copsResultado.ocorrencia + '\n\n' +
        'P — PROBLEMA REAL\n' + copsResultado.problema + '\n\n' +
        'S₁ — SOLUÇÃO IMAGINADA\n' + copsResultado.solucao_imaginada + '\n\n' +
        'S₂ — SOLUÇÃO EFETIVA (FNW)\n' + copsResultado.solucao_efetiva;
    navigator.clipboard.writeText(texto).then(() => window.showToast('COPS copiado!'));
};

window.copsCopiarProposta = function() {
    const el = document.getElementById('cops-proposta-content');
    const texto = el ? el.innerText : '';
    navigator.clipboard.writeText(texto).then(() => window.showToast('Proposta copiada!'));
};

window.copsReset = function() {
    copsResultado = null;
    copsHipotesesSelecionadas = [];
    document.getElementById('cops-raw-input').value = '';
    document.getElementById('cops-step-result').classList.add('hidden');
    document.getElementById('cops-step-proposta').classList.add('hidden');
    document.getElementById('cops-step-input').classList.remove('hidden');
};

window.copsVoltarResult = function() {
    document.getElementById('cops-step-proposta').classList.add('hidden');
    document.getElementById('cops-step-result').classList.remove('hidden');
};

// =========================================================================
// COPS Engine — Upload de arquivos
// =========================================================================

window.copsReadFile = async function(evt) {
    const file = evt.target?.files[0];
    if (!file) return;

    const nameEl = document.getElementById('cops-file-name');
    const clearBtn = document.getElementById('cops-file-clear');
    if (nameEl) nameEl.textContent = '⏳ Lendo ' + file.name + '...';

    try {
        let texto = '';

        if (file.name.endsWith('.pdf')) {
            texto = await copsReadPDF(file);
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            texto = await copsReadDOCX(file);
        } else {
            // TXT, MD, CSV, HTML, HTM, JSON, XML, JS, TS — leitura direta como texto
            texto = await file.text();
        }

        if (texto && texto.trim()) {
            const input = document.getElementById('cops-raw-input');
            if (input) {
                input.value = (input.value ? input.value + '\n\n---\n\n' : '') + texto.trim();
            }
            if (nameEl) nameEl.textContent = '📎 ' + file.name;
            if (clearBtn) clearBtn.classList.remove('hidden');
            window.showToast('Arquivo carregado: ' + file.name);
        } else {
            if (nameEl) nameEl.textContent = '⚠️ Não foi possível extrair texto';
            window.showToast('Não foi possível extrair texto do arquivo.', 'warning');
        }
    } catch(e) {
        if (nameEl) nameEl.textContent = '❌ Erro ao ler arquivo';
        window.showToast('Erro: ' + e.message, 'warning');
    }

    evt.target.value = null;
};

async function copsReadPDF(file) {
    // Carregar PDF.js dinamicamente se necessário
    if (!window.pdfjsLib) {
        await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let texto = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        texto += content.items.map(item => item.str).join(' ') + '\n';
    }
    return texto;
}

async function copsReadDOCX(file) {
    // Carregar mammoth.js dinamicamente
    if (!window.mammoth) {
        await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

window.copsClearFile = function() {
    const nameEl = document.getElementById('cops-file-name');
    const clearBtn = document.getElementById('cops-file-clear');
    if (nameEl) nameEl.textContent = '';
    if (clearBtn) clearBtn.classList.add('hidden');
};

// =========================================================================
// COPS Engine — Refinamento da proposta
// =========================================================================

let copsRefineHistory = []; // histórico de pedidos de refinamento

window.copsRefinar = async function() {
    const instrucao = document.getElementById('cops-refine-input')?.value?.trim();
    if (!instrucao) {
        window.showToast('Descreva o que quer refinar na proposta.', 'warning');
        return;
    }
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações.', 'warning');
        return;
    }

    const icon = document.getElementById('cops-refine-icon');
    const txt  = document.getElementById('cops-refine-text');
    if (icon) icon.textContent = '⏳';
    if (txt)  txt.textContent  = 'Refinando...';

    try {
        const propostaAtual = document.getElementById('cops-proposta-content')?.innerText || '';

        const sysPrompt = 'Você é um Consultor Sênior da FNW Assessoria. Refine a proposta de assessoria fornecida aplicando exatamente as instruções do usuário. Mantenha o tom, a estrutura e a essência da proposta original. Responda com a proposta refinada em HTML simples (use <h3>, <p>, <strong>, <ul>, <li>).';

        // Histórico de refinamentos para manter contexto
        const historicoStr = copsRefineHistory.length > 0
            ? '\n\nRefinamentos anteriores já aplicados:\n' + copsRefineHistory.map((r, i) => (i+1) + '. ' + r).join('\n')
            : '';

        const userPrompt = 'PROPOSTA ATUAL:\n' + propostaAtual +
            '\n\nDIAGNÓSTICO COPS ORIGINAL:\n' +
            'Problema: ' + (copsResultado?.problema || '') + '\n' +
            'Solução Efetiva: ' + (copsResultado?.solucao_efetiva || '') +
            historicoStr +
            '\n\nINSTRUÇÃO DE REFINAMENTO:\n' + instrucao +
            '\n\nContexto adicional do Suite:\n' + copsBuildContext();

        const resposta = await window.callAI(userPrompt, sysPrompt);

        // Atualizar proposta
        const propostaEl = document.getElementById('cops-proposta-content');
        propostaEl.innerHTML = resposta
            .replace(/```html|```/g,'')
            .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');

        // Registrar no histórico
        copsRefineHistory.push(instrucao);

        // Mostrar histórico
        const histEl = document.getElementById('cops-refine-history');
        const histList = document.getElementById('cops-refine-history-list');
        if (histEl) histEl.classList.remove('hidden');
        if (histList) {
            histList.innerHTML = copsRefineHistory.map((r, i) =>
                '<div class="flex items-start gap-2">' +
                '<span class="text-[9px] font-black text-violet-400 mt-0.5">' + (i+1) + '.</span>' +
                '<span class="text-[10px] text-slate-500 font-medium">' + r + '</span>' +
                '</div>'
            ).join('');
        }

        // Limpar campo
        const inputEl = document.getElementById('cops-refine-input');
        if (inputEl) inputEl.value = '';

        window.showToast('Proposta refinada! ✓');

    } catch(e) {
        window.showToast('Erro no refinamento: ' + e.message, 'warning');
    } finally {
        if (icon) icon.textContent = '✨';
        if (txt)  txt.textContent  = 'Refinar com IA';
    }
};

// Limpar histórico de refinamento ao resetar
const _origCopsReset = window.copsReset;
window.copsReset = function() {
    copsRefineHistory = [];
    _origCopsReset();
    const histEl = document.getElementById('cops-refine-history');
    if (histEl) histEl.classList.add('hidden');
};

// Atualizar campo COPS quando usuário edita manualmente
window.copsUpdateField = function(field, val) {
    if (!copsResultado) return;
    copsResultado[field] = val;
};

// Refinar campo específico com IA
window.copsRefinarCampo = async function(campo) {
    if (!copsResultado) return;
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações.', 'warning');
        return;
    }

    const campoLabels = {
        contexto: 'Contexto', ocorrencia: 'Ocorrência',
        problema: 'Problema Real', solucao_imaginada: 'Solução Imaginada',
        solucao_efetiva: 'Solução Efetiva FNW'
    };

    const instrucao = prompt('Como refinar o campo "' + campoLabels[campo] + '"?\nEx: "Seja mais específico", "Inclua dados do portfólio", "Foco no público 50+"');
    if (!instrucao) return;

    window.showToast('Refinando campo...');

    try {
        const sysPrompt = 'Você é um Estrategista Sênior FNW. Reescreva APENAS o campo solicitado do diagnóstico COPS, aplicando a instrução dada. Responda SOMENTE com o texto do campo, sem explicações.';
        const userPrompt = 'COPS completo:\n' +
            'C: ' + copsResultado.contexto + '\n' +
            'O: ' + copsResultado.ocorrencia + '\n' +
            'P: ' + copsResultado.problema + '\n' +
            'S1: ' + copsResultado.solucao_imaginada + '\n' +
            'S2: ' + copsResultado.solucao_efetiva + '\n\n' +
            copsBuildContext() + '\n\n' +
            'Reescreva APENAS o campo "' + campoLabels[campo] + '" aplicando: ' + instrucao;

        const resposta = await window.callAI(userPrompt, sysPrompt);
        const novoValor = resposta.replace(/```/g,'').trim();

        copsResultado[campo] = novoValor;
        const el = document.getElementById('cops-' + campo.replace('_','-'));
        if (el) {
            el.value = novoValor;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
        window.showToast('Campo refinado! ✓');
    } catch(e) {
        window.showToast('Erro: ' + e.message, 'warning');
    }
};

// Atualizar hipótese manualmente
window.copsUpdateHip = function(idx, field, val) {
    if (!copsResultado || !copsResultado.hipoteses[idx]) return;
    copsResultado.hipoteses[idx][field] = val;
};

// Refinar hipótese individual com IA
window.copsRefinarHip = async function(idx) {
    if (!copsResultado || !copsResultado.hipoteses[idx]) return;
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações.', 'warning');
        return;
    }

    const h = copsResultado.hipoteses[idx];
    const instrucao = prompt(
        'Refinar hipótese "' + h.titulo + '":\n' +
        'Ex: "Seja mais específico nos entregáveis", "Aproxime do contexto do cliente", "Inclua prazo estimado", "Foque no ROI"'
    );
    if (!instrucao) return;

    window.showToast('Refinando hipótese...');

    try {
        const sysPrompt = 'Você é um Estrategista Sênior FNW. Reescreva a hipótese de entrega aplicando a instrução. Responda APENAS em JSON com: {"titulo": "...", "descricao": "..."}';
        const userPrompt =
            'COPS:\nP: ' + copsResultado.problema + '\nS2: ' + copsResultado.solucao_efetiva + '\n\n' +
            'Hipótese atual:\nTítulo: ' + h.titulo + '\nDescrição: ' + h.descricao + '\nTipo: ' + h.tipo + '\n\n' +
            copsBuildContext() + '\n\n' +
            'Instrução: ' + instrucao;

        const resposta = await window.callAI(userPrompt, sysPrompt);
        const clean = resposta.replace(/```json|```/g,'').trim();
        const parsed = JSON.parse(clean);

        if (parsed.titulo) copsResultado.hipoteses[idx].titulo = parsed.titulo;
        if (parsed.descricao) copsResultado.hipoteses[idx].descricao = parsed.descricao;

        // Atualizar UI
        const wrapper = document.querySelector('.cops-hip-wrapper-' + idx);
        if (wrapper) {
            const inputTitulo = wrapper.querySelector('input');
            const taDesc = wrapper.querySelector('textarea');
            if (inputTitulo) inputTitulo.value = parsed.titulo || h.titulo;
            if (taDesc) taDesc.value = parsed.descricao || h.descricao;
        }
        window.showToast('Hipótese refinada! ✓');
    } catch(e) {
        window.showToast('Erro: ' + e.message, 'warning');
    }
};

// =========================================================================
// COPS Engine — Biblioteca de Entregáveis FNW
// =========================================================================

const copsEntregaveisFNW = [
    // ── Assessoria & Estratégia ──────────────────────────────────────────
    { id: 'e1',  grupo: 'Plataforma',     texto: 'Seleção, Definição e Configuração de Plataforma base para o HUB Educacional com Comunidade e Interações entre membros participantes' },
    { id: 'e2',  grupo: 'Conteúdo',       texto: 'Plano de otimização de produção de conteúdo' },
    { id: 'e3',  grupo: 'Conteúdo',       texto: 'Sessões de Alinhamento, Refinamento e Controle de Qualidade do Conteúdo' },
    { id: 'e4',  grupo: 'Marketing',      texto: 'Plano de desenvolvimento de Marketing Digital' },
    { id: 'e5',  grupo: 'Vendas',         texto: 'Plano de estrutura e estratégia de vendas' },
    { id: 'e6',  grupo: 'Implementação',  texto: 'Implementação, medição e ajustes do ecossistema (Plataforma, Marketing Digital, Vendas)' },
    { id: 'e7',  grupo: 'Acompanhamento', texto: 'Acompanhamento com reuniões semanais, quinzenais ou a cada 21 dias (conforme orçamento)' },
    { id: 'e8',  grupo: 'Tecnologia',     texto: 'Acesso 24/7 à nossa plataforma proprietária de acompanhamento de atualizações' },
    { id: 'e9',  grupo: 'Tecnologia',     texto: 'Acesso 24/7 ao Sistema interativo com atualizações da evolução da assessoria consultiva no NotebookLM (Google) configurado pela assessoria e disponibilizado com exclusividade para as partes interessadas' },
    // ── Ferramentas GERiAH Suite ─────────────────────────────────────────
    { id: 't1',  grupo: 'GERiAH Suite',   texto: 'Acesso ao GERiAH Suite — sistema operacional de gestão de assessoria com CRM, Agenda Ciclométrica e Foco por contextos' },
    { id: 't2',  grupo: 'GERiAH Suite',   texto: 'Diagnóstico de Perfil Estratégico com PUV Audit — análise estruturada por pilares com score, personas e plano de ação personalizado' },
    { id: 't3',  grupo: 'GERiAH Suite',   texto: 'Sessão de PUV Score — diagnóstico da Proposta Única de Valor com geração de posicionamento diferenciado' },
    { id: 't4',  grupo: 'GERiAH Suite',   texto: 'Análise COPS — estruturação de qualquer situação em Contexto, Ocorrência, Problema, Solução Imaginada e Solução Efetiva com geração de proposta' },
    { id: 't5',  grupo: 'GERiAH Suite',   texto: 'Business Plan integrado — planejamento de portfólio, receita máxima, projeção de escala e regra de divisão com múltiplas moedas' },
    { id: 't6',  grupo: 'GERiAH Suite',   texto: 'Esteira de Receita Previsível — mapeamento da jornada LTi→MTi→HTi→DUN com Mapa do Tesouro e Máquina de Próxima Venda' },
    { id: 't7',  grupo: 'GERiAH Suite',   texto: 'Assistente GERiAH com IA — consultor estratégico contextualizado com todos os dados do cliente para suporte contínuo' },
    { id: 't8',  grupo: 'GERiAH Suite',   texto: 'Acesso à Comunidade PUVZap — grupo exclusivo de suporte, atualizações e troca entre membros da assessoria FNW' },
];

let copsEntregaveisSelecionados = new Set();
let copsEntregaveisAberto = false;

const grupoColors = {
    'Plataforma': 'bg-blue-100 text-blue-700',
    'Conteúdo': 'bg-amber-100 text-amber-700',
    'Marketing': 'bg-pink-100 text-pink-700',
    'Vendas': 'bg-emerald-100 text-emerald-700',
    'Implementação': 'bg-violet-100 text-violet-700',
    'Acompanhamento': 'bg-indigo-100 text-indigo-700',
    'Tecnologia': 'bg-slate-100 text-slate-600',
    'GERiAH Suite': 'bg-violet-100 text-violet-700'
};

window.copsToggleEntregaveis = function() {
    const listEl = document.getElementById('cops-entregaveis-list');
    const btn = document.getElementById('cops-entregaveis-toggle');
    copsEntregaveisAberto = !copsEntregaveisAberto;

    if (copsEntregaveisAberto) {
        // Renderizar lista
        listEl.innerHTML = copsEntregaveisFNW.map(e => `
            <div onclick="window.copsToggleEntregavel('${e.id}')" id="cops-e-${e.id}"
                class="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${copsEntregaveisSelecionados.has(e.id) ? 'bg-emerald-900/40 border border-emerald-500/40' : 'bg-white/5 border border-white/10 hover:bg-white/10'}">
                <div class="w-4 h-4 rounded border-2 ${copsEntregaveisSelecionados.has(e.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'} flex items-center justify-center flex-shrink-0 mt-0.5 transition-all">
                    ${copsEntregaveisSelecionados.has(e.id) ? '<svg width="10" height="10" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="white" stroke-width="2" fill="none"/></svg>' : ''}
                </div>
                <div class="flex-1">
                    <span class="text-[8px] font-black px-2 py-0.5 rounded-full mr-1 ${grupoColors[e.grupo]||'bg-slate-100 text-slate-600'}">${e.grupo}</span>
                    <p class="text-[11px] text-slate-300 font-medium leading-relaxed mt-1">${e.texto}</p>
                </div>
            </div>`).join('');
        listEl.classList.remove('hidden');
        if (btn) btn.textContent = '▲ Recolher';
    } else {
        listEl.classList.add('hidden');
        if (btn) btn.textContent = '▼ Ver todos';
    }
};

window.copsToggleEntregavel = function(id) {
    if (copsEntregaveisSelecionados.has(id)) {
        copsEntregaveisSelecionados.delete(id);
    } else {
        copsEntregaveisSelecionados.add(id);
    }
    // Atualizar visual do item
    if (copsEntregaveisAberto) window.copsToggleEntregaveis(); // re-render fechando
    window.copsToggleEntregaveis(); // re-render abrindo
    // Atualizar resumo dos selecionados
    copsRenderEntregaveisSelecionados();
};

function copsRenderEntregaveisSelecionados() {
    const el = document.getElementById('cops-entregaveis-selected');
    const emptyEl = document.getElementById('cops-entregaveis-empty');
    if (!el) return;

    const selecionados = copsEntregaveisFNW.filter(e => copsEntregaveisSelecionados.has(e.id));

    if (selecionados.length === 0) {
        el.innerHTML = '<p id="cops-entregaveis-empty" class="text-[9px] text-slate-500 italic">Nenhum selecionado — clique em "Ver todos".</p>';
        return;
    }

    el.innerHTML = '<p class="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">' + selecionados.length + ' entregável(is) selecionado(s):</p>' +
        selecionados.map(e => `
            <div class="flex items-start gap-2">
                <span class="text-emerald-400 text-xs mt-0.5">✓</span>
                <p class="text-[10px] text-slate-300 font-medium leading-relaxed">${e.texto}</p>
            </div>`).join('');
}

// Limpar entregáveis ao resetar
const _origCopsResetEnt = window.copsReset;
window.copsReset = function() {
    copsEntregaveisSelecionados = new Set();
    copsEntregaveisAberto = false;
    _origCopsResetEnt();
};

// Incluir entregáveis no prompt de geração de proposta
const _origCopsGerarProposta = window.copsGerarProposta;
window.copsGerarProposta = async function() {
    // Injetar entregáveis no copsResultado antes de chamar
    const selecionados = copsEntregaveisFNW.filter(e => copsEntregaveisSelecionados.has(e.id));
    if (selecionados.length > 0 && copsResultado) {
        copsResultado._entregaveis = selecionados.map(e => e.texto);
    }
    await _origCopsGerarProposta();
};

// =========================================================================
// COPS Engine — Suite MetaIntel: ferramentas recomendadas por contexto
// =========================================================================

// Catálogo completo de ferramentas da Suite — extensível
const suiteFerramentas = [
    {
        id: 'bp',         nome: 'Business Plan',       icone: '📊', grupo: 'Estratégia',
        desc: 'Portfólio, receita máxima e projeção de escala',
        triggers: ['receita', 'faturamento', 'produto', 'escala', 'portfólio', 'preço', 'monetiz', 'crescimento', 'plano de negócio', 'precificação']
    },
    {
        id: 'esteira',    nome: 'Receita Previsível',   icone: '🗺️', grupo: 'Estratégia',
        desc: 'Jornada LTi→MTi→HTi→DUN e próxima venda',
        triggers: ['jornada', 'funil', 'ltv', 'ticket', 'upsell', 'esteira', 'conversão', 'próxima venda', 'produto', 'oferta']
    },
    {
        id: 'crm',        nome: 'CRM',                  icone: '👥', grupo: 'Operacional',
        desc: 'Leads, score, follow-up e pipeline',
        triggers: ['lead', 'cliente', 'prospect', 'follow', 'pipeline', 'relacionamento', 'contato', 'venda', 'negociação', 'captação']
    },
    {
        id: 'agenda',     nome: 'Agenda',               icone: '📅', grupo: 'Operacional',
        desc: 'Ciclos de atendimento e agendamentos',
        triggers: ['atendimento', 'reunião', 'agenda', 'sessão', 'encontro', 'ciclo', 'frequência', 'recorrência', 'onboarding']
    },
    {
        id: 'puv-audit',  nome: 'PUV Audit',            icone: '📋', grupo: 'Tática',
        desc: 'Diagnóstico da proposta única de valor',
        triggers: ['posicionamento', 'diferencial', 'bio', 'marca', 'identidade', 'autoridade', 'proposta de valor', 'puv', 'perfil', 'instagram', 'linkedin', 'comunicação']
    },
    {
        id: 'assistente', nome: 'Assistente GERiAH',    icone: '🧠', grupo: 'Operacional',
        desc: 'Diagnóstico profundo e ações com IA',
        triggers: ['estratégia', 'direcionamento', 'próximos passos', 'decisão', 'planejamento', 'orientação', 'como fazer', 'dúvida']
    },
    {
        id: 'monitor',    nome: 'Foco',                 icone: '🎯', grupo: 'Operacional',
        desc: 'Contextos, fases e pilares de projeto',
        triggers: ['projeto', 'fase', 'contexto', 'gestão', 'acompanhamento', 'implementação', 'ativação', 'progresso']
    }
];

let copsFerramentasSelecionadas = new Set();
let copsTodasVisiveis = false;

function copsDetectarFerramentas(resultado) {
    if (!resultado) return [];
    const texto = [
        resultado.contexto, resultado.ocorrencia, resultado.problema,
        resultado.solucao_efetiva,
        (resultado.hipoteses||[]).map(h => h.titulo + ' ' + h.descricao).join(' ')
    ].join(' ').toLowerCase();

    return suiteFerramentas.filter(f =>
        f.triggers.some(t => texto.includes(t))
    );
}

function copsInsightEsteira() {
    // Verificar se o contexto ativo tem esteira e sugerir conexões
    const ctx = document.getElementById('selectComunidade')?.value;
    if (!ctx || ctx === 'null') return null;
    const estS = appState.esteiraData?.[ctx];
    if (!estS || !estS.products || estS.products.length === 0) return null;

    const insights = [];
    const faixas = { 'esteira-lti': 'Low Ticket', 'esteira-mti': 'Mid Ticket', 'esteira-hti': 'High Ticket', 'esteira-dun': 'DUN' };

    estS.products.forEach(p => {
        const faixa = faixas[p.columnId] || p.columnId;
        insights.push('<span class="text-[10px] font-bold text-indigo-700">• ' + p.title + '</span> <span class="text-[9px] text-indigo-400">(' + faixa + ' · R$ ' + p.price + ')</span>');
    });

    return insights;
}

function copsRenderFerramentas(resultado) {
    const container = document.getElementById('cops-suite-tools');
    const list = document.getElementById('cops-suite-tools-list');
    if (!container || !list) return;

    const recomendadas = copsDetectarFerramentas(resultado);
    const recomIds = new Set(recomendadas.map(f => f.id));

    // Pré-selecionar recomendadas
    copsFerramentasSelecionadas = new Set(recomendadas.map(f => f.id));

    // Renderizar apenas recomendadas inicialmente
    const paraRenderizar = copsTodasVisiveis ? suiteFerramentas : recomendadas;

    list.innerHTML = paraRenderizar.map(f => {
        const isRec = recomIds.has(f.id);
        const isSel = copsFerramentasSelecionadas.has(f.id);
        return `
        <div class="flex items-center gap-3 bg-white border ${isSel ? 'border-indigo-400 bg-indigo-50/50' : 'border-indigo-100'} rounded-xl px-4 py-3 transition-all">
            <input type="checkbox" id="cops-tool-${f.id}" ${isSel ? 'checked' : ''}
                onchange="window.copsToggleFerramentaSel('${f.id}', this.checked)"
                class="w-4 h-4 accent-indigo-600 cursor-pointer flex-shrink-0">
            <label for="cops-tool-${f.id}" class="flex-1 flex items-center gap-3 cursor-pointer">
                <span class="text-xl">${f.icone}</span>
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <p class="text-xs font-black text-slate-800">${f.nome}</p>
                        ${isRec ? '<span class="text-[8px] font-black text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded">✨ sugerida</span>' : ''}
                        <span class="text-[8px] font-bold text-slate-300">${f.grupo}</span>
                    </div>
                    <p class="text-[10px] text-slate-400 font-medium">${f.desc}</p>
                </div>
            </label>
            <button onclick="window.acoesAbrirFerramenta('${f.id === 'monitor' ? 'monitor' : f.id}')"
                class="text-[9px] font-black text-indigo-500 hover:text-indigo-700 transition-all px-2">→</button>
        </div>`;
    }).join('');

    // Insight da Esteira
    const insights = copsInsightEsteira();
    const insightEl = document.getElementById('cops-esteira-insight');
    const insightContent = document.getElementById('cops-esteira-insight-content');
    if (insights && insights.length > 0 && insightEl && insightContent) {
        insightContent.innerHTML = '<p class="text-[10px] text-indigo-500 font-medium mb-2">O contexto ativo tem ' + insights.length + ' produto(s) na esteira que podem ser posicionados nesta proposta:</p>' +
            insights.join('<br>') +
            '<button onclick="window.acoesAbrirFerramenta(&quot;esteira&quot;)" class="mt-2 text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition-all block">Ver Esteira →</button>';
        insightEl.classList.remove('hidden');
        // Auto-selecionar esteira se tiver produtos
        copsFerramentasSelecionadas.add('esteira');
        const cbEsteira = document.getElementById('cops-tool-esteira');
        if (cbEsteira) cbEsteira.checked = true;
    }

    container.classList.remove('hidden');
}

window.copsToggleFerramentaSel = function(id, checked) {
    if (checked) copsFerramentasSelecionadas.add(id);
    else copsFerramentasSelecionadas.delete(id);
};

window.copsToggleTodasFerramentas = function() {
    copsTodasVisiveis = !copsTodasVisiveis;
    const btn = document.getElementById('cops-tools-toggle');
    if (btn) btn.textContent = copsTodasVisiveis ? '− Ver menos' : '+ Ver todas';
    if (copsResultado) copsRenderFerramentas(copsResultado);
};

window.copsAbrirFerramentasSelecionadas = function() {
    const selecionadas = [...copsFerramentasSelecionadas];
    if (selecionadas.length === 0) {
        window.showToast('Selecione pelo menos uma ferramenta.', 'warning');
        return;
    }
    // Abrir a primeira direto, notificar sobre as demais
    const primeira = selecionadas[0];
    window.acoesAbrirFerramenta(primeira === 'monitor' ? 'monitor' : primeira);
    if (selecionadas.length > 1) {
        window.showToast(selecionadas.length + ' ferramentas selecionadas — use o menu para alternar entre elas.');
    }
};

// Chamar após gerar o COPS
const _origCopsGenEnd = window.copsGenerate;
window.copsGenerate = async function() {
    await _origCopsGenEnd();
    if (copsResultado) {
        copsTodasVisiveis = false;
        copsRenderFerramentas(copsResultado);
    }
};

// =========================================================================
// AÇÕES — Simulador de Proposta (integrado ao GERiAH Suite)
// =========================================================================

const simFmt = (v) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v);

// Blocos dinâmicos — substituídos pelo BP ou COPS quando disponíveis
let simBlocos = [
    { id:'s1', nome:'Organização da base comercial',    desc:'Pipeline, scripts, CRM e coleta de informações de clientes',            valor:4000, checked:true  },
    { id:'s2', nome:'Geração de leads qualificados',    desc:'Definição do cliente ideal, tratamento de listas e prospecção ativa',    valor:4000, checked:false },
    { id:'s3', nome:'Desenvolvimento e nutrição',       desc:'Primeiros contatos, qualificação de leads (MQL, PQL) e acompanhamento', valor:4000, checked:false },
    { id:'s4', nome:'Fechamento e gestão de vendas',    desc:'Negociação, gestão de objeções e conversão em contratos',                valor:4000, checked:false },
];

function simGetRadio(name) {
    return document.querySelector('input[name="' + name + '"]:checked')?.value;
}

function simRenderBlocos() {
    const list = document.getElementById('sim-blocos-list');
    if (!list) return;
    const n = simBlocos.filter(b => b.checked).length;
    const allChecked = n === simBlocos.length && simBlocos.length >= 2;
    const valorUnit = allChecked ? 3500 : 4000;

    list.innerHTML = simBlocos.map((b, i) => `
        <div onclick="window.simToggleBloco(${i})"
            class="checklist-item flex items-start gap-3 p-4 bg-white rounded-2xl border-2 ${b.checked ? 'border-indigo-500 bg-indigo-50/60 checked' : 'border-slate-100'} cursor-pointer hover:border-indigo-300 transition-all">
            <div class="w-6 h-6 rounded-full border-2 ${b.checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'} flex items-center justify-center flex-shrink-0 mt-0.5 transition-all">
                ${b.checked ? '<svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="white" stroke-width="2.5" fill="none"/></svg>' : ''}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-black text-slate-800">${b.nome}</p>
                <p class="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">${b.desc}</p>
                <p class="text-[10px] font-black text-indigo-600 mt-1">${b.checked ? simFmt(valorUnit) : '—'}</p>
            </div>
        </div>`).join('');

    // Label preço
    const pl = document.getElementById('sim-preco-label');
    if (pl) pl.textContent = allChecked
        ? 'Pacote completo: R$ 3.500/bloco (desconto aplicado)'
        : 'R$ 4.000/bloco individual · todos = R$ 3.500 cada';
}

window.simToggleBloco = function(idx) {
    simBlocos[idx].checked = !simBlocos[idx].checked;
    simRenderBlocos();
    simAtualizar();
};

function simAtualizar() {
    const checked = simBlocos.filter(b => b.checked);
    const n = checked.length;
    const allChecked = n === simBlocos.length && simBlocos.length >= 2;
    const valorUnit = allChecked ? 3500 : 4000;
    const valorBlocos = n > 0 ? (allChecked ? 3500 * n : 4000 * n) : 0;

    // Comissionamento
    const modelo = simGetRadio('sim_commission') || 'padrao';
    const { percRec, percImp } = modelo === 'acelerado' ? { percRec:0.08, percImp:0.25 }
                                : modelo === 'premium'   ? { percRec:0.12, percImp:0.30 }
                                :                         { percRec:0.05, percImp:0.20 };

    const implPorRede   = parseFloat(document.getElementById('sim-implantacao')?.value)  || 20000;
    const cenario       = simGetRadio('sim_mensalidade') || 'cheia';
    const mensPorUnidade = cenario === 'negociada' ? 5525 : 6500;
    const unidadesPorRede = parseInt(document.getElementById('sim-unidades')?.value) || 3;
    const numRedes      = parseInt(simGetRadio('sim_redes') || '0');
    const periodo       = parseInt(simGetRadio('sim_periodo') || '12');

    const totalImpl  = numRedes * implPorRede;
    const totalMens  = numRedes * unidadesPorRede * mensPorUnidade;
    const fatTotal   = totalImpl + totalMens;
    const comImp     = totalImpl * percImp;
    const comRec     = totalMens * percRec;
    const totalPer   = comImp + (comRec * periodo) + valorBlocos;

    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    // Header sticky
    s('sim-q-blocos',    n);
    s('sim-q-val-blocos', simFmt(valorBlocos));
    s('sim-q-com-imp',   simFmt(comImp));
    s('sim-q-com-rec',   simFmt(comRec));
    s('sim-q-total',     simFmt(comImp + comRec + valorBlocos));

    // Resultado detalhado
    s('sim-r-implantacao',    simFmt(totalImpl));
    s('sim-r-mensalidade',    simFmt(totalMens));
    s('sim-r-fat-total',      simFmt(fatTotal));
    s('sim-r-com-imp',        simFmt(comImp));
    s('sim-r-com-rec',        simFmt(comRec));
    s('sim-r-blocos',         simFmt(valorBlocos));
    s('sim-r-total-periodo',  simFmt(totalPer));
    s('sim-r-periodo-label',  periodo + ' meses');
    s('sim-r-detalhe-blocos', n + (allChecked ? ' bloco(s) — R$ 3.500 cada (pacote)' : ' bloco(s) — R$ 4.000 cada'));

    // Mensagem blocos
    const msg = n === 0 ? 'Nenhum bloco contratado.'
        : allChecked ? 'Pacote completo! Desconto de R$ 3.500/bloco aplicado.'
        : n + ' bloco(s) contratado(s) por R$ 4.000 cada.';
    s('sim-blocos-count', n + ' de ' + simBlocos.length);
    s('sim-blocos-msg', msg);

    // Resumo do rodapé
    s('sim-rodape-redes',    numRedes);
    s('sim-rodape-unidades', unidadesPorRede);
    s('sim-rodape-total-u',  numRedes * unidadesPorRede);
    s('sim-rodape-val-u',    simFmt(mensPorUnidade));
    s('sim-rodape-blocos',   n);
}

window.simCalcular = function() { simAtualizar(); };

// Inicializar ao abrir
window.simInit = function() {
    const ctx = document.getElementById('selectComunidade')?.value;
    const ctxNome = (ctx && ctx !== 'null') ? ctx : null;

    const label = document.getElementById('sim-ctx-label');
    if (label) label.textContent = ctxNome ? '📍 ' + ctxNome : 'Sem contexto — selecione no Foco';

    // Tentar carregar do Business Plan
    if (ctxNome) {
        const bpS = appState.bpData?.[ctxNome];
        if (bpS?.portfolio?.length > 0) {
            simBlocos = bpS.portfolio.map((p, i) => ({
                id:'bp_'+i, nome:p.name,
                desc:(p.capacity||'') + ' ' + (p.unit||''),
                valor:parseFloat(p.price)||4000, checked:i===0
            }));
        }
    }

    simRenderBlocos();
    simAtualizar();
};

// Carregar blocos do COPS ativo
window.simCarregarDoCOPS = function() {
    if (!copsResultado?.hipoteses?.length) {
        window.showToast('Nenhum diagnóstico COPS ativo.', 'warning'); return;
    }
    simBlocos = copsResultado.hipoteses.map((h, i) => ({
        id:'cops_'+i, nome:h.titulo, desc:h.descricao, valor:4000, checked:false
    }));
    simRenderBlocos();
    simAtualizar();
    window.showToast('Blocos carregados do COPS! ✓');
};

// Gerar resumo em texto
window.simGerarResumoTexto = function() {
    const checked = simBlocos.filter(b => b.checked);
    const modelo  = simGetRadio('sim_commission') || 'padrao';
    const nomes   = { padrao:'Padrão (5%+20%)', acelerado:'Acelerado (8%+25%)', premium:'Premium (12%+30%)' };
    const periodo = simGetRadio('sim_periodo') || '12';
    const ctx     = document.getElementById('selectComunidade')?.value;
    const ctxNome = (ctx && ctx !== 'null') ? ctx : 'Cliente';

    const tPer  = document.getElementById('sim-r-total-periodo')?.textContent || '';
    const fat   = document.getElementById('sim-r-fat-total')?.textContent || '';
    const cImp  = document.getElementById('sim-r-com-imp')?.textContent || '';
    const cRec  = document.getElementById('sim-r-com-rec')?.textContent || '';
    const vBloc = document.getElementById('sim-r-blocos')?.textContent || '';

    const blocosTxt = checked.length > 0
        ? checked.map((b,i) => (i+1) + '. ' + b.nome + ' — ' + b.desc + ' — ' + simFmt(b.valor)).join('\n')
        : 'Nenhum';

    const texto = [
        'SIMULAÇÃO DE PROPOSTA — GERiAH Suite',
        'Cliente: ' + ctxNome,
        '',
        'Modelo de Comissão: ' + nomes[modelo],
        'Período: ' + periodo + ' meses',
        '',
        'BLOCOS SELECIONADOS:',
        blocosTxt,
        '',
        'Faturamento Mês 1: ' + fat,
        'Comissão Implantação: ' + cImp,
        'Comissão Recorrência: ' + cRec,
        'Blocos: ' + vBloc,
        'Total Assessoria no Período (' + periodo + ' meses): ' + tPer
    ].join('\n');

    const el = document.getElementById('sim-resumo');
    if (el) el.value = texto;
};

// Gerar resumo com IA
window.simGerarResumoIA = async function() {
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações.', 'warning'); return;
    }
    const checked = simBlocos.filter(b => b.checked);
    if (!checked.length) { window.showToast('Selecione pelo menos um bloco.', 'warning'); return; }

    window.showToast('Gerando resumo com IA...');
    try {
        const ctx     = document.getElementById('selectComunidade')?.value;
        const ctxNome = (ctx && ctx !== 'null') ? ctx : 'Cliente';
        const tPer    = document.getElementById('sim-r-total-periodo')?.textContent;
        const modelo  = simGetRadio('sim_commission') || 'padrao';
        const nomes   = { padrao:'Padrão', acelerado:'Acelerado', premium:'Premium' };

        const prompt = [
            'Gere um resumo executivo de proposta de assessoria para ' + ctxNome + '.',
            'Blocos contratados: ' + checked.map(b => b.nome).join(', '),
            'Modelo: ' + nomes[modelo],
            'Investimento total no período: ' + tPer,
            'Seja direto, empático e orientado a resultado. Máximo 3 parágrafos.'
        ].join('\n');

        const resp = await window.callAI(prompt,
            'Você é um consultor sênior FNW. Escreva resumos de proposta claros, profissionais e persuasivos.');
        const el = document.getElementById('sim-resumo');
        if (el) el.value = resp.replace(/```/g,'').trim();
        window.showToast('Resumo gerado! ✓');
    } catch(e) { window.showToast('Erro: ' + e.message, 'warning'); }
};

window.simCopiarResumo = function() {
    const el = document.getElementById('sim-resumo');
    if (el?.value) navigator.clipboard.writeText(el.value).then(() => window.showToast('Resumo copiado!'));
};

window.simExportarPDF = function() { window.print(); };


// =========================================================================
// Simulador — Gerador de HTML personalizado para o cliente
// =========================================================================

window.simGerarHTMLCliente = async function() {
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações.', 'warning'); return;
    }

    const ctxCliente = document.getElementById('sim-ctx-cliente')?.value?.trim();
    if (!ctxCliente || ctxCliente.length < 20) {
        window.showToast('Descreva o contexto do cliente primeiro.', 'warning'); return;
    }

    const icon = document.getElementById('sim-gerar-html-icon');
    const txt  = document.getElementById('sim-gerar-html-text');
    if (icon) icon.textContent = '⏳';
    if (txt)  txt.textContent  = 'Gerando...';

    try {
        // Coletar dados atuais do simulador
        const ctx     = document.getElementById('selectComunidade')?.value;
        const ctxNome = (ctx && ctx !== 'null') ? ctx : 'Cliente';
        const blocosSel = simBlocos.filter(b => b.checked);
        const todosB  = simBlocos;

        // Pedir à IA para adaptar os blocos e textos ao contexto do cliente
        const sysPrompt = [
            'Você é um especialista em propostas comerciais da FNW Assessoria.',
            'Gere uma estrutura JSON para um simulador de proposta self-service personalizado para o cliente.',
            'Responda APENAS em JSON válido, sem explicações, sem markdown.'
        ].join(' ');

        const bpS = appState.bpData?.[ctx];
        const portfolioStr = bpS?.portfolio?.length > 0
            ? 'Portfólio FNW: ' + bpS.portfolio.map(p => p.name + ' R$' + p.price).join(', ')
            : '';

        const userPrompt = [
            'CONTEXTO DO CLIENTE: ' + ctxCliente,
            'ASSESSOR: ' + ctxNome,
            portfolioStr,
            'BLOCOS DISPONÍVEIS: ' + todosB.map(b => b.nome + ' — ' + b.desc + ' (R$' + b.valor + ')').join(' | '),
            '',
            'Gere JSON com esta estrutura exata:',
            '{',
            '  "titulo": "Título da proposta adaptado ao cliente",',
            '  "subtitulo": "Subtítulo contextualizado",',
            '  "frase_impacto": "Frase de impacto personalizada (máx 20 palavras)",',
            '  "assessor": "' + ctxNome + '",',
            '  "validade": "30 dias",',
            '  "blocos": [',
            '    {"nome": "...", "desc": "...", "valor": 4000, "destaque": false}',
            '  ],',
            '  "implantacao_por_rede": 20000,',
            '  "mensalidade_cheia": 6500,',
            '  "mensalidade_negociada": 5525,',
            '  "desconto_pacote_completo": true,',
            '  "valor_pacote": 3500,',
            '  "modelos_comissao": [',
            '    {"nome": "Padrão", "rec": 5, "imp": 20, "desc": "...contexto..."},',
            '    {"nome": "Acelerado", "rec": 8, "imp": 25, "desc": "...contexto..."},',
            '    {"nome": "Premium", "rec": 12, "imp": 30, "desc": "...contexto..."}',
            '  ],',
            '  "resumo_intro": "Texto de introdução personalizado para este cliente (2-3 frases)"',
            '}'
        ].join('\n');

        const resposta = await window.callAI(userPrompt, sysPrompt);
        const clean = resposta.replace(/```json|```/g, '').trim();
        const dados = JSON.parse(clean);

        // Gerar HTML standalone
        const htmlFinal = simGerarHTMLStandalone(dados);

        // Download
        const nome = (ctxNome + '_proposta').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
        const blob = new Blob([htmlFinal], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'geriah_proposta_' + nome + '.html';
        a.click();

        window.showToast('HTML gerado e baixado! Envie ao cliente. ✓');

    } catch(e) {
        window.showToast('Erro: ' + e.message, 'warning');
    } finally {
        if (icon) icon.textContent = '✨';
        if (txt)  txt.textContent  = 'Gerar Simulador Personalizado (HTML)';
    }
};

function simGerarHTMLStandalone(d) {
    const blocos = d.blocos || [];
    const modelos = d.modelos_comissao || [
        { nome:'Padrão', rec:5, imp:20, desc:'Sem prospecção ativa' },
        { nome:'Acelerado', rec:8, imp:25, desc:'Com prospecção ativa' },
        { nome:'Premium', rec:12, imp:30, desc:'Prospecção ativa + SDR' }
    ];
    const logoURL = 'https://geriah-suite.vercel.app/logo.png';

    const blocosHTML = blocos.map((b, i) => `
        <div class="bloco-item ${b.destaque ? 'destaque' : ''}" onclick="toggleBloco(this)" data-idx="${i}" data-valor="${b.valor}">
            <div class="bloco-check" id="check-${i}"></div>
            <div class="bloco-body">
                <h3>${b.nome}</h3>
                <p>${b.desc}</p>
                <span class="bloco-valor">R$ ${Number(b.valor).toLocaleString('pt-BR')}</span>
            </div>
        </div>`).join('');

    const modelosHTML = modelos.map((m, i) => `
        <label class="modelo-item ${i===0?'selecionado':''}">
            <input type="radio" name="modelo" value="${i}" ${i===0?'checked':''} onchange="calcular()">
            <div>
                <strong>${m.nome} — ${m.rec}% recorrência + ${m.imp}% implantação</strong>
                <span>${m.desc}</span>
            </div>
        </label>`).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${d.titulo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:#f3f4f6;color:#1e293b}
  header{background:linear-gradient(135deg,#1e1b4b,#312e81);color:white;padding:2rem;text-align:center}
  header img{height:48px;margin-bottom:1rem;filter:brightness(0) invert(1)}
  header h1{font-size:1.8rem;font-weight:900;letter-spacing:-0.03em;margin-bottom:.5rem}
  header p{opacity:.8;font-size:.9rem}
  .sticky-bar{position:sticky;top:0;z-index:100;background:rgba(30,27,75,.92);backdrop-filter:blur(12px);color:white;padding:1rem 2rem;display:flex;gap:2rem;flex-wrap:wrap;justify-content:center}
  .sticky-item{text-align:center}.sticky-item label{font-size:.65rem;opacity:.7;display:block;text-transform:uppercase}
  .sticky-item span{font-size:1.4rem;font-weight:900}
  .sticky-item span.destaque{color:#fde047}
  main{max-width:900px;margin:0 auto;padding:2rem;display:flex;flex-direction:column;gap:2rem}
  .card{background:white;border-radius:1.5rem;padding:2rem;box-shadow:0 4px 20px rgba(0,0,0,.08)}
  .card h2{font-size:1.3rem;font-weight:900;margin-bottom:1rem;color:#1e1b4b}
  .intro-box{background:#ede9fe;border-left:4px solid #7c3aed;padding:1.2rem 1.5rem;border-radius:.75rem;font-style:italic;color:#4c1d95;margin-bottom:1.5rem}
  .bloco-item{display:flex;align-items:flex-start;gap:1rem;padding:1rem;border:2px solid #e2e8f0;border-radius:1rem;cursor:pointer;transition:all .2s;margin-bottom:.75rem;background:#f8fafc}
  .bloco-item:hover{border-color:#818cf8;background:#eef2ff}
  .bloco-item.ativo{border-color:#4f46e5;background:#eef2ff}
  .bloco-item.destaque{border-color:#f59e0b;background:#fffbeb}
  .bloco-check{width:24px;height:24px;border-radius:50%;border:2px solid #94a3b8;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:all .2s}
  .bloco-item.ativo .bloco-check{background:#4f46e5;border-color:#4f46e5;color:white;font-weight:900;font-size:.8rem}
  .bloco-item.ativo .bloco-check::after{content:'✓'}
  .bloco-body h3{font-weight:800;font-size:1rem;color:#1e293b}
  .bloco-body p{font-size:.85rem;color:#64748b;margin:.3rem 0}
  .bloco-valor{font-size:.8rem;font-weight:800;color:#4f46e5}
  .bloco-info{background:#f1f5f9;border-radius:.75rem;padding:.75rem 1rem;font-size:.85rem;color:#475569;margin-top:.75rem}
  .modelo-item{display:flex;align-items:flex-start;gap:.75rem;padding:1rem;border:2px solid #e2e8f0;border-radius:1rem;cursor:pointer;margin-bottom:.5rem;transition:all .2s}
  .modelo-item:hover{border-color:#818cf8}
  .modelo-item.selecionado{border-color:#4f46e5;background:#eef2ff}
  .modelo-item input{margin-top:3px;flex-shrink:0;accent-color:#4f46e5}
  .modelo-item strong{display:block;font-size:.9rem;color:#1e293b}
  .modelo-item span{font-size:.8rem;color:#64748b}
  .config-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
  @media(max-width:600px){.config-grid{grid-template-columns:1fr}}
  .field label{font-size:.75rem;font-weight:700;text-transform:uppercase;color:#64748b;display:block;margin-bottom:.4rem}
  .field input,.field select{width:100%;padding:.75rem;border:2px solid #e2e8f0;border-radius:.75rem;font-size:.95rem;font-weight:600;outline:none;transition:all .2s}
  .field input:focus,.field select:focus{border-color:#4f46e5}
  .periodo-grid{display:flex;gap:.5rem;flex-wrap:wrap}
  .periodo-btn{flex:1;min-width:80px;padding:.75rem;border:2px solid #e2e8f0;border-radius:.75rem;cursor:pointer;text-align:center;font-weight:700;font-size:.85rem;transition:all .2s;background:white}
  .periodo-btn.ativo{border-color:#4f46e5;background:#eef2ff;color:#4f46e5}
  .resultado{background:#0f172a;color:white;border-radius:1.5rem;padding:2rem}
  .resultado h2{color:#fde047;font-weight:900;margin-bottom:1.5rem}
  .result-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem}
  .result-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}
  @media(max-width:600px){.result-grid,.result-grid-4{grid-template-columns:1fr 1fr}}
  .result-box{background:#1e293b;border-radius:1rem;padding:1rem;text-align:center}
  .result-box label{font-size:.65rem;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:.3rem}
  .result-box span{font-size:1rem;font-weight:900;display:block}
  .result-box.destaque{background:#1e3a5f;border:1px solid #3b82f6}
  .result-box.total-periodo{background:#312e81;border:1px solid #6366f1}
  .result-box.total-periodo span{font-size:1.3rem;color:white}
  .rodape-info{font-size:.75rem;color:#64748b;margin-top:1rem;padding-top:1rem;border-top:1px solid #1e293b}
  .btn-confirmar{width:100%;padding:1.2rem;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;border:none;border-radius:1rem;font-size:1rem;font-weight:900;text-transform:uppercase;letter-spacing:.1em;cursor:pointer;transition:all .2s;margin-top:1rem}
  .btn-confirmar:hover{opacity:.9;transform:translateY(-2px)}
  .btn-pdf{width:100%;padding:1rem;background:#0f172a;color:white;border:none;border-radius:1rem;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;margin-top:.5rem}
  .btn-pdf:hover{background:#1e293b}
  footer{text-align:center;padding:2rem;color:#94a3b8;font-size:.8rem}
  @media print{.no-print{display:none!important}body{background:white}.sticky-bar{position:static}}
</style>
</head>
<body>

<header>
  <img src="${logoURL}" alt="GERiAH">
  <h1>${d.titulo}</h1>
  <p>${d.subtitulo} · Validade: ${d.validade}</p>
</header>

<div class="sticky-bar no-print">
  <div class="sticky-item"><label>Blocos</label><span id="s-blocos">0</span></div>
  <div class="sticky-item"><label>Valor Blocos</label><span id="s-val-blocos">R$ 0</span></div>
  <div class="sticky-item"><label>Comissão Imp.</label><span id="s-com-imp">R$ 0</span></div>
  <div class="sticky-item"><label>Comissão Rec.</label><span id="s-com-rec">R$ 0</span></div>
  <div class="sticky-item"><label>Total Mês 1</label><span class="destaque" id="s-total">R$ 0</span></div>
</div>

<main>

  <div class="card">
    <div class="intro-box">${d.resumo_intro}</div>
    <h2>📦 Escolha os Blocos de Estruturação</h2>
    <p style="font-size:.85rem;color:#64748b;margin-bottom:1rem">Marque os blocos que deseja implementar. ${d.desconto_pacote_completo ? 'Se contratar todos, valor especial de R$ ' + Number(d.valor_pacote).toLocaleString('pt-BR') + '/bloco.' : ''}</p>
    ${blocosHTML}
    <div class="bloco-info" id="bloco-info">Nenhum bloco selecionado.</div>
  </div>

  <div class="card">
    <h2>⚡ Modelo de Comissionamento</h2>
    ${modelosHTML}
  </div>

  <div class="card">
    <h2>💰 Configuração Financeira</h2>
    <div class="config-grid" style="margin-bottom:1rem">
      <div class="field"><label>Implantação por rede (R$)</label><input type="number" id="f-impl" value="${d.implantacao_por_rede}" oninput="calcular()"></div>
      <div class="field"><label>Mensalidade por unidade (R$)</label>
        <select id="f-mens" onchange="calcular()">
          <option value="${d.mensalidade_cheia}">Cheio: R$ ${Number(d.mensalidade_cheia).toLocaleString('pt-BR')}</option>
          <option value="${d.mensalidade_negociada}">Negociado: R$ ${Number(d.mensalidade_negociada).toLocaleString('pt-BR')}</option>
        </select>
      </div>
      <div class="field"><label>Unidades por rede</label>
        <select id="f-unid" onchange="calcular()">
          ${[1,2,3,4,5,6,7,8,10].map(n => `<option value="${n}" ${n===3?'selected':''}>${n} unidade${n>1?'s':''}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Redes fechadas por mês</label>
        <select id="f-redes" onchange="calcular()">
          ${[0,1,2,3,4].map(n => `<option value="${n}">${n} rede${n!==1?'s':''}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field"><label>Período do contrato</label>
      <div class="periodo-grid">
        ${[3,6,9,12].map(p => `<div class="periodo-btn ${p===12?'ativo':''}" onclick="setPeriodo(${p},this)">${p} meses</div>`).join('')}
      </div>
    </div>
  </div>

  <div class="resultado">
    <h2>📈 Projeção para o Período</h2>
    <div class="result-grid">
      <div class="result-box"><label>Total Implantação</label><span id="r-impl">R$ 0</span></div>
      <div class="result-box"><label>Total Mensalidade</label><span id="r-mens">R$ 0</span></div>
      <div class="result-box destaque"><label>Faturamento Mês 1</label><span id="r-fat" style="color:#fde047">R$ 0</span></div>
    </div>
    <div class="result-grid-4">
      <div class="result-box"><label>Comissão Imp.</label><span id="r-com-imp">R$ 0</span></div>
      <div class="result-box"><label>Comissão Rec./mês</label><span id="r-com-rec" style="color:#4ade80">R$ 0</span></div>
      <div class="result-box"><label>Blocos</label><span id="r-blocos" style="color:#60a5fa">R$ 0</span></div>
      <div class="result-box total-periodo"><label>Total no Período</label><span id="r-total-per">R$ 0</span><small id="r-per-label" style="color:#fde047;font-size:.7rem">12 meses</small></div>
    </div>
    <div class="rodape-info">
      Redes: <span id="rod-redes">0</span> · Unidades/rede: <span id="rod-unid">3</span> · Total: <span id="rod-total-u">0</span> · Blocos: <span id="rod-blocos">0</span>
    </div>
  </div>

  <div class="card no-print">
    <h2>✅ Confirmar Escolhas</h2>
    <p style="font-size:.85rem;color:#64748b;margin-bottom:1rem">Revise suas escolhas e confirme. Será gerado um PDF com o resumo da sua simulação.</p>
    <textarea id="obs-cliente" rows="3" style="width:100%;padding:.75rem;border:2px solid #e2e8f0;border-radius:.75rem;font-size:.9rem;margin-bottom:1rem;outline:none" placeholder="Observações adicionais (opcional)..."></textarea>
    <button class="btn-confirmar" onclick="confirmarEPDF()">✅ Confirmar Escolhas e Gerar PDF</button>
    <button class="btn-pdf no-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF direto</button>
  </div>

</main>

<footer>© ${new Date().getFullYear()} GERiAH Suite · FNW Assessoria · Proposta gerada para ${d.assessor}</footer>

<script>
const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const blocos = ${JSON.stringify(blocos)};
const modelos = ${JSON.stringify(modelos)};
const descontoPacote = ${d.desconto_pacote_completo};
const valorPacote = ${d.valor_pacote || 3500};
let periodo = 12;
let blsAtivos = new Array(blocos.length).fill(false);

function toggleBloco(el) {
  const idx = parseInt(el.dataset.idx);
  blsAtivos[idx] = !blsAtivos[idx];
  el.classList.toggle('ativo', blsAtivos[idx]);
  calcular();
}

function setPeriodo(p, el) {
  periodo = p;
  document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('ativo'));
  el.classList.add('ativo');
  calcular();
}

function getModelo() {
  const v = parseInt(document.querySelector('input[name=modelo]:checked')?.value || '0');
  return modelos[v] || modelos[0];
}

document.querySelectorAll('.modelo-item').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.modelo-item').forEach(e => e.classList.remove('selecionado'));
    el.classList.add('selecionado');
  });
});

function calcular() {
  const ativos = blocos.filter((b,i) => blsAtivos[i]);
  const n = ativos.length;
  const allC = n === blocos.length && descontoPacote && n >= 2;
  const vUnit = allC ? valorPacote : 4000;
  const vBlocos = n > 0 ? (allC ? valorPacote * n : ativos.reduce((s,b) => s + (b.valor||4000), 0)) : 0;

  const m = getModelo();
  const percRec = m.rec / 100;
  const percImp = m.imp / 100;

  const impl = parseFloat(document.getElementById('f-impl').value) || 0;
  const mens = parseFloat(document.getElementById('f-mens').value) || 0;
  const unid = parseInt(document.getElementById('f-unid').value) || 1;
  const redes = parseInt(document.getElementById('f-redes').value) || 0;

  const tImpl = redes * impl;
  const tMens = redes * unid * mens;
  const fat = tImpl + tMens;
  const cImp = tImpl * percImp;
  const cRec = tMens * percRec;
  const tPer = cImp + (cRec * periodo) + vBlocos;

  const s = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  s('s-blocos', n); s('s-val-blocos', fmt(vBlocos)); s('s-com-imp', fmt(cImp));
  s('s-com-rec', fmt(cRec)); s('s-total', fmt(cImp+cRec+vBlocos));
  s('r-impl', fmt(tImpl)); s('r-mens', fmt(tMens)); s('r-fat', fmt(fat));
  s('r-com-imp', fmt(cImp)); s('r-com-rec', fmt(cRec));
  s('r-blocos', fmt(vBlocos)); s('r-total-per', fmt(tPer));
  s('r-per-label', periodo + ' meses');
  s('rod-redes', redes); s('rod-unid', unid); s('rod-total-u', redes*unid); s('rod-blocos', n);

  const msg = n === 0 ? 'Nenhum bloco selecionado.'
    : allC ? 'Pacote completo! R$ '+valorPacote+'/bloco.'
    : n + ' bloco(s) — R$ 4.000 cada.';
  s('bloco-info', msg);
}

function confirmarEPDF() {
  const ativos = blocos.filter((b,i) => blsAtivos[i]);
  const m = getModelo();
  const obs = document.getElementById('obs-cliente').value;
  const tPer = document.getElementById('r-total-per').textContent;
  const fat  = document.getElementById('r-fat').textContent;

  // Preencher área de confirmação
  const conf = document.getElementById('area-confirmacao');
  if (conf) {
    conf.innerHTML = '<h3>Suas escolhas:</h3>' +
      '<p><strong>Blocos:</strong> ' + (ativos.map(b=>b.nome).join(', ') || 'Nenhum') + '</p>' +
      '<p><strong>Modelo:</strong> ' + m.nome + '</p>' +
      '<p><strong>Faturamento mês 1:</strong> ' + fat + '</p>' +
      '<p><strong>Total assessoria no período:</strong> ' + tPer + '</p>' +
      (obs ? '<p><strong>Observações:</strong> ' + obs + '</p>' : '');
    conf.style.display = 'block';
  }
  setTimeout(() => window.print(), 300);
}

calcular();
<\/script>

<div id="area-confirmacao" style="display:none;background:#f0fdf4;border:2px solid #22c55e;border-radius:1rem;padding:1.5rem;margin:2rem auto;max-width:900px;font-size:.9rem;line-height:1.6"></div>

</body>
</html>`;
}

// =========================================================================
// Simulador — Gerar HTML Self-Service para Cliente
// =========================================================================

window.simGerarHTMLCliente = async function() {
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações.', 'warning');
        return;
    }

    const contexto = document.getElementById('sim-contexto-cliente')?.value?.trim();
    const ctx = document.getElementById('selectComunidade')?.value;
    const ctxNome = (ctx && ctx !== 'null') ? ctx : 'Cliente';

    const icon = document.getElementById('sim-gerar-icon');
    const txt  = document.getElementById('sim-gerar-text');
    if (icon) icon.textContent = '⏳';
    if (txt)  txt.textContent  = 'Gerando simulador...';

    try {
        // Pegar estado atual do simulador como base
        const blocosAtuais = simBlocos.map((b,i) =>
            `Bloco ${i+1}: ${b.nome} | ${b.desc} | R$ ${b.valor}`
        ).join('\n');

        const bpS = appState.bpData?.[ctx];
        const bpInfo = bpS?.portfolio?.length
            ? 'Portfólio: ' + bpS.portfolio.map(p => p.name + ' R$' + p.price).join(', ')
            : '';

        const sysPrompt = `Você é um especialista em propostas comerciais da FNW Assessoria.
Sua tarefa é adaptar um simulador de proposta em HTML para um cliente específico.
Você receberá o contexto do cliente e os blocos atuais, e deve retornar um JSON com as adaptações.
Responda APENAS em JSON válido:
{
  "titulo": "Título personalizado para o cliente",
  "subtitulo": "Subtítulo contextualizado",
  "nome_empresa": "Nome da empresa do cliente",
  "frase_impacto": "Frase de impacto personalizada para o contexto (substitui a genérica)",
  "blocos": [
    {"nome": "Nome do bloco adaptado", "desc": "Descrição adaptada para o contexto", "valor": 4000}
  ],
  "implantacao_valor": 20000,
  "mensalidade_cheia": 6500,
  "mensalidade_negociada": 5525,
  "intro_texto": "Parágrafo de introdução personalizado para o cliente",
  "rodape": "Texto do rodapé personalizado"
}`;

        const userPrompt = [
            'CONTEXTO DO CLIENTE: ' + (contexto || ctxNome),
            bpInfo ? 'PORTFÓLIO FNW: ' + bpInfo : '',
            'BLOCOS ATUAIS:\n' + blocosAtuais,
            'Adapte o simulador para este contexto específico. Mantenha a estrutura mas personalize nomes, descrições, valores e linguagem.'
        ].filter(Boolean).join('\n\n');

        const resposta = await window.callAI(userPrompt, sysPrompt);
        const clean = resposta.replace(/```json|```/g,'').trim();
        const dados = JSON.parse(clean);

        // Gerar HTML standalone
        const htmlGerado = simMontarHTMLCliente(dados, contexto || ctxNome);

        // Download
        const nomeArq = 'proposta_' + (dados.nome_empresa || ctxNome).toLowerCase()
            .replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') + '.html';
        const blob = new Blob([htmlGerado], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nomeArq;
        a.click();

        window.showToast('Simulador gerado! Envie ' + nomeArq + ' para o cliente. ✓');

    } catch(e) {
        window.showToast('Erro: ' + e.message, 'warning');
    } finally {
        if (icon) icon.textContent = '✨';
        if (txt)  txt.textContent  = 'Gerar Simulador Personalizado (HTML)';
    }
};

function simMontarHTMLCliente(d, contextoTexto) {
    const blocos = d.blocos || simBlocos;
    const implVal = d.implantacao_valor || 20000;
    const mensCheia = d.mensalidade_cheia || 6500;
    const mensNeg   = d.mensalidade_negociada || 5525;

    const blocosHTML = blocos.map((b, i) => `
        <div class="checklist-item p-4 bg-white rounded-lg border-2 border-gray-200 cursor-pointer flex items-start${i===0?' checked':''}" data-bloco="${i+1}" onclick="toggleBloco(this)">
            <div class="flex-1">
                <h3 class="font-bold text-lg text-gray-800">Bloco ${i+1} · ${b.nome}</h3>
                <p class="text-sm text-gray-600">${b.desc}</p>
            </div>
            <div class="ml-3 mt-1">
                <span class="check-indicator w-6 h-6 rounded-full border-2 border-indigo-400 flex items-center justify-center text-indigo-600 text-lg font-bold${i===0?' bg-indigo-500 text-white border-indigo-500':''}">
                    ${i===0?'✓':''}
                </span>
            </div>
        </div>`).join('');

    const blocosTabela = blocos.map((b, i) => `
        <tr>
            <td class="p-3 font-medium">${i+1}. ${b.nome}</td>
            <td class="p-3">${b.desc}</td>
            <td class="p-3" id="valor-bloco${i+1}">R$ ${Number(b.valor).toLocaleString('pt-BR')},00</td>
        </tr>`).join('');

    const valorIndividual = blocos[0]?.valor || 4000;
    const valorPacote = Math.round(valorIndividual * 0.875);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${d.titulo || 'Proposta de Assessoria'} · ${d.nome_empresa || ''}</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<style>
html { font-family: 'Inter', sans-serif; scroll-behavior: smooth; }
body { background-color: #f3f4f6; }
.section-card { background-color: #fff; border-radius: 1.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); padding: 2rem; transition: transform 0.3s, box-shadow 0.3s; }
.section-card:hover { transform: translateY(-3px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.checklist-item { transition: background-color 0.2s; cursor: pointer; }
.checklist-item.checked { background-color: #dcfce7; border-color: #22c55e; }
.editable-summary { border: 2px dashed #cbd5e1; background-color: #f8fafc; padding: 1.5rem; border-radius: 1rem; min-height: 100px; outline: none; resize: vertical; }
.editable-summary:focus { border-color: #3b82f6; background-color: #fff; }
@media print { .no-print { display: none; } body { background: white; } .section-card { box-shadow: none; border: 1px solid #e2e8f0; } }
</style>
</head>
<body>

<header class="bg-blue-800 text-white py-6 shadow-lg">
<div class="max-w-5xl mx-auto px-6">
<div class="flex items-center gap-4 mb-2">
<img src="https://geriah-suite.vercel.app/logo.png" alt="GERiAH" class="h-10 object-contain brightness-0 invert opacity-90">
</div>
<h1 class="text-2xl font-extrabold tracking-tight">${d.titulo || 'Proposta de Assessoria'}</h1>
<p class="opacity-80 mt-1">${d.subtitulo || 'Personalize sua proposta · Selecione o que faz sentido para você'}</p>
</div>
</header>

<div class="sticky top-0 z-10 bg-blue-900/90 backdrop-blur-sm text-white shadow-lg py-4">
<div class="max-w-5xl mx-auto px-6">
<h2 class="text-sm font-semibold mb-2 opacity-90">📊 Resumo da sua seleção</h2>
<div class="grid grid-cols-3 md:grid-cols-5 gap-3 text-center">
<div><p class="text-xs opacity-70">Blocos</p><p id="quick-blocos" class="text-xl font-bold">0</p></div>
<div><p class="text-xs opacity-70">Valor blocos</p><p id="quick-valor-blocos" class="text-xl font-bold">R$ 0</p></div>
<div><p class="text-xs opacity-70">Comissão imp.</p><p id="quick-comissao-imp" class="text-xl font-bold">R$ 0</p></div>
<div><p class="text-xs opacity-70">Comissão rec.</p><p id="quick-comissao-rec" class="text-xl font-bold">R$ 0</p></div>
<div><p class="text-xs opacity-70">Total mês 1</p><p id="quick-total" class="text-xl font-bold text-yellow-300">R$ 0</p></div>
</div>
</div>
</div>

<main class="max-w-5xl mx-auto px-6 py-8 space-y-10">

<div class="section-card">
<label class="block text-sm font-bold text-gray-700 mb-2">Resumo da Proposta</label>
<div id="proposal-summary" class="editable-summary" contenteditable="true">${d.intro_texto || 'Esta proposta contempla a estruturação da assessoria para ' + (d.nome_empresa||'sua empresa') + ' através dos blocos selecionados abaixo.'}</div>
</div>

<section class="section-card bg-indigo-50 border-t-4 border-indigo-600">
<h2 class="text-2xl font-bold text-indigo-800 mb-4">Escolha os Blocos de Estruturação</h2>
<p class="text-gray-700 mb-2">Marque os blocos que deseja que a assessoria implemente. Cada bloco leva ~3 semanas.</p>
<p class="text-indigo-600 font-semibold mb-4">Valor: R$ ${valorIndividual.toLocaleString('pt-BR')}/bloco individual. Todos = R$ ${valorPacote.toLocaleString('pt-BR')}/bloco.</p>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="blocos-checklist">${blocosHTML}</div>
<div class="mt-4 p-4 bg-white rounded-lg">
<p class="font-medium text-gray-700">Blocos contratados: <span id="blocos-contratados" class="font-black text-indigo-700">0</span> de ${blocos.length}</p>
<p class="text-sm text-gray-600 mt-1" id="diagnostico-mensagem">Nenhum bloco selecionado.</p>
</div>
<div class="mt-4 p-4 bg-indigo-100 rounded-lg italic text-indigo-800 font-medium">"${d.frase_impacto || 'Estruture sua operação comercial com método e tecnologia.'}"</div>
</section>

<section class="section-card bg-green-50 border-t-4 border-green-600">
<h2 class="text-2xl font-bold text-green-800 mb-4">Resumo dos Blocos Selecionados</h2>
<div class="overflow-x-auto">
<table class="min-w-full bg-white rounded-xl overflow-hidden">
<thead class="bg-green-100"><tr><th class="p-3 text-left">Bloco</th><th class="p-3 text-left">Entregas</th><th class="p-3 text-left">Valor</th></tr></thead>
<tbody>${blocosTabela}</tbody>
</table>
</div>
<div class="bg-green-100 p-4 rounded-lg mt-4">
<p class="font-bold text-green-800">Total em estruturação: <span id="total-blocos-valor">R$ 0,00</span></p>
</div>
</section>

<section class="section-card bg-yellow-50 border-t-4 border-yellow-500" id="calculadora">
<h2 class="text-2xl font-bold text-gray-800 mb-4">📈 Simule o Negócio</h2>

<div class="mb-6 p-6 bg-white rounded-xl shadow-sm">
<h3 class="text-lg font-bold text-gray-800 mb-3">1. Modelo de comissionamento</h3>
<label class="flex items-start p-3 mb-2 bg-gray-50 rounded-lg cursor-pointer border-2 hover:border-gray-400">
<input type="radio" name="commission_model" value="padrao" checked onchange="calculateCommission()" class="mt-1 mr-3">
<span class="font-semibold">Padrão (5% recorrência + 20% implantação)<span class="block text-sm font-normal text-gray-500 mt-1">Sem prospecção ativa · Estruturação da máquina de vendas</span></span>
</label>
<label class="flex items-start p-3 mb-2 bg-blue-50 rounded-lg cursor-pointer border-2 hover:border-blue-400">
<input type="radio" name="commission_model" value="acelerado" onchange="calculateCommission()" class="mt-1 mr-3">
<span class="font-semibold text-blue-800">Acelerado (8% + 25%)<span class="block text-sm font-normal text-blue-600 mt-1">Com prospecção ativa + blocos</span></span>
</label>
<label class="flex items-start p-3 bg-purple-50 rounded-lg cursor-pointer border-2 hover:border-purple-400">
<input type="radio" name="commission_model" value="premium" onchange="calculateCommission()" class="mt-1 mr-3">
<span class="font-semibold text-purple-800">Premium (12% + 30%)<span class="block text-sm font-normal text-purple-600 mt-1">Prospecção ativa + blocos + agenda SDR</span></span>
</label>
</div>

<div class="mb-6 p-6 bg-white rounded-xl shadow-sm">
<h3 class="text-lg font-bold text-gray-800 mb-3">2. Implantação e mensalidade</h3>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label class="block text-sm font-semibold text-gray-700 mb-2">Valor de implantação (por rede)</label>
<input type="number" id="implantacao-valor" value="${implVal}" onchange="calculateCommission()"
class="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-yellow-400 outline-none font-bold">
</div>
<div>
<label class="block text-sm font-semibold text-gray-700 mb-2">Mensalidade por unidade</label>
<label class="flex items-center p-3 mb-2 bg-gray-50 rounded-lg cursor-pointer border-2 hover:border-gray-400">
<input type="radio" name="mensalidade_cenario" value="cheia" checked onchange="calculateCommission()" class="mr-2">
<span class="font-semibold">Cheio: R$ ${mensCheia.toLocaleString('pt-BR')}/unidade</span>
</label>
<label class="flex items-center p-3 bg-green-50 rounded-lg cursor-pointer border-2 hover:border-green-400">
<input type="radio" name="mensalidade_cenario" value="negociada" onchange="calculateCommission()" class="mr-2">
<span class="font-semibold text-green-700">Negociado: R$ ${mensNeg.toLocaleString('pt-BR')}/unidade</span>
</label>
</div>
</div>
</div>

<div class="mb-6 p-6 bg-white rounded-xl shadow-sm">
<h3 class="text-lg font-bold text-gray-800 mb-3">3. Unidades por rede</h3>
<select id="unidades-por-rede" onchange="calculateCommission()" class="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-yellow-400 outline-none">
<option value="1">1 unidade</option><option value="2">2 unidades</option>
<option value="3" selected>3 unidades (mínimo)</option><option value="4">4 unidades</option>
<option value="5">5 unidades</option><option value="6">6 unidades</option>
<option value="8">8 unidades</option><option value="10">10 unidades</option>
</select>
</div>

<div class="mb-6 p-6 bg-white rounded-xl shadow-sm">
<h3 class="text-lg font-bold text-gray-800 mb-3">4. Redes por mês</h3>
<div class="grid grid-cols-3 md:grid-cols-5 gap-2">
${[0,1,2,3,4].map(n => `<label class="flex items-center justify-center p-3 bg-gray-50 rounded-lg cursor-pointer border-2 hover:border-gray-400 text-sm font-semibold">
<input type="radio" name="contracts" value="${n}" ${n===0?'checked':''} onchange="calculateCommission()" class="mr-2">${n} ${n===4?'(teto)':'rede'+(n!==1&&n>0?'s':'')}
</label>`).join('')}
</div>
</div>

<div class="mb-6 p-6 bg-white rounded-xl shadow-sm">
<h3 class="text-lg font-bold text-gray-800 mb-3">5. Período de contratação</h3>
<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
${[3,6,9,12].map(n => `<label class="flex items-center justify-center p-3 bg-gray-50 rounded-lg cursor-pointer border-2 hover:border-gray-400 text-sm font-semibold ${n===12?'bg-green-50 border-green-300 text-green-700':''}">
<input type="radio" name="periodo" value="${n}" ${n===12?'checked':''} onchange="calculateCommission()" class="mr-2">${n} meses
</label>`).join('')}
</div>
</div>

<div class="bg-gray-900 text-white rounded-xl p-6">
<h3 class="text-xl font-bold mb-4 text-yellow-400">Projeção para o Período</h3>
<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
<div class="bg-gray-800 p-4 rounded-lg"><p class="text-gray-400 text-sm">Total Implantação</p><p id="display-total-implantacao" class="text-xl font-mono">R$ 0,00</p></div>
<div class="bg-gray-800 p-4 rounded-lg"><p class="text-gray-400 text-sm">Total Mensalidade</p><p id="display-total-mensalidade" class="text-xl font-mono">R$ 0,00</p></div>
<div class="bg-gray-800 p-4 rounded-lg"><p class="text-gray-400 text-sm">Faturamento Mês 1</p><p id="display-faturamento-total" class="text-xl font-mono text-yellow-300">R$ 0,00</p></div>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
<div class="bg-gray-800 p-4 rounded-lg"><p class="text-gray-400 text-sm">Comissão Imp.</p><p id="display-implantacao" class="text-lg font-mono">R$ 0,00</p></div>
<div class="bg-gray-800 p-4 rounded-lg"><p class="text-gray-400 text-sm">Comissão Rec.</p><p id="display-recorrencia" class="text-lg font-mono text-green-400">R$ 0,00</p></div>
<div class="bg-gray-800 p-4 rounded-lg"><p class="text-gray-400 text-sm">Blocos</p><p id="display-blocos" class="text-lg font-mono text-blue-400">R$ 0,00</p><p id="detalhe-blocos" class="text-xs text-gray-500 mt-1">0 blocos</p></div>
<div class="bg-gray-800 p-4 rounded-lg border border-yellow-500"><p class="text-gray-400 text-sm">Total no Período</p><p id="display-total-periodo" class="text-2xl font-mono text-white">R$ 0,00</p><p id="display-periodo-label" class="text-xs text-yellow-400 mt-1">12 meses</p></div>
</div>
</div>
</section>

<div class="flex flex-col sm:flex-row gap-4 justify-center py-4 no-print">
<button onclick="window.print()"
class="inline-flex items-center justify-center px-8 py-4 text-base font-extrabold rounded-xl shadow-lg text-white bg-blue-600 hover:bg-blue-700 transition-all">
🖨️ Exportar / Imprimir PDF
</button>
</div>

</main>

<footer class="bg-gray-800 text-white py-6 text-center mt-10">
<img src="https://geriah-suite.vercel.app/logo.png" alt="GERiAH" class="h-8 mx-auto mb-2 opacity-40 brightness-0 invert">
<p class="opacity-60 text-sm">${d.rodape || '© 2026 FNW Assessoria · GERiAH Suite · Proposta personalizada'}</p>
</footer>

<script>
const VALOR_INDIVIDUAL = ${valorIndividual};
const VALOR_PACOTE = ${valorPacote};
const IMPLANTACAO_BASE = ${implVal};
const MENS_CHEIA = ${mensCheia};
const MENS_NEG = ${mensNeg};
const NUM_BLOCOS = ${blocos.length};

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v);

function toggleBloco(el) {
    el.classList.toggle('checked');
    const ind = el.querySelector('.check-indicator');
    if (el.classList.contains('checked')) {
        ind.innerHTML = '✓';
        ind.classList.add('bg-indigo-500','text-white','border-indigo-500');
    } else {
        ind.innerHTML = '';
        ind.classList.remove('bg-indigo-500','text-white','border-indigo-500');
    }
    updateBlocos();
    calculateCommission();
}

function updateBlocos() {
    const n = document.querySelectorAll('.checklist-item.checked').length;
    const allChecked = n === NUM_BLOCOS;
    const valorUnit = allChecked ? VALOR_PACOTE : VALOR_INDIVIDUAL;
    const total = n * valorUnit;

    document.getElementById('blocos-contratados').textContent = n;
    document.getElementById('total-blocos-valor').textContent = fmt(total);

    for (let i = 1; i <= NUM_BLOCOS; i++) {
        const el = document.getElementById('valor-bloco' + i);
        if (!el) continue;
        const marcado = document.querySelector('.checklist-item[data-bloco="' + i + '"]')?.classList.contains('checked');
        el.textContent = marcado ? fmt(valorUnit) : 'Não selecionado';
    }

    document.getElementById('diagnostico-mensagem').textContent =
        n === 0 ? 'Nenhum bloco selecionado.' :
        allChecked ? 'Pacote completo! Valor especial de R$ ' + VALOR_PACOTE.toLocaleString('pt-BR') + ' por bloco.' :
        n + ' bloco(s) por R$ ' + VALOR_INDIVIDUAL.toLocaleString('pt-BR') + ' cada.';
}

function calculateCommission() {
    const modelo = document.querySelector('input[name=commission_model]:checked')?.value || 'padrao';
    const cenario = document.querySelector('input[name=mensalidade_cenario]:checked')?.value || 'cheia';
    const implVal = parseFloat(document.getElementById('implantacao-valor')?.value) || IMPLANTACAO_BASE;
    const mensVal = cenario === 'negociada' ? MENS_NEG : MENS_CHEIA;
    const unidades = parseInt(document.getElementById('unidades-por-rede')?.value) || 3;
    const redes = parseInt(document.querySelector('input[name=contracts]:checked')?.value || '0');
    const periodo = parseInt(document.querySelector('input[name=periodo]:checked')?.value || '12');

    const percRec = modelo === 'premium' ? 0.12 : modelo === 'acelerado' ? 0.08 : 0.05;
    const percImp = modelo === 'premium' ? 0.30 : modelo === 'acelerado' ? 0.25 : 0.20;

    const n = document.querySelectorAll('.checklist-item.checked').length;
    const allChecked = n === NUM_BLOCOS;
    const valorUnit = allChecked ? VALOR_PACOTE : VALOR_INDIVIDUAL;
    const valorBlocos = n * valorUnit;

    const totalImpl = redes * implVal;
    const totalMens = redes * unidades * mensVal;
    const fat = totalImpl + totalMens;
    const cImp = totalImpl * percImp;
    const cRec = totalMens * percRec;
    const total = cImp + (cRec * periodo) + valorBlocos;

    const s = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    s('display-total-implantacao', fmt(totalImpl));
    s('display-total-mensalidade', fmt(totalMens));
    s('display-faturamento-total', fmt(fat));
    s('display-implantacao', fmt(cImp));
    s('display-recorrencia', fmt(cRec));
    s('display-blocos', fmt(valorBlocos));
    s('detalhe-blocos', n + ' bloco(s)');
    s('display-total-periodo', fmt(total));
    s('display-periodo-label', periodo + ' meses');

    s('quick-blocos', n);
    s('quick-valor-blocos', fmt(valorBlocos));
    s('quick-comissao-imp', fmt(cImp));
    s('quick-comissao-rec', fmt(cRec));
    s('quick-total', fmt(cImp + cRec + valorBlocos));
}

// Inicializar
document.querySelector('.checklist-item[data-bloco="1"]')?.classList.add('checked');
updateBlocos();
calculateCommission();
<\/script>
</body>
</html>`;
}

// =========================================================================
// Simulador — Gerador de HTML self-service para cliente
// =========================================================================

window.simPuxarCtxCOPS = function() {
    if (!copsResultado) {
        window.showToast('Nenhum COPS ativo.', 'warning'); return;
    }
    const txt = [
        'CONTEXTO: ' + (copsResultado.contexto || ''),
        'PROBLEMA: ' + (copsResultado.problema || ''),
        'SOLUÇÃO EFETIVA: ' + (copsResultado.solucao_efetiva || ''),
        'HIPÓTESES: ' + (copsResultado.hipoteses || []).map(h => h.titulo).join(', ')
    ].join('\n');
    const el = document.getElementById('sim-ctx-cliente');
    if (el) el.value = txt;
    window.showToast('Contexto do COPS carregado!');
};

window.simGerarHTMLCliente = async function() {
    const ctx = document.getElementById('sim-ctx-cliente')?.value?.trim();
    if (!ctx || ctx.length < 20) {
        window.showToast('Descreva o contexto do cliente primeiro.', 'warning'); return;
    }
    if (!appState.aiConfig?.key) {
        window.showToast('Configure a API Key nas ⚙️ Configurações.', 'warning'); return;
    }

    const icon = document.getElementById('sim-gerar-icon');
    const txt  = document.getElementById('sim-gerar-text');
    if (icon) icon.textContent = '⏳';
    if (txt)  txt.textContent  = 'Gerando proposta personalizada...';

    try {
        const whatsapp = document.getElementById('sim-whatsapp')?.value?.trim() || '';
        const ctxAtivo = document.getElementById('selectComunidade')?.value;
        const ctxNome  = (ctxAtivo && ctxAtivo !== 'null') ? ctxAtivo : 'Cliente';

        // Pegar blocos e valores atuais do simulador
        const blocosAtuais = simBlocos.map(b => b.nome + ' (R$ ' + b.valor + ')').join(', ');
        const bpS = appState.bpData?.[ctxNome];
        const portfolioStr = bpS?.portfolio?.length
            ? 'Portfólio: ' + bpS.portfolio.map(p => p.name + ' R$' + p.price).join(', ')
            : '';

        const sysPrompt = `Você é um estrategista sênior da FNW Assessoria. 
Sua tarefa é gerar um objeto JSON com as informações para personalizar uma proposta self-service para o cliente.
Baseie-se no contexto fornecido e adapte TUDO para a realidade específica deste cliente.

Responda APENAS em JSON válido com esta estrutura:
{
  "titulo": "Nome da empresa/cliente — Assessoria FNW",
  "subtitulo": "Subtítulo contextualizado (ex: 'Baseado no diagnóstico de março')",
  "resumo_inicial": "Texto de abertura personalizado para este cliente (2-3 frases empáticas e diretas)",
  "blocos": [
    {"nome": "Nome do bloco adaptado", "desc": "Descrição específica para este contexto", "valor": 4000, "recomendado": true},
    {"nome": "...", "desc": "...", "valor": 4000, "recomendado": false}
  ],
  "implantacao_por_rede": 20000,
  "mensalidade_cheia": 6500,
  "mensalidade_negociada": 5525,
  "modelo_recomendado": "padrao",
  "frase_motivacional": "Frase de impacto específica para este cliente",
  "nota_rodape": "Texto do rodapé personalizado"
}`;

        const userPrompt = [
            'CONTEXTO DO CLIENTE:',
            ctx,
            '',
            'CLIENTE/CONTEXTO ATIVO NO SISTEMA: ' + ctxNome,
            portfolioStr,
            'BLOCOS DISPONÍVEIS NO MOMENTO: ' + blocosAtuais,
            '',
            'Personalize completamente a proposta para este contexto específico.',
            'Os blocos devem refletir exatamente o que faz sentido para este cliente.',
            'Valores podem ser ajustados conforme o contexto (orçamento, porte, etc).',
            'Mantenha no máximo 4-5 blocos.'
        ].join('\n');

        const resposta = await window.callAI(userPrompt, sysPrompt);
        const clean = resposta.replace(/```json|```/g,'').trim();
        const dados = JSON.parse(clean);

        // Gerar o HTML standalone
        const htmlFinal = simGerarHTMLStandalone(dados, whatsapp);

        // Download do arquivo
        const blob = new Blob([htmlFinal], { type: 'text/html;charset=utf-8' });
        const a = document.createElement('a');
        const nomeArq = (dados.titulo || ctxNome).toLowerCase().replace(/[^a-z0-9]/g,'_').substring(0,30);
        a.href = URL.createObjectURL(blob);
        a.download = 'proposta_' + nomeArq + '_' + new Date().toISOString().slice(0,10) + '.html';
        a.click();

        window.showToast('Proposta gerada e baixada! Envie o arquivo HTML para o cliente. ✓');

    } catch(e) {
        window.showToast('Erro: ' + e.message, 'warning');
        console.error(e);
    } finally {
        if (icon) icon.textContent = '✨';
        if (txt)  txt.textContent  = 'Gerar Proposta Personalizada para Cliente';
    }
};

function simGerarHTMLStandalone(dados, whatsappAssessor) {
    const blocos = dados.blocos || [];
    const wpp = whatsappAssessor || '';

    const blocosHTML = blocos.map((b, i) => `
        <div class="checklist-item p-5 bg-white rounded-2xl border-2 ${b.recomendado ? 'border-indigo-400 bg-indigo-50/50 checked' : 'border-gray-100'} cursor-pointer flex items-start gap-4 transition-all hover:border-indigo-300"
            data-bloco="${i}" data-valor="${b.valor}" onclick="toggleBloco(this)">
            <div class="flex-shrink-0 mt-1">
                <span class="check-indicator w-7 h-7 rounded-full border-2 ${b.recomendado ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'} flex items-center justify-center font-black text-sm">
                    ${b.recomendado ? '✓' : ''}
                </span>
            </div>
            <div class="flex-1">
                <h3 class="font-black text-lg text-gray-800">${b.nome}</h3>
                <p class="text-sm text-gray-500 mt-1 leading-relaxed">${b.desc}</p>
                <p class="text-xs font-black text-indigo-600 mt-2">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(b.valor)}/bloco</p>
            </div>
            ${b.recomendado ? '<span class="flex-shrink-0 text-[9px] font-black text-indigo-600 bg-indigo-100 px-2 py-1 rounded-lg uppercase tracking-wider h-fit">✨ Recomendado</span>' : ''}
        </div>`).join('');

    const wppBtn = wpp
        ? `<button onclick="enviarWhatsApp()" class="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.122 1.523 5.858L0 24l6.335-1.505A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.659-.525-5.168-1.434l-.371-.22-3.762.894.944-3.668-.24-.386A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            Confirmar Escolhas via WhatsApp
           </button>`
        : `<button onclick="copiarResumo()" class="w-full bg-slate-700 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl">
            📋 Copiar Resumo das Escolhas
           </button>`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${dados.titulo || 'Proposta FNW'}</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<style>
  html { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; scroll-behavior: smooth; }
  body { background: #f1f5f9; }
  .checklist-item.checked { background-color: #eef2ff; border-color: #6366f1; }
  .checklist-item.checked .check-indicator { background: #4f46e5; border-color: #4f46e5; color: white; }
  @media print { .no-print { display:none!important; } body { background:white; } }
</style>
</head>
<body>

<!-- Header -->
<header class="bg-[#1e1b4b] text-white py-8 shadow-2xl">
  <div class="max-w-4xl mx-auto px-6">
    <img src="https://geriah-suite.vercel.app/logo.png" class="h-12 mb-4 object-contain" alt="GERiAH">
    <h1 class="text-2xl font-black tracking-tight">${dados.titulo || 'Proposta de Assessoria'}</h1>
    <p class="text-indigo-300 text-sm mt-1 font-medium">${dados.subtitulo || ''}</p>
  </div>
</header>

<!-- Resumo sticky -->
<div class="sticky top-0 z-10 bg-indigo-900/90 backdrop-blur-sm text-white shadow-lg py-4">
  <div class="max-w-4xl mx-auto px-6">
    <p class="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-2">📊 Sua Simulação</p>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
      <div><p class="text-[9px] opacity-60">Blocos</p><p id="q-blocos" class="text-xl font-black">0</p></div>
      <div><p class="text-[9px] opacity-60">Valor Blocos</p><p id="q-val-blocos" class="text-lg font-black">R$ 0</p></div>
      <div><p class="text-[9px] opacity-60">Comissão Imp.</p><p id="q-com-imp" class="text-lg font-black">R$ 0</p></div>
      <div><p class="text-[9px] opacity-60">Comissão Rec.</p><p id="q-com-rec" class="text-lg font-black">R$ 0</p></div>
      <div><p class="text-[9px] opacity-60">Total Mês 1</p><p id="q-total" class="text-xl font-black text-yellow-300">R$ 0</p></div>
    </div>
  </div>
</div>

<main class="max-w-4xl mx-auto px-6 py-8 space-y-8">

  <!-- Abertura -->
  <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
    <p class="text-gray-700 text-lg leading-relaxed font-medium">${dados.resumo_inicial || ''}</p>
  </div>

  <!-- Blocos -->
  <div class="bg-indigo-50 border-t-4 border-indigo-600 rounded-3xl p-8 space-y-5">
    <h2 class="text-2xl font-black text-indigo-800">Escolha os Módulos da sua Assessoria</h2>
    <p class="text-sm text-indigo-600 font-medium">Selecione os módulos que deseja contratar. Cada um leva ~3 semanas.</p>
    <p id="preco-label" class="text-sm font-black text-indigo-700">R$ ${(dados.blocos?.[0]?.valor||4000).toLocaleString('pt-BR')}/módulo individual · todos = desconto especial</p>
    <div class="grid md:grid-cols-2 gap-4" id="blocos-list">
      ${blocosHTML}
    </div>
    <div class="bg-white rounded-2xl p-4 text-sm font-medium text-gray-600">
      <span class="font-black text-indigo-700">Módulos selecionados: </span>
      <span id="blocos-count">0</span> · <span id="blocos-msg" class="italic text-gray-400">Nenhum selecionado ainda.</span>
    </div>
    <p class="text-indigo-500 text-xs font-medium italic">"${dados.frase_motivacional || ''}"</p>
  </div>

  <!-- Comissionamento -->
  <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4">
    <h2 class="text-xl font-black text-gray-800">Modelo de Parceria</h2>
    <label class="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl cursor-pointer border-2 hover:border-slate-400 transition-all">
      <input type="radio" name="commission" value="padrao" ${dados.modelo_recomendado==='padrao'?'checked':''} onchange="calcular()" class="mt-1 accent-slate-600 flex-shrink-0">
      <div>
        <p class="font-black text-gray-800">Padrão — 5% recorrência + 20% implantação</p>
        <p class="text-sm text-gray-500 mt-1">Sem prospecção ativa · Estruturamos a máquina de vendas</p>
      </div>
      ${dados.modelo_recomendado==='padrao'?'<span class="flex-shrink-0 text-[9px] font-black text-indigo-600 bg-indigo-100 px-2 py-1 rounded-lg h-fit">✨ Recomendado</span>':''}
    </label>
    <label class="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl cursor-pointer border-2 hover:border-blue-400 transition-all">
      <input type="radio" name="commission" value="acelerado" ${dados.modelo_recomendado==='acelerado'?'checked':''} onchange="calcular()" class="mt-1 accent-blue-600 flex-shrink-0">
      <div>
        <p class="font-black text-blue-800">Acelerado — 8% recorrência + 25% implantação</p>
        <p class="text-sm text-blue-600 mt-1">Com prospecção ativa + módulos contratados</p>
      </div>
      ${dados.modelo_recomendado==='acelerado'?'<span class="flex-shrink-0 text-[9px] font-black text-blue-600 bg-blue-100 px-2 py-1 rounded-lg h-fit">✨ Recomendado</span>':''}
    </label>
    <label class="flex items-start gap-4 p-4 bg-violet-50 rounded-2xl cursor-pointer border-2 hover:border-violet-400 transition-all">
      <input type="radio" name="commission" value="premium" ${dados.modelo_recomendado==='premium'?'checked':''} onchange="calcular()" class="mt-1 accent-violet-600 flex-shrink-0">
      <div>
        <p class="font-black text-violet-800">Premium — 12% recorrência + 30% implantação</p>
        <p class="text-sm text-violet-600 mt-1">Prospecção ativa + módulos + agenda SDR acelerada</p>
      </div>
      ${dados.modelo_recomendado==='premium'?'<span class="flex-shrink-0 text-[9px] font-black text-violet-600 bg-violet-100 px-2 py-1 rounded-lg h-fit">✨ Recomendado</span>':''}
    </label>
  </div>

  <!-- Configuração -->
  <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
    <h2 class="text-xl font-black text-gray-800">Configure sua Simulação</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Valor por unidade</label>
        <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer border-2 hover:border-gray-400 mb-2 transition-all">
          <input type="radio" name="mensalidade" value="${dados.mensalidade_cheia||6500}" checked onchange="calcular()" class="accent-gray-600">
          <span class="font-bold text-sm">Cheio: ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(dados.mensalidade_cheia||6500)}/unidade</span>
        </label>
        <label class="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl cursor-pointer border-2 hover:border-emerald-400 transition-all">
          <input type="radio" name="mensalidade" value="${dados.mensalidade_negociada||5525}" onchange="calcular()" class="accent-emerald-600">
          <span class="font-bold text-sm text-emerald-700">Negociado: ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(dados.mensalidade_negociada||5525)}/unidade</span>
        </label>
      </div>
      <div class="space-y-4">
        <div>
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Unidades por rede</label>
          <select id="unidades" onchange="calcular()" class="w-full p-3 border border-gray-200 rounded-xl bg-white font-bold text-sm outline-none focus:border-indigo-400">
            <option value="3" selected>3 unidades</option><option value="4">4</option><option value="5">5</option>
            <option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="10">10</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Redes por mês</label>
          <div class="flex gap-2">
            ${[0,1,2,3,4].map(n=>`<label class="flex-1 flex items-center justify-center p-2 bg-gray-50 rounded-xl cursor-pointer border-2 hover:border-indigo-400 transition-all text-xs font-bold"><input type="radio" name="redes" value="${n}" ${n===0?'checked':''} onchange="calcular()" class="mr-1 accent-indigo-600">${n}${n===4?' (teto)':''}</label>`).join('')}
          </div>
        </div>
      </div>
    </div>
    <div>
      <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Período do contrato</label>
      <div class="flex gap-2 flex-wrap">
        ${[3,6,9,12].map(p=>`<label class="flex items-center gap-2 px-4 py-3 ${p===12?'bg-emerald-50 border-emerald-400':'bg-gray-50'} rounded-xl cursor-pointer border-2 hover:border-indigo-400 transition-all text-sm font-bold"><input type="radio" name="periodo" value="${p}" ${p===12?'checked':''} onchange="calcular()" class="accent-indigo-600">${p} meses</label>`).join('')}
      </div>
    </div>
  </div>

  <!-- Resultado -->
  <div class="bg-slate-900 text-white rounded-3xl p-8 space-y-5">
    <h2 class="text-xl font-black text-yellow-400 uppercase tracking-widest">📈 Projeção</h2>
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-slate-800 p-4 rounded-2xl text-center"><p class="text-xs text-slate-400 mb-1">Implantação</p><p id="r-impl" class="text-lg font-black">R$ 0</p></div>
      <div class="bg-slate-800 p-4 rounded-2xl text-center"><p class="text-xs text-slate-400 mb-1">Mensalidade</p><p id="r-mens" class="text-lg font-black">R$ 0</p></div>
      <div class="bg-slate-800 p-4 rounded-2xl text-center"><p class="text-xs text-slate-400 mb-1">Fat. Mês 1</p><p id="r-fat" class="text-lg font-black text-yellow-300">R$ 0</p></div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-slate-800 p-4 rounded-2xl text-center"><p class="text-xs text-slate-400 mb-1">Comissão Imp.</p><p id="r-com-imp" class="text-sm font-black">R$ 0</p></div>
      <div class="bg-slate-800 p-4 rounded-2xl text-center"><p class="text-xs text-slate-400 mb-1">Comissão Rec.</p><p id="r-com-rec" class="text-sm font-black text-emerald-400">R$ 0</p></div>
      <div class="bg-slate-800 p-4 rounded-2xl text-center"><p class="text-xs text-slate-400 mb-1">Módulos</p><p id="r-blocos" class="text-sm font-black text-blue-400">R$ 0</p></div>
      <div class="bg-indigo-800 p-4 rounded-2xl text-center border border-indigo-600"><p class="text-xs text-indigo-300 mb-1">Total Período</p><p id="r-total" class="text-xl font-black">R$ 0</p><p id="r-periodo" class="text-[9px] text-yellow-400">12 meses</p></div>
    </div>
  </div>

  <!-- CTA -->
  <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4 no-print">
    <h2 class="text-xl font-black text-gray-800">Confirmar Escolhas</h2>
    <p class="text-sm text-gray-500 font-medium">Quando estiver satisfeito com a simulação, confirme suas escolhas:</p>
    ${wppBtn}
    <button onclick="window.print()" class="w-full bg-blue-100 text-blue-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-200 transition-all">
      🖨️ Salvar como PDF
    </button>
  </div>

</main>

<footer class="bg-slate-800 text-white py-6 text-center mt-8">
  <p class="text-xs opacity-50 font-medium">${dados.nota_rodape || '© 2026 FNW Assessoria · Todos os direitos reservados.'}</p>
  <p class="text-[9px] opacity-30 mt-1">Gerado via GERiAH Suite</p>
</footer>

<script>
const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const $ = id => document.getElementById(id);
const radio = name => document.querySelector('input[name="'+name+'"]:checked')?.value;

const blocosDados = ${JSON.stringify(blocos)};
let blocosChecked = blocosDados.map(b => b.recomendado || false);

function toggleBloco(el) {
  const i = parseInt(el.dataset.bloco);
  blocosChecked[i] = !blocosChecked[i];
  el.classList.toggle('checked', blocosChecked[i]);
  const ind = el.querySelector('.check-indicator');
  if (blocosChecked[i]) { ind.textContent = '✓'; ind.classList.add('bg-indigo-600','border-indigo-600','text-white'); }
  else { ind.textContent = ''; ind.classList.remove('bg-indigo-600','border-indigo-600','text-white'); }
  calcular();
}

function calcular() {
  const n = blocosChecked.filter(Boolean).length;
  const allChecked = n === blocosDados.length && n >= 2;
  const valorUnit = allChecked ? blocosDados[0].valor * 0.875 : blocosDados[0]?.valor || 4000;
  const valorBlocos = blocosChecked.reduce((s,c,i) => s + (c ? blocosDados[i].valor : 0), 0) * (allChecked ? 0.875 : 1);

  const modelo = radio('commission') || 'padrao';
  const percRec = modelo==='premium'?0.12:modelo==='acelerado'?0.08:0.05;
  const percImp = modelo==='premium'?0.30:modelo==='acelerado'?0.25:0.20;

  const impl = parseFloat('${dados.implantacao_por_rede||20000}');
  const mens = parseFloat(radio('mensalidade') || '${dados.mensalidade_cheia||6500}');
  const unid = parseInt($('unidades')?.value || '3');
  const redes = parseInt(radio('redes') || '0');
  const per  = parseInt(radio('periodo') || '12');

  const totalImpl = redes * impl;
  const totalMens = redes * unid * mens;
  const fat = totalImpl + totalMens;
  const comImp = totalImpl * percImp;
  const comRec = totalMens * percRec;
  const total = comImp + (comRec * per) + valorBlocos;

  const s = (id,v) => { const el=$(id); if(el) el.textContent=v; };
  s('q-blocos',n); s('q-val-blocos',fmt(valorBlocos));
  s('q-com-imp',fmt(comImp)); s('q-com-rec',fmt(comRec));
  s('q-total',fmt(comImp+comRec+valorBlocos));
  s('r-impl',fmt(totalImpl)); s('r-mens',fmt(totalMens)); s('r-fat',fmt(fat));
  s('r-com-imp',fmt(comImp)); s('r-com-rec',fmt(comRec));
  s('r-blocos',fmt(valorBlocos)); s('r-total',fmt(total));
  s('r-periodo',per+' meses');
  s('blocos-count',n);
  s('blocos-msg', n===0?'Nenhum módulo selecionado.':allChecked?'Pacote completo! Desconto aplicado.':n+' módulo(s) selecionado(s).');
}

function gerarResumoTexto() {
  const n = blocosChecked.filter(Boolean).length;
  const modelo = radio('commission')||'padrao';
  const nomes = {padrao:'Padrão (5%+20%)',acelerado:'Acelerado (8%+25%)',premium:'Premium (12%+30%)'};
  const total = $('r-total')?.textContent || '';
  const periodo = radio('periodo') || '12';
  const blocosSel = blocosDados.filter((_,i)=>blocosChecked[i]).map((b,i)=>(i+1)+'. '+b.nome).join('\\n');
  return [
    '*PROPOSTA FNW — ESCOLHAS DO CLIENTE*',
    '',
    '*Módulos selecionados:*',
    blocosSel || 'Nenhum',
    '',
    '*Modelo:* ' + nomes[modelo],
    '*Período:* ' + periodo + ' meses',
    '*Total projetado:* ' + total,
    '',
    '_(Gerado via GERiAH Suite · Proposta Self-Service)_'
  ].join('\\n');
}

function enviarWhatsApp() {
  const resumo = gerarResumoTexto();
  const wpp = '${wpp}';
  if (!wpp) { copiarResumo(); return; }
  const url = 'https://wa.me/' + wpp + '?text=' + encodeURIComponent(resumo);
  window.open(url, '_blank');
}

function copiarResumo() {
  navigator.clipboard.writeText(gerarResumoTexto()).then(()=>alert('Resumo copiado! Cole no WhatsApp.'));
}

calcular();
<\/script>
</body>
</html>`;
}
