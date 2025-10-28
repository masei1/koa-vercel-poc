import {
  getAvailableRegions,
  getMapData
} from '../../mocks/placesMock.js';

describe('placesMock', () => {
  describe('getMapData', () => {
    it('returns clusters at low zoom levels', async () => {
      const result = await getMapData({
        bbox: { west: -130, south: 30, east: -110, north: 45 },
        zoom: 5
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.clusters).not.toHaveLength(0);
      expect(result.markers).toHaveLength(0);
      expect(result.polygons).toHaveLength(0);
    });

    it('returns markers at medium zoom levels', async () => {
      const result = await getMapData({
        bbox: { west: -125, south: 32, east: -114, north: 42 },
        zoom: 8
      });

      expect(result.clusters).toHaveLength(0);
      expect(result.markers.length).toBeGreaterThan(0);
      expect(result.polygons).toHaveLength(0);
    });

    it('returns polygons at high zoom levels when available', async () => {
      const result = await getMapData({
        bbox: { west: -75, south: 40, east: -70, north: 42 },
        zoom: 12
      });

      expect(result.markers.length).toBeGreaterThan(0);
      expect(result.polygons.length).toBeGreaterThan(0);
    });

    it('returns an empty set when bbox contains no places', async () => {
      const result = await getMapData({
        bbox: { west: 10, south: 10, east: 20, north: 20 },
        zoom: 5
      });

      expect(result.total).toBe(0);
      expect(result.clusters).toHaveLength(0);
      expect(result.markers).toHaveLength(0);
      expect(result.polygons).toHaveLength(0);
    });
  });

  describe('getAvailableRegions', () => {
    it('returns configured regions', () => {
      const regions = getAvailableRegions();
      expect(Array.isArray(regions)).toBe(true);
      expect(regions.length).toBeGreaterThan(0);
      expect(regions).toContain('bay-area');
    });
  });
});
