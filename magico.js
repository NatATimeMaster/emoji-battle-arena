// Magico Character Module
// 🤵🏻 Magico - Cards of Life and Death with complex interactions

class MagicoModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🤵🏻") return;
    
    character.abilityData = {
      // Card throwing mechanics
      cards: ["♥️", "♠️", "♣️", "♦️"],
      cardIndex: 0, // Current card to throw (0-3)
      lastCardTime: 0, // Last time a card was thrown
      cardCooldown: 120, // 2 seconds between cards
      
      // Card effects tracking
      activeEffects: new Map(), // Track effects on different characters
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🤵🏻" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle card throwing
    this.handleCardThrowing(character, currentTime);
    
    // Update active effects
    this.updateActiveEffects(character, currentTime);
  }

  static handleCardThrowing(character, currentTime) {
    const data = character.abilityData;
    
    // Check if it's time to throw next card
    if (currentTime - data.lastCardTime >= data.cardCooldown) {
      this.throwCard(character, currentTime);
    }
  }

  static throwCard(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    const cardEmoji = data.cards[data.cardIndex];
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 4;
    
    // Create card projectile
    const card = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      cardEmoji, 0, character, "card",
      {
        magicoOwner: character,
        cardType: this.getCardType(cardEmoji),
        cardEmoji: cardEmoji
      }
    );
    
    projectiles.push(card);
    data.lastCardTime = currentTime;
    
    // Advance to next card (cycle through all 4)
    data.cardIndex = (data.cardIndex + 1) % 4;
    
    console.log(`Magico threw ${cardEmoji} card! Next: ${data.cards[data.cardIndex]}`);
    audio.shoot();
  }

  static getCardType(emoji) {
    switch (emoji) {
      case "♥️": return "hearts";
      case "♠️": return "spades";
      case "♣️": return "clubs";
      case "♦️": return "diamonds";
      default: return "unknown";
    }
  }

  static handleCardHit(projectile, character) {
    if (projectile.type !== "card") return;
    
    const owner = projectile.owner;
    const data = projectile.data;
    
    if (character === owner) return; // Cards don't hit Magico
    
    // Handle specific card effects
    switch (data.cardType) {
      case "hearts":
        this.handleHeartsEffect(owner, character);
        break;
      case "spades":
        this.handleSpadesEffect(owner, character);
        break;
      case "clubs":
        this.handleClubsEffect(owner, character);
        break;
      case "diamonds":
        this.handleDiamondsEffect(owner, character);
        break;
    }
    
    // Remove the card
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    audio.hit();
  }

  static handleHeartsEffect(magico, enemy) {
    // ♥️ Hearts: Heal Magico for 50% of current HP, or 5 damage if at full HP
    if (magico.hp >= magico.maxHp) {
      // At full HP - deal 5 damage to enemy instead
      enemy.takeDamage(5, magico);
      console.log(`♥️ Hearts: Magico at full HP, dealt 5 damage to enemy!`);
    } else {
      // Heal 50% of current HP
      const healAmount = Math.floor(magico.hp * 0.5);
      magico.heal(healAmount);
      console.log(`♥️ Hearts: Magico healed ${healAmount} HP (50% of current ${magico.hp - healAmount})`);
    }
  }

  static handleSpadesEffect(magico, enemy) {
    // ♠️ Spades: Give enemy temporary HP equal to 50% of their current HP
    const tempHpAmount = Math.floor(enemy.hp * 0.5);
    
    // Add fake HP (temporary HP)
    enemy.addFakeHp(tempHpAmount);
    
    // Track spades effect for interactions with other cards
    const effectData = {
      type: "spades",
      tempHpAmount: tempHpAmount,
      startTime: gameTime,
      decayRate: 60, // 1 HP per second (60 frames)
      lastDecayTime: gameTime
    };
    
    magico.abilityData.activeEffects.set(enemy, effectData);
    
    console.log(`♠️ Spades: Enemy gained ${tempHpAmount} temporary HP (50% of ${enemy.hp})`);
  }

  static handleClubsEffect(magico, enemy) {
    // ♣️ Clubs: Freeze enemy - 10 seconds if spades active, 3 seconds otherwise
    const spadesEffect = magico.abilityData.activeEffects.get(enemy);
    const isSpadeActive = spadesEffect && spadesEffect.type === "spades";
    
    const freezeDuration = isSpadeActive ? 600 : 180; // 10 seconds or 3 seconds at 60fps
    enemy.freeze(freezeDuration);
    
    console.log(`♣️ Clubs: Enemy frozen for ${freezeDuration / 60} seconds (Spades ${isSpadeActive ? 'active' : 'inactive'})`);
  }

  static handleDiamondsEffect(magico, enemy) {
    // ♦️ Diamonds: Convert all temp HP to damage if spades active, otherwise 3 damage
    const spadesEffect = magico.abilityData.activeEffects.get(enemy);
    const isSpadeActive = spadesEffect && spadesEffect.type === "spades";
    
    if (isSpadeActive) {
      // Convert all fake HP to real damage
      const fakeHpAmount = enemy.fakeHp;
      if (fakeHpAmount > 0) {
        enemy.fakeHp = 0; // Remove all fake HP
        enemy.takeDamage(fakeHpAmount, magico); // Deal equivalent damage
        console.log(`♦️ Diamonds: Converted ${fakeHpAmount} fake HP into real damage!`);
        
        // Remove spades effect
        magico.abilityData.activeEffects.delete(enemy);
      } else {
        console.log(`♦️ Diamonds: No fake HP to convert!`);
      }
    } else {
      // Simple 3 damage
      enemy.takeDamage(3, magico);
      console.log(`♦️ Diamonds: Dealt 3 damage (no Spades effect)`);
    }
  }

  static updateActiveEffects(character, currentTime) {
    const data = character.abilityData;
    
    // Update all active effects
    data.activeEffects.forEach((effect, target) => {
      if (effect.type === "spades") {
        this.updateSpadesEffect(effect, target, currentTime);
      }
    });
    
    // Clean up expired effects
    data.activeEffects.forEach((effect, target) => {
      if (target.isDead || target.fakeHp <= 0) {
        data.activeEffects.delete(target);
      }
    });
  }

  static updateSpadesEffect(effect, target, currentTime) {
    // Decay temporary HP by 1 per second
    if (currentTime - effect.lastDecayTime >= effect.decayRate) {
      if (target.fakeHp > 0) {
        target.fakeHp = Math.max(0, target.fakeHp - 1);
        effect.lastDecayTime = currentTime;
        
        if (target.fakeHp <= 0) {
          console.log(`♠️ Spades effect expired on ${target.emoji} (fake HP decayed to 0)`);
        }
      }
    }
  }

  static handleCharacterDeath(character) {
    // Clean up when Magico dies
    if (character.emoji === "🤵🏻") {
      const data = character.abilityData;
      
      // Remove all card projectiles
      projectiles = projectiles.filter(p => {
        if (p.type === "card" && p.owner === character) {
          return false;
        }
        return true;
      });
      
      // Clear active effects
      data.activeEffects.clear();
    }
    
    // Clean up effects if affected character dies
    charactersInArena.forEach(c => {
      if (c.emoji === "🤵🏻" && c.abilityData) {
        c.abilityData.activeEffects.delete(character);
      }
    });
  }

  static getStatusInfo(character) {
    if (character.emoji !== "🤵🏻" || !character.abilityData) return null;
    
    const data = character.abilityData;
    return {
      nextCard: data.cards[data.cardIndex],
      cardIndex: data.cardIndex,
      activeEffects: data.activeEffects.size
    };
  }
}

// Card Projectile class extension
class CardProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Check wall collision - cards disappear when hitting borders
    const margin = this.size;
    if (this.x <= margin || this.x >= canvas.width - margin ||
        this.y <= margin || this.y >= canvas.height - margin) {
      const index = projectiles.indexOf(this);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      return false;
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add card-specific glow effects
    switch (this.data.cardType) {
      case "hearts":
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 10;
        break;
      case "spades":
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 10;
        break;
      case "clubs":
        ctx.shadowColor = "#008000";
        ctx.shadowBlur = 10;
        break;
      case "diamonds":
        ctx.shadowColor = "#0080ff";
        ctx.shadowBlur = 10;
        break;
    }
    
    // Add spinning effect
    const rotation = this.age * 0.1;
    ctx.translate(this.x, this.y);
    ctx.rotate(rotation);
    
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.MagicoModule = MagicoModule;
  window.CardProjectile = CardProjectile;
}