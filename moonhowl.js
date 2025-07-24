// Moonhowl Character Module
// 🐺 Moonhowl - Moon shooting with Full Moon Rage and Wolfsense tracking

class MoonhowlModule {
  static activeWolfsense = null; // Track active Wolfsense
  static moonProjectiles = []; // Track regular moons for cleanup

  static initializeAbilities(character) {
    if (character.emoji !== "🐺") return;
    
    character.abilityData = {
      // Moon shooting mechanics
      lastShotTime: 0,
      baseCooldown: 120, // 2 seconds
      currentCooldown: 120,
      
      // Full Moon Rage tracking
      enemyHitCount: 0, // Tracks hits on enemy for Full Moon trigger
      targetEnemy: null, // Track which enemy we're hitting
      
      // Power-up state
      isPoweredUp: false,
      powerUpEndTime: 0,
      powerUpDuration: 720, // 12 seconds at 60fps
      speedMultiplier: 1, // Tracks speed stacking (2x, 4x, 8x, etc.)
      
      // Visual scaling
      baseSizeMultiplier: 1.0,
      currentSizeMultiplier: 1.0
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐺" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Update power-up state
    this.updatePowerUpState(character, currentTime);
    
    // Handle moon shooting
    this.handleMoonShooting(character, currentTime);
    
    // Update Wolfsense if active
    this.updateWolfsense(character, currentTime);
    
    // Clean up old moon projectiles
    this.cleanupMoonProjectiles();
  }

  static updatePowerUpState(character, currentTime) {
    const data = character.abilityData;
    
    // Check if power-up has expired
    if (data.isPoweredUp && currentTime >= data.powerUpEndTime) {
      data.isPoweredUp = false;
      data.speedMultiplier = 1;
      data.currentSizeMultiplier = data.baseSizeMultiplier;
      character.size = character.baseSize * data.currentSizeMultiplier;
      data.currentCooldown = data.baseCooldown;
      
      console.log(`🐺 Moonhowl power-up expired - returning to normal`);
    }
    
    // Update cooldown based on power-up
    if (data.isPoweredUp) {
      data.currentCooldown = data.baseCooldown / data.speedMultiplier;
    } else {
      data.currentCooldown = data.baseCooldown;
    }
  }

  static handleMoonShooting(character, currentTime) {
    const data = character.abilityData;
    
    // Check if it's time to shoot
    if (currentTime - data.lastShotTime >= data.currentCooldown) {
      this.shootMoon(character, currentTime);
    }
  }

  static shootMoon(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 4;
    
    // Create moon projectile
    const moon = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🌙", 1, character, "moon",
      {
        moonhowlOwner: character,
        bounceCount: 0,
        targetEnemy: enemy
      }
    );
    
    projectiles.push(moon);
    this.moonProjectiles.push(moon);
    data.lastShotTime = currentTime;
    
    console.log(`🐺 Moonhowl shot moon! (Cooldown: ${data.currentCooldown/60}s, Speed: ${data.speedMultiplier}x)`);
    audio.shoot();
  }

  static handleMoonHit(projectile, character) {
    if (projectile.type !== "moon") return;
    
    const owner = projectile.owner;
    
    if (character === owner) return; // Moons don't hit Moonhowl directly
    
    // Deal damage
    character.takeDamage(projectile.damage, owner);
    
    // Track hits for Full Moon Rage
    if (owner.abilityData) {
      this.trackEnemyHit(owner, character);
    }
    
    // Remove the moon
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    const moonIndex = this.moonProjectiles.indexOf(projectile);
    if (moonIndex > -1) {
      this.moonProjectiles.splice(moonIndex, 1);
    }
    
    audio.hit();
  }

  static trackEnemyHit(moonhowl, enemy) {
    const data = moonhowl.abilityData;
    
    // Track hits on the same enemy
    if (data.targetEnemy === enemy) {
      data.enemyHitCount++;
    } else {
      // Reset if hitting different enemy
      data.targetEnemy = enemy;
      data.enemyHitCount = 1;
    }
    
    console.log(`🐺 Enemy hit ${data.enemyHitCount}/3 times by moons`);
    
    // Trigger Full Moon Rage after 3 hits
    if (data.enemyHitCount >= 3) {
      this.triggerFullMoonRage(moonhowl);
    }
  }

  static triggerFullMoonRage(moonhowl) {
    const data = moonhowl.abilityData;
    
    // Clear all existing moons
    this.clearAllMoons();
    
    // Reset hit counter
    data.enemyHitCount = 0;
    
    // Create Full Moon
    this.createFullMoon(moonhowl);
    
    console.log(`🌕 FULL MOON RAGE activated! All moons cleared, Full Moon released!`);
  }

  static clearAllMoons() {
    // Remove all regular moons from projectiles
    projectiles = projectiles.filter(p => p.type !== "moon");
    this.moonProjectiles = [];
  }

  static createFullMoon(moonhowl) {
    const enemy = moonhowl.getNearestEnemy();
    if (!enemy) return;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - moonhowl.y, enemy.x - moonhowl.x);
    const speed = 3;
    
    // Create Full Moon projectile
    const fullMoon = new Projectile(
      moonhowl.x, moonhowl.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🌕", 8, moonhowl, "fullmoon",
      {
        moonhowlOwner: moonhowl,
        bounceCount: 0,
        maxBounces: 3, // Full Moon has limited bounces
        isFullMoon: true
      }
    );
    
    projectiles.push(fullMoon);
    audio.shoot();
  }

  static handleFullMoonHit(projectile, character) {
    if (projectile.type !== "fullmoon") return;
    
    const owner = projectile.owner;
    
    // Check what the Full Moon hit
    if (character === owner) {
      // Full Moon hits Moonhowl - trigger power-up
      this.triggerMoonhowlPowerUp(owner);
    } else {
      // Full Moon hits enemy - deal 8 damage
      character.takeDamage(8, owner);
      console.log(`🌕 Full Moon dealt 8 damage to enemy!`);
    }
    
    // Remove the Full Moon
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    audio.hit();
  }

  static handleFullMoonBorderHit(projectile) {
    if (projectile.type !== "fullmoon") return;
    
    const owner = projectile.owner;
    
    // Spawn Wolfsense when Full Moon hits border
    this.spawnWolfsense(owner, projectile.x, projectile.y);
    
    // Remove the Full Moon
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    console.log(`🌕 Full Moon hit border - Wolfsense spawned!`);
  }

  static triggerMoonhowlPowerUp(moonhowl) {
    const data = moonhowl.abilityData;
    
    // Double the speed multiplier (or set to 2 if first time)
    data.speedMultiplier = data.isPoweredUp ? data.speedMultiplier * 2 : 2;
    
    // Double the size
    data.currentSizeMultiplier = data.baseSizeMultiplier * 2;
    moonhowl.size = moonhowl.baseSize * data.currentSizeMultiplier;
    
    // Reset and extend power-up duration
    data.isPoweredUp = true;
    data.powerUpEndTime = gameTime + data.powerUpDuration;
    
    console.log(`🐺 Moonhowl POWERED UP! Speed: ${data.speedMultiplier}x, Size: 2x, Duration: 12s`);
    
    // Visual effect
    if (moonhowl.element) {
      moonhowl.element.classList.add('moonhowl-powerup');
      setTimeout(() => {
        if (moonhowl.element) {
          moonhowl.element.classList.remove('moonhowl-powerup');
        }
      }, 1000);
    }
  }

  static spawnWolfsense(moonhowl, x, y) {
    // Remove existing Wolfsense if any
    if (this.activeWolfsense) {
      const index = projectiles.indexOf(this.activeWolfsense);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
    }
    
    // Create new Wolfsense
    const wolfsense = new Projectile(
      x, y,
      0, 0, // Will be updated to chase enemy
      "👁️‍🗨️", 0, moonhowl, "wolfsense",
      {
        moonhowlOwner: moonhowl,
        targetEnemy: moonhowl.abilityData.targetEnemy,
        isLatched: false,
        latchTime: 0,
        latchDuration: 600, // 10 seconds
        guaranteedStrikes: 0, // Track how many guaranteed strikes can happen
        isChasing: true
      }
    );
    
    projectiles.push(wolfsense);
    this.activeWolfsense = wolfsense;
    
    console.log(`👁️‍🗨️ Wolfsense spawned and hunting enemy!`);
  }

  static updateWolfsense(moonhowl, currentTime) {
    if (!this.activeWolfsense || !projectiles.includes(this.activeWolfsense)) {
      this.activeWolfsense = null;
      return;
    }
    
    const wolfsense = this.activeWolfsense;
    const data = wolfsense.data;
    const enemy = data.targetEnemy;
    
    if (!enemy || enemy.isDead) {
      this.removeWolfsense();
      return;
    }
    
    if (data.isLatched) {
      // Update latch duration
      data.latchTime++;
      
      // Check if latch duration is complete
      if (data.latchTime >= data.latchDuration) {
        // Grant guaranteed strikes and remove Wolfsense
        data.guaranteedStrikes = data.latchTime >= data.latchDuration ? 2 : 1;
        this.triggerGuaranteedMoonstorm(moonhowl, enemy, data.guaranteedStrikes);
        this.removeWolfsense();
      }
    } else if (data.isChasing) {
      // Update Wolfsense position to chase enemy
      this.updateWolfsenseChase(wolfsense, enemy);
    }
  }

  static updateWolfsenseChase(wolfsense, enemy) {
    const speed = 2;
    const dx = enemy.x - wolfsense.x;
    const dy = enemy.y - wolfsense.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 20) {
      // Latch onto enemy
      wolfsense.data.isLatched = true;
      wolfsense.data.isChasing = false;
      wolfsense.x = enemy.x;
      wolfsense.y = enemy.y;
      
      // Apply Wolfsense effects
      this.applyWolfsenseEffects(enemy);
      
      console.log(`👁️‍🗨️ Wolfsense latched onto enemy!`);
    } else {
      // Chase enemy
      wolfsense.vx = (dx / distance) * speed;
      wolfsense.vy = (dy / distance) * speed;
    }
  }

  static applyWolfsenseEffects(enemy) {
    // Mark enemy (visual effect)
    if (enemy.element) {
      enemy.element.classList.add('wolfsense-marked');
    }
    
    // Remove invulnerability (if implemented)
    if (enemy.isInvulnerable) {
      enemy.isInvulnerable = false;
    }
    
    // Reveal clones/hidden status (mark for other abilities)
    enemy.isRevealed = true;
    
    console.log(`👁️‍🗨️ Enemy marked by Wolfsense - vulnerabilities revealed!`);
  }

  static triggerGuaranteedMoonstorm(moonhowl, enemy, strikes) {
    console.log(`🌙 Guaranteed Moonstorm activated! ${strikes} wave(s) of 10 moons each`);
    
    // Start the moonstorm sequence
    this.executeGuaranteedMoonstorm(moonhowl, enemy, strikes, 0);
  }

  static executeGuaranteedMoonstorm(moonhowl, enemy, totalStrikes, currentStrike) {
    if (currentStrike >= totalStrikes || enemy.isDead) return;
    
    console.log(`🌙 Moonstorm wave ${currentStrike + 1}/${totalStrikes} starting!`);
    
    // Fire 10 moons over 5 seconds (1 every 0.5 seconds)
    let moonCount = 0;
    const interval = setInterval(() => {
      if (moonCount >= 10 || enemy.isDead) {
        clearInterval(interval);
        
        // Start next wave after 1 second delay
        if (currentStrike + 1 < totalStrikes) {
          setTimeout(() => {
            this.executeGuaranteedMoonstorm(moonhowl, enemy, totalStrikes, currentStrike + 1);
          }, 1000);
        }
        return;
      }
      
      this.fireGuaranteedMoon(moonhowl, enemy);
      moonCount++;
    }, 500); // 0.5 second intervals
  }

  static fireGuaranteedMoon(moonhowl, enemy) {
    // Create guaranteed hit moon
    const moon = new Projectile(
      moonhowl.x, moonhowl.y,
      0, 0, // Will be guided directly to enemy
      "🌙", 1, moonhowl, "guaranteedmoon",
      {
        moonhowlOwner: moonhowl,
        targetEnemy: enemy,
        isGuaranteed: true
      }
    );
    
    projectiles.push(moon);
    console.log(`🌙 Guaranteed moon fired!`);
    audio.shoot();
  }

  static handleGuaranteedMoonUpdate(projectile) {
    if (projectile.type !== "guaranteedmoon") return true;
    
    const enemy = projectile.data.targetEnemy;
    if (!enemy || enemy.isDead) {
      // Remove if target is gone
      const index = projectiles.indexOf(projectile);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      return false;
    }
    
    // Move directly towards enemy
    const speed = 6;
    const dx = enemy.x - projectile.x;
    const dy = enemy.y - projectile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) {
      // Hit the enemy
      enemy.takeDamage(1, projectile.owner);
      audio.hit();
      
      const index = projectiles.indexOf(projectile);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      return false;
    }
    
    projectile.vx = (dx / distance) * speed;
    projectile.vy = (dy / distance) * speed;
    
    return true;
  }

  static removeWolfsense() {
    if (this.activeWolfsense) {
      const index = projectiles.indexOf(this.activeWolfsense);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      
      // Remove visual effects from enemy
      if (this.activeWolfsense.data.targetEnemy && this.activeWolfsense.data.targetEnemy.element) {
        this.activeWolfsense.data.targetEnemy.element.classList.remove('wolfsense-marked');
        this.activeWolfsense.data.targetEnemy.isRevealed = false;
      }
      
      this.activeWolfsense = null;
      console.log(`👁️‍🗨️ Wolfsense removed`);
    }
  }

  static handleWolfsenseRemoval(moonhowl) {
    // Remove Wolfsense if enemy hits Moonhowl
    if (this.activeWolfsense) {
      console.log(`👁️‍🗨️ Wolfsense destroyed by enemy attack!`);
      this.removeWolfsense();
    }
  }

  static cleanupMoonProjectiles() {
    // Clean up moon projectiles that no longer exist
    this.moonProjectiles = this.moonProjectiles.filter(moon => 
      projectiles.includes(moon)
    );
  }

  static handleCharacterDeath(character) {
    // Clean up when Moonhowl dies
    if (character.emoji === "🐺") {
      // Remove all moon-related projectiles
      projectiles = projectiles.filter(p => 
        p.type !== "moon" && p.type !== "fullmoon" && 
        p.type !== "wolfsense" && p.type !== "guaranteedmoon"
      );
      
      this.moonProjectiles = [];
      this.activeWolfsense = null;
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "🐺" || !character.abilityData) return null;
    
    const data = character.abilityData;
    return {
      enemyHits: data.enemyHitCount,
      isPoweredUp: data.isPoweredUp,
      speedMultiplier: data.speedMultiplier,
      powerUpTimeLeft: data.isPoweredUp ? Math.max(0, data.powerUpEndTime - gameTime) / 60 : 0,
      hasWolfsense: !!this.activeWolfsense,
      activeMoons: this.moonProjectiles.length
    };
  }
}

// Moon Projectile class extensions
class MoonProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    // Handle guaranteed moon movement
    if (this.type === "guaranteedmoon") {
      return window.MoonhowlModule.handleGuaranteedMoonUpdate(this);
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Handle wall bouncing for regular and full moons
    const margin = this.size;
    let bounced = false;
    
    if (this.x <= margin || this.x >= canvas.width - margin) {
      this.vx = -this.vx;
      this.x = Math.max(margin, Math.min(canvas.width - margin, this.x));
      bounced = true;
    }
    
    if (this.y <= margin || this.y >= canvas.height - margin) {
      this.vy = -this.vy;
      this.y = Math.max(margin, Math.min(canvas.height - margin, this.y));
      bounced = true;
    }
    
    if (bounced) {
      this.data.bounceCount++;
      
      // Handle Full Moon border bouncing
      if (this.type === "fullmoon" && this.data.bounceCount >= this.data.maxBounces) {
        if (window.MoonhowlModule) {
          MoonhowlModule.handleFullMoonBorderHit(this);
        }
        return false;
      }
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Different effects for different moon types
    if (this.type === "fullmoon") {
      // Full Moon - bright golden glow
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 20;
      
      // Intense pulsing
      const pulse = Math.sin(this.age * 0.3) * 0.4 + 1.2;
      ctx.scale(pulse, pulse);
      
    } else if (this.type === "guaranteedmoon") {
      // Guaranteed Moon - red/orange glow
      ctx.shadowColor = "#ff4500";
      ctx.shadowBlur = 15;
      
      // Trail effect
      const trail = Math.sin(this.age * 0.4) * 0.3 + 1.0;
      ctx.scale(trail, trail);
      
    } else if (this.type === "wolfsense") {
      // Wolfsense - eerie blue glow
      ctx.shadowColor = "#00bfff";
      ctx.shadowBlur = 12;
      
      // Floating effect
      const float = Math.sin(this.age * 0.2) * 0.2 + 1.0;
      ctx.scale(float, float);
      
    } else {
      // Regular Moon - soft silver glow
      ctx.shadowColor = "#c0c0c0";
      ctx.shadowBlur = 8;
    }
    
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// CSS for Moonhowl effects
const moonhowlStyles = `
  @keyframes moonhowlPowerup {
    0% { box-shadow: 0 0 20px #ffd700; }
    50% { box-shadow: 0 0 40px #ffd700, 0 0 60px #ffd700; }
    100% { box-shadow: 0 0 20px #ffd700; }
  }
  
  .moonhowl-powerup {
    animation: moonhowlPowerup 1s ease-in-out;
  }
  
  @keyframes wolfsenseMarked {
    0% { box-shadow: 0 0 10px #00bfff; }
    50% { box-shadow: 0 0 20px #00bfff, 0 0 30px #00bfff; }
    100% { box-shadow: 0 0 10px #00bfff; }
  }
  
  .wolfsense-marked {
    animation: wolfsenseMarked 2s ease-in-out infinite;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = moonhowlStyles;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.MoonhowlModule = MoonhowlModule;
  window.MoonProjectile = MoonProjectile;
}