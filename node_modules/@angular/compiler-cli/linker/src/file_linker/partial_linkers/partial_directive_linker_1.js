(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/linker/src/file_linker/partial_linkers/partial_directive_linker_1", ["require", "exports", "@angular/compiler", "@angular/compiler-cli/linker/src/fatal_linker_error"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createSourceSpan = exports.toR3DirectiveMeta = exports.PartialDirectiveLinkerVersion1 = void 0;
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var compiler_1 = require("@angular/compiler");
    var fatal_linker_error_1 = require("@angular/compiler-cli/linker/src/fatal_linker_error");
    /**
     * A `PartialLinker` that is designed to process `ɵɵngDeclareDirective()` call expressions.
     */
    var PartialDirectiveLinkerVersion1 = /** @class */ (function () {
        function PartialDirectiveLinkerVersion1(sourceUrl, code) {
            this.sourceUrl = sourceUrl;
            this.code = code;
        }
        PartialDirectiveLinkerVersion1.prototype.linkPartialDeclaration = function (constantPool, metaObj) {
            var meta = toR3DirectiveMeta(metaObj, this.code, this.sourceUrl);
            var def = compiler_1.compileDirectiveFromMetadata(meta, constantPool, compiler_1.makeBindingParser());
            return def.expression;
        };
        return PartialDirectiveLinkerVersion1;
    }());
    exports.PartialDirectiveLinkerVersion1 = PartialDirectiveLinkerVersion1;
    /**
     * Derives the `R3DirectiveMetadata` structure from the AST object.
     */
    function toR3DirectiveMeta(metaObj, code, sourceUrl) {
        var typeExpr = metaObj.getValue('type');
        var typeName = typeExpr.getSymbolName();
        if (typeName === null) {
            throw new fatal_linker_error_1.FatalLinkerError(typeExpr.expression, 'Unsupported type, its name could not be determined');
        }
        return {
            typeSourceSpan: createSourceSpan(typeExpr.getRange(), code, sourceUrl),
            type: wrapReference(typeExpr.getOpaque()),
            typeArgumentCount: 0,
            internalType: metaObj.getOpaque('type'),
            deps: null,
            host: toHostMetadata(metaObj),
            inputs: metaObj.has('inputs') ? metaObj.getObject('inputs').toLiteral(toInputMapping) : {},
            outputs: metaObj.has('outputs') ?
                metaObj.getObject('outputs').toLiteral(function (value) { return value.getString(); }) :
                {},
            queries: metaObj.has('queries') ?
                metaObj.getArray('queries').map(function (entry) { return toQueryMetadata(entry.getObject()); }) :
                [],
            viewQueries: metaObj.has('viewQueries') ?
                metaObj.getArray('viewQueries').map(function (entry) { return toQueryMetadata(entry.getObject()); }) :
                [],
            providers: metaObj.has('providers') ? metaObj.getOpaque('providers') : null,
            fullInheritance: false,
            selector: metaObj.has('selector') ? metaObj.getString('selector') : null,
            exportAs: metaObj.has('exportAs') ?
                metaObj.getArray('exportAs').map(function (entry) { return entry.getString(); }) :
                null,
            lifecycle: {
                usesOnChanges: metaObj.has('usesOnChanges') ? metaObj.getBoolean('usesOnChanges') : false,
            },
            name: typeName,
            usesInheritance: metaObj.has('usesInheritance') ? metaObj.getBoolean('usesInheritance') : false,
        };
    }
    exports.toR3DirectiveMeta = toR3DirectiveMeta;
    /**
     * Decodes the AST value for a single input to its representation as used in the metadata.
     */
    function toInputMapping(value) {
        if (value.isString()) {
            return value.getString();
        }
        var values = value.getArray().map(function (innerValue) { return innerValue.getString(); });
        if (values.length !== 2) {
            throw new fatal_linker_error_1.FatalLinkerError(value.expression, 'Unsupported input, expected a string or an array containing exactly two strings');
        }
        return values;
    }
    /**
     * Extracts the host metadata configuration from the AST metadata object.
     */
    function toHostMetadata(metaObj) {
        if (!metaObj.has('host')) {
            return {
                attributes: {},
                listeners: {},
                properties: {},
                specialAttributes: {},
            };
        }
        var host = metaObj.getObject('host');
        var specialAttributes = {};
        if (host.has('styleAttribute')) {
            specialAttributes.styleAttr = host.getString('styleAttribute');
        }
        if (host.has('classAttribute')) {
            specialAttributes.classAttr = host.getString('classAttribute');
        }
        return {
            attributes: host.has('attributes') ?
                host.getObject('attributes').toLiteral(function (value) { return value.getOpaque(); }) :
                {},
            listeners: host.has('listeners') ?
                host.getObject('listeners').toLiteral(function (value) { return value.getString(); }) :
                {},
            properties: host.has('properties') ?
                host.getObject('properties').toLiteral(function (value) { return value.getString(); }) :
                {},
            specialAttributes: specialAttributes,
        };
    }
    /**
     * Extracts the metadata for a single query from an AST object.
     */
    function toQueryMetadata(obj) {
        var predicate;
        var predicateExpr = obj.getValue('predicate');
        if (predicateExpr.isArray()) {
            predicate = predicateExpr.getArray().map(function (entry) { return entry.getString(); });
        }
        else {
            predicate = predicateExpr.getOpaque();
        }
        return {
            propertyName: obj.getString('propertyName'),
            first: obj.has('first') ? obj.getBoolean('first') : false,
            predicate: predicate,
            descendants: obj.has('descendants') ? obj.getBoolean('descendants') : false,
            emitDistinctChangesOnly: obj.has('emitDistinctChangesOnly') ? obj.getBoolean('emitDistinctChangesOnly') : true,
            read: obj.has('read') ? obj.getOpaque('read') : null,
            static: obj.has('static') ? obj.getBoolean('static') : false,
        };
    }
    function wrapReference(wrapped) {
        return { value: wrapped, type: wrapped };
    }
    function createSourceSpan(range, code, sourceUrl) {
        var sourceFile = new compiler_1.ParseSourceFile(code, sourceUrl);
        var startLocation = new compiler_1.ParseLocation(sourceFile, range.startPos, range.startLine, range.startCol);
        return new compiler_1.ParseSourceSpan(startLocation, startLocation.moveBy(range.endPos - range.startPos));
    }
    exports.createSourceSpan = createSourceSpan;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGlhbF9kaXJlY3RpdmVfbGlua2VyXzEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbGlua2VyL3NyYy9maWxlX2xpbmtlci9wYXJ0aWFsX2xpbmtlcnMvcGFydGlhbF9kaXJlY3RpdmVfbGlua2VyXzEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gsOENBQThSO0lBTTlSLDBGQUEwRDtJQUkxRDs7T0FFRztJQUNIO1FBQ0Usd0NBQW9CLFNBQXlCLEVBQVUsSUFBWTtZQUEvQyxjQUFTLEdBQVQsU0FBUyxDQUFnQjtZQUFVLFNBQUksR0FBSixJQUFJLENBQVE7UUFBRyxDQUFDO1FBRXZFLCtEQUFzQixHQUF0QixVQUNJLFlBQTBCLEVBQzFCLE9BQXFEO1lBQ3ZELElBQU0sSUFBSSxHQUFHLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuRSxJQUFNLEdBQUcsR0FBRyx1Q0FBNEIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLDRCQUFpQixFQUFFLENBQUMsQ0FBQztZQUNsRixPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUNILHFDQUFDO0lBQUQsQ0FBQyxBQVZELElBVUM7SUFWWSx3RUFBOEI7SUFZM0M7O09BRUc7SUFDSCxTQUFnQixpQkFBaUIsQ0FDN0IsT0FBMkQsRUFBRSxJQUFZLEVBQ3pFLFNBQXlCO1FBQzNCLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUMsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzFDLElBQUksUUFBUSxLQUFLLElBQUksRUFBRTtZQUNyQixNQUFNLElBQUkscUNBQWdCLENBQ3RCLFFB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Q0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkYsT0FBTyxJQUFJLDBCQUFlLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNqRyxDQUFDO0lBTEQsNENBS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Y29tcGlsZURpcmVjdGl2ZUZyb21NZXRhZGF0YSwgQ29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlciwgUGFyc2VMb2NhdGlvbiwgUGFyc2VTb3VyY2VGaWxlLCBQYXJzZVNvdXJjZVNwYW4sIFIzRGVjbGFyZURpcmVjdGl2ZU1ldGFkYXRhLCBSM0RlY2xhcmVRdWVyeU1ldGFkYXRhLCBSM0RpcmVjdGl2ZU1ldGFkYXRhLCBSM0hvc3RNZXRhZGF0YSwgUjNQYXJ0aWFsRGVjbGFyYXRpb24sIFIzUXVlcnlNZXRhZGF0YSwgUjNSZWZlcmVuY2V9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIG8gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXIvc3JjL291dHB1dC9vdXRwdXRfYXN0JztcblxuaW1wb3J0IHtBYnNvbHV0ZUZzUGF0aH0gZnJvbSAnLi4vLi4vLi4vLi4vc3JjL25ndHNjL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7UmFuZ2V9IGZyb20gJy4uLy4uL2FzdC9hc3RfaG9zdCc7XG5pbXBvcnQge0FzdE9iamVjdCwgQXN0VmFsdWV9IGZyb20gJy4uLy4uL2FzdC9hc3RfdmFsdWUnO1xuaW1wb3J0IHtGYXRhbExpbmtlckVycm9yfSBmcm9tICcuLi8uLi9mYXRhbF9saW5rZXJfZXJyb3InO1xuXG5pbXBvcnQge1BhcnRpYWxMaW5rZXJ9IGZyb20gJy4vcGFydGlhbF9saW5rZXInO1xuXG4vKipcbiAqIEEgYFBhcnRpYWxMaW5rZXJgIHRoYXQgaXMgZGVzaWduZWQgdG8gcHJvY2VzcyBgybXJtW5nRGVjbGFyZURpcmVjdGl2ZSgpYCBjYWxsIGV4cHJlc3Npb25zLlxuICovXG5leHBvcnQgY2xhc3MgUGFydGlhbERpcmVjdGl2ZUxpbmtlclZlcnNpb24xPFRFeHByZXNzaW9uPiBpbXBsZW1lbnRzIFBhcnRpYWxMaW5rZXI8VEV4cHJlc3Npb24+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzb3VyY2VVcmw6IEFic29sdXRlRnNQYXRoLCBwcml2YXRlIGNvZGU6IHN0cmluZykge31cblxuICBsaW5rUGFydGlhbERlY2xhcmF0aW9uKFxuICAgICAgY29uc3RhbnRQb29sOiBDb25zdGFudFBvb2wsXG4gICAgICBtZXRhT2JqOiBBc3RPYmplY3Q8UjNQYXJ0aWFsRGVjbGFyYXRpb24sIFRFeHByZXNzaW9uPik6IG8uRXhwcmVzc2lvbiB7XG4gICAgY29uc3QgbWV0YSA9IHRvUjNEaXJlY3RpdmVNZXRhKG1ldGFPYmosIHRoaXMuY29kZSwgdGhpcy5zb3VyY2VVcmwpO1xuICAgIGNvbnN0IGRlZiA9IGNvbXBpbGVEaXJlY3RpdmVGcm9tTWV0YWRhdGEobWV0YSwgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcbiAgICByZXR1cm4gZGVmLmV4cHJlc3Npb247XG4gIH1cbn1cblxuLyoqXG4gKiBEZXJpdmVzIHRoZSBgUjNEaXJlY3RpdmVNZXRhZGF0YWAgc3RydWN0dXJlIGZyb20gdGhlIEFTVCBvYmplY3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b1IzRGlyZWN0aXZlTWV0YTxURXhwcmVzc2lvbj4oXG4gICAgbWV0YU9iajogQXN0T2JqZWN0PFIzRGVjbGFyZURpcmVjdGl2ZU1ldGFkYXRhLCBURXhwcmVzc2lvbj4sIGNvZGU6IHN0cmluZyxcbiAgICBzb3VyY2VVcmw6IEFic29sdXRlRnNQYXRoKTogUjNEaXJlY3RpdmVNZXRhZGF0YSB7XG4gIGNvbnN0IHR5cGVFeHByID0gbWV0YU9iai5nZXRWYWx1ZSgndHlwZScpO1xuICBjb25zdCB0eXBlTmFtZSA9IHR5cGVFeHByLmdldFN5bWJvbE5hbWUoKTtcbiAgaWYgKHR5cGVOYW1lID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEZhdGFsTGlua2VyRXJyb3IoXG4gICAgICAgIHR5cGVFeHByLmV4cHJlc3Npb24sICdVbnN1cHBvcnRlZCB0eXBlLCBpdHMgbmFtZSBjb3VsZCBub3QgYmUgZGV0ZXJtaW5lZCcpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlU291cmNlU3BhbjogY3JlYXRlU291cmNlU3Bhbih0eXBlRXhwci5nZXRSYW5nZSgpLCBjb2RlLCBzb3VyY2VVcmwpLFxuICAgIHR5cGU6IHdyYXBSZWZlcmVuY2UodHlwZUV4cHIuZ2V0T3BhcXVlKCkpLFxuICAgIHR5cGVBcmd1bWVudENvdW50OiAwLFxuICAgIGludGVybmFsVHlwZTogbWV0YU9iai5nZXRPcGFxdWUoJ3R5cGUnKSxcbiAgICBkZXBzOiBudWxsLFxuICAgIGhvc3Q6IHRvSG9zdE1ldGFkYXRhKG1ldGFPYmopLFxuICAgIGlucHV0czogbWV0YU9iai5oYXMoJ2lucHV0cycpID8gbWV0YU9iai5nZXRPYmplY3QoJ2lucHV0cycpLnRvTGl0ZXJhbCh0b0lucHV0TWFwcGluZykgOiB7fSxcbiAgICBvdXRwdXRzOiBtZXRhT2JqLmhhcygnb3V0cHV0cycpID9cbiAgICAgICAgbWV0YU9iai5nZXRPYmplY3QoJ291dHB1dHMnKS50b0xpdGVyYWwodmFsdWUgPT4gdmFsdWUuZ2V0U3RyaW5nKCkpIDpcbiAgICAgICAge30sXG4gICAgcXVlcmllczogbWV0YU9iai5oYXMoJ3F1ZXJpZXMnKSA/XG4gICAgICAgIG1ldGFPYmouZ2V0QXJyYXkoJ3F1ZXJpZXMnKS5tYXAoZW50cnkgPT4gdG9RdWVyeU1ldGFkYXRhKGVudHJ5LmdldE9iamVjdCgpKSkgOlxuICAgICAgICBbXSxcbiAgICB2aWV3UXVlcmllczogbWV0YU9iai5oYXMoJ3ZpZXdRdWVyaWVzJykgP1xuICAgICAgICBtZXRhT2JqLmdldEFycmF5KCd2aWV3UXVlcmllcycpLm1hcChlbnRyeSA9PiB0b1F1ZXJ5TWV0YWRhdGEoZW50cnkuZ2V0T2JqZWN0KCkpKSA6XG4gICAgICAgIFtdLFxuICAgIHByb3ZpZGVyczogbWV0YU9iai5oYXMoJ3Byb3ZpZGVycycpID8gbWV0YU9iai5nZXRPcGFxdWUoJ3Byb3ZpZGVycycpIDogbnVsbCxcbiAgICBmdWxsSW5oZXJpdGFuY2U6IGZhbHNlLFxuICAgIHNlbGVjdG9yOiBtZXRhT2JqLmhhcygnc2VsZWN0b3InKSA/IG1ldGFPYmouZ2V0U3RyaW5nKCdzZWxlY3RvcicpIDogbnVsbCxcbiAgICBleHBvcnRBczogbWV0YU9iai5oYXMoJ2V4cG9ydEFzJykgP1xuICAgICAgICBtZXRhT2JqLmdldEFycmF5KCdleHBvcnRBcycpLm1hcChlbnRyeSA9PiBlbnRyeS5nZXRTdHJpbmcoKSkgOlxuICAgICAgICBudWxsLFxuICAgIGxpZmVjeWNsZToge1xuICAgICAgdXNlc09uQ2hhbmdlczogbWV0YU9iai5oYXMoJ3VzZXNPbkNoYW5nZXMnKSA/IG1ldGFPYmouZ2V0Qm9vbGVhbigndXNlc09uQ2hhbmdlcycpIDogZmFsc2UsXG4gICAgfSxcbiAgICBuYW1lOiB0eXBlTmFtZSxcbiAgICB1c2VzSW5oZXJpdGFuY2U6IG1ldGFPYmouaGFzKCd1c2VzSW5oZXJpdGFuY2UnKSA/IG1ldGFPYmouZ2V0Qm9vbGVhbigndXNlc0luaGVyaXRhbmNlJykgOiBmYWxzZSxcbiAgfTtcbn1cblxuLyoqXG4gKiBEZWNvZGVzIHRoZSBBU1QgdmFsdWUgZm9yIGEgc2luZ2xlIGlucHV0IHRvIGl0cyByZXByZXNlbnRhdGlvbiBhcyB1c2VkIGluIHRoZSBtZXRhZGF0YS5cbiAqL1xuZnVuY3Rpb24gdG9JbnB1dE1hcHBpbmc8VEV4cHJlc3Npb24+KHZhbHVlOiBBc3RWYWx1ZTxzdHJpbmd8W3N0cmluZywgc3RyaW5nXSwgVEV4cHJlc3Npb24+KTpcbiAgICBzdHJpbmd8W3N0cmluZywgc3RyaW5nXSB7XG4gIGlmICh2YWx1ZS5pc1N0cmluZygpKSB7XG4gICAgcmV0dXJuIHZhbHVlLmdldFN0cmluZygpO1xuICB9XG5cbiAgY29uc3QgdmFsdWVzID0gdmFsdWUuZ2V0QXJyYXkoKS5tYXAoaW5uZXJWYWx1ZSA9PiBpbm5lclZhbHVlLmdldFN0cmluZygpKTtcbiAgaWYgKHZhbHVlcy5sZW5ndGggIT09IDIpIHtcbiAgICB0aHJvdyBuZXcgRmF0YWxMaW5rZXJFcnJvcihcbiAgICAgICAgdmFsdWUuZXhwcmVzc2lvbixcbiAgICAgICAgJ1Vuc3VwcG9ydGVkIGlucHV0LCBleHBlY3RlZCBhIHN0cmluZyBvciBhbiBhcnJheSBjb250YWluaW5nIGV4YWN0bHkgdHdvIHN0cmluZ3MnKTtcbiAgfVxuICByZXR1cm4gdmFsdWVzIGFzIFtzdHJpbmcsIHN0cmluZ107XG59XG5cbi8qKlxuICogRXh0cmFjdHMgdGhlIGhvc3QgbWV0YWRhdGEgY29uZmlndXJhdGlvbiBmcm9tIHRoZSBBU1QgbWV0YWRhdGEgb2JqZWN0LlxuICovXG5mdW5jdGlvbiB0b0hvc3RNZXRhZGF0YTxURXhwcmVzc2lvbj4obWV0YU9iajogQXN0T2JqZWN0PFIzRGVjbGFyZURpcmVjdGl2ZU1ldGFkYXRhLCBURXhwcmVzc2lvbj4pOlxuICAgIFIzSG9zdE1ldGFkYXRhIHtcbiAgaWYgKCFtZXRhT2JqLmhhcygnaG9zdCcpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGF0dHJpYnV0ZXM6IHt9LFxuICAgICAgbGlzdGVuZXJzOiB7fSxcbiAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgc3BlY2lhbEF0dHJpYnV0ZXM6IHt9LFxuICAgIH07XG4gIH1cblxuICBjb25zdCBob3N0ID0gbWV0YU9iai5nZXRPYmplY3QoJ2hvc3QnKTtcblxuICBjb25zdCBzcGVjaWFsQXR0cmlidXRlczogUjNIb3N0TWV0YWRhdGFbJ3NwZWNpYWxBdHRyaWJ1dGVzJ10gPSB7fTtcbiAgaWYgKGhvc3QuaGFzKCdzdHlsZUF0dHJpYnV0ZScpKSB7XG4gICAgc3BlY2lhbEF0dHJpYnV0ZXMuc3R5bGVBdHRyID0gaG9zdC5nZXRTdHJpbmcoJ3N0eWxlQXR0cmlidXRlJyk7XG4gIH1cbiAgaWYgKGhvc3QuaGFzKCdjbGFzc0F0dHJpYnV0ZScpKSB7XG4gICAgc3BlY2lhbEF0dHJpYnV0ZXMuY2xhc3NBdHRyID0gaG9zdC5nZXRTdHJpbmcoJ2NsYXNzQXR0cmlidXRlJyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGF0dHJpYnV0ZXM6IGhvc3QuaGFzKCdhdHRyaWJ1dGVzJykgP1xuICAgICAgICBob3N0LmdldE9iamVjdCgnYXR0cmlidXRlcycpLnRvTGl0ZXJhbCh2YWx1ZSA9PiB2YWx1ZS5nZXRPcGFxdWUoKSkgOlxuICAgICAgICB7fSxcbiAgICBsaXN0ZW5lcnM6IGhvc3QuaGFzKCdsaXN0ZW5lcnMnKSA/XG4gICAgICAgIGhvc3QuZ2V0T2JqZWN0KCdsaXN0ZW5lcnMnKS50b0xpdGVyYWwodmFsdWUgPT4gdmFsdWUuZ2V0U3RyaW5nKCkpIDpcbiAgICAgICAge30sXG4gICAgcHJvcGVydGllczogaG9zdC5oYXMoJ3Byb3BlcnRpZXMnKSA/XG4gICAgICAgIGhvc3QuZ2V0T2JqZWN0KCdwcm9wZXJ0aWVzJykudG9MaXRlcmFsKHZhbHVlID0+IHZhbHVlLmdldFN0cmluZygpKSA6XG4gICAgICAgIHt9LFxuICAgIHNwZWNpYWxBdHRyaWJ1dGVzLFxuICB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHRoZSBtZXRhZGF0YSBmb3IgYSBzaW5nbGUgcXVlcnkgZnJvbSBhbiBBU1Qgb2JqZWN0LlxuICovXG5mdW5jdGlvbiB0b1F1ZXJ5TWV0YWRhdGE8VEV4cHJlc3Npb24+KG9iajogQXN0T2JqZWN0PFIzRGVjbGFyZVF1ZXJ5TWV0YWRhdGEsIFRFeHByZXNzaW9uPik6XG4gICAgUjNRdWVyeU1ldGFkYXRhIHtcbiAgbGV0IHByZWRpY2F0ZTogUjNRdWVyeU1ldGFkYXRhWydwcmVkaWNhdGUnXTtcbiAgY29uc3QgcHJlZGljYXRlRXhwciA9IG9iai5nZXRWYWx1ZSgncHJlZGljYXRlJyk7XG4gIGlmIChwcmVkaWNhdGVFeHByLmlzQXJyYXkoKSkge1xuICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZUV4cHIuZ2V0QXJyYXkoKS5tYXAoZW50cnkgPT4gZW50cnkuZ2V0U3RyaW5nKCkpO1xuICB9IGVsc2Uge1xuICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZUV4cHIuZ2V0T3BhcXVlKCk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBwcm9wZXJ0eU5hbWU6IG9iai5nZXRTdHJpbmcoJ3Byb3BlcnR5TmFtZScpLFxuICAgIGZpcnN0OiBvYmouaGFzKCdmaXJzdCcpID8gb2JqLmdldEJvb2xlYW4oJ2ZpcnN0JykgOiBmYWxzZSxcbiAgICBwcmVkaWNhdGUsXG4gICAgZGVzY2VuZGFudHM6IG9iai5oYXMoJ2Rlc2NlbmRhbnRzJykgPyBvYmouZ2V0Qm9vbGVhbignZGVzY2VuZGFudHMnKSA6IGZhbHNlLFxuICAgIGVtaXREaXN0aW5jdENoYW5nZXNPbmx5OlxuICAgICAgICBvYmouaGFzKCdlbWl0RGlzdGluY3RDaGFuZ2VzT25seScpID8gb2JqLmdldEJvb2xlYW4oJ2VtaXREaXN0aW5jdENoYW5nZXNPbmx5JykgOiB0cnVlLFxuICAgIHJlYWQ6IG9iai5oYXMoJ3JlYWQnKSA/IG9iai5nZXRPcGFxdWUoJ3JlYWQnKSA6IG51bGwsXG4gICAgc3RhdGljOiBvYmouaGFzKCdzdGF0aWMnKSA/IG9iai5nZXRCb29sZWFuKCdzdGF0aWMnKSA6IGZhbHNlLFxuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwUmVmZXJlbmNlPFRFeHByZXNzaW9uPih3cmFwcGVkOiBvLldyYXBwZWROb2RlRXhwcjxURXhwcmVzc2lvbj4pOiBSM1JlZmVyZW5jZSB7XG4gIHJldHVybiB7dmFsdWU6IHdyYXBwZWQsIHR5cGU6IHdyYXBwZWR9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU291cmNlU3BhbihyYW5nZTogUmFuZ2UsIGNvZGU6IHN0cmluZywgc291cmNlVXJsOiBzdHJpbmcpOiBQYXJzZVNvdXJjZVNwYW4ge1xuICBjb25zdCBzb3VyY2VGaWxlID0gbmV3IFBhcnNlU291cmNlRmlsZShjb2RlLCBzb3VyY2VVcmwpO1xuICBjb25zdCBzdGFydExvY2F0aW9uID1cbiAgICAgIG5ldyBQYXJzZUxvY2F0aW9uKHNvdXJjZUZpbGUsIHJhbmdlLnN0YXJ0UG9zLCByYW5nZS5zdGFydExpbmUsIHJhbmdlLnN0YXJ0Q29sKTtcbiAgcmV0dXJuIG5ldyBQYXJzZVNvdXJjZVNwYW4oc3RhcnRMb2NhdGlvbiwgc3RhcnRMb2NhdGlvbi5tb3ZlQnkocmFuZ2UuZW5kUG9zIC0gcmFuZ2Uuc3RhcnRQb3MpKTtcbn1cbiJdfQ==