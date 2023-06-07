"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sassBindWorkaround = exports.LoadPathsUrlRebasingImporter = exports.ModuleUrlRebasingImporter = exports.RelativeUrlRebasingImporter = void 0;
const magic_string_1 = __importDefault(require("magic-string"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
/**
 * A Sass Importer base class that provides the load logic to rebase all `url()` functions
 * within a stylesheet. The rebasing will ensure that the URLs in the output of the Sass compiler
 * reflect the final filesystem location of the output CSS file.
 *
 * This class provides the core of the rebasing functionality. To ensure that each file is processed
 * by this importer's load implementation, the Sass compiler requires the importer's canonicalize
 * function to return a non-null value with the resolved location of the requested stylesheet.
 * Concrete implementations of this class must provide this canonicalize functionality for rebasing
 * to be effective.
 */
class UrlRebasingImporter {
    /**
     * @param entryDirectory The directory of the entry stylesheet that was passed to the Sass compiler.
     * @param rebaseSourceMaps When provided, rebased files will have an intermediate sourcemap added to the Map
     * which can be used to generate a final sourcemap that contains original sources.
     */
    constructor(entryDirectory, rebaseSourceMaps) {
        this.entryDirectory = entryDirectory;
        this.rebaseSourceMaps = rebaseSourceMaps;
    }
    load(canonicalUrl) {
        const stylesheetPath = (0, node_url_1.fileURLToPath)(canonicalUrl);
        const stylesheetDirectory = (0, node_path_1.dirname)(stylesheetPath);
        let contents = (0, node_fs_1.readFileSync)(stylesheetPath, 'utf-8');
        // Rebase any URLs that are found
        let updatedContents;
        for (const { start, end, value } of findUrls(contents)) {
            // Skip if value is empty or a Sass variable
            if (value.length === 0 || value.startsWith('$')) {
                continue;
            }
            // Skip if root-relative, absolute or protocol relative url
            if (/^((?:\w+:)?\/\/|data:|chrome:|#|\/)/.test(value)) {
                continue;
            }
            const rebasedPath = (0, node_path_1.relative)(this.entryDirectory, (0, node_path_1.join)(stylesheetDirectory, value));
            // Normalize path separators and escape characters
            // https://developer.mozilla.org/en-US/docs/Web/CSS/url#syntax
            const rebasedUrl = './' + rebasedPath.replace(/\\/g, '/').replace(/[()\s'"]/g, '\\$&');
            updatedContents ?? (updatedContents = new magic_string_1.default(contents));
            updatedContents.update(start, end, rebasedUrl);
        }
        if (updatedContents) {
            contents = updatedContents.toString();
            if (this.rebaseSourceMaps) {
                // Generate an intermediate source map for the rebasing changes
                const map = updatedContents.generateMap({
                    hires: true,
                    includeContent: true,
                    source: canonicalUrl.href,
                });
                this.rebaseSourceMaps.set(canonicalUrl.href, map);
            }
        }
        let syntax;
        switch ((0, node_path_1.extname)(stylesheetPath).toLowerCase()) {
            case 'css':
                syntax = 'css';
                break;
            case 'sass':
                syntax = 'indented';
                break;
            default:
                syntax = 'scss';
                break;
        }
        return {
            contents,
            syntax,
            sourceMapUrl: canonicalUrl,
        };
    }
}
/**
 * Determines if a unicode code point is a CSS whitespace character.
 * @param code The unicode code point to test.
 * @returns true, if the code point is CSS whitespace; false, otherwise.
 */
function isWhitespace(code) {
    // Based on https://www.w3.org/TR/css-syntax-3/#whitespace
    switch (code) {
        case 0x0009: // tab
        case 0x0020: // space
        case 0x000a: // line feed
        case 0x000c: // form feed
        case 0x000d: // carriage return
            return true;
        default:
            return false;
    }
}
/**
 * Scans a CSS or Sass file and locates all valid url function values as defined by the CSS
 * syntax specification.
 * @param contents A string containing a CSS or Sass file to scan.
 * @returns An iterable that yields each CSS url function value found.
 */
function* findUrls(contents) {
    let pos = 0;
    let width = 1;
    let current = -1;
    const next = () => {
        pos += width;
        current = contents.codePointAt(pos) ?? -1;
        width = current > 0xffff ? 2 : 1;
        return current;
    };
    // Based on https://www.w3.org/TR/css-syntax-3/#consume-ident-like-token
    while ((pos = contents.indexOf('url(', pos)) !== -1) {
        // Set to position of the (
        pos += 3;
        width = 1;
        // Consume all leading whitespace
        while (isWhitespace(next())) {
            /* empty */
        }
        // Initialize URL state
        const url = { start: pos, end: -1, value: '' };
        let complete = false;
        // If " or ', then consume the value as a string
        if (current === 0x0022 || current === 0x0027) {
            const ending = current;
            // Based on https://www.w3.org/TR/css-syntax-3/#consume-string-token
            while (!complete) {
                switch (next()) {
                    case -1: // EOF
                        return;
                    case 0x000a: // line feed
                    case 0x000c: // form feed
                    case 0x000d: // carriage return
                        // Invalid
                        complete = true;
                        break;
                    case 0x005c: // \ -- character escape
                        // If not EOF or newline, add the character after the escape
                        switch (next()) {
                            case -1:
                                return;
                            case 0x000a: // line feed
                            case 0x000c: // form feed
                            case 0x000d: // carriage return
                                // Skip when inside a string
                                break;
                            default:
                                // TODO: Handle hex escape codes
                                url.value += String.fromCodePoint(current);
                                break;
                        }
                        break;
                    case ending:
                        // Full string position should include the quotes for replacement
                        url.end = pos + 1;
                        complete = true;
                        yield url;
                        break;
                    default:
                        url.value += String.fromCodePoint(current);
                        break;
                }
            }
            next();
            continue;
        }
        // Based on https://www.w3.org/TR/css-syntax-3/#consume-url-token
        while (!complete) {
            switch (current) {
                case -1: // EOF
                    return;
                case 0x0022: // "
                case 0x0027: // '
                case 0x0028: // (
                    // Invalid
                    complete = true;
                    break;
                case 0x0029: // )
                    // URL is valid and complete
                    url.end = pos;
                    complete = true;
                    break;
                case 0x005c: // \ -- character escape
                    // If not EOF or newline, add the character after the escape
                    switch (next()) {
                        case -1: // EOF
                            return;
                        case 0x000a: // line feed
                        case 0x000c: // form feed
                        case 0x000d: // carriage return
                            // Invalid
                            complete = true;
                            break;
                        default:
                            // TODO: Handle hex escape codes
                            url.value += String.fromCodePoint(current);
                            break;
                    }
                    break;
                default:
                    if (isWhitespace(current)) {
                        while (isWhitespace(next())) {
                            /* empty */
                        }
                        // Unescaped whitespace is only valid before the closing )
                        if (current === 0x0029) {
                            // URL is valid
                            url.end = pos;
                        }
                        complete = true;
                    }
                    else {
                        // Add the character to the url value
                        url.value += String.fromCodePoint(current);
                    }
                    break;
            }
            next();
        }
        // An end position indicates a URL was found
        if (url.end !== -1) {
            yield url;
        }
    }
}
/**
 * Provides the Sass importer logic to resolve relative stylesheet imports via both import and use rules
 * and also rebase any `url()` function usage within those stylesheets. The rebasing will ensure that
 * the URLs in the output of the Sass compiler reflect the final filesystem location of the output CSS file.
 */
class RelativeUrlRebasingImporter extends UrlRebasingImporter {
    constructor(entryDirectory, directoryCache = new Map(), rebaseSourceMaps) {
        super(entryDirectory, rebaseSourceMaps);
        this.directoryCache = directoryCache;
    }
    canonicalize(url, options) {
        return this.resolveImport(url, options.fromImport, true);
    }
    /**
     * Attempts to resolve a provided URL to a stylesheet file using the Sass compiler's resolution algorithm.
     * Based on https://github.com/sass/dart-sass/blob/44d6bb6ac72fe6b93f5bfec371a1fffb18e6b76d/lib/src/importer/utils.dart
     * @param url The file protocol URL to resolve.
     * @param fromImport If true, URL was from an import rule; otherwise from a use rule.
     * @param checkDirectory If true, try checking for a directory with the base name containing an index file.
     * @returns A full resolved URL of the stylesheet file or `null` if not found.
     */
    resolveImport(url, fromImport, checkDirectory) {
        let stylesheetPath;
        try {
            stylesheetPath = (0, node_url_1.fileURLToPath)(url);
        }
        catch {
            // Only file protocol URLs are supported by this importer
            return null;
        }
        const directory = (0, node_path_1.dirname)(stylesheetPath);
        const extension = (0, node_path_1.extname)(stylesheetPath);
        const hasStyleExtension = extension === '.scss' || extension === '.sass' || extension === '.css';
        // Remove the style extension if present to allow adding the `.import` suffix
        const filename = (0, node_path_1.basename)(stylesheetPath, hasStyleExtension ? extension : undefined);
        const importPotentials = new Set();
        const defaultPotentials = new Set();
        if (hasStyleExtension) {
            if (fromImport) {
                importPotentials.add(filename + '.import' + extension);
                importPotentials.add('_' + filename + '.import' + extension);
            }
            defaultPotentials.add(filename + extension);
            defaultPotentials.add('_' + filename + extension);
        }
        else {
            if (fromImport) {
                importPotentials.add(filename + '.import.scss');
                importPotentials.add(filename + '.import.sass');
                importPotentials.add(filename + '.import.css');
                importPotentials.add('_' + filename + '.import.scss');
                importPotentials.add('_' + filename + '.import.sass');
                importPotentials.add('_' + filename + '.import.css');
            }
            defaultPotentials.add(filename + '.scss');
            defaultPotentials.add(filename + '.sass');
            defaultPotentials.add(filename + '.css');
            defaultPotentials.add('_' + filename + '.scss');
            defaultPotentials.add('_' + filename + '.sass');
            defaultPotentials.add('_' + filename + '.css');
        }
        let foundDefaults;
        let foundImports;
        let hasPotentialIndex = false;
        let cachedEntries = this.directoryCache.get(directory);
        if (cachedEntries) {
            // If there is a preprocessed cache of the directory, perform an intersection of the potentials
            // and the directory files.
            const { files, directories } = cachedEntries;
            foundDefaults = [...defaultPotentials].filter((potential) => files.has(potential));
            foundImports = [...importPotentials].filter((potential) => files.has(potential));
            hasPotentialIndex = checkDirectory && !hasStyleExtension && directories.has(filename);
        }
        else {
            // If no preprocessed cache exists, get the entries from the file system and, while searching,
            // generate the cache for later requests.
            let entries;
            try {
                entries = (0, node_fs_1.readdirSync)(directory, { withFileTypes: true });
            }
            catch {
                return null;
            }
            foundDefaults = [];
            foundImports = [];
            cachedEntries = { files: new Set(), directories: new Set() };
            for (const entry of entries) {
                const isDirectory = entry.isDirectory();
                if (isDirectory) {
                    cachedEntries.directories.add(entry.name);
                }
                // Record if the name should be checked as a directory with an index file
                if (checkDirectory && !hasStyleExtension && entry.name === filename && isDirectory) {
                    hasPotentialIndex = true;
                }
                if (!entry.isFile()) {
                    continue;
                }
                cachedEntries.files.add(entry.name);
                if (importPotentials.has(entry.name)) {
                    foundImports.push(entry.name);
                }
                if (defaultPotentials.has(entry.name)) {
                    foundDefaults.push(entry.name);
                }
            }
            this.directoryCache.set(directory, cachedEntries);
        }
        // `foundImports` will only contain elements if `options.fromImport` is true
        const result = this.checkFound(foundImports) ?? this.checkFound(foundDefaults);
        if (result !== null) {
            return (0, node_url_1.pathToFileURL)((0, node_path_1.join)(directory, result));
        }
        if (hasPotentialIndex) {
            // Check for index files using filename as a directory
            return this.resolveImport(url + '/index', fromImport, false);
        }
        return null;
    }
    /**
     * Checks an array of potential stylesheet files to determine if there is a valid
     * stylesheet file. More than one discovered file may indicate an error.
     * @param found An array of discovered stylesheet files.
     * @returns A fully resolved path for a stylesheet file or `null` if not found.
     * @throws If there are ambiguous files discovered.
     */
    checkFound(found) {
        if (found.length === 0) {
            // Not found
            return null;
        }
        // More than one found file may be an error
        if (found.length > 1) {
            // Presence of CSS files alongside a Sass file does not cause an error
            const foundWithoutCss = found.filter((element) => (0, node_path_1.extname)(element) !== '.css');
            // If the length is zero then there are two or more css files
            // If the length is more than one than there are two or more sass/scss files
            if (foundWithoutCss.length !== 1) {
                throw new Error('Ambiguous import detected.');
            }
            // Return the non-CSS file (sass/scss files have priority)
            // https://github.com/sass/dart-sass/blob/44d6bb6ac72fe6b93f5bfec371a1fffb18e6b76d/lib/src/importer/utils.dart#L44-L47
            return foundWithoutCss[0];
        }
        return found[0];
    }
}
exports.RelativeUrlRebasingImporter = RelativeUrlRebasingImporter;
/**
 * Provides the Sass importer logic to resolve module (npm package) stylesheet imports via both import and
 * use rules and also rebase any `url()` function usage within those stylesheets. The rebasing will ensure that
 * the URLs in the output of the Sass compiler reflect the final filesystem location of the output CSS file.
 */
class ModuleUrlRebasingImporter extends RelativeUrlRebasingImporter {
    constructor(entryDirectory, directoryCache, rebaseSourceMaps, finder) {
        super(entryDirectory, directoryCache, rebaseSourceMaps);
        this.finder = finder;
    }
    canonicalize(url, options) {
        if (url.startsWith('file://')) {
            return super.canonicalize(url, options);
        }
        const result = this.finder(url, options);
        return result ? super.canonicalize(result.href, options) : null;
    }
}
exports.ModuleUrlRebasingImporter = ModuleUrlRebasingImporter;
/**
 * Provides the Sass importer logic to resolve load paths located stylesheet imports via both import and
 * use rules and also rebase any `url()` function usage within those stylesheets. The rebasing will ensure that
 * the URLs in the output of the Sass compiler reflect the final filesystem location of the output CSS file.
 */
class LoadPathsUrlRebasingImporter extends RelativeUrlRebasingImporter {
    constructor(entryDirectory, directoryCache, rebaseSourceMaps, loadPaths) {
        super(entryDirectory, directoryCache, rebaseSourceMaps);
        this.loadPaths = loadPaths;
    }
    canonicalize(url, options) {
        if (url.startsWith('file://')) {
            return super.canonicalize(url, options);
        }
        let result = null;
        for (const loadPath of this.loadPaths) {
            result = super.canonicalize((0, node_url_1.pathToFileURL)((0, node_path_1.join)(loadPath, url)).href, options);
            if (result !== null) {
                break;
            }
        }
        return result;
    }
}
exports.LoadPathsUrlRebasingImporter = LoadPathsUrlRebasingImporter;
/**
 * Workaround for Sass not calling instance methods with `this`.
 * The `canonicalize` and `load` methods will be bound to the class instance.
 * @param importer A Sass importer to bind.
 * @returns The bound Sass importer.
 */
function sassBindWorkaround(importer) {
    importer.canonicalize = importer.canonicalize.bind(importer);
    importer.load = importer.load.bind(importer);
    return importer;
}
exports.sassBindWorkaround = sassBindWorkaround;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmViYXNpbmctaW1wb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9zYXNzL3JlYmFzaW5nLWltcG9ydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUdILGdFQUF1QztBQUN2QyxxQ0FBb0Q7QUFDcEQseUNBQXVFO0FBQ3ZFLHVDQUF3RDtBQVl4RDs7Ozs7Ozs7OztHQVVHO0FBQ0gsTUFBZSxtQkFBbUI7SUFDaEM7Ozs7T0FJRztJQUNILFlBQ1UsY0FBc0IsRUFDdEIsZ0JBQTRDO1FBRDVDLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1FBQ3RCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBNEI7SUFDbkQsQ0FBQztJQUlKLElBQUksQ0FBQyxZQUFpQjtRQUNwQixNQUFNLGNBQWMsR0FBRyxJQUFBLHdCQUFhLEVBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkQsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLG1CQUFPLEVBQUMsY0FBYyxDQUFDLENBQUM7UUFDcEQsSUFBSSxRQUFRLEdBQUcsSUFBQSxzQkFBWSxFQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVyRCxpQ0FBaUM7UUFDakMsSUFBSSxlQUFlLENBQUM7UUFDcEIsS0FBSyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDdEQsNENBQTRDO1lBQzVDLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDL0MsU0FBUzthQUNWO1lBRUQsMkRBQTJEO1lBQzNELElBQUkscUNBQXFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNyRCxTQUFTO2FBQ1Y7WUFF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QyxRQUFRLENBQUMsQ0FBQztJQUU3QyxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBTEQsZ0RBS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgUmF3U291cmNlTWFwIH0gZnJvbSAnQGFtcHByb2plY3QvcmVtYXBwaW5nJztcbmltcG9ydCBNYWdpY1N0cmluZyBmcm9tICdtYWdpYy1zdHJpbmcnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCByZWFkZGlyU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHsgYmFzZW5hbWUsIGRpcm5hbWUsIGV4dG5hbWUsIGpvaW4sIHJlbGF0aXZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIHBhdGhUb0ZpbGVVUkwgfSBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgdHlwZSB7IEZpbGVJbXBvcnRlciwgSW1wb3J0ZXIsIEltcG9ydGVyUmVzdWx0LCBTeW50YXggfSBmcm9tICdzYXNzJztcblxuLyoqXG4gKiBBIHByZXByb2Nlc3NlZCBjYWNoZSBlbnRyeSBmb3IgdGhlIGZpbGVzIGFuZCBkaXJlY3RvcmllcyB3aXRoaW4gYSBwcmV2aW91c2x5IHNlYXJjaGVkXG4gKiBkaXJlY3Rvcnkgd2hlbiBwZXJmb3JtaW5nIFNhc3MgaW1wb3J0IHJlc29sdXRpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0b3J5RW50cnkge1xuICBmaWxlczogU2V0PHN0cmluZz47XG4gIGRpcmVjdG9yaWVzOiBTZXQ8c3RyaW5nPjtcbn1cblxuLyoqXG4gKiBBIFNhc3MgSW1wb3J0ZXIgYmFzZSBjbGFzcyB0aGF0IHByb3ZpZGVzIHRoZSBsb2FkIGxvZ2ljIHRvIHJlYmFzZSBhbGwgYHVybCgpYCBmdW5jdGlvbnNcbiAqIHdpdGhpbiBhIHN0eWxlc2hlZXQuIFRoZSByZWJhc2luZyB3aWxsIGVuc3VyZSB0aGF0IHRoZSBVUkxzIGluIHRoZSBvdXRwdXQgb2YgdGhlIFNhc3MgY29tcGlsZXJcbiAqIHJlZmxlY3QgdGhlIGZpbmFsIGZpbGVzeXN0ZW0gbG9jYXRpb24gb2YgdGhlIG91dHB1dCBDU1MgZmlsZS5cbiAqXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIHRoZSBjb3JlIG9mIHRoZSByZWJhc2luZyBmdW5jdGlvbmFsaXR5LiBUbyBlbnN1cmUgdGhhdCBlYWNoIGZpbGUgaXMgcHJvY2Vzc2VkXG4gKiBieSB0aGlzIGltcG9ydGVyJ3MgbG9hZCBpbXBsZW1lbnRhdGlvbiwgdGhlIFNhc3MgY29tcGlsZXIgcmVxdWlyZXMgdGhlIGltcG9ydGVyJ3MgY2Fub25pY2FsaXplXG4gKiBmdW5jdGlvbiB0byByZXR1cm4gYSBub24tbnVsbCB2YWx1ZSB3aXRoIHRoZSByZXNvbHZlZCBsb2NhdGlvbiBvZiB0aGUgcmVxdWVzdGVkIHN0eWxlc2hlZXQuXG4gKiBDb25jcmV0ZSBpbXBsZW1lbnRhdGlvbnMgb2YgdGhpcyBjbGFzcyBtdXN0IHByb3ZpZGUgdGhpcyBjYW5vbmljYWxpemUgZnVuY3Rpb25hbGl0eSBmb3IgcmViYXNpbmdcbiAqIHRvIGJlIGVmZmVjdGl2ZS5cbiAqL1xuYWJzdHJhY3QgY2xhc3MgVXJsUmViYXNpbmdJbXBvcnRlciBpbXBsZW1lbnRzIEltcG9ydGVyPCdzeW5jJz4ge1xuICAvKipcbiAgICogQHBhcmFtIGVudHJ5RGlyZWN0b3J5IFRoZSBkaXJlY3Rvcnkgb2YgdGhlIGVudHJ5IHN0eWxlc2hlZXQgdGhhdCB3YXMgcGFzc2VkIHRvIHRoZSBTYXNzIGNvbXBpbGVyLlxuICAgKiBAcGFyYW0gcmViYXNlU291cmNlTWFwcyBXaGVuIHByb3ZpZGVkLCByZWJhc2VkIGZpbGVzIHdpbGwgaGF2ZSBhbiBpbnRlcm1lZGlhdGUgc291cmNlbWFwIGFkZGVkIHRvIHRoZSBNYXBcbiAgICogd2hpY2ggY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgYSBmaW5hbCBzb3VyY2VtYXAgdGhhdCBjb250YWlucyBvcmlnaW5hbCBzb3VyY2VzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBlbnRyeURpcmVjdG9yeTogc3RyaW5nLFxuICAgIHByaXZhdGUgcmViYXNlU291cmNlTWFwcz86IE1hcDxzdHJpbmcsIFJhd1NvdXJjZU1hcD4sXG4gICkge31cblxuICBhYnN0cmFjdCBjYW5vbmljYWxpemUodXJsOiBzdHJpbmcsIG9wdGlvbnM6IHsgZnJvbUltcG9ydDogYm9vbGVhbiB9KTogVVJMIHwgbnVsbDtcblxuICBsb2FkKGNhbm9uaWNhbFVybDogVVJMKTogSW1wb3J0ZXJSZXN1bHQgfCBudWxsIHtcbiAgICBjb25zdCBzdHlsZXNoZWV0UGF0aCA9IGZpbGVVUkxUb1BhdGgoY2Fub25pY2FsVXJsKTtcbiAgICBjb25zdCBzdHlsZXNoZWV0RGlyZWN0b3J5ID0gZGlybmFtZShzdHlsZXNoZWV0UGF0aCk7XG4gICAgbGV0IGNvbnRlbnRzID0gcmVhZEZpbGVTeW5jKHN0eWxlc2hlZXRQYXRoLCAndXRmLTgnKTtcblxuICAgIC8vIFJlYmFzZSBhbnkgVVJMcyB0aGF0IGFyZSBmb3VuZFxuICAgIGxldCB1cGRhdGVkQ29udGVudHM7XG4gICAgZm9yIChjb25zdCB7IHN0YXJ0LCBlbmQsIHZhbHVlIH0gb2YgZmluZFVybHMoY29udGVudHMpKSB7XG4gICAgICAvLyBTa2lwIGlmIHZhbHVlIGlzIGVtcHR5IG9yIGEgU2FzcyB2YXJpYWJsZVxuICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCB8fCB2YWx1ZS5zdGFydHNXaXRoKCckJykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFNraXAgaWYgcm9vdC1yZWxhdGl2ZSwgYWJzb2x1dGUgb3IgcHJvdG9jb2wgcmVsYXRpdmUgdXJsXG4gICAgICBpZiAoL14oKD86XFx3KzopP1xcL1xcL3xkYXRhOnxjaHJvbWU6fCN8XFwvKS8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlYmFzZWRQYXRoID0gcmVsYXRpdmUodGhpcy5lbnRyeURpcmVjdG9yeSwgam9pbihzdHlsZXNoZWV0RGlyZWN0b3J5LCB2YWx1ZSkpO1xuXG4gICAgICAvLyBOb3JtYWxpemUgcGF0aCBzZXBhcmF0b3JzIGFuZCBlc2NhcGUgY2hhcmFjdGVyc1xuICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3VybCNzeW50YXhcbiAgICAgIGNvbnN0IHJlYmFzZWRVcmwgPSAnLi8nICsgcmViYXNlZFBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpLnJlcGxhY2UoL1soKVxccydcIl0vZywgJ1xcXFwkJicpO1xuXG4gICAgICB1cGRhdGVkQ29udGVudHMgPz89IG5ldyBNYWdpY1N0cmluZyhjb250ZW50cyk7XG4gICAgICB1cGRhdGVkQ29udGVudHMudXBkYXRlKHN0YXJ0LCBlbmQsIHJlYmFzZWRVcmwpO1xuICAgIH1cblxuICAgIGlmICh1cGRhdGVkQ29udGVudHMpIHtcbiAgICAgIGNvbnRlbnRzID0gdXBkYXRlZENvbnRlbnRzLnRvU3RyaW5nKCk7XG4gICAgICBpZiAodGhpcy5yZWJhc2VTb3VyY2VNYXBzKSB7XG4gICAgICAgIC8vIEdlbmVyYXRlIGFuIGludGVybWVkaWF0ZSBzb3VyY2UgbWFwIGZvciB0aGUgcmViYXNpbmcgY2hhbmdlc1xuICAgICAgICBjb25zdCBtYXAgPSB1cGRhdGVkQ29udGVudHMuZ2VuZXJhdGVNYXAoe1xuICAgICAgICAgIGhpcmVzOiB0cnVlLFxuICAgICAgICAgIGluY2x1ZGVDb250ZW50OiB0cnVlLFxuICAgICAgICAgIHNvdXJjZTogY2Fub25pY2FsVXJsLmhyZWYsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlYmFzZVNvdXJjZU1hcHMuc2V0KGNhbm9uaWNhbFVybC5ocmVmLCBtYXAgYXMgUmF3U291cmNlTWFwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgc3ludGF4OiBTeW50YXggfCB1bmRlZmluZWQ7XG4gICAgc3dpdGNoIChleHRuYW1lKHN0eWxlc2hlZXRQYXRoKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICBjYXNlICdjc3MnOlxuICAgICAgICBzeW50YXggPSAnY3NzJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzYXNzJzpcbiAgICAgICAgc3ludGF4ID0gJ2luZGVudGVkJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzeW50YXggPSAnc2Nzcyc7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50cyxcbiAgICAgIHN5bnRheCxcbiAgICAgIHNvdXJjZU1hcFVybDogY2Fub25pY2FsVXJsLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGEgdW5pY29kZSBjb2RlIHBvaW50IGlzIGEgQ1NTIHdoaXRlc3BhY2UgY2hhcmFjdGVyLlxuICogQHBhcmFtIGNvZGUgVGhlIHVuaWNvZGUgY29kZSBwb2ludCB0byB0ZXN0LlxuICogQHJldHVybnMgdHJ1ZSwgaWYgdGhlIGNvZGUgcG9pbnQgaXMgQ1NTIHdoaXRlc3BhY2U7IGZhbHNlLCBvdGhlcndpc2UuXG4gKi9cbmZ1bmN0aW9uIGlzV2hpdGVzcGFjZShjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgLy8gQmFzZWQgb24gaHR0cHM6Ly93d3cudzMub3JnL1RSL2Nzcy1zeW50YXgtMy8jd2hpdGVzcGFjZVxuICBzd2l0Y2ggKGNvZGUpIHtcbiAgICBjYXNlIDB4MDAwOTogLy8gdGFiXG4gICAgY2FzZSAweDAwMjA6IC8vIHNwYWNlXG4gICAgY2FzZSAweDAwMGE6IC8vIGxpbmUgZmVlZFxuICAgIGNhc2UgMHgwMDBjOiAvLyBmb3JtIGZlZWRcbiAgICBjYXNlIDB4MDAwZDogLy8gY2FycmlhZ2UgcmV0dXJuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogU2NhbnMgYSBDU1Mgb3IgU2FzcyBmaWxlIGFuZCBsb2NhdGVzIGFsbCB2YWxpZCB1cmwgZnVuY3Rpb24gdmFsdWVzIGFzIGRlZmluZWQgYnkgdGhlIENTU1xuICogc3ludGF4IHNwZWNpZmljYXRpb24uXG4gKiBAcGFyYW0gY29udGVudHMgQSBzdHJpbmcgY29udGFpbmluZyBhIENTUyBvciBTYXNzIGZpbGUgdG8gc2Nhbi5cbiAqIEByZXR1cm5zIEFuIGl0ZXJhYmxlIHRoYXQgeWllbGRzIGVhY2ggQ1NTIHVybCBmdW5jdGlvbiB2YWx1ZSBmb3VuZC5cbiAqL1xuZnVuY3Rpb24qIGZpbmRVcmxzKGNvbnRlbnRzOiBzdHJpbmcpOiBJdGVyYWJsZTx7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyOyB2YWx1ZTogc3RyaW5nIH0+IHtcbiAgbGV0IHBvcyA9IDA7XG4gIGxldCB3aWR0aCA9IDE7XG4gIGxldCBjdXJyZW50ID0gLTE7XG4gIGNvbnN0IG5leHQgPSAoKSA9PiB7XG4gICAgcG9zICs9IHdpZHRoO1xuICAgIGN1cnJlbnQgPSBjb250ZW50cy5jb2RlUG9pbnRBdChwb3MpID8/IC0xO1xuICAgIHdpZHRoID0gY3VycmVudCA+IDB4ZmZmZiA/IDIgOiAxO1xuXG4gICAgcmV0dXJuIGN1cnJlbnQ7XG4gIH07XG5cbiAgLy8gQmFzZWQgb24gaHR0cHM6Ly93d3cudzMub3JnL1RSL2Nzcy1zeW50YXgtMy8jY29uc3VtZS1pZGVudC1saWtlLXRva2VuXG4gIHdoaWxlICgocG9zID0gY29udGVudHMuaW5kZXhPZigndXJsKCcsIHBvcykpICE9PSAtMSkge1xuICAgIC8vIFNldCB0byBwb3NpdGlvbiBvZiB0aGUgKFxuICAgIHBvcyArPSAzO1xuICAgIHdpZHRoID0gMTtcblxuICAgIC8vIENvbnN1bWUgYWxsIGxlYWRpbmcgd2hpdGVzcGFjZVxuICAgIHdoaWxlIChpc1doaXRlc3BhY2UobmV4dCgpKSkge1xuICAgICAgLyogZW1wdHkgKi9cbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXplIFVSTCBzdGF0ZVxuICAgIGNvbnN0IHVybCA9IHsgc3RhcnQ6IHBvcywgZW5kOiAtMSwgdmFsdWU6ICcnIH07XG4gICAgbGV0IGNvbXBsZXRlID0gZmFsc2U7XG5cbiAgICAvLyBJZiBcIiBvciAnLCB0aGVuIGNvbnN1bWUgdGhlIHZhbHVlIGFzIGEgc3RyaW5nXG4gICAgaWYgKGN1cnJlbnQgPT09IDB4MDAyMiB8fCBjdXJyZW50ID09PSAweDAwMjcpIHtcbiAgICAgIGNvbnN0IGVuZGluZyA9IGN1cnJlbnQ7XG4gICAgICAvLyBCYXNlZCBvbiBodHRwczovL3d3dy53My5vcmcvVFIvY3NzLXN5bnRheC0zLyNjb25zdW1lLXN0cmluZy10b2tlblxuICAgICAgd2hpbGUgKCFjb21wbGV0ZSkge1xuICAgICAgICBzd2l0Y2ggKG5leHQoKSkge1xuICAgICAgICAgIGNhc2UgLTE6IC8vIEVPRlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIGNhc2UgMHgwMDBhOiAvLyBsaW5lIGZlZWRcbiAgICAgICAgICBjYXNlIDB4MDAwYzogLy8gZm9ybSBmZWVkXG4gICAgICAgICAgY2FzZSAweDAwMGQ6IC8vIGNhcnJpYWdlIHJldHVyblxuICAgICAgICAgICAgLy8gSW52YWxpZFxuICAgICAgICAgICAgY29tcGxldGUgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAweDAwNWM6IC8vIFxcIC0tIGNoYXJhY3RlciBlc2NhcGVcbiAgICAgICAgICAgIC8vIElmIG5vdCBFT0Ygb3IgbmV3bGluZSwgYWRkIHRoZSBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIGVzY2FwZVxuICAgICAgICAgICAgc3dpdGNoIChuZXh0KCkpIHtcbiAgICAgICAgICAgICAgY2FzZSAtMTpcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIGNhc2UgMHgwMDBhOiAvLyBsaW5lIGZlZWRcbiAgICAgICAgICAgICAgY2FzZSAweDAwMGM6IC8vIGZvcm0gZmVlZFxuICAgICAgICAgICAgICBjYXNlIDB4MDAwZDogLy8gY2FycmlhZ2UgcmV0dXJuXG4gICAgICAgICAgICAgICAgLy8gU2tpcCB3aGVuIGluc2lkZSBhIHN0cmluZ1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIFRPRE86IEhhbmRsZSBoZXggZXNjYXBlIGNvZGVzXG4gICAgICAgICAgICAgICAgdXJsLnZhbHVlICs9IFN0cmluZy5mcm9tQ29kZVBvaW50KGN1cnJlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBlbmRpbmc6XG4gICAgICAgICAgICAvLyBGdWxsIHN0cmluZyBwb3NpdGlvbiBzaG91bGQgaW5jbHVkZSB0aGUgcXVvdGVzIGZvciByZXBsYWNlbWVudFxuICAgICAgICAgICAgdXJsLmVuZCA9IHBvcyArIDE7XG4gICAgICAgICAgICBjb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICB5aWVsZCB1cmw7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdXJsLnZhbHVlICs9IFN0cmluZy5mcm9tQ29kZVBvaW50KGN1cnJlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbmV4dCgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQmFzZWQgb24gaHR0cHM6Ly93d3cudzMub3JnL1RSL2Nzcy1zeW50YXgtMy8jY29uc3VtZS11cmwtdG9rZW5cbiAgICB3aGlsZSAoIWNvbXBsZXRlKSB7XG4gICAgICBzd2l0Y2ggKGN1cnJlbnQpIHtcbiAgICAgICAgY2FzZSAtMTogLy8gRU9GXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjYXNlIDB4MDAyMjogLy8gXCJcbiAgICAgICAgY2FzZSAweDAwMjc6IC8vICdcbiAgICAgICAgY2FzZSAweDAwMjg6IC8vIChcbiAgICAgICAgICAvLyBJbnZhbGlkXG4gICAgICAgICAgY29tcGxldGUgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDB4MDAyOTogLy8gKVxuICAgICAgICAgIC8vIFVSTCBpcyB2YWxpZCBhbmQgY29tcGxldGVcbiAgICAgICAgICB1cmwuZW5kID0gcG9zO1xuICAgICAgICAgIGNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAweDAwNWM6IC8vIFxcIC0tIGNoYXJhY3RlciBlc2NhcGVcbiAgICAgICAgICAvLyBJZiBub3QgRU9GIG9yIG5ld2xpbmUsIGFkZCB0aGUgY2hhcmFjdGVyIGFmdGVyIHRoZSBlc2NhcGVcbiAgICAgICAgICBzd2l0Y2ggKG5leHQoKSkge1xuICAgICAgICAgICAgY2FzZSAtMTogLy8gRU9GXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgMHgwMDBhOiAvLyBsaW5lIGZlZWRcbiAgICAgICAgICAgIGNhc2UgMHgwMDBjOiAvLyBmb3JtIGZlZWRcbiAgICAgICAgICAgIGNhc2UgMHgwMDBkOiAvLyBjYXJyaWFnZSByZXR1cm5cbiAgICAgICAgICAgICAgLy8gSW52YWxpZFxuICAgICAgICAgICAgICBjb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgLy8gVE9ETzogSGFuZGxlIGhleCBlc2NhcGUgY29kZXNcbiAgICAgICAgICAgICAgdXJsLnZhbHVlICs9IFN0cmluZy5mcm9tQ29kZVBvaW50KGN1cnJlbnQpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKGlzV2hpdGVzcGFjZShjdXJyZW50KSkge1xuICAgICAgICAgICAgd2hpbGUgKGlzV2hpdGVzcGFjZShuZXh0KCkpKSB7XG4gICAgICAgICAgICAgIC8qIGVtcHR5ICovXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBVbmVzY2FwZWQgd2hpdGVzcGFjZSBpcyBvbmx5IHZhbGlkIGJlZm9yZSB0aGUgY2xvc2luZyApXG4gICAgICAgICAgICBpZiAoY3VycmVudCA9PT0gMHgwMDI5KSB7XG4gICAgICAgICAgICAgIC8vIFVSTCBpcyB2YWxpZFxuICAgICAgICAgICAgICB1cmwuZW5kID0gcG9zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29tcGxldGUgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBZGQgdGhlIGNoYXJhY3RlciB0byB0aGUgdXJsIHZhbHVlXG4gICAgICAgICAgICB1cmwudmFsdWUgKz0gU3RyaW5nLmZyb21Db2RlUG9pbnQoY3VycmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8vIEFuIGVuZCBwb3NpdGlvbiBpbmRpY2F0ZXMgYSBVUkwgd2FzIGZvdW5kXG4gICAgaWYgKHVybC5lbmQgIT09IC0xKSB7XG4gICAgICB5aWVsZCB1cmw7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgdGhlIFNhc3MgaW1wb3J0ZXIgbG9naWMgdG8gcmVzb2x2ZSByZWxhdGl2ZSBzdHlsZXNoZWV0IGltcG9ydHMgdmlhIGJvdGggaW1wb3J0IGFuZCB1c2UgcnVsZXNcbiAqIGFuZCBhbHNvIHJlYmFzZSBhbnkgYHVybCgpYCBmdW5jdGlvbiB1c2FnZSB3aXRoaW4gdGhvc2Ugc3R5bGVzaGVldHMuIFRoZSByZWJhc2luZyB3aWxsIGVuc3VyZSB0aGF0XG4gKiB0aGUgVVJMcyBpbiB0aGUgb3V0cHV0IG9mIHRoZSBTYXNzIGNvbXBpbGVyIHJlZmxlY3QgdGhlIGZpbmFsIGZpbGVzeXN0ZW0gbG9jYXRpb24gb2YgdGhlIG91dHB1dCBDU1MgZmlsZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlbGF0aXZlVXJsUmViYXNpbmdJbXBvcnRlciBleHRlbmRzIFVybFJlYmFzaW5nSW1wb3J0ZXIge1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbnRyeURpcmVjdG9yeTogc3RyaW5nLFxuICAgIHByaXZhdGUgZGlyZWN0b3J5Q2FjaGUgPSBuZXcgTWFwPHN0cmluZywgRGlyZWN0b3J5RW50cnk+KCksXG4gICAgcmViYXNlU291cmNlTWFwcz86IE1hcDxzdHJpbmcsIFJhd1NvdXJjZU1hcD4sXG4gICkge1xuICAgIHN1cGVyKGVudHJ5RGlyZWN0b3J5LCByZWJhc2VTb3VyY2VNYXBzKTtcbiAgfVxuXG4gIGNhbm9uaWNhbGl6ZSh1cmw6IHN0cmluZywgb3B0aW9uczogeyBmcm9tSW1wb3J0OiBib29sZWFuIH0pOiBVUkwgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlSW1wb3J0KHVybCwgb3B0aW9ucy5mcm9tSW1wb3J0LCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byByZXNvbHZlIGEgcHJvdmlkZWQgVVJMIHRvIGEgc3R5bGVzaGVldCBmaWxlIHVzaW5nIHRoZSBTYXNzIGNvbXBpbGVyJ3MgcmVzb2x1dGlvbiBhbGdvcml0aG0uXG4gICAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9zYXNzL2RhcnQtc2Fzcy9ibG9iLzQ0ZDZiYjZhYzcyZmU2YjkzZjViZmVjMzcxYTFmZmZiMThlNmI3NmQvbGliL3NyYy9pbXBvcnRlci91dGlscy5kYXJ0XG4gICAqIEBwYXJhbSB1cmwgVGhlIGZpbGUgcHJvdG9jb2wgVVJMIHRvIHJlc29sdmUuXG4gICAqIEBwYXJhbSBmcm9tSW1wb3J0IElmIHRydWUsIFVSTCB3YXMgZnJvbSBhbiBpbXBvcnQgcnVsZTsgb3RoZXJ3aXNlIGZyb20gYSB1c2UgcnVsZS5cbiAgICogQHBhcmFtIGNoZWNrRGlyZWN0b3J5IElmIHRydWUsIHRyeSBjaGVja2luZyBmb3IgYSBkaXJlY3Rvcnkgd2l0aCB0aGUgYmFzZSBuYW1lIGNvbnRhaW5pbmcgYW4gaW5kZXggZmlsZS5cbiAgICogQHJldHVybnMgQSBmdWxsIHJlc29sdmVkIFVSTCBvZiB0aGUgc3R5bGVzaGVldCBmaWxlIG9yIGBudWxsYCBpZiBub3QgZm91bmQuXG4gICAqL1xuICBwcml2YXRlIHJlc29sdmVJbXBvcnQodXJsOiBzdHJpbmcsIGZyb21JbXBvcnQ6IGJvb2xlYW4sIGNoZWNrRGlyZWN0b3J5OiBib29sZWFuKTogVVJMIHwgbnVsbCB7XG4gICAgbGV0IHN0eWxlc2hlZXRQYXRoO1xuICAgIHRyeSB7XG4gICAgICBzdHlsZXNoZWV0UGF0aCA9IGZpbGVVUkxUb1BhdGgodXJsKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIE9ubHkgZmlsZSBwcm90b2NvbCBVUkxzIGFyZSBzdXBwb3J0ZWQgYnkgdGhpcyBpbXBvcnRlclxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0b3J5ID0gZGlybmFtZShzdHlsZXNoZWV0UGF0aCk7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZXh0bmFtZShzdHlsZXNoZWV0UGF0aCk7XG4gICAgY29uc3QgaGFzU3R5bGVFeHRlbnNpb24gPVxuICAgICAgZXh0ZW5zaW9uID09PSAnLnNjc3MnIHx8IGV4dGVuc2lvbiA9PT0gJy5zYXNzJyB8fCBleHRlbnNpb24gPT09ICcuY3NzJztcbiAgICAvLyBSZW1vdmUgdGhlIHN0eWxlIGV4dGVuc2lvbiBpZiBwcmVzZW50IHRvIGFsbG93IGFkZGluZyB0aGUgYC5pbXBvcnRgIHN1ZmZpeFxuICAgIGNvbnN0IGZpbGVuYW1lID0gYmFzZW5hbWUoc3R5bGVzaGVldFBhdGgsIGhhc1N0eWxlRXh0ZW5zaW9uID8gZXh0ZW5zaW9uIDogdW5kZWZpbmVkKTtcblxuICAgIGNvbnN0IGltcG9ydFBvdGVudGlhbHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBkZWZhdWx0UG90ZW50aWFscyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgaWYgKGhhc1N0eWxlRXh0ZW5zaW9uKSB7XG4gICAgICBpZiAoZnJvbUltcG9ydCkge1xuICAgICAgICBpbXBvcnRQb3RlbnRpYWxzLmFkZChmaWxlbmFtZSArICcuaW1wb3J0JyArIGV4dGVuc2lvbik7XG4gICAgICAgIGltcG9ydFBvdGVudGlhbHMuYWRkKCdfJyArIGZpbGVuYW1lICsgJy5pbXBvcnQnICsgZXh0ZW5zaW9uKTtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHRQb3RlbnRpYWxzLmFkZChmaWxlbmFtZSArIGV4dGVuc2lvbik7XG4gICAgICBkZWZhdWx0UG90ZW50aWFscy5hZGQoJ18nICsgZmlsZW5hbWUgKyBleHRlbnNpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZnJvbUltcG9ydCkge1xuICAgICAgICBpbXBvcnRQb3RlbnRpYWxzLmFkZChmaWxlbmFtZSArICcuaW1wb3J0LnNjc3MnKTtcbiAgICAgICAgaW1wb3J0UG90ZW50aWFscy5hZGQoZmlsZW5hbWUgKyAnLmltcG9ydC5zYXNzJyk7XG4gICAgICAgIGltcG9ydFBvdGVudGlhbHMuYWRkKGZpbGVuYW1lICsgJy5pbXBvcnQuY3NzJyk7XG4gICAgICAgIGltcG9ydFBvdGVudGlhbHMuYWRkKCdfJyArIGZpbGVuYW1lICsgJy5pbXBvcnQuc2NzcycpO1xuICAgICAgICBpbXBvcnRQb3RlbnRpYWxzLmFkZCgnXycgKyBmaWxlbmFtZSArICcuaW1wb3J0LnNhc3MnKTtcbiAgICAgICAgaW1wb3J0UG90ZW50aWFscy5hZGQoJ18nICsgZmlsZW5hbWUgKyAnLmltcG9ydC5jc3MnKTtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHRQb3RlbnRpYWxzLmFkZChmaWxlbmFtZSArICcuc2NzcycpO1xuICAgICAgZGVmYXVsdFBvdGVudGlhbHMuYWRkKGZpbGVuYW1lICsgJy5zYXNzJyk7XG4gICAgICBkZWZhdWx0UG90ZW50aWFscy5hZGQoZmlsZW5hbWUgKyAnLmNzcycpO1xuICAgICAgZGVmYXVsdFBvdGVudGlhbHMuYWRkKCdfJyArIGZpbGVuYW1lICsgJy5zY3NzJyk7XG4gICAgICBkZWZhdWx0UG90ZW50aWFscy5hZGQoJ18nICsgZmlsZW5hbWUgKyAnLnNhc3MnKTtcbiAgICAgIGRlZmF1bHRQb3RlbnRpYWxzLmFkZCgnXycgKyBmaWxlbmFtZSArICcuY3NzJyk7XG4gICAgfVxuXG4gICAgbGV0IGZvdW5kRGVmYXVsdHM7XG4gICAgbGV0IGZvdW5kSW1wb3J0cztcbiAgICBsZXQgaGFzUG90ZW50aWFsSW5kZXggPSBmYWxzZTtcblxuICAgIGxldCBjYWNoZWRFbnRyaWVzID0gdGhpcy5kaXJlY3RvcnlDYWNoZS5nZXQoZGlyZWN0b3J5KTtcbiAgICBpZiAoY2FjaGVkRW50cmllcykge1xuICAgICAgLy8gSWYgdGhlcmUgaXMgYSBwcmVwcm9jZXNzZWQgY2FjaGUgb2YgdGhlIGRpcmVjdG9yeSwgcGVyZm9ybSBhbiBpbnRlcnNlY3Rpb24gb2YgdGhlIHBvdGVudGlhbHNcbiAgICAgIC8vIGFuZCB0aGUgZGlyZWN0b3J5IGZpbGVzLlxuICAgICAgY29uc3QgeyBmaWxlcywgZGlyZWN0b3JpZXMgfSA9IGNhY2hlZEVudHJpZXM7XG4gICAgICBmb3VuZERlZmF1bHRzID0gWy4uLmRlZmF1bHRQb3RlbnRpYWxzXS5maWx0ZXIoKHBvdGVudGlhbCkgPT4gZmlsZXMuaGFzKHBvdGVudGlhbCkpO1xuICAgICAgZm91bmRJbXBvcnRzID0gWy4uLmltcG9ydFBvdGVudGlhbHNdLmZpbHRlcigocG90ZW50aWFsKSA9PiBmaWxlcy5oYXMocG90ZW50aWFsKSk7XG4gICAgICBoYXNQb3RlbnRpYWxJbmRleCA9IGNoZWNrRGlyZWN0b3J5ICYmICFoYXNTdHlsZUV4dGVuc2lvbiAmJiBkaXJlY3Rvcmllcy5oYXMoZmlsZW5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBubyBwcmVwcm9jZXNzZWQgY2FjaGUgZXhpc3RzLCBnZXQgdGhlIGVudHJpZXMgZnJvbSB0aGUgZmlsZSBzeXN0ZW0gYW5kLCB3aGlsZSBzZWFyY2hpbmcsXG4gICAgICAvLyBnZW5lcmF0ZSB0aGUgY2FjaGUgZm9yIGxhdGVyIHJlcXVlc3RzLlxuICAgICAgbGV0IGVudHJpZXM7XG4gICAgICB0cnkge1xuICAgICAgICBlbnRyaWVzID0gcmVhZGRpclN5bmMoZGlyZWN0b3J5LCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGZvdW5kRGVmYXVsdHMgPSBbXTtcbiAgICAgIGZvdW5kSW1wb3J0cyA9IFtdO1xuICAgICAgY2FjaGVkRW50cmllcyA9IHsgZmlsZXM6IG5ldyBTZXQ8c3RyaW5nPigpLCBkaXJlY3RvcmllczogbmV3IFNldDxzdHJpbmc+KCkgfTtcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBjb25zdCBpc0RpcmVjdG9yeSA9IGVudHJ5LmlzRGlyZWN0b3J5KCk7XG4gICAgICAgIGlmIChpc0RpcmVjdG9yeSkge1xuICAgICAgICAgIGNhY2hlZEVudHJpZXMuZGlyZWN0b3JpZXMuYWRkKGVudHJ5Lm5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVjb3JkIGlmIHRoZSBuYW1lIHNob3VsZCBiZSBjaGVja2VkIGFzIGEgZGlyZWN0b3J5IHdpdGggYW4gaW5kZXggZmlsZVxuICAgICAgICBpZiAoY2hlY2tEaXJlY3RvcnkgJiYgIWhhc1N0eWxlRXh0ZW5zaW9uICYmIGVudHJ5Lm5hbWUgPT09IGZpbGVuYW1lICYmIGlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgaGFzUG90ZW50aWFsSW5kZXggPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FjaGVkRW50cmllcy5maWxlcy5hZGQoZW50cnkubmFtZSk7XG5cbiAgICAgICAgaWYgKGltcG9ydFBvdGVudGlhbHMuaGFzKGVudHJ5Lm5hbWUpKSB7XG4gICAgICAgICAgZm91bmRJbXBvcnRzLnB1c2goZW50cnkubmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVmYXVsdFBvdGVudGlhbHMuaGFzKGVudHJ5Lm5hbWUpKSB7XG4gICAgICAgICAgZm91bmREZWZhdWx0cy5wdXNoKGVudHJ5Lm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZGlyZWN0b3J5Q2FjaGUuc2V0KGRpcmVjdG9yeSwgY2FjaGVkRW50cmllcyk7XG4gICAgfVxuXG4gICAgLy8gYGZvdW5kSW1wb3J0c2Agd2lsbCBvbmx5IGNvbnRhaW4gZWxlbWVudHMgaWYgYG9wdGlvbnMuZnJvbUltcG9ydGAgaXMgdHJ1ZVxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuY2hlY2tGb3VuZChmb3VuZEltcG9ydHMpID8/IHRoaXMuY2hlY2tGb3VuZChmb3VuZERlZmF1bHRzKTtcbiAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gcGF0aFRvRmlsZVVSTChqb2luKGRpcmVjdG9yeSwgcmVzdWx0KSk7XG4gICAgfVxuXG4gICAgaWYgKGhhc1BvdGVudGlhbEluZGV4KSB7XG4gICAgICAvLyBDaGVjayBmb3IgaW5kZXggZmlsZXMgdXNpbmcgZmlsZW5hbWUgYXMgYSBkaXJlY3RvcnlcbiAgICAgIHJldHVybiB0aGlzLnJlc29sdmVJbXBvcnQodXJsICsgJy9pbmRleCcsIGZyb21JbXBvcnQsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgYW4gYXJyYXkgb2YgcG90ZW50aWFsIHN0eWxlc2hlZXQgZmlsZXMgdG8gZGV0ZXJtaW5lIGlmIHRoZXJlIGlzIGEgdmFsaWRcbiAgICogc3R5bGVzaGVldCBmaWxlLiBNb3JlIHRoYW4gb25lIGRpc2NvdmVyZWQgZmlsZSBtYXkgaW5kaWNhdGUgYW4gZXJyb3IuXG4gICAqIEBwYXJhbSBmb3VuZCBBbiBhcnJheSBvZiBkaXNjb3ZlcmVkIHN0eWxlc2hlZXQgZmlsZXMuXG4gICAqIEByZXR1cm5zIEEgZnVsbHkgcmVzb2x2ZWQgcGF0aCBmb3IgYSBzdHlsZXNoZWV0IGZpbGUgb3IgYG51bGxgIGlmIG5vdCBmb3VuZC5cbiAgICogQHRocm93cyBJZiB0aGVyZSBhcmUgYW1iaWd1b3VzIGZpbGVzIGRpc2NvdmVyZWQuXG4gICAqL1xuICBwcml2YXRlIGNoZWNrRm91bmQoZm91bmQ6IHN0cmluZ1tdKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKGZvdW5kLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gTm90IGZvdW5kXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBNb3JlIHRoYW4gb25lIGZvdW5kIGZpbGUgbWF5IGJlIGFuIGVycm9yXG4gICAgaWYgKGZvdW5kLmxlbmd0aCA+IDEpIHtcbiAgICAgIC8vIFByZXNlbmNlIG9mIENTUyBmaWxlcyBhbG9uZ3NpZGUgYSBTYXNzIGZpbGUgZG9lcyBub3QgY2F1c2UgYW4gZXJyb3JcbiAgICAgIGNvbnN0IGZvdW5kV2l0aG91dENzcyA9IGZvdW5kLmZpbHRlcigoZWxlbWVudCkgPT4gZXh0bmFtZShlbGVtZW50KSAhPT0gJy5jc3MnKTtcbiAgICAgIC8vIElmIHRoZSBsZW5ndGggaXMgemVybyB0aGVuIHRoZXJlIGFyZSB0d28gb3IgbW9yZSBjc3MgZmlsZXNcbiAgICAgIC8vIElmIHRoZSBsZW5ndGggaXMgbW9yZSB0aGFuIG9uZSB0aGFuIHRoZXJlIGFyZSB0d28gb3IgbW9yZSBzYXNzL3Njc3MgZmlsZXNcbiAgICAgIGlmIChmb3VuZFdpdGhvdXRDc3MubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQW1iaWd1b3VzIGltcG9ydCBkZXRlY3RlZC4nKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJuIHRoZSBub24tQ1NTIGZpbGUgKHNhc3Mvc2NzcyBmaWxlcyBoYXZlIHByaW9yaXR5KVxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3Nhc3MvZGFydC1zYXNzL2Jsb2IvNDRkNmJiNmFjNzJmZTZiOTNmNWJmZWMzNzFhMWZmZmIxOGU2Yjc2ZC9saWIvc3JjL2ltcG9ydGVyL3V0aWxzLmRhcnQjTDQ0LUw0N1xuICAgICAgcmV0dXJuIGZvdW5kV2l0aG91dENzc1swXTtcbiAgICB9XG5cbiAgICByZXR1cm4gZm91bmRbMF07XG4gIH1cbn1cblxuLyoqXG4gKiBQcm92aWRlcyB0aGUgU2FzcyBpbXBvcnRlciBsb2dpYyB0byByZXNvbHZlIG1vZHVsZSAobnBtIHBhY2thZ2UpIHN0eWxlc2hlZXQgaW1wb3J0cyB2aWEgYm90aCBpbXBvcnQgYW5kXG4gKiB1c2UgcnVsZXMgYW5kIGFsc28gcmViYXNlIGFueSBgdXJsKClgIGZ1bmN0aW9uIHVzYWdlIHdpdGhpbiB0aG9zZSBzdHlsZXNoZWV0cy4gVGhlIHJlYmFzaW5nIHdpbGwgZW5zdXJlIHRoYXRcbiAqIHRoZSBVUkxzIGluIHRoZSBvdXRwdXQgb2YgdGhlIFNhc3MgY29tcGlsZXIgcmVmbGVjdCB0aGUgZmluYWwgZmlsZXN5c3RlbSBsb2NhdGlvbiBvZiB0aGUgb3V0cHV0IENTUyBmaWxlLlxuICovXG5leHBvcnQgY2xhc3MgTW9kdWxlVXJsUmViYXNpbmdJbXBvcnRlciBleHRlbmRzIFJlbGF0aXZlVXJsUmViYXNpbmdJbXBvcnRlciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGVudHJ5RGlyZWN0b3J5OiBzdHJpbmcsXG4gICAgZGlyZWN0b3J5Q2FjaGU6IE1hcDxzdHJpbmcsIERpcmVjdG9yeUVudHJ5PixcbiAgICByZWJhc2VTb3VyY2VNYXBzOiBNYXA8c3RyaW5nLCBSYXdTb3VyY2VNYXA+IHwgdW5kZWZpbmVkLFxuICAgIHByaXZhdGUgZmluZGVyOiBGaWxlSW1wb3J0ZXI8J3N5bmMnPlsnZmluZEZpbGVVcmwnXSxcbiAgKSB7XG4gICAgc3VwZXIoZW50cnlEaXJlY3RvcnksIGRpcmVjdG9yeUNhY2hlLCByZWJhc2VTb3VyY2VNYXBzKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGNhbm9uaWNhbGl6ZSh1cmw6IHN0cmluZywgb3B0aW9uczogeyBmcm9tSW1wb3J0OiBib29sZWFuIH0pOiBVUkwgfCBudWxsIHtcbiAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJ2ZpbGU6Ly8nKSkge1xuICAgICAgcmV0dXJuIHN1cGVyLmNhbm9uaWNhbGl6ZSh1cmwsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZmluZGVyKHVybCwgb3B0aW9ucyk7XG5cbiAgICByZXR1cm4gcmVzdWx0ID8gc3VwZXIuY2Fub25pY2FsaXplKHJlc3VsdC5ocmVmLCBvcHRpb25zKSA6IG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm92aWRlcyB0aGUgU2FzcyBpbXBvcnRlciBsb2dpYyB0byByZXNvbHZlIGxvYWQgcGF0aHMgbG9jYXRlZCBzdHlsZXNoZWV0IGltcG9ydHMgdmlhIGJvdGggaW1wb3J0IGFuZFxuICogdXNlIHJ1bGVzIGFuZCBhbHNvIHJlYmFzZSBhbnkgYHVybCgpYCBmdW5jdGlvbiB1c2FnZSB3aXRoaW4gdGhvc2Ugc3R5bGVzaGVldHMuIFRoZSByZWJhc2luZyB3aWxsIGVuc3VyZSB0aGF0XG4gKiB0aGUgVVJMcyBpbiB0aGUgb3V0cHV0IG9mIHRoZSBTYXNzIGNvbXBpbGVyIHJlZmxlY3QgdGhlIGZpbmFsIGZpbGVzeXN0ZW0gbG9jYXRpb24gb2YgdGhlIG91dHB1dCBDU1MgZmlsZS5cbiAqL1xuZXhwb3J0IGNsYXNzIExvYWRQYXRoc1VybFJlYmFzaW5nSW1wb3J0ZXIgZXh0ZW5kcyBSZWxhdGl2ZVVybFJlYmFzaW5nSW1wb3J0ZXIge1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbnRyeURpcmVjdG9yeTogc3RyaW5nLFxuICAgIGRpcmVjdG9yeUNhY2hlOiBNYXA8c3RyaW5nLCBEaXJlY3RvcnlFbnRyeT4sXG4gICAgcmViYXNlU291cmNlTWFwczogTWFwPHN0cmluZywgUmF3U291cmNlTWFwPiB8IHVuZGVmaW5lZCxcbiAgICBwcml2YXRlIGxvYWRQYXRoczogSXRlcmFibGU8c3RyaW5nPixcbiAgKSB7XG4gICAgc3VwZXIoZW50cnlEaXJlY3RvcnksIGRpcmVjdG9yeUNhY2hlLCByZWJhc2VTb3VyY2VNYXBzKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGNhbm9uaWNhbGl6ZSh1cmw6IHN0cmluZywgb3B0aW9uczogeyBmcm9tSW1wb3J0OiBib29sZWFuIH0pOiBVUkwgfCBudWxsIHtcbiAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJ2ZpbGU6Ly8nKSkge1xuICAgICAgcmV0dXJuIHN1cGVyLmNhbm9uaWNhbGl6ZSh1cmwsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSBudWxsO1xuICAgIGZvciAoY29uc3QgbG9hZFBhdGggb2YgdGhpcy5sb2FkUGF0aHMpIHtcbiAgICAgIHJlc3VsdCA9IHN1cGVyLmNhbm9uaWNhbGl6ZShwYXRoVG9GaWxlVVJMKGpvaW4obG9hZFBhdGgsIHVybCkpLmhyZWYsIG9wdGlvbnMpO1xuICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG5cbi8qKlxuICogV29ya2Fyb3VuZCBmb3IgU2FzcyBub3QgY2FsbGluZyBpbnN0YW5jZSBtZXRob2RzIHdpdGggYHRoaXNgLlxuICogVGhlIGBjYW5vbmljYWxpemVgIGFuZCBgbG9hZGAgbWV0aG9kcyB3aWxsIGJlIGJvdW5kIHRvIHRoZSBjbGFzcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSBpbXBvcnRlciBBIFNhc3MgaW1wb3J0ZXIgdG8gYmluZC5cbiAqIEByZXR1cm5zIFRoZSBib3VuZCBTYXNzIGltcG9ydGVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2Fzc0JpbmRXb3JrYXJvdW5kPFQgZXh0ZW5kcyBJbXBvcnRlcj4oaW1wb3J0ZXI6IFQpOiBUIHtcbiAgaW1wb3J0ZXIuY2Fub25pY2FsaXplID0gaW1wb3J0ZXIuY2Fub25pY2FsaXplLmJpbmQoaW1wb3J0ZXIpO1xuICBpbXBvcnRlci5sb2FkID0gaW1wb3J0ZXIubG9hZC5iaW5kKGltcG9ydGVyKTtcblxuICByZXR1cm4gaW1wb3J0ZXI7XG59XG4iXX0=