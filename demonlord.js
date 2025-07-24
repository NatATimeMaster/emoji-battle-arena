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
  }

  static handleFireWallHit(projectile, side) {
    const owner = projectile.owner;
    if (!owner || owner.emoji !== "😈") return;
    
    // Track wall hits
    owner.abilityData.wallsHit.add(side);
    
    // Check if all 4 walls have been hit
    if (owner.abilityData.wallsHit.size === 4) {
      this.triggerHellsTrial(owner);
      owner.abilityData.wallsHit.clear(); // Reset for next trigger
    }
  }

  static triggerHellsTrial(demonlord) {
    demonlord.abilityData.hellsTrialTriggers++;
    demonlord.abilityData.hellsTrialActive = true;
    
    // Update fire damage multiplier
    demonlord.abilityData.fireMultiplier = demonlord.abilityData.hellsTrialTriggers;
    
    // Activate Hell's Trial for all enemies
    charactersInArena.forEach(character => {
      if (character.team !== demonlord.team && !character.isDead) {
        character.abilityData.hellsTrialActive = true;
        character.abilityData.hellsTrialDemonlord = demonlord;
      }
    });
    
    // Visual effect: Turn arena red
    const canvas = document.getElementById('arena');
    canvas.classList.add('hell-trial');
    
    console.log(`Hell's Trial activated! Trigger count: ${demonlord.abilityData.hellsTrialTriggers}`);
    audio.ability();
  }

  static handleFireHit(projectile, character) {
    if (projectile.type !== "fire" || character === projectile.owner) return;
    
    const owner = projectile.owner;
    const baseDamage = 1;
    const multiplier = owner.abilityData.fireMultiplier || 1;
    const directDamage = baseDamage * multiplier;
    
    // Apply direct fire damage
    character.takeDamage(directDamage, owner);
    
    // Apply burn damage after a delay
    setTimeout(() => {
      if (!character.isDead) {
        character.takeDamage(projectile.data.burnDamage || 1, owner);
        console.log(`Burn damage applied: ${projectile.data.burnDamage || 1}`);
      }
    }, 1000); // 1 second delay for burn
    
    console.log(`Fire hit: ${directDamage} direct + ${projectile.data.burnDamage || 1} burn = ${directDamage + (projectile.data.burnDamage || 1)} total`);
  }

  static applyHellsTrialDamage() {
    // Apply Hell's Trial damage every second (60 frames)
    if (gameTime % 60 !== 0) return;
    
    charactersInArena.forEach(character => {
      if (character.abilityData.hellsTrialActive && !character.isDead) {
        const demonlord = character.abilityData.hellsTrialDemonlord;
        if (demonlord && !demonlord.isDead) {
          const damagePerSecond = Math.min(2, demonlord.abilityData.hellsTrialTriggers);
          character.takeDamage(damagePerSecond);
          console.log(`Hell's Trial damage: ${damagePerSecond} to ${character.emoji}`);
        }
      }
    });
  }

  static handleCharacterDeath(character) {
    // Clean up Hell's Trial effects when Demonlord dies
    if (character.emoji === "😈" && character.abilityData.hellsTrialActive) {
      charactersInArena.forEach(c => {
        if (c.abilityData.hellsTrialDemonlord === character) {
          c.abilityData.hellsTrialActive = false;
          c.abilityData.hellsTrialDemonlord = null;
        }
      });
      
      // Remove red arena effect if no other Demonlords are active
      const activeDemonlords = charactersInArena.filter(c => 
        c.emoji === "😈" && !c.isDead && c.abilityData.hellsTrialActive
      );
      
      if (activeDemonlords.length === 0) {
        const canvas = document.getElementById('arena');
        canvas.classList.remove('hell-trial');
      }
    }
  }
}

// Fire Projectile class extension
class FireProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
    this.hasHitWall = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    if (this.age > this.lifetime) {
      return false;
    }

    // Check wall collision
    const margin = this.size;
    let hitWall = false;
    let hitSide = null;

    if (this.x <= margin) {
      hitSide = 'left';
      hitWall = true;
    } else if (this.x >= canvas.width - margin) {
      hitSide = 'right';
      hitWall = true;
    } else if (this.y <= margin) {
      hitSide = 'top';
      hitWall = true;
    } else if (this.y >= canvas.height - margin) {
      hitSide = 'bottom';
      hitWall = true;
    }

    if (hitWall && !this.hasHitWall) {
      this.hasHitWall = true;
      DemonlordModule.handleFireWallHit(this, hitSide);
      return false; // Fire stops when hitting wall
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Fire glow effect
    ctx.shadowColor = "#ff4444";
    ctx.shadowBlur = 10;
    
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.DemonlordModule = DemonlordModule;
  window.FireProjectile = FireProjectile;
}