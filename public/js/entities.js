// Game entities: Heroes and Army

class Army {
    constructor() {
        this.units = {}; // { unitId: count }
        // Start with some peasants
        this.units['peasant'] = 20;
    }
    
    addUnit(unitId, count) {
        if (!this.units[unitId]) {
            this.units[unitId] = 0;
        }
        this.units[unitId] += count;
    }
    
    removeUnit(unitId, count) {
        if (this.units[unitId]) {
            this.units[unitId] = Math.max(0, this.units[unitId] - count);
            if (this.units[unitId] === 0) {
                delete this.units[unitId];
            }
        }
    }
    
    getTotalCount() {
        return Object.values(this.units).reduce((sum, count) => sum + count, 0);
    }
    
    getUnitCount(unitId) {
        return this.units[unitId] || 0;
    }
    
    isEmpty() {
        return this.getTotalCount() === 0;
    }
    
    getStrongestUnit() {
        let strongest = null;
        let maxPower = 0;
        
        for (const [unitId, count] of Object.entries(this.units)) {
            if (count > 0) {
                const unit = CONFIG.UNITS[unitId.toUpperCase()];
                const power = (unit.attack + unit.defense) * count;
                if (power > maxPower) {
                    maxPower = power;
                    strongest = { unitId, count, unit };
                }
            }
        }
        return strongest;
    }
}

class Hero {
    constructor(id, name, icon, startX, startY, color) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.color = color;
        this.col = startX;
        this.row = startY;
        this.army = new Army();
        this.movement = CONFIG.BASE_MOVEMENT;
        this.maxMovement = CONFIG.BASE_MOVEMENT;
        this.gold = 0;
        this.mines = []; // indices of owned mines
    }
    
    canMove(distance) {
        return this.movement >= distance;
    }
    
    move(dx, dy) {
        const distance = Math.sqrt(dx * dx + dy * dy) * 100; // 100m per tile
        if (this.canMove(distance)) {
            this.col += dx;
            this.row += dy;
            this.movement -= distance;
            return true;
        }
        return false;
    }
    
    moveTo(col, row) {
        const dx = col - this.col;
        const dy = row - this.row;
        const distance = Math.sqrt(dx * dx + dy * dy) * 100;
        
        if (this.canMove(distance)) {
            this.col = col;
            this.row = row;
            this.movement -= distance;
            return true;
        }
        return false;
    }
    
    endTurn() {
        this.movement = this.maxMovement;
    }
    
    addGold(amount) {
        this.gold += amount;
    }
    
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
    
    claimMine(mineIndex) {
        if (!this.mines.includes(mineIndex)) {
            this.mines.push(mineIndex);
            gameMap.updateMineOwnership(mineIndex, this.id);
            return true;
        }
        return false;
    }
    
    recruit(unitId, count) {
        const unit = CONFIG.UNITS[unitId.toUpperCase()];
        const cost = unit.cost * count;
        
        if (this.spendGold(cost)) {
            this.army.addUnit(unitId, count);
            return true;
        }
        return false;
    }
    
    getArmyPower() {
        let power = 0;
        for (const [unitId, count] of Object.entries(this.army.units)) {
            const unit = CONFIG.UNITS[unitId.toUpperCase()];
            power += (unit.attack + unit.defense) * count;
        }
        return power;
    }
}

console.log('Entities module loaded');
