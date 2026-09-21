export default async function handler(req, res) {
    // 1. Отвечаем на preflight OPTIONS запросы
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    // 2. Разрешаем только GET запросы
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const targetUrl = req.query.url;
    
    // Защита: разрешаем только запросы к onlyoffice
    if (!targetUrl || !targetUrl.includes('onlyoffice.com')) {
        return res.status(403).send('Invalid URL');
    }

    try {
        // Извлекаем домен из целевого URL
        const targetUrlObj = new URL(targetUrl);
        
        // Формируем правильные заголовки для ONLYOFFICE
        const headers = {
            // Передаем API ключ, который прислал нам фронтенд
            'Authorization': req.headers.authorization || '',
            // КРИТИЧЕСКИ ВАЖНО: ONLYOFFICE определяет портал именно по этому заголовку
            'Host': targetUrlObj.host,
            'User-Agent': 'Vercel-Proxy/1.0'
        };

        // Делаем запрос к ONLYOFFICE
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
