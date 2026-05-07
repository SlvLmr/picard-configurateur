// Barrel file: load all catalog data from JSON.
// Decap CMS edits the JSON files directly; everything in the app
// imports from here.
import ambiancesData from './ambiances.json';
import doorsData from './doors.json';
import colorsData from './colors.json';
import handlesData from './handles.json';
import glassesData from './glasses.json';
import accessoriesData from './accessories.json';
import finishesData from './finishes.json';
import panelsData from './panels.json';

export const ambiances = ambiancesData.items;
export const doors = doorsData.items;
export const colors = colorsData.items;
export const handles = handlesData.items;
export const glasses = glassesData.items;
export const accessories = accessoriesData.items;
export const finishes = finishesData.items;
export const panels = panelsData.items;

// Category helper: ambiances are filtered using explicit forApartment /
// forHouse boolean flags, while every other catalog uses
// `compatibleDoorIds` (empty array = compatible with all).
function isCompatibleWith(doorId, item) {
  if (!item.compatibleDoorIds || item.compatibleDoorIds.length === 0) return true;
  return item.compatibleDoorIds.includes(doorId);
}

export function ambiancesForDoor(door) {
  if (!door) return ambiances;
  if (door.category === 'appartement') return ambiances.filter((a) => a.forApartment);
  if (door.category === 'maison') return ambiances.filter((a) => a.forHouse);
  return ambiances;
}

export function accessoriesForDoor(doorId) {
  return accessories.filter((a) => isCompatibleWith(doorId, a));
}

export function handlesForDoor(doorId) {
  return handles.filter((h) => isCompatibleWith(doorId, h));
}

export function glassesForDoor(doorId) {
  return glasses.filter((g) => isCompatibleWith(doorId, g));
}

export function panelsForDoor(doorId) {
  return panels.filter((p) => isCompatibleWith(doorId, p));
}
