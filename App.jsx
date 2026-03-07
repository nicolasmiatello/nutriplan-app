Quiero que modifiques mi app React de nutrición con estos cambios funcionales y visuales. No des solo sugerencias: implementá directamente los cambios en el código manteniendo una estructura limpia, reutilizable y lista para producción.

OBJETIVO GENERAL
La app debe verse y sentirse más profesional, orientada a consultorio nutricional, con foco especial en fertilidad femenina. El nombre visible de la app debe pasar a ser:

JL Nutrición

CAMBIOS OBLIGATORIOS

1. CAMBIAR NOMBRE DE LA APP
Reemplazar el nombre actual por “JL Nutrición” en todos los lugares visibles:
- título principal
- header
- pestaña del navegador
- textos de bienvenida si existen

2. ELIMINAR PACIENTES CARGADOS
Necesito poder borrar pacientes ya cargados.

Implementar:
- botón “Eliminar paciente”
- confirmación antes de borrar:
  “¿Seguro que querés eliminar este paciente?”
- al eliminar:
  - se debe actualizar la lista
  - se deben actualizar estadísticas
  - eliminar también del almacenamiento (localStorage o base de datos)

3. OBJETIVO PRINCIPAL: FERTILIDAD
Agregar “Fertilidad” como opción dentro de “objetivo principal”.

Cuando se seleccione Fertilidad:
- el plan nutricional debe adaptarse a fertilidad
- incluir enfoque en:
  - antiinflamatorio
  - salud hormonal
  - sensibilidad a la insulina
  - micronutrientes clave
  - alimentos beneficiosos para fertilidad femenina

Las recetas y recomendaciones deben reflejar este enfoque.

4. RECETAS DEL PLAN SE VEN CORTADAS
Actualmente las recetas aparecen truncadas.

Corregir:
- overflow
- max-height
- contenedores con scroll
- textos truncados con ellipsis

Las recetas deben verse completas.

Si una receta es larga:
- permitir expandir con botón “Ver receta completa”.

Priorizar buena lectura.

5. PROBLEMA CON DESCARGA DE PDF DEL PLAN
Actualmente el plan solo se puede descargar en PDF en el momento en que se genera.

Problema:
Una vez que el plan ya fue creado y guardado para el paciente, ya no aparece la opción de descargarlo nuevamente.

Necesito que se pueda:
- descargar el plan en PDF en cualquier momento
- desde la ficha del paciente
- o desde el listado de planes generados

Implementar botón:
“Descargar Plan en PDF”

Este botón debe aparecer:
- cuando se visualiza el plan del paciente
- aunque el plan haya sido creado anteriormente

El PDF debe incluir:
- nombre del paciente
- objetivo nutricional
- plan semanal completo
- recetas completas
- formato limpio y profesional

6. NUEVA PESTAÑA: PACIENTES Y ESTADÍSTICAS
Crear una nueva sección en la app llamada:

“Pacientes y Estadísticas”

Dentro de esta sección incluir:

A. LISTADO DE PACIENTES
Mostrar:
- nombre
- fecha de carga
- objetivo
- acceso rápido al plan
- botón eliminar paciente

B. VALOR DE LA CONSULTA / IMPORTE COBRADO
Esto es muy importante:
No solo quiero registrar pacientes, también quiero registrar dinero.

Necesito poder cargar manualmente cuánto se le cobró a cada paciente por cada consulta.

Implementar:
- campo editable para ingresar el importe cobrado
- este valor debe poder cargarse manualmente
- no asumir un valor fijo para todos
- cada paciente puede tener un valor distinto
- idealmente cada consulta registrada debe tener:
  - fecha
  - tipo de consulta si aplica
  - monto cobrado

C. REGISTRO DE CONSULTAS
Cada vez que haya una consulta debe poder registrarse manualmente.

Cada registro debería permitir guardar:
- paciente
- fecha
- monto cobrado
- observación opcional

7. ESTADÍSTICAS MENSUALES
Crear panel de estadísticas con foco no solo en pacientes sino también en ingresos.

Mostrar al menos:
- cantidad de consultas del mes
- cantidad de pacientes atendidos en el mes
- facturación / ganancia mensual total
- promedio cobrado por consulta
- comparación con meses anteriores si es posible

IMPORTANTE:
La ganancia mensual debe calcularse en base a los importes cargados manualmente en cada consulta, no con valores fijos ni estimaciones automáticas.

Si no hay datos mostrar un estado vacío claro.

8. GRÁFICO DE CONSULTAS MENSUALES E INGRESOS
Agregar gráficos de barras claros y profesionales para ver el progreso mensual.

Mostrar:
- consultas por mes
- ingresos / facturación por mes

Si hace falta, usar dos gráficos separados:
- uno de cantidad de consultas
- otro de dinero facturado por mes

El objetivo es ver fácilmente la evolución mensual tanto de actividad como de ingresos.

9. EXPERIENCIA DE USUARIO
Mejorar UX general:
- layout más limpio
- mejores espacios
- cards más claras
- navegación intuitiva
- diseño profesional orientado a consultorio nutricional

10. ESTRUCTURA DEL CÓDIGO
Mantener código ordenado:
- separar componentes
- crear componentes para:
  - PatientList
  - StatsDashboard
  - MonthlyChart
  - RevenueChart
  - PatientProfile
  - PlanViewer
  - ConsultationForm

No romper funcionalidades existentes.

Si hay datos mock usar estructura fácil de reemplazar.

RESULTADO ESPERADO
Quiero recibir:
- el código actualizado
- nuevos componentes si hacen falta
- correcciones en el layout
- solución al problema de recetas cortadas
- descarga de PDF disponible en cualquier momento
- módulo de pacientes y estadísticas funcionando
- carga manual de importes por consulta
- estadísticas mensuales de pacientes y facturación
- gráficos mensuales de consultas e ingresos

La app debe quedar lista para usar en consultorio real.
