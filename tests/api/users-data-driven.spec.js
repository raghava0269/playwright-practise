import { test, expect } from '@playwright/test';
import { validateSchema } from '../../utils/schemaValidator';
import { readJson } from '../../utils/helpers';

/**
 * DATA-DRIVEN API tests + built-in `request` fixture (no custom wrapper)
 * + SERIAL mode where tests share state.
 */
const userSchema = readJson('test-data/schemas/user.schema.json');

const users = [
  { id: 1, username: 'Bret', city: 'Gwenborough' },
  { id: 2, username: 'Antonette', city: 'Wisokyburgh' },
  { id: 3, username: 'Samantha', city: 'McKenziehaven' },
];

test.describe('Users API - data driven', { tag: '@api' }, () => {
  for (const { id, username, city } of users) {
    test(`GET /users/${id} returns ${username}`, async ({ request }) => {
      const response = await request.get(`/users/${id}`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.username).toBe(username);
      expect(body.address.city).toBe(city);

      const { valid, errors } = validateSchema(userSchema, body);
      expect(valid, errors).toBe(true);
    });
  }
});

/**
 * SERIAL: tests run in order, in one worker. If one fails, the rest are skipped.
 * Use it when tests depend on each other (create -> read -> delete).
 */
test.describe.serial('Chained API flow', { tag: '@api' }, () => {
  let createdId;

  test('create a todo', async ({ request }) => {
    const response = await request.post('/todos', {
      data: { title: 'learn playwright', completed: false, userId: 1 },
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    });
    expect(response.status()).toBe(201);
    createdId = (await response.json()).id;
    expect(createdId).toBeDefined();
  });

  test('use the id from the previous test', async ({ request }) => {
    // jsonplaceholder does not persist writes, so the new id (201) is unknown.
    // We still show passing data between serial tests:
    expect(createdId).toBe(201);
    const response = await request.delete(`/todos/${createdId}`);
    expect(response.ok()).toBeTruthy();
  });
});
