// Copyright 2022 by Croquet Corporation, Inc. All Rights Reserved.
// https://croquet.io
// info@croquet.io

export function init(Constants) {
    Constants.AvatarNames = [
        "newwhite"
    ];

        "menu.js", "elected.js", "propertySheet.js", "stickyNote.js", "rapier.js", "avatarEvents.js", "pdfview.js", "scrollableArea.js"
    Constants.UserBehaviorDirectory = "behaviors";
    Constants.UserBehaviorModules = [
        "demo.js", "lights.js", "bouncingBall.js", "bitcoinTracker.js", "spin.js", "pendulum.js", "openPortal.js"
        //"financial/lights-financial.js", "financial/spin.js",
        //"factory/lights.js", "factory/crane.js", "factory/garage.js", "factory/forklift.js", "factory/circle.js", "factory/cascade.js", "factory/earth.js", "factory/conveyorbox.js", "factory/spin.js", "factory/flightTracker.js", "factory/openPortal.js", "factory/rearrange.js",
        //"campus/lights.js", "campus/livemap.js", "campus/drive.js", "campus/earth.js", "campus/spin.js", "campus/pendulum.js", "campus/openPortal.js", "campus/cascade.js"
    ];

    Constants.UseRapier = true;

    Constants.DefaultCards = [    ];
                translation: [12, 0.6, -10],
                cardURL: "https://croquet.io",
                cardHilite: 0xffffaa,
                behaviorModules: ["URLLink"],
        {
            card: {
                name: "auggie stand",
                translation: [7.79, -1.72, -14.82],
                // rotation: [0, 0, 0, 1],
                layers: ["pointer"],
                behaviorModules: ["Billboard"],
                dataLocation: "3en5pHEDZi7EpsaJ-_yONogv4uVau9ZlIxyh1TH4AhAQDRERFRZfSkoDDAkAFksQFksGFwoUEAARSwwKShBKHzAREjUqHyMQKjZULgwCKD8MUFZcHSMhIl1VV0oMCksGFwoUEAARSwgMBhcKEwAXFgBLEwQLABYWBEoOPFcnN1A0MQFUNQJSCFArMhcyMj8hIx8RDCMBIB06LygUJgYULAEjFDBVSgEEEQRKUAoHFCdQMwYEESE1NCscPTckDggoDDUwDyIgFTFXVw5IDAhREDc6Jwc0MA",
                dataScale: [1, 1, 1],
                fileName: "/AuggieStand.glb",
                modelType: "glb",
                shadow: true,
                singleSided: true,
                type: "3d",
            }
        },
        {
            card: {
                name: "auggie award",
                translation: [7.79, -0.45, -14.82],
                // rotation: [0, 0, 0, 1],
                layers: ["pointer"],
                behaviorModules: ["Billboard"],
                dataLocation: "35hI1OQ1NaqWki0Or-uHXAVM9vipZGVZIc_emQwLfCAcXUFBRUYPGhpTXFlQRhtARhtWR1pEQFBBG1xaGkAaT2BBQmV6T3NAemYEflxSeG9cAAYMTXNxcg0FBxpcWhtWR1pEQFBBG1hcVkdaQ1BHRlAbQ1RbUEZGVBpebAd3ZwBkYVEEZVICWAB7YkdiYm9xc09BXHNRcE1qf3hEdlZEfFFzRGAFGlFUQVQabV1-bFdNZAdnBAxCfnAYXk9kamVaAUVbBnt3QUBaWwUEfnhPb1RWfhhqDQ",
                dataScale: [1, 1, 1],
                fileName: "/Auggie2.glb",
                modelType: "glb",
                license: "CC-BY",
                attribution: "'Auggie Awards Trophy AWE 2022' by Kai Oldman derived from 'Auggie Awards Trophy AWE 2021' (https://skfb.ly/otrIP) by oriinbar is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
                shadow: true,
                singleSided: true,
                type: "3d",
            }
        },
        /*
                layers: ["pointer", "portal"],
                translation: [12, 0.6, 11],
layers: ["pointer", "portal"],
                name:"pendulum",
                translation: [-0.03701975732147922, 3.2368919013826734, 8.444841625884546],
                behaviorModules: ["Rapier", "Pendulum"],
                shadow: true,
}
