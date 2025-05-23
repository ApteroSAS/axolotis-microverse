// Copyright 2022 by Croquet Corporation, Inc. All Rights Reserved.
// https://croquet.io
// info@croquet.io

import { App } from "@croquet/worldcore-kernel";

// shared prefix for shell messages
const PREFIX = "croquet:microverse:";

let shell;

export function startShell() {
    shell = new Shell();
}

class Shell {
    constructor() {
        const canonicalUrl = shellToCanonicalURL(location.href);
        if (canonicalUrl !== location.href) {
            console.log("shell: redirecting to canonical URL", canonicalUrl);
            location.href = canonicalUrl; // causes reload
        }
        console.log("shell: starting");
        this.frames = new Map(); // portalId => { frame, owningFrame, ownedFrames, isMicroverse, ?frameTypeArgs, ?frameTypeInterval }
        this.portalData = new Map(); // portalId => portalData
        this.awaitedFrameTypes = {}; // for coordinating a jump between frames
        this.awaitedRenders = {}; // for coordinating render of primary and secondaries
        // ensure that we have a session and password
        App.autoSession();
        App.autoPassword();
        const primaryId = this.primaryFrameId = this.addFrame(null, App.sessionURL);
        const primary = this.primaryFrame;
        const portalURL = frameToPortalURL(primary.src, primaryId);
        window.history.replaceState({
            portalId: primaryId,
        }, null, portalURL);
        setTitle(portalURL);
        // remove HUD from DOM in shell
        const hud = document.getElementById("hud");
        hud.parentElement.removeChild(hud);
        const shellHud = document.getElementById("shell-hud");
        shellHud.classList.toggle("is-shell", true);
        // TODO: create HUD only when needed?

        window.addEventListener("message", e => {
            if (e.data?.message?.startsWith?.(PREFIX)) {
                const cmd = e.data.message.substring(PREFIX.length);
                for (const [portalId, { frame }] of this.frames) {
                    if (e.source === frame.contentWindow) {
                        this.receiveFromPortal(portalId, frame, cmd, e.data);
                        return;
                    }
                }
                console.warn(`shell: ignoring ${cmd} from removed frame`);
            }
        });

        // user used browser's back/forward buttons
        window.addEventListener("popstate", e => {
            let { portalId } = e.state;
            let frame = this.frameEntry(portalId)?.frame;
            // user may have navigated too far, try to make that work
            if (!frame) {
                const portalURL = frameToPortalURL(shellToCanonicalURL(location.href));
                for (const [p, { frame: f }] of this.frames) {
                    if (frameToPortalURL(f.src) === portalURL) {
                        frame = f;
                        portalId = p;
                        break;
                    }
                }
            }
            // if we don't have an iframe for this url, we jump there
            // (could also try to load into an iframe but that might give us trouble)
            if (!frame) location.reload();
            // we have an iframe, so we enter it
            const portalURL = frameToPortalURL(frame.src);
            if (portalURL === shellToCanonicalURL(location.href)) {
                this.activateFrame(portalId, false); // false => don't push state
                setTitle(portalURL);
            } else {
                console.warn(`shell: popstate location=${location}\ndoes not match portal-${portalId} frame.src=${frame.src}`);
            }
        });
        if(document.getElementById("fullscreenBttn")) {
        this.fullscreenBttn = document.getElementById("fullscreenBttn");
        this.fullscreenBttn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();

                if (e.shiftKey) {
                    document.body.classList.toggle("tilt");
                    return;
                }

                if (!document.fullscreenElement) {
                    // If the document is not in full screen mode
                    // make the document full screen
                    document.body.requestFullscreen();
                } else {
                    // Otherwise exit the full screen
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            }
        }
        // joystick sends events into primary frame
        this.capturedPointers = {};
        this.joystick = document.getElementById("joystick");
        this.knob = document.getElementById("knob");
        this.trackingknob = document.getElementById("trackingknob");

        this.knobStyle = window.getComputedStyle(this.knob);
        window.onresize = () => this.adjustJoystickKnob();

        if (!document.head.querySelector("#joystick-css")) {
            let css = document.createElement("link");
            css.rel = "stylesheet";
            css.type = "text/css";
            css.id = "joystick-css";
            css.onload = () => this.adjustJoystickKnob();
            css.href = "./assets/css/joystick.css";
            document.head.appendChild(css);
        }

        this.releaseHandler = (e) => {
            for (let k in this.capturedPointers) {
                this.trackingknob.releasePointerCapture(k);
            }
            this.capturedPointers = {};
            this.endMMotion(e);
        };
        this.trackingknob.onpointerdown = (e) => {
            if (e.pointerId !== undefined) {
                this.capturedPointers[e.pointerId] = "hiddenKnob";
                this.trackingknob.setPointerCapture(e.pointerId);
            }
            this.startMMotion(e); // use the knob to start
        };
        //this.trackingknob.onpointerenter = (e) => console.log("shell: pointerEnter")
        // this.trackingknob.onpointerleave = (e) => this.releaseHandler(e);
        this.trackingknob.onpointermove = (e) => this.updateMMotion(e);
        this.trackingknob.onpointerup = (e) => this.releaseHandler(e);
        this.trackingknob.onpointercancel = (e) => this.releaseHandler(e);
        this.trackingknob.onlostpointercapture = (e) => this.releaseHandler(e);
    }

    adjustJoystickKnob() {
        let radius = (parseFloat(this.knobStyle.width) / 2) || 30;
        this.trackingknob.style.transform = "translate(0px, 0px)";
        this.knob.style.transform = `translate(${radius}px, ${radius}px)`;
    }

    frameEntry(frameId) {
        return this.frames.get(frameId);
    }

    frameFromId(frameId) {
        return this.frameEntry(frameId)?.frame;
    }

    portalId(targetFrame) {
        // exhaustive search through two entries won't take long
        for (const [portalId, { frame }] of this.frames) {
            if (frame === targetFrame) return portalId;
        }
        return null;
    }

    get primaryFrame() { return this.frameFromId(this.primaryFrameId) }

    addFrame(owningFrameId, portalURL) {
        // returns the portalId for the new frame
        if (this.frames.size >= 4) throw Error("shell: refusing to create more than 4 frames (this indicates a portal bug)");
        let portalId;
        do { portalId = Math.random().toString(36).substring(2, 15); } while (this.frames.has(portalId));
        const frame = document.createElement("iframe");
        frame.src = portalToFrameURL(portalURL, portalId);
        frame.style.zIndex = -this.frames.size; // put new frame behind all other frames
        frame.style.setProperty('--tilt-z', `${this.frames.size * -200}px`);
        const frameEntry = {
            frame,
            owningFrame: owningFrameId,
            ownedFrames: new Set()  // of frame ids
        };
        if (owningFrameId) this.frameEntry(owningFrameId)?.ownedFrames.add(portalId);
        this.frames.set(portalId, frameEntry);
        document.body.appendChild(frame);
        this.sendFrameType(portalId);
        // console.log("shell: added frame", portalId, portalURL);
        return portalId;
    }

    removeFrame(portalId) {
        // sent to secondary frame on "portal-close" message, or in activateFrame
        // if the secondary is not owned.  also sent recursively to frames owned
        // by a frame that's being removed here.
        const frameEntry = this.frameEntry(portalId);
        if (!frameEntry) return; // already gone

        const { frame, owningFrame, ownedFrames } = frameEntry;
        if (owningFrame) {
            this.frameEntry(owningFrame)?.ownedFrames.delete(portalId);
            frameEntry.owningFrame = null;   // indicates frame should be removed
        }
        if (frame !== this.primaryFrame) {
            console.log(`shell: removing frame ${portalId}`);
            frame.remove();
            this.frames.delete(portalId);
            for (const fId of ownedFrames.values()) {
                this.removeFrame(fId);
            }
            this.sortFrames(this.primaryFrame); // reassign z-indexes
        } else {
            // primary frame is no longer owned,
            // so it will be removed when switching to another frame
            console.log(`shell: primary frame ${portalId} is no longer owned`);
        }
    }

    sortFrames(mainFrame, portalFrame) {
        // we don't really support more than two frames yet,
        // so for now we just make sure those two frames are on top
        const sorted = Array.from(this.frames.values()).map(e => e.frame).sort((a, b) => {
            if (a === mainFrame) return -1;
            if (b === mainFrame) return 1;
            if (a === portalFrame) return -1;
            if (b === portalFrame) return 1;
            return a.zIndex - b.zIndex;
        });
        for (let i = 0; i < sorted.length; i++) {
            const { style } = sorted[i];
            style.zIndex = -i;
            style.display = '';
            style.setProperty('--tilt-z', `${i * -200}px`);
        }
    }

    receiveFromPortal(fromPortalId, fromFrame, cmd, data) {
        // console.log(`shell: received from ${fromPortalId}: ${JSON.stringify(data)}`);
        switch (cmd) {
            case "frame-ready": {
                const expectedFrameType = fromPortalId === this.primaryFrameId ? "primary" : "secondary";
                if (data.frameType !== expectedFrameType) {
                    console.log(`ignoring ${fromPortalId} frame-ready (${data.frameType}) when expecting ${expectedFrameType}`);
                    return;
                }
                const frameEntry = this.frameEntry(fromPortalId);
                if (!frameEntry) return; // somehow gone

                frameEntry.isMicroverse = true;
                break;
            }
            case "avatar-ready": {
                // the avatar has been created; player's inWorld flag has been set;
                // the frame has frozen rendering.
                // however, there is a chance that the primary/secondary status of the
                // frame has changed since the frame-type message was dispatched.  if that
                // has happened, we ignore this response; frame-type will be sent again.
                const expectedFrameType = fromPortalId === this.primaryFrameId ? "primary" : "secondary";
                if (data.frameType !== expectedFrameType) {
                    console.log(`ignoring ${fromPortalId} avatar-ready (${data.frameType}) when expecting ${expectedFrameType}`);
                    return;
                }
                const frameEntry = this.frameEntry(fromPortalId);
                if (!frameEntry) return; // somehow gone

                frameEntry.isMicroverse = true; // but ought to be true already
                clearInterval(frameEntry.frameTypeInterval);
                frameEntry.frameTypeInterval = null;
                // as part of activating a new primary, we wait until all frames are
                // frozen (which sending this message also implies).
                // once all are ready, we send release-freeze to the primary.
                // it will then (re)start rendering.
                if (this.awaitedFrameTypes[fromPortalId]) {
                    delete this.awaitedFrameTypes[fromPortalId];
                    if (Object.keys(this.awaitedFrameTypes).length === 0) {
                        this.sendToPortal(this.primaryFrameId, "release-freeze");
                    }
                }
                return;
            }
            case "portal-open":
                // if there already is a portalId then replace its url
                if (data.portalId) {
                    const url = portalToFrameURL(data.portalURL, data.portalId);
                    const targetFrame = this.frameEntry(data.portalId)?.frame;
                    if (targetFrame && portalToFrameURL(targetFrame.src, data.portalId) !== url) {
                        console.warn("shell: portal-open", data.portalId, "replacing", targetFrame.src, "with", url);
                        targetFrame.src = url;
                    }
                    return;
                }
                // otherwise find an unowned frame for the URL, or create a new one
                let targetFrameId = this.findFrame(data.portalURL, f => !f.owningFrame);
                if (!targetFrameId) targetFrameId = this.addFrame(fromPortalId, data.portalURL);
                else {
                    this.frameEntry(targetFrameId).owningFrame = fromPortalId;
                    this.frameEntry(fromPortalId).ownedFrames.add(targetFrameId);
                }
                this.sendToPortal(fromPortalId, "portal-opened", { portalId: targetFrameId });
                if (fromPortalId === this.primaryFrameId) {
                    this.sortFrames(this.primaryFrame, this.frameFromId(targetFrameId));
                }
                return;
            case "portal-close":
                this.removeFrame(data.portalId);
                return;
            case "portal-update":
                // the avatar in the primary world is reporting the presence and movement
                // of a portal (eventually, potentially many portals).
                if (fromPortalId !== this.primaryFrameId) {
                    console.log(`ignoring ${fromPortalId} portal-update because it's no longer primary`);
                    return;
                }
                this.awaitedRenders = {};
                data.portalSpecs.forEach(spec => {
                    // spec is set in portal.updatePortalCamera; it only includes portalId and cameraMatrix
                    const { portalId, cameraMatrix } = spec;
                    this.sendToPortal(portalId, "portal-camera-update", { cameraMatrix });

                    // if it's going to render (there's a camera matrix, and we're not
                    // still waiting to hear from the avatar), set a flag to wait for it.
                    const frameEntry = this.frameEntry(portalId);
                    if (frameEntry && !frameEntry.frameTypeInterval && cameraMatrix !== null) this.awaitedRenders[portalId] = true;

                    // in case the secondary avatar isn't ready yet, remember cameraMatrix
                    // so it can be attached to the "frame-type" message we'll be sending it
                    // repeatedly until the avatar responds
                    this.portalData.set(portalId, cameraMatrix);
                });

                // in case the through-portal world's rendering is slow, only request
                // a new render if the previous one has completed or timed out
                if (!this.portalRenderTimeout && Object.keys(this.awaitedRenders).length) {
                    // don't let the through-portal world delay the outer world's rendering
                    // indefinitely
                    this.portalRenderTimeout = setTimeout(() => {
                        console.log("shell: portal render timed out");
                        delete this.portalRenderTimeout;
                        this.awaitedRenders = {};
                        this.manuallyRenderPrimaryFrame();
                    }, 200); // intended to be long enough to show something's wrong, but still keep going
                }
                return;
            case "portal-world-rendered":
                if (this.portalRenderTimeout && this.awaitedRenders[fromPortalId]) {
                    delete this.awaitedRenders[fromPortalId];
                    if (Object.keys(this.awaitedRenders).length === 0) {
                        clearTimeout(this.portalRenderTimeout);
                        delete this.portalRenderTimeout;
                        this.manuallyRenderPrimaryFrame();
                    }
                }
                return;
            case "primary-rendered":
                if (fromPortalId === this.primaryFrameId) {
                    if (this.pendingSortFrames) {
                        if (this.pendingSortFrames) {
                            this.sortFrames(...this.pendingSortFrames);
                            delete this.pendingSortFrames;
                        }
                    }
                } else {
                    console.warn(`shell: ignoring primary-rendered from non-primary ${fromPortalId}`);
                }
                return;
            case "portal-enter":
                if (fromPortalId === this.primaryFrameId) {
                    this.activateFrame(data.portalId, true, data.transferData); // true => push state
                } else {
                    console.warn("shell: ignoring portal-enter from non-primary portal-" + fromPortalId);
                }
                return;
            case "world-enter":
                // transferData has the same information as sent for portal-enter, plus
                // the "following" property - a token that we use to find the leader.
                // the url also appears as data.portalURL
                if (fromPortalId === this.primaryFrameId) {
                    let targetFrameId = this.findFrame(data.portalURL);
                    if (!targetFrameId) { // might happen after back/forward navigation
                        console.log("shell: world-enter creating frame for", data.portalURL);
                        targetFrameId = this.addFrame(this.primaryFrameId, data.portalURL);
                    }
                    this.activateFrame(targetFrameId, true, data.transferData); // true => push state
                } else {
                    console.warn("shell: ignoring world-enter from non-primary portal-" + fromPortalId);
                }
                return;
            case "hud":
                let joystickFlag = data.joystick;
                let fullscreenFlag = data.fullscreen;
                if (joystickFlag !== undefined && this.joystick) {
                    if (joystickFlag) {
                        this.joystick.style.removeProperty("display");
                    } else {
                        this.joystick.style.setProperty("display", "none");
                    }
                }
                if (fullscreenFlag !== undefined && this.fullscreenBttn) {
                    if (fullscreenFlag) {
                        this.fullscreenBttn.style.removeProperty("display");
                    } else {
                        this.fullscreenBttn.style.setProperty("display", "none");
                    }
                }
                return;
            default:
                console.warn(`shell: received unknown command "${cmd}" from portal-${fromPortalId}`, data);
        }
    }

    manuallyRenderPrimaryFrame() {
        const acknowledgeReceipt = !!this.pendingSortFrames;
        this.sendToPortal(this.primaryFrameId, "sync-render-now", { acknowledgeReceipt });
    }

    findFrame(portalURL, filterFn = null) {
        portalURL = portalToFrameURL(portalURL, "");
        // find an existing frame for this portalURL, which may be partial,
        // in particular something loaded from a default spec (e.g. ?world=portal1)
        outer: for (const [portalId, frameEntry] of this.frames) {
            if (filterFn && !filterFn(frameEntry)) continue;

            const { frame } = frameEntry;
            // could be the exact url
            if (frame.src === portalURL) return portalId;
            // or just needs to be expanded
            const url = new URL(portalURL, frame.src);
            if (frame.src === url.href) return portalId;
            // origin and path must match (index.html was removed earlier)
            const frameUrl = new URL(frame.src);
            if (frameUrl.origin !== url.origin) continue;
            if (frameUrl.pathname !== url.pathname) continue;
            // some params must match
            for (const [key, value] of url.searchParams) {
                const frameValue = frameUrl.searchParams.get(key);
                frameUrl.searchParams.delete(key);
                // for "portal" and "anchor" params, empty values match
                if ((key === "portal" || key === "anchor") && (!value || !frameValue)) continue;
                // for "debug" param, any value matches
                if (key === "debug") continue;
                // for other params, exact match is required
                if (frameValue !== value) continue outer;
            }
            // if frameUrl has any remaining params, it doesn't match
            if (frameUrl.searchParams.toString() !== "") continue;
            //  hash params have to match exactly
            const urlHashParams = new URLSearchParams(url.hash.slice(1));
            const frameHashParams = new URLSearchParams(frameUrl.hash.slice(1));
            urlHashParams.sort();
            frameHashParams.sort();
            if (urlHashParams.toString() !== frameHashParams.toString()) continue;
            // if we get here, we have a match
            return portalId;
        }
        return null;
    }

    sendToPortal(toPortalId, cmd, data = {}) {
        const frame = this.frameFromId(toPortalId);
        if (frame) {
            data.message = `${PREFIX}${cmd}`;
            // console.log(`shell: to portal-${toPortalId}: ${JSON.stringify(data)}`);
            frame.contentWindow?.postMessage(data, "*");
        } else {
            console.warn(`shell: sending "${cmd}" to portal-${toPortalId} failed: portal not found`);
        }
    }

    sendFrameType(frameId, spec = null) {
        // this is sent by:
        //   - addFrame for a new frame, with spec undefined.
        //   - activateFrame to a primary that is becoming secondary, with spec
        //     { portalURL } - though it's not clear that anyone's going to look at that.
        //   - activateFrame to a secondary that is becoming primary, with spec
        //     the transferData object prepared by avatar.specForPortal (with translation,
        //     rotation, avatar cardData etc) for a "portal-enter" or "world-enter".
        //     that spec is examined by avatar.frameTypeChanged.
        const frameType = !this.primaryFrameId || this.primaryFrameId === frameId ? "primary" : "secondary";
        const frameEntry = this.frameEntry(frameId);
        frameEntry.frameTypeArgs = { frameType, spec };
        if (frameEntry.frameTypeInterval) return; // we're already polling.  latest args will be used.

        const pollingStart = Date.now();
        frameEntry.frameTypeInterval = setInterval(() => {
            if (!this.frameEntry(frameId)) {
                console.log(`shell: abandoning "frame-type" send for removed portal-${frameId}`);
                clearInterval(frameEntry.frameTypeInterval);
                return;
            }
            // under normal circs the frame will respond within 100ms.  we give it a
            // super-generous 20s (because 2s turned out not to be enough, in some browser
            // situations) before deciding that this really really isn't looking like a
            // microverse frame.
            if (Date.now() - pollingStart > 20000 && !frameEntry.isMicroverse) {
                console.log(`shell: abandoning "frame-type" send for timed-out portal-${frameId}`);
                clearInterval(frameEntry.frameTypeInterval);
                return;
            }

            // there are three listeners to the frame-type message:
            //   1. the frame itself (frame.js)
            //   2. the avatar (avatar.js)
            //   3. any portal that resides within the frame (portal.js)
            // the avatar only gets constructed after joining the session,
            // so we keep sending this message until the avatar is there,
            // receives the next message send, then sends "frame-type-received"
            // which clears this interval.
            const frameArgs = frameEntry.frameTypeArgs;
            // if this is a secondary world, and we have a record of a through-portal
            // camera location as supplied by the primary, send it to the world along
            // with the frame type (normally it's sent in a portal-camera-update message,
            // but we need to ensure that a frame that's just waking up doesn't hear
            // portal-camera-update before it's heard frame-type).
            if (frameArgs.frameType === "secondary") {
                const cameraMatrix = this.portalData.get(frameId);
                if (cameraMatrix) frameArgs.cameraMatrix = cameraMatrix;
            }
            this.sendToPortal(frameId, "frame-type", frameArgs);
            // console.log(`shell: send frame type "${frameArgs.frameType}" to portal-${frameId}`);
        }, 200);
    }

    activateFrame(toPortalId, pushState = true, transferData = null) {
        // sent on receipt of messages "portal-enter" and "world-enter", and on window
        // event "popstate"
        const frameEntry = this.frameEntry(toPortalId);
        if (!frameEntry.isMicroverse) {
            window.location.href = frameEntry.frame.src;
            return;
        }

        const fromFrameId = this.primaryFrameId;
        const fromFrame = this.primaryFrame;
        const toFrame = this.frameFromId(toPortalId);
        const portalURL = frameToPortalURL(toFrame.src, toPortalId);

        // TODO: a cleaner, more general way of doing this
        this.pendingSortFrames = [ toFrame, fromFrame ];
        if (this.pendingSortTimeout) clearTimeout(this.pendingSortTimeout);
        this.pendingSortTimeout = setTimeout(() => {
            if (this.pendingSortFrames) {
                console.warn("sorting frames after timeout");
                this.sortFrames(...this.pendingSortFrames);
                delete this.pendingSortFrames;
            }
        }, 2000);

        if (transferData && !transferData.crossingBackwards) fromFrame.style.display = 'none';

        if (pushState) try {
            window.history.pushState({
                portalId: toPortalId,
            }, null, portalURL);
        } catch (e) {
            // probably failed because portalURL has a different origin
            // print error only if same origin
            if (new URL(portalURL, location.href).origin === window.location.origin) {
                console.error(e);
            }
            // we could reload the page but that would be disruptive
            // instead, we stay on the same origin but change the URL
            window.history.pushState({
                portalId: toPortalId,
            }, null, portalToShellURL(portalURL));
        }
        setTitle(portalURL);
        this.primaryFrameId = toPortalId;
        this.portalData.delete(toPortalId); // don't hang on to where the avatar entered
        this.awaitedRenders = {}; // don't act on any secondary renders that are in the pipeline
        this.awaitedFrameTypes = {};

        if (!this.frameEntry(fromFrameId).owningFrame) {
            console.log(`shell: removing unowned secondary frame ${fromFrameId}`);
            this.removeFrame(fromFrameId);
        } else {
            console.log(`shell: sending frame-type "secondary" to portal-${fromFrameId}`, { portalURL });
            this.sendFrameType(fromFrameId, { portalURL }); // portalURL seems redundant, but supplying some non-null spec is important (see avatar "frame-type" handling)
            this.awaitedFrameTypes[fromFrameId] = true;
        }
        console.log(`shell: sending frame-type "primary" to portal-${toPortalId}`, transferData);
        this.primaryFrame.focus();
        this.sendFrameType(toPortalId, transferData);
        this.awaitedFrameTypes[toPortalId] = true;

        if (this.awaitedFramesTimeout) clearTimeout(this.awaitedFramesTimeout);
        this.awaitedFramesTimeout = setTimeout(() => {
            if (Object.keys(this.awaitedFrameTypes).length) {
                console.warn("releasing freeze after timeout");
                this.awaitedFrameTypes = {};
                this.sendToPortal(this.primaryFrameId, "release-freeze");
            }
        }, 2000);

        if (this.activeMMotion) {
            const { dx, dy } = this.activeMMotion;
            this.sendToPortal(this.primaryFrameId, "motion-start", { dx, dy });
        }
    }

    // mouse motion via joystick element

    startMMotion(e) {
        e.preventDefault();
        e.stopPropagation();
        this.knobX = e.clientX;
        this.knobY = e.clientY;
        this.activeMMotion = { dx: 0, dy: 0 };
        this.sendToPortal(this.primaryFrameId, "motion-start");
    }

    endMMotion(e) {
        e.preventDefault();
        e.stopPropagation();
        this.activeMMotion = null;
        let radius = parseFloat(this.knobStyle.width) / 2;
        this.trackingknob.style.transform = "translate(0px, 0px)";
        this.knob.style.transform = `translate(${radius}px, ${radius}px)`;
        this.sendToPortal(this.primaryFrameId, "motion-end");
    }

    updateMMotion(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.activeMMotion) {
            let dx = e.clientX - this.knobX;
            let dy = e.clientY - this.knobY;

            let radius = parseFloat(this.knobStyle.width) / 2;
            let left = parseFloat(this.knobStyle.left) / 2;

            this.sendToPortal(this.primaryFrameId, "motion-update", {dx, dy});
            this.activeMMotion.dx = dx;
            this.activeMMotion.dy = dy;

            this.trackingknob.style.transform = `translate(${dx}px, ${dy}px)`;

            let ds = dx ** 2 + dy ** 2;
            if (ds > (radius + left) ** 2) {
                ds = Math.sqrt(ds);
                dx = (radius + left) * dx / ds;
                dy = (radius + left) * dy / ds;
            }

            this.knob.style.transform = `translate(${radius + dx}px, ${radius + dy}px)`;
        }
    }
}

// each iframe's src is the portal URL plus `?portal=<portalId>`
// which the shell uses to know if it needs to load a world
// into this frame or if it's the shell frame itself (without `?portal`)
// also, we standardize default args of the URL to make it comparable

function portalToFrameURL(portalURL, portalId) {
    const url = new URL(portalURL, location.href);
    // add "portal" parameter
    url.searchParams.set("portal", portalId);
    // remove "world=default"
    const world = url.searchParams.get("world");
    if (world === "default") url.searchParams.delete("world");
    // remove index.html
    const filename = url.pathname.split('/').pop();
    if (filename === "index.html") url.pathname = url.pathname.slice(0, -10);
    // sort params
    const params = [...url.searchParams.entries()].sort((a, b) => {
        // sort "world" first
        if (a[0] === "world") return -1;
        if (b[0] === "world") return 1;
        // sort "portal" last
        if (a[0] === "portal") return 1;
        if (b[0] === "portal") return -1;
        // sort "q" second-to-last
        if (a[0] === "q") return 1;
        if (b[0] === "q") return -1;
        // otherwise sort alphabetically
        return a[0] < b[0] ? -1 : 1;
    });
    url.search = new URLSearchParams(params).toString();
    return url.toString();
}

function frameToPortalURL(frameURL) {
    const url = new URL(frameURL, location.href);
    // delete "portal" parameter
    url.searchParams.delete("portal");
    // remove "world=default"
    const world = url.searchParams.get("world");
    if (world === "default") url.searchParams.delete("world");
    // remove index.html
    const filename = url.pathname.split('/').pop();
    if (filename === "index.html") url.pathname = url.pathname.slice(0, -10);
    // that's it
    return url.toString();
}

// we need canonical URLs for navigating between different origins
// the iframe.src can be cross-origin, but the address bar can't
// instead, we add a `?canonical=<base>` parameter to the address bar
// which has the actual primary world base URL without any parameters

function portalToShellURL(portalURL) {
    const url = new URL(portalURL, location.href);
    const shellUrl = new URL(location.href);
    // move all search params to the shell URL
    for (const [key, value] of url.searchParams) {
        shellUrl.searchParams.set(key, value);
    }
    url.search = '';
    // move hash params to shell URL
    shellUrl.hash = url.hash;
    url.hash = '';
    // add portal URL to shell URL
    shellUrl.searchParams.set("canonical", url.href);
    return shellUrl.toString();
}

function shellToCanonicalURL(shellURL) {
    const url = new URL(shellURL);
    const canonical = url.searchParams.get("canonical");
    if (!canonical) return shellURL;
    // replace origin with ?canonical
    url.searchParams.delete("canonical");
    const canonicalUrl = new URL(canonical);
    canonicalUrl.search = url.search;
    canonicalUrl.hash = url.hash;
    return canonicalUrl.toString();
}

// if the URL is on our own domain, strip the domain part,
// otherwise, just the protocol
function setTitle(url) {
    if (url.startsWith(location.origin)) url = url.substr(location.origin.length + 1);
    else url = url.substr(url.indexOf("://") + 3);
    document.title = url;
}
