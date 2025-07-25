// Clawhard Character Module
// 🐯 Clawhard - Progressive windslash system with Life Surge mechanics

class ClawhardModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🐯") return;
    
    character.abilityData = {
      enemyHits: 0,
      windslashCount: 1,
      lastWindslashTime: 0,
      baseCooldown: 120, // 2 seconds
      currentCooldown: 120,
      
      // Life Surge mechanics
      lifeSurgeLevel: 0, // 0 = none, 1 = 50%, 2 = 25%, 3 = 10%
      lifeSurgeActive: false,
      permanentUpgrade: false
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐯" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Update Life Surge state
    this.updateLifeSurge(character);
    
    // Handle windslash shooting
    this.handleWindslashShooting(character, currentTime);
  }

  static updateLifeSurge(character) {
    const data = character.abilityData;
    const hpPercent = character.hp / character.maxHp;
    
    let newLevel = 0;
    let newCooldown = data.baseCooldown;
    
    if (hpPercent <= 0.1) {
      // 10% HP or below
      newLevel = 3;
      newCooldown = 15; // 0.25 seconds
    } else if (hpPercent <= 0.25) {
      // 25% HP or below
      newLevel = 2;
      newCooldown = 30; // 0.5 seconds
    } else if (hpPercent <= 0.5) {
      // 50% HP or below
      newLevel = 1;
      newCooldown = 60; // 1 second
    }
    
    // Check for permanent upgrade trigger
    if (newLevel >= 1 && !data.permanentUpgrade) {
      data.permanentUpgrade = true;
      console.log("🐯 Life Surge permanent upgrade unlocked!");
    }
    
    // Apply permanent upgrade (stays active even when HP recovers)
    if (data.permanentUpgrade && newLevel === 0) {
      newLevel = 1;
      newCooldown = 60;
    }
    
    // Update if changed
    if (newLevel !== data.lifeSurgeLevel) {
      data.lifeSurgeLevel = newLevel;
      data.currentCooldown = newCooldown;
      
      if (newLevel > 0) {
        this.applyLifeSurgeEffects(character);
      }
      
      console.log(`🐯 Life Surge level: ${newLevel} (cooldown: ${newCooldown/60}s)`);
    }
  }

  static applyLifeSurgeEffects(character) {
    const data = character.abilityData;
    
    // Visual effect based on level
    if (character.element) {
      character.element.classList.remove('progressionFlash');
      setTimeout(() => {
        character.element.classList.add('progressionFlash');
      }, 10);
    }
    
    audio.ability();
  }

  static handleWindslashShooting(character, currentTime) {
    const data = character.abilityData;
    
    if (currentTime - data.lastWindslashTime >= data.currentCooldown) {
      this.shootWindslashes(character, currentTime);
      data.lastWindslashTime = currentTime;
    }
  }

  static shootWindslashes(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate base direction towards enemy
    const baseAngle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 4;
    
    // Shoot multiple windslashes based on hit count
    for (let i = 0; i < data.windslashCount; i++) {
      // Spread windslashes if multiple
      const angleOffset = data.windslashCount > 1 ? (i - (data.windslashCount - 1) / 2) * 0.3 : 0;
      const angle = baseAngle + angleOffset;
      
      // Determine damage and effects
      let damage = 1;
      let hasLifesteal = false;
      
      if (data.lifeSurgeLevel >= 3) {
        damage = 2; // Double damage at 10% HP
        hasLifesteal = true; // Lifesteal at 10% HP
      }
      
      // Create windslash projectile
      const windslash = new Projectile(
        character.x, character.y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        "🌀", damage, character, "windslash",
        {
          clawhardOwner: character,
          lifeSurgeLevel: data.lifeSurgeLevel,
          hasLifesteal: hasLifesteal
        }
      );
      
      projectiles.push(windslash);
    }
    
    console.log(`🐯 Clawhard shoots ${data.windslashCount} windslash(es)!`);
    audio.shoot();
  }

  static handleWindslashHit(projectile, character) {
    if (character.team === projectile.owner.team) return;
    
    const clawhard = projectile.owner;
    const data = projectile.data;
    
    // Apply damage
    character.takeDamage(projectile.damage, clawhard);
    
    // Apply lifesteal if applicable
    if (data.hasLifesteal && clawhard.hp < clawhard.maxHp) {
      clawhard.heal(1);
      console.log("🌀 Windslash lifesteal: +1 HP to Clawhard");
    }
    
    // Track enemy hit
    clawhard.abilityData.enemyHits++;
    
    console.log(`🌀 Windslash hit for ${projectile.damage} damage! Total hits: ${clawhard.abilityData.enemyHits}`);
    
    // Check for windslash progression
    this.checkWindslashProgression(clawhard);
    
    // Remove windslash
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static checkWindslashProgression(character) {
    const data = character.abilityData;
    
    // Every 3 hits, gain another windslash
    const newWindslashCount = Math.floor(data.enemyHits / 3) + 1;
    
    if (newWindslashCount > data.windslashCount) {
      data.windslashCount = newWindslashCount;
      
      console.log(`🐯 Windslash progression! Now shoots ${data.windslashCount} windslashes!`);
      
      // Visual effect
      if (character.element) {
        character.element.classList.add('progressionFlash');
        setTimeout(() => {
          character.element.classList.remove('progressionFlash');
        }, 500);
      }
      
      audio.ability();
    }
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "🐯") return;
    
    console.log("🐯 Clawhard died, Life Surge ended");
  }
}

class WindslashProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.ClawhardModule = ClawhardModule;