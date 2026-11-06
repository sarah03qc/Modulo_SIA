/*
SIA_CENCINAI — migracion 040_sessions_and_assessments
Sesion, valoracion confirmada, factores y resolucion.
Las FK hacia caso_ai se agregan en 090: el caso todavia no existe.
valoracion_vigente_id del caso tampoco se enlaza aqui.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 040.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'040_sessions_and_assessments' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'040_sessions_and_assessments ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.ses_sesion
    (
        sesion_id bigint IDENTITY(1, 1) NOT NULL,
        oficina_local_id int NOT NULL,
        fecha date NOT NULL,
        hora_inicio time(0) NOT NULL,
        hora_fin time(0) NOT NULL,
        lugar nvarchar(200) NULL,
        creada_en datetime2(0) NOT NULL,
        creada_por nvarchar(128) NOT NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_ses_sesion PRIMARY KEY CLUSTERED (sesion_id),
        CONSTRAINT CK_ses_sesion_oficina CHECK (oficina_local_id > 0),
        CONSTRAINT CK_ses_sesion_hora CHECK (hora_fin > hora_inicio),
        CONSTRAINT CK_ses_sesion_usuario CHECK (LEN(LTRIM(RTRIM(creada_por))) > 0)
    );

    CREATE TABLE dbo.ses_disciplina
    (
        sesion_id bigint NOT NULL,
        disciplina_item_id bigint NOT NULL,
        disciplina_catalogo nvarchar(40) NOT NULL,
        CONSTRAINT PK_ses_disciplina PRIMARY KEY CLUSTERED (sesion_id, disciplina_item_id),
        CONSTRAINT FK_ses_disciplina_sesion
            FOREIGN KEY (sesion_id) REFERENCES dbo.ses_sesion (sesion_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ses_disciplina_item
            FOREIGN KEY (disciplina_item_id, disciplina_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ses_disciplina_catalogo CHECK (disciplina_catalogo = N'DISCIPLINA')
    );

    CREATE TABLE dbo.ses_situacion
    (
        situacion_id bigint IDENTITY(1, 1) NOT NULL,
        sesion_id bigint NOT NULL,
        referencia_id bigint NULL,
        caso_id bigint NULL,
        CONSTRAINT PK_ses_situacion PRIMARY KEY CLUSTERED (situacion_id),
        CONSTRAINT FK_ses_situacion_sesion
            FOREIGN KEY (sesion_id) REFERENCES dbo.ses_sesion (sesion_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ses_situacion_referencia
            FOREIGN KEY (referencia_id) REFERENCES dbo.ref_referencia (referencia_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ses_situacion_ancla CHECK (
            (referencia_id IS NOT NULL AND caso_id IS NULL)
            OR (referencia_id IS NULL AND caso_id IS NOT NULL)
        )
    );

    CREATE UNIQUE INDEX UX_ses_situacion_referencia
        ON dbo.ses_situacion (sesion_id, referencia_id)
        WHERE referencia_id IS NOT NULL;

    CREATE UNIQUE INDEX UX_ses_situacion_caso
        ON dbo.ses_situacion (sesion_id, caso_id)
        WHERE caso_id IS NOT NULL;

    CREATE TABLE dbo.ses_valoracion
    (
        valoracion_id bigint IDENTITY(1, 1) NOT NULL,
        situacion_id bigint NOT NULL,
        caso_id bigint NULL,
        referencia_id bigint NOT NULL,
        instrumento_version_id bigint NOT NULL,
        numero int NOT NULL,
        es_vigente bit NOT NULL,
        matriz_version_id bigint NOT NULL,
        riesgo_codigo nvarchar(20) NOT NULL,
        proteccion_codigo nvarchar(20) NOT NULL,
        prioridad_codigo nvarchar(20) NOT NULL,
        responsable_usuario nvarchar(128) NOT NULL,
        fecha_valoracion date NOT NULL,
        confirmada_en datetime2(0) NOT NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_ses_valoracion PRIMARY KEY CLUSTERED (valoracion_id),
        CONSTRAINT UQ_ses_valoracion_id_instrumento
            UNIQUE (valoracion_id, instrumento_version_id),
        CONSTRAINT FK_ses_valoracion_situacion
            FOREIGN KEY (situacion_id) REFERENCES dbo.ses_situacion (situacion_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ses_valoracion_referencia
            FOREIGN KEY (referencia_id) REFERENCES dbo.ref_referencia (referencia_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ses_valoracion_instrumento
            FOREIGN KEY (instrumento_version_id)
            REFERENCES dbo.cat_instrumento_version (instrumento_version_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ses_valoracion_matriz
            FOREIGN KEY (matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo)
            REFERENCES dbo.cat_matriz_prioridad (matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ses_valoracion_numero CHECK (numero >= 1),
        CONSTRAINT CK_ses_valoracion_responsable CHECK (LEN(LTRIM(RTRIM(responsable_usuario))) > 0)
    );

    CREATE UNIQUE INDEX UX_ses_valoracion_numero_referencia
        ON dbo.ses_valoracion (referencia_id, numero)
        WHERE caso_id IS NULL;

    CREATE UNIQUE INDEX UX_ses_valoracion_numero_caso
        ON dbo.ses_valoracion (caso_id, numero)
        WHERE caso_id IS NOT NULL;

    CREATE UNIQUE INDEX UX_ses_valoracion_vigente_caso
        ON dbo.ses_valoracion (caso_id)
        WHERE es_vigente = 1 AND caso_id IS NOT NULL;

    CREATE UNIQUE INDEX UX_ses_valoracion_vigente_referencia
        ON dbo.ses_valoracion (referencia_id)
        WHERE es_vigente = 1 AND caso_id IS NULL;

    CREATE TABLE dbo.ses_valoracion_categoria
    (
        valoracion_id bigint NOT NULL,
        categoria_id bigint NOT NULL,
        respuesta nvarchar(20) NOT NULL,
        instrumento_version_id bigint NOT NULL,
        CONSTRAINT PK_ses_valoracion_categoria PRIMARY KEY CLUSTERED (valoracion_id, categoria_id),
        CONSTRAINT UQ_ses_valoracion_categoria_respuesta
            UNIQUE (valoracion_id, categoria_id, respuesta),
        CONSTRAINT FK_ses_valoracion_categoria_valoracion
            FOREIGN KEY (valoracion_id, instrumento_version_id)
            REFERENCES dbo.ses_valoracion (valoracion_id, instrumento_version_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ses_valoracion_categoria_categoria
            FOREIGN KEY (categoria_id, instrumento_version_id)
            REFERENCES dbo.cat_instrumento_categoria (categoria_id, instrumento_version_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ses_valoracion_categoria_respuesta CHECK (respuesta IN (N'NINGUNO', N'FACTORES'))
    );

    CREATE TABLE dbo.ses_valoracion_factor
    (
        valoracion_factor_id bigint IDENTITY(1, 1) NOT NULL,
        valoracion_id bigint NOT NULL,
        categoria_id bigint NOT NULL,
        factor_id bigint NOT NULL,
        especificacion nvarchar(1000) NULL,
        respuesta_enlace nvarchar(20) NOT NULL
            CONSTRAINT DF_ses_valoracion_factor_respuesta DEFAULT (N'FACTORES'),
        CONSTRAINT PK_ses_valoracion_factor PRIMARY KEY CLUSTERED (valoracion_factor_id),
        CONSTRAINT UQ_ses_valoracion_factor UNIQUE (valoracion_id, factor_id),
        CONSTRAINT FK_ses_valoracion_factor_respuesta
            FOREIGN KEY (valoracion_id, categoria_id, respuesta_enlace)
            REFERENCES dbo.ses_valoracion_categoria (valoracion_id, categoria_id, respuesta)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ses_valoracion_factor_factor
            FOREIGN KEY (factor_id, categoria_id)
            REFERENCES dbo.cat_instrumento_factor (factor_id, categoria_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ses_valoracion_factor_respuesta CHECK (respuesta_enlace = N'FACTORES')
    );

    CREATE TABLE dbo.ses_resolucion
    (
        resolucion_id bigint IDENTITY(1, 1) NOT NULL,
        referencia_id bigint NOT NULL,
        sesion_id bigint NOT NULL,
        valoracion_id bigint NOT NULL,
        decision nvarchar(20) NOT NULL,
        justificacion nvarchar(2000) NULL,
        responsable_usuario nvarchar(128) NOT NULL,
        fecha_decision date NOT NULL,
        registrada_en datetime2(0) NOT NULL,
        CONSTRAINT PK_ses_resolucion PRIMARY KEY CLUSTERED (resolucion_id),
        CONSTRAINT UQ_ses_resolucion_referencia UNIQUE (referencia_id),
        CONSTRAINT FK_ses_resolucion_referencia
            FOREIGN KEY (referencia_id) REFERENCES dbo.ref_referencia (referencia_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ses_resolucion_sesion
            FOREIGN KEY (sesion_id) REFERENCES dbo.ses_sesion (sesion_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ses_resolucion_valoracion
            FOREIGN KEY (valoracion_id) REFERENCES dbo.ses_valoracion (valoracion_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ses_resolucion_decision CHECK (decision IN (N'REQUIERE_AI', N'NO_REQUIERE_AI')),
        CONSTRAINT CK_ses_resolucion_justificacion CHECK (
            decision = N'REQUIERE_AI'
            OR (
                justificacion IS NOT NULL
                AND LEN(LTRIM(RTRIM(justificacion))) > 0
            )
        ),
        CONSTRAINT CK_ses_resolucion_responsable CHECK (LEN(LTRIM(RTRIM(responsable_usuario))) > 0)
    );

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'040_sessions_and_assessments', 40, N'APLICADA', CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
