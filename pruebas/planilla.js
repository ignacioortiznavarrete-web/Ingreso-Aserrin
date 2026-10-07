/**
 * Lectura del correo del reservador: las formas en que llega la tabla.
 *
 *   node pruebas/planilla.js
 *
 * Corre Codigo.gs en node con lo mínimo de Apps Script. Cada caso es
 * una forma real de la planilla «PLANILLA CUMPLIMIENTO SUB-PRODUCTOS»:
 * con fila de encabezado, sin ella (correo del 06/10/2026), con celdas
 * combinadas al pegar desde Excel y dentro de una tabla de Outlook.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = {
  console,
  Utilities: {
    formatDate: (d) => d.toISOString().slice(0, 10)
  }
};
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'Codigo.gs'), 'utf8'),
  ctx,
  { filename: 'Codigo.gs' }
);

let fallos = 0;
function ok(cond, texto, extra) {
  console.log((cond ? 'OK   ' : 'MAL  ') + texto);
  if (!cond) { fallos++; if (extra !== undefined) console.log('     ' + extra); }
}

function leer(html, asunto) {
  ctx.msg = {
    getSubject: () => asunto ||
      'PLANILLA CUMPLIMIENTO SUB-PRODUCTOS MARTES 06 DE OCTUBRE DE 2026',
    getBody: () => html,
    getPlainBody: () => '',
    getAttachments: () => []
  };
  return vm.runInContext('parsePlanillaEmail_(msg, "America/Santiago")', ctx);
}

const td = (x, a) =>
  '<td ' + (a || '') + ' style="border:1px solid"><p class=MsoNormal><b>' +
  '<span>' + (x || '&nbsp;') + '</span></b></p></td>';
const tabla = filas =>
  '<table>' + filas.map(f => '<tr>' + f.map(c =>
    Array.isArray(c) ? td(c[0], c[1]) : td(c)).join('') + '</tr>').join('\n') +
  '</table>';
const resumen = r => r.rows.map(x => x.proveedor + ':' + x.camiones).join(', ');
const camiones = r => r.rows.reduce((a, x) => a + x.camiones, 0);

// --- 1. Sin fila de encabezado (correo del 06/10/2026) ------------------
const sinEncabezado = [
  ['06/10/2026', 'Total', '', '', '0'],
  ['', 'ASERRÍN COMBUSTIBLE', 'COMERCIAL EL CHACAY LTDA.', 'NEOMAS', '2'],
  ['', 'Total ASERRÍN COMBUSTIBLE', '', '', '2'],
  ['', 'ASERRÍN PINO VERDE', 'ALTO LONQUEN', 'TABLEROS', '1'],
  ['', '', 'ASERRADEROS LOS CASTAÑOS LTDA.', 'TABLEROS', '3'],
  ['', '', 'BIOMASA SUR', 'TABLEROS', '1'],
  ['', '', 'LAMINADORA LOS ANGELES', 'TABLEROS', '1'],
  ['', '', 'PROMASA S.A.', 'TABLEROS', '5'],
  ['', 'Total ASERRÍN PINO VERDE', '', '', '11'],
  ['', 'ASTILLA ALAMO COMBUSTIBLE', 'FORESTAL AITUE LTDA', 'TABLEROS', '7'],
  ['', 'Total ASTILLA ALAMO COMBUSTIBLE', '', '', '7'],
  ['', 'ASTILLA EUCALYPTUS NITENS', 'FORESTAL AITUE LTDA', 'TABLEROS', '3'],
  ['', 'ASTILLA PINO COMBUSTIBLE', 'BARRACA FONSECA EIRL', 'TABLEROS', '1'],
  ['', '', 'COMERCIAL RIO CRUCES LTDA', 'COGENERACIÓN', '8']
];

let r = leer(tabla(sinEncabezado));
ok(r.fecha === '2026-10-06', 'sin encabezado: la fecha sale de la primera celda', r.fecha);
ok(r.rows.length === 5 && camiones(r) === 11,
   'sin encabezado: los 5 proveedores y 11 camiones de aserrín pino verde',
   resumen(r));
ok(!/CHACAY|AITUE|FONSECA|RIO CRUCES/.test(resumen(r)),
   'deja fuera aserrín combustible y astillas', resumen(r));
ok(r.rows[0].destino === 'TABLEROS', 'lee el destino', r.rows[0].destino);

// --- 2. Celdas combinadas (pegado desde Excel) dentro de Outlook --------
const combinada = [
  [['06/10/2026', 'rowspan=14'], 'Total', '', '', '0'],
  ['ASERRÍN COMBUSTIBLE', 'COMERCIAL EL CHACAY LTDA.', 'NEOMAS', '2'],
  ['Total ASERRÍN COMBUSTIBLE', '', '', '2'],
  [['ASERRÍN PINO VERDE', 'rowspan=5'], 'ALTO LONQUEN', 'TABLEROS', '1'],
  ['ASERRADEROS LOS CASTAÑOS LTDA.', 'TABLEROS', '3'],
  ['BIOMASA SUR', 'TABLEROS', '1'],
  ['LAMINADORA LOS ANGELES', 'TABLEROS', '1'],
  ['PROMASA S.A.', 'TABLEROS', '5'],
  ['Total ASERRÍN PINO VERDE', '', '', '11'],
  [['ASTILLA PINO COMBUSTIBLE', 'rowspan=2'], 'BARRACA FONSECA EIRL', 'TABLEROS', '1'],
  ['COMERCIAL RIO CRUCES LTDA', 'COGENERACIÓN', '8']
];

r = leer('<div><table width="100%"><tr><td>' + tabla(combinada) +
  '</td></tr></table></div>');
ok(r.rows.length === 5 && camiones(r) === 11,
   'celdas combinadas: no se pierde ningún proveedor del grupo', resumen(r));
ok(r.fecha === '2026-10-06', 'celdas combinadas: la fecha', r.fecha);

// --- 3. Con fila de encabezado (la forma de siempre) --------------------
r = leer(tabla([
  ['FECHA', 'CUMPLIMIENTO SUBPRODUCTOS', 'PROVEEDORES', 'PRODUCTOS', 'productos'],
  ['24-09-2026', 'ASTILLA PINO VERDE', 'PROMASA S.A.', 'TABLEROS', '6'],
  ['', 'Total Astilla Pino Verde', '', '', '6'],
  ['', 'ASERRÍN PINO VERDE', 'PROMASA S.A.', 'TABLEROS', '5'],
  ['', '', 'Laminadora Los Angeles', 'COGENERACIÓN', '2'],
  ['', 'Total Aserrín', '', '', '7']
]), 'PLANILLA CUMPLIMIENTO SUB-PRODUCTOS JUEVES 24 DE SEPTIEMBRE DE 2026');
ok(r.fecha === '2026-09-24' && camiones(r) === 7 && r.rows.length === 2,
   'con encabezado: sigue leyendo igual', resumen(r));

// --- 4. Una columna vacía de más al principio ---------------------------
r = leer(tabla(sinEncabezado.map(f => [''].concat(f))));
ok(camiones(r) === 11, 'una columna de más al principio no la descuadra',
   resumen(r));

// --- 5. Sin aserrín pino verde: error visible, no filas inventadas ------
let error = '';
try { leer(tabla(sinEncabezado.slice(0, 3))); } catch (e) { error = e.message; }
ok(/No se encontraron filas/.test(error),
   'sin el grupo de aserrín pino verde queda como error, no en blanco', error);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo OK');
process.exitCode = fallos ? 1 : 0;
