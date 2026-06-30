# Oportunidades de expansión — BB Time Tracking

## 1. Mejoras inmediatas (sin cambiar la esencia)

- Corrección del typo `partime` → `parttime` o `part_time` en toda la base de código
- Cálculo de horas nocturnas, dominicales y feriados con recargos legales
- Configuración de políticas por empresa/país (umbral extra, bloques de redondeo, recargos, moneda)
- Múltiples entradas/salidas por día (ej: entra, sale a almorzar, vuelve) (pero que sea opcional, lo configura el admin)
- Registro de ausencias/vacaciones/enfermedad/días compensatorios
- Reporte en PDF además de Excel
- Firma del supervisor / aprobación del reporte antes de pago
- Notificaciones a supervisor para que autorice.
- Solicitudes de cambio de turno osea cambiar con otro usuario de la misma empresa.

## 2. Hacia un producto de equipo / SaaS

- Organizaciones/equipos (multi-tenant) – cada empresa con su espacio aislado
- Invitar empleados por email o código de equipo
- Roles más ricos: `admin`, `supervisor`, `contador`, `empleado`
- Flujo de aprobación de horas extras (empleado → supervisor → RRHH)
- Bloqueo de períodos con permisos granulares
- Historial de cambios / auditoría por entrada

## 3. Nivel producto profesional

- Marcar asistencia por ubicación (geolocalización) o QR
- Importar horarios desde sistemas de RRHH o biométricos (SAP, Workday, reloj checador)
- Proyección de salario/quincena en tiempo real
- Alertas inteligentes (umbral próximo, olvido de marcación, inconsistencias)
- Dashboard de analíticas (gráficos, tendencias, costos proyectados)
- App móvil nativa o PWA con notificaciones push mejorada
- Soporte multi-moneda y multi-país

## 4. Nicho Avianca / aeropuerto

- Importar itinerarios de vuelo / roster automáticamente
- Cálculos específicos de aerolínea (horas de vuelo vs ground duties, per diems, layovers)
- Plantillas de reporte por aerolínea (Avianca, Copa, United, etc.)
- Cálculo de horas de standby / on-call
