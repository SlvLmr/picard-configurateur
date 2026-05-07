// Schema-driven collection definitions. Each collection points to a JSON
// file in the repo and lists fields the editor should render.
//
// Field types:
//   - 'string'    : single-line text
//   - 'text'      : multi-line text
//   - 'number'    : integer
//   - 'boolean'   : toggle
//   - 'select'    : dropdown with options
//   - 'image'     : image upload (only for ambiances)
//   - 'idList'    : list of integer IDs (e.g. compatibleDoorIds)
//   - 'hotspots'  : list of hotspot objects (specific to doors)

export const collections = [
  {
    key: 'doors',
    label: 'Modèles de portes',
    file: 'src/data/doors.json',
    idField: 'id',
    summary: (item) => `${item.name} · ${item.price}`,
    sublabel: (item) => (item.category === 'appartement' ? 'Appartement' : 'Maison'),
    fields: [
      { name: 'id', label: 'ID', type: 'number', required: true, hint: 'Identifiant unique numérique.' },
      { name: 'slug', label: 'Slug', type: 'string', required: true, hint: 'Ex. diamant-10' },
      { name: 'name', label: 'Nom', type: 'string', required: true },
      {
        name: 'category',
        label: "Catégorie d'usage",
        type: 'select',
        required: true,
        options: [
          { value: 'appartement', label: 'Appartement' },
          { value: 'maison', label: 'Maison' },
        ],
      },
      { name: 'range', label: 'Gamme', type: 'string' },
      { name: 'security', label: 'Étoiles A2P (1-5)', type: 'number', min: 1, max: 5 },
      { name: 'priceFrom', label: 'Prix de départ (€)', type: 'number' },
      { name: 'price', label: 'Affichage prix', type: 'string', hint: 'Ex. À partir de 4 990 €' },
      { name: 'desc', label: 'Description courte', type: 'text' },
      { name: 'icon', label: 'Icône (caractère)', type: 'string' },
      {
        name: 'panelStyle',
        label: 'Style de panneau',
        type: 'select',
        options: [
          { value: 'full_panel', label: 'Plein' },
          { value: 'horizontal_lines', label: 'Lignes horizontales' },
          { value: 'asymmetric_glass', label: 'Vitrage asymétrique' },
          { value: 'fortress', label: 'Renforcé' },
        ],
      },
      { name: 'hotspots', label: 'Hotspots techniques', type: 'hotspots' },
    ],
  },
  {
    key: 'ambiances',
    label: 'Ambiances',
    file: 'src/data/ambiances.json',
    idField: 'id',
    summary: (item) => `${item.name}`,
    sublabel: (item) => `${item.style} · ${item.type === 'exterior' ? 'Extérieur' : 'Intérieur'}`,
    fields: [
      { name: 'id', label: 'ID', type: 'number', required: true },
      { name: 'name', label: 'Nom', type: 'string', required: true },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'exterior', label: 'Extérieur (façade)' },
          { value: 'interior', label: 'Intérieur (hall, vestibule)' },
        ],
      },
      { name: 'style', label: 'Style', type: 'string', hint: 'Ex. Contemporain, Haussmannien…' },
      { name: 'forApartment', label: 'Compatible appartement', type: 'boolean' },
      { name: 'forHouse', label: 'Compatible maison', type: 'boolean' },
      { name: 'imageUrl', label: 'Image', type: 'image', hint: 'JPG/PNG, idéalement < 500 ko.' },
      { name: 'gradient', label: 'Gradient (fallback)', type: 'string' },
      { name: 'accent', label: 'Accent (fallback)', type: 'string' },
    ],
  },
  {
    key: 'colors',
    label: 'Couleurs (RAL)',
    file: 'src/data/colors.json',
    idField: 'id',
    summary: (item) => `${item.name}`,
    sublabel: (item) => `${item.ral} · ${item.hex}`,
    swatch: (item) => item.hex,
    fields: [
      { name: 'id', label: 'ID slug', type: 'string', required: true, hint: 'Ex. noir-9005' },
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'ral', label: 'Référence RAL', type: 'string', required: true },
      { name: 'hex', label: 'Hex (#RRGGBB)', type: 'string', required: true },
      { name: 'textOn', label: 'Couleur du texte sur fond', type: 'string' },
    ],
  },
  {
    key: 'panels',
    label: 'Panneaux',
    file: 'src/data/panels.json',
    idField: 'id',
    summary: (item) => item.name,
    sublabel: (item) => `${item.material} · ${item.family}`,
    fields: [
      { name: 'id', label: 'ID slug', type: 'string', required: true },
      { name: 'name', label: 'Nom', type: 'string', required: true },
      {
        name: 'material',
        label: 'Matériau',
        type: 'select',
        options: [
          { value: 'acier', label: 'Acier' },
          { value: 'alu', label: 'Aluminium' },
        ],
      },
      {
        name: 'family',
        label: 'Famille',
        type: 'select',
        options: [
          { value: 'melamine', label: 'Mélaminé standard' },
          { value: 'plaxe', label: 'Plaxé' },
          { value: 'contemporain', label: 'Contemporain' },
          { value: 'estampe', label: 'Estampé' },
          { value: 'moulure', label: 'Mouluré' },
        ],
      },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'compatibleDoorIds', label: 'Portes compatibles', type: 'idList', hint: 'Vide = toutes.' },
    ],
  },
  {
    key: 'handles',
    label: 'Poignées',
    file: 'src/data/handles.json',
    idField: 'id',
    summary: (item) => item.name,
    sublabel: (item) => `${item.style} · ${item.finish}`,
    fields: [
      { name: 'id', label: 'ID slug', type: 'string', required: true },
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'description', label: 'Description', type: 'text' },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { value: 'vertical', label: 'Verticale' },
          { value: 'lever', label: 'Béquille' },
          { value: 'bar', label: 'Barre de tirage' },
        ],
      },
      {
        name: 'finish',
        label: 'Finition métal',
        type: 'select',
        options: [
          { value: 'inox', label: 'Inox' },
          { value: 'gold', label: 'Or / Laiton' },
        ],
      },
      { name: 'compatibleDoorIds', label: 'Portes compatibles', type: 'idList', hint: 'Vide = toutes.' },
    ],
  },
  {
    key: 'glasses',
    label: 'Vitrages',
    file: 'src/data/glasses.json',
    idField: 'id',
    summary: (item) => item.name,
    sublabel: (item) => item.layout,
    fields: [
      { name: 'id', label: 'ID slug', type: 'string', required: true },
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'description', label: 'Description', type: 'text' },
      {
        name: 'layout',
        label: 'Disposition',
        type: 'select',
        options: [
          { value: 'none', label: 'Aucun' },
          { value: 'top_center', label: 'Hublot haut centré' },
          { value: 'vertical_side', label: 'Vertical latéral' },
          { value: 'multi_geo', label: 'Multi-géométrique' },
        ],
      },
      { name: 'compatibleDoorIds', label: 'Portes compatibles', type: 'idList', hint: 'Vide = toutes.' },
    ],
  },
  {
    key: 'accessories',
    label: 'Accessoires',
    file: 'src/data/accessories.json',
    idField: 'id',
    summary: (item) => item.name,
    sublabel: () => '',
    fields: [
      { name: 'id', label: 'ID slug', type: 'string', required: true },
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'compatibleDoorIds', label: 'Portes compatibles', type: 'idList', hint: 'Vide = toutes.' },
    ],
  },
  {
    key: 'finishes',
    label: 'Finitions',
    file: 'src/data/finishes.json',
    idField: 'id',
    summary: (item) => item.name,
    sublabel: () => '',
    fields: [
      { name: 'id', label: 'ID slug', type: 'string', required: true },
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'description', label: 'Description', type: 'text' },
    ],
  },
];

export function getCollection(key) {
  return collections.find((c) => c.key === key);
}

// Hotspots subschema (used when rendering a hotspot list inside a door)
export const hotspotFields = [
  { name: 'id', label: 'ID slug', type: 'string', required: true },
  { name: 'label', label: 'Étiquette courte', type: 'string', required: true },
  { name: 'x', label: 'Position X (%)', type: 'number', min: 0, max: 100 },
  { name: 'y', label: 'Position Y (%)', type: 'number', min: 0, max: 100 },
  { name: 'title', label: 'Titre', type: 'string', required: true },
  { name: 'description', label: 'Description', type: 'text' },
];
