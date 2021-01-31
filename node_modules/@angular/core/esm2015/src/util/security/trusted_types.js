/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @fileoverview
 * A module to facilitate use of a Trusted Types policy internally within
 * Angular. It lazily constructs the Trusted Types policy, providing helper
 * utilities for promoting strings to Trusted Types. When Trusted Types are not
 * available, strings are used as a fallback.
 * @security All use of this module is security-sensitive and should go through
 * security review.
 */
import { global } from '../global';
/**
 * The Trusted Types policy, or null if Trusted Types are not
 * enabled/supported, or undefined if the policy has not been created yet.
 */
let policy;
/**
 * Returns the Trusted Types policy, or null if Trusted Types are not
 * enabled/supported. The first call to this function will create the policy.
 */
function getPolicy() {
    if (policy === undefined) {
        policy = null;
        if (global.trustedTypes) {
            try {
                policy = global.trustedTypes.createPolicy('angular', {
                    createHTML: (s) => s,
                    createScript: (s) => s,
                    createScriptURL: (s) => s,
                });
            }
            catch (_a) {
                // trustedTypes.createPolicy throws if called with a name that is
                // already registered, even in report-only mode. Until the API changes,
                // catch the error not to break the applications functionally. In such
                // cases, the code will fall back to using strings.
            }
        }
    }
    return policy;
}
/**
 * Unsafely promote a string to a TrustedHTML, falling back to strings when
 * Trusted Types are not available.
 * @security This is a security-sensitive function; any use of this function
 * must go through security review. In particular, it must be assured that the
 * provided string will never cause an XSS vulnerability if used in a context
 * that will be interpreted as HTML by a browser, e.g. when assigning to
 * element.innerHTML.
 */
export function trustedHTMLFromString(html) {
    var _a;
    return ((_a = getPolicy()) === null || _a === void 0 ? void 0 : _a.createHTML(html)) || html;
}
/**
 * Unsafely promote a string to a TrustedScript, falling back to strings when
 * Trusted Types are not available.
 * @security In particular, it must be assured that the provided string will
 * never cause an XSS vulnerability if used in a context that will be
 * interpreted and executed as a script by a browser, e.g. when calling eval.
 */
export function trustedScriptFromString(script) {
    var _a;
    return ((_a = getPolicy()) === null || _a === void 0 ? void 0 : _a.createScript(script)) || script;
}
/**
 * Unsafely promote a string to a TrustedScriptURL, falling back to strings
 * when Trusted Types are not available.
 * @security This is a security-sensitive function; any use of this function
 * must go through security review. In particular, it must be assured that the
 * provided string will never cause an XSS vulnerability if used in a context
 * that will cause a browser to load and execute a resource, e.g. when
 * assigning to script.src.
 */
export function trustedScriptURLFromString(url) {
    var _a;
    return ((_a = getPolicy()) === null || _a === void 0 ? void 0 : _a.createScriptURL(url)) || url;
}
/**
 * Unsafely call the Function constructor with the given string arguments. It
 * is only available in development mode, and should be stripped out of
 * production code.
 * @security This is a security-sensitive function; any use of this function
 * must go through security review. In particular, it must be assured that it
 * is only called from development code, as use in production code can lead to
 * XSS vulnerabilities.
 */
export function newTrustedFunctionForDev(...args) {
    if (typeof ngDevMode === 'undefined') {
        throw new Error('newTrustedFunctionForDev should never be called in production');
    }
    if (!global.trustedTypes) {
        // In environments that don't support Trusted Types, fall back to the most
        // straightforward implementation:
        return new Function(...args);
    }
    // Chrome currently does not support passing TrustedScript to the Function
    // constructor. The following implements the workaround proposed on the page
    // below, where the Chromium bug is also referenced:
    // https://github.com/w3c/webappsec-trusted-types/wiki/Trusted-Types-for-function-constructor
    const fnArgs = args.slice(0, -1).join(',');
    const fnBody = args.pop().toString();
    const body = `(function anonymous(${fnArgs}
) { ${fnBody}
})`;
    // Using eval directly confuses the compiler and prevents this module from
    // being stripped out of JS binaries even if not used. The global['eval']
    // indirection fixes that.
    const fn = global['eval'](trustedScriptFromString(body));
    // To completely mimic the behavior of calling "new Function", two more
    // things need to happen:
    // 1. Stringifying the resulting function should return its source code
    fn.toString = () => body;
    // 2. When calling the resulting function, `this` should refer to `global`
    return fn.bind(global);
    // When Trusted Types support in Function constructors is widely available,
    // the implementation of this function can be simplified to:
    // return new Function(...args.map(a => trustedScriptFromString(a)));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1c3RlZF90eXBlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3V0aWwvc2VjdXJpdHkvdHJ1c3RlZF90eXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7R0FRRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFHakM7OztHQUdHO0FBQ0gsSUFBSSxNQUF3QyxDQUFDO0FBRTdDOzs7R0FHRztBQUNILFNBQVMsU0FBUztJQUNoQixJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7UUFDeEIsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNkLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRTtZQUN2QixJQUFJO2dCQUNGLE1BQU0sR0FBSSxNQUFNLENBQUMsWUFBeUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFO29CQUNqRixVQUFVLEVBQUUsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzVCLFlBQVksRUFBRSxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDOUIsZUFBZSxFQUFFLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2lCQUNsQyxDQUFDLENBQUM7YUFDSjtZQUFDLFdBQU07Z0JBQ04saUVBQWlFO2dCQUNqRSx1RUFBdUU7Z0JBQ3ZFLHNFQUFzRTtnQkFDdEUsbURBQW1EO2FBQ3BEO1NBQ0Y7S0FDRjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxJQUFZOztJQUNoRCxPQUFPLE9BQUEsU0FBUyxFQUFFLDBDQUFFLFVBQVUsQ0FBQyxJQUFJLE1BQUssSUFBSSxDQUFDO0FBQy9DLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsTUFBYzs7SUFDcEQsT0FBTyxPQUFBLFNBQVMsRUFBRSwwQ0FBRSxZQUFZLENBQUMsTUFBTSxNQUFLLE1BQU0sQ0FBQztBQUNyRCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsR0FBVzs7SUFDcEQsT0FBTyxPQUFBLFNBQVMsRUFBRSwwQ0FBRSxlQUFlLENBQUMsR0FBRyxNQUFLLEdBQUcsQ0FBQztBQUNsRCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsR0FBRyxJQUFjO0lBQ3hELElBQUksT0FBTyxTQUFTLEtBQUssV0FBVyxFQUFFO1FBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0RBQStELENBQUMsQ0FBQztLQUNsRjtJQUNELElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFO1FBQ3hCLDBFQUEwRTtRQUMxRSxrQ0FBa0M7UUFDbEMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQzlCO0lBRUQsMEVBQTBFO0lBQzFFLDRFQUE0RTtJQUM1RSxvREFBb0Q7SUFDcEQsNkZBQTZGO0lBQzdGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzNDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN0QyxNQUFNLElBQUksR0FBRyx1QkFBdUIsTUFBTTtNQUN0QyxNQUFNO0dBQ1QsQ0FBQztJQUVGLDBFQUEwRTtJQUMxRSx5RUFBeUU7SUFDekUsMEJBQTBCO0lBQzFCLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQVcsQ0FBYSxDQUFDO0lBRS9FLHVFQUF1RTtJQUN2RSx5QkFBeUI7SUFDekIsdUVBQXVFO0lBQ3ZFLEVBQUUsQ0FBQyxRQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ3pCLDBFQUEwRTtJQUMxRSxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdkIsMkVBQTJFO0lBQzNFLDREQUE0RDtJQUM1RCxxRUFBcUU7QUFDdkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEEgbW9kdWxlIHRvIGZhY2lsaXRhdGUgdXNlIG9mIGEgVHJ1c3RlZCBUeXBlcyBwb2xpY3kgaW50ZXJuYWxseSB3aXRoaW5cbiAqIEFuZ3VsYXIuIEl0IGxhemlseSBjb25zdHJ1Y3RzIHRoZSBUcnVzdGVkIFR5cGVzIHBvbGljeSwgcHJvdmlkaW5nIGhlbHBlclxuICogdXRpbGl0aWVzIGZvciBwcm9tb3Rpbmcgc3RyaW5ncyB0byBUcnVzdGVkIFR5cGVzLiBXaGVuIFRydXN0ZWQgVHlwZXMgYXJlIG5vdFxuICogYXZhaWxhYmxlLCBzdHJpbmdzIGFyZSB1c2VkIGFzIGEgZmFsbGJhY2suXG4gKiBAc2VjdXJpdHkgQWxsIHVzZSBvZiB0aGlzIG1vZHVsZSBpcyBzZWN1cml0eS1zZW5zaXRpdmUgYW5kIHNob3VsZCBnbyB0aHJvdWdoXG4gKiBzZWN1cml0eSByZXZpZXcuXG4gKi9cblxuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL2dsb2JhbCc7XG5pbXBvcnQge1RydXN0ZWRIVE1MLCBUcnVzdGVkU2NyaXB0LCBUcnVzdGVkU2NyaXB0VVJMLCBUcnVzdGVkVHlwZVBvbGljeSwgVHJ1c3RlZFR5cGVQb2xpY3lGYWN0b3J5fSBmcm9tICcuL3RydXN0ZWRfdHlwZV9kZWZzJztcblxuLyoqXG4gKiBUaGUgVHJ1c3RlZCBUeXBlcyBwb2xpY3ksIG9yIG51bGwgaWYgVHJ1c3RlZCBUeXBlcyBhcmUgbm90XG4gKiBlbmFibGVkL3N1cHBvcnRlZCwgb3IgdW5kZWZpbmVkIGlmIHRoZSBwb2xpY3kgaGFzIG5vdCBiZWVuIGNyZWF0ZWQgeWV0LlxuICovXG5sZXQgcG9saWN5OiBUcnVzdGVkVHlwZVBvbGljeXxudWxsfHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBUcnVzdGVkIFR5cGVzIHBvbGljeSwgb3IgbnVsbCBpZiBUcnVzdGVkIFR5cGVzIGFyZSBub3RcbiAqIGVuYWJsZWQvc3VwcG9ydGVkLiBUaGUgZmlyc3QgY2FsbCB0byB0aGlzIGZ1bmN0aW9uIHdpbGwgY3JlYXRlIHRoZSBwb2xpY3kuXG4gKi9cbmZ1bmN0aW9uIGdldFBvbGljeSgpOiBUcnVzdGVkVHlwZVBvbGljeXxudWxsIHtcbiAgaWYgKHBvbGljeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcG9saWN5ID0gbnVsbDtcbiAgICBpZiAoZ2xvYmFsLnRydXN0ZWRUeXBlcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcG9saWN5ID0gKGdsb2JhbC50cnVzdGVkVHlwZXMgYXMgVHJ1c3RlZFR5cGVQb2xpY3lGYWN0b3J5KS5jcmVhdGVQb2xpY3koJ2FuZ3VsYXInLCB7XG4gICAgICAgICAgY3JlYXRlSFRNTDogKHM6IHN0cmluZykgPT4gcyxcbiAgICAgICAgICBjcmVhdGVTY3JpcHQ6IChzOiBzdHJpbmcpID0+IHMsXG4gICAgICAgICAgY3JlYXRlU2NyaXB0VVJMOiAoczogc3RyaW5nKSA9PiBzLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyB0cnVzdGVkVHlwZXMuY3JlYXRlUG9saWN5IHRocm93cyBpZiBjYWxsZWQgd2l0aCBhIG5hbWUgdGhhdCBpc1xuICAgICAgICAvLyBhbHJlYWR5IHJlZ2lzdGVyZWQsIGV2ZW4gaW4gcmVwb3J0LW9ubHkgbW9kZS4gVW50aWwgdGhlIEFQSSBjaGFuZ2VzLFxuICAgICAgICAvLyBjYXRjaCB0aGUgZXJyb3Igbm90IHRvIGJyZWFrIHRoZSBhcHBsaWNhdGlvbnMgZnVuY3Rpb25hbGx5LiBJbiBzdWNoXG4gICAgICAgIC8vIGNhc2VzLCB0aGUgY29kZSB3aWxsIGZhbGwgYmFjayB0byB1c2luZyBzdHJpbmdzLlxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcG9saWN5O1xufVxuXG4vKipcbiAqIFVuc2FmZWx5IHByb21vdGUgYSBzdHJpbmcgdG8gYSBUcnVzdGVkSFRNTCwgZmFsbGluZyBiYWNrIHRvIHN0cmluZ3Mgd2hlblxuICogVHJ1c3RlZCBUeXBlcyBhcmUgbm90IGF2YWlsYWJsZS5cbiAqIEBzZWN1cml0eSBUaGlzIGlzIGEgc2VjdXJpdHktc2Vuc2l0aXZlIGZ1bmN0aW9uOyBhbnkgdXNlIG9mIHRoaXMgZnVuY3Rpb25cbiAqIG11c3QgZ28gdGhyb3VnaCBzZWN1cml0eSByZXZpZXcuIEluIHBhcnRpY3VsYXIsIGl0IG11c3QgYmUgYXNzdXJlZCB0aGF0IHRoZVxuICogcHJvdmlkZWQgc3RyaW5nIHdpbGwgbmV2ZXIgY2F1c2UgYW4gWFNTIHZ1bG5lcmFiaWxpdHkgaWYgdXNlZCBpbiBhIGNvbnRleHRcbiAqIHRoYXQgd2lsbCBiZSBpbnRlcnByZXRlZCBhcyBIVE1MIGJ5IGEgYnJvd3NlciwgZS5nLiB3aGVuIGFzc2lnbmluZyB0b1xuICogZWxlbWVudC5pbm5lckhUTUwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnVzdGVkSFRNTEZyb21TdHJpbmcoaHRtbDogc3RyaW5nKTogVHJ1c3RlZEhUTUx8c3RyaW5nIHtcbiAgcmV0dXJuIGdldFBvbGljeSgpPy5jcmVhdGVIVE1MKGh0bWwpIHx8IGh0bWw7XG59XG5cbi8qKlxuICogVW5zYWZlbHkgcHJvbW90ZSBhIHN0cmluZyB0byBhIFRydXN0ZWRTY3JpcHQsIGZhbGxpbmcgYmFjayB0byBzdHJpbmdzIHdoZW5cbiAqIFRydXN0ZWQgVHlwZXMgYXJlIG5vdCBhdmFpbGFibGUuXG4gKiBAc2VjdXJpdHkgSW4gcGFydGljdWxhciwgaXQgbXVzdCBiZSBhc3N1cmVkIHRoYXQgdGhlIHByb3ZpZGVkIHN0cmluZyB3aWxsXG4gKiBuZXZlciBjYXVzZSBhbiBYU1MgdnVsbmVyYWJpbGl0eSBpZiB1c2VkIGluIGEgY29udGV4dCB0aGF0IHdpbGwgYmVcbiAqIGludGVycHJldGVkIGFuZCBleGVjdXRlZCBhcyBhIHNjcmlwdCBieSBhIGJyb3dzZXIsIGUuZy4gd2hlbiBjYWxsaW5nIGV2YWwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnVzdGVkU2NyaXB0RnJvbVN0cmluZyhzY3JpcHQ6IHN0cmluZyk6IFRydXN0ZWRTY3JpcHR8c3RyaW5nIHtcbiAgcmV0dXJuIGdldFBvbGljeSgpPy5jcmVhdGVTY3JpcHQoc2NyaXB0KSB8fCBzY3JpcHQ7XG59XG5cbi8qKlxuICogVW5zYWZlbHkgcHJvbW90ZSBhIHN0cmluZyB0byBhIFRydXN0ZWRTY3JpcHRVUkwsIGZhbGxpbmcgYmFjayB0byBzdHJpbmdzXG4gKiB3aGVuIFRydXN0ZWQgVHlwZXMgYXJlIG5vdCBhdmFpbGFibGUuXG4gKiBAc2VjdXJpdHkgVGhpcyBpcyBhIHNlY3VyaXR5LXNlbnNpdGl2ZSBmdW5jdGlvbjsgYW55IHVzZSBvZiB0aGlzIGZ1bmN0aW9uXG4gKiBtdXN0IGdvIHRocm91Z2ggc2VjdXJpdHkgcmV2aWV3LiBJbiBwYXJ0aWN1bGFyLCBpdCBtdXN0IGJlIGFzc3VyZWQgdGhhdCB0aGVcbiAqIHByb3ZpZGVkIHN0cmluZyB3aWxsIG5ldmVyIGNhdXNlIGFuIFhTUyB2dWxuZXJhYmlsaXR5IGlmIHVzZWQgaW4gYSBjb250ZXh0XG4gKiB0aGF0IHdpbGwgY2F1c2UgYSBicm93c2VyIHRvIGxvYWQgYW5kIGV4ZWN1dGUgYSByZXNvdXJjZSwgZS5nLiB3aGVuXG4gKiBhc3NpZ25pbmcgdG8gc2NyaXB0LnNyYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRydXN0ZWRTY3JpcHRVUkxGcm9tU3RyaW5nKHVybDogc3RyaW5nKTogVHJ1c3RlZFNjcmlwdFVSTHxzdHJpbmcge1xuICByZXR1cm4gZ2V0UG9saWN5KCk/LmNyZWF0ZVNjcmlwdFVSTCh1cmwpIHx8IHVybDtcbn1cblxuLyoqXG4gKiBVbnNhZmVseSBjYWxsIHRoZSBGdW5jdGlvbiBjb25zdHJ1Y3RvciB3aXRoIHRoZSBnaXZlbiBzdHJpbmcgYXJndW1lbnRzLiBJdFxuICogaXMgb25seSBhdmFpbGFibGUgaW4gZGV2ZWxvcG1lbnQgbW9kZSwgYW5kIHNob3VsZCBiZSBzdHJpcHBlZCBvdXQgb2ZcbiAqIHByb2R1Y3Rpb24gY29kZS5cbiAqIEBzZWN1cml0eSBUaGlzIGlzIGEgc2VjdXJpdHktc2Vuc2l0aXZlIGZ1bmN0aW9uOyBhbnkgdXNlIG9mIHRoaXMgZnVuY3Rpb25cbiAqIG11c3QgZ28gdGhyb3VnaCBzZWN1cml0eSByZXZpZXcuIEluIHBhcnRpY3VsYXIsIGl0IG11c3QgYmUgYXNzdXJlZCB0aGF0IGl0XG4gKiBpcyBvbmx5IGNhbGxlZCBmcm9tIGRldmVsb3BtZW50IGNvZGUsIGFzIHVzZSBpbiBwcm9kdWN0aW9uIGNvZGUgY2FuIGxlYWQgdG9cbiAqIFhTUyB2dWxuZXJhYmlsaXRpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZXdUcnVzdGVkRnVuY3Rpb25Gb3JEZXYoLi4uYXJnczogc3RyaW5nW10pOiBGdW5jdGlvbiB7XG4gIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJykge1xuICAgIHRocm93IG5ldyBFcnJvcignbmV3VHJ1c3RlZEZ1bmN0aW9uRm9yRGV2IHNob3VsZCBuZXZlciBiZSBjYWxsZWQgaW4gcHJvZHVjdGlvbicpO1xuICB9XG4gIGlmICghZ2xvYmFsLnRydXN0ZWRUeXBlcykge1xuICAgIC8vIEluIGVudmlyb25tZW50cyB0aGF0IGRvbid0IHN1cHBvcnQgVHJ1c3RlZCBUeXBlcywgZmFsbCBiYWNrIHRvIHRoZSBtb3N0XG4gICAgLy8gc3RyYWlnaHRmb3J3YXJkIGltcGxlbWVudGF0aW9uOlxuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oLi4uYXJncyk7XG4gIH1cblxuICAvLyBDaHJvbWUgY3VycmVudGx5IGRvZXMgbm90IHN1cHBvcnQgcGFzc2luZyBUcnVzdGVkU2NyaXB0IHRvIHRoZSBGdW5jdGlvblxuICAvLyBjb25zdHJ1Y3Rvci4gVGhlIGZvbGxvd2luZyBpbXBsZW1lbnRzIHRoZSB3b3JrYXJvdW5kIHByb3Bvc2VkIG9uIHRoZSBwYWdlXG4gIC8vIGJlbG93LCB3aGVyZSB0aGUgQ2hyb21pdW0gYnVnIGlzIGFsc28gcmVmZXJlbmNlZDpcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3czYy93ZWJhcHBzZWMtdHJ1c3RlZC10eXBlcy93aWtpL1RydXN0ZWQtVHlwZXMtZm9yLWZ1bmN0aW9uLWNvbnN0cnVjdG9yXG4gIGNvbnN0IGZuQXJncyA9IGFyZ3Muc2xpY2UoMCwgLTEpLmpvaW4oJywnKTtcbiAgY29uc3QgZm5Cb2R5ID0gYXJncy5wb3AoKSEudG9TdHJpbmcoKTtcbiAgY29uc3QgYm9keSA9IGAoZnVuY3Rpb24gYW5vbnltb3VzKCR7Zm5BcmdzfVxuKSB7ICR7Zm5Cb2R5fVxufSlgO1xuXG4gIC8vIFVzaW5nIGV2YWwgZGlyZWN0bHkgY29uZnVzZXMgdGhlIGNvbXBpbGVyIGFuZCBwcmV2ZW50cyB0aGlzIG1vZHVsZSBmcm9tXG4gIC8vIGJlaW5nIHN0cmlwcGVkIG91dCBvZiBKUyBiaW5hcmllcyBldmVuIGlmIG5vdCB1c2VkLiBUaGUgZ2xvYmFsWydldmFsJ11cbiAgLy8gaW5kaXJlY3Rpb24gZml4ZXMgdGhhdC5cbiAgY29uc3QgZm4gPSBnbG9iYWxbJ2V2YWwnXSh0cnVzdGVkU2NyaXB0RnJvbVN0cmluZyhib2R5KSBhcyBzdHJpbmcpIGFzIEZ1bmN0aW9uO1xuXG4gIC8vIFRvIGNvbXBsZXRlbHkgbWltaWMgdGhlIGJlaGF2aW9yIG9mIGNhbGxpbmcgXCJuZXcgRnVuY3Rpb25cIiwgdHdvIG1vcmVcbiAgLy8gdGhpbmdzIG5lZWQgdG8gaGFwcGVuOlxuICAvLyAxLiBTdHJpbmdpZnlpbmcgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIGl0cyBzb3VyY2UgY29kZVxuICBmbi50b1N0cmluZyA9ICgpID0+IGJvZHk7XG4gIC8vIDIuIFdoZW4gY2FsbGluZyB0aGUgcmVzdWx0aW5nIGZ1bmN0aW9uLCBgdGhpc2Agc2hvdWxkIHJlZmVyIHRvIGBnbG9iYWxgXG4gIHJldHVybiBmbi5iaW5kKGdsb2JhbCk7XG5cbiAgLy8gV2hlbiBUcnVzdGVkIFR5cGVzIHN1cHBvcnQgaW4gRnVuY3Rpb24gY29uc3RydWN0b3JzIGlzIHdpZGVseSBhdmFpbGFibGUsXG4gIC8vIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIGZ1bmN0aW9uIGNhbiBiZSBzaW1wbGlmaWVkIHRvOlxuICAvLyByZXR1cm4gbmV3IEZ1bmN0aW9uKC4uLmFyZ3MubWFwKGEgPT4gdHJ1c3RlZFNjcmlwdEZyb21TdHJpbmcoYSkpKTtcbn1cbiJdfQ==