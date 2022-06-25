import Cookies from 'js-cookie'
let worldMenu = null;
let worldMenuVisible = false;
let imageInput = null;

let isMobile = !!("ontouchstart" in window);

function qrPressed(_myAvatar, url) {
    let div = document.createElement("div");
    div.innerHTML = `<a id="link" target="_blank" rel="noopener noreferrer" href="${url}"></a>`;
    document.getElementById("hud").appendChild(div);
    let a = div.querySelector("#link");
    a.click();
    div.remove();
}

function savePressed(myAvatar) {
    let model = myAvatar.actor.wellKnownModel("ModelRoot");

    let div = document.createElement("a");

    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(model.saveData(), null, 4));

    div.setAttribute("href", dataStr);
    div.setAttribute("download", "scene.vrse");
    div.click();
    if (worldMenuVisible) {
        toggleMenu();
    }
}

function loadPressed(myAvatar) {
    if (!imageInput) {
        let input = document.createElement("div");
        input.innerHTML = `<input id="imageinput" type="file" accept="application/json;">`;
        imageInput = input.firstChild;

        imageInput.onchange = () => {
            for (const file of imageInput.files) {
                new Promise(resolve => {
                    let reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsBinaryString(file);
                }).then((data) => {
                    myAvatar.loadFromFile(data);
                })
            }
            imageInput.value = "";
        };
    }

    document.getElementById("hud").appendChild(imageInput);

    imageInput.click();
    if (worldMenuVisible) {
        toggleMenu();
    }
}

function connectPressed() {
    window.BehaviorViewManager.setURL("ws://localhost:9011");
    if (worldMenuVisible) {
        toggleMenu();
    }
}

function switchQRView(_myAvatar) {
    let qrDiv = worldMenu.querySelector("#qrDiv");
    let statsDiv = worldMenu.querySelector("#statsDiv");

    let cls = "statsHidden";

    if (qrDiv.classList.contains(cls)) {
        qrDiv.classList.toggle(cls, false);
        statsDiv.classList.toggle(cls, true);
    } else {
        qrDiv.classList.toggle(cls, true);
        statsDiv.classList.toggle(cls, false);
    }
}

function forceStop(myAvatar) {
    myAvatar.say("stopPresentation");
    if (worldMenuVisible) {
        toggleMenu();
    }
}

function initWorldMenu(badge) {
    let html = document.createElement("div");
    html.id = "worldMenu";
    html.classList.add("worldMenu");

    html.appendChild(badge);
    badge.id = "worldMenu-qr";
    badge.classList.add("menu-qr", "menu-item");

    if(Cookies.get('admin')==="true") {
        let buttons = `
<div id="worldMenu-save" class="menu-label menu-item">
    <span class="menu-label-text">Save</span>
    <div class="menu-icon save-icon"></div>
</div>
<div id="worldMenu-load" class="menu-label menu-item">
    <span class="menu-label-text">Load</span>
    <div class="menu-icon load-icon"></div>
</div>
<div id="worldMenu-connect" class="menu-label menu-item">
    <span class="menu-label-text">Connect</span>
    <div class="menu-icon connect-icon"></div>
</div>
<div id="worldMenu-full" class="menu-label menu-item">
    <span class="menu-label-text">FullScreen</span>
    <div class="menu-icon connect-icon"></div>
</div>
<div id="worldMenu-start" class="menu-label menu-item">
    <span class="menu-label-text">Start</span>
    <div class="menu-icon connect-icon"></div>
</div>
<div id="worldMenu-comes" class="menu-label menu-item">
    <span class="menu-label-text">Comes Here</span>
    <div class="menu-icon connect-icon"></div>
</div>
`.trim();

        let div = document.createElement("div");
        div.innerHTML = buttons;

        let save = div.querySelector("#worldMenu-save");
        let load = div.querySelector("#worldMenu-load");
        let connect = div.querySelector("#worldMenu-connect");
        let userscomes = div.querySelector("#worldMenu-comes");
        let fullscreen = div.querySelector("#worldMenu-full");
        let start = div.querySelector("#worldMenu-start");

        html.appendChild(save);
        html.appendChild(load);
        html.appendChild(connect);
        html.appendChild(userscomes);
        html.appendChild(fullscreen);
        html.appendChild(start);
    }else{
        let buttons = `
        <div id="worldMenu-comes" class="menu-label menu-item">
            <span class="menu-label-text">Comes Here</span>
            <div class="menu-icon connect-icon"></div>
        </div>
        <div id="worldMenu-full" class="menu-label menu-item">
            <span class="menu-label-text">FullScreen</span>
            <div class="menu-icon connect-icon"></div>
        </div>
        <div id="worldMenu-start" class="menu-label menu-item">
            <span class="menu-label-text">Start</span>
            <div class="menu-icon connect-icon"></div>
        </div>
            `.trim();

        let div = document.createElement("div");
        div.innerHTML = buttons;
        let userscomes = div.querySelector("#worldMenu-comes");
        let fullscreen = div.querySelector("#worldMenu-full");
        let start = div.querySelector("#worldMenu-start");
        html.appendChild(userscomes);
        html.appendChild(fullscreen);
        html.appendChild(start);
    }

    worldMenu = html;
    worldMenuVisible = false;
    document.getElementById("hud").appendChild(worldMenu);
}

function toggleMenu(myAvatar) {
    if (worldMenuVisible) {
        worldMenu.classList.remove("menuVisible");
        worldMenuVisible = false;
        return;
    }

    if (worldMenu.lastChild.id === "worldMenu-forceStop") {
        worldMenu.lastChild.remove();
    }

    if (myAvatar.actor.service("PlayerManager").presentationMode) {
        let presentation = `
<div id="worldMenu-forceStop" class="menu-label menu-item">
    <span class="menu-label-text">Stop Presentation</span>
</div>`.trim();

        let div = document.createElement("div");
        div.innerHTML = presentation;
        worldMenu.appendChild(div.firstChild);
    }

    let div;

    div = worldMenu.querySelector("#worldMenu-qr");
    div.onclick = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        if (evt.shiftKey || isMobile) {
            switchQRView(myAvatar);
            return;
        }
        qrPressed(myAvatar, window.location);
    }

    if(Cookies.get('admin')==="true") {
        div = worldMenu.querySelector("#worldMenu-save");
        div.onclick = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            savePressed(myAvatar);
        }

        div = worldMenu.querySelector("#worldMenu-load");
        div.onclick = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            loadPressed(myAvatar);
        }

        div = worldMenu.querySelector("#worldMenu-connect");
        div.onclick = () => connectPressed(myAvatar);

        div = worldMenu.querySelector("#worldMenu-forceStop");
        if (div) {
            div.onclick = () => forceStop(myAvatar);
        }
    }

    /*div = worldMenu.querySelector("#worldMenu-full");
    div.onclick = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        alert("fullscreen")
    }*/

    div = worldMenu.querySelector("#worldMenu-comes");
    div.onclick = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        window.comeToMe();
    }
    div = worldMenu.querySelector("#worldMenu-start");
    div.onclick = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        window.goHome();
    }

    worldMenuVisible = true;
    worldMenu.classList.add("menuVisible");
    return worldMenu;
}

export function setupWorldMenuButton(myAvatar, App, sessionId) {
    if (!worldMenu) {
        let ownerDiv = document.createElement("div");
        let statsDiv = document.createElement("div");
        statsDiv.id = "statsDiv";
        let qrDiv = document.createElement("div");
        qrDiv.id = "qrDiv";

        statsDiv.classList.add("statsHidden");

        ownerDiv.appendChild(qrDiv);
        ownerDiv.appendChild(statsDiv);

        App.root = ownerDiv;
        App.badge = false;
        App.qrcode = qrDiv;
        App.stats = statsDiv;
        App.makeSessionWidgets(sessionId);
        qrDiv.onclick = null;

        initWorldMenu(ownerDiv);
    }
    let worldMenuButton = document.querySelector("#worldMenuBttn");
    worldMenuButton.onclick = () => toggleMenu(myAvatar);
}
