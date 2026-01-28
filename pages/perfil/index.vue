<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Perfil do usuário</h1>
    </div>

    <div class="flex gap-6">
      <!-- Sidebar Menu -->
      <div class="w-48 shrink-0">
        <nav class="space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors',
              activeTab === tab.id
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Content -->
      <div class="flex-1">
        <div class="card p-6">
          <!-- Tab: Meus Dados -->
          <div v-if="activeTab === 'meus-dados'">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Meus dados</h2>

            <!-- Profile Image -->
            <div class="flex items-center gap-6 mb-8">
              <div class="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <span class="material-icons-outlined text-primary text-5xl">account_circle</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem de perfil</p>
                <button class="btn btn-secondary text-primary border-primary hover:bg-primary/5">
                  Carregar imagem
                </button>
              </div>
            </div>

            <!-- Form -->
            <div class="space-y-5 max-w-lg">
              <!-- Nome Completo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  v-model="formDados.nomeCompleto"
                  class="input"
                />
              </div>

              <!-- Data de Nascimento -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de nascimento</label>
                <input
                  type="text"
                  v-model="formDados.dataNascimento"
                  placeholder="00/00/0000"
                  class="input"
                />
              </div>

              <!-- Celular -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Celular</label>
                <input
                  type="text"
                  v-model="formDados.celular"
                  placeholder="(00) 0 0000-0000"
                  class="input"
                />
              </div>

              <!-- Checkbox Notificações -->
              <div>
                <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    v-model="formDados.receberNotificacoes"
                    class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  Quero receber notificações
                </label>
              </div>

              <!-- Button -->
              <div class="pt-4">
                <button @click="salvarDados" class="btn btn-primary w-full">
                  Alterar dados
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Endereço -->
          <div v-if="activeTab === 'endereco'">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Endereço</h2>

            <div class="space-y-5 max-w-lg">
              <!-- CEP -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CEP</label>
                <div class="flex items-center gap-3">
                  <input
                    type="text"
                    v-model="formEndereco.cep"
                    placeholder="00000-000"
                    class="input flex-1"
                  />
                  <button class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 whitespace-nowrap">
                    Não sei o CEP
                  </button>
                </div>
              </div>

              <!-- Endereço / Número -->
              <div class="grid grid-cols-4 gap-4">
                <div class="col-span-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Endereço</label>
                  <input
                    type="text"
                    v-model="formEndereco.endereco"
                    class="input"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Número</label>
                  <input
                    type="text"
                    v-model="formEndereco.numero"
                    class="input"
                  />
                </div>
              </div>

              <!-- Complemento -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Complemento</label>
                <input
                  type="text"
                  v-model="formEndereco.complemento"
                  class="input"
                />
              </div>

              <!-- Estado / Cidade -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estado</label>
                  <select v-model="formEndereco.estado" class="input">
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
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    v-model="formEndereco.cidade"
                    class="input"
                  />
                </div>
              </div>

              <!-- Button -->
              <div class="pt-4">
                <button @click="salvarEndereco" class="btn btn-primary w-full">
                  Alterar endereço
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Alterar Senha -->
          <div v-if="activeTab === 'alterar-senha'">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Alterar senha</h2>

            <div class="space-y-5 max-w-lg">
              <!-- Senha Atual -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha atual</label>
                <input
                  type="password"
                  v-model="formSenha.senhaAtual"
                  placeholder="Digite sua senha atual"
                  class="input"
                />
              </div>

              <!-- Nova Senha -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova senha</label>
                <input
                  type="password"
                  v-model="formSenha.novaSenha"
                  placeholder="Digite a nova senha"
                  class="input"
                />
              </div>

              <!-- Confirmar Nova Senha -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar nova senha</label>
                <input
                  type="password"
                  v-model="formSenha.confirmarSenha"
                  placeholder="Confirme a nova senha"
                  class="input"
                />
              </div>

              <!-- Button -->
              <div class="pt-4">
                <button @click="alterarSenha" class="btn btn-primary w-full">
                  Alterar senha
                </button>
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
import { useToast } from '~/composables/useToast'

const { showToast } = useToast()
const activeTab = ref('meus-dados')

const tabs = [
  { id: 'meus-dados', label: 'Meus dados' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'alterar-senha', label: 'Alterar senha' }
]

// Form: Meus Dados
const formDados = ref({
  nomeCompleto: 'Leonardo MASTER',
  dataNascimento: '',
  celular: '',
  receberNotificacoes: false
})

// Form: Endereço
const formEndereco = ref({
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  estado: '',
  cidade: ''
})

// Form: Senha
const formSenha = ref({
  senhaAtual: '',
  novaSenha: '',
  confirmarSenha: ''
})

// Actions
const salvarDados = () => {
  // TODO: Implementar integração com Supabase
  showToast('Dados salvos com sucesso!', 'success')
}

const salvarEndereco = () => {
  // TODO: Implementar integração com Supabase
  showToast('Endereço salvo com sucesso!', 'success')
}

const alterarSenha = () => {
  if (formSenha.value.novaSenha !== formSenha.value.confirmarSenha) {
    showToast('As senhas não coincidem!', 'error')
    return
  }
  if (!formSenha.value.senhaAtual || !formSenha.value.novaSenha) {
    showToast('Por favor, preencha todos os campos.', 'error')
    return
  }
  // TODO: Implementar integração com Supabase
  showToast('Senha alterada com sucesso!', 'success')
}
</script>
