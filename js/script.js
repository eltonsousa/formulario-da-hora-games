/**
 * Lógica JavaScript para o aplicativo de configuração do Xbox 360.
 * Este script gerencia a interação do formulário, validações,
 * formatação de entrada e a integração com o WhatsApp, agora
 * utilizando as funções de banco de dados do `supabase_db.js`
 * para salvar os dados do formulário no Supabase.
 */

// Acessa as funções expostas globalmente pelo supabase_db.js
const { initialize: initializeSupabase, saveXboxConfig } = window.supabaseDb;

document.addEventListener("DOMContentLoaded", async function () {
  // Referências aos elementos do DOM
  const form = document.getElementById("xboxConfigForm");
  const telefoneInput = document.getElementById("telefone");
  const hdInternoRadio = document.getElementById("hdInterno");
  const hdExternoRadio = document.getElementById("hdExterno");
  const pendriveRadio = document.getElementById("pendrive"); // Elemento para o pendrive
  const hdWarning = document.getElementById("hdWarning");
  const gameCheckboxes = document.querySelectorAll('input[name="jogos"]');
  const gameLimitWarning = document.getElementById("gameLimitWarning");
  const messageBox = document.getElementById("messageBox");

  // --- Constantes ---
  const MAX_GAMES_SELECTION = 15; // Limite de jogos que podem ser escolhidos
  const WHATSAPP_NUMBER = "5592993312208"; // ALtere para o seu número de WhatsApp!

  // --- Funções de Utilitário ---

  /**
   * Exibe uma mensagem de feedback para o usuário.
   * @param {string} msg A mensagem a ser exibida.
   * @param {'success'|'error'|'info'} type O tipo da mensagem (determina a cor).
   */
  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.classList.remove(
      "hidden",
      "bg-red-200",
      "text-red-800",
      "bg-green-200",
      "text-green-800",
      "bg-blue-200",
      "text-blue-800",
      "font-bold",
      "text-lg"
    ); // Removendo estilos anteriores

    if (type === "error") {
      messageBox.classList.add("bg-red-200", "text-red-800");
    } else if (type === "success") {
      messageBox.classList.add(
        "bg-green-200",
        "text-green-800",
        "font-bold",
        "text-lg"
      ); // Estilos para sucesso mais proeminente
    } else if (type === "info") {
      messageBox.classList.add("bg-blue-200", "text-blue-800");
    }
    messageBox.classList.remove("hidden");

    // Esconde a mensagem após 5 segundos
    setTimeout(() => {
      messageBox.classList.add("hidden");
    }, 5000);
  }

  /**
   * Formata o número de telefone no padrão (XX) XXXXX-XXXX.
   * Remove todos os caracteres não numéricos e aplica a máscara.
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

  // --- Funções de Validação e Lógica de Interface ---

  /**
   * Valida o número de jogos selecionados.
   * Permite no máximo MAX_GAMES_SELECTION jogos.
   */
  function validateGameSelection() {
    let selectedGames = document.querySelectorAll(
      'input[name="jogos"]:checked'
    ).length;

    if (selectedGames > MAX_GAMES_SELECTION) {
      gameLimitWarning.classList.remove("hidden");
      // Desativa o último jogo selecionado se o limite for excedido
      const checkboxes = Array.from(
        document.querySelectorAll('input[name="jogos"]:checked')
      );
      if (checkboxes.length > MAX_GAMES_SELECTION) {
        checkboxes[checkboxes.length - 1].checked = false;
      }
      return false;
    } else {
      gameLimitWarning.classList.add("hidden");
      return true;
    }
  }

  /**
   * Lógica para mostrar/esconder aviso de HD e habilitar/desabilitar seleção de jogos.
   */
  function handleHdSelection() {
    if (
      !hdInternoRadio.checked &&
      !hdExternoRadio.checked &&
      !pendriveRadio.checked
    ) {
      hdWarning.classList.remove("hidden");
      // Desabilita a seleção de jogos se não tiver HD
      gameCheckboxes.forEach((checkbox) => {
        checkbox.checked = false; // Desmarca qualquer jogo selecionado
        checkbox.disabled = true; // Desabilita o checkbox
      });
    } else {
      hdWarning.classList.add("hidden");
      // Habilita a seleção de jogos se tiver HD
      gameCheckboxes.forEach((checkbox) => {
        checkbox.disabled = false;
      });
    }
    validateGameSelection(); // Revalida a seleção após mudanças de HD
  }

  // --- Inicialização e Event Listeners ---

  // Inicializa a lógica de HD e jogos ao carregar a página
  handleHdSelection();

  // Adição de Event Listeners para o formulário e elementos da UI
  telefoneInput.addEventListener("input", function (event) {
    event.target.value = formatTelefone(event.target.value);
  });

  gameCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", validateGameSelection);
  });

  hdInternoRadio.addEventListener("change", handleHdSelection);
  hdExternoRadio.addEventListener("change", handleHdSelection);
  pendriveRadio.addEventListener("change", handleHdSelection);

  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    // 1. Coleta e validação dos dados do formulário
    const nome = document.getElementById("nome").value.trim();
    const telefone = telefoneInput.value.trim();
    const email = document.getElementById("email").value.trim();
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

    // Validações
    if (!nome || !telefone || !email || !endereco || !modeloXbox || !anoXbox) {
      showMessage("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }
    if (
      !hdInternoRadio.checked &&
      !hdExternoRadio.checked &&
      !pendriveRadio.checked
    ) {
      showMessage("Por favor, selecione uma opção de HD.", "error");
      return;
    }
    if (
      jogosSelecionados.length === 0 &&
      (hdInternoRadio.checked ||
        hdExternoRadio.checked ||
        pendriveRadio.checked)
    ) {
      showMessage(
        "Escolha pelo menos um jogo ou desmarque a opção de HD se não quiser copiar jogos.",
        "error"
      );
      return;
    }
    if (!validateGameSelection()) {
      showMessage(
        `Você só pode escolher no máximo ${MAX_GAMES_SELECTION} jogos.`,
        "error"
      );
      return;
    }

    try {
      // 2. Salva a configuração no Supabase
      const configToSave = {
        nome,
        telefone,
        email,
        endereco,
        modeloXbox,
        anoXbox: parseInt(anoXbox), // Garante que o ano seja um número
        tipoHd,
        jogosSelecionados, // Supabase aceita array de strings em coluna jsonb
      };

      const { data, error } = await saveXboxConfig(configToSave);

      if (error) {
        console.error("Erro ao salvar no Supabase:", error);
        showMessage(`Erro ao salvar no banco de dados: ${error}`, "error");
        return;
      }

      // Acessa o ID de forma segura
      // const savedId = (data && data.id) ? data.id : 'desconhecido';
      // showMessage(`Dados enviados com sucesso! ID: ${savedId}`, 'success'); // Mensagem de sucesso removida

      // 3. Montagem da mensagem para o WhatsApp
      let message = `*Orçamento/Desbloqueio Xbox 360*\n\n`;
      message += `*Informações Pessoais:*\n`;
      message += `Nome: ${nome}\n`;
      message += `Telefone: ${telefone}\n`;
      message += `Email: ${email}\n`;
      message += `Endereço: ${endereco}\n\n`;

      message += `*Detalhes do Xbox:*\n`;
      message += `Modelo: ${modeloXbox.toUpperCase()}\n`;
      message += `Ano: ${anoXbox}\n`;
      message += `Armazenamento: ${tipoHd}\n\n`;

      if (jogosSelecionados.length > 0) {
        message += `*Jogos Escolhidos:*\n`;
        jogosSelecionados.forEach((jogo) => {
          message += `- ${jogo}\n`;
        });
      } else if (tipoHd) {
        message += `Nenhum jogo selecionado para cópia.\n`;
      } else {
        message += `Não é possível copiar jogos sem HD.\n`;
      }
      message += `\n_Gerado via App Da Hora Games_`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(
        message
      )}`;

      window.open(whatsappUrl, "_system");
      form.reset(); // Limpa o formulário após o envio
      handleHdSelection(); // Reaplicar a lógica de HD/jogos
    } catch (e) {
      console.error("Erro inesperado ao processar formulário: ", e);
      showMessage(`Erro inesperado: ${e.message}`, "error");
    }
  });
});
