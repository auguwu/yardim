/// <amd-module name="@angular/compiler-cli/linker/src/file_linker/partial_linkers/partial_linker_selector" />
import { AbsoluteFsPath } from '../../../../src/ngtsc/file_system';
import { LinkerEnvironment } from '../linker_environment';
import { PartialLinker } from './partial_linker';
export declare const ɵɵngDeclareDirective = "\u0275\u0275ngDeclareDirective";
export declare const ɵɵngDeclareComponent = "\u0275\u0275ngDeclareComponent";
export declare const declarationFunctions: string[];
/**
 * A helper that selects the appropriate `PartialLinker` for a given declaration.
 *
 * The selection is made from a database of linker instances, chosen if their given semver range
 * satisfies the version found in the code to be linked.
 *
 * Note that the ranges are checked in order, and the first matching range will be selected, so
 * ranges should be most restrictive first.
 *
 * Also, ranges are matched to include "pre-releases", therefore if the range is `>=11.1.0-next.1`
 * then this includes `11.1.0-next.2` and also `12.0.0-next.1`.
 *
 * Finally, note that we always start with the current version (i.e. `11.1.1`). This
 * allows the linker to work on local builds effectively.
 */
export declare class PartialLinkerSelector<TStatement, TExpression> {
    private readonly linkers;
    constructor(environment: LinkerEnvironment<TStatement, TExpression>, sourceUrl: AbsoluteFsPath, code: string);
    /**
     * Returns true if there are `PartialLinker` classes that can handle functions with this name.
     */
    supportsDeclaration(functionName: string): boolean;
    /**
     * Returns the `PartialLinker` that can handle functions with the given name and version.
     * Throws an error if there is none.
     */
    getLinker(functionName: string, version: string): PartialLinker<TExpression>;
    private createLinkerMap;
}
