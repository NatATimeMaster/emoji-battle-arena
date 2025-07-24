// Frenzy Character Module
// 🦊 Frenzy - Progressive speed stacking with exponential damage scaling

class FrenzyModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🦊") return;
    
    character.abilityData = {
      // Quick Danger Boost system
      baseSpeed: 2, // Original movement speed
      speedStacks: 0, // Number of +1 speed stacks gained
      currentSpeed: 2, // Current total speed
      baseDamage: 1, // Base bump damage
      currentDamage: 1, // Current bump damage
      
      // Hit tracking
      totalHits: 0, // Total enemy hits (for tracking)
      lastHitTime: 0,
      hitCooldown: 30, // 0.5 second cooldown between hits
      
      // Damage scaling milestones
      damageMultiplier: 1, // Current damage multiplier
      nextMilestone: 5, // Next speed threshold for damage doubling
      
      // Visual scaling
      baseSizeMultiplier: 1.0,
      currentSizeMultiplier: 1.0
    };
    
    // Set initial speed
    character.speed = character.abilityData.baseSpeed;
  }

  static handleAbilities(character) {
    if (character.emoji !== "🦊" || character.isDead) return;
    
    const data = character.abilityData;
    
    // Update character speed
    this.updateCharacterSpeed(character);
    
    // Update visual scaling based on power
    this.updateVisualScaling(character);
  }

  static updateCharacterSpeed(character) {
    const data = character.abilityData;
    
    // Apply current speed to character
    character.speed = data.currentSpeed;
    
    // Calculate damage multiplier based on speed milestones
    const speedMilestones = Math.floor(data.speedStacks / 5);
    const newMultiplier = Math.pow(2, speedMilestones);
    
    if (newMultiplier !== data.damageMultiplier) {
      data.damageMultiplier = newMultiplier;
      data.currentDamage = data.baseDamage * data.damageMultiplier;
      data.nextMilestone = (speedMilestones + 1) * 5;
      
      console.log(`🦊 Frenzy reached damage milestone! Damage: ${data.currentDamage}x (${data.speedStacks} speed, milestone ${speedMilestones})`);
    }
  }

  static updateVisualScaling(character) {
    const data = character.abilityData;
    
    // Scale size based on power level (subtle scaling)
    const powerLevel = Math.floor(data.speedStacks / 5);
    data.currentSizeMultiplier = data.baseSizeMultiplier + (powerLevel * 0.1);
    
    const newSize = character.baseSize * data.currentSizeMultiplier;
    if (Math.abs(character.size - newSize) > 0.1) {
      character.size = newSize;
    }
  }

  static handleDirectHit(frenzy, enemy) {
    if (!frenzy.abilityData) return false;
    
    const currentTime = gameTime;
    const data = frenzy.abilityData;
    
    // Check hit cooldown
    if (currentTime - data.lastHitTime < data.hitCooldown) {
      return false;
    }
    
    // Deal current damage
    enemy.takeDamage(data.currentDamage, frenzy);
    data.lastHitTime = currentTime;
    
    // Gain permanent speed stack
    this.gainSpeedStack(frenzy);
    
    console.log(`🦊 Frenzy hit for ${data.currentDamage} damage! (Speed: ${data.currentSpeed}, Stacks: ${data.speedStacks})`);
    audio.hit();
    
    return true;
  }

  static gainSpeedStack(character) {
    const data = character.abilityData;
    
    // Gain permanent speed stack
    data.speedStacks++;
    data.totalHits++;
    data.currentSpeed = data.baseSpeed + data.speedStacks;
    
    // Check for damage milestone
    const speedToNextMilestone = data.nextMilestone - data.speedStacks;
    
    // Visual effect for speed gain
    if (character.element) {
      character.element.classList.add('speed-boost');
      setTimeout(() => {
        if (character.element) {
          character.element.classList.remove('speed-boost');
        }
      }, 500);
    }
    
    // Special effect for milestone reached
    if (data.speedStacks % 5 === 0) {
      if (character.element) {
        character.element.classList.add('damage-milestone');
        setTimeout(() => {
          if (character.element) {
            character.element.classList.remove('damage-milestone');
          }
        }, 1500);
      }
      
      console.log(`🔥 DAMAGE MILESTONE! Frenzy's damage doubled to ${data.currentDamage}!`);
    }
    
    console.log(`⚡ Frenzy gained speed! Total: ${data.speedStacks} stacks, Speed: ${data.currentSpeed}, Next milestone: ${speedToNextMilestone} hits`);
  }

  static handleCharacterDeath(character) {
    // Clean up when Frenzy dies (no projectiles to clean)
    if (character.emoji === "🦊") {
      console.log(`🦊 Frenzy died with ${character.abilityData?.speedStacks || 0} speed stacks and ${character.abilityData?.currentDamage || 1} damage`);
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "🦊" || !character.abilityData) return null;
    
    const data = character.abilityData;
    const speedToNextMilestone = data.nextMilestone - data.speedStacks;
    const currentMilestone = Math.floor(data.speedStacks / 5);
    
    return {
      speedStacks: data.speedStacks,
      currentSpeed: data.currentSpeed,
      currentDamage: data.currentDamage,
      damageMultiplier: data.damageMultiplier,
      totalHits: data.totalHits,
      nextMilestone: data.nextMilestone,
      speedToNextMilestone: speedToNextMilestone,
      currentMilestone: currentMilestone,
      sizeMultiplier: data.currentSizeMultiplier
    };
  }

  // Helper method to calculate potential damage at different stack levels
  static calculateDamageAtStacks(stacks) {
    const milestones = Math.floor(stacks / 5);
    return Math.pow(2, milestones);
  }

  // Helper method to get speed and damage progression
  static getProgressionInfo(maxStacks = 50) {
    const progression = [];
    for (let stacks = 0; stacks <= maxStacks; stacks += 5) {
      const speed = 2 + stacks;
      const damage = this.calculateDamageAtStacks(stacks);
      progression.push({
        stacks: stacks,
        speed: speed,
        damage: damage,
        milestone: Math.floor(stacks / 5)
      });
    }
    return progression;
  }
}

// CSS for Frenzy effects
const frenzyStyles = `
  @keyframes speedBoost {
    0% { 
      box-shadow: 0 0 15px #ff6600; 
      transform: scale(1.0);
    }
    50% { 
      box-shadow: 0 0 25px #ff6600, 0 0 35px #ff8c00; 
      transform: scale(1.05);
    }
    100% { 
      box-shadow: 0 0 15px #ff6600; 
      transform: scale(1.0);
    }
  }
  
  .speed-boost {
    animation: speedBoost 0.5s ease-out;
  }
  
  @keyframes damageMilestone {
    0% { 
      box-shadow: 0 0 20px #ff0000; 
      transform: scale(1.0);
      filter: brightness(1.0);
    }
    25% { 
      box-shadow: 0 0 40px #ff0000, 0 0 60px #ff4500; 
      transform: scale(1.2);
      filter: brightness(1.5);
    }
    50% { 
      box-shadow: 0 0 50px #ff0000, 0 0 70px #ff4500, 0 0 90px #ffd700; 
      transform: scale(1.3);
      filter: brightness(2.0);
    }
    75% { 
      box-shadow: 0 0 40px #ff0000, 0 0 60px #ff4500; 
      transform: scale(1.2);
      filter: brightness(1.5);
    }
    100% { 
      box-shadow: 0 0 20px #ff0000; 
      transform: scale(1.0);
      filter: brightness(1.0);
    }
  }
  
  .damage-milestone {
    animation: damageMilestone 1.5s ease-in-out;
  }
  
  /* Progressive power visual indicators */
  .frenzy-low-power {
    filter: brightness(1.0) saturate(1.0);
  }
  
  .frenzy-medium-power {
    filter: brightness(1.2) saturate(1.3) hue-rotate(15deg);
  }
  
  .frenzy-high-power {
    filter: brightness(1.5) saturate(1.6) hue-rotate(30deg);
  }
  
  .frenzy-extreme-power {
    filter: brightness(2.0) saturate(2.0) hue-rotate(45deg);
    box-shadow: 0 0 20px #ff6600;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = frenzyStyles;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.FrenzyModule = FrenzyModule;
}