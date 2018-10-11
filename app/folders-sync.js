'use strict';

const { spawn } = require('child_process');

module.exports = (src, dst) => {

    return new Promise((res, rej) => {

        let stderr = '';
        let stdout = '';

        let child = spawn('rsync', ['-a', src, dst]);

        child.stdout.on('data', data => stdout += data);
        child.stderr.on('data', data => stderr += data);

        child.on('close', code => {

            if (code) rej(stderr);
            else res(stdout);

        })

    });

}
