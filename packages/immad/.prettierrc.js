/**
 * Prettier configuration for the IMMAD package.
 *
 * Lives inside packages/immad so it only applies to files under this package.
 * Prettier walks up from each file looking for the nearest config, so files
 * in other workspace packages (gate, lib-functions, react-widget-lib) are
 * unaffected by this file.
 */
module.exports = {
    printWidth: 120,
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: true,
    jsxSingleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    endOfLine: 'auto',
};
