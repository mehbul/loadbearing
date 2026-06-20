'use strict';
/*
 * loadbearing — write-time performance-footgun detectors.
 *
 * HONEST FRAMING: these are line-level *heuristics*, not a full parser. They aim
 * to catch the common, obvious cases with very few false positives. They will
 * miss cleverly disguised versions, and they are not a guarantee of correctness.
 * Treat a finding as "look here", not "this is definitely broken".
 *
 * Each detector: (text) => Finding[]   where Finding = { rule, line, title, why, fix }
 */

const CODE_EXT = /\.(jsx?|tsx?|mjs|cjs)$/i;
const SQL_EXT = /\.sql$/i;
const SKIP = /(^|[\/])(node_modules|\.next|dist|build|coverage)([\/]|$)|\.min\.(js|css)$/;

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === '\n') line++;
  return line;
}

// Balanced substring starting at openIdx (must point at '{' or '(').
function balanced(text, openIdx) {
  const open = text[openIdx];
  const close = open === '{' ? '}' : ')';
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return text.slice(openIdx, i + 1);
    }
  }
  return text.slice(openIdx);
}

// A method-chain expression starting at `start`. Stops at the first ';' or at a
// newline whose next non-space char is not a chain continuation ('.').
function statementFrom(text, start) {
  const max = Math.min(text.length, start + 600);
  let i = start;
  for (; i < max; i++) {
    const c = text[i];
    if (c === ';') break;
    if (c === '\n') {
      let j = i + 1;
      while (j < max && (text[j] === ' ' || text[j] === '\t' || text[j] === '\r')) j++;
      if (text[j] !== '.') break;
    }
  }
  return text.slice(start, i);
}

// A *direct* DB query awaited inside the body (high confidence N+1).
const DIRECT_QUERY = /\bawait\b[^;\n]*?(supabase|\.from\s*\(|prisma\.|drizzle|db\.query|\.query\s*\(|knex)/;
// An awaited *data-ish* helper call (read-oriented) inside the body (possible N+1).
const DATA_CALL = /\bawait\s+(?:[\w$]+\.)*(get|fetch|load|find|query|select|read|list|count|lookup)\w*\s*\(/i;

// Rule 1.1 — SELECT * / .select('*')
function selectStar(text) {
  const out = [];
  const res = [/\bselect\s+\*/gi, /\.select\(\s*['"]\s*\*\s*['"]\s*\)/g];
  for (const re of res) {
    let m;
    while ((m = re.exec(text))) {
      out.push({
        rule: '1.1',
        line: lineOf(text, m.index),
        title: 'SELECT * fetches every column',
        why: 'Every extra column is more data read from disk and sent over the network on every request; at scale it saturates your DB and network.',
        fix: "List only the columns you use, e.g. .select('id, name, created_at')."
      });
    }
  }
  return out;
}

// Rule 1.4 — database query inside a loop (N+1), direct or via a helper call
function queryInLoop(text) {
  const out = [];
  const re = /\b(for|while)\b\s*\(|\.(map|forEach|filter|reduce)\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    let body = '';
    if (m[2]) {
      const open = text.indexOf('(', m.index);
      if (open !== -1) body = balanced(text, open);
    } else {
      const headerOpen = text.indexOf('(', m.index);
      if (headerOpen === -1) continue;
      const header = balanced(text, headerOpen);
      const afterHeader = headerOpen + header.length;
      const brace = text.indexOf('{', afterHeader);
      if (brace === -1 || brace - afterHeader > 4) continue;
      body = balanced(text, brace);
    }
    if (!body) continue;
    if (DIRECT_QUERY.test(body)) {
      out.push({
        rule: '1.4',
        line: lineOf(text, m.index),
        title: 'Database query inside a loop (N+1)',
        why: 'One query per item means many round-trips; under load they multiply and exhaust the DB connection pool.',
        fix: 'Fetch related rows in one query — a join, .in([...ids]), or a Supabase nested select.'
      });
    } else if (DATA_CALL.test(body)) {
      out.push({
        rule: '1.4',
        line: lineOf(text, m.index),
        title: 'Possible N+1 — a data call runs inside a loop',
        why: 'A fetch/get/find call runs once per item; if it hits the DB or network, those round-trips multiply under load. Verify it is not querying per iteration.',
        fix: 'If it fetches data, batch it before the loop (one query with .in([...ids]) or a join) instead of calling per item.'
      });
    }
  }
  return out;
}

// Rules 2.1 / 2.2 — external fetch() with no timeout (relative/internal URLs are skipped to cut noise)
function fetchNoTimeout(text) {
  const out = [];
  const re = /\bfetch\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].length - 1;
    const args = balanced(text, open);
    const hasTimeout = /(signal\s*:|AbortSignal|timeout|AbortController)/i.test(args);
    const isExternal = /https?:\/\//i.test(args); // only flag clearly external calls
    if (isExternal && !hasTimeout) {
      out.push({
        rule: '2.2',
        line: lineOf(text, m.index),
        title: 'External fetch() without a timeout',
        why: 'A hanging external call ties up a worker; under load one slow dependency can freeze your whole app.',
        fix: 'Add a timeout, e.g. fetch(url, { signal: AbortSignal.timeout(3000) }).'
      });
    }
  }
  return out;
}

// Rule 1.2 — unbounded query (no pagination/limit)
function unboundedSelect(text) {
  const out = [];
  const re = /\.from\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    const stmt = statementFrom(text, m.index);
    if (/\.select\s*\(/.test(stmt) && !/\.(range|limit|single|maybeSingle|csv)\s*\(/.test(stmt)) {
      out.push({
        rule: '1.2',
        line: lineOf(text, m.index),
        title: 'Unbounded query (no limit or pagination)',
        why: 'Returning every row is fine in dev but grows without bound in production, eventually timing out and taking the page down.',
        fix: 'Add .range(from, to) or .limit(n) — or .single() if you expect exactly one row.'
      });
    }
  }
  return out;
}

const DETECTORS = [selectStar, queryInLoop, fetchNoTimeout, unboundedSelect];

function runDetectors(text, filename) {
  filename = filename || '';
  if (SKIP.test(filename)) return [];
  const isSql = SQL_EXT.test(filename);
  const isCode = CODE_EXT.test(filename);
  if (!isSql && !isCode) return [];
  let findings = [];
  try {
    if (isSql) findings = selectStar(text);
    else for (const d of DETECTORS) findings = findings.concat(d(text));
  } catch (_) {
    return [];
  }
  return findings.sort((a, b) => a.line - b.line);
}

module.exports = { runDetectors, lineOf, balanced };
