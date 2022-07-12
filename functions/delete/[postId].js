export async function onRequest({env: {POSTS, IMG}, params: {postId}}) {
  try {
    await POSTS.delete(postId);
    await IMG.delete(postId + ".png"); //todo big big hack here..
    return new Response(1, {headers: {"Content-Type": "application/json"}});
  } catch (err) {
    return new Response(0, {headers: {"Content-Type": "application/json"}});
  }
}