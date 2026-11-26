// OmniFlow incremental patch 17: CSP review and narrow hardening (Node 20+).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
const entries=[{"path":"next.config.ts","base":"82e337403fd9a5286bf4dc8dc5cefd7c5151c62081cf5f4283a015ba82745001","target":"c616c7cea0dd8c7081ebb4956a30019db558fb57fb6d70caf0f204a4c6494363","data":"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"},{"path":"tests/csp-review-phase1.test.ts","base":null,"target":"82d6738eeaa980c2e1067923e209f2db9a358970b79ed87bfcd82d70a5cef331","data":"H4sIAAAAAAAC/6VV34/bNgx+z1/BCgMiF4mDvSbIhmvqYQPa23BXbI9XxaYTrbJkSLJ9wTX/+yg7P5zkcrjrHmzANPnx4yeSkkVprIcnELlHm4h0PYIMXWrlEkeAjyWmfgSSnlrCFnJrCmC19Og8mw0GhyjOI5j/Qji1jCvtfLW8USrRtePRLNgsOvSfTVYpbE3baDYQbqNTyCudemk0KCMyjrqeAistebZWBt+BZVijMmWB2rMROG9l6mEOuVAOI3gaQMgQclJCzm7//Jg8JLd/kyuhdekPP5Pbmw+fkof7L3d/LL48/HZ38zl5+D25+Zjc3R+hfwXmbYUMiEqbhD1bBOVNDdVKVWeYi0r5aTDkckVKzUE0QnqQrcCcxfFE46OPOwfWi7YB7uDf/Y/XKDK07l0/zQpD1dyayuO05apXreotQpxLnXHbfsfOVDZFmM/n0LpH7/aI5KbozPg6OK7jb7iJvflkGrQL4TCcIsUwSuhJ7bHDtLLSb8alUTLdsCgWno9/JrhaqAoDN4u+spo0KKsl+SxcOQ1MOZvw+H3EohGIrJC6Z2+/J9NS+PV7FsF2NtgODl2QSUstJ2vkaYjoqhyBFkWv5qdjXvKKXakkAc+IXiFK/hhKe4zJt+BR1OmyszkvrHf/SL/mX396CqBb+BpF8J26jAUe+97nbHH/F+WoJTYgdEYErDUNrIXNUBMJ6pZdyxOXkF3JQnrXFQsBpPRtIEmpsa3NQUOJ6ThgaVF8I5CdZuQn1MbLlMKVMo2SLjR6Nx/HLMd2O0h9FLfXcu0g9Weo7SHYTTM/KryPHQHrCI+dTRlJ5s0HUuBog6FDlQ9hSKMtchxLraTG4WuAd+WfIveMO+irUL1SL0guqEuF1JytvS/ddDJpmiZeGbNS6MWqIFVXaGniilehXzB9AX58OLEX4Xs65MYWY7E7j70OPeNbdPi/WH1almaAqklpoRvrenCnP2CozUsnfkLv1ZjP0dyTi2JtfP8U9s2HtHrOgw7p3xT1rCJm+e9Fvx5tJzps23cY/jJcDbamPd67q2hcC1pycilpPW3aZeCwFFZ4VBtwVRluBre/dLrFESTqtsu16acEZ5Pevx7PCsQ67knzWllOo84EvTjdK5KeoLy9abtiD3f9tXpHEG7qaxy68Pjqnjsr7Xx1sB/FfXP/XQL+0GCGhgzPfznvG5/WCQAA"},{"path":"CSP_REVIEW_PATCH_17.md","base":null,"target":"85149f87ecb765c8c2efefdf325830a02380e320d746bb8b107487e7077803c5","data":"H4sIAAAAAAAC/2VVzY7bNhC++ykG6GGBhX/QU4H41GwQZItgs4h9yNGUOLYnoUiBpGyrpz5En7BP0m9IedfJAgIMWOTMN/P96Dd62DxT5JPwmYy35KSTzJaOJlr24g/03z//Um9ye6Tf/5jNnmOwQ5sleDK2E49XB06okHKUNlNqo/T4CUNs8X8OlEzHixDloIfdkEi8E8/UBsvz0rMN3nOp+eZC8G5cUz4y9UPjpKUEdOiWjeCw5ER8kZQVp/HGjVnaVGpuht40JvFNcTLOhbPD8bSkjyF2lIamk5RKYxP5Zfg3IPRqnXRNIVrxJo6064y4HN7tcM//qBV8yLR/Uxp4IuP0BIHtkrYY6XWB1AziLEdqjSeMg277CAQ/L69uoMCYa4PvmEux3qxHX94l2pXbC+PBQQ4x0V1it7/bFSjGj9THcBlXDx+e6MgGjbGRLY6ilOhKe9SS7EYdPWWD7oclPQyo1emRaBe9iXmcJhCf+RBNJTBgiHpQ95CoD5UedonPR8aOdMYGI7vQ/mC7vlWfsd+HggIDBWAYiwC0Ep04yl5Ajme2aTmb3d9vFSweXbqhSYA+YOiFUm9V28v7e9pUTWqDlEfHtBt8MnteVCXuruQ03JoBknniS159ZYNqkT22A/xzBQVCxEsW4+TvMu78KuYq+7Qq9SvjrWmPbFePm6+TRxQ4cLahKkiFZjnJwS/p8acq5fq3zYY6M05q4Au3Q+Yl3fiPL60bUOFlHD4Zt1uj6Ild6Dv2+cYpS3ofg7H0abt93pB0qrqrS+v8MGMiG65SuvHTjW9+VVaV1LfFx/L3l76KAPLKKk49rOQ3Q9bKShSuGdRPRzqw52hcmVTx53FJf6rc0LTSeCU3YfjI77C8/ZCHYjO8XR0NqnQySY86lY5p2zD4YkLqOS4QTD0QITOAM3SeE7xjRw9c7Su7haUraYXtvzZfnhafP1xpb0LI89eVXHOrQzBKA0XdmmJiERJ9z4ChceUYekQttVj1jAsH3XjxyBz7qh6Qst05dWzFXHtrq4kTb05yqNPiiYztTXwiWqiJ4Zw4zuks+ViCHeGXAuCdJLjJnydJing9gXkhuRhN9sQe9KhQazAnqEjz6tGnXhlFZKyOsDS9LHYKkHKBfVJ6RNnmyl2AcaNY1mAwfc+17B7TlFgAytUv6kHS4IAgRGtK5Qhi9ZOEtnPaft7MqyAEuy4pIZPjpvkRjX0fYsZSLGtDjOCgracAfCeJwas1oAKT6ycCyF5VBMl1wdaoacYaiOXzx3E5+x8jqv5xLwcAAA=="}];
const root=process.cwd(), args=process.argv.slice(2), check=args.includes('--check');
if(args.some(a=>a!=='--check')) { console.error('Usage: node omniflow-csp-review-patch-17.mjs [--check]'); process.exit(2); }
const hash=b=>crypto.createHash('sha256').update(Buffer.from(b.toString('utf8').replace(/\r\n/g,'\n'))).digest('hex');
function safePath(name){
 if(name.startsWith('/')||name.split('/').some(s=>!s||s==='.'||s==='..')) throw new Error('Invalid patch path');
 let p=root;
 for(const part of name.split('/')){ p=path.join(p,part); try { if(fs.lstatSync(p).isSymbolicLink()) throw new Error('Symbolic link in target path: '+name); } catch(e){ if(e.code!=='ENOENT') throw e; } }
 return p;
}
try {
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 if(pkg.name!=='omniflow-platform'||!fs.existsSync(path.join(root,'src/lib/database/index.ts'))) throw new Error('Wrong project root.');
 const conflicts=[], changes=[];
 for(const e of entries){
  const targetPath=safePath(e.path), exists=fs.existsSync(targetPath);
  if(exists&&!fs.statSync(targetPath).isFile()){conflicts.push(e.path+' (not a regular file)');continue;}
  const original=exists?fs.readFileSync(targetPath):null;
  const current=exists?hash(original):null;
  if(current===e.target)continue;
  if(current!==e.base){conflicts.push(e.path+(exists?' (modified or different version)':' (missing)'));continue;}
  const bytes=zlib.gunzipSync(Buffer.from(e.data,'base64'));
  if(hash(bytes)!==e.target)throw new Error('Internal integrity error: '+e.path);
  const raw=original?.toString('utf8')||'';
  if(raw.includes('\r\n') && /(?<!\r)\n/.test(raw)){conflicts.push(e.path+' (mixed line endings)');continue;}
  const finalBytes=raw.includes('\r\n')?Buffer.from(bytes.toString('utf8').replace(/\n/g,'\r\n')):bytes;
  changes.push({...e,targetPath,existed:exists,bytes:finalBytes});
 }
 if(conflicts.length){console.error('STOP: no files changed. Conflicts or incompatible project version:\n'+conflicts.map(x=>' - '+x).join('\n'));console.error('Do not delete your edits. Send the conflict list for a compatible patch.');process.exit(1);}
 console.log('Compatible. Files to update: '+changes.length);changes.forEach(c=>console.log(' - '+c.path));
 if(check||!changes.length){console.log(check?'Check only: no files changed.':'Already applied.');process.exit(0);}
 const backupRoot=safePath('.patch-backups');
 const backup=path.join(backupRoot,'csp-review-17-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex'));
 fs.mkdirSync(backup,{recursive:true});
 for(const c of changes)if(c.existed){const dest=path.join(backup,...c.path.split('/'));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(c.targetPath,dest,fs.constants.COPYFILE_EXCL);}
 fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify({patch:'csp-review-17',files:changes.map(c=>({path:c.path,existed:c.existed,originalHash:c.base,patchedHash:c.target}))},null,2));
 const written=[];
 try { for(const c of changes){
   fs.mkdirSync(path.dirname(c.targetPath),{recursive:true});
   const current=fs.existsSync(c.targetPath)?hash(fs.readFileSync(c.targetPath)):null;
   if(current!==c.base)throw new Error('File changed during application: '+c.path);
   written.push(c);fs.writeFileSync(c.targetPath,c.bytes);
  }
 }catch(err){let failed=false;for(const c of written.reverse())try{if(c.existed)fs.copyFileSync(path.join(backup,...c.path.split('/')),c.targetPath);else fs.rmSync(c.targetPath,{force:true});}catch{failed=true;}throw new Error('Application failed. '+(failed?'Automatic rollback incomplete; restore from '+backup:'Written files restored from backup.')+' Cause: '+err.message);}
 console.log('Applied CSP review patch. Backup: '+backup);
 console.log('Inline scripts/styles remain allowed; CSP is not nonce-based. Read CSP_REVIEW_PATCH_17.md. No .env/database changes or migrations.');
 console.log('Run npm run typecheck, npm run lint, npm run test and npm run build; see handover notes.');
}catch(e){console.error('STOP: '+(e?.message||e));process.exit(1);}
