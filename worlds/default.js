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
        //"default/demo.js", "default/flightTracker.js", "default/spin.js", "default/lights.js", "default/slides.js", "default/cascade.js",
        //"financial/lights-financial.js", "financial/spin.js",
        //"factory/lights.js", "factory/crane.js", "factory/garage.js", "factory/forklift.js", "factory/circle.js", "factory/cascade.js", "factory/earth.js", "factory/conveyorbox.js", "factory/spin.js", "factory/flightTracker.js", "factory/openPortal.js", "factory/rearrange.js",
        //"campus/lights.js", "campus/livemap.js", "campus/drive.js", "campus/earth.js", "campus/spin.js", "campus/pendulum.js", "campus/openPortal.js", "campus/cascade.js"
    ];

    Constants.UseRapier = true;

    Constants.DefaultCards = [    ];
}
