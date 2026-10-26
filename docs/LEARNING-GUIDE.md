# Playwright Framework — Complete Beginner Guide

> **How to read this file in VS Code:** press `Ctrl + Shift + V` to open the formatted preview.
>
> Read it **in order**. Every part builds on the part before it.
> Keep the real code file open next to this guide while you read about it.

---

## Table of contents

0. [The big picture — what happens when you type `npm test`](#0-the-big-picture)
1. [JavaScript you must know first](#1-javascript-you-must-know-first)
2. [The folder structure — why each folder exists](#2-the-folder-structure)
3. [package.json, npm and npx](#3-packagejson-npm-and-npx)
4. [.env — environment variables](#4-env--environment-variables)
5. [playwright.config.js — every line explained](#5-playwrightconfigjs--every-line-explained)
6. [Anatomy of a test](#6-anatomy-of-a-test)
7. [Locators, built-in locators and test IDs](#7-locators-built-in-locators-and-test-ids)
8. [Auto-waiting](#8-auto-waiting)
9. [Assertions (all types)](#9-assertions)
10. [Page Object Model (POM)](#10-page-object-model-pom)
11. [Utils — generic methods](#11-utils--generic-methods)
12. [Fixtures — built-in and custom](#12-fixtures)
13. [Hooks — beforeAll, beforeEach, afterEach, afterAll](#13-hooks)
14. [Storage state and the setup project](#14-storage-state-and-the-setup-project)
15. [Parallel execution, workers and serial mode](#15-parallel-execution-workers-and-serial-mode)
16. [Retries, flaky tests and annotations](#16-retries-flaky-tests-and-annotations)
17. [Reports, trace, screenshots, video](#17-reports-trace-screenshots-video)
18. [Tags and grep](#18-tags-and-grep)
19. [Data-driven tests](#19-data-driven-tests)
20. [API testing and all HTTP methods](#20-api-testing-and-all-http-methods)
21. [Schema validation with AJV](#21-schema-validation-with-ajv)
22. [Mocking APIs](#22-mocking-apis)
23. [Upload and download](#23-upload-and-download)
24. [CI/CD with GitHub Actions](#24-cicd-with-github-actions)
25. [Glossary — every keyword in one table](#25-glossary)
26. [Your learning plan — exercises](#26-your-learning-plan)

---

## 0. The big picture

Before any details, here is what happens when you type `npm test`:

```
You type:  npm test
              │
              ▼
package.json says "test": "playwright test"  →  Playwright starts
              │
              ▼
Playwright reads playwright.config.js
  - loads .env (URLs, username, password)
  - sees 4 PROJECTS: setup, ui-chromium, ui-firefox, api
              │
              ▼
STEP 1: project "setup" runs first (ui projects DEPEND on it)
        tests/setup/auth.setup.js opens the browser, logs into saucedemo,
        and SAVES the login cookies into playwright/.auth/user.json
              │
              ▼
STEP 2: ui-chromium, ui-firefox and api run AT THE SAME TIME (in parallel)
        - ui projects open a browser that is ALREADY LOGGED IN (they load user.json)
        - api project sends HTTP requests (no browser at all)
        - several "workers" (separate processes) share the tests between them
              │
              ▼
STEP 3: each test:
        hooks (beforeEach) → fixtures prepare objects → test code runs → assertions check
        → afterEach → fixtures clean up
        If a test fails → it is RETRIED (run again). Trace is recorded on the retry.
              │
              ▼
STEP 4: REPORTS are written:
        console list, playwright-report/ (HTML), test-results/results.json, junit.xml
        Open the HTML one with:  npm run report
```

Keep this picture in mind. Every section below explains one box in more detail.

---

## 1. JavaScript you must know first

You can't understand Playwright code without these JavaScript pieces. Each one is shown with real lines from this project.

### 1.1 `import` and `export` — sharing code between files

A file can **export** something (make it available) and another file can **import** it (use it).

```js
// utils/helpers.js
export function randomString(length = 8) { ... }   // "I offer this function"

// tests/api/posts-crud.spec.js
import { randomString } from '../../utils/helpers'; // "I want that function"
```

- `'../../utils/helpers'` is a **path**. `..` means "go up one folder". From `tests/api/`, two `..` take you to the project root, then into `utils/helpers.js`. The `.js` can be left out.
- `{ randomString }` with curly braces = a **named** export. You pick it by its exact name.
- `import dotenv from 'dotenv'` without braces = the **default** export of a package from `node_modules`.

### 1.2 `const` and `let` — variables

```js
const users = readJson('test-data/loginUsers.json'); // const: can NOT be re-assigned
let createdId;                                       // let: CAN be re-assigned later
createdId = 201;
```

Use `const` by default. Use `let` only when the value changes.

### 1.3 Objects and arrays

```js
const product = { name: 'Backpack', price: 29.99 };  // object: key → value pairs
product.name   // 'Backpack'

const tags = ['bag', 'sauce'];                        // array: ordered list
tags[0]        // 'bag'   (counting starts at 0)
tags.length    // 2
```

### 1.4 Functions and arrow functions

```js
function add(a, b) { return a + b; }   // normal function
const add = (a, b) => a + b;           // arrow function: same thing, shorter
```

Playwright tests are written with arrow functions: `async ({ page }) => { ... }`.

### 1.5 Destructuring — `{ page }`

This is the most confusing syntax for beginners and it is **everywhere** in Playwright.

```js
const fixtures = { page: ..., browser: ..., request: ... };

// Without destructuring:
const page = fixtures.page;

// With destructuring (same result):
const { page } = fixtures;
```

So when you see:

```js
test('my test', async ({ page, loginPage }) => { ... });
```

it means: *"Playwright, give me an object full of fixtures. I only want `page` and `loginPage` from it."*

The same works for arrays and for your own data:

```js
const { customer, products } = checkoutData;   // takes two keys out of the object
```

### 1.6 Template literals — strings with `${ }`

Backticks `` ` `` let you put variables inside a string:

```js
const id = 5;
`/users/${id}`          // → "/users/5"
```

### 1.7 `class`, `constructor`, `this`, `extends`, `super`

A **class** is a blueprint for creating objects. We use classes for Page Objects.

```js
export class LoginPage extends BasePage {   // LoginPage INHERITS everything from BasePage
  constructor(page) {                       // runs when you write: new LoginPage(page)
    super(page);                            // calls BasePage's constructor first
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }                                         // `this` = "this object being built"

  async login(username, password) {         // a method (a function that belongs to the class)
    await this.usernameInput.fill(username);
  }
}

const loginPage = new LoginPage(page);     // create an object from the blueprint
await loginPage.login('standard_user', 'secret_sauce');
```

`#slug(name)` in `InventoryPage.js` — the `#` makes the method **private**. Only code inside the class can call it.

### 1.8 `async`, `await` and Promises — the most important part

The browser is slow compared to your code. Clicking, loading a page or calling an API takes time.
So Playwright functions do not return the result right away. They return a **Promise**: *"I promise to give you the result later."*

- `await` means: **"stop here and wait until the Promise is finished, then continue."**
- You can only use `await` inside a function marked `async`.

```js
test('login', async ({ page }) => {        // async → we may use await inside
  await page.goto('/');                    // wait until the page has loaded
  await page.getByPlaceholder('Username').fill('standard_user');  // wait until typed
  await page.getByRole('button', { name: 'Login' }).click();      // wait until clicked
});
```

**What happens if you forget `await`?** The code doesn't wait. It goes straight to the next line while the click is still happening. The test then fails randomly: sometimes it passes, sometimes it doesn't. That is a **flaky test**, and a missing `await` is the #1 cause.

**Rule:** if a Playwright line does something (`goto`, `click`, `fill`, `expect(locator)...`, `request.get`), put `await` in front of it.

### 1.9 `for...of` loop

```js
for (const user of users) {   // runs once for every item in the array
  console.log(user.username);
}
```

We use this to generate one test per data row (data-driven testing).

---

## 2. The folder structure

```
playwright-practise/
├── .github/workflows/playwright.yml   ← CI/CD: tells GitHub how to run the tests
├── .env                               ← your private settings (NOT committed to git)
├── .env.example                       ← a template of .env (committed)
├── .gitignore                         ← files git must ignore
├── package.json                       ← project info, dependencies, npm scripts
├── playwright.config.js               ← THE settings file for Playwright
├── README.md                          ← short overview
├── docs/LEARNING-GUIDE.md             ← this file
│
├── pages/                             ← PAGE OBJECTS (one class per web page)
│   ├── BasePage.js                    ← common code all pages share
│   ├── LoginPage.js
│   ├── InventoryPage.js
│   ├── CartPage.js
│   └── CheckoutPage.js
│
├── utils/                             ← GENERIC helpers (not tied to any page)
│   ├── helpers.js                     ← random data, read JSON, sort checks
│   ├── apiClient.js                   ← easy methods for GET/POST/PUT/...
│   ├── schemaValidator.js             ← AJV JSON schema validation
│   └── constants.js                   ← fixed values: file paths, credentials
│
├── fixtures/fixtures.js               ← CUSTOM FIXTURES (our own test "ingredients")
│
├── test-data/                         ← DATA kept outside the code
│   ├── loginUsers.json                ← rows for the data-driven login tests
│   ├── checkout.json                  ← customer + products for checkout
│   ├── schemas/*.json                 ← JSON schemas for API validation
│   └── files/sample-upload.txt        ← file used by the upload test
│
├── tests/
│   ├── setup/auth.setup.js            ← logs in once, saves storage state
│   ├── ui/*.spec.js                   ← browser tests
│   └── api/*.spec.js                  ← API tests
│
├── playwright/.auth/user.json         ← (generated) saved login cookies
├── playwright-report/                 ← (generated) HTML report
└── test-results/                      ← (generated) screenshots, videos, traces, json, junit
```

**Why split code like this?** Each folder has **one job**:

| Folder | Its job | If the website changes... |
|---|---|---|
| `pages/` | HOW to find and use things on a page | fix the locator in ONE page file |
| `tests/` | WHAT to test and what result to expect | tests don't need to change |
| `utils/` | General tools used anywhere | — |
| `test-data/` | Inputs and expected values | change JSON, no code change |
| `fixtures/` | Prepare and clean up things for tests | — |

The file name ending `.spec.js` tells Playwright **"this file contains tests"**. ("spec" = specification.)

---

## 3. package.json, npm and npx

- **Node.js** — runs JavaScript outside the browser. Playwright runs on Node.
- **npm** (Node Package Manager) — downloads libraries ("packages") into `node_modules/`.
- **npx** — runs a command that comes from an installed package, e.g. `npx playwright test`.

```json
"scripts": {
  "test": "playwright test",
  "test:ui": "playwright test --project=ui-chromium",
  "test:smoke": "playwright test --grep @smoke",
  ...
},
"devDependencies": {
  "@playwright/test": "^1.64.0",   ← Playwright itself
  "ajv": "...",                    ← JSON schema validator
  "ajv-formats": "...",            ← adds "email", "date-time"... to AJV
  "dotenv": "..."                  ← reads the .env file
}
```

- **scripts** are shortcuts. `npm test` runs `playwright test`. `npm run test:ui` runs `playwright test --project=ui-chromium`.
  (Only `test` and `start` work without the word `run`. All others need `npm run <name>`.)
- **devDependencies** are libraries needed only for development and testing.
- `^1.64.0` means "version 1.64.0 or any newer 1.x version".
- `package-lock.json` records the **exact** versions installed, so every machine gets the same ones. `npm ci` (used in CI) installs exactly from this file.

**Command-line flags** you can add to `playwright test`:

| Flag | Meaning |
|---|---|
| `--project=api` | run only that project |
| `--grep @smoke` / `-g "login"` | run only tests whose title or tag matches |
| `--grep-invert @flaky` | run everything EXCEPT matching tests |
| `--headed` | show the browser window (default is hidden = "headless") |
| `--debug` | open the Playwright Inspector and pause at each step |
| `--ui` | open UI Mode (best tool for learning) |
| `--workers=1` | use only 1 worker (no parallelism) |
| `--retries=0` | turn off retries |
| `--repeat-each=10` | run every test 10 times (to find flaky tests) |
| `--trace on` | always record a trace |
| `tests/ui/login.spec.js` | run only this file |
| `tests/ui/login.spec.js:36` | run only the test on line 36 |

---

## 4. .env — environment variables

**Problem:** URLs and passwords should not be hard-coded in tests.
- The URL is different on each environment (dev / QA / production).
- Passwords must never be pushed to GitHub.

**Solution:** put them in a file called `.env`:

```
UI_BASE_URL=https://www.saucedemo.com
API_BASE_URL=https://jsonplaceholder.typicode.com
STANDARD_USER=standard_user
PASSWORD=secret_sauce
```

- `dotenv.config(...)` in `playwright.config.js` reads this file and puts every line into **`process.env`**.
  `process.env` is a built-in Node object that holds all environment variables.
- Now any code can read `process.env.PASSWORD`.
- `.env` is listed in `.gitignore`, so it is **never committed**. `.env.example` (no real secrets) is committed so teammates know which variables they need to create.
- `process.env.UI_BASE_URL || 'https://www.saucedemo.com'` — the `||` means **"if the left side is empty, use the right side"**. That's a fallback default, so the tests still work without a `.env` file (for example on CI).

**Why are the values in `utils/constants.js` written as `get standard() {...}`?**
A `get` is a *getter*: the value is read **at the moment you use it**, not when the file is loaded. That makes sure `.env` has already been loaded before we read `process.env`.

---

## 5. playwright.config.js — every line explained

Open `playwright.config.js` next to this section.

```js
// @ts-check
```
Tells VS Code to check types and show red underlines for mistakes. It has no effect when the tests run.

```js
import { defineConfig, devices } from '@playwright/test';
```
- `defineConfig` — a helper that wraps your settings and gives you autocomplete in VS Code.
- `devices` — a list of ready-made browser settings (`'Desktop Chrome'`, `'Desktop Firefox'`, `'iPhone 12'`...). Each one sets screen size, user agent and so on.

```js
dotenv.config({ path: path.resolve(__dirname, '.env') });
```
Loads `.env`. `__dirname` = the folder this file is in. `path.resolve` joins the pieces into a full path.

```js
export default defineConfig({ ... });
```
Everything inside `{ }` is the configuration. Playwright reads the `default` export.

### 5.1 Top-level settings

| Setting | Our value | Meaning |
|---|---|---|
| `testDir` | `'./tests'` | Folder where Playwright looks for test files (each project overrides it). |
| `timeout` | `30_000` | Max time for ONE test, in milliseconds. 30 000 ms = 30 s. `_` just makes the number easier to read. If a test takes longer, it fails with "Test timeout exceeded". |
| `expect: { timeout }` | `5_000` | How long an assertion like `expect(locator).toBeVisible()` keeps re-checking before it fails. |
| `fullyParallel` | `true` | Tests **inside the same file** can also run at the same time in different workers. With `false`, only different FILES run in parallel, and tests inside a file run one after another. |
| `forbidOnly` | `!!process.env.CI` | `test.only(...)` runs only that one test (useful while debugging). If someone forgets to remove it, CI would silently skip all other tests. This makes the run FAIL on CI if `.only` exists. `!!` turns a value into `true`/`false`. |
| `retries` | `CI ? 2 : 1` | If a test fails, run it again: 2 more times on CI, 1 more time locally. `a ? b : c` = "if a then b else c". |
| `workers` | `CI ? 2 : undefined` | How many parallel processes. `undefined` = Playwright decides (half your CPU cores). |
| `reporter` | list, html, json, junit | Output formats for the results (see section 17). |

### 5.2 `use` — settings for the browser and requests

`use` at the top level applies to **all projects**. A project can override any of it.

| Setting | Our value | Meaning |
|---|---|---|
| `trace` | `'on-first-retry'` | Record a trace (a full recording) only when a test is retried the first time. Options: `'on'`, `'off'`, `'retain-on-failure'`, `'on-first-retry'`. |
| `screenshot` | `'only-on-failure'` | Take a screenshot when a test fails. |
| `video` | `'retain-on-failure'` | Record video of every test, but keep it only if the test failed. |
| `testIdAttribute` | `'data-test'` | `page.getByTestId('x')` will find `<... data-test="x">`. The default is `data-testid`. Saucedemo uses `data-test`. |
| `actionTimeout` | `10_000` | Max time for ONE action (`click`, `fill`...). |
| `navigationTimeout` | `20_000` | Max time for `page.goto(...)` to load. |
| `baseURL` (in projects) | saucedemo / jsonplaceholder | Lets you write `page.goto('/inventory.html')` instead of the full URL. |

### 5.3 `projects` — UI and API in one framework

A **project** is a named group of tests with its own settings. One `npx playwright test` runs all projects.

```js
{
  name: 'setup',                          // name used in --project=setup and in reports
  testDir: './tests/setup',               // where its tests are
  testMatch: /.*\.setup\.js/,             // only files ending with .setup.js
  use: { baseURL: ... },
},
```
`/.*\.setup\.js/` is a **regular expression** (a text pattern). `.*` = "any characters", `\.` = a real dot.

```js
{
  name: 'ui-chromium',
  testDir: './tests/ui',
  dependencies: ['setup'],               // run 'setup' FIRST; if setup fails, skip these
  use: {
    ...devices['Desktop Chrome'],        // "..." = copy all the Desktop Chrome settings in here
    baseURL: ...,
    storageState: STORAGE_STATE,         // start every test with the saved login cookies
  },
},
```

```js
{
  name: 'ui-firefox',
  ...
  grepInvert: /@chromium-only/,          // in this project, skip tests tagged @chromium-only
  use: { ...devices['Desktop Firefox'], ... },
},
```

```js
{
  name: 'api',
  testDir: './tests/api',
  use: {
    baseURL: 'https://jsonplaceholder.typicode.com',
    extraHTTPHeaders: { Accept: 'application/json' }, // header sent with EVERY request
  },
},
```
The api project has no `devices`. API tests only use the `request` fixture, so **no browser is opened** and they are very fast.

---

## 6. Anatomy of a test

```js
import { test, expect } from '../../fixtures/fixtures';
//       │      │
//       │      └── expect: the function used to CHECK results
//       └── test: the function used to DEFINE a test (ours has custom fixtures added)

test.describe('Inventory', { tag: '@inventory' }, () => {   // a GROUP of tests
  test('TC06: inventory shows 6 products', { tag: '@smoke' }, async ({ inventoryPage }) => {
  //   │                                     │                 │       │
  //   │                                     │                 │       └── fixtures I need
  //   │                                     │                 └── the test body (async!)
  //   │                                     └── options: tags, annotations
  //   └── test title (shown in reports)
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(6);
  });
});
```

- **`test(title, [options], body)`** — defines ONE test case.
- **`test.describe(title, [options], callback)`** — groups related tests. Hooks and settings inside it apply only to that group. Groups can be nested.
- **`page`** — a browser tab. `page.goto(url)` opens a URL.
- **`expect(...)`** — the checkpoint. If the check is false, the test **fails**.
- **`test.step('name', async () => {...})`** — splits a long test into named steps. The steps appear in the report and the trace (used in TC09 and TC11).

**Arrange → Act → Assert.** Most tests follow 3 parts:
1. **Arrange** — get ready (open the page, prepare data)
2. **Act** — do the thing (click, fill, send a request)
3. **Assert** — check the result with `expect`

---

## 7. Locators, built-in locators and test IDs

A **locator** is *a way to find an element on the page*. Think of it as an address.

```js
const loginButton = page.getByRole('button', { name: 'Login' });
```

**Important:** creating a locator does NOT search the page yet. It only stores the "address".
The search happens when you **use** it (`click()`, `fill()`, `expect(...)`). It also searches **again every time**, so it always finds the current element even after the page re-renders.
That's why we can create all the locators in the Page Object constructor before the page is even open.

### Built-in locators (use them in this order of preference)

| Locator | Finds element by... | Example from this project |
|---|---|---|
| `getByRole(role, { name })` | Its **role** (button, link, heading, textbox, img, listitem...) and visible name. Closest to how a real user / screen reader sees the page. **Best choice.** | `page.getByRole('button', { name: 'Login' })` |
| `getByText(text)` | Visible text | `page.getByText('Accepted usernames are:')` |
| `getByLabel(text)` | The `<label>` of a form field | — |
| `getByPlaceholder(text)` | The grey hint text inside an input | `page.getByPlaceholder('Username')` |
| `getByAltText(text)` | The `alt` of an image | — |
| `getByTitle(text)` | The `title` attribute | — |
| `getByTestId(id)` | A test attribute developers add for testers | `page.getByTestId('shopping-cart-badge')` |
| `locator(css or xpath)` | A CSS selector or XPath. **Fallback only** — breaks easily when the HTML changes | `page.locator('#user-name')`, `page.locator('//input[@id="password"]')` |

### Test IDs

Developers can add a special attribute just for testing:

```html
<span class="shopping_cart_badge" data-test="shopping-cart-badge">2</span>
```

Classes and texts change often (design changes, translations). A test ID is stable because it exists **only for tests**.
We set `testIdAttribute: 'data-test'` in the config, so `getByTestId('shopping-cart-badge')` finds `[data-test="shopping-cart-badge"]`.

To see the test IDs yourself: open saucedemo in Chrome → right-click an element → **Inspect** → look for `data-test="..."`.

**Real example of why roles can fail:** our Logout link was first `getByRole('link', { name: 'Logout' })`, but the test failed. Saucedemo's `<a>` has no `href`, so the browser doesn't treat it as a "link". We switched to `getByTestId('logout-sidebar-link')`.

### Chaining and filtering

```js
const firstItem = inventoryPage.items.first();                 // first of many matches
firstItem.getByTestId('inventory-item-name');                  // search INSIDE firstItem only
credentials.filter({ hasText: 'standard_user' });              // keep only matches with this text
```
Also: `.last()`, `.nth(2)` (3rd one — counting starts at 0), `.count()`, `.allTextContents()`.

**Tip:** `npm run codegen` opens a browser. Click around and Playwright **writes the locators for you**.

---

## 8. Auto-waiting

In old tools (Selenium) you wrote "wait 5 seconds" everywhere. Playwright **waits automatically**.

Before `click()`, Playwright waits until the element:
1. is **attached** to the page,
2. is **visible**,
3. is **stable** (not moving/animating),
4. **receives events** (not covered by another element, e.g. a popup),
5. is **enabled** (not disabled).

`fill()` also waits until the element is **editable**.
It keeps checking until all are true, or the `actionTimeout` is reached.

Assertions on locators (`await expect(locator).toBeVisible()`) also **retry** until they pass or `expect.timeout` runs out.

See `builtin-fixtures-and-assertions.spec.js` → "Auto-waiting & async":

```js
await page.getByRole('button', { name: 'Start' }).click();
// "Hello World!" appears about 5 seconds later. No sleep is needed:
await expect(page.getByRole('heading', { name: 'Hello World!' })).toBeVisible({ timeout: 10_000 });
```

**Never use** `await page.waitForTimeout(5000)` (a "hard wait"):
- If the app is faster, you waste time.
- If the app is slower, the test fails anyway → flaky.
Always wait for a **condition** (an element visible, a URL, a response) instead.

---

## 9. Assertions

An **assertion** = "I expect this to be true". If it isn't true, the test fails.

### 9.1 Web-first (auto-retrying) assertions — need `await`

They work on a **locator** or the **page**, and they **retry** until they pass (max `expect.timeout` = 5 s).

| Assertion | Checks that... |
|---|---|
| `await expect(page).toHaveTitle('Swag Labs')` | the tab title is this |
| `await expect(page).toHaveURL(/inventory/)` | the URL matches |
| `toBeVisible()` / `toBeHidden()` | the element is shown / not shown |
| `toHaveText('x')` | the text is exactly `x` (an array checks a list of elements in order) |
| `toContainText('x')` | the text contains `x` |
| `toHaveCount(6)` | there are exactly 6 matching elements |
| `toHaveValue('az')` | an input/select has this value |
| `toHaveAttribute('name', 'x')` | an HTML attribute has this value |
| `toHaveClass(/btn_inventory/)` | the CSS class matches |
| `toBeEnabled()` / `toBeDisabled()` | the button/input can / can't be used |
| `toBeEditable()` | you can type in it |
| `toBeChecked()` | a checkbox is ticked |

### 9.2 Generic (non-retrying) assertions — no `await`

They check a normal JavaScript **value** once, immediately.

| Assertion | Meaning |
|---|---|
| `expect(a).toBe(b)` | exactly equal (for numbers, strings, true/false) |
| `expect(obj).toEqual({...})` | deep equal — all keys and values the same (for objects/arrays) |
| `expect(obj).toMatchObject({...})` | contains AT LEAST these keys/values (partial match) |
| `toHaveProperty('price', 29.99)` | the object has this key (and value) |
| `toContain('bag')` | the array/string contains this item |
| `toHaveLength(2)` | the array/string length |
| `toBeGreaterThan(20)`, `toBeLessThanOrEqual(30)` | number comparisons |
| `toBeCloseTo(0.3)` | approximately equal — use for decimals! In JavaScript, `0.1 + 0.2` = `0.30000000000000004` |
| `toMatch(/back/i)` | a string matches a pattern (`i` = ignore upper/lower case) |
| `toBeTruthy()` / `toBeFalsy()` | the value is "true-ish" / "false-ish" |
| `toBeNull()`, `toBeUndefined()`, `toBeDefined()` | special empty values |
| `toThrow()` | the function throws an error |

### 9.3 `.not` — the opposite

```js
await expect(page).not.toHaveURL(/inventory/);
```

### 9.4 Custom message

```js
expect(valid, errors).toBe(true);   // if it fails, the report shows `errors` as the message
```

### 9.5 Soft assertions — `expect.soft`

A normal (hard) assertion **stops the test** at the first failure.
A **soft** assertion **records** the failure and **keeps going**. At the end the test is still marked failed, but you see **all** problems in one run.

```js
await expect.soft(firstItem.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Backpack');
await expect.soft(firstItem.getByTestId('inventory-item-price')).toHaveText('$29.99');
await expect.soft(firstItem.getByRole('img')).toBeVisible();
expect(test.info().errors).toHaveLength(0);  // hard stop here if any soft check failed
```

Use them when you check many independent fields on one screen (TC10).

### 9.6 `expect.poll` and `toPass`

- `expect.poll(() => something).toBe(x)` — calls the function **again and again** until its return value matches. Use it for values that aren't locators (a count, an API value, an image width).
- `expect(async () => { ... }).toPass()` — re-runs a **whole block** until nothing inside it throws.

---

## 10. Page Object Model (POM)

### The problem without POM

Imagine 50 tests each containing `page.getByPlaceholder('Username').fill(...)`.
The developer renames the placeholder → you edit **50 files**.

### The solution: one class per page

The class holds:
- **Locators** — where things are
- **Actions** — what a user can do (`login`, `addToCart`, `sortBy`)

Tests only call the actions. If the page changes, you fix **one file**.

```js
// pages/LoginPage.js
export class LoginPage extends BasePage {
  constructor(page) {
    super(page);                                            // BasePage stores this.page
    this.usernameInput = page.getByPlaceholder('Username'); // locators
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton   = page.getByRole('button', { name: 'Login' });
    this.errorMessage  = page.getByTestId('error');
  }
  async open() { await this.navigate('/'); }               // navigate() comes from BasePage
  async login(username, password) {                         // action
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

```js
// in a test — reads like plain English:
await loginPage.open();
await loginPage.login('standard_user', 'secret_sauce');
await expect(page).toHaveURL(/inventory/);
```

**BasePage** holds methods every page needs (`navigate`, `getTitle`). The other pages `extend` it, so they inherit those methods without copying code. That's **inheritance**.

**Rule followed here:** page objects do NOT contain `expect`. They only *do* things and *return* values. Tests decide what is correct.

**Our pages and what they do:**

| Page Object | Important methods |
|---|---|
| `LoginPage` | `open()`, `login(user, pass)` |
| `InventoryPage` | `open()`, `addToCart(name)`, `removeFromCart(name)`, `sortBy('lohi')`, `getAllNames()`, `getAllPrices()`, `openCart()`, `logout()` |
| `CartPage` | `checkout()` |
| `CheckoutPage` | `fillDetails({firstName, lastName, postalCode})`, `finish()`, `getAmount(locator)` |

`addToCart('Sauce Labs Backpack')` → the private `#slug` method turns the name into `sauce-labs-backpack` → it clicks `[data-test="add-to-cart-sauce-labs-backpack"]`. One method works for **any** product.

---

## 11. Utils — generic methods

**Generic** = not tied to any page or test. They can be used anywhere.

| File | Function | What it does |
|---|---|---|
| `helpers.js` | `randomString(8)` | random letters, e.g. `"kqzmtbaw"` — unique test data |
| | `randomNumber(1, 10)` | random whole number between 1 and 10 |
| | `randomEmail()` | e.g. `"kqzmtbaw@test.com"` |
| | `readJson('test-data/x.json')` | reads a JSON file and turns it into a JS object |
| | `isSortedAscending(list)` / `isSortedDescending(list)` | true if the list is sorted (used for the sort tests) |
| | `roundTo(1.23456, 2)` | `1.23` |
| `apiClient.js` | `ApiClient` class | short methods: `get`, `post`, `put`, `patch`, `delete`, `head`, `options` |
| `schemaValidator.js` | `validateSchema(schema, data)` | returns `{ valid: true/false, errors: "..." }` |
| `constants.js` | `STORAGE_STATE`, `EMPTY_STORAGE_STATE`, `USERS` | fixed values used in many places |

---

## 12. Fixtures

### 12.1 What is a fixture?

A **fixture** is something a test needs, **prepared for it automatically** before it runs and **cleaned up** after it finishes.

Real-life analogy: in a restaurant kitchen, the chef (the test) doesn't wash vegetables or clean the pans. Helpers do that **before** and **after**. The chef just says *"I need onions and a pan"* — that's `async ({ onions, pan }) => {...}`.

### 12.2 Built-in fixtures (Playwright gives them for free)

| Fixture | What it is | Scope |
|---|---|---|
| `page` | a new browser **tab**, fresh for every test | test |
| `context` | a **browser context** = an isolated "incognito window". It owns the cookies, storage and pages. Every test gets a new one, so tests can't affect each other | test |
| `browser` | the browser program itself (Chromium/Firefox), shared | worker |
| `browserName` | `'chromium'`, `'firefox'` or `'webkit'` | worker |
| `request` | an **APIRequestContext** for sending HTTP requests | test |
| `baseURL` | the `baseURL` from the config | — |
| `testInfo` | (2nd argument) information about the current test: title, retry number, status, project... | — |

```js
test('demo', async ({ page, context, browser, browserName, request, baseURL }, testInfo) => { ... });
```

Relationship: **browser** → contains many **contexts** → each contains **pages** (tabs).

### 12.3 Custom fixtures — `test.extend`

In `fixtures/fixtures.js` we make our **own** `test` that has extra fixtures:

```js
import { test as base, expect } from '@playwright/test';  // original test renamed to "base"

export const test = base.extend({
  loginPage: async ({ page }, use) => {   // this fixture itself needs the built-in `page`
    await use(new LoginPage(page));       // give the test a LoginPage object
  },
});
```

How a fixture works:

```js
myFixture: async ({ otherFixtures }, use) => {
  // 1. SETUP   — code here runs BEFORE the test
  await use(value);      // 2. the TEST RUNS NOW and receives `value`
  // 3. TEARDOWN — code here runs AFTER the test (even if it failed)
},
```

Tests then import **our** `test` instead of the original:
```js
import { test, expect } from '../../fixtures/fixtures';
test('x', async ({ loginPage }) => { await loginPage.open(); });   // no "new LoginPage(page)" needed
```

**Fixtures are lazy:** a fixture only runs if a test asks for it by name.

### 12.4 Our custom fixtures

| Fixture | Type | What it does |
|---|---|---|
| `loginPage`, `inventoryPage`, `cartPage`, `checkoutPage` | test-scoped | create the page object |
| `shopPage` | setup + teardown | **before:** opens the inventory page. **after:** empties the cart (removes `cart-contents` from localStorage) |
| `apiClient` | test-scoped | wraps the built-in `request` in our `ApiClient` |
| `checkoutData` | **worker-scoped** `{ scope: 'worker' }` | reads `checkout.json` **once per worker** and shares it with all tests in that worker (faster than once per test) |
| `logTestName` | **automatic** `{ auto: true }` | runs for EVERY test even though no test asks for it. Prints `▶ START [worker N]` and `■ END` |

The array syntax `[ async (...) => {...}, { scope: 'worker' } ]` is how you give a fixture **options**.
`{}` as the first argument (`async ({}, use) => ...`) means "this fixture doesn't need other fixtures".

### Fixtures vs hooks?

Both prepare and clean up. Fixtures are preferred because they are **reusable across files**, **lazy**, and setup and teardown live **together**.

---

## 13. Hooks

Hooks are functions that run automatically **around** tests. See `tests/ui/inventory.spec.js`.

| Hook | Runs... | Typical use |
|---|---|---|
| `test.beforeAll` | **once** before all tests in the group (per worker) | start something expensive, create test data via API |
| `test.beforeEach` | before **every** test | open the page, log in |
| `test.afterEach` | after **every** test (pass or fail) | screenshot on failure, clean up data |
| `test.afterAll` | **once** after all tests in the group (per worker) | delete test data, close connections |

Order for a group with 2 tests in one worker:
```
beforeAll
  beforeEach → test 1 → afterEach
  beforeEach → test 2 → afterEach
afterAll
```

**Important details:**
- `beforeAll` / `afterAll` can only use **worker-scoped** fixtures (`browser`, `browserName`). They can't use `page`, because `page` is created per test.
- With `fullyParallel: true`, tests of one group may run in **different workers**. Each worker runs its **own** `beforeAll` → you may see the `[beforeAll]` message several times. That's normal.
- Hooks written **inside** `test.describe` apply only to that group. Hooks written **outside** apply to the whole file.

Our `afterEach` example:
```js
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {     // the test failed
    await testInfo.attach('failure-screenshot', { body: await page.screenshot(), contentType: 'image/png' });
  }
});
```
`testInfo.attach` adds the file to the HTML report.

---

## 14. Storage state and the setup project

### The problem
Almost every UI test needs a logged-in user. Logging in inside 30 tests = slow, and repeated code.

### The solution
1. **Log in ONCE** (`tests/setup/auth.setup.js`).
2. **Save** the browser's cookies + localStorage to a file:
   ```js
   await page.context().storageState({ path: STORAGE_STATE });  // → playwright/.auth/user.json
   ```
3. In the config, the UI projects say:
   ```js
   dependencies: ['setup'],          // run the login first
   storageState: STORAGE_STATE,      // load the saved cookies into every new context
   ```
4. Every UI test now starts **already logged in**. `inventoryPage.open()` goes straight to `/inventory.html`.

Open `playwright/.auth/user.json` after a run. You'll see the cookie `session-username: standard_user`. That cookie is how saucedemo knows you are logged in.

- **Cookie** — a small piece of data a website stores in the browser (often your login session).
- **localStorage** — another browser storage. Saucedemo keeps the **cart** there (`cart-contents`).

### When a test needs to be LOGGED OUT
`login.spec.js` must start on the login page with no session, so it overrides the setting:
```js
test.use({ storageState: EMPTY_STORAGE_STATE });   // { cookies: [], origins: [] }
```
**`test.use({...})`** changes `use` settings for one file or one `describe` group.

`setup` in `import { test as setup }` is just a rename for readability. It's the same `test` function.

---

## 15. Parallel execution, workers and serial mode

- **Worker** = a separate Node.js **process** (like a separate worker person) that runs tests. Each worker starts its own browser.
- `workers: 4` → up to 4 tests run **at the same time** → the whole run is about 4x faster.
- `workers: undefined` → Playwright uses half your CPU cores.
- On CI we set 2, because CI machines are small.

**How tests are split:**

| Setting | Behavior |
|---|---|
| default (`fullyParallel: false`) | different **files** run in parallel; tests **inside** a file run one by one in the same worker |
| `fullyParallel: true` (ours) | **every test** can run in parallel, even tests in the same file |
| `test.describe.serial(...)` | tests in this group run **in order** in one worker; if one fails, the rest are **skipped** |
| `test.describe.configure({ mode: 'serial' })` | same as above, written as a setting |
| `--workers=1` | everything one by one |

**Why must tests be independent?** In parallel you don't know which test runs first or next to which. If test B needs data created by test A, B may run before A → random failure. So:
- every test creates its own data,
- every test gets a fresh `context` (cookies/storage),
- we clean the cart after tests (`shopPage` fixture, `afterEach`).

**Serial example** (`tests/api/users-data-driven.spec.js`): test 1 creates a todo and saves `createdId`. Test 2 uses that `createdId`. They depend on each other, so they must run in order → `test.describe.serial`.

**See parallelism yourself:** run `npm run test:ui` and look at `▶ START [worker 0]`, `[worker 1]`, `[worker 2]`... in the console. Then run `npm run test:serial` and compare the total time.

---

## 16. Retries, flaky tests and annotations

### Retries
`retries: 1` → when a test fails, Playwright runs it **once more**. The result can be:

| Result | Meaning |
|---|---|
| **passed** | passed on the first try |
| **flaky** | failed first, **passed on a retry** |
| **failed** | failed on every try |

### Flaky test
A test that sometimes passes and sometimes fails **with no code change**.
Common causes:
1. A missing `await`
2. Hard waits (`waitForTimeout`)
3. Tests sharing data / depending on each other's order
4. A slow network or server (we saw exactly this: TC12 on Firefox failed once under heavy load, then passed)
5. Animations, popups

**Retries hide flakiness — they don't fix it.** Use the report and trace to find the real cause.
To hunt flaky tests: `npx playwright test -g "TC12" --repeat-each=10 --retries=0`.

Our demo (`flaky-and-annotations.spec.js`):
```js
test.describe.configure({ retries: 2 });       // retries just for this group
test('fails on first attempt...', async ({ page }, testInfo) => {
  expect(testInfo.retry).toBeGreaterThan(0);  // retry is 0 on the 1st attempt → fails; 1 on the retry → passes
});
```
`testInfo.retry` = which attempt this is (0 = first). The report shows it as **flaky**.

### Annotations — special test markers

| Annotation | Meaning |
|---|---|
| `test.skip('title', ...)` | don't run this test |
| `test.skip(condition, 'reason')` inside a test | skip only when the condition is true, e.g. `browserName !== 'chromium'` |
| `test.fixme(...)` | "known broken, fix later" — it's skipped |
| `test.fail()` | we **expect** this test to fail. If it fails → reported as passed. If it unexpectedly passes → reported as failed |
| `test.slow()` | triples the timeout for this test |
| `test.only(...)` | run ONLY this test (debugging; forbidden on CI by `forbidOnly`) |

---

## 17. Reports, trace, screenshots, video

### Reporters (configured in `reporter: [...]`)

| Reporter | Output | Used for |
|---|---|---|
| `list` | one line per test in the console | watching locally |
| `html` | `playwright-report/index.html` | the best report: filters, steps, errors, screenshots, video, trace. Open with `npm run report` |
| `json` | `test-results/results.json` | other programs/scripts reading the results |
| `junit` | `test-results/junit.xml` | CI tools (Jenkins, Azure DevOps...) show test results from this format |
| (also `line`, `dot`, `blob`) | | |

### Trace — the most useful debugging tool
A **trace** is a complete recording of the test: every action, a **DOM snapshot before and after** each step (you can inspect the page like in DevTools), network requests, console logs, the source code line, and timing.

- `trace: 'on-first-retry'` → recorded when a failed test is retried the first time.
- Open it: in the HTML report click the test → **Trace** tab, or run:
  ```
  npx playwright show-trace test-results/<test-folder>/trace.zip
  ```
- Or drag the zip onto https://trace.playwright.dev

### Screenshots and video
- `screenshot: 'only-on-failure'` → `test-failed-1.png` in the test's folder under `test-results/`
- `video: 'retain-on-failure'` → `video.webm`
- Both are attached to the HTML report too.

### `testInfo`
The 2nd argument of a test or hook:
`testInfo.title`, `testInfo.status`, `testInfo.retry`, `testInfo.project.name`, `testInfo.workerIndex`, `testInfo.attach(...)`, `testInfo.outputPath('file.txt')` (a safe folder for files created by this test).

---

## 18. Tags and grep

**Tags** are labels on tests, so you can run a subset.

```js
test('TC06: ...', { tag: '@smoke' }, async (...) => {...});
test('TC05: ...', { tag: ['@smoke', '@regression'] }, ...);   // several tags
test.describe('Login', { tag: '@login' }, () => {...});        // every test in the group gets @login
```

| Tag | Meaning in this project |
|---|---|
| `@smoke` | most important, quick tests — "is the app basically working?" |
| `@regression` | wider tests — "did a new change break old features?" |
| `@e2e` | end-to-end flow |
| `@api`, `@login`, `@inventory`, `@checkout`, `@mock`, `@files`... | by feature |
| `@negative` | tests for wrong input / errors |
| `@flaky` | known flaky (the demo) |
| `@chromium-only` | excluded from Firefox via `grepInvert` in the config |

Run them:
```
npx playwright test --grep @smoke                   # only smoke
npx playwright test --grep "@smoke|@api"            # smoke OR api   (| = or)
npx playwright test --grep-invert @flaky            # everything except flaky
npx playwright test --grep @smoke --project=ui-chromium
```

---

## 19. Data-driven tests

**Idea:** the same test steps, different input data. Write the steps **once**, keep the data in a **file**.

`test-data/loginUsers.json`:
```json
[
  { "id": "TC01", "title": "valid standard user", "username": "standard_user", "password": "secret_sauce", "shouldLogin": true },
  { "id": "TC02", "title": "locked out user", "username": "locked_out_user", ..., "shouldLogin": false, "error": "Sorry, this user has been locked out." },
  ...
]
```

`tests/ui/login.spec.js`:
```js
const users = readJson('test-data/loginUsers.json');

for (const user of users) {                                     // 4 rows → 4 tests
  test(`${user.id}: login with ${user.title}`, async ({ page, loginPage }) => {
    await loginPage.login(user.username, user.password);
    if (user.shouldLogin) {
      await expect(page).toHaveURL(/inventory\.html/);
    } else {
      await expect(loginPage.errorMessage).toContainText(user.error);
    }
  });
}
```

**Each test title must be unique**, so we put `user.id` / `user.title` in it.
To add a new test case you only add a row to the JSON. No code change.

The API version is in `users-data-driven.spec.js` (the data array is in the same file there).

---

## 20. API testing and all HTTP methods

### 20.1 What is an API?
An **API** is how programs talk to each other over HTTP. No screen — you send a **request** and get a **response**, usually in **JSON**.

**Request** = method + URL + headers + (optional) body
**Response** = status code + headers + body

```
Request:   POST https://jsonplaceholder.typicode.com/posts
           Headers: Content-Type: application/json
           Body:    {"title":"hi","body":"text","userId":1}

Response:  201 Created
           Body:    {"title":"hi","body":"text","userId":1,"id":101}
```

### 20.2 HTTP methods (CRUD = Create, Read, Update, Delete)

| Method | Purpose | Our test | Expected status |
|---|---|---|---|
| **GET** | **Read** data | `GET /posts`, `GET /posts/1`, `GET /posts?userId=1` | 200 |
| **POST** | **Create** new data | `POST /posts` with a new post | 201 |
| **PUT** | **Replace** a whole item | `PUT /posts/1` with all fields | 200 |
| **PATCH** | **Update part** of an item | `PATCH /posts/1` with only `title` | 200 |
| **DELETE** | **Delete** an item | `DELETE /posts/1` | 200 (often 204) |
| **HEAD** | like GET but returns **only headers**, no body | `HEAD /posts/1` | 200 |
| **OPTIONS** | asks "which methods are allowed?" (browsers use it for CORS) | `OPTIONS /posts` | 204 |

**PUT vs PATCH:** PUT sends the **complete** object (missing fields may be wiped). PATCH sends **only the changes**.

### 20.3 Status codes

| Code | Meaning |
|---|---|
| 200 OK | success |
| 201 Created | something new was created (after POST) |
| 204 No Content | success, empty body |
| 400 Bad Request | your data is wrong |
| 401 Unauthorized | not logged in / no token |
| 403 Forbidden | logged in but not allowed |
| 404 Not Found | the item doesn't exist (our negative test `GET /posts/99999`) |
| 500 Internal Server Error | the server crashed |

**2xx = success, 4xx = your mistake, 5xx = server's mistake.**

### 20.4 Playwright API code

```js
test('GET /posts/1', async ({ request }) => {         // built-in request fixture
  const response = await request.get('/posts/1');     // baseURL is added automatically
  expect(response.status()).toBe(200);                // status code
  expect(response.ok()).toBeTruthy();                 // true for any 2xx
  const body = await response.json();                 // body → JS object
  expect(body.id).toBe(1);
  response.headers()['content-type'];                 // read a header
});
```

| Request methods | Response methods |
|---|---|
| `request.get(url, { params })` — `params` become `?userId=1` | `response.status()` |
| `request.post(url, { data, headers })` — `data` is the JSON body | `response.ok()` |
| `request.put / patch / delete / head` | `await response.json()` |
| `request.fetch(url, { method: 'OPTIONS' })` — any method | `await response.text()` / `await response.body()` |
| | `response.headers()` |

**Our `ApiClient`** (`utils/apiClient.js`) is a thin wrapper, so tests can write `apiClient.post('/posts', newPost)`. The `apiClient` fixture creates it from `request`.

**Note:** jsonplaceholder is a **fake** API. A POST answers `201` with `id: 101`, but nothing is really saved. A real project would POST, then GET the same id to confirm it was saved.

---

## 21. Schema validation with AJV

### Why?
Checking `body.id === 1` tests **one value**. But what if the developer renames `userId` to `user_id`, or sends `id` as the string `"1"`? The frontend could break, and your value checks might not notice.

A **JSON Schema** describes the **shape** of the response: which fields must exist, and their types.

`test-data/schemas/post.schema.json`:
```json
{
  "type": "object",                                   // the response must be an object
  "required": ["userId", "id", "title", "body"],      // these keys MUST exist
  "properties": {
    "userId": { "type": "integer" },                  // must be a whole number
    "id":     { "type": "integer" },
    "title":  { "type": "string", "minLength": 1 },   // a non-empty string
    "body":   { "type": "string" }
  },
  "additionalProperties": false                       // no OTHER keys allowed
}
```
- `"type": "array"` + `"items": {...}` describes a list (`posts.schema.json`).
- `"format": "email"` checks an email format (needs `ajv-formats`) — see `user.schema.json`.
- Nested objects get their own `properties` (`address` → `geo` → `lat`, `lng`).

### AJV
**AJV** (Another JSON Validator) is a library that checks data against a schema.

```js
// utils/schemaValidator.js
const ajv = new Ajv({ allErrors: true });     // report every error, not just the first
addFormats(ajv);                              // enable "email", "uri", "date-time"...
export function validateSchema(schema, data) {
  const validate = ajv.compile(schema);       // turn the schema into a checking function
  const valid = validate(data);               // true or false
  return { valid, errors: ajv.errorsText(validate.errors) };  // readable error text
}
```

In a test:
```js
const { valid, errors } = validateSchema(postSchema, body);
expect(valid, errors).toBe(true);   // on failure the report shows e.g. "data must have required property 'userId'"
```
The negative test `schema validation catches a broken response` proves that the validator really does fail on bad data.

---

## 22. Mocking APIs

### What and why?
Web pages call backend APIs. **Mocking** = intercepting those calls and **answering with your own fake data**.
Why:
- test screens when the backend isn't ready or is down,
- test rare cases (empty list, a 500 error) that are hard to create for real,
- make tests faster and stable.

### `page.route(urlPattern, handler)`
"Whenever the page requests a URL matching this pattern, call my handler instead."
`'*/**/api/v1/fruits'` is a **glob** pattern: `*` and `**` mean "anything".

Inside the handler you choose one of three actions:

| Call | Effect | Our test |
|---|---|---|
| `route.fulfill({ json })` | answer with fake data. The real server is **never called** | the page shows only "Mocked Mango" |
| `route.fetch()` then `route.fulfill({ response, json })` | call the real server, **change** the answer, then return it | adds "Playwright Papaya" to the real list |
| `route.fulfill({ status: 500 })` | fake a server error | the page shows 0 items |
| `route.abort()` | **block** the request | blocks all images on saucedemo |
| (`route.continue()`) | let it pass through (optionally changed) | — |

**Important:** call `page.route(...)` **before** `page.goto(...)`. Otherwise the request has already happened.

`page.waitForResponse(pattern)` waits until the page receives a matching response, so you can check its status.

---

## 23. Upload and download

### Upload
A file upload is an `<input type="file">`.
```js
await page.locator('#file-upload').setInputFiles('path/to/file.txt');   // choose the file
await page.locator('#file-submit').click();                              // submit
```
`setInputFiles` puts the file directly into the input. No operating-system dialog is opened.

When there is no visible input (a custom upload button), wait for the **file chooser** event:
```js
const fileChooserPromise = page.waitForEvent('filechooser'); // 1. START waiting (no await yet!)
await page.locator('#drag-drop-upload').click();             // 2. the click opens the dialog
const fileChooser = await fileChooserPromise;                // 3. now get it
await fileChooser.setFiles({ name: 'generated.txt', mimeType: 'text/plain', buffer: Buffer.from('created in test') });
```
`buffer` = the file content made in memory, so no real file is needed.

### Download
```js
const downloadPromise = page.waitForEvent('download');  // 1. start waiting FIRST
await page.getByRole('link', { name: 'Download report' }).click();  // 2. trigger it
const download = await downloadPromise;                 // 3. get the download
download.suggestedFilename();                           // 'report.txt'
await download.saveAs(testInfo.outputPath('report.txt'));  // save it
```

### The "start waiting before you click" pattern
Why not click first, then wait? The download or dialog may happen **so fast** that it's already over before you start listening → you wait forever.
So: **create the wait Promise first (without `await`) → do the action → then `await` the Promise.**
The same pattern is used with `waitForResponse` and `waitForEvent('popup')` (new tabs).

---

## 24. CI/CD with GitHub Actions

### Words
- **CI (Continuous Integration)** — every time code is pushed, a server automatically builds and **tests** it.
- **CD (Continuous Delivery/Deployment)** — if the tests pass, it is automatically released.
- **GitHub Actions** — GitHub's free CI system. You describe the steps in a **YAML** file inside `.github/workflows/`.
- **YAML** — a settings format where **indentation (spaces) matters**.

### Our file `.github/workflows/playwright.yml`, line by line

```yaml
name: Playwright Tests                 # name shown in the GitHub "Actions" tab

on:                                    # WHEN to run (triggers)
  push:
    branches: [main]                   # when someone pushes to main
  pull_request:
    branches: [main]                   # when a pull request targets main
  workflow_dispatch:                   # a manual "Run workflow" button
    inputs:
      grep:                            # a text box: which tag to run
        default: ''
  schedule:
    - cron: '30 2 * * *'               # every day at 02:30 UTC (nightly run)
                                       # cron = minute hour day month weekday

jobs:                                  # a workflow has one or more jobs
  test:
    name: ${{ matrix.project }}        # ${{ }} = an expression GitHub evaluates
    runs-on: ubuntu-latest             # a fresh Linux virtual machine from GitHub
    timeout-minutes: 30

    strategy:
      fail-fast: false                 # if one job fails, don't cancel the others
      matrix:
        project: [api, ui-chromium, ui-firefox]   # creates 3 PARALLEL jobs, one per value

    env:                               # environment variables (like .env)
      CI: true                         # → our config uses retries 2, workers 2, forbidOnly
      STANDARD_USER: ${{ secrets.STANDARD_USER || 'standard_user' }}
      # secrets = encrypted values stored in GitHub: Settings → Secrets and variables → Actions

    steps:                             # the commands, in order
      - uses: actions/checkout@v4      # download your repository code onto the machine
      - uses: actions/setup-node@v4    # install Node.js 22
        with: { node-version: 22, cache: npm }
      - run: npm ci                    # install exact dependency versions from package-lock.json
      - run: npx playwright install --with-deps chromium ...   # install browsers + Linux libraries
        if: matrix.project != 'api'    # API tests need no browser → skip this step
      - run: npx playwright test --project=${{ matrix.project }}   # RUN THE TESTS
      - uses: actions/upload-artifact@v4   # save the report so you can download it
        if: ${{ !cancelled() }}            # even when tests FAILED (that's when you need it most)
        with:
          name: playwright-report-${{ matrix.project }}
          path: playwright-report/
```

- **`uses:`** runs a ready-made action written by someone else. **`run:`** runs a shell command.
- **Artifact** = a file saved from the run. Open the run on GitHub → scroll down → **Artifacts** → download the zip → unzip it → open `index.html`, or run `npx playwright show-report <folder>`.

**To activate it:** commit and push the project to a GitHub repository. Then open the **Actions** tab.

---

## 25. Glossary

| Keyword | Simple meaning |
|---|---|
| `test` | defines one test case |
| `test.describe` | a group of tests |
| `test.step` | a named step inside a test (shown in reports) |
| `test.use` | change settings for a file or group |
| `test.extend` | create a new `test` with custom fixtures |
| `test.only` | run only this test |
| `test.skip` / `test.fixme` / `test.fail` / `test.slow` | annotations (section 16) |
| `test.describe.serial` | run the group's tests in order, in one worker |
| `test.describe.configure` | settings for a group (`mode`, `retries`, `timeout`) |
| `test.info()` | get `testInfo` from anywhere |
| `expect` | assertion (check) |
| `expect.soft` | check without stopping the test |
| `expect.poll` | re-check a function's value until it matches |
| `toPass` | re-run a block until it stops failing |
| `page` | a browser tab |
| `context` | an isolated browser session (cookies, storage, tabs) |
| `browser` | the browser application |
| `request` | an HTTP client for API calls |
| `locator` | a way to find an element (searched when used) |
| `getByRole` / `getByText` / `getByTestId` / ... | built-in locators |
| `testIdAttribute` | which HTML attribute `getByTestId` uses |
| `goto` / `click` / `fill` / `selectOption` / `setInputFiles` | actions |
| auto-waiting | Playwright waits for elements to be ready by itself |
| `async` / `await` / Promise | handling slow operations in JavaScript |
| fixture | an ingredient prepared before and cleaned up after a test |
| `use()` | inside a fixture: "give this value to the test now" |
| scope `test` / `worker` | a fixture is created per test / once per worker |
| `auto: true` | a fixture that runs for every test automatically |
| hook | `beforeAll`, `beforeEach`, `afterEach`, `afterAll` |
| storage state | saved cookies + localStorage (a saved login) |
| project | a named configuration (browser, folder, baseURL) |
| `dependencies` | a project that must run before this one |
| `baseURL` | the start of every URL, so you can write relative paths |
| worker | a parallel process that runs tests |
| `fullyParallel` | let tests inside one file run in parallel |
| retries | run a failed test again |
| flaky | failed first, passed on retry |
| trace | a full recording of a test for debugging |
| reporter | the output format of results |
| tag / `--grep` | a label on tests / run tests by label |
| data-driven | one test template, many data rows |
| POM | Page Object Model: one class per page |
| utils | generic helper functions |
| `.env` / `dotenv` / `process.env` | private settings file / its loader / where the values end up |
| HTTP method | GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS |
| status code | the number result of an HTTP call (200, 201, 404...) |
| JSON | the text format for data: `{"key": "value"}` |
| JSON Schema | a description of the shape JSON data must have |
| AJV | the library that checks JSON against a schema |
| mocking / `page.route` | faking network responses |
| `route.fulfill` / `route.fetch` / `route.abort` / `route.continue` | fake / modify / block / pass through |
| `waitForEvent` | wait for something like `download`, `filechooser`, `popup` |
| headless / headed | browser hidden / visible |
| CI/CD | automatic test (and deploy) on every push |
| GitHub Actions | GitHub's CI system |
| workflow / job / step | the YAML file / a machine run / one command |
| matrix | run the same job several times with different values |
| secret | an encrypted value in GitHub settings |
| artifact | a file saved from a CI run (the reports) |

---

## 26. Your learning plan

Don't try to learn everything in one day. Do one step per day, and **run things and break things**: that's how it sticks.

**Day 1 — Run and look**
1. `npm run ui-mode` → click a test → press ▶ → watch each step. Click the steps on the left and look at the page snapshot.
2. `npm run test:headed` → watch the real browser.
3. `npm run report` → open a test → look at the steps.

**Day 2 — JavaScript and the test anatomy (sections 1, 6)**
1. Open `tests/ui/saucedemo-basics.spec.js` (your own file) and read it with section 6.
2. Remove one `await` in a test and run it. See what happens.

**Day 3 — Locators and assertions (sections 7–9)**
1. `npm run codegen` → click around saucedemo → look at the locators it generates.
2. Change `toHaveCount(6)` to `toHaveCount(7)` in TC06 → run → read the error → change it back.

**Day 4 — POM and utils (sections 10, 11)**
1. Exercise: add a method `getItemCount()` to `CartPage` that returns `this.cartItems.count()`.
2. Write a test: add 3 products → open the cart → `expect(await cartPage.getItemCount()).toBe(3)`.

**Day 5 — Fixtures and hooks (sections 12, 13)**
1. Run `npm run test:ui` and read the `▶ START [worker N]` and `[beforeAll]` lines.
2. Exercise: add a fixture `cartPageWithBackpack` that adds the backpack, opens the cart, then `use(cartPage)`.

**Day 6 — Storage state, parallel, retries (sections 14–16)**
1. Open `playwright/.auth/user.json` and find the cookie.
2. Compare `npm run test:ui` with `npm run test:serial` — compare the time.
3. Open the flaky test in the report → look at the **retry #1** tab and its trace.

**Day 7 — Reports and trace (section 17)**
1. Break a test on purpose → run it → open the trace → find where it failed.

**Day 8 — Tags and data-driven (sections 18, 19)**
1. Add a 5th row to `loginUsers.json`: `"problem_user"` with `"shouldLogin": true` → run `npx playwright test -g login`.
2. Run `npm run test:smoke`.

**Day 9 — API (sections 20, 21)**
1. Run `npm run test:api`.
2. Exercise: write a test for `GET /comments?postId=1`. Check the status is 200, every comment has `postId === 1`, and add a schema for a comment.

**Day 10 — Mocking, upload/download, CI (sections 22–24)**
1. Change the mocked fruit name and run the test.
2. Push to GitHub and watch the Actions tab.

When you get stuck on a section, tell me its number, for example *"explain section 12 again with a simpler example"*.
