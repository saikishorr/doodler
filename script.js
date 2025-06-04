document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const player = document.createElement('div');
    const gameOverScreen = document.getElementById('game-over-screen');
    const restartButton = document.getElementById('restart-button');

    let playerLeftSpace = 175; // Initial horizontal position
    let playerBottomSpace = 150; // Initial vertical position (from bottom of game-container)
    let isGameOver = false;
    let platformCount = 5; // Number of platforms on screen
    let platforms = [];
    let upTimerId;
    let downTimerId;
    let leftTimerId;
    let rightTimerId;
    let isJumping = true;
    let isGoingLeft = false;
    let isGoingRight = false;
    let score = 0;

    const gameContainer = document.querySelector('.game-container');
    const containerWidth = gameContainer.offsetWidth;
    const containerHeight = gameContainer.offsetHeight;

    function createPlayer() {
        grid.appendChild(player);
        player.classList.add('player');
        player.style.left = playerLeftSpace + 'px';
        player.style.bottom = playerBottomSpace + 'px';
        player.textContent = '🧍'; // Doodle character
    }

    class Platform {
        constructor(newPlatBottom) {
            this.bottom = newPlatBottom;
            this.left = Math.random() * (containerWidth - 100); // Random horizontal position within container
            this.visual = document.createElement('div');

            const visual = this.visual;
            visual.classList.add('platform');
            visual.style.left = this.left + 'px';
            visual.style.bottom = this.bottom + 'px';
            grid.appendChild(visual);
        }
    }

    function createPlatforms() {
        for (let i = 0; i < platformCount; i++) {
            // Distribute platforms evenly vertically initially
            let platGap = containerHeight / platformCount;
            let newPlatBottom = 100 + i * platGap;
            let newPlatform = new Platform(newPlatBottom);
            platforms.push(newPlatform);
        }
    }

    function movePlatforms() {
        if (playerBottomSpace > 200) { // When player is above a certain height, platforms move down
            platforms.forEach(platform => {
                platform.bottom -= 4; // Speed at which platforms move down
                let visual = platform.visual;
                visual.style.bottom = platform.bottom + 'px';

                if (platform.bottom < 10) { // If platform goes off screen, remove and create new one
                    let firstPlatform = platforms[0].visual;
                    firstPlatform.classList.remove('platform');
                    grid.removeChild(firstPlatform);
                    platforms.shift(); // Remove from array
                    score++; // Increase score when a platform is passed
                    let newPlatform = new Platform(containerHeight); // Create new platform at top
                    platforms.push(newPlatform);
                }
            });
        }
    }

    function jump() {
        clearInterval(downTimerId);
        isJumping = true;
        player.classList.add('jumping'); // Add jumping class for visual effect
        upTimerId = setInterval(function () {
            playerBottomSpace += 20; // Jump height
            player.style.bottom = playerBottomSpace + 'px';
            if (playerBottomSpace > containerHeight - 60) { // Stop jumping at top of screen
                fall();
            }
        }, 30);
    }

    function fall() {
        clearInterval(upTimerId);
        isJumping = false;
        player.classList.remove('jumping'); // Remove jumping class
        downTimerId = setInterval(function () {
            playerBottomSpace -= 5; // Gravity speed
            player.style.bottom = playerBottomSpace + 'px';

            if (playerBottomSpace <= 0) { // If player falls off the bottom
                gameOver();
            }

            // Check for collision with platforms
            platforms.forEach(platform => {
                if (
                    (playerBottomSpace >= platform.bottom) &&
                    (playerBottomSpace <= platform.bottom + 15) && // A small vertical buffer for landing
                    ((playerLeftSpace + 60) >= platform.left) &&
                    (playerLeftSpace <= (platform.left + 100)) &&
                    !isJumping // Only land if falling
                ) {
                    console.log('landed');
                    jump(); // Jump again upon landing
                }
            });
        }, 30);
    }

    function control(e) {
        if (isGameOver) return; // Don't allow movement if game is over

        // Key codes: 37 = Left, 39 = Right, 32 = Space (for initial jump)
        if (e.keyCode === 37) { // Left arrow
            moveLeft();
        } else if (e.keyCode === 39) { // Right arrow
            moveRight();
        } else if (e.keyCode === 32) { // Space bar for initial jump
            if (!isJumping && playerBottomSpace < 100) { // Only jump if on a low platform or ground
                jump();
            }
        }
    }

    function moveLeft() {
        if (isGoingRight) {
            clearInterval(rightTimerId);
            isGoingRight = false;
        }
        isGoingLeft = true;
        leftTimerId = setInterval(function () {
            if (playerLeftSpace > 0) {
                playerLeftSpace -= 5;
                player.style.left = playerLeftSpace + 'px';
            } else {
                // Wrap around to other side
                playerLeftSpace = containerWidth - 60;
                player.style.left = playerLeftSpace + 'px';
            }
        }, 20);
    }

    function moveRight() {
        if (isGoingLeft) {
            clearInterval(leftTimerId);
            isGoingLeft = false;
        }
        isGoingRight = true;
        rightTimerId = setInterval(function () {
            if (playerLeftSpace < containerWidth - 60) { // 60 is player width
                playerLeftSpace += 5;
                player.style.left = playerLeftSpace + 'px';
            } else {
                // Wrap around to other side
                playerLeftSpace = 0;
                player.style.left = playerLeftSpace + 'px';
            }
        }, 20);
    }

    function stopMoving() {
        clearInterval(leftTimerId);
        clearInterval(rightTimerId);
        isGoingLeft = false;
        isGoingRight = false;
    }

    function gameOver() {
        isGameOver = true;
        clearInterval(upTimerId);
        clearInterval(downTimerId);
        clearInterval(leftTimerId);
        clearInterval(rightTimerId);

        while (grid.firstChild) {
            grid.removeChild(grid.firstChild);
        }

        gameOverScreen.classList.remove('hidden');
        document.removeEventListener('keyup', control); // Stop listening for controls
        document.removeEventListener('keydown', handleKeyDown); // Remove continuous movement listener
    }

    function startGame() {
        // Reset game state
        isGameOver = false;
        playerLeftSpace = 175;
        playerBottomSpace = 150;
        platforms = [];
        score = 0;
        gameOverScreen.classList.add('hidden');
        grid.innerHTML = ''; // Clear existing elements

        createPlayer();
        createPlatforms();
        jump(); // Initial jump
        setInterval(movePlatforms, 30); // Continually move platforms down
        document.addEventListener('keyup', control); // Listen for single key press for initial jump
        document.addEventListener('keydown', handleKeyDown); // Listen for continuous movement
        document.addEventListener('keyup', stopMoving); // Stop movement when key is released
    }

    // Handle continuous movement when key is held down
    function handleKeyDown(e) {
        if (isGameOver) return;
        if (e.repeat) { // Check if key is being held down
            if (e.keyCode === 37 && !isGoingLeft) {
                moveLeft();
            } else if (e.keyCode === 39 && !isGoingRight) {
                moveRight();
            }
        }
    }


    restartButton.addEventListener('click', startGame);

    // Initial game start
    startGame();
});
