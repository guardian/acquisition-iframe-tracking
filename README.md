# Acquisition iFrame tracking

This package facilitates adding an `acquisitionData` field to the query string of links to reader revenue sites in HTML docs that will be embedded in other docs using an iframe.

The latest version is available at:

`https://interactive.guim.co.uk/libs/acquisition-iframe-tracking/0.0.2/index.bundle.js`

## Example

The file `example/embed.html` demonstrates how the package should be used in an embed.

Couple of things to note in this example:
- always include a `<head>` element
- always include the `js-acquisition-link` class in links that you want to be enriched
- always call `Acquisitions.enrichLinks()` at the end of the HTML body

## Development

To run the dev server:

```
yarn run start
```

Then navigate to `http://localhost:8080/index.html` to see changes in tracking propagate automatically.

## Deployment

To deploy the current version of the package:

```
./deploy.sh
```
