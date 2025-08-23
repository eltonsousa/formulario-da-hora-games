/**
 * Lógica JavaScript para o aplicativo de configuração do Xbox 360.
 * Este script gerencia a interação do formulário, validações,
 * formatação de entrada e a integração com o WhatsApp.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Referências aos elementos do DOM
  const form = document.getElementById("xboxConfigForm");
  const telefoneInput = document.getElementById("telefone");
  const hdInternoRadio = document.getElementById("hdInterno");
  const hdExternoRadio = document.getElementById("hdExterno");
  const pendriveRadio = document.getElementById("pendrive");
  const hdWarning = document.getElementById("hdWarning");
  const gameCheckboxes = document.querySelectorAll('input[name="jogos"]');
  const gameLimitWarning = document.getElementById("gameLimitWarning");
  const messageBox = document.getElementById("messageBox");

  // --- Funções de Validação e Lógica de Interface ---

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

  /**
   * Valida o número de jogos selecionados.
   * Permite no máximo 15 jogos.
   */
  function validateGameSelection() {
    let selectedGames = 0;
    gameCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        selectedGames++;
      }
    });

    if (selectedGames > 15) {
      gameLimitWarning.classList.remove("hidden");
      // Desativa o último jogo selecionado se o limite for excedido
      // Isso garante que o usuário não ultrapasse 15
      gameCheckboxes.forEach((checkbox) => {
        if (checkbox.checked && !checkbox.dataset.justChecked) {
          checkbox.checked = false;
        }
        checkbox.dataset.justChecked = false; // Reset flag
      });
      return false;
    } else {
      gameLimitWarning.classList.add("hidden");
      return true;
    }
  }

  /**
   * Lógica para mostrar/esconder aviso de HD.
   * Se nenhum HD for selecionado, mostra um aviso.
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
  }

  // --- Adição de Event Listeners ---

  // Listener para formatar o telefone em tempo real
  telefoneInput.addEventListener("input", function (event) {
    event.target.value = formatTelefone(event.target.value);
  });

  // Listener para limitar a seleção de jogos
  gameCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      this.dataset.justChecked = this.checked; // Mark the last checked one
      validateGameSelection();
    });
  });

  // Listeners para a seleção de HD
  hdInternoRadio.addEventListener("change", handleHdSelection);
  hdExternoRadio.addEventListener("change", handleHdSelection);
  pendriveRadio.addEventListener("change", handleHdSelection);

  // Inicializa a lógica de HD e jogos ao carregar a página
  handleHdSelection();

  // --- Lógica de Envio do Formulário ---

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    // 1. Coleta dos dados do formulário
    const nome = document.getElementById("nome").value.trim();
    const telefone = telefoneInput.value.trim();
    const email = document.getElementById("email").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const modeloXbox = document.getElementById("modeloXbox").value;
    const anoXbox = document.getElementById("anoXbox").value;

    let tipoHd = "";
    if (hdInternoRadio.checked) {
      tipoHd = "HD Interno";
    } else if (hdExternoRadio.checked) {
      tipoHd = "HD Externo";
    } else if (pendrive.checked) {
      tipoHd = "Pendrive de 16gb ou mais";
    }

    const jogosSelecionados = [];
    gameCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        jogosSelecionados.push(checkbox.value);
      }
    });

    // 2. Validação básica (campos obrigatórios)
    if (!nome || !telefone || !email || !endereco || !modeloXbox || !anoXbox) {
      showMessage("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }
    if (
      !hdInternoRadio.checked &&
      !hdExternoRadio.checked &&
      pendriveRadio.checked
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
      showMessage("Você só pode escolher no máximo 15 jogos.", "error");
      return;
    }

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

    // 4. Criação do link do WhatsApp
    // Substitua '5592999999999' pelo número de telefone do WhatsApp de destino, incluindo o código do país e DDD.
    // Exemplo: 55 para Brasil, 92 para DDD de Manaus, e o número.
    const whatsappNumber = "5592993312208"; // ALtere para o seu número de WhatsApp!
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(
      message
    )}`;

    // 5. Redirecionamento para o WhatsApp
    window.open(whatsappUrl, "_system"); // '_system' para abrir em um navegador externo ou app

    showMessage("Redirecionando para o WhatsApp...", "success");
    // Opcional: Limpar formulário após o envio
    // form.reset();
    // handleHdSelection(); // Reaplicar a lógica de HD/jogos
  });

  /**
   * Exibe uma mensagem de feedback para o usuário.
   * @param {string} msg A mensagem a ser exibida.
   * @param {'success'|'error'} type O tipo da mensagem (determina a cor).
   */
  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.classList.remove(
      "hidden",
      "bg-red-200",
      "text-red-800",
      "bg-green-200",
      "text-green-800"
    );

    if (type === "error") {
      messageBox.classList.add("bg-red-200", "text-red-800");
    } else if (type === "success") {
      messageBox.classList.add("bg-green-200", "text-green-800");
    }
    messageBox.classList.remove("hidden");

    // Esconde a mensagem após 5 segundos
    setTimeout(() => {
      messageBox.classList.add("hidden");
    }, 5000);
  }
});
