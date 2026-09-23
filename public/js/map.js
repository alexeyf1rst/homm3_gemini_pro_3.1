// Map generation and rendering

class GameMap {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tiles = [];
        this.mines = [];
        this.selectedTile = null;
        
        this.resize();
        this.generate();
        this.setupInteraction();
    }
    
    resize() {
        const container = document.getElementById('map-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Calculate tile size to fit map in container
        const tileWidth = width / CONFIG.MAP_WIDTH;
        const tileHeight = height / CONFIG.MAP_HEIGHT;
        CONFIG.TILE_SIZE = Math.min(tileWidth, tileHeight);
        
        this.canvas.width = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE;
        this.canvas.height = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE;
    }
    
    generate() {
        // Create grid
        for (let row = 0; row < CONFIG.MAP_HEIGHT; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < CONFIG.MAP_WIDTH; col++) {
                this.tiles[row][col] = {
                    col: col,
                    row: row,
                    terrain: 'grass',
                    object: null
                };
            }
        }
        
        // Place 2 mines at specific positions
        const minePositions = [
            { col: 1, row: 1 },
            { col: 6, row: 4 }
        ];
        
        for (const pos of minePositions) {
            this.tiles[pos.row][pos.col].object = {
                type: 'mine',
                subtype: 'gold',
                owned: false,
                owner: null
            };
            this.mines.push({
                col: pos.col,
                row: pos.row,
                owned: false,
                owner: null
            });
        }
    }
    
    setupInteraction() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const col = Math.floor(x / CONFIG.TILE_SIZE);
            const row = Math.floor(y / CONFIG.TILE_SIZE);
            
            if (col >= 0 && col < CONFIG.MAP_WIDTH && row >= 0 && row < CONFIG.MAP_HEIGHT) {
                this.selectTile(col, row);
            }
        });
    }
    
    selectTile(col, row) {
        this.selectedTile = { col, row };
        const tile = this.tiles[row][col];
        
        // Show unit panel if there's a recruit-able object
        if (tile.object && tile.object.type === 'mine') {
            UI.showUnitPanel(tile.object, col, row);
        } else {
            UI.hideUnitPanel();
        }
        
        this.render();
    }
    
    getTile(col, row) {
        if (col < 0 || col >= CONFIG.MAP_WIDTH || row < 0 || row >= CONFIG.MAP_HEIGHT) {
            return null;
        }
        return this.tiles[row][col];
    }
    
    isWalkable(col, row) {
        const tile = this.getTile(col, row);
        if (!tile) return false;
        // All tiles are walkable for now
        return true;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw tiles
        for (let row = 0; row < CONFIG.MAP_HEIGHT; row++) {
            for (let col = 0; col < CONFIG.MAP_WIDTH; col++) {
                this.drawTile(col, row);
            }
        }
        
        // Draw selection highlight
        if (this.selectedTile) {
            this.drawHighlight(this.selectedTile.col, this.selectedTile.row);
        }
    }
    
    drawTile(col, row) {
        const tile = this.tiles[row][col];
        const x = col * CONFIG.TILE_SIZE;
        const y = row * CONFIG.TILE_SIZE;
        const size = CONFIG.TILE_SIZE;
        
        // Draw terrain
        switch (tile.terrain) {
            case 'grass':
                this.ctx.fillStyle = '#2d5a27';
                break;
            case 'dirt':
                this.ctx.fillStyle = '#5c4033';
                break;
            default:
                this.ctx.fillStyle = '#2d5a27';
        }
        
        this.ctx.fillRect(x, y, size, size);
        
        // Draw grid border
        this.ctx.strokeStyle = '#1a1a2e';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
        
        // Draw objects
        if (tile.object) {
            this.drawObject(tile.object, x, y, size);
        }
        
        // Draw coordinates (debug)
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`${col},${row}`, x + 2, y + 12);
    }
    
    drawObject(obj, x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        if (obj.type === 'mine') {
            // Draw mine
            this.ctx.fillStyle = obj.owned ? '#4a4a6a' : '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Mine icon
            this.ctx.font = `${size * 0.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('⛏️', centerX, centerY);
            
            // Owner indicator
            if (obj.owned) {
                this.ctx.strokeStyle = obj.owner === 0 ? '#4169E1' : '#DC143C';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
        }
    }
    
    drawHighlight(col, row) {
        const x = col * CONFIG.TILE_SIZE;
        const y = row * CONFIG.TILE_SIZE;
        const size = CONFIG.TILE_SIZE;
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    }
    
    updateMineOwnership(mineIndex, heroId) {
        const mine = this.mines[mineIndex];
        if (mine) {
            mine.owned = true;
            mine.owner = heroId;
            const tile = this.tiles[mine.row][mine.col];
            if (tile && tile.object) {
                tile.object.owned = true;
                tile.object.owner = heroId;
            }
            this.render();
        }
    }
}

console.log('Map module loaded');
