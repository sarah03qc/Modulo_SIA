/*
SIA-CENCINAI
Permisos mínimos para programar y resolver actividades de Oficina Local.
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creación: 2026-11-16.

Este script NO es una migración y la API no lo ejecuta.
Lo aplica, por separado, un principal administrativo del ambiente local.
No se ejecutó al prepararlo.

Complementa 040, que ya concede SELECT sobre dbo.prog_actividad.
No concede db_owner, db_datawriter, db_datareader ni rol_aplicacion.
No concede DELETE. No concede UPDATE de fecha_prevista, título ni tipo:
la reprogramación conserva la fila y la fecha prevista.

La cuenta necesita insertar la actividad, su cambio y las personas
asociadas de forma explícita, y actualizar solo el estado vigente.
El historial de cambios también se consulta para no perder el motivo.

Revocación:
  REVOKE INSERT ON dbo.prog_actividad FROM sia_cencinai_app;
  REVOKE UPDATE ON dbo.prog_actividad
    (fecha_vigente, estado, motivo_vigente) FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.prog_cambio FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.prog_persona FROM sia_cencinai_app;
*/
USE SIA_CENCINAI;
GO

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51060, N'Este script solo debe ejecutarse sobre SIA_CENCINAI.', 1;

IF DATABASE_PRINCIPAL_ID(N'sia_cencinai_app') IS NULL
    THROW 51061, N'Falta el usuario sia_cencinai_app.', 1;

IF OBJECT_ID(N'dbo.prog_actividad', N'U') IS NULL
    OR OBJECT_ID(N'dbo.prog_cambio', N'U') IS NULL
    OR OBJECT_ID(N'dbo.prog_persona', N'U') IS NULL
    THROW 51062, N'Faltan las tablas de programación.', 1;

IF IS_ROLEMEMBER(N'db_owner', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datawriter', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datareader', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'rol_aplicacion', N'sia_cencinai_app') = 1
    THROW 51063, N'La cuenta de aplicación no debe pertenecer a un rol amplio.', 1;

IF @@TRANCOUNT <> 0
    THROW 51064, N'Ejecute este script fuera de una transacción existente.', 1;

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    GRANT INSERT ON dbo.prog_actividad TO sia_cencinai_app;
    GRANT UPDATE ON dbo.prog_actividad (
        fecha_vigente, estado, motivo_vigente
    ) TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.prog_cambio TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.prog_persona TO sia_cencinai_app;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
