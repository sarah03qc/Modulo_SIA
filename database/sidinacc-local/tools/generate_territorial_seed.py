"""
Genera los artefactos territoriales de SIDINACC_LOCAL a partir de las fuentes institucionales:

  Excel oficial  docs/reference/source_docs/Listado-de-establecimientos.xlsx (hoja ESTABL_ACTr)
                 (el path citado en CEN_CINAI_TERRITORIAL_STRUCTURE.md no esta en el repo)
  Referencia     docs/institutional/CEN_CINAI_TERRITORIAL_STRUCTURE.md (seccion 2)
  ESTABL_ACTr es la unica hoja con COD_ESTABLECIMIENTO y COD_OFICINA_LOCAL; ESTABL_ACT
  no se usa para el seed (no tiene codigo ni OL). No hardcodear 639.

Salidas (derivadas; no editar a mano):
  database/sidinacc-local/data/cen_cinai_territorial_catalog.csv
  database/sidinacc-local/030_seed_institutional_structure.sql

Uso (desde la raiz del repositorio):
  python database/sidinacc-local/tools/generate_territorial_seed.py          # regenera
  python database/sidinacc-local/tools/generate_territorial_seed.py --check  # verifica sin escribir

--check falla si los archivos en disco difieren de lo que producen las fuentes o si las
constantes del catalogo en 090_smoke_tests.sql no coinciden.

Requiere: Python 3.10+ y openpyxl. Solo procesa codigos, nombres y jerarquia territorial;
no lee telefonos, direcciones ni otras columnas.
"""
from __future__ import annotations

import csv
import hashlib
import io
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[3]
EXCEL = ROOT / "docs/reference/source_docs/Listado-de-establecimientos.xlsx"
DOC = ROOT / "docs/institutional/CEN_CINAI_TERRITORIAL_STRUCTURE.md"
OUT_DIR = ROOT / "database/sidinacc-local"
CSV_OUT = OUT_DIR / "data/cen_cinai_territorial_catalog.csv"
SQL_OUT = OUT_DIR / "030_seed_institutional_structure.sql"
SMOKE = OUT_DIR / "090_smoke_tests.sql"

SHEET = "ESTABL_ACTr"
SHEET_UNCODED = "ESTABL_ACT"
SOURCE_TAG = "Listado-de-establecimientos.xlsx#ESTABL_ACTr"
STATUS_TO_ACTIVE = {"ACTIVO": 1, "CERRADO": 0, "INACTIVO": 0}
CHUNK = 250


def norm(s: object) -> str:
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().upper()
    return re.sub(r"[^A-Z0-9]", "", s)


def sql_n(s: str) -> str:
    """Literal nvarchar ASCII: los caracteres no ASCII se emiten como NCHAR(n)."""
    parts: list[str] = []
    buf = ""
    for ch in s:
        if ord(ch) < 128:
            buf += "''" if ch == "'" else ch
        else:
            if buf:
                parts.append(f"N'{buf}'")
                buf = ""
            parts.append(f"NCHAR({ord(ch)})")
    if buf or not parts:
        parts.append(f"N'{buf}'")
    return " + ".join(parts)


def read_doc_hierarchy() -> tuple[dict[int, str], dict[int, tuple[int, str]]]:
    regions: dict[int, str] = {}
    offices: dict[int, tuple[int, str]] = {}
    row = re.compile(r"^\|\s*(\d)\s*\|\s*([^|]+?)\s*\|\s*(\d{3})\s*\|\s*([^|]+?)\s*\|\s*$")
    for line in DOC.read_text(encoding="utf-8").splitlines():
        m = row.match(line)
        if not m:
            continue
        rid, rname, olid, olname = int(m[1]), m[2], int(m[3]), m[4]
        if regions.setdefault(rid, rname) != rname:
            raise SystemExit(f"Documento territorial inconsistente para region {rid}")
        if olid in offices:
            raise SystemExit(f"OL duplicada en documento territorial: {olid}")
        offices[olid] = (rid, olname)
    return regions, offices


def read_excel():
    wb = openpyxl.load_workbook(EXCEL, read_only=True, data_only=True)
    ws = wb[SHEET]
    rows = list(ws.iter_rows(values_only=True))
    header = rows[0]
    expected = ("COD_ESTABLECIMIENTO", "NOM_ESTABLECIMIENTO", "COD_OFICINA_LOCAL",
                "NOM_OFICINA_LOCAL", "COD_REGION", "NOMB_REGION")
    if tuple(header[:6]) != expected or header[10] != "DESC_ESTADO":
        raise SystemExit(f"Encabezado inesperado en {SHEET}: {header}")
    data = [r for r in rows[1:] if any(c is not None for c in r)]
    coded = [r for r in data if r[0] is not None]
    legend = [r[1] for r in data if r[0] is None]
    uncoded_sheet = [r for r in wb[SHEET_UNCODED].iter_rows(min_row=3, values_only=True)
                     if any(c is not None for c in r)]
    return data, coded, legend, uncoded_sheet


def build():
    regions, offices = read_doc_hierarchy()
    data, coded, legend, uncoded_sheet = read_excel()
    issues: list[str] = []

    catalog = []
    seen: set[int] = set()
    for r in coded:
        code, name, olid, olname, rid, rname, status = r[0], r[1], r[2], r[3], r[4], r[5], r[10]
        if not isinstance(code, int) or not 1_000_000 <= code <= 9_999_999:
            raise SystemExit(f"Codigo de establecimiento no compatible (7 digitos int): {code!r}")
        if code in seen:
            raise SystemExit(f"Codigo de establecimiento duplicado: {code}")
        seen.add(code)
        if status not in STATUS_TO_ACTIVE:
            raise SystemExit(f"DESC_ESTADO desconocido para {code}: {status!r}")
        confirmed = (isinstance(olid, int) and isinstance(rid, int)
                     and olid in offices and offices[olid][0] == rid and olid // 100 == rid)
        if not confirmed:
            issues.append(f"{code}: OL/Region no verificable ({olid}, {rid})")
        catalog.append({
            "region_id": rid if confirmed else "",
            "region_name": regions[rid] if confirmed else "",
            "office_local_id": olid if confirmed else "",
            "office_local_name": offices[olid][1] if confirmed else "",
            "establishment_id": code,
            "establishment_name": str(name).strip(),
            "source": SOURCE_TAG,
            "validation_status": "CONFIRMED" if confirmed else "NEEDS_VALIDATION",
            "source_status": status,
            "_excel_ol_name": olname,
            "_excel_region_name": rname,
        })
    catalog.sort(key=lambda c: c["establishment_id"])
    return regions, offices, catalog, data, legend, uncoded_sheet, issues


def render_csv(catalog) -> str:
    cols = ["region_id", "region_name", "office_local_id", "office_local_name",
            "establishment_id", "establishment_name", "source", "validation_status", "source_status"]
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=cols, extrasaction="ignore", lineterminator="\n")
    w.writeheader()
    w.writerows(catalog)
    return buf.getvalue()


def render_sql(regions, offices, catalog, excel_sha: str) -> str:
    seeded = [c for c in catalog if c["validation_status"] == "CONFIRMED"]
    n_active = sum(STATUS_TO_ACTIVE[c["source_status"]] for c in seeded)
    out: list[str] = []
    w = out.append
    w("/*")
    w("  SIDINACC_LOCAL - 030_seed_institutional_structure.sql")
    w("  GENERADO por database/sidinacc-local/tools/generate_territorial_seed.py -- NO EDITAR A MANO.")
    w("  Estructura territorial INSTITUCIONAL real de CEN-CINAI (Region -> Oficina Local -> Establecimiento).")
    w("  No contiene personas ni datos personales: solo codigos y nombres institucionales publicos.")
    w("")
    w("  Fuentes:")
    w("    - docs/reference/source_docs/Listado-de-establecimientos.xlsx, hoja ESTABL_ACTr")
    w(f"      SHA-256 {excel_sha}")
    w("      (codigo, nombre, COD_OFICINA_LOCAL, COD_REGION y DESC_ESTADO explicitos por fila)")
    w("    - docs/institutional/CEN_CINAI_TERRITORIAL_STRUCTURE.md seccion 2 (nombres de Region y OL)")
    w("  Artefacto derivado equivalente: data/cen_cinai_territorial_catalog.csv")
    w("")
    w(f"  Contenido: {len(regions)} regiones, {len(offices)} oficinas locales, {len(seeded)} establecimientos")
    w(f"  ({n_active} con DESC_ESTADO = ACTIVO -> EST_inActivo = 1; {len(seeded) - n_active} CERRADO/INACTIVO -> EST_inActivo = 0).")
    w("")
    w("  - Solo inserta filas faltantes (INSERT ... WHERE NOT EXISTS por clave primaria).")
    w("  - Despues de insertar verifica que las filas existentes coincidan con la fuente; si alguna")
    w("    difiere (p. ej. restos del catalogo DEMO anterior) hace ROLLBACK y lanza THROW 50003.")
    w("  - TODO-UTIC: EST_inActivo = 1 se interpreta como 'activo' (consultas de la spec seccion 9).")
    w("*/")
    w("USE SIDINACC_LOCAL;")
    w("GO")
    w("")
    w("IF DB_NAME() <> N'SIDINACC_LOCAL'")
    w("    THROW 50001, 'Este script solo debe ejecutarse sobre SIDINACC_LOCAL.', 1;")
    w("GO")
    w("")
    w("-- Respaldo para SSMS: si la guarda anterior fallo, los lotes siguientes se compilan pero no se ejecutan.")
    w("IF DB_NAME() <> N'SIDINACC_LOCAL'")
    w("    SET NOEXEC ON;")
    w("GO")
    w("")
    w("SET NOCOUNT ON;")
    w("SET XACT_ABORT ON;")
    w("")
    w("IF OBJECT_ID(N'dbo.CAF_CAT_REGION', N'U') IS NULL")
    w("   OR OBJECT_ID(N'dbo.CAF_CAT_OFICINA_LOCAL', N'U') IS NULL")
    w("   OR OBJECT_ID(N'dbo.RCS_ESTABLECIMIENTO', N'U') IS NULL")
    w("BEGIN")
    w("    THROW 50002, 'Faltan tablas de SIDINACC_LOCAL. Ejecute primero 010_schema_core.sql', 1;")
    w("END;")
    w("")
    w("DECLARE @reg TABLE (CAT_idRegion int PRIMARY KEY, REG_nombre nvarchar(200) NOT NULL);")
    w("DECLARE @ofl TABLE (CAT_idOficinaLocal int PRIMARY KEY, CAT_idRegion tinyint NOT NULL, OFL_nombre nvarchar(200) NOT NULL);")
    w("DECLARE @est TABLE (EST_idEstablecimiento int PRIMARY KEY, EST_descripcion nvarchar(250) NOT NULL,")
    w("                    CAT_idOficinaLocal int NOT NULL, EST_inActivo bit NOT NULL);")
    w("")
    w("INSERT INTO @reg (CAT_idRegion, REG_nombre) VALUES")
    rows = [f"    ({rid}, {sql_n(name)})" for rid, name in sorted(regions.items())]
    w(",\n".join(rows) + ";")
    w("")
    w("INSERT INTO @ofl (CAT_idOficinaLocal, CAT_idRegion, OFL_nombre) VALUES")
    rows = [f"    ({olid}, {rid}, {sql_n(name)})" for olid, (rid, name) in sorted(offices.items())]
    w(",\n".join(rows) + ";")
    w("")
    for i in range(0, len(seeded), CHUNK):
        chunk = seeded[i:i + CHUNK]
        w("INSERT INTO @est (EST_idEstablecimiento, EST_descripcion, CAT_idOficinaLocal, EST_inActivo) VALUES")
        rows = []
        for c in chunk:
            act = STATUS_TO_ACTIVE[c["source_status"]]
            note = "" if act else f"  -- {c['source_status']}"
            rows.append(f"    ({c['establishment_id']}, {sql_n(c['establishment_name'])}, "
                        f"{c['office_local_id']}, {act}){note}")
        # El comentario va despues de la coma para no romper la lista.
        joined = []
        for j, r in enumerate(rows):
            sep = ";" if j == len(rows) - 1 else ","
            if "  -- " in r:
                body, comment = r.split("  -- ", 1)
                joined.append(f"{body}{sep}  -- {comment}")
            else:
                joined.append(r + sep)
        w("\n".join(joined))
        w("")
    w("""BEGIN TRY
    BEGIN TRANSACTION;

    SET IDENTITY_INSERT dbo.CAF_CAT_REGION ON;
    INSERT INTO dbo.CAF_CAT_REGION (CAT_idRegion, REG_nombre, REG_descripcion, BIT_eliminado)
    SELECT s.CAT_idRegion, s.REG_nombre, 'INSTITUCIONAL - CEN_CINAI_TERRITORIAL_STRUCTURE.md', 0
    FROM @reg s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CAF_CAT_REGION t WHERE t.CAT_idRegion = s.CAT_idRegion);
    SET IDENTITY_INSERT dbo.CAF_CAT_REGION OFF;

    SET IDENTITY_INSERT dbo.CAF_CAT_OFICINA_LOCAL ON;
    INSERT INTO dbo.CAF_CAT_OFICINA_LOCAL (CAT_idOficinaLocal, CAT_idRegion, OFL_nombre, OFL_descripcion, BIT_eliminado)
    SELECT s.CAT_idOficinaLocal, s.CAT_idRegion, s.OFL_nombre, 'INSTITUCIONAL - CEN_CINAI_TERRITORIAL_STRUCTURE.md', 0
    FROM @ofl s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CAF_CAT_OFICINA_LOCAL t WHERE t.CAT_idOficinaLocal = s.CAT_idOficinaLocal);
    SET IDENTITY_INSERT dbo.CAF_CAT_OFICINA_LOCAL OFF;

    INSERT INTO dbo.RCS_ESTABLECIMIENTO (EST_idEstablecimiento, EST_descripcion, CAT_idOficinaLocal, EST_inActivo, BIT_eliminado)
    SELECT s.EST_idEstablecimiento, s.EST_descripcion, s.CAT_idOficinaLocal, s.EST_inActivo, 0
    FROM @est s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.RCS_ESTABLECIMIENTO t WHERE t.EST_idEstablecimiento = s.EST_idEstablecimiento);

    /* Verificacion: la jerarquia almacenada debe coincidir exactamente con la fuente.
       La comparacion nvarchar binaria detecta tambien perdida de acentos por la intercalacion. */
    DECLARE @diff int =
          (SELECT COUNT(*) FROM dbo.CAF_CAT_REGION t
           WHERE NOT EXISTS (SELECT 1 FROM @reg s
                             WHERE s.CAT_idRegion = t.CAT_idRegion
                               AND CONVERT(nvarchar(200), t.REG_nombre) COLLATE Latin1_General_BIN2 = s.REG_nombre COLLATE Latin1_General_BIN2
                               AND ISNULL(t.BIT_eliminado, 0) = 0))
        + (SELECT COUNT(*) FROM dbo.CAF_CAT_OFICINA_LOCAL t
           WHERE NOT EXISTS (SELECT 1 FROM @ofl s
                             WHERE s.CAT_idOficinaLocal = t.CAT_idOficinaLocal
                               AND s.CAT_idRegion = t.CAT_idRegion
                               AND CONVERT(nvarchar(200), t.OFL_nombre) COLLATE Latin1_General_BIN2 = s.OFL_nombre COLLATE Latin1_General_BIN2
                               AND ISNULL(t.BIT_eliminado, 0) = 0))
        + (SELECT COUNT(*) FROM dbo.RCS_ESTABLECIMIENTO t
           WHERE NOT EXISTS (SELECT 1 FROM @est s
                             WHERE s.EST_idEstablecimiento = t.EST_idEstablecimiento
                               AND s.CAT_idOficinaLocal = t.CAT_idOficinaLocal
                               AND s.EST_inActivo = t.EST_inActivo
                               AND CONVERT(nvarchar(250), t.EST_descripcion) COLLATE Latin1_General_BIN2 = s.EST_descripcion COLLATE Latin1_General_BIN2
                               AND ISNULL(t.BIT_eliminado, 0) = 0));
    IF @diff <> 0
        THROW 50003, 'La jerarquia territorial existente difiere de la fuente institucional (posible catalogo DEMO anterior o intercalacion sin Latin1/UTF-8). Recree SIDINACC_LOCAL manualmente; ver README seccion 8.', 1;

    COMMIT TRANSACTION;
    PRINT 'SIDINACC_LOCAL: estructura territorial institucional aplicada (solo filas faltantes).';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    SET IDENTITY_INSERT dbo.CAF_CAT_REGION OFF;
    SET IDENTITY_INSERT dbo.CAF_CAT_OFICINA_LOCAL OFF;
    THROW;
END CATCH;
GO

SET NOEXEC OFF;
GO""")
    return "\n".join(out) + "\n"


def smoke_constants(catalog) -> dict[str, int]:
    seeded = [c for c in catalog if c["validation_status"] == "CONFIRMED"]
    return {
        "@expEstTotal": len(seeded),
        "@expEstActive": sum(STATUS_TO_ACTIVE[c["source_status"]] for c in seeded),
        "@expEstChecksum": sum(c["establishment_id"] for c in seeded),
    }


def report(regions, offices, catalog, data, legend, uncoded_sheet, issues) -> str:
    lines = []
    p = lines.append
    p(f"Excel: {EXCEL.relative_to(ROOT)}")
    p(f"  {SHEET}: filas no vacias={len(data)}; con codigo={len(catalog)}; leyenda sin codigo={legend}")
    p(f"  {SHEET_UNCODED}: filas no vacias={len(uncoded_sheet)} (sin codigo de establecimiento ni OL)")
    p(f"  estados: {dict(Counter(c['source_status'] for c in catalog))}")
    p(f"  CONFIRMED={sum(c['validation_status'] == 'CONFIRMED' for c in catalog)}; "
      f"NEEDS_VALIDATION={sum(c['validation_status'] != 'CONFIRMED' for c in catalog)}")
    for i in issues:
        p(f"  NEEDS_VALIDATION {i}")
    p("Diferencias de nombre Excel vs documento territorial (se usa el documento):")
    seen = set()
    for c in catalog:
        if c["validation_status"] != "CONFIRMED":
            continue
        key = ("OL", c["office_local_id"])
        if key not in seen and norm(c["_excel_ol_name"]) != norm(c["office_local_name"]):
            seen.add(key)
            p(f"  OL {c['office_local_id']}: Excel '{c['_excel_ol_name']}' vs doc '{c['office_local_name']}'")
        key = ("R", c["region_id"])
        if key not in seen and norm(c["_excel_region_name"]) != norm(c["region_name"]):
            seen.add(key)
            p(f"  Region {c['region_id']}: Excel '{c['_excel_region_name']}' vs doc '{c['region_name']}'")
    by_name: dict[str, list] = {}
    for c in catalog:
        by_name.setdefault(norm(c["establishment_name"]), []).append(c)
    p(f"Cruce {SHEET_UNCODED} -> {SHEET} por nombre normalizado:")
    for r in uncoded_sheet:
        m = by_name.get(norm(r[2]))
        if not m:
            p(f"  sin coincidencia exacta: '{str(r[2]).strip()}' ({r[8]}; {r[14]}/{r[15]}/{r[16]})")
        elif any(x["source_status"] != "ACTIVO" for x in m):
            p(f"  estado distinto: '{str(r[2]).strip()}' ACTIVO en {SHEET_UNCODED}; "
              f"{[(x['establishment_id'], x['source_status']) for x in m]} en {SHEET}")
    names_uncoded = Counter(norm(r[2]) for r in uncoded_sheet)
    for c in catalog:
        if c["source_status"] == "ACTIVO" and names_uncoded[norm(c["establishment_name"])] == 0:
            p(f"  ACTIVO en {SHEET} sin nombre exacto en {SHEET_UNCODED}: {c['establishment_id']} '{c['establishment_name']}'")
    return "\n".join(lines)


def main() -> int:
    check = "--check" in sys.argv[1:]
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    regions, offices, catalog, data, legend, uncoded_sheet, issues = build()
    if len(regions) != 9 or len(offices) != 41:
        raise SystemExit(f"Documento territorial: se esperaban 9 regiones y 41 OL; hay {len(regions)}/{len(offices)}")
    excel_sha = hashlib.sha256(EXCEL.read_bytes()).hexdigest()
    csv_text = render_csv(catalog)
    sql_text = render_sql(regions, offices, catalog, excel_sha)
    sql_text.encode("ascii")  # el SQL generado debe ser ASCII
    consts = smoke_constants(catalog)
    print(report(regions, offices, catalog, data, legend, uncoded_sheet, issues))
    print(f"Constantes para 090_smoke_tests.sql: {consts}")

    if not check:
        CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
        CSV_OUT.write_text(csv_text, encoding="utf-8", newline="")
        SQL_OUT.write_text(sql_text, encoding="ascii", newline="")
        print(f"Escrito: {CSV_OUT.relative_to(ROOT)}, {SQL_OUT.relative_to(ROOT)}")
        return 0

    ok = True
    for path, expected in ((CSV_OUT, csv_text), (SQL_OUT, sql_text)):
        actual = path.read_text(encoding="utf-8") if path.exists() else None
        if actual != expected:
            ok = False
            print(f"CHECK FAIL: {path.relative_to(ROOT)} difiere de las fuentes")
    smoke = SMOKE.read_text(encoding="utf-8")
    for name, value in consts.items():
        m = re.search(re.escape(name) + r"\s+(?:int|bigint)\s*=\s*(\d+)", smoke)
        if not m or int(m[1]) != value:
            ok = False
            print(f"CHECK FAIL: {name} en 090_smoke_tests.sql = {m[1] if m else '(no encontrado)'}; esperado {value}")
    print("CHECK PASS" if ok else "CHECK FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
