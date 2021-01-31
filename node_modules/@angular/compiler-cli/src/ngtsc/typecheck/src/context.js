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
        define("@angular/compiler-cli/src/ngtsc/typecheck/src/context", ["require", "exports", "tslib", "@angular/compiler-cli/src/ngtsc/diagnostics", "typescript", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/translator", "@angular/compiler-cli/src/ngtsc/typecheck/diagnostics", "@angular/compiler-cli/src/ngtsc/typecheck/src/dom", "@angular/compiler-cli/src/ngtsc/typecheck/src/environment", "@angular/compiler-cli/src/ngtsc/typecheck/src/oob", "@angular/compiler-cli/src/ngtsc/typecheck/src/tcb_util", "@angular/compiler-cli/src/ngtsc/typecheck/src/type_check_block", "@angular/compiler-cli/src/ngtsc/typecheck/src/type_check_file", "@angular/compiler-cli/src/ngtsc/typecheck/src/type_constructor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeCheckContextImpl = exports.InliningMode = void 0;
    var tslib_1 = require("tslib");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var ts = require("typescript");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    var translator_1 = require("@angular/compiler-cli/src/ngtsc/translator");
    var diagnostics_2 = require("@angular/compiler-cli/src/ngtsc/typecheck/diagnostics");
    var dom_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/dom");
    var environment_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/environment");
    var oob_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/oob");
    var tcb_util_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/tcb_util");
    var type_check_block_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/type_check_block");
    var type_check_file_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/type_check_file");
    var type_constructor_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/type_constructor");
    /**
     * How a type-checking context should handle operations which would require inlining.
     */
    var InliningMode;
    (function (InliningMode) {
        /**
         * Use inlining operations when required.
         */
        InliningMode[InliningMode["InlineOps"] = 0] = "InlineOps";
        /**
         * Produce diagnostics if an operation would require inlining.
         */
        InliningMode[InliningMode["Error"] = 1] = "Error";
    })(InliningMode = exports.InliningMode || (exports.InliningMode = {}));
    /**
     * A template type checking context for a program.
     *
     * The `TypeCheckContext` allows registration of components and their templates which need to be
     * type checked.
     */
    var TypeCheckContextImpl = /** @class */ (function () {
        function TypeCheckContextImpl(config, compilerHost, componentMappingStrategy, refEmitter, reflector, host, inlining) {
            this.config = config;
            this.compilerHost = compilerHost;
            this.componentMappingStrategy = componentMappingStrategy;
            this.refEmitter = refEmitter;
            this.reflector = reflector;
            this.host = host;
            this.inlining = inlining;
            this.fileMap = new Map();
            /**
             * A `Map` of `ts.SourceFile`s that the context has seen to the operations (additions of methods
             * or type-check blocks) that need to be eventually performed on that file.
             */
            this.opMap = new Map();
            /**
             * Tracks when an a particular class has a pending type constructor patching operation already
             * queued.
             */
            this.typeCtorPending = new Set();
        }
        /**
         * Register a template to potentially be type-checked.
         *
         * Implements `TypeCheckContext.addTemplate`.
         */
        TypeCheckContextImpl.prototype.addTemplate = function (ref, binder, template, pipes, schemas, sourceMapping, file, parseErrors) {
            var e_1, _a;
            if (!this.host.shouldCheckComponent(ref.node)) {
                return;
            }
            var fileData = this.dataForFile(ref.node.getSourceFile());
            var shimData = this.pendingShimForComponent(ref.node);
            var templateId = fileData.sourceManager.getTemplateId(ref.node);
            var templateDiagnostics = [];
            var sfPath = file_system_1.absoluteFromSourceFile(ref.node.getSourceFile());
            var overrideTemplate = this.host.getTemplateOverride(sfPath, ref.node);
            if (overrideTemplate !== null) {
                template = overrideTemplate.nodes;
                parseErrors = overrideTemplate.errors;
            }
            if (parseErrors !== null) {
                templateDiagnostics.push.apply(templateDiagnostics, tslib_1.__spread(this.getTemplateDiagnostics(parseErrors, templateId, sourceMapping)));
            }
            // Accumulate a list of any directives which could not have type constructors generated due to
            // unsupported inlining operations.
            var missingInlines = [];
            var boundTarget = binder.bind({ template: template });
            try {
                // Get all of the directives used in the template and record type constructors for all of them.
                for (var _b = tslib_1.__values(boundTarget.getUsedDirectives()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var dir = _c.value;
                    var dirRef = dir.ref;
                    var dirNode = dirRef.node;
                    if (dir.isGeneric && type_constructor_1.requiresInlineTypeCtor(dirNode, this.reflector)) {
                        if (this.inlining === InliningMode.Error) {
                            missingInlines.push(dirNode);
                            continue;
                        }
                        // Add a type constructor operation for the directive.
                        this.addInlineTypeCtor(fileData, dirNode.getSourceFile(), dirRef, {
                            fnName: 'ngTypeCtor',
                            // The constructor should have a body if the directive comes from a .ts file, but not if
                            // it comes from a .d.ts file. .d.ts declarations don't have bodies.
                            body: !dirNode.getSourceFile().isDeclarationFile,
                            fields: {
                                inputs: dir.inputs.classPropertyNames,
                                outputs: dir.outputs.classPropertyNames,
                                // TODO(alxhub): support queries
                                queries: dir.queries,
                            },
                            coercedInputFields: dir.coercedInputFields,
                        });
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            shimData.templates.set(templateId, {
                template: template,
                boundTarget: boundTarget,
                templateDiagnostics: templateDiagnostics,
            });
            var tcbRequiresInline = tcb_util_1.requiresInlineTypeCheckBlock(ref.node, pipes);
            // If inlining is not supported, but is required for either the TCB or one of its directive
            // dependencies, then exit here with an error.
            if (this.inlining === InliningMode.Error && (tcbRequiresInline || missingInlines.length > 0)) {
                // This template cannot be supported because the underlying strategy does not support inlining
                // and inlining would be required.
                // Record diagnostics to indicate the issues with this template.
                if (tcbRequiresInline) {
                    shimData.oobRecorder.requiresInlineTcb(templateId, ref.node);
                }
                if (missingInlines.length > 0) {
                    shimData.oobRecorder.requiresInlineTypeConstructors(templateId, ref.node, missingInlines);
                }
                // Checking this template would be unsupported, so don't try.
                return;
            }
            var meta = {
                id: fileData.sourceManager.captureSource(ref.node, sourceMapping, file),
                boundTarget: boundTarget,
                pipes: pipes,
                schemas: schemas,
            };
            if (tcbRequiresInline) {
                // This class didn't meet the requirements for external type checking, so generate an inline
                // TCB for the class.
                this.addInlineTypeCheckBlock(fileData, shimData, ref, meta);
            }
            else {
                // The class can be type-checked externally as normal.
                shimData.file.addTypeCheckBlock(ref, meta, shimData.domSchemaChecker, shimData.oobRecorder);
            }
        };
        /**
         * Record a type constructor for the given `node` with the given `ctorMetadata`.
         */
        TypeCheckContextImpl.prototype.addInlineTypeCtor = function (fileData, sf, ref, ctorMeta) {
            if (this.typeCtorPending.has(ref.node)) {
                return;
            }
            this.typeCtorPending.add(ref.node);
            // Lazily construct the operation map.
            if (!this.opMap.has(sf)) {
                this.opMap.set(sf, []);
            }
            var ops = this.opMap.get(sf);
            // Push a `TypeCtorOp` into the operation queue for the source file.
            ops.push(new TypeCtorOp(ref, ctorMeta));
            fileData.hasInlines = true;
        };
        /**
         * Transform a `ts.SourceFile` into a version that includes type checking code.
         *
         * If this particular `ts.SourceFile` requires changes, the text representing its new contents
         * will be returned. Otherwise, a `null` return indicates no changes were necessary.
         */
        TypeCheckContextImpl.prototype.transform = function (sf) {
            var _this = this;
            // If there are no operations pending for this particular file, return `null` to indicate no
            // changes.
            if (!this.opMap.has(sf)) {
                return null;
            }
            // Imports may need to be added to the file to support type-checking of directives used in the
            // template within it.
            var importManager = new translator_1.ImportManager(new imports_1.NoopImportRewriter(), '_i');
            // Each Op has a splitPoint index into the text where it needs to be inserted. Split the
            // original source text into chunks at these split points, where code will be inserted between
            // the chunks.
            var ops = this.opMap.get(sf).sort(orderOps);
            var textParts = splitStringAtPoints(sf.text, ops.map(function (op) { return op.splitPoint; }));
            // Use a `ts.Printer` to generate source code.
            var printer = ts.createPrinter({ omitTrailingSemicolon: true });
            // Begin with the intial section of the code text.
            var code = textParts[0];
            // Process each operation and use the printer to generate source code for it, inserting it into
            // the source code in between the original chunks.
            ops.forEach(function (op, idx) {
                var text = op.execute(importManager, sf, _this.refEmitter, printer);
                code += '\n\n' + text + textParts[idx + 1];
            });
            // Write out the imports that need to be added to the beginning of the file.
            var imports = importManager.getAllImports(sf.fileName)
                .map(function (i) { return "import * as " + i.qualifier + " from '" + i.specifier + "';"; })
                .join('\n');
            code = imports + '\n' + code;
            return code;
        };
        TypeCheckContextImpl.prototype.finalize = function () {
            var e_2, _a, e_3, _b, e_4, _c;
            // First, build the map of updates to source files.
            var updates = new Map();
            try {
                for (var _d = tslib_1.__values(this.opMap.keys()), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var originalSf = _e.value;
                    var newText = this.transform(originalSf);
                    if (newText !== null) {
                        updates.set(file_system_1.absoluteFromSourceFile(originalSf), newText);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_2) throw e_2.error; }
            }
            try {
                // Then go through each input file that has pending code generation operations.
                for (var _f = tslib_1.__values(this.fileMap), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var _h = tslib_1.__read(_g.value, 2), sfPath = _h[0], pendingFileData = _h[1];
                    try {
                        // For each input file, consider generation operations for each of its shims.
                        for (var _j = (e_4 = void 0, tslib_1.__values(pendingFileData.shimData.values())), _k = _j.next(); !_k.done; _k = _j.next()) {
                            var pendingShimData = _k.value;
                            this.host.recordShimData(sfPath, {
                                genesisDiagnostics: tslib_1.__spread(pendingShimData.domSchemaChecker.diagnostics, pendingShimData.oobRecorder.diagnostics),
                                hasInlines: pendingFileData.hasInlines,
                                path: pendingShimData.file.fileName,
                                templates: pendingShimData.templates,
                            });
                            updates.set(pendingShimData.file.fileName, pendingShimData.file.render());
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return updates;
        };
        TypeCheckContextImpl.prototype.addInlineTypeCheckBlock = function (fileData, shimData, ref, tcbMeta) {
            var sf = ref.node.getSourceFile();
            if (!this.opMap.has(sf)) {
                this.opMap.set(sf, []);
            }
            var ops = this.opMap.get(sf);
            ops.push(new TcbOp(ref, tcbMeta, this.config, this.reflector, shimData.domSchemaChecker, shimData.oobRecorder));
            fileData.hasInlines = true;
        };
        TypeCheckContextImpl.prototype.pendingShimForComponent = function (node) {
            var fileData = this.dataForFile(node.getSourceFile());
            var shimPath = this.componentMappingStrategy.shimPathForComponent(node);
            if (!fileData.shimData.has(shimPath)) {
                fileData.shimData.set(shimPath, {
                    domSchemaChecker: new dom_1.RegistryDomSchemaChecker(fileData.sourceManager),
                    oobRecorder: new oob_1.OutOfBandDiagnosticRecorderImpl(fileData.sourceManager),
                    file: new type_check_file_1.TypeCheckFile(shimPath, this.config, this.refEmitter, this.reflector, this.compilerHost),
                    templates: new Map(),
                });
            }
            return fileData.shimData.get(shimPath);
        };
        TypeCheckContextImpl.prototype.dataForFile = function (sf) {
            var sfPath = file_system_1.absoluteFromSourceFile(sf);
            if (!this.fileMap.has(sfPath)) {
                var data = {
                    hasInlines: false,
                    sourceManager: this.host.getSourceManager(sfPath),
                    shimData: new Map(),
                };
                this.fileMap.set(sfPath, data);
            }
            return this.fileMap.get(sfPath);
        };
        TypeCheckContextImpl.prototype.getTemplateDiagnostics = function (parseErrors, templateId, sourceMapping) {
            return parseErrors.map(function (error) {
                var span = error.span;
                if (span.start.offset === span.end.offset) {
                    // Template errors can contain zero-length spans, if the error occurs at a single point.
                    // However, TypeScript does not handle displaying a zero-length diagnostic very well, so
                    // increase the ending offset by 1 for such errors, to ensure the position is shown in the
                    // diagnostic.
                    span.end.offset++;
                }
                return diagnostics_2.makeTemplateDiagnostic(templateId, sourceMapping, span, ts.DiagnosticCategory.Error, diagnostics_1.ngErrorCode(diagnostics_1.ErrorCode.TEMPLATE_PARSE_ERROR), error.msg);
            });
        };
        return TypeCheckContextImpl;
    }());
    exports.TypeCheckContextImpl = TypeCheckContextImpl;
    /**
     * A type check block operation which produces type check code for a particular component.
     */
    var TcbOp = /** @class */ (function () {
        function TcbOp(ref, meta, config, reflector, domSchemaChecker, oobRecorder) {
            this.ref = ref;
            this.meta = meta;
            this.config = config;
            this.reflector = reflector;
            this.domSchemaChecker = domSchemaChecker;
            this.oobRecorder = oobRecorder;
        }
        Object.defineProperty(TcbOp.prototype, "splitPoint", {
            /**
             * Type check blocks are inserted immediately after the end of the component class.
             */
            get: function () {
                return this.ref.node.end + 1;
            },
            enumerable: false,
            configurable: true
        });
        TcbOp.prototype.execute = function (im, sf, refEmitter, printer) {
            var env = new environment_1.Environment(this.config, im, refEmitter, this.reflector, sf);
            var fnName = ts.createIdentifier("_tcb_" + this.ref.node.pos);
            var fn = type_check_block_1.generateTypeCheckBlock(env, this.ref, fnName, this.meta, this.domSchemaChecker, this.oobRecorder);
            return printer.printNode(ts.EmitHint.Unspecified, fn, sf);
        };
        return TcbOp;
    }());
    /**
     * A type constructor operation which produces type constructor code for a particular directive.
     */
    var TypeCtorOp = /** @class */ (function () {
        function TypeCtorOp(ref, meta) {
            this.ref = ref;
            this.meta = meta;
        }
        Object.defineProperty(TypeCtorOp.prototype, "splitPoint", {
            /**
             * Type constructor operations are inserted immediately before the end of the directive class.
             */
            get: function () {
                return this.ref.node.end - 1;
            },
            enumerable: false,
            configurable: true
        });
        TypeCtorOp.prototype.execute = function (im, sf, refEmitter, printer) {
            var tcb = type_constructor_1.generateInlineTypeCtor(this.ref.node, this.meta);
            return printer.printNode(ts.EmitHint.Unspecified, tcb, sf);
        };
        return TypeCtorOp;
    }());
    /**
     * Compare two operations and return their split point ordering.
     */
    function orderOps(op1, op2) {
        return op1.splitPoint - op2.splitPoint;
    }
    /**
     * Split a string into chunks at any number of split points.
     */
    function splitStringAtPoints(str, points) {
        var splits = [];
        var start = 0;
        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            splits.push(str.substring(start, point));
            start = point;
        }
        splits.push(str.substring(start));
        return splits;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvdHlwZWNoZWNrL3NyYy9jb250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7SUFHSCwyRUFBbUY7SUFDbkYsK0JBQWlDO0lBRWpDLDJFQUF5RTtJQUN6RSxtRUFBOEU7SUFFOUUseUVBQStDO0lBRS9DLHFGQUEwRTtJQUUxRSx5RUFBaUU7SUFDakUseUZBQTBDO0lBQzFDLHlFQUFtRjtJQUVuRixtRkFBd0Q7SUFDeEQsbUdBQTBEO0lBQzFELGlHQUFnRDtJQUNoRCxtR0FBa0Y7SUF5SWxGOztPQUVHO0lBQ0gsSUFBWSxZQVVYO0lBVkQsV0FBWSxZQUFZO1FBQ3RCOztXQUVHO1FBQ0gseURBQVMsQ0FBQTtRQUVUOztXQUVHO1FBQ0gsaURBQUssQ0FBQTtJQUNQLENBQUMsRUFWVyxZQUFZLEdBQVosb0JBQVksS0FBWixvQkFBWSxRQVV2QjtJQUVEOzs7OztPQUtHO0lBQ0g7UUFHRSw4QkFDWSxNQUEwQixFQUMxQixZQUEyRCxFQUMzRCx3QkFBd0QsRUFDeEQsVUFBNEIsRUFBVSxTQUF5QixFQUMvRCxJQUFzQixFQUFVLFFBQXNCO1lBSnRELFdBQU0sR0FBTixNQUFNLENBQW9CO1lBQzFCLGlCQUFZLEdBQVosWUFBWSxDQUErQztZQUMzRCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQWdDO1lBQ3hELGVBQVUsR0FBVixVQUFVLENBQWtCO1lBQVUsY0FBUyxHQUFULFNBQVMsQ0FBZ0I7WUFDL0QsU0FBSSxHQUFKLElBQUksQ0FBa0I7WUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFjO1lBUDFELFlBQU8sR0FBRyxJQUFJLEdBQUcsRUFBK0MsQ0FBQztZQVN6RTs7O2VBR0c7WUFDSyxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFF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NEIsRUFBRSxPQUFtQjtZQUU3RixJQUFNLEdBQUcsR0FBRyx5Q0FBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0QsT0FBTyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBQ0gsaUJBQUM7SUFBRCxDQUFDLEFBakJELElBaUJDO0lBRUQ7O09BRUc7SUFDSCxTQUFTLFFBQVEsQ0FBQyxHQUFPLEVBQUUsR0FBTztRQUNoQyxPQUFPLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQztJQUN6QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxNQUFnQjtRQUN4RCxJQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFDNUIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdEMsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN6QyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQ2Y7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNsQyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm91bmRUYXJnZXQsIFBhcnNlRXJyb3IsIFBhcnNlU291cmNlRmlsZSwgUjNUYXJnZXRCaW5kZXIsIFNjaGVtYU1ldGFkYXRhLCBUZW1wbGF0ZVBhcnNlRXJyb3IsIFRtcGxBc3ROb2RlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0Vycm9yQ29kZSwgbmdFcnJvckNvZGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvZGlhZ25vc3RpY3MnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7YWJzb2x1dGVGcm9tU291cmNlRmlsZSwgQWJzb2x1dGVGc1BhdGh9IGZyb20gJy4uLy4uL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7Tm9vcEltcG9ydFJld3JpdGVyLCBSZWZlcmVuY2UsIFJlZmVyZW5jZUVtaXR0ZXJ9IGZyb20gJy4uLy4uL2ltcG9ydHMnO1xuaW1wb3J0IHtDbGFzc0RlY2xhcmF0aW9uLCBSZWZsZWN0aW9uSG9zdH0gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbic7XG5pbXBvcnQge0ltcG9ydE1hbmFnZXJ9IGZyb20gJy4uLy4uL3RyYW5zbGF0b3InO1xuaW1wb3J0IHtDb21wb25lbnRUb1NoaW1NYXBwaW5nU3RyYXRlZ3ksIFRlbXBsYXRlSWQsIFRlbXBsYXRlU291cmNlTWFwcGluZywgVHlwZUNoZWNrYWJsZURpcmVjdGl2ZU1ldGEsIFR5cGVDaGVja0Jsb2NrTWV0YWRhdGEsIFR5cGVDaGVja0NvbnRleHQsIFR5cGVDaGVja2luZ0NvbmZpZywgVHlwZUN0b3JNZXRhZGF0YX0gZnJvbSAnLi4vYXBpJztcbmltcG9ydCB7bWFrZVRlbXBsYXRlRGlhZ25vc3RpYywgVGVtcGxhdGVEaWFnbm9zdGljfSBmcm9tICcuLi9kaWFnbm9zdGljcyc7XG5cbmltcG9ydCB7RG9tU2NoZW1hQ2hlY2tlciwgUmVnaXN0cnlEb21TY2hlbWFDaGVja2VyfSBmcm9tICcuL2RvbSc7XG5pbXBvcnQge0Vudmlyb25tZW50fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7T3V0T2ZCYW5kRGlhZ25vc3RpY1JlY29yZGVyLCBPdXRPZkJhbmREaWFnbm9zdGljUmVjb3JkZXJJbXBsfSBmcm9tICcuL29vYic7XG5pbXBvcnQge1RlbXBsYXRlU291cmNlTWFuYWdlcn0gZnJvbSAnLi9zb3VyY2UnO1xuaW1wb3J0IHtyZXF1aXJlc0lubGluZVR5cGVDaGVja0Jsb2NrfSBmcm9tICcuL3RjYl91dGlsJztcbmltcG9ydCB7Z2VuZXJhdGVUeXBlQ2hlY2tCbG9ja30gZnJvbSAnLi90eXBlX2NoZWNrX2Jsb2NrJztcbmltcG9ydCB7VHlwZUNoZWNrRmlsZX0gZnJvbSAnLi90eXBlX2NoZWNrX2ZpbGUnO1xuaW1wb3J0IHtnZW5lcmF0ZUlubGluZVR5cGVDdG9yLCByZXF1aXJlc0lubGluZVR5cGVDdG9yfSBmcm9tICcuL3R5cGVfY29uc3RydWN0b3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNoaW1UeXBlQ2hlY2tpbmdEYXRhIHtcbiAgLyoqXG4gICAqIFBhdGggdG8gdGhlIHNoaW0gZmlsZS5cbiAgICovXG4gIHBhdGg6IEFic29sdXRlRnNQYXRoO1xuXG4gIC8qKlxuICAgKiBBbnkgYHRzLkRpYWdub3N0aWNgcyB3aGljaCB3ZXJlIHByb2R1Y2VkIGR1cmluZyB0aGUgZ2VuZXJhdGlvbiBvZiB0aGlzIHNoaW0uXG4gICAqXG4gICAqIFNvbWUgZGlhZ25vc3RpY3MgYXJlIHByb2R1Y2VkIGR1cmluZyBjcmVhdGlvbiB0aW1lIGFuZCBhcmUgdHJhY2tlZCBoZXJlLlxuICAgKi9cbiAgZ2VuZXNpc0RpYWdub3N0aWNzOiBUZW1wbGF0ZURpYWdub3N0aWNbXTtcblxuICAvKipcbiAgICogV2hldGhlciBhbnkgaW5saW5lIG9wZXJhdGlvbnMgZm9yIHRoZSBpbnB1dCBmaWxlIHdlcmUgcmVxdWlyZWQgdG8gZ2VuZXJhdGUgdGhpcyBzaGltLlxuICAgKi9cbiAgaGFzSW5saW5lczogYm9vbGVhbjtcblxuICAvKipcbiAgICogTWFwIG9mIGBUZW1wbGF0ZUlkYCB0byBpbmZvcm1hdGlvbiBjb2xsZWN0ZWQgYWJvdXQgdGhlIHRlbXBsYXRlIGR1cmluZyB0aGUgdGVtcGxhdGVcbiAgICogdHlwZS1jaGVja2luZyBwcm9jZXNzLlxuICAgKi9cbiAgdGVtcGxhdGVzOiBNYXA8VGVtcGxhdGVJZCwgVGVtcGxhdGVEYXRhPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZW1wbGF0ZU92ZXJyaWRlIHtcbiAgbm9kZXM6IFRtcGxBc3ROb2RlW107XG4gIGVycm9yczogUGFyc2VFcnJvcltdfG51bGw7XG59XG5cbi8qKlxuICogRGF0YSB0cmFja2VkIGZvciBlYWNoIHRlbXBsYXRlIHByb2Nlc3NlZCBieSB0aGUgdGVtcGxhdGUgdHlwZS1jaGVja2luZyBzeXN0ZW0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVEYXRhIHtcbiAgLyoqXG4gICAqIFRlbXBsYXRlIG5vZGVzIGZvciB3aGljaCB0aGUgVENCIHdhcyBnZW5lcmF0ZWQuXG4gICAqL1xuICB0ZW1wbGF0ZTogVG1wbEFzdE5vZGVbXTtcblxuICAvKipcbiAgICogYEJvdW5kVGFyZ2V0YCB3aGljaCB3YXMgdXNlZCB0byBnZW5lcmF0ZSB0aGUgVENCLCBhbmQgY29udGFpbnMgYmluZGluZ3MgZm9yIHRoZSBhc3NvY2lhdGVkXG4gICAqIHRlbXBsYXRlIG5vZGVzLlxuICAgKi9cbiAgYm91bmRUYXJnZXQ6IEJvdW5kVGFyZ2V0PFR5cGVDaGVja2FibGVEaXJlY3RpdmVNZXRhPjtcblxuICAvKipcbiAgICogRXJyb3JzIGZvdW5kIHdoaWxlIHBhcnNpbmcgdGhlbSB0ZW1wbGF0ZSwgd2hpY2ggaGF2ZSBiZWVuIGNvbnZlcnRlZCB0byBkaWFnbm9zdGljcy5cbiAgICovXG4gIHRlbXBsYXRlRGlhZ25vc3RpY3M6IFRlbXBsYXRlRGlhZ25vc3RpY1tdO1xufVxuXG4vKipcbiAqIERhdGEgZm9yIGFuIGlucHV0IGZpbGUgd2hpY2ggaXMgc3RpbGwgaW4gdGhlIHByb2Nlc3Mgb2YgdGVtcGxhdGUgdHlwZS1jaGVja2luZyBjb2RlIGdlbmVyYXRpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGVuZGluZ0ZpbGVUeXBlQ2hlY2tpbmdEYXRhIHtcbiAgLyoqXG4gICAqIFdoZXRoZXIgYW55IGlubGluZSBjb2RlIGhhcyBiZWVuIHJlcXVpcmVkIGJ5IHRoZSBzaGltIHlldC5cbiAgICovXG4gIGhhc0lubGluZXM6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFNvdXJjZSBtYXBwaW5nIGluZm9ybWF0aW9uIGZvciBtYXBwaW5nIGRpYWdub3N0aWNzIGZyb20gaW5saW5lZCB0eXBlIGNoZWNrIGJsb2NrcyBiYWNrIHRvIHRoZVxuICAgKiBvcmlnaW5hbCB0ZW1wbGF0ZS5cbiAgICovXG4gIHNvdXJjZU1hbmFnZXI6IFRlbXBsYXRlU291cmNlTWFuYWdlcjtcblxuICAvKipcbiAgICogTWFwIG9mIGluLXByb2dyZXNzIHNoaW0gZGF0YSBmb3Igc2hpbXMgZ2VuZXJhdGVkIGZyb20gdGhpcyBpbnB1dCBmaWxlLlxuICAgKi9cbiAgc2hpbURhdGE6IE1hcDxBYnNvbHV0ZUZzUGF0aCwgUGVuZGluZ1NoaW1EYXRhPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQZW5kaW5nU2hpbURhdGEge1xuICAvKipcbiAgICogUmVjb3JkZXIgZm9yIG91dC1vZi1iYW5kIGRpYWdub3N0aWNzIHdoaWNoIGFyZSByYWlzZWQgZHVyaW5nIGdlbmVyYXRpb24uXG4gICAqL1xuICBvb2JSZWNvcmRlcjogT3V0T2ZCYW5kRGlhZ25vc3RpY1JlY29yZGVyO1xuXG4gIC8qKlxuICAgKiBUaGUgYERvbVNjaGVtYUNoZWNrZXJgIGluIHVzZSBmb3IgdGhpcyB0ZW1wbGF0ZSwgd2hpY2ggcmVjb3JkcyBhbnkgc2NoZW1hLXJlbGF0ZWQgZGlhZ25vc3RpY3MuXG4gICAqL1xuICBkb21TY2hlbWFDaGVja2VyOiBEb21TY2hlbWFDaGVja2VyO1xuXG4gIC8qKlxuICAgKiBTaGltIGZpbGUgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgZ2VuZXJhdGVkLlxuICAgKi9cbiAgZmlsZTogVHlwZUNoZWNrRmlsZTtcblxuXG4gIC8qKlxuICAgKiBNYXAgb2YgYFRlbXBsYXRlSWRgIHRvIGluZm9ybWF0aW9uIGNvbGxlY3RlZCBhYm91dCB0aGUgdGVtcGxhdGUgYXMgaXQncyBpbmdlc3RlZC5cbiAgICovXG4gIHRlbXBsYXRlczogTWFwPFRlbXBsYXRlSWQsIFRlbXBsYXRlRGF0YT47XG59XG5cbi8qKlxuICogQWRhcHRzIHRoZSBgVHlwZUNoZWNrQ29udGV4dEltcGxgIHRvIHRoZSBsYXJnZXIgdGVtcGxhdGUgdHlwZS1jaGVja2luZyBzeXN0ZW0uXG4gKlxuICogVGhyb3VnaCB0aGlzIGludGVyZmFjZSwgYSBzaW5nbGUgYFR5cGVDaGVja0NvbnRleHRJbXBsYCAod2hpY2ggcmVwcmVzZW50cyBvbmUgXCJwYXNzXCIgb2YgdGVtcGxhdGVcbiAqIHR5cGUtY2hlY2tpbmcpIHJlcXVlc3RzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBsYXJnZXIgc3RhdGUgb2YgdHlwZS1jaGVja2luZywgYXMgd2VsbCBhcyByZXBvcnRzXG4gKiBiYWNrIGl0cyByZXN1bHRzIG9uY2UgZmluYWxpemVkLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFR5cGVDaGVja2luZ0hvc3Qge1xuICAvKipcbiAgICogUmV0cmlldmUgdGhlIGBUZW1wbGF0ZVNvdXJjZU1hbmFnZXJgIHJlc3BvbnNpYmxlIGZvciBjb21wb25lbnRzIGluIHRoZSBnaXZlbiBpbnB1dCBmaWxlIHBhdGguXG4gICAqL1xuICBnZXRTb3VyY2VNYW5hZ2VyKHNmUGF0aDogQWJzb2x1dGVGc1BhdGgpOiBUZW1wbGF0ZVNvdXJjZU1hbmFnZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYSBwYXJ0aWN1bGFyIGNvbXBvbmVudCBjbGFzcyBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIGN1cnJlbnQgdHlwZS1jaGVja2luZyBwYXNzLlxuICAgKlxuICAgKiBOb3QgYWxsIGNvbXBvbmVudHMgb2ZmZXJlZCB0byB0aGUgYFR5cGVDaGVja0NvbnRleHRgIGZvciBjaGVja2luZyBtYXkgcmVxdWlyZSBwcm9jZXNzaW5nLiBGb3JcbiAgICogZXhhbXBsZSwgdGhlIGNvbXBvbmVudCBtYXkgaGF2ZSByZXN1bHRzIGFscmVhZHkgYXZhaWxhYmxlIGZyb20gYSBwcmlvciBwYXNzIG9yIGZyb20gYSBwcmV2aW91c1xuICAgKiBwcm9ncmFtLlxuICAgKi9cbiAgc2hvdWxkQ2hlY2tDb21wb25lbnQobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSBnaXZlbiBjb21wb25lbnQgaGFzIGhhZCBpdHMgdGVtcGxhdGUgb3ZlcnJpZGRlbiwgYW5kIHJldHJpZXZlIHRoZSBuZXcgdGVtcGxhdGVcbiAgICogbm9kZXMgaWYgc28uXG4gICAqL1xuICBnZXRUZW1wbGF0ZU92ZXJyaWRlKHNmUGF0aDogQWJzb2x1dGVGc1BhdGgsIG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBUZW1wbGF0ZU92ZXJyaWRlfG51bGw7XG5cbiAgLyoqXG4gICAqIFJlcG9ydCBkYXRhIGZyb20gYSBzaGltIGdlbmVyYXRlZCBmcm9tIHRoZSBnaXZlbiBpbnB1dCBmaWxlIHBhdGguXG4gICAqL1xuICByZWNvcmRTaGltRGF0YShzZlBhdGg6IEFic29sdXRlRnNQYXRoLCBkYXRhOiBTaGltVHlwZUNoZWNraW5nRGF0YSk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJlY29yZCB0aGF0IGFsbCBvZiB0aGUgY29tcG9uZW50cyB3aXRoaW4gdGhlIGdpdmVuIGlucHV0IGZpbGUgcGF0aCBoYWQgY29kZSBnZW5lcmF0ZWQgLSB0aGF0XG4gICAqIGlzLCBjb3ZlcmFnZSBmb3IgdGhlIGZpbGUgY2FuIGJlIGNvbnNpZGVyZWQgY29tcGxldGUuXG4gICAqL1xuICByZWNvcmRDb21wbGV0ZShzZlBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZDtcbn1cblxuLyoqXG4gKiBIb3cgYSB0eXBlLWNoZWNraW5nIGNvbnRleHQgc2hvdWxkIGhhbmRsZSBvcGVyYXRpb25zIHdoaWNoIHdvdWxkIHJlcXVpcmUgaW5saW5pbmcuXG4gKi9cbmV4cG9ydCBlbnVtIElubGluaW5nTW9kZSB7XG4gIC8qKlxuICAgKiBVc2UgaW5saW5pbmcgb3BlcmF0aW9ucyB3aGVuIHJlcXVpcmVkLlxuICAgKi9cbiAgSW5saW5lT3BzLFxuXG4gIC8qKlxuICAgKiBQcm9kdWNlIGRpYWdub3N0aWNzIGlmIGFuIG9wZXJhdGlvbiB3b3VsZCByZXF1aXJlIGlubGluaW5nLlxuICAgKi9cbiAgRXJyb3IsXG59XG5cbi8qKlxuICogQSB0ZW1wbGF0ZSB0eXBlIGNoZWNraW5nIGNvbnRleHQgZm9yIGEgcHJvZ3JhbS5cbiAqXG4gKiBUaGUgYFR5cGVDaGVja0NvbnRleHRgIGFsbG93cyByZWdpc3RyYXRpb24gb2YgY29tcG9uZW50cyBhbmQgdGhlaXIgdGVtcGxhdGVzIHdoaWNoIG5lZWQgdG8gYmVcbiAqIHR5cGUgY2hlY2tlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFR5cGVDaGVja0NvbnRleHRJbXBsIGltcGxlbWVudHMgVHlwZUNoZWNrQ29udGV4dCB7XG4gIHByaXZhdGUgZmlsZU1hcCA9IG5ldyBNYXA8QWJzb2x1dGVGc1BhdGgsIFBlbmRpbmdGaWxlVHlwZUNoZWNraW5nRGF0YT4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgY29uZmlnOiBUeXBlQ2hlY2tpbmdDb25maWcsXG4gICAgICBwcml2YXRlIGNvbXBpbGVySG9zdDogUGljazx0cy5Db21waWxlckhvc3QsICdnZXRDYW5vbmljYWxGaWxlTmFtZSc+LFxuICAgICAgcHJpdmF0ZSBjb21wb25lbnRNYXBwaW5nU3RyYXRlZ3k6IENvbXBvbmVudFRvU2hpbU1hcHBpbmdTdHJhdGVneSxcbiAgICAgIHByaXZhdGUgcmVmRW1pdHRlcjogUmVmZXJlbmNlRW1pdHRlciwgcHJpdmF0ZSByZWZsZWN0b3I6IFJlZmxlY3Rpb25Ib3N0LFxuICAgICAgcHJpdmF0ZSBob3N0OiBUeXBlQ2hlY2tpbmdIb3N0LCBwcml2YXRlIGlubGluaW5nOiBJbmxpbmluZ01vZGUpIHt9XG5cbiAgLyoqXG4gICAqIEEgYE1hcGAgb2YgYHRzLlNvdXJjZUZpbGVgcyB0aGF0IHRoZSBjb250ZXh0IGhhcyBzZWVuIHRvIHRoZSBvcGVyYXRpb25zIChhZGRpdGlvbnMgb2YgbWV0aG9kc1xuICAgKiBvciB0eXBlLWNoZWNrIGJsb2NrcykgdGhhdCBuZWVkIHRvIGJlIGV2ZW50dWFsbHkgcGVyZm9ybWVkIG9uIHRoYXQgZmlsZS5cbiAgICovXG4gIHByaXZhdGUgb3BNYXAgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIE9wW10+KCk7XG5cbiAgLyoqXG4gICAqIFRyYWNrcyB3aGVuIGFuIGEgcGFydGljdWxhciBjbGFzcyBoYXMgYSBwZW5kaW5nIHR5cGUgY29uc3RydWN0b3IgcGF0Y2hpbmcgb3BlcmF0aW9uIGFscmVhZHlcbiAgICogcXVldWVkLlxuICAgKi9cbiAgcHJpdmF0ZSB0eXBlQ3RvclBlbmRpbmcgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgdGVtcGxhdGUgdG8gcG90ZW50aWFsbHkgYmUgdHlwZS1jaGVja2VkLlxuICAgKlxuICAgKiBJbXBsZW1lbnRzIGBUeXBlQ2hlY2tDb250ZXh0LmFkZFRlbXBsYXRlYC5cbiAgICovXG4gIGFkZFRlbXBsYXRlKFxuICAgICAgcmVmOiBSZWZlcmVuY2U8Q2xhc3NEZWNsYXJhdGlvbjx0cy5DbGFzc0RlY2xhcmF0aW9uPj4sXG4gICAgICBiaW5kZXI6IFIzVGFyZ2V0QmluZGVyPFR5cGVDaGVja2FibGVEaXJlY3RpdmVNZXRhPiwgdGVtcGxhdGU6IFRtcGxBc3ROb2RlW10sXG4gICAgICBwaXBlczogTWFwPHN0cmluZywgUmVmZXJlbmNlPENsYXNzRGVjbGFyYXRpb248dHMuQ2xhc3NEZWNsYXJhdGlvbj4+PixcbiAgICAgIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW10sIHNvdXJjZU1hcHBpbmc6IFRlbXBsYXRlU291cmNlTWFwcGluZywgZmlsZTogUGFyc2VTb3VyY2VGaWxlLFxuICAgICAgcGFyc2VFcnJvcnM6IFBhcnNlRXJyb3JbXXxudWxsKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmhvc3Quc2hvdWxkQ2hlY2tDb21wb25lbnQocmVmLm5vZGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZURhdGEgPSB0aGlzLmRhdGFGb3JGaWxlKHJlZi5ub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgY29uc3Qgc2hpbURhdGEgPSB0aGlzLnBlbmRpbmdTaGltRm9yQ29tcG9uZW50KHJlZi5ub2RlKTtcbiAgICBjb25zdCB0ZW1wbGF0ZUlkID0gZmlsZURhdGEuc291cmNlTWFuYWdlci5nZXRUZW1wbGF0ZUlkKHJlZi5ub2RlKTtcblxuICAgIGNvbnN0IHRlbXBsYXRlRGlhZ25vc3RpY3M6IFRlbXBsYXRlRGlhZ25vc3RpY1tdID0gW107XG5cbiAgICBjb25zdCBzZlBhdGggPSBhYnNvbHV0ZUZyb21Tb3VyY2VGaWxlKHJlZi5ub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgY29uc3Qgb3ZlcnJpZGVUZW1wbGF0ZSA9IHRoaXMuaG9zdC5nZXRUZW1wbGF0ZU92ZXJyaWRlKHNmUGF0aCwgcmVmLm5vZGUpO1xuICAgIGlmIChvdmVycmlkZVRlbXBsYXRlICE9PSBudWxsKSB7XG4gICAgICB0ZW1wbGF0ZSA9IG92ZXJyaWRlVGVtcGxhdGUubm9kZXM7XG4gICAgICBwYXJzZUVycm9ycyA9IG92ZXJyaWRlVGVtcGxhdGUuZXJyb3JzO1xuICAgIH1cblxuICAgIGlmIChwYXJzZUVycm9ycyAhPT0gbnVsbCkge1xuICAgICAgdGVtcGxhdGVEaWFnbm9zdGljcy5wdXNoKFxuICAgICAgICAgIC4uLnRoaXMuZ2V0VGVtcGxhdGVEaWFnbm9zdGljcyhwYXJzZUVycm9ycywgdGVtcGxhdGVJZCwgc291cmNlTWFwcGluZykpO1xuICAgIH1cblxuICAgIC8vIEFjY3VtdWxhdGUgYSBsaXN0IG9mIGFueSBkaXJlY3RpdmVzIHdoaWNoIGNvdWxkIG5vdCBoYXZlIHR5cGUgY29uc3RydWN0b3JzIGdlbmVyYXRlZCBkdWUgdG9cbiAgICAvLyB1bnN1cHBvcnRlZCBpbmxpbmluZyBvcGVyYXRpb25zLlxuICAgIGxldCBtaXNzaW5nSW5saW5lczogQ2xhc3NEZWNsYXJhdGlvbltdID0gW107XG5cbiAgICBjb25zdCBib3VuZFRhcmdldCA9IGJpbmRlci5iaW5kKHt0ZW1wbGF0ZX0pO1xuXG4gICAgLy8gR2V0IGFsbCBvZiB0aGUgZGlyZWN0aXZlcyB1c2VkIGluIHRoZSB0ZW1wbGF0ZSBhbmQgcmVjb3JkIHR5cGUgY29uc3RydWN0b3JzIGZvciBhbGwgb2YgdGhlbS5cbiAgICBmb3IgKGNvbnN0IGRpciBvZiBib3VuZFRhcmdldC5nZXRVc2VkRGlyZWN0aXZlcygpKSB7XG4gICAgICBjb25zdCBkaXJSZWYgPSBkaXIucmVmIGFzIFJlZmVyZW5jZTxDbGFzc0RlY2xhcmF0aW9uPHRzLkNsYXNzRGVjbGFyYXRpb24+PjtcbiAgICAgIGNvbnN0IGRpck5vZGUgPSBkaXJSZWYubm9kZTtcblxuICAgICAgaWYgKGRpci5pc0dlbmVyaWMgJiYgcmVxdWlyZXNJbmxpbmVUeXBlQ3RvcihkaXJOb2RlLCB0aGlzLnJlZmxlY3RvcikpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5saW5pbmcgPT09IElubGluaW5nTW9kZS5FcnJvcikge1xuICAgICAgICAgIG1pc3NpbmdJbmxpbmVzLnB1c2goZGlyTm9kZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQWRkIGEgdHlwZSBjb25zdHJ1Y3RvciBvcGVyYXRpb24gZm9yIHRoZSBkaXJlY3RpdmUuXG4gICAgICAgIHRoaXMuYWRkSW5saW5lVHlwZUN0b3IoZmlsZURhdGEsIGRpck5vZGUuZ2V0U291cmNlRmlsZSgpLCBkaXJSZWYsIHtcbiAgICAgICAgICBmbk5hbWU6ICduZ1R5cGVDdG9yJyxcbiAgICAgICAgICAvLyBUaGUgY29uc3RydWN0b3Igc2hvdWxkIGhhdmUgYSBib2R5IGlmIHRoZSBkaXJlY3RpdmUgY29tZXMgZnJvbSBhIC50cyBmaWxlLCBidXQgbm90IGlmXG4gICAgICAgICAgLy8gaXQgY29tZXMgZnJvbSBhIC5kLnRzIGZpbGUuIC5kLnRzIGRlY2xhcmF0aW9ucyBkb24ndCBoYXZlIGJvZGllcy5cbiAgICAgICAgICBib2R5OiAhZGlyTm9kZS5nZXRTb3VyY2VGaWxlKCkuaXNEZWNsYXJhdGlvbkZpbGUsXG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBpbnB1dHM6IGRpci5pbnB1dHMuY2xhc3NQcm9wZXJ0eU5hbWVzLFxuICAgICAgICAgICAgb3V0cHV0czogZGlyLm91dHB1dHMuY2xhc3NQcm9wZXJ0eU5hbWVzLFxuICAgICAgICAgICAgLy8gVE9ETyhhbHhodWIpOiBzdXBwb3J0IHF1ZXJpZXNcbiAgICAgICAgICAgIHF1ZXJpZXM6IGRpci5xdWVyaWVzLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29lcmNlZElucHV0RmllbGRzOiBkaXIuY29lcmNlZElucHV0RmllbGRzLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzaGltRGF0YS50ZW1wbGF0ZXMuc2V0KHRlbXBsYXRlSWQsIHtcbiAgICAgIHRlbXBsYXRlLFxuICAgICAgYm91bmRUYXJnZXQsXG4gICAgICB0ZW1wbGF0ZURpYWdub3N0aWNzLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGNiUmVxdWlyZXNJbmxpbmUgPSByZXF1aXJlc0lubGluZVR5cGVDaGVja0Jsb2NrKHJlZi5ub2RlLCBwaXBlcyk7XG5cbiAgICAvLyBJZiBpbmxpbmluZyBpcyBub3Qgc3VwcG9ydGVkLCBidXQgaXMgcmVxdWlyZWQgZm9yIGVpdGhlciB0aGUgVENCIG9yIG9uZSBvZiBpdHMgZGlyZWN0aXZlXG4gICAgLy8gZGVwZW5kZW5jaWVzLCB0aGVuIGV4aXQgaGVyZSB3aXRoIGFuIGVycm9yLlxuICAgIGlmICh0aGlzLmlubGluaW5nID09PSBJbmxpbmluZ01vZGUuRXJyb3IgJiYgKHRjYlJlcXVpcmVzSW5saW5lIHx8IG1pc3NpbmdJbmxpbmVzLmxlbmd0aCA+IDApKSB7XG4gICAgICAvLyBUaGlzIHRlbXBsYXRlIGNhbm5vdCBiZSBzdXBwb3J0ZWQgYmVjYXVzZSB0aGUgdW5kZXJseWluZyBzdHJhdGVneSBkb2VzIG5vdCBzdXBwb3J0IGlubGluaW5nXG4gICAgICAvLyBhbmQgaW5saW5pbmcgd291bGQgYmUgcmVxdWlyZWQuXG5cbiAgICAgIC8vIFJlY29yZCBkaWFnbm9zdGljcyB0byBpbmRpY2F0ZSB0aGUgaXNzdWVzIHdpdGggdGhpcyB0ZW1wbGF0ZS5cbiAgICAgIGlmICh0Y2JSZXF1aXJlc0lubGluZSkge1xuICAgICAgICBzaGltRGF0YS5vb2JSZWNvcmRlci5yZXF1aXJlc0lubGluZVRjYih0ZW1wbGF0ZUlkLCByZWYubm9kZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChtaXNzaW5nSW5saW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNoaW1EYXRhLm9vYlJlY29yZGVyLnJlcXVpcmVzSW5saW5lVHlwZUNvbnN0cnVjdG9ycyh0ZW1wbGF0ZUlkLCByZWYubm9kZSwgbWlzc2luZ0lubGluZXMpO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVja2luZyB0aGlzIHRlbXBsYXRlIHdvdWxkIGJlIHVuc3VwcG9ydGVkLCBzbyBkb24ndCB0cnkuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbWV0YSA9IHtcbiAgICAgIGlkOiBmaWxlRGF0YS5zb3VyY2VNYW5hZ2VyLmNhcHR1cmVTb3VyY2UocmVmLm5vZGUsIHNvdXJjZU1hcHBpbmcsIGZpbGUpLFxuICAgICAgYm91bmRUYXJnZXQsXG4gICAgICBwaXBlcyxcbiAgICAgIHNjaGVtYXMsXG4gICAgfTtcbiAgICBpZiAodGNiUmVxdWlyZXNJbmxpbmUpIHtcbiAgICAgIC8vIFRoaXMgY2xhc3MgZGlkbid0IG1lZXQgdGhlIHJlcXVpcmVtZW50cyBmb3IgZXh0ZXJuYWwgdHlwZSBjaGVja2luZywgc28gZ2VuZXJhdGUgYW4gaW5saW5lXG4gICAgICAvLyBUQ0IgZm9yIHRoZSBjbGFzcy5cbiAgICAgIHRoaXMuYWRkSW5saW5lVHlwZUNoZWNrQmxvY2soZmlsZURhdGEsIHNoaW1EYXRhLCByZWYsIG1ldGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUaGUgY2xhc3MgY2FuIGJlIHR5cGUtY2hlY2tlZCBleHRlcm5hbGx5IGFzIG5vcm1hbC5cbiAgICAgIHNoaW1EYXRhLmZpbGUuYWRkVHlwZUNoZWNrQmxvY2socmVmLCBtZXRhLCBzaGltRGF0YS5kb21TY2hlbWFDaGVja2VyLCBzaGltRGF0YS5vb2JSZWNvcmRlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZCBhIHR5cGUgY29uc3RydWN0b3IgZm9yIHRoZSBnaXZlbiBgbm9kZWAgd2l0aCB0aGUgZ2l2ZW4gYGN0b3JNZXRhZGF0YWAuXG4gICAqL1xuICBhZGRJbmxpbmVUeXBlQ3RvcihcbiAgICAgIGZpbGVEYXRhOiBQZW5kaW5nRmlsZVR5cGVDaGVja2luZ0RhdGEsIHNmOiB0cy5Tb3VyY2VGaWxlLFxuICAgICAgcmVmOiBSZWZlcmVuY2U8Q2xhc3NEZWNsYXJhdGlvbjx0cy5DbGFzc0RlY2xhcmF0aW9uPj4sIGN0b3JNZXRhOiBUeXBlQ3Rvck1ldGFkYXRhKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudHlwZUN0b3JQZW5kaW5nLmhhcyhyZWYubm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy50eXBlQ3RvclBlbmRpbmcuYWRkKHJlZi5ub2RlKTtcblxuICAgIC8vIExhemlseSBjb25zdHJ1Y3QgdGhlIG9wZXJhdGlvbiBtYXAuXG4gICAgaWYgKCF0aGlzLm9wTWFwLmhhcyhzZikpIHtcbiAgICAgIHRoaXMub3BNYXAuc2V0KHNmLCBbXSk7XG4gICAgfVxuICAgIGNvbnN0IG9wcyA9IHRoaXMub3BNYXAuZ2V0KHNmKSE7XG5cbiAgICAvLyBQdXNoIGEgYFR5cGVDdG9yT3BgIGludG8gdGhlIG9wZXJhdGlvbiBxdWV1ZSBmb3IgdGhlIHNvdXJjZSBmaWxlLlxuICAgIG9wcy5wdXNoKG5ldyBUeXBlQ3Rvck9wKHJlZiwgY3Rvck1ldGEpKTtcbiAgICBmaWxlRGF0YS5oYXNJbmxpbmVzID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm0gYSBgdHMuU291cmNlRmlsZWAgaW50byBhIHZlcnNpb24gdGhhdCBpbmNsdWRlcyB0eXBlIGNoZWNraW5nIGNvZGUuXG4gICAqXG4gICAqIElmIHRoaXMgcGFydGljdWxhciBgdHMuU291cmNlRmlsZWAgcmVxdWlyZXMgY2hhbmdlcywgdGhlIHRleHQgcmVwcmVzZW50aW5nIGl0cyBuZXcgY29udGVudHNcbiAgICogd2lsbCBiZSByZXR1cm5lZC4gT3RoZXJ3aXNlLCBhIGBudWxsYCByZXR1cm4gaW5kaWNhdGVzIG5vIGNoYW5nZXMgd2VyZSBuZWNlc3NhcnkuXG4gICAqL1xuICB0cmFuc2Zvcm0oc2Y6IHRzLlNvdXJjZUZpbGUpOiBzdHJpbmd8bnVsbCB7XG4gICAgLy8gSWYgdGhlcmUgYXJlIG5vIG9wZXJhdGlvbnMgcGVuZGluZyBmb3IgdGhpcyBwYXJ0aWN1bGFyIGZpbGUsIHJldHVybiBgbnVsbGAgdG8gaW5kaWNhdGUgbm9cbiAgICAvLyBjaGFuZ2VzLlxuICAgIGlmICghdGhpcy5vcE1hcC5oYXMoc2YpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBJbXBvcnRzIG1heSBuZWVkIHRvIGJlIGFkZGVkIHRvIHRoZSBmaWxlIHRvIHN1cHBvcnQgdHlwZS1jaGVja2luZyBvZiBkaXJlY3RpdmVzIHVzZWQgaW4gdGhlXG4gICAgLy8gdGVtcGxhdGUgd2l0aGluIGl0LlxuICAgIGNvbnN0IGltcG9ydE1hbmFnZXIgPSBuZXcgSW1wb3J0TWFuYWdlcihuZXcgTm9vcEltcG9ydFJld3JpdGVyKCksICdfaScpO1xuXG4gICAgLy8gRWFjaCBPcCBoYXMgYSBzcGxpdFBvaW50IGluZGV4IGludG8gdGhlIHRleHQgd2hlcmUgaXQgbmVlZHMgdG8gYmUgaW5zZXJ0ZWQuIFNwbGl0IHRoZVxuICAgIC8vIG9yaWdpbmFsIHNvdXJjZSB0ZXh0IGludG8gY2h1bmtzIGF0IHRoZXNlIHNwbGl0IHBvaW50cywgd2hlcmUgY29kZSB3aWxsIGJlIGluc2VydGVkIGJldHdlZW5cbiAgICAvLyB0aGUgY2h1bmtzLlxuICAgIGNvbnN0IG9wcyA9IHRoaXMub3BNYXAuZ2V0KHNmKSEuc29ydChvcmRlck9wcyk7XG4gICAgY29uc3QgdGV4dFBhcnRzID0gc3BsaXRTdHJpbmdBdFBvaW50cyhzZi50ZXh0LCBvcHMubWFwKG9wID0+IG9wLnNwbGl0UG9pbnQpKTtcblxuICAgIC8vIFVzZSBhIGB0cy5QcmludGVyYCB0byBnZW5lcmF0ZSBzb3VyY2UgY29kZS5cbiAgICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcih7b21pdFRyYWlsaW5nU2VtaWNvbG9uOiB0cnVlfSk7XG5cbiAgICAvLyBCZWdpbiB3aXRoIHRoZSBpbnRpYWwgc2VjdGlvbiBvZiB0aGUgY29kZSB0ZXh0LlxuICAgIGxldCBjb2RlID0gdGV4dFBhcnRzWzBdO1xuXG4gICAgLy8gUHJvY2VzcyBlYWNoIG9wZXJhdGlvbiBhbmQgdXNlIHRoZSBwcmludGVyIHRvIGdlbmVyYXRlIHNvdXJjZSBjb2RlIGZvciBpdCwgaW5zZXJ0aW5nIGl0IGludG9cbiAgICAvLyB0aGUgc291cmNlIGNvZGUgaW4gYmV0d2VlbiB0aGUgb3JpZ2luYWwgY2h1bmtzLlxuICAgIG9wcy5mb3JFYWNoKChvcCwgaWR4KSA9PiB7XG4gICAgICBjb25zdCB0ZXh0ID0gb3AuZXhlY3V0ZShpbXBvcnRNYW5hZ2VyLCBzZiwgdGhpcy5yZWZFbWl0dGVyLCBwcmludGVyKTtcbiAgICAgIGNvZGUgKz0gJ1xcblxcbicgKyB0ZXh0ICsgdGV4dFBhcnRzW2lkeCArIDFdO1xuICAgIH0pO1xuXG4gICAgLy8gV3JpdGUgb3V0IHRoZSBpbXBvcnRzIHRoYXQgbmVlZCB0byBiZSBhZGRlZCB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBmaWxlLlxuICAgIGxldCBpbXBvcnRzID0gaW1wb3J0TWFuYWdlci5nZXRBbGxJbXBvcnRzKHNmLmZpbGVOYW1lKVxuICAgICAgICAgICAgICAgICAgICAgIC5tYXAoaSA9PiBgaW1wb3J0ICogYXMgJHtpLnF1YWxpZmllcn0gZnJvbSAnJHtpLnNwZWNpZmllcn0nO2ApXG4gICAgICAgICAgICAgICAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgIGNvZGUgPSBpbXBvcnRzICsgJ1xcbicgKyBjb2RlO1xuXG4gICAgcmV0dXJuIGNvZGU7XG4gIH1cblxuICBmaW5hbGl6ZSgpOiBNYXA8QWJzb2x1dGVGc1BhdGgsIHN0cmluZz4ge1xuICAgIC8vIEZpcnN0LCBidWlsZCB0aGUgbWFwIG9mIHVwZGF0ZXMgdG8gc291cmNlIGZpbGVzLlxuICAgIGNvbnN0IHVwZGF0ZXMgPSBuZXcgTWFwPEFic29sdXRlRnNQYXRoLCBzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBvcmlnaW5hbFNmIG9mIHRoaXMub3BNYXAua2V5cygpKSB7XG4gICAgICBjb25zdCBuZXdUZXh0ID0gdGhpcy50cmFuc2Zvcm0ob3JpZ2luYWxTZik7XG4gICAgICBpZiAobmV3VGV4dCAhPT0gbnVsbCkge1xuICAgICAgICB1cGRhdGVzLnNldChhYnNvbHV0ZUZyb21Tb3VyY2VGaWxlKG9yaWdpbmFsU2YpLCBuZXdUZXh0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGVuIGdvIHRocm91Z2ggZWFjaCBpbnB1dCBmaWxlIHRoYXQgaGFzIHBlbmRpbmcgY29kZSBnZW5lcmF0aW9uIG9wZXJhdGlvbnMuXG4gICAgZm9yIChjb25zdCBbc2ZQYXRoLCBwZW5kaW5nRmlsZURhdGFdIG9mIHRoaXMuZmlsZU1hcCkge1xuICAgICAgLy8gRm9yIGVhY2ggaW5wdXQgZmlsZSwgY29uc2lkZXIgZ2VuZXJhdGlvbiBvcGVyYXRpb25zIGZvciBlYWNoIG9mIGl0cyBzaGltcy5cbiAgICAgIGZvciAoY29uc3QgcGVuZGluZ1NoaW1EYXRhIG9mIHBlbmRpbmdGaWxlRGF0YS5zaGltRGF0YS52YWx1ZXMoKSkge1xuICAgICAgICB0aGlzLmhvc3QucmVjb3JkU2hpbURhdGEoc2ZQYXRoLCB7XG4gICAgICAgICAgZ2VuZXNpc0RpYWdub3N0aWNzOiBbXG4gICAgICAgICAgICAuLi5wZW5kaW5nU2hpbURhdGEuZG9tU2NoZW1hQ2hlY2tlci5kaWFnbm9zdGljcyxcbiAgICAgICAgICAgIC4uLnBlbmRpbmdTaGltRGF0YS5vb2JSZWNvcmRlci5kaWFnbm9zdGljcyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGhhc0lubGluZXM6IHBlbmRpbmdGaWxlRGF0YS5oYXNJbmxpbmVzLFxuICAgICAgICAgIHBhdGg6IHBlbmRpbmdTaGltRGF0YS5maWxlLmZpbGVOYW1lLFxuICAgICAgICAgIHRlbXBsYXRlczogcGVuZGluZ1NoaW1EYXRhLnRlbXBsYXRlcyxcbiAgICAgICAgfSk7XG4gICAgICAgIHVwZGF0ZXMuc2V0KHBlbmRpbmdTaGltRGF0YS5maWxlLmZpbGVOYW1lLCBwZW5kaW5nU2hpbURhdGEuZmlsZS5yZW5kZXIoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVwZGF0ZXM7XG4gIH1cblxuICBwcml2YXRlIGFkZElubGluZVR5cGVDaGVja0Jsb2NrKFxuICAgICAgZmlsZURhdGE6IFBlbmRpbmdGaWxlVHlwZUNoZWNraW5nRGF0YSwgc2hpbURhdGE6IFBlbmRpbmdTaGltRGF0YSxcbiAgICAgIHJlZjogUmVmZXJlbmNlPENsYXNzRGVjbGFyYXRpb248dHMuQ2xhc3NEZWNsYXJhdGlvbj4+LFxuICAgICAgdGNiTWV0YTogVHlwZUNoZWNrQmxvY2tNZXRhZGF0YSk6IHZvaWQge1xuICAgIGNvbnN0IHNmID0gcmVmLm5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGlmICghdGhpcy5vcE1hcC5oYXMoc2YpKSB7XG4gICAgICB0aGlzLm9wTWFwLnNldChzZiwgW10pO1xuICAgIH1cbiAgICBjb25zdCBvcHMgPSB0aGlzLm9wTWFwLmdldChzZikhO1xuICAgIG9wcy5wdXNoKG5ldyBUY2JPcChcbiAgICAgICAgcmVmLCB0Y2JNZXRhLCB0aGlzLmNvbmZpZywgdGhpcy5yZWZsZWN0b3IsIHNoaW1EYXRhLmRvbVNjaGVtYUNoZWNrZXIsXG4gICAgICAgIHNoaW1EYXRhLm9vYlJlY29yZGVyKSk7XG4gICAgZmlsZURhdGEuaGFzSW5saW5lcyA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIHBlbmRpbmdTaGltRm9yQ29tcG9uZW50KG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBQZW5kaW5nU2hpbURhdGEge1xuICAgIGNvbnN0IGZpbGVEYXRhID0gdGhpcy5kYXRhRm9yRmlsZShub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgY29uc3Qgc2hpbVBhdGggPSB0aGlzLmNvbXBvbmVudE1hcHBpbmdTdHJhdGVneS5zaGltUGF0aEZvckNvbXBvbmVudChub2RlKTtcbiAgICBpZiAoIWZpbGVEYXRhLnNoaW1EYXRhLmhhcyhzaGltUGF0aCkpIHtcbiAgICAgIGZpbGVEYXRhLnNoaW1EYXRhLnNldChzaGltUGF0aCwge1xuICAgICAgICBkb21TY2hlbWFDaGVja2VyOiBuZXcgUmVnaXN0cnlEb21TY2hlbWFDaGVja2VyKGZpbGVEYXRhLnNvdXJjZU1hbmFnZXIpLFxuICAgICAgICBvb2JSZWNvcmRlcjogbmV3IE91dE9mQmFuZERpYWdub3N0aWNSZWNvcmRlckltcGwoZmlsZURhdGEuc291cmNlTWFuYWdlciksXG4gICAgICAgIGZpbGU6IG5ldyBUeXBlQ2hlY2tGaWxlKFxuICAgICAgICAgICAgc2hpbVBhdGgsIHRoaXMuY29uZmlnLCB0aGlzLnJlZkVtaXR0ZXIsIHRoaXMucmVmbGVjdG9yLCB0aGlzLmNvbXBpbGVySG9zdCksXG4gICAgICAgIHRlbXBsYXRlczogbmV3IE1hcDxUZW1wbGF0ZUlkLCBUZW1wbGF0ZURhdGE+KCksXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbGVEYXRhLnNoaW1EYXRhLmdldChzaGltUGF0aCkhO1xuICB9XG5cbiAgcHJpdmF0ZSBkYXRhRm9yRmlsZShzZjogdHMuU291cmNlRmlsZSk6IFBlbmRpbmdGaWxlVHlwZUNoZWNraW5nRGF0YSB7XG4gICAgY29uc3Qgc2ZQYXRoID0gYWJzb2x1dGVGcm9tU291cmNlRmlsZShzZik7XG5cbiAgICBpZiAoIXRoaXMuZmlsZU1hcC5oYXMoc2ZQYXRoKSkge1xuICAgICAgY29uc3QgZGF0YTogUGVuZGluZ0ZpbGVUeXBlQ2hlY2tpbmdEYXRhID0ge1xuICAgICAgICBoYXNJbmxpbmVzOiBmYWxzZSxcbiAgICAgICAgc291cmNlTWFuYWdlcjogdGhpcy5ob3N0LmdldFNvdXJjZU1hbmFnZXIoc2ZQYXRoKSxcbiAgICAgICAgc2hpbURhdGE6IG5ldyBNYXAoKSxcbiAgICAgIH07XG4gICAgICB0aGlzLmZpbGVNYXAuc2V0KHNmUGF0aCwgZGF0YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZmlsZU1hcC5nZXQoc2ZQYXRoKSE7XG4gIH1cblxuICBwcml2YXRlIGdldFRlbXBsYXRlRGlhZ25vc3RpY3MoXG4gICAgICBwYXJzZUVycm9yczogUGFyc2VFcnJvcltdLCB0ZW1wbGF0ZUlkOiBUZW1wbGF0ZUlkLFxuICAgICAgc291cmNlTWFwcGluZzogVGVtcGxhdGVTb3VyY2VNYXBwaW5nKTogVGVtcGxhdGVEaWFnbm9zdGljW10ge1xuICAgIHJldHVybiBwYXJzZUVycm9ycy5tYXAoZXJyb3IgPT4ge1xuICAgICAgY29uc3Qgc3BhbiA9IGVycm9yLnNwYW47XG5cbiAgICAgIGlmIChzcGFuLnN0YXJ0Lm9mZnNldCA9PT0gc3Bhbi5lbmQub2Zmc2V0KSB7XG4gICAgICAgIC8vIFRlbXBsYXRlIGVycm9ycyBjYW4gY29udGFpbiB6ZXJvLWxlbmd0aCBzcGFucywgaWYgdGhlIGVycm9yIG9jY3VycyBhdCBhIHNpbmdsZSBwb2ludC5cbiAgICAgICAgLy8gSG93ZXZlciwgVHlwZVNjcmlwdCBkb2VzIG5vdCBoYW5kbGUgZGlzcGxheWluZyBhIHplcm8tbGVuZ3RoIGRpYWdub3N0aWMgdmVyeSB3ZWxsLCBzb1xuICAgICAgICAvLyBpbmNyZWFzZSB0aGUgZW5kaW5nIG9mZnNldCBieSAxIGZvciBzdWNoIGVycm9ycywgdG8gZW5zdXJlIHRoZSBwb3NpdGlvbiBpcyBzaG93biBpbiB0aGVcbiAgICAgICAgLy8gZGlhZ25vc3RpYy5cbiAgICAgICAgc3Bhbi5lbmQub2Zmc2V0Kys7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYWtlVGVtcGxhdGVEaWFnbm9zdGljKFxuICAgICAgICAgIHRlbXBsYXRlSWQsIHNvdXJjZU1hcHBpbmcsIHNwYW4sIHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcixcbiAgICAgICAgICBuZ0Vycm9yQ29kZShFcnJvckNvZGUuVEVNUExBVEVfUEFSU0VfRVJST1IpLCBlcnJvci5tc2cpO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQSBjb2RlIGdlbmVyYXRpb24gb3BlcmF0aW9uIHRoYXQgbmVlZHMgdG8gaGFwcGVuIHdpdGhpbiBhIGdpdmVuIHNvdXJjZSBmaWxlLlxuICovXG5pbnRlcmZhY2UgT3Age1xuICAvKipcbiAgICogVGhlIG5vZGUgaW4gdGhlIGZpbGUgd2hpY2ggd2lsbCBoYXZlIGNvZGUgZ2VuZXJhdGVkIGZvciBpdC5cbiAgICovXG4gIHJlYWRvbmx5IHJlZjogUmVmZXJlbmNlPENsYXNzRGVjbGFyYXRpb248dHMuQ2xhc3NEZWNsYXJhdGlvbj4+O1xuXG4gIC8qKlxuICAgKiBJbmRleCBpbnRvIHRoZSBzb3VyY2UgdGV4dCB3aGVyZSB0aGUgY29kZSBnZW5lcmF0ZWQgYnkgdGhlIG9wZXJhdGlvbiBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAqL1xuICByZWFkb25seSBzcGxpdFBvaW50OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgdGhlIG9wZXJhdGlvbiBhbmQgcmV0dXJuIHRoZSBnZW5lcmF0ZWQgY29kZSBhcyB0ZXh0LlxuICAgKi9cbiAgZXhlY3V0ZShpbTogSW1wb3J0TWFuYWdlciwgc2Y6IHRzLlNvdXJjZUZpbGUsIHJlZkVtaXR0ZXI6IFJlZmVyZW5jZUVtaXR0ZXIsIHByaW50ZXI6IHRzLlByaW50ZXIpOlxuICAgICAgc3RyaW5nO1xufVxuXG4vKipcbiAqIEEgdHlwZSBjaGVjayBibG9jayBvcGVyYXRpb24gd2hpY2ggcHJvZHVjZXMgdHlwZSBjaGVjayBjb2RlIGZvciBhIHBhcnRpY3VsYXIgY29tcG9uZW50LlxuICovXG5jbGFzcyBUY2JPcCBpbXBsZW1lbnRzIE9wIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICByZWFkb25seSByZWY6IFJlZmVyZW5jZTxDbGFzc0RlY2xhcmF0aW9uPHRzLkNsYXNzRGVjbGFyYXRpb24+PixcbiAgICAgIHJlYWRvbmx5IG1ldGE6IFR5cGVDaGVja0Jsb2NrTWV0YWRhdGEsIHJlYWRvbmx5IGNvbmZpZzogVHlwZUNoZWNraW5nQ29uZmlnLFxuICAgICAgcmVhZG9ubHkgcmVmbGVjdG9yOiBSZWZsZWN0aW9uSG9zdCwgcmVhZG9ubHkgZG9tU2NoZW1hQ2hlY2tlcjogRG9tU2NoZW1hQ2hlY2tlcixcbiAgICAgIHJlYWRvbmx5IG9vYlJlY29yZGVyOiBPdXRPZkJhbmREaWFnbm9zdGljUmVjb3JkZXIpIHt9XG5cbiAgLyoqXG4gICAqIFR5cGUgY2hlY2sgYmxvY2tzIGFyZSBpbnNlcnRlZCBpbW1lZGlhdGVseSBhZnRlciB0aGUgZW5kIG9mIHRoZSBjb21wb25lbnQgY2xhc3MuXG4gICAqL1xuICBnZXQgc3BsaXRQb2ludCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnJlZi5ub2RlLmVuZCArIDE7XG4gIH1cblxuICBleGVjdXRlKGltOiBJbXBvcnRNYW5hZ2VyLCBzZjogdHMuU291cmNlRmlsZSwgcmVmRW1pdHRlcjogUmVmZXJlbmNlRW1pdHRlciwgcHJpbnRlcjogdHMuUHJpbnRlcik6XG4gICAgICBzdHJpbmcge1xuICAgIGNvbnN0IGVudiA9IG5ldyBFbnZpcm9ubWVudCh0aGlzLmNvbmZpZywgaW0sIHJlZkVtaXR0ZXIsIHRoaXMucmVmbGVjdG9yLCBzZik7XG4gICAgY29uc3QgZm5OYW1lID0gdHMuY3JlYXRlSWRlbnRpZmllcihgX3RjYl8ke3RoaXMucmVmLm5vZGUucG9zfWApO1xuICAgIGNvbnN0IGZuID0gZ2VuZXJhdGVUeXBlQ2hlY2tCbG9jayhcbiAgICAgICAgZW52LCB0aGlzLnJlZiwgZm5OYW1lLCB0aGlzLm1ldGEsIHRoaXMuZG9tU2NoZW1hQ2hlY2tlciwgdGhpcy5vb2JSZWNvcmRlcik7XG4gICAgcmV0dXJuIHByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBmbiwgc2YpO1xuICB9XG59XG5cbi8qKlxuICogQSB0eXBlIGNvbnN0cnVjdG9yIG9wZXJhdGlvbiB3aGljaCBwcm9kdWNlcyB0eXBlIGNvbnN0cnVjdG9yIGNvZGUgZm9yIGEgcGFydGljdWxhciBkaXJlY3RpdmUuXG4gKi9cbmNsYXNzIFR5cGVDdG9yT3AgaW1wbGVtZW50cyBPcCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcmVhZG9ubHkgcmVmOiBSZWZlcmVuY2U8Q2xhc3NEZWNsYXJhdGlvbjx0cy5DbGFzc0RlY2xhcmF0aW9uPj4sXG4gICAgICByZWFkb25seSBtZXRhOiBUeXBlQ3Rvck1ldGFkYXRhKSB7fVxuXG4gIC8qKlxuICAgKiBUeXBlIGNvbnN0cnVjdG9yIG9wZXJhdGlvbnMgYXJlIGluc2VydGVkIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZW5kIG9mIHRoZSBkaXJlY3RpdmUgY2xhc3MuXG4gICAqL1xuICBnZXQgc3BsaXRQb2ludCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnJlZi5ub2RlLmVuZCAtIDE7XG4gIH1cblxuICBleGVjdXRlKGltOiBJbXBvcnRNYW5hZ2VyLCBzZjogdHMuU291cmNlRmlsZSwgcmVmRW1pdHRlcjogUmVmZXJlbmNlRW1pdHRlciwgcHJpbnRlcjogdHMuUHJpbnRlcik6XG4gICAgICBzdHJpbmcge1xuICAgIGNvbnN0IHRjYiA9IGdlbmVyYXRlSW5saW5lVHlwZUN0b3IodGhpcy5yZWYubm9kZSwgdGhpcy5tZXRhKTtcbiAgICByZXR1cm4gcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHRjYiwgc2YpO1xuICB9XG59XG5cbi8qKlxuICogQ29tcGFyZSB0d28gb3BlcmF0aW9ucyBhbmQgcmV0dXJuIHRoZWlyIHNwbGl0IHBvaW50IG9yZGVyaW5nLlxuICovXG5mdW5jdGlvbiBvcmRlck9wcyhvcDE6IE9wLCBvcDI6IE9wKTogbnVtYmVyIHtcbiAgcmV0dXJuIG9wMS5zcGxpdFBvaW50IC0gb3AyLnNwbGl0UG9pbnQ7XG59XG5cbi8qKlxuICogU3BsaXQgYSBzdHJpbmcgaW50byBjaHVua3MgYXQgYW55IG51bWJlciBvZiBzcGxpdCBwb2ludHMuXG4gKi9cbmZ1bmN0aW9uIHNwbGl0U3RyaW5nQXRQb2ludHMoc3RyOiBzdHJpbmcsIHBvaW50czogbnVtYmVyW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHNwbGl0czogc3RyaW5nW10gPSBbXTtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwb2ludCA9IHBvaW50c1tpXTtcbiAgICBzcGxpdHMucHVzaChzdHIuc3Vic3RyaW5nKHN0YXJ0LCBwb2ludCkpO1xuICAgIHN0YXJ0ID0gcG9pbnQ7XG4gIH1cbiAgc3BsaXRzLnB1c2goc3RyLnN1YnN0cmluZyhzdGFydCkpO1xuICByZXR1cm4gc3BsaXRzO1xufVxuIl19