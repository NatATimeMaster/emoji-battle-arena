// Black Spot Character Module
// 🐼 Black Spot - Leaf trail system with Annoyed Spot rage and Boost Mode

class BlackSpotModule {
  static leafElements = []; // Track leaf positions on arena
  static flyingLeaves = []; // Track leaves flying toward Black Spot

  static initializeAbilities(character) {
    if (character.emoji !== "🐼") return;
    
    character.abilityData = {
      // Leaf dropping mechanics
      movementTimer: 0, // Track movement time
      leafDropInterval: 300, // 5 seconds at 60fps
      lastPosition: { x: character.x, y: character.y },
      isMoving: false,
      
      // Annoyed Spot system
      hitCount: 0, // Track consecutive hits
      maxHits: 5, // Trigger threshold
      isAnnoyed: false,
      
      // Boost Mode
      isBoostMode: false,
      boostStartTime: 0,
      boostDuration: 480, // 8 seconds at 60fps
      originalSpeed: 2,
      boostSpeed: 10, // 5x normal speed
      boostLeafTimer: 0,
      boostLeafInterval: 60, // 1 second
      
      // Direct hit mechanics
      lastHitTime: 0,
      hitCooldown: 30 // 0.5 second cooldown
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐼" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle Boost Mode
    if (data.isBoostMode) {
      this.handleBoostMode(character, currentTime);
      return; // Skip normal abilities during Boost Mode
    }
    
    // Check for Annoyed Spot trigger
    if (data.hitCount >= data.maxHits && !data.isAnnoyed) {
      this.triggerAnnoyedSpot(character);
      return;
    }
    
    // Handle movement tracking and leaf dropping
    this.handleMovementAndLeaves(character, currentTime);
    
    // Update flying leaves
    this.updateFlyingLeaves(character);
    
    // Clean up consumed leaves
    this.cleanupLeafElements();
  }

  static handleMovementAndLeaves(character, currentTime) {
    const data = character.abilityData;
    
    // Check if character is moving
    const currentPos = { x: character.x, y: character.y };
    const moved = Math.abs(currentPos.x - data.lastPosition.x) > 1 || 
                  Math.abs(currentPos.y - data.lastPosition.y) > 1;
    
    if (moved) {
      data.isMoving = true;
      data.movementTimer++;
      data.lastPosition = { x: currentPos.x, y: currentPos.y };
      
      // Drop leaf every 5 seconds of movement
      if (data.movementTimer >= data.leafDropInterval) {
        this.dropLeaf(character);
        data.movementTimer = 0;
      }
    } else {
      data.isMoving = false;
    }
  }

  static handleBoostMode(character, currentTime) {
    const data = character.abilityData;
    
    // Check if Boost Mode has expired
    if (currentTime - data.boostStartTime >= data.boostDuration) {
      this.endBoostMode(character);
      return;
    }
    
    // Enhanced movement during Boost Mode
    character.speed = data.boostSpeed;
    
    // Enhanced leaf dropping (every second while moving)
    if (data.isMoving) {
      data.boostLeafTimer++;
      if (data.boostLeafTimer >= data.boostLeafInterval) {
        this.dropLeaf(character);
        data.boostLeafTimer = 0;
      }
    }
    
    // Track movement for boost leaf dropping
    const currentPos = { x: character.x, y: character.y };
    const moved = Math.abs(currentPos.x - data.lastPosition.x) > 1 || 
                  Math.abs(currentPos.y - data.lastPosition.y) > 1;
    
    if (moved) {
      data.isMoving = true;
      data.lastPosition = { x: currentPos.x, y: currentPos.y };
    } else {
      data.isMoving = false;
    }
  }

  static dropLeaf(character) {
    // Create leaf element at character's position
    const leaf = {
      x: character.x,
      y: character.y,
      id: Date.now() + Math.random(),
      owner: character,
      consumed: false
    };
    
    this.leafElements.push(leaf);
    this.createLeafVisual(leaf);
    
    console.log(`🐼 Black Spot dropped leaf! (${this.leafElements.length} total leaves)`);
  }

  static createLeafVisual(leaf) {
    // Create visual leaf element on arena
    const arenaContainer = document.querySelector('.arena-container');
    if (!arenaContainer) return;
    
    const leafElement = document.createElement('div');
    leafElement.className = 'leaf-element';
    leafElement.style.position = 'absolute';
    leafElement.style.left = `${leaf.x}px`;
    leafElement.style.top = `${leaf.y}px`;
    leafElement.style.fontSize = '20px';
    leafElement.style.zIndex = '10';
    leafElement.textContent = '🌿';
    leafElement.setAttribute('data-leaf-id', leaf.id);
    
    arenaContainer.appendChild(leafElement);
    leaf.element = leafElement;
  }

  static checkLeafConsumption(character) {
    if (character.emoji !== "🐼" || !character.abilityData) return;
    
    const data = character.abilityData;
    const consumeRadius = character.size + 15;
    
    // Check collision with leaves
    this.leafElements.forEach(leaf => {
      if (leaf.consumed || leaf.owner !== character) return;
      
      const dx = character.x - leaf.x;
      const dy = character.y - leaf.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < consumeRadius) {
        this.consumeLeaf(character, leaf);
      }
    });
  }

  static consumeLeaf(character, leaf) {
    // Heal character
    character.heal(5);
    
    // Mark leaf as consumed
    leaf.consumed = true;
    
    // Remove visual element
    if (leaf.element) {
      leaf.element.remove();
    }
    
    console.log(`🐼 Black Spot consumed leaf: +5 HP`);
  }

  static handleDirectHit(blackSpot, enemy) {
    if (!blackSpot.abilityData) return false;
    
    const currentTime = gameTime;
    const data = blackSpot.abilityData;
    
    // Check hit cooldown
    if (currentTime - data.lastHitTime < data.hitCooldown) {
      return false;
    }
    
    // Deal damage based on mode
    const damage = data.isBoostMode ? 2 : 1;
    enemy.takeDamage(damage, blackSpot);
    data.lastHitTime = currentTime;
    
    console.log(`🐼 Black Spot direct hit: ${damage} damage!`);
    audio.hit();
    
    return true;
  }

  static handleHitReceived(character) {
    if (character.emoji !== "🐼" || !character.abilityData) return;
    
    const data = character.abilityData;
    
    // Don't count hits during Boost Mode (invulnerable)
    if (data.isBoostMode) return;
    
    data.hitCount++;
    console.log(`🐼 Black Spot hit! (${data.hitCount}/${data.maxHits})`);
    
    // Trigger Annoyed Spot if threshold reached
    if (data.hitCount >= data.maxHits) {
      console.log(`😡 Black Spot is getting ANNOYED!`);
    }
  }

  static triggerAnnoyedSpot(character) {
    const data = character.abilityData;
    data.isAnnoyed = true;
    
    console.log(`😡 ANNOYED SPOT activated! Flying leaves toward Black Spot!`);
    
    // Make all leaves fly toward Black Spot
    this.launchFlyingLeaves(character);
    
    // Visual effect
    if (character.element) {
      character.element.classList.add('annoyed-spot');
    }
  }

  static launchFlyingLeaves(character) {
    // Convert all static leaves to flying leaves
    this.leafElements.forEach(leaf => {
      if (!leaf.consumed) {
        const flyingLeaf = {
          x: leaf.x,
          y: leaf.y,
          targetX: character.x,
          targetY: character.y,
          speed: 6,
          owner: character,
          hasHitEnemy: false,
          element: leaf.element
        };
        
        this.flyingLeaves.push(flyingLeaf);
        
        // Add flying animation class
        if (leaf.element) {
          leaf.element.classList.add('flying-leaf');
        }
      }
    });
    
    // Clear static leaves array
    this.leafElements = [];
    
    console.log(`🌿 ${this.flyingLeaves.length} leaves launched!`);
  }

  static updateFlyingLeaves(character) {
    if (this.flyingLeaves.length === 0) return;
    
    const data = character.abilityData;
    let leavesToRemove = [];
    
    this.flyingLeaves.forEach((leaf, index) => {
      // Move leaf toward Black Spot
      const dx = character.x - leaf.x;
      const dy = character.y - leaf.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 20) {
        // Leaf reached Black Spot
        this.consumeFlyingLeaf(character, leaf);
        leavesToRemove.push(index);
        return;
      }
      
      // Check collision with enemy (only once per leaf)
      if (!leaf.hasHitEnemy) {
        this.checkFlyingLeafEnemyCollision(leaf, character);
      }
      
      // Continue moving toward Black Spot
      leaf.x += (dx / distance) * leaf.speed;
      leaf.y += (dy / distance) * leaf.speed;
      
      // Update visual position
      if (leaf.element) {
        leaf.element.style.left = `${leaf.x}px`;
        leaf.element.style.top = `${leaf.y}px`;
      }
    });
    
    // Remove consumed leaves
    leavesToRemove.reverse().forEach(index => {
      const leaf = this.flyingLeaves[index];
      if (leaf.element) {
        leaf.element.remove();
      }
      this.flyingLeaves.splice(index, 1);
    });
    
    // Check if all leaves have been collected
    if (this.flyingLeaves.length === 0 && data.isAnnoyed) {
      this.startBoostMode(character);
    }
  }

  static checkFlyingLeafEnemyCollision(leaf, blackSpot) {
    // Find enemy characters
    const enemies = charactersInArena.filter(c => c !== blackSpot && !c.isDead);
    
    enemies.forEach(enemy => {
      const dx = leaf.x - enemy.x;
      const dy = leaf.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < enemy.size + 15) {
        // Leaf hit enemy
        enemy.takeDamage(5, blackSpot);
        
        // Stop enemy movement for 1 second
        enemy.freeze(60); // 1 second
        
        leaf.hasHitEnemy = true;
        
        console.log(`🌿 Flying leaf hit enemy: 5 damage + 1s stun!`);
        audio.hit();
      }
    });
  }

  static consumeFlyingLeaf(character, leaf) {
    // Heal character
    character.heal(5);
    
    console.log(`🐼 Black Spot consumed flying leaf: +5 HP`);
  }

  static startBoostMode(character) {
    const data = character.abilityData;
    
    // Reset annoyed state
    data.isAnnoyed = false;
    data.hitCount = 0;
    
    // Start Boost Mode
    data.isBoostMode = true;
    data.boostStartTime = gameTime;
    data.boostLeafTimer = 0;
    
    // Grant invulnerability
    character.invulnerable = true;
    character.invulnerableUntil = gameTime + data.boostDuration;
    
    // Visual effects
    if (character.element) {
      character.element.classList.remove('annoyed-spot');
      character.element.classList.add('boost-mode');
    }
    
    console.log(`🚀 BOOST MODE activated! 8 seconds of invulnerability and enhanced speed!`);
  }

  static endBoostMode(character) {
    const data = character.abilityData;
    
    data.isBoostMode = false;
    character.speed = data.originalSpeed;
    
    // Remove invulnerability
    character.invulnerable = false;
    character.invulnerableUntil = 0;
    
    // Remove visual effects
    if (character.element) {
      character.element.classList.remove('boost-mode');
    }
    
    console.log(`🐼 Boost Mode ended - returning to normal`);
  }

  static cleanupLeafElements() {
    // Remove consumed leaves from array
    this.leafElements = this.leafElements.filter(leaf => !leaf.consumed);
  }

  static handleCharacterDeath(character) {
    // Clean up when Black Spot dies
    if (character.emoji === "🐼") {
      // Remove all leaf elements
      this.leafElements.forEach(leaf => {
        if (leaf.element) {
          leaf.element.remove();
        }
      });
      this.leafElements = [];
      
      // Remove flying leaves
      this.flyingLeaves.forEach(leaf => {
        if (leaf.element) {
          leaf.element.remove();
        }
      });
      this.flyingLeaves = [];
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "🐼" || !character.abilityData) return null;
    
    const data = character.abilityData;
    return {
      hitCount: data.hitCount,
      maxHits: data.maxHits,
      isAnnoyed: data.isAnnoyed,
      isBoostMode: data.isBoostMode,
      boostTimeLeft: data.isBoostMode ? Math.max(0, (data.boostStartTime + data.boostDuration - gameTime) / 60) : 0,
      leafCount: this.leafElements.length,
      flyingLeaves: this.flyingLeaves.length,
      movementProgress: Math.floor((data.movementTimer / data.leafDropInterval) * 100)
    };
  }
}

// CSS for Black Spot effects
const blackSpotStyles = `
  .leaf-element {
    pointer-events: none;
    transition: none;
    filter: drop-shadow(0 0 5px rgba(34, 139, 34, 0.8));
  }
  
  .flying-leaf {
    transition: none !important;
    animation: leafFly 0.1s linear infinite;
    filter: drop-shadow(0 0 10px rgba(34, 139, 34, 1)) 
            drop-shadow(0 0 20px rgba(144, 238, 144, 0.8));
  }
  
  @keyframes leafFly {
    0% { transform: rotate(0deg) scale(1.0); }
    50% { transform: rotate(180deg) scale(1.2); }
    100% { transform: rotate(360deg) scale(1.0); }
  }
  
  @keyframes annoyedSpot {
    0% { 
      box-shadow: 0 0 20px #ff4500; 
      transform: scale(1.0);
    }
    50% { 
      box-shadow: 0 0 40px #ff4500, 0 0 60px #ff6347; 
      transform: scale(1.1);
    }
    100% { 
      box-shadow: 0 0 20px #ff4500; 
      transform: scale(1.0);
    }
  }
  
  .annoyed-spot {
    animation: annoyedSpot 0.5s ease-in-out infinite;
  }
  
  @keyframes boostMode {
    0% { 
      box-shadow: 0 0 30px #00ff00; 
      transform: scale(1.0);
      filter: brightness(1.2);
    }
    50% { 
      box-shadow: 0 0 50px #00ff00, 0 0 70px #32cd32; 
      transform: scale(1.15);
      filter: brightness(1.5);
    }
    100% { 
      box-shadow: 0 0 30px #00ff00; 
      transform: scale(1.0);
      filter: brightness(1.2);
    }
  }
  
  .boost-mode {
    animation: boostMode 0.3s ease-in-out infinite;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = blackSpotStyles;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.BlackSpotModule = BlackSpotModule;
}