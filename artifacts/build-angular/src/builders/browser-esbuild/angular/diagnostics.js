"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTypeScriptDiagnostic = void 0;
const node_os_1 = require("node:os");
const typescript_1 = require("typescript");
/**
 * Converts TypeScript Diagnostic related information into an esbuild compatible note object.
 * Related information is a subset of a full TypeScript Diagnostic and also used for diagnostic
 * notes associated with the main Diagnostic.
 * @param info The TypeScript diagnostic relative information to convert.
 * @returns An esbuild diagnostic message as a PartialMessage object
 */
function convertTypeScriptDiagnosticInfo(info, textPrefix) {
    const newLine = (0, node_os_1.platform)() === 'win32' ? '\r\n' : '\n';
    let text = (0, typescript_1.flattenDiagnosticMessageText)(info.messageText, newLine);
    if (textPrefix) {
        text = textPrefix + text;
    }
    const note = { text };
    if (info.file) {
        note.location = {
            file: info.file.fileName,
            length: info.length,
        };
        // Calculate the line/column location and extract the full line text that has the diagnostic
        if (info.start) {
            const { line, character } = (0, typescript_1.getLineAndCharacterOfPosition)(info.file, info.start);
            note.location.line = line + 1;
            note.location.column = character;
            // The start position for the slice is the first character of the error line
            const lineStartPosition = (0, typescript_1.getPositionOfLineAndCharacter)(info.file, line, 0);
            // The end position for the slice is the first character of the next line or the length of
            // the entire file if the line is the last line of the file (getPositionOfLineAndCharacter
            // will error if a nonexistent line is passed).
            const { line: lastLineOfFile } = (0, typescript_1.getLineAndCharacterOfPosition)(info.file, info.file.text.length - 1);
            const lineEndPosition = line < lastLineOfFile
                ? (0, typescript_1.getPositionOfLineAndCharacter)(info.file, line + 1, 0)
                : info.file.text.length;
            note.location.lineText = info.file.text.slice(lineStartPosition, lineEndPosition).trimEnd();
        }
    }
    return note;
}
/**
 * Converts a TypeScript Diagnostic message into an esbuild compatible message object.
 * @param diagnostic The TypeScript diagnostic to convert.
 * @returns An esbuild diagnostic message as a PartialMessage object
 */
function convertTypeScriptDiagnostic(diagnostic) {
    let codePrefix = 'TS';
    let code = `${diagnostic.code}`;
    if (diagnostic.source === 'ngtsc') {
        codePrefix = 'NG';
        // Remove `-99` Angular prefix from diagnostic code
        code = code.slice(3);
    }
    const message = {
        ...convertTypeScriptDiagnosticInfo(diagnostic, `${codePrefix}${code}: `),
        // Store original diagnostic for reference if needed downstream
        detail: diagnostic,
    };
    if (diagnostic.relatedInformation?.length) {
        message.notes = diagnostic.relatedInformation.map((info) => convertTypeScriptDiagnosticInfo(info));
    }
    return message;
}
exports.convertTypeScriptDiagnostic = convertTypeScriptDiagnostic;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvYW5ndWxhci9kaWFnbm9zdGljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFHSCxxQ0FBbUM7QUFDbkMsMkNBTW9CO0FBRXBCOzs7Ozs7R0FNRztBQUNILFNBQVMsK0JBQStCLENBQ3RDLElBQWtDLEVBQ2xDLFVBQW1CO0lBRW5CLE1BQU0sT0FBTyxHQUFHLElBQUEsa0JBQVEsR0FBRSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDdkQsSUFBSSxJQUFJLEdBQUcsSUFBQSx5Q0FBNEIsRUFBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ25FLElBQUksVUFBVSxFQUFFO1FBQ2QsSUFBSSxHQUFHLFVBQVUsR0FBRyxJQUFJLENBQUM7S0FDMUI7SUFFRCxNQUFNLElBQUksR0FBZ0IsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUVuQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDYixJQUFJLENBQUMsUUFBUSxHQUFHO1lBQ2QsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUTtZQUN4QixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07U0FDcEIsQ0FBQztRQUVGLDRGQUE0RjtRQUM1RixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZCxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLElBQUEsMENBQTZCLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFFakMsNEVBQTRFO1lBQzVFLE1BQU0saUJBQWlCLEdBQUcsSUFBQSwwQ0FBNkIsRUFBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1RSwwRkFBMEY7WUFDMUYsMEZBQTBGO1lBQzFGLCtDQUErQztZQUMvQyxNQUFNLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxHQUFHLElBQUEsMENBQTZCLEVBQzVELElBQUksQ0FBQyxJQUFJLEVBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FDMUIsQ0FBQztZQUNGLE1BQU0sZUFBZSxHQUNuQixJQUFJLEdBQUcsY0FBYztnQkFDbkIsQ0FBQyxDQUFDLElBQUEsMENBQTZCLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdkQsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUU1QixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDN0Y7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFnQiwyQkFBMkIsQ0FBQyxVQUFzQjtJQUNoRSxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFDdEIsSUFBSSxJQUFJLEdBQUcsR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDaEMsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLE9BQU8sRUFBRTtRQUNqQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLG1EQUFtRDtRQUNuRCxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0QjtJQUVELE1BQU0sT0FBTyxHQUFtQjtRQUM5QixHQUFHLCtCQUErQixDQUFDLFVBQVUsRUFBRSxHQUFHLFVBQVUsR0FBRyxJQUFJLElBQUksQ0FBQztRQUN4RSwrREFBK0Q7UUFDL0QsTUFBTSxFQUFFLFVBQVU7S0FDbkIsQ0FBQztJQUVGLElBQUksVUFBVSxDQUFDLGtCQUFrQixFQUFFLE1BQU0sRUFBRTtRQUN6QyxPQUFPLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUN6RCwrQkFBK0IsQ0FBQyxJQUFJLENBQUMsQ0FDdEMsQ0FBQztLQUNIO0lBRUQsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQXRCRCxrRUFzQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBQYXJ0aWFsTWVzc2FnZSwgUGFydGlhbE5vdGUgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCB7IHBsYXRmb3JtIH0gZnJvbSAnbm9kZTpvcyc7XG5pbXBvcnQge1xuICBEaWFnbm9zdGljLFxuICBEaWFnbm9zdGljUmVsYXRlZEluZm9ybWF0aW9uLFxuICBmbGF0dGVuRGlhZ25vc3RpY01lc3NhZ2VUZXh0LFxuICBnZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbixcbiAgZ2V0UG9zaXRpb25PZkxpbmVBbmRDaGFyYWN0ZXIsXG59IGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKipcbiAqIENvbnZlcnRzIFR5cGVTY3JpcHQgRGlhZ25vc3RpYyByZWxhdGVkIGluZm9ybWF0aW9uIGludG8gYW4gZXNidWlsZCBjb21wYXRpYmxlIG5vdGUgb2JqZWN0LlxuICogUmVsYXRlZCBpbmZvcm1hdGlvbiBpcyBhIHN1YnNldCBvZiBhIGZ1bGwgVHlwZVNjcmlwdCBEaWFnbm9zdGljIGFuZCBhbHNvIHVzZWQgZm9yIGRpYWdub3N0aWNcbiAqIG5vdGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgbWFpbiBEaWFnbm9zdGljLlxuICogQHBhcmFtIGluZm8gVGhlIFR5cGVTY3JpcHQgZGlhZ25vc3RpYyByZWxhdGl2ZSBpbmZvcm1hdGlvbiB0byBjb252ZXJ0LlxuICogQHJldHVybnMgQW4gZXNidWlsZCBkaWFnbm9zdGljIG1lc3NhZ2UgYXMgYSBQYXJ0aWFsTWVzc2FnZSBvYmplY3RcbiAqL1xuZnVuY3Rpb24gY29udmVydFR5cGVTY3JpcHREaWFnbm9zdGljSW5mbyhcbiAgaW5mbzogRGlhZ25vc3RpY1JlbGF0ZWRJbmZvcm1hdGlvbixcbiAgdGV4dFByZWZpeD86IHN0cmluZyxcbik6IFBhcnRpYWxOb3RlIHtcbiAgY29uc3QgbmV3TGluZSA9IHBsYXRmb3JtKCkgPT09ICd3aW4zMicgPyAnXFxyXFxuJyA6ICdcXG4nO1xuICBsZXQgdGV4dCA9IGZsYXR0ZW5EaWFnbm9zdGljTWVzc2FnZVRleHQoaW5mby5tZXNzYWdlVGV4dCwgbmV3TGluZSk7XG4gIGlmICh0ZXh0UHJlZml4KSB7XG4gICAgdGV4dCA9IHRleHRQcmVmaXggKyB0ZXh0O1xuICB9XG5cbiAgY29uc3Qgbm90ZTogUGFydGlhbE5vdGUgPSB7IHRleHQgfTtcblxuICBpZiAoaW5mby5maWxlKSB7XG4gICAgbm90ZS5sb2NhdGlvbiA9IHtcbiAgICAgIGZpbGU6IGluZm8uZmlsZS5maWxlTmFtZSxcbiAgICAgIGxlbmd0aDogaW5mby5sZW5ndGgsXG4gICAgfTtcblxuICAgIC8vIENhbGN1bGF0ZSB0aGUgbGluZS9jb2x1bW4gbG9jYXRpb24gYW5kIGV4dHJhY3QgdGhlIGZ1bGwgbGluZSB0ZXh0IHRoYXQgaGFzIHRoZSBkaWFnbm9zdGljXG4gICAgaWYgKGluZm8uc3RhcnQpIHtcbiAgICAgIGNvbnN0IHsgbGluZSwgY2hhcmFjdGVyIH0gPSBnZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihpbmZvLmZpbGUsIGluZm8uc3RhcnQpO1xuICAgICAgbm90ZS5sb2NhdGlvbi5saW5lID0gbGluZSArIDE7XG4gICAgICBub3RlLmxvY2F0aW9uLmNvbHVtbiA9IGNoYXJhY3RlcjtcblxuICAgICAgLy8gVGhlIHN0YXJ0IHBvc2l0aW9uIGZvciB0aGUgc2xpY2UgaXMgdGhlIGZpcnN0IGNoYXJhY3RlciBvZiB0aGUgZXJyb3IgbGluZVxuICAgICAgY29uc3QgbGluZVN0YXJ0UG9zaXRpb24gPSBnZXRQb3NpdGlvbk9mTGluZUFuZENoYXJhY3RlcihpbmZvLmZpbGUsIGxpbmUsIDApO1xuXG4gICAgICAvLyBUaGUgZW5kIHBvc2l0aW9uIGZvciB0aGUgc2xpY2UgaXMgdGhlIGZpcnN0IGNoYXJhY3RlciBvZiB0aGUgbmV4dCBsaW5lIG9yIHRoZSBsZW5ndGggb2ZcbiAgICAgIC8vIHRoZSBlbnRpcmUgZmlsZSBpZiB0aGUgbGluZSBpcyB0aGUgbGFzdCBsaW5lIG9mIHRoZSBmaWxlIChnZXRQb3NpdGlvbk9mTGluZUFuZENoYXJhY3RlclxuICAgICAgLy8gd2lsbCBlcnJvciBpZiBhIG5vbmV4aXN0ZW50IGxpbmUgaXMgcGFzc2VkKS5cbiAgICAgIGNvbnN0IHsgbGluZTogbGFzdExpbmVPZkZpbGUgfSA9IGdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKFxuICAgICAgICBpbmZvLmZpbGUsXG4gICAgICAgIGluZm8uZmlsZS50ZXh0Lmxlbmd0aCAtIDEsXG4gICAgICApO1xuICAgICAgY29uc3QgbGluZUVuZFBvc2l0aW9uID1cbiAgICAgICAgbGluZSA8IGxhc3RMaW5lT2ZGaWxlXG4gICAgICAgICAgPyBnZXRQb3NpdGlvbk9mTGluZUFuZENoYXJhY3RlcihpbmZvLmZpbGUsIGxpbmUgKyAxLCAwKVxuICAgICAgICAgIDogaW5mby5maWxlLnRleHQubGVuZ3RoO1xuXG4gICAgICBub3RlLmxvY2F0aW9uLmxpbmVUZXh0ID0gaW5mby5maWxlLnRleHQuc2xpY2UobGluZVN0YXJ0UG9zaXRpb24sIGxpbmVFbmRQb3NpdGlvbikudHJpbUVuZCgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBub3RlO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgVHlwZVNjcmlwdCBEaWFnbm9zdGljIG1lc3NhZ2UgaW50byBhbiBlc2J1aWxkIGNvbXBhdGlibGUgbWVzc2FnZSBvYmplY3QuXG4gKiBAcGFyYW0gZGlhZ25vc3RpYyBUaGUgVHlwZVNjcmlwdCBkaWFnbm9zdGljIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyBBbiBlc2J1aWxkIGRpYWdub3N0aWMgbWVzc2FnZSBhcyBhIFBhcnRpYWxNZXNzYWdlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udmVydFR5cGVTY3JpcHREaWFnbm9zdGljKGRpYWdub3N0aWM6IERpYWdub3N0aWMpOiBQYXJ0aWFsTWVzc2FnZSB7XG4gIGxldCBjb2RlUHJlZml4ID0gJ1RTJztcbiAgbGV0IGNvZGUgPSBgJHtkaWFnbm9zdGljLmNvZGV9YDtcbiAgaWYgKGRpYWdub3N0aWMuc291cmNlID09PSAnbmd0c2MnKSB7XG4gICAgY29kZVByZWZpeCA9ICdORyc7XG4gICAgLy8gUmVtb3ZlIGAtOTlgIEFuZ3VsYXIgcHJlZml4IGZyb20gZGlhZ25vc3RpYyBjb2RlXG4gICAgY29kZSA9IGNvZGUuc2xpY2UoMyk7XG4gIH1cblxuICBjb25zdCBtZXNzYWdlOiBQYXJ0aWFsTWVzc2FnZSA9IHtcbiAgICAuLi5jb252ZXJ0VHlwZVNjcmlwdERpYWdub3N0aWNJbmZvKGRpYWdub3N0aWMsIGAke2NvZGVQcmVmaXh9JHtjb2RlfTogYCksXG4gICAgLy8gU3RvcmUgb3JpZ2luYWwgZGlhZ25vc3RpYyBmb3IgcmVmZXJlbmNlIGlmIG5lZWRlZCBkb3duc3RyZWFtXG4gICAgZGV0YWlsOiBkaWFnbm9zdGljLFxuICB9O1xuXG4gIGlmIChkaWFnbm9zdGljLnJlbGF0ZWRJbmZvcm1hdGlvbj8ubGVuZ3RoKSB7XG4gICAgbWVzc2FnZS5ub3RlcyA9IGRpYWdub3N0aWMucmVsYXRlZEluZm9ybWF0aW9uLm1hcCgoaW5mbykgPT5cbiAgICAgIGNvbnZlcnRUeXBlU2NyaXB0RGlhZ25vc3RpY0luZm8oaW5mbyksXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBtZXNzYWdlO1xufVxuIl19