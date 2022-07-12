import {EditList} from "./EditList.js";

customElements.define("edit-list", EditList);

import {ReAttr} from "https://cdn.jsdelivr.net/gh/orstavik/customAttributes/src/attributes/ReAttr.js";
import {OnAttr} from "https://cdn.jsdelivr.net/gh/orstavik/customAttributes/src/attributes/OnAttr.js";
import {PreventAttr} from "https://cdn.jsdelivr.net/gh/orstavik/customAttributes/src/attributes/PreventAttr.js";
import {CoAttr} from "https://cdn.jsdelivr.net/gh/orstavik/customAttributes/src/attributes/CoAttr.js";

customAttributes.define("re", ReAttr);
customAttributes.define("on", OnAttr);
customAttributes.define("no", PreventAttr);
customAttributes.define("co", CoAttr);

class AjaxCustomAttr extends Attr {
  async onEvent({target}) {
    console.log(target.selection);
    console.log(target.oldSelection);
    console.log(target.target);
    console.log(target.targetQuery);
    const body = new FormData();
    body.append("selected." + target.target.id, JSON.stringify([...target.oldSelection, ...target.selection]));//need to specify the name/value pair in the event.detail
    const result = await (await fetch(this.value, {method: 'POST', body})).text();
    console.log(result);
    //dispatch the result as a successful event, and then listen for this event to update the global state.
    const response = await fetch(this.value);
    const state = await response.json();
    document.body.dispatchEvent(new CustomEvent("state", {composed: true, bubbles: true, detail: state}));
    // renderCMS();
  }
}

customAttributes.define("customajax", AjaxCustomAttr, {sync: true});

class CmsRenderAttr extends Attr {
  onEvent({currentTarget: root, detail: state}) {
    root.querySelector("edit-list")?.remove();
    const editList = document.createElement("edit-list");
    editList.setAttribute("key", "country");
    editList.setAttribute("customajax-submit", "/CMS_DB");
    root.append(editList);
    for (let [country, song] of Object.entries(state.songs)) {
      editList.insertAdjacentHTML("beforeend", `<div country="${country}">${song}</div>`);
    }

//2. add the co-click on all the elements that match our criteria
    const euroList = root.querySelectorAll("euro-list");
    for (let el of euroList) {
      el.setAttribute("re-click", "edit-list");
    }
  }
}

customAttributes.define("rendercms", CmsRenderAttr, {sync: true});

document.body.setAttribute("rendercms-state","");