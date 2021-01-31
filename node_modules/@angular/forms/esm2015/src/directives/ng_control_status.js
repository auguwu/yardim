/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Optional, Self } from '@angular/core';
import { ControlContainer } from './control_container';
import { NgControl } from './ng_control';
export class AbstractControlStatus {
    constructor(cd) {
        this._cd = cd;
    }
    get ngClassUntouched() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._cd) === null || _a === void 0 ? void 0 : _a.control) === null || _b === void 0 ? void 0 : _b.untouched) !== null && _c !== void 0 ? _c : false;
    }
    get ngClassTouched() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._cd) === null || _a === void 0 ? void 0 : _a.control) === null || _b === void 0 ? void 0 : _b.touched) !== null && _c !== void 0 ? _c : false;
    }
    get ngClassPristine() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._cd) === null || _a === void 0 ? void 0 : _a.control) === null || _b === void 0 ? void 0 : _b.pristine) !== null && _c !== void 0 ? _c : false;
    }
    get ngClassDirty() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._cd) === null || _a === void 0 ? void 0 : _a.control) === null || _b === void 0 ? void 0 : _b.dirty) !== null && _c !== void 0 ? _c : false;
    }
    get ngClassValid() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._cd) === null || _a === void 0 ? void 0 : _a.control) === null || _b === void 0 ? void 0 : _b.valid) !== null && _c !== void 0 ? _c : false;
    }
    get ngClassInvalid() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._cd) === null || _a === void 0 ? void 0 : _a.control) === null || _b === void 0 ? void 0 : _b.invalid) !== null && _c !== void 0 ? _c : false;
    }
    get ngClassPending() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this._cd) === null || _a === void 0 ? void 0 : _a.control) === null || _b === void 0 ? void 0 : _b.pending) !== null && _c !== void 0 ? _c : false;
    }
}
export const ngControlStatusHost = {
    '[class.ng-untouched]': 'ngClassUntouched',
    '[class.ng-touched]': 'ngClassTouched',
    '[class.ng-pristine]': 'ngClassPristine',
    '[class.ng-dirty]': 'ngClassDirty',
    '[class.ng-valid]': 'ngClassValid',
    '[class.ng-invalid]': 'ngClassInvalid',
    '[class.ng-pending]': 'ngClassPending',
};
/**
 * @description
 * Directive automatically applied to Angular form controls that sets CSS classes
 * based on control status.
 *
 * @usageNotes
 *
 * ### CSS classes applied
 *
 * The following classes are applied as the properties become true:
 *
 * * ng-valid
 * * ng-invalid
 * * ng-pending
 * * ng-pristine
 * * ng-dirty
 * * ng-untouched
 * * ng-touched
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export class NgControlStatus extends AbstractControlStatus {
    constructor(cd) {
        super(cd);
    }
}
NgControlStatus.decorators = [
    { type: Directive, args: [{ selector: '[formControlName],[ngModel],[formControl]', host: ngControlStatusHost },] }
];
NgControlStatus.ctorParameters = () => [
    { type: NgControl, decorators: [{ type: Self }] }
];
/**
 * @description
 * Directive automatically applied to Angular form groups that sets CSS classes
 * based on control status (valid/invalid/dirty/etc).
 *
 * @see `NgControlStatus`
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export class NgControlStatusGroup extends AbstractControlStatus {
    constructor(cd) {
        super(cd);
    }
}
NgControlStatusGroup.decorators = [
    { type: Directive, args: [{
                selector: '[formGroupName],[formArrayName],[ngModelGroup],[formGroup],form:not([ngNoForm]),[ngForm]',
                host: ngControlStatusHost
            },] }
];
NgControlStatusGroup.ctorParameters = () => [
    { type: ControlContainer, decorators: [{ type: Optional }, { type: Self }] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfY29udHJvbF9zdGF0dXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9mb3Jtcy9zcmMvZGlyZWN0aXZlcy9uZ19jb250cm9sX3N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHeEQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUV2QyxNQUFNLE9BQU8scUJBQXFCO0lBR2hDLFlBQVksRUFBaUM7UUFDM0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELElBQUksZ0JBQWdCOztRQUNsQix5QkFBTyxJQUFJLENBQUMsR0FBRywwQ0FBRSxPQUFPLDBDQUFFLFNBQVMsbUNBQUksS0FBSyxDQUFDO0lBQy9DLENBQUM7SUFDRCxJQUFJLGNBQWM7O1FBQ2hCLHlCQUFPLElBQUksQ0FBQyxHQUFHLDBDQUFFLE9BQU8sMENBQUUsT0FBTyxtQ0FBSSxLQUFLLENBQUM7SUFDN0MsQ0FBQztJQUNELElBQUksZUFBZTs7UUFDakIseUJBQU8sSUFBSSxDQUFDLEdBQUcsMENBQUUsT0FBTywwQ0FBRSxRQUFRLG1DQUFJLEtBQUssQ0FBQztJQUM5QyxDQUFDO0lBQ0QsSUFBSSxZQUFZOztRQUNkLHlCQUFPLElBQUksQ0FBQyxHQUFHLDBDQUFFLE9BQU8sMENBQUUsS0FBSyxtQ0FBSSxLQUFLLENBQUM7SUFDM0MsQ0FBQztJQUNELElBQUksWUFBWTs7UUFDZCx5QkFBTyxJQUFJLENBQUMsR0FBRywwQ0FBRSxPQUFPLDBDQUFFLEtBQUssbUNBQUksS0FBSyxDQUFDO0lBQzNDLENBQUM7SUFDRCxJQUFJLGNBQWM7O1FBQ2hCLHlCQUFPLElBQUksQ0FBQyxHQUFHLDBDQUFFLE9BQU8sMENBQUUsT0FBTyxtQ0FBSSxLQUFLLENBQUM7SUFDN0MsQ0FBQztJQUNELElBQUksY0FBYzs7UUFDaEIseUJBQU8sSUFBSSxDQUFDLEdBQUcsMENBQUUsT0FBTywwQ0FBRSxPQUFPLG1DQUFJLEtBQUssQ0FBQztJQUM3QyxDQUFDO0NBQ0Y7QUFFRCxNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBRztJQUNqQyxzQkFBc0IsRUFBRSxrQkFBa0I7SUFDMUMsb0JBQW9CLEVBQUUsZ0JBQWdCO0lBQ3RDLHFCQUFxQixFQUFFLGlCQUFpQjtJQUN4QyxrQkFBa0IsRUFBRSxjQUFjO0lBQ2xDLGtCQUFrQixFQUFFLGNBQWM7SUFDbEMsb0JBQW9CLEVBQUUsZ0JBQWdCO0lBQ3RDLG9CQUFvQixFQUFFLGdCQUFnQjtDQUN2QyxDQUFDO0FBRUY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUFFSCxNQUFNLE9BQU8sZUFBZ0IsU0FBUSxxQkFBcUI7SUFDeEQsWUFBb0IsRUFBYTtRQUMvQixLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDWixDQUFDOzs7WUFKRixTQUFTLFNBQUMsRUFBQyxRQUFRLEVBQUUsMkNBQTJDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFDOzs7WUFqRXJGLFNBQVMsdUJBbUVGLElBQUk7O0FBS25COzs7Ozs7Ozs7O0dBVUc7QUFNSCxNQUFNLE9BQU8sb0JBQXFCLFNBQVEscUJBQXFCO0lBQzdELFlBQWdDLEVBQW9CO1FBQ2xELEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNaLENBQUM7OztZQVJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQ0osMEZBQTBGO2dCQUM5RixJQUFJLEVBQUUsbUJBQW1CO2FBQzFCOzs7WUF4Rk8sZ0JBQWdCLHVCQTBGVCxRQUFRLFlBQUksSUFBSSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgT3B0aW9uYWwsIFNlbGZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0Fic3RyYWN0Q29udHJvbERpcmVjdGl2ZX0gZnJvbSAnLi9hYnN0cmFjdF9jb250cm9sX2RpcmVjdGl2ZSc7XG5pbXBvcnQge0NvbnRyb2xDb250YWluZXJ9IGZyb20gJy4vY29udHJvbF9jb250YWluZXInO1xuaW1wb3J0IHtOZ0NvbnRyb2x9IGZyb20gJy4vbmdfY29udHJvbCc7XG5cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdENvbnRyb2xTdGF0dXMge1xuICBwcml2YXRlIF9jZDogQWJzdHJhY3RDb250cm9sRGlyZWN0aXZlfG51bGw7XG5cbiAgY29uc3RydWN0b3IoY2Q6IEFic3RyYWN0Q29udHJvbERpcmVjdGl2ZXxudWxsKSB7XG4gICAgdGhpcy5fY2QgPSBjZDtcbiAgfVxuXG4gIGdldCBuZ0NsYXNzVW50b3VjaGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jZD8uY29udHJvbD8udW50b3VjaGVkID8/IGZhbHNlO1xuICB9XG4gIGdldCBuZ0NsYXNzVG91Y2hlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fY2Q/LmNvbnRyb2w/LnRvdWNoZWQgPz8gZmFsc2U7XG4gIH1cbiAgZ2V0IG5nQ2xhc3NQcmlzdGluZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fY2Q/LmNvbnRyb2w/LnByaXN0aW5lID8/IGZhbHNlO1xuICB9XG4gIGdldCBuZ0NsYXNzRGlydHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2NkPy5jb250cm9sPy5kaXJ0eSA/PyBmYWxzZTtcbiAgfVxuICBnZXQgbmdDbGFzc1ZhbGlkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jZD8uY29udHJvbD8udmFsaWQgPz8gZmFsc2U7XG4gIH1cbiAgZ2V0IG5nQ2xhc3NJbnZhbGlkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jZD8uY29udHJvbD8uaW52YWxpZCA/PyBmYWxzZTtcbiAgfVxuICBnZXQgbmdDbGFzc1BlbmRpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2NkPy5jb250cm9sPy5wZW5kaW5nID8/IGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBuZ0NvbnRyb2xTdGF0dXNIb3N0ID0ge1xuICAnW2NsYXNzLm5nLXVudG91Y2hlZF0nOiAnbmdDbGFzc1VudG91Y2hlZCcsXG4gICdbY2xhc3MubmctdG91Y2hlZF0nOiAnbmdDbGFzc1RvdWNoZWQnLFxuICAnW2NsYXNzLm5nLXByaXN0aW5lXSc6ICduZ0NsYXNzUHJpc3RpbmUnLFxuICAnW2NsYXNzLm5nLWRpcnR5XSc6ICduZ0NsYXNzRGlydHknLFxuICAnW2NsYXNzLm5nLXZhbGlkXSc6ICduZ0NsYXNzVmFsaWQnLFxuICAnW2NsYXNzLm5nLWludmFsaWRdJzogJ25nQ2xhc3NJbnZhbGlkJyxcbiAgJ1tjbGFzcy5uZy1wZW5kaW5nXSc6ICduZ0NsYXNzUGVuZGluZycsXG59O1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogRGlyZWN0aXZlIGF1dG9tYXRpY2FsbHkgYXBwbGllZCB0byBBbmd1bGFyIGZvcm0gY29udHJvbHMgdGhhdCBzZXRzIENTUyBjbGFzc2VzXG4gKiBiYXNlZCBvbiBjb250cm9sIHN0YXR1cy5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqICMjIyBDU1MgY2xhc3NlcyBhcHBsaWVkXG4gKlxuICogVGhlIGZvbGxvd2luZyBjbGFzc2VzIGFyZSBhcHBsaWVkIGFzIHRoZSBwcm9wZXJ0aWVzIGJlY29tZSB0cnVlOlxuICpcbiAqICogbmctdmFsaWRcbiAqICogbmctaW52YWxpZFxuICogKiBuZy1wZW5kaW5nXG4gKiAqIG5nLXByaXN0aW5lXG4gKiAqIG5nLWRpcnR5XG4gKiAqIG5nLXVudG91Y2hlZFxuICogKiBuZy10b3VjaGVkXG4gKlxuICogQG5nTW9kdWxlIFJlYWN0aXZlRm9ybXNNb2R1bGVcbiAqIEBuZ01vZHVsZSBGb3Jtc01vZHVsZVxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tmb3JtQ29udHJvbE5hbWVdLFtuZ01vZGVsXSxbZm9ybUNvbnRyb2xdJywgaG9zdDogbmdDb250cm9sU3RhdHVzSG9zdH0pXG5leHBvcnQgY2xhc3MgTmdDb250cm9sU3RhdHVzIGV4dGVuZHMgQWJzdHJhY3RDb250cm9sU3RhdHVzIHtcbiAgY29uc3RydWN0b3IoQFNlbGYoKSBjZDogTmdDb250cm9sKSB7XG4gICAgc3VwZXIoY2QpO1xuICB9XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBEaXJlY3RpdmUgYXV0b21hdGljYWxseSBhcHBsaWVkIHRvIEFuZ3VsYXIgZm9ybSBncm91cHMgdGhhdCBzZXRzIENTUyBjbGFzc2VzXG4gKiBiYXNlZCBvbiBjb250cm9sIHN0YXR1cyAodmFsaWQvaW52YWxpZC9kaXJ0eS9ldGMpLlxuICpcbiAqIEBzZWUgYE5nQ29udHJvbFN0YXR1c2BcbiAqXG4gKiBAbmdNb2R1bGUgUmVhY3RpdmVGb3Jtc01vZHVsZVxuICogQG5nTW9kdWxlIEZvcm1zTW9kdWxlXG4gKiBAcHVibGljQXBpXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjpcbiAgICAgICdbZm9ybUdyb3VwTmFtZV0sW2Zvcm1BcnJheU5hbWVdLFtuZ01vZGVsR3JvdXBdLFtmb3JtR3JvdXBdLGZvcm06bm90KFtuZ05vRm9ybV0pLFtuZ0Zvcm1dJyxcbiAgaG9zdDogbmdDb250cm9sU3RhdHVzSG9zdFxufSlcbmV4cG9ydCBjbGFzcyBOZ0NvbnRyb2xTdGF0dXNHcm91cCBleHRlbmRzIEFic3RyYWN0Q29udHJvbFN0YXR1cyB7XG4gIGNvbnN0cnVjdG9yKEBPcHRpb25hbCgpIEBTZWxmKCkgY2Q6IENvbnRyb2xDb250YWluZXIpIHtcbiAgICBzdXBlcihjZCk7XG4gIH1cbn1cbiJdfQ==