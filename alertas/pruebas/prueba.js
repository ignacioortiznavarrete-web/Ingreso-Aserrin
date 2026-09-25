/**
 * El aviso completo contra hojas con la forma real: SAP (la descarga
 * de SAP), Informe del reservador, Plan de aserrín (Proveedor ·
 * Precio · Cantidad, sin columna por mes) y Proveedores con los alias.
 *
 * Hoy es miércoles 16-09-2026. Días hábiles de septiembre hasta hoy:
 * 1,2,3,4,7,8,9,10,11,14,15,16.
 */
const { hoja, cargar } = require('./entorno');

let fallos = 0;
function ok(cond, texto, extra) {
  console.log((cond ? 'OK   ' : 'MAL  ') + texto);
  if (!cond) { fallos++; if (extra !== undefined) console.log('     ' + extra); }
}

const hojas = {
  // El Plan de aserrín: sin "Suministro", sin columna por mes;
  // "Cantidad" es el plan del mes vigente. Trae una fila TOTAL.
  Plan: hoja('Plan', [
    ['Proveedor', 'Precio', 'Cantidad'],
    ['ALFA SPA', 43, 3000],
    ['BETA LTDA', 42, 2000],
    ['ALFA S.A.', 41, 1000],
    ['GAMMA SA', 44, 1500],
    ['DELTA SPA', 40, 800],
    ['OMEGA SPA', 39, 500],
    // Solo cruza por parecido con lo que escribe la planilla.
    ['FORESTAL FATIMA LTDA.', 37, 450],
    // Cantidad cero: este mes no tiene nada comprometido y no debe
    // salir en el correo.
    ['SIGMA SPA', 38, 0],
    ['TOTAL', '', 9250]
  ]),

  // Alias escritos a mano: el reservador escribe distinto que SAP.
  Proveedores: hoja('Proveedores', [
    ['Proveedor SAP', 'Alias', 'Origen'],
    ['ALFA SPA', 'ALFA S.A.', 'manual'],
    ['', 'ALFA', 'manual'],
    ['GAMMA SA', 'GAMA S.A.', 'manual']
    // OJO: FORESTAL FATIMA LTDA. NO tiene alias a propósito.
  ]),

  // SAP: los encabezados de la descarga real, fechas como Date,
  // cantidad con coma decimal, y un material que no es aserrín que hay
  // que ignorar.
  SAP: hoja('SAP', [
    ['Documento MM', 'Nº Guia', 'Material', 'Des. Material', 'Fecha Contab.',
     'Pedido', 'Posicion', 'Texto Posicion', 'Cantidad', 'Credito FSC(TS)',
     'UM', 'Proveedor', 'Des. Proveedor', 'Destino'],
    ['', '', 3000043, 'ASERRIN (TS)', new Date(Date.UTC(2026, 8, 16)),
     '', '', '', '200,5', '', 'TS', 6000000001, 'ALFA SPA', 'TABLEROS'],
    ['', '', 3000043, 'ASERRIN (TS)', new Date(Date.UTC(2026, 8, 10)),
     '', '', '', '150', '', 'TS', 6000000002, 'BETA LTDA', 'TABLEROS'],
    ['', '', 3000043, 'ASERRIN (TS)', new Date(Date.UTC(2026, 8, 3)),
     '', '', '', '120', '', 'TS', 6000000003, 'DELTA SPA', 'TABLEROS'],
    // Astilla: no es aserrín, se ignora aunque sea de hoy.
    ['', '', 3000039, 'ASTILLA PINO VERDE', new Date(Date.UTC(2026, 8, 16)),
     '', '', '', '999', '', 'TS', 6000000004, 'OMEGA SPA', 'TABLEROS'],
    // Cantidad cero: no es un despacho.
    ['', '', 3000043, 'ASERRIN (TS)', new Date(Date.UTC(2026, 8, 15)),
     '', '', '', '0', '', 'TS', 6000000005, 'GAMMA SA', 'TABLEROS'],
    // FATIMA existe en SAP con su nombre largo; la planilla la
    // escribe "FATIMA" a secas.
    ['', '', 3000043, 'ASERRIN (TS)', new Date(Date.UTC(2026, 8, 1)),
     '', '', '', '60', '', 'TS', 6000000007, 'FORESTAL FATIMA LTDA.', 'TABLEROS'],
    // SIGMA despachó hace mucho: si entrara, caería en el tramo alto.
    ['', '', 3000043, 'ASERRIN (TS)', new Date(Date.UTC(2026, 7, 20)),
     '', '', '', '80', '', 'TS', 6000000006, 'SIGMA SPA', 'TABLEROS']
  ]),

  // La planilla del reservador: fecha ISO en texto, nombre distinto
  // al de SAP, y una fila con ERROR que no cuenta.
  Informe: hoja('Informe', [
    ['Fecha Informe', 'Fecha ISO', 'Subproducto Planilla', 'Subproducto',
     'Proveedor Planilla', 'Destino', 'Camiones', 'Factor', 'TS Estimadas',
     'Asunto', 'Message ID', 'Remitente', 'Fecha correo',
     'Fecha procesamiento', 'Estado', 'Método extracción'],
    ['08-09-2026', '2026-09-08', 'ASERRIN PINO VERDE', 'ASERRÍN PINO VERDE',
     'GAMA S.A.', 'TABLEROS', 4, 11.6, 46.4, '', '', '', '', '', 'OK', 'tabla'],
    ['17-09-2026', '2026-09-17', 'ASERRIN PINO VERDE', 'ASERRÍN PINO VERDE',
     'OMEGA SPA', 'TABLEROS', 3, 11.6, 34.8, '', '', '', '', '', 'ERROR: x', 'tabla'],
    // "FATIMA" a secas: sin parecido operativo, el correo la daba por
    // callada aunque acá dice que despachó ayer.
    ['15-09-2026', '2026-09-15', 'ASERRIN PINO VERDE', 'ASERRÍN PINO VERDE',
     'FATIMA', 'TABLEROS', 2, 11.6, 23.2, '', '', '', '', '', 'OK', 'tabla']
  ])
};

const { ctx, enviados, registro } = cargar(hojas, '2026-09-16');

// --- 1. Los tramos -----------------------------------------------------
const aviso = ctx.construirAviso_();
const porTramo = aviso.tramos.map(t => t.filas.map(f => f.proveedor));

aviso.tramos.forEach(t => console.log('   ' + t.titulo + ': ' +
  (t.filas.map(f => f.proveedor + ' (' +
    (f.dias === null ? 'sin ingresos' : f.dias) + ' d, plan ' + f.plan +
    ', mes ' + Math.round(f.ingresado) + ')').join(' | ') || 'ninguno')));

// BETA: último 10-09 → hábiles 11,14,15,16 = 4 → tramo 3-4.
// GAMMA: cruza por alias con la planilla del 08-09 → 9,10,11,14,15,16 = 6.
// DELTA: 03-09 → 4,7,8,9,10,11,14,15,16 = 9 → tramo 7+.
// OMEGA: su única fila de planilla es ERROR y su ingreso es astilla → sin ingresos.
// ALFA: despachó hoy → no sale.
ok(JSON.stringify(porTramo) ===
   JSON.stringify([['BETA LTDA'], ['GAMMA SA'], ['OMEGA SPA', 'DELTA SPA']]),
   'los tres tramos, excluyentes', JSON.stringify(porTramo));

const alfa = aviso.proveedores.filter(p => p.proveedor === 'ALFA SPA')[0];
ok(alfa && alfa.dias === 0, 'ALFA despachó hoy: 0 días');
ok(alfa && alfa.plan === 4000,
   'el alias junta "ALFA S.A." con "ALFA SPA": plan 4.000',
   alfa && alfa.plan);
ok(alfa && alfa.subproductos.length === 1 &&
   alfa.subproductos[0] === 'ASERRÍN PINO VERDE',
   'el Plan sin Suministro es todo aserrín pino verde',
   alfa && JSON.stringify(alfa.subproductos));
ok(Math.round(alfa.ingresado) === 201, 'cantidad con coma decimal: 200,5',
   alfa && alfa.ingresado);

const gamma = aviso.proveedores.filter(p => p.proveedor === 'GAMMA SA')[0];
ok(gamma.fuente === 'PLANILLA' && gamma.ultimo === '2026-09-08',
   'GAMMA cruza por alias con la planilla', JSON.stringify(gamma));

const omega = aviso.proveedores.filter(p => p.proveedor === 'OMEGA SPA')[0];
ok(omega.dias === null, 'la fila ERROR de la planilla no cuenta como despacho');
ok(omega.ingresado === 0, 'la astilla no es aserrín');

ok(aviso.mes === 'Cantidad',
   'sin columna del mes, Cantidad es el plan del mes en curso', aviso.mes);

// Sin plan este mes no hay nada que reclamar, aunque lleve semanas
// sin despachar: no está comprometido a nada.
const sigma = aviso.proveedores.filter(p => p.proveedor === 'SIGMA SPA')[0];
ok(!sigma, 'el que no tiene plan este mes no entra al correo',
   sigma && JSON.stringify(sigma));
ok(!/SIGMA/.test(JSON.stringify(porTramo)), 'ni aparece en ningún tramo');

// El caso que se vino a arreglar: la planilla escribe "FATIMA" y SAP
// "FORESTAL FATIMA LTDA.". Sin parecido operativo no cruzaban y el
// correo la acusaba de llevar días sin despachar.
const fatima = aviso.proveedores.filter(p => /FATIMA/.test(p.proveedor))[0];
ok(fatima && fatima.ultimo === '2026-09-15' && fatima.fuente === 'PLANILLA',
   'la planilla que escribe el nombre corto cruza con el largo de SAP',
   fatima && [fatima.ultimo, fatima.fuente]);
ok(fatima && fatima.dias === 1, 'y su silencio se cuenta desde ese día',
   fatima && fatima.dias);
ok(!/FATIMA/.test(JSON.stringify(porTramo)),
   'así que no sale en ninguna tabla de atraso');

// --- 2. El correo ------------------------------------------------------
ctx.enviarAhora();
ok(enviados.length === 1, 'manda un correo');
ok(enviados[0].to === 'francisco.correa@masisa.com,jaime.rojas@masisa.com',
   'a los dos destinatarios', enviados[0].to);
ok(/· 4$/.test(enviados[0].subject), 'el asunto trae el total',
   enviados[0].subject);
ok(enviados[0].htmlBody.split('<table').length - 1 === 3,
   'tres tablas en el cuerpo');
require('fs').writeFileSync(__dirname + '/correo.html', enviados[0].htmlBody);

// --- 3. Sábado: no manda -----------------------------------------------
const sabado = cargar(hojas, '2026-09-19');
sabado.ctx.enviarAvisoSilencio();
ok(sabado.enviados.length === 0, 'sábado no manda');
ok(/no es día hábil/.test(sabado.registro.join(' ')), 'y lo deja dicho');

// --- 4. Nadie atrasado -------------------------------------------------
const alDia = JSON.parse(JSON.stringify({}));
const hojasAlDia = Object.assign({}, hojas, {
  SAP: hoja('SAP', [
    hojas.SAP.getDataRange().getValues()[0],
    ...['ALFA SPA', 'BETA LTDA', 'GAMMA SA', 'DELTA SPA', 'OMEGA SPA'].map(p =>
      ['', '', 3000043, 'ASERRIN (TS)', new Date(Date.UTC(2026, 8, 16)),
       '', '', '', '100', '', 'TS', 'X', p, 'TABLEROS'])
  ])
});
const limpio = cargar(hojasAlDia, '2026-09-16');
limpio.ctx.enviarAhora();
ok(/Ningún proveedor del plan/.test(limpio.enviados[0].htmlBody),
   'si no hay nadie atrasado, el correo igual sale diciéndolo');

// --- 5. Plan con columnas de mes: manda la del mes ---------------------
const conMeses = cargar(Object.assign({}, hojas, {
  Plan: hoja('Plan', [
    ['Proveedor', 'Precio', 'AGO-2026', 'SEP-2026'],
    ['ALFA SPA', 41, 900, 1200]
  ])
}), '2026-09-16');
const avisoMeses = conMeses.ctx.construirAviso_();
ok(avisoMeses.mes === 'SEP-2026' && avisoMeses.proveedores[0].plan === 1200,
   'si el Plan trae columnas de mes, toma la del mes en curso',
   avisoMeses.mes);

// --- 6. Sin columna del mes ni Cantidad en el Plan ---------------------
const sinMes = cargar(Object.assign({}, hojas, {
  Plan: hoja('Plan', [
    ['Proveedor', 'Precio', 'AGO-2026'],
    ['ALFA SPA', 41, 900]
  ])
}), '2026-09-16');
sinMes.ctx.enviarAhora();
ok(/no tiene una columna para este mes/.test(sinMes.enviados[0].htmlBody),
   'sin columna del mes, lo dice en vez de mandar tablas vacías');

// --- 7. Disparador -----------------------------------------------------
ctx.instalarAvisoDiario();
ok(ctx.eliminarAvisoDiario() === 1, 'instala y elimina un solo disparador');

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo OK');
process.exitCode = fallos ? 1 : 0;
