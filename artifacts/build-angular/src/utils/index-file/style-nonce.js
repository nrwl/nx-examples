"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addStyleNonce = void 0;
const html_rewriting_stream_1 = require("./html-rewriting-stream");
/**
 * Pattern matching the name of the Angular nonce attribute. Note that this is
 * case-insensitive, because HTML attribute names are case-insensitive as well.
 */
const NONCE_ATTR_PATTERN = /ngCspNonce/i;
/**
 * Finds the `ngCspNonce` value and copies it to all inline `<style>` tags.
 * @param html Markup that should be processed.
 */
async function addStyleNonce(html) {
    const nonce = await findNonce(html);
    if (!nonce) {
        return html;
    }
    const { rewriter, transformedContent } = await (0, html_rewriting_stream_1.htmlRewritingStream)(html);
    rewriter.on('startTag', (tag) => {
        if (tag.tagName === 'style' && !tag.attrs.some((attr) => attr.name === 'nonce')) {
            tag.attrs.push({ name: 'nonce', value: nonce });
        }
        rewriter.emitStartTag(tag);
    });
    return transformedContent();
}
exports.addStyleNonce = addStyleNonce;
/** Finds the Angular nonce in an HTML string. */
async function findNonce(html) {
    // Inexpensive check to avoid parsing the HTML when we're sure there's no nonce.
    if (!NONCE_ATTR_PATTERN.test(html)) {
        return null;
    }
    const { rewriter, transformedContent } = await (0, html_rewriting_stream_1.htmlRewritingStream)(html);
    let nonce = null;
    rewriter.on('startTag', (tag) => {
        const nonceAttr = tag.attrs.find((attr) => NONCE_ATTR_PATTERN.test(attr.name));
        if (nonceAttr?.value) {
            nonce = nonceAttr.value;
            rewriter.stop(); // Stop parsing since we've found the nonce.
        }
    });
    await transformedContent();
    return nonce;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGUtbm9uY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9pbmRleC1maWxlL3N0eWxlLW5vbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILG1FQUE4RDtBQUU5RDs7O0dBR0c7QUFDSCxNQUFNLGtCQUFrQixHQUFHLGFBQWEsQ0FBQztBQUV6Qzs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsYUFBYSxDQUFDLElBQVk7SUFDOUMsTUFBTSxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFcEMsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNWLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxNQUFNLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLEdBQUcsTUFBTSxJQUFBLDJDQUFtQixFQUFDLElBQUksQ0FBQyxDQUFDO0lBRXpFLFFBQVEsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDOUIsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxFQUFFO1lBQy9FLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUNqRDtRQUVELFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0IsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLGtCQUFrQixFQUFFLENBQUM7QUFDOUIsQ0FBQztBQWxCRCxzQ0FrQkM7QUFFRCxpREFBaUQ7QUFDakQsS0FBSyxVQUFVLFNBQVMsQ0FBQyxJQUFZO0lBQ25DLGdGQUFnRjtJQUNoRixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ2xDLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxNQUFNLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLEdBQUcsTUFBTSxJQUFBLDJDQUFtQixFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pFLElBQUksS0FBSyxHQUFrQixJQUFJLENBQUM7SUFFaEMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUM5QixNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQy9FLElBQUksU0FBUyxFQUFFLEtBQUssRUFBRTtZQUNwQixLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUN4QixRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyw0Q0FBNEM7U0FDOUQ7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztJQUUzQixPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgaHRtbFJld3JpdGluZ1N0cmVhbSB9IGZyb20gJy4vaHRtbC1yZXdyaXRpbmctc3RyZWFtJztcblxuLyoqXG4gKiBQYXR0ZXJuIG1hdGNoaW5nIHRoZSBuYW1lIG9mIHRoZSBBbmd1bGFyIG5vbmNlIGF0dHJpYnV0ZS4gTm90ZSB0aGF0IHRoaXMgaXNcbiAqIGNhc2UtaW5zZW5zaXRpdmUsIGJlY2F1c2UgSFRNTCBhdHRyaWJ1dGUgbmFtZXMgYXJlIGNhc2UtaW5zZW5zaXRpdmUgYXMgd2VsbC5cbiAqL1xuY29uc3QgTk9OQ0VfQVRUUl9QQVRURVJOID0gL25nQ3NwTm9uY2UvaTtcblxuLyoqXG4gKiBGaW5kcyB0aGUgYG5nQ3NwTm9uY2VgIHZhbHVlIGFuZCBjb3BpZXMgaXQgdG8gYWxsIGlubGluZSBgPHN0eWxlPmAgdGFncy5cbiAqIEBwYXJhbSBodG1sIE1hcmt1cCB0aGF0IHNob3VsZCBiZSBwcm9jZXNzZWQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRTdHlsZU5vbmNlKGh0bWw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IG5vbmNlID0gYXdhaXQgZmluZE5vbmNlKGh0bWwpO1xuXG4gIGlmICghbm9uY2UpIHtcbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuXG4gIGNvbnN0IHsgcmV3cml0ZXIsIHRyYW5zZm9ybWVkQ29udGVudCB9ID0gYXdhaXQgaHRtbFJld3JpdGluZ1N0cmVhbShodG1sKTtcblxuICByZXdyaXRlci5vbignc3RhcnRUYWcnLCAodGFnKSA9PiB7XG4gICAgaWYgKHRhZy50YWdOYW1lID09PSAnc3R5bGUnICYmICF0YWcuYXR0cnMuc29tZSgoYXR0cikgPT4gYXR0ci5uYW1lID09PSAnbm9uY2UnKSkge1xuICAgICAgdGFnLmF0dHJzLnB1c2goeyBuYW1lOiAnbm9uY2UnLCB2YWx1ZTogbm9uY2UgfSk7XG4gICAgfVxuXG4gICAgcmV3cml0ZXIuZW1pdFN0YXJ0VGFnKHRhZyk7XG4gIH0pO1xuXG4gIHJldHVybiB0cmFuc2Zvcm1lZENvbnRlbnQoKTtcbn1cblxuLyoqIEZpbmRzIHRoZSBBbmd1bGFyIG5vbmNlIGluIGFuIEhUTUwgc3RyaW5nLiAqL1xuYXN5bmMgZnVuY3Rpb24gZmluZE5vbmNlKGh0bWw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAvLyBJbmV4cGVuc2l2ZSBjaGVjayB0byBhdm9pZCBwYXJzaW5nIHRoZSBIVE1MIHdoZW4gd2UncmUgc3VyZSB0aGVyZSdzIG5vIG5vbmNlLlxuICBpZiAoIU5PTkNFX0FUVFJfUEFUVEVSTi50ZXN0KGh0bWwpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCB7IHJld3JpdGVyLCB0cmFuc2Zvcm1lZENvbnRlbnQgfSA9IGF3YWl0IGh0bWxSZXdyaXRpbmdTdHJlYW0oaHRtbCk7XG4gIGxldCBub25jZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgcmV3cml0ZXIub24oJ3N0YXJ0VGFnJywgKHRhZykgPT4ge1xuICAgIGNvbnN0IG5vbmNlQXR0ciA9IHRhZy5hdHRycy5maW5kKChhdHRyKSA9PiBOT05DRV9BVFRSX1BBVFRFUk4udGVzdChhdHRyLm5hbWUpKTtcbiAgICBpZiAobm9uY2VBdHRyPy52YWx1ZSkge1xuICAgICAgbm9uY2UgPSBub25jZUF0dHIudmFsdWU7XG4gICAgICByZXdyaXRlci5zdG9wKCk7IC8vIFN0b3AgcGFyc2luZyBzaW5jZSB3ZSd2ZSBmb3VuZCB0aGUgbm9uY2UuXG4gICAgfVxuICB9KTtcblxuICBhd2FpdCB0cmFuc2Zvcm1lZENvbnRlbnQoKTtcblxuICByZXR1cm4gbm9uY2U7XG59XG4iXX0=