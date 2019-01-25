/* global Phaser */

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  */
/* GLOBAL CONSTANTS */

const STATE_INIT = 0;
const STATE_TITLE = 1;
const GET_READY = 4;
const STATE_PLAY = 2;
const STATE_GAMEOVER = 3;

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  */
/* GLOBAL VARIABLES */
var game = new Phaser.Game(960, 640, Phaser.AUTO, "", { preload: preload, create: create, update: update, render: render });
var playerShip, explosion, earth, moon, spaceDust, asteroidGroup, asteroidDelayTime, asteroidTimer,enterKey, cursorKeys, playerBulletGroup, fireKey, heartGroup, pause_label, menu, scoreLabel, pKey;
var titleText1, titleText2, gameOverText1, gameOverText2, toggleRender, toggle = false, titleMusic, gameMusic, explosionSound, laserSound, countDown, aKey, dKey;
var playerBulletTime=0;
var gameState = STATE_INIT;
var playerHealth = 3;
var score = 0;
var powerUp1 = false; var powerUp2 = false;
var shotDelay = 200;
var SHOWDEBUG = false;


/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  */
/* PHASER STATE FUNCTIONS */
function preload() {
    game.load.spritesheet("ship", "assets/shipSpriteSheet.png", 86,86);
    game.load.image("background", "assets/background_02_parallax_01.jpg");
    game.load.image("spaceDust", "assets/background_02_parallax_02.png");
    game.load.image("earth", "assets/planet1.png");
    game.load.image("moon", "assets/planet6.png");
    game.load.spritesheet("asteroid", "assets/asteroidSprite.png", 280, 277);
    game.load.spritesheet("asteroidExplosion", "assets/explosion.png",140,140);
    game.load.image("playerbullets", "assets/laserShot.png");
    game.load.image("heart", "assets/Heart.png");
    game.load.image("menu", "assets/buttons.png");
    
    game.load.audio('title', ['assets/VisagerEntrance.ogg', 'assets/VisagerEntrance.mp3']);
    game.load.audio('game', ['assets/VisagerBattle.ogg', 'assets/VisagerBattle.mp3']);
    game.load.audio('explosion', ['assets/explosion.ogg','assets/explosion.mp3']);
    game.load.audio('laser', ['assets/Laser.ogg','assets/Laser.mp3']);
}

function create() {
    

    
     cursorKeys = game.input.keyboard.createCursorKeys();
    toggleRender = game.input.keyboard.addKey(Phaser.Keyboard.F3);
    /* enable ARCADE physics */
    game.physics.startSystem(Phaser.Physics.ARCADE);    
    
    /* background image */
    game.add.image(0,0, 'background');
    explosionSound = game.add.audio('explosion');
    laserSound = game.add.audio('laser');
    
    titleMusic = game.add.audio('title');
    titleMusic.loop = true;
    titleMusic.play();
    
    gameMusic = game.add.audio('game');
    gameMusic.loop = true;
    
	/* create the parallax background elements */
	earth = game.add.image(0, 0, "earth");
	earth.x = game.rnd.integerInRange(0, game.width-earth.width);
	moon = game.add.image(0, 0, "moon");
	moon.x = game.rnd.integerInRange(0, game.width-moon.width);
	spaceDust = game.add.tileSprite(0,0,960,640,"spaceDust");
    
    /* create the player bullets group */
	playerBulletGroup = game.add.group();
	playerBulletGroup.enableBody = true;
    playerBulletGroup.physicsBodyType = Phaser.Physics.ARCADE;
	playerBulletGroup.createMultiple(3, "playerbullets");
	playerBulletGroup.forEach(playerBulletGroupInit);
    
    
	/* create the asteroid group */
	asteroidGroup = game.add.group();
	asteroidGroup.enableBody = true;
	asteroidGroup.physicsBodyType = Phaser.Physics.ARCADE;
	asteroidGroup.createMultiple(20, "asteroid");
	asteroidGroup.forEach(asteroidGroupInit);
	asteroidDelayTime = 4000; 
    asteroidTimer = game.time.events.add(20, deployAsteroid);
    
    
    /* player ship SPRITE with Physics enabled */
    playerShip = game.add.sprite(game.width/2,game.height/2, "ship");
    game.physics.arcade.enable(playerShip);
    playerShip.anchor.setTo(0.5);
    playerShip.body.setSize(54,40,17,27);
    playerShip.animations.add("idle", [1,4,7], 30, true);
    playerShip.animations.add("left", [0,3,6], 30, true);
    playerShip.animations.add("right", [2,5,8], 30, true);

	/* create the title screen text */
    titleText1 = game.add.text(game.width/2, game.height/2, "ASTEROIDS", { font: '100px Impact', fill: '#ff0000' });
    titleText1.anchor.setTo(0.5);
    titleText2 = game.add.text(game.width/2, game.height/2+100, "Press ENTER to Start", { font: '60px Impact', fill: '#ff0000' });
    titleText2.anchor.setTo(0.5);

	/* create the game over text */
    gameOverText1 = game.add.text(game.width/2, game.height/2 - 50, "GAME OVER", { font: '100px Impact', fill: '#ff0000' });
    gameOverText1.anchor.setTo(0.5);
    gameOverText2 = game.add.text(game.width/2, game.height/2 + 30, "You scored " + score + " points!", { font: '60px Impact', fill: '#ffffff' });
    gameOverText2.anchor.setTo(0.5);

    /* add a reference to the 'SPACE' key */
    enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    enterKey.onDown.add(spaceClick);

    /* PUT THE GAME INTO TITLE SCREEN STATE */
    changeGameState(STATE_TITLE);
    
    explosion = game.add.sprite(0,0, "asteroidExplosion");
    explosion.anchor.setTo(0.5, 0.5);
    explosion.animations.add("kaboom");
    explosion.kill();
    
    /*heart = game.add.image(0,0, "heart");
    heart.scale.setTo(0.06);
    */
    heartGroup = game.add.group();
    heartGroup.createMultiple(3, "heart",[0] , true);
    heartGroup.forEach(heartGroupInit);
    heartGroup.align(3, -1, heartGroup.width, 10);
    heartGroup.x = 10;
    heartGroup.y = 10;
    
    
    fireKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    pKey = game.input.keyboard.addKey(Phaser.Keyboard.P);
    
    toggleRender.onDown.add(info);
    
    playerShip.body.drag.x = 2000;
    playerShip.body.maxVelocity.x = 800;
    
    scoreLabel = game.add.text(20, 80, "Score: 0" ,{ font: '24px Arial', fill: '#fff' });
    scoreLabel.visible = false;
    
    pause_label = game.add.text(game.width - 100, 20, 'Pause', { font: '24px Arial', fill: '#fff' });
    pause_label.inputEnabled = true;
    pause_label.visible = false;
    pause_label.events.onInputUp.add(function () {
        // When the pause button is pressed, we pause the game
        game.paused = true;

        // Then add the menu
        menu = game.add.sprite(game.width/2, game.height/2, 'menu');
        menu.anchor.setTo(0.5, 0.5);

        // And a label to illustrate which menu item was chosen. (This is not necessary)
    });

    // Add a input listener that can help us return from being paused
    game.input.onDown.add(unpause);

    // And finally the method that handels the pause menu
    function unpause(event){
        // Only act if paused
        if(game.paused){
            // Calculate the corners of the menu
            var x1 = game.width/2 - 300/2, x2 = game.width/2 + 300/2,
                y1 = game.height/2 - 300/2, y2 = game.height/2;

            // Check if the click was inside the menu
            if(!(event.x > x1 && event.x < x2 && event.y > y1 && event.y < y2 )){
                // The choicemap is an array that will help us see which item was clicked
                // Remove the menu and the label
                menu.destroy();

                // Unpause the game
                game.paused = false;
            } 
            else{
                changeGameState(STATE_GAMEOVER);
                game.paused = false;
                menu.destroy();
            
            }
        }
    }
    
}

function update() {

    switch (gameState) {
        case STATE_PLAY:
            statePlay();
            break;
        case GET_READY:
            getReady();
            break;
        case STATE_TITLE:
            stateTitle();
            break;
        case STATE_GAMEOVER:
            stateGameOver();
            break;
    }
    asteroidGroup.forEach(asteroidUpdate);
    
}

function render() {
    if (SHOWDEBUG)
    {
        game.debug.bodyInfo(playerShip, 32, 32);
        /* debug.body shows the "green" physical body, used for collision detection, of the sprite */
        game.debug.body(playerShip);
        game.debug.body(asteroidGroup);
    }
    else{
        game.debug.reset();
    }
}

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  */
/* CUSTOM FUNCTIONS */

function changeGameState(newState)
{
    /* 
    changeGameState
    Purpose:    Responsible for initialization of a new state.  This code only
                runs one time when a request for a new state is called for.
                This is where we want to place our actors and get them ready.
    Input:      newState - The new state constant
    Output:     none
    */
    
    /* only change the state, if the state has indeed changed */
    if (gameState != newState)
    {
        /* STATE CHANGES */
        gameState = newState;
        
        switch (gameState) {
            case STATE_TITLE:
                playerShip.kill();
                moon.kill();
                earth.kill();
                titleText1.text = 'ASTEROIDS';
                titleText1.visible = true;
                titleText2.visible = true;
                gameOverText1.visible = false;
                gameOverText2.visible = false;
                playerHealth = 3;
                asteroidGroup.killAll();
                if (asteroidTimer) {
                    game.time.events.remove(asteroidTimer);
                }
                break;
            case GET_READY:
                playerShip.reset(game.rnd.integerInRange(0+playerShip.width, game.width-playerShip.width),580);
                titleText1.text = "GET READY";
                titleText2.visible = false;
                gameOverText1.visible = false;
                updateHealth();
                pause_label.visible = true;
                scoreLabel.visible = true;
                score = 0;
                updateScore();
                titleMusic.stop();
                gameMusic.play();
                countDown = 4;
                game.time.events.add(1000, getReadyCountdown);
                break;
            case STATE_PLAY:
                moon.reset(game.rnd.integerInRange(moon.width, game.width-moon.width), -moon.width);
                earth.reset(game.rnd.integerInRange(earth.width, game.width-earth.width), -earth.width);
                titleText1.visible = false;
                updateHealth();
	            asteroidDelayTime = 4000; 
                asteroidTimer = game.time.events.add(2000, deployAsteroid);
                pause_label.visible = true;
                scoreLabel.visible = true;
                score = 0;
                updateScore();
                break;
            case STATE_GAMEOVER:
                playerShip.kill();
                gameOverText2.update();
                titleText1.visible = false;
                titleText2.visible = true;
                gameOverText1.visible = true;
                gameOverText2.visible = true;
                pause_label.visible = false;
                scoreLabel.visible = false;
                resetPowerUp1();
                resetPowerUp2();
                gameMusic.stop();
                titleMusic.play();
                if (asteroidTimer) {
                    game.time.events.remove(asteroidTimer);
                }
                break;
        }
    
    }
    
}

function spaceClick() {
    if (gameState == STATE_TITLE) {
        changeGameState(GET_READY);
    } else if (gameState == STATE_GAMEOVER) {
        changeGameState(STATE_TITLE);
    }
}

function getReadyCountdown(){
    countDown--;
    if (countDown == 0) {
        changeGameState(STATE_PLAY);
    } else {
        titleText1.text = countDown;
        game.time.events.add(1000, getReadyCountdown);
    }
}
function getReady(){
    statePlay();
}
function statePlay() {
    
    game.physics.arcade.overlap(playerBulletGroup, asteroidGroup, killAsteroid);
    game.physics.arcade.overlap(playerShip, asteroidGroup, killPlayer);
    playerShip.body.acceleration.x = 0;
    
    if(cursorKeys.left.isDown || aKey.isDown){
        playerShip.body.acceleration.x = -1500;
    }
    else if(cursorKeys.right.isDown || dKey.isDown){
        playerShip.body.acceleration.x = 1500;
    }
    updateEarthMoonDust();
    game.world.wrap(playerShip);
    
    
    if(pKey.isDown && cursorKeys.up.isDown){
        playerHealth++;
        updateHealth();
    }
    if (fireKey.isDown){
        firePlayerBullet();
    }
    
    
    if(playerShip.body.velocity.x > 100){
        playerShip.play("right");
    }
    else if(playerShip.body.velocity.x < -100){
        playerShip.play("left");
    }
    else{
      playerShip.play("idle");  
    }
    
    
}

function info(){
    if(toggle && gameState ===STATE_PLAY){
       toggle = false;
       SHOWDEBUG = false;
       render();
    }
    else if(!toggle && gameState ===STATE_PLAY){
        toggle = true;
        SHOWDEBUG = true;
        render();
    }
    console.log(toggle);
}

function stateTitle() {
    
}

function stateGameOver() {
    updateEarthMoonDust();
}
function heartGroupInit(life){
    //life.scale.setTo(0.05);
}
function playerBulletGroupInit(bullet){
    bullet.outOfBoundsKill = true;
    bullet.checkWorldBounds = true;		
    bullet.anchor.setTo(0.5,0.5);
}

function resetPowerUp1(){
    powerUp1 = false;
    playerShip.maxVelocity = 800;
    
}
function resetPowerUp2(){
    powerUp2 = false;
    playerBulletGroup.removeAll();
    playerBulletGroup.createMultiple(3, "playerbullets");
    playerBulletGroup.forEach(playerBulletGroupInit);
    shotDelay = 200;
    
}


function firePowerUp(){
    if(game.rnd.realInRange(0,1) == 0){
        power1();
    }
    else{
        power2();
    }
    
}
function power1(){
    powerUp1 = true;
    playerShip.maxVelocity = 1300;
    game.time.events.add(10000, resetPowerUp1);
}
var resetPower2;
function power2(){
    powerUp2 = true;
    playerBulletGroup.removeAll();
    playerBulletGroup.createMultiple(6, "playerbullets");
    playerBulletGroup.forEach(playerBulletGroupInit);
    shotDelay = 100;
    resetPower2 = game.time.events.add(10000, resetPowerUp2);
    game.time.events.start(resetPower2);
    
}

function firePlayerBullet(){
    if(game.time.now > playerBulletTime){
        /* Grab the first bullet we can from the pool */
        var bullet = playerBulletGroup.getFirstExists(false);
    
        if(bullet){
            /* and fire it... */
            bullet.reset(playerShip.x, playerShip.y + 8);
            bullet.body.velocity.y = -400;
            laserSound.play();
            playerBulletTime = game.time.now + shotDelay;
            
            //shotCountText.text = "Shot Count = " + shotCount;
        }
    }
}
function asteroidUpdate(asteroid){
    asteroid.rotation += asteroid.data.rotate;
    
    
}


function asteroidGroupInit(asteroid) {
    asteroid.outOfBoundsKill = true;
    asteroid.checkWorldBounds = true;
    asteroid.anchor.setTo(0.5);
    /* Phaser lets us add custom variables directly to sprites! */
    
    asteroid.data.rotate = game.rnd.realInRange(-0.1,0.1);
}

function deployAsteroid() {
    
    var asteroid = asteroidGroup.getFirstExists(false);
    
    if (asteroid)
    {
        var scale = game.rnd.realInRange(.17,.4);
        asteroid.frame = 0;
        asteroid.scale.setTo(scale,scale);
        asteroid.body.velocity.x = 0;
        asteroid.reset(game.rnd.integerInRange(asteroid.width/2, game.width-asteroid.width/2), 10-asteroid.height/2);
        asteroid.body.velocity.y = game.rnd.integerInRange(75,250);
        asteroid.data.rotate = game.rnd.realInRange(-0.1,0.1);
        asteroidDelayTime -= 200;
        asteroid.data.health = false;
        asteroid.data.power = false;
        asteroid.data.money = false;
        asteroid.tint = 0xffffff;
        if(game.rnd.integerInRange(0,3) == 0){
            asteroid.body.velocity.x = game.rnd.integerInRange(-75,75);
        }
        if(game.rnd.integerInRange(0,49) == 0){
            //asteroid.tint = 0xffa3ee;
            asteroid.data.health = true;
            asteroid.frame = 2;
        }
        else if(game.rnd.integerInRange(0,16) == 0){
           // asteroid.tint = 0x9bf0ff;
            asteroid.data.power = true;
            asteroid.frame = 1;
        }
        else if(game.rnd.integerInRange(0,9) == 0){
            asteroid.data.money = true;
            asteroid.frame = 3;
        }
    }
    
    /* deploy the next asteroid in "asteroidDelayTime" seconds */	
    asteroidTimer = game.time.events.add(asteroidDelayTime, deployAsteroid);

    
}
function updateHealth(){
    heartGroup.removeAll();
    heartGroup.createMultiple(playerHealth, "heart",[0] , true);
    heartGroup.align(playerHealth, 0, heartGroup.width, 10);
}

function updateEarthMoonDust() {
    spaceDust.tilePosition.y += 8;
    
    earth.y += 0.1;
    if (earth.y > game.height){
        earth.y = -earth.height;
	    earth.x = game.rnd.integerInRange(0, game.width-earth.width);
    }
    
    moon.y += 0.5;
    if (moon.y > game.height){
        moon.y = -moon.height;
	    moon.x = game.rnd.integerInRange(0, game.width-moon.width);
    }
}
function updateScore(){
    scoreLabel.setText("Score: " + score);
    gameOverText2.setText("You scored " + score + " points!");
} 
function killAsteroid(bullet, asteroid){
    asteroid.kill();
    bullet.kill();
    explosion.reset(asteroid.x, asteroid.y);
    explosion.play("kaboom", 30, false, true);
    score +=10;
    updateScore();
    explosionSound.play();
    
    if(asteroid.data.health){
        /* increase health */
        playerHealth++;
        updateHealth();
    }
    else if(asteroid.data.power){
        if(powerUp1 && !powerUp2){
            power2();
            console.log("bullets");
        }
        else if(powerUp2 && !powerUp1){
            power1();
            console.log("speed");
        }
        else if(!powerUp1 && !powerUp2){
            firePowerUp();
            console.log("random");
        }
    }
    else if(asteroid.data.money){
        score += 90;
        updateScore();
    }
}




function killPlayer(player, asteroid) {
    asteroid.kill();
    
    playerHealth--;
    updateHealth();
    
    console.log(playerHealth);
    if(playerHealth < 1){
        player.kill();
        explosionSound.play();
        changeGameState(STATE_GAMEOVER);
        explosion.reset(player.x, player.y);
        explosion.play("kaboom", 30, false, true);
    }
    else{
        explosion.reset(asteroid.x, asteroid.y);
        explosion.play("kaboom", 30, false, true);
    }
}