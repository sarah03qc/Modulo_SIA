/*
SIA_CENCINAI — script pendiente 101_instrumento_valoracion_v2

Responsable: Sarah Priscilla Quesada Chaves.
Fecha del script: 2026-11-17. No es un acto institucional de vigencia.

NO EJECUTAR como parte de la cadena 001 a 090.
No inserta fila en dbo.schema_migracion.
No reescribe valoraciones, casos ni factores históricos.

Crea la versión 2 del instrumento con las nueve categorías de RF-042 y los
ítems transcritos del prototipo en la guía de fidelidad, sección 5.
La versión 1 sintética deja de estar vigente y conserva sus filas.
Las valoraciones ya emitidas siguen apuntando a su instrumento_version_id.

La activación en la base local de desarrollo no oficializa el instrumento
ante la institución.

Para aplicarlo en una instancia de desarrollo autorizada, cambie @permitir a 1.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @permitir bit = 0;
IF @permitir <> 1
    THROW 51110, N'Script pendiente bloqueado. Cambie @permitir a 1 solo con autorización explícita.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.cat_instrumento_version WHERE numero_version = 2
)
    THROW 51111, N'La versión 2 del instrumento ya existe. No se modifica.', 1;

DECLARE @inst bigint;
DECLARE @factores TABLE (
    eje nvarchar(20) NOT NULL,
    ambito nvarchar(20) NOT NULL,
    codigo nvarchar(80) NOT NULL,
    etiqueta nvarchar(300) NOT NULL,
    es_abierto bit NOT NULL,
    orden int NOT NULL
);

INSERT INTO @factores (eje, ambito, codigo, etiqueta, es_abierto, orden)
VALUES
    (N'PROTECTOR', N'INDIVIDUAL', N'IND_PROT_AUTOESTIMA', N'Autoestima positiva y habilidades sociales', 0, 1),
    (N'PROTECTOR', N'INDIVIDUAL', N'IND_PROT_EMOCIONAL', N'Buen manejo emocional y autocontrol', 0, 2),
    (N'PROTECTOR', N'INDIVIDUAL', N'IND_PROT_VINCULOS', N'Vínculos positivos', 0, 3),
    (N'PROTECTOR', N'INDIVIDUAL', N'IND_PROT_NUTRICION', N'Adecuado estado nutricional', 0, 4),
    (N'PROTECTOR', N'INDIVIDUAL', N'IND_PROT_CONTROLES', N'Controles de salud al día', 0, 5),
    (N'PROTECTOR', N'INDIVIDUAL', N'IND_PROT_DESARROLLO', N'Logros del desarrollo acordes con su condición', 0, 6),
    (N'PROTECTOR', N'INDIVIDUAL', N'IND_PROT_ACTIVIDADES', N'Participación en actividades deportivas o culturales', 0, 7),
    (N'PROTECTOR', N'INDIVIDUAL', N'IND_PROT_RECEPTIVIDAD', N'Apertura y receptividad para recibir ayuda', 0, 8),
    (N'PROTECTOR', N'INDIVIDUAL', N'IND_PROT_OTRO', N'Otro factor protector', 1, 9),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_AUTOESTIMA', N'Baja autoestima', 0, 1),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_IMPULSOS', N'Dificultades en el control de impulsos', 0, 2),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_REZAGO', N'Rezago o riesgo de retraso en el desarrollo', 0, 3),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_MALNUTRICION', N'Condición de malnutrición', 0, 4),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_CRONICA', N'Enfermedad crónica', 0, 5),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_DISCAPACIDAD', N'Discapacidad sin apoyos suficientes', 0, 6),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_LENGUAJE', N'Dificultades de lenguaje', 0, 7),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_VIOLENCIA', N'Exposición a violencia', 0, 8),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_EMOCIONAL', N'Alteraciones emocionales o conductuales', 0, 9),
    (N'RIESGO', N'INDIVIDUAL', N'IND_RIESGO_OTRO', N'Otro factor de riesgo', 1, 10),
    (N'SIGNO_ALERTA', N'INDIVIDUAL', N'IND_ALERTA_EDIN', N'Resultado rojo o amarillo en EDIN II', 0, 1),
    (N'SIGNO_ALERTA', N'INDIVIDUAL', N'IND_ALERTA_EVADE', N'Hallazgo relevante en EVADE', 0, 2),
    (N'SIGNO_ALERTA', N'INDIVIDUAL', N'IND_ALERTA_CONDUCTA', N'Conductas agresivas o regresivas', 0, 3),
    (N'SIGNO_ALERTA', N'INDIVIDUAL', N'IND_ALERTA_EMOCION', N'Cambios emocionales importantes', 0, 4),
    (N'SIGNO_ALERTA', N'INDIVIDUAL', N'IND_ALERTA_DESARROLLO', N'Alteración persistente del desarrollo', 0, 5),
    (N'SIGNO_ALERTA', N'INDIVIDUAL', N'IND_ALERTA_COMUNICACION', N'Dificultades de comunicación o interacción', 0, 6),
    (N'SIGNO_ALERTA', N'INDIVIDUAL', N'IND_ALERTA_APETITO', N'Cambios importantes de apetito o peso', 0, 7),
    (N'SIGNO_ALERTA', N'INDIVIDUAL', N'IND_ALERTA_RECURRENTE', N'Enfermedades recurrentes', 0, 8),
    (N'SIGNO_ALERTA', N'INDIVIDUAL', N'IND_ALERTA_OTRO', N'Otro signo de alerta', 1, 9),
    (N'PROTECTOR', N'HOGAR_FAMILIAR', N'HOG_PROT_CUIDADORAS', N'Figuras cuidadoras positivas', 0, 1),
    (N'PROTECTOR', N'HOGAR_FAMILIAR', N'HOG_PROT_CRIANZA', N'Crianza respetuosa', 0, 2),
    (N'PROTECTOR', N'HOGAR_FAMILIAR', N'HOG_PROT_VINCULOS', N'Vínculos afectivos seguros', 0, 3),
    (N'PROTECTOR', N'HOGAR_FAMILIAR', N'HOG_PROT_REDES', N'Redes de apoyo familiares', 0, 4),
    (N'PROTECTOR', N'HOGAR_FAMILIAR', N'HOG_PROT_PARTICIPACION', N'Participación activa en el proceso de atención', 0, 5),
    (N'PROTECTOR', N'HOGAR_FAMILIAR', N'HOG_PROT_ECONOMIA', N'Seguridad económica básica y empleo', 0, 6),
    (N'PROTECTOR', N'HOGAR_FAMILIAR', N'HOG_PROT_VIVIENDA', N'Acceso a vivienda y servicios básicos', 0, 7),
    (N'PROTECTOR', N'HOGAR_FAMILIAR', N'HOG_PROT_OTRO', N'Otro factor protector', 1, 8),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_SOBRECARGA', N'Sobrecarga de la persona cuidadora', 0, 1),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_CRIANZA', N'Crianza rígida o excesivamente permisiva', 0, 2),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_VINCULOS', N'Ausencia de vínculos afectivos seguros', 0, 3),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_MALTRATO', N'Antecedentes o presencia de maltrato, negligencia o abandono', 0, 4),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_CONFLICTOS', N'Conflictos familiares', 0, 5),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_REDES', N'Ausencia de redes de apoyo', 0, 6),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_VIF', N'Violencia intrafamiliar', 0, 7),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_POBREZA', N'Pobreza o inestabilidad económica', 0, 8),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_HACINAMIENTO', N'Hacinamiento', 0, 9),
    (N'RIESGO', N'HOGAR_FAMILIAR', N'HOG_RIESGO_OTRO', N'Otro factor de riesgo', 1, 10),
    (N'SIGNO_ALERTA', N'HOGAR_FAMILIAR', N'HOG_ALERTA_BASICAS', N'Necesidades básicas insatisfechas', 0, 1),
    (N'SIGNO_ALERTA', N'HOGAR_FAMILIAR', N'HOG_ALERTA_AUSENCIAS', N'Ausencias reiteradas a salud o educación', 0, 2),
    (N'SIGNO_ALERTA', N'HOGAR_FAMILIAR', N'HOG_ALERTA_TENSO', N'Ambiente familiar tenso', 0, 3),
    (N'SIGNO_ALERTA', N'HOGAR_FAMILIAR', N'HOG_ALERTA_VIOLENCIA', N'Gritos, golpes u otras manifestaciones de violencia', 0, 4),
    (N'SIGNO_ALERTA', N'HOGAR_FAMILIAR', N'HOG_ALERTA_SUSTANCIAS', N'Consumo problemático de sustancias', 0, 5),
    (N'SIGNO_ALERTA', N'HOGAR_FAMILIAR', N'HOG_ALERTA_VIVIENDA', N'Vivienda en malas condiciones', 0, 6),
    (N'SIGNO_ALERTA', N'HOGAR_FAMILIAR', N'HOG_ALERTA_OTRO', N'Otro signo de alerta', 1, 7),
    (N'PROTECTOR', N'COMUNITARIO', N'COM_PROT_ENTORNO', N'Entorno comunitario seguro e inclusivo', 0, 1),
    (N'PROTECTOR', N'COMUNITARIO', N'COM_PROT_TRANSPORTE', N'Disponibilidad de transporte público', 0, 2),
    (N'PROTECTOR', N'COMUNITARIO', N'COM_PROT_SERVICIOS', N'Acceso a servicios de educación, salud y cuidado', 0, 3),
    (N'PROTECTOR', N'COMUNITARIO', N'COM_PROT_RECREATIVOS', N'Centros recreativos', 0, 4),
    (N'PROTECTOR', N'COMUNITARIO', N'COM_PROT_INSTITUCIONES', N'Presencia de instituciones sociales y de seguridad', 0, 5),
    (N'PROTECTOR', N'COMUNITARIO', N'COM_PROT_REDES', N'Redes de apoyo comunal', 0, 6),
    (N'PROTECTOR', N'COMUNITARIO', N'COM_PROT_OTRO', N'Otro factor protector', 1, 7),
    (N'RIESGO', N'COMUNITARIO', N'COM_RIESGO_INSEGURIDAD', N'Alta inseguridad ciudadana', 0, 1),
    (N'RIESGO', N'COMUNITARIO', N'COM_RIESGO_TRANSPORTE', N'Dificultad de acceso a transporte público', 0, 2),
    (N'RIESGO', N'COMUNITARIO', N'COM_RIESGO_SERVICIOS', N'Pocos o nulos servicios de educación, salud y cuidado', 0, 3),
    (N'RIESGO', N'COMUNITARIO', N'COM_RIESGO_SANEAMIENTO', N'Acceso limitado a agua potable, electricidad o saneamiento', 0, 4),
    (N'RIESGO', N'COMUNITARIO', N'COM_RIESGO_RECREATIVOS', N'Pocos o nulos centros recreativos', 0, 5),
    (N'RIESGO', N'COMUNITARIO', N'COM_RIESGO_SOCIALES', N'Presencia de riesgos sociales', 0, 6),
    (N'RIESGO', N'COMUNITARIO', N'COM_RIESGO_NATURALES', N'Riesgo por fenómenos naturales', 0, 7),
    (N'RIESGO', N'COMUNITARIO', N'COM_RIESGO_OTRO', N'Otro factor de riesgo', 1, 8),
    (N'SIGNO_ALERTA', N'COMUNITARIO', N'COM_ALERTA_MOVILIDAD', N'Limitación para movilizarse de manera segura', 0, 1),
    (N'SIGNO_ALERTA', N'COMUNITARIO', N'COM_ALERTA_SERVICIOS', N'Poca o nula presencia de servicios esenciales', 0, 2),
    (N'SIGNO_ALERTA', N'COMUNITARIO', N'COM_ALERTA_HIGIENE', N'Problemas graves de higiene o habitabilidad', 0, 3),
    (N'SIGNO_ALERTA', N'COMUNITARIO', N'COM_ALERTA_VIOLENCIA', N'Exposición recurrente a violencia comunitaria', 0, 4),
    (N'SIGNO_ALERTA', N'COMUNITARIO', N'COM_ALERTA_NATURALES', N'Interrupción de servicios por fenómenos naturales', 0, 5),
    (N'SIGNO_ALERTA', N'COMUNITARIO', N'COM_ALERTA_OTRO', N'Otro signo de alerta', 1, 6);

IF (SELECT COUNT(*) FROM @factores) <> 74
    THROW 51112, N'El instrumento transcrito no quedó en 74 factores.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.cat_instrumento_version (numero_version, vigente, vigente_desde)
    VALUES (2, 0, '20261117');
    SET @inst = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.cat_instrumento_categoria (
        instrumento_version_id, eje, ambito, es_requerida, orden
    )
    SELECT @inst, c.eje, c.ambito, 1, c.orden
    FROM (VALUES
        (N'PROTECTOR', N'INDIVIDUAL', 1),
        (N'RIESGO', N'INDIVIDUAL', 2),
        (N'SIGNO_ALERTA', N'INDIVIDUAL', 3),
        (N'PROTECTOR', N'HOGAR_FAMILIAR', 4),
        (N'RIESGO', N'HOGAR_FAMILIAR', 5),
        (N'SIGNO_ALERTA', N'HOGAR_FAMILIAR', 6),
        (N'PROTECTOR', N'COMUNITARIO', 7),
        (N'RIESGO', N'COMUNITARIO', 8),
        (N'SIGNO_ALERTA', N'COMUNITARIO', 9)
    ) AS c (eje, ambito, orden);

    INSERT INTO dbo.cat_instrumento_factor (
        categoria_id, codigo, etiqueta, es_abierto, orden, activo
    )
    SELECT cat.categoria_id, f.codigo, f.etiqueta, f.es_abierto, f.orden, 1
    FROM @factores AS f
    INNER JOIN dbo.cat_instrumento_categoria AS cat
        ON cat.instrumento_version_id = @inst
       AND cat.eje = f.eje
       AND cat.ambito = f.ambito;

    IF (
        SELECT COUNT(*)
        FROM dbo.cat_instrumento_categoria
        WHERE instrumento_version_id = @inst
    ) <> 9
        THROW 51113, N'La versión 2 no quedó con nueve categorías.', 1;

    IF (
        SELECT COUNT(*)
        FROM dbo.cat_instrumento_factor AS f
        INNER JOIN dbo.cat_instrumento_categoria AS c
            ON c.categoria_id = f.categoria_id
        WHERE c.instrumento_version_id = @inst
    ) <> 74
        THROW 51114, N'La versión 2 no quedó con 74 factores.', 1;

    UPDATE dbo.cat_instrumento_version
    SET vigente = 0
    WHERE vigente = 1
      AND instrumento_version_id <> @inst;

    UPDATE dbo.cat_instrumento_version
    SET vigente = 1
    WHERE instrumento_version_id = @inst;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
