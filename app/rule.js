'use strict';

class Rule {

    constructor(key, value, view = '') {

        this.key = key;
        this.data = value;
        this.view = view;

    }

    toString() {

        return this.view;

    }

}

module.exports = Rule;
