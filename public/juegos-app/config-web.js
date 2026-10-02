window.JUEGOS_WEB = {
  "juegos": {
    "aterriza": {
      "label": "Aterriza el avión",
      "levels": [
        {
          "limitS": 20,
          "minS": 2,
          "landings": 3,
          "zone": 0.22,
          "speed": 0.5
        },
        {
          "limitS": 24,
          "minS": 3,
          "landings": 4,
          "zone": 0.15,
          "speed": 0.7
        },
        {
          "limitS": 28,
          "minS": 3,
          "landings": 5,
          "zone": 0.1,
          "speed": 0.9
        }
      ],
      "lives": {
        "start": 3,
        "minLevel3": 2
      }
    },
    "memoria": {
      "label": "Memoria de destinos",
      "levels": [
        {
          "limitS": 20,
          "minS": 2,
          "pairs": 4
        },
        {
          "limitS": 28,
          "minS": 4,
          "pairs": 6
        },
        {
          "limitS": 42,
          "minS": 7,
          "pairs": 10
        }
      ],
      "lives": null
    },
    "rompecabezas": {
      "label": "Rompecabezas postal",
      "levels": [
        {
          "limitS": 22,
          "minS": 4,
          "grid": 3
        },
        {
          "limitS": 42,
          "minS": 8,
          "grid": 4
        },
        {
          "limitS": 60,
          "minS": 12,
          "grid": 5
        }
      ],
      "lives": null
    },
    "corte": {
      "label": "Corte tropical",
      "levels": [
        {
          "limitS": 18,
          "minS": 4,
          "target": 13,
          "rate": 1.3,
          "storm": 0,
          "speed": 1.08
        },
        {
          "limitS": 22,
          "minS": 6,
          "target": 20,
          "rate": 1.8,
          "storm": 0.18,
          "speed": 1.2
        },
        {
          "limitS": 28,
          "minS": 8,
          "target": 24,
          "rate": 2.1,
          "storm": 0.22,
          "speed": 1.25
        }
      ],
      "lives": {
        "start": 3,
        "minLevel3": 2
      }
    },
    "torre": {
      "label": "Torre de maletas",
      "levels": [
        {
          "limitS": 25,
          "minS": 3,
          "floors": 8,
          "speed": 0.95,
          "perfect": 0.045
        },
        {
          "limitS": 30,
          "minS": 4,
          "floors": 11,
          "speed": 1.2,
          "perfect": 0.035
        },
        {
          "limitS": 35,
          "minS": 5,
          "floors": 13,
          "speed": 1.35,
          "perfect": 0.03
        }
      ],
      "lives": null
    },
    "maleta": {
      "label": "Sigue tu maleta",
      "levels": [
        {
          "limitS": 14,
          "minS": 3,
          "bags": 3,
          "swaps": 6,
          "swapMs": 600
        },
        {
          "limitS": 14,
          "minS": 4,
          "bags": 4,
          "swaps": 10,
          "swapMs": 450
        },
        {
          "limitS": 14,
          "minS": 4,
          "bags": 5,
          "swaps": 14,
          "swapMs": 350
        }
      ],
      "lives": null
    }
  }
};
