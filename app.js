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
        
        // Count clients by type for the current cycle
        const clientCounts = {
            total: 0,
            partner: 0,
            multiplier: 0,
            reserve: 0
        };
        
        appState.clients.forEach(client => {
            if (isClientInCurrentCycle(client)) {
                clientCounts.total++;
                clientCounts[client.type]++;
            }
        });
        
        // Update the UI
        totalClientsElement.textContent = `${clientCounts.total}/21`;
        partnerSlotsElement.textContent = `${clientCounts.partner}/${appState.clientTypes.partner.limit}`;
        multiplierSlotsElement.textContent = `${clientCounts.multiplier}/${appState.clientTypes.multiplier.limit}`;
        reserveSlotsElement.textContent = `${clientCounts.reserve}/${appState.clientTypes.reserve.limit}`;
        
        // Add color indicators based on capacity
        colorizeMetric(totalClientsElement, clientCounts.total, 21);
        colorizeMetric(partnerSlotsElement, clientCounts.partner, appState.clientTypes.partner.limit);
        colorizeMetric(multiplierSlotsElement, clientCounts.multiplier, appState.clientTypes.multiplier.limit);
        colorizeMetric(reserveSlotsElement, clientCounts.reserve, appState.clientTypes.reserve.limit);
    }
    
    // Add color to metrics based on capacity
    function colorizeMetric(element, current, max) {
        element.classList.remove('text-success', 'text-warning', 'text-danger');
        
        const percentage = (current / max) * 100;
        
        if (percentage < 70) {
            element.classList.add('text-success');
        } else if (percentage < 90) {
            element.classList.add('text-warning');
        } else {
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
                    slotElement.className = client ? `slot ${client.type}` : 'slot empty';
                    slotElement.dataset.datetime = slotDateTime.format();
                    
                    if (client) {
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
        // Add new appointment from slot
        document.querySelectorAll('.add-appointment').forEach(button => {
            button.addEventListener('click', function() {
                const dateTime = this.dataset.time;
                openClientModal(dateTime);
            });
        });
        
        // Edit appointment
        document.querySelectorAll('.edit-appointment').forEach(button => {
            button.addEventListener('click', function() {
                const clientId = this.dataset.id;
                const client = appState.clients.find(c => c.id === clientId);
                if (client) {
                    openClientModal(null, client);
                }
            });
        });
        
        // Delete appointment
        document.querySelectorAll('.delete-appointment').forEach(button => {
            button.addEventListener('click', function() {
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
        
        // Check if we're at capacity for this client type
        if (!form.dataset.clientId) {  // Only check for new clients
            const clientType = typeSelect.value;
            const typeLimit = appState.clientTypes[clientType].limit;
            
            const clientsOfType = appState.clients.filter(c => 
                c.type === clientType && isClientInCurrentCycle(c)
            ).length;
            
            if (clientsOfType >= typeLimit) {
                alert(`Limite de ${typeLimit} clientes do tipo ${appState.clientTypes[clientType].label} atingido.`);
                return;
            }
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

