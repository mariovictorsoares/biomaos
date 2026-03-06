<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-2xl bg-white rounded-xl shadow-xl transform transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Cadastro de cliente</h2>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="$emit('close')"
              class="btn btn-secondary"
            >
              Voltar
            </button>
            <button @click="handleCadastrar" class="btn btn-primary">
              Cadastrar
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200">
          <div class="flex justify-center">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="px-6 py-3 text-sm font-medium transition-colors relative"
              :class="activeTab === tab.id
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'"
            >
              {{ tab.label }}
              <span
                v-if="activeTab === tab.id"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              ></span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-6 max-h-[70vh] overflow-y-auto">
          <!-- Tab: Dados Gerais -->
          <div v-if="activeTab === 'dados-gerais'" class="space-y-5">
            <!-- CNPJ -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">CNPJ</label>
              <div class="flex items-center gap-3">
                <input
                  type="text"
                  v-model="form.cnpj"
                  placeholder="00.000.000/0000-00"
                  class="input flex-1"
                />
                <button class="btn btn-secondary whitespace-nowrap">
                  Buscar CNPJ
                </button>
                <label class="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                  <input
                    type="checkbox"
                    v-model="form.pessoaFisica"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  Pessoa Física
                </label>
              </div>
            </div>

            <!-- Razão Social / Nome Fantasia -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Razão social</label>
                <input
                  type="text"
                  v-model="form.razaoSocial"
                  :class="['input', attempted && !form.razaoSocial ? 'border-red-500' : '']"
                />
                <span v-if="attempted && !form.razaoSocial" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Nome fantasia</label>
                <input
                  type="text"
                  v-model="form.nomeFantasia"
                  class="input"
                />
              </div>
            </div>

            <!-- E-mail / Telefone -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  v-model="form.email"
                  class="input"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                <input
                  type="text"
                  v-model="form.telefone"
                  class="input"
                />
              </div>
            </div>

            <!-- Contato WhatsApp -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Contato WhatsApp</label>
              <input
                type="text"
                v-model="form.whatsapp"
                placeholder="Número de WhatsApp para envio de notificações"
                class="input"
              />
            </div>

            <!-- CEP -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
              <div class="flex items-center gap-3">
                <input
                  type="text"
                  v-model="form.cep"
                  placeholder="00000-000"
                  class="input w-64"
                />
                <button class="text-sm text-gray-600 hover:text-gray-800 underline">
                  Não sei o CEP
                </button>
              </div>
            </div>

            <!-- Endereço / Número -->
            <div class="grid grid-cols-4 gap-4">
              <div class="col-span-3">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
                <input
                  type="text"
                  v-model="form.endereco"
                  class="input"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Número</label>
                <input
                  type="text"
                  v-model="form.numero"
                  class="input"
                />
              </div>
            </div>

            <!-- Complemento -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Complemento</label>
              <input
                type="text"
                v-model="form.complemento"
                class="input"
              />
            </div>

            <!-- Estado / Cidade -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                <select v-model="form.estado" class="input">
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                <input
                  type="text"
                  v-model="form.cidade"
                  class="input"
                />
              </div>
            </div>
          </div>

          <!-- Tab: Financeiro -->
          <div v-if="activeTab === 'financeiro'" class="space-y-5">
            <!-- Responsável Financeiro -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Responsável Financeiro</label>
              <input
                type="text"
                v-model="form.responsavelFinanceiro"
                placeholder="Nome do responsável"
                class="input"
              />
            </div>

            <!-- E-mail / Telefone Financeiro -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  v-model="form.emailFinanceiro"
                  placeholder="E-mail responsável financeiro"
                  class="input"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                <input
                  type="text"
                  v-model="form.telefoneFinanceiro"
                  placeholder="Telefone responsável financeiro"
                  class="input"
                />
              </div>
            </div>

            <!-- Preferências de Pagamento -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">Preferências de Pagamento</label>
              <div class="flex items-center gap-6">
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    v-model="form.pagamentoPix"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  Pix
                </label>
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    v-model="form.pagamentoBoleto"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  Boleto
                </label>
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    v-model="form.pagamentoCartao"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  Cartão
                </label>
              </div>
            </div>

            <!-- Observações Gerais -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Observações Gerais</label>
              <textarea
                v-model="form.observacoesFinanceiro"
                rows="4"
                placeholder="Observações"
                class="input resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Tab: Entrega -->
          <div v-if="activeTab === 'entrega'" class="space-y-5">
            <!-- Responsável pelo Pedido -->
            <div>
              <h3 class="text-sm font-medium text-gray-900 mb-4">Responsável pelo Pedido</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Responsável Pedido</label>
                  <input
                    type="text"
                    v-model="form.responsavelPedido"
                    placeholder="Nome do responsável"
                    class="input"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                    <input
                      type="email"
                      v-model="form.emailPedido"
                      placeholder="E-mail responsável pedido"
                      class="input"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                    <input
                      type="text"
                      v-model="form.telefonePedido"
                      placeholder="Telefone responsável pedido"
                      class="input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Endereço de Entrega -->
            <div>
              <h3 class="text-sm font-medium text-gray-900 mb-4">Endereço de Entrega</h3>
              <div class="space-y-4">
                <!-- CEP / Logradouro -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
                    <div class="flex gap-2">
                      <input
                        type="text"
                        v-model="form.cepEntrega"
                        placeholder="CEP de entrega"
                        class="input flex-1"
                      />
                      <button class="btn btn-primary px-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Logradouro</label>
                    <input
                      type="text"
                      v-model="form.logradouroEntrega"
                      placeholder="Logradouro de entrega"
                      class="input"
                    />
                  </div>
                </div>

                <!-- Número / Complemento / Bairro -->
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Número</label>
                    <input
                      type="text"
                      v-model="form.numeroEntrega"
                      placeholder="Número endereço de entrega"
                      class="input"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Complemento</label>
                    <input
                      type="text"
                      v-model="form.complementoEntrega"
                      placeholder="Complemento endereço de entrega"
                      class="input"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Bairro</label>
                    <input
                      type="text"
                      v-model="form.bairroEntrega"
                      placeholder="Bairro endereço de entrega"
                      class="input"
                    />
                  </div>
                </div>

                <!-- Cidade / Estado -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                    <input
                      type="text"
                      v-model="form.cidadeEntrega"
                      placeholder="Cidade de entrega"
                      class="input"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                    <select v-model="form.estadoEntrega" class="input">
                      <option value="">Estado de Entrega</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preferências de Entrega -->
            <div>
              <h3 class="text-sm font-medium text-gray-900 mb-4">Preferências de Entrega</h3>
              <div class="space-y-4">
                <!-- Dia da Semana -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-3">Dia da Semana</label>
                  <div class="flex items-center gap-6">
                    <label class="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        v-model="form.diaSegunda"
                        class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      Segunda
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        v-model="form.diaTerca"
                        class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      Terça
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        v-model="form.diaQuarta"
                        class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      Quarta
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        v-model="form.diaQuinta"
                        class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      Quinta
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        v-model="form.diaSexta"
                        class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      Sexta
                    </label>
                  </div>
                </div>

                <!-- Horários -->
                <div class="grid grid-cols-2 gap-6">
                  <!-- Horário Turno Manhã -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">Horário Turno Manhã</label>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">A partir</label>
                        <select v-model="form.horaManhaInicio" class="input">
                          <option value="">horário de início</option>
                          <option value="06:00">06:00</option>
                          <option value="07:00">07:00</option>
                          <option value="08:00">08:00</option>
                          <option value="09:00">09:00</option>
                          <option value="10:00">10:00</option>
                          <option value="11:00">11:00</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Até as</label>
                        <select v-model="form.horaManhaFim" class="input">
                          <option value="">horário de fim</option>
                          <option value="08:00">08:00</option>
                          <option value="09:00">09:00</option>
                          <option value="10:00">10:00</option>
                          <option value="11:00">11:00</option>
                          <option value="12:00">12:00</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Horário Turno Tarde -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">Horário Turno Tarde</label>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">A partir</label>
                        <select v-model="form.horaTardeInicio" class="input">
                          <option value="">horário de início</option>
                          <option value="12:00">12:00</option>
                          <option value="13:00">13:00</option>
                          <option value="14:00">14:00</option>
                          <option value="15:00">15:00</option>
                          <option value="16:00">16:00</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Até as</label>
                        <select v-model="form.horaTardeFim" class="input">
                          <option value="">horário de fim</option>
                          <option value="15:00">15:00</option>
                          <option value="16:00">16:00</option>
                          <option value="17:00">17:00</option>
                          <option value="18:00">18:00</option>
                          <option value="19:00">19:00</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Observações -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                  <textarea
                    v-model="form.observacoesEntrega"
                    rows="4"
                    placeholder="Observações"
                    class="input resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close', 'save'])

const attempted = ref(false)
const activeTab = ref('dados-gerais')

const tabs = [
  { id: 'dados-gerais', label: 'Dados Gerais' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'entrega', label: 'Entrega' }
]

const form = ref({
  // Dados Gerais
  cnpj: '',
  pessoaFisica: false,
  razaoSocial: '',
  nomeFantasia: '',
  email: '',
  telefone: '',
  whatsapp: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  estado: '',
  cidade: '',

  // Financeiro
  responsavelFinanceiro: '',
  emailFinanceiro: '',
  telefoneFinanceiro: '',
  pagamentoPix: false,
  pagamentoBoleto: false,
  pagamentoCartao: false,
  observacoesFinanceiro: '',

  // Entrega
  responsavelPedido: '',
  emailPedido: '',
  telefonePedido: '',
  cepEntrega: '',
  logradouroEntrega: '',
  numeroEntrega: '',
  complementoEntrega: '',
  bairroEntrega: '',
  cidadeEntrega: '',
  estadoEntrega: '',
  diaSegunda: false,
  diaTerca: false,
  diaQuarta: false,
  diaQuinta: false,
  diaSexta: false,
  horaManhaInicio: '',
  horaManhaFim: '',
  horaTardeInicio: '',
  horaTardeFim: '',
  observacoesEntrega: ''
})

function handleCadastrar() {
  attempted.value = true
  if (!form.value.razaoSocial) {
    activeTab.value = 'dados-gerais'
    return
  }
  emit('save', { ...form.value })
}
</script>
