// Game entry point

document.addEventListener('DOMContentLoaded', () => {
    console.log('Heroes Mini - Starting...');
    
    // Initialize map first
    gameMap = new GameMap();
    
    // Then initialize game
    game = new Game();
    
    console.log('Heroes Mini - Ready!');
    console.log('Controls: Arrow keys or WASD to move, Space to end turn');
});
