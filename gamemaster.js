// Gamemaster Character Module
// 👾 Gamemaster - Coin projectiles with bouncing, collection, and Game Buster

class GamemasterModule {
  static initializeAbilities(character) {
    if (character.emoji !== "👾") return;
    
    character.abilityData = {
      // Coin shooting mechanics
      lastCoinTime: 0, // Last time a coin was fired
      coinCooldown: 180, // 3 seconds at 60fps
      
      // Game Buster mechanics
      coinsCollected: 0, // Number of coins collected by hitting/catching them
      gameBusterActive: false, // Whether Game Buster is currently active
      gameBusterCoinsLeft: 0, // Coins left to fire in Game Buster mode
      gameBusterCooldown: 30, // 0.5 seconds at 60fps for rapid fire
      lastGameBusterCoin: 0, // Last time a Game Buster coin was fired
      
      // Bank mechanics
      banksCreated: 0, // Number of banks created from coin collisions
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "👾" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle Game Buster mode
    if (data.gameBusterActive) {
      this.handleGameBuster(character, currentTime);
    } else {
      // Handle normal coin shooting
      this.handleNormalCoinShooting(character, currentTime);
    }
    
    // Check for coin collisions to create banks
    this.checkCoinCollisions(character);
  }

  static handleNormalCoinShooting(character, currentTime) {
    const data = character.abilityData;
    
    // Check if it's time to fire a coin
    if (currentTime - data.lastCoinTime >= data.coinCooldown) {
      this.fireCoin(character, false);
      data.lastCoinTime = currentTime;
    }
  }

  static handleGameBuster(character, currentTime) {
    const data = character.abilityData;
    
    // Check if we still have coins to fire in Game Buster mode
    if (data.gameBusterCoinsLeft <= 0) {
      data.gameBusterActive = false;
      console.log(`Game Buster complete! Returning to normal firing.`);
      return;
    }
    
    // Fire coins rapidly
    if (currentTime - data.lastGameBusterCoin >= data.gameBusterCooldown) {
      this.fireCoin(character, true);
      data.lastGameBusterCoin = currentTime;
      data.gameBusterCoinsLeft--;
    }
  }

  static fireCoin(character, isGameBuster = false) {
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
        isGameBuster: isGameBuster,
        hasHitDirectly: false
      }
    );
    
    projectiles.push(coin);
    audio.shoot();
    
    console.log(`${character.emoji} fired 🪙 ${isGameBuster ? '(Game Buster)' : '(Normal)'}`);
  }

  static handleCoinWallBounce(projectile) {
    const owner = projectile.owner;
    if (!owner || owner.emoji !== "👾") return false;
    
    const data = projectile.data;
    
    // Check if coin can still bounce
    if (data.bounces >= data.maxBounces) {
      return false; // Coin should be destroyed
    }
    
    data.bounces++;
    console.log(`Coin bounced! (${data.bounces}/${data.maxBounces})`);
    audio.bounce();
    
    return true; // Coin continues after bounce
  }

  static handleCoinHit(projectile, character) {
    if (projectile.type !== "coin") return;
    
    const owner = projectile.owner;
    const isDirectHit = projectile.data.bounces === 0;
    
    if (character === owner) {
      // Gamemaster hit by own coin - collect it
      this.collectCoin(owner, projectile);
      return;
    }
    
    // Enemy hit by coin
    if (isDirectHit) {
      // Jackpot Strike: Direct hit
      character.takeDamage(2, owner);
      owner.heal(1);
      console.log(`Jackpot Strike! 2 damage + 1 heal for Gamemaster`);
    } else {
      // Bounced hit
      character.takeDamage(1, owner);
      console.log(`Bounced coin hit: 1 damage`);
    }
  }

  static collectCoin(gamemaster, coinProjectile) {
    const data = gamemaster.abilityData;
    data.coinsCollected++;
    
    console.log(`Coin collected! Total: ${data.coinsCollected}/20`);
    
    // Check if Game Buster should be triggered
    if (data.coinsCollected >= 20) {
      this.triggerGameBuster(gamemaster);
    }
  }

  static triggerGameBuster(gamemaster) {
    const data = gamemaster.abilityData;
    
    data.gameBusterActive = true;
    data.gameBusterCoinsLeft = 20;
    data.coinsCollected = 0; // Reset counter
    data.lastGameBusterCoin = gameTime;
    
    console.log(`🎰 GAME BUSTER ACTIVATED! 🎰 - 20 rapid coins incoming!`);
    audio.ability();
    
    // Visual effect for Game Buster activation
    this.createGameBusterEffect(gamemaster);
  }

  static createGameBusterEffect(character) {
    const canvas = document.getElementById('arena');
    const rect = canvas.getBoundingClientRect();
    
    // Create pulsing coin effect around Gamemaster
    const effect = document.createElement('div');
    effect.style.position = 'absolute';
    effect.style.left = `${rect.left + character.x - 40}px`;
    effect.style.top = `${rect.top + character.y - 40}px`;
    effect.style.width = '80px';
    effect.style.height = '80px';
    effect.style.background = 'radial-gradient(circle, rgba(255,215,0,0.8), rgba(255,165,0,0.4), transparent)';
    effect.style.borderRadius = '50%';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '1000';
    effect.style.animation = 'gameBusterPulse 2s ease-out forwards';
    
    // Add coin symbols
    effect.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px;">🪙💰🪙</div>';
    
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 2000);
  }

  static checkCoinCollisions(gamemaster) {
    const coins = projectiles.filter(p => p.type === "coin" && p.owner === gamemaster);
    
    // Check for coin-to-coin collisions
    for (let i = 0; i < coins.length; i++) {
      for (let j = i + 1; j < coins.length; j++) {
        const coin1 = coins[i];
        const coin2 = coins[j];
        
        const dx = coin1.x - coin2.x;
        const dy = coin1.y - coin2.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < (coin1.size + coin2.size)) {
          // Coins collided - create a bank
          this.createBank(coin1, coin2, gamemaster);
          
          // Remove both coins
          const index1 = projectiles.indexOf(coin1);
          const index2 = projectiles.indexOf(coin2);
          if (index1 > -1) projectiles.splice(index1, 1);
          if (index2 > -1) projectiles.splice(Math.max(0, index2 - (index1 < index2 ? 1 : 0)), 1);
          
          break; // Only handle one collision per frame
        }
      }
    }
  }

  static createBank(coin1, coin2, gamemaster) {
    // Create bank at the midpoint between the two coins
    const bankX = (coin1.x + coin2.x) / 2;
    const bankY = (coin1.y + coin2.y) / 2;
    
    const bank = new Projectile(
      bankX, bankY,
      0, 0, // Banks don't move
      "💰", 0, gamemaster, "bank",
      { 
        gamemasterOwner: gamemaster,
        lifetime: 1800 // 30 seconds lifetime
      }
    );
    
    projectiles.push(bank);
    gamemaster.abilityData.banksCreated++;
    
    console.log(`Bank created from coin collision! 💰`);
    audio.ability();
  }

  static handleBankHit(projectile, character) {
    if (projectile.type !== "bank") return;
    
    const owner = projectile.data.gamemasterOwner;
    
    if (character === owner) {
      // Gamemaster collected the bank - trigger immediate Game Buster
      console.log(`Bank collected! Triggering immediate Game Buster! 💰`);
      this.triggerGameBuster(owner);
      
      // Remove the bank
      const index = projectiles.indexOf(projectile);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
    }
  }

  static handleCharacterDeath(character) {
    // Clean up any Gamemaster-specific effects when character dies
    if (character.emoji === "👾") {
      if (character.abilityData) {
        character.abilityData.gameBusterActive = false;
        character.abilityData.gameBusterCoinsLeft = 0;
      }
    }
  }
}

// Coin Projectile class extension
class CoinProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    // Banks don't move
    if (this.type === "bank") {
      this.age++;
      return this.age <= this.lifetime;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    if (this.age > this.lifetime) {
      return false;
    }

    // Check wall collision for coins
    if (this.type === "coin") {
      return this.handleCoinWallCollision();
    }

    return true;
  }

  handleCoinWallCollision() {
    const margin = this.size;
    let hitWall = false;

    if (this.x <= margin) {
      this.x = margin;
      this.vx *= -1;
      hitWall = true;
    } else if (this.x >= canvas.width - margin) {
      this.x = canvas.width - margin;
      this.vx *= -1;
      hitWall = true;
    }

    if (this.y <= margin) {
      this.y = margin;
      this.vy *= -1;
      hitWall = true;
    } else if (this.y >= canvas.height - margin) {
      this.y = canvas.height - margin;
      this.vy *= -1;
      hitWall = true;
    }

    if (hitWall) {
      return GamemasterModule.handleCoinWallBounce(this);
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add glow effects
    if (this.type === 'coin') {
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 8;
    } else if (this.type === 'bank') {
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 12;
      // Add pulsing effect for banks
      const pulse = Math.sin(this.age * 0.1) * 0.2 + 1;
      ctx.globalAlpha = pulse;
    }
    
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// Add CSS animations for effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes gameBusterPulse {
      0% { 
        transform: scale(0);
        opacity: 1;
      }
      50% {
        transform: scale(1.3);
        opacity: 0.8;
      }
      100% { 
        transform: scale(2.5);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.GamemasterModule = GamemasterModule;
  window.CoinProjectile = CoinProjectile;
}