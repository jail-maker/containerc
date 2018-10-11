'use strict';

const {spawn, spawnSync} = require('child_process');

module.exports = (dst) => {

    let result = spawnSync('/sbin/mount', ['-t', 'devfs', 'devfs', dst]);

    if (result.status !== 0)
        throw new Error(`Error execution mount devfs to "${dst}".`);

}
