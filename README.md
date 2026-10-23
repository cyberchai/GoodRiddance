# DoorDash Merchant Portal · GoodRiddance

A React/Vite frontend prototype of a GoodRiddance integration within the DoorDash merchant experience.

## Run locally

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run build`

## Pages

- **Menu:** six sample dishes, category/search controls, session-only editing and availability, food-waste and packaging opportunities.
- **Recurring pickup:** editable schedule saved to this browser’s localStorage. No pickup is booked.
- **Analytics:** explicitly labeled sample waste charts, period comparisons, government tax-benefit records, donation totals and organization breakdowns, financial activity charts, and an illustrative Billion Oyster Project impact panel for oysters, water filtration, biodiversity, shoreline protection, and CO₂e emissions avoided. Financial and environmental figures are independent mock scenarios, not actual benefits, payments, verified outcomes, or conversion factors.
- **Discovery:** simulated menu/photo analysis, material filters, opportunity preparation guidance, an illustrated neighborhood map, selectable fictional collaborators, downloadable resource plans, editable email drafts, and simulated outreach.

Discovery photos use local object URLs and are never transmitted. Results are preset examples, not AI-generated findings. Map locations and restaurant names are fictional. Billion Oyster Project is an illustrative resource; participation and contact details are not verified. Drafts and resource plans remain in React state across page navigation and reset on reload. No emails are sent.

The app uses existing dependencies, local illustrations, and locally hosted DoorDash TT Norms font files. The DoorDash logo was downloaded from the image URL supplied for this prototype. There are no AI, email, Google Maps, backend, or deployment integrations.
