/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { initNgDevMode } from '../../util/ng_dev_mode';
import { assertNodeInjector } from '../assert';
import { getInjectorIndex, getParentInjectorLocation } from '../di';
import { CONTAINER_HEADER_OFFSET, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS, NATIVE } from '../interfaces/container';
import { NO_PARENT_INJECTOR } from '../interfaces/injector';
import { toTNodeTypeAsString } from '../interfaces/node';
import { getTStylingRangeNext, getTStylingRangeNextDuplicate, getTStylingRangePrev, getTStylingRangePrevDuplicate } from '../interfaces/styling';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, T_HOST, TVIEW, TViewTypeAsString } from '../interfaces/view';
import { attachDebugObject } from '../util/debug_utils';
import { getParentInjectorIndex, getParentInjectorView } from '../util/injector_utils';
import { unwrapRNode } from '../util/view_utils';
const NG_DEV_MODE = ((typeof ngDevMode === 'undefined' || !!ngDevMode) && initNgDevMode());
/*
 * This file contains conditionally attached classes which provide human readable (debug) level
 * information for `LView`, `LContainer` and other internal data structures. These data structures
 * are stored internally as array which makes it very difficult during debugging to reason about the
 * current state of the system.
 *
 * Patching the array with extra property does change the array's hidden class' but it does not
 * change the cost of access, therefore this patching should not have significant if any impact in
 * `ngDevMode` mode. (see: https://jsperf.com/array-vs-monkey-patch-array)
 *
 * So instead of seeing:
 * ```
 * Array(30) [Object, 659, null, …]
 * ```
 *
 * You get to see:
 * ```
 * LViewDebug {
 *   views: [...],
 *   flags: {attached: true, ...}
 *   nodes: [
 *     {html: '<div id="123">', ..., nodes: [
 *       {html: '<span>', ..., nodes: null}
 *     ]}
 *   ]
 * }
 * ```
 */
let LVIEW_COMPONENT_CACHE;
let LVIEW_EMBEDDED_CACHE;
let LVIEW_ROOT;
/**
 * This function clones a blueprint and creates LView.
 *
 * Simple slice will keep the same type, and we need it to be LView
 */
export function cloneToLViewFromTViewBlueprint(tView) {
    const debugTView = tView;
    const lView = getLViewToClone(debugTView.type, tView.template && tView.template.name);
    return lView.concat(tView.blueprint);
}
function getLViewToClone(type, name) {
    switch (type) {
        case 0 /* Root */:
            if (LVIEW_ROOT === undefined)
                LVIEW_ROOT = new (createNamedArrayType('LRootView'))();
            return LVIEW_ROOT;
        case 1 /* Component */:
            if (LVIEW_COMPONENT_CACHE === undefined)
                LVIEW_COMPONENT_CACHE = new Map();
            let componentArray = LVIEW_COMPONENT_CACHE.get(name);
            if (componentArray === undefined) {
                componentArray = new (createNamedArrayType('LComponentView' + nameSuffix(name)))();
                LVIEW_COMPONENT_CACHE.set(name, componentArray);
            }
            return componentArray;
        case 2 /* Embedded */:
            if (LVIEW_EMBEDDED_CACHE === undefined)
                LVIEW_EMBEDDED_CACHE = new Map();
            let embeddedArray = LVIEW_EMBEDDED_CACHE.get(name);
            if (embeddedArray === undefined) {
                embeddedArray = new (createNamedArrayType('LEmbeddedView' + nameSuffix(name)))();
                LVIEW_EMBEDDED_CACHE.set(name, embeddedArray);
            }
            return embeddedArray;
    }
    throw new Error('unreachable code');
}
function nameSuffix(text) {
    if (text == null)
        return '';
    const index = text.lastIndexOf('_Template');
    return '_' + (index === -1 ? text : text.substr(0, index));
}
/**
 * This class is a debug version of Object literal so that we can have constructor name show up
 * in
 * debug tools in ngDevMode.
 */
export const TViewConstructor = class TView {
    constructor(type, blueprint, template, queries, viewQuery, declTNode, data, bindingStartIndex, expandoStartIndex, hostBindingOpCodes, firstCreatePass, firstUpdatePass, staticViewQueries, staticContentQueries, preOrderHooks, preOrderCheckHooks, contentHooks, contentCheckHooks, viewHooks, viewCheckHooks, destroyHooks, cleanup, contentQueries, components, directiveRegistry, pipeRegistry, firstChild, schemas, consts, incompleteFirstPass, _decls, _vars) {
        this.type = type;
        this.blueprint = blueprint;
        this.template = template;
        this.queries = queries;
        this.viewQuery = viewQuery;
        this.declTNode = declTNode;
        this.data = data;
        this.bindingStartIndex = bindingStartIndex;
        this.expandoStartIndex = expandoStartIndex;
        this.hostBindingOpCodes = hostBindingOpCodes;
        this.firstCreatePass = firstCreatePass;
        this.firstUpdatePass = firstUpdatePass;
        this.staticViewQueries = staticViewQueries;
        this.staticContentQueries = staticContentQueries;
        this.preOrderHooks = preOrderHooks;
        this.preOrderCheckHooks = preOrderCheckHooks;
        this.contentHooks = contentHooks;
        this.contentCheckHooks = contentCheckHooks;
        this.viewHooks = viewHooks;
        this.viewCheckHooks = viewCheckHooks;
        this.destroyHooks = destroyHooks;
        this.cleanup = cleanup;
        this.contentQueries = contentQueries;
        this.components = components;
        this.directiveRegistry = directiveRegistry;
        this.pipeRegistry = pipeRegistry;
        this.firstChild = firstChild;
        this.schemas = schemas;
        this.consts = consts;
        this.incompleteFirstPass = incompleteFirstPass;
        this._decls = _decls;
        this._vars = _vars;
    }
    get template_() {
        const buf = [];
        processTNodeChildren(this.firstChild, buf);
        return buf.join('');
    }
    get type_() {
        return TViewTypeAsString[this.type] || `TViewType.?${this.type}?`;
    }
};
class TNode {
    constructor(tView_, //
    type, //
    index, //
    insertBeforeIndex, //
    injectorIndex, //
    directiveStart, //
    directiveEnd, //
    directiveStylingLast, //
    propertyBindings, //
    flags, //
    providerIndexes, //
    value, //
    attrs, //
    mergedAttrs, //
    localNames, //
    initialInputs, //
    inputs, //
    outputs, //
    tViews, //
    next, //
    projectionNext, //
    child, //
    parent, //
    projection, //
    styles, //
    stylesWithoutHost, //
    residualStyles, //
    classes, //
    classesWithoutHost, //
    residualClasses, //
    classBindings, //
    styleBindings) {
        this.tView_ = tView_;
        this.type = type;
        this.index = index;
        this.insertBeforeIndex = insertBeforeIndex;
        this.injectorIndex = injectorIndex;
        this.directiveStart = directiveStart;
        this.directiveEnd = directiveEnd;
        this.directiveStylingLast = directiveStylingLast;
        this.propertyBindings = propertyBindings;
        this.flags = flags;
        this.providerIndexes = providerIndexes;
        this.value = value;
        this.attrs = attrs;
        this.mergedAttrs = mergedAttrs;
        this.localNames = localNames;
        this.initialInputs = initialInputs;
        this.inputs = inputs;
        this.outputs = outputs;
        this.tViews = tViews;
        this.next = next;
        this.projectionNext = projectionNext;
        this.child = child;
        this.parent = parent;
        this.projection = projection;
        this.styles = styles;
        this.stylesWithoutHost = stylesWithoutHost;
        this.residualStyles = residualStyles;
        this.classes = classes;
        this.classesWithoutHost = classesWithoutHost;
        this.residualClasses = residualClasses;
        this.classBindings = classBindings;
        this.styleBindings = styleBindings;
    }
    /**
     * Return a human debug version of the set of `NodeInjector`s which will be consulted when
     * resolving tokens from this `TNode`.
     *
     * When debugging applications, it is often difficult to determine which `NodeInjector`s will be
     * consulted. This method shows a list of `DebugNode`s representing the `TNode`s which will be
     * consulted in order when resolving a token starting at this `TNode`.
     *
     * The original data is stored in `LView` and `TView` with a lot of offset indexes, and so it is
     * difficult to reason about.
     *
     * @param lView The `LView` instance for this `TNode`.
     */
    debugNodeInjectorPath(lView) {
        const path = [];
        let injectorIndex = getInjectorIndex(this, lView);
        if (injectorIndex === -1) {
            // Looks like the current `TNode` does not have `NodeInjector` associated with it => look for
            // parent NodeInjector.
            const parentLocation = getParentInjectorLocation(this, lView);
            if (parentLocation !== NO_PARENT_INJECTOR) {
                // We found a parent, so start searching from the parent location.
                injectorIndex = getParentInjectorIndex(parentLocation);
                lView = getParentInjectorView(parentLocation, lView);
            }
            else {
                // No parents have been found, so there are no `NodeInjector`s to consult.
            }
        }
        while (injectorIndex !== -1) {
            ngDevMode && assertNodeInjector(lView, injectorIndex);
            const tNode = lView[TVIEW].data[injectorIndex + 8 /* TNODE */];
            path.push(buildDebugNode(tNode, lView));
            const parentLocation = lView[injectorIndex + 8 /* PARENT */];
            if (parentLocation === NO_PARENT_INJECTOR) {
                injectorIndex = -1;
            }
            else {
                injectorIndex = getParentInjectorIndex(parentLocation);
                lView = getParentInjectorView(parentLocation, lView);
            }
        }
        return path;
    }
    get type_() {
        return toTNodeTypeAsString(this.type) || `TNodeType.?${this.type}?`;
    }
    get flags_() {
        const flags = [];
        if (this.flags & 16 /* hasClassInput */)
            flags.push('TNodeFlags.hasClassInput');
        if (this.flags & 8 /* hasContentQuery */)
            flags.push('TNodeFlags.hasContentQuery');
        if (this.flags & 32 /* hasStyleInput */)
            flags.push('TNodeFlags.hasStyleInput');
        if (this.flags & 128 /* hasHostBindings */)
            flags.push('TNodeFlags.hasHostBindings');
        if (this.flags & 2 /* isComponentHost */)
            flags.push('TNodeFlags.isComponentHost');
        if (this.flags & 1 /* isDirectiveHost */)
            flags.push('TNodeFlags.isDirectiveHost');
        if (this.flags & 64 /* isDetached */)
            flags.push('TNodeFlags.isDetached');
        if (this.flags & 4 /* isProjected */)
            flags.push('TNodeFlags.isProjected');
        return flags.join('|');
    }
    get template_() {
        if (this.type & 1 /* Text */)
            return this.value;
        const buf = [];
        const tagName = typeof this.value === 'string' && this.value || this.type_;
        buf.push('<', tagName);
        if (this.flags) {
            buf.push(' ', this.flags_);
        }
        if (this.attrs) {
            for (let i = 0; i < this.attrs.length;) {
                const attrName = this.attrs[i++];
                if (typeof attrName == 'number') {
                    break;
                }
                const attrValue = this.attrs[i++];
                buf.push(' ', attrName, '="', attrValue, '"');
            }
        }
        buf.push('>');
        processTNodeChildren(this.child, buf);
        buf.push('</', tagName, '>');
        return buf.join('');
    }
    get styleBindings_() {
        return toDebugStyleBinding(this, false);
    }
    get classBindings_() {
        return toDebugStyleBinding(this, true);
    }
    get providerIndexStart_() {
        return this.providerIndexes & 1048575 /* ProvidersStartIndexMask */;
    }
    get providerIndexEnd_() {
        return this.providerIndexStart_ +
            (this.providerIndexes >>> 20 /* CptViewProvidersCountShift */);
    }
}
export const TNodeDebug = TNode;
function toDebugStyleBinding(tNode, isClassBased) {
    const tData = tNode.tView_.data;
    const bindings = [];
    const range = isClassBased ? tNode.classBindings : tNode.styleBindings;
    const prev = getTStylingRangePrev(range);
    const next = getTStylingRangeNext(range);
    let isTemplate = next !== 0;
    let cursor = isTemplate ? next : prev;
    while (cursor !== 0) {
        const itemKey = tData[cursor];
        const itemRange = tData[cursor + 1];
        bindings.unshift({
            key: itemKey,
            index: cursor,
            isTemplate: isTemplate,
            prevDuplicate: getTStylingRangePrevDuplicate(itemRange),
            nextDuplicate: getTStylingRangeNextDuplicate(itemRange),
            nextIndex: getTStylingRangeNext(itemRange),
            prevIndex: getTStylingRangePrev(itemRange),
        });
        if (cursor === prev)
            isTemplate = false;
        cursor = getTStylingRangePrev(itemRange);
    }
    bindings.push((isClassBased ? tNode.residualClasses : tNode.residualStyles) || null);
    return bindings;
}
function processTNodeChildren(tNode, buf) {
    while (tNode) {
        buf.push(tNode.template_);
        tNode = tNode.next;
    }
}
const TViewData = NG_DEV_MODE && createNamedArrayType('TViewData') || null;
let TVIEWDATA_EMPTY; // can't initialize here or it will not be tree shaken, because
// `LView` constructor could have side-effects.
/**
 * This function clones a blueprint and creates TData.
 *
 * Simple slice will keep the same type, and we need it to be TData
 */
export function cloneToTViewData(list) {
    if (TVIEWDATA_EMPTY === undefined)
        TVIEWDATA_EMPTY = new TViewData();
    return TVIEWDATA_EMPTY.concat(list);
}
export const LViewBlueprint = NG_DEV_MODE && createNamedArrayType('LViewBlueprint') || null;
export const MatchesArray = NG_DEV_MODE && createNamedArrayType('MatchesArray') || null;
export const TViewComponents = NG_DEV_MODE && createNamedArrayType('TViewComponents') || null;
export const TNodeLocalNames = NG_DEV_MODE && createNamedArrayType('TNodeLocalNames') || null;
export const TNodeInitialInputs = NG_DEV_MODE && createNamedArrayType('TNodeInitialInputs') || null;
export const TNodeInitialData = NG_DEV_MODE && createNamedArrayType('TNodeInitialData') || null;
export const LCleanup = NG_DEV_MODE && createNamedArrayType('LCleanup') || null;
export const TCleanup = NG_DEV_MODE && createNamedArrayType('TCleanup') || null;
export function attachLViewDebug(lView) {
    attachDebugObject(lView, new LViewDebug(lView));
}
export function attachLContainerDebug(lContainer) {
    attachDebugObject(lContainer, new LContainerDebug(lContainer));
}
export function toDebug(obj) {
    if (obj) {
        const debug = obj.debug;
        assertDefined(debug, 'Object does not have a debug representation.');
        return debug;
    }
    else {
        return obj;
    }
}
/**
 * Use this method to unwrap a native element in `LView` and convert it into HTML for easier
 * reading.
 *
 * @param value possibly wrapped native DOM node.
 * @param includeChildren If `true` then the serialized HTML form will include child elements
 * (same
 * as `outerHTML`). If `false` then the serialized HTML form will only contain the element
 * itself
 * (will not serialize child elements).
 */
function toHtml(value, includeChildren = false) {
    const node = unwrapRNode(value);
    if (node) {
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                return node.textContent;
            case Node.COMMENT_NODE:
                return `<!--${node.textContent}-->`;
            case Node.ELEMENT_NODE:
                const outerHTML = node.outerHTML;
                if (includeChildren) {
                    return outerHTML;
                }
                else {
                    const innerHTML = '>' + node.innerHTML + '<';
                    return (outerHTML.split(innerHTML)[0]) + '>';
                }
        }
    }
    return null;
}
export class LViewDebug {
    constructor(_raw_lView) {
        this._raw_lView = _raw_lView;
    }
    /**
     * Flags associated with the `LView` unpacked into a more readable state.
     */
    get flags() {
        const flags = this._raw_lView[FLAGS];
        return {
            __raw__flags__: flags,
            initPhaseState: flags & 3 /* InitPhaseStateMask */,
            creationMode: !!(flags & 4 /* CreationMode */),
            firstViewPass: !!(flags & 8 /* FirstLViewPass */),
            checkAlways: !!(flags & 16 /* CheckAlways */),
            dirty: !!(flags & 64 /* Dirty */),
            attached: !!(flags & 128 /* Attached */),
            destroyed: !!(flags & 256 /* Destroyed */),
            isRoot: !!(flags & 512 /* IsRoot */),
            indexWithinInitPhase: flags >> 11 /* IndexWithinInitPhaseShift */,
        };
    }
    get parent() {
        return toDebug(this._raw_lView[PARENT]);
    }
    get hostHTML() {
        return toHtml(this._raw_lView[HOST], true);
    }
    get html() {
        return (this.nodes || []).map(mapToHTML).join('');
    }
    get context() {
        return this._raw_lView[CONTEXT];
    }
    /**
     * The tree of nodes associated with the current `LView`. The nodes have been normalized into
     * a tree structure with relevant details pulled out for readability.
     */
    get nodes() {
        const lView = this._raw_lView;
        const tNode = lView[TVIEW].firstChild;
        return toDebugNodes(tNode, lView);
    }
    get template() {
        return this.tView.template_;
    }
    get tView() {
        return this._raw_lView[TVIEW];
    }
    get cleanup() {
        return this._raw_lView[CLEANUP];
    }
    get injector() {
        return this._raw_lView[INJECTOR];
    }
    get rendererFactory() {
        return this._raw_lView[RENDERER_FACTORY];
    }
    get renderer() {
        return this._raw_lView[RENDERER];
    }
    get sanitizer() {
        return this._raw_lView[SANITIZER];
    }
    get childHead() {
        return toDebug(this._raw_lView[CHILD_HEAD]);
    }
    get next() {
        return toDebug(this._raw_lView[NEXT]);
    }
    get childTail() {
        return toDebug(this._raw_lView[CHILD_TAIL]);
    }
    get declarationView() {
        return toDebug(this._raw_lView[DECLARATION_VIEW]);
    }
    get queries() {
        return this._raw_lView[QUERIES];
    }
    get tHost() {
        return this._raw_lView[T_HOST];
    }
    get decls() {
        return toLViewRange(this.tView, this._raw_lView, HEADER_OFFSET, this.tView.bindingStartIndex);
    }
    get vars() {
        return toLViewRange(this.tView, this._raw_lView, this.tView.bindingStartIndex, this.tView.expandoStartIndex);
    }
    get expando() {
        return toLViewRange(this.tView, this._raw_lView, this.tView.expandoStartIndex, this._raw_lView.length);
    }
    /**
     * Normalized view of child views (and containers) attached at this location.
     */
    get childViews() {
        const childViews = [];
        let child = this.childHead;
        while (child) {
            childViews.push(child);
            child = child.next;
        }
        return childViews;
    }
}
function mapToHTML(node) {
    if (node.type === 'ElementContainer') {
        return (node.children || []).map(mapToHTML).join('');
    }
    else if (node.type === 'IcuContainer') {
        throw new Error('Not implemented');
    }
    else {
        return toHtml(node.native, true) || '';
    }
}
function toLViewRange(tView, lView, start, end) {
    let content = [];
    for (let index = start; index < end; index++) {
        content.push({ index: index, t: tView.data[index], l: lView[index] });
    }
    return { start: start, end: end, length: end - start, content: content };
}
/**
 * Turns a flat list of nodes into a tree by walking the associated `TNode` tree.
 *
 * @param tNode
 * @param lView
 */
export function toDebugNodes(tNode, lView) {
    if (tNode) {
        const debugNodes = [];
        let tNodeCursor = tNode;
        while (tNodeCursor) {
            debugNodes.push(buildDebugNode(tNodeCursor, lView));
            tNodeCursor = tNodeCursor.next;
        }
        return debugNodes;
    }
    else {
        return [];
    }
}
export function buildDebugNode(tNode, lView) {
    const rawValue = lView[tNode.index];
    const native = unwrapRNode(rawValue);
    const factories = [];
    const instances = [];
    const tView = lView[TVIEW];
    for (let i = tNode.directiveStart; i < tNode.directiveEnd; i++) {
        const def = tView.data[i];
        factories.push(def.type);
        instances.push(lView[i]);
    }
    return {
        html: toHtml(native),
        type: toTNodeTypeAsString(tNode.type),
        tNode,
        native: native,
        children: toDebugNodes(tNode.child, lView),
        factories,
        instances,
        injector: buildNodeInjectorDebug(tNode, tView, lView),
        get injectorResolutionPath() {
            return tNode.debugNodeInjectorPath(lView);
        },
    };
}
function buildNodeInjectorDebug(tNode, tView, lView) {
    const viewProviders = [];
    for (let i = tNode.providerIndexStart_; i < tNode.providerIndexEnd_; i++) {
        viewProviders.push(tView.data[i]);
    }
    const providers = [];
    for (let i = tNode.providerIndexEnd_; i < tNode.directiveEnd; i++) {
        providers.push(tView.data[i]);
    }
    const nodeInjectorDebug = {
        bloom: toBloom(lView, tNode.injectorIndex),
        cumulativeBloom: toBloom(tView.data, tNode.injectorIndex),
        providers,
        viewProviders,
        parentInjectorIndex: lView[tNode.providerIndexStart_ - 1],
    };
    return nodeInjectorDebug;
}
/**
 * Convert a number at `idx` location in `array` into binary representation.
 *
 * @param array
 * @param idx
 */
function binary(array, idx) {
    const value = array[idx];
    // If not a number we print 8 `?` to retain alignment but let user know that it was called on
    // wrong type.
    if (typeof value !== 'number')
        return '????????';
    // We prefix 0s so that we have constant length number
    const text = '00000000' + value.toString(2);
    return text.substring(text.length - 8);
}
/**
 * Convert a bloom filter at location `idx` in `array` into binary representation.
 *
 * @param array
 * @param idx
 */
function toBloom(array, idx) {
    if (idx < 0) {
        return 'NO_NODE_INJECTOR';
    }
    return `${binary(array, idx + 7)}_${binary(array, idx + 6)}_${binary(array, idx + 5)}_${binary(array, idx + 4)}_${binary(array, idx + 3)}_${binary(array, idx + 2)}_${binary(array, idx + 1)}_${binary(array, idx + 0)}`;
}
export class LContainerDebug {
    constructor(_raw_lContainer) {
        this._raw_lContainer = _raw_lContainer;
    }
    get hasTransplantedViews() {
        return this._raw_lContainer[HAS_TRANSPLANTED_VIEWS];
    }
    get views() {
        return this._raw_lContainer.slice(CONTAINER_HEADER_OFFSET)
            .map(toDebug);
    }
    get parent() {
        return toDebug(this._raw_lContainer[PARENT]);
    }
    get movedViews() {
        return this._raw_lContainer[MOVED_VIEWS];
    }
    get host() {
        return this._raw_lContainer[HOST];
    }
    get native() {
        return this._raw_lContainer[NATIVE];
    }
    get next() {
        return toDebug(this._raw_lContainer[NEXT]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFPSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUM3QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDbEUsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHNCQUFzQixFQUFjLFdBQVcsRUFBRSxNQUFNLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUV6SCxPQUFPLEVBQUMsa0JBQWtCLEVBQXFCLE1BQU0sd0JBQXdCLENBQUM7QUFDOUUsT0FBTyxFQUE4SixtQkFBbUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBS3BOLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBRSxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBNkIsTUFBTSx1QkFBdUIsQ0FBQztBQUMzSyxPQUFPLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFhLGdCQUFnQixFQUFtQixLQUFLLEVBQUUsYUFBYSxFQUFZLElBQUksRUFBc0IsUUFBUSxFQUE4SCxJQUFJLEVBQXFCLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQTBCLEtBQUssRUFBb0IsaUJBQWlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN2ZCxPQUFPLEVB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LENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUNELElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsSUFBSSxJQUFJO1FBQ04sT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7U2NoZW1hTWV0YWRhdGF9IGZyb20gJy4uLy4uL21ldGFkYXRhL3NjaGVtYSc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge0tleVZhbHVlQXJyYXl9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2NyZWF0ZU5hbWVkQXJyYXlUeXBlfSBmcm9tICcuLi8uLi91dGlsL25hbWVkX2FycmF5X3R5cGUnO1xuaW1wb3J0IHtpbml0TmdEZXZNb2RlfSBmcm9tICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcbmltcG9ydCB7YXNzZXJ0Tm9kZUluamVjdG9yfSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXRJbmplY3RvckluZGV4LCBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9ufSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTLCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXUywgTkFUSVZFfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0LCBWaWV3UXVlcmllc0Z1bmN0aW9ufSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOT19QQVJFTlRfSU5KRUNUT1IsIE5vZGVJbmplY3Rvck9mZnNldH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5zZXJ0QmVmb3JlSW5kZXgsIFByb3BlcnR5QWxpYXNlcywgVENvbnN0YW50cywgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUgYXMgSVROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVByb3ZpZGVySW5kZXhlcywgVE5vZGVUeXBlLCB0b1ROb2RlVHlwZUFzU3RyaW5nfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTZWxlY3RvckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtMUXVlcmllcywgVFF1ZXJpZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTN9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2dldFRTdHlsaW5nUmFuZ2VOZXh0LCBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSwgZ2V0VFN0eWxpbmdSYW5nZVByZXYsIGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlLCBUU3R5bGluZ0tleSwgVFN0eWxpbmdSYW5nZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgRGVidWdOb2RlLCBERUNMQVJBVElPTl9WSUVXLCBEZXN0cm95SG9va0RhdGEsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIb29rRGF0YSwgSE9TVCwgSG9zdEJpbmRpbmdPcENvZGVzLCBJTkpFQ1RPUiwgTENvbnRhaW5lckRlYnVnIGFzIElMQ29udGFpbmVyRGVidWcsIExWaWV3LCBMVmlld0RlYnVnIGFzIElMVmlld0RlYnVnLCBMVmlld0RlYnVnUmFuZ2UsIExWaWV3RGVidWdSYW5nZUNvbnRlbnQsIExWaWV3RmxhZ3MsIE5FWFQsIE5vZGVJbmplY3RvckRlYnVnLCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBTQU5JVElaRVIsIFRfSE9TVCwgVERhdGEsIFRWaWV3IGFzIElUVmlldywgVFZJRVcsIFRWaWV3LCBUVmlld1R5cGUsIFRWaWV3VHlwZUFzU3RyaW5nfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9ySW5kZXgsIGdldFBhcmVudEluamVjdG9yVmlld30gZnJvbSAnLi4vdXRpbC9pbmplY3Rvcl91dGlscyc7XG5pbXBvcnQge3Vud3JhcFJOb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5jb25zdCBOR19ERVZfTU9ERSA9ICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgISFuZ0Rldk1vZGUpICYmIGluaXROZ0Rldk1vZGUoKSk7XG5cbi8qXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgY29uZGl0aW9uYWxseSBhdHRhY2hlZCBjbGFzc2VzIHdoaWNoIHByb3ZpZGUgaHVtYW4gcmVhZGFibGUgKGRlYnVnKSBsZXZlbFxuICogaW5mb3JtYXRpb24gZm9yIGBMVmlld2AsIGBMQ29udGFpbmVyYCBhbmQgb3RoZXIgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzLiBUaGVzZSBkYXRhIHN0cnVjdHVyZXNcbiAqIGFyZSBzdG9yZWQgaW50ZXJuYWxseSBhcyBhcnJheSB3aGljaCBtYWtlcyBpdCB2ZXJ5IGRpZmZpY3VsdCBkdXJpbmcgZGVidWdnaW5nIHRvIHJlYXNvbiBhYm91dCB0aGVcbiAqIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHN5c3RlbS5cbiAqXG4gKiBQYXRjaGluZyB0aGUgYXJyYXkgd2l0aCBleHRyYSBwcm9wZXJ0eSBkb2VzIGNoYW5nZSB0aGUgYXJyYXkncyBoaWRkZW4gY2xhc3MnIGJ1dCBpdCBkb2VzIG5vdFxuICogY2hhbmdlIHRoZSBjb3N0IG9mIGFjY2VzcywgdGhlcmVmb3JlIHRoaXMgcGF0Y2hpbmcgc2hvdWxkIG5vdCBoYXZlIHNpZ25pZmljYW50IGlmIGFueSBpbXBhY3QgaW5cbiAqIGBuZ0Rldk1vZGVgIG1vZGUuIChzZWU6IGh0dHBzOi8vanNwZXJmLmNvbS9hcnJheS12cy1tb25rZXktcGF0Y2gtYXJyYXkpXG4gKlxuICogU28gaW5zdGVhZCBvZiBzZWVpbmc6XG4gKiBgYGBcbiAqIEFycmF5KDMwKSBbT2JqZWN0LCA2NTksIG51bGwsIOKApl1cbiAqIGBgYFxuICpcbiAqIFlvdSBnZXQgdG8gc2VlOlxuICogYGBgXG4gKiBMVmlld0RlYnVnIHtcbiAqICAgdmlld3M6IFsuLi5dLFxuICogICBmbGFnczoge2F0dGFjaGVkOiB0cnVlLCAuLi59XG4gKiAgIG5vZGVzOiBbXG4gKiAgICAge2h0bWw6ICc8ZGl2IGlkPVwiMTIzXCI+JywgLi4uLCBub2RlczogW1xuICogICAgICAge2h0bWw6ICc8c3Bhbj4nLCAuLi4sIG5vZGVzOiBudWxsfVxuICogICAgIF19XG4gKiAgIF1cbiAqIH1cbiAqIGBgYFxuICovXG5cbmxldCBMVklFV19DT01QT05FTlRfQ0FDSEUhOiBNYXA8c3RyaW5nfG51bGwsIEFycmF5PGFueT4+O1xubGV0IExWSUVXX0VNQkVEREVEX0NBQ0hFITogTWFwPHN0cmluZ3xudWxsLCBBcnJheTxhbnk+PjtcbmxldCBMVklFV19ST09UITogQXJyYXk8YW55PjtcblxuaW50ZXJmYWNlIFRWaWV3RGVidWcgZXh0ZW5kcyBJVFZpZXcge1xuICB0eXBlOiBUVmlld1R5cGU7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgTFZpZXcuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb0xWaWV3RnJvbVRWaWV3Qmx1ZXByaW50KHRWaWV3OiBUVmlldyk6IExWaWV3IHtcbiAgY29uc3QgZGVidWdUVmlldyA9IHRWaWV3IGFzIFRWaWV3RGVidWc7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXdUb0Nsb25lKGRlYnVnVFZpZXcudHlwZSwgdFZpZXcudGVtcGxhdGUgJiYgdFZpZXcudGVtcGxhdGUubmFtZSk7XG4gIHJldHVybiBsVmlldy5jb25jYXQodFZpZXcuYmx1ZXByaW50KSBhcyBhbnk7XG59XG5cbmZ1bmN0aW9uIGdldExWaWV3VG9DbG9uZSh0eXBlOiBUVmlld1R5cGUsIG5hbWU6IHN0cmluZ3xudWxsKTogQXJyYXk8YW55PiB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgVFZpZXdUeXBlLlJvb3Q6XG4gICAgICBpZiAoTFZJRVdfUk9PVCA9PT0gdW5kZWZpbmVkKSBMVklFV19ST09UID0gbmV3IChjcmVhdGVOYW1lZEFycmF5VHlwZSgnTFJvb3RWaWV3JykpKCk7XG4gICAgICByZXR1cm4gTFZJRVdfUk9PVDtcbiAgICBjYXNlIFRWaWV3VHlwZS5Db21wb25lbnQ6XG4gICAgICBpZiAoTFZJRVdfQ09NUE9ORU5UX0NBQ0hFID09PSB1bmRlZmluZWQpIExWSUVXX0NPTVBPTkVOVF9DQUNIRSA9IG5ldyBNYXAoKTtcbiAgICAgIGxldCBjb21wb25lbnRBcnJheSA9IExWSUVXX0NPTVBPTkVOVF9DQUNIRS5nZXQobmFtZSk7XG4gICAgICBpZiAoY29tcG9uZW50QXJyYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnRBcnJheSA9IG5ldyAoY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDb21wb25lbnRWaWV3JyArIG5hbWVTdWZmaXgobmFtZSkpKSgpO1xuICAgICAgICBMVklFV19DT01QT05FTlRfQ0FDSEUuc2V0KG5hbWUsIGNvbXBvbmVudEFycmF5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb21wb25lbnRBcnJheTtcbiAgICBjYXNlIFRWaWV3VHlwZS5FbWJlZGRlZDpcbiAgICAgIGlmIChMVklFV19FTUJFRERFRF9DQUNIRSA9PT0gdW5kZWZpbmVkKSBMVklFV19FTUJFRERFRF9DQUNIRSA9IG5ldyBNYXAoKTtcbiAgICAgIGxldCBlbWJlZGRlZEFycmF5ID0gTFZJRVdfRU1CRURERURfQ0FDSEUuZ2V0KG5hbWUpO1xuICAgICAgaWYgKGVtYmVkZGVkQXJyYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBlbWJlZGRlZEFycmF5ID0gbmV3IChjcmVhdGVOYW1lZEFycmF5VHlwZSgnTEVtYmVkZGVkVmlldycgKyBuYW1lU3VmZml4KG5hbWUpKSkoKTtcbiAgICAgICAgTFZJRVdfRU1CRURERURfQ0FDSEUuc2V0KG5hbWUsIGVtYmVkZGVkQXJyYXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVtYmVkZGVkQXJyYXk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnJlYWNoYWJsZSBjb2RlJyk7XG59XG5cbmZ1bmN0aW9uIG5hbWVTdWZmaXgodGV4dDogc3RyaW5nfG51bGx8dW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKHRleHQgPT0gbnVsbCkgcmV0dXJuICcnO1xuICBjb25zdCBpbmRleCA9IHRleHQubGFzdEluZGV4T2YoJ19UZW1wbGF0ZScpO1xuICByZXR1cm4gJ18nICsgKGluZGV4ID09PSAtMSA/IHRleHQgOiB0ZXh0LnN1YnN0cigwLCBpbmRleCkpO1xufVxuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgYSBkZWJ1ZyB2ZXJzaW9uIG9mIE9iamVjdCBsaXRlcmFsIHNvIHRoYXQgd2UgY2FuIGhhdmUgY29uc3RydWN0b3IgbmFtZSBzaG93IHVwXG4gKiBpblxuICogZGVidWcgdG9vbHMgaW4gbmdEZXZNb2RlLlxuICovXG5leHBvcnQgY29uc3QgVFZpZXdDb25zdHJ1Y3RvciA9IGNsYXNzIFRWaWV3IGltcGxlbWVudHMgSVRWaWV3IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgdHlwZTogVFZpZXdUeXBlLFxuICAgICAgcHVibGljIGJsdWVwcmludDogTFZpZXcsXG4gICAgICBwdWJsaWMgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLFxuICAgICAgcHVibGljIHF1ZXJpZXM6IFRRdWVyaWVzfG51bGwsXG4gICAgICBwdWJsaWMgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPHt9PnxudWxsLFxuICAgICAgcHVibGljIGRlY2xUTm9kZTogSVROb2RlfG51bGwsXG4gICAgICBwdWJsaWMgZGF0YTogVERhdGEsXG4gICAgICBwdWJsaWMgYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgIHB1YmxpYyBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgcHVibGljIGhvc3RCaW5kaW5nT3BDb2RlczogSG9zdEJpbmRpbmdPcENvZGVzfG51bGwsXG4gICAgICBwdWJsaWMgZmlyc3RDcmVhdGVQYXNzOiBib29sZWFuLFxuICAgICAgcHVibGljIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBzdGF0aWNWaWV3UXVlcmllczogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBwcmVPcmRlckhvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgcHVibGljIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgIHB1YmxpYyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICBwdWJsaWMgY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICBwdWJsaWMgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgcHVibGljIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgcHVibGljIGRlc3Ryb3lIb29rczogRGVzdHJveUhvb2tEYXRhfG51bGwsXG4gICAgICBwdWJsaWMgY2xlYW51cDogYW55W118bnVsbCxcbiAgICAgIHB1YmxpYyBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbCxcbiAgICAgIHB1YmxpYyBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsLFxuICAgICAgcHVibGljIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGwsXG4gICAgICBwdWJsaWMgcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsLFxuICAgICAgcHVibGljIGZpcnN0Q2hpbGQ6IElUTm9kZXxudWxsLFxuICAgICAgcHVibGljIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICAgIHB1YmxpYyBjb25zdHM6IFRDb25zdGFudHN8bnVsbCxcbiAgICAgIHB1YmxpYyBpbmNvbXBsZXRlRmlyc3RQYXNzOiBib29sZWFuLFxuICAgICAgcHVibGljIF9kZWNsczogbnVtYmVyLFxuICAgICAgcHVibGljIF92YXJzOiBudW1iZXIsXG5cbiAgKSB7fVxuXG4gIGdldCB0ZW1wbGF0ZV8oKTogc3RyaW5nIHtcbiAgICBjb25zdCBidWY6IHN0cmluZ1tdID0gW107XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5maXJzdENoaWxkLCBidWYpO1xuICAgIHJldHVybiBidWYuam9pbignJyk7XG4gIH1cblxuICBnZXQgdHlwZV8oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gVFZpZXdUeXBlQXNTdHJpbmdbdGhpcy50eXBlXSB8fCBgVFZpZXdUeXBlLj8ke3RoaXMudHlwZX0/YDtcbiAgfVxufTtcblxuY2xhc3MgVE5vZGUgaW1wbGVtZW50cyBJVE5vZGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyB0Vmlld186IFRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHR5cGU6IFROb2RlVHlwZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbnNlcnRCZWZvcmVJbmRleDogSW5zZXJ0QmVmb3JlSW5kZXgsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluamVjdG9ySW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlU3RhcnQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVFbmQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZVN0eWxpbmdMYXN0OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvcGVydHlCaW5kaW5nczogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBmbGFnczogVE5vZGVGbGFncywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmFsdWU6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBhdHRyczogKHN0cmluZ3xBdHRyaWJ1dGVNYXJrZXJ8KHN0cmluZ3xTZWxlY3RvckZsYWdzKVtdKVtdfG51bGwsICAgICAgICAvL1xuICAgICAgcHVibGljIG1lcmdlZEF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbCwgIC8vXG4gICAgICBwdWJsaWMgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbml0aWFsSW5wdXRzOiAoc3RyaW5nW118bnVsbClbXXxudWxsfHVuZGVmaW5lZCwgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIG5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvamVjdGlvbk5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjaGlsZDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvamVjdGlvbjogbnVtYmVyfChJVE5vZGV8Uk5vZGVbXSlbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdHlsZXM6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0eWxlc1dpdGhvdXRIb3N0OiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcmVzaWR1YWxTdHlsZXM6IEtleVZhbHVlQXJyYXk8YW55Pnx1bmRlZmluZWR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGFzc2VzOiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsYXNzZXNXaXRob3V0SG9zdDogc3RyaW5nfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcmVzaWR1YWxDbGFzc2VzOiBLZXlWYWx1ZUFycmF5PGFueT58dW5kZWZpbmVkfG51bGwsICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGFzc0JpbmRpbmdzOiBUU3R5bGluZ1JhbmdlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0eWxlQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICkge31cblxuICAvKipcbiAgICogUmV0dXJuIGEgaHVtYW4gZGVidWcgdmVyc2lvbiBvZiB0aGUgc2V0IG9mIGBOb2RlSW5qZWN0b3JgcyB3aGljaCB3aWxsIGJlIGNvbnN1bHRlZCB3aGVuXG4gICAqIHJlc29sdmluZyB0b2tlbnMgZnJvbSB0aGlzIGBUTm9kZWAuXG4gICAqXG4gICAqIFdoZW4gZGVidWdnaW5nIGFwcGxpY2F0aW9ucywgaXQgaXMgb2Z0ZW4gZGlmZmljdWx0IHRvIGRldGVybWluZSB3aGljaCBgTm9kZUluamVjdG9yYHMgd2lsbCBiZVxuICAgKiBjb25zdWx0ZWQuIFRoaXMgbWV0aG9kIHNob3dzIGEgbGlzdCBvZiBgRGVidWdOb2RlYHMgcmVwcmVzZW50aW5nIHRoZSBgVE5vZGVgcyB3aGljaCB3aWxsIGJlXG4gICAqIGNvbnN1bHRlZCBpbiBvcmRlciB3aGVuIHJlc29sdmluZyBhIHRva2VuIHN0YXJ0aW5nIGF0IHRoaXMgYFROb2RlYC5cbiAgICpcbiAgICogVGhlIG9yaWdpbmFsIGRhdGEgaXMgc3RvcmVkIGluIGBMVmlld2AgYW5kIGBUVmlld2Agd2l0aCBhIGxvdCBvZiBvZmZzZXQgaW5kZXhlcywgYW5kIHNvIGl0IGlzXG4gICAqIGRpZmZpY3VsdCB0byByZWFzb24gYWJvdXQuXG4gICAqXG4gICAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCBpbnN0YW5jZSBmb3IgdGhpcyBgVE5vZGVgLlxuICAgKi9cbiAgZGVidWdOb2RlSW5qZWN0b3JQYXRoKGxWaWV3OiBMVmlldyk6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBwYXRoOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIGxldCBpbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0aGlzLCBsVmlldyk7XG4gICAgaWYgKGluamVjdG9ySW5kZXggPT09IC0xKSB7XG4gICAgICAvLyBMb29rcyBsaWtlIHRoZSBjdXJyZW50IGBUTm9kZWAgZG9lcyBub3QgaGF2ZSBgTm9kZUluamVjdG9yYCBhc3NvY2lhdGVkIHdpdGggaXQgPT4gbG9vayBmb3JcbiAgICAgIC8vIHBhcmVudCBOb2RlSW5qZWN0b3IuXG4gICAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odGhpcywgbFZpZXcpO1xuICAgICAgaWYgKHBhcmVudExvY2F0aW9uICE9PSBOT19QQVJFTlRfSU5KRUNUT1IpIHtcbiAgICAgICAgLy8gV2UgZm91bmQgYSBwYXJlbnQsIHNvIHN0YXJ0IHNlYXJjaGluZyBmcm9tIHRoZSBwYXJlbnQgbG9jYXRpb24uXG4gICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgbFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5vIHBhcmVudHMgaGF2ZSBiZWVuIGZvdW5kLCBzbyB0aGVyZSBhcmUgbm8gYE5vZGVJbmplY3RvcmBzIHRvIGNvbnN1bHQuXG4gICAgICB9XG4gICAgfVxuICAgIHdoaWxlIChpbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVJbmplY3RvcihsVmlldywgaW5qZWN0b3JJbmRleCk7XG4gICAgICBjb25zdCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFROb2RlO1xuICAgICAgcGF0aC5wdXNoKGJ1aWxkRGVidWdOb2RlKHROb2RlLCBsVmlldykpO1xuICAgICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBsVmlld1tpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlBBUkVOVF07XG4gICAgICBpZiAocGFyZW50TG9jYXRpb24gPT09IE5PX1BBUkVOVF9JTkpFQ1RPUikge1xuICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICAgIGxWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXRoO1xuICB9XG5cbiAgZ2V0IHR5cGVfKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRvVE5vZGVUeXBlQXNTdHJpbmcodGhpcy50eXBlKSB8fCBgVE5vZGVUeXBlLj8ke3RoaXMudHlwZX0/YDtcbiAgfVxuXG4gIGdldCBmbGFnc18oKTogc3RyaW5nIHtcbiAgICBjb25zdCBmbGFnczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeSkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnknKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3QpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNEaXJlY3RpdmVIb3N0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzRGV0YWNoZWQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNEZXRhY2hlZCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc1Byb2plY3RlZCcpO1xuICAgIHJldHVybiBmbGFncy5qb2luKCd8Jyk7XG4gIH1cblxuICBnZXQgdGVtcGxhdGVfKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMudHlwZSAmIFROb2RlVHlwZS5UZXh0KSByZXR1cm4gdGhpcy52YWx1ZSE7XG4gICAgY29uc3QgYnVmOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHRhZ05hbWUgPSB0eXBlb2YgdGhpcy52YWx1ZSA9PT0gJ3N0cmluZycgJiYgdGhpcy52YWx1ZSB8fCB0aGlzLnR5cGVfO1xuICAgIGJ1Zi5wdXNoKCc8JywgdGFnTmFtZSk7XG4gICAgaWYgKHRoaXMuZmxhZ3MpIHtcbiAgICAgIGJ1Zi5wdXNoKCcgJywgdGhpcy5mbGFnc18pO1xuICAgIH1cbiAgICBpZiAodGhpcy5hdHRycykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmF0dHJzLmxlbmd0aDspIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGJ1Zi5wdXNoKCcgJywgYXR0ck5hbWUgYXMgc3RyaW5nLCAnPVwiJywgYXR0clZhbHVlIGFzIHN0cmluZywgJ1wiJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGJ1Zi5wdXNoKCc+Jyk7XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5jaGlsZCwgYnVmKTtcbiAgICBidWYucHVzaCgnPC8nLCB0YWdOYW1lLCAnPicpO1xuICAgIHJldHVybiBidWYuam9pbignJyk7XG4gIH1cblxuICBnZXQgc3R5bGVCaW5kaW5nc18oKTogRGVidWdTdHlsZUJpbmRpbmdzIHtcbiAgICByZXR1cm4gdG9EZWJ1Z1N0eWxlQmluZGluZyh0aGlzLCBmYWxzZSk7XG4gIH1cbiAgZ2V0IGNsYXNzQmluZGluZ3NfKCk6IERlYnVnU3R5bGVCaW5kaW5ncyB7XG4gICAgcmV0dXJuIHRvRGVidWdTdHlsZUJpbmRpbmcodGhpcywgdHJ1ZSk7XG4gIH1cblxuICBnZXQgcHJvdmlkZXJJbmRleFN0YXJ0XygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICB9XG4gIGdldCBwcm92aWRlckluZGV4RW5kXygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVySW5kZXhTdGFydF8gK1xuICAgICAgICAodGhpcy5wcm92aWRlckluZGV4ZXMgPj4+IFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0KTtcbiAgfVxufVxuZXhwb3J0IGNvbnN0IFROb2RlRGVidWcgPSBUTm9kZTtcbmV4cG9ydCB0eXBlIFROb2RlRGVidWcgPSBUTm9kZTtcblxuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxlQmluZGluZ3MgZXh0ZW5kc1xuICAgIEFycmF5PEtleVZhbHVlQXJyYXk8YW55PnxEZWJ1Z1N0eWxlQmluZGluZ3xzdHJpbmd8bnVsbD4ge31cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsZUJpbmRpbmcge1xuICBrZXk6IFRTdHlsaW5nS2V5O1xuICBpbmRleDogbnVtYmVyO1xuICBpc1RlbXBsYXRlOiBib29sZWFuO1xuICBwcmV2RHVwbGljYXRlOiBib29sZWFuO1xuICBuZXh0RHVwbGljYXRlOiBib29sZWFuO1xuICBwcmV2SW5kZXg6IG51bWJlcjtcbiAgbmV4dEluZGV4OiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHRvRGVidWdTdHlsZUJpbmRpbmcodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBEZWJ1Z1N0eWxlQmluZGluZ3Mge1xuICBjb25zdCB0RGF0YSA9IHROb2RlLnRWaWV3Xy5kYXRhO1xuICBjb25zdCBiaW5kaW5nczogRGVidWdTdHlsZUJpbmRpbmdzID0gW10gYXMgYW55O1xuICBjb25zdCByYW5nZSA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBjb25zdCBwcmV2ID0gZ2V0VFN0eWxpbmdSYW5nZVByZXYocmFuZ2UpO1xuICBjb25zdCBuZXh0ID0gZ2V0VFN0eWxpbmdSYW5nZU5leHQocmFuZ2UpO1xuICBsZXQgaXNUZW1wbGF0ZSA9IG5leHQgIT09IDA7XG4gIGxldCBjdXJzb3IgPSBpc1RlbXBsYXRlID8gbmV4dCA6IHByZXY7XG4gIHdoaWxlIChjdXJzb3IgIT09IDApIHtcbiAgICBjb25zdCBpdGVtS2V5ID0gdERhdGFbY3Vyc29yXSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCBpdGVtUmFuZ2UgPSB0RGF0YVtjdXJzb3IgKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICAgIGJpbmRpbmdzLnVuc2hpZnQoe1xuICAgICAga2V5OiBpdGVtS2V5LFxuICAgICAgaW5kZXg6IGN1cnNvcixcbiAgICAgIGlzVGVtcGxhdGU6IGlzVGVtcGxhdGUsXG4gICAgICBwcmV2RHVwbGljYXRlOiBnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZShpdGVtUmFuZ2UpLFxuICAgICAgbmV4dER1cGxpY2F0ZTogZ2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUoaXRlbVJhbmdlKSxcbiAgICAgIG5leHRJbmRleDogZ2V0VFN0eWxpbmdSYW5nZU5leHQoaXRlbVJhbmdlKSxcbiAgICAgIHByZXZJbmRleDogZ2V0VFN0eWxpbmdSYW5nZVByZXYoaXRlbVJhbmdlKSxcbiAgICB9KTtcbiAgICBpZiAoY3Vyc29yID09PSBwcmV2KSBpc1RlbXBsYXRlID0gZmFsc2U7XG4gICAgY3Vyc29yID0gZ2V0VFN0eWxpbmdSYW5nZVByZXYoaXRlbVJhbmdlKTtcbiAgfVxuICBiaW5kaW5ncy5wdXNoKChpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcykgfHwgbnVsbCk7XG4gIHJldHVybiBiaW5kaW5ncztcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odE5vZGU6IElUTm9kZXxudWxsLCBidWY6IHN0cmluZ1tdKSB7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGJ1Zi5wdXNoKCh0Tm9kZSBhcyBhbnkgYXMge3RlbXBsYXRlXzogc3RyaW5nfSkudGVtcGxhdGVfKTtcbiAgICB0Tm9kZSA9IHROb2RlLm5leHQ7XG4gIH1cbn1cblxuY29uc3QgVFZpZXdEYXRhID0gTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3RGF0YScpIHx8IG51bGwhIGFzIEFycmF5Q29uc3RydWN0b3I7XG5sZXQgVFZJRVdEQVRBX0VNUFRZOiB1bmtub3duW107ICAvLyBjYW4ndCBpbml0aWFsaXplIGhlcmUgb3IgaXQgd2lsbCBub3QgYmUgdHJlZSBzaGFrZW4sIGJlY2F1c2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGBMVmlld2AgY29uc3RydWN0b3IgY291bGQgaGF2ZSBzaWRlLWVmZmVjdHMuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gY2xvbmVzIGEgYmx1ZXByaW50IGFuZCBjcmVhdGVzIFREYXRhLlxuICpcbiAqIFNpbXBsZSBzbGljZSB3aWxsIGtlZXAgdGhlIHNhbWUgdHlwZSwgYW5kIHdlIG5lZWQgaXQgdG8gYmUgVERhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb25lVG9UVmlld0RhdGEobGlzdDogYW55W10pOiBURGF0YSB7XG4gIGlmIChUVklFV0RBVEFfRU1QVFkgPT09IHVuZGVmaW5lZCkgVFZJRVdEQVRBX0VNUFRZID0gbmV3IFRWaWV3RGF0YSgpO1xuICByZXR1cm4gVFZJRVdEQVRBX0VNUFRZLmNvbmNhdChsaXN0KSBhcyBhbnk7XG59XG5cbmV4cG9ydCBjb25zdCBMVmlld0JsdWVwcmludCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xWaWV3Qmx1ZXByaW50JykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBNYXRjaGVzQXJyYXkgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdNYXRjaGVzQXJyYXknKSB8fCBudWxsISBhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFRWaWV3Q29tcG9uZW50cyA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3Q29tcG9uZW50cycpIHx8IG51bGwhIGFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVE5vZGVMb2NhbE5hbWVzID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVE5vZGVMb2NhbE5hbWVzJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUTm9kZUluaXRpYWxJbnB1dHMgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxJbnB1dHMnKSB8fCBudWxsISBhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFROb2RlSW5pdGlhbERhdGEgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxEYXRhJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBMQ2xlYW51cCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDbGVhbnVwJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUQ2xlYW51cCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RDbGVhbnVwJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChsVmlldywgbmV3IExWaWV3RGVidWcobFZpZXcpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxDb250YWluZXIsIG5ldyBMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3KTogSUxWaWV3RGVidWc7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3fG51bGwpOiBJTFZpZXdEZWJ1Z3xudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlld3xMQ29udGFpbmVyfG51bGwpOiBJTFZpZXdEZWJ1Z3xJTENvbnRhaW5lckRlYnVnfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IGFueSk6IGFueSB7XG4gIGlmIChvYmopIHtcbiAgICBjb25zdCBkZWJ1ZyA9IChvYmogYXMgYW55KS5kZWJ1ZztcbiAgICBhc3NlcnREZWZpbmVkKGRlYnVnLCAnT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBkZWJ1ZyByZXByZXNlbnRhdGlvbi4nKTtcbiAgICByZXR1cm4gZGVidWc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxufVxuXG4vKipcbiAqIFVzZSB0aGlzIG1ldGhvZCB0byB1bndyYXAgYSBuYXRpdmUgZWxlbWVudCBpbiBgTFZpZXdgIGFuZCBjb252ZXJ0IGl0IGludG8gSFRNTCBmb3IgZWFzaWVyXG4gKiByZWFkaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBwb3NzaWJseSB3cmFwcGVkIG5hdGl2ZSBET00gbm9kZS5cbiAqIEBwYXJhbSBpbmNsdWRlQ2hpbGRyZW4gSWYgYHRydWVgIHRoZW4gdGhlIHNlcmlhbGl6ZWQgSFRNTCBmb3JtIHdpbGwgaW5jbHVkZSBjaGlsZCBlbGVtZW50c1xuICogKHNhbWVcbiAqIGFzIGBvdXRlckhUTUxgKS4gSWYgYGZhbHNlYCB0aGVuIHRoZSBzZXJpYWxpemVkIEhUTUwgZm9ybSB3aWxsIG9ubHkgY29udGFpbiB0aGUgZWxlbWVudFxuICogaXRzZWxmXG4gKiAod2lsbCBub3Qgc2VyaWFsaXplIGNoaWxkIGVsZW1lbnRzKS5cbiAqL1xuZnVuY3Rpb24gdG9IdG1sKHZhbHVlOiBhbnksIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlOiBOb2RlfG51bGwgPSB1bndyYXBSTm9kZSh2YWx1ZSkgYXMgYW55O1xuICBpZiAobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS5ub2RlVHlwZSkge1xuICAgICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgICAgcmV0dXJuIG5vZGUudGV4dENvbnRlbnQ7XG4gICAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICByZXR1cm4gYDwhLS0keyhub2RlIGFzIENvbW1lbnQpLnRleHRDb250ZW50fS0tPmA7XG4gICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICBjb25zdCBvdXRlckhUTUwgPSAobm9kZSBhcyBFbGVtZW50KS5vdXRlckhUTUw7XG4gICAgICAgIGlmIChpbmNsdWRlQ2hpbGRyZW4pIHtcbiAgICAgICAgICByZXR1cm4gb3V0ZXJIVE1MO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGlubmVySFRNTCA9ICc+JyArIChub2RlIGFzIEVsZW1lbnQpLmlubmVySFRNTCArICc8JztcbiAgICAgICAgICByZXR1cm4gKG91dGVySFRNTC5zcGxpdChpbm5lckhUTUwpWzBdKSArICc+JztcbiAgICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIExWaWV3RGVidWcgaW1wbGVtZW50cyBJTFZpZXdEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3Jhd19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEZsYWdzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYExWaWV3YCB1bnBhY2tlZCBpbnRvIGEgbW9yZSByZWFkYWJsZSBzdGF0ZS5cbiAgICovXG4gIGdldCBmbGFncygpIHtcbiAgICBjb25zdCBmbGFncyA9IHRoaXMuX3Jhd19sVmlld1tGTEFHU107XG4gICAgcmV0dXJuIHtcbiAgICAgIF9fcmF3X19mbGFnc19fOiBmbGFncyxcbiAgICAgIGluaXRQaGFzZVN0YXRlOiBmbGFncyAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrLFxuICAgICAgY3JlYXRpb25Nb2RlOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSxcbiAgICAgIGZpcnN0Vmlld1Bhc3M6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyksXG4gICAgICBjaGVja0Fsd2F5czogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSxcbiAgICAgIGRpcnR5OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRGlydHkpLFxuICAgICAgYXR0YWNoZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5BdHRhY2hlZCksXG4gICAgICBkZXN0cm95ZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpLFxuICAgICAgaXNSb290OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuSXNSb290KSxcbiAgICAgIGluZGV4V2l0aGluSW5pdFBoYXNlOiBmbGFncyA+PiBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlU2hpZnQsXG4gICAgfTtcbiAgfVxuICBnZXQgcGFyZW50KCk6IElMVmlld0RlYnVnfElMQ29udGFpbmVyRGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W1BBUkVOVF0pO1xuICB9XG4gIGdldCBob3N0SFRNTCgpOiBzdHJpbmd8bnVsbCB7XG4gICAgcmV0dXJuIHRvSHRtbCh0aGlzLl9yYXdfbFZpZXdbSE9TVF0sIHRydWUpO1xuICB9XG4gIGdldCBodG1sKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICh0aGlzLm5vZGVzIHx8IFtdKS5tYXAobWFwVG9IVE1MKS5qb2luKCcnKTtcbiAgfVxuICBnZXQgY29udGV4dCgpOiB7fXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0NPTlRFWFRdO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgdHJlZSBvZiBub2RlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYExWaWV3YC4gVGhlIG5vZGVzIGhhdmUgYmVlbiBub3JtYWxpemVkIGludG9cbiAgICogYSB0cmVlIHN0cnVjdHVyZSB3aXRoIHJlbGV2YW50IGRldGFpbHMgcHVsbGVkIG91dCBmb3IgcmVhZGFiaWxpdHkuXG4gICAqL1xuICBnZXQgbm9kZXMoKTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5fcmF3X2xWaWV3O1xuICAgIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgcmV0dXJuIHRvRGVidWdOb2Rlcyh0Tm9kZSwgbFZpZXcpO1xuICB9XG4gIGdldCB0ZW1wbGF0ZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiAodGhpcy50VmlldyBhcyBhbnkgYXMge3RlbXBsYXRlXzogc3RyaW5nfSkudGVtcGxhdGVfO1xuICB9XG4gIGdldCB0VmlldygpOiBJVFZpZXcge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbVFZJRVddO1xuICB9XG4gIGdldCBjbGVhbnVwKCk6IGFueVtdfG51bGwge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQ0xFQU5VUF07XG4gIH1cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yfG51bGwge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbSU5KRUNUT1JdO1xuICB9XG4gIGdldCByZW5kZXJlckZhY3RvcnkoKTogUmVuZGVyZXJGYWN0b3J5MyB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgfVxuICBnZXQgcmVuZGVyZXIoKTogUmVuZGVyZXIzIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1JFTkRFUkVSXTtcbiAgfVxuICBnZXQgc2FuaXRpemVyKCk6IFNhbml0aXplcnxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1NBTklUSVpFUl07XG4gIH1cbiAgZ2V0IGNoaWxkSGVhZCgpOiBJTFZpZXdEZWJ1Z3xJTENvbnRhaW5lckRlYnVnfG51bGwge1xuICAgIHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tDSElMRF9IRUFEXSk7XG4gIH1cbiAgZ2V0IG5leHQoKTogSUxWaWV3RGVidWd8SUxDb250YWluZXJEZWJ1Z3xudWxsIHtcbiAgICByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbTkVYVF0pO1xuICB9XG4gIGdldCBjaGlsZFRhaWwoKTogSUxWaWV3RGVidWd8SUxDb250YWluZXJEZWJ1Z3xudWxsIHtcbiAgICByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbQ0hJTERfVEFJTF0pO1xuICB9XG4gIGdldCBkZWNsYXJhdGlvblZpZXcoKTogSUxWaWV3RGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddKTtcbiAgfVxuICBnZXQgcXVlcmllcygpOiBMUXVlcmllc3xudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1FVRVJJRVNdO1xuICB9XG4gIGdldCB0SG9zdCgpOiBJVE5vZGV8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tUX0hPU1RdO1xuICB9XG5cbiAgZ2V0IGRlY2xzKCk6IExWaWV3RGVidWdSYW5nZSB7XG4gICAgcmV0dXJuIHRvTFZpZXdSYW5nZSh0aGlzLnRWaWV3LCB0aGlzLl9yYXdfbFZpZXcsIEhFQURFUl9PRkZTRVQsIHRoaXMudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgpO1xuICB9XG5cbiAgZ2V0IHZhcnMoKTogTFZpZXdEZWJ1Z1JhbmdlIHtcbiAgICByZXR1cm4gdG9MVmlld1JhbmdlKFxuICAgICAgICB0aGlzLnRWaWV3LCB0aGlzLl9yYXdfbFZpZXcsIHRoaXMudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsIHRoaXMudFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICB9XG5cbiAgZ2V0IGV4cGFuZG8oKTogTFZpZXdEZWJ1Z1JhbmdlIHtcbiAgICByZXR1cm4gdG9MVmlld1JhbmdlKFxuICAgICAgICB0aGlzLnRWaWV3LCB0aGlzLl9yYXdfbFZpZXcsIHRoaXMudFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXgsIHRoaXMuX3Jhd19sVmlldy5sZW5ndGgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZWQgdmlldyBvZiBjaGlsZCB2aWV3cyAoYW5kIGNvbnRhaW5lcnMpIGF0dGFjaGVkIGF0IHRoaXMgbG9jYXRpb24uXG4gICAqL1xuICBnZXQgY2hpbGRWaWV3cygpOiBBcnJheTxJTFZpZXdEZWJ1Z3xJTENvbnRhaW5lckRlYnVnPiB7XG4gICAgY29uc3QgY2hpbGRWaWV3czogQXJyYXk8SUxWaWV3RGVidWd8SUxDb250YWluZXJEZWJ1Zz4gPSBbXTtcbiAgICBsZXQgY2hpbGQgPSB0aGlzLmNoaWxkSGVhZDtcbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIGNoaWxkVmlld3MucHVzaChjaGlsZCk7XG4gICAgICBjaGlsZCA9IGNoaWxkLm5leHQ7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZFZpZXdzO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hcFRvSFRNTChub2RlOiBEZWJ1Z05vZGUpOiBzdHJpbmcge1xuICBpZiAobm9kZS50eXBlID09PSAnRWxlbWVudENvbnRhaW5lcicpIHtcbiAgICByZXR1cm4gKG5vZGUuY2hpbGRyZW4gfHwgW10pLm1hcChtYXBUb0hUTUwpLmpvaW4oJycpO1xuICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gJ0ljdUNvbnRhaW5lcicpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0b0h0bWwobm9kZS5uYXRpdmUsIHRydWUpIHx8ICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvTFZpZXdSYW5nZSh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpOiBMVmlld0RlYnVnUmFuZ2Uge1xuICBsZXQgY29udGVudDogTFZpZXdEZWJ1Z1JhbmdlQ29udGVudFtdID0gW107XG4gIGZvciAobGV0IGluZGV4ID0gc3RhcnQ7IGluZGV4IDwgZW5kOyBpbmRleCsrKSB7XG4gICAgY29udGVudC5wdXNoKHtpbmRleDogaW5kZXgsIHQ6IHRWaWV3LmRhdGFbaW5kZXhdLCBsOiBsVmlld1tpbmRleF19KTtcbiAgfVxuICByZXR1cm4ge3N0YXJ0OiBzdGFydCwgZW5kOiBlbmQsIGxlbmd0aDogZW5kIC0gc3RhcnQsIGNvbnRlbnQ6IGNvbnRlbnR9O1xufVxuXG4vKipcbiAqIFR1cm5zIGEgZmxhdCBsaXN0IG9mIG5vZGVzIGludG8gYSB0cmVlIGJ5IHdhbGtpbmcgdGhlIGFzc29jaWF0ZWQgYFROb2RlYCB0cmVlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnTm9kZXModE5vZGU6IElUTm9kZXxudWxsLCBsVmlldzogTFZpZXcpOiBEZWJ1Z05vZGVbXSB7XG4gIGlmICh0Tm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgbGV0IHROb2RlQ3Vyc29yOiBJVE5vZGV8bnVsbCA9IHROb2RlO1xuICAgIHdoaWxlICh0Tm9kZUN1cnNvcikge1xuICAgICAgZGVidWdOb2Rlcy5wdXNoKGJ1aWxkRGVidWdOb2RlKHROb2RlQ3Vyc29yLCBsVmlldykpO1xuICAgICAgdE5vZGVDdXJzb3IgPSB0Tm9kZUN1cnNvci5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gZGVidWdOb2RlcztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRGVidWdOb2RlKHROb2RlOiBJVE5vZGUsIGxWaWV3OiBMVmlldyk6IERlYnVnTm9kZSB7XG4gIGNvbnN0IHJhd1ZhbHVlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShyYXdWYWx1ZSk7XG4gIGNvbnN0IGZhY3RvcmllczogVHlwZTxhbnk+W10gPSBbXTtcbiAgY29uc3QgaW5zdGFuY2VzOiBhbnlbXSA9IFtdO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0OyBpIDwgdE5vZGUuZGlyZWN0aXZlRW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGZhY3Rvcmllcy5wdXNoKGRlZi50eXBlKTtcbiAgICBpbnN0YW5jZXMucHVzaChsVmlld1tpXSk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBodG1sOiB0b0h0bWwobmF0aXZlKSxcbiAgICB0eXBlOiB0b1ROb2RlVHlwZUFzU3RyaW5nKHROb2RlLnR5cGUpLFxuICAgIHROb2RlLFxuICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSxcbiAgICBjaGlsZHJlbjogdG9EZWJ1Z05vZGVzKHROb2RlLmNoaWxkLCBsVmlldyksXG4gICAgZmFjdG9yaWVzLFxuICAgIGluc3RhbmNlcyxcbiAgICBpbmplY3RvcjogYnVpbGROb2RlSW5qZWN0b3JEZWJ1Zyh0Tm9kZSwgdFZpZXcsIGxWaWV3KSxcbiAgICBnZXQgaW5qZWN0b3JSZXNvbHV0aW9uUGF0aCgpIHtcbiAgICAgIHJldHVybiAodE5vZGUgYXMgVE5vZGUpLmRlYnVnTm9kZUluamVjdG9yUGF0aChsVmlldyk7XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gYnVpbGROb2RlSW5qZWN0b3JEZWJ1Zyh0Tm9kZTogSVROb2RlLCB0VmlldzogSVRWaWV3LCBsVmlldzogTFZpZXcpOiBOb2RlSW5qZWN0b3JEZWJ1ZyB7XG4gIGNvbnN0IHZpZXdQcm92aWRlcnM6IFR5cGU8YW55PltdID0gW107XG4gIGZvciAobGV0IGkgPSAodE5vZGUgYXMgVE5vZGUpLnByb3ZpZGVySW5kZXhTdGFydF87IGkgPCAodE5vZGUgYXMgVE5vZGUpLnByb3ZpZGVySW5kZXhFbmRfOyBpKyspIHtcbiAgICB2aWV3UHJvdmlkZXJzLnB1c2godFZpZXcuZGF0YVtpXSBhcyBUeXBlPGFueT4pO1xuICB9XG4gIGNvbnN0IHByb3ZpZGVyczogVHlwZTxhbnk+W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9ICh0Tm9kZSBhcyBUTm9kZSkucHJvdmlkZXJJbmRleEVuZF87IGkgPCAodE5vZGUgYXMgVE5vZGUpLmRpcmVjdGl2ZUVuZDsgaSsrKSB7XG4gICAgcHJvdmlkZXJzLnB1c2godFZpZXcuZGF0YVtpXSBhcyBUeXBlPGFueT4pO1xuICB9XG4gIGNvbnN0IG5vZGVJbmplY3RvckRlYnVnID0ge1xuICAgIGJsb29tOiB0b0Jsb29tKGxWaWV3LCB0Tm9kZS5pbmplY3RvckluZGV4KSxcbiAgICBjdW11bGF0aXZlQmxvb206IHRvQmxvb20odFZpZXcuZGF0YSwgdE5vZGUuaW5qZWN0b3JJbmRleCksXG4gICAgcHJvdmlkZXJzLFxuICAgIHZpZXdQcm92aWRlcnMsXG4gICAgcGFyZW50SW5qZWN0b3JJbmRleDogbFZpZXdbKHROb2RlIGFzIFROb2RlKS5wcm92aWRlckluZGV4U3RhcnRfIC0gMV0sXG4gIH07XG4gIHJldHVybiBub2RlSW5qZWN0b3JEZWJ1Zztcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgbnVtYmVyIGF0IGBpZHhgIGxvY2F0aW9uIGluIGBhcnJheWAgaW50byBiaW5hcnkgcmVwcmVzZW50YXRpb24uXG4gKlxuICogQHBhcmFtIGFycmF5XG4gKiBAcGFyYW0gaWR4XG4gKi9cbmZ1bmN0aW9uIGJpbmFyeShhcnJheTogYW55W10sIGlkeDogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgdmFsdWUgPSBhcnJheVtpZHhdO1xuICAvLyBJZiBub3QgYSBudW1iZXIgd2UgcHJpbnQgOCBgP2AgdG8gcmV0YWluIGFsaWdubWVudCBidXQgbGV0IHVzZXIga25vdyB0aGF0IGl0IHdhcyBjYWxsZWQgb25cbiAgLy8gd3JvbmcgdHlwZS5cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHJldHVybiAnPz8/Pz8/Pz8nO1xuICAvLyBXZSBwcmVmaXggMHMgc28gdGhhdCB3ZSBoYXZlIGNvbnN0YW50IGxlbmd0aCBudW1iZXJcbiAgY29uc3QgdGV4dCA9ICcwMDAwMDAwMCcgKyB2YWx1ZS50b1N0cmluZygyKTtcbiAgcmV0dXJuIHRleHQuc3Vic3RyaW5nKHRleHQubGVuZ3RoIC0gOCk7XG59XG5cbi8qKlxuICogQ29udmVydCBhIGJsb29tIGZpbHRlciBhdCBsb2NhdGlvbiBgaWR4YCBpbiBgYXJyYXlgIGludG8gYmluYXJ5IHJlcHJlc2VudGF0aW9uLlxuICpcbiAqIEBwYXJhbSBhcnJheVxuICogQHBhcmFtIGlkeFxuICovXG5mdW5jdGlvbiB0b0Jsb29tKGFycmF5OiBhbnlbXSwgaWR4OiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoaWR4IDwgMCkge1xuICAgIHJldHVybiAnTk9fTk9ERV9JTkpFQ1RPUic7XG4gIH1cbiAgcmV0dXJuIGAke2JpbmFyeShhcnJheSwgaWR4ICsgNyl9XyR7YmluYXJ5KGFycmF5LCBpZHggKyA2KX1fJHtiaW5hcnkoYXJyYXksIGlkeCArIDUpfV8ke1xuICAgICAgYmluYXJ5KGFycmF5LCBpZHggKyA0KX1fJHtiaW5hcnkoYXJyYXksIGlkeCArIDMpfV8ke2JpbmFyeShhcnJheSwgaWR4ICsgMil9XyR7XG4gICAgICBiaW5hcnkoYXJyYXksIGlkeCArIDEpfV8ke2JpbmFyeShhcnJheSwgaWR4ICsgMCl9YDtcbn1cblxuZXhwb3J0IGNsYXNzIExDb250YWluZXJEZWJ1ZyBpbXBsZW1lbnRzIElMQ29udGFpbmVyRGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbENvbnRhaW5lcjogTENvbnRhaW5lcikge31cblxuICBnZXQgaGFzVHJhbnNwbGFudGVkVmlld3MoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW0hBU19UUkFOU1BMQU5URURfVklFV1NdO1xuICB9XG4gIGdldCB2aWV3cygpOiBJTFZpZXdEZWJ1Z1tdIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXIuc2xpY2UoQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpXG4gICAgICAgIC5tYXAodG9EZWJ1ZyBhcyAobDogTFZpZXcpID0+IElMVmlld0RlYnVnKTtcbiAgfVxuICBnZXQgcGFyZW50KCk6IElMVmlld0RlYnVnfG51bGwge1xuICAgIHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW1BBUkVOVF0pO1xuICB9XG4gIGdldCBtb3ZlZFZpZXdzKCk6IExWaWV3W118bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW01PVkVEX1ZJRVdTXTtcbiAgfVxuICBnZXQgaG9zdCgpOiBSRWxlbWVudHxSQ29tbWVudHxMVmlldyB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW0hPU1RdO1xuICB9XG4gIGdldCBuYXRpdmUoKTogUkNvbW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltOQVRJVkVdO1xuICB9XG4gIGdldCBuZXh0KCkge1xuICAgIHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW05FWFRdKTtcbiAgfVxufVxuIl19