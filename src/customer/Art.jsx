// Flat drawn placeholders for food photos and category icons. No photos or brand assets.

const plates = {
  oysters: '#d9e3e1', clams: '#e6e0d3', chowder: '#efe3cf', bisque: '#f1ddd0', fish: '#eadfc8',
  lobster: '#f3e2d6', mussels: '#dfe1e6', fries: '#f4e7c9', salad: '#e2ecd8', pasta: '#f1e6d2',
  dumplings: '#f2e9dc', bread: '#efe2cc',
}

function Dish({ kind }) {
  switch (kind) {
    case 'oysters':
    case 'clams':
      return [0, 1, 2, 3, 4, 5].map(i => {
        const x = 52 + (i % 3) * 28, y = 38 + Math.floor(i / 3) * 26
        return <g key={i} transform={`translate(${x} ${y}) rotate(${i * 37 - 40})`}>
          <ellipse rx="14" ry="10" fill={kind === 'oysters' ? '#7d8f8c' : '#b6a588'}/>
          <ellipse rx="10.5" ry="7" fill={kind === 'oysters' ? '#f1ece2' : '#efe5d2'}/>
          <ellipse rx="6" ry="4" fill={kind === 'oysters' ? '#c9b998' : '#e3b9a0'}/>
        </g>
      })
    case 'mussels':
      return [0, 1, 2, 3, 4].map(i => <ellipse key={i} cx={56 + i * 12} cy={50 + (i % 2) * 8} rx="11" ry="6"
        transform={`rotate(${i * 30 - 50} ${56 + i * 12} ${50 + (i % 2) * 8})`} fill="#2f3440" stroke="#f3a55b" strokeWidth="1.5"/>)
    case 'chowder':
    case 'bisque':
      return <>
        <circle cx="80" cy="50" r="27" fill={kind === 'chowder' ? '#f5eedf' : '#e48b5c'}/>
        {[0, 1, 2, 3].map(i => <rect key={i} x={68 + (i % 2) * 14} y={40 + Math.floor(i / 2) * 12} width="8" height="8" rx="2" fill="#c99553"/>)}
        <circle cx="90" cy="60" r="2" fill="#5c8a4a"/><circle cx="72" cy="58" r="2" fill="#5c8a4a"/>
      </>
    case 'fish':
      return <>
        <rect x="52" y="38" width="44" height="22" rx="11" fill="#d9a24f" transform="rotate(-12 74 49)"/>
        {[0, 1, 2, 3, 4].map(i => <rect key={i} x={86 + i * 5} y={46 + (i % 2) * 6} width="4" height="22" rx="2" fill="#f0c86b" transform={`rotate(${i * 9 - 18} ${88 + i * 5} 57)`}/>)}
      </>
    case 'lobster':
      return <>
        <rect x="50" y="42" width="60" height="20" rx="10" fill="#e9c08a"/>
        {[0, 1, 2, 3].map(i => <circle key={i} cx={60 + i * 13} cy="45" r="7" fill="#e5674a"/>)}
        <rect x="56" y="38" width="48" height="4" rx="2" fill="#8fbf6d"/>
      </>
    case 'fries':
      return [0, 1, 2, 3, 4, 5, 6].map(i => <rect key={i} x={62 + i * 6} y={30 + (i % 3) * 4} width="5" height="34" rx="2" fill="#f0c45a" transform={`rotate(${i * 6 - 18} ${64 + i * 6} 62)`}/>)
    case 'salad':
      return [0, 1, 2, 3, 4, 5].map(i => <ellipse key={i} cx={64 + (i % 3) * 16} cy={42 + Math.floor(i / 3) * 14} rx="11" ry="7" fill={i % 2 ? '#a8c97f' : '#e9c46a'}/>)
    case 'pasta':
      return <>
        {[0, 1, 2, 3].map(i => <ellipse key={i} cx="80" cy="50" rx={24 - i * 5} ry={16 - i * 3} fill="none" stroke="#e8c37a" strokeWidth="4"/>)}
        <ellipse cx="66" cy="40" rx="6" ry="4" fill="#b6a588"/><ellipse cx="96" cy="58" rx="6" ry="4" fill="#b6a588"/>
      </>
    case 'dumplings':
      return [0, 1, 2, 3].map(i => <g key={i} transform={`translate(${62 + (i % 2) * 34} ${38 + Math.floor(i / 2) * 26})`}>
        <ellipse rx="15" ry="11" fill="#f7f1e6" stroke="#e1d4bd" strokeWidth="1.5"/>
        <path d="M-6 -9q6 6 12 0" stroke="#e1d4bd" strokeWidth="1.5" fill="none"/>
      </g>)
    case 'bread':
    default:
      return [0, 1, 2].map(i => <ellipse key={i} cx={60 + i * 20} cy="50" rx="13" ry="20" fill="#d6a05c" stroke="#b97d3d" strokeWidth="2"/>)
  }
}

export function FoodArt({ kind, className = '' }) {
  return <svg className={`cx-food-art ${className}`} viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${kind} placeholder`}>
    <rect width="160" height="100" fill={plates[kind] || '#eee'}/>
    <ellipse cx="80" cy="52" rx="48" ry="40" fill="#fbfaf6" opacity=".9"/>
    <ellipse cx="80" cy="52" rx="40" ry="32" fill="none" stroke="#e7e3d8"/>
    <Dish kind={kind}/>
  </svg>
}

const cats = {
  Grocery: <><path d="M14 20h28l-3 26H17Z" fill="#6fa8dc"/><circle cx="22" cy="16" r="7" fill="#f6c343"/><rect x="30" y="8" width="8" height="14" rx="2" fill="#8bc34a"/></>,
  Alcohol: <><path d="M18 10h20q0 16-10 18-10-2-10-18Z" fill="#b3263e"/><rect x="27" y="28" width="2" height="14" fill="#9aa"/><rect x="21" y="42" width="14" height="3" rx="1.5" fill="#9aa"/></>,
  Pets: <><circle cx="28" cy="34" r="9" fill="#5b7fd6"/>{[[17, 22], [24, 15], [32, 15], [39, 22]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4.5" fill="#5b7fd6"/>)}</>,
  Beauty: <><rect x="22" y="24" width="12" height="22" rx="2" fill="#333"/><path d="M23 24V14l10-4v14Z" fill="#d6304a"/></>,
  Convenience: <><path d="M16 10h24l-2 36H18Z" fill="#7cb342"/><rect x="20" y="20" width="16" height="10" rx="2" fill="#f6c343"/></>,
  Seafood: <><ellipse cx="28" cy="30" rx="16" ry="12" fill="#7d8f8c"/><ellipse cx="28" cy="30" rx="12" ry="8.5" fill="#f1ece2"/><ellipse cx="28" cy="30" rx="6" ry="4" fill="#c9b998"/></>,
  Sushi: <><rect x="12" y="26" width="32" height="14" rx="7" fill="#fafafa" stroke="#ddd"/><path d="M12 28q16-14 32 0" fill="#f0805a"/></>,
  Chinese: <><path d="M12 30q16 18 32 0Z" fill="#ffffff" stroke="#ccc"/><path d="M14 30q14-22 28 0" fill="#f3e3c3"/><rect x="34" y="8" width="2" height="22" fill="#a1887f" transform="rotate(20 35 19)"/></>,
  Desserts: <><path d="M12 40 28 16l16 24Z" fill="#f7c59f"/><path d="M14 37h28" stroke="#c9667a" strokeWidth="4"/><circle cx="28" cy="14" r="4" fill="#d6304a"/></>,
  Subs: <><rect x="8" y="24" width="40" height="14" rx="7" fill="#d9a24f"/><rect x="10" y="30" width="36" height="4" fill="#8bc34a"/><rect x="10" y="26" width="36" height="3" fill="#e57373"/></>,
  Cookies: <><circle cx="28" cy="28" r="16" fill="#d8954e"/>{[[22, 22], [33, 25], [26, 33], [35, 34], [20, 30]].map(([x, y]) => <circle key={x + y} cx={x} cy={y} r="2.2" fill="#5d3a1a"/>)}</>,
}

export function CategoryArt({ name }) {
  return <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">{cats[name]}</svg>
}
