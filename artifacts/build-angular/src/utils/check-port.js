"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPort = void 0;
const net = __importStar(require("net"));
const tty_1 = require("./tty");
function createInUseError(port) {
    return new Error(`Port ${port} is already in use. Use '--port' to specify a different port.`);
}
async function checkPort(port, host) {
    if (port === 0) {
        return 0;
    }
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server
            .once('error', (err) => {
            if (err.code !== 'EADDRINUSE') {
                reject(err);
                return;
            }
            if (!tty_1.isTTY) {
                reject(createInUseError(port));
                return;
            }
            Promise.resolve().then(() => __importStar(require('inquirer'))).then(({ prompt }) => prompt({
                type: 'confirm',
                name: 'useDifferent',
                message: `Port ${port} is already in use.\nWould you like to use a different port?`,
                default: true,
            }))
                .then((answers) => (answers.useDifferent ? resolve(0) : reject(createInUseError(port))), () => reject(createInUseError(port)));
        })
            .once('listening', () => {
            server.close();
            resolve(port);
        })
            .listen(port, host);
    });
}
exports.checkPort = checkPort;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2stcG9ydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL2NoZWNrLXBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx5Q0FBMkI7QUFDM0IsK0JBQThCO0FBRTlCLFNBQVMsZ0JBQWdCLENBQUMsSUFBWTtJQUNwQyxPQUFPLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSwrREFBK0QsQ0FBQyxDQUFDO0FBQ2hHLENBQUM7QUFFTSxLQUFLLFVBQVUsU0FBUyxDQUFDLElBQVksRUFBRSxJQUFZO0lBQ3hELElBQUksSUFBSSxLQUFLLENBQUMsRUFBRTtRQUNkLE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7SUFFRCxPQUFPLElBQUksT0FBTyxDQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQzdDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUVsQyxNQUFNO2FBQ0gsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQTBCLEVBQUUsRUFBRTtZQUM1QyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssWUFBWSxFQUFFO2dCQUM3QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBRVosT0FBTzthQUNSO1lBRUQsSUFBSSxDQUFDLFdBQUssRUFBRTtnQkFDVixNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFFL0IsT0FBTzthQUNSO1lBRUQsa0RBQU8sVUFBVSxJQUNkLElBQUksQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUNuQixNQUFNLENBQUM7Z0JBQ0wsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLE9BQU8sRUFBRSxRQUFRLElBQUksOERBQThEO2dCQUNuRixPQUFPLEVBQUUsSUFBSTthQUNkLENBQUMsQ0FDSDtpQkFDQSxJQUFJLENBQ0gsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNqRixHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDckMsQ0FBQztRQUNOLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBQ3RCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQixDQUFDLENBQUM7YUFDRCxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQTFDRCw4QkEwQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgbmV0IGZyb20gJ25ldCc7XG5pbXBvcnQgeyBpc1RUWSB9IGZyb20gJy4vdHR5JztcblxuZnVuY3Rpb24gY3JlYXRlSW5Vc2VFcnJvcihwb3J0OiBudW1iZXIpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoYFBvcnQgJHtwb3J0fSBpcyBhbHJlYWR5IGluIHVzZS4gVXNlICctLXBvcnQnIHRvIHNwZWNpZnkgYSBkaWZmZXJlbnQgcG9ydC5gKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrUG9ydChwb3J0OiBudW1iZXIsIGhvc3Q6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gIGlmIChwb3J0ID09PSAwKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2U8bnVtYmVyPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3Qgc2VydmVyID0gbmV0LmNyZWF0ZVNlcnZlcigpO1xuXG4gICAgc2VydmVyXG4gICAgICAub25jZSgnZXJyb3InLCAoZXJyOiBOb2RlSlMuRXJybm9FeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKGVyci5jb2RlICE9PSAnRUFERFJJTlVTRScpIHtcbiAgICAgICAgICByZWplY3QoZXJyKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXNUVFkpIHtcbiAgICAgICAgICByZWplY3QoY3JlYXRlSW5Vc2VFcnJvcihwb3J0KSk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpbXBvcnQoJ2lucXVpcmVyJylcbiAgICAgICAgICAudGhlbigoeyBwcm9tcHQgfSkgPT5cbiAgICAgICAgICAgIHByb21wdCh7XG4gICAgICAgICAgICAgIHR5cGU6ICdjb25maXJtJyxcbiAgICAgICAgICAgICAgbmFtZTogJ3VzZURpZmZlcmVudCcsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGBQb3J0ICR7cG9ydH0gaXMgYWxyZWFkeSBpbiB1c2UuXFxuV291bGQgeW91IGxpa2UgdG8gdXNlIGEgZGlmZmVyZW50IHBvcnQ/YCxcbiAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgICAudGhlbihcbiAgICAgICAgICAgIChhbnN3ZXJzKSA9PiAoYW5zd2Vycy51c2VEaWZmZXJlbnQgPyByZXNvbHZlKDApIDogcmVqZWN0KGNyZWF0ZUluVXNlRXJyb3IocG9ydCkpKSxcbiAgICAgICAgICAgICgpID0+IHJlamVjdChjcmVhdGVJblVzZUVycm9yKHBvcnQpKSxcbiAgICAgICAgICApO1xuICAgICAgfSlcbiAgICAgIC5vbmNlKCdsaXN0ZW5pbmcnLCAoKSA9PiB7XG4gICAgICAgIHNlcnZlci5jbG9zZSgpO1xuICAgICAgICByZXNvbHZlKHBvcnQpO1xuICAgICAgfSlcbiAgICAgIC5saXN0ZW4ocG9ydCwgaG9zdCk7XG4gIH0pO1xufVxuIl19