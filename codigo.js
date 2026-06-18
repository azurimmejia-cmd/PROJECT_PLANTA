// ==========================================
// CONFIGURACIÓN CENTRALIZADA
// ==========================================
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby0o1KOryiHw9Ge3Dzb0f4MokBzjys9z0DMhgYH1dE1hVk3iNZ3U4QHe-jfryXEg0_j/exec";
const CODIGOS_AUTORIZADOS = ["ESIQIE_2026_1901"];

// ==========================================
// 0. CONTROL DE PANTALLA Y MENÚ
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnEnter = document.getElementById("btn-enter");
    const welcomeScreen = document.getElementById("welcome-screen");
    const mainPortal = document.getElementById("main-portal");
    const systemIndicator = document.getElementById("system-indicator");
    const indicatorText = systemIndicator.querySelector('.indicator-text');

    if (btnEnter) {
        btnEnter.addEventListener("click", () => {
            welcomeScreen.classList.add("d-none");
            mainPortal.classList.remove("d-none");
            indicatorText.innerText = 'KYMA CORE • PORTAL DE PLANTA TOLUCA';
        });
    }

    // ==========================================
    // 1. AUTENTICACIÓN PARA PESTAÑA RECIBO
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const reciboHidden = document.getElementById('recibo_val');

    function cambiarPestana(button) {
        const targetArea = button.getAttribute('data-target');
        if (targetArea === 'recibo') {
            if (reciboHidden && reciboHidden.value && CODIGOS_AUTORIZADOS.includes(reciboHidden.value)) {
                // ya autenticado
            } else {
                const tokenAcceso = prompt("🔒 ACCESO RESTRINGIDO\nIngrese su Código de Validación Industrial:");
                if (!CODIGOS_AUTORIZADOS.includes(tokenAcceso)) {
                    alert("❌ Código incorrecto. Acceso denegado.");
                    const tabCascaron = document.querySelector('.tab-btn[data-target="cascaron"]');
                    if (tabCascaron) cambiarPestana(tabCascaron);
                    return;
                }
                if (reciboHidden) reciboHidden.value = tokenAcceso;
            }
        }
        tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.form-card').forEach(card => card.classList.remove('active'));
        button.classList.add('active');
        const activeCard = document.getElementById('area-' + targetArea);
        if (activeCard) activeCard.classList.add('active');
    }

    tabBtns.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarPestana(button);
        });
    });

    // ==========================================
    // 2. INICIALIZAR EVENTOS DE ENVÍO Y LOTES
    // ==========================================
    const formRecibo = document.getElementById('form-recibo');
    const formCascaron = document.getElementById('form-cascaron');
    const formGuillotina = document.getElementById('form-guillotina');
    const formEmpaque = document.getElementById('form-empaque');

    if (formRecibo) formRecibo.addEventListener('submit', enviarRecibo);
    if (formCascaron) formCascaron.addEventListener('submit', enviarCascaron);
    if (formGuillotina) formGuillotina.addEventListener('submit', enviarGuillotina);
    if (formEmpaque) formEmpaque.addEventListener('submit', enviarEmpaque);

    // Inicializar sistemas de lotes para cada área
    inicializarLotes('recibo');
    inicializarLotes('cascaron');
    inicializarLotes('guillotina');
    inicializarLotes('empaque');

    // ==========================================
    // 3. CÁLCULOS AUTOMÁTICOS EN GUILLOTINA
    // ==========================================
    const guillotinaMaterial = document.getElementById('guillotina_material');
    const guillotinaTamano = document.getElementById('guillotina_tamano_corte');

    // Dinámica tamaños de corte
    const tamañosCascaron = ['1/8 (28x35 cm)', '1/4 (35x56 cm)', '1/2 (56x70 cm)'];
    const tamañosOpalina = ['Carta (21.6x27.9 cm)', 'Oficio (21.6x33 cm)'];
    if (guillotinaMaterial) {
        guillotinaMaterial.addEventListener('change', () => {
            const material = guillotinaMaterial.value;
            let opciones = material === 'Cascarón' ? tamañosCascaron : tamañosOpalina;
            if (guillotinaTamano) {
                guillotinaTamano.innerHTML = '<option value="" disabled selected>Selecciona tamaño...</option>';
                opciones.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t;
                    opt.textContent = t;
                    guillotinaTamano.appendChild(opt);
                });
            }
        });
    }

    // Dinámica para Empaque
    const empaqueProducto = document.getElementById('empaque_producto');
    const empaqueTamano = document.getElementById('empaque_tamano');
    if (empaqueProducto && empaqueTamano) {
        empaqueProducto.addEventListener('change', () => {
            const prod = empaqueProducto.value;
            let opciones = prod === 'Papel Cascarón Terminado' ? ['Tamaño 1/8', 'Tamaño 1/4', 'Tamaño 1/2'] : ['Carta', 'Oficio'];
            empaqueTamano.innerHTML = '<option value="" disabled selected>Selecciona variante...</option>';
            opciones.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                empaqueTamano.appendChild(opt);
            });
        });
    }
});

// ==========================================
// 4. SISTEMA DE LOTES (MÚLTIPLE INGRESO)
// ==========================================
function inicializarLotes(area) {
    const container = document.getElementById(`lotes-list-${area}`);
    const addBtn = document.getElementById(`add-lote-${area}`);
    const countSpan = document.getElementById(`lote-count-${area}`);
    const totalSpan = document.getElementById(`lote-total-${area}`);

    if (!container) return;

    // Función para actualizar contadores y totales
    function actualizarTotales() {
        const items = container.querySelectorAll('.lote-item');
        countSpan.textContent = items.length;

        let total = 0;
        const cantidadInputs = container.querySelectorAll('.lote-cantidad, .lote-hojas');
        cantidadInputs.forEach(input => {
            const val = parseInt(input.value) || 0;
            total += val;
        });
        totalSpan.textContent = total;
    }

    // Función para agregar un nuevo lote
    function agregarLote() {
        const template = container.querySelector('.lote-item');
        if (!template) return;

        const newItem = template.cloneNode(true);
        
        // Limpiar valores
        newItem.querySelectorAll('input').forEach(input => {
            input.value = '';
        });

        // Botón de eliminar
        const removeBtn = newItem.querySelector('.btn-remove-lote');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                if (container.querySelectorAll('.lote-item').length > 1) {
                    newItem.remove();
                    actualizarTotales();
                } else {
                    mostrarNotificacion(document.querySelector(`#form-${area}`), 'Debe haber al menos un lote', true);
                }
            });
        }

        // Eventos para actualizar totales
        newItem.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', actualizarTotales);
        });

        container.appendChild(newItem);
        actualizarTotales();
    }

    // Configurar botón de agregar
    if (addBtn) {
        addBtn.addEventListener('click', agregarLote);
    }

    // Configurar eventos en los inputs existentes
    container.querySelectorAll('.lote-item').forEach(item => {
        const removeBtn = item.querySelector('.btn-remove-lote');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                if (container.querySelectorAll('.lote-item').length > 1) {
                    item.remove();
                    actualizarTotales();
                } else {
                    mostrarNotificacion(document.querySelector(`#form-${area}`), 'Debe haber al menos un lote', true);
                }
            });
        }
        item.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', actualizarTotales);
        });
    });

    // Inicializar totales
    actualizarTotales();
}

// ==========================================
// 5. FUNCIONES AUXILIARES
// ==========================================
function mostrarNotificacion(formElement, mensaje, esError = false) {
    const notif = formElement ? formElement.querySelector('.notification') : null;
    if (!notif) return;
    notif.style.display = "block";
    notif.innerText = mensaje;
    notif.style.background = esError ? "rgba(255,0,0,0.1)" : "rgba(37,211,102,0.12)";
    notif.style.color = esError ? "#b91c1c" : "#15803d";
    setTimeout(() => { notif.style.display = "none"; }, 3000);
}

function enviarDatos(payload, formElement) {
    mostrarNotificacion(formElement, "Sincronizando...");
    fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
    })
    .then(() => {
        mostrarNotificacion(formElement, "¡Sincronización Completada!");
        formElement.reset();
        // Reiniciar lotes
        const area = formElement.id.replace('form-', '');
        const container = document.getElementById(`lotes-list-${area}`);
        if (container) {
            const items = container.querySelectorAll('.lote-item');
            items.forEach((item, index) => {
                if (index > 0) {
                    item.remove();
                } else {
                    item.querySelectorAll('input').forEach(input => {
                        input.value = '';
                    });
                }
            });
            // Actualizar totales
            const countSpan = document.getElementById(`lote-count-${area}`);
            const totalSpan = document.getElementById(`lote-total-${area}`);
            if (countSpan) countSpan.textContent = '1';
            if (totalSpan) totalSpan.textContent = '0';
        }
    })
    .catch(err => {
        mostrarNotificacion(formElement, "Error de red: " + err.message, true);
    });
}

// ==========================================
// 6. RECOLECCIÓN DE DATOS DE LOTES
// ==========================================
function obtenerLotes(area) {
    const container = document.getElementById(`lotes-list-${area}`);
    if (!container) return [];

    const items = container.querySelectorAll('.lote-item');
    const lotes = [];

    items.forEach(item => {
        const idInput = item.querySelector('.lote-id');
        const cantidadInput = item.querySelector('.lote-cantidad, .lote-hojas');
        const mermaInput = item.querySelector('.lote-merma');

        const id = idInput ? idInput.value.trim() : '';
        const cantidad = parseInt(cantidadInput ? cantidadInput.value : 0) || 0;
        const merma = parseInt(mermaInput ? mermaInput.value : 0) || 0;

        if (id) {
            lotes.push({
                id: id,
                cantidad: cantidad,
                merma: merma
            });
        }
    });

    return lotes;
}

// ==========================================
// 7. ENVÍOS POR ÁREA
// ==========================================
function enviarRecibo(e) {
    e.preventDefault();
    const form = e.target;
    const token = document.getElementById('recibo_val').value;
    if (!CODIGOS_AUTORIZADOS.includes(token)) {
        mostrarNotificacion(form, "No autorizado. Acceso denegado.", true);
        return;
    }

    const lotes = obtenerLotes('recibo');
    if (lotes.length === 0) {
        mostrarNotificacion(form, "Debes registrar al menos un lote con ID", true);
        return;
    }

    const payload = {
        area_action: 'recibo',
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        material: document.getElementById('recibo_material').value,
        lotes: lotes,
        total_piezas: lotes.reduce((sum, l) => sum + l.cantidad, 0),
        operador: document.getElementById('recibo_operador').value.trim(),
        turno: document.getElementById('recibo_turno').value
    };
    enviarDatos(payload, form);
}

function enviarCascaron(e) {
    e.preventDefault();
    const form = e.target;

    const lotes = obtenerLotes('cascaron');
    if (lotes.length === 0) {
        mostrarNotificacion(form, "Debes registrar al menos un lote con ID", true);
        return;
    }

    const payload = {
        area_action: 'cascaron',
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        turno: document.getElementById('cascaron_turno').value,
        lotes: lotes,
        total_piezas: lotes.reduce((sum, l) => sum + l.cantidad, 0),
        total_mermas: lotes.reduce((sum, l) => sum + l.merma, 0),
        operador: document.getElementById('cascaron_operador').value.trim()
    };
    enviarDatos(payload, form);
}

function enviarGuillotina(e) {
    e.preventDefault();
    const form = e.target;

    const lotes = obtenerLotes('guillotina');
    if (lotes.length === 0) {
        mostrarNotificacion(form, "Debes registrar al menos un lote con ID", true);
        return;
    }

    const material = document.getElementById('guillotina_material').value;
    const factor = material === 'Cascarón' ? 2 : 1;

    // Calcular piezas resultantes por lote
    const lotesConPiezas = lotes.map(l => ({
        ...l,
        piezas_resultantes: l.cantidad * factor,
        merma_recuperable: Math.floor(l.merma * 0.8)
    }));

    const payload = {
        area_action: 'guillotina',
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        material: material,
        tamano_corte: document.getElementById('guillotina_tamano_corte').value,
        lotes: lotesConPiezas,
        total_hojas: lotes.reduce((sum, l) => sum + l.cantidad, 0),
        total_piezas: lotes.reduce((sum, l) => sum + (l.cantidad * factor), 0),
        total_merma: lotes.reduce((sum, l) => sum + l.merma, 0),
        total_merma_recuperable: lotes.reduce((sum, l) => sum + Math.floor(l.merma * 0.8), 0),
        operador: document.getElementById('guillotina_operador').value.trim()
    };
    enviarDatos(payload, form);
}

function enviarEmpaque(e) {
    e.preventDefault();
    const form = e.target;

    const lotes = obtenerLotes('empaque');
    if (lotes.length === 0) {
        mostrarNotificacion(form, "Debes registrar al menos un lote", true);
        return;
    }

    const payload = {
        area_action: 'empaque',
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        producto: document.getElementById('empaque_producto').value,
        tamano: document.getElementById('empaque_tamano').value,
        lotes: lotes,
        total_paquetes: lotes.reduce((sum, l) => sum + l.cantidad, 0),
        operador: document.getElementById('empaque_operador').value.trim()
    };
    enviarDatos(payload, form);
}