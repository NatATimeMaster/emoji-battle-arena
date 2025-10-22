// Deathblow Character Module
// 💀 Deathblow - Direct damage and Dangerskull spawning

class DeathblowModule {
  static initializeAbilities(character) {
    if (character.emoji !== "💀") return;
    
    character.abilityData = {
      enemyHits: 0,
      activeDangerskulls: [],
      maxActiveSkulls: 0,
      lastHitTime: 0,
      hitCooldown: 60
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "💀" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Clean up expired Dangerskulls
    this.cleanupExpiredDangerskulls(character, currentTime);
  }

  static handleEnemyHit(attacker, victim) {
    if (attacker.emoji !== "💀") return;
    
    const currentTime = gameTime;
    
    // Check hit cooldown
    if (currentTime - attacker.abilityData.lastHitTime < attacker.abilityData.hitCooldown) {
      return;
    }
    
    // Apply direct damage
    victim.takeDamage(3, attacker);
    attacker.abilityData.lastHitTime = currentTime;
    
    // Increment enemy hit count
    attacker.abilityData.enemyHits++;
    attacker.abilityData.maxActiveSkulls = attacker.abilityData.enemyHits;
    
    // Spawn Dangerskull
    this.spawnDangerskull(attacker, victim);
    
    console.log(`💀 Deathblow hits for 3 damage! Enemy hits: ${attacker.abilityData.enemyHits}`);
    audio.hit();
  }

  static handleWallCollision(character, side) {
    if (character.emoji !== "💀") return;
    
    // Spawn Dangerskull on wall collision
    this.spawnDangerskull(character, null, side);
    console.log(`💀 Deathblow hit ${side} wall, spawning Dangerskull!`);
  }

  static spawnDangerskull(deathblow, target = null, wallSide = null) {
    // Check if we can spawn more skulls
    if (deathblow.abilityData.activeDangerskulls.length >= deathblow.abilityData.maxActiveSkulls) {
      console.log("💀 Maximum Dangerskulls reached, cannot spawn more");
      return;
    }
    
    let spawnX = deathblow.x;
    let spawnY = deathblow.y;
    let vx = (Math.random() * 2 - 1) * 2;
    let vy = (Math.random() * 2 - 1) * 2;
    
    // If targeting an enemy, aim towards them
    if (target) {
      const angle = Math.atan2(target.y - deathblow.y, target.x - deathblow.x);
      const speed = 2;
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed;
    }
    
    const dangerskull = new Projectile(
      spawnX, spawnY, vx, vy,
      "☠️", 1, deathblow, "dangerskull",
      {
        spawnTime: gameTime,
        lifetime: 600, // 10 seconds
        deathblowOwner: deathblow
      }
    );
    
    projectiles.push(dangerskull);
    deathblow.abilityData.activeDangerskulls.push(dangerskull);
    
    console.log(`💀 Dangerskull spawned! Active: ${deathblow.abilityData.activeDangerskulls.length}/${deathblow.abilityData.maxActiveSkulls}`);
    audio.ability();
  }

  static handleDangerskullHit(projectile, character) {
    if (character.team === projectile.owner.team) {
      // Dangerskull hit Deathblow - just disappear
      this.removeDangerskull(projectile.owner, projectile);
      return;
    }
    
    // Dangerskull hit enemy
    character.takeDamage(1, projectile.owner);
    console.log(`☠️ Dangerskull hit ${character.emoji} for 1 damage!`);
    
    // Remove the Dangerskull after hitting
    this.removeDangerskull(projectile.owner, projectile);
  }

  static handleDangerskullWallBounce(projectile) {
    // Dangerskulls can bounce off walls
    return true;
  }

  static removeDangerskull(deathblow, dangerskull) {
    // Remove from active list
    const index = deathblow.abilityData.activeDangerskulls.indexOf(dangerskull);
    if (index > -1) {
      deathblow.abilityData.activeDangerskulls.splice(index, 1);
    }
    
    // Remove from projectiles
    const projIndex = projectiles.indexOf(dangerskull);
    if (projIndex > -1) {
      projectiles.splice(projIndex, 1);
    }
    
    console.log(`☠️ Dangerskull removed. Active: ${deathblow.abilityData.activeDangerskulls.length}`);
  }

  static cleanupExpiredDangerskulls(character, currentTime) {
    const expired = character.abilityData.activeDangerskulls.filter(skull => 
      currentTime - skull.data.spawnTime >= skull.data.lifetime
    );
    
    expired.forEach(skull => {
      this.removeDangerskull(character, skull);
    });
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "💀") return;
    
    // Remove all active Dangerskulls when Deathblow dies
    character.abilityData.activeDangerskulls.forEach(skull => {
      const index = projectiles.indexOf(skull);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
    });
    
    character.abilityData.activeDangerskulls = [];
    console.log("💀 Deathblow died, all Dangerskulls removed");
  }
}

class DangerskullProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.DeathblowModule = DeathblowModule;