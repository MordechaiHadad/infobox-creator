# Obsidian Infobox

Obsidian Infobox is a TOML based infobox creator plugin for Obsidian. This plugin allows you to enhance your notes by adding infoboxes with an easy-to-understand syntax.

## Installation

You can install the Obsidian Infobox plugin via Obsidian’s third-party plugin community. Here's how:

1. Open Obsidian.
2. Go to `Settings > Third-party plugins`.
3. Make sure `Safe mode` is turned off.
4. Click `Browse`, then search for `Obsidian Infobox`.
5. Click `Install`, then `Enable`.

## Usage

With Obsidian Infobox, you can generate infoboxes within your notes. The syntax is simple and easy to adopt.

```toml 
title = "Your title here" 
image = "https://your-image.com" 
field_name = "your field content here"
```

### Properties

#### `title` (string)

This is the infobox title. Accepts a string.

Example:
```toml
title = "This is an Infobox"
```

#### `image` (string)

The image for the infobox. Accepts http or https links. 

Example:
```toml
image = "https://example.com/image.png"
```

#### Custom Properties

Any other property not named `title` or `image` will be treated as an infobox field.

- Basic field: 

```toml
property_name = "A basic string"
```

 
- Field with an array of strings: 

```toml
property_name = ["String1", "String2", "String3"]
```
 
- Field with a link associated with the text: 

```toml
property_name = {content = "Your content here", link = "https://your-link.com"}
```

OR

```toml
property_name = {content = "Your content here", link = "[[Note Name]]"}
```

## Support

For any question or issue, feel free to report at [GitHub issue](#). Stay tuned for other properties for enhancing your infobox experience!
