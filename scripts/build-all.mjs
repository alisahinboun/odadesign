#!/usr/bin/env node
/** Tum semalar icin denetim + cizim + metraj uretir. Kullanim: npm run all:schemes */
import { execFileSync } from 'node:child_process';
import { schemes } from '../src/config/schemes.js';

let fail = 0;
for (const s of schemes) {
  console.log(`\n\x1b[1m\x1b[33m━━ ${s.code} · ${s.name} ━━\x1b[0m`);
  for (const script of ['check.mjs', 'drawings.mjs', 'schedule.mjs']) {
    try {
      const out = execFileSync(process.execPath, [`scripts/${script}`, `--sema=${s.id}`], { encoding: 'utf8' });
      if (script === 'check.mjs') {
        const last = out.trim().split('\n').filter((l) => l.includes('SONUC')).pop() || '';
        console.log('  ' + last.replace(/\x1b\[[0-9;]*m/g, '').trim());
        if (!/0 hata/.test(last)) fail++;
      } else {
        console.log(out.trim().split('\n').filter((l) => l.includes('✓')).map((l) => '  ' + l.trim()).join('\n'));
      }
    } catch (e) {
      console.log(`  \x1b[31m✗ ${script} hata verdi\x1b[0m`);
      console.log((e.stdout || '').split('\n').filter((l) => l.includes('✗')).join('\n'));
      fail++;
    }
  }
}
console.log(fail === 0 ? '\n\x1b[32mTum semalar temiz.\x1b[0m\n' : `\n\x1b[31m${fail} semada sorun var.\x1b[0m\n`);
process.exit(fail ? 1 : 0);
