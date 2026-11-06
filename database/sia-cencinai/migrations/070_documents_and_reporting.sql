/*
SIA_CENCINAI — migracion 070_documents_and_reporting
Documento, coordinacion, reporte individual e informe analitico.
No se guarda el binario del archivo. El agregado no guarda per_id_persona.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 070.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'070_documents_and_reporting' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'070_documents_and_reporting ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.doc_documento
    (
        documento_id bigint IDENTITY(1, 1) NOT NULL,
        caso_id bigint NOT NULL,
        tipo_item_id bigint NULL,
        tipo_catalogo nvarchar(40) NULL,
        tipo_texto nvarchar(120) NULL,
        fecha_documento date NOT NULL,
        responsable_usuario nvarchar(128) NOT NULL,
        nombre_original nvarchar(260) NOT NULL,
        clave_almacen nvarchar(200) NOT NULL,
        tamano_bytes bigint NOT NULL,
        creado_en datetime2(0) NOT NULL,
        CONSTRAINT PK_doc_documento PRIMARY KEY CLUSTERED (documento_id),
        CONSTRAINT FK_doc_documento_caso
            FOREIGN KEY (caso_id) REFERENCES dbo.caso_ai (caso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_doc_documento_tipo
            FOREIGN KEY (tipo_item_id, tipo_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_doc_documento_tipo CHECK (
            (tipo_item_id IS NOT NULL OR tipo_texto IS NOT NULL)
            AND (
                (tipo_item_id IS NULL AND tipo_catalogo IS NULL)
                OR (tipo_item_id IS NOT NULL AND tipo_catalogo = N'TIPO_DOCUMENTO')
            )
        ),
        CONSTRAINT CK_doc_documento_archivo CHECK (
            LEN(LTRIM(RTRIM(nombre_original))) > 0
            AND LEN(LTRIM(RTRIM(clave_almacen))) > 0
            AND tamano_bytes >= 0
            AND LEN(LTRIM(RTRIM(responsable_usuario))) > 0
        )
    );

    CREATE TABLE dbo.doc_coordinacion
    (
        coordinacion_id bigint IDENTITY(1, 1) NOT NULL,
        caso_id bigint NOT NULL,
        institucion_item_id bigint NULL,
        institucion_catalogo nvarchar(40) NULL,
        institucion_texto nvarchar(200) NOT NULL,
        profesional_responsable nvarchar(200) NOT NULL,
        digitador_usuario nvarchar(128) NOT NULL,
        motivo nvarchar(1000) NULL,
        fecha_coordinacion date NULL,
        estado_item_id bigint NULL,
        estado_catalogo nvarchar(40) NULL,
        estado_texto nvarchar(80) NOT NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_doc_coordinacion PRIMARY KEY CLUSTERED (coordinacion_id),
        CONSTRAINT FK_doc_coordinacion_caso
            FOREIGN KEY (caso_id) REFERENCES dbo.caso_ai (caso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_doc_coordinacion_institucion
            FOREIGN KEY (institucion_item_id, institucion_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_doc_coordinacion_estado
            FOREIGN KEY (estado_item_id, estado_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_doc_coordinacion_institucion CHECK (
            (institucion_item_id IS NULL AND institucion_catalogo IS NULL)
            OR (institucion_item_id IS NOT NULL AND institucion_catalogo = N'INSTITUCION_COORDINACION')
        ),
        CONSTRAINT CK_doc_coordinacion_estado CHECK (
            (estado_item_id IS NULL AND estado_catalogo IS NULL)
            OR (estado_item_id IS NOT NULL AND estado_catalogo = N'ESTADO_COORDINACION')
        ),
        CONSTRAINT CK_doc_coordinacion_textos CHECK (
            LEN(LTRIM(RTRIM(institucion_texto))) > 0
            AND LEN(LTRIM(RTRIM(profesional_responsable))) > 0
            AND LEN(LTRIM(RTRIM(digitador_usuario))) > 0
            AND LEN(LTRIM(RTRIM(estado_texto))) > 0
        )
    );

    CREATE TABLE dbo.doc_coordinacion_evento
    (
        evento_id bigint IDENTITY(1, 1) NOT NULL,
        coordinacion_id bigint NOT NULL,
        estado_texto nvarchar(80) NOT NULL,
        estado_item_id bigint NULL,
        estado_catalogo nvarchar(40) NULL,
        usuario nvarchar(128) NOT NULL,
        ocurrido_en datetime2(0) NOT NULL,
        CONSTRAINT PK_doc_coordinacion_evento PRIMARY KEY CLUSTERED (evento_id),
        CONSTRAINT FK_doc_coordinacion_evento_coordinacion
            FOREIGN KEY (coordinacion_id) REFERENCES dbo.doc_coordinacion (coordinacion_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_doc_coordinacion_evento_estado
            FOREIGN KEY (estado_item_id, estado_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_doc_coordinacion_evento_estado CHECK (
            (estado_item_id IS NULL AND estado_catalogo IS NULL)
            OR (estado_item_id IS NOT NULL AND estado_catalogo = N'ESTADO_COORDINACION')
        ),
        CONSTRAINT CK_doc_coordinacion_evento_textos CHECK (
            LEN(LTRIM(RTRIM(estado_texto))) > 0
            AND LEN(LTRIM(RTRIM(usuario))) > 0
        )
    );

    CREATE TABLE dbo.doc_reporte_caso
    (
        reporte_id bigint IDENTITY(1, 1) NOT NULL,
        caso_id bigint NOT NULL,
        tipo_proposito nvarchar(200) NOT NULL,
        fecha_reporte date NOT NULL,
        responsable_usuario nvarchar(128) NOT NULL,
        motivo nvarchar(1000) NULL,
        creado_en datetime2(0) NOT NULL,
        CONSTRAINT PK_doc_reporte_caso PRIMARY KEY CLUSTERED (reporte_id),
        CONSTRAINT FK_doc_reporte_caso_caso
            FOREIGN KEY (caso_id) REFERENCES dbo.caso_ai (caso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_doc_reporte_caso_textos CHECK (
            LEN(LTRIM(RTRIM(tipo_proposito))) > 0
            AND LEN(LTRIM(RTRIM(responsable_usuario))) > 0
        )
    );

    CREATE TABLE dbo.inf_informe
    (
        informe_id bigint IDENTITY(1, 1) NOT NULL,
        titulo nvarchar(300) NOT NULL,
        responsable_usuario nvarchar(128) NOT NULL,
        rol_codigo nvarchar(40) NOT NULL,
        ambito_nivel nvarchar(20) NOT NULL,
        region_id int NULL,
        oficina_local_id int NULL,
        establecimiento_id int NULL,
        periodo_anio int NOT NULL,
        filtros_resumen nvarchar(2000) NOT NULL,
        corte_en datetime2(0) NOT NULL,
        generado_en datetime2(0) NOT NULL,
        clave_archivo nvarchar(200) NULL,
        CONSTRAINT PK_inf_informe PRIMARY KEY CLUSTERED (informe_id),
        CONSTRAINT CK_inf_informe_ambito_nivel CHECK (
            ambito_nivel IN (N'OFICINA_LOCAL', N'REGION', N'NACIONAL')
        ),
        CONSTRAINT CK_inf_informe_ambito CHECK (
            (ambito_nivel = N'REGION' AND region_id IS NOT NULL)
            OR (ambito_nivel = N'OFICINA_LOCAL' AND oficina_local_id IS NOT NULL)
            OR (ambito_nivel = N'NACIONAL')
        ),
        CONSTRAINT CK_inf_informe_ids CHECK (
            (region_id IS NULL OR region_id > 0)
            AND (oficina_local_id IS NULL OR oficina_local_id > 0)
            AND (establecimiento_id IS NULL OR establecimiento_id > 0)
        ),
        CONSTRAINT CK_inf_informe_textos CHECK (
            LEN(LTRIM(RTRIM(titulo))) > 0
            AND LEN(LTRIM(RTRIM(responsable_usuario))) > 0
            AND LEN(LTRIM(RTRIM(rol_codigo))) > 0
            AND LEN(LTRIM(RTRIM(filtros_resumen))) > 0
        )
    );

    CREATE TABLE dbo.inf_visualizacion
    (
        visualizacion_id bigint IDENTITY(1, 1) NOT NULL,
        informe_id bigint NOT NULL,
        codigo_visualizacion tinyint NOT NULL,
        orden int NOT NULL,
        titulo nvarchar(400) NOT NULL,
        filtros nvarchar(1000) NULL,
        analisis nvarchar(4000) NOT NULL,
        CONSTRAINT PK_inf_visualizacion PRIMARY KEY CLUSTERED (visualizacion_id),
        CONSTRAINT UQ_inf_visualizacion_codigo UNIQUE (informe_id, codigo_visualizacion),
        CONSTRAINT UQ_inf_visualizacion_orden UNIQUE (informe_id, orden),
        CONSTRAINT FK_inf_visualizacion_informe
            FOREIGN KEY (informe_id) REFERENCES dbo.inf_informe (informe_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_inf_visualizacion_codigo CHECK (codigo_visualizacion BETWEEN 1 AND 12),
        CONSTRAINT CK_inf_visualizacion_orden CHECK (orden >= 1),
        CONSTRAINT CK_inf_visualizacion_textos CHECK (
            LEN(LTRIM(RTRIM(titulo))) > 0
            AND LEN(LTRIM(RTRIM(analisis))) > 0
        )
    );

    CREATE TABLE dbo.inf_agregado
    (
        agregado_id bigint IDENTITY(1, 1) NOT NULL,
        visualizacion_id bigint NOT NULL,
        orden int NOT NULL,
        etiqueta nvarchar(300) NOT NULL,
        valor_numerico decimal(18, 4) NULL,
        valor_texto nvarchar(500) NULL,
        CONSTRAINT PK_inf_agregado PRIMARY KEY CLUSTERED (agregado_id),
        CONSTRAINT UQ_inf_agregado_orden UNIQUE (visualizacion_id, orden),
        CONSTRAINT FK_inf_agregado_visualizacion
            FOREIGN KEY (visualizacion_id) REFERENCES dbo.inf_visualizacion (visualizacion_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_inf_agregado_orden CHECK (orden >= 1),
        CONSTRAINT CK_inf_agregado_etiqueta CHECK (LEN(LTRIM(RTRIM(etiqueta))) > 0),
        CONSTRAINT CK_inf_agregado_valor CHECK (
            valor_numerico IS NOT NULL
            OR (valor_texto IS NOT NULL AND LEN(LTRIM(RTRIM(valor_texto))) > 0)
        )
    );

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'070_documents_and_reporting', 70, N'APLICADA', CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
