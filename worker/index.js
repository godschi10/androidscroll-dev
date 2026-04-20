export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://androidscroll.com',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const { postId, name, email, content, parent } = await request.json();

    const auth = 'Basic ' + btoa(`${env.WP_USER}:${env.WP_APP_PASS}`);

    const res = await fetch('https://androidscroll.com/wp-json/wp/v2/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
      },
      body: JSON.stringify({
        post: postId,
        author_name: name,
        author_email: email,
        content,
        parent: parent || 0,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
