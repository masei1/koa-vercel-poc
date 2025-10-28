const PLACES = [
  {
    id: 'place-sf-golden-gate-park',
    name: 'Golden Gate Park',
    category: 'park',
    region: 'bay-area',
    location: { lon: -122.4862, lat: 37.7694 },
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [-122.495, 37.771],
          [-122.483, 37.771],
          [-122.483, 37.765],
          [-122.495, 37.765],
          [-122.495, 37.771]
        ]
      ]
    }
  },
  {
    id: 'place-sf-ferry-building',
    name: 'Ferry Building',
    category: 'landmark',
    region: 'bay-area',
    location: { lon: -122.393, lat: 37.7955 }
  },
  {
    id: 'place-la-griffith-observatory',
    name: 'Griffith Observatory',
    category: 'observatory',
    region: 'los-angeles',
    location: { lon: -118.3004, lat: 34.1184 }
  },
  {
    id: 'place-la-santa-monica-pier',
    name: 'Santa Monica Pier',
    category: 'landmark',
    region: 'los-angeles',
    location: { lon: -118.495, lat: 34.0094 }
  },
  {
    id: 'place-ny-central-park',
    name: 'Central Park',
    category: 'park',
    region: 'new-york',
    location: { lon: -73.9654, lat: 40.7829 },
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [-73.9818, 40.8005],
          [-73.9497, 40.8005],
          [-73.9497, 40.7644],
          [-73.9818, 40.7644],
          [-73.9818, 40.8005]
        ]
      ]
    }
  },
  {
    id: 'place-ny-statue-of-liberty',
    name: 'Statue of Liberty',
    category: 'landmark',
    region: 'new-york',
    location: { lon: -74.0445, lat: 40.6892 }
  }
];

const REGION_METADATA = {
  'bay-area': {
    id: 'cluster-bay-area',
    name: 'San Francisco Bay Area',
    centroid: { lon: -122.27, lat: 37.78 }
  },
  'los-angeles': {
    id: 'cluster-los-angeles',
    name: 'Los Angeles Metro',
    centroid: { lon: -118.37, lat: 34.1 }
  },
  'new-york': {
    id: 'cluster-new-york',
    name: 'New York City',
    centroid: { lon: -73.97, lat: 40.76 }
  }
};

function withinBbox({ lon, lat }, bbox) {
  return (
    lon >= bbox.west &&
    lon <= bbox.east &&
    lat >= bbox.south &&
    lat <= bbox.north
  );
}

function toCluster(regionKey, places) {
  const region = REGION_METADATA[regionKey];
  const total = places.length;
  const sampleCategories = Array.from(
    new Set(places.map((place) => place.category))
  );

  return {
    id: region?.id ?? `cluster-${regionKey}`,
    name: region?.name ?? regionKey,
    centroid: region?.centroid ?? {
      lon: places.reduce((sum, place) => sum + place.location.lon, 0) / total,
      lat: places.reduce((sum, place) => sum + place.location.lat, 0) / total
    },
    count: total,
    sampleCategories
  };
}

function toMarker(place) {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    location: place.location
  };
}

function toPolygon(place) {
  if (!place.polygon) {
    return null;
  }

  return {
    id: `${place.id}-polygon`,
    name: place.name,
    category: place.category,
    geometry: place.polygon
  };
}

function computeCacheKey(bbox, zoom) {
  return [
    'places-v1',
    bbox.west.toFixed(2),
    bbox.south.toFixed(2),
    bbox.east.toFixed(2),
    bbox.north.toFixed(2),
    zoom
  ].join(':');
}

export async function getMapData({ bbox, zoom }) {
  const filteredPlaces = PLACES.filter((place) =>
    withinBbox(place.location, bbox)
  );

  const clusters = [];
  const markers = [];
  const polygons = [];

  if (filteredPlaces.length === 0) {
    return {
      clusters,
      markers,
      polygons,
      cacheKey: computeCacheKey(bbox, zoom),
      total: 0
    };
  }

  if (zoom <= 6) {
    const grouped = filteredPlaces.reduce((acc, place) => {
      const key = place.region ?? 'unknown';
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key).push(place);
      return acc;
    }, new Map());

    for (const [region, regionPlaces] of grouped.entries()) {
      clusters.push(toCluster(region, regionPlaces));
    }
  } else {
    for (const place of filteredPlaces) {
      markers.push(toMarker(place));

      if (zoom >= 11) {
        const polygon = toPolygon(place);
        if (polygon) {
          polygons.push(polygon);
        }
      }
    }
  }

  return {
    clusters,
    markers,
    polygons,
    cacheKey: computeCacheKey(bbox, zoom),
    total: filteredPlaces.length
  };
}

export function getAvailableRegions() {
  return Object.keys(REGION_METADATA);
}
