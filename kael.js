// Kael Character Module
// 👼🏻 Kael - Sequential block attacks with Divine Heal

class KaelModule {
  static initializeAbilities(character) {
    if (character.emoji !== "👼🏻") return;
    
    character.abilityData = {
      // Attack sequence mechanics
      currentPhase: "black", // "black" or "white"
      blockIndex: 0, // Current block in sequence (0, 1, 2)
      lastBlockTime: 0, // Last time a block was fired
      blockCooldown: 90, // 1.5 seconds between blocks
      
      // Black block sequence
      blackBlocks: [
        { emoji: "▪️", damage: 1, size: "small" },
        { emoji: "◾", damage: 2, size: "medium" },
        { emoji: "◼️", damage: 4, size: "large" }
      ],
      blackBlocksHit: [], // Track which black blocks hit enemy
      blackEnhancedFired: false, // Whether black enhanced block was fired
      
      // White block sequence
      whiteBlocks: [
        { emoji: "▫️", heal: 1, size: "small" },
        { emoji: "◽", heal: 2, size: "medium" },
        { emoji: "◻️", heal: 4, size: "large" }
      ],
      whiteBlocksHit: [], // Track which white blocks hit enemy
      whiteEnhancedFired: false, // Whether white enhanced block was fired
      
      // Divine Heal mechanics
      damageHits: [], // Array of damage timestamps
      divineHealCooldown: 1000, // 1 second gap requirement (in ms)
      requiredHits: 20, // 20 hits required for Divine Heal
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "👼🏻" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle block sequence
    this.handleBlockSequence(character, currentTime);
    
    // Clean up old damage hits for Divine Heal
    this.cleanupDamageHits(character, currentTime);
  }

  static handleBlockSequence(character, currentTime) {
    const data = character.abilityData;
    
    // Check if it's time to fire next block
    if (currentTime - data.lastBlockTime < data.blockCooldown) return;
    
    if (data.currentPhase === "black") {
      this.handleBlackPhase(character, currentTime);
    } else if (data.currentPhase === "white") {
      this.handleWhitePhase(character, currentTime);
    }
  }

  static handleBlackPhase(character, currentTime) {
    const data = character.abilityData;
    
    // Fire regular black blocks
    if (data.blockIndex < 3) {
      this.fireBlackBlock(character, data.blockIndex, currentTime);
      data.blockIndex++;
    }
    // Fire enhanced black block if all 3 hit
    else if (!data.blackEnhancedFired && data.blackBlocksHit.length === 3) {
      this.fireBlackEnhancedBlock(character, currentTime);
      data.blackEnhancedFired = true;
      this.switchToWhitePhase(character);
    }
    // Switch to white phase if enhanced wasn't triggered
    else if (!data.blackEnhancedFired) {
      this.switchToWhitePhase(character);
    }
  }

  static handleWhitePhase(character, currentTime) {
    const data = character.abilityData;
    
    // Fire regular white blocks
    if (data.blockIndex < 3) {
      this.fireWhiteBlock(character, data.blockIndex, currentTime);
      data.blockIndex++;
    }
    // Fire enhanced white block if all 3 hit
    else if (!data.whiteEnhancedFired && data.whiteBlocksHit.length === 3) {
      this.fireWhiteEnhancedBlock(character, currentTime);
      data.whiteEnhancedFired = true;
      this.resetSequence(character);
    }
    // Reset sequence if enhanced wasn't triggered
    else if (!data.whiteEnhancedFired) {
      this.resetSequence(character);
    }
  }

  static fireBlackBlock(character, index, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    const blockData = data.blackBlocks[index];
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create black block projectile
    const block = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      blockData.emoji, blockData.damage, character, "blackblock",
      {
        kaelOwner: character,
        blockType: "black",
        blockSize: blockData.size,
        blockIndex: index,
        enhanced: false
      }
    );
    
    projectiles.push(block);
    data.lastBlockTime = currentTime;
    
    console.log(`Kael fired black ${blockData.size} block (${blockData.damage} damage) ${blockData.emoji}`);
    audio.shoot();
  }

  static fireWhiteBlock(character, index, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    const blockData = data.whiteBlocks[index];
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create white block projectile
    const block = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      blockData.emoji, 0, character, "whiteblock",
      {
        kaelOwner: character,
        blockType: "white",
        blockSize: blockData.size,
        blockIndex: index,
        healValue: blockData.heal,
        enhanced: false
      }
    );
    
    projectiles.push(block);
    data.lastBlockTime = currentTime;
    
    console.log(`Kael fired white ${blockData.size} block (${blockData.heal} heal) ${blockData.emoji}`);
    audio.shoot();
  }

  static fireBlackEnhancedBlock(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create enhanced black block
    const enhancedBlock = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🔲", 6, character, "blackblock",
      {
        kaelOwner: character,
        blockType: "black",
        blockSize: "enhanced",
        enhanced: true,
        healValue: 4,
        canBlockProjectiles: true
      }
    );
    
    projectiles.push(enhancedBlock);
    data.lastBlockTime = currentTime;
    
    console.log(`Kael fired ENHANCED black block! 🔲 (6 damage + 4 heal)`);
    audio.ability();
  }

  static fireWhiteEnhancedBlock(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create enhanced white block
    const enhancedBlock = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🔳", 4, character, "whiteblock",
      {
        kaelOwner: character,
        blockType: "white",
        blockSize: "enhanced",
        enhanced: true,
        healValue: 6,
        canBlockProjectiles: true
      }
    );
    
    projectiles.push(enhancedBlock);
    data.lastBlockTime = currentTime;
    
    console.log(`Kael fired ENHANCED white block! 🔳 (4 damage + 6 heal)`);
    audio.ability();
  }

  static switchToWhitePhase(character) {
    const data = character.abilityData;
    data.currentPhase = "white";
    data.blockIndex = 0;
    data.blackBlocksHit = [];
    data.blackEnhancedFired = false;
    
    console.log(`Kael switched to WHITE phase! ⚪`);
  }

  static resetSequence(character) {
    const data = character.abilityData;
    data.currentPhase = "black";
    data.blockIndex = 0;
    data.blackBlocksHit = [];
    data.whiteBlocksHit = [];
    data.blackEnhancedFired = false;
    data.whiteEnhancedFired = false;
    
    console.log(`Kael sequence reset! Starting BLACK phase! ⚫`);
  }

  static handleBlockHit(projectile, character) {
    if (projectile.type !== "blackblock" && projectile.type !== "whiteblock") return;
    
    const owner = projectile.owner;
    const data = projectile.data;
    
    if (character === owner) return; // Blocks don't hit Kael
    
    if (data.blockType === "black") {
      // Black block hit - deal damage
      character.takeDamage(projectile.damage, owner);
      
      // Track hit for enhanced trigger
      if (!data.enhanced) {
        owner.abilityData.blackBlocksHit.push(data.blockIndex);
        console.log(`Black ${data.blockSize} block hit! (${owner.abilityData.blackBlocksHit.length}/3 for enhanced)`);
      } else {
        // Enhanced black block - heal Kael too
        owner.heal(data.healValue);
        console.log(`Enhanced black block hit! ${projectile.damage} damage + ${data.healValue} heal to Kael`);
      }
    } else if (data.blockType === "white") {
      // White block hit - heal Kael
      owner.heal(data.healValue);
      
      if (!data.enhanced) {
        owner.abilityData.whiteBlocksHit.push(data.blockIndex);
        console.log(`White ${data.blockSize} block hit! +${data.healValue} HP (${owner.abilityData.whiteBlocksHit.length}/3 for enhanced)`);
      } else {
        // Enhanced white block - also deal damage
        character.takeDamage(projectile.damage, owner);
        console.log(`Enhanced white block hit! ${data.healValue} heal + ${projectile.damage} damage`);
      }
    }
    
    // Remove the block
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    audio.hit();
  }

  static handleEnhancedBlockVsProjectile(enhancedBlock, otherProjectile) {
    // Enhanced blocks can block other projectiles
    if (!enhancedBlock.data.canBlockProjectiles) return false;
    if (otherProjectile.owner === enhancedBlock.owner) return false; // Don't block own projectiles
    
    // Remove the other projectile
    const index = projectiles.indexOf(otherProjectile);
    if (index > -1) {
      projectiles.splice(index, 1);
      console.log(`Enhanced block blocked ${otherProjectile.emoji}! 🛡️`);
      audio.bounce();
    }
    
    // Enhanced block continues
    return true;
  }

  static handleDamageReceived(character, damage) {
    if (character.emoji !== "👼🏻") return;
    
    const data = character.abilityData;
    const currentTime = Date.now(); // Use real time for more precise 1-second gaps
    
    // Add this damage hit
    data.damageHits.push(currentTime);
    
    // Clean up old hits (older than 1 second)
    const oneSecondAgo = currentTime - data.divineHealCooldown;
    data.damageHits = data.damageHits.filter(hitTime => hitTime > oneSecondAgo);
    
    console.log(`Kael damage hit count: ${data.damageHits.length}/${data.requiredHits}`);
    
    // Check for Divine Heal trigger
    if (data.damageHits.length >= data.requiredHits) {
      this.triggerDivineHeal(character);
    }
  }

  static triggerDivineHeal(character) {
    const data = character.abilityData;
    
    // Full heal
    character.hp = character.maxHp;
    
    // Reset damage hit counter
    data.damageHits = [];
    
    console.log(`✨ DIVINE HEAL ACTIVATED! ✨ Kael restored to full HP!`);
    audio.ability();
    
    // Create visual effect
    this.createDivineHealEffect(character);
  }

  static createDivineHealEffect(character) {
    const canvas = document.getElementById('arena');
    const rect = canvas.getBoundingClientRect();
    
    // Create divine healing effect
    const effect = document.createElement('div');
    effect.style.position = 'absolute';
    effect.style.left = `${rect.left + character.x - 50}px`;
    effect.style.top = `${rect.top + character.y - 50}px`;
    effect.style.width = '100px';
    effect.style.height = '100px';
    effect.style.background = 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,215,0,0.6), transparent)';
    effect.style.borderRadius = '50%';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '1000';
    effect.style.animation = 'divineHeal 2s ease-out forwards';
    
    // Add angel symbols
    effect.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 30px;">✨👼🏻✨</div>';
    
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 2000);
  }

  static cleanupDamageHits(character, currentTime) {
    const data = character.abilityData;
    const realTime = Date.now();
    const oneSecondAgo = realTime - data.divineHealCooldown;
    
    // Remove hits older than 1 second
    const oldCount = data.damageHits.length;
    data.damageHits = data.damageHits.filter(hitTime => hitTime > oneSecondAgo);
    
    if (data.damageHits.length !== oldCount) {
      console.log(`Damage hits cleaned up: ${data.damageHits.length}/${data.requiredHits}`);
    }
  }

  static handleCharacterDeath(character) {
    // Clean up when Kael dies
    if (character.emoji === "👼🏻") {
      const data = character.abilityData;
      
      // Remove all block projectiles
      projectiles = projectiles.filter(p => {
        if ((p.type === "blackblock" || p.type === "whiteblock") && p.owner === character) {
          return false;
        }
        return true;
      });
      
      // Reset sequences
      this.resetSequence(character);
      data.damageHits = [];
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "👼🏻" || !character.abilityData) return null;
    
    const data = character.abilityData;
    return {
      currentPhase: data.currentPhase,
      blockIndex: data.blockIndex,
      blackBlocksHit: data.blackBlocksHit.length,
      whiteBlocksHit: data.whiteBlocksHit.length,
      damageHits: data.damageHits.length
    };
  }
}

// Block Projectile class extension
class BlockProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Check wall collision - blocks disappear when hitting borders
    const margin = this.size;
    if (this.x <= margin || this.x >= canvas.width - margin ||
        this.y <= margin || this.y >= canvas.height - margin) {
      const index = projectiles.indexOf(this);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      return false;
    }

    // Enhanced blocks can block other projectiles
    if (this.data.enhanced && this.data.canBlockProjectiles) {
      this.checkProjectileBlocking();
    }

    return true;
  }

  checkProjectileBlocking() {
    // Check collision with other projectiles
    projectiles.forEach(otherProjectile => {
      if (otherProjectile === this) return;
      if (otherProjectile.owner === this.owner) return; // Don't block own projectiles
      
      const dx = this.x - otherProjectile.x;
      const dy = this.y - otherProjectile.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < (this.size + otherProjectile.size)) {
        KaelModule.handleEnhancedBlockVsProjectile(this, otherProjectile);
      }
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add glow effects
    if (this.data.enhanced) {
      if (this.data.blockType === "black") {
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 15;
      }
      // Pulsing effect for enhanced blocks
      const pulse = Math.sin(this.age * 0.2) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
    } else {
      if (this.data.blockType === "black") {
        ctx.shadowColor = "#333333";
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowColor = "#cccccc";
        ctx.shadowBlur = 8;
      }
    }
    
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// Add CSS animations for effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes divineHeal {
      0% { 
        transform: scale(0) rotate(0deg);
        opacity: 1;
      }
      50% {
        transform: scale(1.5) rotate(180deg);
        opacity: 0.9;
      }
      100% { 
        transform: scale(3) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.KaelModule = KaelModule;
  window.BlockProjectile = BlockProjectile;
}