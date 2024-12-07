export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const response = await fetch('https://api.github.com/repos/craftXplorer/claire/actions/workflows/build.yml/dispatches', {
                method: 'POST',
                headers: {
                  Accept: 'application/vnd.github+json',
                  Authorization: 'Bearer CLAIRE_PAT',
                  'User-Agent': 'HEY',
                  'X-GitHub-Api-Version': '2022-11-28'
                },
                body: '{"ref":"main"}'
            });
            res.status(200).json({ message: 'POST request sent!', status: response.status });
        } catch (error) {
            res.status(500).json({ error: 'Failed to send POST request', details: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
