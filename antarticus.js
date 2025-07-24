// Antarticus Character Module
// 🐻‍❄️ Antarticus - Frozeflake shooting with escalating freeze and Polar Execution

class AntarticusModule {
  static frozeflakeProjectiles = []; // Track Frozeflakes for cleanup

  static initializeAbilities(character) {
    if (character.emoji !== "🐻‍❄️") return;
    
    character.abilityData = {
      // Frozeflake shooting mechanics
      lastShotTime: 0,
      shootCooldown: 180, // 3 seconds
      
      // Frozen Veins system
      enemyHitCount: 0, // Track successful Frozeflake hits
      targetEnemy: null, // Track which enemy we're hitting
      
      // Polar Execution
      executionReady: false,
      isCharging: false,
      chargeStartTime: 0,
      chargeDuration: 120, // 2 seconds charge time
      originalSpeed: 0,
      
      // Direct hit mechanics
      canDirectHit: false // Only when enemy is frozen
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐻‍❄️" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle Polar Execution charge
    if (data.isCharging) {
      this.handlePolarExecutionCharge(character, currentTime);
      return; // Skip normal abilities during charge
    }
    
    // Check for Polar Execution trigger
    if (data.executionReady && !data.isCharging) {
      this.triggerPolarExecution(character);
      return;
    }
    
    // Handle Frozeflake shooting
    this.handleFrozeflakeShooting(character, currentTime);
    
    // Update direct hit capability
    this.updateDirectHitCapability(character);
    
    // Clean up old Frozeflakes
    this.cleanupFrozeflakeProjectiles();
  }

  static handleFrozeflakeShooting(character, currentTime) {
    const data = character.abilityData;
    
    // Check if it's time to shoot
    if (currentTime - data.lastShotTime >= data.shootCooldown) {
      this.shootFrozeflake(character, currentTime);
    }
  }

  static shootFrozeflake(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 4;
    
    // Create Frozeflake projectile
    const frozeflake = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "❄️", 0, character, "frozeflake",
      {
        antarticusOwner: character,
        bounceCount: 0,
        maxBounces: 5,
        targetEnemy: enemy
      }
    );
    
    projectiles.push(frozeflake);
    this.frozeflakeProjectiles.push(frozeflake);
    data.lastShotTime = currentTime;
    
    console.log(`🐻‍❄️ Antarticus shot Frozeflake! (${data.enemyHitCount}/10 hits)`);
    audio.shoot();
  }

  static handleFrozeflakeHit(projectile, character) {
    if (projectile.type !== "frozeflake") return;
    
    const owner = projectile.owner;
    
    if (character === owner) return; // Frozeflakes don't hit Antarticus
    
    // Check if enemy is already frozen
    if (character.isFrozen) {
      // Bounce off frozen enemies without effect
      console.log(`❄️ Frozeflake bounced off frozen enemy!`);
      return; // Don't remove the projectile, let it continue bouncing
    }
    
    // Apply freeze effect and damage
    this.applyFreezeEffect(owner, character);
    
    // Remove the Frozeflake
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    const frozeIndex = this.frozeflakeProjectiles.indexOf(projectile);
    if (frozeIndex > -1) {
      this.frozeflakeProjectiles.splice(frozeIndex, 1);
    }
    
    audio.hit();
  }

  static applyFreezeEffect(antarticus, enemy) {
    const data = antarticus.abilityData;
    
    // Track hits on the same enemy
    if (data.targetEnemy === enemy) {
      data.enemyHitCount++;
    } else {
      // Reset if hitting different enemy
      data.targetEnemy = enemy;
      data.enemyHitCount = 1;
    }
    
    // Calculate freeze duration (3 + hit count - 1)
    const freezeDuration = (2 + data.enemyHitCount) * 60; // Convert to frames
    
    // Apply freeze
    enemy.freeze(freezeDuration);
    
    // Start damage over time
    this.startFreezeDoT(enemy, freezeDuration);
    
    console.log(`❄️ Enemy frozen for ${2 + data.enemyHitCount} seconds! (Hit ${data.enemyHitCount}/10)`);
    
    // Check for Polar Execution trigger
    if (data.enemyHitCount >= 10) {
      data.executionReady = true;
      console.log(`🧊 POLAR EXECUTION ready!`);
    }
  }

  static startFreezeDoT(enemy, duration) {
    // Apply 1 damage per second while frozen
    const damageInterval = 60; // 1 second in frames
    let remainingTime = duration;
    
    const dotTimer = setInterval(() => {
      if (enemy.isDead || remainingTime <= 0 || !enemy.isFrozen) {
        clearInterval(dotTimer);
        return;
      }
      
      enemy.takeDamage(1, null); // Freeze damage doesn't count as direct hit
      remainingTime -= damageInterval;
      
      console.log(`❄️ Freeze DoT: 1 damage (${Math.ceil(remainingTime/60)}s remaining)`);
    }, damageInterval * (1000/60)); // Convert to milliseconds
  }

  static updateDirectHitCapability(character) {
    const data = character.abilityData;
    const enemy = data.targetEnemy;
    
    // Can only direct hit if target enemy is frozen
    data.canDirectHit = enemy && enemy.isFrozen && !enemy.isDead;
  }

  static handleDirectHit(antarticus, enemy) {
    if (!antarticus.abilityData || antarticus.abilityData.isCharging) return false;
    
    const data = antarticus.abilityData;
    
    // Check if direct hit is allowed
    if (!data.canDirectHit || enemy !== data.targetEnemy) {
      return false; // No direct hit damage
    }
    
    // Deal 3 damage
    enemy.takeDamage(3, antarticus);
    
    // Remove freeze effect
    if (enemy.isFrozen) {
      enemy.isFrozen = false;
      enemy.freezeTime = 0;
      
      // Remove visual freeze effect
      if (enemy.element) {
        enemy.element.classList.remove('frozen');
      }
    }
    
    console.log(`🐻‍❄️ Antarticus direct hit: 3 damage + freeze removed!`);
    audio.hit();
    
    return true;
  }

  static triggerPolarExecution(character) {
    const data = character.abilityData;
    const enemy = data.targetEnemy;
    
    if (!enemy || enemy.isDead) {
      // Reset if target is gone
      data.executionReady = false;
      return;
    }
    
    // Start charging
    data.isCharging = true;
    data.chargeStartTime = gameTime;
    data.originalSpeed = character.speed || 2;
    
    // Visual effect for charging
    if (character.element) {
      character.element.classList.add('polar-execution-charging');
    }
    
    console.log(`🧊 POLAR EXECUTION charging at enemy!`);
  }

  static handlePolarExecutionCharge(character, currentTime) {
    const data = character.abilityData;
    const enemy = data.targetEnemy;
    
    if (!enemy || enemy.isDead) {
      this.endPolarExecution(character, false);
      return;
    }
    
    // Move directly towards enemy at high speed
    const dx = enemy.x - character.x;
    const dy = enemy.y - character.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 30) {
      // Hit the enemy
      this.executePolarStrike(character, enemy);
      return;
    }
    
    // Check charge timeout
    if (currentTime - data.chargeStartTime >= data.chargeDuration) {
      this.endPolarExecution(character, false);
      return;
    }
    
    // Continue charging
    const chargeSpeed = 8; // Very fast charge
    character.vx = (dx / distance) * chargeSpeed;
    character.vy = (dy / distance) * chargeSpeed;
  }

  static executePolarStrike(character, enemy) {
    const data = character.abilityData;
    
    // Deal 10 damage
    enemy.takeDamage(10, character);
    
    // Reset hit counter
    data.enemyHitCount = 0;
    data.executionReady = false;
    
    console.log(`🧊 POLAR EXECUTION strike: 10 damage! Hit counter reset.`);
    
    // End charge
    this.endPolarExecution(character, true);
    
    audio.hit();
  }

  static endPolarExecution(character, successful) {
    const data = character.abilityData;
    
    data.isCharging = false;
    character.vx = 0;
    character.vy = 0;
    
    // Remove visual effect
    if (character.element) {
      character.element.classList.remove('polar-execution-charging');
      
      if (successful) {
        character.element.classList.add('polar-execution-success');
        setTimeout(() => {
          if (character.element) {
            character.element.classList.remove('polar-execution-success');
          }
        }, 1000);
      }
    }
    
    console.log(`🧊 Polar Execution ${successful ? 'completed' : 'ended'}`);
  }

  static cleanupFrozeflakeProjectiles() {
    // Clean up Frozeflakes that no longer exist
    this.frozeflakeProjectiles = this.frozeflakeProjectiles.filter(froze => 
      projectiles.includes(froze)
    );
  }

  static handleCharacterDeath(character) {
    // Clean up when Antarticus dies
    if (character.emoji === "🐻‍❄️") {
      // Remove all Frozeflake projectiles
      projectiles = projectiles.filter(p => p.type !== "frozeflake");
      this.frozeflakeProjectiles = [];
    }
    
    // Clean up freeze effects if frozen character dies
    charactersInArena.forEach(c => {
      if (c.emoji === "🐻‍❄️" && c.abilityData && c.abilityData.targetEnemy === character) {
        c.abilityData.targetEnemy = null;
        c.abilityData.enemyHitCount = 0;
        c.abilityData.executionReady = false;
      }
    });
  }

  static getStatusInfo(character) {
    if (character.emoji !== "🐻‍❄️" || !character.abilityData) return null;
    
    const data = character.abilityData;
    return {
      enemyHits: data.enemyHitCount,
      executionReady: data.executionReady,
      isCharging: data.isCharging,
      canDirectHit: data.canDirectHit,
      targetEnemy: data.targetEnemy ? data.targetEnemy.emoji : null,
      activeFrozeflakes: this.frozeflakeProjectiles.length
    };
  }
}

// Frozeflake Projectile class extension
class FrozeflakeProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Handle wall bouncing
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
      
      // Disappear after 5th bounce
      if (this.data.bounceCount >= this.data.maxBounces) {
        const index = projectiles.indexOf(this);
        if (index > -1) {
          projectiles.splice(index, 1);
        }
        
        if (window.AntarticusModule) {
          const frozeIndex = AntarticusModule.frozeflakeProjectiles.indexOf(this);
          if (frozeIndex > -1) {
            AntarticusModule.frozeflakeProjectiles.splice(frozeIndex, 1);
          }
        }
        
        console.log(`❄️ Frozeflake disappeared after ${this.data.bounceCount} bounces`);
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
    
    // Frozeflake-specific visual effects
    ctx.shadowColor = "#87ceeb"; // Sky blue glow
    ctx.shadowBlur = 12;
    
    // Spinning ice effect
    const rotation = this.age * 0.2;
    ctx.translate(this.x, this.y);
    ctx.rotate(rotation);
    
    // Fading effect based on bounce count
    const fadeLevel = 1.0 - (this.data.bounceCount / this.data.maxBounces * 0.3);
    ctx.globalAlpha = fadeLevel;
    
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

// CSS for Antarticus effects
const antarticusStyles = `
  @keyframes polarExecutionCharging {
    0% { 
      box-shadow: 0 0 20px #00bfff; 
      transform: scale(1.0);
    }
    50% { 
      box-shadow: 0 0 40px #00bfff, 0 0 60px #87ceeb; 
      transform: scale(1.1);
    }
    100% { 
      box-shadow: 0 0 20px #00bfff; 
      transform: scale(1.0);
    }
  }
  
  .polar-execution-charging {
    animation: polarExecutionCharging 0.5s ease-in-out infinite;
  }
  
  @keyframes polarExecutionSuccess {
    0% { 
      box-shadow: 0 0 30px #ffffff; 
      transform: scale(1.0);
    }
    50% { 
      box-shadow: 0 0 60px #ffffff, 0 0 80px #87ceeb; 
      transform: scale(1.3);
    }
    100% { 
      box-shadow: 0 0 10px #87ceeb; 
      transform: scale(1.0);
    }
  }
  
  .polar-execution-success {
    animation: polarExecutionSuccess 1s ease-out;
  }
  
  @keyframes frozen {
    0% { 
      box-shadow: 0 0 15px #87ceeb; 
      filter: brightness(0.8) hue-rotate(180deg);
    }
    50% { 
      box-shadow: 0 0 25px #87ceeb, 0 0 35px #00bfff; 
      filter: brightness(0.6) hue-rotate(180deg);
    }
    100% { 
      box-shadow: 0 0 15px #87ceeb; 
      filter: brightness(0.8) hue-rotate(180deg);
    }
  }
  
  .frozen {
    animation: frozen 2s ease-in-out infinite;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = antarticusStyles;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.AntarticusModule = AntarticusModule;
  window.FrozeflakeProjectile = FrozeflakeProjectile;
}