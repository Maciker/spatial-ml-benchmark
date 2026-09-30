import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync,rmSync,writeFileSync,readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const cli=path.resolve("tools/pr/post-pr-review.mjs");
const base={pr:{number:7,url:"https://example.test/pr/7",baseSha:"1111111111111111111111111111111111111111",headSha:"2222222222222222222222222222222222222222"},current:{baseSha:"1111111111111111111111111111111111111111",headSha:"2222222222222222222222222222222222222222"},diff:{complete:true,baseSha:"1111111111111111111111111111111111111111",headSha:"2222222222222222222222222222222222222222",files:["src/example.ts"]},checks:{status:"complete",requiredCount:1,items:[{name:"quality",required:true,status:"completed",conclusion:"success"}]},reviews:[],review:{decision:"pass",reviewer:{identity:"reviewer",verified:true,independent:true},implementer:{identity:"implementer",verified:true},findings:[]},publication:{status:"published",url:"https://example.test/review"}};
function run(input){const dir=mkdtempSync(path.join(tmpdir(),"pr-review-")),i=path.join(dir,"i.json"),o=path.join(dir,"o.json");writeFileSync(i,JSON.stringify(input));const r=spawnSync(process.execPath,[cli,"--input",i,"--report",o],{encoding:"utf8"});const out=JSON.parse(readFileSync(o,"utf8"));rmSync(dir,{recursive:true,force:true});assert.equal(r.status,0);return out.status;}
test("approves exact evidence",()=>assert.equal(run(base),"APPROVED"));
test("pending checks are not approved",()=>{const x=JSON.parse(JSON.stringify(base));x.checks.status="pending";assert.equal(run(x),"PENDING")});
test("stale head is blocked",()=>{const x=JSON.parse(JSON.stringify(base));x.current.headSha="3333333333333333333333333333333333333333";assert.equal(run(x),"BLOCKED")});
