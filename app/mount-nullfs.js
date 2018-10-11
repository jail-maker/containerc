'use strict';

const {spawn, spawnSync} = require('child_process');

module.exports = (src, dst, options = []) => {

    options = options.length ? ['-o', ...options] : options;

    let result = spawnSync('/sbin/mount_nullfs', [...options, src, dst]);

    if (result.status !== 0)
        throw new Error(`Error execution mount nullfs from "${src}" to "${dst}".`);

}
