/*
SIA_CENCINAI — migracion 050_cases_and_plans
Caso, historial, cierre y plan versionado.
Las FK de regreso (valoracion vigente, plan vigente, cierre y situacion/valoracion
hacia el caso) se crean en 090, cuando los dos extremos ya existen.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 050.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'050_cases_and_plans' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'050_cases_and_plans ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.caso_ai
    (
        caso_id bigint IDENTITY(1, 1) NOT NULL,
        per_id_persona nvarchar(20) NOT NULL,
        referencia_id bigint NOT NULL,
        estado nvarchar(20) NOT NULL,
        fecha_apertura date NOT NULL,
        abierto_en datetime2(0) NOT NULL,
        abierto_por nvarchar(128) NOT NULL,
        establecimiento_id int NOT NULL,
        oficina_local_id int NOT NULL,
        region_id int NOT NULL,
        consecutivo_origen nvarchar(80) NOT NULL,
        valoracion_vigente_id bigint NOT NULL,
        plan_vigente_id bigint NULL,
        cierre_caso_id bigint NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_caso_ai PRIMARY KEY CLUSTERED (caso_id),
        CONSTRAINT UQ_caso_ai_referencia UNIQUE (referencia_id),
        CONSTRAINT UQ_caso_ai_caso_persona UNIQUE (caso_id, per_id_persona),
        CONSTRAINT FK_caso_ai_vinculo
            FOREIGN KEY (per_id_persona) REFERENCES dbo.vinculo_persona (per_id_persona)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_caso_ai_referencia
            FOREIGN KEY (referencia_id) REFERENCES dbo.ref_referencia (referencia_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_caso_ai_estado_cierre CHECK (
            (estado = N'ACTIVO' AND cierre_caso_id IS NULL)
            OR (estado = N'CERRADO' AND cierre_caso_id = caso_id)
        ),
        CONSTRAINT CK_caso_ai_estado CHECK (estado IN (N'ACTIVO', N'CERRADO')),
        CONSTRAINT CK_caso_ai_ambito CHECK (
            establecimiento_id > 0
            AND oficina_local_id > 0
            AND region_id > 0
        ),
        CONSTRAINT CK_caso_ai_abierto_por CHECK (LEN(LTRIM(RTRIM(abierto_por))) > 0),
        CONSTRAINT CK_caso_ai_consecutivo CHECK (LEN(LTRIM(RTRIM(consecutivo_origen))) > 0)
    );

    CREATE UNIQUE INDEX UX_caso_activo
        ON dbo.caso_ai (per_id_persona)
        WHERE estado = N'ACTIVO';

    CREATE INDEX IX_caso_ai_oficina_estado
        ON dbo.caso_ai (oficina_local_id, estado)
        INCLUDE (valoracion_vigente_id);

    CREATE INDEX IX_caso_ai_region_estado
        ON dbo.caso_ai (region_id, estado)
        INCLUDE (valoracion_vigente_id);

    CREATE INDEX IX_caso_ai_establecimiento_estado
        ON dbo.caso_ai (establecimiento_id, estado)
        INCLUDE (valoracion_vigente_id);

    CREATE TABLE dbo.caso_estado_historial
    (
        historial_id bigint IDENTITY(1, 1) NOT NULL,
        caso_id bigint NOT NULL,
        estado nvarchar(20) NOT NULL,
        ocurrido_en datetime2(0) NOT NULL,
        usuario nvarchar(128) NOT NULL,
        motivo_item_id bigint NULL,
        motivo_catalogo nvarchar(40) NULL,
        CONSTRAINT PK_caso_estado_historial PRIMARY KEY CLUSTERED (historial_id),
        CONSTRAINT UQ_caso_estado_historial_cierre
            UNIQUE (caso_id, historial_id, estado),
        CONSTRAINT FK_caso_estado_historial_caso
            FOREIGN KEY (caso_id) REFERENCES dbo.caso_ai (caso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_caso_estado_historial_motivo
            FOREIGN KEY (motivo_item_id, motivo_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_caso_estado_historial_estado CHECK (estado IN (N'ACTIVO', N'CERRADO')),
        CONSTRAINT CK_caso_estado_historial_motivo CHECK (
            (motivo_item_id IS NULL AND motivo_catalogo IS NULL)
            OR (motivo_item_id IS NOT NULL AND motivo_catalogo = N'MOTIVO_CIERRE')
        ),
        CONSTRAINT CK_caso_estado_historial_usuario CHECK (LEN(LTRIM(RTRIM(usuario))) > 0)
    );

    CREATE TABLE dbo.caso_cierre
    (
        caso_id bigint NOT NULL,
        motivo_item_id bigint NOT NULL,
        motivo_catalogo nvarchar(40) NOT NULL,
        motivo_codigo nvarchar(80) NOT NULL,
        motivo_requiere_texto bit NOT NULL,
        explicacion nvarchar(2000) NULL,
        fecha_cierre date NOT NULL,
        responsable_usuario nvarchar(128) NOT NULL,
        registrado_en datetime2(0) NOT NULL,
        historial_id bigint NOT NULL,
        historial_estado nvarchar(20) NOT NULL,
        destino_establecimiento_id int NULL,
        destino_oficina_local_id int NULL,
        destino_region_id int NULL,
        destino_nombre nvarchar(200) NULL,
        CONSTRAINT PK_caso_cierre PRIMARY KEY CLUSTERED (caso_id),
        CONSTRAINT FK_caso_cierre_caso
            FOREIGN KEY (caso_id) REFERENCES dbo.caso_ai (caso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_caso_cierre_motivo
            FOREIGN KEY (motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo, codigo, requiere_texto)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_caso_cierre_historial
            FOREIGN KEY (caso_id, historial_id, historial_estado)
            REFERENCES dbo.caso_estado_historial (caso_id, historial_id, estado)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_caso_cierre_catalogo CHECK (motivo_catalogo = N'MOTIVO_CIERRE'),
        CONSTRAINT CK_caso_cierre_historial_estado CHECK (historial_estado = N'CERRADO'),
        CONSTRAINT CK_caso_cierre_explicacion CHECK (
            motivo_requiere_texto = 0
            OR (
                explicacion IS NOT NULL
                AND LEN(LTRIM(RTRIM(explicacion))) > 0
            )
        ),
        CONSTRAINT CK_caso_cierre_destino CHECK (
            motivo_codigo = N'TRASLADO'
            OR (
                destino_establecimiento_id IS NULL
                AND destino_oficina_local_id IS NULL
                AND destino_region_id IS NULL
                AND destino_nombre IS NULL
            )
        ),
        CONSTRAINT CK_caso_cierre_destino_parcial CHECK (
            (destino_establecimiento_id IS NULL OR destino_establecimiento_id > 0)
            AND (destino_oficina_local_id IS NULL OR destino_oficina_local_id > 0)
            AND (destino_region_id IS NULL OR destino_region_id > 0)
        ),
        CONSTRAINT CK_caso_cierre_responsable CHECK (LEN(LTRIM(RTRIM(responsable_usuario))) > 0)
    );

    CREATE INDEX IX_caso_cierre_motivo_fecha
        ON dbo.caso_cierre (motivo_item_id, fecha_cierre);

    CREATE TABLE dbo.caso_plan
    (
        plan_id bigint IDENTITY(1, 1) NOT NULL,
        caso_id bigint NOT NULL,
        numero_version int NOT NULL,
        es_vigente bit NOT NULL,
        frecuencia_item_id bigint NOT NULL,
        frecuencia_catalogo nvarchar(40) NOT NULL,
        responsable_usuario nvarchar(128) NOT NULL,
        fecha_plan date NOT NULL,
        registrado_en datetime2(0) NOT NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_caso_plan PRIMARY KEY CLUSTERED (plan_id),
        CONSTRAINT UQ_caso_plan_version UNIQUE (caso_id, numero_version),
        CONSTRAINT UQ_caso_plan_caso_plan UNIQUE (caso_id, plan_id),
        CONSTRAINT FK_caso_plan_caso
            FOREIGN KEY (caso_id) REFERENCES dbo.caso_ai (caso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_caso_plan_frecuencia
            FOREIGN KEY (frecuencia_item_id, frecuencia_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_caso_plan_version CHECK (numero_version >= 1),
        CONSTRAINT CK_caso_plan_frecuencia_catalogo CHECK (frecuencia_catalogo = N'FRECUENCIA'),
        CONSTRAINT CK_caso_plan_responsable CHECK (LEN(LTRIM(RTRIM(responsable_usuario))) > 0)
    );

    CREATE UNIQUE INDEX UX_caso_plan_vigente
        ON dbo.caso_plan (caso_id)
        WHERE es_vigente = 1;

    CREATE TABLE dbo.caso_plan_proposito
    (
        proposito_id bigint IDENTITY(1, 1) NOT NULL,
        plan_id bigint NOT NULL,
        orden int NOT NULL,
        texto nvarchar(1000) NOT NULL,
        CONSTRAINT PK_caso_plan_proposito PRIMARY KEY CLUSTERED (proposito_id),
        CONSTRAINT UQ_caso_plan_proposito_orden UNIQUE (plan_id, orden),
        CONSTRAINT FK_caso_plan_proposito_plan
            FOREIGN KEY (plan_id) REFERENCES dbo.caso_plan (plan_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_caso_plan_proposito_orden CHECK (orden >= 1),
        CONSTRAINT CK_caso_plan_proposito_texto CHECK (LEN(LTRIM(RTRIM(texto))) > 0)
    );

    CREATE TABLE dbo.caso_plan_estrategia
    (
        plan_id bigint NOT NULL,
        estrategia_item_id bigint NOT NULL,
        estrategia_catalogo nvarchar(40) NOT NULL,
        CONSTRAINT PK_caso_plan_estrategia PRIMARY KEY CLUSTERED (plan_id, estrategia_item_id),
        CONSTRAINT FK_caso_plan_estrategia_plan
            FOREIGN KEY (plan_id) REFERENCES dbo.caso_plan (plan_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_caso_plan_estrategia_item
            FOREIGN KEY (estrategia_item_id, estrategia_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_caso_plan_estrategia_catalogo CHECK (estrategia_catalogo = N'ESTRATEGIA')
    );

    CREATE TABLE dbo.caso_plan_disciplina
    (
        plan_id bigint NOT NULL,
        disciplina_item_id bigint NOT NULL,
        disciplina_catalogo nvarchar(40) NOT NULL,
        CONSTRAINT PK_caso_plan_disciplina PRIMARY KEY CLUSTERED (plan_id, disciplina_item_id),
        CONSTRAINT FK_caso_plan_disciplina_plan
            FOREIGN KEY (plan_id) REFERENCES dbo.caso_plan (plan_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_caso_plan_disciplina_item
            FOREIGN KEY (disciplina_item_id, disciplina_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_caso_plan_disciplina_catalogo CHECK (disciplina_catalogo = N'DISCIPLINA')
    );

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'050_cases_and_plans', 50, N'APLICADA', CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
