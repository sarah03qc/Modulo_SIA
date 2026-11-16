/*
SIA-CENCINAI
Permisos minimos del proceso interdisciplinario para sia_cencinai_app.
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-14.

Este script NO es una migracion y la API no lo ejecuta.
Lo aplica, por separado, un principal administrativo del ambiente local.
No se ejecuto al preparar la entrega del 2026-11-14.

Actualizacion 2026-11-16:
En el ambiente local de desarrollo el equipo ya aplico este script de forma
manual. La creacion de sesiones se probo desde la aplicacion y funciono.
No volver a ejecutarlo sin una revision de permisos. No forma parte del arranque.

Concede el DML de sesion, valoracion, resolucion, apertura de caso y
la lectura del detalle operativo. No concede db_owner, db_datawriter,
db_datareader ni membresia en rol_aplicacion.
La misma cuenta tecnica atiende todos los roles. La separacion de campos
sensibles sigue en el servicio, no en este GRANT.

Revocacion:
  REVOKE SELECT, INSERT ON dbo.ses_sesion FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ses_disciplina FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ses_situacion FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ses_valoracion FROM sia_cencinai_app;
  REVOKE UPDATE ON dbo.ses_valoracion (es_vigente, caso_id) FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ses_valoracion_categoria FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ses_valoracion_factor FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.ses_resolucion FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.caso_ai FROM sia_cencinai_app;
  REVOKE UPDATE ON dbo.caso_ai (valoracion_vigente_id, plan_vigente_id)
    FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.caso_estado_historial FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.caso_plan FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.caso_plan_proposito FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.caso_plan_estrategia FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.caso_plan_disciplina FROM sia_cencinai_app;
  REVOKE UPDATE ON dbo.ref_referencia (estado) FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.ref_contexto FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.ate_individual FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.cat_instrumento_version FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.cat_instrumento_categoria FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.cat_instrumento_factor FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.cat_matriz_prioridad FROM sia_cencinai_app;
*/
USE SIA_CENCINAI;
GO

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51030, N'Este script solo debe ejecutarse sobre SIA_CENCINAI.', 1;

IF DATABASE_PRINCIPAL_ID(N'sia_cencinai_app') IS NULL
    THROW 51031, N'Falta el usuario sia_cencinai_app.', 1;

IF IS_ROLEMEMBER(N'db_owner', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datawriter', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datareader', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'rol_aplicacion', N'sia_cencinai_app') = 1
    THROW 51032, N'La cuenta de aplicacion no debe pertenecer a un rol amplio.', 1;

IF @@TRANCOUNT <> 0
    THROW 51033, N'Ejecute este script fuera de una transaccion existente.', 1;

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    GRANT SELECT, INSERT ON dbo.ses_sesion TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ses_disciplina TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ses_situacion TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ses_valoracion TO sia_cencinai_app;
    GRANT UPDATE ON dbo.ses_valoracion (es_vigente, caso_id) TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ses_valoracion_categoria TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ses_valoracion_factor TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.ses_resolucion TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.caso_ai TO sia_cencinai_app;
    GRANT UPDATE ON dbo.caso_ai (valoracion_vigente_id, plan_vigente_id) TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.caso_estado_historial TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.caso_plan TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.caso_plan_proposito TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.caso_plan_estrategia TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.caso_plan_disciplina TO sia_cencinai_app;
    GRANT UPDATE ON dbo.ref_referencia (estado) TO sia_cencinai_app;
    GRANT SELECT ON dbo.ref_contexto TO sia_cencinai_app;
    GRANT SELECT ON dbo.ate_individual TO sia_cencinai_app;
    GRANT SELECT ON dbo.cat_instrumento_version TO sia_cencinai_app;
    GRANT SELECT ON dbo.cat_instrumento_categoria TO sia_cencinai_app;
    GRANT SELECT ON dbo.cat_instrumento_factor TO sia_cencinai_app;
    GRANT SELECT ON dbo.cat_matriz_prioridad TO sia_cencinai_app;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
