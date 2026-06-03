# IMMAD / GATE / AIML Monorepo

This project is the monorepo for the IMMAD and GATE applications.

## Usage

This application is written in [TypeScript](http://www.typescriptlang.org/) and utilizes the [`@arcgis/webpack-plugin`](https://github.com/Esri/arcgis-webpack-plugin) with [React](https://reactjs.org/).

You can develop, test, and build the application using various commands.
### Development 

Run the application in development mode with a local development server. Ensure all npm commands are run in a **gitbash** terminal.
```bash
npm -w @stratcom/immad start
npm -w @stratcom/gate start
```

### Testing
Run the unit tests for the application. Unit tests are written with Jest and react-testing-library.
```bash
npm -w @stratcom/immad test
```
### Build for Deployment
Make sure to build the application for deployment before starting for the first time. If changes are made to the `lib-functions` or `react-widget-lib` projects, re-run builds before starting the application.

```bash
npm install --package-lock-only

npm run -w @stratcom/lib-functions build

npm run -w @stratcom/react-widget-lib build 

npm run -w @stratcom/immad build

npm run -w @stratcom/gate build

npm -w @stratcom/immad run copy 

npm -w @stratcom/gate run copy
```
### Additional Build Options
- Build IMMAD manually:
```bash
npm run-script -w @stratcom/immad build
```
- Watch and build lib-functions continuously:
```bash
npm run -w @stratcom/lib-functions build:watch
```
### Package Lock File Management
When to Check in `package-lock.json`.
Always check in the `package-lock.json` file:
- When a new library is installed.
- when a library is updated to a new **major** or **non-minor** version.
This ensures consistency in dependency versions across all environments.

### Deployment Instructions
When a new `package-lock.json` is added, use the following command during deployment to install exact versions:
```bash
npm ci
```
This guarantees that the dependencies installed match the versions in the `package-lock.json`, ensuring consistency across environments.

### Widget Library Development
To test widgets locally, run the following command. make sure to add the widget to `App.jsx` for it to load locally.
```bash
npm run -w @stratcom/react-widget-lib dev
```
To serve a production build locally:
```bash
npm run -w @stratcom/immad serve
```
### Service Worker Testing
Use `npm run serve` to fully test Service Workers with `webpack-dev-server` self-signed certificates.
Refer to [this article](https://deanhume.com/testing-service-workers-locally-with-self-signed-certificates/) for instructions on running Chrome with the appropriate flags for development purposes.

### Notes:
This project uses NPM workspaces, which requires version 10 or later of npm.

In newer versions of Node, you may need to add the option --openssl-legacy-provider when running the scripts, as such:
```bash
NODE_OPTIONS=--openssl-legacy-provider npm -w @stratcom/immad run build
```