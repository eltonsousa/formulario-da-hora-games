/**
 * Lógica JavaScript para o aplicativo de configuração do Xbox 360.
 * Este script gerencia a interação do formulário, validações,
 * formatação de entrada e a integração com o WhatsApp, agora
 * utilizando as funções de banco de dados do `supabase_db.js`
 * para salvar os dados do formulário no Supabase, e também inclui
 * a funcionalidade de fornecer a localização da loja.
 */

const { initialize: initializeSupabase, saveXboxConfig } = window.supabaseDb;

document.addEventListener("DOMContentLoaded", async function () {
  // --- Objeto de Configuração Centralizado ---
  const config = {
    whatsappNumber: "5592993312208", // ALtere para o seu número de WhatsApp!
    // Removidas latitude e longitude. Usar a URL direta abaixo.
    storeLocationUrl: "https://maps.app.goo.gl/9BWP7ztqomQJdKP57", // SUBSTITUA PELA URL REAL DA SUA LOJA NO GOOGLE MAPS!
    instagramUrl:
      "https://www.instagram.com/dahora_games?igsh=NDZqMW5tYTVsOHR1", // SUBSTITUA PELA SUA URL DO INSTAGRAM
  };

  const GAME_LIMIT_BLOQUEADO = 15; // Nova constante para o limite de jogos

  const PRICES = {
    bloqueado: 150.0,
    desbloqueado: {
      10: 50.0,
      20: 100.0,
    },
  };

  const MESSAGES = {
    REQUIRED_FIELD: "Este campo é obrigatório.",
    INVALID_TELEPHONE: "Por favor, insira um telefone válido (XX) XXXXX-XXXX.",
    INVALID_EMAIL: "Por favor, insira um e-mail válido.",
    SELECT_HD_OPTION: "Por favor, selecione uma opção de HD.",
    SELECT_GAMES_OR_NO_HD:
      "Escolha pelo menos um jogo ou desmarque a opção de HD se não quiser copiar jogos.",
    GAME_LIMIT_EXCEEDED: (max) =>
      `Você só pode escolher no máximo ${max} jogos.`,
    GAME_PACKAGE_REQUIRED: "Por favor, selecione um pacote de jogos.",
    GENERIC_ERROR: (msg) => `Erro inesperado: ${msg}`,
    DB_SAVE_ERROR: (msg) => `Erro ao salvar no banco de dados: ${msg}`,
    SENDING_WHATSAPP: "Enviando dados...", // Alterado para 'Enviando dados...'
    LOADING_LOCATION: "Abrindo localização...", // Alterado para 'Abrindo localização...'
    LOADING_INSTAGRAM: "Abrindo Insta...", // Alterado para 'Abrindo Insta...'
    ORIGINAL_WHATSAPP_TEXT:
      '<i class="fab fa-whatsapp mr-2"></i> Enviar para WhatsApp',
    ORIGINAL_LOCATION_TEXT:
      '<i class="fas fa-map-marker-alt mr-2"></i> Ver Localização da Loja',
    ORIGINAL_INSTAGRAM_TEXT:
      '<i class="fab fa-instagram mr-2"></i> Nosso Instagram',
    UNSAVED_CHANGES_WARNING:
      "Você tem alterações não salvas. Tem certeza que deseja sair?",
    XBOX_2015_WARNING: "Não será possível fazer desbloqueio definitivo!",
  };

  const CSS_CLASSES = {
    HIDDEN: "hidden",
    BORDER_RED: "border-red-500",
    BG_GREEN: "bg-green-600",
    BG_GREEN_HOVER: "hover:bg-green-700",
    BG_BLUE: "bg-blue-600", // Adicionado para consistência
    BG_BLUE_HOVER: "hover:bg-blue-700", // Adicionado para consistência
    BG_PINK: "bg-pink-600", // Adicionado para consistência
    BG_PINK_HOVER: "hover:bg-pink-700", // Adicionado para consistência
    BG_DISABLED: "bg-gray-600",
    CURSOR_NOT_ALLOWED: "cursor-not-allowed",
    TEXT_RED: "text-red-400",
    TEXT_LG: "text-lg",
    FONT_BOLD: "font-bold",
    BG_BLUE_200: "bg-blue-200",
    TEXT_BLUE_800: "text-blue-800",
    BG_RED_200: "bg-red-200",
    TEXT_RED_800: "text-red-800",
    BG_GREEN_200: "bg-green-200",
    TEXT_GREEN_800: "text-green-800",
  };

  const form = document.getElementById("xboxConfigForm");
  const enviarWhatsappBtn = document.getElementById("enviarWhatsapp");
  const viewStoreLocationBtn = document.getElementById("viewStoreLocationBtn");
  const ondeEncontrarBtn = document.getElementById("ondeEncontrarBtn");
  const instagramBtn = document.getElementById("instagramBtn");
  const yearHelpMessage = document.getElementById("yearHelpMessage");
  const telefoneInput = document.getElementById("telefone");
  const emailInput = document.getElementById("email");
  const hdInternoRadio = document.getElementById("hdInterno");
  const hdExternoRadio = document.getElementById("hdExterno");
  const pendriveRadio = document.getElementById("pendrive");
  const hdWarning = document.getElementById("hdWarning");
  const gameCheckboxes = document.querySelectorAll('input[name="jogos"]');
  const gameLimitWarning = document.getElementById("gameLimitWarning");
  const messageBox = document.getElementById("messageBox");
  const gameCountDisplay = document.getElementById("gameCountDisplay");
  const maxGameLimit = document.getElementById("maxGameLimit");
  const gameSelectionDetails = document.getElementById("gameSelectionDetails");
  const gamePackagesSection = document.getElementById("gamePackagesSection");
  const desbloqueadoRadio = document.getElementById("desbloqueado");
  const bloqueadoRadio = document.getElementById("bloqueado");
  const errorGamePackage = document.getElementById("error-gamePackage");

  // Referências aos elementos do modal de confirmação
  const confirmationModal = document.getElementById("confirmationModal");
  const confirmationMessage = document.getElementById("confirmationMessage");
  const confirmActionBtn = document.getElementById("confirmActionBtn");
  const cancelActionBtn = document.getElementById("cancelActionBtn");

  const errorNome = document.getElementById("error-nome");
  const errorTelefone = document.getElementById("error-telefone");
  const errorEmail = document.getElementById("error-email");
  const errorEndereco = document.getElementById("error-endereco");
  const errorModeloXbox = document.getElementById("error-modeloXbox");
  const errorAnoXbox = document.getElementById("error-anoXbox");
  const errorTipoHd = document.getElementById("error-tipoHd");

  let isFormDirty = false;
  let onConfirmAction = null; // Variável para armazenar o callback de confirmação

  /**
   * Exibe uma mensagem global de feedback para o usuário.
   * @param {string} msg A mensagem a ser exibida.
   * @param {'success'|'error'|'info'} type O tipo da mensagem (determina a cor e estilo).
   */
  function showGlobalMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.className = `mt-4 p-3 rounded-lg text-center ${CSS_CLASSES.FONT_BOLD}`;

    if (type === "error") {
      messageBox.classList.add(
        CSS_CLASSES.BG_RED_200,
        CSS_CLASSES.TEXT_RED_800
      );
    } else if (type === "success") {
      messageBox.classList.add(
        CSS_CLASSES.BG_GREEN_200,
        CSS_CLASSES.TEXT_GREEN_800,
        CSS_CLASSES.TEXT_LG
      );
    } else if (type === "info") {
      messageBox.classList.add(
        CSS_CLASSES.BG_BLUE_200,
        CSS_CLASSES.TEXT_BLUE_800
      );
    }
    messageBox.classList.remove(CSS_CLASSES.HIDDEN);

    setTimeout(() => {
      messageBox.classList.add(CSS_CLASSES.HIDDEN);
    }, 5000);
  }

  /**
   * Exibe ou oculta uma mensagem de erro inline para um campo específico.
   * Adiciona ou remove a classe de borda vermelha do input.
   * @param {HTMLElement} errorElement O elemento <div> que exibirá a mensagem de erro.
   * @param {HTMLElement | null} inputElement O elemento <input> ou <select> associado ao erro (pode ser null para radios).
   * @param {string} message A mensagem de erro a ser exibida.
   */
  function showInlineError(errorElement, inputElement, message) {
    if (message) {
      errorElement.textContent = message;
      errorElement.classList.remove(CSS_CLASSES.HIDDEN);
      if (inputElement && inputElement.type !== "radio") {
        inputElement.classList.add(CSS_CLASSES.BORDER_RED);
      }
    } else {
      errorElement.textContent = "";
      errorElement.classList.add(CSS_CLASSES.HIDDEN);
      if (inputElement && inputElement.type !== "radio") {
        inputElement.classList.remove(CSS_CLASSES.BORDER_RED);
      }
    }
  }

  /**
   * Formata o número de telefone no padrão (XX) XXXXX-XXXX.
   * @param {string} value O valor bruto do input de telefone.
   * @returns {string} O número de telefone formatado.
   */
  function formatTelefone(value) {
    if (!value) return "";
    let cleanedValue = value.replace(/\D/g, ""); // Remove tudo que não for dígito
    let formattedValue = "";

    if (cleanedValue.length > 0) {
      formattedValue += "(" + cleanedValue.substring(0, 2);
    }
    if (cleanedValue.length >= 3) {
      formattedValue += ") " + cleanedValue.substring(2, 7);
    }
    if (cleanedValue.length >= 8) {
      formattedValue += "-" + cleanedValue.substring(7, 11);
    }
    return formattedValue;
  }

  /**
   * Define o estado de carregamento para um botão específico.
   * @param {HTMLElement} button O elemento do botão.
   * @param {boolean} isLoading Se o botão está no estado de carregamento.
   * @param {string} loadingText O texto a ser exibido durante o carregamento.
   * @param {string} originalText O texto original do botão (com ícone HTML, se houver).
   * @param {string} normalBgClass A classe Tailwind CSS para a cor de fundo normal.
   * @param {string} hoverBgClass A classe Tailwind CSS para a cor de fundo ao passar o mouse.
   * @param {string} disabledBgClass A classe Tailwind CSS para a cor de fundo quando desabilitado.
   */
  function setButtonLoadingState(
    button,
    isLoading,
    loadingText,
    originalText,
    normalBgClass,
    hoverBgClass,
    disabledBgClass
  ) {
    button.disabled = isLoading;
    if (isLoading) {
      button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ${loadingText}`; // Adiciona spinner e texto de carregamento
      button.classList.remove(normalBgClass, hoverBgClass);
      button.classList.add(disabledBgClass, CSS_CLASSES.CURSOR_NOT_ALLOWED);
    } else {
      button.innerHTML = originalText; // Retorna ao texto e ícone original
      button.classList.add(normalBgClass, hoverBgClass);
      button.classList.remove(disabledBgClass, CSS_CLASSES.CURSOR_NOT_ALLOWED);
    }
  }

  /**
   * Define o estado de carregamento para o botão de envio do formulário.
   * @param {boolean} isLoading Se o botão está no estado de carregamento.
   */
  function setFormLoadingState(isLoading) {
    setButtonLoadingState(
      enviarWhatsappBtn,
      isLoading,
      MESSAGES.SENDING_WHATSAPP,
      MESSAGES.ORIGINAL_WHATSAPP_TEXT,
      CSS_CLASSES.BG_GREEN,
      CSS_CLASSES.BG_GREEN_HOVER,
      CSS_CLASSES.BG_DISABLED
    );
  }

  /**
   * Atualiza a contagem de jogos selecionados no display.
   */
  function updateGameCountDisplay(maxGames) {
    const selectedGamesCount = document.querySelectorAll(
      'input[name="jogos"]:checked'
    ).length;
    gameCountDisplay.textContent = selectedGamesCount;
    maxGameLimit.textContent = maxGames;
  }

  /**
   * Adiciona listeners para detectar alterações no formulário e marcar como "sujo".
   */
  function addFormDirtyListeners() {
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        isFormDirty = true;
      });
      input.addEventListener("change", () => {
        isFormDirty = true;
      });
    });
  }

  /**
   * Reseta o estado "sujo" do formulário.
   */
  function resetFormDirtyState() {
    isFormDirty = false;
  }

  // --- Funções de Validação ---
  function validateNome() {
    const input = document.getElementById("nome");
    if (!input.value.trim()) {
      showInlineError(errorNome, input, MESSAGES.REQUIRED_FIELD);
      return false;
    }
    showInlineError(errorNome, input, "");
    return true;
  }

  function validateTelefone() {
    const input = document.getElementById("telefone");
    if (!input.value.trim() || input.value.replace(/\D/g, "").length < 10) {
      showInlineError(errorTelefone, input, MESSAGES.INVALID_TELEPHONE);
      return false;
    }
    showInlineError(errorTelefone, input, "");
    return true;
  }

  function validateEmail() {
    const input = document.getElementById("email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!input.value.trim() || !emailRegex.test(input.value.trim())) {
      showInlineError(errorEmail, input, MESSAGES.INVALID_EMAIL);
      return false;
    }
    showInlineError(errorEmail, input, "");
    return true;
  }

  function validateEndereco() {
    const input = document.getElementById("endereco");
    if (!input.value.trim()) {
      showInlineError(errorEndereco, input, MESSAGES.REQUIRED_FIELD);
      return false;
    }
    showInlineError(errorEndereco, input, "");
    return true;
  }

  function validateModeloXbox() {
    const input = document.getElementById("modeloXbox");
    if (!input.value) {
      showInlineError(errorModeloXbox, input, MESSAGES.REQUIRED_FIELD);
      return false;
    }
    showInlineError(errorModeloXbox, input, "");
    return true;
  }

  function validateAnoXbox() {
    const input = document.getElementById("anoXbox");
    const selectedYear = input.value;
    let isValid = true;

    if (!selectedYear) {
      showInlineError(errorAnoXbox, input, MESSAGES.REQUIRED_FIELD);
      isValid = false;
    } else if (selectedYear === "2015") {
      showInlineError(errorAnoXbox, input, MESSAGES.XBOX_2015_WARNING);
    } else {
      showInlineError(errorAnoXbox, input, "");
    }
    return isValid;
  }

  function validateTipoHd() {
    const anyHdSelected =
      hdInternoRadio.checked || hdExternoRadio.checked || pendriveRadio.checked;
    if (!anyHdSelected) {
      showInlineError(errorTipoHd, null, MESSAGES.SELECT_HD_OPTION);
      return false;
    }
    showInlineError(errorTipoHd, null, "");
    return true;
  }

  function validateGamePackage() {
    const desbloqueadoOunao = document.querySelector(
      'input[name="desbloqueadoOunao"]:checked'
    )?.value;
    if (desbloqueadoOunao === "Desbloqueado") {
      const selectedPackage = document.querySelector(
        'input[name="gamePackage"]:checked'
      );
      if (!selectedPackage) {
        showInlineError(errorGamePackage, null, MESSAGES.GAME_PACKAGE_REQUIRED);
        return false;
      }
      showInlineError(errorGamePackage, null, "");
      return true;
    }
    return true; // Não precisa de pacote se for bloqueado
  }

  function validateGameSelection() {
    const desbloqueadoOunao = document.querySelector(
      'input[name="desbloqueadoOunao"]:checked'
    )?.value;
    const selectedGamesCount = document.querySelectorAll(
      'input[name="jogos"]:checked'
    ).length;

    if (desbloqueadoOunao === "Desbloqueado") {
      const selectedPackage = document.querySelector(
        'input[name="gamePackage"]:checked'
      )?.value;
      const maxGames = selectedPackage ? parseInt(selectedPackage) : 0;
      if (selectedGamesCount > maxGames) {
        gameLimitWarning.textContent = MESSAGES.GAME_LIMIT_EXCEEDED(maxGames);
        gameLimitWarning.classList.remove(CSS_CLASSES.HIDDEN);
        return false;
      }
    } else if (desbloqueadoOunao === "Bloqueado") {
      if (selectedGamesCount > GAME_LIMIT_BLOQUEADO) {
        gameLimitWarning.textContent =
          MESSAGES.GAME_LIMIT_EXCEEDED(GAME_LIMIT_BLOQUEADO);
        gameLimitWarning.classList.remove(CSS_CLASSES.HIDDEN);
        return false;
      }
    }

    gameLimitWarning.classList.add(CSS_CLASSES.HIDDEN);
    return true;
  }

  /**
   * Valida todos os campos do formulário.
   * @returns {boolean} True se o formulário for válido, false caso contrário.
   */
  function validateForm() {
    let isValid = true;

    // Executa todas as validações e mantém o isValid em false se alguma falhar
    isValid = validateNome() && isValid;
    isValid = validateTelefone() && isValid;
    isValid = validateEmail() && isValid;
    isValid = validateEndereco() && isValid;
    isValid = validateModeloXbox() && isValid;
    isValid = validateAnoXbox() && isValid;
    isValid = validateTipoHd() && isValid;
    isValid = validateGamePackage() && isValid;
    isValid = validateGameSelection() && isValid;

    const anyHdSelected =
      hdInternoRadio.checked || hdExternoRadio.checked || pendriveRadio.checked;
    const jogosSelecionadosCount = document.querySelectorAll(
      'input[name="jogos"]:checked'
    ).length;

    if (anyHdSelected && jogosSelecionadosCount === 0) {
      showGlobalMessage(MESSAGES.SELECT_GAMES_OR_NO_HD, "error");
      isValid = false;
    } else if (!anyHdSelected && jogosSelecionadosCount > 0) {
      showGlobalMessage("Desmarque os jogos se não for usar HD.", "error");
      isValid = false;
    }

    if (!isValid) {
      const firstInvalidInput = form.querySelector(".border-red-500");
      if (firstInvalidInput) {
        firstInvalidInput.focus();
      }
    }
    return isValid;
  }

  /**
   * Lida com a seleção de HD, habilitando/desabilitando a seleção de jogos.
   */
  function handleHdSelection() {
    const anyHdSelected =
      hdInternoRadio.checked || hdExternoRadio.checked || pendriveRadio.checked;

    if (!anyHdSelected) {
      hdWarning.classList.remove(CSS_CLASSES.HIDDEN);
      gameCheckboxes.forEach((checkbox) => {
        checkbox.checked = false;
        checkbox.disabled = true;
      });
    } else {
      hdWarning.classList.add(CSS_CLASSES.HIDDEN);
      gameCheckboxes.forEach((checkbox) => {
        checkbox.disabled = false;
      });
    }
    validateGameSelection();
    updateGameCountDisplay();
    validateTipoHd();
  }

  /**
   * Exibe um modal de confirmação com uma mensagem e um callback para quando confirmado.
   * @param {string} message A mensagem a ser exibida no modal.
   * @param {Function} callback A função a ser executada se o usuário confirmar.
   */
  function showConfirmationModal(message, callback) {
    confirmationMessage.textContent = message;
    onConfirmAction = callback; // Armazena o callback
    confirmationModal.classList.remove(CSS_CLASSES.HIDDEN);
  }

  // Event listeners para os botões do modal de confirmação
  confirmActionBtn.addEventListener("click", () => {
    if (onConfirmAction) {
      onConfirmAction(); // Executa o callback armazenado
    }
    confirmationModal.classList.add(CSS_CLASSES.HIDDEN); // Esconde o modal
    onConfirmAction = null; // Limpa o callback
    setFormLoadingState(false); // Garante que o botão de envio esteja habilitado
  });

  cancelActionBtn.addEventListener("click", () => {
    confirmationModal.classList.add(CSS_CLASSES.HIDDEN); // Esconde o modal
    onConfirmAction = null; // Limpa o callback
    setFormLoadingState(false); // Garante que o botão de envio esteja habilitado
  });

  // --- Funções para controlar a visibilidade das opções de jogo ---
  function handleConsoleTypeSelection() {
    const isDesbloqueado = desbloqueadoRadio.checked;
    gamePackagesSection.classList.toggle(CSS_CLASSES.HIDDEN, !isDesbloqueado);

    // Reseta as seleções de jogos se o tipo de console mudar
    gameCheckboxes.forEach((checkbox) => (checkbox.checked = false));
    document
      .querySelectorAll('input[name="gamePackage"]')
      .forEach((radio) => (radio.checked = false));

    if (isDesbloqueado) {
      // Oculta a seção de jogos até um pacote ser selecionado
      gameSelectionDetails.classList.add(CSS_CLASSES.HIDDEN);
      maxGameLimit.textContent = "?"; // Exibe "?" até o pacote ser selecionado
      gameCountDisplay.textContent = 0;
    } else {
      // Se for 'Bloqueado'
      gameSelectionDetails.classList.remove(CSS_CLASSES.HIDDEN);
      updateGameCountDisplay(GAME_LIMIT_BLOQUEADO);
    }
  }

  // --- Event Listeners ---

  // Botão "Ver Localização da Loja"
  viewStoreLocationBtn.addEventListener("click", () => {
    setButtonLoadingState(
      viewStoreLocationBtn,
      true,
      MESSAGES.LOADING_LOCATION,
      MESSAGES.ORIGINAL_LOCATION_TEXT,
      CSS_CLASSES.BG_BLUE,
      CSS_CLASSES.BG_BLUE_HOVER,
      CSS_CLASSES.BG_DISABLED
    );

    window.open(config.storeLocationUrl, "_blank");

    setTimeout(() => {
      setButtonLoadingState(
        viewStoreLocationBtn,
        false,
        MESSAGES.LOADING_LOCATION, // Não usado quando isLoading é false, mas mantido por consistência
        MESSAGES.ORIGINAL_LOCATION_TEXT,
        CSS_CLASSES.BG_BLUE,
        CSS_CLASSES.BG_BLUE_HOVER,
        CSS_CLASSES.BG_DISABLED
      );
    }, 2000); // Atraso de 2 segundos
  });

  // Botão "Onde Encontrar?" (para o Ano do Xbox)
  ondeEncontrarBtn.addEventListener("click", () => {
    yearHelpMessage.classList.toggle(CSS_CLASSES.HIDDEN);
  });

  // Fechar a mensagem de ajuda se clicar fora dela
  document.addEventListener("click", (event) => {
    if (
      !yearHelpMessage.classList.contains(CSS_CLASSES.HIDDEN) &&
      !yearHelpMessage.contains(event.target) &&
      !ondeEncontrarBtn.contains(event.target)
    ) {
      yearHelpMessage.classList.add(CSS_CLASSES.HIDDEN);
    }
  });

  // Botão "Nosso Instagram"
  instagramBtn.addEventListener("click", () => {
    setButtonLoadingState(
      instagramBtn,
      true,
      MESSAGES.LOADING_INSTAGRAM,
      MESSAGES.ORIGINAL_INSTAGRAM_TEXT,
      CSS_CLASSES.BG_PINK,
      CSS_CLASSES.BG_PINK_HOVER,
      CSS_CLASSES.BG_DISABLED
    );

    window.open(config.instagramUrl, "_blank");

    setTimeout(() => {
      setButtonLoadingState(
        instagramBtn,
        false,
        MESSAGES.LOADING_INSTAGRAM, // Não usado quando isLoading é false
        MESSAGES.ORIGINAL_INSTAGRAM_TEXT,
        CSS_CLASSES.BG_PINK,
        CSS_CLASSES.BG_PINK_HOVER,
        CSS_CLASSES.BG_DISABLED
      );
    }, 2000); // Atraso de 2 segundos
  });

  // Eventos para radio buttons de tipo de console
  desbloqueadoRadio.addEventListener("change", handleConsoleTypeSelection);
  bloqueadoRadio.addEventListener("change", handleConsoleTypeSelection);

  // Inicializa a lógica de seleção de HD e contagem de jogos
  handleHdSelection();
  handleConsoleTypeSelection();

  // Formatação do telefone ao digitar
  telefoneInput.addEventListener("input", function (event) {
    event.target.value = formatTelefone(event.target.value);
  });

  // Validações ao sair do campo (blur) ou ao mudar (change)
  document.getElementById("nome").addEventListener("blur", validateNome);
  telefoneInput.addEventListener("blur", validateTelefone);
  emailInput.addEventListener("blur", validateEmail);
  document
    .getElementById("endereco")
    .addEventListener("blur", () => validateEndereco());
  document
    .getElementById("modeloXbox")
    .addEventListener("change", validateModeloXbox);
  document
    .getElementById("anoXbox")
    .addEventListener("change", validateAnoXbox);
  document.getElementById("anoXbox").addEventListener("blur", validateAnoXbox);

  // Evento para os pacotes de jogos
  document.querySelectorAll('input[name="gamePackage"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      gameSelectionDetails.classList.remove(CSS_CLASSES.HIDDEN);
      const maxGames = radio.value;
      updateGameCountDisplay(maxGames);
      validateGameSelection();
    });
  });

  // Eventos para radio buttons de HD
  hdInternoRadio.addEventListener("change", handleHdSelection);
  hdExternoRadio.addEventListener("change", handleHdSelection);
  pendriveRadio.addEventListener("change", handleHdSelection);

  // Eventos para checkboxes de jogos
  gameCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      validateGameSelection();
      const desbloqueadoOunao = document.querySelector(
        'input[name="desbloqueadoOunao"]:checked'
      )?.value;
      if (desbloqueadoOunao === "Desbloqueado") {
        const selectedPackage = document.querySelector(
          'input[name="gamePackage"]:checked'
        )?.value;
        if (selectedPackage) {
          updateGameCountDisplay(selectedPackage);
        }
      } else {
        updateGameCountDisplay(GAME_LIMIT_BLOQUEADO);
      }
    });
  });

  // Adiciona listeners para detectar alterações e marcar o formulário como "sujo"
  addFormDirtyListeners();

  // Aviso de alterações não salvas ao tentar sair da página
  window.addEventListener("beforeunload", (event) => {
    if (isFormDirty) {
      event.preventDefault();
      event.returnValue = MESSAGES.UNSAVED_CHANGES_WARNING;
      return MESSAGES.UNSAVED_CHANGES_WARNING;
    }
  });

  // Submissão do formulário
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    messageBox.classList.add(CSS_CLASSES.HIDDEN);

    // Limpa erros inline antes de revalidar
    showInlineError(errorNome, document.getElementById("nome"), "");
    showInlineError(errorTelefone, telefoneInput, "");
    showInlineError(errorEmail, emailInput, "");
    showInlineError(errorEndereco, document.getElementById("endereco"), "");
    showInlineError(errorModeloXbox, document.getElementById("modeloXbox"), "");
    showInlineError(errorAnoXbox, document.getElementById("anoXbox"), "");
    showInlineError(errorTipoHd, null, "");

    if (!validateForm()) {
      setFormLoadingState(false);
      return;
    }

    // Exibe o modal de confirmação antes de continuar com o envio real
    showConfirmationModal(
      "Deseja realmente enviar esta configuração para o WhatsApp?",
      async () => {
        setFormLoadingState(true); // Ativa o estado de carregamento somente após a confirmação

        try {
          const nome = document.getElementById("nome").value.trim();
          const telefone = telefoneInput.value.trim();
          const email = document.getElementById("email").value.trim();
          const endereco = document.getElementById("endereco").value.trim();
          const modeloXbox = document.getElementById("modeloXbox").value;
          const anoXbox = document.getElementById("anoXbox").value;

          const desbloqueadoOunao =
            document.querySelector('input[name="desbloqueadoOunao"]:checked')
              ?.value || "Não informado";
          const gamePackage =
            document.querySelector('input[name="gamePackage"]:checked')
              ?.value || "N/A";

          let tipoHd = "";
          if (hdInternoRadio.checked) {
            tipoHd = hdInternoRadio.value;
          } else if (hdExternoRadio.checked) {
            tipoHd = hdExternoRadio.value;
          } else if (pendriveRadio.checked) {
            tipoHd = pendriveRadio.value;
          }

          const jogosSelecionados = [];
          gameCheckboxes.forEach((checkbox) => {
            if (checkbox.checked) {
              jogosSelecionados.push(checkbox.value);
            }
          });

          let valorFinal = 0;
          if (desbloqueadoOunao === "Bloqueado") {
            valorFinal = PRICES.bloqueado;
          } else if (desbloqueadoOunao === "Desbloqueado") {
            if (gamePackage === "10") {
              valorFinal = PRICES.desbloqueado["10"];
            } else if (gamePackage === "20") {
              valorFinal = PRICES.desbloqueado["20"];
            }
          }

          const configToSave = {
            nome,
            telefone,
            email,
            endereco,
            modeloXbox,
            desbloqueadoOunao,
            anoXbox: parseInt(anoXbox),
            tipoHd,
            jogosSelecionados,
          };

          const { data, error } = await saveXboxConfig(configToSave);

          if (error) {
            console.error("Erro ao salvar no Supabase:", error);
            showGlobalMessage(
              MESSAGES.DB_SAVE_ERROR(
                error.message || "Verifique sua conexão e tente novamente."
              ),
              "error"
            );
            setFormLoadingState(false);
            return;
          }

          let tipoServico = "";
          if (desbloqueadoOunao === "Desbloqueado" || anoXbox === "2015") {
            tipoServico = "Somente Jogos";
          } else if (desbloqueadoOunao === "Bloqueado") {
            tipoServico = "Desbloqueio + Jogos";
          }

          let whatsappMessage = `*Orçamento/Desbloqueio Xbox 360*\n\n`;
          whatsappMessage += `*Informações Pessoais:*\n`;
          whatsappMessage += `Nome: ${nome}\n`;
          whatsappMessage += `Telefone: ${telefone}\n`;
          whatsappMessage += `Email: ${email}\n`;
          whatsappMessage += `Endereço: ${endereco}\n\n`;

          whatsappMessage += `*Detalhes do Xbox:*\n`;
          whatsappMessage += `Modelo: ${modeloXbox.toUpperCase()}\n`;
          whatsappMessage += `Estado Console: ${desbloqueadoOunao}\n`;
          whatsappMessage += `Ano: ${anoXbox}\n`;
          whatsappMessage += `Armazenamento: ${tipoHd}\n`;

          if (tipoServico) {
            whatsappMessage += `Tipo Serviço: ${tipoServico}\n\n`;
          }

          if (desbloqueadoOunao === "Desbloqueado" && gamePackage !== "N/A") {
            whatsappMessage += `*Pacote de jogos: ${gamePackage} jogos*\n`;
          }

          if (jogosSelecionados.length > 0) {
            whatsappMessage += `*Jogos Escolhidos:*\n`;
            jogosSelecionados.forEach((jogo) => {
              whatsappMessage += `- ${jogo}\n`;
            });
          } else if (tipoHd) {
            whatsappMessage += `Nenhum jogo selecionado para cópia.\n`;
          } else {
            whatsappMessage += `Não é possível copiar jogos sem HD.\n`;
          }

          if (anoXbox === "2015") {
            whatsappMessage += `\n*Aviso:* ${MESSAGES.XBOX_2015_WARNING}\n`;
          }

          whatsappMessage += `\n*VALOR DO SERVIÇO: R$ ${valorFinal
            .toFixed(2)
            .replace(".", ",")}*\n`;

          whatsappMessage += `\n_Gerado via App Da Hora Games_`;

          const whatsappUrl = `https://api.whatsapp.com/send?phone=${
            config.whatsappNumber
          }&text=${encodeURIComponent(whatsappMessage)}`;

          window.open(whatsappUrl, "_system");
          form.reset();
          handleHdSelection();
          handleConsoleTypeSelection();
          resetFormDirtyState();

          setFormLoadingState(false); // Desativa o estado de carregamento
        } catch (e) {
          console.error("Erro inesperado ao processar formulário: ", e);
          showGlobalMessage(MESSAGES.GENERIC_ERROR(e.message), "error");
          setFormLoadingState(false); // Desativa o estado de carregamento
        }
      }
    );
  });
});
