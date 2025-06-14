function createColorPicker(initialColor) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.padding = '10px';
    let currentOpacity = 1; // Hier stattdessen definieren

    /**
     * Generates and returns a canvas element with a fully interactive color wheel interface.
     * The color wheel includes a main color square for saturation and value adjustments,
     * a hue slider for selecting hues, and a preview section for the currently selected color.
     *
     * @return {HTMLCanvasElement} A canvas element containing the color selection interface.
     */
    function createFilledColorWheel() {
        const size = 200;          // Größe des Farbfelds bleibt gleich
        const sliderWidth = 14;    // Breite des Hue-Sliders bleibt gleich
        const padding = 10;        // Padding bleibt gleich
        const previewSize = 50;    // GEÄNDERT: von 200 auf 50 reduziert
        // Hier erweitern wir die totalWidth um einen weiteren Slider + Padding
        const totalWidth = previewSize + padding + size + padding + sliderWidth + padding + sliderWidth;


        const canvas = document.createElement('canvas');
        canvas.width = totalWidth;
        canvas.height = size;
        const context = canvas.getContext('2d');

        let currentHue = 0;
        let currentSaturation = 1;
        let currentValue = 1;
        let activeControl = null;

        /**
         * Calculates the mouse position relative to the canvas element, scaled based on the canvas dimensions and its bounding rectangle.
         *
         * @param {MouseEvent} e The mouse event object containing the clientX and clientY properties.
         * @return {Object} An object containing the x and y coordinates of the mouse position relative to the canvas, scaled appropriately.
         * @note ready
         */
        function getMousePosition(e) {
            const rect = canvas.getBoundingClientRect();
            // Skalierungsfaktor berechnen
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            // Mausposition relativ zur Canvas berechnen und skalieren
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            console.log('Canvas Position:', rect);
            console.log('Scale factors:', {scaleX, scaleY});
            console.log('Mouse relative to canvas:', {x, y});

            return {x, y};
        }

        /**
         * Handles the click event on the hue slider, calculating and updating the current hue based on the click position.
         *
         * @param {Object} pos - The position object containing the coordinates of the click.
         * @param {number} pos.y - The vertical position of the click on the hue slider.
         * @return {void} This method does not return any value.
         */
        function handleHueClick(pos) {
            const relativeY = Math.max(0, Math.min(size - 1, pos.y));
            currentHue = (relativeY / (size - 1)) * 360;
            updateColor();
        }

        /**
         * Determines the area that has been clicked based on the provided x-coordinate.
         *
         * @param {number} x - The x-coordinate of the click relative to the canvas.
         * @return {string} Returns 'color' if the click is in the color field, 'hue' if the click is in the hue-slider area, and 'none' if the click is outside these areas.
         */
        function getClickedArea(x) {
            if (x >= previewSize + padding && x < previewSize + padding + size) {
                return 'color';
            }
            if (x >= previewSize + padding + size + padding && x < previewSize + padding + size + padding + sliderWidth) {
                return 'hue';
            }
            if (x >= previewSize + padding + size + padding + sliderWidth + padding && x < totalWidth) {
                return 'opacity';
            }
            return 'none';
        }

        function handleOpacityClick(pos) {
            const relativeY = Math.max(0, Math.min(size - 1, pos.y));
            currentOpacity = 1 - (relativeY / (size - 1));
            updateColor();
        }


        /**
         * Draws a circular marker on a canvas at the specified coordinates.
         * The function ensures the marker's position is within the bounds,
         * and its appearance changes slightly if it is on a hue slider.
         *
         * @param {number} x - The x-coordinate of the marker position.
         * @param {number} y - The y-coordinate of the marker position.
         * @param {boolean} [isHueSlider=false] - Indicates whether the marker is being drawn on a hue slider.
         * @return {void} Does not return a value.
         * @done
         */
        function drawMarker(x, y, isHueSlider = false) {
            x = Math.max(previewSize + padding + (isHueSlider ? size + padding + sliderWidth / 2 : 6),
                Math.min(x, previewSize + padding + (isHueSlider ? totalWidth - 6 : size - 6)));
            y = Math.max(6, Math.min(y, size - 6));

            context.beginPath();
            context.arc(x, y, 6, 0, 2 * Math.PI);
            context.strokeStyle = 'white';
            context.lineWidth = 2;
            context.stroke();
            context.beginPath();
            context.arc(x, y, 5, 0, 2 * Math.PI);
            context.strokeStyle = 'black';
            context.lineWidth = 1;
            context.stroke();
        }

        /**
         * Draws a preview with a transparency checkerboard background, a colored overlay, and a border.
         *
         * @param {string} color - The color to fill the preview area with.
         * @return {void} This function does not return a value.
         */
        function drawPreview(color) {
            // Schachbrettmuster für Transparenz
            for (let x = 0; x < previewSize; x += 10) {
                for (let y = 0; y < previewSize; y += 10) {
                    context.fillStyle = (x + y) % 20 === 0 ? '#fff' : '#eee';
                    context.fillRect(x, y, 10, 10);
                }
            }

            context.fillStyle = color;
            context.fillRect(0, 0, previewSize, previewSize);

            context.strokeStyle = '#000';
            context.lineWidth = 1;
            context.strokeRect(0, 0, previewSize, previewSize);
        }

        /**
         * Renders the main square of a color visualization based on a given hue and size.
         *
         * @param {number} baseHue - The base hue of the square in HSV color space (range: 0-360).
         * @return {void} Does not return any value. The function updates the canvas with the rendered square.
         */
        function drawMainSquare(baseHue) {
            const imageData = context.createImageData(size, size);
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const s = x / (size - 1);
                    const v = 1 - (y / (size - 1));
                    const rgb = HSVtoRGB(baseHue, s, v);
                    const idx = (y * size + x) * 4;
                    imageData.data[idx] = rgb.r;
                    imageData.data[idx + 1] = rgb.g;
                    imageData.data[idx + 2] = rgb.b;
                    imageData.data[idx + 3] = 255;
                }
            }
            context.putImageData(imageData, previewSize + padding, 0);
        }

        /**
         * Draws a vertical hue slider onto the canvas by creating an image data object and populating it with hue-based RGB colors.
         * The slider displays a gradient transitioning through all hues from top to bottom.
         *
         * @return {void} Does not return a value. Executes drawing operations directly on the canvas context.
         */
        function drawHueSlider() {
            const imageData = context.createImageData(sliderWidth, size);
            for (let y = 0; y < size; y++) {
                const hue = (y / (size - 1)) * 360;
                const rgb = HSVtoRGB(hue, 1, 1);
                for (let x = 0; x < sliderWidth; x++) {
                    const idx = (y * sliderWidth + x) * 4;
                    imageData.data[idx] = rgb.r;
                    imageData.data[idx + 1] = rgb.g;
                    imageData.data[idx + 2] = rgb.b;
                    imageData.data[idx + 3] = 255;
                }
            }
            context.putImageData(imageData, previewSize + padding + size + padding, 0);
        }

        function drawOpacitySlider() {
            const imageData = context.createImageData(sliderWidth, size);
            const rgb = HSVtoRGB(currentHue, currentSaturation, currentValue);

            for (let y = 0; y < size; y++) {
                const alpha = 1 - (y / (size - 1));
                for (let x = 0; x < sliderWidth; x++) {
                    const idx = (y * sliderWidth + x) * 4;
                    // Schachbrettmuster für Transparenz mit 5x5 Pixel Kacheln
                    const isCheckerboard = ((Math.floor(y / 5) + Math.floor(x / 5)) % 2 === 0);
                    const baseColor = isCheckerboard ? 255 : 220;

                    imageData.data[idx] = baseColor;
                    imageData.data[idx + 1] = baseColor;
                    imageData.data[idx + 2] = baseColor;
                    imageData.data[idx + 3] = 255;
                }
            }
            context.putImageData(imageData, previewSize + padding + size + padding + sliderWidth + padding, 0);

            // Zeichne den Farbverlauf darüber
            context.save();
            context.globalCompositeOperation = 'source-over';
            const gradient = context.createLinearGradient(0, 0, 0, size);
            gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`);
            gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
            context.fillStyle = gradient;
            context.fillRect(previewSize + padding + size + padding + sliderWidth + padding, 0, sliderWidth, size);
            context.restore();
        }

        /**
         * Handles a click event on the color area, calculates the corresponding saturation and value,
         * and updates the current color settings based on the click position.
         *
         * @param {Object} pos An object representing the click position.
         * @param {number} pos.x The x-coordinate of the click position.
         * @param {number} pos.y The y-coordinate of the click position.
         * @return {void} Does not return a value; only updates internal state and logs debug information.
         */
        function handleColorAreaClick(pos) {
            // HIER: Debug-Ausgabe hinzufügen
            console.log('Color click raw position:', pos);

            const colorAreaX = pos.x - (previewSize + padding);
            const relativeY = pos.y;

            // HIER: Debug-Ausgabe der berechneten Position
            console.log('Color click calculated position:', {
                colorAreaX,
                relativeY,
                previewSize,
                padding
            });

            const s = Math.max(0, Math.min(1, colorAreaX / size));
            const v = Math.max(0, Math.min(1, 1 - (relativeY / size)));

            currentSaturation = s;
            currentValue = v;
            updateColor();
        }

        function updateColor() {
            context.clearRect(0, 0, totalWidth, size);

            const rgb = HSVtoRGB(currentHue, currentSaturation, currentValue);
            const rgbaColor = `rgba(${rgb.r},${rgb.g},${rgb.b},${currentOpacity})`;

            drawPreview(rgbaColor);
            drawMainSquare(currentHue);
            drawHueSlider();
            drawOpacitySlider();

            // Zeichne die Marker
            const mainX = previewSize + padding + (currentSaturation * size);
            const mainY = (1 - currentValue) * size;
            drawMarker(mainX, mainY);

            const hueY = (currentHue / 360) * size;
            drawMarker(previewSize + padding + size + padding + sliderWidth / 2, hueY, true);

            const opacityY = (1 - currentOpacity) * size;
            drawMarker(previewSize + padding + size + padding + sliderWidth + padding + sliderWidth / 2, opacityY, true);

            canvas.dispatchEvent(new CustomEvent('colorchange', {
                detail: {
                    hex: RGBtoHex(rgb.r, rgb.g, rgb.b),
                    rgb: rgb,
                    opacity: currentOpacity,
                    hsv: {h: currentHue, s: currentSaturation, v: currentValue}
                }
            }));
        }

        // Optional: Debug-Ausgabe hinzufügen
        canvas.addEventListener('mousedown', function (e) {
            const pos = getMousePosition(e);
            const area = getClickedArea(pos.x);

            if (area === 'color') {
                activeControl = 'color';
                handleColorAreaClick(pos);
            } else if (area === 'hue') {
                activeControl = 'hue';
                handleHueClick(pos);
            } else if (area === 'opacity') {
                activeControl = 'opacity';
                handleOpacityClick(pos);
            }
        });

        document.addEventListener('mousemove', function (e) {
            if (!activeControl) return;

            const pos = getMousePosition(e);
            if (activeControl === 'color') {
                handleColorAreaClick(pos);
            } else if (activeControl === 'hue') {
                handleHueClick(pos);
            } else if (activeControl === 'opacity') {
                handleOpacityClick(pos);
            }
        });

        document.addEventListener('mouseup', function () {
            activeControl = null;
        });

        canvas.updateFromHSV = function (h, s, v) {
            currentHue = h;
            currentSaturation = s;
            currentValue = v;
            updateColor();
        };

        updateColor();
        return canvas;
    }

    const colorWheel = createFilledColorWheel();

    /**
     * Sets the color based on the provided initial color value.
     * The method accepts different formats such as hex, RGB, RGBA, HSV, or named colors.
     * Updates the color wheel and related elements accordingly.
     *
     * @param {string} initialColor - The color value to set. It can be in hex format (#RRGGBB),
     *                                RGB(A) format (e.g., `rgb(255,0,0)` or `rgba(255,0,0,0.5)`),
     *                                HSV format, or as a named color (e.g., 'red', 'blue').
     * @return {void} No value is returned but updates the color representation in the application.
     */
    function setColor(initialColor) {
        try {
            let rgb;
            let hsv;
            let alpha = 1;

            if (typeof initialColor === 'string') {
                if (initialColor.startsWith('#')) {
                    // HEX Format - prüfen ob 8-stellig (mit Alpha)
                    if (initialColor.length === 9) {  // #RRGGBBAA
                        const alphaHex = initialColor.slice(7);
                        alpha = parseInt(alphaHex, 16) / 255;
                        rgb = hexToRGB(initialColor.slice(0, 7));
                    } else {
                        rgb = hexToRGB(initialColor);
                    }
                } else if (initialColor.includes(',')) {
                    // Prüfe auf rgba Format
                    const rgbaMatch = initialColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*([0-9.]+)?\s*\)/);
                    if (rgbaMatch) {
                        rgb = {
                            r: parseInt(rgbaMatch[1]),
                            g: parseInt(rgbaMatch[2]),
                            b: parseInt(rgbaMatch[3])
                        };
                        alpha = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
                    } else {
                        // Prüfe auf hsla Format
                        const hslaMatch = initialColor.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,?\s*([0-9.]+)?\s*\)/);
                        if (hslaMatch) {
                            hsv = {
                                h: parseFloat(hslaMatch[1]),
                                s: parseFloat(hslaMatch[2]) / 100,
                                v: parseFloat(hslaMatch[3]) / 100
                            };
                            alpha = hslaMatch[4] ? parseFloat(hslaMatch[4]) : 1;
                        } else {
                            const values = initialColor.split(',').map(v => parseFloat(v.trim()));
                            if (values.length >= 3) {
                                if (values[0] <= 360 && values[1] <= 100 && values[2] <= 100) {
                                    // HSV Format
                                    hsv = {
                                        h: values[0],
                                        s: values[1] / 100,
                                        v: values[2] / 100
                                    };
                                    // Wenn ein vierter Wert existiert, ist es Alpha
                                    if (values.length > 3) {
                                        alpha = values[3];
                                    }
                                } else {
                                    // RGB/RGBA Format
                                    rgb = {r: values[0], g: values[1], b: values[2]};
                                    if (values.length > 3) {
                                        alpha = values[3];
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // Benannte Farbe
                    const temp = document.createElement('div');
                    temp.style.color = initialColor;
                    document.body.appendChild(temp);
                    const computedColor = window.getComputedStyle(temp).color;
                    document.body.removeChild(temp);

                    // Prüfe auch hier auf rgba Format im computed Style
                    const match = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
                    if (match) {
                        rgb = {
                            r: parseInt(match[1]),
                            g: parseInt(match[2]),
                            b: parseInt(match[3])
                        };
                        if (match[4]) {
                            alpha = parseFloat(match[4]);
                        }
                    }
                }

                // Konvertiere RGB zu HSV wenn nötig
                if (rgb && !hsv) {
                    hsv = RGBtoHSV(rgb.r, rgb.g, rgb.b);
                }
            }

            if (hsv) {
                // Setze den Alpha-Wert
                currentOpacity = alpha;
                colorWheel.updateFromHSV(hsv.h, hsv.s, hsv.v);
                // Wichtig: Aktualisiere auch die Eingabefelder
                updateAllFormats(rgb || HSVtoRGB(hsv.h, hsv.s, hsv.v));
                // Zeichne den Opacity-Slider neu mit dem neuen Wert
                drawOpacitySlider(); // Falls diese Funktion existiert
            }
        } catch (e) {
            console.error('Ungültiges Farbformat:', e);
        }
    }

    container.appendChild(colorWheel);

    const inputsContainer = document.createElement('div');
    inputsContainer.classList.add('d-flex');
    inputsContainer.classList.add('justify-content-between');
    inputsContainer.classList.add('flex-wrap');
    inputsContainer.classList.add('mt-2');
    inputsContainer.style.gap = '10px';

    const inputs = {
        hex: createInputGroup('HEX', '#ff0000'),
        rgb: createInputGroup('RGBA', '255, 0, 0'),
        cmyk: createInputGroup('CMYK', '0, 100, 100, 0'),
        hsv: createInputGroup('HSV', '0, 100, 100'),
        hsl: createInputGroup('HSLA', '0, 100, 50')
    };

    Object.values(inputs).forEach(group => inputsContainer.appendChild(group.container));
    container.appendChild(inputsContainer);

    if (initialColor) {
        setColor(initialColor);
    }

    /**
     * Creates an input group with a label and an input field, styled and encapsulated in a container element.
     *
     * @param {string} label - The text to display in the label associated with the input field.
     * @param {string} placeholder - The placeholder text to display in the input field.
     * @return {{container: HTMLElement, input: HTMLInputElement}} - An object containing the container element and the input element.
     */
    function createInputGroup(label, placeholder) {
        const container = document.createElement('div');
        container.classList.add('d-flex');
        container.classList.add('flex-column');
        container.classList.add('flex-fill');
        container.style.gap = '5px';

        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.style.fontSize = '12px';
        labelElement.style.fontWeight = 'bold';
        labelElement.classList.add('form-label');
        labelElement.classList.add('mb-0');

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.style.width = '150px';
        input.classList.add('form-control');
        input.classList.add('form-control-sm');

        container.appendChild(labelElement);
        container.appendChild(input);

        return {container, input};
    }

    // Farbkonvertierungsfunktionen
    /**
     * Converts a color in HSV (Hue, Saturation, Value) format to its RGB (Red, Green, Blue) representation.
     *
     * @param {number} h The hue component of the color, in degrees (0-360).
     * @param {number} s The saturation component of the color, as a decimal fraction (0-1).
     * @param {number} v The value component of the color, as a decimal fraction (0-1).
     * @return {Object} An object representing the color in RGB format, with `r`, `g`, and `b` properties (each in the range 0-255).
     * @note done
     */
    function HSVtoRGB(h, s, v) {
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
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Converts RGB color values to HSV color values.
     *
     * @param {number} r The red component of the color, ranging from 0 to 255.
     * @param {number} g The green component of the color, ranging from 0 to 255.
     * @param {number} b The blue component of the color, ranging from 0 to 255.
     * @return {Object} An object with properties `h`, `s`, and `v` representing the hue (0-360 degrees),
     * saturation (0-1), and value (0-1) of the color in HSV format.
     */
    function RGBtoHSV(r, g, b) {
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
    }

    /**
     * Converts RGB color values to a HEX color string.
     *
     * @param {number} r - The red component of the color, ranging from 0 to 255.
     * @param {number} g - The green component of the color, ranging from 0 to 255.
     * @param {number} b - The blue component of the color, ranging from 0 to 255.
     * @return {string} The HEX color string in the format "#RRGGBB".
     * @done
     */
    function RGBtoHex(r, g, b) {
        const toHex = (n) => {
            const hex = Math.round(n).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Converts a hexadecimal color value to an RGB object.
     *
     * @param {string} hex - A hexadecimal color string. It can be in the format #RRGGBB or #RGB.
     * @return {{r: number, g: number, b: number}} An object representing the red, green, and blue components of the color.
     * @throws {Error} Throws an error if the provided hex string has an invalid format.
     */
    function hexToRGB(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(h => h + h).join('');
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error('Ungültiges HEX-Format');
        return {r, g, b};
    }

    /**
     * Converts RGB color values to HSL format.
     *
     * @param {number} r - The red component of the color, in the range 0 to 255.
     * @param {number} g - The green component of the color, in the range 0 to 255.
     * @param {number} b - The blue component of the color, in the range 0 to 255.
     * @return {Object} An object containing the HSL representation of the color:
     *                  h (hue, in the range 0 to 360),
     *                  s (saturation, in the range 0 to 1),
     *                  and l (lightness, in the range 0 to 1).
     */
    function RGBtoHSL(r, g, b) {
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
    }

    /**
     * Converts RGB color values to CMYK color values.
     *
     * @param {number} r - The red component of the color, ranging from 0 to 255.
     * @param {number} g - The green component of the color, ranging from 0 to 255.
     * @param {number} b - The blue component of the color, ranging from 0 to 255.
     * @return {Object} An object containing CMYK values:
     * - c: Cyan component as a percentage (0-100).
     * - m: Magenta component as a percentage (0-100).
     * - y: Yellow component as a percentage (0-100).
     * - k: Black key component as a percentage (0-100).
     */
    function RGBtoCMYK(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const k = 1 - Math.max(r, g, b);
        const c = (1 - r - k) / (1 - k) || 0;
        const m = (1 - g - k) / (1 - k) || 0;
        const y = (1 - b - k) / (1 - k) || 0;

        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }

    Object.entries(inputs).forEach(([format, group]) => {
        group.input.addEventListener('change', (e) => {
            updateFromInput(format, e.target.value);
        });
    });

    /**
     * Updates the color values based on the input format and value.
     *
     * @param {string} sourceFormat - The format of the color input (e.g., 'hex', 'rgb', 'hsv', 'cmyk', 'hsl').
     * @param {string} value - The color value in the specified format.
     * @return {void} This function does not return anything.
     */
    function updateFromInput(sourceFormat, value) {
        let rgb;
        let hsv;
        let opacity = currentOpacity; // Behalte aktuelle Opacity als Standard

        try {
            switch (sourceFormat) {
                case 'hex':
                    rgb = hexToRGB(value);
                    hsv = RGBtoHSV(rgb.r, rgb.g, rgb.b);
                    break;
                case 'rgb':
                    const rgbValues = value.split(',').map(n => parseFloat(n.trim()));
                    if (rgbValues.length >= 4) {
                        // Wenn ein Alpha-Wert vorhanden ist
                        opacity = rgbValues[3];
                        rgb = {r: rgbValues[0], g: rgbValues[1], b: rgbValues[2]};
                    } else {
                        rgb = {r: rgbValues[0], g: rgbValues[1], b: rgbValues[2]};
                    }
                    hsv = RGBtoHSV(rgb.r, rgb.g, rgb.b);
                    break;
                case 'hsv':
                    const [h, s, v] = value.split(',').map(n => parseFloat(n.trim()));
                    hsv = {h, s: s / 100, v: v / 100};
                    rgb = HSVtoRGB(h, s / 100, v / 100);
                    break;
                case 'cmyk':
                    const [c, m, y, k] = value.split(',').map(n => parseFloat(n.trim()));
                    const cmyk = {c, m, y, k};
                    rgb = cmykToRGB(cmyk);
                    hsv = RGBtoHSV(rgb.r, rgb.g, rgb.b);
                    break;
                case 'hsl':
                    const [hh, ss, l, a] = value.split(',').map(n => parseFloat(n.trim()));
                    const hsl = {h: hh, s: ss / 100, l: l / 100};
                    if (!isNaN(a)) {
                        opacity = a; // Setze opacity wenn ein Alpha-Wert angegeben wurde
                    }
                    rgb = hslToRGB(hsl);
                    hsv = RGBtoHSV(rgb.r, rgb.g, rgb.b);
                    break;

            }

            currentOpacity = opacity;
            colorWheel.updateFromHSV(hsv.h, hsv.s, hsv.v);
        } catch (e) {
            console.error('Ungültiges Format:', e);
        }
    }

    /**
     * Updates all color format input values (Hex, RGB, HSV, HSL, and CMYK) based on the provided RGB values.
     *
     * @param {Object} rgb An object containing the red, green, and blue color components.
     * @param {number} rgb.r The red component, with a value between 0 and 255.
     * @param {number} rgb.g The green component, with a value between 0 and 255.
     * @param {number} rgb.b The blue component, with a value between 0 and 255.
     * @return {void} Does not return a value. Updates relevant inputs with the converted color values.
     */
    function updateAllFormats(rgb) {
        const hex = RGBtoHex(rgb.r, rgb.g, rgb.b);
        const hsv = RGBtoHSV(rgb.r, rgb.g, rgb.b);
        const hsl = RGBtoHSL(rgb.r, rgb.g, rgb.b);
        const cmyk = RGBtoCMYK(rgb.r, rgb.g, rgb.b);

        inputs.hex.input.value = hex;
        inputs.rgb.input.value = `${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentOpacity.toFixed(2)}`;
        inputs.hsv.input.value = `${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}, ${Math.round(hsv.v * 100)}`;
        inputs.hsl.input.value = `${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}, ${Math.round(hsl.l * 100)}, ${currentOpacity.toFixed(2)}`;
        inputs.cmyk.input.value = `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`;
    }

    /**
     * Converts CMYK color values to RGB color values.
     *
     * @param {Object} cmyk - An object containing CMYK values.
     * @param {number} cmyk.c - The cyan value (0-100).
     * @param {number} cmyk.m - The magenta value (0-100).
     * @param {number} cmyk.y - The yellow value (0-100).
     * @param {number} cmyk.k - The key (black) value (0-100).
     * @return {Object} An object containing the RGB color values.
     * @return {number} return.r - The red value (0-255).
     * @return {number} return.g - The green value (0-255).
     * @return {number} return.b - The blue value (0-255).
     */
    function cmykToRGB({c, m, y, k}) {
        c /= 100;
        m /= 100;
        y /= 100;
        k /= 100;

        const r = Math.round(255 * (1 - c) * (1 - k));
        const g = Math.round(255 * (1 - m) * (1 - k));
        const b = Math.round(255 * (1 - y) * (1 - k));

        return {r, g, b};
    }

    /**
     * Converts an HSL color value to its RGB representation.
     *
     * @param {Object} hsl - An object representing the HSL color.
     * @param {number} hsl.h - The hue value (0-360).
     * @param {number} hsl.s - The saturation value (0-1).
     * @param {number} hsl.l - The lightness value (0-1).
     * @return {Object} An object representing the RGB color.
     * @return {number} return.r - The red value (0-255).
     * @return {number} return.g - The green value (0-255).
     * @return {number} return.b - The blue value (0-255).
     */
    function hslToRGB({h, s, l}) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, (h / 360 + 1 / 3));
            g = hue2rgb(p, q, (h / 360));
            b = hue2rgb(p, q, (h / 360 - 1 / 3));
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    colorWheel.addEventListener('colorchange', function (e) {
        updateAllFormats(e.detail.rgb);
    });

    return container;
}

// const picker = createColorPicker('rgba(255,255,0)');
// const wrapper = document.createElement('div');
// wrapper.style.width = '400px';  // Fixe Breite
// wrapper.style.height = 'auto';  // Höhe automatisch anpassen
// wrapper.style.position = 'relative';
// wrapper.appendChild(picker);
// document.body.appendChild(wrapper);
