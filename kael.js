// Kael Character Module
// 👼🏻 Kael - Sequential block attacks with Divine Heal system

class KaelModule {
  static initializeAbilities(character) {
    if (character.emoji !== "👼🏻") return;
    
    character.abilityData = {
      phase: "black", // "black" or "white"
      blocksInPhase: 0,
      maxBlocksPerPhase: 3,
      lastBlockTime: 0,
      blockCooldown: 90, // 1.5 seconds between blocks
      allBlocksHit: false,
      
      // Divine Heal system
      consecutiveHitsReceived: 0,
      lastHitTime: 0,
      hitTimeWindow: 60, // 1 second window
      requiredHits: 20
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "👼🏻" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Handle block shooting
    if (currentTime - character.abilityData.lastBlockTime >= character.abilityData.blockCooldown) {
      this.shootNextBlock(character);
      character.abilityData.lastBlockTime = currentTime;
    }
  }

  static shootNextBlock(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Determine block properties based on phase and position
    let emoji, damage, blockType, size;
    
    if (data.phase === "black") {
      const blockSizes = ["▪️", "◾", "◼️"];
      const damages = [1, 2, 4];
      emoji = blockSizes[data.blocksInPhase];
      damage = damages[data.blocksInPhase];
      blockType = "black";
      size = 12 + (data.blocksInPhase * 4); // Small, medium, large
    } else {
      const blockSizes = ["▫️", "◽", "◻️"];
      emoji = blockSizes[data.blocksInPhase];
      damage = 0; // White blocks heal instead of damage
      blockType = "white";
      size = 12 + (data.blocksInPhase * 4);
    }
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create block projectile
    const block = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      emoji, damage, character, data.phase === "black" ? "blackblock" : "whiteblock",
      {
        blockType: blockType,
        kaelOwner: character,
        size: size,
        healAmount: data.phase === "white" ? [1, 2, 4][data.blocksInPhase] : 0
      }
    );
    
    projectiles.push(block);
    data.blocksInPhase++;
    
    console.log(`👼🏻 Kael shoots ${emoji} (${blockType} ${data.blocksInPhase}/3)`);
    audio.shoot();
    
    // Check if phase is complete
    if (data.blocksInPhase >= data.maxBlocksPerPhase) {
      this.completePhase(character);
    }
  }

  static completePhase(character) {
    const data = character.abilityData;
    
    // Check if all blocks in phase hit
    if (data.allBlocksHit) {
      this.shootEnhancedBlock(character);
      data.allBlocksHit = false;
    }
    
    // Switch phase
    if (data.phase === "black") {
      data.phase = "white";
      console.log("👼🏻 Switching to white block phase");
    } else {
      data.phase = "black";
      console.log("👼🏻 Switching to black block phase");
    }
    
    data.blocksInPhase = 0;
  }

  static shootEnhancedBlock(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    let emoji, damage, healAmount, blockType;
    
    if (data.phase === "black") {
      emoji = "🔲";
      damage = 6;
      healAmount = 0;
      blockType = "black";
    } else {
      emoji = "🔳";
      damage = 4;
      healAmount = 6;
      blockType = "white";
    }
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create enhanced block
    const enhancedBlock = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      emoji, damage, character, data.phase === "black" ? "blackblock" : "whiteblock",
      {
        blockType: blockType,
        kaelOwner: character,
        enhanced: true,
        canBlockProjectiles: true,
        healAmount: healAmount,
        size: 20
      }
    );
    
    projectiles.push(enhancedBlock);
    
    console.log(`👼🏻 Enhanced ${blockType} block ${emoji} fired!`);
    audio.ability();
  }

  static handleBlockHit(projectile, character) {
    if (character.team === projectile.owner.team) return;
    
    const blockType = projectile.data.blockType;
    
    if (blockType === "black") {
      // Black blocks deal damage
      character.takeDamage(projectile.damage, projectile.owner);
      
      // Enhanced black blocks heal Kael
      if (projectile.data.enhanced) {
        projectile.owner.heal(4);
        console.log("🔲 Enhanced black block hit! 6 damage + 4 heal to Kael");
      } else {
        console.log(`◼️ Black block hit for ${projectile.damage} damage`);
      }
    } else {
      // White blocks heal Kael
      projectile.owner.heal(projectile.data.healAmount);
      
      // Enhanced white blocks also damage enemy
      if (projectile.data.enhanced) {
        character.takeDamage(projectile.damage, projectile.owner);
        console.log("🔳 Enhanced white block hit! 6 heal + 4 damage");
      } else {
        console.log(`◻️ White block hit! +${projectile.data.healAmount} heal to Kael`);
      }
    }
    
    // Track if all blocks in phase hit
    this.trackBlockHit(projectile.owner);
    
    // Remove block
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static trackBlockHit(kael) {
    // This would need more complex tracking in a full implementation
    // For now, we'll assume all blocks hit for enhanced block triggering
    kael.abilityData.allBlocksHit = true;
  }

  static handleDamageReceived(character, amount) {
    if (character.emoji !== "👼🏻") return;
    
    const data = character.abilityData;
    const currentTime = gameTime;
    
    // Check if within time window
    if (currentTime - data.lastHitTime <= data.hitTimeWindow) {
      data.consecutiveHitsReceived++;
    } else {
      // Reset counter if too much time passed
      data.consecutiveHitsReceived = 1;
    }
    
    data.lastHitTime = currentTime;
    
    console.log(`👼🏻 Divine Heal tracking: ${data.consecutiveHitsReceived}/${data.requiredHits}`);
    
    // Check for Divine Heal trigger
    if (data.consecutiveHitsReceived >= data.requiredHits) {
      this.activateDivineHeal(character);
    }
  }

  static activateDivineHeal(character) {
    const data = character.abilityData;
    
    // Full heal
    character.hp = character.maxHp;
    
    // Reset counter
    data.consecutiveHitsReceived = 0;
    
    console.log("👼🏻 DIVINE HEAL ACTIVATED! Full HP restored!");
    audio.ability();
  }

  static handleEnhancedBlockVsProjectile(block, otherProjectile) {
    if (!block.data.enhanced || !block.data.canBlockProjectiles) return;
    
    // Block the other projectile
    const otherIndex = projectiles.indexOf(otherProjectile);
    if (otherIndex > -1) {
      projectiles.splice(otherIndex, 1);
      console.log(`${block.emoji} Enhanced block blocked ${otherProjectile.emoji}!`);
      audio.bounce();
    }
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "👼🏻") return;
    
    // Reset Divine Heal tracking
    character.abilityData.consecutiveHitsReceived = 0;
    console.log("👼🏻 Kael died, Divine Heal reset");
  }
}

class BlockProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.KaelModule = KaelModule;