'use strict';

const { writeFileSync } = require('fs');
const Rule = require('./rule');

class ConfigFile {

    constructor(name, rules = {}) {

        this._name = name;
        this._rules = {};

        this._setRules(rules);

    }

    _setRules(rules) {

        for (let key in rules) {

            let value = rules[key];

            this.setRule({key, value});

        }

    }

    setRule({key, value}) {

        this._rules[key] = new Rule(key, value);
        return this;

    }

    accept(visitor) {

        visitor.visit(this);
        return this;

    }

    getRules() { return this._rules; }

    getName() { return this._name; }

    toString() {

        let rules = this._rules;
        let name = this._name;
        let ret = '';

        ret += `${name} {\n`;

        for (let key in rules) {

            let rule = rules[key];
            ret += `${rule.view}\n`;

        }

        ret += `}`;

        return ret;

    }

    save(path) {

        writeFileSync(path, this.toString(), { flags: 'w' });

    }

}

module.exports = ConfigFile;
