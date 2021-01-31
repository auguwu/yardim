/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/translator/src/typescript_translator", ["require", "exports", "@angular/compiler-cli/src/ngtsc/translator/src/context", "@angular/compiler-cli/src/ngtsc/translator/src/translator", "@angular/compiler-cli/src/ngtsc/translator/src/typescript_ast_factory"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.translateStatement = exports.translateExpression = void 0;
    var context_1 = require("@angular/compiler-cli/src/ngtsc/translator/src/context");
    var translator_1 = require("@angular/compiler-cli/src/ngtsc/translator/src/translator");
    var typescript_ast_factory_1 = require("@angular/compiler-cli/src/ngtsc/translator/src/typescript_ast_factory");
    function translateExpression(expression, imports, options) {
        if (options === void 0) { options = {}; }
        return expression.visitExpression(new translator_1.ExpressionTranslatorVisitor(new typescript_ast_factory_1.TypeScriptAstFactory(), imports, options), new context_1.Context(false));
    }
    exports.translateExpression = translateExpression;
    function translateStatement(statement, imports, options) {
        if (options === void 0) { options = {}; }
        return statement.visitStatement(new translator_1.ExpressionTranslatorVisitor(new typescript_ast_factory_1.TypeScriptAstFactory(), imports, options), new context_1.Context(true));
    }
    exports.translateStatement = translateStatement;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdF90cmFuc2xhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy90cmFuc2xhdG9yL3NyYy90eXBlc2NyaXB0X3RyYW5zbGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBTUgsa0ZBQWtDO0lBQ2xDLHdGQUE0RTtJQUM1RSxnSEFBOEQ7SUFFOUQsU0FBZ0IsbUJBQW1CLENBQy9CLFVBQXdCLEVBQUUsT0FBdUMsRUFDakUsT0FBOEM7UUFBOUMsd0JBQUEsRUFBQSxZQUE4QztRQUNoRCxPQUFPLFVBQVUsQ0FBQyxlQUFlLENBQzdCLElBQUksd0NBQTJCLENBQzNCLElBQUksNkNBQW9CLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQ2pELElBQUksaUJBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFQRCxrREFPQztJQUVELFNBQWdCLGtCQUFrQixDQUM5QixTQUFzQixFQUFFLE9BQXVDLEVBQy9ELE9BQThDO1FBQTlDLHdCQUFBLEVBQUEsWUFBOEM7UUFDaEQsT0FBTyxTQUFTLENBQUMsY0FBYyxDQUMzQixJQUFJLHdDQUEyQixDQUMzQixJQUFJLDZDQUFvQixFQUFFLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUNqRCxJQUFJLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6QixDQUFDO0lBUEQsZ0RBT0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgbyBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtJbXBvcnRHZW5lcmF0b3J9IGZyb20gJy4vYXBpL2ltcG9ydF9nZW5lcmF0b3InO1xuaW1wb3J0IHtDb250ZXh0fSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHtFeHByZXNzaW9uVHJhbnNsYXRvclZpc2l0b3IsIFRyYW5zbGF0b3JPcHRpb25zfSBmcm9tICcuL3RyYW5zbGF0b3InO1xuaW1wb3J0IHtUeXBlU2NyaXB0QXN0RmFjdG9yeX0gZnJvbSAnLi90eXBlc2NyaXB0X2FzdF9mYWN0b3J5JztcblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zbGF0ZUV4cHJlc3Npb24oXG4gICAgZXhwcmVzc2lvbjogby5FeHByZXNzaW9uLCBpbXBvcnRzOiBJbXBvcnRHZW5lcmF0b3I8dHMuRXhwcmVzc2lvbj4sXG4gICAgb3B0aW9uczogVHJhbnNsYXRvck9wdGlvbnM8dHMuRXhwcmVzc2lvbj4gPSB7fSk6IHRzLkV4cHJlc3Npb24ge1xuICByZXR1cm4gZXhwcmVzc2lvbi52aXNpdEV4cHJlc3Npb24oXG4gICAgICBuZXcgRXhwcmVzc2lvblRyYW5zbGF0b3JWaXNpdG9yPHRzLlN0YXRlbWVudCwgdHMuRXhwcmVzc2lvbj4oXG4gICAgICAgICAgbmV3IFR5cGVTY3JpcHRBc3RGYWN0b3J5KCksIGltcG9ydHMsIG9wdGlvbnMpLFxuICAgICAgbmV3IENvbnRleHQoZmFsc2UpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zbGF0ZVN0YXRlbWVudChcbiAgICBzdGF0ZW1lbnQ6IG8uU3RhdGVtZW50LCBpbXBvcnRzOiBJbXBvcnRHZW5lcmF0b3I8dHMuRXhwcmVzc2lvbj4sXG4gICAgb3B0aW9uczogVHJhbnNsYXRvck9wdGlvbnM8dHMuRXhwcmVzc2lvbj4gPSB7fSk6IHRzLlN0YXRlbWVudCB7XG4gIHJldHVybiBzdGF0ZW1lbnQudmlzaXRTdGF0ZW1lbnQoXG4gICAgICBuZXcgRXhwcmVzc2lvblRyYW5zbGF0b3JWaXNpdG9yPHRzLlN0YXRlbWVudCwgdHMuRXhwcmVzc2lvbj4oXG4gICAgICAgICAgbmV3IFR5cGVTY3JpcHRBc3RGYWN0b3J5KCksIGltcG9ydHMsIG9wdGlvbnMpLFxuICAgICAgbmV3IENvbnRleHQodHJ1ZSkpO1xufVxuIl19