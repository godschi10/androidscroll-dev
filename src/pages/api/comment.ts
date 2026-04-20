import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const { postId, name, email, content, parent } = await request.json();

  const auth = 'Basic ' + Buffer.from(
    `${import.meta.env.WP_USER}:${import.meta.env.WP_APP_PASS}`
  ).toString('base64');

  const res = await fetch('https://androidscroll.com/wp-json/wp/v2/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify({
      post: Number(postId),
      author_name: name,
      author_email: email,
      content,
      parent: Number(parent),
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
};