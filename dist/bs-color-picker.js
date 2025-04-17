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
            debug: true
        }
    };

    const wrapperClass = 'bs-color-picker-wrapper';
    const submitBtnClass = 'bs-color-picker-submit';
    const canvasClass = 'bs-color-picker-canvas';
    const markerClass = 'bs-color-picker-marker';
    const previewClass = 'bs-color-picker-preview';

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
                    setValues($element, params);
                    break;
            }
        }

        return $element;
    };

    function parseColor(color) {
        // Hex-Farbwerte: #RRGGBB
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            return hexToRgb(color); // Bestehende Funktion verwenden
        }

        // RGB oder RGBA: rgb(255, 0, 45) oder rgba(255, 0, 45, 0.5)
        const rgbaRegex = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([01](?:\.\d+)?))?\s*\)$/;
        const match = rgbaRegex.exec(color);

        if (match) {
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            const a = match[5] ? parseFloat(match[5]) : 1;

            // RGB-Werte validieren
            if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 1) {
                console.error('Ungültige RGBA-Werte:', { r, g, b, a });
                return null;
            }

            console.log('Parsed RGBA:', { r, g, b, a }); // Debug-Ausgabe
            return { r, g, b, a }; // Rückgabe als Objekt
        }

        // Ungültiges Format
        console.error('Ungültiges Farbformat:', color);
        return null;
    }
    function setValues($element, color) {
        console.log('Eingabefarbe:', color); // Debug-Ausgabe zur Überprüfung der Eingabe

        // Farbe parsen
        const parsedColor = parseColor(color);

        if (!parsedColor) {
            console.error('Farbkonvertierung fehlgeschlagen:', color);
            return;
        }

        console.log('Konvertierte Farbwerte:', parsedColor);

        // RGB in HSL konvertieren
        const colorInHsl = rgbToHsl(parsedColor.r, parsedColor.g, parsedColor.b, parsedColor.a, false);

        if (!colorInHsl) {
            console.error('HSL-Konvertierung fehlgeschlagen:', parsedColor);
            return;
        }

        // Berechnung der Marker-Position
        const hue = colorInHsl.h;
        const saturation = colorInHsl.s;
        const radius = 150; // Beispielwert
        const angleInRadians = (hue * Math.PI) / 180;
        const distanceFromCenter = radius * (saturation / 100);

        console.log('Berechnete Werte:', { hue, saturation, angleInRadians, distanceFromCenter });

        // Marker-Position berechnen
        const x = radius + distanceFromCenter * Math.cos(angleInRadians);
        const y = radius + distanceFromCenter * Math.sin(angleInRadians);

        console.log('Marker Position:', { x, y });

        const $marker = $element.find('.bs-color-picker-marker');
        if (!isNaN(x) && !isNaN(y)) {
            // Berücksichtige Alpha-Wert bei der CSS-Hintergrundfarbe
            const backgroundColor = colorInHsl.a === 1
                ? `hsl(${colorInHsl.h}, ${colorInHsl.s}%, ${colorInHsl.l}%)`
                : `hsla(${colorInHsl.h}, ${colorInHsl.s}%, ${colorInHsl.l}%, ${colorInHsl.a})`;

            $marker.css({
                left: `${x}px`,
                top: `${y}px`,
                backgroundColor: backgroundColor,
            });

            console.log('Hintergrundfarbe des Markers:', backgroundColor);
        }
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

        console.log('Konvertierte HEX zu RGB:', { r, g, b }); // Debug-Ausgabe
        return { r, g, b };
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
        $dropdown.on('click', '.' + submitBtnClass, function (e) {
            e.preventDefault();
            // Hol alle gespeicherten Formate
            const selectedFormats = $element.data('selected');

            if (selectedFormats) {
                // Speichere alle Formate im data-selected
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
                // Alle vorhandenen Klassen holen
                const classes = $dropdownButton.attr('class').split(/\s+/);

                // Filtere die Klassen, die mit 'btn-' beginnen
                const btnClasses = classes.filter(c => c.startsWith('btn-'));

                // Entferne jede gefundene 'btn-' Klasse
                $dropdownButton.removeClass(btnClasses.join(' '));

                $dropdownButton.dropdown('hide'); // Bootstrap schließt programmgesteuert
                $dropdownButton.css('backgroundColor', selectedFormats.rgb);
            }
        })
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

        // Farbring dem Dropdown-Menü hinzufügen
        createFilledColorWheel($element, dropdownMenu);

        // Übernehmen-Button hinzufügen
        const $submitButton = $('<button>', {
            text: 'Übernehmen',
            class: 'btn btn-primary mt-3 ' + submitBtnClass,
        });

        // Übernehmen-Button ins Menü einfügen
        dropdownMenu.append($submitButton);
    }

    function setMarkerPosition($element, color) {
        const $marker = getMarker($element);
        const $canvas = getCanvas($element);
        const canvas = $canvas[0];
        const ctx = canvas.getContext('2d');

    }
    function updatePreviewAndValues($element, color, brightness, opacity, $preview, $hexDisplay, $rgbDisplay, $hslDisplay) {
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
        const hsl = rgbToHsl(r, g, b, parsedOpacity);

        // Vorschaufeld aktualisieren
        $preview.css('background-color', rgba);

        // Farbwerte in den Displays anzeigen
        $hexDisplay.text(`HEX: ${hex}`);
        $rgbDisplay.text(`RGB(A): ${rgba}`);
        $hslDisplay.text(`HSL(A): ${hsl}`);

        // In den Daten des Elements speichern
        const colorFormats = {
            hex: hex,
            rgb: rgba,
            hsl: hsl
        };

        $element.data('selected', colorFormats);

        // Debugging: Ausgaben überprüfen
        console.log('Saved colorFormats:', colorFormats);
    }

    function createFilledColorWheel($element, $menu) {
        const settings = getSettings($element);
        const size = 300; // Durchmesser des Kreises
        const radius = size / 2; // Radius des Kreises
        let currentOpacity = 1; // Standard-Deckkraft
        let currentBrightness = 1; // Standard-Helligkeit
        let selectedColor = null; // Zuletzt ausgewählte Farbe (RGB)

        // Sicherstellen, dass Settings existieren
        const emptyColor = settings.emptyColor || '#FFFFFF';

        // Container für den Farbkreis
        const $colorContainer = $('<div>', {
            class: 'full-color-wheel',
            style: `
            width: ${size}px;
            height: ${size}px;
            position: relative;
            clip-path: circle(${radius}px at ${radius}px ${radius}px); /* Zuschneiden auf Kreis */
            overflow: hidden;
        `,
        });

        // Canvas für das Farbrad
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        // Farbrad rendern
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - radius; // Entfernung zur Mitte (x-Achse)
                const dy = y - radius; // Entfernung zur Mitte (y-Achse)
                const distance = Math.sqrt(dx * dx + dy * dy); // Distanz zur Mitte

                if (distance <= radius) {
                    const angle = Math.atan2(dy, dx);
                    const hue = ((angle * 180) / Math.PI + 360) % 360; // Winkel -> Farbton
                    const saturation = distance / radius; // Sättigung

                    const color = `hsl(${hue}, ${saturation * 100}%, 50%)`; // HSL-Farbe
                    context.fillStyle = color;
                    context.fillRect(x, y, 1, 1);
                }
            }
        }

        // Canvas ins DOM einfügen
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

        // Vorschaufeld für die aktuelle Farbe
        const $preview = $('<div>', {
            class: previewClass,
            style: `
            width: 100%;
            height: 30px;
            margin-top: 10px;
            border: 1px solid #ddd;
            background: ${emptyColor}; /* Standardfarbe aus den Settings */
        `,
        });

        const $hexDisplay = $('<div>', {
            class: 'hex-display mt-2',
            style: 'font-size: 12px;',
            text: `HEX: ${emptyColor}`, // Initialwert aus emptyColor
        });

        const $rgbDisplay = $('<div>', {
            class: 'rgb-display',
            style: 'font-size: 12px;',
            text: `RGB: rgb(255, 255, 255)`, // Standardwert
        });

        const $hslDisplay = $('<div>', {
            class: 'hsl-display',
            style: 'font-size: 12px;',
            text: `HSL: hsl(0, 0%, 100%)`, // Standard-Helligkeit bei Weiß
        });

        $canvas.on('click', function (event) {
            const offset = $canvas.offset();
            const clickX = event.pageX - offset.left;
            const clickY = event.pageY - offset.top;

            const pixel = context.getImageData(clickX, clickY, 1, 1).data;
            const [r, g, b] = pixel;

            selectedColor = {r, g, b};

            updatePreviewAndValues($element, selectedColor, currentBrightness, currentOpacity, $preview, $hexDisplay, $rgbDisplay, $hslDisplay);

            $marker.css({
                top: clickY + 'px',
                left: clickX + 'px',
                background: `rgba(${r}, ${g}, ${b}, ${currentOpacity})`,
                display: 'block',
            });
        });

        const $brightnessSlider = $('<input>', {
            type: 'range',
            min: 0,
            max: 1,
            step: 0.01,
            value: currentBrightness,
            class: 'brightness-slider form-range',
        }).on('input', function () {
            currentBrightness = parseFloat($(this).val());
            if (!selectedColor) selectedColor = hexToRgb(emptyColor);
            updatePreviewAndValues($element, selectedColor, currentBrightness, currentOpacity, $preview, $hexDisplay, $rgbDisplay, $hslDisplay);
        });

        const $opacitySlider = $('<input>', {
            type: 'range',
            min: 0,
            max: 1,
            step: 0.01,
            value: currentOpacity,
            class: 'opacity-slider form-range',
        }).on('input', function () {
            currentOpacity = parseFloat($(this).val());
            if (!selectedColor) selectedColor = hexToRgb(emptyColor);
            updatePreviewAndValues($element, selectedColor, currentBrightness, currentOpacity, $preview, $hexDisplay, $rgbDisplay, $hslDisplay);
        });

        const $sliderContainer = $('<div>', {
            style: 'text-align: center; margin-top: 10px;',
        }).append($brightnessSlider, $opacitySlider);

        $menu.append($colorContainer, $preview, $hexDisplay, $rgbDisplay, $hslDisplay, $sliderContainer);
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
        return { h, s, l, a };
    }

}(jQuery))
