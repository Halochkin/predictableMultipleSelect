//  GET
export async function onRequestGet({env: {CMS_PRODUCTION, CMS_PREVIEW}}) {
  const commits = await CMS_PRODUCTION.list(); //newest first
  const key = commits.keys[0].name;
  let json = await CMS_PRODUCTION.get(key);
  const data = JSON.parse(json);
  for (let change of (await CMS_PREVIEW.list()).keys) {
    const key = change.name;
    let [props, time] = key.split("__");
    props = props.split(".");
    let metadata = change.metadata || JSON.parse(await CMS_PREVIEW.get(key));
    let d = data;
    while (props.length > 1)
      d = d[props.shift()];
    d[props[0]] = metadata;
  }
  json = JSON.stringify(data);
  return new Response(json, {headers: {"Content-Type": "application/json"}});
}


//  POST
import {FormDataPolyfish} from "./lib/FormDataPolyfish.js";

async function saveFile(slug, formData, postId, env, KV_FILETABLE_NAME) {
  const {body, headers} = formData[postId];
  const filename = `${slug}.${headers["Content-Type"].split("/")[1]}`;
  await env[KV_FILETABLE_NAME].put(filename, body, {metadata: headers});
  formData[postId] = `/${KV_FILETABLE_NAME}/${filename}`;
}

export async function onRequestPost({request, env: {CMS_PRODUCTION, CMS_PREVIEW}}) {
  const formData = await FormDataPolyfish(request);
  const timestamp = new Date().getTime();
  const key = Object.keys(formData)[0];
  const value = Object.values(formData)[0];
let res;
  if ((new TextEncoder().encode(value)).length < 1024) {
    res = await CMS_PREVIEW.put(key + "__" + timestamp, "", {metadata: JSON.parse(value)});
  } else {                         //todo put as json
    res = await CMS_PREVIEW.put(key + "__" + timestamp, value);
  }
  return new Response(res, {headers: {"Content-Type": "plain/txt"}});
}