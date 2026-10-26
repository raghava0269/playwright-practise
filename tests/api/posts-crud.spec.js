import { test, expect } from '../../fixtures/fixtures';
import { validateSchema } from '../../utils/schemaValidator';
import { readJson, randomString, randomNumber } from '../../utils/helpers';

/**
 * ALL HTTP METHODS + SCHEMA VALIDATION (AJV)
 * API: https://jsonplaceholder.typicode.com (fake REST API — writes are
 * simulated, so a POSTed item is not really saved on the server).
 * baseURL comes from the `api` project in playwright.config.js.
 */
const postSchema = readJson('test-data/schemas/post.schema.json');
const postsSchema = readJson('test-data/schemas/posts.schema.json');

test.describe('Posts API - CRUD', { tag: '@api' }, () => {
  test('GET /posts - list all posts', { tag: '@smoke' }, async ({ apiClient }) => {
    const response = await apiClient.get('/posts');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const body = await response.json();
    expect(body).toHaveLength(100);

    const { valid, errors } = validateSchema(postsSchema, body);
    expect(valid, errors).toBe(true);
  });

  test('GET /posts/1 - single post matches schema', async ({ apiClient }) => {
    const response = await apiClient.get('/posts/1');

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({ id: 1, userId: 1 });
    expect(validateSchema(postSchema, body).valid).toBe(true);
  });

  test('GET /posts?userId=1 - query params', async ({ apiClient }) => {
    const response = await apiClient.get('/posts', { userId: 1 });
    const body = await response.json();

    expect(body.length).toBeGreaterThan(0);
    expect(body.every((p) => p.userId === 1)).toBe(true);
  });

  test('POST /posts - create a post', { tag: '@smoke' }, async ({ apiClient }) => {
    const newPost = { title: `title-${randomString()}`, body: 'created by playwright', userId: randomNumber(1, 10) };

    const response = await apiClient.post('/posts', newPost);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject(newPost);
    expect(body.id).toBe(101);
    expect(validateSchema(postSchema, body).valid).toBe(true);
  });

  test('PUT /posts/1 - replace a post', async ({ apiClient }) => {
    const updated = { id: 1, title: 'replaced title', body: 'replaced body', userId: 1 };

    const response = await apiClient.put('/posts/1', updated);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(updated);
  });

  test('PATCH /posts/1 - partially update a post', async ({ apiClient }) => {
    const response = await apiClient.patch('/posts/1', { title: 'patched title' });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.title).toBe('patched title');
    expect(body.body).toBeTruthy(); // untouched fields remain
  });

  test('DELETE /posts/1 - delete a post', async ({ apiClient }) => {
    const response = await apiClient.delete('/posts/1');

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({});
  });

  test('HEAD /posts/1 - headers only, no body', async ({ apiClient }) => {
    const response = await apiClient.head('/posts/1');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expect((await response.body()).length).toBe(0);
  });

  test('OPTIONS /posts - allowed methods (CORS preflight)', async ({ apiClient }) => {
    const response = await apiClient.options('/posts');

    expect(response.status()).toBe(204);
    expect(response.headers()['access-control-allow-methods']).toContain('GET');
  });

  test('GET /posts/99999 - negative: not found', { tag: '@negative' }, async ({ apiClient }) => {
    const response = await apiClient.get('/posts/99999');

    expect(response.status()).toBe(404);
    expect(response.ok()).toBeFalsy();
  });

  test('schema validation catches a broken response', { tag: '@negative' }, async () => {
    const broken = { id: '1', title: 123 }; // wrong types + missing fields

    const { valid, errors } = validateSchema(postSchema, broken);

    expect(valid).toBe(false);
    expect(errors).toContain("must have required property 'userId'");
  });
});
