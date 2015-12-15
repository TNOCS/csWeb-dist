import ApiManager = require('../api/ApiManager');
import Feature = ApiManager.Feature;
import Property = ApiManager.Property;
/**
 * A class representing the world state
 */
declare class WorldState {
    /**
     * Time the world state was created.
     */
    startTime: Date;
    /**
     * The current time.
     */
    currentTime: Date;
    /**
     * A bag of key-value properties
     */
    properties: Property[];
    /**
     * List of all features.
     */
    features: Feature[];
    /**
     * Active feature.
     * In case it is undefined, you can only evaluate the non-feature specific rules.
     */
    activeFeature: Feature;
    /**
     * Active layer id is used for working with features.
     * TODO I assume that later, we need to make this more flexible, allowing you to specify
     * which layer to use.
     */
    activeLayerId: string;
}
export = WorldState;
