// Deathblow Character Module
// 💀 Deathblow - Direct hits and Dangerskull spawning from collisions

class DeathblowModule {
  static initializeAbilities(character) {
    if (character.emoji !== "💀") return;
    
    character.abilityData = {
      // Direct hit mechanics
      enemyHitsCount: 0, // Number of times Deathblow has hit enemies directly
      
      // Dangerskull mechanics
      activeDangerskulls: [], // Array of active Dangerskull projectiles
      maxDangerskulls: 0, // Maximum Dangerskulls based on enemy hits
      dangerskullLifetime: 600, // 10 seconds at 60fps
      
      // Collision tracking
      lastWallHitTime: 0, // Prevent spam from continuous wall contact
      wallHitCooldown: 30, // Half second cooldown between wall hit spawns
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "💀" || character.isDead) return;
    
    // Update max Dangerskulls based on enemy hits
    character.abilityData.maxDangerskulls = character.abilityData.enemyHitsCount;
    
    // Clean up expired Dangerskulls
    this.cleanupExpiredDangerskulls(character);
  }

  static handleWallCollision(character, side) {
    if (character.emoji !== "💀") return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Prevent spam spawning from continuous wall contact
    if (currentTime - data.lastWallHitTime < data.wallHitCooldown) return;
    
    // Spawn Dangerskull if under limit
    if (data.activeDangerskulls.length < data.maxDangerskulls) {
      this.spawnDangerskull(character, side, 'wall');
      data.lastWallHitTime = currentTime;
    }
  }

  static handleEnemyHit(deathblow, enemy) {
    if (deathblow.emoji !== "💀") return;
    
    const data = deathblow.abilityData;
    
    // Apply direct hit damage (3 damage)
    enemy.takeDamage(3, deathblow);
    
    // Increment enemy hit count
    data.enemyHitsCount++;
    
    // Spawn Dangerskull if under limit
    if (data.activeDangerskulls.length < data.maxDangerskulls) {
      this.spawnDangerskull(deathblow, null, 'enemy');
    }
    
    console.log(`Deathblow direct hit! 3 damage. Enemy hits: ${data.enemyHitsCount}, Max skulls: ${data.maxDangerskulls}`);
    audio.hit();
  }

  static spawnDangerskull(deathblow, wallSide = null, source = 'wall') {
    const data = deathblow.abilityData;
    
    // Calculate spawn direction
    let angle;
    if (source === 'wall' && wallSide) {
      // Spawn Dangerskull away from the wall
      switch (wallSide) {
        case 'left': angle = 0; break; // Right
        case 'right': angle = Math.PI; break; // Left
        case 'top': angle = Math.PI / 2; break; // Down
        case 'bottom': angle = -Math.PI / 2; break; // Up
        default: angle = Math.random() * Math.PI * 2; break;
      }
    } else {
      // Random direction for enemy hits
      angle = Math.random() * Math.PI * 2;
    }
    
    const speed = 2; // Slower than other projectiles
    
    // Create Dangerskull projectile
    const dangerskull = new Projectile(
      deathblow.x, deathblow.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "☠️", 1, deathblow, "dangerskull",
      { 
        deathblowOwner: deathblow,
        spawnTime: gameTime,
        lifetime: data.dangerskullLifetime,
        source: source
      }
    );
    
    projectiles.push(dangerskull);
    data.activeDangerskulls.push(dangerskull);
    
    console.log(`Dangerskull spawned from ${source}! Active: ${data.activeDangerskulls.length}/${data.maxDangerskulls}`);
    audio.ability();
  }

  static handleDangerskullHit(projectile, character) {
    if (projectile.type !== "dangerskull") return;
    
    const owner = projectile.owner;
    
    if (character === owner) {
      // Dangerskull hit Deathblow - just disappears (handled by lifetime)
      return;
    }
    
    // Enemy hit by Dangerskull
    character.takeDamage(1, owner);
    console.log(`Dangerskull hit! 1 damage to ${character.emoji}`);
    
    // Remove the Dangerskull
    this.removeDangerskull(owner, projectile);
  }

  static handleDangerskullWallBounce(projectile) {
    if (projectile.type !== "dangerskull") return true;
    
    // Dangerskulls can bounce off arena borders
    console.log(`Dangerskull bounced off wall`);
    audio.bounce();
    return true;
  }

  static removeDangerskull(deathblow, dangerskull) {
    if (!deathblow.abilityData) return;
    
    const data = deathblow.abilityData;
    
    // Remove from active list
    const index = data.activeDangerskulls.indexOf(dangerskull);
    if (index > -1) {
      data.activeDangerskulls.splice(index, 1);
    }
    
    // Remove from projectiles array
    const projIndex = projectiles.indexOf(dangerskull);
    if (projIndex > -1) {
      projectiles.splice(projIndex, 1);
    }
  }

  static cleanupExpiredDangerskulls(deathblow) {
    const data = deathblow.abilityData;
    const currentTime = gameTime;
    
    // Check for expired Dangerskulls
    const expiredSkulls = data.activeDangerskulls.filter(skull => {
      return currentTime - skull.data.spawnTime >= skull.data.lifetime;
    });
    
    // Remove expired Dangerskulls
    expiredSkulls.forEach(skull => {
      this.removeDangerskull(deathblow, skull);
    });
    
    if (expiredSkulls.length > 0) {
      console.log(`${expiredSkulls.length} Dangerskulls expired. Active: ${data.activeDangerskulls.length}`);
    }
  }

  static handleCharacterDeath(character) {
    // Clean up Dangerskulls when Deathblow dies
    if (character.emoji === "💀") {
      if (character.abilityData && character.abilityData.activeDangerskulls) {
        // Remove all active Dangerskulls
        character.abilityData.activeDangerskulls.forEach(skull => {
          const projIndex = projectiles.indexOf(skull);
          if (projIndex > -1) {
            projectiles.splice(projIndex, 1);
          }
        });
        character.abilityData.activeDangerskulls = [];
      }
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "💀" || !character.abilityData) return null;
    
    const data = character.abilityData;
    return {
      enemyHits: data.enemyHitsCount,
      activeSkulls: data.activeDangerskulls.length,
      maxSkulls: data.maxDangerskulls
    };
  }
}

// Dangerskull Projectile class extension
class DangerskullProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Check lifetime
    const currentTime = gameTime;
    if (currentTime - this.data.spawnTime >= this.data.lifetime) {
      // Remove from owner's active list
      if (this.owner && this.owner.abilityData) {
        DeathblowModule.removeDangerskull(this.owner, this);
      }
      return false;
    }

    // Handle wall bouncing
    return this.handleDangerskullWallCollision();
  }

  handleDangerskullWallCollision() {
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
      return DeathblowModule.handleDangerskullWallBounce(this);
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add spooky glow effect for Dangerskulls
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 10;
    
    // Add slight pulsing effect
    const pulse = Math.sin(this.age * 0.15) * 0.1 + 0.9;
    ctx.globalAlpha = pulse;
    
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.DeathblowModule = DeathblowModule;
  window.DangerskullProjectile = DangerskullProjectile;
}