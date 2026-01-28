<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-lg bg-white rounded-xl shadow-xl transform transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Editar Usuário</h2>
            <p class="text-sm text-gray-500 mt-0.5">Atualize as informações do usuário</p>
          </div>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-5 space-y-5">
          <!-- Avatar Preview -->
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center"
              :class="avatarColor"
            >
              <span class="text-xl font-semibold text-white">{{ avatarInitials }}</span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">Foto do Perfil</p>
              <div class="flex items-center gap-2 mt-1">
                <button class="text-sm text-green-600 hover:text-green-700 font-medium">
                  Alterar
                </button>
                <span class="text-gray-300">|</span>
                <button class="text-sm text-red-500 hover:text-red-600 font-medium">
                  Remover
                </button>
              </div>
            </div>
          </div>

          <!-- Nome -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Nome Completo <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="form.nome"
              placeholder="Digite o nome completo"
              class="input"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              E-mail <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              v-model="form.email"
              placeholder="Digite o e-mail"
              class="input"
            />
          </div>

          <!-- Grid 2 colunas -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Perfil -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Perfil <span class="text-red-500">*</span>
              </label>
              <select v-model="form.role" class="input">
                <option value="">Selecione...</option>
                <option value="admin">Administrador</option>
                <option value="manager">Gerente</option>
                <option value="operator">Operador</option>
                <option value="viewer">Visualizador</option>
              </select>
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select v-model="form.status" class="input">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <!-- Empresa -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Empresa <span class="text-red-500">*</span>
            </label>
            <select v-model="form.empresa" class="input">
              <option value="">Selecione uma empresa...</option>
              <option value="Fazendas Bioma">Fazendas Bioma</option>
              <option value="AgroVerde Sustentável">AgroVerde Sustentável</option>
              <option value="Terra Viva Agricultura">Terra Viva Agricultura</option>
              <option value="EcoPastos do Brasil">EcoPastos do Brasil</option>
              <option value="Grupo Natureza">Grupo Natureza</option>
              <option value="Campos Verdes Ltda">Campos Verdes Ltda</option>
            </select>
          </div>

          <!-- Seção de Senha -->
          <div class="border-t border-gray-200 pt-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-medium text-gray-900">Alterar Senha</h3>
                <p class="text-xs text-gray-500 mt-0.5">Deixe em branco para manter a senha atual</p>
              </div>
              <button
                type="button"
                @click="showPasswordSection = !showPasswordSection"
                class="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {{ showPasswordSection ? 'Ocultar' : 'Alterar' }}
              </button>
            </div>

            <div v-if="showPasswordSection" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  Nova Senha
                </label>
                <div class="relative">
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    v-model="form.novaSenha"
                    placeholder="Digite a nova senha"
                    class="input pr-10"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    </svg>
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1.5">Mínimo de 8 caracteres</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="form.confirmarSenha"
                  placeholder="Confirme a nova senha"
                  class="input"
                />
              </div>
            </div>
          </div>

          <!-- Informações Adicionais -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Informações do Sistema</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500">Criado em</p>
                <p class="text-sm text-gray-900 font-medium">15/01/2024</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Último acesso</p>
                <p class="text-sm text-gray-900 font-medium">{{ props.usuario?.ultimoAcesso || 'Nunca' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            class="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Excluir Usuário
          </button>
          <div class="flex items-center gap-3">
            <button
              @click="$emit('close')"
              class="btn btn-secondary"
            >
              Cancelar
            </button>
            <button class="btn btn-primary">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  usuario: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const showPassword = ref(false)
const showPasswordSection = ref(false)

const form = ref({
  nome: '',
  email: '',
  role: '',
  status: 'active',
  empresa: '',
  novaSenha: '',
  confirmarSenha: ''
})

// Preencher form com dados do usuário
watch(() => props.usuario, (newUser) => {
  if (newUser) {
    form.value = {
      nome: newUser.nome || '',
      email: newUser.email || '',
      role: newUser.role || '',
      status: newUser.status || 'active',
      empresa: newUser.empresa || '',
      novaSenha: '',
      confirmarSenha: ''
    }
  }
}, { immediate: true })

const avatarInitials = computed(() => {
  if (!form.value.nome) return 'US'
  return form.value.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

const avatarColors = [
  'bg-gradient-to-br from-green-400 to-green-600',
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
  'bg-gradient-to-br from-orange-400 to-orange-600',
  'bg-gradient-to-br from-pink-400 to-pink-600',
  'bg-gradient-to-br from-teal-400 to-teal-600',
]

const avatarColor = computed(() => {
  if (!form.value.nome) return avatarColors[0]
  const index = form.value.nome.charCodeAt(0) % avatarColors.length
  return avatarColors[index]
})
</script>
