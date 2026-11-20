/*
SIA-CENCINAI
Permiso minimo para incorporar documentos al expediente.
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-18.

Este script NO es una migracion y la API no lo ejecuta.
Lo aplica un principal administrativo del ambiente local.
El binario del archivo no se guarda en SQL Server: la API lo guarda en un almacen
privado fuera de la carpeta publica de la aplicacion web y registra aqui sus metadatos.
No concede UPDATE ni DELETE: un documento incorporado no se reemplaza en silencio.

Revocacion:
  REVOKE INSERT ON dbo.doc_documento FROM sia_cencinai_app;
*/
USE SIA_CENCINAI;
GO

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51090, N'Este script solo debe ejecutarse sobre SIA_CENCINAI.', 1;

IF DATABASE_PRINCIPAL_ID(N'sia_cencinai_app') IS NULL
    THROW 51091, N'Falta el usuario sia_cencinai_app.', 1;

GRANT SELECT, INSERT ON dbo.doc_documento TO sia_cencinai_app;
GO

SELECT
    CONVERT(int, HAS_PERMS_BY_NAME(N'dbo.doc_documento', N'OBJECT', N'INSERT'))
        AS insertar_documento;
GO
