/*
SIA-CENCINAI
Permiso minimo para consultar y gestionar posibles referencias.
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-18.

Este script NO es una migracion y la API no lo ejecuta.
Lo aplica, por separado, un principal administrativo del ambiente local.

Permite leer e insertar dbo.ref_posible, y actualizar solo el estado y la
referencia vinculada. No concede DELETE. No concede db_owner, db_datawriter,
db_datareader ni rol_aplicacion.

Revocacion:
  REVOKE SELECT, INSERT ON dbo.ref_posible FROM sia_cencinai_app;
  REVOKE UPDATE ON dbo.ref_posible (estado, referencia_id) FROM sia_cencinai_app;
*/
USE SIA_CENCINAI;
GO

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51080, N'Este script solo debe ejecutarse sobre SIA_CENCINAI.', 1;

IF DATABASE_PRINCIPAL_ID(N'sia_cencinai_app') IS NULL
    THROW 51081, N'Falta el usuario sia_cencinai_app.', 1;

IF OBJECT_ID(N'dbo.ref_posible', N'U') IS NULL
    THROW 51082, N'Falta dbo.ref_posible.', 1;

IF IS_ROLEMEMBER(N'db_owner', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datawriter', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datareader', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'rol_aplicacion', N'sia_cencinai_app') = 1
    THROW 51083, N'La cuenta de aplicacion no debe pertenecer a un rol amplio.', 1;

IF @@TRANCOUNT <> 0
    THROW 51084, N'Ejecute este script fuera de una transaccion existente.', 1;

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    GRANT SELECT, INSERT ON dbo.ref_posible TO sia_cencinai_app;
    GRANT UPDATE ON dbo.ref_posible (estado, referencia_id) TO sia_cencinai_app;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
