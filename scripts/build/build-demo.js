/*
 * @Author: tackchen
 * @Date: 2022-08-03 21:07:04
 * @Description: Coding something
 */

const {
    resolveRootPath,
} = require('../utils');
const {build} = require('../rollup.base');


async function main () {

    await build({
        input: resolveRootPath('scripts/dev/index.ts'),
        output: resolveRootPath('docs/index.min.js'),
        format: 'iife',
    });
}

main();

