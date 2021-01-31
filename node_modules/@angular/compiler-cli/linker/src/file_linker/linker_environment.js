(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/linker/src/file_linker/linker_environment", ["require", "exports", "@angular/compiler-cli/src/ngtsc/sourcemaps", "@angular/compiler-cli/linker/src/file_linker/linker_options", "@angular/compiler-cli/linker/src/file_linker/translator"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinkerEnvironment = void 0;
    var sourcemaps_1 = require("@angular/compiler-cli/src/ngtsc/sourcemaps");
    var linker_options_1 = require("@angular/compiler-cli/linker/src/file_linker/linker_options");
    var translator_1 = require("@angular/compiler-cli/linker/src/file_linker/translator");
    var LinkerEnvironment = /** @class */ (function () {
        function LinkerEnvironment(fileSystem, logger, host, factory, options) {
            this.fileSystem = fileSystem;
            this.logger = logger;
            this.host = host;
            this.factory = factory;
            this.options = options;
            this.translator = new translator_1.Translator(this.factory);
            this.sourceFileLoader = this.options.sourceMapping ? new sourcemaps_1.SourceFileLoader(this.fileSystem, this.logger, {}) : null;
        }
        LinkerEnvironment.create = function (fileSystem, logger, host, factory, options) {
            var _a, _b, _c, _d;
            return new LinkerEnvironment(fileSystem, logger, host, factory, {
                enableI18nLegacyMessageIdFormat: (_a = options.enableI18nLegacyMessageIdFormat) !== null && _a !== void 0 ? _a : linker_options_1.DEFAULT_LINKER_OPTIONS.enableI18nLegacyMessageIdFormat,
                i18nNormalizeLineEndingsInICUs: (_b = options.i18nNormalizeLineEndingsInICUs) !== null && _b !== void 0 ? _b : linker_options_1.DEFAULT_LINKER_OPTIONS.i18nNormalizeLineEndingsInICUs,
                i18nUseExternalIds: (_c = options.i18nUseExternalIds) !== null && _c !== void 0 ? _c : linker_options_1.DEFAULT_LINKER_OPTIONS.i18nUseExternalIds,
                sourceMapping: (_d = options.sourceMapping) !== null && _d !== void 0 ? _d : linker_options_1.DEFAULT_LINKER_OPTIONS.sourceMapping
            });
        };
        return LinkerEnvironment;
    }());
    exports.LinkerEnvironment = LinkerEnvironment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VyX2Vudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL2xpbmtlci9zcmMvZmlsZV9saW5rZXIvbGlua2VyX2Vudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQVNBLHlFQUErRDtJQUkvRCw4RkFBdUU7SUFDdkUsc0ZBQXdDO0lBRXhDO1FBS0UsMkJBQ2EsVUFBOEIsRUFBVyxNQUFjLEVBQ3ZELElBQTBCLEVBQVcsT0FBNEMsRUFDakYsT0FBc0I7WUFGdEIsZUFBVSxHQUFWLFVBQVUsQ0FBb0I7WUFBVyxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ3ZELFNBQUksR0FBSixJQUFJLENBQXNCO1lBQVcsWUFBTyxHQUFQLE9BQU8sQ0FBcUM7WUFDakYsWUFBTyxHQUFQLE9BQU8sQ0FBZTtZQVAxQixlQUFVLEdBQUcsSUFBSSx1QkFBVSxDQUEwQixJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkUscUJBQWdCLEdBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLDZCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBS3pELENBQUM7UUFFaEMsd0JBQU0sR0FBYixVQUNJLFVBQThCLEVBQUUsTUFBYyxFQUFFLElBQTBCLEVBQzFFLE9BQTRDLEVBQzVDLE9BQStCOztZQUNqQyxPQUFPLElBQUksaUJBQWlCLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO2dCQUM5RCwrQkFBK0IsUUFBRSxPQUFPLENBQUMsK0JBQStCLG1DQUNwRSx1Q0FBc0IsQ0FBQywrQkFBK0I7Z0JBQzFELDhCQUE4QixRQUFFLE9BQU8sQ0FBQyw4QkFBOEIsbUNBQ2xFLHVDQUFzQixDQUFDLDhCQUE4QjtnQkFDekQsa0JBQWtCLFFBQUUsT0FBTyxDQUFDLGtCQUFrQixtQ0FBSSx1Q0FBc0IsQ0FBQyxrQkFBa0I7Z0JBQzNGLGFBQWEsUUFBRSxPQUFPLENBQUMsYUFBYSxtQ0FBSSx1Q0FBc0IsQ0FBQyxhQUFhO2FBQzdFLENBQUMsQ0FBQztRQUNMLENBQUM7UUFDSCx3QkFBQztJQUFELENBQUMsQUF2QkQsSUF1QkM7SUF2QlksOENBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1JlYWRvbmx5RmlsZVN5c3RlbX0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7TG9nZ2VyfSBmcm9tICcuLi8uLi8uLi9zcmMvbmd0c2MvbG9nZ2luZyc7XG5pbXBvcnQge1NvdXJjZUZpbGVMb2FkZXJ9IGZyb20gJy4uLy4uLy4uL3NyYy9uZ3RzYy9zb3VyY2VtYXBzJztcbmltcG9ydCB7QXN0RmFjdG9yeX0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL3RyYW5zbGF0b3InO1xuXG5pbXBvcnQge0FzdEhvc3R9IGZyb20gJy4uL2FzdC9hc3RfaG9zdCc7XG5pbXBvcnQge0RFRkFVTFRfTElOS0VSX09QVElPTlMsIExpbmtlck9wdGlvbnN9IGZyb20gJy4vbGlua2VyX29wdGlvbnMnO1xuaW1wb3J0IHtUcmFuc2xhdG9yfSBmcm9tICcuL3RyYW5zbGF0b3InO1xuXG5leHBvcnQgY2xhc3MgTGlua2VyRW52aXJvbm1lbnQ8VFN0YXRlbWVudCwgVEV4cHJlc3Npb24+IHtcbiAgcmVhZG9ubHkgdHJhbnNsYXRvciA9IG5ldyBUcmFuc2xhdG9yPFRTdGF0ZW1lbnQsIFRFeHByZXNzaW9uPih0aGlzLmZhY3RvcnkpO1xuICByZWFkb25seSBzb3VyY2VGaWxlTG9hZGVyID1cbiAgICAgIHRoaXMub3B0aW9ucy5zb3VyY2VNYXBwaW5nID8gbmV3IFNvdXJjZUZpbGVMb2FkZXIodGhpcy5maWxlU3lzdGVtLCB0aGlzLmxvZ2dlciwge30pIDogbnVsbDtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgICAgcmVhZG9ubHkgZmlsZVN5c3RlbTogUmVhZG9ubHlGaWxlU3lzdGVtLCByZWFkb25seSBsb2dnZXI6IExvZ2dlcixcbiAgICAgIHJlYWRvbmx5IGhvc3Q6IEFzdEhvc3Q8VEV4cHJlc3Npb24+LCByZWFkb25seSBmYWN0b3J5OiBBc3RGYWN0b3J5PFRTdGF0ZW1lbnQsIFRFeHByZXNzaW9uPixcbiAgICAgIHJlYWRvbmx5IG9wdGlvbnM6IExpbmtlck9wdGlvbnMpIHt9XG5cbiAgc3RhdGljIGNyZWF0ZTxUU3RhdGVtZW50LCBURXhwcmVzc2lvbj4oXG4gICAgICBmaWxlU3lzdGVtOiBSZWFkb25seUZpbGVTeXN0ZW0sIGxvZ2dlcjogTG9nZ2VyLCBob3N0OiBBc3RIb3N0PFRFeHByZXNzaW9uPixcbiAgICAgIGZhY3Rvcnk6IEFzdEZhY3Rvcnk8VFN0YXRlbWVudCwgVEV4cHJlc3Npb24+LFxuICAgICAgb3B0aW9uczogUGFydGlhbDxMaW5rZXJPcHRpb25zPik6IExpbmtlckVudmlyb25tZW50PFRTdGF0ZW1lbnQsIFRFeHByZXNzaW9uPiB7XG4gICAgcmV0dXJuIG5ldyBMaW5rZXJFbnZpcm9ubWVudChmaWxlU3lzdGVtLCBsb2dnZXIsIGhvc3QsIGZhY3RvcnksIHtcbiAgICAgIGVuYWJsZUkxOG5MZWdhY3lNZXNzYWdlSWRGb3JtYXQ6IG9wdGlvbnMuZW5hYmxlSTE4bkxlZ2FjeU1lc3NhZ2VJZEZvcm1hdCA/P1xuICAgICAgICAgIERFRkFVTFRfTElOS0VSX09QVElPTlMuZW5hYmxlSTE4bkxlZ2FjeU1lc3NhZ2VJZEZvcm1hdCxcbiAgICAgIGkxOG5Ob3JtYWxpemVMaW5lRW5kaW5nc0luSUNVczogb3B0aW9ucy5pMThuTm9ybWFsaXplTGluZUVuZGluZ3NJbklDVXMgPz9cbiAgICAgICAgICBERUZBVUxUX0xJTktFUl9PUFRJT05TLmkxOG5Ob3JtYWxpemVMaW5lRW5kaW5nc0luSUNVcyxcbiAgICAgIGkxOG5Vc2VFeHRlcm5hbElkczogb3B0aW9ucy5pMThuVXNlRXh0ZXJuYWxJZHMgPz8gREVGQVVMVF9MSU5LRVJfT1BUSU9OUy5pMThuVXNlRXh0ZXJuYWxJZHMsXG4gICAgICBzb3VyY2VNYXBwaW5nOiBvcHRpb25zLnNvdXJjZU1hcHBpbmcgPz8gREVGQVVMVF9MSU5LRVJfT1BUSU9OUy5zb3VyY2VNYXBwaW5nXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==