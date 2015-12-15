var Utils = require("../helpers/Utils");
var BaseTransformer = (function () {
    function BaseTransformer(title) {
        this.title = title;
        this.type = null;
        this.id = Utils.newGuid();
        //this.description = description;
    }
    //create?(opt?: ITransformFactoryOptions[]): stream.Readable | stream.Writable | stream.Transform;
    BaseTransformer.prototype.initialize = function () {
    };
    return BaseTransformer;
})();
module.exports = BaseTransformer;
//# sourceMappingURL=BaseTransformer.js.map