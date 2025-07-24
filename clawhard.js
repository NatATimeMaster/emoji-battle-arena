// Clawhard Character Module
// 🐯 Clawhard - Progressive windslash abilities with Life Surge

class ClawhardModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🐯") return;
    
    character.abilityData = {
      // Windslash progression system
      windslashCount: 1, // Current number of windslashes per shot
      enemyHits: 0, // Track hits on enemies for progression
      lastShotTime: 0, // Last time windslashes were fired
      baseCooldown: 120, // 2 seconds base cooldown (60fps)
      currentCooldown: 120, // Current cooldown (affected by Life Surge)
      
      // Life Surge system
      lifeSurgeActive: false,
      lifeSurgeLevel: 0, // 0=normal, 1=<50%, 2=<25%, 3=<10%
      permanentUpgrade: false, // Becomes true when reaching 25% again
      
      // Damage settings
      baseDamage: 1,
      currentDamage: 1,
      hasLifesteal: false
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐯" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Update Life Surge status
    this.updateLifeSurge(character);
    
    // Handle windslash shooting
    this.handleWindslashShooting(character, currentTime);
  }

  static updateLifeSurge(character) {
    const data = character.abilityData;
    const hpPercent = character.hp / character.maxHp;
    
    // Determine Life Surge level
    let newLevel = 0;
    if (hpPercent < 0.1) {
      newLevel = 3; // <10% HP
    } else if (hpPercent < 0.25) {
      newLevel = 2; // <25% HP
    } else if (hpPercent < 0.5) {
      newLevel = 1; // <50% HP
    }
    
    // Check for permanent upgrade trigger
    if (data.lifeSurgeLevel === 3 && newLevel === 2) {
      data.permanentUpgrade = true;
      console.log(`🐯 Clawhard reached 25% HP again - Life Surge is now PERMANENT!`);
    }
    
    data.lifeSurgeLevel = newLevel;
    
    // Apply Life Surge effects
    this.applyLifeSurgeEffects(character);
  }

  static applyLifeSurgeEffects(character) {
    const data = character.abilityData;
    const level = data.permanentUpgrade ? Math.max(data.lifeSurgeLevel, 2) : data.lifeSurgeLevel;
    
    // Set cooldown based on level
    switch (level) {
      case 0: // Normal (>50% HP)
        data.currentCooldown = data.baseCooldown; // 2 seconds
        data.currentDamage = data.baseDamage; // 1 damage
        data.hasLifesteal = false;
        break;
      case 1: // <50% HP
        data.currentCooldown = 60; // 1 second
        data.currentDamage = data.baseDamage; // 1 damage
        data.hasLifesteal = false;
        break;
      case 2: // <25% HP (or permanent)
        data.currentCooldown = 30; // 0.5 seconds
        data.currentDamage = data.baseDamage; // 1 damage
        data.hasLifesteal = false;
        break;
      case 3: // <10% HP
        data.currentCooldown = 15; // 0.25 seconds
        data.currentDamage = 2; // 2 damage
        data.hasLifesteal = true; // 1 lifesteal per hit
        break;
    }
    
    // Visual indicator for Life Surge
    if (level > 0) {
      if (!data.lifeSurgeActive) {
        data.lifeSurgeActive = true;
        console.log(`🐯 Life Surge Level ${level} activated! Cooldown: ${data.currentCooldown/60}s, Damage: ${data.currentDamage}`);
      }
    } else {
      data.lifeSurgeActive = false;
    }
  }

  static handleWindslashShooting(character, currentTime) {
    const data = character.abilityData;
    
    // Check if it's time to shoot
    if (currentTime - data.lastShotTime >= data.currentCooldown) {
      this.shootWindslashes(character, currentTime);
    }
  }

  static shootWindslashes(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate base direction towards enemy
    const baseAngle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 5;
    
    // Shoot multiple windslashes based on progression
    for (let i = 0; i < data.windslashCount; i++) {
      // Spread windslashes if multiple (slight angle variation)
      let angle = baseAngle;
      if (data.windslashCount > 1) {
        const spread = 0.3; // 0.3 radians spread
        const offset = (i - (data.windslashCount - 1) / 2) * (spread / (data.windslashCount - 1));
        angle = baseAngle + offset;
      }
      
      // Create windslash projectile
      const windslash = new Projectile(
        character.x, character.y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        "🌀", data.currentDamage, character, "windslash",
        {
          clawhardOwner: character,
          hasLifesteal: data.hasLifesteal,
          lifeSurgeLevel: data.lifeSurgeLevel
        }
      );
      
      projectiles.push(windslash);
    }
    
    data.lastShotTime = currentTime;
    
    console.log(`🐯 Clawhard shot ${data.windslashCount} windslash(es)! (${data.enemyHits} total hits)`);
    audio.shoot();
  }

  static handleWindslashHit(projectile, character) {
    if (projectile.type !== "windslash") return;
    
    const owner = projectile.owner;
    const data = projectile.data;
    
    if (character === owner) return; // Windslashes don't hit Clawhard
    
    // Deal damage
    character.takeDamage(projectile.damage, owner);
    
    // Handle lifesteal if active
    if (data.hasLifesteal && owner.hp < owner.maxHp) {
      owner.heal(1);
      console.log(`🐯 Clawhard lifesteal: healed 1 HP`);
    }
    
    // Track enemy hits for progression
    if (owner.abilityData) {
      owner.abilityData.enemyHits++;
      this.checkWindslashProgression(owner);
    }
    
    // Remove the windslash
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    audio.hit();
  }

  static checkWindslashProgression(character) {
    const data = character.abilityData;
    
    // Every 3 hits, gain another windslash
    const expectedWindslashes = Math.floor(data.enemyHits / 3) + 1;
    
    if (expectedWindslashes > data.windslashCount) {
      data.windslashCount = expectedWindslashes;
      console.log(`🐯 Clawhard progression! Now shoots ${data.windslashCount} windslashes per attack (${data.enemyHits} total hits)`);
      
      // Visual feedback for progression
      if (character.element) {
        character.element.classList.add('progression-flash');
        setTimeout(() => {
          if (character.element) {
            character.element.classList.remove('progression-flash');
          }
        }, 500);
      }
    }
  }

  static handleCharacterDeath(character) {
    // Clean up when Clawhard dies
    if (character.emoji === "🐯") {
      const data = character.abilityData;
      
      // Remove all windslash projectiles
      projectiles = projectiles.filter(p => {
        if (p.type === "windslash" && p.owner === character) {
          return false;
        }
        return true;
      });
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "🐯" || !character.abilityData) return null;
    
    const data = character.abilityData;
    return {
      windslashCount: data.windslashCount,
      enemyHits: data.enemyHits,
      lifeSurgeLevel: data.lifeSurgeLevel,
      permanentUpgrade: data.permanentUpgrade,
      currentCooldown: data.currentCooldown / 60,
      currentDamage: data.currentDamage,
      hasLifesteal: data.hasLifesteal
    };
  }
}

// Windslash Projectile class extension
class WindslashProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Check wall collision - windslashes disappear when hitting borders
    const margin = this.size;
    if (this.x <= margin || this.x >= canvas.width - margin ||
        this.y <= margin || this.y >= canvas.height - margin) {
      const index = projectiles.indexOf(this);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      return false;
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add windslash-specific effects
    if (this.data.lifeSurgeLevel >= 3) {
      // Enhanced windslash at 10% HP
      ctx.shadowColor = "#ff6600";
      ctx.shadowBlur = 15;
      
      // Intense spinning for enhanced windslashes
      const rotation = this.age * 0.4;
      ctx.translate(this.x, this.y);
      ctx.rotate(rotation);
      
      // Pulsing effect
      const pulse = Math.sin(this.age * 0.3) * 0.3 + 1.0;
      ctx.scale(pulse, pulse);
      
    } else if (this.data.lifeSurgeLevel >= 1) {
      // Life Surge active
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 10;
      
      // Normal spinning
      const rotation = this.age * 0.2;
      ctx.translate(this.x, this.y);
      ctx.rotate(rotation);
      
    } else {
      // Normal windslash
      ctx.shadowColor = "#88ccff";
      ctx.shadowBlur = 8;
      
      // Slow spinning
      const rotation = this.age * 0.15;
      ctx.translate(this.x, this.y);
      ctx.rotate(rotation);
    }
    
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

// CSS for progression flash effect
const clawhardStyles = `
  @keyframes progressionFlash {
    0% { box-shadow: 0 0 10px #00ff88; }
    50% { box-shadow: 0 0 30px #00ff88, 0 0 40px #00ff88; }
    100% { box-shadow: 0 0 10px #00ff88; }
  }
  
  .progression-flash {
    animation: progressionFlash 0.5s ease-in-out;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = clawhardStyles;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.ClawhardModule = ClawhardModule;
  window.WindslashProjectile = WindslashProjectile;
}