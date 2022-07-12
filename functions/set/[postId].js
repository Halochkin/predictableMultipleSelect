import {FormDataPolyfish} from "../lib/FormDataPolyfish.js";

async function saveFile(slug, formData, postId, env, KV_FILETABLE_NAME) {
  const {body, headers} = formData[postId];
  const filename = `${slug}.${headers["Content-Type"].split("/")[1]}`;
  await env[KV_FILETABLE_NAME].put(filename, body, {metadata: headers});
  formData[postId] = `/${KV_FILETABLE_NAME}/${filename}`;
}

export async function onRequestPost({request, params: {postId: slug}, env}) {
  const formData = await FormDataPolyfish(request);
  await saveFile(slug, formData, "image", env, "IMG");
  await env.POSTS.put(slug, JSON.stringify(formData), {metadata: {title: formData.title, timestamp: Date.now()}});
  return new Response(JSON.stringify(formData));
}