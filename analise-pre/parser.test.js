import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePreliminaryFile, validatePreliminaryRows} from './parser.js';

test('lê TSV com confronto e odd, preservando dados originais',()=>{
  const result=parsePreliminaryFile('Data\tConfronto\tCampeonato\tODD_CASA\n2026-10-12\tTime A x Time B\tLiga X\t2.15','auto');
  assert.equal(result.rows.length,1);
  assert.equal(result.rows[0].confronto,'Time A x Time B');
  assert.equal(result.rows[0].campeonato,'Liga X');
  assert.equal(result.rows[0].odds.ODD_CASA,2.15);
  assert.equal(result.rows[0].status,undefined);
});

test('lê CSV com vírgula dentro de campo entre aspas',()=>{
  const result=parsePreliminaryFile('Confronto,Campeonato\n"Time A, B x Time C","Liga, Norte"','comma');
  assert.equal(result.rows[0].confronto,'Time A, B x Time C');
  assert.equal(result.rows[0].campeonato,'Liga, Norte');
});

test('monta confronto a partir de casa e visitante',()=>{
  const result=parsePreliminaryFile('Casa;Visitante;Competição\nTime A;Time B;Liga','semicolon');
  assert.equal(result.rows[0].confronto,'Time A x Time B');
  assert.equal(result.rows[0].campeonato,'Liga');
});

test('recusa linha sem confronto',()=>{
  assert.throws(()=>parsePreliminaryFile('Data;Campeonato\n2026-10-12;Liga','semicolon'),/confronto ausente/i);
});

test('deduplica jogos preliminares com mesma data, campeonato e confronto',()=>{
  const rows=validatePreliminaryRows([
    {data:'2026-10-12',campeonato:'Liga',confronto:'Time A x Time B'},
    {data:'2026-10-12',campeonato:'Liga',confronto:'Time A x Time B'},
    {data:'2026-10-13',campeonato:'Liga',confronto:'Time A x Time B'}
  ]);
  assert.equal(rows.length,2);
  assert.ok(rows.every(r=>r.status==='pendente'));
});

test('recusa entrada sem confronto',()=>{
  assert.throws(()=>validatePreliminaryRows([{campeonato:'Liga'}]),/confronto obrigatório/i);
});

test('recusa arquivo acima do limite',()=>{
  assert.throws(()=>parsePreliminaryFile('Confronto\n'+Array.from({length:3},(_,i)=>'Jogo '+i).join('\n'),'auto',{maxRows:2}),/excede o limite/i);
});
