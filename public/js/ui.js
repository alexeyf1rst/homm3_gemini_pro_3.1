// UI Management

const UI = {
    selectedMineIndex: null,
    
    init() {
        // Setup button listeners
        document.getElementById('btn-end-turn').addEventListener('click', () => game.endTurn());
        document.getElementById('btn-swap-hero').addEventListener('click', () => game.swapActiveHero());
        document.getElementById('btn-recruit').addEventListener('click', () => this.recruitUnit());
        document.getElementById('btn-close-unit').addEventListener('click', () => this.hideUnitPanel());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    },
    
    updateTopBar(gold, day) {
        document.getElementById('gold-display').textContent = `💰 ${Utils.formatNumber(gold)}`;
        document.getElementById('day-display').textContent = `📅 Day ${day}`;
    },
    
    updateHeroInfo(hero) {
        const portrait = document.getElementById('active-hero-portrait');
        portrait.textContent = hero.icon;
        portrait.style.borderColor = hero.color;
        
        document.getElementById('hero-name').textContent = hero.name;
        document.getElementById('hero-army').textContent = `Army: ${hero.army.getTotalCount()} units`;
        document.getElementById('hero-movement').textContent = 
            `Movement: ${Math.floor(hero.movement)}/${hero.maxMovement}m`;
    },
    
    showUnitPanel(mineObject, col, row) {
        const panel = document.getElementById('unit-panel');
        const details = document.getElementById('unit-details');
        const mineIndex = gameMap.mines.findIndex(m => m.col === col && m.row === row);
        
        this.selectedMineIndex = mineIndex;
        
        if (mineObject.owned) {
            const hero = game.getActiveHero();
            const dailyIncome = CONFIG.GOLD_PER_MINE;
            
            details.innerHTML = `
                <h3>⛏️ Gold Mine</h3>
                <p><strong>Owner:</strong> ${hero.name}</p>
                <p><strong>Daily Income:</strong> ${dailyIncome} gold</p>
                <p style="color: #8B4513; margin-top: 10px;">Already owned - collect income at turn end</p>
            `;
            document.getElementById('btn-recruit').style.display = 'none';
        } else {
            details.innerHTML = `
                <h3>⛏️ Unclaimed Mine</h3>
                <p>Claim this mine to receive ${CONFIG.GOLD_PER_MINE} gold per day</p>
                <p style="color: #FFD700; margin-top: 10px;">Click "Claim" to take ownership</p>
            `;
            document.getElementById('btn-recruit').textContent = 'Claim Mine';
            document.getElementById('btn-recruit').style.display = 'block';
        }
        
        panel.classList.remove('hidden');
    },
    
    hideUnitPanel() {
        document.getElementById('unit-panel').classList.add('hidden');
        this.selectedMineIndex = null;
    },
    
    recruitUnit() {
        if (this.selectedMineIndex !== null) {
            const hero = game.getActiveHero();
            const mine = gameMap.mines[this.selectedMineIndex];
            
            if (!mine.owned) {
                // Claim the mine
                hero.claimMine(this.selectedMineIndex);
                this.hideUnitPanel();
                game.updateUI();
            }
        }
    },
    
    handleKeyPress(e) {
        const hero = game.getActiveHero();
        let moved = false;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                moved = hero.moveTo(hero.col, hero.row - 1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                moved = hero.moveTo(hero.col, hero.row + 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                moved = hero.moveTo(hero.col - 1, hero.row);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                moved = hero.moveTo(hero.col + 1, hero.row);
                break;
            case ' ':
                game.endTurn();
                e.preventDefault();
                return;
        }
        
        if (moved) {
            game.render();
            game.updateUI();
            e.preventDefault();
        }
    },
    
    showMessage(text, duration = 2000) {
        // Simple console message for now
        console.log(`[UI] ${text}`);
    }
};

console.log('UI module loaded');
