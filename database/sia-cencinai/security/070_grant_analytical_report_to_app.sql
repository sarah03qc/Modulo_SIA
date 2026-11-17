/*
SIA-CENCINAI
Permiso minimo para registrar la instantanea del informe analitico.
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-16.

Este script NO es una migracion y la API no lo ejecuta.
Lo aplica, por separado, un principal administrativo del ambiente local.
No se ejecuto al prepararlo.

Permite insertar y leer el informe, sus visualizaciones y los agregados.
No concede UPDATE ni DELETE. No concede db_owner, db_datawriter,
db_datareader ni rol_aplicacion.

Sin este permiso el archivo HTML se descarga, pero el registro historico
queda pendiente. No se debe presentar esa descarga como informe ya
conservado en la base.

Revocacion:
  REVOKE SELECT, INSERT ON dbo.inf_informe FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.inf_visualizacion FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.inf_agregado FROM sia_cencinai_app;
*/
USE SIA_CENCINAI;
GO

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51070, N'Este script solo debe ejecutarse sobre SIA_CENCINAI.', 1;

IF DATABASE_PRINCIPAL_ID(N'sia_cencinai_app') IS NULL
    THROW 51073, N'Falta el usuario sia_cencinai_app.', 1;

IF OBJECT_ID(N'dbo.inf_informe', N'U') IS NULL
    OR OBJECT_ID(N'dbo.inf_visualizacion', N'U') IS NULL
    OR OBJECT_ID(N'dbo.inf_agregado', N'U') IS NULL
    THROW 51074, N'Faltan las tablas del informe analitico.', 1;

IF IS_ROLEMEMBER(N'db_owner', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datawriter', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datareader', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'rol_aplicacion', N'sia_cencinai_app') = 1
    THROW 51075, N'La cuenta de aplicacion no debe pertenecer a un rol amplio.', 1;

IF @@TRANCOUNT <> 0
    THROW 51076, N'Ejecute este script fuera de una transaccion existente.', 1;

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    GRANT SELECT, INSERT ON dbo.inf_informe TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.inf_visualizacion TO sia_cencinai_app;
    GRANT SELECT, INSERT ON dbo.inf_agregado TO sia_cencinai_app;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
