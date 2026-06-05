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
    // 2. INICIALIZAR EVENTOS DE ENVÍO
    // ==========================================
    const formRecibo = document.getElementById('form-recibo');
    const formCascaron = document.getElementById('form-cascaron');
    const formGuillotina = document.getElementById('form-guillotina');
    const formEmpaque = document.getElementById('form-empaque');

    if (formRecibo) formRecibo.addEventListener('submit', enviarRecibo);
    if (formCascaron) formCascaron.addEventListener('submit', enviarCascaron);
    if (formGuillotina) formGuillotina.addEventListener('submit', enviarGuillotina);
    if (formEmpaque) formEmpaque.addEventListener('submit', enviarEmpaque);

    // ==========================================
    // 3. CÁLCULOS AUTOMÁTICOS EN GUILLOTINA
    // ==========================================
    const guillotinaMaterial = document.getElementById('guillotina_material');
    const guillotinaTamano = document.getElementById('guillotina_tamano_corte');
    const guillotinaHojasEntrada = document.getElementById('guillotina_hojas_entrada');
    const guillotinaPiezasResultantes = document.getElementById('guillotina_piezas_resultantes');
    const guillotinaMermaRecuperada = document.getElementById('guillotina_merma_recuperada');
    const guillotinaMerma = document.getElementById('guillotina_merma');

    function actualizarCalculosGuillotina() {
        const hojas = parseInt(guillotinaHojasEntrada.value) || 0;
        const material = guillotinaMaterial ? guillotinaMaterial.value : '';
        let factor = (material === 'Cascarón') ? 2 : 1;
        if (guillotinaPiezasResultantes) guillotinaPiezasResultantes.value = hojas * factor;
        const merma = parseInt(guillotinaMerma ? guillotinaMerma.value : 0) || 0;
        if (guillotinaMermaRecuperada) guillotinaMermaRecuperada.value = Math.floor(merma * 0.8);
    }
    if (guillotinaHojasEntrada) {
        guillotinaHojasEntrada.addEventListener('input', actualizarCalculosGuillotina);
        if (guillotinaMerma) guillotinaMerma.addEventListener('input', actualizarCalculosGuillotina);
        if (guillotinaMaterial) guillotinaMaterial.addEventListener('change', actualizarCalculosGuillotina);
    }

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
            actualizarCalculosGuillotina();
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
// 4. FUNCIONES AUXILIARES
// ==========================================
function mostrarNotificacion(formElement, mensaje, esError = false) {
    const notif = formElement.querySelector('.notification');
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
        if (formElement.id === 'form-guillotina') {
            const piezas = document.getElementById('guillotina_piezas_resultantes');
            const recuperada = document.getElementById('guillotina_merma_recuperada');
            if (piezas) piezas.value = '';
            if (recuperada) recuperada.value = '';
        }
    })
    .catch(err => {
        mostrarNotificacion(formElement, "Error de red: " + err.message, true);
    });
}

// ==========================================
// 5. ENVÍOS POR ÁREA
// ==========================================
function enviarRecibo(e) {
    e.preventDefault();
    const form = e.target;
    const token = document.getElementById('recibo_val').value;
    if (!CODIGOS_AUTORIZADOS.includes(token)) {
        mostrarNotificacion(form, "No autorizado. Acceso denegado.", true);
        return;
    }
    const payload = {
        area_action: 'recibo',
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        material: document.getElementById('recibo_material').value,
        cantidad: parseInt(document.getElementById('recibo_cantidad').value) || 0,
        id_tarima: document.getElementById('recibo_id_tarima').value.trim(),
        operador: document.getElementById('recibo_operador').value.trim(),
        turno: document.getElementById('recibo_turno').value
    };
    enviarDatos(payload, form);
}

function enviarCascaron(e) {
    e.preventDefault();
    const form = e.target;
    const idTarima = document.getElementById('cascaron_id_tarima').value.trim();
    if (!idTarima) {
        mostrarNotificacion(form, "Debes especificar el ID de la tarima consumida", true);
        return;
    }
    const payload = {
        area_action: 'cascaron',
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        turno: document.getElementById('cascaron_turno').value,
        piezas: parseInt(document.getElementById('cascaron_piezas').value) || 0,
        id_tarima: idTarima,
        mermas: parseInt(document.getElementById('cascaron_mermas').value) || 0,
        operador: document.getElementById('cascaron_operador').value.trim()
    };
    enviarDatos(payload, form);
}

function enviarGuillotina(e) {
    e.preventDefault();
    const form = e.target;
    const idTarima = document.getElementById('guillotina_id_tarima').value.trim();
    if (!idTarima) {
        mostrarNotificacion(form, "Debes especificar el ID de la tarima consumida", true);
        return;
    }
    const payload = {
        area_action: 'guillotina',
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        material: document.getElementById('guillotina_material').value,
        tamano_corte: document.getElementById('guillotina_tamano_corte').value,
        id_tarima: idTarima,
        hojas_entrada: parseInt(document.getElementById('guillotina_hojas_entrada').value) || 0,
        piezas_resultantes: parseInt(document.getElementById('guillotina_piezas_resultantes').value) || 0,
        merma: parseInt(document.getElementById('guillotina_merma').value) || 0,
        merma_recuperable: parseInt(document.getElementById('guillotina_merma_recuperada').value) || 0,
        operador: document.getElementById('guillotina_operador').value.trim()
    };
    enviarDatos(payload, form);
}

function enviarEmpaque(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
        area_action: 'empaque',
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        producto: document.getElementById('empaque_producto').value,
        tamano: document.getElementById('empaque_tamano').value,
        id_tarima: document.getElementById('empaque_id_tarima').value.trim() || "",
        paquetes: parseInt(document.getElementById('empaque_paquetes').value) || 0,
        operador: document.getElementById('empaque_operador').value.trim()
    };
    enviarDatos(payload, form);
}