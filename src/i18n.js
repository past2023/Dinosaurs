(function(){
  const strings = {
    en: {
      title: 'Dinosaurs and Soldiers',
      start: 'Start Mission 1',
      characters: 'Choose Character',
      chooseCharacter: 'Choose Your Soldier',
      controls: 'Controls',
      language: 'Language',
      back: 'Back',
      paused: 'Paused',
      resume: 'Resume',
      quit: 'Quit to Menu',
      retry: 'Retry',
      backToMenu: 'Back to Menu',
      lives: 'Lives',
      score: 'Score',
      mission1: 'Mission 1: Jungle Outskirts',
      youDied: 'You were defeated!',
      missionClear: 'Mission Clear!'
    },
    es: {
      title: 'Dinosaurios y Soldados', start: 'Iniciar Misión 1', characters: 'Elegir Personaje', chooseCharacter: 'Elige tu Soldado', controls: 'Controles', language: 'Idioma', back: 'Volver', paused: 'Pausado', resume: 'Reanudar', quit: 'Salir al Menú', retry: 'Reintentar', backToMenu: 'Volver al Menú', lives: 'Vidas', score: 'Puntuación', mission1: 'Misión 1: Afueras de la Jungla', youDied: '¡Fuiste derrotado!', missionClear: '¡Misión completada!'
    },
    fr: {
      title: 'Dinosaures et Soldats', start: 'Commencer Mission 1', characters: 'Choisir Personnage', chooseCharacter: 'Choisissez votre soldat', controls: 'Contrôles', language: 'Langue', back: 'Retour', paused: 'En pause', resume: 'Reprendre', quit: 'Quitter au menu', retry: 'Réessayer', backToMenu: 'Retour au menu', lives: 'Vies', score: 'Score', mission1: 'Mission 1 : Lisière de la jungle', youDied: 'Vous avez été vaincu !', missionClear: 'Mission terminée !'
    },
    it: {
      title: 'Dinosauri e Soldati', start: 'Avvia Missione 1', characters: 'Scegli Personaggio', chooseCharacter: 'Scegli il tuo soldato', controls: 'Comandi', language: 'Lingua', back: 'Indietro', paused: 'In pausa', resume: 'Riprendi', quit: 'Esci al menù', retry: 'Riprova', backToMenu: 'Torna al menù', lives: 'Vite', score: 'Punteggio', mission1: 'Missione 1: Periferia della giungla', youDied: 'Sei stato sconfitto!', missionClear: 'Missione completata!'
    },
    pt: {
      title: 'Dinossauros e Soldados', start: 'Iniciar Missão 1', characters: 'Escolher Personagem', chooseCharacter: 'Escolha seu soldado', controls: 'Controles', language: 'Idioma', back: 'Voltar', paused: 'Pausado', resume: 'Continuar', quit: 'Sair para o menu', retry: 'Tentar novamente', backToMenu: 'Voltar ao menu', lives: 'Vidas', score: 'Pontuação', mission1: 'Missão 1: Arredores da Selva', youDied: 'Você foi derrotado!', missionClear: 'Missão concluída!'
    }
  };

  function applyI18n(lang) {
    const dict = strings[lang] || strings.en;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
  }

  window.I18N = { strings, applyI18n };
})();
