// Hopper Character Module
// 🦊 Hopper - Teleportation mechanics with damage and special abilities

class HopperModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🦊") return;
    
    character.abilityData = {
      teleportCooldown: 120, // 2 seconds
      lastTeleportTime: 0,
      teleportDistance: 100,
      
      // Direct hit
      lastDirectHitTime: 0,
      directHitCooldown: 30 // 0.5 seconds
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🦊" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle teleportation
    if (currentTime - data.lastTeleportTime >= data.teleportCooldown) {
      this.performTeleport(character);
      data.lastTeleportTime = currentTime;
    }
  }

  static performTeleport(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate random teleport position near enemy
    const angle = Math.random() * Math.PI * 2;
    const distance = data.teleportDistance;
    
    let newX = enemy.x + Math.cos(angle) * distance;
    let newY = enemy.y + Math.sin(angle) * distance;
    
    // Ensure position is within arena bounds
    const margin = character.size;
    newX = Math.max(margin, Math.min(canvas.width - margin, newX));
    newY = Math.max(margin, Math.min(canvas.height - margin, newY));
    
    // Store old position for effect
    const oldX = character.x;
    const oldY = character.y;
    
    // Teleport
    character.x = newX;
    character.y = newY;
    
    // Create visual effects
    this.createTeleportEffect(oldX, oldY, newX, newY);
    
    console.log(`🦊 Hopper teleported near ${enemy.emoji}!`);
    audio.ability();
  }

  static createTeleportEffect(oldX, oldY, newX, newY) {
    // Create disappear effect at old position
    this.createTeleportParticle(oldX, oldY, 'disappear');
    
    // Create appear effect at new position
    setTimeout(() => {
      this.createTeleportParticle(newX, newY, 'appear');
    }, 100);
  }

  static createTeleportParticle(x, y, type) {
    // This would create visual particle effects
    // For now, we'll just log the effect
    console.log(`✨ Teleport ${type} effect at (${Math.round(x)}, ${Math.round(y)})`);
  }

  static handleDirectHit(attacker, victim) {
    if (attacker.emoji !== "🦊") return;
    
    const currentTime = gameTime;
    const data = attacker.abilityData;
    
    // Check cooldown
    if (currentTime - data.lastDirectHitTime < data.directHitCooldown) {
      return;
    }
    
    // Apply direct damage
    victim.takeDamage(1, attacker);
    data.lastDirectHitTime = currentTime;
    
    console.log("🦊 Hopper direct hit: 1 damage!");
    audio.hit();
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "🦊") return;
    
    console.log("🦊 Hopper died, teleportation ended");
  }
}

window.HopperModule = HopperModule;