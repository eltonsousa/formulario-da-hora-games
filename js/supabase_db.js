/**
 * Este script é responsável pela inicialização do Supabase e pelas operações
 * de banco de dados para o aplicativo de configuração do Xbox 360,
 * focado apenas em salvar os dados do formulário.
 *
 * Inclui:
 * - Inicialização do cliente Supabase.
 * - Função para salvar as configurações do Xbox do usuário na tabela 'xbox_configs'.
 */

// Importa a função createClient do SDK Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- Variáveis Globais ---
let supabase = null;

// **ATENÇÃO: SUBSTITUA OS VALORES ABAIXO PELAS SUAS CREDENCIAIS REAIS DO SUPABASE.**
const SUPABASE_URL = "https://zltxbqdnqzujcbvbfdvz.supabase.co"; // <--- SUBSTITUA AQUI (ex: https://abcde12345.supabase.co)
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdHhicWRucXp1amNidmJmZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5Nzc1MTEsImV4cCI6MjA3MTU1MzUxMX0.6HPlv4-KW-zge_I5UoHidhQ2JfIGY2E-OI1NDowyOLQ"; // <--- SUBSTITUA AQUI (ex: eyJhbGciOiJIUzI1Ni...)

/**
 * Inicializa o cliente Supabase.
 */
function initializeSupabase() {
  if (
    SUPABASE_URL === "YOUR_SUPABASE_URL" ||
    SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY"
  ) {
    console.error(
      "Supabase credentials are not set. Please update supabase_db.js with your actual URL and Anon Key."
    );
    return {
      success: false,
      message: "Erro: Credenciais do Supabase ausentes ou incorretas.",
    };
  }
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized.");
    return { success: true, message: "Supabase inicializado." };
  } catch (error) {
    console.error("Erro ao inicializar Supabase:", error);
    return {
      success: false,
      message: `Erro ao inicializar Supabase: ${error.message}`,
    };
  }
}

/**
 * Salva a configuração do Xbox enviada pelo formulário na tabela 'xbox_configs' do Supabase.
 * @param {Object} configData Os dados do formulário a serem salvos.
 * @returns {Promise<Object>} Um objeto contendo os dados inseridos ou um erro.
 */
async function saveXboxConfig(configData) {
  if (!supabase) {
    const initResult = initializeSupabase(); // Tenta inicializar se ainda não estiver pronto
    if (!initResult.success) {
      return { error: initResult.message };
    }
  }

  try {
    const { data, error } = await supabase
      .from("xbox_configs") // Nome da tabela no Supabase
      .insert([configData])
      .select(); // <--- Adicionado .select() para garantir o retorno dos dados

    if (error) {
      console.error("Erro ao salvar configuração no Supabase:", error);
      return { error: error.message };
    }

    // Verifica se data é um array e tem pelo menos um elemento
    if (data && data.length > 0) {
      console.log("Configuração salva com sucesso no Supabase:", data[0]);
      return { data: data[0] }; // Retorna o primeiro objeto inserido
    } else {
      console.warn(
        "Configuração salva no Supabase, mas nenhum dado foi retornado (pode ser RLS ou configuração)."
      );
      return { data: { id: "unknown" } }; // Retorna um ID padrão se nada for retornado
    }
  } catch (e) {
    console.error("Erro inesperado ao salvar configuração:", e);
    return { error: e.message };
  }
}

// --- Exposição de funções e variáveis para uso externo ---
window.supabaseDb = {
  initialize: initializeSupabase,
  saveXboxConfig,
};

// Auto-inicializa o Supabase quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  window.supabaseDb.initialize();
});
