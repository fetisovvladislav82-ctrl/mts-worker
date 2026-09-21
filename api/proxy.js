export default async function handler(req, res) {
    // 1. ЯВНО ОТВЕЧАЕМ НА OPTIONS (PREFLIGHT) ЗАПРОСЫ
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    // 2. Разрешаем только GET запросы для скачивания
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const targetUrl = req.query.url;
    
    // Защита: разрешаем только запросы к onlyoffice
    if (!targetUrl || !targetUrl.includes('onlyoffice.com')) {
        return res.status(403).send('Invalid URL');
    }

    try {
        // Удаляем заголовки, которые могут вызвать блокировку на стороне ONLYOFFICE
        const headers = { ...req.headers };
        delete headers['origin'];
        delete headers['referer'];
        delete headers['host'];

        // Делаем запрос к ONLYOFFICE от имени сервера Vercel
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: headers
        });

        const buffer = await response.arrayBuffer();
        
        // 3. Возвращаем файл браузеру с правильными CORS заголовками
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
        
        res.status(response.status).send(Buffer.from(buffer));
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Proxy Error: ' + error.message);
    }
}
