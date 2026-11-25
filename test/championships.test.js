import test from 'node:test';
import assert from 'node:assert/strict';
import {getExcludedFinalRounds,isRoundEligible,normalizeChampionshipConfig} from '../lib/championships.js';
test('final rounds are derived from configured total, not imported maximum',()=>assert.deepEqual(getExcludedFinalRounds(38,4),[35,36,37,38]));
test('final rounds adapt for different competition lengths',()=>assert.deepEqual(getExcludedFinalRounds(46,4),[43,44,45,46]));
test('round eligibility separates entry rules',()=>{assert.equal(isRoundEligible(5,{entryFromRound:5,totalRounds:38,excludeFinalRounds:4}),true);assert.equal(isRoundEligible(35,{entryFromRound:5,totalRounds:38,excludeFinalRounds:4}),false);});
test('season window defaults to whole season',()=>assert.equal(normalizeChampionshipConfig({}).windowSize,null));
