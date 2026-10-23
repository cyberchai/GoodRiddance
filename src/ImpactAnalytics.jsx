import { useState } from 'react'
import Icon from './Icon'
import './ImpactAnalytics.css'

const currency = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

export default function ImpactAnalytics({ range }) {
  const [chartView, setChartView] = useState('Donations')
  const sixMonths = range === 'Last 6 months'
  const donations = sixMonths ? [150, 200, 150, 250, 200, 250] : [100, 125, 75, 100]
  const taxBenefits = sixMonths ? [80, 60, 90, 70, 80, 100] : [25, 40, 35, 20]
  const labels = sixMonths ? ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] : ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']
  const amounts = chartView === 'Donations' ? donations : taxBenefits
  const organizations = [
    { name: 'Billion Oyster Project', purpose: 'Oyster reef restoration', amount: sixMonths ? 720 : 240, share: 60, color: '#527246', label: 'Illustrative donation' },
    { name: 'Neighborhood Compost Collective', purpose: 'Community composting', amount: sixMonths ? 300 : 100, share: 25, color: '#8b9d70', label: 'Fictional organization' },
    { name: 'Brooklyn Materials Co-op', purpose: 'Shared packaging collection', amount: sixMonths ? 180 : 60, share: 15, color: '#c4a578', label: 'Fictional organization' },
  ]
  const metrics = [
    { icon: 'recycle', value: sixMonths ? '12,000' : '4,000', unit: 'oysters', label: 'Oysters supported', detail: 'Illustrative restoration scenario' },
    { icon: 'drop', value: sixMonths ? '240,000' : '80,000', unit: 'gal/day', label: 'Water filtration potential', detail: 'Sample capacity, not measured filtration' },
    { icon: 'leaf', value: sixMonths ? '6' : '2', unit: 'species', label: 'Biodiversity', detail: 'Example habitat-support scenario' },
    { icon: 'shore', value: sixMonths ? '40' : '12', unit: 'ft of shoreline', label: 'Shoreline protection', detail: 'Illustrative habitat restoration extent' },
    { icon: 'leaf', value: sixMonths ? '172' : '40', unit: 'lbs CO₂e', label: 'CO₂ emissions avoided', detail: 'Sample total across recycling & donations' },
  ]

  return <section className="impact-analytics" aria-labelledby="giving-impact-title">
    <div className="giving-heading"><div><span className="eyebrow">GIVING BACK, GOING FURTHER</span><h2 id="giving-impact-title">Good for your community. Good for your business.</h2><p>Follow your giving, sample tax benefits, and the possibilities behind every contribution.</p></div><span className="sample-chip">Sample data</span></div>
    <div className="giving-stat-grid">
      <article className="giving-stat"><div className="giving-stat-label"><span>Government tax breaks received</span><Icon name="receipt" size={23}/></div><strong>{currency(sixMonths ? 480 : 120)}</strong><p>Illustrative benefits recorded · {range.toLowerCase()}</p><div className="tax-breakdown"><span>City-level benefit <b>{currency(sixMonths ? 300 : 75)}</b></span><span>State-level benefit <b>{currency(sixMonths ? 180 : 45)}</b></span></div><small>Fictional benefit records; no actual tax claim, eligibility, or filing is represented.</small></article>
      <article className="giving-stat donation-stat"><div className="giving-stat-label"><span>Total donated to organizations</span><Icon name="heart" size={23}/></div><strong>{currency(sixMonths ? 1200 : 400)}</strong><p>Across 3 organizations · {range.toLowerCase()}</p><div className="donation-summary"><div><span className="donation-summary-icon"><Icon name="recycle" size={24}/></span><span><b>{currency(sixMonths ? 720 : 240)} to Billion Oyster Project</b><small>60% of your sample contributions</small></span></div><div className="donation-share-track" aria-hidden="true"><span style={{width:'60%',background:'#527246'}}/><span style={{width:'25%',background:'#8b9d70'}}/><span style={{width:'15%',background:'#c4a578'}}/></div></div><small>All donations and receipts shown here are illustrative. No payment has been made.</small></article>
    </div>
    <div className="giving-detail-grid"><section className="panel giving-trend"><div className="giving-panel-heading"><div><h2>A growing habit of giving.</h2><p>Sample financial activity · USD</p></div><div className="giving-chart-tabs" role="group" aria-label="Financial chart metric">{['Donations','Tax benefits'].map(view=><button aria-pressed={chartView===view} className={chartView===view?'selected':''} key={view} onClick={()=>setChartView(view)}>{view}</button>)}</div></div><div className="giving-chart" role="img" aria-label={`Sample ${chartView.toLowerCase()} in US dollars: ${labels.map((label,index)=>`${label} ${amounts[index]}`).join(', ')}`}><div className="giving-gridlines" aria-hidden="true"><span>$300</span><span>$200</span><span>$100</span><span>$0</span></div><div className="giving-bars">{amounts.map((amount,index)=><div className="giving-bar-column" key={labels[index]}><span>{currency(amount)}</span><div className={`giving-bar ${chartView==='Tax benefits'?'tax-bar':''}`} style={{height:`${amount/300*180}px`}}/><small>{labels[index]}</small></div>)}</div></div><div className="giving-chart-caption"><i className={chartView==='Tax benefits'?'tax-key':''}/><span>{chartView} · sample data</span><strong>{currency(amounts.reduce((total,amount)=>total+amount,0))} total</strong></div></section>
      <section className="panel organization-panel"><div className="giving-panel-heading"><div><h2>Where your giving goes.</h2><p>Sample contributions by organization</p></div></div><ul className="organization-list">{organizations.map(org=><li key={org.name}><div className="organization-topline"><span className="organization-dot" style={{background:org.color}}/><strong>{org.name}</strong><b>{currency(org.amount)}</b></div><p>{org.purpose}</p><div className="organization-track"><span style={{width:`${org.share}%`,background:org.color}}/></div><div className="organization-footnote"><span>{org.label}</span><span>{org.share}% of giving</span></div></li>)}</ul></section></div>
    <section className="oyster-impact panel"><div className="oyster-impact-heading"><span className="oyster-impact-icon"><Icon name="recycle" size={28}/></span><div><span className="eyebrow">BILLION OYSTER PROJECT · ILLUSTRATIVE IMPACT</span><h2>A contribution with a ripple effect.</h2><p>A sample view of the environmental outcomes a restaurant could track alongside its giving.</p></div></div><div className="oyster-metrics">{metrics.map(metric=><article key={metric.label}><Icon name={metric.icon} size={21}/><strong>{metric.value}</strong><span className="impact-unit">{metric.unit}</span><h3>{metric.label}</h3><p>{metric.detail}</p></article>)}</div><div className="impact-methodology"><Icon name="help" size={17}/><p>All figures are independent sample scenarios, not verified Billion Oyster Project outcomes or donation-to-impact conversions. CO₂e is an example of emissions avoided across the restaurant’s activities, rather than a measured change in atmospheric CO₂ concentration.</p></div></section>
  </section>
}
