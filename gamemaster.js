// Gamemaster Character Module
// 👾 Gamemaster - Coin projectiles with Jackpot Strike and Game Buster

class GamemasterModule {
  static initializeAbilities(character) {
    if (character.emoji !== "👾") return;
    
    character.abilityData = {
      lastCoinTime: 0,
      coinCooldown: 180, // 3 seconds
      coinsCollected: 0,
      gameBusterActive: false,
      gameBusterShots: 0,
      maxGameBusterShots: 20,
      gameBusterCooldown: 30 // 0.5 seconds between Game Buster shots
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "👾" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Handle Game Buster rapid fire
    if (character.abilityData.gameBusterActive) {
      this.handleGameBuster(character, currentTime);
      return;
    }
    
    // Regular coin shooting
    if (currentTime - character.abilityData.lastCoinTime >= character.abilityData.coinCooldown) {
      this.fireCoin(character);
      character.abilityData.lastCoinTime = currentTime;
    }
  }

  static fireCoin(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create coin projectile
    const coin = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🪙", 1, character, "coin",
      {
        bounces: 0,
        maxBounces: 3,
        gamemasterOwner: character,
        hasHitEnemy: false
      }
    );
    
    projectiles.push(coin);
    audio.shoot();
    console.log("👾 Gamemaster fires coin!");
  }

  static handleGameBuster(character, currentTime) {
    if (character.abilityData.gameBusterShots >= character.abilityData.maxGameBusterShots) {
      this.endGameBuster(character);
      return;
    }
    
    // Check cooldown between shots
    if (currentTime - character.abilityData.lastCoinTime >= character.abilityData.gameBusterCooldown) {
      this.fireGameBusterCoin(character);
      character.abilityData.gameBusterShots++;
      character.abilityData.lastCoinTime = currentTime;
    }
  }

  static fireGameBusterCoin(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 4; // Slightly faster for Game Buster
    
    // Create Game Buster coin
    const coin = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🪙", 1, character, "coin",
      {
        bounces: 0,
        maxBounces: 3,
        gamemasterOwner: character,
        hasHitEnemy: false,
        gameBuster: true
      }
    );
    
    projectiles.push(coin);
    console.log("👾 Game Buster coin fired!");
  }

  static handleCoinHit(projectile, character) {
    if (character.team === projectile.owner.team) {
      // Gamemaster caught his own coin
      this.collectCoin(projectile.owner);
      const index = projectiles.indexOf(projectile);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      return;
    }
    
    // Enemy hit by coin
    const directHit = !projectile.data.hasHitEnemy;
    projectile.data.hasHitEnemy = true;
    
    if (directHit) {
      // Jackpot Strike - direct hit
      character.takeDamage(2, projectile.owner);
      projectile.owner.heal(1);
      console.log("💰 Jackpot Strike! 2 damage + 1 heal");
    } else {
      // Bounced coin hit
      character.takeDamage(1, projectile.owner);
      console.log("🪙 Coin hit after bounce: 1 damage");
    }
    
    // Remove coin after hitting enemy
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static handleCoinWallBounce(coin) {
    coin.data.bounces++;
    audio.bounce();
    
    if (coin.data.bounces >= coin.data.maxBounces) {
      console.log("🪙 Coin disappeared after max bounces");
      return false; // Remove coin
    }
    
    return true; // Continue bouncing
  }

  static collectCoin(gamemaster) {
    gamemaster.abilityData.coinsCollected++;
    console.log(`👾 Coins collected: ${gamemaster.abilityData.coinsCollected}/20`);
    
    if (gamemaster.abilityData.coinsCollected >= 20) {
      this.activateGameBuster(gamemaster);
    }
  }

  static activateGameBuster(character) {
    character.abilityData.gameBusterActive = true;
    character.abilityData.gameBusterShots = 0;
    character.abilityData.coinsCollected = 0; // Reset counter
    
    console.log("👾 GAME BUSTER ACTIVATED! 20 rapid coins incoming!");
    audio.ability();
  }

  static endGameBuster(character) {
    character.abilityData.gameBusterActive = false;
    character.abilityData.gameBusterShots = 0;
    
    console.log("👾 Game Buster complete!");
  }

  static handleBankHit(projectile, character) {
    if (character.team !== projectile.owner.team) return; // Only Gamemaster can collect banks
    
    // Gamemaster collected bank - trigger immediate Game Buster
    console.log("💰 Bank collected! Triggering immediate Game Buster!");
    this.activateGameBuster(character);
    
    // Remove bank
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static checkCoinCollisions() {
    // Check for coin-coin collisions to create banks
    const coins = projectiles.filter(p => p.type === "coin");
    
    for (let i = 0; i < coins.length; i++) {
      for (let j = i + 1; j < coins.length; j++) {
        const coin1 = coins[i];
        const coin2 = coins[j];
        
        const dx = coin1.x - coin2.x;
        const dy = coin1.y - coin2.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < (coin1.size + coin2.size)) {
          this.createBank(coin1, coin2);
          break;
        }
      }
    }
  }

  static createBank(coin1, coin2) {
    // Create bank at midpoint
    const bankX = (coin1.x + coin2.x) / 2;
    const bankY = (coin1.y + coin2.y) / 2;
    
    const bank = new Projectile(
      bankX, bankY,
      0, 0, // Banks don't move
      "💰", 0, coin1.owner, "bank",
      {
        lifetime: 600, // 10 seconds
        spawnTime: gameTime
      }
    );
    
    projectiles.push(bank);
    
    // Remove the two coins that collided
    const index1 = projectiles.indexOf(coin1);
    const index2 = projectiles.indexOf(coin2);
    
    if (index1 > -1) projectiles.splice(index1, 1);
    if (index2 > -1) {
      const adjustedIndex = index2 > index1 ? index2 - 1 : index2;
      projectiles.splice(adjustedIndex, 1);
    }
    
    console.log("💰 Bank created from coin collision!");
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "👾") return;
    
    // Stop Game Buster if active
    character.abilityData.gameBusterActive = false;
  }
}

class CoinProjectile extends Projectile {
  update() {
    // Check for coin-coin collisions
    if (this.type === "coin") {
      GamemasterModule.checkCoinCollisions();
    }
    
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.GamemasterModule = GamemasterModule;