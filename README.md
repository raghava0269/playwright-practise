# Playwright JavaScript Framework (UI + API)

A learning framework. Every Playwright concept is used in real, passing tests, and each one is listed below with where to find it.

> **New to this? Start with [docs/LEARNING-GUIDE.md](docs/LEARNING-GUIDE.md).** It explains every keyword from zero.

- **UI app:** https://www.saucedemo.com (plus a few pages from the-internet.herokuapp.com and demo.playwright.dev)
- **API:** https://jsonplaceholder.typicode.com

## Setup & run

```bash
npm install
npx playwright install          # download browsers
cp .env.example .env            # environment variables

npm test                        # everything (setup + ui-chromium + ui-firefox + api)
npm run test:ui                 # UI on chromium only
npm run test:api                # API only
npm run test:smoke              # only tests tagged @smoke
npm run test:headed             # watch the browser
npm run ui-mode                 # Playwright UI mode (best for learning!)
npm run report                  # open the HTML report
```

## Folder structure

```
├── .github/workflows/playwright.yml   CI/CD pipeline (GitHub Actions)
├── .env / .env.example                environment variables
├── playwright.config.js               projects, retries, workers, reporters, trace...
├── pages/                             PAGE OBJECT MODEL
│   ├── BasePage.js                      common methods (inherited)
│   ├── LoginPage.js  InventoryPage.js  CartPage.js  CheckoutPage.js
├── utils/                             GENERIC reusable methods
│   ├── helpers.js                       random data, readJson, sort checks
│   ├── apiClient.js                     wrapper for GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS
│   ├── schemaValidator.js               AJV JSON-schema validation
│   └── constants.js                     storage-state path, credentials
├── fixtures/fixtures.js               CUSTOM FIXTURES (extends base test)
├── test-data/                         DATA-DRIVEN inputs, JSON schemas, upload file
└── tests/
    ├── setup/auth.setup.js            logs in once -> saves storage state
    ├── ui/                            UI tests (browser)
    └── api/                           API tests (no browser)
```

## The UI test cases (saucedemo)

| ID | Test | File |
|----|------|------|
| TC01-04 | Login: valid / locked out / wrong password / empty username (data-driven) | `tests/ui/login.spec.js` |
| TC05 | Log out | `tests/ui/login.spec.js` |
| TC06 | Inventory shows 6 products | `tests/ui/inventory.spec.js` |
| TC07 | Sort by price low → high | `tests/ui/inventory.spec.js` |
| TC08 | Sort by name Z → A | `tests/ui/inventory.spec.js` |
| TC09 | Add/remove items updates the cart badge | `tests/ui/inventory.spec.js` |
| TC10 | Product card details (soft assertions) | `tests/ui/inventory.spec.js` |
| TC11 | Full checkout end to end, totals check | `tests/ui/checkout.spec.js` |
| TC12 | Checkout error when first name missing | `tests/ui/checkout.spec.js` |

## Concept → where to look

| Concept | What it is | Where |
|---|---|---|
| **Page Object Model** | Locators + actions per page in a class; tests stay readable; a locator change is fixed in one place | `pages/` |
| **Utils (generic methods)** | Code not tied to any page | `utils/helpers.js`, `utils/apiClient.js` |
| **Projects (UI + API)** | Named configs in one run: `setup`, `ui-chromium`, `ui-firefox`, `api`. Each has its own `testDir`, `baseURL`, browser | `playwright.config.js` |
| **Parallel execution** | Each *worker* is a separate process. `fullyParallel: true` runs tests in one file in parallel too. `test.describe.serial` forces order | config, `tests/api/users-data-driven.spec.js` |
| **Workers** | `workers: undefined` = half your CPU cores; `--workers=1` = one at a time. Look for `[worker N]` in the console output | config, `npm run test:serial` |
| **Retries** | Re-run failed tests: 1 locally, 2 on CI. Can be overridden per describe | config, `flaky-and-annotations.spec.js` |
| **Flaky tests** | Failed first, then passed on a retry → reported as **flaky**. Common causes: hard waits, missing `await`, tests sharing data | `flaky-and-annotations.spec.js` |
| **Reports** | `list` (console), `html`, `json`, `junit` (for CI tools) at the same time | config → `playwright-report/`, `test-results/` |
| **Trace** | Timeline with DOM snapshots, network and console. `on-first-retry` in config. Open: `npx playwright show-trace path/trace.zip` or from the HTML report | config, `npm run test:trace` |
| **Screenshot / video** | `only-on-failure`, `retain-on-failure` | config, `afterEach` in `inventory.spec.js` |
| **Built-in fixtures** | `page`, `context`, `browser`, `browserName`, `request`, `baseURL`, `testInfo` | `builtin-fixtures-and-assertions.spec.js` |
| **Custom fixtures** | `test.extend({...})`: page objects, `shopPage` (setup + teardown), `checkoutData` (worker scope), `logTestName` (auto) | `fixtures/fixtures.js` |
| **Hooks** | `beforeAll`, `afterAll` (once per worker), `beforeEach`, `afterEach` (around every test) | `inventory.spec.js`, `login.spec.js` |
| **Auto-waiting** | Actions wait until the element is visible, enabled and stable. `expect(locator)` retries until it passes. Never use `waitForTimeout` | `builtin-fixtures-and-assertions.spec.js` |
| **async / await** | Every Playwright call returns a Promise, so always `await` it | everywhere |
| **Built-in locators** | `getByRole` (preferred), `getByText`, `getByPlaceholder`, `getByLabel`, `getByTestId`; CSS/XPath only as a fallback; `.filter()`, `.first()` | `pages/`, `builtin-fixtures-and-assertions.spec.js` |
| **Test IDs** | `testIdAttribute: 'data-test'` makes `getByTestId('x')` find `[data-test="x"]` | config, `pages/InventoryPage.js` |
| **Storage state** | Log in once in the setup project and save cookies. UI projects load them, so tests start logged in. Override with an empty state for login tests | `tests/setup/auth.setup.js`, `login.spec.js` |
| **Tags** | `{ tag: '@smoke' }`, then run with `--grep @smoke` / `--grep-invert @flaky`. A project can also use `grepInvert` | all specs, `package.json` scripts |
| **Data-driven** | Loop over JSON data → one test per row | `login.spec.js`, `users-data-driven.spec.js` |
| **.env** | `dotenv` loads `.env` into `process.env`. Never commit it; commit `.env.example` | config, `utils/constants.js` |
| **Assertions** | Web-first (`toBeVisible`, `toHaveText`, `toHaveCount`, `toHaveURL`, ...), generic (`toBe`, `toEqual`, `toMatchObject`, ...), negation `.not`, `expect.poll`, `toPass` | `builtin-fixtures-and-assertions.spec.js` |
| **Soft assertions** | `expect.soft()` records a failure and keeps going | TC10 in `inventory.spec.js` |
| **Annotations** | `test.skip`, `test.fixme`, `test.fail`, `test.slow`, conditional skip | `flaky-and-annotations.spec.js` |
| **API mocking** | `page.route()` with `fulfill` (fake), `fetch` + modify, `abort` (block) | `api-mocking.spec.js` |
| **Upload / Download** | `setInputFiles`, `filechooser` event, `download` event + `saveAs` | `upload-download.spec.js` |
| **HTTP methods** | GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS + query params + negative 404 | `tests/api/posts-crud.spec.js` |
| **Schema validation (AJV)** | Checks a response's *shape* (types, required fields), not only its values | `utils/schemaValidator.js`, `test-data/schemas/` |
| **CI/CD** | GitHub Actions: matrix job per project, browser install, report artifacts, manual run with a tag filter, nightly schedule | `.github/workflows/playwright.yml` |

## Notes

- The flaky demo test fails on purpose on its first attempt. The final summary shows it as `1 flaky`. Run `npm run test:no-flaky` to leave it out.
- jsonplaceholder is a fake API. POST/PUT/DELETE return realistic responses but nothing is saved.
- In the console, `▶ START [worker N]` lines come from the automatic `logTestName` fixture. They show which worker ran each test, so you can see the parallel execution.
