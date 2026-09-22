import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { agent, auth, createCar, createUser, disconnect, resetData } from './helpers';

/**
 * Photo/image reordering — the admin's "swap ordering" controls for a car's
 * photo albums (`ImageAlbums.tsx`) and the About-page gallery collage
 * (`GalleryPage.tsx`) both persist through a `PATCH .../reorder` that takes
 * the whole collection's new front-to-back id order and writes each row's
 * `position` as its index.
 */
describe('image reordering', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  describe('car image albums', () => {
    it('writes 0..n-1 positions in the given order', async () => {
      const { token } = await createUser('admin');
      const car = await createCar();
      const a = await prisma.carImage.create({
        data: { carId: car.id, album: 'EXTERIOR', url: 'https://example.com/a.jpg', position: 0 },
      });
      const b = await prisma.carImage.create({
        data: { carId: car.id, album: 'EXTERIOR', url: 'https://example.com/b.jpg', position: 1 },
      });
      const c = await prisma.carImage.create({
        data: { carId: car.id, album: 'EXTERIOR', url: 'https://example.com/c.jpg', position: 2 },
      });

      const response = await agent()
        .patch(`/cars/${car.id}/images/reorder`)
        .set(auth(token))
        .send({ album: 'EXTERIOR', imageIds: [c.id, a.id, b.id] });

      expect(response.status).toBe(200);
      expect(response.body.map((image: { id: string }) => image.id)).toEqual([c.id, a.id, b.id]);
      expect(response.body.map((image: { position: number }) => image.position)).toEqual([0, 1, 2]);
    });

    it('never touches another album sharing the same car', async () => {
      const { token } = await createUser('admin');
      const car = await createCar();
      const ext = await prisma.carImage.create({
        data: { carId: car.id, album: 'EXTERIOR', url: 'https://example.com/ext.jpg', position: 0 },
      });
      const interior = await prisma.carImage.create({
        data: { carId: car.id, album: 'INTERIOR', url: 'https://example.com/int.jpg', position: 5 },
      });

      const response = await agent()
        .patch(`/cars/${car.id}/images/reorder`)
        .set(auth(token))
        .send({ album: 'EXTERIOR', imageIds: [ext.id] });

      expect(response.status).toBe(200);
      const untouched = await prisma.carImage.findUnique({ where: { id: interior.id } });
      expect(untouched?.position).toBe(5);
    });

    it('rejects an id list that is not exactly the album’s current photos', async () => {
      const { token } = await createUser('admin');
      const car = await createCar();
      const other = await createCar();
      const a = await prisma.carImage.create({
        data: { carId: car.id, album: 'EXTERIOR', url: 'https://example.com/a.jpg', position: 0 },
      });
      const stray = await prisma.carImage.create({
        data: {
          carId: other.id,
          album: 'EXTERIOR',
          url: 'https://example.com/stray.jpg',
          position: 0,
        },
      });

      const missing = await agent()
        .patch(`/cars/${car.id}/images/reorder`)
        .set(auth(token))
        .send({ album: 'EXTERIOR', imageIds: [] });
      expect(missing.status).toBe(400);

      const foreign = await agent()
        .patch(`/cars/${car.id}/images/reorder`)
        .set(auth(token))
        .send({ album: 'EXTERIOR', imageIds: [a.id, stray.id] });
      expect(foreign.status).toBe(400);
    });

    it('requires cars:UPDATE', async () => {
      // `manager` holds `cars:READ` only (its own CRM-lookup grant, see
      // `permissions.ts`) — real read access, deliberately short of write.
      const { token } = await createUser('manager');
      const car = await createCar();
      const a = await prisma.carImage.create({
        data: { carId: car.id, album: 'EXTERIOR', url: 'https://example.com/a.jpg', position: 0 },
      });

      const response = await agent()
        .patch(`/cars/${car.id}/images/reorder`)
        .set(auth(token))
        .send({ album: 'EXTERIOR', imageIds: [a.id] });

      expect(response.status).toBe(403);
    });
  });

  describe('gallery collage', () => {
    const createdIds: string[] = [];

    afterEach(async () => {
      // Not part of `resetData`'s TRUNCATE list (the About-page collage isn't
      // under test elsewhere yet), so this suite cleans up its own rows
      // rather than leaking them into whatever runs next.
      if (createdIds.length > 0) {
        await prisma.galleryImage.deleteMany({ where: { id: { in: createdIds } } });
        createdIds.length = 0;
      }
    });

    async function image(position: number) {
      const created = await prisma.galleryImage.create({
        data: { imageUrl: `https://example.com/g-${position}-${Date.now()}.jpg`, position },
      });
      createdIds.push(created.id);
      return created;
    }

    it('writes 0..n-1 positions in the given order', async () => {
      const { token } = await createUser('admin');
      const a = await image(0);
      const b = await image(1);
      const c = await image(2);

      const response = await agent()
        .patch('/gallery/reorder')
        .set(auth(token))
        .send({ imageIds: [b.id, c.id, a.id] });

      expect(response.status).toBe(200);
      expect(response.body.map((row: { id: string }) => row.id)).toEqual([b.id, c.id, a.id]);
      expect(response.body.map((row: { position: number }) => row.position)).toEqual([0, 1, 2]);
    });

    it('rejects a list that omits an existing tile', async () => {
      const { token } = await createUser('admin');
      const a = await image(0);
      await image(1);

      const response = await agent()
        .patch('/gallery/reorder')
        .set(auth(token))
        .send({ imageIds: [a.id] });

      expect(response.status).toBe(400);
    });

    it('requires gallery:UPDATE', async () => {
      const { token } = await createUser('manager');
      const a = await image(0);

      const response = await agent()
        .patch('/gallery/reorder')
        .set(auth(token))
        .send({ imageIds: [a.id] });

      expect(response.status).toBe(403);
    });
  });
});
