import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CzDGB-mp.mjs';
import { manifest } from './manifest_B-kAWePX.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/client.astro.mjs');
const _page2 = () => import('./pages/expense.astro.mjs');
const _page3 = () => import('./pages/inventory.astro.mjs');
const _page4 = () => import('./pages/provider.astro.mjs');
const _page5 = () => import('./pages/repair.astro.mjs');
const _page6 = () => import('./pages/sale.astro.mjs');
const _page7 = () => import('./pages/seller.astro.mjs');
const _page8 = () => import('./pages/technician.astro.mjs');
const _page9 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["../../node_modules/.bun/astro@5.16.6+1fb4c65d43e298b9/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/client/index.astro", _page1],
    ["src/pages/expense/index.astro", _page2],
    ["src/pages/inventory/index.astro", _page3],
    ["src/pages/provider/index.astro", _page4],
    ["src/pages/repair/index.astro", _page5],
    ["src/pages/sale/index.astro", _page6],
    ["src/pages/seller/index.astro", _page7],
    ["src/pages/technician/index.astro", _page8],
    ["src/pages/index.astro", _page9]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "32bd41f0-5fc3-4b5c-948f-a47aa83b0160",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
