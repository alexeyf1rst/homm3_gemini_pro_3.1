// Heroes of Might and Magic III - Remake
// Classic turn-based strategy game

class Game {
    constructor() {
        this.mapWidth = 8;
        this.mapHeight = 6;
        this.turn = 1;
        this.currentPlayer = 0;
        this.selectedHeroIndex = 0;
        
        // Resources
        this.resources = {
            gold: 1000,
            wood: 5,
            ore: 5
        };
        
        // 5 Unit types from HoMM3
        this.unitTypes = [
            { name: 'Peasant', icon: '👨‍🌾', hp: 10, attack: 1, defense: 1, damage: [1, 2], speed: 3 },
            { name: 'Archer', icon: '🏹', hp: 25, attack: 4, defense: 3, damage: [3, 4], speed: 5 },
            { name: 'Griffin', icon: '🦅', hp: 70, attack: 9, defense: 8, damage: [6, 10], speed: 7 },
            { name: 'Knight', icon: '🛡️', hp: 150, attack: 14, defense: 12, damage: [15, 20], speed: 6 },
            { name: 'Angel', icon: '👼', hp: 300, attack: 20, defense: 20, damage: [30, 50], speed: 9 }
        ];
        
        // 2 Heroes
        this.heroes = [
            {
                name: 'Sir Knight',
                portrait: '🛡️',
                class: 'Knight',
                attack: 5,
                defense: 5,
                power: 3,
                knowledge: 3,
                movement: 15,
                maxMovement: 15,
                x: 1,
                y: 2,
                army: [
                    { unitId: 3, count: 5 }, // 5 Knights
                    { unitId: 2, count: 10 }, // 10 Griffins
                    { unitId: 1, count: 25 }  // 25 Archers
                ]
            },
            {
                name: 'Lady Mage',
                portrait: '🔮',
                class: 'Mage',
                attack: 3,
                defense: 3,
                power: 6,
                knowledge: 6,
                movement: 17,
                maxMovement: 17,
                x: 6,
                y: 3,
                army: [
                    { unitId: 4, count: 2 }, // 2 Angels
                    { unitId: 3, count: 8 }, // 8 Knights
                    { unitId: 1, count: 30 }  // 30 Archers
                ]
            }
        ];
        
        // 2 Mines (Gold mines)
        this.mines = [
            { x: 2, y: 1, type: 'gold', owner: null, production: 500 },
            { x: 5, y: 4, type: 'gold', owner: null, production: 500 }
        ];
        
        // Map terrain (0 = grass, 1 = dirt, 2 = water)
        this.map = [
            [0, 0, 1, 1, 0, 0, 1, 1],
            [0, 0, 0, 1, 1, 0, 0, 1],
            [0, 0, 0, 0, 1, 1, 0, 0],
            [1, 0, 0, 0, 0, 1, 1, 0],
            [1, 1, 0, 0, 0, 0, 1, 0],
            [1, 1, 1, 0, 0, 0, 0, 0]
        ];
        
        this.init();
    }
    
    init() {
        this.renderMap();
        this.updateUI();
        this.setupControls();
        this.showNotification('Welcome to Heroes III Remake!');
    }
    
    renderMap() {
        const mapContainer = document.getElementById('adventure-map');
        mapContainer.innerHTML = '';
        mapContainer.style.gridTemplateColumns = `repeat(${this.mapWidth}, 60px)`;
        mapContainer.style.gridTemplateRows = `repeat(${this.mapHeight}, 60px)`;
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const cell = document.createElement('div');
                cell.className = 'hex-cell';
                
                // Terrain type
                if (this.map[y][x] === 0) {
                    cell.classList.add('grass');
                } else if (this.map[y][x] === 1) {
                    cell.classList.add('dirt');
                } else if (this.map[y][x] === 2) {
                    cell.classList.add('water');
                }
                
                // Check for hero
                const hero = this.heroes.find(h => h.x === x && h.y === y);
                if (hero) {
                    cell.textContent = hero.portrait;
                    cell.dataset.hero = this.heroes.indexOf(hero);
                }
                
                // Check for mine
                const mine = this.mines.find(m => m.x === x && m.y === y);
                if (mine) {
                    const mineIndicator = document.createElement('span');
                    mineIndicator.className = 'mine-owned';
                    mineIndicator.textContent = mine.owner !== null ? '👑' : '⛏️';
                    cell.appendChild(mineIndicator);
                    
                    if (mine.owner !== null) {
                        cell.style.boxShadow = 'inset 0 0 20px rgba(255, 215, 0, 0.5)';
                    }
                }
                
                cell.addEventListener('click', () => this.handleCellClick(x, y));
                mapContainer.appendChild(cell);
            }
        }
    }
    
    handleCellClick(x, y) {
        const hero = this.heroes[this.selectedHeroIndex];
        
        // Check if clicking on a hero
        const clickedHero = this.heroes.find(h => h.x === x && h.y === y);
        if (clickedHero) {
            this.selectedHeroIndex = this.heroes.indexOf(clickedHero);
            this.updateUI();
            this.renderMap();
            return;
        }
        
        // Try to move
        const distance = Math.abs(x - hero.x) + Math.abs(y - hero.y);
        if (distance <= hero.movement && this.map[y][x] !== 2) {
            // Move hero
            hero.x = x;
            hero.y = y;
            hero.movement -= distance;
            
            // Check for mine capture
            const mine = this.mines.find(m => m.x === x && m.y === y);
            if (mine && mine.owner === null) {
                mine.owner = this.currentPlayer;
                this.showNotification(`${hero.name} captured a Gold Mine!`);
            }
            
            this.renderMap();
            this.updateUI();
        }
    }
    
    updateUI() {
        const hero = this.heroes[this.selectedHeroIndex];
        
        // Update hero info
        document.getElementById('hero-portrait').textContent = hero.portrait;
        document.getElementById('hero-name').textContent = hero.name;
        document.getElementById('hero-attack').textContent = hero.attack;
        document.getElementById('hero-defense').textContent = hero.defense;
        document.getElementById('hero-power').textContent = hero.power;
        document.getElementById('hero-knowledge').textContent = hero.knowledge;
        document.getElementById('hero-movement').textContent = `${hero.movement}/${hero.maxMovement}`;
        
        // Update army
        const armyContainer = document.getElementById('army-container');
        armyContainer.innerHTML = '';
        hero.army.forEach(slot => {
            if (slot.count > 0) {
                const unit = this.unitTypes[slot.unitId];
                const armySlot = document.createElement('div');
                armySlot.className = 'army-slot';
                armySlot.innerHTML = `
                    <span class="unit-icon">${unit.icon}</span>
                    <span style="color: #c9b896; flex: 1;">${unit.name}</span>
                    <span class="unit-count">${slot.count}</span>
                `;
                armyContainer.appendChild(armySlot);
            }
        });
        
        // Update hero switcher
        const switcher = document.getElementById('hero-switcher');
        switcher.innerHTML = '';
        this.heroes.forEach((h, index) => {
            const btn = document.createElement('button');
            btn.className = `hero-btn ${index === this.selectedHeroIndex ? 'active' : ''}`;
            btn.textContent = h.portrait;
            btn.onclick = () => {
                this.selectedHeroIndex = index;
                this.updateUI();
                this.renderMap();
            };
            switcher.appendChild(btn);
        });
        
        // Update mines
        const minesContainer = document.getElementById('mines-container');
        minesContainer.innerHTML = '';
        const playerMines = this.mines.filter(m => m.owner === this.currentPlayer);
        if (playerMines.length === 0) {
            minesContainer.innerHTML = '<div style="color: #c9b896; text-align: center; padding: 10px;">No mines owned</div>';
        } else {
            playerMines.forEach(mine => {
                const mineDiv = document.createElement('div');
                mineDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 3px; margin-bottom: 3px;';
                mineDiv.innerHTML = `
                    <span>⛏️</span>
                    <span style="color: #ffd700;">Gold Mine</span>
                    <span style="color: #c9b896; margin-left: auto;">+${mine.production} gold/day</span>
                `;
                minesContainer.appendChild(mineDiv);
            });
        }
        
        // Update resources
        document.getElementById('gold').textContent = this.resources.gold;
        document.getElementById('wood').textContent = this.resources.wood;
        document.getElementById('ore').textContent = this.resources.ore;
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            const hero = this.heroes[this.selectedHeroIndex];
            let newX = hero.x;
            let newY = hero.y;
            
            switch(e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    newY = Math.max(0, hero.y - 1);
                    break;
                case 'arrowdown':
                case 's':
                    newY = Math.min(this.mapHeight - 1, hero.y + 1);
                    break;
                case 'arrowleft':
                case 'a':
                    newX = Math.max(0, hero.x - 1);
                    break;
                case 'arrowright':
                case 'd':
                    newX = Math.min(this.mapWidth - 1, hero.x + 1);
                    break;
                default:
                    return;
            }
            
            if (newX !== hero.x || newY !== hero.y) {
                const distance = Math.abs(newX - hero.x) + Math.abs(newY - hero.y);
                if (distance <= hero.movement && this.map[newY][newX] !== 2) {
                    hero.x = newX;
                    hero.y = newY;
                    hero.movement -= distance;
                    
                    // Check for mine capture
                    const mine = this.mines.find(m => m.x === newX && m.y === newY);
                    if (mine && mine.owner === null) {
                        mine.owner = this.currentPlayer;
                        this.showNotification(`${hero.name} captured a Gold Mine!`);
                    }
                    
                    this.renderMap();
                    this.updateUI();
                }
            }
        });
    }
    
    switchHero() {
        this.selectedHeroIndex = (this.selectedHeroIndex + 1) % this.heroes.length;
        this.updateUI();
        this.renderMap();
    }
    
    endTurn() {
        // Collect gold from mines
        const playerMines = this.mines.filter(m => m.owner === this.currentPlayer);
        const goldIncome = playerMines.reduce((sum, mine) => sum + mine.production, 0);
        this.resources.gold += goldIncome;
        
        // Reset hero movement
        this.heroes.forEach(hero => {
            hero.movement = hero.maxMovement;
        });
        
        this.turn++;
        this.showNotification(`Day ${this.turn} - Income: ${goldIncome} gold`);
        this.updateUI();
    }
    
    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.display = 'block';
        
        // Remove animation class and re-add to restart animation
        notification.style.animation = 'none';
        notification.offsetHeight; // Trigger reflow
        notification.style.animation = 'fadeInOut 2s ease-in-out';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }
}

// Initialize game
const game = new Game();
