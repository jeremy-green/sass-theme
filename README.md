# Sass Theme

Based on http://davidwalsh.name/sass-color-variables-dont-suck and http://chir.ag/projects/name-that-color.

This is a CLI that will add the variables to the specified file.

## Options
- `--apikey` The API key from Adobe
- `--colors` A comma separated list of hex colors to convert

## Usage
`sass-theme --apikey=<API_KEY> path/to/sass/file.scss theme-id`

`sass-theme --colors=00ff00,ff0000,0000ff path/to/sass/file.scss`

## Example
Based on https://color.adobe.com/Phaedra-color-theme-1764754/edit/?copy=true

`sass-theme --apikey=<API_KEY> _variables.scss 1764754`

The theme id comes from the URL. You can find the API key in the network tab of Chrome.
Adobe might have an actual location for this, but that's where I found mine.
They'll probably change their API eventually too; breaking this.
