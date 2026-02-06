// DevPro Toolkit - JSON Viewer Module
const JSONViewer = {
    format(input) {
        try {
            const parsed = typeof input === 'string' ? JSON.parse(input) : input;
            return {
                success: true,
                formatted: JSON.stringify(parsed, null, 2),
                parsed: parsed
            };
        } catch (e) {
            return {
                success: false,
                error: e.message,
                position: this.findErrorPosition(input, e.message)
            };
        }
    },

    findErrorPosition(input, errorMsg) {
        const match = errorMsg.match(/position (\d+)/);
        if (match) {
            return parseInt(match[1]);
        }
        return null;
    },

    minify(input) {
        try {
            const parsed = typeof input === 'string' ? JSON.parse(input) : input;
            return {
                success: true,
                minified: JSON.stringify(parsed)
            };
        } catch (e) {
            return {
                success: false,
                error: e.message
            };
        }
    },

    syntaxHighlight(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }

        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    },

    getStats(json) {
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;

        const countNodes = (obj) => {
            if (obj === null || typeof obj !== 'object') return 1;
            if (Array.isArray(obj)) {
                return 1 + obj.reduce((sum, item) => sum + countNodes(item), 0);
            }
            return 1 + Object.values(obj).reduce((sum, val) => sum + countNodes(val), 0);
        };

        const getDepth = (obj, depth = 0) => {
            if (obj === null || typeof obj !== 'object') return depth;
            if (Array.isArray(obj)) {
                return Math.max(depth, ...obj.map(item => getDepth(item, depth + 1)));
            }
            return Math.max(depth, ...Object.values(obj).map(val => getDepth(val, depth + 1)));
        };

        return {
            nodes: countNodes(parsed),
            depth: getDepth(parsed),
            size: JSON.stringify(parsed).length
        };
    }
};
