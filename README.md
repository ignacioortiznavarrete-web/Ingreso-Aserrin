# Ingreso Aserrín

Planilla de control de suministro de **aserrín pino verde** a proceso,
hecha con Google Apps Script sobre el spreadsheet
[Ingreso Aserrin](https://docs.google.com/spreadsheets/d/1PRUcVwBuxuYqqmgXb35mN0pzW2OdzaCVOLsXHT8zLNw).
La unidad de trabajo es la **tonelada seca (TS)**.

Es hermano del panel de astilla (`Ingreso-Astilla-Proceso`): la misma
funcionalidad, las mismas reglas y la misma importación de Gmail, con
un solo subproducto y con otra identidad visual, para que teniendo los
dos abiertos no se confundan.

## Qué lee

| Hoja | Qué es |
|---|---|
| **SAP** | La descarga de SAP. Es la fuente válida: el registro real de recepción. Se toma el material `3000043 · ASERRIN (TS)` |
| **Informe** | Las planillas diarias del reservador, importadas desde Gmail. Completa los días que SAP todavía no tiene, con `camiones × 11,6 TS` |
| **Plan** | `Proveedor · Precio · Cantidad`. Precio por TS y plan del mes en TS |
| **Proyeccion** | (opcional) Camiones comprometidos por día hábil, igual que en astilla |
| **Proveedores** | (se crea desde el menú) Tabla de equivalencias de nombres |
| **Mapeos**, **Rutas**, **Apuntes** | (se crean desde el menú) Terreno y reuniones semanales |

**La decisión es día por día.** Un día con TS en SAP manda entero y su
estimado se descarta; un día que en SAP suma cero —porque aún no se
carga, o quedó como hueco— se completa con la planilla. Es por día
completo y no por proveedor: mezclar las dos fuentes en un mismo día
contaría dos veces los camiones que ya llegaron a SAP.

### Factor del camión

| Código SAP | Subproducto        | TS por camión |
|-----------:|--------------------|--------------:|
|    3000043 | ASERRÍN PINO VERDE |          11,6 |

11,6 es la mediana de TS por guía en la hoja SAP entre enero y
septiembre de 2026 (promedio 11,58). Se cambia en
`CONFIG.FACTOR_POR_MATERIAL` de `Codigo.gs`, y el cambio alcanza
también a las filas ya importadas: la columna `Factor` de la hoja
Informe es informativa.

### La hoja Plan

La de aserrín es más simple que la de astilla:

- **No tiene columna `Suministro`.** Hay un solo subproducto, así que
  toda fila del Plan es de aserrín pino verde.
- **No tiene una columna por mes.** `Cantidad` se lee como el plan del
  **mes vigente**. Cuando cambie el mes, la misma columna pasa a ser el
  plan del mes nuevo: hay que actualizarla.

Si en algún momento se agregan columnas de mes (`sep-2026`, `2026-10`,
fechas…), el panel y el correo las usan solos: manda la columna del mes
y `Cantidad` queda de respaldo. Con eso además la vista Comparación
tendría el plan de los meses cerrados, que hoy no tiene de dónde sacar.

### Nombres de proveedor

El Plan escribe `LLASA` y SAP `LAMINADORA LOS ANGELES S.A.`; el Plan
escribe `LIKEWOOD` y SAP `ASERRADERO LIKE WOOD LTDA`. Esos dos no los
cruza ningún parecido, así que hasta escribirlos en la hoja
`Proveedores` sus TS quedan sin precio (≈900 TS en lo que va del año).
El menú **Rellenar proveedores sugeridos** deja escritas esas dos y
el resto de las equivalencias Plan ↔ SAP que se ven hoy en la planilla.
`EMC` está en el Plan pero no aparece en SAP: queda anotado para
revisar a quién corresponde.

## Gmail: la misma planilla, otro producto

Se lee el mismo correo que en astilla: solo el **original** de
`reservador.horario@masisa.com` cuyo asunto **empieza** con
`PLANILLA CUMPLIMIENTO SUB-PRODUCTOS` o `CUMPLIMIENTO SUBPRODUCTOS`
(eso descarta `Re:`, `RV:` y `Fwd:`). De la tabla se toman **solo las
filas del grupo ASERRÍN PINO VERDE**; astillas, corteza y cualquier
otro grupo se ignoran. Las filas «Total…» y las que vienen sin
proveedor se ignoran siempre: son sumas y duplicarían los camiones.

Se acepta el rótulo con o sin tilde y en sus variantes (`ASERRIN PINO
VERDE`, `Aserrín P. Verde`, `ASERRIN`, `ASERRIN (TS)`); se rechaza el
que diga seco, combustible o eucalipto.

Los correos importados se marcan con la etiqueta
`Aserrin/Planilla procesada`, distinta de la de astilla. Los dos
proyectos pueden leer el mismo correo sin pisarse: cada uno lleva la
cuenta de lo importado en su propia hoja, por Message ID.

## El panel

Cinco vistas, igual que astilla: **Suministro** (la regla del mes,
KPIs, gráficos, tablas y plan de acción), **Comparación** (el año
partido por mes), **Homologación** (nombres de la planilla y de
Proyección que no cruzan con SAP), **Mapeos** (aserraderos en el mapa
y armado de rutas) y **Apuntes** (pauta de la reunión semanal).

### Sistema visual

El color del dato significa una sola cosa, siempre la misma:

| Color    | Qué es                                     |
|----------|--------------------------------------------|
| Petróleo | Ingreso real, confirmado en `SAP`          |
| Ámbar    | Complemento estimado del reservador        |
| Violeta  | Plan (referencia, no material)             |
| Rojo     | Riesgo: bajo plan, precio sin homologar    |

Barra superior carbón con acento ámbar (color aserrín), en vez del
verde bosque de astilla. Tipografías: **Bricolage Grotesque** para
titulares, **IBM Plex Sans** para interfaz y tablas y **JetBrains
Mono** para toda cifra. Modo claro y oscuro: por defecto sigue al
sistema y el interruptor de la barra deja fija la preferencia.

El resto del comportamiento —cifras dentro de los gráficos, cierre al
ritmo actual y con proyección, arrastre del fin de semana al día hábil
anterior, feriados calculados, filtros por tabla, marcar filas y
sumarlas— es el mismo del panel de astilla y está documentado en su
README.

## Aviso diario de proveedores sin despachar

Un correo cada mañana con los proveedores que tienen plan del mes y
llevan 3, 5 o 7 días hábiles sin un ingreso. Vive en un proyecto de
Apps Script **aparte**, en `alertas/`. Ver
[`alertas/README.md`](alertas/README.md).

## Archivos

| Archivo            | Qué es                                            |
|--------------------|---------------------------------------------------|
| `Codigo.gs`        | El servidor: lectura, cruces, Gmail, Calendar      |
| `Index.html`       | El dashboard (HTML + CSS + JS en un archivo)       |
| `appsscript.json`  | Manifiesto: zona horaria, scopes y Drive API v3    |
| `alertas/`         | Proyecto de Apps Script **aparte**: el correo diario |

## Instalación

1. Abrir el spreadsheet **Ingreso Aserrin** → **Extensiones › Apps Script**.
2. Pegar `Codigo.gs` y crear un archivo HTML llamado exactamente `Index`
   con el contenido de `Index.html`.
3. En **Servicios**, agregar **Drive API v3** (se necesita para leer las
   planillas que llegan como adjunto Excel).
4. Recargar el spreadsheet: aparece el menú **Aserrín Dashboard**.
5. Desde ese menú: *Probar último correo (sin escribir)* para confirmar
   que encuentra las filas de aserrín; después *Reconstruir planillas
   desde Gmail* para traer el historial a la hoja `Informe`.
6. *Preparar hoja de proveedores* y *Rellenar proveedores sugeridos*;
   si se van a usar, *…de mapeos*, *…de rutas* y *…de apuntes*.
7. Por último, *Instalar automatización* (revisa Gmail cada 15 minutos).

Con [clasp](https://github.com/google/clasp):

```bash
clasp login
clasp clone <SCRIPT_ID>   # deja el .clasp.json (ignorado por git)
clasp push
```

## Menú

| Ítem                                   | Qué hace                                        |
|----------------------------------------|-------------------------------------------------|
| Abrir dashboard                        | Abre el panel en un diálogo modal               |
| Importar nuevas planillas              | Lee Gmail y suma los correos no procesados      |
| Reconstruir planillas desde Gmail      | Respalda y reimporta todo el historial          |
| Probar último correo (sin escribir)    | Muestra qué extraería, sin tocar la hoja        |
| Diagnosticar cruce SAP vs planilla     | Qué materiales y proveedores no están cruzando  |
| Validar hoja Plan                      | Solo lee y valida; no modifica formato          |
| Ubicar en el mapa                      | Geocodifica los aserraderos de la hoja Mapeos   |
| Rellenar proveedores sugeridos         | Escribe las equivalencias Plan ↔ SAP conocidas  |

## Pruebas

```
node alertas/pruebas/prueba.js
node alertas/pruebas/feriados.js
```
