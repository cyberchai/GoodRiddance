// Recorded runs of the Gemini application agent, one per opportunity, played back
// (and labelled as recorded) when a live run fails, e.g. with no network at a demo.
// Each is the tool calls Gemini made in a real run; to refresh one, run the app with
// `npm run dev` and copy the "[agent] recording" line from the browser console.
export const recordings = {
  'rise-awards': {
    model: 'gemini-3.8-flash',
    calls: [
      {"name":"read_application","args":{}},
      {"name":"read_restaurant_profile","args":{}},
      {"name":"read_shell_records","args":{}},
      {"name":"fill_field","args":{"field_id":"nominee","source":"Restaurant profile","value":"Harbor & Hearth"}},
      {"name":"fill_field","args":{"source":"Program page","field_id":"category","value":"Community Impact"}},
      {"name":"fill_field","args":{"field_id":"business","value":"Harbor & Hearth, 87 Atlantic Avenue, Brooklyn, NY 11201","source":"Restaurant profile"}},
      {"name":"fill_field","args":{"field_id":"impact","value":"In partnership with Billion Oyster Project, Harbor & Hearth diverts oyster shells from local landfills to restore New York Harbor reefs. Over a recent 12-week stretch across 36 pickups, our team recycled 2,454 pounds of shell, or about 1.2 tons, representing roughly 16,360 shells. These shells are transferred through the Fulton Fish Market Co-op to cure on Governors Island before returning to harbor waters. Based on restoration estimates, this effort provides new reef substrate for approximately 163,600 baby oysters, supporting marine biodiversity and water quality in our community.","source":"12 weeks of pickups"}},
      {"name":"fill_field","args":{"field_id":"why","value":"Harbor & Hearth demonstrates how an independent Brooklyn restaurant can turn everyday kitchen waste into meaningful environmental restoration. Our staff diligently collects and sorts shells every service, showing dedication to local marine ecology and setting an active example of sustainability for our guests and fellow New York restaurants.","source":"Restaurant profile"}},
      {"name":"fill_field","args":{"source":"Restaurant profile","value":"Jordan Ellis, jordan@harborandhearth.example, (718) 555-0142","field_id":"contact"}},
      {"name":"submit_for_review","args":{"note":"Please review the completed NYSRA RISE Awards nomination detailing our shell recycling partnership with Billion Oyster Project."}},
    ],
  },
  amny: {
    model: 'gemini-3.8-flash',
    calls: [
      {"name":"read_application","args":{}},
      {"name":"read_restaurant_profile","args":{}},
      {"name":"read_shell_records","args":{}},
      {"name":"fill_field","args":{"source":"Restaurant profile","field_id":"subject","value":"Brooklyn restaurant diverts over a ton of oyster shells for harbor reefs"}},
      {"name":"fill_field","args":{"source":"12 weeks of pickups","value":"Harbor & Hearth on Atlantic Avenue in Brooklyn is partnering with Billion Oyster Project to keep discarded oyster shells out of local landfills and put them back into New York Harbor. Over the past 12 weeks, our kitchen diverted 2,454 pounds of shell across 36 pickups, totaling 1.2 tons and approximately 16,360 shells. These shells are taken to the BOP shell transfer station at Hunts Point and cured on Governors Island, where each shell can provide a foundation for 10 to 20 baby oysters. That 12-week total translates to over 160,000 potential new oyster homes. We would love to share how an everyday dinner service contributes directly to local waterway restoration.","field_id":"pitch"}},
      {"name":"fill_field","args":{"field_id":"availability","value":"Tuesday to Sunday, 5 to 11 PM at 87 Atlantic Avenue, Brooklyn. Prior to opening is best for quiet kitchen photos and interviews.","source":"Restaurant profile"}},
      {"name":"fill_field","args":{"field_id":"contact","value":"Jordan Ellis, Restaurant Manager, jordan@harborandhearth.example, (718) 555-0142","source":"Restaurant profile"}},
      {"name":"submit_for_review","args":{"note":"Please review the draft amNY story pitch detailing your partnership with Billion Oyster Project and recent recycling milestones."}},
    ],
  },
}
