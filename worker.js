export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API: /api/comments
    if (url.pathname.startsWith('/api/comments')) {
      if (request.method === 'GET') {
        const stored = await env.COMMENTS.get('comments');
        const comments = stored ? JSON.parse(stored) : [];
        return new Response(JSON.stringify(comments), { headers: { 'Content-Type': 'application/json' } });
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const name = typeof body.name === 'string' ? body.name.trim() : '';
          const text = typeof body.text === 'string' ? body.text.trim() : '';
          const emailRaw = typeof body.email === 'string' ? body.email.trim() : '';
          const email = emailRaw && emailRaw.length <= 254 ? emailRaw : '';

          if (!text) {
            return new Response('Message required', { status: 400 });
          }

          const comment = {
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
            name: name || 'Anonymous',
            email: email || null,
            text,
            created_at: new Date().toISOString()
          };

          const stored = await env.COMMENTS.get('comments');
          const comments = stored ? JSON.parse(stored) : [];
          comments.push(comment);
          await env.COMMENTS.put('comments', JSON.stringify(comments));

          return new Response(JSON.stringify(comment), { status: 201, headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
          return new Response('Bad Request', { status: 400 });
        }
      }

      return new Response('Method Not Allowed', { status: 405 });
    }

    // Serve static assets uploaded by Wrangler
    try {
      return await env.ASSETS.fetch(request);
    } catch (err) {
      return new Response('Not found', { status: 404 });
    }
  }
};
