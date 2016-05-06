"use strict";
/**
 * A class representing the world state
 */
var WorldState = (function () {
    function WorldState() {
        /**
         * Time the world state was created.
         */
        this.startTime = new Date();
        /**
         * The current time.
         */
        this.currentTime = this.startTime;
        /**
         * A bag of key-value properties
         */
        this.properties = [];
        /**
         * List of all features.
         */
        this.features = [];
    }
    return WorldState;
}());
exports.WorldState = WorldState;
//# sourceMappingURL=WorldState.js.map