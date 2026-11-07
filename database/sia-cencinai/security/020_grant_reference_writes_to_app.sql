/*
SIA-CENCINAI
Permisos minimos del Lote 02 para sia_cencinai_app.

Este script NO es una migracion de esquema y la API no lo ejecuta.
Lo aplica, por separado, un principal administrativo del ambiente local.

Concede solo el DML que el envio, la consulta, el borrador y la impresion usan.
No concede db_owner, db_datawriter, db_datareader ni membresia en rol_aplicacion.
No abre caso_ai, ses_valoracion, planes, atenciones, documentos ni ops.cerrar_caso.
No actualiza ref_referencia: el envio inserta y la impresion no modifica la referencia.

Revocacion:
  REVOKE INSERT, SELECT ON dbo.vinculo_persona FROM sia_cencinai_app;
  REVOKE INSERT, SELECT ON dbo.ref_referencia FROM sia_cencinai_app;
  REVOKE INSERT, SELECT ON dbo.ref_contexto FROM sia_cencinai_app;
  REVOKE INSERT, SELECT ON dbo.ref_motivo FROM sia_cencinai_app;
  REVOKE INSERT, SELECT ON dbo.ref_impresion FROM sia_cencinai_app;
  REVOKE SELECT, INSERT, DELETE ON dbo.bor_captura FROM sia_cencinai_app;
  REVOKE UPDATE ON dbo.bor_captura FROM sia_cencinai_app;
  REVOKE SELECT, INSERT ON dbo.aud_evento FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.cat_item FROM sia_cencinai_app;
  REVOKE SELECT ON dbo.cat_version FROM sia_cencinai_app;
*/
USE SIA_CENCINAI;
GO

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51020, N'Este script solo debe ejecutarse sobre SIA_CENCINAI.', 1;
GO

IF DATABASE_PRINCIPAL_ID(N'sia_cencinai_app') IS NULL
    THROW 51021, N'Falta el usuario sia_cencinai_app.', 1;
GO

IF IS_ROLEMEMBER(N'db_owner', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'db_datawriter', N'sia_cencinai_app') = 1
    OR IS_ROLEMEMBER(N'rol_aplicacion', N'sia_cencinai_app') = 1
    THROW 51022, N'La cuenta de aplicacion no debe recibir estos GRANT por medio de un rol amplio.', 1;
GO

GRANT SELECT, INSERT ON dbo.vinculo_persona TO sia_cencinai_app;
GRANT SELECT, INSERT ON dbo.ref_referencia TO sia_cencinai_app;
GRANT SELECT, INSERT ON dbo.ref_contexto TO sia_cencinai_app;
GRANT SELECT, INSERT ON dbo.ref_motivo TO sia_cencinai_app;
GRANT SELECT, INSERT ON dbo.ref_impresion TO sia_cencinai_app;
GRANT SELECT, INSERT, DELETE ON dbo.bor_captura TO sia_cencinai_app;
GRANT UPDATE ON dbo.bor_captura (
    contenido,
    actualizado_en,
    clave_negocio,
    ambito_nivel,
    oficina_local_id,
    establecimiento_id
) TO sia_cencinai_app;
GRANT SELECT, INSERT ON dbo.aud_evento TO sia_cencinai_app;
GRANT SELECT ON dbo.cat_item TO sia_cencinai_app;
GRANT SELECT ON dbo.cat_version TO sia_cencinai_app;
GO
