function toHtml({title, short, image}) {
  //language=HTML
  return `
    <h1>${title}</h1>
    <p>${short}</p>
    <img src="${image}" alt="image for post">
  `;
}

export async function onRequest({params: {post_type}, env}) {
  const [postId, type] = post_type.split(".");
  const post = await env.POSTS.get(postId);
  if (type?.toLowerCase() === "html")
    return new Response(toHtml(JSON.parse(post)), {headers: {"Content-Type": "text/html"}});
  return new Response(post, {headers: {"Content-Type": "application/json"}});
}