document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    const clientModal = new bootstrap.Modal(document.getElementById('client-modal'));
    const settingsModal = new bootstrap.Modal(document.getElementById('settings-modal'));
    
    // App state
    let appState = {
        currentCycle: {
            startDate: moment().startOf('isoWeek'),
            endDate: moment().startOf('isoWeek').add(13, 'days')
        },
        timeSlots: [
            '09:00', '10:30', '14:00', '15:30'
        ],
        clients: [],
        clientTypes: {
            partner: { label: 'Parceiro', color: '#4361ee', limit: 7 },
            multiplier: { label: 'Multiplicador', color: '#4cc9f0', limit: 7 },
            reserve: { label: 'Reserva', color: '#7209b7', limit: 7 }
        }
    };
    
    // Load data from localStorage if exists
    function loadState() {
        const savedState = localStorage.getItem('cicloConsultState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                
                // Make sure to convert date strings back to moment objects
                if (parsedState.currentCycle) {
                    parsedState.currentCycle.startDate = moment(parsedState.currentCycle.startDate);
                    parsedState.currentCycle.endDate = moment(parsedState.currentCycle.endDate);
                }
                
                appState = {...appState, ...parsedState};
            } catch (e) {
                console.error('Error loading saved state:', e);
            }
        }
        
        // Initialize cycle date input with current value
        const cycleStartDateInput = document.getElementById('cycle-start-date');
        cycleStartDateInput.value = appState.currentCycle.startDate.format('YYYY-MM-DD');
    }
    
    // Save state to localStorage
    function saveState() {
        localStorage.setItem('cicloConsultState', JSON.stringify(appState));
    }
    
    // Initialize UI
    function initializeUI() {
        updateCycleDisplay();
        renderTimeSlotSettings();
        updateMetrics();
        renderCalendar();
    }
    
    // Update the cycle display
    function updateCycleDisplay() {
        const currentCycleElement = document.getElementById('current-cycle');
        const startFormatted = appState.currentCycle.startDate.format('DD/MM/YYYY');
        const endFormatted = appState.currentCycle.endDate.format('DD/MM/YYYY');
        currentCycleElement.textContent = `Ciclo: ${startFormatted} - ${endFormatted}`;
    }
    
    // Render the time slot settings in the settings modal
    function renderTimeSlotSettings() {
        const container = document.getElementById('time-slots-container');
        container.innerHTML = '';
        
        appState.timeSlots.forEach(slot => {
            const row = document.createElement('div');
            row.className = 'time-slot-row';
            
            row.innerHTML = `
                <input type="time" class="form-control time-slot-input" value="${slot}">
                <button type="button" class="btn btn-sm btn-danger remove-time-slot"><i class="bi bi-trash"></i></button>
            `;
            
            container.appendChild(row);
        });
        
        // Add event listeners to the new remove buttons
        document.querySelectorAll('.remove-time-slot').forEach(button => {
            button.addEventListener('click', function() {
                this.parentElement.remove();
            });
        });
    }
    
    // Update metrics display
    function updateMetrics() {
        const totalClientsElement = document.getElementById('total-clients');
        const partnerSlotsElement = document.getElementById('partner-slots');
        const multiplierSlotsElement = document.getElementById('multiplier-slots');
        const reserveSlotsElement = document.getElementById('reserve-slots');
        
        // Count unique clients by type for the current cycle
        const uniqueNames = {
            total: new Set(),
            partner: new Set(),
            multiplier: new Set(),
            reserve: new Set()
        };
        
        appState.clients.forEach(client => {
            if (isClientInCurrentCycle(client)) {
                const normalizedName = client.name.trim().toLowerCase();
                uniqueNames.total.add(normalizedName);
                if (uniqueNames[client.type]) {
                    uniqueNames[client.type].add(normalizedName);
                }
            }
        });
        
        const clientCounts = {
            total: uniqueNames.total.size,
            partner: uniqueNames.partner.size,
            multiplier: uniqueNames.multiplier.size,
            reserve: uniqueNames.reserve.size
        };
        
        // Get dynamic milestone limits for each category based on the new logic
        const getMilestone = (count) => {
            if (count < 7) return 7;
            if (count < 14) return 14;
            return 21;
        };
        
        const totalMilestone = getMilestone(clientCounts.total);
        const partnerMilestone = getMilestone(clientCounts.partner);
        const multiplierMilestone = getMilestone(clientCounts.multiplier);
        const reserveMilestone = getMilestone(clientCounts.reserve);
        
        // Update the UI
        totalClientsElement.textContent = `${clientCounts.total}/${totalMilestone}`;
        partnerSlotsElement.textContent = `${clientCounts.partner}/${partnerMilestone}`;
        multiplierSlotsElement.textContent = `${clientCounts.multiplier}/${multiplierMilestone}`;
        reserveSlotsElement.textContent = `${clientCounts.reserve}/${reserveMilestone}`;
        
        // Add color indicators based on capacity milestones
        colorizeMetric(totalClientsElement, clientCounts.total);
        colorizeMetric(partnerSlotsElement, clientCounts.partner);
        colorizeMetric(multiplierSlotsElement, clientCounts.multiplier);
        colorizeMetric(reserveSlotsElement, clientCounts.reserve);
    }
    
    // Add color to metrics based on absolute milestones
    function colorizeMetric(element, current) {
        element.classList.remove('text-success', 'text-warning', 'text-danger');
        
        if (current <= 7) {
            // Ideal
            element.classList.add('text-success');
        } else if (current <= 14) {
            // Maximum / Warning
            element.classList.add('text-warning');
        } else {
            // Critical / Danger
            element.classList.add('text-danger');
        }
    }
    
    // Check if a client appointment is within the current cycle
    function isClientInCurrentCycle(client) {
        const appointmentDate = moment(client.date);
        return appointmentDate.isBetween(
            appState.currentCycle.startDate, 
            appState.currentCycle.endDate, 
            null, 
            '[]'
        );
    }
    
    // Render the calendar with appointments
    function renderCalendar() {
        // Clear existing slots
        document.querySelectorAll('.slots').forEach(slotsContainer => {
            slotsContainer.innerHTML = '';
        });
        
        // Generate dates for the current cycle (2 weeks)
        const dates = [];
        let currentDate = appState.currentCycle.startDate.clone();
        
        while (currentDate.isSameOrBefore(appState.currentCycle.endDate)) {
            // Only include Tuesday, Wednesday, Thursday
            if ([2, 3, 4].includes(currentDate.isoWeekday())) {
                dates.push(currentDate.clone());
            }
            currentDate.add(1, 'day');
        }
        
        // For each weekday container in the UI
        document.querySelectorAll('.weekday').forEach(weekday => {
            const dayName = weekday.dataset.day;
            const weekNum = weekday.dataset.week;
            const slotsContainer = weekday.querySelector('.slots');
            
            // Map day names to isoWeekday numbers
            const dayMap = { 'Terça': 2, 'Quarta': 3, 'Quinta': 4 };
            const dayNumber = dayMap[dayName];
            
            // Find the date that matches this weekday in the cycle
            const matchingDates = dates.filter(date => {
                return date.isoWeekday() === dayNumber && 
                      ((weekNum === '1' && date.isoWeek() === appState.currentCycle.startDate.isoWeek()) ||
                       (weekNum === '2' && date.isoWeek() !== appState.currentCycle.startDate.isoWeek()));
            });
            
            if (matchingDates.length > 0) {
                const date = matchingDates[0];
                
                // Add date to the weekday header
                weekday.querySelector('h4').textContent = `${dayName}-feira (${date.format('DD/MM')})`;
                
                // Render time slots for this day
                appState.timeSlots.forEach(timeSlot => {
                    const slotDateTime = date.clone().set({
                        hour: parseInt(timeSlot.split(':')[0]),
                        minute: parseInt(timeSlot.split(':')[1]),
                        second: 0
                    });
                    
                    // Check if there's a client for this slot
                    const client = appState.clients.find(c => 
                        moment(c.date).isSame(slotDateTime)
                    );
                    
                    // Create slot element
                    const slotElement = document.createElement('div');
                    slotElement.className = client ? `slot ${client.type} draggable` : 'slot empty';
                    slotElement.dataset.datetime = slotDateTime.format();
                    
                    if (client) {
                        slotElement.draggable = true;
                        slotElement.dataset.clientId = client.id;
                        slotElement.innerHTML = `
                            <div class="slot-time">${timeSlot}</div>
                            <div class="slot-client">${client.name}</div>
                            <div class="slot-actions">
                                <button class="edit-appointment" data-id="${client.id}"><i class="bi bi-pencil"></i></button>
                                <button class="delete-appointment" data-id="${client.id}"><i class="bi bi-trash"></i></button>
                            </div>
                        `;
                    } else {
                        slotElement.innerHTML = `
                            <div class="slot-time">${timeSlot}</div>
                            <div class="slot-client">Disponível</div>
                            <div class="slot-actions">
                                <button class="add-appointment" data-time="${slotDateTime.format()}">
                                    <i class="bi bi-plus-circle"></i>
                                </button>
                            </div>
                        `;
                    }
                    
                    slotsContainer.appendChild(slotElement);
                });
            }
        });
        
        // Add event listeners to the slot actions
        addSlotEventListeners();
    }
    
    // Add event listeners to the slots
    function addSlotEventListeners() {
        // Drag and Drop implementation
        const slots = document.querySelectorAll('.slot');
        
        slots.forEach(slot => {
            // Drag Start
            slot.addEventListener('dragstart', function(e) {
                if (!this.dataset.clientId) return; // Only drag occupied slots
                this.classList.add('dragging');
                e.dataTransfer.setData('text/plain', this.dataset.clientId);
                e.dataTransfer.effectAllowed = 'move';
            });
            
            // Drag End
            slot.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over'));
            });
            
            // Drag Enter & Over
            slot.addEventListener('dragover', function(e) {
                e.preventDefault(); // necessary to allow dropping
                e.dataTransfer.dropEffect = 'move';
                if (!this.classList.contains('dragging')) {
                    this.classList.add('drag-over');
                }
            });
            
            // Drag Leave
            slot.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });
            
            // Drop
            slot.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                
                const draggedClientId = e.dataTransfer.getData('text/plain');
                if (!draggedClientId) return;
                
                const targetDateTime = this.dataset.datetime;
                
                // Find dragged client
                const draggedClientIndex = appState.clients.findIndex(c => c.id === draggedClientId);
                if (draggedClientIndex === -1) return;
                
                const draggedClient = appState.clients[draggedClientIndex];
                
                // Find if there's an existing client in the target slot
                const targetClientIndex = appState.clients.findIndex(c => 
                    moment(c.date).isSame(moment(targetDateTime))
                );
                
                // Prevent dropping onto itself
                if (targetClientIndex !== -1 && appState.clients[targetClientIndex].id === draggedClientId) {
                    return;
                }
                
                if (targetClientIndex !== -1) {
                    // Swap scenario: Target slot is occupied
                    const targetClient = appState.clients[targetClientIndex];
                    const targetOldDate = targetClient.date;
                    targetClient.date = draggedClient.date;
                    draggedClient.date = targetOldDate;
                } else {
                    // Move scenario: Target slot is empty
                    draggedClient.date = targetDateTime;
                }
                
                saveState();
                updateMetrics();
                renderCalendar();
            });
        });

        // Add new appointment from slot
        document.querySelectorAll('.add-appointment').forEach(button => {
            button.addEventListener('click', function() {
                const dateTime = this.dataset.time;
                openClientModal(dateTime);
            });
        });
        
        // Edit appointment
        document.querySelectorAll('.edit-appointment').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // prevent triggering parent clicks or drags
                const clientId = this.dataset.id;
                const client = appState.clients.find(c => c.id === clientId);
                if (client) {
                    openClientModal(null, client);
                }
            });
        });
        
        // Delete appointment
        document.querySelectorAll('.delete-appointment').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // prevent triggering parent clicks or drags
                const clientId = this.dataset.id;
                if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                    appState.clients = appState.clients.filter(c => c.id !== clientId);
                    saveState();
                    updateMetrics();
                    renderCalendar();
                }
            });
        });
    }
    
    // Open the client modal for new appointment or editing
    function openClientModal(dateTime = null, clientToEdit = null) {
        const modal = document.getElementById('client-modal');
        const form = document.getElementById('client-form');
        const nameInput = document.getElementById('client-name');
        const typeSelect = document.getElementById('client-type');
        const slotSelect = document.getElementById('slot-select');
        const notesInput = document.getElementById('client-notes');
        
        // Reset form
        form.reset();
        
        // Update modal title
        modal.querySelector('.modal-title').textContent = clientToEdit ? 'Editar Agendamento' : 'Novo Agendamento';
        
        // Populate available slots in the dropdown
        populateSlotSelect(slotSelect, dateTime, clientToEdit);
        
        // If editing, populate form with client data
        if (clientToEdit) {
            nameInput.value = clientToEdit.name;
            typeSelect.value = clientToEdit.type;
            notesInput.value = clientToEdit.notes || '';
            
            // Set the correct slot in the dropdown
            const clientDateTime = moment(clientToEdit.date).format();
            Array.from(slotSelect.options).forEach(option => {
                if (option.value === clientDateTime) {
                    option.selected = true;
                }
            });
            
            // Store the client ID for later
            form.dataset.clientId = clientToEdit.id;
        } else {
            delete form.dataset.clientId;
            
            // If a specific dateTime was passed, select it
            if (dateTime) {
                Array.from(slotSelect.options).forEach(option => {
                    if (option.value === dateTime) {
                        option.selected = true;
                    }
                });
            }
        }
        
        clientModal.show();
    }
    
    // Populate the slot select dropdown with available times
    function populateSlotSelect(selectElement, defaultDateTime = null, clientToEdit = null) {
        selectElement.innerHTML = '<option value="">Selecione o horário</option>';
        
        // Generate dates for the current cycle (2 weeks)
        const dates = [];
        let currentDate = appState.currentCycle.startDate.clone();
        
        while (currentDate.isSameOrBefore(appState.currentCycle.endDate)) {
            // Only include Tuesday, Wednesday, Thursday
            if ([2, 3, 4].includes(currentDate.isoWeekday())) {
                dates.push(currentDate.clone());
            }
            currentDate.add(1, 'day');
        }
        
        // For each date, create options for each time slot
        dates.forEach(date => {
            const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.day()];
            const dateStr = date.format('DD/MM');
            
            // Create optgroup for this day
            const optgroup = document.createElement('optgroup');
            optgroup.label = `${dayName} ${dateStr}`;
            
            // Add time slots for this day
            appState.timeSlots.forEach(timeSlot => {
                const slotDateTime = date.clone().set({
                    hour: parseInt(timeSlot.split(':')[0]),
                    minute: parseInt(timeSlot.split(':')[1]),
                    second: 0
                });
                
                const formattedDateTime = slotDateTime.format();
                
                // Check if this slot is available (or belongs to the client being edited)
                const existingAppointment = appState.clients.find(c => 
                    moment(c.date).isSame(slotDateTime) && 
                    (!clientToEdit || c.id !== clientToEdit.id)
                );
                
                if (!existingAppointment) {
                    const option = document.createElement('option');
                    option.value = formattedDateTime;
                    option.textContent = `${timeSlot}`;
                    
                    // If this is the default dateTime, select it
                    if (defaultDateTime && defaultDateTime === formattedDateTime) {
                        option.selected = true;
                    }
                    
                    optgroup.appendChild(option);
                }
            });
            
            // Only add the optgroup if it has options
            if (optgroup.children.length > 0) {
                selectElement.appendChild(optgroup);
            }
        });
    }
    
    // Save a client appointment
    function saveClientAppointment() {
        const form = document.getElementById('client-form');
        const nameInput = document.getElementById('client-name');
        const typeSelect = document.getElementById('client-type');
        const slotSelect = document.getElementById('slot-select');
        const notesInput = document.getElementById('client-notes');
        
        // Validate form
        if (!nameInput.value || !typeSelect.value || !slotSelect.value) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        // Check if we're at capacity for this client type (unique names)
        const clientType = typeSelect.value;
        const normalizedName = nameInput.value.trim().toLowerCase();
        const typeLimit = appState.clientTypes[clientType].limit;
        
        const uniqueNamesOfType = new Set();
        appState.clients.forEach(c => {
            if (c.type === clientType && isClientInCurrentCycle(c) && c.id !== form.dataset.clientId) {
                uniqueNamesOfType.add(c.name.trim().toLowerCase());
            }
        });
        
        // Add the current name being saved to see if it exceeds
        uniqueNamesOfType.add(normalizedName);
        
        if (uniqueNamesOfType.size >= 21) {
            alert(`Limite absoluto (21) clientes únicos do tipo ${appState.clientTypes[clientType].label} atingido neste ciclo.`);
            return;
        }
        
        // Create or update client object
        const clientData = {
            name: nameInput.value,
            type: typeSelect.value,
            date: slotSelect.value,
            notes: notesInput.value
        };
        
        if (form.dataset.clientId) {
            // Updating existing client
            const index = appState.clients.findIndex(c => c.id === form.dataset.clientId);
            if (index !== -1) {
                clientData.id = form.dataset.clientId;
                appState.clients[index] = clientData;
            }
        } else {
            // Adding new client
            clientData.id = generateId();
            appState.clients.push(clientData);
        }
        
        saveState();
        updateMetrics();
        renderCalendar();
        clientModal.hide();
    }
    
    // Generate a unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    // Export the schedule data to Excel
    function exportToExcel() {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        
        // Prepare data for the worksheet
        const cycleStart = appState.currentCycle.startDate.format('DD/MM/YYYY');
        const cycleEnd = appState.currentCycle.endDate.format('DD/MM/YYYY');
        
        // Headers for the worksheet
        const wsData = [
            [`Agenda de Consultoria - Ciclo: ${cycleStart} a ${cycleEnd}`],
            [],
            ['Data', 'Horário', 'Cliente', 'Tipo', 'Observações']
        ];
        
        // Sort clients by date
        const sortedClients = [...appState.clients]
            .filter(client => isClientInCurrentCycle(client))
            .sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());
        
        // Add client data to worksheet
        sortedClients.forEach(client => {
            const clientDate = moment(client.date);
            wsData.push([
                clientDate.format('DD/MM/YYYY'),
                clientDate.format('HH:mm'),
                client.name,
                appState.clientTypes[client.type].label,
                client.notes || ''
            ]);
        });
        
        // Create worksheet and add to workbook
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        const wscols = [
            {wch: 12},  // Date
            {wch: 8},   // Time
            {wch: 30},  // Client name
            {wch: 15},  // Client type
            {wch: 50}   // Notes
        ];
        ws['!cols'] = wscols;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Agenda");
        
        // Generate file name
        const fileName = `Agenda_Consultoria_${cycleStart.replace(/\//g, '-')}_a_${cycleEnd.replace(/\//g, '-')}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, fileName);
    }
    
    // Import schedule data from Excel
    function importFromExcel(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                // Assuming first sheet is the "Agenda" sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Parse sheet to JSON array of arrays
                const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                
                // Find the header row index (where "Data" is)
                let headerRowIdx = -1;
                for (let i = 0; i < json.length; i++) {
                    if (json[i] && json[i][0] === 'Data' && json[i][1] === 'Horário') {
                        headerRowIdx = i;
                        break;
                    }
                }
                
                if (headerRowIdx === -1) {
                    alert('Formato de arquivo inválido. Não foi possível encontrar o cabeçalho "Data" e "Horário".');
                    return;
                }
                
                let importCount = 0;
                let errorCount = 0;
                
                // Process each row after the header
                for (let i = headerRowIdx + 1; i < json.length; i++) {
                    const row = json[i];
                    if (!row || row.length < 4 || !row[0] || !row[1]) continue; // Skip empty/invalid rows
                    
                    const dateStr = row[0]; // e.g. "20/03/2026"
                    const timeStr = row[1]; // e.g. "09:00"
                    const clientName = row[2];
                    const typeLabel = row[3];
                    const notes = row[4] || '';
                    
                    // Parse Brazilian date format back to moment
                    const dateTime = moment(`${dateStr} ${timeStr}`, 'DD/MM/YYYY HH:mm');
                    
                    if (!dateTime.isValid()) {
                        errorCount++;
                        continue;
                    }
                    
                    // Reverse map type label to type key
                    let clientType = 'partner'; // default fallback
                    if (typeLabel === appState.clientTypes.multiplier.label) clientType = 'multiplier';
                    else if (typeLabel === appState.clientTypes.reserve.label) clientType = 'reserve';
                    
                    // Check if there is already an appointment exactly at this time
                    const existingIdx = appState.clients.findIndex(c => moment(c.date).isSame(dateTime));
                    
                    if (existingIdx !== -1) {
                        // Replace existing appointment
                        appState.clients[existingIdx] = {
                            id: appState.clients[existingIdx].id,
                            name: clientName,
                            type: clientType,
                            date: dateTime.format(),
                            notes: notes
                        };
                    } else {
                        // Add new appointment
                        appState.clients.push({
                            id: generateId(),
                            name: clientName,
                            type: clientType,
                            date: dateTime.format(),
                            notes: notes
                        });
                    }
                    importCount++;
                }
                
                if (importCount > 0) {
                    saveState();
                    updateMetrics();
                    renderCalendar();
                    alert(`Importação concluída: ${importCount} agendamentos importados/atualizados. ${errorCount > 0 ? '(' + errorCount + ' ignorados por erro)' : ''}`);
                } else {
                    alert('Nenhum agendamento válido encontrado para importar.');
                }
                
            } catch (error) {
                console.error('Error importing Excel:', error);
                alert('Ocorreu um erro ao processar o arquivo. Verifique se é uma planilha exportada por este sistema.');
            }
            
            // Clear input value so it can trigger change again on the same file
            document.getElementById('import-file').value = '';
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    // Event Listeners
    
    // Previous cycle button
    document.getElementById('prev-cycle').addEventListener('click', function() {
        appState.currentCycle.startDate.subtract(14, 'days');
        appState.currentCycle.endDate.subtract(14, 'days');
        updateCycleDisplay();
        updateMetrics();
        renderCalendar();
        saveState();
    });
    
    // Next cycle button
    document.getElementById('next-cycle').addEventListener('click', function() {
        appState.currentCycle.startDate.add(14, 'days');
        appState.currentCycle.endDate.add(14, 'days');
        updateCycleDisplay();
        updateMetrics();
        renderCalendar();
        saveState();
    });
    
    // Add client button
    document.getElementById('add-client').addEventListener('click', function() {
        openClientModal();
    });
    
    // Save client button
    document.getElementById('save-client').addEventListener('click', saveClientAppointment);
    
    // Export data button
    document.getElementById('export-data').addEventListener('click', exportToExcel);
    
    // Copy previous cycle button
    document.getElementById('copy-prev-cycle').addEventListener('click', function() {
        if (!confirm('Deseja copiar os clientes do ciclo anterior para os horários equivalentes no ciclo atual? (Horários já ocupados não serão substituídos).')) {
            return;
        }

        const prevStartDate = appState.currentCycle.startDate.clone().subtract(14, 'days');
        const prevEndDate = appState.currentCycle.endDate.clone().subtract(14, 'days');
        
        // Find clients from the previous cycle
        const prevClients = appState.clients.filter(client => {
            const appointmentDate = moment(client.date);
            return appointmentDate.isBetween(prevStartDate, prevEndDate, null, '[]');
        });
        
        if (prevClients.length === 0) {
            alert('Não há agendamentos no ciclo anterior para copiar.');
            return;
        }

        let copiedCount = 0;

        prevClients.forEach(prevClient => {
            // Calculate the equivalent date in the current cycle (+14 days)
            const newDate = moment(prevClient.date).add(14, 'days');
            
            // Check if slot is already occupied in the current cycle
            const isOccupied = appState.clients.some(c => moment(c.date).isSame(newDate));
            
            if (!isOccupied) {
                // Determine limits check against current cycle (needs unique name check)
                const clientType = prevClient.type;
                const normalizedName = prevClient.name.trim().toLowerCase();
                const typeLimit = appState.clientTypes[clientType].limit;
                
                const uniqueNamesOfType = new Set();
                appState.clients.forEach(c => {
                    if (c.type === clientType && isClientInCurrentCycle(c)) {
                        uniqueNamesOfType.add(c.name.trim().toLowerCase());
                    }
                });
                
                // If this specific person isn't already tracked in the limit, add them
                uniqueNamesOfType.add(normalizedName);
                
                // Only copy if it doesn't violate absolute bounds
                if (uniqueNamesOfType.size <= 21) {
                    appState.clients.push({
                        id: generateId(),
                        name: prevClient.name,
                        type: prevClient.type,
                        date: newDate.format(),
                        notes: prevClient.notes
                    });
                    copiedCount++;
                }
            }
        });

        if (copiedCount > 0) {
            saveState();
            updateMetrics();
            renderCalendar();
            alert(`Foram copiados ${copiedCount} agendamentos com sucesso!`);
        } else {
            alert('Nenhum agendamento foi copiado. Os horários podem já estar ocupados ou os limites de ciclo foram atingidos.');
        }
    });

    // Import data sequence
    document.getElementById('import-data-btn').addEventListener('click', function() {
        document.getElementById('import-file').click();
    });
    
    document.getElementById('import-file').addEventListener('change', importFromExcel);
    
    // Settings button
    document.getElementById('settings-btn').addEventListener('click', function() {
        settingsModal.show();
    });
    
    // Add time slot button
    document.getElementById('add-time-slot').addEventListener('click', function() {
        const container = document.getElementById('time-slots-container');
        const row = document.createElement('div');
        row.className = 'time-slot-row';
        
        row.innerHTML = `
            <input type="time" class="form-control time-slot-input" value="00:00">
            <button type="button" class="btn btn-sm btn-danger remove-time-slot"><i class="bi bi-trash"></i></button>
        `;
        
        container.appendChild(row);
        
        // Add event listener to the new remove button
        row.querySelector('.remove-time-slot').addEventListener('click', function() {
            this.parentElement.remove();
        });
    });
    
    // Save settings button
    document.getElementById('save-settings').addEventListener('click', function() {
        // Save time slots
        const timeInputs = document.querySelectorAll('.time-slot-input');
        appState.timeSlots = Array.from(timeInputs).map(input => input.value).sort();
        
        // Save cycle start date
        const cycleStartDateInput = document.getElementById('cycle-start-date');
        if (cycleStartDateInput.value) {
            const newStartDate = moment(cycleStartDateInput.value);
            appState.currentCycle.startDate = newStartDate;
            appState.currentCycle.endDate = newStartDate.clone().add(13, 'days');
        }
        
        saveState();
        updateCycleDisplay();
        renderCalendar();
        settingsModal.hide();
    });
    
    // Initialize the app
    loadState();
    initializeUI();
});

