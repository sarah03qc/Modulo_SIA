/*
SIA_CENCINAI — semilla 015_catalogos_funcionales
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-18.

Catalogos funcionales decididos por la responsable del proyecto el 2026-11-18
(listas del prototipo aprobado):
- DISCIPLINA: cinco disciplinas.
- ESTRATEGIA: diez estrategias. "Otra" exige texto.
- INSTITUCION_COORDINACION: nueve instituciones y "Otra" (exige el nombre).
- ESTADO_COORDINACION: cinco estados. ambito = INTERCAMBIO_FORMAL marca los estados
  que solo aplican a un intercambio documental formal (Preparada, Enviada, Recibida).
- MODALIDAD_COORDINACION: NEEDS_VALIDATION. Se deriva de la instruccion de registrar
  llamadas, correos, reuniones, gestiones de seguimiento e intercambios formales.
- TIPO_DOCUMENTO: "Documento asociado". Otros tipos quedan NEEDS_VALIDATION.

Si la version vigente de un catalogo no coincide con la lista, crea una version nueva
y deja la anterior como historica (vigente = 0). No borra ni cambia filas existentes:
los registros que apunten a la version anterior conservan su identidad.

Requiere la migracion 110. Para ejecutar en desarrollo, cambie @permitir a 1.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @permitir bit = 0;
IF @permitir <> 1
    THROW 51150, N'Semilla 015 bloqueada. Cambie @permitir a 1 solo en desarrollo autorizado.', 1;

IF NOT EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'110_catalogos_y_expediente_operativo' AND estado = N'APLICADA'
)
    THROW 51151, N'La migracion 110 no esta aplicada.', 1;

DECLARE @desde date = '20261118';

CREATE TABLE #lista (
    codigo_catalogo nvarchar(40) COLLATE DATABASE_DEFAULT NOT NULL,
    codigo nvarchar(80) COLLATE DATABASE_DEFAULT NOT NULL,
    etiqueta nvarchar(300) COLLATE DATABASE_DEFAULT NOT NULL,
    orden int NOT NULL,
    requiere_texto bit NOT NULL,
    ambito nvarchar(40) COLLATE DATABASE_DEFAULT NULL
);

INSERT INTO #lista (codigo_catalogo, codigo, etiqueta, orden, requiere_texto, ambito)
VALUES
    (N'DISCIPLINA', N'NUTRICION', N'Nutrici' + NCHAR(243) + N'n', 1, 0, NULL),
    (N'DISCIPLINA', N'PSICOLOGIA', N'Psicolog' + NCHAR(237) + N'a', 2, 0, NULL),
    (N'DISCIPLINA', N'EDUCACION_PREESCOLAR', N'Educaci' + NCHAR(243) + N'n Preescolar', 3, 0, NULL),
    (N'DISCIPLINA', N'TERAPIA_LENGUAJE', N'Terapia de Lenguaje', 4, 0, NULL),
    (N'DISCIPLINA', N'TERAPIA_FISICA', N'Terapia F' + NCHAR(237) + N'sica', 5, 0, NULL),
    (N'ESTRATEGIA', N'ATENCION_INDIVIDUALIZADA', N'Atenci' + NCHAR(243) + N'n individualizada', 1, 0, NULL),
    (N'ESTRATEGIA', N'CONSEJERIA', N'Consejer' + NCHAR(237) + N'a', 2, 0, NULL),
    (N'ESTRATEGIA', N'VISITA_DOMICILIAR', N'Visita domiciliar', 3, 0, NULL),
    (N'ESTRATEGIA', N'ATENCION_EN_CONTEXTO', N'Atenci' + NCHAR(243) + N'n en contexto', 4, 0, NULL),
    (N'ESTRATEGIA', N'ATENCION_GRUPAL', N'Atenci' + NCHAR(243) + N'n grupal', 5, 0, NULL),
    (N'ESTRATEGIA', N'ACTIVIDAD_EDUCATIVA', N'Actividad educativa', 6, 0, NULL),
    (N'ESTRATEGIA', N'ACTIVIDAD_COMUNITARIA', N'Actividad comunitaria', 7, 0, NULL),
    (N'ESTRATEGIA', N'SESION_APOYO', N'Sesi' + NCHAR(243) + N'n de Apoyo', 8, 0, NULL),
    (N'ESTRATEGIA', N'REFERENCIA_INTERINSTITUCIONAL', N'Referencia interinstitucional', 9, 0, NULL),
    (N'ESTRATEGIA', N'OTRA', N'Otra', 10, 1, NULL),
    (N'INSTITUCION_COORDINACION', N'CCSS', N'CCSS', 1, 0, NULL),
    (N'INSTITUCION_COORDINACION', N'MEP', N'MEP', 2, 0, NULL),
    (N'INSTITUCION_COORDINACION', N'PANI', N'PANI', 3, 0, NULL),
    (N'INSTITUCION_COORDINACION', N'INAMU', N'INAMU', 4, 0, NULL),
    (N'INSTITUCION_COORDINACION', N'INA', N'INA', 5, 0, NULL),
    (N'INSTITUCION_COORDINACION', N'IAFA', N'IAFA', 6, 0, NULL),
    (N'INSTITUCION_COORDINACION', N'IMAS', N'IMAS', 7, 0, NULL),
    (N'INSTITUCION_COORDINACION', N'MTSS', N'MTSS', 8, 0, NULL),
    (N'INSTITUCION_COORDINACION', N'OAPVD', N'OAPVD', 9, 0, NULL),
    (N'INSTITUCION_COORDINACION', N'OTRA', N'Otra', 10, 1, NULL),
    (N'ESTADO_COORDINACION', N'PREPARADA', N'Preparada', 1, 0, N'INTERCAMBIO_FORMAL'),
    (N'ESTADO_COORDINACION', N'ENVIADA', N'Enviada', 2, 0, N'INTERCAMBIO_FORMAL'),
    (N'ESTADO_COORDINACION', N'RECIBIDA', N'Recibida', 3, 0, N'INTERCAMBIO_FORMAL'),
    (N'ESTADO_COORDINACION', N'EN_SEGUIMIENTO', N'En seguimiento', 4, 0, NULL),
    (N'ESTADO_COORDINACION', N'CERRADA', N'Cerrada', 5, 0, NULL),
    (N'MODALIDAD_COORDINACION', N'LLAMADA', N'Llamada telef' + NCHAR(243) + N'nica', 1, 0, NULL),
    (N'MODALIDAD_COORDINACION', N'CORREO', N'Correo electr' + NCHAR(243) + N'nico', 2, 0, NULL),
    (N'MODALIDAD_COORDINACION', N'REUNION', N'Reuni' + NCHAR(243) + N'n', 3, 0, NULL),
    (N'MODALIDAD_COORDINACION', N'GESTION_SEGUIMIENTO', N'Gesti' + NCHAR(243) + N'n de seguimiento', 4, 0, NULL),
    (N'MODALIDAD_COORDINACION', N'INTERCAMBIO_FORMAL', N'Intercambio documental formal', 5, 0, N'INTERCAMBIO_FORMAL'),
    (N'TIPO_DOCUMENTO', N'DOCUMENTO_ASOCIADO', N'Documento asociado', 1, 0, NULL);

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @catalogo nvarchar(40);
    DECLARE @vigente bigint;
    DECLARE @coincide bit;
    DECLARE @numero int;
    DECLARE @nueva bigint;
    DECLARE catalogos CURSOR LOCAL FAST_FORWARD FOR
        SELECT DISTINCT codigo_catalogo FROM #lista;
    OPEN catalogos;
    FETCH NEXT FROM catalogos INTO @catalogo;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @vigente = NULL;
        SET @coincide = 0;
        SELECT @vigente = cat_version_id
        FROM dbo.cat_version
        WHERE codigo_catalogo = @catalogo AND vigente = 1;

        IF @vigente IS NOT NULL
            AND NOT EXISTS (
                SELECT l.codigo, l.etiqueta, l.orden, l.requiere_texto, l.ambito
                FROM #lista AS l WHERE l.codigo_catalogo = @catalogo
                EXCEPT
                SELECT i.codigo, i.etiqueta, i.orden, i.requiere_texto, i.ambito
                FROM dbo.cat_item AS i WHERE i.cat_version_id = @vigente AND i.activo = 1
            )
            AND NOT EXISTS (
                SELECT i.codigo FROM dbo.cat_item AS i
                WHERE i.cat_version_id = @vigente AND i.activo = 1
                EXCEPT
                SELECT l.codigo FROM #lista AS l WHERE l.codigo_catalogo = @catalogo
            )
            SET @coincide = 1;

        IF @coincide = 0
        BEGIN
            SET @numero = (
                SELECT ISNULL(MAX(numero_version), 0) + 1
                FROM dbo.cat_version WHERE codigo_catalogo = @catalogo
            );
            UPDATE dbo.cat_version SET vigente = 0
            WHERE codigo_catalogo = @catalogo AND vigente = 1;

            INSERT INTO dbo.cat_version (codigo_catalogo, numero_version, vigente, vigente_desde)
            VALUES (@catalogo, @numero, 1, @desde);
            SET @nueva = CONVERT(bigint, SCOPE_IDENTITY());

            INSERT INTO dbo.cat_item (
                cat_version_id, codigo_catalogo, codigo, etiqueta, orden, requiere_texto, ambito, activo
            )
            SELECT @nueva, l.codigo_catalogo, l.codigo, l.etiqueta, l.orden, l.requiere_texto, l.ambito, 1
            FROM #lista AS l
            WHERE l.codigo_catalogo = @catalogo;

            PRINT N'Version ' + CONVERT(nvarchar(10), @numero) + N' vigente de ' + @catalogo;
        END
        ELSE
            PRINT N'Sin cambios en ' + @catalogo;

        FETCH NEXT FROM catalogos INTO @catalogo;
    END
    CLOSE catalogos;
    DEALLOCATE catalogos;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
