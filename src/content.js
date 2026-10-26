// Everything the page says: the house, the six chapters of the walk and their products.
// Prices and names are invented for the design; swap them for the real range here.
export const HOUSE = {
  name: 'Ondine',
  tagline: 'Maison de mode · Paris',
  line: 'Six ways to be dressed. One walk.',
  address: '14 rue Saint-Honoré, 75001 Paris',
  hours: 'Monday to Saturday, 10h – 19h',
  phone: '+33 1 42 60 00 14',
  email: 'bonjour@ondine.paris',
  lat: 48.8656,
  lon: 2.3212,
}

export const CHAPTERS = [
  {
    key: 'outerwear', no: '01', name: 'Outerwear', word: 'Coats',
    title: 'The coat finds you.',
    text: 'Double-faced camel wool from Biella, cut long and tied, not buttoned. Worn open over everything from the first cold morning to the last.',
    products: [
      { name: 'Aurore wrap coat', detail: 'Double-faced camel wool · belted', price: '€1,890', front: 'coat-front', back: 'coat-back' },
      { name: 'Nuit biker jacket', detail: 'Black lambskin · silver hardware', price: '€1,450', front: 'biker-front', back: 'biker-back' },
    ],
  },
  {
    key: 'dresses', no: '02', name: 'Dresses', word: 'Noir',
    title: 'One turn, and it is evening.',
    text: 'Heavy silk cut on the bias so it falls like water. Nothing to adjust, nothing to hold: the dress does the work.',
    products: [
      { name: 'Minuit column dress', detail: 'Heavy silk satin · floor length', price: '€1,290', front: 'column-front', back: 'column-back' },
      { name: 'Grenat slip dress', detail: 'Oxblood satin · cowl neck · midi', price: '€790', front: 'slip-front', back: 'slip-back' },
    ],
  },
  {
    key: 'tailoring', no: '03', name: 'Tailoring', word: 'Suit',
    title: 'Cut for the way you stand.',
    text: 'Wool crepe suits with a soft shoulder and a long line. The jacket closes on gold horn buttons; the trousers are made to be worn with flats.',
    products: [
      { name: 'Ivoire double-breasted suit', detail: 'Wool crepe · wide-leg trouser', price: '€2,350', front: 'ivory-front', back: 'ivory-back' },
      { name: 'Charbon pinstripe suit', detail: 'Charcoal wool · straight trouser', price: '€2,150', front: 'pinstripe-front', back: 'pinstripe-back' },
    ],
  },
  {
    key: 'swim', no: '04', name: 'Swim', word: 'Rivage',
    title: 'From the runway to the water.',
    text: 'Italian matte Lycra that holds its colour in salt and sun, with solid gold-tone hardware that will not green. Made for the pool at noon and the bar at six.',
    products: [
      { name: 'Lagune one-piece', detail: 'Aqua matte Lycra · gold ring', price: '€390', front: 'onepiece-front', back: 'onepiece-back' },
      { name: 'Chaîne bikini', detail: 'Black · gold chain straps', price: '€340', front: 'bikini-front', back: 'bikini-back' },
    ],
  },
  {
    key: 'knitwear', no: '05', name: 'Knitwear', word: 'Cachemire',
    title: 'Knitted around you.',
    text: 'Four-ply Mongolian cashmere, spun in Scotland and finished by hand. Soft the first day, softer the hundredth.',
    products: [
      { name: 'Avoine turtleneck', detail: 'Chunky cashmere · relaxed', price: '€690', front: 'turtleneck-front', back: 'turtleneck-back' },
      { name: 'Brume rib dress', detail: 'Fine ribbed knit · midi', price: '€850', front: 'ribdress-front', back: 'ribdress-back' },
    ],
  },
  {
    key: 'evening', no: '06', name: 'Evening', word: 'Gala',
    title: 'The last look is yours.',
    text: 'Gowns for the nights that are remembered. Hand-set sequins on silk tulle, velvet that drinks the light, each one finished to your measure in the atelier.',
    products: [
      { name: 'Constellation gown', detail: 'Midnight sequins · long sleeve', price: '€4,900', front: 'sequin-front', back: 'sequin-back' },
      { name: 'Émeraude gown', detail: 'Silk velvet · off the shoulder', price: '€3,800', front: 'velvet-front', back: 'velvet-back' },
    ],
  },
]
