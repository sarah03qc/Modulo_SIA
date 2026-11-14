'use strict';

const { InfrastructureError } = require('../../common/errors');

/*
  Filtro de solo lectura para las sentencias que salen hacia SIDINACC_LOCAL.
  Complementa el permiso de la cuenta SQL: la API no envía escrituras,
  varias sentencias ni un SELECT de todas las columnas.
  No reemplaza el control del motor. SIA_CENCINAI no pasa por este filtro.
*/

const FORBIDDEN_SQL = /\b(insert|update|delete|merge|alter|drop|truncate|exec|execute|grant|revoke|deny|backup|restore|waitfor|openrowset|opendatasource|openquery|into|create|use|dbcc|begin|commit|rollback|declare|bulk|kill|shutdown|reconfigure|go|set|if|while)\b/i;

const TOP_LEVEL_WORDS = new Set([
  'select',
  'with',
  'insert',
  'update',
  'delete',
  'merge',
  'create',
  'alter',
  'drop',
  'truncate',
  'exec',
  'execute',
  'grant',
  'revoke',
  'deny',
  'backup',
  'restore',
  'waitfor',
  'openrowset',
  'opendatasource',
  'openquery',
  'into',
  'use',
  'dbcc',
  'begin',
  'commit',
  'rollback',
  'declare',
  'bulk',
  'kill',
  'shutdown',
  'reconfigure',
  'go',
  'set',
  'if',
  'while'
]);

/**
 * Rechaza la sentencia antes de enviarla al motor.
 * El mensaje no incluye el texto SQL.
 */
function reject(message) {
  throw new InfrastructureError(message);
}

/**
 * Recoge las palabras de control que están fuera de paréntesis.
 * Un SELECT interno no se confunde así con otra sentencia principal.
 */
function topLevelKeywords(sqlText) {
  const keywords = [];
  let depth = 0;
  let index = 0;

  while (index < sqlText.length) {
    const character = sqlText[index];
    if (character === '(') {
      depth += 1;
      index += 1;
      continue;
    }
    if (character === ')') {
      depth = Math.max(0, depth - 1);
      index += 1;
      continue;
    }
    if (depth === 0 && /[A-Za-z_]/.test(character)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(sqlText.slice(index));
      const word = match[0].toLowerCase();
      if (TOP_LEVEL_WORDS.has(word)) {
        keywords.push(word);
      }
      index += match[0].length;
      continue;
    }
    index += 1;
  }

  return keywords;
}

/**
 * Acepta un SELECT suelto o un WITH seguido de un solo SELECT.
 * Cualquier otra combinación se rechaza.
 */
function assertSingleRead(keywords) {
  const singleSelect = keywords.length === 1 && keywords[0] === 'select';
  const withQuery = keywords.length === 2 && keywords[0] === 'with' && keywords[1] === 'select';
  if (!singleSelect && !withQuery) {
    reject('La consulta institucional debe ser una sola sentencia.');
  }
}

/**
 * Comprueba que el texto sea una consulta de lectura antes de enviarlo a la réplica.
 *
 * Recibe el SQL que se va a ejecutar. Quita comentarios y textos entre comillas
 * para no dejarse engañar por palabras prohibidas escondidas ahí.
 * Exige columnas nombradas, una sola sentencia y un SELECT, o un WITH seguido de SELECT.
 *
 * Si no cumple, lanza un error de infraestructura y la consulta no sale.
 */
function assertInstitutionalRead(sqlText) {
  if (typeof sqlText !== 'string' || sqlText.trim() === '') {
    reject('La consulta institucional está vacía.');
  }

  const withoutComments = sqlText
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .trim();
  const withoutStrings = withoutComments.replace(/N?'(?:''|[^'])*'/g, ' ');

  if (!/^(select|with)\b/i.test(withoutComments)) {
    reject('La fuente institucional solo admite consultas de lectura.');
  }
  if (/\bselect\s+\*/i.test(withoutStrings) || /\.\s*\*/.test(withoutStrings)) {
    reject('La consulta institucional debe nombrar columnas.');
  }
  if (FORBIDDEN_SQL.test(withoutStrings)) {
    reject('La fuente institucional solo admite consultas de lectura.');
  }
  if (/;\s*\S/.test(withoutStrings)) {
    reject('La consulta institucional debe ser una sola sentencia.');
  }
  assertSingleRead(topLevelKeywords(withoutStrings));
}

module.exports = { assertInstitutionalRead };
