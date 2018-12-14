/**
 * Remove the BOM from the string.
 * See http://stackoverflow.com/questions/24356713/node-js-readfile-error-with-utf8-encoded-file-on-windows
 */
String.prototype.removeBOM = function () {
    return this.replace(/^\uFEFF/, '');
};
//# sourceMappingURL=StringExt.js.map