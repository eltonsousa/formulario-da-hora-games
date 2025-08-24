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
    maxGamesSelection: 15,
    whatsappNumber: "5592993312208", // ALtere para o seu número de WhatsApp!
    storeLocation: {
      latitude: -3.029107355187607, // SUBSTITUA PELA LATITUDE REAL DA SUA LOJA.
      longitude: -60.00610662152138, // SUBSTITUA PELA LONGITUDE REAL DA SUA LOJA.
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
    GENERIC_ERROR: (msg) => `Erro inesperado: ${msg}`,
    DB_SAVE_ERROR: (msg) => `Erro ao salvar no banco de dados: ${msg}`,
    SENDING: "Enviando...",
    ORIGINAL_BUTTON_TEXT: "Enviar para WhatsApp",
    VIEW_LOCATION_TEXT: "Ver Localização da Loja",
    OPENING_MAP_TEXT: "Abrindo Mapa...",
    UNSAVED_CHANGES_WARNING:
      "Você tem alterações não salvas. Tem certeza que deseja sair?",
    XBOX_2015_WARNING: "Não será possível fazer desbloqueio definitivo!", // Nova mensagem
  };

  const CSS_CLASSES = {
    HIDDEN: "hidden",
    BORDER_RED: "border-red-500",
    BG_GREEN: "bg-green-600",
    BG_GREEN_HOVER: "hover:bg-green-700",
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

  const errorNome = document.getElementById("error-nome");
  const errorTelefone = document.getElementById("error-telefone");
  const errorEmail = document.getElementById("error-email");
  const errorEndereco = document.getElementById("error-endereco");
  const errorModeloXbox = document.getElementById("error-modeloXbox");
  const errorAnoXbox = document.getElementById("error-anoXbox");
  const errorTipoHd = document.getElementById("error-tipoHd");

  let isFormDirty = false;

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

  function showInlineError(errorElement, inputElement, message) {
    if (message) {
      errorElement.textContent = message;
      errorElement.classList.remove(CSS_CLASSES.HIDDEN);
      // Para radio buttons, a borda vermelha deve ser aplicada a um wrapper ou não ser aplicada ao input
      if (inputElement.type !== "radio") {
        inputElement.classList.add(CSS_CLASSES.BORDER_RED);
      }
    } else {
      errorElement.textContent = "";
      errorElement.classList.add(CSS_CLASSES.HIDDEN);
      if (inputElement.type !== "radio") {
        inputElement.classList.remove(CSS_CLASSES.BORDER_RED);
      }
    }
  }

  function formatTelefone(value) {
    if (!value) return "";
    let cleanedValue = value.replace(/\D/g, "");
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

  function setFormLoadingState(isLoading) {
    enviarWhatsappBtn.disabled = isLoading;
    if (isLoading) {
      enviarWhatsappBtn.textContent = MESSAGES.SENDING;
      enviarWhatsappBtn.classList.remove(
        CSS_CLASSES.BG_GREEN,
        CSS_CLASSES.BG_GREEN_HOVER
      );
      enviarWhatsappBtn.classList.add(
        CSS_CLASSES.BG_DISABLED,
        CSS_CLASSES.CURSOR_NOT_ALLOWED
      );
    } else {
      enviarWhatsappBtn.textContent = MESSAGES.ORIGINAL_BUTTON_TEXT;
      enviarWhatsappBtn.classList.add(
        CSS_CLASSES.BG_GREEN,
        CSS_CLASSES.BG_GREEN_HOVER
      );
      enviarWhatsappBtn.classList.remove(
        CSS_CLASSES.BG_DISABLED,
        CSS_CLASSES.CURSOR_NOT_ALLOWED
      );
    }
  }

  function updateGameCountDisplay() {
    const selectedGamesCount = document.querySelectorAll(
      'input[name="jogos"]:checked'
    ).length;
    gameCountDisplay.textContent = selectedGamesCount;
    maxGameLimit.textContent = config.maxGamesSelection;
  }

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

  function resetFormDirtyState() {
    isFormDirty = false;
  }

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
      // Check for the specific year 2015
      showInlineError(errorAnoXbox, input, MESSAGES.XBOX_2015_WARNING);
      // This is a warning, not a hard error that prevents form submission, so we still return true
      // but we make sure the error is displayed.
    } else {
      showInlineError(errorAnoXbox, input, "");
    }
    return isValid; // Returns true even for 2015, as it's a warning. Returns false if empty.
  }

  function validateTipoHd() {
    const anyHdSelected =
      hdInternoRadio.checked || hdExternoRadio.checked || pendriveRadio.checked;
    const radioGroupWrapper = document
      .querySelector('input[name="tipoHd"]')
      .closest("div.mb-6"); // Elemento pai que contém os rádios para borda
    if (!anyHdSelected) {
      showInlineError(
        errorTipoHd,
        radioGroupWrapper,
        MESSAGES.SELECT_HD_OPTION
      );
      return false;
    }
    showInlineError(errorTipoHd, radioGroupWrapper, "");
    return true;
  }

  function validateGameSelection() {
    let selectedGamesCount = document.querySelectorAll(
      'input[name="jogos"]:checked'
    ).length;
    if (selectedGamesCount > config.maxGamesSelection) {
      gameLimitWarning.classList.remove(CSS_CLASSES.HIDDEN);
      return false;
    } else {
      gameLimitWarning.classList.add(CSS_CLASSES.HIDDEN);
      return true;
    }
  }

  function validateForm() {
    let isValid = true;

    // Ensure all validations run, and `isValid` tracks if any returned false (for hard errors)
    isValid = validateNome() && isValid;
    isValid = validateTelefone() && isValid;
    isValid = validateEmail() && isValid;
    isValid = validateEndereco() && isValid;
    isValid = validateModeloXbox() && isValid;
    isValid = validateAnoXbox() && isValid; // validateAnoXbox might display a warning but still return true
    isValid = validateTipoHd() && isValid;

    if (!validateGameSelection()) {
      isValid = false;
    }

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

  viewStoreLocationBtn.addEventListener("click", () => {
    viewStoreLocationBtn.disabled = true;
    const originalText = viewStoreLocationBtn.textContent;
    viewStoreLocationBtn.textContent = MESSAGES.OPENING_MAP_TEXT;

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${config.storeLocation.latitude},${config.storeLocation.longitude}`;
    window.open(googleMapsUrl, "_blank");

    setTimeout(() => {
      viewStoreLocationBtn.textContent = originalText;
      viewStoreLocationBtn.disabled = false;
    }, 2000);
  });

  handleHdSelection();
  updateGameCountDisplay();

  telefoneInput.addEventListener("input", function (event) {
    event.target.value = formatTelefone(event.target.value);
  });

  document.getElementById("nome").addEventListener("blur", validateNome);
  telefoneInput.addEventListener("blur", validateTelefone);
  emailInput.addEventListener("blur", validateEmail);
  document
    .getElementById("endereco")
    .addEventListener("blur", validateEndereco);
  document
    .getElementById("modeloXbox")
    .addEventListener("change", validateModeloXbox);
  document
    .getElementById("anoXbox")
    .addEventListener("change", validateAnoXbox);
  document.getElementById("anoXbox").addEventListener("blur", validateAnoXbox); // Also validate on blur

  hdInternoRadio.addEventListener("change", () => {
    handleHdSelection();
  });
  hdExternoRadio.addEventListener("change", () => {
    handleHdSelection();
  });
  pendriveRadio.addEventListener("change", () => {
    handleHdSelection();
  });

  gameCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      validateGameSelection();
      updateGameCountDisplay();
    });
  });

  addFormDirtyListeners();

  window.addEventListener("beforeunload", (event) => {
    if (isFormDirty) {
      event.preventDefault();
      event.returnValue = MESSAGES.UNSAVED_CHANGES_WARNING;
      return MESSAGES.UNSAVED_CHANGES_WARNING;
    }
  });

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
    showInlineError(
      errorTipoHd,
      document.querySelector('input[name="tipoHd"]').closest("div.mb-6"),
      ""
    );

    if (!validateForm()) {
      setFormLoadingState(false);
      return;
    }

    setFormLoadingState(true);

    try {
      const nome = document.getElementById("nome").value.trim();
      const telefone = telefoneInput.value.trim();
      const email = emailInput.value.trim();
      const endereco = document.getElementById("endereco").value.trim();
      const modeloXbox = document.getElementById("modeloXbox").value;
      const anoXbox = document.getElementById("anoXbox").value;

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

      const configToSave = {
        nome,
        telefone,
        email,
        endereco,
        modeloXbox,
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

      let whatsappMessage = `*Orçamento/Desbloqueio Xbox 360*\n\n`;
      whatsappMessage += `*Informações Pessoais:*\n`;
      whatsappMessage += `Nome: ${nome}\n`;
      whatsappMessage += `Telefone: ${telefone}\n`;
      whatsappMessage += `Email: ${email}\n`;
      whatsappMessage += `Endereço: ${endereco}\n\n`;

      whatsappMessage += `*Detalhes do Xbox:*\n`;
      whatsappMessage += `Modelo: ${modeloXbox.toUpperCase()}\n`;
      whatsappMessage += `Ano: ${anoXbox}\n`;
      whatsappMessage += `Armazenamento: ${tipoHd}\n\n`;

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

      whatsappMessage += `\n_Gerado via App Da Hora Games_`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${
        config.whatsappNumber
      }&text=${encodeURIComponent(whatsappMessage)}`;

      window.open(whatsappUrl, "_system");
      form.reset();
      handleHdSelection();
      resetFormDirtyState();

      setFormLoadingState(false);
    } catch (e) {
      console.error("Erro inesperado ao processar formulário: ", e);
      showGlobalMessage(MESSAGES.GENERIC_ERROR(e.message), "error");
      setFormLoadingState(false);
    }
  });
});
