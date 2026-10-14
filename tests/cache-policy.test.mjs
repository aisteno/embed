import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { validatePurge } from '../scripts/validate-purge.mjs';

const loader = await readFile(new URL('../scripts/jsdelivr-loader.js', import.meta.url), 'utf8');

function load(src, now = 100) {
    let inserted;
    const original = {
        src, nonce: 'fixture-nonce', crossOrigin: 'anonymous', referrerPolicy: 'no-referrer',
        attributes: [{name:'data-id',value:'ercm'}, {name:'data-container',value:'#slot'},
            {name:'data-language',value:'en'}, {name:'data-border-color',value:'#123'},
            {name:'integrity',value:'old-loader-hash'}],
        after: script => { inserted = script; },
    };
    vm.runInNewContext(loader, {
        document: { currentScript: original, createElement: () => ({
            attributes: {}, setAttribute(name, value) { this.attributes[name] = value; },
        }) },
        URL, Date: { now: () => now }, console,
    });
    return inserted;
}

test('cached alias loader requests a fresh runtime on the existing CDN host', () => {
    for (const alias of ['latest', 'release', '3', '3.2']) {
        const src = `https://cdn.jsdelivr.net/gh/aisteno/embed@${alias}/steno-chat.js?custom=value`;
        const first = new URL(load(src).src);
        const second = new URL(load(src, 101).src);
        assert.equal(first.origin, 'https://cdn.jsdelivr.net');
        assert.equal(first.pathname, `/gh/aisteno/embed@${alias}/steno-chat-runtime.js`);
        assert.equal(first.searchParams.get('custom'), 'value');
        assert.notEqual(first.href, second.href);
    }
});

test('pinned tags load their matching runtime without a changing query', () => {
    for (const version of ['3.2.12', '3.2.12-beta.1']) {
        const src = `https://cdn.jsdelivr.net/gh/aisteno/embed@${version}/steno-chat.js`;
        assert.equal(load(src).src, `https://cdn.jsdelivr.net/gh/aisteno/embed@${version}/steno-chat-runtime.js`);
        assert.equal(load(src).src, load(src, 101).src);
    }
});

test('loader preserves embed configuration and CSP nonce without copying stale integrity', () => {
    const runtime = load('https://cdn.jsdelivr.net/gh/aisteno/embed@latest/steno-chat.js');
    assert.deepEqual(runtime.attributes, {'data-id':'ercm','data-container':'#slot','data-language':'en','data-border-color':'#123'});
    assert.equal(runtime.nonce, 'fixture-nonce');
    assert.equal(runtime.crossOrigin, 'anonymous');
    assert.equal(runtime.referrerPolicy, 'no-referrer');
    assert.equal(runtime.integrity, undefined);
});

test('stable Pages entry points revalidate; pinned version paths remain immutable', async () => {
    const headers = await readFile(new URL('../_headers', import.meta.url), 'utf8');
    for (const file of ['steno-chat.js', 'steno-button.js', 'niro.js']) {
        assert.ok(headers.includes(`/${file}\n  Cache-Control: public, no-cache, max-age=0, must-revalidate`));
    }
    assert.ok(headers.includes('/v/*\n  Cache-Control: public, max-age=31536000, immutable'));
    assert.ok(!headers.includes('stale-while-revalidate'));
});

test('CDN purge accepts confirmed providers and rejects failed or incomplete results', () => {
    const path = '/gh/aisteno/embed@latest/steno-chat-runtime.js';
    const response = {status:'finished', paths:{[path]:{throttled:false, providers:{CF:true,FY:true}}}};
    validatePurge(response, path);
    for (const invalid of [
        {...response, status:'running'}, {status:'finished', paths:{}},
        {status:'finished', paths:{[path]:{providers:{CF:true,FY:false}}}},
        {status:'finished', paths:{[path]:{providers:{}}}},
    ]) assert.throws(() => validatePurge(invalid, path));
});
