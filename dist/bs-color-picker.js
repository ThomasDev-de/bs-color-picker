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
            // Den Wert explizit setzen
            $element.val($element.attr('value'));
            $element.hide();
            buildDropdown($element);
            events($element);
            if($element.val()) {
                setTimeout(() => {
                    setValue($element, $element.val());
                }, 0);

            }
            resolve();
        })
    }

    function events($element) {

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
        }).appendTo(dropdownMenu);

        // Canvas für das Farbrad mit Marker erstellen
        const canvas = createFilledColorWheel();
        const $canvas = $(canvas)
            .css({
                position: 'absolute',
                top: 0,
                left: 0,
            })
            .appendTo($colorContainer)
            .addClass(canvasClass);

        // $colorContainer.append($canvas);

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
        }).appendTo($colorContainer);
        // $colorContainer.append($marker);

        const $previewContainer = $('<div>', {
            class:'d-flex'
        }).appendTo(dropdownMenu);
        // Vorschaufeld
        const $preview = $('<div>', {
            class: previewClass,
            style: `
            width: 60px;
            // height: 30px;
            margin-top: 10px;
            border: 1px solid #ddd;
            background: ${settings.emptyColor};
        `,
        }).appendTo($previewContainer);

        const valuesPreview = $('<div>', {
            class:'ms-3 ml-3'
        }).appendTo($previewContainer);

        // Farbwert-Anzeigen
        const $hexDisplay = $('<div>', {
            class: 'hex-display mt-2',
            style: 'font-size: 12px;',
            text: `HEX: ${settings.emptyColor}`,
        }).appendTo(valuesPreview);

        const $rgbDisplay = $('<div>', {
            class: 'rgb-display',
            style: 'font-size: 12px;',
            text: `RGB: rgb(255, 255, 255)`,
        }).appendTo(valuesPreview);

        const $hslDisplay = $('<div>', {
            class: 'hsl-display',
            style: 'font-size: 12px;',
            text: `HSL: hsl(0, 0%, 100%)`,
        }).appendTo(valuesPreview);

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
        }).appendTo(dropdownMenu);

        $opacitySlider.appendTo($sliderContainer);
        $brightnessSlider.appendTo($sliderContainer);

        // Übernehmen-Button
        const $submitButton = $('<button>', {
            text: 'Übernehmen',
            class: 'btn btn-primary mt-3 ' + submitBtnClass,
        }).appendTo(dropdownMenu);
    }


}(jQuery))
