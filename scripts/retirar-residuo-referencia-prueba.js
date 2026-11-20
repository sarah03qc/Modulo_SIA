'use strict';

/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-19.
 * Retira solo las referencias sintéticas de una corrida de navegador.
 * No cierra casos y no usa la cuenta de la API, que no tiene DELETE.
 * El principal administrativo queda dentro del contenedor local.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const MARCA = 'Dato sintético de la prueba de navegador.';
const CONTENEDOR = 'sidinacc-local-sql';
const CONSECUTIVO = /^DNCC-[A-Z0-9]+(?:-[A-Z0-9]+)+$/;

function LeerManifiesto(ruta) {
  const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  if (datos.marca !== MARCA) {
    throw new Error('La marca no corresponde a la prueba de navegador.');
  }
  if (!Array.isArray(datos.consecutivos) || datos.consecutivos.length === 0) {
    throw new Error('El manifiesto no indica consecutivos.');
  }
  if (datos.consecutivos.length > 8) {
    throw new Error('El manifiesto supera el límite de la corrida.');
  }
  const unicos = new Set(datos.consecutivos);
  if (unicos.size !== datos.consecutivos.length) {
    throw new Error('El manifiesto repite un consecutivo.');
  }
  for (const consecutivo of datos.consecutivos) {
    if (typeof consecutivo !== 'string' || !CONSECUTIVO.test(consecutivo)) {
      throw new Error('Hay un consecutivo que no pertenece al formato de prueba.');
    }
    if (consecutivo.length > 80) {
      throw new Error('Hay un consecutivo demasiado largo.');
    }
  }
  return datos.consecutivos;
}

function AfirmarEntornoLocal() {
  const publicado = execFileSync('docker', ['port', CONTENEDOR, '1433'], {
    encoding: 'utf8'
  });
  const local = publicado.includes('127.0.0.1:1433')
    || publicado.includes('0.0.0.0:1433')
    || publicado.includes('[::]:1433');
  if (!local) {
    throw new Error('SQL no está publicado en el equipo local de desarrollo.');
  }
}

function Sql(consecutivos) {
  const valores = consecutivos
    .map((consecutivo) => `  (N'${consecutivo}')`)
    .join(',\n');
  return `/*
 * Retiro acotado de una corrida sintética de Referencias.
 * Conserva la auditoría y no toca otras referencias de la misma persona.
 */
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'SIA_CENCINAI'
    THROW 51210, N'La limpieza solo opera sobre SIA_CENCINAI.', 1;

DECLARE @marca nvarchar(200) = N'${MARCA}';
DECLARE @pedido TABLE (consecutivo nvarchar(80) NOT NULL PRIMARY KEY);
INSERT INTO @pedido (consecutivo) VALUES
${valores};

IF EXISTS (
    SELECT 1
    FROM dbo.ref_referencia AS referencia
    INNER JOIN @pedido AS pedido
        ON pedido.consecutivo = referencia.consecutivo
    WHERE referencia.per_id_persona NOT LIKE N'SYN-%'
       OR ISNULL(referencia.informacion_complementaria, N'') <> @marca
)
    THROW 51211, N'Un consecutivo pedido no es residuo exclusivo de la prueba.', 1;

SELECT referencia.referencia_id
INTO #referencia
FROM dbo.ref_referencia AS referencia
INNER JOIN @pedido AS pedido
    ON pedido.consecutivo = referencia.consecutivo
WHERE referencia.per_id_persona LIKE N'SYN-%'
  AND referencia.informacion_complementaria = @marca;

SELECT caso.caso_id
INTO #caso
FROM dbo.caso_ai AS caso
INNER JOIN #referencia AS referencia
    ON referencia.referencia_id = caso.referencia_id;

IF EXISTS (
    SELECT 1 FROM dbo.ate_individual AS atencion
    WHERE atencion.caso_id IN (SELECT caso_id FROM #caso)
    UNION ALL
    SELECT 1 FROM dbo.ate_grupal_participante AS participante
    WHERE participante.caso_id IN (SELECT caso_id FROM #caso)
    UNION ALL
    SELECT 1 FROM dbo.prog_persona AS programada
    WHERE programada.caso_id IN (SELECT caso_id FROM #caso)
    UNION ALL
    SELECT 1 FROM dbo.doc_documento AS documento
    WHERE documento.caso_id IN (SELECT caso_id FROM #caso)
    UNION ALL
    SELECT 1 FROM dbo.doc_coordinacion AS coordinacion
    WHERE coordinacion.caso_id IN (SELECT caso_id FROM #caso)
    UNION ALL
    SELECT 1 FROM dbo.doc_reporte_caso AS reporte
    WHERE reporte.caso_id IN (SELECT caso_id FROM #caso)
    UNION ALL
    SELECT 1 FROM dbo.caso_cierre AS cierre
    WHERE cierre.caso_id IN (SELECT caso_id FROM #caso)
)
    THROW 51212, N'El residuo ya tiene actividad posterior. No se retira.', 1;

SELECT DISTINCT situacion.sesion_id
INTO #sesion
FROM dbo.ses_situacion AS situacion
WHERE situacion.referencia_id IN (SELECT referencia_id FROM #referencia)
   OR situacion.caso_id IN (SELECT caso_id FROM #caso);

IF EXISTS (
    SELECT 1
    FROM dbo.ses_situacion AS ajena
    INNER JOIN #sesion AS sesion
        ON sesion.sesion_id = ajena.sesion_id
    WHERE (ajena.referencia_id IS NULL
           OR ajena.referencia_id NOT IN (SELECT referencia_id FROM #referencia))
      AND (ajena.caso_id IS NULL
           OR ajena.caso_id NOT IN (SELECT caso_id FROM #caso))
)
    THROW 51213, N'La sesión también tiene trabajo ajeno a la prueba.', 1;

DECLARE @referencias int = (SELECT COUNT(*) FROM #referencia);
DECLARE @casos int = (SELECT COUNT(*) FROM #caso);

IF @referencias = 0
BEGIN
    SELECT @referencias AS referencias, @casos AS casos, N'sin-residuo' AS resultado;
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    ALTER TABLE dbo.caso_ai NOCHECK CONSTRAINT FK_caso_ai_valoracion_vigente;
    ALTER TABLE dbo.caso_ai NOCHECK CONSTRAINT FK_caso_ai_plan_vigente;
    ALTER TABLE dbo.caso_ai NOCHECK CONSTRAINT FK_caso_ai_cierre;

    UPDATE dbo.caso_ai
    SET plan_vigente_id = NULL,
        cierre_caso_id = NULL
    WHERE caso_id IN (SELECT caso_id FROM #caso);

    DELETE proposito
    FROM dbo.caso_plan_proposito AS proposito
    INNER JOIN dbo.caso_plan AS plan_atencion
        ON plan_atencion.plan_id = proposito.plan_id
    WHERE plan_atencion.caso_id IN (SELECT caso_id FROM #caso);

    DELETE estrategia
    FROM dbo.caso_plan_estrategia AS estrategia
    INNER JOIN dbo.caso_plan AS plan_atencion
        ON plan_atencion.plan_id = estrategia.plan_id
    WHERE plan_atencion.caso_id IN (SELECT caso_id FROM #caso);

    DELETE disciplina_plan
    FROM dbo.caso_plan_disciplina AS disciplina_plan
    INNER JOIN dbo.caso_plan AS plan_atencion
        ON plan_atencion.plan_id = disciplina_plan.plan_id
    WHERE plan_atencion.caso_id IN (SELECT caso_id FROM #caso);

    DELETE FROM dbo.caso_plan
    WHERE caso_id IN (SELECT caso_id FROM #caso);

    DELETE FROM dbo.caso_estado_historial
    WHERE caso_id IN (SELECT caso_id FROM #caso);

    DELETE FROM dbo.ses_resolucion
    WHERE referencia_id IN (SELECT referencia_id FROM #referencia);

    DELETE factor
    FROM dbo.ses_valoracion_factor AS factor
    WHERE factor.valoracion_id IN (
        SELECT valoracion.valoracion_id
        FROM dbo.ses_valoracion AS valoracion
        WHERE valoracion.referencia_id IN (SELECT referencia_id FROM #referencia)
           OR valoracion.caso_id IN (SELECT caso_id FROM #caso)
    );

    DELETE categoria
    FROM dbo.ses_valoracion_categoria AS categoria
    WHERE categoria.valoracion_id IN (
        SELECT valoracion.valoracion_id
        FROM dbo.ses_valoracion AS valoracion
        WHERE valoracion.referencia_id IN (SELECT referencia_id FROM #referencia)
           OR valoracion.caso_id IN (SELECT caso_id FROM #caso)
    );

    DELETE FROM dbo.ses_valoracion
    WHERE referencia_id IN (SELECT referencia_id FROM #referencia)
       OR caso_id IN (SELECT caso_id FROM #caso);

    DELETE FROM dbo.ses_situacion
    WHERE referencia_id IN (SELECT referencia_id FROM #referencia)
       OR caso_id IN (SELECT caso_id FROM #caso);

    DELETE FROM dbo.ses_disciplina
    WHERE sesion_id IN (SELECT sesion_id FROM #sesion);

    DELETE FROM dbo.ses_sesion
    WHERE sesion_id IN (SELECT sesion_id FROM #sesion);

    UPDATE dbo.ref_posible
    SET estado = N'PENDIENTE',
        referencia_id = NULL
    WHERE referencia_id IN (SELECT referencia_id FROM #referencia);

    DELETE FROM dbo.ref_motivo
    WHERE referencia_id IN (SELECT referencia_id FROM #referencia);

    DELETE FROM dbo.ref_contexto
    WHERE referencia_id IN (SELECT referencia_id FROM #referencia);

    DELETE FROM dbo.ref_impresion
    WHERE referencia_id IN (SELECT referencia_id FROM #referencia);

    DELETE borrador
    FROM dbo.bor_captura AS borrador
    INNER JOIN @pedido AS pedido
        ON borrador.contenido LIKE N'%' + pedido.consecutivo + N'%'
    WHERE borrador.flujo = N'REFERENCIA'
      AND borrador.usuario LIKE N'dev-%'
      AND ISNULL(borrador.clave_negocio, N'') LIKE N'SYN-%';

    DELETE FROM dbo.caso_ai
    WHERE caso_id IN (SELECT caso_id FROM #caso);

    DELETE FROM dbo.ref_referencia
    WHERE referencia_id IN (SELECT referencia_id FROM #referencia);

    ALTER TABLE dbo.caso_ai WITH CHECK CHECK CONSTRAINT FK_caso_ai_valoracion_vigente;
    ALTER TABLE dbo.caso_ai WITH CHECK CHECK CONSTRAINT FK_caso_ai_plan_vigente;
    ALTER TABLE dbo.caso_ai WITH CHECK CHECK CONSTRAINT FK_caso_ai_cierre;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    BEGIN TRY
        ALTER TABLE dbo.caso_ai WITH CHECK CHECK CONSTRAINT FK_caso_ai_valoracion_vigente;
        ALTER TABLE dbo.caso_ai WITH CHECK CHECK CONSTRAINT FK_caso_ai_plan_vigente;
        ALTER TABLE dbo.caso_ai WITH CHECK CHECK CONSTRAINT FK_caso_ai_cierre;
    END TRY
    BEGIN CATCH
    END CATCH;
    THROW;
END CATCH

SELECT
    @referencias AS referencias,
    @casos AS casos,
    N'retirado' AS resultado;
`;
}

function main() {
  const ruta = process.argv[2];
  if (!ruta) {
    throw new Error('Indique el manifiesto de la corrida.');
  }
  const consecutivos = LeerManifiesto(ruta);
  AfirmarEntornoLocal();
  const temporal = path.resolve('.local', 'retirar-residuo-referencia.sql');
  fs.mkdirSync(path.dirname(temporal), { recursive: true });
  fs.writeFileSync(temporal, Sql(consecutivos), 'utf8');
  execFileSync('docker', [
    'cp',
    temporal,
    `${CONTENEDOR}:/tmp/retirar-residuo-referencia.sql`
  ], { stdio: 'pipe' });
  const salida = execFileSync('docker', [
    'exec',
    CONTENEDOR,
    'bash',
    '-lc',
    'SQLCMD=/opt/mssql-tools18/bin/sqlcmd; '
      + '"$SQLCMD" -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -I '
      + '-d SIA_CENCINAI -i /tmp/retirar-residuo-referencia.sql -W'
  ], { encoding: 'utf8' });
  process.stdout.write(salida);
}

try {
  main();
} catch (error) {
  const detalle = error.stderr ? error.stderr.toString() : error.message;
  process.stderr.write(`${detalle}\n`);
  process.exit(1);
}
