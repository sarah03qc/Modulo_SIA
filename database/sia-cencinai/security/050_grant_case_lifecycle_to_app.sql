/*
SIA-CENCINAI
Permisos mínimos para coordinar, conservar reportes y cerrar un caso.
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creación: 2026-11-16.

Este script NO es una migración y la API no lo ejecuta.
Lo aplica, por separado, un principal administrativo del ambiente local.
No se ejecutó al prepararlo.

Complementa 030 y 040, ya aplicados en desarrollo.
No concede db_owner, db_datawriter, db_datareader ni rol_aplicacion.
No concede DELETE ni UPDATE directo sobre dbo.caso_ai.

El 2026-11-16 se comprobó que los esquemas dbo y ops pertenecen a dbo.
Por eso EXECUTE sobre ops.cerrar_caso alcanza, por cadena de propiedad,
las escrituras del procedimiento. No se concede INSERT sobre caso_cierre
ni UPDATE de estado. La API sí inserta coordinaciones, eventos y reportes,
y necesita leerlos junto con el cierre.

Si, después de aplicarlo, el cierre responde permiso 229 sobre una tabla,
no amplíe este script: informe la tabla y detenga esa operación.

Revocación:
  REVOKE EXECUTE ON ops.cerrar_caso FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.caso_cierre FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.doc_coordinacion FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.doc_coordinacion_evento FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.doc_reporte_caso FROM sia_cencinai_app;
*/
USE SIA_CENCINAI;
GO

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51050, N'Este script solo debe ejecutarse sobre SIA_CENCINAI.', 1;

IF DATABASE_PRINCIPAL_ID(N'sia_cencinai_app') IS NULL
    THROW 51051, N'Falta el usuario sia_cencinai_app.', 1;

IF OBJECT_ID(N'ops.cerrar_caso', N'P') IS NULL
    THROW 51052, N'Falta el procedimiento ops.cerrar_caso.', 1;

IF IS_ROLEMEMBER(N'db_owner', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datawriter', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datareader', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'rol_aplicacion', N'sia_cencinai_app') = 1
    THROW 51053, N'La cuenta de aplicacion no debe pertenecer a un rol amplio.', 1;

IF @@TRANCOUNT <> 0
    THROW 51054, N'Ejecute este script fuera de una transaccion existente.', 1;

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    GRANT EXECUTE ON ops.cerrar_caso TO sia_cencinai_app;
    GRANT SELECT ON dbo.caso_cierre TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.doc_coordinacion TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.doc_coordinacion_evento TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.doc_reporte_caso TO sia_cencinai_app;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO

SELECT
    CONVERT(int, HAS_PERMS_BY_NAME(N'ops.cerrar_caso', N'OBJECT', N'EXECUTE'))
        AS ejecutar_cierre,
    CONVERT(int, HAS_PERMS_BY_NAME(N'dbo.caso_cierre', N'OBJECT', N'SELECT'))
        AS leer_cierre,
    CONVERT(int, HAS_PERMS_BY_NAME(N'dbo.doc_coordinacion', N'OBJECT', N'INSERT'))
        AS insertar_coordinacion,
    CONVERT(int, HAS_PERMS_BY_NAME(N'dbo.doc_reporte_caso', N'OBJECT', N'INSERT'))
        AS insertar_reporte;
GO
