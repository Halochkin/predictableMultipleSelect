function toggleAttribute(el, attr) {
    el.hasAttribute(attr) ? el.removeAttribute(attr) : el.setAttribute(attr, "");
}

export class EditList extends HTMLElement {

    #target;

    constructor() {
        super();
        this.attachShadow({mode: "open"});
        //language=HTML
        this.shadowRoot.innerHTML = `
            <style>
                :host(:not([active])) {
                    display: none;
                }

                :host {
                    display: inline-block;
                    border: 2px solid gray;
                    position: absolute;
                    left: var(--left);
                    top: var(--top);
                    width: var(--width);
                }

                ::slotted([selected]) {
                    background-color: yellow;
                }

                ::slotted(div) {
                    font-size: 1.5em;
                    padding: 10px;
                    font-family: "Roboto", sans-serif;
                }

                ::slotted(div:hover ) {
                    background-color: #70809014;
                }
            </style>
            <slot></slot>`;

        setTimeout(() => {
            //<edit-list do-click="open select" do-submit=close>  //has two attributes as default settings on construction.
            this.setAttribute("on-click", "select");

            // this.setAttribute("do-open", "open");
            // this.setAttribute("do-submit", "close");
            // this.setAttribute("on-click", "submit");
            this.setAttribute("no-selectstart", "");
            // this.setAttribute("co-keypress-enter", "submit");  co-keypress-enter="submit"
            //todo if we have a button, then that button should do re-submit=to this parent.
        }, 0);
    }

    get target() {
        return this.#target;
    }

    get key() {
        return this.getAttribute("key") || "id";
    }

    get oldSelection() {
        return this.#target ? [...this.#target.querySelectorAll("euro-song")].map(el => el.getAttribute(this.key)) : [];
    }

    get selection() {
        const assignedElements = this.shadowRoot.querySelector("slot").assignedElements({flatten: true});
        return [...assignedElements.filter(el => el.hasAttribute("selected"))].map(el => el.getAttribute(this.key));
    }

    open({target, relatedTarget = target.getRootNode().host.parentElement, relatedTargetQueries, isTrusted}) {
        // if (target !== this || target.hasAttribute("active"))
        //     return;
        const searchRequest = target.innerText;

        //todo: we can specify min request length. dispatch input event to close list when focusout
        if (searchRequest.length < 1 || !isTrusted )
            return this.close();

        this.innerHTML = '';
        this.#target = relatedTarget;
        this.targetQuery = relatedTargetQueries;
        this.style.setProperty("--left", relatedTarget.offsetLeft);
        this.style.setProperty("--top", relatedTarget.offsetTop + relatedTarget.offsetHeight);
        this.style.setProperty("--width", window.getComputedStyle(relatedTarget).width);

        const selectedSongs = [...Object.entries(state.songs)].filter(item => {
            for (const old of this.oldSelection) {
                if (item[0] === old)
                    return false;
            }
            return true
        });

        const filteredResults = selectedSongs.filter(item => item[1].toLowerCase().startsWith(searchRequest.toLowerCase()));
        if (!filteredResults.length)
            this.innerHTML = "<div>No results found</div>";
        else
            for (let [country, song] of filteredResults) {
                this.insertAdjacentHTML("beforeend", `<div country="${country}">${song}</div>`);
            }
        this.setAttribute("active", "");

    }

    select({target}) {
        if (target.parentNode !== this || target.innerText === "No results found")
            return;

        clearTimeout(window.listCloseTimeout);

        toggleAttribute(target, "selected");
        const editList = document.querySelector("edit-list");
        editList.dispatchEvent(new Event("submit"))
    }

    deselect({target, hostNode = target.getRootNode().host}) {
        this.#target = hostNode.parentElement;
        toggleAttribute(target, "selected");
        const targetInnerText = hostNode.getAttribute(this.key);
        const editList = document.querySelector("edit-list");
        const oldSelection = [...this.#target.querySelectorAll("euro-song")];
        let justDeselected = oldSelection.filter(el => el.getAttribute(this.key) === targetInnerText);
        this.#target.removeChild(justDeselected[0]);
        editList.dispatchEvent(new Event("submit"));
    }

    //todo: make new features or just use existing submit event
    async doPost(slug) {
        const postJson = await (await fetch(`/post/${slug}.json`)).json();

        //image isn't working here yet
    }

    close() {
        //todo this is a default action, so the oldValue is visible while the submit event is propagating
        this.#target = undefined;
        this.removeAttribute("active");
        this.style.removeProperty("--left");
        this.style.removeProperty("--top");
        this.style.removeProperty("--width");
        for (let option of this.children)
            option.removeAttribute("selected");
    }
}