// Demonlord Character Module
// 😈 Demonlord - Fire projectiles with Hell's Trial arena effects

class DemonlordModule {
  static initializeAbilities(character) {
    if (character.emoji !== "😈") return;
    
    character.abilityData = {
      wallsHit: new Set(), // Track which walls have been hit by fire
      hellsTrialTriggers: 0, // Number of times Hell's Trial has been activated
      hellsTrialActive: false, // Whether Hell's Trial is currently active
      lastFireTime: 0, // Last time fire was shot
      fireMultiplier: 1 // Damage multiplier for fire hits
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "😈" || character.isDead) return;
    
    const currentTime = gameTime;
    const FIRE_COOLDOWN = 180; // 3 seconds at 60fps
    
    // Fire projectiles every 3 seconds
    if (currentTime - character.abilityData.lastFireTime >= FIRE_COOLDOWN) {
      this.fireFire(character);
      character.abilityData.lastFireTime = currentTime;
    }
  }

  static fireFire(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create fire projectile
    const fire = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🔥", character.abilityData.fireMultiplier, character, "fire",
      { 
        wallsHitTracker: character.abilityData.wallsHit,
        owner: character,
        burnDamage: 1
      }
    );
    
    projectiles.push(fire);
    audio.shoot();
    console.log("🔥 Demonlord fires!");
  }

  static handleFireHit(projectile, character) {
    if (character.team === projectile.owner.team) return;
    
    console.log(`🔥 Fire hit ${character.emoji}!`);
    character.takeDamage(projectile.damage, projectile.owner);
    audio.hit();
  }

  static handleFireWallHit(projectile, side) {
    if (!projectile.data.wallsHitTracker) return;
    
    projectile.data.wallsHitTracker.add(side);
    console.log(`🔥 Fire hit ${side} wall! Total unique walls hit: ${projectile.data.wallsHitTracker.size}`);
    
    // Check if all 4 walls have been hit
    if (projectile.data.wallsHitTracker.size >= 4 && projectile.owner) {
      this.activateHellsTrial(projectile.owner);
    }
  }

  static activateHellsTrial(character) {
    if (character.abilityData.hellsTrialActive) return;
    
    character.abilityData.hellsTrialActive = true;
    character.abilityData.hellsTrialTriggers++;
    character.abilityData.fireMultiplier = 2; // Double fire damage during Hell's Trial
    
    // Apply visual effect to arena
    const canvas = document.getElementById('arena');
    canvas.classList.add('hell-trial');
    
    console.log("🔥 HELL'S TRIAL ACTIVATED! Arena becomes hellish!");
    audio.ability();
    
    // Hell's Trial lasts for 10 seconds
    setTimeout(() => {
      character.abilityData.hellsTrialActive = false;
      character.abilityData.fireMultiplier = 1; // Reset fire damage
      canvas.classList.remove('hell-trial');
      console.log("🔥 Hell's Trial ended");
    }, 6000); // 10 seconds
  }

  static applyHellsTrialDamage() {
    const canvas = document.getElementById('arena');
    if (!canvas.classList.contains('hell-trial')) return;
    
    // Apply damage to all non-Demonlord characters every 2 seconds
    charactersInArena.forEach(character => {
      if (character.emoji !== "😈" && !character.isDead && gameTime % 120 === 0) { // Every 2 seconds
        character.takeDamage(1);
        console.log(`🔥 Hell's Trial burns ${character.emoji} for 1 damage!`);
      }
    });
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "😈") return;
    
    // End Hell's Trial if Demonlord dies
    character.abilityData.hellsTrialActive = false;
    const canvas = document.getElementById('arena');
    canvas.classList.remove('hell-trial');
  }
}

class FireProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.DemonlordModule = DemonlordModule;