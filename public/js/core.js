// Core game constants and utilities

const CONFIG = {
    // Map settings
    MAP_WIDTH: 8,
    MAP_HEIGHT: 6,
    TILE_SIZE: 64,
    
    // Game balance
    BASE_MOVEMENT: 1500, // meters per day
    GOLD_PER_MINE: 500,  // gold per day per mine
    
    // Unit types (5 units as requested)
    UNITS: {
        PEASANT: {
            id: 'peasant',
            name: 'Peasant',
            icon: '👨‍🌾',
            cost: 10,
            attack: 1,
            defense: 1,
            damage: [1, 1],
            hp: 10,
            speed: 3,
            growth: 20
        },
        ARCHER: {
            id: 'archer',
            name: 'Archer',
            icon: '🏹',
            cost: 50,
            attack: 4,
            defense: 3,
            damage: [2, 3],
            hp: 15,
            speed: 4,
            growth: 10
        },
        GRIFFIN: {
            id: 'griffin',
            name: 'Griffin',
            icon: '🦅',
            cost: 200,
            attack: 8,
            defense: 7,
            damage: [3, 6],
            hp: 35,
            speed: 6,
            growth: 6
        },
        PALADIN: {
            id: 'paladin',
            name: 'Paladin',
            icon: '⚔️',
            cost: 500,
            attack: 12,
            defense: 12,
            damage: [8, 12],
            hp: 60,
            speed: 5,
            growth: 3
        },
        ANGEL: {
            id: 'angel',
            name: 'Angel',
            icon: '👼',
            cost: 2000,
            attack: 20,
            defense: 20,
            damage: [20, 30],
            hp: 200,
            speed: 9,
            growth: 1
        }
    }
};

// Utility functions
const Utils = {
    // Convert grid coordinates to pixel coordinates
    gridToPixel(col, row) {
        return {
            x: col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            y: row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
        };
    },
    
    // Calculate distance between two tiles
    distance(col1, row1, col2, row2) {
        return Math.sqrt(Math.pow(col2 - col1, 2) + Math.pow(row2 - row1, 2));
    },
    
    // Get adjacent tiles (4-directional for simplicity)
    getAdjacentTiles(col, row) {
        const adjacent = [];
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        
        for (const [dc, dr] of directions) {
            const nc = col + dc;
            const nr = row + dr;
            if (nc >= 0 && nc < CONFIG.MAP_WIDTH && nr >= 0 && nr < CONFIG.MAP_HEIGHT) {
                adjacent.push({ col: nc, row: nr });
            }
        }
        return adjacent;
    },
    
    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
};

console.log('Core loaded - Heroes Mini v1.0');
