const PARTY_IMAGES = [
  // Conferencia / charla
  'https://images.unsplash.com/photo-1540575467537-20152d1bdd53?auto=format&fit=crop&w=1280&q=80',
  // Festival al aire libre
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1280&q=80',
  // Concierto en vivo (escenario)
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1280&q=80',
  // Networking / business event
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1280&q=80',
  // Exposición / galería
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1280&q=80',
  // Taller / workshop
  'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1280&q=80',
  // Auditorio / teatro
  'https://images.unsplash.com/photo-1560523160-754a9e25c68f?auto=format&fit=crop&w=1280&q=80',
  // Gala / ceremonia
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1280&q=80',
];

export function getEventImage(eventId: number): string {
  return PARTY_IMAGES[eventId % PARTY_IMAGES.length];
}
