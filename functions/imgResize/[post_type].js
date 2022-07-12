export async function onRequest({request, params: {post_type}}) {
  try {
    const fullHost = request.url.split("/").slice(0,3).join("/") + "/";
    return await fetch(fullHost + "/img/" + post_type, {
      cf: {
        image: {
          fit: "contain",
          width: 80,
          height: 80
        }
      }
    });
  } catch (err) {
    return new Response(err.toString());
  }
}