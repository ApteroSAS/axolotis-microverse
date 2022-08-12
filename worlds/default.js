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
        "demo.js", "lights.js", "bouncingBall.js", "bitcoinTracker.js", "spin.js", "pendulum.js", "openPortal.js", "urlLink.js", "cradle.js"
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
                name: "auggie stand",
                translation: [7.77, -1.72, -14.7],
                // rotation: [0, 0, 0, 1],
                layers: ["pointer"],
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
        {
            card: {
                translation: [-12, -0.4, -10.2],
                rotation: [0, -Math.PI / 2, 0],
                layers: ["pointer", "portal"],
                className: "PortalActor",
                color: 16737996,
                cornerRadius: 0.05,
                depth: 0.05,
                frameColor: 8947848,
                height: 2.4,
                portalURL: "?world=refinery",
                type: "2d",
                width: 1.8,
            }
            },*/
        {
            card: {
                translation: [12, 0.6, 11],
                name: "cradle",
                type: "object",
                translation: [-9.67815341742099, 3.2368919013826734, 3.968801765942323],
                behaviorModules: ["Rapier", "Cradle"],
                layers: ["pointer"],
                shadow: true,
                scale: [0.2, 0.2, 0.2],
            }
        },
}
