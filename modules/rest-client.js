// DevPro Toolkit - REST Client Module
const RESTClient = {
    async sendRequest(options) {
        const { method, url, headers = {}, body = null } = options;

        const startTime = performance.now();

        try {
            const fetchOptions = {
                method: method.toUpperCase(),
                headers: { ...headers }
            };

            if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
                if (!headers['Content-Type']) {
                    fetchOptions.headers['Content-Type'] = 'application/json';
                }
            }

            const response = await fetch(url, fetchOptions);
            const endTime = performance.now();

            let responseBody;
            const contentType = response.headers.get('Content-Type') || '';

            if (contentType.includes('application/json')) {
                responseBody = await response.json();
            } else {
                responseBody = await response.text();
            }

            const result = {
                success: true,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: responseBody,
                time: Math.round(endTime - startTime),
                size: JSON.stringify(responseBody).length
            };

            // Save to history
            await this.addToHistory({
                ...options,
                timestamp: Date.now(),
                status: response.status
            });

            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message,
                time: Math.round(performance.now() - startTime)
            };
        }
    },

    async getHistory() {
        return await Storage.getRestHistory();
    },

    async addToHistory(request) {
        const history = await Storage.getRestHistory();
        history.unshift(request);
        await Storage.saveRestHistory(history);
    },

    async clearHistory() {
        await Storage.saveRestHistory([]);
    },

    parseHeaders(headerString) {
        const headers = {};
        if (!headerString) return headers;

        headerString.split('\n').forEach(line => {
            const [key, ...value] = line.split(':');
            if (key && value.length) {
                headers[key.trim()] = value.join(':').trim();
            }
        });

        return headers;
    },

    formatHeaders(headers) {
        return Object.entries(headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
    },

    getStatusColor(status) {
        if (status >= 200 && status < 300) return 'success';
        if (status >= 300 && status < 400) return 'warning';
        return 'danger';
    }
};
