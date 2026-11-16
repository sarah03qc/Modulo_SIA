/*
SIA-CENCINAI
Permisos minimos para versionar el plan y registrar atenciones.
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-16.

Este script NO es una migracion y la API no lo ejecuta.
Lo aplica, por separado, un principal administrativo del ambiente local.
No se ejecuto al prepararlo.

Complementa 030_grant_process_writes_to_app.sql, ya aplicado en desarrollo.
No concede db_owner, db_datawriter, db_datareader ni rol_aplicacion.
No concede DELETE.

La revaloracion que crea una version de plan necesita UPDATE de es_vigente.
Las atenciones necesitan INSERT. El seguimiento y el expediente necesitan
leer la grupal, la programacion vencida, documentos y coordinaciones.
Si la cuenta no tiene estas concesiones, la operacion informa el bloqueo
y no simula ceros.

Revocacion:
  REVOKE UPDATE ON dbo.caso_plan (es_vigente) FROM sia_cencinai_app;
  REVOKE INSERT ON dbo.ate_individual FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ate_grupal FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ate_grupal_disciplina FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ate_grupal_profesional FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ate_grupal_participante FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.prog_actividad FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.doc_documento FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.doc_coordinacion FROM sia_cencinai_app;
  REVOKE INSERT ON dbo.aud_evento FROM sia_cencinai_app;
*/
USE SIA_CENCINAI;
GO

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51040, N'Este script solo debe ejecutarse sobre SIA_CENCINAI.', 1;

IF DATABASE_PRINCIPAL_ID(N'sia_cencinai_app') IS NULL
    THROW 51041, N'Falta el usuario sia_cencinai_app.', 1;

IF IS_ROLEMEMBER(N'db_owner', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datawriter', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datareader', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'rol_aplicacion', N'sia_cencinai_app') = 1
    THROW 51042, N'La cuenta de aplicacion no debe pertenecer a un rol amplio.', 1;

IF @@TRANCOUNT <> 0
    THROW 51043, N'Ejecute este script fuera de una transaccion existente.', 1;

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    GRANT UPDATE ON dbo.caso_plan (es_vigente) TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ate_individual TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ate_grupal TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ate_grupal_disciplina TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ate_grupal_profesional TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ate_grupal_participante TO sia_cencinai_app;
    GRANT SELECT ON dbo.prog_actividad TO sia_cencinai_app;
    GRANT SELECT ON dbo.doc_documento TO sia_cencinai_app;
    GRANT SELECT ON dbo.doc_coordinacion TO sia_cencinai_app;
    GRANT INSERT ON dbo.aud_evento TO sia_cencinai_app;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
