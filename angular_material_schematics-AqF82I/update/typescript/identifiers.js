"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
/** Returns the original symbol from an node. */
function getOriginalSymbolFromNode(node, checker) {
    const baseSymbol = checker.getSymbolAtLocation(node);
    if (baseSymbol && baseSymbol.flags & ts.SymbolFlags.Alias) {
        return checker.getAliasedSymbol(baseSymbol);
    }
    return baseSymbol;
}
exports.getOriginalSymbolFromNode = getOriginalSymbolFromNode;
//# sourceMappingURL=identifiers.js.map