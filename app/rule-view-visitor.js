'use strict';

class RuleViewVisitor {

    visit(configFileObj) {

        let rules = configFileObj.getRules();

        for (let key in rules) {

            let rule = rules[key];
            let type = typeof(rule.data);

            if (type === 'boolean') {

                rule.view = rule.data ? `  ${rule.key};` : '';

            } else if (Array.isArray(rule.data)) {

                let strings = rule.data.map(item => {

                    let operator = rule.data.length === 1 ? '=' : '+=';

                    return `  ${rule.key} ${operator} "${item}";`;

                });

                rule.view = strings.join('\n');

            } else {

                rule.view = `  ${rule.key} = "${rule.data}";`;

            }

        }

    }

}

module.exports = new RuleViewVisitor;
