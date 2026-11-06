/*
SIA_CENCINAI — migracion 080_audit_and_security
Borrador, auditoria tecnica y el unico procedimiento que cierra un caso.
Los GRANT quedan en 090, despues de la vista de Establecimiento.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 080.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'080_audit_and_security' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'080_audit_and_security ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.bor_captura
    (
        borrador_id bigint IDENTITY(1, 1) NOT NULL,
        usuario nvarchar(128) NOT NULL,
        ambito_nivel nvarchar(20) NOT NULL,
        oficina_local_id int NULL,
        establecimiento_id int NULL,
        flujo nvarchar(40) NOT NULL,
        clave_negocio nvarchar(80) NULL,
        contenido nvarchar(max) NOT NULL,
        actualizado_en datetime2(0) NOT NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_bor_captura PRIMARY KEY CLUSTERED (borrador_id),
        CONSTRAINT CK_bor_captura_flujo CHECK (
            flujo IN (
                N'REFERENCIA',
                N'SESION',
                N'VALORACION',
                N'ATENCION_INDIVIDUAL',
                N'ATENCION_GRUPAL'
            )
        ),
        CONSTRAINT CK_bor_captura_usuario CHECK (LEN(LTRIM(RTRIM(usuario))) > 0),
        CONSTRAINT CK_bor_captura_ambito CHECK (
            (oficina_local_id IS NULL OR oficina_local_id > 0)
            AND (establecimiento_id IS NULL OR establecimiento_id > 0)
        )
    );

    CREATE INDEX IX_bor_captura_usuario
        ON dbo.bor_captura (usuario, actualizado_en);

    CREATE TABLE dbo.aud_evento
    (
        evento_id bigint IDENTITY(1, 1) NOT NULL,
        ocurrido_en datetime2(0) NOT NULL,
        usuario nvarchar(128) NOT NULL,
        rol nvarchar(40) NOT NULL,
        accion nvarchar(40) NOT NULL,
        entidad nvarchar(80) NOT NULL,
        entidad_id nvarchar(40) NOT NULL,
        ambito nvarchar(200) NOT NULL,
        codigo_cambio nvarchar(80) NOT NULL,
        CONSTRAINT PK_aud_evento PRIMARY KEY CLUSTERED (evento_id),
        CONSTRAINT CK_aud_evento_textos CHECK (
            LEN(LTRIM(RTRIM(usuario))) > 0
            AND LEN(LTRIM(RTRIM(rol))) > 0
            AND LEN(LTRIM(RTRIM(accion))) > 0
            AND LEN(LTRIM(RTRIM(entidad))) > 0
            AND LEN(LTRIM(RTRIM(entidad_id))) > 0
            AND LEN(LTRIM(RTRIM(codigo_cambio))) > 0
        )
    );

    CREATE INDEX IX_aud_evento_entidad
        ON dbo.aud_evento (entidad, entidad_id, ocurrido_en);

    CREATE INDEX IX_aud_evento_usuario
        ON dbo.aud_evento (usuario, ocurrido_en);

    CREATE TABLE dbo.aud_migracion_lote
    (
        lote_id bigint IDENTITY(1, 1) NOT NULL,
        fuente nvarchar(200) NOT NULL,
        usuario nvarchar(128) NOT NULL,
        iniciado_en datetime2(0) NOT NULL,
        cerrado_en datetime2(0) NULL,
        filas_aceptadas int NOT NULL,
        filas_rechazadas int NOT NULL,
        CONSTRAINT PK_aud_migracion_lote PRIMARY KEY CLUSTERED (lote_id),
        CONSTRAINT CK_aud_migracion_lote_conteos CHECK (
            filas_aceptadas >= 0
            AND filas_rechazadas >= 0
            AND LEN(LTRIM(RTRIM(fuente))) > 0
            AND LEN(LTRIM(RTRIM(usuario))) > 0
        )
    );

    CREATE TABLE dbo.aud_migracion_error
    (
        error_id bigint IDENTITY(1, 1) NOT NULL,
        lote_id bigint NOT NULL,
        clave_externa nvarchar(80) NOT NULL,
        codigo_error nvarchar(40) NOT NULL,
        CONSTRAINT PK_aud_migracion_error PRIMARY KEY CLUSTERED (error_id),
        CONSTRAINT FK_aud_migracion_error_lote
            FOREIGN KEY (lote_id) REFERENCES dbo.aud_migracion_lote (lote_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_aud_migracion_error_textos CHECK (
            LEN(LTRIM(RTRIM(clave_externa))) > 0
            AND LEN(LTRIM(RTRIM(codigo_error))) > 0
        )
    );

    DECLARE @definicion nvarchar(max) = N'
CREATE OR ALTER PROCEDURE ops.cerrar_caso
    @caso_id bigint,
    @per_id_persona nvarchar(20),
    @motivo_item_id bigint,
    @explicacion nvarchar(2000),
    @fecha_cierre date,
    @responsable_usuario nvarchar(128),
    @usuario nvarchar(128),
    @ocurrido_en datetime2(0),
    @destino_establecimiento_id int = NULL,
    @destino_oficina_local_id int = NULL,
    @destino_region_id int = NULL,
    @destino_nombre nvarchar(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @caso_id IS NULL
        OR @per_id_persona IS NULL
        OR @motivo_item_id IS NULL
        OR @fecha_cierre IS NULL
        OR @responsable_usuario IS NULL
        OR @usuario IS NULL
        OR @ocurrido_en IS NULL
        THROW 52100, N''Faltan datos obligatorios del cierre.'', 1;

    DECLARE @iniciada bit = 0;
    IF @@TRANCOUNT = 0
    BEGIN
        SET @iniciada = 1;
        BEGIN TRANSACTION;
    END

    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.vinculo_persona WITH (UPDLOCK, HOLDLOCK)
            WHERE per_id_persona = @per_id_persona
        )
            THROW 52101, N''No se encontro el vinculo de la persona.'', 1;

        DECLARE @estado nvarchar(20);
        DECLARE @cierre bigint;

        SELECT
            @estado = estado,
            @cierre = cierre_caso_id
        FROM dbo.caso_ai WITH (UPDLOCK, HOLDLOCK)
        WHERE caso_id = @caso_id
          AND per_id_persona = @per_id_persona;

        IF @estado IS NULL
            THROW 52102, N''No se encontro el caso indicado.'', 1;

        IF @estado <> N''ACTIVO'' OR @cierre IS NOT NULL
            THROW 52103, N''El caso ya no esta activo.'', 1;

        DECLARE @codigo nvarchar(80);
        DECLARE @requiere bit;
        DECLARE @catalogo nvarchar(40);

        SELECT
            @codigo = codigo,
            @requiere = requiere_texto,
            @catalogo = codigo_catalogo
        FROM dbo.cat_item
        WHERE cat_item_id = @motivo_item_id;

        IF @catalogo IS NULL OR @catalogo <> N''MOTIVO_CIERRE''
            THROW 52104, N''El motivo no pertenece al catalogo de cierre.'', 1;

        INSERT INTO dbo.caso_estado_historial (
            caso_id, estado, ocurrido_en, usuario, motivo_item_id, motivo_catalogo
        )
        VALUES (
            @caso_id, N''CERRADO'', @ocurrido_en, @usuario, @motivo_item_id, N''MOTIVO_CIERRE''
        );

        DECLARE @historial_id bigint = CONVERT(bigint, SCOPE_IDENTITY());

        INSERT INTO dbo.caso_cierre (
            caso_id,
            motivo_item_id,
            motivo_catalogo,
            motivo_codigo,
            motivo_requiere_texto,
            explicacion,
            fecha_cierre,
            responsable_usuario,
            registrado_en,
            historial_id,
            historial_estado,
            destino_establecimiento_id,
            destino_oficina_local_id,
            destino_region_id,
            destino_nombre
        )
        VALUES (
            @caso_id,
            @motivo_item_id,
            N''MOTIVO_CIERRE'',
            @codigo,
            @requiere,
            @explicacion,
            @fecha_cierre,
            @responsable_usuario,
            @ocurrido_en,
            @historial_id,
            N''CERRADO'',
            @destino_establecimiento_id,
            @destino_oficina_local_id,
            @destino_region_id,
            @destino_nombre
        );

        UPDATE dbo.caso_ai
        SET estado = N''CERRADO'',
            cierre_caso_id = caso_id
        WHERE caso_id = @caso_id
          AND per_id_persona = @per_id_persona
          AND estado = N''ACTIVO''
          AND cierre_caso_id IS NULL;

        IF @@ROWCOUNT <> 1
            THROW 52105, N''El caso ya no esta activo.'', 1;

        IF @iniciada = 1
            COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @iniciada = 1 AND @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
';

    EXEC sys.sp_executesql @definicion;

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'080_audit_and_security', 80, N'APLICADA', CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
