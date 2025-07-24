// Hopper Character Module
// 🐰 Hopper - Border attachment with distance-based damage and radius zones

class HopperModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🐰") return;
    
    character.abilityData = {
      // Hop Travelling system
      isAttached: false, // Currently attached to border/enemy
      attachedSide: null, // Which border: 'left', 'right', 'top', 'bottom', 'enemy'
      attachStartTime: 0, // When attachment began
      attachDuration: 180, // 3 seconds at 60fps
      
      // Jump mechanics
      isCharging: false, // In 3-second charge phase
      jumpStartPosition: null, // Where the jump started
      jumpEndPosition: null, // Where the jump ended
      jumpDistance: 0, // Distance traveled
      
      // Damage system
      damageRadius: 5, // Radius around Hopper for damage
      lastHitTime: 0,
      hitCooldown: 30, // 0.5 second cooldown
      
      // Movement state
      originalBounce: true, // Track if using original bounce system
      customMovement: false // Using Hopper's custom movement
    };
    
    // Override normal bounce behavior
    character.hopperOverride = true;
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐰" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle attachment phase
    if (data.isAttached) {
      this.handleAttachmentPhase(character, currentTime);
    } else {
      // Handle normal movement and border detection
      this.handleMovementAndBorders(character);
    }
    
    // Handle radius damage zone
    this.handleRadiusDamage(character, currentTime);
  }

  static handleAttachmentPhase(character, currentTime) {
    const data = character.abilityData;
    
    // Check if attachment time is over
    if (currentTime - data.attachStartTime >= data.attachDuration) {
      this.executeHop(character);
    } else {
      // Stay attached, no movement
      character.vx = 0;
      character.vy = 0;
      
      // Visual charging effect
      const timeLeft = data.attachDuration - (currentTime - data.attachStartTime);
      if (character.element) {
        const progress = (data.attachDuration - timeLeft) / data.attachDuration;
        const intensity = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5; // Pulsing effect
        character.element.style.filter = `brightness(${1 + intensity * 0.5}) saturate(${1 + intensity})`;
      }
    }
  }

  static executeHop(character) {
    const data = character.abilityData;
    
    // Calculate jump destination based on attached side
    const destination = this.calculateHopDestination(character);
    
    // Store jump start position for distance calculation
    data.jumpStartPosition = { x: character.x, y: character.y };
    data.jumpEndPosition = destination;
    
    // Calculate jump distance
    const dx = destination.x - character.x;
    const dy = destination.y - character.y;
    data.jumpDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Set velocity toward destination
    const hopSpeed = 8; // Fast hop speed
    const distance = Math.sqrt(dx * dx + dy * dy);
    character.vx = (dx / distance) * hopSpeed;
    character.vy = (dy / distance) * hopSpeed;
    
    // End attachment
    data.isAttached = false;
    data.attachedSide = null;
    
    // Reset visual effects
    if (character.element) {
      character.element.style.filter = '';
    }
    
    console.log(`🐰 Hopper executed hop! Distance: ${Math.floor(data.jumpDistance)} pixels`);
  }

  static calculateHopDestination(character) {
    const data = character.abilityData;
    const margin = character.size;
    
    // Determine destination based on current attached side
    switch (data.attachedSide) {
      case 'left':
        return { x: canvas.width - margin, y: character.y }; // Jump to right side
      case 'right':
        return { x: margin, y: character.y }; // Jump to left side
      case 'top':
        return { x: character.x, y: canvas.height - margin }; // Jump to bottom
      case 'bottom':
        return { x: character.x, y: margin }; // Jump to top
      case 'enemy':
        // Jump to opposite corner for maximum distance
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        if (character.x < centerX && character.y < centerY) {
          return { x: canvas.width - margin, y: canvas.height - margin }; // Bottom-right
        } else if (character.x >= centerX && character.y < centerY) {
          return { x: margin, y: canvas.height - margin }; // Bottom-left
        } else if (character.x < centerX && character.y >= centerY) {
          return { x: canvas.width - margin, y: margin }; // Top-right
        } else {
          return { x: margin, y: margin }; // Top-left
        }
      default:
        return { x: character.x, y: character.y }; // Stay in place if unknown
    }
  }

  static handleMovementAndBorders(character) {
    const data = character.abilityData;
    
    // Check for border collision
    const r = character.size;
    let hitBorder = false;
    let side = null;
    
    if (character.x <= r) {
      character.x = r;
      side = 'left';
      hitBorder = true;
    } else if (character.x >= canvas.width - r) {
      character.x = canvas.width - r;
      side = 'right';
      hitBorder = true;
    }
    
    if (character.y <= r) {
      character.y = r;
      side = 'top';
      hitBorder = true;
    } else if (character.y >= canvas.height - r) {
      character.y = canvas.height - r;
      side = 'bottom';
      hitBorder = true;
    }
    
    if (hitBorder) {
      this.attachToBorder(character, side);
    }
  }

  static attachToBorder(character, side) {
    const data = character.abilityData;
    
    // Stop movement
    character.vx = 0;
    character.vy = 0;
    
    // Attach to border
    data.isAttached = true;
    data.attachedSide = side;
    data.attachStartTime = gameTime;
    
    console.log(`🐰 Hopper attached to ${side} border for 3 seconds`);
    
    // Visual effect for attachment
    if (character.element) {
      character.element.classList.add('hopper-charging');
    }
  }

  static handleRadiusDamage(character, currentTime) {
    const data = character.abilityData;
    
    // Skip radius damage during attachment (unless moving)
    if (data.isAttached) return;
    
    // Check hit cooldown
    if (currentTime - data.lastHitTime < data.hitCooldown) return;
    
    // Find enemy characters
    const enemies = charactersInArena.filter(c => c !== character && !c.isDead);
    
    enemies.forEach(enemy => {
      const dx = enemy.x - character.x;
      const dy = enemy.y - character.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check for direct hit or radius hit
      const directHit = distance < (character.size + enemy.size);
      const radiusHit = distance < (character.size + enemy.size + data.damageRadius);
      
      if (directHit || radiusHit) {
        const damage = this.calculateHopDamage(character, directHit);
        enemy.takeDamage(damage, character);
        data.lastHitTime = currentTime;
        
        // Treat enemy as border for hop mechanics
        this.attachToEnemy(character, enemy);
        
        console.log(`🐰 Hopper ${directHit ? 'direct' : 'radius'} hit: ${damage} damage!`);
        audio.hit();
      }
    });
  }

  static calculateHopDamage(character, isDirectHit) {
    const data = character.abilityData;
    
    // If no jump distance recorded, use default short hop damage
    if (!data.jumpDistance || data.jumpDistance === 0) {
      return isDirectHit ? 2 : 1; // Short hop damage
    }
    
    // Calculate damage based on jump distance
    const arenaWidth = canvas.width;
    const arenaHeight = canvas.height;
    const maxDistance = Math.sqrt(arenaWidth * arenaWidth + arenaHeight * arenaHeight); // Diagonal
    const halfMaxDistance = maxDistance * 0.5;
    const quarterMaxDistance = maxDistance * 0.25;
    
    let damage;
    
    if (data.jumpDistance >= halfMaxDistance) {
      // Long hop (side to opposite side)
      damage = isDirectHit ? 8 : 6;
    } else if (data.jumpDistance >= quarterMaxDistance) {
      // Medium hop (side to midpoint)
      damage = isDirectHit ? 5 : 3;
    } else {
      // Short hop (adjacent/near)
      damage = isDirectHit ? 2 : 1;
    }
    
    console.log(`🐰 Jump distance: ${Math.floor(data.jumpDistance)}, Max: ${Math.floor(maxDistance)}, Damage: ${damage}`);
    return damage;
  }

  static attachToEnemy(character, enemy) {
    const data = character.abilityData;
    
    // Stop movement
    character.vx = 0;
    character.vy = 0;
    
    // Attach to enemy position
    data.isAttached = true;
    data.attachedSide = 'enemy';
    data.attachStartTime = gameTime;
    
    console.log(`🐰 Hopper hit enemy and attached for 3 seconds!`);
    
    // Visual effect for enemy attachment
    if (character.element) {
      character.element.classList.add('hopper-charging');
      character.element.classList.add('hopper-enemy-hit');
    }
  }

  static handleCharacterDeath(character) {
    // Clean up when Hopper dies
    if (character.emoji === "🐰") {
      // Remove visual effects
      if (character.element) {
        character.element.classList.remove('hopper-charging');
        character.element.classList.remove('hopper-enemy-hit');
        character.element.style.filter = '';
      }
      
      console.log(`🐰 Hopper died with ${character.abilityData?.jumpDistance || 0} last jump distance`);
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "🐰" || !character.abilityData) return null;
    
    const data = character.abilityData;
    const timeLeft = data.isAttached ? Math.max(0, (data.attachStartTime + data.attachDuration - gameTime) / 60) : 0;
    
    return {
      isAttached: data.isAttached,
      attachedSide: data.attachedSide,
      timeLeft: timeLeft,
      lastJumpDistance: data.jumpDistance,
      damageRadius: data.damageRadius,
      isCharging: data.isAttached,
      nextDamage: this.calculateHopDamage(character, true) // Estimate next direct hit damage
    };
  }

  // Helper method to get damage ranges for UI
  static getDamageRanges() {
    return {
      longHop: { direct: 8, radius: 6, description: "Side to opposite side" },
      mediumHop: { direct: 5, radius: 3, description: "Side to midpoint" },
      shortHop: { direct: 2, radius: 1, description: "Adjacent/short hop" }
    };
  }

  // Helper method to calculate theoretical jump distances
  static calculateJumpDistances() {
    const width = canvas?.width || 800;
    const height = canvas?.height || 600;
    const diagonal = Math.sqrt(width * width + height * height);
    
    return {
      maxDistance: diagonal,
      longHopThreshold: diagonal * 0.5,
      mediumHopThreshold: diagonal * 0.25,
      horizontalSide: width,
      verticalSide: height,
      cornerToCornder: diagonal
    };
  }
}

// CSS for Hopper effects
const hopperStyles = `
  @keyframes hopperCharging {
    0% { 
      box-shadow: 0 0 10px #32cd32; 
      transform: scale(1.0);
    }
    25% { 
      box-shadow: 0 0 20px #32cd32, 0 0 30px #228b22; 
      transform: scale(1.05);
    }
    50% { 
      box-shadow: 0 0 30px #32cd32, 0 0 40px #228b22, 0 0 50px #90ee90; 
      transform: scale(1.1);
    }
    75% { 
      box-shadow: 0 0 20px #32cd32, 0 0 30px #228b22; 
      transform: scale(1.05);
    }
    100% { 
      box-shadow: 0 0 10px #32cd32; 
      transform: scale(1.0);
    }
  }
  
  .hopper-charging {
    animation: hopperCharging 1s ease-in-out infinite;
  }
  
  @keyframes hopperEnemyHit {
    0% { 
      box-shadow: 0 0 15px #ff6347; 
      filter: brightness(1.0);
    }
    50% { 
      box-shadow: 0 0 30px #ff6347, 0 0 40px #ff4500; 
      filter: brightness(1.5);
    }
    100% { 
      box-shadow: 0 0 15px #ff6347; 
      filter: brightness(1.0);
    }
  }
  
  .hopper-enemy-hit {
    animation: hopperEnemyHit 0.5s ease-in-out 3;
  }
  
  /* Radius damage zone visualization (optional, for debugging) */
  .hopper-radius-indicator {
    position: absolute;
    border: 2px dashed rgba(50, 205, 50, 0.5);
    border-radius: 50%;
    pointer-events: none;
    z-index: 5;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = hopperStyles;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.HopperModule = HopperModule;
}