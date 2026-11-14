/*
SIA-CENCINAI
Permiso minimo para HU-009 CA-06 / RF-017.
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Primer registro en Git: 2026-11-06 (6d4d784).
2026-11-14: Las guardas y el permiso se ejecutan en un mismo lote.

Este script NO es una migracion y la API no lo ejecuta.
Lo aplica, por separado, un principal administrativo del ambiente que corresponda.

Objeto:
  dbo.caso_lista_establecimiento
  Columnas: caso_id, per_id_persona, establecimiento_id, oficina_local_id,
  region_id, estado, prioridad_codigo, fecha_apertura, fecha_cierre.

No concede SELECT sobre ses_valoracion, ses_valoracion_factor, caso_plan,
ate_individual, doc_documento ni el resto del expediente.
La vista y las tablas base comparten propietario dbo. El encadenamiento de
propiedad permite leer la proyeccion sin abrir esas tablas a la cuenta de aplicacion.

Cuenta:
  sia_cencinai_app

Revocacion:
  REVOKE SELECT ON dbo.caso_lista_establecimiento FROM sia_cencinai_app;
*/
USE SIA_CENCINAI;
GO

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51010, N'Este script solo debe ejecutarse sobre SIA_CENCINAI.', 1;

IF OBJECT_ID(N'dbo.caso_lista_establecimiento', N'V') IS NULL
    THROW 51011, N'Falta dbo.caso_lista_establecimiento.', 1;

IF DATABASE_PRINCIPAL_ID(N'sia_cencinai_app') IS NULL
    THROW 51012, N'Falta el usuario sia_cencinai_app.', 1;

GRANT SELECT ON dbo.caso_lista_establecimiento TO sia_cencinai_app;
GO
