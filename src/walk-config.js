// Where things happen in the film, in seconds of each shot:
// shot 0 = push-in from the facade, 1 = entrance (driveway, door, hall, kitchen), 2 = out to the pool.
// Frame numbers come from the manifest, so a shot can be swapped without touching the logic.
export function makeConfig(m) {
  const last = m.count - 1
  const T = (clip, sec) => {
    if (clip >= m.clips.length) return last
    const c = m.clips[clip]
    return Math.min(c[1], c[0] + sec * m.fps)
  }
  const A = (s) => T(1, s)
  const C = (s) => T(2, s)

  return {
    SPEED: 70, // frames per screen of scroll at normal pace
    // slow-motion stretches: the camera keeps moving, only slower, while a chapter is read
    ZONES: [
      { from: T(0, 0), to: T(0, 2.6), slow: 3.4 },
      { from: A(6.6), to: A(10.2), slow: 2.8 },
      { from: A(12.2), to: C(0.6), slow: 4 },
      { from: C(1.6), to: C(3.0), slow: 5.5 },
      { from: C(3.5), to: C(3.95), slow: 6 },
      { from: C(4.05), to: last, slow: 9, ramp: 8 },
    ],
    PANELS: {
      hero: { from: 0, to: T(0, 2.7), side: 'b' },
      door: { from: A(5.6), to: A(10.4), side: 'l' },
      kitchen: { from: A(11.6), to: C(1.0), side: 'l' },
      living: { from: C(1.3), to: C(3.25), side: 'r' },
      garden: { from: C(3.3), to: C(4.0), side: 'l' },
      view: { from: C(4.05), to: last + 999, side: 'c' },
    },
    SWEEPS: [
      { word: 'Arrival', from: T(0, 2.2), to: A(5.4) },
      { word: 'Come in', from: A(9.6), to: A(12.2) },
      { word: 'Outside', from: C(2.9), to: C(3.9) },
    ],
    // labels pinned into the picture: track = [frame, x, y] in image fractions
    SPOTS: [
      { title: 'Hand-stacked slate', sub: 'columns lit from below', side: 'l', from: A(2.6), to: A(5.2), track: [[A(2.6), 0.83, 0.27], [A(5.2), 0.96, 0.22]] },
      { title: 'Pivot door', sub: '3.4 m of smoked glass', side: 'r', from: A(6.4), to: A(9.4), track: [[A(6.4), 0.62, 0.42], [A(7.2), 0.66, 0.45], [A(9.4), 0.72, 0.5]] },
      { title: 'Black granite island', sub: '4.2 m, honed finish', side: 'r', from: A(12.4), to: A(14.9), track: [[A(12.4), 0.8, 0.66], [A(13), 0.76, 0.68], [A(14.9), 0.52, 0.72]] },
      { title: 'Brass pendants', sub: 'spun by hand in Guadalajara', side: 'r', from: A(13.2), to: A(14.9), track: [[A(13.2), 0.6, 0.36], [A(14.9), 0.56, 0.35]] },
      { title: 'Dining for twelve', sub: 'one slab of parota wood', side: 'r', from: C(1.8), to: C(2.8), track: [[C(1.8), 0.25, 0.58], [C(2.2), 0.19, 0.6], [C(2.8), 0.13, 0.67]] },
      { title: 'Infinity pool', sub: '22 m, heated to 29 °C', side: 'r', from: C(3.9), to: last + 999, track: [[C(3.9), 0.22, 0.79], [C(4.2), 0.24, 0.78], [last, 0.27, 0.79]] },
      { title: 'The Pacific', sub: 'facing west, for the sunset', side: 'l', from: C(4.0), to: last + 999, track: [[C(4.0), 0.7, 0.5], [last, 0.71, 0.5]] },
    ],
    CHAPTERS: [
      { name: 'Arrival', frame: 0 },
      { name: 'The door', frame: A(7.6) },
      { name: 'Kitchen', frame: A(13.6) },
      { name: 'Living room', frame: C(2.2) },
      { name: 'Garden & pool', frame: C(3.9) },
      { name: 'The view', frame: C(4.7) },
    ],
    GLOW: [
      { from: A(7.2), to: A(11), amount: 0.55 },
      { from: C(3.4), to: last + 999, amount: 0.75 },
    ],
    FX: [
      { from: 0, to: A(6.5), amount: 0.55, hue: 'fire' },
      { from: A(9.5), to: C(3), amount: 0.7, hue: 'warm' },
      { from: C(3.3), to: last + 999, amount: 1, hue: 'fire' },
    ],
  }
}
