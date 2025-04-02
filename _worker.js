export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const downloadUrl = decodeURIComponent(url.pathname.substring(1));

        if (!downloadUrl) {
            return new Response(JSON.stringify({ message: 'Missing download URL' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Validate if downloadUrl is a valid URL
        try {
            new URL(downloadUrl);
        } catch {
            return new Response(JSON.stringify({ message: 'Invalid download URL' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        try {
            const githubToken = env.GITHUB_TOKEN;
            const owner = env.GITHUB_OWNER;
            const repo = env.GITHUB_REPO;

            if (!githubToken || !owner || !repo) {
                throw new Error('Missing required environment variables');
            }

            // Use the validated repository dispatch API call
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/dispatches`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'User-Agent': 'Mozilla/5.0 (compatible; DownloadBot/1.0)',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        event_type: 'download_file',
                        client_payload: {
                            download_url: downloadUrl,
                            timestamp: new Date().toISOString()
                        }
                    })
                }
            );

            // Log response information for debugging
            console.log('GitHub API Response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (response.ok || response.status === 204) {
                return new Response(JSON.stringify({ 
                    success: true,
                    message: 'Workflow triggered successfully',
                    url: downloadUrl
                }), {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else {
                throw new Error(`Failed to trigger GitHub Action: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            console.error('Error:', error);
            return new Response(JSON.stringify({ 
                success: false,
                message: 'Server error',
                error: error.message
            }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};