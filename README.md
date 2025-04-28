# Bootstrap Color Picker Plugin

![License](https://img.shields.io/badge/license-Mit-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![Version](https://img.shields.io/badge/bootstrap-4|5-orange)
![Version](https://img.shields.io/badge/date-2025/04/24-yellow)

A feature-rich and customizable color picker jQuery plugin that seamlessly integrates with Bootstrap 4 or 5.  
This plugin provides an intuitive interface for color selection with support for multiple color formats and
transparency.

![](demo/img.png)

## Features

- Full color spectrum selection with saturation and value controls
- Interactive hue and opacity sliders
- Multiple color format support (HEX, RGB, RGBA, HSL, HSLA, CMYK)
- Real-time color preview
- Customizable button styling
- Bootstrap 4 and 5 compatible
- Support for transparency/opacity
- Responsive design
- Touch-device friendly

## Dependencies

- jQuery 3.x
- Bootstrap 4.x | 5.x
- Bootstrap Icons

## Installation

1. Include the required dependencies in your HTML:

```html
<!-- Bootstrap CSS -->
<link href="vendor/twbs/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Bootstrap Icons -->
<link href="vendor/twbs/bootstrap-icons/font/bootstrap-icons.css" rel="stylesheet">

<!-- jQuery -->
<script src="vendor/components/jquery/jquery.min.js"></script>

<!-- Bootstrap JS -->
<script src="vendor/twbs/bootstrap/dist/js/bootstrap.bundle.min.js"></script>

<!-- Bootstrap Color Picker -->
<script src="dist/bs-color-picker.min.js"></script>
```

2. Create an input element in your HTML:

```html
<input type="text" id="colorPicker">
```

## Usage

### Basic Implementation

```javascript
$('#colorPicker').bsColorPicker();
```

### With Custom Options

```javascript
$('#colorPicker').bsColorPicker({
    btnClass: 'btn-light',
    btnText: 'Change color',
    format: 'rgba'
});
```

## Configuration Options

| Option          | Type    | Default                 | Description                                         |
|-----------------|---------|-------------------------|-----------------------------------------------------|
| `btnClass`      | string  | 'btn-outline-secondary' | Bootstrap button class for the color picker trigger |
| `btnText`       | string  | null                    | Custom text for the color picker button             |
| `btnEmptyColor` | string  | 'rgba(0, 0, 0, 0.5)'    | Color used when no color is selected                |
| `format`        | string  | 'rgba'                  | Color format (hex, rgb, rgba, hsl, hsla, cmyk)      |
| `disabled`      | boolean | false                   | Set the dropdown disabled or not                    |
| `debug`         | boolean | true                    | Enable/disable debug logging                        |
| `icons`         | object  | see below               |                                                     |

## Icons Configuration

Custom icons can be configured using Bootstrap Icons classes:

```javascript
$('#colorPicker').bsColorPicker({
    icons: {
        check: 'bi bi-check-lg fw-bold',
        reset: 'bi bi-arrow-clockwise',
        close: 'bi bi-x-lg',
        empty: 'bi bi-trash3'
    }
});
```

## Methods

### Set Defaults

Set default options for all instances:

```javascript
$.bsColorPicker.setDefaults({
    btnClass: 'btn-primary',
    format: 'hex'
});
```

### Get Defaults

Retrieve current default settings:

```javascript
const defaults = $.bsColorPicker.getDefaults();
```

## Methods

```javascript
$('#colorPicker').bsColorPicker('val', 'red');
$('#colorPicker').bsColorPicker('updateOptions', { btnText: 'beautiful color :)'});
$('#colorPicker').bsColorPicker('destroy');
```

## Events

The plugin triggers the following events:

- `colorchange`: Fired when a color is selected
- `open`: Fired when the picker opens
- `close`: Fired when the picker closes

Example usage:

```javascript
$('#colorPicker').on('colorchange', function (e, color) {
    console.log('New color selected:', color);
});
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## Contributing

As this is a proprietary plugin, please contact the project maintainers for information about contributing.

## License

This project is proprietary software. All rights reserved.

## Support

For support, feature requests, or bug reports, please contact the development team.
