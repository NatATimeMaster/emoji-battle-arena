// Magico Character Module
// 🤵🏻 Magico - Sequential card attacks with unique effects

class MagicoModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🤵🏻") return;
    
    character.abilityData = {
      cardSequence: ["hearts", "spades", "clubs", "diamonds"],
      currentCard: 0,
      lastCardTime: 0,
      cardCooldown: 90, // 1.5 seconds between cards
      
      // Active effects
      activeEffects: [],
      
      // Card data
      cards: {
        hearts: { emoji: "♥️", effect: "heal" },
        spades: { emoji: "♠️", effect: "tempHP" },
        clubs: { emoji: "♣️", effect: "freeze" },
        diamonds: { emoji: "♦️", effect: "convert" }
      }
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🤵🏻" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Handle card throwing
    this.handleCardThrowing(character, currentTime);
    
    // Update active effects
    this.updateActiveEffects(character, currentTime);
  }

  static handleCardThrowing(character, currentTime) {
    const data = character.abilityData;
    
    if (currentTime - data.lastCardTime >= data.cardCooldown) {
      this.throwCard(character, currentTime);
      data.lastCardTime = currentTime;
    }
  }

  static throwCard(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    const cardType = data.cardSequence[data.currentCard];
    const cardInfo = data.cards[cardType];
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create card projectile
    const card = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      cardInfo.emoji, 0, character, "card",
      {
        cardType: cardType,
        magicoOwner: character,
        effect: cardInfo.effect
      }
    );
    
    projectiles.push(card);
    data.currentCard = (data.currentCard + 1) % data.cardSequence.length;
    
    console.log(`🤵🏻 Magico throws ${cardInfo.emoji} (${cardType})`);
    audio.shoot();
  }

  static handleCardHit(projectile, character) {
    if (character.team === projectile.owner.team) return;
    
    const cardType = projectile.data.cardType;
    const magico = projectile.owner;
    
    // Apply card effect
    switch (cardType) {
      case "hearts":
        this.handleHeartsEffect(magico, character);
        break;
      case "spades":
        this.handleSpadesEffect(magico, character);
        break;
      case "clubs":
        this.handleClubsEffect(magico, character);
        break;
      case "diamonds":
        this.handleDiamondsEffect(magico, character);
        break;
    }
    
    console.log(`${projectile.emoji} ${cardType} card hit ${character.emoji}!`);
    
    // Remove card
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    audio.hit();
  }

  static handleHeartsEffect(magico, enemy) {
    // Hearts: Recover 50% of current HP, or deal 5 damage if at full HP
    if (magico.hp >= magico.maxHp) {
      // At full HP - deal damage instead
      enemy.takeDamage(5, magico);
      console.log("♥️ Hearts at full HP: 5 damage to enemy");
    } else {
      // Heal 50% of current HP
      const healAmount = Math.floor(magico.hp * 0.5);
      magico.heal(healAmount);
      console.log(`♥️ Hearts effect: +${healAmount} HP to Magico`);
    }
  }

  static handleSpadesEffect(magico, enemy) {
    // Spades: Give enemy 50% of their current HP as temporary HP
    const tempHPAmount = Math.floor(enemy.hp * 0.5);
    enemy.addFakeHp(tempHPAmount);
    
    // Create spades effect to track decay
    const spadesEffect = {
      type: "spades",
      target: enemy,
      startTime: gameTime,
      currentTempHP: tempHPAmount
    };
    
    magico.abilityData.activeEffects.push(spadesEffect);
    
    console.log(`♠️ Spades effect: +${tempHPAmount} temporary HP to ${enemy.emoji}`);
  }

  static handleClubsEffect(magico, enemy) {
    // Clubs: Freeze enemy - duration depends on spades effect
    const hasSpades = magico.abilityData.activeEffects.some(
      effect => effect.type === "spades" && effect.target === enemy
    );
    
    const freezeDuration = hasSpades ? 600 : 180; // 10 seconds if spades active, 3 seconds otherwise
    
    enemy.freeze(freezeDuration);
    
    console.log(`♣️ Clubs effect: ${enemy.emoji} frozen for ${freezeDuration/60} seconds`);
  }

  static handleDiamondsEffect(magico, enemy) {
    // Diamonds: Convert spades temporary HP to damage, or deal 3 damage
    const spadesEffect = magico.abilityData.activeEffects.find(
      effect => effect.type === "spades" && effect.target === enemy
    );
    
    if (spadesEffect) {
      // Convert all temporary HP to damage
      const damageAmount = enemy.fakeHp;
      enemy.fakeHp = 0; // Remove all fake HP
      enemy.takeDamage(damageAmount, magico);
      
      // Remove spades effect
      const index = magico.abilityData.activeEffects.indexOf(spadesEffect);
      if (index > -1) {
        magico.abilityData.activeEffects.splice(index, 1);
      }
      
      console.log(`♦️ Diamonds effect: ${damageAmount} damage from converted temp HP`);
    } else {
      // No spades effect - deal 3 damage
      enemy.takeDamage(3, magico);
      console.log("♦️ Diamonds effect: 3 damage");
    }
  }

  static updateActiveEffects(character, currentTime) {
    const data = character.abilityData;
    
    // Update and filter active effects
    data.activeEffects = data.activeEffects.filter(effect => {
      if (effect.type === "spades") {
        return this.updateSpadesEffect(effect, effect.target, currentTime);
      }
      return true;
    });
  }

  static updateSpadesEffect(effect, target, currentTime) {
    const elapsedTime = currentTime - effect.startTime;
    
    // Decay temp HP by 1 per second (60 frames)
    if (elapsedTime > 0 && elapsedTime % 60 === 0) {
      if (target.fakeHp > 0) {
        target.fakeHp--;
        effect.currentTempHP--;
        console.log(`♠️ Spades decay: ${target.emoji} temp HP -1 (${target.fakeHp} remaining)`);
      }
    }
    
    // Remove effect if no temp HP left or target is dead
    if (target.fakeHp <= 0 || target.isDead) {
      console.log(`♠️ Spades effect ended for ${target.emoji}`);
      return false;
    }
    
    return true;
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "🤵🏻") return;
    
    // Clear active effects when Magico dies
    character.abilityData.activeEffects = [];
    console.log("🤵🏻 Magico died, card effects cleared");
  }
}

class CardProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.MagicoModule = MagicoModule;