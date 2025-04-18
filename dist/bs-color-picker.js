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
            emptyColor: '#FFFFFF',
            format: 'rgba',
            debug: true
        }
    };

    const wrapperClass = 'bs-color-picker-wrapper';
    const submitBtnClass = 'bs-color-picker-submit';
    const canvasClass = 'bs-color-picker-canvas';
    const markerClass = 'bs-color-picker-marker';
    const previewClass = 'bs-color-picker-preview';
    const brightnessSliderClass = 'bs-color-picker-brightness-slider';
    const opacitySliderClass = 'bs-color-picker-opacity-slider';

    $.fn.bsColorPicker = function (optionsOrMethod, params) {
        if ($(this).length > 1) {
            return $(this).each(function (i, el) {
                return $(el).bsColorPicker(optionsOrMethod, params)
            });
        }

        const optionsGiven = typeof optionsOrMethod === 'object';
        const methodGiven = typeof optionsOrMethod === 'string';

        const $element = $(this);
        if (!$element.data('initBsColorPicker')) {
            let settings = $.bsColorPicker.getDefaults();

            if ($element.data() || optionsGiven) {
                settings = $.extend(true, {}, settings, $element.data(), optionsOrMethod || {});
            }

            setSettings($element, settings);
            init($element).then(() => {
                $element.data('initBsColorPicker', true);
                if (settings.debug) {
                    log('Init completed');
                }
            });
        }

        if (methodGiven) {
            switch (optionsOrMethod) {
                case 'val':
                    setValue($element, params);
                    break;
            }
        }

        return $element;
    };

    function parseColor(color) {
        // Hex-Farbwerte: #RRGGBB oder #RGB
        if (color.startsWith('#')) {
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                return hexToRgb(color);
            } else if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
                // Kurz-Hex in vollständiges Hex umwandeln
                const r = color[1] + color[1];
                const g = color[2] + color[2];
                const b = color[3] + color[3];
                return hexToRgb('#' + r + g + b);
            }
        }

        // RGB/RGBA: rgb(255, 0, 45) oder rgba(255, 0, 45, 0.5)
        const rgbaRegex = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([01](?:\.\d+)?))?\s*\)$/;
        const rgbaMatch = rgbaRegex.exec(color);

        if (rgbaMatch) {
            const r = parseInt(rgbaMatch[1], 10);
            const g = parseInt(rgbaMatch[2], 10);
            const b = parseInt(rgbaMatch[3], 10);
            const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

            if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 1) {
                console.error('Ungültige RGBA-Werte:', {r, g, b, a});
                return null;
            }

            return {r, g, b, a};
        }

        // HSL/HSLA: hsl(360, 100%, 50%) oder hsla(360, 100%, 50%, 0.5)
        const hslaRegex = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(?:,\s*([01](?:\.\d+)?))?\s*\)$/;
        const hslaMatch = hslaRegex.exec(color);

        if (hslaMatch) {
            const h = parseInt(hslaMatch[1], 10);
            const s = parseInt(hslaMatch[2], 10);
            const l = parseInt(hslaMatch[3], 10);
            const a = hslaMatch[4] ? parseFloat(hslaMatch[4]) : 1;

            if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100 || a < 0 || a > 1) {
                console.error('Ungültige HSLA-Werte:', {h, s, l, a});
                return null;
            }

            // HSL zu RGB konvertieren
            const rgb = hslToRgb(h, s, l);
            return {...rgb, a};
        }

        console.error('Ungültiges Farbformat:', color);
        return null;
    }

// Hilfsfunktion für HSL zu RGB Konvertierung
    function hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) {
            r = c;
            g = x;
            b = 0;
        } else if (60 <= h && h < 120) {
            r = x;
            g = c;
            b = 0;
        } else if (120 <= h && h < 180) {
            r = 0;
            g = c;
            b = x;
        } else if (180 <= h && h < 240) {
            r = 0;
            g = x;
            b = c;
        } else if (240 <= h && h < 300) {
            r = x;
            g = 0;
            b = c;
        } else if (300 <= h && h < 360) {
            r = c;
            g = 0;
            b = x;
        }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    function setMarker($element) {
        const $canvas = getCanvas($element);
        const $marker = getMarker($element);
        const $opacitySlider = getOpacitySlider($element);
        const opacity = parseFloat($opacitySlider.val());
        const selected = $canvas.data('selected');
        const {r, g, b} = selected;

        const canvas = $canvas[0];
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                if (
                    imageData[index] === r &&
                    imageData[index + 1] === g &&
                    imageData[index + 2] === b
                ) {
                    $marker.css({
                        top: y + 'px',
                        left: x + 'px',
                        background: `rgba(${r}, ${g}, ${b}, ${opacity})`,
                        display: 'block'
                    });
                    return;
                }
            }
        }
    }

    function setValue($element, color) {
        const $dropdown = getDropdown($element);
        const settings = getSettings($element);
        const $canvas = getCanvas($element);
        const $brightnessSlider = getBrightnessSlider($element);
        const $opacitySlider = getOpacitySlider($element);
        if (settings.debug) {
            log('setValue:', color, 'in format', settings.format); // Debug-Ausgabe zur Überprüfung der Eingabe
        }

        // Farbe parsen
        const parsedColor = parseColor(color);

        if (!parsedColor) {
            if (settings.debug) {
                log('Color conversion failed:', color);
            }
            return;
        } else {
            if (settings.debug) {
                log('Converted color values:', parsedColor);
            }
        }

        const selected = {
            r: parsedColor.r,
            g: parsedColor.g,
            b: parsedColor.b
        }
        $canvas.data('selected', selected);
        $brightnessSlider.val(parsedColor.a);
        updatePreviewAndValues($element, selected, parsedColor.a, parsedColor.a, true);
    }

    function hexToRgb(hex) {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            console.error('Ungültige HEX-Farbe:', hex);
            return null;
        }
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;

        console.log('Konvertierte HEX zu RGB:', {r, g, b}); // Debug-Ausgabe
        return {r, g, b};
    }


    function log(message, ...params) {
        if (window.console && window.console.log) {
            window.console.log('bsColorPicker LOG: ' + message, ...params);
        }
    }

    function setSettings($element, settings) {
        if (settings.debug) {
            log('Set settings to:', settings);
        }
        $element.data('settings', settings);
    }

    function getSettings($element) {
        return $element.data('settings');
    }

    async function init($element) {
        const settings = getSettings($element);
        if (settings.debug) {
            log('Start init element with settings:', settings);
        }
        return new Promise((resolve, reject) => {
            $element.hide();
            buildDropdown($element);
            events($element);
            resolve();
        })
    }

    function events($element) {
        const $dropdown = getDropdown($element);
        const settings = getSettings($element);
        const $canvas = getCanvas($element);
        const $brightnessSlider = getBrightnessSlider($element);
        const $opacitySlider = getOpacitySlider($element);

        // Canvas Click Handler
        $dropdown
            .on('click', '.' + canvasClass, function (event) {
                const offset = $canvas.offset();
                const clickX = event.pageX - offset.left;
                const clickY = event.pageY - offset.top;

                const ctx = $canvas[0].getContext('2d');
                const pixel = ctx.getImageData(clickX, clickY, 1, 1).data;
                const [r, g, b] = pixel;

                const selectedColor = {r, g, b};
                $canvas.data('selected', selectedColor);
                const currentBrightness = parseFloat($brightnessSlider.val());
                const currentOpacity = parseFloat($opacitySlider.val());

                updatePreviewAndValues($element, selectedColor, currentBrightness, currentOpacity);

            })
            .on('click', '.' + submitBtnClass, function (e) {
                e.preventDefault();
                const selectedFormats = $element.data('selected');

                if (selectedFormats) {
                    $element.data('selected', selectedFormats);

                    if (settings.debug) {
                        log('Übernommene Farbeinstellungen: ', selectedFormats);
                    }
                } else {
                    if (settings.debug) {
                        log('Keine Farbeinstellungen zum Speichern gefunden.');
                    }
                }

                const $dropdownButton = getDropdownButton($element);
                if ($dropdownButton.length > 0) {
                    updateButtonColor($element, selectedFormats.rgb);
                    $dropdownButton.dropdown('hide');
                }
            })
            .on('input', '.' + brightnessSliderClass + ', .' + opacitySliderClass, function () {
                const currentBrightness = parseFloat($brightnessSlider.val());
                const currentOpacity = parseFloat($opacitySlider.val());
                const selectedColor = $canvas.data('selected');

                if (selectedColor) {
                    updatePreviewAndValues($element, selectedColor, currentBrightness, currentOpacity);
                }
            });
    }

    function getDropdown($element) {
        return $element.closest('.dropdown');
    }

    function getDropdownButton($element) {
        return getDropdown($element).find('.dropdown-toggle');
    }

    function getCanvas($element) {
        return getDropdown($element).find('.' + canvasClass);
    }

    function getBrightnessSlider($element) {
        return getDropdown($element).find('.' + brightnessSliderClass);
    }

    function getOpacitySlider($element) {
        return getDropdown($element).find('.' + opacitySliderClass);
    }

    function getMarker($element) {
        return getDropdown($element).find('.' + markerClass);
    }

    function buildDropdown($element) {
        const settings = getSettings($element);
        const dropdown = $(`<div>`, {
            class: wrapperClass + ' dropdown',
        }).insertAfter($element);

        $element.appendTo(dropdown);

        const button = $(`<button>`, {
            text: 'choose a color',
            type: "button",
            class: "btn btn-light dropdown-toggle",
            'data-toggle': "dropdown",
            'data-bs-toggle': "dropdown",
            'data-bs-auto-close': "outside",
            'aria-expanded': false
        }).appendTo(dropdown);

        const dropdownMenu = $(`<div>`, {
            class: 'dropdown-menu p-3',
        }).appendTo(dropdown);

        // Farbrad-Container erstellen
        const $colorContainer = $('<div>', {
            class: 'full-color-wheel',
            style: `
            width: 300px;
            height: 300px;
            position: relative;
            clip-path: circle(150px at 150px 150px);
            overflow: hidden;
        `,
        });

        // Canvas für das Farbrad mit Marker erstellen
        const canvas = createFilledColorWheel();
        const $canvas = $(canvas)
            .css({
                position: 'absolute',
                top: 0,
                left: 0,
            })
            .addClass(canvasClass);

        $colorContainer.append($canvas);

        // Marker für die Farbauswahl
        const $marker = $('<div>', {
            class: markerClass,
            style: `
            width: 10px;
            height: 10px;
            position: absolute;
            border: 2px solid black;
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%);
            display: none;
        `,
        });
        $colorContainer.append($marker);

        // Vorschaufeld
        const $preview = $('<div>', {
            class: previewClass,
            style: `
            width: 100%;
            height: 30px;
            margin-top: 10px;
            border: 1px solid #ddd;
            background: ${settings.emptyColor};
        `,
        });

        // Farbwert-Anzeigen
        const $hexDisplay = $('<div>', {
            class: 'hex-display mt-2',
            style: 'font-size: 12px;',
            text: `HEX: ${settings.emptyColor}`,
        });

        const $rgbDisplay = $('<div>', {
            class: 'rgb-display',
            style: 'font-size: 12px;',
            text: `RGB: rgb(255, 255, 255)`,
        });

        const $hslDisplay = $('<div>', {
            class: 'hsl-display',
            style: 'font-size: 12px;',
            text: `HSL: hsl(0, 0%, 100%)`,
        });

        // Slider
        const $brightnessSlider = $('<input>', {
            type: 'range',
            min: 0,
            max: 1,
            step: 0.01,
            value: 1,
            class: 'form-range ' + brightnessSliderClass,
        });

        const $opacitySlider = $('<input>', {
            type: 'range',
            min: 0,
            max: 1,
            step: 0.01,
            value: 1,
            class: 'form-range ' + opacitySliderClass,
        });

        const $sliderContainer = $('<div>', {
            style: 'text-align: center; margin-top: 10px;',
        }).append($brightnessSlider, $opacitySlider);

        // Alle Elemente dem Dropdown-Menü hinzufügen
        dropdownMenu.append(
            $colorContainer,
            $preview,
            $hexDisplay,
            $rgbDisplay,
            $hslDisplay,
            $sliderContainer
        );

        // Übernehmen-Button
        const $submitButton = $('<button>', {
            text: 'Übernehmen',
            class: 'btn btn-primary mt-3 ' + submitBtnClass,
        });
        dropdownMenu.append($submitButton);
    }

    function updateButtonColor($element, rgba) {
        const $dropdownButton = getDropdownButton($element);
        const classes = $dropdownButton.attr('class').split(/\s+/);
        const btnClasses = classes.filter(c => c.startsWith('btn-'));
        $dropdownButton.removeClass(btnClasses.join(' '));
        $dropdownButton.css('backgroundColor', rgba);
    }

    function updatePreviewAndValues($element, color, brightness, opacity, setColorToElement = false) {
        const settings = getSettings($element);
        const $dropdown = getDropdown($element);
        const $preview = $dropdown.find('.' + previewClass);
        const $hexDisplay = $dropdown.find('.hex-display');
        const $rgbDisplay = $dropdown.find('.rgb-display');
        const $hslDisplay = $dropdown.find('.hsl-display');

        const r = Math.round(color.r * brightness);
        const g = Math.round(color.g * brightness);
        const b = Math.round(color.b * brightness);
        const parsedOpacity = parseFloat(opacity); // Sicherstellen, dass Opacity ein Float ist

        console.log('Received values - R:', r, 'G:', g, 'B:', b, 'Brightness:', brightness, 'Opacity:', parsedOpacity);

        // HEX-Wert berechnen
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

        // Generiere immer RGBA (auch wenn Opacity 1 ist)
        const rgba = `rgba(${r}, ${g}, ${b}, ${parsedOpacity})`;

        // HSL(A)-Wert berechnen
        const hsl = rgbToHsl(r, g, b, parsedOpacity, true);


        // Farbwerte in den Displays anzeigen
        $hexDisplay.text(`HEX: ${hex}`);
        $rgbDisplay.text(`RGB(A): ${rgba}`);
        $hslDisplay.text(`HSL(A): ${hsl}`);

        $preview.css('background-color', rgba);

        // In den Daten des Elements speichern
        const colorFormats = {
            hex: hex,
            rgb: rgba,
            hsl: hsl
        };

        $element.data('selected', colorFormats);
        setMarker($element);

        if (setColorToElement) {
            updateButtonColor($element, rgba);
            switch (settings.format.toLowerCase()) {
                case 'hex':
                    $element.val(hex);
                    break;
                case 'rgba':
                case 'rgb':
                    $element.val(rgba);
                    break;
                case 'hsl':
                case 'hsla':
                    $element.val(hsl);
                    break;
            }
        }


        // Debugging: Ausgaben überprüfen
        console.log('Saved colorFormats:', colorFormats);
    }

    function createFilledColorWheel() {
        const size = 300;
        const radius = size / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - radius;
                const dy = y - radius;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= radius) {
                    const angle = Math.atan2(dy, dx);
                    const hue = ((angle * 180) / Math.PI + 360) % 360;
                    const saturation = distance / radius;

                    context.fillStyle = `hsl(${hue}, ${saturation * 100}%, 50%)`;
                    context.fillRect(x, y, 1, 1);
                }
            }
        }

        return canvas;
    }

    function rgbToHsl(r, g, b, a = 1, returnAsString = false) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // Grau (kein Farbton)
        } else {
            const delta = max - min;
            s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / delta + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / delta + 2;
                    break;
                case b:
                    h = (r - g) / delta + 4;
                    break;
            }

            h /= 6;
        }

        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);

        if (returnAsString) {
            return a === 1 ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${a})`;
        }

        // Rückgabe als Objekt inkl. Alpha
        return {h, s, l, a};
    }

}(jQuery))
