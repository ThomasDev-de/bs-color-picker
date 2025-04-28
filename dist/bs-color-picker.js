/**
 * Bootstrap Color Picker Plugin
 * A jQuery plugin that creates a color picker component integrated with Bootstrap's styling and components.
 *
 * Features:
 * - Full color spectrum selection with saturation and value controls
 * - Hue and opacity sliders
 * - Multiple color format support (HEX, RGB, RGBA, HSL, HSLA, CMYK)
 * - Real-time color preview
 * - Customizable button styling
 * - Bootstrap 5 compatible
 * - Support for transparency/opacity
 *
 * @requires jQuery 3.x
 * @requires Bootstrap 5.x
 * @requires Bootstrap Icons
 *
 * @version 1.0.0
 * @license Proprietary
 *
 * @example
 * // Basic usage
 * $('#colorPicker').bsColorPicker();
 *
 * // With options
 * $('#colorPicker').bsColorPicker({
 *     btnClass: 'btn-light',
 *     btnText: 'Change color',
 *     format: 'rgba'
 * });
 */
(function ($) {
    "use strict";

    $.bsColorPicker = {
        setDefaults: function (options) {
            this.DEFAULTS = $.extend(true, {}, this.DEFAULTS, options || {});
        },
        getDefaults: function () {
            return this.DEFAULTS;
        },
        DEFAULTS: {
            btnClass: 'btn-outline-secondary',
            btnText: null,
            btnEmptyColor: 'rgba(0, 0, 0, 0.5)',
            format: 'rgba',
            disabled: false,
            icons: {
                check: 'bi bi-check-lg',
                reset: 'bi bi-arrow-clockwise',
                close: 'bi bi-x-lg',
                empty: 'bi bi-trash3'
            },
            debug: false
        },
        utils: {
            /**
             * Retrieves the list of valid output formats for colors.
             *
             * @return {string[]} An array of strings representing valid color output formats,
             * which include 'rgba', 'rgb', 'hsl', 'hsla', and 'hex'.
             */
            getValidOutputFormates() {
                return [
                    'rgba',
                    'rgb',
                    'hsl',
                    'hsla',
                    'hex'
                ];
            },
            /**
             * Validates if the provided format is a valid output format.
             *
             * @param {string} format - The output format to validate.
             * @return {boolean} Returns true if the format is valid, otherwise false.
             */
            isValidOutputFormat(format) {
                return this.getValidOutputFormates().includes(format.toLowerCase());
            },
            /**
             * Checks if a value is empty (null, undefined, empty string or empty array)
             * @param {*} value - The value to check
             * @returns {boolean} True if the value is empty, false otherwise
             */
            isValueEmpty(value) {
                if (value === null || value === undefined) {
                    return true; // Null or undefined
                }
                if (Array.isArray(value)) {
                    return value.length === 0; // Empty array
                }
                if (typeof value === 'string') {
                    return value.trim().length === 0; // Empty string (including only spaces)
                }
                return false; // All other values are considered non-empty (including numbers)
            }, /**
             * Gets the mouse position relative to a canvas element
             * @param {MouseEvent} e - The mouse event object
             * @param {HTMLCanvasElement} canvas - The canvas element
             * @returns {{x: number, y: number}} Object containing x and y coordinates
             */
            getMousePosition(e, canvas) {
                const rect = canvas.getBoundingClientRect();
                // Skalierungsfaktor berechnen
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;

                // Mausposition relativ zur Canvas berechnen und skalieren
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;

                // log('getMousePosition');
                // log('Canvas Position:', rect);
                // log('Canvas Size:', {width: canvas.width, height: canvas.height});
                // log('Mouse Position:', {x, y});
                // log('Scale factors:', {scaleX, scaleY});
                // log('Canvas Dimensions (physical):', {width: canvas.width, height: canvas.height});
                // log('Canvas Dimensions (rendered):', {width: rect.width, height: rect.height});

                return {x, y};
            }, /**
             * Converts CMYK color values to RGB color space
             * @param {{c: number, m: number, y: number, k: number}} color - The CMYK color object
             * @returns {{r: number, g: number, b: number}} The RGB color object
             */
            cmykToRGB({c, m, y, k}) {
                c /= 100;
                m /= 100;
                y /= 100;
                k /= 100;

                const r = Math.round(255 * (1 - c) * (1 - k));
                const g = Math.round(255 * (1 - m) * (1 - k));
                const b = Math.round(255 * (1 - y) * (1 - k));

                return {r, g, b};
            }, /**
             * Converts a hexadecimal color string to RGB color space
             * @param {string} hex - The hexadecimal color string (e.g., "#ff000080")
             * @returns {{r: number, g: number, b: number, a: number}} | null The RGBA color object
             */
            hexToRGBA(hex) {
                hex = hex.replace('#', '');

                // Kurzes HEX-Format (#RGB oder #RGBA) in langes umwandeln (#RRGGBB oder #RRGGBBAA)
                if (hex.length === 3 || hex.length === 4) {
                    hex = hex.split('').map(h => h + h).join('');
                }

                // HEX aufteilen
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                const a = hex.length === 8 ? parseFloat((parseInt(hex.slice(6, 8), 16) / 255).toFixed(2)) : 1;


                // Validierung
                if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
                    console.error('Invalid HEX format');
                    return null;
                }

                // Rückgabe des RGBA-Werts
                return {r, g, b, a};
            }, /**
             * Converts RGB color values to CMYK color space
             * @param {number} r - Red component (0-255)
             * @param {number} g - Green component (0-255)
             * @param {number} b - Blue component (0-255)
             * @returns {{c: number, m: number, y: number, k: number}} The CMYK color object
             */
            RGBtoCMYK(r, g, b) {
                r /= 255;
                g /= 255;
                b /= 255;

                const k = 1 - Math.max(r, g, b);
                const c = (1 - r - k) / (1 - k) || 0;
                const m = (1 - g - k) / (1 - k) || 0;
                const y = (1 - b - k) / (1 - k) || 0;

                return {
                    c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100)
                };
            }, /**
             * Converts RGB color values to HSL color space
             * @param {number} r - Red component (0-255)
             * @param {number} g - Green component (0-255)
             * @param {number} b - Blue component (0-255)
             * @returns {{h: number, s: number, l: number}} The HSL color object
             */
            RGBtoHSL(r, g, b) {
                r /= 255;
                g /= 255;
                b /= 255;

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                let h, s, l = (max + min) / 2;

                if (max === min) {
                    h = s = 0;
                } else {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

                    switch (max) {
                        case r:
                            h = (g - b) / d + (g < b ? 6 : 0);
                            break;
                        case g:
                            h = (b - r) / d + 2;
                            break;
                        case b:
                            h = (r - g) / d + 4;
                            break;
                    }
                    h *= 60;
                }

                return {h, s, l};
            },
            /**
             * Converts HSL color values to RGB color space
             * @param {{h: number, s: number, l: number}} color - The HSL color object
             * @returns {{r: number, g: number, b: number}} The RGB color object
             */
            hslToRGB({h, s, l}, debug = false) {
                if (debug) {
                    console.log('----------------- hslToRGB -----------------');
                    console.log('Input:', {h, s, l}); // Eingabewerte prüfen
                }
                let r, g, b;

                // Validierung hinzufügen
                if (h === undefined || s === undefined || l === undefined) {
                    if (debug) {
                        console.error('Ungültige HSL-Werte:', {h, s, l});
                    }
                    return {r: 0, g: 0, b: 0}; // Standardwert zurückgeben
                }

                if (s === 0) {
                    r = g = b = l;
                    if (debug) {
                        console.log('Grayscale:', {r, g, b});
                    }
                } else {
                    const hue2rgb = (p, q, t) => {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1 / 6) return p + (q - p) * 6 * t;
                        if (t < 1 / 2) return q;
                        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                        return p;
                    };

                    // Farbwerte berechnen
                    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    const p = 2 * l - q;

                    if (debug) {
                        console.log('Intermediate values:', {q, p});
                    }

                    r = hue2rgb(p, q, (h / 360 + 1 / 3));
                    g = hue2rgb(p, q, (h / 360));
                    b = hue2rgb(p, q, (h / 360 - 1 / 3));

                    if (debug) {
                        console.log('Calculated RGB:', {r, g, b});
                    }
                }

                // Ergebnisse skalieren
                const result = {
                    r: Math.round(r * 255),
                    g: Math.round(g * 255),
                    b: Math.round(b * 255)
                };

                if (debug) {
                    console.log('Final RGB:', result);
                    console.log('----------------- hslToRGB completed -----------------');
                }

                return result;
            },
            /**
             * Converts RGB color values to HSV color space
             * @param {number} r - Red component (0-255)
             * @param {number} g - Green component (0-255)
             * @param {number} b - Blue component (0-255)
             * @returns {{h: number, s: number, v: number}} The HSV color object
             */
            RGBtoHSV(r, g, b) {
                r /= 255;
                g /= 255;
                b /= 255;

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const d = max - min;
                let h, s = (max === 0 ? 0 : d / max), v = max;

                if (max === min) {
                    h = 0;
                } else {
                    switch (max) {
                        case r:
                            h = (g - b) / d + (g < b ? 6 : 0);
                            break;
                        case g:
                            h = (b - r) / d + 2;
                            break;
                        case b:
                            h = (r - g) / d + 4;
                            break;
                    }
                    h *= 60;
                }

                return {h, s, v};
            }, /**
             * Converts HSV color values to RGB color space
             * @param {number} h - Hue component (0-360)
             * @param {number} s - Saturation component (0-1)
             * @param {number} v - Value component (0-1)
             * @returns {{r: number, g: number, b: number}} The RGB color object
             */
            HSVtoRGB(h, s, v) {
                let r, g, b;
                const i = Math.floor(h / 60);
                const f = h / 60 - i;
                const p = v * (1 - s);
                const q = v * (1 - f * s);
                const t = v * (1 - (1 - f) * s);

                switch (i % 6) {
                    case 0:
                        r = v;
                        g = t;
                        b = p;
                        break;
                    case 1:
                        r = q;
                        g = v;
                        b = p;
                        break;
                    case 2:
                        r = p;
                        g = v;
                        b = t;
                        break;
                    case 3:
                        r = p;
                        g = q;
                        b = v;
                        break;
                    case 4:
                        r = t;
                        g = p;
                        b = v;
                        break;
                    case 5:
                        r = v;
                        g = p;
                        b = q;
                        break;
                }

                return {
                    r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)
                };
            }, /**
             * Converts RGB color values to hexadecimal color string
             * @param {number} r - Red component (0-255)
             * @param {number} g - Green component (0-255)
             * @param {number} b - Blue component (0-255)
             * @returns {string} The hexadecimal color string (e.g., "#ff0000")
             */
            RGBtoHex(r, g, b, a = 1) {
                const toHex = (n) => {
                    const hex = Math.round(n).toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };

                const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

                // Nur anhängen, wenn alpha kleiner als 1
                if (a < 1) {
                    const alphaHex = toHex(Math.round(a * 255)); // Alpha in 2-stellige HEX umrechnen
                    return hexColor + alphaHex;
                }

                return hexColor;
            },
            getColorNames() {
                return {
                    aliceblue: "#f0f8ff",
                    antiquewhite: "#faebd7",
                    aqua: "#00ffff",
                    aquamarine: "#7fffd4",
                    azure: "#f0ffff",
                    beige: "#f5f5dc",
                    bisque: "#ffe4c4",
                    black: "#000000",
                    blanchedalmond: "#ffebcd",
                    blue: "#0000ff",
                    blueviolet: "#8a2be2",
                    brown: "#a52a2a",
                    burlywood: "#deb887",
                    cadetblue: "#5f9ea0",
                    chartreuse: "#7fff00",
                    chocolate: "#d2691e",
                    coral: "#ff7f50",
                    cornflowerblue: "#6495ed",
                    cornsilk: "#fff8dc",
                    crimson: "#dc143c",
                    cyan: "#00ffff",
                    darkblue: "#00008b",
                    darkcyan: "#008b8b",
                    darkgoldenrod: "#b8860b",
                    darkgray: "#a9a9a9",
                    darkgreen: "#006400",
                    darkgrey: "#a9a9a9", // British English synonym
                    darkkhaki: "#bdb76b",
                    darkmagenta: "#8b008b",
                    darkolivegreen: "#556b2f",
                    darkorange: "#ff8c00",
                    darkorchid: "#9932cc",
                    darkred: "#8b0000",
                    darksalmon: "#e9967a",
                    darkseagreen: "#8fbc8f",
                    darkslateblue: "#483d8b",
                    darkslategray: "#2f4f4f",
                    darkslategrey: "#2f4f4f", // British English synonym
                    darkturquoise: "#00ced1",
                    darkviolet: "#9400d3",
                    deeppink: "#ff1493",
                    deepskyblue: "#00bfff",
                    dimgray: "#696969",
                    dimgrey: "#696969", // British English synonym
                    dodgerblue: "#1e90ff",
                    firebrick: "#b22222",
                    floralwhite: "#fffaf0",
                    forestgreen: "#228b22",
                    fuchsia: "#ff00ff",
                    gainsboro: "#dcdcdc",
                    ghostwhite: "#f8f8ff",
                    gold: "#ffd700",
                    goldenrod: "#daa520",
                    gray: "#808080",
                    green: "#008000",
                    greenyellow: "#adff2f",
                    grey: "#808080", // British English synonym
                    honeydew: "#f0fff0",
                    hotpink: "#ff69b4",
                    indianred: "#cd5c5c",
                    indigo: "#4b0082",
                    ivory: "#fffff0",
                    khaki: "#f0e68c",
                    lavender: "#e6e6fa",
                    lavenderblush: "#fff0f5",
                    lawngreen: "#7cfc00",
                    lemonchiffon: "#fffacd",
                    lightblue: "#add8e6",
                    lightcoral: "#f08080",
                    lightcyan: "#e0ffff",
                    lightgoldenrodyellow: "#fafad2",
                    lightgray: "#d3d3d3",
                    lightgreen: "#90ee90",
                    lightgrey: "#d3d3d3", // British English synonym
                    lightpink: "#ffb6c1",
                    lightsalmon: "#ffa07a",
                    lightseagreen: "#20b2aa",
                    lightskyblue: "#87cefa",
                    lightslategray: "#778899",
                    lightslategrey: "#778899", // British English synonym
                    lightsteelblue: "#b0c4de",
                    lightyellow: "#ffffe0",
                    lime: "#00ff00",
                    limegreen: "#32cd32",
                    linen: "#faf0e6",
                    magenta: "#ff00ff",
                    maroon: "#800000",
                    mediumaquamarine: "#66cdaa",
                    mediumblue: "#0000cd",
                    mediumorchid: "#ba55d3",
                    mediumpurple: "#9370db",
                    mediumseagreen: "#3cb371",
                    mediumslateblue: "#7b68ee",
                    mediumspringgreen: "#00fa9a",
                    mediumturquoise: "#48d1cc",
                    mediumvioletred: "#c71585",
                    midnightblue: "#191970",
                    mintcream: "#f5fffa",
                    mistyrose: "#ffe4e1",
                    moccasin: "#ffe4b5",
                    navajowhite: "#ffdead",
                    navy: "#000080",
                    oldlace: "#fdf5e6",
                    olive: "#808000",
                    olivedrab: "#6b8e23",
                    orange: "#ffa500",
                    orangered: "#ff4500",
                    orchid: "#da70d6",
                    palegoldenrod: "#eee8aa",
                    palegreen: "#98fb98",
                    paleturquoise: "#afeeee",
                    palevioletred: "#db7093",
                    papayawhip: "#ffefd5",
                    peachpuff: "#ffdab9",
                    peru: "#cd853f",
                    pink: "#ffc0cb",
                    plum: "#dda0dd",
                    powderblue: "#b0e0e6",
                    purple: "#800080",
                    rebeccapurple: "#663399",
                    red: "#ff0000",
                    rosybrown: "#bc8f8f",
                    royalblue: "#4169e1",
                    saddlebrown: "#8b4513",
                    salmon: "#fa8072",
                    sandybrown: "#f4a460",
                    seagreen: "#2e8b57",
                    seashell: "#fff5ee",
                    sienna: "#a0522d",
                    silver: "#c0c0c0",
                    skyblue: "#87ceeb",
                    slateblue: "#6a5acd",
                    slategray: "#708090",
                    slategrey: "#708090", // British English synonym
                    snow: "#fffafa",
                    springgreen: "#00ff7f",
                    steelblue: "#4682b4",
                    tan: "#d2b48c",
                    teal: "#008080",
                    thistle: "#d8bfd8",
                    tomato: "#ff6347",
                    turquoise: "#40e0d0",
                    violet: "#ee82ee",
                    wheat: "#f5deb3",
                    white: "#ffffff",
                    whitesmoke: "#f5f5f5",
                    yellow: "#ffff00",
                    yellowgreen: "#9acd32"
                };
            },
            colorNameToHex(colorName) {
                const color = colorName.toLowerCase();
                const colorNames = this.getColorNames();
                if (colorNames[color]) {
                    return colorNames[color];
                }
                return null;
            },
            /**
             * Converts a custom color input into various color formats such as RGB, HSV, HSL, CMYK, and HEX.
             * It also extracts the alpha (transparency) value and rounds it to 2 decimal places if not 1.
             *
             * @param {string} customColor - The input color in various formats (e.g., HEX, RGB, RGBA, HSL, HSLA, or named colors).
             * @returns {Object|null} An object containing the color in various formats or null if the input is invalid.
             *
             * Formats returned:
             * - hex: HEX representation of the color (e.g., #rrggbb or #rrggbbaa)
             * - rgb: RGB representation (e.g., {r: 255, g: 255, b: 255, a: 1})
             * - hsv: HSV representation (e.g., {h: 0, s: 1, v: 1, a: 1})
             * - hsl: HSL representation (e.g., {h: 0, s: 1, l: 0.5, a: 1})
             * - cmyk: CMYK representation (e.g., {c: 0, m: 0, y: 0, k: 0})
             * - alpha: The alpha (transparency) value rounded to 2 decimal places if needed.
             */
            convertColorFormats(customColor, debug = false) {
                if (debug) {
                    console.log('----------------- convertColorFormats -----------------');
                    console.log("convertColorFormats", customColor);
                }
                if (!customColor) {
                    return null;
                }
                try {
                    let rgb = null;
                    let rgba = null;
                    let hsv = null;
                    let hsl = null;
                    let hsla = null;
                    let alpha = 1;

                    if (typeof customColor === "string") {
                        if (debug) {
                            console.log("customColor is a string", customColor);
                        }

                        // Kontrollierte Korrektur für bekannte Tippfehler
                        customColor = customColor.trim();
                        if (customColor.startsWith("rbga")) {
                            customColor = customColor.replace("rbga", "rgba");
                            if (debug) {
                                console.warn("Corrected minor typo: rbga -> rgba", customColor);
                            }
                        }


                        // HEX Color Handling
                        if (customColor.startsWith("#")) {
                            if (debug) {
                                console.log("customColor starts with #");
                            }
                            const testHex = $.bsColorPicker.utils.hexToRGBA(customColor);
                            if (testHex) {
                                rgb = {
                                    r: testHex.r,
                                    g: testHex.g,
                                    b: testHex.b,
                                };
                                rgba = {
                                    ...rgb,
                                    a: testHex.a,
                                };
                                alpha = testHex.a;
                                if (debug) {
                                    console.log("hex -> rgb =", rgb);
                                    console.log("hex -> rgba =", rgba);
                                    console.log("hex -> alpha =", alpha);
                                }
                            }
                        }
                        // RGBA or RGB Color Handling
                        else if (customColor.includes(",")) {
                            if (debug) {
                                console.log("customColor includes ,");
                            }
                            // Check for RGBA format
                            const rgbaMatch = customColor.match(
                                /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*((?:0?\.\d+)|1|0)\s*)?\)/
                            );

                            if (rgbaMatch) {
                                const r = parseInt(rgbaMatch[1]);
                                const g = parseInt(rgbaMatch[2]);
                                const b = parseInt(rgbaMatch[3]);
                                const a =
                                    rgbaMatch[4] !== undefined &&
                                    !isNaN(parseFloat(rgbaMatch[4]))
                                        ? parseFloat(rgbaMatch[4])
                                        : 1;

                                // Validations for RGBA values
                                if (
                                    r < 0 ||
                                    r > 255 ||
                                    g < 0 ||
                                    g > 255 ||
                                    b < 0 ||
                                    b > 255 ||
                                    a < 0 ||
                                    a > 1
                                ) {
                                    console.error("RGBA values out of range:", rgbaMatch);
                                    return null;
                                }

                                if (debug) {
                                    console.log("RGBA values:", {r, g, b, a});
                                }

                                alpha = parseFloat(a.toFixed(2));
                                rgb = {r, g, b};
                                rgba = {
                                    ...rgb,
                                    a: alpha,
                                };
                            } else {
                                // Check for HSLA format
                                const hslaMatch = customColor.match(
                                    /hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*(0|0?\.\d+|1))?\)/
                                );

                                if (hslaMatch) {
                                    const h = parseInt(hslaMatch[1], 10);
                                    const s = parseInt(hslaMatch[2], 10) / 100;
                                    const l = parseInt(hslaMatch[3], 10) / 100;
                                    const a =
                                        hslaMatch[4] !== undefined &&
                                        !isNaN(parseFloat(hslaMatch[4]))
                                            ? parseFloat(hslaMatch[4])
                                            : 1;

                                    // Validations for HSLA values
                                    if (
                                        h < 0 ||
                                        h >= 360 ||
                                        s < 0 ||
                                        s > 1 ||
                                        l < 0 ||
                                        l > 1 ||
                                        a < 0 ||
                                        a > 1
                                    ) {
                                        console.error("HSLA values out of range:", hslaMatch);
                                        return null;
                                    }

                                    if (debug) {
                                        console.log("HSLA values:", {h, s, l, a});
                                    }

                                    alpha = parseFloat(a.toFixed(2));
                                    hsl = {
                                        h: h,
                                        s: s,
                                        l: l,
                                    };
                                    hsla = {
                                        ...hsl,
                                        a: alpha,
                                    };

                                    if (debug) {
                                        console.log("hsla -> hsl =", hsl);
                                        console.log("hsla -> alpha =", hsla.a);
                                    }

                                    // Convert HSL to RGB
                                    rgb = $.bsColorPicker.utils.hslToRGB(hsl, debug);
                                    if (rgb) {
                                        rgba = {
                                            ...rgb,
                                            a: alpha,
                                        };

                                        if (debug) {
                                            console.log("hsl -> rgb =", rgb);
                                            console.log("hsla -> rgba =", rgba);
                                        }
                                    }
                                }
                            }
                        }
                        // Handle named colors (e.g., "red", "blue")
                        else {
                            if (debug) {
                                console.log("customColor is a unknown string");
                            }
                            const namedColorHex = this.colorNameToHex(customColor);
                            if (namedColorHex) {
                                return this.convertColorFormats(namedColorHex, debug);
                            }
                            const temp = document.createElement("div");
                            temp.style.color = customColor;
                            document.body.appendChild(temp);
                            const computedColor = window.getComputedStyle(temp).color;
                            document.body.removeChild(temp);

                            if (debug) {
                                console.log("computedColor:", computedColor);
                            }

                            if (!computedColor || computedColor === customColor) {
                                console.error("Potential infinite loop detected. Aborting.");
                                return null;
                            }

                            return this.convertColorFormats(computedColor, debug);
                        }
                    }

                    // Convert RGB to HSV if not already calculated
                    if (rgb && !hsv) {
                        hsv = $.bsColorPicker.utils.RGBtoHSV(rgb.r, rgb.g, rgb.b);
                        if (debug) {
                            console.log("rgb -> hsv =", hsv);
                        }
                    }

                    // Convert RGB to HSL if not already calculated
                    if (rgb && !hsl) {
                        hsl = $.bsColorPicker.utils.RGBtoHSL(rgb.r, rgb.g, rgb.b);
                        hsla = {
                            ...hsl,
                            a: alpha,
                        };
                        if (debug) {
                            console.log("rgb -> hsl =", hsl);
                            console.log("rgb -> hsla =", hsla);
                        }
                    }

                    // CMYK conversion
                    const cmyk = rgb
                        ? $.bsColorPicker.utils.RGBtoCMYK(rgb.r, rgb.g, rgb.b)
                        : null;
                    if (debug) {
                        console.log("rgb -> cmyk =", cmyk);
                    }

                    // Generate HEX if RGB exists
                    const hex = rgba
                        ? $.bsColorPicker.utils.RGBtoHex(rgba.r, rgba.g, rgba.b, rgba.a)
                        : null;
                    if (debug) {
                        console.log("rgb -> hex =", hex);
                    }

                    // Return all color formats
                    const returnData = {
                        hex,
                        rgb,
                        rgba,
                        hsv,
                        hsl,
                        hsla,
                        cmyk,
                        alpha,
                    };
                    if (debug) {
                        console.log("returnData =", returnData);
                        console.log('----------------- convertColorFormats completed -----------------');
                    }
                    return returnData;
                } catch (e) {
                    if (debug) {
                        console.error(
                            "Invalid color format in function convertColorFormats:",
                            e
                        );
                        console.log('----------------- convertColorFormats completed -----------------');
                    }
                    return null;
                }
            }
        }
    };

    const classDropdown = 'bs-color-picker-dropdown';
    const classDropdownButton = 'bs-color-picker-dropdown-button';
    const classElement = 'bs-color-picker-element';
    const submitBtnClass = 'bs-color-picker-btn-submit';
    const classCanvas = 'bs-color-picker-canvas';
    const classInputs = 'bs-color-picker-inputs';
    const markerClass = 'bs-color-picker-marker';
    const previewClass = 'bs-color-picker-preview';
    const brightnessSliderClass = 'bs-color-picker-brightness-slider';
    const opacitySliderClass = 'bs-color-picker-opacity-slider';


    $.fn.bsColorPicker = function (optionsOrMethod, params) {
        // Check if there are items
        if (this.length === 0) {
            return this; // Just return the jQuery object, but don't do any further logic
        }

        // Check if the jQuery object (`this`) contains more than one element
        if ($(this).length > 1) {
            // If there are multiple elements, iterate over each element in the collection
            return $(this).each(function (i, el) {
                // For each element, call the bsColorPicker plugin on the individual element
                // This ensures that the plugin is initialized for each element separately
                return $(el).bsColorPicker(optionsOrMethod, params);
            });
        }

        const optionsGiven = typeof optionsOrMethod === 'object';
        const methodGiven = typeof optionsOrMethod === 'string';

        const $element = $(this);
        let settings;
        let isInitialized = $element.data('initBsColorPicker') === true;
        let updateOptionAgain = isInitialized && optionsGiven;

        if (!isInitialized) {
            $element.addClass(classElement);
            // immediately switch to initialized, so that a multiple call is as good as impossible
            $element.data('initBsColorPicker', true);
            // Save the input type for recovery
            if (!$element.data('before')) {
                $element.data('before', {
                    type: $element.attr('type')
                });
            }
            // Assemble the settings from the standards, the element data and the passed options
            settings = $.bsColorPicker.getDefaults();
            const dataAttributes = $element.data();

            if (dataAttributes || optionsGiven) {
                settings = $.extend(true, {}, settings, optionsOrMethod || {}, dataAttributes || {});
            }

            setSettings($element, settings);

            const vars = {
                bootstrapVersion: getBootstrapVersion(),
                size: 200, // Farbfeld
                previewSize: 50, // Vorschau
                sliderWidth: 14, // width of slider hue & opacity
                padding: 10, // padding between elements
                currentHue: 0, // current hue value
                currentOpacity: 1, // current opacity value
                currentSaturation: 1, // current saturation value
                currentValue: 1,
                activeControl: null // currently active control (color, hue, opacity)
            };

            $element.data('vars', vars);

            if ($element.is('input') && $element.attr('type') !== 'hidden') {
                $element.attr('type', 'hidden');
            }

            init($element).then(() => {
                if (!$element.data('ignoreEvents')) {
                    trigger($element, 'init');
                } else {
                    $element.removeData('ignoreEvents');
                }
                if (settings.debug) {
                    log('Init completed');
                }
            });

        } else {
            settings = getSettings($element);
        }

        let returnValue = $element;
        if (updateOptionAgain) {
            $element.data('ignoreEvents', true)
            methodUpdateOptions($element, optionsOrMethod);
        } else if (methodGiven) {
            switch (optionsOrMethod) {
                case 'val': {
                    const set = !$.bsColorPicker.utils.isValueEmpty(params);
                    if (set) {
                        setValue($element, params, true, true);
                    } else {
                        returnValue = getOutputFormat($element);
                    }
                    break;
                }
                case 'getColor': {
                    const selectedColorSet = $element.data('selected');
                    returnValue = selectedColorSet || null;
                    break;
                }
                case 'updateOptions': {
                    $element.data('ignoreEvents', true)
                    methodUpdateOptions($element, params);
                    break;
                }
                case 'destroy': {
                    destroy($element, true);
                    break;
                }
                default: {
                    trigger($element,'error', 'Unknown method: ' + optionsOrMethod);
                    break;
                }
            }
        }

        return returnValue;
    };

    function destroy($element, makeVisible) {
        const settings = getSettings($element);
        if (settings.debug) {
            log('destroy called');
        }
        // Get the corresponding dropdown, which contains the color picker
        const dropdown = getDropdown($element);

        // Check if a dropdown exists
        if (dropdown && dropdown.length > 0) {
            if (settings.debug) {
                log('Dropdown found. Remove the item and the dropdown.');
            }

            // Detach the hidden $element from the drop-down and place it in front of it
            dropdown.before($element); // Move $element in front of the dropdown
            dropdown.remove(); // Remove the dropdown itself from the DOM
        } else {
            if (settings.debug) {
                log('No dropdown found for the item.');
            }
        }

        if (makeVisible) {
            // Reset original item
            const before = $element.data('before');
            $element.attr('type', before.type).show(); // Reset the type
            $element.removeData('before');
        }
        // Remove all specific data
        $element.removeClass(classElement);
        $element.removeData('initBsColorPicker');
        $element.removeData('vars');
        // $element.removeData('selected');
        $element.removeData('settings');
        if (settings.debug) {
            log('Element has been completely reset:', $element);
        }
    }

    function methodUpdateOptions($element, options) {
        let settings = getSettings($element);
        const debug = settings.debug;
        if (debug) {
            log('updateOptions called', options);
        }
        if (typeof options === 'object') {
            if (options.hasOwnProperty('debug') && typeof options.debug === 'boolean') {
                settings.debug = options.debug;
                setSettings($element, settings);
                settings = getSettings($element);
            }
            if (options.hasOwnProperty('format')) {
                const newFormat = options.format.toLowerCase();
                if ($.bsColorPicker.utils.isValidOutputFormat(options.format)) {
                    if (settings.format !== newFormat) {
                        settings.format = newFormat;
                        setSettings($element, settings);
                        let newValue = getOutputFormat($element);
                        if (settings.debug) {
                            log(`setValue newValue to format (${newFormat}) =`, newValue);
                        }
                        $element.val(newValue);
                        trigger($element, 'change', newValue);
                        settings = getSettings($element);
                    } else {
                        if (debug) {
                            log('format is already set to', settings.format);
                        }
                    }
                    settings.format = options.format.toLowerCase();
                    setSettings($element, settings);
                    settings = getSettings($element);
                } else {
                    trigger($element, 'error', 'Invalid format. Please use one of the following: ' + $.bsColorPicker.utils.getValidOutputFormates().join(', '));
                    if (debug) {
                        log('Invalid format:', options.format);
                    }
                }

            }
            if (options.hasOwnProperty('btnText')) {
                settings.btnText = options.btnText;
                setSettings($element, settings);
                getDropdownButton($element)
                    .find('.' + classDropdownButton)
                    .html(settings.btnText || '');
                settings = getSettings($element);
            }
            if (options.hasOwnProperty('btnClass')) {
                const btnClassBefore = settings.btnClass;
                settings.btnClass = options.btnClass;
                setSettings($element, settings);
                getDropdownButton($element)
                    .removeClass(btnClassBefore)
                    .addClass(settings.btnClass);
                settings = getSettings($element);
            }
            if (options.hasOwnProperty('disabled') && typeof options.disabled === 'boolean') {
                settings.disabled = options.disabled;
                setSettings($element, settings);
                if (settings.disabled) {
                    getDropdownButton($element).not('.disabled').addClass('disabled');
                    $element.attr('disabled', 'disabled');
                } else {
                    getDropdownButton($element).removeClass('disabled');
                    $element.removeAttr('disabled');
                }
                settings = getSettings($element);
            }
            // old
            // const newSettings = $.extend(true, {}, $.bsColorPicker.getDefaults(), settings, options);
            // if (debug) {
            //     log('New settings:', newSettings);
            // }
            // destroy($element, false);
            // $element.bsColorPicker(newSettings);
        } else {
            trigger($element, 'error', 'Invalid options on method updateOptions. Options must be an object.');
        }
        if (debug) {
            log('updateOptions completed');
        }
    }

    /**
     * Retrieves the value from a given element and checks if it's empty.
     * Returns null if the value is empty, otherwise returns the value.
     *
     * @param {jQuery} $element - The jQuery object of the related element.
     * @returns {string|null} The value of the element or null if the value is empty.
     */
    function getValueFromElement($element) {
        const settings = getSettings($element);
        if (settings.debug) {
            log('getValueFromElement called');
        }
        const value = $element.attr('value');
        if (settings.debug) {
            log('getValueFromElement value =', value);
        }
        const returnValue = $.bsColorPicker.utils.isValueEmpty(value) ? null : value;
        if (settings.debug) {
            log('getValueFromElement returnValue =', returnValue);
            log('getValueFromElement completed')
        }

        return returnValue;
    }


    /**
     * Logs a message to the browser's console with a custom prefix.
     *
     * @param {string} message - The main log message to display.
     * @param {...any} params - Additional parameters to log with the message.
     */
    function log(message, ...params) {
        if (window.console && window.console.log) {
            window.console.log('bsColorPicker LOG: ' + message, ...params);
        }
    }

    /**
     * Calculates the total width of the canvas for the given element.
     *
     * The calculation includes values such as preview size, padding, size, and slider width.
     *
     * @param {jQuery} $element - The jQuery object of the related element.
     * @returns {number} The total width of the canvas.
     */
    function calcTotalWidth($element) {
        const settings = getSettings($element);
        if (settings.debug) {
            log('calcTotalWidth called');
        }
        const vars = getVars($element);
        // Total width calculation formula:
        // total = previewSize + padding + size + padding + sliderWidth + padding + sliderWidth
        // Example: 308 = 50 + 10 + 200 + 10 + 14 + 10 + 14
        const total = vars.previewSize + vars.padding + vars.size + vars.padding + vars.sliderWidth + vars.padding + vars.sliderWidth;
        if (settings.debug) {
            log('calcTotalWidth total =', total);
            log('calcTotalWidth completed')
        }
        return total;
    }

    /**
     * Sets the 'settings' data attribute for the given element.
     * Optionally logs the settings if the debug mode is enabled.
     *
     * @param {jQuery} $element - The jQuery object of the related element.
     * @param {Object} settings - The settings object to store in the data attribute.
     */
    function setSettings($element, settings) {
        if (settings.debug) {
            log('setSettings called', settings);
        }
        $element.data('settings', settings);
        if (settings.debug) {
            log('setSettings completed');
        }
    }

    /**
     * Retrieves settings stored in the data attributes of the given element.
     *
     * @param {jQuery} $element - The jQuery object of the related element.
     * @returns {*} The data stored under the 'settings' key in the element.
     */
    function getSettings($element) {
        return $element.data('settings');
    }

    /**
     * Sets a specific property within the 'vars' data attribute of the given element.
     *
     * @param {jQuery} $element - The jQuery object of the related element.
     * @param {string} prop - The property name to set or update.
     * @param {*} value - The value to assign to the specified property.
     */
    function setVar($element, prop, value) {
        const settings = getSettings($element);
        if (settings.debug) {
            log('setVar called');
        }
        const vars = getVars($element);
        vars[prop] = value;
        if (settings.debug) {
            log('Set var', prop, '=', value, 'vars =', vars);
        }
        $element.data('vars', vars);
        if (settings.debug) {
            log('setVar completed');
        }
    }

    /**
     * Retrieves variables stored in the data attributes of the given element.
     *
     * @param {jQuery} $element - The jQuery object of the related element.
     * @returns {*} The data stored under the 'vars' key in the element.
     */
    function getVars($element) {
        return $element.data('vars');
    }

    /**
     * Finds the closest dropdown container related to the given element.
     *
     * @param {jQuery} $element - The jQuery object of the related element.
     * @returns {jQuery} The jQuery object of the closest dropdown container.
     */
    function getDropdown($element) {
        return $element.closest('.' + classDropdown);
    }

    function getDropdownButton($element) {
        return getDropdown($element).find('.dropdown-toggle');
    }

    /**
     * Retrieves the canvas element within the dropdown associated with the given element.
     *
     * @param {jQuery} $element - The jQuery object of the related element.
     * @returns {jQuery} The jQuery object of the canvas element within the dropdown.
     */
    function getCanvas($element) {
        return getDropdown($element).find(`.${classCanvas}`);
    }

    /**
     * Retrieves the 2D rendering context of the canvas element associated with the given element.
     *
     * @param {jQuery} $element - The jQuery object of the color picker or related element.
     * @returns {CanvasRenderingContext2D} The 2D context of the associated canvas element.
     */
    function getCanvasContext($element) {
        return getCanvas($element).get(0).getContext('2d');
    }

    /**
     * Resets the color of the given element to its initial value and optionally closes the dropdown.
     *
     * @param {jQuery} $element - The jQuery object of the color picker element.
     * @param {boolean} [closeOpenDropdown=false] - Whether to close the dropdown after resetting the color.
     */
    function resetColor($element, closeOpenDropdown = false, triggerEvent = null) {
        const settings = getSettings($element);
        const dropdown = getDropdown($element);
        if (settings.debug) {
            log('resetColor called', closeOpenDropdown);
        }

        // Retrieve the initial color value from the element
        const value = getValueFromElement($element);

        if (settings.debug) {
            log('resetColor value =', value);
        }
        // Set the element back to its initial value
        setValue($element, value, false, false);

        // Optionally close the dropdown if specified
        if (closeOpenDropdown) {
            closeDropdown($element, dropdown);
        }

        if (triggerEvent) {
            trigger($element, triggerEvent, $element.data('selected'));
        }

        if (settings.debug) {
            log('resetColor completed');
        }
    }

    function closeDropdown($element, $dropdown) {
        // Bootstrap Events auslösen
        trigger($element, 'hide');
        const settings = getSettings($element);
        if (settings.debug) {
            log('closeDropdown called');

        }

        // console.log('closeDropdown', $dropdown);

        // Dropdown-Menu verstecken
        $dropdown
            .removeClass('show')
            .find('.dropdown-menu')
            .removeClass('show');

        // Toggle-Button zurücksetzen
        $dropdown.find('.dropdown-toggle')
            .removeClass('show')
            .attr('aria-expanded', "false");

        // Wichtig: Data-Attribute zurücksetzen
        $dropdown.find('[data-bs-popper]').removeAttr('data-bs-popper');

        // Popper-Instanz zerstören (falls vorhanden)
        if ($dropdown.data('bs.dropdown')) {
            $dropdown.data('bs.dropdown').dispose();
        }

        if (settings.debug) {
            log('closeDropdown completed');
        }
        trigger($element, 'hidden');
    }

    /**
     * Closes all color picker dropdown elements on the page except the specified one.
     *
     * @param {jQuery} $self The dropdown element to exclude from being closed.
     * @return {void} Does not return a value.
     */
    function closeOtherDropdowns($self) {
        console.log('closeOtherDropdowns called');
        console.log('closeOtherDropdowns $self =', $self);
        const $dropdowns = $(document).find('.' + classDropdown).not($self);
        console.log('closeOtherDropdowns other =', $dropdowns.length);
        $dropdowns.each(function (i, dropdown) {
            const $dropdown = $(dropdown);
            const $element = $dropdown.find('.' + classElement);
            closeDropdown($element, $dropdown);
        })
    }

    /**
     * Sets the selected color on the given element, updates its value, and hides the dropdown.
     *
     * @param {jQuery} $element - The jQuery object of the color picker element.
     */
    function setColorOnElement($element) {
        const settings = getSettings($element);
        if (settings.debug) {
            log('setColorOnElement called');
        }
        const dropdown = getDropdown($element); // Get the dropdown associated with the element
        const outputFormat = getOutputFormat($element);
        setValue($element, outputFormat, true, true);

        // Hide the dropdown after setting the value
        closeDropdown($element, dropdown);
        if (settings.debug) {
            log('setColorOnElement completed');
        }
    }

    /**
     * Formats the selected color details into human-readable string formats such as HEX, RGB, RGBA, HSL, and HSLA.
     * All numeric values (e.g., hue, saturation, lightness, and alpha) are rounded appropriately.
     *
     * @param {Object} details - An object containing color information in various formats.
     * @param {string} [details.hex] - The HEX color representation (e.g., #rrggbb or #rrggbbaa).
     * @param {Object} [details.rgb] - The RGB representation (e.g., {r: 255, g: 255, b: 255}).
     * @param {Object} [details.rgba] - The RGBA representation (e.g., {r: 255, g: 255, b: 255, a: 0.5}).
     * @param {Object} [details.hsl] - The HSL representation (e.g., {h: 360, s: 1, l: 0.5}).
     * @param {Object} [details.hsla] - The HSLA representation (e.g., {h: 360, s: 1, l: 0.5, a: 0.5}).
     * @returns {Object} An object containing formatted and rounded color values or an error if no color data is available.
     */
    function formatSelectedToString(details) {
        if (!details) {
            console.error('formatSelectedToString: No color data provided', details);
            return {};
        }
        const {
            hex,
            rgb,
            rgba,
            hsl,
            hsla,
        } = details;

        const result = {};

        // Format HEX if available
        if (hex) {
            result.hex = `${hex}`;
        }

        // Format RGB if available
        if (rgb) {
            const r = Math.round(rgb.r);
            const g = Math.round(rgb.g);
            const b = Math.round(rgb.b);
            result.rgb = `rgb(${r}, ${g}, ${b})`;
        }

        // Format RGBA if available
        if (rgba) {
            const r = Math.round(rgba.r);
            const g = Math.round(rgba.g);
            const b = Math.round(rgba.b);
            const a = parseFloat(rgba.a.toFixed(2)); // Round alpha to 2 decimal places
            result.rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
        }

        // Format HSL/HSLA if available
        if (hsl) {
            const h = Math.round(hsl.h); // Round hue to the nearest whole number
            const s = Math.round(hsl.s * 100); // Convert to percentage and round
            const l = Math.round(hsl.l * 100); // Convert to percentage and round
            const a = hsl.a !== undefined ? parseFloat(hsl.a.toFixed(2)) : 1; // Round alpha to 2 decimal places if provided

            // HSL format
            result.hsl = `hsl(${h}, ${s}%, ${l}%)`;

            // HSLA format
            result.hsla = `hsla(${h}, ${s}%, ${l}%, ${a})`;
        }

        return result;
    }

    /**
     * Sets the value of the color picker, updates the internal state, UI, and triggers necessary updates.
     *
     * @param {jQuery} $element - The jQuery object of the color picker.
     * @param {string|null} value - The color value to set, in any supported format (e.g., HEX, RGB, HSL).
     */
    async function setValue($element, value, triggerChange = true, updateButton = false) {
        const settings = getSettings($element);
        let success = false;

        if (settings.debug) {
            log('setValue called', value);
        }

        try {
            if (value) {
                // Farbkonvertierung mit settings.debug
                const color = $.bsColorPicker.utils.convertColorFormats(value, settings.debug);

                if (settings.debug) {
                    log('setValue color =', color);
                }

                if (color) {
                    // Interne Variablen aktualisieren
                    setVar($element, 'currentOpacity', parseFloat(color.alpha.toFixed(2)));
                    setVar($element, 'currentHue', color.hsv.h);
                    setVar($element, 'currentSaturation', color.hsv.s);
                    setVar($element, 'currentValue', color.hsv.v);

                    // UI-Komponenten aktualisieren
                    await updateColor($element, false);
                    updateAllInputs($element, color);

                    if (updateButton) {
                        updateButtonColor($element, value);
                    }

                    let newValue = getOutputFormat($element);
                    if (settings.debug) {
                        log(`setValue newValue to format (${settings.format}) =`, newValue);
                    }
                    $element.val(newValue);
                    // $element.data('selected', color);
                    success = true;
                } else {
                    if (settings.debug) {
                        log('setValue color is null');
                    }
                    trigger($element, 'error', 'Invalid color format, set color to null');
                    updateColorToNull($element, triggerChange, updateButton);
                }
            } else {
                updateColorToNull($element, triggerChange, updateButton);
                success = true;
            }
        } catch (error) {
            console.error('Error in setValue:', error);
            trigger($element, 'error', error);
        }

        // Change-Event nur auslösen, wenn keine Fehler aufgetreten sind
        if (success && triggerChange) {
            trigger($element, 'change', value);
        }

        if (settings.debug) {
            log('setValue completed');
        }
    }

    /**
     * Initializes the color picker element, including settings, dropdown building, event binding,
     * and setting a default value. Returns a promise to handle asynchronous operations.
     *
     * @param {jQuery} $element - The jQuery object of the color picker element to initialize.
     * @returns {Promise} A promise that resolves once the initialization is complete.
     */
    async function init($element) {
        const settings = getSettings($element);

        // Log initialization if debugging is enabled
        if (settings.debug) {
            log('init called');
        }

        return new Promise((resolve) => {
            // Hide the original element initially
            if (settings.debug) {
                log('Hide original element');
            }

            $element.hide();

            // Build the dropdown UI for the color picker
            if (settings.debug) {
                log('Build dropdown');
            }

            buildDropdown($element);

            // Bind event listeners for interactions
            if (settings.debug) {
                log('Bind event listeners');
            }

            events($element);

            // Get the initial value for the color picker; use btnEmptyColor if no value is present
            const value = getValueFromElement($element);

            if (settings.debug) {
                log('Set initial value:', value);
            }
            // Set the initial value of the color picker
            setValue($element, value, false, true);

            // Mark the element as initialized
            if (settings.debug) {
                log('init completed');
            }
            // Resolve the promise indicating the initialization is complete
            resolve();
        });
    }

    /**
     * Initializes and binds events to the color picker element and its dropdown.
     * Handles updates, input changes, canvas drawing, and user interactions with the color picker.
     *
     * @param {jQuery} $element - The jQuery object of the color picker element.
     */
    function events($element) {
        const settings = getSettings($element);
        if (settings.debug) {
            log('events called');
        }

        // Get the dropdown associated with the element
        const dropdown = getDropdown($element);

        // Listen for `update` events on the color picker element
        // $element.on('update.bs.colorPicker', function (e, data) {
        //     const settings = getSettings($element);
        //     if (settings.debug) {
        //         log('update event triggered', data);
        //     }
        //     updateAllInputs($element, data); // Update all input fields with the new color values
        // });

        // Bind event listeners to the dropdown
        dropdown
            .on('click', '.' + submitBtnClass, function (e) {
                e.preventDefault();

                setColorOnElement($element); // Apply the selected color
            })
            // Handle changes in input fields
            .on('keydown', '.' + classInputs, function (e) {
                if (e.key === "Enter" || e.keyCode === 13) {
                    e.preventDefault(); // Verhindert das Abschicken des Formulars
                    const $input = $(e.currentTarget);
                    updateFromInput($element, $input); // Update the canvas and UI based on new input
                }
            })
            .on('change blur', '.' + classInputs, function (e) {
                const $input = $(e.currentTarget);
                updateFromInput($element, $input); // Update the canvas and UI based on new input
            })
            .on('hide.bs.dropdown', function (e) {
                const isInsideCanvas = dropdown.data('isInsideCanvas'); // Have you clicked on the canvas?
                const vars = getVars($element);
                if (isInsideCanvas || (dropdown.data('autoClose') === false && vars.bootstrapVersion < 5)) {
                    if (isInsideCanvas) {
                        dropdown.removeData('isInsideCanvas');
                    }
                    e.preventDefault();
                    return;
                }
                trigger($element, 'hide');
            })
            .on('show.bs.dropdown', function (e) {
                if (settings.debug) {
                    log('Dropdown show, close other dropdowns');
                }
                trigger($element, 'show');
                const dropdown = $(e.currentTarget);
                closeOtherDropdowns(dropdown);
            })
            .on('shown.bs.dropdown', async function (e) {
                if (settings.debug) {
                    log('Dropdown is shown, initializing canvas');
                }

                trigger($element, 'shown');
                const currentElementValue = getValueFromElement($element);
                const vars = getVars($element);
                const canvas = getCanvas($element).get(0);
                canvas.width = calcTotalWidth($element); // Set canvas width dynamically
                canvas.height = vars.size; // Set canvas height dynamically
                if (!$.bsColorPicker.utils.isValueEmpty(currentElementValue)) {
                    await updateColor($element, false);

                } else {
                    updateColorToNull($element, false, false);
                }
            })
            .on('mousedown', '.' + classCanvas, function (e) {

                dropdown.data('isInsideCanvas', true);
                if (settings.debug) {
                    log('event mousedown on', classCanvas, $element);
                }

                // Get the mouse position relative to the canvas
                const pos = $.bsColorPicker.utils.getMousePosition(e, e.currentTarget);

                // Determine the area clicked (e.g., color, hue, opacity)
                const area = getClickedArea($element, pos.x);
                setVar($element, 'activeControl', area); // Set the active area to be manipulated

                // Handle the click based on the area
                if (area === 'color') {
                    handleColorAreaClick($element, pos);
                } else if (area === 'hue') {
                    handleHueClick($element, pos);
                } else if (area === 'opacity') {
                    handleOpacityClick($element, pos);
                }
            });

        // Bind event listeners to the document for global mouse interactions
        $(document)
            // Handle mouse move events to update active control areas
            .on('mousemove', function (e) {
                const vars = getVars($element);
                const activeControl = vars.activeControl;

                if (!activeControl) return; // If no active control, exit

                const drop = getDropdown($element);
                if (!drop.length) return;

                const canvas = getCanvas($element).get(0);

                // Get the mouse position relative to the canvas
                const pos = $.bsColorPicker.utils.getMousePosition(e, canvas);

                // Handle updates based on the active control
                if (activeControl === 'color') {
                    handleColorAreaClick($element, pos);
                } else if (activeControl === 'hue') {
                    handleHueClick($element, pos);
                } else if (activeControl === 'opacity') {
                    handleOpacityClick($element, pos);
                }
            })
            // Handle mouse up events to disable active controls
            .on('mouseup', function () {
                const vars = getVars($element);
                const activeControl = vars.activeControl;

                if (!activeControl) return; // If no active control, exit

                const drop = getDropdown($element);
                if (!drop.length) return;

                setVar($element, 'activeControl', null); // Reset active control
            });
    }

    function getBootstrapVersion() {
        if (typeof $.fn.modal === 'undefined' || typeof $.fn.modal.Constructor === 'undefined') {
            console.error('Bootstrap Modal Plugin ist nicht verfügbar');
            return;
        }

        const bootstrapVersion = $.fn.modal.Constructor.VERSION;
        // Extrahieren der Hauptversionsnummer
        return parseInt(bootstrapVersion.split('.')[0]);
    }

    /**
     * Builds a dropdown component for the color picker, containing a canvas for the color preview,
     * input fields for multiple color formats, and control buttons (reset, close, apply).
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     */
    function buildDropdown($element) {
        const vars = getVars($element);

        // Calculate the total width for the canvas
        const canvasTotalWidth = calcTotalWidth($element);

        // Get settings for customization
        const settings = getSettings($element);
        const disabled = settings.disabled || $element.prop('disabled') ? 'disabled' : '';
        // Create the dropdown container and insert it after the element
        const dropdown = $('<div>', {
            class: `${classDropdown} dropdown`,
        }).insertAfter($element);

        dropdown.data('autoClose', false);
        // Move the original element into the dropdown
        $element.appendTo(dropdown);

        // Define and append the toggling button with optional text and canvas for color preview
        let btnText = settings.btnText ? settings.btnText : '';
        const button = $('<button>',
            {
                html: [
                    '<div class="d-flex align-items-center" style="width: 100%; flex-wrap: nowrap;">',
                    '<div style="width:20px; height:20px; position:relative; flex-shrink: 0;" class="mr-1 me-1 rounded-circle shadow">',
                    '<canvas width="20" height="20" style="position:absolute; border-radius:50%; top:0; left:0;"></canvas>',
                    '</div>',
                    `<div class="mx-1 text-wrap text-start ${classDropdownButton}" style="flex: 1; min-width: 0;">${btnText}</div>`,
                    '</div>'
                ].join(''),
                type: 'button',
                class: `btn dropdown-toggle ${settings.btnClass} d-flex align-items-center ${disabled}`,
                'data-toggle': 'dropdown',
                'data-bs-toggle': 'dropdown',
                'data-bs-auto-close': 'false',
                'aria-expanded': false,
            }).appendTo(dropdown);

        // Create the dropdown menu and append it
        const dropdownMenu = $('<div>', {
            class: 'dropdown-menu p-3',
        }).appendTo(dropdown);

        // Create the container for the color wheel and inputs
        const $colorContainer = $('<div>', {
            class: 'd-flex p-0 flex-wrap',
            css: {
                // boxSizing: 'border-box',
                // width: `calc(${canvasTotalWidth}px + 290px)`,
                height: 'auto',
                width: 'auto'
                // gap: '10px',
            },
        }).appendTo(dropdownMenu);

        // Create and append the canvas for the color adjustment
        const canvas = $('<canvas>', {
            css: {
                width: `${canvasTotalWidth}px`,
                height: `${vars.size}px`,
                boxSizing: 'border-box',
                border: 'none',
                padding: 0,
                margin: 0,
            }, class: classCanvas, width: canvasTotalWidth, height: vars.size,
        }).appendTo($colorContainer);

        // Create a container for the input fields and add the various color format inputs
        const $inputsContainer = $('<div>', {class: 'p-2 d-flex flex-column align-items-center w-100'}).appendTo($colorContainer);
        createInputGroup('HEX', '#ff0000', $inputsContainer);
        createInputGroup('RGBA', '255, 0, 0', $inputsContainer);
        createInputGroup('CMYK', '0, 100, 100, 0', $inputsContainer);
        createInputGroup('HSV', '0, 100, 100', $inputsContainer);
        createInputGroup('HSLA', '0, 100, 50', $inputsContainer);

        // Add control buttons (close, reset, apply) below the input fields
        const $controllContainer = $('<div>', {
            class: 'd-flex mt-2 btn-group w-100 btn-group-sm justify-content-between align-items-center',
        }).appendTo($inputsContainer);

        // Close button
        $('<button>', {
            html: `<i class="${settings.icons.close}"></i>`, type: 'button', class: 'btn', click: function () {
                resetColor($element, true, 'cancel'); // Reset and close
            },
        }).appendTo($controllContainer);

        // Delete color button
        $('<button>', {
            html: `<i class="${settings.icons.empty}"></i>`, type: 'button', class: 'btn', click: function () {
                setValue($element, null, false, false);
                trigger($element, 'empty');
            },
        }).appendTo($controllContainer);

        // Reset button
        $('<button>', {
            html: `<i class="${settings.icons.reset}"></i>`, type: 'button', class: 'btn', click: function () {
                resetColor($element, false, 'reset'); // Only reset
            },
        }).appendTo($controllContainer);

        // Apply button
        $('<button>', {
            html: `<i class="${settings.icons.check}"></i>`,
            type: 'button',
            class: 'btn ' + submitBtnClass
        }).appendTo($controllContainer);
    }

    /**
     * Updates the color displayed on the color picker button, rendering it onto the canvas element.
     * This function draws a checkerboard background (representing transparency) and overlays the selected color.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {string} colorValue - The selected color value in any valid format (e.g., hex, rgba).
     */
    function updateButtonColor($element, colorValue) {
        // Get the dropdown and the button containing the canvas
        const dropdown = getDropdown($element);
        const settings = getSettings($element);
        const btn = dropdown.find('.dropdown-toggle');
        const canvas = btn.find('canvas').get(0);

        if (canvas && canvas.getContext) {
            const ctx = canvas.getContext('2d');
            const size = canvas.width; // Canvas is assumed to be square

            // 1. Draw checkerboard background for transparency visualization
            const tileSize = 4; // Size of each tile in the checkerboard pattern
            for (let x = 0; x < size; x += tileSize) {
                for (let y = 0; y < size; y += tileSize) {
                    // Alternate between light gray (#eee) and slightly darker gray (#ddd)
                    ctx.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? '#eee' : '#ddd';
                    ctx.fillRect(x, y, tileSize, tileSize); // Draw the tile
                }
            }

            // 2. Draw the main color overlay based on the selected color value
            const color = $.bsColorPicker.utils.convertColorFormats(colorValue, settings.debug); // Convert the color value into usable formats
            let fillStyle;
            if (color && color.rgba) {
                fillStyle = `rgba(${color.rgba.r}, ${color.rgba.g}, ${color.rgba.b}, ${color.rgba.a})`;
            } else {
                fillStyle = settings.btnEmptyColor;
            }

            ctx.fillStyle = fillStyle;                  // Set the fill style to the selected color
            ctx.fillRect(0, 0, size, size);        // Fill the entire canvas with the color

        }
    }

    /**
     * Creates an input group with a label and a text input field, appends it to the specified container.
     * This function is useful for generating labeled input fields dynamically.
     *
     * @param {string} label - The text to display in the label of the input group.
     * @param {string} placeholder - The placeholder text to display in the input field.
     * @param {jQuery} $inputsContainer - The jQuery object representing the container to append the input group.
     */
    function createInputGroup(label, placeholder, $inputsContainer) {
        // Create the input group container
        const $inputGroup = $('<div>', {
            class: 'd-flex align-items-center mb-1', // Bootstrap input group classes
        }).appendTo($inputsContainer);

        // Create and append the label span element
        $('<label>', {
            style: 'width: 60px; font-size: .8rem',                     // Fixed width for the label
            class: 'text-right pe-2 pr-2 text-muted mb-0 text-uppercase',                // Bootstrap class for input group label
            text: label,                // Convert the label text to uppercase
        }).appendTo($inputGroup);

        // Create and append the text input element
        $('<input>', {
            css: {
                border: 'none',              // Entfernt jegliche Rahmen
                borderWidth: '0 0 1px 0',    // Oben 0, rechts 0, unten 1px, links 0
                borderStyle: 'solid',        // Definiert, dass der Rahmen solide ist
                borderRadius: '0',           // Entfernt jegliche Rundungen
            },
            'data-role': label.toLowerCase(),         // Set data-role using lowercase label
            type: 'text',                             // Input type: text
            class: 'form-control py-0 form-control-sm ' + classInputs,     // Add Bootstrap and custom input classes
            placeholder: placeholder,                 // Set placeholder text
        }).appendTo($inputGroup);
    }

    /**
     * Triggers the specified event on the color picker element with any additional parameters.
     * It also triggers an "all.bs.colorPicker" event before the specific event.
     * Supports a debug mode to log event details in the console.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {string} event - The name of the event to be triggered (e.g., "update").
     * @param {...any} params - Additional parameters to pass along with the event.
     */
    function trigger($element, event, ...params) {
        // Retrieve settings for debugging
        const settings = getSettings($element);
        const p = params && params.length > 0 ? params : [];

        // Log event details if debugging is enabled
        if (settings.debug) {
            if (p.length > 0) {
                log('Triggering event:', event, 'with params:', ...p);
            } else {
                log('Triggering event:', event, 'without params');
            }
        }

        if (event !== 'all') {
            // Trigger the "all" event directly (generic event for all actions)
            $element.trigger('all.bs.colorPicker');

            // Trigger the specific event directly (e.g., "update.bs.colorPicker")
            $element.trigger(`${event}.bs.colorPicker`, ...p);
        }
    }

    /**
     * Updates the color selection state and redraws all components of the color picker.
     * This function handles the main canvas, hue slider, opacity slider, and markers,
     * and updates all information related to the selected color.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {boolean} [doTrigger=true] - Whether to trigger the "update" event after updating the color.
     */
    function updateColor($element, doTrigger = true) {
        return new Promise((resolve, reject) => {
            try {
                if (!$element || !$element.length) {
                    throw new Error('Invalid element parameter!');
                }

                // Get the canvas and its context
                const canvas = getCanvas($element).get(0);
                const context = getCanvasContext($element);

                if (!canvas) {
                    throw new Error('Canvas element not found!');
                }
                if (!context) {
                    throw new Error('Canvas context could not be retrieved!');
                }

                // Calculate total width of the color picker
                const totalWidth = calcTotalWidth($element);

                // Retrieve relevant variables
                const vars = getVars($element);
                const settings = getSettings($element);

                if (!vars || typeof vars !== 'object') {
                    throw new Error('Failed to retrieve color picker variables!');
                }
                if (!settings || typeof settings !== 'object') {
                    throw new Error('Failed to retrieve color picker settings!');
                }

                // Clear the entire canvas
                context.clearRect(0, 0, totalWidth, vars.size);

                // Calculate the current color as rgb
                const rgb = $.bsColorPicker.utils.HSVtoRGB(vars.currentHue, vars.currentSaturation, vars.currentValue);
                if (!rgb || typeof rgb.r !== 'number' || typeof rgb.g !== 'number' || typeof rgb.b !== 'number') {
                    throw new Error('Failed to convert HSV to RGB!');
                }

                const rgbaColor = `rgba(${rgb.r},${rgb.g},${rgb.b},${vars.currentOpacity})`;

                // Redraw all components of the color picker
                drawPreview($element, rgbaColor);                // Preview section
                drawMainSquare($element, vars.currentHue);       // Main color square (Saturation and Value)
                drawHueSlider($element);                         // Hue slider
                drawOpacitySlider($element);                     // Opacity slider

                // Calculate and draw markers
                const mainX = vars.previewSize + vars.padding + (vars.currentSaturation * vars.size);
                const mainY = (1 - vars.currentValue) * vars.size;
                drawMarker($element, mainX, mainY);              // Marker for main color square

                const hueY = (vars.currentHue / 360) * vars.size;
                drawMarker(
                    $element,
                    vars.previewSize + vars.padding + vars.size + vars.padding + vars.sliderWidth / 2,
                    hueY,
                    true
                );                                               // Marker for hue slider

                const opacityY = (1 - vars.currentOpacity) * vars.size;
                drawMarker(
                    $element,
                    vars.previewSize + vars.padding + vars.size + vars.padding + vars.sliderWidth + vars.padding + vars.sliderWidth / 2,
                    opacityY,
                    true
                );                                               // Marker for opacity slider

                // Calculate additional color formats
                const data = $.bsColorPicker.utils.convertColorFormats(
                    `rgba(${rgb.r},${rgb.g},${rgb.b},${vars.currentOpacity})`,
                    settings.debug
                );

                if (!data) {
                    throw new Error('Failed to convert color formats!');
                }

                // Store color details in the jQuery element's data
                $element.data('selected', data);

                // Trigger the "update" event with the selected color details if necessary
                if (doTrigger) {
                    trigger($element, 'update', data);
                }

                // Update all input fields with the new color values
                updateAllInputs($element, data);

                // Resolve the promise with the color data
                resolve(data);
            } catch (error) {
                // Log the error and reject the promise
                console.error('Error in updateColor:', error);
                reject(error);
            }
        });
    }

    function updateColorToNull($element, doTrigger = true, updateBtn = false) {
        const settings = getSettings($element);
        // Update internal variables (opacity, hue, saturation, value)
        setVar($element, 'currentOpacity', 1);
        setVar($element, 'currentHue', 0);
        setVar($element, 'currentSaturation', 1);
        setVar($element, 'currentValue', 1);
        // Get the canvas and its context
        const canvas = getCanvas($element).get(0);
        const context = getCanvasContext($element);

        // Calculate total width of the color picker
        const totalWidth = calcTotalWidth($element);

        // Retrieve relevant variables
        const vars = getVars($element);

        // Clear the entire canvas
        context.clearRect(0, 0, totalWidth, vars.size);

        // Redraw all components of the color picker without any color selected
        drawPreview($element, null);            // Empty preview (transparent)
        drawMainSquare($element, null, true);                    // Main color square (no color defined)
        drawHueSlider($element);                           // Hue slider remains intact
        drawOpacitySlider($element);                       // Opacity slider remains intact

        // Clear the selected color from the jQuery element's data
        $element.removeData('selected');

        updateAllInputs($element, null); // Update input fields with the new color
        if (updateBtn) {
            updateButtonColor($element, settings.btnEmptyColor);  // Update the button's preview color
        }

        $element.val(null); // Clear the value
        // Optionally trigger an "update" event with a null value to indicate a reset
        if (doTrigger) {
            trigger($element, 'update', null);
        }
        updateAllInputs($element, null); // Update all input fields with the new color values
    }

    function getOutputFormat($element) {

        const selectedColorSet = $element.data('selected');

        if (!selectedColorSet) {
            return null;
        }
        const settings = getSettings($element);
        // Convert the selected color to a string format based on settings
        const strings = formatSelectedToString(selectedColorSet);
        if (settings.debug) {
            log('setValue strings =', strings);
        }
        let newValue;
        switch (settings.format) {
            case 'hex':
                newValue = strings.hex;// Set the value as HEX
                break;
            case 'rgb':
                newValue = strings.rgb; // Set the value as RGB
                break;
            case 'rgba':
                newValue = strings.rgba; // Set the value as RGB
                break;
            case 'hsl':
                newValue = strings.hsl; // Set the value as HSL
                break;
            case 'hsla':
                newValue = strings.hsla; // Set the value as HSLA
                break;
            default:
                newValue = null; // Set the value as RGBA
                break;
        }
        return newValue;
    }

    /**
     * Draws the color preview box on the canvas.
     * The preview box shows the currently selected color overlayed on a checkerboard background,
     * which represents transparency.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {string} color - The current color in any valid CSS format (e.g., hex, rgb).
     */
    function drawPreview($element, color) {
        const settings = getSettings($element);
        // Get the canvas' drawing context
        const context = getCanvasContext($element);

        // Retrieve relevant variables for the preview box dimensions
        const vars = getVars($element);
        const previewSize = vars.previewSize; // Size (width and height) of the preview box

        if ($.bsColorPicker.utils.isValueEmpty(color)) {
            drawTransparentBackground(context, 0, 0, vars.previewSize, vars.previewSize);
        } else {
            // Draw a checkerboard pattern for transparency visualization
            for (let x = 0; x < previewSize; x += 10) {
                for (let y = 0; y < previewSize; y += 10) {
                    // Alternate between white (#fff) and light gray (#eee) squares
                    context.fillStyle = (x + y) % 20 === 0 ? '#fff' : '#eee';
                    context.fillRect(x, y, 10, 10); // Draw 10x10 pixel squares
                }
            }

            // Overlay the selected color on top of the checkerboard pattern
            context.fillStyle = color;
            context.fillRect(0, 0, previewSize, previewSize); // Fill the entire preview box
        }
    }

    /**
     * Draws the main color square on the canvas.
     * The square represents variations of saturation (S) and value (V) for a given base hue (H),
     * allowing users to select a specific color.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {number} baseHue - The base hue (H) value in degrees (0-360) used to generate the color square.
     */
    function drawMainSquare($element, baseHue, setEmpty = false) {
        // Get the canvas' drawing context
        const context = getCanvasContext($element);

        // Retrieve relevant variables for square dimensions
        const vars = getVars($element);
        const size = vars.size;  // Size (width and height) of the main color square

        if (setEmpty) {
            // Draw transparent checkerboard pattern if setEmpty is true
            drawTransparentBackground(context, vars.previewSize + vars.padding, 0, size, size);
        } else {
            // Create an empty image data array for the color square
            const imageData = context.createImageData(size, size);

            // Iterate over each pixel row (y-axis) and column (x-axis) in the square
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    // Calculate saturation (S) and value (V) based on position
                    const s = x / (size - 1);         // Saturation increases left to right
                    const v = 1 - (y / (size - 1));   // Value decreases top to bottom

                    // Convert HSV values to RGB
                    const rgb = $.bsColorPicker.utils.HSVtoRGB(baseHue, s, v);

                    // Calculate the index in the pixel array
                    const idx = (y * size + x) * 4;

                    // Set the R, G, B, and A channels for the current pixel
                    imageData.data[idx] = rgb.r;        // Red channel
                    imageData.data[idx + 1] = rgb.g;    // Green channel
                    imageData.data[idx + 2] = rgb.b;    // Blue channel
                    imageData.data[idx + 3] = 255;      // Alpha channel (fully opaque)
                }
            }

            // Draw the color square at its designated position
            context.putImageData(imageData, vars.previewSize + vars.padding, 0);
        }
    }

    // Function to draw a transparent checkerboard pattern
    function drawTransparentBackground(context, startX, startY, width, height) {
        const tileSize = 10; // Size of each checkerboard tile
        const lightColor = '#ffffff'; // Light tile color
        const darkColor = '#cccccc';  // Dark tile color

        for (let y = startY; y < startY + height; y += tileSize) {
            for (let x = startX; x < startX + width; x += tileSize) {
                // Alternate between light and dark colors
                if (((x / tileSize) + (y / tileSize)) % 2 === 0) {
                    context.fillStyle = lightColor;
                } else {
                    context.fillStyle = darkColor;
                }
                // Draw the tile
                context.fillRect(x, y, tileSize, tileSize);
            }
        }
    }

    /**
     * Draws the hue slider on the canvas.
     * The slider represents the full 360-degree hue spectrum, transitioning smoothly through all colors.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     */
    function drawHueSlider($element) {
        // Get the canvas' drawing context
        const context = getCanvasContext($element);

        // Retrieve relevant variables for slider dimensions
        const vars = getVars($element);
        const size = vars.size;                // Height of the hue slider (matches the color field size)
        const sliderWidth = vars.sliderWidth;  // Width of the hue slider
        const imageData = context.createImageData(sliderWidth, size);

        // Iterate over each horizontal pixel row in the slider
        for (let y = 0; y < size; y++) {
            // Calculate the hue value for the current row (scaled from 0 to 360 degrees)
            const hue = (y / (size - 1)) * 360;

            // Convert current hue to RGB (full saturation and value)
            const rgb = $.bsColorPicker.utils.HSVtoRGB(hue, 1, 1);

            // Iterate over each pixel in the row (width of the slider)
            for (let x = 0; x < sliderWidth; x++) {
                const idx = (y * sliderWidth + x) * 4;

                // Set the RGB and alpha channel values for each pixel
                imageData.data[idx] = rgb.r;        // Red channel
                imageData.data[idx + 1] = rgb.g;    // Green channel
                imageData.data[idx + 2] = rgb.b;    // Blue channel
                imageData.data[idx + 3] = 255;      // Alpha channel (fully opaque)
            }
        }

        // Draw the hue slider at its designated position
        context.putImageData(imageData, vars.previewSize + vars.padding + size + vars.padding, 0);
    }

    /**
     * Draws the opacity slider on the canvas.
     * The slider displays a gradient from fully opaque to fully transparent,
     * overlayed on a checkerboard background that indicates transparency.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     */
    function drawOpacitySlider($element) {
        try {
            // Get the canvas' drawing context
            const context = getCanvasContext($element);
            if (!context) {
                throw new Error('Canvas context could not be retrieved.');
            }

            // Retrieve relevant variables for slider dimensions and color values
            const vars = getVars($element);
            if (!vars || typeof vars !== 'object') {
                throw new Error('Variables for the slider are missing or invalid.');
            }

            const colorFieldWidthHeight = vars.size;
            const sliderWidth = vars.sliderWidth;

            // Validate dimensions
            if (typeof colorFieldWidthHeight !== 'number' || colorFieldWidthHeight <= 0) {
                throw new Error(`Invalid color field height: ${colorFieldWidthHeight}`);
            }
            if (typeof sliderWidth !== 'number' || sliderWidth <= 0) {
                throw new Error(`Invalid slider width: ${sliderWidth}`);
            }

            // Convert the current color to RGB format for the gradient
            const rgb = $.bsColorPicker.utils.HSVtoRGB(vars.currentHue, vars.currentSaturation, vars.currentValue);
            if (!rgb || typeof rgb.r !== 'number' || typeof rgb.g !== 'number' || typeof rgb.b !== 'number') {
                throw new Error(`Invalid RGB values converted from HSV: ${JSON.stringify(rgb)}`);
            }

            // Create a checkerboard background pattern for the transparency slider
            const imageData = context.createImageData(sliderWidth, colorFieldWidthHeight);
            for (let y = 0; y < colorFieldWidthHeight; y++) {
                for (let x = 0; x < sliderWidth; x++) {
                    const idx = (y * sliderWidth + x) * 4;
                    const isCheckerboard = ((Math.floor(y / 5) + Math.floor(x / 5)) % 2 === 0);
                    const baseColor = isCheckerboard ? 255 : 220;

                    imageData.data[idx] = baseColor;      // Red
                    imageData.data[idx + 1] = baseColor; // Green
                    imageData.data[idx + 2] = baseColor; // Blue
                    imageData.data[idx + 3] = 255;       // Alpha
                }
            }

            // Draw the checkerboard background
            const xOffset = vars.previewSize + vars.padding + colorFieldWidthHeight + vars.padding + sliderWidth + vars.padding;
            context.putImageData(imageData, xOffset, 0);

            // Overlay the gradient for the opacity
            context.save();
            context.globalCompositeOperation = 'source-over';

            const gradient = context.createLinearGradient(0, 0, 0, colorFieldWidthHeight);
            gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`); // Fully opaque
            gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`); // Fully transparent

            context.fillStyle = gradient;
            context.fillRect(xOffset, 0, sliderWidth, colorFieldWidthHeight);

            context.restore();
        } catch (error) {
            trigger($element, 'error', error.message);
            console.error('Error in drawOpacitySlider:', error);
        }
    }

    /**
     * Draws a marker on the canvas to indicate the selected position.
     * Used for color sliders and the main color area.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {number} x - The x-coordinate for the marker's position.
     * @param {number} y - The y-coordinate for the marker's position.
     * @param {boolean} [isSlider=false] - Whether the marker is being drawn on a slider (hue/opacity) or the main color area.
     */
    function drawMarker($element, x, y, isSlider = false) {
        // Get the canvas' drawing context
        const context = getCanvasContext($element);

        // Retrieve relevant variables for drawing boundaries
        const vars = getVars($element);
        const previewSize = vars.previewSize;  // Size of the preview box
        const size = vars.size;                // Size of the main color area
        const padding = vars.padding;          // Padding between elements
        const sliderWidth = vars.sliderWidth;  // Width of the hue/opacity sliders
        const totalWidth = calcTotalWidth($element); // Total width of the color picker

        // Clamp the x-coordinate within valid bounds for the marker
        x = Math.max(previewSize + padding + (isSlider ? size + padding + sliderWidth / 2 : 6), Math.min(x, previewSize + padding + (isSlider ? totalWidth - 6 : size - 6)));

        // Clamp the y-coordinate within valid bounds for the marker
        y = Math.max(6, Math.min(y, size - 6));

        // Outer circle: Draw a white border
        context.beginPath();
        context.arc(x, y, 6, 0, 2 * Math.PI);
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.stroke();

        // Inner circle: Draw a black border
        context.beginPath();
        context.arc(x, y, 5, 0, 2 * Math.PI);
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.stroke();
    }

    /**
     * Determines which section of the color picker was clicked based on the horizontal position.
     * Sections include: "color" (the main color area), "hue" (the hue slider), and "opacity" (the opacity slider).
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {number} x - The x-coordinate of the user's click relative to the element.
     * @returns {string|null} - Returns the clicked area as a string ("color", "hue", or "opacity")
     *                          or `null` if the click was outside the defined areas.
     */
    function getClickedArea($element, x) {
        // Retrieve relevant variables for calculating the areas
        const vars = getVars($element);

        // Dimensions of the color picker sections
        const previewSize = vars.previewSize; // Size of the preview box
        const padding = vars.padding;        // Padding between elements
        const size = vars.size;              // Size of the main color area
        const sliderWidth = vars.sliderWidth; // Width of the hue and opacity sliders
        const totalWidth = calcTotalWidth($element); // Total width of the color picker

        // Check if the click is within the "color area" (main color picker)
        if (x >= previewSize + padding && x < previewSize + padding + size) {
            return 'color';
        }

        // Check if the click is within the "hue slider" area
        if (x >= previewSize + padding + size + padding && x < previewSize + padding + size + padding + sliderWidth) {
            return 'hue';
        }

        // Check if the click is within the "opacity slider" area
        if (x >= previewSize + padding + size + padding + sliderWidth + padding && x < totalWidth) {
            return 'opacity';
        }

        // Return null if click is outside of any defined area
        return null;
    }

    /**
     * Handles the user's interaction with the main color selection area (color area).
     * Calculates the saturation (s) and brightness (value, v) based on the click position in the color area
     * and updates the corresponding color picker variables and UI.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {Object} pos - An object containing the click position with the following properties:
     *    @property {number} pos.x - The x-coordinate of the user's click relative to the element.
     *    @property {number} pos.y - The y-coordinate of the user's click relative to the element.
     */
    async function handleColorAreaClick($element, pos) {
        const settings = getSettings($element);
        if (settings.debug) {
            // Debug output: Log raw position of the color area click
            log('Color click raw position:', pos);
        }

        // Retrieve variables (e.g., settings and state) of the color picker element
        const vars = getVars($element);

        // Get the size of the preview area (e.g., the small color preview box in the picker)
        const previewSize = vars.previewSize;

        // Retrieve padding between the preview box and the color selection area
        const padding = vars.padding;

        // Calculate the horizontal position of the click adjusted by preview size and padding
        const colorAreaX = pos.x - (previewSize + padding);

        // Get the total size (width/height) of the color area
        const size = vars.size;

        // Use the raw vertical position as the relative Y value
        const relativeY = pos.y;

        if (settings.debug) {
            // Debug output: Log calculated click position in the color area
            log('Color click calculated position:', {
                colorAreaX, relativeY, previewSize, padding
            });
        }

        // Calculate the saturation (s) based on the horizontal click position
        // Clamp the value to ensure it stays between 0 and 1
        const s = Math.max(0, Math.min(1, colorAreaX / size));

        // Calculate the brightness (value, v) based on the inverted vertical click position
        // Clamp the value to ensure it stays between 0 and 1
        const v = Math.max(0, Math.min(1, 1 - (relativeY / size)));

        // Update the saturation variable in the color picker element
        setVar($element, 'currentSaturation', s);

        // Update the brightness (value) variable in the color picker element
        setVar($element, 'currentValue', v);

        // Update the color picker UI with the new saturation and value
        await updateColor($element, true);
    }

    /**
     * Handles the behavior when the user interacts with the hue slider (e.g., clicks or drags).
     * It calculates and sets the new hue value (in degrees) based on the vertical click position
     * and updates the UI to reflect the changes.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {Object} pos - An object containing the click position with the following properties:
     *    @property {number} pos.y - The y-coordinate of the user's click relative to the element.
     *    @property {number} pos.x - The x-coordinate of the user's click relative to the element.
     */
    async function handleHueClick($element, pos) {

        // Retrieve variables (e.g., current settings and state) associated with the specified color picker element ($element).
        const vars = getVars($element);

        // Get the size of the hue slider or relevant UI component (height of the hue selection area).
        const size = vars.size;

        // Ensure the y-coordinate (vertical position) is within the valid range [0, size-1].
        // If the position is less than 0, set it to 0; if it exceeds the maximum, set it to size - 1.
        const relativeY = Math.max(0, Math.min(size - 1, pos.y));

        // Calculate the new hue value in degrees (0-360) based on the vertical position (relativeY).
        // The hue value is linearly mapped from the position within the slider area.
        const currentHue = (relativeY / (size - 1)) * 360;

        // Update the 'currentHue' variable for the specified element with the newly calculated hue value.
        setVar($element, 'currentHue', currentHue);

        // Trigger a color update in the UI to reflect the changes in the hue.
        await updateColor($element, true);
    }

    /**
     * Handles the behavior when the user interacts with the opacity slider (e.g., clicks or drags).
     * It calculates and sets the new opacity value based on the vertical click position
     * and updates the UI to reflect the changes.
     *
     * @param {jQuery} $element - The jQuery object representing the color picker element.
     * @param {Object} pos - An object containing the click position with the following properties:
     *    @property {number} pos.y - The y-coordinate of the user's click relative to the element.
     */
    async function handleOpacityClick($element, pos) {

        // Retrieve variables (e.g., current settings and state) related to the specified color picker element ($element).
        const vars = getVars($element);

        // Get the size of the opacity slider or relevant UI component (height of the area).
        const size = vars.size;

        // Ensure the y-coordinate (vertical position) is within the valid range [0, size-1].
        // If the position is below 0, set it to 0; if it exceeds the max size, set it to size - 1.
        const relativeY = Math.max(0, Math.min(size - 1, pos.y));

        // Calculate the new opacity value based on the vertical position (relativeY).
        // Lower y-coordinates correspond to higher opacity values, while higher y-coordinates result in lower opacity.
        const currentOpacity = 1 - (relativeY / (size - 1));

        // Update the 'currentOpacity' variable for the specified element with the newly calculated opacity value.
        setVar($element, 'currentOpacity', parseFloat(currentOpacity.toFixed(2)));

        // Trigger a color update in the UI to reflect the changes in the opacity.
        await updateColor($element, true);
    }

    /**
     * Updates all input fields displayed in the dropdown menu of the color picker
     * with the corresponding color values converted into various formats (hex, rgba, hsv, hsl, cmyk).
     *
     * @param {jQuery} $element - The jQuery object of the color picker element whose inputs should be updated.
     * @param {Object} rgba - An object containing RGB color values with the following properties:
     *    @property {number} r - The red component of the color (0-255).
     *    @property {number} g - The green component of the color (0-255).
     *    @property {number} b - The blue component of the color (0-255).
     */
    function updateAllInputs($element, data) {
        // Get the dropdown menu associated with the specified color picker element ($element).
        const $dropdown = getDropdown($element);
        const settings = getSettings($element);
        let rgba = data ? data.rgba : null;

        // Object containing selectors for each input field in the dropdown menu, mapped to their corresponding data roles.
        const inputs = {
            hex: `.${classInputs}[data-role="hex"]`,  // Selector for the input field with the HEX value.
            rgb: `.${classInputs}[data-role="rgba"]`, // Selector for the input field with the RGBA value.
            hsv: `.${classInputs}[data-role="hsv"]`,  // Selector for the input field with the HSV value.
            hsl: `.${classInputs}[data-role="hsla"]`, // Selector for the input field with the HSLA value.
            cmyk: `.${classInputs}[data-role="cmyk"]` // Selector for the input field with the CMYK value.
        };

        if (rgba) {
            if (settings.debug) {
                log('Updating all inputs for color:', rgba);
            }


            // Retrieve variables (e.g., the current opacity) for the specified color picker element ($element).
            const vars = getVars($element);

            // Convert the provided RGB color values (r, g, b) into a HEX color string (e.g., "#RRGGBB").
            const hex = $.bsColorPicker.utils.RGBtoHex(rgba.r, rgba.g, rgba.b, rgba.a);

            // Create an RGBA string using the RGB values and the current opacity (formatted to 2 decimal places).
            const rgbString = `${rgba.r}, ${rgba.g}, ${rgba.b}, ${vars.currentOpacity.toFixed(2)}`;

            // Convert the RGB color values to the HSV color format (hue, saturation, value).
            const hsv = $.bsColorPicker.utils.RGBtoHSV(rgba.r, rgba.g, rgba.b);

            // Create an HSV string using the hue (h), saturation (s), and value (v), where saturation and value are scaled to percentages.
            const hsvString = `${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}, ${Math.round(hsv.v * 100)}`;

            // Convert the RGB color values to the HSL color format (hue, saturation, lightness).
            const hsl = $.bsColorPicker.utils.RGBtoHSL(rgba.r, rgba.g, rgba.b);

            // Create an HSLA string using the hue (h), saturation (s), lightness (l), and current opacity,
            // where saturation and lightness are scaled to percentages and opacity is formatted to 2 decimal places.
            const hslString = `${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}, ${Math.round(hsl.l * 100)}, ${vars.currentOpacity.toFixed(2)}`;

            // Convert the RGB color values to the CMYK color format (cyan, magenta, yellow, key/black).
            const cmyk = $.bsColorPicker.utils.RGBtoCMYK(rgba.r, rgba.g, rgba.b);

            // Create a CMYK string using the cyan (c), magenta (m), yellow (y), and key (k) values.
            const cmykString = `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`;

            // Update the value of the input field for HEX format in the dropdown menu.
            $dropdown.find(inputs.hex).val(hex);

            // Update the value of the input field for RGBA format in the dropdown menu.
            $dropdown.find(inputs.rgb).val(rgbString);

            // Update the value of the input field for HSV format in the dropdown menu.
            $dropdown.find(inputs.hsv).val(hsvString);

            // Update the value of the input field for HSLA format in the dropdown menu.
            $dropdown.find(inputs.hsl).val(hslString);

            // Update the value of the input field for CMYK format in the dropdown menu.
            $dropdown.find(inputs.cmyk).val(cmykString);
        } else {
            if (settings.debug) {
                log('Updating all inputs to null');
            }
            $dropdown.find(inputs.hex).val(null);
            $dropdown.find(inputs.rgb).val(null);
            $dropdown.find(inputs.hsv).val(null);
            $dropdown.find(inputs.hsl).val(null);
            $dropdown.find(inputs.cmyk).val(null);
        }
    }

    /**
     * Updates the color and related properties of a given element based on the provided input.
     * The method processes the color input value, determines its format (e.g., HEX, RGBA, HSV),
     * converts it to the required format, and updates the relevant settings for the element.
     *
     * @param {object} $element - The target element whose color-related properties will be updated.
     * @param {object} $input - The input element providing the color value and its format.
     * @return {void} - This function does not return a value.
     */
    async function updateFromInput($element, $input) {
        // Get the current value of the input element ($input).
        const value = $input.val();

        if ($.bsColorPicker.utils.isValueEmpty(value)) {
            $element.find('.' + classInputs).val(null);
            updateColorToNull($element);
            return;
        }

        // Retrieve variables (e.g., current color values, opacity) for the given element ($element).
        const vars = getVars($element);

        // Retrieve settings or configuration for the given element ($element).
        const settings = getSettings($element);

        // Get the 'data-role' attribute from the input ($input), convert it to lowercase, and assign it to sourceFormat.
        const sourceFormat = $input.attr('data-role').toLowerCase();


        // Declare a variable to store the RGB color data.
        let rgba;

        // Declare a variable to store the HSV color data.
        let hsv;

        // Set the initial opacity to the current opacity value stored in vars.
        let opacity = vars.currentOpacity;

        try {
            // Use a switch statement to determine the appropriate color conversion
            // based on the source format (e.g., 'hex', 'rgba', etc.).
            switch (sourceFormat) {

                // Handle the case where the color format is hexadecimal (hex).
                case 'hex':
                    // Convert the hex value to RGB format using a utility function.
                    rgba = $.bsColorPicker.utils.hexToRGBA(value);

                    // Check if an alpha value exists in the converted hex color (e.g., #RRGGBBAA)
                    if (rgba.a !== undefined) {
                        opacity = rgba.a; // Assign the alpha value to the opacity variable
                    }


                    // Convert the RGB values to HSV format using a utility function.
                    hsv = $.bsColorPicker.utils.RGBtoHSV(rgba.r, rgba.g, rgba.b);
                    break;

                // Handle the case where the color format is RGBA.
                case 'rgba':
                    // Split the RGBA string into components and convert each component to a floating-point value.
                    const rgbValues = value.split(',').map(n => parseFloat(n.trim()));

                    // Check if the RGBA value contains an alpha (opacity) component.
                    if (rgbValues.length >= 4) {
                        // If an alpha value is present, update the opacity variable.
                        opacity = rgbValues[3];

                        // Create an RGB object using the first three components (r, g, b).
                        rgba = {r: rgbValues[0], g: rgbValues[1], b: rgbValues[2]};
                    } else {
                        // If no alpha (opacity) value is provided, only create an RGB object.
                        rgba = {r: rgbValues[0], g: rgbValues[1], b: rgbValues[2]};
                    }

                    // Convert the RGB values to HSV format using a utility function.
                    hsv = $.bsColorPicker.utils.RGBtoHSV(rgba.r, rgba.g, rgba.b);
                    break;

                // Handle the case where the color format is HSV.
                case 'hsv':
                    // Split the HSV string into components, convert them to numbers, and destructure into h, s, and v variables.
                    const [h, s, v] = value.split(',').map(n => parseFloat(n.trim()));

                    // Create an HSV object, and normalize saturation (s) and value (v) as percentages (divide by 100).
                    hsv = {h, s: s / 100, v: v / 100};

                    // Convert the HSV values to RGB format using a utility function.
                    rgba = $.bsColorPicker.utils.HSVtoRGB(h, s / 100, v / 100);
                    break;

                // Handle the case where the color format is CMYK.
                case 'cmyk':
                    // Split the CMYK string into components, convert them to numbers, and destructure into c, m, y, and k variables.
                    const [c, m, y, k] = value.split(',').map(n => parseFloat(n.trim()));

                    // Create a CMYK object using the parsed values.
                    const cmyk = {c, m, y, k};

                    // Convert the CMYK values to RGB format using a utility function.
                    rgba = $.bsColorPicker.utils.cmykToRGB(cmyk);

                    // Convert the RGB values to HSV format using a utility function.
                    hsv = $.bsColorPicker.utils.RGBtoHSV(rgba.r, rgba.g, rgba.b);
                    break;

                // Handle the case where the color format is HSLA.
                case 'hsla':
                    // Split the HSLA string into components, convert them to numbers, and destructure into hh, ss, l, and a variables.
                    const [hh, ss, l, a] = value.split(',').map(n => parseFloat(n.trim()));

                    // Create an HSL object, and normalize saturation (ss) and lightness (l) as percentages (divide by 100).
                    const hsl = {h: hh, s: ss / 100, l: l / 100};

                    // Check if an alpha (opacity) value is provided.
                    if (!isNaN(a)) {
                        // If valid, update the opacity variable.
                        opacity = a;
                    }

                    // Convert the HSL values to RGB format using a utility function.
                    rgba = $.bsColorPicker.utils.hslToRGB(hsl, settings.debug);
                    // Convert the RGB values to HSV format using a utility function.
                    hsv = $.bsColorPicker.utils.RGBtoHSV(rgba.r, rgba.g, rgba.b);
                    break;
            }

            // Update the 'currentOpacity' variable for the element ($element) with the final opacity value.
            setVar($element, 'currentOpacity', parseFloat(opacity.toFixed(2)));

            // Update the 'currentHue' variable for the element ($element) with the hue value from the HSV object.
            setVar($element, 'currentHue', hsv.h);

            // Update the 'currentSaturation' variable for the element ($element) with the saturation value from the HSV object.
            setVar($element, 'currentSaturation', hsv.s);

            // Update the 'currentValue' variable for the element ($element) with the value (brightness) from the HSV object.
            setVar($element, 'currentValue', hsv.v);

            // Apply the updated color settings (e.g., update the UI to reflect the new color).
            await updateColor($element, true);
        } catch (e) {
            // If an error occurs during the try block, catch the exception and handle it here.
            // Check if the debug mode is enabled in the settings.
            if (settings.debug) {
                // Log the error message to the console for debugging purposes.
                log('Invalid format:', e);
            }
        }
    }

    setTimeout(() => {
        $('[data-bs-toggle="color"],[data-toggle="color"]')
            .bsColorPicker($.bsColorPicker.getDefaults());
    }, 0)
}(jQuery))
