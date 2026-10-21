// Datos de demostración de LearnFex.
//
// Dos modos (ver docs/datos-demo.md):
//
//   1) Emulador (por defecto): crea cuentas en el Auth Emulator, el banco de preguntas, los
//      cuestionarios y un historial realista de cinco estudiantes. Los resultados se generan
//      llamando a la Cloud Function real `calificarPrueba` del Functions Emulator; solo las
//      fechas se ajustan después con escritura de administrador (la función usa serverTimestamp).
//
//        firebase emulators:start --project demo-learnfex
//        npm run seed:demo
//
//   2) Proyecto real (`--real`): NO crea cuentas ni toca Auth. Recibe los correos de estudiantes
//      ya registrados a mano, resuelve sus uid y escribe SOLO el historial (resultados,
//      respuestas, ranking, logros, estadísticas y xp/nivel), replicando exactamente lo que
//      escribe la función. Todo lo demo lleva `esDemo: true` para poder borrarlo con --reset.
//      Accede por la API REST de Firestore con el token de la variable DEMO_ACCESS_TOKEN.
//
// Opciones:
//   --reset            Borra solo lo demo y lo vuelve a crear (con --real: solo borra, salvo que
//                      se pasen --emails).
//   --borrar           Solo borra lo demo, no lo recrea.
//   --real             Modo proyecto real (ver arriba).
//   --emails a@x,b@x   (con --real) Correos de estudiantes ya registrados. En orden reciben los
//                      perfiles: fuerte, medio, flojo. Del cuarto en adelante quedan sin pruebas.
//   --dry-run          (con --real) Imprime qué escribiría, sin escribir.
//   --yes              (con --real) No pide confirmar el id del proyecto.
//   --solo-base        (emulador) Crea cuentas, perfiles y banco, pero ningún historial.
//   --directo          (emulador) Escribe el historial por REST, sin llamar a la función
//                      (mismo camino que --real; sirve para compararlos).
//   --ayuda            Muestra esta ayuda.
//
// El script no lee ni imprime tokens ni credenciales de ningún archivo: el único secreto posible
// es DEMO_ACCESS_TOKEN (variable de entorno, solo modo --real).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { areas as AREAS_SEED, logros as LOGROS_SEED, preguntas as PREGUNTAS_SEED } from "./seed-preguntas.js";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

// Contraseña común de las cuentas demo. Solo existe en el Auth Emulator (nunca en el proyecto real).
const PASSWORD_DEMO = "Demo2026!";
const DOMINIO_DEMO = "learnfex-demo.test";
const PROYECTO_EMULADOR = "demo-learnfex";
const REGION = "us-central1";
const PATRON_HOST_LOCAL = /^(127\.0\.0\.1|localhost|\[::1\]):\d+$/;

// Puertos de firebase.json. Se pueden cambiar con DEMO_AUTH_EMULATOR_HOST, DEMO_FIRESTORE_EMULATOR_HOST
// y DEMO_FUNCTIONS_EMULATOR_HOST (solo hosts locales) si los puertos estándar están ocupados.
const hostLocal = (variable, porDefecto) => {
	const host = process.env[variable] ?? porDefecto;

	if (!PATRON_HOST_LOCAL.test(host)) {
		console.error(`
ERROR: ${variable} solo puede apuntar a 127.0.0.1, localhost o [::1] (con puerto).`);
		process.exit(1);
	}

	return host;
};

const HOST_AUTH = hostLocal("DEMO_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
const HOST_FIRESTORE = hostLocal("DEMO_FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
const HOST_FUNCTIONS = hostLocal("DEMO_FUNCTIONS_EMULATOR_HOST", "127.0.0.1:5001");
const API_KEY_EMULADOR = "demo-key";
const TOKEN_EMULADOR = "owner";
const OFFSET_COLOMBIA_HORAS = 5; // Colombia es UTC-5, sin horario de verano.

// Mismas reglas que functions/src/gamificacion.js y src/repositories/logroRepository.js.
const XP_POR_CORRECTA = 10;
const XP_MAXIMO_POR_PRUEBA = 100;
const XP_POR_NIVEL = 1000;
const CRITERIOS_LOGROS = {
	primer_quiz: (total) => total >= 1,
	cinco_simulacros: (total) => total >= 5,
	diez_simulacros: (total) => total >= 10,
};
// Mismo tope que Quiz.jsx (CANTIDAD_POR_DEFECTO) para los cuestionarios por área.
const CANTIDAD_POR_AREA = 10;

const IDS_AREAS_SEED = AREAS_SEED.map((area) => area.id);
const PREGUNTAS_CON_ID = PREGUNTAS_SEED.map((pregunta, indice) => ({ id: `seed_${indice + 1}`, ...pregunta }));
const IDS_LOGROS_SEED = LOGROS_SEED.map((logro) => logro.id);

const CONFIGURACION_DEMO = {
	nombre: "LearnFex",
	descripcion: "Plataforma de práctica para la prueba ICFES Saber 11.",
	emailSoporte: `soporte@${DOMINIO_DEMO}`,
};

// ---------------------------------------------------------------------------
// Cuentas y perfiles de historial
// ---------------------------------------------------------------------------

// Cada fila de un perfil: [areaId | "simulacro", días atrás, hora de inicio (hora Colombia),
// respuestas correctas, minutos empleados].
const PERFILES = {
	// Estudiante fuerte: 16 pruebas (2 simulacros), nivel 2, los tres logros, primer lugar del ranking.
	fuerte: [
		["ciencias_naturales", 19, "15:30", 6, 12],
		["matematicas", 18, "16:00", 6, 13],
		["lectura_critica", 17, "15:45", 7, 11],
		["ingles", 16, "17:10", 7, 9],
		["sociales_ciudadanas", 15, "16:20", 6, 12],
		["matematicas", 14, "15:00", 7, 12],
		["simulacro", 12, "08:30", 24, 82],
		["lectura_critica", 11, "16:40", 8, 10],
		["ciencias_naturales", 10, "15:15", 7, 13],
		["matematicas", 9, "16:30", 7, 11],
		["ingles", 8, "17:00", 8, 8],
		["sociales_ciudadanas", 7, "15:50", 7, 11],
		["simulacro", 5, "09:00", 27, 79],
		["matematicas", 4, "16:10", 8, 10],
		["lectura_critica", 2, "15:35", 7, 11],
		["ciencias_naturales", 1, "16:25", 8, 12],
	],
	// Estudiante medio: 7 pruebas (1 simulacro), dos logros, sin áreas por debajo de 60%.
	medio: [
		["matematicas", 17, "18:00", 5, 15],
		["lectura_critica", 15, "18:20", 6, 14],
		["ciencias_naturales", 12, "17:45", 5, 16],
		["ingles", 10, "18:10", 5, 11],
		["simulacro", 8, "10:00", 21, 88],
		["sociales_ciudadanas", 5, "18:30", 6, 13],
		["matematicas", 2, "17:55", 6, 14],
	],
	// Estudiante flojo en Matemáticas y Ciencias Naturales: Estadísticas muestra recomendaciones.
	flojo: [
		["matematicas", 14, "19:00", 2, 17],
		["ciencias_naturales", 11, "19:20", 4, 15],
		["matematicas", 7, "19:10", 3, 18],
		["lectura_critica", 3, "19:30", 6, 12],
	],
	// Cuenta que luego se desactiva: tiene un poco de historial hecho mientras estaba activa.
	inactivo: [
		["sociales_ciudadanas", 16, "14:00", 5, 13],
		["ingles", 12, "14:20", 6, 9],
		["lectura_critica", 9, "14:10", 5, 14],
	],
};

const CUENTAS = [
	{
		alias: "admin",
		usuario: "admin",
		nombre: "Andrés Felipe",
		apellido: "Londoño Giraldo",
		rol: "administrador",
		colegio: "",
		perfil: null,
		diasRegistro: 35,
	},
	{
		alias: "valentina",
		usuario: "valentina.ramirez",
		nombre: "Valentina",
		apellido: "Ramírez Ospina",
		rol: "estudiante",
		colegio: "I. E. San José de Calasanz",
		perfil: "fuerte",
	},
	{
		alias: "santiago",
		usuario: "santiago.gomez",
		nombre: "Santiago",
		apellido: "Gómez Herrera",
		rol: "estudiante",
		colegio: "Colegio Nacional Pedro Justo Berrío",
		perfil: "medio",
	},
	{
		alias: "camila",
		usuario: "camila.torres",
		nombre: "Camila",
		apellido: "Torres Vargas",
		rol: "estudiante",
		colegio: "I. E. Técnica Industrial de Bogotá",
		perfil: "flojo",
	},
	{
		alias: "mateo",
		usuario: "mateo.rodriguez",
		nombre: "Mateo",
		apellido: "Rodríguez Castaño",
		rol: "estudiante",
		colegio: "",
		perfil: null,
		diasRegistro: 1,
	},
	{
		alias: "daniela",
		usuario: "daniela.cardona",
		nombre: "Daniela",
		apellido: "Cardona Mejía",
		rol: "estudiante",
		colegio: "Liceo Los Alcázares",
		perfil: "inactivo",
		estadoFinal: "inactivo",
	},
].map((cuenta) => ({ ...cuenta, correo: `${cuenta.usuario}@${DOMINIO_DEMO}` }));

const GUION_POR_ALIAS = {
	admin: "Panel de administración: Dashboard, Usuarios (activar/desactivar), Preguntas, Simulacros, Logros, Reportes y Configuración.",
	valentina: "Estudiante fuerte: nivel 2, 3 logros, primer lugar del ranking, 2 simulacros, Estadísticas sin recomendaciones.",
	santiago: "Estudiante medio: 7 pruebas, 2 logros, puesto intermedio del ranking.",
	camila: "Débil en Matemáticas y Ciencias Naturales: Estadísticas muestra \"Temas recomendados\".",
	mateo: "Estudiante nuevo SIN pruebas: estados vacíos reales de Estadísticas, Historial y Logros.",
	daniela: "Cuenta INACTIVA: el inicio de sesión se bloquea; el administrador puede reactivarla en Usuarios.",
};

// ---------------------------------------------------------------------------
// Utilidades generales
// ---------------------------------------------------------------------------

const log = (...partes) => console.log(...partes);

// Error esperado (uso incorrecto, falta de datos...). Se lanza en lugar de llamar a process.exit
// para no cortar el proceso con conexiones abiertas (en Windows provoca un fallo al salir).
class ErrorDemo extends Error {}

const fallar = (mensaje) => {
	throw new ErrorDemo(mensaje);
};

const hashTexto = (texto) => {
	let h = 2166136261;

	for (const caracter of texto) {
		h ^= caracter.charCodeAt(0);
		h = Math.imul(h, 16777619);
	}

	return h >>> 0;
};

// PRNG determinista (mulberry32): el mismo perfil siempre produce las mismas respuestas.
const crearAleatorio = (semilla) => {
	let estado = hashTexto(semilla);

	return () => {
		estado = (estado + 0x6d2b79f5) | 0;
		let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const mezclar = (lista, aleatorio) => {
	const copia = [...lista];

	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(aleatorio() * (i + 1));

		[copia[i], copia[j]] = [copia[j], copia[i]];
	}

	return copia;
};

const dosDigitos = (n) => String(n).padStart(2, "0");

const formatoFechaColombia = (fecha) =>
	fecha.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" });

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------

const BANDERAS = new Set(["--reset", "--borrar", "--real", "--emails", "--dry-run", "--yes", "--solo-base", "--directo", "--ayuda"]);

const leerArgumentos = (argv) => {
	const opciones = {};
	let correos = null;

	for (let i = 0; i < argv.length; i++) {
		const [nombre, valorInline] = argv[i].split(/=(.*)/s);

		if (!BANDERAS.has(nombre)) {
			fallar(`Opción desconocida: ${nombre}. Usá --ayuda para ver las opciones.`);
		}

		if (nombre === "--emails") {
			const valor = valorInline ?? argv[++i];

			if (!valor || valor.startsWith("--")) {
				fallar("--emails necesita una lista de correos separados por coma.");
			}

			correos = valor.split(",").map((correo) => correo.trim().toLowerCase()).filter(Boolean);
		} else {
			opciones[nombre.slice(2)] = true;
		}
	}

	return { ...opciones, correos };
};

// ---------------------------------------------------------------------------
// HTTP y codificación de Firestore REST
// ---------------------------------------------------------------------------

const http = async (metodo, url, { cuerpo, token, permitir404 = false } = {}) => {
	const cabeceras = { "Content-Type": "application/json" };

	if (token) {
		cabeceras.Authorization = `Bearer ${token}`;
	}

	const respuesta = await fetch(url, {
		method: metodo,
		headers: cabeceras,
		body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
	});

	const texto = await respuesta.text();
	let json;

	try {
		json = texto ? JSON.parse(texto) : null;
	} catch {
		json = null;
	}

	if (!respuesta.ok) {
		if (respuesta.status === 404 && permitir404) {
			return null;
		}

		const detalle = json?.error?.message ?? texto.slice(0, 200);
		const error = new Error(`${metodo} ${url} -> ${respuesta.status} ${detalle}`);

		error.status = respuesta.status;
		error.detalle = json?.error ?? null;

		throw error;
	}

	return json;
};

const aValor = (valor) => {
	if (valor === null || valor === undefined) return { nullValue: null };
	if (valor instanceof Date) return { timestampValue: valor.toISOString() };
	if (typeof valor === "string") return { stringValue: valor };
	if (typeof valor === "boolean") return { booleanValue: valor };
	if (typeof valor === "number") return Number.isInteger(valor) ? { integerValue: String(valor) } : { doubleValue: valor };
	if (Array.isArray(valor)) return { arrayValue: { values: valor.map(aValor) } };

	return { mapValue: { fields: aCampos(valor) } };
};

const aCampos = (objeto) => Object.fromEntries(Object.entries(objeto).map(([clave, valor]) => [clave, aValor(valor)]));

const deValor = (valor) => {
	if ("stringValue" in valor) return valor.stringValue;
	if ("integerValue" in valor) return Number(valor.integerValue);
	if ("doubleValue" in valor) return valor.doubleValue;
	if ("booleanValue" in valor) return valor.booleanValue;
	if ("timestampValue" in valor) return new Date(valor.timestampValue);
	if ("nullValue" in valor) return null;
	if ("arrayValue" in valor) return (valor.arrayValue.values ?? []).map(deValor);
	if ("mapValue" in valor) return deCampos(valor.mapValue.fields ?? {});

	return undefined;
};

const deCampos = (campos) => Object.fromEntries(Object.entries(campos).map(([clave, valor]) => [clave, deValor(valor)]));

const deDocumento = (documento) => {
	const ruta = documento.name.split("/documents/")[1];

	return { id: ruta.split("/").at(-1), ruta, ...deCampos(documento.fields ?? {}) };
};

const rutaCodificada = (ruta) => ruta.split("/").map(encodeURIComponent).join("/");

// Cliente mínimo de la API REST de Firestore. Con `emuladorHost` apunta al emulador (acepta
// "Authorization: Bearer owner" y se salta las reglas); sin él apunta a Firestore real, donde el
// token de la variable DEMO_ACCESS_TOKEN actúa con los permisos IAM de quien lo generó.
const crearFirestore = ({ proyecto, emuladorHost = null, token, dryRun = false }) => {
	const raiz = emuladorHost
		? `http://${emuladorHost}/v1/projects/${proyecto}/databases/(default)/documents`
		: `https://firestore.googleapis.com/v1/projects/${proyecto}/databases/(default)/documents`;
	const nombreDoc = (ruta) => `projects/${proyecto}/databases/(default)/documents/${ruta}`;
	const pendientes = [];

	const aEscritura = (operacion) => {
		const name = nombreDoc(operacion.ruta);

		if (operacion.tipo === "delete") {
			return { delete: name };
		}

		const fields = aCampos(operacion.datos);

		if (operacion.tipo === "merge") {
			return { update: { name, fields }, updateMask: { fieldPaths: Object.keys(operacion.datos) } };
		}

		return { update: { name, fields } };
	};

	return {
		proyecto,
		dryRun,
		pendientes,

		async get(ruta) {
			const documento = await http("GET", `${raiz}/${rutaCodificada(ruta)}`, { token, permitir404: true });

			return documento ? deDocumento(documento) : null;
		},

		async listar(ruta) {
			const resultado = [];
			let pagina = "";

			do {
				const url = `${raiz}/${rutaCodificada(ruta)}?pageSize=300${pagina ? `&pageToken=${encodeURIComponent(pagina)}` : ""}`;
				const respuesta = await http("GET", url, { token });

				(respuesta?.documents ?? []).forEach((documento) => resultado.push(deDocumento(documento)));
				pagina = respuesta?.nextPageToken ?? "";
			} while (pagina);

			return resultado;
		},

		// Consulta de igualdad sobre una colección (de primer nivel o subcolección de `padre`).
		async consultar({ padre = "", coleccion, campo, valor }) {
			const url = `${raiz}${padre ? `/${rutaCodificada(padre)}` : ""}:runQuery`;
			const respuesta = await http("POST", url, {
				token,
				cuerpo: {
					structuredQuery: {
						from: [{ collectionId: coleccion }],
						where: { fieldFilter: { field: { fieldPath: campo }, op: "EQUAL", value: aValor(valor) } },
					},
				},
			});

			return (respuesta ?? []).filter((fila) => fila.document).map((fila) => deDocumento(fila.document));
		},

		// operaciones: [{ tipo: "set" | "merge" | "delete", ruta, datos? }]
		async escribir(operaciones) {
			if (operaciones.length === 0) {
				return;
			}

			if (dryRun) {
				pendientes.push(...operaciones);

				return;
			}

			for (let i = 0; i < operaciones.length; i += 200) {
				const writes = operaciones.slice(i, i + 200).map(aEscritura);

				await http("POST", `${raiz}:commit`, { token, cuerpo: { writes } });
			}
		},
	};
};

// ---------------------------------------------------------------------------
// Auth Emulator y Functions Emulator (solo modo emulador)
// ---------------------------------------------------------------------------

const urlAuth = (accion) => `http://${HOST_AUTH}/identitytoolkit.googleapis.com/v1/accounts:${accion}?key=${API_KEY_EMULADOR}`;

const iniciarSesionEmulador = (correo) =>
	http("POST", urlAuth("signInWithPassword"), { cuerpo: { email: correo, password: PASSWORD_DEMO, returnSecureToken: true } });

// Crea la cuenta en el Auth Emulator; si ya existe, inicia sesión (idempotente).
const crearOIniciarSesion = async (cuenta) => {
	try {
		return await http("POST", urlAuth("signUp"), {
			cuerpo: {
				email: cuenta.correo,
				password: PASSWORD_DEMO,
				displayName: `${cuenta.nombre} ${cuenta.apellido}`,
				returnSecureToken: true,
			},
		});
	} catch (error) {
		if (error.detalle?.message === "EMAIL_EXISTS") {
			return iniciarSesionEmulador(cuenta.correo);
		}

		throw error;
	}
};

const eliminarCuentaEmulador = async (cuenta) => {
	try {
		const sesion = await iniciarSesionEmulador(cuenta.correo);

		await http("POST", urlAuth("delete"), { cuerpo: { idToken: sesion.idToken } });

		return true;
	} catch {
		return false;
	}
};

// Protocolo de las funciones "callable" (https://firebase.google.com/docs/functions/callable-reference).
const llamarCalificarPrueba = async (proyecto, idToken, datos) => {
	const url = `http://${HOST_FUNCTIONS}/${proyecto}/${REGION}/calificarPrueba`;
	const respuesta = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
		body: JSON.stringify({ data: datos }),
	});
	const json = await respuesta.json().catch(() => ({}));

	if (!respuesta.ok || json.error) {
		throw new Error(`calificarPrueba -> ${respuesta.status} ${json.error?.status ?? ""} ${json.error?.message ?? ""}`.trim());
	}

	return json.result;
};

const comprobarEmulador = async (nombre, host) => {
	try {
		await fetch(`http://${host}/`);
	} catch {
		fallar(
			`No se puede conectar con el emulador de ${nombre} en ${host}. ` +
				`Levantá los emuladores primero: firebase emulators:start --project ${PROYECTO_EMULADOR}`
		);
	}
};

// ---------------------------------------------------------------------------
// Banco de preguntas leído de Firestore
// ---------------------------------------------------------------------------

const leerBanco = async (fs) => {
	const [areasCrudas, preguntasCrudas, logrosCrudos] = await Promise.all([
		fs.listar("areas"),
		fs.listar("preguntas"),
		fs.listar("logros"),
	]);

	const areas = areasCrudas.sort((a, b) => a.id.localeCompare(b.id));
	const preguntasPorArea = {};

	areas.forEach((area) => {
		preguntasPorArea[area.id] = preguntasCrudas
			.filter((pregunta) => pregunta.areaId === area.id)
			.sort((a, b) => a.id.localeCompare(b.id));
	});

	return {
		areas,
		preguntasPorArea,
		totalPreguntas: preguntasCrudas.length,
		logros: logrosCrudos.sort((a, b) => a.id.localeCompare(b.id)),
	};
};

const validarBanco = (banco) => {
	if (banco.areas.length < 5) {
		fallar(`Faltan áreas: hay ${banco.areas.length} y el simulacro necesita 5. Cargá el banco con scripts/seed-preguntas.js.`);
	}

	const incompletas = banco.areas.filter((area) => (banco.preguntasPorArea[area.id]?.length ?? 0) < Math.max(area.numPreguntas ?? 6, 1));

	if (incompletas.length > 0) {
		fallar(`Faltan preguntas en: ${incompletas.map((area) => area.nombre).join(", ")}. Cargá el banco con scripts/seed-preguntas.js.`);
	}

	if (banco.logros.length === 0) {
		fallar("El catálogo de logros está vacío. Cargalo con scripts/seed-preguntas.js.");
	}
};

// ---------------------------------------------------------------------------
// Plan del historial (puro y determinista) y réplica de la lógica de la función
// ---------------------------------------------------------------------------

// Instante local de Colombia -> Date (UTC).
const instanteColombia = (ahora, diasAtras, hora) => {
	const [hh, mm] = hora.split(":").map(Number);
	const referencia = new Date(ahora.getTime() - OFFSET_COLOMBIA_HORAS * 3600 * 1000);

	return new Date(
		Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), referencia.getUTCDate() - diasAtras, hh + OFFSET_COLOMBIA_HORAS, mm)
	);
};

const construirPrueba = (perfil, indice, definicion, banco, ahora) => {
	const [destino, diasAtras, hora, correctas, minutos] = definicion;
	const aleatorio = crearAleatorio(`${perfil}-${indice}`);
	const esSimulacro = destino === "simulacro";

	// Mismo armado que quizService: por área hasta 10 preguntas al azar; el simulacro toma
	// area.numPreguntas de cada área, en el orden de las áreas.
	let preguntas;
	let cuestionario;

	if (esSimulacro) {
		preguntas = banco.areas.flatMap((area) => mezclar(banco.preguntasPorArea[area.id], aleatorio).slice(0, area.numPreguntas));
		cuestionario = {
			titulo: "Simulacro general",
			descripcion: "Simulacro con preguntas de todas las áreas.",
			tipo: "simulacro",
			areaId: null,
			duracion: banco.areas.reduce((total, area) => total + (area.tiempoLimite || 0), 0),
		};
	} else {
		const area = banco.areas.find((item) => item.id === destino);

		if (!area) {
			fallar(`El perfil ${perfil} usa el área ${destino}, que no existe en el banco.`);
		}

		preguntas = mezclar(banco.preguntasPorArea[area.id], aleatorio).slice(0, CANTIDAD_POR_AREA);
		cuestionario = {
			titulo: `Cuestionario de ${area.nombre}`,
			descripcion: area.descripcion,
			tipo: "cuestionario",
			areaId: area.id,
			duracion: area.tiempoLimite,
		};
	}

	const total = preguntas.length;
	const aciertos = Math.min(correctas, total);
	const indicesCorrectos = new Set(mezclar([...preguntas.keys()], aleatorio).slice(0, aciertos));
	const incorrectas = total - aciertos;
	const porSinResponder = incorrectas >= 4 ? (esSimulacro ? 2 : 1) : 0;
	const indicesIncorrectos = mezclar([...preguntas.keys()].filter((i) => !indicesCorrectos.has(i)), aleatorio);
	const sinResponder = new Set(indicesIncorrectos.slice(0, porSinResponder));

	const respuestas = preguntas.map((pregunta, i) => {
		if (indicesCorrectos.has(i)) {
			return { preguntaId: pregunta.id, respuestaSeleccionada: pregunta.respuestaCorrecta, esCorrecta: true };
		}

		if (sinResponder.has(i)) {
			return { preguntaId: pregunta.id, respuestaSeleccionada: null, esCorrecta: false };
		}

		const distractores = pregunta.opciones.map((opcion) => opcion.id).filter((id) => id !== pregunta.respuestaCorrecta);

		return {
			preguntaId: pregunta.id,
			respuestaSeleccionada: distractores[Math.floor(aleatorio() * distractores.length)],
			esCorrecta: false,
		};
	});

	const tiempoEmpleado = minutos * 60 + Math.floor(aleatorio() * 50) + 5;
	let inicio = instanteColombia(ahora, diasAtras, hora);

	// Nunca en el futuro: si el día 0 todavía no pasó, se corre al día anterior.
	while (inicio.getTime() + tiempoEmpleado * 1000 > ahora.getTime() - 5 * 60 * 1000) {
		inicio = new Date(inicio.getTime() - 24 * 3600 * 1000);
	}

	const fecha = new Date(inicio.getTime() + tiempoEmpleado * 1000);

	return {
		numero: indice + 1,
		cuestionarioId: `demo_${perfil}_${dosDigitos(indice + 1)}`,
		cuestionario: {
			...cuestionario,
			estado: "activo",
			preguntas: preguntas.map((pregunta, i) => ({ preguntaId: pregunta.id, orden: i + 1 })),
			fechaCreacion: inicio,
		},
		areaId: cuestionario.areaId,
		tipo: cuestionario.tipo,
		inicio,
		fecha,
		tiempoEmpleado,
		respuestas,
		respuestasCorrectas: aciertos,
		respuestasIncorrectas: incorrectas,
		puntaje: total > 0 ? Math.round((aciertos / total) * 100) : 0,
	};
};

const planDePerfil = (perfil, banco, ahora) => {
	const definiciones = PERFILES[perfil];

	if (!definiciones) {
		return [];
	}

	return definiciones
		.map((definicion, indice) => construirPrueba(perfil, indice, definicion, banco, ahora))
		.sort((a, b) => a.inicio - b.inicio);
};

// Réplica de aplicarGamificacion (functions/src/gamificacion.js) sobre las pruebas en orden cronológico.
const simularGamificacion = (pruebas, catalogoLogros) => {
	let xp = 0;
	let nivel = 1;
	const logros = [];

	pruebas.forEach((prueba, indice) => {
		xp += Math.min(prueba.respuestasCorrectas * XP_POR_CORRECTA, XP_MAXIMO_POR_PRUEBA);
		nivel = Math.max(Math.floor(xp / XP_POR_NIVEL) + 1, nivel);

		catalogoLogros.forEach((logro) => {
			const yaObtenido = logros.some((obtenido) => obtenido.id === logro.id);

			if (!yaObtenido && Object.hasOwn(CRITERIOS_LOGROS, logro.criterio) && CRITERIOS_LOGROS[logro.criterio](indice + 1)) {
				logros.push({ id: logro.id, fecha: prueba.fecha });
			}
		});
	});

	return { xp, nivel, logros, ultimaFecha: pruebas.at(-1)?.fecha ?? null };
};

// Réplica de calcularEstadisticas (src/services/statisticsService.js), lo que persiste upsertEstadistica.
const calcularEstadisticasProgreso = (pruebas, areas) =>
	areas.map((area) => {
		const delArea = pruebas.filter((prueba) => prueba.areaId === area.id);
		const totalPreguntas = delArea.reduce((total, prueba) => total + prueba.respuestasCorrectas + prueba.respuestasIncorrectas, 0);
		const correctas = delArea.reduce((total, prueba) => total + prueba.respuestasCorrectas, 0);

		return {
			areaId: area.id,
			nombre: area.nombre,
			totalPruebas: delArea.length,
			promedioAciertos: totalPreguntas > 0 ? Math.round((correctas / totalPreguntas) * 100) : 0,
			porcentajeAvance: delArea.length > 0 ? 100 : 0,
		};
	});

const promedio = (valores) => (valores.length === 0 ? 0 : Math.round(valores.reduce((suma, valor) => suma + valor, 0) / valores.length));

// ---------------------------------------------------------------------------
// Operaciones de escritura (formas idénticas a las de la función y de la app)
// ---------------------------------------------------------------------------

const operacionesDePrueba = (uid, prueba) => {
	const resultadoId = `${prueba.cuestionarioId}_${uid}`;
	const rutaResultado = `resultados/${resultadoId}`;

	return [
		{ tipo: "set", ruta: `cuestionarios/${prueba.cuestionarioId}`, datos: { ...prueba.cuestionario, esDemo: true } },
		{
			tipo: "set",
			ruta: rutaResultado,
			datos: {
				usuarioId: uid,
				cuestionarioId: prueba.cuestionarioId,
				puntaje: prueba.puntaje,
				respuestasCorrectas: prueba.respuestasCorrectas,
				respuestasIncorrectas: prueba.respuestasIncorrectas,
				tiempoEmpleado: prueba.tiempoEmpleado,
				fecha: prueba.fecha,
				esDemo: true,
			},
		},
		...prueba.respuestas.map((respuesta, i) => ({
			tipo: "set",
			ruta: `${rutaResultado}/respuestas/r${dosDigitos(i + 1)}`,
			datos: { ...respuesta, usuarioId: uid },
		})),
	];
};

const operacionesDeEstado = (uid, usuario, pruebas, areas, gamificacion) => [
	{ tipo: "merge", ruta: `usuarios/${uid}`, datos: { xp: gamificacion.xp, nivel: gamificacion.nivel } },
	{
		tipo: "set",
		ruta: `ranking/${uid}`,
		datos: {
			usuarioId: uid,
			puntajeAcumulado: gamificacion.xp,
			nombre: usuario.nombre ?? "",
			apellido: usuario.apellido ?? "",
			nivel: gamificacion.nivel,
			fechaActualizacion: gamificacion.ultimaFecha,
			esDemo: true,
		},
	},
	...gamificacion.logros.map((logro) => ({
		tipo: "set",
		ruta: `usuarios/${uid}/logrosObtenidos/${logro.id}`,
		datos: { fechaObtenido: logro.fecha, esDemo: true },
	})),
	...operacionesDeEstadisticas(uid, pruebas, areas),
];

const operacionesDeEstadisticas = (uid, pruebas, areas) =>
	calcularEstadisticasProgreso(pruebas, areas).map((estadistica) => ({
		tipo: "set",
		ruta: `estadisticas_progreso/${uid}_${estadistica.areaId}`,
		datos: {
			usuarioId: uid,
			areaId: estadistica.areaId,
			porcentajeAvance: estadistica.porcentajeAvance,
			promedioAciertos: estadistica.promedioAciertos,
			esDemo: true,
		},
	}));

// ---------------------------------------------------------------------------
// Borrado de lo demo
// ---------------------------------------------------------------------------

// Borra solo lo demo. En el emulador también borra el banco y las cuentas de Auth que cargó este
// script; con `modoReal` jamás toca áreas, preguntas, logros, configuración, usuarios ni Auth: solo
// los documentos marcados con esDemo y, de los usuarios, devuelve xp/nivel a 0/1 si no tienen
// actividad propia fuera de lo demo.
const borrarDemo = async (fs, { modoReal }) => {
	log("Borrando datos demo...");

	const conteo = new Map();
	const sumar = (coleccion, cantidad = 1) => conteo.set(coleccion, (conteo.get(coleccion) ?? 0) + cantidad);
	const operaciones = [];
	const borrar = (ruta) => {
		operaciones.push({ tipo: "delete", ruta });
		sumar(ruta.split("/").filter((_, i) => i % 2 === 0).join("/"));
	};

	const resultadosDemo = await fs.consultar({ coleccion: "resultados", campo: "esDemo", valor: true });
	const usuariosDemo = modoReal ? [] : await fs.consultar({ coleccion: "usuarios", campo: "esDemo", valor: true });
	const uids = new Set([...resultadosDemo.map((resultado) => resultado.usuarioId), ...usuariosDemo.map((usuario) => usuario.id)]);
	const cuestionariosABorrar = new Set();
	const usuariosAReiniciar = [];

	for (const uid of uids) {
		const resultados = await fs.consultar({ coleccion: "resultados", campo: "usuarioId", valor: uid });
		// En modo real solo se borra lo marcado; en el emulador también la actividad que los
		// estudiantes demo generaron durante la presentación.
		const aBorrar = modoReal ? resultados.filter((resultado) => resultado.esDemo === true) : resultados;
		const actividadPropia = resultados.some((resultado) => resultado.esDemo !== true);

		for (const resultado of aBorrar) {
			const respuestas = await fs.listar(`${resultado.ruta}/respuestas`);

			respuestas.forEach((respuesta) => borrar(respuesta.ruta));
			borrar(resultado.ruta);
			cuestionariosABorrar.add(resultado.cuestionarioId);
		}

		if (modoReal && actividadPropia) {
			log(`  ! ${uid}: tiene pruebas reales además de las demo; se conservan su xp, ranking y logros.`);
			continue;
		}

		const logros = await fs.listar(`usuarios/${uid}/logrosObtenidos`);

		logros.forEach((logro) => borrar(logro.ruta));
		borrar(`ranking/${uid}`);

		const estadisticas = await fs.consultar({ coleccion: "estadisticas_progreso", campo: "usuarioId", valor: uid });

		estadisticas.forEach((estadistica) => borrar(estadistica.ruta));

		if (modoReal) {
			usuariosAReiniciar.push(uid);
		} else {
			borrar(`usuarios/${uid}`);
		}
	}

	const cuestionariosDemo = await fs.consultar({ coleccion: "cuestionarios", campo: "esDemo", valor: true });

	cuestionariosDemo.forEach((cuestionario) => cuestionariosABorrar.add(cuestionario.id));
	cuestionariosABorrar.forEach((id) => borrar(`cuestionarios/${id}`));

	usuariosAReiniciar.forEach((uid) => {
		operaciones.push({ tipo: "merge", ruta: `usuarios/${uid}`, datos: { xp: 0, nivel: 1 } });
		sumar("usuarios (xp/nivel a 0/1)");
	});

	if (!modoReal) {
		IDS_AREAS_SEED.forEach((id) => borrar(`areas/${id}`));
		PREGUNTAS_CON_ID.forEach((pregunta) => borrar(`preguntas/${pregunta.id}`));
		IDS_LOGROS_SEED.forEach((id) => borrar(`logros/${id}`));
		borrar("configuracion/general");
	}

	await fs.escribir(operaciones);

	if (!modoReal) {
		for (const cuenta of CUENTAS) {
			if (await eliminarCuentaEmulador(cuenta)) {
				sumar("cuentas de Auth");
			}
		}
	}

	[...conteo.entries()].forEach(([coleccion, cantidad]) => log(`  - ${coleccion}: ${cantidad}`));
	log(fs.dryRun ? "  (dry-run: no se borró nada)" : "Listo: lo demo fue borrado.");
};

// ---------------------------------------------------------------------------
// Resumen impreso
// ---------------------------------------------------------------------------

const imprimirTabla = (filas, columnas) => {
	const anchos = columnas.map((columna) => Math.max(columna.length, ...filas.map((fila) => String(fila[columna] ?? "").length)));
	const linea = (valores) => `| ${valores.map((valor, i) => String(valor).padEnd(anchos[i])).join(" | ")} |`;

	log(linea(columnas));
	log(`|${anchos.map((ancho) => "-".repeat(ancho + 2)).join("|")}|`);
	filas.forEach((fila) => log(linea(columnas.map((columna) => fila[columna] ?? ""))));
};

const imprimirResumenEmulador = (cuentas, planes, banco, soloBase) => {
	log("\n==================== DATOS DEMO LISTOS ====================\n");
	log(`Contraseña común de todas las cuentas: ${PASSWORD_DEMO}\n`);

	imprimirTabla(
		cuentas.map((cuenta) => ({
			Correo: cuenta.correo,
			Rol: cuenta.rol,
			Estado: cuenta.estadoFinal ?? "activo",
			"Qué mostrar": GUION_POR_ALIAS[cuenta.alias],
		})),
		["Correo", "Rol", "Estado", "Qué mostrar"]
	);

	if (soloBase) {
		log("\n(--solo-base: no se generó historial.)");

		return;
	}

	const todas = cuentas.flatMap((cuenta) => planes[cuenta.alias]?.pruebas ?? []);
	const porArea = banco.areas.map((area) => `${area.nombre}: ${promedio(todas.filter((prueba) => prueba.areaId === area.id).map((prueba) => prueba.puntaje))}%`);

	log("\nQué debería ver el administrador:");
	log(`  Dashboard: ${cuentas.length} usuarios, ${todas.length} pruebas, ${banco.totalPreguntas} preguntas, promedio general ${promedio(todas.map((prueba) => prueba.puntaje))}%.`);
	log(`  Reportes por área: ${porArea.join(" | ")}.`);

	log("\nPor estudiante (según el plan):");
	imprimirTabla(
		cuentas
			.filter((cuenta) => cuenta.rol === "estudiante")
			.map((cuenta) => {
				const plan = planes[cuenta.alias];

				return {
					Estudiante: `${cuenta.nombre} ${cuenta.apellido}`,
					Pruebas: plan?.pruebas.length ?? 0,
					Promedio: `${promedio((plan?.pruebas ?? []).map((prueba) => prueba.puntaje))}%`,
					XP: plan?.gamificacion.xp ?? 0,
					Nivel: plan?.gamificacion.nivel ?? 1,
					Logros: plan?.gamificacion.logros.length ?? 0,
				};
			}),
		["Estudiante", "Pruebas", "Promedio", "XP", "Nivel", "Logros"]
	);
};

// ---------------------------------------------------------------------------
// Modo emulador
// ---------------------------------------------------------------------------

const fechaRegistroDe = (cuenta, plan, ahora) => {
	if (plan?.pruebas.length) {
		return new Date(plan.pruebas[0].inicio.getTime() - 2 * 24 * 3600 * 1000);
	}

	return instanteColombia(ahora, cuenta.diasRegistro ?? 3, "10:00");
};

const verificarCruzado = async (fs, cuentas, planes) => {
	log("\nVerificación cruzada (lo que escribió la función vs. el plan):");
	let errores = 0;
	const fallo = (mensaje) => {
		errores++;
		log(`  [FALLA] ${mensaje}`);
	};

	for (const cuenta of cuentas.filter((item) => item.rol === "estudiante")) {
		const plan = planes[cuenta.alias];
		const esperadas = plan?.pruebas ?? [];
		const usuario = await fs.get(`usuarios/${cuenta.uid}`);
		const resultados = await fs.consultar({ coleccion: "resultados", campo: "usuarioId", valor: cuenta.uid });
		const logros = (await fs.listar(`usuarios/${cuenta.uid}/logrosObtenidos`)).map((logro) => logro.id).sort();
		const ranking = await fs.get(`ranking/${cuenta.uid}`);
		const nombre = cuenta.nombre;

		if (resultados.length !== esperadas.length) {
			fallo(`${nombre}: ${resultados.length} resultados y se esperaban ${esperadas.length}.`);
		}

		for (const esperada of esperadas) {
			const real = resultados.find((resultado) => resultado.id === `${esperada.cuestionarioId}_${cuenta.uid}`);

			if (!real) {
				fallo(`${nombre}: falta el resultado de ${esperada.cuestionarioId}.`);
				continue;
			}

			const iguales =
				real.puntaje === esperada.puntaje &&
				real.respuestasCorrectas === esperada.respuestasCorrectas &&
				real.respuestasIncorrectas === esperada.respuestasIncorrectas &&
				real.tiempoEmpleado === esperada.tiempoEmpleado;

			if (!iguales) {
				fallo(`${nombre}: ${esperada.cuestionarioId} difiere (puntaje ${real.puntaje} vs ${esperada.puntaje}).`);
			}

			const respuestasReales = await fs.listar(`${real.ruta}/respuestas`);
			const clave = (respuesta) => `${respuesta.preguntaId}|${respuesta.respuestaSeleccionada}|${respuesta.esCorrecta}|${respuesta.usuarioId ?? cuenta.uid}`;
			const setReal = respuestasReales.map(clave).sort().join(";");
			const setEsperado = esperada.respuestas.map((respuesta) => clave({ ...respuesta, usuarioId: cuenta.uid })).sort().join(";");

			if (setReal !== setEsperado) {
				fallo(`${nombre}: las respuestas de ${esperada.cuestionarioId} difieren.`);
			}
		}

		if (esperadas.length > 0) {
			if (usuario?.xp !== plan.gamificacion.xp || usuario?.nivel !== plan.gamificacion.nivel) {
				fallo(`${nombre}: xp/nivel reales ${usuario?.xp}/${usuario?.nivel} vs plan ${plan.gamificacion.xp}/${plan.gamificacion.nivel}.`);
			}

			if (ranking?.puntajeAcumulado !== plan.gamificacion.xp) {
				fallo(`${nombre}: ranking ${ranking?.puntajeAcumulado} vs plan ${plan.gamificacion.xp}.`);
			}

			const logrosEsperados = plan.gamificacion.logros.map((logro) => logro.id).sort();

			if (logros.join(",") !== logrosEsperados.join(",")) {
				fallo(`${nombre}: logros reales [${logros}] vs plan [${logrosEsperados}].`);
			}
		} else if (resultados.length > 0 || logros.length > 0 || ranking) {
			fallo(`${nombre}: debería estar sin actividad.`);
		}

		log(`  ${nombre}: ${esperadas.length} pruebas, xp ${usuario?.xp}, nivel ${usuario?.nivel}, logros [${logros}]`);
	}

	log(errores === 0 ? "Verificación cruzada: OK (la función real produjo exactamente lo planeado)." : `Verificación cruzada: ${errores} diferencia(s).`);

	return errores === 0;
};

const modoEmulador = async (opciones) => {
	const proyecto = process.env.DEMO_PROJECT_ID ?? PROYECTO_EMULADOR;

	if (!proyecto.startsWith("demo-")) {
		fallar(`En modo emulador el proyecto debe empezar con "demo-" (recibido: ${proyecto}). Para un proyecto real usá --real.`);
	}

	if (opciones["dry-run"]) {
		fallar("--dry-run solo aplica con --real.");
	}

	await comprobarEmulador("Auth", HOST_AUTH);
	await comprobarEmulador("Firestore", HOST_FIRESTORE);

	if (!opciones["solo-base"] && !opciones.directo) {
		await comprobarEmulador("Functions", HOST_FUNCTIONS);
	}

	log(`Modo emulador. Proyecto: ${proyecto}`);

	const fs = crearFirestore({ proyecto, emuladorHost: HOST_FIRESTORE, token: TOKEN_EMULADOR });

	if (opciones.reset || opciones.borrar) {
		await borrarDemo(fs, { modoReal: false });
	}

	if (opciones.borrar) {
		return;
	}

	const ahora = new Date();
	const cuentas = CUENTAS.map((cuenta) => ({ ...cuenta }));

	// 1. Cuentas en el Auth Emulator.
	log("\n1) Cuentas en el Auth Emulator...");

	const sesiones = {};

	for (const cuenta of cuentas) {
		const sesion = await crearOIniciarSesion(cuenta);

		cuenta.uid = sesion.localId;
		sesiones[cuenta.alias] = sesion.idToken;
		log(`  ${cuenta.correo} -> ${cuenta.uid}`);
	}

	// 2. Banco: áreas, preguntas, logros y configuración (mismos datos que scripts/seed-preguntas.js).
	log("\n2) Banco de preguntas, logros y configuración...");

	await fs.escribir([
		...AREAS_SEED.map((area) => ({ tipo: "set", ruta: `areas/${area.id}`, datos: area })),
		...PREGUNTAS_CON_ID.map(({ id, ...pregunta }) => ({ tipo: "set", ruta: `preguntas/${id}`, datos: pregunta })),
		...LOGROS_SEED.map((logro) => ({ tipo: "set", ruta: `logros/${logro.id}`, datos: logro })),
		{ tipo: "set", ruta: "configuracion/general", datos: CONFIGURACION_DEMO },
	]);
	log(`  ${AREAS_SEED.length} áreas, ${PREGUNTAS_CON_ID.length} preguntas, ${LOGROS_SEED.length} logros.`);

	const banco = await leerBanco(fs);

	validarBanco(banco);

	// 3. Plan del historial y perfiles de usuario.
	const planes = {};

	for (const cuenta of cuentas) {
		const pruebas = cuenta.perfil && !opciones["solo-base"] ? planDePerfil(cuenta.perfil, banco, ahora) : [];

		planes[cuenta.alias] = { pruebas, gamificacion: simularGamificacion(pruebas, banco.logros) };
	}

	log("\n3) Perfiles de usuario (colección usuarios)...");

	const creadas = new Set();

	for (const cuenta of cuentas) {
		const existente = await fs.get(`usuarios/${cuenta.uid}`);

		if (existente) {
			log(`  ${cuenta.correo}: ya existía, no se modifica.`);
			continue;
		}

		const fechaRegistro = fechaRegistroDe(cuenta, planes[cuenta.alias], ahora);

		// Mismo documento que createUserProfile (userRepository), más la marca esDemo.
		await fs.escribir([
			{
				tipo: "set",
				ruta: `usuarios/${cuenta.uid}`,
				datos: {
					nombre: cuenta.nombre,
					apellido: cuenta.apellido,
					correo: cuenta.correo,
					rol: cuenta.rol,
					estado: "activo",
					xp: 0,
					nivel: 1,
					colegio: cuenta.colegio,
					fechaRegistro,
					consentimientoDatos: true,
					fechaConsentimiento: fechaRegistro,
					esDemo: true,
				},
			},
		]);
		creadas.add(cuenta.alias);
		log(`  ${cuenta.correo}: creado.`);
	}

	// 4. Historial.
	if (!opciones["solo-base"]) {
		log(`\n4) Historial (${opciones.directo ? "escritura REST directa" : "Cloud Function calificarPrueba"})...`);

		for (const cuenta of cuentas.filter((item) => item.perfil)) {
			const { pruebas, gamificacion } = planes[cuenta.alias];
			let nuevas = 0;

			for (const prueba of pruebas) {
				const resultadoId = `${prueba.cuestionarioId}_${cuenta.uid}`;

				if (await fs.get(`resultados/${resultadoId}`)) {
					continue;
				}

				nuevas++;

				if (opciones.directo) {
					await fs.escribir(operacionesDePrueba(cuenta.uid, prueba));
					continue;
				}

				// Cuestionario tal como lo crea quizRepository.createQuiz (fecha de creación = inicio de la prueba).
				await fs.escribir([{ tipo: "set", ruta: `cuestionarios/${prueba.cuestionarioId}`, datos: { ...prueba.cuestionario, esDemo: true } }]);

				const resultado = await llamarCalificarPrueba(proyecto, sesiones[cuenta.alias], {
					cuestionarioId: prueba.cuestionarioId,
					respuestasEstudiante: prueba.respuestas.map(({ preguntaId, respuestaSeleccionada }) => ({ preguntaId, respuestaSeleccionada })),
					tiempoEmpleado: prueba.tiempoEmpleado,
				});

				if (resultado.puntaje !== prueba.puntaje) {
					fallar(`La función devolvió puntaje ${resultado.puntaje} para ${prueba.cuestionarioId} y el plan esperaba ${prueba.puntaje}.`);
				}

				// La función usa serverTimestamp: se reescriben las fechas para repartir la actividad en el tiempo.
				await fs.escribir([
					{ tipo: "merge", ruta: `resultados/${resultadoId}`, datos: { fecha: prueba.fecha, esDemo: true } },
					...resultado.nuevosLogros.map((logroId) => ({
						tipo: "merge",
						ruta: `usuarios/${cuenta.uid}/logrosObtenidos/${logroId}`,
						datos: { fechaObtenido: prueba.fecha, esDemo: true },
					})),
				]);
			}

			if (pruebas.length === 0) {
				continue;
			}

			if (opciones.directo) {
				const usuario = await fs.get(`usuarios/${cuenta.uid}`);

				await fs.escribir(operacionesDeEstado(cuenta.uid, usuario, pruebas, banco.areas, gamificacion));
			} else {
				await fs.escribir([
					{ tipo: "merge", ruta: `ranking/${cuenta.uid}`, datos: { fechaActualizacion: gamificacion.ultimaFecha, esDemo: true } },
					...operacionesDeEstadisticas(cuenta.uid, pruebas, banco.areas),
				]);
			}

			log(`  ${cuenta.nombre}: ${nuevas} prueba(s) nueva(s) de ${pruebas.length}.`);
		}
	}

	// 5. Estado final de las cuentas (solo las recién creadas, para no pisar cambios hechos en la demo).
	for (const cuenta of cuentas.filter((item) => item.estadoFinal && creadas.has(item.alias))) {
		await fs.escribir([{ tipo: "merge", ruta: `usuarios/${cuenta.uid}`, datos: { estado: cuenta.estadoFinal } }]);
		log(`\n5) ${cuenta.correo} queda con estado "${cuenta.estadoFinal}".`);
	}

	const coincide = opciones["solo-base"] || opciones.directo ? true : await verificarCruzado(fs, cuentas, planes);

	imprimirResumenEmulador(cuentas, planes, banco, Boolean(opciones["solo-base"]));

	if (!coincide) {
		process.exitCode = 1;
	}
};

// ---------------------------------------------------------------------------
// Modo proyecto real
// ---------------------------------------------------------------------------

const leerProyectoReal = () => {
	if (process.env.DEMO_PROJECT_ID) {
		return process.env.DEMO_PROJECT_ID;
	}

	try {
		const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
		const firebaserc = JSON.parse(readFileSync(join(raiz, ".firebaserc"), "utf8"));

		return firebaserc.projects?.default ?? null;
	} catch {
		return null;
	}
};

const PERFILES_REALES_EN_ORDEN = ["fuerte", "medio", "flojo"];

const modoReal = async (opciones) => {
	const token = process.env.DEMO_ACCESS_TOKEN;

	if (!token) {
		fallar(
			"Falta la variable de entorno DEMO_ACCESS_TOKEN (access token de Google con permisos sobre Firestore del proyecto).\n" +
				"El script no lo lee de ningún archivo. Ver la sección \"Modo proyecto real\" de docs/datos-demo.md."
		);
	}

	const proyecto = leerProyectoReal();

	if (!proyecto) {
		fallar("No se pudo determinar el proyecto: definí DEMO_PROJECT_ID o completá projects.default en .firebaserc.");
	}

	// Con DEMO_FIRESTORE_EMULATOR_HOST definido, el flujo REST completo se ejecuta contra el emulador.
	const emuladorHost = process.env.DEMO_FIRESTORE_EMULATOR_HOST ? HOST_FIRESTORE : null;

	const soloBorrar = Boolean(opciones.borrar) || (Boolean(opciones.reset) && !opciones.correos);
	const dryRun = Boolean(opciones["dry-run"]);

	if (!soloBorrar && !opciones.correos) {
		fallar("Con --real hay que indicar los estudiantes ya registrados: --emails a@x.com,b@x.com,c@x.com");
	}

	log(`Modo REAL${emuladorHost ? ` (contra el emulador ${emuladorHost})` : ""}. Proyecto: ${proyecto}${dryRun ? " [dry-run: no se escribe nada]" : ""}`);

	if (!dryRun && !emuladorHost && !opciones.yes) {
		const consola = createInterface({ input: process.stdin, output: process.stdout });
		const respuesta = await consola.question(`Se va a ESCRIBIR en el proyecto "${proyecto}". Escribí el id del proyecto para confirmar: `);

		consola.close();

		if (respuesta.trim() !== proyecto) {
			fallar("El id no coincide; no se escribió nada.");
		}
	}

	const fs = crearFirestore({ proyecto, emuladorHost, token, dryRun });

	if (opciones.reset || opciones.borrar) {
		await borrarDemo(fs, { modoReal: true });
	}

	if (soloBorrar) {
		return;
	}

	const banco = await leerBanco(fs);

	validarBanco(banco);

	const ahora = new Date();
	const resumen = [];

	for (const [indice, correo] of opciones.correos.entries()) {
		const encontrados = await fs.consultar({ coleccion: "usuarios", campo: "correo", valor: correo });

		if (encontrados.length !== 1) {
			fallar(`No se encontró (o hay más de uno) el usuario con correo ${correo}. Registralo primero desde /registro.`);
		}

		const usuario = encontrados[0];
		const perfil = PERFILES_REALES_EN_ORDEN[indice] ?? null;

		if (usuario.rol !== "estudiante") {
			fallar(`${correo} no es un estudiante (rol: ${usuario.rol}).`);
		}

		if (!perfil) {
			log(`\n${correo}: sin perfil de historial (queda como estudiante nuevo, sin pruebas).`);
			resumen.push({ Correo: correo, Perfil: "nuevo (sin pruebas)", Pruebas: 0, XP: usuario.xp ?? 0, Nivel: usuario.nivel ?? 1, Logros: 0 });
			continue;
		}

		const resultadosPropios = await fs.consultar({ coleccion: "resultados", campo: "usuarioId", valor: usuario.id });

		if (resultadosPropios.some((resultado) => resultado.esDemo !== true)) {
			fallar(`${correo} ya tiene pruebas reales; el modo --real solo se usa con cuentas recién registradas.`);
		}

		if (resultadosPropios.length === 0 && ((usuario.xp ?? 0) > 0 || (usuario.nivel ?? 1) > 1)) {
			fallar(`${correo} ya tiene xp/nivel sin pruebas demo; el modo --real solo se usa con cuentas recién registradas.`);
		}

		const pruebas = planDePerfil(perfil, banco, ahora);
		const gamificacion = simularGamificacion(pruebas, banco.logros);

		log(`\n${correo} -> perfil "${perfil}" (${pruebas.length} pruebas, xp ${gamificacion.xp}, nivel ${gamificacion.nivel}, logros: ${gamificacion.logros.map((logro) => logro.id).join(", ") || "ninguno"})`);

		for (const prueba of pruebas) {
			if (resultadosPropios.some((resultado) => resultado.id === `${prueba.cuestionarioId}_${usuario.id}`)) {
				continue;
			}

			if (dryRun) {
				log(`  + ${formatoFechaColombia(prueba.fecha)}  ${prueba.cuestionario.titulo}: ${prueba.respuestasCorrectas}/${prueba.respuestas.length} (${prueba.puntaje}%)`);
			}

			await fs.escribir(operacionesDePrueba(usuario.id, prueba));
		}

		await fs.escribir(operacionesDeEstado(usuario.id, usuario, pruebas, banco.areas, gamificacion));

		resumen.push({ Correo: correo, Perfil: perfil, Pruebas: pruebas.length, XP: gamificacion.xp, Nivel: gamificacion.nivel, Logros: gamificacion.logros.length });
	}

	log("\n==================== RESUMEN ====================\n");
	imprimirTabla(resumen, ["Correo", "Perfil", "Pruebas", "XP", "Nivel", "Logros"]);

	if (dryRun) {
		const conteo = new Map();

		fs.pendientes.forEach((operacion) => {
			const coleccion = operacion.ruta.split("/").filter((_, i) => i % 2 === 0).join("/");

			conteo.set(coleccion, (conteo.get(coleccion) ?? 0) + 1);
		});

		log("\nDry-run: se escribirían estos documentos (colección: cantidad):");
		[...conteo.entries()].forEach(([coleccion, cantidad]) => log(`  - ${coleccion}: ${cantidad}`));
		log("No se escribió nada.");
	} else {
		log("\nListo. Para borrar lo demo: npm run seed:demo -- --real --reset");
	}
};

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

const main = async () => {
	const opciones = leerArgumentos(process.argv.slice(2));

	if (opciones.ayuda) {
		const fuente = readFileSync(fileURLToPath(import.meta.url), "utf8");

		const lineas = fuente.split("\n");
		const cabecera = lineas.slice(0, lineas.findIndex((linea) => !linea.startsWith("//")));

		log(cabecera.map((linea) => linea.replace(/^\/\/ ?/, "")).join("\n"));

		return;
	}

	if (opciones.real) {
		await modoReal(opciones);
	} else {
		await modoEmulador(opciones);
	}
};

main().catch((error) => {
	if (error instanceof ErrorDemo) {
		console.error(`\nERROR: ${error.message}`);
	} else {
		console.error("\nError en seed-demo:", error.message ?? error);
	}

	process.exitCode = 1;
});
