/**
* @license Angular v11.0.0-next.6+162.sha-170af07
* (c) 2010-2020 Google LLC. https://angular.io/
* License: MIT
*/
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Zone.__load_patch('notification', (global, Zone, api) => {
    const Notification = global['Notification'];
    if (!Notification || !Notification.prototype) {
        return;
    }
    const desc = Object.getOwnPropertyDescriptor(Notification.prototype, 'onerror');
    if (!desc || !desc.configurable) {
        return;
    }
    api.patchOnProperties(Notification.prototype, null);
});
