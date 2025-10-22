// Frenzy Character Module
// 🐯 Frenzy - Direct damage with progressive speed and size increases

class FrenzyModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🐯") return;
    
    character.abilityData = {
      enemyHits: 0,
      baseSpeed: 2,
      baseSize: character.size,
      currentSpeedMultiplier: 1.0,
      currentSizeMultiplier: 1.0,
      maxMultiplier: 5.0, // Cap at 5x
      
      // Direct hit
      lastDirectHitTime: 0,
      directHitCooldown: 15 // 0.25 seconds
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐯" || character.isDead) return;
    
    // Update visual scaling (size is already updated in handleDirectHit)
    this.updateVisualEffects(character);
  }

  static handleDirectHit(attacker, victim) {
    if (attacker.emoji !== "🐯") return;
    
    const currentTime = gameTime;
    const data = attacker.abilityData;
    
    // Check cooldown
    if (currentTime - data.lastDirectHitTime < data.directHitCooldown) {
      return;
    }
    
    // Apply direct damage
    victim.takeDamage(1, attacker);
    data.lastDirectHitTime = currentTime;
    
    // Increment hit count
    data.enemyHits++;
    
    // Calculate new multipliers (10% increase per hit, capped at 5x)
    const hitBonus = data.enemyHits * 0.1;
    data.currentSpeedMultiplier = Math.min(1.0 + hitBonus, data.maxMultiplier);
    data.currentSizeMultiplier = Math.min(1.0 + hitBonus, data.maxMultiplier);
    
    // Apply speed increase
    const baseVelocity = Math.hypot(attacker.vx, attacker.vy);
    if (baseVelocity > 0) {
      const direction = Math.atan2(attacker.vy, attacker.vx);
      const newSpeed = data.baseSpeed * data.currentSpeedMultiplier;
      attacker.vx = Math.cos(direction) * newSpeed;
      attacker.vy = Math.sin(direction) * newSpeed;
    }
    
    // Apply size increase
    attacker.size = data.baseSize * data.currentSizeMultiplier;
    
    console.log(`🐯 Frenzy hit! Speed: ${data.currentSpeedMultiplier.toFixed(1)}x, Size: ${data.currentSizeMultiplier.toFixed(1)}x (${data.enemyHits} hits)`);
    audio.hit();
    
    // Visual effect for progression
    if (attacker.element) {
      attacker.element.classList.add('frenzyBoost');
      setTimeout(() => {
        attacker.element.classList.remove('frenzyBoost');
      }, 300);
    }
  }

  static updateVisualEffects(character) {
    const data = character.abilityData;
    
    // Add visual intensity based on hit count
    if (character.element) {
      // Remove existing frenzy classes
      character.element.classList.remove('frenzy-low', 'frenzy-medium', 'frenzy-high', 'frenzy-max');
      
      // Add appropriate frenzy class based on multiplier
      if (data.currentSpeedMultiplier >= 5.0) {
        character.element.classList.add('frenzy-max');
      } else if (data.currentSpeedMultiplier >= 3.0) {
        character.element.classList.add('frenzy-high');
      } else if (data.currentSpeedMultiplier >= 2.0) {
        character.element.classList.add('frenzy-medium');
      } else if (data.currentSpeedMultiplier > 1.0) {
        character.element.classList.add('frenzy-low');
      }
    }
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "🐯") return;
    
    console.log("🐯 Frenzy died, speed/size buffs lost");
  }
}

window.FrenzyModule = FrenzyModule;