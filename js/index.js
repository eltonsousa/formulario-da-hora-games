/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  // Cordova is now initialized. Have fun!

  console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
  document.getElementById("deviceready").classList.add("ready");
}

// ========== Máscara no campo de telefone ==========
const telefoneInput = document.getElementById("telefone");

telefoneInput.addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, ""); // só números

  if (v.length > 11) v = v.slice(0, 11); // limita 11 dígitos (DDD + 9 dígitos)

  if (v.length > 6) {
    e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 2) {
    e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  } else if (v.length > 0) {
    e.target.value = `(${v}`;
  }
});

// ========== Envio do formulário ==========
document.getElementById("xboxForm").addEventListener("submit", function (e) {
  e.preventDefault();

  let nome = document.getElementById("nome").value.trim();
  let telefone = document.getElementById("telefone").value.trim();
  let email = document.getElementById("email").value.trim();
  let endereco = document.getElementById("endereco").value.trim();
  let modelo = document.getElementById("modelo").value;
  let ano = document.getElementById("ano").value;
  let hd = document.getElementById("hd").value;

  // ========== Validação: nome ==========
  if (nome.length < 3) {
    alert("⚠️ Digite um nome válido (mínimo 3 caracteres).");
    return;
  }

  // ========== Validação: endereço ==========
  if (endereco.length < 5) {
    alert("⚠️ Digite um endereço válido (mínimo 5 caracteres).");
    return;
  }

  // ========== Validação: ano ==========
  if (ano == "2015") {
    alert("⚠️ Consoles de 2015 não podem ser desbloqueados!");
    return;
  }

  // ========== Validação: HD ==========
  if (hd == "Não") {
    alert("⚠️ Sem HD não é possível rodar os jogos!");
    return;
  }

  // ========== Validação: telefone ==========
  let telefoneLimpo = telefone.replace(/\D/g, "");
  if (telefoneLimpo.length < 10) {
    alert(
      "⚠️ O número de telefone deve ter pelo menos 10 dígitos (DDD + número)."
    );
    return;
  }
  if (!telefoneLimpo.startsWith("55")) {
    telefoneLimpo = "55" + telefoneLimpo;
  }
  let numeroDestino = telefoneLimpo;

  // ========== Validação: email ==========
  let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("⚠️ Digite um email válido!");
    return;
  }

  // ========== Validação: jogos ==========
  let jogosSelecionados = [];
  document.querySelectorAll('input[name="jogos"]:checked').forEach((el) => {
    jogosSelecionados.push(el.value);
  });

  if (jogosSelecionados.length > 15) {
    alert("⚠️ Selecione no máximo 15 jogos!");
    return;
  }

  // ========== Monta mensagem ==========
  let mensagem = `🟢 Pedido de Desbloqueio Xbox 360 🟢
    
👤 Nome: ${nome}
📱 Telefone: ${telefone}
📧 Email: ${email}
🏠 Endereço: ${endereco}

🎮 Modelo: ${modelo}
📅 Ano: ${ano}
💽 HD: ${hd}

🎯 Jogos: \n ${jogosSelecionados.join(" \n ")}`;

  // ========== Envia para WhatsApp ==========

  let WhatsAppDestino = "5592993312208";
  let url = `https://wa.me/${WhatsAppDestino}?text=${encodeURIComponent(
    mensagem
  )}`;
  window.open(url, "_blank");
});
