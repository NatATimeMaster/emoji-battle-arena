// Moonhowl Character Module
// 🐺 Moonhowl - Moon projectiles with Full Moon Rage and Wolfsense mechanics

class MoonhowlModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🐺") return;
    
    character.abilityData = {
      lastMoonTime: 0,
      moonCooldown: 120, // 2 seconds
      enhancedMoonHits: 0,
      requiredHits: 3,
      
      // Full Moon state
      fullMoonActive: false,
      fullMoonRageActive: false,
      rageEndTime: 0,
      rageMoonCount: 0,
      rageDuration: 720, // 12 seconds
      
      // Wolfsense system
      wolfsenseActive: false,
      wolfsenseTarget: null,
      wolfsenseEndTime: 0,
      wolfsenseDuration: 600, // 10 seconds
      guaranteedHits: 0,
      guaranteedHitsRemaining: 0
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐺" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Handle Full Moon Rage
    this.handleFullMoonRage(character, currentTime);
    
    // Handle Wolfsense
    this.handleWolfsense(character, currentTime);
    
    // Handle moon shooting
    this.handleMoonShooting(character, currentTime);
  }

  static handleMoonShooting(character, currentTime) {
    const data = character.abilityData;
    
    // Determine cooldown based on rage state
    let currentCooldown = data.moonCooldown;
    if (data.fullMoonRageActive) {
      currentCooldown = 30; // 0.5 seconds during rage
    }
    
    if (currentTime - data.lastMoonTime >= currentCooldown) {
      this.shootMoon(character);
      data.lastMoonTime = currentTime;
    }
  }

  static shootMoon(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate direction
    let angle, speed = 3;
    
    if (data.guaranteedHitsRemaining > 0) {
      // Wolfsense guaranteed hit
      angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
      data.guaranteedHitsRemaining--;
    } else {
      // Normal shooting
      angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    }
    
    // Create moon projectile
    const moon = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🌙", 1, character, "moon",
      {
        moonhowlOwner: character,
        isGuaranteedHit: data.guaranteedHitsRemaining >= 0
      }
    );
    
    projectiles.push(moon);
    
    console.log("🐺 Moonhowl shoots moon!");
    audio.shoot();
  }

  static handleMoonHit(projectile, character) {
    if (character.team === projectile.owner.team) return;
    
    const moonhowl = projectile.owner;
    
    // Apply damage
    character.takeDamage(1, moonhowl);
    
    // Track enhanced moon hits for Full Moon trigger
    moonhowl.abilityData.enhancedMoonHits++;
    
    console.log(`🌙 Moon hit! Enhanced hits: ${moonhowl.abilityData.enhancedMoonHits}/${moonhowl.abilityData.requiredHits}`);
    
    // Check for Full Moon trigger
    if (moonhowl.abilityData.enhancedMoonHits >= moonhowl.abilityData.requiredHits) {
      this.triggerFullMoon(moonhowl, character);
    }
    
    // Remove moon
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static triggerFullMoon(moonhowl, enemy) {
    const data = moonhowl.abilityData;
    
    // Clear all existing moons
    projectiles = projectiles.filter(p => p.type !== "moon" || p.owner !== moonhowl);
    
    // Reset enhanced hit counter
    data.enhancedMoonHits = 0;
    
    // Create Full Moon
    const fullMoon = new Projectile(
      moonhowl.x, moonhowl.y,
      (Math.random() * 2 - 1) * 2, (Math.random() * 2 - 1) * 2,
      "🌕", 8, moonhowl, "fullmoon",
      {
        moonhowlOwner: moonhowl,
        bounces: 0,
        finalBounce: false
      }
    );
    
    projectiles.push(fullMoon);
    
    console.log("🐺 FULL MOON activated! All moons vanished.");
    audio.ability();
  }

  static handleFullMoonHit(projectile, character) {
    const moonhowl = projectile.owner;
    
    if (character.team === moonhowl.team) {
      // Full Moon hit Moonhowl - activate rage
      this.activateFullMoonRage(moonhowl);
    } else {
      // Full Moon hit enemy - deal 8 damage
      character.takeDamage(8, moonhowl);
      console.log("🌕 Full Moon hit enemy for 8 damage!");
    }
    
    // Remove Full Moon
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static handleFullMoonWallBounce(projectile) {
    projectile.data.bounces++;
    
    // On final bounce, determine effect
    if (projectile.data.bounces >= 3) {
      this.triggerWolfsense(projectile.owner);
      
      // Remove Full Moon
      const index = projectiles.indexOf(projectile);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      
      return false; // Remove projectile
    }
    
    return true; // Continue bouncing
  }

  static activateFullMoonRage(moonhowl) {
    const data = moonhowl.abilityData;
    const currentTime = gameTime;
    
    data.fullMoonRageActive = true;
    data.rageEndTime = currentTime + data.rageDuration;
    data.rageMoonCount = 0;
    
    // Double Moonhowl's size
    moonhowl.size *= 2;
    
    console.log("🐺 Full Moon Rage activated! Moonhowl doubles in size and shoots rapidly!");
    audio.ability();
  }

  static handleFullMoonRage(character, currentTime) {
    const data = character.abilityData;
    
    if (!data.fullMoonRageActive) return;
    
    // Check if rage expired
    if (currentTime >= data.rageEndTime) {
      this.endFullMoonRage(character);
      return;
    }
    
    // Rage is active - rapid moon shooting is handled in handleMoonShooting
  }

  static endFullMoonRage(character) {
    const data = character.abilityData;
    
    data.fullMoonRageActive = false;
    data.rageMoonCount = 0;
    
    // Reset size
    character.size = character.baseSize || 16;
    
    console.log("🐺 Full Moon Rage ended!");
  }

  static triggerWolfsense(moonhowl) {
    const enemy = moonhowl.getNearestEnemy();
    if (!enemy) return;
    
    const data = moonhowl.abilityData;
    const currentTime = gameTime;
    
    data.wolfsenseActive = true;
    data.wolfsenseTarget = enemy;
    data.wolfsenseEndTime = currentTime + data.wolfsenseDuration;
    data.guaranteedHits = 10;
    data.guaranteedHitsRemaining = 10;
    
    // Apply mark to enemy
    enemy.isMarked = true;
    enemy.markedBy = moonhowl;
    
    console.log("👁️‍🗨️ Wolfsense activated! Enemy marked for 10 guaranteed moon hits!");
    audio.ability();
  }

  static handleWolfsense(character, currentTime) {
    const data = character.abilityData;
    
    if (!data.wolfsenseActive) return;
    
    // Check if Wolfsense expired
    if (currentTime >= data.wolfsenseEndTime) {
      this.endWolfsense(character);
      return;
    }
    
    // Check if enemy hit Moonhowl (breaks Wolfsense)
    if (data.wolfsenseTarget && data.wolfsenseTarget.hasHitRecently) {
      this.endWolfsense(character);
      return;
    }
  }

  static endWolfsense(character) {
    const data = character.abilityData;
    
    data.wolfsenseActive = false;
    data.guaranteedHitsRemaining = 0;
    
    // Remove mark from enemy
    if (data.wolfsenseTarget) {
      data.wolfsenseTarget.isMarked = false;
      data.wolfsenseTarget.markedBy = null;
      data.wolfsenseTarget = null;
    }
    
    console.log("👁️‍🗨️ Wolfsense ended!");
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "🐺") return;
    
    // End all active effects
    this.endFullMoonRage(character);
    this.endWolfsense(character);
    
    console.log("🐺 Moonhowl died, all effects ended");
  }
}

class MoonProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.MoonhowlModule = MoonhowlModule;