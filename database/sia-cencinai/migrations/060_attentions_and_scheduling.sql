/*
SIA_CENCINAI — migracion 060_attentions_and_scheduling
Atencion individual, atencion grupal y programacion.
La FK compuesta (caso_id, per_id_persona) impide cruzar la persona de otro caso.
caso_id nulo en grupal y programacion no dispara esa FK (MATCH SIMPLE).
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 060.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'060_attentions_and_scheduling' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'060_attentions_and_scheduling ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.ate_individual
    (
        atencion_individual_id bigint IDENTITY(1, 1) NOT NULL,
        caso_id bigint NOT NULL,
        per_id_persona nvarchar(20) NOT NULL,
        fecha_atencion date NOT NULL,
        disciplina_item_id bigint NOT NULL,
        disciplina_catalogo nvarchar(40) NOT NULL,
        estrategia_item_id bigint NOT NULL,
        estrategia_catalogo nvarchar(40) NOT NULL,
        acciones nvarchar(2000) NOT NULL,
        recomendaciones nvarchar(2000) NOT NULL,
        profesional_usuario nvarchar(128) NOT NULL,
        proxima_accion nvarchar(500) NULL,
        fecha_proxima date NULL,
        digitador_usuario nvarchar(128) NOT NULL,
        digitada_en datetime2(0) NOT NULL,
        CONSTRAINT PK_ate_individual PRIMARY KEY CLUSTERED (atencion_individual_id),
        CONSTRAINT FK_ate_individual_caso
            FOREIGN KEY (caso_id, per_id_persona)
            REFERENCES dbo.caso_ai (caso_id, per_id_persona)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ate_individual_disciplina
            FOREIGN KEY (disciplina_item_id, disciplina_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ate_individual_estrategia
            FOREIGN KEY (estrategia_item_id, estrategia_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ate_individual_disciplina_catalogo CHECK (disciplina_catalogo = N'DISCIPLINA'),
        CONSTRAINT CK_ate_individual_estrategia_catalogo CHECK (estrategia_catalogo = N'ESTRATEGIA'),
        CONSTRAINT CK_ate_individual_textos CHECK (
            LEN(LTRIM(RTRIM(acciones))) > 0
            AND LEN(LTRIM(RTRIM(recomendaciones))) > 0
            AND LEN(LTRIM(RTRIM(profesional_usuario))) > 0
            AND LEN(LTRIM(RTRIM(digitador_usuario))) > 0
        ),
        CONSTRAINT CK_ate_individual_proxima CHECK (
            fecha_proxima IS NULL
            OR (
                proxima_accion IS NOT NULL
                AND LEN(LTRIM(RTRIM(proxima_accion))) > 0
            )
        )
    );

    CREATE INDEX IX_ate_individual_caso_fecha
        ON dbo.ate_individual (caso_id, fecha_atencion);

    CREATE INDEX IX_ate_individual_fecha_caso
        ON dbo.ate_individual (fecha_atencion, caso_id);

    CREATE TABLE dbo.ate_grupal
    (
        atencion_grupal_id bigint IDENTITY(1, 1) NOT NULL,
        oficina_local_id int NOT NULL,
        establecimiento_id int NULL,
        fecha_atencion date NOT NULL,
        tipo_item_id bigint NOT NULL,
        tipo_catalogo nvarchar(40) NOT NULL,
        tema nvarchar(500) NOT NULL,
        lugar nvarchar(200) NULL,
        acciones nvarchar(2000) NOT NULL,
        recomendaciones nvarchar(2000) NOT NULL,
        digitador_usuario nvarchar(128) NOT NULL,
        digitada_en datetime2(0) NOT NULL,
        CONSTRAINT PK_ate_grupal PRIMARY KEY CLUSTERED (atencion_grupal_id),
        CONSTRAINT FK_ate_grupal_tipo
            FOREIGN KEY (tipo_item_id, tipo_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ate_grupal_tipo_catalogo CHECK (tipo_catalogo = N'TIPO_ATENCION'),
        CONSTRAINT CK_ate_grupal_ambito CHECK (
            oficina_local_id > 0
            AND (establecimiento_id IS NULL OR establecimiento_id > 0)
        ),
        CONSTRAINT CK_ate_grupal_textos CHECK (
            LEN(LTRIM(RTRIM(tema))) > 0
            AND LEN(LTRIM(RTRIM(acciones))) > 0
            AND LEN(LTRIM(RTRIM(recomendaciones))) > 0
            AND LEN(LTRIM(RTRIM(digitador_usuario))) > 0
        )
    );

    CREATE INDEX IX_ate_grupal_fecha_oficina
        ON dbo.ate_grupal (fecha_atencion, oficina_local_id);

    CREATE TABLE dbo.ate_grupal_disciplina
    (
        atencion_grupal_id bigint NOT NULL,
        disciplina_item_id bigint NOT NULL,
        disciplina_catalogo nvarchar(40) NOT NULL,
        CONSTRAINT PK_ate_grupal_disciplina PRIMARY KEY CLUSTERED (atencion_grupal_id, disciplina_item_id),
        CONSTRAINT FK_ate_grupal_disciplina_grupal
            FOREIGN KEY (atencion_grupal_id) REFERENCES dbo.ate_grupal (atencion_grupal_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ate_grupal_disciplina_item
            FOREIGN KEY (disciplina_item_id, disciplina_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ate_grupal_disciplina_catalogo CHECK (disciplina_catalogo = N'DISCIPLINA')
    );

    CREATE TABLE dbo.ate_grupal_profesional
    (
        profesional_id bigint IDENTITY(1, 1) NOT NULL,
        atencion_grupal_id bigint NOT NULL,
        profesional_usuario nvarchar(128) NOT NULL,
        CONSTRAINT PK_ate_grupal_profesional PRIMARY KEY CLUSTERED (profesional_id),
        CONSTRAINT UQ_ate_grupal_profesional UNIQUE (atencion_grupal_id, profesional_usuario),
        CONSTRAINT FK_ate_grupal_profesional_grupal
            FOREIGN KEY (atencion_grupal_id) REFERENCES dbo.ate_grupal (atencion_grupal_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ate_grupal_profesional_usuario CHECK (LEN(LTRIM(RTRIM(profesional_usuario))) > 0)
    );

    CREATE TABLE dbo.ate_grupal_participante
    (
        participante_id bigint IDENTITY(1, 1) NOT NULL,
        atencion_grupal_id bigint NOT NULL,
        per_id_persona nvarchar(20) NOT NULL,
        caso_id bigint NULL,
        asistio bit NULL,
        CONSTRAINT PK_ate_grupal_participante PRIMARY KEY CLUSTERED (participante_id),
        CONSTRAINT UQ_ate_grupal_participante UNIQUE (atencion_grupal_id, per_id_persona),
        CONSTRAINT FK_ate_grupal_participante_grupal
            FOREIGN KEY (atencion_grupal_id) REFERENCES dbo.ate_grupal (atencion_grupal_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ate_grupal_participante_vinculo
            FOREIGN KEY (per_id_persona) REFERENCES dbo.vinculo_persona (per_id_persona)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ate_grupal_participante_caso
            FOREIGN KEY (caso_id, per_id_persona)
            REFERENCES dbo.caso_ai (caso_id, per_id_persona)
            ON DELETE NO ACTION ON UPDATE NO ACTION
    );

    CREATE INDEX IX_ate_grupal_participante_efectiva
        ON dbo.ate_grupal_participante (caso_id)
        WHERE asistio = 1 AND caso_id IS NOT NULL;

    CREATE TABLE dbo.prog_actividad
    (
        actividad_id bigint IDENTITY(1, 1) NOT NULL,
        oficina_local_id int NOT NULL,
        establecimiento_id int NULL,
        region_id int NOT NULL,
        tipo_item_id bigint NOT NULL,
        tipo_catalogo nvarchar(40) NOT NULL,
        titulo nvarchar(300) NOT NULL,
        fecha_prevista date NOT NULL,
        fecha_vigente date NOT NULL,
        estado nvarchar(20) NOT NULL,
        motivo_vigente nvarchar(500) NULL,
        observaciones nvarchar(1000) NULL,
        creada_en datetime2(0) NOT NULL,
        creada_por nvarchar(128) NOT NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_prog_actividad PRIMARY KEY CLUSTERED (actividad_id),
        CONSTRAINT FK_prog_actividad_tipo
            FOREIGN KEY (tipo_item_id, tipo_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_prog_actividad_tipo_catalogo CHECK (tipo_catalogo = N'TIPO_ACTIVIDAD_PROGRAMADA'),
        CONSTRAINT CK_prog_actividad_estado CHECK (
            estado IN (N'PROGRAMADA', N'REALIZADA', N'REPROGRAMADA', N'CANCELADA')
        ),
        CONSTRAINT CK_prog_actividad_motivo CHECK (
            (
                estado IN (N'REPROGRAMADA', N'CANCELADA')
                AND motivo_vigente IS NOT NULL
                AND LEN(LTRIM(RTRIM(motivo_vigente))) > 0
            )
            OR estado IN (N'PROGRAMADA', N'REALIZADA')
        ),
        CONSTRAINT CK_prog_actividad_ambito CHECK (
            oficina_local_id > 0
            AND region_id > 0
            AND (establecimiento_id IS NULL OR establecimiento_id > 0)
        ),
        CONSTRAINT CK_prog_actividad_textos CHECK (
            LEN(LTRIM(RTRIM(titulo))) > 0
            AND LEN(LTRIM(RTRIM(creada_por))) > 0
        )
    );

    CREATE INDEX IX_prog_actividad_oficina_estado_fecha
        ON dbo.prog_actividad (oficina_local_id, estado, fecha_vigente);

    CREATE TABLE dbo.prog_cambio
    (
        cambio_id bigint IDENTITY(1, 1) NOT NULL,
        actividad_id bigint NOT NULL,
        numero int NOT NULL,
        estado_anterior nvarchar(20) NULL,
        estado_nuevo nvarchar(20) NOT NULL,
        fecha_anterior date NULL,
        fecha_nueva date NULL,
        motivo nvarchar(500) NULL,
        usuario nvarchar(128) NOT NULL,
        ocurrido_en datetime2(0) NOT NULL,
        CONSTRAINT PK_prog_cambio PRIMARY KEY CLUSTERED (cambio_id),
        CONSTRAINT UQ_prog_cambio_numero UNIQUE (actividad_id, numero),
        CONSTRAINT FK_prog_cambio_actividad
            FOREIGN KEY (actividad_id) REFERENCES dbo.prog_actividad (actividad_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_prog_cambio_numero CHECK (numero >= 1),
        CONSTRAINT CK_prog_cambio_estado_nuevo CHECK (
            estado_nuevo IN (N'PROGRAMADA', N'REALIZADA', N'REPROGRAMADA', N'CANCELADA')
        ),
        CONSTRAINT CK_prog_cambio_estado_anterior CHECK (
            estado_anterior IS NULL
            OR estado_anterior IN (N'PROGRAMADA', N'REALIZADA', N'REPROGRAMADA', N'CANCELADA')
        ),
        CONSTRAINT CK_prog_cambio_usuario CHECK (LEN(LTRIM(RTRIM(usuario))) > 0)
    );

    CREATE TABLE dbo.prog_persona
    (
        actividad_id bigint NOT NULL,
        per_id_persona nvarchar(20) NOT NULL,
        caso_id bigint NULL,
        CONSTRAINT PK_prog_persona PRIMARY KEY CLUSTERED (actividad_id, per_id_persona),
        CONSTRAINT FK_prog_persona_actividad
            FOREIGN KEY (actividad_id) REFERENCES dbo.prog_actividad (actividad_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_prog_persona_vinculo
            FOREIGN KEY (per_id_persona) REFERENCES dbo.vinculo_persona (per_id_persona)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_prog_persona_caso
            FOREIGN KEY (caso_id, per_id_persona)
            REFERENCES dbo.caso_ai (caso_id, per_id_persona)
            ON DELETE NO ACTION ON UPDATE NO ACTION
    );

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'060_attentions_and_scheduling', 60, N'APLICADA', CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
