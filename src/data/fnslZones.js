// Zones FNSL — statut "confirme" si vérifié auprès d'une source officielle
// (bio Instagram, compétition référencée), "provisoire" sinon.
// Corrige librement les départements si la FNSL confirme un découpage différent.

export const fnslZones = {
  "Grand Ouest": {
    color: "#4a90d9",
    statut: "confirme",
    source: "Bio officielle @fnsl_grand_ouest (Bretagne, Normandie, Pays de la Loire)",
    departments: [
      "22", "29", "35", "56", // Bretagne
      "14", "27", "50", "61", "76", // Normandie
      "44", "49", "53", "72", "85", // Pays de la Loire
    ],
  },
  "Sud Est": {
    color: "#ff4d2e",
    statut: "provisoire",
    source: "Partiellement confirmé (compétitions à Nice, Lyon, Annecy/Poisy)",
    departments: [
      "04", "05", "06", "13", "83", "84", // Provence-Alpes-Côte d'Azur
      "01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74", // Auvergne-Rhône-Alpes
    ],
  },
  "Nord Est": {
    color: "#4cc995",
    statut: "provisoire",
    source: "Partiellement confirmé (compétition à Mulhouse, Grand Est)",
    departments: [
      "08", "10", "51", "52", "54", "55", "57", "67", "68", "88", // Grand Est
      "21", "25", "39", "58", "70", "71", "89", "90", // Bourgogne-Franche-Comté
    ],
  },
  "Centre": {
    color: "#9b7fd4",
    statut: "provisoire",
    source: "Précisé par la FNSL Sud Est : la zone FNSL Centre couvre aussi l'Île-de-France et les Hauts-de-France, en plus du Centre-Val de Loire",
    departments: [
      "18", "28", "36", "37", "41", "45", // Centre-Val de Loire
      "75", "77", "78", "91", "92", "93", "94", "95", // Île-de-France
      "02", "59", "60", "62", "80", // Hauts-de-France
    ],
  },
  "Sud Ouest": {
    color: "#ffb703",
    statut: "provisoire",
    source: "Aucun département confirmé - regroupement provisoire sur Nouvelle-Aquitaine + Occitanie",
    departments: [
      "16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87", // Nouvelle-Aquitaine
      "09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82", // Occitanie
    ],
  },
};

// Départements volontairement non attribués : Corse.
// Leur zone FNSL n'a pas été identifiée avec certitude - ils restent "à confirmer"
// plutôt que rattachés arbitrairement à une zone voisine.
export function zoneForDepartment(code) {
  for (const [name, zone] of Object.entries(fnslZones)) {
    if (zone.departments.includes(code)) {
      return { name, ...zone };
    }
  }
  return null;
}
