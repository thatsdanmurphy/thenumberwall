/**
 * US geography lookup for WallsMap.
 *
 * TOWN_COORDS is hand-maintained. Key = town_slug used by teamWallStore
 * (slugify(town) + '-' + lowerState), value = [longitude, latitude].
 *
 * When WallsMap encounters a town_slug not in this list, it falls back to
 * the state centroid (STATE_CENTROIDS) and logs the miss so we can fill in
 * coords as new towns appear.
 *
 * To add a town: look up its lat/long (Google "<town> latitude longitude"),
 * then add an entry here. [lng, lat] order — longitude first, that's how
 * d3-geo / react-simple-maps expect coords.
 */

export const TOWN_COORDS = {
  // ── Massachusetts ──
  'boston-ma':           [-71.0589, 42.3601],
  'cambridge-ma':        [-71.1097, 42.3736],
  'brookline-ma':        [-71.1212, 42.3318],
  'newton-ma':           [-71.2095, 42.3370],
  'needham-ma':          [-71.2381, 42.2809],
  'wellesley-ma':        [-71.2928, 42.2968],
  'weston-ma':           [-71.3034, 42.3654],
  'concord-ma':          [-71.3489, 42.4604],
  'lexington-ma':        [-71.2300, 42.4473],
  'arlington-ma':        [-71.1560, 42.4154],
  'somerville-ma':       [-71.0997, 42.3876],
  'quincy-ma':           [-71.0023, 42.2529],
  'milton-ma':           [-71.0661, 42.2495],
  'dedham-ma':           [-71.1661, 42.2417],
  'hingham-ma':          [-70.8893, 42.2418],
  'duxbury-ma':          [-70.6725, 42.0418],
  'plymouth-ma':         [-70.6620, 41.9584],
  'worcester-ma':        [-71.8023, 42.2626],
  'framingham-ma':       [-71.4162, 42.2793],
  'natick-ma':           [-71.3495, 42.2835],
  'andover-ma':          [-71.1368, 42.6583],
  'lowell-ma':           [-71.3162, 42.6334],
  'springfield-ma':      [-72.5898, 42.1015],
  'amherst-ma':          [-72.5199, 42.3732],
  'northampton-ma':      [-72.6412, 42.3251],
  'chestnut-hill-ma':    [-71.1667, 42.3259],

  // ── Rhode Island ──
  'providence-ri':       [-71.4128, 41.8240],
  'newport-ri':          [-71.3128, 41.4901],

  // ── Connecticut ──
  'hartford-ct':         [-72.6851, 41.7637],
  'new-haven-ct':        [-72.9279, 41.3083],
  'stamford-ct':         [-73.5387, 41.0534],
  'greenwich-ct':        [-73.6248, 41.0262],
  'fairfield-ct':        [-73.2640, 41.1408],
  'westport-ct':         [-73.3579, 41.1415],

  // ── New Hampshire ──
  'manchester-nh':       [-71.4548, 42.9956],
  'nashua-nh':           [-71.4748, 42.7654],
  'concord-nh':          [-71.5376, 43.2081],
  'exeter-nh':           [-70.9478, 42.9814],

  // ── Maine ──
  'portland-me':         [-70.2553, 43.6591],

  // ── Vermont ──
  'burlington-vt':       [-73.2121, 44.4759],

  // ── New York ──
  'new-york-ny':         [-74.0060, 40.7128],
  'brooklyn-ny':         [-73.9442, 40.6782],
  'buffalo-ny':          [-78.8784, 42.8864],
  'rochester-ny':        [-77.6088, 43.1566],
  'syracuse-ny':         [-76.1474, 43.0481],
  'scarsdale-ny':        [-73.7846, 40.9895],

  // ── New Jersey ──
  'newark-nj':           [-74.1724, 40.7357],
  'princeton-nj':        [-74.6551, 40.3573],

  // ── Pennsylvania ──
  'philadelphia-pa':     [-75.1652, 39.9526],
  'pittsburgh-pa':       [-79.9959, 40.4406],

  // ── DC / MD / VA ──
  'washington-dc':       [-77.0369, 38.9072],
  'baltimore-md':        [-76.6122, 39.2904],
  'bethesda-md':         [-77.0947, 38.9807],
  'arlington-va':        [-77.1043, 38.8816],

  // ── Midwest (starter) ──
  'chicago-il':          [-87.6298, 41.8781],
  'detroit-mi':          [-83.0458, 42.3314],
  'cleveland-oh':        [-81.6944, 41.4993],
  'minneapolis-mn':      [-93.2650, 44.9778],

  // ── West (starter) ──
  'los-angeles-ca':      [-118.2437, 34.0522],
  'san-francisco-ca':    [-122.4194, 37.7749],
  'seattle-wa':          [-122.3321, 47.6062],
  'portland-or':         [-122.6765, 45.5152],
  'denver-co':           [-104.9903, 39.7392],

  // ── South (starter) ──
  'atlanta-ga':          [-84.3880, 33.7490],
  'miami-fl':            [-80.1918, 25.7617],
  'nashville-tn':        [-86.7816, 36.1627],
  'austin-tx':           [-97.7431, 30.2672],
  'dallas-tx':           [-96.7970, 32.7767],
  'houston-tx':          [-95.3698, 29.7604],
}

/**
 * State centroids (approximate) — fallback coords for any town not in
 * TOWN_COORDS. Good enough to land a dot in the right state while we
 * backfill the real town coords.
 */
export const STATE_CENTROIDS = {
  AL: [-86.79, 32.81], AK: [-152.40, 61.37], AZ: [-111.09, 34.05],
  AR: [-92.44, 34.97], CA: [-119.42, 36.78], CO: [-105.36, 39.05],
  CT: [-72.75, 41.60], DE: [-75.51, 38.99], FL: [-81.69, 27.77],
  GA: [-83.64, 32.16], HI: [-156.31, 19.74], ID: [-114.48, 44.24],
  IL: [-89.38, 40.35], IN: [-86.26, 39.84], IA: [-93.21, 42.01],
  KS: [-96.73, 38.53], KY: [-84.67, 37.67], LA: [-91.87, 31.17],
  ME: [-69.38, 44.69], MD: [-76.80, 39.06], MA: [-71.53, 42.23],
  MI: [-84.54, 43.33], MN: [-93.90, 45.69], MS: [-89.68, 32.74],
  MO: [-92.29, 38.46], MT: [-110.45, 46.92], NE: [-98.27, 41.12],
  NV: [-117.05, 38.31], NH: [-71.56, 43.45], NJ: [-74.52, 40.30],
  NM: [-106.25, 34.84], NY: [-74.95, 42.17], NC: [-79.81, 35.63],
  ND: [-99.78, 47.53], OH: [-82.76, 40.39], OK: [-96.93, 35.57],
  OR: [-122.07, 44.57], PA: [-77.21, 40.59], RI: [-71.51, 41.68],
  SC: [-80.95, 33.86], SD: [-99.44, 44.30], TN: [-86.69, 35.75],
  TX: [-97.56, 31.06], UT: [-111.86, 40.15], VT: [-72.71, 44.04],
  VA: [-78.17, 37.77], WA: [-121.49, 47.40], WV: [-80.95, 38.49],
  WI: [-89.62, 44.27], WY: [-107.30, 42.76], DC: [-77.03, 38.91],
}
