// Line icons for the customer prototype (24px grid, stroke = currentColor).
const paths = {
  home: 'M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5',
  bag: 'M6 8h12l-1 13H7ZM9 8V6a3 3 0 0 1 6 0v2',
  retail: 'M3 9l1.5-5h15L21 9M3 9h18v1a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0ZM5 13v8h14v-8',
  browse: 'M4 5h7M4 10h5M4 15h4M16 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 21l-2.2-2.2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  bell: 'M6 16V9a6 6 0 0 1 12 0v7l2 2H4l2-2M10 21h4',
  cart: 'M2 4h3l2.4 11h11L21 7H6.2M10 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  down: 'm6 9 6 6 6-6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14',
  arrow: 'M5 12h14M14 7l5 5-5 5',
  back: 'M19 12H5M10 7l-5 5 5 5',
  chev: 'm9 5 7 7-7 7',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 11v6M12 7.5v.01',
  close: 'm6 6 12 12M6 18 18 6',
  leaf: 'M20 3C8 2 3 7 5 14s15 7 15-11ZM4 21 15 10',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'm5 12 4 4L19 6',
  clock: 'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  ticket: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4ZM14 7v10',
  walk: 'M13 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM9 22l3-8 3 3v5M7 12l3-5 4 1 2 4 3 1M12 14l-1-4',
  recycle: 'm8 7 4-5 4 5M12 2v6M19 10l3 7-7 1M22 17l-5-3M12 21H4l1-7M4 21l4-5',
  truck: 'M2 6h11v10H2zM13 9h4l3 3v4h-7M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  door: 'M5 21V3h11v18M3 21h18M13 12h.01',
  receipt: 'M5 3l2 1 2-1 3 1 3-1 2 1 2-1v18l-2-1-2 1-3-1-3 1-2-1-2 1ZM9 8h6M9 12h6M9 16h3',
  shell: 'M12 20c-5 0-8-3.5-8-8a8 8 0 0 1 16 0c0 4.5-3 8-8 8ZM12 20V7M12 20 7.5 8.5M12 20l4.5-11.5',
  card: 'M3 6h18v12H3ZM3 10h18M7 15h3',
  gift: 'M4 11h16v10H4ZM3 7h18v4H3ZM12 7v14M12 7S10 3 8 3.5 7.5 7 12 7Zm0 0s2-4 4-3.5S16.5 7 12 7Z',
  help: 'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
}

export default function CxIcon({ name, size = 22, fill = 'none', strokeWidth = 1.8, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.leaf}/></svg>
}
