// Main game logic

class Game {
    constructor() {
        this.heroes = [];
        this.activeHeroIndex = 0;
        this.day = 1;
        this.totalGold = 1000; // Starting gold
        
        this.init();
    }
    
    init() {
        // Create 2 heroes as requested
        this.heroes = [
            new Hero(0, 'Sir Knight', '🤴', 0, 2, '#4169E1'), // Blue hero
            new Hero(1, 'Lady Mage', '🧙‍♀️', 7, 3, '#DC143C')  // Red hero
        ];
        
        // Give starting gold to both heroes
        this.heroes[0].addGold(500);
        this.heroes[1].addGold(500);
        
        UI.init();
        this.render();
        this.updateUI();
        
        console.log('Game initialized - 2 heroes, 2 mines, 5 unit types');
    }
    
    getActiveHero() {
        return this.heroes[this.activeHeroIndex];
    }
    
    swapActiveHero() {
        this.activeHeroIndex = (this.activeHeroIndex + 1) % this.heroes.length;
        this.render();
        this.updateUI();
    }
    
    endTurn() {
        // End turn for all heroes
        for (const hero of this.heroes) {
            hero.endTurn();
            
            // Collect mine income
            let mineIncome = 0;
            for (const mineIndex of hero.mines) {
                mineIncome += CONFIG.GOLD_PER_MINE;
            }
            if (mineIncome > 0) {
                hero.addGold(mineIncome);
                console.log(`${hero.name} collected ${mineIncome} gold from mines`);
            }
        }
        
        // Advance day
        this.day++;
        
        this.render();
        this.updateUI();
        UI.showMessage(`Day ${this.day} begins!`);
    }
    
    render() {
        // Clear and redraw map
        gameMap.render();
        
        // Draw heroes
        this.drawHeroes();
    }
    
    drawHeroes() {
        const ctx = gameMap.ctx;
        
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            const pos = Utils.gridToPixel(hero.col, hero.row);
            const size = CONFIG.TILE_SIZE * 0.8;
            
            // Hero circle background
            ctx.fillStyle = hero.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Border for active hero
            if (i === this.activeHeroIndex) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Hero icon
            ctx.font = `${size * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(hero.icon, pos.x, pos.y);
            
            // Army count badge
            const armyCount = hero.army.getTotalCount();
            if (armyCount > 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.beginPath();
                ctx.arc(pos.x + size * 0.3, pos.y + size * 0.3, size * 0.25, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = `${size * 0.25}px Arial`;
                ctx.fillText(armyCount.toString(), pos.x + size * 0.3, pos.y + size * 0.3);
            }
        }
    }
    
    updateUI() {
        const hero = this.getActiveHero();
        
        // Calculate total gold (sum of all heroes)
        const totalGold = this.heroes.reduce((sum, h) => sum + h.gold, 0);
        
        UI.updateTopBar(totalGold, this.day);
        UI.updateHeroInfo(hero);
    }
}

// Global game instance
let game = null;
let gameMap = null;

console.log('Game module loaded');
