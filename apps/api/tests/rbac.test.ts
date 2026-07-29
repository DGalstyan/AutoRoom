import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { UserStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { agent, auth, carBody, createCar, createUser, disconnect, resetData } from './helpers';

/**
 * The `role × resource × action` matrix, asserted through real HTTP requests.
 *
 * Written as a table rather than a case per endpoint because the thing worth
 * protecting is the *shape* of the matrix: a seed change that widens
 * `content_editor` or hands `manager` a write should fail loudly here, and a
 * table makes that failure name the exact role and route.
 *
 * The expectation is "allowed or not", never a precise status. An allowed call
 * may answer 200, 201, 400 or 404 depending on the body and the fixture; what
 * matters is that it is not 403. Asserting exact codes would make this suite
 * break every time an unrelated validation rule moved.
 */

type Method = 'get' | 'post' | 'put' | 'delete';

interface Probe {
  name: string;
  method: Method;
  path: string;
  /** Sent as the request body when present. Supertest will not accept `null`. */
  body?: object;
  /** Roles that must NOT be refused. Everyone else must get 403. */
  allowed: string[];
}

const ROLES = ['super_admin', 'admin', 'manager', 'content_editor', 'partner'] as const;

/** A role that exists only to be written over by the role-editing probe. */
const PROBE_ROLE = 'probe_role';

const PROBES: Probe[] = [
  // ---- cars ----
  {
    name: 'list cars',
    method: 'get',
    path: '/cars',
    allowed: ['super_admin', 'admin', 'manager', 'content_editor'],
  },
  {
    name: 'create car',
    method: 'post',
    path: '/cars',
    body: carBody(),
    allowed: ['super_admin', 'admin', 'content_editor'],
  },
  {
    name: 'update car',
    method: 'put',
    path: '/cars/__CAR__',
    body: carBody({ slug: 'updated-probe' }),
    allowed: ['super_admin', 'admin', 'content_editor'],
  },
  {
    name: 'publish car',
    method: 'post',
    path: '/cars/__CAR__/publish',
    body: { published: false },
    allowed: ['super_admin', 'admin', 'content_editor'],
  },
  {
    name: 'delete car',
    method: 'delete',
    path: '/cars/__CAR__',
    allowed: ['super_admin', 'admin', 'content_editor'],
  },

  // ---- users ----
  { name: 'list users', method: 'get', path: '/users', allowed: ['super_admin', 'admin'] },
  {
    name: 'create user',
    method: 'post',
    path: '/users',
    body: { email: 'probe@example.com', name: 'Probe', password: 'probe-pass', roleKey: 'manager' },
    allowed: ['super_admin', 'admin'],
  },

  // ---- roles ----
  { name: 'read roles', method: 'get', path: '/roles', allowed: ['super_admin', 'admin'] },
  {
    name: 'read permission catalogue',
    method: 'get',
    path: '/permissions',
    allowed: ['super_admin', 'admin'],
  },
  // Targets a disposable role, never a seeded one: a successful write here
  // empties the role's grants, and `resetData` deliberately leaves roles alone.
  // Pointed at `manager` this quietly broke every later manager case.
  {
    name: 'edit role permissions',
    method: 'put',
    path: `/roles/${PROBE_ROLE}/permissions`,
    body: { permissions: [] },
    allowed: ['super_admin'],
  },

  // ---- settings ----
  { name: 'read settings', method: 'get', path: '/settings', allowed: ['super_admin', 'admin'] },
  {
    name: 'write settings',
    method: 'put',
    path: '/settings/branding.identity',
    body: { brandName: 'Probe' },
    allowed: ['super_admin', 'admin'],
  },

  // ---- partners & bookings ----
  {
    name: 'list partners',
    method: 'get',
    path: '/partners',
    allowed: ['super_admin', 'admin', 'manager'],
  },
  {
    name: 'create partner',
    method: 'post',
    path: '/partners',
    body: { name: 'Probe partner' },
    allowed: ['super_admin', 'admin', 'manager'],
  },
  {
    name: 'list bookings',
    method: 'get',
    path: '/bookings',
    allowed: ['super_admin', 'admin', 'manager'],
  },

  // ---- uploads ----
  {
    name: 'upload a file',
    method: 'post',
    path: '/uploads',
    allowed: ['super_admin', 'admin', 'content_editor'],
  },
];

describe('RBAC matrix', () => {
  beforeEach(async () => {
    await resetData();
    await prisma.role.upsert({
      where: { key: PROBE_ROLE },
      update: {},
      create: { key: PROBE_ROLE, name: 'Probe role', description: 'Disposable, for tests.' },
    });
  });
  afterAll(disconnect);

  for (const probe of PROBES) {
    describe(probe.name, () => {
      for (const role of ROLES) {
        const shouldAllow = probe.allowed.includes(role);

        it(`${shouldAllow ? 'allows' : 'refuses'} ${role}`, async () => {
          const { token } = await createUser(role);
          const car = await createCar();
          const path = probe.path.replace('__CAR__', car.id);

          const call = agent()[probe.method](path).set(auth(token));
          const response = probe.body === undefined ? await call : await call.send(probe.body);

          if (shouldAllow) {
            expect(response.status, `${role} should reach ${probe.name}`).not.toBe(403);
          } else {
            expect(response.status, `${role} should be refused ${probe.name}`).toBe(403);
          }
        });
      }
    });
  }

  describe('authentication', () => {
    it('refuses anonymous callers with 401, not 403', async () => {
      // The distinction matters to the client: 401 means "sign in", 403 means
      // "signing in again will not help".
      for (const path of ['/cars', '/users', '/roles', '/settings', '/partners', '/bookings']) {
        const response = await agent().get(path);
        expect(response.status, path).toBe(401);
      }
    });

    it('rejects a token signed with the wrong secret', async () => {
      const response = await agent().get('/cars').set(auth('not.a.real.token'));
      expect(response.status).toBe(401);
    });

    it('leaves the public settings endpoint open', async () => {
      const response = await agent().get('/settings/public');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('branding.identity');
    });
  });

  describe('account state is checked on every request, not just at login', () => {
    it('refuses a disabled account holding a still-valid token', async () => {
      const { user, token } = await createUser('admin');
      expect((await agent().get('/cars').set(auth(token))).status).toBe(200);

      await prisma.user.update({ where: { id: user.id }, data: { status: UserStatus.DISABLED } });

      // Same token, no re-login: the middleware reloads the user each time.
      expect((await agent().get('/cars').set(auth(token))).status).toBe(403);
    });

    it('refuses a pending account', async () => {
      const { token } = await createUser('admin', { status: UserStatus.PENDING });
      expect((await agent().get('/cars').set(auth(token))).status).toBe(403);
    });
  });

  describe('the matrix is data, so editing it takes effect immediately', () => {
    it('grants a manager car writes once the role is given cars:CREATE', async () => {
      const { token } = await createUser('manager');
      expect((await agent().post('/cars').set(auth(token)).send(carBody())).status).toBe(403);

      const role = await prisma.role.findUniqueOrThrow({ where: { key: 'manager' } });
      const permission = await prisma.permission.findFirstOrThrow({
        where: { resource: 'cars', action: 'CREATE' },
      });
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permission.id },
      });

      try {
        // No new token, no new session — the grant is read per request.
        expect((await agent().post('/cars').set(auth(token)).send(carBody())).status).toBe(201);
      } finally {
        await prisma.rolePermission.deleteMany({
          where: { roleId: role.id, permissionId: permission.id },
        });
      }
    });

    it('refuses to narrow super_admin, which would be unrecoverable', async () => {
      const { token } = await createUser('super_admin');
      const response = await agent()
        .put('/roles/super_admin/permissions')
        .set(auth(token))
        .send({ permissions: [] });

      expect(response.status).toBe(403);
    });
  });

  describe('privilege escalation', () => {
    it('stops an admin assigning the super_admin role', async () => {
      const { token } = await createUser('admin');
      const { user: target } = await createUser('manager');

      const response = await agent()
        .patch(`/users/${target.id}/role`)
        .set(auth(token))
        .send({ roleKey: 'super_admin' });

      // `users:UPDATE` is not enough — assigning a privileged role needs
      // `roles:UPDATE`, which admin does not hold.
      expect(response.status).toBe(403);
    });

    it('stops an admin editing another admin', async () => {
      const { token } = await createUser('admin');
      const { user: other } = await createUser('admin');

      const response = await agent()
        .patch(`/users/${other.id}`)
        .set(auth(token))
        .send({ name: 'Renamed by a peer' });

      expect(response.status).toBe(403);
    });

    it('lets a super_admin do both', async () => {
      const { token } = await createUser('super_admin');
      const { user: target } = await createUser('manager');

      expect(
        (
          await agent()
            .patch(`/users/${target.id}/role`)
            .set(auth(token))
            .send({ roleKey: 'admin' })
        ).status,
      ).toBe(200);
    });

    it('stops anyone deleting their own account', async () => {
      const { user, token } = await createUser('super_admin');
      expect((await agent().delete(`/users/${user.id}`).set(auth(token))).status).toBe(400);
    });
  });
});
