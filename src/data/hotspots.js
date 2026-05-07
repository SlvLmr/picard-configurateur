// Hotspot positions are expressed as percentages of the door bounding box
// (0,0 = top-left of the door, 100,100 = bottom-right). The DoorCanvas
// translates these to absolute pixels.
export const hotspots = [
  {
    id: 'handle',
    label: 'Poignée',
    x: 86,
    y: 52,
    title: 'Poignée signature',
    description:
      "Conçue pour un geste précis et silencieux, en finition inox brossé ou or vintage selon votre choix.",
  },
  {
    id: 'lock',
    label: 'Serrure A2P',
    x: 86,
    y: 60,
    title: 'Serrure A2P***',
    description:
      "Cylindre certifié A2P 3 étoiles, plus haut niveau de résistance contre l'effraction et le crochetage.",
  },
  {
    id: 'multipoint',
    label: 'Verrouillage 7 points',
    x: 12,
    y: 50,
    title: 'Verrouillage 7 points',
    description:
      "Sept points d'ancrage répartis sur toute la hauteur, pour une fermeture sans faille de la porte.",
  },
  {
    id: 'glass',
    label: 'Vitrage SP10',
    x: 50,
    y: 25,
    title: 'Vitrage feuilleté SP10',
    description:
      "Verre feuilleté de sécurité SP10, résistant aux impacts répétés tout en laissant passer la lumière.",
  },
  {
    id: 'seals',
    label: 'Joints isolants',
    x: 50,
    y: 92,
    title: 'Joints d\'étanchéité',
    description:
      "Triple joint périphérique : isolation thermique, acoustique et coupe-vent pour un confort intégral.",
  },
];
