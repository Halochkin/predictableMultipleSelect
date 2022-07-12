export async function onRequest({request, params: {post_type}, env: {IMG}}) {
  // const url = new URL(request.url);
  // const query = url.searchParams;
  const res = await IMG.getWithMetadata(post_type, {type: "arrayBuffer"});
  const {value, metadata} = res;
  console.log("santa", metadata);
  metadata.cf = {image: {fit: "contain", width: "80"}};
  console.log(metadata);
  return new Response(value, {headers: metadata});
}