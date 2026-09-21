export default async function handler(req, res) {
    const targetUrl = req.query.url;
    
    if (!targetUrl || !targetUrl.includes('onlyoffice.com')) {
        return res.status(403).send('Invalid URL');
    }

    const headers = { ...req.headers };
    delete headers['origin'];
    delete headers['host'];

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: headers
        });

        const buffer = await response.arrayBuffer();
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
        res.status(response.status).send(Buffer.from(buffer));
    } catch (error) {
        res.status(500).send('Proxy Error: ' + error.message);
    }
}
