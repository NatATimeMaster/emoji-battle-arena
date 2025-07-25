// Black Spot Character Module
// 🐼 Black Spot - Leaf placement with direct damage and Annoyed Spot mechanics

class BlackSpotModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🐼") return;
    
    character.abilityData = {
      leaves: [],
      lastLeafTime: 0,
      leafPlacementInterval: 300, // 5 seconds
      lastMoveTime: 0,
      moveCheckInterval: 60, // Check every second
      
      // Annoyed Spot system
      hitCount: 0,
      requiredHits: 5,
      annoyedSpotActive: false,
      boostModeActive: false,
      boostEndTime: 0,
      boostDuration: 480, // 8 seconds
      
      // Direct hit
      lastDirectHitTime: 0,
      directHitCooldown: 30 // 0.5 seconds
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐼" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Handle movement tracking and leaf placement
    this.handleMovementTracking(character, currentTime);
    
    // Handle Boost Mode
    this.handleBoostMode(character, currentTime);
    
    // Update leaves (cleanup old ones, etc.)
    this.updateLeaves(character, currentTime);
  }

  static handleMovementTracking(character, currentTime) {
    const data = character.abilityData;
    
    // Check if character is moving
    const isMoving = Math.abs(character.vx) > 0.1 || Math.abs(character.vy) > 0.1;
    
    if (isMoving) {
      data.lastMoveTime = currentTime;
      
      // Check if enough time has passed for leaf placement
      if (currentTime - data.lastLeafTime >= data.leafPlacementInterval) {
        this.placeLeaf(character);
        data.lastLeafTime = currentTime;
      }
    }
  }

  static placeLeaf(character) {
    const data = character.abilityData;
    
    // Create leaf at current position
    const leaf = {
      x: character.x,
      y: character.y,
      size: 20,
      placedTime: gameTime,
      consumed: false
    };
    
    data.leaves.push(leaf);
    
    console.log(`🐼 Black Spot placed leaf! Total leaves: ${data.leaves.length}`);
    audio.ability();
  }

  static handleDirectHit(attacker, victim) {
    if (attacker.emoji !== "🐼") return;
    
    const currentTime = gameTime;
    const data = attacker.abilityData;
    
    // Check cooldown
    if (currentTime - data.lastDirectHitTime < data.directHitCooldown) {
      return;
    }
    
    // Apply direct damage
    victim.takeDamage(1, attacker);
    data.lastDirectHitTime = currentTime;
    
    console.log("🐼 Black Spot direct hit: 1 damage!");
    audio.hit();
  }

  static handleDamageReceived(character, amount, attacker) {
    if (character.emoji !== "🐼") return;
    
    const data = character.abilityData;
    
    // Don't count damage during Boost Mode (invulnerable)
    if (data.boostModeActive) return;
    
    // Track hits for Annoyed Spot
    data.hitCount++;
    
    console.log(`🐼 Black Spot hit count: ${data.hitCount}/${data.requiredHits}`);
    
    // Check for Annoyed Spot trigger
    if (data.hitCount >= data.requiredHits) {
      this.activateAnnoyedSpot(character);
    }
  }

  static activateAnnoyedSpot(character) {
    const data = character.abilityData;
    
    // Reset hit counter
    data.hitCount = 0;
    data.annoyedSpotActive = true;
    
    console.log("🐼 ANNOYED SPOT activated! Flying leaves incoming!");
    
    // Make all leaves fly toward Black Spot
    this.flyLeavesToBlackSpot(character);
    
    audio.ability();
  }

  static flyLeavesToBlackSpot(character) {
    const data = character.abilityData;
    const enemy = character.getNearestEnemy();
    
    if (!enemy) {
      this.completeAnnoyedSpot(character);
      return;
    }
    
    // Create flying leaf projectiles
    data.leaves.forEach(leaf => {
      if (leaf.consumed) return;
      
      // Calculate path - leaves fly toward Black Spot but can hit enemy on the way
      const angle = Math.atan2(character.y - leaf.y, character.x - leaf.x);
      const speed = 4;
      
      const flyingLeaf = new Projectile(
        leaf.x, leaf.y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        "🌿", 5, character, "flyingleaf",
        {
          blackSpotOwner: character,
          targetX: character.x,
          targetY: character.y,
          isFlying: true
        }
      );
      
      projectiles.push(flyingLeaf);
    });
    
    // Clear original leaves (they're now flying)
    const leafCount = data.leaves.filter(l => !l.consumed).length;
    data.leaves = [];
    
    console.log(`🌿 ${leafCount} leaves flying toward Black Spot!`);
  }

  static handleFlyingLeafHit(projectile, character) {
    const blackSpot = projectile.owner;
    
    if (character.team !== blackSpot.team) {
      // Flying leaf hit enemy
      character.takeDamage(5, blackSpot);
      
      // Stop enemy movement for 1 second
      character.vx = 0;
      character.vy = 0;
      character.stunned = true;
      
      setTimeout(() => {
        character.stunned = false;
      }, 1000);
      
      console.log("🌿 Flying leaf hit enemy! 5 damage + 1 second stun!");
      
      // Remove leaf
      const index = projectiles.indexOf(projectile);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
    } else if (character === blackSpot) {
      // Leaf reached Black Spot
      this.consumeFlyingLeaf(blackSpot, projectile);
    }
  }

  static consumeFlyingLeaf(character, leafProjectile) {
    // Heal Black Spot
    character.heal(5);
    
    console.log("🌿 Black Spot consumed flying leaf! +5 HP");
    
    // Remove leaf projectile
    const index = projectiles.indexOf(leafProjectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    // Check if all leaves have been processed
    const remainingFlyingLeaves = projectiles.filter(p => 
      p.type === "flyingleaf" && p.owner === character
    ).length;
    
    if (remainingFlyingLeaves === 0) {
      this.completeAnnoyedSpot(character);
    }
  }

  static completeAnnoyedSpot(character) {
    const data = character.abilityData;
    
    data.annoyedSpotActive = false;
    
    // Activate Boost Mode
    this.activateBoostMode(character);
    
    console.log("🐼 Annoyed Spot complete! Boost Mode activated!");
  }

  static activateBoostMode(character) {
    const data = character.abilityData;
    const currentTime = gameTime;
    
    data.boostModeActive = true;
    data.boostEndTime = currentTime + data.boostDuration;
    
    // Grant invulnerability
    character.isInvulnerable = true;
    
    console.log("🐼 BOOST MODE! Invulnerable for 8 seconds!");
    audio.ability();
  }

  static handleBoostMode(character, currentTime) {
    const data = character.abilityData;
    
    if (!data.boostModeActive) return;
    
    // Check if Boost Mode expired
    if (currentTime >= data.boostEndTime) {
      this.endBoostMode(character);
    }
  }

  static endBoostMode(character) {
    const data = character.abilityData;
    
    data.boostModeActive = false;
    character.isInvulnerable = false;
    
    console.log("🐼 Boost Mode ended!");
  }

  static handleLeafConsumption(character) {
    const data = character.abilityData;
    
    // Check if Black Spot passes through any leaves
    data.leaves.forEach(leaf => {
      if (leaf.consumed) return;
      
      const distance = Math.hypot(character.x - leaf.x, character.y - leaf.y);
      if (distance < character.size + leaf.size) {
        // Consume leaf
        leaf.consumed = true;
        character.heal(5);
        
        console.log("🐼 Black Spot consumed leaf! +5 HP");
        audio.hit();
      }
    });
  }

  static updateLeaves(character, currentTime) {
    const data = character.abilityData;
    
    // Check for leaf consumption
    this.handleLeafConsumption(character);
    
    // Clean up consumed leaves
    data.leaves = data.leaves.filter(leaf => !leaf.consumed);
  }

  static drawLeaves(ctx, character) {
    if (character.emoji !== "🐼") return;
    
    const data = character.abilityData;
    
    data.leaves.forEach(leaf => {
      if (leaf.consumed) return;
      
      ctx.save();
      ctx.font = `${leaf.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Add subtle pulsing effect
      const pulse = Math.sin((gameTime - leaf.placedTime) * 0.05) * 0.1 + 0.9;
      ctx.globalAlpha = pulse;
      
      ctx.fillText("🌿", leaf.x, leaf.y);
      ctx.restore();
    });
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "🐼") return;
    
    // Remove all flying leaves when Black Spot dies
    projectiles = projectiles.filter(p => p.type !== "flyingleaf" || p.owner !== character);
    
    // Clear leaves
    character.abilityData.leaves = [];
    
    console.log("🐼 Black Spot died, leaves cleared");
  }
}

class LeafProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.BlackSpotModule = BlackSpotModule;