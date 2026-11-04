# Análisis: puntos que no coinciden y ganador de la semana

**Estado:** en análisis · **Fecha:** 3/11/2026 · **Versión de la app:** 1.6.2

Este documento registra qué pasó, qué se verificó en el código y en los datos, qué se sospecha todavía y qué falta para cerrar el problema. Se actualiza a medida que aparece información nueva.

## 1. El problema

Aparecieron tres síntomas en la semana del 02/11:

1. **El contador de la tabla de posiciones no coincidía con el total calculado** (solapa *Puntos > Verificar puntos*).
2. **El historial dice "Ganó Equipo Engranajes" aunque los dos equipos con puntos tienen 35.** La semana todavía no terminó.
3. **Pistones tiene 2 jornadas en la semana**, una de ellas vacía (lunes 02/11, 0 puntos), y eso le baja el promedio.

### Qué se vio en pantalla

| Momento | Equipo | Contador (tabla) | Calculado | Diferencia |
| --- | --- | --- | --- | --- |
| 03/11 08:21 | Engranajes | 10 | 35 | −25 |
| 03/11 17:58 | Engranajes | 10 | 35 | −25 |
| 03/11 17:58 | Pistones | 15 | 35 | −20 |
| 03/11 18:08 | Engranajes y Pistones | 35 | 35 | 0 (después de «Corregir todos») |

Los demás equipos estuvieron siempre en 0 y 0.

## 2. Cómo funciona hoy (verificado en el código)

- **Los puntos de una jornada** son 10 (checklist matutino) + 10 (cierre) + 15 (desafío), más 10 si hay Ed. Física. Los valores de checklist, cierre y desafío son los mismos desde el 29/09; el de Ed. Física se agregó el 30/10 (`src/lib/semanas.js`).
- **El contador** (`turnos/{id}.puntos`) solo se escribe en cuatro lugares de `PlantContext.jsx`: al aprobar un bloque o el desafío (`sumar`), al cargar o quitar un bono, con «Corregir» y con «Volver a cero».
- **La marca del premio y la suma al contador se guardan en la misma transacción** (`aprobarTarea`, `aprobarDesafio`). Por diseño, no debería quedar un premio marcado sin sus puntos.
- **El «Calculado»** suma los puntos de **todos** los documentos de `jornadas` más los bonos (`src/lib/verificarPuntos.js`). Cuenta cada documento, sin mirar si hay otro del mismo día y líder.
- **El ganador de la semana se decide por promedio por jornada**, no por puntos totales (`CRITERIO_GANADOR = 'promedio'`). Fórmula: `puntos / posibles × 35`. El lunes tiene Ed. Física, así que ese día los posibles son 45.
- **El historial semanal escribe «Ganó …» siempre**, también con la semana en curso (`PanelDocente.jsx`, línea 206). La solapa *Semana* sí dice «Va ganando».

## 3. Qué muestran los documentos de Firestore

| Documento | Qué tiene | Puntos que le corresponden |
| --- | --- | --- |
| `2026-11-02_01` (Gonzalez, líder 1) | Las 8 tareas aprobadas, `desafioAprobado`, `premioChecklist`, `premioCierre`. Sin `premioEdFisica`. | 35 |
| `2026-11-02_02` (Ferrio, líder 2) | Solo `declaradas: { limpieza: false }`. Nada aprobado. | 0 |
| `2026-11-03_2` (Ferrio, líder 2) | Las 8 tareas aprobadas, `desafioAprobado`, `premioChecklist`, `premioCierre`. Sin mapa `asistencia`. | 35 |

### Hallazgo 1: dos documentos con un id que la app no genera

La app arma el id de una jornada como `fecha_jefeId`, por ejemplo `2026-11-02_1`, y lo hace así desde el primer commit. Las reglas de Firestore exigen ese formato cuando un alumno crea una jornada (`docId == fecha + '_' + string(jefeId)`).

Los documentos `2026-11-02_01` y `2026-11-02_02` tienen un cero de más. Un alumno no pudo crearlos con las reglas actuales. Pudieron salir de la consola de Firebase, de un script o de una cuenta docente. La app no tiene ninguna función que genere ese formato.

Consecuencias posibles:

- Si un alumno guarda algo ese día, la app escribe en `2026-11-02_1` y **crea un segundo documento** para el mismo día y líder, mientras la pantalla sigue leyendo el primero (busca por `jefeId`).
- «Calculado» y el resumen semanal cuentan los dos documentos, y duplican puntos y jornadas.

### Hallazgo 2: la jornada vacía de Pistones del lunes

`2026-11-02_02` no tiene nada aprobado ni declarado en positivo, pero cuenta como una jornada de Pistones. Con eso Pistones tiene 2 jornadas y 80 puntos posibles (45 del lunes + 35 del martes).

| Equipo | Cálculo | Promedio |
| --- | --- | --- |
| Engranajes | 35 / 45 × 35 | 27,2 |
| Pistones | 35 / 80 × 35 | 15,3 (calculado a mano; no se vio en pantalla) |

Por eso gana Engranajes aunque tengan los mismos puntos.

### Hallazgo 3: asistencia aprobada sin datos

En `2026-11-03_2` la tarea `asistencia` figura aprobada, pero no hay mapa `asistencia` ni está declarada. No afecta los puntos; explica que ese día aparezca «–» en Presentes.

## 4. El descuadre del contador: hipótesis

Los documentos guardados dicen que el contador debía valer 35 en los dos equipos. El que estaba mal era el contador. El patrón: en Pistones faltaban 20 (checklist + cierre) y el 15 que sí estaba coincide con el desafío; en Engranajes faltaban 25.

| # | Hipótesis | Estado |
| --- | --- | --- |
| H1 | Alguien tocó los documentos de `jornadas` o el contador a mano (consola de Firebase). Marcas de premio sin sus puntos. | **En duda.** El docente indica que solo él accede a la consola y que no editó nada. Los ids `_01` y `_02` (en vez de `_1` y `_2`) siguen sin explicación: no los genera esta versión de la app. |
| H2 | Un error al aprobar que deja el premio marcado sin sumar. | Poco probable: marca y suma van en una sola transacción. No se encontró ningún camino en el código. **Causa real: sin explicar.** |
| H3 | Una versión vieja de la app en el celular o la computadora del docente. | Descartada: el service worker va primero a la red, y la lógica de puntos no cambió en las últimas versiones. |
| H4 | Dos aprobaciones al mismo tiempo que se pisan. | Descartada como causa de marca sin puntos: Firestore repite la transacción si hay choque. |

## 5. Qué falta para cerrar el análisis

1. **Causa sin explicar.** Averiguar de dónde salieron los documentos `2026-11-02_01` y `2026-11-02_02` (no hubo ediciones manuales según el docente). Posibilidad a revisar: otra copia de la app o un dispositivo con una versión distinta escribiendo con otro formato de id.
2. Una **exportación nueva** desde *Puntos > Historial semanal > Exportar a planilla (.xlsx)*. La que se recibió es del 01/11 y solo tiene una jornada del 30/10.
3. La lista de ids de la colección `jornadas` en la consola de Firebase, para ver si hay documentos duplicados del mismo día y líder.
4. Decidir la regla del ganador (ver sección 6).

## 6. Cambios (estado)

| Cambio | Para qué |
| --- | --- |
| **Hecho en 1.7.0:** registro de movimientos de puntos (equipo, cantidad, motivo, jornada, quién y cuándo), dentro de la misma transacción de cada suma. Se ve en *Puntos > Últimos movimientos*. | La próxima vez que haya un descuadre se verá exactamente de dónde viene. |
| **Pendiente (a confirmar con el docente):** que `guardar` use el id del documento que ya existe para ese día y líder, en vez de recalcularlo. | Evita que se cree un documento duplicado si el existente tiene otro id. |
| **Pendiente:** que el resumen y «Verificar puntos» cuenten una sola jornada por día y líder. | Un duplicado no suma doble. |
| **Hecho en 1.7.0:** una jornada sin actividad del día común no cuenta como jornada. | Un documento vacío ya no baja el promedio. |
| **Hecho en 1.7.0:** «Va ganando» mientras la semana está en curso (en el Historial; el resumen semanal ya lo decía). | El texto no engaña antes de que termine la semana. |

## 7. Registro de cambios de este análisis

- **3/11/2026:** primera versión. Datos revisados: capturas del panel, tres documentos de `jornadas` pegados desde la consola y el código de la versión 1.6.2.
- **3/11/2026 (tarde):** el docente aclara que nadie más accede a la consola y que no tocó datos; H1 pasa a «en duda» y la causa queda sin explicar. Se implementa el nuevo modelo de puntos (1.7.0): sorteo de Ed. Física con rotación, extras +5 (hasta 3 por día), promedio sin normalizar, jornadas vacías que no cuentan, bonos fuera del promedio y registro de movimientos.
