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
        define("@angular/compiler-cli/src/transformers/patch_alias_reference_resolution", ["require", "exports", "tslib", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAliasImportDeclaration = exports.loadIsReferencedAliasDeclarationPatch = void 0;
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var patchedReferencedAliasesSymbol = Symbol('patchedReferencedAliases');
    /**
     * Patches the alias declaration reference resolution for a given transformation context
     * so that TypeScript knows about the specified alias declarations being referenced.
     *
     * This exists because TypeScript performs analysis of import usage before transformers
     * run and doesn't refresh its state after transformations. This means that imports
     * for symbols used as constructor types are elided due to their original type-only usage.
     *
     * In reality though, since we downlevel decorators and constructor parameters, we want
     * these symbols to be retained in the JavaScript output as they will be used as values
     * at runtime. We can instruct TypeScript to preserve imports for such identifiers by
     * creating a mutable clone of a given import specifier/clause or namespace, but that
     * has the downside of preserving the full import in the JS output. See:
     * https://github.com/microsoft/TypeScript/blob/3eaa7c65f6f076a08a5f7f1946fd0df7c7430259/src/compiler/transformers/ts.ts#L242-L250.
     *
     * This is a trick the CLI used in the past  for constructor parameter downleveling in JIT:
     * https://github.com/angular/angular-cli/blob/b3f84cc5184337666ce61c07b7b9df418030106f/packages/ngtools/webpack/src/transformers/ctor-parameters.ts#L323-L325
     * The trick is not ideal though as it preserves the full import (as outlined before), and it
     * results in a slow-down due to the type checker being involved multiple times. The CLI worked
     * around this import preserving issue by having another complex post-process step that detects and
     * elides unused imports. Note that these unused imports could cause unused chunks being generated
     * by Webpack if the application or library is not marked as side-effect free.
     *
     * This is not ideal though, as we basically re-implement the complex import usage resolution
     * from TypeScript. We can do better by letting TypeScript do the import eliding, but providing
     * information about the alias declarations (e.g. import specifiers) that should not be elided
     * because they are actually referenced (as they will now appear in static properties).
     *
     * More information about these limitations with transformers can be found in:
     *   1. https://github.com/Microsoft/TypeScript/issues/17552.
     *   2. https://github.com/microsoft/TypeScript/issues/17516.
     *   3. https://github.com/angular/tsickle/issues/635.
     *
     * The patch we apply to tell TypeScript about actual referenced aliases (i.e. imported symbols),
     * matches conceptually with the logic that runs internally in TypeScript when the
     * `emitDecoratorMetadata` flag is enabled. TypeScript basically surfaces the same problem and
     * solves it conceptually the same way, but obviously doesn't need to access an `@internal` API.
     *
     * The set that is returned by this function is meant to be filled with import declaration nodes
     * that have been referenced in a value-position by the transform, such the installed patch can
     * ensure that those import declarations are not elided.
     *
     * See below. Note that this uses sourcegraph as the TypeScript checker file doesn't display on
     * Github.
     * https://sourcegraph.com/github.com/microsoft/TypeScript@3eaa7c65f6f076a08a5f7f1946fd0df7c7430259/-/blob/src/compiler/checker.ts#L31219-31257
     */
    function loadIsReferencedAliasDeclarationPatch(context) {
        // If the `getEmitResolver` method is not available, TS most likely changed the
        // internal structure of the transformation context. We will abort gracefully.
        if (!isTransformationContextWithEmitResolver(context)) {
            throwIncompatibleTransformationContextError();
        }
        var emitResolver = context.getEmitResolver();
        // The emit resolver may have been patched already, in which case we return the set of referenced
        // aliases that was created when the patch was first applied.
        // See https://github.com/angular/angular/issues/40276.
        var existingReferencedAliases = emitResolver[patchedReferencedAliasesSymbol];
        if (existingReferencedAliases !== undefined) {
            return existingReferencedAliases;
        }
        var originalIsReferencedAliasDeclaration = emitResolver.isReferencedAliasDeclaration;
        // If the emit resolver does not have a function called `isReferencedAliasDeclaration`, then
        // we abort gracefully as most likely TS changed the internal structure of the emit resolver.
        if (originalIsReferencedAliasDeclaration === undefined) {
            throwIncompatibleTransformationContextError();
        }
        var referencedAliases = new Set();
        emitResolver.isReferencedAliasDeclaration = function (node) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (isAliasImportDeclaration(node) && referencedAliases.has(node)) {
                return true;
            }
            return originalIsReferencedAliasDeclaration.call.apply(originalIsReferencedAliasDeclaration, tslib_1.__spread([emitResolver, node], args));
        };
        return emitResolver[patchedReferencedAliasesSymbol] = referencedAliases;
    }
    exports.loadIsReferencedAliasDeclarationPatch = loadIsReferencedAliasDeclarationPatch;
    /**
     * Gets whether a given node corresponds to an import alias declaration. Alias
     * declarations can be import specifiers, namespace imports or import clauses
     * as these do not declare an actual symbol but just point to a target declaration.
     */
    function isAliasImportDeclaration(node) {
        return ts.isImportSpecifier(node) || ts.isNamespaceImport(node) || ts.isImportClause(node);
    }
    exports.isAliasImportDeclaration = isAliasImportDeclaration;
    /** Whether the transformation context exposes its emit resolver. */
    function isTransformationContextWithEmitResolver(context) {
        return context.getEmitResolver !== undefined;
    }
    /**
     * Throws an error about an incompatible TypeScript version for which the alias
     * declaration reference resolution could not be monkey-patched. The error will
     * also propose potential solutions that can be applied by developers.
     */
    function throwIncompatibleTransformationContextError() {
        throw Error('Unable to downlevel Angular decorators due to an incompatible TypeScript ' +
            'version.\nIf you recently updated TypeScript and this issue surfaces now, consider ' +
            'downgrading.\n\n' +
            'Please report an issue on the Angular repositories when this issue ' +
            'surfaces and you are using a supposedly compatible TypeScript version.');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0Y2hfYWxpYXNfcmVmZXJlbmNlX3Jlc29sdXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL3RyYW5zZm9ybWVycy9wYXRjaF9hbGlhc19yZWZlcmVuY2VfcmVzb2x1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQWlDO0lBV2pDLElBQU0sOEJBQThCLEdBQUcsTUFBTSxDQUFDLDBCQUEwQixDQUFDLENBQUM7SUFRMUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQTZDRztJQUNILFNBQWdCLHFDQUFxQyxDQUFDLE9BQWlDO1FBRXJGLCtFQUErRTtRQUMvRSw4RUFBOEU7UUFDOUUsSUFBSSxDQUFDLHVDQUF1QyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3JELDJDQUEyQyxFQUFFLENBQUM7U0FDL0M7UUFDRCxJQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFL0MsaUdBQWlHO1FBQ2pHLDZEQUE2RDtRQUM3RCx1REFBdUQ7UUFDdkQsSUFBTSx5QkFBeUIsR0FBRyxZQUFZLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUMvRSxJQUFJLHlCQUF5QixLQUFLLFNBQVMsRUFBRTtZQUMzQyxPQUFPLHlCQUF5QixDQUFDO1NBQ2xDO1FBRUQsSUFBTSxvQ0FBb0MsR0FBRyxZQUFZLENBQUMsNEJBQTRCLENBQUM7UUFDdkYsNEZBQTRGO1FBQzVGLDZGQUE2RjtRQUM3RixJQUFJLG9DQUFvQyxLQUFLLFNBQVMsRUFBRTtZQUN0RCwyQ0FBMkMsRUFBRSxDQUFDO1NBQy9DO1FBRUQsSUFBTSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztRQUNwRCxZQUFZLENBQUMsNEJBQTRCLEdBQUcsVUFBUyxJQUFJO1lBQUUsY0FBTztpQkFBUCxVQUFPLEVBQVAscUJBQU8sRUFBUCxJQUFPO2dCQUFQLDZCQUFPOztZQUNoRSxJQUFJLHdCQUF3QixDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDakUsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELE9BQU8sb0NBQW9DLENBQUMsSUFBSSxPQUF6QyxvQ0FBb0Msb0JBQU0sWUFBWSxFQUFFLElBQUksR0FBSyxJQUFJLEdBQUU7UUFDaEYsQ0FBQyxDQUFDO1FBQ0YsT0FBTyxZQUFZLENBQUMsOEJBQThCLENBQUMsR0FBRyxpQkFBaUIsQ0FBQztJQUMxRSxDQUFDO0lBaENELHNGQWdDQztJQUVEOzs7O09BSUc7SUFDSCxTQUFnQix3QkFBd0IsQ0FBQyxJQUFhO1FBRXBELE9BQU8sRUFBRSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFIRCw0REFHQztJQUVELG9FQUFvRTtJQUNwRSxTQUFTLHVDQUF1QyxDQUFDLE9BQWlDO1FBRWhGLE9BQVEsT0FBc0QsQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDO0lBQy9GLENBQUM7SUFHRDs7OztPQUlHO0lBQ0gsU0FBUywyQ0FBMkM7UUFDbEQsTUFBTSxLQUFLLENBQ1AsMkVBQTJFO1lBQzNFLHFGQUFxRjtZQUNyRixrQkFBa0I7WUFDbEIscUVBQXFFO1lBQ3JFLHdFQUF3RSxDQUFDLENBQUM7SUFDaEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqXG4gKiBEZXNjcmliZXMgYSBUeXBlU2NyaXB0IHRyYW5zZm9ybWF0aW9uIGNvbnRleHQgd2l0aCB0aGUgaW50ZXJuYWwgZW1pdFxuICogcmVzb2x2ZXIgZXhwb3NlZC4gVGhlcmUgYXJlIHJlcXVlc3RzIHVwc3RyZWFtIGluIFR5cGVTY3JpcHQgdG8gZXhwb3NlXG4gKiB0aGF0IGFzIHB1YmxpYyBBUEk6IGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMTc1MTYuLlxuICovXG5pbnRlcmZhY2UgVHJhbnNmb3JtYXRpb25Db250ZXh0V2l0aFJlc29sdmVyIGV4dGVuZHMgdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0IHtcbiAgZ2V0RW1pdFJlc29sdmVyOiAoKSA9PiBFbWl0UmVzb2x2ZXI7XG59XG5cbmNvbnN0IHBhdGNoZWRSZWZlcmVuY2VkQWxpYXNlc1N5bWJvbCA9IFN5bWJvbCgncGF0Y2hlZFJlZmVyZW5jZWRBbGlhc2VzJyk7XG5cbi8qKiBEZXNjcmliZXMgYSBzdWJzZXQgb2YgdGhlIFR5cGVTY3JpcHQgaW50ZXJuYWwgZW1pdCByZXNvbHZlci4gKi9cbmludGVyZmFjZSBFbWl0UmVzb2x2ZXIge1xuICBpc1JlZmVyZW5jZWRBbGlhc0RlY2xhcmF0aW9uPyhub2RlOiB0cy5Ob2RlLCAuLi5hcmdzOiB1bmtub3duW10pOiB2b2lkO1xuICBbcGF0Y2hlZFJlZmVyZW5jZWRBbGlhc2VzU3ltYm9sXT86IFNldDx0cy5EZWNsYXJhdGlvbj47XG59XG5cbi8qKlxuICogUGF0Y2hlcyB0aGUgYWxpYXMgZGVjbGFyYXRpb24gcmVmZXJlbmNlIHJlc29sdXRpb24gZm9yIGEgZ2l2ZW4gdHJhbnNmb3JtYXRpb24gY29udGV4dFxuICogc28gdGhhdCBUeXBlU2NyaXB0IGtub3dzIGFib3V0IHRoZSBzcGVjaWZpZWQgYWxpYXMgZGVjbGFyYXRpb25zIGJlaW5nIHJlZmVyZW5jZWQuXG4gKlxuICogVGhpcyBleGlzdHMgYmVjYXVzZSBUeXBlU2NyaXB0IHBlcmZvcm1zIGFuYWx5c2lzIG9mIGltcG9ydCB1c2FnZSBiZWZvcmUgdHJhbnNmb3JtZXJzXG4gKiBydW4gYW5kIGRvZXNuJ3QgcmVmcmVzaCBpdHMgc3RhdGUgYWZ0ZXIgdHJhbnNmb3JtYXRpb25zLiBUaGlzIG1lYW5zIHRoYXQgaW1wb3J0c1xuICogZm9yIHN5bWJvbHMgdXNlZCBhcyBjb25zdHJ1Y3RvciB0eXBlcyBhcmUgZWxpZGVkIGR1ZSB0byB0aGVpciBvcmlnaW5hbCB0eXBlLW9ubHkgdXNhZ2UuXG4gKlxuICogSW4gcmVhbGl0eSB0aG91Z2gsIHNpbmNlIHdlIGRvd25sZXZlbCBkZWNvcmF0b3JzIGFuZCBjb25zdHJ1Y3RvciBwYXJhbWV0ZXJzLCB3ZSB3YW50XG4gKiB0aGVzZSBzeW1ib2xzIHRvIGJlIHJldGFpbmVkIGluIHRoZSBKYXZhU2NyaXB0IG91dHB1dCBhcyB0aGV5IHdpbGwgYmUgdXNlZCBhcyB2YWx1ZXNcbiAqIGF0IHJ1bnRpbWUuIFdlIGNhbiBpbnN0cnVjdCBUeXBlU2NyaXB0IHRvIHByZXNlcnZlIGltcG9ydHMgZm9yIHN1Y2ggaWRlbnRpZmllcnMgYnlcbiAqIGNyZWF0aW5nIGEgbXV0YWJsZSBjbG9uZSBvZiBhIGdpdmVuIGltcG9ydCBzcGVjaWZpZXIvY2xhdXNlIG9yIG5hbWVzcGFjZSwgYnV0IHRoYXRcbiAqIGhhcyB0aGUgZG93bnNpZGUgb2YgcHJlc2VydmluZyB0aGUgZnVsbCBpbXBvcnQgaW4gdGhlIEpTIG91dHB1dC4gU2VlOlxuICogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2Jsb2IvM2VhYTdjNjVmNmYwNzZhMDhhNWY3ZjE5NDZmZDBkZjdjNzQzMDI1OS9zcmMvY29tcGlsZXIvdHJhbnNmb3JtZXJzL3RzLnRzI0wyNDItTDI1MC5cbiAqXG4gKiBUaGlzIGlzIGEgdHJpY2sgdGhlIENMSSB1c2VkIGluIHRoZSBwYXN0ICBmb3IgY29uc3RydWN0b3IgcGFyYW1ldGVyIGRvd25sZXZlbGluZyBpbiBKSVQ6XG4gKiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9ibG9iL2IzZjg0Y2M1MTg0MzM3NjY2Y2U2MWMwN2I3YjlkZjQxODAzMDEwNmYvcGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy90cmFuc2Zvcm1lcnMvY3Rvci1wYXJhbWV0ZXJzLnRzI0wzMjMtTDMyNVxuICogVGhlIHRyaWNrIGlzIG5vdCBpZGVhbCB0aG91Z2ggYXMgaXQgcHJlc2VydmVzIHRoZSBmdWxsIGltcG9ydCAoYXMgb3V0bGluZWQgYmVmb3JlKSwgYW5kIGl0XG4gKiByZXN1bHRzIGluIGEgc2xvdy1kb3duIGR1ZSB0byB0aGUgdHlwZSBjaGVja2VyIGJlaW5nIGludm9sdmVkIG11bHRpcGxlIHRpbWVzLiBUaGUgQ0xJIHdvcmtlZFxuICogYXJvdW5kIHRoaXMgaW1wb3J0IHByZXNlcnZpbmcgaXNzdWUgYnkgaGF2aW5nIGFub3RoZXIgY29tcGxleCBwb3N0LXByb2Nlc3Mgc3RlcCB0aGF0IGRldGVjdHMgYW5kXG4gKiBlbGlkZXMgdW51c2VkIGltcG9ydHMuIE5vdGUgdGhhdCB0aGVzZSB1bnVzZWQgaW1wb3J0cyBjb3VsZCBjYXVzZSB1bnVzZWQgY2h1bmtzIGJlaW5nIGdlbmVyYXRlZFxuICogYnkgV2VicGFjayBpZiB0aGUgYXBwbGljYXRpb24gb3IgbGlicmFyeSBpcyBub3QgbWFya2VkIGFzIHNpZGUtZWZmZWN0IGZyZWUuXG4gKlxuICogVGhpcyBpcyBub3QgaWRlYWwgdGhvdWdoLCBhcyB3ZSBiYXNpY2FsbHkgcmUtaW1wbGVtZW50IHRoZSBjb21wbGV4IGltcG9ydCB1c2FnZSByZXNvbHV0aW9uXG4gKiBmcm9tIFR5cGVTY3JpcHQuIFdlIGNhbiBkbyBiZXR0ZXIgYnkgbGV0dGluZyBUeXBlU2NyaXB0IGRvIHRoZSBpbXBvcnQgZWxpZGluZywgYnV0IHByb3ZpZGluZ1xuICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFsaWFzIGRlY2xhcmF0aW9ucyAoZS5nLiBpbXBvcnQgc3BlY2lmaWVycykgdGhhdCBzaG91bGQgbm90IGJlIGVsaWRlZFxuICogYmVjYXVzZSB0aGV5IGFyZSBhY3R1YWxseSByZWZlcmVuY2VkIChhcyB0aGV5IHdpbGwgbm93IGFwcGVhciBpbiBzdGF0aWMgcHJvcGVydGllcykuXG4gKlxuICogTW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGVzZSBsaW1pdGF0aW9ucyB3aXRoIHRyYW5zZm9ybWVycyBjYW4gYmUgZm91bmQgaW46XG4gKiAgIDEuIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMTc1NTIuXG4gKiAgIDIuIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMTc1MTYuXG4gKiAgIDMuIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3RzaWNrbGUvaXNzdWVzLzYzNS5cbiAqXG4gKiBUaGUgcGF0Y2ggd2UgYXBwbHkgdG8gdGVsbCBUeXBlU2NyaXB0IGFib3V0IGFjdHVhbCByZWZlcmVuY2VkIGFsaWFzZXMgKGkuZS4gaW1wb3J0ZWQgc3ltYm9scyksXG4gKiBtYXRjaGVzIGNvbmNlcHR1YWxseSB3aXRoIHRoZSBsb2dpYyB0aGF0IHJ1bnMgaW50ZXJuYWxseSBpbiBUeXBlU2NyaXB0IHdoZW4gdGhlXG4gKiBgZW1pdERlY29yYXRvck1ldGFkYXRhYCBmbGFnIGlzIGVuYWJsZWQuIFR5cGVTY3JpcHQgYmFzaWNhbGx5IHN1cmZhY2VzIHRoZSBzYW1lIHByb2JsZW0gYW5kXG4gKiBzb2x2ZXMgaXQgY29uY2VwdHVhbGx5IHRoZSBzYW1lIHdheSwgYnV0IG9idmlvdXNseSBkb2Vzbid0IG5lZWQgdG8gYWNjZXNzIGFuIGBAaW50ZXJuYWxgIEFQSS5cbiAqXG4gKiBUaGUgc2V0IHRoYXQgaXMgcmV0dXJuZWQgYnkgdGhpcyBmdW5jdGlvbiBpcyBtZWFudCB0byBiZSBmaWxsZWQgd2l0aCBpbXBvcnQgZGVjbGFyYXRpb24gbm9kZXNcbiAqIHRoYXQgaGF2ZSBiZWVuIHJlZmVyZW5jZWQgaW4gYSB2YWx1ZS1wb3NpdGlvbiBieSB0aGUgdHJhbnNmb3JtLCBzdWNoIHRoZSBpbnN0YWxsZWQgcGF0Y2ggY2FuXG4gKiBlbnN1cmUgdGhhdCB0aG9zZSBpbXBvcnQgZGVjbGFyYXRpb25zIGFyZSBub3QgZWxpZGVkLlxuICpcbiAqIFNlZSBiZWxvdy4gTm90ZSB0aGF0IHRoaXMgdXNlcyBzb3VyY2VncmFwaCBhcyB0aGUgVHlwZVNjcmlwdCBjaGVja2VyIGZpbGUgZG9lc24ndCBkaXNwbGF5IG9uXG4gKiBHaXRodWIuXG4gKiBodHRwczovL3NvdXJjZWdyYXBoLmNvbS9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0QDNlYWE3YzY1ZjZmMDc2YTA4YTVmN2YxOTQ2ZmQwZGY3Yzc0MzAyNTkvLS9ibG9iL3NyYy9jb21waWxlci9jaGVja2VyLnRzI0wzMTIxOS0zMTI1N1xuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZElzUmVmZXJlbmNlZEFsaWFzRGVjbGFyYXRpb25QYXRjaChjb250ZXh0OiB0cy5UcmFuc2Zvcm1hdGlvbkNvbnRleHQpOlxuICAgIFNldDx0cy5EZWNsYXJhdGlvbj4ge1xuICAvLyBJZiB0aGUgYGdldEVtaXRSZXNvbHZlcmAgbWV0aG9kIGlzIG5vdCBhdmFpbGFibGUsIFRTIG1vc3QgbGlrZWx5IGNoYW5nZWQgdGhlXG4gIC8vIGludGVybmFsIHN0cnVjdHVyZSBvZiB0aGUgdHJhbnNmb3JtYXRpb24gY29udGV4dC4gV2Ugd2lsbCBhYm9ydCBncmFjZWZ1bGx5LlxuICBpZiAoIWlzVHJhbnNmb3JtYXRpb25Db250ZXh0V2l0aEVtaXRSZXNvbHZlcihjb250ZXh0KSkge1xuICAgIHRocm93SW5jb21wYXRpYmxlVHJhbnNmb3JtYXRpb25Db250ZXh0RXJyb3IoKTtcbiAgfVxuICBjb25zdCBlbWl0UmVzb2x2ZXIgPSBjb250ZXh0LmdldEVtaXRSZXNvbHZlcigpO1xuXG4gIC8vIFRoZSBlbWl0IHJlc29sdmVyIG1heSBoYXZlIGJlZW4gcGF0Y2hlZCBhbHJlYWR5LCBpbiB3aGljaCBjYXNlIHdlIHJldHVybiB0aGUgc2V0IG9mIHJlZmVyZW5jZWRcbiAgLy8gYWxpYXNlcyB0aGF0IHdhcyBjcmVhdGVkIHdoZW4gdGhlIHBhdGNoIHdhcyBmaXJzdCBhcHBsaWVkLlxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvNDAyNzYuXG4gIGNvbnN0IGV4aXN0aW5nUmVmZXJlbmNlZEFsaWFzZXMgPSBlbWl0UmVzb2x2ZXJbcGF0Y2hlZFJlZmVyZW5jZWRBbGlhc2VzU3ltYm9sXTtcbiAgaWYgKGV4aXN0aW5nUmVmZXJlbmNlZEFsaWFzZXMgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBleGlzdGluZ1JlZmVyZW5jZWRBbGlhc2VzO1xuICB9XG5cbiAgY29uc3Qgb3JpZ2luYWxJc1JlZmVyZW5jZWRBbGlhc0RlY2xhcmF0aW9uID0gZW1pdFJlc29sdmVyLmlzUmVmZXJlbmNlZEFsaWFzRGVjbGFyYXRpb247XG4gIC8vIElmIHRoZSBlbWl0IHJlc29sdmVyIGRvZXMgbm90IGhhdmUgYSBmdW5jdGlvbiBjYWxsZWQgYGlzUmVmZXJlbmNlZEFsaWFzRGVjbGFyYXRpb25gLCB0aGVuXG4gIC8vIHdlIGFib3J0IGdyYWNlZnVsbHkgYXMgbW9zdCBsaWtlbHkgVFMgY2hhbmdlZCB0aGUgaW50ZXJuYWwgc3RydWN0dXJlIG9mIHRoZSBlbWl0IHJlc29sdmVyLlxuICBpZiAob3JpZ2luYWxJc1JlZmVyZW5jZWRBbGlhc0RlY2xhcmF0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvd0luY29tcGF0aWJsZVRyYW5zZm9ybWF0aW9uQ29udGV4dEVycm9yKCk7XG4gIH1cblxuICBjb25zdCByZWZlcmVuY2VkQWxpYXNlcyA9IG5ldyBTZXQ8dHMuRGVjbGFyYXRpb24+KCk7XG4gIGVtaXRSZXNvbHZlci5pc1JlZmVyZW5jZWRBbGlhc0RlY2xhcmF0aW9uID0gZnVuY3Rpb24obm9kZSwgLi4uYXJncykge1xuICAgIGlmIChpc0FsaWFzSW1wb3J0RGVjbGFyYXRpb24obm9kZSkgJiYgcmVmZXJlbmNlZEFsaWFzZXMuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG9yaWdpbmFsSXNSZWZlcmVuY2VkQWxpYXNEZWNsYXJhdGlvbi5jYWxsKGVtaXRSZXNvbHZlciwgbm9kZSwgLi4uYXJncyk7XG4gIH07XG4gIHJldHVybiBlbWl0UmVzb2x2ZXJbcGF0Y2hlZFJlZmVyZW5jZWRBbGlhc2VzU3ltYm9sXSA9IHJlZmVyZW5jZWRBbGlhc2VzO1xufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciBhIGdpdmVuIG5vZGUgY29ycmVzcG9uZHMgdG8gYW4gaW1wb3J0IGFsaWFzIGRlY2xhcmF0aW9uLiBBbGlhc1xuICogZGVjbGFyYXRpb25zIGNhbiBiZSBpbXBvcnQgc3BlY2lmaWVycywgbmFtZXNwYWNlIGltcG9ydHMgb3IgaW1wb3J0IGNsYXVzZXNcbiAqIGFzIHRoZXNlIGRvIG5vdCBkZWNsYXJlIGFuIGFjdHVhbCBzeW1ib2wgYnV0IGp1c3QgcG9pbnQgdG8gYSB0YXJnZXQgZGVjbGFyYXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0FsaWFzSW1wb3J0RGVjbGFyYXRpb24obm9kZTogdHMuTm9kZSk6IG5vZGUgaXMgdHMuSW1wb3J0U3BlY2lmaWVyfFxuICAgIHRzLk5hbWVzcGFjZUltcG9ydHx0cy5JbXBvcnRDbGF1c2Uge1xuICByZXR1cm4gdHMuaXNJbXBvcnRTcGVjaWZpZXIobm9kZSkgfHwgdHMuaXNOYW1lc3BhY2VJbXBvcnQobm9kZSkgfHwgdHMuaXNJbXBvcnRDbGF1c2Uobm9kZSk7XG59XG5cbi8qKiBXaGV0aGVyIHRoZSB0cmFuc2Zvcm1hdGlvbiBjb250ZXh0IGV4cG9zZXMgaXRzIGVtaXQgcmVzb2x2ZXIuICovXG5mdW5jdGlvbiBpc1RyYW5zZm9ybWF0aW9uQ29udGV4dFdpdGhFbWl0UmVzb2x2ZXIoY29udGV4dDogdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0KTpcbiAgICBjb250ZXh0IGlzIFRyYW5zZm9ybWF0aW9uQ29udGV4dFdpdGhSZXNvbHZlciB7XG4gIHJldHVybiAoY29udGV4dCBhcyBQYXJ0aWFsPFRyYW5zZm9ybWF0aW9uQ29udGV4dFdpdGhSZXNvbHZlcj4pLmdldEVtaXRSZXNvbHZlciAhPT0gdW5kZWZpbmVkO1xufVxuXG5cbi8qKlxuICogVGhyb3dzIGFuIGVycm9yIGFib3V0IGFuIGluY29tcGF0aWJsZSBUeXBlU2NyaXB0IHZlcnNpb24gZm9yIHdoaWNoIHRoZSBhbGlhc1xuICogZGVjbGFyYXRpb24gcmVmZXJlbmNlIHJlc29sdXRpb24gY291bGQgbm90IGJlIG1vbmtleS1wYXRjaGVkLiBUaGUgZXJyb3Igd2lsbFxuICogYWxzbyBwcm9wb3NlIHBvdGVudGlhbCBzb2x1dGlvbnMgdGhhdCBjYW4gYmUgYXBwbGllZCBieSBkZXZlbG9wZXJzLlxuICovXG5mdW5jdGlvbiB0aHJvd0luY29tcGF0aWJsZVRyYW5zZm9ybWF0aW9uQ29udGV4dEVycm9yKCk6IG5ldmVyIHtcbiAgdGhyb3cgRXJyb3IoXG4gICAgICAnVW5hYmxlIHRvIGRvd25sZXZlbCBBbmd1bGFyIGRlY29yYXRvcnMgZHVlIHRvIGFuIGluY29tcGF0aWJsZSBUeXBlU2NyaXB0ICcgK1xuICAgICAgJ3ZlcnNpb24uXFxuSWYgeW91IHJlY2VudGx5IHVwZGF0ZWQgVHlwZVNjcmlwdCBhbmQgdGhpcyBpc3N1ZSBzdXJmYWNlcyBub3csIGNvbnNpZGVyICcgK1xuICAgICAgJ2Rvd25ncmFkaW5nLlxcblxcbicgK1xuICAgICAgJ1BsZWFzZSByZXBvcnQgYW4gaXNzdWUgb24gdGhlIEFuZ3VsYXIgcmVwb3NpdG9yaWVzIHdoZW4gdGhpcyBpc3N1ZSAnICtcbiAgICAgICdzdXJmYWNlcyBhbmQgeW91IGFyZSB1c2luZyBhIHN1cHBvc2VkbHkgY29tcGF0aWJsZSBUeXBlU2NyaXB0IHZlcnNpb24uJyk7XG59XG4iXX0=