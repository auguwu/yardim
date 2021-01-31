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
        define("@angular/compiler-cli/src/ngtsc/annotations/src/diagnostics", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/diagnostics", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/util/src/typescript", "@angular/compiler-cli/src/ngtsc/annotations/src/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkInheritanceOfDirective = exports.getUndecoratedClassWithAngularFeaturesDiagnostic = exports.getDirectiveDiagnostics = exports.getProviderDiagnostics = exports.createValueHasWrongTypeError = void 0;
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    var partial_evaluator_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator");
    var typescript_1 = require("@angular/compiler-cli/src/ngtsc/util/src/typescript");
    var util_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/util");
    /**
     * Creates a `FatalDiagnosticError` for a node that did not evaluate to the expected type. The
     * diagnostic that is created will include details on why the value is incorrect, i.e. it includes
     * a representation of the actual type that was unsupported, or in the case of a dynamic value the
     * trace to the node where the dynamic value originated.
     *
     * @param node The node for which the diagnostic should be produced.
     * @param value The evaluated value that has the wrong type.
     * @param messageText The message text of the error.
     */
    function createValueHasWrongTypeError(node, value, messageText) {
        var _a;
        var chainedMessage;
        var relatedInformation;
        if (value instanceof partial_evaluator_1.DynamicValue) {
            chainedMessage = 'Value could not be determined statically.';
            relatedInformation = partial_evaluator_1.traceDynamicValue(node, value);
        }
        else if (value instanceof imports_1.Reference) {
            var target = value.debugName !== null ? "'" + value.debugName + "'" : 'an anonymous declaration';
            chainedMessage = "Value is a reference to " + target + ".";
            var referenceNode = (_a = typescript_1.identifierOfNode(value.node)) !== null && _a !== void 0 ? _a : value.node;
            relatedInformation = [diagnostics_1.makeRelatedInformation(referenceNode, 'Reference is declared here.')];
        }
        else {
            chainedMessage = "Value is of type '" + partial_evaluator_1.describeResolvedType(value) + "'.";
        }
        var chain = {
            messageText: messageText,
            category: ts.DiagnosticCategory.Error,
            code: 0,
            next: [{
                    messageText: chainedMessage,
                    category: ts.DiagnosticCategory.Message,
                    code: 0,
                }]
        };
        return new diagnostics_1.FatalDiagnosticError(diagnostics_1.ErrorCode.VALUE_HAS_WRONG_TYPE, node, chain, relatedInformation);
    }
    exports.createValueHasWrongTypeError = createValueHasWrongTypeError;
    /**
     * Gets the diagnostics for a set of provider classes.
     * @param providerClasses Classes that should be checked.
     * @param providersDeclaration Node that declares the providers array.
     * @param registry Registry that keeps track of the registered injectable classes.
     */
    function getProviderDiagnostics(providerClasses, providersDeclaration, registry) {
        var e_1, _a;
        var diagnostics = [];
        try {
            for (var providerClasses_1 = tslib_1.__values(providerClasses), providerClasses_1_1 = providerClasses_1.next(); !providerClasses_1_1.done; providerClasses_1_1 = providerClasses_1.next()) {
                var provider = providerClasses_1_1.value;
                if (registry.isInjectable(provider.node)) {
                    continue;
                }
                var contextNode = provider.getOriginForDiagnostics(providersDeclaration);
                diagnostics.push(diagnostics_1.makeDiagnostic(diagnostics_1.ErrorCode.UNDECORATED_PROVIDER, contextNode, "The class '" + provider.node.name
                    .text + "' cannot be created via dependency injection, as it does not have an Angular decorator. This will result in an error at runtime.\n\nEither add the @Injectable() decorator to '" + provider.node.name
                    .text + "', or configure a different provider (such as a provider with 'useFactory').\n", [diagnostics_1.makeRelatedInformation(provider.node, "'" + provider.node.name.text + "' is declared here.")]));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (providerClasses_1_1 && !providerClasses_1_1.done && (_a = providerClasses_1.return)) _a.call(providerClasses_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return diagnostics;
    }
    exports.getProviderDiagnostics = getProviderDiagnostics;
    function getDirectiveDiagnostics(node, reader, evaluator, reflector, scopeRegistry, kind) {
        var diagnostics = [];
        var addDiagnostics = function (more) {
            if (more === null) {
                return;
            }
            else if (diagnostics === null) {
                diagnostics = Array.isArray(more) ? more : [more];
            }
            else if (Array.isArray(more)) {
                diagnostics.push.apply(diagnostics, tslib_1.__spread(more));
            }
            else {
                diagnostics.push(more);
            }
        };
        var duplicateDeclarations = scopeRegistry.getDuplicateDeclarations(node);
        if (duplicateDeclarations !== null) {
            addDiagnostics(util_1.makeDuplicateDeclarationError(node, duplicateDeclarations, kind));
        }
        addDiagnostics(checkInheritanceOfDirective(node, reader, reflector, evaluator));
        return diagnostics;
    }
    exports.getDirectiveDiagnostics = getDirectiveDiagnostics;
    function getUndecoratedClassWithAngularFeaturesDiagnostic(node) {
        return diagnostics_1.makeDiagnostic(diagnostics_1.ErrorCode.UNDECORATED_CLASS_USING_ANGULAR_FEATURES, node.name, "Class is using Angular features but is not decorated. Please add an explicit " +
            "Angular decorator.");
    }
    exports.getUndecoratedClassWithAngularFeaturesDiagnostic = getUndecoratedClassWithAngularFeaturesDiagnostic;
    function checkInheritanceOfDirective(node, reader, reflector, evaluator) {
        if (!reflector.isClass(node) || reflector.getConstructorParameters(node) !== null) {
            // We should skip nodes that aren't classes. If a constructor exists, then no base class
            // definition is required on the runtime side - it's legal to inherit from any class.
            return null;
        }
        // The extends clause is an expression which can be as dynamic as the user wants. Try to
        // evaluate it, but fall back on ignoring the clause if it can't be understood. This is a View
        // Engine compatibility hack: View Engine ignores 'extends' expressions that it cannot understand.
        var baseClass = util_1.readBaseClass(node, reflector, evaluator);
        while (baseClass !== null) {
            if (baseClass === 'dynamic') {
                return null;
            }
            // We can skip the base class if it has metadata.
            var baseClassMeta = reader.getDirectiveMetadata(baseClass);
            if (baseClassMeta !== null) {
                return null;
            }
            // If the base class has a blank constructor we can skip it since it can't be using DI.
            var baseClassConstructorParams = reflector.getConstructorParameters(baseClass.node);
            var newParentClass = util_1.readBaseClass(baseClass.node, reflector, evaluator);
            if (baseClassConstructorParams !== null && baseClassConstructorParams.length > 0) {
                // This class has a non-trivial constructor, that's an error!
                return getInheritedUndecoratedCtorDiagnostic(node, baseClass, reader);
            }
            else if (baseClassConstructorParams !== null || newParentClass === null) {
                // This class has a trivial constructor, or no constructor + is the
                // top of the inheritance chain, so it's okay.
                return null;
            }
            // Go up the chain and continue
            baseClass = newParentClass;
        }
        return null;
    }
    exports.checkInheritanceOfDirective = checkInheritanceOfDirective;
    function getInheritedUndecoratedCtorDiagnostic(node, baseClass, reader) {
        var subclassMeta = reader.getDirectiveMetadata(new imports_1.Reference(node));
        var dirOrComp = subclassMeta.isComponent ? 'Component' : 'Directive';
        var baseClassName = baseClass.debugName;
        return diagnostics_1.makeDiagnostic(diagnostics_1.ErrorCode.DIRECTIVE_INHERITS_UNDECORATED_CTOR, node.name, "The " + dirOrComp.toLowerCase() + " " + node.name.text + " inherits its constructor from " + baseClassName + ", " +
            "but the latter does not have an Angular decorator of its own. Dependency injection will not be able to " +
            ("resolve the parameters of " + baseClassName + "'s constructor. Either add a @Directive decorator ") +
            ("to " + baseClassName + ", or add an explicit constructor to " + node.name.text + "."));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2Fubm90YXRpb25zL3NyYy9kaWFnbm9zdGljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQWlDO0lBRWpDLDJFQUEwRztJQUMxRyxtRUFBd0M7SUFFeEMsdUZBQStIO0lBRy9ILGtGQUEyRDtJQUUzRCw2RUFBb0U7SUFFcEU7Ozs7Ozs7OztPQVNHO0lBQ0gsU0FBZ0IsNEJBQTRCLENBQ3hDLElBQWEsRUFBRSxLQUFvQixFQUFFLFdBQW1COztRQUMxRCxJQUFJLGNBQXNCLENBQUM7UUFDM0IsSUFBSSxrQkFBK0QsQ0FBQztRQUNwRSxJQUFJLEtBQUssWUFBWSxnQ0FBWSxFQUFFO1lBQ2pDLGNBQWMsR0FBRywyQ0FBMkMsQ0FBQztZQUM3RCxrQkFBa0IsR0FBRyxxQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckQ7YUFBTSxJQUFJLEtBQUssWUFBWSxtQkFBUyxFQUFFO1lBQ3JDLElBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFJLEtBQUssQ0FBQyxTQUFTLE1BQUcsQ0FBQyxDQUFDLENBQUMsMEJBQTBCLENBQUM7WUFDOUYsY0FBYyxHQUFHLDZCQUEyQixNQUFNLE1BQUcsQ0FBQztZQUV0RCxJQUFNLGFBQWEsU0FBRyw2QkFBZ0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLG1DQUFJLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDakUsa0JBQWtCLEdBQUcsQ0FBQyxvQ0FBc0IsQ0FBQyxhQUFhLEVBQUUsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1NBQzdGO2FBQU07WUFDTCxjQUFjLEdBQUcsdUJBQXFCLHdDQUFvQixDQUFDLEtBQUss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Q0FBQyxFQUFFO2dCQUNoRiw2REFBNkQ7Z0JBQzdELE9BQU8scUNBQXFDLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQzthQUN2RTtpQkFBTSxJQUFJLDBCQUEwQixLQUFLLElBQUksSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO2dCQUN6RSxtRUFBbUU7Z0JBQ25FLDhDQUE4QztnQkFDOUMsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELCtCQUErQjtZQUMvQixTQUFTLEdBQUcsY0FBYyxDQUFDO1NBQzVCO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBM0NELGtFQTJDQztJQUVELFNBQVMscUNBQXFDLENBQzFDLElBQXNCLEVBQUUsU0FBb0IsRUFBRSxNQUFzQjtRQUN0RSxJQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsSUFBSSxtQkFBUyxDQUFDLElBQUksQ0FBQyxDQUFFLENBQUM7UUFDdkUsSUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDdkUsSUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUUxQyxPQUFPLDRCQUFjLENBQ2pCLHVCQUFTLENBQUMsbUNBQW1DLEVBQUUsSUFBSSxDQUFDLElBQUksRUFDeEQsU0FBTyxTQUFTLENBQUMsV0FBVyxFQUFFLFNBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLHVDQUM1QyxhQUFhLE9BQUk7WUFDakIseUdBQXlHO2FBQ3pHLCtCQUNJLGFBQWEsdURBQW9ELENBQUE7YUFDckUsUUFBTSxhQUFhLDRDQUF1QyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksTUFBRyxDQUFBLENBQUMsQ0FBQztJQUN2RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0Vycm9yQ29kZSwgRmF0YWxEaWFnbm9zdGljRXJyb3IsIG1ha2VEaWFnbm9zdGljLCBtYWtlUmVsYXRlZEluZm9ybWF0aW9ufSBmcm9tICcuLi8uLi9kaWFnbm9zdGljcyc7XG5pbXBvcnQge1JlZmVyZW5jZX0gZnJvbSAnLi4vLi4vaW1wb3J0cyc7XG5pbXBvcnQge0luamVjdGFibGVDbGFzc1JlZ2lzdHJ5LCBNZXRhZGF0YVJlYWRlcn0gZnJvbSAnLi4vLi4vbWV0YWRhdGEnO1xuaW1wb3J0IHtkZXNjcmliZVJlc29sdmVkVHlwZSwgRHluYW1pY1ZhbHVlLCBQYXJ0aWFsRXZhbHVhdG9yLCBSZXNvbHZlZFZhbHVlLCB0cmFjZUR5bmFtaWNWYWx1ZX0gZnJvbSAnLi4vLi4vcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0IHtDbGFzc0RlY2xhcmF0aW9uLCBSZWZsZWN0aW9uSG9zdH0gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbic7XG5pbXBvcnQge0xvY2FsTW9kdWxlU2NvcGVSZWdpc3RyeX0gZnJvbSAnLi4vLi4vc2NvcGUnO1xuaW1wb3J0IHtpZGVudGlmaWVyT2ZOb2RlfSBmcm9tICcuLi8uLi91dGlsL3NyYy90eXBlc2NyaXB0JztcblxuaW1wb3J0IHttYWtlRHVwbGljYXRlRGVjbGFyYXRpb25FcnJvciwgcmVhZEJhc2VDbGFzc30gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgYEZhdGFsRGlhZ25vc3RpY0Vycm9yYCBmb3IgYSBub2RlIHRoYXQgZGlkIG5vdCBldmFsdWF0ZSB0byB0aGUgZXhwZWN0ZWQgdHlwZS4gVGhlXG4gKiBkaWFnbm9zdGljIHRoYXQgaXMgY3JlYXRlZCB3aWxsIGluY2x1ZGUgZGV0YWlscyBvbiB3aHkgdGhlIHZhbHVlIGlzIGluY29ycmVjdCwgaS5lLiBpdCBpbmNsdWRlc1xuICogYSByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWN0dWFsIHR5cGUgdGhhdCB3YXMgdW5zdXBwb3J0ZWQsIG9yIGluIHRoZSBjYXNlIG9mIGEgZHluYW1pYyB2YWx1ZSB0aGVcbiAqIHRyYWNlIHRvIHRoZSBub2RlIHdoZXJlIHRoZSBkeW5hbWljIHZhbHVlIG9yaWdpbmF0ZWQuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgZm9yIHdoaWNoIHRoZSBkaWFnbm9zdGljIHNob3VsZCBiZSBwcm9kdWNlZC5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgZXZhbHVhdGVkIHZhbHVlIHRoYXQgaGFzIHRoZSB3cm9uZyB0eXBlLlxuICogQHBhcmFtIG1lc3NhZ2VUZXh0IFRoZSBtZXNzYWdlIHRleHQgb2YgdGhlIGVycm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmFsdWVIYXNXcm9uZ1R5cGVFcnJvcihcbiAgICBub2RlOiB0cy5Ob2RlLCB2YWx1ZTogUmVzb2x2ZWRWYWx1ZSwgbWVzc2FnZVRleHQ6IHN0cmluZyk6IEZhdGFsRGlhZ25vc3RpY0Vycm9yIHtcbiAgbGV0IGNoYWluZWRNZXNzYWdlOiBzdHJpbmc7XG4gIGxldCByZWxhdGVkSW5mb3JtYXRpb246IHRzLkRpYWdub3N0aWNSZWxhdGVkSW5mb3JtYXRpb25bXXx1bmRlZmluZWQ7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIER5bmFtaWNWYWx1ZSkge1xuICAgIGNoYWluZWRNZXNzYWdlID0gJ1ZhbHVlIGNvdWxkIG5vdCBiZSBkZXRlcm1pbmVkIHN0YXRpY2FsbHkuJztcbiAgICByZWxhdGVkSW5mb3JtYXRpb24gPSB0cmFjZUR5bmFtaWNWYWx1ZShub2RlLCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWZlcmVuY2UpIHtcbiAgICBjb25zdCB0YXJnZXQgPSB2YWx1ZS5kZWJ1Z05hbWUgIT09IG51bGwgPyBgJyR7dmFsdWUuZGVidWdOYW1lfSdgIDogJ2FuIGFub255bW91cyBkZWNsYXJhdGlvbic7XG4gICAgY2hhaW5lZE1lc3NhZ2UgPSBgVmFsdWUgaXMgYSByZWZlcmVuY2UgdG8gJHt0YXJnZXR9LmA7XG5cbiAgICBjb25zdCByZWZlcmVuY2VOb2RlID0gaWRlbnRpZmllck9mTm9kZSh2YWx1ZS5ub2RlKSA/PyB2YWx1ZS5ub2RlO1xuICAgIHJlbGF0ZWRJbmZvcm1hdGlvbiA9IFttYWtlUmVsYXRlZEluZm9ybWF0aW9uKHJlZmVyZW5jZU5vZGUsICdSZWZlcmVuY2UgaXMgZGVjbGFyZWQgaGVyZS4nKV07XG4gIH0gZWxzZSB7XG4gICAgY2hhaW5lZE1lc3NhZ2UgPSBgVmFsdWUgaXMgb2YgdHlwZSAnJHtkZXNjcmliZVJlc29sdmVkVHlwZSh2YWx1ZSl9Jy5gO1xuICB9XG5cbiAgY29uc3QgY2hhaW46IHRzLkRpYWdub3N0aWNNZXNzYWdlQ2hhaW4gPSB7XG4gICAgbWVzc2FnZVRleHQsXG4gICAgY2F0ZWdvcnk6IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcixcbiAgICBjb2RlOiAwLFxuICAgIG5leHQ6IFt7XG4gICAgICBtZXNzYWdlVGV4dDogY2hhaW5lZE1lc3NhZ2UsXG4gICAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5Lk1lc3NhZ2UsXG4gICAgICBjb2RlOiAwLFxuICAgIH1dXG4gIH07XG5cbiAgcmV0dXJuIG5ldyBGYXRhbERpYWdub3N0aWNFcnJvcihFcnJvckNvZGUuVkFMVUVfSEFTX1dST05HX1RZUEUsIG5vZGUsIGNoYWluLCByZWxhdGVkSW5mb3JtYXRpb24pO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGRpYWdub3N0aWNzIGZvciBhIHNldCBvZiBwcm92aWRlciBjbGFzc2VzLlxuICogQHBhcmFtIHByb3ZpZGVyQ2xhc3NlcyBDbGFzc2VzIHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gKiBAcGFyYW0gcHJvdmlkZXJzRGVjbGFyYXRpb24gTm9kZSB0aGF0IGRlY2xhcmVzIHRoZSBwcm92aWRlcnMgYXJyYXkuXG4gKiBAcGFyYW0gcmVnaXN0cnkgUmVnaXN0cnkgdGhhdCBrZWVwcyB0cmFjayBvZiB0aGUgcmVnaXN0ZXJlZCBpbmplY3RhYmxlIGNsYXNzZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm92aWRlckRpYWdub3N0aWNzKFxuICAgIHByb3ZpZGVyQ2xhc3NlczogU2V0PFJlZmVyZW5jZTxDbGFzc0RlY2xhcmF0aW9uPj4sIHByb3ZpZGVyc0RlY2xhcmF0aW9uOiB0cy5FeHByZXNzaW9uLFxuICAgIHJlZ2lzdHJ5OiBJbmplY3RhYmxlQ2xhc3NSZWdpc3RyeSk6IHRzLkRpYWdub3N0aWNbXSB7XG4gIGNvbnN0IGRpYWdub3N0aWNzOiB0cy5EaWFnbm9zdGljW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHByb3ZpZGVyIG9mIHByb3ZpZGVyQ2xhc3Nlcykge1xuICAgIGlmIChyZWdpc3RyeS5pc0luamVjdGFibGUocHJvdmlkZXIubm9kZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRleHROb2RlID0gcHJvdmlkZXIuZ2V0T3JpZ2luRm9yRGlhZ25vc3RpY3MocHJvdmlkZXJzRGVjbGFyYXRpb24pO1xuICAgIGRpYWdub3N0aWNzLnB1c2gobWFrZURpYWdub3N0aWMoXG4gICAgICAgIEVycm9yQ29kZS5VTkRFQ09SQVRFRF9QUk9WSURFUiwgY29udGV4dE5vZGUsXG4gICAgICAgIGBUaGUgY2xhc3MgJyR7XG4gICAgICAgICAgICBwcm92aWRlci5ub2RlLm5hbWVcbiAgICAgICAgICAgICAgICAudGV4dH0nIGNhbm5vdCBiZSBjcmVhdGVkIHZpYSBkZXBlbmRlbmN5IGluamVjdGlvbiwgYXMgaXQgZG9lcyBub3QgaGF2ZSBhbiBBbmd1bGFyIGRlY29yYXRvci4gVGhpcyB3aWxsIHJlc3VsdCBpbiBhbiBlcnJvciBhdCBydW50aW1lLlxuXG5FaXRoZXIgYWRkIHRoZSBASW5qZWN0YWJsZSgpIGRlY29yYXRvciB0byAnJHtcbiAgICAgICAgICAgIHByb3ZpZGVyLm5vZGUubmFtZVxuICAgICAgICAgICAgICAgIC50ZXh0fScsIG9yIGNvbmZpZ3VyZSBhIGRpZmZlcmVudCBwcm92aWRlciAoc3VjaCBhcyBhIHByb3ZpZGVyIHdpdGggJ3VzZUZhY3RvcnknKS5cbmAsXG4gICAgICAgIFttYWtlUmVsYXRlZEluZm9ybWF0aW9uKHByb3ZpZGVyLm5vZGUsIGAnJHtwcm92aWRlci5ub2RlLm5hbWUudGV4dH0nIGlzIGRlY2xhcmVkIGhlcmUuYCldKSk7XG4gIH1cblxuICByZXR1cm4gZGlhZ25vc3RpY3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXJlY3RpdmVEaWFnbm9zdGljcyhcbiAgICBub2RlOiBDbGFzc0RlY2xhcmF0aW9uLCByZWFkZXI6IE1ldGFkYXRhUmVhZGVyLCBldmFsdWF0b3I6IFBhcnRpYWxFdmFsdWF0b3IsXG4gICAgcmVmbGVjdG9yOiBSZWZsZWN0aW9uSG9zdCwgc2NvcGVSZWdpc3RyeTogTG9jYWxNb2R1bGVTY29wZVJlZ2lzdHJ5LFxuICAgIGtpbmQ6IHN0cmluZyk6IHRzLkRpYWdub3N0aWNbXXxudWxsIHtcbiAgbGV0IGRpYWdub3N0aWNzOiB0cy5EaWFnbm9zdGljW118bnVsbCA9IFtdO1xuXG4gIGNvbnN0IGFkZERpYWdub3N0aWNzID0gKG1vcmU6IHRzLkRpYWdub3N0aWN8dHMuRGlhZ25vc3RpY1tdfG51bGwpID0+IHtcbiAgICBpZiAobW9yZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoZGlhZ25vc3RpY3MgPT09IG51bGwpIHtcbiAgICAgIGRpYWdub3N0aWNzID0gQXJyYXkuaXNBcnJheShtb3JlKSA/IG1vcmUgOiBbbW9yZV07XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG1vcmUpKSB7XG4gICAgICBkaWFnbm9zdGljcy5wdXNoKC4uLm1vcmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkaWFnbm9zdGljcy5wdXNoKG1vcmUpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBkdXBsaWNhdGVEZWNsYXJhdGlvbnMgPSBzY29wZVJlZ2lzdHJ5LmdldER1cGxpY2F0ZURlY2xhcmF0aW9ucyhub2RlKTtcblxuICBpZiAoZHVwbGljYXRlRGVjbGFyYXRpb25zICE9PSBudWxsKSB7XG4gICAgYWRkRGlhZ25vc3RpY3MobWFrZUR1cGxpY2F0ZURlY2xhcmF0aW9uRXJyb3Iobm9kZSwgZHVwbGljYXRlRGVjbGFyYXRpb25zLCBraW5kKSk7XG4gIH1cblxuICBhZGREaWFnbm9zdGljcyhjaGVja0luaGVyaXRhbmNlT2ZEaXJlY3RpdmUobm9kZSwgcmVhZGVyLCByZWZsZWN0b3IsIGV2YWx1YXRvcikpO1xuICByZXR1cm4gZGlhZ25vc3RpY3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmRlY29yYXRlZENsYXNzV2l0aEFuZ3VsYXJGZWF0dXJlc0RpYWdub3N0aWMobm9kZTogQ2xhc3NEZWNsYXJhdGlvbik6XG4gICAgdHMuRGlhZ25vc3RpYyB7XG4gIHJldHVybiBtYWtlRGlhZ25vc3RpYyhcbiAgICAgIEVycm9yQ29kZS5VTkRFQ09SQVRFRF9DTEFTU19VU0lOR19BTkdVTEFSX0ZFQVRVUkVTLCBub2RlLm5hbWUsXG4gICAgICBgQ2xhc3MgaXMgdXNpbmcgQW5ndWxhciBmZWF0dXJlcyBidXQgaXMgbm90IGRlY29yYXRlZC4gUGxlYXNlIGFkZCBhbiBleHBsaWNpdCBgICtcbiAgICAgICAgICBgQW5ndWxhciBkZWNvcmF0b3IuYCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0luaGVyaXRhbmNlT2ZEaXJlY3RpdmUoXG4gICAgbm9kZTogQ2xhc3NEZWNsYXJhdGlvbiwgcmVhZGVyOiBNZXRhZGF0YVJlYWRlciwgcmVmbGVjdG9yOiBSZWZsZWN0aW9uSG9zdCxcbiAgICBldmFsdWF0b3I6IFBhcnRpYWxFdmFsdWF0b3IpOiB0cy5EaWFnbm9zdGljfG51bGwge1xuICBpZiAoIXJlZmxlY3Rvci5pc0NsYXNzKG5vZGUpIHx8IHJlZmxlY3Rvci5nZXRDb25zdHJ1Y3RvclBhcmFtZXRlcnMobm9kZSkgIT09IG51bGwpIHtcbiAgICAvLyBXZSBzaG91bGQgc2tpcCBub2RlcyB0aGF0IGFyZW4ndCBjbGFzc2VzLiBJZiBhIGNvbnN0cnVjdG9yIGV4aXN0cywgdGhlbiBubyBiYXNlIGNsYXNzXG4gICAgLy8gZGVmaW5pdGlvbiBpcyByZXF1aXJlZCBvbiB0aGUgcnVudGltZSBzaWRlIC0gaXQncyBsZWdhbCB0byBpbmhlcml0IGZyb20gYW55IGNsYXNzLlxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gVGhlIGV4dGVuZHMgY2xhdXNlIGlzIGFuIGV4cHJlc3Npb24gd2hpY2ggY2FuIGJlIGFzIGR5bmFtaWMgYXMgdGhlIHVzZXIgd2FudHMuIFRyeSB0b1xuICAvLyBldmFsdWF0ZSBpdCwgYnV0IGZhbGwgYmFjayBvbiBpZ25vcmluZyB0aGUgY2xhdXNlIGlmIGl0IGNhbid0IGJlIHVuZGVyc3Rvb2QuIFRoaXMgaXMgYSBWaWV3XG4gIC8vIEVuZ2luZSBjb21wYXRpYmlsaXR5IGhhY2s6IFZpZXcgRW5naW5lIGlnbm9yZXMgJ2V4dGVuZHMnIGV4cHJlc3Npb25zIHRoYXQgaXQgY2Fubm90IHVuZGVyc3RhbmQuXG4gIGxldCBiYXNlQ2xhc3MgPSByZWFkQmFzZUNsYXNzKG5vZGUsIHJlZmxlY3RvciwgZXZhbHVhdG9yKTtcblxuICB3aGlsZSAoYmFzZUNsYXNzICE9PSBudWxsKSB7XG4gICAgaWYgKGJhc2VDbGFzcyA9PT0gJ2R5bmFtaWMnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBXZSBjYW4gc2tpcCB0aGUgYmFzZSBjbGFzcyBpZiBpdCBoYXMgbWV0YWRhdGEuXG4gICAgY29uc3QgYmFzZUNsYXNzTWV0YSA9IHJlYWRlci5nZXREaXJlY3RpdmVNZXRhZGF0YShiYXNlQ2xhc3MpO1xuICAgIGlmIChiYXNlQ2xhc3NNZXRhICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYmFzZSBjbGFzcyBoYXMgYSBibGFuayBjb25zdHJ1Y3RvciB3ZSBjYW4gc2tpcCBpdCBzaW5jZSBpdCBjYW4ndCBiZSB1c2luZyBESS5cbiAgICBjb25zdCBiYXNlQ2xhc3NDb25zdHJ1Y3RvclBhcmFtcyA9IHJlZmxlY3Rvci5nZXRDb25zdHJ1Y3RvclBhcmFtZXRlcnMoYmFzZUNsYXNzLm5vZGUpO1xuICAgIGNvbnN0IG5ld1BhcmVudENsYXNzID0gcmVhZEJhc2VDbGFzcyhiYXNlQ2xhc3Mubm9kZSwgcmVmbGVjdG9yLCBldmFsdWF0b3IpO1xuXG4gICAgaWYgKGJhc2VDbGFzc0NvbnN0cnVjdG9yUGFyYW1zICE9PSBudWxsICYmIGJhc2VDbGFzc0NvbnN0cnVjdG9yUGFyYW1zLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIFRoaXMgY2xhc3MgaGFzIGEgbm9uLXRyaXZpYWwgY29uc3RydWN0b3IsIHRoYXQncyBhbiBlcnJvciFcbiAgICAgIHJldHVybiBnZXRJbmhlcml0ZWRVbmRlY29yYXRlZEN0b3JEaWFnbm9zdGljKG5vZGUsIGJhc2VDbGFzcywgcmVhZGVyKTtcbiAgICB9IGVsc2UgaWYgKGJhc2VDbGFzc0NvbnN0cnVjdG9yUGFyYW1zICE9PSBudWxsIHx8IG5ld1BhcmVudENsYXNzID09PSBudWxsKSB7XG4gICAgICAvLyBUaGlzIGNsYXNzIGhhcyBhIHRyaXZpYWwgY29uc3RydWN0b3IsIG9yIG5vIGNvbnN0cnVjdG9yICsgaXMgdGhlXG4gICAgICAvLyB0b3Agb2YgdGhlIGluaGVyaXRhbmNlIGNoYWluLCBzbyBpdCdzIG9rYXkuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBHbyB1cCB0aGUgY2hhaW4gYW5kIGNvbnRpbnVlXG4gICAgYmFzZUNsYXNzID0gbmV3UGFyZW50Q2xhc3M7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0SW5oZXJpdGVkVW5kZWNvcmF0ZWRDdG9yRGlhZ25vc3RpYyhcbiAgICBub2RlOiBDbGFzc0RlY2xhcmF0aW9uLCBiYXNlQ2xhc3M6IFJlZmVyZW5jZSwgcmVhZGVyOiBNZXRhZGF0YVJlYWRlcikge1xuICBjb25zdCBzdWJjbGFzc01ldGEgPSByZWFkZXIuZ2V0RGlyZWN0aXZlTWV0YWRhdGEobmV3IFJlZmVyZW5jZShub2RlKSkhO1xuICBjb25zdCBkaXJPckNvbXAgPSBzdWJjbGFzc01ldGEuaXNDb21wb25lbnQgPyAnQ29tcG9uZW50JyA6ICdEaXJlY3RpdmUnO1xuICBjb25zdCBiYXNlQ2xhc3NOYW1lID0gYmFzZUNsYXNzLmRlYnVnTmFtZTtcblxuICByZXR1cm4gbWFrZURpYWdub3N0aWMoXG4gICAgICBFcnJvckNvZGUuRElSRUNUSVZFX0lOSEVSSVRTX1VOREVDT1JBVEVEX0NUT1IsIG5vZGUubmFtZSxcbiAgICAgIGBUaGUgJHtkaXJPckNvbXAudG9Mb3dlckNhc2UoKX0gJHtub2RlLm5hbWUudGV4dH0gaW5oZXJpdHMgaXRzIGNvbnN0cnVjdG9yIGZyb20gJHtcbiAgICAgICAgICBiYXNlQ2xhc3NOYW1lfSwgYCArXG4gICAgICAgICAgYGJ1dCB0aGUgbGF0dGVyIGRvZXMgbm90IGhhdmUgYW4gQW5ndWxhciBkZWNvcmF0b3Igb2YgaXRzIG93bi4gRGVwZW5kZW5jeSBpbmplY3Rpb24gd2lsbCBub3QgYmUgYWJsZSB0byBgICtcbiAgICAgICAgICBgcmVzb2x2ZSB0aGUgcGFyYW1ldGVycyBvZiAke1xuICAgICAgICAgICAgICBiYXNlQ2xhc3NOYW1lfSdzIGNvbnN0cnVjdG9yLiBFaXRoZXIgYWRkIGEgQERpcmVjdGl2ZSBkZWNvcmF0b3IgYCArXG4gICAgICAgICAgYHRvICR7YmFzZUNsYXNzTmFtZX0sIG9yIGFkZCBhbiBleHBsaWNpdCBjb25zdHJ1Y3RvciB0byAke25vZGUubmFtZS50ZXh0fS5gKTtcbn1cbiJdfQ==