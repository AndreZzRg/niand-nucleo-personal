# Registro de cambios

Todos los cambios relevantes de **Núcleo de Gestión Personal** se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado sigue [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Corregido

- **El paso «Pruebas con cobertura» de la integración continua fallaba.**
  `src/lib/almacen.ts` y `src/lib/exportar.ts` no tenían pruebas y quedaban en
  0 %, lo que arrastraba la cobertura global por debajo de los umbrales
  declarados en `vite.config.ts` y hacía fallar `npm run test:coverage` en cada
  ejecución, aunque `vitest run` a secas pasara.

### Agregado

- Cobertura de pruebas de `src/lib`: validación por esquema y versión del
  almacenamiento, descarte del contenido corrupto, aislamiento de claves entre
  aplicaciones, y escape CSV conforme al RFC 4180 en la exportación.

---

## [1.0.0] — 2026-09-17

Primera versión pública del laboratorio.

### Agregado

- Módulo **Personal**.
- Módulo **Contratos**.
- Módulo **Expediente digital**.
- Módulo **Novedades**.
- Módulo **Alertas de vencimiento**.
- Documentación completa en `docs/`: arquitectura, marco normativo, despliegue,
  guía de uso, decisiones de arquitectura y descargo de responsabilidad.
- Integración continua en tres versiones de Node (20, 22 y 24) con formato, análisis
  estático, verificación de tipos, pruebas con cobertura y construcción de producción.
- Despliegue automático en GitHub Pages desde `main`.
- Análisis de seguridad con CodeQL y actualización de dependencias con Dependabot.
- Sistema de diseño NiAnd Labs con modo claro y oscuro y contraste AA.

### Normativo

- Reglas derivadas de **Código Sustantivo del Trabajo**: Arts. 39, 46, 76 y 104: contratos, periodo de prueba y reglamento.
- Reglas derivadas de **Ley 1581 de 2012**: El expediente laboral es una base de datos personales: finalidad, autorización y seguridad.
- Reglas derivadas de **Resolución 0312 de 2019**: Estándares mínimos del SG-SST: exámenes médicos ocupacionales.
- Reglas derivadas de **Ley 2466 de 2025**: Nuevas garantías y modalidades de vinculación.

> Verificación normativa: 17 de septiembre de 2026.

[No publicado]: https://github.com/AndreZzRg/niand-nucleo-personal/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AndreZzRg/niand-nucleo-personal/releases/tag/v1.0.0
