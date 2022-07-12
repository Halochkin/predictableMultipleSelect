export function doInnerTextEditable() {
    let element = this.shadowRoot.querySelector("span");
    let oldValue = element.innerText;
    let lastTimeout;

    if (element.hasAttribute("contenteditable"))
        return;

    element.setAttribute("contenteditable", "true");

    element.innerText = "";
    element.focus();
    element.setAttribute("active-editing", "");


    function onKeypress(e) {
        if (e.code === "Enter") {
            e.preventDefault();
            return;
        }
        element.setAttribute("active-editing", "");
        let timeout = setTimeout(() => element.removeAttribute("active-editing"), 2000);
        clearTimeout(lastTimeout);
        lastTimeout = timeout;
    }

    element.addEventListener("keypress", onKeypress);

    element.addEventListener("focusout", e => {
        element.removeEventListener("keypress", onKeypress);
        let newValue = element.innerText;
        element.innerText = oldValue;
        window.listCloseTimeout = setTimeout(() => element.dispatchEvent(new Event("input")), 300);
        element.dispatchEvent(new CustomEvent("edit-end", {detail: newValue}));
        element.removeAttribute("contenteditable");
    }, {once: true})
}