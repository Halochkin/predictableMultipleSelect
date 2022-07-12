export async function onRequest({env: {POSTS}}) {
  const dataWithNameMetadata = await POSTS.list();
  return new Response(JSON.stringify(dataWithNameMetadata), {headers: {"Content-Type": "application/json"}});
}