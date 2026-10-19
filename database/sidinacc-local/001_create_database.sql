/*
  SIDINACC_LOCAL - 001_create_database.sql
  Replica local minima y sintetica de SIDINACC/CAH para desarrollo de SIA-CENCINAI.
  Referencia: docs/architecture/SIDINACC_LOCAL_REPLICA_SPEC.md seccion 5.1.

  - Idempotente: solo crea la base si no existe.
  - Nunca elimina ni modifica una base existente.
  - Sin opciones adicionales a las predeterminadas del servidor.
*/
USE master;
GO

IF DB_ID(N'SIDINACC_LOCAL') IS NULL
BEGIN
    CREATE DATABASE SIDINACC_LOCAL;
    PRINT 'SIDINACC_LOCAL creada.';
END
ELSE
BEGIN
    PRINT 'SIDINACC_LOCAL ya existe; se deja intacta.';
END
GO
